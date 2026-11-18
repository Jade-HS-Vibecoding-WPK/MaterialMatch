/* Lange Tabelle am Handy (Schritt 5): drei tragende Materialien, keine Überlappung der Zellen, nichts ragt über den Rahmen */
const PROJ = require('path').resolve(__dirname, '..');
const { chromium } = require('playwright');
require('./_offline.js');
let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 400))); }
(async () => {
  const b = await chromium.launch();
  const m = await b.newPage({ viewport: { width: 375, height: 800 } });
  await m.goto('file://' + PROJ + '/index.html'); await m.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
  await m.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'konstruktionsvollholz', b: 'brettschichtholz', c: 'hochlochziegel' }));
  await m.fill('#flaeche', '100'); await m.fill('#dicke', '20');
  await m.$$eval('main section.panel > details, #ergebnisse details.sub', d => d.forEach(x => { x.open = true; }));
  const r = await m.evaluate(() => {
    const t = document.querySelector('#ergebnis-technisch .compare-table');
    const zellen = [...t.querySelectorAll('tbody tr')].map(tr => [...tr.cells].map(c => c.getBoundingClientRect()));
    let ueberlappung = 0;
    zellen.forEach(z => z.forEach((a, i) => z.forEach((c, j) => { if (j > i && a.right > c.left + 1 && a.left < c.right - 1) ueberlappung++; })));
    const rund = [...t.querySelectorAll('td, th')].filter(c => parseFloat(getComputedStyle(c).borderRadius) > 8).length;
    return { zeilen: zellen.length, ueberlappung, rund, seite: document.documentElement.scrollWidth <= document.documentElement.clientWidth };
  });
  check('Tabelle mit Zeilen vorhanden, keine überlappenden Zellen, keine runden Zellen (Klassenname-Kollision von früher)', r.zeilen >= 3 && r.ueberlappung === 0 && r.rund === 0, r);
  check('Seite scrollt nicht seitlich', r.seite);
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
  await b.close();
})();
