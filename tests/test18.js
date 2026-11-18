const PROJ = require('path').resolve(__dirname, '..');
const AUSGABE = require('path').join(require('os').tmpdir(), 'materialmatch-tests') + '/';
require('fs').mkdirSync(AUSGABE, { recursive: true });
const root = PROJ + '/js/';
require(root + 'hilfen.js');
const Q = require(root + 'quellen.js');
const vm = require('vm'), fs = require('fs');
let fails = 0;
const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'OK   ' : 'FAIL ') + n + (c || x === undefined ? '' : ' -> ' + JSON.stringify(x).slice(0, 500))); };
const clone = x => JSON.parse(JSON.stringify(x));

console.log('--- Link-Prüfung und Quellenbeschreibung ---');
ok('https-Link ist erlaubt', Q.istHttps('https://www.oekobaudat.de/x'));
ok('http, javascript:, leer, null sind nicht erlaubt', !Q.istHttps('http://x.de') && !Q.istHttps('javascript:alert(1)') && !Q.istHttps('') && !Q.istHttps(null) && !Q.istHttps(undefined) && !Q.istHttps(42));
ok('Groß geschriebenes "HTTPS://" wird nicht als sicher durchgewunken (strenge Prüfung)', !Q.istHttps('HTTPS://x.de'));
const q1 = { id: 'q1', titel: 'Transportbeton C25/30', datensatz_eigner: 'Sphera Solutions GmbH', typ: 'generic dataset', referenzjahr: 2023, gueltig_bis: 2026, abgerufen: '2026-11-16', url: 'https://www.oekobaudat.de/a', geprueft: true };
let b = Q.beschreibe(q1);
ok('Beschreibung: Titel, Eigner, Typ, Jahr, Gültigkeit, Abrufdatum, Link', b.titel === 'Transportbeton C25/30' && b.eigner === 'Sphera Solutions GmbH' && b.detail === 'generischer Datensatz, Bezugsjahr 2023, gültig bis 2026, abgerufen 2026-11-16' && b.url === q1.url && b.geprueft === true, b);
b = Q.beschreibe({ id: 'q2', titel: 'Norm', url: 'http://unsicher.de', geprueft: false });
ok('Nicht-https-Link wird nicht als Link ausgegeben, ungeprüft markiert', b.url === null && b.geprueft === false && b.detail === '' && b.eigner === null, b);
ok('Typ "average dataset" -> Branchendurchschnitt; "representative dataset" -> repräsentativer Durchschnitt', Q.beschreibe({ id: 'x', typ: 'average dataset' }).detail === 'Branchendurchschnitt' && Q.beschreibe({ id: 'x', typ: 'representative dataset' }).detail === 'repräsentativer Durchschnitt');
ok('Unbekannte Quelle -> null', Q.beschreibe(null) === null);
ok('finde ohne Daten oder ohne Kennung: null', Q.finde('q1') === null && Q.finde(null) === null);

console.log('--- Kennwert-Status ---');
ok('Fehlende Eigenschaft: "fehlt"', Q.status(undefined).status === 'fehlt' && Q.status(null).status === 'fehlt');
ok('nicht_anwendbar', Q.status({ wert: null, nicht_anwendbar: true }).status === 'nicht_anwendbar');
ok('Wert null: "fehlt"', Q.status({ wert: null }).status === 'fehlt');
ok('CO₂ ohne Werte: "fehlt"', Q.status({ werte: null }).status === 'fehlt');
ok('Wert 0 zählt als vorhanden (nicht "fehlt")', Q.status({ wert: 0, art: 'beispiel' }).status === 'wert');
ok('Textwert mit Datenart und Quelle', (s => s.status === 'wert' && s.art === 'richtwert' && s.quelle === 'q1')(Q.status({ wert: 'A1', art: 'richtwert', quelle: 'q1' })));
ok('CO₂ mit Werten: vorhanden', Q.status({ werte: { gesamt: 1 }, art: 'richtwert', quelle: 'q1' }).status === 'wert');

