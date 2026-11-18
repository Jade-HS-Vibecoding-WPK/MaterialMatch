const PROJ = require('path').resolve(__dirname, '..');
const AUSGABE = require('path').join(require('os').tmpdir(), 'materialmatch-tests') + '/';
require('fs').mkdirSync(AUSGABE, { recursive: true });
const vm = require('vm'), fs = require('fs');
const B = require(PROJ + '/js/berechnung.js');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/fixture_rechentest.js','utf8'), ctx);
const DB = ctx.window.MATERIALMATCH_DATA.baustoffe;
const mat = id => DB.find(m => m.id === id);
let fails = 0;
const near = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));
function ok(name, cond, extra) { if (!cond) fails++; console.log((cond?'OK   ':'FAIL ')+name+(cond||extra===undefined?'':' -> '+JSON.stringify(extra))); }
const p = t => B.parseZahl(t);

console.log('--- Zahlen lesen ---');
const faelle = [
  ['100', 100], ['12,5', 12.5], ['12.5', 12.5], [' 20 ', 20], ['0,5', 0.5], ['0.500', 0.5],
  ['1.234,5', 1234.5], ['1.000.000', 1000000], ['1.000.000,25', 1000000.25], ['+7', 7], ['007', 7], ['100.50', 100.5], ['2 500', 2500],
];
faelle.forEach(([t, w]) => { const r = p(t); ok(`"${t}" -> ${w}`, r.wert !== undefined && near(r.wert, w), r); });
ok('"" ist leer', p('').leer === true);
ok('"   " ist leer', p('   ').leer === true);
ok('"-5" -> -5 (wird später abgelehnt)', p('-5').wert === -5);
['abc','12a','1,2,3','5,',',5','.5','1e3','--5','1.2.3','12,5,','€100','1.500','10.500','999.999','1.5000.000','1234567890123456'].forEach(t => {
  const r = p(t); ok(`"${t}" wird abgelehnt`, !!r.fehler && r.wert === undefined, r);
});
ok('"1.500" Fehlertext nennt beide Lesarten', p('1.500').fehler.includes('1,500') && p('1.500').fehler.includes('1500'), p('1.500').fehler);

console.log('--- Eingaben prüfen ---');
const E = (f, d, u='cm') => B.pruefeEingaben({ flaecheText: f, dickeText: d, dickeEinheit: u });
ok('beide leer -> leer', E('','').status === 'leer');
ok('nur Fläche -> unvollständig', E('100','').status === 'unvollstaendig');
ok('nur Dicke -> unvollständig', E('','20').status === 'unvollstaendig');
let e = E('100','20');
ok('100 m², 20 cm -> ok, Dicke 0,2 m', e.status==='ok' && e.flaeche_m2===100 && near(e.dicke_m,0.2), e);
ok('200 mm = 0,2 m', near(E('100','200','mm').dicke_m, 0.2));
ok('0,2 m = 0,2 m', near(E('100','0,2','m').dicke_m, 0.2));
ok('12,5 mm = 0,0125 m', near(E('1','12,5','mm').dicke_m, 0.0125));
ok('Fläche 0 -> Fehler', E('0','20').fehler.flaeche === 'Die Fläche muss größer als 0 sein.');
ok('Fläche -5 -> Fehler negativ', E('-5','20').fehler.flaeche === 'Die Fläche darf nicht negativ sein.');
ok('Dicke 0 -> Fehler', E('100','0').fehler.dicke === 'Die Dicke muss größer als 0 sein.');
ok('Dicke -1 -> Fehler negativ', E('100','-1').fehler.dicke === 'Die Dicke darf nicht negativ sein.');
ok('Fläche 1.000.000 erlaubt', E('1.000.000','20').status === 'ok');
ok('Fläche 1.000.001 zu groß', E('1.000.001','20').status === 'fehler');
ok('Dicke 10 m erlaubt', E('100','10','m').status === 'ok');
ok('Dicke 1001 cm zu groß', E('100','1001','cm').status === 'fehler');
ok('Dicke 10001 mm zu groß', E('100','10001','mm').status === 'fehler');
ok('Dicke 11 m zu groß', E('100','11','m').status === 'fehler');
ok('Text bei Fläche -> Fehler, Dicke ok', E('abc','20').fehler.flaeche && !E('abc','20').fehler.dicke);
ok('Beide fehlerhaft -> beide Meldungen', E('-1','-1').fehler.flaeche && E('-1','-1').fehler.dicke);
ok('Fehler hat Vorrang vor "unvollständig"', E('abc','').status === 'fehler');
ok('Unbekannte Einheit -> Fehler', E('100','20','zoll').status === 'fehler');
ok('Bei Fehler keine Rechenwerte', E('-5','20').flaeche_m2 === null && E('-5','20').dicke_m === null);

