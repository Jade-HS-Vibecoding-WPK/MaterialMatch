/* MaterialMatch 2.0, Schritt 6: Diagramme „Materialien im Vergleich“ (kein eigener Hauptbereich mehr)
   Aufruf:  node tests/test33.js */
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
  check('Der alte Hauptbereich „Diagramme“ (aufklappbar mit Nummer) existiert nicht mehr; drei aufklappbare Hauptbereiche bleiben', await p.$$eval('main section.panel', s => s.length) === 3 && await p.$$eval('#diagramme > details, #diagramme > summary', e => e.length) === 0);
  check('Abschnitt „Materialien im Vergleich“ (h2) steht im Reiter „Vergleich“ unter „Vergleich auf einen Blick“ (dazwischen der Orientierungshinweis), danach der Export und „Alle technischen Eigenschaften“; IDs diagramme und diagramme-inhalt bleiben', await p.evaluate(() => { const s = document.getElementById('diagramme'); return s.querySelector('h2').textContent === 'Materialien im Vergleich' && document.getElementById('bereich-vergleich').contains(s) && s.previousElementSibling.id === 'orientierung' && s.previousElementSibling.previousElementSibling.id === 'dashboard' && s.nextElementSibling.classList.contains('export-leiste') && s.nextElementSibling.nextElementSibling.id === 'ergebnisse' && !!document.getElementById('diagramme-inhalt'); }));
  check('Der Abschnitt ist immer sichtbar (nicht zugeklappt), auch ohne Auswahl', await p.isVisible('#diagramme-titel'));

  // ---- Ohne Eingabe
  check('Ohne Fläche/Dicke: nur das Wärmedämmungs-Diagramm (λ), kein Knopf „Weitere Kennwerte“ (es gibt nichts Weiteres)', JSON.stringify(await p.$$eval('figure.chart', f => f.map(x => x.dataset.chart))) === '["lambda"]' && !(await p.$('#diagramme-weitere-knopf')));

  // ---- Mit Eingabe
  await p.fill('#flaeche', '100'); await p.fill('#dicke', '20');
  const haupt = await p.$$eval('.chart-liste:not(.chart-weitere) > figure.chart', f => f.map(x => x.dataset.chart));
  check('Zuerst nur die vier wichtigsten Diagramme in der Reihenfolge des Dashboards: Kosten, CO₂ (fossil), Gewicht, Wärmedämmung (λ)', JSON.stringify(haupt) === '["kosten","co2-fossil","gewicht","lambda"]', haupt);
  check('„CO₂ gesamt“ (weiterer Kennwert) ist zunächst verborgen', await p.$eval('#diagramme-weitere', e => e.hidden) && !(await p.isVisible('figure.chart[data-chart="co2-gesamt"]')));
  const k = await p.$eval('#diagramme-weitere-knopf', e => ({ text: e.textContent, expanded: e.getAttribute('aria-expanded'), controls: e.getAttribute('aria-controls'), typ: e.type, tag: e.tagName }));
  check('Schaltfläche „Weitere Kennwerte anzeigen“ (button, aria-expanded false, aria-controls auf den Bereich)', k.text === 'Weitere Kennwerte anzeigen' && k.expanded === 'false' && k.controls === 'diagramme-weitere' && k.typ === 'button' && k.tag === 'BUTTON', k);
  await p.click('#diagramme-weitere-knopf');
  check('Klick zeigt „CO₂ gesamt“; die Schaltfläche heißt jetzt „Weitere Kennwerte ausblenden“ (aria-expanded true)', await p.isVisible('figure.chart[data-chart="co2-gesamt"]') && (await p.textContent('#diagramme-weitere-knopf')) === 'Weitere Kennwerte ausblenden' && (await p.getAttribute('#diagramme-weitere-knopf', 'aria-expanded')) === 'true');
  await p.fill('#flaeche', '120');
  check('Der geöffnete Zustand bleibt bei Änderungen erhalten (Diagramme werden neu gezeichnet, der Bereich bleibt offen)', await p.isVisible('figure.chart[data-chart="co2-gesamt"]') && (await p.getAttribute('#diagramme-weitere-knopf', 'aria-expanded')) === 'true');
  await p.click('#diagramme-weitere-knopf');
  check('Zweiter Klick blendet wieder aus', !(await p.isVisible('figure.chart[data-chart="co2-gesamt"]')) && (await p.textContent('#diagramme-weitere-knopf')) === 'Weitere Kennwerte anzeigen');
  await p.focus('#diagramme-weitere-knopf'); await p.keyboard.press('Enter');
  check('Die Schaltfläche ist per Tastatur bedienbar (Enter)', await p.isVisible('figure.chart[data-chart="co2-gesamt"]'));
  await p.fill('#flaeche', '100');

  // ---- Inhalte unverändert (Zahlen, Farbskala, Pflichtsatz, Legende)
  const dia = await p.$$eval('figure.chart', fs => fs.map(f => [f.dataset.chart, [...f.querySelectorAll('.chart-row[data-material]')].map(r => [r.dataset.wert, r.dataset.farbe, r.dataset.bewertung])]));
  check('Diagramm-Zahlen unverändert: Kosten 1.700/1.400, CO₂ fossil 1.329/1.728, Gewicht 925/500 (Handrechnung wie im Dashboard-Test)', dia.find(d => d[0] === 'kosten')[1].map(r => Math.round(r[0])).join() === '1700,1400' && dia.find(d => d[0] === 'co2-fossil')[1].map(r => Math.round(r[0])).join() === '1329,1728' && dia.find(d => d[0] === 'gewicht')[1].map(r => Math.round(r[0])).join() === '925,500', dia);
  const farben = dia.flatMap(d => d[1].map(r => r[1].toLowerCase()));
  const erlaubt = ['#17643a', '#78b85a', '#e9c94e', '#e68b43', '#951f2b', '#7c8a99', '#b8bec6', '#b9bec5', ''].map(x => x.toLowerCase());
  check('Bewertungsfarbskala bleibt: Dunkelgrün #17643A, Hellgrün #78B85A, Gelb #E9C94E, Orange #E68B43, Dunkelrot #951F2B (dazu Neutral/Grau), Farben weiter dynamisch berechnet (Mineralwolle gegen EPS: Kosten rot/grün, CO₂ fossil grün/rot)', dia.find(d => d[0] === 'kosten')[1][0][1].toLowerCase() === '#951f2b' && dia.find(d => d[0] === 'kosten')[1][1][1].toLowerCase() === '#17643a' && dia.find(d => d[0] === 'co2-fossil')[1][0][1].toLowerCase() === '#17643a', farben);
  check('Pflichtsatz zur relativen Bewertung steht im Abschnitt; die Legende ist da', /Die Farben zeigen eine relative Bewertung der ausgewählten Materialien und stellen keine allgemeingültige Aussage über deren Qualität dar\./.test(await p.$eval('#diagramme', e => e.textContent.replace(/\s+/g, ' '))) && await p.$$eval('#diagramme .legend', l => l.length) === 1);
  check('Jede Balkenspur bleibt für Screenreader beschriftet (role=img, aria-label mit Material, Wert und Bewertung)', await p.$$eval('#diagramme .chart-track', t => t.length > 0 && t.every(x => x.getAttribute('role') === 'img' && /:/.test(x.getAttribute('aria-label')))));

  // ---- Lese-Schnittstelle für das Dashboard unverändert
  check('Die Schnittstelle MM.diagramme.ergebnisse() liefert weiter alle fünf Diagramme, auch solange „CO₂ gesamt“ verborgen ist', await p.evaluate(() => Object.keys(MM.diagramme.ergebnisse().diagramme).sort().join()) === 'co2-fossil,co2-gesamt,gewicht,kosten,lambda');

  // ---- Layout
  const lay = async (breite, offen) => { const m = await neu(breite); await m.fill('#flaeche', '100'); await m.fill('#dicke', '20'); if (offen) await m.click('#diagramme-weitere-knopf'); return m.evaluate(() => { const cw = document.documentElement.clientWidth; const fs = [...document.querySelectorAll('figure.chart')].filter(f => f.getBoundingClientRect().width > 0); const spalten = new Set(fs.map(f => Math.round(f.getBoundingClientRect().left))).size; return { anzahl: fs.length, spalten, seite: document.documentElement.scrollWidth <= cw, innen: fs.every(f => { const r = f.getBoundingClientRect(); return r.left >= -1 && r.right <= cw + 1; }), ueberlauf: [...document.querySelectorAll('.chart-row')].filter(r => r.getBoundingClientRect().width > 0 && r.scrollWidth > r.clientWidth + 1).length, abgeschnitten: [...document.querySelectorAll('.chart-value')].filter(v => v.getBoundingClientRect().width > 0 && v.scrollWidth > v.clientWidth + 1).length }; }); };
  const d = await lay(1280, true), t = await lay(820, true), h = await lay(375, true);
  check('Desktop 1280 px: Diagramme in vier Spalten (eine Reihe), nichts abgeschnitten oder überlaufend', d.anzahl === 5 && d.spalten === 4 && d.seite && d.innen && d.ueberlauf === 0 && d.abgeschnitten === 0, d);
  check('Tablet 820 px: eine Spalte, kein seitliches Scrollen', t.spalten === 1 && t.seite && t.innen && t.ueberlauf === 0, t);
  check('Handy 375 px: eine Spalte, kein seitliches Scrollen, nichts abgeschnitten', h.spalten === 1 && h.seite && h.innen && h.ueberlauf === 0 && h.abgeschnitten === 0, h);

  // ---- Druck: alle Diagramme (auch die verborgenen), ohne Schaltfläche
  const pd = await neu();
  await pd.fill('#flaeche', '100'); await pd.fill('#dicke', '20');
  await pd.emulateMedia({ media: 'print' });
  const druck = await pd.evaluate(() => ({ alle: [...document.querySelectorAll('figure.chart')].every(f => getComputedStyle(f).display !== 'none' && f.getBoundingClientRect().height > 0), knopf: getComputedStyle(document.getElementById('diagramme-weitere-knopf')).display, anzahl: document.querySelectorAll('figure.chart').length, titel: getComputedStyle(document.querySelector('#diagramme > h2')).display }));
  await pd.emulateMedia({ media: 'screen' });
  check('Druckansicht: alle fünf Diagramme (auch „CO₂ gesamt“) werden gedruckt, die Schaltfläche nicht, die Überschrift „Materialien im Vergleich“ bleibt', druck.alle && druck.anzahl === 5 && druck.knopf === 'none' && druck.titel !== 'none', druck);

  check('Keine Konsolenfehler oder -warnungen', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
