#!/usr/bin/env node
/* ==========================================================================
   MaterialMatch – Gegenprüfung der ÖKOBAUDAT-Werte
   --------------------------------------------------------------------------
   Vergleicht jeden Kennwert in data/baustoffe.js, der auf eine ÖKOBAUDAT-Quelle
   ("oebd-…") verweist, mit der CSV-Datei. Eigene CSV-Leselogik, bewusst
   unabhängig vom Übernahme-Skript (anderer Programmiercode, andere Sprache).

   Aufruf:
     node tools/pruefe_gegen_csv.js [pfad/zur/csv]
   Ohne Pfad wird der Auszug im Projekt verwendet (data/quellen/…auszug.csv, UTF-8).
   Für die Prüfung gegen die vollständige Originaldatei deren Pfad angeben
   (Kodierung windows-1252 wird erkannt, wenn der Dateiname nicht "auszug" enthält).
   ========================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PROJEKT = path.resolve(__dirname, "..");
const csvPfad = process.argv[2] || path.join(PROJEKT, "data", "quellen", "oekobaudat_2024-II_auszug.csv");

// ---- Datenbank laden
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(PROJEKT, "data", "baustoffe.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(PROJEKT, "data", "produkte.js"), "utf8"), ctx);
const daten = ctx.window.MATERIALMATCH_DATA;
const produkte = ctx.window.MATERIALMATCH_PRODUKTE || [];

// ---- CSV lesen (eigene Implementierung, Anführungszeichen werden berücksichtigt)
const roh = fs.readFileSync(csvPfad);
const text = new TextDecoder(/auszug/.test(csvPfad) ? "utf-8" : "windows-1252").decode(roh);
function parseCsv(t) {
  const zeilen = []; let zeile = [], feld = "", inQ = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQ) {
      if (c === '"' && t[i + 1] === '"') { feld += '"'; i++; }
      else if (c === '"') inQ = false;
      else feld += c;
    } else if (c === '"') inQ = true;
    else if (c === ";") { zeile.push(feld); feld = ""; }
    else if (c === "\n") { zeile.push(feld); zeilen.push(zeile); zeile = []; feld = ""; }
    else if (c !== "\r") feld += c;
  }
  if (feld !== "" || zeile.length) { zeile.push(feld); zeilen.push(zeile); }
  return zeilen;
}
const tabelle = parseCsv(text);
const kopf = tabelle[0].map(s => s.trim());
const sp = n => { const i = kopf.indexOf(n); if (i < 0) throw new Error("Spalte fehlt: " + n); return i; };
const S = { uuid: sp("UUID"), version: sp("Version"), name: sp("Name (de)"), typ: sp("Typ"), modul: sp("Modul"),
  bg: sp("Bezugsgroesse"), be: sp("Bezugseinheit"), rho: sp("Rohdichte (kg/m3)"), fg: sp("Flaechengewicht (kg/m2)"),
  dicke: sp("Schichtdicke (m)"), url: sp("URL"), owner: sp("Declaration owner"),
  gesamt: sp("GWPtotal (A2)"), fossil: sp("GWPfossil (A2)"), bio: sp("GWPbiogenic (A2)"), luluc: sp("GWPluluc (A2)") };
console.log(`CSV: ${csvPfad}\n  ${tabelle.length - 1} Zeilen, ${kopf.length} Spalten`);

const a13 = new Map();
for (const z of tabelle.slice(1)) if ((z[S.modul] || "").trim() === "A1-A3") {
  const u = z[S.uuid].trim();
  if (a13.has(u)) { a13.set(u, null); } else a13.set(u, z); // null = mehrdeutig
}

let fehler = 0, geprueft = 0;
const ok = (c, msg) => { if (!c) { fehler++; console.log("  FEHLER: " + msg); } return c; };
const num = t => (t === undefined || t.trim() === "" ? null : Number(t.trim()));
const gleich = (a, b) => a !== null && b !== null && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));

const quellen = new Map(daten.quellen.map(q => [q.id, q]));

// ---- Quelleneinträge prüfen
for (const q of daten.quellen.filter(q => /^oebd-[0-9a-f]{8}$/.test(q.id))) {
  const z = a13.get(q.uuid);
  if (!ok(z, `Quelle ${q.id}: UUID ${q.uuid} nicht (eindeutig) in A1-A3-Zeilen der CSV`)) continue;
  ok(z[S.name].trim() === q.titel, `Quelle ${q.id}: Titel „${q.titel}“ ≠ CSV „${z[S.name].trim()}“`);
  ok(z[S.url].trim() === q.url, `Quelle ${q.id}: URL weicht ab`);
  ok(z[S.version].trim() === q.version, `Quelle ${q.id}: Version weicht ab`);
  ok(z[S.typ].trim() === q.typ, `Quelle ${q.id}: Typ weicht ab`);
  ok(z[S.owner].trim() === q.datensatz_eigner, `Quelle ${q.id}: Eigner weicht ab`);
  ok(q.id === "oebd-" + q.uuid.slice(0, 8), `Quelle ${q.id}: id passt nicht zur UUID`);
  ok(q.geprueft === true && q.abgerufen, `Quelle ${q.id}: nicht als geprüft/abgerufen markiert`);
}

// ---- Kennwerte prüfen
const zeilenAusgabe = [];
let belegtAnders = 0;
for (const m of daten.baustoffe) {
  for (const [name, e] of Object.entries(m.eigenschaften)) {
    const verweistAufOebd = e.quelle && /^oebd-[0-9a-f]{8}$/.test(e.quelle);
    if ((e.art === "richtwert" || e.art === "verifiziert") && !verweistAufOebd) {
      // Belegte Werte außerhalb der ÖKOBAUDAT (Herstellerdatenblatt, EU-Rechtstext): Die Zahl selbst lässt sich
      // hier nicht gegen die CSV prüfen (siehe RECHERCHE.md, Werte wurden im Originaldokument gelesen).
      // Geprüft wird, dass der Beleg vollständig ist: Quelle im Katalog, geprüft, URL, Abrufdatum, Region, Geltung, Einheit.
      const qa = quellen.get(e.quelle);
      const wo = `${m.id}.${name}`;
      if (ok(qa, `${wo}: art „${e.art}“ ohne Quelle im Katalog`)) {
        ok(qa.geprueft === true, `${wo}: Quelle ${qa.id} nicht als geprüft markiert`);
        ok(/^https:\/\//.test(qa.url || ""), `${wo}: Quelle ${qa.id} ohne https-URL`);
        ok(/^\d{4}-\d{2}-\d{2}$/.test(qa.abgerufen || ""), `${wo}: Quelle ${qa.id} ohne Abrufdatum`);
        ok(qa.quellenart && qa.region && (qa.geltung === "generisch" || qa.geltung === "produktspezifisch"), `${wo}: Quelle ${qa.id}: Quellenart/Region/Geltung unvollständig`);
        ok(name === "brandverhalten" || (e.einheit && e.einheit.length > 0), `${wo}: Einheit fehlt`);
        ok(typeof e.hinweis === "string" && e.hinweis.length > 20, `${wo}: Hinweistext fehlt`);
        belegtAnders++;
      }
    }
    if (!verweistAufOebd) continue;
    const q = quellen.get(e.quelle);
    if (!ok(q, `${m.id}.${name}: Quelle ${e.quelle} fehlt im Katalog`)) continue;
    const z = a13.get(q.uuid);
    if (!z) { ok(false, `${m.id}.${name}: Datensatz ${q.uuid} nicht in CSV`); continue; }
    geprueft++;
    const bg = num(z[S.bg]), be = z[S.be].trim();

    if (name === "rohdichte") {
      ok(e.einheit === "kg/m³", `${m.id}.rohdichte: Einheit ${e.einheit}`);
      ok(gleich(e.wert, num(z[S.rho])), `${m.id}.rohdichte: ${e.wert} ≠ CSV ${z[S.rho]}`);
      zeilenAusgabe.push([m.id, "Rohdichte", e.wert + " kg/m³", q.titel]);
    } else if (name === "flaechengewicht") {
      ok(gleich(e.wert, num(z[S.fg])), `${m.id}.flaechengewicht: ${e.wert} ≠ CSV ${z[S.fg]}`);
      zeilenAusgabe.push([m.id, "Flächengewicht", e.wert + " kg/m²", q.titel]);
    } else if (name === "gwp") {
      const erwarteteEinheit = { m3: "1 m³", qm: "1 m²", kg: "1 kg" }[be];
      ok(e.deklarierte_einheit === erwarteteEinheit, `${m.id}.gwp: Einheit ${e.deklarierte_einheit} ≠ CSV ${bg} ${be}`);
      ok(e.module === "A1-A3", `${m.id}.gwp: Modul ${e.module}`);
      const teiler = be === "kg" && bg === 1000 ? 1000 : 1;
      ok(be !== "kg" ? bg === 1 : (bg === 1 || bg === 1000), `${m.id}.gwp: unerwartete Bezugsgröße ${bg}`);
      const paare = [["gesamt", S.gesamt], ["fossil", S.fossil], ["biogen", S.bio], ["luluc", S.luluc]];
      for (const [k, i] of paare) {
        const soll = num(z[i]);
        if (soll === null) { ok(e.werte[k] === undefined, `${m.id}.gwp.${k}: in CSV leer, aber Wert ${e.werte[k]} gesetzt`); continue; }
        ok(gleich(e.werte[k], soll / teiler), `${m.id}.gwp.${k}: ${e.werte[k]} ≠ CSV ${soll}${teiler > 1 ? " / " + teiler : ""}`);
      }
      if (be === "qm" && num(z[S.dicke])) ok(gleich(e.bezugsdicke_m, num(z[S.dicke])), `${m.id}.gwp: bezugsdicke_m ${e.bezugsdicke_m} ≠ CSV ${z[S.dicke]}`);
      zeilenAusgabe.push([m.id, "GWP gesamt", `${e.werte.gesamt} kg CO2e je ${e.deklarierte_einheit}`, q.titel]);
    } else {
      ok(false, `${m.id}.${name}: unerwartete Eigenschaft mit ÖKOBAUDAT-Quelle`);
    }
  }
}

// ---- Produkte (data/produkte.js): jeder Wert braucht einen vollständigen Beleg; Händlerpreise werden nachgerechnet
let produktWerte = 0, preisePruefung = 0, produktOebd = 0;
for (const pr of produkte) {
  for (const [name, e] of Object.entries(pr.eigenschaften)) {
    const hat = name === "gwp" ? !!e.werte : (e.wert !== null && e.wert !== undefined);
    const wo = `Produkt ${pr.id}.${name}`;
    if (!hat) { ok(e.art === null && typeof e.hinweis === "string" && e.hinweis.length > 20, `${wo}: fehlender Wert ohne Begründung`); continue; }
    const qa = quellen.get(e.quelle);
    if (!ok(qa, `${wo}: Quelle ${e.quelle} fehlt im Katalog`)) continue;
    produktWerte++;
    ok(e.art === "richtwert" || e.art === "verifiziert", `${wo}: Datenart ${e.art}`);
    ok(qa.geprueft === true && /^https:\/\//.test(qa.url || "") && /^\d{4}-\d{2}-\d{2}$/.test(qa.abgerufen || ""), `${wo}: Quelle ${qa.id} nicht geprüft/ohne https-URL/Abrufdatum`);
    ok(qa.quellenart && qa.region && (qa.geltung === "generisch" || qa.geltung === "produktspezifisch") && qa.produkt, `${wo}: Quelle ${qa.id}: Quellenart/Region/Geltung/Produkt unvollständig`);
    ok(name === "brandverhalten" || name === "gwp" || (e.einheit && e.einheit.length > 0), `${wo}: Einheit fehlt`);
    // Produktwerte mit ÖKOBAUDAT-Quelle (Rohdichte, GWP) werden wie die Werte der Materialien gegen die CSV geprüft
    if (/^oebd-[0-9a-f]{8}$/.test(e.quelle)) {
      const z = a13.get(qa.uuid);
      if (ok(z, `${wo}: Datensatz ${qa.uuid} nicht in CSV`)) {
        produktOebd++;
        const bg = num(z[S.bg]), be = z[S.be].trim();
        if (name === "rohdichte") {
          const direkt = num(z[S.rho]);
          const soll = direkt !== null ? direkt : (num(z[S.fg]) && num(z[S.dicke]) ? num(z[S.fg]) / num(z[S.dicke]) : null);
          ok(e.einheit === "kg/m³", `${wo}: Einheit ${e.einheit}`);
          ok(soll !== null && gleich(e.wert, soll), `${wo}: Rohdichte ${e.wert} ≠ CSV ${direkt !== null ? direkt : "Flächengewicht ÷ Schichtdicke"} (${soll})`);
        } else if (name === "gwp") {
          const erwarteteEinheit = { m3: "1 m³", qm: "1 m²", kg: "1 kg" }[be];
          ok(e.deklarierte_einheit === erwarteteEinheit, `${wo}: Einheit ${e.deklarierte_einheit} ≠ CSV ${bg} ${be}`);
          ok(e.module === "A1-A3", `${wo}: Modul ${e.module}`);
          ok(bg === 1, `${wo}: unerwartete Bezugsgröße ${bg}`);
          for (const [k, i] of [["gesamt", S.gesamt], ["fossil", S.fossil], ["biogen", S.bio], ["luluc", S.luluc]]) {
            const soll = num(z[i]);
            if (soll === null) { ok(e.werte[k] === undefined, `${wo}.${k}: in CSV leer, aber Wert ${e.werte[k]} gesetzt`); continue; }
            ok(gleich(e.werte[k], soll), `${wo}.${k}: ${e.werte[k]} ≠ CSV ${soll}`);
          }
          if (be === "qm") ok(gleich(e.bezugsdicke_m, num(z[S.dicke])), `${wo}: bezugsdicke_m ${e.bezugsdicke_m} ≠ CSV ${z[S.dicke]}`);
          // Primärenergie steht im Hinweis: die genannten Zahlen müssen zur CSV passen
          const pert = num(z[kopf.indexOf("PERT")]), penrt = num(z[kopf.indexOf("PENRT")]);
          const fmt = x => x.toFixed(1).replace(".", ",");
          if (pert !== null && penrt !== null) ok(e.hinweis.includes("(PERT) " + fmt(pert) + " MJ") && e.hinweis.includes("(PENRT) " + fmt(penrt) + " MJ"), `${wo}: Primärenergie im Hinweis ≠ CSV (PERT ${pert}, PENRT ${penrt})`);
        } else ok(false, `${wo}: unerwartete Eigenschaft mit ÖKOBAUDAT-Quelle`);
      }
    }
    if (name === "preis") {
      preisePruefung++;
      const pa = qa.preisangabe;
      ok(/^(Händlerpreis|Preisliste)/.test(qa.quellenart) && pa && pa.haendler && pa.produktname && pa.hersteller && pa.variante && pa.region && pa.verfuegbarkeit && pa.status, `${wo}: Preisangabe unvollständig (Händler, Produkt, Hersteller, Variante, Region, Verfügbarkeit, Status)`);
      ok(e.mwst && e.umfang && e.mwst !== "unbekannt" && e.umfang !== "unbekannt", `${wo}: Mehrwertsteuer/Leistungsumfang fehlen`);
      // Unabhängige Nachrechnung aus den Maßen der Verkaufseinheit (eigene Formeln, nicht aus js/produkte.js)
      const u = (pa && pa.umrechnung) || {};
      const vol = { packung_flaeche_dicke: () => u.flaeche_m2 * u.dicke_m, stueck_volumen: () => u.laenge_m * u.breite_m * u.hoehe_m,
        palette_stueck_volumen: () => u.stueck * u.laenge_m * u.breite_m * u.hoehe_m, laufmeter_querschnitt: () => u.breite_m * u.hoehe_m,
        tonne_verbrauch: () => (pa && pa.einheit === '€/t') ? 10 / u.verbrauch_kg_m2_cm : NaN, packung_flaeche: () => u.flaeche_m2, stueck_flaeche: () => u.laenge_m * u.breite_m, flaeche_dicke: () => u.dicke_m, direkt: () => 1 }[u.art];
      if (ok(vol && pa, `${wo}: Umrechnungsart unbekannt`)) {
        const soll = pa.preis / vol();
        ok(isFinite(soll) && Math.abs(soll - e.wert) < 0.01, `${wo}: Preis ${e.wert} ≠ ${pa.preis} ${pa.einheit} umgerechnet = ${soll.toFixed(4)}`);
        ok(u.ziel === e.einheit, `${wo}: Zieleinheit ${u.ziel} ≠ Einheit des Kennwerts ${e.einheit}`);
      }
      if (pa && pa.status !== "abgerufen") ok(/(älter|Preisliste|geschätzt|nicht aktuell)/i.test(e.hinweis || ""), `${wo}: Preis nicht von der Händlerseite abgerufen, aber im Hinweis nicht gekennzeichnet`);
    }
  }
}
console.log(`\nGeprüfte Kennwerte mit ÖKOBAUDAT-Quelle: ${geprueft}`);
console.log(`Geprüfte Produktwerte (data/produkte.js, vollständiger Beleg; ${preisePruefung} Händlerpreise nachgerechnet): ${produktWerte}`);
console.log(`Davon Produktwerte mit ÖKOBAUDAT-Quelle, Zahl für Zahl gegen die CSV geprüft (Rohdichte, GWP, Primärenergie im Hinweis): ${produktOebd}`);
console.log(`Belegte Kennwerte mit anderer Quelle (Herstellerdatenblatt, EU-Rechtstext), auf Vollständigkeit des Belegs geprüft: ${belegtAnders}`);
console.log(`Geprüfte Quellen-Einträge: ${[...quellen.keys()].filter(k => /^oebd-[0-9a-f]{8}$/.test(k)).length}`);
console.log(fehler === 0 ? "\nERGEBNIS: Alle Werte stimmen mit der CSV überein." : `\nERGEBNIS: ${fehler} Abweichung(en)!`);
process.exit(fehler === 0 ? 0 : 1);
