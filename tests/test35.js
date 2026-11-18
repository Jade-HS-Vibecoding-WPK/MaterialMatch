/* MaterialMatch 2.0, Schritt 8: Alternative Baustoffe entdecken (kompakte Empfehlungskarten)
   Aufruf:  node tests/test35.js */
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
  const neu = async (breite = 1280, a = 'mineralwolle') => { const p = await b.newPage({ viewport: { width: breite, height: 900 } }); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); await p.goto(URL); await p.waitForTimeout(250); if (a) await p.evaluate(a => MM.auswahl.setzeAuswahl({ a, b: '', c: '' }), a); await p.click('#reiter-alternativen'); return p; };
  const karten = p => p.$$eval('#alternativen-inhalt article.rec-card', cs => cs.map(c => ({ id: c.dataset.material, rang: c.dataset.rang, name: c.querySelector('h3').textContent, badge: c.querySelector('.reliability-badge') && c.querySelector('.reliability-badge').textContent, vorteil: !!c.querySelector('.rec-point'), punkte: [...c.querySelectorAll('.rec-point .label')].map(x => x.textContent), kurz: c.querySelector(':scope > .rec-text') && c.querySelector(':scope > .rec-text').textContent, knopf: c.querySelector(':scope > button') && c.querySelector(':scope > button').textContent, mehr: c.querySelector('details.card-mehr') ? c.querySelector('details.card-mehr').open : null, summary: c.querySelector('details.card-mehr > summary') && c.querySelector('details.card-mehr > summary').textContent })));

  let p = await neu(1280, '');
  check('Überschrift „Alternative Baustoffe entdecken“ (h2) und die kurze Erklärung; der Bereich ist kein aufklappbarer Block mehr', await p.evaluate(() => { const s = document.getElementById('alternativen'); return s.tagName === 'SECTION' && s.querySelector('h2').textContent === 'Alternative Baustoffe entdecken' && s.querySelector('.bereich-intro').textContent === 'MaterialMatch schlägt geeignete Alternativen anhand Ihrer Auswahl und Prioritäten vor.' && !s.querySelector(':scope > details') && document.getElementById('bereich-alternativen').contains(s); }));
  check('Ohne Material: kurzer Hinweis, keine Karten', /Wählen Sie ein Material/.test(await p.$eval('#alternativen-inhalt', e => e.textContent)) && (await karten(p)).length === 0);

  // ---- Karten
  await p.click('#reiter-vergleich');
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: '', c: '' }));
  await p.click('#reiter-alternativen');
  const k = await karten(p);
  const erw = await p.evaluate(() => MM.empfehlung.empfehle(MATERIALMATCH_DATA, 'mineralwolle', null, 'ausgewogen', MM.auswahl.holeAuswahl().plaetze[0].material).empfehlungen.map(e => e.material.id));
  check('Höchstens drei Karten, in der Reihenfolge der unveränderten Empfehlungslogik (js/empfehlung.js)', k.length === 3 && JSON.stringify(k.map(x => x.id)) === JSON.stringify(erw), [k.map(x => x.id), erw]);
  check('Standardansicht jeder Karte: Name, Datenqualitäts-Marke, „Wichtigster Vorteil“, „Möglicher Nachteil“, Kurzurteil, Knopf „Alternative vergleichen“', k.every(x => x.name && x.badge && x.punkte.join() === 'Wichtigster Vorteil,Möglicher Nachteil' && /^Insgesamt/.test(x.kurz || '') && x.knopf === 'Alternative vergleichen'), k);
  check('Der Bereich „Warum wird dieses Material empfohlen?“ ist standardmäßig geschlossen', k.every(x => x.mehr === false && x.summary === 'Warum wird dieses Material empfohlen?'));
  check('Unsicherheit ist gekennzeichnet: Beispieldaten im Demo-Modus ergeben die Marke „Nicht belastbar“ (Tooltip mit der Begründung)', k.some(x => x.badge === 'Nicht belastbar') && (await p.$$eval('.reliability-badge', b => b.every(x => x.getAttribute('title').length > 10))));
  check('Warnungen zur Eignung (z. B. Brandverhalten, Euroklasse ≠ Feuerwiderstand) bleiben auf der Karte sichtbar', await p.$$eval('#alternativen-inhalt .rec-card .rec-hinweise', h => h.length > 0 && h.some(x => /Brandverhalten/.test(x.textContent) && /nicht der Feuerwiderstand/.test(x.textContent))));

  // ---- Aufgeklappt
  await p.click('#alternativen-inhalt .rec-card summary');
  const inhalt = await p.$eval('#alternativen-inhalt .rec-card details.card-mehr', d => ({ h4: [...d.querySelectorAll('h4')].map(x => x.textContent), links: [...d.querySelectorAll('a')].map(a => [a.getAttribute('href'), a.getAttribute('target'), a.getAttribute('rel')]), kennwerte: d.querySelectorAll('dl.card-facts dt').length, gesamt: !!d.querySelector('.rec-total'), qual: !!d.querySelector('.reliability') }));
  check('Aufgeklappt stehen dort: Technische Eignung, Relevante Kennwerte, Vergleich mit dem Ausgangsmaterial, Bewertungsmethode, Datenqualität, Quellen', JSON.stringify(inhalt.h4) === JSON.stringify(['Technische Eignung', 'Relevante Kennwerte', 'Vergleich mit dem Ausgangsmaterial', 'Bewertungsmethode', 'Datenqualität', 'Quellen']) && inhalt.kennwerte >= 3 && inhalt.gesamt && inhalt.qual, inhalt);
  check('Quellenlinks sind https-Links in neuem Tab mit noopener', inhalt.links.length > 0 && inhalt.links.every(l => /^https:\/\//.test(l[0]) && l[1] === '_blank' && /noopener/.test(l[2])), inhalt.links);
  check('Die Erklärung „So wird bewertet“ und „Geprüft, aber nicht empfohlen“ bleiben unter den Karten erhalten (geschlossen)', JSON.stringify(await p.$$eval('#alternativen-inhalt > details.sub > summary', s => s.map(x => x.textContent.replace(/\s+/g, ' ')))) === JSON.stringify(['Geprüft, aber nicht empfohlen (10)', 'So wird bewertet']) && await p.$$eval('#alternativen-inhalt > details.sub', d => d.every(x => !x.open)));
  check('Die Hinweise zur Regelbasierung (keine Aussage zu Zulassungen, Gleichwertigkeit, Normkonformität) stehen weiter am Ende', /keine Aussage zu bauaufsichtlichen Zulassungen, technischer Gleichwertigkeit oder Normkonformität/.test(await p.$eval('#alternativen-inhalt', e => e.textContent.replace(/\s+/g, ' '))));

  // ---- Priorität
  const kopf = await p.$eval('#alternativen-inhalt .rec-meta', e => e.textContent.replace(/\s+/g, ' ').trim());
  check('Kopfzeile nennt Ausgangsmaterial, Anwendungsbereich und „Priorität: Ausgewogener Vergleich“', /Ausgangsmaterial: Material A \(Mineralwolle/.test(kopf) && /Anwendungsbereich: Wärmedämmung/.test(kopf) && /Priorität: Ausgewogener Vergleich/.test(kopf), kopf);
  check('Es gibt im Reiter „Alternativen“ kein zweites Auswahlfeld für die Priorität (keine widersprüchlichen Zustände)', await p.$$eval('#bereich-alternativen select', s => s.length) === 0 && await p.$$eval('#prioritaet', s => s.length) === 1);
  await p.click('#reiter-vergleich');
  await p.selectOption('#prioritaet', 'co2');
  await p.click('#reiter-alternativen');
  check('Wird die Priorität im Reiter „Vergleich“ geändert, zeigt die Kopfzeile sie sofort („Priorität: Geringe CO₂-Emissionen“)', /Priorität: Geringe CO₂-Emissionen/.test(await p.$eval('#alternativen-inhalt .rec-meta', e => e.textContent)));
  await p.click('#alternativen-inhalt .rec-meta .btn-link');
  check('„ändern“ wechselt in den Reiter „Vergleich“ und setzt den Fokus auf das Prioritätsfeld', await p.evaluate(() => MM.reiter.aktiv() === 'vergleich' && document.activeElement.id === 'prioritaet'));
  await p.selectOption('#prioritaet', 'ausgewogen');

  // ---- Alternative vergleichen
  await p.click('#reiter-alternativen');
  const erste = (await karten(p))[0].id;
  await p.click('#alternativen-inhalt .rec-card button[data-aktion=vergleichen]');
  const nach = await p.evaluate(() => ({ plaetze: MM.auswahl.holeAuswahl().plaetze.map(x => x.buchstabe + ':' + x.material.id), reiter: MM.reiter.aktiv() }));
  check('„Alternative vergleichen“ übernimmt die erste Alternative als Material B und wechselt in den Reiter „Vergleich“ (Material A bleibt)', nach.plaetze.join() === 'A:mineralwolle,B:' + erste && nach.reiter === 'vergleich', nach);
  await p.click('#reiter-alternativen');
  check('Zurück bei den Alternativen: Bestätigung „… wurde als Material B in den Vergleich übernommen. Der Vergleich ist aktualisiert.“ (ohne den veralteten Verweis auf „oben“)', /wurde als Material B in den Vergleich übernommen\. Der Vergleich ist aktualisiert\./.test(await p.$eval('#alternativen-inhalt .rec-confirm', e => e.textContent)));
  const bereits = await p.$$eval('#alternativen-inhalt .rec-card > button', b => b.map(x => [x.textContent, x.disabled]));
  check('Die schon gewählte Alternative zeigt „Bereits im Vergleich“ (Knopf gesperrt)', bereits.some(x => x[0] === 'Bereits im Vergleich' && x[1] === true), bereits);

  // ---- Tastatur
  const t = await neu(1280, 'mineralwolle');
  await t.focus('#alternativen-inhalt .rec-card summary'); await t.keyboard.press('Enter');
  check('Der Bereich „Warum wird dieses Material empfohlen?“ ist per Tastatur bedienbar (Enter öffnet)', await t.$eval('#alternativen-inhalt .rec-card details.card-mehr', d => d.open));

  // ---- Layout
  const lay = async breite => { const m = await neu(breite, 'mineralwolle'); return m.evaluate(() => { const cw = document.documentElement.clientWidth; const ks = [...document.querySelectorAll('#alternativen-inhalt .rec-card')].map(c => c.getBoundingClientRect()); return { n: ks.length, spalten: new Set(ks.map(k => Math.round(k.left))).size, seite: document.documentElement.scrollWidth <= cw, innen: ks.every(k => k.left >= -1 && k.right <= cw + 1), ueberlauf: [...document.querySelectorAll('#alternativen-inhalt .rec-card')].filter(c => c.scrollWidth > c.clientWidth + 1).length, hoehe: Math.round(ks[0].height) }; }); };
  const d = await lay(1280), h = await lay(375);
  check('Desktop: drei Karten nebeneinander, nichts läuft über; die geschlossene Karte ist kompakt (unter 600 px hoch; die frühere Karte war mehr als doppelt so hoch)', d.n === 3 && d.spalten === 3 && d.seite && d.innen && d.ueberlauf === 0 && d.hoehe < 600, d);
  check('Handy 375 px: Karten untereinander, kein seitliches Scrollen, nichts abgeschnitten', h.n === 3 && h.spalten === 1 && h.seite && h.innen && h.ueberlauf === 0, h);

  // ---- Druck
  const pd = await neu(1280, 'mineralwolle');
  await pd.emulateMedia({ media: 'print' });
  const druck = await pd.evaluate(() => ({ bereich: getComputedStyle(document.getElementById('alternativen')).display, aendern: getComputedStyle(document.querySelector('.rec-meta .btn-link')).display, knoepfe: [...document.querySelectorAll('#alternativen-inhalt .rec-card > button')].every(b => getComputedStyle(b).display === 'none') }));
  await pd.emulateMedia({ media: 'screen' });
  check('Druckansicht: der Alternativen-Bereich wird gedruckt (auch im verborgenen Reiter), Knöpfe nicht', druck.bereich !== 'none' && druck.aendern === 'none' && druck.knoepfe, druck);

  check('Keine Konsolenfehler oder -warnungen', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
