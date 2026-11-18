/* ==========================================================================
   MaterialMatch – Optionale Auswahlfunktionen (MaterialMatch 2.0, Schritt 3)
   --------------------------------------------------------------------------
   In der Materialauswahl sind zunächst nur Kategorie, Material A und Material B sichtbar.
   Drei Schaltflächen blenden Weiteres ein:
     + Drittes Material hinzufügen   (Material C; zweiter Klick entfernt es wieder)
     Herstellerprodukt auswählen     (Produktfelder zu Material A, B, C)
     Eigenes Produkt hinzufügen      (Formular aus js/produktformular.js)
   Ausgeblendete Felder behalten ihre IDs und ihre Werte. Ist ein Material C oder ein
   nicht voreingestelltes Produkt gewählt (z. B. durch „Alternative vergleichen“),
   erscheinen die zugehörigen Felder automatisch.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var teile = {};

  function setzeSichtbar(knopf, an, textAn, textAus) {
    knopf.setAttribute("aria-expanded", String(an));
    if (textAn) knopf.textContent = an ? textAn : textAus;
  }

  function drittesAn(an) {
    teile.feldC.hidden = !an;
    teile.grid.classList.toggle("mit-c", an);
    setzeSichtbar(teile.knopfC, an, "– Drittes Material entfernen", "+ Drittes Material hinzufügen");
  }

  function produkteAn(an) {
    [].forEach.call(document.querySelectorAll("#auswahl .produkt-zeile"), function (z) { z.hidden = !an; });
    teile.hinweis.hidden = !an;
    setzeSichtbar(teile.knopfP, an, "Produktauswahl ausblenden", "Herstellerprodukt auswählen");
  }

  function eigenesAn(an) {
    teile.eigenWrap.hidden = !an;
    setzeSichtbar(teile.knopfE, an, "Eigenes Produkt ausblenden", "Eigenes Produkt hinzufügen");
  }

  // Passt die Anzeige an die aktuelle Auswahl an (öffnet nur, schließt nie von selbst)
  function abgleichen() {
    var a = MM.auswahl.holeAuswahl();
    var hatC = a.plaetze.some(function (p) { return p.buchstabe === "C"; });
    // Ein vom Standard abweichendes Produkt (auch „generisch“, wenn ein Standardprodukt existiert) ist gewählt
    var anderesProdukt = a.plaetze.some(function (p) {
      return p.produkt && p.produkt.id !== MM.produkte.aufloesen(p.material.id, "");
    });
    if (hatC && teile.feldC.hidden) drittesAn(true);
    if (anderesProdukt && teile.hinweis.hidden) produkteAn(true);
  }

  MM.auswahlOptionen = {
    zeigeDrittes: drittesAn,
    zeigeProdukte: produkteAn,
    zeigeEigenes: eigenesAn,
    init: function () {
      teile.grid = document.getElementById("auswahl-grid");
      teile.feldC = document.getElementById("feld-materialC");
      teile.knopfC = document.getElementById("btn-drittes");
      teile.knopfP = document.getElementById("btn-produkt");
      teile.knopfE = document.getElementById("btn-eigen");
      teile.hinweis = document.getElementById("produkt-hinweis");
      teile.eigenWrap = document.getElementById("eigenes-produkt-wrap");
      if (!teile.grid || !teile.feldC || !teile.knopfC || !teile.knopfP || !teile.knopfE || !teile.hinweis || !teile.eigenWrap) return;

      teile.knopfC.addEventListener("click", function () {
        if (teile.feldC.hidden) {
          drittesAn(true);
          document.getElementById("materialC").focus();
        } else {
          // Material C entfernen: nur ausblenden, wenn auch die Auswahl geleert wird (kein verstecktes Material)
          MM.auswahl.setzeAuswahl({ c: "" });
          drittesAn(false);
        }
      });
      teile.knopfP.addEventListener("click", function () { produkteAn(teile.hinweis.hidden); });
      teile.knopfE.addEventListener("click", function () {
        var an = teile.eigenWrap.hidden;
        eigenesAn(an);
        if (an) { var d = document.getElementById("eigenes-produkt"); if (d) d.open = true; }
      });
      document.addEventListener("mm:auswahl", abgleichen);
      abgleichen();
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
