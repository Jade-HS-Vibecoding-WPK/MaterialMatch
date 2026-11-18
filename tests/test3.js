/* Systemcheck beim Laden: gesunde und absichtlich beschädigte Datenbank (Schritt 2/10, überarbeitet in Schritt 11)
   Frühere Fassung dieses Skripts gab nur Text aus und beschädigte die Daten wegen einer veralteten Textersetzung gar nicht
   („toter Test“). Jetzt wird jede Beschädigung geprüft: Ersetzung muss greifen, und die Seite muss den Fehler melden. */
const PROJ = require('path').resolve(__dirname, '..');
const AUSGABE = require('path').join(require('os').tmpdir(), 'materialmatch-tests') + '/';
require('fs').mkdirSync(AUSGABE, { recursive: true });
const { chromium } = require('playwright');
require('./_offline.js');
const fs = require('fs');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 400))); }

(async () => {
  const b = await chromium.launch();

  // ---- gesunde Datenbank
  for (const [name, vp] of [['Desktop', { width: 1280, height: 900 }], ['Handy', { width: 375, height: 800 }]]) {
    const p = await b.newPage({ viewport: vp });
    const errors = [];
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
    p.on('pageerror', e => errors.push(String(e)));
    p.on('requestfailed', r => errors.push('failed: ' + r.url()));
    await p.goto('file://' + PROJ + '/index.html'); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
    await p.waitForTimeout(300);
    const status = await p.textContent('#status');
    check(`${name}: Systemcheck grün mit 50 Baustoffen, 5 Kategorien, 0 Hinweisen`, /Datenbank geprüft ✓ \(50 Baustoffe, 5 Kategorien, 0 Hinweise\)/.test(status) && (await p.getAttribute('#status', 'class')).includes('ok'), status);
    const zeilen = await p.$$eval('#datenuebersicht tbody tr', r => r.map(x => [...x.cells].map(c => c.textContent)));
    check(`${name}: Katalog listet 50 Baustoffe; Hanfdämmung und Baustahl stehen in ihrer Kategorie und mit ihrem Anwendungsbereich`, zeilen.length === 50 &&
      JSON.stringify(zeilen.find(z => z[0].startsWith('Hanf'))) === JSON.stringify(['Hanfdämmung', 'Dämmstoffe', 'Wärmedämmung']) &&
      JSON.stringify(zeilen.find(z => z[0].startsWith('Baustahl'))) === JSON.stringify(['Baustahl (Profile und Stabstahl)', 'Tragende Baustoffe', 'Tragende Wand / Decke / Stütze']), zeilen.length);
    check(`${name}: Seite scrollt nicht seitlich, keine Konsolenfehler`, !(await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) && errors.length === 0, errors);
    await p.close();
  }

  // ---- beschädigte Datenbanken (Kopie des Projekts mit absichtlichem Fehler)
  const FEHLER = [
    { name: 'Richtwert ohne Quelle', suche: 'art: "richtwert", quelle: "oebd-a71e60a5"', ersatz: 'art: "richtwert", quelle: null', erwartet: /Fehler in der Baustoffdatenbank/, konsole: /richtwert/ },
    { name: 'unbekannte Kategorie', suche: 'kategorien: ["tragend"],\n      anwendungen: ["tragwerk"],\n      mengenmodell: "schicht",\n      eigenschaften: {\n        rohdichte:             { wert: 2300', ersatz: 'kategorien: ["gibtesnicht"],\n      anwendungen: ["tragwerk"],\n      mengenmodell: "schicht",\n      eigenschaften: {\n        rohdichte:             { wert: 2300', erwartet: /Fehler in der Baustoffdatenbank/, konsole: /Unbekannte Kategorie/ },
    { name: 'falsche Einheit', suche: 'wert: 2300, einheit: "kg/m³"', ersatz: 'wert: 2300, einheit: "t/m³"', erwartet: /Fehler in der Baustoffdatenbank/, konsole: /Einheit/ },
    { name: 'Syntaxfehler in der Datendatei', suche: 'window.MATERIALMATCH_DATA = {', ersatz: 'window.MATERIALMATCH_DATA = {{', erwartet: /konnte nicht geladen werden/, konsole: null }
  ];
  for (const f of FEHLER) {
    const tmp = AUSGABE + 'kaputt';
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.cpSync(PROJ, tmp, { recursive: true, filter: s => !s.includes('/tests') && !s.includes('/.git') });
    const vorher = fs.readFileSync(tmp + '/data/baustoffe.js', 'utf8');
    const nachher = vorher.replace(f.suche, f.ersatz);
    check(`Testvorbereitung „${f.name}“: Ersetzung hat gegriffen (sonst wäre der Test wertlos)`, nachher !== vorher);
    fs.writeFileSync(tmp + '/data/baustoffe.js', nachher);
    const p = await b.newPage();
    const msgs = []; p.on('console', m => msgs.push(m.type() + ': ' + m.text())); p.on('pageerror', e => msgs.push('pageerror: ' + e));
    await p.goto('file://' + tmp + '/index.html'); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; }); await p.waitForTimeout(300);
    const status = await p.textContent('#status'), klasse = await p.getAttribute('#status', 'class');
    check(`Beschädigt („${f.name}“): Seite meldet den Fehler sichtbar (rote Statuszeile)`, f.erwartet.test(status) && klasse.includes('fehler') && !klasse.includes('ok'), [status, klasse]);
    if (f.konsole) check(`Beschädigt („${f.name}“): Details stehen in der Browser-Konsole`, msgs.some(m => f.konsole.test(m)), msgs);
    await p.close();
  }
  fs.rmSync(AUSGABE + 'kaputt', { recursive: true, force: true });

  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
  await b.close();
})();
