/* MaterialMatch 3.3 (18.11.2026): Händlerpreisspannen (bausep.de), Feld „echt“ (nur im Echtdaten-Modus), Demo-Neutralität
   Aufruf:  node tests/test51.js */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');
const fs = require('fs');
const vm = require('vm');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 600))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html';
const ctx = { window: {} }; vm.createContext(ctx);
for (const f of ['baustoffe', 'produkte']) vm.runInContext(fs.readFileSync(path.join(PROJ, 'data', f + '.js'), 'utf8'), ctx);
const DB = ctx.window.MATERIALMATCH_DATA;
const mat = id => DB.baustoffe.find(m => m.id === id);
const median = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const nah = (a, b, t = 0.011) => typeof a === 'number' && Math.abs(a - b) <= t;

const QUELLEN = DB.quellen.filter(q => /^haendlerspanne-bausep-/.test(q.id));
const MIT_BEISPIEL = ['osb', 'konstruktionsvollholz', 'porenbeton', 'mineralwolle', 'eps', 'holzfaserdaemmung'];
const MIT_LUECKE = ['xps', 'pur', 'pir', 'glaswolle', 'steinwolle', 'schaumglas', 'gipsfaserplatte', 'bitumenbahn'];

(async () => {
  // ---------- 1. Rohdaten: jede Spanne lässt sich aus den Einzelpreisen nachrechnen ----------
  check('14 Händlerspannen von bausep.de stehen in den Quellen (6 zu Beispielpreisen, 8 zu Lücken)', QUELLEN.length === 14 && QUELLEN.length === MIT_BEISPIEL.length + MIT_LUECKE.length, QUELLEN.map(q => q.id));
  let alleOk = true; const abw = [];
  QUELLEN.forEach(q => {
    const id = q.id.replace('haendlerspanne-bausep-', '');
    const e = mat(id).eigenschaften.preis;
    const p = e.echt || e;
    const werte = []; q.einzelpreise.forEach(x => x.punkte.forEach(pt => werte.push(pt.eur_m3 !== undefined ? pt.eur_m3 : pt.eur_m2)));
    const s = p.spanne;
    const ok = s && p.quelle === q.id && p.art === 'richtwert' && nah(s.min, Math.min(...werte)) && nah(s.max, Math.max(...werte)) && nah(p.wert, median(q.einzelpreise.map(x => median(x.punkte.map(pt => pt.eur_m3 !== undefined ? pt.eur_m3 : pt.eur_m2))))) && s.punkte === werte.length && s.anzahl === q.einzelpreise.length && s.mittel === 'Median';
    if (!ok) { alleOk = false; abw.push([id, s, p.wert]); }
  });
  check('Alle 14 Preisspannen (Minimum, Maximum, Median der Produkt-Mediane, Zahl der Preise und Produkte) sind aus den Einzelpreisen der Quelle nachgerechnet', alleOk, abw);
  let umrechnungOk = true; const uabw = [];
  QUELLEN.forEach(q => q.einzelpreise.forEach(x => x.punkte.forEach(pt => {
    const m = /(\d+(?:[.,]\d+)?)\s*mm/.exec(pt.variante || '');
    if (pt.eur_m3 !== undefined && m && pt.netto_je_m2 !== undefined) {
      const d = parseFloat(m[1].replace(',', '.')) / 1000;
      if (Math.abs(pt.netto_je_m2 / d - pt.eur_m3) > 0.011 * Math.max(1, pt.eur_m3 / 100)) { umrechnungOk = false; if (uabw.length < 3) uabw.push([q.id, pt]); }
    }
  })));
  check('Umrechnung €/m³ = Netto-Preis je m² ÷ Dicke stimmt für jeden Einzelpreis (Dicke aus der Variante)', umrechnungOk, uabw);
  check('Jeder Einzelpreis nennt Produkt und https-Link; die Quelle nennt Abrufdatum 2026-11-18 und „kein Marktpreis“', QUELLEN.every(q => q.abgerufen === '2026-11-18' && /kein Marktpreis/.test(q.qualitaet) && q.einzelpreise.every(x => x.produkt && /^https:\/\/www\.bausep\.de\//.test(x.url))));
  check('Alle Spannen sind netto (exkl. MwSt.), Richtwert, ohne Versand, Einbau und Verschnitt; „Preisspanne, kein einzelner Marktpreis“ im Hinweis', QUELLEN.every(q => { const p = mat(q.id.replace('haendlerspanne-bausep-', '')).eigenschaften.preis; const x = p.echt || p; return x.mwst === 'exkl. MwSt.' && /ohne Versand, Einbau und Verschnitt/.test(x.umfang) && /Preisspanne, kein einzelner Marktpreis/.test(x.hinweis); }));
  check('Gipsfaserplatte und Bitumenbahn: Preis in €/m² (nicht in €/m³ umgerechnet), die übrigen 12 in €/m³', ['gipsfaserplatte', 'bitumenbahn'].every(id => mat(id).eigenschaften.preis.echt.einheit === '€/m²') && QUELLEN.length - 2 === QUELLEN.filter(q => { const x = mat(q.id.replace('haendlerspanne-bausep-', '')).eigenschaften.preis; return (x.echt || x).einheit === '€/m³'; }).length);

  // ---------- 2. Struktur des Feldes „echt“ ----------
  check('Die 6 Beispielpreise tragen „echt“ (Datenart bleibt „beispiel“), die 8 bisherigen Lücken ebenfalls (Wert bleibt leer)',
    MIT_BEISPIEL.every(id => { const e = mat(id).eigenschaften.preis; return e.art === 'beispiel' && e.echt && e.echt.art === 'richtwert'; }) &&
    MIT_LUECKE.every(id => { const e = mat(id).eigenschaften.preis; return e.wert === null && e.art === null && e.echt && e.echt.art === 'richtwert'; }));

  const b = await chromium.launch();
  const errors = [];
  const neu = async modus => { const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await c.newPage(); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); await p.goto(URL + '?modus=' + modus); await p.waitForTimeout(300); return p; };
  const preise = (p) => p.evaluate(([a, c]) => { const o = {}; a.concat(c).forEach(id => { const e = MATERIALMATCH_DATA.baustoffe.find(m => m.id === id).eigenschaften.preis; o[id] = { wert: e.wert, art: e.art, quelle: e.quelle, spanne: !!e.spanne, echt: e.echt !== undefined, aus: e.ausgeblendet || null }; }); return o; }, [MIT_BEISPIEL, MIT_LUECKE]);

  // ---------- 3. Echtdaten-Modus ----------
  const echt = await neu('echt');
  const pe = await preise(echt);
  check('Echtdaten-Modus: alle 14 Materialien haben den belegten Median als Preis (Datenart Richtwert, Quelle bausep, Spanne vorhanden), nichts „ausgeblendet“',
    [...MIT_BEISPIEL, ...MIT_LUECKE].every(id => pe[id].art === 'richtwert' && pe[id].quelle === 'haendlerspanne-bausep-' + id && pe[id].spanne && pe[id].aus === null && nah(pe[id].wert, (mat(id).eigenschaften.preis.echt).wert)), pe);
  const andere = await echt.evaluate(() => MATERIALMATCH_DATA.baustoffe.filter(m => m.eigenschaften.preis.art === 'beispiel').length);
  check('Echtdaten-Modus: kein Preis hat mehr die Datenart „Beispiel“', andere === 0, andere);
  await echt.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'xps', b: 'glaswolle', c: 'zellulose' }));
  await echt.fill('#flaeche', '100'); await echt.fill('#dicke', '20');
  const kosten = await echt.evaluate(() => [...[...document.querySelectorAll('#rechnung-kosten table tr')].find(t => t.cells[0].textContent.startsWith('Materialkosten')).cells].slice(1).map(c => c.textContent.trim()));
  check('Echtdaten-Modus: Kosten für 100 m² × 20 cm = 20 m³: XPS 20 × 178,47 = 3.569 €, Glaswolle 20 × 84,03 = 1.681 €, Zellulose (ohne belegten Preis) „nicht berechenbar“',
    /^3\.569/.test(kosten[0]) && /^1\.681/.test(kosten[1]) && kosten[2] === 'nicht berechenbar', kosten);
  const preisZelle = await echt.evaluate(() => document.querySelector('#alternativen, body').innerText.length > 0);
  check('Seite läuft ohne Konsolenfehler im Echtdaten-Modus', preisZelle && errors.length === 0, errors);

  // ---------- 4. Demo-Modus: unverändert ----------
  const demo = await neu('demo');
  const pd = await preise(demo);
  check('Demo-Modus: die 8 bisherigen Lücken bleiben leer (keine neuen Demo-Zahlen), die 6 Beispielpreise bleiben die Beispielwerte',
    MIT_LUECKE.every(id => pd[id].wert === null && pd[id].art === null) && MIT_BEISPIEL.every(id => pd[id].art === 'beispiel' && pd[id].wert === mat(id).eigenschaften.preis.wert && pd[id].quelle === null), pd);
  await demo.click('#modus-schalter');
  const pw = await preise(demo);
  check('Schalter Demo → Echtdaten: die Preise wechseln zu den belegten Spannen (Beispielwerte und Lücken verschwinden)', JSON.stringify(pw) !== JSON.stringify(pd));
  await demo.click('#modus-schalter');
  const pz = await preise(demo);
  check('… und nach dem zweiten Umschalten wieder identisch mit dem Anfangszustand', JSON.stringify(pz) === JSON.stringify(pd));
  check('Keine Konsolenfehler im Demo-Lauf', errors.length === 0, errors);

  // ---------- 5. Match-Funktion nutzt die belegten Preise nur im Echtdaten-Modus ----------
  const mm = (p) => p.evaluate(() => { const r = MM.matching.berechne({ einsatz: 'daemmung', prioritaeten: ['kosten'], anforderungen: ['keine'], kosten: 'keine', materialart: 'keine' }); return { status: r.status, n: r.ergebnisse.length, ids: r.ergebnisse.map(x => x.material.id), leer: r.ergebnisse.filter(x => (x.luecken || []).length).length }; }).catch(e => ({ fehler: String(e) }));
  const me = await mm(echt), md = await mm(demo);
  check('Match (Kosten als Priorität) liefert in beiden Modi Treffer, nie eine leere Liste', me.n > 0 && md.n > 0 && !me.fehler && !md.fehler, [me, md]);

  await b.close();
  console.log(fails ? '\n' + fails + ' FEHLER' : '\nAlle Prüfungen bestanden');
  process.exit(fails ? 1 : 0);
})();
