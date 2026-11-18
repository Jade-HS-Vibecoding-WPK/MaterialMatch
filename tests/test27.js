/* Entscheidungen vom 16.11.2026, dritte Runde
   1  Preise aus öffentlichen Händlerseiten (Produkt, Händler, Preis, Einheit, Link, Abrufdatum); nur vergleichen, wenn Einheiten und
      Produkteigenschaften vergleichbar sind; sonst „Preis nicht verfügbar“
   2  Mehrere konkrete Produkte je Material (Hersteller und Quelle sichtbar), sonst klar gekennzeichneter generischer Datensatz;
      eigene Produkte der Nutzer:innen
   3  Zellulose: kein deutscher Bemessungswert ohne Beleg
   Aufruf:  node tests/test27.js */
const { chromium } = require('playwright');
require('./_offline.js');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 700))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html';
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(PROJ, 'data', 'baustoffe.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(PROJ, 'data', 'produkte.js'), 'utf8'), ctx);
const DB = ctx.window.MATERIALMATCH_DATA, PR = ctx.window.MATERIALMATCH_PRODUKTE;
const prod = id => PR.find(p => p.id === id);
const qu = id => DB.quellen.find(q => q.id === id);
const nah = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async (url = URL, ctxOpt = null) => { const c = ctxOpt || await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }); const pg = await c.newPage(); pg.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); pg.on('pageerror', e => errors.push(String(e))); await pg.goto(url); await pg.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; }); return pg; };
  const oeffne = pg => pg.$$eval('details', d => d.forEach(x => { x.open = true; }));
  const setze = (pg, o) => pg.evaluate(o => MM.auswahl.setzeAuswahl(o), o);
  const eingabe = async (pg, f, d) => { await pg.fill('#flaeche', String(f)); await pg.fill('#dicke', String(d)); };
  const zeile = (pg, sel, label) => pg.evaluate(([sel, label]) => { const r = [...document.querySelectorAll(sel + ' table tr')].find(x => x.cells[0].textContent.startsWith(label)); return r ? [...r.cells].slice(1).map(c => c.textContent.replace(/\s+/g, ' ').trim()) : null; }, [sel, label]);

  // ================= Datenmodell der Produkte =================
  const proMat = {}; PR.forEach(p => { (proMat[p.material] = proMat[p.material] || []).push(p); });
  check('Produktdaten: 82 Produkte zu 21 Materialien (Hochlochziegel 12, Porenbeton 13, Normalbeton 8, Kalksandstein 10, OSB 4, Calciumsulfatestrich 4, Mineralwolle 3, EPS 3, Kalkzementputz 3, Gipsplatte 3, Kalkgipsinnenputz 2, KVH 2, Holzfaser 7; Zellulose, Hanf, Glaswolle, Zink, Zementestrich, Brettsperrholz, Brettschichtholz, XPS je 1; die Produkte seit Datenpaket 1, 2 und 3 prüfen test42, test43 und test49), jedes mit Hersteller, Beschreibung und Hauptdokument', PR.length === 82 && Object.keys(proMat).length === 21 && proMat.calciumsulfatestrich.length === 4 && proMat.kalkzementputz.length === 3 && proMat.kalkgipsinnenputz.length === 2 && proMat.hochlochziegel.length === 12 && proMat.porenbeton.length === 13 && proMat.normalbeton.length === 8 && proMat.kalksandstein.length === 10 && proMat.osb.length === 4 && proMat.mineralwolle.length === 3 && proMat.eps.length === 3 && proMat.holzfaserdaemmung.length === 7 && proMat.gipskarton.length === 3 && PR.every(p => p.hersteller && p.beschreibung && qu(p.datenblatt) && qu(p.datenblatt).geprueft === true), Object.keys(proMat));
  check('Höchstens ein Standardprodukt je Material; ein Produkt mit abweichender Rohdichte (STEICO, 50 bzw. 270 statt 160 kg/m³) ist nie Standard (EGGER OSB 3 TOP als Standard hat dieselbe Rohdichte 600 wie der generische Datensatz) – das Material startet dann als generischer Datensatz', Object.values(proMat).every(l => l.filter(p => p.standard).length <= 1) && PR.filter(p => p.eigenschaften.rohdichte && p.eigenschaften.rohdichte.wert !== DB.baustoffe.find(m => m.id === p.material).eigenschaften.rohdichte.wert && p.eigenschaften.rohdichte.wert !== 600).every(p => !p.standard) && proMat.holzfaserdaemmung.every(p => !p.standard));
  const kork = DB.baustoffe.filter(m => !proMat[m.id]).length;
  check('Materialien ohne Produktdaten (29 von 50) gelten als generischer Datensatz', kork === 29, kork);
  const fl = prod('steico-flex-036').eigenschaften;
  check('STEICOflex 036: Werte wie im Merkblatt gelesen (λD 0,036; λB Deutschland 0,038; μ 2; c 2.100; ρ 50; Brandverhalten E), CO₂ aus der produktspezifischen EPD (1 m² bei 140 mm: gesamt −4,7; fossil 7,1; biogen −12; Landnutzung 0,015), Datenart verifiziert, Quelle Typ „specific dataset“', fl.waermeleitfaehigkeit.wert === 0.036 && fl.waermeleitfaehigkeit_bemessung.wert === 0.038 && fl.wasserdampf_mu.wert === 2 && fl.waermekapazitaet.wert === 2100 && fl.rohdichte.wert === 50 && fl.brandverhalten.wert === 'E' && fl.gwp.werte.fossil === 7.1 && fl.gwp.werte.gesamt === -4.7 && fl.gwp.werte.biogen === -12 && fl.gwp.deklarierte_einheit === '1 m²' && fl.gwp.bezugsdicke_m === 0.14 && fl.gwp.art === 'verifiziert' && qu('epd-steico-flex-036').typ === 'specific dataset');
  const un = prod('steico-universal').eigenschaften;
  check('STEICOuniversal: ρ 270 passt nicht zum generischen CO₂-Datensatz (160); seit Datenpaket 3 steht die produktspezifische EPD (EPD Global, NEPD-11336-11336-2, 1 m³, A1–A3: fossil 148, gesamt −310) mit Quelle da; Preis weiterhin „nicht verfügbar“', un.gwp.werte && un.gwp.werte.fossil === 148 && un.gwp.werte.gesamt === -310 && un.gwp.quelle === 'epd-steico-universal' && /NEPD-11336-11336-2/.test(un.gwp.hinweis) && un.preis.wert === null && /^Preis nicht verfügbar/.test(un.preis.hinweis));

  // ================= Preise: Händler, Produkt, Preis, Einheit, Link, Abrufdatum =================
  const alleMitPreis = PR.filter(p => p.eigenschaften.preis && p.eigenschaften.preis.wert !== null);
  const PREIS_IDS = ['holcim-beton-c25-30-na4334', 'profibaustoffe-estrich-ct-c20-f4', 'profibaustoffe-fliessbeton-dc25-30', 'profibaustoffe-mz1', 'rockwool-klemmrock-035', 'steico-flex-036', 'ytong-pp2-035-thermstandard-365',
    'ytong-thermultra-pp2-030-365', 'ytong-thermsuper-pp2-035-365', 'ytong-thermstrong-pp4-050-365', 'ytong-thermcombi-pp4-050-365', 'ytong-thermcombi-pp6-065-365',
    'silka-classic-ks3df-175', 'silka-classic-ks5df-240', 'silka-solid-ks3df-175', 'silka-solid-ks5df-240', 'silka-xl-basic-solid-175', 'silka-xl-basic-solid-240',
    'holcim-beton-c30-37-na5334', 'holcim-beton-c35-45-na6334', 'dyckerhoff-standard-c25-30', 'dyckerhoff-standard-c30-37', 'dyckerhoff-ecodur30-c25-30', 'dyckerhoff-ecodur40-c25-30',
    'porit-pp2-035-365-l008', 'porit-pp2-035-365-l009', 'porit-pp2-040-365-l010', 'porit-pp4-050-365-l012', 'porit-pp6-065-365-l018',
    'ks-original-ks2df-sfk12-rdk18-115', 'ks-original-ks2df-sfk20-rdk20-115', 'ks-original-ks3df-sfk12-rdk18-175', 'ks-original-ks3df-sfk20-rdk20-175',
    'profibaustoffe-mp2', 'profibaustoffe-mp4', 'profibaustoffe-mk1', 'profibaustoffe-mk3', 'profibaustoffe-alphafliessestrich-4mm-ca-c20', 'profibaustoffe-alphafliessestrich-4mm-ca-c30', 'profibaustoffe-alphafliessestrich-2mm-ca-c20'
  ];
  check('Genau 40 Preise: zwei Händlerpreise (OBI), zwei Herstellerpreislisten bis Datenpaket 1 (Holcim Beton, Ytong PP 2-0,35), zehn Preise der österreichischen Preisliste Profibaustoffe (drei bis Datenpaket 2, sieben seit 3.2; nie Standardprodukt) und seit Datenpaket 2 17 Listenpreise (Xella Ytong 5 und Silka 6, Holcim 2, Dyckerhoff 4; alle nicht Standardprodukt) und seit Datenpaket 3 neun Cirkel-Listenpreise (PORIT 5, KS-ORIGINAL 4); jeder mit Preisliste/Händler, Seite oder Link und Abrufdatum', JSON.stringify(alleMitPreis.map(p => p.id).sort()) === JSON.stringify(PREIS_IDS.slice().sort()) && alleMitPreis.filter(p => /profibaustoffe|^ytong-therm|^silka|^dyckerhoff|-na[56]334$|^porit-|^ks-original-/.test(p.id)).every(p => !p.standard));
  const preisProdukte = alleMitPreis.filter(p => /^Händlerpreis/.test(qu(p.eigenschaften.preis.quelle).quellenart));
  check('Jeder Preis: Quelle „Händlerpreis“ mit Händler, Produkt, Preis im Original, https-Link, Abrufdatum 2026-11-16; Einheit €/m³; Mehrwertsteuer und Leistungsumfang bekannt; Bezugsdicke', preisProdukte.every(p => { const e = p.eigenschaften.preis, q = qu(e.quelle); return /^Händlerpreis/.test(q.quellenart) && /OBI/.test(q.herausgeber) && q.produkt && q.preisangabe && /€\/Packung/.test(q.preisangabe.einheit) && /^https:\/\/www\.obi\.de\/p\//.test(q.url) && q.abgerufen === '2026-11-16' && e.einheit === '€/m³' && e.mwst === 'inkl. 19 % MwSt.' && /ohne Transport und Einbau/.test(e.umfang) && typeof e.bezugsdicke_m === 'number'; }));
  // Nachrechnung: 31,72 € je 2,81 m² bei 100 mm; 65,96 € je 4,0 m² bei 120 mm
  check('Umrechnung nachgerechnet: STEICOflex 31,72 ÷ (2,81 × 0,10) = 112,88 €/m³; Klemmrock 65,96 ÷ (4,0 × 0,12) = 137,42 €/m³ (auch 11,29 €/m² und 16,49 €/m² stimmen mit den Händlerangaben überein)', nah(Math.round(31.72 / (2.81 * 0.10) * 100) / 100, prod('steico-flex-036').eigenschaften.preis.wert) && nah(Math.round(65.96 / (4.0 * 0.12) * 100) / 100, prod('rockwool-klemmrock-035').eigenschaften.preis.wert) && Math.abs(31.72 / 2.81 - 11.29) < 0.01 && Math.abs(65.96 / 4 - 16.49) < 0.01);

  let p = await neu();
  await oeffne(p);
  await setze(p, { a: 'mineralwolle', b: 'mineralwolle', pb: 'rockwool-klemmrock-035', c: 'holzfaserdaemmung', pc: 'steico-flex-036' });
  await eingabe(p, 100, 12);
  const pl = await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.map(x => ({ name: x.material.name, produkt: x.produkt.name, hersteller: x.produkt.hersteller })));
  check('Dasselbe Material in zwei Plätzen mit verschiedenen Produkten (Fixrock 035 und Klemmrock 035): Namen unterscheiden sich durch den Produktnamen; dritter Platz STEICOflex 036', pl[0].name !== pl[1].name && /Fixrock 035/.test(pl[0].name) && /Klemmrock 035/.test(pl[1].name) && pl[2].produkt === 'STEICOflex 036' && pl[2].hersteller === 'STEICO SE', pl);
  const kosten = await zeile(p, '#rechnung-kosten', 'Materialkosten');
  const preisZ = await zeile(p, '#rechnung-kosten', 'Einheitspreis');
  check('Kosten bei 100 m² × 12 cm = 12 m³: Fixrock ohne Preis „Preis nicht verfügbar“ → nicht berechenbar; Klemmrock 12 × 137,42 = 1.649 €; STEICOflex 12 × 112,88 = 1.355 €', preisZ[0].startsWith('Preis nicht verfügbar') && kosten[0] === 'nicht berechenbar' && kosten[1].startsWith('1.649') && kosten[2].startsWith('1.355'), [preisZ, kosten]);
  const warn = await p.$$eval('#rechnung-kosten .warn', w => w.map(x => x.textContent));
  check('Preise gelten für 120 mm und 100 mm: Hinweis auf unterschiedliche Produktdicken im Vergleich (Preise nicht blind vergleichen); der Preis von STEICOflex gilt für 100 mm, eingegeben sind 120 mm → Hinweis „Orientierend“', warn.some(w => /unterschiedliche Produktdicken \(100 mm, 120 mm\)|unterschiedliche Produktdicken \(120 mm, 100 mm\)/.test(w)) && warn.some(w => /^Orientierend: Der Händlerpreis gilt für eine bestimmte Produktdicke/.test(w) && /STEICOflex|Holzfaserdämmung/.test(w)), warn);
  const fn = await p.$$eval('#rechnung-kosten .fn-source', f => f.map(x => x.textContent));
  check('Fußnoten der Preise: Händler OBI, Artikel, Preis je Verkaufseinheit, Abrufdatum und Link-Text', fn.some(t => /OBI: Rockwool Klemmrock/.test(t) && /abgerufen 2026-11-16/.test(t)) && fn.some(t => /OBI: Steico Flex 036/.test(t)), fn);
  const link = await p.$$eval('#rechnung-kosten .fn-source a', a => a.map(x => [x.href, x.target, x.rel]));
  check('Die Preisquellen sind Links auf die Händlerseite (https, neuer Tab, noopener)', link.length >= 2 && link.every(l => /^https:\/\/www\.obi\.de\/p\//.test(l[0]) && l[1] === '_blank' && /noopener/.test(l[2])), link);
  // gleiche Dicke 10 cm: Preis von STEICOflex passt, Mehrwertsteuer-Vorbehalt entfällt, da gleiche Basis
  await setze(p, { a: 'holzfaserdaemmung', pa: 'steico-flex-036', b: 'mineralwolle', pb: 'rockwool-klemmrock-035', c: '' }); await eingabe(p, 100, 10);
  const w2 = await p.$$eval('#rechnung-kosten .warn', w => w.map(x => x.textContent));
  check('Mehrwertsteuer und Leistungsumfang gleich (inkl. 19 %, ohne Einbau): kein Vorbehalt zur Mehrwertsteuer; nur der Hinweis zur Dicke des Klemmrock-Preises (120 mm statt 100 mm eingegeben)', !w2.some(w => /Mehrwertsteuer/.test(w)) && w2.some(w => /Händlerpreis gilt für eine bestimmte Produktdicke/.test(w) && /Preis für 120 mm, eingegeben 100 mm/.test(w)), w2);
  const k2 = await zeile(p, '#rechnung-kosten', 'Materialkosten');
  check('STEICOflex bei exakt 100 mm: 10 m³ × 112,88 = 1.129 € ohne Dickenhinweis für dieses Produkt', k2[0].startsWith('1.129') && !w2.some(w => /Produktdicke/.test(w) && /STEICOflex/.test(w)), k2);

  // Echtdaten: Materialien ohne Preis → „Preis nicht verfügbar“
  await setze(p, { a: 'normalbeton', b: 'baustahl', c: '' });
  const pz = await zeile(p, '#ergebnis-kosten', 'Einheitspreis');
  check('Echtdaten-Modus: Normalbeton zeigt den Holcim-Listenpreis (204,50 €/m³ netto, gerundet 205), Baustahl (kein verlässlicher Preis gefunden) „Preis nicht verfügbar“ statt einer geschätzten Zahl', /^205 €\/m³/.test(pz[0]) && pz[1].startsWith('Preis nicht verfügbar'), pz);

  // CO₂ aus der EPD: 100 m² × 14 cm → Faktor Dicke/Bezugsdicke = 1 → fossil 7,1 × 100 = 710 kg
  await setze(p, { a: 'holzfaserdaemmung', pa: 'steico-flex-036', b: 'mineralwolle', c: '' }); await eingabe(p, 100, 14);
  const co2 = await zeile(p, '#rechnung-co2', 'davon fossil');
  check('CO₂ von STEICOflex 036 aus der EPD: 100 m² bei 14 cm = 100 × 7,1 = 710 kg CO₂e (fossil)', co2 && /^710/.test(co2[0]), co2);

  // ================= Produktwahl in der Oberfläche =================
  p = await neu();
  await p.selectOption('#kategorie', 'daemmstoff');
  await p.selectOption('#materialA', 'mineralwolle');
  const optA = await p.$$eval('#produktA option', o => o.map(x => [x.value, x.disabled]));
  check('Produktliste Mineralwolle: Fixrock 035 (Standard, vorgewählt), Fixrock 033, Klemmrock 035 und „Generischer Materialdatensatz“', JSON.stringify(optA.map(o => o[0])) === JSON.stringify(['rockwool-fixrock-035', 'rockwool-fixrock-033', 'rockwool-klemmrock-035', 'generisch']) && await p.inputValue('#produktA') === 'rockwool-fixrock-035', optA);
  await p.selectOption('#materialB', 'mineralwolle');
  check('Dasselbe Material in B: automatisch das nächste freie Produkt (Fixrock 033); in A ist Fixrock 035 dort „bereits gewählt“', await p.inputValue('#produktB') === 'rockwool-fixrock-033' && (await p.$$eval('#produktB option', o => o.find(x => x.value === 'rockwool-fixrock-035').disabled)));
  await p.selectOption('#materialB', 'kork');      // XPS hat seit Datenpaket 1 ein Produkt (JACKODUR EVO); Kork hat noch keines
  const optB = await p.$$eval('#produktB option', o => o.map(x => [x.value, x.textContent]));
  check('Material ohne Produktdaten (Kork): nur „Generischer Materialdatensatz (kein konkretes Produkt)“', optB.length === 1 && optB[0][0] === 'generisch' && /kein konkretes Produkt/.test(optB[0][1]), optB);
  await p.selectOption('#materialB', 'eps'); await p.selectOption('#produktA', 'generisch');
  await oeffne(p);
  const kopf = await p.$$eval('#ergebnis-technisch thead th', t => t.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  check('Spaltenköpfe nennen Produkt und Hersteller bzw. „generischer Materialdatensatz“', /generischer Materialdatensatz/.test(kopf[1]) && /BACHL EPS 035 WDV · BACHL/.test(kopf[2]), kopf);
  const karten = await p.$$eval('#auswahl-karten article', k => k.map(x => x.innerText.replace(/\s+/g, ' ')));
  check('Materialkarten: Produkt, Hersteller und Produktquelle (Link) bzw. „Generischer Materialdatensatz“', /Generischer Materialdatensatz \(kein konkretes Produkt\)/.test(karten[0]) && /Dämmstoffe · BACHL EPS 035 WDV/.test(karten[1]) && /Hersteller BACHL/i.test(karten[1]) && /Produktquelle BACHL EPS Fassadendämmplatte EPS 035 WDV/i.test(karten[1]), karten);
  const lam = await zeile(p, '#ergebnis-technisch', 'Nennwert λD');
  check('Generischer Mineralwolle-Datensatz (Echtdaten-Modus): λD nicht belegt, EPS-Produkt 0,034', /fehlt/.test(lam[0]) && /^0,034/.test(lam[1]), lam);
  const quellenTabelle = await p.$eval('#quellen-inhalt', e => e.innerText.replace(/\s+/g, ' '));
  check('Bereich „Quellen und Hinweise“: Abschnitt „Produkte“ nennt alle 11 Produkte mit Hersteller und Quelle', /Produkte/.test(quellenTabelle) && PR.every(pr => quellenTabelle.includes(pr.name)), quellenTabelle.slice(0, 200));

  // ================= Eigene Produkte =================
  const kontext = await b.newContext({ viewport: { width: 1280, height: 900 } });
  p = await neu(URL, kontext);
  await oeffne(p);
  await p.evaluate(() => MM.auswahlOptionen.zeigeEigenes(true));
  const fuelle = async o => { for (const [k, v] of Object.entries(o)) { if (/^ep-(material|brandverhalten|preis-einheit|mwst|umfang)$/.test(k)) await p.selectOption('#' + k, v); else await p.fill('#' + k, v); } };
  const fehler = () => p.$eval('#eigenes-produkt-box [role=alert]', e => e.innerText.replace(/\s+/g, ' '));
  await fuelle({ 'ep-material': 'eps', 'ep-name': 'Muster-EPS', 'ep-hersteller': 'Muster GmbH', 'ep-quelle': '', 'ep-link': 'http://unsicher.example', 'ep-datum': '2026-13-45', 'ep-waermeleitfaehigkeit': '0,036', 'ep-waermeleitfaehigkeit_bemessung': '0,030', 'ep-preis': 'abc' });
  await p.click('#eigenes-produkt-box button[type=submit]');
  const f1 = await fehler();
  check('Eingabeprüfung: fehlende Quelle, Link ohne https, falsches Datum, λB < λD und ungültiger Preis werden alle benannt; nichts wird gespeichert', /Quelle angeben/.test(f1) && /https:\/\//.test(f1) && /Abrufdatum/.test(f1) && /Bemessungswert λB darf nicht kleiner/.test(f1) && /Preis:/.test(f1) && await p.evaluate(() => MM.produkte.eigene().length) === 0, f1);
  await fuelle({ 'ep-name': '<img src=x onerror=window.xss=1>', 'ep-quelle': 'Datenblatt 03/2026', 'ep-link': 'https://example.org/datenblatt.pdf', 'ep-datum': '2026-11-16', 'ep-waermeleitfaehigkeit': '0,036', 'ep-waermeleitfaehigkeit_bemessung': '0,038', 'ep-brandverhalten': 'E', 'ep-preis': '99,5', 'ep-preis-einheit': '€/m³', 'ep-haendler': 'Musterhändler', 'ep-mwst': 'inkl. 19 % MwSt.', 'ep-umfang': 'Material, Händlerpreis (ohne Transport und Einbau)' });
  await p.click('#eigenes-produkt-box button[type=submit]');
  const eig = await p.evaluate(() => MM.produkte.eigene());
  check('Gültiges eigenes Produkt wird gespeichert (nur im Browser); der Name mit HTML wird als Text behandelt, es wird nichts ausgeführt', eig.length === 1 && eig[0].material === 'eps' && eig[0].werte.waermeleitfaehigkeit === 0.036 && eig[0].werte.preis.wert === 99.5 && await p.evaluate(() => window.xss === undefined) && (await p.$eval('#eigenes-produkt-box', e => e.innerText)).includes('<img src=x onerror=window.xss=1>'), eig);
  await p.selectOption('#kategorie', 'daemmstoff'); await p.selectOption('#materialA', 'eps');
  const optE = await p.$$eval('#produktA option', o => o.map(x => x.textContent));
  check('Das eigene Produkt erscheint in der Produktliste des Materials, als „eigenes Produkt“ gekennzeichnet', optE.some(t => /eigenes Produkt/.test(t)), optE);
  const eigId = eig[0].id;
  await setze(p, { a: 'eps', pa: eigId, b: 'mineralwolle', c: '' }); await eingabe(p, 100, 10); await oeffne(p);
  const lam2 = await zeile(p, '#ergebnis-technisch', 'Nennwert λD');
  const marke = await p.$$eval('#ergebnis-technisch td .art-eigen', m => m.map(x => [x.textContent, x.title, x.getAttribute('role')]));
  check('Werte des eigenen Produkts: λD 0,036 mit Marke „E“ (Eigene Angabe, nicht geprüft), Screenreader-Beschriftung', /^0,036/.test(lam2[0]) && marke.length >= 2 && marke.every(m => m[0] === 'E' && /nicht geprüft/.test(m[1]) && m[2] === 'img'), [lam2, marke]);
  const rEig = await zeile(p, '#rechnung-r', 'R = d');
  check('R-Wert des eigenen Produkts mit seinem Bemessungswert: 0,10 / 0,038 = 2,63', /^2,63/.test(rEig[0]), rEig);
  const kEig = await zeile(p, '#rechnung-kosten', 'Materialkosten');
  check('Kosten des eigenen Produkts: 10 m³ × 99,50 = 995 €', /^995/.test(kEig[0]), kEig);
  const orient = await p.$eval('#orientierung', e => e.textContent);
  check('Orientierungshinweis nennt eigene Angaben („E … nicht geprüft“, keine verlässliche Produkt- oder Kostenberechnung)', /Eigene Angaben: Mit E gekennzeichnete Werte stammen von Ihnen und sind nicht geprüft/.test(orient), orient);
  const quelleEig = await p.$$eval('#ergebnis-technisch .fn-source', f => f.map(x => x.textContent));
  check('Die Quelle des eigenen Produkts wird angezeigt (Titel, Händler/Quelle, Abrufdatum, „Eigene Angabe der Nutzer:in (nicht geprüft)“)', quelleEig.some(t => /Datenblatt 03\/2026/.test(t) && /Eigene Angabe der Nutzer:in \(nicht geprüft\)/.test(t) && /2026-11-16/.test(t)), quelleEig);
  const csv = await p.evaluate(() => MM.exportieren.baueCsv({ daten: MATERIALMATCH_DATA, plaetze: MM.auswahl.holeAuswahl().plaetze, eingaben: MM.eingaben.hole(), modus: MM.datenmodus.name(), anwendung: 'Wärmedämmung', prioritaet: 'x', empfehlung: null, datum: new Date() }));
  check('CSV: Zeilen „Produkt A“ (mit „eigenes Produkt, nicht geprüft“ und Hersteller) und Datenart „Eigene Angabe (nicht geprüft)“', /Produkt A;[^\n]*eigenes Produkt, nicht geprüft/.test(csv) && /Hersteller: Muster GmbH/.test(csv) && /Eigene Angabe \(nicht geprüft\)/.test(csv), csv.split('\n').filter(z => /Produkt A|Eigene Angabe/.test(z)).slice(0, 3));
  const emp = await p.evaluate(() => { const a = MM.auswahl.holeAuswahl().plaetze[0].material; const r = MM.empfehlung.empfehle(MATERIALMATCH_DATA, a.id, null, 'ausgewogen', a); return { ref: r.referenz.produktAktiv && r.referenz.produktAktiv.name, n: r.empfehlungen.length }; });
  check('Empfehlung nutzt für Material A die Werte des gewählten Produkts (nicht des Standardprodukts)', /<img/.test(emp.ref || ''), emp);
  const w1 = await p.evaluate(() => MM.pruefeDaten(MATERIALMATCH_DATA));
  const gruppenTitel = await p.$$eval('#quellen-inhalt details > summary', t => t.map(x => x.textContent));
  check('Eigene Produkte stören die Datenprüfung nicht (0 Fehler); ihre Quelle steht in einer eigenen Gruppe „Eigene Produkte (Angaben der Nutzer:in, nicht geprüft)“, nicht unter den geprüften Quellen', w1.fehler.length === 0 && gruppenTitel.some(t => /^Eigene Produkte \(Angaben der Nutzer:in, nicht geprüft\) \(1\)/.test(t)) && gruppenTitel.some(t => /^Quellen der Kennwerte \(\d+\)/.test(t)), gruppenTitel);
  // Dauerhaft: Seite neu laden → Produkt noch da; löschen entfernt es
  await p.reload(); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
  const nachReload = await p.evaluate(() => MM.produkte.eigene().length);
  check('Nach dem Neuladen der Seite ist das eigene Produkt noch da (localStorage)', nachReload === 1, nachReload);
  await oeffne(p);
  await p.evaluate(() => MM.auswahlOptionen.zeigeEigenes(true));
  await p.click('#eigenes-produkt-box button:has-text("Löschen")');
  check('Löschen entfernt das Produkt aus Liste und Speicher; die Seite funktioniert weiter', await p.evaluate(() => MM.produkte.eigene().length) === 0 && await p.evaluate(() => JSON.parse(localStorage.getItem('materialmatch.eigeneProdukte.v1')).length) === 0);
  // eigenes Produkt mit Rohdichte ohne CO₂: CO₂ des generischen Datensatzes darf nicht stehen bleiben
  const r2 = await p.evaluate(() => { const r = MM.produkte.eigenesErgaenzen({ material: 'holzfaserdaemmung', name: 'Dichte-Test', hersteller: 'X', quelle: { titel: 'Datenblatt', url: '', haendler: '', abgerufen: '2026-11-16' }, werte: { rohdichte: '55' } }); const m = MM.produkte.wirksam('holzfaserdaemmung', r.produkt.id); return { ok: r.ok, gwp: m.eigenschaften.gwp.werte, hinweis: m.eigenschaften.gwp.hinweis, rho: m.eigenschaften.rohdichte.wert }; });
  check('Eigene Rohdichte (55 statt 160 kg/m³) ohne eigenen CO₂-Wert: der generische CO₂-Kennwert wird nicht übernommen („nicht verfügbar“ mit Begründung)', r2.ok && r2.gwp === null && /gilt für eine Rohdichte von 160/.test(r2.hinweis) && r2.rho === 55, r2);

  // ================= Zellulose: kein ausländischer Wert als deutscher Bemessungswert =================
  p = await neu();
  await setze(p, { a: 'zellulose', b: 'mineralwolle', c: '' }); await eingabe(p, 100, 20); await oeffne(p);
  const zb = await zeile(p, '#ergebnis-technisch', 'Bemessungswert λB');
  const zr = await zeile(p, '#rechnung-r', 'Für R verwendet');
  const zhinweis = await p.$$eval('#ergebnis-technisch .footnotes li', l => l.map(x => x.textContent).join(' '));
  check('Zellulose: Bemessungswert leer („fehlt“), R-Wert nur mit dem Nennwert 0,037 „orientierend“; Fußnote erklärt, warum weder 0,038 (Österreich), 0,037 (Schweiz) noch der Herstellerwert 0,039 übernommen wurde', /fehlt/.test(zb[0]) && /Nennwert λD, orientierend/.test(zr[0]) && /Z-23\.11-1236/.test(zhinweis) && /0,039/.test(zhinweis), [zb, zr]);

  // ================= Prüfprogramm für Produkte (Mutationstests) =================
  const mut = await p.evaluate(() => {
    const klon = x => JSON.parse(JSON.stringify(x));
    const lauf = (aendere) => { const d = klon(MATERIALMATCH_DATA); const saved = window.MATERIALMATCH_PRODUKTE; window.MATERIALMATCH_PRODUKTE = klon(saved); try { aendere(d, window.MATERIALMATCH_PRODUKTE); return MM.pruefeDaten(d); } finally { window.MATERIALMATCH_PRODUKTE = saved; } };
    const pr = (l, id) => l.find(x => x.id === id);
    return {
      ok: MM.pruefeDaten(MATERIALMATCH_DATA).fehler.length,
      material: lauf((d, l) => { pr(l, 'saglan-sr30').material = 'gibtsnicht'; }).fehler.length,
      quelle: lauf((d, l) => { pr(l, 'saglan-sr30').eigenschaften.waermeleitfaehigkeit.quelle = 'gibtsnicht'; }).fehler.length,
      ungeprueft: lauf((d, l) => { d.quellen.find(q => q.id === 'hersteller-sager-saglan-sr30').geprueft = false; }).fehler.length,
      art: lauf((d, l) => { pr(l, 'saglan-sr30').eigenschaften.waermeleitfaehigkeit.art = 'beispiel'; }).fehler.length,
      preisOhneMwst: lauf((d, l) => { delete pr(l, 'steico-flex-036').eigenschaften.preis.mwst; }).fehler.length,
      preisFalscheQuelle: lauf((d, l) => { pr(l, 'steico-flex-036').eigenschaften.preis.quelle = 'hersteller-steico-flex-036'; }).fehler.length,
      zweiStandard: lauf((d, l) => { pr(l, 'rockwool-fixrock-033').standard = true; }).fehler.length,
      einheit: lauf((d, l) => { pr(l, 'saglan-sr30').eigenschaften.waermeleitfaehigkeit.einheit = 'W/m'; }).fehler.length,
      fremdeEigenschaft: lauf((d, l) => { pr(l, 'saglan-sr30').eigenschaften.vorteile = { wert: 1 }; }).fehler.length
    };
  });
  check('Prüfprogramm erkennt jede Manipulation der Produktdaten (unbekanntes Material, fehlende Quelle, nicht geprüfte Quelle, Datenart „beispiel“, Preis ohne Mehrwertsteuer, Preis ohne Händlerquelle, zwei Standardprodukte, falsche Einheit, unzulässige Eigenschaft); die echten Daten haben 0 Fehler', mut.ok === 0 && Object.entries(mut).filter(([k]) => k !== 'ok').every(([, v]) => v >= 1), mut);

  check('Keine Konsolenfehler', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
