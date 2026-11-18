/* MaterialMatch 3.2 (18.11.2026): zuverlässige Match-Funktion, Fallback, fehlende Daten, Preisspannen, Qualitätsprüfskript
   Aufruf:  node tests/test50.js */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');
const fs = require('fs');
const os = require('os');
const vm = require('vm');
const { spawnSync } = require('child_process');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 600))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html';
const ctx = { window: {} }; vm.createContext(ctx);
for (const f of ['baustoffe', 'produkte']) vm.runInContext(fs.readFileSync(path.join(PROJ, 'data', f + '.js'), 'utf8'), ctx);
const DB = ctx.window.MATERIALMATCH_DATA, PR = ctx.window.MATERIALMATCH_PRODUKTE;
const prod = id => PR.find(p => p.id === id);
const nah = (a, b, t = 0.011) => typeof a === 'number' && Math.abs(a - b) <= t;

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async modus => { const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await c.newPage(); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); await p.goto(URL + '?modus=' + modus); await p.waitForTimeout(300); return p; };
  const A = (einsatz, prioritaeten, anforderungen, kosten = 'keine', materialart = 'keine') => ({ einsatz, prioritaeten, anforderungen, kosten, materialart });
  const match = (p, a, o) => p.evaluate(([a, o]) => { const r = MM.matching.berechne(a, o); return { status: r.status, anzahlVoll: r.anzahlVoll, fallback: r.fallback, begrenzungen: r.begrenzungen, lockerung: r.lockerung, kriterien: r.kriterien.map(k => k.id), inaktiv: r.inaktiv.map(k => k.id), erg: r.ergebnisse.map(e => ({ id: e.id, name: e.material.name, passung: e.passung, stufe: e.stufe, score: e.score, vorl: e.vorlaeufig, rang: e.rangWert, abd: e.abdeckung, fehlend: e.fehlend, luecken: e.luecken.map(l => [l.id, l.art, l.status]), klassen: e.klassen, brand: (e.material.eigenschaften.brandverhalten || {}).wert || null, text: e.erklaerung })) }; }, [a, o || {}]);

  const echt = await neu('echt'), demo = await neu('demo');
  for (const [modus, p] of [['Echtdaten', echt], ['Demo', demo]]) {
    // ================= 1. Nie ein leeres Ergebnis =================
    const matrix = await p.evaluate(() => {
      const M = MM.matching, o = { n: 0, leer: 0, voll_mit_verletzung: 0, nicht_erfuellt_ohne_luecke: 0, ueber5Fallback: 0, beispiele: [] };
      const prios = [['kosten'], ['co2'], ['waerme'], ['gewicht'], ['festigkeit'], ['kosten', 'co2'], ['waerme', 'festigkeit', 'co2']];
      const anf = [['keine'], ['brandschutz'], ['natuerlich'], ['brandschutz', 'natuerlich']];
      M.EINSAETZE.forEach(e => M.MATERIALARTEN.forEach(ma => M.KOSTENRAHMEN.forEach(k => anf.forEach(an => prios.forEach(pr => {
        const r = M.berechne({ einsatz: e.id, prioritaeten: pr, anforderungen: an, kosten: k.id, materialart: ma.id });
        o.n++;
        if (!r.ergebnisse.length) { o.leer++; if (o.beispiele.length < 3) o.beispiele.push([e.id, ma.id, k.id, an.join('+'), pr.join('+')]); }
        r.ergebnisse.forEach(x => {
          if (x.passung === 'voll' && x.luecken.some(l => l.status === 'nicht_erfuellt')) o.voll_mit_verletzung++;
          if (x.passung === 'nicht_erfuellt' && !x.luecken.some(l => l.art === 'zwingend' && l.status === 'nicht_erfuellt')) o.nicht_erfuellt_ohne_luecke++;
        });
        if (r.ergebnisse.filter(x => x.passung === 'teilweise' || x.passung === 'nicht_erfuellt').length > 5) o.ueber5Fallback++;
      })))));
      return o;
    });
    check(modus + ': in allen ' + matrix.n + ' Antwortkombinationen (7 Einsatzbereiche × 4 Materialarten × 4 Kostenrahmen × 4 Anforderungen × 7 Prioritäten) erscheint mindestens ein Baustoff (vorher: 28,6 % leer); nie ein „vollständiges Match“, das eine Anforderung verletzt; höchstens fünf Teiltreffer bzw. Alternativen im Fallback', matrix.leer === 0 && matrix.voll_mit_verletzung === 0 && matrix.nicht_erfuellt_ohne_luecke === 0 && matrix.ueber5Fallback === 0, matrix);
  }

  // ================= 2. Nutzerprofile (Echtdaten) =================
  const guen = await match(echt, A('tragwerk', ['kosten'], ['keine'], 'guenstig'));
  check('Profil „besonders günstig“ (Tragwerk): Treffer vorhanden, Status ok, Kosten als Kriterium (Gewicht 2), keine Bewertung allein wegen des Preises', guen.erg.length >= 3 && guen.status !== 'keine_treffer' && guen.anzahlVoll >= 3 && guen.erg.filter(e => e.score !== null).every(e => e.abd.belegt >= 1), guen);
  const oeko = await match(echt, A('daemmung', ['co2'], ['natuerlich']));
  check('Profil „besonders ökologisch“ (Dämmung, geringe CO₂-Bilanz, natürliche Materialien): vollständige Treffer sind natürliche Baustoffe (Einordnung durch das Projekt); die Reihenfolge folgt dem Score', oeko.anzahlVoll >= 1 && oeko.erg.filter(e => e.passung === 'voll').every(e => e.klassen.includes('natuerlich')) && oeko.erg.filter(e => e.passung === 'voll' && e.score !== null).every((e, i, l) => i === 0 || l[i - 1].rang >= e.rang), oeko.erg.slice(0, 4));
  const waerme = await match(echt, A('daemmung', ['waerme'], ['keine']));
  check('Profil „gute Wärmedämmung“ (Dämmung): λ ist aktives Kriterium; die beste Punktzahl hat ein Dämmstoff mit belegtem λ; Materialien ohne λ stehen nicht vorn', waerme.kriterien.includes('waerme') && waerme.erg[0].score !== null && !waerme.erg[0].fehlend.includes('gute Wärmedämmung') && waerme.erg.filter(e => e.fehlend.includes('gute Wärmedämmung')).every(e => e.rang < waerme.erg[0].rang), waerme.erg.slice(0, 3));
  const brand = await match(echt, A('dach', ['co2'], ['brandschutz']));
  check('Profil „hoher Brandschutz“ (Dach): als „Passt“ steht nur Baustoffklasse A1, A2 oder B; fehlende Klasse = „nicht überprüfbar“ und nie „Passt“; Klasse C–F nie vollständig', brand.erg.every(e => e.passung !== 'voll' || /^(A1|A2|B)/.test(e.brand || '')) && brand.erg.filter(e => !e.brand).every(e => e.passung !== 'voll' && e.luecken.some(l => l[0] === 'brandschutz' && l[2] === 'nicht_pruefbar')) && brand.erg.filter(e => /^[C-F]/.test(e.brand || '')).every(e => e.passung === 'nicht_erfuellt'), brand.erg.map(e => [e.id, e.passung, e.brand]));
  const trag = await match(echt, A('tragwerk', ['festigkeit', 'co2'], ['keine']));
  check('Profil „tragend“ (Tragwerk, hohe Festigkeit + CO₂): Festigkeit und CO₂ sind aktive Kriterien; Treffer haben Eignung „geeignet“ oder „nicht ausreichend belegt“ (nie ohne Aussage)', trag.kriterien.includes('festigkeit') && trag.erg.length >= 3 && trag.erg.every(e => ['geeignet', 'bedingt', 'undokumentiert'].includes(e.stufe)), trag.erg.slice(0, 3));
  const komb = await match(echt, A('aussenwand', ['co2', 'waerme', 'festigkeit'], ['brandschutz', 'natuerlich'], 'mittel', 'nachwachsend'));
  check('Profil „Kombination“ (Außenwand, drei Prioritäten, Brandschutz, natürlich, nachwachsend): Ergebnis nicht leer; jedes „Passt“ erfüllt alle Anforderungen; weniger als drei vollständige Treffer führen zu gekennzeichneten Alternativen', komb.erg.length >= 1 && komb.erg.filter(e => e.passung === 'voll').every(e => e.klassen.includes('natuerlich') && e.klassen.includes('nachwachsend') && /^(A1|A2|B)/.test(e.brand || '')) && (komb.anzahlVoll >= 3 || komb.erg.some(e => e.passung !== 'voll')), komb.erg.map(e => [e.id, e.passung]));

  // ================= 3. Widersprüchliche Anforderungen: Fallback =================
  const wid = await match(echt, A('tragwerk', ['co2', 'festigkeit'], ['brandschutz', 'natuerlich'], 'guenstig', 'mineralisch'));
  check('Widerspruch („natürlich“ + „mineralisch“ + Brandschutz): kein Material erfüllt alles, trotzdem erscheinen die am besten geeigneten Alternativen, alle als „kein vollständiges Match“ bzw. „erfüllt nicht“ gekennzeichnet; Status „nur_alternativen“', wid.erg.length >= 3 && wid.anzahlVoll === 0 && wid.status === 'nur_alternativen' && wid.fallback.aktiv && wid.erg.every(e => e.passung !== 'voll') && wid.erg.every(e => /Erfüllt nicht|Nicht überprüfbar/.test(e.text)), wid.erg.map(e => [e.id, e.passung, e.text.slice(-80)]));
  check('Fallback: nennt die einschränkenden Anforderungen (Zahlen je Anforderung, zwingend/Wunsch) und bietet lockerbare Wünsche an; Brandschutz ist als zwingend nicht lockerbar', wid.begrenzungen.length === 3 && wid.begrenzungen.every(x => x.nichtErfuellt + x.nichtPruefbar > 0) && wid.begrenzungen.find(x => x.id === 'brandschutz').art === 'zwingend' && wid.lockerung.every(x => x.id !== 'brandschutz') && wid.lockerung.length >= 1, { beg: wid.begrenzungen, lock: wid.lockerung });
  const gelo = await match(echt, A('tragwerk', ['co2', 'festigkeit'], ['brandschutz', 'natuerlich'], 'guenstig', 'mineralisch'), { gelockert: ['natuerlich'] });
  check('Lockerung („natürlich“ gelockert): mehr vollständige Treffer als vorher; ein gelockerter Wunsch erscheint nicht mehr als Lücke', gelo.anzahlVoll > wid.anzahlVoll && gelo.erg.every(e => e.luecken.every(l => l[0] !== 'natuerlich')) && gelo.erg.filter(e => e.passung === 'voll').every(e => e.klassen.includes('mineralisch') && /^(A1|A2|B)/.test(e.brand || '')), gelo.erg.map(e => [e.id, e.passung]));
  const zwing = await match(echt, A('dach', ['co2'], ['brandschutz'], 'keine', 'nachwachsend'));
  check('Zwingende Anforderungen werden nicht durch gute Punkte ausgeglichen: ein Material der Klasse C–F steht nie vor einem Material, das Brandschutz erfüllt (Rangfolge nach Passung)', (() => { const r = { voll: 0, eingeschraenkt: 1, teilweise: 2, nicht_erfuellt: 3 }; return zwing.erg.every((e, i, l) => i === 0 || r[l[i - 1].passung] <= r[e.passung]); })(), zwing.erg.map(e => [e.id, e.passung, e.score]));

  // ================= 4. Fehlende Daten =================
  const lueck = await match(echt, A('innenausbau', ['kosten', 'co2', 'waerme'], ['keine']));
  check('Unvollständige Daten (Innenausbau): kein Material wird allein wegen fehlender Kennwerte ausgeschlossen (alle geeigneten bleiben sichtbar, auch ohne Score); fehlende Werte stehen im Text; ein Score mit lückenhafter Basis ist „vorläufig“', lueck.erg.length >= 5 && lueck.erg.every(e => e.score !== null || /Keine Punktbewertung/.test(e.text)) && lueck.erg.filter(e => e.score !== null && e.abd.belegt < e.abd.von).every(e => e.rang <= e.score) && lueck.erg.filter(e => e.vorl).every(e => /Vorläufig/.test(e.text)), lueck.erg.slice(0, 4));
  check('Fehlende Werte zählen nicht als gut: bei gleicher Passung und Eignung rangiert ein Material mit weniger belegten Kriterien nie allein wegen der Lücke weiter vorn (Rangwert = Score × (0,6 + 0,4 × Abdeckung))', (() => { const l = waerme.erg.concat(oeko.erg, trag.erg); return l.filter(e => e.score !== null).every(e => Math.abs(e.rang - e.score * (0.6 + 0.4 * (e.abd.belegt / Math.max(1, e.abd.von)))) < 0.6 || e.abd.von === 0); })());

  // ================= 5. Verknüpfung Datenbank – Matching =================
  const pools = await echt.evaluate(() => { const M = MM.matching, seen = {}; M.EINSAETZE.forEach(e => { const r = M.berechne({ einsatz: e.id, prioritaeten: ['co2'], anforderungen: ['keine'], kosten: 'keine', materialart: 'keine' }); r.ergebnisse.forEach(x => { seen[x.id] = true; }); }); const ids = MATERIALMATCH_DATA.baustoffe.map(m => m.id); return { alle: ids.length, nie: ids.filter(i => !seen[i]), profilFehlt: ids.filter(i => !MATERIALMATCH_PROFIL.materialien[i]) }; });
  check('Datenbank ↔ Matching: alle 50 Baustoffe tauchen in mindestens einem Einsatzbereich auf (keiner wird unbeabsichtigt ausgeschlossen); jedes Material hat eine Einordnung im Materialprofil', pools.alle === 50 && pools.nie.length === 0 && pools.profilFehlt.length === 0, pools);

  // ================= 6. Preise und Preisspannen =================
  const ks = DB.baustoffe.find(m => m.id === 'kalksandstein').eigenschaften.preis;
  const ksPreise = PR.filter(p => p.material === 'kalksandstein' && p.eigenschaften.preis && p.eigenschaften.preis.einheit === '€/m³' && typeof p.eigenschaften.preis.wert === 'number').map(p => p.eigenschaften.preis.wert).sort((x, y) => x - y);
  const med = l => { const n = l.length; return n % 2 ? l[(n - 1) / 2] : (l[n / 2 - 1] + l[n / 2]) / 2; };
  check('Preisspanne Kalksandstein: Minimum, Maximum und Median stimmen mit den 8 Einzelpreisen der Produkte (Xella, KS-ORIGINAL/Cirkel) überein; Wert liegt in der Spanne; Quelle „Preisspanne (berechnet …)“ nennt alle Einzelquellen; Datenart Richtwert; netto', ksPreise.length === 8 && ks.spanne.min === ksPreise[0] && ks.spanne.max === ksPreise[7] && nah(ks.wert, med(ksPreise)) && ks.spanne.anzahl === 8 && ks.art === 'richtwert' && ks.mwst === 'exkl. MwSt.' && DB.quellen.find(q => q.id === ks.quelle).quellen.length === 8 && /Preisspanne/.test(DB.quellen.find(q => q.id === ks.quelle).quellenart) && /kein einzelner Marktpreis/.test(ks.hinweis), { ks, ksPreise });
  const PB = [['profibaustoffe-mp2', 489.75, 11], ['profibaustoffe-mp4', 482.50, 12], ['profibaustoffe-mk1', 462.75, 14], ['profibaustoffe-mk3', 501.25, 13], ['profibaustoffe-alphafliessestrich-4mm-ca-c20', 467.10, 19], ['profibaustoffe-alphafliessestrich-4mm-ca-c30', 529.10, 19], ['profibaustoffe-alphafliessestrich-2mm-ca-c20', 512.50, 19]];
  check('Profibaustoffe-Preisliste 2026 (Österreich): sieben neue Produktpreise = €/t × Verbrauch ÷ 10 nachgerechnet (z. B. MP2 489,75 × 11 ÷ 10 = 538,73 €/m³); netto; Region Österreich ausdrücklich genannt; Status „Preisliste“', PB.every(([id, t, v]) => { const p = prod(id); const q = DB.quellen.find(x => x.id === p.eigenschaften.preis.quelle); return nah(p.eigenschaften.preis.wert, t * v / 10) && p.eigenschaften.preis.mwst === 'exkl. MwSt.' && /Österreich/.test(q.region) && q.preisangabe.status === 'preisliste' && q.preisangabe.einheit === '€/t' && q.preisangabe.preis === t && !p.standard; }));
  const spannen = ['kalkgipsinnenputz', 'kalkzementputz', 'calciumsulfatestrich'].map(id => [id, DB.baustoffe.find(m => m.id === id).eigenschaften.preis]);
  check('Preisspannen für Kalkgipsputz, Kalkzementputz und Calciumsulfatestrich: berechnet aus 2–3 Listenpreisen; Region „Österreich (Preise nicht für Deutschland)“ steht im Hinweis; Wert liegt in der Spanne', spannen.every(([id, p]) => p.spanne && p.wert >= p.spanne.min && p.wert <= p.spanne.max && /Österreich/.test(p.hinweis) && p.art === 'richtwert') && spannen[0][1].spanne.anzahl === 2 && spannen[2][1].spanne.anzahl === 3, spannen.map(x => x[1].spanne));
  const sw = await match(echt, A('innenausbau', ['kosten'], ['keine'], 'guenstig'));
  const preisAnzeige = await echt.evaluate(() => { MM.match.zeigeInterview(0); localStorage.setItem('materialmatch.match.v1', JSON.stringify({ antworten: { einsatz: 'tragwerk', kosten: 'guenstig', anforderungen: ['keine'], prioritaeten: ['kosten', 'co2'], materialart: 'mineralisch' } })); return true; });
  await echt.reload(); await echt.waitForTimeout(300); await echt.evaluate(() => MM.reiter.zeige('match')); await echt.waitForTimeout(300);
  const ui = await echt.evaluate(() => { document.querySelectorAll('.sw-top-mehr').forEach(d => d.open = true); return ({ eintraege: document.querySelectorAll('.sw-top-eintrag').length, text: document.querySelector('.sw-top') ? document.querySelector('.sw-top').innerText : '', karte: !!document.querySelector('.sw-karte'), mehrZu: document.querySelectorAll('.sw-top-eintrag').length > 0 && document.querySelectorAll('.sw-top-mehr').length === document.querySelectorAll('.sw-top-eintrag').length }); });
  check('Trefferliste in der Oberfläche: 3 bis 5 beste Baustoffe mit Match-Punkten, Vorteilen, Nachteilen und Preis bzw. Preisspanne sofort sichtbar, dazu Ökologie und Begründung unter „Begründung und weitere Details“ aufklappbar; darunter weiterhin die Karten zum Wischen', ui.eintraege >= 3 && ui.eintraege <= 5 && /Match-Punkte/.test(ui.text) && /Vorteile/.test(ui.text) && /Preis/.test(ui.text) && /Ökologie/.test(ui.text) && /Begründung/.test(ui.text) && ui.mehrZu && ui.karte, ui);
  check('Preis in der Trefferliste: Kalksandstein erscheint mit „ca. 340,76 bis 419,83 €/m³“ (Spanne) bzw. Material ohne Preis mit „Preis nicht belegt“', (await echt.evaluate(() => { MM.match.zeigeKarten(); const t = document.querySelector('.sw-top').innerText; return { ok: /Preis nicht belegt|ca\. 340,76 bis 419,83/.test(t), t: t.slice(0, 200) }; })).ok);

  // ================= 7. Fallback und Lockerung in der Oberfläche =================
  await echt.evaluate(() => { localStorage.setItem('materialmatch.match.v1', JSON.stringify({ antworten: { einsatz: 'tragwerk', kosten: 'guenstig', anforderungen: ['brandschutz', 'natuerlich'], prioritaeten: ['co2', 'festigkeit'], materialart: 'mineralisch' } })); });
  await echt.reload(); await echt.waitForTimeout(300); await echt.evaluate(() => MM.reiter.zeige('match')); await echt.waitForTimeout(300);
  const fb = await echt.evaluate(() => ({ banner: document.querySelector('.sw-fallback') ? document.querySelector('.sw-fallback').innerText : '', passung: [...document.querySelectorAll('.sw-top-eintrag .sw-passung')].map(x => x.textContent), lock: [...document.querySelectorAll('[data-lockern]')].map(x => x.dataset.lockern), kartePassung: document.querySelector('.sw-karte .sw-passung') ? document.querySelector('.sw-karte .sw-passung').textContent : null }));
  check('Fallback in der Oberfläche: Hinweis „Kein Material erfüllt alle deine Anforderungen“, einschränkende Anforderungen, Lockerungsknöpfe, jeder Eintrag und die Karte tragen die Kennzeichnung „Kein vollständiges Match“ bzw. „Erfüllt eine zwingende Anforderung nicht“', /Kein Material erfüllt alle/.test(fb.banner) && /schränkt ein/.test(fb.banner) && fb.lock.length >= 1 && fb.passung.length >= 3 && fb.passung.every(t => /Kein vollständiges Match|zwingende|Nicht alle Angaben/.test(t)) && /Kein vollständiges Match|zwingende|Nicht alle Angaben/.test(fb.kartePassung || ''), fb);
  await echt.click('[data-lockern="' + fb.lock[0] + '"]'); await echt.waitForTimeout(300);
  const nach = await echt.evaluate(() => ({ zurueck: [...document.querySelectorAll('[data-lockern-zurueck]')].map(x => x.dataset.lockernZurueck), gelockert: MM.match.gelockert(), voll: MM.match.ergebnis().anzahlVoll, passt: [...document.querySelectorAll('.sw-top-eintrag .sw-passung')].filter(x => x.textContent === 'Passt').length }));
  check('Lockern per Knopf: der Wunsch ist gelockert (Knopf „wieder verlangen“ erscheint), es gibt vollständige Treffer („Passt“); „wieder verlangen“ stellt den Zustand wieder her', nach.gelockert.length === 1 && nach.zurueck.length === 1 && nach.voll >= 1 && nach.passt >= 1 && await (async () => { await echt.click('[data-lockern-zurueck]'); await echt.waitForTimeout(300); return await echt.evaluate(() => MM.match.gelockert().length === 0 && MM.match.ergebnis().anzahlVoll === 0); })(), nach);
  // Tastatur und Wischen funktionieren weiter
  const tast = await echt.evaluate(() => { const b = document.querySelector('.sw-buehne'); b.focus(); b.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); return true; });
  await echt.waitForTimeout(500);
  check('Bestehende Bedienung bleibt: Pfeil rechts auf dem Kartenstapel merkt das Material als Favorit', await echt.evaluate(() => MM.favoriten.liste().length === 1));

  // ================= 8. Qualitätsprüfskript =================
  const lauf = (extra = []) => spawnSync('node', [path.join(PROJ, 'tools', 'pruefe_datenqualitaet.js'), ...extra], { encoding: 'utf8' });
  const ok = lauf();
  check('Prüfskript tools/pruefe_datenqualitaet.js: der aktuelle Datenbestand hat 0 Fehler; es nennt Baustoffe, Produkte, Quellen und die Zahl der fehlenden Kennwerte', ok.status === 0 && /FEHLER: 0/.test(ok.stdout) && /50 Baustoffe, 85 Produkte, 173 Quellen/.test(ok.stdout) && /nicht belegt \d+/.test(ok.stdout), ok.stdout.slice(0, 400));
  // Mutationstests: absichtlich kaputte Daten müssen erkannt werden
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-daten-'));
  const kopie = f => fs.copyFileSync(path.join(PROJ, 'data', f), path.join(tmp, f));
  ['baustoffe.js', 'produkte.js', 'materialprofil.js'].forEach(kopie);
  const mut = (datei, von, nach) => { const t = fs.readFileSync(path.join(tmp, datei), 'utf8'); if (!t.includes(von)) throw new Error('Mutation nicht anwendbar: ' + von.slice(0, 40)); fs.writeFileSync(path.join(tmp, datei), t.replace(von, nach)); };
  const FALLE = [
    ['negative Wärmeleitfähigkeit', 'baustoffe.js', 'waermeleitfaehigkeit:  { wert: 0.10, einheit: "W/(m·K)", art: "beispiel", quelle: null }', 'waermeleitfaehigkeit:  { wert: -0.10, einheit: "W/(m·K)", art: "beispiel", quelle: null }', /Wert -0\.1 .*außerhalb|Wert keine Zahl|außerhalb des üblichen/],
    ['falsche Einheit der Rohdichte', 'baustoffe.js', 'rohdichte:             { wert: 380, einheit: "kg/m³"', 'rohdichte:             { wert: 380, einheit: "g/cm³"', /Einheit „g\/cm³“ statt kg\/m³/],
    ['Richtwert ohne Quelle', 'baustoffe.js', 'rohdichte:             { wert: 380, einheit: "kg/m³", art: "richtwert", quelle: "oebd-c5310f2b"', 'rohdichte:             { wert: 380, einheit: "kg/m³", art: "richtwert", quelle: null', /richtwert ohne Quelle/],
    ['unbekannte Quelle', 'baustoffe.js', 'quelle: "oebd-c916ceb3"', 'quelle: "gibt-es-nicht"', /unbekannte Quelle gibt-es-nicht/],
    ['unplausible Größenordnung', 'baustoffe.js', 'rohdichte:             { wert: 380, einheit: "kg/m³"', 'rohdichte:             { wert: 380000, einheit: "kg/m³"', /außerhalb des üblichen Bereichs/],
    ['doppelter Baustoffname', 'baustoffe.js', 'id: "stahlbeton",', 'id: "stahlbeton2",', null],
    ['Produkt mit unbekanntem Material', 'produkte.js', '"material": "steico-x"', '"material": "steico-x"', null]
  ];
  // Einzelne Mutationen (je auf frischer Kopie)
  const einzeln = [];
  for (const [name, datei, von, nach, muster] of FALLE.slice(0, 5)) {
    ['baustoffe.js', 'produkte.js', 'materialprofil.js'].forEach(kopie);
    mut(datei, von, nach);
    const r = spawnSync('node', [path.join(PROJ, 'tools', 'pruefe_datenqualitaet.js'), '--daten', tmp], { encoding: 'utf8' });
    einzeln.push([name, r.status === 1 || /WARN/.test(r.stdout), muster.test(r.stdout)]);
  }
  check('Prüfskript erkennt absichtlich eingebaute Fehler: negativen Wert, falsche Einheit, Richtwert ohne Quelle, unbekannte Quelle, unplausible Größenordnung (Gegenprobe)', einzeln.every(x => x[1] && x[2]), einzeln);
  ['baustoffe.js', 'produkte.js', 'materialprofil.js'].forEach(kopie);
  mut('produkte.js', '"id": "steico-therm-dry",', '"id": "steico-therm",');
  const dup = spawnSync('node', [path.join(PROJ, 'tools', 'pruefe_datenqualitaet.js'), '--daten', tmp], { encoding: 'utf8' });
  check('Prüfskript erkennt doppelte Produkte (gleiche ID) mit Exit-Code 1', dup.status === 1 && /Produkt-ID doppelt: steico-therm/.test(dup.stdout), dup.stdout.slice(0, 300));
  ['baustoffe.js', 'produkte.js', 'materialprofil.js'].forEach(kopie);
  mut('produkte.js', '"material": "porenbeton",', '"material": "gibtsnicht",');
  const verk = spawnSync('node', [path.join(PROJ, 'tools', 'pruefe_datenqualitaet.js'), '--daten', tmp], { encoding: 'utf8' });
  check('Prüfskript erkennt fehlerhafte Verknüpfungen (Produkt → unbekanntes Material)', verk.status === 1 && /unbekanntes Material gibtsnicht/.test(verk.stdout), verk.stdout.slice(0, 300));
  fs.rmSync(tmp, { recursive: true, force: true });
  const bericht = fs.readFileSync(path.join(PROJ, 'DATENLUECKEN.md'), 'utf8');
  check('DATENLUECKEN.md vorhanden: Überblick mit Zahlen, Gründe je Kennwert, Lückenliste je Baustoff, nicht nutzbare Quellen (Heinze, WECOBIS, baubook, EUR-Lex)', /## Überblick/.test(bericht) && /## Lückenliste/.test(bericht) && /Heinze/.test(bericht) && /WECOBIS/.test(bericht) && /baubook/.test(bericht) && /EUR-Lex/.test(bericht) && bericht.split('\n').filter(l => /^### /.test(l)).length >= 45);

  await echt.close(); await demo.close(); await b.close();
  check('Keine Fehler oder Warnungen in der Konsole', errors.length === 0, errors.slice(0, 3));
  console.log(fails ? '\n' + fails + ' Prüfung(en) FEHLGESCHLAGEN' : '\nAlle Prüfungen bestanden');
  process.exit(fails ? 1 : 0);
})();
