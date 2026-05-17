# 📱 App online stellen - Schritt-für-Schritt-Anleitung

So bekommst du die Heilpraktiker-Lern-App auf dein Handy oder Tablet!

---

## 🎯 Was wir machen

1. Auf GitHub einen neuen "Speicherplatz" (Repository) erstellen
2. Die 8 App-Dateien dorthin hochladen
3. GitHub Pages aktivieren (macht die App im Internet sichtbar)
4. Den Link auf deinem Handy/Tablet öffnen und als App installieren

**Zeitaufwand:** ca. 10-15 Minuten beim ersten Mal

---

## 📋 SCHRITT 1: Neues Repository erstellen

### 1.1 Auf GitHub einloggen
Gehe auf **https://github.com** und melde dich an.

### 1.2 Neues Repository anlegen
1. Klicke oben rechts auf das **`+`-Symbol** (neben deinem Profilbild)
2. Wähle **"New repository"**

### 1.3 Repository konfigurieren

Fülle diese Felder aus:

| Feld | Was eintragen |
|------|--------------|
| **Repository name** | `heilpraktiker-app` |
| **Description** (optional) | `Meine Lern-App für die HP-Prüfung` |
| **Public oder Private** | ⚠️ **PUBLIC wählen!** (sonst funktioniert GitHub Pages nicht kostenlos) |
| **Add a README file** | ✅ Häkchen setzen |
| Add .gitignore | Nichts auswählen |
| Choose a license | None |

### 1.4 Erstellen
Klicke unten auf den grünen Button **"Create repository"**.

✅ **Fertig!** Du siehst jetzt deine neue (noch leere) Repository-Seite.

---

## 📤 SCHRITT 2: Die 8 App-Dateien hochladen

### 2.1 Upload-Bereich öffnen

In deinem neuen Repository:
1. Klicke auf den Button **"Add file"** (oben rechts, blau)
2. Wähle **"Upload files"**

### 2.2 Alle 8 Dateien aus der ZIP hochladen

📦 **WICHTIG:** Du hast die `HeilpraktikerApp.zip` heruntergeladen.

**Schritt A: ZIP entpacken**
- Rechtsklick auf die ZIP → **"Alle extrahieren"** (Windows) oder **"Entpacken"** (Mac)
- Du bekommst einen Ordner mit 8 Dateien

**Schritt B: Diese 8 Dateien auf GitHub ziehen:**

1. ✅ `index.html` (Hauptseite)
2. ✅ `style.css` (Aussehen)
3. ✅ `app.js` (Programm-Logik)
4. ✅ `manifest.json` (App-Eigenschaften)
5. ✅ `sw.js` (Offline-Funktion)
6. ✅ `fragenkatalog.json` (deine 134 Fragen + 120 Vokabeln!)
7. ✅ `icon-192.png` (kleines App-Icon)
8. ✅ `icon-512.png` (großes App-Icon)

**So gehst du vor:**
- **Markiere alle 8 Dateien** im Datei-Explorer (Strg+A oder einzeln mit Strg+Klick)
- **Ziehe sie alle gleichzeitig** in das große Upload-Feld auf GitHub
- Warte, bis alle hochgeladen sind (du siehst grüne Häkchen)

### 2.3 Speichern (Commit)

1. Scrolle nach unten
2. Bei "Commit changes" steht ein Textfeld - du kannst es leer lassen
3. Klicke auf den grünen Button **"Commit changes"**

✅ **Fertig!** Alle Dateien sind jetzt online.

---

## 🌐 SCHRITT 3: GitHub Pages aktivieren

Jetzt machen wir die App im Internet erreichbar!

### 3.1 Settings öffnen

1. In deinem Repository: Klicke oben auf den Tab **"Settings"** (Zahnrad-Symbol)
2. Du landest auf der Einstellungs-Seite

### 3.2 Pages aufrufen

In der linken Spalte:
- Suche **"Pages"** (steht unter "Code and automation")
- Klicke darauf

### 3.3 GitHub Pages konfigurieren

Bei **"Build and deployment"**:

1. **Source**: Wähle **"Deploy from a branch"**
2. **Branch**: Wähle **"main"** (aus dem ersten Dropdown)
3. **Folder**: Wähle **"/ (root)"** (aus dem zweiten Dropdown)
4. Klicke auf **"Save"**

### 3.4 Warten ⏱️

GitHub braucht jetzt **2-3 Minuten**, um deine App zu veröffentlichen.

**Tipp:** Lade die Seite nach 2 Minuten neu (F5), dann siehst du oben:

> 🟢 **Your site is live at https://DEIN-USERNAME.github.io/heilpraktiker-app/**

✅ **GESCHAFFT!** Das ist dein App-Link!

---

## 📲 SCHRITT 4: App auf Handy/Tablet installieren

### 4.1 Link öffnen

