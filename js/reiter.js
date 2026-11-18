/* ==========================================================================
   MaterialMatch – Hauptreiter (MaterialMatch 2.0, Schritt 2)
   --------------------------------------------------------------------------
   Fünf Reiter: Entdecken, Vergleich, Match finden (Hauptbereiche) sowie Alternativen und Quellen & Details (weitere Bereiche).
   Beim Start ist „Vergleich“ geöffnet (Adresse #entdecken öffnet das Entdecken).
   Ein Reiterwechsel blendet nur Bereiche ein oder aus (Attribut "hidden").
   Nichts wird gelöscht oder neu geladen: Auswahl, Eingaben und Berechnungen
   bleiben erhalten, und alle Bereiche werden weiter aktualisiert.

   Bedienung: Klick, Pfeil links/rechts (mit Umlauf), Pos1 und Ende.
   Adresse: #entdecken, #vergleich, #match, #alternativen oder #quellen öffnet den Reiter direkt.
   Im Ausdruck zeigt css/style.css die Bereiche Vergleich, Alternativen und Quellen (der Match-Bereich ist eine Bildschirmfunktion).
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var IDS = ["entdecken", "vergleich", "match", "alternativen", "quellen"];
  var aktiv = "vergleich";
  var knoepfe = {};
  var bereiche = {};

  function aus(hash) {
    var h = String(hash || "").replace(/^#/, "");
    return IDS.indexOf(h) !== -1 ? h : null;
  }

  function zeige(id, optionen) {
    if (IDS.indexOf(id) === -1) return false;
    optionen = optionen || {};
    aktiv = id;
    IDS.forEach(function (x) {
      var an = x === id;
      knoepfe[x].setAttribute("aria-selected", an ? "true" : "false");
      knoepfe[x].tabIndex = an ? 0 : -1;
      bereiche[x].hidden = !an;
    });
    if (optionen.fokus) knoepfe[id].focus();
    if (optionen.hash !== false && root.history && root.history.replaceState && root.location && /^https?:|^file:/.test(root.location.protocol)) {
      try { root.history.replaceState(null, "", "#" + id); } catch (e) { /* in manchen Umgebungen nicht erlaubt */ }
    }
    // Verborgene Tabellen hatten Breite 0: Scrollbereiche jetzt neu prüfen
    if (MM.oberflaeche && MM.oberflaeche.scrollbereicheAktualisieren) MM.oberflaeche.scrollbereicheAktualisieren();
    document.dispatchEvent(new CustomEvent("mm:reiter", { detail: { reiter: id } }));
    return true;
  }

  function tastatur(e) {
    var i = IDS.indexOf(aktiv), ziel = null;
    if (e.key === "ArrowRight") ziel = IDS[(i + 1) % IDS.length];
    else if (e.key === "ArrowLeft") ziel = IDS[(i + IDS.length - 1) % IDS.length];
    else if (e.key === "Home") ziel = IDS[0];
    else if (e.key === "End") ziel = IDS[IDS.length - 1];
    if (!ziel) return;
    e.preventDefault();
    zeige(ziel, { fokus: true });
  }

  MM.reiter = {
    IDS: IDS,
    aktiv: function () { return aktiv; },
    zeige: function (id) { return zeige(id); },
    init: function () {
      IDS.forEach(function (id) {
        knoepfe[id] = document.getElementById("reiter-" + id);
        bereiche[id] = document.getElementById("bereich-" + id);
      });
      if (!IDS.every(function (id) { return knoepfe[id] && bereiche[id]; })) return;
      IDS.forEach(function (id) {
        knoepfe[id].addEventListener("click", function () { zeige(id); });
        knoepfe[id].addEventListener("keydown", tastatur);
      });
      root.addEventListener("hashchange", function () { var h = aus(root.location.hash); if (h && h !== aktiv) zeige(h, { hash: false }); });
      zeige(aus(root.location && root.location.hash) || "vergleich", { hash: false });
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
