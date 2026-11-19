/* ==========================================================================
   MaterialMatch – regelbasierte Empfehlung alternativer Baustoffe (Logik)
   --------------------------------------------------------------------------
   Keine Anzeige, nur Rechenlogik, damit sie gesondert getestet werden kann.

   Ablauf (nach dem Master-Prompt):
     1. Technische Eignung:   nur Materialien, die laut Datenbank für den
                              gewählten Anwendungsbereich vorgesehen sind.
     2. Vergleichbarkeit:     CO2 nur bei gleichem Datensatztyp und gleichen
                              Modulen wie das Ausgangsmaterial; Kennwerte
                              werden auf eine gemeinsame Basis gebracht.
     3. Bewertung:            relativ zu Ausgangsmaterial und anderen
                              Kandidaten (0 = schlechtester, 1 = bester Wert).
     4. Empfehlung:           höchstens drei, in der Reihenfolge der Bewertung.
     5. Begründung:           wird aus den Zahlen erzeugt.

   Grundregeln:
   - Es wird nie allein wegen des Preises empfohlen (mindestens zwei
     vergleichbare Kennwerte, davon einer ohne Preis).
   - Gewicht und Wärmeleitfähigkeit zählen nur, wenn die Priorität es
     verlangt (bei Dämmstoffen zählt λ immer mit).
   - Bei Dämmstoffen werden Kosten und CO2 je gleicher Dämmwirkung
     (R = 1 m²K/W) verglichen, sonst je m³ Material.
   - Es werden keine Aussagen zu Zulassungen, technischer Gleichwertigkeit
     oder Normkonformität gemacht.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};

  // Regeln sind einstellbar (data/einstellungen.js); hier die Standardwerte, gelesen wird zur Laufzeit
  function einst() { return MM.einstellungen ? MM.einstellungen.hole() : { prioritaetFaktor: 3, gleichSchwelle: 0.02, besserSchwelle: 0.05, maxEmpfehlungen: 3 }; }

  var PRIORITAETEN = {
    ausgewogen: "Ausgewogener Vergleich",
    kosten: "Niedrige Kosten",
    co2: "Geringe CO₂-Emissionen",
    gewicht: "Geringes Gewicht",
    waerme: "Gute Wärmedämmung"
  };

  var KRITERIEN = {
    kosten:   { name: "Kosten",                          einheit: "€/m³" },
    kosten_r: { name: "Kosten je Dämmwirkung",           einheit: "€ je m² bei R = 1 m²K/W" },
    co2:      { name: "CO₂ (fossil, Herstellung)",       einheit: "kg CO₂e/m³" },
    co2_r:    { name: "CO₂ (fossil) je Dämmwirkung",     einheit: "kg CO₂e je m² bei R = 1 m²K/W" },
    lambda:   { name: "Wärmeleitfähigkeit λ",            einheit: "W/(m·K)" },
    gewicht:  { name: "Rohdichte (Gewicht)",             einheit: "kg/m³" }
  };

  // ---------- Hilfen ----------

  function finde(liste, id) { return MM.finde(liste, id); }

  function istZahl(x) { return typeof x === "number" && isFinite(x); }

  // Datenart zweier Werte zusammenführen: der schwächere gewinnt
  function artKombi(a, b) {
    var arten = [a, b].filter(function (x) { return x !== undefined; });
    if (arten.some(function (x) { return !x; })) return null;
    if (arten.indexOf("beispiel") !== -1) return "beispiel";
    if (arten.indexOf("eigen") !== -1) return "eigen";
    if (arten.every(function (x) { return x === "verifiziert"; })) return "verifiziert";
    return "richtwert";
  }

  function rohdichteWert(m) {
    var r = m.eigenschaften.rohdichte;
    return r && istZahl(r.wert) && r.wert > 0 ? r : null;
  }

  // ---------- Kennwerte auf gemeinsame Basis bringen ----------

  // Preis je m³ (nur Schichtmaterial; Umrechnung über Rohdichte bzw. Bezugsdicke)
  function preisJeM3(m) {
    var p = m.eigenschaften.preis;
    if (!p || !istZahl(p.wert) || m.mengenmodell !== "schicht") return null;
    if (p.einheit === "€/m³") return { wert: p.wert, art: p.art, umgerechnet: false };
    if (p.einheit === "€/kg") {
      var r = rohdichteWert(m);
      return r ? { wert: p.wert * r.wert, art: artKombi(p.art, r.art), umgerechnet: true } : null;
    }
    if (p.einheit === "€/m²" && p.bezugsdicke_m > 0) return { wert: p.wert / p.bezugsdicke_m, art: p.art, umgerechnet: true };
    return null;
  }

  // Fossile CO2-Emissionen je m³ (nur Schichtmaterial) samt Datensatztyp und Modulen
  function co2JeM3(m, quelleFn) {
    var g = m.eigenschaften.gwp;
    if (!g || !g.werte || !istZahl(g.werte.fossil) || m.mengenmodell !== "schicht") return null;
    var q = quelleFn(g.quelle);
    var info = { art: g.art, typ: q && q.typ ? q.typ : "beispiel", modul: g.module, umgerechnet: false };
    if (g.deklarierte_einheit === "1 m³") { info.wert = g.werte.fossil; return info; }
    if (g.deklarierte_einheit === "1 kg") {
      var r = rohdichteWert(m);
      if (!r) return null;
      info.wert = g.werte.fossil * r.wert; info.art = artKombi(g.art, r.art); info.umgerechnet = true; return info;
    }
    if (g.deklarierte_einheit === "1 m²" && g.bezugsdicke_m > 0) { info.wert = g.werte.fossil / g.bezugsdicke_m; info.umgerechnet = true; return info; }
    return null;
  }

  // Welche Sorte Wärmeleitfähigkeit in dieser Empfehlung gilt: für alle Materialien dieselbe (Bemessungswert nur,
  // wenn ihn Material A und alle Kandidaten haben, sonst der Nennwert)
  var lambdaTyp = "nennwert";

  function lambdaVon(m) {
    var l = m.eigenschaften[lambdaTyp === "bemessung" ? "waermeleitfaehigkeit_bemessung" : "waermeleitfaehigkeit"];
    return l && istZahl(l.wert) && l.wert > 0 ? { wert: l.wert, art: l.art } : null;
  }

  // Wert eines Kriteriums für ein Material (oder null, wenn nicht ermittelbar)
  function kriteriumWert(m, id, quelleFn) {
    var p, c, l, r;
    switch (id) {
      case "kosten":
        return preisJeM3(m);
      case "co2":
        return co2JeM3(m, quelleFn);
      case "kosten_r":
        p = preisJeM3(m); l = lambdaVon(m);
        return p && l ? { wert: p.wert * l.wert, art: artKombi(p.art, l.art), umgerechnet: p.umgerechnet } : null;
      case "co2_r":
        c = co2JeM3(m, quelleFn); l = lambdaVon(m);
        return c && l ? { wert: c.wert * l.wert, art: artKombi(c.art, l.art), typ: c.typ, modul: c.modul, umgerechnet: c.umgerechnet } : null;
      case "lambda":
        return lambdaVon(m);
      case "gewicht":
        r = rohdichteWert(m);
        return r ? { wert: r.wert, art: r.art } : null;
    }
    return null;
  }

  // Welche Kriterien zählen, und mit welchem Gewicht?
  function kriterienFuer(bereich, prioritaet) {
    var liste = bereich === "waermedaemmung" ? ["kosten_r", "co2_r", "lambda"] : ["kosten", "co2"];
    if (prioritaet === "waerme" && liste.indexOf("lambda") === -1) liste.push("lambda");
    if (prioritaet === "gewicht") liste.push("gewicht");
    var stark = { kosten: ["kosten", "kosten_r"], co2: ["co2", "co2_r"], waerme: ["lambda"], gewicht: ["gewicht"] }[prioritaet] || [];
    return liste.map(function (id) { return { id: id, gewicht: stark.indexOf(id) !== -1 ? einst().prioritaetFaktor : 1 }; });
  }

  function istKosten(id) { return id === "kosten" || id === "kosten_r"; }

  // ---------- Euroklasse (nur Hauptklasse, für einen Hinweis, keine Bewertung) ----------
  var EUROKLASSEN = ["A1", "A2", "B", "C", "D", "E", "F"];
  function hauptklasse(text) {
    var m = /^(A1|A2|B|C|D|E|F)/.exec(String(text || ""));
    return m ? EUROKLASSEN.indexOf(m[1]) : -1;
  }

  // ---------- Hauptfunktion ----------
  // Ergebnis: { meldung, bereich, referenz, prioritaet, kriterien, empfehlungen, nichtEmpfohlen }
  // referenzMaterial (optional): Material A mit den Werten des gewählten Produkts; sonst der Datensatz aus der Datenbank
  function empfehle(daten, referenzId, bereichId, prioritaet, referenzMaterial) {
    var B = MM.bewertung;
    var prio = PRIORITAETEN[prioritaet] ? prioritaet : "ausgewogen";
    var ref = referenzMaterial && referenzMaterial.id === referenzId ? referenzMaterial : finde(daten.baustoffe, referenzId);
    var leer = { meldung: null, bereich: null, referenz: ref, prioritaet: prio, kriterien: [], empfehlungen: [], nichtEmpfohlen: [] };

    if (!ref) { leer.meldung = "Wähle ein Material (Material A) als Ausgangspunkt für die Empfehlung."; return leer; }
    var bereich = bereichId || ref.anwendungen[0];
    leer.bereich = bereich;
    if (ref.anwendungen.indexOf(bereich) === -1) {
      leer.meldung = "Material A ist laut Datenbank für diesen Anwendungsbereich nicht vorgesehen. Bitte einen passenden Anwendungsbereich wählen.";
      return leer;
    }
    var quelleFn = function (id) { return id ? finde(daten.quellen, id) : null; };
    var bereichName = (finde(daten.anwendungsbereiche, bereich) || { name: bereich }).name;

    lambdaTyp = MM.berechnung.lambdaVergleichsTyp(daten.baustoffe.filter(function (m) { return m.anwendungen.indexOf(bereich) !== -1; }));
    leer.lambdaTyp = lambdaTyp;

    // Kriterien, für die Material A Werte hat (nur dann lässt sich ein Unterschied benennen)
    var alleKrit = kriterienFuer(bereich, prio);
    var refWerte = {};
    alleKrit.forEach(function (k) { refWerte[k.id] = kriteriumWert(ref, k.id, quelleFn); });
    var krit = alleKrit.filter(function (k) { return refWerte[k.id]; });
    leer.kriterien = alleKrit.map(function (k) {
      return { id: k.id, name: KRITERIEN[k.id].name, einheit: KRITERIEN[k.id].einheit, gewicht: k.gewicht, vorhanden: !!refWerte[k.id] };
    });
    if (!krit.length) {
      leer.meldung = "Für Material A liegen keine Kennwerte vor, die sich vergleichen lassen. Eine Empfehlung ist deshalb nicht möglich.";
      return leer;
    }

    // 1. Technische Eignung
    var kandidaten = daten.baustoffe.filter(function (m) { return m.id !== ref.id && m.anwendungen.indexOf(bereich) !== -1; });
    if (!kandidaten.length) {
      leer.meldung = "In der Datenbank gibt es keine weiteren Materialien für den Anwendungsbereich „" + bereichName + "“.";
      return leer;
    }

    // 2. Vergleichbare Kennwerte je Kandidat
    var geprueft = kandidaten.map(function (m) {
      var werte = {}, grund = {};
      krit.forEach(function (k) {
        var w = kriteriumWert(m, k.id, quelleFn);
        if (!w) { grund[k.id] = "Kennwert fehlt oder lässt sich nicht auf die gemeinsame Basis umrechnen"; return; }
        if (k.id === "co2" || k.id === "co2_r") {
          var rw = refWerte[k.id];
          if (w.typ !== rw.typ || w.modul !== rw.modul) { grund[k.id] = "CO₂-Datensatztyp oder Module unterscheiden sich von Material A"; return; }
        }
        werte[k.id] = w;
      });
      return { material: m, werte: werte, grund: grund };
    });

    var nichtEmpfohlen = [];
    var zulaessig = geprueft.filter(function (g) {
      var ids = Object.keys(g.werte);
      var ohnePreis = ids.filter(function (id) { return !istKosten(id); });
      if (ids.length < 2 || !ohnePreis.length) {
        var fehlend = krit.filter(function (k) { return !g.werte[k.id]; }).map(function (k) { return KRITERIEN[k.id].name + " (" + g.grund[k.id] + ")"; });
        var text = ids.length === 1 && istKosten(ids[0])
          ? "Es liegt nur der Preis als vergleichbarer Kennwert vor. Es wird nie allein wegen des Preises empfohlen."
          : "Weniger als zwei vergleichbare Kennwerte.";
        if (g.material.mengenmodell !== "schicht") text = "Das Material hat keine Schichtberechnung (kein Vergleich je Volumen sinnvoll). " + text;
        nichtEmpfohlen.push({ material: g.material, grund: text + (fehlend.length ? " Fehlend: " + fehlend.join("; ") + "." : "") });
        return false;
      }
      return true;
    });

    if (!zulaessig.length) {
      leer.nichtEmpfohlen = nichtEmpfohlen;
      leer.meldung = "Es wurde keine geeignete Alternative gefunden: Für keines der anderen Materialien liegen genug vergleichbare Kennwerte vor.";
      return leer;
    }

    // 3. Bewertung: Normalisierung je Kriterium über Material A und alle zulässigen Kandidaten
    var scoreRef = {};     // kriterium -> Bewertung von Material A
    var scoreKand = {};    // materialId -> kriterium -> Bewertung
    zulaessig.forEach(function (g) { scoreKand[g.material.id] = {}; });
    var gueltigeKrit = [];
    krit.forEach(function (k) {
      var traeger = zulaessig.filter(function (g) { return g.werte[k.id]; });
      var werte = [refWerte[k.id].wert].concat(traeger.map(function (g) { return g.werte[k.id].wert; }));
      var n = B.normalisiere(werte, "niedriger");
      if (n.status === "zuwenig") return;               // nur Material A hat einen Wert
      gueltigeKrit.push(k);
      var gleich = n.status !== "ok";
      scoreRef[k.id] = gleich ? 0.5 : n.scores[0];
      traeger.forEach(function (g, i) { scoreKand[g.material.id][k.id] = gleich ? 0.5 : n.scores[i + 1]; });
    });

    var summeGew = alleKrit.reduce(function (s, k) { return s + k.gewicht; }, 0);

    var bewertet = zulaessig.map(function (g) {
      var m = g.material;
      var eigene = gueltigeKrit.filter(function (k) { return scoreKand[m.id][k.id] !== undefined; });
      var sw = 0, sg = 0, sr = 0;
      eigene.forEach(function (k) { sw += k.gewicht * scoreKand[m.id][k.id]; sg += k.gewicht; sr += k.gewicht * scoreRef[k.id]; });
      var score = sg ? sw / sg : 0, refScore = sg ? sr / sg : 0;

      var kriterien = eigene.map(function (k) {
        var w = g.werte[k.id], rw = refWerte[k.id];
        var delta = rw.wert !== 0 ? (w.wert - rw.wert) / Math.abs(rw.wert) * 100 : null;
        return { id: k.id, name: KRITERIEN[k.id].name, einheit: KRITERIEN[k.id].einheit, wert: w.wert, referenzWert: rw.wert,
          art: w.art, referenzArt: rw.art, deltaProzent: delta, score: scoreKand[m.id][k.id], gewicht: k.gewicht, umgerechnet: !!w.umgerechnet };
      });
      var abdeckung = eigene.reduce(function (s, k) { return s + k.gewicht; }, 0) / summeGew;
      var vergleich = score > refScore + einst().besserSchwelle ? "besser" : (score < refScore - einst().besserSchwelle ? "schlechter" : "ähnlich");
      return { material: m, score: score, referenzScore: refScore, vergleichZuA: vergleich, kriterien: kriterien, abdeckung: abdeckung,
        nichtBewertet: krit.filter(function (k) { return scoreKand[m.id][k.id] === undefined; }).map(function (k) { return { id: k.id, name: KRITERIEN[k.id].name, grund: g.grund[k.id] || "nur Material A hat einen Wert" }; }) };
    });

    // 4. Reihenfolge: Bewertung, dann Datenabdeckung, dann Name
    bewertet.sort(function (a, b) {
      if (Math.abs(b.score - a.score) > 1e-9) return b.score - a.score;
      if (Math.abs(b.abdeckung - a.abdeckung) > 1e-9) return b.abdeckung - a.abdeckung;
      return a.material.name < b.material.name ? -1 : 1;
    });
    var top = bewertet.slice(0, einst().maxEmpfehlungen);
    bewertet.slice(einst().maxEmpfehlungen).forEach(function (b) {
      nichtEmpfohlen.push({ material: b.material, grund: "Eignet sich ebenfalls, liegt in der gewählten Bewertung aber hinter den drei empfohlenen Alternativen." });
    });

    // 5. Begründung, Vorteil, Nachteil, Hinweise, Belastbarkeit
    top.forEach(function (e, i) {
      e.rang = i + 1;
      anreichern(e, ref, refWerte, bereich, bereichName, prio, daten, quelleFn);
    });

    leer.kriterien = alleKrit.map(function (k) {
      return { id: k.id, name: KRITERIEN[k.id].name, einheit: KRITERIEN[k.id].einheit, gewicht: k.gewicht, vorhanden: !!refWerte[k.id] };
    });
    leer.empfehlungen = top;
    leer.nichtEmpfohlen = nichtEmpfohlen;
    return leer;
  }

  function prozentText(delta) {
    var f = MM.berechnung.formatZahl;
    var a = Math.abs(delta);
    return f(Math.round(a * 10) / 10) + " %";
  }

  function anreichern(e, ref, refWerte, bereich, bereichName, prio, daten, quelleFn) {
    var m = e.material;

    // Unterschiede in Worten
    var saetze = [];
    e.kriterien.forEach(function (k) {
      if (k.deltaProzent === null) return;
      if (Math.abs(k.deltaProzent) < einst().gleichSchwelle * 100) saetze.push(k.name + " praktisch gleich");
      else saetze.push(k.name + " " + prozentText(k.deltaProzent) + (k.deltaProzent < 0 ? " niedriger" : " höher"));
    });
    e.begruendung = "Laut Datenbank für den Anwendungsbereich „" + bereichName + "“ vorgesehen. Gegenüber Material A (" + ref.name + "): " +
      (saetze.length ? saetze.join("; ") : "keine bewertbaren Unterschiede") + ". " +
      "Bewertungsgrundlage: " + PRIORITAETEN[prio] + ". Insgesamt in dieser Betrachtung " + e.vergleichZuA + " als Material A.";

    // Wichtigster Vorteil und möglicher Nachteil
    var mitDelta = e.kriterien.filter(function (k) { return k.deltaProzent !== null; });
    var bester = mitDelta.slice().sort(function (a, b) { return a.deltaProzent - b.deltaProzent; })[0];
    var schlechtester = mitDelta.slice().sort(function (a, b) { return b.deltaProzent - a.deltaProzent; })[0];
    e.vorteil = bester && bester.deltaProzent <= -einst().gleichSchwelle * 100
      ? { text: bester.name + " " + prozentText(bester.deltaProzent) + " niedriger als Material A", art: bester.art, aus: "berechnet" }
      : (m.vorteile && m.vorteile.length ? { text: m.vorteile[0], art: null, aus: "allgemeine Angabe (nicht quellengeprüft)" } : null);
    e.nachteil = schlechtester && schlechtester.deltaProzent >= einst().gleichSchwelle * 100
      ? { text: schlechtester.name + " " + prozentText(schlechtester.deltaProzent) + " höher als Material A", art: schlechtester.art, aus: "berechnet" }
      : (m.nachteile && m.nachteile.length ? { text: m.nachteile[0], art: null, aus: "allgemeine Angabe (nicht quellengeprüft)" } : null);

    // Hinweise (keine Bewertung): Brandverhalten, Tragwerk, nicht bewertbare Kriterien
    e.hinweise = [];
    var bm = m.eigenschaften.brandverhalten, br = ref.eigenschaften.brandverhalten;
    if (bm && br && bm.wert && br.wert && hauptklasse(bm.wert) > hauptklasse(br.wert) && hauptklasse(br.wert) >= 0) {
      e.hinweise.push("Brandverhalten: Euroklasse " + bm.wert + " statt " + br.wert + " bei Material A. Das ist die Klasse des Baustoffs, nicht der Feuerwiderstand eines Bauteils. Brandschutzanforderungen prüfen" +
        (bm.art === "beispiel" || br.art === "beispiel" ? " (Beispieldaten)." : "."));
    }
    if (bereich === "tragwerk") {
      e.hinweise.push("Tragfähigkeit, Verformung und Brandschutz sind durch die Tragwerksplanung nachzuweisen. Dieser Vergleich ersetzt das nicht.");
    }
    e.nichtBewertet.forEach(function (n) { e.hinweise.push(n.name + " wurde nicht bewertet: " + n.grund + "."); });
    if (m.mengenhinweis) e.hinweise.push(m.mengenhinweis);
    if (e.kriterien.some(function (k) { return k.umgerechnet; })) {
      e.hinweise.push("Einzelne Werte wurden auf die gemeinsame Basis umgerechnet (z. B. €/kg über die Rohdichte).");
    }

    // Belastbarkeit
    var beispiel = e.kriterien.filter(function (k) { return k.art === "beispiel" || k.referenzArt === "beispiel" || !k.art; });
    var arten = e.kriterien.map(function (k) { return artKombi(k.art, k.referenzArt); });
    if (beispiel.length) {
      e.belastbarkeit = { stufe: "nicht_belastbar", text: "Nicht belastbar: Die Bewertung beruht teilweise auf Beispieldaten (" +
        beispiel.map(function (k) { return k.name; }).join(", ") + ")." };
    } else if (arten.indexOf("eigen") !== -1) {
      e.belastbarkeit = { stufe: "orientierend", text: "Orientierend: Ein Teil der bewerteten Kennwerte sind eigene Angaben der Nutzer:in (nicht geprüft). Sie erlauben keine verlässliche Produkt- oder Kostenberechnung." };
    } else if (e.abdeckung < 0.5) {
      e.belastbarkeit = { stufe: "unvollstaendig", text: "Unvollständige Datenlage: Nur ein Teil der Kriterien konnte bewertet werden." };
    } else if (arten.every(function (a) { return a === "verifiziert"; })) {
      e.belastbarkeit = { stufe: "belastbar", text: "Alle bewerteten Kennwerte sind verifiziert." };
    } else {
      e.belastbarkeit = { stufe: "orientierend", text: "Orientierend: Die bewerteten Kennwerte sind Richtwerte (generische oder für ein bestimmtes Produkt geltende Angaben). Sie erlauben keine verlässliche Produkt- oder Kostenberechnung." };
    }

    // Kennwerte und Quellen der Karte
    var kenn = [];
    function nimm(name, eig, einheitFn) {
      if (!eig) { kenn.push({ name: name, text: "nicht verfügbar", art: null, quelle: null }); return; }
      if (eig.nicht_anwendbar === true) { kenn.push({ name: name, text: "nicht anwendbar", art: null, quelle: null }); return; }
      var t = einheitFn(eig);
      kenn.push(t ? { name: name, text: t, art: eig.art, quelle: eig.quelle || null } : { name: name, text: "nicht verfügbar", art: null, quelle: null });
    }
    var f = MM.berechnung.formatZahl;
    nimm(lambdaTyp === "bemessung" ? "Bemessungswert λB" : "Nennwert λD", m.eigenschaften[lambdaTyp === "bemessung" ? "waermeleitfaehigkeit_bemessung" : "waermeleitfaehigkeit"], function (x) { return istZahl(x.wert) ? f(x.wert) + " W/(m·K)" : null; });
    nimm("Preis", m.eigenschaften.preis, function (x) { return istZahl(x.wert) ? f(x.wert) + " " + x.einheit : null; });
    nimm("CO₂ fossil (A1–A3)", m.eigenschaften.gwp, function (x) {
      return x.werte && istZahl(x.werte.fossil) ? f(x.werte.fossil) + " kg CO₂e/" + String(x.deklarierte_einheit).replace(/^1\s*/, "") : null;
    });
    nimm("Rohdichte", m.eigenschaften.rohdichte, function (x) { return istZahl(x.wert) ? f(x.wert) + " " + x.einheit : null; });
    e.kennwerte = kenn;

    var ids = [];
    kenn.forEach(function (k) { if (k.quelle && ids.indexOf(k.quelle) === -1) ids.push(k.quelle); });
    e.quellen = ids.map(function (id) { return quelleFn(id); }).filter(Boolean);
  }

  MM.empfehlung = {
    PRIORITAETEN: PRIORITAETEN,
    KRITERIEN: KRITERIEN,
    holeEinstellungen: einst,
    empfehle: empfehle,
    kriterienFuer: kriterienFuer,
    preisJeM3: preisJeM3,
    co2JeM3: co2JeM3,
    // Lesezugriff für „Match finden“ (js/matching.js): derselbe Kennwert wie in der Empfehlung, damit es keine zweite Rechnung gibt
    kriteriumWert: kriteriumWert,
    setzeLambdaTyp: function (typ) { lambdaTyp = typ === "bemessung" ? "bemessung" : "nennwert"; }
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = MM.empfehlung; }

})(typeof window !== "undefined" ? window : globalThis);
