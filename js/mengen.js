/* ==========================================================================
   MaterialMatch – Ergebnisanzeige Menge und Gewicht (Schritt 4, ab Schritt 5
   mit dem gemeinsamen Tabellenbauer js/tabelle.js)
   --------------------------------------------------------------------------
   Hört auf die Nachrichten "mm:auswahl" (Materialien geändert) und
   "mm:eingaben" (Fläche/Dicke geändert) und zeichnet die Tabelle neu.
   Die Rechnung selbst steckt in js/berechnung.js.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var el = MM.el;
  var box = null;

  function hinweis(text) { box.appendChild(el("div", text, "empty-state")); }

  function render() {
    if (!box) return;
    box.textContent = "";

    var B = MM.berechnung;
    var auswahl = MM.auswahl.holeAuswahl();
    var e = MM.eingaben.hole();

    if (!auswahl.plaetze.length) {
      hinweis("Wählen Sie zuerst Materialien aus, um Volumen und Gewicht zu berechnen.");
      return;
    }
    if (e.status === "fehler") {
      hinweis("Bitte korrigieren Sie die markierten Eingaben (Fläche und Dicke).");
      return;
    }
    if (e.status !== "ok") {
      hinweis("Geben Sie Bauteilfläche und Materialdicke ein, um Volumen und Gewicht zu berechnen.");
      return;
    }

    // Rechnen: ein Ergebnis je Material
    var spalten = auswahl.plaetze.map(function (p) {
      return { platz: p, m: p.material, r: B.berechneSchicht(p.material, e.flaeche_m2, e.dicke_m) };
    });

    // Zusammenfassung der Eingaben (zeigt, wie die Eingabe gelesen wurde)
    box.appendChild(el("p",
      "Berechnet für " + B.formatEingabe(e.flaeche_m2) + " m² Fläche und " +
      B.formatEingabe(e.dicke_wert) + " " + e.dicke_einheit + " Dicke. Volumen je Material: " +
      B.formatZahl(e.flaeche_m2 * e.dicke_m) + " m³.", "calc-summary"));

    var zeilen = [];
    var ARTEN = MM.tabelle.ART;

    zeilen.push({ titel: "Rohdichte (kg/m³)", begriff: "rohdichte", zellen: spalten.map(function (s) {
      var r = s.m.eigenschaften.rohdichte;
      return { text: r && r.wert !== null ? B.formatZahl(r.wert) : "fehlt", quelle: r ? MM.quellen.finde(r.quelle) : null };
    }) });
    zeilen.push({ titel: "Datenart Rohdichte", zellen: spalten.map(function (s) {
      var r = s.m.eigenschaften.rohdichte;
      return { text: r && r.art ? ARTEN[r.art].text : "–", klasse: "soft" };
    }) });
    zeilen.push({ titel: "Volumen (m³)", zellen: spalten.map(function (s) {
      return { text: s.r.moeglich && s.r.volumen_m3 !== null ? B.formatZahl(s.r.volumen_m3) : "–" };
    }) });
    zeilen.push({ titel: "Flächenmasse (kg/m²)", begriff: "flaechenmasse", zellen: spalten.map(function (s) {
      return { text: s.r.moeglich ? B.formatZahl(s.r.flaechenmasse_kgm2) : "–" };
    }) });
    zeilen.push({ titel: "Gesamtgewicht (kg)", klasse: "key-row", zellen: spalten.map(function (s) {
      if (!s.r.moeglich) return { text: "–" };
      return {
        text: B.formatZahl(s.r.gewicht_kg),
        zusatz: s.r.gewicht_kg >= 1000 ? "= " + B.formatZahl(s.r.gewicht_kg / 1000) + " t" : null,
        klasse: "strong"
      };
    }) });

    // Unterschied zum ersten berechenbaren Material. Verglichen wird nur bei gleicher Berechnungsgrundlage:
    // Gewicht aus Dicke × Rohdichte (Schicht) lässt sich nicht mit Fläche × Flächengewicht (Plattenprodukt, Deckung) vergleichen.
    var berechenbar = spalten.filter(function (s) { return s.r.moeglich; });
    var bezug = berechenbar[0];
    var gleicheBasis = bezug ? berechenbar.filter(function (s) { return s.r.basis === bezug.r.basis; }) : [];
    var gemischt = berechenbar.length !== gleicheBasis.length;
    if (gleicheBasis.length >= 2) {
      zeilen.push({ titel: "Gewichtsunterschied zu Material " + bezug.platz.buchstabe, zellen: spalten.map(function (s) {
        if (!s.r.moeglich) return { text: "–" };
        
        if (s.r.basis !== bezug.r.basis) return { text: "nicht vergleichbar", klasse: "soft" };
        if (s === bezug) return { text: "Bezug", klasse: "soft" };
        var u = B.berechneUnterschied(bezug.r.gewicht_kg, s.r.gewicht_kg);
        return {
          text: B.formatMitVorzeichen(u.absolut) + " kg",
          zusatz: u.prozent === null ? null : B.formatMitVorzeichen(Math.round(u.prozent * 10) / 10) + " %"
        };
      }) });
    }

    box.appendChild(MM.tabelle.bauen({ plaetze: auswahl.plaetze, zeilen: zeilen }));

    // Hinweise zu nicht berechenbaren Materialien und zu Gewichten aus dem Flächengewicht
    spalten.forEach(function (s) {
      if (!s.r.moeglich) {
        box.appendChild(el("p", "Material " + s.platz.buchstabe + " (" + s.m.name + "): " + s.r.grund, "card-note"));
      } else if (s.r.basis === "flaeche") {
        var fg = s.m.eigenschaften.flaechengewicht;
        box.appendChild(el("p", "Material " + s.platz.buchstabe + " (" + s.m.name + "): Das Gewicht ergibt sich aus Fläche × Flächengewicht (" +
          B.formatZahl(fg.wert) + " kg/m², " + (fg.art ? MM.tabelle.ART[fg.art].text : "ohne Datenart") + "). Die eingegebene Dicke wird nicht verwendet. " +
          (s.r.hinweis ? s.r.hinweis : ""), "card-note"));
      }
    });
    if (gemischt) {
      box.appendChild(el("p", "Hinweis: Gewichte aus Dicke × Rohdichte und aus dem Flächengewicht eines Produkts sind nicht direkt vergleichbar. Deshalb gibt es hier keinen Gewichtsunterschied zwischen diesen beiden Gruppen.", "note"));
    }

    box.appendChild(el("p",
      "Formeln: Volumen = Fläche × Dicke · Gewicht = Volumen × Rohdichte · Flächenmasse = Dicke × Rohdichte. " +
      "Bei Plattenprodukten und Deckungen ohne Schichtmodell: Gewicht = Fläche × Flächengewicht. " +
      "Die Rohdichte beschreibt die Masse eines Materials bezogen auf sein Volumen. " +
      "Die Gewichte sind nur so verlässlich wie die hinterlegte Rohdichte (siehe Datenart).", "note"));
  }

  MM.mengen = {
    init: function () {
      box = document.getElementById("ergebnis-menge");
      if (!box) return;
      document.addEventListener("mm:auswahl", render);
      document.addEventListener("mm:eingaben", render);
      render();
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
