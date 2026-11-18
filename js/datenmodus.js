/* ==========================================================================
   MaterialMatch – Datenmodus: Demo (Beispieldaten) oder Echtdaten
   --------------------------------------------------------------------------
   Die Beispielwerte (art "beispiel"; derzeit 92) bleiben für Demonstrationen erhalten, dürfen aber
   nie wie geprüfte Echtwerte wirken:

   Demo-Modus      Beispieldaten werden verwendet und überall mit „B“, farbiger Hinterlegung
                   und einem Hinweisbalken als Beispieldaten gekennzeichnet.
   Echtdaten-Modus Beispieldaten gelten als „nicht verfügbar“: Berechnungen, Diagramme und
                   Empfehlungen verwenden nur belegte Werte (Richtwert, verifiziert).

   Beim Wechsel werden die Eigenschaften der Baustoffe in den vorhandenen Objekten ersetzt
   (aus einer Originalkopie), damit alle Module weiter dieselben Objekte sehen. Danach melden
   „mm:daten“ und „mm:auswahl“ allen Anzeigen, dass sie neu zeichnen sollen.
   Der Start-Modus steht in data/einstellungen.js (beispieldatenStandard).
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var original = null;
  var beispieleAktiv = true;

  var NV_TEXT = "Nicht verfügbar im Echtdaten-Modus: Für diesen Kennwert liegt nur ein Beispielwert (Demo) vor, keine belegte Angabe.";
  var TEXT_DEMO = "Demo-Modus: Alle mit B gekennzeichneten und gelb hinterlegten Werte sind frei gewählte Beispieldaten. " +
    "Sie sind keine geprüften Echtwerte und nicht für reale Entscheidungen geeignet. Belegte Werte (R, V) haben eine Quelle mit Link; " +
    "Richtwerte (R) dienen nur der Orientierung.";
  var TEXT_ECHT = "Echtdaten-Modus: Beispieldaten werden wie „nicht verfügbar“ behandelt. Berechnungen, Diagramme und Empfehlungen " +
    "verwenden nur belegte Werte (R, V). Deshalb fehlen viele Preise und Kennwerte. Richtwerte (R) dienen nur der Orientierung " +
    "und erlauben keine verlässliche Produkt- oder Kostenberechnung. Zum Ausprobieren lässt sich der Demo-Modus einschalten.";

  // Hinweis „nur zur Orientierung“ für die gewählten Materialien (leer, wenn nichts auszusagen ist)
  var ORIENT_RICHTWERT = "Nur zur Orientierung: Mit R gekennzeichnete Werte sind Richtwerte, also generische Datensätze oder Angaben für ein bestimmtes Produkt. " +
    "Sie erlauben keine verlässliche Produkt- oder Kostenberechnung.";
  var ORIENT_EIGEN = "Eigene Angaben: Mit E gekennzeichnete Werte stammen von Ihnen und sind nicht geprüft. Sie erlauben keine verlässliche Produkt- oder Kostenberechnung.";
  var ORIENT_PREIS = "Kosten: Für die gewählten Materialien liegt kein belegter Preis vor (Preisquellen wie BKI oder Händlerangebote sind nicht frei zugänglich). " +
    "Kostenergebnisse sind deshalb nicht verlässlich oder nicht berechenbar.";

  function orientierung(plaetze) { return orientierungTeile(plaetze).join(" "); }

  // Die einzelnen Hinweise (für Anzeige und Export): jeder Hinweis ein Satzblock
  function orientierungTeile(plaetze) {
    plaetze = plaetze || [];
    if (!plaetze.length) return [];
    var richt = false, eigen = false, belegterPreis = true;
    plaetze.forEach(function (p) {
      var ei = p.material.eigenschaften;
      Object.keys(ei).forEach(function (k) { if (ei[k] && ei[k].art === "richtwert") richt = true; if (ei[k] && ei[k].art === "eigen") eigen = true; });
      var pr = ei.preis;
      if (!(pr && typeof pr.wert === "number" && (pr.art === "richtwert" || pr.art === "verifiziert" || pr.art === "eigen"))) belegterPreis = false;
    });
    var t = [];
    if (richt) t.push(ORIENT_RICHTWERT);
    if (eigen) t.push(ORIENT_EIGEN);
    if (!belegterPreis) t.push(ORIENT_PREIS);
    return t;
  }

  function orientierungZeigen() {
    var el = document.getElementById("orientierung");
    if (!el) return;
    var teile = orientierungTeile(MM.auswahl ? MM.auswahl.holeAuswahl().plaetze : []);
    el.textContent = "";
    // Der erste Hinweis steht sofort da; weitere Hinweise sind unter „Weitere Hinweise“ aufklappbar (MaterialMatch 2.1)
    if (teile.length) el.appendChild(MM.el("p", teile[0], "orient-zeile"));
    if (teile.length > 1) {
      var mehr = MM.el("details", null, "orient-mehr");
      mehr.appendChild(MM.el("summary", "Weitere Hinweise (" + (teile.length - 1) + ")"));
      teile.slice(1).forEach(function (x) { mehr.appendChild(MM.el("p", x)); });
      el.appendChild(mehr);
    }
    el.hidden = !teile.length;
  }

  function klon(x) { return JSON.parse(JSON.stringify(x)); }

  function ohneBeispiel(e) {
    var n = { wert: null, art: null, quelle: null, hinweis: NV_TEXT, ausgeblendet: "beispiel" };
    if (e.einheit !== undefined) n.einheit = e.einheit;
    if ("mwst" in e) { n.mwst = null; n.umfang = null; }
    return n;
  }

  // Eigenschaften (z. B. eines Produkts) so umwandeln, wie es der aktuelle Modus verlangt
  function fuerModus(ei) {
    var o = {};
    Object.keys(ei).forEach(function (k) { o[k] = (!beispieleAktiv && ei[k].art === "beispiel") ? ohneBeispiel(ei[k]) : klon(ei[k]); });
    return o;
  }

  function anwenden() {
    var d = root.MATERIALMATCH_DATA;
    d.baustoffe.forEach(function (m) {
      var o = original.baustoffe.filter(function (x) { return x.id === m.id; })[0];
      Object.keys(o.eigenschaften).forEach(function (k) {
        var e = o.eigenschaften[k];
        m.eigenschaften[k] = (!beispieleAktiv && e.art === "beispiel") ? ohneBeispiel(e) : klon(e);
      });
    });
  }

  function anzeigeAktualisieren() {
    var s = document.getElementById("modus-schalter");
    var t = document.getElementById("modus-text");
    var titel = document.getElementById("modus-titel");
    var kurz = document.getElementById("modus-kurz");
    var leiste = document.getElementById("modus-leiste");
    if (s) s.checked = beispieleAktiv;
    if (t) t.textContent = beispieleAktiv ? TEXT_DEMO : TEXT_ECHT;
    if (titel) titel.textContent = beispieleAktiv ? "Datenmodus: Demo" : "Datenmodus: Verifizierte Daten";
    if (kurz) kurz.textContent = beispieleAktiv ? "Beispieldaten (B, gelb) sind keine geprüften Werte." : "Nur belegte Werte, viele Kennwerte fehlen.";
    if (leiste) {
      leiste.classList.toggle("modus-demo", beispieleAktiv);
      leiste.classList.toggle("modus-echt", !beispieleAktiv);
      leiste.setAttribute("data-modus", beispieleAktiv ? "demo" : "echt");
    }
    document.documentElement.setAttribute("data-datenmodus", beispieleAktiv ? "demo" : "echt");
  }

  function melden() {
    document.dispatchEvent(new CustomEvent("mm:daten", { detail: { beispieldaten: beispieleAktiv } }));
    document.dispatchEvent(new CustomEvent("mm:auswahl", { detail: MM.auswahl ? MM.auswahl.holeAuswahl() : null }));
  }

  MM.datenmodus = {
    orientierung: orientierung,
    fuerModus: fuerModus,
    TEXT_DEMO: TEXT_DEMO,
    TEXT_ECHT: TEXT_ECHT,
    NV_TEXT: NV_TEXT,
    beispieleAktiv: function () { return beispieleAktiv; },
    name: function () { return beispieleAktiv ? "Demo-Modus (Beispieldaten verwendet)" : "Echtdaten-Modus (Beispieldaten als „nicht verfügbar“)"; },
    setze: function (aktiv) {
      aktiv = !!aktiv;
      if (aktiv === beispieleAktiv) return;
      beispieleAktiv = aktiv;
      anwenden();
      anzeigeAktualisieren();
      melden();
    },
    init: function () {
      original = klon(root.MATERIALMATCH_DATA);
      beispieleAktiv = MM.einstellungen.hole().beispieldatenStandard;
      // Adresszusatz ?modus=demo oder ?modus=echt überschreibt den Start-Modus für diesen Aufruf (Vorführung, Tests)
      var treffer = /[?&]modus=(demo|echt)(?:&|#|$)/.exec(root.location ? root.location.search + "&" : "");
      if (treffer) beispieleAktiv = treffer[1] === "demo";
      if (!beispieleAktiv) anwenden();
      document.addEventListener("mm:auswahl", orientierungZeigen);
      document.addEventListener("mm:daten", orientierungZeigen);
      orientierungZeigen();
      var s = document.getElementById("modus-schalter");
      if (s) s.addEventListener("change", function () { MM.datenmodus.setze(s.checked); });
      anzeigeAktualisieren();
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
