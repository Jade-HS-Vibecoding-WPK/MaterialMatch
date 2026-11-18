/* Runde 6, Datenpaket 1 (17.11.2026): herstellerspezifische ÖKOBAUDAT-Datensätze (12 Datensätze = 12 neue Produkte)
   Die Erwartungswerte werden unabhängig aus dem ÖKOBAUDAT-Auszug (data/quellen/*.csv) gelesen und nachgerechnet, nicht aus data/produkte.js.
   Aufruf:  node tests/test42.js */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');
const fs = require('fs');
const vm = require('vm');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 500))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html';
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(PROJ, 'data', 'baustoffe.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(PROJ, 'data', 'produkte.js'), 'utf8'), ctx);
const DB = ctx.window.MATERIALMATCH_DATA, PR = ctx.window.MATERIALMATCH_PRODUKTE;
const nah = (a, b, t = 1e-6) => typeof a === 'number' && Math.abs(a - b) <= t * Math.max(1, Math.abs(b));

// ---- ÖKOBAUDAT-Auszug lesen (eigener kleiner CSV-Leser)
function parseCsv(t) { const z = []; let r = [], f = '', q = false; for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; } else if (c === '"') q = true; else if (c === ';') { r.push(f); f = ''; } else if (c === '\n') { r.push(f); z.push(r); r = []; f = ''; } else if (c !== '\r') f += c; } if (f !== '' || r.length) { r.push(f); z.push(r); } return z; }
const tab = parseCsv(fs.readFileSync(path.join(PROJ, 'data', 'quellen', 'oekobaudat_2024-II_auszug.csv'), 'utf8'));
const kopf = tab[0]; const S = n => kopf.indexOf(n);
const csvZeile = uuid => tab.slice(1).find(r => r[S('UUID')] === uuid && r[S('Modul')] === 'A1-A3');
const N = (r, n) => { const x = r[S(n)]; return x === '' || x === undefined ? null : Number(x); };

// ---- die zwölf Datensätze: Produkt, Material, Erwartung
const PAKET = [
  ['ytong-epd-2-5-040', 'porenbeton', '880239e9-ed96-404f-9184-bd4e004fd650', true],
  ['egger-osb-epd', 'osb', '766ea5bd-3f0f-4d48-a399-9c4a372524d8', true],
  ['kronospan-osb', 'osb', '22527f3b-5985-41a7-8028-655142979cfd', true],
  ['hasslacher-bsp', 'brettsperrholz', '7688e355-8e03-4f2f-94dc-741052b78a02', true],
  ['hasslacher-bsh', 'brettschichtholz', 'e8cf2935-ef5c-40db-a819-953a9ef12df8', true],
  ['hasslacher-kvh-glt', 'konstruktionsvollholz', '792a0e85-3893-4aa3-8613-4898b9838fae', true],
  ['gutex-pyroresist', 'holzfaserdaemmung', 'a612d5a0-8d13-48eb-86dc-76ceba4c3dab', true],
  ['jackodur-evo', 'xps', 'cddad814-59d9-4e84-9fa9-8b93b17cda9b', true],
  ['sagex-eps', 'eps', '29396128-5d81-454b-8e78-64e30345257b', true],
  ['knauf-fireboard', 'gipskarton', '69430bba-1899-4afa-a0ea-c177c6caae20', true],
  ['knauf-silentboard-gkf', 'gipskarton', 'ba2a4652-6c91-4759-894f-f5b1ad0a14da', true],
  ['knauf-fe50-largo', 'calciumsulfatestrich', '899c73e4-109b-4c40-96e7-7a8f42aad4a5', true]
];

