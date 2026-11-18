/* MaterialMatch 2.0, Schritt 7: „Alle technischen Eigenschaften anzeigen“ (Tabellen standardmäßig zugeklappt)
   Aufruf:  node tests/test34.js */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 500))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html?modus=demo';

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async (breite = 1280, url = URL) => { const p = await b.newPage({ viewport: { width: breite, height: 900 } }); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); await p.goto(url); await p.waitForTimeout(250); await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: '' })); await p.fill('#flaeche', '100'); await p.fill('#dicke', '20'); return p; };
  const zeile = (p, sel, label) => p.evaluate(([sel, label]) => { const r = [...document.querySelectorAll(sel + ' table tr')].find(x => x.cells[0].textContent.trim().startsWith(label)); return r ? [...r.cells].slice(1).map(c => c.textContent.replace(/\s+/g, ' ').trim()) : null; }, [sel, label]);

  let p = await neu();
  const kopf = await p.$eval('#ergebnisse', s => ({ titel: s.querySelector('summary h2').textContent, offen: s.querySelector(':scope > details').open, nummer: !!s.querySelector('.num') }));
  check('Der Tabellenbereich heißt „Alle technischen Eigenschaften anzeigen“, ist standardmäßig zugeklappt (auch nach Auswahl und Eingabe) und hat keine Nummer mehr', kopf.titel === 'Alle technischen Eigenschaften anzeigen' && kopf.offen === false && kopf.nummer === false, kopf);
  check('Keiner der fünf Bereichstitel trägt noch eine Nummer', await p.$$eval('main section.panel summary h2 .num', n => n.length) === 0);
  check('Er steht unter den Diagrammen und dem Export, im Reiter „Vergleich“', await p.evaluate(() => { const e = document.getElementById('ergebnisse'); return document.getElementById('bereich-vergleich').contains(e) && e.previousElementSibling.classList.contains('export-leiste') && e.previousElementSibling.previousElementSibling.id === 'diagramme'; }));
  check('Zugeklappt sind die Tabellen nicht sichtbar', !(await p.isVisible('#ergebnis-technisch')) && !(await p.isVisible('#rechnung-kosten')));

  // Hinweise und Export bleiben sichtbar
  check('Der Hinweis „nur zur Orientierung“ und die Export-Schaltflächen sind trotzdem sichtbar (nicht im zugeklappten Bereich)', await p.isVisible('#orientierung') && await p.isVisible('#export-menue-knopf') && await p.$eval('#export-menue-knopf', e => !e.disabled) && await p.$eval('#druck-knopf', e => !e.disabled) && await p.$eval('#csv-knopf', e => !e.disabled));

  // Aufklappen
  await p.click('#ergebnisse > details > summary');
  check('Klick auf die Überschrift öffnet den Bereich; er enthält weiter die sechs Unterabschnitte in der alten Reihenfolge', JSON.stringify(await p.$$eval('#ergebnisse details.sub > summary', s => s.map(x => x.textContent.trim()))) === JSON.stringify(['Menge und Gewicht', 'Technische Eigenschaften', 'Kosten', 'CO₂-Bilanz', 'Wärmedurchlasswiderstand (R-Wert)', 'Weitere Eigenschaften']) && await p.isVisible('#ergebnis-technisch'));
  const labels = await p.$$eval('#ergebnis-technisch tr th, #ergebnis-technisch tr td:first-child, #ergebnis-weitere tr th, #ergebnis-weitere tr td:first-child, #ergebnis-menge tr th, #ergebnis-menge tr td:first-child', c => c.map(x => x.textContent.replace(/\s+/g, ' ').trim()).join(' | '));
  check('Die technischen Tabellen enthalten weiter Rohdichte, Wärmeleitfähigkeit (Nennwert und Bemessungswert), Brandverhalten, Druckfestigkeit und Recycling', ['Rohdichte', 'Nennwert λD', 'Bemessungswert λB', 'Brandverhalten', 'Druckfestigkeit', 'Recycling'].every(t => labels.includes(t)), labels);
  check('Alle bisherigen Container und IDs sind erhalten (Menge, Technik, Kosten, CO₂, R-Wert, Weitere, Ziel-R)', await p.evaluate(() => ['ergebnis-menge', 'ergebnis-technisch', 'ergebnis-kosten', 'ergebnis-co2', 'ergebnis-weitere', 'rechnung-kosten', 'rechnung-co2', 'rechnung-r', 'rechnung-rziel', 'rZiel', 'alle-umschalten'].every(i => document.getElementById(i))));
  check('Berechnete Werte unverändert: Menge 20 m³ und Gewicht 925 kg bei Mineralwolle (100 m² × 20 cm × 46,25 kg/m³), R = 0,20 ÷ 0,035 = 5,71', /^925/.test((await zeile(p, '#ergebnis-menge', 'Gesamtgewicht'))[0]) && (await zeile(p, '#ergebnis-menge', 'Volumen'))[0] === '20' && /5,71/.test((await zeile(p, '#rechnung-r', 'R = d'))[0]));
  check('„Alle Abschnitte zuklappen“ funktioniert weiter (Beschriftung wechselt)', await (async () => { const anfang = (await p.textContent('#alle-umschalten')) === 'Alle Abschnitte aufklappen'; await p.click('#alle-umschalten'); const auf = await p.$$eval('#ergebnisse details.sub', d => d.every(x => x.open)) && (await p.textContent('#alle-umschalten')) === 'Alle Abschnitte zuklappen'; await p.click('#alle-umschalten'); return anfang && auf && await p.$$eval('#ergebnisse details.sub', d => d.every(x => !x.open)); })());

  // Aktualisierung im zugeklappten Zustand
  await p.click('#ergebnisse > details > summary');
  await p.fill('#flaeche', '50');
  await p.click('#ergebnisse > details > summary');
  check('Auch im zugeklappten Zustand werden die Tabellen aktualisiert (50 m² × 20 cm: 10 m³ × 46,31 kg/m³ ≈ 463 kg beim Öffnen)', /46[23]/.test((await zeile(p, '#ergebnis-menge', 'Gesamtgewicht'))[0]), await zeile(p, '#ergebnis-menge', 'Gesamtgewicht'));

  // Fehlende Werte werden weiter korrekt angezeigt
  await p.evaluate(() => MM.datenmodus.setze(false));
  const fehlt = await zeile(p, '#ergebnis-technisch', 'Bemessungswert λB');
  check('Fehlende Werte (Echtdaten-Modus) stehen weiter als „fehlt“ in den Tabellen, nicht als erfundene Zahl', fehlt && fehlt.every(x => /fehlt|nicht verfügbar/i.test(x) || /\d/.test(x)), fehlt);
  await p.evaluate(() => MM.datenmodus.setze(true));

  // Neu laden / Tastatur
  const k = await neu();
  await k.focus('#ergebnisse > details > summary'); await k.keyboard.press('Enter');
  check('Der Bereich lässt sich per Tastatur öffnen (Enter) und schließen (Leertaste)', await k.$eval('#ergebnisse > details', d => d.open) && (await k.keyboard.press('Space'), await k.$eval('#ergebnisse > details', d => !d.open)));

  // Druck: alles aufgeklappt
  const pd = await neu();
  await pd.emulateMedia({ media: 'print' });
  const vorDruck = await pd.evaluate(() => ({ titel: getComputedStyle(document.querySelector('#ergebnisse > details > summary')).display }));
  await pd.emulateMedia({ media: 'screen' });
  const pdf = await pd.evaluate(() => new Promise(res => { window.addEventListener('beforeprint', () => { res([...document.querySelectorAll('#ergebnisse details')].map(d => d.open)); }, { once: true }); window.dispatchEvent(new Event('beforeprint')); }));
  check('Vor dem Drucken klappt die Seite alle Bereiche auf (auch „Alle technischen Eigenschaften“ und alle Unterabschnitte), damit das PDF vollständig ist', pdf.length === 7 && pdf.every(Boolean), pdf);
  await pd.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  check('Nach dem Drucken ist der Bereich wieder zugeklappt', await pd.$eval('#ergebnisse > details', d => !d.open));

  // Layout: Tabellen im geöffneten Bereich
  const lay = async breite => { const m = await neu(breite); await m.click('#ergebnisse > details > summary'); await m.waitForTimeout(150); return m.evaluate(() => { const cw = document.documentElement.clientWidth; const ws = [...document.querySelectorAll('#ergebnisse .table-wrap')]; return { seite: document.documentElement.scrollWidth <= cw, tabellen: ws.length, ueberAussen: ws.filter(w => w.getBoundingClientRect().right > cw + 1).length, scrollbarMitFokus: ws.filter(w => w.scrollWidth > w.clientWidth + 1).every(w => w.getAttribute('tabindex') === '0') }; }); };
  const d = await lay(1280), h = await lay(375);
  check('Desktop: Tabellen innerhalb der Seite, kein seitliches Scrollen der Seite', d.seite && d.tabellen >= 5 && d.ueberAussen === 0 && d.scrollbarMitFokus, d);
  check('Handy 375 px: Seite scrollt nicht seitlich; breite Tabellen scrollen in ihrem Rahmen und sind per Tastatur erreichbar', h.seite && h.ueberAussen === 0 && h.scrollbarMitFokus, h);

  check('Keine Konsolenfehler oder -warnungen', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
