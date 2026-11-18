/* ==========================================================================
   MaterialMatch 3.7 – Logo-Auftakt
   --------------------------------------------------------------------------
   Beim Laden steht das vorhandene MaterialMatch-Logo (img/logo.svg) mittig auf ruhigem Hintergrund und blendet sanft ein.
   Sobald die Seite bereit ist, blendet es aus. Es gibt KEINE künstliche Wartezeit: Der Auftakt endet, wenn die Seite fertig
   geladen ist, spätestens nach 0,8 Sekunden (plus 0,2 Sekunden Ausblenden = höchstens 1 Sekunde). Kein Ton.
   • Die Anwendung ist währenddessen schon bedienbar (der Auftakt fängt keine Klicks ab: pointer-events: none).
   • Bei „Bewegung reduzieren“ (prefers-reduced-motion) gibt es kein Ein- und Ausblenden: der Auftakt verschwindet sofort.
   • Ohne JavaScript wird der Auftakt per CSS ausgeblendet (<noscript> in index.html).
   • Die Tests schalten ihn aus (tests/_offline.js setzt window.__MM_OHNE_START__); die Adresse ?start=ja erzwingt ihn.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var MAX_MS = 800, AUS_MS = 200;
  var el = null, fertig = false, timer = null, rueckrufe = [];

  function ohneStart() {
    var q = root.location && root.location.search || "";
    if (/[?&]start=ja\b/.test(q)) return false;
    return !!root.__MM_OHNE_START__ || /[?&]start=nein\b/.test(q);
  }

  function rufen() { var l = rueckrufe.slice(); rueckrufe = []; l.forEach(function (f) { try { f(); } catch (e) { /* ein Fehler im Rückruf stoppt nichts */ } }); }

  function ende() {
    if (fertig) return;
    fertig = true;
    if (timer) { clearTimeout(timer); timer = null; }
    if (!el) { rufen(); return; }
    var ruhig = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (ruhig) { el.hidden = true; rufen(); return; }
    el.classList.add("weg");
    setTimeout(function () { el.hidden = true; rufen(); }, AUS_MS);
  }

  MM.auftakt = {
    MAX_MS: MAX_MS + AUS_MS,
    // wird von js/app.js aufgerufen, wenn alles aufgebaut ist; wartet nur noch auf das Ladeereignis der Seite
    bereit: function () {
      if (fertig) return;
      if (document.readyState === "complete") ende();
      else root.addEventListener("load", ende);
    },
    beiEnde: function (f) { if (fertig && (!el || el.hidden)) f(); else rueckrufe.push(f); },
    beendet: function () { return fertig; }
  };

  el = document.getElementById("auftakt");
  if (ohneStart()) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
    el = null; fertig = true;
  } else {
    timer = setTimeout(ende, MAX_MS);   // Sicherung: nie länger als 1 Sekunde (auch wenn die Seite sehr langsam lädt oder ein Fehler auftritt)
  }

})(typeof window !== "undefined" ? window : globalThis);
