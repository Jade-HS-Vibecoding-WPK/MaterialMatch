/* Schritt 11 – Erweiterung der Baustoffdatenbank (50 Baustoffe)
   Aufruf:  node tests/test21.js
   Erwartungen kommen aus (a) von Hand abgeleiteten Zahlen und (b) der ÖKOBAUDAT-Originaldatei,
   die hier unabhängig vom Importwerkzeug gelesen wird (tests/extrahiere_csv.py). */
const { chromium } = require('playwright');
require('./_offline.js');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 600))); }

const PROJEKT = path.resolve(__dirname, '..');
const URL = 'file://' + path.join(PROJEKT, 'index.html') + '?modus=demo';
const CSV = '/home/user/oekobaudat_original/oekobaudat_2024-II_csv_punkt.csv';

// ---- Von Hand festgelegt: die 33 neuen Baustoffe und ihr Datensatz-Präfix (UUID, 8 Zeichen)
const NEU = {
  leichtbetonstein_bims: 'a1deced7', leichtbetonstein_blaehton: '23fc083c', kalksandstein: 'c916ceb3', massivholz_nadel: '2bd4c91f', massivholz_laub: 'e131431f',
  glaswolle: 'ceaaae5b', steinwolle: '5ad90c89', xps: 'c4ddfdbc', pur: 'b960f95d', pir: '355dbd58', flachsdaemmung: 'b7b7c6be', kork: 'fdbe82c6', schaumglas: '7091503e', schafwolle: '4f0df91e',
  faserzement: '161e1abd', aluminium: '143a4df2', stahlblech: '89318772', naturstein_hart: 'e2e9d29e', naturstein_weich: 'b3e4257b', keramikfliese: '91935678', kalkzementputz: 'dca9f05c', glas: 'dcf38066',
  gipsfaserplatte: '1b0a3488', spanplatte: 'dce28570', sperrholz: '1c01243d', zementestrich: '86d919ee', calciumsulfatestrich: '3abc810c', kalkgipsinnenputz: '9a670d29',
  betondachstein: 'ee6d9736', schiefer: '909a1f8a', zinkblech: 'e3086b26', bitumenbahn: 'c984526a', epdm: '498cd894'
};
const ALT = ['normalbeton', 'stahlbeton', 'hochlochziegel', 'porenbeton', 'brettsperrholz', 'brettschichtholz', 'konstruktionsvollholz', 'baustahl', 'mineralwolle', 'eps', 'holzfaserdaemmung', 'zellulose', 'hanfdaemmung', 'klinker', 'gipskarton', 'osb', 'dachziegel'];
// Handrechnung der Kategorien (Materialien mit zwei Kategorien zählen doppelt)
const KAT = { tragend: 13, daemmstoff: 14, fassade: 11, innenausbau: 11, dach: 8 };
const KEINE_SCHICHT_MIT_FG = ['naturstein_hart', 'naturstein_weich', 'keramikfliese', 'glas', 'gipsfaserplatte', 'betondachstein', 'schiefer', 'bitumenbahn', 'epdm'];
const PREIS_SPANNE = ['kalksandstein', 'calciumsulfatestrich', 'kalkgipsinnenputz', 'kalkzementputz'];   // seit MaterialMatch 3.2 mit belegter Preisspanne
const DAEMM_NEU = ['glaswolle', 'steinwolle', 'xps', 'pur', 'pir', 'flachsdaemmung', 'kork', 'schaumglas', 'schafwolle'];

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async (w = 1280, h = 900) => { const pg = await b.newPage({ viewport: { width: w, height: h } }); pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); pg.on('pageerror', e => errors.push(String(e))); await pg.goto(URL); await pg.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; }); await pg.$$eval('main section.panel > details', d => d.forEach(x => { x.open = true; })); return pg; };
  const p = await neu();
  const DB = await p.evaluate(() => JSON.parse(JSON.stringify(MATERIALMATCH_DATA)));

  // ================= 1. Datenbestand =================
  const ids = DB.baustoffe.map(m => m.id);
  check('50 Baustoffe, IDs eindeutig (17 bisherige + 33 neue)', ids.length === 50 && new Set(ids).size === 50 && ALT.every(i => ids.includes(i)) && Object.keys(NEU).every(i => ids.includes(i)), ids.length);
  check('Version 0.4.0 und Hinweistext nennt "nicht verfügbar" für die ergänzten Baustoffe', DB.meta.version === '0.4.0' && DB.meta.hinweis.includes('„nicht verfügbar“'));
  const proKat = {}; DB.baustoffe.forEach(m => m.kategorien.forEach(k => { proKat[k] = (proKat[k] || 0) + 1; }));
  check('Kategorien: A 13, B 14, C 11, D 11, E 8 (Handrechnung; Massivholz, Fliesen, Aluminium, Stahlblech, Schiefer, Zink mehrfach)', JSON.stringify(proKat) === JSON.stringify(KAT), proKat);
  const pruef = await p.evaluate(() => MM.pruefeDaten(MATERIALMATCH_DATA));
  check('Prüfprogramm: 0 Fehler, 0 Warnungen', pruef.fehler.length === 0 && pruef.warnungen.length === 0, pruef);
  const namen = DB.baustoffe.map(m => m.name);
  check('Alle 50 Namen eindeutig und nicht leer', new Set(namen).size === 50 && namen.every(n => n.length > 3));

  // ---- neue Baustoffe: nur belegte Werte, sonst "nicht verfügbar"
  const neue = DB.baustoffe.filter(m => NEU[m.id]);
  const nurBelegt = neue.every(m => {
    const e = m.eigenschaften;
    // seit der Recherche vom 16.11.2026 darf ein Wert auch belegt sein: Richtwert mit Quelle (Herstellerdatenblatt, ETA, EU-Entscheidung) aus dem Katalog
    const nvOderBelegt = x => (x.wert === null && x.art === null && x.quelle === null && /^Nicht verfügbar: /.test(x.hinweis)) || (x.wert !== null && x.art === 'richtwert' && DB.quellen.some(q => q.id === x.quelle && q.geprueft === true && q.quellenart && q.region && q.geltung && /^https:/.test(q.url)));
    const lambdaOk = nvOderBelegt(e.waermeleitfaehigkeit);
    const preisOk = (e.preis.wert === null && /^Nicht verfügbar: /.test(e.preis.hinweis)) || (PREIS_SPANNE.includes(m.id) && !!e.preis.spanne && e.preis.art === 'richtwert' && DB.quellen.some(q => q.id === e.preis.quelle && /^Preisspanne/.test(q.quellenart)));   // seit 3.2: Preisspanne aus belegten Produktpreisen
    const brandOk = nvOderBelegt(e.brandverhalten);
    const rest = ['wasserdampf_mu', 'waermekapazitaet', 'recycling'].every(k => nvOderBelegt(e[k]));
    const druckOk = DAEMM_NEU.includes(m.id) ? e.druckfestigkeit.nicht_anwendbar === true : (e.druckfestigkeit.wert === null && /^Nicht verfügbar: /.test(e.druckfestigkeit.hinweis));
    return lambdaOk && preisOk && brandOk && rest && druckOk;
  });
  check('Alle 33 neuen: λ, Preis, Brandverhalten, μ, Wärmekapazität, Recycling = „Nicht verfügbar: …“ mit Begründung oder ein Richtwert mit vollständig belegter Quelle (nichts erfunden); der Preis bleibt „nicht verfügbar“, außer bei den vier Materialien mit belegter Preisspanne (seit 3.2)', nurBelegt);
  check('Kein neuer Baustoff enthält Beispieldaten (art "beispiel") und keine ungeprüften Vor-/Nachteile', neue.every(m => JSON.stringify(m).indexOf('"beispiel"') === -1 && m.vorteile.length === 0 && m.nachteile.length === 0));
  const alteUnveraendert = DB.baustoffe.filter(m => ALT.includes(m.id)).every(m => Object.values(m.eigenschaften).some(e => e.art === 'beispiel'));
  check('Die 17 bisherigen Baustoffe behalten ihre Beispieldaten (unverändert, nicht stillschweigend aufgewertet)', alteUnveraendert);

  // ================= 2. Gegenprobe mit der ÖKOBAUDAT-Originaldatei =================
  const quellenNeu = Object.fromEntries(Object.keys(NEU).map(id => [id, DB.quellen.find(q => q.uuid && q.uuid.startsWith(NEU[id]))]));
  check('Zu jedem der 33 Baustoffe gibt es genau eine Quelle (Datensatz-UUID)', Object.values(quellenNeu).every(Boolean) && new Set(Object.values(quellenNeu).map(q => q.id)).size === 33);
  const csv = JSON.parse(execFileSync('python3', ['-I', path.join(PROJEKT, 'tests', 'extrahiere_csv.py'), CSV, ...DB.quellen.filter(q => q.uuid).map(q => q.uuid)], { maxBuffer: 1 << 26 }).toString());
  check('Die CSV liefert alle 61 Datensätze (49 der Materialien + 12 herstellerspezifische für Produkte, Datenpaket 1)', Object.keys(csv).length === 61, Object.keys(csv).length);
  let abw = [];
  neue.forEach(m => {
    const q = quellenNeu[m.id], c = csv[q.uuid], e = m.eigenschaften;
    const teiler = c.einheit === 'kg' && c.bezug === 1000 ? 1000 : 1;
    const erwEinheit = c.einheit === 'm3' ? '1 m³' : c.einheit === 'qm' ? '1 m²' : '1 kg';
    const fl = (x, y) => Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(y));
    if (!(e.gwp.werte && fl(e.gwp.werte.gesamt, c.gesamt / teiler) && fl(e.gwp.werte.fossil, c.fossil / teiler) && fl(e.gwp.werte.biogen, c.biogen / teiler))) abw.push(m.id + ': GWP');
    if ((e.gwp.luluc !== undefined || (e.gwp.werte && e.gwp.werte.luluc !== undefined)) && c.luluc !== null && !fl(e.gwp.werte.luluc, c.luluc / teiler)) abw.push(m.id + ': luluc');
    if (e.gwp.deklarierte_einheit !== erwEinheit || e.gwp.module !== 'A1-A3' || e.gwp.art !== 'richtwert' || e.gwp.quelle !== q.id) abw.push(m.id + ': Einheit/Modul/Art/Quelle');
    if (KEINE_SCHICHT_MIT_FG.includes(m.id)) { if (!(e.flaechengewicht.wert === c.fg && e.rohdichte.wert === null)) abw.push(m.id + ': Flächengewicht'); }
    else if (e.rohdichte.wert !== c.rho || e.rohdichte.art !== 'richtwert' || e.rohdichte.quelle !== q.id) abw.push(m.id + ': Rohdichte');
  });
  check('Alle 33 neuen Baustoffe: GWP (gesamt, fossil, biogen), Bezugsgröße, Rohdichte bzw. Flächengewicht stimmen mit der CSV überein', abw.length === 0, abw);
  check('Quellen: https-Link mit der UUID, geprüft, Abrufdatum, Typ bekannt', DB.quellen.filter(q => q.uuid).every(q => q.url.startsWith('https://www.oekobaudat.de/OEKOBAU.DAT/resource/processes/' + q.uuid) && q.geprueft === true && ['2026-11-16', '2026-11-17'].includes(q.abgerufen) && ['generic dataset', 'average dataset', 'representative dataset', 'specific dataset'].includes(q.typ)));
  const PRODUKT_UUIDS = ['880239e9', '766ea5bd', '22527f3b', '7688e355', 'e8cf2935', '792a0e85', 'a612d5a0', 'cddad814', '29396128', '69430bba', 'ba2a4652', '899c73e4'];   // Datenpaket 1: gehören zu Produkten, nicht zu den Materialien (prüft test42)
  const spez = DB.quellen.filter(q => q.typ === 'specific dataset' && !PRODUKT_UUIDS.includes((q.uuid || '').slice(0, 8)) && !/^epd-steico-(therm|therm-dry|special-dry|universal|universal-dry)$/.test(q.id));   // die fünf STEICO-EPDs seit Datenpaket 3 gehören zu Produkten (prüft test49)
  check('Vier produktspezifische Datensätze (Schafwolle, Zink aus der ÖKOBAUDAT; EPDs von STEICOflex 036 und KVH® aus dem Quellenkatalog) sind als solche gekennzeichnet; keine "generisch"-Aussage', spez.length === 4 && spez.every(q => /Herstellerprodukt|Herstellerdeklaration|Produktspezifischer/.test(q.qualitaet)) && DB.baustoffe.filter(m => ['schafwolle', 'zinkblech'].includes(m.id)).every(m => /Herstellerprodukt/.test(m.produkt) && /Gilt für das genannte Herstellerprodukt/.test(m.eigenschaften.gwp.hinweis)), spez.map(q => q.id));
  const toolRes = require('child_process').spawnSync('node', [path.join(PROJEKT, 'tools', 'pruefe_gegen_csv.js')], { encoding: 'utf8' });
  check('Unabhängiges Werkzeug tools/pruefe_gegen_csv.js: "Alle Werte stimmen mit der CSV überein" (Exit-Code 0)', toolRes.status === 0 && /Alle Werte stimmen/.test(toolRes.stdout), toolRes.stdout.slice(-200));

  // ================= 3. Auswahlfelder =================
  const optionen = async (kat) => { await p.selectOption('#kategorie', kat); return p.$$eval('#materialA option', o => o.filter(x => x.value).map(x => x.value)); };
  const erwartet = k => DB.baustoffe.filter(m => m.kategorien.includes(k)).map(m => m.id);
  let listenOk = true, detail = {};
  for (const k of Object.keys(KAT)) { const o = await optionen(k); detail[k] = o.length; if (JSON.stringify(o.sort()) !== JSON.stringify(erwartet(k).sort())) listenOk = false; }
  check('Dropdown "Material A" zeigt je Kategorie genau die Baustoffe dieser Kategorie (13/14/11/11/8)', listenOk && JSON.stringify(detail) === JSON.stringify(KAT), detail);
  const trag = await optionen('tragend'), innen = await optionen('innenausbau');
  check('Massivholz Nadel/Laub erscheint in "Tragende Baustoffe" und in "Innenausbau"', ['massivholz_nadel', 'massivholz_laub'].every(i => trag.includes(i) && innen.includes(i)));

  // ================= 4. Alle 33 neuen Baustoffe: CO₂ und Gewicht unabhängig nachgerechnet =================
  const FLAECHE = 100, DICKE = 0.2;
  const zahlAus = t => { const x = t.replace(/\s*=.*$/, '').replace(/\./g, '').replace(',', '.').replace(/[^\d.\-–]/g, ''); return x === '–' || x === '' ? null : parseFloat(x); };
  const tabZeile = async (sel, label) => (await p.$$eval(sel + ' table tr', trs => trs.map(tr => [...tr.cells].map(c => { const x = c.cloneNode(true); x.querySelectorAll('sup.fn').forEach(s => s.remove()); return x.textContent.replace(/\s+/g, ' ').trim(); })))).find(r => r[0].startsWith(label));
  let co2Fehler = [], gewFehler = [];
  for (const id of Object.keys(NEU)) {
    await p.evaluate(i => MM.auswahl.setzeAuswahl({ a: i, b: '', c: '' }), id);
    await p.fill('#flaeche', String(FLAECHE)); await p.fill('#dicke', '20');
    await p.$$eval('details', d => d.forEach(x => { x.open = true; }));
    const m = DB.baustoffe.find(x => x.id === id), c = csv[quellenNeu[id].uuid];
    // erwartetes CO₂ (gesamt) für 100 m² × 20 cm
    let erwCo2;
    if (c.einheit === 'm3') erwCo2 = FLAECHE * DICKE * c.gesamt;
    else if (c.einheit === 'kg') erwCo2 = FLAECHE * DICKE * c.rho * c.gesamt;
    else erwCo2 = FLAECHE * c.gesamt;             // je m² (Plattenprodukt/Deckung): Fläche × Kennwert, Dicke unbeachtet
    const zeile = await tabZeile('#rechnung-co2', 'CO₂-Menge gesamt');
    const ist = zeile ? zahlAus(zeile[1]) : null;
    if (c.einheit === 'qm' && m.mengenmodell === 'schicht') { /* kommt nicht vor */ }
    if (ist === null || Math.abs(ist - erwCo2) > Math.max(0.006 * Math.abs(erwCo2), 0.06)) co2Fehler.push(id + ' erwartet ' + erwCo2.toFixed(2) + ' angezeigt ' + (zeile && zeile[1]));
    // erwartetes Gewicht
    const gz = await tabZeile('#ergebnis-menge', 'Gesamtgewicht');
    const gIst = gz ? zahlAus(gz[1]) : null;
    let gErw = null;
    if (KEINE_SCHICHT_MIT_FG.includes(id)) gErw = FLAECHE * c.fg;
    else if (m.mengenmodell === 'schicht') gErw = FLAECHE * DICKE * c.rho;
    if ((gErw === null) !== (gIst === null) || (gErw !== null && Math.abs(gIst - gErw) > Math.max(0.006 * gErw, 0.06))) gewFehler.push(id + ' erwartet ' + gErw + ' angezeigt ' + (gz && gz[1]));
  }
  check('CO₂-Menge (gesamt) aller 33 neuen Baustoffe für 100 m² × 20 cm stimmt mit der unabhängigen Rechnung aus der CSV überein (je m³, je kg über Rohdichte, je m²)', co2Fehler.length === 0, co2Fehler);
  check('Gesamtgewicht aller 33: Schicht = A × d × ρ, Plattenprodukte/Deckungen = A × Flächengewicht, Faserzement "–" (kein Flächengewicht)', gewFehler.length === 0, gewFehler);

  // ================= 5. Vergleichbarkeit, Gewichtsdiagramm =================
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'dachziegel', b: 'zinkblech', c: 'epdm' }));
  await p.fill('#flaeche', '100'); await p.fill('#dicke', '20');
  const gew = await p.$$eval('figure[data-chart="gewicht"] .chart-track', t => t.map(x => x.getAttribute('aria-label')));
  check('Gewichtsdiagramm: Zinkblech (Schicht) neben Deckung/Bahn = "nicht vergleichbar", die beiden Flächengewichte (4.500 kg, 200 kg) werden gezeigt', gew.length === 3 && /4\.500 kg/.test(gew[0]) && /nicht vergleichbar/.test(gew[1]) && /200 kg/.test(gew[2]), gew);
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'kalksandstein', b: 'leichtbetonstein_bims', c: 'normalbeton' }));
  const kz = await tabZeile('#rechnung-co2', 'Kennwert GWP gesamt');
  check('Kalksandstein/Leichtbetonstein/Normalbeton (alle generisch, A1–A3, je m³): CO₂ direkt vergleichbar, kein Warnhinweis', kz && kz.length === 4 && !(await p.$eval('#rechnung-co2', e => e.innerText)).includes('Kein belastbarer direkter Vergleich'));
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'kalksandstein', b: 'massivholz_nadel', c: '' }));
  const txtCo2 = await p.$eval('#rechnung-co2', e => e.innerText.replace(/\s+/g, ' '));
  check('Kalksandstein gegen Nadelholz: Biogen-Anteil getrennt ausgewiesen, keine pauschale "Holz ist besser"-Aussage', /davon biogen/.test(txtCo2) && !/Holz ist (immer )?(nachhaltiger|besser)/i.test(await p.evaluate(() => document.body.innerText)));
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'zinkblech', c: '' }));
  await p.fill('#flaeche', '100'); await p.fill('#dicke', '20');
  check('Dämmstoff gegen Zinkblech: der Vergleich führt nicht zu Absturz/Leerseite (Tabelle vorhanden)', (await p.$$eval('#ergebnis-menge table', t => t.length)) === 1 && (await p.$$eval('#ergebnis-technisch table', t => t.length)) === 1);

  // ---- Datensatztyp "produktspezifisch" wird richtig benannt (früher: fälschlich "Beispieldaten")
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'dachziegel', b: 'betondachstein', c: 'zinkblech' }));
  await p.fill('#flaeche', '100'); await p.fill('#dicke', '20');
  const diaCo2 = await p.$eval('figure[data-chart="co2-fossil"]', e => e.innerText.replace(/\s+/g, ' '));
  check('CO₂-Hinweis nennt für Zinkblech "produktspezifischer Datensatz (Herstellerdeklaration)" statt "Beispieldaten" und erklärt die Grenzen', /produktspezifischer Datensatz \(Herstellerdeklaration\)/.test(diaCo2) && !/und Beispieldaten/.test(diaCo2) && /gelten nur für das genannte Produkt/.test(diaCo2), diaCo2.slice(0, 500));
  const fuss = await p.$eval('#rechnung-co2', e => e.innerText.replace(/\s+/g, ' '));
  check('Fußnote der Zink-Quelle: "produktspezifischer Datensatz (Herstellerdeklaration)", kein englischer Rohtext "specific dataset"', /RHEINZINK GmbH & Co. KG\), produktspezifischer Datensatz \(Herstellerdeklaration\)/.test(fuss) && !/specific dataset/.test(fuss), fuss.slice(-400));
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'xps', b: 'schafwolle', c: '' }));
  await p.fill('#flaeche', '100'); await p.fill('#dicke', '20');
  const diaSpez = await p.$eval('figure[data-chart="co2-fossil"]', e => e.innerText.replace(/\s+/g, ' '));
  check('Generisch gegen produktspezifisch (XPS gegen Schafwolle): Hinweis nennt die Sicherheitszuschläge der generischen Datensätze und die Produktbindung der Herstellerdeklaration', /Kein belastbarer direkter Vergleich möglich/.test(diaSpez) && /Generische Datensätze enthalten Sicherheitszuschläge von 10 bis 30 %\./.test(diaSpez) && /Produktspezifische Datensätze/.test(diaSpez), diaSpez.slice(0, 600));

  // ================= 6. Empfehlungen über alle 50 Materialien × 5 Prioritäten =================
  const t0 = Date.now();
  const emp = await p.evaluate(() => {
    const out = [];
    const prios = ['ausgewogen', 'kosten', 'co2', 'gewicht', 'waerme'];
    MATERIALMATCH_DATA.baustoffe.forEach(ref => prios.forEach(pr => {
      const r = MM.empfehlung.empfehle(MATERIALMATCH_DATA, ref.id, null, pr);
      out.push({ ref: ref.id, pr, meldung: r.meldung, bereich: r.bereich, kriterien: r.kriterien.map(k => k.id), empf: r.empfehlungen.map(e => ({ id: e.material.id, score: e.score, krit: e.kriterien.map(k => k.id), art: e.kriterien.map(k => k.art), belast: e.belastbarkeit && e.belastbarkeit.stufe, quellen: e.quellen.map(q => q.url) })), nicht: r.nichtEmpfohlen.map(n => ({ id: n.material.id, grund: n.grund })) });
    }));
    return out;
  });
  const dauer = Date.now() - t0;
  check(`250 Empfehlungsläufe (50 Materialien × 5 Prioritäten) ohne Fehler in ${dauer} ms`, emp.length === 250 && dauer < 20000, dauer);
  const byId = Object.fromEntries(DB.baustoffe.map(m => [m.id, m]));
  const KOSTEN = ['kosten', 'kosten_r'];
  let verstoss = [];
  emp.forEach(r => {
    const refM = byId[r.ref];
    const kand = DB.baustoffe.filter(m => m.id !== r.ref && r.bereich && m.anwendungen.includes(r.bereich)).map(m => m.id);
    r.empf.forEach(e => {
      const m = byId[e.id];
      if (e.id === r.ref) verstoss.push([r.ref, r.pr, 'empfiehlt sich selbst']);
      if (!m.anwendungen.includes(r.bereich)) verstoss.push([r.ref, r.pr, e.id, 'falscher Anwendungsbereich']);
      if (e.krit.length < 2 || !e.krit.some(k => !KOSTEN.includes(k))) verstoss.push([r.ref, r.pr, e.id, 'weniger als zwei Kriterien oder nur Preis', e.krit]);
      if (!(e.score >= 0 && e.score <= 1)) verstoss.push([r.ref, r.pr, e.id, 'Score außerhalb 0..1', e.score]);
      // Jedes Kriterium muss in den Rohdaten vorhanden sein
      e.krit.forEach(k => {
        const x = m.eigenschaften;
        if (['kosten', 'kosten_r'].includes(k) && !(typeof x.preis.wert === 'number')) verstoss.push([r.ref, e.id, k, 'Preis fehlt']);
        if (['lambda', 'kosten_r', 'co2_r'].includes(k) && !(typeof x.waermeleitfaehigkeit.wert === 'number')) verstoss.push([r.ref, e.id, k, 'λ fehlt']);
        if (['co2', 'co2_r'].includes(k) && !(x.gwp && x.gwp.werte)) verstoss.push([r.ref, e.id, k, 'CO₂ fehlt']);
        if (k === 'gewicht' && !(typeof x.rohdichte.wert === 'number')) verstoss.push([r.ref, e.id, k, 'Rohdichte fehlt']);
      });
      // CO₂ nur bei gleichem Datensatztyp und gleichen Modulen
      if (e.krit.some(k => ['co2', 'co2_r'].includes(k))) {
        const qa = DB.quellen.find(q => q.id === refM.eigenschaften.gwp.quelle), qb = DB.quellen.find(q => q.id === m.eigenschaften.gwp.quelle);
        if (!qa || !qb || qa.typ !== qb.typ || refM.eigenschaften.gwp.module !== m.eigenschaften.gwp.module) verstoss.push([r.ref, e.id, 'CO₂ bei unterschiedlichem Datensatztyp/Modul bewertet']);
      }
      if (e.belast === 'belastbar' ) verstoss.push([r.ref, r.pr, e.id, 'als belastbar eingestuft, obwohl Preis/λ Beispieldaten sind oder fehlen']);
    });
    // Zerlegung: Empfohlene + nicht Empfohlene = alle Kandidaten (wenn überhaupt bewertet wurde)
    if (r.meldung === null && r.bereich) {
      const alle = new Set([...r.empf.map(e => e.id), ...r.nicht.map(n => n.id)]);
      if (alle.size !== kand.length || kand.some(i => !alle.has(i))) verstoss.push([r.ref, r.pr, 'Kandidaten fehlen in der Auswertung', kand.length, alle.size]);
    }
    r.nicht.forEach(n => { if (!n.grund || n.grund.length < 20) verstoss.push([r.ref, n.id, 'Begründung fehlt']); });
  });
  check('Empfehlungslogik, alle 250 Läufe: nie das Ausgangsmaterial, richtiger Anwendungsbereich, ≥ 2 Kriterien mit mind. einem Nicht-Preis-Kriterium, Rohdaten vorhanden, CO₂ nur bei gleichem Typ/Modul, Score 0–1, nie "belastbar", jedes Material erscheint entweder als Empfehlung oder mit Begründung', verstoss.length === 0, verstoss.slice(0, 6));
  const neuEmpf = emp.filter(r => r.empf.some(e => NEU[e.id] && !PREIS_SPANNE.includes(e.id)));
  const neuEmpfOhneGewicht = neuEmpf.filter(r => r.pr !== 'gewicht' && r.pr !== 'waerme');
  check('Neue Baustoffe ohne Preis und λ werden nur empfohlen, wenn zwei echte Nicht-Preis-Kriterien vorliegen (nie bei "ausgewogen", "kosten", "co2")', neuEmpfOhneGewicht.length === 0, neuEmpfOhneGewicht.slice(0, 3).map(r => [r.ref, r.pr, r.empf.map(e => e.id)]));
  const daemmEmp = emp.filter(r => r.bereich === 'waermedaemmung').flatMap(r => r.empf.map(e => e.id));
  check('Dämmstoff-Empfehlungen: ausschließlich die Dämmstoffe, für die λ, Preis (Beispiel) und CO₂ vorliegen (Glaswolle hat λ und CO₂, aber keinen Preis und wird nur darüber bewertet)', daemmEmp.length > 0 && daemmEmp.every(i => ['mineralwolle', 'eps', 'holzfaserdaemmung', 'zellulose', 'hanfdaemmung', 'glaswolle'].includes(i)), [...new Set(daemmEmp)]);
  const nichtDaemm = emp.find(r => r.ref === 'mineralwolle' && r.pr === 'ausgewogen').nicht.filter(n => DAEMM_NEU.includes(n.id));
  check('Mineralwolle/ausgewogen: alle 9 neuen Dämmstoffe stehen unter "nicht empfohlen" mit Grund und Hinweis auf fehlende Kennwerte', nichtDaemm.length === 9 && nichtDaemm.every(n => /Weniger als zwei vergleichbare Kennwerte/.test(n.grund) && /Fehlend:/.test(n.grund) && /Wärmeleitfähigkeit|Kosten/.test(n.grund)), nichtDaemm.map(n => n.id));
  const neueAlsRef = emp.filter(r => NEU[r.ref] && r.pr === 'ausgewogen');
  check('Neue Baustoffe als Ausgangsmaterial: keine Fehler; ohne Preis und λ gibt es eine verständliche Meldung statt einer leeren Liste', neueAlsRef.length === 33 && neueAlsRef.every(r => r.empf.length > 0 || (r.meldung && r.meldung.length > 20) || r.nicht.length > 0), neueAlsRef.filter(r => !(r.empf.length > 0 || r.meldung || r.nicht.length)).map(r => r.ref));

  // ================= 7. Oberfläche: Alternativen-Panel für neue Materialien =================
  const q = await neu(1280);
  await q.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: '', c: '' }));
  const alt = await q.$eval('#alternativen-inhalt', e => e.innerText.replace(/\s+/g, ' '));
  check('Alternativen für Mineralwolle: "Geprüft, aber nicht empfohlen (10)" (13 Kandidaten − 3 Karten)', alt.includes('Geprüft, aber nicht empfohlen (10)'), alt.slice(0, 200));
  await q.evaluate(() => MM.reiter.zeige('alternativen'));
  await q.click('#alternativen-inhalt details.sub summary');
  const liste = await q.$eval('#alternativen-inhalt .rec-list', l => l.innerText.replace(/\s+/g, ' '));
  check('Die Liste nennt die neuen Dämmstoffe (XPS, Kork, Schaumglas …) mit Begründung statt sie zu verschweigen', ['XPS', 'Kork', 'Schaumglas', 'Glaswolle', 'Schafwolle', 'PIR', 'PUR'].every(n => liste.includes(n)) && liste.includes('Weniger als zwei vergleichbare Kennwerte'), liste.slice(0, 300));
  await q.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'leichtbetonstein_bims', b: '', c: '' }));
  const altKs = await q.$eval('#alternativen-inhalt', e => e.innerText.replace(/\s+/g, ' '));
  check('Leichtbetonstein Bims (keine Preise; Kalksandstein hat seit 3.2 eine Preisspanne): Meldung statt Absturz; keine Karte, die nur nach Preis empfohlen würde', !/nur wegen des Preises empfohlen/.test(altKs) && (await q.$$eval('#alternativen-inhalt article.rec-card', c => c.length)) === 0 && altKs.length > 100, altKs.slice(0, 250));
  await q.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'normalbeton', b: '', c: '' }));
  await q.evaluate(() => MM.alternativen.setzePrioritaet('gewicht'));
  const kartenGewicht = await q.$$eval('#alternativen-inhalt article.rec-card', c => c.map(x => x.dataset.material));
  check('Normalbeton mit Priorität "Geringes Gewicht": Karten ergeben sich nur aus Materialien mit Rohdichte, CO₂ und (Beispiel-)Preis; mind. 1 Karte', kartenGewicht.length >= 1 && kartenGewicht.every(i => typeof byId[i].eigenschaften.rohdichte.wert === 'number'), kartenGewicht);
  await q.evaluate(() => MM.alternativen.setzePrioritaet('ausgewogen'));

  // ================= 7b. Datenqualitäts-Prüfregeln mit absichtlich fehlerhaften Daten =================
  const fix = await p.evaluate(() => {
    const kopie = () => JSON.parse(JSON.stringify(MATERIALMATCH_DATA));
    const lauf = d => MM.pruefeDaten(d);
    const r = {};
    let d = kopie(); d.baustoffe.find(m => m.id === 'eps').eigenschaften.waermeleitfaehigkeit.wert = 9999; r.lambda = lauf(d);
    d = kopie(); d.baustoffe.find(m => m.id === 'kalksandstein').eigenschaften.rohdichte.wert = 99999; r.rohdichte = lauf(d);
    d = kopie(); d.baustoffe.find(m => m.id === 'xps').name = d.baustoffe.find(m => m.id === 'eps').name; r.name = lauf(d);
    d = kopie(); const bd = d.baustoffe.find(m => m.id === 'betondachstein'); bd.eigenschaften.flaechengewicht.wert = null; bd.eigenschaften.flaechengewicht.art = null; r.ohneGewicht = lauf(d);
    d = kopie(); d.baustoffe.find(m => m.id === 'kalksandstein').eigenschaften.rohdichte.wert = null; d.baustoffe.find(m => m.id === 'kalksandstein').eigenschaften.rohdichte.art = null; r.schichtOhneRohdichte = lauf(d);
    d = kopie(); d.baustoffe.find(m => m.id === 'xps').eigenschaften.gwp.werte.fossil = -5; r.negativFossil = lauf(d);
    r.original = lauf(kopie());
    return r;
  });
  check('Prüfregel: λ = 9999 W/(m·K) wird als außerhalb des üblichen Bereichs gemeldet', fix.lambda.warnungen.some(w => /waermeleitfaehigkeit: Wert 9999 liegt außerhalb/.test(w)), fix.lambda);
  check('Prüfregel: Rohdichte 99.999 kg/m³ wird gemeldet', fix.rohdichte.warnungen.some(w => /rohdichte: Wert 99999 liegt außerhalb/.test(w)), fix.rohdichte);
  check('Prüfregel: doppelter Materialname wird gemeldet', fix.name.warnungen.some(w => /kommt mehrfach vor/.test(w)), fix.name);
  check('Prüfregel: Plattenprodukt ohne Rohdichte UND ohne Flächengewicht -> Warnung "Weder Rohdichte noch Flächengewicht"', fix.ohneGewicht.warnungen.some(w => /Weder Rohdichte noch Flächengewicht/.test(w)), fix.ohneGewicht);
  check('Prüfregel: Schichtmaterial ohne Rohdichte -> Warnung "Rohdichte fehlt"', fix.schichtOhneRohdichte.warnungen.some(w => /Rohdichte fehlt/.test(w)), fix.schichtOhneRohdichte);
  check('Prüfregel: negatives fossiles GWP wird gemeldet', fix.negativFossil.warnungen.some(w => /Fossiles GWP ist negativ/.test(w)), fix.negativFossil);
  check('Gegenprobe: unveränderte Daten ergeben weder Fehler noch Warnungen (Plattenprodukte mit Flächengewicht sind in Ordnung)', fix.original.fehler.length === 0 && fix.original.warnungen.length === 0);

  // ================= 8. Layout mit langen neuen Namen =================
  for (const w of [320, 375, 768, 1280]) {
    const s = await neu(w, 900);
    await s.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'leichtbetonstein_blaehton', b: 'naturstein_hart', c: 'keramikfliese' }));
    await s.fill('#flaeche', '100'); await s.fill('#dicke', '20');
    await s.$$eval('details', d => d.forEach(x => { x.open = true; }));
    const r = await s.evaluate(() => { const cw = document.documentElement.clientWidth; return { seite: document.documentElement.scrollWidth <= cw, aus: [...document.querySelectorAll('main *')].filter(e => !e.closest('.table-wrap') && e.getBoundingClientRect().width > 0 && (e.getBoundingClientRect().right > cw + 1)).length }; });
    check(`Breite ${w}: lange neue Materialnamen (Naturstein, hart (Fassadenplatte 30 mm) …) sprengen das Layout nicht`, r.seite && r.aus === 0, r);
    await s.close();
  }
  // Katalog und Matrix mit 50 Zeilen
  const kat = await q.$eval('#katalog', d => d.querySelectorAll('tbody tr').length);
  check('Katalog "Alle Baustoffe in der Datenbank" listet 50 Zeilen', kat === 50);

  // ================= 9. Gesamt =================
  check('Keine Konsolenfehler oder -warnungen im gesamten Lauf', errors.length === 0, errors.slice(0, 3));
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
  await b.close();
  process.exit(fails === 0 ? 0 : 1);
})();
