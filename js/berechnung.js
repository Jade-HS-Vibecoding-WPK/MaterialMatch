/* ==========================================================================
   MaterialMatch – Rechenlogik (ohne Bildschirmausgabe)
   --------------------------------------------------------------------------
   Enthält nur Funktionen, die Eingaben lesen, prüfen und rechnen. Weil hier
   nichts auf der Seite gezeichnet wird, lässt sich dieser Teil gesondert und
   gründlich testen.

   Formeln (Schritt 4):
     Volumen [m³]        = Fläche [m²] × Dicke [m]
     Gewicht [kg]        = Volumen [m³] × Rohdichte [kg/m³]
     Flächenmasse [kg/m²] = Dicke [m] × Rohdichte [kg/m³]
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};

  var GRENZEN = {
    flaecheMax_m2: 1000000,   // 1 Mio. m² – darüber ist die Eingabe nicht plausibel
    dickeMax_m: 10            // 10 m Schichtdicke
  };
  var EINHEIT_IN_METER = { mm: 0.001, cm: 0.01, m: 1 };

  // ---------- Zahl aus Text lesen ----------
  // Ergebnis: { leer: true } | { fehler: "Text" } | { wert: Zahl }
  function parseZahl(text) {
    var s = String(text === null || text === undefined ? "" : text).replace(/[\s  ]/g, "");
    if (s === "") return { leer: true };

    var FORMAT = "Bitte nur eine Zahl eingeben (z. B. 100 oder 12,5).";
    var vorzeichen = 1;
    if (s.charAt(0) === "-") { vorzeichen = -1; s = s.slice(1); }
    else if (s.charAt(0) === "+") { s = s.slice(1); }

    if (!/^[\d.,]+$/.test(s)) return { fehler: FORMAT };

    var ganz, bruch = "";
    if (s.indexOf(",") !== -1) {
      // Komma = Dezimaltrenner (deutsch). Punkte davor nur als Tausendertrenner erlaubt.
      var teile = s.split(",");
      if (teile.length !== 2 || !/^\d+$/.test(teile[1])) return { fehler: FORMAT };
      ganz = teile[0];
      bruch = teile[1];
      if (/^\d+$/.test(ganz)) {
        // ok
      } else if (/^[1-9]\d{0,2}(\.\d{3})+$/.test(ganz)) {
        ganz = ganz.replace(/\./g, "");
      } else {
        return { fehler: FORMAT };
      }
    } else if (/^\d+$/.test(s)) {
      ganz = s;
    } else if (/^[1-9]\d{0,2}\.\d{3}$/.test(s)) {
      // z. B. "1.500": könnte 1,5 oder 1500 bedeuten -> nicht raten
      return { fehler: "Unklar: „" + s + "“ kann 1,5 oder 1500 bedeuten. Bitte mit Komma (" +
        s.replace(".", ",") + ") oder ohne Punkt (" + s.replace(".", "") + ") schreiben." };
    } else if (/^[1-9]\d{0,2}(\.\d{3}){2,}$/.test(s)) {
      ganz = s.replace(/\./g, "");              // z. B. 1.000.000
    } else if (/^\d+\.\d+$/.test(s)) {
      var t = s.split(".");                      // z. B. 12.5
      ganz = t[0];
      bruch = t[1];
    } else {
      return { fehler: FORMAT };
    }

    if ((ganz + bruch).length > 15) return { fehler: "Die Zahl ist zu lang." };
    return { wert: vorzeichen * parseFloat(ganz + (bruch ? "." + bruch : "")) };
  }

  // ---------- Eingaben prüfen ----------
  // e = { flaecheText, dickeText, dickeEinheit }
  // status: "leer" (nichts eingegeben) | "unvollstaendig" | "fehler" | "ok"
  function pruefeEingaben(e) {
    var ergebnis = {
      status: "leer",
      fehler: { flaeche: null, dicke: null },
      flaeche_m2: null,
      dicke_m: null,
      dicke_wert: null,
      dicke_einheit: e.dickeEinheit,
      // einzeln gültige Werte (auch wenn das andere Feld noch leer oder fehlerhaft ist)
      flaeche_gueltig_m2: null,
      dicke_gueltig_m: null
    };
    var faktor = EINHEIT_IN_METER[e.dickeEinheit];
    if (!faktor) {
      ergebnis.status = "fehler";
      ergebnis.fehler.dicke = "Bitte eine Einheit für die Dicke wählen (mm, cm oder m).";
      return ergebnis;
    }

    var f = parseZahl(e.flaecheText);
    var d = parseZahl(e.dickeText);

    if (f.fehler) ergebnis.fehler.flaeche = f.fehler;
    else if (!f.leer) {
      if (f.wert < 0) ergebnis.fehler.flaeche = "Die Fläche darf nicht negativ sein.";
      else if (f.wert === 0) ergebnis.fehler.flaeche = "Die Fläche muss größer als 0 sein.";
      else if (f.wert > GRENZEN.flaecheMax_m2) ergebnis.fehler.flaeche = "Die Fläche ist unplausibel groß (über 1.000.000 m²). Bitte prüfen.";
    }

    if (d.fehler) ergebnis.fehler.dicke = d.fehler;
    else if (!d.leer) {
      if (d.wert < 0) ergebnis.fehler.dicke = "Die Dicke darf nicht negativ sein.";
      else if (d.wert === 0) ergebnis.fehler.dicke = "Die Dicke muss größer als 0 sein.";
      else if (d.wert * faktor > GRENZEN.dickeMax_m) ergebnis.fehler.dicke = "Die Dicke ist unplausibel groß (über 10 m). Bitte Einheit und Wert prüfen.";
    }

    if (!f.leer && !f.fehler && !ergebnis.fehler.flaeche) ergebnis.flaeche_gueltig_m2 = f.wert;
    if (!d.leer && !d.fehler && !ergebnis.fehler.dicke) ergebnis.dicke_gueltig_m = d.wert * faktor;

    if (ergebnis.fehler.flaeche || ergebnis.fehler.dicke) {
      ergebnis.status = "fehler";
      return ergebnis;
    }
    if (f.leer && d.leer) { ergebnis.status = "leer"; return ergebnis; }
    if (f.leer || d.leer) { ergebnis.status = "unvollstaendig"; return ergebnis; }

    ergebnis.status = "ok";
    ergebnis.flaeche_m2 = f.wert;
    ergebnis.dicke_wert = d.wert;
    ergebnis.dicke_m = d.wert * faktor;
    return ergebnis;
  }

  // ---------- Menge und Gewicht für einen Baustoff ----------
  // Ergebnis: { moeglich: false, grund } oder
  //   { moeglich: true, basis: "schicht", volumen_m3, gewicht_kg, flaechenmasse_kgm2, rohdichte }
  //   { moeglich: true, basis: "flaeche", volumen_m3: null, gewicht_kg, flaechenmasse_kgm2, flaechengewicht, hinweis }
  // "basis" sagt, wie das Gewicht entstanden ist. Gewichte verschiedener Grundlagen sind nicht direkt vergleichbar:
  // Bei Schichtmaterialien zählt die gewählte Dicke, bei Plattenprodukten und Deckungen das Flächengewicht des Produkts.
  function berechneSchicht(baustoff, flaeche_m2, dicke_m) {
    if (baustoff.mengenmodell !== "schicht") {
      var fg = baustoff.eigenschaften && baustoff.eigenschaften.flaechengewicht;
      if (fg && typeof fg.wert === "number" && fg.wert > 0) {
        return {
          moeglich: true,
          basis: "flaeche",
          flaechengewicht: fg.wert,
          volumen_m3: null,
          gewicht_kg: flaeche_m2 * fg.wert,
          flaechenmasse_kgm2: fg.wert,
          hinweis: baustoff.mengenhinweis || null
        };
      }
      return { moeglich: false, grund: baustoff.mengenhinweis || "Für dieses Material ist keine Schichtberechnung vorgesehen." };
    }
    var r = baustoff.eigenschaften.rohdichte;
    if (!r || typeof r.wert !== "number" || !(r.wert > 0)) {
      return { moeglich: false, grund: "Die Rohdichte fehlt. Das Gewicht kann nicht berechnet werden." };
    }
    var volumen = flaeche_m2 * dicke_m;
    return {
      moeglich: true,
      basis: "schicht",
      rohdichte: r.wert,
      volumen_m3: volumen,
      gewicht_kg: volumen * r.wert,
      flaechenmasse_kgm2: dicke_m * r.wert
    };
  }

  // Unterschied eines Wertes zu einem Bezugswert (absolut und in Prozent)
  function berechneUnterschied(bezug, wert) {
    return {
      absolut: wert - bezug,
      prozent: bezug !== 0 ? (wert - bezug) / bezug * 100 : null
    };
  }

  // ---------- Zahlen für die Anzeige formatieren ----------
  // Sinnvolle Rundung: große Zahlen ohne, kleine Zahlen mit Nachkommastellen.
  function nachkommastellen(x) {
    var a = Math.abs(x);
    if (a >= 100) return 0;
    if (a >= 10) return 1;
    if (a >= 1) return 2;
    return 3;
  }

  function formatZahl(x) {
    if (x === null || x === undefined || !isFinite(x)) return "–";
    if (x !== 0 && Math.abs(x) < 0.001) return "< 0,001";
    return new Intl.NumberFormat("de-DE", {
      maximumFractionDigits: nachkommastellen(x),
      minimumFractionDigits: 0
    }).format(x);
  }

  // Für die Rückmeldung der Eingaben: bis zu 6 Nachkommastellen, nie gerundet wie bei Ergebnissen
  function formatEingabe(x) {
    if (x === null || x === undefined || !isFinite(x)) return "–";
    return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 6, minimumFractionDigits: 0 }).format(x);
  }

  function formatMitVorzeichen(x) {
    if (x === null || x === undefined || !isFinite(x)) return "–";
    var s = formatZahl(x);
    return (x > 0 && s.charAt(0) !== "<" ? "+" : "") + s;
  }


  // ======================================================================
  // Schritt 7: Kosten, CO2 und Wärmedurchlasswiderstand
  // ======================================================================

  var PREIS_BEZUG = { "€/m³": "1 m³", "€/m²": "1 m²", "€/kg": "1 kg" };
  var R_ZIEL_MAX = 50;   // m²K/W – darüber ist die Eingabe nicht plausibel

  function nein(grund) { return { moeglich: false, grund: grund }; }

  // Auf welche Menge bezieht sich ein Kennwert (Preis, CO2) bei der gewählten Fläche und Dicke?
  //   bezug: "1 m³" | "1 kg" | "1 m²"; bezugsdicke_m: nur bei "1 m²" für Schichtmaterial
  // Ergebnis: { moeglich: true, menge, einheit, weg } oder { moeglich: false, grund }
  function mengeFuerBezug(bezug, baustoff, flaeche_m2, dicke_m, bezugsdicke_m) {
    var schicht = baustoff.mengenmodell === "schicht";
    var rd = baustoff.eigenschaften.rohdichte;

    if (bezug === "1 m³") {
      if (!schicht) return nein("Das Material hat keine Schichtberechnung (Fläche × Dicke). Das Volumen lässt sich so nicht bestimmen.");
      return { moeglich: true, menge: flaeche_m2 * dicke_m, einheit: "m³", weg: "Volumen" };
    }
    if (bezug === "1 kg") {
      if (!schicht) return nein("Das Material hat keine Schichtberechnung (Fläche × Dicke). Das Gewicht lässt sich so nicht bestimmen.");
      if (!rd || typeof rd.wert !== "number" || !(rd.wert > 0)) return nein("Die Rohdichte fehlt. Der Wert je kg lässt sich nicht auf das Volumen umrechnen.");
      return { moeglich: true, menge: flaeche_m2 * dicke_m * rd.wert, einheit: "kg", weg: "Gewicht" };
    }
    if (bezug === "1 m²") {
      if (!schicht) return { moeglich: true, menge: flaeche_m2, einheit: "m²", weg: "Fläche" };
      if (!(bezugsdicke_m > 0)) return nein("Der Wert gilt je m² für eine nicht angegebene Dicke und lässt sich nicht auf eure Dicke übertragen.");
      if (Math.abs(dicke_m - bezugsdicke_m) > 1e-9 * Math.max(1, bezugsdicke_m)) {
        return nein("Der Wert gilt je m² für eine Dicke von " + formatEingabe(bezugsdicke_m * 1000) + " mm. Ihre Dicke weicht ab (" +
          formatEingabe(dicke_m * 1000) + " mm), eine Umrechnung wäre eine Annahme.");
      }
      return { moeglich: true, menge: flaeche_m2, einheit: "m²", weg: "Fläche" };
    }
    return nein("Unbekannte Bezugsgröße „" + bezug + "“.");
  }

  // Materialkosten = Menge × Einheitspreis (Menge je nach Preiseinheit: m³, kg oder m²)
  function berechneKosten(baustoff, flaeche_m2, dicke_m) {
    var p = baustoff.eigenschaften.preis;
    if (!p || p.wert === null || p.wert === undefined) return nein("Der Preis fehlt (nicht verfügbar).");
    var m = mengeFuerBezug(PREIS_BEZUG[p.einheit], baustoff, flaeche_m2, dicke_m, p.bezugsdicke_m);
    if (!m.moeglich) return m;
    return { moeglich: true, kosten_eur: m.menge * p.wert, menge: m.menge, mengeneinheit: m.einheit,
      preis: p.wert, preiseinheit: p.einheit, umweg: m.weg === "Gewicht" };
  }

  // CO2-Menge [kg CO2e] = Menge × Kennwert (gesamt, fossil, biogen), Menge je nach deklarierter Einheit
  function berechneCo2(baustoff, flaeche_m2, dicke_m) {
    var g = baustoff.eigenschaften.gwp;
    if (!g || !g.werte) return nein("Der CO₂-Kennwert fehlt (nicht verfügbar).");
    var m = mengeFuerBezug(g.deklarierte_einheit, baustoff, flaeche_m2, dicke_m, g.bezugsdicke_m);
    if (!m.moeglich) return m;
    return { moeglich: true, menge: m.menge, mengeneinheit: m.einheit, bezug: g.deklarierte_einheit, module: g.module,
      gesamt: m.menge * g.werte.gesamt, fossil: m.menge * g.werte.fossil, biogen: m.menge * g.werte.biogen,
      // Landnutzungsänderung (luluc) ist Teil von "gesamt", falls der Datensatz sie ausweist
      luluc: typeof g.werte.luluc === "number" ? m.menge * g.werte.luluc : null,
      kennwert: g.werte, umweg: m.weg === "Gewicht" };
  }

  // Gültige Zahl > 0 als Wärmeleitfähigkeit?
  function lambdaGueltig(e) {
    return !!e && e.nicht_anwendbar !== true && typeof e.wert === "number" && isFinite(e.wert) && e.wert > 0;
  }

  // Welche Wärmeleitfähigkeit gilt für ein Material? Der Bemessungswert (λB, Planungswert), sofern er vorliegt,
  // sonst der Nennwert (λD, vom Hersteller deklariert). Ergebnis: { eig, typ: "bemessung" | "nennwert" } oder null.
  function lambdaWahl(eigenschaften) {
    var b = eigenschaften && eigenschaften.waermeleitfaehigkeit_bemessung;
    var n = eigenschaften && eigenschaften.waermeleitfaehigkeit;
    if (lambdaGueltig(b)) return { eig: b, typ: "bemessung" };
    if (lambdaGueltig(n)) return { eig: n, typ: "nennwert" };
    return null;
  }

  // Für Vergleiche zwischen mehreren Materialien (Diagramm, Empfehlung) muss überall dieselbe Sorte Wert stehen,
  // sonst würde ein Bemessungswert mit einem Nennwert verglichen. Es gilt der Bemessungswert nur dann, wenn ihn
  // jedes der Materialien hat, das überhaupt eine Wärmeleitfähigkeit hat; sonst der Nennwert für alle.
  function lambdaVergleichsTyp(materialien) {
    var mitIrgendeinem = materialien.filter(function (m) { return lambdaWahl(m.eigenschaften); });
    if (!mitIrgendeinem.length) return "nennwert";
    var alleBemessung = mitIrgendeinem.every(function (m) { return lambdaGueltig(m.eigenschaften.waermeleitfaehigkeit_bemessung); });
    return alleBemessung ? "bemessung" : "nennwert";
  }

  // Gemeinsame Vorprüfung für R-Wert und erforderliche Dicke: Schicht und gültiges λ
  function lambdaFuerSchicht(baustoff) {
    if (baustoff.mengenmodell !== "schicht") return nein("Keine homogene Schicht: Ein R-Wert (d / λ) ist hier nicht sinnvoll bestimmbar.");
    var w = lambdaWahl(baustoff.eigenschaften);
    if (w) return { moeglich: true, lambda: w.eig.wert, lambdaTyp: w.typ, lambdaArt: w.eig.art };
    var l = baustoff.eigenschaften.waermeleitfaehigkeit;
    if (!l) return nein("Die Wärmeleitfähigkeit fehlt (nicht verfügbar).");
    if (l.nicht_anwendbar === true) return nein("Die Wärmeleitfähigkeit ist für dieses Material nicht anwendbar.");
    if (l.wert === null || l.wert === undefined) return nein("Die Wärmeleitfähigkeit fehlt (nicht verfügbar).");
    return nein("Die Wärmeleitfähigkeit ist ungültig (muss größer als 0 sein).");
  }

  // Wärmedurchlasswiderstand einer Schicht: R = d / λ  [m²K/W]. Das ist NICHT der U-Wert eines Bauteils.
  function berechneR(baustoff, dicke_m) {
    var l = lambdaFuerSchicht(baustoff);
    if (!l.moeglich) return l;
    return { moeglich: true, lambda: l.lambda, lambdaTyp: l.lambdaTyp, lambdaArt: l.lambdaArt, dicke_m: dicke_m, R: dicke_m / l.lambda };
  }

  // Erforderliche Dicke für einen gewünschten R-Wert: d = R × λ  [m]
  function erforderlicheDicke(baustoff, rZiel) {
    var l = lambdaFuerSchicht(baustoff);
    if (!l.moeglich) return l;
    var d = rZiel * l.lambda;
    if (d > GRENZEN.dickeMax_m) {
      return nein("Erforderliche Dicke " + formatZahl(d) + " m (über " + GRENZEN.dickeMax_m + " m): als Dämmung ungeeignet bzw. unplausibel.");
    }
    return { moeglich: true, lambda: l.lambda, lambdaTyp: l.lambdaTyp, lambdaArt: l.lambdaArt, dicke_m: d, R: rZiel };
  }

  // Gewünschten R-Wert prüfen: Status "leer" | "fehler" | "ok"
  function pruefeRZiel(text) {
    var z = parseZahl(text);
    if (z.leer) return { status: "leer", fehler: null, r: null };
    if (z.fehler) return { status: "fehler", fehler: z.fehler, r: null };
    if (z.wert < 0) return { status: "fehler", fehler: "Der R-Wert darf nicht negativ sein.", r: null };
    if (z.wert === 0) return { status: "fehler", fehler: "Der R-Wert muss größer als 0 sein.", r: null };
    if (z.wert > R_ZIEL_MAX) return { status: "fehler", fehler: "Der R-Wert ist unplausibel groß (über " + R_ZIEL_MAX + " m²K/W). Bitte prüfen.", r: null };
    return { status: "ok", fehler: null, r: z.wert };
  }

  // Euro-Beträge: ab 100 € ohne, darunter mit Cent
  function formatEuro(x) {
    if (x === null || x === undefined || !isFinite(x)) return "–";
    return new Intl.NumberFormat("de-DE", { maximumFractionDigits: Math.abs(x) >= 100 ? 0 : 2, minimumFractionDigits: 0 }).format(x);
  }

  MM.berechnung = {
    GRENZEN: GRENZEN,
    parseZahl: parseZahl,
    pruefeEingaben: pruefeEingaben,
    berechneSchicht: berechneSchicht,
    berechneUnterschied: berechneUnterschied,
    formatZahl: formatZahl,
    formatEingabe: formatEingabe,
    formatMitVorzeichen: formatMitVorzeichen,
    formatEuro: formatEuro,
    mengeFuerBezug: mengeFuerBezug,
    berechneKosten: berechneKosten,
    berechneCo2: berechneCo2,
    berechneR: berechneR,
    lambdaWahl: lambdaWahl,
    lambdaVergleichsTyp: lambdaVergleichsTyp,
    erforderlicheDicke: erforderlicheDicke,
    pruefeRZiel: pruefeRZiel,
    R_ZIEL_MAX: R_ZIEL_MAX
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = MM.berechnung; }

})(typeof window !== "undefined" ? window : globalThis);
