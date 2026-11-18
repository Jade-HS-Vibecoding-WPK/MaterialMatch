/* Schritt 15 – Konsistenz der Dokumentation
   Aufruf:  node tests/test24.js
   Prüft: Dateiverweise, Pflichtabschnitte, Zahlen gegen die Datenbank, Tabellenform, Platzhalter,
          Schrittfolge und – besonders wichtig – dass jede Demo-Zahl in PRAESENTATION.md genau dem entspricht,
          was die App tatsächlich anzeigt. */
const { chromium } = require('playwright');
require('./_offline.js');
const fs = require('fs');
const path = require('path');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 500))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html?modus=demo';
const lies = f => fs.readFileSync(path.join(PROJ, f), 'utf8');
const DOKS = ['README.md', 'PROJEKTDOKUMENTATION.md', 'PRAESENTATION.md', 'FORTSCHRITT.md', 'QUALITAETSBERICHT.md', 'QUELLENBERICHT.md'];
const T = Object.fromEntries(DOKS.map(f => [f, lies(f)]));
const norm = s => s.replace(/−/g, '-');      // typografisches Minus

(async () => {
  // ================= 1. Dateiverweise =================
  const fehlende = [];
  DOKS.slice(0, 5).forEach(f => {
    const pfade = [...T[f].matchAll(/`((?:js|css|data|tools|tests)\/[A-Za-z0-9_\-./…*]+|[A-ZÄÖÜ_]+\.md|index\.html)`/g)].map(m => m[1]);
    pfade.forEach(p => { if (/[…*]/.test(p)) return; if (!fs.existsSync(path.join(PROJ, p))) fehlende.push(f + ': ' + p); });
  });
  check('Alle in Backticks genannten Projektdateien (js/, css/, data/, tools/, tests/, *.md, index.html) in README, Projektdokumentation, Präsentation, Fortschritt und Qualitätsbericht existieren wirklich', fehlende.length === 0, [...new Set(fehlende)].slice(0, 6));
  const jsDateien = fs.readdirSync(path.join(PROJ, 'js')).filter(f => f.endsWith('.js'));
  const imReadme = jsDateien.filter(f => !T['README.md'].includes('`js/' + f + '`'));
  check(`README-Tabelle nennt alle ${jsDateien.length} Programmdateien in js/`, imReadme.length === 0, imReadme);
  const imHtml = jsDateien.filter(f => !lies('index.html').includes('src="js/' + f + '"'));
  check('Jede Datei in js/ wird von index.html geladen (keine vergessene oder tote Datei)', imHtml.length === 0, imHtml);
  const toolDateien = fs.readdirSync(path.join(PROJ, 'tools'));
  check('README nennt alle Werkzeuge in tools/', toolDateien.every(f => T['README.md'].includes('tools/' + f)), toolDateien.filter(f => !T['README.md'].includes('tools/' + f)));
  const testDateien = fs.readdirSync(path.join(PROJ, 'tests')).filter(f => /^test\d+\.js$/.test(f));
  check('Die Dateien tests/test1.js … test53.js sind vollständig vorhanden (ohne test9, das es nie gab)', testDateien.length === 52, testDateien.length);

  // ================= 2. Pflichtabschnitte (Abschnitt 18 des Auftrags) =================
  const doku = T['PROJEKTDOKUMENTATION.md'];
  const ueberschriften = [...doku.matchAll(/^#{2,3} (.+)$/gm)].map(m => m[1]);
  const pflicht = ['Projektidee', 'Zielgruppe', 'Problemstellung', 'Verwendete Technologien', 'Verwendete Datenquellen', 'Wichtige Entwicklungsschritte', 'Technische Schwierigkeiten', 'Besonders hilfreiche Prompts', 'Funktionen der fertigen Anwendung', 'Grenzen der Anwendung', 'Mögliche Erweiterungen', 'Fachliche Entscheidungen', 'Technische Entscheidungen'];
  const fehltPflicht = pflicht.filter(p => !ueberschriften.some(u => u.includes(p)));
  check('PROJEKTDOKUMENTATION.md enthält alle 13 Pflichtabschnitte der Liste aus Abschnitt 18 des Auftrags (Projektidee … Technische Entscheidungen)', fehltPflicht.length === 0, fehltPflicht);
  check('„Fehler und deren Lösungen“ sind dokumentiert: Tabelle mit „Problem | Ursache | Lösung“ und mindestens 40 Einträgen', /\| Problem \| Ursache \| Lösung \|/.test(doku) && (doku.match(/^\| .+ \| .+ \| .+ \|$/gm) || []).length > 40);
  check('Fachliche Entscheidungen sind getrennt nach „durch euch“ und „von Claude Code vorgeschlagen“; technische Entscheidungen „von Claude Code übernommen“', /### Durch euch/.test(doku) && /### Von Claude Code vorgeschlagen/.test(doku) && /## Technische Entscheidungen \(von Claude Code übernommen\)/.test(doku));
  const schrittPos = []; for (let n = 1; n <= 15; n++) { const m = [...doku.matchAll(new RegExp('^### Schritt ' + n + ' ', 'gm'))]; schrittPos.push(m.length === 1 ? m[0].index : -1); }
  check('Jeder Schritt 1–15 hat genau einen Abschnitt „### Schritt n“', schrittPos.every(x => x >= 0), schrittPos);
  const reihenfolge = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 11, 13, 14, 15].map(n => schrittPos[n - 1]);
  check('Die Schrittabschnitte stehen in der tatsächlichen Entwicklungsreihenfolge (1–10, dann 12, dann 11, dann 13–15)', reihenfolge.every((x, i) => i === 0 || x > reihenfolge[i - 1]), reihenfolge);
  check('Der Reihenfolge-Fehler (Schritt 12 vor 11) ist dokumentiert, samt den gelösten Konflikten', /versehentlich vor Schritt 11/.test(doku) && /Konflikte durch die Reihenfolge/.test(doku));
  const praes = T['PRAESENTATION.md'];
  const praesPflicht = ['Der Pitch', 'Kernbotschaften', 'Zahlen für Folien', 'Live-Demo', 'Folienvorschlag', 'Plakat-Gliederung', 'Fragen und Antworten', 'gelernt', 'Quellenangaben', 'Checkliste'];
  check('PRAESENTATION.md enthält Pitch, Kernbotschaften, Zahlen, Live-Demo, Folien, Plakat, Fragen und Antworten, Lernerfahrungen, Quellenangaben und Checkliste', praesPflicht.every(p => praes.includes(p)), praesPflicht.filter(p => !praes.includes(p)));

  // ================= 3. Platzhalter und Veraltetes =================
  const platzhalter = [];
  DOKS.forEach(f => { [/wird in Schritt \d+ ausformuliert/, /\(wird laufend ergänzt\)/, /\*\(wird laufend ergänzt\)\*/, /\bTODO\b/, /\bFIXME\b/, /\bXXX\b/, /folgt in Schritt/, /Lorem/i].forEach(r => { if (r.test(T[f])) platzhalter.push(f + ': ' + r); }); });
  check('Keine Platzhalter („wird ausformuliert“, „wird laufend ergänzt“, TODO, „folgt in Schritt“) in den Dokumenten', platzhalter.length === 0, platzhalter);
  const veraltet = [];
  if (/nächster Schritt\*\*?\s*$/m.test(T['FORTSCHRITT.md']) && /Schritt 1[345]\s*[–-].*←/.test(T['FORTSCHRITT.md']) === false) { /* ok */ }
  if (/\[ \] Schritt 1[1-5]/.test(T['README.md'])) veraltet.push('README: offener Schritt 11–15');
  check('README zeigt keine offenen Entwicklungsschritte mehr (alle 15 Schritte abgehakt)', veraltet.length === 0 && (T['README.md'].match(/- \[x\] Schritt/g) || []).length >= 14, veraltet);

  // ================= 4. Tabellen rechteckig =================
  const tabProbleme = [];
  DOKS.forEach(f => { const z = T[f].split('\n'); let i = 0; while (i < z.length) { if (z[i].startsWith('|')) { const start = i; const cols = z[i].split(/(?<!\\)\|/).length; while (i < z.length && z[i].startsWith('|')) { const c = z[i].replace(/`[^`]*`/g, m => m.replace(/\|/g, '')).split(/(?<!\\)\|/).length; if (c !== cols) tabProbleme.push(`${f}: Zeile ${i + 1} hat ${c - 2} statt ${cols - 2} Spalten (Tabelle ab Zeile ${start + 1})`); i++; } } else i++; } });
  check('Alle Markdown-Tabellen sind rechteckig (gleiche Spaltenzahl in jeder Zeile, keine zerrissenen Tabellen)', tabProbleme.length === 0, tabProbleme.slice(0, 4));
  const kaputtTab = []; DOKS.forEach(f => { const z = T[f].split('\n'); for (let i = 1; i < z.length - 1; i++) if (z[i] === '' && z[i - 1].startsWith('|') && z[i + 1].startsWith('|')) kaputtTab.push(f + ' Zeile ' + (i + 1)); });
  check('Keine Leerzeile mitten in einer Tabelle', kaputtTab.length === 0, kaputtTab.slice(0, 3));

  // ================= 5. Zahlen gegen die Datenbank =================
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const fehler = []; p.on('pageerror', e => fehler.push(String(e))); p.on('console', m => { if (m.type() === 'error') fehler.push(m.text()); });
  await p.goto(URL);
  const D = await p.evaluate(() => { const d = MATERIALMATCH_DATA, z = MM.quellen.zaehle(d); const pr = MM.quellen.pruefe ? MM.quellen.pruefe(d) : null; return { n: d.baustoffe.length, kat: d.kategorien.length, q: d.quellen.filter(q => q.uuid).length, version: d.meta.version, stand: d.meta.datenstand, summe: z.summe, belegt: pr ? pr.belegteKennwerte : null }; });
  const ohneFg = D.summe;
  check(`Datenbank: ${D.n} Baustoffe in ${D.kat} Kategorien, ${D.q} ÖKOBAUDAT-Datensätze, Version ${D.version}`, D.n === 50 && D.kat === 5 && D.q === 61 && D.version === '0.4.0');
  check('Zahlenblock der Präsentation stimmt mit der Datenbank überein (50 Baustoffe, 5 Kategorien, 61 Datensätze, 152 belegte Kennwerte, 82 Beispieldaten, 257 „nicht verfügbar“)', praes.includes('**' + D.n + '** Baustoffe in **' + D.kat + '** Kategorien') && praes.includes('**' + D.q + '** Datensätze') && praes.includes('**' + D.belegt + '** belegte Kennwerte') && praes.includes('**' + ohneFg.beispiel + '** Beispieldaten') && praes.includes('**' + ohneFg.fehlt + '** „nicht verfügbar“') && D.belegt === 152, [D.belegt, ohneFg]);
  check('Projektdokumentation nennt dieselben Zahlen (Version, 61 Datensätze, 142 Richtwerte, 82 Beispieldaten, 19 nicht anwendbar, 257 nicht verfügbar, 152 belegte Kennwerte)', doku.includes('Version ' + D.version) && doku.includes('**61 Datensätzen**') && doku.includes(`${ohneFg.richtwert} Richtwerte, ${ohneFg.verifiziert} verifiziert, ${ohneFg.beispiel} Beispieldaten, ${ohneFg.nicht_anwendbar} nicht anwendbar, ${ohneFg.fehlt} nicht verfügbar`) && doku.includes(D.belegt + ' belegte Kennwerte'), ohneFg);
  const testAnzahl = testDateien.length;
  const stated = [...praes.matchAll(/in (\d+) Dateien/g)].map(m => +m[1]).concat([...T['README.md'].matchAll(/in (\d+) Dateien/g)].map(m => +m[1]), [...T['QUALITAETSBERICHT.md'].matchAll(/(\d+) Testdateien/g)].map(m => +m[1]));
  check(`Angaben zur Zahl der Testdateien in Präsentation, README und Qualitätsbericht stimmen mit der tatsächlichen Zahl (${testAnzahl}) überein`, stated.length >= 3 && stated.every(x => x === testAnzahl), [stated, testAnzahl]);

  // ================= 6. Demo-Zahlen der Präsentation gegen die App =================
  const tab = (sel) => p.$$eval(sel + ' table tr', trs => trs.map(tr => [...tr.cells].map(c => { const x = c.cloneNode(true); x.querySelectorAll('sup,.info,.info-text').forEach(s => s.remove()); return x.textContent.replace(/\s+/g, ' ').trim(); })));
  const zeile = async (sel, label) => (await tab(sel)).find(r => r[0].startsWith(label)).slice(1).map(x => x.replace(/\s*=.*$/, ''));
  const demo = async (a, b_, c, f, d) => { await p.evaluate(([a, b_, c]) => MM.auswahl.setzeAuswahl({ a, b: b_, c }), [a, b_, c]); await p.fill('#flaeche', f); await p.fill('#dicke', d); await p.$$eval('details', x => x.forEach(y => { y.open = true; }));
    return { gewicht: await zeile('#ergebnis-menge', 'Gesamtgewicht'), kosten: await zeile('#rechnung-kosten', 'Materialkosten'), co2: await zeile('#rechnung-co2', 'CO₂-Menge gesamt'), fossil: await zeile('#rechnung-co2', 'davon fossil'), r: await zeile('#rechnung-r', 'R = d'), volumen: await zeile('#ergebnis-menge', 'Volumen'),
      emp: await p.$$eval('#alternativen-inhalt article.rec-card', cs => cs.map(x => ({ name: x.querySelector('h3').textContent, score: (x.innerText.match(/Gesamtbewertung: ([\d,]+) von 1/) || [])[1] }))) }; };
  const A = await demo('mineralwolle', 'eps', 'zellulose', '100', '20');
  const pn = norm(praes);
  const hat = (...zahlen) => zahlen.every(z => pn.includes(norm(z)));
  const nm = x => x.replace('-', '-');
  check('Demo A (Dämmstoffe): Gewicht 925/500/900 kg, Kosten 1.700/1.400/2.200 €, fossil 1.329/1.728/195 kg, gesamt Zellulose −1.454 kg, R 5,71/5,71/5,41 (Mineralwolle und EPS aus λB, Zellulose nur Nennwert) – jede Zahl steht in der Präsentation und ist genau das, was die App anzeigt', JSON.stringify(A.gewicht) === '["925","500","900"]' && JSON.stringify(A.kosten) === '["1.700","1.400","2.200"]' && JSON.stringify(A.fossil) === '["1.329","1.728","195"]' && A.co2[2] === '-1.454' && JSON.stringify(A.r) === '["5,71","5,71","5,41"]' && hat('**925 kg**', '**500 kg**', '**900 kg**', '**1.700 €**', '**1.400 €**', '**2.200 €**', '**1.329 kg**', '**1.728 kg**', '**195 kg CO₂e**', '(−1.454 kg)', '**5,71**', '**5,41 m²K/W**'), A);
  check('Demo A: Empfehlungen Rang 1–3 EPS (0,8), Zellulosedämmung (0,79), Hanfdämmung (0,16) wie in der Präsentation', A.emp.length === 3 && A.emp[0].name.startsWith('EPS') && A.emp[0].score === '0,8' && A.emp[1].name.startsWith('Zellulose') && A.emp[1].score === '0,79' && A.emp[2].name.startsWith('Hanf') && A.emp[2].score === '0,16' && hat('**EPS (0,8 von 1)**', '**Zellulosedämmung (0,79)**', '**Hanfdämmung (0,16)**'), A.emp);
  const B = await demo('normalbeton', 'brettschichtholz', '', '100', '20');
  check('Demo B (Beton gegen Holz): Gewicht 46.000/10.304 kg, Kosten 4.090/12.000 €, CO₂ gesamt 4.433/−11.615 kg, fossil 4.435/4.806 kg – wie in der Präsentation', B.gewicht[0] === '46.000' && B.gewicht[1] === '10.304' && JSON.stringify(B.kosten) === '["4.090","12.000"]' && JSON.stringify(B.co2) === '["4.433","-11.615"]' && JSON.stringify(B.fossil) === '["4.435","4.806"]' && hat('**46.000 kg**', '**10.304 kg**', '**4.090 €**', '**12.000 €**', '**4.433 kg**', '**−11.615 kg**', '**4.435 kg**', '**4.806 kg**'), B);
  const bText = await p.evaluate(() => ({ kosten: document.querySelector('#rechnung-kosten').innerText + ' ' + document.querySelector('#ergebnis-kosten').innerText, co2: document.querySelector('#rechnung-co2').innerText, gesamtDia: document.querySelector('figure[data-chart="co2-gesamt"]').innerText,
    fossil: [...document.querySelectorAll('figure[data-chart="co2-fossil"] .chart-row[data-material]')].map(x => x.dataset.bewertung), gesamt: [...document.querySelectorAll('figure[data-chart="co2-gesamt"] .chart-row[data-material]')].map(x => x.dataset.bewertung) }));
  check('Demo B: Was die Präsentation behauptet, zeigt die App wirklich – Kosten: „Kein belastbarer direkter Vergleich möglich“ (Mehrwertsteuer/Leistungsumfang unbekannt); CO₂: Differenz der Gesamtwerte nicht angezeigt, „GWP gesamt“ nicht gefärbt, fossil bewertet (Beton vergleichsweise günstig, Holz vergleichsweise ungünstig)', /Kein belastbarer direkter Vergleich möglich: die Angabe zur Mehrwertsteuer/.test(bText.kosten) && /Differenz der Gesamtwerte wird deshalb nicht angezeigt/.test(bText.co2) && /GWP gesamt nicht farbig bewertet/.test(bText.gesamtDia) && JSON.stringify(bText.gesamt) === '["nicht bewertet","nicht bewertet"]' && JSON.stringify(bText.fossil) === '["vergleichsweise günstig","vergleichsweise ungünstig"]' && hat('färbt „GWP gesamt“ deshalb nicht', 'Beton grün, Holz rot', 'Kein belastbarer direkter Vergleich möglich“**, weil Mehrwertsteuer und Leistungsumfang unbekannt'), bText);
  const C = await demo('dachziegel', 'betondachstein', 'schiefer', '100', '20');
  check('Demo C (Dach): Volumen „–“, Gewicht 4.500/4.200/3.000 kg, CO₂ gesamt 1.659/1.298/1.561 kg, Kosten „nicht berechenbar“ – wie in der Präsentation', JSON.stringify(C.volumen) === '["–","–","–"]' && JSON.stringify(C.gewicht) === '["4.500","4.200","3.000"]' && JSON.stringify(C.co2) === '["1.659","1.298","1.561"]' && C.kosten.every(x => x === 'nicht berechenbar') && hat('**4.500 kg**', '**4.200 kg**', '**3.000 kg**', '**1.659 kg**', '**1.298 kg**', '**1.561 kg**', '**„nicht berechenbar“**'), C);
  const Dm = await demo('mineralwolle', 'kork', '', '100', '20');
  const lambdaKork = await zeile('#ergebnis-technisch', 'Nennwert λD');
  check('Demo D (Kork): λ „fehlt“, Kosten und R-Wert „nicht berechenbar“, CO₂ gesamt −1.702 kg – wie in der Präsentation', lambdaKork[1] === 'fehlt' && Dm.kosten[1] === 'nicht berechenbar' && Dm.r[1] === 'nicht berechenbar' && Dm.co2[1] === '-1.702' && hat('**−1.702 kg**'), [lambdaKork, Dm]);
  check('Die Schnellrechnung der Präsentation stimmt: 100 m² × 20 cm = 20 m³ (alle Materialien der Demo A)', JSON.stringify(A.volumen) === '["20","20","20"]' && praes.includes('20 m³'));
  check('Keine JavaScript-Fehler während der Demo-Läufe', fehler.length === 0, fehler);
  await b.close();

  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
  process.exit(fails === 0 ? 0 : 1);
})();
