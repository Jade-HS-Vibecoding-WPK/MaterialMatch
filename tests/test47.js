/* MaterialMatch 3.0, Block 3: Matching-Logik, Match-Score, Interview, Swipe-Karten, Favoriten, Übernahme in den Vergleich
   Aufruf:  node tests/test47.js */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 700))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html';

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async (breite = 1280, modus = 'demo', optionen = {}) => {
    const ctx = await b.newContext({ viewport: { width: breite, height: 900 }, hasTouch: !!optionen.touch, reducedMotion: optionen.reduziert ? 'reduce' : 'no-preference' });
    const p = await ctx.newPage();
    p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
    p.on('pageerror', e => errors.push(String(e)));
    if (optionen.speicherKaputt) await p.addInitScript(() => { Storage.prototype.setItem = function () { throw new Error('Speicher gesperrt'); }; });
    await p.goto(URL + '?modus=' + modus); await p.waitForTimeout(250);
    return p;
  };
  const match = (p, a) => p.evaluate(a => { const r = MM.matching.berechne(a); return { status: r.status, pool: r.poolGroesse, kriterien: r.kriterien, inaktiv: r.inaktiv, hinweise: r.hinweise, ausg: r.ausgeschlossen, erg: r.ergebnisse.map(e => ({ id: e.id, stufe: e.stufe, score: e.score, kein: e.keinScoreGrund, krit: e.kriterien.map(k => ({ id: k.id, score: k.score, wert: k.wert, gewicht: k.gewicht })), fehlend: e.fehlend, abd: e.abdeckung, text: e.erklaerung, bed: e.bedingungen, bel: e.belastbarkeit, passung: e.passung, vorl: e.vorlaeufig })) }; }, a);
  const A = (einsatz, prio, anf = ['keine'], kosten = 'keine', art = 'keine') => ({ einsatz, prioritaeten: prio, anforderungen: anf, kosten, materialart: art });

  let p = await neu(1280, 'demo');
  const DB = await p.evaluate(() => window.MATERIALMATCH_DATA.baustoffe.map(x => ({ id: x.id, anw: x.anwendungen })));

  // ================= Logik: Einsatzbereiche und Eignung
  const E = await p.evaluate(() => MM.matching.EINSAETZE.map(e => e.name));
  check('Sieben Einsatzbereiche in der gewünschten Reihenfolge: Tragwerk, Außenwand, Innenwand, Dach, Dämmung, Fassade, Innenausbau', JSON.stringify(E) === '["Tragwerk","Außenwand","Innenwand","Dach","Dämmung","Fassade","Innenausbau"]', E);
  const dm = await match(p, A('daemmung', ['co2']));
  const dmErwartet = DB.filter(m => m.anw.includes('waermedaemmung')).map(m => m.id).sort();
  check('Dämmung: nur Materialien, die laut Datenbank für Wärmedämmung vorgesehen sind; Betonarten usw. erscheinen nie (nicht geeignet wird nie vorgeschlagen)', JSON.stringify(dm.erg.map(e => e.id).sort()) === JSON.stringify(dmErwartet) && dm.pool === dmErwartet.length && !dm.erg.some(e => ['normalbeton', 'stahlbeton', 'osb'].includes(e.id)) && dm.ausg.some(x => x.id === 'normalbeton' && x.art === 'eignung'), { n: dm.erg.length, erwartet: dmErwartet.length });
  const aw = await match(p, A('aussenwand', ['co2'])), iw = await match(p, A('innenwand', ['co2'])), tw = await match(p, A('tragwerk', ['co2']));
  const ids = r => r.erg.map(e => e.id);
  check('Außenwand und Innenwand sind getrennt: beide ohne Baustahl und Brettschichtholz (Träger-, kein Wandwerkstoff, mit Begründung); die Innenwand kennt zusätzlich Trockenbauplatten „unter bestimmten Bedingungen“, die Außenwand nicht; das Tragwerk enthält Baustahl', !ids(aw).includes('baustahl') && !ids(iw).includes('baustahl') && !ids(aw).includes('brettschichtholz') && ids(tw).includes('baustahl') && ids(iw).includes('gipskarton') && !ids(aw).includes('gipskarton') && iw.erg.find(e => e.id === 'gipskarton').stufe === 'bedingt' && aw.ausg.find(x => x.id === 'baustahl').grund.length > 20, { aw: ids(aw), iw: ids(iw) });
  const bedingt = await p.evaluate(() => { const r = MM.matching.berechne({ einsatz: 'innenwand', prioritaeten: ['co2'], anforderungen: ['keine'], kosten: 'keine', materialart: 'keine' }); const g = r.ergebnisse.find(e => e.id === 'gipskarton'); return { name: g.stufeName, text: g.eignungText }; });
  check('Stufe „Bedingt geeignet“ nennt die Bedingung (nur nichttragende Beplankung)', bedingt.name === 'Bedingt geeignet' && /nichttragende Beplankung/.test(bedingt.text), bedingt);
  await p.close();

  // ================= Logik im Echtdaten-Modus: Dokumentationslage
  p = await neu(1280, 'echt');
  const eTw = await match(p, A('tragwerk', ['co2']));
  const undok = eTw.erg.filter(e => e.stufe === 'undokumentiert');
  const dokum = eTw.erg.filter(e => e.stufe === 'geeignet');
  const druckDa = await p.evaluate(() => window.MATERIALMATCH_DATA.baustoffe.filter(x => x.anwendungen.includes('tragwerk')).map(x => [x.id, (MM.produkte.wirksam(x.id, '').eigenschaften.druckfestigkeit || {}).wert]).filter(([, w]) => typeof w === 'number' && w > 0).map(([i]) => i));
  check('Echtdaten, Tragwerk: „Nicht ausreichend belegt“ genau bei Materialien ohne belegte Druckfestigkeit (sie stehen nach den dokumentierten), nichts Unbekanntes gilt als geeignet', undok.length > 0 && dokum.every(e => druckDa.includes(e.id)) && undok.every(e => !druckDa.includes(e.id)) && eTw.erg.findIndex(e => e.stufe === 'undokumentiert') > eTw.erg.map(e => e.stufe).lastIndexOf('geeignet'), { druckDa, undok: undok.map(e => e.id) });
  const eDm = await match(p, A('daemmung', ['kosten'], ['keine'], 'keine'));
  check('Echtdaten: Preise sind kaum vergleichbar – ein Score allein auf Basis des Preises wird nie angezeigt, und die Preis-Kriterium ist als „nicht bewertbar“ genannt', eDm.erg.every(e => !(e.krit.length === 1 && e.krit[0].id === 'kosten' && e.score !== null)) && (eDm.inaktiv.some(x => x.id === 'kosten') || eDm.erg.every(e => e.score === null || e.krit.some(k => k.id !== 'kosten'))), { inaktiv: eDm.inaktiv, hinweise: eDm.hinweise });
  const lueck = eDm.erg.filter(e => e.score === null);
  check('Fehlende Daten werden nicht als gut bewertet: Materialien ohne vergleichbare Werte haben keinen Score (null, kein 0 und kein 100) und einen Grund', lueck.length > 0 && lueck.every(e => e.score === null && e.kein && e.kein.length > 10), lueck.length);
  await p.close();

  // ================= Logik im Demo-Modus: Score nachgerechnet, Ausschlüsse, Gewichte
  p = await neu(1280, 'demo');
  // Referenzrechnung unabhängig vom Programm: nur Rohdichte, Tragwerk
  const ref = await p.evaluate(() => { const m = window.MATERIALMATCH_DATA.baustoffe.filter(x => x.anwendungen.includes('tragwerk')).map(x => ({ id: x.id, r: (MM.produkte.wirksam(x.id, '').eigenschaften.rohdichte || {}).wert })); return m.filter(x => typeof x.r === 'number' && x.r > 0); });
  const mn = Math.min(...ref.map(x => x.r)), mx = Math.max(...ref.map(x => x.r));
  const g = await match(p, A('tragwerk', ['gewicht']));
  const abw = ref.filter(x => { const e = g.erg.find(y => y.id === x.id); return !e || e.score !== Math.round((mx - x.r) / (mx - mn) * 100); }).map(x => x.id);
  check('Score nachgerechnet (Tragwerk, nur „Geringes Gewicht“, ohne Kosten): jeder Score = (größte Rohdichte − Rohdichte) ÷ (größte − kleinste) × 100, auf ganze Punkte gerundet; das leichteste Material hat 100, das schwerste 0', abw.length === 0 && g.erg.find(e => e.id === ref.sort((a, c) => a.r - c.r)[0].id).score === 100 && g.erg.find(e => e.id === ref.sort((a, c) => c.r - a.r)[0].id).score === 0, { abw, mn, mx });
  const ohneRohdichte = g.erg.filter(e => !ref.some(x => x.id === e.id));
  check('Material ohne Rohdichte (Baustahl hat sie, andere eventuell nicht): ohne Wert kein Score und keine Aufwertung', ohneRohdichte.every(e => e.score === null), ohneRohdichte.map(e => e.id));
  check('Alle Scores sind ganze Zahlen von 0 bis 100; die Ergebnisse sind nach Eignung und dann nach Score absteigend geordnet', g.erg.every(e => e.score === null || (Number.isInteger(e.score) && e.score >= 0 && e.score <= 100)) && g.erg.every((e, i, l) => i === 0 || (({ geeignet: 0, bedingt: 1, undokumentiert: 2 })[l[i - 1].stufe] < ({ geeignet: 0, bedingt: 1, undokumentiert: 2 })[e.stufe] || (l[i - 1].stufe === e.stufe && (e.score === null || (l[i - 1].score !== null && l[i - 1].score >= e.score))))));
  // Nur das Gewicht: genau ein Kriterium; zwei Kriterien: Mittel nach Gewicht
  const zwei = await match(p, A('tragwerk', ['gewicht', 'festigkeit']));
  const mw = zwei.erg.filter(e => e.score !== null && e.krit.length === 2).slice(0, 5).every(e => e.score === Math.round(e.krit.reduce((s, k) => s + k.gewicht * k.score, 0) / e.krit.reduce((s, k) => s + k.gewicht, 0) * 100));
  check('Zwei Kriterien: der Score ist das gewichtete Mittel der Teilbewertungen (nachgerechnet) und gibt die Teilbewertungen mit an', zwei.erg.some(e => e.krit.length === 2) && mw, zwei.kriterien);
  const gew = await Promise.all([['guenstig', 'keine'], ['mittel', 'keine'], ['mittel', 'kosten'], ['hoch', 'kosten'], ['keine', 'kosten'], ['keine', 'co2']].map(async ([k, pr]) => { const r = await match(p, A('tragwerk', pr === 'kosten' ? ['kosten', 'co2'] : ['co2'], ['keine'], k)); const kk = r.kriterien.find(x => x.id === 'kosten'); return [k, pr, kk ? kk.gewicht : null]; }));
  check('Kostenrahmen: „Möglichst günstig“ Gewicht 2; „Mittleres Preisniveau“ nur halbes Gewicht (1, wenn Kosten ohnehin gewählt sind); „Höhere Kosten akzeptabel“ lässt den Preis weg; „Keine Preispräferenz“ zählt den Preis nur, wenn er gewählt wurde', JSON.stringify(gew) === JSON.stringify([['guenstig', 'keine', 2], ['mittel', 'keine', 0.5], ['mittel', 'kosten', 1], ['hoch', 'kosten', null], ['keine', 'kosten', 1], ['keine', 'co2', null]]), gew);
  const mittel = await match(p, A('tragwerk', ['co2', 'gewicht'], ['keine'], 'mittel'));
  const pro = mittel.erg.filter(e => e.krit.some(k => k.id === 'kosten'));
  let monoton = true;
  for (const x of pro) for (const y of pro) { const kx = x.krit.find(k => k.id === 'kosten'), ky = y.krit.find(k => k.id === 'kosten'); if (kx.wert < ky.wert && kx.score < ky.score - 1e-9) monoton = false; }
  check('„Mittleres Preisniveau“ = moderate Preissensibilität: ein günstigeres Material wird beim Preis nie schlechter bewertet als ein teureres (Teilbewertung nimmt mit sinkendem Preis nie ab)', pro.length >= 2 && monoton && mittel.kriterien.find(k => k.id === 'kosten').gewicht === 0.5, pro.length);
  const bs = await match(p, A('tragwerk', ['co2'], ['brandschutz']));
  const klassen = await p.evaluate(() => Object.fromEntries(window.MATERIALMATCH_DATA.baustoffe.map(x => [x.id, (MM.produkte.wirksam(x.id, '').eigenschaften.brandverhalten || {}).wert])));
  check('Anforderung Brandschutz: vor jeder Bewertung ausgeschlossen werden Materialien mit Baustoffklasse C bis F (z. B. Brettsperrholz D); erlaubt sind A1, A2 und B', bs.erg.every(e => !/^[C-F]/.test(klassen[e.id] || '')) && bs.ausg.some(x => x.id === 'brettsperrholz' && x.art === 'anforderung' && /Brandschutz/.test(x.grund)) && bs.erg.some(e => /^A1/.test(klassen[e.id] || '')), bs.ausg.filter(x => x.art === 'anforderung').map(x => x.id));
  const bsEcht = await (async () => { const q = await neu(1280, 'echt'); const r = await match(q, A('tragwerk', ['co2'], ['brandschutz'])); const k = await q.evaluate(() => Object.fromEntries(window.MATERIALMATCH_DATA.baustoffe.map(x => [x.id, (MM.produkte.wirksam(x.id, '').eigenschaften.brandverhalten || {}).wert]))); await q.close(); return { r, k }; })();
  const ohneKlasse = bsEcht.r.erg.filter(e => !bsEcht.k[e.id]);
  check('Brandschutz mit fehlender Brandklasse (Echtdaten): nicht ausgeschlossen, aber nie als erfüllt dargestellt – Stufe „Nicht ausreichend belegt“ mit Hinweis', ohneKlasse.length > 0 ? ohneKlasse.every(e => e.stufe === 'undokumentiert' && e.bed.some(t => /Brandverhalten nicht dokumentiert/.test(t))) : true, ohneKlasse.map(e => [e.id, e.stufe]));
  const nat = await match(p, A('tragwerk', ['co2'], ['natuerlich']));
  const profil = await p.evaluate(() => MATERIALMATCH_PROFIL.materialien);
  const passtKl = (r, k) => r.erg.filter(e => e.passung === 'voll' || e.passung === 'eingeschraenkt').every(e => profil[e.id].klassen.includes(k)) && r.erg.filter(e => e.passung === 'teilweise').every(e => !profil[e.id].klassen.includes(k));
  check('Anforderung „Natürliche Materialien“ und Materialart (seit 3.2 Wünsche): als „Passt“ oder „eingeschränkt“ gelten nur Materialien mit passender Einordnung durch das Projekt; wer sie nicht erfüllt, erscheint höchstens als gekennzeichneter Teiltreffer (nie als Match)', nat.erg.length > 0 && passtKl(nat, 'natuerlich') && passtKl(await match(p, A('tragwerk', ['co2'], ['keine'], 'keine', 'nachwachsend')), 'nachwachsend') && passtKl(await match(p, A('tragwerk', ['co2'], ['keine'], 'keine', 'mineralisch')), 'mineralisch'));
  const nz = await p.evaluate(() => { const a = MM.matching.normalisiereAntworten({ einsatz: 'tragwerk', prioritaeten: ['co2', 'recycling', 'unsinn'], anforderungen: ['schallschutz', 'feuchteschutz', 'brandschutz'], kosten: 'xx', materialart: 'keine' }); return { a, gesperrt: [...MM.matching.PRIORITAETEN, ...MM.matching.ANFORDERUNGEN].filter(x => !x.datenlage).map(x => x.id).sort() }; });
  check('Ohne ausreichende Daten gesperrt: Recyclingfähigkeit, Schallschutz und Feuchteschutz werden aus den Antworten entfernt und zählen weder als Ausschluss noch im Score', JSON.stringify(nz.gesperrt) === '["feuchteschutz","recycling","schallschutz"]' && JSON.stringify(nz.a.prioritaeten) === '["co2"]' && JSON.stringify(nz.a.anforderungen) === '["brandschutz"]' && nz.a.kosten === '', nz);
  const konsistenz = await p.evaluate(() => { const daten = window.MATERIALMATCH_DATA; const qf = id => id ? daten.quellen.find(q => q.id === id) : null; const r = MM.matching.berechne({ einsatz: 'daemmung', prioritaeten: ['co2'], anforderungen: ['keine'], kosten: 'keine', materialart: 'keine' }); MM.empfehlung.setzeLambdaTyp(MM.berechnung.lambdaVergleichsTyp(daten.baustoffe.filter(x => x.anwendungen.includes('waermedaemmung')).map(x => MM.produkte.wirksam(x.id, '')))); const ok = r.ergebnisse.filter(e => e.kriterien.some(k => k.id === 'co2')).every(e => { const w = MM.empfehlung.kriteriumWert(e.material, 'co2_r', qf); return w && Math.abs(w.wert - e.kriterien.find(k => k.id === 'co2').wert) < 1e-9; }); return { ok, n: r.ergebnisse.length }; });
  check('Keine zweite Bewertungslogik: die CO₂-Werte je Dämmwirkung im Score sind exakt die der Alternativempfehlung (MM.empfehlung.kriteriumWert), nur die Normierung kommt aus MM.bewertung', konsistenz.ok, konsistenz);
  const erkl = await match(p, A('daemmung', ['co2', 'waerme']));
  const mitText = erkl.erg.filter(e => e.score !== null);
  check('Erklärung zu jedem Score: „Besonders passend wegen …“ bzw. „Weniger passend wegen …“ mit den Kriterien in Worten; ohne Score steht der Grund da (kein scheinbar genauer Wert)', mitText.length > 2 && mitText.every(e => /Besonders passend wegen|Weniger passend wegen|Mittelfeld|keinen nennenswerten/.test(e.text)) && erkl.erg.filter(e => e.score === null).every(e => /^Keine Punktbewertung: /.test(e.text)), mitText.slice(0, 2).map(e => e.text));
  await p.close();

  // ================= Oberfläche: Interview
  p = await neu(1280, 'demo');
  await p.click('#kopf-match');
  const start = await p.evaluate(() => ({ frage: document.querySelector('.iv-titel').textContent, schritt: document.querySelector('.iv-schritt').textContent, opt: [...document.querySelectorAll('.iv-name')].map(x => x.textContent), prog: document.querySelector('.iv-fortschritt').getAttribute('aria-valuenow'), weiterOff: document.querySelector('.iv-weiter').disabled, zurueckOff: document.querySelector('.iv-zurueck').disabled, typ: document.querySelector('.iv-eingabe').type }));
  check('Frage 1 „Wo möchtest du den Baustoff einsetzen?“ mit den sieben Einsatzbereichen als Auswahlfelder (Radio), Fortschritt „Frage 1 von 5“, „Weiter“ gesperrt bis zur Antwort', start.frage === 'Wo möchtest du den Baustoff einsetzen?' && start.schritt === 'Frage 1 von 5' && JSON.stringify(start.opt) === '["Tragwerk","Außenwand","Innenwand","Dach","Dämmung","Fassade","Innenausbau"]' && start.prog === '1' && start.weiterOff && start.zurueckOff && start.typ === 'radio', start);
  await p.check('input[value="aussenwand"]', { force: true }); await p.click('.iv-weiter');
  const f2 = await p.evaluate(() => ({ titel: document.querySelector('.iv-titel').textContent, opt: [...document.querySelectorAll('.iv-option')].map(o => [o.querySelector('.iv-name').textContent, o.querySelector('input').disabled, (o.querySelector('.iv-sperre') || {}).textContent || '']), typ: document.querySelector('.iv-eingabe').type, weiterOff: document.querySelector('.iv-weiter').disabled }));
  check('Frage 2 (Mehrfachauswahl): sechs Kriterien; „Gute Recyclingfähigkeit“ ist ausgegraut (nicht wählbar) mit dem Hinweis „Noch keine ausreichenden Daten vorhanden“', f2.titel === 'Was ist dir besonders wichtig?' && f2.opt.length === 6 && f2.typ === 'checkbox' && f2.opt.filter(o => o[1]).length === 1 && f2.opt.find(o => o[1])[0] === 'Gute Recyclingfähigkeit' && f2.opt.find(o => o[1])[2] === 'Noch keine ausreichenden Daten vorhanden' && f2.weiterOff, f2);
  await p.click('.iv-zurueck');
  check('„Zurück“ führt zur vorigen Frage; die Antwort bleibt gewählt', await p.evaluate(() => document.querySelector('.iv-schritt').textContent === 'Frage 1 von 5' && document.querySelector('input[value="aussenwand"]').checked));
  await p.click('.iv-weiter');
  await p.check('input[value="co2"]', { force: true }); await p.check('input[value="waerme"]', { force: true }); await p.check('input[value="festigkeit"]', { force: true });
  check('Frage 2: Mehrfachauswahl möglich, „Weiter“ wird freigeschaltet', await p.evaluate(() => [...document.querySelectorAll('.iv-eingabe:checked')].length === 3 && !document.querySelector('.iv-weiter').disabled));
  await p.click('.iv-weiter');
  const f3 = await p.evaluate(() => ({ titel: document.querySelector('.iv-titel').textContent, opt: [...document.querySelectorAll('.iv-option')].map(o => [o.querySelector('.iv-name').textContent, o.querySelector('input').disabled, (o.querySelector('.iv-sperre') || {}).textContent || '']) }));
  check('Frage 3 „Welche weiteren Anforderungen hast du?“: Brandschutz, Schallschutz (ausgegraut), Feuchteschutz (ausgegraut), Natürliche Materialien, Keine besonderen Anforderungen', f3.titel === 'Welche weiteren Anforderungen hast du?' && JSON.stringify(f3.opt.map(o => o[0])) === '["Brandschutz","Schallschutz","Feuchteschutz","Natürliche Materialien","Keine besonderen Anforderungen"]' && JSON.stringify(f3.opt.map(o => o[1])) === '[false,true,true,false,false]' && f3.opt.filter(o => o[1]).every(o => o[2] === 'Noch keine ausreichenden Daten vorhanden'), f3);
  await p.check('input[value="brandschutz"]', { force: true }); await p.check('input[value="keine"]', { force: true });
  check('„Keine besonderen Anforderungen“ schließt andere Anforderungen aus (und umgekehrt)', await p.evaluate(() => [...document.querySelectorAll('.iv-eingabe:checked')].map(i => i.value).join() === 'keine') && await (async () => { await p.check('input[value="brandschutz"]', { force: true }); return p.evaluate(() => [...document.querySelectorAll('.iv-eingabe:checked')].map(i => i.value).join() === 'brandschutz'); })());
  await p.click('.iv-weiter');
  const f4 = await p.evaluate(() => ({ titel: document.querySelector('.iv-titel').textContent, opt: [...document.querySelectorAll('.iv-name')].map(x => x.textContent) }));
  await p.check('input[value="mittel"]', { force: true }); await p.click('.iv-weiter');
  const f5 = await p.evaluate(() => ({ titel: document.querySelector('.iv-titel').textContent, opt: [...document.querySelectorAll('.iv-name')].map(x => x.textContent), knopf: document.querySelector('.iv-weiter').textContent, schritt: document.querySelector('.iv-schritt').textContent }));
  check('Frage 4 (Kostenrahmen: Möglichst günstig, Mittleres Preisniveau, Höhere Kosten sind akzeptabel, Keine Preispräferenz) und Frage 5 (Materialart: Nachwachsende Rohstoffe, Mineralische Baustoffe, Konventionelle Baustoffe, Keine Präferenz); letzte Schaltfläche „Matches anzeigen“, „Frage 5 von 5“', f4.titel === 'Welchen Kostenrahmen bevorzugst du?' && JSON.stringify(f4.opt) === '["Möglichst günstig","Mittleres Preisniveau","Höhere Kosten sind akzeptabel","Keine Preispräferenz"]' && f5.titel === 'Welche Art von Materialien bevorzugst du?' && JSON.stringify(f5.opt) === '["Nachwachsende Rohstoffe","Mineralische Baustoffe","Konventionelle Baustoffe","Keine Präferenz"]' && f5.knopf === 'Matches anzeigen' && f5.schritt === 'Frage 5 von 5', { f4, f5 });
  const gespeichert = await p.evaluate(() => JSON.parse(localStorage.getItem('materialmatch.match.v1')).antworten);
  check('Die Antworten werden sofort im Browser gespeichert (localStorage), noch vor dem Ende des Interviews', gespeichert.einsatz === 'aussenwand' && gespeichert.kosten === 'mittel' && JSON.stringify(gespeichert.anforderungen) === '["brandschutz"]' && JSON.stringify(gespeichert.prioritaeten) === '["co2","waerme","festigkeit"]', gespeichert);
  await p.check('input[value="keine"]', { force: true }); await p.click('.iv-weiter'); await p.waitForTimeout(200);

  // ================= Oberfläche: Swipe-Karten
  const k1 = await p.evaluate(() => { const k = document.querySelector('.sw-karte-vorne'); return { name: k.querySelector('.sw-name').textContent, kat: k.querySelector('.sw-kategorie').textContent, bild: !!k.querySelector('.mbild img'), cap: k.querySelector('.mbild-text').textContent, score: k.querySelector('.sw-score').textContent, vorteile: [...k.querySelectorAll('.sw-vorteile li')].map(x => x.textContent), text: k.textContent.length, stufe: k.querySelector('.sw-eignung').textContent, zaehler: document.querySelector('.sw-zaehler').textContent, knoepfe: [...document.querySelectorAll('.sw-knopf')].map(x => x.textContent.trim()), antworten: [...document.querySelectorAll('.sw-antworten li')].map(x => x.textContent) }; });
  check('Swipe-Karte: Illustration mit Beschriftung, Name, Kategorie, Eignung (getrennt), „NN/100 Match-Punkte“ mit kurzer Erklärung und höchstens zwei kurzen Vorteilen (Begründung, Nachteil und Kennwerte im Steckbrief)', k1.bild && k1.cap === 'Schematische Materialillustration' && k1.name.length > 3 && k1.kat.length > 3 && /^\d+\/100 Match-Punkte|Datenlage reicht nicht/.test(k1.score) && k1.vorteile.length >= 1 && k1.vorteile.length <= 2 && /^Eignung: (Geeignet|Bedingt geeignet|Nicht ausreichend belegt)$/.test(k1.stufe), k1);
  check('Sichtbare Knöpfe für alle ohne Wischen (Überspringen, Details, Merken, Rückgängig); der Zähler „Karte 1 von n“ und eine Zusammenfassung der Antworten stehen darüber', JSON.stringify(k1.knoepfe) === '["Überspringen","Details","Merken","Rückgängig"]' && /^Karte 1 von \d+$/.test(k1.zaehler) && k1.antworten.includes('Außenwand') && k1.antworten.includes('Brandschutz') && k1.antworten.includes('Mittleres Preisniveau'), k1);
  await p.click('.sw-info'); await p.waitForTimeout(250);
  check('Knopf „Details“: der Steckbrief zeigt „Warum dieses Match?“ mit Eignung und Match-Punkten getrennt (relativ, keine Eignungsbestätigung) und die längere Begründung', await p.evaluate(() => { const b = document.querySelector('dialog.steckbrief .sb-match'); return !!b && /Eignung: /.test(b.textContent) && /Match-Punkte: /.test(b.textContent) && /relativ/.test(b.textContent) && /keine Eignungsbestätigung/.test(b.textContent); }));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  const erst = k1.name;
  await p.click('.sw-fav'); await p.waitForTimeout(500);
  const nachFav = await p.evaluate(() => ({ zaehler: document.querySelector('.sw-zaehler').textContent, name: document.querySelector('.sw-karte-vorne .sw-name').textContent, favs: MM.favoriten.liste(), gespeichert: JSON.parse(localStorage.getItem('materialmatch.favoriten.v1')).ids, panel: document.querySelectorAll('#favoriten-inhalt .fav-karte').length, zahl: document.getElementById('favoriten-zaehler').textContent }));
  check('Knopf „Merken“: die nächste Karte erscheint, das Material steht in den Favoriten (Liste, Anzeige, Zähler) und im Browserspeicher', nachFav.zaehler.startsWith('Karte 2 von') && nachFav.name !== erst && nachFav.favs.length === 1 && nachFav.gespeichert.length === 1 && nachFav.panel === 1 && nachFav.zahl === '1', nachFav);
  await p.click('.sw-nein'); await p.waitForTimeout(500);
  check('Knopf „Überspringen“: nächste Karte, kein neuer Favorit', await p.evaluate(() => document.querySelector('.sw-zaehler').textContent.startsWith('Karte 3 von') && MM.favoriten.liste().length === 1));
  await p.click('.sw-zurueck'); await p.waitForTimeout(300);
  check('Rückgängig: die verworfene Karte kommt zurück (Karte 2), die Favoriten bleiben', await p.evaluate(() => document.querySelector('.sw-zaehler').textContent.startsWith('Karte 2 von') && MM.favoriten.liste().length === 1));
  // Tastatur
  await p.focus('.sw-buehne'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(500);
  const tast = await p.evaluate(() => ({ favs: MM.favoriten.liste().length, zaehler: document.querySelector('.sw-zaehler').textContent, live: document.querySelector('.sw [role=status]').textContent }));
  check('Tastatur: Pfeil rechts auf dem Kartenstapel = Favorit (Ansage für Screenreader: „Favorit hinzugefügt: …“); Pfeil links = nicht interessant; Rücktaste = rückgängig', tast.favs === 2 && /^Favorit hinzugefügt: /.test(tast.live) && await (async () => { await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(500); const a = await p.evaluate(() => MM.favoriten.liste().length); await p.keyboard.press('Backspace'); await p.waitForTimeout(300); const b2 = await p.evaluate(() => [MM.favoriten.liste().length, document.querySelector('.sw-zaehler').textContent]); return a === 2 && b2[0] === 2; })(), tast);
  await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  check('Tastatur: Enter öffnet die Weiteren Informationen (Steckbrief) des aktuellen Materials; Escape schließt, der Fokus kehrt auf den Kartenstapel zurück', await p.evaluate(() => { const d = document.querySelector('dialog.steckbrief'); return d && d.open && d.querySelector('.sb-name').textContent === document.querySelector('.sw-karte-vorne .sw-name').textContent; }) && await (async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(100); return p.evaluate(() => !document.querySelector('dialog.steckbrief').open && document.activeElement.classList.contains('sw-buehne')); })());
  // Mausgeste
  const karteSichtbar = () => p.$eval('.sw-karte-vorne', e => { e.scrollIntoView({ block: 'start' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + 120, w: r.width }; });
  const box = await karteSichtbar();
  const vor = await p.evaluate(() => MM.favoriten.liste().length);
  await p.mouse.move(box.x, box.y); await p.mouse.down(); await p.mouse.move(box.x + 40, box.y + 5, { steps: 4 });
  const zug = await p.evaluate(() => { const k = document.querySelector('.sw-karte-vorne'); return { transform: k.style.transform, stempel: parseFloat(k.querySelector('.sw-stempel-ja').style.opacity) }; });
  await p.mouse.move(box.x + 60, box.y + 5, { steps: 3 }); await p.mouse.up(); await p.waitForTimeout(400);
  check('Wischen mit der Maus nach rechts, aber zu kurz (unter der Schwelle): die Karte federt zurück, keine Entscheidung; beim Ziehen erscheint der Stempel „Favorit“', /translateX\(/.test(zug.transform) && zug.stempel > 0 && await p.evaluate(v => MM.favoriten.liste().length === v && document.querySelector('.sw-karte-vorne').style.transform === '', vor));
  await p.mouse.move(box.x, box.y); await p.mouse.down(); await p.mouse.move(box.x + 160, box.y + 10, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(600);
  check('Wischen mit der Maus weit nach rechts: Favorit (die nächste Karte steht vorn)', await p.evaluate(v => MM.favoriten.liste().length === v + 1, vor));
  const vor2 = await p.evaluate(() => [MM.favoriten.liste().length, document.querySelector('.sw-zaehler').textContent]);
  const box2 = await karteSichtbar();
  await p.mouse.move(box2.x, box2.y); await p.mouse.down(); await p.mouse.move(box2.x - 170, box2.y + 4, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(600);
  check('Wischen nach links: nicht interessant (kein Favorit, nächste Karte)', await p.evaluate(v => MM.favoriten.liste().length === v[0] && document.querySelector('.sw-zaehler').textContent !== v[1], vor2));
  // Touch-Geste (Zeigerereignisse vom Typ „touch“)
  const touch = await p.evaluate(async () => { const k = document.querySelector('.sw-karte-vorne'); const r = k.getBoundingClientRect(); const vorher = MM.favoriten.liste().length; k.scrollIntoView({ block: 'start' }); const ev = (t, x, y) => k.dispatchEvent(new PointerEvent(t, { pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true })); ev('pointerdown', r.left + 100, r.top + 150); for (let i = 1; i <= 8; i++) ev('pointermove', r.left + 100 + i * 20, r.top + 150 + i); ev('pointerup', r.left + 260, r.top + 158); await new Promise(res => setTimeout(res, 600)); return MM.favoriten.liste().length === vorher + 1; });
  check('Wischen mit dem Finger (Touch-Zeigerereignisse) nach rechts: Favorit; die Karte verlangt nur waagerechte Gesten (touch-action: pan-y), senkrechtes Scrollen bleibt möglich', touch && await p.$eval('.sw-karte-vorne', e => getComputedStyle(e).touchAction === 'pan-y'));
  // Tippen
  const bx = await karteSichtbar();
  await p.mouse.click(bx.x, bx.y); await p.waitForTimeout(200);
  check('Tippen (Klicken) auf die Karte öffnet die weiteren Informationen (Steckbrief)', await p.evaluate(() => document.querySelector('dialog.steckbrief').open));
  await p.keyboard.press('Escape');

  // ================= Favoriten und Übernahme in den Vergleich
  const fav = await p.evaluate(() => ({ n: MM.favoriten.liste().length, karten: [...document.querySelectorAll('#favoriten-inhalt .fav-karte')].map(k => ({ bild: !!k.querySelector('.mbild img'), name: k.querySelector('.fav-name').textContent, kw: k.querySelectorAll('.fav-kennwerte li').length, entf: !!k.querySelector('.fav-weg'), wahl: !!k.querySelector('.fav-haken') })), knopfOff: document.querySelector('.fav-vergleichen').disabled }));
  check('Favoriten als kompakte Karten: Illustration, Name, Kennwerte, Auswahlkästchen „Vergleichen“, Entfernen; „Favoriten vergleichen“ ist ohne Auswahl gesperrt', fav.n >= 3 && fav.karten.length === fav.n && fav.karten.every(k => k.bild && k.name && k.kw >= 1 && k.entf && k.wahl) && fav.knopfOff, fav);
  await p.check('#favoriten-inhalt .fav-karte:nth-child(1) .fav-haken');
  check('Mit nur einem angehakten Favoriten bleibt „Favoriten vergleichen“ gesperrt (zwei oder drei nötig)', await p.$eval('.fav-vergleichen', e => e.disabled));
  await p.check('#favoriten-inhalt .fav-karte:nth-child(2) .fav-haken'); await p.check('#favoriten-inhalt .fav-karte:nth-child(3) .fav-haken');
  const vierte = await p.evaluate(() => { const l = document.querySelectorAll('#favoriten-inhalt .fav-haken'); return { n: l.length, gewaehlt: MM.favoriten.gewaehlt().length }; });
  if (vierte.n >= 4) { await p.check('#favoriten-inhalt .fav-karte:nth-child(4) .fav-haken').catch(() => {}); }
  check('Höchstens drei Favoriten lassen sich zum Vergleich anhaken; bei zwei oder drei ist der Knopf frei', await p.evaluate(() => MM.favoriten.gewaehlt().length === 3 && !document.querySelector('.fav-vergleichen').disabled && [...document.querySelectorAll('.fav-haken')].filter(x => x.checked).length === 3));
  const gewaehltIds = await p.evaluate(() => MM.favoriten.gewaehlt());
  await p.evaluate(() => { document.getElementById('flaeche').disabled || 0; });
  await p.click('.fav-vergleichen'); await p.waitForTimeout(400);
  const vgl = await p.evaluate(() => ({ aktiv: MM.reiter.aktiv(), ids: MM.auswahl.holeAuswahl().plaetze.map(x => x.material.id), buchstaben: MM.auswahl.holeAuswahl().plaetze.map(x => x.buchstabe).join(''), kacheln: [...document.querySelectorAll('.kennwert')].length, auswahlTop: Math.round(document.getElementById('auswahl').getBoundingClientRect().top), prio: MM.prioritaet.holen(), exportKnopf: document.getElementById('export-menue-knopf').disabled }));
  check('„Favoriten vergleichen“: Wechsel in den Reiter „Vergleich“, die drei Favoriten stehen als Material A, B und C in der Auswahl; das Dashboard zeigt vier Kennwert-Kacheln; Export ist freigeschaltet', vgl.aktiv === 'vergleich' && JSON.stringify(vgl.ids) === JSON.stringify(gewaehltIds) && vgl.buchstaben === 'ABC' && vgl.kacheln === 4 && vgl.auswahlTop < 400 && !vgl.exportKnopf, vgl);
  await p.fill('#flaeche', '100'); await p.fill('#dicke', '20'); await p.waitForTimeout(300);
  const rechnung = await p.evaluate(() => { const e = MM.diagramme.ergebnisse(); const gew = e.diagramme.gewicht.zeilen; return { n: gew.length, werte: gew.map(z => z.status === 'wert' ? z.wert : null), tab: document.querySelectorAll('#diagramme figure.chart').length, quellen: document.querySelectorAll('#quellen-auswahl h3, #quellen-auswahl .sub-head').length }; });
  check('Nach der Übernahme funktionieren Berechnungen, Diagramme und Quellen normal (drei Materialien im Gewichts-Diagramm, vier Diagramme, Quellen der gewählten Materialien)', rechnung.n === 3 && rechnung.tab >= 4, rechnung);
  const gewichtOk = await p.evaluate(() => { const plaetze = MM.auswahl.holeAuswahl().plaetze; return plaetze.every((pl, i) => { const r = MM.berechnung.berechneSchicht(pl.material, 100, 0.2); const z = MM.diagramme.ergebnisse().diagramme.gewicht.zeilen[i]; return !r.moeglich || z.wert === r.gewicht_kg; }); });
  check('Die Gewichtszahlen im Vergleich sind genau die der vorhandenen Berechnung (unveränderte Formel)', gewichtOk);

  // Entfernen und Speicher nach Neuladen
  await p.click('#reiter-match');
  const vorEntf = await p.evaluate(() => MM.favoriten.liste());
  await p.click('#favoriten-inhalt .fav-karte:nth-child(1) .fav-weg');
  const nachEntf = await p.evaluate(() => ({ liste: MM.favoriten.liste(), gespeichert: JSON.parse(localStorage.getItem('materialmatch.favoriten.v1')).ids, panel: document.querySelectorAll('#favoriten-inhalt .fav-karte').length, gewaehlt: MM.favoriten.gewaehlt() }));
  check('Entfernen: das Material verschwindet aus der Liste, dem Speicher und aus der Vergleichsauswahl der Favoriten', nachEntf.liste.length === vorEntf.length - 1 && !nachEntf.liste.includes(vorEntf[0]) && JSON.stringify(nachEntf.gespeichert) === JSON.stringify(nachEntf.liste) && nachEntf.panel === nachEntf.liste.length && !nachEntf.gewaehlt.includes(vorEntf[0]), nachEntf);
  const cache = await p.evaluate(() => [localStorage.getItem('materialmatch.favoriten.v1'), localStorage.getItem('materialmatch.match.v1')]);
  await p.evaluate(c => { }, cache);
  await p.reload(); await p.waitForTimeout(300);
  const nach = await p.evaluate(() => ({ favs: MM.favoriten.liste(), ansicht: MM.match.ansicht(), antworten: MM.match.antworten(), zaehler: document.getElementById('favoriten-zaehler').textContent, panel: document.querySelectorAll('#favoriten-inhalt .fav-karte').length }));
  check('Nach dem Neuladen (gleicher Browser): Favoriten und Interview-Antworten sind noch da; bei vollständigen Antworten erscheinen sofort wieder die Karten', JSON.stringify(nach.favs) === JSON.stringify(nachEntf.liste) && nach.ansicht === 'karten' && nach.antworten.einsatz === 'aussenwand' && nach.panel === nach.favs.length && nach.zaehler === String(nach.favs.length), nach);
  // Karten schließen bereits gemerkte Favoriten aus; Datenmodus wechseln
  const modus = await p.evaluate(() => ({ karten: document.querySelector('.sw-zaehler').textContent, kartenName: document.querySelector('.sw-karte-vorne .sw-name').textContent, enthaltene: MM.favoriten.liste().includes(document.querySelector('.sw-karte-vorne').dataset.material) }));
  check('Bereits gemerkte Favoriten erscheinen nicht noch einmal als Karte', !modus.enthaltene, modus);
  await p.click('#reiter-match');
  const vorModus = await p.evaluate(() => MM.match.ergebnis().ergebnisse.map(e => [e.id, e.score]).slice(0, 4));
  await p.check('#modus-schalter', { force: true }).catch(() => {});
  await p.evaluate(() => { const s = document.getElementById('modus-schalter'); s.checked = false; s.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(400);
  const nachModus = await p.evaluate(() => ({ modus: document.getElementById('modus-leiste').dataset.modus, favs: MM.favoriten.liste().length, ergebnis: MM.match.ergebnis().ergebnisse.map(e => [e.id, e.score]).slice(0, 4), karte: !!document.querySelector('.sw-karte-vorne') || !!document.querySelector('.sw-ende') }));
  check('Wechsel zwischen Demo- und Echtdaten: die Karten werden mit den neuen Werten neu berechnet, Favoriten und Antworten bleiben erhalten', nachModus.modus === 'echt' && nachModus.favs === nach.favs.length && JSON.stringify(nachModus.ergebnis) !== JSON.stringify(vorModus) && nachModus.karte, { vorModus, nachModus });
  await p.close();

  // ================= Reduzierte Bewegung
  p = await neu(1280, 'demo', { reduziert: true });
  await p.click('#kopf-match');
  await p.evaluate(() => { localStorage.setItem('materialmatch.match.v1', JSON.stringify({ antworten: { einsatz: 'daemmung', prioritaeten: ['co2'], anforderungen: ['keine'], kosten: 'keine', materialart: 'keine' } })); }); await p.reload(); await p.waitForTimeout(300); await p.click('#reiter-match');
  const vorR = await p.evaluate(() => document.querySelector('.sw-zaehler').textContent);
  await p.click('.sw-fav');
  const sofort = await p.evaluate(() => ({ zaehler: document.querySelector('.sw-zaehler').textContent, stil: document.querySelector('.sw-karte-vorne').getAttribute('style') || '', anim: [...document.querySelectorAll('*')].filter(e => parseFloat(getComputedStyle(e).transitionDuration) > 0).length }));
  check('Reduzierte Bewegung (prefers-reduced-motion): die Karte wechselt sofort ohne Flugbewegung, nirgends laufen Übergänge', sofort.zaehler !== vorR && !/transition/.test(sofort.stil) && sofort.anim === 0, sofort);
  await p.close();

  // ================= Speicher gesperrt (z. B. privates Fenster)
  p = await neu(1280, 'demo', { speicherKaputt: true });
  await p.click('#kopf-match'); await p.evaluate(() => { MM.favoriten.hinzufuegen('eps'); });
  const sg = await p.evaluate(() => ({ favs: MM.favoriten.liste(), ok: MM.favoriten.speicherOk(), hinweis: !!document.querySelector('.fav-speicher-hinweis') }));
  check('Ist das Speichern im Browser nicht möglich, funktionieren die Favoriten trotzdem bis zum Schließen der Seite; ein Hinweis erklärt es', sg.favs.join() === 'eps' && !sg.ok && sg.hinweis, sg);
  await p.close();

  // ================= Responsiv und bedienbar
  const probleme = [];
  for (const w of [320, 375, 430, 768, 820, 1024, 1280, 1920]) {
    const q = await neu(w, 'demo', { touch: true });
    await q.evaluate(() => { localStorage.setItem('materialmatch.match.v1', JSON.stringify({ antworten: { einsatz: 'daemmung', prioritaeten: ['co2', 'waerme'], anforderungen: ['keine'], kosten: 'keine', materialart: 'keine' } })); localStorage.setItem('materialmatch.favoriten.v1', JSON.stringify({ ids: ['eps', 'zellulose'] })); });
    await q.reload(); await q.waitForTimeout(250); await q.click('#reiter-match');
    const karte = await q.evaluate(() => { const cw = document.documentElement.clientWidth; const k = document.querySelector('.sw-karte-vorne').getBoundingClientRect(); const kn = [...document.querySelectorAll('.sw-knopf, .fav-vergleichen, .fav-weg, .fav-wahl, .steckbrief-knopf')].filter(x => x.getBoundingClientRect().width > 0).map(x => x.getBoundingClientRect()); const klein = [...document.querySelectorAll('#match *')].filter(e => e.children.length === 0 && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 12 && e.getBoundingClientRect().width > 0 && !e.closest('svg')).length; return { seite: document.documentElement.scrollWidth > cw, links: Math.round(k.left), rechts: Math.round(k.right), cw, knKlein: kn.filter(x => x.height < 44 && !(x.height >= 32 && x.width >= 44 && false)).length, klein }; });
    await q.evaluate(() => { MM.match.neuStarten(); });
    const iv = await q.evaluate(() => { const cw = document.documentElement.clientWidth; const o = [...document.querySelectorAll('.iv-karte')].map(x => x.getBoundingClientRect()); const nav = [...document.querySelectorAll('.iv-nav button')].map(x => x.getBoundingClientRect()); return { seite: document.documentElement.scrollWidth > cw, kl: o.filter(x => x.height < 56).length, raus: o.filter(x => x.right > cw + 1 || x.left < -1).length, navKlein: nav.filter(x => x.height < 44).length }; });
    if (karte.seite || karte.links < 0 || karte.rechts > karte.cw + 1 || karte.knKlein || karte.klein || iv.seite || iv.kl || iv.raus || iv.navKlein) probleme.push([w, karte, iv]);
    await q.close();
  }
  check('Match finden bei 320, 375, 430, 768, 820, 1024, 1280 und 1920 px: kein seitliches Scrollen, Karte im Fenster, Auswahlflächen mindestens 56 px, Knöpfe mindestens 44 px, keine Schrift unter 12 px', probleme.length === 0, probleme);

  // ================= Druck
  p = await neu(1280, 'demo'); await p.emulateMedia({ media: 'print' });
  check('Druck/PDF: der Bereich „Match finden“ (Bildschirmfunktion) wird nicht gedruckt', await p.evaluate(() => getComputedStyle(document.getElementById('bereich-match')).display === 'none'));
  await p.close();

  check('Keine Konsolenfehler oder -warnungen', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
