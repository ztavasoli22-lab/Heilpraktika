"""
Heilpraktiker Lern-App - Desktop (Tkinter)
"""

# 📌 VERSIONS-INFO
APP_VERSION = "7.0"
APP_DATUM = "2026-07-12"

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import json
import os
import random
import platform
from datetime import datetime
import threading

# ================================================
# 🎨 MODERNE SCHRIFT (systemabhängig, mit Fallback)
# ================================================
_SYS = platform.system()
if _SYS == "Windows":
    FONT = "Segoe UI"
elif _SYS == "Darwin":
    FONT = "Helvetica Neue"
else:
    FONT = "DejaVu Sans"

# Aussprache-Modul (pyttsx3)
try:
    import pyttsx3
    AUSSPRACHE_VERFUEGBAR = True
except ImportError:
    AUSSPRACHE_VERFUEGBAR = False

# ================================================
# KONSTANTEN
# ================================================
# Dateien immer im Ordner der lern_app.py suchen (egal von wo gestartet)
_BASIS = os.path.dirname(os.path.abspath(__file__))
KATALOG_DATEI = os.path.join(_BASIS, "fragenkatalog.json")
STATISTIK_DATEI = os.path.join(_BASIS, "statistik.json")

FARBEN_LIGHT = {
    'primary': '#1B6E2E',
    'primary_hover': '#14561F',
    'secondary': '#8A4B08',
    'richtig': '#15803D',
    'falsch': '#B91C1C',
    'bg': '#C9D6CE',
    'card': '#FFFFFF',
    'card_hover': '#EDF3EF',
    'text': '#0F1A15',
    'text_muted': '#4B5563',
    'border': '#7E9488',
    'badge_bg': '#FFFFFF',
    'header_text': '#FFFFFF',
    'option_bg': '#FFFFFF',
    'option_text': '#0F1A15',
    'fallbeispiel_bg': '#FFF6DF',
    'fallbeispiel_text': '#3A2C10',
    'erklaerung_bg': '#E6F4EA',
    'erklaerung_border': '#7FB894',
    'lz_bg': '#FFF6DF',
    'lz_text': '#3A2C10',
    # 🎴 Vokabelkarte
    'karte_bg': '#FFFFFF',
    'karte_border': '#7E9488',
    'karte_label': '#8A4B08',
    'karte_text': '#0F1A15',
    'karte_muted': '#4B5563',
    'karte_fa': '#0B5F58',
    'header_bg': '#1B5E20',
    'btn_text': '#FFFFFF',
    'erfolg': '#1B6E2E',
    'info': '#0B5FA5',
}

FARBEN_DARK = {
    'primary': '#4ADE80',
    'primary_hover': '#86EFAC',
    'secondary': '#FFC44D',
    'richtig': '#4ADE80',
    'falsch': '#FF8A80',
    'bg': '#0A0D0F',
    'card': '#333B41',
    'card_hover': '#414B52',
    'text': '#F5F7F8',
    'text_muted': '#AEB8BF',
    'border': '#8496A1',
    'badge_bg': '#333B41',
    'header_text': '#FFFFFF',
    'option_bg': '#333B41',
    'option_text': '#F5F7F8',
    'fallbeispiel_bg': '#2E2A1A',
    'fallbeispiel_text': '#FFE3AC',
    'erklaerung_bg': '#18291F',
    'erklaerung_border': '#4A7C5E',
    'lz_bg': '#2E2A1A',
    'lz_text': '#FFE3AC',
    # 🎴 Vokabelkarte
    'karte_bg': '#333B41',
    'karte_border': '#8496A1',
    'karte_label': '#FFC44D',
    'karte_text': '#F5F7F8',
    'karte_muted': '#AEB8BF',
    'karte_fa': '#6EE7DA',
    'header_bg': '#16301F',
    'btn_text': '#06210F',
    'erfolg': '#4ADE80',
    'info': '#8FD0FF',
}

# Header-Farbe (dunkles Grün, funktioniert in beiden Modi)
HEADER_BG_LIGHT = '#2E7D32'
HEADER_BG_DARK = '#1B2E22'


def auto_fg(hexfarbe):
    """Wählt Schwarz oder Weiß - je nachdem, was auf dieser Farbe BESSER lesbar ist.
    Berechnet beide Kontrastwerte (WCAG) und nimmt den höheren."""
    def _lum(h):
        h = h.lstrip('#')
        r, g, b = (int(h[i:i+2], 16) / 255 for i in (0, 2, 4))
        def f(c):
            return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

    def _kontrast(a, b):
        l1, l2 = sorted([_lum(a), _lum(b)], reverse=True)
        return (l1 + 0.05) / (l2 + 0.05)

    DUNKEL, HELL = '#0A0F0C', '#FFFFFF'
    return DUNKEL if _kontrast(DUNKEL, hexfarbe) >= _kontrast(HELL, hexfarbe) else HELL


# Aktive Farben (werden zur Laufzeit gewechselt)
FARBEN = dict(FARBEN_LIGHT)

# ================================================
# AUSSPRACHE-ENGINE
# ================================================
class AusspracheEngine:
    def __init__(self):
        self.engine = None
        self.deutsche_stimme = None
        self.latein_stimme = None  # Italienisch oder Englisch als Fallback
        self.aktuelle_stimme = None  # Welche Stimme ist gerade gesetzt?

        if AUSSPRACHE_VERFUEGBAR:
            try:
                self.engine = pyttsx3.init()
                self.engine.setProperty('rate', 150)

                voices = self.engine.getProperty('voices')

                # Suche deutsche Stimme
                for voice in voices:
                    name_lower = voice.name.lower()
                    id_lower = voice.id.lower()
                    if ('german' in name_lower or 'deutsch' in name_lower
                            or 'de-' in id_lower or '\\de\\' in id_lower
                            or 'hedda' in name_lower or 'stefan' in name_lower
                            or 'katja' in name_lower):
                        self.deutsche_stimme = voice.id
                        break

                # Suche italienische Stimme für Latein (klingt am natürlichsten!)
                # Fallback: spanisch, dann englisch
                praeferenzen = ['italian', 'italiano', 'it-', 'elsa', 'cosimo',
                                'spanish', 'español', 'es-', 'helena',
                                'english', 'en-us', 'en-gb', 'zira', 'david']
                for praef in praeferenzen:
                    for voice in voices:
                        if praef in voice.name.lower() or praef in voice.id.lower():
                            self.latein_stimme = voice.id
                            break
                    if self.latein_stimme:
                        break

                # Falls keine alternative gefunden, nutze deutsche auch für Latein
                if not self.latein_stimme:
                    self.latein_stimme = self.deutsche_stimme

                # Setze deutsche Stimme als Standard
                if self.deutsche_stimme:
                    self.engine.setProperty('voice', self.deutsche_stimme)
                    self.aktuelle_stimme = self.deutsche_stimme

                print(f"🔊 Aussprache initialisiert:")
                print(f"   Deutsch: {self.deutsche_stimme}")
                print(f"   Latein:  {self.latein_stimme}")
            except Exception as e:
                print(f"Aussprache-Engine konnte nicht initialisiert werden: {e}")
                self.engine = None

    def spreche(self, text, sprache='de'):
        """sprache: 'de' für Deutsch, 'lat' für Latein"""
        if not self.engine:
            return False
        # In separatem Thread um GUI nicht zu blockieren
        threading.Thread(target=self._spreche_thread, args=(text, sprache), daemon=True).start()
        return True

    def _spreche_thread(self, text, sprache='de'):
        try:
            # Wähle die richtige Stimme
            if sprache == 'lat' and self.latein_stimme:
                ziel_stimme = self.latein_stimme
                self.engine.setProperty('rate', 130)  # Latein etwas langsamer
            else:
                ziel_stimme = self.deutsche_stimme
                self.engine.setProperty('rate', 150)

            # Stimme nur wechseln, wenn nötig (spart Zeit)
            if ziel_stimme and ziel_stimme != self.aktuelle_stimme:
                self.engine.setProperty('voice', ziel_stimme)
                self.aktuelle_stimme = ziel_stimme

            self.engine.say(text)
            self.engine.runAndWait()
        except Exception as e:
            print(f"Aussprache-Fehler: {e}")