(async () => {
  // ================= 1. Datenbestand =================
  const ids = PR.map(p => p.id);
  check('Produktbestand: mindestens die 33 Produkte bis Datenpaket 1 (21 + 12 neue; Datenpaket 2 ergänzt weitere, siehe test43), Produkt-IDs eindeutig, keine zwei Produkte mit gleichem Namen, jedes gehört zu einem vorhandenen Material', PR.length >= 33 && new Set(ids).size === PR.length && new Set(PR.map(p => p.name)).size === PR.length && PR.every(p => DB.baustoffe.some(m => m.id === p.material)), PR.length);
  const std = {}; PR.filter(p => p.standard).forEach(p => { std[p.material] = (std[p.material] || 0) + 1; });
  check('Höchstens ein Standardprodukt je Material; kein neues Produkt ist Standard (die Startwerte der Materialien bleiben unverändert)', Object.values(std).every(n => n === 1) && PAKET.filter(x => x[3]).every(x => !PR.find(p => p.id === x[0]).standard), std);
  check('Quellenbestand: mindestens 92 Quellen, Quellen-IDs und ÖKOBAUDAT-UUIDs eindeutig, keine doppelte Adresse unter den ÖKOBAUDAT-Quellen', DB.quellen.length >= 92 && new Set(DB.quellen.map(q => q.id)).size === DB.quellen.length && (() => { const o = DB.quellen.filter(q => /^oebd-/.test(q.id)); return new Set(o.map(q => q.uuid)).size === o.length && new Set(o.map(q => q.url)).size === o.length; })());
  let alleOk = true; const detail = [];
  for (const [pid, mat, uuid, neu] of PAKET) {
    const p = PR.find(x => x.id === pid); const z = csvZeile(uuid);
    const q = DB.quellen.find(x => x.uuid === uuid);
    const probleme = [];
    if (!p) probleme.push('Produkt fehlt'); if (!z) probleme.push('Zeile im Auszug fehlt'); if (!q) probleme.push('Quelle fehlt');
    if (p && z && q) {
      if (p.material !== mat) probleme.push('Material');
      if (q.titel !== z[S('Name (de)')] || q.url !== z[S('URL')] || q.version !== z[S('Version')] || q.typ !== z[S('Typ')] || q.datensatz_eigner !== z[S('Declaration owner')]) probleme.push('Quelle weicht von CSV ab');
      if (!/^https:\/\/www\.oekobaudat\.de\//.test(q.url) || q.geprueft !== true || q.abgerufen !== '2026-11-17' || !q.quellenart || !q.region || q.geltung !== 'produktspezifisch') probleme.push('Quellenangaben unvollständig');
      const g = p.eigenschaften.gwp, r = p.eigenschaften.rohdichte;
      const be = z[S('Bezugseinheit')], dek = { m3: '1 m³', qm: '1 m²', kg: '1 kg' }[be];
      if (!g || g.quelle !== q.id || g.deklarierte_einheit !== dek || g.module !== 'A1-A3' || g.art !== 'richtwert') probleme.push('GWP-Angaben');
      else {
        if (!nah(g.werte.gesamt, N(z, 'GWPtotal (A2)')) || !nah(g.werte.fossil, N(z, 'GWPfossil (A2)')) || !nah(g.werte.biogen, N(z, 'GWPbiogenic (A2)'))) probleme.push('GWP-Zahlen');
        if (be === 'qm' && !nah(g.bezugsdicke_m, N(z, 'Schichtdicke (m)'))) probleme.push('Bezugsdicke');
        const pert = N(z, 'PERT'), penrt = N(z, 'PENRT'); const f1 = x => x.toFixed(1).replace('.', ',');
        if (!(g.hinweis.includes('(PERT) ' + f1(pert) + ' MJ') && g.hinweis.includes('(PENRT) ' + f1(penrt) + ' MJ'))) probleme.push('Primärenergie im Hinweis');
      }
      const rd = N(z, 'Rohdichte (kg/m3)'); const sollRho = rd !== null ? rd : N(z, 'Flaechengewicht (kg/m2)') / N(z, 'Schichtdicke (m)');
      if (!r || r.quelle !== q.id || !nah(r.wert, sollRho) || r.einheit !== 'kg/m³' || r.art !== 'richtwert') probleme.push('Rohdichte');
      if (rd === null && !/berechnet/.test(r.hinweis)) probleme.push('berechnete Rohdichte nicht gekennzeichnet');
      if (neu && (p.eigenschaften.preis || Object.keys(p.eigenschaften).sort().join() !== 'gwp,rohdichte')) probleme.push('neue Produkte haben nur Rohdichte und GWP, keinen Preis');
    }
    if (probleme.length) { alleOk = false; detail.push([pid, probleme]); }
  }
  check('Alle 12 Datensätze: Produktwerte stimmen mit dem ÖKOBAUDAT-Auszug überein (GWP gesamt/fossil/biogen, Rohdichte, Einheit, Modul A1–A3, Primärenergie im Hinweis), Quelle (Titel, Adresse, Version, Typ, Eigner) stimmt mit der CSV überein, Quellenangaben vollständig', alleOk, detail);
  check('Rohdichte der beiden Gipsplatten ist als „von uns berechnet“ gekennzeichnet (Flächengewicht ÷ Schichtdicke: 16,4 ÷ 0,02 = 820; 17,5 ÷ 0,0125 = 1.400 kg/m³)', PR.find(p => p.id === 'knauf-fireboard').eigenschaften.rohdichte.wert === 820 && nah(PR.find(p => p.id === 'knauf-silentboard-gkf').eigenschaften.rohdichte.wert, 1400));
  check('Die Startwerte bleiben unverändert: Die Standardprodukte Ytong PP 2-0,40 und EGGER OSB 3 TOP haben weiterhin keinen CO₂-Wert (die Materialien starten mit dem generischen Datensatz und sind direkt mit anderen generischen Materialien vergleichbar); der Xella-Datensatz („2.5/0.40“) steht als eigenes Produkt, weil seine Zuordnung zum Planblock „PP 2-0,40“ im Datensatz nicht ausgewiesen ist', (() => { const y = PR.find(p => p.id === 'ytong-pp2-040'), e = PR.find(p => p.id === 'egger-osb3-top'); const x = PR.find(p => p.id === 'ytong-epd-2-5-040'); return !y.eigenschaften.gwp && !y.eigenschaften.rohdichte && y.standard === true && !e.eigenschaften.gwp && e.eigenschaften.rohdichte.wert === 600 && e.standard === true && x.eigenschaften.rohdichte.wert === 383 && /nicht ausgewiesen|nicht im Datensatz|ist im Datensatz nicht ausgewiesen/.test(x.beschreibung); })());
  check('Nicht übernommen und begründet (keine Erfindung): Austrotherm UNIPLATTE (Flächengewicht 3,18 kg/m² passt nicht zu Rohdichte 28 × 0,02 m), RHEINZINK und SAGLAN (stehen schon als generische Datensätze im Material), Zement-Datensätze (Holcim, CEMEX, Heidelberg: kein Zement-Material)', !PR.some(p => /UNIPLATTE/i.test(p.name)) && !DB.quellen.some(q => q.uuid === 'a118aeff-f158-495c-b9c6-117ba27ac230') && DB.baustoffe.find(m => m.id === 'zinkblech').eigenschaften.gwp.quelle === 'oebd-e3086b26' && DB.baustoffe.find(m => m.id === 'glaswolle').eigenschaften.gwp.quelle === 'oebd-ceaaae5b');

  // ================= 2. Oberfläche =================
  const b = await chromium.launch();
  const errors = [];
  const neu = async modus => { const c = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }); const p = await c.newPage(); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); await p.goto(URL + '?modus=' + modus); await p.waitForTimeout(250); return p; };
  const dash = (p, t) => p.$$eval('#dashboard .kennwert', (k, t) => { const x = k.find(e => e.querySelector('h3').textContent.trim().startsWith(t)); return x ? [...x.querySelectorAll('.kw-zeile')].map(z => z.textContent.replace(/\s+/g, ' ').trim()) : null; }, t);

  for (const modus of ['echt', 'demo']) {
    const p = await neu(modus);
    const probleme = [];
    for (const [pid, mat, uuid] of PAKET) {
      const pr = PR.find(x => x.id === pid); const z = csvZeile(uuid);
      const kat = DB.baustoffe.find(m => m.id === mat).kategorien[0];
      await p.selectOption('#kategorie', kat); await p.selectOption('#materialA', mat);
      if (await p.$eval('#produktA', e => e.getBoundingClientRect().width === 0)) await p.click('#btn-produkt');
      await p.selectOption('#produktA', pid);
      const be = z[S('Bezugseinheit')];
      const dicke = be === 'qm' ? N(z, 'Schichtdicke (m)') : 0.2;
      await p.fill('#flaeche', '100'); await p.selectOption('#dickeEinheit', 'mm'); await p.fill('#dicke', String(+(dicke * 1000).toFixed(3)).replace('.', ','));
      await p.evaluate(() => MM.diagramme.zeigeWeitere(true));
      const rho = N(z, 'Rohdichte (kg/m3)') !== null ? N(z, 'Rohdichte (kg/m3)') : N(z, 'Flaechengewicht (kg/m2)') / N(z, 'Schichtdicke (m)');
      const mengeFaktor = { m3: 100 * dicke, kg: 100 * dicke * rho, qm: 100 }[be];
      const sollGes = mengeFaktor * N(z, 'GWPtotal (A2)'), sollFos = mengeFaktor * N(z, 'GWPfossil (A2)');
      const rows = sel => p.$$eval(`figure.chart[data-chart="${sel}"] .chart-row[data-material]`, r => r.map(x => parseFloat(x.dataset.wert)));
      const ges = await rows('co2-gesamt'), fos = await rows('co2-fossil');
      if (!(ges.length === 1 && nah(ges[0], sollGes, 1e-6))) probleme.push([modus, pid, 'CO₂ gesamt', ges, sollGes]);
      if (!(fos.length === 1 && nah(fos[0], sollFos, 1e-6))) probleme.push([modus, pid, 'CO₂ fossil', fos, sollFos]);
      // Rohdichte und Gewicht in der Tabelle
      await p.evaluate(() => { document.querySelector('#ergebnisse > details').open = true; document.querySelectorAll('#ergebnisse details.sub').forEach(d => d.open = true); });
      const gew = await p.evaluate(() => { const r = [...document.querySelectorAll('#ergebnis-menge table tr')].find(x => x.cells[0].textContent.trim().startsWith('Gesamtgewicht')); return r ? r.cells[1].textContent.replace(/\s+/g, ' ').trim() : null; });
      const sollGew = 100 * dicke * rho; const gz = gew ? parseFloat(gew.replace(/\./g, '').replace(',', '.')) : NaN;
      if (!nah(gz, sollGew, 0.002)) probleme.push([modus, pid, 'Gewicht', gew, sollGew]);
      const marke = await p.$$eval('#ergebnis-menge td .art-richtwert, #ergebnis-co2 td .art-richtwert', m => m.length);
      if (marke < 1) probleme.push([modus, pid, 'R-Kennzeichen', marke]);
      // Quelle erscheint im Reiter „Quellen & Details“
      await p.click('#reiter-quellen');
      const qt = await p.$eval('#quellen-auswahl', e => e.innerText);
      const links = await p.$$eval('#quellen-auswahl a', a => a.map(x => x.href));
      const eigner = DB.quellen.find(x => x.uuid === uuid).datensatz_eigner; if (!links.some(l => l.includes(uuid)) || !qt.includes(eigner)) probleme.push([modus, pid, 'Quellenanzeige', links.slice(0, 3), eigner]);
      await p.click('#reiter-vergleich');
    }
    check(`Oberfläche (${modus === 'echt' ? 'Echtdaten' : 'Demo'}): alle 12 Produkte lassen sich wählen; CO₂ gesamt und fossil (Diagramm), Gewicht (Tabelle) stimmen mit der Handrechnung aus dem Auszug überein (je nach Bezugsgröße je m³, je kg × Rohdichte oder je m² bei der Datensatz-Dicke); R-Kennzeichen und Quelle mit ÖKOBAUDAT-Link erscheinen`, probleme.length === 0, probleme.slice(0, 3));
    await p.context().close();
  }

  // ---- m²-Datensätze nur bei passender Dicke (keine Annahme)
  const p2 = await neu('echt');
  await p2.selectOption('#kategorie', 'innenausbau'); await p2.selectOption('#materialA', 'gipskarton'); if (await p2.$eval('#produktA', e => e.getBoundingClientRect().width === 0)) await p2.click('#btn-produkt'); await p2.selectOption('#produktA', 'knauf-silentboard-gkf');
  await p2.fill('#flaeche', '100'); await p2.selectOption('#dickeEinheit', 'mm'); await p2.fill('#dicke', '20');
  const falsch = await p2.$eval('#dashboard', e => e.innerText.replace(/\s+/g, ' '));
  await p2.evaluate(() => { document.querySelector('#ergebnisse > details').open = true; document.querySelectorAll('#ergebnisse details.sub').forEach(d => d.open = true); });
  const grund = await p2.$eval('#rechnung-co2', e => e.innerText.replace(/\s+/g, ' '));
  check('Knauf Silentboard (gilt je m² für 12,5 mm): bei 20 mm Dicke wird kein CO₂-Wert erfunden; die Seite nennt den Grund („Dicke von 12,5 mm … Umrechnung wäre eine Annahme“)', /12,5 mm/.test(grund) && /Annahme/.test(grund), grund.slice(0, 300));
  await p2.fill('#dicke', '12,5');
  const richtig = (await dash(p2, 'CO₂'));
  check('Bei 12,5 mm erscheint der CO₂-Wert (Kennwertübersicht zeigt fossil: 100 m² × 2,356 = 235,6 kg)', richtig && /236/.test(richtig.join(' ')), richtig);
  await p2.context().close();

  // ---- Alternativen und Vergleich mit den neuen Produkten
  const p3 = await neu('echt');
  const kontrolle = [];
  for (const [mat, pid] of [['osb', 'kronospan-osb'], ['brettsperrholz', 'hasslacher-bsp'], ['xps', 'jackodur-evo'], ['eps', 'sagex-eps'], ['holzfaserdaemmung', 'gutex-pyroresist'], ['konstruktionsvollholz', 'hasslacher-kvh-glt']]) {
    const kat = DB.baustoffe.find(m => m.id === mat).kategorien[0];
    await p3.selectOption('#kategorie', kat); await p3.selectOption('#materialA', mat); if (await p3.$eval('#produktA', e => e.getBoundingClientRect().width === 0)) await p3.click('#btn-produkt'); await p3.selectOption('#produktA', pid);
    await p3.fill('#flaeche', '100'); await p3.selectOption('#dickeEinheit', 'cm'); await p3.fill('#dicke', '20');
    await p3.click('#reiter-alternativen');
    const t = await p3.$eval('#alternativen-inhalt', e => e.innerText.replace(/\s+/g, ' '));
    kontrolle.push([mat, pid, await p3.$$eval('#alternativen-inhalt .rec-card', c => c.length), /Ausgangsmaterial/.test(t)]);
    await p3.click('#reiter-vergleich');
  }
  check('Alternativen: Mit jedem der sechs getesteten neuen Produkte als Material A zeigt der Reiter „Alternativen“ den Ausgangspunkt und seine Empfehlungskarten bzw. die Erklärung, ohne Fehler', kontrolle.every(k => k[3]), kontrolle);
  await p3.selectOption('#kategorie', 'daemmstoff'); await p3.selectOption('#materialA', 'xps'); await p3.selectOption('#materialB', 'eps');
  if (await p3.$eval('#produktA', e => e.getBoundingClientRect().width === 0)) await p3.click('#btn-produkt'); await p3.selectOption('#produktA', 'jackodur-evo'); await p3.selectOption('#produktB', 'sagex-eps');
  await p3.fill('#flaeche', '100'); await p3.fill('#dicke', '20');
  const vgl = await p3.$$eval('figure.chart[data-chart="co2-fossil"] .chart-row[data-material]', r => r.map(x => [x.dataset.material, Math.round(parseFloat(x.dataset.wert)), x.dataset.farbe]));
  check('Vergleich zweier neuer Produkte (JACKODUR EVO gegen SAGEX, je 100 m² × 20 cm): CO₂ fossil 20 m³ × 103,3 = 2.066 kg gegen 20 m³ × 74,9 = 1.499 kg; das niedrigere ist grün, das höhere rot', vgl.length === 2 && vgl[0][1] === 2066 && vgl[1][1] === 1499 && vgl[0][2].toLowerCase() === '#951f2b' && vgl[1][2].toLowerCase() === '#17643a', vgl);
  // CSV-Export enthält das Produkt
  await p3.click('#export-menue-knopf');
  const [dl] = await Promise.all([p3.waitForEvent('download'), p3.click('#csv-knopf')]);
  const pf = path.join(require('os').tmpdir(), 'mm42.csv'); await dl.saveAs(pf); const csv = fs.readFileSync(pf, 'utf8');
  check('CSV-Export nennt die neuen Produkte mit Hersteller und die ÖKOBAUDAT-Quelle', /JACKODUR EVO/.test(csv) && /SAGEX/.test(csv) && /JACKON Insulation GmbH/.test(csv) && /ÖKOBAUDAT/.test(csv));
  check('Keine Konsolenfehler oder -warnungen im gesamten Lauf', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
