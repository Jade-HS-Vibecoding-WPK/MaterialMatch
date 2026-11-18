/* MaterialMatch 2.0, Schritt 9: Reiter „Quellen & Details“
   Aufruf:  node tests/test36.js */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 600))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html?modus=demo';

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async (breite = 1280, url = URL) => { const p = await b.newPage({ viewport: { width: breite, height: 900 } }); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); await p.goto(url); await p.waitForTimeout(250); return p; };
  const setze = (p, o) => p.evaluate(o => MM.auswahl.setzeAuswahl(o), o);

  // Unabhängige Erwartung aus den Rohdaten: je Material die Quellen-IDs mit den zugehörigen Kennwerten (wie die App die Werte sieht)
  const erwartung = p => p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.map(pl => {
    const ei = pl.material.eigenschaften, namen = { rohdichte: 'Rohdichte', waermeleitfaehigkeit: 'λD', waermeleitfaehigkeit_bemessung: 'λB', druckfestigkeit: 'Druckfestigkeit', preis: 'Preis', gwp: 'CO₂ (GWP)', brandverhalten: 'Brandverhalten', wasserdampf_mu: 'μ', waermekapazitaet: 'Wärmekapazität', recycling: 'Recycling' };
    const q = {}, ohne = [], fehlt = [];
    Object.keys(namen).forEach(k => { const e = ei[k]; if (!e || e.nicht_anwendbar === true) { if (!e) fehlt.push(namen[k]); return; } const hat = e.werte !== undefined ? e.werte !== null : (e.wert !== null && e.wert !== undefined); if (!hat) { fehlt.push(namen[k]); return; } if (e.quelle) (q[e.quelle] = q[e.quelle] || []).push(namen[k]); else ohne.push(namen[k]); });
    (pl.produkt.herstellerangaben || []).forEach(h => { (q[h.quelle] = q[h.quelle] || []).push('Herstellerangabe: ' + h.bezeichnung + ' (nicht bestätigt, nicht berechnet)'); });
    return { b: pl.buchstabe, q, ohne: ohne.length, fehlt: fehlt.length };
  }));
  const anzeige = p => p.$$eval('#quellen-auswahl .quelle-material', gs => gs.map(g => ({ b: g.dataset.material, kopf: g.querySelector('h3').textContent.trim(), zeilen: [...g.querySelectorAll('tbody tr')].map(r => ({ titel: r.cells[0].textContent.trim(), href: (r.cells[0].querySelector('a') || {}).href || null, target: (r.cells[0].querySelector('a') || {}).target || null, eigner: r.cells[1].textContent.trim(), stand: r.cells[2].textContent.trim(), kennwerte: r.cells[3].textContent.trim() })), notizen: [...g.querySelectorAll(':scope > p.note')].map(n => n.textContent) })));

  let p = await neu();
  await p.click('#reiter-quellen');
  const kopf = await p.evaluate(() => ({ h2: document.querySelector('#quellen > h2').textContent, kinder: [...document.querySelectorAll('#quellen > *')].map(e => e.tagName + (e.id ? '#' + e.id : '')), panel: !!document.querySelector('#quellen > details:not(.sub)') }));
  check('Der Reiter beginnt mit „Quellen der ausgewählten Materialien“ (h2), danach vier einklappbare Bereiche; kein aufklappbarer Hauptbereich mehr', kopf.h2 === 'Quellen der ausgewählten Materialien' && kopf.kinder.join() === 'H2#quellen-titel,DIV#quellen-auswahl,DETAILS#quellen-qualitaet,DETAILS#quellen-methode,DETAILS#quellen-datenbank,DETAILS#quellen-hinweise' && !kopf.panel, kopf);
  check('Die vier Bereiche heißen: Datenqualität und Kennzeichnungen; Wie berechnet MaterialMatch die Ergebnisse?; Erweiterte Datenbankinformationen; Rechtliche und fachliche Hinweise – und sind standardmäßig zugeklappt', JSON.stringify(await p.$$eval('#quellen > details > summary', s => s.map(x => x.textContent.trim()))) === JSON.stringify(['Datenqualität und Kennzeichnungen', 'Wie berechnet MaterialMatch die Ergebnisse?', 'Erweiterte Datenbankinformationen', 'Rechtliche und fachliche Hinweise']) && await p.$$eval('#quellen > details', d => d.every(x => !x.open)));
  check('Ohne Auswahl: kurzer Hinweis statt Quellenliste', /Wählen Sie Materialien im Reiter „Vergleich“/.test(await p.$eval('#quellen-auswahl', e => e.textContent)));
  check('Das lange Material (Katalog der 50 Baustoffe, Kennwertmatrix, Quellenübersicht, Datenprüfung) steckt unter „Erweiterte Datenbankinformationen“, nicht in der Hauptansicht', await p.evaluate(() => { const d = document.getElementById('quellen-datenbank'); return ['quellen-inhalt', 'katalog', 'datenuebersicht'].every(i => d.contains(document.getElementById(i))) && !!d.querySelector('.matrix-table') && !!d.querySelector('.check-list'); }));

  // ---- Quellen der ausgewählten Materialien
  await setze(p, { a: 'mineralwolle', b: 'zellulose', c: '' });
  let ist = await anzeige(p), soll = await erwartung(p);
  check('Eine Gruppe je gewähltem Material (A Mineralwolle · Produkt, B Zellulosedämmung · Produkt)', ist.length === 2 && ist[0].b === 'A' && /Mineralwolle/.test(ist[0].kopf) && /ROCKWOOL Fixrock 035/.test(ist[0].kopf) && ist[1].b === 'B' && /Zellulose/.test(ist[1].kopf) && /ISOCELL/.test(ist[1].kopf), ist.map(x => x.kopf));
  const abw = [];
  ist.forEach((g, i) => { const s = soll[i]; const ids = Object.keys(s.q); if (g.zeilen.length !== ids.length) abw.push([g.b, 'Zeilenzahl', g.zeilen.length, ids.length]); });
  check('Je Material genau so viele Quellenzeilen wie unterschiedliche Quellen in den Daten des Materials (inkl. Herstellerangabe), keine fehlt, keine ist erfunden', abw.length === 0, abw);
  const katalog = await p.evaluate(() => Object.fromEntries(MATERIALMATCH_DATA.quellen.map(q => [q.id, { titel: q.titel, url: q.url, herausgeber: q.herausgeber, datensatz_eigner: q.datensatz_eigner || null, abgerufen: q.abgerufen }])));
  const pruef = []; ist.forEach((g, i) => { Object.entries(soll[i].q).forEach(([id, kw]) => { const z = g.zeilen.find(x => x.titel === katalog[id].titel); if (!z) { pruef.push([g.b, id, 'Titel nicht gefunden']); return; } if (z.href !== katalog[id].url) pruef.push([g.b, id, 'Link', z.href]); if (z.target !== '_blank') pruef.push([g.b, id, 'Ziel']); if (kw.join(', ') !== z.kennwerte) pruef.push([g.b, id, 'Kennwerte', z.kennwerte, kw.join(', ')]); if (!z.stand.includes(katalog[id].abgerufen)) pruef.push([g.b, id, 'abgerufen']); if (!z.eigner || z.eigner === '–') pruef.push([g.b, id, 'Herausgeber']); }); });
  check('Jede Zeile stimmt mit dem Quellenkatalog überein: Titel, Link (https, neuer Tab), Herausgeber, Abrufdatum im Datenstand und genau die Kennwerte, die die Daten dieser Quelle zuordnen', pruef.length === 0 && ist.every(g => g.zeilen.every(z => /^https:\/\//.test(z.href))), pruef);
  check('Die ISOCELL-Herstellerangabe (0,039) erscheint als eigene Zeile mit „(nicht bestätigt, nicht berechnet)“; ein Bemessungswert λB wird nicht als belegt ausgegeben (steht unter „Nicht verfügbar“)', ist[1].zeilen.some(z => /Herstellerangabe: .*nicht bestätigt, nicht berechnet/.test(z.kennwerte)) && ist[1].notizen.some(n => /Nicht verfügbar:.*λB/.test(n)) && !ist[1].zeilen.some(z => /(^|, )λB(,|$)/.test(z.kennwerte)), ist[1]);
  check('Werte ohne Quelle werden ausdrücklich genannt („Ohne Quelle: Preis (Beispieldaten) …“), nichts wird als belegt dargestellt', ist[0].notizen.some(n => /^Ohne Quelle: .*Preis \(Beispieldaten\)/.test(n)), ist[0].notizen);
  check('Datenstand je Quelle: „Stand …“, „Bezugsjahr …“ oder der Hinweis „kein Ausgabedatum“, immer mit Abrufdatum', ist.every(g => g.zeilen.every(z => /abgerufen \d{4}-\d{2}-\d{2}/.test(z.stand) && /(Stand |Bezugsjahr |kein Ausgabedatum|Online-Preis)/.test(z.stand))), ist.map(g => g.zeilen.map(z => z.stand)));

  // ---- Aktualisierung
  await setze(p, { a: 'mineralwolle', b: 'zellulose', c: 'eps' });
  check('Drittes Material: eine dritte Gruppe erscheint', (await anzeige(p)).length === 3);
  await setze(p, { a: 'mineralwolle', b: 'mineralwolle', c: '', pa: 'rockwool-fixrock-035', pb: 'rockwool-klemmrock-035' });
  ist = await anzeige(p);
  check('Herstellerprodukt gewechselt (Fixrock 035 gegen Klemmrock 035): die Gruppen nennen das jeweilige Produkt und seine Datenblätter; Klemmrock zeigt zusätzlich die Preisquelle (OBI)', /Klemmrock/.test(ist[1].kopf) && ist[1].zeilen.some(z => /Klemmrock 035/.test(z.titel) && /λD/.test(z.kennwerte)) && ist[1].zeilen.some(z => /OBI/.test(z.titel) && /Preis/.test(z.kennwerte)) && !ist[0].zeilen.some(z => /OBI/.test(z.titel)), ist.map(g => g.zeilen.map(z => z.titel)));
  await setze(p, { a: 'zellulose', b: 'flachsdaemmung', c: '' });   // beide ohne belegten Preis (Mineralwolle/EPS haben seit 3.3 eine belegte Preisspanne)
  await p.evaluate(() => MM.datenmodus.setze(false));
  ist = await anzeige(p); soll = await erwartung(p);
  check('Echtdaten-Modus: Beispielwerte zählen als „nicht verfügbar“; die Listen folgen den Daten des Modus (keine „Ohne Quelle (Beispieldaten)“-Zeile mehr)', ist.every(g => !g.notizen.some(n => /Beispieldaten/.test(n))) && ist.every((g, i) => g.zeilen.length === Object.keys(soll[i].q).length) && ist.some(g => g.notizen.some(n => /Nicht verfügbar:.*Preis/.test(n))), ist.map(g => g.notizen));
  await p.evaluate(() => MM.datenmodus.setze(true));
  await setze(p, { a: '', b: '', c: '' });
  check('Wird die Auswahl geleert, erscheint wieder der Hinweis', /Wählen Sie Materialien/.test(await p.$eval('#quellen-auswahl', e => e.textContent)));

  // ---- Inhalte der einklappbaren Bereiche
  await setze(p, { a: 'mineralwolle', b: 'eps', c: '' });
  await p.evaluate(() => document.querySelectorAll('#quellen > details.sub').forEach(d => { d.open = true; }));
  const t = id => p.$eval('#' + id, e => e.innerText.replace(/\s+/g, ' '));
  const qd = await t('qd-inhalt');
  check('Datenqualität und Kennzeichnungen erklärt: verifizierte Daten, Richtwerte, Beispieldaten, eigene Angaben, fehlende und nicht vergleichbare Daten (mit den Kürzeln V, R, B, E)', ['verifiziert', 'Richtwert', 'Beispieldaten', 'Eigene Angabe', 'Fehlende Daten', 'Nicht vergleichbare Daten'].every(x => qd.includes(x)) && await p.$$eval('#qd-inhalt .art', a => a.map(x => x.textContent).join()) === 'V,R,B,E', qd.slice(0, 200));
  const qm = await t('qm-inhalt');
  check('„Wie berechnet MaterialMatch die Ergebnisse?“ erklärt Mengenberechnung, Gewichtsberechnung, Kostenberechnung, CO₂-Berechnung, R-Wert-Berechnung, Bewertungsfarbskala und Alternative Baustoffe', ['Mengenberechnung', 'Gewichtsberechnung', 'Kostenberechnung', 'CO₂-Berechnung', 'R-Wert-Berechnung', 'Bewertungsfarbskala', 'Alternative Baustoffe'].every(x => qm.includes(x)), qm.slice(0, 120));
  check('Die Berechnungserklärung nennt die Formeln und Regeln der App (Volumen = Fläche × Dicke; Gewicht = Volumen × Rohdichte; Menge × Einheitspreis; Menge × Kennwert; R = d / λ mit λB vor λD; Farbskala dunkelgrün bis dunkelrot, Grau; Schwelle 2 %; Faktor dreifach) und stimmt mit den Einstellungen überein', ['Volumen = Fläche × Dicke', 'Gewicht = Volumen × Rohdichte', 'Menge × Einheitspreis', 'Menge × Kennwert', 'R = d / λ', 'Bemessungswert λB', 'dunkelgrün', 'dunkelrot', 'Grau', 'Unterschiede unter 2 %', 'dreifach (Faktor 3)', 'höchstens 3 Alternativen'].every(x => qm.includes(x)), ['Volumen = Fläche × Dicke', 'Gewicht = Volumen × Rohdichte', 'Menge × Einheitspreis', 'Menge × Kennwert', 'R = d / λ', 'Bemessungswert λB', 'dunkelgrün', 'dunkelrot', 'Grau', 'Unterschiede unter 2 %', 'dreifach (Faktor 3)', 'höchstens 3 Alternativen'].filter(x => !qm.includes(x)));
  const qh = await t('quellen-hinweise');
  check('Rechtliche und fachliche Hinweise: Zweck (ersetzt keine Nachweise), Brandverhalten ≠ Feuerwiderstand, keine Aussage zu Zulassungen/Gleichwertigkeit/Normkonformität, Aktualität; dazu die Einleitung und die Kurzanleitung', ['ersetzt keine bauphysikalischen Nachweise', 'nicht den Feuerwiderstand', 'keine Aussage zu bauaufsichtlichen Zulassungen, technischer Gleichwertigkeit oder Normkonformität', 'Aktualität', 'Material wählen'].every(x => qh.includes(x)) && await p.$$eval('#ueber .quickstart li', l => l.length) === 3);
  const db = await t('quellen-datenbank');
  check('Erweiterte Datenbankinformationen: Datenstand, Datenqualität auf einen Blick (Kennwertmatrix), Produkte, Quellen, Nachvollziehbarkeits-Check und der Katalog „Alle Baustoffe in der Datenbank (50)“', ['Datenstand', 'Datenqualität auf einen Blick', 'Produkte', 'Quellen der Kennwerte', 'Nachvollziehbarkeits-Check', 'Alle Baustoffe in der Datenbank (50)'].every(x => db.includes(x)) && await p.$$eval('#datenuebersicht tbody tr', r => r.length) === 50);
  check('Keine Informationen gingen verloren: alle 13 früheren Erläuterungsthemen sind in den Bereichen wiederzufinden (Zweck, Formeln, Herkunft, Generische Datensätze, CO₂, Datenmodus, Regeln der Empfehlung, Preise, Vergleichbarkeit, Brandverhalten und Schall, R-Wert, Empfehlungen, Aktualität)', ['ersetzt keine bauphysikalischen Nachweise', 'Gewicht = Volumen × Rohdichte', 'stammen, soweit ein passender Datensatz existiert, aus der ÖKOBAUDAT', 'Sicherheitszuschläge von 10 bis 30 %', 'Pauschale Aussagen wie „Holz ist immer klimafreundlicher“ sind nicht zulässig', 'Im Echtdaten-Modus gelten sie als „nicht verfügbar“', 'Diese Werte stehen in der Datei data/einstellungen.js', 'keine Marktpreise', 'Kosten und CO₂ werden je Menge Material verglichen', 'nicht den Feuerwiderstand eines Bauteils', 'nicht der U-Wert eines Bauteils', 'Beruhen sie auf Beispieldaten, sind sie als „nicht belastbar“ gekennzeichnet', 'sollten regelmäßig aktualisiert werden'].every(x => (qd + ' ' + qm + ' ' + qh).includes(x)), ['ersetzt keine bauphysikalischen Nachweise', 'Gewicht = Volumen × Rohdichte', 'stammen, soweit ein passender Datensatz existiert, aus der ÖKOBAUDAT', 'Sicherheitszuschläge von 10 bis 30 %', 'Pauschale Aussagen wie „Holz ist immer klimafreundlicher“ sind nicht zulässig', 'Im Echtdaten-Modus gelten sie als „nicht verfügbar“', 'Diese Werte stehen in der Datei data/einstellungen.js', 'keine Marktpreise', 'Kosten und CO₂ werden je Menge Material verglichen', 'nicht den Feuerwiderstand eines Bauteils', 'nicht der U-Wert eines Bauteils', 'Beruhen sie auf Beispieldaten, sind sie als „nicht belastbar“ gekennzeichnet', 'sollten regelmäßig aktualisiert werden'].filter(x => !(qd + ' ' + qm + ' ' + qh).includes(x)));
  check('Der Pflichtsatz zur relativen Bewertung der Farben bleibt in Dashboard und Diagrammen erhalten (Erklärung der Farbskala zusätzlich hier)', /Die Farben zeigen eine relative Bewertung/.test(await p.$eval('#dashboard', e => e.textContent)) && /relative Bewertung/.test(qm));

  // ---- Zustand bleibt beim Neuzeichnen erhalten
  await p.evaluate(() => MM.datenmodus.setze(false));
  check('Beim Moduswechsel bleiben die geöffneten Bereiche offen', await p.$$eval('#quellen > details.sub', d => d.every(x => x.open)));
  await p.evaluate(() => MM.datenmodus.setze(true));

  // ---- Tastatur
  const k = await neu();
  await k.click('#reiter-quellen');
  await k.focus('#quellen-qualitaet > summary'); await k.keyboard.press('Enter');
  check('Die einklappbaren Bereiche sind per Tastatur bedienbar (Enter öffnet, Leertaste schließt)', await k.$eval('#quellen-qualitaet', d => d.open) && (await k.keyboard.press('Space'), await k.$eval('#quellen-qualitaet', d => !d.open)));

  // ---- Layout
  const lay = async breite => { const m = await neu(breite); await setze(m, { a: 'mineralwolle', b: 'zellulose', c: '' }); await m.click('#reiter-quellen'); await m.evaluate(() => document.querySelectorAll('#quellen > details.sub').forEach(d => { d.open = true; })); await m.waitForTimeout(150); return m.evaluate(() => { const cw = document.documentElement.clientWidth; const ws = [...document.querySelectorAll('#quellen .table-wrap')].filter(w => w.getBoundingClientRect().width > 0); return { seite: document.documentElement.scrollWidth <= cw, aussen: ws.filter(w => w.getBoundingClientRect().right > cw + 1).length, scrollbarMitFokus: ws.filter(w => w.scrollWidth > w.clientWidth + 1).every(w => w.getAttribute('tabindex') === '0'), tabellen: ws.length }; }); };
  const d = await lay(1280), h = await lay(375);
  check('Desktop: Tabellen innerhalb der Seite', d.seite && d.aussen === 0 && d.tabellen >= 4, d);
  check('Handy 375 px: Seite scrollt nicht seitlich; breite Tabellen scrollen in ihrem Rahmen und sind per Tastatur erreichbar', h.seite && h.aussen === 0 && h.scrollbarMitFokus, h);

  // ---- Druck
  const pd = await neu();
  await setze(pd, { a: 'mineralwolle', b: 'eps', c: '' });
  await pd.emulateMedia({ media: 'print' });
  const druck = await pd.evaluate(() => ({ bereich: getComputedStyle(document.getElementById('quellen')).display, auswahl: getComputedStyle(document.getElementById('quellen-auswahl')).display, katalog: getComputedStyle(document.getElementById('katalog')).display }));
  await pd.emulateMedia({ media: 'screen' });
  check('Druck: „Quellen & Details“ wird mitgedruckt (auch aus dem verborgenen Reiter), der lange Katalog nicht', druck.bereich !== 'none' && druck.auswahl !== 'none' && druck.katalog === 'none', druck);

  check('Keine Konsolenfehler oder -warnungen', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