# ================================================
# HAUPT-APP
# ================================================
class LernApp:
    def __init__(self, root):
        self.root = root
        self.root.title(f"🌿 Heilpraktiker Lern-App v{APP_VERSION}")
        self.root.geometry("900x700")

        # Aussprache
        self.aussprache = AusspracheEngine()

        # Daten laden
        self.fragenkatalog = []
        self.vokabeln = []
        self.katalog_version = "?"
        self.katalog_datum = "?"
        self.statistik = {
            "fragen": {}, "vokabeln": {},
            "gesamt_richtig": 0, "gesamt_falsch": 0,
            "vokabeln_gesehen": 0, "vokabeln_gewusst": 0,
            "lerntage": [], "lesezeichen": {},
            "gesehene_fragen": [], "gesehene_vokabeln": [],
            "dark_mode": False
        }

        # Status
        self.aktuelle_fragen = []
        self.aktuelle_vokabeln = []
        self.aktuelle_index = 0
        self.aktueller_modus = ""
        self.runden_richtig = 0
        self.runden_falsch = 0
        self.nutzer_antwort = None
        self.nutzer_antworten = []
        self.karte_umgedreht = False
        self.vokabel_richtung = "lat_to_de"

        self.lade_daten()

        # Dark Mode anwenden
        self.dark_mode = self.statistik.get("dark_mode", False)
        self.wende_dark_mode_an()

        self.zeige_hauptmenue()

    # ================================================
    # 🌙 DARK MODE
    # ================================================
    def wende_dark_mode_an(self):
        """Wendet die aktuelle Dark/Light-Mode-Farbe an"""
        global FARBEN
        if self.dark_mode:
            FARBEN = dict(FARBEN_DARK)
        else:
            FARBEN = dict(FARBEN_LIGHT)
        self.root.configure(bg=FARBEN['bg'])

    def toggle_dark_mode(self):
        """Schaltet zwischen Light und Dark Mode um"""
        self.dark_mode = not self.dark_mode
        self.statistik["dark_mode"] = self.dark_mode
        self.speichere_statistik()
        self.wende_dark_mode_an()
        # Aktuelle Ansicht neu zeichnen
        self.zeige_hauptmenue()

    # ================================================
    # DATEN LADEN/SPEICHERN
    # ================================================
    def lade_daten(self):
        try:
            with open(KATALOG_DATEI, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.fragenkatalog = data.get("fragenkatalog", [])
                self.vokabeln = data.get("vokabeln", [])
                self.katalog_version = data.get("version", "?")
                self.katalog_datum = data.get("erstellt_am", "?")
        except FileNotFoundError:
            messagebox.showerror("Fehler", f"Datei {KATALOG_DATEI} nicht gefunden!")
        except Exception as e:
            messagebox.showerror("Fehler", f"Fehler beim Laden: {e}")

        try:
            if os.path.exists(STATISTIK_DATEI):
                with open(STATISTIK_DATEI, 'r', encoding='utf-8') as f:
                    self.statistik = json.load(f)
                    # Migration für alte Statistiken
                    self.statistik.setdefault("vokabeln", {})
                    self.statistik.setdefault("vokabeln_gesehen", 0)
                    self.statistik.setdefault("vokabeln_gewusst", 0)
                    self.statistik.setdefault("lesezeichen", {})
                    self.statistik.setdefault("gesehene_fragen", [])
                    self.statistik.setdefault("gesehene_vokabeln", [])
                    self.statistik.setdefault("dark_mode", False)
        except Exception as e:
            print(f"Konnte statistik.json nicht laden: {e}")

    def speichere_statistik(self):
        try:
            with open(STATISTIK_DATEI, 'w', encoding='utf-8') as f:
                json.dump(self.statistik, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Fehler beim Speichern: {e}")

    def update_statistik(self, frage_id, richtig):
        if frage_id not in self.statistik["fragen"]:
            self.statistik["fragen"][frage_id] = {"richtig": 0, "falsch": 0, "letztes_datum": None}
        if richtig:
            self.statistik["fragen"][frage_id]["richtig"] += 1
            self.statistik["gesamt_richtig"] += 1
        else:
            self.statistik["fragen"][frage_id]["falsch"] += 1
            self.statistik["gesamt_falsch"] += 1
        self.statistik["fragen"][frage_id]["letztes_datum"] = datetime.now().isoformat()
        if frage_id not in self.statistik["gesehene_fragen"]:
            self.statistik["gesehene_fragen"].append(frage_id)
        heute = datetime.now().date().isoformat()
        if heute not in self.statistik["lerntage"]:
            self.statistik["lerntage"].append(heute)
        self.speichere_statistik()

    def update_vokabel_statistik(self, vok_id, gewusst):
        if vok_id not in self.statistik["vokabeln"]:
            self.statistik["vokabeln"][vok_id] = {"gewusst": 0, "nicht_gewusst": 0, "letztes_datum": None}
        if gewusst:
            self.statistik["vokabeln"][vok_id]["gewusst"] += 1
            self.statistik["vokabeln_gewusst"] += 1
        else:
            self.statistik["vokabeln"][vok_id]["nicht_gewusst"] += 1
        self.statistik["vokabeln_gesehen"] += 1
        self.statistik["vokabeln"][vok_id]["letztes_datum"] = datetime.now().isoformat()
        if vok_id not in self.statistik["gesehene_vokabeln"]:
            self.statistik["gesehene_vokabeln"].append(vok_id)
        heute = datetime.now().date().isoformat()
        if heute not in self.statistik["lerntage"]:
            self.statistik["lerntage"].append(heute)
        self.speichere_statistik()

    # ================================================
    # LESEZEICHEN
    # ================================================
    def speichere_lesezeichen(self, modus_name):
        if not self.aktuelle_fragen:
            return
        verbleibende = [f["id"] for f in self.aktuelle_fragen[self.aktuelle_index:]]
        if 0 < len(verbleibende) < len(self.aktuelle_fragen):
            self.statistik["lesezeichen"][modus_name] = {
                "verbleibende_ids": verbleibende,
                "richtig": self.runden_richtig,
                "falsch": self.runden_falsch,
                "datum": datetime.now().isoformat(),
                "typ": "fragen"
            }
            self.speichere_statistik()

    def speichere_vokabel_lesezeichen(self, modus_name):
        if not self.aktuelle_vokabeln:
            return
        verbleibende = [v["id"] for v in self.aktuelle_vokabeln[self.aktuelle_index:]]
        if 0 < len(verbleibende) < len(self.aktuelle_vokabeln):
            self.statistik["lesezeichen"][modus_name] = {
                "verbleibende_ids": verbleibende,
                "richtig": self.runden_richtig,
                "falsch": self.runden_falsch,
                "vokabel_richtung": self.vokabel_richtung,
                "datum": datetime.now().isoformat(),
                "typ": "vokabeln"
            }
            self.speichere_statistik()

    def hat_lesezeichen(self, modus_name):
        return modus_name in self.statistik.get("lesezeichen", {})

    def fragen_fortsetzen(self, modus_name, callback_neu, callback_fort):
        if self.hat_lesezeichen(modus_name):
            lz = self.statistik["lesezeichen"][modus_name]
            anzahl = len(lz["verbleibende_ids"])
            datum = lz["datum"][:10]
            antwort = messagebox.askyesno(
                "Lesezeichen gefunden",
                f"Du hast in diesem Modus noch {anzahl} offene Aufgaben (zuletzt: {datum}).\n\n"
                "Ja = Weitermachen\nNein = Neu starten"
            )
            if antwort:
                callback_fort(lz)
            else:
                if messagebox.askyesno("Bestätigen", "Wirklich neu starten? Der Fortschritt geht verloren!"):
                    del self.statistik["lesezeichen"][modus_name]
                    self.speichere_statistik()
                    callback_neu()
        else:
            callback_neu()

    # ================================================
    # IMPORT/EXPORT
    # ================================================
    def exportiere_statistik(self):
        export_daten = {
            "version": "1.0",
            "exportiert_am": datetime.now().isoformat(),
            "geraet": "Desktop",
            "statistik": self.statistik
        }

        heute = datetime.now().date().isoformat()
        dateiname = filedialog.asksaveasfilename(
            defaultextension=".json",
            initialfile=f"statistik_{heute}.json",
            filetypes=[("JSON-Datei", "*.json"), ("Alle Dateien", "*.*")],
            title="Statistik exportieren"
        )

        if dateiname:
            try:
                with open(dateiname, 'w', encoding='utf-8') as f:
                    json.dump(export_daten, f, indent=2, ensure_ascii=False)
                messagebox.showinfo(
                    "Export erfolgreich",
                    f"✅ Statistik exportiert!\n\n📁 Datei: {os.path.basename(dateiname)}\n\n"
                    "💡 Sende diese Datei an dein Handy (z.B. per WhatsApp, E-Mail, Cloud) "
                    "und importiere sie dort über den Import-Knopf!"
                )
            except Exception as e:
                messagebox.showerror("Fehler", f"Export fehlgeschlagen:\n{e}")

    def importiere_statistik(self):
        dateiname = filedialog.askopenfilename(
            filetypes=[("JSON-Datei", "*.json"), ("Alle Dateien", "*.*")],
            title="Statistik importieren"
        )

        if not dateiname:
            return

        try:
            with open(dateiname, 'r', encoding='utf-8') as f:
                import_daten = json.load(f)

            if "statistik" not in import_daten:
                messagebox.showerror("Fehler", "❌ Diese Datei ist keine gültige Statistik-Datei!")
                return

            import_stat = import_daten["statistik"]
            export_datum = import_daten.get("exportiert_am", "unbekannt")[:10]
            geraet = import_daten.get("geraet", "unbekannt")

            beantwortet = import_stat.get("gesamt_richtig", 0) + import_stat.get("gesamt_falsch", 0)
            voks = import_stat.get("vokabeln_gesehen", 0)
            tage = len(import_stat.get("lerntage", []))

            meldung = (
                f"📥 IMPORT-VORSCHAU\n\n"
                f"📅 Exportiert: {export_datum}\n"
                f"📱 Von Gerät: {geraet}\n\n"
                f"📝 Beantwortete Fragen: {beantwortet}\n"
                f"📚 Bearbeitete Vokabeln: {voks}\n"
                f"📅 Lerntage: {tage}\n\n"
                f"🔀 SMART MERGE wird die Daten ZUSAMMENFÜHREN (nicht überschreiben).\n\n"
                f"Fortfahren?"
            )

            if messagebox.askyesno("Import bestätigen", meldung):
                self.smart_merge(import_stat)
                messagebox.showinfo("Erfolg", "✅ Import erfolgreich!\n\nDeine Statistik wurde zusammengeführt. 🎉")
                self.zeige_hauptmenue()

        except Exception as e:
            messagebox.showerror("Fehler", f"❌ Fehler beim Lesen der Datei:\n\n{e}")

    def smart_merge(self, import_stat):
        # Fragen
        for fid, daten in import_stat.get("fragen", {}).items():
            if fid not in self.statistik["fragen"]:
                self.statistik["fragen"][fid] = {"richtig": 0, "falsch": 0, "letztes_datum": None}
            self.statistik["fragen"][fid]["richtig"] = max(
                self.statistik["fragen"][fid].get("richtig", 0),
                daten.get("richtig", 0)
            )
            self.statistik["fragen"][fid]["falsch"] = max(
                self.statistik["fragen"][fid].get("falsch", 0),
                daten.get("falsch", 0)
            )
            alt_d = self.statistik["fragen"][fid].get("letztes_datum")
            neu_d = daten.get("letztes_datum")
            if neu_d and (not alt_d or neu_d > alt_d):
                self.statistik["fragen"][fid]["letztes_datum"] = neu_d

        # Vokabeln
        for vid, daten in import_stat.get("vokabeln", {}).items():
            if vid not in self.statistik["vokabeln"]:
                self.statistik["vokabeln"][vid] = {"gewusst": 0, "nicht_gewusst": 0, "letztes_datum": None}
            self.statistik["vokabeln"][vid]["gewusst"] = max(
                self.statistik["vokabeln"][vid].get("gewusst", 0),
                daten.get("gewusst", 0)
            )
            self.statistik["vokabeln"][vid]["nicht_gewusst"] = max(
                self.statistik["vokabeln"][vid].get("nicht_gewusst", 0),
                daten.get("nicht_gewusst", 0)
            )

        # Gesamt-Zähler
        self.statistik["gesamt_richtig"] = max(self.statistik["gesamt_richtig"], import_stat.get("gesamt_richtig", 0))
        self.statistik["gesamt_falsch"] = max(self.statistik["gesamt_falsch"], import_stat.get("gesamt_falsch", 0))
        self.statistik["vokabeln_gesehen"] = max(self.statistik["vokabeln_gesehen"], import_stat.get("vokabeln_gesehen", 0))
        self.statistik["vokabeln_gewusst"] = max(self.statistik["vokabeln_gewusst"], import_stat.get("vokabeln_gewusst", 0))

        # Lerntage
        tage = set(self.statistik["lerntage"])
        tage.update(import_stat.get("lerntage", []))
        self.statistik["lerntage"] = sorted(list(tage))

        # Gesehene
        f_set = set(self.statistik["gesehene_fragen"])
        f_set.update(import_stat.get("gesehene_fragen", []))
        self.statistik["gesehene_fragen"] = list(f_set)

        v_set = set(self.statistik["gesehene_vokabeln"])
        v_set.update(import_stat.get("gesehene_vokabeln", []))
        self.statistik["gesehene_vokabeln"] = list(v_set)

        # Lesezeichen (nehme neueres)
        for mod, lz in import_stat.get("lesezeichen", {}).items():
            alt = self.statistik["lesezeichen"].get(mod)
            if not alt or (lz.get("datum") and lz["datum"] > alt.get("datum", "")):
                self.statistik["lesezeichen"][mod] = lz

        self.speichere_statistik()

    # ================================================
    # UI HELPER
    # ================================================
    def clear_window(self):
        for widget in self.root.winfo_children():
            widget.destroy()

    def create_scrollable_frame(self):
        canvas = tk.Canvas(self.root, bg=FARBEN['bg'], highlightthickness=0)
        scrollbar = ttk.Scrollbar(self.root, orient="vertical", command=canvas.yview)
        scrollable = tk.Frame(canvas, bg=FARBEN['bg'])

        scrollable.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0, 0), window=scrollable, anchor="nw", width=860)
        canvas.configure(yscrollcommand=scrollbar.set)

        canvas.pack(side="left", fill="both", expand=True, padx=10, pady=10)
        scrollbar.pack(side="right", fill="y")

        # Mausrad-Scroll
        def on_mousewheel(event):
            canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")
        canvas.bind_all("<MouseWheel>", on_mousewheel)

        return scrollable

    def modus_button(self, parent, icon, titel, beschr, command, farbe=None):
        if not farbe:
            farbe = FARBEN['primary']
        frame = tk.Frame(parent, bg=FARBEN['card'], relief='flat',
                         highlightthickness=1, highlightbackground=FARBEN['border'], cursor='hand2')
        frame.pack(fill='x', padx=10, pady=4)

        inner = tk.Frame(frame, bg=FARBEN['card'])
        inner.pack(fill='x', padx=14, pady=12)

        tk.Label(inner, text=icon, font=(FONT, 22), bg=FARBEN['card'], fg=FARBEN['text']).pack(side='left', padx=(0, 14))

        text_frame = tk.Frame(inner, bg=FARBEN['card'])
        text_frame.pack(side='left', fill='x', expand=True)
        tk.Label(text_frame, text=titel, font=(FONT, 12, 'bold'), bg=FARBEN['card'], fg=farbe, anchor='w').pack(fill='x')
        tk.Label(text_frame, text=beschr, font=(FONT, 9), bg=FARBEN['card'], fg=FARBEN['text_muted'], anchor='w').pack(fill='x')

        alle = [frame, inner, text_frame] + text_frame.winfo_children() + inner.winfo_children()

        def on_click(e):
            command()

        def on_enter(e):
            frame.configure(highlightbackground=farbe)
            for w in alle:
                if isinstance(w, (tk.Frame, tk.Label)):
                    try:
                        w.configure(bg=FARBEN['card_hover'])
                    except tk.TclError:
                        pass

        def on_leave(e):
            frame.configure(highlightbackground=FARBEN['border'])
            for w in alle:
                if isinstance(w, (tk.Frame, tk.Label)):
                    try:
                        w.configure(bg=FARBEN['card'])
                    except tk.TclError:
                        pass

        for widget in alle:
            widget.bind('<Button-1>', on_click)
            widget.bind('<Enter>', on_enter)
            widget.bind('<Leave>', on_leave)

    def modus_grid(self, parent, eintraege, spalten=2):
        """Zeigt Modus-Kacheln nebeneinander in einem Raster (spart Platz)."""
        grid = tk.Frame(parent, bg=FARBEN['bg'])
        grid.pack(fill='x', padx=6)
        for c in range(spalten):
            grid.columnconfigure(c, weight=1, uniform='modus')
        for idx, eintrag in enumerate(eintraege):
            icon, titel, beschr, command = eintrag[0], eintrag[1], eintrag[2], eintrag[3]
            farbe = eintrag[4] if len(eintrag) > 4 else None
            r, c = divmod(idx, spalten)
            self._modus_kachel(grid, icon, titel, beschr, command, farbe, r, c)

    def _modus_kachel(self, parent, icon, titel, beschr, command, farbe, r, c):
        if not farbe:
            farbe = FARBEN['primary']
        frame = tk.Frame(parent, bg=FARBEN['card'], relief='flat',
                         highlightthickness=1, highlightbackground=FARBEN['border'], cursor='hand2')
        frame.grid(row=r, column=c, sticky='nsew', padx=5, pady=5)

        inner = tk.Frame(frame, bg=FARBEN['card'])
        inner.pack(fill='both', expand=True, padx=14, pady=12)

        tk.Label(inner, text=icon, font=(FONT, 20), bg=FARBEN['card'], fg=FARBEN['text']).pack(side='left', padx=(0, 12))

        text_frame = tk.Frame(inner, bg=FARBEN['card'])
        text_frame.pack(side='left', fill='both', expand=True)
        tk.Label(text_frame, text=titel, font=(FONT, 11, 'bold'), bg=FARBEN['card'], fg=farbe,
                 anchor='w', justify='left', wraplength=300).pack(fill='x')
        tk.Label(text_frame, text=beschr, font=(FONT, 8), bg=FARBEN['card'], fg=FARBEN['text_muted'],
                 anchor='w', justify='left', wraplength=300).pack(fill='x')

        alle = [frame, inner, text_frame] + text_frame.winfo_children() + inner.winfo_children()

        def on_click(e):
            command()

        def on_enter(e):
            frame.configure(highlightbackground=farbe)
            for w in alle:
                if isinstance(w, (tk.Frame, tk.Label)):
                    try:
                        w.configure(bg=FARBEN['card_hover'])
                    except tk.TclError:
                        pass

        def on_leave(e):
            frame.configure(highlightbackground=FARBEN['border'])
            for w in alle:
                if isinstance(w, (tk.Frame, tk.Label)):
                    try:
                        w.configure(bg=FARBEN['card'])
                    except tk.TclError:
                        pass

        for widget in alle:
            widget.bind('<Button-1>', on_click)
            widget.bind('<Enter>', on_enter)
            widget.bind('<Leave>', on_leave)

    def toggle_lesezeichen(self):
        self.lz_offen = not getattr(self, 'lz_offen', False)
        self.zeige_hauptmenue()

    def lesezeichen_aufraeumen(self):
        anzahl = len(self.statistik.get("lesezeichen", {}))
        if anzahl == 0:
            return
        if messagebox.askyesno("Angefangene Modi aufräumen",
                               f"Alle {anzahl} angefangenen Modi löschen?\n\n"
                               "✅ Dein Lernfortschritt (richtig/falsch, Statistik) bleibt erhalten!\n"
                               "❌ Nur die Merkpunkte 'wo du stehen geblieben bist' werden entfernt."):
            self.statistik["lesezeichen"] = {}
            self.speichere_statistik()
            self.zeige_hauptmenue()

    # ================================================
    # HAUPTMENÜ
    # ================================================
    def zeige_hauptmenue(self):
        self.clear_window()
        scroll = self.create_scrollable_frame()

        # Header mit Dark-Mode-Toggle
        header = tk.Frame(scroll, bg=FARBEN['header_bg'])
        header.pack(fill='x', pady=(0, 12))

        # Toggle-Button oben rechts
        toggle_icon = "☀️" if self.dark_mode else "🌙"
        toggle_text = "Hell" if self.dark_mode else "Dunkel"
        tk.Button(header, text=f"{toggle_icon} {toggle_text}",
                  command=self.toggle_dark_mode,
                  bg='white' if not self.dark_mode else FARBEN['secondary'],
                  fg=FARBEN['primary'] if not self.dark_mode else 'black',
                  font=(FONT, 10, 'bold'),
                  relief='flat', padx=12, pady=4,
                  cursor='hand2').place(relx=0.98, rely=0.5, anchor='e')

        tk.Label(header, text="🌿  HP Lern-App", font=(FONT, 26, 'bold'),
                 bg=FARBEN['header_bg'], fg='white').pack(pady=12)
        tk.Label(header, text="Heilpraktiker-Prüfung Vorbereitung",
                 font=(FONT, 10), bg=FARBEN['header_bg'], fg='#C8E6C9').pack(pady=(0, 12))

        # Statistik-Badges
        gesamt = self.statistik["gesamt_richtig"] + self.statistik["gesamt_falsch"]
        quote = int((self.statistik["gesamt_richtig"] / gesamt) * 100) if gesamt > 0 else 0

        badge_frame = tk.Frame(scroll, bg=FARBEN['bg'])
        badge_frame.pack(fill='x', padx=6, pady=8)
        for label, value in [("Fragen", len(self.fragenkatalog)), ("Vokabeln", len(self.vokabeln)),
                             ("Quote", f"{quote}%"), ("Tage", len(self.statistik["lerntage"]))]:
            badge = tk.Frame(badge_frame, bg=FARBEN['badge_bg'], relief='flat',
                             highlightthickness=1, highlightbackground=FARBEN['border'])
            badge.pack(side='left', expand=True, fill='x', padx=5)
            tk.Label(badge, text=str(value), font=(FONT, 18, 'bold'),
                     bg=FARBEN['badge_bg'], fg=FARBEN['primary']).pack(pady=(10, 0))
            tk.Label(badge, text=label.upper(), font=(FONT, 8),
                     bg=FARBEN['badge_bg'], fg=FARBEN['text_muted']).pack(pady=(0, 10))

        # 🔖 Lesezeichen-Übersicht (einklappbar)
        lz_keys = list(self.statistik.get("lesezeichen", {}).keys())
        if lz_keys:
            offen = getattr(self, 'lz_offen', False)
            kopf = tk.Frame(scroll, bg=FARBEN['bg'])
            kopf.pack(fill='x', pady=(12, 4))

            pfeil = "▼" if offen else "▶"
            tk.Button(kopf, text=f"{pfeil}  🔖 ANGEFANGENE MODI ({len(lz_keys)})",
                      command=self.toggle_lesezeichen,
                      font=(FONT, 11, 'bold'), bg=FARBEN['bg'], fg=FARBEN['text'],
                      relief='flat', cursor='hand2', anchor='w', padx=0).pack(side='left')

            tk.Button(kopf, text="🗑️ Aufräumen", command=self.lesezeichen_aufraeumen,
                      font=(FONT, 9), bg=FARBEN['card'], fg=FARBEN['text_muted'],
                      relief='flat', highlightthickness=1, highlightbackground=FARBEN['border'], cursor='hand2',
                      padx=10, pady=2).pack(side='right', padx=10)

            if offen:
                lz_grid = tk.Frame(scroll, bg=FARBEN['bg'])
                lz_grid.pack(fill='x', padx=6)
                for c in range(2):
                    lz_grid.columnconfigure(c, weight=1, uniform='lz')
                for idx, mod in enumerate(lz_keys):
                    anz = len(self.statistik["lesezeichen"][mod]["verbleibende_ids"])
                    r, c = divmod(idx, 2)
                    lz_frame = tk.Frame(lz_grid, bg=FARBEN['lz_bg'], relief='flat', highlightthickness=1, highlightbackground=FARBEN['border'])
                    lz_frame.grid(row=r, column=c, sticky='nsew', padx=4, pady=2)
                    tk.Label(lz_frame, text=f"📌 {mod}: {anz} offen", font=(FONT, 9),
                             bg=FARBEN['lz_bg'], fg=FARBEN['lz_text'], anchor='w',
                             justify='left', wraplength=300).pack(anchor='w', padx=10, pady=6)

        # PRÜFUNGSFRAGEN
        tk.Label(scroll, text="📝 PRÜFUNGSFRAGEN", font=(FONT, 10, 'bold'),
                 bg=FARBEN['bg'], fg=FARBEN['text_muted']).pack(anchor='w', padx=10, pady=(20, 6))
        self.modus_grid(scroll, [
            ("🎲", "Zufallsmodus", "Alle Fragen zufällig", self.starte_zufall),
            ("📂", "Themen-Modus", "Nach Thema lernen", self.zeige_themenauswahl),
            ("🆕", "Neue Fragen", "Nur unbearbeitete", self.starte_neue_fragen),
            ("❌", "Fehler-Wiederholung", "Falsch beantwortete", self.starte_fehler),
            ("⏱️", "Prüfungssimulation", "60 Fragen wie echte Prüfung", self.starte_pruefung),
            ("🔥", "Crashkurs", "Nur hochrelevante", self.starte_crashkurs),
        ])

        # VOKABELN
        tk.Label(scroll, text="📚 VOKABELTRAINER", font=(FONT, 10, 'bold'),
                 bg=FARBEN['bg'], fg=FARBEN['text_muted']).pack(anchor='w', padx=10, pady=(20, 6))
        s = FARBEN['secondary']
        self.modus_grid(scroll, [
            ("🎴", "Alle Vokabeln", "Karteikarten mischen", self.starte_vok_alle, s),
            ("🆕", "Neue Vokabeln", "Nur unbearbeitete", self.starte_neue_vokabeln, s),
            ("🏷️", "Nach Kategorie", "Anatomie, Hormone, etc.", self.zeige_vok_kategorien, s),
            ("💪", "Schwierige Vokabeln", "Nicht gewusste wiederholen", self.starte_vok_schwer, s),
            ("🔄", "Deutsch → Latein", "Andere Richtung üben", self.starte_vok_de_lat, s),
            ("📄", "Vokabeln als PDF", "Kategorie wählen & exportieren", self.zeige_pdf_export, FARBEN['info']),
        ])

        # SYNC
        tk.Label(scroll, text="☁️ STATISTIK SYNCHRONISIEREN", font=(FONT, 10, 'bold'),
                 bg=FARBEN['bg'], fg=FARBEN['text_muted']).pack(anchor='w', padx=10, pady=(20, 6))
        self.modus_grid(scroll, [
            ("📤", "Statistik exportieren", "Als Datei für anderes Gerät", self.exportiere_statistik, FARBEN['erfolg']),
            ("📥", "Statistik importieren", "Von anderem Gerät einfügen", self.importiere_statistik, FARBEN['info']),
        ])

        # STATISTIK
        tk.Label(scroll, text="📊 ÜBERSICHT", font=(FONT, 10, 'bold'),
                 bg=FARBEN['bg'], fg=FARBEN['text_muted']).pack(anchor='w', padx=10, pady=(20, 6))
        self.modus_grid(scroll, [
            ("📊", "Statistik", "Lernfortschritt anzeigen", self.zeige_statistik),
        ])

        # Info über Aussprache
        if AUSSPRACHE_VERFUEGBAR:
            tk.Label(scroll, text="🔊 Aussprache-Funktion verfügbar (Klick auf Lautsprecher bei Vokabeln)",
                     font=(FONT, 9, 'italic'), bg=FARBEN['bg'], fg=FARBEN['text_muted']).pack(anchor='w', pady=(16, 4))
        else:
            tk.Label(scroll, text="⚠️ Aussprache nicht verfügbar - installiere mit: pip install pyttsx3",
                     font=(FONT, 9, 'italic'), bg=FARBEN['bg'], fg=FARBEN['text_muted']).pack(anchor='w', padx=10, pady=(16, 4))

        # 📌 VERSIONS-INFO ganz unten
        versions_frame = tk.Frame(scroll, bg=FARBEN['card'], relief='flat', highlightthickness=1, highlightbackground=FARBEN['border'])
        versions_frame.pack(fill='x', padx=10, pady=(20, 10), ipady=8)
        tk.Label(versions_frame,
                 text=f"📱 App-Version: v{APP_VERSION}",
                 font=(FONT, 10, 'bold'),
                 bg=FARBEN['card'], fg=FARBEN['primary']).pack(pady=(4, 0))
        tk.Label(versions_frame,
                 text=f"📚 Fragenkatalog: v{self.katalog_version}  ({len(self.fragenkatalog)} Fragen · {len(self.vokabeln)} Vokabeln)",
                 font=(FONT, 9),
                 bg=FARBEN['card'], fg=FARBEN['text']).pack()
        tk.Label(versions_frame,
                 text=f"Stand: {APP_DATUM}  ·  Katalog: {self.katalog_datum}",
                 font=(FONT, 8, 'italic'),
                 bg=FARBEN['card'], fg=FARBEN['text_muted']).pack(pady=(0, 4))

    # ================================================
    # FRAGEN-MODI
    # ================================================
    def starte_zufall(self):
        def neu():
            self.aktuelle_fragen = random.sample(self.fragenkatalog, len(self.fragenkatalog))
            self.aktuelle_index = 0
            self.aktueller_modus = "Zufallsmodus"
            self.runden_richtig = 0; self.runden_falsch = 0
            self.zeige_frage()
        def fort(lz):
            ids = lz["verbleibende_ids"]
            self.aktuelle_fragen = [f for f in self.fragenkatalog if f["id"] in ids]
            self.aktuelle_fragen.sort(key=lambda f: ids.index(f["id"]))
            self.aktuelle_index = 0
            self.aktueller_modus = "Zufallsmodus"
            self.runden_richtig = lz.get("richtig", 0)
            self.runden_falsch = lz.get("falsch", 0)
            self.zeige_frage()
        self.fragen_fortsetzen("Zufallsmodus", neu, fort)

    def zeige_themenauswahl(self):
        themen = {}
        for f in self.fragenkatalog:
            t = f.get("thema", "Unbekannt")
            themen[t] = themen.get(t, 0) + 1

        self.clear_window()
        scroll = self.create_scrollable_frame()
        tk.Button(scroll, text="← Zurück", command=self.zeige_hauptmenue,
                  bg=FARBEN['primary'], fg=auto_fg(FARBEN['primary']), font=(FONT, 10, 'bold')).pack(anchor='w', pady=8)
        tk.Label(scroll, text="📂 Thema wählen", font=(FONT, 16, 'bold'),
                 bg=FARBEN['bg'], fg=FARBEN['text']).pack(pady=12)
        for thema, anzahl in sorted(themen.items()):
            t = thema
            self.modus_button(scroll, "📖", f"{t}", f"{anzahl} Fragen",
                              lambda x=t: self.starte_thema(x))

    def starte_thema(self, thema):
        modus_name = f"Thema: {thema}"
        def neu():
            self.aktuelle_fragen = [f for f in self.fragenkatalog if f.get("thema") == thema]
            random.shuffle(self.aktuelle_fragen)
            self.aktuelle_index = 0
            self.aktueller_modus = modus_name
            self.runden_richtig = 0; self.runden_falsch = 0
            self.zeige_frage()
        def fort(lz):
            ids = lz["verbleibende_ids"]
            self.aktuelle_fragen = [f for f in self.fragenkatalog if f["id"] in ids]
            self.aktuelle_fragen.sort(key=lambda f: ids.index(f["id"]))
            self.aktuelle_index = 0
            self.aktueller_modus = modus_name
            self.runden_richtig = lz.get("richtig", 0)
            self.runden_falsch = lz.get("falsch", 0)
            self.zeige_frage()
        self.fragen_fortsetzen(modus_name, neu, fort)

    def starte_neue_fragen(self):
        gesehen = set(self.statistik.get("gesehene_fragen", []))
        neue = [f for f in self.fragenkatalog if f["id"] not in gesehen]
        if not neue:
            messagebox.showinfo("Info", "🎉 Glückwunsch! Du hast bereits alle Fragen beantwortet!")
            return
        random.shuffle(neue)
        self.aktuelle_fragen = neue
        self.aktuelle_index = 0
        self.aktueller_modus = f"🆕 Neue Fragen ({len(neue)})"
        self.runden_richtig = 0; self.runden_falsch = 0
        self.zeige_frage()

    def starte_fehler(self):
        fehler_ids = [fid for fid, s in self.statistik["fragen"].items() if s["falsch"] > s["richtig"]]
        if not fehler_ids:
            messagebox.showinfo("Info", "Noch keine falsch beantworteten Fragen!")
            return
        self.aktuelle_fragen = [f for f in self.fragenkatalog if f["id"] in fehler_ids]
        random.shuffle(self.aktuelle_fragen)
        self.aktuelle_index = 0
        self.aktueller_modus = "Fehler-Wiederholung"
        self.runden_richtig = 0; self.runden_falsch = 0
        self.zeige_frage()

    def starte_pruefung(self):
        if len(self.fragenkatalog) < 10:
            messagebox.showwarning("Warnung", f"Zu wenig Fragen! Du hast {len(self.fragenkatalog)}.")
            return
        anzahl = min(60, len(self.fragenkatalog))
        self.aktuelle_fragen = random.sample(self.fragenkatalog, anzahl)
        self.aktuelle_index = 0
        self.aktueller_modus = "Prüfungssimulation"
        self.runden_richtig = 0; self.runden_falsch = 0
        self.zeige_frage()

    def starte_crashkurs(self):
        def neu():
            relevante = [f for f in self.fragenkatalog if f.get("pruefungsrelevanz") == "hoch"]
            if not relevante:
                messagebox.showinfo("Info", "Keine hochrelevanten Fragen markiert!")
                return
            random.shuffle(relevante)
            self.aktuelle_fragen = relevante
            self.aktuelle_index = 0
            self.aktueller_modus = "🔥 Crashkurs"
            self.runden_richtig = 0; self.runden_falsch = 0
            self.zeige_frage()
        def fort(lz):
            ids = lz["verbleibende_ids"]
            self.aktuelle_fragen = [f for f in self.fragenkatalog if f["id"] in ids]
            self.aktuelle_fragen.sort(key=lambda f: ids.index(f["id"]))
            self.aktuelle_index = 0
            self.aktueller_modus = "🔥 Crashkurs"
            self.runden_richtig = lz.get("richtig", 0)
            self.runden_falsch = lz.get("falsch", 0)
            self.zeige_frage()
        self.fragen_fortsetzen("🔥 Crashkurs", neu, fort)

    # ================================================
    # VOKABEL-MODI
    # ================================================
    def starte_vok_alle(self):
        if not self.vokabeln:
            messagebox.showinfo("Info", "Noch keine Vokabeln vorhanden!")
            return
        def neu():
            self.aktuelle_vokabeln = random.sample(self.vokabeln, len(self.vokabeln))
            self.aktuelle_index = 0
            self.aktueller_modus = "Alle Vokabeln"
            self.vokabel_richtung = "lat_to_de"
            self.runden_richtig = 0; self.runden_falsch = 0
            self.karte_umgedreht = False
            self.zeige_vokabel_karte()
        def fort(lz):
            ids = lz["verbleibende_ids"]
            self.aktuelle_vokabeln = [v for v in self.vokabeln if v["id"] in ids]
            self.aktuelle_vokabeln.sort(key=lambda v: ids.index(v["id"]))
            self.aktuelle_index = 0
            self.aktueller_modus = "Alle Vokabeln"
            self.vokabel_richtung = lz.get("vokabel_richtung", "lat_to_de")
            self.runden_richtig = lz.get("richtig", 0)
            self.runden_falsch = lz.get("falsch", 0)
            self.karte_umgedreht = False
            self.zeige_vokabel_karte()
        self.fragen_fortsetzen("Alle Vokabeln", neu, fort)

    def starte_vok_de_lat(self):
        if not self.vokabeln:
            messagebox.showinfo("Info", "Noch keine Vokabeln vorhanden!")
            return
        def neu():
            self.aktuelle_vokabeln = random.sample(self.vokabeln, len(self.vokabeln))
            self.aktuelle_index = 0
            self.aktueller_modus = "Deutsch → Latein"
            self.vokabel_richtung = "de_to_lat"
            self.runden_richtig = 0; self.runden_falsch = 0
            self.karte_umgedreht = False
            self.zeige_vokabel_karte()
        def fort(lz):
            ids = lz["verbleibende_ids"]
            self.aktuelle_vokabeln = [v for v in self.vokabeln if v["id"] in ids]
            self.aktuelle_vokabeln.sort(key=lambda v: ids.index(v["id"]))
            self.aktuelle_index = 0
            self.aktueller_modus = "Deutsch → Latein"
            self.vokabel_richtung = "de_to_lat"
            self.runden_richtig = lz.get("richtig", 0)
            self.runden_falsch = lz.get("falsch", 0)
            self.karte_umgedreht = False
            self.zeige_vokabel_karte()
        self.fragen_fortsetzen("Deutsch → Latein", neu, fort)

    def starte_vok_schwer(self):
        schwer_ids = [vid for vid, s in self.statistik.get("vokabeln", {}).items()
                      if s.get("nicht_gewusst", 0) > s.get("gewusst", 0)]
        if not schwer_ids:
            messagebox.showinfo("Info", "Noch keine schwierigen Vokabeln markiert!\nÜbe erst ein paar Vokabeln.")
            return
        schwere = [v for v in self.vokabeln if v["id"] in schwer_ids]
        random.shuffle(schwere)
        self.aktuelle_vokabeln = schwere
        self.aktuelle_index = 0
        self.aktueller_modus = "💪 Schwierige Vokabeln"
        self.vokabel_richtung = "lat_to_de"
        self.runden_richtig = 0; self.runden_falsch = 0
        self.karte_umgedreht = False
        self.zeige_vokabel_karte()

    def starte_neue_vokabeln(self):
        gesehen = set(self.statistik.get("gesehene_vokabeln", []))
        neue = [v for v in self.vokabeln if v["id"] not in gesehen]
        if not neue:
            messagebox.showinfo("Info", "🎉 Glückwunsch! Du hast bereits alle Vokabeln bearbeitet!")
            return
        random.shuffle(neue)
        self.aktuelle_vokabeln = neue
        self.aktuelle_index = 0
        self.aktueller_modus = f"🆕 Neue Vokabeln ({len(neue)})"
        self.vokabel_richtung = "lat_to_de"
        self.runden_richtig = 0; self.runden_falsch = 0
        self.karte_umgedreht = False
        self.zeige_vokabel_karte()

    def zeige_pdf_export(self):
        """Bildschirm: Kategorie wählen und Vokabeln als PDF-Tabelle exportieren."""
        # Kategorien mit Anzahl sammeln
        kategorien = {}
        for v in self.vokabeln:
            k = v.get("kategorie", "Sonstige")
            kategorien[k] = kategorien.get(k, 0) + 1

        self.clear_window()
        scroll = self.create_scrollable_frame()
        tk.Button(scroll, text="← Zurück", command=self.zeige_hauptmenue,
                  bg=FARBEN['primary'], fg=auto_fg(FARBEN['primary']), font=(FONT, 10, 'bold')).pack(anchor='w', pady=8)
        tk.Label(scroll, text="📄 Vokabeln als PDF exportieren", font=(FONT, 16, 'bold'),
                 bg=FARBEN['bg'], fg=FARBEN['text']).pack(pady=(12, 4))
        tk.Label(scroll, text="Kategorie wählen – die PDF-Tabelle enthält Lateinisch, Deutsch und Persisch (فارسی).",
                 font=(FONT, 10), bg=FARBEN['bg'], fg=FARBEN['text_muted'], wraplength=560).pack(pady=(0, 14))

        # Auswahl-Dropdown
        auswahl_frame = tk.Frame(scroll, bg=FARBEN['bg'])
        auswahl_frame.pack(pady=6)
        tk.Label(auswahl_frame, text="Kategorie:", font=(FONT, 11, 'bold'),
                 bg=FARBEN['bg'], fg=FARBEN['text']).pack(side='left', padx=(0, 8))

        werte = [f"Alle Kategorien ({len(self.vokabeln)})"]
        for kat in sorted(kategorien.keys()):
            werte.append(f"{kat} ({kategorien[kat]})")
        self.pdf_kategorie_var = tk.StringVar(value=werte[0])
        combo = ttk.Combobox(auswahl_frame, textvariable=self.pdf_kategorie_var,
                             values=werte, state="readonly", width=34, font=(FONT, 11))
        combo.pack(side='left')

        # Export-Button
        btn = tk.Button(scroll, text="📄  Als PDF exportieren", command=self.exportiere_vokabeln_pdf,
                        bg=FARBEN['erfolg'], fg=auto_fg(FARBEN['erfolg']),
                        font=(FONT, 12, 'bold'), relief='flat', padx=20, pady=10,
                        highlightthickness=0, cursor='hand2')
        btn.pack(pady=20)

        tk.Label(scroll, text="💡 Tipp: Die PDF-Tabelle eignet sich gut zum Ausdrucken und Offline-Lernen.",
                 font=(FONT, 9), bg=FARBEN['bg'], fg=FARBEN['text_muted'], wraplength=560).pack(pady=(0, 10))

    def _finde_persisch_font(self):
        """Sucht eine Persisch-fähige TTF-Schrift neben der App oder im fonts-Ordner."""
        kandidaten = [
            os.path.join(_BASIS, "Vazirmatn-Regular.ttf"),
            os.path.join(_BASIS, "fonts", "Vazirmatn-Regular.ttf"),
            os.path.join(_BASIS, "Vazir-Regular.ttf"),
            os.path.join(_BASIS, "fonts", "Vazir-Regular.ttf"),
        ]
        for pfad in kandidaten:
            if os.path.exists(pfad):
                return pfad
        return None

    def exportiere_vokabeln_pdf(self):
        """Erstellt die PDF-Tabelle für die gewählte Kategorie."""
        # 1) Benötigte Bibliotheken prüfen
        try:
            from fpdf import FPDF
            import arabic_reshaper
            from bidi.algorithm import get_display
        except ImportError:
            messagebox.showerror(
                "Bibliotheken fehlen",
                "Für den PDF-Export werden drei Zusatz-Pakete benötigt.\n\n"
                "Bitte einmalig im Terminal installieren:\n\n"
                "pip install fpdf2 arabic-reshaper python-bidi\n\n"
                "Danach die App neu starten."
            )
            return

        # 2) Persisch-Font prüfen
        font_pfad = self._finde_persisch_font()
        if not font_pfad:
            messagebox.showerror(
                "Schriftart fehlt",
                "Für die persische Schrift wird die Datei 'Vazirmatn-Regular.ttf' benötigt.\n\n"
                "Bitte die Datei in denselben Ordner wie die App legen (oder in einen Unterordner 'fonts').\n\n"
                "Kostenlos erhältlich unter:\n"
                "github.com/rastikerdar/vazirmatn"
            )
            return

        # 3) Vokabeln nach gewählter Kategorie filtern
        auswahl = self.pdf_kategorie_var.get()
        if auswahl.startswith("Alle Kategorien"):
            vokabeln = list(self.vokabeln)
            titel_kat = "Alle Kategorien"
        else:
            titel_kat = auswahl.rsplit(" (", 1)[0]
            vokabeln = [v for v in self.vokabeln if v.get("kategorie", "Sonstige") == titel_kat]

        if not vokabeln:
            messagebox.showinfo("Keine Vokabeln", "Für diese Kategorie gibt es keine Vokabeln.")
            return

        # Alphabetisch nach Lateinisch sortieren
        vokabeln.sort(key=lambda v: v.get("lateinisch", "").lower())

        # 4) Speicherort wählen
        standard_name = f"Vokabeln_{titel_kat.replace(' ', '_').replace('/', '-')}.pdf"
        dateiname = filedialog.asksaveasfilename(
            defaultextension=".pdf",
            initialfile=standard_name,
            filetypes=[("PDF-Datei", "*.pdf")],
            title="PDF speichern unter ..."
        )
        if not dateiname:
            return

        # 5) PDF bauen
        # Zeichen, die Vazirmatn nicht kennt → lesbare Ersetzungen
        _ersatz = {
            "→": "->", "←": "<-", "↑": "(hoch)", "↓": "(runter)",
            "⁺": "+", "⁻": "-", "α": "alpha", "β": "beta", "≥": ">=", "≤": "<=",
        }
        def clean(text):
            if not text:
                return ""
            t = str(text)
            for k, val in _ersatz.items():
                t = t.replace(k, val)
            return t

        def fa(text):
            if not text:
                return ""
            return get_display(arabic_reshaper.reshape(clean(text)))

        try:
            pdf = FPDF(orientation="L", format="A4")
            pdf.set_auto_page_break(auto=True, margin=15)
            pdf.add_page()
            pdf.add_font("Vazir", "", font_pfad)
            bold_pfad = font_pfad.replace("Regular", "Bold")
            if os.path.exists(bold_pfad):
                pdf.add_font("Vazir", "B", bold_pfad)
            else:
                pdf.add_font("Vazir", "B", font_pfad)

            # Titel
            pdf.set_font("Vazir", "B", 16)
            pdf.cell(0, 10, f"Vokabeln – {titel_kat}", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("Vazir", "", 10)
            pdf.set_text_color(120, 120, 120)
            pdf.cell(0, 7, f"{len(vokabeln)} Vokabeln  ·  Heilpraktiker-Lern-App  ·  {datetime.now().strftime('%d.%m.%Y')}",
                     new_x="LMARGIN", new_y="NEXT")
            pdf.set_text_color(0, 0, 0)
            pdf.ln(3)

            # Spaltenbreiten (Querformat A4 = 297mm, minus Ränder ~277mm nutzbar)
            b_lat, b_de, b_fa = 75, 110, 92

            def kopfzeile():
                pdf.set_font("Vazir", "B", 11)
                pdf.set_fill_color(200, 30, 45)
                pdf.set_text_color(255, 255, 255)
                pdf.cell(b_lat, 9, " Lateinisch", border=1, fill=True)
                pdf.cell(b_de, 9, " Deutsch", border=1, fill=True)
                pdf.cell(b_fa, 9, fa("فارسی") + " ", border=1, fill=True, align="R")
                pdf.ln()
                pdf.set_text_color(0, 0, 0)

            kopfzeile()
            pdf.set_font("Vazir", "", 10)
            zh = 6  # Höhe einer Textzeile
            hell = True
            for v in vokabeln:
                lat = clean(v.get("lateinisch", ""))
                de = clean(v.get("deutsch", ""))
                fa_txt = v.get("deutsch_fa", "")

                # Zeilenzahl je Spalte abschätzen → höchste bestimmt die Zeilenhöhe
                zeilen = max(
                    self._n_zeilen(pdf, lat, b_lat),
                    self._n_zeilen(pdf, de, b_de),
                    self._n_zeilen(pdf, fa_txt, b_fa),
                )
                h = zeilen * zh

                # Seitenumbruch mit neuer Kopfzeile
                if pdf.get_y() + h > pdf.h - 15:
                    pdf.add_page()
                    kopfzeile()
                    pdf.set_font("Vazir", "", 10)

                # Zebra-Hintergrund
                pdf.set_fill_color(248, 240, 241) if hell else pdf.set_fill_color(255, 255, 255)
                hell = not hell

                x0, y0 = pdf.get_x(), pdf.get_y()
                # Zuerst die drei Rahmen-Rechtecke mit voller Zeilenhöhe zeichnen
                pdf.rect(x0, y0, b_lat, h, style="DF")
                pdf.rect(x0 + b_lat, y0, b_de, h, style="DF")
                pdf.rect(x0 + b_lat + b_de, y0, b_fa, h, style="DF")

                # Dann den Text hineinschreiben (ohne eigenen Rahmen)
                pdf.set_xy(x0, y0)
                pdf.multi_cell(b_lat, zh, lat, border=0, align="L",
                               new_x="RIGHT", new_y="TOP", max_line_height=zh)
                pdf.set_xy(x0 + b_lat, y0)
                pdf.multi_cell(b_de, zh, de, border=0, align="L",
                               new_x="RIGHT", new_y="TOP", max_line_height=zh)
                pdf.set_xy(x0 + b_lat + b_de, y0)
                pdf.multi_cell(b_fa, zh, fa(fa_txt), border=0, align="R",
                               new_x="LMARGIN", new_y="TOP", max_line_height=zh)

                # Cursor auf nächste Zeile setzen
                pdf.set_xy(x0, y0 + h)

            pdf.output(dateiname)
        except Exception as e:
            messagebox.showerror("Fehler beim PDF-Export", f"Es ist ein Fehler aufgetreten:\n\n{e}")
            return

        messagebox.showinfo(
            "PDF erstellt ✅",
            f"Die PDF wurde erfolgreich erstellt!\n\n"
            f"📄 {len(vokabeln)} Vokabeln aus '{titel_kat}'\n"
            f"📁 {os.path.basename(dateiname)}"
        )

    def _n_zeilen(self, pdf, text, breite):
        """Schätzt, wie viele Zeilen ein Text in einer Zelle braucht."""
        if not text:
            return 1
        try:
            nutzbar = breite - 2
            wort_breite = pdf.get_string_width(str(text))
            return max(1, int(wort_breite / nutzbar) + 1)
        except Exception:
            return 1

    def zeige_vok_kategorien(self):
        kategorien = {}
        for v in self.vokabeln:
            k = v.get("kategorie", "Sonstige")
            kategorien[k] = kategorien.get(k, 0) + 1

        self.clear_window()
        scroll = self.create_scrollable_frame()
        tk.Button(scroll, text="← Zurück", command=self.zeige_hauptmenue,
                  bg=FARBEN['primary'], fg=auto_fg(FARBEN['primary']), font=(FONT, 10, 'bold')).pack(anchor='w', pady=8)
        tk.Label(scroll, text="🏷️ Vokabel-Kategorie", font=(FONT, 16, 'bold'),
                 bg=FARBEN['bg'], fg=FARBEN['text']).pack(pady=12)
        for kat, anzahl in sorted(kategorien.items()):
            k = kat
            self.modus_button(scroll, "📚", f"{k}", f"{anzahl} Vokabeln",
                              lambda x=k: self.starte_vok_kategorie(x), FARBEN['secondary'])

    def starte_vok_kategorie(self, kategorie):
        gefiltert = [v for v in self.vokabeln if v.get("kategorie") == kategorie]
        random.shuffle(gefiltert)
        self.aktuelle_vokabeln = gefiltert
        self.aktuelle_index = 0
        self.aktueller_modus = f"🏷️ {kategorie}"
        self.vokabel_richtung = "lat_to_de"
        self.runden_richtig = 0; self.runden_falsch = 0
        self.karte_umgedreht = False
        self.zeige_vokabel_karte()

    # ================================================
    # VOKABEL-KARTEIKARTE MIT AUSSPRACHE
    # ================================================
    def zeige_vokabel_karte(self):
        if self.aktuelle_index >= len(self.aktuelle_vokabeln):
            if self.aktueller_modus in self.statistik.get("lesezeichen", {}):
                del self.statistik["lesezeichen"][self.aktueller_modus]
                self.speichere_statistik()
            self.zeige_vokabel_ergebnis()
            return

        vokabel = self.aktuelle_vokabeln[self.aktuelle_index]
        self.clear_window()
        scroll = self.create_scrollable_frame()

        # Top-Bar
        top = tk.Frame(scroll, bg=FARBEN['bg'])
        top.pack(fill='x', pady=4)
        tk.Button(top, text="🏠 Hauptmenü (speichern)", command=self.vokabel_zurueck,
                  bg=FARBEN['primary'], fg=auto_fg(FARBEN['primary']), font=(FONT, 10, 'bold')).pack(side='left')
        tk.Label(top, text=f"{self.aktuelle_index + 1} / {len(self.aktuelle_vokabeln)}",
                 font=(FONT, 11, 'bold'), bg=FARBEN['bg'], fg=FARBEN['text']).pack(side='right')

        tk.Label(scroll, text=f"📚 {self.aktueller_modus}", font=(FONT, 11),
                 bg=FARBEN['bg'], fg=FARBEN['text']).pack(pady=4)

        # Meta
        meta_frame = tk.Frame(scroll, bg=FARBEN['bg'])
        meta_frame.pack(pady=4)
        for text in [f"🏷️ {vokabel.get('kategorie','')}", f"📊 {vokabel.get('schwierigkeit','').upper()}",
                     f"📖 Seite {vokabel.get('seite','?')}"]:
            tk.Label(meta_frame, text=text, font=(FONT, 9), bg=FARBEN['card'],
                     fg=FARBEN['text'], padx=8, pady=4, relief='flat', highlightthickness=1, highlightbackground=FARBEN['border']).pack(side='left', padx=2)

        # Karteikarte
        vorderseite = vokabel["lateinisch"] if self.vokabel_richtung == "lat_to_de" else vokabel["deutsch"]
        rueckseite = vokabel["deutsch"] if self.vokabel_richtung == "lat_to_de" else vokabel["lateinisch"]
        # Persisch gehört zur deutschen Bedeutung
        vorderseite_fa = "" if self.vokabel_richtung == "lat_to_de" else vokabel.get("deutsch_fa", "")
        rueckseite_fa = vokabel.get("deutsch_fa", "") if self.vokabel_richtung == "lat_to_de" else ""
        label_vorne = "LATEINISCH" if self.vokabel_richtung == "lat_to_de" else "DEUTSCH"
        label_hinten = "DEUTSCH" if self.vokabel_richtung == "lat_to_de" else "LATEINISCH"

        karte = tk.Frame(scroll, bg=FARBEN['karte_bg'], relief='flat',
                         highlightbackground=FARBEN['karte_border'], highlightthickness=2)
        karte.pack(fill='x', padx=20, pady=16, ipady=20)
        KB = FARBEN['karte_bg']

        if not self.karte_umgedreht:
            tk.Label(karte, text=label_vorne, font=(FONT, 10, 'bold'),
                     bg=KB, fg=FARBEN['karte_label']).pack(pady=(8, 4))

            text_frame = tk.Frame(karte, bg=KB)
            text_frame.pack(pady=8)
            tk.Label(text_frame, text=vorderseite, font=(FONT, 22, 'bold'),
                     bg=KB, fg=FARBEN['karte_text'], wraplength=600).pack(side='left', padx=8)

            if AUSSPRACHE_VERFUEGBAR:
                # Vorderseite: bei lat_to_de ist vorne LATEIN, sonst DEUTSCH
                lang_vorne = 'lat' if self.vokabel_richtung == 'lat_to_de' else 'de'
                tk.Button(text_frame, text="🔊", font=(FONT, 18),
                          bg=FARBEN['card'], fg=FARBEN['karte_label'], width=3, cursor='hand2',
                          command=lambda t=vorderseite, l=lang_vorne: self.aussprache.spreche(t, l)).pack(side='left', padx=8)

            if vorderseite_fa:
                tk.Label(karte, text=vorderseite_fa, font=(FONT, 15),
                         bg=KB, fg=FARBEN['karte_fa'], wraplength=600).pack(pady=(0, 4))

            tk.Label(karte, text="↓ Karte umdrehen ↓", font=(FONT, 9, 'italic'),
                     bg=KB, fg=FARBEN['karte_muted']).pack(pady=8)
            tk.Button(karte, text="🔄 KARTE UMDREHEN", command=self.karte_umdrehen,
                      bg=FARBEN['primary'], fg=auto_fg(FARBEN['primary']), font=(FONT, 12, 'bold'),
                      relief='flat', padx=20, pady=8, cursor='hand2').pack(pady=8)
        else:
            tk.Label(karte, text=label_hinten, font=(FONT, 10, 'bold'),
                     bg=KB, fg=FARBEN['karte_label']).pack(pady=(8, 4))

            text_frame = tk.Frame(karte, bg=KB)
            text_frame.pack(pady=8)
            tk.Label(text_frame, text=rueckseite, font=(FONT, 20, 'bold'),
                     bg=KB, fg=FARBEN['karte_text'], wraplength=600).pack(side='left', padx=8)

            if AUSSPRACHE_VERFUEGBAR:
                # Rückseite: bei lat_to_de ist hinten DEUTSCH, sonst LATEIN
                lang_hinten = 'de' if self.vokabel_richtung == 'lat_to_de' else 'lat'
                tk.Button(text_frame, text="🔊", font=(FONT, 18),
                          bg=FARBEN['card'], fg=FARBEN['karte_label'], width=3, cursor='hand2',
                          command=lambda t=rueckseite, l=lang_hinten: self.aussprache.spreche(t, l)).pack(side='left', padx=8)

            if rueckseite_fa:
                tk.Label(karte, text=rueckseite_fa, font=(FONT, 15),
                         bg=KB, fg=FARBEN['karte_fa'], wraplength=600).pack(pady=(0, 6))

            # Trennlinie vor den Extras
            tk.Frame(karte, bg=FARBEN['karte_border'], height=1).pack(fill='x', padx=30, pady=(10, 6))

            # Extras
            if vokabel.get("eselsbruecke"):
                tk.Label(karte, text=f"💡 Eselsbrücke: {vokabel['eselsbruecke']}",
                         font=(FONT, 10), bg=KB, fg=FARBEN['karte_muted'],
                         wraplength=600, justify='center').pack(pady=(6, 0), padx=12)
                if vokabel.get("eselsbruecke_fa"):
                    tk.Label(karte, text=vokabel["eselsbruecke_fa"], font=(FONT, 10),
                             bg=KB, fg=FARBEN['karte_fa'], wraplength=600, justify='center').pack(pady=(0, 6), padx=12)
            if vokabel.get("herkunft"):
                tk.Label(karte, text=f"📖 Herkunft: {vokabel['herkunft']}",
                         font=(FONT, 9), bg=KB, fg=FARBEN['karte_muted'],
                         wraplength=600, justify='center').pack(pady=4, padx=12)
            if vokabel.get("beispiel"):
                tk.Label(karte, text=f"💬 Beispiel: {vokabel['beispiel']}",
                         font=(FONT, 9, 'italic'), bg=KB, fg=FARBEN['karte_muted'],
                         wraplength=600, justify='center').pack(pady=(4, 0), padx=12)
                if vokabel.get("beispiel_fa"):
                    tk.Label(karte, text=vokabel["beispiel_fa"], font=(FONT, 10),
                             bg=KB, fg=FARBEN['karte_fa'], wraplength=600, justify='center').pack(pady=(0, 4), padx=12)

        # Bewertungs-Buttons
        if self.karte_umgedreht:
            btn_frame = tk.Frame(scroll, bg=FARBEN['bg'])
            btn_frame.pack(fill='x', padx=20, pady=12)
            tk.Button(btn_frame, text="❌ Nicht gewusst", command=lambda: self.bewerte_vokabel(False),
                      bg=FARBEN['falsch'], fg=auto_fg(FARBEN['falsch']), font=(FONT, 12, 'bold'),
                      relief='flat', padx=20, pady=10).pack(side='left', expand=True, fill='x', padx=4)
            tk.Button(btn_frame, text="✅ Gewusst", command=lambda: self.bewerte_vokabel(True),
                      bg=FARBEN['richtig'], fg=auto_fg(FARBEN['richtig']), font=(FONT, 12, 'bold'),
                      relief='flat', padx=20, pady=10).pack(side='left', expand=True, fill='x', padx=4)
        else:
            info = "💭 Versuche, dich an die Übersetzung zu erinnern."
            if AUSSPRACHE_VERFUEGBAR:
                info += "\n🔊 Klicke den Lautsprecher für die Aussprache!"
            tk.Label(scroll, text=info, font=(FONT, 10, 'italic'),
                     bg=FARBEN['card'], fg=FARBEN['text'], padx=12, pady=8,
                     wraplength=700).pack(fill='x', padx=20, pady=8)

        # Runden-Stats
        tk.Label(scroll, text=f"📊 ✅ {self.runden_richtig} gewusst · ❌ {self.runden_falsch} nicht gewusst",
                 font=(FONT, 10), bg=FARBEN['bg'], fg=FARBEN['text']).pack(pady=8)

    def karte_umdrehen(self):
        self.karte_umgedreht = not self.karte_umgedreht
        self.zeige_vokabel_karte()

    def bewerte_vokabel(self, gewusst):
        vokabel = self.aktuelle_vokabeln[self.aktuelle_index]
        self.update_vokabel_statistik(vokabel["id"], gewusst)
        if gewusst: self.runden_richtig += 1
        else: self.runden_falsch += 1
        self.aktuelle_index += 1
        self.karte_umgedreht = False
        # Automatisch speichern
        if self.aktuelle_index < len(self.aktuelle_vokabeln):
            self.speichere_vokabel_lesezeichen(self.aktueller_modus)
        self.zeige_vokabel_karte()

    def vokabel_zurueck(self):
        if self.aktueller_modus and 0 < self.aktuelle_index < len(self.aktuelle_vokabeln):
            self.speichere_vokabel_lesezeichen(self.aktueller_modus)
            messagebox.showinfo("Gespeichert",
                f"✅ Gespeichert!\n\nDein Fortschritt im Modus '{self.aktueller_modus}' wurde gespeichert.\n\nDu kannst später dort weitermachen!")
        self.zeige_hauptmenue()

    def zeige_vokabel_ergebnis(self):
        self.clear_window()
        scroll = self.create_scrollable_frame()
        gesamt = self.runden_richtig + self.runden_falsch
        quote = (self.runden_richtig / gesamt * 100) if gesamt > 0 else 0

        if quote >= 90: icon, titel, farbe = "🏆", "FANTASTISCH!", FARBEN['richtig']
        elif quote >= 75: icon, titel, farbe = "🎯", "SEHR GUT!", FARBEN['primary']
        elif quote >= 50: icon, titel, farbe = "👍", "Ordentlich!", FARBEN['secondary']
        else: icon, titel, farbe = "📚", "Weiter üben!", FARBEN['falsch']

        tk.Label(scroll, text=icon, font=(FONT, 60), bg=FARBEN['bg'], fg=FARBEN['text']).pack(pady=20)
        tk.Label(scroll, text="Vokabeln gelernt!", font=(FONT, 18, 'bold'),
                 bg=FARBEN['bg'], fg=FARBEN['text']).pack()
        tk.Label(scroll, text=f"{quote:.0f}%", font=(FONT, 48, 'bold'),
                 bg=FARBEN['bg'], fg=farbe).pack(pady=8)
        tk.Label(scroll, text=titel, font=(FONT, 16, 'bold'), bg=FARBEN['bg'], fg=farbe).pack()

        stats_frame = tk.Frame(scroll, bg=FARBEN['bg'])
        stats_frame.pack(pady=20)
        tk.Label(stats_frame, text=f"✅ Gewusst: {self.runden_richtig}",
                 font=(FONT, 14), bg=FARBEN['card'], fg=FARBEN['richtig'],
                 padx=20, pady=12, relief='flat', highlightthickness=1, highlightbackground=FARBEN['border']).pack(side='left', padx=8)
        tk.Label(stats_frame, text=f"❌ Nicht gewusst: {self.runden_falsch}",
                 font=(FONT, 14), bg=FARBEN['card'], fg=FARBEN['falsch'],
                 padx=20, pady=12, relief='flat', highlightthickness=1, highlightbackground=FARBEN['border']).pack(side='left', padx=8)

        tk.Button(scroll, text="🏠 Hauptmenü", command=self.zeige_hauptmenue,
                  bg=FARBEN['primary'], fg=auto_fg(FARBEN['primary']), font=(FONT, 12, 'bold'),
                  relief='flat', padx=24, pady=12).pack(pady=12)

    # ================================================
    # FRAGE ANZEIGEN
    # ================================================
    def zeige_frage(self):
        if self.aktuelle_index >= len(self.aktuelle_fragen):
            if self.aktueller_modus in self.statistik.get("lesezeichen", {}):
                del self.statistik["lesezeichen"][self.aktueller_modus]
                self.speichere_statistik()
            self.zeige_runden_ergebnis()
            return

        frage = self.aktuelle_fragen[self.aktuelle_index]
        self.nutzer_antwort = None
        self.nutzer_antworten = []

        self.clear_window()
        scroll = self.create_scrollable_frame()

        # Top-Bar
        top = tk.Frame(scroll, bg=FARBEN['bg'])
        top.pack(fill='x', pady=4)
        tk.Button(top, text="🏠 Hauptmenü (speichern)", command=self.fragen_zurueck,
                  bg=FARBEN['primary'], fg=auto_fg(FARBEN['primary']), font=(FONT, 10, 'bold')).pack(side='left')
        tk.Label(top, text=f"{self.aktuelle_index + 1} / {len(self.aktuelle_fragen)}",
                 font=(FONT, 11, 'bold'), bg=FARBEN['bg'], fg=FARBEN['text']).pack(side='right')

        tk.Label(scroll, text=f"📖 {self.aktueller_modus}", font=(FONT, 11),
                 bg=FARBEN['bg'], fg=FARBEN['text']).pack(pady=4)

        # Meta
        meta = tk.Frame(scroll, bg=FARBEN['bg'])
        meta.pack(pady=4)
        for text in [f"🏷️ {frage.get('thema','')}", f"📊 {frage.get('schwierigkeit','').upper()}",
                     f"⭐ {frage.get('pruefungsrelevanz','').upper()}"]:
            tk.Label(meta, text=text, font=(FONT, 9), bg=FARBEN['card'], fg=FARBEN['text'],
                     padx=8, pady=4, relief='flat', highlightthickness=1, highlightbackground=FARBEN['border']).pack(side='left', padx=2)

        # Fallbeispiel
        if frage.get("typ") == "fallbeispiel" and frage.get("fallbeschreibung"):
            fall_frame = tk.Frame(scroll, bg=FARBEN['fallbeispiel_bg'], relief='flat', highlightthickness=1, highlightbackground=FARBEN['border'])
            fall_frame.pack(fill='x', padx=12, pady=8)
            tk.Label(fall_frame, text="📋 FALLBEISPIEL", font=(FONT, 10, 'bold'),
                     bg=FARBEN['fallbeispiel_bg'], fg=FARBEN['secondary']).pack(anchor='w', padx=12, pady=(8, 4))
            tk.Label(fall_frame, text=frage["fallbeschreibung"], font=(FONT, 10),
                     bg=FARBEN['fallbeispiel_bg'], fg=FARBEN['fallbeispiel_text'],
                     wraplength=750, justify='left').pack(anchor='w', padx=12, pady=(0, 4))
            if frage.get("fallbeschreibung_fa"):
                tk.Label(fall_frame, text=frage["fallbeschreibung_fa"], font=(FONT, 10),
                         bg=FARBEN['fallbeispiel_bg'], fg=FARBEN['secondary'], wraplength=750,
                         justify='right', anchor='e').pack(anchor='e', padx=12, pady=(0, 8))

        # Frage-Text (mit persischer Übersetzung darunter)
        frage_frame = tk.Frame(scroll, bg=FARBEN['card'], relief='flat', highlightthickness=1, highlightbackground=FARBEN['border'])
        frage_frame.pack(fill='x', padx=12, pady=8)
        tk.Label(frage_frame, text=frage["frage"], font=(FONT, 13, 'bold'),
                 bg=FARBEN['card'], fg=FARBEN['text'], wraplength=750, justify='left').pack(fill='x', padx=16, pady=(12, 4))
        if frage.get("frage_fa"):
            tk.Label(frage_frame, text=frage["frage_fa"], font=(FONT, 12),
                     bg=FARBEN['card'], fg=FARBEN['secondary'], wraplength=750,
                     justify='right', anchor='e').pack(fill='x', padx=16, pady=(0, 12))

        # Antwort-Optionen
        typ = frage.get("typ", "single_choice")
        self.option_buttons = []

        if typ in ["single_choice", "fallbeispiel"]:
            for i, opt in enumerate(frage["optionen"]):
                opt_fa = frage.get("optionen_fa", [])
                opt_text = f"{chr(65+i)}. {opt}"
                if opt_fa and i < len(opt_fa) and opt_fa[i]:
                    opt_text += f"\n{opt_fa[i]}"
                btn = tk.Button(scroll, text=opt_text,
                                font=(FONT, 11), bg=FARBEN['card'], fg=FARBEN['text'],
                                anchor='w', wraplength=700, justify='left',
                                relief='flat', highlightthickness=1, highlightbackground=FARBEN['border'],
                                padx=16, pady=12, cursor='hand2',
                                activebackground=FARBEN['card_hover'],
                                command=lambda idx=i: self.waehle_single(idx))
                btn.pack(fill='x', padx=12, pady=2)
                self.option_buttons.append(btn)

        elif typ == "multiple_choice":
            tk.Label(scroll, text="💡 Mehrere Antworten möglich",
                     font=(FONT, 10, 'italic'), bg=FARBEN['bg'], fg=FARBEN['text']).pack(pady=4)
            for i, opt in enumerate(frage["optionen"]):
                opt_fa = frage.get("optionen_fa", [])
                opt_text = f"{chr(65+i)}. {opt}"
                if opt_fa and i < len(opt_fa) and opt_fa[i]:
                    opt_text += f"\n{opt_fa[i]}"
                btn = tk.Button(scroll, text=opt_text,
                                font=(FONT, 11), bg=FARBEN['card'], fg=FARBEN['text'],
                                anchor='w', wraplength=700, justify='left',
                                relief='flat', highlightthickness=1, highlightbackground=FARBEN['border'],
                                padx=16, pady=12, cursor='hand2',
                                activebackground=FARBEN['card_hover'],
                                command=lambda idx=i: self.toggle_multi(idx))
                btn.pack(fill='x', padx=12, pady=2)
                self.option_buttons.append(btn)

        elif typ == "richtig_falsch":
            rf_frame = tk.Frame(scroll, bg=FARBEN['bg'])
            rf_frame.pack(pady=12)
            self.rf_true_btn = tk.Button(rf_frame, text="✅ RICHTIG",
                                          font=(FONT, 14, 'bold'),
                                          bg=FARBEN['card'], fg=FARBEN['richtig'],
                                          relief='flat', highlightthickness=2, highlightbackground=FARBEN['border'], padx=30, pady=20,
                                          command=lambda: self.waehle_rf(True))
            self.rf_true_btn.pack(side='left', padx=8)
            self.rf_false_btn = tk.Button(rf_frame, text="❌ FALSCH",
                                           font=(FONT, 14, 'bold'),
                                           bg=FARBEN['card'], fg=FARBEN['falsch'],
                                           relief='flat', highlightthickness=2, highlightbackground=FARBEN['border'], padx=30, pady=20,
                                           command=lambda: self.waehle_rf(False))
            self.rf_false_btn.pack(side='left', padx=8)

        # Prüfen-Button
        tk.Button(scroll, text="✓  Antwort prüfen", command=self.pruefe_antwort,
                  bg=FARBEN['primary'], fg=auto_fg(FARBEN['primary']), font=(FONT, 12, 'bold'),
                  relief='flat', padx=32, pady=14, cursor='hand2',
                  activebackground=FARBEN['primary_hover']).pack(pady=(16, 12))

    def waehle_single(self, idx):
        self.nutzer_antwort = idx
        for i, btn in enumerate(self.option_buttons):
            if i == idx:
                btn.config(bg=FARBEN['primary'], fg=auto_fg(FARBEN['primary']))
            else:
                btn.config(bg=FARBEN['card'], fg=FARBEN['text'])

    def toggle_multi(self, idx):
        if idx in self.nutzer_antworten:
            self.nutzer_antworten.remove(idx)
            self.option_buttons[idx].config(bg=FARBEN['card'], fg=FARBEN['text'])
        else:
            self.nutzer_antworten.append(idx)
            self.option_buttons[idx].config(bg=FARBEN['primary'], fg=auto_fg(FARBEN['primary']))

    def waehle_rf(self, wert):
        self.nutzer_antwort = wert
        if wert:
            self.rf_true_btn.config(bg=FARBEN['richtig'], fg=auto_fg(FARBEN['richtig']))
            self.rf_false_btn.config(bg=FARBEN['card'], fg=FARBEN['falsch'])
        else:
            self.rf_false_btn.config(bg=FARBEN['falsch'], fg=auto_fg(FARBEN['falsch']))
            self.rf_true_btn.config(bg=FARBEN['card'], fg=FARBEN['richtig'])

    def pruefe_antwort(self):
        frage = self.aktuelle_fragen[self.aktuelle_index]
        typ = frage.get("typ", "single_choice")
        ist_richtig = False

        if typ in ["single_choice", "fallbeispiel"]:
            if self.nutzer_antwort is None:
                messagebox.showwarning("Hinweis", "Bitte wähle eine Antwort!")
                return
            ist_richtig = self.nutzer_antwort == frage["richtig"]
        elif typ == "multiple_choice":
            if not self.nutzer_antworten:
                messagebox.showwarning("Hinweis", "Bitte wähle mindestens eine Antwort!")
                return
            ist_richtig = sorted(self.nutzer_antworten) == sorted(frage["richtig"])
        elif typ == "richtig_falsch":
            if self.nutzer_antwort is None:
                messagebox.showwarning("Hinweis", "Bitte wähle Richtig oder Falsch!")
                return
            ist_richtig = self.nutzer_antwort == frage["richtig"]

        if ist_richtig: self.runden_richtig += 1
        else: self.runden_falsch += 1
        self.update_statistik(frage["id"], ist_richtig)
        self.zeige_feedback(frage, ist_richtig)

    def zeige_feedback(self, frage, ist_richtig):
        self.clear_window()
        scroll = self.create_scrollable_frame()

        tk.Label(scroll, text=f"📖 {self.aktueller_modus}  ·  {self.aktuelle_index + 1} / {len(self.aktuelle_fragen)}",
                 font=(FONT, 10), bg=FARBEN['bg'], fg=FARBEN['text']).pack(pady=4)

        # Ergebnis
        if ist_richtig:
            tk.Label(scroll, text="✅ RICHTIG!", font=(FONT, 24, 'bold'),
                     bg=FARBEN['richtig'], fg=auto_fg(FARBEN['richtig']), padx=40, pady=16).pack(pady=8)
        else:
            tk.Label(scroll, text="❌ LEIDER FALSCH", font=(FONT, 24, 'bold'),
                     bg=FARBEN['falsch'], fg=auto_fg(FARBEN['falsch']), padx=40, pady=16).pack(pady=8)

        # Frage
        tk.Label(scroll, text="📝 Frage:", font=(FONT, 10, 'bold'),
                 bg=FARBEN['bg'], fg=FARBEN['text']).pack(anchor='w', padx=16, pady=(8, 2))
        tk.Label(scroll, text=frage["frage"], font=(FONT, 11, 'italic'),
                 bg=FARBEN['card'], fg=FARBEN['text_muted'], wraplength=750, padx=12, pady=8,
                 relief='flat', highlightthickness=1, highlightbackground=FARBEN['border']).pack(fill='x', padx=12, pady=4)

        # Richtige Antwort
        tk.Label(scroll, text="✓ Richtige Antwort:", font=(FONT, 10, 'bold'),
                 bg=FARBEN['bg'], fg=FARBEN['text']).pack(anchor='w', padx=16, pady=(8, 2))

        typ = frage.get("typ", "single_choice")
        if typ in ["single_choice", "fallbeispiel"]:
            antwort_text = f"{chr(65 + frage['richtig'])}. {frage['optionen'][frage['richtig']]}"
        elif typ == "multiple_choice":
            antwort_text = "\n".join(f"{chr(65+i)}. {frage['optionen'][i]}" for i in frage["richtig"])
        else:
            antwort_text = "RICHTIG" if frage["richtig"] else "FALSCH"

        tk.Label(scroll, text=antwort_text, font=(FONT, 11),
                 bg=FARBEN['card'], fg=FARBEN['text'], wraplength=750, padx=12, pady=8,
                 relief='flat', highlightthickness=1, highlightbackground=FARBEN['border'], justify='left').pack(fill='x', padx=12, pady=4)

        # Erklärung
        tk.Label(scroll, text="💡 Erklärung:", font=(FONT, 10, 'bold'),
                 bg=FARBEN['bg'], fg=FARBEN['text']).pack(anchor='w', padx=16, pady=(8, 2))
        erkl_frame = tk.Frame(scroll, bg=FARBEN['erklaerung_bg'], relief='flat', highlightthickness=1, highlightbackground=FARBEN['border'])
        erkl_frame.pack(fill='x', padx=12, pady=4)
        tk.Label(erkl_frame, text=frage.get("erklaerung", ""), font=(FONT, 11),
                 bg=FARBEN['erklaerung_bg'], fg=FARBEN['text'], wraplength=750, justify='left').pack(fill='x', padx=12, pady=(8, 4))
        if frage.get("erklaerung_fa"):
            tk.Label(erkl_frame, text=frage["erklaerung_fa"], font=(FONT, 11),
                     bg=FARBEN['erklaerung_bg'], fg=FARBEN['secondary'], wraplength=750,
                     justify='right', anchor='e').pack(fill='x', padx=12, pady=(0, 8))

        # Stats
        gesamt = self.runden_richtig + self.runden_falsch
        quote = int((self.runden_richtig / gesamt * 100)) if gesamt > 0 else 0
        tk.Label(scroll, text=f"📊 ✅ {self.runden_richtig} · ❌ {self.runden_falsch} · 🎯 {quote}%",
                 font=(FONT, 11), bg=FARBEN['bg'], fg=FARBEN['text']).pack(pady=12)

        # Buttons
        btn_frame = tk.Frame(scroll, bg=FARBEN['bg'])
        btn_frame.pack(pady=8)
        tk.Button(btn_frame, text="➡️ Nächste Frage", command=self.naechste_frage,
                  bg=FARBEN['primary'], fg=auto_fg(FARBEN['primary']), font=(FONT, 12, 'bold'),
                  relief='flat', padx=24, pady=12).pack(side='left', padx=4)
        tk.Button(btn_frame, text="🏠 Hauptmenü", command=self.fragen_zurueck,
                  bg=FARBEN['secondary'], fg=auto_fg(FARBEN['secondary']), font=(FONT, 11, 'bold'),
                  relief='flat', padx=24, pady=12).pack(side='left', padx=4)

    def naechste_frage(self):
        self.aktuelle_index += 1
        # Automatisch speichern
        if self.aktuelle_index < len(self.aktuelle_fragen):
            self.speichere_lesezeichen(self.aktueller_modus)
        self.zeige_frage()

    def fragen_zurueck(self):
        if self.aktueller_modus and 0 < self.aktuelle_index < len(self.aktuelle_fragen):
            self.speichere_lesezeichen(self.aktueller_modus)
            messagebox.showinfo("Gespeichert",
                f"✅ Gespeichert!\n\nDein Fortschritt im Modus '{self.aktueller_modus}' wurde gespeichert.")
        self.zeige_hauptmenue()

    def zeige_runden_ergebnis(self):
        self.clear_window()
        scroll = self.create_scrollable_frame()
        gesamt = self.runden_richtig + self.runden_falsch
        quote = (self.runden_richtig / gesamt * 100) if gesamt > 0 else 0

        if quote >= 90: icon, titel, farbe = "🏆", "HERVORRAGEND!", FARBEN['richtig']
        elif quote >= 75: icon, titel, farbe = "🎯", "SEHR GUT!", FARBEN['primary']
        elif quote >= 60: icon, titel, farbe = "👍", "BESTANDEN!", FARBEN['secondary']
        else: icon, titel, farbe = "📚", "Mehr Übung nötig", FARBEN['falsch']

        tk.Label(scroll, text=icon, font=(FONT, 60), bg=FARBEN['bg'], fg=FARBEN['text']).pack(pady=20)
        tk.Label(scroll, text="Runde beendet!", font=(FONT, 18, 'bold'),
                 bg=FARBEN['bg'], fg=FARBEN['text']).pack()
        tk.Label(scroll, text=f"{quote:.0f}%", font=(FONT, 48, 'bold'),
                 bg=FARBEN['bg'], fg=farbe).pack(pady=8)
        tk.Label(scroll, text=titel, font=(FONT, 16, 'bold'), bg=FARBEN['bg'], fg=farbe).pack()

        stats = tk.Frame(scroll, bg=FARBEN['bg'])
        stats.pack(pady=20)
        tk.Label(stats, text=f"✅ Richtig: {self.runden_richtig}",
                 font=(FONT, 14), bg=FARBEN['card'], fg=FARBEN['richtig'],
                 padx=20, pady=12, relief='flat', highlightthickness=1, highlightbackground=FARBEN['border']).pack(side='left', padx=8)
        tk.Label(stats, text=f"❌ Falsch: {self.runden_falsch}",
                 font=(FONT, 14), bg=FARBEN['card'], fg=FARBEN['falsch'],
                 padx=20, pady=12, relief='flat', highlightthickness=1, highlightbackground=FARBEN['border']).pack(side='left', padx=8)

        tk.Button(scroll, text="🏠 Hauptmenü", command=self.zeige_hauptmenue,
                  bg=FARBEN['primary'], fg=auto_fg(FARBEN['primary']), font=(FONT, 12, 'bold'),
                  relief='flat', padx=24, pady=12).pack(pady=12)

    # ================================================
    # STATISTIK
    # ================================================
    def zeige_statistik(self):
        self.clear_window()
        scroll = self.create_scrollable_frame()

        tk.Button(scroll, text="← Zurück", command=self.zeige_hauptmenue,
                  bg=FARBEN['primary'], fg=auto_fg(FARBEN['primary']), font=(FONT, 10, 'bold')).pack(anchor='w', pady=8)
        tk.Label(scroll, text="📊 Deine Statistik", font=(FONT, 18, 'bold'),
                 bg=FARBEN['bg'], fg=FARBEN['text']).pack(pady=12)

        gesamt = self.statistik["gesamt_richtig"] + self.statistik["gesamt_falsch"]
        vok_gesehen = self.statistik.get("vokabeln_gesehen", 0)
        vok_gewusst = self.statistik.get("vokabeln_gewusst", 0)

        if gesamt == 0 and vok_gesehen == 0:
            tk.Label(scroll, text="Noch keine Daten.\nBeantworte Fragen oder lerne Vokabeln!",
                     font=(FONT, 12), bg=FARBEN['card'], fg=FARBEN['text_muted'], padx=20, pady=20,
                     relief='flat', highlightthickness=1, highlightbackground=FARBEN['border']).pack(fill='x', padx=20)
        else:
            quote = (self.statistik["gesamt_richtig"] / gesamt * 100) if gesamt > 0 else 0
            vok_quote = (vok_gewusst / vok_gesehen * 100) if vok_gesehen > 0 else 0

            # Fragen-Stats
            tk.Label(scroll, text="📝 Prüfungsfragen", font=(FONT, 13, 'bold'),
                     bg=FARBEN['bg'], fg=FARBEN['text']).pack(anchor='w', padx=16, pady=(16, 4))
            grid = tk.Frame(scroll, bg=FARBEN['bg'])
            grid.pack(fill='x', padx=16)
            for label, value, farbe in [
                ("📅 Lerntage", len(self.statistik["lerntage"]), FARBEN['text']),
                ("📊 Beantwortet", gesamt, FARBEN['text']),
                ("✅ Richtig", self.statistik["gesamt_richtig"], FARBEN['richtig']),
                ("🎯 Quote", f"{quote:.1f}%", FARBEN['primary'])
            ]:
                box = tk.Frame(grid, bg=FARBEN['card'], relief='flat', highlightthickness=1, highlightbackground=FARBEN['border'])
                box.pack(side='left', expand=True, fill='x', padx=4, pady=4)
                tk.Label(box, text=label, font=(FONT, 9), bg=FARBEN['card'], fg=FARBEN['text_muted']).pack(pady=(8, 0))
                tk.Label(box, text=str(value), font=(FONT, 16, 'bold'), bg=FARBEN['card'], fg=farbe).pack(pady=(0, 8))

            # Vokabel-Stats
            tk.Label(scroll, text="📚 Vokabeln", font=(FONT, 13, 'bold'),
                     bg=FARBEN['bg'], fg=FARBEN['text']).pack(anchor='w', padx=16, pady=(16, 4))
            grid2 = tk.Frame(scroll, bg=FARBEN['bg'])
            grid2.pack(fill='x', padx=16)
            for label, value, farbe in [
                ("📚 Gesehen", vok_gesehen, FARBEN['text']),
                ("✅ Gewusst", vok_gewusst, FARBEN['richtig']),
                ("🎯 Quote", f"{vok_quote:.1f}%", FARBEN['primary']),
                ("📖 Vokabeln", f"{len(self.statistik.get('vokabeln', {}))} / {len(self.vokabeln)}", FARBEN['text'])
            ]:
                box = tk.Frame(grid2, bg=FARBEN['card'], relief='flat', highlightthickness=1, highlightbackground=FARBEN['border'])
                box.pack(side='left', expand=True, fill='x', padx=4, pady=4)
                tk.Label(box, text=label, font=(FONT, 9), bg=FARBEN['card'], fg=FARBEN['text_muted']).pack(pady=(8, 0))
                tk.Label(box, text=str(value), font=(FONT, 16, 'bold'), bg=FARBEN['card'], fg=farbe).pack(pady=(0, 8))

        # Reset-Button
        tk.Button(scroll, text="🗑️ Statistik zurücksetzen",
                  command=self.statistik_reset, bg=FARBEN['card'], fg=FARBEN['falsch'],
                  font=(FONT, 10, 'bold'), relief='flat', highlightthickness=1, highlightbackground=FARBEN['border'],
                  padx=16, pady=8).pack(pady=24)

    def statistik_reset(self):
        if messagebox.askyesno("Bestätigen",
                               "Möchtest du ALLE Statistik-Daten löschen?\nDas kann nicht rückgängig gemacht werden!"):
            self.statistik = {
                "fragen": {}, "vokabeln": {},
                "gesamt_richtig": 0, "gesamt_falsch": 0,
                "vokabeln_gesehen": 0, "vokabeln_gewusst": 0,
                "lerntage": [], "lesezeichen": {},
                "gesehene_fragen": [], "gesehene_vokabeln": []
            }
            self.speichere_statistik()
            self.zeige_hauptmenue()


# ================================================
# APP STARTEN
# ================================================
if __name__ == "__main__":
    root = tk.Tk()
    app = LernApp(root)
    root.mainloop()
