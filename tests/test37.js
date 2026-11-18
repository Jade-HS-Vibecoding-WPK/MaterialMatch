/* MaterialMatch 2.0, Schritt 10: Design (Inhaltsbreite, weniger Rahmen, einheitliche Buttons und Karten, Farben)
   Aufruf:  node tests/test37.js */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 500))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html?modus=demo';

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const neu = async (breite = 1280) => { const p = await b.newPage({ viewport: { width: breite, height: 900 } }); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); await p.goto(URL); await p.waitForTimeout(250); await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: '' })); await p.evaluate(() => { for (const [id, v] of [['flaeche', '100'], ['dicke', '20']]) { const f = document.getElementById(id); f.value = v; f.dispatchEvent(new Event('input', { bubbles: true })); } }); return p; };
  const rahmen = (p, sel) => p.$eval(sel, e => { const c = getComputedStyle(e); return parseFloat(c.borderTopWidth) + parseFloat(c.borderLeftWidth) > 0 && c.borderTopStyle !== 'none'; });

  let p = await neu(1280);
  // ---- Breite
  const br = await p.evaluate(() => ({ inhalt: document.querySelector('main').getBoundingClientRect().width, seite: document.documentElement.scrollWidth <= document.documentElement.clientWidth, max: getComputedStyle(document.querySelector('.container')).maxWidth }));
  check('Inhaltsbreite (MaterialMatch 2.1): max-width 1360 px; bei 1280 px Fenster füllt der Inhalt die Breite, kein seitliches Scrollen', br.max === '1360px' && br.inhalt >= 1230 && br.inhalt <= 1360 && br.seite, br);
  const sehrBreit = await b.newPage({ viewport: { width: 1920, height: 900 } }); await sehrBreit.goto(URL);
  check('Auf einem sehr breiten Bildschirm (1920 px) bleibt der Inhalt bei höchstens 1360 px und wirkt nicht gestreckt', await sehrBreit.$eval('main', e => e.getBoundingClientRect().width <= 1360));
  check('Fließtexte (Einleitung der Alternativen) haben eine begrenzte Zeilenlänge (max. 75 Zeichen); der Orientierungshinweis ist eine volle Kachelbreite', await p.$eval('.bereich-intro', e => { const c = getComputedStyle(e); return parseFloat(c.maxWidth) > 0 && parseFloat(c.maxWidth) <= 75 * parseFloat(c.fontSize); }));

  // ---- Rahmen reduziert
  // Bento-Design: jede Kachel hat große Rundung (mindestens 20 px), einen weichen Schatten und einen sehr dezenten Rand
  const kachel = await p.evaluate(() => ['#auswahl', '#eingaben', '.kennwert[data-kennwert=kosten]', '.kennwert[data-kennwert=co2-fossil]', '.kennwert[data-kennwert=gewicht]', '.kennwert[data-kennwert=lambda]', '#diagramme', '.export-leiste', '#ergebnisse'].map(sel => { const c = getComputedStyle(document.querySelector(sel)); return [sel, parseFloat(c.borderTopLeftRadius), c.boxShadow !== 'none', parseFloat(c.borderTopWidth)]; }));
  check('Bento-Kacheln: Auswahl, Eingaben, Kosten, CO₂, Gewicht, Wärme, Diagramme, Export und technische Eigenschaften haben große Rundung (20–28 px), weichen Schatten und einen höchstens 1 px dünnen Rand', kachel.every(k => k[1] >= 20 && k[1] <= 28 && k[2] && k[3] <= 1), kachel);
  const bg = s => p.$eval(s, e => getComputedStyle(e).backgroundColor);
  const farbenGleich = [await bg('.kennwert[data-kennwert=kosten]'), await bg('.kennwert[data-kennwert=co2-fossil]'), await bg('.kennwert[data-kennwert=gewicht]'), await bg('.kennwert[data-kennwert=lambda]'), await bg('#auswahl'), await bg('#diagramme'), await bg('#ergebnisse'), await bg('.export-leiste')];
  const eingabenFarbe = await bg('#eingaben');
  check('Farbkonzept (Ausgewogener Vergleich): alle vier Kennwert-Kacheln, Auswahl, Diagramme, Export und Details sind Weiß, nur die Eingaben sind Hellviolett #EEE9FA (grün, gelb, orange und rot sind keine Kachelfarben)', farbenGleich.every(c => c === 'rgb(255, 255, 255)') && eingabenFarbe === 'rgb(238, 233, 250)', { farbenGleich, eingabenFarbe });
  await p.selectOption('#prioritaet', 'kosten');
  const hero = await p.evaluate(() => [...document.querySelectorAll('.kennwert')].map(k => [k.dataset.kennwert, k.dataset.rolle, getComputedStyle(k).backgroundColor]));
  check('Farbkonzept (Priorität Kosten): alle vier Kennwert-Kacheln bleiben Weiß und gleich groß; nur „Materialkosten“ trägt dezent die Marke „Dein Schwerpunkt“ (hellblauer Rand, kein Hero)', hero.length === 4 && hero.every(h => h[2] === 'rgb(255, 255, 255)') && hero[0][0] === 'kosten' && hero[0][1] === 'schwerpunkt' && hero.slice(1).every(h => h[1] === 'gleich'), hero);
  await p.selectOption('#prioritaet', 'ausgewogen');
  check('Materialkarten in der Auswahl sind pastellfarben (kein Rand, Rundung mindestens 16 px)', await p.$$eval('#auswahl-karten .card', c => c.length > 0 && c.every(x => { const s = getComputedStyle(x); return parseFloat(s.borderTopLeftRadius) >= 16 && s.backgroundColor !== 'rgb(255, 255, 255)'; })));
  check('Alternativen: die Kachel hat große Rundung, die drei Empfehlungskarten darin sind pastellfarben', await p.$eval('#alternativen', e => parseFloat(getComputedStyle(e).borderTopLeftRadius) >= 20) && await p.$$eval('#alternativen-inhalt .rec-card', c => c.length === 3 && c.every(x => getComputedStyle(x).backgroundColor !== 'rgb(255, 255, 255)')));
  await p.click('#reiter-vergleich');

  // ---- Buttons einheitlich
  await p.evaluate(() => MM.diagramme.zeigeWeitere(false));
  const knoepfe = await p.evaluate(() => ['#export-menue-knopf', '#btn-drittes', '#btn-produkt', '#btn-eigen', '#diagramme-weitere-knopf'].map(s => { const e = document.querySelector(s); const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return [s, c.borderTopLeftRadius, Math.round(r.height), c.fontSize, c.fontFamily === getComputedStyle(document.body).fontFamily]; }));
  check('Alle Buttons (Export, Optionen, „Weitere Kennwerte“) haben dieselbe Ecken-Rundung, Schriftgröße, Schriftart und sind mindestens 40 px hoch', new Set(knoepfe.map(k => k[1])).size === 1 && new Set(knoepfe.map(k => k[3])).size === 1 && knoepfe.every(k => k[2] >= 40 && k[4]), knoepfe);
  const alt = await neu(1280); await alt.click('#reiter-alternativen');
  check('Auch der Karten-Button „Alternative vergleichen“ hat dieselbe Rundung und Höhe', await alt.$eval('#alternativen-inhalt .rec-card button[data-aktion=vergleichen]:not([disabled])', e => { const c = getComputedStyle(e); return parseFloat(c.borderTopLeftRadius) >= 20 && e.getBoundingClientRect().height >= 40; }));
  check('Fokus: Buttons, Reiter, Links und Felder haben bei Tastaturbedienung einen sichtbaren Umriss (2 px)', await (async () => { const erg = []; for (const s of ['#btn-drittes', '#export-menue-knopf', '#reiter-vergleich', '#flaeche']) { await p.focus(s); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); erg.push(await p.evaluate(() => { const c = getComputedStyle(document.activeElement); return parseFloat(c.outlineWidth) >= 2 && c.outlineStyle !== 'none'; })); } return erg.every(Boolean); })());

  // ---- Farben
  const farben = await p.evaluate(() => ['--score-1', '--score-2', '--score-3', '--score-4', '--score-5'].map(v => getComputedStyle(document.documentElement).getPropertyValue(v).trim().toLowerCase()));
  check('Bewertungsfarbskala unverändert: #17643A, #78B85A, #E9C94E, #E68B43, #951F2B', JSON.stringify(farben) === JSON.stringify(['#17643a', '#78b85a', '#e9c94e', '#e68b43', '#951f2b']), farben);
  const flaechen = await p.evaluate(() => { const bg = getComputedStyle(document.body).backgroundColor; const text = getComputedStyle(document.body).color; return { bg, text }; });
  check('Seite: heller, neutraler Hintergrund und dunkelgraue Schrift (keine Bewertungsfarbe als Flächen- oder Textfarbe)', flaechen.bg === 'rgb(245, 246, 248)' && flaechen.text === 'rgb(31, 37, 48)', flaechen);
  const kontrast = await p.evaluate(() => { const lum = c => { const a = c.match(/\d+/g).slice(0, 3).map(x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; }; const k = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05); }; const soft = getComputedStyle(document.documentElement).getPropertyValue('--text-soft').trim(); const hex = h => { const n = parseInt(h.slice(1), 16); return 'rgb(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ')'; }; return { weiss: k(hex(soft), 'rgb(255,255,255)'), grau: k(hex(soft), 'rgb(245,246,247)') }; });
  check('Lesbarkeit: der hellere Nebentext hat auf Weiß und auf dem hellgrauen Hintergrund mindestens Kontrast 4,5 : 1 (WCAG AA)', kontrast.weiss >= 4.5 && kontrast.grau >= 4.5, kontrast);
  check('Balkenspuren der Diagramme sind auf dem Seitenhintergrund erkennbar (dunkler als der Hintergrund)', await p.$eval('.chart-track', e => { const n = getComputedStyle(e).backgroundColor.match(/\d+/g).map(Number); return n[0] < 245 - 10; }));

  // ---- Überschriften-Hierarchie
  const gr = await p.evaluate(() => { const px = s => parseFloat(getComputedStyle(document.querySelector(s)).fontSize); return { h1: px('h1'), h2: px('#diagramme > h2'), h3: px('.chart-title'), text: px('body') }; });
  check('Schriftgrößen-Hierarchie: Seitentitel > Abschnittsüberschrift > Diagrammtitel > Text; Abschnittsüberschriften alle gleich groß', gr.h1 > gr.h2 && gr.h2 > gr.h3 && gr.h3 >= gr.text && await p.evaluate(() => new Set(['#dashboard > h2', '#diagramme > h2', '#eingaben summary h2'].map(s => getComputedStyle(document.querySelector(s)).fontSize)).size === 1), gr);

  // ---- Responsiv
  const lay = async w => { const m = await neu(w); await m.click('#reiter-alternativen'); const a = await m.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth); await m.click('#reiter-quellen'); const q = await m.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth); await m.click('#reiter-vergleich'); const v = await m.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth); return a && q && v; };
  check('Kein seitliches Scrollen in allen drei Reitern bei 1280, 820 und 375 px', await lay(1280) && await lay(820) && await lay(375));

  // ---- Druck unverändert: keine Rahmen/Hintergründe aus dem Bildschirmdesign
  const d = await neu(1280); await d.emulateMedia({ media: 'print' });
  check('Druckansicht: weißer Hintergrund, schwarze Schrift, Container ohne Breitenbegrenzung', await d.evaluate(() => getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)' && getComputedStyle(document.body).color === 'rgb(0, 0, 0)' && getComputedStyle(document.querySelector('.container')).maxWidth === 'none'));

  check('Keine Konsolenfehler oder -warnungen', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
