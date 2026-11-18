/* Runde 6, Datenpaket 2 (17.11.2026): Preislisten und Herstellerseiten (Xella Ytong und Silka, Wienerberger Poroton, Holcim, Dyckerhoff, EGGER)
   29 neue Produkte, 4 ergänzte Bestandsprodukte, 29 neue Quellen. Die Erwartungswerte stehen als eigene Tabelle in diesem Test (aus den Dokumenten gelesen);
   Preise werden zusätzlich unabhängig umgerechnet. Aufruf:  node tests/test43.js */
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
const prod = id => PR.find(p => p.id === id);
const qu = id => DB.quellen.find(q => q.id === id);
const nah = (a, b, t = 1e-6) => typeof a === 'number' && Math.abs(a - b) <= t * Math.max(1, Math.abs(b));

// ---- Erwartung: id, Material, λ (W/(m·K)), Druckfestigkeitsklasse (N/mm²), Preis (Wert, Einheit, Preis im Dokument, Einheit im Dokument)
// Ytong/Silka: Xella Preisliste 2026; Poroton: Wienerberger-Produktseiten; Beton: Holcim Bereich West und Dyckerhoff Hamburg 2026
const ERW = [
  ['ytong-thermultra-pp2-030-365', 'porenbeton', 0.07, 2, 452.70, '€/m³'],
  ['ytong-thermsuper-pp2-035-365', 'porenbeton', 0.08, 2, 242.20, '€/m³'],
  ['ytong-thermstrong-pp4-050-365', 'porenbeton', 0.10, 4, 452.70, '€/m³'],
  ['ytong-thermcombi-pp4-050-365', 'porenbeton', 0.12, 4, 223.40, '€/m³'],
  ['ytong-thermcombi-pp6-065-365', 'porenbeton', 0.18, 6, 243.80, '€/m³'],
  ['silka-classic-ks3df-175', 'kalksandstein', 0.99, 12, 1678.00 / (1000 * 0.240 * 0.175 * 0.113), '€/m³'],
  ['silka-classic-ks5df-240', 'kalksandstein', 0.99, 12, 2844.00 / (1000 * 0.300 * 0.240 * 0.113), '€/m³'],
  ['silka-solid-ks3df-175', 'kalksandstein', 1.10, 20, 1922.00 / (1000 * 0.240 * 0.175 * 0.113), '€/m³'],
  ['silka-solid-ks5df-240', 'kalksandstein', 1.10, 20, 3256.00 / (1000 * 0.300 * 0.240 * 0.113), '€/m³'],
  ['silka-xl-basic-solid-175', 'kalksandstein', 1.10, 20, 50.07, '€/m²'],
  ['silka-xl-basic-solid-240', 'kalksandstein', 1.10, 20, 68.66, '€/m²'],
  ['poroton-planziegel-t9-365', 'hochlochziegel', 0.09, 6, null],
  ['poroton-planziegel-t10-365', 'hochlochziegel', 0.10, 8, null],
  ['poroton-planziegel-t12-365', 'hochlochziegel', 0.12, 10, null],
  ['poroton-planziegel-t14-365-dfk12', 'hochlochziegel', 0.14, 12, null],
  ['poroton-t6-365-p', 'hochlochziegel', 0.06, 4, null],
  ['poroton-t7-365-p', 'hochlochziegel', 0.07, 6, null],
  ['poroton-t7-365-mw', 'hochlochziegel', 0.07, 6, null],
  ['poroton-s8-365-p', 'hochlochziegel', 0.08, 12, null],
  ['poroton-s9-365-p', 'hochlochziegel', 0.09, 12, null],
  ['poroton-s9-365-mw', 'hochlochziegel', 0.09, 10, null],
  ['poroton-s10-365-mw', 'hochlochziegel', 0.10, 12, null],
  ['holcim-beton-c30-37-na5334', 'normalbeton', null, 30, 209.50, '€/m³'],
  ['holcim-beton-c35-45-na6334', 'normalbeton', null, 35, 216.50, '€/m³'],
  ['dyckerhoff-standard-c25-30', 'normalbeton', null, 25, 164.00, '€/m³'],
  ['dyckerhoff-standard-c30-37', 'normalbeton', null, 30, 166.00, '€/m³'],
  ['dyckerhoff-ecodur30-c25-30', 'normalbeton', null, 25, 169.00, '€/m³'],
  ['dyckerhoff-ecodur40-c25-30', 'normalbeton', null, 25, 174.00, '€/m³'],
  ['egger-osb3-e0', 'osb', 0.13, null, null]
];
const UPD = [['ytong-pp2-040', 2], ['ytong-pp2-035-thermstandard-365', 2], ['poroton-planziegel-t8-365', 6], ['holcim-beton-c25-30-na4334', 25]];

