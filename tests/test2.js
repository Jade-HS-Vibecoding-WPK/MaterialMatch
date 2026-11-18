const PROJ = require('path').resolve(__dirname, '..');
const AUSGABE = require('path').join(require('os').tmpdir(), 'materialmatch-tests') + '/';
require('fs').mkdirSync(AUSGABE, { recursive: true });
const vm = require('vm'), fs = require('fs');
const pruefe = require(PROJ + '/js/daten-pruefung.js');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(PROJ + '/data/baustoffe.js','utf8'), ctx);
const D = () => JSON.parse(JSON.stringify(ctx.window.MATERIALMATCH_DATA));

let r = pruefe(D());
console.log('ECHTE DATEN  -> Fehler:', r.fehler.length, '| Warnungen:', r.warnungen.length);
r.fehler.concat(r.warnungen).forEach(x => console.log('  ', x));
console.log('Baustoffe:', D().baustoffe.length);

function fall(name, mutate, erwarte) {
  const d = D(); mutate(d);
  const res = pruefe(d);
  const ok = res.fehler.concat(res.warnungen).some(x => x.includes(erwarte));
  console.log((ok ? 'OK   ' : 'FAIL ') + name + (ok ? '' : ' -> ' + JSON.stringify(res)));
}
const nb = d => d.baustoffe.find(m => m.id === 'normalbeton');
fall('verifiziert ohne Quelle',        d => { nb(d).eigenschaften.waermeleitfaehigkeit.art = 'verifiziert'; }, 'nur mit eingetragener Quelle');
fall('verifiziert mit ungeprüfter Quelle', d => { const e = nb(d).eigenschaften.waermeleitfaehigkeit; e.art='verifiziert'; e.quelle='din-en-iso-10456'; }, 'nicht als geprüft markiert');
fall('geprüfte Quelle ohne Link',      d => { delete d.quellen.find(q => q.id==='oekobaudat').url; }, 'url');
fall('geprüfte Quelle ohne Abrufdatum',d => { delete d.quellen.find(q => q.id.startsWith('oebd-')).abgerufen; }, 'abgerufen');
fall('m² ohne Bezugsdicke (Schicht)',  d => { const g=d.baustoffe.find(m=>m.id==='gipskarton').eigenschaften.gwp; delete g.bezugsdicke_m; }, 'bezugsdicke_m');
fall('€/m²-Preis bei Schicht ohne Bezugsdicke', d => { const pr = nb(d).eigenschaften.preis; pr.einheit = '€/m²'; }, 'bezugsdicke_m');
fall('luluc kein Zahlenwert',          d => { d.baustoffe.find(m=>m.id==='mineralwolle').eigenschaften.gwp.werte.luluc = 'x'; }, 'luluc');
fall('erfundene Quellen-ID',           d => { nb(d).eigenschaften.waermeleitfaehigkeit.quelle = 'gibtsnicht'; }, 'nicht im Quellenkatalog');
fall('falsche Einheit',                d => { nb(d).eigenschaften.rohdichte.einheit = 'g/cm³'; }, 'nicht zulässig');
fall('negative Rohdichte',             d => { nb(d).eigenschaften.rohdichte.wert = -5; }, 'nicht negativ');
fall('Zahl als Text',                  d => { nb(d).eigenschaften.rohdichte.wert = '2300'; }, 'muss eine Zahl');
fall('unbekannte Kategorie',           d => { nb(d).kategorien = ['xyz']; }, 'Unbekannte Kategorie');
fall('doppelte ID',                    d => { d.baustoffe[1].id = 'normalbeton'; }, 'doppelt');
fall('ungültige Euroklasse',           d => { nb(d).eigenschaften.brandverhalten.wert = 'Q9'; }, 'keine gültige Euroklasse');
fall('Preis ohne MwSt-Angabe',         d => { delete nb(d).eigenschaften.preis.mwst; }, 'Mehrwertsteuer');
fall('CO2 ohne Bezugsgröße',           d => { nb(d).eigenschaften.gwp.deklarierte_einheit = '1 Sack'; }, 'deklarierte_einheit');
fall('CO2 Summe stimmt nicht',         d => { nb(d).eigenschaften.gwp.werte.gesamt = 999; }, 'fossil + biogen');
fall('Datenart ohne Wert',             d => { const e = d.baustoffe.find(m=>m.id==='stahlbeton').eigenschaften.gwp; e.art = 'beispiel'; }, 'Ohne Wert darf keine Datenart');
fall('keine_schicht ohne Hinweis',     d => { delete d.baustoffe.find(m=>m.id==='baustahl').mengenhinweis; }, 'mengenhinweis');
fall('unbekannte Eigenschaft',         d => { nb(d).eigenschaften.schalldaemmung = {wert:50}; }, 'Unbekannte Eigenschaft');
console.log('leerer Datenbestand ->', JSON.stringify(pruefe(undefined)));
