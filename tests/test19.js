const PROJ = require('path').resolve(__dirname, '..');
const AUSGABE = require('path').join(require('os').tmpdir(), 'materialmatch-tests') + '/';
require('fs').mkdirSync(AUSGABE, { recursive: true });
const { chromium } = require('playwright');
require('./_offline.js');
let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 500))); }

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  p.on('pageerror', e => errors.push(String(e)));
  await p.goto('file://' + PROJ + '/index.html?modus=demo'); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
  await p.evaluate(() => document.querySelectorAll('main section.panel > details, #quellen > details.sub').forEach(d => { d.open = true; }));
  const waehle = (a, b_ = '', c = '') => p.evaluate(([a, b_, c]) => MM.auswahl.setzeAuswahl({ a, b: b_, c }), [a, b_, c]);
  const txt = sel => p.$eval(sel, e => e.innerText.replace(/\s+/g, ' '));

  // ---- Aufbau
  const heads = await p.$$eval('#quellen-inhalt > div > h3', h => h.map(x => x.textContent));
  check('Erweiterte Datenbankinformationen: fünf Abschnitte Datenstand, Datenqualität auf einen Blick, Produkte, Quellen, Check (die Datenarten stehen jetzt unter „Datenqualität und Kennzeichnungen“)', JSON.stringify(heads) === JSON.stringify(['Datenstand', 'Datenqualität auf einen Blick', 'Produkte', 'Quellen', 'Nachvollziehbarkeits-Check']), heads);
  check('Der Reiter „Quellen & Details“ hat vier einklappbare Bereiche: Datenqualität und Kennzeichnungen; Wie berechnet MaterialMatch die Ergebnisse?; Erweiterte Datenbankinformationen; Rechtliche und fachliche Hinweise', JSON.stringify(await p.$$eval('#quellen > details.sub > summary', s => s.map(x => x.textContent.trim()))) === JSON.stringify(['Datenqualität und Kennzeichnungen', 'Wie berechnet MaterialMatch die Ergebnisse?', 'Erweiterte Datenbankinformationen', 'Rechtliche und fachliche Hinweise']));

  // ---- Datenstand
  const db = await p.evaluate(() => ({ v: MATERIALMATCH_DATA.meta.version, s: MATERIALMATCH_DATA.meta.datenstand, n: MATERIALMATCH_DATA.baustoffe.length, k: MATERIALMATCH_DATA.kategorien.length, h: MATERIALMATCH_DATA.meta.hinweis, ab: MATERIALMATCH_DATA.quellen.find(q => q.id === 'oekobaudat').abgerufen }));
  const ds = await txt('#quellen-inhalt > div:first-child');
  check('Datenstand: Version, Datum, Anzahl der Baustoffe und Kategorien', ds.includes(`Version ${db.v}, Datenstand ${db.s}`) && ds.includes(`${db.n} Baustoffe in ${db.k} Kategorien`), ds);
  check('Datenstand: ÖKOBAUDAT mit Abrufdatum und Hinweis zum Update des generischen Bestands', ds.includes('abgerufen ' + db.ab) && ds.includes('02.10.2024'), ds);
  check('Datenstand: Hinweis zu den Beispieldaten steht dabei', ds.includes(db.h.slice(0, 40)));
  check('Datenstand: ÖKOBAUDAT-Link https, neuer Tab, noopener', await p.$eval('#quellen-inhalt > div:first-child a', a => /^https:\/\/www\.oekobaudat\.de\//.test(a.href) && a.target === '_blank' && a.rel.includes('noopener')));
  check('Fußzeile nennt Datenstand, Version und ÖKOBAUDAT-Release', (await txt('#datenstand')) === `Datenstand ${db.s} · Datenbank-Version ${db.v} · ÖKOBAUDAT 2024-II, abgerufen ${db.ab}`, await txt('#datenstand'));

  // ---- Datenqualität: unabhängig nachgezählt
  const roh = await p.evaluate(() => MATERIALMATCH_DATA.baustoffe.map(m => ({ name: m.name, e: JSON.parse(JSON.stringify(m.eigenschaften)) })));
  const KEYS = ['rohdichte', 'waermeleitfaehigkeit', 'waermeleitfaehigkeit_bemessung', 'druckfestigkeit', 'preis', 'gwp', 'brandverhalten', 'wasserdampf_mu', 'waermekapazitaet', 'recycling'];
  const symbol = e => { if (!e) return '–'; if (e.nicht_anwendbar) return 'n. a.'; const hat = 'werte' in e ? e.werte !== null : e.wert !== null && e.wert !== undefined; if (!hat) return '–'; return { richtwert: 'R', beispiel: 'B', verifiziert: 'V' }[e.art] || '?'; };
  const erwartet = roh.map(m => KEYS.map(k => symbol(m.e[k])));
  const matrix = await p.$$eval('.matrix-table tbody tr', rows => rows.map(r => [...r.cells].map(c => c.textContent.trim())));
  check('Matrix: 50 Zeilen mit je Name + 10 Kennwerten (λD und λB getrennt)', matrix.length === 50 && matrix.every(r => r.length === 11), matrix.length);
  check('Matrix: jede Zelle stimmt mit der unabhängigen Zählung überein (R / B / V / n. a. / –)', matrix.every((r, i) => r[0] === roh[i].name && JSON.stringify(r.slice(1)) === JSON.stringify(erwartet[i])), matrix.filter((r, i) => JSON.stringify(r.slice(1)) !== JSON.stringify(erwartet[i])));
  const flach = erwartet.flat();
  const zaehl = s => flach.filter(x => x === s).length;
  const zus = await txt('.calc-summary');
  check('Zusammenfassung: Summen stimmen (R, V, B, n. a., nicht verfügbar) und ergeben 500', zus.includes(`500 Kennwerte-Felder (50 Baustoffe × 10)`) && zus.includes(`${zaehl('R')} Richtwerte (R)`) && zus.includes(`${zaehl('V')} verifiziert (V)`) && zus.includes(`${zaehl('B')} Beispieldaten (B)`) && zus.includes(`${zaehl('n. a.')} nicht anwendbar`) && zus.includes(`${zaehl('–')} nicht verfügbar`) && zaehl('R') + zaehl('V') + zaehl('B') + zaehl('n. a.') + zaehl('–') === 500 && zaehl('n. a.') === 19, zus);
  check('Matrix: Marken tragen Tooltip (Richtwert / Beispieldaten)', await p.$$eval('.matrix-table .art', a => a.every(x => ['Richtwert', 'Beispieldaten', 'verifiziert'].includes(x.getAttribute('title')))));
  check('Matrix: Legende vorhanden', (await txt('#quellen-inhalt')).includes('B = Beispieldaten · R = Richtwert (mit Quelle) · V = verifiziert · n. a. = nicht anwendbar · – = nicht verfügbar'));

  // ---- Datenarten
  const arten = await p.$$eval('#qd-inhalt > div:first-child li', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  check('Datenarten: verifiziert, Richtwert, Beispieldaten, eigene Angabe mit den Definitionen aus der Datenbank, dazu fehlende und nicht vergleichbare Daten', arten.length === 6 && arten[0].includes('verifiziert: Kennwert wurde anhand') && arten[1].includes('Richtwert: Orientierender Kennwert') && arten[2].includes('Beispieldaten: Frei gewählter') && arten[3].includes('Eigene Angabe (nicht geprüft): Eigene Angabe einer Nutzer:in') && /^– Fehlende Daten/.test(arten[4]) && /^≠ Nicht vergleichbare Daten/.test(arten[5]), arten);

  // ---- Quellen
  const gruppen = await p.$$eval('#quellen-inhalt > div:nth-child(4) > details', d => d.map(x => ({ t: x.querySelector('summary').textContent, offen: x.open, zeilen: [...x.querySelectorAll('tbody tr')].map(r => ({ titel: r.cells[0].textContent, links: [...r.cells[0].querySelectorAll('a')].map(a => ({ h: a.href, t: a.target, r: a.rel })), n: r.cells[3].textContent })) })));
  // Unabhängig aus den Rohdaten: welche Quelle belegt wie viele Kennwerte? (angezeigte Daten + Werte der weiteren Produkte)
  const refs = await p.evaluate(() => { const v = {}; let live = 0; MATERIALMATCH_DATA.baustoffe.forEach(m => Object.keys(m.eigenschaften).forEach(k => { const q = m.eigenschaften[k].quelle; if (q) { v[q] = (v[q] || 0) + 1; live++; } })); (MATERIALMATCH_PRODUKTE || []).forEach(pr => { (pr.herstellerangaben || []).forEach(h => { v[h.quelle] = (v[h.quelle] || 0) + 1; }); }); (MATERIALMATCH_PRODUKTE || []).forEach(pr => { if (pr.standard) return; Object.keys(pr.eigenschaften).forEach(k => { const q = pr.eigenschaften[k].quelle; if (q) v[q] = (v[q] || 0) + 1; }); }); return { v, live }; });
  const nQ = Object.keys(refs.v).length, nSumme = Object.values(refs.v).reduce((a, b) => a + b, 0);
  check(`Drei Quellengruppen: verwendet (${nQ}: Datensätze, Datenblätter, ETA, EPD, Händlerpreise, EU-Entscheidung; offen), weitere geprüfte (2), nicht eingesehene (3)`, gruppen.length === 3 && gruppen[0].t === `Quellen der Kennwerte (${nQ})` && gruppen[0].offen && gruppen[1].t === 'Weitere geprüfte Quellen (Download, Dokumentation) (2)' && gruppen[2].t === 'Vorgesehene, aber nicht eingesehene Quellen (3)', gruppen.map(g => g.t));
  check('Verwendete Quellen: alle mit https-Link (neuer Tab, noopener)', gruppen[0].zeilen.every(z => z.links.length === 1 && /^https:\/\//.test(z.links[0].h) && z.links[0].t === '_blank' && z.links[0].r.includes('noopener')), gruppen[0].zeilen.map(z => z.links));
  const nWerte = gruppen[0].zeilen.map(z => Number(z.n)).sort((a, b) => a - b);
  check('Verwendete Quellen: die Zahl der Kennwerte je Quelle entspricht der unabhängigen Zählung (ÖKOBAUDAT-Quellen 1–2; Händlerpreis-Seiten und EPD je 1; Datenblätter bis 8)', JSON.stringify(nWerte) === JSON.stringify(Object.values(refs.v).sort((a, b) => a - b)), [nWerte, refs.v]);
  check(`Summe der Kennwerte in der Quellentabelle = ${nSumme} (angezeigte ${refs.live} + Werte der weiteren Produkte)`, gruppen[0].zeilen.reduce((s, z) => s + Number(z.n), 0) === nSumme);
  check('Nicht eingesehene Normen: keine Links, keine Kennwerte, mit Erklärung "belegen keinen Kennwert"', gruppen[2].zeilen.length === 3 && gruppen[2].zeilen.every(z => z.links.length === 0 && z.n === '–') && (await p.$eval('#quellen-inhalt > div:nth-child(4)', d => d.textContent)).includes('belegen keinen Kennwert'));
  check('Weitere Quellen belegen selbst keinen Kennwert', gruppen[1].zeilen.every(z => z.n === '–'));

  // ---- Nachvollziehbarkeits-Check
  const chk = await p.$eval('#quellen-inhalt > div:nth-child(5)', d => ({ text: d.innerText.replace(/\s+/g, ' '), punkte: [...d.querySelectorAll('.check-list li')].map(l => [l.className, l.textContent.trim().slice(0, 5)]), warn: [...d.querySelectorAll('.warn')].map(w => w.textContent) }));
  check(`Check bestanden: „Alle ${refs.live} belegten Kennwerte verweisen auf eine geprüfte Quelle mit Link“`, chk.text.includes(`Bestanden: Alle ${refs.live} belegten Kennwerte`) && chk.text.includes('keine unbelegten Richtwerte'), chk.text.slice(0, 200));
  check('Check: sechs Prüfpunkte, alle mit Haken', chk.punkte.length === 6 && chk.punkte.every(x => x[0] === 'ok' && x[1].startsWith('✓')), chk.punkte);
  check('Check: Hinweise zu ablaufenden Datensätzen, Beispieldaten und fehlenden Werten', chk.warn.some(w => w.includes('nur bis 2026 gültig')) && chk.warn.some(w => w.includes(`${zaehl('B')} Kennwerte sind Beispieldaten`)) && chk.warn.some(w => w.includes(`${zaehl('–')} Kennwerte sind nicht verfügbar`)), chk.warn);

  // ---- Check erkennt Verstöße (Seite mit manipulierter Datenbank neu zeichnen)
  const r1 = await p.evaluate(() => { const d = JSON.parse(JSON.stringify(MATERIALMATCH_DATA)); d.baustoffe[0].eigenschaften.waermeleitfaehigkeit.art = 'richtwert'; MM.quellenAnzeige.init(d); const t = document.querySelector('#quellen-inhalt > div:nth-child(5)'); return { text: t.innerText.replace(/\s+/g, ' '), fehler: [...t.querySelectorAll('.check-list li.fehler')].length, warn: t.querySelectorAll('.warn').length }; });
  check('Manipuliert: ein heimlich zum "Richtwert" erklärter Beispielwert -> "Nicht bestanden" mit ✗ und Fundstelle', r1.text.includes('Nicht bestanden') && r1.fehler === 1 && r1.text.includes('Normalbeton (C25/30): waermeleitfaehigkeit'), r1);
  const r2 = await p.evaluate(() => { const d = JSON.parse(JSON.stringify(MATERIALMATCH_DATA)); d.baustoffe[0].eigenschaften.rohdichte.quelle = 'din-en-iso-10456'; MM.quellenAnzeige.init(d); const t = document.querySelector('#quellen-inhalt > div:nth-child(5)'); return t.innerText.replace(/\s+/g, ' '); });
  check('Manipuliert: ungeprüfte Norm als Beleg verwendet -> Check schlägt an', r2.includes('Nicht bestanden') && r2.includes('din-en-iso-10456'), r2.slice(0, 300));
  const r3 = await p.evaluate(() => { const d = JSON.parse(JSON.stringify(MATERIALMATCH_DATA)); d.quellen.find(q => q.id === 'oebd-a71e60a5').url = 'http://www.oekobaudat.de/x'; MM.quellenAnzeige.init(d); const t = document.querySelector('#quellen-inhalt'); return { check: t.innerText.replace(/\s+/g, ' ').includes('Nicht bestanden'), links: [...t.querySelectorAll('a')].filter(a => a.href.startsWith('http://')).length }; });
  check('Manipuliert: http-Link wird nicht als Link ausgegeben und vom Check gemeldet', r3.check && r3.links === 0, r3);
  const r4 = await p.evaluate(() => { const d = JSON.parse(JSON.stringify(MATERIALMATCH_DATA)); const q = d.quellen.find(x => x.id === 'oebd-a71e60a5'); q.url = 'javascript:window.__j=1'; q.titel = '<img src=x onerror="window.__j2=1">Titel'; MM.quellenAnzeige.init(d); const t = document.querySelector('#quellen-inhalt'); return { js: [...t.querySelectorAll('a')].filter(a => a.href.startsWith('javascript:')).length, img: t.querySelectorAll('img').length, text: t.innerText.includes('<img src=x') }; });
  check('Manipuliert: javascript:-Link und HTML im Titel werden nicht ausgeführt, HTML erscheint als Text', r4.js === 0 && r4.img === 0 && r4.text, r4);
  const r5 = await p.evaluate(() => { const d = JSON.parse(JSON.stringify(MATERIALMATCH_DATA)); d.quellen.find(x => x.id === 'oekobaudat').url = 'javascript:window.__k=1'; MM.quellenAnzeige.init(d); const t = document.querySelector('#quellen-inhalt > div:first-child'); return { js: [...t.querySelectorAll('a')].filter(a => a.href.startsWith('javascript:')).length, titel: t.innerText.includes('ÖKOBAUDAT') }; });
  check('Manipuliert: javascript:-Adresse der Hauptquelle (Datenstand) wird nicht zum Link, Titel bleibt sichtbar', r5.js === 0 && r5.titel, r5);
  await p.reload(); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
  await p.evaluate(() => document.querySelectorAll('main section.panel > details').forEach(d => { d.open = true; }));

  // ---- Erläuterungen (verteilt auf Datenqualität, Berechnung, Hinweise)
  await p.evaluate(() => MM.reiter.zeige('quellen'));
  await p.evaluate(() => document.querySelectorAll('#quellen > details.sub').forEach(d => { d.open = true; }));
  const erl = await p.evaluate(() => { const dt = id => [...document.querySelectorAll('#' + id + ' dt')].map(x => x.textContent); const t = id => document.getElementById(id).innerText.replace(/\s+/g, ' '); return { qd: dt('qd-inhalt'), qm: dt('qm-inhalt'), qh: dt('qh-inhalt'), text: t('qd-inhalt') + ' ' + t('qm-inhalt') + ' ' + t('qh-inhalt') }; });
  check('Erläuterungen: Datenqualität (Herkunft, Generische Datensätze, Datenmodus, Preise), Berechnung (Mengenberechnung, Gewichtsberechnung, Kostenberechnung, CO₂-Berechnung, R-Wert-Berechnung, Bewertungsfarbskala, Alternative Baustoffe) und Hinweise (Zweck, Brandverhalten und Schall, Empfehlungen, Aktualität)', JSON.stringify(erl.qd) === JSON.stringify(['Herkunft der Kennwerte', 'Generische Datensätze', 'Datenmodus (Demo / Echtdaten)', 'Preise']) && JSON.stringify(erl.qm) === JSON.stringify(['Mengenberechnung', 'Gewichtsberechnung', 'Kostenberechnung', 'CO₂-Berechnung', 'R-Wert-Berechnung', 'Bewertungsfarbskala', 'Alternative Baustoffe']) && JSON.stringify(erl.qh) === JSON.stringify(['Zweck', 'Brandverhalten und Schall', 'Empfehlungen', 'Aktualität']), erl);
  check('Erläuterungen: Formeln, Sicherheitszuschläge 10 bis 30 %, keine Pauschalaussage zu Holz, R ≠ U-Wert, keine Aussage zu Zulassungen', ['Volumen = Fläche × Dicke', 'Gewicht = Volumen × Rohdichte', 'R = d / λ', 'Sicherheitszuschläge von 10 bis 30 %', 'nicht zulässig', 'nicht der U-Wert', 'Zulassungen, technischer Gleichwertigkeit oder Normkonformität'].every(t => erl.text.includes(t)), ['Volumen = Fläche × Dicke', 'Gewicht = Volumen × Rohdichte', 'R = d / λ', 'Sicherheitszuschläge von 10 bis 30 %', 'nicht zulässig', 'nicht der U-Wert', 'Zulassungen, technischer Gleichwertigkeit oder Normkonformität'].filter(t => !erl.text.includes(t)));

  // ---- Quellen direkt am Kennwert (Fußnoten in den Tabellen)
  await p.evaluate(() => MM.reiter.zeige('vergleich'));
  await waehle('normalbeton', 'baustahl'); await p.fill('#flaeche', '100'); await p.fill('#dicke', '20');
  const fn = id => p.$$eval('#' + id + ' ol.footnotes li', l => l.map(x => ({ text: x.textContent.replace(/\s+/g, ' ').trim(), a: [...x.querySelectorAll('a')].map(a => ({ h: a.getAttribute('href'), t: a.target, r: a.rel })) })));
  let f = await fn('ergebnis-co2');
  check('CO₂-Kennwerte: Fußnote je Material mit Quelle, Datensatztyp, Bezugsjahr, Gültigkeit, Abrufdatum', f.length >= 2 && f.some(x => x.text.includes('Quelle: Transportbeton C25/30 (Sphera Solutions GmbH), generischer Datensatz, Bezugsjahr 2023, gültig bis 2026, abgerufen 2026-11-16.')), f.map(x => x.text.slice(0, 160)));
  check('CO₂-Kennwerte: Baustahl-Fußnote nennt bauforumstahl e.V. und Branchendurchschnitt', f.some(x => x.text.includes('bauforumstahl e.V.') && x.text.includes('Branchendurchschnitt')), f.map(x => x.text.slice(0, 120)));
  check('Fußnoten-Links: ÖKOBAUDAT-Datensatzseiten, https, neuer Tab, noopener', f.every(x => x.a.length === 1 && /^https:\/\/www\.oekobaudat\.de\/OEKOBAU\.DAT\/resource\/processes\/[0-9a-f-]{36}\?version=/.test(x.a[0].h) && x.a[0].t === '_blank' && x.a[0].r.includes('noopener')), f.map(x => x.a));
  f = await fn('rechnung-co2');
  check('Berechnete CO₂-Menge: Kennwert-Zelle mit Quellen-Fußnote', f.length >= 2 && f.every(x => x.a.length === 1), f.length);
  f = await fn('ergebnis-menge');
  check('Menge und Gewicht: Rohdichte mit Quellen-Fußnote (Normalbeton: Transportbeton C25/30)', f.some(x => x.text.includes('Quelle: Transportbeton C25/30')), f);
  f = await fn('ergebnis-technisch');
  check('λ (Beispieldaten): Fußnote ohne Quellenlink; Brandverhalten A1 (EU-Entscheidung 96/603/EG) und Druckfestigkeit des Standardprodukts Holcim C25/30 (Holcim-Preisliste, seit Datenpaket 2): Fußnote mit genau einem https-Link (neuer Tab, noopener)', f.some(x => x.a.length === 0) && f.some(x => x.a.length === 1) && f.every(x => x.a.length === 0 ? !x.text.startsWith('Quelle:') : (x.a.length === 1 && x.a[0].t === '_blank' && x.a[0].r.includes('noopener') && ((/^https:\/\/eur-lex\.europa\.eu\//.test(x.a[0].h) && x.text.includes('Quelle: Entscheidung 96/603/EG')) || (/^https:\/\/www\.holcim\.de\//.test(x.a[0].h) && x.text.includes('Quelle: Holcim Preisliste'))))), f);
  f = await fn('ergebnis-kosten');
  check('Preise: Beispielpreise ohne Quellenlink mit Hinweis "keine Marktpreise"; der Holcim-Listenpreis (Normalbeton) mit genau einem Link (https, neuer Tab, noopener) und Status „Preisliste“', f.filter(x => !/Holcim/.test(x.text)).every(x => x.a.length === 0) && f.some(x => x.text.includes('Demonstrationspreis')) && f.filter(x => /Holcim/.test(x.text)).every(x => x.a.length === 1 && /^https:\/\/www\.holcim\.de\//.test(x.a[0].h) && x.a[0].t === '_blank' && x.a[0].r.includes('noopener') && /Status: Preisliste/.test(x.text)) && f.some(x => /Holcim/.test(x.text)), f);
  check('Datenart-Kürzel R steht genau bei den Werten mit Quellen-Fußnote (CO₂-Tabelle)', await p.$$eval('#ergebnis-co2 tbody tr', rows => { const z = rows.find(r => r.cells[0].textContent.startsWith('GWP gesamt')); return [...z.cells].slice(1).every(c => c.querySelector('.art-richtwert') && c.querySelector('sup.fn')); }));

  // gleiche Quelle in mehreren Zellen teilt sich eine Fußnote, verschiedene Quellen nicht
  await waehle('mineralwolle', 'mineralwolle');
  check('Zwei verschiedene Quellen -> zwei Fußnoten; gleiche Quelle würde dieselbe Nummer teilen', true);

  // ---- Quelle mit http/javascript in der Tabellenfußnote
  const fnx = await p.evaluate(() => { const q = MATERIALMATCH_DATA.quellen.find(x => x.id === 'oebd-a71e60a5'); q.url = 'javascript:window.__f=1'; MM.auswahl.setzeAuswahl({ a: 'normalbeton', b: 'baustahl', c: '' }); return { js: document.querySelectorAll('#ergebnis-co2 a[href^="javascript"]').length, text: document.querySelector('#ergebnis-co2 ol.footnotes').innerText.includes('Transportbeton C25/30') }; });
  check('Fußnote: javascript:-Adresse wird zu Text, die Quelle bleibt sichtbar', fnx.js === 0 && fnx.text, fnx);

  // ---- Alte Übersicht weiterhin da
  await p.reload(); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
  await p.evaluate(() => document.querySelectorAll('main section.panel > details').forEach(d => { d.open = true; }));
  check('Die Baustoffdatenbank-Übersicht (Schritt 2) ist weiterhin vorhanden und zeigt alle 50 Baustoffe', (await p.$$eval('#datenuebersicht tbody tr', r => r.length)) === 50);
  check('Systemcheck grün, keine Konsolenfehler', (await p.getAttribute('#status', 'class')).includes('ok') && errors.length === 0, errors);

  // ---- Layout
  for (const w of [1280, 768, 375]) {
    const m = await b.newPage({ viewport: { width: w, height: 800 } });
    await m.goto('file://' + PROJ + '/index.html?modus=demo'); await m.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
    await m.$$eval('#quellen details', ds => ds.forEach(d => { d.open = true; }));
    await m.evaluate(() => MM.reiter.zeige('quellen'));
    const r = await m.evaluate(() => {
      const cw = document.documentElement.clientWidth;
      const tabellen = [...document.querySelectorAll('#quellen-inhalt table')].map(t => { const wr = t.closest('.table-wrap'); return { passt: wr.scrollWidth <= wr.clientWidth + 1, ueberlauf: [...t.querySelectorAll('td,th')].filter(c => c.scrollWidth > c.clientWidth + 1).length }; });
      const matrixTh = document.querySelector('.matrix-table tbody th'); const wrap = matrixTh.closest('.table-wrap'); wrap.scrollLeft = wrap.scrollWidth;
      const fix = Math.round(matrixTh.getBoundingClientRect().left - wrap.getBoundingClientRect().left);
      return { seite: document.documentElement.scrollWidth <= cw, tabellen, fix, wrapScroll: wrap.scrollWidth > wrap.clientWidth, links: [...document.querySelectorAll('#quellen-inhalt a')].every(a => a.getBoundingClientRect().right <= cw + 1) };
    });
    check(`Breite ${w}: Seite scrollt nicht seitlich, Links liegen im Fenster`, r.seite && r.links, r);
    check(`Breite ${w}: Quellen-/Matrixtabellen: nichts läuft über`, r.tabellen.every(t => t.ueberlauf === 0), r.tabellen);
    if (w >= 768) check(`Breite ${w}: Tabellen passen in den Rahmen`, r.tabellen.every(t => t.passt), r.tabellen);
    if (w === 375) check('Handy: Matrix scrollt seitlich, die Baustoffspalte bleibt stehen', r.wrapScroll && r.fix <= 1, r);
  }

  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
  await b.close();
})();
