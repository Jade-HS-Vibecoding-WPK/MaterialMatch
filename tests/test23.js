/* Schritt 14 – Abschließende Qualitätskontrolle
   Aufruf:  node tests/test23.js
   Teile:
     A  Rechnen: App gegen einen UNABHÄNGIGEN Referenzrechner (tests/referenzrechnung.py) – 50 Materialien × viele Fälle
     B  Zahleneingaben: App gegen die Referenz-Grammatik an mehreren tausend Zeichenketten
     C  Eingaben in der Oberfläche: Einheiten und Schreibweisen ergeben dasselbe Ergebnis
     D  Diagrammfarben und Balken: unabhängig aus den angezeigten Werten nachgerechnet
     E  Affentest: 600 zufällige Bedienschritte, nach jedem Schritt Invarianten prüfen
     F  Tastatur: gesamte Seite per Tab, kein Fokus-Gefängnis, sichtbarer Fokus, Namen
     G  Offline / keine fremden Anfragen / Start über lokalen Server
     H  Inhaltliche Regeln des Auftrags (keine Pauschalaussagen, Pflichtsatz, Haftung, keine englischen Rohtexte)
     I  Geschwindigkeit */
const { chromium } = require('playwright');
require('./_offline.js');
const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 600))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html?modus=demo';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-test23-'));

