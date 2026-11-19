/* MaterialMatch 3.8 (19.11.2026): fachlich geprüfte Schraffuren (Zuordnung, Quelle, Platzhalter, keine erfundenen Muster), Du-Ansprache,
   „Wie geht es weiter?“ im Vergleich, Hinweisfenster mittig
   Aufruf:  node tests/test55.js */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');
const fs = require('fs');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 600))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html';
global.window = {};
require(path.join(PROJ, 'data', 'baustoffe.js'));
require(path.join(PROJ, 'data', 'schraffuren.js'));
const DB = window.MATERIALMATCH_DATA, SH = window.MATERIALMATCH_SCHRAFFUREN;
const IDS = DB.baustoffe.map(b => b.id);

(async () => {
  // ---------- Zuordnung ----------
  const ks = Object.keys(SH.materialien);
  check('Zuordnung data/schraffuren.js: genau die 50 Baustoffe der Datenbank', ks.length === 50 && IDS.every(i => SH.materialien[i]), ks.length);
  const z = { genannt: 0, gruppe: 0, keiner: 0 }; ks.forEach(k => z[SH.materialien[k].bezug]++);
  check('Jeder Eintrag hat einen Bezug: „genannt“, „gruppe“ oder „keiner“; zusammen 50 (32 / 11 / 7)', z.genannt + z.gruppe + z.keiner === 50 && z.keiner === 7 && z.gruppe === 11, z);
  check('Jede belegte Schraffur nennt Gruppe, Muster und Normbezug; „keiner“ nennt stattdessen einen Hinweis und keine erfundene Gruppe', ks.every(k => { const i = SH.materialien[k]; return i.bezug === 'keiner' ? (!i.gruppe && !i.muster && i.hinweis) : (i.gruppe && i.muster && i.norm); }));
  check('Quelle und Stand der Muster stehen in der Zuordnung (Lehrbuch, keine Normprüfung behauptet)', /Technisches Zeichnen/.test(SH.quelle) && /2026/.test(SH.stand) && !/normgerecht|DIN-konform/i.test(JSON.stringify(SH).replace(/nicht normgerecht/g, '')));
  const gruppen = {}; ks.forEach(k => { const g = SH.materialien[k].gruppe + '|' + SH.materialien[k].muster; if (SH.materialien[k].gruppe) (gruppen[g] = gruppen[g] || []).push(k); });
  const gleich = Object.keys(gruppen).every(g => { const t = gruppen[g].map(k => fs.readFileSync(path.join(PROJ, 'img', 'schraffuren', k + '.svg'), 'utf8').replace(/<title[^>]*>[^<]*<\/title>/, '')); return t.every(x => x === t[0]); });
  check('Baustoffe derselben Gruppe zeigen dasselbe Muster (keine eigenen, frei erfundenen Zeichnungen je Material)', gleich);
  const platz = fs.readFileSync(path.join(PROJ, 'img', 'schraffuren', 'platzhalter.svg'), 'utf8').replace(/<title[^>]*>[^<]*<\/title>/, '');
  check('Die 7 Baustoffe ohne belegte Darstellung zeigen den neutralen Platzhalter (graue Schichten)', ks.filter(k => SH.materialien[k].bezug === 'keiner').every(k => fs.readFileSync(path.join(PROJ, 'img', 'schraffuren', k + '.svg'), 'utf8').replace(/<title[^>]*>[^<]*<\/title>/, '') === platz));
  const doku = fs.readFileSync(path.join(PROJ, 'SCHRAFFUREN_PRUEFUNG.md'), 'utf8');
  check('SCHRAFFUREN_PRUEFUNG.md: nennt Quelle, Grenzen (nicht normgeprüft) und alle 50 Baustoffe', /nicht normgeprüft|nicht gegen den Normtext geprüft/.test(doku) && IDS.every(i => doku.includes('`' + i + '`')));
  check('Die Dokumentation behauptet nirgends „DIN-konform“ oder „normgerecht“ für die Muster', !/(sind|ist) (DIN-konform|normgerecht)/i.test(doku));

  // ---------- Anzeige ----------
  const br = await chromium.launch();
  const c = await br.newContext({ viewport: { width: 1280, height: 900 } }); const p = await c.newPage();
  const errors = []; p.on('pageerror', e => errors.push(String(e))); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto(URL + '?modus=echt'); await p.waitForTimeout(300);
  const s = await p.evaluate(() => {
    const B = MM.materialbilder;
    const f = (id, v) => { const e = B.element(id, { groesse: 'klein', beschriftung: true, variante: v }); return { cap: e.querySelector('figcaption').textContent, alt: e.querySelector('img').alt, platz: e.classList.contains('mbild-platzhalter') }; };
    return { eps: f('eps', 'schraffur'), porenbeton: f('porenbeton', 'schraffur'), alu: f('aluminium', 'schraffur'), beton: f('normalbeton', 'schraffur') };
  });
  check('Beschriftung: „Schraffur: Dämmstoff, schematisch“; bei Zuordnung durch das Projekt mit „(Gruppenzuordnung)“; ohne Beleg „Keine belegte Schraffur vorhanden“', s.eps.cap === 'Schraffur: Dämmstoff, schematisch' && s.porenbeton.cap === 'Schraffur: Mauerwerk aus künstlichen Steinen (Gruppenzuordnung), schematisch' && s.alu.cap === 'Keine belegte Schraffur vorhanden' && s.alu.platz && !s.beton.platz, s);
  await p.evaluate(() => MM.steckbrief.oeffne('aluminium', document.body)); await p.waitForTimeout(150);
  const sb = await p.evaluate(() => ({ text: document.querySelector('dialog.steckbrief').textContent, knoepfe: document.querySelectorAll('.sb-bild-knopf').length }));
  check('Steckbrief eines Materials ohne Schraffur-Beleg: Platzhalter mit klarem Text, keine kaputte Anzeige', /Keine belegte Schraffur vorhanden/.test(sb.text) || sb.knoepfe === 2, sb);
  await p.keyboard.press('Escape');
  await p.click('#reiter-quellen'); await p.waitForTimeout(150);
  const q = await p.evaluate(() => { const t = document.getElementById('qi-inhalt').textContent; return { ueberschrift: /Schraffuren/.test(t), grenzen: /nicht normgerecht/.test(t), liste: document.querySelectorAll('.schraffur-liste li').length }; });
  check('Quellen & Details → Schraffuren: erklärt die Grenzen und listet alle 50 Baustoffe mit Gruppe', q.ueberschrift && q.grenzen && q.liste === 50, q);

  // ---------- Du-Ansprache ----------
  const texte = await p.evaluate(() => { const o = []; for (const id of ['bereich-vergleich', 'bereich-entdecken', 'bereich-match', 'bereich-alternativen', 'bereich-quellen']) { const e = document.getElementById(id); o.push(e.textContent); } return o.join('\n'); });
  const sie = (texte.match(/\b(Wählen|Geben|Prüfen|Beachten|Versuchen|Bitte korrigieren) Sie\b|\bIhre[nrms]?\b|\bIhnen\b|\beure[nrms]?\b|\beuch\b/g) || []);
  check('Sichtbare Texte der fünf Bereiche: keine „Sie“-Ansprache (Wählen Sie, Ihre …) und kein „ihr/euch“ – einheitlich „du“', sie.length === 0, sie);
  const kjs = ['auswahl', 'dashboard', 'diagramme', 'eigenschaften', 'empfehlung', 'mengen', 'rechnen', 'produktformular', 'quellen-anzeige', 'suche', 'berechnung', 'datenmodus'].map(f => fs.readFileSync(path.join(PROJ, 'js', f + '.js'), 'utf8')).join('\n');
  const rest = (kjs.match(/"[^"\n]*\b(Wählen Sie|Geben Sie|Bitte korrigieren Sie|Versuchen Sie|Ihre[nrm]? [A-ZÄÖÜ]|von Ihnen)\b[^"\n]*"/g) || []);
  check('Auch in den Programmtexten (Meldungen, Leerzustände, Fehlermeldungen) steht keine „Sie“-Form', rest.length === 0, rest.slice(0, 3));

  // ---------- Wie geht es weiter? ----------
  const w0 = await p.evaluate(() => document.getElementById('vergleich-weiter').hidden);
  await p.click('#reiter-vergleich');
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps' })); await p.waitForTimeout(250);
  const w1 = await p.evaluate(() => { const e = document.getElementById('vergleich-weiter'); const k = [...e.querySelectorAll('button')].map(b => ({ t: b.textContent.trim(), farbe: getComputedStyle(b).color, bg: getComputedStyle(b).backgroundColor })); return { sichtbar: !e.hidden, k }; });
  const lesbar = w1.k.every(b => b.farbe !== b.bg);
  check('Nach dem Vergleich: „Wie geht es weiter?“ erscheint erst mit Auswahl und bietet Alternativen, Entdecken und Match (Texte lesbar)', w0 === true && w1.sichtbar && JSON.stringify(w1.k.map(x => x.t)) === '["Passende Alternativen ansehen","Weitere Baustoffe entdecken","Per Match finden"]' && lesbar, [w0, w1]);
  await p.click('#weiter-alternativen'); await p.waitForTimeout(250);
  const alt = await p.evaluate(() => ({ reiter: document.querySelector('.tab[aria-selected="true"]').id, a: MM.auswahl.holeAuswahl().plaetze.map(x => x.material.id) }));
  check('Ein Klick auf „Passende Alternativen ansehen“ wechselt in den Bereich Alternativen; die Auswahl bleibt erhalten', alt.reiter === 'reiter-alternativen' && alt.a.join() === 'mineralwolle,eps', alt);
  await p.click('#reiter-vergleich');
  await p.click('#weiter-entdecken'); await p.waitForTimeout(150);
  check('„Weitere Baustoffe entdecken“ führt zu Entdecken, die Auswahl bleibt', await p.evaluate(() => document.querySelector('.tab[aria-selected="true"]').id === 'reiter-entdecken' && MM.auswahl.holeAuswahl().plaetze.length === 2));

  // ---------- Hinweisfenster mittig ----------
  const c2 = await br.newContext({ viewport: { width: 1280, height: 800 } }); const p2 = await c2.newPage();
  await p2.goto(URL + '?modus=echt&start=ja'); await p2.waitForSelector('#hinweis[open]', { timeout: 4000 });
  const h = await p2.evaluate(() => { const d = document.getElementById('hinweis'); const r = d.getBoundingClientRect(); const m = e => { const q = e.getBoundingClientRect(); return Math.abs((q.left + q.width / 2) - (r.left + r.width / 2)); };
    return { dialogMitte: Math.abs((r.left + r.width / 2) - innerWidth / 2) < 2, abs: [...d.querySelectorAll('.hinweis-text p')].map(x => getComputedStyle(x).textAlign), logo: m(d.querySelector('.hinweis-logo')) < 2, knopf: m(d.querySelector('#hinweis-ok')) < 2, h2: getComputedStyle(d.querySelector('h2')).textAlign, breite: Math.round(r.width) }; });
  check('Hinweis „Kurz vorab“: Fenster, Logo, Überschrift, alle Textabsätze und Knopf sind mittig (keine linksbündigen Absätze), Fenster höchstens 28 rem breit', h.dialogMitte && h.abs.every(a => a === 'center') && h.logo && h.knopf && h.h2 === 'center' && h.breite <= 28 * 16 + 2, h);
  const c3 = await br.newContext({ viewport: { width: 320, height: 640 } }); const p3 = await c3.newPage();
  await p3.goto(URL + '?modus=echt&start=ja'); await p3.waitForSelector('#hinweis[open]', { timeout: 4000 });
  const hm = await p3.evaluate(() => { const r = document.getElementById('hinweis').getBoundingClientRect(); return { links: r.left >= 0, rechts: r.right <= innerWidth, oben: r.top >= 0, unten: r.bottom <= innerHeight, scroll: document.documentElement.scrollWidth <= innerWidth }; });
  check('Hinweis bei 320 px Breite: komplett sichtbar, nichts abgeschnitten', Object.values(hm).every(Boolean), hm);

  check('Keine Konsolenfehler im gesamten Lauf', errors.length === 0, errors);
  await br.close();
  console.log(fails ? fails + ' FEHLER' : 'Alle Prüfungen bestanden');
  process.exit(fails ? 1 : 0);
})();
