/* Datenpaket 3 (18.11.2026): STEICO (Datenblätter und EPDs), Cirkel (PORIT, Preisliste 2026) und KS-ORIGINAL (Produktseiten + Cirkel-Preisliste)
   Die Erwartungswerte stehen hier unabhängig von data/produkte.js (aus den gelesenen Dokumenten abgeschrieben); die Umrechnungen werden neu gerechnet.
   Nicht übernommen und deshalb hier ausdrücklich geprüft: ISOVER (Cloudflare-Sperre), Knauf Insulation (knauf.com blockiert), STEICOzell (Rohdichte nur als Spanne),
   Branchen-EPDs (Kalksandstein, Porenbeton), KS-ORIGINAL 5 DF (Steingewicht in den zwei Quellen weicht um fast 4 % ab).
   Aufruf:  node tests/test49.js */
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

// STEICO: [id, λD, λB (DE), ρ, μ, GWP gesamt, fossil, biogen, luluc, EPD-Nummer, Ausgabe, gültig bis]
const STEICO = [
  ['steico-therm', 0.038, 0.040, 160, 5, -203, 75.1, -278, 0.600, 'NEPD-11337-11337-2'],
  ['steico-therm-dry', 0.037, 0.039, 110, 3, -103, 84.1, -188, 0.387, 'NEPD-11388-11388-2'],
  ['steico-special-dry', 0.040, 0.042, 140, 3, -135, 107, -243, 0.571, 'NEPD-11332-11332-2'],
  ['steico-universal-dry', 0.045, 0.047, 210, 3, -202, 161, -363, 0.843, 'NEPD-11389-11389-2']
];
// PORIT (Cirkel-Preisliste 2026, Seite 30): [id, Festigkeitsklasse, λR, €/m³, Artikelnummer]
const PORIT = [
  ['porit-pp2-035-365-l008', 2, 0.08, 334.00, '21096'], ['porit-pp2-035-365-l009', 2, 0.09, 308.00, '21097'], ['porit-pp2-040-365-l010', 2, 0.10, 301.00, '21098'],
  ['porit-pp4-050-365-l012', 4, 0.12, 304.00, '21099'], ['porit-pp6-065-365-l018', 6, 0.18, 309.00, '21100']
];
// KS-ORIGINAL: [id, SFK, λ-Grenze, Steingewicht Preisliste kg, €/1000 Stück, L, B, H in m, Artikelnummer, Rohdichteklasse]
const KS = [
  ['ks-original-ks2df-sfk12-rdk18-115', 12, 0.99, 5.25, 1167.25, 0.240, 0.115, 0.113, '18313', '1,8'],
  ['ks-original-ks2df-sfk20-rdk20-115', 20, 1.1, 5.95, 1279.50, 0.240, 0.115, 0.113, '18979', '2,0'],
  ['ks-original-ks3df-sfk12-rdk18-175', 12, 0.99, 8.04, 1617.25, 0.240, 0.175, 0.113, '18316', '1,8'],
  ['ks-original-ks3df-sfk20-rdk20-175', 20, 1.1, 8.91, 1992.50, 0.240, 0.175, 0.113, '18432', '2,0']
];
const NEU = STEICO.map(x => x[0]).concat(PORIT.map(x => x[0]), KS.map(x => x[0]));

