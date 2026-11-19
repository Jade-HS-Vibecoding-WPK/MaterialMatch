/* ==========================================================================
   MaterialMatch 3.8 – Logo-Auftakt
   --------------------------------------------------------------------------
   Beim ersten Laden einer Browser-Sitzung steht das vorhandene MaterialMatch-Logo (img/logo.svg) mittig auf ruhigem Hintergrund:
   es blendet sanft ein (0,35 s), bleibt kurz voll sichtbar und blendet dann aus (0,3 s). Gesamtdauer etwa 1,3 Sekunden, gerechnet ab Seitenstart.
   • Der Seitenaufbau wird dadurch NICHT verzögert: Die Anwendung wird im Hintergrund aufgebaut und ist während des Auftakts bedienbar
     (der Auftakt fängt keine Klicks ab: pointer-events: none). Er läuft nur deshalb etwas länger, damit das Logo wahrgenommen wird.
   • Innerhalb derselben Browser-Sitzung (sessionStorage) läuft er nur einmal; ein kleines Skript in index.html blendet ihn sonst sofort aus.
   • Bei „Bewegung reduzieren“ (prefers-reduced-motion) gibt es kein Ein- und Ausblenden: der Auftakt verschwindet sofort.
   • Ohne JavaScript wird der Auftakt per CSS ausgeblendet (<noscript> in index.html).
   • Die Tests schalten ihn aus (tests/_offline.js setzt window.__MM_OHNE_START__); die Adresse ?start=ja erzwingt ihn.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var HALTEN_BIS = 1000, AUS_MS = 300;   // Logo bleibt bis 1,0 s nach Seitenstart voll sichtbar, dann 0,3 s Ausblenden = 1,3 s
  var SCHLUESSEL = "materialmatch.auftakt.v1";
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
    GESAMT_MS: HALTEN_BIS + AUS_MS,
    // wird von js/app.js aufgerufen, wenn alles aufgebaut ist; der Auftakt endet trotzdem erst nach der festen Zeit (siehe oben)
    bereit: function () {},
    beiEnde: function (f) { if (fertig && (!el || el.hidden)) f(); else rueckrufe.push(f); },
    beendet: function () { return fertig; }
  };

  el = document.getElementById("auftakt");
  if (ohneStart() || (el && el.hidden)) {   // ausgeschaltet oder in dieser Sitzung schon gezeigt
    if (el && el.parentNode) el.parentNode.removeChild(el);
    el = null; fertig = true;
  } else {
    try { root.sessionStorage.setItem(SCHLUESSEL, "1"); } catch (e) { /* ohne Speicher läuft er eben jedes Mal */ }
    var seit = (root.performance && root.performance.now) ? root.performance.now() : 0;
    timer = setTimeout(ende, Math.max(HALTEN_BIS - seit, 250));   // feste Zeit ab Seitenstart, danach Ausblenden
  }

})(typeof window !== "undefined" ? window : globalThis);
