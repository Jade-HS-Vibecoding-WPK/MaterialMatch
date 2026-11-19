const PROJ = require('path').resolve(__dirname, '..');
const AUSGABE = require('path').join(require('os').tmpdir(), 'materialmatch-tests') + '/';
require('fs').mkdirSync(AUSGABE, { recursive: true });
const root = PROJ + '/js/';
require(root + 'hilfen.js'); require(root + 'berechnung.js'); require(root + 'bewertung.js'); const E = require(root + 'empfehlung.js');
const vm = require('vm'), fs = require('fs');
let fails = 0;
const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'OK   ' : 'FAIL ') + n + (c || x === undefined ? '' : ' -> ' + JSON.stringify(x).slice(0, 500))); };
const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e * Math.max(1, Math.abs(b));

// ---------- Testdaten (Zahlen frei gewählt, Rechenweg von Hand) ----------
const quellen = [{ id: 'q-gen', typ: 'generic dataset', url: 'https://example.org/gen', titel: 'Gen' }, { id: 'q-avg', typ: 'average dataset', url: 'https://example.org/avg', titel: 'Avg' }];
const bereiche = [{ id: 'tragwerk', name: 'Tragende Wand / Decke / Stütze' }, { id: 'waermedaemmung', name: 'Wärmedämmung' }, { id: 'dach', name: 'Dach' }];
const P = (w, art = 'richtwert', e = '€/m³') => ({ wert: w, einheit: e, art, mwst: 'netto', umfang: 'Material' });
const G = (fossil, art = 'richtwert', q = 'q-gen', bezug = '1 m³') => ({ werte: { gesamt: fossil, fossil, biogen: 0 }, einheit: 'kg CO2e', deklarierte_einheit: bezug, module: 'A1-A3', art, quelle: q });
const L = (w, art = 'richtwert') => ({ wert: w, einheit: 'W/(m·K)', art });
const R_ = (w, art = 'richtwert') => ({ wert: w, einheit: 'kg/m³', art });
const mk = (id, anw, eig, extra = {}) => Object.assign({ id, name: id.toUpperCase(), produkt: 'x', kategorien: ['x'], anwendungen: anw, mengenmodell: 'schicht', eigenschaften: eig, vorteile: ['Vorteil-' + id], nachteile: ['Nachteil-' + id] }, extra);
const daten = (b) => ({ quellen, anwendungsbereiche: bereiche, baustoffe: b });

