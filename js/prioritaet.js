/* ==========================================================================
   MaterialMatch – Vergleichspriorität (Schritt 9)
   --------------------------------------------------------------------------
   Der eine zentrale Ort für die Auswahl "Was ist Ihnen besonders wichtig?".
   Diagramme und Empfehlungen lesen die Priorität von hier und aktualisieren
   sich bei der Nachricht "mm:prioritaet".

   Mögliche Werte: "ausgewogen" (Standard), "kosten", "co2", "gewicht", "waerme".
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var aktuell = "ausgewogen";
  var feld = null;

  // Reihenfolge im Auswahlfeld (Standard zuerst)
  var REIHENFOLGE = ["ausgewogen", "kosten", "co2", "gewicht", "waerme"];

  function gueltig(p) {
    return REIHENFOLGE.indexOf(p) !== -1;
  }

  function benachrichtigen() {
    document.dispatchEvent(new CustomEvent("mm:prioritaet", { detail: { prioritaet: aktuell } }));
  }

  MM.prioritaet = {
    REIHENFOLGE: REIHENFOLGE,

    holen: function () { return aktuell; },

    // Setzt die Priorität (auch von außen, z. B. in Tests). Ungültige Werte werden ignoriert.
    setzen: function (p) {
      if (!gueltig(p) || p === aktuell) return;
      aktuell = p;
      if (feld) feld.value = p;
      benachrichtigen();
    },

    init: function () {
      feld = document.getElementById("prioritaet");
      if (!feld) return;
      var namen = (MM.empfehlung && MM.empfehlung.PRIORITAETEN) || {};
      feld.textContent = "";
      REIHENFOLGE.forEach(function (id) {
        var o = MM.el("option", namen[id] || id);
        o.value = id;
        feld.appendChild(o);
      });
      feld.value = aktuell;
      feld.disabled = false;
      feld.addEventListener("change", function () {
        if (!gueltig(feld.value)) { feld.value = aktuell; return; }
        if (feld.value === aktuell) return;          // keine echte Änderung
        aktuell = feld.value;
        benachrichtigen();
      });
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
