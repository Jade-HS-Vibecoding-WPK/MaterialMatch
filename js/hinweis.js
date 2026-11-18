/* ==========================================================================
   MaterialMatch 3.7 – Hinweis „Kurz vorab“ beim ersten Besuch
   --------------------------------------------------------------------------
   Ein schlichtes Fenster im Design der Seite: Logo, Überschrift, Text und der Knopf „Verstanden – MaterialMatch öffnen“.
   • Es erscheint nur beim ersten Besuch (nach dem Logo-Auftakt). Die Bestätigung steht im Browser (localStorage).
   • Im Fuß der Seite („Hinweis „Kurz vorab“ erneut anzeigen“) lässt es sich jederzeit wieder öffnen.
   • Der Knopf schließt das Fenster; Escape schließt es ebenfalls, speichert dann aber keine Bestätigung.
   • Ist localStorage gesperrt (z. B. privates Fenster), merkt sich die Seite die Bestätigung nur bis zum Neuladen.
   • Die Tests schalten das Fenster aus (window.__MM_OHNE_START__); die Adresse ?start=ja erzwingt es.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var SCHLUESSEL = "materialmatch.hinweis.v1";
  var dialog = null, ok = null, vorher = null, imSpeicher = false;

  function ohneStart() {
    var q = root.location && root.location.search || "";
    if (/[?&]start=ja\b/.test(q)) return false;
    return !!root.__MM_OHNE_START__ || /[?&]start=nein\b/.test(q);
  }

  function bestaetigt() {
    try { return !!root.localStorage.getItem(SCHLUESSEL) || imSpeicher; } catch (e) { return imSpeicher; }
  }

  function speichern() {
    imSpeicher = true;
    try { root.localStorage.setItem(SCHLUESSEL, new Date().toISOString().slice(0, 10)); } catch (e) { /* ohne Speicher nur bis zum Neuladen */ }
  }

  function zeige() {
    if (!dialog || dialog.open) return;
    vorher = document.activeElement;
    if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
    if (ok) ok.focus();
  }

  function schliesse(mitSpeichern) {
    if (mitSpeichern) speichern();
    if (dialog && dialog.open) { if (typeof dialog.close === "function") dialog.close(); else dialog.removeAttribute("open"); }
    if (vorher && document.contains(vorher) && vorher.focus) vorher.focus();
    vorher = null;
  }

  MM.hinweis = {
    SCHLUESSEL: SCHLUESSEL,
    zeige: zeige,
    schliesse: function () { schliesse(false); },
    bestaetigt: bestaetigt,
    istOffen: function () { return !!(dialog && dialog.open); },
    init: function () {
      dialog = document.getElementById("hinweis");
      ok = document.getElementById("hinweis-ok");
      if (!dialog || !ok) return;
      ok.addEventListener("click", function () { schliesse(true); });
      dialog.addEventListener("click", function (e) { if (e.target === dialog) schliesse(false); });   // Klick auf den Hintergrund
      var erneut = document.getElementById("hinweis-erneut");
      if (erneut) erneut.addEventListener("click", zeige);
      if (ohneStart() || bestaetigt()) return;
      if (MM.auftakt && MM.auftakt.beiEnde) MM.auftakt.beiEnde(zeige); else zeige();
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
