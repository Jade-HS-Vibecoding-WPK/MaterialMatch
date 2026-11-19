/* MaterialMatch Version 8 (19.11.2026): Startablauf – Logo-Auftakt (2,3 s, reinweiß, mittig, bei JEDEM Aufruf) und Hinweis „Kurz vorab“ (bei JEDEM Aufruf,
   erst nach dem Auftakt), nichts im Browser gespeichert, andere Speicherstände unberührt, Tastatur, Handy, Bewegung reduzieren
   Aufruf:  node tests/test56.js */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');
const fs = require('fs');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 600))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html';
const html = fs.readFileSync(path.join(PROJ, 'index.html'), 'utf8');
const aut = fs.readFileSync(path.join(PROJ, 'js', 'auftakt.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const hin = fs.readFileSync(path.join(PROJ, 'js', 'hinweis.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

(async () => {
  // ---------- Quelltext ----------
  check('Kein Speicher im Startablauf: weder sessionStorage noch localStorage in auftakt.js, hinweis.js oder im Kopf von index.html', !/sessionStorage|localStorage/.test(aut + hin + html.split('<body>')[0]));
  const css = (html.match(/<style id="auftakt-css">([\s\S]*?)<\/style>/) || [])[1] || '';
  check('Zeitvorgaben im Stil: Logo 0,3 s ein, Bildschirm 0,4 s aus nach 1,9 s (0,3 + 1,6 s sichtbar) = 2,3 s; Hintergrund #ffffff; keine Skalierung, Drehung oder Verschiebung', /animation: auftakt-ein \.3s/.test(css) && /animation: auftakt-aus \.4s ease 1\.9s/.test(css) && /background: #ffffff/.test(css) && !/transform|scale|rotate|translate/.test(css), css.slice(0, 200));
  check('Nur eine Startanimation: genau ein Auftakt-Element und ein Logo im Auftakt, kein Weiterleitungstext in index.html', (html.match(/id="auftakt"/g) || []).length === 1 && !/wird geladen|http-equiv="refresh"|location\.replace/.test(html));
  check('Die Schrift Nunito wird nicht blockierend geladen (ein langsames Netz hält den Start nicht auf)', /fonts\.googleapis[^>]*media="print" onload="this\.media='all'"/.test(html));
  check('Alle Pfade in index.html sind relativ (GitHub Pages, lokal)', [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m => m[1]).filter(u => !/^(https?:|data:|mailto:)/.test(u)).every(u => !u.startsWith('/')));

  const b = await chromium.launch();
  const neuKontext = async (opt = {}, init) => { const c = await b.newContext(Object.assign({ viewport: { width: 1280, height: 800 } }, opt)); if (init) await c.addInitScript(init); return c; };
  const errors = [];
  const zeitplan = async (p) => {   // beobachtet Auftakt und Hinweis im 25-ms-Takt
    return await p.evaluate(() => new Promise(res => {
      const t0 = performance.now(), log = []; let sah = false;
      const iv = setInterval(() => {
        const a = document.getElementById('auftakt'), h = document.getElementById('hinweis');
        const aSicht = !!a && !a.hidden && parseFloat(getComputedStyle(a).opacity) > 0.02;
        const hOffen = h.open;
        log.push([Math.round(performance.now() - t0), aSicht, hOffen, a ? Math.round(parseFloat(getComputedStyle(a).opacity) * 100) / 100 : null]);
        if (hOffen) { sah = true; }
        if (sah && log.length > 5 && performance.now() - t0 > 600) { clearInterval(iv); res(log); }
        if (performance.now() - t0 > 6000) { clearInterval(iv); res(log); }
      }, 25);
    }));
  };

  // ---------- Test 1: erster Besuch ----------
  let c = await neuKontext(); let p = await c.newPage(); p.on('pageerror', e => errors.push(String(e)));
  await p.goto(URL + '?modus=echt&start=ja', { waitUntil: 'commit' });
  const t0 = Date.now();
  const log1 = await zeitplan(p);
  const letzterSichtbar = log1.filter(x => x[1]).pop(), ersterOffen = log1.find(x => x[2]);
  const gleichzeitig = log1.filter(x => x[1] && x[2]).length;
  check(`Test 1 (erster Besuch): Logo-Auftakt sichtbar bis etwa ${letzterSichtbar && letzterSichtbar[0]} ms, danach öffnet sich „Kurz vorab“ (nach ${ersterOffen && ersterOffen[0]} ms); nie gleichzeitig`, letzterSichtbar && ersterOffen && letzterSichtbar[0] >= 2000 && letzterSichtbar[0] <= 2700 && ersterOffen[0] >= letzterSichtbar[0] && gleichzeitig === 0, [letzterSichtbar, ersterOffen, gleichzeitig]);
  const verlauf = log1.filter(x => x[1]).map(x => x[3]);
  const maxOp = Math.max(...verlauf), vollMs = log1.filter(x => x[3] >= 0.98).length * 25;
  check(`Ablauf: Logo blendet ein, ist rund 1,6 s vollständig sichtbar (gemessen ≈ ${vollMs} ms) und blendet danach aus`, maxOp >= 0.99 && vollMs >= 1300 && vollMs <= 2000, [maxOp, vollMs]);
  const zen = await p.evaluate(() => null);
  await p.click('#hinweis-ok');
  check('„Verstanden – MaterialMatch öffnen“ schließt das Fenster, die Seite ist bedienbar (Reiter „Match finden“ lässt sich öffnen)', await p.evaluate(() => !document.getElementById('hinweis').open) && (await p.click('#reiter-match'), await p.evaluate(() => document.getElementById('reiter-match').getAttribute('aria-selected') === 'true')));
  const speicher1 = await p.evaluate(() => ({ l: Object.keys(localStorage), s: Object.keys(sessionStorage) }));
  check('Nach dem ersten Besuch steht nichts vom Start im Browser (keine Auftakt- und keine Hinweis-Einträge)', !speicher1.l.concat(speicher1.s).some(k => /auftakt|hinweis/i.test(k)), speicher1);

  // ---------- Test 2/3/4: zweiter Besuch, Neuladen, neuer Tab ----------
  await p.evaluate(() => localStorage.setItem('materialmatch.hinweis.v1', '2026-01-01'));   // frühere Bestätigung alter Version
  await p.evaluate(() => { localStorage.setItem('materialmatch.favoriten.test', '["eps"]'); sessionStorage.setItem('mm.test', '1'); });
  await p.reload({ waitUntil: 'commit' });
  const log2 = await zeitplan(p);
  check('Test 2/3 (Neuladen nach früherer Bestätigung und im selben Tab): Logo-Auftakt UND „Kurz vorab“ erscheinen erneut, in dieser Reihenfolge', log2.some(x => x[1]) && log2.some(x => x[2]) && log2.filter(x => x[1] && x[2]).length === 0 && log2.findIndex(x => x[2]) > log2.findLastIndex(x => x[1]), log2.slice(0, 3));
  const sp2 = await p.evaluate(() => ({ fav: localStorage.getItem('materialmatch.favoriten.test'), alt: localStorage.getItem('materialmatch.hinweis.v1'), ss: sessionStorage.getItem('mm.test') }));
  check('Andere Speicherstände bleiben unberührt (Favoriten-Testeintrag, Sitzungseintrag; auch der alte Hinweis-Eintrag wird weder gelöscht noch ausgewertet)', sp2.fav === '["eps"]' && sp2.ss === '1' && sp2.alt === '2026-01-01', sp2);
  const p2 = await c.newPage(); await p2.goto(URL + '?modus=echt&start=ja', { waitUntil: 'commit' });
  const log3 = await zeitplan(p2);
  check('Test 4 (neuer Tab im selben Browser): Auftakt und „Kurz vorab“ erscheinen auch dort', log3.some(x => x[1]) && log3.some(x => x[2]));
  await p2.close();
  // anderer Browser-Kontext = Browser zwischendurch geschlossen (kein Speicher übernommen)
  const c3 = await neuKontext(); const p3 = await c3.newPage(); await p3.goto(URL + '?modus=echt&start=ja', { waitUntil: 'commit' });
  const log4 = await zeitplan(p3);
  check('Nach Schließen und Neuöffnen des Browsers (frischer Browser-Kontext): beide Elemente erscheinen', log4.some(x => x[1]) && log4.some(x => x[2]));
  await c3.close();

  // ---------- Zentrierung, Weiß, Logo ----------
  const c4 = await neuKontext(); const p4 = await c4.newPage();
  await p4.goto(URL + '?modus=echt&start=ja', { waitUntil: 'commit' }); await p4.waitForTimeout(900);
  const z = await p4.evaluate(() => { const e = document.getElementById('auftakt'); const i = e.querySelector('img'); const r = i.getBoundingClientRect(); const s = getComputedStyle(e);
    return { bg: s.backgroundColor, pos: s.position, abw: [Math.abs(r.left + r.width / 2 - innerWidth / 2), Math.abs(r.top + r.height / 2 - innerHeight / 2)], src: i.getAttribute('src'), nat: [i.naturalWidth, i.naturalHeight], schau: [r.width, r.height], bedeckt: e.getBoundingClientRect().width === innerWidth && e.getBoundingClientRect().height === innerHeight, text: e.textContent.trim(), kinder: e.children.length }; });
  const logoSvg = fs.readFileSync(path.join(PROJ, 'img', 'logo.svg'), 'utf8');
  const vb = (/viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(logoSvg) || []).slice(1).map(Number);
  check('Hintergrund reinweiß (rgb 255,255,255), deckt den ganzen Bildschirm, Logo = img/logo.svg exakt horizontal und vertikal zentriert (Abweichung < 1 px), kein weiterer Text', z.bg === 'rgb(255, 255, 255)' && z.bedeckt && z.src === 'img/logo.svg' && z.abw[0] < 1 && z.abw[1] < 1 && z.text === '' && z.kinder === 1, z);
  check('Logo unverändert in den Proportionen (angezeigtes Seitenverhältnis = Seitenverhältnis der Logo-Datei)', vb.length === 2 && Math.abs(z.schau[0] / z.schau[1] - vb[0] / vb[1]) < 0.02, [z.schau, vb]);
  await c4.close();

  // ---------- Handy ----------
  const cm = await neuKontext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const pm = await cm.newPage();
  await pm.goto(URL + '?modus=echt&start=ja', { waitUntil: 'commit' }); await pm.waitForTimeout(900);
  const zm = await pm.evaluate(() => { const i = document.querySelector('#auftakt img'); const r = i.getBoundingClientRect(); return { abw: [Math.abs(r.left + r.width / 2 - innerWidth / 2), Math.abs(r.top + r.height / 2 - innerHeight / 2)], passt: r.left >= 0 && r.right <= innerWidth }; });
  await pm.waitForSelector('#hinweis[open]', { timeout: 6000 });
  const hm = await pm.evaluate(() => { const d = document.getElementById('hinweis'); const r = d.getBoundingClientRect(); return { sicht: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, mitte: Math.abs((r.left + r.width / 2) - innerWidth / 2) < 2, scroll: document.documentElement.scrollWidth <= innerWidth }; });
  check('Test 6 (Smartphone 375 × 667, emuliert): Logo exakt zentriert; Hinweisfenster vollständig sichtbar und mittig', zm.abw[0] < 1 && zm.abw[1] < 1 && zm.passt && hm.sicht && hm.mitte && hm.scroll, [zm, hm]);
  await cm.close();

  // ---------- Hinweis sperrt die Seite, Tastatur ----------
  const ck = await neuKontext(); const pk = await ck.newPage(); await pk.goto(URL + '?modus=echt&start=ja');
  await pk.waitForSelector('#hinweis[open]', { timeout: 6000 });
  const tab = []; for (let i = 0; i < 4; i++) { await pk.keyboard.press('Tab'); tab.push(await pk.evaluate(() => !!document.activeElement.closest('#hinweis') || document.activeElement === document.body)); }
  const modal = await pk.evaluate(() => document.getElementById('hinweis').matches(':modal') && document.activeElement.id);
  check('Tastatur: der Fokus beginnt auf dem Knopf, springt mit Tab nie auf die Seite dahinter (nur Fenster oder Browserleiste), die Seite dahinter ist gesperrt (modal)', tab.every(Boolean) && modal === 'hinweis-ok', [tab, modal]);
  await pk.keyboard.press('Enter');
  check('Der Knopf lässt sich mit der Tastatur (Enter) auslösen: Fenster schließt, Seite bedienbar', await pk.evaluate(() => !document.getElementById('hinweis').open && !document.querySelector(':modal')));
  await ck.close();

  // ---------- Bewegung reduzieren ----------
  const cr = await neuKontext({ reducedMotion: 'reduce' }); const pr = await cr.newPage();
  await pr.goto(URL + '?modus=echt&start=ja', { waitUntil: 'commit' });
  const logr = await zeitplan(pr);
  const rm = await pr.evaluate(() => { const i = document.querySelector('#auftakt'); return i ? getComputedStyle(i).animationName : 'weg'; });
  check('Bewegung reduzieren: keine Ein-/Ausblendanimation, das Logo steht still, danach erscheint „Kurz vorab“ trotzdem', (rm === 'none' || rm === 'weg') && logr.some(x => x[1]) && logr.some(x => x[2]) && logr.filter(x => x[1] && x[2]).length === 0, [rm, logr.slice(0, 2)]);
  await cr.close();

  // ---------- langsames Laden ----------
  const cs = await neuKontext(); await cs.route('**/js/*.js', async r => { await new Promise(x => setTimeout(x, 700)); r.continue(); });
  const ps = await cs.newPage(); const ts = Date.now(); await ps.goto(URL + '?modus=echt&start=ja', { waitUntil: 'commit' });
  const logs = await zeitplan(ps);
  const spaet = logs.find(x => x[2]);
  check('Langsames Laden (jede Skriptdatei 0,7 s verzögert): Auftakt läuft trotzdem sauber, „Kurz vorab“ erscheint danach, nie gleichzeitig', spaet && logs.filter(x => x[1] && x[2]).length === 0 && spaet[0] >= 2000, [spaet]);
  await cs.close();

  check('Keine Skriptfehler im gesamten Lauf', errors.length === 0, errors);
  await b.close();
  console.log(fails ? fails + ' FEHLER' : 'Alle Prüfungen bestanden');
  process.exit(fails ? 1 : 0);
})();
