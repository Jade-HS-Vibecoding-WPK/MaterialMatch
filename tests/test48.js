/* MaterialMatch 3.0, Block 4: PDF-Bericht mit kompakter erster Seite (Logo, Vergleich, Materialien, Eingaben, Kennzahlen, Hinweise),
   Diagrammen auf der zweiten Seite und Annahmen/Quellen auf den folgenden Seiten.
   Das PDF wird mit Chromium erzeugt und mit pdftotext/pdfinfo/pdftoppm (poppler) geprüft.
   Aufruf:  node tests/test48.js */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 600))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-pdf-'));

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async (modus, auswahl, flaeche = '100', dicke = '20', prio = null) => {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
    p.on('pageerror', e => errors.push(String(e)));
    await p.goto(URL + '?modus=' + modus); await p.waitForTimeout(250);
    if (auswahl) await p.evaluate(a => MM.auswahl.setzeAuswahl(a), auswahl);
    if (flaeche) await p.fill('#flaeche', flaeche);
    if (dicke) await p.fill('#dicke', dicke);
    if (prio) await p.selectOption('#prioritaet', prio);
    await p.waitForTimeout(250);
    return p;
  };
  const pdf = async (p, name) => {
    await p.evaluate(() => MM.exportieren.druckVorbereiten());
    await p.emulateMedia({ media: 'print' });
    const datei = path.join(TMP, name + '.pdf');
    await p.pdf({ path: datei, format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' } });
    await p.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await p.emulateMedia({ media: 'screen' });
    const info = execFileSync('pdfinfo', [datei]).toString();
    const seiten = parseInt(/Pages:\s+(\d+)/.exec(info)[1], 10);
    const text = n => execFileSync('pdftotext', ['-f', String(n), '-l', String(n), datei, '-']).toString();
    return { datei, seiten, text, alles: execFileSync('pdftotext', [datei, '-']).toString() };
  };
  const flach = t => t.replace(/\s+/g, ' ');

  // ---------- Demo, drei Materialien
  let p = await neu('demo', { a: 'mineralwolle', b: 'eps', c: 'zellulose' }, '100', '20');
  const daten = await p.evaluate(() => { const e = MM.diagramme.ergebnisse(); const z = id => e.diagramme[id].zeilen.map(x => x.wert); return { kosten: z('kosten'), co2: z('co2-fossil'), gewicht: z('gewicht'), lambda: z('lambda'), r: e.diagramme.lambda.zeilen.map(x => x.rWert && x.rWert.wert), fmt: null }; });
  const fmt = await p.evaluate(d => { const f = MM.berechnung.formatZahl; return { kosten: d.kosten.map(f), co2: d.co2.map(f), gewicht: d.gewicht.map(f), r: d.r.map(x => x === null ? null : f(x)) }; }, daten);
  const P = await pdf(p, 'demo3');
  const s1 = flach(P.text(1)), s2 = flach(P.text(2));
  check('PDF: A4, höchstens 21 Seiten', P.seiten >= 4 && P.seiten <= 21, P.seiten);
  check('Seite 1: Logo und Name „MaterialMatch“, „Vergleichsbericht“, Titel des Vergleichs (alle drei Materialnamen), Datum', /MaterialMatch/.test(s1) && /Vergleichsbericht/.test(s1) && /Mineralwolle \(Fassadendämmung\) gegen EPS \(expandiertes Polystyrol\) gegen Zellulosedämmung/.test(s1) && /Erstellt am \d\d\.\d\d\.\d{4}/.test(s1), s1.slice(0, 300));
  check('Seite 1: die drei verglichenen Materialien mit Produkt, die Eingaben (100 m², 20 cm, Anwendungsbereich, Priorität)', /Material A: Mineralwolle/.test(s1) && /Material B: EPS/.test(s1) && /Material C: Zellulose/.test(s1) && /ROCKWOOL Fixrock 035/.test(s1) && /Bauteilfläche: 100 m² · Materialdicke: 20 cm/.test(s1) && /Anwendungsbereich: Wärmedämmung · Priorität: Ausgewogener Vergleich/.test(s1), s1.slice(300, 900));
  const alleZahlen = [].concat(fmt.kosten, fmt.co2, fmt.gewicht, fmt.r);
  check('Seite 1: Tabelle „Wichtigste Kennzahlen“ mit Materialkosten, CO₂ (fossil), Gewicht, Wärmeleitfähigkeit λ und R-Wert – jede Zahl ist genau die Zahl aus dem Dashboard (Lese-Schnittstelle), nichts wird neu gerechnet', /Wichtigste Kennzahlen/.test(s1) && ['Materialkosten', 'CO₂ \\(fossil\\)', 'Gewicht', 'Wärmeleitfähigkeit λ', 'R-Wert'].every(k => new RegExp(k).test(s1)) && alleZahlen.every(z => s1.includes(z)), alleZahlen.filter(z => !s1.includes(z)));
  check('Seite 1: wichtige Warnhinweise („Wichtige Hinweise“): Orientierungshinweis, Hinweis zur eingeschränkten Vergleichbarkeit der Kosten und der Hinweis auf Beispieldaten (B)', /Wichtige Hinweise/.test(s1) && /Nur zur Orientierung/.test(s1) && /Kein belastbarer direkter Vergleich möglich/.test(s1) && /Beispieldaten/.test(s1), s1.slice(900, 1800));
  check('Seite 1: Pflichtsatz zu den relativen Farben steht bei den Kennzahlen-Balken, außerdem der Haftungshinweis („Ersetzt keine bauphysikalischen Nachweise“), Datenstand und Quellenhinweis', s1.includes('Die Farben zeigen eine relative Bewertung der ausgewählten Materialien und stellen keine allgemeingültige Aussage über deren Qualität dar.') && /Ersetzt keine bauphysikalischen Nachweise/.test(s1) && /Datenstand 2026-11-16/.test(s1) && /Quellen: Die Quellen der gezeigten Kennwerte/.test(s1));
  check('Seite 2: die ausführlichen Diagramme („Materialien im Vergleich“: Kosten, CO₂ fossil, Gewicht, Wärmeleitfähigkeit) – die Seite 1 bleibt frei davon', /Materialien im Vergleich/.test(s2) && /Materialkosten für 100 m² × 20 cm/.test(s2) && /CO₂ fossil/.test(s2) && /Gesamtgewicht für 100 m² × 20 cm/.test(s2) && /Wärmeleitfähigkeit λ/.test(s2) && !/Materialien im Vergleich/.test(s1), s2.slice(0, 200));
  const ganz = flach(P.alles);
  const annahmenPos = ganz.indexOf('Zugrunde liegende Mengen und Annahmen');
  check('Berechnungsannahmen: genau einmal gesammelt unter „Zugrunde liegende Mengen und Annahmen“ hinter den Diagrammen (nicht in jedem Diagramm), mit allen vier Diagrammen und ihren Annahmen', (ganz.match(/Zugrunde liegende Mengen und Annahmen/g) || []).length === 1 && annahmenPos > ganz.indexOf('Materialien im Vergleich') && /Gewicht = Volumen × Rohdichte/.test(ganz) && /CO₂-Menge = Menge × Kennwert/.test(ganz) && /Materialkosten = Menge × Einheitspreis/.test(ganz));
  const seitenText = Array.from({ length: P.seiten }, (_, i) => P.text(i + 1).replace(/\s+/g, ' ').trim());
  const leer = seitenText.map((t, i) => [i + 1, t.length]).filter(([i, n]) => n < 250 && i < P.seiten);
  check('Keine fast leeren Seiten (außer eventuell der letzten): jede Seite hat mindestens 250 Zeichen Inhalt', leer.length === 0, leer);
  check('Alle fachlich notwendigen Abschnitte sind weiter im Bericht: technische Eigenschaften, Alternativen, Quellen, Methodik, Hinweise', ['Alle technischen Eigenschaften', 'Menge und Gewicht', 'Technische Eigenschaften', 'CO₂-Bilanz', 'Wärmedurchlasswiderstand', 'Alternative Baustoffe entdecken', 'So wird bewertet', 'Quellen der ausgewählten Materialien', 'Datenqualität und Kennzeichnungen', 'Rechtliche und fachliche Hinweise'].every(k => ganz.includes(k)), ['Alle technischen Eigenschaften', 'Menge und Gewicht', 'Technische Eigenschaften', 'CO₂-Bilanz', 'Wärmedurchlasswiderstand', 'Alternative Baustoffe entdecken', 'So wird bewertet', 'Quellen der ausgewählten Materialien', 'Datenqualität und Kennzeichnungen', 'Rechtliche und fachliche Hinweise'].filter(k => !ganz.includes(k)));
  check('Der Bericht enthält die Illustrationserklärung nicht als Foto: kein „undefined“, „NaN“, „[object“; keine Bedienelemente (Suche, Knöpfe, Match, Favoriten)', !/undefined|NaN|\[object/.test(P.alles) && !/Match finden|Favoriten vergleichen|Steckbrief öffnen|Baustoff oder Produkt suchen|Ergebnisse exportieren/.test(P.alles), P.alles.match(/Match finden|Favoriten vergleichen|Steckbrief öffnen|Ergebnisse exportieren/g));
  // Pixelprüfung: Logo (Blau #5B8FD6) und Bewertungsfarben auf Seite 1
  execFileSync('pdftoppm', ['-r', '60', '-f', '1', '-l', '2', P.datei, path.join(TMP, 'pg')]);
  const pixel = (datei, farben) => { const buf = fs.readFileSync(datei); let pos = 0, tok = []; while (tok.length < 4) { while (/\s/.test(String.fromCharCode(buf[pos]))) pos++; let s = ''; while (!/\s/.test(String.fromCharCode(buf[pos]))) s += String.fromCharCode(buf[pos++]); tok.push(s); } pos++; const z = {}; Object.keys(farben).forEach(k => { z[k] = 0; }); for (let i = pos; i + 2 < buf.length; i += 3) Object.entries(farben).forEach(([k, c]) => { if (Math.abs(buf[i] - c[0]) < 8 && Math.abs(buf[i + 1] - c[1]) < 8 && Math.abs(buf[i + 2] - c[2]) < 8) z[k]++; }); return z; };
  const ppm = fs.readdirSync(TMP).filter(f => /^pg-.*\.ppm$/.test(f)).sort();
  const p1 = pixel(path.join(TMP, ppm[0]), { logoBlau: [91, 143, 214], logoDunkel: [31, 37, 48], sehrGut: [23, 100, 58], sehrSchlecht: [149, 31, 43] });
  const p2 = pixel(path.join(TMP, ppm[1]), { sehrGut: [23, 100, 58], sehrSchlecht: [149, 31, 43] });
  check('Seite 1 enthält das Logo (Blau und Dunkel der drei Schichten) und die farbigen Kennzahlen-Balken (Dunkelgrün, Dunkelrot); Seite 2 die farbigen Diagramme', p1.logoBlau > 20 && p1.logoDunkel > 30 && p1.sehrGut > 20 && p1.sehrSchlecht > 20 && p2.sehrGut > 100 && p2.sehrSchlecht > 100, { p1, p2 });
  await p.close();

  // ---------- Echtdaten, zwei Materialien: fehlende Werte stehen als solche da, kein Erfinden
  p = await neu('echt', { a: 'zellulose', b: 'flachsdaemmung', c: '' }, '100', '20');
  const E = await pdf(p, 'echt2');
  const e1 = flach(E.text(1));
  check('Echtdaten-Modus: Seite 1 nennt „nicht berechenbar“ bzw. „fehlt“ statt Zahlen für den fehlenden Preis; Datenmodus „Echtdaten-Modus“; kein Beispielwert (B)', /Datenmodus: Echtdaten-Modus/.test(e1) && /Materialkosten/.test(e1) && /nicht berechenbar|fehlt/.test(e1) && !/ B\b/.test(e1.replace(/Material B/g, '').replace(/ B-/g, '')) && !/undefined|NaN/.test(E.alles), e1.slice(0, 1200));
  await p.close();

  // ---------- Ohne Eingaben: Kennzahlen nennen, was fehlt
  p = await neu('demo', { a: 'mineralwolle', b: 'eps', c: '' }, '', '');
  const O = await pdf(p, 'ohneEingabe');
  const o1 = flach(O.text(1));
  check('Ohne Fläche und Dicke: Seite 1 sagt „Fläche und Dicke fehlen“ bei Kosten, CO₂ und Gewicht, λ und R-Wert (ohne Dicke nicht berechenbar) bleiben nachvollziehbar', /Fläche und Dicke fehlen/.test(o1) && /Wärmeleitfähigkeit λ/.test(o1) && !/NaN|undefined/.test(O.alles), o1.slice(0, 900));
  await p.close();

  // ---------- Leerer Zustand (kein Material)
  p = await neu('demo', { a: '', b: '', c: '' }, '', '');
  const L = await pdf(p, 'leer');
  check('Ohne Material bricht der Bericht nicht ab: Seite 1 nennt „Es ist kein Material gewählt“, kein Abschnitt „Wichtigste Kennzahlen“ mit leeren Zellen', /Es ist kein Material gewählt/.test(flach(L.text(1))) && !/NaN|undefined/.test(L.alles));
  await p.close();

  // ---------- Priorität „Kosten“ (Hero-Kachel) beeinflusst den Bericht nicht (Bildschirm-Gestaltung)
  p = await neu('demo', { a: 'mineralwolle', b: 'eps', c: '' }, '100', '20', 'kosten');
  const H = await pdf(p, 'hero');
  const h1 = flach(H.text(1));
  check('Priorität Kosten: Bericht zeigt dieselben Kennzahlen; die Hero-Kachel gehört zur Bildschirmdarstellung', /Priorität: Niedrige Kosten/.test(h1) && /1\.700/.test(h1) && /1\.400/.test(h1) && H.seiten >= 4);
  await p.close();

  // ---------- CSV bleibt unverändert nutzbar
  p = await neu('demo', { a: 'mineralwolle', b: 'eps', c: 'zellulose' }, '100', '20');
  const csv = await p.evaluate(() => MM.exportieren.baueCsv({ daten: window.MATERIALMATCH_DATA, plaetze: MM.auswahl.holeAuswahl().plaetze, eingaben: MM.eingaben.hole(), modus: MM.datenmodus.name(), anwendung: 'Wärmedämmung', prioritaet: 'Ausgewogener Vergleich', empfehlung: null, datum: new Date() }));
  check('CSV-Export funktioniert weiter (Abschnitte 1 bis 4, Semikolon, BOM, Eingaben und Materialien)', csv.charCodeAt(0) === 0xFEFF && /Abschnitt 1: Eingaben und Hinweise/.test(csv) && /Abschnitt 2: Kennwerte/.test(csv) && /Abschnitt 4: Verwendete Quellen/.test(csv) && /Material A;Mineralwolle/.test(csv) && /Bauteilfläche;100;m²/.test(csv));
  await p.close();

  check('Keine Konsolenfehler oder -warnungen', errors.length === 0, errors.slice(0, 3));
  await b.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
