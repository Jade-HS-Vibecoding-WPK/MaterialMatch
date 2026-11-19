const PROJ = require('path').resolve(__dirname, '..');
const AUSGABE = require('path').join(require('os').tmpdir(), 'materialmatch-tests') + '/';
require('fs').mkdirSync(AUSGABE, { recursive: true });
const { chromium } = require('playwright');
require('./_offline.js');
let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 450))); }

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  p.on('pageerror', e => errors.push(String(e)));
  await p.goto('file://' + PROJ + '/index.html?modus=demo'); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
  await p.evaluate(() => document.querySelectorAll('main section.panel > details').forEach(d => { d.open = true; }));

  const E = id => p.evaluate(i => JSON.parse(JSON.stringify(MATERIALMATCH_DATA.baustoffe.find(x => x.id === i).eigenschaften)), id);
  const fe = x => p.evaluate(v => MM.berechnung.formatEuro(v), x);
  const fz = x => p.evaluate(v => MM.berechnung.formatZahl(v), x);
  const waehle = (a, b_, c = '') => p.evaluate(([a, b_, c]) => MM.auswahl.setzeAuswahl({ a, b: b_, c }), [a, b_, c]);
  const eingabe = async (f, d, u) => { await p.fill('#flaeche', f); await p.fill('#dicke', d); if (u) await p.selectOption('#dickeEinheit', u); };
  const tab = id => p.$$eval('#' + id + ' table tr', trs => trs.map(tr => [...tr.cells].map(c => { const x = c.cloneNode(true); x.querySelectorAll('sup.fn').forEach(s => s.remove()); x.querySelectorAll('br').forEach(b => b.replaceWith(' ')); return x.textContent.replace(/\s+/g, ' ').trim(); })));
  const zeile = async (id, titel) => (await tab(id)).find(r => r[0].startsWith(titel));
  const txt = id => p.$eval('#' + id, e => e.innerText.replace(/\s+/g, ' '));
  const warn = id => p.$$eval('#' + id + ' .warn', w => w.map(x => x.textContent));
  const karten = id => p.$$eval('#' + id + ' .card-note', w => w.map(x => x.textContent));
  const ersetze = (js, arg) => p.evaluate(js, arg);

  // ================= Dämmstoffe, 100 m² × 20 cm =================
  await waehle('mineralwolle', 'eps', 'holzfaserdaemmung');
  check('Ohne Eingaben: Hinweis in Kosten, CO₂ und R-Wert', (await txt('rechnung-kosten')).includes('Gib Bauteilfläche und Materialdicke ein') && (await txt('rechnung-co2')).includes('Gib Bauteilfläche und Materialdicke ein') && (await txt('rechnung-r')).includes('Gib die Materialdicke ein'));
  await p.fill('#flaeche', '100');
  check('Nur Fläche: R-Wert verlangt weiterhin die Dicke, Kosten die Dicke', (await txt('rechnung-r')).includes('Gib die Materialdicke ein') && (await txt('rechnung-kosten')).includes('Gib Bauteilfläche'));
  await p.fill('#flaeche', ''); await p.fill('#dicke', '20');
  check('Nur Dicke: R-Wert wird berechnet', (await tab('rechnung-r')).length > 1);
  await eingabe('100', '20');

  const mw = await E('mineralwolle'), eps = await E('eps'), hf = await E('holzfaserdaemmung');
  const mats = [mw, eps, hf];

  // ---- Kosten
  let t = await tab('rechnung-kosten');
  check('Kosten: Kopf nennt A, B, C', t[0].length === 4);
  check('Kosten: Einheitspreise aus Datenbank', JSON.stringify((await zeile('rechnung-kosten', 'Einheitspreis')).slice(1).map(x => x.replace(/B$/, ''))) === JSON.stringify(mats.map(m => `${m.preis.wert} €/m³`)), await zeile('rechnung-kosten', 'Einheitspreis'));
  check('Kosten: Rechenweg "20 m³ × 85 €/m³"', (await zeile('rechnung-kosten', 'Rechenweg'))[1] === '20 m³ × 85 €/m³', await zeile('rechnung-kosten', 'Rechenweg'));
  const kost = mats.map(m => 20 * m.preis.wert);
  check('Kosten: Materialkosten = 20 m³ × Preis (1.700 / 1.400 / 4.400 €)', JSON.stringify((await zeile('rechnung-kosten', 'Materialkosten')).slice(1)) === JSON.stringify(await Promise.all(kost.map(fe))), [await zeile('rechnung-kosten', 'Materialkosten'), kost]);
  check('Kosten: Preisbasis sichtbar (MwSt, Umfang unbekannt)', (await zeile('rechnung-kosten', 'Preisbasis')).slice(1).every(x => x === 'MwSt: unbekannt · Umfang: unbekannt'));
  const dz = await zeile('rechnung-kosten', 'Kostendifferenz');
  const proz = x => Math.round(x * 10) / 10;
  check('Kosten: Differenz zu A: B = −300 € (−17,6 %), C = +2.700 €', dz[1] === 'Bezug' && dz[2].startsWith('-300 €') && dz[2].includes('-17,6 %') && dz[3].startsWith('+2.700 €') && dz[3].includes((await fz(proz((kost[2] - kost[0]) / kost[0] * 100))).replace(/^/, '+')), dz);
  check('Kosten: Warnung Vorbehalt Mehrwertsteuer/Umfang, Differenz nur Orientierung', (await warn('rechnung-kosten')).some(w => w.includes('Kein belastbarer direkter Vergleich möglich') && w.includes('Orientierung')), await warn('rechnung-kosten'));
  check('Kosten: Beispielpreis-Hinweis und Formel', (await txt('rechnung-kosten')).includes('keine Marktpreise') && (await txt('rechnung-kosten')).includes('Materialkosten = Menge × Einheitspreis'));

  // ---- CO₂
  const g = mats.map(m => m.gwp.werte);
  check('CO₂: Kennwert mit Einheit und Kürzel R', (await zeile('rechnung-co2', 'Kennwert GWP'))[1].includes('kg CO₂e/m³') && (await zeile('rechnung-co2', 'Kennwert GWP'))[1].endsWith('R'));
  check('CO₂: Menge gesamt = 20 m³ × Kennwert', JSON.stringify((await zeile('rechnung-co2', 'CO₂-Menge gesamt')).slice(1)) === JSON.stringify(await Promise.all(g.map(x => fz(20 * x.gesamt)))), await zeile('rechnung-co2', 'CO₂-Menge gesamt'));
  check('CO₂: fossil und biogen = 20 m³ × Kennwert', JSON.stringify((await zeile('rechnung-co2', 'davon fossil')).slice(1)) === JSON.stringify(await Promise.all(g.map(x => fz(20 * x.fossil)))) && JSON.stringify((await zeile('rechnung-co2', 'davon biogen')).slice(1)) === JSON.stringify(await Promise.all(g.map(x => fz(20 * x.biogen)))));
  check('CO₂: luluc-Zeile erscheint (Datensätze weisen luluc aus), Werte 20 × Kennwert', JSON.stringify((await zeile('rechnung-co2', 'davon Landnutzung')).slice(1)) === JSON.stringify(await Promise.all(g.map(x => fz(20 * x.luluc)))), await zeile('rechnung-co2', 'davon Landnutzung'));
  check('CO₂: Teilwerte ergeben gesamt (fossil + biogen + luluc) für alle drei', g.every(x => Math.abs(x.fossil + x.biogen + x.luluc - x.gesamt) < 0.01 * Math.max(1, Math.abs(x.gesamt))), g);
  const df = await zeile('rechnung-co2', 'Differenz fossil');
  check('CO₂: Differenz fossil zu A, mit Prozent gegen positiven Bezug', df[1] === 'Bezug' && df[2].startsWith('+' + await fz(20 * (g[1].fossil - g[0].fossil)) + ' kg') && df[2].includes('%'), df);
  check('CO₂: Holzfaser enthält Biogen -> keine Differenz der Gesamtwerte', !(await zeile('rechnung-co2', 'Differenz gesamt')) && (await warn('rechnung-co2')).some(w => w.includes('Biogener Kohlenstoff') && w.includes('nicht zulässig')));
  check('CO₂: Hinweis Umrechnung der Bezugsgrößen und Module', (await txt('rechnung-co2')).includes('Die Bezugsgrößen werden umgerechnet') && (await txt('rechnung-co2')).includes('Lebenszyklusmodule: A1-A3 (Herstellungsphase)'));

  // Mineralwolle + EPS ohne Biogen: beide Differenzzeilen
  await waehle('mineralwolle', 'eps');
  check('Ohne Biogen-Material: Differenz fossil UND gesamt', !!(await zeile('rechnung-co2', 'Differenz fossil')) && !!(await zeile('rechnung-co2', 'Differenz gesamt')));
  check('Ohne Biogen-Material: keine Warnung', (await warn('rechnung-co2')).length === 0, await warn('rechnung-co2'));

  // ---- R-Wert
  await waehle('mineralwolle', 'eps', 'holzfaserdaemmung');
  const lam = mats.map(m => (m.waermeleitfaehigkeit_bemessung && m.waermeleitfaehigkeit_bemessung.wert !== null ? m.waermeleitfaehigkeit_bemessung : m.waermeleitfaehigkeit).wert);   // Regel: R mit dem Bemessungswert, sonst mit dem Nennwert
  check('R-Wert: Nennwert λD, Bemessungswert λB und Dicke 20 cm angezeigt', (await zeile('rechnung-r', 'Dicke d'))[1] === '20' && (await zeile('rechnung-r', 'Nennwert λD'))[1].startsWith(await fz(mats[0].waermeleitfaehigkeit.wert)) && (await zeile('rechnung-r', 'Bemessungswert λB'))[1].startsWith(await fz(lam[0])));
  check('R = d / λ (0,2 m / λ): 5,71 / 5,71 / 5', JSON.stringify((await zeile('rechnung-r', 'R = d')).slice(1)) === JSON.stringify(await Promise.all(lam.map(l => fz(0.2 / l)))), [await zeile('rechnung-r', 'R = d'), lam]);
  check('R-Wert: Hinweis "nicht der U-Wert"', (await txt('rechnung-r')).includes('nicht der U-Wert eines Bauteils'));
  check('R-Wert: λ-Beispieldaten gekennzeichnet', (await txt('rechnung-r')).includes('Beispieldaten'));
  await p.fill('#dicke', '10');
  check('Dicke halbiert -> R halbiert (2,86 / 2,86 / 2,5)', (await zeile('rechnung-r', 'R = d'))[1] === await fz(0.1 / lam[0]), await zeile('rechnung-r', 'R = d'));
  await p.selectOption('#dickeEinheit', 'mm'); await p.fill('#dicke', '200');
  check('200 mm = 20 cm: gleicher R', (await zeile('rechnung-r', 'R = d'))[1] === await fz(0.2 / lam[0]));
  await p.selectOption('#dickeEinheit', 'cm'); await p.fill('#dicke', '20');

  // ---- Gewünschter R-Wert
  check('Ohne Zielwert: Erklärung', (await txt('rechnung-rziel')).includes('gewünschten R-Wert ein') && (await tab('rechnung-rziel')).length === 0);
  await p.fill('#rZiel', '5');
  let erf = await zeile('rechnung-rziel', 'Erforderliche Dicke');
  check('Zielwert 5: Dicke = 5 × λ = 17,5 / 17,5 / 20 cm', JSON.stringify(erf.slice(1)) === JSON.stringify(await Promise.all(lam.map(l => fz(5 * l * 100)))), erf);
  check('Zielwert 5: Volumen = 100 m² × Dicke', JSON.stringify((await zeile('rechnung-rziel', 'Volumen')).slice(1)) === JSON.stringify(await Promise.all(lam.map(l => fz(100 * 5 * l)))));
  check('Zielwert 5: Materialkosten = Volumen × Preis', JSON.stringify((await zeile('rechnung-rziel', 'Materialkosten')).slice(1)) === JSON.stringify(await Promise.all(mats.map((m, i) => fe(100 * 5 * lam[i] * m.preis.wert)))), await zeile('rechnung-rziel', 'Materialkosten'));
  check('Zielwert 5: CO₂ gesamt und fossil = Volumen × Kennwert', JSON.stringify((await zeile('rechnung-rziel', 'CO₂ gesamt')).slice(1)) === JSON.stringify(await Promise.all(mats.map((m, i) => fz(100 * 5 * lam[i] * m.gwp.werte.gesamt)))) && JSON.stringify((await zeile('rechnung-rziel', 'CO₂ fossil')).slice(1)) === JSON.stringify(await Promise.all(mats.map((m, i) => fz(100 * 5 * lam[i] * m.gwp.werte.fossil)))));
  check('Zielwert 5: Kostendifferenz und CO₂-Differenz (fossil) vorhanden', !!(await zeile('rechnung-rziel', 'Kostendifferenz')) && !!(await zeile('rechnung-rziel', 'CO₂-Differenz fossil')));
  check('Zielwert: Hinweis "gleiche Dämmwirkung", "nicht je U-Wert"', (await txt('rechnung-rziel')).includes('denselben Wärmedurchlasswiderstand') && (await txt('rechnung-rziel')).includes('nicht je U-Wert'));
  await p.fill('#rZiel', '5,5');
  check('Zielwert 5,5 (Komma): Dicke 19,25 cm für λ 0,035', (await zeile('rechnung-rziel', 'Erforderliche Dicke'))[1] === await fz(5.5 * lam[0] * 100));
  for (const [wert, teil] of [['0', 'größer als 0'], ['-2', 'negativ'], ['abc', 'Zahl'], ['1.500', 'Unklar'], ['51', 'unplausibel']]) {
    await p.fill('#rZiel', wert);
    const fehler = await p.$eval('#rziel-fehler', e => e.textContent);
    check(`Zielwert "${wert}": Fehlermeldung am Feld (${teil}), Feld rot, keine Tabelle`, fehler.includes(teil) && await p.$eval('#rZiel', e => e.classList.contains('is-invalid') && e.getAttribute('aria-invalid') === 'true') && (await tab('rechnung-rziel')).length === 0 && (await txt('rechnung-rziel')).includes('korrigier'), fehler);
  }
  await p.fill('#rZiel', '');
  check('Zielwert geleert: Fehler weg', (await p.$eval('#rziel-fehler', e => e.textContent)) === '' && await p.$eval('#rZiel', e => !e.classList.contains('is-invalid')));
  await p.fill('#rZiel', '5'); await p.fill('#flaeche', '');
  erf = await zeile('rechnung-rziel', 'Erforderliche Dicke');
  check('Ohne Fläche: nur Dicke, keine Kosten, Hinweis zur Fläche', !!erf && !(await zeile('rechnung-rziel', 'Materialkosten')) && (await txt('rechnung-rziel')).includes('Gib die Bauteilfläche ein'));
  await p.fill('#flaeche', '100');
  await p.fill('#flaeche', '50');
  check('Fläche 100 -> 50: Kosten der Zielwert-Tabelle halbieren sich', (await zeile('rechnung-rziel', 'Materialkosten'))[1] === await fe(50 * 5 * lam[0] * mw.preis.wert));
  await p.fill('#flaeche', '100');

  // ================= Nicht berechenbare Fälle (Beton + Baustahl) =================
  await p.fill('#rZiel', '');
  await waehle('normalbeton', 'baustahl');
  const nb = await E('normalbeton');
  check('Beton: Kosten 20 m³ × 140 €/m³ = 2.800 €', (await zeile('rechnung-kosten', 'Materialkosten'))[1] === await fe(20 * nb.preis.wert));
  check('Baustahl (€/kg, keine Schicht): Kosten "nicht berechenbar", Grund genannt', (await zeile('rechnung-kosten', 'Materialkosten'))[2] === 'nicht berechenbar' && (await karten('rechnung-kosten')).some(k => k.includes('Baustahl') && k.includes('Gewicht lässt sich so nicht')), await karten('rechnung-kosten'));
  check('Baustahl: keine Kostendifferenz (nur ein berechenbares Material)', !(await zeile('rechnung-kosten', 'Kostendifferenz')));
  check('Baustahl (1 kg, keine Schicht): CO₂ nicht berechenbar, Grund', (await zeile('rechnung-co2', 'CO₂-Menge gesamt'))[2] === 'nicht berechenbar' && (await karten('rechnung-co2')).some(k => k.includes('Baustahl')));
  check('Baustahl: R-Wert nicht berechenbar (keine Schicht), Beton: R = 0,2 / 2 = 0,1', (await zeile('rechnung-r', 'R = d'))[2] === 'nicht berechenbar' && (await zeile('rechnung-r', 'R = d'))[1] === await fz(0.2 / nb.waermeleitfaehigkeit.wert) && (await karten('rechnung-r')).some(k => k.includes('Keine homogene Schicht')));

  // Beton + Brettsperrholz: gleiche Einheit, aber generisch gegen repräsentativ
  await waehle('normalbeton', 'brettsperrholz');
  const bsp = await E('brettsperrholz');
  check('Beton/BSP: CO₂-Mengen berechnet', (await zeile('rechnung-co2', 'CO₂-Menge gesamt'))[2] === await fz(20 * bsp.gwp.werte.gesamt));
  check('Beton/BSP: keine CO₂-Differenzen, Warnung nennt Datensatztypen und "nicht angezeigt"', !(await zeile('rechnung-co2', 'Differenz')) && (await warn('rechnung-co2')).some(w => w.includes('Datensatztypen') && w.includes('nicht angezeigt')), await warn('rechnung-co2'));
  check('Beton/BSP: Kostendifferenz trotzdem da (gleiche Preiseinheit)', !!(await zeile('rechnung-kosten', 'Kostendifferenz')));

  // ================= Umrechnungen mit angepassten Daten =================
  // €/kg-Preis und CO₂ je kg für ein Schichtmaterial (über Rohdichte)
  await ersetze(() => { const m = MATERIALMATCH_DATA.baustoffe.find(x => x.id === 'eps').eigenschaften; m.preis = { wert: 1.2, einheit: '€/kg', art: 'beispiel', quelle: null, mwst: 'netto', umfang: 'Material' }; m.gwp = { werte: { gesamt: 3, fossil: 3, biogen: 0 }, einheit: 'kg CO2e', deklarierte_einheit: '1 kg', module: 'A1-A3', art: 'beispiel', quelle: null }; MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: '' }); });
  const rhoEps = (await E('eps')).rohdichte.wert;
  check('€/kg über Gewicht: V × ρ × Preis', (await zeile('rechnung-kosten', 'Materialkosten'))[2] === await fe(20 * rhoEps * 1.2) && (await zeile('rechnung-kosten', 'Rechenweg'))[2].includes(`${await fz(20 * rhoEps)} kg × 1,2 €/kg`) && (await zeile('rechnung-kosten', 'Rechenweg'))[2].includes('Gewicht = Volumen × Rohdichte'), await zeile('rechnung-kosten', 'Rechenweg'));
  check('CO₂ je kg über Gewicht: V × ρ × 3', (await zeile('rechnung-co2', 'CO₂-Menge gesamt'))[2] === await fz(20 * rhoEps * 3), await zeile('rechnung-co2', 'CO₂-Menge gesamt'));
  check('Mit Umrechnung: verschiedene Bezugsgrößen (m³ und kg) blockieren die CO₂-Differenz nicht', !!(await zeile('rechnung-co2', 'Differenz fossil')) || (await warn('rechnung-co2')).some(w => w.includes('Datensatztypen')), await warn('rechnung-co2'));
  // Dachziegel €/m²
  await ersetze(() => { MATERIALMATCH_DATA.baustoffe.find(x => x.id === 'dachziegel').eigenschaften.preis = { wert: 12, einheit: '€/m²', art: 'beispiel', quelle: null, mwst: 'netto', umfang: 'Material' }; MM.auswahl.setzeAuswahl({ a: 'dachziegel', b: '', c: '' }); });
  check('Dachziegel €/m² (keine Schicht): 100 m² × 12 € = 1.200 €, Dicke spielt keine Rolle', (await zeile('rechnung-kosten', 'Materialkosten'))[1] === '1.200' && (await zeile('rechnung-kosten', 'Rechenweg'))[1] === '100 m² × 12 €/m²');
  const dz2 = await E('dachziegel');
  check('Dachziegel CO₂ je m² (echter ÖKOBAUDAT-Wert): 100 m² × 16,59', (await zeile('rechnung-co2', 'CO₂-Menge gesamt'))[1] === await fz(100 * dz2.gwp.werte.gesamt), await zeile('rechnung-co2', 'CO₂-Menge gesamt'));
  await ersetze(() => { MATERIALMATCH_DATA.baustoffe.find(x => x.id === 'dachziegel').eigenschaften.preis.wert = null; MM.auswahl.setzeAuswahl({ a: 'dachziegel', b: '', c: '' }); });
  check('Dachziegel ohne Preis: nicht berechenbar, Grund "Preis fehlt"', (await zeile('rechnung-kosten', 'Materialkosten'))[1] === 'nicht berechenbar' && (await karten('rechnung-kosten')).some(k => k.includes('Preis fehlt')));
  check('Dachziegel ohne λ: R nicht berechenbar (keine Schicht)', (await zeile('rechnung-r', 'R = d'))[1] === 'nicht berechenbar');
  // Gipsplatte: CO₂ je m² gilt für 12,5 mm
  await waehle('gipskarton', 'osb');
  const gp = await E('gipskarton');
  check('Gipsplatte (1 m² bei 12,5 mm) bei 20 cm Dicke: nicht berechenbar, Grund nennt 12,5 mm und 200 mm', (await zeile('rechnung-co2', 'CO₂-Menge gesamt'))[1] === 'nicht berechenbar' && (await karten('rechnung-co2')).some(k => k.includes('12,5 mm') && k.includes('200 mm')), await karten('rechnung-co2'));
  await eingabe('100', '12,5', 'mm');
  check('Gipsplatte bei exakt 12,5 mm: 100 m² × Kennwert', (await zeile('rechnung-co2', 'CO₂-Menge gesamt'))[1] === await fz(100 * gp.gwp.werte.gesamt), await zeile('rechnung-co2', 'CO₂-Menge gesamt'));
  await eingabe('100', '20', 'cm');

  // ================= Differenz gegen nicht-positiven Bezug: kein Prozentwert =================
  await ersetze(() => { MATERIALMATCH_DATA.baustoffe.find(x => x.id === 'mineralwolle').eigenschaften.gwp.werte.fossil = -10; MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'zellulose', c: '' }); });
  check('Bezug mit negativem fossilem Wert: absolute Differenz ja, Prozentwert nein', await ersetze(() => [...document.querySelectorAll('#rechnung-co2 tr')].find(r => r.cells[0].innerText.startsWith('Differenz fossil')).cells[2].innerText.includes('%') === false));

  // ================= Eingabefehler =================
  await p.reload(); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; }); await waehle('mineralwolle', 'eps');
  await p.fill('#flaeche', '-3'); await p.fill('#dicke', '20');
  check('Fehlerhafte Fläche: Kosten/CO₂ bitten um Korrektur, R-Wert läuft (Dicke gültig)', (await txt('rechnung-kosten')).includes('korrigier') && (await txt('rechnung-co2')).includes('korrigier') && (await tab('rechnung-r')).length > 1);
  await p.fill('#flaeche', '100'); await p.fill('#dicke', 'abc');
  check('Fehlerhafte Dicke: R-Wert bittet um Korrektur', (await txt('rechnung-r')).includes('korrigier'));
  await p.fill('#dicke', '20');

  // ================= Sicherheit =================
  await ersetze(() => { MATERIALMATCH_DATA.baustoffe.find(x => x.id === 'baustahl').mengenhinweis = '<img src=x onerror="window.__y=1">Hinweis'; MATERIALMATCH_DATA.baustoffe.find(x => x.id === 'normalbeton').name = '<b>Beton</b>'; MM.auswahl.setzeAuswahl({ a: 'normalbeton', b: 'baustahl', c: '' }); });
  check('HTML in Daten wird in den Berechnungen nicht ausgeführt', await p.evaluate(() => !window.__y && document.querySelectorAll('#rechnung-kosten img, #rechnung-co2 img, #rechnung-r img, #rechnung-kosten b, #rechnung-r b').length === 0));
  check('Keine Konsolenfehler', errors.length === 0, errors);

  // ================= Layout auf drei Breiten =================
  for (const w of [1280, 768, 375]) {
    const m = await b.newPage({ viewport: { width: w, height: 800 } });
    await m.goto('file://' + PROJ + '/index.html?modus=demo'); await m.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
    await m.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: 'holzfaserdaemmung' }));
    await m.evaluate(() => document.querySelectorAll('#ergebnisse details.sub').forEach(d => { d.open = true; }));
    await m.fill('#flaeche', '100'); await m.fill('#dicke', '20'); await m.fill('#rZiel', '5');
    const r = await m.evaluate(() => {
      const out = [];
      document.querySelectorAll('#rechnung-kosten table, #rechnung-co2 table, #rechnung-r table, #rechnung-rziel table').forEach(t => {
        let overlap = false, schmal = false, rund = false;
        t.querySelectorAll('tr').forEach(tr => { const bs = [...tr.cells].map(c => { const q = c.getBoundingClientRect(); rund = rund || getComputedStyle(c).borderRadius !== '0px'; schmal = schmal || q.width < 40; return q; }); for (let i = 1; i < bs.length; i++) if (bs[i].left < bs[i - 1].right - 0.5) overlap = true; });
        const wr = t.closest('.table-wrap');
        out.push({ overlap, schmal, rund, passt: wr.scrollWidth <= wr.clientWidth + 1, ueberlauf: [...t.querySelectorAll('td,th')].filter(c => c.scrollWidth > c.clientWidth + 1).length });
      });
      const feld = document.getElementById('rZiel').getBoundingClientRect();
      return { tabellen: out, seite: document.documentElement.scrollWidth <= document.documentElement.clientWidth, feldBreit: feld.width, feldPasst: feld.right <= document.documentElement.clientWidth };
    });
    check(`Breite ${w}: 4 Rechentabellen, keine Überlappung/zu schmale/runde Zellen`, r.tabellen.length === 4 && r.tabellen.every(t => !t.overlap && !t.schmal && !t.rund), r);
    check(`Breite ${w}: kein Zelleninhalt läuft über`, r.tabellen.every(t => t.ueberlauf === 0), r.tabellen.map(t => t.ueberlauf));
    if (w >= 768) check(`Breite ${w}: Tabellen passen in den Rahmen`, r.tabellen.every(t => t.passt), r.tabellen.map(t => t.passt));
    check(`Breite ${w}: Seite scrollt nicht seitlich, Zielwert-Feld passt`, r.seite && r.feldPasst, r);
    if (w === 375) await m.locator('#ergebnisse').screenshot({ path: AUSGABE + 'v7_mobile.png' });
  }

  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
  await b.close();
})();
