/* MaterialMatch 2.0, Schritt 4: kompakter Eingabebereich
   Aufruf:  node tests/test31.js */
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
  const neu = async (breite = 1280) => { const p = await b.newPage({ viewport: { width: breite, height: 900 } }); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); await p.goto(URL); await p.waitForTimeout(250); await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: '' })); return p; };

  let p = await neu();
  const labels = await p.$$eval('#eingaben label', l => l.map(x => x.textContent.trim()));
  check('Kurze Beschriftungen: „Fläche (m²)“, „Dicke“, „Anwendung“, „Priorität“', JSON.stringify(labels) === JSON.stringify(['Fläche (m²)', 'Dicke', 'Anwendung', 'Priorität']), labels);
  check('Es stehen genau vier Eingaben im Bereich (Fläche, Dicke mit Einheit, Anwendung, Priorität) und keine Erklärtexte (.hint) mehr', await p.$$eval('#eingaben .hint', h => h.length) === 0 && JSON.stringify(await p.$$eval('#eingaben input, #eingaben select', e => e.map(x => x.id))) === JSON.stringify(['flaeche', 'dicke', 'dickeEinheit', 'anwendung', 'prioritaet']));
  check('Alle Eingabe-IDs bleiben erhalten (flaeche, dicke, dickeEinheit, anwendung, prioritaet, flaeche-fehler, dicke-fehler)', await p.evaluate(() => ['flaeche', 'dicke', 'dickeEinheit', 'anwendung', 'prioritaet', 'flaeche-fehler', 'dicke-fehler'].every(i => document.getElementById(i))));

  // Info-Symbole
  const infos = await p.$$eval('#eingaben .info', i => i.map(x => x.getAttribute('data-begriff-id')));
  check('Vier Informationssymbole: Fläche, Dicke, Anwendungsbereich, Priorität', JSON.stringify(infos) === JSON.stringify(['flaeche', 'dicke', 'anwendungsbereich', 'prioritaet']), infos);
  const texte = {};
  for (const id of ['flaeche', 'dicke', 'anwendungsbereich', 'prioritaet']) {
    await p.click(`#eingaben .info[data-begriff-id=${id}]`);
    texte[id] = await p.$eval(`#eingaben .info[data-begriff-id=${id}]`, k => document.getElementById(k.getAttribute('aria-controls')).textContent);
  }
  check('Die früheren Hinweise stehen in den Erklärungen: Komma oder Punkt, Einheit wählbar, „Automatisch“ nimmt Material A, Priorität bestimmt Reihenfolge und Gewichtsdiagramm', /Komma oder Punkt/.test(texte.flaeche) && /mm, cm oder m/.test(texte.dicke) && /Automatisch/.test(texte.anwendungsbereich) && /Reihenfolge/.test(texte.prioritaet) && /Gewichtsdiagramm/.test(texte.prioritaet), texte);
  check('Die Erklärung erscheint erst nach dem Klick und lässt sich wieder schließen; der Knopf meldet aria-expanded', await p.$eval('#eingaben .info[data-begriff-id=flaeche]', k => k.getAttribute('aria-expanded')) === 'true');
  await p.click('#eingaben .info[data-begriff-id=flaeche]');
  check('Zweiter Klick schließt die Erklärung', await p.$eval('#eingaben .info[data-begriff-id=flaeche]', k => k.getAttribute('aria-expanded')) === 'false');

  // Berechnung unverändert
  await p.fill('#flaeche', '100'); await p.fill('#dicke', '20');
  const e = await p.evaluate(() => MM.eingaben.hole());
  check('Eingaben werden wie vorher gelesen: 100 m², 20 cm → Volumen 20 m³ (Berechnung im Mengenbereich)', e.status === 'ok' && e.flaeche_m2 === 100 && e.dicke_wert === 20 && e.dicke_einheit === 'cm' && /20/.test(await p.$eval('#ergebnis-menge', x => x.textContent)), e);
  await p.fill('#flaeche', 'abc');
  check('Fehleingaben werden direkt unter dem Feld gemeldet (role=alert, aria-invalid)', (await p.$eval('#flaeche-fehler', x => x.textContent.length)) > 5 && await p.$eval('#flaeche', x => x.getAttribute('aria-invalid')) === 'true');
  await p.fill('#flaeche', '12,5');
  check('Komma als Dezimaltrenner wird akzeptiert (12,5)', await p.evaluate(() => MM.eingaben.hole().flaeche_m2) === 12.5);

  // Anordnung
  const lay = async (breite) => { const m = await neu(breite); return m.evaluate(() => { const r = id => document.getElementById(id).getBoundingClientRect(); const cw = document.documentElement.clientWidth; const f = ['flaeche', 'dicke', 'anwendung', 'prioritaet'].map(r); return { reihe: f.every(x => Math.abs(x.top - f[0].top) < 4), spalten: new Set(f.map(x => Math.round(x.left))).size, voll: f.every(x => x.width > cw * 0.7), seite: document.documentElement.scrollWidth <= cw, innen: (() => { const k = document.getElementById('eingaben').getBoundingClientRect(); return f.every(x => x.left >= k.left && x.right <= k.right); })(), hoeheBereich: document.querySelector('#eingaben .eingaben-grid').getBoundingClientRect().height }; }); };
  const d = await lay(1280), t = await lay(820), h = await lay(375);
  check('Desktop 1280 px (Bento-Kachel „Eingaben“): Fläche und Dicke nebeneinander, Anwendung und Priorität darunter über die volle Kachelbreite (2 Spalten), die Felder brauchen zusammen weniger als 250 px Höhe (die Kachel selbst wird auf Höhe der Auswahl gestreckt) und die Felder liegen alle innerhalb der Kachel', d.spalten === 2 && d.hoeheBereich < 250 && d.seite && d.innen, d);
  check('Tablet 820 px: zwei Spalten, kein seitliches Scrollen', t.spalten === 2 && t.seite, t);
  check('Handy 375 px: Felder untereinander über die ganze Breite, kein seitliches Scrollen', h.spalten === 1 && h.seite, h);

  check('Keine Konsolenfehler oder -warnungen', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
