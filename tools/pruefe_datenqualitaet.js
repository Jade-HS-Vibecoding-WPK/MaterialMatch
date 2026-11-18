#!/usr/bin/env node
/* MaterialMatch – automatische Qualitätsprüfung der Baustoffdaten (MaterialMatch 3.2)
   --------------------------------------------------------------------------
   Prüft data/baustoffe.js, data/produkte.js und data/materialprofil.js (ohne Browser, ohne Internet):
     • fehlende Kennwerte (je Baustoff und Kennwert, so wie sie im Echtdaten-Modus erscheinen)
     • ungültige Werte (keine Zahl, negativ, 0 wo nur positive Werte sinnvoll sind)
     • fehlende oder unbekannte Quellen, Beispieldaten mit Quelle, Richtwerte ohne Quelle
     • unplausible Größenordnungen (Rohdichte, λ, c, μ, Druckfestigkeit, Preis, CO₂)
     • falsche Einheiten (je Kennwert ist eine Einheit erwartet)
     • doppelte Baustoffe, Produkte, Quellen (IDs, Namen, Adressen)
     • fehlerhafte Verknüpfungen (Produkt → Material, Datenblatt → Quelle, Kategorie, Anwendung, Profil, Schraffur)
   Links auf Erreichbarkeit prüft tools/pruefe_links.js (braucht Internet).

   Aufruf:
     node tools/pruefe_datenqualitaet.js                 Prüfung, Ausgabe der Fehler und Warnungen, Exit-Code 1 bei Fehlern
     node tools/pruefe_datenqualitaet.js --bericht       zusätzlich DATENLUECKEN.md (alle fehlenden Kennwerte mit Gründen) schreiben
     node tools/pruefe_datenqualitaet.js --daten <ordner> anderen data-Ordner prüfen (z. B. eine alte Sicherung)
     node tools/pruefe_datenqualitaet.js --json           nur die Zahlen als JSON ausgeben
   Fehler (ERROR) führen zum Exit-Code 1; Warnungen (WARN) sind Hinweise zur Datenlage und keine Programmfehler. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const args = process.argv.slice(2);
const opt = (n) => args.indexOf(n) !== -1;
const PROJ = path.resolve(__dirname, "..");
const DATEN = args.indexOf("--daten") !== -1 ? path.resolve(args[args.indexOf("--daten") + 1]) : path.join(PROJ, "data");

function lade() {
  const ctx = { window: {} }; vm.createContext(ctx);
  for (const f of ["baustoffe", "produkte", "materialprofil"]) {
    const p = path.join(DATEN, f + ".js");
    if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, "utf8"), ctx);
  }
  return { DB: ctx.window.MATERIALMATCH_DATA, PR: ctx.window.MATERIALMATCH_PRODUKTE || [], PROFIL: ctx.window.MATERIALMATCH_PROFIL };
}
const { DB, PR, PROFIL } = lade();

// Die zehn Kennwerte je Baustoff (wie im Qualitätsbericht) und ihre Erwartungen
const KENNWERTE = [
  ["preis", "Preis"], ["rohdichte", "Rohdichte"], ["waermeleitfaehigkeit", "Wärmeleitfähigkeit λ (Nennwert)"],
  ["waermeleitfaehigkeit_bemessung", "Bemessungswert λB"], ["waermekapazitaet", "Spezifische Wärmekapazität"],
  ["druckfestigkeit", "Druckfestigkeit"], ["brandverhalten", "Brandverhalten (Euroklasse)"],
  ["wasserdampf_mu", "Wasserdampf-Diffusionswiderstand μ"], ["gwp", "CO₂ / GWP"], ["recycling", "Recyclingfähigkeit"]
];
const ERWARTET = {   // einheit, min, max (Plausibilität; Werte außerhalb sind verdächtig, kein Beweis)
  rohdichte: { einheit: ["kg/m³"], min: 5, max: 9000 },
  waermeleitfaehigkeit: { einheit: ["W/(m·K)"], min: 0.01, max: 400 },
  waermeleitfaehigkeit_bemessung: { einheit: ["W/(m·K)"], min: 0.01, max: 400 },
  waermekapazitaet: { einheit: ["J/(kg·K)"], min: 300, max: 5000 },
  druckfestigkeit: { einheit: ["N/mm²"], min: 0.05, max: 600 },
  wasserdampf_mu: { einheit: ["–", "-"], min: 0.5, max: 2000000 },
  preis: { einheit: ["€/m³", "€/m²", "€/kg", "€/t", "€/Stück", "€/lfm"], min: 0.01, max: 100000 },
  flaechengewicht: { einheit: ["kg/m²"], min: 0.05, max: 1000 }
};
const ART = ["beispiel", "richtwert", "verifiziert", "eigen", "direkt"];

const errors = [], warns = [];
const err = (m) => errors.push(m), warn = (m) => warns.push(m);
const istZahl = (x) => typeof x === "number" && isFinite(x);
const quellen = {}; (DB.quellen || []).forEach((q) => { if (quellen[q.id]) err("Quelle doppelt: " + q.id); quellen[q.id] = q; });

// ---------- Baustoffe ----------
const ids = {}, namen = {};
const katIds = new Set((DB.kategorien || []).map((k) => k.id)), anwIds = new Set((DB.anwendungsbereiche || []).map((k) => k.id));
DB.baustoffe.forEach((m) => {
  if (ids[m.id]) err("Baustoff-ID doppelt: " + m.id); ids[m.id] = true;
  if (namen[m.name]) err("Baustoffname doppelt: " + m.name); namen[m.name] = true;
  (m.kategorien || []).forEach((k) => { if (!katIds.has(k)) err(m.id + ": unbekannte Kategorie " + k); });
  if (!(m.kategorien || []).length) err(m.id + ": keine Kategorie");
  (m.anwendungen || []).forEach((a) => { if (!anwIds.has(a)) err(m.id + ": unbekannter Anwendungsbereich " + a); });
  if (PROFIL && !PROFIL.materialien[m.id]) err(m.id + ": keine Einordnung in data/materialprofil.js");
  if (!fs.existsSync(path.join(PROJ, "img", "schraffuren", m.id + ".svg"))) err(m.id + ": keine Schraffur img/schraffuren/" + m.id + ".svg");
  Object.keys(m.eigenschaften).forEach((k) => pruefeEigenschaft(m.id, k, m.eigenschaften[k], "Baustoff"));
});

function pruefeEigenschaft(wo, k, e, ebene) {
  const w = ebene + " " + wo + ": " + k;
  if (!e || typeof e !== "object") { err(w + " ist leer oder kein Objekt"); return; }
  const hat = k === "gwp" ? !!e.werte : (e.wert !== null && e.wert !== undefined && e.wert !== "");
  if (e.nicht_anwendbar === true) return;
  if (!hat) {
    if (e.art !== null && e.art !== undefined) err(w + ": ohne Wert darf keine Datenart stehen");
    if (!e.hinweis) warn(w + ": fehlender Wert ohne Begründung (hinweis)");
    return;
  }
  if (ART.indexOf(e.art) === -1) err(w + ": ungültige Datenart " + e.art);
  if (e.art === "beispiel" && e.quelle) err(w + ": Beispieldaten dürfen keine Quelle haben");
  if ((e.art === "richtwert" || e.art === "verifiziert") && !e.quelle) err(w + ": " + e.art + " ohne Quelle");
  if (e.quelle) {
    const q = quellen[e.quelle];
    if (!q) err(w + ": unbekannte Quelle " + e.quelle);
    else {
      if (q.geprueft !== true) err(w + ": Quelle " + e.quelle + " nicht als geprüft markiert");
      if (!/^https:\/\//.test(q.url || "")) err(w + ": Quelle " + e.quelle + " ohne https-Link");
      if (!q.abgerufen) warn(w + ": Quelle " + e.quelle + " ohne Abrufdatum");
    }
  }
  if (k === "gwp") {
    const g = e.werte;
    ["gesamt", "fossil"].forEach((f) => { if (!istZahl(g[f])) err(w + ": GWP " + f + " keine Zahl"); });
    if (istZahl(g.fossil) && (g.fossil < -50 || g.fossil > 100000)) warn(w + ": GWP fossil " + g.fossil + " unplausibel");
    if (!e.deklarierte_einheit) err(w + ": deklarierte Einheit fehlt");
    if (!e.module) warn(w + ": Lebenszyklusmodul fehlt");
    return;
  }
  if (k === "brandverhalten") { if (!/^(A1|A2|B|C|D|E|F)/.test(String(e.wert))) err(w + ": Euroklasse nicht erkennbar: " + e.wert); return; }
  if (k === "recycling") { if (typeof e.wert !== "string") err(w + ": Freitext erwartet"); return; }
  const er = ERWARTET[k];
  if (!er) return;
  if (!istZahl(e.wert)) { err(w + ": Wert keine Zahl: " + e.wert); return; }
  if (er.einheit.indexOf(e.einheit) === -1) err(w + ": Einheit „" + e.einheit + "“ statt " + er.einheit.join(" / "));
  if (e.wert < er.min || e.wert > er.max) warn(w + ": Wert " + e.wert + " " + (e.einheit || "") + " außerhalb des üblichen Bereichs " + er.min + " bis " + er.max);
  if (k === "preis") {
    if (!e.mwst) warn(w + ": Mehrwertsteuer-Angabe fehlt");
    if (e.spanne) {
      if (!istZahl(e.spanne.min) || !istZahl(e.spanne.max) || e.spanne.min > e.spanne.max) err(w + ": ungültige Preisspanne");
      else if (e.wert < e.spanne.min || e.wert > e.spanne.max) err(w + ": Wert liegt außerhalb der Preisspanne");
    }
  }
}

// ---------- Produkte ----------
const pid = {}, pname = {}, standard = {};
PR.forEach((p) => {
  if (pid[p.id]) err("Produkt-ID doppelt: " + p.id); pid[p.id] = true;
  const key = p.material + "|" + p.name; if (pname[key]) err("Produkt doppelt: " + key); pname[key] = true;
  if (!ids[p.material]) err("Produkt " + p.id + ": unbekanntes Material " + p.material);
  if (!p.hersteller) err("Produkt " + p.id + ": Hersteller fehlt");
  if (!quellen[p.datenblatt]) err("Produkt " + p.id + ": Datenblatt-Quelle fehlt oder unbekannt (" + p.datenblatt + ")");
  if (p.standard) { standard[p.material] = (standard[p.material] || 0) + 1; if (standard[p.material] > 1) err("Material " + p.material + ": mehr als ein Standardprodukt"); }
  Object.keys(p.eigenschaften || {}).forEach((k) => pruefeEigenschaft(p.id, k, p.eigenschaften[k], "Produkt"));
});
// Quellen: doppelte Adressen sind bei Listen normal (eine PDF, mehrere Seiten); doppelte (Adresse + Produkt) nicht
const adr = {};
(DB.quellen || []).forEach((q) => { const key = (q.url || "") + "|" + (q.produkt || ""); if (q.produkt && adr[key]) err("Quelle doppelt (gleiche Adresse und gleiches Produkt): " + q.id + " / " + adr[key]); adr[key] = q.id; });

// ---------- Zählung: was sieht man im Echtdaten-Modus? (Beispieldaten zählen als fehlend, Standardprodukt überlagert das Material) ----------
function wirksam(m) {
  const std = PR.find((p) => p.material === m.id && p.standard);
  const e = Object.assign({}, m.eigenschaften);
  if (std) Object.keys(std.eigenschaften || {}).forEach((k) => { e[k] = std.eigenschaften[k]; });
  return e;
}
function zustand(e, k) {
  const x = e && e[k];
  if (!x) return "feld_fehlt";
  if (x.nicht_anwendbar === true) return "nicht_anwendbar";
  const hat = k === "gwp" ? !!x.werte : (x.wert !== null && x.wert !== undefined && x.wert !== "");
  if (!hat) return "fehlt";
  if (x.art === "beispiel") return "beispiel";
  return "belegt";
}
const zeilen = [];
const summe = { belegt: 0, beispiel: 0, fehlt: 0, nicht_anwendbar: 0 };
const proKennwert = {};
DB.baustoffe.forEach((m) => {
  const e = wirksam(m), z = { id: m.id, name: m.name, werte: {} };
  KENNWERTE.forEach(([k]) => {
    let s = zustand(e, k); if (s === "feld_fehlt") s = "fehlt";
    z.werte[k] = s; summe[s]++;
    (proKennwert[k] = proKennwert[k] || { belegt: 0, beispiel: 0, fehlt: 0, nicht_anwendbar: 0 })[s]++;
  });
  zeilen.push(z);
});
const nProdukteMitPreis = PR.filter((p) => p.eigenschaften && p.eigenschaften.preis && istZahl(p.eigenschaften.preis.wert)).length;
const nPreisMaterial = zeilen.filter((z) => z.werte.preis === "belegt").length;
const stat = {
  baustoffe: DB.baustoffe.length, produkte: PR.length, quellen: (DB.quellen || []).length,
  kennwerteGesamt: DB.baustoffe.length * KENNWERTE.length, belegt: summe.belegt, beispiel: summe.beispiel, fehlt: summe.fehlt, nichtAnwendbar: summe.nicht_anwendbar,
  fehlendEchtdaten: summe.fehlt + summe.beispiel, materialienMitPreis: nPreisMaterial, produkteMitPreis: nProdukteMitPreis,
  proKennwert, fehler: errors.length, warnungen: warns.length
};

if (opt("--json")) { console.log(JSON.stringify(stat, null, 1)); process.exit(errors.length ? 1 : 0); }

console.log("MaterialMatch – Qualitätsprüfung der Baustoffdaten");
console.log("Daten: " + DATEN);
console.log(stat.baustoffe + " Baustoffe, " + stat.produkte + " Produkte, " + stat.quellen + " Quellen");
console.log("Kennwerte (" + stat.kennwerteGesamt + " = " + stat.baustoffe + " × " + KENNWERTE.length + ", Echtdaten-Modus, Standardprodukte eingerechnet): belegt " + stat.belegt + ", nur Beispiel " + stat.beispiel + ", nicht belegt " + stat.fehlt + ", nicht anwendbar " + stat.nichtAnwendbar);
console.log("Materialien mit belegtem Preis: " + stat.materialienMitPreis + " von " + stat.baustoffe + " · Produkte mit Preis: " + stat.produkteMitPreis);
console.log("\nFEHLER: " + errors.length);
errors.slice(0, 80).forEach((m) => console.log("  ERROR " + m));
console.log("WARNUNGEN: " + warns.length);
warns.slice(0, 25).forEach((m) => console.log("  WARN  " + m));
if (warns.length > 25) console.log("  … " + (warns.length - 25) + " weitere Warnungen (mit --bericht in DATENLUECKEN.md)");

// ---------- Bericht ----------
if (opt("--bericht")) {
  const GRUND = {
    preis: "Kein frei abrufbarer deutscher Händler- oder Herstellerpreis gefunden (BKI-Baupreise kostenpflichtig; HORNBACH, BAUHAUS, OBI und viele Händler blockieren automatische Abrufe, das wurde nicht umgangen; Heinze verbietet automatisches Auslesen). Preise stehen bei Produkten mit Preisliste und als Preisspanne bei allgemeinen Baustoffen mit mindestens zwei belegten Produktpreisen.",
    rohdichte: "Der ÖKOBAUDAT-Datensatz nennt für dieses Material keine Rohdichte.",
    waermeleitfaehigkeit: "Bemessungs- und Nennwerte stehen in kostenpflichtigen Normen (DIN 4108-4, DIN EN ISO 10456); für das allgemeine Material liegt kein frei zugänglicher, passender Herstellerwert vor. Produkte mit Herstellerangabe tragen ihre eigenen Werte.",
    waermeleitfaehigkeit_bemessung: "Der Bemessungswert nach DIN 4108-4 bzw. Zulassung ist kostenpflichtig oder produktspezifisch; ein Wert wird nur bei Produkten mit Herstellerangabe für Deutschland geführt.",
    waermekapazitaet: "Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben gibt es nur für einzelne Produkte.",
    druckfestigkeit: "Für das allgemeine Material gibt es keine einheitliche Druckfestigkeit (Klasse hängt vom Produkt ab); belegte Klassenwerte stehen bei Produkten.",
    brandverhalten: "Keine ohne Prüfung gültige EU-Einstufung gefunden, die auf das allgemeine Material zutrifft; die EU-Entscheidungen 2003/593/EG u. a. waren am 18.11.2026 nicht abrufbar (EUR-Lex antwortet mit einer Bot-Prüfung, nicht umgangen).",
    wasserdampf_mu: "Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben nur für einzelne Produkte.",
    gwp: "Es gibt keinen passenden ÖKOBAUDAT-Datensatz für dieses Material.",
    recycling: "Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein."
  };
  const sym = { belegt: "belegt", beispiel: "nur Beispiel", fehlt: "FEHLT", nicht_anwendbar: "n. a." };
  let md = "# MaterialMatch – weiterhin fehlende Kennwerte und Gründe\n\n";
  md += "Erzeugt am " + new Date().toISOString().slice(0, 10) + " mit `node tools/pruefe_datenqualitaet.js --bericht` (Daten: " + path.relative(PROJ, DATEN) + ").\n\n";
  md += "**Zählweise:** Es zählt, was im Echtdaten-Modus sichtbar ist. Ein Kennwert ist *belegt*, wenn ein Wert mit Datenart Richtwert/verifiziert und Quelle vorliegt (Standardprodukte überlagern das allgemeine Material). *Nur Beispiel* = Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). *Fehlt* = trotz Recherche kein belastbarer Wert. *n. a.* = fachlich nicht sinnvoll.\n\n";
  md += "## Überblick\n\n";
  md += "| | Anzahl |\n|---|---|\n| Baustoffe | " + stat.baustoffe + " |\n| Produkte | " + stat.produkte + " |\n| Quellen | " + stat.quellen + " |\n| Kennwert-Felder (" + stat.baustoffe + " × " + KENNWERTE.length + ") | " + stat.kennwerteGesamt + " |\n| belegt | " + stat.belegt + " |\n| nur Beispiel | " + stat.beispiel + " |\n| fehlt | " + stat.fehlt + " |\n| nicht anwendbar | " + stat.nichtAnwendbar + " |\n| Materialien mit belegtem Preis | " + stat.materialienMitPreis + " von " + stat.baustoffe + " |\n| Produkte mit Preis | " + stat.produkteMitPreis + " |\n\n";
  md += "## Je Kennwert\n\n| Kennwert | belegt | nur Beispiel | fehlt | n. a. | Grund, weshalb Lücken bleiben |\n|---|---|---|---|---|---|\n";
  KENNWERTE.forEach(([k, n]) => { const c = proKennwert[k]; md += "| " + n + " | " + c.belegt + " | " + c.beispiel + " | " + c.fehlt + " | " + c.nicht_anwendbar + " | " + (GRUND[k] || "") + " |\n"; });
  md += "\n## Je Baustoff\n\n| Baustoff | " + KENNWERTE.map((x) => x[1].split(" ")[0]).join(" | ") + " |\n|---|" + KENNWERTE.map(() => "---").join("|") + "|\n";
  zeilen.forEach((z) => { md += "| " + z.name + " | " + KENNWERTE.map(([k]) => sym[z.werte[k]]).join(" | ") + " |\n"; });
  md += "\n## Lückenliste (jeder fehlende Kennwert mit Begründung)\n\n";
  zeilen.forEach((z) => {
    const m = DB.baustoffe.find((b) => b.id === z.id), e = wirksam(m);
    const fehl = KENNWERTE.filter(([k]) => z.werte[k] === "fehlt" || z.werte[k] === "beispiel");
    if (!fehl.length) return;
    md += "### " + z.name + " (`" + z.id + "`)\n\n";
    fehl.forEach(([k, n]) => {
      const x = e[k]; let grund = x && x.hinweis ? x.hinweis : GRUND[k];
      if (z.werte[k] === "beispiel") grund = "Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). " + GRUND[k];
      md += "- **" + n + ":** " + grund.replace(/\s+/g, " ") + "\n";
    });
    md += "\n";
  });
  md += "## Quellen, die nicht (oder nicht für Zahlenwerte) nutzbar waren\n\n";
  md += "- **Heinze** (www.heinze.de): Die Nutzungsbedingungen verbieten automatisiertes Auslesen und das Einspeichern in fremde Datenbanken (§ 1.6, § 5.4); nicht genutzt (RECHERCHE.md, Abschnitt 2h).\n";
  md += "- **WECOBIS** (www.wecobis.de): erreichbar, enthält aber überwiegend beschreibende Texte (Rohstoffe, Herstellung, Entsorgung) statt Zahlenwerte; Vervielfältigung nur mit Genehmigung der Bayerischen Architektenkammer; nichts übernommen.\n";
  md += "- **baubook** (www.baubook.info): öffentliche Seiten ohne Kennwerttabellen; die Materialdatenbank (baubook.at) verlangt eine Anmeldung; nichts übernommen.\n";
  md += "- **EUR-Lex** (Entscheidungen zum Brandverhalten ohne Prüfung): am 18.11.2026 mit Bot-Prüfung (HTTP 202, AWS WAF) beantwortet; nicht umgangen.\n";
  md += "- **OBI, HORNBACH, BAUHAUS, Knauf, ISOVER**: automatische Abrufe blockiert (Bot-Abwehr); nicht umgangen.\n";
  md += "- **Normen** (DIN 4108-4, DIN EN ISO 10456, DIN EN 1745, DIN EN 12524): kostenpflichtig, nicht eingesehen.\n";
  fs.writeFileSync(path.join(PROJ, "DATENLUECKEN.md"), md);
  console.log("\nDATENLUECKEN.md geschrieben (" + md.length + " Zeichen).");
}
process.exit(errors.length ? 1 : 0);
