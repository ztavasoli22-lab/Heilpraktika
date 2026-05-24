// ================================================
// Heilpraktiker Lern-App v3.0
// Mit Lesezeichen-Funktion!
// ================================================

let fragenkatalog = [];
let vokabeln = [];
let statistik = {
    fragen: {},
    vokabeln: {},
    gesamt_richtig: 0,
    gesamt_falsch: 0,
    vokabeln_gesehen: 0,
    vokabeln_gewusst: 0,
    lerntage: [],
    lesezeichen: {},
    gesehene_fragen: [],
    gesehene_vokabeln: []
};

let aktuelleFragen = [];
let aktuelleIndex = 0;
let aktuellerModus = "";
let rundenRichtig = 0;
let rundenFalsch = 0;
let nutzerAntwort = null;
let nutzerAntworten = [];

let aktuelleVokabeln = [];
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
            if (!statistik.vokabeln) statistik.vokabeln = {};
            if (!statistik.vokabeln_gesehen) statistik.vokabeln_gesehen = 0;
            if (!statistik.vokabeln_gewusst) statistik.vokabeln_gewusst = 0;
            if (!statistik.lesezeichen) statistik.lesezeichen = {};
            if (!statistik.gesehene_fragen) statistik.gesehene_fragen = [];
            if (!statistik.gesehene_vokabeln) statistik.gesehene_vokabeln = [];
        } catch (e) { console.error(e); }
    }

    try {
        const response = await fetch('fragenkatalog.json');
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

function speichereStatistik() {
    try { localStorage.setItem('hp_statistik', JSON.stringify(statistik)); }
    catch (e) { console.error(e); }
}

function updateStatistik(frageId, richtig) {
    if (!statistik.fragen[frageId]) {
        statistik.fragen[frageId] = { richtig: 0, falsch: 0, letztes_datum: null };
    }
    if (richtig) {
        statistik.fragen[frageId].richtig++;
        statistik.gesamt_richtig++;
        rundenRichtig++;
    } else {
        statistik.fragen[frageId].falsch++;
        statistik.gesamt_falsch++;
        rundenFalsch++;
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
// LESEZEICHEN-FUNKTIONEN (v3.0)
// ================================================
function speichereLesezeichen(modusName) {
    if (!aktuelleFragen || aktuelleFragen.length === 0) return;
    const verbleibendeIds = aktuelleFragen.slice(aktuelleIndex).map(f => f.id);
    if (verbleibendeIds.length > 0 && verbleibendeIds.length < aktuelleFragen.length) {
        statistik.lesezeichen[modusName] = {
            verbleibende_ids: verbleibendeIds,
            richtig: rundenRichtig,
            falsch: rundenFalsch,
            datum: new Date().toISOString(),
            typ: 'fragen'
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
            richtig: rundenRichtig,
            falsch: rundenFalsch,
            vokabel_richtung: vokabelRichtung,
            datum: new Date().toISOString(),
            typ: 'vokabeln'
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

function fragenZurueckZumMenue() {
    if (aktuellerModus && aktuelleIndex > 0) {
        speichereLesezeichen(aktuellerModus);
        alert(`✅ Gespeichert!\n\nDein Fortschritt im Modus "${aktuellerModus}" wurde gespeichert.\n\nDu kannst später dort weitermachen!`);
    }
    zeigeHauptmenue();
}

function vokabelnZurueckZumMenue() {
    if (aktuellerModus && aktuelleIndex > 0) {
        speichereVokabelLesezeichen(aktuellerModus);
        alert(`✅ Gespeichert!\n\nDein Fortschritt im Modus "${aktuellerModus}" wurde gespeichert.\n\nDu kannst später dort weitermachen!`);
    }
    zeigeHauptmenue();
}

function fragenFortsetzen(modusName, callbackNeu, callbackFortsetzen) {
    if (hatLesezeichen(modusName)) {
        const lz = statistik.lesezeichen[modusName];
        const anzahl = lz.verbleibende_ids.length;
        const datum = lz.datum.substring(0, 10);
        const meldung = `Du hast in diesem Modus noch ${anzahl} offene Aufgaben (zuletzt: ${datum}).\n\nOK = Wo aufgehört weitermachen\nAbbrechen = Neu starten`;
        if (confirm(meldung)) {
            callbackFortsetzen(lz);
        } else {
            if (confirm("Wirklich neu starten? Der gespeicherte Fortschritt geht verloren!")) {
                loescheLesezeichen(modusName);
                callbackNeu();
            }
        }
    } else {
        callbackNeu();
    }
}

// ================================================
// HAUPTMENÜ
// ================================================
function zeigeHauptmenue() {
    const app = document.getElementById('app');
    const gesamt = statistik.gesamt_richtig + statistik.gesamt_falsch;
    const quote = gesamt > 0 ? ((statistik.gesamt_richtig / gesamt) * 100).toFixed(0) : 0;

    const gesehenFr = new Set(statistik.gesehene_fragen || []);
    const anzahlNeuFr = fragenkatalog.filter(f => !gesehenFr.has(f.id)).length;

    const gesehenVok = new Set(statistik.gesehene_vokabeln || []);
    const anzahlNeuVok = vokabeln.filter(v => !gesehenVok.has(v.id)).length;

    const lesezeichen = statistik.lesezeichen || {};
    const anzahlLesezeichen = Object.keys(lesezeichen).length;

    let lesezeichenHtml = '';
    if (anzahlLesezeichen > 0) {
        lesezeichenHtml = '<div class="section-title">🔖 GESPEICHERTE FORTSCHRITTE</div>';
        lesezeichenHtml += `<div class="info-box" style="margin-bottom: 12px;">Du hast ${anzahlLesezeichen} angefangene Lerneinheit(en):</div>`;
        for (const [modus, lz] of Object.entries(lesezeichen)) {
            const anzahl = lz.verbleibende_ids.length;
            const datum = lz.datum.substring(0, 10);
            lesezeichenHtml += `
                <div style="background: var(--gelb); padding: 10px 14px; border-radius: 8px; margin: 6px 0; border-left: 3px solid var(--primary);">
                    <div style="font-weight: bold; color: var(--primary);">📌 ${modus}</div>
                    <div style="font-size: 0.85em; color: var(--text-light); margin-top: 4px;">Noch ${anzahl} offen · vom ${datum}</div>
                </div>
            `;
        }
    }

    app.innerHTML = `
        <div class="view">
            <div class="header">
                <h1>🌿 HP Lern-App</h1>
                <p class="untertitel">Heilpraktiker-Prüfung Vorbereitung</p>
            </div>

            <div class="stats-badge">
                <div class="stat-item">
                    <div class="stat-value">${fragenkatalog.length}</div>
                    <div class="stat-label">Fragen</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${vokabeln.length}</div>
                    <div class="stat-label">Vokabeln</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${quote}%</div>
                    <div class="stat-label">Quote</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${statistik.lerntage.length}</div>
                    <div class="stat-label">Tage</div>
                </div>
            </div>

            <div class="section-title">📝 PRÜFUNGSFRAGEN</div>
            <div class="modus-list">
                <button class="modus-btn" onclick="starteZufallsmodus()">
                    <div class="modus-icon">🎲</div>
                    <div class="modus-info">
                        <div class="modus-titel">Zufallsmodus</div>
                        <div class="modus-beschreibung">Alle Fragen zufällig</div>
                    </div>
                </button>
                <button class="modus-btn" onclick="zeigeThemenauswahl()">
                    <div class="modus-icon">📂</div>
                    <div class="modus-info">
                        <div class="modus-titel">Themen-Modus</div>
                        <div class="modus-beschreibung">Nach Thema lernen</div>
                    </div>
                </button>
                <button class="modus-btn" onclick="starteFehlermodus()">
                    <div class="modus-icon">❌</div>
                    <div class="modus-info">
                        <div class="modus-titel">Fehler-Wiederholung</div>
                        <div class="modus-beschreibung">Falsch beantwortete üben</div>
                    </div>
                </button>
                <button class="modus-btn" onclick="startePruefung()">
                    <div class="modus-icon">⏱️</div>
                    <div class="modus-info">
                        <div class="modus-titel">Prüfungssimulation</div>
                        <div class="modus-beschreibung">60 Fragen wie echte Prüfung</div>
                    </div>
                </button>
                <button class="modus-btn" onclick="starteCrashkurs()">
                    <div class="modus-icon">🔥</div>
                    <div class="modus-info">
                        <div class="modus-titel">Crashkurs</div>
                        <div class="modus-beschreibung">Nur hochrelevante Fragen</div>
                    </div>
                </button>
                <button class="modus-btn" onclick="starteNeueFragen()" style="border: 2px solid var(--primary);">
                    <div class="modus-icon">🆕</div>
                    <div class="modus-info">
                        <div class="modus-titel">Neue Fragen (${anzahlNeuFr})</div>
                        <div class="modus-beschreibung">Nur unbearbeitete Fragen</div>
                    </div>
                </button>
            </div>

            <div class="section-title">📚 VOKABELTRAINER</div>
            <div class="modus-list">
                <button class="modus-btn modus-btn-vokabel" onclick="starteVokabelnAlle()">
                    <div class="modus-icon">🎴</div>
                    <div class="modus-info">
                        <div class="modus-titel">Alle Vokabeln</div>
                        <div class="modus-beschreibung">Karteikarten Latein → Deutsch</div>
                    </div>
                </button>
                <button class="modus-btn modus-btn-vokabel" onclick="zeigeVokabelKategorien()">
                    <div class="modus-icon">🏷️</div>
                    <div class="modus-info">
                        <div class="modus-titel">Nach Kategorie</div>
                        <div class="modus-beschreibung">Anatomie, Hormone, etc.</div>
                    </div>
                </button>
                <button class="modus-btn modus-btn-vokabel" onclick="starteVokabelnSchwer()">
                    <div class="modus-icon">💪</div>
                    <div class="modus-info">
                        <div class="modus-titel">Schwierige Vokabeln</div>
                        <div class="modus-beschreibung">Nicht gewusste wiederholen</div>
                    </div>
                </button>
                <button class="modus-btn modus-btn-vokabel" onclick="starteVokabelnDeLat()">
                    <div class="modus-icon">🔄</div>
                    <div class="modus-info">
                        <div class="modus-titel">Deutsch → Latein</div>
                        <div class="modus-beschreibung">Andere Richtung üben</div>
                    </div>
                </button>
                <button class="modus-btn modus-btn-vokabel" onclick="starteNeueVokabeln()" style="border: 2px solid var(--secondary);">
                    <div class="modus-icon">🆕</div>
                    <div class="modus-info">
                        <div class="modus-titel">Neue Vokabeln (${anzahlNeuVok})</div>
                        <div class="modus-beschreibung">Nur unbearbeitete Vokabeln</div>
                    </div>
                </button>
            </div>

            ${lesezeichenHtml}

            <div class="section-title">📊 ÜBERSICHT</div>
            <div class="modus-list">
                <button class="modus-btn" onclick="zeigeStatistik()">
                    <div class="modus-icon">📊</div>
                    <div class="modus-info">
                        <div class="modus-titel">Statistik</div>
                        <div class="modus-beschreibung">Lernfortschritt anzeigen</div>
                    </div>
                </button>
            </div>
        </div>
    `;
}

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
        () => starteThemaNeu(thema),
        (lz) => setzeThemaFort(thema, lz));
}

function starteThemaNeu(thema) {
    aktuelleFragen = shuffleArray(fragenkatalog.filter(f => f.thema === thema));
    aktuelleIndex = 0;
    aktuellerModus = `Thema: ${thema}`;
    rundenRichtig = 0; rundenFalsch = 0;
    zeigeFrage();
}

function setzeThemaFort(thema, lz) {
    const ids = lz.verbleibende_ids;
    aktuelleFragen = fragenkatalog.filter(f => ids.includes(f.id))
                                   .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    aktuelleIndex = 0;
    aktuellerModus = `Thema: ${thema}`;
    rundenRichtig = lz.richtig || 0;
    rundenFalsch = lz.falsch || 0;
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
    const relevante = fragenkatalog.filter(f => f.pruefungsrelevanz === "hoch");
    if (relevante.length === 0) {
        alert("Keine hochrelevanten Fragen markiert!");
        return;
    }
    fragenFortsetzen("🔥 Crashkurs", starteCrashkursNeu, setzeCrashkursFort);
}

function starteCrashkursNeu() {
    const relevante = fragenkatalog.filter(f => f.pruefungsrelevanz === "hoch");
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

function starteNeueFragen() {
    const gesehen = new Set(statistik.gesehene_fragen || []);
    const neue = fragenkatalog.filter(f => !gesehen.has(f.id));
    if (neue.length === 0) {
        alert("🎉 Glückwunsch! Du hast bereits alle Fragen mindestens einmal bearbeitet!\n\nWenn neue Buchseiten dazukommen, erscheinen sie hier.");
        return;
    }
    const modusName = `🆕 Neue Fragen (${neue.length})`;
    fragenFortsetzen(modusName,
        () => starteNeueFragenNeu(neue),
        setzeNeueFragenFort);
}

function starteNeueFragenNeu(neue) {
    aktuelleFragen = shuffleArray(neue);
    aktuelleIndex = 0;
    aktuellerModus = `🆕 Neue Fragen (${neue.length})`;
    rundenRichtig = 0; rundenFalsch = 0;
    zeigeFrage();
}

function setzeNeueFragenFort(lz) {
    const ids = lz.verbleibende_ids;
    aktuelleFragen = fragenkatalog.filter(f => ids.includes(f.id))
                                   .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    aktuelleIndex = 0;
    aktuellerModus = `🆕 Neue Fragen (${aktuelleFragen.length})`;
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
        alert("🎉 Glückwunsch! Du hast bereits alle Vokabeln mindestens einmal bearbeitet!\n\nWenn neue Buchseiten dazukommen, erscheinen sie hier.");
        return;
    }
    const modusName = `🆕 Neue Vokabeln (${neue.length})`;
    fragenFortsetzen(modusName,
        () => starteNeueVokabelnNeu(neue),
        setzeNeueVokabelnFort);
}

function starteNeueVokabelnNeu(neue) {
    aktuelleVokabeln = shuffleArray(neue);
    aktuelleIndex = 0;
    aktuellerModus = `🆕 Neue Vokabeln (${neue.length})`;
    vokabelRichtung = "lat_to_de";
    rundenRichtig = 0; rundenFalsch = 0;
    karteUmgedreht = false;
    zeigeVokabelKarte();
}

function setzeNeueVokabelnFort(lz) {
    const ids = lz.verbleibende_ids;
    aktuelleVokabeln = vokabeln.filter(v => ids.includes(v.id))
                                .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    aktuelleIndex = 0;
    aktuellerModus = `🆕 Neue Vokabeln (${aktuelleVokabeln.length})`;
    vokabelRichtung = lz.vokabel_richtung || "lat_to_de";
    rundenRichtig = lz.richtig || 0;
    rundenFalsch = lz.falsch || 0;
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
// VOKABEL-KARTEIKARTE
// ================================================
function zeigeVokabelKarte() {
    if (aktuelleIndex >= aktuelleVokabeln.length) {
        if (aktuellerModus) loescheLesezeichen(aktuellerModus);
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
            <div class="karteikarte" onclick="karteUmdrehen()">
                ${!karteUmgedreht ? `
                    <div class="karte-label">${labelVorne}</div>
                    <div class="karte-text">${vorderseite}</div>
                    <div class="karte-hinweis">👆 Tippen zum Umdrehen</div>
                ` : `
                    <div class="karte-label-back">${labelHinten}</div>
                    <div class="karte-text-back">${rueckseite}</div>
                    ${vokabel.eselsbruecke ? `<div class="karte-extra"><strong>💡 Eselsbrücke:</strong><br>${vokabel.eselsbruecke}</div>` : ''}
                    ${vokabel.herkunft ? `<div class="karte-extra-klein"><strong>📖 Herkunft:</strong> ${vokabel.herkunft}</div>` : ''}
                    ${vokabel.beispiel ? `<div class="karte-extra-klein"><strong>💬 Beispiel:</strong> ${vokabel.beispiel}</div>` : ''}
                `}
            </div>
            ${karteUmgedreht ? `
                <div class="vokabel-bewertung">
                    <button class="btn-bewertung btn-nicht-gewusst" onclick="bewerteVokabel(false)">❌ Nicht gewusst</button>
                    <button class="btn-bewertung btn-gewusst" onclick="bewerteVokabel(true)">✅ Gewusst</button>
                </div>
            ` : `
                <div class="info-box">💭 Versuche, dich an die Übersetzung zu erinnern, dann tippe auf die Karte.</div>
            `}
            <div class="runden-stats">
                📊 ✅ ${rundenRichtig} gewusst · ❌ ${rundenFalsch} nicht gewusst
            </div>
        </div>
    `;
}

function karteUmdrehen() {
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
    // NEU: Automatisch Lesezeichen aktualisieren nach jeder Bewertung
    if (aktuelleIndex < aktuelleVokabeln.length) {
        speichereVokabelLesezeichen(aktuellerModus);
    }
    zeigeVokabelKarte();
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
        if (aktuellerModus) loescheLesezeichen(aktuellerModus);
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
            <div class="runden-stats">
                📊 ✅ ${rundenRichtig} · ❌ ${rundenFalsch} · 🎯 ${quote}%
            </div>
            <button class="btn-primary" onclick="naechsteFrage()">➡️ Nächste Frage</button>
            <button class="btn-secondary" onclick="fragenZurueckZumMenue()">🏠 Hauptmenü (speichern)</button>
        </div>
    `;
}

function naechsteFrage() {
    aktuelleIndex++;
    // NEU: Automatisch Lesezeichen aktualisieren
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
            <div class="info-box">
                Modus: <strong>${aktuellerModus}</strong><br>Prüfungsgrenze: 75%
            </div>
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
    else if (aktuellerModus.startsWith("🆕 Neue Fragen")) {
        const gesehen = new Set(statistik.gesehene_fragen || []);
        const neue = fragenkatalog.filter(f => !gesehen.has(f.id));
        if (neue.length > 0) starteNeueFragenNeu(neue);
        else zeigeHauptmenue();
    }
    else if (aktuellerModus.startsWith("🆕 Neue Vokabeln")) {
        const gesehen = new Set(statistik.gesehene_vokabeln || []);
        const neue = vokabeln.filter(v => !gesehen.has(v.id));
        if (neue.length > 0) starteNeueVokabelnNeu(neue);
        else zeigeHauptmenue();
    }
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
                <div class="ergebnis-stat">
                    <div class="ergebnis-stat-label">📅 Lerntage</div>
                    <div class="ergebnis-stat-wert">${statistik.lerntage.length}</div>
                </div>
                <div class="ergebnis-stat">
                    <div class="ergebnis-stat-label">📊 Beantwortet</div>
                    <div class="ergebnis-stat-wert">${gesamt}</div>
                </div>
                <div class="ergebnis-stat">
                    <div class="ergebnis-stat-label">✅ Richtig</div>
                    <div class="ergebnis-stat-wert" style="color: var(--richtig);">${statistik.gesamt_richtig}</div>
                </div>
                <div class="ergebnis-stat">
                    <div class="ergebnis-stat-label">🎯 Quote</div>
                    <div class="ergebnis-stat-wert" style="color: var(--primary);">${quote}%</div>
                </div>
            </div>
            <div class="section-title">📚 Vokabeln</div>
            <div class="stats-grid">
                <div class="ergebnis-stat">
                    <div class="ergebnis-stat-label">📚 Gesehen</div>
                    <div class="ergebnis-stat-wert">${vokGesehen}</div>
                </div>
                <div class="ergebnis-stat">
                    <div class="ergebnis-stat-label">✅ Gewusst</div>
                    <div class="ergebnis-stat-wert" style="color: var(--richtig);">${vokGewusst}</div>
                </div>
                <div class="ergebnis-stat">
                    <div class="ergebnis-stat-label">🎯 Quote</div>
                    <div class="ergebnis-stat-wert" style="color: var(--primary);">${vokQuote}%</div>
                </div>
                <div class="ergebnis-stat">
                    <div class="ergebnis-stat-label">📖 Vokabeln</div>
                    <div class="ergebnis-stat-wert">${Object.keys(statistik.vokabeln || {}).length} / ${vokabeln.length}</div>
                </div>
            </div>
        `;
    }
    html += `
            <button class="btn-secondary" onclick="statistikZuruecksetzen()" style="margin-top: 24px; color: var(--falsch);">
                🗑️ Statistik zurücksetzen
            </button>
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
            lerntage: [],
            lesezeichen: {},
            gesehene_fragen: [],
            gesehene_vokabeln: []
        };
        speichereStatistik();
        zeigeHauptmenue();
    }
}

// ================================================
// APP STARTEN
// ================================================
initApp();
