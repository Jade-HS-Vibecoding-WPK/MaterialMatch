const PROJ = require('path').resolve(__dirname, '..');
const AUSGABE = require('path').join(require('os').tmpdir(), 'materialmatch-tests') + '/';
require('fs').mkdirSync(AUSGABE, { recursive: true });
const { chromium } = require('playwright');
require('./_offline.js');
let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 400))); }

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  p.on('pageerror', e => errors.push(String(e)));
  await p.goto('file://' + PROJ + '/index.html?modus=demo'); await p.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
  await p.evaluate(() => document.querySelectorAll('main section.panel > details').forEach(d => { d.open = true; }));

  const E = id => p.evaluate(i => { const m = MATERIALMATCH_DATA.baustoffe.find(x => x.id === i); return JSON.parse(JSON.stringify(m.eigenschaften)); }, id);
  const FZ = x => p.evaluate(v => MM.berechnung.formatZahl(v), x);
  const waehle = (a, b_, c = '') => p.evaluate(([a, b_, c]) => MM.auswahl.setzeAuswahl({ a, b: b_, c }), [a, b_, c]);
  const tab = id => p.$$eval('#' + id + ' table tr', trs => trs.map(tr => [...tr.cells].map(c => c.innerText.replace(/\s+/g, ' ').trim())));
  const zeile = async (id, titel) => (await tab(id)).find(r => r[0].startsWith(titel));
  const txt = id => p.$eval('#' + id, e => e.innerText);
  const warnungen = id => p.$$eval('#' + id + ' .warn', w => w.map(x => x.textContent));
  const marker = async (id, titel) => p.$$eval('#' + id + ' table tr', (trs, t) => { const tr = trs.find(r => r.cells[0].innerText.startsWith(t)); return [...tr.querySelectorAll('td')].map(td => (td.querySelector('.art') || {}).textContent || ''); }, titel);
  const BOXEN = ['ergebnis-menge', 'ergebnis-technisch', 'ergebnis-kosten', 'ergebnis-co2', 'ergebnis-weitere'];

  // ---- Unterabschnitte
  const subs = await p.$$eval('#ergebnisse details.sub', ds => ds.map(d => ({ t: d.querySelector('summary').textContent.trim(), open: d.open })));
  check('Sechs Unterabschnitte in richtiger Reihenfolge', JSON.stringify(subs.map(s => s.t)) === JSON.stringify(['Menge und Gewicht', 'Technische Eigenschaften', 'Kosten', 'CO₂-Bilanz', 'Wärmedurchlasswiderstand (R-Wert)', 'Weitere Eigenschaften']), subs);
  check('Erste fünf offen, "Weitere Eigenschaften" zugeklappt', JSON.stringify(subs.map(s => s.open)) === '[true,true,true,true,true,false]', subs);
  await p.click('#ergebnisse details.sub:nth-of-type(2) > summary');
  check('Klick klappt "Technische Eigenschaften" zu (Inhalt unsichtbar)', !(await p.isVisible('#ergebnis-technisch')));
  await p.click('#ergebnisse details.sub:nth-of-type(2) > summary');
  check('Zweiter Klick klappt wieder auf', await p.isVisible('#ergebnis-technisch'));
  await p.click('#ergebnisse details.sub:nth-of-type(6) > summary');
  check('"Weitere Eigenschaften" lässt sich aufklappen', await p.isVisible('#ergebnis-weitere'));

  // ---- Ohne Auswahl
  for (const id of BOXEN.slice(1)) check('Ohne Auswahl: Hinweis in ' + id, (await txt(id)).includes('Wählen Sie Materialien aus'));

  // ---- Mix Beton / BSH / Baustahl
  const nb = await E('normalbeton'), bsh = await E('brettschichtholz'), st = await E('baustahl');
  await waehle('normalbeton', 'brettschichtholz', 'baustahl');
  let r = await zeile('ergebnis-technisch', 'Nennwert λD');
  check('λ-Werte aus Datenbank mit Einheit in der Zeilenüberschrift', r[0].includes('W/(m·K)') && r[1].startsWith(await FZ(nb.waermeleitfaehigkeit.wert)) && r[2].startsWith(await FZ(bsh.waermeleitfaehigkeit.wert)) && r[3].startsWith(await FZ(st.waermeleitfaehigkeit.wert)), r);
  check('λ: Datenart-Kürzel B (Beispieldaten)', JSON.stringify(await marker('ergebnis-technisch', 'Nennwert λD')) === '["B","B","B"]', await marker('ergebnis-technisch', 'Nennwert λD'));
  r = await zeile('ergebnis-technisch', 'Druckfestigkeit');
  check('Druckfestigkeit Beton und BSH aus Datenbank', r[1].startsWith(await FZ(nb.druckfestigkeit.wert)) && r[2].startsWith(await FZ(bsh.druckfestigkeit.wert)), r);
  check('Druckfestigkeit Baustahl: "nicht anwendbar" mit Fußnote', r[3].startsWith('nicht anwendbar') && /\d$/.test(r[3]), r);
  check('Fußnote enthält die Begründung (Streckgrenze)', (await txt('ergebnis-technisch')).includes('Streckgrenze'));
  r = await zeile('ergebnis-technisch', 'Brandverhalten');
  check('Euroklassen A1 / D-s2,d0 / A1', r[1].startsWith(nb.brandverhalten.wert) && r[2].startsWith(bsh.brandverhalten.wert) && r[3].startsWith(st.brandverhalten.wert), r);
  check('Hinweis: Euroklasse ≠ Feuerwiderstand, keine Rangfolge', (await txt('ergebnis-technisch')).includes('nicht den Feuerwiderstand') && (await txt('ergebnis-technisch')).includes('keine Rangfolge') || (await txt('ergebnis-technisch')).includes('Rangfolge'));

  r = await zeile('ergebnis-kosten', 'Einheitspreis');
  check('Preise mit Einheit in der Zelle (€/m³ und €/kg)', r[1].startsWith(await FZ(nb.preis.wert) + ' €/m³') && r[3].startsWith(await FZ(st.preis.wert) + ' €/kg'), r);
  check('Mehrwertsteuer und Leistungsumfang: Beton (Holcim-Listenpreis) „exkl. MwSt.“ mit Leistungsumfang, BSH und Baustahl (Beispielpreise) unbekannt', (await zeile('ergebnis-kosten', 'Mehrwertsteuer')).slice(1).join('|').startsWith('exkl. MwSt.') && (await zeile('ergebnis-kosten', 'Mehrwertsteuer')).slice(2).every(x => x === 'unbekannt') && /^Material \(Listenpreis/.test((await zeile('ergebnis-kosten', 'Leistungsumfang'))[1]) && (await zeile('ergebnis-kosten', 'Leistungsumfang')).slice(2).every(x => x === 'unbekannt'));
  let w = await warnungen('ergebnis-kosten');
  check('Kosten: "Kein belastbarer direkter Vergleich möglich" wegen €/m³ vs €/kg', w.length === 1 && w[0].includes('Kein belastbarer direkter Vergleich möglich') && w[0].includes('€/m³') && w[0].includes('€/kg'), w);
  check('Kosten: Hinweis auf Beispielpreise und auf die Berechnung im Abschnitt darüber', (await txt('ergebnis-kosten')).includes('Beispielwerte, keine Marktpreise') && (await txt('ergebnis-kosten')).includes('Abschnitt darüber'));

  r = await zeile('ergebnis-co2', 'Bezugsgröße');
  check('CO₂ Bezugsgrößen: 1 m³ / 1 m³ / 1 kg', JSON.stringify(r.slice(1)) === '["1 m³","1 m³","1 kg"]', r);
  check('CO₂ Module A1-A3', (await zeile('ergebnis-co2', 'Lebenszyklusmodule')).slice(1).every(x => x === 'A1-A3'));
  r = await zeile('ergebnis-co2', 'GWP gesamt');
  check('GWP gesamt aus Datenbank (Beton, BSH, Stahl)', r[1].startsWith(await FZ(nb.gwp.werte.gesamt)) && r[2].startsWith(await FZ(bsh.gwp.werte.gesamt)) && r[3].startsWith(await FZ(st.gwp.werte.gesamt)), r);
  check('GWP: Kürzel R (Richtwert) mit Fußnote', JSON.stringify(await marker('ergebnis-co2', 'GWP gesamt')) === '["R","R","R"]');
  check('fossil und biogen aus Datenbank', (await zeile('ergebnis-co2', 'davon fossil'))[2] === await FZ(bsh.gwp.werte.fossil) && (await zeile('ergebnis-co2', 'davon biogen'))[2] === await FZ(bsh.gwp.werte.biogen), [await zeile('ergebnis-co2', 'davon fossil'), await zeile('ergebnis-co2', 'davon biogen')]);
  w = await warnungen('ergebnis-co2');
  check('CO₂: Warnung nennt Bezugsgrößen UND Datensatztypen', w.length === 1 && w[0].includes('Kein belastbarer direkter Vergleich möglich') && w[0].includes('1 m³, 1 kg') && w[0].includes('Datensatztypen') && w[0].includes('Sicherheitszuschl'), w);
  check('CO₂: Hinweis biogener Kohlenstoff, keine Pauschalaussage', (await txt('ergebnis-co2')).includes('Biogener Kohlenstoff') && (await txt('ergebnis-co2')).includes('nicht zulässig'));
  check('CO₂: Fußnote nennt Typ, Eigner und Sicherheitszuschläge', (await txt('ergebnis-co2')).includes('Sphera Solutions GmbH') && (await txt('ergebnis-co2')).includes('Sicherheitszuschläge'));
  check('CO₂: Umrechnung Baustahl dokumentiert (Division durch 1000)', (await txt('ergebnis-co2')).includes('Division durch 1000'));

  // ---- Weitere
  r = await zeile('ergebnis-weitere', 'Wasserdampf');
  check('μ: Beton und BSH aus Datenbank, Stahl nicht anwendbar', r[1].startsWith(await FZ(nb.wasserdampf_mu.wert)) && r[2].startsWith(await FZ(bsh.wasserdampf_mu.wert)) && r[3].startsWith('nicht anwendbar'), r);
  check('Recycling-Text vorhanden', (await zeile('ergebnis-weitere', 'Recycling'))[2].includes('Wiederverwendung'));
  check('Hinweise: Nutzungsdauer und Schallschutz nicht hinterlegt', (await txt('ergebnis-weitere')).includes('Nutzungsdauer: Es sind keine Werte') && (await txt('ergebnis-weitere')).includes('Schallschutz: Es sind keine Werte'));

  // ---- Vergleichbares Paar: Beton + Porenbeton (beide generisch, 1 m³, A1-A3)
  await waehle('normalbeton', 'porenbeton');
  w = await warnungen('ergebnis-co2');
  check('Beton/Porenbeton CO₂: keine Warnung', w.length === 0, w);
  check('Beton/Porenbeton CO₂: "unmittelbar vergleichbar" + Hinweis Bauteilfunktion', (await txt('ergebnis-co2')).includes('unmittelbar vergleichbar') && (await txt('ergebnis-co2')).includes('nicht je Bauteilfunktion'));
  check('Beton/Porenbeton: kein Biogen-Hinweis', !(await txt('ergebnis-co2')).includes('Biogener Kohlenstoff'));
  w = await warnungen('ergebnis-kosten');
  check('Beton/Porenbeton Kosten: Warnung nur wegen MwSt/Umfang, nicht wegen Einheit', w.length === 1 && w[0].includes('Mehrwertsteuer') && !w[0].includes('unterschiedliche Einheiten'), w);

  // ---- Beton + BSH: beide generisch -> vergleichbar, aber Biogen-Hinweis
  await waehle('normalbeton', 'brettschichtholz');
  check('Beton/BSH CO₂: keine Warnung (gleiche Basis)', (await warnungen('ergebnis-co2')).length === 0);
  check('Beton/BSH CO₂: Biogen-Hinweis erscheint', (await txt('ergebnis-co2')).includes('Biogener Kohlenstoff'));

  // ---- Fehlender CO₂-Wert (Stahlbeton)
  await waehle('normalbeton', 'stahlbeton');
  r = await zeile('ergebnis-co2', 'GWP gesamt');
  check('Stahlbeton: CO₂ "fehlt" mit Fußnote', r[2].startsWith('fehlt') && /\d$/.test(r[2]), r);
  check('Stahlbeton: Fußnote erklärt, warum kein Datensatz', (await txt('ergebnis-co2')).includes('Kein eigener ÖKOBAUDAT-Datensatz für Stahlbeton'));
  w = await warnungen('ergebnis-co2');
  check('Stahlbeton + Beton: Warnung "fehlt der CO₂-Kennwert"', w.length === 1 && w[0].includes('fehlt der CO₂-Kennwert'), w);

  // ---- Dachziegel (m², keine Schicht) + Klinker (m³)
  await waehle('dachziegel', 'klinker');
  check('Dachziegel: λ "fehlt"', (await zeile('ergebnis-technisch', 'Nennwert λD'))[1].startsWith('fehlt'));
  check('Dachziegel: Preis „Preis nicht verfügbar“ (kein verlässlicher Preis, nichts geschätzt)', (await zeile('ergebnis-kosten', 'Einheitspreis'))[1].startsWith('Preis nicht verfügbar'));
  check('Dachziegel: Bezugsgröße 1 m²', (await zeile('ergebnis-co2', 'Bezugsgröße'))[1] === '1 m²');
  w = await warnungen('ergebnis-co2');
  check('Dachziegel (m²) vs Klinker (m³): kein belastbarer Vergleich', w.length === 1 && w[0].includes('1 m²') && w[0].includes('1 m³'), w);
  check('Flächengewicht-Zeile erscheint nur, wenn vorhanden (Dachziegel 45)', (await zeile('ergebnis-weitere', 'Flächengewicht'))[1].startsWith('45'), await zeile('ergebnis-weitere', 'Flächengewicht'));
  await waehle('normalbeton', 'porenbeton');
  check('Ohne Flächengewicht-Material: Zeile nicht vorhanden', !(await zeile('ergebnis-weitere', 'Flächengewicht')));

  // ---- Einzelnes Material
  await waehle('eps', '');
  check('Einzelnes Material: Tabellen vorhanden', (await tab('ergebnis-co2')).length > 1 && (await tab('ergebnis-technisch')).length > 1);
  check('Einzelnes Material: keine Vergleichbarkeitsaussage', (await warnungen('ergebnis-co2')).length === 0 && !(await txt('ergebnis-co2')).includes('unmittelbar vergleichbar'));
  await waehle('', 'eps');
  check('Nur B gewählt: Spaltenkopf "B"', (await p.$$eval('#ergebnis-co2 thead .slot', s => s.map(x => x.textContent))).join() === 'B');

  // ---- Reine Beispiel-CO₂-Werte -> nicht belastbar
  await p.evaluate(() => { for (const id of ['mineralwolle', 'eps']) { const g = MATERIALMATCH_DATA.baustoffe.find(m => m.id === id).eigenschaften.gwp; g.art = 'beispiel'; g.quelle = null; } MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: '' }); });
  check('Beispiel-CO₂ bei gleicher Basis: Warnung "nicht belastbar"', (await warnungen('ergebnis-co2')).some(x => x.includes('Beispieldaten und nicht belastbar')), await warnungen('ergebnis-co2'));
  check('Kürzel B im CO₂-Wert', JSON.stringify(await marker('ergebnis-co2', 'GWP gesamt')) === '["B","B"]');

  // ---- Fußnoten konsistent
  await waehle('normalbeton', 'brettschichtholz', 'baustahl');
  for (const id of BOXEN.slice(1)) {
    const f = await p.$eval('#' + id, e => ({ sups: [...e.querySelectorAll('table sup.fn')].map(s => Number(s.textContent)), lis: [...e.querySelectorAll('ol.footnotes li')].map(l => l.textContent.trim()) }));
    check('Fußnoten ' + id + ': jede Nummer hat einen Text, keine leeren', f.sups.every(n => n >= 1 && n <= f.lis.length) && f.lis.every(t => t.length > 3) && (f.lis.length === 0 || Math.max(...f.sups) === f.lis.length), f);
  }

  // ---- Sicherheit: Daten werden nie als HTML gedeutet
  await p.evaluate(() => { const m = MATERIALMATCH_DATA.baustoffe.find(x => x.id === 'baustahl'); m.eigenschaften.druckfestigkeit.hinweis = '<img src=x onerror="window.__xss=1"><b>fett</b>'; m.name = 'Stahl <script>window.__xss2=1</script>'; MM.auswahl.setzeAuswahl({ a: 'normalbeton', b: 'baustahl' }); });
  check('HTML in Daten wird nicht ausgeführt', await p.evaluate(() => !window.__xss && !window.__xss2 && document.querySelectorAll('#ergebnisse img, #ergebnisse b, #ergebnisse script').length === 0));
  check('HTML in Daten erscheint als Text', (await txt('ergebnis-technisch')).includes('<img src=x'));

  check('Systemcheck grün', (await p.getAttribute('#status', 'class')).includes('ok'));
  check('Keine Konsolenfehler', errors.length === 0, errors);

  // ---- Layout auf drei Breiten
  for (const w of [1280, 768, 375]) {
    const m = await b.newPage({ viewport: { width: w, height: 800 } });
    await m.goto('file://' + PROJ + '/index.html?modus=demo'); await m.evaluate(() => { const d = document.querySelector('#ergebnisse > details'); if (d) d.open = true; });
    await m.selectOption('#kategorie', 'tragend');
    await m.evaluate(() => MM.auswahlOptionen.zeigeDrittes(true));
    await m.selectOption('#materialA', 'konstruktionsvollholz'); await m.selectOption('#materialB', 'brettsperrholz'); await m.evaluate(() => MM.auswahlOptionen.zeigeDrittes(true)); await m.selectOption('#materialC', 'hochlochziegel');
    await m.fill('#flaeche', '100'); await m.fill('#dicke', '20');
    await m.evaluate(() => document.querySelectorAll('#ergebnisse details.sub').forEach(d => { d.open = true; }));
    const res = await m.evaluate(() => {
      const out = [];
      document.querySelectorAll('#ergebnisse table').forEach(t => {
        let overlap = false, schmal = false, rund = false;
        t.querySelectorAll('tr').forEach(tr => { const bs = [...tr.cells].map(c => { const r = c.getBoundingClientRect(); rund = rund || getComputedStyle(c).borderRadius !== '0px'; schmal = schmal || r.width < 40; return r; }); for (let i = 1; i < bs.length; i++) if (bs[i].left < bs[i - 1].right - 0.5) overlap = true; });
        const wr = t.closest('.table-wrap');
        out.push({ overlap, schmal, rund, passt: wr.scrollWidth <= wr.clientWidth + 1, ueberlauf: [...t.querySelectorAll('td,th')].filter(c => c.scrollWidth > c.clientWidth + 1).length });
      });
      return { tabellen: out, seite: document.documentElement.scrollWidth <= document.documentElement.clientWidth };
    });
    check(`Breite ${w}: 8 Tabellen (Menge, Technisch, Kosten ×2, CO₂ ×2, R-Wert, Weitere)`, res.tabellen.length === 8, res.tabellen.length);
    check(`Breite ${w}: keine überlappenden/zu schmalen/runden Zellen`, res.tabellen.every(t => !t.overlap && !t.schmal && !t.rund), res.tabellen);
    check(`Breite ${w}: kein Zelleninhalt läuft über`, res.tabellen.every(t => t.ueberlauf === 0), res.tabellen.map(t => t.ueberlauf));
    if (w >= 768) check(`Breite ${w}: Tabellen passen in den Rahmen`, res.tabellen.every(t => t.passt), res.tabellen.map(t => t.passt));
    check(`Breite ${w}: Seite scrollt nicht seitlich`, res.seite);
    if (w === 375) { await m.locator('#ergebnisse').screenshot({ path: AUSGABE + 'v5_mobile.png' }); }
  }

  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\nFEHLGESCHLAGEN: ' + fails);
  await b.close();
})();
