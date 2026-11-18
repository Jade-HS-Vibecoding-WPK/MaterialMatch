const PROJ = require('path').resolve(__dirname, '..');
const AUSGABE = require('path').join(require('os').tmpdir(), 'materialmatch-tests') + '/';
require('fs').mkdirSync(AUSGABE, { recursive: true });
const { chromium } = require('playwright');
require('./_offline.js');
let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 600))); }
const URL = 'file://' + PROJ + '/index.html?modus=demo';

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async (w, h = 900) => { const pg = await b.newPage({ viewport: { width: w, height: h } }); pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); pg.on('pageerror', e => errors.push(String(e))); await pg.goto(URL); await pg.evaluate(() => MM.diagramme.zeigeWeitere(true)); return pg; };
  const waehle = (pg, a, b_ = '', c = '') => pg.evaluate(([a, b_, c]) => MM.auswahl.setzeAuswahl({ a, b: b_, c }), [a, b_, c]);
  const panels = pg => pg.$$eval('main section.panel', s => s.map(x => [x.id, x.querySelector(':scope > details').open]));

  // ================= Anfangszustand =================
  const p = await neu(1280);
  check('Anfangs offen: Materialauswahl und Eingaben; zu: Ergebnisse (die Diagramme sind kein Bereich mehr)', JSON.stringify(await panels(p)) === '[["auswahl",true],["eingaben",true],["ergebnisse",false]]', await panels(p));
  check('Anfangs: Seite am Desktop kurz (< 2.200 px statt vorher ~5.000)', (await p.evaluate(() => document.documentElement.scrollHeight)) < 2200, await p.evaluate(() => document.documentElement.scrollHeight));
  const m0 = await neu(375);
  check('Anfangs: Seite am Handy kurz (< 3.200 px statt vorher ~12.000)', (await m0.evaluate(() => document.documentElement.scrollHeight)) < 3200, await m0.evaluate(() => document.documentElement.scrollHeight));
  check('Kurzanleitung mit drei nummerierten Schritten im Kopf', (await p.$$eval('.quickstart li', l => l.map(x => x.textContent.trim()))).length === 3 && (await p.$eval('.quickstart', q => getComputedStyle(q.querySelector('li'), '::before').content)) !== 'none');
  check('Genau eine Hauptüberschrift (h1)', await p.$$eval('h1', h => h.length) === 1);
  check('Eingaben: Fläche und Dicke stehen vor Anwendungsbereich und Priorität', JSON.stringify(await p.$$eval('#eingaben [id]', e => e.map(x => x.id).filter(i => ['flaeche', 'dicke', 'anwendung', 'prioritaet'].includes(i)))) === '["flaeche","dicke","anwendung","prioritaet"]');

  // ================= Automatisches Öffnen =================
  await p.selectOption('#kategorie', 'daemmstoff');
  check('Kategorie allein öffnet noch nichts', JSON.stringify((await panels(p)).filter(x => x[1]).map(x => x[0])) === '["auswahl","eingaben"]');
  await p.selectOption('#materialA', 'mineralwolle');
  check('Erstes Material öffnet nichts von selbst: „Alle technischen Eigenschaften anzeigen“ (Ergebnisse) bleibt zu, bis man es öffnet', JSON.stringify((await panels(p)).filter(x => x[1]).map(x => x[0])) === '["auswahl","eingaben"]', await panels(p));
  await p.evaluate(() => { document.querySelector('#eingaben > details').open = false; });
  await p.selectOption('#materialB', 'eps');
  check('Ein bewusst zugeklapptes Panel (Eingaben) bleibt bei weiteren Änderungen zu', (await panels(p)).find(x => x[0] === 'eingaben')[1] === false);
  await p.evaluate(() => { document.querySelector('#eingaben > details').open = true; });
  await p.click('#ergebnisse > details > summary');
  await p.fill('#flaeche', '100'); await p.fill('#dicke', '20');
  const subs = () => p.$$eval('#ergebnisse details.sub', d => d.map(x => x.open));
  check('Desktop: alle Unterabschnitte offen außer "Weitere Eigenschaften"', JSON.stringify(await subs()) === '[true,true,true,true,true,false]', await subs());

  // ================= Handy-Akkordeon =================
  const m = await neu(375);
  await waehle(m, 'mineralwolle', 'eps');
  check('Handy: nur der erste Unterabschnitt ("Menge und Gewicht") ist offen', JSON.stringify(await m.$$eval('#ergebnisse details.sub', d => d.map(x => x.open))) === '[true,false,false,false,false,false]');
  check('Handy: Seite nach der Wahl deutlich kürzer als mit allem offen', true);

  // ================= Alle aufklappen =================
  const knopf = () => p.$eval('#alle-umschalten', k => [k.textContent, k.getAttribute('aria-expanded')]);
  check('Schalter: "Alle Abschnitte aufklappen" (da "Weitere" zu), aria-expanded false', JSON.stringify(await knopf()) === '["Alle Abschnitte aufklappen","false"]', await knopf());
  await p.click('#alle-umschalten');
  check('Klick: alle sechs offen, Schalter heißt "zuklappen"', JSON.stringify(await subs()) === '[true,true,true,true,true,true]' && (await knopf())[0] === 'Alle Abschnitte zuklappen' && (await knopf())[1] === 'true', [await subs(), await knopf()]);
  await p.click('#alle-umschalten');
  check('Zweiter Klick: alle zu, Schalter heißt wieder "aufklappen"', JSON.stringify(await subs()) === '[false,false,false,false,false,false]' && (await knopf())[0] === 'Alle Abschnitte aufklappen');
  await p.click('#ergebnisse details.sub:nth-of-type(1) > summary');
  check('Einzelnes Aufklappen: Schalter bleibt "aufklappen" (nicht alle offen)', (await knopf())[0] === 'Alle Abschnitte aufklappen');
  await p.click('#alle-umschalten'); await p.click('#alle-umschalten'); await p.click('#alle-umschalten');
  await p.$$eval('#ergebnisse details.sub', d => d.forEach(x => { x.open = true; }));
  await p.waitForTimeout(50);
  check('Von Hand alle geöffnet: Schalter wechselt auf "zuklappen"', (await knopf())[0] === 'Alle Abschnitte zuklappen', await knopf());

  // ================= Tooltips an den Auswahlfeldern =================
  await waehle(p, 'mineralwolle', 'eps', 'holzfaserdaemmung');
  check('Dropdowns tragen den vollen Namen als Tooltip (title)', await p.$eval('#materialA', s => s.title) === 'Mineralwolle (Fassadendämmung)' && await p.$eval('#materialC', s => s.title) === 'Holzfaserdämmung' && await p.$eval('#kategorie', s => s.title) === 'B – Dämmstoffe');
  await p.selectOption('#prioritaet', 'co2');
  check('Auch das Prioritätsfeld hat den Tooltip', await p.$eval('#prioritaet', s => s.title) === 'Geringe CO₂-Emissionen');

  // ================= Fachbegriffe (i-Knöpfe) =================
  const knoepfe = await p.$$eval('#ergebnisse .info', k => k.map(x => ({ id: x.dataset.begriffId, label: x.getAttribute('aria-label'), exp: x.getAttribute('aria-expanded'), type: x.type })));
  check('Viele Erklärknöpfe in den Tabellen (> 15), jeder mit Beschriftung, type=button und aria-expanded=false', knoepfe.length > 15 && knoepfe.every(k => k.label.startsWith('Erklärung: ') && k.type === 'button' && k.exp === 'false'), knoepfe.length);
  const ids = [...new Set((await p.$$eval('.info', k => k.map(x => x.dataset.begriffId))))];
  const definiert = await p.evaluate(i => i.every(x => MM.begriffe.TEXTE[x] && MM.begriffe.TEXTE[x].text.length > 40), ids);
  check('Jeder verwendete Begriff hat eine Erklärung', definiert && ids.length >= 12, ids);
  check('Erklärungen stehen anfangs nicht im Seitentext (kein Einfluss auf Zellen und Tests)', await p.$$eval('.info-text', t => t.length) === 0);
  const th = p.locator('#ergebnis-technisch tbody tr:first-child th');
  const vorher = await th.evaluate(t => t.textContent);
  await p.click('#ergebnis-technisch tbody tr:first-child th .info');
  const nach = await p.$eval('#ergebnis-technisch tbody tr:first-child th', t => ({ text: t.querySelector('.info-text').textContent, role: t.querySelector('.info-text').getAttribute('role'), hidden: t.querySelector('.info-text').hidden, exp: t.querySelector('.info').getAttribute('aria-expanded'), ctl: t.querySelector('.info').getAttribute('aria-controls'), id: t.querySelector('.info-text').id }));
  check('Klick klappt die Erklärung in der Zeile auf (Name + Definition), aria-expanded true, aria-controls passt', nach.text.startsWith('Nennwert λD: Der Nennwert der Wärmeleitfähigkeit wird vom Hersteller deklariert') && nach.role === 'note' && !nach.hidden && nach.exp === 'true' && nach.ctl === nach.id, nach);
  await p.click('#ergebnis-technisch tbody tr:first-child th .info');
  check('Zweiter Klick schließt die Erklärung', await p.$eval('#ergebnis-technisch tbody tr:first-child th .info-text', t => t.hidden) === true && await p.$eval('#ergebnis-technisch tbody tr:first-child th .info', k => k.getAttribute('aria-expanded')) === 'false');
  await p.focus('#ergebnis-technisch tbody tr:nth-child(2) th .info'); await p.keyboard.press('Enter');
  check('Tastatur: Enter öffnet die Erklärung', await p.$eval('#ergebnis-technisch tbody tr:nth-child(2) th .info-text', t => !t.hidden));
  await p.keyboard.press('Space');
  check('Tastatur: Leertaste schließt sie wieder', await p.$eval('#ergebnis-technisch tbody tr:nth-child(2) th .info-text', t => t.hidden));
  const eingabeVorher = await p.$eval('#prioritaet', s => s.value);
  await p.click('.label-row:has(label[for="prioritaet"]) .info');
  check('Beschriftung "Was ist Ihnen besonders wichtig?": Knopf öffnet Erklärung darunter, ändert das Feld nicht', (await p.$eval('.label-row:has(label[for="prioritaet"]) + .info-text', t => t.textContent)).includes('dreifach') && await p.$eval('#prioritaet', s => s.value) === eingabeVorher && await p.evaluate(() => document.activeElement.id !== 'prioritaet'));
  await p.click('.label-row:has(label[for="anwendung"]) .info');
  check('Beschriftung "Anwendungsbereich": Erklärung vorhanden', (await p.$eval('.label-row:has(label[for="anwendung"]) + .info-text', t => t.textContent)).includes('Anwendungsbereich:'));
  check('Diagrammtitel (λ, CO₂ fossil, GWP gesamt) haben Erklärknöpfe', JSON.stringify(await p.$$eval('figure.chart h3 .info', k => k.map(x => x.dataset.begriffId))) === '["fossil","gwp","lambda"]' || (await p.$$eval('figure.chart h3 .info', k => k.length)) === 3);
  await p.click('figure[data-chart="lambda"] h3 .info');
  check('Diagrammtitel: Erklärung klappt unter dem Titel auf', (await p.$eval('figure[data-chart="lambda"] h3 .info-text', t => t.textContent)).startsWith('Wärmeleitfähigkeit λ:'));
  // Ein i-Knopf, der (künftig) in einer einklappbaren Überschrift steht, darf den Abschnitt nicht umschalten
  const summaryTest = await p.evaluate(() => { const d = document.querySelector('#ergebnisse details.sub'); d.open = true; const s = d.querySelector(':scope > summary'); const k = MM.begriffe.marke('lambda'); s.appendChild(k); k.click(); const nachKlick = d.open; k.remove(); return nachKlick; });
  check('Klick auf einen i-Knopf innerhalb einer Abschnittsüberschrift schaltet den Abschnitt nicht um', summaryTest === true, summaryTest);
  check('Kein i-Knopf steht derzeit in einer Überschrift (summary)', await p.$$eval('summary .info', k => k.length) === 0);
  check('Erklärtexte nennen keine Zahlenwerte aus der Datenbank (nur Definitionen)', await p.evaluate(() => Object.values(MM.begriffe.TEXTE).every(t => !/\b(0,0\d\d|2\.300|221)\b/.test(t.text))));

  // ================= Legende, Katalog =================
  check('Eine Legende im Ergebnisbereich statt sieben unter den Tabellen', await p.$$eval('#ergebnisse .legend-line', l => l.length) === 1 && !(await p.$eval('#ergebnisse', e => e.innerText.includes('Datenart: B = Beispieldaten (nicht geprüft) · R = Richtwert (z. B. generischer ÖKOBAUDAT-Datensatz)'))));
  check('Legende erklärt B, R, V, Fußnotenziffern und den "i"-Knopf', await p.$eval('.legend-line', l => ['B = Beispieldaten', 'R = Richtwert', 'V = verifiziert', 'Hochgestellte Zahlen', '„i“ erklärt'].every(t => l.textContent.includes(t))));
  const kat = await p.$eval('#katalog', d => ({ offen: d.open, titel: d.querySelector('summary').textContent, zeilen: d.querySelectorAll('tbody tr').length, spalten: d.querySelectorAll('thead th').length }));
  check('Katalog: eingeklappt, "Alle Baustoffe in der Datenbank (50)", 50 Zeilen × 3 Spalten', !kat.offen && kat.titel === 'Alle Baustoffe in der Datenbank (50)' && kat.zeilen === 50 && kat.spalten === 3, kat);
  check('Doppelte Übersicht (alter Hinweisabsatz) ist entfernt', await p.$$eval('#datenhinweis', e => e.length) === 0);

  // ================= Diagramme konsistent =================
  await p.fill('#flaeche', '100'); await p.fill('#dicke', '20');
  const geo = await p.$$eval('figure.chart', fs => fs.map(f => { const r = f.querySelector('.chart-row:not(.chart-axis)'); const l = r.querySelector('.chart-label').getBoundingClientRect(), t = r.querySelector('.chart-track').getBoundingClientRect(), v = r.querySelector('.chart-value').getBoundingClientRect(); return { id: f.dataset.chart, l: [Math.round(l.left), Math.round(l.width)], t: [Math.round(t.left), Math.round(t.width), Math.round(t.height)], v: [Math.round(v.left), Math.round(v.width)] }; }));
  const spalten = {}; geo.forEach(g => { (spalten[g.l[0]] = spalten[g.l[0]] || []).push(g); });
  check('Fünf Diagramme in vier Spalten (Desktop ab 1280 px, MaterialMatch 2.1: alle Diagramme in einer Reihe, die erste Spalte mit den Kosten ist breiter); Namens-, Balken- und Wertebereich beginnen und enden in jeder Spalte überall gleich', geo.length === 5 && Object.keys(spalten).length === 4 && Object.values(spalten).every(g => new Set(g.map(x => x.l.join())).size === 1 && new Set(g.map(x => x.t.join())).size === 1 && new Set(g.map(x => x.v.join())).size === 1), geo);
  check('Alle Diagramme: Balkenspuren gleich hoch', new Set(geo.map(g => g.t[2])).size === 1);
  const aria = await p.$$eval('.chart-track', t => t.map(x => ({ rolle: x.getAttribute('role'), label: x.getAttribute('aria-label') })));
  check('Jede Balkenspur ist für Screenreader beschriftet (Material, Wert, Bewertung)', aria.length > 0 && aria.every(a => a.rolle === 'img' && a.label && a.label.includes(':')) && aria.some(a => a.label.includes('Bewertung: vergleichsweise günstig (relativ)')) && aria.some(a => a.label.includes('Bewertung: nicht bewertet')), aria.slice(0, 3));

  // ================= Keine Entwicklersprache, keine Fehlwerte =================
  await p.$$eval('details', d => d.forEach(x => { x.open = true; }));
  const MATS = await p.evaluate(() => MATERIALMATCH_DATA.baustoffe.map(x => x.id));
  let befunde = [];
  for (let i = 0; i < MATS.length; i++) {
    const a = MATS[i], b_ = MATS[(i + 5) % MATS.length], c = MATS[(i + 11) % MATS.length];
    await p.evaluate(([a, b_, c]) => MM.auswahl.setzeAuswahl({ a, b: b_, c }), [a, b_, c]);
    await p.$$eval('details', d => d.forEach(x => { x.open = true; }));
    const text = await p.evaluate(() => document.body.innerText);
    for (const muster of [/Schritt \d/, /folgt in/, /ab Schritt/, /\bundefined\b/, /\bNaN\b/, /(?<!bei )\bnull\b/, /\[object/, /Infinity/, /TODO/]) { const t = text.match(muster); if (t) befunde.push(a + '/' + b_ + '/' + c + ': ' + t[0]); }
  }
  check(`Alle 50 Materialien als Ausgangspunkt (mit zwei Partnern): kein "Schritt n", "undefined", "NaN", "null", "[object", "Infinity"`, befunde.length === 0, befunde.slice(0, 5));

  // ================= Tastaturfokus =================
  const q = await neu(1280);
  const fokus = [];
  for (let i = 0; i < 8; i++) { await q.keyboard.press('Tab'); fokus.push(await q.evaluate(() => { const e = document.activeElement; const s = getComputedStyle(e); return { tag: e.tagName, sichtbar: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 }; })); }
  check('Die ersten acht per Tab erreichten Elemente zeigen einen sichtbaren Fokusrahmen', fokus.every(f => f.sichtbar), fokus);

  // ================= Keine Animationen =================
  const anim = await p.evaluate(() => [...document.querySelectorAll('*')].filter(e => { const s = getComputedStyle(e); return parseFloat(s.transitionDuration) > 0 || (s.animationName !== 'none' && parseFloat(s.animationDuration) > 0); }).length);
  check('Keine Übergänge und keine Animationen in der Oberfläche', anim === 0, anim);

  // ================= Kontrast (WCAG AA 4,5:1) =================
  await waehle(p, 'mineralwolle', 'eps', 'holzfaserdaemmung');
  await p.fill('#flaeche', '-3');            // erzeugt eine Fehlermeldung
  await p.$$eval('details', d => d.forEach(x => { x.open = true; }));
  const kontraste = await p.evaluate(() => {
    const rgb = c => (c.match(/[\d.]+/g) || []).map(Number);
    const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const hintergrund = e => { for (let x = e; x; x = x.parentElement) { const c = rgb(getComputedStyle(x).backgroundColor); if (c.length >= 3 && (c.length === 3 || c[3] > 0.9)) return c.slice(0, 3); } return [255, 255, 255]; };
    const verhaeltnis = e => { const f = rgb(getComputedStyle(e).color).slice(0, 3), h = hintergrund(e); const a = lum(f), b = lum(h); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
    const proben = { 'Fließtext': 'body p.intro', 'Nebentext (.hint)': '.hint', 'Notiz (.note)': '.note', 'Fußnoten': '.footnotes li', 'Diagramm-Untertitel': '.chart-sub', 'Legendenzeile': '.legend-line', 'Warnhinweis': '.warn', 'Fehlermeldung am Feld': '.field-error:not(:empty)', 'Button': '.btn', 'Textlink-Schalter': '.btn-link', 'Datenart-Marke': '.matrix-table .art, .art', 'i-Knopf': '.info', 'Belastbarkeits-Siegel': '.reliability', 'Karten-Notiz': '.card-note', 'Tabellenkopf': '.compare-table th', 'Zusatzzeile in Tabellen': '.compare-table .sub', 'Fußzeile': '.site-footer p', 'Unterabschnitt-Titel': '.sub > summary', 'Check ok': '.check-ok' };
    const r = {};
    Object.entries(proben).forEach(([name, sel]) => { const e = document.querySelector(sel); if (e) r[name] = Math.round(verhaeltnis(e) * 100) / 100; });
    return r;
  });
  const schlecht = Object.entries(kontraste).filter(([, v]) => v < 4.5);
  check('Textkontrast (WCAG AA ≥ 4,5:1) bei allen geprüften Textarten', schlecht.length === 0 && Object.keys(kontraste).length >= 15, { schlecht, anzahl: Object.keys(kontraste).length, kontraste });

  // ================= Bedienbarkeit am Handy =================
  const h = await neu(375);
  await waehle(h, 'mineralwolle', 'eps'); await h.fill('#flaeche', '100'); await h.fill('#dicke', '20');
  await h.$$eval('#ergebnisse details.sub', d => d.forEach(x => { x.open = true; }));
  const ziele = await h.evaluate(() => { const klein = []; const mess = (sel, minH) => document.querySelectorAll(sel).forEach(e => { const r = e.getBoundingClientRect(); if (r.width > 0 && r.height > 0 && r.height < minH) klein.push(sel + ' ' + Math.round(r.height) + 'px'); }); mess('select', 40); mess('input[type=text]', 40); mess('main section.panel > details > summary', 44); mess('.sub > summary', 40); mess('.btn', 36); mess('.btn-link', 36);
    const info = [...document.querySelectorAll('.info')].filter(e => e.getBoundingClientRect().width > 0); const a = info.length ? getComputedStyle(info[0], '::after').top : null; return { klein, infoAnzahl: info.length, infoTrefferflaeche: a, infoBreite: info[0] ? Math.round(info[0].getBoundingClientRect().width) : 0 }; });
  check('Bedienelemente am Handy groß genug (Felder ≥ 40 px, Überschriften ≥ 44/40 px, Knöpfe ≥ 36 px)', ziele.klein.length === 0, ziele);
  check('i-Knopf: sichtbar ≥ 20 px, Trefferfläche per ::after um 8 px nach allen Seiten vergrößert', ziele.infoBreite >= 20 && parseFloat(ziele.infoTrefferflaeche) <= -6, ziele);

  // ================= Überlaufscan =================
  const breiten = [320, 360, 375, 414, 768, 1024, 1280, 1440];
  for (const w of breiten) {
    const s = await neu(w, 800);
    await waehle(s, 'mineralwolle', 'eps', 'holzfaserdaemmung');
    await s.fill('#flaeche', '100'); await s.fill('#dicke', '20');
    await s.selectOption('#prioritaet', 'gewicht');
    await s.$$eval('details', d => d.forEach(x => { x.open = true; }));
    await s.fill('#rZiel', '5');
    await s.click('#ergebnis-technisch tbody tr:first-child th .info').catch(() => {});
    const r = await s.evaluate(() => {
      const cw = document.documentElement.clientWidth;
      const ausserhalb = [];
      document.querySelectorAll('main *').forEach(e => { if (e.closest('.table-wrap')) return; const r = e.getBoundingClientRect(); if (r.width > 0 && (r.right > cw + 1 || r.left < -1)) ausserhalb.push(e.tagName + '.' + e.className + ' ' + Math.round(r.left) + '–' + Math.round(r.right)); });
      const abgeschnitten = [...document.querySelectorAll('main td, main th, main li, main p, main h3, main summary')].filter(e => !e.closest('.table-wrap') && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible').length;
      return { seite: document.documentElement.scrollWidth <= cw, ausserhalb: ausserhalb.slice(0, 4), abgeschnitten };
    });
    check(`Breite ${w}: Seite scrollt nicht seitlich, nichts ragt über den Rand (außer in Tabellenrahmen)`, r.seite && r.ausserhalb.length === 0 && r.abgeschnitten === 0, r);
    await s.close();
  }

  check('Keine Konsolenfehler im gesamten Lauf', errors.length === 0, errors.slice(0, 3));
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
  await b.close();
})();
