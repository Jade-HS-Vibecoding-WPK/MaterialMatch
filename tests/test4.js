const PROJ = require('path').resolve(__dirname, '..');
const AUSGABE = require('path').join(require('os').tmpdir(), 'materialmatch-tests') + '/';
require('fs').mkdirSync(AUSGABE, { recursive: true });
const { chromium } = require('playwright');
require('./_offline.js');
const out = AUSGABE;
let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || !extra ? '' : ' -> ' + JSON.stringify(extra))); }

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  p.on('console', m => { if (m.type()==='error' || m.type()==='warning') errors.push(m.text()); });
  p.on('pageerror', e => errors.push(String(e)));
  await p.goto('file://' + PROJ + '/index.html'); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
  await p.evaluate(() => { window.__events = []; document.addEventListener('mm:auswahl', e => window.__events.push(e.detail.materialien.map(m=>m.id).join(',') + '|' + e.detail.kategorie)); });

  const opts = sel => p.$$eval(sel + ' option', o => o.map(x => ({ t: x.textContent, v: x.value, d: x.disabled })));
  const cards = () => p.$$eval('#auswahl-karten .card h3', h => h.map(x => x.textContent));
  const emptyText = () => p.$eval('#auswahl-karten', e => e.textContent.trim());

  // 1 Anfangszustand
  let k = await opts('#kategorie');
  check('Kategorie: Platzhalter + 5 Kategorien', k.length === 6 && k[0].v === '', k.map(x=>x.t));
  check('Material A/B/C anfangs gesperrt', await p.$$eval('#materialA,#materialB,#materialC', s => s.every(x => x.disabled)));
  check('Hinweis "zuerst Kategorie"', (await emptyText()).includes('zuerst eine Baustoffkategorie'));

  // 2 Kategorie Dämmstoffe
  await p.selectOption('#kategorie', 'daemmstoff');
  check('Material A/B/C jetzt aktiv', await p.$$eval('#materialA,#materialB,#materialC', s => s.every(x => !x.disabled)));
  let a = await opts('#materialA');
  check('A: Platzhalter + 14 Dämmstoffe (5 bisherige + 9 ergänzte)', a.length === 15, a.map(x=>x.t));
  check('C: Platzhalter heißt "Kein drittes Material"', (await opts('#materialC'))[0].t === 'Kein drittes Material');
  check('Nur Dämmstoffe in der Liste', a.slice(1).every(x => ['mineralwolle','eps','holzfaserdaemmung','zellulose','hanfdaemmung','glaswolle','steinwolle','xps','pur','pir','flachsdaemmung','kork','schaumglas','schafwolle'].includes(x.v)), a);
  check('Hinweis „Wählen Sie Material A und Material B“', (await emptyText()).includes('Material A und Material B'));

  // 3 A und B wählen
  await p.selectOption('#materialA', 'mineralwolle');
  check('Nach A: noch Hinweis, 1 Karte', (await cards()).length === 1 && (await emptyText()).includes('Material A und Material B'));
  await p.selectOption('#materialB', 'eps');
  check('Zwei Karten A,B', JSON.stringify(await cards()) === JSON.stringify(['Mineralwolle (Fassadendämmung)', 'EPS (expandiertes Polystyrol)']), await cards());
  check('Hinweis „Wählen Sie Material A und Material B“ verschwindet', !(await emptyText()).includes('Material A und Material B'));
  const bOpts = await opts('#materialB'), aOpts = await opts('#materialA');
  check('In B ist Mineralwolle weiter wählbar (andere Produkte frei: Fixrock 033, Klemmrock 035, generisch), aber nur mit einem anderen Produkt als in A', bOpts.find(x => x.v==='mineralwolle').d === false && (await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.map(x => x.material.id + '|' + x.produkt.id))).join() === 'mineralwolle|rockwool-fixrock-035,eps|bachl-eps-035-wdv');
  check('Ein Material ohne Produkte (Steinwolle) lässt sich nicht zweimal wählen: in B gesperrt, sobald es in A gewählt ist', await (async () => { await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'steinwolle', b: '', c: '' })); const o = await opts('#materialB'); await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: '' })); return o.find(x => x.v === 'steinwolle').d === true; })());
  check('Eigene Wahl nicht gesperrt', aOpts.find(x => x.v==='mineralwolle').d === false);
  check('Kein Warnhinweis bei gleicher Kategorie', await p.$$eval('#auswahl-karten .warn', w => w.length) === 0);

  // 4 Material C
  await p.evaluate(() => MM.auswahlOptionen.zeigeDrittes(true)); await p.selectOption('#materialC', 'hanfdaemmung');
  check('Drei Karten', (await cards()).length === 3, await cards());
  await p.evaluate(() => MM.auswahlOptionen.zeigeDrittes(true)); await p.selectOption('#materialC', '');
  check('C entfernt -> zwei Karten', (await cards()).length === 2);
  const slots = await p.$$eval('#auswahl-karten .slot', s => s.map(x => x.textContent));
  check('Buchstaben A,B', JSON.stringify(slots) === '["A","B"]', slots);

  // 5 Kategoriewechsel setzt zurück
  await p.selectOption('#kategorie', 'tragend');
  check('Kategoriewechsel: Auswahl zurückgesetzt', (await cards()).length === 0 && await p.$eval('#materialA', s => s.value) === '');
  a = await opts('#materialA');
  check('Tragend: 13 Materialien (8 bisherige + 5 ergänzte)', a.length === 14, a.map(x=>x.t));

  // 6 Baustahl: Hinweis keine Schicht
  await p.selectOption('#materialA', 'baustahl'); await p.selectOption('#materialB', 'normalbeton');
  const note = await p.$$eval('#auswahl-karten .card-note', n => n.map(x => x.textContent));
  check('Baustahl-Karte zeigt Hinweis zur Schichtberechnung', note.length === 1 && note[0].includes('Schicht-Berechnung'), note);

  // 7 Ereignisse
  const ev = await p.evaluate(() => window.__events);
  check('Ereignis mm:auswahl wird bei jeder Änderung gesendet', ev.length >= 8, ev);
  check('Letztes Ereignis stimmt', ev[ev.length-1] === 'baustahl,normalbeton|tragend', ev[ev.length-1]);

  // 8 Programmierschnittstelle: Auswahl von außen, über Kategorien hinweg
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'normalbeton', c: '' }));
  check('setzeAuswahl wechselt Kategorie passend zu A', await p.$eval('#kategorie', s => s.value) === 'daemmstoff');
  const bo = await opts('#materialB');
  const fremd = bo.find(x => x.v === 'normalbeton');
  check('Fremdes Material bleibt als Option sichtbar, mit Kategorie', fremd && fremd.t.includes('Tragende Baustoffe'), fremd);
  check('Normalbeton in B ist gewählt', await p.$eval('#materialB', s => s.value) === 'normalbeton');
  check('Warnhinweis: kein gemeinsamer Anwendungsbereich', await p.$$eval('#auswahl-karten .warn', w => w.length) === 1);
  const sel = await p.evaluate(() => MM.auswahl.holeAuswahl().materialien.map(m => m.id));
  check('holeAuswahl liefert A,B', JSON.stringify(sel) === '["mineralwolle","normalbeton"]', sel);
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'gibtsnicht' }));
  check('Unbekannte id wird ignoriert (A leer)', await p.$eval('#materialA', s => s.value) === '');

  // 9 Systemcheck weiterhin grün; keine Fehler
  check('Systemcheck grün', (await p.getAttribute('#status', 'class')).includes('ok'));
  check('Keine Konsolenfehler', errors.length === 0, errors);

  // 10 Screens
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: 'holzfaserdaemmung' }));
  await p.locator('#auswahl').screenshot({ path: out + 'auswahl_desktop.png' });
  const m = await b.newPage({ viewport: { width: 375, height: 800 } });
  await m.goto('file://' + PROJ + '/index.html'); await m.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
  await m.selectOption('#kategorie', 'daemmstoff');
  await m.selectOption('#materialA', 'holzfaserdaemmung'); await m.selectOption('#materialB', 'eps'); await m.evaluate(() => MM.auswahlOptionen.zeigeDrittes(true)); await m.selectOption('#materialC', 'zellulose');
  check('Mobil: kein seitliches Scrollen', await m.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  await m.locator('#auswahl').screenshot({ path: out + 'auswahl_mobile.png' });
  // Tablet
  const t = await b.newPage({ viewport: { width: 768, height: 900 } });
  await t.goto('file://' + PROJ + '/index.html'); await t.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
  await t.selectOption('#kategorie', 'daemmstoff');
  await t.selectOption('#materialA', 'holzfaserdaemmung'); await t.selectOption('#materialB', 'eps'); await t.evaluate(() => MM.auswahlOptionen.zeigeDrittes(true)); await t.selectOption('#materialC', 'zellulose');
  check('Tablet: kein seitliches Scrollen', await t.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));

  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
  await b.close();
})();
