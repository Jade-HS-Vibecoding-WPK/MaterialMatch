/* ==========================================================================
   MaterialMatch – Quellen und Datentransparenz (Schritt 10)
   --------------------------------------------------------------------------
   Teil 1 (ohne Anzeige, gesondert testbar):
     MM.quellen.finde(id)       Quelleneintrag zu einer Kennung
     MM.quellen.beschreibe(q)   lesbare Angaben zu einer Quelle (Titel, Eigner, Typ, Jahr, Link)
     MM.quellen.zaehle(daten)   Datenqualität je Material und insgesamt
     MM.quellen.verwendung(d)   welche Quelle für welche Kennwerte verwendet wird
     MM.quellen.pruefe(daten)   Nachvollziehbarkeits-Check (keine unbelegten "Richtwerte")
   Teil 2: Anzeige im Bereich "Quellen und Hinweise" und im Fußbereich.

   Grundsatz: Eine Quelle zählt nur als Beleg, wenn sie als geprüft markiert ist
   und Titel, https-Link und Abrufdatum hat. Alles andere ist ein Hinweis, kein Beleg.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var daten = null;

  // Die Kennwerte, die in der Übersicht als Spalten erscheinen
  var KENNWERTE = [
    { id: "rohdichte", name: "Rohdichte" },
    { id: "waermeleitfaehigkeit", name: "λD" },
    { id: "waermeleitfaehigkeit_bemessung", name: "λB" },
    { id: "druckfestigkeit", name: "Druckfestigkeit" },
    { id: "preis", name: "Preis" },
    { id: "gwp", name: "CO₂ (GWP)" },
    { id: "brandverhalten", name: "Brandverhalten" },
    { id: "wasserdampf_mu", name: "μ" },
    { id: "waermekapazitaet", name: "Wärmekapazität" },
    { id: "recycling", name: "Recycling" }
  ];

  var TYP_DE = {
    "generic dataset": "generischer Datensatz",
    "average dataset": "Branchendurchschnitt",
    "representative dataset": "repräsentativer Durchschnitt",
    "specific dataset": "produktspezifischer Datensatz (Herstellerdeklaration)"
  };

  function istHttps(url) { return typeof url === "string" && /^https:\/\//.test(url); }

  function finde(id) {
    if (!id || !daten) return null;
    for (var i = 0; i < daten.quellen.length; i++) if (daten.quellen[i].id === id) return daten.quellen[i];
    return null;
  }

  // Lesbare Angaben zu einer Quelle. url ist nur gesetzt, wenn es ein https-Link ist.
  function beschreibe(q) {
    if (!q) return null;
    var teile = [];
    if (q.typ) teile.push(TYP_DE[q.typ] || q.typ);
    if (q.referenzjahr) teile.push("Bezugsjahr " + q.referenzjahr);
    if (q.gueltig_bis) teile.push("gültig bis " + q.gueltig_bis);
    if (q.quellenart) teile.push(q.quellenart);
    if (q.geltung) teile.push(q.geltung);
    if (q.produkt) teile.push("Produkt: " + q.produkt);
    if (q.region) teile.push("Region: " + q.region);
    if (q.preisangabe) {
      var a = q.preisangabe;
      var STATUS = { abgerufen: "Preis am Abrufdatum auf der Händlerseite", preisliste: "Preisliste (kein aktueller Verkaufspreis)", aelter: "älterer Preis", geschaetzt: "geschätzter Preis", eigen: "eigene Angabe, nicht geprüft" };
      teile.push("Händler: " + a.haendler);
      teile.push("Produkt: " + a.produktname + (a.hersteller ? " (" + a.hersteller + ")" : ""));
      teile.push("Variante: " + a.variante);
      teile.push("Preis: " + String(a.preis).replace(".", ",") + " " + a.einheit + (a.mwst ? ", " + a.mwst : ""));
      teile.push("Region: " + a.region);
      teile.push("Verfügbarkeit: " + a.verfuegbarkeit);
      teile.push("Status: " + (STATUS[a.status] || a.status) + (a.status !== "abgerufen" ? " – NICHT AKTUELL BESTÄTIGT" : ""));
    }
    if (q.abgerufen) teile.push("abgerufen " + q.abgerufen);
    return {
      id: q.id,
      titel: q.titel,
      eigner: q.datensatz_eigner || null,
      detail: teile.join(", "),
      url: istHttps(q.url) ? q.url : null,
      geprueft: q.geprueft === true
    };
  }

  // Status eines Kennwerts: "wert" (mit Datenart), "nicht_anwendbar" oder "fehlt"
  function status(e) {
    if (!e) return { status: "fehlt" };
    if (e.nicht_anwendbar === true) return { status: "nicht_anwendbar" };
    var hat = e.werte !== undefined ? (e.werte !== null) : (e.wert !== null && e.wert !== undefined);
    if (!hat) return { status: "fehlt" };
    return { status: "wert", art: e.art || null, quelle: e.quelle || null };
  }

  // Datenqualität: je Material und Kennwert, dazu Summen
  function zaehle(d) {
    var summe = { verifiziert: 0, richtwert: 0, beispiel: 0, ohne_art: 0, nicht_anwendbar: 0, fehlt: 0, gesamt: 0 };
    var materialien = d.baustoffe.map(function (m) {
      var z = { verifiziert: 0, richtwert: 0, beispiel: 0, ohne_art: 0, nicht_anwendbar: 0, fehlt: 0, gesamt: 0 };
      var werte = {};
      KENNWERTE.forEach(function (k) {
        var s = status(m.eigenschaften[k.id]);
        werte[k.id] = s;
        z.gesamt++;
        if (s.status === "wert") {
          if (s.art === "verifiziert" || s.art === "richtwert" || s.art === "beispiel") z[s.art]++;
          else if (s.art === "eigen") z.eigen = (z.eigen || 0) + 1;
          else z.ohne_art++;
        } else {
          z[s.status]++;
        }
      });
      Object.keys(z).forEach(function (k) { summe[k] += z[k]; });
      return { id: m.id, name: m.name, zaehler: z, werte: werte };
    });
    return { materialien: materialien, summe: summe };
  }

  // Welche Quelle belegt welche Kennwerte? -> { quelleId: [{ material, eigenschaft }] }
  function verwendung(d) {
    var v = {};
    d.baustoffe.forEach(function (m) {
      Object.keys(m.eigenschaften).forEach(function (k) {
        var q = m.eigenschaften[k] && m.eigenschaften[k].quelle;
        if (!q) return;
        (v[q] = v[q] || []).push({ material: m.id, eigenschaft: k });
      });
    });
    // Werte der weiteren Produkte (das Standardprodukt steckt schon im Datensatz des Materials)
    // Herstellerangaben (nur angezeigt, nicht berechnet) zählen als Verwendung der Quelle
    (root.MATERIALMATCH_PRODUKTE || []).forEach(function (p) {
      (p.herstellerangaben || []).forEach(function (h) { (v[h.quelle] = v[h.quelle] || []).push({ material: p.material, eigenschaft: "herstellerangabe", produkt: p.id }); });
    });
    (root.MATERIALMATCH_PRODUKTE || []).forEach(function (p) {
      if (p.standard) return;
      Object.keys(p.eigenschaften || {}).forEach(function (k) {
        var q = p.eigenschaften[k] && p.eigenschaften[k].quelle;
        if (!q) return;
        (v[q] = v[q] || []).push({ material: p.material, eigenschaft: k, produkt: p.id });
      });
    });
    return v;
  }

  // Nachvollziehbarkeits-Check. Ergebnis: { ok, pruefungen: [{ text, ok, details }], warnungen: [text] }
  function pruefe(d) {
    var quellen = {};
    d.quellen.forEach(function (q) { quellen[q.id] = q; });
    var belegte = 0;
    var probleme = { ohneQuelle: [], ungeprueft: [], unbekannt: [], keinLink: [], ohneDatenart: [], quelleOhneArt: [] };

    d.baustoffe.forEach(function (m) {
      Object.keys(m.eigenschaften).forEach(function (k) {
        var e = m.eigenschaften[k];
        var s = status(e);
        var wo = m.name + ": " + k;
        if (s.status !== "wert") return;
        if (!s.art) probleme.ohneDatenart.push(wo);
        if (s.quelle) {
          var q = quellen[s.quelle];
          if (!q) { probleme.unbekannt.push(wo + " → " + s.quelle); return; }
          if (q.geprueft !== true) probleme.ungeprueft.push(wo + " → " + s.quelle);
          if (!istHttps(q.url)) probleme.keinLink.push(wo + " → " + s.quelle);
          if (s.art === "beispiel") probleme.quelleOhneArt.push(wo);
          else belegte++;
        }
        if ((s.art === "richtwert" || s.art === "verifiziert") && !s.quelle) probleme.ohneQuelle.push(wo);
      });
    });

    var pruefungen = [
      { text: "Kein Kennwert ist als „Richtwert“ oder „verifiziert“ eingestuft, ohne dass eine Quelle eingetragen ist", ok: probleme.ohneQuelle.length === 0, details: probleme.ohneQuelle },
      { text: "Jede eingetragene Quelle existiert im Quellenkatalog", ok: probleme.unbekannt.length === 0, details: probleme.unbekannt },
      { text: "Jede für einen Kennwert verwendete Quelle ist als geprüft (abgerufen) markiert", ok: probleme.ungeprueft.length === 0, details: probleme.ungeprueft },
      { text: "Jede verwendete Quelle hat einen https-Link", ok: probleme.keinLink.length === 0, details: probleme.keinLink },
      { text: "Jeder vorhandene Kennwert hat eine Datenart (Richtwert, Beispiel oder verifiziert)", ok: probleme.ohneDatenart.length === 0, details: probleme.ohneDatenart },
      { text: "Beispieldaten sind nicht mit einer Quelle verknüpft (sonst wirkten sie belegt)", ok: probleme.quelleOhneArt.length === 0, details: probleme.quelleOhneArt }
    ];

    // Hinweise: geprüfte Quellen mit begrenzter Gültigkeit
    var jahr = parseInt(String((d.meta && d.meta.datenstand) || "").slice(0, 4), 10);
    var ablaufend = [];
    d.quellen.forEach(function (q) {
      if (q.geprueft === true && typeof q.gueltig_bis === "number" && jahr && q.gueltig_bis <= jahr) ablaufend.push(q);
    });
    var warnungen = [];
    if (ablaufend.length) {
      warnungen.push(ablaufend.length + " verwendete Datensätze sind laut Quelle nur bis " + jahr + " gültig oder bereits abgelaufen und sollten bei der nächsten ÖKOBAUDAT-Ausgabe aktualisiert werden.");
    }
    var z = zaehle(d).summe;
    if (z.beispiel > 0) warnungen.push(z.beispiel + " Kennwerte sind Beispieldaten ohne Quelle und nicht belastbar.");
    if (z.fehlt > 0) warnungen.push(z.fehlt + " Kennwerte sind nicht verfügbar.");

    return {
      ok: pruefungen.every(function (p) { return p.ok; }),
      pruefungen: pruefungen,
      warnungen: warnungen,
      belegteKennwerte: belegte,
      ablaufend: ablaufend
    };
  }

  // Datenqualität eines Kennwerts (MaterialMatch 3.1): eine kurze Bezeichnung, nur abgeleitet aus den vorhandenen
  // Angaben (Datenart und Quelle). Es werden keine neuen Werte, Prüfungen oder Freigaben erfunden.
  //   Demonstrationswert · Keine belegten Daten · Eigene Angabe · Preisrichtwert · EPD · Herstellerangabe · Allgemeiner Datenbankwert
  var QUALITAET = {
    demo:    { name: "Demonstrationswert", text: "Beispielwert für die Demonstration, kein geprüfter Wert." },
    keine:   { name: "Keine belegten Daten", text: "Für diesen Kennwert liegt keine belegte Angabe vor." },
    eigen:   { name: "Eigene Angabe", text: "Von dir eingegeben und nicht geprüft." },
    preis:   { name: "Preisrichtwert", text: "Preis aus Händler- oder Herstellerangabe zum Abrufdatum, kein Angebot und keine Kostenberechnung." },
    epd:     { name: "EPD", text: "Umweltproduktdeklaration (EPD) des Herstellers, aus der ÖKOBAUDAT oder von der EPD-Stelle." },
    hersteller: { name: "Herstellerangabe", text: "Angabe aus einem Herstellerdokument (Datenblatt, Leistungserklärung oder Bewertung) für genau dieses Produkt." },
    allgemein: { name: "Allgemeiner Datenbankwert", text: "Allgemeiner Datensatz (z. B. ÖKOBAUDAT-Durchschnitt oder EU-Rechtstext), nicht für ein bestimmtes Produkt." }
  };
  function datenqualitaet(art, quelleId, schluessel) {
    var k;
    var q = quelleId ? finde(quelleId) : null;
    if (art === "beispiel") k = "demo";
    else if (art === "eigen") k = "eigen";
    else if (!art && !q) k = "keine";
    else if (schluessel === "preis") k = q || art ? "preis" : "keine";
    else if (!q) k = art === "verifiziert" || art === "richtwert" ? "allgemein" : "keine";
    else if (q.typ === "specific dataset" || /EPD|Umweltproduktdeklaration/.test(q.quellenart || "")) k = "epd";
    else if (q.geltung === "produktspezifisch") k = "hersteller";
    else k = "allgemein";
    return { id: k, name: QUALITAET[k].name, text: QUALITAET[k].text };
  }

  MM.quellen = {
    KENNWERTE: KENNWERTE,
    TYP_DE: TYP_DE,
    QUALITAET: QUALITAET,
    datenqualitaet: datenqualitaet,
    istHttps: istHttps,
    finde: finde,
    beschreibe: beschreibe,
    status: status,
    zaehle: zaehle,
    verwendung: verwendung,
    pruefe: pruefe,
    // Setzt die Datenbank (wird beim Start einmal aufgerufen, danach funktioniert finde())
    setzeDaten: function (d) { daten = d; }
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = MM.quellen; }

})(typeof window !== "undefined" ? window : globalThis);
