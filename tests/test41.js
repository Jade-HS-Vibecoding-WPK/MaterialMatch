/* MaterialMatch 2.0, Schritt 14: abschließende Überprüfung (Hierarchie, Textmenge, Doppelungen, Pflichttexte, Handy)
   Aufruf:  node tests/test41.js */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 500))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html';
const PFLICHT = 'Die Farben zeigen eine relative Bewertung der ausgewählten Materialien und stellen keine allgemeingültige Aussage über deren Qualität dar.';

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async (modus = 'echt', breite = 1280) => {
    const p = await b.newPage({ viewport: { width: breite, height: 900 } });
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e)));
    await p.goto(URL + '?modus=' + modus); await p.waitForTimeout(250);
    await p.selectOption('#kategorie', 'daemmstoff'); await p.selectOption('#materialA', 'mineralwolle'); await p.selectOption('#materialB', 'eps');
    await p.fill('#flaeche', '100'); await p.fill('#dicke', '20');
    return p;
  };
  const woerter = (p) => p.evaluate(() => document.body.innerText.split(/\s+/).filter(Boolean).length);

  let p = await neu('echt');
  // ---- Hierarchie
  const h = await p.evaluate(() => {
    const ebenen = r => [...r.querySelectorAll('h1,h2,h3,h4')].filter(e => e.getBoundingClientRect().height > 0 || e.closest('details'))
      .map(e => +e.tagName[1]);
    const sprung = a => a.some((x, i) => i > 0 && x - a[i - 1] > 1);
    const alle = document.querySelectorAll('h1,h2,h3,h4');
    const reihenfolge = [...alle].map(e => +e.tagName[1]);
    return { h1: document.querySelectorAll('h1').length, sprung: sprung(reihenfolge), landmarks: ['header', 'nav', 'main', 'footer'].map(t => document.querySelectorAll(t).length), erstes: ['bereich-vergleich', 'bereich-alternativen', 'bereich-quellen'].map(i => { const r = document.getElementById(i); return r.querySelector('h1,h2,h3,h4,summary').tagName + ':' + (r.querySelector('summary h2, h2, summary') || {}).textContent.trim().slice(0, 30); }), ids: (() => { const x = [...document.querySelectorAll('[id]')].map(e => e.id); return x.length === new Set(x).size; })() };
  });
  check('Hierarchie: genau eine Seitenüberschrift h1, keine übersprungenen Überschriftenebenen (h1 → h2 → h3), jeder Reiter beginnt mit einer Überschrift der Ebene 2, keine doppelten IDs', h.h1 === 1 && !h.sprung && h.ids, h);
  check('Seitenstruktur: je ein header, nav, main und footer (Orientierung für Screenreader)', JSON.stringify(h.landmarks) === '[1,1,1,1]', h.landmarks);
  const h2 = await p.evaluate(() => ({ vergleich: [...document.querySelectorAll('#bereich-vergleich #bento > section > h2, #bereich-vergleich #bento > section > details > summary h2')].map(e => e.textContent.trim()), alt: [...document.querySelectorAll('#bereich-alternativen h2')].map(e => e.textContent.trim()), quellen: [...document.querySelectorAll('#bereich-quellen > section > h2')].map(e => e.textContent.trim()) }));
  check('Gliederung im Reiter „Vergleich“: Materialauswahl → Eingaben → Vergleich auf einen Blick → Materialien im Vergleich → Alle technischen Eigenschaften anzeigen', JSON.stringify(h2.vergleich) === JSON.stringify(['Materialauswahl', 'Eingaben', 'Vergleich auf einen Blick', 'Materialien im Vergleich', 'Alle technischen Eigenschaften anzeigen']) && h2.alt[0] === 'Alternative Baustoffe entdecken' && h2.quellen[0] === 'Quellen der ausgewählten Materialien', h2);

  // ---- Textmenge (sichtbarer Text) im Standardzustand, Schutz gegen erneutes Aufblähen
  const wv = await woerter(p);
  await p.click('#reiter-alternativen'); const wa = await woerter(p);
  await p.click('#reiter-quellen'); const wq = await woerter(p);
  await p.click('#reiter-vergleich');
  check('Textmenge im Standardzustand (Echtdaten, zwei Materialien, nur sichtbarer Text inkl. Kopf und Fuß): Vergleich ≤ 800 Wörter, Alternativen ≤ 400, Quellen ≤ 300 (vorher alles zusammen rund 2.900 Wörter auf einer Seite)', wv <= 800 && wa <= 400 && wq <= 300, [wv, wa, wq]);
  const hoehe = await p.evaluate(() => document.documentElement.scrollHeight);
  check('Seitenhöhe im Reiter „Vergleich“ (Desktop, Standardzustand) höchstens 3.700 px (Bento-Kacheln mit größeren Abständen; vor der Überarbeitung rund 11.000 px)', hoehe <= 3700, hoehe);

  // ---- Doppelungen: im sichtbaren Standardzustand steht kein längerer Satz wörtlich zweimal (Ausnahme: der Pflichtsatz zu den Farben)
  const dopp = async pg => pg.evaluate(() => {
    const m = {};
    document.querySelectorAll('[role=tabpanel]:not([hidden]) :is(p, li, dd, .note, .hint, .warn)').forEach(e => {
      if (!e.checkVisibility() || e.closest('table') || e.closest('.rec-card') || e.querySelector('p, li')) return;      // Karten dürfen dieselbe Aussage über verschiedene Materialien enthalten
      const t = e.textContent.replace(/\s+/g, ' ').trim(); if (t.length >= 45) m[t] = (m[t] || 0) + 1;
    });
    return Object.entries(m).filter(([, n]) => n > 1).map(([t, n]) => n + '× ' + t.slice(0, 80));
  });
  const d0 = await dopp(p);
  check('Keine wörtlichen Doppelungen längerer Sätze im sichtbaren Reiter „Vergleich“ (Echtdaten), außer dem Pflichtsatz zu den Farben', d0.filter(x => !x.includes('Die Farben zeigen eine relative Bewertung')).length === 0, d0);
  await p.click('#reiter-alternativen'); const d1 = await dopp(p); await p.click('#reiter-quellen'); const d2 = await dopp(p); await p.click('#reiter-vergleich');
  check('Keine wörtlichen Doppelungen längerer Sätze in den Reitern „Alternativen“ und „Quellen & Details“ (außerhalb der Empfehlungskarten, die je Material dieselbe Aussage tragen dürfen)', d1.length === 0 && d2.length === 0, [d1, d2]);
  const gw = await p.evaluate(() => document.querySelector('figure.chart[data-chart="gewicht"]').innerText.replace(/\s+/g, ' '));
  check('Gewichts-Diagramm (nicht bewertet): der Grund steht einmal („Nicht bewertet: Ein geringes Gewicht …“), der Untertitel wiederholt ihn nicht', (gw.match(/Es wird nur gefärbt/g) || []).length === 1 && !/Farbig bewertet wird nur/.test(gw) && /neutral dargestellt/.test(gw), gw.slice(0, 300));
  await p.selectOption('#prioritaet', 'gewicht');
  const gw2 = await p.evaluate(() => document.querySelector('figure.chart[data-chart="gewicht"]').innerText.replace(/\s+/g, ' '));
  check('Gewichts-Diagramm mit Priorität „Geringes Gewicht“: der Untertitel sagt, dass niedriger besser ist; kein Hinweis „nicht bewertet“', /Niedriger ist besser/.test(gw2) && !/Nicht bewertet: Ein geringes Gewicht/.test(gw2), gw2.slice(0, 300));
  await p.selectOption('#prioritaet', 'ausgewogen');

  // ---- Pflichttexte
  const pf = await p.evaluate(P => ({ dashboard: document.getElementById('dashboard').textContent.replace(/\s+/g, ' ').includes(P), diagramme: document.getElementById('diagramme').textContent.replace(/\s+/g, ' ').includes(P) }), PFLICHT);
  check('Pflichtsatz zur relativen Bewertung steht überall, wo Bewertungsfarben erscheinen (Kennwertübersicht und Diagramme)', pf.dashboard && pf.diagramme, pf);
  await p.click('#reiter-quellen'); await p.evaluate(() => document.querySelectorAll('#quellen details').forEach(d => d.open = true));
  const hin = await p.$eval('#quellen-hinweise', e => e.innerText.replace(/\s+/g, ' '));
  const fuss = await p.$eval('.site-footer', e => e.innerText.replace(/\s+/g, ' '));
  check('Pflichthinweise erhalten: keine Aussage zu Zulassungen, technischer Gleichwertigkeit oder Normkonformität; ersetzt keine Nachweise; Brandverhalten ≠ Feuerwiderstand; Fußzeile nennt „kein Nachweis“', /Zulassung/.test(hin) && /Gleichwertigkeit/.test(hin) && /Normkonformität/.test(hin) && /ersetz/.test(hin) && /Feuerwiderstand/.test(hin) && /kein Nachweis/.test(fuss), [hin.slice(0, 120), fuss.slice(0, 120)]);
  await p.click('#reiter-vergleich');
  // Orientierungshinweis und Datenwarnungen
  check('Datenwarnungen erhalten (Echtdaten): „Nur zur Orientierung …“ und fehlender Preis („kein belegter Preis“) sichtbar; Modusleiste „Datenmodus: Verifizierte Daten“', await p.evaluate(() => /Nur zur Orientierung/.test(document.getElementById('orientierung').textContent) && /kein belegter Preis/.test(document.getElementById('orientierung').textContent) && document.getElementById('modus-titel').textContent === 'Datenmodus: Verifizierte Daten'));
  await p.close();

  // ---- Demo-Modus: Beispieldaten klar erkennbar
  const dm = await neu('demo');
  const dem = await dm.evaluate(() => ({ titel: document.getElementById('modus-titel').textContent, bg: getComputedStyle(document.getElementById('modus-leiste')).backgroundColor, b: document.querySelectorAll('#dashboard .art-beispiel').length, hinweis: /Beispielwerte \(Demo\)/.test(document.getElementById('diagramme').textContent) }));
  check('Demo-Modus klar erkennbar: „Datenmodus: Demo“ auf gelbem Grund, B-Kennzeichen im Dashboard, Hinweis „Beispielwerte (Demo), keine Marktpreise“ im Diagramm', dem.titel === 'Datenmodus: Demo' && dem.bg === 'rgb(255, 244, 214)' && dem.b > 0 && dem.hinweis, dem);
  await dm.close();

  // ---- Handy: letzte Kontrolle
  for (const w of [375, 390, 430]) {
    const m = await neu('echt', w);
    const r = await m.evaluate(() => { const cw = document.documentElement.clientWidth; return { seite: document.documentElement.scrollWidth <= cw, auswahl: Math.round(document.getElementById('auswahl').getBoundingClientRect().top), tabs: [...document.querySelectorAll('[role=tab]')].every(t => { const r = t.getBoundingClientRect(); return r.left >= 0 && r.right <= cw && r.height >= 44; }) }; });
    let alle = r.seite;
    for (const t of ['alternativen', 'quellen', 'vergleich']) { await m.click('#reiter-' + t); alle = alle && await m.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth); }
    check(`Handy ${w} px: kein seitliches Scrollen in allen Reitern, Reiter ≥ 44 px, die Materialauswahl beginnt innerhalb der ersten 330 px (kein langer Kopf mehr)`, alle && r.tabs && r.auswahl <= 330, r);
    await m.close();
  }

  check('Keine Konsolenfehler oder -warnungen', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
