/* ==========================================================================
   MaterialMatch (Version 8) – Logo-Auftakt
   --------------------------------------------------------------------------
   Bei JEDEM Seitenaufruf (neuer Tab, Neuladen, erneuter Besuch, GitHub Pages) steht zuerst ein reinweißer Bildschirm (#FFFFFF) mit dem
   vorhandenen MaterialMatch-Logo (img/logo.svg) exakt in der Mitte. Ablauf, gerechnet ab dem ersten sichtbaren Bild:
       Logo blendet ein 0,3 s  ·  voll sichtbar 1,6 s  ·  Bildschirm blendet aus 0,4 s  =  2,3 s.
   Der Ablauf selbst steht als CSS-Animation im <style id="auftakt-css"> im Kopf von index.html (er läuft damit auch dann zeitrichtig,
   wenn die Skripte langsam laden). Dieses Skript wartet nur auf das Ende der Animation und meldet es weiter (MM.auftakt.beiEnde),
   damit das Fenster „Kurz vorab“ erst DANACH erscheint.
   • Es wird nichts gespeichert: weder sessionStorage noch localStorage. Favoriten, Match-Antworten und Einstellungen bleiben unberührt.
   • Die Anwendung wird im Hintergrund aufgebaut und ist nach dem Auftakt sofort da (der Auftakt fängt keine Klicks ab).
   • „Bewegung reduzieren“ (prefers-reduced-motion): kein Ein- und Ausblenden; das Logo steht 1,6 s still und verschwindet dann.
     Das Fenster „Kurz vorab“ erscheint auch dann.
   • Ohne JavaScript wird der Auftakt per CSS ausgeblendet (<noscript> in index.html).
   • Die Tests schalten ihn aus (tests/_offline.js setzt window.__MM_OHNE_START__); die Adresse ?start=ja erzwingt ihn, ?start=nein schaltet ihn aus.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var ZEIT_RUHIG_MS = 1600;   // nur für „Bewegung reduzieren“: so lange steht das Logo still
  var SICHERUNG_MS = 4000;    // falls die Animation nie meldet (z. B. Seite im Hintergrund-Tab): spätestens dann weiter
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
    if (el) el.hidden = true;
    rufen();
  }

  function ruhig() { return !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches); }

  MM.auftakt = {
    GESAMT_MS: 2300,
    // wird von js/app.js aufgerufen, wenn die Anwendung aufgebaut ist; der Auftakt endet trotzdem erst nach der festen Zeit
    bereit: function () {},
    // Rückruf, sobald der Auftakt vollständig beendet ist (sofort, wenn er schon beendet oder ausgeschaltet ist)
    beiEnde: function (f) { if (fertig) f(); else rueckrufe.push(f); },
    beendet: function () { return fertig; }
  };

  el = document.getElementById("auftakt");
  if (ohneStart() || !el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
    el = null; fertig = true;
  } else if (ruhig()) {
    var seit = (root.performance && root.performance.now) ? root.performance.now() : 0;
    timer = setTimeout(ende, Math.max(ZEIT_RUHIG_MS - seit, 300));
  } else {
    el.addEventListener("animationend", function (e) { if (e.target === el && e.animationName === "auftakt-aus") ende(); });
    var laufend = el.getAnimations ? el.getAnimations() : null;   // Skripte langsam geladen und Animation schon vorbei?
    if (laufend && laufend.length && laufend.every(function (a) { return a.playState === "finished"; })) ende();
    else timer = setTimeout(ende, SICHERUNG_MS);
  }

})(typeof window !== "undefined" ? window : globalThis);
