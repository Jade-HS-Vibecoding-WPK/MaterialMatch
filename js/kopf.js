/* ==========================================================================
   MaterialMatch – Hauptaktionen im Kopfbereich (MaterialMatch 3.0)
   --------------------------------------------------------------------------
   Die drei Schaltflächen „Baustoffe entdecken“, „Baustoffe vergleichen“ und „Match finden“ wechseln in den
   passenden Reiter, scrollen zum Anfang des Bereichs und setzen den Tastaturfokus dorthin.
   Bereits gemachte Eingaben und Auswahlen bleiben dabei unverändert (es wird nur umgeschaltet).
   Ohne JavaScript funktionieren die Links trotzdem über die Adresse (#vergleich, #match).
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};

  // Wohin springt welche Aktion? (Kennung des Reiters -> Element, das oben im Bild stehen soll)
  var ZIELE = { entdecken: "entdecken-kopf", vergleich: "auswahl", match: "match" };

  function gehe(ziel) {
    if (!MM.reiter || !MM.reiter.zeige(ziel)) return false;
    var anker = document.getElementById(ZIELE[ziel]);
    var bereich = document.getElementById("bereich-" + ziel);
    if (anker && anker.scrollIntoView) anker.scrollIntoView({ block: "start" });
    if (bereich && bereich.focus) bereich.focus({ preventScroll: true });
    return true;
  }

  MM.kopf = {
    gehe: gehe,
    init: function () {
      [].forEach.call(document.querySelectorAll(".kopf-knopf[data-ziel]"), function (a) {
        a.addEventListener("click", function (e) {
          if (gehe(a.getAttribute("data-ziel"))) e.preventDefault();
        });
      });
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
