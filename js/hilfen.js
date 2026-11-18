/* ==========================================================================
   MaterialMatch – kleine Hilfswerkzeuge, die mehrere Programmteile nutzen
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};

  // Erzeugt ein HTML-Element mit Text. Der Text wird nie als HTML gedeutet,
  // dadurch können Daten keinen Programmcode in die Seite einschleusen.
  MM.el = function (tag, text, klasse) {
    var e = document.createElement(tag);
    if (text !== undefined && text !== null) e.textContent = text;
    if (klasse) e.className = klasse;
    return e;
  };

  // Sucht in einer Liste den Eintrag mit der passenden id (oder null)
  MM.finde = function (liste, id) {
    for (var i = 0; i < liste.length; i++) {
      if (liste[i].id === id) return liste[i];
    }
    return null;
  };

  // ---------- Einstellungen der Bewertungsregeln (data/einstellungen.js) ----------
  // Werte werden bei jedem Aufruf frisch gelesen und geprüft; ungültige Werte werden durch Standardwerte ersetzt.
  var EINST_STANDARD = { prioritaetFaktor: 3, gleichSchwelle: 0.02, besserSchwelle: 0.05, maxEmpfehlungen: 3, beispieldatenStandard: false };
  var EINST_GRENZEN = { prioritaetFaktor: [1, 10], gleichSchwelle: [0, 0.2], besserSchwelle: [0, 0.5], maxEmpfehlungen: [1, 5] };
  var FAKTOR_WORT = { 1: "einfach", 2: "doppelt", 3: "dreifach", 4: "vierfach", 5: "fünffach" };

  function einstellungenPruefen(roh) {
    var werte = {}, probleme = [];
    Object.keys(EINST_STANDARD).forEach(function (k) {
      var v = roh ? roh[k] : undefined;
      if (v === undefined) { werte[k] = EINST_STANDARD[k]; return; }
      if (k === "beispieldatenStandard") {
        if (typeof v === "boolean") werte[k] = v; else { werte[k] = EINST_STANDARD[k]; probleme.push(k + ": muss true oder false sein"); }
        return;
      }
      var g = EINST_GRENZEN[k];
      if (typeof v !== "number" || !isFinite(v) || v < g[0] || v > g[1] || ((k === "prioritaetFaktor" || k === "maxEmpfehlungen") && v !== Math.round(v))) {
        werte[k] = EINST_STANDARD[k];
        probleme.push(k + ": „" + v + "“ ist ungültig (erlaubt: " + g[0] + " bis " + g[1] + (k === "prioritaetFaktor" || k === "maxEmpfehlungen" ? ", ganze Zahl" : "") + "); Standardwert " + EINST_STANDARD[k] + " wird verwendet");
      } else werte[k] = v;
    });
    return { werte: werte, probleme: probleme };
  }

  MM.einstellungen = {
    STANDARD: EINST_STANDARD,
    GRENZEN: EINST_GRENZEN,
    pruefe: einstellungenPruefen,
    hole: function () { return einstellungenPruefen(root.MATERIALMATCH_EINSTELLUNGEN).werte; },
    probleme: function () { return einstellungenPruefen(root.MATERIALMATCH_EINSTELLUNGEN).probleme; },
    // 3 -> "dreifach"; 7 -> "7-fach"
    faktorWort: function (n) { return FAKTOR_WORT[n] || (n + "-fach"); },
    // 0.02 -> "2 %"
    prozentText: function (x) { return String(Math.round(x * 1000) / 10).replace(".", ",") + " %"; }
  };

  // Wandelt eine Liste von ids in lesbare Namen um: ["tragend"] -> "Tragende Baustoffe"
  MM.namenAusIds = function (ids, katalog) {
    return ids.map(function (id) {
      var treffer = MM.finde(katalog, id);
      return treffer ? treffer.name : id;
    }).join(", ");
  };

  // Welche Datenarten kommen bei einem Baustoff vor? -> "Beispieldaten" usw.
  MM.datenartenText = function (baustoff) {
    var gefunden = {};
    Object.keys(baustoff.eigenschaften).forEach(function (k) {
      var art = baustoff.eigenschaften[k].art;
      if (art) gefunden[art] = true;
    });
    var namen = { verifiziert: "Verifiziert", richtwert: "Richtwert", beispiel: "Beispieldaten", eigen: "Eigene Angabe" };
    return Object.keys(gefunden).map(function (a) { return namen[a] || a; }).join(", ") || "–";
  };

})(typeof window !== "undefined" ? window : globalThis);