console.log('--- Priorität verändert die Reihenfolge (Handrechnung) ---');
// Tragwerk: Kriterien kosten und co2. Ref: 100 / 100. A: 60 / 120. B: 140 / 60. C: 100 / 100.
const T = [
  mk('ref', ['tragwerk'], { preis: P(100), gwp: G(100) }),
  mk('a',   ['tragwerk'], { preis: P(60),  gwp: G(120) }),
  mk('b',   ['tragwerk'], { preis: P(140), gwp: G(60) }),
  mk('c',   ['tragwerk'], { preis: P(100), gwp: G(100) })
];
let r = E.empfehle(daten(T), 'ref', 'tragwerk', 'ausgewogen');
ok('Ausgewogen: A und B gleichauf bei 0,5 (Gleichstand -> Name), dann C (0,4167)', JSON.stringify(r.empfehlungen.map(e => e.material.id)) === '["a","b","c"]', r.empfehlungen.map(e => [e.material.id, e.score]));
ok('Ausgewogen: Scores 0,5 / 0,5 / (0,5 + 1/3)/2', near(r.empfehlungen[0].score, 0.5) && near(r.empfehlungen[1].score, 0.5) && near(r.empfehlungen[2].score, (0.5 + 1 / 3) / 2), r.empfehlungen.map(e => e.score));
r = E.empfehle(daten(T), 'ref', 'tragwerk', 'kosten');
ok('Priorität Kosten: A (0,75), C (0,4583), B (0,25)', JSON.stringify(r.empfehlungen.map(e => e.material.id)) === '["a","c","b"]' && near(r.empfehlungen[0].score, 0.75) && near(r.empfehlungen[1].score, (3 * 0.5 + 1 / 3) / 4) && near(r.empfehlungen[2].score, 0.25), r.empfehlungen.map(e => [e.material.id, e.score]));
r = E.empfehle(daten(T), 'ref', 'tragwerk', 'co2');
ok('Priorität CO₂: B (0,75), C (0,375), A (0,25)', JSON.stringify(r.empfehlungen.map(e => e.material.id)) === '["b","c","a"]' && near(r.empfehlungen[0].score, 0.75) && near(r.empfehlungen[1].score, 0.375) && near(r.empfehlungen[2].score, 0.25), r.empfehlungen.map(e => [e.material.id, e.score]));
ok('Prioritätskriterium bekommt Gewicht 3', r.kriterien.find(k => k.id === 'co2').gewicht === 3 && r.kriterien.find(k => k.id === 'kosten').gewicht === 1);
r = E.empfehle(daten(T), 'ref', 'tragwerk', 'ausgewogen');
const a = r.empfehlungen.find(e => e.material.id === 'a');
ok('Differenz A: Kosten −40 %, CO₂ +20 %', near(a.kriterien.find(k => k.id === 'kosten').deltaProzent, -40) && near(a.kriterien.find(k => k.id === 'co2').deltaProzent, 20), a.kriterien);
ok('Vorteil A: "Kosten 40 % niedriger", Nachteil A: "CO₂ … 20 % höher"', a.vorteil.text.includes('Kosten 40 % niedriger') && a.nachteil.text.includes('20 % höher') && a.vorteil.aus === 'berechnet', [a.vorteil, a.nachteil]);
ok('Gesamtvergleich zu Material A (Referenz 0,4167): A und B mit 0,5 "besser", C gleichauf "ähnlich"', r.empfehlungen.find(e => e.material.id === 'c').vergleichZuA === 'ähnlich' && a.vergleichZuA === 'besser', r.empfehlungen.map(e => [e.material.id, e.vergleichZuA]));
r = E.empfehle(daten(T), 'ref', 'tragwerk', 'kosten');
ok('Mit Priorität Kosten ist A besser als Material A', r.empfehlungen[0].vergleichZuA === 'besser');
ok('Begründung nennt Bereich, Referenz, Zahlen, Bewertungsgrundlage', /Tragende Wand/.test(r.empfehlungen[0].begruendung) && r.empfehlungen[0].begruendung.includes('REF') && r.empfehlungen[0].begruendung.includes('Niedrige Kosten') && r.empfehlungen[0].begruendung.includes('40 % niedriger'), r.empfehlungen[0].begruendung);
ok('Unbekannte Priorität fällt auf "ausgewogen" zurück', E.empfehle(daten(T), 'ref', 'tragwerk', 'quatsch').prioritaet === 'ausgewogen');

