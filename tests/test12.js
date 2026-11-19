const PROJ = require('path').resolve(__dirname, '..');
const AUSGABE = require('path').join(require('os').tmpdir(), 'materialmatch-tests') + '/';
require('fs').mkdirSync(AUSGABE, { recursive: true });
const { chromium } = require('playwright');
require('./_offline.js');
let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 420))); }

// Unabhängige Farbberechnung im Test (nicht der App-Code): fünf Stützfarben aus dem Master-Prompt
const ST = [[0,'951F2B'],[0.25,'E68B43'],[0.5,'E9C94E'],[0.75,'78B85A'],[1,'17643A']];
const rgb = h => [0,2,4].map(i => parseInt(h.substr(i,2),16));
function farbe(s) { s = Math.min(1, Math.max(0, s)); for (let i = 1; i < 5; i++) if (s <= ST[i][0]) { const t = (s-ST[i-1][0])/(ST[i][0]-ST[i-1][0]); const a = rgb(ST[i-1][1]), b = rgb(ST[i][1]); return '#' + a.map((x,k) => Math.round(x+(b[k]-x)*t).toString(16).padStart(2,'0')).join('').toUpperCase(); } }
const GRAU = '#B8BEC4', NEUTRAL = '#7C8A99';
const nied = (v, all) => { const mx = Math.max(...all), mn = Math.min(...all); return farbe((mx - v) / (mx - mn)); };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  p.on('pageerror', e => errors.push(String(e)));
  await p.goto('file://' + PROJ + '/index.html?modus=demo'); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
  await p.evaluate(() => MM.diagramme.zeigeWeitere(true));
  await p.evaluate(() => document.querySelectorAll('main section.panel > details').forEach(d => { d.open = true; }));

  const E = id => p.evaluate(i => JSON.parse(JSON.stringify(MATERIALMATCH_DATA.baustoffe.find(x => x.id === i).eigenschaften)), id);
  const waehle = (a, b_, c = '') => p.evaluate(([a, b_, c]) => MM.auswahl.setzeAuswahl({ a, b: b_, c }), [a, b_, c]);
  const eingabe = async (f, d) => { await p.fill('#flaeche', f); await p.fill('#dicke', d); };
  const chart = id => p.$eval(`figure[data-chart="${id}"]`, f => ({
    rows: [...f.querySelectorAll('.chart-row:not(.chart-axis)')].map(r => ({ m: r.dataset.material, wert: r.dataset.wert === '' ? null : Number(r.dataset.wert), farbe: r.dataset.farbe, bew: r.dataset.bewertung,
      bar: r.querySelector('.chart-bar') ? { left: parseFloat(r.querySelector('.chart-bar').style.left), width: parseFloat(r.querySelector('.chart-bar').style.width), bg: r.querySelector('.chart-bar').style.background } : null,
      track: r.querySelector('.chart-track').className, wertText: r.querySelector('.chart-value').innerText.replace(/\s+/g, ' ').trim() })),
    text: f.innerText.replace(/\s+/g, ' '), warn: [...f.querySelectorAll('.warn')].map(w => w.textContent), notes: [...f.querySelectorAll('.chart-note')].map(n => n.textContent),
    zero: f.querySelector('.chart-zero') ? parseFloat(f.querySelector('.chart-zero').style.left) : null, ticks: [...f.querySelectorAll('.tick')].map(t => t.textContent) }));
  const hex = s => { const m = s.match(/rgb\((\d+), (\d+), (\d+)\)/); return m ? '#' + [1,2,3].map(i => Number(m[i]).toString(16).padStart(2,'0')).join('').toUpperCase() : s.toUpperCase(); };

  // ---- Grundzustand
  check('Ohne Auswahl: Hinweis statt Diagramme', (await p.$eval('#diagramme-inhalt', e => e.innerText)).includes('Wähle Materialien aus'));
  check('Pflichtsatz zur relativen Bewertung steht im Bereich', (await p.$eval('#diagramme', e => e.innerText.replace(/\s+/g, ' '))).includes('Die Farben zeigen eine relative Bewertung der ausgewählten Materialien und stellen keine allgemeingültige Aussage über deren Qualität dar.'));

  // ---- Fall 1: Dämmstoffe, drei Materialien
  await waehle('mineralwolle', 'eps', 'holzfaserdaemmung');
  check('Ohne Fläche/Dicke: nur das λ-Diagramm (braucht keine Menge) + Hinweis, dass Kosten, CO₂ und Gewicht nach der Eingabe erscheinen (berechnete Gesamtwerte)', JSON.stringify(await p.$$eval('figure.chart', f => f.map(x => x.dataset.chart))) === '["lambda"]' && (await p.$eval('#diagramme-inhalt', e => e.innerText)).includes('Kosten, CO₂ und Gewicht erscheinen, sobald Fläche und Dicke eingegeben sind'));
  await eingabe('100', '20');
  check('Mit Eingaben: fünf Diagramme (vier Hauptdiagramme in der Reihenfolge des Dashboards: Kosten, CO₂ fossil, Gewicht, λ; danach CO₂ gesamt als „weiteres Kennwert“)', JSON.stringify(await p.$$eval('figure.chart', f => f.map(x => x.dataset.chart))) === '["kosten","co2-fossil","gewicht","lambda","co2-gesamt"]');
  const mw = await E('mineralwolle'), eps = await E('eps'), hf = await E('holzfaserdaemmung');

  let c = await chart('kosten'); const pv = [mw.preis.wert * 20, eps.preis.wert * 20, hf.preis.wert * 20];   // Gesamtkosten = 20 m³ × Preis je m³
  check('Kosten: Farben aus relativer Bewertung (niedrig = grün)', c.rows.every((r, i) => hex(r.farbe) === nied(pv[i], pv)), c.rows.map(r => r.farbe));
  check('Kosten: günstigster Balken exakt Dunkelgrün #17643A, teuerster exakt Dunkelrot #951F2B', c.rows[1].farbe === '#17643A' && c.rows[2].farbe === '#951F2B', c.rows.map(r => r.farbe));
  check('Kosten: Balkenfarbe im Balken selbst gesetzt', c.rows.every(r => hex(r.bar.bg) === r.farbe), c.rows.map(r => [r.bar.bg, r.farbe]));
  const maxP = Math.max(...pv);
  check('Kosten: Balkenlänge proportional zum Wert (Achse ab 0)', c.rows.every((r, i) => Math.abs(r.bar.width - pv[i] / maxP * 100) < 0.01 && r.bar.left === 0), c.rows.map(r => r.bar));
  check('Kosten: berechnete Gesamtsumme rechts (20 m³ × 85 €/m³ = 1.700 €; 20 × 220 = 4.400 €), nicht der Einheitspreis', c.rows[0].wertText.startsWith('1.700 €') && c.rows[1].wertText.startsWith('1.400 €') && c.rows[2].wertText.startsWith('4.400 €') && c.rows[0].wertText.endsWith('B'), c.rows.map(r => r.wertText));
  const detailK = await p.$$eval('figure[data-chart="kosten"] .chart-detail', e => e.map(x => x.textContent));
  check('Kosten: unter jedem Namen steht die Rechnung „Menge × Einheitspreis“ (20 m³ × 85 €/m³ …)', JSON.stringify(detailK) === JSON.stringify(['20 m³ × 85 €/m³', '20 m³ × 70 €/m³', '20 m³ × 220 €/m³']), detailK);
  const annK = await p.$eval('figure[data-chart="kosten"] details.chart-annahmen', d => ({ titel: d.querySelector('summary').textContent, text: d.textContent.replace(/\s+/g, ' '), offen: d.open }));
  check('Kosten: einklappbarer Block „Zugrunde liegende Mengen und Annahmen“ (anfangs zu) nennt Eingabe, Umrechnung der Menge je Preiseinheit, Mehrwertsteuer und Leistungsumfang', annK.titel === 'Zugrunde liegende Mengen und Annahmen' && !annK.offen && /100 m² × 20 cm = 20 m³ Volumen/.test(annK.text) && /€\/kg → Gewicht \(Volumen × Rohdichte\)/.test(annK.text) && /Mehrwertsteuer unbekannt/.test(annK.text) && /Leistungsumfang \(Material, Transport, Einbau\) unbekannt/.test(annK.text), annK);
  check('Kosten: Warnung „Kein belastbarer direkter Vergleich möglich“ (Mehrwertsteuer/Leistungsumfang unbekannt) und Beispielpreise (Demo) gekennzeichnet', c.warn.some(w => w.includes('Kein belastbarer direkter Vergleich möglich') && w.includes('Mehrwertsteuer')) && c.text.includes('Beispielwerte (Demo), keine Marktpreise'));
  check('Kosten: Bewertungswort für Screenreader/Tooltip', c.rows[1].bew === 'vergleichsweise günstig' && c.rows[2].bew === 'vergleichsweise ungünstig', c.rows.map(r => r.bew));

  c = await chart('co2-fossil'); const fv = [mw.gwp.werte.fossil * 20, eps.gwp.werte.fossil * 20, hf.gwp.werte.fossil * 20];   // je m³ × 20 m³
  check('CO₂ fossil: bewertet (gleiche Basis), Farben aus Datenbankwerten', c.rows.every((r, i) => hex(r.farbe) === nied(fv[i], fv)), c.rows.map(r => r.farbe));
  check('CO₂ fossil: Gesamtmenge in kg CO₂e (66,4 × 20 m³ ≈ 1.329) und Kürzel R', c.rows[0].wertText.startsWith('1.329 kg CO₂e') && c.rows[0].wertText.endsWith('R'), c.rows[0].wertText);
  const detailC = await p.$$eval('figure[data-chart="co2-fossil"] .chart-detail', e => e.map(x => x.textContent));
  check('CO₂ fossil: darunter die Rechnung „Menge × Kennwert · Module A1-A3“', detailC[0].startsWith('20 m³ × 66,4 kg CO₂e/m³') && detailC[0].endsWith('Module A1-A3'), detailC);
  const annC = await p.$eval('figure[data-chart="co2-fossil"] details.chart-annahmen', d => d.textContent.replace(/\s+/g, ' '));
  check('CO₂: Annahmen nennen Menge, Bezugsgröße-Regel, Module A1-A3 (Herstellung), nicht enthaltene Phasen und Datensatztyp', /20 m³ Volumen/.test(annC) && /je kg → Gewicht/.test(annC) && /A1-A3 \(Herstellung\)/.test(annC) && /Nutzung, Rückbau und Gutschriften sind nicht enthalten/.test(annC) && /generischer Datensatz/.test(annC), annC);

  c = await chart('co2-gesamt');
  check('CO₂ gesamt: wegen Biogen nicht bewertet (alle grau)', c.rows.every(r => r.farbe === GRAU && r.bew === 'nicht bewertet'), c.rows.map(r => [r.farbe, r.bew]));
  check('CO₂ gesamt: Begründung genannt (biogener Kohlenstoff, fossile Emissionen maßgeblich)', c.text.includes('Biogener Kohlenstoff ist enthalten') && c.text.includes('fossilen Emissionen'));
  const gv = [mw.gwp.werte.gesamt, eps.gwp.werte.gesamt, hf.gwp.werte.gesamt];
  const mn = Math.min(0, ...gv), mx = Math.max(0, ...gv), sp = mx - mn;
  check('CO₂ gesamt: Nulllinie an der richtigen Stelle (Achse mit negativem Wert)', Math.abs(c.zero - (0 - mn) / sp * 100) < 0.01, [c.zero, (0 - mn) / sp * 100]);
  check('CO₂ gesamt: Holzfaser-Balken liegt links der Nulllinie und endet an ihr', c.rows[2].bar.left < c.zero && Math.abs(c.rows[2].bar.left + c.rows[2].bar.width - c.zero) < 0.01, c.rows[2].bar);
  check('CO₂ gesamt: positive Balken beginnen an der Nulllinie, Länge proportional', c.rows.slice(0, 2).every((r, i) => Math.abs(r.bar.left - c.zero) < 0.01 && Math.abs(r.bar.width - gv[i] / sp * 100) < 0.01), c.rows.map(r => r.bar));
  check('CO₂ gesamt: Achsenbeschriftung min / 0 / max', c.ticks.length === 3 && c.ticks[1] === '0', c.ticks);

  c = await chart('lambda'); const lv = [mw.waermeleitfaehigkeit.wert, eps.waermeleitfaehigkeit.wert, hf.waermeleitfaehigkeit.wert];
  check('λ: bei Dämmstoffen bewertet, gleiche Werte = gleiche Farbe', hex(c.rows[0].farbe) === hex(c.rows[1].farbe) && c.rows.every((r, i) => hex(r.farbe) === nied(lv[i], lv)), c.rows.map(r => r.farbe));
  check('λ: Mineralwolle (Herstellerwert) mit R, Holzfaser (Beispielwert) ausdrücklich gekennzeichnet (B + Hinweis)', c.rows[0].wertText.endsWith('R') && c.rows[2].wertText.endsWith('B') && c.text.includes('Beispieldaten und nicht belastbar'), c.rows.map(r => r.wertText));

  c = await chart('gewicht'); const gw = [mw, eps, hf].map(e => 20 * e.rohdichte.wert);
  check('Gewicht ohne Priorität: neutral grau, nicht bewertet', c.rows.every(r => r.farbe === GRAU) && c.text.includes('Nicht bewertet'), c.rows.map(r => r.farbe));
  check('Gewicht: Balkenlängen proportional zu 20 m³ × Rohdichte', c.rows.every((r, i) => Math.abs(r.bar.width - gw[i] / Math.max(...gw) * 100) < 0.01), c.rows.map(r => r.bar.width));
  check('Gewicht: Werte 925 / 500 / 3.200 kg', c.rows.map(r => r.wertText.split(' kg')[0]).join('|') === '925|500|3.200', c.rows.map(r => r.wertText));
  await p.evaluate(() => MM.diagramme.setzePrioritaet('gewicht'));
  c = await chart('gewicht');
  check('Gewicht mit Priorität "gewicht": leichtestes grün, schwerstes rot', c.rows.every((r, i) => hex(r.farbe) === nied(gw[i], gw)) && c.rows[1].farbe === '#17643A' && c.rows[2].farbe === '#951F2B', c.rows.map(r => r.farbe));
  await p.evaluate(() => MM.diagramme.setzePrioritaet('ausgewogen'));
  check('Priorität zurückgesetzt: wieder grau', (await chart('gewicht')).rows.every(r => r.farbe === GRAU));

  // gleiche Balkenhöhe
  const hoehen = await p.$$eval('.chart-track', t => [...new Set(t.map(x => Math.round(x.getBoundingClientRect().height)))]);
  check('Einheitliche Balkenhöhe in allen Diagrammen', hoehen.length === 1, hoehen);

  // ---- Fall 2: Beton + Baustahl (Baustahl ohne Schichtmodell: Preis je kg und CO₂ je kg lassen sich nicht auf Volumen beziehen)
  await waehle('normalbeton', 'baustahl');
  c = await chart('kosten');
  check('Beton + Baustahl Kosten: Beton 4.090 € (20 m³ × 204,50 €/m³, Holcim-Listenpreis), Baustahl „nicht berechenbar“ (kein Schichtmodell), einziger Wert nicht bewertet', c.rows[0].wertText.startsWith('4.090 €') && c.rows[0].bew === 'nicht bewertet' && c.rows[1].wertText === 'nicht berechenbar' && c.rows[1].bar === null && c.rows[1].track.includes('missing'), c.rows.map(r => [r.wertText, r.bew]));
  c = await chart('co2-fossil');
  check('Beton + Baustahl CO₂ fossil: Baustahl „nicht berechenbar“, „mindestens zwei berechenbare CO₂-Mengen nötig“', c.rows[1].wertText === 'nicht berechenbar' && c.text.includes('mindestens zwei berechenbare CO₂-Mengen'), c.rows.map(r => r.wertText));
  c = await chart('lambda');
  check('λ Beton/Stahl: Balken gezeichnet, aber grau, Hinweis "nur zwischen Dämmstoffen"', c.rows.every(r => r.bar && r.farbe === GRAU) && c.text.includes('nur zwischen Dämmstoffen'), c.rows.map(r => r.farbe));
  c = await chart('gewicht');
  check('Baustahl im Gewichtsdiagramm: "nicht berechenbar", gestrichelte Spur, kein Balken', c.rows[1].bar === null && c.rows[1].wertText === 'nicht berechenbar' && c.rows[1].track.includes('missing'), c.rows[1]);
  check('Beton im Gewichtsdiagramm: 46.000 kg Balken', c.rows[0].wertText.startsWith('46.000 kg') && c.rows[0].bar.width === 100, c.rows[0]);

  // ---- Fall 2b: Aluminiumblech (CO₂ je kg) + Kalkzementputz (CO₂ je m³), beide Fassade: durch die Mengenrechnung vergleichbar (20 m³ × 2.700 kg/m³ = 54.000 kg)
  await waehle('aluminium', 'kalkzementputz');
  const al = await E('aluminium'), kp = await E('kalkzementputz');
  c = await chart('co2-fossil');
  const alFossil = 20 * 2700 * al.gwp.werte.fossil, kpFossil = 20 * kp.gwp.werte.fossil;
  check('Aluminium (Kennwert je kg) + Putz (je m³): beide Gesamtmengen berechnet – Aluminium 54.000 kg × Kennwert ≈ 579.000 kg, Putz 20 m³ × Kennwert ≈ 7.087 kg – und bewertet (Putz grün, Aluminium rot)', Math.abs(c.rows[0].wert - alFossil) < 1e-6 * alFossil && Math.abs(c.rows[1].wert - kpFossil) < 1e-6 * kpFossil && c.rows[1].farbe === '#17643A' && c.rows[0].farbe === '#951F2B' && c.rows[0].bar && !c.text.includes('Kein belastbarer'), c.rows.map(r => [r.wert, r.farbe]));
  const dAl = await p.$$eval('figure[data-chart="co2-fossil"] .chart-detail', e => e.map(x => x.textContent));
  check('Aluminium + Putz: Rechnung zeigt die Umrechnung „54.000 kg × … kg CO₂e/kg (Menge = Gewicht)“', dAl[0].startsWith('54.000 kg × 10,7 kg CO₂e/kg (Menge = Gewicht)') && dAl[1].startsWith('20 m³ × '), dAl);

  // ---- Fall 2c: Beton (generisch) + Hochlochziegel (Branchendurchschnitt): verschiedene Datensatztypen
  await waehle('normalbeton', 'hochlochziegel');
  c = await chart('co2-fossil');
  check('Beton + Ziegel: verschiedene Datensatztypen → Warnung „Kein belastbarer direkter Vergleich möglich“ mit Sicherheitszuschlägen, Balken grau', c.warn.length === 1 && c.warn[0].includes('Datensatztypen') && c.warn[0].includes('Sicherheitszuschl') && c.rows.every(r => r.farbe === GRAU), c);

  // ---- Fall 3: Beton + BSH (beide generisch, gleiche Einheit)
  await waehle('normalbeton', 'brettschichtholz');
  const nb = await E('normalbeton'), bsh = await E('brettschichtholz');
  c = await chart('co2-fossil'); const f2 = [nb.gwp.werte.fossil, bsh.gwp.werte.fossil];
  check('Beton/BSH CO₂ fossil: bewertet, Beton grün, BSH rot', c.rows[0].farbe === '#17643A' && c.rows[1].farbe === '#951F2B' && f2[0] < f2[1], c.rows.map(r => r.farbe));
  c = await chart('co2-gesamt');
  check('Beton/BSH CO₂ gesamt: nicht bewertet (Biogen), BSH-Balken negativ', c.rows.every(r => r.farbe === GRAU) && c.rows[1].bar.left < c.zero, c);
  c = await chart('kosten');
  check('Beton/BSH Kosten: gleiche Einheit -> bewertet', c.rows[0].farbe === '#17643A' && c.rows[1].farbe === '#951F2B', c.rows.map(r => r.farbe));
  check('Nur zwei Materialien: deutlicher Hinweis auf relative Bewertung', (await p.$eval('#diagramme-inhalt > .warn', e => e.textContent)).includes('Nur zwei Materialien') && (await p.$eval('#diagramme-inhalt > .warn', e => e.textContent)).includes('rein relativ'));

  // ---- Fall 4: Beton + Porenbeton (kein Biogen) -> CO₂ gesamt bewertet
  await waehle('normalbeton', 'porenbeton');
  const pb = await E('porenbeton'); c = await chart('co2-gesamt'); const g2 = [nb.gwp.werte.gesamt, pb.gwp.werte.gesamt];
  check('Beton/Porenbeton CO₂ gesamt: ohne Biogen bewertet (Porenbeton = niedriger = grün)', c.rows[1].farbe === '#17643A' && c.rows[0].farbe === '#951F2B' && g2[1] < g2[0], c.rows.map(r => r.farbe));

  // ---- Fall 5: generisch gegen repräsentativ -> grau
  await waehle('normalbeton', 'brettsperrholz');
  c = await chart('co2-fossil');
  check('Beton (generisch) + BSP (repräsentativ): grau, Balken vorhanden, Warnung Datensatztypen', c.rows.every(r => r.farbe === GRAU && r.bar) && c.warn.some(w => w.includes('Datensatztypen') && w.includes('grau und nicht bewertet')), c);

  // ---- Anzahl Materialien: Hinweise
  await waehle('eps', '');
  check('Ein Material: Hinweis, keine relative Bewertung, Balken grau', (await p.$eval('#diagramme-inhalt > .warn', e => e.textContent)).includes('nur einem Material') && (await chart('kosten')).rows[0].farbe === GRAU);
  check('Ein Material: Hinweis "mindestens zwei Werte" am Diagramm', (await chart('kosten')).text.includes('mindestens zwei Werte'));
  await waehle('mineralwolle', 'eps', 'holzfaserdaemmung');
  check('Drei Materialien: kein Zwei-Materialien-Hinweis', (await p.$$('#diagramme-inhalt > .warn')).length === 0);

  // ---- Identische und nahezu identische Werte
  await p.evaluate(() => { const L = id => MATERIALMATCH_DATA.baustoffe.find(m => m.id === id).eigenschaften.waermeleitfaehigkeit; L('eps').wert = L('mineralwolle').wert; L('holzfaserdaemmung').wert = L('mineralwolle').wert; MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: 'holzfaserdaemmung' }); });
  c = await chart('lambda');
  check('Identische Werte: alle neutral, Hinweis', c.rows.every(r => r.farbe === NEUTRAL && r.bew === 'gleichwertig') && c.text.includes('identisch'), c.rows.map(r => r.farbe));
  await p.evaluate(() => { const L = id => MATERIALMATCH_DATA.baustoffe.find(m => m.id === id).eigenschaften.waermeleitfaehigkeit; L('eps').wert = 0.0352; L('holzfaserdaemmung').wert = 0.0351; L('mineralwolle').wert = 0.035; MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: 'holzfaserdaemmung' }); });
  c = await chart('lambda');
  check('Unterschied unter 2 %: neutral "praktisch gleich"', c.rows.every(r => r.farbe === NEUTRAL) && c.text.includes('praktisch gleich'), c.rows.map(r => r.farbe));
  await p.evaluate(() => { const L = id => MATERIALMATCH_DATA.baustoffe.find(m => m.id === id).eigenschaften.waermeleitfaehigkeit; L('mineralwolle').wert = 0.035; L('holzfaserdaemmung').wert = 0.0351; L('eps').wert = 0.036; MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: 'holzfaserdaemmung' }); });
  c = await chart('lambda');
  check('Unterschied über 2 % (0,035 gegen 0,036 = 2,8 %): bewertet', c.rows[0].farbe === '#17643A' && c.rows[1].farbe === '#951F2B', c.rows.map(r => r.farbe));
  check('Zwischenwert 0,0351 liegt farblich zwischen Grün und Rot (gleiche Rechnung wie im Test)', hex(c.rows[2].farbe) === nied(0.0351, [0.035, 0.036, 0.0351]), c.rows[2].farbe);

  // ---- Fehlende Werte
  await waehle('normalbeton', 'stahlbeton');
  c = await chart('co2-fossil');
  check('Stahlbeton ohne CO₂: kein Balken, "fehlt", gestrichelte Spur', c.rows[1].bar === null && c.rows[1].wertText === 'fehlt' && c.rows[1].track.includes('missing') && c.rows[1].bew === 'fehlt', c.rows[1]);
  check('Nur ein CO₂-Wert vorhanden: nicht bewertet, Begründung', c.rows[0].farbe === GRAU && c.text.includes('mindestens zwei berechenbare CO₂-Mengen'), c);
  await waehle('dachziegel', 'klinker');
  c = await chart('kosten');
  check('Dachziegel ohne Preis: "fehlt", Spur gestrichelt', c.rows[0].wertText === 'fehlt' && c.rows[0].bar === null && c.rows[0].track.includes('missing'), c.rows[0]);
  check('Dachziegel + Klinker: kein gemeinsamer Anwendungsbereich -> nicht bewertet, Grund genannt', c.rows[1].farbe === GRAU && c.text.includes('keinen gemeinsamen Anwendungsbereich'), c.text);
  c = await chart('co2-fossil');
  check('Dachziegel (CO₂ je m² → Fläche) gegen Klinker (je m³ → Volumen): beide Gesamtmengen berechnet (1.655 kg und 11.122 kg), ohne gemeinsamen Anwendungsbereich aber grau mit Begründung', c.rows.every(r => r.bar && r.farbe === GRAU) && c.rows[0].wertText.startsWith('1.655 kg') && c.rows[1].wertText.startsWith('11.122 kg') && c.text.includes('keinen gemeinsamen Anwendungsbereich'), c);
  c = await chart('lambda');
  check('λ Dachziegel fehlt (Dachziegel ist kein Dämmstoff)', c.rows[0].wertText === 'fehlt');

  await p.evaluate(() => { MATERIALMATCH_DATA.baustoffe.find(m => m.id === 'eps').eigenschaften.preis.wert = null; MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: '' }); });
  c = await chart('kosten');
  check('Gemeinsamer Bereich, aber nur ein Preis: "mindestens zwei Werte", grau', c.rows[0].farbe === GRAU && c.rows[1].wertText === 'fehlt' && c.text.includes('mindestens zwei Werte'), c);

  // ---- Eingaben ändern -> Gewichtsdiagramm
  await waehle('mineralwolle', 'eps', 'holzfaserdaemmung');
  await eingabe('50', '10');
  c = await chart('gewicht');
  check('Gewichtsdiagramm aktualisiert sich (50 m² × 10 cm = 5 m³)', c.rows[0].wertText.startsWith(String(Math.round(5 * mw.rohdichte.wert))) && /50 m² × 10 cm/.test(c.text), c.rows[0].wertText);
  await p.fill('#flaeche', '-3');
  check('Ungültige Eingabe: Kosten-, CO₂- und Gewichtsdiagramm verschwinden (sie brauchen die Menge), das λ-Diagramm bleibt', JSON.stringify(await p.$$eval('figure.chart', f => f.map(x => x.dataset.chart))) === '["lambda"]' && (await p.$eval('#diagramme-inhalt', e => e.innerText)).includes('erscheinen, sobald Fläche und Dicke eingegeben sind'));
  await p.fill('#flaeche', '100'); await p.fill('#dicke', '20');

  // ---- Legende
  const leg = await p.$eval('.legend', l => ({ bg: l.querySelector('.legend-scale').style.background, labels: [...l.querySelectorAll('.legend-labels span')].map(s => s.textContent), items: [...l.querySelectorAll('.legend-items li')].map(i => i.textContent.trim()), text: l.innerText }));
  const reihenfolge = ['#17643A', '#78B85A', '#E9C94E', '#E68B43', '#951F2B'].map(h => { const r = rgb(h.slice(1)); return `rgb(${r.join(', ')})`; });
  const idx = reihenfolge.map(r => leg.bg.indexOf(r));
  check('Legende: Verlauf Dunkelgrün → Hellgrün → Gelb → Orange → Dunkelrot (in dieser Reihenfolge)', idx.every((v, i) => v >= 0 && (i === 0 || v > idx[i - 1])), leg.bg);
  check('Legende: Wörter vergleichsweise günstig … vergleichsweise ungünstig', JSON.stringify(leg.labels) === '["vergleichsweise günstig","eher günstig","mittlerer Bereich","eher ungünstig","vergleichsweise ungünstig"]', leg.labels);
  check('Legende: gleichwertig / nicht bewertet / fehlt erklärt', leg.items.length === 3 && leg.items[0].includes('gleichwertig') && leg.items[1].includes('nicht bewertet') && leg.items[2].includes('fehlt'), leg.items);

  // ---- Sicherheit
  await p.evaluate(() => { MATERIALMATCH_DATA.baustoffe.find(x => x.id === 'eps').name = '<img src=x onerror="window.__x=1">EPS'; MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: '' }); });
  check('HTML im Materialnamen wird im Diagramm nicht ausgeführt', await p.evaluate(() => !window.__x && document.querySelectorAll('#diagramme-inhalt img').length === 0));

  check('Keine Konsolenfehler', errors.length === 0, errors);

  // ---- Darstellung auf drei Breiten
  for (const w of [1280, 768, 375]) {
    const m = await b.newPage({ viewport: { width: w, height: 800 } });
    await m.goto('file://' + PROJ + '/index.html?modus=demo'); await m.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
    await m.evaluate(() => MM.diagramme.zeigeWeitere(true));
    await m.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'konstruktionsvollholz', b: 'brettsperrholz', c: 'hochlochziegel' }));
    await m.fill('#flaeche', '100'); await m.fill('#dicke', '20');
    const r = await m.evaluate(() => {
      const probleme = [];
      document.querySelectorAll('.chart-row:not(.chart-axis)').forEach(row => {
        const l = row.querySelector('.chart-label').getBoundingClientRect(), t = row.querySelector('.chart-track').getBoundingClientRect(), v = row.querySelector('.chart-value').getBoundingClientRect();
        const horizUeberlapp = !(l.bottom <= t.top + 1) && (l.right > t.left + 1 && l.left < t.right - 1);   // Label überdeckt den Balken
        const werteBreit = t.width < 60;
        if (horizUeberlapp || werteBreit || v.right > document.documentElement.clientWidth + 1 || t.width <= 0) probleme.push({ horizUeberlapp, werteBreit, tw: Math.round(t.width) });
      });
      const werteCut = [...document.querySelectorAll('.chart-value')].filter(x => x.scrollWidth > x.clientWidth + 1).length;
      const bars = [...document.querySelectorAll('.chart-bar')].filter(x => { const bb = x.getBoundingClientRect(), tt = x.parentElement.getBoundingClientRect(); return bb.left < tt.left - 1 || bb.right > tt.right + 1; }).length;
      return { probleme, werteCut, bars, seite: document.documentElement.scrollWidth <= document.documentElement.clientWidth, anzahl: document.querySelectorAll('.chart-row:not(.chart-axis)').length };
    });
    check(`Breite ${w}: ${r.anzahl} Zeilen, keine Überlappung, Balken nicht zu schmal`, r.anzahl === 15 && r.probleme.length === 0, r);
    check(`Breite ${w}: Zahlenwerte nicht abgeschnitten, Balken liegen in der Spur`, r.werteCut === 0 && r.bars === 0, r);
    check(`Breite ${w}: Seite scrollt nicht seitlich`, r.seite);
    if (w === 375) await m.locator('#diagramme').screenshot({ path: AUSGABE + 'v6_mobile.png' });
    if (w === 1280) await m.locator('#diagramme').screenshot({ path: AUSGABE + 'v6_desktop_holz.png' });
  }

  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
  await b.close();
})();
