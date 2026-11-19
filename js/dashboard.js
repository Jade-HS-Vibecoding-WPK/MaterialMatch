/* ==========================================================================
   MaterialMatch – Kennwert-Kacheln „Vergleich auf einen Blick“ (MaterialMatch 2.0, Bento-Redesign)
   --------------------------------------------------------------------------
   Vier Kacheln: Materialkosten, CO₂ (fossil), Gewicht, Wärmedämmung (mit R-Wert).
   Jede Kachel zeigt je Material (A, B, C) eine große Zahl, einen kleinen Vergleichsbalken und
   einen kleinen Bewertungspunkt. Das Info-Symbol (i) öffnet die Quellen des gezeigten Werts.

   Hervorhebung (MaterialMatch 3.1): Die vier Kacheln sind immer gleich groß und stehen immer in
   derselben Reihenfolge. Wählt jemand eine Priorität (Kosten, CO₂, Gewicht, Wärmedämmung), trägt die
   passende Kachel nur einen dezenten hellblauen Rand und die kleine Marke „Dein Schwerpunkt“
   (ersetzt die große Hero-Kachel aus Version 2.1). Das ist nur die Darstellung: die Zahlen, Farben
   und Bewertungen bleiben genau dieselben, es gibt keine neue Bewertungslogik.

   Das Dashboard RECHNET NICHTS. Es zeigt die fertigen Ergebnisse der Diagramme
   (MM.diagramme.ergebnisse()) und zeichnet sich bei jeder Meldung "mm:diagramme" neu.
   Darum stimmen Zahlen, Farben und Hinweise immer mit den Diagrammen überein.
   Die Länge der Balken ist nur die Zahl im Verhältnis zur größten gezeigten Zahl (reine Darstellung).
   Fehlende, nicht ermittelbare, nicht vergleichbare und nicht bewertete Werte werden
   als solche gezeigt; es gibt keine Ersatzwerte.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var el = MM.el;
  var box = null;
  var offeneInfos = {};      // welche Info-Fenster geöffnet sind (bleiben beim Neuzeichnen offen)

  // Welches Diagramm speist welche Kachel
  var KARTEN = [
    { id: "kosten", titel: "Materialkosten", einheit: "€", kurz: "€", braucht: "eingabe", symbol: "wallet" },
    { id: "co2-fossil", titel: "CO₂ (fossil)", einheit: "kg CO₂e", kurz: "kg CO₂e", braucht: "eingabe", symbol: "leaf" },
    { id: "gewicht", titel: "Gewicht", einheit: "kg", kurz: "kg", braucht: "eingabe", symbol: "weight" },
    { id: "lambda", titel: "Wärmedämmung", einheit: "λ in W/(m·K)", kurz: "W/(m·K)", braucht: null, symbol: "thermometer" }
  ];

  // Welche Priorität markiert welche Kachel dezent (reine Darstellung)
  var SCHWERPUNKT = { kosten: "kosten", co2: "co2-fossil", gewicht: "gewicht", waerme: "lambda" };

  var STATUS_TEXT = { fehlt: "fehlt", nicht_anwendbar: "nicht anwendbar", nicht_berechenbar: "nicht berechenbar", nicht_vergleichbar: "nicht vergleichbar" };

  function symbol(name, klasse) {
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "ico" + (klasse ? " " + klasse : ""));
    svg.setAttribute("aria-hidden", "true");
    var use = document.createElementNS(NS, "use");
    use.setAttribute("href", "#i-" + name);
    svg.appendChild(use);
    return svg;
  }

  function maximum(d) {
    var m = 0;
    d.zeilen.forEach(function (z) { if (z.status === "wert" && z.wert > m) m = z.wert; });
    return m;
  }

  function zeile(z, bewertet, def, max) {
    var li = el("li", null, "kw-zeile");
    li.setAttribute("data-material", z.buchstabe);
    li.appendChild(el("span", z.buchstabe, "slot slot-small"));
    var name = el("span", z.name, "kw-name");
    name.setAttribute("title", z.name);
    li.appendChild(name);

    var wert = el("span", null, "kw-wert");
    if (z.status === "wert") {
      wert.appendChild(el("span", MM.berechnung.formatZahl(z.wert), "kw-zahl"));
      wert.appendChild(el("span", def.kurz, "kw-einh"));
      if (z.art && MM.tabelle && MM.tabelle.ART[z.art]) {
        var marke = el("span", MM.tabelle.ART[z.art].kurz, "art art-" + z.art);
        marke.setAttribute("title", MM.tabelle.ART[z.art].text);
        wert.appendChild(marke);
      }
    } else {
      var t = el("span", STATUS_TEXT[z.status] || z.status, "kw-fehlt");
      if (z.notiz) t.setAttribute("title", z.notiz);
      wert.appendChild(t);
    }
    li.appendChild(wert);

    // Punkt in der Bewertungsfarbe (relative Bewertung wie im Diagramm); ohne Wert kein Punkt
    var punkt = el("span", null, "kw-punkt");
    if (z.status === "wert") {
      punkt.style.background = z.farbe;
      punkt.setAttribute("role", "img");
      punkt.setAttribute("aria-label", "Bewertung: " + z.bewertung + (bewertet ? " (relativ)" : ""));
      punkt.setAttribute("title", z.bewertung);
    } else {
      punkt.classList.add("leer");
      punkt.setAttribute("aria-hidden", "true");
    }
    li.appendChild(punkt);

    // Kleiner Vergleichsbalken (nur Darstellung): Länge = Wert im Verhältnis zum größten Wert
    if (z.status === "wert" && max > 0 && z.wert >= 0) {
      var spur = el("span", null, "kw-spur");
      spur.setAttribute("aria-hidden", "true");
      var balken = el("i", null, "kw-balken");
      balken.style.width = Math.max(2, Math.round(z.wert / max * 100)) + "%";
      balken.style.background = z.farbe || "";
      spur.appendChild(balken);
      li.appendChild(spur);
    }

    // Wärmedämmung: R-Wert (R = d / λ), fertig aus der Schnittstelle der Diagramme
    if (def.id === "lambda") {
      var r = z.rWert;
      if (r) {
        var rz = el("span", null, "kw-zusatz");
        rz.appendChild(el("span", "R-Wert", "kw-zusatz-name"));
        rz.appendChild(el("strong", MM.berechnung.formatZahl(r.wert), "kw-r"));
        rz.appendChild(document.createTextNode(" " + r.einheit));
        if (r.lambdaTyp !== "bemessung") {
          rz.appendChild(document.createTextNode(" · orientierend"));
          rz.setAttribute("title", "Nur der Nennwert λD liegt vor, kein Bemessungswert λB: Näherungswert ohne Wärmeschutznachweis.");
        }
        li.appendChild(rz);
      }
    }
    return li;
  }

  // Info-Symbol mit Quellenfenster: zeigt je Material die Quelle des gezeigten Werts
  function infoFenster(def, d) {
    var kopfId = "kw-info-" + def.id;
    var knopf = el("button", null, "info-knopf");
    knopf.type = "button";
    knopf.setAttribute("aria-expanded", offeneInfos[def.id] ? "true" : "false");
    knopf.setAttribute("aria-controls", kopfId);
    knopf.setAttribute("aria-label", "Quelle zu " + def.titel + " anzeigen");
    knopf.setAttribute("title", "Quelle anzeigen");
    knopf.appendChild(symbol("info"));

    var fenster = el("div", null, "kw-info");
    fenster.id = kopfId;
    fenster.hidden = !offeneInfos[def.id];
    fenster.appendChild(el("p", "Quelle des gezeigten Werts", "kw-info-titel"));
    var ul = el("ul", null, "kw-info-liste");
    d.zeilen.forEach(function (z) {
      var li = el("li");
      li.appendChild(el("span", z.buchstabe, "slot slot-small"));
      var q = z.quelle && MM.quellen ? MM.quellen.finde(z.quelle) : null;
      if (!q) {
        li.appendChild(el("span", z.status === "wert" ? "Keine Quelle hinterlegt." : "Kein Wert.", "kw-info-text"));
      } else {
        var b = MM.quellen.beschreibe(q);
        var text = el("span", null, "kw-info-text");
        if (b.url) {
          var a = el("a", b.titel);
          a.setAttribute("href", b.url);
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
          text.appendChild(a);
        } else text.appendChild(document.createTextNode(b.titel));
        li.appendChild(text);
      }
      // Datenqualität (aus Datenart und Quelle): ein kurzes Wort, Erklärung im Hover-Text
      if (z.status === "wert") {
        var dq = MM.quellen.datenqualitaet(z.art, z.quelle, def.id === "kosten" ? "preis" : def.id);
        var dqEl = el("span", dq.name, "kw-qualitaet");
        dqEl.setAttribute("title", dq.text);
        li.appendChild(dqEl);
      }
      ul.appendChild(li);
    });
    fenster.appendChild(ul);
    fenster.appendChild(el("p", "Alle Quellen und Einzelheiten stehen im Reiter „Quellen & Details“.", "kw-info-fuss"));
    knopf.addEventListener("click", function () {
      offeneInfos[def.id] = fenster.hidden;
      fenster.hidden = !fenster.hidden;
      knopf.setAttribute("aria-expanded", fenster.hidden ? "false" : "true");
    });
    return { knopf: knopf, fenster: fenster };
  }

  function karte(def, d, mitEingabe, schwerpunkt) {
    var art = el("article", null, "kennwert kachel" + (schwerpunkt ? " kennwert-schwerpunkt" : ""));
    art.setAttribute("data-kennwert", def.id);
    art.setAttribute("data-rolle", schwerpunkt ? "schwerpunkt" : "gleich");
    var kopfZeile = el("div", null, "kachel-kopf");
    kopfZeile.appendChild(symbol(def.symbol, "kachel-symbol"));
    var kopf = el("h3", def.titel);
    kopf.appendChild(el("span", def.einheit === "€" || def.einheit === "kg" || def.einheit === "kg CO₂e" ? " (" + def.einheit + ")" : "", "kw-einheit"));
    kopfZeile.appendChild(kopf);
    if (schwerpunkt) {
      var marke = el("span", "Dein Schwerpunkt", "kw-schwerpunkt");
      marke.setAttribute("title", "Diese Kennzahl hast du als Priorität gewählt. Die Werte und Farben ändern sich dadurch nicht.");
      kopfZeile.appendChild(marke);
    }
    art.appendChild(kopfZeile);

    if (def.braucht === "eingabe" && !mitEingabe) {
      art.appendChild(el("p", "Fläche und Dicke eingeben.", "kw-leer"));
      return art;
    }
    if (!d) { art.appendChild(el("p", "Keine Daten.", "kw-leer")); return art; }

    var info = infoFenster(def, d);
    kopfZeile.appendChild(info.knopf);

    var unterkopf = null;
    if (def.id === "lambda") unterkopf = d.lambdaTyp === "bemessung" ? "λ in W/(m·K), Bemessungswert" : "λ in W/(m·K), Nennwert";
    if (unterkopf) art.appendChild(el("p", unterkopf, "kw-unter"));
    art.appendChild(info.fenster);

    var max = maximum(d);
    var ul = el("ul", null, "kw-zeilen");
    d.zeilen.forEach(function (z) { ul.appendChild(zeile(z, d.bewertet, def, max)); });
    art.appendChild(ul);

    // Kurzer Status sichtbar; der volle Text (Warnungen, Gründe, Hinweise) steht unter „Mehr“ und in den Diagrammen
    var warnungen = d.hinweise.filter(function (h) { return h.klasse === "warn"; });
    var weitere = d.hinweise.filter(function (h) { return h.klasse !== "warn"; });
    if (warnungen.length) art.appendChild(el("p", "Nur eingeschränkt vergleichbar.", "kw-status kw-warn"));
    else if (!d.bewertet) art.appendChild(el("p", "Nicht bewertet.", "kw-status"));
    if (warnungen.length || d.grund || weitere.length) {
      var mehr = el("details", null, "kw-mehr");
      mehr.appendChild(el("summary", "Mehr"));
      warnungen.forEach(function (h) { mehr.appendChild(el("p", h.text, "kw-mehr-warn")); });
      if (d.grund) mehr.appendChild(el("p", d.grund));
      weitere.forEach(function (h) { mehr.appendChild(el("p", h.text)); });
      art.appendChild(mehr);
    }
    return art;
  }

  function render() {
    if (!box) return;
    var e = MM.diagramme.ergebnisse();
    box.textContent = "";
    if (!e.anzahl) {
      var leer = el("div", null, "empty-state kw-leerzustand");
      leer.appendChild(symbol("scale", "kw-leer-symbol"));
      leer.appendChild(el("p", "Wähle Material A und Material B.", "kw-leer-titel"));
      leer.appendChild(el("p", "Dann erscheinen hier Kosten, CO₂, Gewicht und Wärmedämmung.", "kw-leer-text"));
      box.appendChild(leer);
      return;
    }
    var heroId = SCHWERPUNKT[MM.prioritaet ? MM.prioritaet.holen() : "ausgewogen"] || null;
    var raster = el("div", null, "kw-raster");
    raster.setAttribute("data-modus", "gleich");   // immer vier gleich große Kacheln, feste Reihenfolge
    KARTEN.forEach(function (def) { raster.appendChild(karte(def, e.diagramme[def.id], e.mitEingabe, def.id === heroId)); });
    box.appendChild(raster);
    box.appendChild(el("p", "Die Farben zeigen eine relative Bewertung der ausgewählten Materialien und stellen keine allgemeingültige Aussage über deren Qualität dar.", "kw-fuss"));
  }

  MM.dashboard = {
    init: function () {
      box = document.getElementById("dashboard-inhalt");
      if (!box || !MM.diagramme || !MM.diagramme.ergebnisse) return;
      document.addEventListener("mm:diagramme", render);
      render();
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