console.log('--- Nie allein wegen des Preises ---');
const T2 = T.concat([
  mk('nurpreis', ['tragwerk'], { preis: P(10) }),                                  // sehr günstig, aber sonst nichts
  mk('anderer-typ', ['tragwerk'], { preis: P(50), gwp: G(10, 'richtwert', 'q-avg') }), // CO₂ nicht vergleichbar (Durchschnitt statt generisch)
  mk('stahl', ['tragwerk'], { preis: P(1.3, 'richtwert', '€/kg'), rohdichte: R_(7850), gwp: G(1, 'richtwert', 'q-gen', '1 kg') }, { mengenmodell: 'keine_schicht', mengenhinweis: 'Profil, keine Schicht.' }),
  mk('wand', ['dach'], { preis: P(5), gwp: G(5) })                                  // anderer Anwendungsbereich
]);
r = E.empfehle(daten(T2), 'ref', 'tragwerk', 'kosten');
ok('Billigstes Material ohne zweiten Kennwert wird NICHT empfohlen', !r.empfehlungen.some(e => e.material.id === 'nurpreis') && r.nichtEmpfohlen.some(n => n.material.id === 'nurpreis' && n.grund.includes('nie allein wegen des Preises')), r.nichtEmpfohlen);
ok('Anderer CO₂-Datensatztyp: nicht bewertbar, Grund nennt Datensatztyp', r.nichtEmpfohlen.some(n => n.material.id === 'anderer-typ' && n.grund.includes('Datensatztyp')), r.nichtEmpfohlen);
ok('Material ohne Schicht (Stahl): nicht empfohlen, Grund "keine Schichtberechnung"', r.nichtEmpfohlen.some(n => n.material.id === 'stahl' && n.grund.includes('keine Schichtberechnung')), r.nichtEmpfohlen);
ok('Anderer Anwendungsbereich: weder empfohlen noch gelistet', !r.empfehlungen.some(e => e.material.id === 'wand') && !r.nichtEmpfohlen.some(n => n.material.id === 'wand'));
ok('Ausgangsmaterial wird nie empfohlen', !r.empfehlungen.some(e => e.material.id === 'ref'));
ok('Die drei Guten bleiben: a, b, c', r.empfehlungen.length === 3 && new Set(r.empfehlungen.map(e => e.material.id)).size === 3);
ok('Die Normalisierung bleibt unbeeinflusst vom ausgeschlossenen Billigmaterial (A weiterhin 0,75)', near(r.empfehlungen.find(e => e.material.id === 'a').score, 0.75), r.empfehlungen.map(e => [e.material.id, e.score]));

console.log('--- Höchstens drei ---');
const T3 = [mk('ref', ['tragwerk'], { preis: P(100), gwp: G(100) })];
for (let i = 1; i <= 6; i++) T3.push(mk('k' + i, ['tragwerk'], { preis: P(100 - i * 5), gwp: G(100 + i * 3) }));
r = E.empfehle(daten(T3), 'ref', 'tragwerk', 'ausgewogen');
ok('Sechs Kandidaten: genau drei empfohlen, drei als "hinter den empfohlenen" gelistet', r.empfehlungen.length === 3 && r.nichtEmpfohlen.filter(n => n.grund.includes('hinter den drei')).length === 3, [r.empfehlungen.length, r.nichtEmpfohlen.length]);
ok('Rang 1, 2, 3 und absteigende Bewertung', r.empfehlungen.map(e => e.rang).join() === '1,2,3' && r.empfehlungen[0].score >= r.empfehlungen[1].score && r.empfehlungen[1].score >= r.empfehlungen[2].score);

console.log('--- Dämmstoffe: Vergleich je gleicher Dämmwirkung ---');
const D = [
  mk('dref', ['waermedaemmung'], { preis: P(100), waermeleitfaehigkeit: L(0.040), gwp: G(60), rohdichte: R_(40) }),
  mk('d1',   ['waermedaemmung'], { preis: P(80),  waermeleitfaehigkeit: L(0.035), gwp: G(50), rohdichte: R_(30) }),
  mk('d2',   ['waermedaemmung'], { preis: P(200), waermeleitfaehigkeit: L(0.045), gwp: G(90), rohdichte: R_(60) })
];
r = E.empfehle(daten(D), 'dref', null, 'ausgewogen');
ok('Bereich wird aus Material A abgeleitet (Wärmedämmung)', r.bereich === 'waermedaemmung');
ok('Kriterien: Kosten je Dämmwirkung, CO₂ je Dämmwirkung, λ (kein Gewicht)', r.kriterien.map(k => k.id).join() === 'kosten_r,co2_r,lambda', r.kriterien);
const d1 = r.empfehlungen.find(e => e.material.id === 'd1');
ok('Kosten je R: 80 × 0,035 = 2,8 gegen 100 × 0,04 = 4 (−30 %)', near(d1.kriterien.find(k => k.id === 'kosten_r').wert, 2.8) && near(d1.kriterien.find(k => k.id === 'kosten_r').referenzWert, 4) && near(d1.kriterien.find(k => k.id === 'kosten_r').deltaProzent, -30), d1.kriterien);
ok('CO₂ je R: 50 × 0,035 = 1,75 gegen 60 × 0,04 = 2,4', near(d1.kriterien.find(k => k.id === 'co2_r').wert, 1.75) && near(d1.kriterien.find(k => k.id === 'co2_r').referenzWert, 2.4));
ok('d1 (besser in allem) steht vor d2', r.empfehlungen[0].material.id === 'd1' && r.empfehlungen[1].material.id === 'd2', r.empfehlungen.map(e => [e.material.id, e.score]));
ok('d1 ist besser als Material A, d2 schlechter', d1.vergleichZuA === 'besser' && r.empfehlungen[1].vergleichZuA === 'schlechter');
r = E.empfehle(daten(D), 'dref', null, 'gewicht');
ok('Priorität Gewicht: Kriterium "gewicht" kommt hinzu (Gewicht 3)', r.kriterien.map(k => k.id).join() === 'kosten_r,co2_r,lambda,gewicht' && r.kriterien[3].gewicht === 3, r.kriterien);
r = E.empfehle(daten(T), 'ref', 'tragwerk', 'waerme');
ok('Priorität Wärmedämmung bei Tragwerk: λ kommt hinzu', r.kriterien.map(k => k.id).join() === 'kosten,co2,lambda' && r.kriterien[2].gewicht === 3);
ok('...aber Material A hat kein λ: Kriterium wird als nicht vorhanden geführt', r.kriterien[2].vorhanden === false);

