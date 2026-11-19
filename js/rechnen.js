/* ==========================================================================
   MaterialMatch – Anzeige der erweiterten Berechnungen (Schritt 7)
   --------------------------------------------------------------------------
   Zeigt für die gewählten Materialien und die eingegebene Fläche und Dicke:
     - berechnete Materialkosten und Kostendifferenz
     - berechnete CO2-Menge (gesamt, fossil, biogen) und Differenz
     - Wärmedurchlasswiderstand R = d / λ
     - optional: erforderliche Dicke für einen gewünschten R-Wert
   Gerechnet wird in js/berechnung.js; die Vergleichbarkeit prüft js/bewertung.js.

   Wichtig: Differenzen werden nur angezeigt, wenn die Basis vergleichbar ist.
   R ist der Widerstand EINER Schicht, nicht der U-Wert eines Bauteils.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var el = MM.el;
  var daten = null;
  var boxen = {};
  var rZielFeld = null, rZielFehler = null;

  function hinweis(box, text) { box.appendChild(el("div", text, "empty-state")); }
  function notiz(text, klasse) { return el("p", text, klasse || "note"); }

  function quelle(id) { return id ? MM.finde(daten.quellen, id) : null; }

  function lage() {
    return { plaetze: MM.auswahl.holeAuswahl().plaetze, e: MM.eingaben.hole() };
  }

  // Meldung, wenn Fläche und Dicke noch nicht für die Rechnung reichen. true = es kann gerechnet werden.
  function eingabenPruefen(box, L, was) {
    if (!L.plaetze.length) { hinweis(box, "Wähle zuerst Materialien aus, um " + was + " zu berechnen."); return false; }
    if (L.e.status === "fehler") { hinweis(box, "Bitte korrigiere die markierten Eingaben (Fläche und Dicke)."); return false; }
    if (L.e.status !== "ok") { hinweis(box, "Gib Bauteilfläche und Materialdicke ein, um " + was + " zu berechnen."); return false; }
    return true;
  }

  // ---------- Differenzen ----------
  // items: [{ ok, wert }] in Spaltenreihenfolge; Bezug = erstes berechenbares Material.
  // Ergebnis: Zellen für eine Tabellenzeile.
  function differenzZellen(items, format, einheit) {
    var B = MM.berechnung;
    var bezug = null;
    items.forEach(function (it) { if (!bezug && it.ok) bezug = it; });
    return items.map(function (it) {
      if (!it.ok) return { text: "–" };
      if (it === bezug) return { text: "Bezug", klasse: "soft" };
      var u = B.berechneUnterschied(bezug.wert, it.wert);
      var zelle = { text: (u.absolut > 0 ? "+" : "") + format(u.absolut) + (einheit ? " " + einheit : "") };
      // Prozent nur gegen einen positiven Bezug; gegen null oder negative Werte wäre es irreführend
      if (bezug.wert > 0 && u.prozent !== null) zelle.zusatz = B.formatMitVorzeichen(Math.round(u.prozent * 10) / 10) + " %";
      return zelle;
    });
  }

  function bezugBuchstabe(items, plaetze) {
    for (var i = 0; i < items.length; i++) if (items[i].ok) return plaetze[i].buchstabe;
    return "";
  }

  function nichtBerechenbar(box, plaetze, ergebnisse) {
    ergebnisse.forEach(function (r, i) {
      if (!r.moeglich) {
        box.appendChild(notiz("Material " + plaetze[i].buchstabe + " (" + plaetze[i].material.name + "): " + r.grund, "card-note"));
      }
    });
  }

  function hatBeispiel(liste) {
    return liste.some(function (e) { return e && e.art === "beispiel"; });
  }

  // ---------- Kosten ----------

  function preisZelle(e) {
    if (!e || e.wert === null || e.wert === undefined) return { text: "Preis nicht verfügbar", klasse: "missing", notiz: e && e.hinweis };
    return { text: MM.berechnung.formatZahl(e.wert) + " " + e.einheit, art: e.art, quelle: quelle(e.quelle), notiz: e.hinweis };
  }

  function kosten(L) {
    var box = boxen.kosten;
    box.textContent = "";
    if (!eingabenPruefen(box, L, "die Materialkosten")) return;

    var B = MM.berechnung;
    var res = L.plaetze.map(function (p) { return B.berechneKosten(p.material, L.e.flaeche_m2, L.e.dicke_m); });
    var preise = L.plaetze.map(function (p) { return p.material.eigenschaften.preis; });

    var zeilen = [
      { titel: "Einheitspreis", begriff: "preis", zellen: preise.map(preisZelle) },
      { titel: "Rechenweg", zellen: res.map(function (r) {
        if (!r.moeglich) return { text: "–", klasse: "soft" };
        return { text: B.formatZahl(r.menge) + " " + r.mengeneinheit + " × " + B.formatZahl(r.preis) + " " + r.preiseinheit, klasse: "soft",
          zusatz: r.umweg ? "Gewicht = Volumen × Rohdichte" : null };
      }) },
      { titel: "Materialkosten (€)", klasse: "key-row", zellen: res.map(function (r) {
        return r.moeglich ? { text: B.formatEuro(r.kosten_eur), klasse: "strong" } : { text: "nicht berechenbar", klasse: "missing" };
      }) },
      { titel: "Preisbasis", zellen: preise.map(function (e) {
        if (!e || e.wert === null || e.wert === undefined) return { text: "–", klasse: "soft" };
        return { text: "MwSt: " + (e.mwst || "unbekannt") + " · Umfang: " + (e.umfang || "unbekannt"), klasse: "soft" };
      }) }
    ];

    var items = res.map(function (r) { return { ok: r.moeglich, wert: r.moeglich ? r.kosten_eur : null }; });
    var anzahl = items.filter(function (i) { return i.ok; }).length;
    var pr = MM.bewertung.pruefePreis(preise);
    var gemeinsam = MM.auswahl.gemeinsamerBereich(L.plaetze.map(function (p) { return p.material; }));

    if (anzahl >= 2) {
      var b = bezugBuchstabe(items, L.plaetze);
      var diff = differenzZellen(items, B.formatEuro, "€");
      zeilen.push({ titel: "Kostendifferenz zu Material " + b + " (€ und %)", zellen: diff });
    }
    box.appendChild(MM.tabelle.bauen({ plaetze: L.plaetze, zeilen: zeilen }));

    nichtBerechenbar(box, L.plaetze, res);
    // Händlerpreise gelten für eine bestimmte Produktdicke: bei anderer Dicke ist der Preis je m³ nur eine Orientierung
    var abweichend = [];
    L.plaetze.forEach(function (p, i) {
      var e = preise[i];
      if (e && e.bezugsdicke_m && res[i].moeglich && Math.abs(e.bezugsdicke_m - L.e.dicke_m) > 1e-9) {
        abweichend.push(p.material.name + " (Preis für " + B.formatEingabe(e.bezugsdicke_m * 1000) + " mm, eingegeben " + B.formatEingabe(L.e.dicke_m * 1000) + " mm)");
      }
    });
    if (abweichend.length) {
      box.appendChild(notiz("Orientierend: Der Händlerpreis gilt für eine bestimmte Produktdicke und wurde auf den Rauminhalt (€/m³) umgerechnet. Bei anderer Dicke kann der Preis je m³ abweichen: " +
        abweichend.join("; ") + ".", "warn"));
    }
    if (anzahl >= 2 && pr.vorbehalte.length) {
      box.appendChild(notiz("Kein belastbarer direkter Vergleich möglich: " + pr.vorbehalte.join("; ") +
        ". Die Kostendifferenz ist deshalb nur eine Orientierung.", "warn"));
    }
    if (anzahl >= 2 && !gemeinsam) {
      box.appendChild(notiz("Die Materialien haben keinen gemeinsamen Anwendungsbereich und erfüllen vermutlich unterschiedliche Funktionen. " +
        "Die Kostendifferenz sagt dann nichts über die Wirtschaftlichkeit aus.", "warn"));
    }
    if (hatBeispiel(preise)) {
      box.appendChild(notiz("Die mit B gekennzeichneten Preise sind frei gewählte Beispielwerte, keine Marktpreise. Die Kosten sind nur zum Ausprobieren."));
    }
    box.appendChild(notiz("Materialkosten = Menge × Einheitspreis. Die Menge ergibt sich aus der Preiseinheit: Volumen in m³, Gewicht in kg " +
      "(Volumen × Rohdichte) oder Fläche in m². Transport, Einbau und Mehrwertsteuer sind nur enthalten, wenn die Preisbasis es angibt."));
  }

  // ---------- CO2 ----------

  function co2Kennwertzelle(e) {
    if (!e || !e.werte) return { text: "fehlt", klasse: "missing" };
    return { text: MM.berechnung.formatZahl(e.werte.gesamt) + " kg CO₂e/" + String(e.deklarierte_einheit).replace(/^1\s*/, ""), art: e.art, quelle: quelle(e.quelle) };
  }

  function co2(L) {
    var box = boxen.co2;
    box.textContent = "";
    if (!eingabenPruefen(box, L, "die CO₂-Menge")) return;

    var B = MM.berechnung;
    var res = L.plaetze.map(function (p) { return B.berechneCo2(p.material, L.e.flaeche_m2, L.e.dicke_m); });
    var gwps = L.plaetze.map(function (p) { return p.material.eigenschaften.gwp; });
    var f = B.formatZahl;
    var hatLuluc = res.some(function (r) { return r.moeglich && r.luluc !== null; });

    var zeilen = [
      { titel: "Kennwert GWP gesamt", begriff: "gwp", zellen: gwps.map(co2Kennwertzelle) },
      { titel: "Rechenweg", zellen: res.map(function (r) {
        if (!r.moeglich) return { text: "–", klasse: "soft" };
        return { text: f(r.menge) + " " + r.mengeneinheit + " × " + f(r.kennwert.gesamt) + " kg CO₂e/" + r.mengeneinheit, klasse: "soft",
          zusatz: r.umweg ? "Gewicht = Volumen × Rohdichte" : null };
      }) },
      { titel: "CO₂-Menge gesamt (kg CO₂e)", klasse: "key-row", zellen: res.map(function (r) {
        return r.moeglich ? { text: f(r.gesamt), klasse: "strong" } : { text: "nicht berechenbar", klasse: "missing" };
      }) },
      { titel: "davon fossil", begriff: "fossil", zellen: res.map(function (r) { return r.moeglich ? { text: f(r.fossil) } : { text: "–", klasse: "soft" }; }) },
      { titel: "davon biogen", begriff: "biogen", zellen: res.map(function (r) { return r.moeglich ? { text: f(r.biogen) } : { text: "–", klasse: "soft" }; }) }
    ];
    if (hatLuluc) {
      zeilen.push({ titel: "davon Landnutzungsänderung (luluc)", begriff: "luluc", zellen: res.map(function (r) {
        return r.moeglich && r.luluc !== null ? { text: f(r.luluc) } : { text: "–", klasse: "soft" };
      }) });
    }

    // Vergleichbarkeit: Einheiten sind durch die Umrechnung erledigt, Module und Datensatztyp nicht
    var okListe = gwps.filter(function (g, i) { return res[i].moeglich; });
    var cr = MM.bewertung.pruefeCo2(okListe, quelle, { ohneEinheit: true });
    var gemeinsam = MM.auswahl.gemeinsamerBereich(L.plaetze.map(function (p) { return p.material; }));
    var anzahl = okListe.length;
    var vergleichbar = anzahl >= 2 && cr.probleme.length === 0 && gemeinsam;

    if (vergleichbar) {
      var itemsFossil = res.map(function (r) { return { ok: r.moeglich, wert: r.moeglich ? r.fossil : null }; });
      zeilen.push({ titel: "Differenz fossil zu Material " + bezugBuchstabe(itemsFossil, L.plaetze) + " (kg CO₂e und %)", zellen: differenzZellen(itemsFossil, f, "kg") });
      if (!cr.hatBiogen) {
        var itemsGesamt = res.map(function (r) { return { ok: r.moeglich, wert: r.moeglich ? r.gesamt : null }; });
        zeilen.push({ titel: "Differenz gesamt zu Material " + bezugBuchstabe(itemsGesamt, L.plaetze) + " (kg CO₂e und %)", zellen: differenzZellen(itemsGesamt, f, "kg") });
      }
    }
    box.appendChild(MM.tabelle.bauen({ plaetze: L.plaetze, zeilen: zeilen }));

    nichtBerechenbar(box, L.plaetze, res);
    if (anzahl >= 2 && cr.probleme.length) {
      box.appendChild(notiz("Kein belastbarer direkter Vergleich möglich: " + cr.probleme.join("; ") + ". " + cr.zusatz.join(" ") +
        " Differenzen werden deshalb nicht angezeigt.", "warn"));
    } else if (anzahl >= 2 && !gemeinsam) {
      box.appendChild(notiz("Die Materialien haben keinen gemeinsamen Anwendungsbereich und erfüllen vermutlich unterschiedliche Funktionen. " +
        "Differenzen werden deshalb nicht angezeigt.", "warn"));
    }
    if (vergleichbar && cr.hatBiogen) {
      box.appendChild(notiz("Biogener Kohlenstoff ist enthalten: Er wird am Lebensende wieder freigesetzt oder in Modul D verrechnet. " +
        "Die Differenz der Gesamtwerte wird deshalb nicht angezeigt; maßgeblich sind die fossilen Emissionen. Pauschale Aussagen wie „Holz ist immer klimafreundlicher“ sind nicht zulässig.", "warn"));
    }
    if (hatBeispiel(gwps)) {
      box.appendChild(notiz("Mit B gekennzeichnete CO₂-Werte sind Beispieldaten und nicht belastbar."));
    }
    var module = MM.bewertung.einzigartig(okListe.map(function (g) { return g.module; }));
    box.appendChild(notiz("CO₂-Menge = Menge × Kennwert. Die Bezugsgrößen werden umgerechnet: je m³ × Volumen, je kg × Gewicht (Volumen × Rohdichte), je m² × Fläche. " +
      (module.length ? "Berücksichtigte Lebenszyklusmodule: " + module.join(", ") + (module.join(", ") === "A1-A3" ? " (Herstellungsphase). " : ". ") : "") +
      "Nutzung, Rückbau und Gutschriften sind nicht enthalten. Das ist ein Vergleich je Menge Material, nicht je Bauteilfunktion."));
  }

  // ---------- R-Wert ----------

  function lambdaZelle(e) {
    if (!e) return { text: "keine Angabe", klasse: "missing" };
    if (e.nicht_anwendbar === true) return { text: "nicht anwendbar", klasse: "soft" };
    if (e.wert === null || e.wert === undefined) return { text: "fehlt", klasse: "missing" };
    return { text: MM.berechnung.formatZahl(e.wert), art: e.art, quelle: quelle(e.quelle) };
  }

  function rWert(L) {
    var box = boxen.r;
    box.textContent = "";
    if (!L.plaetze.length) { hinweis(box, "Wähle zuerst Materialien aus, um den R-Wert zu berechnen."); return; }
    if (L.e.dicke_gueltig_m === null) {
      hinweis(box, L.e.fehler.dicke ? "Bitte korrigiere die markierte Materialdicke." : "Gib die Materialdicke ein, um den R-Wert zu berechnen.");
      return;
    }
    var B = MM.berechnung;
    var d = L.e.dicke_gueltig_m;
    var res = L.plaetze.map(function (p) { return B.berechneR(p.material, d); });
    var nenn = L.plaetze.map(function (p) { return p.material.eigenschaften.waermeleitfaehigkeit; });
    var bem = L.plaetze.map(function (p) { return p.material.eigenschaften.waermeleitfaehigkeit_bemessung; });
    var lambdas = nenn.concat(bem);

    var zeilen = [
      { titel: "Nennwert λD (W/(m·K))", begriff: "lambdaD", zellen: nenn.map(lambdaZelle) },
      { titel: "Bemessungswert λB (W/(m·K))", begriff: "lambdaB", zellen: bem.map(lambdaZelle) },
      { titel: "Für R verwendet", zellen: res.map(grundlageZelle) },
      { titel: "Dicke d (cm)", zellen: res.map(function () { return { text: B.formatZahl(d * 100) }; }) },
      { titel: "R = d / λ (m²K/W)", begriff: "rwert", klasse: "key-row", zellen: res.map(function (r) {
        return r.moeglich ? { text: B.formatZahl(r.R), klasse: "strong" } : { text: "nicht berechenbar", klasse: "missing" };
      }) }
    ];
    box.appendChild(MM.tabelle.bauen({ plaetze: L.plaetze, zeilen: zeilen }));
    nichtBerechenbar(box, L.plaetze, res);
    rGrundlageHinweis(box, res);
    if (hatBeispiel(lambdas)) {
      box.appendChild(notiz("Mit B gekennzeichnete λ-Werte sind Beispieldaten. Der R-Wert ist dann nicht belastbar."));
    }
    box.appendChild(notiz("R ist der Wärmedurchlasswiderstand einer einzelnen Schicht (R = d / λ, mit d in Meter). Er ist nicht der U-Wert eines Bauteils: " +
      "Dafür kommen alle Schichten und die Wärmeübergangswiderstände hinzu. Je höher R, desto besser dämmt die Schicht bei gleicher Betrachtung."));
  }

  // Welche Wärmeleitfähigkeit steckt im R-Wert? Bemessungswert (Planungswert) oder nur der Nennwert (orientierend)
  function grundlageZelle(r) {
    if (!r.moeglich) return { text: "–", klasse: "soft" };
    if (r.lambdaTyp === "bemessung") return { text: "Bemessungswert λB" };
    return { text: "Nennwert λD, orientierend", klasse: "missing" };
  }

  function rGrundlageHinweis(box, res) {
    var ok = res.filter(function (r) { return r.moeglich; });
    if (!ok.length) return;
    var nurNenn = ok.filter(function (r) { return r.lambdaTyp === "nennwert"; }).length;
    if (nurNenn) {
      box.appendChild(notiz("Orientierend, kein Wärmeschutznachweis: " + (nurNenn === ok.length ? "Für alle berechneten Materialien" : "Für " + nurNenn + " von " + ok.length + " Materialien") +
        " liegt nur der Nennwert λD vor, kein Bemessungswert λB. Der R-Wert ist deshalb ein Näherungswert; mit dem höheren Bemessungswert fiele er niedriger aus. " +
        "Er eignet sich für den Vergleich in frühen Entwurfsphasen, nicht für einen Nachweis.", "warn"));
    } else {
      box.appendChild(notiz("Der R-Wert wurde mit dem Bemessungswert λB gerechnet. Er bleibt ein Rechenwert für den Vergleich einer einzelnen Schicht und ersetzt keinen Wärmeschutznachweis für das Bauteil."));
    }
  }

  // ---------- Erforderliche Dicke für gewünschten R-Wert ----------

  function rZielAktualisieren() {
    var z = MM.berechnung.pruefeRZiel(rZielFeld.value);
    rZielFehler.textContent = z.fehler || "";
    if (z.fehler) { rZielFeld.classList.add("is-invalid"); rZielFeld.setAttribute("aria-invalid", "true"); }
    else { rZielFeld.classList.remove("is-invalid"); rZielFeld.removeAttribute("aria-invalid"); }
    return z;
  }

  function rZiel(L, z) {
    var box = boxen.rziel;
    box.textContent = "";
    if (z.status === "leer") {
      box.appendChild(notiz("Gib einen gewünschten R-Wert ein (z. B. 5), dann siehst du, welche Dicke jedes Material dafür braucht. " +
        "So lassen sich Dämmstoffe nach gleicher Dämmwirkung vergleichen, nicht nach gleicher Dicke."));
      return;
    }
    if (z.status === "fehler") { hinweis(box, "Bitte korrigiere den gewünschten R-Wert."); return; }
    if (!L.plaetze.length) { hinweis(box, "Wähle zuerst Materialien aus."); return; }

    var B = MM.berechnung;
    var f = B.formatZahl;
    var erf = L.plaetze.map(function (p) { return B.erforderlicheDicke(p.material, z.r); });
    var nenn = L.plaetze.map(function (p) { return p.material.eigenschaften.waermeleitfaehigkeit; });
    var bem = L.plaetze.map(function (p) { return p.material.eigenschaften.waermeleitfaehigkeit_bemessung; });
    var lambdas = nenn.concat(bem);
    var flaeche = L.e.flaeche_gueltig_m2;

    var zeilen = [
      { titel: "Nennwert λD (W/(m·K))", begriff: "lambdaD", zellen: nenn.map(lambdaZelle) },
      { titel: "Bemessungswert λB (W/(m·K))", begriff: "lambdaB", zellen: bem.map(lambdaZelle) },
      { titel: "Für die Dicke verwendet", zellen: erf.map(grundlageZelle) },
      { titel: "Erforderliche Dicke für R = " + f(z.r) + " (cm)", klasse: "key-row", zellen: erf.map(function (r) {
        return r.moeglich ? { text: f(r.dicke_m * 100), klasse: "strong" } : { text: "nicht berechenbar", klasse: "missing" };
      }) }
    ];

    var kosten = null, co2 = null;
    if (flaeche !== null) {
      kosten = L.plaetze.map(function (p, i) { return erf[i].moeglich ? B.berechneKosten(p.material, flaeche, erf[i].dicke_m) : erf[i]; });
      co2 = L.plaetze.map(function (p, i) { return erf[i].moeglich ? B.berechneCo2(p.material, flaeche, erf[i].dicke_m) : erf[i]; });
      zeilen.push({ titel: "Volumen (m³)", zellen: erf.map(function (r) {
        return r.moeglich ? { text: f(flaeche * r.dicke_m) } : { text: "–", klasse: "soft" };
      }) });
      zeilen.push({ titel: "Materialkosten (€)", zellen: kosten.map(function (r) {
        return r.moeglich ? { text: B.formatEuro(r.kosten_eur) } : { text: "–", klasse: "soft" };
      }) });
      zeilen.push({ titel: "CO₂ gesamt (kg CO₂e)", zellen: co2.map(function (r) { return r.moeglich ? { text: f(r.gesamt) } : { text: "–", klasse: "soft" }; }) });
      zeilen.push({ titel: "CO₂ fossil (kg CO₂e)", zellen: co2.map(function (r) { return r.moeglich ? { text: f(r.fossil) } : { text: "–", klasse: "soft" }; }) });

      // Differenzen nur bei vergleichbarer Basis
      var kItems = kosten.map(function (r) { return { ok: r.moeglich, wert: r.moeglich ? r.kosten_eur : null }; });
      if (kItems.filter(function (i) { return i.ok; }).length >= 2) {
        zeilen.push({ titel: "Kostendifferenz zu Material " + bezugBuchstabe(kItems, L.plaetze) + " (€ und %)", zellen: differenzZellen(kItems, B.formatEuro, "€") });
      }
      var okGwp = L.plaetze.map(function (p) { return p.material.eigenschaften.gwp; }).filter(function (g, i) { return co2[i].moeglich; });
      var cr = MM.bewertung.pruefeCo2(okGwp, quelle, { ohneEinheit: true });
      var gemeinsam = MM.auswahl.gemeinsamerBereich(L.plaetze.map(function (p) { return p.material; }));
      var fItems = co2.map(function (r) { return { ok: r.moeglich, wert: r.moeglich ? r.fossil : null }; });
      if (okGwp.length >= 2 && cr.probleme.length === 0 && gemeinsam) {
        zeilen.push({ titel: "CO₂-Differenz fossil zu Material " + bezugBuchstabe(fItems, L.plaetze) + " (kg CO₂e und %)", zellen: differenzZellen(fItems, f, "kg") });
      }
    }
    box.appendChild(MM.tabelle.bauen({ plaetze: L.plaetze, zeilen: zeilen }));

    nichtBerechenbar(box, L.plaetze, erf);
    if (flaeche === null) {
      box.appendChild(notiz("Gib die Bauteilfläche ein, um auch Kosten und CO₂ für diese Dicke zu sehen."));
    } else {
      var preise = L.plaetze.map(function (p) { return p.material.eigenschaften.preis; });
      var pr = MM.bewertung.pruefePreis(preise);
      if (pr.vorbehalte.length) {
        box.appendChild(notiz("Kein belastbarer direkter Kostenvergleich möglich: " + pr.vorbehalte.join("; ") + ". Die Kostendifferenz ist nur eine Orientierung.", "warn"));
      }
      box.appendChild(notiz("Alle Materialien erreichen hier denselben Wärmedurchlasswiderstand R = d / λ. Die Dicke ergibt sich aus d = R × λ. " +
        "Kosten und CO₂ beziehen sich auf diese Dicke und auf die eingegebene Fläche (" + f(flaeche) + " m²). Das ist ein Vergleich je Dämmwirkung einer einzelnen Schicht, nicht je U-Wert eines Bauteils."));
    }
    if (hatBeispiel(lambdas) || hatBeispiel(L.plaetze.map(function (p) { return p.material.eigenschaften.preis; }))) {
      box.appendChild(notiz("Mit B gekennzeichnete λ-Werte und Preise sind Beispieldaten und nicht belastbar."));
    }
  }

  function render() {
    var L = lage();
    kosten(L);
    co2(L);
    rWert(L);
    rZiel(L, rZielAktualisieren());
  }

  MM.rechnen = {
    init: function (baustoffdaten) {
      daten = baustoffdaten;
      boxen.kosten = document.getElementById("rechnung-kosten");
      boxen.co2 = document.getElementById("rechnung-co2");
      boxen.r = document.getElementById("rechnung-r");
      boxen.rziel = document.getElementById("rechnung-rziel");
      rZielFeld = document.getElementById("rZiel");
      rZielFehler = document.getElementById("rziel-fehler");
      if (!boxen.kosten || !boxen.co2 || !boxen.r || !boxen.rziel || !rZielFeld || !rZielFehler) return;
      document.addEventListener("mm:auswahl", render);
      document.addEventListener("mm:eingaben", render);
      rZielFeld.addEventListener("input", render);
      render();
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
