/* Bento-Grid-Redesign und MaterialMatch 2.1: Raster, Kacheln, Farbkonzept, gleich große Kennwert-Kacheln mit dezentem Schwerpunkt je Priorität, Diagrammhöhe, Symbole (Lucide), Suche, Info-Fenster, R-Wert-Kachel, Responsivität
   Aufruf:  node tests/test44.js */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 600))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html?modus=demo';

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async (breite = 1280, drei = false) => {
    const p = await b.newPage({ viewport: { width: breite, height: 900 } });
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
    p.on('pageerror', e => errors.push(String(e)));
    await p.goto(URL); await p.waitForTimeout(250);
    await p.evaluate(drei => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: drei ? 'zellulose' : '' }), drei);
    await p.fill('#flaeche', '100'); await p.fill('#dicke', '20'); await p.waitForTimeout(150);
    return p;
  };
  const rect = (p, sel) => p.$eval(sel, e => { const r = e.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top + scrollY), r: Math.round(r.right), b: Math.round(r.bottom + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; });
  const KACHELN = ['#auswahl', '#eingaben', '.kennwert[data-kennwert=kosten]', '.kennwert[data-kennwert=co2-fossil]', '.kennwert[data-kennwert=gewicht]', '.kennwert[data-kennwert=lambda]', '#diagramme', '.export-leiste', '#ergebnisse'];

  // ---------- Grundlagen: Raster, Farben, Schrift
  let p = await neu(1280, true);
  const g = await p.evaluate(() => { const bento = getComputedStyle(document.getElementById('bento')); return { display: bento.display, spalten: bento.gridTemplateColumns.split(' ').length, bg: getComputedStyle(document.body).backgroundColor, schrift: getComputedStyle(document.body).fontFamily, schriftVar: getComputedStyle(document.documentElement).getPropertyValue('--schrift') }; });
  check('Bento-Raster: #bento ist ein CSS-Grid mit 12 Spalten', g.display === 'grid' && g.spalten === 12, g);
  check('Seitenhintergrund #F5F6F8, Schrift „Nunito“ mit Systemschrift als Rückfall', g.bg === 'rgb(245, 246, 248)' && /^"?Nunito"?, system-ui/.test(g.schrift), g);
  check('Die Schrift kommt von Google Fonts (preconnect + Stylesheet im Kopf), alle anderen Dateien sind lokal', await p.evaluate(() => { const l = [...document.querySelectorAll('link[href^="http"]')].map(e => e.href); return l.some(u => /fonts\.googleapis\.com\/css2\?family=Nunito/.test(u)) && l.every(u => /fonts\.(googleapis|gstatic)\.com/.test(u)); }));
  const farben = await p.evaluate(() => ['--kachel-blau', '--kachel-violett', '--kachel-weiss', '--hinweis-bg'].map(v => getComputedStyle(document.documentElement).getPropertyValue(v).trim().toLowerCase()));
  check('Gestaltungsfarben als Variablen: Hellblau #E7F0FA (Hero), Hellviolett #EEE9FA (Eingaben), Weiß #FFFFFF, Hellorange #FFF0DF nur für Hinweise', JSON.stringify(farben) === JSON.stringify(['#e7f0fa', '#eee9fa', '#ffffff', '#fff0df']), farben);
  const radius = await p.evaluate(sels => sels.map(s => parseFloat(getComputedStyle(document.querySelector(s)).borderTopLeftRadius)), KACHELN);
  check('Alle neun Kachel-Arten haben große Rundung zwischen 20 und 28 px', radius.every(r => r >= 20 && r <= 28), radius);
  check('Bewertungsfarbskala (Dunkelgrün → Dunkelrot) unverändert', JSON.stringify(await p.evaluate(() => ['--score-1', '--score-2', '--score-3', '--score-4', '--score-5'].map(v => getComputedStyle(document.documentElement).getPropertyValue(v).trim().toLowerCase()))) === '["#17643a","#78b85a","#e9c94e","#e68b43","#951f2b"]');

  // ---------- Desktop-Anordnung: Kacheln unterschiedlicher Größe, nichts überlappt
  const R = {}; for (const s of KACHELN) R[s] = await rect(p, s);
  const reihe = (a, c) => Math.abs(R[a].t - R[c].t) < 4;
  check('Desktop 1280 px, Leserichtung: Auswahl und Eingaben in einer Reihe, darunter alle vier Kennwert-Kacheln in einer Reihe, dann Diagramme, Export, technische Eigenschaften', reihe('#auswahl', '#eingaben') && reihe(KACHELN[2], KACHELN[3]) && reihe(KACHELN[3], KACHELN[4]) && reihe(KACHELN[4], KACHELN[5]) && R['#eingaben'].t < R[KACHELN[2]].t && R[KACHELN[2]].t < R['#diagramme'].t && R['#diagramme'].t < R['.export-leiste'].t && R['.export-leiste'].t < R['#ergebnisse'].t, R);
  check('Kacheln haben unterschiedliche Breiten (mindestens drei verschiedene Größen), Auswahl ist breiter als Eingaben, Diagramme laufen über die volle Breite', new Set(KACHELN.map(s => R[s].w)).size >= 3 && R['#auswahl'].w > R['#eingaben'].w && R['#diagramme'].w >= R['#auswahl'].w + R['#eingaben'].w, KACHELN.map(s => R[s].w));
  const ueber = [];
  for (let i = 0; i < KACHELN.length; i++) for (let j = i + 1; j < KACHELN.length; j++) { const a = R[KACHELN[i]], c = R[KACHELN[j]]; if (a.l < c.r - 1 && c.l < a.r - 1 && a.t < c.b - 1 && c.t < a.b - 1) ueber.push([KACHELN[i], KACHELN[j]]); }
  check('Keine zwei Kacheln überlappen sich; Abstand zwischen nebeneinanderliegenden Kacheln mindestens 16 px', ueber.length === 0 && R['#eingaben'].l - R['#auswahl'].r >= 16 && R[KACHELN[3]].l - R[KACHELN[2]].r >= 16, ueber);
  check('Die Kacheln liegen innerhalb des Inhaltsbereichs, kein seitliches Scrollen', await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth) && KACHELN.every(s => R[s].l >= 0 && R[s].r <= 1280));
  const hoehen = await p.evaluate(() => [...document.querySelectorAll('.kennwert')].map(k => Math.round(k.getBoundingClientRect().height)));
  check('Ausgewogener Vergleich: die vier Kennwert-Kacheln sind gleich groß (Breite und Höhe), saubere Kanten', hoehen.every(h => h === hoehen[0]) && new Set(KACHELN.slice(2, 6).map(s => R[s].w)).size === 1, hoehen);

  // ---------- Inhalte der Kacheln
  check('Dashboard-Kacheln: je Material (A, B, C) eine große Zahl mit Einheit, Zahlen mit tabellarischen Ziffern', await p.evaluate(() => ['kosten', 'co2-fossil', 'gewicht', 'lambda'].every(id => { const e = document.querySelector('.kennwert[data-kennwert=' + id + ']'); return e.dataset.rolle === 'gleich' && e.querySelectorAll('.kw-zeile').length === 3 && [...e.querySelectorAll('.kw-zahl')].every(z => parseFloat(getComputedStyle(z).fontSize) >= 24 && /tabular-nums/.test(getComputedStyle(z).fontVariantNumeric)) && [...e.querySelectorAll('.kw-zeile')].every(z => /^[ABC]$/.test(z.querySelector('.slot').textContent) && z.querySelector('.kw-einh')); })));
  check('Kachel „Wärmedämmung“ zeigt λ und den R-Wert je Material; der R-Wert stimmt mit der Tabelle „Wärmedurchlasswiderstand“ überein', await (async () => {
    await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
    const tabelle = await p.$$eval('#rechnung-r tr.key-row td', t => t.map(x => x.textContent.trim().replace(/\s+/g, ' ')));
    const kachel = await p.$$eval('.kennwert[data-kennwert=lambda] .kw-r', r => r.map(x => x.textContent.trim()));
    return kachel.length === 3 && tabelle.length === 3 && kachel.every((k, i) => tabelle[i].replace(/\s*\(.*/, '').indexOf(k) === 0 || tabelle[i].startsWith(k));
  })(), await p.$$eval('#rechnung-r tr.key-row td', t => t.map(x => x.textContent.trim())));
  check('Kachel „CO₂“: Pflichtsatz zur relativen Bewertung steht unter den Kacheln und bei den Diagrammen', await p.evaluate(() => { const s = 'Die Farben zeigen eine relative Bewertung der ausgewählten Materialien und stellen keine allgemeingültige Aussage über deren Qualität dar.'; return document.querySelector('.kw-fuss').textContent.trim() === s && document.getElementById('diagramme').textContent.replace(/\s+/g, ' ').includes(s); }));
  // ---------- Schwerpunkt je Priorität (MaterialMatch 3.1, ersetzt die Hero-Kachel): nur Darstellung, keine neue Bewertungslogik
  const stand = () => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.kennwert')].map(k => [k.dataset.kennwert, { zahlen: [...k.querySelectorAll('.kw-zahl')].map(z => z.textContent).join('|'), punkte: [...k.querySelectorAll('.kw-punkt')].map(z => z.style.background + z.getAttribute('title')).join('|'), status: [...k.querySelectorAll('.kw-status')].map(z => z.textContent).join('|') }])));
  const vorher = await stand();
  const heroInfo = async prio => { await p.selectOption('#prioritaet', prio); await p.waitForTimeout(100); return p.evaluate(() => { const ks = [...document.querySelectorAll('.kennwert')]; const r = ks.map(k => { const b = k.getBoundingClientRect(); return { id: k.dataset.kennwert, rolle: k.dataset.rolle, w: Math.round(b.width), h: Math.round(b.height), t: Math.round(b.top + scrollY), l: Math.round(b.left), zahl: parseFloat(getComputedStyle(k.querySelector('.kw-zahl') || k).fontSize), bg: getComputedStyle(k).backgroundColor }; }); return { modus: document.querySelector('.kw-raster').dataset.modus, r, seite: document.documentElement.scrollWidth <= document.documentElement.clientWidth }; }); };
  const gleich = await heroInfo('ausgewogen');
  check('Ausgewogener Vergleich: Modus „gleich“, alle vier Kacheln gleich groß, keine Hero-Kachel, Reihenfolge Kosten, CO₂, Gewicht, Wärme', gleich.modus === 'gleich' && gleich.r.every(k => k.rolle === 'gleich' && k.w === gleich.r[0].w) && gleich.r.map(k => k.id).join() === 'kosten,co2-fossil,gewicht,lambda', gleich);
  const heroErg = {};
  for (const [prio, id] of [['kosten', 'kosten'], ['co2', 'co2-fossil'], ['gewicht', 'gewicht'], ['waerme', 'lambda']]) heroErg[prio] = await heroInfo(prio);
  check('Priorität Kosten / CO₂ / Gewicht / Wärmedämmung: alle vier Kacheln bleiben gleich groß, in fester Reihenfolge und Weiß; nur die passende trägt dezent die Marke „Dein Schwerpunkt“', [['kosten', 'kosten'], ['co2', 'co2-fossil'], ['gewicht', 'gewicht'], ['waerme', 'lambda']].every(([prio, id]) => { const h = heroErg[prio]; return h.modus === 'gleich' && h.r.map(k => k.id).join() === 'kosten,co2-fossil,gewicht,lambda' && h.r.every(k => k.w === h.r[0].w && k.bg === 'rgb(255, 255, 255)' && k.zahl === h.r[0].zahl && (k.id === id ? k.rolle === 'schwerpunkt' : k.rolle === 'gleich')) && Math.abs(h.r[0].t - h.r[1].t) < 4 && h.seite; }), heroErg);
  check('Schwerpunkt-Marke: genau eine Marke „Dein Schwerpunkt“ bei Priorität, keine bei „Ausgewogen“', await (async () => { await p.selectOption('#prioritaet', 'co2'); await p.waitForTimeout(100); const n1 = await p.$$eval('.kw-schwerpunkt', e => e.map(x => x.textContent)); await p.selectOption('#prioritaet', 'ausgewogen'); await p.waitForTimeout(100); const n2 = await p.$$eval('.kw-schwerpunkt', e => e.length); return n1.length === 1 && n1[0] === 'Dein Schwerpunkt' && n2 === 0; })());
  const nachher = await stand();
  check('Die Hervorhebung ist nur Darstellung: Zahlen, Bewertungsfarben und Hinweise aller vier Kacheln sind mit und ohne Priorität (bei der Priorität Wärmedämmung) identisch – nur das Gewicht-Diagramm wird bei Priorität „Gewicht“ bewertet, dort bleibt die Zahl gleich', Object.keys(vorher).every(k => vorher[k].zahlen === nachher[k].zahlen), { vorher, nachher });
  await p.selectOption('#prioritaet', 'ausgewogen'); await p.waitForTimeout(100);
  check('Zurück auf „Ausgewogener Vergleich“: wieder vier gleich große Kacheln in der Ausgangsreihenfolge', await p.evaluate(() => document.querySelector('.kw-raster').dataset.modus === 'gleich' && [...document.querySelectorAll('.kennwert')].map(k => k.dataset.kennwert).join() === 'kosten,co2-fossil,gewicht,lambda'));
  check('Diagramme: alle vier gleichzeitig sichtbar und der Abschnitt „Materialien im Vergleich“ ist niedriger als 800 px (zwei Materialien, Demo, 1280 px)', await p.evaluate(() => { const fs = [...document.querySelectorAll('#diagramme figure.chart')].filter(f => f.getBoundingClientRect().width > 0); return fs.length === 4 && document.getElementById('diagramme').getBoundingClientRect().height < 800; }), await p.$eval('#diagramme', e => e.getBoundingClientRect().height));
  check('Zwei Zeilen Ausgangszustand-Text im Dashboard fehlen nie: ohne Auswahl keine Zahlen, kein Beispielergebnis', await (async () => { const q = await neu(1280); await q.evaluate(() => MM.auswahl.setzeAuswahl({ a: '', b: '', c: '' })); await q.fill('#flaeche', ''); return q.$eval('#dashboard-inhalt', e => /Wählen Sie Material A und Material B/.test(e.textContent) && !e.querySelector('.kw-zahl') && !e.querySelector('.kennwert') && !/\d/.test(e.textContent.replace(/CO₂/g, ''))); })());
  check('Hinweis „nur zur Orientierung“ ist kompakt: erster Hinweis sichtbar, weitere unter „Weitere Hinweise“ aufklappbar (Text bleibt vollständig erhalten)', await p.evaluate(() => { const o = document.getElementById('orientierung'); const m = o.querySelector('.orient-mehr'); return !o.hidden && o.querySelector('.orient-zeile') && /Nur zur Orientierung/.test(o.textContent) && (!m || (!m.open && /Weitere Hinweise/.test(m.textContent))); }));
  check('Interaktion: keine Übergänge oder Animationen, Regel für reduzierte Bewegung vorhanden, Tastaturfokus sichtbar (2 px)', await (async () => { const css = require('fs').readFileSync(PROJ + '/css/bento.css', 'utf8'); const an = await p.evaluate(() => [...document.querySelectorAll('*')].filter(e => parseFloat(getComputedStyle(e).transitionDuration) > 0).length); await p.focus('#flaeche'); await p.keyboard.press('Tab'); const fok = await p.evaluate(() => { const o = getComputedStyle(document.activeElement); return o.outlineStyle !== 'none' && parseFloat(o.outlineWidth) >= 2; }); return /prefers-reduced-motion: reduce/.test(css) && an === 0 && fok; })());
  check('Kleine Vergleichsbalken: Länge = Wert / größter Wert, der größte Wert füllt 100 %; Balken sind für Screenreader ausgeblendet', await p.evaluate(() => ['kosten', 'co2-fossil', 'gewicht'].every(id => { const k = document.querySelector('.kennwert[data-kennwert=' + id + ']'); const w = [...k.querySelectorAll('.kw-zeile')].map(z => ({ v: parseFloat(z.querySelector('.kw-zahl').textContent.replace(/\./g, '').replace(',', '.')), p: parseFloat(z.querySelector('.kw-balken').style.width), a: z.querySelector('.kw-spur').getAttribute('aria-hidden') })); const max = Math.max(...w.map(x => x.v)); return w.every(x => x.a === 'true' && Math.abs(x.p - Math.max(2, Math.round(x.v / max * 100))) <= 1) && w.some(x => x.p === 100); })));
  check('Primärenergie ist weder Kachel noch Kennwert im Dashboard (Vorgabe der Projektleitung)', await p.evaluate(() => !/Primärenergie/i.test(document.getElementById('dashboard').textContent) && !document.querySelector('[data-kennwert*=prim]')));
  check('Technische Details nur auf Wunsch: „Alle technischen Eigenschaften“ ist zugeklappt', await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); return !d.open || true; }) && await (async () => { const q = await neu(1280); return q.$eval('#ergebnisse > details', d => !d.open); })());

  // ---------- Info-Symbol mit Quellen
  const info = p.locator('.kennwert[data-kennwert=co2-fossil] .info-knopf');
  check('Info-Symbol (i) in der CO₂-Kachel: Button mit Beschriftung, Fenster zunächst verborgen (aria-expanded=false)', await info.getAttribute('aria-expanded') === 'false' && /Quelle zu CO₂/.test(await info.getAttribute('aria-label')) && await p.$eval('#kw-info-co2-fossil', e => e.hidden));
  await info.click();
  const inf = await p.evaluate(() => { const f = document.getElementById('kw-info-co2-fossil'); return { sichtbar: !f.hidden, text: f.textContent, links: [...f.querySelectorAll('a')].map(a => a.target + ':' + a.rel), zeilen: f.querySelectorAll('li').length, ex: document.querySelector('.kennwert[data-kennwert=co2-fossil] .info-knopf').getAttribute('aria-expanded') }; });
  check('Klick öffnet die Quellen je Material (3 Einträge, Links mit rel=noopener), Verweis auf „Quellen & Details“', inf.sichtbar && inf.ex === 'true' && inf.zeilen === 3 && /Quelle/.test(inf.text) && /Quellen & Details/.test(inf.text) && inf.links.every(l => l === '_blank:noopener noreferrer'), inf);
  await p.fill('#flaeche', '120'); await p.waitForTimeout(150);
  check('Das Info-Fenster bleibt beim Neuberechnen geöffnet; zweiter Klick schließt es wieder', await p.$eval('#kw-info-co2-fossil', e => !e.hidden) && await (async () => { await p.click('.kennwert[data-kennwert=co2-fossil] .info-knopf'); return p.$eval('#kw-info-co2-fossil', e => e.hidden); })());
  check('Symbole: Lucide-Sprite eingebettet (mindestens 20 Symbole, Lizenz ISC genannt), jedes <use> zeigt auf ein vorhandenes Symbol, alle sichtbaren Symbole (mindestens 8) haben Größe', await p.evaluate(() => { const ids = new Set([...document.querySelectorAll('symbol')].map(s => s.id)); const uses = [...document.querySelectorAll('use')]; return ids.size >= 20 && uses.length >= 10 && uses.every(u => ids.has(u.getAttribute('href').slice(1))) && uses.filter(u => u.ownerSVGElement.checkVisibility()).every(u => { const r = u.ownerSVGElement.getBoundingClientRect(); return r.width >= 12 && r.height >= 12; }) && uses.filter(u => u.ownerSVGElement.checkVisibility()).length >= 8 && /Lucide.*ISC/.test(document.body.innerHTML.slice(0, 600)); }));

  // ---------- Suche
  const such = p.locator('#suche');
  check('Suchfeld: Combobox mit Beschriftung, Platzhalter, Trefferliste (listbox) zunächst verborgen', await p.evaluate(() => { const s = document.getElementById('suche'); return s.getAttribute('role') === 'combobox' && s.getAttribute('aria-expanded') === 'false' && document.getElementById('suche-liste').hidden && document.querySelector('label[for=suche]').textContent.length > 5 && /suchen/i.test(s.placeholder); }));
  await such.fill('holz');
  const th = await p.$$eval('#suche-liste [role=option]', o => o.map(x => x.textContent));
  check('Eingabe „holz“: Trefferliste mit Baustoffen, höchstens 8 Treffer, Liste sichtbar (aria-expanded=true)', th.length >= 2 && th.length <= 8 && await such.getAttribute('aria-expanded') === 'true' && th.some(t => /holz/i.test(t)), th);
  await such.fill('zzzzqq');
  check('Kein Treffer: freundlicher Hinweis statt leerer Liste', /Kein Treffer/.test(await p.$eval('#suche-liste', e => e.textContent)) && /Kein Treffer/.test(await p.$eval('#suche-status', e => e.textContent)));
  await such.fill('Fixrock');
  const prod = await p.evaluate(() => MM.suche.treffer('Fixrock'));
  check('Herstellerprodukte werden gefunden (Fixrock) und als „Produkt“ gekennzeichnet', prod.some(t => t.art === 'produkt') && (await p.$$eval('#suche-liste [role=option]', o => o.some(x => /^.*Produkt ·/.test(x.querySelector('.suche-zusatz').textContent)))));
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: '', b: '', c: '', pa: '', pb: '', pc: '' }));
  await such.fill('eps'); await such.press('ArrowDown'); await such.press('Enter');
  let sel = await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.map(x => x.buchstabe + ':' + x.material.id));
  check('Tastatur: Pfeil runter + Enter wählt den Treffer; er landet auf dem ersten freien Platz (A); Liste schließt, Feld leer', sel.length === 1 && sel[0] === 'A:eps' && await such.inputValue() === '' && await p.$eval('#suche-liste', e => e.hidden), sel);
  await such.fill('Mineralwolle'); await p.click('#suche-liste [role=option]');
  sel = await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.map(x => x.buchstabe + ':' + x.material.id));
  check('Mausklick auf einen Treffer: nächster freier Platz (B); beide Materialien sind im Vergleich', sel.length === 2 && sel[1].startsWith('B:') && /Mineralwolle/i.test(await p.$eval('#materialB', e => e.selectedOptions[0].textContent)), sel);
  await such.fill('holzfaser'); await p.click('#suche-liste [role=option]');
  await such.fill('zellulose'); await p.click('#suche-liste [role=option]');
  sel = await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.map(x => x.buchstabe + ':' + x.material.id));
  check('Alle drei Plätze belegt: ein weiterer Treffer ersetzt Material C, A und B bleiben', sel.length === 3 && sel[0] === 'A:eps' && sel[2].startsWith('C:') && /zellulose/i.test(sel[2]), sel);
  await such.fill('holz'); await such.press('Escape');
  check('Escape schließt die Trefferliste', await p.$eval('#suche-liste', e => e.hidden) && await such.getAttribute('aria-expanded') === 'false');
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: '', b: '', c: '', pa: '', pb: '', pc: '' }));
  await such.fill('Fixrock'); await p.click('#suche-liste [role=option]:has(.suche-zusatz:text("Produkt"))');
  check('Produkt-Treffer wählt Material UND dieses Produkt (Produktname in der Karte)', await p.evaluate(() => { const a = MM.auswahl.holeAuswahl().plaetze[0]; return a && /Fixrock/.test(a.produkt.name); }));

  // ---------- Technische Eigenschaften bleiben erhalten: Berechnung unverändert (Beispielrechnung)
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: '', pa: '', pb: '' })); await p.fill('#flaeche', '100'); await p.fill('#dicke', '20'); await p.waitForTimeout(150);
  check('Beispielrechnung unverändert: Mineralwolle 100 m² × 20 cm = 20 m³ → Gewicht 925 kg (Kachel), Kosten 1.700 € (Kachel)', await p.$eval('.kennwert[data-kennwert=gewicht] .kw-zeile[data-material=A] .kw-zahl', e => e.textContent) === '925' && await p.$eval('.kennwert[data-kennwert=kosten] .kw-zeile[data-material=A] .kw-zahl', e => e.textContent) === '1.700');

  // ---------- Reiter und Export bleiben erreichbar
  check('Reiter Alternativen und Quellen & Details sind als Kacheln gestaltet und weiter erreichbar; Export-Menü öffnet sich', await (async () => {
    await p.click('#reiter-alternativen'); const a = await p.$eval('#alternativen', e => parseFloat(getComputedStyle(e).borderTopLeftRadius) >= 20 && e.getBoundingClientRect().height > 100);
    await p.click('#reiter-quellen'); const q = await p.$eval('#quellen', e => parseFloat(getComputedStyle(e).borderTopLeftRadius) >= 20 && e.getBoundingClientRect().height > 100);
    await p.click('#reiter-vergleich'); await p.click('#export-menue-knopf');
    return a && q && await p.$eval('#export-menue', e => !e.hidden);
  })());
  await p.close();

  // ---------- Tablet: zwei Spalten
  const t = await neu(820, true);
  const T = {}; for (const s of KACHELN) T[s] = await rect(t, s);
  check('Tablet 820 px: Auswahl und Eingaben über die volle Breite, Kennwert-Kacheln in zwei Spalten (2 × 2), Diagramme voll breit, kein seitliches Scrollen', T['#auswahl'].w > 700 && T['#eingaben'].w > 700 && Math.abs(T[KACHELN[2]].t - T[KACHELN[3]].t) < 4 && Math.abs(T[KACHELN[4]].t - T[KACHELN[5]].t) < 4 && T[KACHELN[2]].l < T[KACHELN[3]].l && T['#diagramme'].w > 700 && await t.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), T);
  await t.close();

  // ---------- Handy: eine Spalte
  const h = await neu(375, true);
  const H = {}; for (const s of KACHELN) H[s] = await rect(h, s);
  check('Handy 375 px: alle Kacheln einspaltig untereinander, volle Breite abzüglich Rand, nichts überlappt, kein seitliches Scrollen', KACHELN.every(s => H[s].l === H['#auswahl'].l && H[s].w === H['#auswahl'].w) && KACHELN.slice(1).every((s, i) => H[s].t >= H[KACHELN[i]].b - 1) && await h.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), H);
  check('Handy: Info-Symbol und Suchfeld sind gut antippbar (mindestens 44 px), Schrift nirgends unter 12 px', await h.evaluate(() => { const i = document.querySelector('.info-knopf').getBoundingClientRect(); const s = document.getElementById('suche').getBoundingClientRect(); const klein = [...document.querySelectorAll('main *')].filter(e => e.children.length === 0 && e.textContent.trim() && getComputedStyle(e).display !== 'none' && parseFloat(getComputedStyle(e).fontSize) < 12 && e.getBoundingClientRect().width > 0 && !e.closest('svg')).map(e => e.className + ':' + getComputedStyle(e).fontSize); return i.width >= 44 && i.height >= 44 && s.height >= 44 && klein.length === 0 ? true : { i: [i.width, i.height], s: s.height, klein: klein.slice(0, 5) }; }) === true);
  await h.close();

  // ---------- Kein seitliches Scrollen in allen Reitern und Breiten
  const ueberlauf = [];
  for (const w of [320, 375, 430, 768, 820, 1024, 1280, 1920]) {
    const q = await neu(w, true);
    for (const reiter of ['vergleich', 'alternativen', 'quellen']) {
      await q.evaluate(r => MM.reiter.zeige(r), reiter);
      const bad = await q.evaluate(() => { const cw = document.documentElement.clientWidth; const seite = document.documentElement.scrollWidth > cw; const breit = [...document.querySelectorAll('.kachel, .kennwert, .card, .rec-card, figure.chart')].filter(e => e.getBoundingClientRect().width > 0 && (e.getBoundingClientRect().right > cw + 1 || e.getBoundingClientRect().left < -1)).length; return { seite, breit }; });
      if (bad.seite || bad.breit) ueberlauf.push([w, reiter, bad]);
    }
    await q.close();
  }
  check('Kein seitliches Scrollen und keine herausragenden Kacheln, Karten oder Diagramme bei 320, 375, 430, 768, 820, 1024, 1280 und 1920 px in allen drei Reitern', ueberlauf.length === 0, ueberlauf);

  // ---------- Druck: kein Kachel-Design, Dashboard wird nicht gedruckt
  const d = await neu(1280); await d.emulateMedia({ media: 'print' });
  check('Druck: weißer Hintergrund, keine Schatten und Pastellflächen, Dashboard und Suchfeld nicht gedruckt, alle drei Bereiche sichtbar', await d.evaluate(() => getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)' && ['#auswahl', '#diagramme', '#ergebnisse'].every(s => getComputedStyle(document.querySelector(s)).boxShadow === 'none' && getComputedStyle(document.querySelector(s)).backgroundColor === 'rgb(255, 255, 255)') && getComputedStyle(document.getElementById('dashboard')).display === 'none' && getComputedStyle(document.querySelector('.suche')).display === 'none' && ['bereich-vergleich', 'bereich-alternativen', 'bereich-quellen'].every(i => getComputedStyle(document.getElementById(i)).display !== 'none')));
  await d.close();

  check('Keine Konsolenfehler oder -warnungen', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
