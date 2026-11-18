/* MaterialMatch 2.0, Schritt 3: kompakter Kopf, schlanke Materialauswahl, kompakte Materialkarten
   Aufruf:  node tests/test30.js */
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
  const neu = async (breite = 1280) => { const p = await b.newPage({ viewport: { width: breite, height: 900 } }); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); await p.goto(URL); await p.waitForTimeout(250); return p; };
  const sicht = (p, sel) => p.isVisible(sel);

  let p = await neu();
  // ---- Kopf
  const kopf = await p.$eval('.site-header', h => ({ h1: h.querySelector('h1').textContent, tag: h.querySelector('.tagline').textContent, untertitel: h.querySelector('.untertitel').textContent, knoepfe: [...h.querySelectorAll('.kopf-knopf')].map(k => k.textContent.trim()).join('|'), absaetze: h.querySelectorAll('p').length, intro: !!h.querySelector('.intro'), anleitung: !!h.querySelector('.quickstart'), hoehe: h.getBoundingClientRect().height }));
  check('Kopfbereich (MaterialMatch 3.0): „MaterialMatch“, Leitsatz „Der richtige Baustoff. Für deine Idee.“, Untertitel und die drei Hauptaktionen Entdecken, Vergleichen, Match (kein Einführungstext, keine Kurzanleitung)', kopf.h1 === 'MaterialMatch' && kopf.tag === 'Der richtige Baustoff. Für deine Idee.' && kopf.untertitel === 'Vergleiche Materialien, entdecke nachhaltige Alternativen und finde dein persönliches Match.' && kopf.absaetze === 2 && kopf.knoepfe === 'Baustoffe entdecken|Baustoffe vergleichen|Match finden' && !kopf.intro && !kopf.anleitung, kopf);
  check('Der Kopf bleibt niedrig (unter 190 px am Desktop, trotz Leitsatz, Untertitel und Aktionen)', kopf.hoehe < 190, kopf.hoehe);
  const ueber = await p.$eval('#quellen #ueber', d => ({ text: d.innerText, li: d.querySelectorAll('.quickstart li').length, offen: d.open }));
  check('Einleitung und Kurzanleitung stehen jetzt unter „Quellen & Details“ (mit dem Hinweis, dass keine Nachweise ersetzt werden)', /ersetzt keine\s+bauphysikalischen Nachweise/.test(ueber.text.replace(/\s+/g, ' ')) && ueber.li === 3, ueber);
  check('Fußzeile nennt kurz: Orientierungshilfe, kein Nachweis', /Orientierungshilfe für frühe Entwurfsentscheidungen, kein Nachweis/.test(await p.$eval('.site-footer', f => f.innerText)));

  // ---- Standardansicht der Auswahl
  check('Standardansicht: Baustoffkategorie, Material A und Material B sind sichtbar', await sicht(p, '#kategorie') && await sicht(p, '#materialA') && await sicht(p, '#materialB'));
  check('Standardansicht: Material C, Produktfelder und das Formular für eigene Produkte sind ausgeblendet', !(await sicht(p, '#materialC')) && !(await sicht(p, '#produktA')) && !(await sicht(p, '#produktB')) && !(await sicht(p, '#eigenes-produkt-box')));
  check('Drei Schaltflächen: „+ Drittes Material hinzufügen“, „Herstellerprodukt auswählen“, „Eigenes Produkt hinzufügen“ (aria-expanded false)', JSON.stringify(await p.$$eval('.auswahl-optionen button', bs => bs.map(x => [x.textContent.trim(), x.getAttribute('aria-expanded')]))) === JSON.stringify([['+ Drittes Material hinzufügen', 'false'], ['Herstellerprodukt auswählen', 'false'], ['Eigenes Produkt hinzufügen', 'false']]));
  check('Alle bisherigen IDs der Auswahl sind erhalten (auch die ausgeblendeten)', await p.evaluate(() => ['kategorie', 'materialA', 'materialB', 'materialC', 'produktA', 'produktB', 'produktC', 'eigenes-produkt', 'eigenes-produkt-box', 'auswahl-karten'].every(i => document.getElementById(i))));

  // ---- Optionen einblenden
  await p.click('#btn-drittes');
  check('„+ Drittes Material hinzufügen“ blendet Material C ein (Schaltfläche zeigt „– Drittes Material entfernen“, aria-expanded true)', await sicht(p, '#materialC') && (await p.textContent('#btn-drittes')) === '– Drittes Material entfernen' && (await p.getAttribute('#btn-drittes', 'aria-expanded')) === 'true');
  await p.click('#btn-produkt');
  check('„Herstellerprodukt auswählen“ blendet die Produktfelder zu A und B ein (Hinweis zum generischen Datensatz erscheint)', await sicht(p, '#produktA') && await sicht(p, '#produktB') && await sicht(p, '#produkt-hinweis') && (await p.getAttribute('#btn-produkt', 'aria-expanded')) === 'true');
  await p.click('#btn-eigen');
  check('„Eigenes Produkt hinzufügen“ blendet das Formular ein', await sicht(p, '#eigenes-produkt-box') && (await p.getAttribute('#btn-eigen', 'aria-expanded')) === 'true');
  await p.click('#btn-eigen');
  check('Ein zweiter Klick blendet das Formular wieder aus', !(await sicht(p, '#eigenes-produkt-box')));

  // ---- Auswahl funktioniert wie vorher
  await p.selectOption('#kategorie', 'daemmstoff');
  await p.selectOption('#materialA', 'mineralwolle'); await p.selectOption('#materialB', 'eps'); await p.selectOption('#materialC', 'steinwolle');
  check('Auswahl von A, B und C funktioniert (drei Karten)', await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.map(x => x.buchstabe).join('')) === 'ABC' && await p.$$eval('#auswahl-karten article', k => k.length) === 3);
  await p.selectOption('#produktA', 'rockwool-fixrock-033');
  check('Produktwahl funktioniert (Fixrock 033 für A)', await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze[0].produkt.id) === 'rockwool-fixrock-033');
  await p.click('#btn-produkt');
  check('Ausgeblendete Produktfelder behalten ihre Wahl (Fixrock 033 bleibt gewählt, die Karte zeigt es)', await p.inputValue('#produktA') === 'rockwool-fixrock-033' && /ROCKWOOL Fixrock 033/.test(await p.$eval('#auswahl-karten article', a => a.querySelector('.card-sub').textContent)));
  await p.click('#btn-drittes');
  check('„– Drittes Material entfernen“ leert Material C wirklich (kein verstecktes Material) und blendet das Feld aus', await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.map(x => x.buchstabe).join('')) === 'AB' && !(await sicht(p, '#materialC')) && (await p.textContent('#btn-drittes')) === '+ Drittes Material hinzufügen');

  await p.click('#btn-drittes');
  check('Ist das Feld bedienbar (Kategorie gewählt), wandert der Fokus beim Einblenden ins Feld Material C', await p.evaluate(() => document.activeElement.id) === 'materialC');

  // ---- Automatisches Einblenden
  const q = await neu();
  await q.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: 'steinwolle', pa: 'rockwool-fixrock-033' }));
  check('Wird von außen (z. B. „Alternative vergleichen“) ein drittes Material oder ein anderes Produkt gewählt, erscheinen die Felder automatisch', await sicht(q, '#materialC') && await sicht(q, '#produktA'));

  // ---- Karten
  const k = await p.$$eval('#auswahl-karten article', a => a.map(x => ({ h3: x.querySelector('h3').textContent, sub: x.querySelector('.card-sub').textContent, badge: x.querySelector('.datenbadge') ? x.querySelector('.datenbadge').textContent : null, titel: x.querySelector('.datenbadge') ? x.querySelector('.datenbadge').title : '', mehr: x.querySelector('details.card-mehr') ? x.querySelector('details.card-mehr').open : null, sichtbarerText: x.innerText.length, ersterAbsatz: x.querySelectorAll(':scope > p').length })));
  check('Karten: Materialname, eine Zeile mit Kategorie (und Produktname), kleine Datenqualitäts-Marke mit Tooltip, Details eingeklappt', k.length === 2 && k.every(x => x.h3 && /Dämmstoffe/.test(x.sub) && x.badge && /Datenart:/.test(x.titel) && x.mehr === false), k);
  check('Karte mit Produkt nennt den Produktnamen in der Zeile unter dem Namen, Karte ohne Produkt nur die Kategorie', /ROCKWOOL Fixrock 033/.test(k[0].sub) && /BACHL EPS 035 WDV/.test(k[1].sub));
  check('Demo-Modus: Beispieldaten werden an der Marke deutlich gekennzeichnet („Beispieldaten“, gelb)', k.every(x => x.badge === 'Beispieldaten') && await p.$eval('#auswahl-karten .datenbadge', e => e.classList.contains('art-beispiel')));
  await p.click('#auswahl-karten article summary');
  check('„Details“ klappt Einsatz, Datenart, Produkt, Hersteller, Quelle, Vorteile und Nachteile auf', await p.$eval('#auswahl-karten article details', d => d.open && /einsatz/i.test(d.innerText) && /hersteller/i.test(d.innerText) && /vorteile/i.test(d.innerText) && /nachteile/i.test(d.innerText)));
  const echt = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await echt.goto('file://' + PROJ + '/index.html?modus=echt'); await echt.waitForTimeout(250);
  await echt.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: '' }));
  check('Echtdaten-Modus: Marke zeigt „Richtwerte“ (keine Beispieldaten)', (await echt.$$eval('#auswahl-karten .datenbadge', e => e.map(x => x.textContent))).every(t => t === 'Richtwerte'));

  // ---- Anordnung
  const lay = async (breite) => { const m = await neu(breite); await m.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: '' })); return m.evaluate(() => { const r = id => document.getElementById(id).getBoundingClientRect(); const cw = document.documentElement.clientWidth; const kk = [...document.querySelectorAll('#auswahl-karten article')].map(a => a.getBoundingClientRect()); return { aTop: r('materialA').top, bTop: r('materialB').top, aLeft: r('materialA').left, bLeft: r('materialB').left, kartenNebeneinander: Math.abs(kk[0].top - kk[1].top) < 5, seite: document.documentElement.scrollWidth <= cw, aussen: [...document.querySelectorAll('#auswahl select, #auswahl button')].filter(e => { const q = e.getBoundingClientRect(); return q.width > 0 && (q.left < -1 || q.right > cw + 1); }).length }; }); };
  const d = await lay(1280), h = await lay(375);
  check('Desktop: Material A und B stehen nebeneinander, die Karten ebenfalls', Math.abs(d.aTop - d.bTop) < 3 && d.bLeft > d.aLeft && d.kartenNebeneinander && d.seite && d.aussen === 0, d);
  check('Handy 375 px: Material A und B untereinander, Karten untereinander, nichts läuft über den Rand', d && h.bTop > h.aTop + 20 && !h.kartenNebeneinander && h.seite && h.aussen === 0, h);

  check('Keine Konsolenfehler oder -warnungen', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
