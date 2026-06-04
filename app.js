// ================================================
// Heilpraktiker Lern-App - PWA v5.0
// Mit Import/Export und Aussprache-Funktion
// ================================================

let fragenkatalog = [];
let vokabeln = [];
let statistik = {
    fragen: {}, vokabeln: {},
    gesamt_richtig: 0, gesamt_falsch: 0,
    vokabeln_gesehen: 0, vokabeln_gewusst: 0,
    lerntage: [],
    lesezeichen: {},
    gesehene_fragen: [],
    gesehene_vokabeln: []
};

let aktuelleFragen = [];
let aktuelleVokabeln = [];
let aktuelleIndex = 0;
let aktuellerModus = "";
let rundenRichtig = 0;
let rundenFalsch = 0;
let nutzerAntwort = null;
let nutzerAntworten = [];
let karteUmgedreht = false;
let vokabelRichtung = "lat_to_de";

// ================================================
// INIT
// ================================================
async function initApp() {
    const gespeicherteStats = localStorage.getItem('hp_statistik');
    if (gespeicherteStats) {
        try {
            statistik = JSON.parse(gespeicherteStats);
            // Migration
            if (!statistik.vokabeln) statistik.vokabeln = {};
            if (!statistik.vokabeln_gesehen) statistik.vokabeln_gesehen = 0;
            if (!statistik.vokabeln_gewusst) statistik.vokabeln_gewusst = 0;
            if (!statistik.lesezeichen) statistik.lesezeichen = {};
            if (!statistik.gesehene_fragen) statistik.gesehene_fragen = [];
            if (!statistik.gesehene_vokabeln) statistik.gesehene_vokabeln = [];
        } catch (e) { console.error(e); }
    }

    // 🌙 Dark Mode initialisieren
    initDarkMode();

    try {
        const response = await fetch('fragenkatalog.json?v=' + Date.now());
        const data = await response.json();
        fragenkatalog = data.fragenkatalog || [];
        vokabeln = data.vokabeln || [];
        zeigeHauptmenue();
    } catch (e) {
        document.getElementById('app').innerHTML =
            '<div class="header"><h1>⚠️ Fehler</h1></div>' +
            '<div class="info-box">Fragenkatalog konnte nicht geladen werden.</div>';
        console.error(e);
    }
}