console.log('--- Volumen, Gewicht, Flächenmasse (von Hand nachgerechnet) ---');
// Beispiel aus dem Prompt: 100 m² x 20 cm = 20 m³
let r = B.berechneSchicht(mat('normalbeton'), 100, 0.2);
ok('Normalbeton: V = 20 m³', r.moeglich && near(r.volumen_m3, 20), r);
ok('Normalbeton: G = 20 × 2300 = 46.000 kg', near(r.gewicht_kg, 46000), r);
ok('Normalbeton: 0,2 × 2300 = 460 kg/m²', near(r.flaechenmasse_kgm2, 460), r);
r = B.berechneSchicht(mat('mineralwolle'), 100, 0.2);
ok('Mineralwolle (Fixture, 40 kg/m³): 20 × 40 = 800 kg', near(r.gewicht_kg, 800), r);
r = B.berechneSchicht(mat('eps'), 100, 0.2);
ok('EPS: 20 × 15 = 300 kg', near(r.gewicht_kg, 300), r);
r = B.berechneSchicht(mat('porenbeton'), 25.5, 0.365);
ok('Porenbeton 25,5 m² × 36,5 cm: V = 9,3075 m³; G = 3723 kg', near(r.volumen_m3, 9.3075) && near(r.gewicht_kg, 3723), r);
r = B.berechneSchicht(mat('gipskarton'), 40, 0.0125);
ok('Gipskarton 40 m² × 12,5 mm: V = 0,5 m³; G = 400 kg; 10 kg/m²', near(r.volumen_m3, 0.5) && near(r.gewicht_kg, 400) && near(r.flaechenmasse_kgm2, 10), r);
r = B.berechneSchicht(mat('baustahl'), 100, 0.2);
ok('Baustahl: keine Schichtberechnung, mit Begründung', r.moeglich === false && r.grund.includes('Schicht-Berechnung'), r);
r = B.berechneSchicht(mat('dachziegel'), 100, 0.2);
ok('Dachziegel: keine Schichtberechnung', r.moeglich === false, r);
const ohne = JSON.parse(JSON.stringify(mat('eps'))); ohne.eigenschaften.rohdichte.wert = null;
r = B.berechneSchicht(ohne, 100, 0.2);
ok('Rohdichte fehlt -> keine Berechnung, Hinweis', r.moeglich === false && r.grund.includes('Rohdichte fehlt'), r);
const null0 = JSON.parse(JSON.stringify(mat('eps'))); null0.eigenschaften.rohdichte.wert = 0;
ok('Rohdichte 0 -> keine Berechnung', B.berechneSchicht(null0, 100, 0.2).moeglich === false);

console.log('--- Unterschiede ---');
let u = B.berechneUnterschied(800, 300);
ok('EPS gegenüber Mineralwolle (Fixture, 40 kg/m³): -500 kg, -62,5 %', near(u.absolut, -500) && near(u.prozent, -62.5), u);
u = B.berechneUnterschied(300, 800);
ok('Steinwolle gegenüber EPS: +500 kg, +166,67 %', near(u.absolut, 500) && Math.abs(u.prozent - 166.6667) < 1e-3, u);
ok('Gleiche Werte: 0 und 0 %', B.berechneUnterschied(5, 5).absolut === 0 && B.berechneUnterschied(5, 5).prozent === 0);
ok('Bezug 0: Prozent nicht berechenbar', B.berechneUnterschied(0, 5).prozent === null);

console.log('--- Formatierung ---');
const fz = (x, s) => ok(`format(${x}) = "${s}"`, B.formatZahl(x) === s, B.formatZahl(x));
fz(20.000000000000004, '20'); fz(46000.00000000001, '46.000'); fz(9.3075, '9,31'); fz(0.5, '0,5'); fz(0.005, '0,005');
fz(460, '460'); fz(12.34, '12,3'); fz(1234567, '1.234.567'); fz(0, '0'); fz(0.0001, '< 0,001'); fz(-62.5, '-62,5'); fz(99.96, '100,0'.replace(',0','')); 
ok('formatEingabe(1500.5) = "1.500,5"', B.formatEingabe(1500.5) === '1.500,5', B.formatEingabe(1500.5));
ok('formatEingabe(0.0125) = "0,0125"', B.formatEingabe(0.0125) === '0,0125');
ok('formatEingabe(20) = "20"', B.formatEingabe(20) === '20');
ok('Vorzeichen +500', B.formatMitVorzeichen(500) === '+500');
ok('Vorzeichen -500', B.formatMitVorzeichen(-500) === '-500');
ok('Vorzeichen 0', B.formatMitVorzeichen(0) === '0');
ok('NaN/Infinity -> Strich', B.formatZahl(NaN) === '–' && B.formatZahl(Infinity) === '–' && B.formatZahl(null) === '–');

console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