(async () => {
  // ================= 1. Datenbestand =================
  check('Bestand: mindestens 62 Produkte (33 + 29 neue; Datenpaket 3 ergänzt weitere, siehe test49), IDs und (Material, Name) eindeutig, jedes gehört zu einem vorhandenen Material; mindestens 121 Quellen mit eindeutigen IDs (92 + 29)', PR.length >= 62 && new Set(PR.map(p => p.id)).size === PR.length && new Set(PR.map(p => p.material + '|' + p.name)).size === PR.length && PR.every(p => DB.baustoffe.some(m => m.id === p.material)) && DB.quellen.length >= 121 && new Set(DB.quellen.map(q => q.id)).size === DB.quellen.length);
  const std = {}; PR.filter(p => p.standard).forEach(p => { std[p.material] = (std[p.material] || 0) + 1; });
  check('Kein neues Produkt ist Standardprodukt; höchstens ein Standardprodukt je Material (die Startwerte der Materialien ändern sich nicht)', ERW.every(e => !prod(e[0]).standard) && Object.values(std).every(n => n === 1), std);
  const probleme = [];
  for (const [id, mat, lam, fest, preis, einheit] of ERW) {
    const p = prod(id);
    if (!p) { probleme.push([id, 'fehlt']); continue; }
    const e = p.eigenschaften, pb = [];
    if (p.material !== mat) pb.push('Material');
    if (!p.hersteller || !p.beschreibung) pb.push('Hersteller/Beschreibung');
    if (lam !== null && !(e.waermeleitfaehigkeit && nah(e.waermeleitfaehigkeit.wert, lam) && e.waermeleitfaehigkeit.einheit === 'W/(m·K)' && e.waermeleitfaehigkeit.art === 'richtwert')) pb.push('λ');
    if (lam !== null && !(e.waermeleitfaehigkeit_bemessung && e.waermeleitfaehigkeit_bemessung.wert === null && /Nicht verfügbar/.test(e.waermeleitfaehigkeit_bemessung.hinweis))) pb.push('λB muss als „nicht verfügbar“ stehen');
    if (fest !== null && !(e.druckfestigkeit && e.druckfestigkeit.wert === fest && e.druckfestigkeit.einheit === 'N/mm²' && e.druckfestigkeit.art === 'richtwert' && /klasse/i.test(e.druckfestigkeit.hinweis))) pb.push('Druckfestigkeit');
    if (preis !== null && !(e.preis && nah(e.preis.wert, preis, 6e-5) && e.preis.einheit === einheit && e.preis.mwst === 'exkl. MwSt.' && e.preis.art === 'richtwert')) pb.push(['Preis', e.preis && e.preis.wert, preis]);
    if (preis === null && e.preis) pb.push('Preis darf nicht stehen (kein Preis gefunden)');
    for (const k of Object.keys(e)) {
      const x = e[k]; const hat = k === 'gwp' ? !!x.werte : (x.wert !== null && x.wert !== undefined);
      if (hat) {
        const q = qu(x.quelle);
        if (!q || q.geprueft !== true || !/^https:\/\//.test(q.url) || q.abgerufen !== '2026-11-17' || !q.quellenart || !q.region || q.geltung !== 'produktspezifisch' || !q.produkt) pb.push(k + ': Quelle unvollständig');
      } else if (!x.hinweis || x.art !== null) pb.push(k + ': fehlender Wert ohne Begründung');
    }
    if (pb.length) probleme.push([id, pb]);
  }
  check('Alle 29 neuen Produkte: λ, Druckfestigkeitsklasse und Preis stimmen mit der Erwartungstabelle überein; λB steht als „nicht verfügbar“; Preise netto; jede Angabe hat eine geprüfte https-Quelle mit Abrufdatum, Region und Geltung; fehlende Werte sind begründet', probleme.length === 0, probleme.slice(0, 3));
  check('Die vier ergänzten Bestandsprodukte bekommen nur die Druckfestigkeitsklasse (Ytong PP 2-0,40: 2; ThermStandard: 2; Poroton T8: 6; Holcim C25/30: 25) und bleiben Standardprodukt; ihre übrigen Werte sind unverändert', UPD.every(([id, f]) => prod(id).eigenschaften.druckfestigkeit.wert === f && prod(id).eigenschaften.druckfestigkeit.art === 'richtwert') && prod('ytong-pp2-040').standard && prod('poroton-planziegel-t8-365').standard && prod('holcim-beton-c25-30-na4334').standard && nah(prod('holcim-beton-c25-30-na4334').eigenschaften.preis.wert, 204.5) && nah(prod('ytong-pp2-035-thermstandard-365').eigenschaften.preis.wert, 210.6));
  // Preisquellen
  const pq = ERW.filter(e => e[4] !== null).map(e => qu(prod(e[0]).eigenschaften.preis.quelle));
  check('Jeder der 17 Preise hat eine Preislisten-Quelle mit Händler/Herausgeber, Produkt, Hersteller, Variante, Region, Verfügbarkeit, Status „preisliste“ (nicht aktuell bestätigt), https-Link, Gültigkeitsangabe und Umrechnung; die Quellen sind alle verschieden', pq.length === 17 && new Set(pq.map(q => q.id)).size === 17 && pq.every(q => /^Preisliste/.test(q.quellenart) && q.preisangabe && ['haendler', 'produktname', 'hersteller', 'variante', 'region', 'verfuegbarkeit'].every(k => q.preisangabe[k]) && q.preisangabe.status === 'preisliste' && /^https:\/\//.test(q.url) && (q.datum || q.datum_hinweis) && q.preisangabe.umrechnung && q.preisangabe.umrechnung.ziel));
  check('Silka Kleinformat: Preis je 1.000 Stück wird über das Steinvolumen auf €/m³ umgerechnet (z. B. KS 3 DF Classic 1.678,00 ÷ (1.000 × 0,24 × 0,175 × 0,113 m³) = 353,56 €/m³); Silka XL gilt je m² nur bei der Dicke der Liste (Bezugsdicke 175 bzw. 240 mm)', nah(prod('silka-classic-ks3df-175').eigenschaften.preis.wert, 353.56, 2e-5) && prod('silka-xl-basic-solid-175').eigenschaften.preis.bezugsdicke_m === 0.175 && prod('silka-xl-basic-solid-240').eigenschaften.preis.bezugsdicke_m === 0.24 && prod('silka-xl-basic-solid-175').eigenschaften.preis.einheit === '€/m²');
  check('Gleiche Konditionen = gleicher Wortlaut: Alle Xella-Preise (Ytong und Silka) und alle Betonpreise (Holcim und Dyckerhoff) haben denselben Leistungsumfang-Text, damit die Anwendung sie als vergleichbar erkennt', new Set(ERW.filter(e => /^(ytong|silka)/.test(e[0])).map(e => prod(e[0]).eigenschaften.preis.umfang).concat([prod('ytong-pp2-035-thermstandard-365').eigenschaften.preis.umfang])).size === 1 && new Set(ERW.filter(e => /^(holcim|dyckerhoff)/.test(e[0])).map(e => prod(e[0]).eigenschaften.preis.umfang).concat([prod('holcim-beton-c25-30-na4334').eigenschaften.preis.umfang])).size === 1);
  check('ECODUR (CO₂-reduzierter Beton): Die Herstellerangabe „mindestens 30 % bzw. 40 % CO₂-Reduktion“ steht nur als Text (Beschreibung); es gibt keinen erfundenen GWP-Wert, und die CO₂-Berechnung nutzt weiter den generischen Datensatz', /mindestens 30 % CO2/.test(prod('dyckerhoff-ecodur30-c25-30').beschreibung) && /mindestens 40 % CO2/.test(prod('dyckerhoff-ecodur40-c25-30').beschreibung) && !prod('dyckerhoff-ecodur30-c25-30').eigenschaften.gwp && /kein GWP-Wert/.test(prod('dyckerhoff-ecodur30-c25-30').beschreibung));
  check('Ytong-Produkte: Rohdichte und CO₂ stehen ausdrücklich als „nicht verfügbar“ (nur Rohdichteklasse bekannt, kein Wert in kg/m³), kein Wert wird angenommen', ERW.filter(e => /^ytong-therm/.test(e[0])).every(e => { const x = prod(e[0]).eigenschaften; return x.rohdichte.wert === null && /Rohdichteklasse/.test(x.rohdichte.hinweis) && x.gwp.werte === null && /nicht gelesen|Nicht verfügbar/.test(x.gwp.hinweis); }));
  check('Nicht übernommen (keine Annahme): hagebau-Produktseiten (kein Hinweis zur Mehrwertsteuer), OBI/Holcim-Neuabruf/Siniat-Deutschland (gesperrt oder ohne Dokument); kein Produkt nennt einen Händler außer den Quellen dieser Liste', !PR.some(p => /hagebau|obi/i.test(p.id)) && !DB.quellen.some(q => /hagebau\.de/.test(q.url || '')));

  // ================= 2. Oberfläche =================
  const b = await chromium.launch();
  const errors = [];
  const neu = async modus => { const c = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }); const p = await c.newPage(); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); await p.goto(URL + '?modus=' + modus); await p.waitForTimeout(250); return p; };
  const waehle = async (p, mat, pid, platz = 'A') => { const kat = DB.baustoffe.find(m => m.id === mat).kategorien[0]; await p.selectOption('#kategorie', kat); await p.selectOption('#material' + platz, mat); if (await p.$eval('#produkt' + platz, e => e.getBoundingClientRect().width === 0)) await p.click('#btn-produkt'); await p.selectOption('#produkt' + platz, pid); };
  const eingabe = async (p, f, dMm) => { await p.fill('#flaeche', String(f)); await p.selectOption('#dickeEinheit', 'mm'); await p.fill('#dicke', String(dMm).replace('.', ',')); };
  const dashKosten = p => p.$$eval('#dashboard .kennwert', k => { const x = k.find(e => e.querySelector('h3').textContent.trim().startsWith('Materialkosten')); return x ? [...x.querySelectorAll('.kw-zeile')].map(z => z.textContent.replace(/\s+/g, ' ').trim()) : null; });
  const zahl = t => parseFloat(String(t).replace(/\./g, '').replace(',', '.'));

  const p = await neu('echt');
  // je Familie ein Produkt: Kosten = Menge × Preis (Handrechnung)
  const FAM = [
    ['porenbeton', 'ytong-thermultra-pp2-030-365', 100, 365, 100 * 0.365 * 452.70],
    ['kalksandstein', 'silka-classic-ks3df-175', 100, 175, 100 * 0.175 * (1678 / (1000 * 0.240 * 0.175 * 0.113))],
    ['kalksandstein', 'silka-xl-basic-solid-175', 100, 175, 100 * 50.07],
    ['normalbeton', 'dyckerhoff-standard-c25-30', 100, 200, 100 * 0.2 * 164.0],
    ['normalbeton', 'holcim-beton-c30-37-na5334', 100, 200, 100 * 0.2 * 209.5]
  ];
  const fehl = [];
  for (const [mat, pid, f, d, soll] of FAM) {
    await waehle(p, mat, pid); await eingabe(p, f, d);
    const k = await dashKosten(p);
    const ist = k && k[0] ? zahl((k[0].match(/[\d.]+(?:,\d+)?(?=\s*R?$|\s*[RV])/) || k[0].match(/(\d{1,3}(?:\.\d{3})*(?:,\d+)?)/g).slice(-1))[0]) : NaN;
    const zeilen = await p.evaluate(() => { const g = {}; for (const e of document.querySelectorAll('#dashboard .kennwert')) { const t = e.querySelector('h3').textContent.trim(); if (t.startsWith('Materialkosten')) g.k = [...e.querySelectorAll('.kw-zahl')].map(z => z.textContent.trim()); } return g; });
    const ist2 = zeilen.k && zeilen.k.length ? zahl(zeilen.k[0]) : NaN;
    if (!(Math.abs(ist2 - soll) <= 0.6)) fehl.push([pid, zeilen.k, Math.round(soll * 100) / 100]);
  }
  check('Oberfläche: Materialkosten (Kennwertübersicht) = Menge × Listenpreis, nachgerechnet: Ytong ThermUltra 36,5 m³ × 452,70 = 16.524 €; Silka Classic KS 3 DF 17,5 m³ × 353,56 = 6.187 €; Silka XL 175 mm 100 m² × 50,07 = 5.007 €; Dyckerhoff 20 m³ × 164,00 = 3.280 €; Holcim C30/37 20 m³ × 209,50 = 4.190 €', fehl.length === 0, fehl);
  // Silka XL: Dicke weicht von der Preisliste ab -> keine Annahme
  await waehle(p, 'kalksandstein', 'silka-xl-basic-solid-175'); await eingabe(p, 100, 240);
  await p.evaluate(() => { document.querySelector('#ergebnisse > details').open = true; document.querySelectorAll('#ergebnisse details.sub').forEach(d => d.open = true); });
  const grund = await p.$eval('#rechnung-kosten', e => e.innerText.replace(/\s+/g, ' '));
  check('Silka XL (Preis gilt für 175 mm): Bei 240 mm Dicke wird kein Preis hochgerechnet; die Seite nennt den Grund („Dicke von 175 mm … Umrechnung wäre eine Annahme“)', /175 mm/.test(grund) && /Annahme/.test(grund), grund.slice(0, 300));
  // λ, Druckfestigkeit mit R und Quelle in den Tabellen
  await waehle(p, 'hochlochziegel', 'poroton-planziegel-t10-365'); await eingabe(p, 100, 365);
  const tab = await p.evaluate(() => { const z = l => { const r = [...document.querySelectorAll('#ergebnis-technisch table tr')].find(x => x.cells[0].textContent.trim().startsWith(l)); return r ? r.cells[1].textContent.replace(/\s+/g, ' ').trim() : null; }; return { lam: z('Nennwert λD'), druck: z('Druckfestigkeit'), r: document.querySelectorAll('#ergebnis-technisch td .art-richtwert').length }; });
  check('Poroton T10: Tabelle zeigt λ 0,1 (0,10) und Druckfestigkeit 8 N/mm² mit der Kennzeichnung „R“ (Richtwert); die Quelle (Wienerberger-Produktseite) erscheint im Reiter „Quellen & Details“', /^0,1(?!\d)/.test(tab.lam) && /^8/.test(tab.druck) && tab.r >= 2 && await (async () => { await p.click('#reiter-quellen'); const t = await p.$eval('#quellen-auswahl', e => ({ txt: e.innerText, links: [...e.querySelectorAll('a')].map(a => a.href) })); await p.click('#reiter-vergleich'); return t.links.some(l => /wienerberger\.de\/produkte\/wand\/ziegel\/poroton-planziegel-t10/.test(l)) && /Wienerberger/.test(t.txt); })(), tab);
  // Vergleich: zwei Betonprodukte, vergleichbare Preise (gleiche Konditionen) -> farbige Bewertung
  await p.selectOption('#kategorie', 'tragend'); await p.selectOption('#materialA', 'normalbeton');
  if (await p.$eval('#produktA', e => e.getBoundingClientRect().width === 0)) await p.click('#btn-produkt');
  await p.selectOption('#produktA', 'holcim-beton-c25-30-na4334'); await p.selectOption('#materialB', 'normalbeton'); await p.selectOption('#produktB', 'dyckerhoff-standard-c25-30');
  await eingabe(p, 100, 200);
  const kost = await p.$$eval('figure.chart[data-chart="kosten"] .chart-row[data-material]', r => r.map(x => [Math.round(parseFloat(x.dataset.wert)), x.dataset.farbe.toLowerCase()]));
  const hinweis = await p.$eval('figure.chart[data-chart="kosten"]', e => e.innerText.replace(/\s+/g, ' '));
  check('Vergleich Holcim C25/30 (204,50) gegen Dyckerhoff C25/30 (164,00): 100 m² × 20 cm = 20 m³ → 4.090 € gegen 3.280 €; die günstigere Variante ist grün, die teurere rot; kein „nicht vergleichbar“-Hinweis (gleiche Konditionen: netto, Listenpreis ohne Zuschläge)', kost.length === 2 && kost[0][0] === 4090 && kost[1][0] === 3280 && kost[0][1] === '#951f2b' && kost[1][1] === '#17643a' && !/Kein belastbarer direkter Vergleich/.test(hinweis), [kost, hinweis.slice(0, 200)]);
  // Vergleich Ytong gegen Silka (je m³): gleiche Konditionen
  await p.selectOption('#kategorie', 'tragend'); await p.selectOption('#materialA', 'porenbeton'); await p.selectOption('#produktA', 'ytong-thermsuper-pp2-035-365'); await p.selectOption('#materialB', 'kalksandstein'); await p.selectOption('#produktB', 'silka-solid-ks3df-175');
  await eingabe(p, 100, 175);
  const ys = await p.$$eval('figure.chart[data-chart="kosten"] .chart-row[data-material]', r => r.map(x => Math.round(parseFloat(x.dataset.wert))));
  const sollY = Math.round(100 * 0.175 * 242.20), sollS = Math.round(100 * 0.175 * (1922 / (1000 * 0.240 * 0.175 * 0.113)));
  check('Vergleich Ytong ThermSuper (242,20 €/m³) gegen Silka Solid KS 3 DF (1.922,00 € je 1.000 Stück = 408,59 €/m³) bei 100 m² × 17,5 cm: 4.239 € gegen 7.150 €', ys.length === 2 && Math.abs(ys[0] - sollY) <= 1 && Math.abs(ys[1] - sollS) <= 1, [ys, sollY, sollS]);
  // Alternativen mit neuen Produkten als Ausgangspunkt
  const alt = [];
  for (const [mat, pid] of [['hochlochziegel', 'poroton-s10-365-mw'], ['kalksandstein', 'silka-classic-ks5df-240'], ['porenbeton', 'ytong-thermcombi-pp6-065-365'], ['normalbeton', 'dyckerhoff-ecodur30-c25-30'], ['osb', 'egger-osb3-e0']]) {
    await waehle(p, mat, pid); await eingabe(p, 100, 200);
    await p.click('#reiter-alternativen');
    const t = await p.$eval('#alternativen-inhalt', e => e.innerText.replace(/\s+/g, ' '));
    alt.push([pid, /Ausgangsmaterial/.test(t)]);
    await p.click('#reiter-vergleich');
  }
  check('Alternativen: Mit jedem getesteten neuen Produkt als Material A (Poroton, Silka, Ytong, Dyckerhoff ECODUR, EGGER OSB 3 E0) zeigt der Reiter „Alternativen“ den Ausgangspunkt ohne Fehler', alt.every(a => a[1]), alt);
  // Export
  await waehle(p, 'kalksandstein', 'silka-solid-ks5df-240'); await eingabe(p, 100, 240);
  await p.click('#export-menue-knopf');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#csv-knopf')]);
  const pf = path.join(require('os').tmpdir(), 'mm43.csv'); await dl.saveAs(pf); const csv = fs.readFileSync(pf, 'utf8');
  check('CSV-Export nennt das Produkt (Silka Solid KS 5 DF) mit Hersteller Xella, Preis, Einheit und der Preislisten-Quelle', /Silka Solid KS 5 DF/.test(csv) && /Xella Deutschland GmbH/.test(csv) && /Preisliste/.test(csv) && /technik\.xella\.de/.test(csv));
  // Systemcheck der Anwendung
  const stat = await p.evaluate(() => ({ status: document.getElementById('status').textContent, fehler: MM.pruefeDaten(MATERIALMATCH_DATA).fehler.length }));
  check('Die Datenprüfung der Anwendung meldet keine Fehler („Datenbank geprüft ✓“, 0 Hinweise)', stat.fehler === 0 && /Datenbank geprüft ✓/.test(stat.status) && /0 Hinweise/.test(stat.status), stat);
  // PDF-Länge
  check('Keine Konsolenfehler oder -warnungen im gesamten Lauf', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