// ================================================
// 🌙 DARK MODE
// ================================================
function initDarkMode() {
    // 1. Gespeicherte Einstellung prüfen
    const gespeichert = localStorage.getItem('hp_darkmode');

    let darkMode;
    if (gespeichert !== null) {
        // User hat schon gewählt
        darkMode = gespeichert === 'true';
    } else {
        // Erste Nutzung: System-Einstellung übernehmen
        darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setzeDarkMode(darkMode);

    // Toggle-Button zum Body hinzufügen (sichtbar überall)
    erstelleDarkModeToggle();
}

function setzeDarkMode(aktiv) {
    if (aktiv) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('hp_darkmode', aktiv);
    // Toggle-Button-Icon aktualisieren
    const btn = document.getElementById('dark-mode-toggle');
    if (btn) {
        btn.innerHTML = aktiv ? '☀️' : '🌙';
        btn.title = aktiv ? 'Hellen Modus aktivieren' : 'Dunklen Modus aktivieren';
    }
}

function toggleDarkMode() {
    const aktiv = !document.body.classList.contains('dark-mode');
    setzeDarkMode(aktiv);
}

function erstelleDarkModeToggle() {
    // Falls schon vorhanden, nichts tun
    if (document.getElementById('dark-mode-toggle')) return;

    const btn = document.createElement('button');
    btn.id = 'dark-mode-toggle';
    btn.className = 'dark-mode-toggle';
    btn.onclick = toggleDarkMode;
    const istDark = document.body.classList.contains('dark-mode');
    btn.innerHTML = istDark ? '☀️' : '🌙';
    btn.title = istDark ? 'Hellen Modus aktivieren' : 'Dunklen Modus aktivieren';
    document.body.appendChild(btn);
}

function speichereStatistik() {
    try {
        localStorage.setItem('hp_statistik', JSON.stringify(statistik));
    } catch (e) { console.error(e); }
}

function updateStatistik(frageId, richtig) {
    if (!statistik.fragen[frageId]) {
        statistik.fragen[frageId] = { richtig: 0, falsch: 0, letztes_datum: null };
    }
    if (richtig) {
        statistik.fragen[frageId].richtig++;
        statistik.gesamt_richtig++;
    } else {
        statistik.fragen[frageId].falsch++;
        statistik.gesamt_falsch++;
    }
    statistik.fragen[frageId].letztes_datum = new Date().toISOString();
    if (!statistik.gesehene_fragen.includes(frageId)) {
        statistik.gesehene_fragen.push(frageId);
    }
    const heute = new Date().toISOString().split('T')[0];
    if (!statistik.lerntage.includes(heute)) statistik.lerntage.push(heute);
    speichereStatistik();
}

function updateVokabelStatistik(vokId, gewusst) {
    if (!statistik.vokabeln[vokId]) {
        statistik.vokabeln[vokId] = { gewusst: 0, nicht_gewusst: 0, letztes_datum: null };
    }
    if (gewusst) {
        statistik.vokabeln[vokId].gewusst++;
        statistik.vokabeln_gewusst++;
    } else {
        statistik.vokabeln[vokId].nicht_gewusst++;
    }
    statistik.vokabeln_gesehen++;
    statistik.vokabeln[vokId].letztes_datum = new Date().toISOString();
    if (!statistik.gesehene_vokabeln.includes(vokId)) {
        statistik.gesehene_vokabeln.push(vokId);
    }
    const heute = new Date().toISOString().split('T')[0];
    if (!statistik.lerntage.includes(heute)) statistik.lerntage.push(heute);
    speichereStatistik();
}

// ================================================
// LESEZEICHEN
// ================================================
function speichereLesezeichen(modusName) {
    if (!aktuelleFragen || aktuelleFragen.length === 0) return;
    const verbleibendeIds = aktuelleFragen.slice(aktuelleIndex).map(f => f.id);
    if (verbleibendeIds.length > 0 && verbleibendeIds.length < aktuelleFragen.length) {
        statistik.lesezeichen[modusName] = {
            verbleibende_ids: verbleibendeIds,
            richtig: rundenRichtig, falsch: rundenFalsch,
            datum: new Date().toISOString(), typ: 'fragen'
        };
        speichereStatistik();
    } else if (statistik.lesezeichen[modusName]) {
        delete statistik.lesezeichen[modusName];
        speichereStatistik();
    }
}

function speichereVokabelLesezeichen(modusName) {
    if (!aktuelleVokabeln || aktuelleVokabeln.length === 0) return;
    const verbleibendeIds = aktuelleVokabeln.slice(aktuelleIndex).map(v => v.id);
    if (verbleibendeIds.length > 0 && verbleibendeIds.length < aktuelleVokabeln.length) {
        statistik.lesezeichen[modusName] = {
            verbleibende_ids: verbleibendeIds,
            richtig: rundenRichtig, falsch: rundenFalsch,
            vokabel_richtung: vokabelRichtung,
            datum: new Date().toISOString(), typ: 'vokabeln'
        };
        speichereStatistik();
    } else if (statistik.lesezeichen[modusName]) {
        delete statistik.lesezeichen[modusName];
        speichereStatistik();
    }
}

function hatLesezeichen(modusName) {
    return statistik.lesezeichen && statistik.lesezeichen[modusName] !== undefined;
}

function loescheLesezeichen(modusName) {
    if (statistik.lesezeichen && statistik.lesezeichen[modusName]) {
        delete statistik.lesezeichen[modusName];
        speichereStatistik();
    }
}

function fragenFortsetzen(modusName, callbackNeu, callbackFortsetzen) {
    if (hatLesezeichen(modusName)) {
        const lz = statistik.lesezeichen[modusName];
        const anzahl = lz.verbleibende_ids.length;
        const datum = lz.datum.substring(0, 10);
        if (confirm(`Du hast in diesem Modus noch ${anzahl} offene Aufgaben (zuletzt: ${datum}).\n\nOK = Weitermachen\nAbbrechen = Neu starten`)) {
            callbackFortsetzen(lz);
        } else {
            if (confirm("Wirklich neu starten? Der Fortschritt geht verloren!")) {
                loescheLesezeichen(modusName);
                callbackNeu();
            }
        }
    } else {
        callbackNeu();
    }
}

// ================================================
// AUSSPRACHE (Web Speech API)
// ================================================
function spreche(text, sprache) {
    if (!('speechSynthesis' in window)) {
        alert("⚠️ Dein Browser unterstützt keine Sprachausgabe.");
        return;
    }
    // Stoppe laufende Sprachausgabe
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Sprache wählen: 'de-DE' für Deutsch, 'la' für Latein (fallback Deutsch)
    if (sprache === 'lat') {
        utterance.lang = 'de-DE'; // Latein wird mit deutschem TTS gut ausgesprochen
        utterance.rate = 0.85; // Etwas langsamer für Latein
    } else {
        utterance.lang = 'de-DE';
        utterance.rate = 0.95;
    }
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
}

// ================================================
// HAUPTMENÜ
// ================================================
function zeigeHauptmenue() {
    const app = document.getElementById('app');
    const gesamt = statistik.gesamt_richtig + statistik.gesamt_falsch;
    const quote = gesamt > 0 ? ((statistik.gesamt_richtig / gesamt) * 100).toFixed(0) : 0;

    // Lesezeichen-Übersicht
    let lesezeichenBox = '';
    const lzKeys = Object.keys(statistik.lesezeichen || {});
    if (lzKeys.length > 0) {
        lesezeichenBox = `<div class="section-title">🔖 ANGEFANGENE MODI</div><div class="modus-list">`;
        lzKeys.forEach(modName => {
            const lz = statistik.lesezeichen[modName];
            const anz = lz.verbleibende_ids.length;
            lesezeichenBox += `
                <div class="lesezeichen-item">
                    <span>📌 ${modName}: <strong>${anz}</strong> offen</span>
                </div>
            `;
        });
        lesezeichenBox += `</div>`;
    }

    app.innerHTML = `
        <div class="view">
            <div class="header">
                <h1>🌿 HP Lern-App</h1>
                <p class="untertitel">Heilpraktiker-Prüfung Vorbereitung</p>
            </div>

            <div class="stats-badge">
                <div class="stat-item"><div class="stat-value">${fragenkatalog.length}</div><div class="stat-label">Fragen</div></div>
                <div class="stat-item"><div class="stat-value">${vokabeln.length}</div><div class="stat-label">Vokabeln</div></div>
                <div class="stat-item"><div class="stat-value">${quote}%</div><div class="stat-label">Quote</div></div>
                <div class="stat-item"><div class="stat-value">${statistik.lerntage.length}</div><div class="stat-label">Tage</div></div>
            </div>

            ${lesezeichenBox}

            <div class="section-title">📝 PRÜFUNGSFRAGEN</div>
            <div class="modus-list">
                <button class="modus-btn" onclick="starteZufallsmodus()">
                    <div class="modus-icon">🎲</div>
                    <div class="modus-info"><div class="modus-titel">Zufallsmodus</div><div class="modus-beschreibung">Alle Fragen zufällig</div></div>
                </button>
                <button class="modus-btn" onclick="zeigeThemenauswahl()">
                    <div class="modus-icon">📂</div>
                    <div class="modus-info"><div class="modus-titel">Themen-Modus</div><div class="modus-beschreibung">Nach Thema lernen</div></div>
                </button>
                <button class="modus-btn" onclick="starteNeueFragen()">
                    <div class="modus-icon">🆕</div>
                    <div class="modus-info"><div class="modus-titel">Neue Fragen</div><div class="modus-beschreibung">Nur unbearbeitete</div></div>
                </button>
                <button class="modus-btn" onclick="starteFehlermodus()">
                    <div class="modus-icon">❌</div>
                    <div class="modus-info"><div class="modus-titel">Fehler-Wiederholung</div><div class="modus-beschreibung">Falsch beantwortete</div></div>
                </button>
                <button class="modus-btn" onclick="startePruefung()">
                    <div class="modus-icon">⏱️</div>
                    <div class="modus-info"><div class="modus-titel">Prüfungssimulation</div><div class="modus-beschreibung">60 Fragen wie echte Prüfung</div></div>
                </button>
                <button class="modus-btn" onclick="starteCrashkurs()">
                    <div class="modus-icon">🔥</div>
                    <div class="modus-info"><div class="modus-titel">Crashkurs</div><div class="modus-beschreibung">Nur hochrelevante</div></div>
                </button>
            </div>

            <div class="section-title">📚 VOKABELTRAINER</div>
            <div class="modus-list">
                <button class="modus-btn modus-btn-vokabel" onclick="starteVokabelnAlle()">
                    <div class="modus-icon">🎴</div>
                    <div class="modus-info"><div class="modus-titel">Alle Vokabeln</div><div class="modus-beschreibung">Karteikarten mischen</div></div>
                </button>
                <button class="modus-btn modus-btn-vokabel" onclick="starteNeueVokabeln()">
                    <div class="modus-icon">🆕</div>
                    <div class="modus-info"><div class="modus-titel">Neue Vokabeln</div><div class="modus-beschreibung">Nur unbearbeitete</div></div>
                </button>
                <button class="modus-btn modus-btn-vokabel" onclick="zeigeVokabelKategorien()">
                    <div class="modus-icon">🏷️</div>
                    <div class="modus-info"><div class="modus-titel">Nach Kategorie</div><div class="modus-beschreibung">Hormone, Anatomie, etc.</div></div>
                </button>
                <button class="modus-btn modus-btn-vokabel" onclick="starteVokabelnSchwer()">
                    <div class="modus-icon">💪</div>
                    <div class="modus-info"><div class="modus-titel">Schwierige Vokabeln</div><div class="modus-beschreibung">Nicht gewusste wiederholen</div></div>
                </button>
                <button class="modus-btn modus-btn-vokabel" onclick="starteVokabelnDeLat()">
                    <div class="modus-icon">🔄</div>
                    <div class="modus-info"><div class="modus-titel">Deutsch → Latein</div><div class="modus-beschreibung">Andere Richtung üben</div></div>
                </button>
            </div>

            <div class="section-title">☁️ STATISTIK SYNCHRONISIEREN</div>
            <div class="modus-list">
                <button class="modus-btn" onclick="exportiereStatistik()" style="border-left: 4px solid #4CAF50;">
                    <div class="modus-icon">📤</div>
                    <div class="modus-info"><div class="modus-titel">Statistik exportieren</div><div class="modus-beschreibung">Als Datei für anderes Gerät</div></div>
                </button>
                <button class="modus-btn" onclick="importiereStatistik()" style="border-left: 4px solid #2196F3;">
                    <div class="modus-icon">📥</div>
                    <div class="modus-info"><div class="modus-titel">Statistik importieren</div><div class="modus-beschreibung">Von anderem Gerät einfügen</div></div>
                </button>
            </div>

            <div class="section-title">📊 ÜBERSICHT</div>
            <div class="modus-list">
                <button class="modus-btn" onclick="zeigeStatistik()">
                    <div class="modus-icon">📊</div>
                    <div class="modus-info"><div class="modus-titel">Statistik</div><div class="modus-beschreibung">Lernfortschritt anzeigen</div></div>
                </button>
            </div>

            <input type="file" id="import-datei" accept=".json" style="display:none;" onchange="verarbeiteImportDatei(event)">
        </div>
    `;
}

// ================================================
// IMPORT/EXPORT
// ================================================
function exportiereStatistik() {
    const exportDaten = {
        version: "1.0",
        exportiert_am: new Date().toISOString(),
        geraet: navigator.userAgent.includes('Mobile') ? 'Handy' : 'Computer',
        statistik: statistik
    };

    const blob = new Blob([JSON.stringify(exportDaten, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const heute = new Date().toISOString().split('T')[0];

    const a = document.createElement('a');
    a.href = url;
    a.download = `statistik_${heute}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`✅ Statistik exportiert!\n\n📁 Datei: statistik_${heute}.json\n\n💡 Sende diese Datei an dein anderes Gerät (z.B. per WhatsApp, E-Mail oder Cloud) und importiere sie dort!`);
}

function importiereStatistik() {
    document.getElementById('import-datei').click();
}

function verarbeiteImportDatei(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importDaten = JSON.parse(e.target.result);

            if (!importDaten.statistik) {
                alert("❌ Diese Datei ist keine gültige Statistik-Datei!");
                return;
            }

            const importStat = importDaten.statistik;
            const exportDatum = importDaten.exportiert_am
                ? importDaten.exportiert_am.substring(0, 10)
                : 'unbekannt';
            const geraet = importDaten.geraet || 'unbekannt';

            const meldung = `📥 IMPORT-VORSCHAU\n\n` +
                `📅 Exportiert: ${exportDatum}\n` +
                `📱 Von Gerät: ${geraet}\n\n` +
                `📝 Beantwortete Fragen: ${(importStat.gesamt_richtig || 0) + (importStat.gesamt_falsch || 0)}\n` +
                `📚 Bearbeitete Vokabeln: ${importStat.vokabeln_gesehen || 0}\n` +
                `📅 Lerntage: ${(importStat.lerntage || []).length}\n\n` +
                `🔀 SMART MERGE wird die Daten ZUSAMMENFÜHREN (nicht überschreiben).\n\n` +
                `Fortfahren?`;

            if (confirm(meldung)) {
                smartMerge(importStat);
                alert("✅ Import erfolgreich!\n\nDeine Statistik wurde zusammengeführt. 🎉");
                zeigeHauptmenue();
            }
        } catch (e) {
            alert("❌ Fehler beim Lesen der Datei:\n\n" + e.message);
        }
    };
    reader.readAsText(file);
    // Reset für nächsten Import
    event.target.value = '';
}

function smartMerge(importStat) {
    // Fragen-Statistik mergen
    if (importStat.fragen) {
        Object.keys(importStat.fragen).forEach(id => {
            if (!statistik.fragen[id]) {
                statistik.fragen[id] = { richtig: 0, falsch: 0, letztes_datum: null };
            }
            statistik.fragen[id].richtig = Math.max(
                statistik.fragen[id].richtig || 0,
                importStat.fragen[id].richtig || 0
            );
            statistik.fragen[id].falsch = Math.max(
                statistik.fragen[id].falsch || 0,
                importStat.fragen[id].falsch || 0
            );
            // Neuestes Datum nehmen
            const altDatum = statistik.fragen[id].letztes_datum;
            const neuDatum = importStat.fragen[id].letztes_datum;
            if (neuDatum && (!altDatum || neuDatum > altDatum)) {
                statistik.fragen[id].letztes_datum = neuDatum;
            }
        });
    }

    // Vokabel-Statistik mergen
    if (importStat.vokabeln) {
        Object.keys(importStat.vokabeln).forEach(id => {
            if (!statistik.vokabeln[id]) {
                statistik.vokabeln[id] = { gewusst: 0, nicht_gewusst: 0, letztes_datum: null };
            }
            statistik.vokabeln[id].gewusst = Math.max(
                statistik.vokabeln[id].gewusst || 0,
                importStat.vokabeln[id].gewusst || 0
            );
            statistik.vokabeln[id].nicht_gewusst = Math.max(
                statistik.vokabeln[id].nicht_gewusst || 0,
                importStat.vokabeln[id].nicht_gewusst || 0
            );
        });
    }

    // Gesamt-Zähler: nimm den höheren Wert
    statistik.gesamt_richtig = Math.max(statistik.gesamt_richtig || 0, importStat.gesamt_richtig || 0);
    statistik.gesamt_falsch = Math.max(statistik.gesamt_falsch || 0, importStat.gesamt_falsch || 0);
    statistik.vokabeln_gesehen = Math.max(statistik.vokabeln_gesehen || 0, importStat.vokabeln_gesehen || 0);
    statistik.vokabeln_gewusst = Math.max(statistik.vokabeln_gewusst || 0, importStat.vokabeln_gewusst || 0);

    // Lerntage zusammenführen (eindeutig)
    const alteTage = new Set(statistik.lerntage || []);
    (importStat.lerntage || []).forEach(t => alteTage.add(t));
    statistik.lerntage = Array.from(alteTage).sort();

    // Gesehene Fragen/Vokabeln zusammenführen
    const fragenSet = new Set(statistik.gesehene_fragen || []);
    (importStat.gesehene_fragen || []).forEach(id => fragenSet.add(id));
    statistik.gesehene_fragen = Array.from(fragenSet);

    const vokSet = new Set(statistik.gesehene_vokabeln || []);
    (importStat.gesehene_vokabeln || []).forEach(id => vokSet.add(id));
    statistik.gesehene_vokabeln = Array.from(vokSet);

    // Lesezeichen: vom Import übernehmen (sind aktueller)
    if (importStat.lesezeichen) {
        Object.keys(importStat.lesezeichen).forEach(modus => {
            const altLZ = statistik.lesezeichen[modus];
            const neuLZ = importStat.lesezeichen[modus];
            // Nimm das neuere Lesezeichen
            if (!altLZ || (neuLZ.datum && neuLZ.datum > altLZ.datum)) {
                statistik.lesezeichen[modus] = neuLZ;
            }
        });
    }

    speichereStatistik();
}

// ================================================
// HELPER
// ================================================
function shuffleArray(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// ================================================
// FRAGEN-MODI
// ================================================
function starteZufallsmodus() {
    fragenFortsetzen("Zufallsmodus", starteZufallsmodusNeu, setzeZufallsmodusFort);
}

function starteZufallsmodusNeu() {
    aktuelleFragen = shuffleArray(fragenkatalog);
    aktuelleIndex = 0;
    aktuellerModus = "Zufallsmodus";
    rundenRichtig = 0; rundenFalsch = 0;
    zeigeFrage();
}

function setzeZufallsmodusFort(lz) {
    const ids = lz.verbleibende_ids;
    aktuelleFragen = fragenkatalog.filter(f => ids.includes(f.id))
                                  .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    aktuelleIndex = 0;
    aktuellerModus = "Zufallsmodus";
    rundenRichtig = lz.richtig || 0;
    rundenFalsch = lz.falsch || 0;
    zeigeFrage();
}

function zeigeThemenauswahl() {
    const themen = {};
    fragenkatalog.forEach(f => {
        const t = f.thema || "Unbekannt";
        themen[t] = (themen[t] || 0) + 1;
    });

    const app = document.getElementById('app');
    let html = `
        <div class="view">
            <button class="zurueck-btn" onclick="zeigeHauptmenue()">← Zurück</button>
            <div class="header"><h1>📂 Thema wählen</h1></div>
            <div class="themen-liste">
    `;
    Object.entries(themen).sort().forEach(([thema, anzahl]) => {
        html += `
            <button class="themen-item" onclick="starteThema('${thema.replace(/'/g, "\\'")}')">
                <span class="themen-name">${thema}</span>
                <span class="themen-anzahl">${anzahl}</span>
            </button>
        `;
    });
    html += `</div></div>`;
    app.innerHTML = html;
}

function starteThema(thema) {
    const modusName = `Thema: ${thema}`;
    fragenFortsetzen(modusName,
        () => {
            aktuelleFragen = shuffleArray(fragenkatalog.filter(f => f.thema === thema));
            aktuelleIndex = 0;
            aktuellerModus = modusName;
            rundenRichtig = 0; rundenFalsch = 0;
            zeigeFrage();
        },
        (lz) => {
            const ids = lz.verbleibende_ids;
            aktuelleFragen = fragenkatalog.filter(f => ids.includes(f.id))
                                          .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
            aktuelleIndex = 0;
            aktuellerModus = modusName;
            rundenRichtig = lz.richtig || 0;
            rundenFalsch = lz.falsch || 0;
            zeigeFrage();
        }
    );
}

function starteNeueFragen() {
    const gesehen = new Set(statistik.gesehene_fragen || []);
    const neue = fragenkatalog.filter(f => !gesehen.has(f.id));
    if (neue.length === 0) {
        alert("🎉 Glückwunsch! Du hast bereits alle Fragen mindestens einmal beantwortet!");
        return;
    }
    aktuelleFragen = shuffleArray(neue);
    aktuelleIndex = 0;
    aktuellerModus = `🆕 Neue Fragen (${neue.length})`;
    rundenRichtig = 0; rundenFalsch = 0;
    zeigeFrage();
}

function starteFehlermodus() {
    const fehlerIds = Object.entries(statistik.fragen)
        .filter(([id, s]) => s.falsch > s.richtig)
        .map(([id]) => id);
    if (fehlerIds.length === 0) {
        alert("Noch keine falsch beantworteten Fragen!");
        return;
    }
    aktuelleFragen = shuffleArray(fragenkatalog.filter(f => fehlerIds.includes(f.id)));
    aktuelleIndex = 0;
    aktuellerModus = "Fehler-Wiederholung";
    rundenRichtig = 0; rundenFalsch = 0;
    zeigeFrage();
}

function startePruefung() {
    if (fragenkatalog.length < 10) {
        alert(`Zu wenig Fragen! Du hast ${fragenkatalog.length}, empfohlen 60.`);
        return;
    }
    const anzahl = Math.min(60, fragenkatalog.length);
    aktuelleFragen = shuffleArray(fragenkatalog).slice(0, anzahl);
    aktuelleIndex = 0;
    aktuellerModus = "Prüfungssimulation";
    rundenRichtig = 0; rundenFalsch = 0;
    zeigeFrage();
}

function starteCrashkurs() {
    fragenFortsetzen("🔥 Crashkurs", starteCrashkursNeu, setzeCrashkursFort);
}

function starteCrashkursNeu() {
    const relevante = fragenkatalog.filter(f => f.pruefungsrelevanz === "hoch");
    if (relevante.length === 0) { alert("Keine hochrelevanten Fragen markiert!"); return; }
    aktuelleFragen = shuffleArray(relevante);
    aktuelleIndex = 0;
    aktuellerModus = "🔥 Crashkurs";
    rundenRichtig = 0; rundenFalsch = 0;
    zeigeFrage();
}

function setzeCrashkursFort(lz) {
    const ids = lz.verbleibende_ids;
    aktuelleFragen = fragenkatalog.filter(f => ids.includes(f.id))
                                  .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    aktuelleIndex = 0;
    aktuellerModus = "🔥 Crashkurs";
    rundenRichtig = lz.richtig || 0;
    rundenFalsch = lz.falsch || 0;
    zeigeFrage();
}

// ================================================
// VOKABEL-MODI
// ================================================
function starteVokabelnAlle() {
    if (vokabeln.length === 0) { alert("Noch keine Vokabeln vorhanden!"); return; }
    fragenFortsetzen("Alle Vokabeln", starteVokabelnAlleNeu, setzeVokabelnAlleFort);
}

function starteVokabelnAlleNeu() {
    aktuelleVokabeln = shuffleArray(vokabeln);
    aktuelleIndex = 0;
    aktuellerModus = "Alle Vokabeln";
    vokabelRichtung = "lat_to_de";
    rundenRichtig = 0; rundenFalsch = 0;
    karteUmgedreht = false;
    zeigeVokabelKarte();
}

function setzeVokabelnAlleFort(lz) {
    const ids = lz.verbleibende_ids;
    aktuelleVokabeln = vokabeln.filter(v => ids.includes(v.id))
                                .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    aktuelleIndex = 0;
    aktuellerModus = "Alle Vokabeln";
    vokabelRichtung = lz.vokabel_richtung || "lat_to_de";
    rundenRichtig = lz.richtig || 0;
    rundenFalsch = lz.falsch || 0;
    karteUmgedreht = false;
    zeigeVokabelKarte();
}

function starteVokabelnDeLat() {
    if (vokabeln.length === 0) { alert("Noch keine Vokabeln vorhanden!"); return; }
    fragenFortsetzen("Deutsch → Latein", starteVokabelnDeLatNeu, setzeVokabelnDeLatFort);
}

function starteVokabelnDeLatNeu() {
    aktuelleVokabeln = shuffleArray(vokabeln);
    aktuelleIndex = 0;
    aktuellerModus = "Deutsch → Latein";
    vokabelRichtung = "de_to_lat";
    rundenRichtig = 0; rundenFalsch = 0;
    karteUmgedreht = false;
    zeigeVokabelKarte();
}

function setzeVokabelnDeLatFort(lz) {
    const ids = lz.verbleibende_ids;
    aktuelleVokabeln = vokabeln.filter(v => ids.includes(v.id))
                                .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    aktuelleIndex = 0;
    aktuellerModus = "Deutsch → Latein";
    vokabelRichtung = "de_to_lat";
    rundenRichtig = lz.richtig || 0;
    rundenFalsch = lz.falsch || 0;
    karteUmgedreht = false;
    zeigeVokabelKarte();
}

function starteVokabelnSchwer() {
    const schwierigeIds = Object.entries(statistik.vokabeln || {})
        .filter(([id, s]) => s.nicht_gewusst > s.gewusst)
        .map(([id]) => id);
    if (schwierigeIds.length === 0) {
        alert("Noch keine schwierigen Vokabeln markiert!\nÜbe erst ein paar Vokabeln.");
        return;
    }
    aktuelleVokabeln = shuffleArray(vokabeln.filter(v => schwierigeIds.includes(v.id)));
    aktuelleIndex = 0;
    aktuellerModus = "💪 Schwierige Vokabeln";
    vokabelRichtung = "lat_to_de";
    rundenRichtig = 0; rundenFalsch = 0;
    karteUmgedreht = false;
    zeigeVokabelKarte();
}

function starteNeueVokabeln() {
    const gesehen = new Set(statistik.gesehene_vokabeln || []);
    const neue = vokabeln.filter(v => !gesehen.has(v.id));
    if (neue.length === 0) {
        alert("🎉 Glückwunsch! Du hast bereits alle Vokabeln mindestens einmal bearbeitet!");
        return;
    }
    aktuelleVokabeln = shuffleArray(neue);
    aktuelleIndex = 0;
    aktuellerModus = `🆕 Neue Vokabeln (${neue.length})`;
    vokabelRichtung = "lat_to_de";
    rundenRichtig = 0; rundenFalsch = 0;
    karteUmgedreht = false;
    zeigeVokabelKarte();
}

function zeigeVokabelKategorien() {
    const kategorien = {};
    vokabeln.forEach(v => {
        const k = v.kategorie || "Sonstige";
        kategorien[k] = (kategorien[k] || 0) + 1;
    });

    const app = document.getElementById('app');
    let html = `
        <div class="view">
            <button class="zurueck-btn" onclick="zeigeHauptmenue()">← Zurück</button>
            <div class="header"><h1>🏷️ Vokabel-Kategorie</h1></div>
            <div class="themen-liste">
    `;
    Object.entries(kategorien).sort().forEach(([kat, anzahl]) => {
        html += `
            <button class="themen-item" onclick="starteVokabelKategorie('${kat.replace(/'/g, "\\'")}')">
                <span class="themen-name">📚 ${kat}</span>
                <span class="themen-anzahl">${anzahl}</span>
            </button>
        `;
    });
    html += `</div></div>`;
    app.innerHTML = html;
}

function starteVokabelKategorie(kategorie) {
    aktuelleVokabeln = shuffleArray(vokabeln.filter(v => v.kategorie === kategorie));
    aktuelleIndex = 0;
    aktuellerModus = `🏷️ ${kategorie}`;
    vokabelRichtung = "lat_to_de";
    rundenRichtig = 0; rundenFalsch = 0;
    karteUmgedreht = false;
    zeigeVokabelKarte();
}

// ================================================
// VOKABEL-KARTEIKARTE MIT AUSSPRACHE
// ================================================
function zeigeVokabelKarte() {
    if (aktuelleIndex >= aktuelleVokabeln.length) {
        if (aktuellerModus && statistik.lesezeichen[aktuellerModus]) {
            delete statistik.lesezeichen[aktuellerModus];
            speichereStatistik();
        }
        zeigeVokabelErgebnis();
        return;
    }

    const vokabel = aktuelleVokabeln[aktuelleIndex];
    const app = document.getElementById('app');
    const progress = (aktuelleIndex / aktuelleVokabeln.length) * 100;
    const vorderseite = vokabelRichtung === "lat_to_de" ? vokabel.lateinisch : vokabel.deutsch;
    const rueckseite = vokabelRichtung === "lat_to_de" ? vokabel.deutsch : vokabel.lateinisch;
    const labelVorne = vokabelRichtung === "lat_to_de" ? "LATEINISCH" : "DEUTSCH";
    const labelHinten = vokabelRichtung === "lat_to_de" ? "DEUTSCH" : "LATEINISCH";

    app.innerHTML = `
        <div class="view">
            <button class="zurueck-btn" onclick="vokabelnZurueckZumMenue()">🏠 Hauptmenü (speichern)</button>
            <div class="frage-header">
                <span>📚 ${aktuellerModus}</span>
                <span><strong>${aktuelleIndex + 1} / ${aktuelleVokabeln.length}</strong></span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="meta-info">
                <span class="meta-badge">🏷️ ${vokabel.kategorie || ''}</span>
                <span class="meta-badge schwierigkeit">📊 ${(vokabel.schwierigkeit || '').toUpperCase()}</span>
                <span class="meta-badge">📖 Seite ${vokabel.seite || '?'}</span>
            </div>

            <div class="karteikarte" onclick="karteUmdrehen(event)">
                ${!karteUmgedreht ? `
                    <div class="karte-label">${labelVorne}</div>
                    <div class="karte-text-with-speaker">
                        <span>${vorderseite}</span>
                        <button class="speaker-btn" onclick="event.stopPropagation(); spreche('${vorderseite.replace(/'/g, "\\'")}', '${vokabelRichtung === 'lat_to_de' ? 'lat' : 'de'}')" title="Aussprache">
                            🔊
                        </button>
                    </div>
                    <div class="karte-hinweis">👆 Tippen zum Umdrehen</div>
                ` : `
                    <div class="karte-label-back">${labelHinten}</div>
                    <div class="karte-text-with-speaker">
                        <span>${rueckseite}</span>
                        <button class="speaker-btn" onclick="event.stopPropagation(); spreche('${rueckseite.replace(/'/g, "\\'")}', '${vokabelRichtung === 'lat_to_de' ? 'de' : 'lat'}')" title="Aussprache">
                            🔊
                        </button>
                    </div>
                    ${vokabel.eselsbruecke ? `
                        <div class="karte-extra">
                            <strong>💡 Eselsbrücke:</strong><br>${vokabel.eselsbruecke}
                        </div>
                    ` : ''}
                    ${vokabel.herkunft ? `
                        <div class="karte-extra-klein">
                            <strong>📖 Herkunft:</strong> ${vokabel.herkunft}
                        </div>
                    ` : ''}
                    ${vokabel.beispiel ? `
                        <div class="karte-extra-klein">
                            <strong>💬 Beispiel:</strong> ${vokabel.beispiel}
                        </div>
                    ` : ''}
                `}
            </div>

            ${karteUmgedreht ? `
                <div class="vokabel-bewertung">
                    <button class="btn-bewertung btn-nicht-gewusst" onclick="bewerteVokabel(false)">❌ Nicht gewusst</button>
                    <button class="btn-bewertung btn-gewusst" onclick="bewerteVokabel(true)">✅ Gewusst</button>
                </div>
            ` : `
                <div class="info-box">
                    💭 Versuche, dich an die Übersetzung zu erinnern, dann tippe auf die Karte.<br>
                    🔊 Klicke das Lautsprecher-Symbol, um die Aussprache zu hören!
                </div>
            `}

            <div class="runden-stats">
                📊 ✅ ${rundenRichtig} gewusst · ❌ ${rundenFalsch} nicht gewusst
            </div>
        </div>
    `;
}

function karteUmdrehen(event) {
    // Verhindere Umdrehen wenn auf Lautsprecher geklickt
    if (event && event.target && event.target.classList.contains('speaker-btn')) return;
    karteUmgedreht = !karteUmgedreht;
    zeigeVokabelKarte();
}

function bewerteVokabel(gewusst) {
    const vokabel = aktuelleVokabeln[aktuelleIndex];
    updateVokabelStatistik(vokabel.id, gewusst);
    if (gewusst) rundenRichtig++;
    else rundenFalsch++;
    aktuelleIndex++;
    karteUmgedreht = false;
    // Automatisches Speichern nach jeder Vokabel
    if (aktuelleIndex < aktuelleVokabeln.length) {
        speichereVokabelLesezeichen(aktuellerModus);
    }
    zeigeVokabelKarte();
}

function vokabelnZurueckZumMenue() {
    if (aktuellerModus && aktuelleIndex > 0 && aktuelleIndex < aktuelleVokabeln.length) {
        speichereVokabelLesezeichen(aktuellerModus);
        alert(`✅ Gespeichert!\n\nDein Fortschritt im Modus "${aktuellerModus}" wurde gespeichert.\n\nDu kannst später dort weitermachen!`);
    }
    // Sprachausgabe stoppen
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    zeigeHauptmenue();
}

function zeigeVokabelErgebnis() {
    const app = document.getElementById('app');
    const gesamt = rundenRichtig + rundenFalsch;
    const quote = gesamt > 0 ? (rundenRichtig / gesamt) * 100 : 0;

    let icon, titel, farbe;
    if (quote >= 90) { icon = '🏆'; titel = 'FANTASTISCH!'; farbe = 'var(--richtig)'; }
    else if (quote >= 75) { icon = '🎯'; titel = 'SEHR GUT!'; farbe = 'var(--primary)'; }
    else if (quote >= 50) { icon = '👍'; titel = 'Ordentlich!'; farbe = 'var(--secondary)'; }
    else { icon = '📚'; titel = 'Weiter üben!'; farbe = 'var(--falsch)'; }

    app.innerHTML = `
        <div class="view ergebnis-view">
            <div class="ergebnis-icon">${icon}</div>
            <div class="ergebnis-titel">Vokabeln gelernt!</div>
            <div class="ergebnis-quote" style="color: ${farbe};">${quote.toFixed(0)}%</div>
            <div class="ergebnis-bewertung" style="color: ${farbe};">${titel}</div>
            <div class="ergebnis-stats">
                <div class="ergebnis-stat">
                    <div class="ergebnis-stat-label">✅ Gewusst</div>
                    <div class="ergebnis-stat-wert" style="color: var(--richtig);">${rundenRichtig}</div>
                </div>
                <div class="ergebnis-stat">
                    <div class="ergebnis-stat-label">❌ Nicht gewusst</div>
                    <div class="ergebnis-stat-wert" style="color: var(--falsch);">${rundenFalsch}</div>
                </div>
            </div>
            <div class="info-box">💡 Nicht gewusste Vokabeln findest du im Modus "Schwierige Vokabeln"!</div>
            <button class="btn-primary" onclick="nochmalUeben()">🔄 Nochmal üben</button>
            <button class="btn-secondary" onclick="zeigeHauptmenue()">🏠 Hauptmenü</button>
        </div>
    `;
}

// ================================================
// FRAGE ANZEIGEN
// ================================================
function zeigeFrage() {
    if (aktuelleIndex >= aktuelleFragen.length) {
        if (aktuellerModus && statistik.lesezeichen[aktuellerModus]) {
            delete statistik.lesezeichen[aktuellerModus];
            speichereStatistik();
        }
        zeigeRundenErgebnis();
        return;
    }

    const frage = aktuelleFragen[aktuelleIndex];
    const app = document.getElementById('app');
    const progress = ((aktuelleIndex / aktuelleFragen.length) * 100);
    nutzerAntwort = null;
    nutzerAntworten = [];

    let html = `
        <div class="view">
            <button class="zurueck-btn" onclick="fragenZurueckZumMenue()">🏠 Hauptmenü (speichern)</button>
            <div class="frage-header">
                <span>📖 ${aktuellerModus}</span>
                <span><strong>${aktuelleIndex + 1} / ${aktuelleFragen.length}</strong></span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="meta-info">
                <span class="meta-badge">🏷️ ${frage.thema || ''}</span>
                <span class="meta-badge schwierigkeit">📊 ${(frage.schwierigkeit || '').toUpperCase()}</span>
                <span class="meta-badge relevanz">⭐ ${(frage.pruefungsrelevanz || '').toUpperCase()}</span>
            </div>
    `;

    if (frage.typ === "fallbeispiel" && frage.fallbeschreibung) {
        html += `
            <div class="fallbeschreibung">
                <div class="fallbeschreibung-titel">📋 FALLBEISPIEL</div>
                ${frage.fallbeschreibung}
            </div>
        `;
    }

    html += `<div class="frage-text">${frage.frage}</div>`;
    const typ = frage.typ || "single_choice";

    if (typ === "single_choice" || typ === "fallbeispiel") {
        html += `<div class="optionen">`;
        frage.optionen.forEach((opt, i) => {
            html += `
                <button class="option" id="opt-${i}" onclick="waehleSingle(${i})">
                    <div class="option-buchstabe">${String.fromCharCode(65 + i)}</div>
                    <div>${opt}</div>
                </button>
            `;
        });
        html += `</div>`;
    } else if (typ === "multiple_choice") {
        html += `<div class="info-box">💡 Mehrere Antworten möglich</div>`;
        html += `<div class="optionen">`;
        frage.optionen.forEach((opt, i) => {
            html += `
                <button class="option" id="opt-${i}" onclick="toggleMulti(${i})">
                    <div class="option-buchstabe">${String.fromCharCode(65 + i)}</div>
                    <div>${opt}</div>
                </button>
            `;
        });
        html += `</div>`;
    } else if (typ === "richtig_falsch") {
        html += `
            <div class="richtig-falsch-container">
                <button class="rf-btn richtig-btn" id="rf-true" onclick="waehleRF(true)">✅<br>RICHTIG</button>
                <button class="rf-btn falsch-btn" id="rf-false" onclick="waehleRF(false)">❌<br>FALSCH</button>
            </div>
        `;
    }

    html += `<button class="btn-primary" onclick="pruefeAntwort()">✓ Antwort prüfen</button>`;
    html += `</div>`;
    app.innerHTML = html;
}

function fragenZurueckZumMenue() {
    if (aktuellerModus && aktuelleIndex > 0 && aktuelleIndex < aktuelleFragen.length) {
        speichereLesezeichen(aktuellerModus);
        alert(`✅ Gespeichert!\n\nDein Fortschritt im Modus "${aktuellerModus}" wurde gespeichert.`);
    }
    zeigeHauptmenue();
}

function waehleSingle(index) {
    nutzerAntwort = index;
    document.querySelectorAll('.option').forEach((el, i) => {
        if (i === index) el.classList.add('selected');
        else el.classList.remove('selected');
    });
}

function toggleMulti(index) {
    const idx = nutzerAntworten.indexOf(index);
    if (idx === -1) {
        nutzerAntworten.push(index);
        document.getElementById(`opt-${index}`).classList.add('selected');
    } else {
        nutzerAntworten.splice(idx, 1);
        document.getElementById(`opt-${index}`).classList.remove('selected');
    }
}

function waehleRF(wert) {
    nutzerAntwort = wert;
    document.getElementById('rf-true').classList.toggle('selected', wert === true);
    document.getElementById('rf-false').classList.toggle('selected', wert === false);
}

function pruefeAntwort() {
    const frage = aktuelleFragen[aktuelleIndex];
    const typ = frage.typ || "single_choice";
    let istRichtig = false;

    if (typ === "single_choice" || typ === "fallbeispiel") {
        if (nutzerAntwort === null) { alert("Bitte wähle eine Antwort!"); return; }
        istRichtig = nutzerAntwort === frage.richtig;
    } else if (typ === "multiple_choice") {
        if (nutzerAntworten.length === 0) { alert("Bitte wähle mindestens eine Antwort!"); return; }
        const antwort = [...nutzerAntworten].sort();
        const richtige = [...frage.richtig].sort();
        istRichtig = JSON.stringify(antwort) === JSON.stringify(richtige);
    } else if (typ === "richtig_falsch") {
        if (nutzerAntwort === null) { alert("Bitte wähle Richtig oder Falsch!"); return; }
        istRichtig = nutzerAntwort === frage.richtig;
    }

    if (istRichtig) rundenRichtig++;
    else rundenFalsch++;
    updateStatistik(frage.id, istRichtig);
    zeigeFeedback(frage, istRichtig);
}

function zeigeFeedback(frage, istRichtig) {
    const app = document.getElementById('app');
    const typ = frage.typ || "single_choice";
    let richtigeAntwortHtml = '';

    if (typ === "single_choice" || typ === "fallbeispiel") {
        richtigeAntwortHtml = `<strong>${String.fromCharCode(65 + frage.richtig)}.</strong> ${frage.optionen[frage.richtig]}`;
    } else if (typ === "multiple_choice") {
        richtigeAntwortHtml = frage.richtig.map(i =>
            `<div><strong>${String.fromCharCode(65 + i)}.</strong> ${frage.optionen[i]}</div>`
        ).join('');
    } else if (typ === "richtig_falsch") {
        richtigeAntwortHtml = `<strong>${frage.richtig ? 'RICHTIG' : 'FALSCH'}</strong>`;
    }

    const gesamt = rundenRichtig + rundenFalsch;
    const quote = gesamt > 0 ? ((rundenRichtig / gesamt) * 100).toFixed(0) : 0;

    app.innerHTML = `
        <div class="view">
            <div class="frage-header">
                <span>📖 ${aktuellerModus}</span>
                <span><strong>${aktuelleIndex + 1} / ${aktuelleFragen.length}</strong></span>
            </div>
            <div class="feedback-ergebnis ${istRichtig ? 'richtig' : 'falsch'}">
                ${istRichtig ? '✅ RICHTIG!' : '❌ LEIDER FALSCH'}
            </div>
            <div class="feedback-box">
                <div class="feedback-titel">📝 Frage:</div>
                <div class="feedback-text" style="font-style: italic;">${frage.frage}</div>
            </div>
            <div class="feedback-box">
                <div class="feedback-titel" style="color: var(--richtig);">✓ Richtige Antwort:</div>
                <div class="feedback-text">${richtigeAntwortHtml}</div>
            </div>
            <div class="erklaerung-box">
                <div class="feedback-titel" style="color: #E65100;">💡 Erklärung:</div>
                <div class="feedback-text">${frage.erklaerung || ''}</div>
            </div>
            <div class="runden-stats">📊 ✅ ${rundenRichtig} · ❌ ${rundenFalsch} · 🎯 ${quote}%</div>
            <button class="btn-primary" onclick="naechsteFrage()">➡️ Nächste Frage</button>
            <button class="btn-secondary" onclick="fragenZurueckZumMenue()">🏠 Hauptmenü (speichern)</button>
        </div>
    `;
}

function naechsteFrage() {
    aktuelleIndex++;
    // Automatisches Speichern
    if (aktuelleIndex < aktuelleFragen.length) {
        speichereLesezeichen(aktuellerModus);
    }
    zeigeFrage();
}

function zeigeRundenErgebnis() {
    const app = document.getElementById('app');
    const gesamt = rundenRichtig + rundenFalsch;
    const quote = gesamt > 0 ? (rundenRichtig / gesamt) * 100 : 0;

    let icon, titel, farbe;
    if (quote >= 90) { icon = '🏆'; titel = 'HERVORRAGEND!'; farbe = 'var(--richtig)'; }
    else if (quote >= 75) { icon = '🎯'; titel = 'SEHR GUT!'; farbe = 'var(--primary)'; }
    else if (quote >= 60) { icon = '👍'; titel = 'BESTANDEN!'; farbe = 'var(--secondary)'; }
    else { icon = '📚'; titel = 'Mehr Übung nötig'; farbe = 'var(--falsch)'; }

    app.innerHTML = `
        <div class="view ergebnis-view">
            <div class="ergebnis-icon">${icon}</div>
            <div class="ergebnis-titel">Runde beendet!</div>
            <div class="ergebnis-quote" style="color: ${farbe};">${quote.toFixed(0)}%</div>
            <div class="ergebnis-bewertung" style="color: ${farbe};">${titel}</div>
            <div class="ergebnis-stats">
                <div class="ergebnis-stat">
                    <div class="ergebnis-stat-label">✅ Richtig</div>
                    <div class="ergebnis-stat-wert" style="color: var(--richtig);">${rundenRichtig}</div>
                </div>
                <div class="ergebnis-stat">
                    <div class="ergebnis-stat-label">❌ Falsch</div>
                    <div class="ergebnis-stat-wert" style="color: var(--falsch);">${rundenFalsch}</div>
                </div>
            </div>
            <div class="info-box">Modus: <strong>${aktuellerModus}</strong><br>Prüfungsgrenze: 75%</div>
            <button class="btn-primary" onclick="nochmalUeben()">🔄 Nochmal üben</button>
            <button class="btn-secondary" onclick="zeigeHauptmenue()">🏠 Hauptmenü</button>
        </div>
    `;
}

function nochmalUeben() {
    if (aktuellerModus === "Zufallsmodus") starteZufallsmodusNeu();
    else if (aktuellerModus === "Prüfungssimulation") startePruefung();
    else if (aktuellerModus === "Fehler-Wiederholung") starteFehlermodus();
    else if (aktuellerModus === "🔥 Crashkurs") starteCrashkursNeu();
    else if (aktuellerModus === "Alle Vokabeln") starteVokabelnAlleNeu();
    else if (aktuellerModus === "Deutsch → Latein") starteVokabelnDeLatNeu();
    else if (aktuellerModus === "💪 Schwierige Vokabeln") starteVokabelnSchwer();
    else zeigeHauptmenue();
}

// ================================================
// STATISTIK
// ================================================
function zeigeStatistik() {
    const app = document.getElementById('app');
    const gesamt = statistik.gesamt_richtig + statistik.gesamt_falsch;
    const vokGesehen = statistik.vokabeln_gesehen || 0;
    const vokGewusst = statistik.vokabeln_gewusst || 0;

    let html = `
        <div class="view">
            <button class="zurueck-btn" onclick="zeigeHauptmenue()">← Zurück</button>
            <div class="stats-titel">📊 Deine Statistik</div>
    `;

    if (gesamt === 0 && vokGesehen === 0) {
        html += `<div class="info-box">Noch keine Daten.<br>Beantworte Fragen oder lerne Vokabeln!</div>`;
    } else {
        const quote = gesamt > 0 ? ((statistik.gesamt_richtig / gesamt) * 100).toFixed(1) : 0;
        const vokQuote = vokGesehen > 0 ? ((vokGewusst / vokGesehen) * 100).toFixed(1) : 0;

        html += `
            <div class="section-title">📝 Prüfungsfragen</div>
            <div class="stats-grid">
                <div class="ergebnis-stat"><div class="ergebnis-stat-label">📅 Lerntage</div><div class="ergebnis-stat-wert">${statistik.lerntage.length}</div></div>
                <div class="ergebnis-stat"><div class="ergebnis-stat-label">📊 Beantwortet</div><div class="ergebnis-stat-wert">${gesamt}</div></div>
                <div class="ergebnis-stat"><div class="ergebnis-stat-label">✅ Richtig</div><div class="ergebnis-stat-wert" style="color: var(--richtig);">${statistik.gesamt_richtig}</div></div>
                <div class="ergebnis-stat"><div class="ergebnis-stat-label">🎯 Quote</div><div class="ergebnis-stat-wert" style="color: var(--primary);">${quote}%</div></div>
            </div>
            <div class="section-title">📚 Vokabeln</div>
            <div class="stats-grid">
                <div class="ergebnis-stat"><div class="ergebnis-stat-label">📚 Gesehen</div><div class="ergebnis-stat-wert">${vokGesehen}</div></div>
                <div class="ergebnis-stat"><div class="ergebnis-stat-label">✅ Gewusst</div><div class="ergebnis-stat-wert" style="color: var(--richtig);">${vokGewusst}</div></div>
                <div class="ergebnis-stat"><div class="ergebnis-stat-label">🎯 Quote</div><div class="ergebnis-stat-wert" style="color: var(--primary);">${vokQuote}%</div></div>
                <div class="ergebnis-stat"><div class="ergebnis-stat-label">📖 Vokabeln</div><div class="ergebnis-stat-wert">${Object.keys(statistik.vokabeln || {}).length} / ${vokabeln.length}</div></div>
            </div>
        `;
    }

    html += `
            <button class="btn-secondary" onclick="statistikZuruecksetzen()" style="margin-top: 24px; color: var(--falsch);">🗑️ Statistik zurücksetzen</button>
        </div>
    `;
    app.innerHTML = html;
}

function statistikZuruecksetzen() {
    if (confirm("Möchtest du ALLE Statistik-Daten löschen?\nDas kann nicht rückgängig gemacht werden!")) {
        statistik = {
            fragen: {}, vokabeln: {},
            gesamt_richtig: 0, gesamt_falsch: 0,
            vokabeln_gesehen: 0, vokabeln_gewusst: 0,
            lerntage: [], lesezeichen: {},
            gesehene_fragen: [], gesehene_vokabeln: []
        };
        speichereStatistik();
        zeigeHauptmenue();
    }
}

// ================================================
// APP STARTEN
// ================================================
initApp();
