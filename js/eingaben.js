/* ==========================================================================
   MaterialMatch – Eingabefelder (Schritt 4)
   --------------------------------------------------------------------------
   Liest Bauteilfläche und Materialdicke, prüft sie mit js/berechnung.js,
   zeigt Fehlermeldungen direkt unter dem Feld und sendet bei jeder Änderung
   die Nachricht "mm:eingaben". Spätere Programmteile lesen den Stand mit
   MM.eingaben.hole().
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var felder = {};
  var letzterStand = null;

  function lesen() {
    return MM.berechnung.pruefeEingaben({
      flaecheText: felder.flaeche.value,
      dickeText: felder.dicke.value,
      dickeEinheit: felder.einheit.value
    });
  }

  function meldungZeigen(feld, meldungsFeld, text) {
    meldungsFeld.textContent = text || "";
    if (text) {
      feld.classList.add("is-invalid");
      feld.setAttribute("aria-invalid", "true");
    } else {
      feld.classList.remove("is-invalid");
      feld.removeAttribute("aria-invalid");
    }
  }

  function aktualisieren() {
    letzterStand = lesen();
    meldungZeigen(felder.flaeche, felder.flaecheFehler, letzterStand.fehler.flaeche);
    meldungZeigen(felder.dicke, felder.dickeFehler, letzterStand.fehler.dicke);
    document.dispatchEvent(new CustomEvent("mm:eingaben", { detail: letzterStand }));
  }

  MM.eingaben = {
    // Aktueller geprüfter Stand der Eingaben (siehe pruefeEingaben in berechnung.js)
    hole: function () { return letzterStand || lesen(); },

    init: function () {
      felder.flaeche = document.getElementById("flaeche");
      felder.dicke = document.getElementById("dicke");
      felder.einheit = document.getElementById("dickeEinheit");
      felder.flaecheFehler = document.getElementById("flaeche-fehler");
      felder.dickeFehler = document.getElementById("dicke-fehler");
      if (!felder.flaeche || !felder.dicke || !felder.einheit) return;

      [felder.flaeche, felder.dicke].forEach(function (f) {
        f.disabled = false;
        f.addEventListener("input", aktualisieren);
      });
      felder.einheit.disabled = false;
      felder.einheit.addEventListener("change", aktualisieren);

      letzterStand = lesen();
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