**Auf dem Handy oder Tablet:**
1. Öffne **Chrome** (Android) oder **Safari** (iPhone/iPad)
2. Tippe oder kopiere den Link ein:
   `https://DEIN-USERNAME.github.io/heilpraktiker-app/`
   *(ersetze DEIN-USERNAME mit deinem GitHub-Namen)*

3. ✅ Die App lädt - du siehst das grüne 🌿-Symbol und das Hauptmenü!

### 4.2 Als App installieren (auf Startbildschirm legen)

#### 📱 Android (Chrome)

1. Tippe oben rechts auf die **drei Punkte** ⋮
2. Wähle **"Zum Startbildschirm hinzufügen"** oder **"App installieren"**
3. Bestätige mit **"Hinzufügen"**

🎉 Ein Icon erscheint auf deinem Startbildschirm - genau wie eine echte App!

#### 📱 iPhone/iPad (Safari)

1. Tippe unten auf das **Teilen-Symbol** (Quadrat mit Pfeil nach oben)
2. Scrolle nach unten und tippe **"Zum Home-Bildschirm"**
3. Tippe oben rechts auf **"Hinzufügen"**

🎉 Ein Icon erscheint auf deinem Home-Bildschirm!

---

## 🎉 FERTIG! Jetzt kannst du:

- ✅ Auf **Laptop** weiterlernen (mit deiner Python-App)
- ✅ Auf **Handy** lernen (mit der Online-App)
- ✅ Auf **Tablet** lernen (mit der Online-App)
- ✅ Sogar **offline** lernen (nach dem ersten Laden)

---

## 🔄 Wenn ich dir neue Seiten schicke

Sobald du mir neue Buchseiten schickst und ich eine neue `fragenkatalog.json` erstelle:

### Update auf GitHub (super einfach!)

1. Gehe in dein Repository auf GitHub
2. Klicke auf die Datei **`fragenkatalog.json`**
3. Klicke oben rechts auf den **Stift** ✏️ ("Edit this file")
4. Markiere den **gesamten alten Inhalt** (Strg+A) und lösche ihn
5. Öffne meine neue `fragenkatalog.json` auf dem Computer mit Notepad/Editor
6. Kopiere den **gesamten neuen Inhalt** (Strg+A, Strg+C)
7. Füge ihn auf GitHub ein (Strg+V)
8. Scrolle nach unten und klicke **"Commit changes"**
9. Warte 1-2 Minuten
10. Auf dem Handy: App neu laden (nach unten ziehen oder schließen+öffnen)

✅ Neue Inhalte sind sofort auf allen Geräten verfügbar!

---

## ⚠️ Häufige Probleme & Lösungen

### "404 Page not found" beim Aufrufen des Links
- ⏱️ Du musst nach Aktivierung von GitHub Pages **2-3 Minuten warten**
- Stelle sicher, dass das Repository **PUBLIC** ist
- Prüfe in Settings → Pages, ob "Your site is live at..." angezeigt wird

### "Zum Startbildschirm hinzufügen" wird nicht angezeigt
- Lade die Seite einmal komplett (warte bis alles geladen ist)
- Auf Android: Nur in **Chrome** funktioniert es
- Auf iPhone: Nur in **Safari** funktioniert es

### App lädt keine Fragen/Vokabeln
- Stelle sicher, dass `fragenkatalog.json` korrekt hochgeladen wurde
- Schau in deinem Repository, ob die Datei sichtbar ist
- Datei muss `fragenkatalog.json` heißen (nicht `fragenkatalog_v3.json`!)

### Karteikarte dreht sich nicht
- Tippe direkt auf den Button **"🔄 Karte umdrehen"**

### Statistik weg auf dem Handy
- Mobile Statistik wird im Browser gespeichert
- **Wichtig:** Mobile App und Desktop-App haben getrennte Statistiken!

---

## 💡 Wichtige Hinweise

### 🔐 Datenschutz
- Da das Repository **public** ist, kann **theoretisch jeder** deinen Fragenkatalog sehen
- Aber: Es enthält **keine persönlichen Daten** - nur Lernfragen
- Deine **Lernstatistik bleibt privat** (gespeichert nur auf deinem Gerät)

### 📊 Mehrere Geräte, mehrere Statistiken
- Jedes Gerät (Laptop, Handy, Tablet) hat **eine eigene Statistik**
- Die Statistik wird im Browser/in der App gespeichert
- Synchronisation zwischen Geräten ist (noch) nicht möglich

### 💰 Kostet das was?
- ❌ **Komplett kostenlos** mit GitHub Pages
- ❌ Keine versteckten Kosten
- ❌ Keine Werbung

---

## 🎯 Dein Link

Nachdem du alle Schritte durchgegangen bist, ist deine App hier erreichbar:

```
https://DEIN-USERNAME.github.io/heilpraktiker-app/
```

**Beispiel:** Wenn dein GitHub-Username `maria123` ist:
```
https://maria123.github.io/heilpraktiker-app/
```

Speichere diesen Link als Lesezeichen! 📑

---

**Viel Erfolg! Bei Problemen einfach melden - ich helfe Schritt für Schritt! 🌿📱**