console.log('--- Fixture: Zählung, Verwendung, Check ---');
const W = (wert, art, quelle = null) => ({ wert, einheit: 'x', art, quelle });
function fixture() {
  return {
    meta: { datenstand: '2026-11-16' },
    quellen: [
      Object.assign(clone(q1), { id: 'ok1' }),
      { id: 'ok2', titel: 'B', url: 'https://example.org/b', abgerufen: '2026-11-16', geprueft: true, gueltig_bis: 2030 },
      { id: 'ungeprueft', titel: 'C', url: 'https://example.org/c', geprueft: false },
      { id: 'http', titel: 'D', url: 'http://example.org/d', abgerufen: '2026-11-16', geprueft: true }
    ],
    baustoffe: [
      { id: 'm1', name: 'M1', eigenschaften: { rohdichte: W(2300, 'richtwert', 'ok1'), waermeleitfaehigkeit: W(2, 'beispiel'), druckfestigkeit: { wert: null, nicht_anwendbar: true }, preis: W(100, 'beispiel'), gwp: { werte: { gesamt: 1 }, art: 'richtwert', quelle: 'ok1' }, brandverhalten: W('A1', 'beispiel'), wasserdampf_mu: { wert: null, art: null }, waermekapazitaet: W(1000, 'verifiziert', 'ok2') } },
      { id: 'm2', name: 'M2', eigenschaften: { rohdichte: W(500, 'richtwert', 'ok1') } }
    ]
  };
}
let d = fixture();
const z = Q.zaehle(d);
ok('Zählung M1: 2 Richtwerte (Rohdichte, GWP), 1 verifiziert, 3 Beispiele, 1 nicht anwendbar, 3 fehlen (λB, μ, Recycling)', (m => m.richtwert === 2 && m.verifiziert === 1 && m.beispiel === 3 && m.nicht_anwendbar === 1 && m.fehlt === 3 && m.gesamt === 10)(z.materialien[0].zaehler), z.materialien[0].zaehler);
ok('Zählung M2: nur Rohdichte, die übrigen 9 fehlen', (m => m.richtwert === 1 && m.fehlt === 9 && m.gesamt === 10)(z.materialien[1].zaehler), z.materialien[1].zaehler);
ok('Summen = Summe der Materialien, Gesamt 20', z.summe.gesamt === 20 && z.summe.richtwert === 3 && z.summe.verifiziert === 1 && z.summe.beispiel === 3 && z.summe.fehlt === 12 && z.summe.nicht_anwendbar === 1, z.summe);
ok('Jede Kategorie summiert sich zur Gesamtzahl (nichts geht verloren)', ['verifiziert', 'richtwert', 'beispiel', 'ohne_art', 'nicht_anwendbar', 'fehlt'].reduce((s, k) => s + z.summe[k], 0) === z.summe.gesamt);
ok('Matrix je Material: Status je Kennwert vorhanden', z.materialien[0].werte.rohdichte.status === 'wert' && z.materialien[0].werte.druckfestigkeit.status === 'nicht_anwendbar' && z.materialien[0].werte.recycling.status === 'fehlt');
const v = Q.verwendung(d);
ok('Verwendung: ok1 belegt Rohdichte und GWP von M1 sowie Rohdichte von M2', v.ok1.length === 3 && v.ok2.length === 1 && !v.ungeprueft, v);
let r = Q.pruefe(d);
ok('Sauberer Datenbestand: Check besteht, alle sechs Prüfungen ok', r.ok === true && r.pruefungen.length === 6 && r.pruefungen.every(p => p.ok), r.pruefungen.map(p => p.ok));
ok('Belegte Kennwerte (mit geprüfter Quelle, kein Beispiel): 4', r.belegteKennwerte === 4, r.belegteKennwerte);
ok('Warnungen: Beispieldaten und fehlende Kennwerte werden genannt', r.warnungen.some(w => w.includes('3 Kennwerte sind Beispieldaten')) && r.warnungen.some(w => w.includes('nicht verfügbar')), r.warnungen);
ok('Gültigkeit: ok1 (gültig bis 2026, Datenstand 2026) wird gemeldet, ok2 (2030) nicht', r.ablaufend.length === 1 && r.ablaufend[0].id === 'ok1' && r.warnungen.some(w => w.includes('nur bis 2026')), r.ablaufend.map(q => q.id));