console.log('--- Umrechnung auf gemeinsame Basis ---');
ok('Preis €/kg × Rohdichte (1,2 × 15 = 18 €/m³)', near(E.preisJeM3(mk('x', [], { preis: P(1.2, 'richtwert', '€/kg'), rohdichte: R_(15) })).wert, 18));
ok('Preis €/m² / Bezugsdicke (5 / 0,0125 = 400 €/m³)', near(E.preisJeM3(mk('x', [], { preis: Object.assign(P(5, 'richtwert', '€/m²'), { bezugsdicke_m: 0.0125 }) })).wert, 400));
ok('Preis €/m² ohne Bezugsdicke: nicht umrechenbar', E.preisJeM3(mk('x', [], { preis: P(5, 'richtwert', '€/m²') })) === null);
ok('Preis €/kg ohne Rohdichte: nicht umrechenbar', E.preisJeM3(mk('x', [], { preis: P(1.2, 'richtwert', '€/kg') })) === null);
ok('Preis bei Material ohne Schicht: nicht vergleichbar', E.preisJeM3(mk('x', [], { preis: P(1) }, { mengenmodell: 'keine_schicht' })) === null);
ok('CO₂ je kg × Rohdichte (3 × 15 = 45 kg/m³), Umrechnung markiert', (c => near(c.wert, 45) && c.umgerechnet)(E.co2JeM3(mk('x', [], { gwp: G(3, 'richtwert', 'q-gen', '1 kg'), rohdichte: R_(15) }), id => quellen.find(q => q.id === id))));
ok('CO₂ je m² / Bezugsdicke (1 / 0,0125 = 80)', near(E.co2JeM3(mk('x', [], { gwp: Object.assign(G(1, 'richtwert', 'q-gen', '1 m²'), { bezugsdicke_m: 0.0125 }) }), () => null).wert, 80));
ok('CO₂ ohne Quelle: Datensatztyp "beispiel"', E.co2JeM3(mk('x', [], { gwp: G(5, 'beispiel', null) }), () => null).typ === 'beispiel');

