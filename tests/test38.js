/* MaterialMatch 2.0, Schritt 11: mobile Darstellung (320, 375, 390, 430 px; Touch-Bedienung)
   Aufruf:  node tests/test38.js */
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
  const neu = async breite => {
    const p = await b.newPage({ viewport: { width: breite, height: 800 }, hasTouch: true, isMobile: false });
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e)));
    await p.goto(URL); await p.waitForTimeout(250);
    await p.evaluate(() => {
      MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: 'holzfaserdaemmung' }); MM.auswahlOptionen.zeigeDrittes(true);
      for (const [id, v] of [['flaeche', '100'], ['dicke', '20']]) { const f = document.getElementById(id); f.value = v; f.dispatchEvent(new Event('input', { bubbles: true })); }
      MM.diagramme.zeigeWeitere(true); document.querySelector('#ergebnisse > details').open = true; document.querySelectorAll('#ergebnisse details.sub').forEach(d => d.open = true);
    });
    return p;
  };
  // Messung für den gerade sichtbaren Reiter
  const messe = p => p.evaluate(() => {
    const cw = document.documentElement.clientWidth;
    const sicht = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const imScroll = e => { for (let n = e.parentElement; n; n = n.parentElement) { const o = getComputedStyle(n).overflowX; if ((o === 'auto' || o === 'scroll') && n.scrollWidth > n.clientWidth) return true; } return false; };
    const aktiv = '[role=tabpanel]:not([hidden]) ';
    const alle = [...document.querySelectorAll('header *, nav *, footer *, .modus-leiste *, ' + aktiv + '*')];
    const ueber = alle.filter(e => sicht(e) && !imScroll(e) && e.getBoundingClientRect().right > cw + 1).map(e => e.tagName + '.' + e.className);
    const zielSel = 'button, summary, select, input:not([type=hidden]):not([type=checkbox]), a.btn';
    const ziele = [...document.querySelectorAll(zielSel)].filter(e => sicht(e) && !e.classList.contains('info') && (e.closest('nav, header, footer, .modus-leiste') || e.closest(aktiv))).filter(e => e.getBoundingClientRect().height < 43.5).map(e => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().height));
    const klein = [...document.querySelectorAll('header *, nav *, footer *, .modus-leiste *, ' + aktiv + '*')].filter(e => sicht(e) && e.children.length === 0 && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 11.99).map(e => e.tagName + '.' + e.className + ' ' + getComputedStyle(e).fontSize);
    const abgeschnitten = [...document.querySelectorAll(aktiv + '.chart-value, ' + aktiv + '.chart-label, ' + aktiv + '.kw-wert, ' + aktiv + '.card-head h3')].filter(e => sicht(e) && e.scrollWidth > e.clientWidth + 1).map(e => e.className);
    return { seite: document.documentElement.scrollWidth - cw, ueber: ueber.slice(0, 4), ziele: ziele.slice(0, 5), klein: [...new Set(klein)].slice(0, 5), abgeschnitten };
  });

  for (const w of [320, 375, 390, 430]) {
    const p = await neu(w);
    const e = {};
    for (const t of ['vergleich', 'alternativen', 'quellen']) {
      await p.evaluate(t => MM.reiter.zeige(t), t);
      if (t === 'quellen') await p.evaluate(() => document.querySelectorAll('#quellen details').forEach(d => d.open = true));
      e[t] = await messe(p);
    }
    check(w + ' px: kein seitliches Scrollen der Seite in allen drei Reitern (auch mit drittem Material und allen Bereichen aufgeklappt)', Object.values(e).every(x => x.seite <= 0), Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v.seite])));
    check(w + ' px: nichts ragt über den rechten Rand hinaus (außer in eigenen scrollbaren Tabellen)', Object.values(e).every(x => x.ueber.length === 0), Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v.ueber])));
    check(w + ' px: alle Schaltflächen, Auswahlfelder, Eingabefelder und aufklappbaren Überschriften sind mindestens 44 px hoch', Object.values(e).every(x => x.ziele.length === 0), Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v.ziele])));
    check(w + ' px: keine Schrift kleiner als 12 px', Object.values(e).every(x => x.klein.length === 0), Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v.klein])));
    check(w + ' px: Namen, Werte und Überschriften werden nicht abgeschnitten', Object.values(e).every(x => x.abgeschnitten.length === 0), Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v.abgeschnitten])));
    const tabs = await p.$$eval('[role=tab]', t => t.map(x => { const r = x.getBoundingClientRect(); return [Math.round(r.height), Math.round(r.left), Math.round(r.right)]; }));
    check(w + ' px: die drei Reiter stehen nebeneinander in einer Zeile, gleich hoch, mindestens 44 px, innerhalb des Bildschirms', new Set(tabs.map(t => t[0])).size === 1 && tabs[0][0] >= 44 && tabs[0][0] <= 60 && tabs.every(t => t[1] >= 0 && t[2] <= w), tabs);
    await p.close();
  }

  // ---- Touch: Reiter, Info-Knopf, Optionen, Tabelle
  const p = await neu(390);
  await p.tap('#reiter-alternativen');
  check('Antippen eines Reiters wechselt den Bereich', await p.evaluate(() => MM.reiter.aktiv() === 'alternativen'));
  await p.tap('#reiter-vergleich');
  const info = await p.evaluate(() => { const i = [...document.querySelectorAll('#eingaben .info')][0]; i.scrollIntoView({ block: 'center' }); const r = i.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; const treffer = d => document.elementFromPoint(cx + d[0], cy + d[1]) === i; return { groesse: [Math.round(r.width), Math.round(r.height)], treffer: [[-18, 0], [18, 0], [0, -18], [0, 18]].every(treffer) }; });
  check('Info-Knöpfe: sichtbar mindestens 24 px, Tippfläche (mit Rand) mindestens 36 × 36 px', info.groesse[0] >= 24 && info.groesse[1] >= 24 && info.treffer, info);
  await p.tap('#eingaben .info');
  check('Antippen eines Info-Knopfs zeigt den Erklärtext (aria-expanded true)', await p.$eval('#eingaben .info', e => e.getAttribute('aria-expanded') === 'true'));
  await p.tap('#btn-produkt');
  check('Antippen von „Herstellerprodukt auswählen“ öffnet die Produktwahl; Optionsknöpfe sind auf dem Handy volle Breite', await p.$eval('#btn-produkt', e => e.getAttribute('aria-expanded') === 'true' && e.getBoundingClientRect().width > 300));
  const tab = await p.evaluate(() => { const w = document.querySelector('#ergebnis-menge .table-wrap'); return { scrollt: w.scrollWidth > w.clientWidth, fokus: w.getAttribute('tabindex'), seite: document.documentElement.scrollWidth <= document.documentElement.clientWidth, sticky: getComputedStyle(w.querySelector('tbody th')).position, hinweis: !!document.querySelector('#ergebnis-menge .scroll-hint') && getComputedStyle(document.querySelector('#ergebnis-menge .scroll-hint')).display !== 'none' }; });
  check('Technische Tabellen: scrollen im eigenen Rahmen (per Tastatur erreichbar), erste Spalte bleibt stehen, Hinweis „seitlich wischen“ sichtbar', tab.scrollt && tab.fokus === '0' && tab.seite && tab.sticky === 'sticky' && tab.hinweis, tab);
  const spalte = await p.evaluate(() => { const w = document.querySelector('#ergebnis-menge .table-wrap'); const th = w.querySelector('tbody th'); return th.getBoundingClientRect().width; });
  check('Die feste erste Spalte (Kennwert) nimmt höchstens ein Drittel der Bildschirmbreite ein, damit Zahlen sichtbar bleiben', spalte <= 390 / 3, spalte);
  const iph = await p.evaluate(() => [...document.querySelectorAll('#flaeche, #dicke, #kategorie, #prioritaet')].filter(e => e.getBoundingClientRect().width > 0).map(e => parseFloat(getComputedStyle(e).fontSize)));
  check('Eingabefelder haben mindestens 16 px Schrift (iPhone zoomt sonst beim Antippen in die Seite)', iph.length >= 3 && iph.every(x => x >= 16), iph);

  // ---- Diagramme: Handy-Anordnung
  const dia = await p.evaluate(() => { const fs = [...document.querySelectorAll('figure.chart')].filter(f => f.getBoundingClientRect().width > 0); return { spalten: new Set(fs.map(f => Math.round(f.getBoundingClientRect().left))).size, label: [...document.querySelectorAll('.chart-row .chart-label')].filter(l => l.getBoundingClientRect().width > 0).every(l => l.getBoundingClientRect().width > 200) }; });
  check('Diagramme: eine Spalte, Materialname steht über dem Balken (volle Breite)', dia.spalten === 1 && dia.label, dia);

  // ---- Querformat Handy
  const q = await b.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true }); await q.goto(URL); await q.waitForTimeout(250);
  check('Handy quer (844 × 390): kein seitliches Scrollen, Reiter erreichbar', await q.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth && document.getElementById('reiter-quellen').getBoundingClientRect().right <= document.documentElement.clientWidth));

  check('Keine Konsolenfehler oder -warnungen', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
