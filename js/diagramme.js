/* ==========================================================================
   MaterialMatch – farbige Vergleichsdiagramme (Schritt 6)
   --------------------------------------------------------------------------
   Horizontale Balkendiagramme: Name links, Balken in der Mitte, Zahlenwert
   mit Einheit rechts. Die Balkenlänge zeigt den Zahlenwert (Achse beginnt
   bei null, negative Werte hängen links an der Nulllinie). Die Balkenfarbe
   zeigt die RELATIVE Bewertung der gewählten Materialien (js/bewertung.js).

   Regeln (aus dem Master-Prompt):
   - Kosten, CO2: niedriger ist besser, aber nur bei vergleichbarer Basis.
   - Wärmeleitfähigkeit: niedriger ist besser, nur bei Dämmstoffen.
   - Gewicht: nur bei Priorität "Geringes Gewicht" bewertet, sonst neutral.
   - Druckfestigkeit und Brandverhalten: keine Farbbewertung (kein Diagramm).
   - Fehlende Werte: grau, ohne Balken. Nicht vergleichbare Werte: grau mit Hinweis.
   - Identische Werte: neutrale Farbe.
   - Verschiedene Einheiten: keine Balken (Längen wären nicht vergleichbar).
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var el = MM.el;
  var daten = null;
  var box = null;
  // Die Priorität kommt aus js/prioritaet.js ("kosten" | "co2" | "gewicht" | "waerme" | "ausgewogen")
  function prioritaet() { return MM.prioritaet ? MM.prioritaet.holen() : "ausgewogen"; }

  function quelle(id) { return id ? MM.finde(daten.quellen, id) : null; }

  function einheitVonBezug(bezug) {            // "1 m³" -> "m³"
    return String(bezug || "").replace(/^1\s*/, "");
  }

  // ---------- Diagramme definieren ----------
  // Anzeigetext je Status (für die Zeile und für die Beschriftung für Screenreader)
  var STATUS_TEXT = { fehlt: "fehlt", nicht_anwendbar: "nicht anwendbar", nicht_berechenbar: "nicht berechenbar", nicht_vergleichbar: "nicht vergleichbar" };

  // Jedes Diagramm: { id, titel, untertitel, zeilen, richtung, bewerten, keineBalken, grund, hinweise }
  //   zeilen:  [{ platz, status: "wert"|"fehlt"|"nicht_anwendbar"|"nicht_berechenbar"|"nicht_vergleichbar", wert, einheit, art, notiz }]

  function einfacheZeilen(plaetze, schluessel) {
    return plaetze.map(function (p) {
      var e = p.material.eigenschaften[schluessel];
      if (!e) return { platz: p, status: "fehlt" };
      if (e.nicht_anwendbar === true) return { platz: p, status: "nicht_anwendbar", notiz: e.hinweis };
      if (e.wert === null || e.wert === undefined) return { platz: p, status: "fehlt", notiz: e.hinweis };
      return { platz: p, status: "wert", wert: e.wert, einheit: e.einheit, art: e.art };
    });
  }

  function gwpZeilen(plaetze, schluessel) {
    return plaetze.map(function (p) {
      var e = p.material.eigenschaften.gwp;
      if (!e || !e.werte) return { platz: p, status: "fehlt", notiz: e && e.hinweis };
      return { platz: p, status: "wert", wert: e.werte[schluessel],
        einheit: "kg CO₂e/" + einheitVonBezug(e.deklarierte_einheit), art: e.art };
    });
  }

  function hatBeispiel(zeilen) {
    return zeilen.some(function (z) { return z.status === "wert" && z.art === "beispiel"; });
  }

  // Beschreibung der Eingabe für Titel und Annahmen: "100 m² × 20 cm"
  function eingabeText(e) {
    return MM.berechnung.formatEingabe(e.flaeche_m2) + " m² × " + MM.berechnung.formatEingabe(e.dicke_wert) + " " + e.dicke_einheit;
  }

  function mengenSatz(e) {
    var f = MM.berechnung.formatZahl;
    return "Menge laut Eingabe: " + eingabeText(e) + " = " + MM.berechnung.formatEingabe(e.flaeche_m2 * e.dicke_m) + " m³ Volumen. Mengen anderer Einheiten werden daraus berechnet " +
      "(Gewicht = Volumen × Rohdichte, Fläche = Eingabe).";
  }

  // Materialkosten: berechnete Gesamtsumme (Menge × Einheitspreis) statt des Einheitspreises
  function diagrammKosten(plaetze, gemeinsam, eingabe) {
    var B = MM.bewertung, BR = MM.berechnung, f = BR.formatZahl;
    var preise = plaetze.map(function (p) { return p.material.eigenschaften.preis; });
    var res = plaetze.map(function (p) { return BR.berechneKosten(p.material, eingabe.flaeche_m2, eingabe.dicke_m); });
    var zeilen = plaetze.map(function (p, i) {
      var pe = preise[i];
      if (!pe || pe.wert === null || pe.wert === undefined) return { platz: p, status: "fehlt", notiz: pe && pe.hinweis };
      if (!res[i].moeglich) return { platz: p, status: "nicht_berechenbar", notiz: res[i].grund };
      var r = res[i];
      return { platz: p, status: "wert", wert: r.kosten_eur, einheit: "€", art: pe.art,
        detail: BR.formatEingabe(r.menge) + " " + r.mengeneinheit + " × " + f(r.preis) + " " + r.preiseinheit + (r.umweg ? " (Menge = Gewicht)" : "") };
    });
    var mitWert = preise.filter(function (pe, i) { return res[i].moeglich; });
    var pr = B.pruefePreis(mitWert);
    var d = { id: "kosten", titel: "Materialkosten für " + eingabeText(eingabe),
      untertitel: "Berechnete Gesamtkosten (Menge × Einheitspreis), nicht der Einheitspreis. Niedriger ist besser, sofern die Materialien funktional vergleichbar sind.",
      zeilen: zeilen, richtung: "niedriger", bewerten: true, keineBalken: false, grund: null, hinweise: [], annahmen: [] };

    if (!gemeinsam) {
      d.bewerten = false;
      d.grund = "Die Materialien haben keinen gemeinsamen Anwendungsbereich und erfüllen vermutlich unterschiedliche Funktionen.";
    }
    if (pr.vorbehalte.length) {
      d.hinweise.push({ klasse: "warn", text: "Kein belastbarer direkter Vergleich möglich: " + pr.vorbehalte.join("; ") + ". Die Farben sind deshalb nur eingeschränkt aussagekräftig." });
    }
    if (hatBeispiel(zeilen)) {
      d.hinweise.push({ klasse: "note", text: "Die mit B gekennzeichneten Preise sind Beispielwerte (Demo), keine Marktpreise." });
    }
    var mwst = B.einzigartig(mitWert.map(function (e) { return e.mwst || "unbekannt"; }));
    var umfang = B.einzigartig(mitWert.map(function (e) { return e.umfang || "unbekannt"; }));
    d.annahmen.push(mengenSatz(eingabe));
    d.annahmen.push("Materialkosten = Menge × Einheitspreis. Die Menge richtet sich nach der Preiseinheit: €/m³ → Volumen, €/kg → Gewicht (Volumen × Rohdichte), €/m² → Fläche.");
    if (mitWert.length) d.annahmen.push("Preisbasis: Mehrwertsteuer " + mwst.join(" / ") + "; Leistungsumfang (Material, Transport, Einbau) " + umfang.join(" / ") + ".");
    d.annahmen.push("Nicht berechenbar sind Materialien ohne belegten Preis oder ohne Möglichkeit, die Preiseinheit auf eure Menge zu beziehen (dann steht der Grund im Tooltip der Zeile).");
    return d;
  }

  // CO2: berechnete Gesamtmenge in kg CO₂e (Menge × Kennwert) statt des Kennwerts je Bezugsgröße
  function diagrammCo2(plaetze, gemeinsam, eingabe, schluessel) {
    var B = MM.bewertung, BR = MM.berechnung, f = BR.formatZahl;
    var gwps = plaetze.map(function (p) { return p.material.eigenschaften.gwp; });
    var res = plaetze.map(function (p) { return BR.berechneCo2(p.material, eingabe.flaeche_m2, eingabe.dicke_m); });
    var zeilen = plaetze.map(function (p, i) {
      var g = gwps[i];
      if (!g || !g.werte) return { platz: p, status: "fehlt", notiz: g && g.hinweis };
      if (!res[i].moeglich) return { platz: p, status: "nicht_berechenbar", notiz: res[i].grund };
      var r = res[i];
      return { platz: p, status: "wert", wert: r[schluessel], einheit: "kg CO₂e", art: g.art,
        detail: BR.formatEingabe(r.menge) + " " + r.mengeneinheit + " × " + f(g.werte[schluessel]) + " kg CO₂e/" + r.mengeneinheit + (r.umweg ? " (Menge = Gewicht)" : "") + " · Module " + r.module };
    });
    var okListe = gwps.filter(function (g, i) { return res[i].moeglich; });
    var cr = B.pruefeCo2(okListe, quelle, { ohneEinheit: true });   // Bezugsgrößen sind durch die Umrechnung erledigt
    var fossil = schluessel === "fossil";
    var d = {
      id: fossil ? "co2-fossil" : "co2-gesamt",
      titel: (fossil ? "CO₂ fossil (GWP fossil)" : "CO₂ gesamt (GWP inklusive biogenem Kohlenstoff)") + " für " + eingabeText(eingabe),
      untertitel: fossil
        ? "Berechnete Gesamtmenge (Menge × Kennwert). Niedriger ist besser bei gleichem Modul und gleichem Datensatztyp."
        : "Berechnete Gesamtmenge. Wird nur bewertet, wenn kein nennenswerter biogener Anteil enthalten ist. Bei Holz ist der Wert negativ, weil Kohlenstoff gespeichert ist.",
      zeilen: zeilen, richtung: "niedriger", bewerten: true, keineBalken: false, grund: null, hinweise: [], annahmen: []
    };

    if (cr.anzahl >= 2 && cr.probleme.length) {
      d.bewerten = false;
      d.hinweise.push({ klasse: "warn", text: "Kein belastbarer direkter Vergleich möglich: " + cr.probleme.join("; ") + ". " +
        cr.zusatz.join(" ") + " Die Balken sind daher grau und nicht bewertet." });
    } else if (cr.anzahl < 2) {
      d.bewerten = false;
      d.grund = "Für eine Bewertung sind mindestens zwei berechenbare CO₂-Mengen nötig.";
    } else if (!gemeinsam) {
      d.bewerten = false;
      d.grund = "Die Materialien haben keinen gemeinsamen Anwendungsbereich und erfüllen vermutlich unterschiedliche Funktionen.";
    } else if (!fossil && cr.hatBiogen) {
      d.bewerten = false;
      d.grund = "Biogener Kohlenstoff ist enthalten. Er wird am Lebensende wieder freigesetzt oder in Modul D verrechnet. " +
        "Deshalb wird GWP gesamt nicht farbig bewertet; maßgeblich für die Bewertung sind die fossilen Emissionen.";
    }
    if (hatBeispiel(zeilen)) {
      d.hinweise.push({ klasse: "note", text: "Mit B gekennzeichnete CO₂-Werte sind Beispieldaten (Demo) und nicht belastbar." });
    }
    var module = B.einzigartig(okListe.map(function (g) { return g.module; }));
    var typen = B.einzigartig(okListe.map(function (g) { var q = quelle(g.quelle); return q && q.typ ? (MM.quellen.TYP_DE[q.typ] || q.typ) : "Beispieldaten"; }));
    d.annahmen.push(mengenSatz(eingabe));
    d.annahmen.push("CO₂-Menge = Menge × Kennwert. Die Bezugsgröße des Kennwerts bestimmt die Menge: je m³ → Volumen, je kg → Gewicht (Volumen × Rohdichte), je m² → Fläche.");
    d.annahmen.push("Lebenszyklusmodule: " + (module.length ? module.join(", ") : "–") + (module.join(", ") === "A1-A3" ? " (Herstellung)" : "") +
      ". Nutzung, Rückbau und Gutschriften sind nicht enthalten. Datensatztyp: " + (typen.length ? typen.join(", ") : "–") + ".");
    if (fossil) d.annahmen.push("Gezeigt wird nur der fossile Anteil; biogener Kohlenstoff und Landnutzungsänderung stehen in der Tabelle „CO₂-Bilanz“.");
    return d;
  }

  function diagrammLambda(plaetze) {
    // Überall dieselbe Sorte Wert: Bemessungswert nur, wenn ihn jedes Material mit λ hat, sonst der Nennwert
    var typ = MM.berechnung.lambdaVergleichsTyp(plaetze.map(function (p) { return p.material; }));
    var zeilen = einfacheZeilen(plaetze, typ === "bemessung" ? "waermeleitfaehigkeit_bemessung" : "waermeleitfaehigkeit");
    var alleDaemm = plaetze.every(function (p) { return p.material.anwendungen.indexOf("waermedaemmung") !== -1; });
    var d = { id: "lambda", titel: "Wärmeleitfähigkeit λ",
      untertitel: "Niedriger ist besser, aber nur bei Dämmstoffen. Bei anderen Materialien wird nicht bewertet.",
      zeilen: zeilen, richtung: "niedriger", bewerten: alleDaemm, keineBalken: false, grund: null, hinweise: [] };
    if (!alleDaemm) d.grund = "Nicht bewertet: Die Wärmeleitfähigkeit wird nur zwischen Dämmstoffen verglichen.";
    d.lambdaTyp = typ;
    // R = d / λ je Material (vorhandene Formel MM.berechnung.berechneR) für die Wärmedämm-Kachel; null ohne gültige Dicke
    var dicke = MM.eingaben.hole().dicke_gueltig_m;
    zeilen.forEach(function (z) {
      z.rWert = null;
      if (dicke === null || dicke === undefined) return;
      var r = MM.berechnung.berechneR(z.platz.material, dicke);
      z.rWert = r.moeglich ? { wert: r.R, einheit: "m²K/W", lambdaTyp: r.lambdaTyp } : null;
    });
    d.hinweise.push({ klasse: "note", text: typ === "bemessung"
      ? "Verglichen wird der Bemessungswert λB (liegt für alle gewählten Materialien vor)."
      : "Verglichen wird der Nennwert λD, weil nicht für alle gewählten Materialien ein Bemessungswert λB vorliegt. Das ist orientierend und ersetzt keinen Wärmeschutznachweis." });
    if (hatBeispiel(zeilen)) {
      d.hinweise.push({ klasse: "note", text: "Mit B gekennzeichnete λ-Werte sind Beispieldaten und nicht belastbar." });
    }
    return d;
  }

  function diagrammGewicht(plaetze, eingabe) {
    var B = MM.berechnung;
    var ergebnisse = plaetze.map(function (p) { return B.berechneSchicht(p.material, eingabe.flaeche_m2, eingabe.dicke_m); });
    // Verglichen wird nur bei gleicher Berechnungsgrundlage wie das erste berechenbare Material
    var ersteBasis = null;
    ergebnisse.forEach(function (r) { if (r.moeglich && ersteBasis === null) ersteBasis = r.basis; });
    var gemischt = false;
    var zeilen = plaetze.map(function (p, i) {
      var r = ergebnisse[i];
      if (!r.moeglich) return { platz: p, status: "nicht_berechenbar", notiz: r.grund };
      if (r.basis !== ersteBasis) {
        gemischt = true;
        return { platz: p, status: "nicht_vergleichbar", notiz: "Gewicht aus anderer Berechnungsgrundlage (Flächengewicht statt Dicke × Rohdichte)." };
      }
      var eig = r.basis === "flaeche" ? p.material.eigenschaften.flaechengewicht : p.material.eigenschaften.rohdichte;
      var f = B.formatZahl;
      return { platz: p, status: "wert", wert: r.gewicht_kg, einheit: "kg", art: eig && eig.art,
        detail: r.basis === "flaeche" ? B.formatEingabe(eingabe.flaeche_m2) + " m² × " + f(r.flaechengewicht) + " kg/m²" : B.formatEingabe(r.volumen_m3) + " m³ × " + f(r.rohdichte) + " kg/m³" };
    });
    var bewerten = prioritaet() === "gewicht";
    var d = { id: "gewicht",
      titel: "Gesamtgewicht für " + B.formatEingabe(eingabe.flaeche_m2) + " m² × " + B.formatEingabe(eingabe.dicke_wert) + " " + eingabe.dicke_einheit,
      untertitel: bewerten ? "Berechnetes Gesamtgewicht (Volumen × Rohdichte). Niedriger ist besser, weil „Geringes Gewicht“ als Priorität gewählt ist."
        : "Berechnetes Gesamtgewicht (Volumen × Rohdichte), neutral dargestellt.",
      zeilen: zeilen, richtung: "niedriger", bewerten: bewerten, keineBalken: false, grund: null, hinweise: [], annahmen: [] };
    d.annahmen.push("Gewicht = Volumen × Rohdichte (Volumen = Fläche × Dicke: " + eingabeText(eingabe) + " = " + B.formatZahl(eingabe.flaeche_m2 * eingabe.dicke_m) + " m³). Plattenprodukte und Deckungen: Gewicht = Fläche × Flächengewicht.");
    if (!bewerten) d.grund = "Nicht bewertet: Ein geringes Gewicht ist nicht automatisch besser. Es wird nur gefärbt, wenn es als Priorität gewählt wurde.";
    if (ersteBasis === "flaeche") d.hinweise.push({ klasse: "note", text: "Das Gewicht stammt aus dem Flächengewicht der Produkte (Fläche × kg/m²). Die eingegebene Dicke wird dabei nicht verwendet." });
    if (gemischt) d.hinweise.push({ klasse: "note", text: "Materialien ohne Wert in diesem Diagramm haben eine andere Berechnungsgrundlage für das Gewicht (siehe Tabelle „Menge und Gewicht“) und sind hier nicht vergleichbar." });
    return d;
  }

  // ---------- Diagramm zeichnen ----------

  function formatWert(z) {
    return MM.berechnung.formatZahl(z.wert) + " " + z.einheit;
  }

  // Farbe und Bewertungstext je Zeile (relative Bewertung, js/bewertung.js). Wird vom Diagramm UND von der
  // Lese-Schnittstelle für das Dashboard benutzt, damit beide immer dasselbe zeigen.
  function bewerteDiagramm(d) {
    var B = MM.bewertung;
    var werteListe = d.zeilen.map(function (z) { return z.status === "wert" ? z.wert : null; });
    var norm = d.bewerten && !d.keineBalken ? B.normalisiere(werteListe, d.richtung) : { status: "nicht_bewertet", scores: werteListe.map(function () { return null; }) };
    var zeilen = d.zeilen.map(function (z, i) {
      if (z.status !== "wert") {
        return { farbe: "", bewertung: z.status === "fehlt" ? "fehlt" : (z.status === "nicht_vergleichbar" ? "nicht vergleichbar" : "nicht anwendbar") };
      }
      if (norm.status === "ok" && norm.scores[i] !== null) return { farbe: B.farbeFuerScore(norm.scores[i]), bewertung: B.bewertungText(norm.scores[i]) };
      if (norm.status === "identisch" || norm.status === "gleich") return { farbe: B.FARBE_NEUTRAL, bewertung: "gleichwertig" };
      return { farbe: B.FARBE_NICHT_BEWERTET, bewertung: "nicht bewertet" };
    });
    return { werteListe: werteListe, norm: norm, zeilen: zeilen };
  }

  function zeichne(d, bw) {
    var B = MM.bewertung;
    var fig = el("figure", null, "chart");
    fig.setAttribute("data-chart", d.id);
    var cap = el("figcaption");
    var titel = el("h3", d.titel, "chart-title");
    var begriff = { "lambda": "lambda", "co2-fossil": "fossil", "co2-gesamt": "gwp" }[d.id];
    if (begriff && MM.begriffe) titel.appendChild(MM.begriffe.marke(begriff));
    cap.appendChild(titel);
    cap.appendChild(el("p", d.untertitel, "chart-sub"));
    fig.appendChild(cap);

    // Bewertung (vorab in bewerteDiagramm berechnet)
    var werteListe = bw.werteListe;
    var norm = bw.norm;

    var achse = B.achse(werteListe);
    var raster = el("div", null, "chart-grid");

    d.zeilen.forEach(function (z, i) {
      var zeile = el("div", null, "chart-row");
      zeile.setAttribute("data-material", z.platz.buchstabe);

      var label = el("div", null, "chart-label");
      label.appendChild(el("span", z.platz.buchstabe, "slot slot-small"));
      label.appendChild(el("span", " " + z.platz.material.name, "chart-name"));
      if (z.detail) label.appendChild(el("span", z.detail, "chart-detail"));
      zeile.appendChild(label);

      var track = el("div", null, "chart-track");
      var wertBox = el("div", null, "chart-value");
      var bewertung = bw.zeilen[i].bewertung, farbe = bw.zeilen[i].farbe;

      if (z.status !== "wert") {
        track.classList.add("missing");
        var text = STATUS_TEXT[z.status];
        wertBox.appendChild(el("span", text, "missing-text"));
      } else {
        if (!d.keineBalken) {
          var geo = B.balkenGeometrie(z.wert, achse);
          var balken = el("div", null, "chart-bar");
          balken.style.left = geo.links + "%";
          balken.style.width = geo.breite + "%";
          balken.style.background = farbe;
          balken.setAttribute("title", z.platz.material.name + ": " + formatWert(z) + " – " + bewertung);
          track.appendChild(balken);
        } else {
          track.classList.add("no-bar");
        }
        wertBox.appendChild(el("span", MM.berechnung.formatZahl(z.wert), "chart-num"));
        wertBox.appendChild(el("span", " " + z.einheit, "chart-unit"));
        if (z.art && MM.tabelle.ART[z.art]) {
          var marke = el("span", MM.tabelle.ART[z.art].kurz, "art art-" + z.art);
          marke.setAttribute("title", MM.tabelle.ART[z.art].text);
          wertBox.appendChild(marke);
        }
      }
      if (!d.keineBalken && z.status === "wert") {
        var nulllinie = el("div", null, "chart-zero");
        nulllinie.style.left = achse.nullProzent + "%";
        track.appendChild(nulllinie);
      }
      if (z.notiz) wertBox.setAttribute("title", z.notiz);

      zeile.appendChild(track);
      zeile.appendChild(wertBox);
      zeile.setAttribute("data-wert", z.status === "wert" ? String(z.wert) : "");
      zeile.setAttribute("data-farbe", farbe || "");
      zeile.setAttribute("data-bewertung", bewertung);
      // Beschriftung für Screenreader: Material, Wert und (relative) Bewertung
      var wertWort = z.status === "wert" ? formatWert(z) + ", Bewertung: " + bewertung + (norm.status === "ok" ? " (relativ)" : "")
        : STATUS_TEXT[z.status];
      track.setAttribute("role", "img");
      track.setAttribute("aria-label", z.platz.material.name + ": " + wertWort);
      raster.appendChild(zeile);
    });

    // Achsenbeschriftung (nur wenn Balken gezeichnet werden)
    var hatBalken = !d.keineBalken && werteListe.some(function (w) { return w !== null; });
    if (hatBalken) {
      var achsenZeile = el("div", null, "chart-row chart-axis");
      achsenZeile.setAttribute("aria-hidden", "true");
      achsenZeile.appendChild(el("div"));
      var skala = el("div", null, "chart-scale");
      var f = MM.berechnung.formatZahl;
      var links = el("span", f(achse.min), "tick");
      links.style.left = "0%";
      skala.appendChild(links);
      if (achse.min < 0 && achse.max > 0) {
        var nullTick = el("span", "0", "tick tick-zero");
        nullTick.style.left = achse.nullProzent + "%";
        skala.appendChild(nullTick);
      }
      var rechts = el("span", f(achse.max), "tick tick-end");
      rechts.style.left = "100%";
      skala.appendChild(rechts);
      achsenZeile.appendChild(skala);
      achsenZeile.appendChild(el("div"));
      raster.appendChild(achsenZeile);
    }
    fig.appendChild(raster);

    // Hinweise zur Bewertung
    if (d.grund) fig.appendChild(el("p", d.grund, "chart-note"));
    if (norm.status === "identisch") fig.appendChild(el("p", "Alle Werte sind identisch, deshalb gibt es keine Farbabstufung (neutrale Farbe).", "chart-note"));
    if (norm.status === "gleich") fig.appendChild(el("p", "Die Werte unterscheiden sich um weniger als " + MM.einstellungen.prozentText(B.GLEICH_SCHWELLE) + ". Sie gelten als praktisch gleich und erhalten die neutrale Farbe.", "chart-note"));
    if (d.bewerten && !d.keineBalken && norm.status === "zuwenig") fig.appendChild(el("p", "Für eine Bewertung sind mindestens zwei Werte nötig.", "chart-note"));
    d.hinweise.forEach(function (h) { fig.appendChild(el("p", h.text, h.klasse === "warn" ? "warn" : "chart-note")); });
    // Zugrunde liegende Mengen und Annahmen (einklappbar, damit das Diagramm übersichtlich bleibt)
    if (d.annahmen && d.annahmen.length) {
      var det = el("details", null, "chart-annahmen");
      det.appendChild(el("summary", "Zugrunde liegende Mengen und Annahmen"));
      var ul = el("ul");
      d.annahmen.forEach(function (t) { ul.appendChild(el("li", t)); });
      det.appendChild(ul);
      fig.appendChild(det);
    }
    return fig;
  }

  // ---------- Legende ----------

  function legende() {
    var B = MM.bewertung;
    var wrap = el("div", null, "legend");
    wrap.appendChild(el("h3", "Legende", "legend-title"));

    var skala = el("div", null, "legend-scale");
    var verlauf = B.STOPPS.slice().reverse().map(function (s) { return s.hex + " " + Math.round((1 - s.s) * 100) + "%"; }).join(", ");
    skala.style.background = "linear-gradient(to right, " + verlauf + ")";
    skala.setAttribute("role", "img");
    skala.setAttribute("aria-label", "Farbskala von dunkelgrün (vergleichsweise günstig) über gelb (mittlerer Bereich) bis dunkelrot (vergleichsweise ungünstig)");
    wrap.appendChild(skala);

    var namen = el("div", null, "legend-labels");
    ["vergleichsweise günstig", "eher günstig", "mittlerer Bereich", "eher ungünstig", "vergleichsweise ungünstig"].forEach(function (t, i) {
      var sp = el("span", t);
      var punkt = el("i", null, "legend-farbe");           // kleines Farbfeld: die Wörter bleiben auch in schmalen Spalten lesbar
      punkt.style.background = B.STOPPS[B.STOPPS.length - 1 - i].hex;
      punkt.setAttribute("aria-hidden", "true");
      sp.insertBefore(punkt, sp.firstChild);
      namen.appendChild(sp);
    });
    wrap.appendChild(namen);

    var liste = el("ul", null, "legend-items");
    [
      [B.FARBE_NEUTRAL, "gleichwertig (identisch oder weniger als " + MM.einstellungen.prozentText(B.GLEICH_SCHWELLE) + " Unterschied)", ""],
      [B.FARBE_NICHT_BEWERTET, "nicht bewertet oder nicht vergleichbar (siehe Hinweis am Diagramm)", ""],
      ["", "Wert fehlt oder ist nicht berechenbar (kein Balken)", "missing"]
    ].forEach(function (e) {
      var li = el("li");
      var sw = el("span", null, "swatch " + e[2]);
      if (e[0]) sw.style.background = e[0];
      li.appendChild(sw);
      li.appendChild(document.createTextNode(" " + e[1]));
      liste.appendChild(li);
    });
    wrap.appendChild(liste);
    wrap.appendChild(el("p", "Die Balkenlänge zeigt den Zahlenwert (Achse beginnt bei null), die Farbe die relative Bewertung. " +
      "B = Beispieldaten, R = Richtwert, V = verifiziert.", "note"));
    return wrap;
  }

  // ---------- Lese-Schnittstelle (MaterialMatch 2.0, Schritt 5) ----------
  // Die zuletzt berechneten Diagrammdaten, nur zum Lesen. Das Dashboard (js/dashboard.js) zeigt damit
  // dieselben Zahlen, Farben und Hinweise wie die Diagramme und rechnet nichts selbst.
  var HAUPT = ["kosten", "co2-fossil", "gewicht", "lambda"];   // sofort sichtbar; alles andere hinter „Weitere Kennwerte anzeigen“
  var weitereOffen = false;
  var letzte = { anzahl: 0, mitEingabe: false, prioritaet: "ausgewogen", diagramme: {} };

  // Kennung der Quelle, aus der der gezeigte Wert stammt (für das Info-Symbol im Dashboard; null = keine Quelle hinterlegt)
  var QUELLEN_SCHLUESSEL = { "kosten": ["preis"], "co2-fossil": ["gwp"], "co2-gesamt": ["gwp"], "gewicht": ["rohdichte", "flaechengewicht"] };
  function quelleDerZeile(d, z) {
    var schluessel = d.id === "lambda"
      ? (d.lambdaTyp === "bemessung" ? ["waermeleitfaehigkeit_bemessung"] : ["waermeleitfaehigkeit"])
      : (QUELLEN_SCHLUESSEL[d.id] || []);
    var eig = z.platz.material.eigenschaften;
    for (var i = 0; i < schluessel.length; i++) {
      if (eig[schluessel[i]] && eig[schluessel[i]].quelle) return eig[schluessel[i]].quelle;
    }
    return null;
  }

  function fuerSchnittstelle(d, bw) {
    return {
      id: d.id,
      titel: d.titel,
      bewertet: !!(d.bewerten && !d.keineBalken && bw.norm.status === "ok"),
      normStatus: bw.norm.status,
      grund: d.grund || null,
      hinweise: d.hinweise.map(function (h) { return { klasse: h.klasse, text: h.text }; }),
      lambdaTyp: d.lambdaTyp || null,
      zeilen: d.zeilen.map(function (z, i) {
        return {
          buchstabe: z.platz.buchstabe, name: z.platz.material.name, status: z.status,
          wert: z.status === "wert" ? z.wert : null, einheit: z.einheit || null, art: z.art || null, notiz: z.notiz || null,
          farbe: bw.zeilen[i].farbe, bewertung: bw.zeilen[i].bewertung,
          quelle: quelleDerZeile(d, z), rWert: z.rWert === undefined ? null : z.rWert
        };
      })
    };
  }

  function meldeErgebnisse() {
    document.dispatchEvent(new CustomEvent("mm:diagramme", { detail: { anzahl: letzte.anzahl } }));
  }

  // ---------- Gesamtdarstellung ----------

  function render() {
    if (!box) return;
    box.textContent = "";
    var auswahl = MM.auswahl.holeAuswahl();
    var plaetze = auswahl.plaetze;
    letzte = { anzahl: plaetze.length, mitEingabe: false, prioritaet: prioritaet(), diagramme: {} };

    if (!plaetze.length) {
      box.appendChild(el("div", "Wählen Sie Materialien aus, um Diagramme zu sehen.", "empty-state"));
      meldeErgebnisse();
      return;
    }

    if (plaetze.length === 1) {
      box.appendChild(el("p", "Mit nur einem Material ist keine relative Bewertung möglich. Die Balken bleiben grau.", "warn"));
    } else if (plaetze.length === 2) {
      box.appendChild(el("p",
        "Nur zwei Materialien: Die Farben sind rein relativ. Das bessere Material wird immer dunkelgrün, das schlechtere immer dunkelrot, " +
        "auch bei kleinem Unterschied (Unterschiede unter " + MM.einstellungen.prozentText(MM.bewertung.GLEICH_SCHWELLE) + " gelten als gleichwertig). Entscheidend sind die Zahlenwerte.", "warn"));
    }

    var materialien = plaetze.map(function (p) { return p.material; });
    var gemeinsam = MM.auswahl.gemeinsamerBereich(materialien);

    var eingabe = MM.eingaben.hole();
    var mitEingabe = eingabe.status === "ok";
    var diagramme = [];
    if (mitEingabe) {
      diagramme.push(diagrammKosten(plaetze, gemeinsam, eingabe));
      diagramme.push(diagrammCo2(plaetze, gemeinsam, eingabe, "fossil"));
      diagramme.push(diagrammCo2(plaetze, gemeinsam, eingabe, "gesamt"));
    }
    diagramme.push(diagrammLambda(plaetze));
    if (mitEingabe) diagramme.push(diagrammGewicht(plaetze, eingabe));

    letzte.mitEingabe = mitEingabe;
    // Anordnung (MaterialMatch 2.0): zuerst die wichtigsten Diagramme in der Reihenfolge des Dashboards,
    // weitere Kennwerte erst nach Klick auf „Weitere Kennwerte anzeigen“. Die Diagramme selbst bleiben unverändert.
    var figuren = {};
    diagramme.forEach(function (d) {
      var bw = bewerteDiagramm(d);
      figuren[d.id] = zeichne(d, bw);
      letzte.diagramme[d.id] = fuerSchnittstelle(d, bw);
    });
    var haupt = el("div", null, "chart-liste");
    HAUPT.forEach(function (id) { if (figuren[id]) haupt.appendChild(figuren[id]); });
    box.appendChild(haupt);
    var weitere = Object.keys(figuren).filter(function (id) { return HAUPT.indexOf(id) === -1; });
    if (!mitEingabe) {
      box.appendChild(el("div", "Die Diagramme zu Kosten, CO₂ und Gewicht erscheinen, sobald Fläche und Dicke eingegeben sind. Sie zeigen die berechneten Gesamtwerte und die zugrunde liegenden Mengen.", "empty-state"));
    }
    if (weitere.length) {
      var knopf = el("button", weitereOffen ? "Weitere Kennwerte ausblenden" : "Weitere Kennwerte anzeigen", "btn-option chart-mehr-knopf");
      knopf.type = "button";
      knopf.id = "diagramme-weitere-knopf";
      knopf.setAttribute("aria-expanded", String(weitereOffen));
      knopf.setAttribute("aria-controls", "diagramme-weitere");
      var extra = el("div", null, "chart-liste chart-weitere");
      extra.id = "diagramme-weitere";
      extra.hidden = !weitereOffen;
      weitere.forEach(function (id) { extra.appendChild(figuren[id]); });
      knopf.addEventListener("click", function () {
        weitereOffen = extra.hidden;          // war verborgen -> wird gezeigt
        extra.hidden = !weitereOffen;
        knopf.setAttribute("aria-expanded", String(weitereOffen));
        knopf.textContent = weitereOffen ? "Weitere Kennwerte ausblenden" : "Weitere Kennwerte anzeigen";
      });
      box.appendChild(knopf);
      box.appendChild(extra);
    }
    box.appendChild(legende());
    meldeErgebnisse();
  }

  MM.diagramme = {
    // Zuletzt berechnete Diagrammdaten als Kopie (nur lesen): { anzahl, mitEingabe, prioritaet,
    //   diagramme: { kosten, "co2-fossil", "co2-gesamt", lambda, gewicht } }, je Diagramm: id, titel, bewertet, grund,
    //   hinweise [{klasse, text}], zeilen [{buchstabe, name, status, wert, einheit, art, notiz, farbe, bewertung}]
    ergebnisse: function () { return JSON.parse(JSON.stringify(letzte)); },
    // „Weitere Kennwerte“ (z. B. CO₂ gesamt) ein- oder ausblenden, wie die Schaltfläche im Abschnitt „Materialien im Vergleich“
    zeigeWeitere: function (an) { weitereOffen = !!an; render(); },
    init: function (baustoffdaten) {
      daten = baustoffdaten;
      box = document.getElementById("diagramme-inhalt");
      if (!box) return;
      document.addEventListener("mm:auswahl", render);
      document.addEventListener("mm:eingaben", render);
      document.addEventListener("mm:prioritaet", render);
      render();
    },
    // Kurzwege zur zentralen Priorität (js/prioritaet.js)
    setzePrioritaet: function (p) { MM.prioritaet.setzen(p); },
    holePrioritaet: function () { return prioritaet(); }
  };

})(typeof window !== "undefined" ? window : globalThis);