// ---- Zufall mit Startwert (wiederholbar)
function prng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const wuerfel = (r, liste) => liste[Math.floor(r() * liste.length)];
const nah = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async (w = 1280, h = 900, opt = {}) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, acceptDownloads: true });
    const pg = await ctx.newPage();
    pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
    pg.on('pageerror', e => errors.push('pageerror: ' + String(e)));
    if (opt.stub) await pg.addInitScript(() => { window.print = function () { window.__druck = (window.__druck || 0) + 1; }; });
    await pg.goto(opt.url || URL); await pg.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
    return pg;
  };
  const waehle = (pg, a, b_ = '', c = '') => pg.evaluate(([a, b_, c]) => MM.auswahl.setzeAuswahl({ a, b: b_, c }), [a, b_, c]);
  const oeffneAlle = pg => pg.$$eval('details', d => d.forEach(x => { x.open = true; }));

  const p = await neu(1280, 900, { stub: true });
  const DB = await p.evaluate(() => JSON.parse(JSON.stringify(MATERIALMATCH_DATA)));

  // ============================ A. Rechnen gegen Referenz ============================
  const r = prng(20261116);
  const flaechen = [0.5, 1, 7.3, 12.5, 100, 1234.5, 250000];
  const dicken = [0.001, 0.0125, 0.02, 0.05, 0.1, 0.2, 0.2, 0.3, 1.5, 9.99];
  const bezugsdicken = DB.baustoffe.flatMap(m => ['preis', 'gwp'].map(k => m.eigenschaften[k] && m.eigenschaften[k].bezugsdicke_m).filter(Boolean));
  const faelle = [[100, 0.2], [1, 1], [0.5, 0.001]].concat(Array.from({ length: 21 }, () => [wuerfel(r, flaechen), wuerfel(r, dicken.concat(bezugsdicken))]));
  const ziele = [1, 2.5, 5, 7.5, 50];
  const texte = ['', ' ', '0', '-0', '+5', '-5', '12,5', '12.5', '1.500', '1.500,5', '1.5000', '1.000.000', '1.000.000,25', '12,5,5', '1,', ',5', '.5', '5.', '1e3', '1,5e3', '٣', '１２', 'abc', '12 m', '12m²', '1 000', '1 000', '1 000,5', '00012', '0,000001', '999999999999999', '1234567890123456', '0,1234567890123456', '--5', '+-5', '5-', '1,2.3', '1.2,3', '12.345.678', '12.34.567', '123.456', '1.23', '0.5', '0,50', '10.000', '10.00', '-1.500,00', '.', ',', '-', '+', ' - 4 ', '3 , 5'];
  const alphabet = '0123456789..,,,- +e a';
  for (let i = 0; i < 4000; i++) { let s = ''; const n = Math.floor(r() * 11); for (let k = 0; k < n; k++) s += alphabet[Math.floor(r() * alphabet.length)]; texte.push(s); }
  for (let i = 0; i < 1500; i++) { const g = Math.floor(r() * 4), ziffern = n => Array.from({ length: n }, () => Math.floor(r() * 10)).join(''); const teile = [ziffern(1 + Math.floor(r() * 3))]; for (let k = 0; k < g; k++) teile.push(ziffern(3)); texte.push(teile.join('.') + (r() < 0.5 ? ',' + ziffern(1 + Math.floor(r() * 3)) : '')); }  // Tausendergruppen
  const ref = JSON.parse(execFileSync('python3', ['-I', path.join(PROJ, 'tests', 'referenzrechnung.py')], { input: JSON.stringify({ baustoffe: DB.baustoffe, faelle, ziele, texte }), maxBuffer: 1 << 28 }).toString());
  const app = await p.evaluate(([faelle, ziele, texte]) => {
    const B = MM.berechnung, out = { rechnung: {}, lesen: [] };
    MATERIALMATCH_DATA.baustoffe.forEach(m => {
      out.rechnung[m.id] = faelle.map(([A, d]) => {
        const s = B.berechneSchicht(m, A, d), k = B.berechneKosten(m, A, d), c = B.berechneCo2(m, A, d), rr = B.berechneR(m, d);
        return { volumen: s.moeglich && s.volumen_m3 !== null ? s.volumen_m3 : null, gewicht: s.moeglich ? s.gewicht_kg : null, flaechenmasse: s.moeglich ? s.flaechenmasse_kgm2 : null,
          kosten: k.moeglich ? k.kosten_eur : null, co2: c.moeglich ? { gesamt: c.gesamt, fossil: c.fossil, biogen: c.biogen, luluc: c.luluc } : null, R: rr.moeglich ? rr.R : null,
          dicke_fuer_R: ziele.map(z => { const e = B.erforderlicheDicke(m, z); return e.moeglich ? e.dicke_m : null; }) };
      });
    });
    texte.forEach(t => { const x = B.parseZahl(t); out.lesen.push(x.leer ? ['leer'] : x.fehler ? ['fehler'] : ['wert', x.wert]); });
    return out;
  }, [faelle, ziele, texte]);
  let abw = [], n = 0, nichtLeer = 0;
  const vergl = (id, i, name, a, e) => { n++; if (e !== null && e !== undefined) nichtLeer++; if ((a === null) !== (e === null) || (a !== null && !nah(a, e, 1e-9))) abw.push(`${id} Fall ${i} ${name}: App ${a} ≠ Referenz ${e}`); };
  Object.keys(ref.rechnung).forEach(id => ref.rechnung[id].forEach((e, i) => {
    const a = app.rechnung[id][i];
    ['volumen', 'gewicht', 'flaechenmasse', 'kosten', 'R'].forEach(k => vergl(id, i, k, a[k], e[k]));
    if ((a.co2 === null) !== (e.co2 === null)) abw.push(`${id} Fall ${i} co2: Verfügbarkeit`); else if (e.co2) ['gesamt', 'fossil', 'biogen', 'luluc'].forEach(k => vergl(id, i, 'co2.' + k, a.co2[k], e.co2[k]));
    e.dicke_fuer_R.forEach((x, j) => vergl(id, i, 'dicke_fuer_R' + ziele[j], a.dicke_fuer_R[j], x));
  }));
  check(`A: ${Object.keys(ref.rechnung).length} Materialien × ${faelle.length} Fälle (Volumen, Gewicht, Flächenmasse, Kosten, CO₂ gesamt/fossil/biogen/luluc, R, erforderliche Dicke für 5 R-Ziele): App = Referenzrechner (${n} Vergleiche, davon ${nichtLeer} mit Zahlenwert)`, abw.length === 0 && n > 15000 && nichtLeer > 8000, abw.slice(0, 5));
  const verf = { schicht: 0, flaeche: 0, nein: 0 }; ref.rechnung.normalbeton.forEach(e => { if (e.volumen !== null) verf.schicht++; });
  ref.rechnung.dachziegel.forEach(e => { if (e.gewicht !== null && e.volumen === null) verf.flaeche++; });
  check('A: Die Fälle decken beide Mengenmodelle ab (Schicht: Volumen vorhanden; Plattenprodukt/Deckung: Gewicht aus Flächengewicht ohne Volumen)', verf.schicht === faelle.length && verf.flaeche === faelle.length, verf);
  // A2 Handrechnung: drei Beispiele, die ich von Hand nachgerechnet habe (unabhängig von Python und App)
  const nb = app.rechnung.normalbeton[0], mw = app.rechnung.mineralwolle[0];
  const dbN = DB.baustoffe.find(m => m.id === 'normalbeton').eigenschaften, dbM = DB.baustoffe.find(m => m.id === 'mineralwolle').eigenschaften;
  check('A2: Handrechnung 100 m² × 20 cm Normalbeton: Volumen 20 m³, Gewicht 20 × 2300 = 46.000 kg, Kosten 20 × 204,50 € = 4.090 € (Holcim-Listenpreis), CO₂ gesamt 20 × 221,656798… ≈ 4.433,14 kg', nah(nb.volumen, 20) && nah(nb.gewicht, 46000) && nah(nb.kosten, 4090) && Math.abs(nb.co2.gesamt - 4433.13596) < 0.01 && dbN.rohdichte.wert === 2300 && dbN.preis.wert === 204.5, nb);
  check('A2: Handrechnung Mineralwolle 100 m² × 20 cm: Gewicht 20 × 46,25 = 925 kg, R = 0,2 / 0,035 ≈ 5,714 m²K/W (Bemessungswert λB des ROCKWOOL-Datenblatts, nicht der Nennwert 0,034), Dicke für R = 5 → 0,175 m', nah(mw.gewicht, 925) && Math.abs(mw.R - 5.714285714) < 1e-6 && nah(mw.dicke_fuer_R[2], 0.175) && dbM.waermeleitfaehigkeit_bemessung.wert === 0.035 && dbM.waermeleitfaehigkeit.wert === 0.034, mw);
  const dz = app.rechnung.dachziegel[0];
  check('A2: Handrechnung Dachziegel 100 m²: Gewicht 100 × 45 = 4.500 kg (Flächengewicht), CO₂ 100 × 16,588… ≈ 1.658,83 kg je m², kein Volumen, kein R', nah(dz.gewicht, 4500) && dz.volumen === null && Math.abs(dz.co2.gesamt - 1658.83394) < 0.01 && dz.R === null, dz);

  // ============================ B. Zahlen lesen ============================
  const lesAbw = [];
  texte.forEach((t, i) => { const a = app.lesen[i], e = ref.lesen[i]; if (a[0] !== e[0] || (a[0] === 'wert' && !nah(a[1], e[1], 1e-12))) lesAbw.push(JSON.stringify(t) + ': App ' + JSON.stringify(a) + ' ≠ Referenz ' + JSON.stringify(e)); });
  const kat = { leer: 0, fehler: 0, wert: 0 }; ref.lesen.forEach(x => { kat[x[0]]++; });
  check(`B: ${texte.length} Zeichenketten (Handliste, 4.000 Zufallsfolgen, 1.500 Tausendergruppen-Schreibweisen): App liest wie die Referenz-Grammatik (${kat.wert} Zahlen, ${kat.fehler} Fehler, ${kat.leer} leer)`, lesAbw.length === 0 && kat.wert > 800 && kat.fehler > 800, lesAbw.slice(0, 5));
  const bekannt = { '12,5': 12.5, '12.5': 12.5, '1.500,5': 1500.5, '1.000.000': 1e6, ' 1 000 ': 1000, '-5': -5, '+5': 5, '0,000001': 1e-6 };
  const bek = Object.entries(bekannt).filter(([t, v]) => { const x = texte.indexOf(t); return x < 0 ? false : !(ref.lesen[x][0] === 'wert' && app.lesen[x][0] === 'wert' && nah(app.lesen[x][1], v)); });
  check('B: Bekannte Schreibweisen: „12,5“ = „12.5“ = 12,5 · „1.500,5“ = 1500,5 · „1.000.000“ = 1 Mio. · „1.500“ ist mehrdeutig und wird abgelehnt (nicht geraten)', bek.length === 0 && app.lesen[texte.indexOf('1.500')][0] === 'fehler' && app.lesen[texte.indexOf('1e3')][0] === 'fehler', bek);

  // ============================ C. Oberfläche: Einheiten und Schreibweisen ============================
  await waehle(p, 'normalbeton', 'mineralwolle', '');
  const volumenAnzeige = async () => { await oeffneAlle(p); return p.$$eval('#ergebnis-menge table tr', trs => { const z = trs.find(t => t.cells[0].textContent.startsWith('Volumen')); return z ? [...z.cells].slice(1).map(c => c.textContent.replace(/\s+/g, ' ').trim()) : null; }); };
  const gewichtAnzeige = async () => p.$$eval('#ergebnis-menge table tr', trs => { const z = trs.find(t => t.cells[0].textContent.startsWith('Gesamtgewicht')); return z ? [...z.cells].slice(1).map(c => { const x = c.cloneNode(true); x.querySelectorAll('sup').forEach(s => s.remove()); return x.textContent.replace(/\s+/g, ' ').trim(); }) : null; });
  const eingaben = [['100', '20', 'cm'], ['100', '200', 'mm'], ['100', '0,2', 'm'], ['100,0', '20,00', 'cm'], ['1 00', '2 0', 'cm'], ['100', '0.2', 'm'], ['+100', '+20', 'cm']];
  const alleGleich = [];
  for (const [f, d, u] of eingaben) {
    await p.fill('#flaeche', f); await p.fill('#dicke', d); await p.selectOption('#dickeEinheit', u);
    alleGleich.push(JSON.stringify([await volumenAnzeige(), await gewichtAnzeige()]));
  }
  check('C: „100 m² × 20 cm“ in sieben Schreibweisen und Einheiten (20 cm = 200 mm = 0,2 m, mit Leerzeichen, Punkt/Komma, Vorzeichen) ergibt jedes Mal Volumen 20 m³ und Gewicht 46.000 kg (= 46 t) / 925 kg', new Set(alleGleich).size === 1 && alleGleich[0] === JSON.stringify([['20', '20'], ['46.000= 46 t', '925']]), alleGleich);
  await p.selectOption('#dickeEinheit', 'cm');
  const fehlerfaelle = [['', '20', 'unvollstaendig'], ['100', '', 'unvollstaendig'], ['-5', '20', 'fehler'], ['100', '0', 'fehler'], ['0', '20', 'fehler'], ['abc', '20', 'fehler'], ['1.500', '20', 'fehler'], ['2000000', '20', 'fehler'], ['100', '1100', 'fehler'], ['1e3', '20', 'fehler']];
  const feRes = [];
  for (const [f, d, soll] of fehlerfaelle) {
    await p.fill('#flaeche', f); await p.fill('#dicke', d);
    const st = await p.evaluate(() => ({ status: MM.eingaben.hole().status, fF: document.getElementById('flaeche-fehler').textContent, fD: document.getElementById('dicke-fehler').textContent }));
    const text = await p.$eval('#ergebnis-menge', e => e.innerText);
    feRes.push([f, d, st.status, soll, st.status === soll, (soll === 'fehler' ? (st.fF + st.fD).length > 10 : true), !/NaN|Infinity|undefined/.test(text) && !/\d,\d\d\d\d\d/.test('') ]);
  }
  check('C: Fehleingaben: richtiger Status (leer/unvollständig/Fehler), verständliche Fehlermeldung am Feld, keine Berechnung mit ungültigen Werten, kein NaN', feRes.every(x => x[4] && x[5] && x[6]), feRes.filter(x => !(x[4] && x[5] && x[6])));
  await p.fill('#flaeche', '100'); await p.fill('#dicke', '20');

  // ============================ D. Diagrammfarben und Balken ============================
  const STOPPS = [[0, [0x95, 0x1F, 0x2B]], [0.25, [0xE6, 0x8B, 0x43]], [0.5, [0xE9, 0xC9, 0x4E]], [0.75, [0x78, 0xB8, 0x5A]], [1, [0x17, 0x64, 0x3A]]];
  const farbeVon = s => { for (let i = 1; i < STOPPS.length; i++) if (s <= STOPPS[i][0]) { const t = (s - STOPPS[i - 1][0]) / (STOPPS[i][0] - STOPPS[i - 1][0]); return STOPPS[i - 1][1].map((v, k) => v + (STOPPS[i][1][k] - v) * t); } return STOPPS[4][1]; };
  const rgbVon = css => css.startsWith('#') ? [1, 3, 5].map(i => parseInt(css.slice(i, i + 2), 16)) : css.match(/[\d.]+/g).slice(0, 3).map(Number);
  const nahFarbe = (x, y) => x.every((v, k) => Math.abs(v - y[k]) <= 1.01);
  const kats = {}; DB.baustoffe.forEach(m => m.kategorien.forEach(k => { (kats[k] = kats[k] || []).push(m.id); }));
  const r2 = prng(14);
  let farbAbw = [], diagramme = 0, bewertet = 0, grau = 0, neutral = 0, balkenAbw = [];
  const richtung = { kosten: 'niedriger', 'co2-fossil': 'niedriger', 'co2-gesamt': 'niedriger', lambda: 'niedriger', gewicht: 'niedriger' };
  for (let i = 0; i < 160; i++) {
    const kat_ = wuerfel(r2, Object.keys(kats)), pool = kats[kat_].slice();
    const wahl = []; const nM = 2 + Math.floor(r2() * 2); while (wahl.length < nM) { const m = wuerfel(r2, pool); if (!wahl.includes(m)) wahl.push(m); }
    const prio = wuerfel(r2, ['ausgewogen', 'kosten', 'co2', 'gewicht', 'waerme']);
    await waehle(p, wahl[0], wahl[1], wahl[2] || ''); await p.selectOption('#prioritaet', prio);
    await p.fill('#flaeche', '100'); await p.fill('#dicke', '20'); await oeffneAlle(p);
    const figs = await p.$$eval('figure.chart', fs => fs.map(f => ({ id: f.dataset.chart, text: f.innerText.replace(/\s+/g, ' '), zeilen: [...f.querySelectorAll('.chart-row[data-material]')].map(z => { const bar = z.querySelector('.chart-bar'); return { wert: z.dataset.wert === '' ? null : parseFloat(z.dataset.wert), bew: z.dataset.bewertung, farbe: bar ? getComputedStyle(bar).backgroundColor : null, dfarbe: z.dataset.farbe, links: bar ? parseFloat(bar.style.left) : null, breite: bar ? parseFloat(bar.style.width) : null, null_: z.querySelector('.chart-zero') ? parseFloat(z.querySelector('.chart-zero').style.left) : null }; }) })));
    figs.forEach(f => {
      diagramme++;
      const werte = f.zeilen.map(z => z.wert).filter(v => v !== null);
      const skala = f.zeilen.some(z => ['vergleichsweise günstig', 'eher günstig', 'mittlerer Bereich', 'eher ungünstig', 'vergleichsweise ungünstig'].includes(z.bew));
      if (werte.length >= 2) {
        const mn = Math.min(...werte), mx = Math.max(...werte), spanne = mx - mn, bezug = Math.max(Math.abs(mn), Math.abs(mx));
        const gleich = spanne === 0 || spanne / bezug < 0.02;
        f.zeilen.forEach((z, k) => {
          if (z.farbe && z.dfarbe && !nahFarbe(rgbVon(z.farbe), rgbVon(z.dfarbe))) farbAbw.push(`${f.id}/${wahl}: Balkenfarbe ${z.farbe} ≠ data-farbe ${z.dfarbe}`);
          if (z.wert === null) { if (z.farbe) farbAbw.push(`${f.id}/${wahl}: fehlender Wert hat Balken`); return; }
          z = Object.assign({}, z, { farbe: z.dfarbe });
          if (skala) {
            bewertet++;
            if (gleich) farbAbw.push(`${f.id}/${wahl}: Werte praktisch gleich, aber Skala gefärbt`);
            else { const exp = farbeVon((richtung[f.id] === 'niedriger' ? (mx - z.wert) : (z.wert - mn)) / spanne); if (!nahFarbe(rgbVon(z.farbe), exp)) farbAbw.push(`${f.id}/${wahl}/${prio}: Wert ${z.wert} Farbe ${z.farbe} erwartet ${exp.map(Math.round)}`); }
          } else if (gleich && spanne >= 0) { if (!nahFarbe(rgbVon(z.farbe), [0x7C, 0x8A, 0x99]) && !nahFarbe(rgbVon(z.farbe), [0xB8, 0xBE, 0xC4])) farbAbw.push(`${f.id}/${wahl}: gleiche Werte weder neutral noch grau: ${z.farbe}`); neutral++; }
          else { grau++; if (!nahFarbe(rgbVon(z.farbe), [0xB8, 0xBE, 0xC4]) && !nahFarbe(rgbVon(z.farbe), [0x7C, 0x8A, 0x99])) farbAbw.push(`${f.id}/${wahl}: nicht bewertet, aber Farbe ${z.farbe}`); }
        });
        if (!skala && !gleich) { const erklaert = /Nicht bewertet|Kein belastbarer|Vorbehalt|nicht vergleichbar|Nicht vergleichbar|keine Farbabstufung|nicht bewertet|nicht farbig bewertet|Wird nur bewertet/i.test(f.text); if (!erklaert) farbAbw.push(`${f.id}/${wahl}/${prio}: grau ohne Erklärung`); }
      }
      // Balkengeometrie: Achse beginnt bei null, Länge ∝ |Wert|, negative Werte links der Nulllinie
      if (werte.length) {
        const amin = Math.min(0, ...werte), amax = Math.max(0, ...werte), asp = (amax - amin) || 1, nullP = -amin / asp * 100;
        f.zeilen.forEach(z => { if (z.wert === null || z.breite === null) return; const w = Math.abs(z.wert) / asp * 100, l = z.wert >= 0 ? nullP : nullP - w; if (Math.abs(z.breite - w) > 0.05 || Math.abs(z.links - l) > 0.05) balkenAbw.push(`${f.id}/${wahl}: Wert ${z.wert} Breite ${z.breite} erwartet ${w.toFixed(2)}; links ${z.links} erwartet ${l.toFixed(2)}`); });
      }
    });
  }
  check(`D: ${diagramme} Diagramme (160 zufällige Auswahlen aus allen Kategorien, alle Prioritäten): wo bewertet wird, stimmt jede Balkenfarbe mit der unabhängigen Berechnung (Min-Max, Interpolation zwischen #951F2B · #E68B43 · #E9C94E · #78B85A · #17643A) überein; praktisch gleiche Werte nie gefärbt`, farbAbw.length === 0 && bewertet > 150, { farbAbw: farbAbw.slice(0, 4), bewertet });
  check(`D: ${grau} nicht bewertete und ${neutral} neutrale Balken: nie in Skalenfarben, grau nur mit erklärendem Hinweis im Diagramm`, grau + neutral > 30, [grau, neutral]);
  check('D: Balkenlänge entspricht dem Zahlenwert (Achse beginnt bei 0, negative Werte links der Nulllinie) – alle Balken aller Diagramme', balkenAbw.length === 0, balkenAbw.slice(0, 4));
  // Farbskala selbst: Stützstellen exakt, Extremwerte
  const stuetz = await p.evaluate(() => [0, 0.25, 0.5, 0.75, 1].map(s => MM.bewertung.farbeFuerScore(s)));
  check('D: Farbskala der App: Stützstellen genau #951F2B, #E68B43, #E9C94E, #78B85A, #17643A (Vorgabe des Auftrags)', JSON.stringify(stuetz) === JSON.stringify(['#951F2B', '#E68B43', '#E9C94E', '#78B85A', '#17643A']), stuetz);
  // Zwei Materialien: deutlicher Hinweis; Pflichtsatz
  await waehle(p, 'eps', 'xps', ''); await p.fill('#flaeche', '100'); await p.fill('#dicke', '20'); await oeffneAlle(p);
  const diaText = await p.$eval('#diagramme-inhalt', e => e.innerText.replace(/\s+/g, ' '));
  check('D: Nur zwei Materialien: deutlicher Hinweis „Die Farben sind rein relativ“', /Nur zwei Materialien: Die Farben sind rein relativ/.test(diaText), diaText.slice(-300));
  check('D: Pflichtsatz zu den relativen Farben steht wörtlich im Diagrammbereich', (await p.$eval('#diagramme', e => e.innerText.replace(/\s+/g, ' '))).includes('Die Farben zeigen eine relative Bewertung der ausgewählten Materialien und stellen keine allgemeingültige Aussage über deren Qualität dar.'));
  // Identische Werte / fehlende Werte / Skala bei drei Werten
  const zeilenLambda = async (a, b_, c) => { await waehle(p, a, b_, c); await oeffneAlle(p); return p.$$eval('figure[data-chart="lambda"] .chart-row[data-material]', z => z.map(x => ({ wert: x.dataset.wert, bew: x.dataset.bewertung, farbe: x.dataset.farbe.toUpperCase(), balken: !!x.querySelector('.chart-bar') }))); };
  let lam = await zeilenLambda('mineralwolle', 'eps', '');
  check('D: Identische Werte (λB 0,035 bei Mineralwolle und EPS, beide laut Herstellerdatenblatt; gleiche Sorte Wert, da beide λB haben): beide neutral #7C8A99 und „gleichwertig“, nicht grün/rot', lam.length === 2 && lam.every(x => x.wert === '0.035' && x.farbe === '#7C8A99' && x.bew === 'gleichwertig'), lam);
  lam = await zeilenLambda('mineralwolle', 'xps', '');
  check('D: Fehlender Wert (XPS ohne λ): „fehlt“, kein Balken, keine Farbe; der einzelne vorhandene Wert wird nicht bewertet (mindestens zwei nötig)', lam[1].bew === 'fehlt' && !lam[1].balken && lam[1].farbe === '' && lam[0].bew === 'nicht bewertet', lam);
  lam = await zeilenLambda('mineralwolle', 'eps', 'zellulose');
  check('D: Drei Werte (0,035 · 0,035 · 0,039): Zellulose (höchstes λ) ist schlechtester Wert = Dunkelrot #951F2B, die beiden niedrigeren sind bester Wert = Dunkelgrün #17643A', lam.length === 3 && lam[2].farbe === '#951F2B' && lam[0].farbe === '#17643A' && lam[1].farbe === '#17643A' && lam[2].bew === 'vergleichsweise ungünstig' && lam[0].bew === 'vergleichsweise günstig', lam);

  // ============================ J. Empfehlungen gegen unabhängigen Empfehlungsrechner ============================
  // Zweite Umsetzung der Regeln (aus der Beschreibung „So wird bewertet“ hergeleitet, ohne den App-Code zu benutzen):
  //  1 Eignung: nur Materialien mit dem Anwendungsbereich · 2 Vergleichbarkeit: Preis/CO₂ je m³ (kg über Rohdichte, m² über Bezugsdicke), Dämmstoffe je R = 1 (× λ),
  //  CO₂ nur bei gleichem Datensatztyp und gleichen Modulen · mindestens 2 Kennwerte, davon einer ohne Preis · 3 Bewertung: Min-Max je Kriterium (niedriger = besser, < 2 % = 0,5),
  //  Gewicht 3 für das Prioritätskriterium, sonst 1 · 4 Rang: Score, Datenabdeckung, Name · höchstens 3
  const unabhaengig = (daten, refId, bereich, prio) => {
    const num = x => typeof x === 'number' && isFinite(x);
    const mat_ = id => daten.baustoffe.find(m => m.id === id);
    const quelle = id => daten.quellen.find(q => q.id === id);
    const R = mat_(refId);
    const rho = m => { const x = m.eigenschaften.rohdichte; return x && num(x.wert) && x.wert > 0 ? x.wert : null; };
    const preisM3 = m => { const x = m.eigenschaften.preis; if (!x || !num(x.wert) || m.mengenmodell !== 'schicht') return null; if (x.einheit === '€/m³') return x.wert; if (x.einheit === '€/kg') return rho(m) ? x.wert * rho(m) : null; if (x.einheit === '€/m²' && x.bezugsdicke_m > 0) return x.wert / x.bezugsdicke_m; return null; };
    const co2M3 = m => { const g = m.eigenschaften.gwp; if (!g || !g.werte || !num(g.werte.fossil) || m.mengenmodell !== 'schicht') return null; const q = quelle(g.quelle); const info = { typ: q && q.typ ? q.typ : 'beispiel', modul: g.module }; if (g.deklarierte_einheit === '1 m³') info.wert = g.werte.fossil; else if (g.deklarierte_einheit === '1 kg') { if (!rho(m)) return null; info.wert = g.werte.fossil * rho(m); } else if (g.deklarierte_einheit === '1 m²' && g.bezugsdicke_m > 0) info.wert = g.werte.fossil / g.bezugsdicke_m; else return null; return info; };
    const lamb = m => { const l = m.eigenschaften.waermeleitfaehigkeit; return l && num(l.wert) && l.wert > 0 ? l.wert : null; };
    const wert = (m, k) => { switch (k) { case 'kosten': return preisM3(m) === null ? null : { v: preisM3(m) }; case 'co2': { const c = co2M3(m); return c ? { v: c.wert, typ: c.typ, modul: c.modul } : null; } case 'kosten_r': return preisM3(m) !== null && lamb(m) ? { v: preisM3(m) * lamb(m) } : null; case 'co2_r': { const c = co2M3(m); return c && lamb(m) ? { v: c.wert * lamb(m), typ: c.typ, modul: c.modul } : null; } case 'lambda': return lamb(m) ? { v: lamb(m) } : null; case 'gewicht': return rho(m) ? { v: rho(m) } : null; } return null; };
    let ids = bereich === 'waermedaemmung' ? ['kosten_r', 'co2_r', 'lambda'] : ['kosten', 'co2'];
    if (prio === 'waerme' && !ids.includes('lambda')) ids.push('lambda');
    if (prio === 'gewicht') ids.push('gewicht');
    const stark = { kosten: ['kosten', 'kosten_r'], co2: ['co2', 'co2_r'], waerme: ['lambda'], gewicht: ['gewicht'] }[prio] || [];
    const gew = k => stark.includes(k) ? 3 : 1;
    const refW = {}; ids.forEach(k => { refW[k] = wert(R, k); });
    const krit = ids.filter(k => refW[k]);
    if (!krit.length) return { leer: true };
    const kand = daten.baustoffe.filter(m => m.id !== refId && m.anwendungen.includes(bereich));
    const info = kand.map(m => { const w = {}; krit.forEach(k => { const x = wert(m, k); if (!x) return; if ((k === 'co2' || k === 'co2_r') && (x.typ !== refW[k].typ || x.modul !== refW[k].modul)) return; w[k] = x.v; }); return { m, w }; });
    const nicht = [], ok = [];
    info.forEach(i => { const ks = Object.keys(i.w); if (ks.length < 2 || !ks.some(k => k !== 'kosten' && k !== 'kosten_r')) nicht.push(i.m.id); else ok.push(i); });
    const sc = {}, gueltig = [];
    krit.forEach(k => {
      const traeger = ok.filter(i => k in i.w); const werte = [refW[k].v].concat(traeger.map(i => i.w[k]));
      if (werte.length < 2) return; gueltig.push(k);
      const mn = Math.min(...werte), mx = Math.max(...werte), sp = mx - mn, bz = Math.max(Math.abs(mn), Math.abs(mx));
      const s_ = v => (sp === 0 || sp / bz < 0.02) ? 0.5 : (mx - v) / sp;
      traeger.forEach(i => { (sc[i.m.id] = sc[i.m.id] || {})[k] = s_(i.w[k]); });
    });
    const summeAlle = ids.reduce((a, k) => a + gew(k), 0);
    const liste = ok.map(i => { const eig = gueltig.filter(k => sc[i.m.id] && k in sc[i.m.id]); const sw = eig.reduce((a, k) => a + gew(k) * sc[i.m.id][k], 0), sg = eig.reduce((a, k) => a + gew(k), 0); return { id: i.m.id, name: i.m.name, score: sg ? sw / sg : 0, abd: sg / summeAlle, kriterien: eig }; });
    liste.sort((a, b) => Math.abs(b.score - a.score) > 1e-9 ? b.score - a.score : Math.abs(b.abd - a.abd) > 1e-9 ? b.abd - a.abd : (a.name < b.name ? -1 : 1));
    return { krit, empf: liste.slice(0, 3), dahinter: liste.slice(3).map(x => x.id), nicht, kandidaten: kand.length };
  };
  const appEmpf = await p.evaluate(() => { const out = []; MATERIALMATCH_DATA.baustoffe.forEach(ref => ref.anwendungen.forEach(b => ['ausgewogen', 'kosten', 'co2', 'gewicht', 'waerme'].forEach(pr => { const x = MM.empfehlung.empfehle(MATERIALMATCH_DATA, ref.id, b, pr); out.push({ ref: ref.id, bereich: b, prio: pr, meldung: x.meldung, krit: x.kriterien.filter(k => k.vorhanden).map(k => k.id), empf: x.empfehlungen.map(e => ({ id: e.material.id, score: e.score, krit: e.kriterien.map(k => k.id) })), nicht: x.nichtEmpfohlen.map(n => n.material.id) }); }))); return out; });
  let empfAbw = [], mitEmpf = 0, ohneEmpf = 0;
  appEmpf.forEach(a => {
    const u = unabhaengig(DB, a.ref, a.bereich, a.prio);
    if (u.leer) { if (!(a.empf.length === 0 && a.meldung)) empfAbw.push(`${a.ref}/${a.bereich}/${a.prio}: Referenz sagt „keine Kriterien“, App zeigt Empfehlungen`); return; }
    const kopf = `${a.ref}/${a.bereich}/${a.prio}`;
    if (JSON.stringify(a.krit) !== JSON.stringify(u.krit)) empfAbw.push(kopf + ': Kriterien ' + a.krit + ' ≠ ' + u.krit);
    if (JSON.stringify(a.empf.map(e => e.id)) !== JSON.stringify(u.empf.map(e => e.id))) empfAbw.push(kopf + ': Rangfolge ' + a.empf.map(e => e.id) + ' ≠ ' + u.empf.map(e => e.id));
    else a.empf.forEach((e, i) => { if (Math.abs(e.score - u.empf[i].score) > 1e-9) empfAbw.push(kopf + `: Score ${e.id} ${e.score} ≠ ${u.empf[i].score}`); if (JSON.stringify(e.krit) !== JSON.stringify(u.empf[i].kriterien)) empfAbw.push(kopf + `: Kriterien von ${e.id}`); });
    if (JSON.stringify([...a.nicht].sort()) !== JSON.stringify([...u.nicht, ...u.dahinter].sort())) empfAbw.push(kopf + ': „nicht empfohlen“-Liste weicht ab');
    if (a.empf.length) mitEmpf++; else ohneEmpf++;
  });
  check(`J: ${appEmpf.length} Empfehlungsläufe (alle 50 Materialien × jeder ihrer Anwendungsbereiche × 5 Prioritäten): Rangfolge, Gesamtbewertung (auf 1e-9), verwendete Kriterien und „nicht empfohlen“-Liste stimmen mit dem unabhängigen Empfehlungsrechner überein (${mitEmpf} Läufe mit Empfehlungen, ${ohneEmpf} ohne)`, empfAbw.length === 0 && appEmpf.length >= 250 && mitEmpf > 60, empfAbw.slice(0, 4));
  // Gegenprobe: der unabhängige Rechner erkennt eine absichtlich veränderte Regel (sonst wäre der Vergleich wertlos)
  const daten2 = JSON.parse(JSON.stringify(DB)); daten2.baustoffe.find(m => m.id === 'eps').eigenschaften.preis.wert = 1;
  const uA = unabhaengig(DB, 'mineralwolle', 'waermedaemmung', 'ausgewogen'), uB = unabhaengig(daten2, 'mineralwolle', 'waermedaemmung', 'ausgewogen');
  check('J: Gegenprobe: ändert man einen Preis, ändert sich die Bewertung im Referenzrechner (der Vergleich ist empfindlich)', JSON.stringify(uA.empf.map(e => e.score)) !== JSON.stringify(uB.empf.map(e => e.score)));

  // J2: Grenzfälle, die die echten Daten kaum erzeugen (Handrechnung)
  const norm = await p.evaluate(() => { const N = (w, r) => MM.bewertung.normalisiere(w, r || 'niedriger'); return {
    a: N([100, 102.8]).status,          // Unterschied 2,8 / 102,8 = 2,72 % ≥ 2 % -> bewertet
    b: N([100, 101.9]).status,          // 1,9 / 101,9 = 1,86 % < 2 % -> praktisch gleich
    c: N([100, 104]).status,            // 4 / 104 = 3,85 % -> bewertet (auch bei einer Schwelle von 5 % müsste das gleich sein)
    d: N([100, 100]).status,            // identisch
    e: N([-100, -98.5]).status,         // 1,5 / 100 = 1,5 % < 2 % bei negativen Werten
    f: N([100, 97.5]).status,           // 2,5 / 100 = 2,5 % -> bewertet
    g: N([100, 100, 103.5]).scores,     // niedriger ist besser: (103,5 − 100)/3,5 = 1 → Wert 100 bester Score
    h: N([10, 30], 'hoeher').scores }; });
  check('J2: 2-%-Regel (Handrechnung): 2,72 % → bewertet · 1,86 % → praktisch gleich · 3,85 % und 2,5 % → bewertet · −100/−98,5 (1,5 %) → gleich · identisch → identisch', norm.a === 'ok' && norm.b === 'gleich' && norm.c === 'ok' && norm.d === 'identisch' && norm.e === 'gleich' && norm.f === 'ok', norm);
  check('J2: Normalisierung (Handrechnung): [100,100,103,5] niedriger = besser → Scores 1 · 1 · 0; [10,30] höher = besser → 0 · 1', JSON.stringify(norm.g.map(x => Math.round(x * 1e6) / 1e6)) === '[1,1,0]' && JSON.stringify(norm.h) === '[0,1]', norm);
  // Gleicher Score, unterschiedliche Datenabdeckung: Das Material mit mehr Kennwerten steht vorn – auch wenn sein Name im Alphabet später kommt
  const tie = await p.evaluate(() => { const d = JSON.parse(JSON.stringify(MATERIALMATCH_DATA)); const basis = JSON.parse(JSON.stringify(d.baustoffe.find(m => m.id === 'normalbeton')));
    const mk = (id, name, ohnePreis) => { const m = JSON.parse(JSON.stringify(basis)); m.id = id; m.name = name; m.anwendungen = ['tragwerk']; m.kategorien = ['tragend']; if (ohnePreis) { m.eigenschaften.preis.wert = null; m.eigenschaften.preis.art = null; } return m; };
    const ref = mk('ref', 'Referenz', false), a = mk('qa', 'A-Weniger Kennwerte', true), z = mk('pz', 'Z-Mehr Kennwerte', false);
    d.baustoffe = [ref, a, z];                      // alle Werte identisch zu Material A -> alle Scores 0,5
    const r = MM.empfehlung.empfehle(d, 'ref', 'tragwerk', 'gewicht'); return { ids: r.empfehlungen.map(e => e.material.id), scores: r.empfehlungen.map(e => Math.round(e.score * 1000) / 1000), abd: r.empfehlungen.map(e => Math.round(e.abdeckung * 100) / 100) }; });
  check('J2: Gleiche Gesamtbewertung (alle Werte identisch → 0,5): Rang nach Datenabdeckung, nicht nach Alphabet – „Z-Mehr Kennwerte“ (3 von 3 Kriterien, Abdeckung 100 %) vor „A-Weniger Kennwerte“ (2 von 3 Kriterien: Gewichtung 1+3 von 5 = 80 %)', JSON.stringify(tie.ids) === '["pz","qa"]' && tie.scores.every(x => x === 0.5) && tie.abd[0] === 1 && tie.abd[1] === 0.8, tie);

  // ============================ E. Affentest ============================
  const q = await neu(1280, 900, { stub: true });
  const mr = prng(777);
  const fehlerStart = errors.length;
  const korpus = ['100', '12,5', '0,5', '1.250,75', '', '-3', 'abc', '1e3', '0', '250000', '99999999', '7', '20', '2', '0,001', '1.500', '3 4'];
  const stat = { aktionen: 0, pruefungen: 0, uebersprungen: 0 };
  const verstoesse = [];
  const einAktion = async () => {
    const wahl = mr();
    const opt = id => q.$$eval('#' + id + ' option', o => o.map(x => ({ v: x.value, aus: x.disabled })));
    const istAus = id => q.$eval('#' + id, e => e.disabled);
    if (wahl < 0.10) { const o = (await opt('kategorie')).filter(x => x.v && !x.aus); if (o.length && !(await istAus('kategorie'))) await q.selectOption('#kategorie', wuerfel(mr, o).v, { timeout: 1500 }); }
    else if (wahl < 0.38) { const id = wuerfel(mr, ['materialA', 'materialB', 'materialC']); if (!(await istAus(id))) { const o = (await opt(id)).filter(x => !x.aus); if (o.length) await q.selectOption('#' + id, wuerfel(mr, o).v, { timeout: 1500 }); } }
    else if (wahl < 0.50) await q.fill('#flaeche', wuerfel(mr, korpus), { timeout: 1500 });
    else if (wahl < 0.60) await q.fill('#dicke', wuerfel(mr, korpus), { timeout: 1500 });
    else if (wahl < 0.64) await q.selectOption('#dickeEinheit', wuerfel(mr, ['mm', 'cm', 'm']), { timeout: 1500 });
    else if (wahl < 0.70) { const o = (await opt('prioritaet')).filter(x => !x.aus); await q.selectOption('#prioritaet', wuerfel(mr, o).v, { timeout: 1500 }); }
    else if (wahl < 0.74) { if (!(await istAus('anwendung'))) { const o = (await opt('anwendung')).filter(x => !x.aus); if (o.length) await q.selectOption('#anwendung', wuerfel(mr, o).v, { timeout: 1500 }); } }
    else if (wahl < 0.77) await q.fill('#rZiel', wuerfel(mr, korpus), { timeout: 1500 });
    else if (wahl < 0.82) { const s = await q.$$('main summary'); if (s.length) await wuerfel(mr, s).click({ timeout: 1500 }); }
    else if (wahl < 0.86) { const k = await q.$$('button.info'); const sichtbar = []; for (const x of k) if (await x.isVisible()) sichtbar.push(x); if (sichtbar.length) await wuerfel(mr, sichtbar).click({ timeout: 1500 }); }
    else if (wahl < 0.91) { const k = await q.$$('#alternativen-inhalt .rec-card button[data-aktion=vergleichen]:not([disabled])'); const sichtbar = []; for (const x of k) if (await x.isVisible()) sichtbar.push(x); if (sichtbar.length) await wuerfel(mr, sichtbar).click({ timeout: 1500 }); }
    else if (wahl < 0.93) { const k = q.locator('#alle-umschalten'); if (await k.isVisible()) await k.click({ timeout: 1500 }); }
    else if (wahl < 0.96) { if (!(await q.$eval('#csv-knopf', e => e.disabled))) { await q.evaluate(() => { if (document.getElementById('export-menue').hidden) document.getElementById('export-menue-knopf').click(); }); const [dl] = await Promise.all([q.waitForEvent('download', { timeout: 3000 }), q.click('#csv-knopf', { timeout: 1500 })]); const pfad = path.join(TMP, 'affe.csv'); await dl.saveAs(pfad); if (!fs.readFileSync(pfad, 'utf8').startsWith('﻿')) verstoesse.push('CSV ohne BOM'); } }
    else if (wahl < 0.97) { if (!(await q.$eval('#druck-knopf', e => e.disabled))) { await q.evaluate(() => { if (document.getElementById('export-menue').hidden) document.getElementById('export-menue-knopf').click(); }); await q.click('#druck-knopf', { timeout: 1500 }); await q.evaluate(() => { window.dispatchEvent(new Event('beforeprint')); window.dispatchEvent(new Event('afterprint')); }); } }
    else await q.keyboard.press(wuerfel(mr, ['Tab', 'Tab', 'Shift+Tab', 'Enter', 'Space', 'ArrowDown']));
  };
  const invarianten = async (schritt) => {
    const z = await q.evaluate(() => {
      const pl = MM.auswahl.holeAuswahl().plaetze;
      const ids = pl.map(p => p.material.id + '|' + p.produkt.id);   // dasselbe Material nur mit verschiedenen Produkten
      const open = [...document.querySelectorAll('details')].map(d => d.open);
      return { ids, buch: pl.map(p => p.buchstabe), karten: document.querySelectorAll('#alternativen-inhalt article.rec-card').length, druckAus: document.getElementById('druck-knopf').disabled, csvAus: document.getElementById('csv-knopf').disabled, status: document.getElementById('status').className, hinweisSichtbar: !document.getElementById('export-hinweis').hidden, dok: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1 };
    });
    stat.pruefungen++;
    if (new Set(z.ids).size !== z.ids.length) verstoesse.push(`Schritt ${schritt}: Material doppelt gewählt ${z.ids}`);
    if (z.karten > 3) verstoesse.push(`Schritt ${schritt}: ${z.karten} Empfehlungskarten`);
    if (z.druckAus !== (z.ids.length === 0) || z.csvAus !== (z.ids.length === 0) || z.hinweisSichtbar !== (z.ids.length === 0)) verstoesse.push(`Schritt ${schritt}: Export-Schaltflächen passen nicht zur Auswahl (${z.ids.length} Materialien)`);
    if (!z.status.includes('ok')) verstoesse.push(`Schritt ${schritt}: Systemcheck nicht ok`);
    if (!z.dok) verstoesse.push(`Schritt ${schritt}: Seite scrollt seitlich`);
  };
  const textPruefung = async (schritt) => {
    await oeffneAlle(q);
    const t = await q.evaluate(() => { document.querySelectorAll('[role=tabpanel]').forEach(x => { x.hidden = false; }); return document.body.innerText; });
    const m = t.match(/\bundefined\b|\bNaN\b|\bInfinity\b|\[object|\bnull\b(?!\s*\))(?<!bei null)/);
    const m2 = t.match(/(?<!bei )\bnull\b/);
    if (/\bundefined\b|\bNaN\b|Infinity|\[object/.test(t) || m2) verstoesse.push(`Schritt ${schritt}: verdächtiger Text „${(t.match(/\bundefined\b|\bNaN\b|Infinity|\[object|(?<!bei )\bnull\b/) || [''])[0]}“`);
    // gemischte Einheiten/Leerstellen: keine doppelten Leerzeichen-Zahlen wie "1 000 000"? (nur Konsistenzstichprobe: kein "-0" als Ergebnis)
    if (/(^|\s)-0(\s|$)/.test(t.replace(/m²|–/g, ''))) verstoesse.push(`Schritt ${schritt}: Wert „-0“`);
  };
  const SCHRITTE = 600;
  for (let i = 1; i <= SCHRITTE; i++) {
    try { await einAktion(); stat.aktionen++; }
    catch (e) { if (/Timeout|not visible|not enabled|detached|intercepts|waiting for/.test(String(e.message))) stat.uebersprungen++; else verstoesse.push(`Schritt ${i}: Ausnahme ${String(e.message).slice(0, 120)}`); }
    await invarianten(i);
    if (i % 15 === 0) await textPruefung(i);
  }
  const neueFehler = errors.slice(fehlerStart);
  check(`E: Affentest mit ${SCHRITTE} zufälligen Bedienschritten (Kategorie, Materialien, Eingaben inkl. Unsinn, Einheit, Priorität, Anwendungsbereich, R-Ziel, Bereiche, i-Knöpfe, „Alternative vergleichen“, Alle aufklappen, CSV, Drucken, Tastatur): keine Verletzung der Invarianten (Material und Produkt nie doppelt, höchstens 3 Karten, Export-Knöpfe passend, Systemcheck grün, kein seitliches Scrollen, nie undefined/NaN/Infinity)`, verstoesse.length === 0 && stat.aktionen > SCHRITTE * 0.75, { verstoesse: verstoesse.slice(0, 5), stat });
  check('E: Affentest ohne JavaScript-Fehler oder Konsolenwarnungen', neueFehler.length === 0, neueFehler.slice(0, 3));
  const endZustand = await q.evaluate(() => MM.auswahl.holeAuswahl().plaetze.length);
  check('E: Der Affentest hat die Oberfläche wirklich bewegt (Materialien gewählt, mehrfach gewechselt)', stat.aktionen > 400 && stat.pruefungen === SCHRITTE, [stat, endZustand]);

  // ============================ F. Tastaturbedienung ============================
  const t = await neu(1280, 900);
  await waehle(t, 'mineralwolle', 'xps', 'eps'); await t.fill('#flaeche', '100'); await t.fill('#dicke', '20'); await oeffneAlle(t);
  await t.click('#ergebnis-technisch tbody tr:first-child th .info');
  await t.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
  await t.click('h1');                     // Startpunkt der Tab-Reihenfolge an den Seitenanfang legen
  const besuch = []; let rundlauf = false, haengt = false;
  for (let i = 0; i < 900; i++) {
    await t.keyboard.press('Tab');
    const f = await t.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return { ende: true }; const s = getComputedStyle(e), rc = e.getBoundingClientRect(); const lab = e.labels && e.labels.length ? e.labels[0].textContent : '';
      const name = (e.getAttribute('aria-label') || lab || e.textContent || e.value || e.title || '').replace(/\s+/g, ' ').trim();
      return { tag: e.tagName, id: e.id, name: name.slice(0, 50), outline: s.outlineStyle === 'auto' || (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2), schatten: s.boxShadow !== 'none', sichtbar: rc.width > 0 && rc.height > 0, key: e.tagName + '|' + e.id + '|' + (e.className || '') + '|' + name.slice(0, 30) + '|' + Math.round(rc.top + window.scrollY) + '|' + Math.round(rc.left) }; });
    if (f.ende) { rundlauf = true; break; }
    if (besuch.length && besuch[besuch.length - 1].key === f.key) { haengt = true; break; }
    besuch.push(f);
  }
  check(`F: Tab durch die ganze Seite (${besuch.length} Stationen): läuft am Ende zurück zum Browser/Seitenanfang, kein Fokus-Gefängnis`, rundlauf && !haengt && besuch.length > 30, { stationen: besuch.length, rundlauf, haengt });
  check('F: Jede fokussierte Stelle ist sichtbar, hat einen Namen (Beschriftung/Text/aria-label) und einen deutlichen Fokusrahmen (Outline ≥ 2 px)', besuch.every(x => x.sichtbar && x.name.length > 0 && (x.outline || x.schatten)), besuch.filter(x => !(x.sichtbar && x.name.length > 0 && (x.outline || x.schatten))).slice(0, 4));
  const erreichbar = await t.evaluate(() => { const alle = [...document.querySelectorAll('button:not([disabled]), select:not([disabled]), input:not([disabled]), a[href], summary, [tabindex="0"]')].filter(e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden'; }); return alle.length; });
  check(`F: Alle ${erreichbar} sichtbaren Bedienelemente (Knöpfe, Felder, Links, Bereichsüberschriften) sind per Tab erreichbar (Stationen ≥ Elemente)`, besuch.length >= erreichbar - 3 && besuch.length <= erreichbar + 2, [besuch.length, erreichbar]);
  // Enter/Leertaste
  await t.evaluate(() => { document.getElementById('ergebnisse').querySelector('summary').focus(); });
  const vor = await t.$eval('#ergebnisse > details', d => d.open);
  await t.keyboard.press('Enter'); const nach1 = await t.$eval('#ergebnisse > details', d => d.open);
  await t.keyboard.press('Space'); const nach2 = await t.$eval('#ergebnisse > details', d => d.open);
  check('F: Bereichsüberschrift: Enter klappt zu, Leertaste wieder auf', vor === true && nach1 === false && nach2 === true, [vor, nach1, nach2]);
  await t.focus('#materialA'); await t.keyboard.press('ArrowDown');
  const wechsel = await t.evaluate(() => document.getElementById('materialA').value);
  check('F: Materialauswahl per Pfeiltasten möglich (Auswahl ändert sich ohne Maus)', wechsel !== 'mineralwolle', wechsel);
  // Rückwärts
  let rueck = 0; for (let i = 0; i < 3; i++) { await t.keyboard.press('Shift+Tab'); rueck++; }
  check('F: Shift+Tab bewegt den Fokus rückwärts (Kategorie, Bereichsüberschrift, Reiter), ohne Absturz', rueck === 3 && await t.evaluate(() => document.activeElement !== document.body));

  // ============================ G. Offline und Start über Server ============================
  const anfragen = [];
  const g = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const gp = await g.newPage();
  gp.on('request', rq => anfragen.push(rq.url()));
  gp.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await gp.goto(URL); await gp.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
  await waehle(gp, 'brettsperrholz', 'normalbeton', 'baustahl'); await gp.fill('#flaeche', '100'); await gp.fill('#dicke', '20'); await oeffneAlle(gp);
  await gp.evaluate(() => MM.exportieren.csvHerunterladen());
  // Einzige Ausnahme (Bento-Redesign): die Schrift „Nunito“ von Google Fonts. Sie ist rein optisch; ohne Internet greift die Systemschrift.
  const SCHRIFT = /^https:\/\/fonts\.(googleapis|gstatic)\.com(\/|$)/;
  const fremd = anfragen.filter(u => !/^(file|blob|data):/.test(u) && !SCHRIFT.test(u));
  check(`G: Während einer ganzen Sitzung (${anfragen.length} Anfragen, inkl. CSV-Download) wird außer der Schrift „Nunito“ (Google Fonts) nichts aus dem Netz geladen – alle Daten, Skripte, Stile und Symbole sind lokal: die App läuft offline`, fremd.length === 0 && anfragen.length >= 10, fremd.slice(0, 3));
  const ext = await gp.evaluate(() => [...document.querySelectorAll('script[src], link[href], img[src], iframe[src], source[src]')].map(e => e.getAttribute('src') || e.getAttribute('href')).filter(u => /^(https?:)?\/\//i.test(u)));
  check('G: Keine externen Skripte, Bilder oder Stile im Seitenquelltext (kein CDN); erlaubt ist nur die Schrift „Nunito“ von Google Fonts (preconnect und Stylesheet)', ext.filter(u => !SCHRIFT.test(u)).length === 0 && ext.length <= 3, ext);
  const nurSchrift = await gp.evaluate(() => [...document.querySelectorAll('link[href^="http"]')].every(e => /fonts\.(googleapis|gstatic)\.com/.test(e.href)));
  check('G: Die Seite funktioniert ohne die Schrift (Rückfall auf Systemschrift): font-family nennt Nunito mit system-ui als Ersatz, der Systemcheck bleibt grün', nurSchrift && /Nunito.*system-ui/.test(await gp.evaluate(() => getComputedStyle(document.body).fontFamily + '|' + getComputedStyle(document.documentElement).getPropertyValue('--schrift'))) && await gp.$eval('#status', e => e.classList.contains('ok')));
  // lokaler Server (README, Variante 2)
  const port = 18000 + Math.floor(Math.random() * 1000);
  const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: PROJ, stdio: 'ignore' });
  await new Promise(res => setTimeout(res, 1200));
  try {
    const sp = await neu(1280, 900, { url: `http://127.0.0.1:${port}/index.html?modus=demo` });
    await waehle(sp, 'mineralwolle', 'eps', ''); await sp.fill('#flaeche', '100'); await sp.fill('#dicke', '20'); await oeffneAlle(sp);
    const st = await sp.textContent('#status'); const vol = await sp.$$eval('#ergebnis-menge table tr', trs => (trs.find(t => t.cells[0].textContent.startsWith('Gesamtgewicht')) || { cells: [] }).cells[1].textContent);
    check('G: Start über lokalen Server (python3 -m http.server, README Variante 2): Systemcheck grün, Rechnung identisch (Gewicht 925 kg)', /Datenbank geprüft ✓/.test(st) && /925/.test(vol), [st.slice(0, 60), vol]);
    await sp.close();
  } finally { srv.kill(); }

  // ============================ H. Inhaltliche Regeln ============================
  const h = await neu(1280, 900, { stub: true });
  const rh = prng(99);
  const verbot = [/immer nachhaltiger/i, /ist (immer |grundsätzlich )?(besser|nachhaltiger) als/i, /beste[rn]? (Baustoff|Material|Wahl)/i, /garantiert/i, /bauaufsichtlich zugelassen/i, /\bgenerisch(er)? Datensatz\b.*\bverifiziert\b/i];
  const englisch = [/generic dataset/i, /average dataset/i, /representative dataset/i, /specific dataset/i, /template dataset/i, /\bundefined\b/];
  const heikel = /Zulassung|zugelassen|Normkonform|gleichwertig|Gleichwertigkeit/i;
  let verstossH = [], saetze = 0, kombis = 0, preisNur = 0;
  for (let i = 0; i < 40; i++) {
    const kat_ = wuerfel(rh, Object.keys(kats)), pool = kats[kat_].slice(); const wahl = []; while (wahl.length < 3 && wahl.length < pool.length) { const m = wuerfel(rh, pool); if (!wahl.includes(m)) wahl.push(m); }
    await waehle(h, wahl[0], wahl[1], wahl[2] || ''); await h.selectOption('#prioritaet', wuerfel(rh, ['ausgewogen', 'kosten', 'co2', 'gewicht', 'waerme']));
    await h.fill('#flaeche', '100'); await h.fill('#dicke', '20'); await oeffneAlle(h);
    const txt = await h.evaluate(() => { document.querySelectorAll('[role=tabpanel]').forEach(x => { x.hidden = false; }); return document.body.innerText; }); kombis++;
    verbot.forEach(v => { if (v.test(txt)) verstossH.push(`${wahl}: verbotene Aussage ${v}`); });
    const ohneKlammern = txt.replace(/\((generic|average|representative|specific|template) dataset\)/gi, '');   // Originalbegriff in Klammern hinter der deutschen Bezeichnung ist gewollt
    englisch.forEach(v => { if (v.test(ohneKlammern)) verstossH.push(`${wahl}: englischer Rohtext ${v}`); });
    txt.split(/(?<=[.!?])\s+/).filter(s => heikel.test(s)).forEach(s => { saetze++; if (!/\b(keine|nicht|ohne|ersetzt|kein|weder|nichts)\b/i.test(s)) verstossH.push(`${wahl}: Aussage zu Zulassung/Normkonformität ohne Verneinung: „${s.slice(0, 120)}“`); });
    if (!txt.includes('Die Farben zeigen eine relative Bewertung der ausgewählten Materialien und stellen keine allgemeingültige Aussage über deren Qualität dar.')) verstossH.push(`${wahl}: Pflichtsatz fehlt`);
    if (!/Hilfsmittel für frühe Entwurfsentscheidungen/.test(txt)) verstossH.push(`${wahl}: Hinweis „Hilfsmittel für frühe Entwurfsentscheidungen“ fehlt`);
    const emp = await h.evaluate(() => { const ref = MM.auswahl.holeAuswahl().plaetze[0].material; const x = MM.empfehlung.empfehle(MATERIALMATCH_DATA, ref.id, null, MM.prioritaet.holen()); return x.empfehlungen.map(e => ({ id: e.material.id, krit: e.kriterien.map(k => k.id) })); });
    emp.forEach(e => { if (e.krit.every(k => k === 'kosten' || k === 'kosten_r')) preisNur++; });
  }
  check(`H: ${kombis} zufällige Kombinationen, alle Bereiche geöffnet: keine verbotenen Pauschalaussagen („immer nachhaltiger“, „beste Wahl“, „garantiert“ …), keine englischen Rohtexte (generic/average/specific dataset außerhalb der Klammer hinter der deutschen Bezeichnung, undefined)`, verstossH.filter(x => !/Zulassung|Pflichtsatz|Hilfsmittel/.test(x)).length === 0, verstossH.slice(0, 4));
  check(`H: Alle ${saetze} Sätze der Oberfläche, die Zulassung, Normkonformität oder Gleichwertigkeit erwähnen, sind Verneinungen/Haftungsausschlüsse (keine unbelegte Behauptung)`, verstossH.filter(x => /Zulassung/.test(x)).length === 0 && saetze > 20, verstossH.filter(x => /Zulassung/.test(x)).slice(0, 3));
  check('H: Pflichtsatz zu den Farben und Hinweis „Hilfsmittel für frühe Entwurfsentscheidungen“ in jeder der Kombinationen vorhanden', verstossH.filter(x => /Pflichtsatz|Hilfsmittel/.test(x)).length === 0, verstossH.filter(x => /Pflichtsatz|Hilfsmittel/.test(x)).slice(0, 2));
  check('H: Keine Empfehlung beruht allein auf dem Preis (alle Kombinationen und Prioritäten)', preisNur === 0, preisNur);
  await waehle(h, 'normalbeton', 'brettschichtholz', ''); await h.fill('#flaeche', '100'); await h.fill('#dicke', '20'); await oeffneAlle(h);
  const t2 = await h.evaluate(() => { document.querySelectorAll('[role=tabpanel]').forEach(x => { x.hidden = false; }); return document.body.innerText.replace(/\s+/g, ' '); });
  check('H: Betondecke gegen Holz (Beispielpreise ohne bekannte Mehrwertsteuer): „Kein belastbarer direkter Vergleich möglich“ erscheint, keine Rangfolge nach „Holz ist besser“', /Kein belastbarer direkter Vergleich möglich/.test(t2) && !/Holz ist (immer )?(besser|nachhaltiger)/i.test(t2));

  // ============================ K. Struktur und Barrierefreiheit (Schritt 14, Ergebnis der Prüfung mit axe-core und html-validate) ============================
  const strukt = async (breite) => {
    const k = await neu(breite, 900);
    await waehle(k, 'normalbeton', 'massivholz_nadel', 'kalksandstein'); await k.fill('#flaeche', '100'); await k.fill('#dicke', '20'); await oeffneAlle(k); await k.fill('#rZiel', '5');
    await k.click('#ergebnis-technisch tbody tr:first-child th .info'); await k.click('.label-row:has(label[for="prioritaet"]) .info');
    await k.waitForTimeout(150);
    const r = await k.evaluate(() => {
      const probleme = [];
      const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(h => h.getBoundingClientRect().width > 0).map(h => +h.tagName[1]);
      for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) probleme.push(`Überschriftenebene springt von h${hs[i - 1]} auf h${hs[i]}`);
      if (hs[0] !== 1 || hs.filter(x => x === 1).length !== 1) probleme.push('genau eine h1 am Anfang erwartet');
      if (document.querySelectorAll('main section.panel > details > summary > h2').length !== 3) probleme.push('jeder der drei aufklappbaren Bereiche braucht eine h2 in der Überschriftenzeile');
      if (!document.querySelector('#dashboard > h2') || !document.querySelector('#diagramme > h2') || !document.querySelector('#alternativen > h2') || !document.querySelector('#quellen > h2')) probleme.push('Dashboard, Diagramme, Alternativen und Quellen brauchen je eine h2');
      const ids = [...document.querySelectorAll('[id]')].map(e => e.id); const dupl = ids.filter((x, i) => ids.indexOf(x) !== i); if (dupl.length) probleme.push('doppelte IDs: ' + [...new Set(dupl)]);
      document.querySelectorAll('th').forEach(th => { if (!th.getAttribute('scope')) probleme.push('th ohne scope: ' + th.textContent.trim().slice(0, 20)); });
      const rollenlos = ['SPAN', 'DIV', 'P', 'LI', 'TD', 'TR', 'TABLE', 'SECTION'];
      document.querySelectorAll('[aria-label]').forEach(e => { if (rollenlos.includes(e.tagName) && !e.getAttribute('role')) probleme.push('aria-label ohne Rolle an ' + e.tagName + '.' + e.className); });
      document.querySelectorAll('label').forEach(l => { const kontrollen = new Set([...l.querySelectorAll('button, select, input, textarea')]); if (l.control) kontrollen.add(l.control); const n = kontrollen.size; if (n > 1) probleme.push('Label mit mehreren Bedienelementen: ' + l.textContent.trim().slice(0, 30)); });
      document.querySelectorAll('input, select, textarea').forEach(f => { if (!(f.labels && f.labels.length) && !f.getAttribute('aria-label')) probleme.push('Feld ohne Beschriftung: ' + (f.id || f.tagName)); });
      document.querySelectorAll('button').forEach(b2 => { if (!(b2.getAttribute('aria-label') || b2.textContent.trim())) probleme.push('Knopf ohne Namen'); });
      ['aria-controls', 'aria-describedby', 'aria-labelledby'].forEach(a => document.querySelectorAll('[' + a + ']').forEach(e => e.getAttribute(a).split(/\s+/).forEach(i => { if (!document.getElementById(i)) probleme.push(`${a} verweist auf fehlende ID ${i}`); })));
      document.querySelectorAll('img').forEach(i => { if (!i.hasAttribute('alt')) probleme.push('Bild ohne alt'); });
      if (document.documentElement.lang !== 'de') probleme.push('lang="de" fehlt');
      if (!document.title || document.title.length < 5) probleme.push('Seitentitel fehlt');
      if (!document.querySelector('meta[name="viewport"]')) probleme.push('viewport fehlt');
      document.querySelectorAll('.quickstart li').forEach(li => { const textKnoten = [...li.childNodes].filter(c => c.nodeType === 3 && c.textContent.trim()).length; if (li.children.length !== 1 || textKnoten) probleme.push('Kurzanleitung: Inhalt eines Schritts muss in einem Element stehen (sonst zerfällt er im Flex-Layout)'); });
      const qs = [...document.querySelectorAll('.quickstart li > span')].map(x => x.getBoundingClientRect()); if (qs.length === 3 && Math.abs(qs[1].top - qs[0].top) > 5 && qs.some(x => Math.abs(x.left - qs[0].left) > 1)) probleme.push('Kurzanleitung: Texte beginnen nicht in einer Spalte');
      const wraps = [...document.querySelectorAll('.table-wrap')].filter(w => w.getBoundingClientRect().width > 0);
      const scrollbar = wraps.filter(w => w.scrollWidth > w.clientWidth + 1);
      scrollbar.forEach(w => { if (w.getAttribute('tabindex') !== '0' || !w.getAttribute('aria-label')) probleme.push('scrollbare Tabelle ohne Tastaturzugang'); });
      wraps.filter(w => !(w.scrollWidth > w.clientWidth + 1) && w.getAttribute('role') === 'group').forEach(() => probleme.push('Tabelle ohne Scrollbedarf hat unnötigen Tabstopp'));
      return { probleme, ebenen: hs.length, tabellen: wraps.length, scrollbar: scrollbar.length };
    });
    await k.close();
    return r;
  };
  const kd = await strukt(1280), km = await strukt(375);
  check(`K: Desktop (${kd.ebenen} Überschriften, ${kd.tabellen} Tabellen): Überschriften ohne übersprungene Ebene (eine h1), keine doppelten IDs, alle th mit scope, kein aria-label ohne Rolle, ein Label = ein Bedienelement, alle Felder und Knöpfe benannt, aria-Verweise gültig, lang/Titel/viewport vorhanden`, kd.probleme.length === 0, kd.probleme.slice(0, 4));
  check(`K: Handy 375 px: dieselben Strukturprüfungen; die ${km.scrollbar} seitlich scrollbaren Tabellen sind per Tastatur erreichbar (tabindex 0 + Beschriftung), nicht scrollbare haben keinen unnötigen Tabstopp`, km.probleme.length === 0 && km.scrollbar >= 1, { p: km.probleme.slice(0, 4), scrollbar: km.scrollbar });

  // ============================ I. Geschwindigkeit ============================
  const zeiten = [];
  const ladestart = Date.now(); const sp2 = await neu(1280, 900); const lade = Date.now() - ladestart; await sp2.close();
  const perf = await h.evaluate(() => { const ids = MATERIALMATCH_DATA.baustoffe.map(m => m.id); const t = []; for (let i = 0; i < 40; i++) { const t0 = performance.now(); MM.auswahl.setzeAuswahl({ a: ids[i % 50], b: ids[(i * 7 + 3) % 50] === ids[i % 50] ? '' : ids[(i * 7 + 3) % 50], c: ids[(i * 11 + 5) % 50] === ids[i % 50] || ids[(i * 11 + 5) % 50] === ids[(i * 7 + 3) % 50] ? '' : ids[(i * 11 + 5) % 50] }); t.push(performance.now() - t0); } return { max: Math.max(...t), mittel: t.reduce((a, c) => a + c, 0) / t.length }; });
  check(`I: Seite lädt in ${lade} ms (Ziel < 3 s); eine Materialauswahl mit allen Berechnungen, Tabellen, Diagrammen und Empfehlungen dauert im Mittel ${perf.mittel.toFixed(0)} ms, höchstens ${perf.max.toFixed(0)} ms (Ziel < 500 ms)`, lade < 3000 && perf.max < 500, [lade, perf]);

  check('Gesamtlauf: keine Konsolenfehler oder -warnungen (außer den im Affentest bereits geprüften)', errors.length === 0, errors.slice(0, 3));
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
  await b.close();
  process.exit(fails === 0 ? 0 : 1);
})();
