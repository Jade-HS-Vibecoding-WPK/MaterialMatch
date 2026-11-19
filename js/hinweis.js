/* ==========================================================================
   MaterialMatch (Version 8) – Hinweis „Kurz vorab“
   --------------------------------------------------------------------------
   Ein schlichtes Fenster im Design der Seite: Logo, Überschrift, Text und der Knopf „Verstanden – MaterialMatch öffnen“.
   • Es erscheint bei JEDEM Seitenaufruf, und zwar erst NACH dem Ende des Logo-Auftakts (nie gleichzeitig).
     Frühere Bestätigungen werden nicht mehr gespeichert und nicht mehr ausgewertet (kein localStorage, kein sessionStorage).
     Ein früher angelegter Eintrag „materialmatch.hinweis.v1“ im Browser bleibt unbeachtet liegen; es wird nichts gelöscht.
   • Solange es offen ist, ist die Seite dahinter gesperrt (modales <dialog>); der Fokus liegt auf dem Knopf.
   • Knopf oder Escape schließen das Fenster; danach ist die Seite voll bedienbar.
   • Im Fuß der Seite („Hinweis „Kurz vorab“ erneut anzeigen“) lässt es sich jederzeit wieder öffnen.
   • Die Tests schalten das Fenster aus (window.__MM_OHNE_START__); die Adresse ?start=ja erzwingt es, ?start=nein schaltet es aus.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var dialog = null, ok = null, vorher = null;

  function ohneStart() {
    var q = root.location && root.location.search || "";
    if (/[?&]start=ja\b/.test(q)) return false;
    return !!root.__MM_OHNE_START__ || /[?&]start=nein\b/.test(q);
  }

  function zeige() {
    if (!dialog || dialog.open) return;
    vorher = document.activeElement;
    if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
    if (ok) ok.focus();
  }

  function schliesse() {
    if (dialog && dialog.open) { if (typeof dialog.close === "function") dialog.close(); else dialog.removeAttribute("open"); }
    if (vorher && document.contains(vorher) && vorher.focus) vorher.focus();
    vorher = null;
  }

  MM.hinweis = {
    zeige: zeige,
    schliesse: schliesse,
    istOffen: function () { return !!(dialog && dialog.open); },
    init: function () {
      dialog = document.getElementById("hinweis");
      ok = document.getElementById("hinweis-ok");
      if (!dialog || !ok) return;
      ok.addEventListener("click", schliesse);
      dialog.addEventListener("click", function (e) { if (e.target === dialog) schliesse(); });   // Klick auf den Hintergrund
      var erneut = document.getElementById("hinweis-erneut");
      if (erneut) erneut.addEventListener("click", zeige);
      if (ohneStart()) return;
      if (MM.auftakt && MM.auftakt.beiEnde) MM.auftakt.beiEnde(zeige); else zeige();
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