const fall = (name, mut, welche, enthaelt) => {
  const x = fixture(); mut(x); const res = Q.pruefe(x);
  const p = res.pruefungen[welche];
  ok(name, res.ok === false && p.ok === false && p.details.some(t => t.includes(enthaelt)), res.pruefungen.map(q => q.ok).concat([p.details]));
};
fall('Richtwert ohne Quelle wird erkannt', x => { x.baustoffe[0].eigenschaften.waermeleitfaehigkeit.art = 'richtwert'; }, 0, 'M1: waermeleitfaehigkeit');
fall('Verifiziert ohne Quelle wird erkannt', x => { x.baustoffe[1].eigenschaften.rohdichte.quelle = null; }, 0, 'M2: rohdichte');
fall('Unbekannte Quellenkennung wird erkannt', x => { x.baustoffe[0].eigenschaften.rohdichte.quelle = 'gibtsnicht'; }, 1, 'gibtsnicht');
fall('Ungeprüfte Quelle als Beleg wird erkannt', x => { x.baustoffe[0].eigenschaften.rohdichte.quelle = 'ungeprueft'; }, 2, 'ungeprueft');
fall('Quelle mit http-Link wird erkannt', x => { x.baustoffe[0].eigenschaften.rohdichte.quelle = 'http'; }, 3, 'http');
fall('Quelle ganz ohne Link wird erkannt', x => { delete x.quellen[0].url; }, 3, 'ok1');
fall('Vorhandener Wert ohne Datenart wird erkannt', x => { x.baustoffe[0].eigenschaften.preis.art = null; }, 4, 'M1: preis');
fall('Beispieldaten mit verknüpfter Quelle werden erkannt', x => { x.baustoffe[0].eigenschaften.preis.quelle = 'ok1'; }, 5, 'M1: preis');
d = fixture(); d.quellen[0].gueltig_bis = 2027;
ok('Gültig bis 2027 bei Datenstand 2026: keine Ablauf-Warnung', Q.pruefe(d).ablaufend.length === 0);
d = fixture(); d.quellen[0].geprueft = false; d.baustoffe[0].eigenschaften.rohdichte.quelle = null; d.baustoffe[0].eigenschaften.rohdichte.art = 'beispiel'; d.baustoffe[0].eigenschaften.gwp.quelle = null; d.baustoffe[0].eigenschaften.gwp.art = 'beispiel'; d.baustoffe[1].eigenschaften.rohdichte.quelle = null; d.baustoffe[1].eigenschaften.rohdichte.art = 'beispiel';
ok('Ungeprüfte Quellen lösen keine Ablauf-Warnung aus', Q.pruefe(d).ablaufend.length === 0);
d = fixture(); d.baustoffe[0].eigenschaften.waermeleitfaehigkeit.art = 'quatsch';
ok('Unbekannte Datenart zählt als "ohne Art", nicht als Richtwert', Q.zaehle(d).materialien[0].zaehler.ohne_art === 1);