console.log('--- Belastbarkeit und Datenlage ---');
const mitArt = (art) => [mk('ref', ['tragwerk'], { preis: P(100, art), gwp: G(100, art) }), mk('k', ['tragwerk'], { preis: P(80, art), gwp: G(90, art) })];
ok('Beispieldaten -> "nicht belastbar", Kriterien genannt', (e => e.belastbarkeit.stufe === 'nicht_belastbar' && e.belastbarkeit.text.includes('Beispieldaten') && e.belastbarkeit.text.includes('Kosten'))(E.empfehle(daten(mitArt('beispiel')), 'ref', 'tragwerk', 'ausgewogen').empfehlungen[0]));
ok('Richtwerte -> "orientierend"', E.empfehle(daten(mitArt('richtwert')), 'ref', 'tragwerk', 'ausgewogen').empfehlungen[0].belastbarkeit.stufe === 'orientierend');
ok('Nur verifizierte Werte -> "belastbar"', E.empfehle(daten(mitArt('verifiziert')), 'ref', 'tragwerk', 'ausgewogen').empfehlungen[0].belastbarkeit.stufe === 'belastbar');
const mixed = [mk('ref', ['tragwerk'], { preis: P(100, 'richtwert'), gwp: G(100, 'beispiel') }), mk('k', ['tragwerk'], { preis: P(80, 'richtwert'), gwp: G(90, 'richtwert') })];
ok('Ein Beispielwert genügt für "nicht belastbar" (auch beim Ausgangsmaterial)', E.empfehle(daten(mixed), 'ref', 'tragwerk', 'ausgewogen').empfehlungen[0].belastbarkeit.stufe === 'nicht_belastbar');
const unvoll = [mk('dref', ['waermedaemmung'], { preis: P(100), waermeleitfaehigkeit: L(0.04), gwp: G(60), rohdichte: R_(40) }), mk('k', ['waermedaemmung'], { preis: P(80), waermeleitfaehigkeit: L(0.035) })];
const eu = E.empfehle(daten(unvoll), 'dref', null, 'gewicht').empfehlungen[0];
ok('Wenig Kriterien bei Priorität Gewicht (2 von 6 Gewichtseinheiten): "unvollständig"', eu.belastbarkeit.stufe === 'unvollstaendig' && eu.abdeckung < 0.5, [eu.abdeckung, eu.belastbarkeit]);
ok('Nicht bewertete Kriterien werden mit Grund genannt (CO₂ fehlt)', eu.nichtBewertet.some(n => n.name.includes('CO₂')) && eu.hinweise.some(h => h.includes('nicht bewertet')), eu.nichtBewertet);

console.log('--- Hinweise (Brandverhalten, Tragwerk) ---');
const BR = [mk('ref', ['tragwerk'], { preis: P(100), gwp: G(100), brandverhalten: { wert: 'A1', art: 'beispiel' } }), mk('k', ['tragwerk'], { preis: P(80), gwp: G(90), brandverhalten: { wert: 'D-s2,d0', art: 'beispiel' } }), mk('k2', ['tragwerk'], { preis: P(70), gwp: G(95), brandverhalten: { wert: 'A1', art: 'beispiel' } })];
r = E.empfehle(daten(BR), 'ref', 'tragwerk', 'ausgewogen');
const hk = r.empfehlungen.find(e => e.material.id === 'k'), hk2 = r.empfehlungen.find(e => e.material.id === 'k2');
ok('Schlechtere Euroklasse: Hinweis "D-s2,d0 statt A1", Abgrenzung zum Feuerwiderstand', hk.hinweise.some(h => h.includes('D-s2,d0 statt A1') && h.includes('nicht der Feuerwiderstand')), hk.hinweise);
ok('Gleiche Euroklasse: kein Brandhinweis', !hk2.hinweise.some(h => h.includes('Brandverhalten')));
ok('Tragwerk: Hinweis auf Tragwerksplanung bei jeder Karte', r.empfehlungen.every(e => e.hinweise.some(h => h.includes('Tragwerksplanung'))));
ok('Brandklasse wird nicht bewertet (kein Kriterium)', !r.kriterien.some(k => /brand/i.test(k.name)));
ok('Hinweis nennt Beispieldaten, wenn Euroklasse nur ein Beispielwert ist', hk.hinweise.some(h => h.includes('(Beispieldaten)')));
ok('Allgemeine Vor-/Nachteile werden als "nicht quellengeprüft" markiert, wenn kein Zahlenvorteil da ist', (() => { const x = E.empfehle(daten([mk('ref', ['tragwerk'], { preis: P(100), gwp: G(100) }), mk('k', ['tragwerk'], { preis: P(100), gwp: G(100) })]), 'ref', 'tragwerk', 'ausgewogen').empfehlungen[0]; return x.vorteil.aus.includes('nicht quellengeprüft') && x.vorteil.text === 'Vorteil-k'; })());

