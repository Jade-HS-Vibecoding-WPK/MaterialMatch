/* ==========================================================================
   MaterialMatch – Verhalten der Oberfläche (Schritt 12)
   --------------------------------------------------------------------------
   - Ergebnisse, Diagramme und Alternativen sind anfangs zugeklappt und öffnen
     sich automatisch, sobald ein Material gewählt wird (einmalig).
   - Auf schmalen Bildschirmen (Handy) bleibt dabei nur der erste Unterabschnitt
     der Ergebnisse offen, damit die Seite kurz bleibt.
   - Schaltfläche "Alle auf- bzw. zuklappen" für die Unterabschnitte.
   - Die Dropdown-Felder zeigen den vollständigen Namen als Tooltip.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var gestartet = false;

  var PANELS = [];   // nichts öffnet sich von selbst: Diagramme und Alternativen sind keine aufklappbaren Bereiche mehr, „Alle technischen Eigenschaften“ (#ergebnisse) bleibt zu, bis man es öffnet

  function unterabschnitte() {
    return [].slice.call(document.querySelectorAll("#ergebnisse details.sub"));
  }

  function schmal() {
    return !!(root.matchMedia && root.matchMedia("(max-width: 720px)").matches);
  }

  function schalterBeschriften() {
    var knopf = document.getElementById("alle-umschalten");
    if (!knopf) return;
    var alleOffen = unterabschnitte().every(function (d) { return d.open; });
    knopf.textContent = alleOffen ? "Alle Abschnitte zuklappen" : "Alle Abschnitte aufklappen";
    knopf.setAttribute("aria-expanded", String(alleOffen));
  }

  // Beim ersten gewählten Material: die Ergebnisbereiche öffnen
  function ersterStart() {
    if (gestartet) return;
    if (!MM.auswahl.holeAuswahl().plaetze.length) return;
    gestartet = true;
    PANELS.forEach(function (id) {
      var d = document.querySelector("#" + id + " > details");
      if (d) d.open = true;
    });
    if (schmal()) {
      unterabschnitte().forEach(function (d, i) { d.open = i === 0; });
    }
    schalterBeschriften();
  }

  function tooltipsSetzen() {
    ["kategorie", "materialA", "materialB", "materialC", "anwendung", "prioritaet"].forEach(function (id) {
      var s = document.getElementById(id);
      if (!s || !s.options.length) return;
      var o = s.options[s.selectedIndex];
      s.title = o ? o.textContent : "";
    });
  }

  // Tabellen, die breiter als ihr Rahmen sind (v. a. am Handy), müssen sich per Tastatur scrollen lassen:
  // Sie bekommen dann den Tabulator-Fokus und eine Beschriftung. Passt die Tabelle, bleibt sie ohne Fokus.
  function scrollbereicheAktualisieren() {
    [].forEach.call(document.querySelectorAll(".table-wrap"), function (w) {
      var scrollbar = w.scrollWidth > w.clientWidth + 1;
      if (scrollbar && !w.hasAttribute("tabindex")) {
        w.setAttribute("tabindex", "0");
        w.setAttribute("role", "group");
        w.setAttribute("aria-label", "Tabelle, mit den Pfeiltasten seitlich scrollbar");
      } else if (!scrollbar && w.hasAttribute("tabindex") && w.getAttribute("role") === "group") {
        w.removeAttribute("tabindex");
        w.removeAttribute("role");
        w.removeAttribute("aria-label");
      }
    });
  }

  var scrollTimer = null;
  function scrollbereicheSpaeter() {
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(scrollbereicheAktualisieren, 50);
  }

  MM.oberflaeche = {
    scrollbereicheAktualisieren: scrollbereicheAktualisieren,
    // Für Tests und Aufrufe von außen
    istGestartet: function () { return gestartet; },
    init: function () {
      // Wegweiser „1 Überblick · 2 Visuelle Auswertung · 3 Technische Details“ erst zeigen, wenn Materialien gewählt sind
      function ebenenZeigen() {
        var n = root.MM.auswahl ? root.MM.auswahl.holeAuswahl().plaetze.length : 0;
        [].forEach.call(document.querySelectorAll(".ebene"), function (e) { e.hidden = n === 0; });
      }
      document.addEventListener("mm:auswahl", ebenenZeigen);
      ebenenZeigen();
      document.addEventListener("mm:auswahl", function () { ersterStart(); tooltipsSetzen(); });
      document.addEventListener("mm:prioritaet", tooltipsSetzen);
      ["kategorie", "materialA", "materialB", "materialC", "anwendung", "prioritaet"].forEach(function (id) {
        var s = document.getElementById(id);
        if (s) s.addEventListener("change", tooltipsSetzen);
      });

      var knopf = document.getElementById("alle-umschalten");
      if (knopf) {
        knopf.addEventListener("click", function () {
          var alleOffen = unterabschnitte().every(function (d) { return d.open; });
          unterabschnitte().forEach(function (d) { d.open = !alleOffen; });
          schalterBeschriften();
        });
      }
      // Das Öffnen/Schließen einzelner Abschnitte aktualisiert die Beschriftung (toggle bubbelt nicht)
      unterabschnitte().forEach(function (d) { d.addEventListener("toggle", schalterBeschriften); });
      schalterBeschriften();
      tooltipsSetzen();
      if (MM.begriffe) MM.begriffe.init();

      // Scrollbare Tabellen: bei jeder Änderung der Seite, beim Auf-/Zuklappen und bei geänderter Fenstergröße prüfen
      if (root.MutationObserver) new root.MutationObserver(scrollbereicheSpaeter).observe(document.querySelector("main"), { childList: true, subtree: true });
      document.addEventListener("toggle", scrollbereicheSpaeter, true);
      root.addEventListener("resize", scrollbereicheSpaeter);
      scrollbereicheAktualisieren();
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
