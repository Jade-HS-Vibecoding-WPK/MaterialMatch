/* MaterialMatch 2.0, Schritt 12: Export als Menü, Datenmodus als schmale Zeile, PDF/CSV/Druckansicht
   Aufruf:  node tests/test39.js   (PDF-Prüfung braucht pdftotext und pdfinfo aus poppler-utils) */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 500))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mm39-'));

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async (modus = 'demo', breite = 1280, vorher) => {
    const p = await b.newPage({ viewport: { width: breite, height: 900 }, acceptDownloads: true });
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e)));
    if (vorher) await p.addInitScript(vorher);
    await p.goto(URL + '?modus=' + modus); await p.waitForTimeout(250);
    return p;
  };
  const waehle = (p, a, bb) => p.evaluate(([a, bb]) => { MM.auswahl.setzeAuswahl({ a, b: bb, c: '' }); for (const [id, v] of [['flaeche', '100'], ['dicke', '20']]) { const f = document.getElementById(id); f.value = v; f.dispatchEvent(new Event('input', { bubbles: true })); } }, [a, bb]);

  // =============== Datenmodus ===============
  let p = await neu('demo');
  const demo = await p.evaluate(() => { const l = document.getElementById('modus-leiste'); const r = l.getBoundingClientRect(); return { titel: document.getElementById('modus-titel').textContent, kurz: document.getElementById('modus-kurz').textContent, bg: getComputedStyle(l).backgroundColor, h: Math.round(r.height), mehrOffen: document.getElementById('modus-mehr').open, textSichtbar: document.getElementById('modus-text').checkVisibility(), daten: l.dataset.modus }; });
  check('Demo: Zeile „Datenmodus: Demo“ mit Kurzhinweis, gelb hinterlegt (klar erkennbar), nur eine schmale Zeile (≤ 60 px), ausführlicher Text zugeklappt', demo.titel === 'Datenmodus: Demo' && /Beispieldaten/.test(demo.kurz) && demo.bg === 'rgb(255, 244, 214)' && demo.h <= 60 && !demo.mehrOffen && !demo.textSichtbar && demo.daten === 'demo', demo);
  await p.click('#modus-mehr > summary');
  const text = await p.$eval('#modus-text', e => ({ t: e.textContent, h: e.checkVisibility() ? 1 : 0 }));
  check('„Erklärung“ öffnet den ausführlichen Demo-Hinweis (Beispieldaten sind keine geprüften Echtwerte und nicht für reale Entscheidungen geeignet)', text.h > 0 && /keine geprüften Echtwerte/.test(text.t) && /nicht für reale Entscheidungen geeignet/.test(text.t), text);
  await p.click('#modus-mehr > summary');
  await p.click('#modus-schalter');
  const echt = await p.evaluate(() => { const l = document.getElementById('modus-leiste'); return { titel: document.getElementById('modus-titel').textContent, kurz: document.getElementById('modus-kurz').textContent, bg: getComputedStyle(l).backgroundColor, h: Math.round(l.getBoundingClientRect().height), text: document.getElementById('modus-text').textContent, daten: l.dataset.modus, an: document.getElementById('modus-schalter').checked }; });
  check('Umschalten auf Echtdaten: „Datenmodus: Verifizierte Daten“, Hinweis „nur belegte Werte, viele Kennwerte fehlen“, neutral (weiß, nicht gelb), Schalter aus', echt.titel === 'Datenmodus: Verifizierte Daten' && /Nur belegte Werte/.test(echt.kurz) && echt.bg === 'rgb(255, 255, 255)' && echt.h <= 60 && echt.daten === 'echt' && !echt.an && /nicht verfügbar/.test(echt.text), echt);
  await p.click('#modus-schalter');
  check('Zurück auf Demo: Zeile wieder gelb mit „Datenmodus: Demo“', await p.evaluate(() => document.getElementById('modus-titel').textContent === 'Datenmodus: Demo' && getComputedStyle(document.getElementById('modus-leiste')).backgroundColor === 'rgb(255, 244, 214)'));
  const kontrast = async pg => pg.evaluate(() => { const rgb = c => (c.match(/[\d.]+/g) || []).map(Number); const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); }; const bg = rgb(getComputedStyle(document.getElementById('modus-leiste')).backgroundColor); const k = e => { const a = lum(rgb(getComputedStyle(e).color)), c = lum(bg); return Math.round((Math.max(a, c) + .05) / (Math.min(a, c) + .05) * 100) / 100; }; return ['#modus-titel', '#modus-kurz', '.modus-schalter span', '.modus-mehr > summary'].map(s => k(document.querySelector(s))); });
  const kd = await kontrast(p); await p.click('#modus-schalter'); const ke = await kontrast(p); await p.click('#modus-schalter');
  check('Kontrast (WCAG AA ≥ 4,5 : 1) von Titel, Kurzhinweis, Schalter und „Erklärung“ in beiden Modi', kd.every(x => x >= 4.5) && ke.every(x => x >= 4.5), [kd, ke]);
  await p.focus('#modus-schalter'); await p.keyboard.press('Space');
  check('Der Schalter bleibt per Tastatur bedienbar (Leertaste wechselt den Modus)', await p.evaluate(() => document.getElementById('modus-leiste').dataset.modus === 'echt'));
  await p.keyboard.press('Space');
  await p.focus('#modus-mehr > summary'); await p.keyboard.press('Enter');
  check('„Erklärung“ lässt sich per Tastatur öffnen (Enter) und hat einen sichtbaren Fokusrahmen', await p.evaluate(() => document.getElementById('modus-mehr').open && parseFloat(getComputedStyle(document.querySelector('#modus-mehr > summary')).outlineWidth) >= 2));

  // Warnungen bleiben erhalten
  await waehle(p, 'mineralwolle', 'eps');
  check('Datenwarnungen bleiben: Demo-Werte tragen weiter „B“ (gelb), der Orientierungshinweis „Nur zur Orientierung …“ ist sichtbar, der Hinweis zu Beispielpreisen im Diagramm steht da', await p.evaluate(() => document.querySelectorAll('.art-beispiel').length > 0 && !document.getElementById('orientierung').hidden && /Nur zur Orientierung/.test(document.getElementById('orientierung').textContent) && /Beispielwerte \(Demo\)/.test(document.getElementById('diagramme').textContent)));
  const e2 = await neu('echt'); await waehle(e2, 'zellulose', 'flachsdaemmung');
  check('Echtdaten: fehlende Preise stehen weiter als Hinweis da (nicht berechenbar), nichts wird geschätzt', await e2.evaluate(() => /kein belegter Preis/.test(document.getElementById('orientierung').textContent) && !/Beispielwerte \(Demo\)/.test(document.getElementById('diagramme').textContent)));
  await e2.close();

  // Handy
  const m = await neu('demo', 375);
  const mo = await m.evaluate(() => ({ h: Math.round(document.getElementById('modus-leiste').getBoundingClientRect().height), seite: document.documentElement.scrollWidth <= document.documentElement.clientWidth, schalter: document.querySelector('.modus-schalter').getBoundingClientRect().height, summary: document.querySelector('.modus-mehr > summary').getBoundingClientRect().height }));
  check('Handy 375 px: Datenmodus-Leiste höchstens 110 px hoch, kein seitliches Scrollen, Schalter und „Erklärung“ mindestens 44 px', mo.h <= 110 && mo.seite && mo.schalter >= 43.5 && mo.summary >= 43.5, mo);
  await m.close();

  // =============== Export ===============
  p = await neu('demo', 1280, () => { window.__druck = 0; window.print = function () { window.__druck++; }; });
  const leer = await p.evaluate(() => ({ aus: document.getElementById('export-menue-knopf').disabled, hinweis: !document.getElementById('export-hinweis').hidden && /mindestens ein Material/.test(document.getElementById('export-hinweis').textContent), menue: document.getElementById('export-menue').hidden, expanded: document.getElementById('export-menue-knopf').getAttribute('aria-expanded') }));
  check('Ohne Material: „Ergebnisse exportieren“ ist deaktiviert, der Hinweis „Wähle zuerst mindestens ein Material“ steht daneben, das Menü ist zu', leer.aus && leer.hinweis && leer.menue && leer.expanded === 'false', leer);
  await waehle(p, 'mineralwolle', 'eps');
  const mit = await p.evaluate(() => ({ text: document.getElementById('export-menue-knopf').textContent, aus: document.getElementById('export-menue-knopf').disabled, hinweis: document.getElementById('export-hinweis').hidden, menue: document.getElementById('export-menue').hidden, controls: document.getElementById('export-menue-knopf').getAttribute('aria-controls') }));
  check('Mit Material: Knopf „Ergebnisse exportieren“ aktiv (aria-controls auf das Menü), Menü zunächst zugeklappt, Hinweis verborgen', mit.text === 'Ergebnisse exportieren' && !mit.aus && mit.hinweis && mit.menue && mit.controls === 'export-menue', mit);
  check('Export nimmt wenig Platz: nur ein Knopf sichtbar, die beiden Einträge sind erst nach dem Aufklappen sichtbar', !(await p.isVisible('#druck-knopf')) && !(await p.isVisible('#csv-knopf')) && await p.isVisible('#export-menue-knopf'));
  await p.click('#export-menue-knopf');
  const offen = await p.evaluate(() => ({ exp: document.getElementById('export-menue-knopf').getAttribute('aria-expanded'), eintraege: [...document.querySelectorAll('#export-menue .export-eintrag')].map(x => [x.id, x.textContent.trim(), x.disabled, Math.round(x.getBoundingClientRect().height)]), erkl: document.querySelector('.export-erklaerung').textContent }));
  check('Aufgeklappt: „Als PDF speichern“ und „Als CSV herunterladen“ sind sichtbar und aktiv, mindestens 40 px hoch; die Erklärung nennt, dass alle Reiter im PDF stehen', offen.exp === 'true' && JSON.stringify(offen.eintraege.map(x => x.slice(0, 3))) === JSON.stringify([['druck-knopf', 'Als PDF speichern', false], ['csv-knopf', 'Als CSV herunterladen', false]]) && offen.eintraege.every(x => x[3] >= 40) && /alle Bereiche, auch die gerade nicht sichtbaren Reiter/.test(offen.erkl), offen);
  await p.keyboard.press('Escape');
  check('Escape schließt das Menü (aria-expanded false)', await p.evaluate(() => document.getElementById('export-menue').hidden && document.getElementById('export-menue-knopf').getAttribute('aria-expanded') === 'false'));
  await p.focus('#export-menue-knopf'); await p.keyboard.press('Enter');
  check('Das Menü lässt sich per Tastatur öffnen (Enter), der nächste Tab-Schritt führt zu „Als PDF speichern“', await p.evaluate(() => !document.getElementById('export-menue').hidden) && (await p.keyboard.press('Tab'), await p.evaluate(() => document.activeElement.id === 'druck-knopf')));
  await p.keyboard.press('Escape');
  check('Escape aus dem Menü gibt den Fokus an den Knopf „Ergebnisse exportieren“ zurück', await p.evaluate(() => document.activeElement.id === 'export-menue-knopf' && document.getElementById('export-menue').hidden));
  await p.click('#export-menue-knopf'); await p.click('#druck-knopf');
  check('Klick auf „Als PDF speichern“ ruft den Druckdialog (window.print) genau einmal auf und schließt das Menü', await p.evaluate(() => window.__druck === 1 && document.getElementById('export-menue').hidden));
  await p.click('#export-menue-knopf');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#csv-knopf')]);
  const csvPfad = path.join(TMP, 'x.csv'); await dl.saveAs(csvPfad); const csv = fs.readFileSync(csvPfad, 'utf8');
  check('Klick auf „Als CSV herunterladen“ lädt eine .csv-Datei (mit BOM für Excel, Eingaben, Datenmodus und Quellen) und schließt das Menü', /\.csv$/.test(dl.suggestedFilename()) && csv.startsWith('﻿') && /Bauteilfläche/.test(csv) && /Datenmodus/.test(csv) && /Mineralwolle/.test(csv) && /Quelle/.test(csv) && await p.evaluate(() => document.getElementById('export-menue').hidden), dl.suggestedFilename());
  await p.click('#export-menue-knopf');
  await waehle(p, '', '');
  check('Wird die Auswahl geleert, schließt sich das Menü und der Knopf ist wieder deaktiviert (Hinweis sichtbar)', await p.evaluate(() => document.getElementById('export-menue').hidden && document.getElementById('export-menue-knopf').disabled && !document.getElementById('export-hinweis').hidden));
  await waehle(p, 'mineralwolle', 'eps');

  // ---- Handy
  const hm = await neu('demo', 375); await waehle(hm, 'mineralwolle', 'eps'); await hm.click('#export-menue-knopf');
  const hr = await hm.evaluate(() => { const cw = document.documentElement.clientWidth; const e = [...document.querySelectorAll('#export-menue-knopf, #export-menue .export-eintrag')].map(x => { const r = x.getBoundingClientRect(); return [Math.round(r.height), Math.round(r.left), Math.round(r.right)]; }); return { seite: document.documentElement.scrollWidth <= cw, e, innen: e.every(x => x[1] >= 0 && x[2] <= cw), hoch: e.every(x => x[0] >= 43.5) }; });
  check('Handy 375 px: Knopf und beide Einträge sind mindestens 44 px hoch, passen in die Breite, kein seitliches Scrollen', hr.seite && hr.innen && hr.hoch, hr);
  await hm.close();

  // ---- Druckansicht und PDF
  const pd = await neu('demo'); await waehle(pd, 'mineralwolle', 'eps');
  await pd.click('#export-menue-knopf'); await pd.click('#reiter-quellen');
  await pd.emulateMedia({ media: 'print' });
  const druck = await pd.evaluate(() => { const d = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).display : 'fehlt'; }; return { menue: d('.export-leiste'), knopf: d('#export-menue-knopf'), erkl: d('.modus-mehr'), orient: d('#orientierung'), tabs: d('.tabs-leiste'), panels: [...document.querySelectorAll('[role=tabpanel]')].map(x => getComputedStyle(x).display !== 'none'), zeile: d('.modus-zeile'), schalter: d('.modus-schalter') }; });
  await pd.emulateMedia({ media: null });      // zurück auf Standard, damit page.pdf() selbst die Druckansicht verwendet
  check('Druckansicht: Exportmenü, Datenmodus-Schalter, „Erklärung“ und Reiterleiste verschwinden; die Zeile „Datenmodus: …“ und die Reiterbereiche Vergleich, Alternativen und Quellen bleiben sichtbar (Entdecken und Match sind Bildschirmfunktionen)', druck.menue === 'none' && druck.knopf === 'none' && druck.erkl === 'none' && druck.tabs === 'none' && druck.schalter === 'none' && druck.zeile !== 'none' && JSON.stringify(druck.panels) === '[false,true,false,true,true]', druck);
  await pd.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  const pdfPfad = path.join(TMP, 'bericht.pdf');
  await pd.pdf({ path: pdfPfad, format: 'A4', printBackground: true });
  await pd.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  const seiten = +/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [pdfPfad]).toString())[1];
  const txt = execFileSync('pdftotext', ['-layout', pdfPfad, '-']).toString().replace(/\s+/g, ' ');
  const anz = (re) => (txt.match(re) || []).length;
  const fehlt = ['Vergleichsbericht', 'Materialien im Vergleich', 'Alle technischen Eigenschaften anzeigen', 'Alternative Baustoffe entdecken', 'Quellen der ausgewählten Materialien', 'Datenqualität und Kennzeichnungen', 'Wie berechnet MaterialMatch die Ergebnisse?', 'Rechtliche und fachliche Hinweise', 'Nachvollziehbarkeits-Check', 'Datenmodus: Demo', 'Beispieldaten'].filter(t => !txt.includes(t));
  check('PDF enthält auch die Inhalte der gerade nicht sichtbaren Reiter (Alternativen, Quellen & Details), den Datenmodus und die Datenprüfung', fehlt.length === 0, fehlt);
  check('PDF ohne Bedienelemente: kein „Ergebnisse exportieren“, kein „Als CSV herunterladen“, kein „Erklärung“-Knopf, keine Reiter-Beschriftung „Quellen & Details“ als Reiter', !/Ergebnisse exportieren/.test(txt) && !/Als CSV herunterladen/.test(txt) && !/Beispieldaten \(Demo\) verwenden/.test(txt));
  check('PDF ohne Doppelungen: der lange Demo-Hinweis und der Orientierungshinweis „Nur zur Orientierung: Mit R gekennzeichnete Werte …“ stehen nur einmal (im Berichtskopf)', anz(/Demo-Modus: Alle mit B gekennzeichneten/g) === 0 && anz(/Nur zur Orientierung: Mit R gekennzeichnete Werte sind Richtwerte/g) === 1, [anz(/Demo-Modus: Alle mit B/g), anz(/Nur zur Orientierung: Mit R/g)]);
  check('PDF ohne die Gesamt-Quellenübersicht der Datenbank (nur Quellen der gewählten Materialien); Länge höchstens 21 Seiten', !/Quellen \(\d+ [^)]*\)|Verwendete Quellen/.test(txt) && seiten <= 21, seiten);
  check('PDF enthält die Pflichtaussage zur relativen Bewertung der Farben', /Die Farben zeigen eine relative Bewertung der ausgewählten Materialien und stellen keine allgemeingültige Aussage über deren Qualität dar\./.test(txt));

  check('Keine Konsolenfehler oder -warnungen', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