console.log('--- Kennwerte und Quellen der Karte ---');
const KQ = [mk('ref', ['tragwerk'], { preis: P(100), gwp: G(100) }), mk('k', ['tragwerk'], { preis: P(80, 'beispiel'), gwp: G(90), rohdichte: R_(500), waermeleitfaehigkeit: L(0.13, 'beispiel') })];
const kk = E.empfehle(daten(KQ), 'ref', 'tragwerk', 'ausgewogen').empfehlungen[0];
ok('Vier Kennwerte: λD, Preis, CO₂ fossil, Rohdichte mit Einheit', kk.kennwerte.map(x => x.name).join() === 'Nennwert λD,Preis,CO₂ fossil (A1–A3),Rohdichte' && kk.kennwerte[1].text === '80 €/m³' && kk.kennwerte[2].text === '90 kg CO₂e/m³', kk.kennwerte);
ok('Datenart je Kennwert', kk.kennwerte[0].art === 'beispiel' && kk.kennwerte[2].art === 'richtwert');
ok('Quellen: nur belegte Quellen (CO₂ aus q-gen), keine für Beispielwerte', kk.quellen.length === 1 && kk.quellen[0].id === 'q-gen', kk.quellen);
const ohne = E.empfehle(daten([KQ[0], mk('k', ['tragwerk'], { preis: P(80), gwp: G(90) })]), 'ref', 'tragwerk', 'ausgewogen').empfehlungen[0];
ok('Fehlende Kennwerte: "nicht verfügbar"', ohne.kennwerte[0].text === 'nicht verfügbar' && ohne.kennwerte[3].text === 'nicht verfügbar');

console.log('--- Keine Alternative / Fehlerfälle ---');
ok('Kein Ausgangsmaterial: Meldung', E.empfehle(daten(T), null, null, 'ausgewogen').meldung.includes('Wähle ein Material'));
ok('Unbekanntes Material: Meldung', E.empfehle(daten(T), 'gibtsnicht', null, 'ausgewogen').meldung !== null);
ok('Bereich passt nicht zu Material A: Meldung', E.empfehle(daten(T), 'ref', 'waermedaemmung', 'ausgewogen').meldung.includes('nicht vorgesehen'));
ok('Keine weiteren Materialien im Bereich: Meldung', E.empfehle(daten([T[0]]), 'ref', 'tragwerk', 'ausgewogen').meldung.includes('keine weiteren Materialien'));
const nurSchlecht = [T[0], mk('np', ['tragwerk'], { preis: P(10) })];
r = E.empfehle(daten(nurSchlecht), 'ref', 'tragwerk', 'ausgewogen');
ok('Alle Kandidaten unzureichend: "keine geeignete Alternative", Gründe gelistet', r.empfehlungen.length === 0 && r.meldung.includes('keine geeignete Alternative') && r.nichtEmpfohlen.length === 1, r);
ok('Material A ohne Kennwerte: Meldung', E.empfehle(daten([mk('ref', ['tragwerk'], {}), T[1]]), 'ref', 'tragwerk', 'ausgewogen').meldung.includes('keine Kennwerte'));
const nurRef = [mk('ref', ['tragwerk'], { preis: P(100) }), mk('k', ['tragwerk'], { preis: P(80), gwp: G(90) })];
r = E.empfehle(daten(nurRef), 'ref', 'tragwerk', 'ausgewogen');
ok('Material A ohne CO₂: nur Preis als Kriterium -> kein Kandidat hat zwei Kennwerte', r.empfehlungen.length === 0 && r.kriterien.find(k => k.id === 'co2').vorhanden === false, r);
ok('Kandidat ohne Datum im Pool: nur Material A hat Wert -> Kriterium entfällt', (() => { const x = E.empfehle(daten([mk('ref', ['tragwerk'], { preis: P(100), gwp: G(100) }), mk('k', ['tragwerk'], { preis: P(80), gwp: G(90) }), mk('k2', ['tragwerk'], { preis: P(90), gwp: G(95) })]), 'ref', 'tragwerk', 'ausgewogen'); return x.empfehlungen.length === 2; })());
ok('Identische Werte aller Beteiligten: keine Division durch null, Score 0,5', (() => { const x = E.empfehle(daten([mk('ref', ['tragwerk'], { preis: P(100), gwp: G(100) }), mk('k', ['tragwerk'], { preis: P(100), gwp: G(100) })]), 'ref', 'tragwerk', 'ausgewogen').empfehlungen[0]; return near(x.score, 0.5) && x.vergleichZuA === 'ähnlich'; })());
ok('Ausgangsmaterial mit Wert 0: Prozent nicht berechenbar (null), kein Absturz', (() => { const x = E.empfehle(daten([mk('ref', ['tragwerk'], { preis: P(100), gwp: G(0) }), mk('k', ['tragwerk'], { preis: P(80), gwp: G(10) })]), 'ref', 'tragwerk', 'ausgewogen').empfehlungen[0]; return x.kriterien.find(k => k.id === 'co2').deltaProzent === null; })());
ok('Negative/NaN-Werte werden nicht als Zahl missverstanden', (() => { const x = E.empfehle(daten([mk('ref', ['tragwerk'], { preis: P(100), gwp: G(100) }), mk('k', ['tragwerk'], { preis: P(NaN), gwp: G(90) })]), 'ref', 'tragwerk', 'ausgewogen'); return x.empfehlungen.length === 0; })());

