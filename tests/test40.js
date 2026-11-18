/* MaterialMatch 2.0, Schritt 13: vollständige Funktionsprüfung (die 24 Funktionen aus dem Master-Prompt)
   Die Seite wird wie von einem Menschen bedient (Auswahlfelder, Eingaben, Klicks, Reiter); die Rechenwerte werden im Test
   unabhängig aus den gewählten Datensätzen nachgerechnet. Die Nummern F1 … F24 stehen auch in FUNKTIONSPRUEFUNG.md.
   Aufruf:  node tests/test40.js   (PDF-Teil braucht pdfinfo/pdftotext aus poppler-utils) */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 500))); }
const nah = (a, b, tol = 0.51) => typeof a === 'number' && Math.abs(a - b) <= tol;
const zahl = t => parseFloat(String(t).replace(/\./g, '').replace(',', '.'));

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mm40-'));

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async (modus = 'demo', breite = 1280, vorher) => {
    const ctx = await b.newContext({ viewport: { width: breite, height: 900 }, acceptDownloads: true });   // eigener Speicher: eigene Produkte bleiben getrennt
    const p = await ctx.newPage();
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e)));
    if (vorher) await p.addInitScript(vorher);
    await p.goto(URL + '?modus=' + modus); await p.waitForTimeout(250);
    return p;
  };
  const oeffneTabellen = p => p.evaluate(() => { document.querySelector('#ergebnisse > details').open = true; document.querySelectorAll('#ergebnisse details.sub').forEach(d => d.open = true); });
  const reiter = (p, r) => p.click('#reiter-' + r);
  const zeile = (p, sel, label) => p.evaluate(([sel, label]) => { const r = [...document.querySelectorAll(sel + ' table tr')].find(x => x.cells[0].textContent.trim().startsWith(label)); return r ? [...r.cells].slice(1).map(c => c.textContent.replace(/\s+/g, ' ').trim()) : null; }, [sel, label]);
  const chart = (p, id) => p.$$eval(`figure.chart[data-chart="${id}"] .chart-row[data-material]`, r => r.map(x => ({ m: x.dataset.material, wert: parseFloat(x.dataset.wert), farbe: (x.dataset.farbe || '').toLowerCase() })));
  const dash = (p, titel) => p.$$eval('#dashboard .kennwert', (k, t) => { const x = k.find(e => e.querySelector('h3').textContent.trim().startsWith(t)); return x ? [...x.querySelectorAll('.kw-zahl')].map(z => z.textContent.trim()) : null; }, titel);
  const eff = p => p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.map(x => ({ id: x.material.id, prod: x.produkt ? x.produkt.id : null, rd: x.material.eigenschaften.rohdichte.wert, preis: x.material.eigenschaften.preis.wert, fossil: x.material.eigenschaften.gwp.werte ? x.material.eigenschaften.gwp.werte.fossil : null, lb: x.material.eigenschaften.waermeleitfaehigkeit_bemessung.wert })));

  // ============================================================ Grundlauf (Demo)
  let p = await neu('demo');
  // F2 Kategorie
  const kat = await p.evaluate(() => ({ nutzbar: !document.getElementById('materialA').disabled, kategorien: [...document.querySelectorAll('#kategorie option')].map(o => o.value).filter(Boolean) }));
  check('F2 Kategorie: Vor der Kategoriewahl ist die Materialwahl gesperrt; es gibt die fünf Kategorien (A–E)', !kat.nutzbar && kat.kategorien.join() === 'tragend,daemmstoff,fassade,innenausbau,dach', kat);
  await p.selectOption('#kategorie', 'dach');
  const dach = await p.evaluate(() => ({ ui: [...document.querySelectorAll('#materialA option')].map(o => o.value).filter(Boolean).sort(), db: MATERIALMATCH_DATA.baustoffe.filter(m => m.kategorien.includes('dach')).map(m => m.id).sort() }));
  check('F2 Kategorie: Nach Wahl „Dachmaterialien“ listet Material A genau die Dach-Baustoffe aus der Datenbank', dach.ui.length > 0 && JSON.stringify(dach.ui) === JSON.stringify(dach.db), dach);
  await p.selectOption('#kategorie', 'daemmstoff');

  // F1 Materialauswahl (A und B)
  await p.selectOption('#materialA', 'mineralwolle'); await p.selectOption('#materialB', 'eps');
  const karten = await p.$$eval('#auswahl-karten article', k => k.map(x => x.innerText.replace(/\s+/g, ' ')));
  check('F1 Materialauswahl: Mineralwolle (A) und EPS (B) werden gewählt; je eine Karte erscheint; die Tabellenköpfe tragen A und B', karten.length === 2 && /Mineralwolle/.test(karten[0]) && /EPS/.test(karten[1]) && (await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.map(x => x.buchstabe).join())) === 'A,B', karten);
  // F6 Fläche, F7 Dicke
  check('F6/F7 Ohne Fläche und Dicke: es werden noch keine Kosten oder Mengen gerechnet (Dashboard zeigt keine Zahl)', (await dash(p, 'Materialkosten')).length === 0);
  await p.fill('#flaeche', '100'); await p.fill('#dicke', '20');
  const e = await eff(p);
  const vol = 100 * 0.20;
  // F10 Mengen
  await oeffneTabellen(p);
  const volZ = await zeile(p, '#ergebnis-menge', 'Volumen');
  check('F10 Mengen: Volumen = 100 m² × 0,20 m = 20 m³ für beide Materialien', volZ && volZ.every(t => nah(zahl(t), vol)), volZ);
  // F11 Gewicht
  const gew = await zeile(p, '#ergebnis-menge', 'Gesamtgewicht'); const fm = await zeile(p, '#ergebnis-menge', 'Flächenmasse');
  check('F11 Gewicht: Gesamtgewicht = Volumen × Rohdichte (nachgerechnet aus den gewählten Datensätzen) und Flächenmasse = Dicke × Rohdichte', nah(zahl(gew[0]), vol * e[0].rd) && nah(zahl(gew[1]), vol * e[1].rd) && nah(zahl(fm[0]), 0.2 * e[0].rd, 0.01) && nah(zahl(fm[1]), 0.2 * e[1].rd, 0.01), [gew, fm, e]);
  // F12 Kosten
  const kD = await dash(p, 'Materialkosten'); const kC = await chart(p, 'kosten');
  check('F12 Kosten = Volumen × Einheitspreis (Beispielpreise): in Dashboard und Diagramm gleich; im Rechenweg steht die Rechnung', nah(zahl(kD[0]), vol * e[0].preis) && nah(zahl(kD[1]), vol * e[1].preis) && kC.length === 2 && nah(kC[0].wert, vol * e[0].preis) && nah(kC[1].wert, vol * e[1].preis) && /Rechenweg/.test(await p.$eval('#rechnung-kosten', x => x.textContent)), [kD, kC]);
  // F13 CO2
  const cD = await dash(p, 'CO₂'); const cC = await chart(p, 'co2-fossil');
  check('F13 CO₂ (fossil) = Volumen × Kennwert je m³ (aus ÖKOBAUDAT-Datensatz): Dashboard, Diagramm und Rechnung stimmen überein', nah(zahl(cD[0]), vol * e[0].fossil) && nah(zahl(cD[1]), vol * e[1].fossil) && nah(cC[0].wert, vol * e[0].fossil, 0.6) && nah(cC[1].wert, vol * e[1].fossil, 0.6) && /Rechenweg|=/.test(await p.$eval('#rechnung-co2', x => x.textContent)), [cD, cC]);
  // F14 R-Wert
  const r = await zeile(p, '#rechnung-r', 'R = d');
  check('F14 R-Wert = Dicke ÷ Bemessungswert λB (0,20 ÷ λB, nachgerechnet): 5,71 bei λB 0,035', nah(zahl(r[0]), 0.2 / e[0].lb, 0.006) && nah(zahl(r[1]), 0.2 / e[1].lb, 0.006), [r, e.map(x => x.lb)]);
  await p.fill('#rZiel', '4'); await p.waitForTimeout(100);
  const rz = await p.$eval('#rechnung-rziel', x => x.innerText.replace(/\s+/g, ' '));
  check('F14 Ziel-R-Wert: Für R = 4 ergibt sich die erforderliche Dicke 4 × λB = 14 cm (und 14 m³ bei 100 m²)', /Erforderliche Dicke für R = 4 \(cm\) 14 14/.test(rz) && /Volumen \(m³\) 14 14/.test(rz), rz.slice(0, 300));
  await p.fill('#rZiel', '');
  // F15 technische Tabellen
  const labels = await p.$$eval('#ergebnis-technisch tr th, #ergebnis-technisch tr td:first-child, #ergebnis-weitere tr th, #ergebnis-weitere tr td:first-child, #rechnung-r tr td:first-child', c => c.map(x => x.textContent.replace(/\s+/g, ' ').trim()).join(' | '));
  check('F15 Technische Tabellen („Alle technischen Eigenschaften anzeigen“): Nennwert λD, Bemessungswert λB, Brandverhalten, Druckfestigkeit, Wasserdampf-μ, Recycling', ['Nennwert λD', 'Bemessungswert λB', 'Brandverhalten', 'Druckfestigkeit', 'Recycling'].every(t => labels.includes(t)), labels.slice(0, 300));
  // F16 Diagramme
  const charts = await p.$$eval('figure.chart', f => f.map(x => x.dataset.chart));
  const farbenOK = kC[0].farbe === '#951f2b' && kC[1].farbe === '#17643a' && cC[0].farbe === '#17643a' && cC[1].farbe === '#951f2b';
  check('F16 Farbige Diagramme: Kosten, CO₂ fossil, Gewicht, Wärmedämmung (+ CO₂ gesamt nach „Weitere Kennwerte“); Farbskala relativ und dynamisch (Mineralwolle gegen EPS: Kosten rot/grün, CO₂ grün/rot); Pflichtsatz und Legende da', charts.slice(0, 4).join() === 'kosten,co2-fossil,gewicht,lambda' && farbenOK && /Die Farben zeigen eine relative Bewertung der ausgewählten Materialien und stellen keine allgemeingültige Aussage über deren Qualität dar\./.test(await p.$eval('#diagramme', x => x.textContent.replace(/\s+/g, ' '))) && await p.$$eval('#diagramme .legend', l => l.length) === 1, [charts, kC, cC]);
  // Dashboard stimmt mit Tabellen und Diagrammen überein (eine Rechenquelle)
  const gD = await dash(p, 'Gewicht');
  check('Konsistenz: Gewicht in Dashboard, Diagramm und Tabelle ist dasselbe (keine doppelte Rechnung)', nah(zahl(gD[0]), zahl(gew[0])) && nah(zahl(gD[1]), zahl(gew[1])) && nah((await chart(p, 'gewicht'))[0].wert, zahl(gew[0])));

  // F8 Anwendungsbereich und F9 Prioritäten
  const mehrfach = await p.evaluate(() => { const m = MATERIALMATCH_DATA.baustoffe.find(x => x.anwendungen.length >= 2); return { id: m.id, kat: m.kategorien[0], anw: m.anwendungen, namen: m.anwendungen.map(a => MATERIALMATCH_DATA.anwendungsbereiche.find(x => x.id === a).name) }; });
  await p.selectOption('#kategorie', mehrfach.kat); await p.selectOption('#materialA', mehrfach.id);
  const aOpt = await p.$$eval('#anwendung option', o => o.map(x => x.value).filter(Boolean));
  await p.selectOption('#anwendung', mehrfach.anw[1]);
  await reiter(p, 'alternativen');
  const meta = await p.$eval('#alternativen-inhalt', x => x.innerText.replace(/\s+/g, ' '));
  check('F8 Anwendungsbereich: Die Auswahl bietet genau die Einsatzbereiche des Materials A; die gewählte Anwendung steht in den Alternativen („Anwendungsbereich: …“)', JSON.stringify(aOpt) === JSON.stringify(mehrfach.anw) && meta.includes('Anwendungsbereich: ' + mehrfach.namen[1]), [aOpt, mehrfach, meta.slice(0, 200)]);
  await reiter(p, 'vergleich');
  await p.selectOption('#anwendung', '');
  await p.selectOption('#kategorie', 'daemmstoff'); await p.selectOption('#materialA', 'mineralwolle'); await p.selectOption('#materialB', 'eps');
  const SKALA = ['#17643a', '#78b85a', '#e9c94e', '#e68b43', '#951f2b'];
  const g0 = await chart(p, 'gewicht');
  await p.selectOption('#prioritaet', 'gewicht');
  const g1 = await chart(p, 'gewicht');
  check('F9 Priorität „Geringes Gewicht“: das Gewichts-Diagramm wird jetzt farbig bewertet (vorher neutral grau, leichteres EPS grün); die Wahl steht in den Alternativen', g0.every(x => !SKALA.includes(x.farbe)) && g1[1].farbe === '#17643a' && g1[0].farbe === '#951f2b' && (await (async () => { await reiter(p, 'alternativen'); const t = await p.$eval('#alternativen-inhalt', x => x.innerText); await reiter(p, 'vergleich'); return /Priorität: Geringes Gewicht/.test(t.replace(/\s+/g, ' ')); })()), [g0, g1]);
  await p.selectOption('#prioritaet', 'ausgewogen');

  // F7 Dicke: Einheit und Fehler; F6 Fläche: Fehler
  await p.selectOption('#dickeEinheit', 'mm'); await p.fill('#dicke', '200');
  const kMm = await dash(p, 'Materialkosten');
  check('F7 Dicke: 200 mm ergibt dieselben Ergebnisse wie 20 cm (Einheiten mm, cm, m)', JSON.stringify(kMm) === JSON.stringify(kD) && JSON.stringify(await p.$$eval('#dickeEinheit option', o => o.map(x => x.value))) === '["mm","cm","m"]', kMm);
  await p.selectOption('#dickeEinheit', 'cm'); await p.fill('#dicke', '20');
  await p.fill('#flaeche', '50');
  const k50 = await dash(p, 'Materialkosten');
  check('F6 Fläche: 50 m² halbiert die Kosten (850 / 700 €)', nah(zahl(k50[0]), vol * e[0].preis / 2) && nah(zahl(k50[1]), vol * e[1].preis / 2), k50);
  await p.fill('#flaeche', '-5');
  const f1 = await p.$eval('#flaeche-fehler', x => x.textContent);
  await p.fill('#flaeche', '100'); await p.fill('#dicke', 'abc');
  const f2 = await p.$eval('#dicke-fehler', x => x.textContent);
  check('F6/F7 Ungültige Eingaben werden benannt („Die Fläche darf nicht negativ sein.“, „Bitte nur eine Zahl eingeben …“) und nicht verrechnet', /nicht negativ/.test(f1) && /nur eine Zahl/.test(f2), [f1, f2]);
  await p.fill('#dicke', '20');

  // F3 Herstellerprodukt
  await p.click('#btn-produkt');
  const prodOpt = await p.$$eval('#produktA option', o => o.map(x => x.value));
  const lamVorher = await zeile(p, '#ergebnis-technisch', 'Nennwert λD');
  await p.selectOption('#produktA', 'rockwool-fixrock-033');
  const lamNachher = await zeile(p, '#ergebnis-technisch', 'Nennwert λD');
  const kopfA = await p.$eval('#ergebnis-menge thead th:nth-child(2)', x => x.textContent.replace(/\s+/g, ' '));
  check('F3 Herstellerprodukt: Für Mineralwolle sind Produkte wählbar (Fixrock 035/033, Klemmrock 035, generisch); „Fixrock 033“ ändert λD (0,034 → 0,032) und steht im Tabellenkopf mit Hersteller', prodOpt.length >= 4 && /^0,034/.test(lamVorher[0]) && /^0,032/.test(lamNachher[0]) && /Fixrock 033/.test(kopfA) && /ROCKWOOL/.test(kopfA), [prodOpt, lamVorher, lamNachher, kopfA]);
  await p.selectOption('#produktA', 'rockwool-fixrock-035');

  // F4 drittes Material
  await p.click('#btn-drittes');
  await p.selectOption('#materialC', 'holzfaserdaemmung');
  const drei = await p.evaluate(() => ({ slots: document.querySelectorAll('#ergebnis-menge thead .slot').length, karten: document.querySelectorAll('#auswahl-karten article').length, balken: [...document.querySelectorAll('figure.chart[data-chart="kosten"] .chart-row[data-material]')].length, buchst: MM.auswahl.holeAuswahl().plaetze.map(x => x.buchstabe).join() }));
  check('F4 Drittes Material: Holzfaserdämmung als C ergibt drei Spalten, drei Karten, drei Balken je Diagramm', drei.slots === 3 && drei.karten === 3 && drei.balken === 3 && drei.buchst === 'A,B,C', drei);
  await p.selectOption('#materialC', '');
  check('F4 Drittes Material wieder entfernt: zurück auf zwei Materialien, Buchstaben bleiben A und B', await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.map(x => x.buchstabe).join() === 'A,B' && document.querySelectorAll('#ergebnis-menge thead .slot').length === 2));

  // F20 Demo-/Echtdaten-Modus
  const BSP = 'td .art-beispiel, #dashboard .art-beispiel, .chart-value .art-beispiel, #auswahl-karten .art-beispiel';
  const demoB = await p.$$eval(BSP, a => a.length);
  await p.click('#modus-schalter');
  const echt = await p.evaluate(() => ({ b: document.querySelectorAll('td .art-beispiel, #dashboard .art-beispiel, .chart-value .art-beispiel, #auswahl-karten .art-beispiel').length, modus: document.getElementById('modus-titel').textContent, preis: MM.auswahl.holeAuswahl().plaetze.map(x => x.material.eigenschaften.preis.wert) }));
  const kEcht = await dash(p, 'Materialkosten');
  check('F20 Demo-/Echtdaten-Modus: Im Echtdaten-Modus verschwinden alle B-Kennzeichen an Werten (Tabellen, Dashboard, Diagramme, Karten; vorher > 0; die Legende erklärt „B“ weiter), Preise sind „nicht verfügbar“ (keine Zahl, nichts geschätzt), Kosten werden nicht berechnet; Modusleiste zeigt „Verifizierte Daten“', demoB > 0 && echt.b === 0 && echt.modus === 'Datenmodus: Verifizierte Daten' && echt.preis.every(x => x === null) && kEcht.length === 0, [demoB, echt, kEcht]);
  await p.click('#modus-schalter');

  // F17 Alternativen
  await reiter(p, 'alternativen');
  const rec = await p.$$eval('#alternativen-inhalt .rec-card', c => c.length);
  await p.click('#alternativen-inhalt .rec-card button[data-aktion=vergleichen]:not([disabled])');
  const nachAlt = await p.evaluate(() => ({ reiter: MM.reiter.aktiv(), ids: MM.auswahl.holeAuswahl().plaetze.map(x => x.material.id) }));
  check('F17 Alternativen: drei Empfehlungskarten (die schon gewählte ist „Bereits im Vergleich“ gesperrt); „Alternative vergleichen“ übernimmt das Material als nächstes freies Material (hier C) und wechselt zum Vergleich', rec === 3 && nachAlt.reiter === 'vergleich' && nachAlt.ids.length === 3 && nachAlt.ids[0] === 'mineralwolle' && nachAlt.ids[1] === 'eps', nachAlt);
  await p.selectOption('#materialC', '');
  // F18 Quellen, F19 Datenqualität, F24 Hinweise
  await reiter(p, 'quellen');
  const q = await p.evaluate(() => ({ links: [...document.querySelectorAll('#quellen-auswahl a')].map(a => a.href), tabellen: document.querySelectorAll('#quellen-auswahl table').length, text: document.getElementById('quellen-auswahl').innerText }));
  check('F18 Quellen: Für jedes gewählte Material gibt es eine Quellentabelle mit anklickbaren https-Links; Werte ohne Quelle stehen ausdrücklich als „Ohne Quelle“', q.tabellen === 2 && q.links.length >= 3 && q.links.every(l => /^https:\/\//.test(l)) && /Ohne Quelle:/.test(q.text), q);
  await p.evaluate(() => document.querySelectorAll('#quellen details').forEach(d => d.open = true));
  const dq = await p.$eval('#qd-inhalt', x => ({ n: x.querySelectorAll('li').length, t: x.innerText.replace(/\s+/g, ' ') }));
  check('F19 Datenqualität: erklärt verifiziert (V), Richtwert (R), Beispieldaten (B), eigene Angabe (E), fehlende und nicht vergleichbare Daten', dq.n >= 6 && /verifiziert/i.test(dq.t) && /Richtwert/.test(dq.t) && /Beispieldaten/.test(dq.t) && /eigene/i.test(dq.t) && /nicht vergleichbar/i.test(dq.t) && /fehl/i.test(dq.t), dq.t.slice(0, 300));
  const hin = await p.$eval('#quellen-hinweise', x => x.innerText.replace(/\s+/g, ' '));
  check('F24 Fachliche Hinweise: ersetzt keine Nachweise; keine Aussage zu Zulassungen, technischer Gleichwertigkeit oder Normkonformität; Brandverhalten ist nicht Feuerwiderstand; Orientierung/Aktualität', /ersetz/i.test(hin) && /Zulassung/.test(hin) && /Gleichwertigkeit/.test(hin) && /Normkonformität/.test(hin) && /Brandverhalten/.test(hin) && /Feuerwiderstand/.test(hin), hin.slice(0, 300));
  // F23 Datenprüfung
  const pr = await p.evaluate(() => { const ok = MM.pruefeDaten(MATERIALMATCH_DATA); const kopie = JSON.parse(JSON.stringify(MATERIALMATCH_DATA)); kopie.baustoffe[0].eigenschaften.waermeleitfaehigkeit.wert = -1; kopie.baustoffe[1].eigenschaften.rohdichte.quelle = 'gibt-es-nicht'; const schlecht = MM.pruefeDaten(kopie); return { ok: ok.fehler.length, schlecht: schlecht.fehler.length, status: document.getElementById('status').textContent }; });
  check('F23 Datenprüfung: Die echten Daten haben 0 Fehler („Datenbank geprüft ✓“ in der Fußzeile); absichtlich beschädigte Kopie (negatives λ, unbekannte Quelle) wird erkannt', pr.ok === 0 && pr.schlecht >= 2 && /Datenbank geprüft ✓/.test(pr.status), pr);
  await reiter(p, 'vergleich');

  // F21 PDF, F22 CSV
  await p.click('#export-menue-knopf');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#csv-knopf')]);
  const csvPfad = path.join(TMP, 'x.csv'); await dl.saveAs(csvPfad); const csv = fs.readFileSync(csvPfad, 'utf8');
  check('F22 CSV-Export: Datei mit Excel-Kennung, Eingaben (Fläche, Dicke), Materialien, Kennwerten mit Datenart, Ergebnissen, Quellen und Datenmodus', csv.startsWith('﻿') && /Bauteilfläche/.test(csv) && /Mineralwolle/.test(csv) && /EPS/.test(csv) && /Datenmodus/.test(csv) && /Quelle/.test(csv) && /Gesamtgewicht/.test(csv), dl.suggestedFilename());
  await reiter(p, 'quellen');
  await p.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  const pdfPfad = path.join(TMP, 'x.pdf'); await p.pdf({ path: pdfPfad, format: 'A4', printBackground: true });
  await p.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  const seiten = +/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [pdfPfad]).toString())[1];
  const pt = execFileSync('pdftotext', ['-layout', pdfPfad, '-']).toString().replace(/\s+/g, ' ');
  check('F21 PDF-Export (Druckansicht): enthält Eingaben, Diagramme, technische Tabellen, Alternativen, Quellen und Hinweise – auch die Bereiche der gerade nicht sichtbaren Reiter; keine Bedienelemente', ['Bauteilfläche: 100 m²', 'Materialien im Vergleich', 'Alle technischen Eigenschaften anzeigen', 'Alternative Baustoffe entdecken', 'Quellen der ausgewählten Materialien', 'Rechtliche und fachliche Hinweise'].every(t => pt.includes(t)) && !/Ergebnisse exportieren/.test(pt) && seiten >= 5 && seiten <= 21, seiten);

  // F5 Eigene Produkte (eigener Browserspeicher)
  const e5 = await neu('demo');
  await e5.selectOption('#kategorie', 'daemmstoff'); await e5.selectOption('#materialA', 'mineralwolle'); await e5.selectOption('#materialB', 'eps');
  await e5.fill('#flaeche', '100'); await e5.fill('#dicke', '20');
  await e5.click('#btn-eigen');
  const fuelle = async o => { for (const [k, v] of Object.entries(o)) { if (/^ep-(material|brandverhalten|preis-einheit|mwst|umfang)$/.test(k)) await e5.selectOption('#' + k, v); else await e5.fill('#' + k, v); } };
  await fuelle({ 'ep-material': 'eps', 'ep-name': 'Muster-EPS', 'ep-hersteller': 'Muster GmbH', 'ep-quelle': 'Datenblatt 03/2026', 'ep-link': 'https://example.org/datenblatt.pdf', 'ep-datum': '2026-11-16', 'ep-waermeleitfaehigkeit': '0,036', 'ep-waermeleitfaehigkeit_bemessung': '0,038', 'ep-brandverhalten': 'E', 'ep-preis': '99,5', 'ep-preis-einheit': '€/m³', 'ep-haendler': 'Musterhändler', 'ep-mwst': 'inkl. 19 % MwSt.', 'ep-umfang': 'Material, Händlerpreis (ohne Transport und Einbau)' });
  await e5.click('#eigenes-produkt-box button[type=submit]');
  const eig = await e5.evaluate(() => MM.produkte.eigene());
  const optE = await e5.$$eval('#produktB option', o => o.map(x => [x.value, x.textContent]));
  const eigId = eig.length ? eig[0].id : null;
  await e5.click('#btn-produkt');
  if (eigId) await e5.selectOption('#produktB', eigId);
  await oeffneTabellen(e5);
  const lamE = await zeile(e5, '#ergebnis-technisch', 'Nennwert λD'); const kE = await dash(e5, 'Materialkosten');
  check('F5 Eigene Produkte: Ein eigenes Produkt (mit Quelle und Link) wird gespeichert, erscheint in der Produktliste von EPS als „eigenes Produkt“, wird mit „E“ (nicht geprüft) gekennzeichnet und gerechnet (λD 0,036; Kosten 20 m³ × 99,50 = 1.990 €)', eig.length === 1 && optE.some(o => /eigenes Produkt/.test(o[1])) && /^0,036/.test(lamE[1]) && await e5.$$eval('#ergebnis-technisch td .art-eigen', m => m.length > 0) && nah(zahl(kE[1]), 1990), [eig.length, optE, lamE, kE]);
  await e5.click('#eigenes-produkt-box button[type=submit]');
  check('F5 Eigene Produkte: Ein leeres Formular wird nicht gespeichert (Fehlermeldung statt neuer Eintrag)', await e5.evaluate(() => MM.produkte.eigene().length === 1 && !!document.querySelector('#eigenes-produkt-box [role=alert]') ));

  check('Keine Konsolenfehler oder -warnungen im gesamten Durchlauf', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
