/* Runde 4 (17.11.2026)
   a  Herstellerangabe (ISOCELL 0,039): getrennt angezeigt, nie in Berechnungen; Prüfprogramm erzwingt Quelle und Hinweistext
   b  Strukturierte Preisangabe: Umrechnung nachgerechnet, Prüfprogramm erkennt Fehler
   d  Runde 5: Preisliste Profibaustoffe (Österreich), EGGER-Leistungserklärung, Siniat-Datenblatt
   c  Neue Produkte: Holcim Beton (Preisliste, netto), Ytong PP 2-0,40 / PP 2-0,35, Poroton T8-36,5, KVH (EPD)
   Aufruf:  node tests/test28.js */
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

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async () => { const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); const pg = await c.newPage(); pg.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); pg.on('pageerror', e => errors.push(String(e))); await pg.goto(URL); await pg.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; }); await pg.waitForTimeout(300); return pg; };
  const oeffne = pg => pg.$$eval('details', d => d.forEach(x => { x.open = true; }));
  const setze = (pg, o) => pg.evaluate(o => MM.auswahl.setzeAuswahl(o), o);
  const eingabe = async (pg, f, d) => { await pg.fill('#flaeche', String(f)); await pg.fill('#dicke', String(d)); };
  const zeile = (pg, sel, label) => pg.evaluate(([sel, label]) => { const r = [...document.querySelectorAll(sel + ' table tr')].find(x => x.cells[0].textContent.startsWith(label)); return r ? [...r.cells].slice(1).map(c => c.textContent.replace(/\s+/g, ' ').trim()) : null; }, [sel, label]);

  // ================= a) Herstellerangabe ISOCELL =================
  const iso = prod('isocell-zellulose');
  const ha = (iso.herstellerangaben || [])[0];
  check('ISOCELL: Bemessungswert-Feld bleibt leer; 0,039 steht nur als Herstellerangabe mit verlinkter Quelle und dem Hinweis „kein bestätigter Bemessungswert für Deutschland“',
    iso.eigenschaften.waermeleitfaehigkeit_bemessung.wert === null && ha && ha.wert === '0,039' && /Herstellerangabe/.test(ha.hinweis) && /kein bestätigter Bemessungswert/.test(ha.hinweis) && /^https:\/\//.test(qu(ha.quelle).url), ha);

  let p = await neu();
  await oeffne(p);
  await setze(p, { a: 'zellulose', b: 'mineralwolle', pb: 'rockwool-fixrock-035', c: '' });
  await eingabe(p, 100, 20);
  const zr = await zeile(p, '#rechnung-r', 'R = d / λ');
  const zv = await zeile(p, '#rechnung-r', 'Für R verwendet');
  const zh = await zeile(p, '#ergebnis-technisch', 'Herstellerangabe');
  check('R-Wert Zellulose 20 cm = 0,20 ÷ 0,037 = 5,41 (Nennwert, orientierend), nicht 0,20 ÷ 0,039 = 5,13: die Herstellerangabe fließt nicht ein', zr && /5,41/.test(zr[0]) && !/5,13/.test(zr[0]) && /orientierend/.test(zv[0]), [zr, zv]);
  check('Zeile „Herstellerangabe (nicht bestätigt, nicht in Berechnungen)“ zeigt 0,039 nur bei Zellulose, für Mineralwolle „–“ bzw. leer', zh && /0,039/.test(zh[0]) && !/0,039/.test(zh[1] || ''), zh);
  const karte = await p.evaluate(() => document.body.innerText);
  check('Kein Platz zeigt 0,039 als Bemessungswert: die Zeile „Bemessungswert“ der Zellulose ist „fehlt“', (await zeile(p, '#ergebnis-technisch', 'Bemessungswert'))[0].startsWith('fehlt') || /fehlt/.test((await zeile(p, '#ergebnis-technisch', 'Bemessungswert'))[0]), karte.length);

  // ================= b) Prüfprogramm: Preisangabe und Herstellerangabe =================
  const mut = await p.evaluate(() => {
    const klon = x => JSON.parse(JSON.stringify(x));
    const lauf = (aendere) => { const d = klon(MATERIALMATCH_DATA); const saved = window.MATERIALMATCH_PRODUKTE; window.MATERIALMATCH_PRODUKTE = klon(saved); try { aendere(d, window.MATERIALMATCH_PRODUKTE); return MM.pruefeDaten(d); } finally { window.MATERIALMATCH_PRODUKTE = saved; } };
    const pr = (l, id) => l.find(x => x.id === id);
    const qq = (d, id) => d.quellen.find(q => q.id === id);
    return {
      ok: MM.pruefeDaten(MATERIALMATCH_DATA).fehler.length,
      umrechnung: lauf((d, l) => { qq(d, 'preis-obi-steico-flex-036-100').preisangabe.umrechnung.dicke_m = 0.12; }).fehler.length,
      preisFalsch: lauf((d, l) => { pr(l, 'steico-flex-036').eigenschaften.preis.wert = 99; }).fehler.length,
      statusOhneHinweis: lauf((d, l) => { pr(l, 'holcim-beton-c25-30-na4334').eigenschaften.preis.hinweis = 'Preis netto.'; }).fehler.length,
      preislisteAlsHaendler: lauf((d, l) => { qq(d, 'preisliste-holcim-west-2026-na4334').quellenart = 'Herstellerdatenblatt'; }).fehler.length,
      preisangabeFehlt: lauf((d, l) => { delete qq(d, 'preisliste-xella-ytong-pp2-035-365').preisangabe; }).fehler.length,
      regionFehlt: lauf((d, l) => { delete qq(d, 'preisliste-xella-ytong-pp2-035-365').preisangabe.region; }).fehler.length,
      herstellerangabeOhneHinweis: lauf((d, l) => { pr(l, 'isocell-zellulose').herstellerangaben[0].hinweis = 'Bemessungswert Deutschland.'; }).fehler.length,
      herstellerangabeOhneQuelle: lauf((d, l) => { pr(l, 'isocell-zellulose').herstellerangaben[0].quelle = 'gibtsnicht'; }).fehler.length,
      herstellerangabeAlsKennwert: lauf((d, l) => { pr(l, 'isocell-zellulose').eigenschaften.herstellerangabe = { wert: 0.039 }; }).fehler.length
    };
  });
  check('Prüfprogramm: unveränderte Daten ohne Fehler', mut.ok === 0, mut);
  check('Prüfprogramm erkennt: falsche Umrechnung der Preisangabe, falschen Preis, Preisliste ohne Hinweis „Preisliste/nicht aktuell“, Preisliste mit falscher Quellenart, fehlende Preisangabe oder Region, Herstellerangabe ohne Hinweistext oder Quelle, Herstellerangabe als Kennwert',
    mut.umrechnung > 0 && mut.preisFalsch > 0 && mut.statusOhneHinweis > 0 && mut.preislisteAlsHaendler > 0 && mut.preisangabeFehlt > 0 && mut.regionFehlt > 0 && mut.herstellerangabeOhneHinweis > 0 && mut.herstellerangabeOhneQuelle > 0 && mut.herstellerangabeAlsKennwert > 0, mut);

  // ================= c) Neue Produkte =================
  const hb = prod('holcim-beton-c25-30-na4334').eigenschaften.preis, hq = qu(hb.quelle);
  check('Holcim Beton: 204,50 €/m³ netto, Quelle „Preisliste“ mit Herausgeber, Produkt, Region, Gültigkeit ab 2026-01-01, Link, Abrufdatum 2026-11-17, Status „preisliste“', hb.wert === 204.5 && hb.mwst === 'exkl. MwSt.' && /^Preisliste/.test(hq.quellenart) && /Holcim/.test(hq.herausgeber) && hq.datum === '2026-01-01' && hq.abgerufen === '2026-11-17' && /^https:\/\/www\.holcim\.de\//.test(hq.url) && hq.preisangabe.status === 'preisliste' && hq.preisangabe.region && hq.preisangabe.variante, hq);
  const yp = prod('ytong-pp2-035-thermstandard-365').eigenschaften;
  check('Ytong PP 2-0,35 (365 mm): 210,60 €/m³ netto (Frankopreis), λ 0,09, Rohdichte und CO₂ „nicht verfügbar“ (Klasse 0,35 passt nicht zum generischen Datensatz), Bemessungswert leer', yp.preis.wert === 210.6 && yp.preis.mwst === 'exkl. MwSt.' && yp.preis.bezugsdicke_m === 0.365 && yp.waermeleitfaehigkeit.wert === 0.09 && yp.rohdichte.wert === null && yp.gwp.werte === null && yp.waermeleitfaehigkeit_bemessung.wert === null, yp);
  const y4 = prod('ytong-pp2-040').eigenschaften;
  check('Ytong PP 2-0,40: λ 0,10, kein Preis (steht nicht in der Preisliste) – das Produkt hat keinen Preis-Eintrag', y4.waermeleitfaehigkeit.wert === 0.1 && !y4.preis && y4.waermeleitfaehigkeit_bemessung.wert === null);
  const po = prod('poroton-planziegel-t8-365').eigenschaften;
  check('Poroton-Planziegel-T8-36,5: λR 0,08 (Bemessungswert nicht übernommen), kein Preis', po.waermeleitfaehigkeit.wert === 0.08 && po.waermeleitfaehigkeit_bemessung.wert === null && !po.preis);
  const kv = prod('kvh-epd-2026').eigenschaften.gwp;
  check('KVH-EPD: CO₂ je 1 m³ (A1–A3) = Summe der Module: gesamt −748 + 16,4 + 149 = −582,6; fossil 23,5 + 16,4 + 149 = 188,9; biogen −771 + 0,0709 + 0,0936 = −770,84; Rohdichte 480', Math.abs(kv.werte.gesamt - (-748 + 16.4 + 149)) < 1e-9 && Math.abs(kv.werte.fossil - (23.5 + 16.4 + 149)) < 1e-9 && Math.abs(kv.werte.biogen - (-771 + 0.0709 + 0.0936)) < 0.01 && kv.deklarierte_einheit === '1 m³' && prod('kvh-epd-2026').eigenschaften.rohdichte.wert === 480, kv);

  // Anwendung: Beton (Holcim, netto) gegen Holzfaser (OBI, brutto)
  await setze(p, { a: 'normalbeton', b: 'holzfaserdaemmung', pb: 'steico-flex-036', c: '' });
  await eingabe(p, 100, 10);
  const pz = await zeile(p, '#rechnung-kosten', 'Einheitspreis');
  const kz = await zeile(p, '#rechnung-kosten', 'Materialkosten');
  const wz = await p.$$eval('#rechnung-kosten .warn', w => w.map(x => x.textContent));
  check('Beton (Holcim 204,50 netto) und STEICOflex (OBI 112,88 inkl. MwSt.): Preise werden angezeigt, aber der Vergleich bekommt den Vorbehalt „Mehrwertsteuer“ (netto gegen brutto)', /^205/.test(pz[0]) && wz.some(w => /Mehrwertsteuer/.test(w)), [pz, kz, wz]);
  const fn = await p.$$eval('#rechnung-kosten .fn-source', f => f.map(x => x.textContent));
  check('Fußnote zum Holcim-Preis nennt Herausgeber, Status „Preisliste“/„NICHT AKTUELL BESTÄTIGT“ und Region', fn.some(t => /Holcim/.test(t) && /Status: Preisliste/.test(t) && /NICHT AKTUELL BESTÄTIGT/.test(t) && /Region: Preisliste Bereich West/.test(t)), fn);

  await setze(p, { a: 'hochlochziegel', b: 'porenbeton', pb: 'ytong-pp2-035-thermstandard-365', c: '' });
  await eingabe(p, 100, 36.5);
  const rz = await zeile(p, '#rechnung-r', 'R = d / λ');
  const rv = await zeile(p, '#rechnung-r', 'Für R verwendet');
  check('R-Wert Poroton 36,5 cm = 0,365 ÷ 0,08 = 4,56 und Ytong PP 2-0,35 365 mm = 0,365 ÷ 0,09 = 4,06, beide „Nennwert λD, orientierend“ (kein Bemessungswert)', rz && /4,56/.test(rz[0]) && /4,06/.test(rz[1]) && /orientierend/.test(rv[0]) && /orientierend/.test(rv[1]), [rz, rv]);
  const kz2 = await zeile(p, '#rechnung-kosten', 'Einheitspreis');
  check('Poroton ohne Preis: „Preis nicht verfügbar“; Ytong 0,35 zeigt 211 €/m³ (210,60 netto)', kz2[0].startsWith('Preis nicht verfügbar') && /^211/.test(kz2[1]), kz2);

  // ================= d) Runde 5: Profibaustoffe (Österreich), EGGER, Siniat =================
  const pbIds = [['profibaustoffe-estrich-ct-c20-f4', 229.35, 20, 458.7, 124, 122], ['profibaustoffe-mz1', 467.85, 14, 654.99, 27, 25], ['profibaustoffe-fliessbeton-dc25-30', 415.85, 20, 831.7, 160, 158]];
  check('Profibaustoffe: drei Preise, nie Standardprodukt; Preis im Dokument in €/t netto, Verbrauch laut Liste, Umrechnung €/t × Verbrauch ÷ 10 = €/m³ nachgerechnet', pbIds.every(([id, pt, v, m3]) => { const pr = prod(id), e = pr.eigenschaften.preis, pa = qu(e.quelle).preisangabe; return !pr.standard && pa.preis === pt && pa.einheit === '€/t' && pa.umrechnung.art === 'tonne_verbrauch' && pa.umrechnung.verbrauch_kg_m2_cm === v && Math.abs(pt * v / 10 - m3) < 0.005 && e.wert === m3 && e.einheit === '€/m³'; }), pbIds.map(x => prod(x[0]).eigenschaften.preis.wert));
  check('Profibaustoffe: Quelle nennt Region Österreich („nicht Deutschland“), exkl. MwSt., Status „preisliste“, Gültigkeit ab 2026-01-01, PDF-Seite und gedruckte Seite, direkten Link, Abrufdatum; die Region steht auch im Hinweis des Preises', pbIds.every(([id, , , , seite, gedr]) => { const e = prod(id).eigenschaften.preis, q = qu(e.quelle); return /Österreich/.test(q.region) && /nicht Deutschland|kein Preis für den deutschen Markt/.test(q.region + q.preisangabe.region) && e.mwst === 'exkl. MwSt.' && q.preisangabe.status === 'preisliste' && q.datum === '2026-01-01' && q.titel.includes('PDF-Seite ' + seite + ' (gedruckte Seite ' + gedr + ')') && q.url === 'https://www.profibaustoffe.com/wp-content/uploads/Profibaustoffe-Preisliste_2026_web.pdf' && q.abgerufen === '2026-11-17' && /Österreich/.test(e.hinweis) && /Kein deutscher Marktpreis/.test(e.hinweis); }));
  const eo = prod('egger-osb3-top').eigenschaften, eq = qu('dop-egger-osb3-top-734-04');
  check('EGGER OSB 3 TOP (Standard): Leistungserklärung DOP-734-04 vom 2026-06-23 – Rohdichte 600 (Mindestwert), λ 0,13 (kein Bemessungswert), Brandverhalten E; kein Preis', eo.rohdichte.wert === 600 && /Mindest/.test(eo.rohdichte.hinweis) && eo.waermeleitfaehigkeit.wert === 0.13 && eo.waermeleitfaehigkeit_bemessung.wert === null && eo.brandverhalten.wert === 'E' && !eo.preis && eq.datum === '2026-06-23' && /^https:\/\/binary\.egger\.link\//.test(eq.url) && prod('egger-osb3-top').standard === true, eo);
  const sl = prod('siniat-lagyp-125'), sq = qu('hersteller-siniat-lagyp-at-2026');
  check('Siniat LaGyp: österreichisches Datenblatt (Stand April 2026), λR 0,21, μ 10, A2-s1,d0; Region Österreich „für Deutschland nicht bestätigt“, nicht Standard, kein Preis, keine Rohdichte', sl.eigenschaften.waermeleitfaehigkeit.wert === 0.21 && sl.eigenschaften.wasserdampf_mu.wert === 10 && sl.eigenschaften.brandverhalten.wert === 'A2-s1,d0' && /Österreich/.test(sq.region) && /nicht bestätigt/.test(sq.region) && !sl.standard && !sl.eigenschaften.preis && !sl.eigenschaften.rohdichte && /April 2026/.test(sq.datum_hinweis));
  const mut2 = await p.evaluate(() => {
    const klon = x => JSON.parse(JSON.stringify(x));
    const lauf = (aendere) => { const d = klon(MATERIALMATCH_DATA); const saved = window.MATERIALMATCH_PRODUKTE; window.MATERIALMATCH_PRODUKTE = klon(saved); try { aendere(d, window.MATERIALMATCH_PRODUKTE); return MM.pruefeDaten(d); } finally { window.MATERIALMATCH_PRODUKTE = saved; } };
    const qq = (d, id) => d.quellen.find(q => q.id === id);
    return {
      verbrauch: lauf((d) => { qq(d, 'preisliste-profibaustoffe-2026-mz1').preisangabe.umrechnung.verbrauch_kg_m2_cm = 12; }).fehler.length,
      einheit: lauf((d) => { qq(d, 'preisliste-profibaustoffe-2026-mz1').preisangabe.einheit = '€/kg'; }).fehler.length,
      verbrauchFehlt: lauf((d) => { delete qq(d, 'preisliste-profibaustoffe-2026-mz1').preisangabe.umrechnung.verbrauch_kg_m2_cm; }).fehler.length
    };
  });
  check('Prüfprogramm erkennt eine falsche, fehlende oder zur Einheit nicht passende Umrechnung €/t → €/m³', mut2.verbrauch > 0 && mut2.einheit > 0 && mut2.verbrauchFehlt > 0, mut2);
  await setze(p, { a: 'zementestrich', pa: 'profibaustoffe-estrich-ct-c20-f4', b: 'normalbeton', pb: 'holcim-beton-c25-30-na4334', c: '' });
  await eingabe(p, 100, 5);
  const fnAt = await p.$$eval('#rechnung-kosten .fn-source', f => f.map(x => x.textContent.replace(/\s+/g, ' ')));
  const pzAt = await zeile(p, '#rechnung-kosten', 'Einheitspreis');
  check('Anzeige: der Österreich-Preis zeigt 459 €/m³ mit Fußnote „Österreich … nicht Deutschland“, „exkl. MwSt.“, „NICHT AKTUELL BESTÄTIGT“, PDF-Seite 124 (gedruckte Seite 122)', /^459 €\/m³/.test(pzAt[0]) && fnAt.some(t => /Österreich/.test(t) && /nicht Deutschland/.test(t) && /exkl\. MwSt\./.test(t) && /NICHT AKTUELL BESTÄTIGT/.test(t) && /PDF-Seite 124 \(gedruckte Seite 122\)/.test(t)), [pzAt, fnAt.map(t => t.slice(0, 120))]);

  check('Keine Konsolenfehler', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