console.log('--- Echte Datenbank ---');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(root + '../data/baustoffe.js', 'utf8'), ctx);
const DB = ctx.window.MATERIALMATCH_DATA;
Q.setzeDaten(DB);
ok('finde: ÖKOBAUDAT-Datensatz zu Normalbeton', Q.finde('oebd-a71e60a5').titel === 'Transportbeton C25/30');
r = Q.pruefe(DB);
ok('Check besteht, alle Prüfungen ok', r.ok && r.pruefungen.every(p => p.ok), r.pruefungen.filter(p => !p.ok));
// Handrechnung Schritt 11: Rohdichten 14 + 24 = 38; Flächengewichte 1 + 9 = 10; GWP 16 + 33 = 49; zusammen 97 (wie die CSV-Gegenprüfung).
// Die Datei enthält nur generische Datensätze: dazu kommt die EU-Einstufung A1 (Entscheidung 96/603/EG) für 28 Materialien
// (7 aus Runde 1, 19 aus Runde 2, dazu Mineralwolle und Glaswolle); Hersteller-/ETA-Werte stehen in data/produkte.js. Zusammen 125.
ok('129 belegte Kennwerte in den generischen Datensätzen (97 aus der ÖKOBAUDAT: 38 Rohdichten + 10 Flächengewichte + 49 GWP; 28 EU-Einstufungen; seit 3.2 vier Preisspannen)', r.belegteKennwerte === 129, r.belegteKennwerte);
const zz = Q.zaehle(DB).summe;
ok('50 Baustoffe × 10 Kennwerte = 500', zz.gesamt === 500 && Q.zaehle(DB).materialien.length === 50 && DB.baustoffe.length === 50, zz);
ok('Echte Zählung (generische Datensätze, Demo-Daten): 119 Richtwerte (38 Rohdichten + 49 CO₂ + 28 EU-Einstufungen + 4 Preisspannen seit 3.2), 0 verifiziert, 100 Beispieldaten (108 − 8 durch EU-Einstufung ersetzt), 19 nicht anwendbar, 262 nicht verfügbar (500 − 119 − 100 − 19)', zz.richtwert === 119 && zz.verifiziert === 0 && zz.beispiel === 100 && zz.nicht_anwendbar === 19 && zz.fehlt === 262, zz);
ok('Beispieldaten und fehlende Werte sind benannt (Summe aller Kategorien = 500)', zz.beispiel > 0 && ['verifiziert', 'richtwert', 'beispiel', 'ohne_art', 'nicht_anwendbar', 'fehlt'].reduce((s, k) => s + zz[k], 0) === 500, zz);
const erwarteAblauf = DB.quellen.filter(q => q.geprueft === true && typeof q.gueltig_bis === 'number' && q.gueltig_bis <= 2026).length;
ok('Ablaufende Datensätze (gültig bis ≤ 2026) werden gemeldet, Anzahl unabhängig nachgezählt', r.ablaufend.length === erwarteAblauf && erwarteAblauf > 0, [r.ablaufend.length, erwarteAblauf]);
// Seit Datenpaket 1 gehören 12 ÖKOBAUDAT-Datensätze zu Produkten (data/produkte.js); die Verwendungsliste zählt Produktwerte mit
vm.runInContext(fs.readFileSync(root + '../data/produkte.js', 'utf8'), ctx);
globalThis.MATERIALMATCH_PRODUKTE = ctx.window.MATERIALMATCH_PRODUKTE;
const vv = Q.verwendung(DB);
ok('Alle 61 ÖKOBAUDAT-Datensätze werden verwendet (49 für Kennwerte der Materialien, 12 für Produktwerte)', DB.quellen.filter(q => /^oebd-[0-9a-f]{8}$/.test(q.id)).every(q => vv[q.id] && vv[q.id].length >= 1), Object.keys(vv).length);
ok('Die Dokumentation zu den generischen Daten wird nicht als Kennwertquelle missbraucht', !vv['doku-oekobaudat-generisch']);
ok('Nicht eingesehene Normen belegen keinen Kennwert', !vv['din-en-iso-10456'] && !vv['din-4108-4'] && !vv['din-en-13501-1']);
ok('Alle Quellen mit Link nutzen https', DB.quellen.filter(q => q.url).every(q => Q.istHttps(q.url)));
ok('Alle als geprüft markierten Quellen haben Abrufdatum und Titel', DB.quellen.filter(q => q.geprueft).every(q => q.abgerufen && q.titel));
ok('Alle ungeprüften Quellen sind als solche erkennbar (geprueft: false) und belegen nichts', DB.quellen.filter(q => !q.geprueft).every(q => q.geprueft === false && !vv[q.id]), DB.quellen.filter(q => !q.geprueft).map(q => q.id));
const mutiert = clone(DB); mutiert.baustoffe.find(m => m.id === 'normalbeton').eigenschaften.waermeleitfaehigkeit.art = 'richtwert';
ok('Echte Daten: ein heimlich hochgestufter Beispielwert fällt im Check durch', Q.pruefe(mutiert).ok === false);

console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
