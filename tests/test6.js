const PROJ = require('path').resolve(__dirname, '..');
const AUSGABE = require('path').join(require('os').tmpdir(), 'materialmatch-tests') + '/';
require('fs').mkdirSync(AUSGABE, { recursive: true });
const { chromium } = require('playwright');
require('./_offline.js');
const out = AUSGABE;
let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra))); }

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  p.on('console', m => { if (m.type()==='error' || m.type()==='warning') errors.push(m.text()); });
  p.on('pageerror', e => errors.push(String(e)));
  await p.goto('file://' + PROJ + '/index.html'); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
  await p.evaluate(() => document.querySelectorAll('main section.panel > details').forEach(d => { d.open = true; }));
  // Erwartungswerte kommen aus der Datenbank, nicht aus festen Zahlen (die Daten ändern sich mit Quellen-Updates)
  const DB = await p.evaluate(() => MATERIALMATCH_DATA.baustoffe.map(m => ({ id: m.id, rho: m.eigenschaften.rohdichte.wert, art: m.eigenschaften.rohdichte.art })));
  const rho = id => DB.find(m => m.id === id).rho;
  const FZ = x => p.evaluate(v => MM.berechnung.formatZahl(v), x);
  const GEW = async (id, V = 20) => { const kg = V * rho(id); return (await FZ(kg)) + (kg >= 1000 ? ' = ' + (await FZ(kg / 1000)) + ' t' : ''); };
  const PROZ = async (a, b) => { const q = Math.round((b - a) / a * 1000) / 10; return (q > 0 ? '+' : '') + (await FZ(q)) + ' %'; };
  const DIFF = async (a, b) => { const d = b - a; return (d > 0 ? '+' : '') + (await FZ(d)) + ' kg'; };

  const res = () => p.$eval('#ergebnis-menge', e => e.innerText);
  const tab = () => p.$$eval('#ergebnis-menge table tr', trs => trs.map(tr => [...tr.cells].map(c => { const x = c.cloneNode(true); x.querySelectorAll('sup.fn').forEach(s => s.remove()); x.querySelectorAll('br').forEach(b => b.replaceWith(' ')); return x.textContent.replace(/\s+/g, ' ').trim(); })));
  const row = async (label) => (await tab()).find(r => r[0].startsWith(label));
  const fehler = id => p.$eval('#' + id, e => e.textContent);
  const typ = async (f, d, u) => { await p.fill('#flaeche', f); await p.fill('#dicke', d); if (u) await p.selectOption('#dickeEinheit', u); };

  // --- Anfangszustand
  check('Felder aktiv', await p.$$eval('#flaeche,#dicke,#dickeEinheit', s => s.every(x => !x.disabled)));
  check('Anfangs: Hinweis "zuerst Materialien"', (await res()).includes('zuerst Materialien'));
  check('Einheit standardmäßig cm', await p.$eval('#dickeEinheit', s => s.value) === 'cm');

  // --- Materialien wählen, aber noch keine Eingabe
  await p.selectOption('#kategorie', 'tragend');
  await p.selectOption('#materialA', 'normalbeton'); await p.selectOption('#materialB', 'porenbeton');
  check('Ohne Eingabe: Aufforderung', (await res()).includes('Geben Sie Bauteilfläche und Materialdicke ein'));
  await p.fill('#flaeche', '100');
  check('Nur Fläche: Aufforderung, keine Tabelle', (await res()).includes('Geben Sie') && (await tab()).length === 0);

  // --- Beispiel aus dem Prompt: 100 m², 20 cm
  await p.fill('#dicke', '20');
  let t = await tab();
  check('Tabelle erscheint (Kopf + 6 Zeilen)', t.length === 7, t.map(r=>r[0]));
  check('Kopf nennt A und B', t[0][1].includes('Normalbeton') && t[0][2].includes('Porenbeton'), t[0]);
  check('Normalbeton Volumen = 20', (await row('Volumen'))[1] === '20', await row('Volumen'));
  check('Porenbeton Volumen = 20', (await row('Volumen'))[2] === '20');
  check('Normalbeton Gewicht = 46.000 kg (= 46 t)', (await row('Gesamtgewicht'))[1] === '46.000 = 46 t', await row('Gesamtgewicht'));
  check('Porenbeton Gewicht = 20 m³ × Rohdichte aus Datenbank', (await row('Gesamtgewicht'))[2] === await GEW('porenbeton'), [await row('Gesamtgewicht'), await GEW('porenbeton')]);
  check('Flächenmasse = 0,2 m × Rohdichte (Normalbeton 460 kg/m²)', (await row('Flächenmasse'))[1] === '460' && (await row('Flächenmasse'))[2] === await FZ(0.2 * rho('porenbeton')), await row('Flächenmasse'));
  check('Rohdichte aus Datenbank (Normalbeton 2.300)', (await row('Rohdichte'))[1] === '2.300' && (await row('Rohdichte'))[2] === await FZ(rho('porenbeton')), await row('Rohdichte'));
  check('Datenart sichtbar: Richtwert (ÖKOBAUDAT)', (await row('Datenart'))[1] === 'Richtwert' && (await row('Datenart'))[2] === 'Richtwert', await row('Datenart'));
  check('Unterschied: Bezug A, B = Differenz aus Datenbankwerten', JSON.stringify(await row('Gewichtsunterschied zu Material A')) === JSON.stringify(['Gewichtsunterschied zu Material A','Bezug', (await DIFF(20*rho('normalbeton'), 20*rho('porenbeton'))) + ' ' + (await PROZ(rho('normalbeton'), rho('porenbeton')))]), await row('Gewichtsunterschied zu Material A'));
  check('Zusammenfassung nennt Eingaben', (await res()).includes('Berechnet für 100 m² Fläche und 20 cm Dicke. Volumen je Material: 20 m³.'));

  // --- Sofortige Aktualisierung
  await p.fill('#dicke', '30');
  check('Dicke 30 cm -> Volumen 30', (await row('Volumen'))[1] === '30');
  check('Dicke 30 cm -> Normalbeton 69.000 kg', (await row('Gesamtgewicht'))[1].startsWith('69.000'), await row('Gesamtgewicht'));
  await p.fill('#flaeche', '50');
  check('Fläche 50 -> Volumen 15', (await row('Volumen'))[1] === '15');

  // --- Einheitenumrechnung
  await typ('100', '200', 'mm');
  check('200 mm == 20 cm: Volumen 20', (await row('Volumen'))[1] === '20');
  await p.selectOption('#dickeEinheit', 'm');
  check('Einheit auf m umgestellt: 200 m -> Fehler (zu dick)', (await fehler('dicke-fehler')).includes('unplausibel'), await fehler('dicke-fehler'));
  await typ('100', '0,2', 'm');
  check('0,2 m: Volumen 20', (await row('Volumen'))[1] === '20');
  check('Zusammenfassung: 0,2 m', (await res()).includes('0,2 m Dicke'), await res());
  await typ('100', '12,5', 'mm');
  check('12,5 mm, 100 m² -> 1,25 m³', (await row('Volumen'))[1] === '1,25', await row('Volumen'));

  // --- Dezimalformate
  await typ('25,5', '36,5', 'cm');
  check('25,5 m² × 36,5 cm = 9,31 m³ (Komma)', (await row('Volumen'))[1] === '9,31', await row('Volumen'));
  check('Gewicht Porenbeton bei 9,3075 m³ = Volumen × Rohdichte', (await row('Gesamtgewicht'))[2].startsWith(await FZ(9.3075 * rho('porenbeton'))), [await row('Gesamtgewicht'), await FZ(9.3075 * rho('porenbeton'))]);
  await typ('25.5', '36.5', 'cm');
  check('Punkt als Dezimaltrenner gleiches Ergebnis', (await row('Volumen'))[1] === '9,31');

  // --- Fehlerfälle
  await typ('-5', '20', 'cm');
  check('Negative Fläche: Meldung am Feld', (await fehler('flaeche-fehler')) === 'Die Fläche darf nicht negativ sein.');
  check('Negative Fläche: Feld rot markiert', await p.$eval('#flaeche', e => e.classList.contains('is-invalid') && e.getAttribute('aria-invalid') === 'true'));
  check('Negative Fläche: keine Tabelle, Hinweis', (await tab()).length === 0 && (await res()).includes('korrigieren'));
  await typ('100', '0');
  check('Dicke 0: Meldung', (await fehler('dicke-fehler')) === 'Die Dicke muss größer als 0 sein.');
  await typ('100', 'abc');
  check('Text statt Zahl: Meldung', (await fehler('dicke-fehler')).includes('nur eine Zahl'));
  await typ('1.500', '20');
  check('Mehrdeutige "1.500": Meldung', (await fehler('flaeche-fehler')).includes('Unklar'), await fehler('flaeche-fehler'));
  await typ('1.500,5', '20');
  check('"1.500,5" korrekt gelesen: Volumen 300,1 -> gerundet "300"', (await row('Volumen'))[1] === '300' && (await fehler('flaeche-fehler')) === '', await row('Volumen'));
  check('Eingabe wird exakt zurückgespiegelt: "1.500,5 m²" (nicht gerundet)', (await res()).includes('Berechnet für 1.500,5 m² Fläche und 20 cm Dicke'), await res());
  await typ('2000000', '20');
  check('Fläche 2 Mio.: unplausibel', (await fehler('flaeche-fehler')).includes('unplausibel'));
  await typ('100', '20');
  check('Korrektur: Fehler verschwinden', (await fehler('flaeche-fehler')) === '' && (await fehler('dicke-fehler')) === '');
  check('Korrektur: Feldmarkierung weg', await p.$eval('#flaeche', e => !e.classList.contains('is-invalid') && !e.hasAttribute('aria-invalid')));
  check('Korrektur: Tabelle wieder da', (await tab()).length === 7);
  await p.fill('#flaeche', '');
  check('Feld geleert: keine Fehlermeldung, Aufforderung', (await fehler('flaeche-fehler')) === '' && (await res()).includes('Geben Sie'));

  // --- Dämmstoffe mit drei Materialien
  await typ('100', '20', 'cm');
  await p.selectOption('#kategorie', 'daemmstoff');
  check('Kategoriewechsel: Eingaben bleiben, Tabelle weg (keine Materialien)', (await tab()).length === 0 && await p.$eval('#flaeche', e => e.value) === '100');
  await p.evaluate(() => MM.auswahlOptionen.zeigeDrittes(true));
  await p.selectOption('#materialA', 'mineralwolle'); await p.selectOption('#materialB', 'eps'); await p.evaluate(() => MM.auswahlOptionen.zeigeDrittes(true)); await p.selectOption('#materialC', 'holzfaserdaemmung');
  t = await tab();
  check('Drei Spalten', t[0].length === 4, t[0]);
  check('Gewichte Mineralwolle / EPS / Holzfaser aus Datenbank', JSON.stringify((await row('Gesamtgewicht')).slice(1)) === JSON.stringify([await GEW('mineralwolle'), await GEW('eps'), await GEW('holzfaserdaemmung')]), [await row('Gesamtgewicht'), await GEW('eps')]);
  { const g = id => 20 * rho(id); check('Unterschiede EPS und Holzfaser zu Mineralwolle aus Datenbank', JSON.stringify((await row('Gewichtsunterschied')).slice(2)) === JSON.stringify([(await DIFF(g('mineralwolle'), g('eps'))) + ' ' + (await PROZ(g('mineralwolle'), g('eps'))), (await DIFF(g('mineralwolle'), g('holzfaserdaemmung'))) + ' ' + (await PROZ(g('mineralwolle'), g('holzfaserdaemmung')))]), await row('Gewichtsunterschied')); }

  // --- Nicht berechenbare Materialien
  await p.selectOption('#kategorie', 'tragend');
  await p.selectOption('#materialA', 'baustahl'); await p.selectOption('#materialB', 'normalbeton'); await p.evaluate(() => MM.auswahlOptionen.zeigeDrittes(true)); await p.selectOption('#materialC', 'porenbeton');
  const vol = await row('Volumen');
  check('Baustahl: Strich statt Zahl, andere berechnet', vol[1] === '–' && vol[2] === '20' && vol[3] === '20', vol);
  check('Baustahl: Hinweistext unter Tabelle', (await p.$eval('#ergebnis-menge', e => e.innerText)).includes('Material A (Baustahl (Profile und Stabstahl)): Baustahl wird als Profil'));
  check('Unterschied: Bezug ist erstes berechenbares Material (B)', (await row('Gewichtsunterschied')) && (await row('Gewichtsunterschied'))[0] === 'Gewichtsunterschied zu Material B', await row('Gewichtsunterschied'));
  check('Baustahl: Gewichtszelle –', (await row('Gesamtgewicht'))[1] === '–');
  check('Baustahl: Rohdichte trotzdem sichtbar (7.850)', (await row('Rohdichte'))[1] === '7.850');

  // nur ein berechenbares Material -> keine Unterschiedszeile
  await p.evaluate(() => MM.auswahlOptionen.zeigeDrittes(true)); await p.selectOption('#materialC', '');
  await p.selectOption('#materialB', '');
  await p.selectOption('#materialB', 'baustahl').catch(()=>{});  // A ist schon Baustahl -> gesperrt, bleibt leer
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'baustahl', b: 'faserzement', c: '' }));
  check('Zwei nicht berechenbare (Baustahl, Faserzementplatte ohne Dicke/Flächengewicht): Tabelle mit Strichen, ohne Unterschiedszeile', !(await row('Gewichtsunterschied')) && (await row('Gesamtgewicht')).slice(1).every(x => x === '–'), await tab());
  // Schritt 11: Plattenprodukte/Deckungen rechnen mit dem Flächengewicht (Fläche 100 m² -> Dachziegel 45 kg/m² = 4.500 kg)
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'baustahl', b: 'dachziegel', c: '' }));
  check('Dachziegel: Gewicht aus Fläche × Flächengewicht (100 m² × 45 kg/m² = 4.500 kg), Volumen "–", Flächenmasse 45', (await row('Gesamtgewicht'))[1] === '–' && (await row('Gesamtgewicht'))[2].startsWith('4.500') && (await row('Volumen'))[2] === '–' && (await row('Flächenmasse'))[2] === '45', await tab());
  check('Hinweis nennt Flächengewicht, Datenart und dass die Dicke nicht verwendet wird', (await p.$eval('#ergebnis-menge', e => e.innerText)).includes('Fläche × Flächengewicht (45 kg/m², Richtwert). Die eingegebene Dicke wird nicht verwendet.'));
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'dachziegel', b: 'betondachstein', c: 'schiefer' }));
  check('Drei Deckungen (gleiche Grundlage): 4.500 / 4.200 / 3.000 kg, Unterschiede −6,7 % und −33,3 %', JSON.stringify((await row('Gesamtgewicht')).slice(1).map(x => x.split(' ')[0])) === JSON.stringify(['4.500', '4.200', '3.000']) && (await row('Gewichtsunterschied')).join(' ').includes('-6,7 %') && (await row('Gewichtsunterschied')).join(' ').includes('-33,3 %'), await tab());
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'dachziegel', b: 'zinkblech', c: 'epdm' }));
  check('Gemischte Grundlagen (Deckung / Schicht): Zinkblech "nicht vergleichbar", EPDM gegen Dachziegel verglichen, Hinweis sichtbar', (await row('Gewichtsunterschied'))[2] === 'nicht vergleichbar' && (await row('Gewichtsunterschied'))[3].includes('-4.300 kg') && (await p.$eval('#ergebnis-menge', e => e.innerText)).includes('nicht direkt vergleichbar'), await tab());
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'baustahl', b: 'dachziegel', c: '' }));
  // Buchstaben bleiben stabil, wenn A leer
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: '', b: 'eps', c: '' }));
  check('Nur B gewählt: Spalte heißt "B"', (await p.$$eval('#ergebnis-menge thead .slot', s => s.map(x => x.textContent))).join() === 'B');
  // Einzelmaterial
  check('Einzelnes Material: Gewicht EPS aus Datenbank', (await row('Gesamtgewicht'))[1] === await GEW('eps'), await row('Gesamtgewicht'));

  // fehlende Rohdichte (Datenbank manipuliert)
  await p.evaluate(() => { MATERIALMATCH_DATA.baustoffe.find(m => m.id === 'zellulose').eigenschaften.rohdichte.wert = null; MM.auswahl.setzeAuswahl({ a: 'zellulose', b: 'eps', c: '' }); });
  check('Rohdichte fehlt: Hinweis, "fehlt" in Zeile', (await row('Rohdichte'))[1] === 'fehlt' && (await p.$eval('#ergebnis-menge', e => e.innerText)).includes('Rohdichte fehlt'), await row('Rohdichte'));

  // identische Werte
  await p.evaluate(() => { const E = id => MATERIALMATCH_DATA.baustoffe.find(m => m.id === id).eigenschaften.rohdichte; E('konstruktionsvollholz').wert = E('brettschichtholz').wert; MM.auswahl.setzeAuswahl({ a: 'brettschichtholz', b: 'konstruktionsvollholz', c: '' }); });
  const diff = await row('Gewichtsunterschied');
  check('Identische Gewichte (gleiche Rohdichte gesetzt): Unterschied 0 kg, 0 %', diff && diff[2] === '0 kg 0 %', diff);

  // --- Layout: Zellen dürfen sich nicht überlappen und nicht "rund" sein (Regression: Klassenname-Konflikt)
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: 'holzfaserdaemmung' }));
  await p.fill('#flaeche', '100'); await p.fill('#dicke', '20');
  async function layoutOk(page, label) {
    const r = await page.$$eval('#ergebnis-menge table tr', trs => trs.map(tr => {
      const boxes = [...tr.cells].map(c => { const b = c.getBoundingClientRect(); return { l: b.left, r: b.right, w: b.width, h: b.height, rad: getComputedStyle(c).borderRadius }; });
      let overlap = false;
      for (let i = 1; i < boxes.length; i++) if (boxes[i].l < boxes[i-1].r - 0.5) overlap = true;
      return { overlap, schmal: boxes.some(b => b.w < 40), rund: boxes.some(b => b.rad !== '0px'), hoch: Math.max(...boxes.map(b => b.h)) };
    }));
    check(label + ': keine überlappenden Zellen', r.every(x => !x.overlap), r.filter(x => x.overlap).length);
    check(label + ': keine zu schmalen Zellen (<40px)', r.every(x => !x.schmal));
    check(label + ': keine runden Zellen', r.every(x => !x.rund));
    const w = await page.$eval('.table-wrap:has(.compare-table)', e => ({ sw: e.scrollWidth, cw: e.clientWidth }));
    if (page.viewportSize().width >= 768) check(label + ': Tabelle passt in den Rahmen (kein seitliches Scrollen)', w.sw <= w.cw + 1, w);
    // Wörter dürfen nicht mitten im Wort umbrechen: kein Wort breiter als seine Zelle
    const zerrissen = await page.$$eval('#ergebnis-menge table td, #ergebnis-menge table th', cs => cs.filter(c => {
      const range = document.createRange(); range.selectNodeContents(c);
      return c.scrollWidth > c.clientWidth + 1;
    }).length);
    check(label + ': kein Zelleninhalt läuft über (keine zerrissenen Wörter)', zerrissen === 0, zerrissen);
    const seite = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    check(label + ': Seite selbst scrollt nicht seitlich', seite);
    check(label + ': Zeilen nicht übermäßig hoch (<120px)', r.every(x => x.hoch < 120), r.map(x=>x.hoch));
  }
  await layoutOk(p, 'Desktop');
  for (const w of [375, 768]) {
    const m = await b.newPage({ viewport: { width: w, height: 800 } });
    await m.goto('file://' + PROJ + '/index.html'); await m.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
    await m.selectOption('#kategorie', 'daemmstoff');
    await m.selectOption('#materialA', 'mineralwolle'); await m.selectOption('#materialB', 'eps'); await m.evaluate(() => MM.auswahlOptionen.zeigeDrittes(true)); await m.selectOption('#materialC', 'holzfaserdaemmung');
    await m.fill('#flaeche', '100'); await m.fill('#dicke', '20');
    await layoutOk(m, 'Breite ' + w);
  }

  // --- Systemcheck + Konsole
  check('Systemcheck grün', (await p.getAttribute('#status', 'class')).includes('ok'));
  check('Keine Konsolenfehler', errors.length === 0, errors);

  // --- Darstellung
  await p.reload(); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
  await p.selectOption('#kategorie', 'daemmstoff');
  await p.evaluate(() => MM.auswahlOptionen.zeigeDrittes(true));
  await p.selectOption('#materialA', 'mineralwolle'); await p.selectOption('#materialB', 'eps'); await p.evaluate(() => MM.auswahlOptionen.zeigeDrittes(true)); await p.selectOption('#materialC', 'holzfaserdaemmung');
  await p.fill('#flaeche', '100'); await p.fill('#dicke', '20');
  await p.locator('#eingaben').screenshot({ path: out + 'eingaben_desktop.png' });
  await p.locator('#ergebnisse').screenshot({ path: out + 'ergebnis_desktop.png' });
  for (const [n, w] of [['mobile', 375], ['tablet', 768]]) {
    const m = await b.newPage({ viewport: { width: w, height: 800 } });
    await m.goto('file://' + PROJ + '/index.html'); await m.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
    await m.selectOption('#kategorie', 'daemmstoff');
    await m.selectOption('#materialA', 'mineralwolle'); await m.selectOption('#materialB', 'eps'); await m.evaluate(() => MM.auswahlOptionen.zeigeDrittes(true)); await m.selectOption('#materialC', 'holzfaserdaemmung');
    await m.fill('#flaeche', '-3'); await m.fill('#dicke', '20');
    if (n === 'mobile') await m.locator('#eingaben').screenshot({ path: out + 'eingaben_mobile_fehler.png' });
    await m.fill('#flaeche', '100');
    check(n + ': kein seitliches Scrollen der Seite', await m.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
    if (n === 'mobile') await m.locator('#ergebnisse').screenshot({ path: out + 'ergebnis_mobile.png' });
  }

  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
  await b.close();
})();
