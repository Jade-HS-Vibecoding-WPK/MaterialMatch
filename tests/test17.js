const PROJ = require('path').resolve(__dirname, '..');
const AUSGABE = require('path').join(require('os').tmpdir(), 'materialmatch-tests') + '/';
require('fs').mkdirSync(AUSGABE, { recursive: true });
const { chromium } = require('playwright');
require('./_offline.js');
let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 500))); }
const num = t => Number(String(t).replace(',', '.'));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  p.on('pageerror', e => errors.push(String(e)));
  await p.goto('file://' + PROJ + '/index.html?modus=demo'); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });

  const waehle = (a, b_ = '', c = '') => p.evaluate(([a, b_, c]) => MM.auswahl.setzeAuswahl({ a, b: b_, c }), [a, b_, c]);
  const prio = async (wert) => { await p.selectOption('#prioritaet', wert); };
  const txt = () => p.$eval('#alternativen-inhalt', e => e.innerText.replace(/\s+/g, ' '));
  const karten = () => p.$$eval('#alternativen-inhalt article.rec-card', cs => cs.map(c => ({
    id: c.dataset.material,
    gesamt: (c.querySelector('.rec-total').textContent.match(/Gesamtbewertung: ([\d,]+)/) || [])[1],
    kriterien: [...c.querySelectorAll('.rec-scores li:not(.rec-total)')].map(l => { const m = l.textContent.match(/^(.*): ([\d,]+) · Gewichtung (\d)×$/); return m ? { name: m[1], score: m[2], gewicht: Number(m[3]) } : { roh: l.textContent }; }) })));
  const engine = (ref, bereich, pr) => p.evaluate(([r, bb, q]) => { const x = MM.empfehlung.empfehle(MATERIALMATCH_DATA, r, bb, q); return x.empfehlungen.map(e => e.material.id); }, [ref, bereich, prio_(pr)]);
  function prio_(x) { return x; }
  const gewichtFarben = () => p.$$eval('figure[data-chart="gewicht"] .chart-row:not(.chart-axis)', r => r.map(x => x.dataset.farbe));
  let ereignisse = 0;
  await p.evaluate(() => { window.__ev = []; document.addEventListener('mm:prioritaet', e => window.__ev.push(e.detail.prioritaet)); });

  // ---- Auswahlfeld
  const opts = await p.$$eval('#prioritaet option', o => o.map(x => [x.value, x.textContent]));
  check('Auswahlfeld aktiv', await p.$eval('#prioritaet', s => !s.disabled));
  check('Fünf Optionen mit den Bezeichnungen aus dem Master-Prompt', JSON.stringify(opts) === JSON.stringify([['ausgewogen', 'Ausgewogener Vergleich'], ['kosten', 'Niedrige Kosten'], ['co2', 'Geringe CO₂-Emissionen'], ['gewicht', 'Geringes Gewicht'], ['waerme', 'Gute Wärmedämmung']]), opts);
  check('Standard: Ausgewogener Vergleich', await p.$eval('#prioritaet', s => s.value) === 'ausgewogen' && await p.evaluate(() => MM.prioritaet.holen()) === 'ausgewogen');
  check('Beschriftung der Auswahl: kurz „Priorität“ (die frühere Frage steht nicht mehr im Feld)', (await p.$eval('label[for="prioritaet"]', l => l.textContent)) === 'Priorität');

  // ---- Dämmstoffe: Reihenfolge folgt der Priorität
  await waehle('mineralwolle');
  const reihe = {};
  for (const q of ['ausgewogen', 'kosten', 'co2', 'gewicht', 'waerme']) {
    await prio(q);
    const k = await karten(); const e = await engine('mineralwolle', null, q);
    reihe[q] = k.map(x => x.id);
    check(`Priorität "${q}": Kopfzeile nennt "${opts.find(o => o[0] === q)[1]}"`, (await txt()).includes('Priorität: ' + opts.find(o => o[0] === q)[1]));
    check(`Priorität "${q}": Reihenfolge der Karten = Empfehlungslogik, drei Karten`, k.length === 3 && JSON.stringify(k.map(x => x.id)) === JSON.stringify(e), [k.map(x => x.id), e]);
    check(`Priorität "${q}": Gesamtbewertung sinkt von Rang 1 nach 3`, num(k[0].gesamt) >= num(k[1].gesamt) && num(k[1].gesamt) >= num(k[2].gesamt), k.map(x => x.gesamt));
    // unabhängige Nachrechnung: gewichtetes Mittel der angezeigten Teilbewertungen
    const stimmt = k.every(x => { const sw = x.kriterien.reduce((s, c) => s + c.gewicht * num(c.score), 0), sg = x.kriterien.reduce((s, c) => s + c.gewicht, 0); return sg > 0 && Math.abs(sw / sg - num(x.gesamt)) <= 0.02; });
    check(`Priorität "${q}": Gesamtbewertung = gewichtetes Mittel der angezeigten Teilbewertungen`, stimmt, k.map(x => [x.gesamt, x.kriterien]));
  }
  check('Die Reihenfolge hängt wirklich von der Priorität ab (Kosten, CO₂ und ausgewogen liefern nicht überall dieselbe Karte an erster Stelle)', new Set([reihe.ausgewogen[0], reihe.kosten[0], reihe.co2[0]]).size > 1, reihe);

  // ---- Gewichtung der Kriterien je Priorität
  const gewichte = async (q) => { await prio(q); const k = await karten(); return Object.fromEntries(k[0].kriterien.map(c => [c.name, c.gewicht])); };
  let g = await gewichte('ausgewogen');
  check('Ausgewogen: alle Kriterien Gewichtung 1×, drei Kriterien (Kosten/R, CO₂/R, λ)', Object.values(g).every(x => x === 1) && Object.keys(g).length === 3, g);
  g = await gewichte('kosten');
  check('Niedrige Kosten: Kosten 3×, übrige 1×', g['Kosten je Dämmwirkung'] === 3 && g['CO₂ (fossil) je Dämmwirkung'] === 1 && g['Wärmeleitfähigkeit λ'] === 1, g);
  g = await gewichte('co2');
  check('Geringe CO₂-Emissionen: CO₂ 3×, übrige 1×', g['CO₂ (fossil) je Dämmwirkung'] === 3 && g['Kosten je Dämmwirkung'] === 1, g);
  g = await gewichte('gewicht');
  const alleG = (await karten()).map(c => Object.fromEntries(c.kriterien.map(x => [x.name, x.gewicht])));
  check('Geringes Gewicht: zusätzliches Kriterium Rohdichte mit 3× (bei jeder Karte; die übrigen Kriterien 1×, so viele wie Kennwerte vorliegen – bei Karten ohne Preis entfällt das Kosten-Kriterium)', alleG.length > 0 && alleG.every(x => x['Rohdichte (Gewicht)'] === 3 && Object.entries(x).every(([k, v]) => k === 'Rohdichte (Gewicht)' || v === 1)) && alleG.some(x => Object.keys(x).length === 4), alleG);
  g = await gewichte('waerme');
  check('Gute Wärmedämmung (Dämmstoffe): λ 3×', g['Wärmeleitfähigkeit λ'] === 3 && Object.keys(g).length === 3, g);
  await waehle('normalbeton'); await prio('waerme');
  g = Object.fromEntries((await karten())[0].kriterien.map(c => [c.name, c.gewicht]));
  check('Gute Wärmedämmung bei Tragwerk (Beton): λ kommt als zusätzliches Kriterium mit 3× hinzu', g['Wärmeleitfähigkeit λ'] === 3 && g['Kosten'] === 1 && g['CO₂ (fossil, Herstellung)'] === 1, g);
  await prio('ausgewogen');
  g = Object.fromEntries((await karten())[0].kriterien.map(c => [c.name, c.gewicht]));
  check('Tragwerk ausgewogen: nur Kosten und CO₂ (λ zählt nicht automatisch)', Object.keys(g).length === 2 && !('Wärmeleitfähigkeit λ' in g), g);

  // ---- Erklärung der Methode
  await waehle('mineralwolle'); await prio('co2');
  await p.$$eval('#alternativen-inhalt details.sub', ds => ds.forEach(d => { d.open = true; }));
  const meth = await p.$eval('#alternativen-inhalt details[data-key="methode"]', d => ({ text: d.innerText.replace(/\s+/g, ' '), zeilen: [...d.querySelectorAll('tbody tr')].map(r => [...r.cells].map(c => c.textContent)) }));
  check('Methode: nennt gewählte Priorität und deren Wirkung', meth.text.includes('Gewählte Priorität: Geringe CO₂-Emissionen. Die fossilen CO₂-Emissionen zählen dreifach'), meth.text.slice(0, 200));
  check('Methode: Gewichtungstabelle mit drei Kriterien, CO₂ 3×', meth.zeilen.length === 3 && meth.zeilen.find(z => z[0].startsWith('CO₂'))[1] === '3×' && meth.zeilen.filter(z => z[1] === '1×').length === 2, meth.zeilen);
  check('Methode: Rechenbeispiel stimmt rechnerisch ((3×0,8 + 1×0,4)/4 = 0,7)', meth.text.includes('(3 × 0,8 + 1 × 0,4) / (3 + 1) = 0,7') && Math.abs((3 * 0.8 + 1 * 0.4) / (3 + 1) - 0.7) < 1e-12);
  check('Methode: erklärt Teilbewertung (bester 1, schlechtester 0), Gesamtbewertung, Vergleichbarkeit, Preisregel, Unsicherheit', ['bekommt der beste Wert', '0. Niedriger ist besser', 'Gesamtbewertung', 'Vergleichbarkeit', 'Nie allein wegen des Preises', 'Unsicherheit'].every(t => meth.text.includes(t)));
  await prio('gewicht');
  const m2 = await p.$eval('#alternativen-inhalt details[data-key="methode"]', d => d.innerText.replace(/\s+/g, ' '));
  check('Methode bei Priorität Gewicht: Rohdichte-Kriterium und Hinweis auf das Diagramm', m2.includes('Rohdichte (Gewicht)') && m2.includes('Gewichtsdiagramm oben wird farbig bewertet'));
  check('Karten erklären die Skala (0 = schlechtester, 1 = bester Wert der Gruppe)', (await txt()).includes('0 = schlechtester, 1 = bester Wert der Gruppe'));

  // ---- Gewichtsdiagramm
  await waehle('mineralwolle', 'eps', 'holzfaserdaemmung');
  await p.fill('#flaeche', '100'); await p.fill('#dicke', '20');
  await prio('ausgewogen');
  check('Ausgewogen: Gewichtsdiagramm neutral grau', (await gewichtFarben()).every(f => f === '#B8BEC4'), await gewichtFarben());
  await prio('gewicht');
  const gf = await gewichtFarben();
  check('Geringes Gewicht: Gewichtsdiagramm farbig bewertet (leichtestes grün, schwerstes rot)', gf.length === 3 && gf.includes('#17643A') && gf.includes('#951F2B') && !gf.includes('#B8BEC4'), gf);
  await prio('kosten');
  check('Niedrige Kosten: Gewichtsdiagramm bleibt grau', (await gewichtFarben()).every(f => f === '#B8BEC4'));
  check('Kosten-, CO₂- und λ-Diagramme ändern sich durch die Priorität nicht', await (async () => { const f = async () => p.$$eval('figure[data-chart="kosten"] .chart-row, figure[data-chart="co2-fossil"] .chart-row, figure[data-chart="lambda"] .chart-row', r => r.map(x => x.dataset.farbe).join()); await prio('ausgewogen'); const a = await f(); await prio('waerme'); const c = await f(); return a === c; })());

  // ---- Zustand, Ereignisse, Eingabewege
  await prio('co2'); await waehle('eps');
  check('Priorität bleibt beim Wechsel des Materials erhalten', await p.$eval('#prioritaet', s => s.value) === 'co2' && (await txt()).includes('Priorität: Geringe CO₂-Emissionen'));
  const n0 = await p.evaluate(() => window.__ev.length);
  await p.evaluate(() => MM.prioritaet.setzen('co2'));
  check('Gleichen Wert erneut setzen löst keine Nachricht aus', await p.evaluate(() => window.__ev.length) === n0);
  await p.evaluate(() => MM.prioritaet.setzen('quatsch'));
  check('Ungültiger Wert wird ignoriert (Feld und Zustand unverändert)', await p.$eval('#prioritaet', s => s.value) === 'co2' && await p.evaluate(() => MM.prioritaet.holen()) === 'co2' && await p.evaluate(() => window.__ev.length) === n0);
  await p.evaluate(() => MM.diagramme.setzePrioritaet('kosten'));
  check('Kurzweg setzePrioritaet aktualisiert Feld, Diagramme und Empfehlungen', await p.$eval('#prioritaet', s => s.value) === 'kosten' && (await txt()).includes('Priorität: Niedrige Kosten') && await p.evaluate(() => MM.alternativen.holePrioritaet() === 'kosten' && MM.diagramme.holePrioritaet() === 'kosten'));
  const ev = await p.evaluate(() => window.__ev);
  check('Jede echte Änderung sendet genau eine Nachricht "mm:prioritaet"', ev.length > 0 && ev.every((x, i) => i === 0 || x !== ev[i - 1]), ev);
  await p.evaluate(() => { const s = document.getElementById('prioritaet'); s.value = 'quatsch'; s.dispatchEvent(new Event('change')); });
  check('Manipuliertes Feld (ungültiger Wert): Zustand bleibt gültig, Feld springt zurück', await p.evaluate(() => MM.prioritaet.holen()) === 'kosten' && await p.$eval('#prioritaet', s => s.value) === 'kosten');
  await p.focus('#prioritaet'); await p.keyboard.press('ArrowDown');
  check('Per Tastatur (Pfeil nach unten) bedienbar', await p.evaluate(() => MM.prioritaet.holen()) === 'co2', await p.evaluate(() => MM.prioritaet.holen()));
  await prio('ausgewogen');

  // ---- Sonderfälle
  await waehle('baustahl'); await prio('kosten');
  check('Baustahl mit Priorität: weiterhin Meldung statt Karten', (await karten()).length === 0 && (await txt()).includes('keine Kennwerte vor'));
  await p.reload(); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; }); await waehle('normalbeton'); await prio('gewicht');
  const kg = await karten();
  check('Tragwerk mit Priorität Gewicht: Rohdichte 3×, nur echte Rohdichten (Richtwerte)', kg.length === 3 && kg.every(x => x.kriterien.some(c => c.name === 'Rohdichte (Gewicht)' && c.gewicht === 3)), kg.map(x => x.kriterien));

  check('Keine Konsolenfehler', errors.length === 0, errors);

  // ---- Layout
  for (const w of [1280, 768, 375]) {
    const m = await b.newPage({ viewport: { width: w, height: 800 } });
    await m.goto('file://' + PROJ + '/index.html?modus=demo'); await m.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
    await m.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: '', c: '' }));
    await m.selectOption('#prioritaet', 'gewicht');
    await m.$$eval('#alternativen-inhalt details.sub', ds => ds.forEach(d => { d.open = true; }));
    const r = await m.evaluate(() => {
      const cw = document.documentElement.clientWidth;
      const sel = document.getElementById('prioritaet').getBoundingClientRect();
      const tab = document.querySelector('#alternativen-inhalt table'); const wr = tab.closest('.table-wrap');
      return { selPasst: sel.left >= 0 && sel.right <= cw + 1 && sel.width > 100, seite: document.documentElement.scrollWidth <= cw, tabPasst: wr.scrollWidth <= wr.clientWidth + 1,
        scores: [...document.querySelectorAll('.rec-scores')].every(u => u.scrollWidth <= u.clientWidth + 1), n: document.querySelectorAll('.rec-card').length };
    });
    check(`Breite ${w}: Auswahlfeld sichtbar, Gewichtungstabelle und Bewertungslisten passen, Seite scrollt nicht`, r.selPasst && r.seite && r.tabPasst && r.scores && r.n === 3, r);
  }

  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
  await b.close();
})();
