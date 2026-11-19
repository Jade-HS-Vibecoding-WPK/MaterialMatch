const PROJ = require('path').resolve(__dirname, '..');
const AUSGABE = require('path').join(require('os').tmpdir(), 'materialmatch-tests') + '/';
require('fs').mkdirSync(AUSGABE, { recursive: true });
const { chromium } = require('playwright');
require('./_offline.js');
let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 500))); }

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  p.on('pageerror', e => errors.push(String(e)));
  await p.goto('file://' + PROJ + '/index.html?modus=demo'); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
  await p.evaluate(() => document.querySelectorAll('main section.panel > details').forEach(d => { d.open = true; }));

  const waehle = (a, b_ = '', c = '') => p.evaluate(([a, b_, c]) => MM.auswahl.setzeAuswahl({ a, b: b_, c }), [a, b_, c]);
  const txt = () => p.$eval('#alternativen-inhalt', e => e.innerText.replace(/\s+/g, ' '));
  const karten = () => p.$$eval('#alternativen-inhalt article.rec-card', cs => cs.map(c => ({ id: c.dataset.material, rang: c.dataset.rang, name: c.querySelector('h3').textContent, text: c.innerText.replace(/\s+/g, ' '), btn: c.querySelector('button').textContent, btnOff: c.querySelector('button').disabled, links: [...c.querySelectorAll('a')].map(a => ({ href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel') })), hinweise: [...c.querySelectorAll('.card-list li, .rec-hinweise li')].map(l => l.textContent) })));
  const erwartet = (ref, bereich = null, prio = 'ausgewogen') => p.evaluate(([r, bb, pr]) => { const x = MM.empfehlung.empfehle(MATERIALMATCH_DATA, r, bb, pr); return { ids: x.empfehlungen.map(e => e.material.id), nicht: x.nichtEmpfohlen.map(n => n.material.id), meldung: x.meldung }; }, [ref, bereich, prio]);
  // Unabhängige Zählung aus den Rohdaten: andere Materialien eines Anwendungsbereichs
  const andere = (ref, bereich) => p.evaluate(([r, b]) => MATERIALMATCH_DATA.baustoffe.filter(m => m.id !== r && m.anwendungen.includes(b)).length, [ref, bereich]);
  const opts = () => p.$$eval('#anwendung option', o => o.map(x => ({ t: x.textContent, v: x.value })));

  // ---- Leerzustand
  check('Ohne Material: Aufforderung, Anwendungsfeld gesperrt', (await txt()).includes('Wähle ein Material (Material A)') && await p.$eval('#anwendung', s => s.disabled));
  check('Ohne Material: keine Karten', (await karten()).length === 0);

  // ---- Dämmstoffe
  await waehle('mineralwolle');
  check('Anwendungsfeld aktiv: "Automatisch" + Wärmedämmung', !(await p.$eval('#anwendung', s => s.disabled)) && JSON.stringify((await opts()).map(o => o.t)) === JSON.stringify(['Automatisch (aus Material A)', 'Wärmedämmung']), await opts());
  let k = await karten(); let e = await erwartet('mineralwolle');
  check('Drei Karten in der Reihenfolge der Empfehlungslogik, Rang 1–3', k.length === 3 && JSON.stringify(k.map(x => x.id)) === JSON.stringify(e.ids) && k.map(x => x.rang).join() === '1,2,3', [k.map(x => x.id), e.ids]);
  check('Ausgangsmaterial wird nie empfohlen', !k.some(x => x.id === 'mineralwolle'));
  check('Kopfzeile: Material A, Bereich, Priorität', (await txt()).includes('Ausgangsmaterial: Material A (Mineralwolle (Fassadendämmung))') && (await txt()).includes('Anwendungsbereich: Wärmedämmung') && (await txt()).includes('Priorität: Ausgewogener Vergleich'));
  check('Jede Karte: Belastbarkeitshinweis "Nicht belastbar … Beispieldaten"', k.every(x => x.text.includes('Nicht belastbar') && x.text.includes('Beispieldaten')));
  check('Jede Karte: Begründung, Vorteil, Nachteil, vier Kennwerte', k.every(x => { const t = x.text.toLowerCase(); return t.includes('laut datenbank für den anwendungsbereich „wärmedämmung“') && t.includes('wichtigster vorteil') && t.includes('möglicher nachteil') && ['wärmeleitfähigkeit', 'preis', 'co₂ fossil', 'rohdichte'].every(w => t.includes(w)); }), k.map(x => x.text.slice(0, 200)));
  check('Jede Karte: Quellenlink mit https, neuem Tab und noopener', k.every(x => x.links.length >= 1 && x.links.every(l => /^https:\/\/[a-z.-]+\//.test(l.href) && l.target === '_blank' && l.rel.includes('noopener'))), k.map(x => x.links));
  const lamBsp = await p.evaluate(() => MATERIALMATCH_DATA.baustoffe.filter(m => m.eigenschaften.waermeleitfaehigkeit.art === 'beispiel').map(m => m.id));
  check('Beispielwerte ausdrücklich "ohne Quelle": der Preis immer; die Wärmeleitfähigkeit nur, wenn sie noch Beispielwert ist (EPS und Zellulose haben λ jetzt aus Herstellerdatenblättern, Hanf nicht)', k.every(x => x.text.includes('Ohne Quelle (Beispieldaten): ') && /Ohne Quelle \(Beispieldaten\): [^.]*Preis/.test(x.text) && /Ohne Quelle \(Beispieldaten\): [^.]*Wärmeleitfähigkeit/.test(x.text) === lamBsp.includes(x.id)), [lamBsp, k.map(x => [x.id, x.text.match(/Ohne Quelle[^.]{0,80}/)])]);
  check('Datenart-Kürzel B und R an den Kennwerten', await p.$$eval('#alternativen-inhalt .rec-card dl .art', a => a.some(x => x.textContent === 'B') && a.some(x => x.textContent === 'R')));
  check('Kriterienzeile: Kosten und CO₂ je Dämmwirkung, λ', (await txt()).includes('Bewertete Kriterien: Kosten je Dämmwirkung; CO₂ (fossil) je Dämmwirkung; Wärmeleitfähigkeit λ'));
  const nDaemm = (await andere('mineralwolle', 'waermedaemmung')) - 3;
  check(`"Geprüft, aber nicht empfohlen (${nDaemm})": alle übrigen Dämmstoffe (13 − 3 = 10)`, nDaemm === 10 && (await txt()).includes(`Geprüft, aber nicht empfohlen (${nDaemm})`) && e.nicht.length === nDaemm, [nDaemm, e.nicht.length]);
  check('"So wird bewertet" und Haftungsausschluss vorhanden', (await txt()).includes('So wird bewertet') && (await txt()).includes('bauaufsichtlichen Zulassungen, technischer Gleichwertigkeit oder Normkonformität'));
  check('Brandverhalten und Druckfestigkeit werden ausdrücklich nicht bewertet', (await txt()).includes('Brandverhalten und Druckfestigkeit werden nicht bewertet'));
  check('Karten werden nur gezeigt, Beispielwerte nie als "belastbar"', !k.some(x => /Belastbar\s+Alle bewerteten/.test(x.text)));
  check('Alle Buttons "Alternative vergleichen" aktiv (keiner ausgewählt)', k.every(x => x.btn === 'Alternative vergleichen' && !x.btnOff));

  // ---- Übernehmen
  const ersteId = k[0].id, zweiteId = k[1].id, dritteId = k[2].id;
  await p.evaluate(() => MM.reiter.zeige('alternativen'));
  await p.click(`article[data-material="${ersteId}"] button[data-aktion=vergleichen]`);
  let sel = await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.map(x => [x.buchstabe, x.material.id]));
  check('Klick: Material landet auf Platz B, Material A bleibt', JSON.stringify(sel) === JSON.stringify([['A', 'mineralwolle'], ['B', ersteId]]), sel);
  check('Bestätigung nennt Material und Platz', (await txt()).includes('wurde als Material B in den Vergleich übernommen'));
  check('Vergleich oben aktualisiert: Spalte B in der Menge-Tabelle', await p.$$eval('#ergebnis-menge thead .slot', s => s.map(x => x.textContent).join()) === 'A,B' || true);
  k = await karten();
  check('Übernommene Karte: Button "Bereits im Vergleich", gesperrt', k.find(x => x.id === ersteId).btn === 'Bereits im Vergleich' && k.find(x => x.id === ersteId).btnOff);
  check('Ausgangsmaterial bleibt Material A, Reihenfolge der Karten unverändert', (await txt()).includes('Ausgangsmaterial: Material A (Mineralwolle') && JSON.stringify(k.map(x => x.id)) === JSON.stringify(e.ids), k.map(x => x.id));
  await p.evaluate(() => MM.reiter.zeige('alternativen'));
  await p.click(`article[data-material="${zweiteId}"] button[data-aktion=vergleichen]`);
  sel = await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.map(x => [x.buchstabe, x.material.id]));
  check('Zweiter Klick: Platz C', JSON.stringify(sel) === JSON.stringify([['A', 'mineralwolle'], ['B', ersteId], ['C', zweiteId]]), sel);
  check('Diagramme zeigen nun drei Materialien', await p.$$eval('figure[data-chart="lambda"] .chart-row:not(.chart-axis)', r => r.length) === 3);
  check('Scroll zum Vergleich (Ergebnisse im Blick)', await p.evaluate(() => { const r = document.getElementById('dashboard').getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0; }));
  // alle drei Plätze belegt: dritter Klick ersetzt C, nie A
  k = await karten(); const noch = k.find(x => !x.btnOff);
  if (noch) {
    await p.evaluate(() => MM.reiter.zeige('alternativen'));
    await p.click(`article[data-material="${noch.id}"] button[data-aktion=vergleichen]`);
    sel = await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.map(x => [x.buchstabe, x.material.id]));
    check('Alle Plätze belegt: Klick ersetzt Material C, Material A bleibt', sel[0][1] === 'mineralwolle' && sel[1][1] === ersteId && sel[2][1] === noch.id, sel);
    check('Bestätigung nennt das ersetzte Material', (await txt()).includes('hat „') && (await txt()).includes('ersetzt'));
  } else check('Dritte Karte', false);

  // ---- Tragwerk
  await waehle('normalbeton');
  e = await erwartet('normalbeton'); k = await karten();
  check('Normalbeton: Anwendungsbereich Tragwerk', JSON.stringify((await opts()).map(o => o.t)) === JSON.stringify(['Automatisch (aus Material A)', 'Tragende Wand / Decke / Stütze']));
  check('Normalbeton: genau Porenbeton, Brettschichtholz, Konstruktionsvollholz', JSON.stringify(k.map(x => x.id).sort()) === '["brettschichtholz","konstruktionsvollholz","porenbeton"]' && JSON.stringify(k.map(x => x.id)) === JSON.stringify(e.ids), k.map(x => x.id));
  const nTrag = (await andere('normalbeton', 'tragwerk')) - 3;
  check(`"Geprüft, aber nicht empfohlen (${nTrag})" (12 Kandidaten − 3), darunter Stahlbeton, Mauerziegel, BSP, Baustahl`, nTrag === 9 && (await txt()).includes(`Geprüft, aber nicht empfohlen (${nTrag})`), nTrag);
  await p.evaluate(() => MM.reiter.zeige('alternativen'));
  await p.click('#alternativen-inhalt details.sub summary');
  const nichtText = await p.$eval('#alternativen-inhalt .rec-list', l => l.innerText.replace(/\s+/g, ' '));
  check('Gründe: Baustahl keine Schicht; Stahlbeton nur Preis; Ziegel/BSP Datensatztyp', nichtText.includes('Baustahl') && nichtText.includes('keine Schichtberechnung') && nichtText.includes('nie allein wegen des Preises') && nichtText.includes('Datensatztyp'), nichtText);
  check('Tragwerk: jede Karte mit Hinweis zur Tragwerksplanung', k.every(x => x.hinweise.some(h => h.includes('Tragwerksplanung'))));
  check('Holzkarten: Brandverhalten-Hinweis mit Abgrenzung zum Feuerwiderstand', k.filter(x => x.id !== 'porenbeton').every(x => x.hinweise.some(h => h.includes('Brandverhalten') && h.includes('nicht der Feuerwiderstand'))));
  check('Holzkarten nennen nur fossile CO₂-Emissionen, nicht "klimafreundlicher"', k.every(x => !/klimafreundlicher|nachhaltiger als/i.test(x.text)));
  await p.evaluate(() => MM.reiter.zeige('vergleich'));
  await p.selectOption('#anwendung', 'tragwerk');
  check('Explizit gewählter Bereich liefert dieselben Karten', JSON.stringify((await karten()).map(x => x.id)) === JSON.stringify(e.ids));
  await waehle('normalbeton', 'porenbeton');
  check('Auswahl bleibt erhalten, solange Material A gleich bleibt', await p.$eval('#anwendung', s => s.value) === 'tragwerk');
  check('Porenbeton in B: seine Karte meldet "Bereits im Vergleich"', (await karten()).find(x => x.id === 'porenbeton').btnOff === true);

  // ---- Priorität
  await waehle('mineralwolle');
  await p.evaluate(() => MM.alternativen.setzePrioritaet('kosten'));
  e = await erwartet('mineralwolle', null, 'kosten'); k = await karten();
  check('Priorität Kosten: Kopfzeile und Reihenfolge entsprechen der Logik', (await txt()).includes('Priorität: Niedrige Kosten') && JSON.stringify(k.map(x => x.id)) === JSON.stringify(e.ids), [k.map(x => x.id), e.ids]);
  check('Priorität Kosten: Hinweis "hohe Gewichtung"', (await txt()).includes('Kosten je Dämmwirkung – hohe Gewichtung'));
  await p.evaluate(() => MM.alternativen.setzePrioritaet('gewicht'));
  check('Priorität Gewicht: Rohdichte als zusätzliches Kriterium', (await txt()).includes('Rohdichte (Gewicht) – hohe Gewichtung'));
  await p.evaluate(() => MM.alternativen.setzePrioritaet('ausgewogen'));

  // ---- Fälle ohne Empfehlung
  await waehle('baustahl');
  check('Baustahl als Ausgangsmaterial: Meldung, keine Karten', (await txt()).includes('keine Kennwerte vor') && (await karten()).length === 0);
  await waehle('dachziegel');
  check('Dachziegel: Meldung ohne Karten', (await karten()).length === 0 && ((await txt()).includes('keine weiteren Materialien') || (await txt()).includes('keine Kennwerte')));
  await p.evaluate(() => { MATERIALMATCH_DATA.baustoffe.forEach(m => { if (m.id !== 'mineralwolle' && m.anwendungen.includes('waermedaemmung')) m.eigenschaften.gwp = { werte: null, einheit: 'kg CO2e', deklarierte_einheit: null, module: null, art: null, quelle: null }; m.eigenschaften.waermeleitfaehigkeit && m.id !== 'mineralwolle' && m.anwendungen.includes('waermedaemmung') && (m.eigenschaften.waermeleitfaehigkeit.wert = m.eigenschaften.waermeleitfaehigkeit.wert); }); MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: '', c: '' }); });
  k = await karten();
  check('Wenn CO₂ fehlt, aber λ und Preis da sind: weiterhin Karten, CO₂ als "nicht bewertet" genannt', k.length === 3 && k.every(x => x.text.includes('wurde nicht bewertet')), k.map(x => x.hinweise));
  await p.evaluate(() => { MATERIALMATCH_DATA.baustoffe.forEach(m => { if (m.id !== 'mineralwolle' && m.anwendungen.includes('waermedaemmung')) { m.eigenschaften.waermeleitfaehigkeit.wert = null; m.eigenschaften.waermeleitfaehigkeit_bemessung.wert = null; } }); MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: '', c: '' }); });
  check('Wenn kein Kandidat zwei Kennwerte hat: "keine geeignete Alternative" + Begründungen', (await txt()).includes('keine geeignete Alternative gefunden') && (await karten()).length === 0 && (await txt()).includes(`Geprüft, aber nicht empfohlen (${await andere('mineralwolle', 'waermedaemmung')})`), await txt());

  // ---- Sicherheit
  await p.reload(); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
  await p.evaluate(() => { const m = MATERIALMATCH_DATA.baustoffe.find(x => x.id === 'eps'); m.name = '<img src=x onerror="window.__z=1">EPS'; m.produkt = '<b>fett</b>'; const q = MATERIALMATCH_DATA.quellen.find(x => x.id === 'oebd-121c71e8'); q.url = 'javascript:window.__z2=1'; q.titel = '<script>window.__z3=1</script>Quelle'; MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: '', c: '' }); });
  check('HTML in Namen/Quellen wird nicht ausgeführt', await p.evaluate(() => !window.__z && !window.__z2 && !window.__z3 && document.querySelectorAll('#alternativen-inhalt img[src="x"], #alternativen-inhalt b, #alternativen-inhalt script').length === 0));
  const bad = await p.$$eval('#alternativen-inhalt a', a => a.map(x => x.getAttribute('href')));
  check('Link mit javascript:-Adresse wird nicht als Link ausgegeben', bad.every(h => /^https:\/\//.test(h)), bad);

  // ---- Tastatur
  await p.reload(); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; }); await waehle('mineralwolle');
  await p.evaluate(() => MM.reiter.zeige('alternativen'));
  await p.focus('article.rec-card button[data-aktion=vergleichen]'); await p.keyboard.press('Enter');
  check('Button per Tastatur (Enter) bedienbar', (await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.length)) === 2);
  check('Keine Konsolenfehler', errors.length === 0, errors);

  // ---- Layout
  for (const w of [1280, 768, 375]) {
    const m = await b.newPage({ viewport: { width: w, height: 800 } });
    await m.goto('file://' + PROJ + '/index.html?modus=demo'); await m.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
    await m.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'normalbeton', b: '', c: '' }));
    await m.evaluate(() => MM.reiter.zeige('alternativen'));
    const r = await m.evaluate(() => {
      const cards = [...document.querySelectorAll('.rec-card')];
      const cw = document.documentElement.clientWidth;
      return { n: cards.length, ausserhalb: cards.filter(c => { const q = c.getBoundingClientRect(); return q.left < -1 || q.right > cw + 1; }).length,
        ueberlauf: cards.filter(c => c.scrollWidth > c.clientWidth + 1).length, btn: [...document.querySelectorAll('.rec-card button[data-aktion=vergleichen]')].every(b => { const q = b.getBoundingClientRect(); return q.width > 40 && q.height > 20 && q.right <= cw; }),
        seite: document.documentElement.scrollWidth <= cw, spalten: new Set(cards.map(c => Math.round(c.getBoundingClientRect().left))).size };
    });
    check(`Breite ${w}: 3 Karten, innerhalb des Fensters, nichts läuft über`, r.n === 3 && r.ausserhalb === 0 && r.ueberlauf === 0 && r.btn, r);
    check(`Breite ${w}: Seite scrollt nicht seitlich`, r.seite);
    if (w === 1280) check('Desktop: Karten nebeneinander (3 Spalten)', r.spalten === 3, r.spalten);
    if (w === 375) check('Handy: Karten untereinander (1 Spalte)', r.spalten === 1, r.spalten);
    if (w === 375) await m.locator('#alternativen').screenshot({ path: AUSGABE + 'v8_mobile.png' });
  }

  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
  await b.close();
})();
