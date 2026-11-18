#!/usr/bin/env node
/* ==========================================================================
   MaterialMatch – Quellenbericht erzeugen
   --------------------------------------------------------------------------
   Schreibt QUELLENBERICHT.md: Datenstand, Datenqualität, Nachvollziehbarkeits-
   Check, alle belegten Kennwerte mit Quelle und die Quellenliste. Gedacht für
   die Dokumentation und die Abschlusspräsentation.

   Aufruf:   node tools/quellenbericht.js
   ========================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PROJEKT = path.resolve(__dirname, "..");
const js = n => path.join(PROJEKT, "js", n);
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(PROJEKT, "data", "baustoffe.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(PROJEKT, "data", "produkte.js"), "utf8"), ctx);
const daten = ctx.window.MATERIALMATCH_DATA;
const produkte = ctx.window.MATERIALMATCH_PRODUKTE;
globalThis.MATERIALMATCH_PRODUKTE = produkte;   // js/quellen.js zählt die Werte der Produkte mit
// Wie beim Start der Seite: Werte des Standardprodukts in den generischen Datensatz einsetzen
daten.baustoffe.forEach(m => { const std = produkte.find(p => p.material === m.id && p.standard); if (std) Object.assign(m.eigenschaften, JSON.parse(JSON.stringify(std.eigenschaften))); });

require(js("hilfen.js"));
const Q = require(js("quellen.js"));
Q.setzeDaten(daten);

const ART = { verifiziert: "V", richtwert: "R", beispiel: "B" };
const zahl = x => (typeof x === "number" ? String(Math.round(x * 10000) / 10000).replace(".", ",") : String(x));
const md = t => String(t).replace(/\|/g, "\\|");

function wertText(name, e) {
  if (name === "gwp") return e.werte ? `fossil ${zahl(e.werte.fossil)} / gesamt ${zahl(e.werte.gesamt)} kg CO₂e je ${String(e.deklarierte_einheit).replace(/^1\s*/, "")} (${e.module})` : "";
  return `${zahl(e.wert)} ${e.einheit || ""}`.trim();
}

const z = Q.zaehle(daten);
const pruefung = Q.pruefe(daten);
const heute = new Date().toISOString().slice(0, 10);
const zeilen = [];
const p = t => zeilen.push(t === undefined ? "" : t);

p("# MaterialMatch – Quellenbericht");
p();
p(`Erzeugt am ${heute} mit \`tools/quellenbericht.js\` · Datenbank-Version ${daten.meta.version} · Datenstand ${daten.meta.datenstand}`);
p();
p("## Datenqualität");
p();
p(`${z.summe.gesamt} Kennwerte-Felder (${z.materialien.length} Baustoffe × ${Q.KENNWERTE.length} Kennwerte):`);
p();
p(`- Richtwerte (R, mit Quelle): **${z.summe.richtwert}**`);
p(`- Verifiziert (V): **${z.summe.verifiziert}**`);
p(`- Beispieldaten (B, ohne Quelle, nicht belastbar): **${z.summe.beispiel}**`);
p(`- Nicht anwendbar: **${z.summe.nicht_anwendbar}**`);
p(`- Nicht verfügbar: **${z.summe.fehlt}**`);
p();
p("## Nachvollziehbarkeits-Check");
p();
p(pruefung.ok ? `**Bestanden.** Alle ${pruefung.belegteKennwerte} belegten Kennwerte verweisen auf eine geprüfte Quelle mit https-Link.` : "**Nicht bestanden.**");
p();
pruefung.pruefungen.forEach(c => { p(`- ${c.ok ? "✓" : "✗"} ${c.text}`); c.details.forEach(d => p(`  - ${d}`)); });
p();
pruefung.warnungen.forEach(w => p(`> ${w}`));
p();
p("## Übersicht je Baustoff");
p();
p("B = Beispieldaten · R = Richtwert · V = verifiziert · n. a. = nicht anwendbar · – = nicht verfügbar");
p();
p(`| Baustoff | ${Q.KENNWERTE.map(k => k.name).join(" | ")} |`);
p(`|---|${Q.KENNWERTE.map(() => ":-:").join("|")}|`);
z.materialien.forEach(m => {
  const zellen = Q.KENNWERTE.map(k => {
    const s = m.werte[k.id];
    if (s.status === "wert") return ART[s.art] || "?";
    return s.status === "nicht_anwendbar" ? "n. a." : "–";
  });
  p(`| ${md(m.name)} | ${zellen.join(" | ")} |`);
});
p();
p("## Belegte Kennwerte (mit Quelle)");
p();
p("| Baustoff | Kennwert | Wert | Datenart | Quelle |");
p("|---|---|---|:-:|---|");
daten.baustoffe.forEach(m => {
  Object.keys(m.eigenschaften).forEach(k => {
    const e = m.eigenschaften[k];
    if (!e || !e.quelle) return;
    const q = Q.finde(e.quelle);
    const b = Q.beschreibe(q);
    const link = b.url ? `[${md(b.titel)}](${b.url})` : md(b.titel);
    p(`| ${md(m.name)} | ${k} | ${md(wertText(k, e))} | ${ART[e.art] || "?"} | ${link}${b.eigner ? " (" + md(b.eigner) + ")" : ""}${b.detail ? ", " + md(b.detail) : ""} |`);
  });
});
p();
p("## Produkte");
p();
p("Die Übersicht oben zeigt je Material den Zustand beim Start der Seite: generischer Datensatz plus Werte des Standardprodukts. Weitere Produkte lassen sich in der Materialauswahl wählen.");
p();
p("| Material | Produkt | Hersteller | Standard | Belegte Werte | Hauptdokument |");
p("|---|---|---|:-:|---|---|");
produkte.forEach(pr => {
  const m = daten.baustoffe.find(x => x.id === pr.material);
  const q = daten.quellen.find(x => x.id === pr.datenblatt);
  const werte = Object.keys(pr.eigenschaften).filter(k => { const e = pr.eigenschaften[k]; return e.werte ? true : (e.wert !== null && e.wert !== undefined); }).join(", ");
  p(`| ${md(m ? m.name : pr.material)} | ${md(pr.name)} | ${md(pr.hersteller)} | ${pr.standard ? "ja" : "–"} | ${md(werte || "–")} | ${q ? "[" + md(q.titel) + "](" + q.url + ")" : "–"} |`);
});
p();
p("### Preise (Händler, Produkt, Preis, Einheit, Link, Abrufdatum)");
p();
p("| Produkt (Hersteller) | Händler | Variante / Maße | Preis im Original | Umgerechnet | Region / Verfügbarkeit | Status | Link | Abgerufen |");
p("|---|---|---|---|---|---|---|---|---|");
produkte.forEach(pr => {
  const e = pr.eigenschaften.preis;
  if (!e || e.wert === null) return;
  const q = daten.quellen.find(x => x.id === e.quelle);
  const a = q.preisangabe;
  p(`| ${md(pr.name)} (${md(pr.hersteller)}) | ${md(a.haendler)} | ${md(a.variante)} | ${zahl(a.preis)} ${a.einheit}, ${md(a.mwst)} | ${zahl(e.wert)} ${e.einheit} | ${md(a.region)}; ${md(a.verfuegbarkeit)} | ${a.status} | ${q.url} | ${q.abgerufen} |`);
});
p();
p("## Quellenkatalog");
p();
const verw = Q.verwendung(daten);
p("| Kennung | Quelle | Status | Kennwerte | Link |");
p("|---|---|---|:-:|---|");
daten.quellen.forEach(q => {
  const b = Q.beschreibe(q);
  const status = q.geprueft === true ? "geprüft (abgerufen " + (q.abgerufen || "?") + ")" : "nicht eingesehen, kein Beleg";
  p(`| \`${q.id}\` | ${md(q.titel)} | ${status} | ${verw[q.id] ? verw[q.id].length : "–"} | ${b.url ? b.url : "–"} |`);
});
p();
p("## Hinweise");
p();
p("- Generische ÖKOBAUDAT-Datensätze sind laut BBSR nicht extern geprüft und enthalten Sicherheitszuschläge von 10 bis 30 %.");
p("- Beispieldaten sind frei gewählt und nicht belastbar; sie dürfen nicht als Grundlage für Entscheidungen dienen.");
p("- Ob die Links erreichbar sind, prüft `node tools/pruefe_links.js`; ob die Zahlen mit der ÖKOBAUDAT-Datei übereinstimmen, `node tools/pruefe_gegen_csv.js`.");
p();

fs.writeFileSync(path.join(PROJEKT, "QUELLENBERICHT.md"), zeilen.join("\n"), "utf8");
console.log(`QUELLENBERICHT.md geschrieben (${zeilen.length} Zeilen).`);
