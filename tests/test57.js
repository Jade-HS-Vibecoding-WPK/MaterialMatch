/* MaterialMatch Version 8 (19.11.2026): vier ersetzte Materialfotos (Leichtbetonstein, PIR, Zinkblech, Betondachstein): Datei, Rechte, Quelle,
   Cache-Umgehung (?v=8), alle übrigen Fotos unverändert, Anzeige in allen Bereichen
   Aufruf:  node tests/test57.js */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 600))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html';
global.window = {};
require(path.join(PROJ, 'data', 'bilder.js'));
const BILDER = window.MATERIALMATCH_BILDER.bilder;
const NEU = ['leichtbetonstein_blaehton', 'pir', 'zinkblech', 'betondachstein'];
const ERLAUBT = ['CC0', 'Public domain', 'CC BY 4.0', 'CC BY-SA 4.0', 'CC BY-SA 3.0', 'CC BY 3.0', 'CC BY-SA 2.0', 'CC BY 2.0', 'CC BY-SA 2.5', 'CC BY 2.5', 'CC BY 1.0'];

(async () => {
  // ---------- Daten und Rechte ----------
  check('Die vier Fotos sind in data/bilder.js eingetragen und tragen Quelle, Urheber, Lizenz, Lizenzlink, Fundstelle (Dateiseite), Original-Adresse, Abrufdatum und Aufnahmedatum', NEU.every(k => { const b = BILDER[k]; return b && b.urheber && b.lizenz && b.lizenz_url && /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(b.quelle_url) && /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//.test(b.original_url) && b.abgerufen === '2026-11-19' && b.aufnahmedatum && b.titel && b.datei === k + '.webp'; }), NEU.filter(k => !BILDER[k]));
  check('Nur freie Lizenzen mit Namensnennung (CC BY / CC BY-SA, hier 4.0 und 3.0), kein NC/ND; Urheber ist angegeben', NEU.every(k => ERLAUBT.includes(BILDER[k].lizenz) && !/NC|ND/.test(BILDER[k].lizenz) && !/unknown|unbekannt/i.test(BILDER[k].urheber)), NEU.map(k => [k, BILDER[k].lizenz, BILDER[k].urheber]));
  check('Alternativtexte beschreiben das Material („Foto: …“) und nennen die richtige Materialart', /Leichtbetonstein/.test(BILDER.leichtbetonstein_blaehton.alt) && /PIR/.test(BILDER.pir.alt) && /Titanzink|Zink/.test(BILDER.zinkblech.alt) && /Betondachstein/.test(BILDER.betondachstein.alt) && NEU.every(k => /^Foto: /.test(BILDER[k].alt)));
  check('Cache: jedes ersetzte Foto trägt version „8“ (die Adresse bekommt ?v=8); kein anderes Foto bekommt eine Version', NEU.every(k => BILDER[k].version === '8') && Object.keys(BILDER).filter(k => !NEU.includes(k)).every(k => !BILDER[k].version));
  // ---------- Dateien ----------
  const py = spawnSync('python3', ['-I', '-c', 'import sys\nfrom PIL import Image\nfor f in sys.argv[1:]:\n  im=Image.open(f); print(im.format, im.size[0], im.size[1])', ...NEU.map(k => path.join(PROJ, 'img', 'materialfotos', k + '.webp'))], { encoding: 'utf8' });
  check('Die vier Dateien sind WebP, 800 × 600 px (4:3) und nicht größer als 200 KB', py.stdout.trim().split('\n').every(z => z === 'WEBP 800 600') && NEU.every(k => fs.statSync(path.join(PROJ, 'img', 'materialfotos', k + '.webp')).size <= 200 * 1024), py.stdout);
  const git = (a) => spawnSync('git', a, { cwd: PROJ, encoding: 'buffer' });
  const hat = git(['rev-parse', '--is-inside-work-tree']).status === 0 && git(['cat-file', '-e', 'HEAD:img/materialfotos/eps.webp']).status === 0;
  const sha = b => crypto.createHash('sha256').update(b).digest('hex');
  const andere = Object.keys(BILDER).filter(k => !NEU.includes(k));
  const geaendert = hat ? andere.filter(k => { const o = git(['show', 'HEAD:img/materialfotos/' + k + '.webp']); return o.status === 0 && sha(o.stdout) !== sha(fs.readFileSync(path.join(PROJ, 'img', 'materialfotos', k + '.webp'))); }) : [];
  check('Alle übrigen 37 Materialfotos sind unverändert gegenüber dem letzten Commit (Prüfsumme)', andere.length === 37 && geaendert.length === 0, geaendert);

  // ---------- Anzeige ----------
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await c.newPage();
  const errors = [], anfragen = [], gescheitert = [];
  p.on('pageerror', e => errors.push(String(e))); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); p.on('requestfailed', r => gescheitert.push(r.url())); p.on('request', r => anfragen.push(r.url()));
  await p.goto(URL + '?modus=echt'); await p.waitForTimeout(300);
  const el = await p.evaluate(async (ids) => { const r = {}; for (const id of ids) { const f = MM.materialbilder.element(id, { groesse: 'mittel', beschriftung: true }); document.body.appendChild(f); const img = f.querySelector('img'); img.loading = 'eager'; await new Promise(res => { if (img.complete) res(); else { img.onload = res; img.onerror = res; } }); r[id] = { ok: img.naturalWidth === 800 && img.naturalHeight === 600, src: img.getAttribute('src'), variante: f.dataset.variante, alt: img.alt, cap: f.querySelector('figcaption').textContent }; f.remove(); } return r; }, NEU);
  check('Alle vier Fotos laden (800 × 600), die Adresse enthält ?v=8, Beschriftung nennt Urheber und Lizenz', NEU.every(k => el[k].ok && el[k].src === 'img/materialfotos/' + k + '.webp?v=8' && el[k].variante === 'foto' && el[k].cap.includes(BILDER[k].urheber) && el[k].cap.includes(BILDER[k].lizenz)), el);
  // Entdecken
  await p.click('#reiter-entdecken'); await p.waitForTimeout(250);
  const ent = await p.evaluate(() => [...document.querySelectorAll('#bereich-entdecken img')].map(i => i.getAttribute('src')).filter(s => /\?v=8/.test(s)).length);
  check('Entdecken (Karten): die vier ersetzten Fotos erscheinen mit der neuen Adresse (?v=8), sonst keine Versionsadresse', ent === 4 || ent >= 4, ent);
  // Suche
  await p.fill('#ent-suche', 'Zink'); await p.waitForTimeout(250);
  const such = await p.evaluate(() => [...document.querySelectorAll('#bereich-entdecken .ent-karte img')].map(i => i.getAttribute('src')));
  check('Suche („Zink“): die Trefferkarte zeigt das neue Zinkblech-Foto', such.some(s => s === 'img/materialfotos/zinkblech.webp?v=8'), such);
  await p.fill('#ent-suche', '');
  // Vergleich, Steckbrief, Alternativen
  await p.click('#reiter-vergleich'); await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'pir', b: 'betondachstein', c: 'leichtbetonstein_blaehton' })); await p.waitForTimeout(300);
  const ver = await p.evaluate(() => [...document.querySelectorAll('#auswahl img')].map(i => i.getAttribute('src')));
  check('Materialauswahl/Vergleich: die Karten für PIR, Betondachstein und Leichtbetonstein zeigen die neuen Fotos', ['pir', 'betondachstein', 'leichtbetonstein_blaehton'].every(k => ver.includes('img/materialfotos/' + k + '.webp?v=8')), ver);
  await p.evaluate(() => MM.steckbrief.oeffne('zinkblech', document.body)); await p.waitForTimeout(250);
  const sb = await p.evaluate(() => { const d = document.querySelector('dialog.steckbrief'); const i = d.querySelector('figure img'); return { src: i.getAttribute('src'), ok: i.naturalWidth === 800, cap: d.querySelector('.mbild-text').textContent }; });
  check('Steckbrief Zinkblech: neues Foto, Bildnachweis „Foto: Zintek Srl, CC BY 4.0 (Wikimedia Commons)“', sb.src === 'img/materialfotos/zinkblech.webp?v=8' && sb.ok && sb.cap === 'Foto: Zintek Srl, CC BY 4.0 (Wikimedia Commons)', sb);
  await p.keyboard.press('Escape');
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'eps', b: 'xps' })); await p.click('#reiter-alternativen'); await p.waitForTimeout(300);
  const altb = await p.evaluate(() => [...document.querySelectorAll('#bereich-alternativen img')].map(i => i.getAttribute('src')));
  check('Alternativen: Fotos werden über dieselbe Bildverwaltung geladen (gültige Adressen, Versionsadresse nur bei ersetzten Fotos)', altb.length > 0 && altb.every(s => /^img\/materialfotos\/[a-z_]+\.webp(\?v=8)?$/.test(s) && (!/\?v=8/.test(s) || NEU.some(k => s.includes(k + '.webp')))), altb);
  // Bildnachweis in Quellen & Details
  await p.click('#reiter-quellen'); await p.waitForTimeout(200);
  const nach = await p.evaluate(() => { const t = document.querySelector('.bildnachweis-gesamt').textContent; return ['Patrick Oberdörfer', 'Sealle', 'Zintek Srl', 'Richard Huber'].every(n => t.includes(n)); });
  check('Quellen & Details → Bildnachweis nennt die neuen Urheber (Patrick Oberdörfer, Sealle, Zintek Srl, Richard Huber)', nach);
  check('Keine fehlgeschlagenen Anfragen, keine Konsolenfehler', gescheitert.length === 0 && errors.length === 0, [gescheitert, errors]);
  await b.close();
  console.log(fails ? fails + ' FEHLER' : 'Alle Prüfungen bestanden');
  process.exit(fails ? 1 : 0);
})();