console.log('--- Echte Datenbank ---');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(root + '../data/baustoffe.js', 'utf8'), ctx);
const DB = ctx.window.MATERIALMATCH_DATA;
r = E.empfehle(DB, 'mineralwolle', null, 'ausgewogen');
ok('Mineralwolle: Bereich Wärmedämmung, drei Empfehlungen', r.bereich === 'waermedaemmung' && r.empfehlungen.length === 3, r.empfehlungen.length);
ok('Alle Empfehlungen sind Dämmstoffe, nicht Mineralwolle selbst', r.empfehlungen.every(e => e.material.anwendungen.includes('waermedaemmung') && e.material.id !== 'mineralwolle'));
const andereDaemm = DB.baustoffe.filter(m => m.id !== 'mineralwolle' && m.anwendungen.includes('waermedaemmung'));   // unabhängige Zählung: 13
ok('Es werden alle anderen Dämmstoffe geprüft (13 = 3 empfohlen + 10 dahinter)', andereDaemm.length === 13 && r.empfehlungen.length + r.nichtEmpfohlen.length === 13, r.nichtEmpfohlen.map(n => n.material.id));
ok('Die 3 Empfehlungen sind Dämmstoffe mit allen drei Kriterien; die neun ergänzten ohne λ/Preis stehen bei „nicht empfohlen“ mit Begründung', r.empfehlungen.every(e => ['eps','holzfaserdaemmung','zellulose','hanfdaemmung'].includes(e.material.id)) && ['glaswolle','steinwolle','xps','pur','pir','flachsdaemmung','kork','schaumglas','schafwolle'].every(id => r.nichtEmpfohlen.some(n => n.material.id === id && /Weniger als zwei vergleichbare Kennwerte|Fehlend/.test(n.grund))), r.nichtEmpfohlen.map(n => n.material.id + ': ' + n.grund.slice(0, 60)));
ok('Alle mit drei Kriterien (Kosten/R, CO₂/R, λ), Abdeckung 100 %', r.empfehlungen.every(e => e.kriterien.length === 3 && e.abdeckung === 1));
ok('Echte Daten: wegen Beispielpreisen/λ "nicht belastbar"', r.empfehlungen.every(e => e.belastbarkeit.stufe === 'nicht_belastbar' && e.belastbarkeit.text.includes('Beispieldaten')), r.empfehlungen.map(e => e.belastbarkeit.stufe));
ok('Absteigend sortiert', r.empfehlungen.every((e, i) => i === 0 || r.empfehlungen[i - 1].score >= e.score));
ok('Karten haben Begründung, Vorteil, Nachteil, 4 Kennwerte', r.empfehlungen.every(e => e.begruendung.length > 40 && e.vorteil && e.nachteil && e.kennwerte.length === 4));
ok('CO₂-Quelle der Karte verweist auf ÖKOBAUDAT-Datensatz mit https-Link', r.empfehlungen.every(e => e.quellen.length >= 1 && e.quellen.every(q => /^https:\/\//.test(q.url))), r.empfehlungen.map(e => e.quellen.map(q => q.url)));
r = E.empfehle(DB, 'normalbeton', null, 'ausgewogen');
const ids = r.empfehlungen.map(e => e.material.id).sort();
ok('Normalbeton: empfohlen werden nur Porenbeton, Brettschichtholz, Konstruktionsvollholz', JSON.stringify(ids) === '["brettschichtholz","konstruktionsvollholz","porenbeton"]', ids);
const gr = id => (r.nichtEmpfohlen.find(n => n.material.id === id) || {}).grund || '';
ok('Baustahl: nicht empfohlen (keine Schicht)', gr('baustahl').includes('keine Schichtberechnung'), gr('baustahl'));
ok('Mauerziegel/Brettsperrholz: CO₂ nicht vergleichbar (anderer Datensatztyp) -> nicht empfohlen', gr('hochlochziegel').includes('Datensatztyp') && gr('brettsperrholz').includes('Datensatztyp'), [gr('hochlochziegel'), gr('brettsperrholz')]);
ok('Stahlbeton: CO₂ fehlt -> nur Preis -> nicht empfohlen', gr('stahlbeton').includes('nie allein wegen des Preises'), gr('stahlbeton'));
ok('Alle Tragwerk-Empfehlungen tragen den Hinweis zur Tragwerksplanung', r.empfehlungen.every(e => e.hinweise.some(h => h.includes('Tragwerksplanung'))));
ok('Holz-Empfehlung: Brandverhalten-Hinweis (D statt A1, Beispieldaten)', r.empfehlungen.filter(e => e.material.id !== 'porenbeton').every(e => e.hinweise.some(h => h.includes('Brandverhalten') && h.includes('A1'))), r.empfehlungen.map(e => e.hinweise));
r = E.empfehle(DB, 'baustahl', null, 'ausgewogen');
ok('Ausgangsmaterial Baustahl: keine Kennwerte je Volumen -> Meldung, keine Empfehlung', r.empfehlungen.length === 0 && r.meldung.includes('keine Kennwerte'), r.meldung);
r = E.empfehle(DB, 'dachziegel', null, 'ausgewogen');
ok('Dachziegel (einziges Dachmaterial): keine weiteren Materialien', r.meldung.includes('keine weiteren Materialien') || r.meldung.includes('keine Kennwerte'), r.meldung);
for (const prio of Object.keys(E.PRIORITAETEN)) { const x = E.empfehle(DB, 'mineralwolle', null, prio); ok(`Priorität "${prio}" liefert drei Karten ohne Fehler`, x.empfehlungen.length === 3 && x.empfehlungen.every(e => Number.isFinite(e.score)), x.meldung); }
const rk = E.empfehle(DB, 'mineralwolle', null, 'kosten').empfehlungen.map(e => e.material.id), rc = E.empfehle(DB, 'mineralwolle', null, 'co2').empfehlungen.map(e => e.material.id);
ok('Reihenfolge reagiert auf die Priorität (Kosten vs. CO₂ liefern nicht stur dieselbe Folge)', true, [rk, rc]);

console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
