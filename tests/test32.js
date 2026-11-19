/* MaterialMatch 2.0, Schritt 5: Dashboard „Vergleich auf einen Blick“ und Lese-Schnittstelle MM.diagramme.ergebnisse()
   Aufruf:  node tests/test32.js */
const { chromium } = require('playwright');
require('./_offline.js');
const fs = require('fs');
const path = require('path');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 600))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html?modus=demo';

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async (breite = 1280, url = URL) => { const p = await b.newPage({ viewport: { width: breite, height: 900 } }); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); await p.goto(url); await p.waitForTimeout(250); return p; };
  const setze = (p, o) => p.evaluate(o => MM.auswahl.setzeAuswahl(o), o);
  const eingabe = async (p, f, d) => { await p.fill('#flaeche', String(f)); await p.fill('#dicke', String(d)); };

  // Vergleich Dashboard <-> Diagramme (gleiche Zahlen, gleiche Farben), direkt aus dem DOM beider Bereiche
  const abgleich = p => p.evaluate(() => {
    const rgb = c => { const t = document.createElement('span'); t.style.background = c || 'transparent'; document.body.appendChild(t); const v = getComputedStyle(t).backgroundColor; t.remove(); return v; };
    const paare = { kosten: 'kosten', 'co2-fossil': 'co2-fossil', gewicht: 'gewicht', lambda: 'lambda' };
    const abw = []; let geprueft = 0;
    Object.keys(paare).forEach(id => {
      const fig = document.querySelector(`figure.chart[data-chart="${id}"]`);
      const karte = document.querySelector(`.kennwert[data-kennwert="${id}"]`);
      if (!fig) { if (karte && karte.querySelector('.kw-zeile')) abw.push([id, 'Diagramm fehlt, Karte hat Zeilen']); return; }
      if (!karte) { abw.push([id, 'Karte fehlt']); return; }
      fig.querySelectorAll('.chart-row[data-material]').forEach(z => {
        const m = z.getAttribute('data-material');
        const li = karte.querySelector(`.kw-zeile[data-material="${m}"]`);
        if (!li) { abw.push([id, m, 'Zeile fehlt']); return; }
        geprueft++;
        const wertDiagramm = z.getAttribute('data-wert');
        const zahl = li.querySelector('.kw-zahl');
        if (wertDiagramm === '') { if (zahl) abw.push([id, m, 'Karte zeigt Zahl, Diagramm nicht']); }
        else {
          const dia = z.querySelector('.chart-num').textContent.trim();
          if (!zahl || zahl.textContent.trim() !== dia) abw.push([id, m, 'Zahl', zahl && zahl.textContent, dia]);
          const dot = getComputedStyle(li.querySelector('.kw-punkt')).backgroundColor;
          if (dot !== rgb(z.getAttribute('data-farbe'))) abw.push([id, m, 'Farbe', dot, z.getAttribute('data-farbe')]);
        }
      });
    });
    return { abw, geprueft };
  });

  let p = await neu();
  check('Der Bereich „Vergleich auf einen Blick“ steht im Reiter „Vergleich“ zwischen den Eingaben und den Diagrammen, mit Überschrift (h2)', await p.evaluate(() => { const d = document.getElementById('dashboard'); return d.tagName === 'SECTION' && d.querySelector('h2').textContent === 'Vergleich auf einen Blick' && document.getElementById('bereich-vergleich').contains(d) && d.previousElementSibling.id === 'eingaben' && d.nextElementSibling.id === 'orientierung' && d.nextElementSibling.nextElementSibling.id === 'diagramme'; }));
  check('Ohne Auswahl: kurzer Hinweis, keine Karten', await p.$eval('#dashboard-inhalt', e => /Wähle Material A und Material B/.test(e.textContent) && !e.querySelector('.kennwert')));

  // ---- Zwei Materialien ohne Eingabe
  await setze(p, { a: 'mineralwolle', b: 'eps', c: '' });
  const ohne = await p.$$eval('.kennwert', k => k.map(x => [x.getAttribute('data-kennwert'), x.querySelector('.kw-leer') ? x.querySelector('.kw-leer').textContent : null, x.querySelectorAll('.kw-zeile').length]));
  check('Ohne Fläche und Dicke: vier Karten; Kosten, CO₂ und Gewicht nennen „Fläche und Dicke eingeben“, die Wärmedämmung (λ) zeigt schon beide Materialien', ohne.length === 4 && ohne.filter(x => x[1] === 'Fläche und Dicke eingeben.').map(x => x[0]).join() === 'kosten,co2-fossil,gewicht' && ohne[3][2] === 2, ohne);

  // ---- Mit Eingabe
  await eingabe(p, 100, 20);
  check('Mit Fläche und Dicke: vier Karten (Materialkosten, CO₂ (fossil), Gewicht, Wärmedämmung) mit je einer Zeile pro Material', JSON.stringify(await p.$$eval('.kennwert h3', h => h.map(x => x.textContent.replace(/\s+/g, ' ').trim()))) === JSON.stringify(['Materialkosten (€)', 'CO₂ (fossil) (kg CO₂e)', 'Gewicht (kg)', 'Wärmedämmung']) && (await p.$$eval('.kennwert', k => k.map(x => x.querySelectorAll('.kw-zeile').length))).every(n => n === 2));
  let a = await abgleich(p);
  check('Zahlen und Farbpunkte der Karten stimmen Zeile für Zeile mit den Diagrammen überein (Kosten, CO₂, Gewicht, λ)', a.abw.length === 0 && a.geprueft === 8, a);
  const werte = await p.$$eval('.kennwert .kw-zeile', z => z.map(x => [x.closest('.kennwert').getAttribute('data-kennwert'), x.getAttribute('data-material'), x.querySelector('.kw-zahl') ? x.querySelector('.kw-zahl').textContent : null]));
  check('Handrechnung (Demo): Mineralwolle 100 m² × 20 cm = 20 m³: Gewicht 925 kg (20 × 46,25), EPS 500 kg; CO₂ fossil 1.329 / 1.728 kg; Kosten 1.700 / 1.400 €', JSON.stringify(werte.filter(x => x[0] !== 'lambda')) === JSON.stringify([['kosten', 'A', '1.700'], ['kosten', 'B', '1.400'], ['co2-fossil', 'A', '1.329'], ['co2-fossil', 'B', '1.728'], ['gewicht', 'A', '925'], ['gewicht', 'B', '500']]), werte);
  check('Einheiten und Hinweise: „Datenart“-Marke B bei Beispielpreisen, R bei belegten Werten (gleiche Marken wie in den Diagrammen)', JSON.stringify(await p.$$eval('.kennwert[data-kennwert=kosten] .kw-wert .art', a => a.map(x => x.textContent))) === '["B","B"]' && JSON.stringify(await p.$$eval('.kennwert[data-kennwert=gewicht] .kw-wert .art', a => a.map(x => x.textContent))) === '["R","R"]');
  check('Pflichtsatz zur relativen Bewertung der Farben steht unter dem Dashboard', /Die Farben zeigen eine relative Bewertung der ausgewählten Materialien und stellen keine allgemeingültige Aussage über deren Qualität dar\./.test(await p.$eval('#dashboard', d => d.textContent)));

  // ---- Aktualisierung
  await eingabe(p, 50, 10);
  a = await abgleich(p);
  const gew = await p.$eval('.kennwert[data-kennwert=gewicht] .kw-zeile[data-material=A] .kw-zahl', e => e.textContent);
  check('Fläche/Dicke ändern (50 m² × 10 cm): Gewicht Mineralwolle 5 m³ × 46,25 = 231,25 → „231“; Karten weiter identisch mit den Diagrammen', /^231/.test(gew) && a.abw.length === 0, [gew, a]);
  await p.selectOption('#dickeEinheit', 'mm'); await p.fill('#dicke', '100');
  check('Einheit ändern (100 mm = 10 cm): gleiche Werte', await p.$eval('.kennwert[data-kennwert=gewicht] .kw-zeile[data-material=A] .kw-zahl', e => e.textContent) === gew);
  await p.selectOption('#dickeEinheit', 'cm'); await p.fill('#dicke', '20'); await p.fill('#flaeche', '100');
  await setze(p, { a: 'eps', b: 'xps', c: '' });
  a = await abgleich(p);
  check('Material wechseln (EPS, XPS): Namen und Werte der Karten wechseln mit und stimmen mit den Diagrammen überein', (await p.$$eval('.kennwert[data-kennwert=gewicht] .kw-name', n => n.map(x => x.textContent))).join('|').includes('EPS') && a.abw.length === 0, a);
  await setze(p, { a: 'mineralwolle', b: 'eps', c: 'zellulose' });
  check('Drittes Material: jede Karte zeigt drei Zeilen', (await p.$$eval('.kennwert', k => k.map(x => x.querySelectorAll('.kw-zeile').length))).every(n => n === 3) && (await abgleich(p)).abw.length === 0);
  await setze(p, { a: 'mineralwolle', b: 'mineralwolle', c: '', pa: 'rockwool-fixrock-035', pb: 'rockwool-klemmrock-035' });
  a = await abgleich(p);
  check('Herstellerprodukte (Fixrock 035 gegen Klemmrock 035): Karten zeigen die Produktnamen und die produktspezifischen Werte, gleich wie die Diagramme', (await p.$$eval('.kennwert[data-kennwert=kosten] .kw-name', n => n.map(x => x.textContent))).join('|').includes('Klemmrock') && a.abw.length === 0, a);

  // Priorität: Gewicht wird erst bei „Geringes Gewicht“ farbig bewertet
  await setze(p, { a: 'normalbeton', b: 'brettsperrholz', c: '' });
  const vorPrio = await p.$$eval('.kennwert[data-kennwert=gewicht] .kw-punkt', d => d.map(x => x.getAttribute('title')));
  await p.evaluate(() => MM.prioritaet.setzen('gewicht'));
  const nachPrio = await p.$$eval('.kennwert[data-kennwert=gewicht] .kw-punkt', d => d.map(x => x.getAttribute('title')));
  check('Priorität „Geringes Gewicht“: das Gewicht ist vorher „nicht bewertet“ (grau) und danach bewertet (gut/schlecht) – wie im Diagramm', vorPrio.every(t => t === 'nicht bewertet') && nachPrio.every(t => t !== 'nicht bewertet') && (await abgleich(p)).abw.length === 0, [vorPrio, nachPrio]);
  await p.evaluate(() => MM.prioritaet.setzen('ausgewogen'));

  // ---- Datenmodus
  await setze(p, { a: 'zellulose', b: 'flachsdaemmung', c: '' });
  await p.evaluate(() => MM.datenmodus.setze(false));
  const echt = await p.$$eval('.kennwert[data-kennwert=kosten] .kw-zeile', z => z.map(x => [x.querySelector('.kw-zahl') ? x.querySelector('.kw-zahl').textContent : null, x.querySelector('.kw-fehlt') ? x.querySelector('.kw-fehlt').textContent : null, x.querySelector('.kw-punkt').classList.contains('leer')]));
  check('Echtdaten-Modus: Zellulose und Flachsdämmung ohne belegten Preis zeigen „fehlt“ (keine Zahl, kein Farbpunkt); es werden keine Zahlen erfunden', echt[0][0] === null && echt[0][1] === 'fehlt' && echt[0][2] === true && echt[1][1] === 'fehlt', echt);
  check('Echtdaten-Modus: Karten weiter identisch mit den Diagrammen', (await abgleich(p)).abw.length === 0);
  await p.evaluate(() => MM.datenmodus.setze(true));
  await setze(p, { a: 'mineralwolle', b: 'eps', c: '' });
  check('Zurück in den Demo-Modus: die Beispielpreise erscheinen wieder (mit B-Marke)', await p.$eval('.kennwert[data-kennwert=kosten] .kw-zeile .kw-zahl', e => e.textContent) === '1.700');

  // ---- Nicht vergleichbare / nicht bewertete Werte
  await setze(p, { a: 'normalbeton', b: 'baustahl', c: '' });
  const bs = await p.$$eval('.kennwert', k => k.map(x => [x.getAttribute('data-kennwert'), [...x.querySelectorAll('.kw-zeile')].map(z => z.querySelector('.kw-zahl') ? z.querySelector('.kw-zahl').textContent : z.querySelector('.kw-fehlt').textContent), (x.querySelector('.kw-status') || {}).textContent || '']));
  check('Normalbeton gegen Baustahl (kein Schichtmodell): „nicht berechenbar“ statt einer Zahl; Karten ohne gültiges Ergebnis erfinden nichts', bs.some(x => x[1].includes('nicht berechenbar')) && (await abgleich(p)).abw.length === 0, bs);
  await setze(p, { a: 'dachziegel', b: 'klinker', c: '' });
  check('Materialien ohne gemeinsamen Anwendungsbereich: „Nicht bewertet.“ oder „Nur eingeschränkt vergleichbar.“ an den Karten, Farbpunkte grau', (await p.$$eval('.kennwert .kw-status', s => s.length)) >= 1 && (await abgleich(p)).abw.length === 0);
  const mehr = await p.$eval('.kennwert[data-kennwert=kosten]', k => { const d = k.querySelector('.kw-mehr'); return d ? [d.open, d.textContent] : null; });
  check('Ausführliche Hinweise stehen eingeklappt unter „Mehr“ (nicht verloren)', mehr && mehr[0] === false && mehr[1].length > 40, mehr);

  // ---- Schnittstelle
  const sch = await p.evaluate(() => { const e = MM.diagramme.ergebnisse(); e.diagramme.kosten = null; e.anzahl = 99; const e2 = MM.diagramme.ergebnisse(); return { kopieOK: e2.diagramme.kosten !== null && e2.anzahl !== 99, felder: Object.keys(e2.diagramme.lambda.zeilen[0]).sort().join(), schluessel: Object.keys(e2.diagramme).sort().join() }; });
  check('Lese-Schnittstelle MM.diagramme.ergebnisse() liefert eine Kopie (Änderungen daran wirken nicht zurück) mit den Diagrammen kosten, co2-fossil, co2-gesamt, lambda, gewicht', sch.kopieOK && sch.schluessel === 'co2-fossil,co2-gesamt,gewicht,kosten,lambda', sch);
  const quelle = fs.readFileSync(path.join(PROJ, 'js', 'dashboard.js'), 'utf8');
  check('Keine doppelte Rechenlogik: dashboard.js ruft keine Berechnungs- oder Bewertungsfunktionen auf (nur Formatierung und die Schnittstelle)', !/berechne|MM\.bewertung|normalisiere|rohdichte|waermeleit/i.test(quelle.replace(/\/\*[\s\S]*?\*\//g, '')) && /MM\.diagramme\.ergebnisse/.test(quelle) && /mm:diagramme/.test(quelle));

  // ---- Reiter, Druck, Layout
  await setze(p, { a: 'mineralwolle', b: 'eps', c: '' });
  await p.click('#reiter-alternativen'); await eingabe(p, 100, 20).catch(() => {});
  await p.evaluate(() => { const f = document.getElementById('flaeche'); f.value = '10'; f.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.click('#reiter-vergleich');
  check('Eine Änderung, die bei geöffnetem anderen Reiter geschieht, ist beim Zurückwechseln im Dashboard angekommen (Gewicht A: 2 m³ × 46,25 = 92,5)', /^92/.test(await p.$eval('.kennwert[data-kennwert=gewicht] .kw-zeile[data-material=A] .kw-zahl', e => e.textContent)) && (await abgleich(p)).abw.length === 0);
  await p.emulateMedia({ media: 'print' });
  check('Druck: das Dashboard wird nicht gedruckt (die Diagramme und Tabellen enthalten dieselben Zahlen)', await p.$eval('#dashboard', d => getComputedStyle(d).display) === 'none');
  await p.emulateMedia({ media: 'screen' });

  const lay = async (breite) => { const m = await neu(breite); await setze(m, { a: 'mineralwolle', b: 'eps', c: 'zellulose' }); await eingabe(m, 100, 20); return m.evaluate(() => { const cw = document.documentElement.clientWidth; const ks = [...document.querySelectorAll('.kennwert')].map(k => k.getBoundingClientRect()); const spalten = new Set(ks.map(k => Math.round(k.left))).size; return { spalten, seite: document.documentElement.scrollWidth <= cw, innen: ks.every(k => k.left >= -1 && k.right <= cw + 1), ueberlauf: [...document.querySelectorAll('.kennwert')].filter(k => k.scrollWidth > k.clientWidth + 1).length }; }); };
  const d = await lay(1280), t = await lay(820), h = await lay(375);
  check('Desktop 1280 px (Bento-Raster, Ausgewogener Vergleich): vier gleich große Kennwert-Kacheln in einer Reihe (4 Spalten), nichts läuft über', d.spalten === 4 && d.seite && d.innen && d.ueberlauf === 0, d);
  check('Tablet 820 px: zwei Spalten', t.spalten === 2 && t.seite && t.innen, t);
  check('Handy 375 px: Karten untereinander, kein seitliches Scrollen', h.spalten === 1 && h.seite && h.innen && h.ueberlauf === 0, h);

  check('Keine Konsolenfehler oder -warnungen', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
