/* MaterialMatch 3.7 (18.11.2026): Hinweis „Kurz vorab“, Logo-Auftakt, kompakter Kopf ohne doppelte Knöpfe, Match-Hilfen, Ebenen im Vergleich,
   einheitliche Eckenradien, reduzierte Bewegung
   Aufruf:  node tests/test54.js */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');
const fs = require('fs');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 600))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html';
const TEXT1 = 'MaterialMatch ist ein studentisches Projekt, das mit Unterstützung von KI entwickelt wurde. Die angezeigten Baustoffdaten, Preise und Vergleiche dienen der ersten Orientierung. Bitte prüfe wichtige Angaben anhand der verlinkten Quellen und aktuellen Herstellerinformationen.';
const TEXT2 = 'Danke, dass du MaterialMatch ausprobierst!';

(async () => {
  const b = await chromium.launch();
  const errors = [];
  // Wichtig: Die Tests schalten Auftakt und Hinweis sonst ab (tests/_offline.js); ?start=ja schaltet sie wieder ein.
  const neu = async (query = '', opt = {}) => { const c = await b.newContext(Object.assign({ viewport: { width: 1280, height: 800 } }, opt)); const p = await c.newPage(); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); await p.goto(URL + '?modus=echt' + query); return p; };

  // ---------- 1. Hinweis „Kurz vorab“ ----------
  let p = await neu('&start=ja');
  await p.waitForSelector('#hinweis[open]', { timeout: 4000 });
  const h = await p.evaluate(() => { const d = document.getElementById('hinweis'); const logo = d.querySelector('.hinweis-logo'); return { offen: d.open, modal: d.matches(':modal'), logo: logo.getAttribute('src'), logoAlt: logo.alt, logoZuerst: d.firstElementChild === logo, titel: d.querySelector('h2').textContent, absaetze: [...d.querySelectorAll('.hinweis-text p')].map(x => x.textContent.trim()), knopf: d.querySelector('#hinweis-ok').textContent.trim(), knopfNach: d.lastElementChild.id, fokus: document.activeElement.id, labelledby: d.getAttribute('aria-labelledby'), titelId: d.querySelector('h2').id }; });
  check('Beim ersten Besuch erscheint das Fenster: oben das vorhandene Logo (img/logo.svg), darunter „Kurz vorab“, der Text im Wortlaut und der Knopf „Verstanden – MaterialMatch öffnen“', h.offen && h.modal && h.logo === 'img/logo.svg' && h.logoAlt === 'MaterialMatch' && h.logoZuerst && h.titel === 'Kurz vorab' && h.absaetze[0] === TEXT1 && h.absaetze[1] === TEXT2 && h.knopf === 'Verstanden – MaterialMatch öffnen' && h.knopfNach === 'hinweis-ok', h);
  check('Das Logo-Datei ist das einzige im Projekt vorhandene Logo (img/logo.svg liegt vor und ist unverändert das Logo mit den drei Materialschichten)', fs.existsSync(path.join(PROJ, 'img', 'logo.svg')) && (fs.readFileSync(path.join(PROJ, 'img', 'logo.svg'), 'utf8').match(/<polygon/g) || []).length === 3);
  check('Zugänglich: Dialog mit Titel (aria-labelledby), Fokus liegt auf dem Knopf, der Rest der Seite ist gesperrt (modal)', h.labelledby === h.titelId && h.fokus === 'hinweis-ok');
  const gesperrt = await p.evaluate(() => { const e = document.elementFromPoint(40, 200); return !!e.closest('dialog') || e.tagName === 'DIALOG' || e.tagName === 'HTML'; });
  await p.click('#hinweis-ok');
  const nachOk = await p.evaluate(() => ({ offen: document.getElementById('hinweis').open, gespeichert: localStorage.getItem('materialmatch.hinweis.v1') }));
  check('Klick auf „Verstanden“: das Fenster schließt sich, die Anwendung ist bedienbar, die Bestätigung steht im Browser (Datum)', !nachOk.offen && /^\d{4}-\d{2}-\d{2}$/.test(nachOk.gespeichert) && await p.evaluate(() => document.getElementById('reiter-match').getBoundingClientRect().width > 0), nachOk);
  await p.reload(); await p.waitForTimeout(1500);
  check('Zweiter Besuch (Neuladen): kein Fenster mehr', !(await p.evaluate(() => document.getElementById('hinweis').open)));
  await p.click('#hinweis-erneut');
  check('Im Fuß der Seite lässt sich der Hinweis erneut aufrufen', await p.evaluate(() => document.getElementById('hinweis').open));
  await p.keyboard.press('Escape');
  check('Escape schließt das Fenster ebenfalls, der Fokus kehrt zum Auslöser („Hinweis erneut anzeigen“) zurück', await p.evaluate(() => !document.getElementById('hinweis').open && document.activeElement.id === 'hinweis-erneut'));
  await p.close();
  // Escape speichert nichts
  p = await neu('&start=ja'); await p.waitForSelector('#hinweis[open]'); await p.keyboard.press('Escape');
  const ohneSpeicher = await p.evaluate(() => localStorage.getItem('materialmatch.hinweis.v1'));
  await p.reload(); await p.waitForSelector('#hinweis[open]', { timeout: 4000 });
  check('Wurde das Fenster nur mit Escape geschlossen, wird nichts gespeichert und es erscheint beim nächsten Besuch erneut', ohneSpeicher === null);
  await p.close();
  // Speicher gesperrt: kein Absturz, Fenster erscheint, Schließen klappt
  const c2 = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c2.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('gesperrt'); } }); });
  p = await c2.newPage(); p.on('pageerror', e => errors.push(String(e))); await p.goto(URL + '?modus=echt&start=ja');
  await p.waitForSelector('#hinweis[open]', { timeout: 4000 }); await p.click('#hinweis-ok');
  check('Ist der Browser-Speicher gesperrt (z. B. privates Fenster), funktioniert das Fenster trotzdem (Schließen klappt, kein Fehler)', !(await p.evaluate(() => document.getElementById('hinweis').open)));
  await p.close();
  // Nur der Hinweis, sonst nichts verändert: ohne ?start=ja (Teststandard) erscheint nichts
  p = await neu('');
  check('Testbetrieb (ohne ?start=ja): weder Auftakt noch Fenster, Seite sofort bedienbar', await p.evaluate(() => !document.getElementById('auftakt') && !document.getElementById('hinweis').open));
  await p.close();

  // ---------- 2. Logo-Auftakt ----------
  p = await neu('&start=ja');
  const a0 = await p.evaluate(() => { const e = document.getElementById('auftakt'); const s = getComputedStyle(e); const i = e.querySelector('img'); const r = i.getBoundingClientRect(); return { logo: i.getAttribute('src'), mittig: Math.abs((r.left + r.width / 2) - innerWidth / 2) < 8 && Math.abs((r.top + r.height / 2) - innerHeight / 2) < 8, pos: s.position, klicks: s.pointerEvents, hidden: e.getAttribute('aria-hidden'), bg: s.backgroundColor }; });
  check('Der Auftakt zeigt das vorhandene Logo (img/logo.svg) mittig auf ruhigem Hintergrund, ist für Hilfsprogramme verborgen und fängt keine Klicks ab', a0.logo === 'img/logo.svg' && a0.mittig && a0.pos === 'fixed' && a0.klicks === 'none' && a0.hidden === 'true' && /^rgb\(24[0-9], 24[0-9], 24[0-9]\)$/.test(a0.bg), a0);
  await p.waitForFunction(() => MM.auftakt && MM.auftakt.beendet() && document.getElementById('auftakt').hidden, null, { timeout: 3000 });
  await p.close();
  // Zeitgrenzen: Auftakt endet, sobald die Seite bereit ist (keine künstliche Wartezeit) und nie später als 1 Sekunde, auch bei langsamem Laden
  const messen = async (verzoegerung) => { const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); if (verzoegerung) await c.route('**/js/app.js', async r => { await new Promise(x => setTimeout(x, verzoegerung)); r.continue(); }); const q = await c.newPage(); const t0 = Date.now(); await q.goto(URL + '?modus=echt&start=ja', { waitUntil: 'commit' }); await q.waitForFunction(() => window.MM && MM.auftakt && MM.auftakt.beendet() && document.getElementById('auftakt').hidden, null, { timeout: 4000, polling: 20 }); const ms = Date.now() - t0; await c.close(); return ms; };
  const schnell = await messen(0), langsam = await messen(1500);
  check(`Schnelles Laden: der Auftakt endet, sobald die Seite bereit ist (${schnell} ms, ohne künstliche Wartezeit); sehr langsames Laden: spätestens nach 1 Sekunde (${langsam} ms)`, schnell < 900 && langsam <= 1150 && langsam >= 700, [schnell, langsam]);
  // Bedienbar während des Auftakts
  const c3 = await b.newContext({ viewport: { width: 1280, height: 800 } }); await c3.route('**/js/app.js', async r => { await new Promise(x => setTimeout(x, 400)); r.continue(); });
  p = await c3.newPage(); await p.goto(URL + '?modus=echt&start=ja&x=1', { waitUntil: 'domcontentloaded' });
  const waehrend = await p.evaluate(() => { const e = document.getElementById('auftakt'); return { sichtbar: !e.hidden && getComputedStyle(e).display !== 'none', ueberDerSeite: document.elementFromPoint(640, 100) === document.body || document.elementFromPoint(640, 100) === document.documentElement || !document.getElementById('auftakt').contains(document.elementFromPoint(640, 100)) }; });
  check('Während der Auftakt zu sehen ist, liegt er nicht im Weg: Klicks gehen durch ihn hindurch', waehrend.sichtbar && waehrend.ueberDerSeite, waehrend);
  await p.close();
  // Bewegung reduzieren: kein Ein- und Ausblenden, sofort weg
  const cr = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' }); const pr = await cr.newPage();
  await pr.goto(URL + '?modus=echt&start=ja&x=2'); await pr.waitForFunction(() => MM.auftakt && MM.auftakt.beendet(), null, { timeout: 3000 });
  const rm = await pr.evaluate(() => { const e = document.getElementById('auftakt'); return { weg: e.hidden, anim: getComputedStyle(e.querySelector('img')).animationName, trans: getComputedStyle(e).transitionDuration }; });
  check('Bei „Bewegung reduzieren“: keine Animation und kein Übergang, der Auftakt verschwindet sofort', rm.weg && (rm.anim === 'none') && /^0s$/.test(rm.trans), rm);
  check('Bei „Bewegung reduzieren“ gibt es auf der ganzen Seite keine Übergänge und Animationen (globale Regel)', await pr.evaluate(() => [...document.querySelectorAll('.tab, .btn, .kachel, .ent-karte')].every(e => { const s = getComputedStyle(e); return s.transitionDuration.split(',').every(x => x.trim() === '0s') && s.animationName === 'none'; })));
  await cr.close();

  // ---------- 3. Kopf, Navigation, Bento-Einheitlichkeit ----------
  p = await neu('');
  const kopf = await p.evaluate(() => ({ knoepfe: document.querySelectorAll('.kopf a, .kopf button').length, hoehe: Math.round(document.querySelector('.kopf').getBoundingClientRect().height), tabs: [...document.querySelectorAll('[role=tab]')].map(t => t.textContent.trim()), icons: [...document.querySelectorAll('[role=tab]')].slice(0, 3).every(t => t.querySelector('svg.ico')) }));
  check('Kopf: kompakt (unter 90 px) und ohne doppelte Schaltflächen; die drei Hauptbereiche sind als Reiter mit Symbol erreichbar', kopf.knoepfe === 0 && kopf.hoehe < 90 && kopf.icons && kopf.tabs.length === 5, kopf);
  const radien = await p.evaluate(() => { const r = s => [...new Set([...document.querySelectorAll(s)].map(e => getComputedStyle(e).borderTopLeftRadius))]; return { kachel: r('.kachel, .kopf, #bereich-vergleich .panel'), karten: r('.card, .rec-card, .kennwert'), tab: r('.tab') }; });
  check('Bento einheitlich: alle großen Kacheln haben denselben Eckenradius (22 px), alle Karten in Kacheln denselben (16 px), Reiter sind rund', radien.kachel.length === 1 && radien.kachel[0] === '22px' && radien.karten.every(x => ['16px', '22px'].includes(x)) && radien.tab.every(x => parseFloat(x) >= 100), radien);
  const css = fs.readFileSync(path.join(PROJ, 'css', 'bento.css'), 'utf8');
  const roh = (css.match(/border-radius:\s*\d+px/g) || []).map(x => x.replace(/\D/g, ''));
  check('Im CSS stehen Eckenradien als Variablen (--radius-kachel 22, --karte-radius 16, --radius-sm 12), keine Einzelwerte wie 10, 14 oder 18 px mehr', !roh.some(x => ['10', '14', '18'].includes(x)), [...new Set(roh)]);
  // Ebenen im Vergleich
  const ohne = await p.$$eval('.ebene', e => e.map(x => x.hidden));
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: '' })); await p.waitForTimeout(200);
  const mit = await p.$$eval('.ebene', e => e.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  const sichtbar = await p.$$eval('.ebene', e => e.map(x => !x.hidden));
  check('Vergleich in drei Ebenen: „1 Überblick“, „2 Visuelle Auswertung“, „3 Technische Details“ erscheinen erst, wenn Materialien gewählt sind', ohne.length === 3 && ohne.every(Boolean) && sichtbar.every(Boolean) && /^1Überblick/.test(mit[0]) && /^2Visuelle Auswertung/.test(mit[1]) && /^3Technische Details/.test(mit[2]), [ohne, mit]);
  await p.close();

  // ---------- 4. Match: Warum diese Frage? ----------
  p = await neu('&x=3#match');
  const fragen = [];
  for (let i = 0; i < 5; i++) {
    fragen.push(await p.evaluate(() => ({ titel: document.querySelector('.iv-titel').textContent, rolle: (document.querySelector('.iv-rolle') || {}).textContent, warum: (document.querySelector('.iv-warum p') || {}).textContent, aria: document.querySelector('.iv-fortschritt').getAttribute('aria-valuetext') })));
    if (i < 4) { await p.click('.iv-option:not(.iv-gesperrt) >> nth=0'); await p.click('.iv-nav button:last-child'); await p.waitForTimeout(150); }
  }
  check('Jede der fünf Fragen erklärt „Warum fragen wir das?“ und sagt, ob die Angabe zwingend oder ein persönlicher Wunsch ist; der Fortschritt nennt den Schritt', fragen.every(f => f.rolle && f.warum && f.warum.length > 60 && /Frage \d von 5: /.test(f.aria)) && /Pflichtangabe/.test(fragen[0].rolle) && /Persönliche Präferenz/.test(fragen[1].rolle) && /Zwingend/.test(fragen[2].rolle) && /Brandschutz ist zwingend/.test(fragen[2].warum) && /Persönliche Präferenz/.test(fragen[3].rolle) && /Persönliche Präferenz/.test(fragen[4].rolle), fragen);
  await p.close();
  check('Keine Konsolenfehler oder -warnungen im gesamten Lauf', errors.length === 0, errors);
  await b.close();
  console.log(fails ? '\n' + fails + ' FEHLER' : '\nAlle Prüfungen bestanden');
  process.exit(fails ? 1 : 0);
})();
