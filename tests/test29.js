/* MaterialMatch 2.0, Schritt 2: Hauptreiter (Vergleich, Alternativen, Quellen & Details)
   Aufruf:  node tests/test29.js */
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
  const neu = async (breite = 1280, url = URL) => { const p = await b.newPage({ viewport: { width: breite, height: 900 } }); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); await p.goto(url); await p.waitForTimeout(250); return p; };
  const zustand = p => p.evaluate(() => ({
    aktiv: MM.reiter.aktiv(),
    tabs: [...document.querySelectorAll('[role=tab]')].map(t => [t.id, t.getAttribute('aria-selected'), t.tabIndex, t.getAttribute('aria-controls')]),
    sichtbar: [...document.querySelectorAll('[role=tabpanel]')].map(x => [x.id, !x.hidden, x.getAttribute('aria-labelledby')])
  }));

  let p = await neu();
  const z0 = await zustand(p);
  check('Genau fünf Reiter in einer Reiterleiste (tablist), Namen: Entdecken, Vergleich, Match finden (Hauptbereiche), Alternativen, Quellen & Details (weitere Bereiche)', JSON.stringify(await p.$$eval('[role=tablist] [role=tab]', t => t.map(x => x.textContent.trim()))) === JSON.stringify(['Entdecken', 'Vergleich', 'Match finden', 'Alternativen', 'Quellen & Details']) && (await p.$$eval('[role=tablist]', l => l.length)) === 1);
  check('Start: Reiter „Vergleich“ aktiv (aria-selected, tabindex 0), die anderen tabindex −1; nur sein Bereich sichtbar', z0.aktiv === 'vergleich' && JSON.stringify(z0.tabs.map(t => [t[1], t[2]])) === '[["false",-1],["true",0],["false",-1],["false",-1],["false",-1]]' && JSON.stringify(z0.sichtbar.map(x => x[1])) === '[false,true,false,false,false]', z0);
  check('ARIA: jeder Reiter verweist auf seinen Bereich (aria-controls), jeder Bereich auf seinen Reiter (aria-labelledby)', z0.tabs.every((t, i) => t[3] === z0.sichtbar[i][0]) && z0.sichtbar.every((x, i) => x[2] === z0.tabs[i][0]));
  check('Die Reiterleiste steht direkt unter dem Kopf und der Datenmodus-Leiste, vor dem Inhalt', await p.evaluate(() => { const n = document.querySelector('.tabs-leiste'); return n.previousElementSibling && n.nextElementSibling.tagName === 'MAIN' && n.getBoundingClientRect().top > document.querySelector('.site-header').getBoundingClientRect().top; }));
  check('Zuordnung: Auswahl, Eingaben, Ergebnisse, Diagramme im Reiter 1; Alternativen im Reiter 2; Quellen im Reiter 3', await p.evaluate(() => ['auswahl', 'eingaben', 'ergebnisse', 'diagramme'].every(i => document.getElementById('bereich-vergleich').contains(document.getElementById(i))) && document.getElementById('bereich-alternativen').contains(document.getElementById('alternativen')) && document.getElementById('bereich-quellen').contains(document.getElementById('quellen'))));
  check('Keine doppelten IDs auf der Seite', await p.evaluate(() => { const ids = [...document.querySelectorAll('[id]')].map(e => e.id); return ids.length === new Set(ids).size; }));

  // ---- Eingaben und Auswahl vor dem Wechsel
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: '' }));
  await p.fill('#flaeche', '100'); await p.fill('#dicke', '20');
  await p.selectOption('#prioritaet', { index: 1 });
  const vorher = await p.evaluate(() => ({ flaeche: document.getElementById('flaeche').value, dicke: document.getElementById('dicke').value, einheit: document.getElementById('dickeEinheit').value, prio: document.getElementById('prioritaet').value, auswahl: MM.auswahl.holeAuswahl().plaetze.map(x => x.material.id), kosten: document.getElementById('rechnung-kosten').innerHTML, diagramme: document.getElementById('diagramme-inhalt').innerHTML }));

  // ---- Wechsel per Klick
  await p.click('#reiter-alternativen');
  const z1 = await zustand(p);
  check('Klick auf „Alternativen“: Reiter aktiv, nur dieser Bereich sichtbar, Adresse #alternativen', z1.aktiv === 'alternativen' && JSON.stringify(z1.sichtbar.map(x => x[1])) === '[false,false,false,true,false]' && await p.evaluate(() => location.hash) === '#alternativen', z1);
  check('Im Reiter „Alternativen“ stehen die drei Empfehlungskarten (Empfehlungslogik wird weiter ausgeführt)', await p.$$eval('#alternativen-inhalt .rec-card', c => c.length) === 3);
  await p.click('#reiter-quellen');
  check('Klick auf „Quellen & Details“: nur dieser Bereich sichtbar; der Quellenbereich ist gefüllt', (await zustand(p)).aktiv === 'quellen' && await p.$eval('#quellen-auswahl', e => e.innerText.length > 200));
  await p.click('#reiter-vergleich');
  const nachher = await p.evaluate(() => ({ flaeche: document.getElementById('flaeche').value, dicke: document.getElementById('dicke').value, einheit: document.getElementById('dickeEinheit').value, prio: document.getElementById('prioritaet').value, auswahl: MM.auswahl.holeAuswahl().plaetze.map(x => x.material.id), kosten: document.getElementById('rechnung-kosten').innerHTML, diagramme: document.getElementById('diagramme-inhalt').innerHTML }));
  check('Nach dem Wechsel dort und zurück: Fläche, Dicke, Einheit, Priorität, Materialauswahl, Kostenrechnung und Diagramme unverändert (nichts geht verloren, nichts wird neu geladen)', JSON.stringify(vorher) === JSON.stringify(nachher));

  // ---- Verborgene Bereiche werden weiter aktualisiert
  await p.click('#reiter-alternativen');
  await p.evaluate(() => { const f = document.getElementById('flaeche'); f.value = '50'; f.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.click('#reiter-vergleich');
  check('Eine Eingabe, die geändert wird, während ein anderer Reiter offen ist, wirkt auf die Berechnung im Vergleichsreiter (5 m³ bei 50 m² × 10 …)', await p.$eval('#rechnung-kosten', e => /Rechenweg/.test(e.textContent)) && await p.evaluate(() => MM.eingaben.hole().flaeche_m2 === 50));

  // ---- Tastatur
  await p.focus('#reiter-vergleich');
  await p.keyboard.press('ArrowRight');
  const t1 = await p.evaluate(() => [MM.reiter.aktiv(), document.activeElement.id]);
  await p.keyboard.press('ArrowRight'); const t2 = await p.evaluate(() => [MM.reiter.aktiv(), document.activeElement.id]);
  await p.keyboard.press('ArrowRight'); const t3 = await p.evaluate(() => [MM.reiter.aktiv(), document.activeElement.id]);
  await p.keyboard.press('ArrowLeft'); const t4 = await p.evaluate(() => MM.reiter.aktiv());
  await p.keyboard.press('End'); const t5 = await p.evaluate(() => MM.reiter.aktiv());
  await p.keyboard.press('Home'); const t6 = await p.evaluate(() => MM.reiter.aktiv());
  check('Tastatur: Pfeil rechts/links wechselt und setzt den Fokus mit, nach dem letzten Reiter folgt der erste (Umlauf), Ende und Pos1 springen', JSON.stringify([t1, t2, t3]) === JSON.stringify([['match', 'reiter-match'], ['alternativen', 'reiter-alternativen'], ['quellen', 'reiter-quellen']]) && t4 === 'alternativen' && t5 === 'quellen' && t6 === 'entdecken', [t1, t2, t3, t4, t5, t6]);
  await p.focus('#reiter-vergleich'); await p.keyboard.press('Tab');
  check('Tabulator: von der Reiterleiste geht der Fokus zum Inhalt, nicht zu den anderen Reitern (nur der aktive Reiter hat einen Tabstopp)', await p.evaluate(() => !document.activeElement.matches('[role=tab]')));
  await p.focus('#reiter-alternativen'); await p.keyboard.press('ArrowLeft');
  check('Reiterwechsel per Tastatur zeigt einen sichtbaren Fokusrahmen (Umriss mindestens 2 px)', await p.evaluate(() => { const c = getComputedStyle(document.activeElement); return document.activeElement.matches('[role=tab]') && parseFloat(c.outlineWidth) >= 2 && c.outlineStyle !== 'none'; }));

  // ---- Direktlinks
  const q = await neu(1280, URL + '#quellen');
  check('Direktlink …#quellen öffnet den Reiter „Quellen & Details“', (await zustand(q)).aktiv === 'quellen');
  await q.evaluate(() => { location.hash = 'alternativen'; }); await q.waitForTimeout(100);
  check('Änderung der Adresse (#alternativen) wechselt den Reiter ohne Neuladen', (await zustand(q)).aktiv === 'alternativen');
  const falsch = await neu(1280, URL + '#gibtsnicht');
  check('Unbekannte Adresse #gibtsnicht: Reiter „Vergleich“', (await zustand(falsch)).aktiv === 'vergleich');

  // ---- „Alternative vergleichen“ führt zum Vergleich zurück
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: '', c: '' }));
  await p.click('#reiter-alternativen');
  await p.click('#alternativen-inhalt .rec-card button[data-aktion=vergleichen]');
  check('„Alternative vergleichen“: Material wird als B übernommen und die Seite wechselt in den Reiter „Vergleich“', await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.length === 2 && MM.reiter.aktiv() === 'vergleich' && !document.getElementById('bereich-vergleich').hidden));

  // ---- Druck: alle Bereiche
  await p.click('#reiter-quellen');
  await p.emulateMedia({ media: 'print' });
  const druck = await p.evaluate(() => ({
    sichtbar: [...document.querySelectorAll('[role=tabpanel]')].map(x => getComputedStyle(x).display !== 'none'),
    leiste: getComputedStyle(document.querySelector('.tabs-leiste')).display
  }));
  await p.emulateMedia({ media: 'screen' });
  check('Druckansicht: Vergleich, Alternativen und Quellen sichtbar (auch die verborgenen), Entdecken und Match (Bildschirmfunktionen) und die Reiterleiste ausgeblendet', JSON.stringify(druck.sichtbar) === '[false,true,false,true,true]' && druck.leiste === 'none', druck);

  // ---- Handy
  const m = await neu(375);
  const hm = await m.evaluate(() => { const t = [...document.querySelectorAll('[role=tab]')].map(x => x.getBoundingClientRect()); return { alleSichtbar: t.every(r => r.left >= 0 && r.right <= document.documentElement.clientWidth), hoehe: Math.min(...t.map(r => r.height)), seite: document.documentElement.scrollWidth <= document.documentElement.clientWidth }; });
  check('Handy 375 px: alle vier Reiter passen in die Breite, sind mindestens 40 px hoch, kein seitliches Scrollen', hm.alleSichtbar && hm.hoehe >= 40 && hm.seite, hm);
  await m.click('#reiter-quellen');
  check('Handy: Reiterwechsel per Antippen funktioniert', (await zustand(m)).aktiv === 'quellen');

  check('Keine Konsolenfehler oder -warnungen', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
