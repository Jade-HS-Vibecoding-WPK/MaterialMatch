/* MaterialMatch 3.0, Block 2: Materialillustrationen (SVG-Schraffuren), Einordnung der Baustoffe, Steckbrief
   Aufruf:  node tests/test46.js */
const { chromium } = require('playwright');
require('./_offline.js');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let fails = 0;
function check(name, cond, extra) { if (!cond) fails++; console.log((cond ? 'OK   ' : 'FAIL ') + name + (cond || extra === undefined ? '' : ' -> ' + JSON.stringify(extra).slice(0, 600))); }

const PROJ = path.resolve(__dirname, '..');
const URL = 'file://' + PROJ + '/index.html';

// Datenbank und Einordnung ohne Browser laden
global.window = {};
require(PROJ + '/data/baustoffe.js');
require(PROJ + '/data/materialprofil.js');
const DB = window.MATERIALMATCH_DATA;
const PROFIL = window.MATERIALMATCH_PROFIL;
const IDS = DB.baustoffe.map(b => b.id);

(async () => {
  // ---------- Schraffur-Dateien
  const dir = path.join(PROJ, 'img', 'schraffuren');
  const fehlend = IDS.filter(i => !fs.existsSync(path.join(dir, i + '.svg')));
  check('Zu jedem der 50 Baustoffe gibt es eine eigene Schraffur (img/schraffuren/<Kennung>.svg) und es gibt einen neutralen Platzhalter', IDS.length === 50 && fehlend.length === 0 && fs.existsSync(path.join(dir, 'platzhalter.svg')), fehlend);
  const dateien = IDS.concat(['platzhalter']);
  const texte = dateien.map(i => fs.readFileSync(path.join(dir, i + '.svg'), 'utf8'));
  const formatOk = texte.every(t => /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 160 120" width="160" height="120"/.test(t) && /<title id="t">(?:Schematische Schraffur|Keine belegte Schraffur)[^<]*<\/title>/.test(t));
  check('Alle Schraffuren haben dasselbe Format (viewBox 160 × 120, also 4:3) und einen Titel („Schematische Schraffur: …“ bzw. „Keine belegte Schraffur: …“)', formatOk);
  const groessen = texte.map(t => Buffer.byteLength(t));
  check('Dateigrößen: jede Datei unter 25 KB, alle zusammen unter 400 KB (schnell geladen, offline gespeichert)', Math.max(...groessen) < 25000 && groessen.reduce((a, b) => a + b, 0) < 400000, { max: Math.max(...groessen), summe: groessen.reduce((a, b) => a + b, 0) });
  check('Die Schraffuren sind lokal und sicher: keine externen Adressen, keine Skripte, keine eingebetteten Bilder, keine Schriften', texte.every(t => !/https?:\/\/(?!www\.w3\.org)/.test(t) && !/<script|<image|<foreignObject|<text|onload=|data:/i.test(t)));
  const farben = new Set(); texte.forEach(t => (t.match(/#[0-9a-fA-F]{6}\b/g) || []).forEach(c => farben.add(c.toLowerCase())));
  const istGrau = c => { const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b2 = parseInt(c.slice(5, 7), 16); return Math.max(r, g, b2) - Math.min(r, g, b2) <= 12; };
  check('Schraffuren ausschließlich in Schwarz, Weiß und neutralen Graustufen (MaterialMatch 3.1): keine einzige farbige Linie oder Fläche, höchstens 6 verschiedene Töne', [...farben].every(istGrau) && farben.size <= 6, [...farben]);
  const hintergruende = new Set(texte.map(t => (/<rect width="160" height="120" fill="(#[0-9a-f]{6})"/.exec(t) || [])[1]));
  check('Einheitlich sehr heller, nahezu weißer Hintergrund (#FAFAFA) in allen 51 Zeichnungen; Linien in Dunkelgrau (Platzhalter in hellerem Grau)', hintergruende.size === 1 && [...hintergruende][0] === '#fafafa' && texte.slice(0, 50).every(t => /stroke="#2b2f33"/.test(t) || /Keine belegte Schraffur/.test(t)), [...hintergruende]);
  check('Keine Verläufe, Schatten, Filter oder Farbeffekte in den Schraffuren', texte.every(t => !/gradient|<filter|feGaussian|drop-shadow|box-shadow/i.test(t)));
  check('Die Beschriftung nennt sie „Technische Schraffur (schematisch)“ und nirgends „DIN“ oder „normgerecht“', texte.every(t => !/DIN|normgerecht/i.test(t)) && fs.readFileSync(path.join(PROJ, 'js', 'materialbilder.js'), 'utf8').includes('Technische Schraffur (schematisch)'));
  const strich = new Set(); texte.forEach(t => (t.replace(/<path d="[^"]*h\.01[^"]*"[^>]*\/>/g, '').match(/stroke-width="([\d.]+)"/g) || []).forEach(s => { const v = s.replace(/\D*([\d.]+)\D*/, '$1'); if (parseFloat(v) > 0) strich.add(v); }));
  check('Einheitliche Strichstärken: alle Zeichnungen nutzen dieselbe kleine Auswahl an Linienstärken (höchstens 12 verschiedene, drei Normstärken 1,1 / 1,4 / 2 plus Sonderfälle; Punkte sind ausgenommen)', [...strich].every(s => ['1', '1.1', '1.4', '3.4'].includes(s)) && strich.size <= 4, [...strich]);
  const hashes = new Set(texte.map(t => crypto.createHash('sha1').update(t).digest('hex')));
  check('Jede Schraffur ist eine eigene Zeichnung (51 verschiedene Dateien)', hashes.size === 51, hashes.size);
  const erzeugt = require('child_process').spawnSync('python3', [path.join(PROJ, 'tools', 'erzeuge_schraffuren.py')], { encoding: 'utf8', cwd: PROJ });
  const nachher = dateien.map(i => fs.readFileSync(path.join(dir, i + '.svg'), 'utf8'));
  check('Reproduzierbar: das Erzeugungsprogramm tools/erzeuge_schraffuren.py liefert genau dieselben 51 Dateien', erzeugt.status === 0 && nachher.every((t, i) => t === texte[i]), erzeugt.stderr);

  // ---------- Einordnung durch das Projekt
  const profilIds = Object.keys(PROFIL.materialien);
  check('Einordnung (data/materialprofil.js): genau die 50 Baustoffe der Datenbank, nichts fehlt, nichts zu viel', profilIds.length === 50 && IDS.every(i => PROFIL.materialien[i]) && profilIds.every(i => IDS.includes(i)));
  const klassen = Object.keys(PROFIL.meta.klassen);
  check('Vier Klassen mit Name und ausführlichem Zuordnungskriterium; als „Einordnung durch das Projekt“ gekennzeichnet, mit Hinweis, dass es kein Messwert ist', JSON.stringify(klassen.sort()) === '["konventionell","mineralisch","nachwachsend","natuerlich"]' && klassen.every(k => PROFIL.meta.klassen[k].name && PROFIL.meta.klassen[k].kriterium.length > 80) && PROFIL.meta.titel === 'Einordnung durch das Projekt' && /kein Messwert/.test(PROFIL.meta.hinweis));
  const m = PROFIL.materialien;
  check('Jedes Material hat mindestens eine gültige Klasse (Mehrfachzuordnung erlaubt, keine Doppelungen) und eine Begründung', IDS.every(i => m[i].klassen.length >= 1 && new Set(m[i].klassen).size === m[i].klassen.length && m[i].klassen.every(k => klassen.includes(k)) && m[i].begruendung.length > 20));
  const fachlich = [
    ['normalbeton', ['mineralisch', 'konventionell']], ['stahlbeton', ['mineralisch', 'konventionell']], ['massivholz_nadel', ['nachwachsend', 'natuerlich']], ['konstruktionsvollholz', ['nachwachsend', 'natuerlich']],
    ['brettsperrholz', ['nachwachsend']], ['osb', ['nachwachsend']], ['eps', ['konventionell']], ['baustahl', ['konventionell']], ['mineralwolle', ['mineralisch', 'konventionell']],
    ['naturstein_hart', ['mineralisch', 'natuerlich']], ['kork', ['nachwachsend', 'natuerlich']], ['hanfdaemmung', ['nachwachsend', 'natuerlich']], ['zellulose', ['nachwachsend']], ['schaumglas', ['mineralisch']]
  ];
  check('Fachliche Stichproben der Einordnung stimmen (Beton mineralisch und konventionell, Holz nachwachsend und natürlich, verklebte Holzwerkstoffe nur nachwachsend, Kunststoffe und Metalle nur konventionell, …)', fachlich.every(([i, k]) => JSON.stringify([...m[i].klassen].sort()) === JSON.stringify([...k].sort())), fachlich.filter(([i, k]) => JSON.stringify([...m[i].klassen].sort()) !== JSON.stringify([...k].sort())));
  check('Widerspruchsfrei: nichts ist zugleich nachwachsend und konventionell; „natürlich“ nur bei nachwachsenden oder mineralischen Naturstoffen; Metalle und Kunststoffe sind weder mineralisch noch natürlich', IDS.every(i => !(m[i].klassen.includes('nachwachsend') && m[i].klassen.includes('konventionell')) && (!m[i].klassen.includes('natuerlich') || m[i].klassen.includes('nachwachsend') || m[i].klassen.includes('mineralisch'))) && ['baustahl', 'aluminium', 'stahlblech', 'zinkblech', 'eps', 'xps', 'pur', 'pir', 'bitumenbahn', 'epdm'].every(i => !m[i].klassen.includes('mineralisch') && !m[i].klassen.includes('natuerlich')));

  const b = await chromium.launch();
  const errors = [];
  const anfragen = [];
  const neu = async (breite = 1280, modus = 'demo') => { const p = await b.newPage({ viewport: { width: breite, height: 900 } }); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); }); p.on('pageerror', e => errors.push(String(e))); p.on('request', r => anfragen.push(r.url())); await p.goto(URL + '?modus=' + modus); await p.waitForTimeout(250); return p; };

  let p = await neu(1280);
  const lade = await p.evaluate(async ids => { const r = {}; for (const i of ids.concat(['platzhalter'])) r[i] = await new Promise(res => { const x = new Image(); x.onload = () => res(x.naturalWidth === 160 && x.naturalHeight === 120); x.onerror = () => res(false); x.src = 'img/schraffuren/' + i + '.svg'; }); return Object.entries(r).filter(([, v]) => !v).map(([k]) => k); }, IDS);
  check('Alle 51 Schraffuren lassen sich im Browser laden und haben die Größe 160 × 120', lade.length === 0, lade);

  // ---------- Materialbilder-Baustein
  const mb = await p.evaluate(() => { const f = MM.materialbilder.element('eps', { groesse: 'mittel', beschriftung: true, variante: 'schraffur' }); const g = MM.materialbilder.element('gibt-es-nicht', { groesse: 'klein' }); const i = f.querySelector('img'), j = g.querySelector('img'); return { alt: i.alt, lazy: i.loading, w: i.width, h: i.height, src: i.getAttribute('src'), cap: f.querySelector('figcaption').textContent, klasse: f.className, platzhalterSrc: j.getAttribute('src'), platzhalterKlasse: g.className, platzhalterAlt: j.alt, drag: i.getAttribute('draggable') }; });
  check('Bildbaustein (Variante Schraffur): Alternativtext „Technische Schraffur (schematisch): …“, Lazy Loading, feste Größe (4:3), Beschriftung „Schraffur: Dämmstoff, schematisch“ (die Fotos prüft test53)', /^Technische Schraffur \(schematisch\): EPS.* – Dämmstoff$/.test(mb.alt) && mb.lazy === 'lazy' && mb.w === 160 && mb.h === 120 && mb.src === 'img/schraffuren/eps.svg' && mb.cap === 'Schraffur: Dämmstoff, schematisch' && /mbild-mittel/.test(mb.klasse), mb);
  check('Material ohne Zeichnung: einheitlicher neutraler Platzhalter (platzhalter.svg) mit passendem Alternativtext', mb.platzhalterSrc === 'img/schraffuren/platzhalter.svg' && /mbild-platzhalter/.test(mb.platzhalterKlasse) && /nicht vorhanden/.test(mb.platzhalterAlt), mb);
  const fehlerVorher = errors.length;   // der absichtlich fehlende Dateiname unten erzeugt genau eine erwartete Browsermeldung
  const ersatz = await p.evaluate(async () => { const f = MM.materialbilder.element('eps', { groesse: 'klein', variante: 'schraffur' }); document.body.appendChild(f); const img = f.querySelector('img'); img.src = 'img/schraffuren/kaputt-gibt-es-nicht.svg'; await new Promise(r => setTimeout(r, 400)); return { src: img.getAttribute('src'), klasse: f.className }; });
  while (errors.length > fehlerVorher && /Failed to load resource/.test(errors[errors.length - 1]) && errors.length - fehlerVorher <= 1) errors.pop();
  check('Fehlt eine Bilddatei, springt das Bild selbstständig auf den Platzhalter (kein kaputtes Bildsymbol)', ersatz.src === 'img/schraffuren/platzhalter.svg' && /mbild-platzhalter/.test(ersatz.klasse), ersatz);

  // ---------- Integration: Auswahl, Suche, Alternativen
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'brettsperrholz', c: '' })); await p.waitForTimeout(150);
  const karten = await p.$$eval('#auswahl-karten .card', c => c.map(x => ({ id: x.querySelector('.mbild') && x.querySelector('.mbild').dataset.material, alt: x.querySelector('.mbild img').alt, sb: !!x.querySelector('.steckbrief-knopf'), breite: Math.round(x.querySelector('.mbild').getBoundingClientRect().width) })));
  check('Materialauswahl: jede Materialkarte zeigt das passende Materialfoto (klein; seit 3.6 statt der Schraffur) und einen Knopf „Steckbrief“', karten.length === 2 && karten[0].id === 'mineralwolle' && karten[1].id === 'brettsperrholz' && karten.every(k => /^Foto: /.test(k.alt) && k.sb && k.breite >= 40 && k.breite <= 70), karten);
  await p.fill('#suche', 'holz'); await p.waitForTimeout(100);
  const treffer = await p.$$eval('#suche-liste [role=option]', o => o.map(x => ({ bild: !!x.querySelector('.mbild img'), titel: x.querySelector('.suche-titel').textContent })));
  check('Suche: jeder Treffer trägt die Illustration des Materials (kleine Vorschau), Auswahl per Klick funktioniert weiter', treffer.length >= 2 && treffer.every(t => t.bild) && await (async () => { await p.click('#suche-liste [role=option]'); return (await p.evaluate(() => MM.auswahl.holeAuswahl().plaetze.length)) >= 2; })(), treffer);
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'mineralwolle', b: 'eps', c: '' })); await p.click('#reiter-alternativen'); await p.waitForTimeout(150);
  const alt = await p.$$eval('#alternativen-inhalt .rec-card', c => c.map(x => ({ bild: !!x.querySelector('.card-head .mbild img'), sb: !!x.querySelector('.steckbrief-knopf'), mat: x.dataset.material, bildMat: x.querySelector('.mbild') && x.querySelector('.mbild').dataset.material })));
  check('Alternativempfehlungen: jede Empfehlungskarte zeigt ihr Material als Illustration und hat einen Steckbrief-Knopf (Empfehlungslogik unverändert: weiter drei Karten)', alt.length === 3 && alt.every(a => a.bild && a.sb && a.mat === a.bildMat), alt);
  await p.click('#reiter-vergleich');

  // ---------- Steckbrief
  await p.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'brettsperrholz', b: 'eps', c: '' })); await p.waitForTimeout(150);
  await p.click('[data-steckbrief="brettsperrholz"]'); await p.waitForTimeout(150);
  const sb = await p.evaluate(() => { const d = document.querySelector('dialog.steckbrief'); const k = d.querySelector('.steckbrief-karte'); return { offen: d.open, labelledby: d.getAttribute('aria-labelledby'), titelId: d.querySelector('h3').id, name: d.querySelector('.sb-name').textContent, kat: d.querySelector('.sb-kategorie').textContent, einsatz: d.querySelector('.sb-einsatz').textContent, chips: [...d.querySelectorAll('.sb-chip')].map(c => c.textContent), chipHinweis: d.querySelector('.sb-chip-hinweis').textContent, kennwerte: [...d.querySelectorAll('.sb-kennwert')].map(x => x.dataset.kennwert), vor: d.querySelectorAll('.sb-vorteile li').length, nach: d.querySelectorAll('.sb-nachteile li').length, bild: !!d.querySelector('.mbild-gross img'), cap: d.querySelector('.mbild-text').textContent, mehrOffen: d.querySelector('.sb-mehr').open, fokus: document.activeElement.className, quellenInfo: d.querySelector('.sb-fuss').textContent }; });
  check('Steckbrief (Dialog): öffnet modal mit Titel (aria-labelledby), Name, Kategorie, Einsatzbereich, Illustration mit Beschriftung, Vorteilen und Nachteilen; Fokus auf „Schließen“', sb.offen && sb.labelledby === sb.titelId && /Brettsperrholz/.test(sb.name) && /Tragende/.test(sb.kat) && /Tragwerk|Tragende/.test(sb.einsatz) && sb.bild && /^Foto: .*\(Wikimedia Commons\)$/.test(sb.cap) && sb.vor >= 2 && sb.nach >= 2 && /steckbrief-zu/.test(sb.fokus), sb);
  check('Steckbrief: Einordnung „Nachwachsende Rohstoffe“ mit dem Zusatz „Einordnung durch das Projekt“; die sechs wichtigsten Kennwerte (Preis, CO₂, λ, Rohdichte, Brandklasse, Druckfestigkeit); ausführliche Eigenschaften zunächst zugeklappt', JSON.stringify(sb.chips) === '["Nachwachsende Rohstoffe"]' && sb.chipHinweis === 'Einordnung durch das Projekt' && JSON.stringify(sb.kennwerte) === '["preis","gwp","waermeleitfaehigkeit_bemessung","rohdichte","brandverhalten","druckfestigkeit"]' && !sb.mehrOffen, sb);
  const werte = await p.evaluate(() => { const m = MM.produkte.wirksam('brettsperrholz', ''); const f = MM.berechnung.formatZahl; const k = s => document.querySelector('dialog.steckbrief .sb-kennwert[data-kennwert="' + s + '"]').textContent; return { co2: k('gwp').includes(f(m.eigenschaften.gwp.werte.fossil)), rohdichte: k('rohdichte').includes(f(m.eigenschaften.rohdichte.wert)), preis: k('preis').includes(f(m.eigenschaften.preis.wert)) && /B/.test(k('preis')), brand: k('brandverhalten').includes(m.eigenschaften.brandverhalten.wert), vergleichbar: /gleichem Modul und gleichem Datensatztyp/.test(k('gwp')) }; });
  check('Die Kennwerte im Steckbrief sind genau die Werte der Datenbank (CO₂ fossil, Rohdichte, Preis mit Datenart-Kürzel, Brandklasse); beim CO₂ steht der Hinweis auf die eingeschränkte Vergleichbarkeit', Object.values(werte).every(Boolean), werte);
  await p.click('dialog.steckbrief .sb-mehr summary');
  const mehr = await p.evaluate(() => { const d = document.querySelector('dialog.steckbrief'); return { zeilen: [...d.querySelectorAll('.sb-mehr table tbody tr th')].map(x => x.textContent), quellen: d.querySelectorAll('.sb-quellen li').length, links: [...d.querySelectorAll('.sb-quellen a')].every(a => a.target === '_blank' && /noopener/.test(a.rel)), einordnung: /Einordnung durch das Projekt:/.test(d.querySelector('.sb-einordnung').textContent), ueberlauf: d.querySelector('.steckbrief-inhalt').scrollWidth > d.querySelector('.steckbrief-inhalt').clientWidth + 1 }; });
  check('Aufgeklappt: alle Eigenschaften als Tabelle (Preis, CO₂, λ, Rohdichte, Brandverhalten, …), Begründung der Einordnung und die Quellen mit Links (rel=noopener)', mehr.zeilen.length >= 6 && mehr.zeilen.includes('Rohdichte') && mehr.quellen >= 1 && mehr.links && mehr.einordnung && !mehr.ueberlauf, mehr);
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  check('Escape schließt den Steckbrief, der Fokus kehrt auf den Knopf „Steckbrief“ zurück', await p.evaluate(() => !document.querySelector('dialog.steckbrief').open && document.activeElement.dataset.steckbrief === 'brettsperrholz'));
  await p.click('[data-steckbrief="eps"]'); await p.click('dialog.steckbrief .steckbrief-zu'); await p.waitForTimeout(100);
  check('Der Knopf ✕ schließt den Steckbrief ebenfalls; ein Steckbrief lässt sich wieder öffnen (zweites Material)', await p.evaluate(() => !document.querySelector('dialog.steckbrief').open) && await (async () => { await p.click('[data-steckbrief="eps"]'); return p.evaluate(() => document.querySelector('dialog.steckbrief').open && /EPS/.test(document.querySelector('.sb-name').textContent)); })());
  await p.keyboard.press('Escape');
  await p.close();

  // ---------- Echtdaten: fehlende Werte stehen als „nicht verfügbar“, nie als Vorteil
  p = await neu(1280, 'echt');
  const echt = await p.evaluate(() => { const ohneLambda = MM.auswahl && window.MATERIALMATCH_DATA.baustoffe.map(x => x.id).filter(i => { const e = MM.produkte.wirksam(i, '').eigenschaften; return !(e.waermeleitfaehigkeit && typeof e.waermeleitfaehigkeit.wert === 'number') && !(e.waermeleitfaehigkeit_bemessung && typeof e.waermeleitfaehigkeit_bemessung.wert === 'number'); })[0]; MM.steckbrief.oeffne('hanfdaemmung', null); const d = document.querySelector('dialog.steckbrief'); const k = s => d.querySelector('.sb-kennwert[data-kennwert="' + s + '"]').textContent; const m = MM.produkte.wirksam('hanfdaemmung', ''); MM.steckbrief.oeffne(ohneLambda, null); const lam = d.querySelector('.sb-kennwert[data-kennwert="waermeleitfaehigkeit_bemessung"]').textContent; MM.steckbrief.oeffne('hanfdaemmung', null); return { preis: k('preis'), lambda: lam, ohneLambda, druck: k('druckfestigkeit'), preisWert: m.eigenschaften.preis.wert, vorteileMitFehlend: [...d.querySelectorAll('.sb-vorteile li')].some(l => /nicht verfügbar/.test(l.textContent)), beispielMarke: d.querySelectorAll('.sb-kennwerte .art-beispiel').length }; });
  check('Echtdaten-Modus: Der Preis von Hanfdämmung (nur Beispieldaten) und die Wärmeleitfähigkeit eines Materials ohne belegten λ-Wert erscheinen als „nicht verfügbar“, ohne B-Werte; Druckfestigkeit „nicht anwendbar“ – nichts Unbekanntes wird als gute Eigenschaft gezeigt', /nicht verfügbar/.test(echt.preis) && echt.preisWert === null && /nicht verfügbar/.test(echt.lambda) && /nicht anwendbar|nicht verfügbar/.test(echt.druck) && echt.beispielMarke === 0 && !echt.vorteileMitFehlend, echt);
  await p.close();

  // ---------- Quellen & Details: Erklärung der Illustrationen und Kriterien
  p = await neu(1280);
  await p.click('#reiter-quellen'); await p.click('#quellen-hinweise > summary');
  const qi = await p.$eval('#qi-inhalt', e => ({ text: e.textContent, dt: [...e.querySelectorAll('dt')].map(x => x.textContent) }));
  check('Quellen & Details: unter „Rechtliche und fachliche Hinweise“ stehen die Materialillustrationen und die Einordnung: erklärt, dass die Fotos aus Wikimedia Commons stammen (Bildnachweis) und die Schraffuren schematisch und nicht normgerecht sind (mit Quellenangabe je Baustoff), und nennt die Kriterien der vier Klassen', /Schraffuren/.test(qi.text) && /nicht normgerecht/.test(qi.text) && /Wikimedia Commons/.test(qi.text) && /Bildnachweis/.test(qi.text) && /Schraffur je Baustoff und Quelle/.test(qi.text) && JSON.stringify(qi.dt) === '["Nachwachsende Rohstoffe","Mineralische Baustoffe","Konventionelle Baustoffe","Natürliche Baustoffe"]' && /Einordnung durch das Projekt/.test(qi.text), qi);
  await p.close();

  // ---------- Responsiv: Steckbrief passt in jedes Fenster
  const ueber = [];
  for (const w of [320, 375, 430, 768, 820, 1024, 1280, 1920]) {
    const q = await neu(w);
    await q.evaluate(() => MM.auswahl.setzeAuswahl({ a: 'stahlbeton', b: 'holzfaserdaemmung', c: '' })); await q.waitForTimeout(100);
    await q.click('[data-steckbrief="stahlbeton"]'); await q.waitForTimeout(100);
    const r = await q.evaluate(() => { const d = document.querySelector('dialog.steckbrief'); const r = d.getBoundingClientRect(); const i = d.querySelector('.steckbrief-inhalt'); const z = d.querySelector('.steckbrief-zu').getBoundingClientRect(); const kw = [...d.querySelectorAll('.sb-kennwert')].map(k => k.getBoundingClientRect()); const klein = [...d.querySelectorAll('.steckbrief-karte *')].filter(e => e.children.length === 0 && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 12 && e.getBoundingClientRect().width > 0).length; return { passt: r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1, seite: document.documentElement.scrollWidth > document.documentElement.clientWidth, zuKlein: z.width < 44 || z.height < 44, scrollInnen: i.scrollWidth > i.clientWidth + 1, kwRaus: kw.some(k => k.right > r.right + 1), klein }; });
    if (!r.passt || r.seite || r.zuKlein || r.scrollInnen || r.kwRaus || r.klein) ueber.push([w, r]);
    await q.close();
  }
  check('Steckbrief bei 320, 375, 430, 768, 820, 1024, 1280 und 1920 px: passt ins Fenster, kein seitliches Scrollen, Schließen-Knopf mindestens 44 px, Kennwerte im Rahmen, keine Schrift unter 12 px', ueber.length === 0, ueber);

  // ---------- Offline
  const fremd = anfragen.filter(u => !/^(file|blob|data):/.test(u) && !/fonts\.(googleapis|gstatic)\.com/.test(u));
  check('Offline: für Bilder und Steckbriefe wird nichts aus dem Netz geladen (nur lokale Dateien, ausgenommen die Schrift Nunito)', fremd.length === 0 && anfragen.some(u => /schraffuren\/.*\.svg$/.test(u)), fremd.slice(0, 3));

  check('Keine Konsolenfehler oder -warnungen', errors.length === 0, errors.slice(0, 3));
  await b.close();
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' FEHLER');
  process.exit(fails === 0 ? 0 : 1);
})();