(async () => {
  // ================= 1. Datenbestand =================
  check('Bestand: mindestens 75 Produkte (62 + 13 neue: STEICO 4, PORIT 5, KS-ORIGINAL 4) und 143 Quellen (121 + 22 neue; seit 3.2 weitere, siehe test50); IDs eindeutig; jedes Produkt gehört zu einem vorhandenen Material', PR.length >= 75 && new Set(PR.map(p => p.id)).size === PR.length && DB.quellen.length >= 143 && new Set(DB.quellen.map(q => q.id)).size === DB.quellen.length && PR.every(p => DB.baustoffe.some(m => m.id === p.material)), [PR.length, DB.quellen.length]);
  check('Kein neues Produkt ist Standardprodukt (die Startwerte der Materialien bleiben unverändert); höchstens ein Standardprodukt je Material', NEU.every(id => prod(id) && prod(id).standard === false) && (() => { const s = {}; PR.filter(p => p.standard).forEach(p => { s[p.material] = (s[p.material] || 0) + 1; }); return Object.values(s).every(n => n === 1); })());
  check('Nicht übernommen: kein Produkt von ISOVER oder Knauf Insulation (Server gesperrt, nichts umgangen), kein STEICOzell (Rohdichte nur als Spanne 35–45 kg/m³), kein KS-ORIGINAL 5 DF (Steingewicht 13,80 gegen 14,36 kg), keine Branchen-EPD als Produktwert', !PR.some(p => /isover|knauf insulation/i.test(p.hersteller + ' ' + p.name)) && !PR.some(p => /zell/i.test(p.id) && /steico/i.test(p.id)) && !PR.some(p => /ks-original-ks5df/.test(p.id)) && !DB.quellen.some(q => /kalksandstein-epd|autoclaved-aerated-concrete-epd|M-EPD-KSS|EPD-BPV/.test((q.url || '') + (q.titel || ''))));

  // STEICO
  const probleme = [];
  for (const [id, ld, lb, rho, mu, gg, gf, gb, gl, nr] of STEICO) {
    const p = prod(id), e = p.eigenschaften, pb = [];
    if (p.material !== 'holzfaserdaemmung' || p.hersteller !== 'STEICO SE') pb.push('Material/Hersteller');
    if (!nah(e.waermeleitfaehigkeit.wert, ld) || e.waermeleitfaehigkeit.art !== 'richtwert') pb.push('λD');
    if (!nah(e.waermeleitfaehigkeit_bemessung.wert, lb) || !/Deutschland/.test(e.waermeleitfaehigkeit_bemessung.hinweis)) pb.push('λB');
    if (e.rohdichte.wert !== rho) pb.push('Rohdichte');
    if (e.wasserdampf_mu.wert !== mu) pb.push('μ');
    if (e.waermekapazitaet.wert !== 2100) pb.push('c');
    if (e.brandverhalten.wert !== 'E') pb.push('Brand');
    const g = e.gwp.werte;
    if (!g || g.gesamt !== gg || g.fossil !== gf || g.biogen !== gb || g.luluc !== gl) pb.push(['GWP', g]);
    if (e.gwp.module !== 'A1-A3' || e.gwp.deklarierte_einheit !== '1 m³' || e.gwp.art !== 'richtwert' || !new RegExp(nr).test(e.gwp.hinweis)) pb.push('GWP-Angaben');
    if (e.preis.wert !== null || !/^Preis nicht verfügbar/.test(e.preis.hinweis) || e.preis.art !== null) pb.push('Preis muss „nicht verfügbar“ sein');
    // Quellen: Datenblatt und EPD, https, Abrufdatum, Typ
    const qd = qu(e.rohdichte.quelle), qe = qu(e.gwp.quelle);
    if (!qd || !/^https:\/\/www\.steico\.com\//.test(qd.url) || qd.abgerufen !== '2026-11-18' || qd.quellenart !== 'Herstellerdatenblatt' || !/Version 20/.test(qd.titel)) pb.push('Datenblatt-Quelle');
    if (!qe || !/^https:\/\/www\.steico\.com\//.test(qe.url) || qe.typ !== 'specific dataset' || !qe.titel.includes(nr) || qe.abgerufen !== '2026-11-18' || !/EPD/.test(qe.quellenart) || qe.geltung !== 'produktspezifisch') pb.push('EPD-Quelle');
    if (pb.length) probleme.push([id, pb]);
  }
  check('STEICO therm, therm dry, special dry, universal dry (35 mm): λD, λB (DE), Rohdichte, μ, c, Euroklasse E und GWP-Werte stimmen mit den gelesenen Technischen Merkblättern (Version 20) und EPDs (EPD Global) überein; Preis „nicht verfügbar“; Quellen mit https-Link, Abrufdatum und Typ', probleme.length === 0, probleme.slice(0, 3));
  const un = prod('steico-universal').eigenschaften;
  check('STEICOuniversal (Bestandsprodukt): die EPD NEPD-11336-11336-2 ergänzt nur den CO₂-Kennwert (gesamt −310, fossil 148, biogen −459, luluc 1,11 je m³); Rohdichte 270 und λ bleiben unverändert', un.gwp.werte.gesamt === -310 && un.gwp.werte.fossil === 148 && un.gwp.werte.biogen === -459 && un.gwp.werte.luluc === 1.11 && un.rohdichte.wert === 270 && nah(un.waermeleitfaehigkeit.wert, 0.048) && qu('epd-steico-universal').abgerufen === '2026-11-18');
  check('STEICOuniversal dry nennt ausdrücklich nur die Werte für 35 mm (EPD und Datenblatt stimmen dort überein: ρ 210, λD 0,045); die abweichenden Werte ab 40 mm stehen nur als Text', /35 mm/.test(prod('steico-universal-dry').name) && /ab 40 mm/i.test(prod('steico-universal-dry').beschreibung) && /0,043/.test(prod('steico-universal-dry').beschreibung));
  check('EPD-Hinweis ist ehrlich: „keine Einzelprüfung der EPD“ steht in Quelle und Hinweis; die Kennwerte sind „R“ (Richtwert), nicht „V“ (verifiziert)', STEICO.every(x => /Einzelprüfung/.test(qu('epd-steico-' + x[0].replace('steico-', '')).qualitaet) && prod(x[0]).eigenschaften.gwp.art === 'richtwert'));

  // PORIT
  const pp = [];
  for (const [id, fk, lam, preis, art] of PORIT) {
    const p = prod(id), e = p.eigenschaften, pb = [];
    if (p.material !== 'porenbeton' || !/Cirkel/.test(p.hersteller)) pb.push('Material/Hersteller');
    if (!nah(e.waermeleitfaehigkeit.wert, lam) || !/λR/.test(e.waermeleitfaehigkeit.hinweis) || !/nicht ausdrücklich/.test(e.waermeleitfaehigkeit.hinweis)) pb.push('λR');
    if (e.waermeleitfaehigkeit_bemessung.wert !== null || !/^Nicht verfügbar/.test(e.waermeleitfaehigkeit_bemessung.hinweis)) pb.push('λB muss „nicht verfügbar“ sein');
    if (e.druckfestigkeit.wert !== fk || e.druckfestigkeit.einheit !== 'N/mm²') pb.push('Festigkeitsklasse');
    if (e.rohdichte.wert !== null || !/Rohdichteklasse/.test(e.rohdichte.hinweis)) pb.push('Rohdichte muss „nicht verfügbar“ sein');
    if (e.gwp.werte !== null || !/Branchen-EPD/.test(e.gwp.hinweis)) pb.push('CO₂ muss „nicht verfügbar“ sein');
    if (!nah(e.preis.wert, preis) || e.preis.einheit !== '€/m³' || e.preis.mwst !== 'exkl. MwSt.' || e.preis.art !== 'richtwert' || !e.preis.hinweis.includes(art)) pb.push('Preis');
    const q = qu(e.preis.quelle);
    if (!q || q.url !== 'https://downloads.cirkel.de/cirkel-preisliste-2026' || q.datum !== '2026-01-01' || q.abgerufen !== '2026-11-18' || !/^Preisliste/.test(q.quellenart) || !q.produkt.includes(art) || q.geltung !== 'produktspezifisch') pb.push('Quelle');
    const pa = q && q.preisangabe;
    if (!pa || pa.status !== 'preisliste' || pa.einheit !== '€/m³' || !nah(pa.preis, preis) || pa.mwst !== 'exkl. MwSt.' || pa.umrechnung.art !== 'direkt' || !pa.verfuegbarkeit || !pa.region || !pa.variante) pb.push('Preisangabe');
    if (pb.length) pp.push([id, pb]);
  }
  check('Cirkel PORIT (365 mm): λR, Festigkeitsklasse und Preis stimmen mit der Preisliste 2026 (Seite 30, Artikelnummern 21096–21100) überein; λB, Rohdichte und CO₂ stehen ausdrücklich als „nicht verfügbar“ (Branchen-EPD nicht übernommen); Preis netto, Status „Preisliste“', pp.length === 0, pp.slice(0, 3));

  // KS-ORIGINAL
  const kk = [];
  for (const [id, sfk, lam, gw, p1000, L, B, H, art, rdk] of KS) {
    const p = prod(id), e = p.eigenschaften, pb = [];
    const vol = L * B * H;
    if (p.material !== 'kalksandstein' || p.hersteller !== 'KS-ORIGINAL GmbH') pb.push('Material/Hersteller');
    if (!nah(e.waermeleitfaehigkeit.wert, lam) || !/Obergrenze/.test(e.waermeleitfaehigkeit.hinweis)) pb.push('λ (Obergrenze)');
    if (e.waermeleitfaehigkeit_bemessung.wert !== null || !/^Nicht verfügbar/.test(e.waermeleitfaehigkeit_bemessung.hinweis)) pb.push('λB muss „nicht verfügbar“ sein');
    if (e.druckfestigkeit.wert !== sfk) pb.push('SFK');
    if (e.rohdichte.wert !== Math.round(gw / vol) || !/Von uns berechnet/.test(e.rohdichte.hinweis)) pb.push(['Rohdichte', e.rohdichte.wert, Math.round(gw / vol)]);
    if (!nah(e.preis.wert, Math.round(p1000 / 1000 / vol * 100) / 100, 1e-9) || e.preis.einheit !== '€/m³' || e.preis.mwst !== 'exkl. MwSt.') pb.push(['Preis', e.preis.wert, p1000 / 1000 / vol]);
    if (rdk === '1,8' && (e.gwp === undefined || e.gwp.werte !== null)) pb.push('CO₂ bei RDK 1,8 muss „nicht verfügbar“ sein (generischer Datensatz gilt für 2.000 kg/m³)');
    const qs = qu(p.datenblatt), qp = qu(e.preis.quelle);
    if (!qs || !/^https:\/\/www\.ks-original\.de\/produkt\//.test(qs.url) || qs.abgerufen !== '2026-11-18' || qs.geltung !== 'produktspezifisch') pb.push('Produktseite');
    const pa = qp && qp.preisangabe;
    if (!qp || qp.url !== 'https://downloads.cirkel.de/cirkel-preisliste-2026' || !qp.produkt.includes(art) || !pa || pa.einheit !== '€/1.000 Stück' || !nah(pa.preis, p1000) || pa.status !== 'preisliste' || pa.umrechnung.art !== 'palette_stueck_volumen' || !nah(pa.umrechnung.laenge_m, L) || !nah(pa.umrechnung.breite_m, B) || !nah(pa.umrechnung.hoehe_m, H)) pb.push('Preisliste');
    if (pb.length) kk.push([id, pb]);
  }
  check('KS-ORIGINAL (4 Vollsteine): Steindruckfestigkeitsklasse und λ-Obergrenze von der Produktseite, Preis aus der Cirkel-Preisliste (€/1.000 Stück über das Steinvolumen auf €/m³ umgerechnet, nachgerechnet), Rohdichte aus Steingewicht ÷ Volumen als „von uns berechnet“ gekennzeichnet; CO₂ bei Rohdichteklasse 1,8 „nicht verfügbar“', kk.length === 0, kk.slice(0, 3));
  check('Handrechnung: KS 2 DF SFK 12 = 1.167,25 ÷ (1.000 × 0,24 × 0,115 × 0,113 m³) = 374,26 €/m³ und Rohdichte 5,25 kg ÷ 0,0031188 m³ = 1.683 kg/m³; KS 3 DF SFK 20: 1.992,50 ÷ 4,746 = 419,83 €/m³, 1.877 kg/m³', nah(prod('ks-original-ks2df-sfk12-rdk18-115').eigenschaften.preis.wert, 374.26, 1e-5) && prod('ks-original-ks2df-sfk12-rdk18-115').eigenschaften.rohdichte.wert === 1683 && nah(prod('ks-original-ks3df-sfk20-rdk20-175').eigenschaften.preis.wert, 419.83, 1e-5) && prod('ks-original-ks3df-sfk20-rdk20-175').eigenschaften.rohdichte.wert === 1877);

  // Alle neuen Produkte: jede vorhandene Angabe hat eine geprüfte Quelle, jede fehlende eine Begründung
  const lose = [];
  for (const id of NEU) for (const [k, x] of Object.entries(prod(id).eigenschaften)) {
    const hat = k === 'gwp' ? !!x.werte : (x.wert !== null && x.wert !== undefined);
    if (hat) { const q = qu(x.quelle); if (!q || q.geprueft !== true || !/^https:\/\//.test(q.url) || q.abgerufen !== '2026-11-18' || !q.quellenart || !q.region || !q.produkt) lose.push([id, k, 'Quelle']); }
    else if (!x.hinweis || x.art !== null || x.quelle !== null) lose.push([id, k, 'fehlender Wert ohne Begründung']);
  }
  check('Alle 13 neuen Produkte: jede vorhandene Angabe hat eine geprüfte https-Quelle mit Abrufdatum 2026-11-18, Region und Produkt; jeder fehlende Wert steht als „nicht verfügbar“ mit Begründung und ohne Quelle', lose.length === 0, lose.slice(0, 4));

  // ================= 2. Oberfläche =================
  const b = await chromium.launch();
  const errors = [];
  const neu = async modus => { const c = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }); const p = await c.newPage(); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); await p.goto(URL + '?modus=' + modus); await p.waitForTimeout(250); return p; };
  const waehle = async (p, mat, pid, platz = 'A') => { const kat = DB.baustoffe.find(m => m.id === mat).kategorien[0]; await p.selectOption('#kategorie', kat); await p.selectOption('#material' + platz, mat); if (await p.$eval('#produkt' + platz, e => e.getBoundingClientRect().width === 0)) await p.click('#btn-produkt'); await p.selectOption('#produkt' + platz, pid); };
  const eingabe = async (p, f, dMm) => { await p.fill('#flaeche', String(f)); await p.selectOption('#dickeEinheit', 'mm'); await p.fill('#dicke', String(dMm).replace('.', ',')); };
  const kachel = (p, titel) => p.evaluate(t => { const k = [...document.querySelectorAll('#dashboard .kennwert')].find(e => e.querySelector('h3').textContent.trim().startsWith(t)); return k ? [...k.querySelectorAll('.kw-zahl')].map(z => z.textContent.trim()) : null; }, titel);
  const zahl = t => parseFloat(String(t).replace(/\./g, '').replace(',', '.'));

  const p = await neu('echt');
  // STEICOtherm: 100 m² × 200 mm = 20 m³ → CO₂ fossil 20 × 75,1 = 1.502 kg, Gewicht 20 × 160 = 3.200 kg
  await waehle(p, 'holzfaserdaemmung', 'steico-therm'); await eingabe(p, 100, 200);
  const co2 = await kachel(p, 'CO₂'), gew = await kachel(p, 'Gewicht'), lam = await kachel(p, 'Wärmedämmung');
  check('Oberfläche STEICOtherm (100 m² × 20 cm = 20 m³): CO₂ fossil 20 × 75,1 = 1.502 kg CO₂e, Gewicht 20 × 160 = 3.200 kg, λ = Bemessungswert 0,040 (steht vor dem Nennwert 0,038)', co2 && zahl(co2[0]) === 1502 && gew && zahl(gew[0]) === 3200 && lam && zahl(lam[0]) === 0.04, { co2, gew, lam });
  // STEICOspecial dry in Material B: Vergleich der Kosten ist nicht möglich (kein Preis), das steht ehrlich da
  const dash = await p.$eval('#dashboard', e => e.innerText.replace(/\s+/g, ' '));
  check('STEICOtherm ohne Preis: Die Kostenkachel nennt „nicht verfügbar“ bzw. keinen Wert; es wird kein Preis angenommen', !/Materialkosten[^A-Z]*\d/.test(dash.replace(/CO₂/g, '')) || /nicht verfügbar|nicht berechenbar|fehlt/i.test(dash), dash.slice(0, 300));
  // PORIT PP 2/0,35 (λR 0,09): 100 m² × 365 mm = 36,5 m³ × 308 = 11.242 €
  await waehle(p, 'porenbeton', 'porit-pp2-035-365-l009'); await eingabe(p, 100, 365);
  const kost = await kachel(p, 'Materialkosten');
  check('Oberfläche PORIT PP 2/0,35 (λR 0,09): Materialkosten = 36,5 m³ × 308,00 €/m³ = 11.242 € (Handrechnung)', kost && Math.abs(zahl(kost[0]) - 11242) <= 1, kost);
  const co2p = await p.$eval('#dashboard', e => e.innerText.replace(/\s+/g, ' '));
  check('PORIT: CO₂ ist „nicht verfügbar“ (keine Annahme aus dem generischen Datensatz der Rohdichteklasse 0,40): kein CO₂-Zahlenwert in der Kachel', await p.evaluate(() => { const k = [...document.querySelectorAll('#dashboard .kennwert')].find(e => e.querySelector('h3').textContent.trim().startsWith('CO₂')); return !!k && k.querySelectorAll('.kw-zahl').length === 0; }), co2p.slice(0, 300));
  // KS 3 DF SFK 12: 100 m² × 175 mm = 17,5 m³ × 340,77 = 5.963 €; Gewicht 17,5 × 1.694 = 29.645 kg
  await waehle(p, 'kalksandstein', 'ks-original-ks3df-sfk12-rdk18-175'); await eingabe(p, 100, 175);
  const kk2 = await kachel(p, 'Materialkosten'), gk = await kachel(p, 'Gewicht');
  check('Oberfläche KS-ORIGINAL KS 3 DF SFK 12: Materialkosten = 17,5 m³ × 340,77 = 5.963 € und Gewicht = 17,5 × 1.694 = 29.645 kg (Rohdichte aus Steingewicht berechnet)', kk2 && Math.abs(zahl(kk2[0]) - 5963) <= 1 && gk && Math.abs(zahl(gk[0]) - 29645) <= 20, { kk2, gk });
  // Quellen sichtbar: Reiter „Quellen & Details“ zeigt Links der gewählten Produkte
  await p.click('#reiter-quellen');
  const links = await p.$eval('#quellen-auswahl', e => ({ txt: e.innerText, links: [...e.querySelectorAll('a')].map(a => a.href) }));
  check('Quellen sichtbar: Im Reiter „Quellen & Details“ stehen die Links zur KS-ORIGINAL-Produktseite und zur Cirkel-Preisliste (https)', links.links.some(l => /ks-original\.de\/produkt\//.test(l)) && links.links.some(l => /downloads\.cirkel\.de\/cirkel-preisliste-2026/.test(l)), links.links);
  await p.click('#reiter-vergleich');
  // Steckbrief zeigt die Datenqualität (Herstellerangabe / EPD / Preisrichtwert)
  const dq = await p.evaluate(() => { const m = MM.quellen; const e = MM.produkte.wirksam('holzfaserdaemmung', 'steico-therm').eigenschaften; const d = k => m.datenqualitaet(e[k].art, e[k].quelle, k).name; return { lam: d('waermeleitfaehigkeit'), gwp: d('gwp'), preis: d('preis'), ks: (() => { const f = MM.produkte.wirksam('kalksandstein', 'ks-original-ks3df-sfk12-rdk18-175').eigenschaften; return [m.datenqualitaet(f.preis.art, f.preis.quelle, 'preis').name, m.datenqualitaet(f.druckfestigkeit.art, f.druckfestigkeit.quelle, 'druckfestigkeit').name]; })() }; });
  check('Datenqualität (aus Datenart und Quelle abgeleitet): STEICOtherm λ = Herstellerangabe, CO₂ = EPD, Preis = Keine belegten Daten; KS-ORIGINAL: Preis = Preisrichtwert, Druckfestigkeit = Herstellerangabe', dq.lam === 'Herstellerangabe' && dq.gwp === 'EPD' && dq.preis === 'Keine belegten Daten' && dq.ks[0] === 'Preisrichtwert' && dq.ks[1] === 'Herstellerangabe', dq);
  await p.close();

  // Demo-Modus: dieselben Produkte lassen sich wählen, keine Fehler in der Konsole
  const d = await neu('demo');
  await waehle(d, 'holzfaserdaemmung', 'steico-special-dry'); await eingabe(d, 100, 200);
  const dc = await kachel(d, 'CO₂');
  check('Demo-Modus: STEICOspecial dry gewählt, CO₂ fossil 20 × 107 = 2.140 kg CO₂e', dc && zahl(dc[0]) === 2140, dc);
  await d.close();
  await b.close();
  check('Keine Fehler oder Warnungen in der Konsole', errors.length === 0, errors.slice(0, 3));
  console.log(fails ? '\n' + fails + ' Prüfung(en) FEHLGESCHLAGEN' : '\nAlle Prüfungen bestanden');
  process.exit(fails ? 1 : 0);
})();
