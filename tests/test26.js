/* Entscheidungen vom 16.11.2026 (zweite Runde)
   1  Start im Echtdaten-Modus, Demo-Modus optional; klarer Hinweis „nur zur Orientierung“
   2  Recherche fortgesetzt: neue belegte Werte mit vollständiger Quellenangabe
   3  Nennwert λD und Bemessungswert λB getrennt; R-Wert mit λB, sonst orientierend mit λD; beide Quellen sichtbar
   Aufruf:  node tests/test26.js */
const { chromium } = require('playwright');
require('./_offline.js');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 700))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html';
const nah = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// Rohdaten unabhängig von der Seite laden
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(PROJ, 'data', 'baustoffe.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(PROJ, 'data', 'produkte.js'), 'utf8'), ctx);
const DB = ctx.window.MATERIALMATCH_DATA;
const PR = ctx.window.MATERIALMATCH_PRODUKTE;
const prod = id => PR.find(p => p.id === id);
// Unabhängige Nachbildung: generischer Datensatz + Werte des Standardprodukts (so startet die Seite)
const KEYS = ['rohdichte', 'waermeleitfaehigkeit', 'waermeleitfaehigkeit_bemessung', 'druckfestigkeit', 'preis', 'gwp', 'brandverhalten', 'wasserdampf_mu', 'waermekapazitaet', 'recycling'];
const gemischt = m => { const e = Object.assign({}, m.eigenschaften); const std = PR.find(p => p.material === m.id && p.standard); if (std) Object.assign(e, std.eigenschaften); return e; };
const zaehleLive = (echtModus) => { const z = { richt: 0, bsp: 0, na: 0, nv: 0 }; DB.baustoffe.forEach(m => { const e = gemischt(m); KEYS.forEach(k => { const x = e[k] || {}; const ec = echtModus && x.echt && x.echt.wert !== null && x.echt.wert !== undefined; const hat = x.werte !== undefined ? x.werte !== null : (x.wert !== null && x.wert !== undefined); if (x.nicht_anwendbar) z.na++; else if (ec) z.richt++; else if (!hat) z.nv++; else if (x.art === 'beispiel') z.bsp++; else z.richt++; }); }); return z; };
const mat = id => DB.baustoffe.find(m => m.id === id);
const qu = id => DB.quellen.find(q => q.id === id);

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async (url = URL) => { const pg = await (await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true })).newPage(); pg.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); pg.on('pageerror', e => errors.push(String(e))); await pg.goto(url); await pg.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; }); return pg; };
  const waehle = (pg, a, b_ = '', c = '') => pg.evaluate(([a, b_, c]) => MM.auswahl.setzeAuswahl({ a, b: b_, c }), [a, b_, c]);
  const oeffne = pg => pg.$$eval('details', d => d.forEach(x => { x.open = true; }));
  const eingabe = async (pg, f, d) => { await pg.fill('#flaeche', String(f)); await pg.fill('#dicke', String(d)); };
  const modus = pg => pg.evaluate(() => { const l = document.getElementById('modus-leiste'); return { m: l.dataset.modus, an: document.getElementById('modus-schalter').checked, text: document.getElementById('modus-text').textContent }; });

  // ================= PUNKT 1: Start im Echtdaten-Modus =================
  let p = await neu();
  let m0 = await modus(p);
  check('Start ohne Zusatz: Echtdaten-Modus (Schalter aus, Leiste „echt“), Text nennt „nur der Orientierung“ und „keine verlässliche Produkt- oder Kostenberechnung“', m0.m === 'echt' && !m0.an && /Echtdaten-Modus/.test(m0.text) && /nur der Orientierung/.test(m0.text) && /keine verlässliche Produkt- oder Kostenberechnung/.test(m0.text), m0);
  const anzB = await p.evaluate(() => MATERIALMATCH_DATA.baustoffe.flatMap(m => Object.values(m.eigenschaften)).filter(e => e.art === 'beispiel').length);
  check('Echtdaten-Start: in den geladenen Daten ist kein einziger Beispielwert mehr aktiv', anzB === 0, anzB);
  const stdEinst = await p.evaluate(() => MM.einstellungen.hole().beispieldatenStandard);
  check('Einstellung beispieldatenStandard ist false (Standard laut Entscheidung)', stdEinst === false);
  await p.click('#modus-schalter');
  const m1 = await modus(p);
  const anzB2 = await p.evaluate(() => MATERIALMATCH_DATA.baustoffe.flatMap(m => Object.values(m.eigenschaften)).filter(e => e.art === 'beispiel').length);
  const ZL = zaehleLive(false), ZE = zaehleLive(true);
  check('Demo-Modus bleibt optional verfügbar: Schalter an → Demo-Modus, die Beispieldaten sind wieder da (Zahl aus den Rohdaten nachgebildet: generische Datensätze plus Standardprodukte)', m1.m === 'demo' && m1.an && anzB2 === ZL.bsp && anzB2 > 0, [m1.m, anzB2, ZL]);
  const pd = await neu(URL + '?modus=demo');
  check('Adresszusatz ?modus=demo startet im Demo-Modus, ?modus=echt im Echtdaten-Modus', (await modus(pd)).m === 'demo' && (await modus(await neu(URL + '?modus=echt'))).m === 'echt');

  // Orientierungshinweis
  p = await neu();
  const sichtbar0 = await p.$eval('#orientierung', e => !e.hidden);
  check('Ohne gewähltes Material: kein Orientierungshinweis', sichtbar0 === false);
  await waehle(p, 'mineralwolle', 'eps', 'zellulose'); await eingabe(p, 100, 20); await oeffne(p);
  const hin = await p.$eval('#orientierung', e => ({ sichtbar: !e.hidden, text: e.textContent }));
  check('Mit Material (Richtwerte): Hinweis „Nur zur Orientierung … keine verlässliche Produkt- oder Kostenberechnung“ sichtbar, außerdem „kein belegter Preis“', hin.sichtbar && /^Nur zur Orientierung/.test(hin.text) && /keine verlässliche Produkt- oder Kostenberechnung/.test(hin.text) && /kein belegter Preis/.test(hin.text), hin);
  const ausbl = await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); return d.open; });
  check('Der Hinweis „nur zur Orientierung“ liegt im Reiter „Vergleich“ (sichtbar, nicht im zugeklappten Tabellenbereich)', await p.$eval('#orientierung', e => !!e.closest('#bereich-vergleich') && !e.closest('#ergebnisse')) && ausbl);
  const csv = await p.evaluate(() => MM.exportieren.baueCsv({ daten: MATERIALMATCH_DATA, plaetze: MM.auswahl.holeAuswahl().plaetze, eingaben: MM.eingaben.hole(), modus: MM.datenmodus.name(), anwendung: 'Wärmedämmung', prioritaet: 'x', empfehlung: null, datum: new Date() }));
  check('CSV enthält die Zeile „Hinweis Orientierung“ mit dem Satz', /Hinweis Orientierung;Nur zur Orientierung/.test(csv) && /keine verlässliche Produkt- oder Kostenberechnung/.test(csv));
  await p.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  const kopf = await p.$eval('#druck-kopf', e => e.innerText); await p.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  check('Druckkopf enthält den Orientierungshinweis', /Nur zur Orientierung/.test(kopf), kopf.slice(0, 300));
  const cards = await p.evaluate(() => { MM.alternativen && 0; return document.querySelector('#alternativen-inhalt').innerText.replace(/\s+/g, ' '); });
  check('Empfehlungskarten: „Orientierend … keine verlässliche Produkt- oder Kostenberechnung“ (nicht „belastbar“)', /Orientierend:?\s*Die bewerteten Kennwerte sind Richtwerte/.test(cards) && /keine verlässliche Produkt- oder Kostenberechnung/.test(cards), cards.slice(0, 400));

  // ================= Nennwert und Bemessungswert (Produkte) =================
  const fix = prod('rockwool-fixrock-035').eigenschaften, haP = prod('thermo-hanf-premium').eigenschaften, zeP = prod('isocell-zellulose').eigenschaften;
  check('Produktdaten: ROCKWOOL Fixrock 035 mit λD 0,034 und λB 0,035 getrennt, beide „richtwert“ mit derselben geprüften Quelle (Herstellerdatenblatt)', fix.waermeleitfaehigkeit.wert === 0.034 && fix.waermeleitfaehigkeit_bemessung.wert === 0.035 && fix.waermeleitfaehigkeit.art === 'richtwert' && fix.waermeleitfaehigkeit_bemessung.art === 'richtwert' && fix.waermeleitfaehigkeit.quelle === fix.waermeleitfaehigkeit_bemessung.quelle && qu(fix.waermeleitfaehigkeit.quelle).geprueft === true);
  const alleHaben = DB.baustoffe.every(m => 'waermeleitfaehigkeit_bemessung' in m.eigenschaften && m.eigenschaften.waermeleitfaehigkeit_bemessung.wert === null);
  const bProdukte = PR.filter(x => x.eigenschaften.waermeleitfaehigkeit_bemessung && x.eigenschaften.waermeleitfaehigkeit_bemessung.wert !== null).map(x => x.id).sort();
  check('Alle 50 generischen Datensätze haben das Feld λB, aber ohne Wert („nicht verfügbar“, DIN 4108-4 kostenpflichtig); λB steht nur bei Produkten mit Herstellerangabe für Deutschland', DB.baustoffe.length === 50 && alleHaben && JSON.stringify(bProdukte) === JSON.stringify(['bachl-eps-035-deo', 'bachl-eps-035-wdv', 'rockwool-fixrock-033', 'rockwool-fixrock-035', 'rockwool-klemmrock-035', 'steico-flex-036', 'steico-special-dry', 'steico-therm', 'steico-therm-dry', 'steico-universal', 'steico-universal-dry']), bProdukte);
  check('Jedes Produkt: λB nie kleiner als λD (Bemessungswert ≥ Nennwert)', PR.every(x => { const a = x.eigenschaften.waermeleitfaehigkeit, b = x.eigenschaften.waermeleitfaehigkeit_bemessung; return !(a && b && a.wert !== null && b.wert !== null) || b.wert >= a.wert; }));
  check('Zellulose (ISOCELL): λB bleibt leer – kein deutscher Wert aus gültiger Zulassung oder DIN 4108-4; Begründung nennt die abgelaufene Zulassung Z-23.11-1236 und dass der Schweizer/österreichische Wert nicht als deutscher gilt', zeP.waermeleitfaehigkeit_bemessung.wert === null && zeP.waermeleitfaehigkeit_bemessung.art === null && /Z-23\.11-1236/.test(zeP.waermeleitfaehigkeit_bemessung.hinweis) && /26\.04\.2021/.test(zeP.waermeleitfaehigkeit_bemessung.hinweis) && /nicht als deutscher Bemessungswert/.test(zeP.waermeleitfaehigkeit_bemessung.hinweis));

  await waehle(p, 'mineralwolle', 'hanfdaemmung', 'zellulose'); await eingabe(p, 100, 20); await oeffne(p);
  const rt = await p.evaluate(() => {
    const zeile = t => [...document.querySelectorAll('#rechnung-r table tr')].find(r => r.cells[0].textContent.startsWith(t));
    const txt = r => r ? [...r.cells].slice(1).map(c => c.textContent.replace(/\s+/g, ' ').trim()) : null;
    return { d: txt(zeile('Nennwert λD')), b: txt(zeile('Bemessungswert λB')), grund: txt(zeile('Für R verwendet')), r: txt(zeile('R = d / λ')), warn: [...document.querySelectorAll('#rechnung-r .warn')].map(x => x.textContent), fn: [...document.querySelectorAll('#rechnung-r .fn-source')].map(x => x.textContent) };
  });
  const rMw = 0.2 / 0.035, rHa = 0.2 / 0.041, rZe = 0.2 / 0.037;
  const fmt = x => (Math.round(x * 100) / 100).toString().replace('.', ',');
  check('R-Wert-Tabelle: Mineralwolle rechnet mit λB (R = 0,2/0,035 = 5,71); Hanf (4,88) und Zellulose (0,2/0,037 = 5,41) haben nur den Nennwert → „Nennwert λD, orientierend“', rt.d && rt.b && rt.r && rt.r[0].startsWith(fmt(rMw)) && rt.r[1].startsWith(fmt(rHa)) && rt.r[2].startsWith(fmt(rZe)) && /Bemessungswert/.test(rt.grund[0]) && /Nennwert λD, orientierend/.test(rt.grund[1]) && /Nennwert λD, orientierend/.test(rt.grund[2]), rt);
  check('λB-Zellen von Hanf und Zellulose: „fehlt“; λD-Zellen mit R und Fußnote', /fehlt/.test(rt.b[1]) && /fehlt/.test(rt.b[2]) && /0,041/.test(rt.d[1]) && /R/.test(rt.d[1]), rt);
  check('Deutlicher Hinweis „Orientierend, kein Wärmeschutznachweis“ für 2 von 3 Materialien (nur Nennwert)', rt.warn.some(w => /^Orientierend, kein Wärmeschutznachweis: Für 2 von 3 Materialien liegt nur der Nennwert λD vor/.test(w)), rt.warn);
  const quellenNamen = rt.fn.join(' | ');
  check('Beide Werte zeigen ihre Quelle: Fußnoten nennen ROCKWOOL Fixrock 035 (für λD und λB), ISOCELL und die ETA für Hanf', /Fixrock 035/.test(quellenNamen) && /ISOCELL/.test(quellenNamen) && /ETA-05\/0037/.test(quellenNamen), quellenNamen.slice(0, 300));
  const fnZahl = await p.evaluate(() => { const zeile = t => [...document.querySelectorAll('#rechnung-r table tr')].find(r => r.cells[0].textContent.startsWith(t)); const sup = r => [...r.cells].slice(1).map(c => (c.querySelector('sup') || {}).textContent || ''); return { d: sup(zeile('Nennwert λD')), b: sup(zeile('Bemessungswert λB')) }; });
  check('Jede belegte λD- und λB-Zelle trägt eine Fußnotennummer (beide Werte einzeln belegt); fehlende λB-Zellen keine', fnZahl.d.every(x => x) && fnZahl.b[0] && !fnZahl.b[1] && !fnZahl.b[2], fnZahl);

  // alle drei mit λB (Fixrock 035, BACHL EPS 035 WDV, STEICOflex 036): keine Warnung, sondern Hinweis auf den Rechenwert
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: 'holzfaserdaemmung', pc: 'steico-flex-036' })); await oeffne(p);
  const rt2 = await p.evaluate(() => ({ warn: [...document.querySelectorAll('#rechnung-r .warn')].map(x => x.textContent), notes: [...document.querySelectorAll('#rechnung-r .note')].map(x => x.textContent) }));
  check('Alle Materialien mit λB: keine Warnung „nur Nennwert“; Hinweis „mit dem Bemessungswert λB gerechnet … ersetzt keinen Wärmeschutznachweis“', !rt2.warn.some(w => /Nennwert/.test(w)) && rt2.notes.some(n => /mit dem Bemessungswert λB gerechnet/.test(n) && /ersetzt keinen Wärmeschutznachweis/.test(n)), rt2);
  await p.fill('#rZiel', '5');
  const dicke = await p.evaluate(() => { const r = [...document.querySelectorAll('#rechnung-rziel table tr')].find(x => x.cells[0].textContent.startsWith('Erforderliche Dicke')); return r ? [...r.cells].slice(1).map(c => c.textContent.replace(/\s+/g, ' ').trim()) : null; });
  check('Erforderliche Dicke für R = 5 aus λB: 5 × 0,035 = 17,5 cm; 17,5 cm; 5 × 0,038 = 19 cm', dicke && dicke[0].startsWith('17,5') && dicke[1].startsWith('17,5') && dicke[2].startsWith('19'), dicke);

  // Diagramm: gleiche Sorte Wert
  const lamChart = async (a, b_, c, pc) => { await p.evaluate(([a, b_, c, pc]) => MM.auswahl.setzeAuswahl({ a, b: b_, c, pc: pc || '' }), [a, b_, c, pc]); await oeffne(p); return p.evaluate(() => { const f = document.querySelector('figure[data-chart="lambda"]'); return { rows: [...f.querySelectorAll('.chart-row[data-material]')].map(r => r.dataset.wert), text: f.innerText.replace(/\s+/g, ' ') }; }); };
  let lc = await lamChart('mineralwolle', 'eps', 'holzfaserdaemmung', 'steico-flex-036');
  check('λ-Diagramm mit drei Produkten, die alle λB haben: Bemessungswerte 0,035 / 0,035 / 0,038 und Hinweis „Verglichen wird der Bemessungswert“', JSON.stringify(lc.rows) === JSON.stringify(['0.035', '0.035', '0.038']) && /Verglichen wird der Bemessungswert λB/.test(lc.text), lc);
  lc = await lamChart('mineralwolle', 'eps', 'hanfdaemmung');
  check('λ-Diagramm mit Hanf (ohne λB): für alle der Nennwert 0,034 / 0,034 / 0,041, Hinweis „orientierend und ersetzt keinen Wärmeschutznachweis“ (nie λB gegen λD)', JSON.stringify(lc.rows) === JSON.stringify(['0.034', '0.034', '0.041']) && /Verglichen wird der Nennwert λD/.test(lc.text) && /ersetzt keinen Wärmeschutznachweis/.test(lc.text), lc);

  // Empfehlung: Nennwert, solange nicht alle Kandidaten λB haben
  const emp = await p.evaluate(() => { const r = MM.empfehlung.empfehle(MATERIALMATCH_DATA, 'mineralwolle', null, 'ausgewogen'); return { typ: r.lambdaTyp, kennwerte: r.empfehlungen.map(e => e.kennwerte[0].name) }; });
  check('Empfehlung vergleicht den Nennwert λD (nicht alle Dämmstoffe haben λB); die Karten nennen „Nennwert λD“', emp.typ === 'nennwert' && emp.kennwerte.every(n => n === 'Nennwert λD'), emp);

  // Export: R-Zeile
  const csv2 = await p.evaluate(() => MM.exportieren.baueCsv({ daten: MATERIALMATCH_DATA, plaetze: (MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'hanfdaemmung', c: '' }), MM.auswahl.holeAuswahl().plaetze), eingaben: MM.eingaben.hole(), modus: MM.datenmodus.name(), anwendung: 'Wärmedämmung', prioritaet: 'x', empfehlung: null, datum: new Date() }));
  const zMw = csv2.split('\n').find(z => /Wärmedurchlasswiderstand R/.test(z) && /Mineralwolle/.test(z)), zHa = csv2.split('\n').find(z => /Wärmedurchlasswiderstand R/.test(z) && /Hanf/.test(z));
  check('CSV: R-Zeile Mineralwolle nennt „Bemessungswert λB“ und Quelle; R-Zeile Hanf „Nennwert λD – orientierend, kein Wärmeschutznachweis“; beide Wärmeleitfähigkeiten stehen getrennt im Kennwerte-Teil', zMw && /Bemessungswert λB/.test(zMw) && /ROCKWOOL/.test(zMw) && zHa && /orientierend, kein Wärmeschutznachweis/.test(zHa) && /Nennwert der Wärmeleitfähigkeit λD/.test(csv2) && /Bemessungswert der Wärmeleitfähigkeit λB/.test(csv2), [zMw, zHa]);

  // Prüfprogramm: λB < λD wird gemeldet (Mutationstest)
  const mut = await p.evaluate(() => { const d = JSON.parse(JSON.stringify(MATERIALMATCH_DATA)); const m = d.baustoffe.find(x => x.id === 'mineralwolle'); m.eigenschaften.waermeleitfaehigkeit_bemessung.wert = 0.030; const r = MM.pruefeDaten(d); const ok = MM.pruefeDaten(MATERIALMATCH_DATA); return { warn: r.warnungen.filter(x => /Bemessungswert/.test(x)).length, okWarn: ok.warnungen.filter(x => /Bemessungswert/.test(x)).length, fehler: ok.fehler.length }; });
  check('Prüfprogramm: λB kleiner als λD wird gemeldet (Mutationstest), die echten Daten melden nichts und haben keine Fehler', mut.warn === 1 && mut.okWarn === 0 && mut.fehler === 0, mut);

  // ================= neue belegte Werte (Produkte) =================
  const BELEG = [
    ['saglan-sr30', 'waermeleitfaehigkeit', 0.032, 'W/(m·K)', 'hersteller-sager-saglan-sr30'],
    ['saglan-sr30', 'wasserdampf_mu', 1, '–', 'hersteller-sager-saglan-sr30'],
    ['saglan-sr30', 'brandverhalten', 'A1', null, 'hersteller-sager-saglan-sr30'],
    ['thermo-hanf-premium', 'waermeleitfaehigkeit', 0.041, 'W/(m·K)', 'eta-thermo-hanf'],
    ['thermo-hanf-premium', 'brandverhalten', 'E', null, 'eta-thermo-hanf'],
    ['rheinzink-classic', 'waermeleitfaehigkeit', 110, 'W/(m·K)', 'hersteller-rheinzink-produktlinien'],
    ['bachl-eps-035-wdv', 'waermeleitfaehigkeit_bemessung', 0.035, 'W/(m·K)', 'hersteller-bachl-eps-035-wdv'],
    ['steico-flex-036', 'waermeleitfaehigkeit_bemessung', 0.038, 'W/(m·K)', 'hersteller-steico-flex-036'],
    ['steico-universal', 'waermeleitfaehigkeit_bemessung', 0.05, 'W/(m·K)', 'hersteller-steico-universal']
  ];
  check('Einzelwerte der Produkte stehen wie im Quellendokument gelesen (SAGLAN 0,032/μ 1/A1; THERMO HANF 0,041/E; RHEINZINK 110; BACHL λB 0,035; STEICOflex λB 0,038; STEICOuniversal λB 0,050) – Datenart Richtwert, Einheit, Quelle', BELEG.every(([id, k, w, e, q]) => { const x = prod(id).eigenschaften[k]; return x.wert === w && x.art === 'richtwert' && x.quelle === q && (e === null || x.einheit === e); }));
  const nichtEU = DB.baustoffe.filter(m => m.eigenschaften.brandverhalten.quelle === 'eu-entscheidung-96-603').map(m => m.id);
  check('Brandverhalten A1 nach EU-Entscheidung 96/603/EG für genau die Materialien aus dem Anhang (28; ohne Gipsplatten, Holz, Dämmstoffe aus organischen Stoffen, Bahnen), jeweils mit Voraussetzungen im Hinweis', nichtEU.length === 28 && DB.baustoffe.filter(m => m.eigenschaften.brandverhalten.quelle === 'eu-entscheidung-96-603').every(m => m.eigenschaften.brandverhalten.wert === 'A1' && /höchstens 1 %/.test(m.eigenschaften.brandverhalten.hinweis)) && !['gipskarton', 'osb', 'brettsperrholz', 'xps', 'epdm', 'bitumenbahn'].some(i => nichtEU.includes(i)), nichtEU.length);
  const neueQuellen = ['hersteller-sager-saglan-sr30', 'eta-thermo-hanf', 'hersteller-rheinzink-produktlinien'].map(qu);
  check('Neue Quellen vollständig: Titel, https-URL, Abrufdatum, Quellenart, Region, Geltung, Produkt, geprüft', neueQuellen.every(x => x && x.geprueft === true && /^https:\/\//.test(x.url) && /^\d{4}-\d{2}-\d{2}$/.test(x.abgerufen) && x.quellenart && x.region && x.geltung === 'produktspezifisch' && x.produkt && x.titel));
  const zaehle = await p.evaluate(() => { const z = MM.quellen.zaehle(MATERIALMATCH_DATA); const pr = MM.quellen.pruefe(MATERIALMATCH_DATA); return { s: z.summe, ok: pr.ok, f: MM.pruefeDaten(MATERIALMATCH_DATA).fehler.length }; });
  check(`Zählung in der Anwendung = unabhängige Nachbildung (generische Datensätze + Standardprodukte): 500 Felder = ${ZE.richt} Richtwerte (inkl. belegte Händlerpreisspannen „echt“) + ${ZE.na} nicht anwendbar + ${ZE.nv + ZE.bsp} nicht verfügbar (Echtdaten-Modus: ${ZE.bsp} Beispieldaten zählen als nicht verfügbar)`, zaehle.s.gesamt === 500 && zaehle.s.richtwert === ZE.richt && zaehle.s.beispiel === 0 && zaehle.s.nicht_anwendbar === ZE.na && zaehle.s.fehlt === ZE.nv + ZE.bsp && zaehle.ok && zaehle.f === 0, [zaehle.s, ZE]);
  const zd = await (await neu(URL + '?modus=demo')).evaluate(() => MM.quellen.zaehle(MATERIALMATCH_DATA).summe);
  check('Dieselbe Zählung im Demo-Modus: die Beispieldaten sind als solche gezählt, nicht verfügbar = die übrigen', zd.beispiel === ZL.bsp && zd.fehlt === ZL.nv && zd.richtwert === ZL.richt, [zd, ZL]);

  check('Keine Konsolenfehler', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
