/* Grundgerüst (Schritt 1): Seite lädt, sechs Bereiche, Ein-/Ausklappen, kein seitliches Scrollen */
const PROJ = require('path').resolve(__dirname, '..');
const { chromium } = require('playwright');
require('./_offline.js');
let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 400))); }
(async () => {
  const b = await chromium.launch();
  for (const [name, vp] of [['Desktop', { width: 1280, height: 900 }], ['Handy', { width: 375, height: 800 }]]) {
    const p = await b.newPage({ viewport: vp });
    const errors = [];
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    p.on('pageerror', e => errors.push(String(e)));
    p.on('requestfailed', r => errors.push('failed: ' + r.url()));
    await p.goto('file://' + PROJ + '/index.html'); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
    await p.waitForTimeout(300);
    check(`${name}: Statuszeile grün`, /Datenbank geprüft ✓/.test(await p.textContent('#status')));
    check(`${name}: drei aufklappbare Bereiche in der richtigen Reihenfolge (Diagramme, Alternativen und Quellen sind keine aufklappbaren Hauptbereiche mehr)`, JSON.stringify(await p.$$eval('main section.panel', s => s.map(x => x.id))) === '["auswahl","eingaben","ergebnisse"]');
    check(`${name}: kein seitliches Scrollen`, !(await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
    await p.click('#auswahl summary');
    const zu = await p.$eval('#auswahl details', d => !d.open);
    await p.click('#auswahl summary');
    check(`${name}: Bereich lässt sich ein- und wieder ausklappen`, zu && await p.$eval('#auswahl details', d => d.open));
    check(`${name}: keine Konsolenfehler`, errors.length === 0, errors);
    await p.close();
  }
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
  await b.close();
})();
