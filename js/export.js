/* ==========================================================================
   MaterialMatch – Export (Schritt 13)
   --------------------------------------------------------------------------
   1. Druckansicht / PDF: Die Schaltfläche ruft den Druckdialog des Browsers auf
      ("Als PDF speichern" erzeugt das PDF). Vor dem Drucken werden alle Abschnitte
      aufgeklappt und ein Berichtskopf mit Eingaben und Datenstand erzeugt; nach dem
      Drucken wird der alte Zustand wiederhergestellt. Das Aussehen steuert der
      Abschnitt "@media print" in css/style.css.
   2. CSV: Die Vergleichsdaten werden als Textdatei mit Semikolon als Trenner,
      Dezimalkomma und UTF-8-Kennung (BOM) erzeugt. So öffnet Excel sie mit Umlauten
      und Zahlen richtig. Die Datei enthält Eingaben, Kennwerte mit Datenart und Quelle,
      berechnete Ergebnisse, Empfehlungen und die verwendeten Quellen.

   MM.exportieren.baueCsv(optionen)   reine Funktion, liefert den CSV-Text
   MM.exportieren.csvHerunterladen()  erzeugt und lädt die Datei herunter
   MM.exportieren.druckVorbereiten()  / druckNachbereiten()
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};

  var BOM = "\uFEFF";   // Kennung, an der Excel UTF-8 erkennt (sonst werden Umlaute falsch angezeigt)
  var TRENNER = ";";
  var ZEILENENDE = "\r\n";

  var FARBSATZ = "Die Farben zeigen eine relative Bewertung der ausgewählten Materialien und stellen keine allgemeingültige Aussage über deren Qualität dar.";
  var HAFTUNG = "Hilfsmittel für frühe Entwurfsphasen. Ersetzt keine bauphysikalischen Nachweise, keine Tragwerksplanung, keine Brandschutzplanung und keine fachliche Materialfreigabe. Die Werte sagen nichts über Zulassungen, technische Gleichwertigkeit oder Normkonformität aus.";
  var DATENARTEN = { verifiziert: "verifiziert", richtwert: "Richtwert", beispiel: "Beispieldaten", eigen: "Eigene Angabe (nicht geprüft)" };

  // ---------- CSV-Bausteine ----------

  // Zahl im deutschen Format ohne Tausenderpunkt, bis zu 7 gültige Ziffern (kein Informationsverlust für die Anzeige)
  function csvZahl(x) {
    if (typeof x !== "number" || !isFinite(x)) return "";
    return new Intl.NumberFormat("de-DE", { useGrouping: false, maximumSignificantDigits: 7 }).format(x);
  }

  // Eine Zelle: Zahlen kommen als { zahl: "…" } (bleiben unverändert), Text wird gegen Formeln geschützt.
  // Excel würde Zellen, die mit = + - @ beginnen, als Formel ausführen; ein vorangestelltes ' verhindert das.
  function zelle(x) {
    var s;
    if (x !== null && typeof x === "object" && "zahl" in x) {
      s = String(x.zahl);
    } else {
      s = x === null || x === undefined ? "" : String(x);
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    }
    if (/[";\r\n]/.test(s)) s = "\"" + s.replace(/"/g, "\"\"") + "\"";
    return s;
  }

  function zeile(zellen) { return zellen.map(zelle).join(TRENNER); }
  function zahl(x) { return { zahl: csvZahl(x) }; }

  function datumText(d) {
    function z2(n) { return (n < 10 ? "0" : "") + n; }
    return z2(d.getDate()) + "." + z2(d.getMonth() + 1) + "." + d.getFullYear() + " " + z2(d.getHours()) + ":" + z2(d.getMinutes());
  }

  // ---------- Kennwerte eines Materials ----------

  var EIGENSCHAFTEN = [
    { id: "rohdichte", name: "Rohdichte", zahl: true },
    { id: "flaechengewicht", name: "Flächengewicht", zahl: true, nurWennVorhanden: true },
    { id: "waermeleitfaehigkeit", name: "Nennwert der Wärmeleitfähigkeit λD", zahl: true },
    { id: "waermeleitfaehigkeit_bemessung", name: "Bemessungswert der Wärmeleitfähigkeit λB", zahl: true },
    { id: "druckfestigkeit", name: "Druckfestigkeit", zahl: true },
    { id: "brandverhalten", name: "Brandverhalten (Euroklasse)", zahl: false },
    { id: "wasserdampf_mu", name: "Diffusionswiderstandszahl μ", zahl: true },
    { id: "waermekapazitaet", name: "Wärmekapazität", zahl: true },
    { id: "preis", name: "Einheitspreis", zahl: true },
    { id: "recycling", name: "Recycling", zahl: false }
  ];

  function quelleVon(e, verwendet) {
    var q = e && e.quelle ? MM.quellen.beschreibe(MM.quellen.finde(e.quelle)) : null;
    if (q && verwendet) verwendet[q.id] = true;
    return q ? { titel: q.titel + (q.eigner ? " (" + q.eigner + ")" : ""), url: q.url || "" } : { titel: "", url: "" };
  }

  function platzName(p) { return p.buchstabe + ": " + p.material.name; }

  // Kennwert-Zeilen (Bereich "Kennwert")
  function kennwertZeilen(p, verwendet) {
    var m = p.material, out = [];
    EIGENSCHAFTEN.forEach(function (k) {
      var e = m.eigenschaften[k.id];
      if (!e && k.nurWennVorhanden) return;
      if (!e) { out.push(["Kennwert", platzName(p), k.name, "nicht verfügbar", "", "", "", "", ""]); return; }
      if (k.nurWennVorhanden && (e.wert === null || e.wert === undefined) && e.nicht_anwendbar !== true) return;
      var hat = e.wert !== null && e.wert !== undefined;
      var wert, einheit = e.einheit || "";
      if (e.nicht_anwendbar === true) { wert = "nicht anwendbar"; einheit = ""; }
      else if (!hat) { wert = "nicht verfügbar"; einheit = ""; }
      else wert = k.zahl ? zahl(e.wert) : e.wert;
      var q = hat ? quelleVon(e, verwendet) : { titel: "", url: "" };
      var hinweis = e.hinweis || "";
      if (k.id === "preis" && hat) {
        hinweis = "Mehrwertsteuer: " + (e.mwst || "unbekannt") + "; Leistungsumfang: " + (e.umfang || "unbekannt") + (hinweis ? ". " + hinweis : "");
      }
      out.push(["Kennwert", platzName(p), k.name, wert, einheit, hat ? (DATENARTEN[e.art] || "") : "", q.titel, q.url, hinweis]);
    });

    var g = m.eigenschaften.gwp;
    if (g && g.werte) {
      var q = quelleVon(g, verwendet);
      var einheit = "kg CO₂e je " + g.deklarierte_einheit.replace("1 ", "") + " (Module " + g.module + ")";
      [["gesamt", "GWP gesamt"], ["fossil", "GWP fossil"], ["biogen", "GWP biogen"], ["luluc", "GWP Landnutzungsänderung (luluc)"]].forEach(function (z) {
        if (typeof g.werte[z[0]] !== "number") return;
        out.push(["Kennwert", platzName(p), z[1], zahl(g.werte[z[0]]), einheit, DATENARTEN[g.art] || "", q.titel, q.url, g.hinweis || ""]);
      });
    } else {
      out.push(["Kennwert", platzName(p), "GWP (CO₂-Kennwert)", "nicht verfügbar", "", "", "", "", (g && g.hinweis) || ""]);
    }
    return out;
  }

  // Berechnete Ergebnisse (Bereich "Berechnung")
  function berechnungsZeilen(p, e, verwendet) {
    var B = MM.berechnung, m = p.material, out = [];
    var name = platzName(p);
    var rd = m.eigenschaften.rohdichte, fg = m.eigenschaften.flaechengewicht;

    function zeileMit(kennwert, wert, einheit, eig, hinweis) {
      var q = eig ? quelleVon(eig, verwendet) : { titel: "", url: "" };
      out.push(["Berechnung", name, kennwert, wert, einheit, eig ? (DATENARTEN[eig.art] || "") : "", q.titel, q.url, hinweis || ""]);
    }
    function nicht(kennwert, grund) { out.push(["Berechnung", name, kennwert, "nicht berechenbar", "", "", "", "", grund]); }

    // Volumen und Gewicht
    var s = B.berechneSchicht(m, e.flaeche_m2, e.dicke_m);
    if (s.moeglich) {
      if (s.volumen_m3 !== null) out.push(["Berechnung", name, "Volumen", zahl(s.volumen_m3), "m³", "", "", "", "Fläche × Dicke"]);
      if (s.basis === "flaeche") {
        zeileMit("Gesamtgewicht", zahl(s.gewicht_kg), "kg", fg, "Fläche × Flächengewicht (" + csvZahl(s.flaechengewicht) + " kg/m²); die eingegebene Dicke wird nicht verwendet");
      } else {
        zeileMit("Gesamtgewicht", zahl(s.gewicht_kg), "kg", rd, "Fläche × Dicke × Rohdichte (" + csvZahl(s.rohdichte) + " kg/m³)");
        zeileMit("Flächenmasse", zahl(s.flaechenmasse_kgm2), "kg/m²", rd, "Dicke × Rohdichte");
      }
    } else {
      nicht("Gesamtgewicht", s.grund);
    }

    // Kosten
    var k = B.berechneKosten(m, e.flaeche_m2, e.dicke_m);
    var preis = m.eigenschaften.preis;
    if (k.moeglich) {
      zeileMit("Materialkosten", zahl(k.kosten_eur), "€", preis,
        "Menge (" + csvZahl(k.menge) + " " + k.mengeneinheit + ") × Einheitspreis (" + csvZahl(k.preis) + " " + k.preiseinheit + "); Mehrwertsteuer: " +
        (preis.mwst || "unbekannt") + "; Leistungsumfang: " + (preis.umfang || "unbekannt"));
    } else {
      nicht("Materialkosten", k.grund);
    }

    // CO2
    var c = B.berechneCo2(m, e.flaeche_m2, e.dicke_m);
    var gwp = m.eigenschaften.gwp;
    if (c.moeglich) {
      var basis = "Menge (" + csvZahl(c.menge) + " " + c.mengeneinheit + ") × Kennwert je " + c.bezug.replace("1 ", "") + ", Module " + c.module;
      zeileMit("CO₂-Menge gesamt", zahl(c.gesamt), "kg CO₂e", gwp, basis);
      zeileMit("CO₂-Menge fossil", zahl(c.fossil), "kg CO₂e", gwp, basis);
      zeileMit("CO₂-Menge biogen", zahl(c.biogen), "kg CO₂e", gwp, basis + ". Negativ bedeutet im Material gespeicherter Kohlenstoff; er wird am Lebensende wieder freigesetzt oder in Modul D verrechnet");
      if (c.luluc !== null) zeileMit("CO₂-Menge Landnutzungsänderung (luluc)", zahl(c.luluc), "kg CO₂e", gwp, basis);
    } else {
      nicht("CO₂-Menge", c.grund);
    }

    // R-Wert
    var r = B.berechneR(m, e.dicke_m);
    if (r.moeglich) {
      var lw = B.lambdaWahl(m.eigenschaften);
      zeileMit("Wärmedurchlasswiderstand R", zahl(r.R), "m²K/W", lw ? lw.eig : m.eigenschaften.waermeleitfaehigkeit,
        "R = d / λ = " + csvZahl(e.dicke_m) + " m / " + csvZahl(r.lambda) + " W/(m·K) (" +
        (r.lambdaTyp === "bemessung" ? "Bemessungswert λB" : "Nennwert λD – orientierend, kein Wärmeschutznachweis, da kein Bemessungswert vorliegt") +
        "); nicht der U-Wert eines Bauteils");
    } else {
      nicht("Wärmedurchlasswiderstand R", r.grund);
    }
    return out;
  }

  // ---------- Gesamter CSV-Text ----------
  // optionen: { daten, plaetze, eingaben, anwendung, prioritaet, empfehlung, datum }
  function baueCsv(o) {
    var d = o.daten, plaetze = o.plaetze || [], e = o.eingaben || { status: "leer" };
    var verwendet = {};
    var z = [];

    z.push(zeile(["Abschnitt 1: Eingaben und Hinweise"]));
    z.push(zeile(["Angabe", "Wert", "Einheit"]));
    z.push(zeile(["Dokument", "MaterialMatch – Export der Vergleichsdaten", ""]));
    z.push(zeile(["Erstellt am", datumText(o.datum || new Date()), ""]));
    z.push(zeile(["Baustoffdatenbank", "Version " + d.meta.version + ", Datenstand " + d.meta.datenstand, ""]));
    z.push(zeile(["Datenmodus", o.modus || "Demo-Modus (Beispieldaten verwendet)", ""]));
    var orient = MM.datenmodus && MM.datenmodus.orientierung ? MM.datenmodus.orientierung(plaetze) : "";
    if (orient) z.push(zeile(["Hinweis Orientierung", orient, ""]));
    if (!o.modus || /^Demo/.test(o.modus)) {
      z.push(zeile(["Achtung Beispieldaten", "Werte mit der Datenart „Beispieldaten“ sind frei gewählte Demonstrationswerte und keine geprüften Echtwerte. Sie sind nicht für reale Entscheidungen geeignet.", ""]));
    } else {
      z.push(zeile(["Hinweis Echtdaten-Modus", "Beispieldaten wurden nicht verwendet; sie gelten als „nicht verfügbar“. Berechnungen und Empfehlungen beruhen nur auf belegten Werten.", ""]));
    }
    plaetze.forEach(function (p) { z.push(zeile(["Material " + p.buchstabe, p.material.name, ""])); });
    plaetze.forEach(function (p) {
      var pa = p.material.produktAktiv;
      if (pa && pa.herstellerangaben) pa.herstellerangaben.forEach(function (h) {
        var qh = MM.quellen.finde(h.quelle);
        z.push(zeile(["Herstellerangabe " + p.buchstabe, h.bezeichnung + ": " + h.wert + " " + h.einheit + " (nicht bestätigt, nicht in Berechnungen)", h.hinweis + (qh && qh.url ? " Quelle: " + qh.url : "")]));
      });
      if (pa) z.push(zeile(["Produkt " + p.buchstabe, pa.generisch ? "Generischer Materialdatensatz (kein konkretes Produkt)" : pa.name + (pa.eigen ? " (eigenes Produkt, nicht geprüft)" : ""), pa.generisch ? "" : "Hersteller: " + pa.hersteller]));
    });
    if (e.status === "ok") {
      z.push(zeile(["Bauteilfläche", zahl(e.flaeche_m2), "m²"]));
      z.push(zeile(["Materialdicke", zahl(e.dicke_wert), e.dicke_einheit]));
    } else {
      z.push(zeile(["Eingaben", "Fläche und Dicke fehlen oder sind fehlerhaft; berechnete Ergebnisse sind deshalb nicht enthalten", ""]));
    }
    z.push(zeile(["Anwendungsbereich (Empfehlung)", o.anwendung || "–", ""]));
    z.push(zeile(["Vergleichspriorität", o.prioritaet || "–", ""]));
    z.push(zeile(["Hinweis zu Farben", FARBSATZ, ""]));
    z.push(zeile(["Hinweis zur Verwendung", HAFTUNG, ""]));
    z.push(zeile(["Datenarten", "Richtwert = Orientierungswert mit Quelle (gilt nicht für jedes Produkt); verifiziert = anhand geprüfter Quelle nachvollzogen; Beispieldaten = nicht geprüfte Demonstrationswerte (nicht belastbar); nicht verfügbar = kein belastbarer Beleg vorhanden", ""]));
    z.push(zeile(["Vergleichsbasis", "Berechnet wird je Menge des Materials für die angegebene Fläche und Dicke, nicht je Bauteilfunktion", ""]));
    z.push("");

    z.push(zeile(["Abschnitt 2: Kennwerte und berechnete Ergebnisse"]));
    z.push(zeile(["Bereich", "Material", "Kennwert", "Wert", "Einheit", "Datenart", "Quelle", "Link", "Hinweis"]));
    if (!plaetze.length) {
      z.push(zeile(["–", "Kein Material gewählt", "", "", "", "", "", "", ""]));
    }
    plaetze.forEach(function (p) {
      kennwertZeilen(p, verwendet).forEach(function (r) { z.push(zeile(r)); });
    });
    if (e.status === "ok") {
      plaetze.forEach(function (p) {
        berechnungsZeilen(p, e, verwendet).forEach(function (r) { z.push(zeile(r)); });
      });
    }
    z.push("");

    var emp = o.empfehlung;
    z.push(zeile(["Abschnitt 3: Alternative Baustoffe (regelbasierte Empfehlung)"]));
    if (emp && (emp.empfehlungen.length || emp.nichtEmpfohlen.length || emp.meldung)) {
      z.push(zeile(["Rang", "Alternative", "Gesamtbewertung (0 bis 1)", "Vergleich zu Material A", "Belastbarkeit", "Begründung"]));
      emp.empfehlungen.forEach(function (x, i) {
        z.push(zeile([i + 1, x.material.name, zahl(Math.round(x.score * 100) / 100), x.vergleichZuA || "", x.belastbarkeit ? x.belastbarkeit.text : "", x.begruendung || ""]));
        (x.quellen || []).forEach(function (q) { verwendet[q.id] = true; });
      });
      if (emp.meldung) z.push(zeile(["–", "", "", "", "", emp.meldung]));
      emp.nichtEmpfohlen.forEach(function (n) { z.push(zeile(["nicht empfohlen", n.material.name, "", "", "", n.grund])); });
    } else {
      z.push(zeile(["Keine Empfehlung: Es ist kein Ausgangsmaterial gewählt."]));
    }
    z.push("");

    z.push(zeile(["Abschnitt 4: Verwendete Quellen"]));
    z.push(zeile(["Quelle-ID", "Titel", "Eigner / Herausgeber", "Angaben", "Link"]));
    var ids = Object.keys(verwendet);
    if (!ids.length) z.push(zeile(["–", "Keine belegten Kennwerte in der Auswahl", "", "", ""]));
    ids.forEach(function (id) {
      var q = MM.quellen.beschreibe(MM.quellen.finde(id));
      if (q) z.push(zeile([q.id, q.titel, q.eigner || "", q.detail, q.url || ""]));
    });

    return BOM + z.join(ZEILENENDE) + ZEILENENDE;
  }

  // ---------- Daten aus der Seite sammeln und herunterladen ----------

  function optionText(id) {
    var s = document.getElementById(id);
    if (!s || !s.options.length) return "";
    var o = s.options[s.selectedIndex];
    return o ? o.textContent : "";
  }

  function aktuelleOptionen() {
    var daten = root.MATERIALMATCH_DATA;
    var auswahl = MM.auswahl.holeAuswahl();
    var ref = auswahl.plaetze.length ? auswahl.plaetze[0].material : null;
    var bereichFeld = document.getElementById("anwendung");
    var prio = MM.prioritaet ? MM.prioritaet.holen() : "ausgewogen";
    var emp = ref ? MM.empfehlung.empfehle(daten, ref.id, bereichFeld && bereichFeld.value ? bereichFeld.value : null, prio, ref) : null;
    return {
      daten: daten,
      plaetze: auswahl.plaetze,
      eingaben: MM.eingaben.hole(),
      modus: MM.datenmodus ? MM.datenmodus.name() : "",
      anwendung: emp && emp.bereich ? (MM.finde(daten.anwendungsbereiche, emp.bereich) || {}).name : "",
      prioritaet: MM.empfehlung.PRIORITAETEN[prio],
      empfehlung: emp,
      datum: new Date()
    };
  }

  function dateiname(datum) {
    function z2(n) { return (n < 10 ? "0" : "") + n; }
    return "MaterialMatch_Vergleich_" + datum.getFullYear() + "-" + z2(datum.getMonth() + 1) + "-" + z2(datum.getDate()) + ".csv";
  }

  function csvHerunterladen() {
    var o = aktuelleOptionen();
    var text = baueCsv(o);
    var blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = root.URL.createObjectURL(blob);
    a.download = dateiname(o.datum);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { root.URL.revokeObjectURL(a.href); }, 1000);
    return a.download;
  }

  // ---------- Druckansicht ----------

  var gemerkt = null;      // Zustand der aufklappbaren Bereiche vor dem Drucken

  // Berichtskopf (MaterialMatch 3.0): die erste Seite enthält Logo, Titel des Vergleichs, Materialien mit Illustration,
  // Eingaben, die wichtigsten Kennzahlen und die wichtigen Hinweise; danach folgen die Diagramme.
  // Die Kennzahlen stammen aus derselben Lese-Schnittstelle wie das Dashboard (MM.diagramme.ergebnisse), es wird nichts neu gerechnet.
  var KENNZAHLEN = [
    { id: "kosten", titel: "Materialkosten", einheit: "€", braucht: true },
    { id: "co2-fossil", titel: "CO₂ (fossil)", einheit: "kg CO₂e", braucht: true },
    { id: "gewicht", titel: "Gewicht", einheit: "kg", braucht: true },
    { id: "lambda", titel: "Wärmeleitfähigkeit λ", einheit: "W/(m·K)", braucht: false },
    { id: "r", titel: "R-Wert (R = d / λ)", einheit: "m²K/W", braucht: false }
  ];
  var STATUS_DE = { fehlt: "fehlt", nicht_anwendbar: "nicht anwendbar", nicht_berechenbar: "nicht berechenbar", nicht_vergleichbar: "nicht vergleichbar" };

  function kennzahlenTabelle(o) {
    var el = MM.el;
    var erg = MM.diagramme && MM.diagramme.ergebnisse ? MM.diagramme.ergebnisse() : null;
    if (!erg || !erg.anzahl) return null;
    var t = el("table", null, "pk-kennzahlen");
    var kopf = el("tr");
    kopf.appendChild(el("th", "Wichtigste Kennzahlen"));
    o.plaetze.forEach(function (p) { kopf.appendChild(el("th", "Material " + p.buchstabe)); });
    var th = el("thead"); th.appendChild(kopf); t.appendChild(th);
    var tb = el("tbody");
    KENNZAHLEN.forEach(function (k) {
      var zeile = el("tr");
      var tz = el("th", null);
      tz.appendChild(document.createTextNode(k.titel));
      tz.appendChild(el("span", " (" + k.einheit + ")", "pk-einheit"));
      zeile.appendChild(tz);
      var d = k.id === "r" ? erg.diagramme.lambda : erg.diagramme[k.id];
      o.plaetze.forEach(function (p) {
        var td = el("td");
        var z = d ? d.zeilen.filter(function (x) { return x.buchstabe === p.buchstabe; })[0] : null;
        if (k.braucht && !erg.mitEingabe) { td.appendChild(el("span", "Fläche und Dicke fehlen", "pk-fehlt")); }
        else if (!z) td.appendChild(el("span", "–", "pk-fehlt"));
        else if (k.id === "r") {
          if (z.rWert) {
            td.appendChild(el("strong", MM.berechnung.formatZahl(z.rWert.wert), "pk-zahl"));
            if (z.rWert.lambdaTyp !== "bemessung") td.appendChild(el("span", " orientierend", "pk-einheit"));
          } else td.appendChild(el("span", erg.mitEingabe || true ? "nicht berechenbar" : "–", "pk-fehlt"));
        } else if (z.status === "wert") {
          td.appendChild(el("strong", MM.berechnung.formatZahl(z.wert), "pk-zahl"));
          if (z.art && MM.tabelle && MM.tabelle.ART[z.art]) td.appendChild(el("span", " " + MM.tabelle.ART[z.art].kurz, "art art-" + z.art));
          // kleines Balkendiagramm: Länge = Wert im Verhältnis zum größten Wert der Zeile, Farbe = relative Bewertung wie im Diagramm
          var max = 0;
          d.zeilen.forEach(function (x) { if (x.status === "wert" && x.wert > max) max = x.wert; });
          if (max > 0 && z.wert >= 0) {
            var sp = el("span", null, "pk-spur");
            var bal = el("i", null, "pk-balken");
            bal.style.width = Math.max(2, Math.round(z.wert / max * 100)) + "%";
            bal.style.background = z.farbe || "#98a1ac";
            sp.appendChild(bal);
            td.appendChild(sp);
          }
        } else td.appendChild(el("span", STATUS_DE[z.status] || z.status, "pk-fehlt"));
        zeile.appendChild(td);
      });
      tb.appendChild(zeile);
    });
    // Datenqualität je Material (aus Datenart und Quelle der gezeigten Kennwerte, nichts Neues bewertet)
    var QUAL_KEY = { kosten: "preis", "co2-fossil": "gwp", gewicht: "rohdichte", lambda: "waermeleitfaehigkeit" };
    var dz = el("tr", null, "pk-qualitaet");
    var dth = el("th", "Datenqualität"); dth.appendChild(el("span", " (Kennwerte oben)", "pk-einheit")); dz.appendChild(dth);
    o.plaetze.forEach(function (p) {
      var namen = [];
      Object.keys(QUAL_KEY).forEach(function (id) {
        var d = erg.diagramme[id];
        var z = d ? d.zeilen.filter(function (x) { return x.buchstabe === p.buchstabe; })[0] : null;
        if (!z || z.status !== "wert") return;
        var n = MM.quellen.datenqualitaet(z.art, z.quelle, QUAL_KEY[id]).name;
        if (namen.indexOf(n) === -1) namen.push(n);
      });
      dz.appendChild(el("td", namen.length ? namen.join(" · ") : "Keine belegten Daten", "pk-qualitaet-text"));
    });
    tb.appendChild(dz);
    t.appendChild(tb);
    return t;
  }

  // Kurzüberblick in einem Satz: nur die niedrigsten Werte der bewerteten Kennzahlen (steht so in der Tabelle darüber)
  function kurzueberblick(o) {
    var erg = MM.diagramme && MM.diagramme.ergebnisse ? MM.diagramme.ergebnisse() : null;
    if (!erg || !erg.anzahl) return "";
    var teile = [];
    [["kosten", "Materialkosten", true], ["co2-fossil", "CO₂ (fossil)", true], ["lambda", "Wärmeleitfähigkeit λ", false]].forEach(function (k) {
      var d = erg.diagramme[k[0]];
      if (!d || !d.bewertet || (k[2] && !erg.mitEingabe)) return;
      if ((d.hinweise || []).some(function (h) { return h.klasse === "warn"; })) return;   // nur eingeschränkt vergleichbar: kein Kurzurteil
      var z = d.zeilen.filter(function (x) { return x.status === "wert"; });
      if (z.length < 2) return;
      var min = Math.min.apply(null, z.map(function (x) { return x.wert; }));
      var vorn = z.filter(function (x) { return x.wert === min; }).map(function (x) { return x.buchstabe; });
      teile.push(k[1] + ": " + (vorn.length === z.length ? "alle gleich" : "niedrigster Wert bei " + vorn.join(" und ")));
    });
    return teile.length ? "Auf einen Blick (nur aus den Zahlen oben): " + teile.join(" · ") + "." : "";
  }

  // Wichtige Warnhinweise der Ergebnisse (ohne Doppelungen) aus den Diagrammdaten
  function warnhinweise(o) {
    var erg = MM.diagramme && MM.diagramme.ergebnisse ? MM.diagramme.ergebnisse() : null;
    var liste = [];
    function neu(t) { if (t && liste.indexOf(t) === -1) liste.push(t); }
    var orient = MM.datenmodus && MM.datenmodus.orientierung ? MM.datenmodus.orientierung(o.plaetze || []) : "";
    if (orient) neu(orient);
    if (erg) Object.keys(erg.diagramme).forEach(function (id) {
      (erg.diagramme[id].hinweise || []).forEach(function (h) { if (h.klasse === "warn") neu(h.text); });
    });
    if (MM.datenmodus && MM.datenmodus.beispieleAktiv()) neu("Mit B gekennzeichnete (gelb hinterlegte) Werte sind Beispieldaten, keine geprüften Echtwerte.");
    return liste;
  }

  function druckKopfFuellen() {
    var box = document.getElementById("druck-kopf");
    if (!box) return;
    var el = MM.el;
    box.textContent = "";
    var o = aktuelleOptionen();

    // Logo und Titel
    var marke = el("div", null, "pk-marke");
    marke.innerHTML = '<svg class="pk-logo" aria-hidden="true" focusable="false"><use href="#i-marke"/></svg>';
    marke.appendChild(el("span", "MaterialMatch", "pk-name"));
    marke.appendChild(el("span", "Der richtige Baustoff. Für deine Idee.", "pk-tag"));
    box.appendChild(marke);
    box.appendChild(el("h2", "Vergleichsbericht"));
    if (o.plaetze.length) {
      var namen = o.plaetze.map(function (p) { return p.material.name; });
      box.appendChild(el("p", namen.join(" gegen "), "pk-vergleich"));
    }

    // Materialien mit Illustration
    var mats = el("ul", null, "pk-materialien");
    if (o.plaetze.length) {
      o.plaetze.forEach(function (p) {
        var pa = p.material.produktAktiv;
        var li = el("li");
        if (MM.materialbilder) li.appendChild(MM.materialbilder.element(p.material.id, { groesse: "klein" }));
        var t = el("span", null, "pk-mat-text");
        t.appendChild(el("strong", "Material " + p.buchstabe + ": " + p.material.name));
        t.appendChild(el("span", pa ? (pa.generisch ? "generischer Materialdatensatz" : "Produkt " + pa.name + " (" + pa.hersteller + ")") : "", "pk-mat-produkt"));
        li.appendChild(t);
        mats.appendChild(li);
      });
    } else mats.appendChild(el("li", "Es ist kein Material gewählt."));
    box.appendChild(mats);

    // Eingaben
    var e = o.eingaben;
    var eing = el("p", null, "pk-eingaben");
    if (e && e.status === "ok") eing.textContent = "Bauteilfläche: " + MM.berechnung.formatEingabe(e.flaeche_m2) + " m² · Materialdicke: " + MM.berechnung.formatEingabe(e.dicke_wert) + " " + e.dicke_einheit;
    else eing.textContent = "Fläche und Dicke: nicht (vollständig) eingegeben";
    eing.appendChild(document.createTextNode(" · Anwendungsbereich: " + (o.anwendung || "–") + " · Priorität: " + o.prioritaet));
    box.appendChild(eing);

    // Wichtigste Kennzahlen
    var tab = kennzahlenTabelle(o);
    if (tab) {
      box.appendChild(tab);
      box.appendChild(el("p", FARBSATZ + " Die Balkenlänge zeigt den Zahlenwert im Verhältnis zum größten Wert der Zeile; die ausführlichen Diagramme folgen direkt darunter.", "pk-farbsatz"));
    }

    var kurz = kurzueberblick(o);
    if (kurz) box.appendChild(el("p", kurz, "pk-kurz"));

    // Wichtige Hinweise
    var hinw = warnhinweise(o);
    if (hinw.length) {
      var w = el("div", null, "pk-warn");
      w.appendChild(el("p", "Wichtige Hinweise", "pk-warn-titel"));
      var ul = el("ul");
      hinw.forEach(function (t) { ul.appendChild(el("li", t)); });
      w.appendChild(ul);
      box.appendChild(w);
    }

    // Angaben zum Bericht
    var meta = el("p", null, "pk-meta");
    meta.textContent = "Erstellt am " + datumText(o.datum) + " · Datenmodus: " + (o.modus || "–") + ".";
    var stand = document.getElementById("datenstand");
    if (stand && stand.textContent) meta.appendChild(document.createTextNode(" " + stand.textContent));
    box.appendChild(meta);
    box.appendChild(el("p", HAFTUNG, "note"));
    box.appendChild(el("p", "Quellen: Die Quellen der gezeigten Kennwerte stehen mit Link unter den Tabellen und bei den Empfehlungen. Die Datenqualität ist aus Datenart und Quelle abgeleitet; die vollständige Quellenliste steht in der Anwendung (Bereich „Quellen & Details“).", "note"));
    annahmenSammeln();
  }

  // Berechnungsannahmen aller Diagramme stehen gesammelt hinter den Diagrammen (nicht mehr in jedem Diagramm), damit die erste Seite übersichtlich bleibt
  function annahmenSammeln() {
    var alt = document.getElementById("druck-annahmen");
    if (alt && alt.parentNode) alt.parentNode.removeChild(alt);
    var ziel = document.getElementById("diagramme");
    if (!ziel || !ziel.parentNode) return;
    var el = MM.el;
    var box = el("div", null, "print-only pk-annahmen");
    box.id = "druck-annahmen";
    box.appendChild(el("h3", "Zugrunde liegende Mengen und Annahmen"));
    var n = 0;
    [].forEach.call(ziel.querySelectorAll("figure.chart"), function (fig) {
      var ul = fig.querySelector(".chart-annahmen ul");
      var titel = fig.querySelector(".chart-title");
      if (!ul || !titel || !fig.getBoundingClientRect) return;
      var kopf = el("h4", titel.firstChild ? titel.firstChild.textContent : titel.textContent);
      box.appendChild(kopf);
      box.appendChild(ul.cloneNode(true));
      n++;
    });
    if (n) ziel.parentNode.insertBefore(box, ziel.nextSibling);
  }

  function druckVorbereiten() {
    if (gemerkt) return;                                   // schon vorbereitet (idempotent)
    gemerkt = [].map.call(document.querySelectorAll("details"), function (d) { return { d: d, offen: d.open }; });
    gemerkt.forEach(function (x) { x.d.open = true; });
    try { druckKopfFuellen(); } catch (err) { /* Druck soll nie an der Kopfzeile scheitern */ }
  }

  function druckNachbereiten() {
    if (!gemerkt) return;
    gemerkt.forEach(function (x) { x.d.open = x.offen; });
    gemerkt = null;
    var box = document.getElementById("druck-kopf");
    if (box) box.textContent = "";
    var an = document.getElementById("druck-annahmen");
    if (an && an.parentNode) an.parentNode.removeChild(an);
  }

  // Menü „Ergebnisse exportieren“ auf- und zuklappen (Schaltfläche mit aria-expanded, kein Popup)
  function menueZeigen(an, fokus) {
    var k = document.getElementById("export-menue-knopf");
    var m = document.getElementById("export-menue");
    if (!k || !m) return;
    m.hidden = !an;
    k.setAttribute("aria-expanded", an ? "true" : "false");
    if (!an && fokus) k.focus();
  }

  function exportKnoepfeAktualisieren() {
    var hat = MM.auswahl.holeAuswahl().plaetze.length > 0;
    ["export-menue-knopf", "druck-knopf", "csv-knopf"].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.disabled = !hat;
    });
    if (!hat) menueZeigen(false);
    var h = document.getElementById("export-hinweis");
    if (h) h.hidden = hat;
  }

  MM.exportieren = {
    FARBSATZ: FARBSATZ,
    csvZahl: csvZahl,
    csvZelle: zelle,
    baueCsv: baueCsv,
    csvHerunterladen: csvHerunterladen,
    dateiname: dateiname,
    druckVorbereiten: druckVorbereiten,
    druckNachbereiten: druckNachbereiten,
    init: function () {
      var druck = document.getElementById("druck-knopf");
      var csv = document.getElementById("csv-knopf");
      var knopf = document.getElementById("export-menue-knopf");
      var menue = document.getElementById("export-menue");
      if (knopf) knopf.addEventListener("click", function () { menueZeigen(menue.hidden); });
      if (menue) menue.addEventListener("keydown", function (e) { if (e.key === "Escape") { menueZeigen(false, true); } });
      if (knopf) knopf.addEventListener("keydown", function (e) { if (e.key === "Escape") menueZeigen(false); });
      if (druck) druck.addEventListener("click", function () { menueZeigen(false); root.print(); });
      if (csv) csv.addEventListener("click", function () { csvHerunterladen(); menueZeigen(false, true); });
      // Gilt auch für Strg+P und das Browsermenü
      root.addEventListener("beforeprint", druckVorbereiten);
      root.addEventListener("afterprint", druckNachbereiten);
      document.addEventListener("mm:auswahl", exportKnoepfeAktualisieren);
      exportKnoepfeAktualisieren();
    }
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = MM.exportieren; }

})(typeof window !== "undefined" ? window : globalThis);
