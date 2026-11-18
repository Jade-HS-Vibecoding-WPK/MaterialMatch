/* ==========================================================================
   MaterialMatch – Anzeige "Quellen und Hinweise" (Schritt 10)
   --------------------------------------------------------------------------
   Zeichnet in den Bereich 7:
     1. Datenstand
     2. Datenqualität auf einen Blick (Summen und Übersicht je Material)
     3. Datenarten (Erklärung der Kürzel B, R, V)
     4. Quellen (verwendete / weitere geprüfte / nicht eingesehene)
     5. Nachvollziehbarkeits-Check (läuft bei jedem Laden der Seite)
     6. Erläuterungen und Grenzen der Berechnungen
   und die Datenstand-Zeile im Fußbereich.
   Alle Angaben kommen aus data/baustoffe.js und werden nie als HTML gedeutet.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var el = MM.el;

  function marke(art) {
    var A = MM.tabelle.ART[art];
    if (!A) return null;
    var m = el("span", A.kurz, "art art-" + art);
    m.setAttribute("title", A.text);
    m.setAttribute("role", "img");
    m.setAttribute("aria-label", A.text);
    return m;
  }

  function spaltenKopf(th) { th.setAttribute("scope", "col"); return th; }

  function link(titel, url) {
    if (!MM.quellen.istHttps(url)) return document.createTextNode(titel);
    var a = el("a", titel);
    a.setAttribute("href", url);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
    return a;
  }

  function abschnitt(titel) { return el("h3", titel, "subhead"); }

  // ---------- 1. Datenstand ----------
  function datenstand(d) {
    var box = el("div");
    box.appendChild(abschnitt("Datenstand"));
    var liste = el("ul", null, "facts-list");
    [
      "Baustoffdatenbank: Version " + d.meta.version + ", Datenstand " + d.meta.datenstand,
      "Anzahl: " + d.baustoffe.length + " Baustoffe in " + d.kategorien.length + " Kategorien"
    ].forEach(function (t) { liste.appendChild(el("li", t)); });

    var root_ = MM.quellen.finde("oekobaudat");
    if (root_) {
      var li = el("li");
      li.appendChild(document.createTextNode("Ökobilanzdaten: "));
      li.appendChild(link(root_.titel, root_.url));
      li.appendChild(document.createTextNode(", abgerufen " + root_.abgerufen +
        (root_.datum_hinweis ? ". " + root_.datum_hinweis : "")));
      liste.appendChild(li);
    }
    box.appendChild(liste);
    box.appendChild(el("p", d.meta.hinweis, "warn"));
    return box;
  }

  // ---------- 2. Datenqualität ----------
  function zusammenfassung(z) {
    var s = z.summe;
    var teile = [
      s.richtwert + " Richtwerte (R)",
      s.verifiziert + " verifiziert (V)",
      s.beispiel + " Beispieldaten (B)",
      s.nicht_anwendbar + " nicht anwendbar",
      s.fehlt + " nicht verfügbar"
    ];
    return s.gesamt + " Kennwerte-Felder (" + z.materialien.length + " Baustoffe × " + MM.quellen.KENNWERTE.length + "): " + teile.join(", ") + ".";
  }

  function datenqualitaet(d) {
    var box = el("div", null, "nicht-drucken");      // betrifft die ganze Datenbank, nicht den Vergleich: im Ausdruck weggelassen
    box.appendChild(abschnitt("Datenqualität auf einen Blick"));
    var z = MM.quellen.zaehle(d);
    box.appendChild(el("p", zusammenfassung(z), "calc-summary"));

    var wrap = el("div", null, "table-wrap");
    var t = el("table", null, "data-table matrix-table");
    var kopf = el("thead"), kz = el("tr");
    kz.appendChild(spaltenKopf(el("th", "Baustoff")));
    MM.quellen.KENNWERTE.forEach(function (k) { kz.appendChild(spaltenKopf(el("th", k.name, "mitte"))); });
    kopf.appendChild(kz); t.appendChild(kopf);

    var kb = el("tbody");
    z.materialien.forEach(function (m) {
      var tr = el("tr");
      var zeilenKopf = el("th", m.name);
      zeilenKopf.setAttribute("scope", "row");
      tr.appendChild(zeilenKopf);
      tr.lastChild.setAttribute("scope", "row");
      MM.quellen.KENNWERTE.forEach(function (k) {
        var s = m.werte[k.id];
        var td = el("td", null, "mitte");
        if (s.status === "wert") {
          var mk = marke(s.art);
          if (mk) td.appendChild(mk); else td.appendChild(el("span", "?", "missing-text"));
        } else if (s.status === "nicht_anwendbar") {
          td.appendChild(el("span", "n. a.", "soft-text"));
          td.setAttribute("title", "nicht anwendbar");
        } else {
          td.appendChild(el("span", "–", "missing-text"));
          td.setAttribute("title", "nicht verfügbar");
        }
        tr.appendChild(td);
      });
      kb.appendChild(tr);
    });
    t.appendChild(kb); wrap.appendChild(t); box.appendChild(wrap);
    box.appendChild(el("p", "B = Beispieldaten · R = Richtwert (mit Quelle) · V = verifiziert · n. a. = nicht anwendbar · – = nicht verfügbar.", "note"));
    return box;
  }

  // ---------- 3. Datenqualität und Kennzeichnungen ----------
  // Die vier Datenarten aus der Datenbank, dazu fehlende und nicht vergleichbare Daten (so verhält sich die Anwendung)
  function datenarten(d) {
    var box = el("div");
    box.appendChild(abschnitt("Datenarten"));
    var liste = el("ul", null, "facts-list");
    ["verifiziert", "richtwert", "beispiel", "eigen"].forEach(function (a) {
      var li = el("li");
      li.appendChild(marke(a));
      li.appendChild(document.createTextNode(" " + MM.tabelle.ART[a].text + ": " + d.meta.datenarten[a]));
      liste.appendChild(li);
    });
    var fehlt = el("li");
    fehlt.appendChild(el("span", "–", "missing-text"));
    fehlt.appendChild(document.createTextNode(" Fehlende Daten („nicht verfügbar“, „fehlt“): Für diesen Kennwert liegt keine belegte Angabe vor. MaterialMatch nimmt keinen Ersatzwert an. Berechnungen zeigen dann „nicht berechenbar“, Diagramme „fehlt“ ohne Balken."));
    liste.appendChild(fehlt);
    var nv = el("li");
    nv.appendChild(el("span", "≠", "missing-text"));
    nv.appendChild(document.createTextNode(" Nicht vergleichbare Daten: Werte mit unterschiedlicher Berechnungsgrundlage, Einheit, Mehrwertsteuer, Leistungsumfang oder Datensatztyp werden nicht gegeneinander bewertet. Die Balken bleiben grau, und am Diagramm steht der Grund."));
    liste.appendChild(nv);
    box.appendChild(liste);
    return box;
  }

  // ---------- 4. Quellen ----------
  function quellenTabelle(liste, verwendung) {
    var wrap = el("div", null, "table-wrap");
    var t = el("table", null, "data-table kompakt quellen-table");
    var kopf = el("thead"), kz = el("tr");
    ["Quelle", "Herausgeber / Eigner", "Angaben", "Kennwerte"].forEach(function (h) { kz.appendChild(spaltenKopf(el("th", h))); });
    kopf.appendChild(kz); t.appendChild(kopf);
    var kb = el("tbody");
    liste.forEach(function (q) {
      var b = MM.quellen.beschreibe(q);
      var tr = el("tr");
      var td = el("td");
      td.appendChild(link(b.titel, b.url));
      tr.appendChild(td);
      tr.appendChild(el("td", b.eigner || q.herausgeber || "–"));
      tr.appendChild(el("td", b.detail || (q.datum ? "Stand " + q.datum : "–")));
      var n = verwendung[q.id] ? verwendung[q.id].length : 0;
      tr.appendChild(el("td", n ? String(n) : "–", "mitte"));
      kb.appendChild(tr);
    });
    t.appendChild(kb); wrap.appendChild(t);
    return wrap;
  }

  // ---------- 3b. Produkte ----------
  function produkte(d) {
    var box = el("div");
    box.appendChild(abschnitt("Produkte"));
    var liste = (MM.produkte && MM.produkte.alle()) || [];
    box.appendChild(el("p", "Zu diesen Materialien gibt es konkrete Produkte mit Hersteller und Quelle. Alle anderen Materialien gelten als generischer Materialdatensatz (kein konkretes Produkt). " +
      "Das mit „Standard“ bezeichnete Produkt ist beim Start gewählt; in der Materialauswahl lässt sich ein anderes Produkt oder der generische Datensatz wählen.", "note"));
    var wrap = el("div", null, "table-wrap");
    var t = el("table", null, "data-table kompakt produkte-table");
    var kopf = el("thead"), kz = el("tr");
    ["Material", "Produkt", "Hersteller", "Quelle", "Werte"].forEach(function (h) { kz.appendChild(spaltenKopf(el("th", h))); });
    kopf.appendChild(kz); t.appendChild(kopf);
    var kb = el("tbody");
    liste.forEach(function (p) {
      var m = MM.finde(d.baustoffe, p.material);
      var tr = el("tr");
      tr.appendChild(el("td", m ? m.name : p.material));
      tr.appendChild(el("td", p.name + (p.standard ? " (Standard)" : "") + (p.eigen ? " (eigenes Produkt)" : "")));
      tr.appendChild(el("td", p.hersteller));
      var td = el("td");
      var qid = p.eigen ? "eigen-quelle-" + p.id : p.datenblatt;
      var q = MM.quellen.finde(qid);
      if (q) { var b = MM.quellen.beschreibe(q); td.appendChild(link(b.titel, b.url)); } else td.appendChild(document.createTextNode("–"));
      tr.appendChild(td);
      var n = p.eigen ? Object.keys(p.werte || {}).length : Object.keys(p.eigenschaften || {}).filter(function (k) { var e = p.eigenschaften[k]; return e.wert !== null && e.wert !== undefined || e.werte; }).length;
      tr.appendChild(el("td", String(n), "mitte"));
      kb.appendChild(tr);
    });
    t.appendChild(kb); wrap.appendChild(t);
    box.appendChild(wrap);
    return box;
  }

  function quellen(d) {
    var box = el("div");
    box.appendChild(abschnitt("Quellen"));
    var verw = MM.quellen.verwendung(d);
    var fremd = d.quellen.filter(function (q) { return !q.eigen; });
    var verwendet = fremd.filter(function (q) { return verw[q.id]; });
    var weitere = fremd.filter(function (q) { return !verw[q.id] && q.geprueft === true; });
    var offen = fremd.filter(function (q) { return q.geprueft !== true; });
    var eigene = d.quellen.filter(function (q) { return q.eigen; });

    function gruppe(titel, liste, erklaerung) {
      var det = el("details", null, "sub");
      det.appendChild(el("summary", titel + " (" + liste.length + ")"));
      var body = el("div", null, "sub-body");
      if (erklaerung) body.appendChild(el("p", erklaerung, "note"));
      body.appendChild(quellenTabelle(liste, verw));
      det.appendChild(body);
      return det;
    }
    var g1 = gruppe("Quellen der Kennwerte", verwendet, "Diese Quellen belegen Kennwerte der Datenbank. Jeder Datensatz wurde in der Originaldatei gefunden, die Werte stimmen mit ihr überein (siehe tools/pruefe_gegen_csv.js).");
    g1.open = true;
    g1.classList.add("nicht-drucken");              // die Quellen der gezeigten Werte stehen im Ausdruck unter den Tabellen
    box.appendChild(g1);
    if (weitere.length) box.appendChild(gruppe("Weitere geprüfte Quellen (Download, Dokumentation)", weitere, "Diese Quellen wurden abgerufen, belegen aber selbst keinen Kennwert."));
    if (eigene.length) box.appendChild(gruppe("Eigene Produkte (Angaben der Nutzer:in, nicht geprüft)", eigene, "Diese Quellen hat jemand für ein eigenes Produkt angegeben. Sie wurden nicht geprüft; die Werte sind mit „E“ gekennzeichnet."));
    if (offen.length) box.appendChild(gruppe("Vorgesehene, aber nicht eingesehene Quellen", offen, "Diese Normen sind als Prüfquellen vorgesehen, wurden aber nicht eingesehen. Sie belegen keinen Kennwert der Datenbank."));
    return box;
  }

  // ---------- 5. Nachvollziehbarkeits-Check ----------
  function check(d) {
    var box = el("div");
    box.appendChild(abschnitt("Nachvollziehbarkeits-Check"));
    var r = MM.quellen.pruefe(d);
    box.appendChild(el("p", r.ok
      ? "Bestanden: Alle " + r.belegteKennwerte + " belegten Kennwerte verweisen auf eine geprüfte Quelle mit Link. Es gibt keine unbelegten Richtwerte."
      : "Nicht bestanden: Die Datenbank enthält Kennwerte, deren Herkunft nicht nachvollziehbar ist. Details unten.", r.ok ? "check-ok" : "warn"));
    var liste = el("ul", null, "check-list");
    r.pruefungen.forEach(function (p) {
      var li = el("li", null, p.ok ? "ok" : "fehler");
      li.appendChild(el("span", p.ok ? "✓" : "✗", "check-mark"));
      li.appendChild(document.createTextNode(" " + p.text));
      if (!p.ok) {
        var ul = el("ul");
        p.details.forEach(function (t) { ul.appendChild(el("li", t)); });
        li.appendChild(ul);
      }
      liste.appendChild(li);
    });
    box.appendChild(liste);
    r.warnungen.forEach(function (w) { box.appendChild(el("p", w, "warn")); });
    return box;
  }

  // ---------- 6. Erläuterungen: verteilt auf Datenqualität, Berechnung und fachliche Hinweise ----------
  function liste(paare) {
    var dl = el("dl", null, "explain-list");
    paare.forEach(function (e) {
      dl.appendChild(el("dt", e[0]));
      dl.appendChild(el("dd", e[1]));
    });
    return dl;
  }

  // zur Datenqualität (unter „Datenqualität und Kennzeichnungen“)
  var QUALITAET = [
    ["Herkunft der Kennwerte", "Rohdichte, Flächengewicht und CO₂-Kennwerte stammen, soweit ein passender Datensatz existiert, aus der ÖKOBAUDAT. Alle übrigen Kennwerte sind Beispieldaten (B) oder nicht verfügbar; sie sind in der Kennwertmatrix unter „Erweiterte Datenbankinformationen“ gekennzeichnet. Bei den später ergänzten Baustoffen gibt es dafür bewusst keine Beispieldaten: Was nicht belegt ist, steht als „nicht verfügbar“ in der Übersicht."],
    ["Generische Datensätze", "Generische ÖKOBAUDAT-Datensätze sind laut BBSR nicht extern geprüft, enthalten Sicherheitszuschläge von 10 bis 30 % und gelten nicht für ein bestimmtes Produkt. Durchschnittsdatensätze enthalten diese Zuschläge nicht. Beide stehen deshalb nicht auf gleicher Basis; MaterialMatch weist darauf hin."],
    ["Datenmodus (Demo / Echtdaten)", "Im Kopfbereich der Seite lässt sich wählen, ob die Beispieldaten verwendet werden. Im Demo-Modus sind sie überall mit „B“, gelber Hinterlegung und einem Hinweisbalken gekennzeichnet; sie sind keine geprüften Echtwerte. Im Echtdaten-Modus gelten sie als „nicht verfügbar“, und Berechnungen, Diagramme und Empfehlungen verwenden nur belegte Werte."],
    ["Preise", "Als Beispieldaten (B) gekennzeichnete Preise sind frei gewählt und keine Marktpreise. Mehrwertsteuer und Leistungsumfang (Transport, Einbau) werden bei jedem Preis angegeben, sofern bekannt."]
  ];

  // zu den Hinweisen (unter „Rechtliche und fachliche Hinweise“)
  var HINWEISE = [
    ["Zweck", "MaterialMatch ist ein Hilfsmittel für frühe Entwurfsentscheidungen. Es ersetzt keine bauphysikalischen Nachweise, keine Tragwerksplanung, keinen Brandschutznachweis und keine fachliche Materialfreigabe."],
    ["Brandverhalten und Schall", "Die Euroklasse beschreibt das Material, nicht den Feuerwiderstand eines Bauteils. Schallschutz und Nutzungsdauer sind nicht hinterlegt, weil sie nur für Bauteilaufbauten bzw. mit geeigneter Quelle sinnvoll bestimmbar sind."],
    ["Empfehlungen", "Die Empfehlungen sind regelbasiert. Sie machen keine Aussage zu bauaufsichtlichen Zulassungen, technischer Gleichwertigkeit oder Normkonformität. Beruhen sie auf Beispieldaten, sind sie als „nicht belastbar“ gekennzeichnet."],
    ["Aktualität", "Datenstand und Abrufdatum stehen unter „Erweiterte Datenbankinformationen“ und in der Fußzeile. Datensätze mit begrenzter Gültigkeit (z. B. „gültig bis 2026“) sollten regelmäßig aktualisiert werden."]
  ];

  // Berechnungsmethoden in einfacher Sprache (unter „Wie berechnet MaterialMatch die Ergebnisse?“)
  function methode() {
    var E = MM.einstellungen.hole(), F = E.prioritaetFaktor;
    var gleich = MM.einstellungen.prozentText(MM.bewertung.GLEICH_SCHWELLE);
    return [
      ["Mengenberechnung", "Volumen = Fläche × Dicke. Beispiel: 100 m² × 20 cm (= 0,20 m) ergeben 20 m³. Die Dicke darf in mm, cm oder m eingegeben werden und wird intern in Meter umgerechnet."],
      ["Gewichtsberechnung", "Gewicht = Volumen × Rohdichte. Bei Plattenprodukten und Dachdeckungen mit bekanntem Flächengewicht gilt Fläche × Flächengewicht; die eingegebene Dicke wird dann nicht verwendet."],
      ["Kostenberechnung", "Materialkosten = Menge × Einheitspreis. Welche Menge gemeint ist, richtet sich nach der Einheit des Preises: €/m³ → Volumen, €/kg → Gewicht, €/m² → Fläche. Ohne belegten Preis steht „Preis nicht verfügbar“. Preise werden nur verglichen, wenn Einheit, Mehrwertsteuer und Leistungsumfang zusammenpassen; sonst steht ein Vorbehalt dabei."],
      ["CO₂-Berechnung", "CO₂-Menge = Menge × Kennwert (Menge je Bezugsgröße: m³, kg oder m²). Berücksichtigt sind nur die angegebenen Lebenszyklusmodule (hier A1–A3, Herstellung). Nutzung, Rückbau und Gutschriften sind nicht enthalten. Biogener Kohlenstoff wird getrennt ausgewiesen; er wird am Lebensende wieder freigesetzt oder verrechnet. Pauschale Aussagen wie „Holz ist immer klimafreundlicher“ sind nicht zulässig."],
      ["R-Wert-Berechnung", "Der Wärmedurchlasswiderstand einer Schicht ist R = d / λ (Dicke durch Wärmeleitfähigkeit). Verwendet wird der Bemessungswert λB, wenn er vorliegt; sonst der Nennwert λD, und das Ergebnis gilt als orientierend und nicht als Wärmeschutznachweis. Die erforderliche Dicke für einen gewünschten R-Wert ist d = R × λ. R gilt für eine einzelne Schicht und ist nicht der U-Wert eines Bauteils: Dafür kommen alle Schichten und die Wärmeübergangswiderstände hinzu."],
      ["Bewertungsfarbskala", "Die Balkenlänge zeigt den Zahlenwert, die Farbe die relative Bewertung der gewählten Materialien: von dunkelgrün (vergleichsweise günstig) über gelb (mittlerer Bereich) bis dunkelrot (vergleichsweise ungünstig). Grau bedeutet nicht bewertet oder nicht vergleichbar. Unterschiede unter " + gleich + " gelten als praktisch gleich und erhalten eine neutrale Farbe. Kosten und CO₂ werden je Menge Material verglichen, nicht je Bauteilfunktion; eine Ausnahme ist der Dämmstoffvergleich je gleicher Dämmwirkung (R). Die Farben sind keine allgemeine Qualitätsaussage."],
      ["Alternative Baustoffe", "Es kommen nur Materialien infrage, die laut Datenbank für den gewählten Anwendungsbereich vorgesehen sind. Je Kriterium (Kosten, CO₂, Wärmeleitfähigkeit) bekommt der beste Wert der Gruppe die Bewertung 1 und der schlechteste 0. Die Gesamtbewertung ist das gewichtete Mittel. Das gewählte Prioritätskriterium zählt " + MM.einstellungen.faktorWort(F) + " (Faktor " + F + "), Unterschiede unter " + gleich + " gelten als praktisch gleich, und höchstens " + E.maxEmpfehlungen + " Alternativen werden gezeigt. Ein Material wird nie allein wegen des Preises empfohlen. Diese Werte stehen in der Datei data/einstellungen.js. Die genaue Erklärung mit den aktuellen Zahlen steht im Reiter „Alternativen“ unter „So wird bewertet“."]
    ];
  }

  // ---------- 1. Quellen der ausgewählten Materialien (MaterialMatch 2.0) ----------
  // Gruppiert nach Material (und Produkt): Quelle, Herausgeber, Datenstand, zugehörige Kennwerte, Link.
  // Es werden nur vorhandene Angaben aus dem Quellenkatalog gezeigt; Werte ohne Quelle stehen ausdrücklich als solche da.
  function datenstandText(q) {
    var t = [];
    if (q.datum) t.push("Stand " + q.datum);
    else if (q.datum_hinweis) t.push(q.datum_hinweis);
    if (q.referenzjahr) t.push("Bezugsjahr " + q.referenzjahr);
    if (q.abgerufen) t.push("abgerufen " + q.abgerufen);
    return t.join(" · ") || "–";
  }

  function auswahlQuellen(d) {
    var box = el("div");
    var plaetze = MM.auswahl.holeAuswahl().plaetze;
    if (!plaetze.length) {
      box.appendChild(el("div", "Wählen Sie Materialien im Reiter „Vergleich“, um deren Quellen zu sehen.", "empty-state"));
      return box;
    }
    plaetze.forEach(function (p) {
      var m = p.material, pa = p.produkt || { generisch: true };
      var gruppe = el("div", null, "quelle-material");
      gruppe.setAttribute("data-material", p.buchstabe);
      var kopf = el("h3", null, "subhead");
      kopf.appendChild(el("span", p.buchstabe, "slot slot-small"));
      kopf.appendChild(document.createTextNode(" " + m.name + (pa.generisch ? "" : " · " + pa.name)));
      gruppe.appendChild(kopf);

      var zeilen = {}, reihenfolge = [], ohneQuelle = [], fehlt = [];
      function zuQuelle(id, kennwert) {
        if (!zeilen[id]) { zeilen[id] = []; reihenfolge.push(id); }
        zeilen[id].push(kennwert);
      }
      MM.quellen.KENNWERTE.forEach(function (k) {
        var e = m.eigenschaften[k.id];
        var st = !e ? { status: "fehlt" } : e.nicht_anwendbar === true ? { status: "nicht_anwendbar" }
          : (e.werte !== undefined ? e.werte !== null : (e.wert !== null && e.wert !== undefined)) ? { status: "wert" } : { status: "fehlt" };
        if (st.status === "nicht_anwendbar") return;
        if (st.status === "fehlt") { fehlt.push(k.name); return; }
        if (e.quelle && MM.quellen.finde(e.quelle)) zuQuelle(e.quelle, k.name);
        else ohneQuelle.push(k.name + (e.art === "beispiel" ? " (Beispieldaten)" : ""));
      });
      (pa.herstellerangaben || []).forEach(function (h) {
        if (h.quelle && MM.quellen.finde(h.quelle)) zuQuelle(h.quelle, "Herstellerangabe: " + h.bezeichnung + " (nicht bestätigt, nicht berechnet)");
      });

      if (reihenfolge.length) {
        var wrap = el("div", null, "table-wrap");
        var t = el("table", null, "data-table kompakt quellen-table");
        var th = el("thead"), tr0 = el("tr");
        ["Quelle", "Herausgeber", "Datenstand", "Kennwerte"].forEach(function (h) { tr0.appendChild(spaltenKopf(el("th", h))); });
        th.appendChild(tr0); t.appendChild(th);
        var tb = el("tbody");
        reihenfolge.forEach(function (id) {
          var q = MM.quellen.finde(id), b = MM.quellen.beschreibe(q);
          var tr = el("tr");
          var td = el("td"); td.appendChild(link(b.titel, b.url)); tr.appendChild(td);
          tr.appendChild(el("td", b.eigner || q.herausgeber || "–"));
          tr.appendChild(el("td", datenstandText(q)));
          tr.appendChild(el("td", zeilen[id].join(", ")));
          tb.appendChild(tr);
        });
        t.appendChild(tb); wrap.appendChild(t); gruppe.appendChild(wrap);
      }
      if (ohneQuelle.length) gruppe.appendChild(el("p", "Ohne Quelle: " + ohneQuelle.join(", ") + ".", "note"));
      if (fehlt.length) gruppe.appendChild(el("p", "Nicht verfügbar: " + fehlt.join(", ") + ".", "note"));
      box.appendChild(gruppe);
    });
    return box;
  }

  // ---------- Gesamtdarstellung ----------
  // Fünf Teile im Reiter „Quellen & Details“ (Gerüst in index.html):
  //   #quellen-auswahl          Quellen der ausgewählten Materialien
  //   #qd-inhalt                Datenqualität und Kennzeichnungen
  //   #qm-inhalt                Wie berechnet MaterialMatch die Ergebnisse?
  //   #quellen-inhalt           Erweiterte Datenbankinformationen (Datenstand, Matrix, Produkte, Quellen, Prüfung)
  //   #qh-inhalt                Rechtliche und fachliche Hinweise
  function fuelle(id, kinder) {
    var box = document.getElementById(id);
    if (!box) return null;
    box.textContent = "";
    kinder.forEach(function (k) { if (k) box.appendChild(k); });
    return box;
  }

  function render(d) {
    // Kennwertmatrix und Quellenübersicht gelten für die ganze Datenbank, nicht für die gewählten Materialien:
    // sie bleiben in der Anwendung, werden aber im PDF/Ausdruck weggelassen (Klasse „nur-bildschirm“). Dasselbe gilt für die Gesamtliste aller Produkte
    var matrix = datenqualitaet(d), uebersicht = quellen(d), produktliste = produkte(d);
    [matrix, uebersicht, produktliste].forEach(function (k) { if (k) k.classList.add("nur-bildschirm"); });
    fuelle("quellen-inhalt", [datenstand(d), matrix, produktliste, uebersicht, check(d)]);
    fuelle("qd-inhalt", [datenarten(d), liste(QUALITAET)]);
    fuelle("qm-inhalt", [liste(methode())]);
    fuelle("qh-inhalt", [liste(HINWEISE)]);
    renderAuswahl(d);
  }

  function renderAuswahl(d) {
    fuelle("quellen-auswahl", [auswahlQuellen(d)]);
  }

  MM.quellenAnzeige = {
    init: function (d) {
      MM.quellen.setzeDaten(d);
      render(d);
      // Nach einem Moduswechsel (Demo/Echtdaten) oder neuen eigenen Produkten ändern sich Zählungen und Quellen;
      // geöffnete Bereiche merken, damit sie beim Neuzeichnen offen bleiben
      function neuZeichnen() {
        var alle = [].slice.call(document.querySelectorAll("#quellen details"));
        var offen = alle.map(function (x) { return x.open; });
        render(d);
        [].slice.call(document.querySelectorAll("#quellen details")).forEach(function (x, i) { if (offen[i] !== undefined) x.open = offen[i]; });
      }
      document.addEventListener("mm:daten", neuZeichnen);
      document.addEventListener("mm:produkte", neuZeichnen);
      document.addEventListener("mm:auswahl", function () { renderAuswahl(d); });   // Quellen der gewählten Materialien
      var fuss = document.getElementById("datenstand");
      if (fuss) {
        var root_ = MM.quellen.finde("oekobaudat");
        fuss.textContent = "Datenstand " + d.meta.datenstand + " · Datenbank-Version " + d.meta.version +
          (root_ ? " · ÖKOBAUDAT " + (root_.release || "") + ", abgerufen " + root_.abgerufen : "");
      }
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
