/* MaterialMatch 3.6 (18.11.2026): Materialfotos als primäre Darstellung (Wikimedia Commons), Schraffuren unverändert als Alternative
   Aufruf:  node tests/test53.js */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const { spawnSync } = require('child_process');   // (Python/Pillow nur für die Bildmaße)

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 600))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html';
const ctx = { window: {} }; vm.createContext(ctx);
for (const f of ['baustoffe', 'bilder']) vm.runInContext(fs.readFileSync(path.join(PROJ, 'data', f + '.js'), 'utf8'), ctx);
const DB = ctx.window.MATERIALMATCH_DATA, BILDER = ctx.window.MATERIALMATCH_BILDER.bilder;
const IDS = DB.baustoffe.map(m => m.id);
const MIT = IDS.filter(i => BILDER[i]), OHNE = IDS.filter(i => !BILDER[i]);
const ERLAUBT = /^(CC0|Public domain|CC BY(-SA)? [\d.]+( de)?)$/;

(async () => {
  // ---------- 1. Zuordnung und Dateien ----------
  check(`Zentrale Zuordnung data/bilder.js: ${MIT.length} von 50 Baustoffen haben ein Foto, ${OHNE.length} nicht (Schraffur); jede Kennung gehört zu einem vorhandenen Baustoff`, MIT.length >= 40 && Object.keys(BILDER).every(k => IDS.includes(k)), [MIT.length, OHNE]);
  const dateien = MIT.map(i => BILDER[i].datei);
  check('Jedes Foto: Datei img/materialfotos/<Kennung>.webp vorhanden, eindeutige Dateinamen, WebP-Format', dateien.every((d, i) => d === MIT[i] + '.webp' && fs.existsSync(path.join(PROJ, 'img', 'materialfotos', d)) && fs.readFileSync(path.join(PROJ, 'img', 'materialfotos', d)).slice(8, 12).toString() === 'WEBP') && new Set(dateien).size === dateien.length);
  const py = spawnSync('python3', ['-c', 'import sys,os\nfrom PIL import Image\nd=sys.argv[1]\nfor f in sorted(os.listdir(d)):\n  im=Image.open(os.path.join(d,f)); print(f, im.size[0], im.size[1], os.path.getsize(os.path.join(d,f)))', path.join(PROJ, 'img', 'materialfotos')], { encoding: 'utf8' });
  const groessen = py.stdout.trim().split('\n').filter(Boolean).map(z => z.split(' '));
  check('Alle Fotos haben dasselbe Seitenverhältnis 4:3 (800 × 600 px) und sind klein (je höchstens 200 KB, im Mittel unter 90 KB)', groessen.length === MIT.length && groessen.every(g => +g[1] === 800 && +g[2] === 600 && +g[3] <= 200 * 1024) && groessen.reduce((s, g) => s + +g[3], 0) / groessen.length < 90 * 1024, groessen.filter(g => +g[3] > 200 * 1024));
  const unvoll = MIT.filter(i => { const b = BILDER[i]; return !(b.urheber && b.lizenz && b.quelle_name && /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(b.quelle_url) && b.alt && /^Foto: /.test(b.alt) && ['2026-11-18', '2026-11-19'].includes(b.abgerufen) && b.bearbeitung); });
  check('Jedes Foto nennt Urheber, Lizenz, Fundstelle (Link auf die Dateiseite bei Wikimedia Commons), Abrufdatum, Bearbeitung und einen aussagekräftigen Alternativtext („Foto: …“)', unvoll.length === 0, unvoll);
  check('Nur freie Lizenzen ohne Einschränkung (CC0, gemeinfrei, CC BY, CC BY-SA); keine NC/ND-Lizenzen; Lizenzlink bei jeder Creative-Commons-Lizenz', MIT.every(i => ERLAUBT.test(BILDER[i].lizenz) && (!/^CC BY/.test(BILDER[i].lizenz) || /^https:\/\/creativecommons\.org\//.test(BILDER[i].lizenz_url))), MIT.filter(i => !ERLAUBT.test(BILDER[i].lizenz)).map(i => [i, BILDER[i].lizenz]));
  check('Alternativtexte sind verschieden und nicht leer (mindestens 25 Zeichen)', new Set(MIT.map(i => BILDER[i].alt)).size === MIT.length && MIT.every(i => BILDER[i].alt.length >= 25));

  // ---------- 2. Schraffuren unverändert ----------
  // Prüfsummen der Schraffuren, aufgenommen aus der Sicherung vor den Fotos (tests/schraffuren_sha256.json)
  const soll = JSON.parse(fs.readFileSync(path.join(__dirname, 'schraffuren_sha256.json'), 'utf8'));
  const hash = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  const abw = Object.keys(soll).filter(f => !fs.existsSync(path.join(PROJ, 'img', 'schraffuren', f)) || hash(path.join(PROJ, 'img', 'schraffuren', f)) !== soll[f]);
  check(`Alle ${Object.keys(soll).length} Schraffuren (inkl. Platzhalter) entsprechen dem Stand von 3.8 (fachlich geprüfte Schraffuren; Prüfsumme je Datei)`, Object.keys(soll).length >= 51 && abw.length === 0, abw);
  check('Alle 50 Schraffuren und der Platzhalter liegen weiter im Projekt', IDS.every(i => fs.existsSync(path.join(PROJ, 'img', 'schraffuren', i + '.svg'))) && fs.existsSync(path.join(PROJ, 'img', 'schraffuren', 'platzhalter.svg')));

  // ---------- 3. Im Browser ----------
  const b = await chromium.launch();
  const errors = [], gescheitert = [];
  const neu = async (breite = 1280, hash = '') => { const c = await b.newContext({ viewport: { width: breite, height: 900 } }); const p = await c.newPage(); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); p.on('requestfailed', r => gescheitert.push(r.url())); await p.goto(URL + '?modus=echt' + hash); await p.waitForTimeout(300); return p; };
  let p = await neu(1280, '#entdecken');
  const el = await p.evaluate(async ids => {
    const out = [];
    for (const id of ids) {
      const f = MM.materialbilder.element(id, { groesse: 'klein', beschriftung: true });
      const img = f.querySelector('img'); img.loading = 'eager'; document.body.appendChild(f);
      await new Promise(r => { if (img.complete && img.naturalWidth) r(); else { img.addEventListener('load', r); img.addEventListener('error', r); setTimeout(r, 4000); } });
      out.push({ id, variante: f.dataset.variante, ok: img.naturalWidth > 0, src: img.getAttribute('src'), alt: img.alt, cap: f.querySelector('figcaption').textContent, ersatz: img.getAttribute('data-ersatz') });
      f.remove();
    }
    return out;
  }, IDS);
  check('Alle 50 Baustoffe: das Bild lädt (kein kaputtes Bild); mit Foto → Foto, ohne Foto → Schraffur', el.every(x => x.ok && !x.ersatz && x.variante === (BILDER[x.id] ? 'foto' : 'schraffur') && x.src === (BILDER[x.id] ? 'img/materialfotos/' + BILDER[x.id].datei + (BILDER[x.id].version ? '?v=' + BILDER[x.id].version : '') : 'img/schraffuren/' + x.id + '.svg')), el.filter(x => !x.ok || x.ersatz));
  check('Alternativtext und Beschriftung: Foto → „Foto: …“ und Bildnachweis (Urheber, Lizenz, Wikimedia Commons); Schraffur → „Technische Schraffur (schematisch): …“ bzw. „Keine belegte Schraffur vorhanden“', el.every(x => BILDER[x.id] ? (x.alt === BILDER[x.id].alt && x.cap === 'Foto: ' + BILDER[x.id].urheber + ', ' + BILDER[x.id].lizenz + ' (Wikimedia Commons)') : (/^(Technische Schraffur \(schematisch\)|Keine belegte Schraffur vorhanden): /.test(x.alt) && (/^Schraffur: .+, schematisch$/.test(x.cap) || x.cap === 'Keine belegte Schraffur vorhanden'))));
  const ers = await p.evaluate(async () => { const f = MM.materialbilder.element('eps', { groesse: 'klein', beschriftung: true }); document.body.appendChild(f); const img = f.querySelector('img'); img.loading = 'eager'; img.src = 'img/materialfotos/gibt-es-nicht.webp'; await new Promise(r => setTimeout(r, 500)); const s1 = img.getAttribute('src'), v1 = f.dataset.variante, c1 = f.querySelector('figcaption').textContent; img.src = 'img/schraffuren/gibt-es-auch-nicht.svg'; await new Promise(r => setTimeout(r, 500)); return { s1, v1, c1, s2: img.getAttribute('src'), k2: f.className }; });
  for (let i = errors.length - 1; i >= 0; i--) if (/Failed to load resource/.test(errors[i])) errors.splice(i, 1);   // die zwei absichtlich fehlenden Dateien
  check('Fehlt eine Fotodatei, springt das Bild auf die Schraffur (Beschriftung passt sich an); fehlt auch diese, auf den neutralen Platzhalter', ers.s1 === 'img/schraffuren/eps.svg' && ers.v1 === 'schraffur' && ers.c1 === 'Schraffur: Dämmstoff, schematisch' && ers.s2 === 'img/schraffuren/platzhalter.svg' && /mbild-platzhalter/.test(ers.k2), ers);

  // dieselbe Bildquelle in allen Bereichen
  await p.evaluate(() => { MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: '' }); });
  const quelle = id => 'img/materialfotos/' + BILDER[id].datei;
  const imEntdecken = await p.$eval('#ent-liste [data-material="eps"] img', e => e.getAttribute('src'));
  await p.click('#reiter-vergleich');
  const inAuswahl = await p.$eval('#auswahl-karten .card:nth-child(2) .mbild img', e => e.getAttribute('src')).catch(() => null);
  await p.fill('#suche', 'polystyrol'); await p.waitForTimeout(150);
  const inSuche = await p.$$eval('#suche-liste [role=option] .mbild img', e => e.map(x => x.getAttribute('src')));
  await p.fill('#suche', '');
  await p.click('[data-steckbrief="eps"]'); await p.waitForTimeout(150);
  const imSteckbrief = await p.$eval('dialog.steckbrief .mbild img', e => e.getAttribute('src'));
  await p.keyboard.press('Escape');
  await p.click('#reiter-alternativen'); await p.waitForTimeout(150);
  const inAlt = await p.$$eval('#alternativen-inhalt .rec-card .card-head .mbild', e => e.map(x => [x.dataset.material, x.querySelector('img').getAttribute('src')]));
  check('Dieselbe Bildquelle pro Material in Entdecken, Materialauswahl (Vergleich), Suche, Steckbrief und Alternativen', [imEntdecken, inAuswahl, imSteckbrief].every(s => s === quelle('eps')) && inSuche.includes(quelle('eps')) && inAlt.length >= 1 && inAlt.every(([m, s]) => s === (BILDER[m] ? quelle(m) : 'img/schraffuren/' + m + '.svg')), [imEntdecken, inAuswahl, inSuche, imSteckbrief, inAlt]);
  // Favoriten, Match, Swipe
  await p.evaluate(() => { try { localStorage.setItem('materialmatch.favoriten.v1', JSON.stringify(['eps'])); } catch (e) { } });
  await p.click('#reiter-match'); await p.waitForTimeout(200);
  await p.evaluate(() => { MM.match.zeigeInterview && MM.match.zeigeInterview(0); });
  const erg = await p.evaluate(() => { const r = MM.matching.berechne({ einsatz: 'daemmung', prioritaeten: ['waerme'], anforderungen: ['keine'], kosten: 'keine', materialart: 'keine' }); return r.ergebnisse.slice(0, 5).map(e => e.id); });
  const swipe = await p.evaluate(ids => { const a = { einsatz: 'daemmung', prioritaeten: ['waerme'], anforderungen: ['keine'], kosten: 'keine', materialart: 'keine' }; MM.swipe.zeige(document.getElementById('match-inhalt') || document.getElementById('bereich-match'), MM.matching.berechne(a, {}), a); const r = document.getElementById('bereich-match'); return { top: [...r.querySelectorAll('.sw-top-eintrag .mbild')].map(x => [x.dataset.material, x.querySelector('img').getAttribute('src')]), karte: [...r.querySelectorAll('.sw-karte-vorne .mbild')].map(x => [x.dataset.material, x.querySelector('img').getAttribute('src')]) }; }, erg).catch(e => ({ fehler: String(e) }));
  check('Match-Ergebnisse (Trefferliste) und Swipe-Karten zeigen dasselbe Bild wie überall (Foto bzw. Schraffur je Material)', swipe.top && swipe.top.length >= 3 && swipe.karte.length >= 1 && [...swipe.top, ...swipe.karte].every(([m, s]) => s === (BILDER[m] ? quelle(m) : 'img/schraffuren/' + m + '.svg')), swipe);
  const fav = await p.evaluate(() => { MM.favoriten.hinzufuegen && MM.favoriten.hinzufuegen('eps'); return [...document.querySelectorAll('#favoriten-inhalt .fav-karte .mbild img')].map(x => x.getAttribute('src')); });
  check('Favoriten zeigen dasselbe Foto', fav.length >= 1 && fav.every(s => s === quelle('eps')), fav);

  // ---------- 4. Steckbrief: Umschaltung Foto / Schraffur ----------
  await p.click('#reiter-vergleich');
  await p.evaluate(() => MM.steckbrief.oeffne('mineralwolle', document.body));
  await p.waitForTimeout(150);
  const s0 = await p.evaluate(() => { const d = document.querySelector('dialog.steckbrief'); return { var: d.querySelector('figure.mbild').dataset.variante, knoepfe: [...d.querySelectorAll('.sb-bild-knopf')].map(k => [k.textContent, k.getAttribute('aria-pressed')]), cap: d.querySelector('.mbild-text').textContent, alt: d.querySelector('figure img').alt }; });
  await p.click('dialog.steckbrief .sb-bild-knopf[data-variante="schraffur"]');
  const s1 = await p.evaluate(() => { const d = document.querySelector('dialog.steckbrief'); return { var: d.querySelector('figure.mbild').dataset.variante, knoepfe: [...d.querySelectorAll('.sb-bild-knopf')].map(k => [k.textContent, k.getAttribute('aria-pressed')]), cap: d.querySelector('.mbild-text').textContent, src: d.querySelector('figure img').getAttribute('src'), alt: d.querySelector('figure img').alt }; });
  await p.click('dialog.steckbrief .sb-bild-knopf[data-variante="foto"]');
  const s2 = await p.evaluate(() => document.querySelector('dialog.steckbrief figure.mbild').dataset.variante);
  check('Steckbrief: Standard ist das Foto mit Bildnachweis; der Umschalter („Foto“ / „Schraffur“, aria-pressed) zeigt die technische Schraffur und wieder zurück', s0.var === 'foto' && JSON.stringify(s0.knoepfe) === '[["Foto","true"],["Schraffur","false"]]' && /^Foto: .*Wikimedia Commons\)$/.test(s0.cap) && s1.var === 'schraffur' && JSON.stringify(s1.knoepfe) === '[["Foto","false"],["Schraffur","true"]]' && s1.cap === 'Schraffur: Dämmstoff, schematisch' && s1.src === 'img/schraffuren/mineralwolle.svg' && /^Technische Schraffur \(schematisch\): /.test(s1.alt) && s2 === 'foto', [s0, s1, s2]);
  await p.keyboard.press('Escape');
  const ohneFoto = OHNE[0];
  await p.evaluate(id => MM.steckbrief.oeffne(id, document.body), ohneFoto); await p.waitForTimeout(150);
  const s3 = await p.evaluate(() => { const d = document.querySelector('dialog.steckbrief'); return { schalter: d.querySelectorAll('.sb-bild-schalter').length, var: d.querySelector('figure.mbild').dataset.variante }; });
  check(`Baustoff ohne Foto (${ohneFoto}): der Steckbrief zeigt die Schraffur ohne Umschalter`, s3.schalter === 0 && s3.var === 'schraffur', s3);
  await p.keyboard.press('Escape');
  await p.click('#reiter-quellen'); await p.waitForTimeout(150);
  await p.evaluate(() => document.querySelectorAll('#qi-inhalt details').forEach(d => d.open = true));
  const nachweis = await p.$$eval('#qi-inhalt .bildnachweis li', l => l.map(li => ({ t: li.textContent, links: [...li.querySelectorAll('a')].map(a => [a.href, a.target, a.rel]) })));
  check(`Quellen & Details: Bildnachweis mit allen ${MIT.length} Fotos (Name, Urheber, Lizenz, Link zur Fundstelle; Links mit rel=noopener), dazu die Liste der Baustoffe ohne Foto`, nachweis.length === MIT.length && nachweis.every(n => n.links.length >= 1 && n.links[n.links.length - 1][0].startsWith('https://commons.wikimedia.org/wiki/File:') && n.links.every(l => l[1] === '_blank' && /noopener/.test(l[2]))) && nachweis.every(n => /,/.test(n.t)) && /Ohne Foto/.test(await p.$eval('#qi-inhalt', e => e.textContent)), nachweis.length);
  await p.close();

  // ---------- 5. Mobil ----------
  for (const w of [320, 390, 768]) {
    const q = await neu(w, '#entdecken');
    await q.evaluate(() => document.querySelectorAll('#ent-liste img').forEach(i => i.loading = 'eager')); await q.waitForTimeout(1500);
    const r = await q.evaluate(() => { const cw = document.documentElement.clientWidth; const imgs = [...document.querySelectorAll('#ent-liste img')]; return { seite: document.documentElement.scrollWidth > cw, n: imgs.length, kaputt: imgs.filter(i => !(i.complete && i.naturalWidth > 0)).length, raus: imgs.filter(i => { const b = i.getBoundingClientRect(); return b.right > cw + 1 || b.left < -1; }).length, verhaeltnis: imgs.every(i => { const b = i.getBoundingClientRect(); return b.height === 0 || Math.abs(b.width / b.height - 4 / 3) < 0.03; }) }; });
    check(`Mobil ${w} px (Entdecken): ${r.n} Bilder, alle geladen, 4:3, kein seitliches Scrollen`, !r.seite && r.n === 50 && r.kaputt === 0 && r.raus === 0 && r.verhaeltnis, r);
    await q.close();
  }
  check('Keine fehlgeschlagenen Anfragen und keine Konsolenfehler im gesamten Lauf', gescheitert.filter(u => !/gibt-es(-auch)?-nicht|fonts\.g/.test(u)).length === 0 && errors.length === 0, [gescheitert, errors]);

  await b.close();
  console.log(fails ? '\n' + fails + ' FEHLER' : '\nAlle Prüfungen bestanden');
  process.exit(fails ? 1 : 0);
})();
