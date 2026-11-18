/* ==========================================================================
   MaterialMatch – Vergleich der Eigenschaften (Schritt 5)
   --------------------------------------------------------------------------
   Füllt die Unterabschnitte "Technische Eigenschaften", "Kosten",
   "CO₂-Bilanz" und "Weitere Eigenschaften". Zeigt die hinterlegten Kennwerte
   der gewählten Materialien nebeneinander, mit Einheit und Datenart.

   Wichtige Regeln (aus dem Master-Prompt):
   - Fehlende Werte werden als "fehlt" gekennzeichnet, nicht sinnvolle als
     "nicht anwendbar".
   - Es wird nichts bewertet oder eingefärbt (Farben folgen in Schritt 6).
   - Kosten und CO₂ werden nur als direkt vergleichbar bezeichnet, wenn
     Bezugsgröße, Module und Datensatztyp übereinstimmen. Sonst erscheint
     "Kein belastbarer direkter Vergleich möglich".
   Berechnete Kosten und CO₂-Mengen folgen in Schritt 7.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var el = MM.el;
  var daten = null;
  var boxen = {};

  // ---------- Zellen aus Eigenschaften bauen ----------

  // Zahlenwert mit Einheit in der Zeilenüberschrift (mitEinheit = false) oder in der Zelle
  function zahlZelle(e, mitEinheit) {
    if (!e) return { text: "keine Angabe", klasse: "missing" };
    if (e.nicht_anwendbar === true) return { text: "nicht anwendbar", klasse: "soft", notiz: e.hinweis };
    if (e.wert === null || e.wert === undefined) return { text: "fehlt", klasse: "missing", notiz: e.hinweis };
    var text = MM.berechnung.formatZahl(e.wert);
    if (mitEinheit) text += " " + e.einheit;
    return { text: text, art: e.art, notiz: e.hinweis, quelle: quelle(e.quelle) };
  }

  function textZelle(e) {
    if (!e) return { text: "keine Angabe", klasse: "missing" };
    if (e.nicht_anwendbar === true) return { text: "nicht anwendbar", klasse: "soft", notiz: e.hinweis };
    if (e.wert === null || e.wert === undefined) return { text: "fehlt", klasse: "missing", notiz: e.hinweis };
    return { text: e.wert, art: e.art, notiz: e.hinweis, quelle: quelle(e.quelle) };
  }

  // Zelle für ein Angabe-Feld einer Eigenschaft (z. B. mwst, umfang)
  function feldZelle(e, feld) {
    if (!e || e.wert === null || e.wert === undefined) return { text: "–", klasse: "soft" };
    var v = e[feld];
    if (!v) return { text: "fehlt", klasse: "missing" };
    return { text: v, klasse: v === "unbekannt" ? "soft" : "" };
  }

  function gwpZelle(e, schluessel, mitNotiz) {
    if (!e || !e.werte) {
      return mitNotiz ? { text: "fehlt", klasse: "missing", notiz: e && e.hinweis } : { text: "–", klasse: "soft" };
    }
    return { text: MM.berechnung.formatZahl(e.werte[schluessel]), art: mitNotiz ? e.art : null, notiz: mitNotiz ? e.hinweis : null, quelle: mitNotiz ? quelle(e.quelle) : null };
  }

  // ---------- Hinweise ----------

  function notiz(text, klasse) { return el("p", text, klasse || "note"); }

  function eigenschaftenVon(plaetze, schluessel) {
    return plaetze.map(function (p) { return p.material.eigenschaften[schluessel]; });
  }

  var mitWert = function (liste) { return MM.bewertung.mitWert(liste); };

  function quelle(id) {
    if (!id) return null;
    for (var i = 0; i < daten.quellen.length; i++) if (daten.quellen[i].id === id) return daten.quellen[i];
    return null;
  }

  function preisHinweise(plaetze) {
    var box = document.createDocumentFragment();
    var preise = mitWert(eigenschaftenVon(plaetze, "preis"));
    var pr = MM.bewertung.pruefePreis(eigenschaftenVon(plaetze, "preis"));   // gemeinsame Prüfung (js/bewertung.js)

    if (plaetze.length >= 2) {
      if (pr.anzahl < 2) {
        box.appendChild(notiz("Kein belastbarer direkter Vergleich möglich: Für mindestens zwei der gewählten Materialien fehlt der Preis.", "warn"));
      } else {
        var probleme = pr.probleme.concat(pr.vorbehalte);
        if (probleme.length) {
          box.appendChild(notiz("Kein belastbarer direkter Vergleich möglich: " + probleme.join("; ") + ".", "warn"));
        }
      }
    }
    if (preise.some(function (e) { return e.art === "beispiel"; })) {
      box.appendChild(notiz("Die mit B gekennzeichneten Preise sind frei gewählte Beispielwerte, keine Marktpreise.", "note"));
    }
    box.appendChild(notiz("Die berechneten Materialkosten und die Kostendifferenz stehen im Abschnitt darüber."));
    return box;
  }

  function co2Hinweise(plaetze) {
    var box = document.createDocumentFragment();
    var alle = eigenschaftenVon(plaetze, "gwp");
    var vorhanden = alle.filter(function (e) { return e && e.werte; });
    var cr = MM.bewertung.pruefeCo2(alle, quelle);                           // gemeinsame Prüfung (js/bewertung.js)

    if (plaetze.length >= 2) {
      if (cr.anzahl < 2) {
        box.appendChild(notiz("Kein belastbarer direkter Vergleich möglich: Für mindestens zwei der gewählten Materialien fehlt der CO₂-Kennwert.", "warn"));
      } else if (cr.probleme.length) {
        box.appendChild(notiz("Kein belastbarer direkter Vergleich möglich: " + cr.probleme.join("; ") + ". " + cr.zusatz.join(" "), "warn"));
      } else if (cr.typen[0] === "beispiel") {
        box.appendChild(notiz("Die CO₂-Werte sind Beispieldaten und nicht belastbar.", "warn"));
      } else {
        box.appendChild(notiz("Bezugsgröße (" + cr.einheiten[0] + "), Module (" + cr.module[0] + ") und Datensatztyp stimmen überein. " +
          "Die Zahlen sind unmittelbar vergleichbar. Das ist ein Vergleich je Mengeneinheit des Materials, " +
          "nicht je Bauteilfunktion (z. B. gleiche Dämmwirkung oder Tragfähigkeit)."));
      }
    }
    if (vorhanden.some(function (e) { return e.werte.biogen < -1; })) {
      box.appendChild(notiz(
        "Biogener Kohlenstoff: Bei Holz und anderen biobasierten Produkten ist der biogene Anteil negativ, weil Kohlenstoff im Material gespeichert ist. " +
        "Er wird am Lebensende wieder freigesetzt oder in Modul D verrechnet. „GWP gesamt“ ist daher keine dauerhafte Einsparung; " +
        "„fossil“ zeigt die fossilen Emissionen der Herstellung. Pauschale Aussagen wie „Holz ist immer klimafreundlicher“ sind nicht zulässig."));
    }
    box.appendChild(notiz("Berücksichtigt sind nur die angegebenen Lebenszyklusmodule (A1–A3 = Herstellung). " +
      "Die berechnete CO₂-Menge für Ihre Fläche und Dicke steht im Abschnitt darüber."));
    return box;
  }

  // ---------- Unterabschnitte zeichnen ----------

  function abschnitt(box, plaetze, bauer) {
    box.textContent = "";
    if (!plaetze.length) {
      box.appendChild(el("div", "Wählen Sie Materialien aus, um die Kennwerte zu vergleichen.", "empty-state"));
      return;
    }
    bauer(box);
  }

  function tabelleMit(box, plaetze, zeilen, ausrichtung) {
    box.appendChild(MM.tabelle.bauen({ plaetze: plaetze, zeilen: zeilen, ausrichtung: ausrichtung }));
  }

  function zellen(plaetze, schluessel, erzeuger) {
    return plaetze.map(function (p) { return erzeuger(p.material.eigenschaften[schluessel], p.material); });
  }

  // Herstellerangaben ohne Bestätigung (z. B. ISOCELL: Bemessungswert „Deutschland“): eigene Zeile, ohne Datenart-Marke,
  // nie Teil von Berechnungen oder Vergleichen
  function herstellerangabenZeile(plaetze) {
    var hat = plaetze.some(function (p) { return p.material.produktAktiv && p.material.produktAktiv.herstellerangaben && p.material.produktAktiv.herstellerangaben.length; });
    if (!hat) return [];
    return [{ titel: "Herstellerangabe (nicht bestätigt, nicht in Berechnungen)", zellen: plaetze.map(function (p) {
      var l = (p.material.produktAktiv && p.material.produktAktiv.herstellerangaben) || [];
      if (!l.length) return { text: "–", klasse: "soft" };
      var h = l[0];
      return { text: "Herstellerangabe: " + h.wert + " W/(m·K) (nicht bestätigt)", klasse: "soft", notiz: h.bezeichnung + ". " + h.hinweis, quelle: quelle(h.quelle) };
    }) }];
  }

  function technisch(plaetze) {
    abschnitt(boxen.technisch, plaetze, function (box) {
      tabelleMit(box, plaetze, [
        { titel: "Nennwert λD (W/(m·K))", begriff: "lambdaD", zellen: zellen(plaetze, "waermeleitfaehigkeit", function (e) { return zahlZelle(e, false); }) },
        { titel: "Bemessungswert λB (W/(m·K))", begriff: "lambdaB", zellen: zellen(plaetze, "waermeleitfaehigkeit_bemessung", function (e) { return zahlZelle(e, false); }) },
        { titel: "Druckfestigkeit (N/mm²)", begriff: "druckfestigkeit", zellen: zellen(plaetze, "druckfestigkeit", function (e) { return zahlZelle(e, false); }) },
        { titel: "Brandverhalten (Euroklasse)", begriff: "euroklasse", zellen: zellen(plaetze, "brandverhalten", textZelle) }
      ].concat(herstellerangabenZeile(plaetze)));
      box.appendChild(notiz("Die Euroklasse beschreibt das Brandverhalten des Baustoffs, nicht den Feuerwiderstand eines Bauteils. " +
        "Eine Rangfolge wird hier bewusst nicht gebildet."));
      box.appendChild(notiz("Druckfestigkeiten verschiedener Materialarten (z. B. Beton, Holz, Mauerwerk) sind nur eingeschränkt vergleichbar, " +
        "weil Prüfbedingungen und Belastungsrichtung unterschiedlich sind. Höher ist nicht automatisch besser."));
    });
  }

  function kosten(plaetze) {
    abschnitt(boxen.kosten, plaetze, function (box) {
      tabelleMit(box, plaetze, [
        { titel: "Einheitspreis", begriff: "preis", zellen: zellen(plaetze, "preis", function (e) {
          var z = zahlZelle(e, true);
          if (z.klasse === "missing") z.text = "Preis nicht verfügbar";   // kein verlässlicher Preis: nicht schätzen, sondern so sagen
          return z;
        }) },
        { titel: "Mehrwertsteuer", zellen: zellen(plaetze, "preis", function (e) { return feldZelle(e, "mwst"); }) },
        { titel: "Leistungsumfang", zellen: zellen(plaetze, "preis", function (e) { return feldZelle(e, "umfang"); }) }
      ]);
      box.appendChild(preisHinweise(plaetze));
    });
  }

  function co2(plaetze) {
    abschnitt(boxen.co2, plaetze, function (box) {
      tabelleMit(box, plaetze, [
        { titel: "Bezugsgröße", begriff: "bezugsgroesse", zellen: zellen(plaetze, "gwp", function (e) {
          return e && e.werte ? { text: e.deklarierte_einheit } : { text: "–", klasse: "soft" };
        }) },
        { titel: "Lebenszyklusmodule", begriff: "module", zellen: zellen(plaetze, "gwp", function (e) {
          return e && e.werte ? { text: e.module } : { text: "–", klasse: "soft" };
        }) },
        { titel: "GWP gesamt (kg CO₂e je Bezugsgröße)", begriff: "gwp", klasse: "key-row", zellen: zellen(plaetze, "gwp", function (e) { return gwpZelle(e, "gesamt", true); }) },
        { titel: "davon fossil", begriff: "fossil", zellen: zellen(plaetze, "gwp", function (e) { return gwpZelle(e, "fossil", false); }) },
        { titel: "davon biogen", begriff: "biogen", zellen: zellen(plaetze, "gwp", function (e) { return gwpZelle(e, "biogen", false); }) }
      ]);
      box.appendChild(co2Hinweise(plaetze));
    });
  }

  function weitere(plaetze) {
    abschnitt(boxen.weitere, plaetze, function (box) {
      var zeilen = [
        { titel: "Wasserdampf-Diffusionswiderstandszahl μ (–)", begriff: "mu", zellen: zellen(plaetze, "wasserdampf_mu", function (e) { return zahlZelle(e, false); }) },
        { titel: "Spezifische Wärmekapazität (J/(kg·K))", begriff: "waermekapazitaet", zellen: zellen(plaetze, "waermekapazitaet", function (e) { return zahlZelle(e, false); }) }
      ];
      if (mitWert(eigenschaftenVon(plaetze, "flaechengewicht")).length) {
        zeilen.push({ titel: "Flächengewicht (kg/m²)", zellen: zellen(plaetze, "flaechengewicht", function (e) { return zahlZelle(e, false); }) });
      }
      zeilen.push({ titel: "Recycling (qualitativ)", zellen: zellen(plaetze, "recycling", textZelle) });
      tabelleMit(box, plaetze, zeilen, "links");
      box.appendChild(notiz("Die Recyclingfähigkeit hängt von Zusammensetzung, Verbindungsmitteln, Rückbau und vorhandenen Verfahren ab."));
      box.appendChild(notiz("Nutzungsdauer: Es sind keine Werte hinterlegt, weil dafür eine geeignete Quelle mit klaren Randbedingungen nötig ist."));
      box.appendChild(notiz("Schallschutz: Es sind keine Werte hinterlegt. Schalldämmung lässt sich sinnvoll nur für vollständige Bauteilaufbauten bestimmen, nicht für einzelne Baustoffe."));
    });
  }

  function render() {
    var plaetze = MM.auswahl.holeAuswahl().plaetze;
    technisch(plaetze);
    kosten(plaetze);
    co2(plaetze);
    weitere(plaetze);
  }

  MM.eigenschaften = {
    init: function (baustoffdaten) {
      daten = baustoffdaten;
      boxen.technisch = document.getElementById("ergebnis-technisch");
      boxen.kosten = document.getElementById("ergebnis-kosten");
      boxen.co2 = document.getElementById("ergebnis-co2");
      boxen.weitere = document.getElementById("ergebnis-weitere");
      if (!boxen.technisch || !boxen.kosten || !boxen.co2 || !boxen.weitere) return;
      document.addEventListener("mm:auswahl", render);
      render();
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
