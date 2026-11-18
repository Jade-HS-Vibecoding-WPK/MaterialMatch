/* MaterialMatch 3.0, Block 1: Marke (Logo, Favicon), Kopfbereich mit zwei Hauptaktionen, vierter Reiter, ruhigeres Bento
   Aufruf:  node tests/test45.js */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');
const fs = require('fs');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 600))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html?modus=demo';
const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };

(async () => {
  // ---------- Logo-Dateien (ohne Browser prüfbar)
  const dateien = { 'img/logo.svg': 250, 'img/logo-kompakt.svg': 48, 'img/favicon.svg': 48 };
  for (const [f, w] of Object.entries(dateien)) {
    const t = fs.readFileSync(path.join(PROJ, f), 'utf8');
    const pol = [...t.matchAll(/<polygon[^>]*fill="(#[0-9a-fA-F]{6})"/g)].map(m => m[1]);
    const grau = pol.map(lum);
    check(`${f}: gültiges SVG mit viewBox, drei Schichten (Polygone) in drei deutlich verschiedenen Helligkeiten (auch in Schwarz-Weiß unterscheidbar)`, /^<svg[^>]*xmlns="http:\/\/www.w3.org\/2000\/svg"[^>]*viewBox="0 0 \d+ 48"/.test(t) && new RegExp('viewBox="0 0 ' + w + ' 48"').test(t) && pol.length === 3 && new Set(pol).size === 3 && Math.abs(grau[0] - grau[1]) > .12 && Math.abs(grau[1] - grau[2]) > .12 && Math.abs(grau[0] - grau[2]) > .3, { pol, grau });
    check(`${f}: keine externen Verweise (nur lokal), keine Bewertungsfarben (Grün, Gelb, Orange, Rot)`, !/https?:\/\/(?!www\.w3\.org)/.test(t) && !/#(17643a|78b85a|e9c94e|e68b43|951f2b)/i.test(t) && fs.statSync(path.join(PROJ, f)).size < 2500, fs.statSync(path.join(PROJ, f)).size);
  }
  const html = fs.readFileSync(path.join(PROJ, 'index.html'), 'utf8');
  check('Favicon: <link rel="icon" type="image/svg+xml"> zeigt auf eine vorhandene lokale Datei', (() => { const m = /<link rel="icon" type="image\/svg\+xml" href="([^"]+)"/.exec(html); return !!m && fs.existsSync(path.join(PROJ, m[1])) && m[1] === 'img/favicon.svg'; })());

  const b = await chromium.launch();
  const errors = [];
  const neu = async (breite = 1280, url = URL) => { const p = await b.newPage({ viewport: { width: breite, height: 900 } }); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); await p.goto(url); await p.waitForTimeout(250); return p; };

  let p = await neu(1280);
  check('Die drei Logo-Dateien lassen sich als Bild laden (Breite > 0)', await p.evaluate(async () => { const r = []; for (const f of ['img/logo.svg', 'img/logo-kompakt.svg', 'img/favicon.svg']) r.push(await new Promise(res => { const i = new Image(); i.onload = () => res(i.naturalWidth > 0); i.onerror = () => res(false); i.src = f; })); return r.every(Boolean); }));

  // ---------- Kopfbereich
  const kopf = await p.evaluate(() => { const h = document.querySelector('.site-header'); const r = h.getBoundingClientRect(); const m = document.querySelector('.site-header h1 .marke'); const sym = document.getElementById('i-marke'); return { h1: document.querySelectorAll('h1').length, h1Text: h.querySelector('h1').textContent, tag: h.querySelector('.tagline').textContent, untertitel: h.querySelector('.untertitel').textContent, hoehe: Math.round(r.height), marke: m && Math.round(m.getBoundingClientRect().width), symbol: !!sym && sym.querySelectorAll('polygon').length, knoepfe: [...h.querySelectorAll('.kopf-knopf')].map(k => k.textContent.trim()) }; });
  check('Kopf: genau eine Seitenüberschrift „MaterialMatch“ mit Logo-Marke (Symbol mit drei Schichten, mindestens 28 px), Leitsatz und Untertitel im Wortlaut des Auftrags', kopf.h1 === 1 && kopf.h1Text === 'MaterialMatch' && kopf.marke >= 28 && kopf.symbol === 3 && kopf.tag === 'Der richtige Baustoff. Für deine Idee.' && kopf.untertitel === 'Vergleiche Materialien, entdecke nachhaltige Alternativen und finde dein persönliches Match.', kopf);
  check('Kopf: drei Hauptaktionen „Baustoffe entdecken“, „Baustoffe vergleichen“ und „Match finden“, der Kopf bleibt niedrig (unter 190 px)', JSON.stringify(kopf.knoepfe) === '["Baustoffe entdecken","Baustoffe vergleichen","Match finden"]' && kopf.hoehe < 190, kopf);

  // ---------- Hauptaktionen funktionieren (Maus und Tastatur), Eingaben bleiben erhalten
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: '' })); await p.fill('#flaeche', '123'); await p.fill('#dicke', '17');
  await p.click('#reiter-quellen');
  await p.click('#kopf-match');
  const m1 = await p.evaluate(() => ({ aktiv: MM.reiter.aktiv(), sichtbar: !document.getElementById('bereich-match').hidden, fokus: document.activeElement.id, hash: location.hash, titel: document.getElementById('match-titel').getBoundingClientRect().top }));
  check('„Match finden“ (Klick): Reiter „Match finden“ ist aktiv und sichtbar, Fokus im Bereich, Anfang des Bereichs im Bild, Adresse #match', m1.aktiv === 'match' && m1.sichtbar && m1.fokus === 'bereich-match' && m1.hash === '#match' && m1.titel > 0 && m1.titel < 700, m1);
  await p.click('#kopf-vergleichen');
  const v1 = await p.evaluate(() => ({ aktiv: MM.reiter.aktiv(), sichtbar: !document.getElementById('bereich-vergleich').hidden, fokus: document.activeElement.id, auswahlTop: Math.round(document.getElementById('auswahl').getBoundingClientRect().top), flaeche: document.getElementById('flaeche').value, dicke: document.getElementById('dicke').value, material: MM.auswahl.holeAuswahl().plaetze.map(x => x.material.id).join() }));
  check('„Baustoffe vergleichen“ (Klick): Reiter „Vergleich“ aktiv, Materialauswahl im Bild; die vorher gemachten Eingaben (123 m², 17 cm) und die Materialien sind unverändert', v1.aktiv === 'vergleich' && v1.sichtbar && v1.fokus === 'bereich-vergleich' && v1.auswahlTop >= 0 && v1.auswahlTop < 400 && v1.flaeche === '123' && v1.dicke === '17' && v1.material === 'mineralwolle,eps', v1);
  await p.click('#reiter-alternativen'); await p.focus('#kopf-match'); await p.keyboard.press('Enter');
  check('„Match finden“ (Tastatur: Enter auf dem fokussierten Link) wechselt ebenfalls in den Bereich', await p.evaluate(() => MM.reiter.aktiv() === 'match'));
  check('Ohne JavaScript bleiben es echte Links (#vergleich, #match); ein Wechsel über die Adresse funktioniert', await p.evaluate(() => document.getElementById('kopf-vergleichen').getAttribute('href') === '#vergleich' && document.getElementById('kopf-match').getAttribute('href') === '#match') && await (async () => { const q = await neu(1280, URL + '#match'); return q.evaluate(() => MM.reiter.aktiv() === 'match'); })());
  check('Navigation: fünf Reiter in der Reihenfolge Entdecken, Vergleich, Match finden, Alternativen, Quellen & Details; der Reiter „Match finden“ hat eine Überschrift der Ebene 2', JSON.stringify(await p.$$eval('[role=tablist] [role=tab]', t => t.map(x => x.textContent.trim()))) === '["Entdecken","Vergleich","Match finden","Alternativen","Quellen & Details"]' && await p.$eval('#bereich-match h2', e => e.textContent.trim()) === 'Match finden');

  // ---------- ruhiges Bento: Rundung 20–24 px, sehr dezente Schatten, Pastell nur Hellblau und Hellviolett
  await p.click('#reiter-vergleich');
  const bento = await p.evaluate(() => { const ks = [...document.querySelectorAll('.kachel, .kopf')].filter(k => k.getBoundingClientRect().width > 0); return ks.map(k => { const c = getComputedStyle(k); const a = /rgba?\([^)]*,\s*([\d.]+)\)\s*$/.exec(c.boxShadow); return { id: k.id || k.className.slice(0, 20), r: parseFloat(c.borderTopLeftRadius), bg: c.backgroundColor, schatten: c.boxShadow }; }); });
  check('Alle sichtbaren Kacheln: Rundung 20–24 px, Hintergrund nur Weiß, Hellblau #E7F0FA oder Hellviolett #EEE9FA', bento.length >= 6 && bento.every(k => k.r >= 20 && k.r <= 24 && ['rgb(255, 255, 255)', 'rgb(231, 240, 250)', 'rgb(238, 233, 250)'].includes(k.bg)), bento);
  const schatten = await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--schatten'));
  check('Schatten sehr dezent: Deckkraft höchstens 5 %', [...schatten.matchAll(/rgba\([^)]*,\s*([\d.]+)\)/g)].every(m => parseFloat(m[1]) <= .05), schatten);
  await p.close();

  // ---------- Responsiv: Kopf in allen Breiten, Aktionen gut bedienbar
  const probleme = [];
  for (const w of [320, 375, 430, 768, 820, 1024, 1280, 1920]) {
    const q = await neu(w);
    const r = await q.evaluate(() => { const cw = document.documentElement.clientWidth; const k = [...document.querySelectorAll('.kopf-knopf')].map(x => x.getBoundingClientRect()); const t = [...document.querySelectorAll('[role=tab]')].map(x => x.getBoundingClientRect()); const kopf = document.querySelector('.kopf').getBoundingClientRect(); return { seite: document.documentElement.scrollWidth > cw, knopfKlein: k.some(x => x.height < 44), knopfRaus: k.some(x => x.right > cw || x.left < 0), tabRaus: t.some(x => x.right > cw + 1 || x.left < -1), tabKlein: t.some(x => x.height < 36), kopfH: Math.round(kopf.height) }; });
    if (r.seite || r.knopfKlein || r.knopfRaus || r.tabRaus || r.tabKlein) probleme.push([w, r]);
    if (w >= 768 && r.kopfH > (w >= 1024 ? 190 : 215)) probleme.push([w, 'Kopf zu hoch', r.kopfH]);
    await q.close();
  }
  check('Kopf und Reiter bei 320, 375, 430, 768, 820, 1024, 1280 und 1920 px: kein seitliches Scrollen, Aktionen mindestens 44 px hoch, alle fünf Reiter im Fenster; ab Laptop unter 190 px, am Tablet unter 215 px hoch', probleme.length === 0, probleme);
  const ph = await neu(375);
  check('Handy 375 px: die drei Aktionen stehen nebeneinander (Symbol über der Beschriftung) und füllen zusammen die Kachelbreite; der Kopf bleibt niedrig', await ph.evaluate(() => { const k = [...document.querySelectorAll('.kopf-knopf')].map(x => x.getBoundingClientRect()); const kopf = document.querySelector('.kopf').getBoundingClientRect(); return k.length === 3 && Math.abs(k[0].top - k[1].top) < 2 && Math.abs(k[1].top - k[2].top) < 2 && k[2].right - k[0].left > kopf.width * .85 && k.every(x => x.height >= 44) && kopf.height < 230; }));
  await ph.close();

  // ---------- Druck
  const d = await neu(1280); await d.emulateMedia({ media: 'print' });
  check('Druck: Aktionen, Untertitel und der Match-Bereich werden nicht gedruckt; Logo und Titel bleiben', await d.evaluate(() => ['.kopf-aktionen', '.site-header .untertitel', '#bereich-match'].every(s => getComputedStyle(document.querySelector(s)).display === 'none') && getComputedStyle(document.querySelector('.site-header h1')).display !== 'none'));
  await d.close();

  check('Keine Konsolenfehler oder -warnungen', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
