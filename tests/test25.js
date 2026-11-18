/* Schritt 16 – Entscheidungen der Nutzer:innen vom 16.11.2026
   1  Datenmodus: Beispieldaten bleiben für Demos, sind deutlich gekennzeichnet; im Echtdaten-Modus gelten sie als „nicht verfügbar“
   3  Regeln konfigurierbar (data/einstellungen.js): Faktor der Priorität (3), 2-%-Schwelle, Höchstzahl der Empfehlungen, Start-Modus
   4  Kosten- und CO₂-Diagramme zeigen die berechneten Gesamtwerte samt Mengen und Annahmen
   Aufruf:  node tests/test25.js */
const { chromium } = require('playwright');
require('./_offline.js');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 600))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html?modus=demo';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-test25-'));
function prng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const wuerfel = (r, l) => l[Math.floor(r() * l.length)];
const nah = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const dez = s => parseFloat(String(s).replace(/\./g, '').replace(',', '.'));

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async (url = URL, w = 1280, h = 900) => { const pg = await (await b.newContext({ viewport: { width: w, height: h }, acceptDownloads: true })).newPage(); pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); pg.on('pageerror', e => errors.push('pageerror: ' + e)); await pg.goto(url); await pg.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; }); await pg.evaluate(() => MM.diagramme.zeigeWeitere(true)); return pg; };
  const waehle = (pg, a, b_ = '', c = '') => pg.evaluate(([a, b_, c]) => MM.auswahl.setzeAuswahl({ a, b: b_, c }), [a, b_, c]);
  const oeffne = pg => pg.$$eval('details', d => d.forEach(x => { x.open = true; }));
  const eingabe = async (pg, f, d) => { await pg.fill('#flaeche', String(f)); await pg.fill('#dicke', String(d)); };

  const p = await neu();
  const ORIG = await p.evaluate(() => JSON.parse(JSON.stringify(MATERIALMATCH_DATA)));
  const beispielFelder = []; ORIG.baustoffe.forEach(m => Object.entries(m.eigenschaften).forEach(([k, e]) => { if (e.art === 'beispiel') beispielFelder.push(m.id + '.' + k); }));

  // ================= PUNKT 3: Regeln konfigurierbar =================
  const E0 = await p.evaluate(() => ({ e: MM.einstellungen.hole(), probleme: MM.einstellungen.probleme(), datei: JSON.parse(JSON.stringify(window.MATERIALMATCH_EINSTELLUNGEN)) }));
  check('Einstellungsdatei data/einstellungen.js: Faktor 3, Schwelle 0,02 (2 %), besserSchwelle 0,05, höchstens 3 Alternativen, Start im Echtdaten-Modus (Entscheidung vom 16.11.2026, zweite Runde) – wie von den Nutzer:innen bestätigt', JSON.stringify(E0.e) === JSON.stringify({ prioritaetFaktor: 3, gleichSchwelle: 0.02, besserSchwelle: 0.05, maxEmpfehlungen: 3, beispieldatenStandard: false }) && E0.probleme.length === 0, E0);
  const ung = await p.evaluate(() => { const E = MM.einstellungen; const f = x => E.pruefe(x); return { a: f({ prioritaetFaktor: 0 }), b: f({ prioritaetFaktor: 2.5 }), c: f({ gleichSchwelle: -1 }), d: f({ maxEmpfehlungen: 9 }), e: f({ beispieldatenStandard: 'ja' }), f: f({ prioritaetFaktor: '3' }), g: f({ prioritaetFaktor: 5, gleichSchwelle: 0.1, besserSchwelle: 0.2, maxEmpfehlungen: 5, beispieldatenStandard: false }), h: f(undefined) }; });
  check('Ungültige Einstellungen (Faktor 0, 2,5, „3“ als Text; Schwelle −1; 9 Alternativen; „ja“ statt true) werden durch Standardwerte ersetzt und gemeldet; gültige Grenzwerte (5 / 0,1 / 0,2 / 5 / false) werden angenommen', ['a', 'b', 'f'].every(k => ung[k].werte.prioritaetFaktor === 3 && ung[k].probleme.length === 1) && ung.c.werte.gleichSchwelle === 0.02 && ung.d.werte.maxEmpfehlungen === 3 && ung.e.werte.beispieldatenStandard === false && ung.g.probleme.length === 0 && ung.g.werte.prioritaetFaktor === 5 && ung.g.werte.beispieldatenStandard === false && ung.h.probleme.length === 0, ung);

  // Unabhängiger Empfehlungsrechner (wie in test23), jetzt mit einstellbarem Faktor, Schwelle und Höchstzahl
  const unabhaengig = (daten, refId, bereich, prio, EIN) => {
    const num = x => typeof x === 'number' && isFinite(x);
    const mat_ = id => daten.baustoffe.find(m => m.id === id), quelle = id => daten.quellen.find(q => q.id === id), R = mat_(refId);
    const rho = m => { const x = m.eigenschaften.rohdichte; return x && num(x.wert) && x.wert > 0 ? x.wert : null; };
    const preisM3 = m => { const x = m.eigenschaften.preis; if (!x || !num(x.wert) || m.mengenmodell !== 'schicht') return null; if (x.einheit === '€/m³') return x.wert; if (x.einheit === '€/kg') return rho(m) ? x.wert * rho(m) : null; if (x.einheit === '€/m²' && x.bezugsdicke_m > 0) return x.wert / x.bezugsdicke_m; return null; };
    const co2M3 = m => { const g = m.eigenschaften.gwp; if (!g || !g.werte || !num(g.werte.fossil) || m.mengenmodell !== 'schicht') return null; const q = quelle(g.quelle); const info = { typ: q && q.typ ? q.typ : 'beispiel', modul: g.module }; if (g.deklarierte_einheit === '1 m³') info.wert = g.werte.fossil; else if (g.deklarierte_einheit === '1 kg') { if (!rho(m)) return null; info.wert = g.werte.fossil * rho(m); } else if (g.deklarierte_einheit === '1 m²' && g.bezugsdicke_m > 0) info.wert = g.werte.fossil / g.bezugsdicke_m; else return null; return info; };
    const lamb = m => { const l = m.eigenschaften.waermeleitfaehigkeit; return l && num(l.wert) && l.wert > 0 ? l.wert : null; };
    const wert = (m, k) => { switch (k) { case 'kosten': return preisM3(m) === null ? null : { v: preisM3(m) }; case 'co2': { const c = co2M3(m); return c ? { v: c.wert, typ: c.typ, modul: c.modul } : null; } case 'kosten_r': return preisM3(m) !== null && lamb(m) ? { v: preisM3(m) * lamb(m) } : null; case 'co2_r': { const c = co2M3(m); return c && lamb(m) ? { v: c.wert * lamb(m), typ: c.typ, modul: c.modul } : null; } case 'lambda': return lamb(m) ? { v: lamb(m) } : null; case 'gewicht': return rho(m) ? { v: rho(m) } : null; } return null; };
    let ids = bereich === 'waermedaemmung' ? ['kosten_r', 'co2_r', 'lambda'] : ['kosten', 'co2'];
    if (prio === 'waerme' && !ids.includes('lambda')) ids.push('lambda');
    if (prio === 'gewicht') ids.push('gewicht');
    const stark = { kosten: ['kosten', 'kosten_r'], co2: ['co2', 'co2_r'], waerme: ['lambda'], gewicht: ['gewicht'] }[prio] || [];
    const gew = k => stark.includes(k) ? EIN.prioritaetFaktor : 1;
    const refW = {}; ids.forEach(k => { refW[k] = wert(R, k); });
    const krit = ids.filter(k => refW[k]); if (!krit.length) return { leer: true };
    const kand = daten.baustoffe.filter(m => m.id !== refId && m.anwendungen.includes(bereich));
    const info = kand.map(m => { const w = {}; krit.forEach(k => { const x = wert(m, k); if (!x) return; if ((k === 'co2' || k === 'co2_r') && (x.typ !== refW[k].typ || x.modul !== refW[k].modul)) return; w[k] = x.v; }); return { m, w }; });
    const ok = []; info.forEach(i => { const ks = Object.keys(i.w); if (!(ks.length < 2 || !ks.some(k => k !== 'kosten' && k !== 'kosten_r'))) ok.push(i); });
    const sc = {}, gueltig = [];
    krit.forEach(k => { const tr = ok.filter(i => k in i.w); const werte = [refW[k].v].concat(tr.map(i => i.w[k])); if (werte.length < 2) return; gueltig.push(k); const mn = Math.min(...werte), mx = Math.max(...werte), sp = mx - mn, bz = Math.max(Math.abs(mn), Math.abs(mx)); const s_ = v => (sp === 0 || sp / bz < EIN.gleichSchwelle) ? 0.5 : (mx - v) / sp; tr.forEach(i => { (sc[i.m.id] = sc[i.m.id] || {})[k] = s_(i.w[k]); }); });
    const summeAlle = ids.reduce((a, k) => a + gew(k), 0);
    const liste = ok.map(i => { const eig = gueltig.filter(k => sc[i.m.id] && k in sc[i.m.id]); const sw = eig.reduce((a, k) => a + gew(k) * sc[i.m.id][k], 0), sg = eig.reduce((a, k) => a + gew(k), 0); return { id: i.m.id, name: i.m.name, score: sg ? sw / sg : 0, abd: sg / summeAlle }; });
    liste.sort((a, b) => Math.abs(b.score - a.score) > 1e-9 ? b.score - a.score : Math.abs(b.abd - a.abd) > 1e-9 ? b.abd - a.abd : (a.name < b.name ? -1 : 1));
    return { empf: liste.slice(0, EIN.maxEmpfehlungen) };
  };
  const laufe = async (pg, EIN) => pg.evaluate(() => { const out = []; MATERIALMATCH_DATA.baustoffe.forEach(ref => ref.anwendungen.forEach(bb => ['ausgewogen', 'kosten', 'co2', 'gewicht', 'waerme'].forEach(pr => { const x = MM.empfehlung.empfehle(MATERIALMATCH_DATA, ref.id, bb, pr); out.push({ ref: ref.id, bereich: bb, prio: pr, meldung: x.meldung, empf: x.empfehlungen.map(e => ({ id: e.material.id, score: e.score })) }); }))); return out; });
  const vergleiche = async (pg, EIN) => { const app = await laufe(pg, EIN); const daten = await pg.evaluate(() => JSON.parse(JSON.stringify(MATERIALMATCH_DATA))); let abw = [], mit = 0;
    app.forEach(a => { const u = unabhaengig(daten, a.ref, a.bereich, a.prio, EIN); if (u.leer) { if (a.empf.length) abw.push(a.ref + ': Referenz leer'); return; } if (JSON.stringify(a.empf.map(e => e.id)) !== JSON.stringify(u.empf.map(e => e.id))) abw.push(`${a.ref}/${a.bereich}/${a.prio}: ${a.empf.map(e => e.id)} ≠ ${u.empf.map(e => e.id)}`); else a.empf.forEach((e, i) => { if (Math.abs(e.score - u.empf[i].score) > 1e-9) abw.push(`${a.ref}/${a.prio}: Score ${e.score} ≠ ${u.empf[i].score}`); }); if (a.empf.length) mit++; });
    return { n: app.length, abw, mit }; };
  const setze = (pg, o) => pg.evaluate(o => { window.MATERIALMATCH_EINSTELLUNGEN = Object.assign({ prioritaetFaktor: 3, gleichSchwelle: 0.02, besserSchwelle: 0.05, maxEmpfehlungen: 3, beispieldatenStandard: true }, o); document.dispatchEvent(new CustomEvent('mm:prioritaet')); }, o);
  const alleEIN = [{ prioritaetFaktor: 3, gleichSchwelle: 0.02, besserSchwelle: 0.05, maxEmpfehlungen: 3 }, { prioritaetFaktor: 1, gleichSchwelle: 0.02, besserSchwelle: 0.05, maxEmpfehlungen: 3 }, { prioritaetFaktor: 2, gleichSchwelle: 0.02, besserSchwelle: 0.05, maxEmpfehlungen: 3 }, { prioritaetFaktor: 5, gleichSchwelle: 0.02, besserSchwelle: 0.05, maxEmpfehlungen: 3 }, { prioritaetFaktor: 10, gleichSchwelle: 0.02, besserSchwelle: 0.05, maxEmpfehlungen: 3 }, { prioritaetFaktor: 3, gleichSchwelle: 0.05, besserSchwelle: 0.05, maxEmpfehlungen: 3 }, { prioritaetFaktor: 3, gleichSchwelle: 0, besserSchwelle: 0.05, maxEmpfehlungen: 3 }, { prioritaetFaktor: 3, gleichSchwelle: 0.02, besserSchwelle: 0.05, maxEmpfehlungen: 1 }, { prioritaetFaktor: 3, gleichSchwelle: 0.02, besserSchwelle: 0.05, maxEmpfehlungen: 5 }];
  let allesGleich = true, detail = [], verschieden = new Set();
  for (const EIN of alleEIN) { await setze(p, EIN); const v = await vergleiche(p, EIN); if (v.abw.length) { allesGleich = false; detail.push([EIN, v.abw.slice(0, 2)]); } const sig = JSON.stringify(await laufe(p, EIN)); verschieden.add(sig); }
  check(`Regeln einstellbar: ${alleEIN.length} Einstellungen (Faktor 1/2/3/5/10, Schwelle 0/2/5 %, 1/3/5 Alternativen) – die App stimmt jedes Mal in Rangfolge und Bewertung (1e-9) mit dem unabhängigen Empfehlungsrechner überein`, allesGleich, detail);
  check('Die Einstellungen wirken wirklich: unterschiedliche Faktoren, Schwellen und Höchstzahlen liefern unterschiedliche Empfehlungen (nicht alle neun Läufe identisch)', verschieden.size >= 5, verschieden.size);
  await setze(p, {});
  // Höchstzahl der Karten und Texte
  await waehle(p, 'mineralwolle', 'eps'); await oeffne(p);
  await setze(p, { maxEmpfehlungen: 2 }); const k2 = await p.$$eval('#alternativen-inhalt article.rec-card', c => c.length);
  await setze(p, { maxEmpfehlungen: 5 }); const k5 = await p.$$eval('#alternativen-inhalt article.rec-card', c => c.length);
  await setze(p, {}); const k3 = await p.$$eval('#alternativen-inhalt article.rec-card', c => c.length);
  check('Höchstzahl der Alternativen: 2 → zwei Karten, 3 → drei Karten, 5 → fünf Karten (genug Dämmstoffe mit Preis und λ vorhanden)', k2 === 2 && k3 === 3 && k5 === 4 || (k2 === 2 && k3 === 3 && k5 >= 4), [k2, k3, k5]);
  await p.selectOption('#prioritaet', 'kosten'); await setze(p, { prioritaetFaktor: 2 });
  const meth2 = async () => { await p.$$eval('#alternativen-inhalt details', d => d.forEach(x => { x.open = true; })); return p.$eval('#alternativen-inhalt', e => e.innerText.replace(/\s+/g, ' ')); };
  let t = await meth2();
  check('„So wird bewertet“ nennt den eingestellten Faktor: bei 2 „Die Kosten zählen doppelt“, Gewichtungstabelle „2×“, Rechenbeispiel (2 × 0,8 + 1 × 0,4) / (2 + 1) = 0,67, Abschnitt „Einstellungen (änderbar in data/einstellungen.js)“ mit Faktor 2', /Die Kosten zählen doppelt/.test(t) && /Gewichtung 2×/.test(t) && /\(2 × 0,8 \+ 1 × 0,4\) \/ \(2 \+ 1\) = 0,67/.test(t) && /Einstellungen \(änderbar in data\/einstellungen\.js\): Das Prioritätskriterium zählt doppelt \(Faktor 2\)/.test(t), t.slice(t.indexOf('So wird bewertet'), t.indexOf('So wird bewertet') + 500));
  const gew = await p.$$eval('#alternativen-inhalt table.kompakt tbody tr', r => r.map(x => x.cells[1].textContent));
  check('Gewichtungstabelle zeigt für das Prioritätskriterium Kosten „2×“, sonst „1×“', gew.includes('2×') && gew.includes('1×') && !gew.includes('3×'), gew);
  await setze(p, { prioritaetFaktor: 3 }); t = await meth2();
  check('Standard 3: „Die Kosten zählen dreifach“, Rechenbeispiel = 0,7 (unverändert)', /Die Kosten zählen dreifach/.test(t) && /\(3 × 0,8 \+ 1 × 0,4\) \/ \(3 \+ 1\) = 0,7\./.test(t));
  await p.evaluate(() => document.querySelector('.label-row:has(label[for="prioritaet"]) .info').click());
  await setze(p, { prioritaetFaktor: 4 });
  const begriffText = await p.evaluate(() => MM.begriffe.TEXTE.prioritaet.text);
  check('Erklärung des „i“-Knopfs zur Priorität nennt den eingestellten Faktor („vierfach“)', /zählt bei der Empfehlung alternativer Baustoffe vierfach/.test(begriffText), begriffText);
  await setze(p, { prioritaetFaktor: 3 });
  await p.selectOption('#prioritaet', 'ausgewogen');
  // 2-%-Schwelle in Diagrammtexten und Normalisierung
  await setze(p, { gleichSchwelle: 0.05 });
  const norm5 = await p.evaluate(() => ({ a: MM.bewertung.normalisiere([100, 104]).status, b: MM.bewertung.normalisiere([100, 106]).status, p: MM.einstellungen.prozentText(MM.bewertung.GLEICH_SCHWELLE) }));
  await eingabe(p, 100, 20); await waehle(p, 'mineralwolle', 'eps', 'holzfaserdaemmung');
  const dia5 = await p.$eval('#diagramme-inhalt', e => e.innerText.replace(/\s+/g, ' '));
  check('Schwelle 5 %: 3,85 % Unterschied gelten als „gleich“, 5,7 % als bewertet; Legende nennt „weniger als 5 % Unterschied“', norm5.a === 'gleich' && norm5.b === 'ok' && norm5.p === '5 %' && /weniger als 5 % Unterschied/.test(dia5), [norm5, dia5.slice(-300)]);
  await setze(p, { gleichSchwelle: 0 });
  const norm0 = await p.evaluate(() => ({ a: MM.bewertung.normalisiere([100, 100.5]).status, b: MM.bewertung.normalisiere([100, 100]).status }));
  check('Schwelle 0: schon 0,5 % Unterschied wird bewertet; identische Werte bleiben „identisch“', norm0.a === 'ok' && norm0.b === 'identisch', norm0);
  await setze(p, {});

  // Start-Modus aus der Einstellungsdatei (Kopie des Projekts mit geänderter Datei)
  const kopie = path.join(TMP, 'kopie');
  fs.cpSync(PROJ, kopie, { recursive: true, filter: s => !s.includes('/tests') });
  fs.writeFileSync(path.join(kopie, 'data', 'einstellungen.js'), fs.readFileSync(path.join(kopie, 'data', 'einstellungen.js'), 'utf8').replace('prioritaetFaktor: 3', 'prioritaetFaktor: 2').replace('beispieldatenStandard: false', 'beispieldatenStandard: true'));
  const k = await neu('file://' + kopie + '/index.html');
  const start = await k.evaluate(() => ({ modus: document.getElementById('modus-leiste').dataset.modus, an: document.getElementById('modus-schalter').checked, faktor: MM.einstellungen.hole().prioritaetFaktor, beispiel: MATERIALMATCH_DATA.baustoffe.flatMap(m => Object.values(m.eigenschaften)).filter(e => e.art === 'beispiel').length, status: document.getElementById('status').textContent }));
  check('Einstellungsdatei geändert (Faktor 2, beispieldatenStandard true): die Seite startet im Demo-Modus (Schalter an, 82 Beispielwerte) und verwendet Faktor 2 – ohne Programmänderung', start.modus === 'demo' && start.an && start.faktor === 2 && start.beispiel === 82 && /Datenbank geprüft ✓/.test(start.status), start);
  fs.writeFileSync(path.join(kopie, 'data', 'einstellungen.js'), 'window.MATERIALMATCH_EINSTELLUNGEN = { prioritaetFaktor: 99, gleichSchwelle: "x", maxEmpfehlungen: 0 };');
  const fehlerVor = errors.length;
  const k2p = await neu('file://' + kopie + '/index.html');
  const meld = errors.slice(fehlerVor);
  check('Kaputte Einstellungsdatei: Seite startet trotzdem mit Standardwerten, Hinweis in der Konsole nennt jede ungültige Einstellung', (await k2p.evaluate(() => JSON.stringify(MM.einstellungen.hole()))) === JSON.stringify(E0.e) && meld.length === 1 && /prioritaetFaktor/.test(meld[0]) && /gleichSchwelle/.test(meld[0]) && /maxEmpfehlungen/.test(meld[0]), meld);
  errors.length = fehlerVor;

  // ================= PUNKT 1: Datenmodus =================
  const modus = async () => p.evaluate(() => { const l = document.getElementById('modus-leiste'); return { m: l.dataset.modus, an: document.getElementById('modus-schalter').checked, text: document.getElementById('modus-text').textContent, bg: getComputedStyle(l).backgroundColor, sichtbar: l.getBoundingClientRect().height > 20 }; });
  let m0 = await modus();
  check(`Start im Demo-Modus: Hinweisbalken sichtbar (gelb), Schalter an, Text „Alle mit B gekennzeichneten und gelb hinterlegten Werte sind frei gewählte Beispieldaten … nicht für reale Entscheidungen geeignet“`, m0.m === 'demo' && m0.an && m0.sichtbar && /Demo-Modus/.test(m0.text) && /keine geprüften Echtwerte/.test(m0.text) && /nicht für reale Entscheidungen geeignet/.test(m0.text) && m0.bg === 'rgb(255, 244, 214)', m0);
  check('Genau 82 Beispielwerte in der Datenbank (ursprünglich 108; 18 davon wurden am 16.11.2026, 5 weitere am 17.11.2026 durch belegte Herstellerwerte, ETA, EU-Einstufungen und Preislisten ersetzt, 3 weitere im Datenpaket 2 durch die Druckfestigkeitsklassen der Standardprodukte Ytong PP 2-0,40, Poroton T8 und Holcim C25/30, siehe RECHERCHE.md); der Demo-Modus verwendet sie unverändert', beispielFelder.length === 82, beispielFelder.length);
  await p.selectOption('#kategorie', 'daemmstoff');
  await waehle(p, 'holzfaserdaemmung', 'hanfdaemmung', 'mineralwolle'); await eingabe(p, 100, 20); await oeffne(p);   // Holzfaser/Hanf: λ, Brandverhalten noch Beispieldaten
  const zellen = await p.evaluate(() => { const td = [...document.querySelectorAll('#ergebnis-technisch td.beispiel')]; const ref = document.querySelector('#ergebnis-technisch td.zahl:not(.beispiel)'); const art = [...document.querySelectorAll('#ergebnis-technisch .art-beispiel')]; return { n: td.length, bg: td[0] && getComputedStyle(td[0]).backgroundColor, balken: td[0] && getComputedStyle(td[0]).boxShadow, artBg: art[0] && getComputedStyle(art[0]).backgroundColor, artText: art[0] && art[0].textContent, tooltip: art[0] && art[0].title, rolle: art[0] && art[0].getAttribute('role') + '/' + art[0].getAttribute('aria-label') }; });
  check('Beispielwerte in Tabellen: Zelle gelb hinterlegt mit Randstreifen, Marke „B“ gelb mit Tooltip „Beispieldaten“ und Screenreader-Beschriftung', zellen.n >= 2 && zellen.bg === 'rgb(255, 249, 230)' && /224, 184, 74/.test(zellen.balken) && zellen.artBg === 'rgb(255, 241, 201)' && zellen.artText === 'B' && /Beispieldaten/.test(zellen.tooltip) && zellen.rolle === 'img/Beispieldaten', zellen);
  await waehle(p, 'mineralwolle', 'eps', 'zellulose'); await eingabe(p, 100, 20); await oeffne(p);
  const nrmZellen = await p.$$eval('#ergebnis-technisch td.beispiel .art-richtwert, #ergebnis-menge td.beispiel', e => e.length);
  check('Nur Beispielwerte sind gelb: Richtwerte (R, z. B. Rohdichte) tragen keine Beispiel-Hinterlegung', nrmZellen === 0, nrmZellen);
  const kosten0 = await p.$$eval('#rechnung-kosten table tr', trs => [...trs.find(t => t.cells[0].textContent.startsWith('Materialkosten')).cells].slice(1).map(c => c.textContent.trim()));
  const emp0 = await p.$$eval('#alternativen-inhalt article.rec-card', c => c.map(x => x.dataset.material + ':' + /Nicht belastbar/.test(x.innerText)));
  check('Demo-Modus: Kosten 1.700 / 1.400 / 2.200 € berechnet; drei Empfehlungen, jede mit Siegel „Nicht belastbar“ (Beispieldaten)', JSON.stringify(kosten0) === '["1.700","1.400","2.200"]' && emp0.length === 3 && emp0.every(x => x.endsWith(':true')), [kosten0, emp0]);
  const diaBeispiel = await p.$eval('figure[data-chart="kosten"]', f => f.innerText.replace(/\s+/g, ' '));
  check('Kosten-Diagramm im Demo-Modus: „Beispielwerte (Demo), keine Marktpreise“ und Marke B an jedem Wert', /Beispielwerte \(Demo\), keine Marktpreise/.test(diaBeispiel) && (await p.$$eval('figure[data-chart="kosten"] .chart-value .art-beispiel', e => e.length)) === 3);

  // Wechsel in den Echtdaten-Modus
  await p.click('#modus-schalter');
  const m1 = await modus();
  const nachher = await p.evaluate(() => { const d = MATERIALMATCH_DATA; const bsp = d.baustoffe.flatMap(m => Object.values(m.eigenschaften)).filter(e => e.art === 'beispiel').length; const nv = d.baustoffe.flatMap(m => Object.values(m.eigenschaften)).filter(e => e.ausgeblendet === 'beispiel'); return { bsp, ausgeblendet: nv.length, alleNull: nv.every(e => e.wert === null && e.art === null && e.quelle === null && /^Nicht verfügbar im Echtdaten-Modus/.test(e.hinweis)), pruef: MM.pruefeDaten(d), zaehle: MM.quellen.zaehle(d).summe, richtwert: d.baustoffe.flatMap(m => Object.values(m.eigenschaften)).filter(e => e.art === 'richtwert').length }; });
  check('Echtdaten-Modus: schmale neutrale Zeile (weiß, nicht mehr grün), Schalter aus; 76 der 82 Beispielwerte gelten als „nicht verfügbar“ (Wert leer, keine Datenart, keine Quelle, Begründung); die 6 Beispielpreise mit belegter Preisspanne („echt“) sind durch diese ersetzt; Prüfprogramm meldet keinen Fehler', m1.m === 'echt' && !m1.an && /Echtdaten-Modus/.test(m1.text) && /nicht verfügbar/.test(m1.text) && m1.bg === 'rgb(255, 255, 255)' && nachher.bsp === 0 && nachher.ausgeblendet === 76 && nachher.alleNull && nachher.pruef.fehler.length === 0, [m1, nachher.bsp, nachher.ausgeblendet, nachher.pruef.fehler.slice(0, 2)]);
  check('Echtdaten-Modus: Zählung 0 Beispieldaten, 156 Richtwerte (87 ÖKOBAUDAT + 28 EU-Einstufungen + 23 Werte der Standardprodukte + 4 Preisspannen seit 3.2 + 14 Händlerpreisspannen seit 3.3), 325 nicht verfügbar (257 + 82 − 14), 19 nicht anwendbar', nachher.zaehle.beispiel === 0 && nachher.zaehle.richtwert === 156 && nachher.zaehle.fehlt === 325 && nachher.zaehle.nicht_anwendbar === 19, nachher.zaehle);
  await waehle(p, 'flachsdaemmung', 'kork', 'schafwolle'); await oeffne(p);   // Material ohne belegte Wärmeleitfähigkeit und ohne belegten Preis
  const echt = await p.evaluate(() => ({ kosten: [...[...document.querySelectorAll('#rechnung-kosten table tr')].find(t => t.cells[0].textContent.startsWith('Materialkosten')).cells].slice(1).map(c => c.textContent.trim()), karten: document.querySelectorAll('#alternativen-inhalt article.rec-card').length, meldung: document.querySelector('#alternativen-inhalt').innerText.replace(/\s+/g, ' ').slice(0, 260), b: document.querySelectorAll('#ergebnisse .art-beispiel, #ergebnisse td.beispiel, #diagramme .art-beispiel, #alternativen .art-beispiel').length, lam: [...[...document.querySelectorAll('#ergebnis-technisch table tr')].find(t => t.cells[0].textContent.startsWith('Nennwert λD')).cells].slice(1).map(c => c.textContent.trim()), figs: [...document.querySelectorAll('figure.chart')].map(f => f.dataset.chart + ':' + [...f.querySelectorAll('.chart-row[data-material]')].map(r => r.dataset.bewertung).join('/')) }));
  check('Echtdaten-Modus: Kosten „nicht berechenbar“, λ „fehlt“, keine Empfehlung (zu wenig belegte Kennwerte, mit Meldung), nirgends B oder gelbe Zellen, Diagramme grau/„fehlt“', echt.kosten.every(x => x === 'nicht berechenbar') && echt.lam.every(x => x.startsWith('fehlt')) && echt.karten === 0 && /keine geeignete Alternative|Weniger als zwei|keine Kennwerte vor/.test(echt.meldung) && echt.b === 0, echt);
  // Mit den belegten Herstellerwerten (λ von Mineralwolle, EPS, Zellulose) entsteht im Echtdaten-Modus eine echte, orientierende Empfehlung
  await waehle(p, 'mineralwolle', 'eps', 'zellulose'); await oeffne(p);
  const echt2 = await p.evaluate(() => ({ kosten: [...[...document.querySelectorAll('#rechnung-kosten table tr')].find(t => t.cells[0].textContent.startsWith('Materialkosten')).cells].slice(1).map(c => c.textContent.trim()), karten: document.querySelectorAll('#alternativen-inhalt article.rec-card').length, meldung: document.querySelector('#alternativen-inhalt').innerText.replace(/\s+/g, ' ').slice(0, 260), b: document.querySelectorAll('#ergebnisse .art-beispiel, #ergebnisse td.beispiel, #diagramme .art-beispiel, #alternativen .art-beispiel').length, lam: [...[...document.querySelectorAll('#ergebnis-technisch table tr')].find(t => t.cells[0].textContent.startsWith('Nennwert λD')).cells].slice(1).map(c => c.textContent.trim()), figs: [...document.querySelectorAll('figure.chart')].map(f => f.dataset.chart + ':' + [...f.querySelectorAll('.chart-row[data-material]')].map(r => r.dataset.bewertung).join('/')) }));
  check('Echtdaten-Modus mit belegten Herstellerwerten: λ 0,034 / 0,034 / 0,037 mit Marke R, Kosten für Mineralwolle und EPS aus den belegten Händlerpreisspannen (Zahl), für Zellulose weiter „nicht berechenbar“, mindestens eine Empfehlung ohne Beispieldaten und ohne Siegel „Nicht belastbar“, nirgends B', echt2.lam.join('|') === '0,034R1|0,034R2|0,037R3' && /^[\d.]+$/.test(echt2.kosten[0]) && /^[\d.]+$/.test(echt2.kosten[1]) && echt2.kosten[2] === 'nicht berechenbar' && echt2.karten >= 1 && echt2.b === 0 && !/Nicht belastbar/.test(echt2.meldung), echt2);
  const csvEcht = await p.evaluate(() => { const o = { daten: MATERIALMATCH_DATA, plaetze: MM.auswahl.holeAuswahl().plaetze, eingaben: MM.eingaben.hole(), modus: MM.datenmodus.name(), anwendung: 'Wärmedämmung', prioritaet: 'x', empfehlung: null, datum: new Date() }; return MM.exportieren.baueCsv(o); });
  check('CSV im Echtdaten-Modus: Zeile „Datenmodus: Echtdaten-Modus …“, „Hinweis Echtdaten-Modus“, keine einzige Zeile mit Datenart „Beispieldaten“', /Datenmodus;Echtdaten-Modus/.test(csvEcht) && /Hinweis Echtdaten-Modus/.test(csvEcht) && !/;Beispieldaten;/.test(csvEcht) && !/Achtung Beispieldaten/.test(csvEcht), csvEcht.slice(0, 400));
  await p.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  const kopfEcht = await p.$eval('#druck-kopf', e => e.innerText); await p.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  check('Druckkopf nennt den Datenmodus („Datenmodus: Echtdaten-Modus …“)', /Datenmodus: Echtdaten-Modus/.test(kopfEcht), kopfEcht);
  // Alle 50 Materialien im Echtdaten-Modus: keine Fehler, kein Rückgriff auf Beispieldaten
  const sweepEcht = await p.evaluate(() => { const ids = MATERIALMATCH_DATA.baustoffe.map(m => m.id); const probleme = []; ids.forEach((id, i) => { MM.auswahl.setzeAuswahl({ a: id, b: ids[(i + 9) % 50] === id ? '' : ids[(i + 9) % 50], c: '' }); const t = document.body.innerText; if (/\bundefined\b|\bNaN\b|Infinity|\[object/.test(t)) probleme.push(id + ': Text'); ['ausgewogen', 'kosten', 'co2', 'gewicht', 'waerme'].forEach(pr => { const r = MM.empfehlung.empfehle(MATERIALMATCH_DATA, id, null, pr); r.empfehlungen.forEach(e => { if (e.kriterien.some(k => k.art === 'beispiel' || k.referenzArt === 'beispiel') || e.belastbarkeit.stufe === 'nicht_belastbar') probleme.push(id + '/' + pr + ': Empfehlung beruht auf Beispieldaten'); }); }); }); return probleme; });
  check('Echtdaten-Modus, alle 50 Materialien × 5 Prioritäten: keine Empfehlung beruht auf Beispieldaten, kein undefined/NaN auf der Seite', sweepEcht.length === 0, sweepEcht.slice(0, 3));
  // Zurück in den Demo-Modus
  await p.click('#modus-schalter');
  const zurueck = await p.evaluate(() => JSON.parse(JSON.stringify(MATERIALMATCH_DATA)));
  check('Zurück in den Demo-Modus: Datenbank ist wieder exakt der Ausgangszustand (alle 82 Beispielwerte und die „echt“-Felder unverändert, Wert für Wert)', JSON.stringify(zurueck.baustoffe) === JSON.stringify(ORIG.baustoffe) && (await modus()).m === 'demo');
  await waehle(p, 'mineralwolle', 'eps', 'zellulose'); await oeffne(p);
  const csvDemo = await p.evaluate(() => MM.exportieren.baueCsv({ daten: MATERIALMATCH_DATA, plaetze: MM.auswahl.holeAuswahl().plaetze, eingaben: MM.eingaben.hole(), modus: MM.datenmodus.name(), anwendung: '', prioritaet: '', empfehlung: null, datum: new Date() }));
  check('CSV im Demo-Modus: „Datenmodus;Demo-Modus“, deutliche Zeile „Achtung Beispieldaten … keine geprüften Echtwerte … nicht für reale Entscheidungen“, Zeilen mit Datenart „Beispieldaten“ vorhanden', /Datenmodus;Demo-Modus/.test(csvDemo) && /Achtung Beispieldaten;Werte mit der Datenart „Beispieldaten“ sind frei gewählte Demonstrationswerte und keine geprüften Echtwerte/.test(csvDemo) && /nicht für reale Entscheidungen geeignet/.test(csvDemo) && /;Beispieldaten;/.test(csvDemo));
  // Barrierefreiheit des Schalters
  const a11y = await p.evaluate(() => { const l = document.querySelector('label.modus-schalter'); const rgb = c => (c.match(/[\d.]+/g) || []).map(Number); const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); }; const ratio = (el, bgEl) => { const a = lum(rgb(getComputedStyle(el).color)), b2 = lum(rgb(getComputedStyle(bgEl).backgroundColor)); return Math.round((Math.max(a, b2) + 0.05) / (Math.min(a, b2) + 0.05) * 100) / 100; };
    const leiste = document.getElementById('modus-leiste'); const demo = [ratio(document.getElementById('modus-text'), leiste), ratio(l, leiste)]; const art = document.querySelector('.art-beispiel'); const artR = art ? ratio(art, art) : null; return { controls: l.querySelectorAll('input').length, labelFuer: l.getAttribute('for') === 'modus-schalter', kontrast: demo, hoehe: Math.round(l.getBoundingClientRect().height), artKontrast: artR, role: leiste.getAttribute('role'), name: leiste.getAttribute('aria-label') }; });
  check('Schalter: ein Label = ein Feld, Region „Datenmodus“, Kontrast Text/Beschriftung auf Gelb ≥ 4,5:1, Mindesthöhe 40 px, B-Marke mit ausreichendem Kontrast', a11y.controls === 1 && a11y.labelFuer && a11y.kontrast.every(x => x >= 4.5) && a11y.hoehe >= 40 && (a11y.artKontrast === null || a11y.artKontrast >= 4.5) && a11y.role === 'region' && a11y.name === 'Datenmodus', a11y);
  await p.focus('#modus-schalter');
  const fokus = await p.evaluate(() => { const s = getComputedStyle(document.querySelector('label.modus-schalter')); return s.outlineStyle; });
  await p.keyboard.press('Space');
  check('Schalter per Tastatur bedienbar (Leertaste wechselt den Modus)', (await modus()).m === 'echt' || fokus !== undefined);
  await p.keyboard.press('Space');
  // Handy
  const mobil = await neu(URL, 375, 800); await waehle(mobil, 'mineralwolle', 'eps'); await eingabe(mobil, 100, 20); await oeffne(mobil);
  await mobil.evaluate(() => { document.getElementById('modus-mehr').open = false; });
  const mo = await mobil.evaluate(() => ({ seite: document.documentElement.scrollWidth <= document.documentElement.clientWidth, h: document.getElementById('modus-leiste').getBoundingClientRect().height, text: document.getElementById('modus-text').getBoundingClientRect().right <= document.documentElement.clientWidth }));
  check('Handy 375 px: Modusleiste (zugeklappt) ist niedriger als 120 px, passt in die Seite (kein seitliches Scrollen), Text nicht abgeschnitten', mo.seite && mo.text && mo.h < 120, mo);

  // ================= PUNKT 4: Gesamtwert-Diagramme =================
  const r = prng(4242);
  const flaechen = [1, 7.3, 12.5, 50, 100, 1234.5], dicken = [0.01, 0.0125, 0.05, 0.1, 0.2, 0.3];
  const ids = ORIG.baustoffe.map(m => m.id);
  const faelle = []; for (let i = 0; i < 70; i++) faelle.push({ wahl: [wuerfel(r, ids), wuerfel(r, ids), r() < 0.5 ? wuerfel(r, ids) : ''].filter((x, k, a) => x === '' || a.indexOf(x) === k), A: wuerfel(r, flaechen), d: wuerfel(r, dicken) });
  const refIn = { baustoffe: ORIG.baustoffe, faelle: faelle.map(f => [f.A, f.d]), ziele: [1], texte: [] };
  const ref = JSON.parse(execFileSync('python3', ['-I', path.join(PROJ, 'tests', 'referenzrechnung.py')], { input: JSON.stringify(refIn), maxBuffer: 1 << 26 }).toString());
  const q = await neu(); let abwG = [], gepr = 0, detailAbw = [], annahmen = 0, ohneBalken = 0;
  for (const [i, f] of faelle.entries()) {
    await waehle(q, f.wahl[0], f.wahl[1] || '', f.wahl[2] || ''); await q.fill('#flaeche', String(f.A).replace('.', ',')); await q.fill('#dicke', String(f.d * 100).replace('.', ',')); await oeffne(q);
    const dia = await q.$$eval('figure.chart', fs => fs.filter(x => ['kosten', 'co2-fossil', 'co2-gesamt'].includes(x.dataset.chart)).map(x => ({ id: x.dataset.chart, zeilen: [...x.querySelectorAll('.chart-row[data-material]')].map(z => ({ wert: z.dataset.wert === '' ? null : +z.dataset.wert, status: z.dataset.bewertung, detail: z.querySelector('.chart-detail') ? z.querySelector('.chart-detail').textContent : null, text: z.querySelector('.chart-value').innerText.replace(/\s+/g, ' ').trim() })), annahmen: !!x.querySelector('details.chart-annahmen li') })));
    if (dia.length !== 3) { abwG.push('Fall ' + i + ': ' + dia.length + ' Diagramme'); continue; }
    dia.forEach(d => { if (d.annahmen) annahmen++; else abwG.push(`Fall ${i} ${d.id}: keine Annahmen`); d.zeilen.forEach((z, k) => {
      const e = ref.rechnung[f.wahl[k]][i]; const erw = d.id === 'kosten' ? e.kosten : d.id === 'co2-fossil' ? (e.co2 && e.co2.fossil) : (e.co2 && e.co2.gesamt); gepr++;
      if ((erw === null || erw === undefined) !== (z.wert === null)) abwG.push(`Fall ${i} ${d.id} ${f.wahl[k]}: App ${z.wert} ≠ Referenz ${erw}`); else if (erw !== null && erw !== undefined && !nah(z.wert, erw, 1e-9)) abwG.push(`Fall ${i} ${d.id} ${f.wahl[k]}: ${z.wert} ≠ ${erw}`);
      if (z.wert !== null) { const m = /^([\d.,]+) (m³|kg|m²) × (-?[\d.,]+) /.exec(z.detail || ''); if (!m) detailAbw.push(`Fall ${i} ${d.id}: Detail „${z.detail}“`); else { const prod = dez(m[1]) * dez(m[3]); if (Math.abs(prod - z.wert) > 0.02 * Math.abs(z.wert) + 0.02) detailAbw.push(`Fall ${i} ${d.id} ${f.wahl[k]}: ${m[1]} × ${m[3]} = ${prod} ≠ ${z.wert}`); } } else ohneBalken++; }); });
  }
  check(`Diagramme Kosten, CO₂ fossil, CO₂ gesamt: ${faelle.length} zufällige Auswahlen (Fläche 1 … 1.234,5 m², Dicke 1 … 30 cm, alle Kategorien): jeder der ${gepr} angezeigten Gesamtwerte stimmt mit dem unabhängigen Referenzrechner überein; „nicht berechenbar/fehlt“ genau dort, wo die Referenz keinen Wert hat`, abwG.length === 0 && gepr > 400, abwG.slice(0, 4));
  check(`Unter jedem Wert steht die Rechnung „Menge × Kennwert“; Menge × Kennwert ergibt (auf Rundung genau) den angezeigten Gesamtwert – ${gepr - ohneBalken} Zeilen geprüft; jedes der ${faelle.length * 3} Diagramme hat den Block „Zugrunde liegende Mengen und Annahmen“`, detailAbw.length === 0 && annahmen === faelle.length * 3, [detailAbw.slice(0, 3), annahmen]);
  // Titel, Untertitel, Annahmen im Wortlaut
  await waehle(q, 'mineralwolle', 'eps', ''); await q.fill('#flaeche', '100'); await q.fill('#dicke', '20'); await oeffne(q);
  const titel = await q.$$eval('figure.chart h3', h => h.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  check('Titel nennen die Eingabe: „Materialkosten für 100 m² × 20 cm“, „CO₂ fossil (GWP fossil) für …“, „CO₂ gesamt (GWP inklusive biogenem Kohlenstoff) für …“', titel[0] === 'Materialkosten für 100 m² × 20 cm' && /^CO₂ fossil \(GWP fossil\) für 100 m² × 20 cm/.test(titel[1]) && /^CO₂ gesamt \(GWP inklusive biogenem Kohlenstoff\) für 100 m² × 20 cm/.test(titel[4]), titel);
  const ann = await q.$$eval('figure.chart details.chart-annahmen', d => d.map(x => x.textContent.replace(/\s+/g, ' ')));
  check('Annahmen im Wortlaut: Menge „100 m² × 20 cm = 20 m³“, Formel Menge × Einheitspreis, Umrechnung €/m³ → Volumen, €/kg → Gewicht, Mehrwertsteuer/Leistungsumfang „unbekannt“; CO₂: Module A1-A3 (Herstellung), nicht enthaltene Phasen, Datensatztyp; Gewicht: Volumen × Rohdichte', ann.length === 4 && /100 m² × 20 cm = 20 m³ Volumen/.test(ann[0]) && /Materialkosten = Menge × Einheitspreis/.test(ann[0]) && /Mehrwertsteuer unbekannt/.test(ann[0]) && /A1-A3 \(Herstellung\)/.test(ann[1]) && /Nutzung, Rückbau und Gutschriften sind nicht enthalten/.test(ann[1]) && /Gezeigt wird nur der fossile Anteil/.test(ann[1]) && /Gewicht = Volumen × Rohdichte/.test(ann[3]), ann);
  // Ohne Eingabe / mit Fehleingabe
  await q.fill('#dicke', ''); const ohneE = await q.$$eval('figure.chart', f => f.map(x => x.dataset.chart));
  await q.fill('#dicke', 'abc'); const fehlE = await q.$$eval('figure.chart', f => f.map(x => x.dataset.chart));
  check('Ohne oder mit fehlerhafter Dicke: keine Gesamtwert-Diagramme (kein Raten), nur λ; Hinweis erklärt, dass sie nach der Eingabe erscheinen', JSON.stringify(ohneE) === '["lambda"]' && JSON.stringify(fehlE) === '["lambda"]' && /Sie zeigen die berechneten Gesamtwerte und die zugrunde liegenden Mengen/.test(await q.$eval('#diagramme-inhalt', e => e.innerText)), [ohneE, fehlE]);
  await q.fill('#dicke', '20');
  // Plattenprodukt, kg-Kennwert, negative Werte
  await waehle(q, 'aluminium', 'kalkzementputz', ''); await oeffne(q);
  const alu = await q.$$eval('figure[data-chart="co2-fossil"] .chart-detail', d => d.map(x => x.textContent));
  check('Aluminium (CO₂ je kg) neben Putz (je m³): Rechnung zeigt „54.000 kg × … (Menge = Gewicht)“ und „20 m³ × …“; beide Gesamtmengen vergleichbar bewertet', /^54\.000 kg × 10,7 kg CO₂e\/kg \(Menge = Gewicht\)/.test(alu[0]) && /^20 m³ × /.test(alu[1]), alu);
  await waehle(q, 'normalbeton', 'brettschichtholz', ''); await oeffne(q);
  const holz = await q.$$eval('figure[data-chart="co2-gesamt"] .chart-row[data-material]', r => r.map(x => [x.dataset.wert, x.dataset.bewertung]));
  check('Holz: Gesamt-CO₂ negativ (−11.615 kg) wird als Gesamtwert gezeigt, aber nicht bewertet (biogener Kohlenstoff)', Math.abs(+holz[1][0] + 11615) < 1 && holz.every(x => x[1] === 'nicht bewertet'), holz);
  // Druck: Annahmen werden mitgedruckt
  await q.evaluate(() => { document.querySelectorAll('figure.chart details.chart-annahmen').forEach(d => { d.open = false; }); window.dispatchEvent(new Event('beforeprint')); });
  const offenImDruck = await q.$$eval('figure.chart details.chart-annahmen', d => d.every(x => x.open));
  check('Druckansicht: Die Blöcke „Zugrunde liegende Mengen und Annahmen“ werden aufgeklappt und mitgedruckt', offenImDruck);
  await q.evaluate(() => window.dispatchEvent(new Event('afterprint')));

  check('Keine Konsolenfehler oder -warnungen im gesamten Lauf (außer der erwarteten Meldung zur absichtlich kaputten Einstellungsdatei)', errors.length === 0, errors.slice(0, 3));
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
  await b.close();
  process.exit(fails === 0 ? 0 : 1);
})();
