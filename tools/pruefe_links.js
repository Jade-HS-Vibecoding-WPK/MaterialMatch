#!/usr/bin/env node
/* ==========================================================================
   MaterialMatch – Quellenlinks prüfen
   --------------------------------------------------------------------------
   Ruft jeden https-Link aus dem Quellenkatalog (data/baustoffe.js) ab und
   meldet, ob er erreichbar ist (HTTP 200). Dafür wird eine Internetverbindung
   gebraucht. Vorübergehende Verbindungsabbrüche werden bis zu 4-mal wiederholt.

   Aufruf:   node tools/pruefe_links.js
   Ergebnis: Tabelle mit Status je Link; Exit-Code 0 = alle erreichbar.

   Händlerpreis-Seiten (Quellenart „Händlerpreis“) werden nicht automatisch geprüft, sondern als „MANUELL“ aufgelistet.

   Hinweis: Der Abruf zeigt nur, dass die Seite antwortet. Dass die Zahlen mit
   der Quelle übereinstimmen, prüft tools/pruefe_gegen_csv.js.
   ========================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PROJEKT = path.resolve(__dirname, "..");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(PROJEKT, "data", "baustoffe.js"), "utf8"), ctx);
const daten = ctx.window.MATERIALMATCH_DATA;

const links = [];
for (const q of daten.quellen) {
  if (!q.url) continue;
  if (!/^https:\/\//.test(q.url)) { links.push({ id: q.id, url: q.url, fehler: "kein https-Link" }); continue; }
  // Händlerseiten antworten auf Programme (ohne Browser) mit 404 oder einer Bot-Abwehr. Das Werkzeug tarnt sich nicht als Browser:
  // Diese Links werden deshalb nur aufgelistet und müssen im Browser geöffnet werden.
  links.push({ id: q.id, url: q.url, manuell: /^Händlerpreis/.test(q.quellenart || "") });
}

async function abrufen(url) {
  let letzter = "";
  for (let versuch = 1; versuch <= 4; versuch++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 60000);
      const r = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "User-Agent": "MaterialMatch-Linkpruefung" } });
      clearTimeout(timer);
      await r.arrayBuffer();
      if (r.status === 200) return { status: 200, versuche: versuch };
      letzter = "HTTP " + r.status;
    } catch (e) {
      letzter = (e.cause && e.cause.code) || e.message;
    }
    await new Promise(res => setTimeout(res, 3000 * versuch));
  }
  return { status: 0, fehler: letzter, versuche: 4 };
}

(async () => {
  console.log(`Prüfe ${links.length} Links aus dem Quellenkatalog …\n`);
  let fehler = 0;
  for (const l of links) {
    if (l.manuell) { console.log(`MANUELL  ${l.id.padEnd(28)} im Browser prüfen: ${l.url}`); continue; }
    const r = l.fehler ? { status: 0, fehler: l.fehler, versuche: 0 } : await abrufen(l.url);
    const ok = r.status === 200;
    if (!ok) fehler++;
    console.log(`${ok ? "OK    " : "FEHLER"}  ${l.id.padEnd(28)} ${ok ? "HTTP 200 (Versuch " + r.versuche + ")" : r.fehler}`);
  }
  console.log(fehler === 0 ? "\nERGEBNIS: Alle Links sind erreichbar." : `\nERGEBNIS: ${fehler} Link(s) nicht erreichbar.`);
  process.exit(fehler === 0 ? 0 : 1);
})();
