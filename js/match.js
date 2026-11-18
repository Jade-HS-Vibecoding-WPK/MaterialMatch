/* ==========================================================================
   MaterialMatch – Steuerung des Bereichs „Match finden“ (MaterialMatch 3.0)
   --------------------------------------------------------------------------
   Verbindet Interview (js/interview.js), Matching-Logik (js/matching.js), Swipe-Karten (js/swipe.js) und
   Favoriten (js/favoriten.js). Die Antworten des Interviews werden im Browser gespeichert (localStorage), damit
   nach dem Neuladen nicht von vorn begonnen werden muss. Es gibt keine Anmeldung und keine Datenbank.

   Zwei Ansichten: „Interview“ (Fragen) und „Karten“ (Swipe). Wechselt der Datenmodus (Demo/Echtdaten), werden die
   Karten neu berechnet; Antworten und Favoriten bleiben erhalten.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var SCHLUESSEL = "materialmatch.match.v1";
  var box = null;
  var antworten = null;
  var ansicht = "interview";
  var letztes = null;       // letztes Matching-Ergebnis
  var gelockert = [];       // gelockerte Wünsche (natuerlich, materialart); gilt nur für die aktuelle Sitzung und wird bei neuen Antworten zurückgesetzt
  var speicherGeht = true;

  function laden() {
    try {
      var t = root.localStorage.getItem(SCHLUESSEL);
      return t ? JSON.parse(t).antworten : null;
    } catch (e) { speicherGeht = false; return null; }
  }
  function speichern() {
    try { root.localStorage.setItem(SCHLUESSEL, JSON.stringify({ antworten: antworten, stand: new Date().toISOString().slice(0, 10) })); }
    catch (e) { speicherGeht = false; }
  }

  function ersterOffenerSchritt(a) {
    if (!a.einsatz) return 0;
    if (!a.prioritaeten.length) return 1;
    if (!a.anforderungen.length) return 2;
    if (!a.kosten) return 3;
    if (!a.materialart) return 4;
    return 0;
  }

  function zeigeInterview(schritt) {
    ansicht = "interview";
    MM.interview.zeige(box, antworten, {
      schritt: schritt === undefined ? ersterOffenerSchritt(antworten) : schritt,
      beiAenderung: function (a) { antworten = a; speichern(); },
      beiFertig: function (a) { antworten = a; speichern(); zeigeKarten(); }
    });
  }

  function zeigeKarten() {
    ansicht = "karten";
    letztes = MM.matching.berechne(antworten, { gelockert: gelockert });
    MM.swipe.zeige(box, letztes, {
      beiAenderung: function () { gelockert = []; zeigeInterview(0); },
      beiLockern: function (id, an) {
        gelockert = gelockert.filter(function (x) { return x !== id; });
        if (an) gelockert.push(id);
        zeigeKarten();
      }
    });
    document.dispatchEvent(new CustomEvent("mm:match", { detail: { ansicht: ansicht } }));
  }

  MM.match = {
    SCHLUESSEL: SCHLUESSEL,
    antworten: function () { return MM.matching.normalisiereAntworten(antworten); },
    ergebnis: function () { return letztes; },
    ansicht: function () { return ansicht; },
    zeigeInterview: zeigeInterview,
    zeigeKarten: zeigeKarten,
    // Alles zurücksetzen (Antworten); Favoriten bleiben
    gelockert: function () { return gelockert.slice(); },
    neuStarten: function () { gelockert = []; antworten = MM.matching.normalisiereAntworten({}); speichern(); zeigeInterview(0); },
    speicherOk: function () { return speicherGeht; },
    init: function () {
      box = document.getElementById("match-inhalt");
      if (!box || !MM.interview || !MM.swipe || !MM.matching) return;
      antworten = MM.matching.normalisiereAntworten(laden() || {});
      if (MM.matching.vollstaendig(antworten)) zeigeKarten(); else zeigeInterview();
      // Datenmodus gewechselt: Karten mit den neuen Werten neu aufbauen
      document.addEventListener("mm:daten", function () { if (ansicht === "karten") zeigeKarten(); });
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
