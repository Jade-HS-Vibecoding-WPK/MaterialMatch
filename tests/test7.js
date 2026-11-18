/* Tabellen am Handy (Schritt 5/12): Wisch-Hinweis, erste Spalte bleibt beim Wischen fixiert, am Desktop kein Hinweis */
const PROJ = require('path').resolve(__dirname, '..');
const { chromium } = require('playwright');
require('./_offline.js');
let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 400))); }
(async () => {
  const b = await chromium.launch();
  const m = await b.newPage({ viewport: { width: 375, height: 800 } });
  await m.goto('file://' + PROJ + '/index.html'); await m.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
  await m.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'steinwolle', b: 'eps', c: 'holzfaserdaemmung' }));
  await m.fill('#flaeche', '100'); await m.fill('#dicke', '20');
  await m.$$eval('main section.panel > details, #ergebnisse details.sub', d => d.forEach(x => { x.open = true; }));
  check('Handy: Wisch-Hinweis ist sichtbar', await m.$eval('#ergebnis-technisch .scroll-hint', e => getComputedStyle(e).display) !== 'none');
  const breiter = await m.$eval('.table-wrap:has(.compare-table)', e => e.scrollWidth > e.clientWidth);
  check('Handy: die Vergleichstabelle ist breiter als der Rahmen (scrollt in sich, nicht die Seite)', breiter && !(await m.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
  await m.$eval('.table-wrap:has(.compare-table)', e => { e.scrollLeft = e.scrollWidth; });
  const pos = await m.$eval('.compare-table tbody th', e => Math.round(e.getBoundingClientRect().left - e.closest('.table-wrap').getBoundingClientRect().left));
  check('Handy: erste Spalte bleibt nach dem Wischen am linken Rand fixiert (Abstand 0–1 px)', pos >= 0 && pos <= 1, pos);
  const d = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await d.goto('file://' + PROJ + '/index.html'); await d.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
  await d.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'steinwolle', b: 'eps', c: '' }));
  await d.fill('#flaeche', '100'); await d.fill('#dicke', '20');
  await d.$$eval('main section.panel > details, #ergebnisse details.sub', x => x.forEach(y => { y.open = true; }));
  check('Desktop: kein Wisch-Hinweis', await d.$eval('#ergebnis-technisch .scroll-hint', e => getComputedStyle(e).display) === 'none');
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
  await b.close();
})();
