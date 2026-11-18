/* MaterialMatch 3.5 (18.11.2026): Reiter „Entdecken“ (Suche, Filter, Sortierung, Karten/Liste), drei Hauptaktionen,
   Navigation mit Haupt- und weiteren Bereichen, „Entfernen“ im Vergleich, gegliederter Steckbrief
   Aufruf:  node tests/test52.js */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');
const fs = require('fs');
const vm = require('vm');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 600))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html';
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(PROJ, 'data', 'baustoffe.js'), 'utf8'), ctx);
const DB = ctx.window.MATERIALMATCH_DATA;

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async (modus, hash, breite = 1280) => { const c = await b.newContext({ viewport: { width: breite, height: 900 } }); const p = await c.newPage(); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); await p.goto(URL + '?modus=' + modus + (hash || '')); await p.waitForTimeout(300); return p; };
  const namen = p => p.$$eval('#ent-liste .ent-name', e => e.map(x => x.textContent));
  const anzahl = p => p.$eval('#ent-anzahl', e => e.textContent);

  // ---------- 1. Start und Navigation ----------
  let p = await neu('echt');
  check('Start: Reiter „Vergleich“ ist aktiv (bisheriges Verhalten), „Entdecken“ ist der erste Reiter und hat einen eigenen Bereich', await p.evaluate(() => MM.reiter.aktiv() === 'vergleich' && document.querySelector('[role=tab]').id === 'reiter-entdecken' && document.getElementById('bereich-entdecken').hidden === true));
  check('Kopf: drei Hauptaktionen „Baustoffe entdecken“, „Baustoffe vergleichen“, „Match finden“', JSON.stringify(await p.$$eval('.kopf-knopf', k => k.map(x => x.textContent.trim()))) === '["Baustoffe entdecken","Baustoffe vergleichen","Match finden"]');
  await p.click('#kopf-entdecken');
  check('Die Aktion „Baustoffe entdecken“ öffnet den Reiter „Entdecken“ (Adresse #entdecken), der Fokus liegt im Bereich', await p.evaluate(() => MM.reiter.aktiv() === 'entdecken' && !document.getElementById('bereich-entdecken').hidden && location.hash === '#entdecken'));
  check('Die weiteren Bereiche (Alternativen, Quellen & Details) sind durch einen Trenner von den drei Hauptbereichen abgesetzt', await p.evaluate(() => { const t = document.querySelector('.tabs-trenner'); const prev = t.previousElementSibling, next = t.nextElementSibling; return prev.id === 'reiter-match' && next.id === 'reiter-alternativen'; }));
  check('Liste: alle 50 Baustoffe als Karten mit Anzeige „50 von 50 Baustoffen“, sortiert nach Name', (await p.$$eval('#ent-liste > li', l => l.length)) === 50 && (await anzahl(p)) === '50 von 50 Baustoffen' && await (async () => { const n = await namen(p); return JSON.stringify(n) === JSON.stringify(n.slice().sort((x, y) => x.localeCompare(y, 'de'))); })());

  // ---------- 2. Karten: wichtige Informationen, nie „0“ für fehlende Werte ----------
  const k0 = await p.evaluate(() => { const li = document.querySelector('#ent-liste > li'); return { bild: !!li.querySelector('figure.mbild img'), name: li.querySelector('.ent-name').textContent, kat: li.querySelector('.ent-kat').textContent, zeilen: [...li.querySelectorAll('.ent-kw')].map(z => z.querySelector('.ent-kw-label').textContent), knoepfe: [...li.querySelectorAll('button')].map(x => x.textContent) }; });
  check('Jede Karte: Schraffur, Name, Kategorie, drei Kennwerte (Preis, CO₂, λ) und die Aktionen „Zum Vergleich“ und „Steckbrief“', k0.bild && k0.name && k0.kat && JSON.stringify(k0.zeilen) === '["Preis","CO₂ (A1–A3)","λ"]' && JSON.stringify(k0.knoepfe) === '["Zum Vergleich","Steckbrief"]', k0);
  const fehlend = await p.$$eval('#ent-liste .ent-fehlt', e => e.map(x => x.textContent));
  const nullWerte = await p.$$eval('#ent-liste .ent-kw-wert:not(.ent-fehlt)', e => e.filter(x => /^\s*0(\s|$)/.test(x.textContent)).length);
  check('Fehlende Kennwerte stehen als „fehlt“ (kursiv), nie als 0; mit Wert steht die Datenart-Marke (R) dabei', fehlend.length > 20 && fehlend.every(t => t === 'fehlt') && nullWerte === 0 && (await p.$$eval('#ent-liste .ent-kw-wert .art', e => e.length)) > 20);

  // ---------- 3. Suche ----------
  await p.fill('#ent-suche', 'styropor');
  let n = await namen(p);
  check('Suche arbeitet beim Tippen und kennt Alltagsbegriffe: „styropor“ findet EPS (nicht XPS); Anzahl und Filterhinweis werden aktualisiert', n.length === 1 && /EPS/.test(n[0]) && /^\d+ von 50 Baustoffen \(1 Filter aktiv\)$/.test(await anzahl(p)), [n, await anzahl(p)]);
  await p.fill('#ent-suche', 'polystyrol');
  n = await namen(p);
  check('Suche „polystyrol“ findet EPS und XPS', n.length === 2 && n.some(x => /EPS/.test(x)) && n.some(x => /XPS/.test(x)), n);
  await p.fill('#ent-suche', 'holz brett');
  n = await namen(p);
  check('Mehrere Suchwörter wirken zusammen (UND): „holz brett“ findet Brettschichtholz und Brettsperrholz', n.length >= 2 && n.every(x => /Brett/.test(x)) && n.some(x => /schicht/i.test(x)) && n.some(x => /sperr/i.test(x)), n);
  await p.fill('#ent-suche', 'qqqqq');
  check('Keine Treffer: klare Meldung mit Knopf „Alle Filter zurücksetzen“, die Liste ist leer, Anzeige „0 von 50“', await p.evaluate(() => !document.getElementById('ent-leer').hidden && document.querySelectorAll('#ent-liste > li').length === 0 && /^0 von 50/.test(document.getElementById('ent-anzahl').textContent)));
  await p.click('#ent-leer-reset');
  check('„Alle Filter zurücksetzen“ leert Suche und Filter, zeigt wieder 50 Baustoffe und setzt den Fokus ins Suchfeld', (await anzahl(p)) === '50 von 50 Baustoffen' && await p.evaluate(() => document.activeElement.id === 'ent-suche' && document.getElementById('ent-suche').value === '' && document.getElementById('ent-reset').hidden));

  // ---------- 4. Filter und Sortierung ----------
  await p.selectOption('#ent-kategorie', 'daemmstoff');
  const sollDaemm = DB.baustoffe.filter(m => m.kategorien.includes('daemmstoff')).length;
  check(`Filter Kategorie „Dämmstoffe“: ${sollDaemm} Baustoffe (aus den Daten nachgezählt)`, (await p.$$eval('#ent-liste > li', l => l.length)) === sollDaemm && (await anzahl(p)).startsWith(sollDaemm + ' von 50'));
  await p.click('#ent-weitere-knopf');
  check('„Weitere Filter“ klappt auf (aria-expanded) und enthält Einsatzbereich, „nur mit belegtem Preis“ und „nur mit belegtem CO₂-Wert“', await p.evaluate(() => document.getElementById('ent-weitere-knopf').getAttribute('aria-expanded') === 'true' && !document.getElementById('ent-weitere-box').hidden && !!document.getElementById('ent-anwendung') && !!document.getElementById('ent-nurpreis') && !!document.getElementById('ent-nurco2')));
  await p.click('#ent-reset');
  await p.check('#ent-nurpreis');
  const mitPreis = await p.evaluate(() => MATERIALMATCH_DATA.baustoffe.filter(m => { const e = MM.produkte.wirksam(m.id, '').eigenschaften.preis; return e && typeof e.wert === 'number'; }).length);
  const kartenPreis = await p.$$eval('#ent-liste > li', l => l.map(li => li.querySelector('.ent-kw-wert').className));
  check(`Filter „nur mit belegtem Preis“ im Echtdaten-Modus: ${mitPreis} Baustoffe, bei allen steht ein Preis (kein „fehlt“)`, kartenPreis.length === mitPreis && kartenPreis.every(c => !/ent-fehlt/.test(c)) && mitPreis >= 18, [kartenPreis.length, mitPreis]);
  await p.uncheck('#ent-nurpreis');
  await p.selectOption('#ent-sortierung', 'preis');
  const preise = await p.$$eval('#ent-liste > li', l => l.map(li => { const w = li.querySelector('.ent-kw-wert'); return /ent-fehlt/.test(w.className) ? null : w.textContent; }));
  const ersteFehlt = preise.indexOf(null);
  check('Sortierung nach Preis: Baustoffe mit Preis zuerst, alle ohne Preis am Ende (nie als 0 einsortiert)', ersteFehlt === mitPreis && preise.slice(ersteFehlt).every(x => x === null), [ersteFehlt, mitPreis]);
  await p.selectOption('#ent-sortierung', 'name');
  await p.click('#ent-ansicht-liste');
  check('Ansicht „Liste“: kompakte Zeilen (eine Zeile je Baustoff, weniger Höhe als Karten), aria-pressed wechselt', await p.evaluate(() => { const li = document.querySelector('#ent-liste > li'); return document.getElementById('ent-ansicht-liste').getAttribute('aria-pressed') === 'true' && document.getElementById('ent-ansicht-karten').getAttribute('aria-pressed') === 'false' && !document.getElementById('ent-liste').classList.contains('ent-karten') && li.getBoundingClientRect().height < 140; }));
  await p.click('#ent-ansicht-karten');

  // ---------- 5. In den Vergleich legen, Rückmeldung, Entfernen ----------
  await p.fill('#ent-suche', 'beton');
  await p.click('#ent-liste > li:nth-child(1) .ent-btn-haupt');
  const fb1 = await p.$eval('#ent-feedback', e => ({ t: e.textContent, live: e.getAttribute('aria-live'), sichtbar: !e.hidden }));
  check('„Zum Vergleich“ legt den Baustoff auf Material A und meldet das (aria-live) mit Link „Zum Vergleich“', /ist jetzt Material A im Vergleich/.test(fb1.t) && fb1.live === 'polite' && fb1.sichtbar && /Zum Vergleich$/.test(fb1.t), fb1);
  await p.click('#ent-liste > li:nth-child(1) .ent-btn-haupt');
  check('Ist der Baustoff schon gewählt, kommt ein Hinweis statt Doppelung', /schon im Vergleich/.test(await p.$eval('#ent-feedback', e => e.textContent)));
  await p.click('#ent-liste > li:nth-child(2) .ent-btn-haupt'); await p.click('#ent-liste > li:nth-child(3) .ent-btn-haupt');
  const ids3 = await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.map(x => x.buchstabe + ':' + x.material.id));
  check('Der zweite und dritte Klick belegen B und C', ids3.length === 3 && ids3[0].startsWith('A:') && ids3[1].startsWith('B:') && ids3[2].startsWith('C:'), ids3);
  await p.click('#ent-liste > li:nth-child(4) .ent-btn-haupt');
  const ids4 = await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.map(x => x.buchstabe + ':' + x.material.id));
  check('Sind drei Plätze belegt, ersetzt der nächste Baustoff Material C (A und B bleiben)', ids4.length === 3 && ids4[0] === ids3[0] && ids4[1] === ids3[1] && ids4[2] !== ids3[2], [ids3, ids4]);
  await p.click('#ent-feedback .ent-link');
  check('Der Link „Zum Vergleich“ wechselt in den Vergleich; die Auswahl ist dort erhalten (drei Materialkarten)', await p.evaluate(() => MM.reiter.aktiv() === 'vergleich' && document.querySelectorAll('#auswahl-karten .card').length === 3));
  await p.click('#auswahl-karten .card:nth-child(2) .card-entfernen').catch(async () => { await p.click('#auswahl-karten [aria-label^="Material B entfernen"]'); });
  const nachEntf = await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.map(x => x.buchstabe));
  check('„Entfernen“ an der Materialkarte räumt nur diesen Platz (hier B); A und C bleiben', JSON.stringify(nachEntf) === '["A","C"]', nachEntf);
  await p.click('#reiter-entdecken');
  check('Beim Zurückwechseln in „Entdecken“ bleiben Suche und Filter erhalten (nichts wird gelöscht)', await p.evaluate(() => document.getElementById('ent-suche').value === 'beton'));

  // ---------- 6. Steckbrief mit beschrifteten Abschnitten ----------
  await p.click('#ent-liste > li:nth-child(1) .ent-btn:not(.ent-btn-haupt)');
  await p.waitForTimeout(150);
  await p.click('dialog.steckbrief .sb-mehr summary');
  const abschnitte = await p.$$eval('dialog.steckbrief .sb-mehr-inhalt h4', h => h.map(x => x.textContent));
  check('Steckbrief: aus „Entdecken“ geöffnet; ausführlicher Teil gegliedert in Technische Eigenschaften, Ökologische Eigenschaften, Preise, Einsatzbereiche, Quellen und Datenqualität', JSON.stringify(abschnitte) === JSON.stringify(['Technische Eigenschaften', 'Ökologische Eigenschaften', 'Preise', 'Einsatzbereiche', 'Quellen und Datenqualität']), abschnitte);
  check('Steckbrief nennt die Datenqualität in Zahlen („x von 10 Kennwerten sind belegt … fehlen … keine Null“)', /\d+ von 10 Kennwerten sind belegt/.test(await p.$eval('dialog.steckbrief .sb-dq', e => e.textContent)) && /keine Null/.test(await p.$eval('dialog.steckbrief .sb-dq', e => e.textContent)));
  await p.keyboard.press('Escape');
  check('Escape schließt den Steckbrief, der Fokus kehrt auf den Knopf in der Karte zurück', await p.evaluate(() => !document.querySelector('dialog.steckbrief').open && document.activeElement.textContent === 'Steckbrief'));
  await p.close();

  // ---------- 7. Datenmodus: Demo zeigt Beispielwerte mit „B“, Echtdaten nicht ----------
  const d = await neu('demo', '#entdecken');
  const demoB = await d.$$eval('#ent-liste .art-beispiel', e => e.length);
  const demoPreis = await d.evaluate(() => MATERIALMATCH_DATA.baustoffe.filter(m => { const e = MM.produkte.wirksam(m.id, '').eigenschaften.preis; return e && typeof e.wert === 'number'; }).length);
  check('Demo-Modus: Beispielwerte erscheinen mit der gelben Marke „B“ auf den Karten; die 8 neu bepreisten Dämmstoffe (XPS, PUR, PIR, …) bleiben im Demo-Modus ohne Preis (Demo-Zahlen unverändert: 20 Baustoffe mit Preis statt 28 im Echtdaten-Modus)', demoB > 20 && demoPreis === 20, [demoB, demoPreis]);
  await d.click('#modus-schalter');
  check('Wechsel in den Echtdaten-Modus aktualisiert die Karten sofort (keine „B“-Marken mehr)', (await d.$$eval('#ent-liste .art-beispiel', e => e.length)) === 0);
  await d.close();

  // ---------- 8. Responsiv ----------
  for (const w of [320, 390, 768, 1280]) {
    const q = await neu('echt', '#entdecken', w);
    const r = await q.evaluate(() => { const cw = document.documentElement.clientWidth; const kn = [...document.querySelectorAll('#bereich-entdecken button, #bereich-entdecken select, #bereich-entdecken input[type=search]')].filter(e => e.getBoundingClientRect().width > 0); return { seite: document.documentElement.scrollWidth > cw, klein: kn.filter(e => e.getBoundingClientRect().height < 40).map(e => e.id || e.textContent).slice(0, 3), tabRaus: [...document.querySelectorAll('[role=tab]')].some(t => { const r = t.getBoundingClientRect(); return r.right > cw + 1 || r.left < -1; }), schrift: [...document.querySelectorAll('[role=tab]')].some(t => parseFloat(getComputedStyle(t).fontSize) < 12) }; });
    check(`Entdecken bei ${w} px: kein seitliches Scrollen, alle Bedienelemente mindestens 40 px hoch, alle fünf Reiter im Fenster, Reiterschrift mindestens 12 px`, !r.seite && r.klein.length === 0 && !r.tabRaus && !r.schrift, r);
    await q.close();
  }
  check('Keine Konsolenfehler oder -warnungen im gesamten Lauf', errors.length === 0, errors);

  await b.close();
  console.log(fails ? '\n' + fails + ' FEHLER' : '\nAlle Prüfungen bestanden');
  process.exit(fails ? 1 : 0);
})();
