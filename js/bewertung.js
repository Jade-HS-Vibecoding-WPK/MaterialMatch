/* ==========================================================================
   MaterialMatch – Bewertung, Farben und Vergleichbarkeit (ohne Bildschirmausgabe)
   --------------------------------------------------------------------------
   Enthält nur Rechenlogik, die sich gesondert testen lässt:

   1. Farbskala: aus einem Wert zwischen 0 (schlechteste Bewertung) und 1
      (beste Bewertung) wird eine Farbe gemischt. Stützfarben:
        0,00 Dunkelrot #951F2B   0,25 Orange #E68B43   0,50 Gelb #E9C94E
        0,75 Hellgrün #78B85A    1,00 Dunkelgrün #17643A
   2. Normalisierung: die gewählten Werte werden relativ zum besten und
      schlechtesten Wert auf 0 bis 1 gebracht. Die Farben sagen also nur,
      wie die gewählten Materialien zueinander stehen.
   3. Vergleichbarkeit von Preisen und CO2-Kennwerten (wird von den Tabellen
      und den Diagrammen gemeinsam genutzt).
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};

  // ---------- Farbskala ----------
  var STOPPS = [
    { s: 0,    hex: "#951F2B" },  // Dunkelrot: vergleichsweise ungünstig
    { s: 0.25, hex: "#E68B43" },  // Orange: eher ungünstig
    { s: 0.5,  hex: "#E9C94E" },  // Gelb: mittlerer Bereich
    { s: 0.75, hex: "#78B85A" },  // Hellgrün: eher günstig
    { s: 1,    hex: "#17643A" }   // Dunkelgrün: vergleichsweise günstig
  ];
  var FARBE_NEUTRAL = "#7C8A99";        // identische / praktisch gleiche Werte
  var FARBE_NICHT_BEWERTET = "#B8BEC4"; // nicht vergleichbar oder nicht bewertet
  // Unterschiede unter der Schwelle (Standard 2 %) gelten als praktisch gleich; einstellbar in data/einstellungen.js
  function gleichSchwelle() { return MM.einstellungen ? MM.einstellungen.hole().gleichSchwelle : 0.02; }

  function hexZuRgb(hex) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }

  function rgbZuHex(rgb) {
    return "#" + rgb.map(function (k) {
      var h = Math.max(0, Math.min(255, Math.round(k))).toString(16).toUpperCase();
      return h.length === 1 ? "0" + h : h;
    }).join("");
  }

  // Mischt die Farbe für eine Bewertung s (0 = schlecht ... 1 = gut)
  function farbeFuerScore(s) {
    s = Math.max(0, Math.min(1, s));
    for (var i = 1; i < STOPPS.length; i++) {
      if (s <= STOPPS[i].s) {
        var a = STOPPS[i - 1], b = STOPPS[i];
        var t = (s - a.s) / (b.s - a.s);
        var ca = hexZuRgb(a.hex), cb = hexZuRgb(b.hex);
        return rgbZuHex([0, 1, 2].map(function (k) { return ca[k] + (cb[k] - ca[k]) * t; }));
      }
    }
    return STOPPS[STOPPS.length - 1].hex;
  }

  // Wortbewertung für Screenreader und Tooltips (immer relativ zu den gewählten Materialien, siehe Pflichtsatz)
  function bewertungText(s) {
    if (s >= 0.875) return "vergleichsweise günstig";
    if (s >= 0.625) return "eher günstig";
    if (s >= 0.375) return "mittlerer Bereich";
    if (s >= 0.125) return "eher ungünstig";
    return "vergleichsweise ungünstig";
  }

  // ---------- Normalisierung ----------
  // werte: Liste aus Zahlen oder null (fehlend); richtung: "niedriger" oder "hoeher" ist besser.
  // Ergebnis: { status, scores }
  //   status "ok":        scores[i] zwischen 0 und 1 (null bei fehlendem Wert)
  //   status "zuwenig":   weniger als zwei Zahlen, keine Bewertung möglich
  //   status "identisch": alle Werte exakt gleich
  //   status "gleich":    Unterschied unter 2 % des größten Betrags (praktisch gleich)
  function normalisiere(werte, richtung) {
    var zahlen = werte.filter(function (w) { return typeof w === "number" && isFinite(w); });
    var leer = werte.map(function () { return null; });
    if (zahlen.length < 2) return { status: "zuwenig", scores: leer };

    var min = Math.min.apply(null, zahlen), max = Math.max.apply(null, zahlen);
    var spanne = max - min;
    if (spanne === 0) return { status: "identisch", scores: leer };
    var bezug = Math.max(Math.abs(min), Math.abs(max));
    if (spanne / bezug < gleichSchwelle()) return { status: "gleich", scores: leer };

    var scores = werte.map(function (w) {
      if (typeof w !== "number" || !isFinite(w)) return null;
      return richtung === "hoeher" ? (w - min) / spanne : (max - w) / spanne;
    });
    return { status: "ok", scores: scores };
  }

  // Achse für die Balken: beginnt bei null; bei negativen Werten reicht sie links über null hinaus.
  // Ergebnis: { min, max, spanne, nullProzent }  (nullProzent = Lage der Nulllinie in %)
  function achse(werte) {
    var zahlen = werte.filter(function (w) { return typeof w === "number" && isFinite(w); });
    var min = Math.min.apply(null, [0].concat(zahlen));
    var max = Math.max.apply(null, [0].concat(zahlen));
    var spanne = max - min || 1;
    return { min: min, max: max, spanne: spanne, nullProzent: (0 - min) / spanne * 100 };
  }

  // Lage und Breite eines Balkens in Prozent der Achse
  function balkenGeometrie(wert, a) {
    var breite = Math.abs(wert) / a.spanne * 100;
    var links = wert >= 0 ? a.nullProzent : a.nullProzent - breite;
    return { links: links, breite: breite };
  }

  // ---------- Vergleichbarkeit ----------
  function einzigartig(liste) {
    return liste.filter(function (x, i) { return liste.indexOf(x) === i; });
  }

  function mitWert(liste) {
    return liste.filter(function (e) { return e && e.wert !== null && e.wert !== undefined; });
  }

  var TYP_NAMEN = {
    "generic dataset": "generischer Datensatz (mit Sicherheitszuschlag)",
    "average dataset": "Branchendurchschnitt",
    "representative dataset": "repräsentativer Durchschnitt",
    "specific dataset": "produktspezifischer Datensatz (Herstellerdeklaration)"
  };

  // Preise: gleiche Einheit? Mehrwertsteuer und Leistungsumfang bekannt und gleich?
  // preise: Liste der Eigenschaft "preis" (Einträge dürfen fehlen)
  function pruefePreis(preise) {
    var p = mitWert(preise);
    var r = { anzahl: p.length, einheiten: [], gleicheEinheit: true, probleme: [], vorbehalte: [], nurBeispiel: false };
    if (p.length < 2) return r;

    r.einheiten = einzigartig(p.map(function (e) { return e.einheit; }));
    r.gleicheEinheit = r.einheiten.length === 1;
    var mwst = einzigartig(p.map(function (e) { return e.mwst || "unbekannt"; }));
    var umfang = einzigartig(p.map(function (e) { return e.umfang || "unbekannt"; }));

    if (!r.gleicheEinheit) {
      r.probleme.push("Die Preise beziehen sich auf unterschiedliche Einheiten (" + r.einheiten.join(", ") + "). Die berechneten Materialkosten weiter oben rechnen die Einheiten um");
    }
    if (mwst.length > 1 || mwst[0] === "unbekannt") {
      r.vorbehalte.push("die Angabe zur Mehrwertsteuer ist unterschiedlich oder unbekannt");
    }
    if (umfang.length > 1 || umfang[0] === "unbekannt") {
      r.vorbehalte.push("der Leistungsumfang (Material, Transport, Einbau) ist unterschiedlich oder unbekannt");
    }
    // Händlerpreise gelten für eine bestimmte Produktdicke: verschiedene Dicken sind nur bedingt vergleichbar
    var dicken = einzigartig(p.filter(function (e) { return typeof e.bezugsdicke_m === "number"; }).map(function (e) { return String(Math.round(e.bezugsdicke_m * 1000)); }));
    if (dicken.length > 1) {
      r.vorbehalte.push("die Händlerpreise gelten für unterschiedliche Produktdicken (" + dicken.join(" mm, ") + " mm) und wurden je m³ umgerechnet");
    }
    r.nurBeispiel = p.every(function (e) { return e.art === "beispiel"; });
    return r;
  }

  // CO2: gleiche Bezugsgröße, gleiche Module, gleicher Datensatztyp?
  // gwpListe: Liste der Eigenschaft "gwp"; quelleFn(id) liefert den Quelleneintrag oder null
  //   optionen.ohneEinheit: Bezugsgrößen nicht als Problem werten (bei bereits umgerechneten Mengen)
  function pruefeCo2(gwpListe, quelleFn, optionen) {
    var ohneEinheit = !!(optionen && optionen.ohneEinheit);
    var v = gwpListe.filter(function (e) { return e && e.werte; });
    var r = { anzahl: v.length, einheiten: [], module: [], typen: [], gleicheEinheit: true,
      probleme: [], zusatz: [], nurBeispiel: false, hatBiogen: false };
    r.hatBiogen = v.some(function (e) { return Math.abs(e.werte.biogen) > 1; });
    if (v.length < 2) return r;

    r.einheiten = einzigartig(v.map(function (e) { return e.deklarierte_einheit; }));
    r.module = einzigartig(v.map(function (e) { return e.module; }));
    r.typen = einzigartig(v.map(function (e) {
      var q = quelleFn(e.quelle);
      return q && q.typ ? q.typ : "beispiel";
    }));
    r.gleicheEinheit = r.einheiten.length === 1;

    if (!r.gleicheEinheit && !ohneEinheit) {
      r.probleme.push("unterschiedliche Bezugsgrößen (" + r.einheiten.join(", ") + ")");
      r.zusatz.push("Die berechnete CO₂-Menge weiter oben rechnet die Bezugsgrößen um.");
    }
    if (r.module.length > 1) {
      r.probleme.push("unterschiedliche Lebenszyklusmodule (" + r.module.join(", ") + ")");
    }
    if (r.typen.length > 1) {
      r.probleme.push("unterschiedliche Datensatztypen (" + r.typen.map(function (t) { return TYP_NAMEN[t] || "Beispieldaten"; }).join(" und ") + ")");
      var ohneSpezifisch = r.typen.filter(function (t) { return t !== "specific dataset"; });
      var satz = [];
      if (ohneSpezifisch.length > 1) satz.push("Generische Datensätze enthalten Sicherheitszuschläge von 10 bis 30 %, Durchschnittsdatensätze nicht.");
      else if (ohneSpezifisch[0] === "generic dataset") satz.push("Generische Datensätze enthalten Sicherheitszuschläge von 10 bis 30 %.");
      if (r.typen.indexOf("specific dataset") !== -1) satz.push("Produktspezifische Datensätze (Herstellerdeklarationen) gelten nur für das genannte Produkt.");
      satz.push("Die Zahlen stehen daher nicht auf gleicher Basis.");
      r.zusatz.push(satz.join(" "));
    }
    r.nurBeispiel = r.probleme.length === 0 && r.typen[0] === "beispiel";
    return r;
  }

  MM.bewertung = {
    STOPPS: STOPPS,
    FARBE_NEUTRAL: FARBE_NEUTRAL,
    FARBE_NICHT_BEWERTET: FARBE_NICHT_BEWERTET,
    farbeFuerScore: farbeFuerScore,
    bewertungText: bewertungText,
    normalisiere: normalisiere,
    achse: achse,
    balkenGeometrie: balkenGeometrie,
    pruefePreis: pruefePreis,
    pruefeCo2: pruefeCo2,
    mitWert: mitWert,
    einzigartig: einzigartig
  };
  // Für Anzeige und Tests als Eigenschaft, die immer den aktuellen Wert liefert
  Object.defineProperty(MM.bewertung, "GLEICH_SCHWELLE", { enumerable: true, get: gleichSchwelle });
  if (typeof module !== "undefined" && module.exports) { module.exports = MM.bewertung; }

})(typeof window !== "undefined" ? window : globalThis);
