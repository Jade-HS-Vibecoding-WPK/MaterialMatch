/* Schritt 13 – Export: CSV, Druckansicht, PDF
   Aufruf:  node tests/test22.js
   Erwartungswerte werden unabhängig aus der Datenbank (Rohdaten) von Hand nachgerechnet.
   Das PDF wird mit Chromium erzeugt und mit pdftotext/pdfinfo/pdftoppm (poppler) geprüft. */
const { chromium } = require('playwright');
require('./_offline.js');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 500))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html?modus=demo';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-test22-'));

// ---- Eigener CSV-Leser (Semikolon, Anführungszeichen, Zeilenumbruch in Zellen)
function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ';') { row.push(f); f = ''; }
    else if (c === '\r' && text[i + 1] === '\n') { row.push(f); rows.push(row); row = []; f = ''; i++; }
    else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows;
}
const dez = s => parseFloat(String(s).replace(',', '.'));
const nah = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));

function abschnitte(rows) {
  const out = {}; let cur = null;
  rows.forEach(r => { if (/^Abschnitt \d/.test(r[0]) && r.length === 1) { cur = r[0].replace(/:.*/, ''); out[cur] = { titel: r[0], zeilen: [] }; } else if (cur && !(r.length === 1 && r[0] === '')) out[cur].zeilen.push(r); });
  return out;
}

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async (w = 1280, h = 900, init) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, acceptDownloads: true });
    const pg = await ctx.newPage();
    pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
    pg.on('pageerror', e => errors.push(String(e)));
    if (init) await pg.addInitScript(init);
    await pg.goto(URL); await pg.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
    return pg;
  };
  const waehle = (pg, a, b_ = '', c = '') => pg.evaluate(([a, b_, c]) => MM.auswahl.setzeAuswahl({ a, b: b_, c }), [a, b_, c]);
  const eingabe = async (pg, f, d) => { await pg.fill('#flaeche', String(f)); await pg.fill('#dicke', String(d)); };
  const oeffneAlle = pg => pg.$$eval('details', d => d.forEach(x => { x.open = true; }));

  const p = await neu(1280, 900, () => { window.__druck = 0; window.print = function () { window.__druck++; }; });
  const DB = await p.evaluate(() => JSON.parse(JSON.stringify(MATERIALMATCH_DATA)));
  const mat = id => DB.baustoffe.find(m => m.id === id);
  await oeffneAlle(p);

  // ================= 1. Schaltflächen =================
  const menue = async pg => { if (await pg.$eval('#export-menue', e => e.hidden)) await pg.click('#export-menue-knopf'); };
  const knoepfe = async () => p.$$eval('#druck-knopf, #csv-knopf', k => k.map(x => ({ id: x.id, aus: x.disabled, text: x.textContent.trim() })));
  let k = await knoepfe();
  check('Ohne Material: beide Export-Schaltflächen deaktiviert, Hinweis "Wählen Sie zuerst mindestens ein Material" sichtbar', k.length === 2 && k.every(x => x.aus) && await p.$eval('#export-hinweis', e => !e.hidden && e.textContent.includes('mindestens ein Material')), k);
  await waehle(p, 'mineralwolle', 'xps', 'eps'); await eingabe(p, 100, 20);
  k = await knoepfe();
  check('Mit Material: beide aktiv und beschriftet ("Als PDF speichern", "Als CSV herunterladen"), Hinweis verborgen', k.every(x => !x.aus) && k.find(x => x.id === 'druck-knopf').text === 'Als PDF speichern' && k.find(x => x.id === 'csv-knopf').text === 'Als CSV herunterladen' && await p.$eval('#export-hinweis', e => e.hidden), k);
  await waehle(p, '', '', '');
  k = await knoepfe();
  check('Auswahl wieder leer: Schaltflächen wieder deaktiviert', k.every(x => x.aus));
  await waehle(p, 'mineralwolle', 'xps', 'eps'); await eingabe(p, 100, 20);

  // ================= 2. Hilfsfunktionen (Einheitentests im Browser) =================
  const h = await p.evaluate(() => { const E = MM.exportieren; return {
    z1: E.csvZahl(1234.5678), z2: E.csvZahl(-741.2519), z3: E.csvZahl(0.000123456789), z4: E.csvZahl(NaN), z5: E.csvZahl(1e9), z6: E.csvZahl(0),
    t1: E.csvZelle('=1+1'), t2: E.csvZelle('+SUMME(A1)'), t3: E.csvZelle('@x'), t4: E.csvZelle('-5 Grad'), t5: E.csvZelle('a;b'), t6: E.csvZelle('sag "hallo"'), t7: E.csvZelle('zwei\nZeilen'), t8: E.csvZelle(null), t9: E.csvZelle('normal'),
    n1: E.csvZelle({ zahl: '-741,25' }), n2: E.csvZelle({ zahl: '' }) }; });
  check('Zahlenformat: deutsches Komma, kein Tausenderpunkt, bis 7 gültige Ziffern, NaN → leer', h.z1 === '1234,568' && h.z2 === '-741,2519' && h.z3 === '0,0001234568' && h.z4 === '' && h.z5 === '1000000000' && h.z6 === '0', h);
  check('Formelschutz: Text mit = + @ - am Anfang bekommt ein vorangestelltes Apostroph (Excel führt ihn nicht aus)', h.t1 === "'=1+1" && h.t2 === "'+SUMME(A1)" && h.t3 === "'@x" && h.t4 === "'-5 Grad", h);
  check('Anführungszeichen: Semikolon, Anführungszeichen und Zeilenumbruch werden korrekt in "…" gesetzt und verdoppelt', h.t5 === '"a;b"' && h.t6 === '"sag ""hallo"""' && h.t7 === '"zwei\nZeilen"' && h.t8 === '' && h.t9 === 'normal', h);
  check('Zahlen bleiben Zahlen: negative Zahl wird NICHT mit Apostroph versehen (sonst wäre sie in Excel Text)', h.n1 === '-741,25' && h.n2 === '', h);

  // ================= 3. Download =================
  await menue(p); const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#csv-knopf')]);
  const datei = path.join(TMP, 'export.csv');
  await dl.saveAs(datei);
  const roh = fs.readFileSync(datei);
  const text = roh.toString('utf8');
  const heute = new Date(); const z2 = n => (n < 10 ? '0' : '') + n;
  check('Dateiname MaterialMatch_Vergleich_JJJJ-MM-TT.csv mit dem heutigen Datum', dl.suggestedFilename() === `MaterialMatch_Vergleich_${heute.getFullYear()}-${z2(heute.getMonth() + 1)}-${z2(heute.getDate())}.csv`, dl.suggestedFilename());
  check('Datei beginnt mit UTF-8-Kennung (BOM EF BB BF), Zeilenende CRLF, Semikolon als Trenner', roh[0] === 0xEF && roh[1] === 0xBB && roh[2] === 0xBF && text.includes('\r\n') && !/[^\r]\n(?=[^"]*(?:"[^"]*"[^"]*)*$)/.test(text.replace(/"[^"]*"/g, '')) && text.includes(';'), roh.slice(0, 4));
  check('Umlaute und Sonderzeichen unverändert (ä ö ü ß ² ³ ₂ λ μ – „ “)', ['Wärmeleitfähigkeit λ', 'Diffusionswiderstandszahl μ', 'kg CO₂e', 'm²K/W', '„nicht verfügbar“'.replace(/[„“]/g, '') ].every(s => text.includes(s)) && !text.includes('Ã') && !text.includes('\uFFFD'));
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  const A = abschnitte(rows);
  check('Vier Abschnitte: Eingaben und Hinweise · Kennwerte und berechnete Ergebnisse · Alternative Baustoffe · Verwendete Quellen', Object.keys(A).length === 4 && A['Abschnitt 1'].titel.startsWith('Abschnitt 1: Eingaben') && A['Abschnitt 2'].titel.includes('Kennwerte und berechnete Ergebnisse') && A['Abschnitt 3'].titel.includes('Alternative Baustoffe') && A['Abschnitt 4'].titel.includes('Verwendete Quellen'), Object.keys(A));

  // ---- Abschnitt 1
  const kopf = Object.fromEntries(A['Abschnitt 1'].zeilen.slice(1).map(r => [r[0], r.slice(1)]));
  check('Eingaben: Material A/B/C, Fläche 100 m², Dicke 20 cm, Anwendungsbereich "Wärmedämmung", Priorität "Ausgewogener Vergleich"', kopf['Material A'][0] === mat('mineralwolle').name && kopf['Material B'][0] === mat('xps').name && kopf['Material C'][0] === mat('eps').name && kopf['Bauteilfläche'][0] === '100' && kopf['Bauteilfläche'][1] === 'm²' && kopf['Materialdicke'][0] === '20' && kopf['Materialdicke'][1] === 'cm' && kopf['Anwendungsbereich (Empfehlung)'][0] === 'Wärmedämmung' && kopf['Vergleichspriorität'][0] === 'Ausgewogener Vergleich', kopf);
  check('Pflichtsatz zu den relativen Farben wörtlich enthalten', kopf['Hinweis zu Farben'][0] === 'Die Farben zeigen eine relative Bewertung der ausgewählten Materialien und stellen keine allgemeingültige Aussage über deren Qualität dar.');
  check('Haftungs-/Verwendungshinweis, Datenarten-Erklärung, Datenbankversion 0.4.0 und Datenstand vorhanden', /Ersetzt keine bauphysikalischen Nachweise/.test(kopf['Hinweis zur Verwendung'][0]) && /Beispieldaten = nicht geprüfte/.test(kopf['Datenarten'][0]) && kopf['Baustoffdatenbank'][0] === `Version ${DB.meta.version}, Datenstand ${DB.meta.datenstand}` && /^\d\d\.\d\d\.\d{4} \d\d:\d\d$/.test(kopf['Erstellt am'][0]), kopf);

  // ---- Abschnitt 2
  const kopfzeile = A['Abschnitt 2'].zeilen[0];
  check('Abschnitt 2 hat die Spalten Bereich · Material · Kennwert · Wert · Einheit · Datenart · Quelle · Link · Hinweis', JSON.stringify(kopfzeile) === JSON.stringify(['Bereich', 'Material', 'Kennwert', 'Wert', 'Einheit', 'Datenart', 'Quelle', 'Link', 'Hinweis']));
  const daten2 = A['Abschnitt 2'].zeilen.slice(1);
  check('Jede Zeile des Abschnitts 2 hat genau 9 Felder (Excel-Tabelle bleibt rechteckig)', daten2.every(r => r.length === 9), daten2.filter(r => r.length !== 9).slice(0, 2));
  const finde = (bereich, buchstabe, kennwert) => daten2.find(r => r[0] === bereich && r[1].startsWith(buchstabe + ': ') && r[2] === kennwert);
  // Erwartung Mineralwolle (A): ρ, λ, Preis, GWP aus den Rohdaten
  const mw = mat('mineralwolle').eigenschaften, xps = mat('xps').eigenschaften, eps = mat('eps').eigenschaften;
  let r = finde('Kennwert', 'A', 'Rohdichte');
  check('Kennwert A Rohdichte: Wert, Einheit kg/m³, Datenart "Richtwert", Quelle mit Titel, Link https', r && nah(dez(r[3]), mw.rohdichte.wert) && r[4] === 'kg/m³' && r[5] === 'Richtwert' && /Mineralwolle/.test(r[6]) && /^https:\/\/www\.oekobaudat\.de\/OEKOBAU\.DAT\/resource\/processes\//.test(r[7]), r);
  r = finde('Kennwert', 'A', 'Nennwert der Wärmeleitfähigkeit λD');
  check('Kennwert A λ = belegter Herstellerwert: 0,034 W/(m·K), Datenart "Richtwert", Quelle ROCKWOOL Fixrock 035 mit https-Link (rockwool.com)', r && nah(dez(r[3]), 0.034) && nah(dez(r[3]), mw.waermeleitfaehigkeit.wert) && r[4] === 'W/(m·K)' && r[5] === 'Richtwert' && /Fixrock 035/.test(r[6]) && /^https:\/\/www\.rockwool\.com\//.test(r[7]) && /Fixrock 035/.test(r[8]), r);
  r = finde('Kennwert', 'A', 'Wärmekapazität');
  check('Kennwert A Wärmekapazität = Beispielwert: Datenart "Beispieldaten", keine Quelle, kein Link', r && nah(dez(r[3]), mw.waermekapazitaet.wert) && r[5] === 'Beispieldaten' && r[6] === '' && r[7] === '', r);
  r = finde('Kennwert', 'B', 'Nennwert der Wärmeleitfähigkeit λD');
  check('Kennwert B (XPS) λ nicht belegt: Wert "nicht verfügbar", keine Datenart, Begründung im Hinweis', r && r[3] === 'nicht verfügbar' && r[5] === '' && /^Nicht verfügbar: /.test(r[8]), r);
  r = finde('Kennwert', 'A', 'Druckfestigkeit');
  check('Dämmstoff: Druckfestigkeit "nicht anwendbar"', r && r[3] === 'nicht anwendbar', r);
  r = finde('Kennwert', 'A', 'Einheitspreis');
  check('Preis A: Wert, Einheit, Datenart Beispieldaten, Hinweis nennt Mehrwertsteuer und Leistungsumfang', r && nah(dez(r[3]), mw.preis.wert) && r[4] === '€/m³' && r[5] === 'Beispieldaten' && /Mehrwertsteuer: unbekannt; Leistungsumfang: unbekannt/.test(r[8]), r);
  ['gesamt', 'fossil', 'biogen'].forEach(kk => {
    const z = finde('Kennwert', 'A', 'GWP ' + kk);
    check(`GWP ${kk} A stimmt mit der Datenbank überein, Einheit nennt Bezugsgröße und Module`, z && nah(dez(z[3]), mw.gwp.werte[kk]) && z[4] === 'kg CO₂e je m³ (Module A1-A3)' && z[5] === 'Richtwert', z);
  });
  // Berechnung (100 m² × 0,2 m = 20 m³)
  r = finde('Berechnung', 'A', 'Volumen'); check('Berechnung Volumen = 100 × 0,2 = 20 m³', r && nah(dez(r[3]), 20) && r[4] === 'm³', r);
  r = finde('Berechnung', 'A', 'Gesamtgewicht'); check('Berechnung Gesamtgewicht A = 20 m³ × ρ', r && nah(dez(r[3]), 20 * mw.rohdichte.wert) && r[4] === 'kg' && r[5] === 'Richtwert', r);
  r = finde('Berechnung', 'C', 'Gesamtgewicht'); check('Berechnung Gesamtgewicht C (EPS) = 20 × ρ(EPS)', r && nah(dez(r[3]), 20 * eps.rohdichte.wert), r);
  r = finde('Berechnung', 'A', 'Materialkosten'); check('Berechnung Materialkosten A = 20 m³ × Preis', r && nah(dez(r[3]), 20 * mw.preis.wert) && r[4] === '€' && r[5] === 'Beispieldaten' && /Menge \(20 m³\) × Einheitspreis/.test(r[8]), r);
  r = finde('Berechnung', 'B', 'Materialkosten'); check('Berechnung Materialkosten B (XPS, kein Preis): "nicht berechenbar" mit Begründung, keine erfundene Zahl', r && r[3] === 'nicht berechenbar' && /Preis fehlt/.test(r[8]), r);
  ['gesamt', 'fossil', 'biogen'].forEach(kk => { const z = finde('Berechnung', 'B', 'CO₂-Menge ' + kk); check(`Berechnung CO₂-Menge ${kk} B (XPS) = 20 m³ × Kennwert`, z && nah(dez(z[3]), 20 * xps.gwp.werte[kk]) && z[4] === 'kg CO₂e', z); });
  r = finde('Berechnung', 'A', 'Wärmedurchlasswiderstand R'); check('Berechnung R (A) = 0,2 m / λB (Bemessungswert 0,035 statt Nennwert 0,034), Quelle ROCKWOOL, Hinweis nennt die Grundlage', r && nah(dez(r[3]), 0.2 / mw.waermeleitfaehigkeit_bemessung.wert) && /Bemessungswert λB/.test(r[8]) && /Fixrock/.test(r[6]) && r[4] === 'm²K/W' && /nicht der U-Wert/.test(r[8]), r);
  r = finde('Berechnung', 'B', 'Wärmedurchlasswiderstand R'); check('Berechnung R (B, XPS ohne λ): "nicht berechenbar"', r && r[3] === 'nicht berechenbar' && /Wärmeleitfähigkeit fehlt/.test(r[8]), r);

  // ---- Abschnitt 3 und 4
  const emp = await p.evaluate(() => { const x = MM.empfehlung.empfehle(MATERIALMATCH_DATA, 'mineralwolle', null, 'ausgewogen'); return { ids: x.empfehlungen.map(e => e.material.name), nicht: x.nichtEmpfohlen.map(n => n.material.name), scores: x.empfehlungen.map(e => Math.round(e.score * 100) / 100) }; });
  const a3 = A['Abschnitt 3'].zeilen;
  check('Abschnitt 3: Kopf + 3 Empfehlungen (Rang 1–3, Gesamtbewertung wie in der App) + 10 "nicht empfohlen" mit Grund', a3[0][0] === 'Rang' && a3.slice(1, 4).every((z, i) => z[0] === String(i + 1) && z[1] === emp.ids[i] && nah(dez(z[2]), emp.scores[i]) && z[5].length > 40) && a3.filter(z => z[0] === 'nicht empfohlen').length === 10 && a3.filter(z => z[0] === 'nicht empfohlen').every((z, i) => z[1] === emp.nicht[i] && z[5].length > 20), a3.slice(0, 3));
  check('Empfehlungen nennen die Belastbarkeit ("Nicht belastbar … Beispieldaten")', a3.slice(1, 4).every(z => /Nicht belastbar/.test(z[4])), a3.slice(1, 2));
  const a4 = A['Abschnitt 4'].zeilen;
  check('Abschnitt 4 (Quellen): Kopfzeile, nur https-Links, jede Quelle mit Titel; verwendete Quellen der gezeigten Werte sind enthalten', a4[0][0] === 'Quelle-ID' && a4.slice(1).length >= 3 && a4.slice(1).every(z => z.length === 5 && z[1].length > 3 && /^https:\/\//.test(z[4])) && a4.some(z => z[0] === 'oebd-' + mat('mineralwolle').eigenschaften.gwp.quelle.slice(5)), a4.slice(0, 3));
  check('Alle Links in der ganzen Datei beginnen mit https:// (keine javascript:, http:, file:)', rows.every(z => z.every(f => !/^(javascript:|http:|file:|data:)/i.test(f))) && daten2.every(z => z[7] === '' || /^https:\/\//.test(z[7])));
  check('Kein "undefined", "NaN", "Infinity", "[object", "null" als Zellwert im Export', !/(^|;)(undefined|NaN|Infinity|null)(;|\r)/.test(text) && !/\[object/.test(text));

  // ================= 4. Weitere Fälle =================
  // 4a Plattenprodukte und biogenes CO₂ (Dach / Holz)
  await waehle(p, 'dachziegel', 'betondachstein', 'zinkblech'); await eingabe(p, 100, 20);
  let t = await p.evaluate(() => MM.exportieren.baueCsv({ daten: MATERIALMATCH_DATA, plaetze: MM.auswahl.holeAuswahl().plaetze, eingaben: MM.eingaben.hole(), anwendung: 'Dach', prioritaet: 'x', empfehlung: null, datum: new Date() }));
  let B2 = abschnitte(parseCsv(t.replace(/^\uFEFF/, '')))['Abschnitt 2'].zeilen.slice(1);
  const f2 = (bereich, bu, kw) => B2.find(z => z[0] === bereich && z[1].startsWith(bu + ': ') && z[2] === kw);
  r = f2('Berechnung', 'B', 'Gesamtgewicht');
  check('Betondachstein: Gewicht = 100 m² × Flächengewicht, Hinweis "Dicke wird nicht verwendet", kein Volumen', r && nah(dez(r[3]), 100 * mat('betondachstein').eigenschaften.flaechengewicht.wert) && /Dicke wird nicht verwendet/.test(r[8]) && !f2('Berechnung', 'B', 'Volumen'), r);
  r = f2('Berechnung', 'B', 'CO₂-Menge gesamt');
  check('Betondachstein: CO₂ je m² × 100 m²', r && nah(dez(r[3]), 100 * mat('betondachstein').eigenschaften.gwp.werte.gesamt), r);
  r = f2('Berechnung', 'C', 'Gesamtgewicht');
  check('Zinkblech (Schicht) im selben Export: Gewicht = 20 m³ × 7200 kg/m³', r && nah(dez(r[3]), 20 * 7200), r);
  await waehle(p, 'massivholz_nadel', '', ''); await eingabe(p, 100, 20);
  t = await p.evaluate(() => MM.exportieren.baueCsv({ daten: MATERIALMATCH_DATA, plaetze: MM.auswahl.holeAuswahl().plaetze, eingaben: MM.eingaben.hole(), anwendung: '', prioritaet: '', empfehlung: null, datum: new Date() }));
  B2 = abschnitte(parseCsv(t.replace(/^\uFEFF/, '')))['Abschnitt 2'].zeilen.slice(1);
  r = f2('Berechnung', 'A', 'CO₂-Menge biogen');
  check('Nadelholz: biogenes CO₂ negativ und als Zahl (ohne Apostroph) exportiert, Hinweis erklärt die Bedeutung', r && /^-\d/.test(r[3]) && nah(dez(r[3]), 20 * mat('massivholz_nadel').eigenschaften.gwp.werte.biogen) && /im Material gespeicherter Kohlenstoff/.test(r[8]), r);
  check('Holz: kein "Holz ist besser"-Satz im Export', !/Holz ist (immer )?(nachhaltiger|besser)/i.test(t));

  // 4b unvollständige Eingaben
  await waehle(p, 'mineralwolle', '', ''); await p.fill('#flaeche', '100'); await p.fill('#dicke', '');
  t = await p.evaluate(() => MM.exportieren.baueCsv({ daten: MATERIALMATCH_DATA, plaetze: MM.auswahl.holeAuswahl().plaetze, eingaben: MM.eingaben.hole(), anwendung: '', prioritaet: '', empfehlung: null, datum: new Date() }));
  const U = abschnitte(parseCsv(t.replace(/^\uFEFF/, '')));
  check('Ohne vollständige Eingaben: keine Berechnungszeilen, dafür der Hinweis "Fläche und Dicke fehlen …"', !U['Abschnitt 2'].zeilen.some(z => z[0] === 'Berechnung') && U['Abschnitt 1'].zeilen.some(z => z[0] === 'Eingaben' && /fehlen oder sind fehlerhaft/.test(z[1])) && U['Abschnitt 2'].zeilen.some(z => z[0] === 'Kennwert'));
  // 4c kein Material
  t = await p.evaluate(() => MM.exportieren.baueCsv({ daten: MATERIALMATCH_DATA, plaetze: [], eingaben: { status: 'leer' }, anwendung: '', prioritaet: '', empfehlung: null, datum: new Date() }));
  const L = abschnitte(parseCsv(t.replace(/^\uFEFF/, '')));
  check('Ohne Material: gültige Datei mit "Kein Material gewählt" und "Keine Empfehlung"', L['Abschnitt 2'].zeilen.some(z => z[1] === 'Kein Material gewählt') && L['Abschnitt 3'].zeilen[0][0].startsWith('Keine Empfehlung') && L['Abschnitt 4'].zeilen.some(z => /Keine belegten Kennwerte/.test(z[1])));
  // 4d Priorität
  await waehle(p, 'mineralwolle', 'xps', ''); await eingabe(p, 100, 20);
  await p.selectOption('#prioritaet', 'co2');
  await menue(p); const [dl2] = await Promise.all([p.waitForEvent('download'), p.click('#csv-knopf')]);
  await dl2.saveAs(path.join(TMP, 'e2.csv'));
  const A2 = abschnitte(parseCsv(fs.readFileSync(path.join(TMP, 'e2.csv'), 'utf8').replace(/^\uFEFF/, '')));
  check('Priorität "Geringe CO₂-Emissionen" erscheint in der Datei', A2['Abschnitt 1'].zeilen.some(z => z[0] === 'Vergleichspriorität' && z[1] === 'Geringe CO₂-Emissionen'));
  await p.selectOption('#prioritaet', 'ausgewogen');
  // 4e Formelschutz mit manipulierten Daten (Material mit "=HYPERLINK(...)" im Namen)
  const inj = await p.evaluate(() => { const d = JSON.parse(JSON.stringify(MATERIALMATCH_DATA)); const m = d.baustoffe.find(x => x.id === 'eps'); m.name = '=HYPERLINK("http://böse.example";"klick")'; m.eigenschaften.gwp.hinweis = '+cmd|calc'; MM.quellen.setzeDaten(d); const s = MM.exportieren.baueCsv({ daten: d, plaetze: [{ buchstabe: 'A', material: m }], eingaben: { status: 'leer' }, anwendung: '', prioritaet: '', empfehlung: null, datum: new Date() }); MM.quellen.setzeDaten(MATERIALMATCH_DATA); return s; });
  const ir = parseCsv(inj.replace(/^\uFEFF/, ''));
  check('Formel-Einschleusung: Namen/Hinweise, die mit = oder + beginnen, werden entschärft (Apostroph); kein Feld beginnt mit = + @', ir.every(z => z.every(f => !/^[=+@]/.test(f))) && ir.some(z => z.some(f => f.startsWith("'=HYPERLINK"))) && ir.some(z => z.some(f => f === "'+cmd|calc")));

  // 4f Links: nur https wird exportiert (manipulierte Quelle mit javascript:/http:/file:)
  const lnk = await p.evaluate(() => { const d = JSON.parse(JSON.stringify(MATERIALMATCH_DATA)); const m = d.baustoffe.find(x => x.id === 'eps'); const qid = m.eigenschaften.rohdichte.quelle; const q = d.quellen.find(x => x.id === qid); const res = {};
    ['javascript:alert(1)', 'http://unsicher.example/x', 'file:///etc/passwd', 'https://sicher.example/ok'].forEach(u => { q.url = u; MM.quellen.setzeDaten(d); res[u] = MM.exportieren.baueCsv({ daten: d, plaetze: [{ buchstabe: 'A', material: m }], eingaben: { status: 'leer' }, anwendung: '', prioritaet: '', empfehlung: null, datum: new Date() }); });
    MM.quellen.setzeDaten(MATERIALMATCH_DATA); return res; });
  check('Manipulierte Quellenlinks: javascript:, http: und file: erscheinen nicht in der Datei, ein https-Link schon', ['javascript:alert(1)', 'http://unsicher.example/x', 'file:///etc/passwd'].every(u => !lnk[u].includes(u.slice(0, 12))) && lnk['https://sicher.example/ok'].includes('https://sicher.example/ok'), Object.keys(lnk).map(u => [u, lnk[u].includes(u.slice(0, 12))]));

  // ================= 5. Alle 50 Materialien =================
  const sweep = await p.evaluate(() => {
    const out = []; const ids = MATERIALMATCH_DATA.baustoffe.map(m => m.id);
    ids.forEach((id, i) => {
      MM.auswahl.setzeAuswahl({ a: id, b: ids[(i + 7) % 50] === id ? '' : ids[(i + 7) % 50], c: '' });
      const f = document.getElementById('flaeche'), d = document.getElementById('dicke');
      f.value = '100'; f.dispatchEvent(new Event('input', { bubbles: true })); d.value = '20'; d.dispatchEvent(new Event('input', { bubbles: true }));
      try { out.push({ id: id, csv: MM.exportieren.baueCsv({ daten: MATERIALMATCH_DATA, plaetze: MM.auswahl.holeAuswahl().plaetze, eingaben: MM.eingaben.hole(), anwendung: 'x', prioritaet: 'y', empfehlung: MM.empfehlung.empfehle(MATERIALMATCH_DATA, id, null, 'ausgewogen'), datum: new Date() }) }); }
      catch (e) { out.push({ id: id, fehler: String(e) }); }
    });
    return out;
  });
  const sweepFehler = [];
  sweep.forEach(s => {
    if (s.fehler) { sweepFehler.push(s.id + ': ' + s.fehler); return; }
    const ab = abschnitte(parseCsv(s.csv.replace(/^\uFEFF/, '')));
    if (!ab['Abschnitt 2'] || ab['Abschnitt 2'].zeilen.slice(1).some(z => z.length !== 9)) sweepFehler.push(s.id + ': Spaltenzahl');
    if (/(^|;)(undefined|NaN|Infinity|null)(;|\r)/.test(s.csv) || /\[object/.test(s.csv)) sweepFehler.push(s.id + ': undefined/NaN');
    if (!ab['Abschnitt 2'].zeilen.some(z => z[0] === 'Berechnung')) sweepFehler.push(s.id + ': keine Berechnung');
  });
  check('Alle 50 Materialien als Ausgangspunkt (mit Partner): Export ohne Fehler, 9 Spalten, keine undefined/NaN, Berechnungszeilen vorhanden', sweep.length === 50 && sweepFehler.length === 0, sweepFehler.slice(0, 4));

  // ================= 6. Druckablauf =================
  const q = await neu(1280, 900, () => { window.__druck = 0; window.print = function () { window.__druck++; }; });
  await waehle(q, 'mineralwolle', 'xps', 'eps'); await eingabe(q, 100, 20);
  await menue(q); await q.click('#druck-knopf');
  check('Klick auf "Als PDF speichern" ruft window.print() genau einmal auf', await q.evaluate(() => window.__druck) === 1);
  // Zustände merken, einige Bereiche schließen
  await q.$$eval('#quellen > details.sub, #ergebnisse details.sub', d => d.forEach((x, i) => { x.open = i % 2 === 0; }));
  const vorher = await q.$$eval('details', d => d.map(x => x.open));
  await q.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  const waehrend = await q.$$eval('details', d => d.map(x => x.open));
  const kopfText = await q.$eval('#druck-kopf', e => e.innerText);
  check('beforeprint: alle aufklappbaren Bereiche sind offen (auch ohne Klick auf die Schaltfläche, z. B. Strg+P)', waehrend.every(Boolean) && vorher.some(x => !x), [vorher.filter(Boolean).length, waehrend.length]);
  check('beforeprint: Berichtskopf mit Datum, drei Materialien, Fläche/Dicke, Anwendungsbereich, Priorität, Datenstand, Haftungshinweis', /Vergleichsbericht/.test(kopfText) && /Erstellt am \d\d\.\d\d\.\d{4}/.test(kopfText) && /Material A: Mineralwolle/.test(kopfText) && /Material B: XPS/.test(kopfText) && /Material C: EPS/.test(kopfText) && /Bauteilfläche: 100 m² · Materialdicke: 20 cm/.test(kopfText) && /Anwendungsbereich: Wärmedämmung · Priorität: Ausgewogener Vergleich/.test(kopfText) && /Datenstand 2026-11-16/.test(kopfText) && /Ersetzt keine bauphysikalischen Nachweise/.test(kopfText), kopfText.slice(0, 300));
  await q.evaluate(() => window.dispatchEvent(new Event('beforeprint')));    // zweites Mal: darf den gemerkten Zustand nicht überschreiben
  await q.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  const nachher = await q.$$eval('details', d => d.map(x => x.open));
  check('afterprint: alter Zustand der Bereiche exakt wiederhergestellt (auch nach doppeltem beforeprint), Berichtskopf geleert', JSON.stringify(nachher) === JSON.stringify(vorher) && (await q.$eval('#druck-kopf', e => e.textContent)) === '', [vorher.filter(Boolean).length, nachher.filter(Boolean).length]);
  check('Auf dem Bildschirm ist der Berichtskopf unsichtbar', await q.$eval('#druck-kopf', e => getComputedStyle(e).display) === 'none');

  // ================= 7. Druck-CSS =================
  await q.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await q.setViewportSize({ width: 794, height: 1123 });
  await q.emulateMedia({ media: 'print' });
  const css = await q.evaluate(() => {
    const d = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).display : 'fehlt'; };
    const gl = s => { const e = document.querySelector(s); return e ? getComputedStyle(e) : null; };
    const sicht = ['#auswahl', '#eingaben', '#druck-knopf', '#csv-knopf', '.export-leiste', '#alle-umschalten', '#katalog', '.nicht-drucken', '#status'].map(s => [s, d(s)]);
    const info = [...document.querySelectorAll('.info')].every(e => getComputedStyle(e).display === 'none');
    const balken = gl('.chart-bar');
    const wrap = gl('.table-wrap');
    return { sicht, info, kopf: d('#druck-kopf'), farbe: balken && (balken.printColorAdjust || balken.webkitPrintColorAdjust), wrapOverflow: wrap && wrap.overflowX, hintergrund: getComputedStyle(document.body).backgroundColor, ueberlauf: document.documentElement.scrollWidth - document.documentElement.clientWidth, ergebnisse: d('#ergebnisse'), diagramme: d('#diagramme'), alt: d('#alternativen'), quellen: d('#quellen') };
  });
  check('Druckansicht blendet aus: Materialauswahl, Eingabefelder, Export-Leiste, alle Knöpfe, i-Knöpfe, Katalog, Datenbank-Gesamtübersicht, Statuszeile', css.sicht.every(([, v]) => v === 'none' || v === 'fehlt') && css.info, css.sicht);
  check('Druckansicht zeigt: Berichtskopf, Ergebnisse, Diagramme, Alternativen, Quellen und Hinweise', css.kopf === 'block' && [css.ergebnisse, css.diagramme, css.alt, css.quellen].every(v => v === 'block'), css);
  check('Druck: Diagrammfarben bleiben erhalten (print-color-adjust: exact), weißer Hintergrund, Tabellen ohne Scrollrahmen, kein Überlauf bei A4-Breite', css.farbe === 'exact' && css.hintergrund === 'rgb(255, 255, 255)' && css.wrapOverflow === 'visible' && css.ueberlauf <= 0, css);

  // ================= 8. PDF =================
  const pdfPfad = path.join(TMP, 'bericht.pdf');
  await q.pdf({ path: pdfPfad, format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' } });
  const info = execFileSync('pdfinfo', [pdfPfad]).toString();
  const seiten = parseInt(/Pages:\s+(\d+)/.exec(info)[1], 10);
  check('PDF: A4 (595 × 842 pt), 8 bis 21 Seiten (der Bericht enthält jetzt auch die Quellen der gewählten Materialien und die ausführlichen Erläuterungen)', /Page size:\s+595\.\d+ x 842\.\d+/.test(info) && seiten >= 8 && seiten <= 21, [seiten, info.match(/Page size.*/)[0]]);
  const pdfText = execFileSync('pdftotext', ['-layout', pdfPfad, '-']).toString();
  const flach = pdfText.replace(/\s+/g, ' ');
  const muss = ['Vergleichsbericht', 'Material A: Mineralwolle', 'Material B: XPS', 'Bauteilfläche: 100 m²', 'Menge und Gewicht', 'Technische Eigenschaften', 'CO₂-Bilanz', 'Wärmedurchlasswiderstand', 'Gesamtgewicht für 100 m² × 20 cm', 'Alternative Baustoffe', 'EPS (expandiertes Polystyrol)', 'Geprüft, aber nicht empfohlen (10)', 'So wird bewertet', 'Quellen der ausgewählten Materialien', 'Wie berechnet MaterialMatch die Ergebnisse?', 'Rechtliche und fachliche Hinweise', 'Nachvollziehbarkeits-Check', 'Datenstand'];
  check('PDF-Text enthält Bericht, alle Abschnitte, Eingaben, Diagramme, Empfehlungen und Hinweise', muss.every(s => flach.includes(s)), muss.filter(s => !flach.includes(s)));
  check('PDF enthält den Pflichtsatz zu den relativen Farben (auch wenn er am Zeilenende umbricht)', flach.includes('Die Farben zeigen eine relative Bewertung der ausgewählten Materialien und stellen keine allgemeingültige Aussage über deren Qualität dar.'));
  const url = 'https://www.oekobaudat.de/OEKOBAU.DAT/resource/processes/' + mat('mineralwolle').eigenschaften.gwp.quelle.slice(5);
  check('PDF zeigt Quellenlinks im Klartext (ÖKOBAUDAT-Datensatz der Mineralwolle) – auf Papier nachvollziehbar', flach.replace(/ /g, '').includes(url));
  const nicht = ['Alle Baustoffe in der Datenbank', 'Baustoffkategorie', 'Drucken / als PDF speichern', 'Als CSV herunterladen', 'Systemcheck', 'Alle Abschnitte zuklappen', 'Gewünschter R-Wert', 'Datenqualität auf einen Blick', 'Alternative vergleichen'];
  check('PDF enthält nichts Interaktives oder Datenbank-Weites (Auswahlfelder, Schaltflächen, Katalog, Systemcheck, Gesamtmatrix)', nicht.every(s => !flach.includes(s)), nicht.filter(s => flach.includes(s)));
  check('PDF ohne "undefined", "NaN", "[object"', !/undefined|NaN|\[object/.test(pdfText));
  // Farbpixel: die fünf Bewertungsfarben kommen im PDF tatsächlich vor (Diagramme farbig, nicht grau gedruckt)
  execFileSync('pdftoppm', ['-r', '40', pdfPfad, path.join(TMP, 'seite')]);
  const farben = { 'sehr gut #17643A': [23, 100, 58], 'gut #78B85A': [120, 184, 90], 'mittel #E9C94E': [233, 201, 78], 'schlecht #E68B43': [230, 139, 67], 'sehr schlecht #951F2B': [149, 31, 43] };
  const gefunden = { gesaettigt: 0 }; Object.keys(farben).forEach(k2 => { gefunden[k2] = 0; });
  fs.readdirSync(TMP).filter(f => /^seite-.*\.ppm$/.test(f)).forEach(f => {
    const buf = fs.readFileSync(path.join(TMP, f));
    let pos = 0, tok = []; while (tok.length < 4) { while (/\s/.test(String.fromCharCode(buf[pos]))) pos++; let s2 = ''; while (!/\s/.test(String.fromCharCode(buf[pos]))) s2 += String.fromCharCode(buf[pos++]); tok.push(s2); } pos++;
    for (let i = pos; i + 2 < buf.length; i += 3) { Object.entries(farben).forEach(([k2, c]) => { if (Math.abs(buf[i] - c[0]) < 6 && Math.abs(buf[i + 1] - c[1]) < 6 && Math.abs(buf[i + 2] - c[2]) < 6) gefunden[k2]++; });
      const mx = Math.max(buf[i], buf[i + 1], buf[i + 2]), mn = Math.min(buf[i], buf[i + 1], buf[i + 2]);
      if (mx > 90 && (mx - mn) / mx > 0.5) gefunden.gesaettigt++;
    }
  });
  check('PDF enthält Pixel in den Eckfarben #17643A (sehr gut) und #951F2B (sehr schlecht) – die Diagramme sind farbig gedruckt, nicht grau', gefunden['sehr gut #17643A'] > 200 && gefunden['sehr schlecht #951F2B'] > 200, gefunden);
  check('PDF enthält auch die Zwischentöne der Skala (gelb/orange, interpoliert): viele stark gesättigte Pixel', gefunden.gesaettigt > 1500, gefunden);
  await q.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await q.emulateMedia({ media: 'screen' });

  // ---- PDF mit langen Namen und Plattenprodukten
  const q2 = await neu(1280, 900);
  await waehle(q2, 'naturstein_hart', 'keramikfliese', 'schiefer'); await eingabe(q2, 100, 20);
  await q2.evaluate(() => MM.exportieren.druckVorbereiten());
  await q2.emulateMedia({ media: 'print' });
  const pdf2 = path.join(TMP, 'b2.pdf');
  await q2.pdf({ path: pdf2, format: 'A4', printBackground: true });
  const t2 = execFileSync('pdftotext', ['-layout', pdf2, '-']).toString().replace(/\s+/g, ' ');
  check('PDF mit Naturstein/Fliesen/Schiefer: Namen und Gewicht aus dem Flächengewicht erscheinen, kein Abschneiden', t2.includes('Naturstein, hart (Fassadenplatte 30 mm)') && t2.includes('Keramische Fliesen (Steinzeug, unglasiert)') && t2.includes('Fläche × Flächengewicht') && !/undefined|NaN/.test(t2));
  // ---- PDF im leeren Zustand
  const q3 = await neu(1280, 900);
  await q3.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await q3.emulateMedia({ media: 'print' });
  const pdf3 = path.join(TMP, 'b3.pdf');
  await q3.pdf({ path: pdf3, format: 'A4', printBackground: true });
  const t3 = execFileSync('pdftotext', ['-layout', pdf3, '-']).toString().replace(/\s+/g, ' ');
  check('Leerer Zustand: Druck bricht nicht ab, Kopf sagt "Es ist kein Material gewählt"', t3.includes('Es ist kein Material gewählt') && t3.includes('Vergleichsbericht'));

  // ================= 9. Bildschirm: Layout und Bedienbarkeit =================
  for (const w of [320, 375, 768, 1280]) {
    const s = await neu(w, 900);
    await waehle(s, 'mineralwolle', 'xps', 'eps'); await eingabe(s, 100, 20);
    await oeffneAlle(s); await menue(s);
    const r2 = await s.evaluate(() => { const cw = document.documentElement.clientWidth; const l = document.querySelector('.export-leiste').getBoundingClientRect(); const bs = [...document.querySelectorAll('.export-leiste .export-toggle, .export-leiste .export-eintrag')].map(b => { const x = b.getBoundingClientRect(); return { h: Math.round(x.height), r: Math.round(x.right), l: Math.round(x.left) }; });
      return { seite: document.documentElement.scrollWidth <= cw, drin: l.left >= 0 && l.right <= cw + 1, knoepfe: bs, hoehe: Math.min(...bs.map(b => b.h)), innen: bs.every(b => b.l >= 0 && b.r <= cw) }; });
    check(`Breite ${w}: Export-Leiste passt in die Seite, Knöpfe ≥ 40 px hoch, kein seitliches Scrollen`, r2.seite && r2.drin && r2.innen && r2.hoehe >= 40, r2);
    await s.close();
  }
  const kon = await p.evaluate(() => { const rgb = c => (c.match(/[\d.]+/g) || []).map(Number); const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const bg = e => { for (let x = e; x; x = x.parentElement) { const c = rgb(getComputedStyle(x).backgroundColor); if (c.length >= 3 && (c.length === 3 || c[3] > 0.9)) return c.slice(0, 3); } return [255, 255, 255]; };
    const v = e => { const a = lum(rgb(getComputedStyle(e).color).slice(0, 3)), b2 = lum(bg(e)); return Math.round((Math.max(a, b2) + 0.05) / (Math.min(a, b2) + 0.05) * 100) / 100; };
    return { hinweis: v(document.querySelector('.export-leiste .hint')), titel: v(document.querySelector('.export-toggle')), knopf: v(document.querySelector('#csv-knopf')) }; });
  check('Kontrast (WCAG AA ≥ 4,5:1): Hinweistexte, Titel und Knopfbeschriftung der Export-Leiste', kon.hinweis >= 4.5 && kon.titel >= 4.5 && kon.knopf >= 4.5, kon);
  await p.focus('#diagramme-weitere-knopf'); await p.keyboard.press('Tab');      // per Tastatur, damit :focus-visible gilt (der Export steht seit MaterialMatch 2.0 unter den Diagrammen)
  check('Tastatur: Export-Knöpfe sind fokussierbar mit sichtbarem Fokusrahmen', await p.evaluate(() => { const s = getComputedStyle(document.activeElement); return document.activeElement.id === 'export-menue-knopf' && s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2; }));

  check('Keine Konsolenfehler oder -warnungen im gesamten Lauf', errors.length === 0, errors.slice(0, 3));
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
  await b.close();
  process.exit(fails === 0 ? 0 : 1);
})();
