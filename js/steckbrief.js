/* ==========================================================================
   MaterialMatch – Material-Steckbrief (MaterialMatch 3.0)
   --------------------------------------------------------------------------
   Ein Steckbrief fasst einen Baustoff übersichtlich zusammen:
     Illustration, Name, Kategorie, Einsatzbereiche, Einordnung durch das Projekt,
     die wichtigsten Kennwerte (Preis, CO₂ fossil, λ, Rohdichte, Brandklasse, Druckfestigkeit),
     Vorteile und Nachteile. Die ausführlichen Eigenschaften und alle Quellen sind aufklappbar.

   Der Steckbrief ZEIGT NUR Werte aus der Datenbank (so, wie sie im aktuellen Datenmodus gelten); er rechnet nichts.
   Fehlende Werte stehen als „nicht verfügbar“ da, sie werden nie als Vorteil dargestellt.

   Benutzung:
     MM.steckbrief.baue(materialId, produktId)   liefert das Steckbrief-Element (für Karten und Dialog)
     MM.steckbrief.oeffne(materialId, ausloeser)  zeigt den Steckbrief in einem Dialogfenster
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var el = MM.el;
  var daten = null;
  var dialog = null;
  var letzterAusloeser = null;

  var LABELS = {
    rohdichte: "Rohdichte",
    waermeleitfaehigkeit: "Wärmeleitfähigkeit λD (Nennwert)",
    waermeleitfaehigkeit_bemessung: "Wärmeleitfähigkeit λB (Bemessungswert)",
    druckfestigkeit: "Druckfestigkeit",
    preis: "Preis",
    gwp: "CO₂-Bilanz (GWP)",
    brandverhalten: "Brandverhalten (Euroklasse)",
    wasserdampf_mu: "Wasserdampf-Diffusionswiderstand μ",
    waermekapazitaet: "Spezifische Wärmekapazität",
    recycling: "Recycling und Rückbau",
    flaechengewicht: "Flächengewicht"
  };
  var REIHENFOLGE = ["preis", "gwp", "waermeleitfaehigkeit_bemessung", "waermeleitfaehigkeit", "rohdichte", "brandverhalten", "druckfestigkeit",
    "wasserdampf_mu", "waermekapazitaet", "flaechengewicht", "recycling"];

  function zahl(x) { return MM.berechnung.formatZahl(x); }
  function istZahl(x) { return typeof x === "number" && isFinite(x); }

  function artMarke(art) {
    if (!art || !MM.tabelle || !MM.tabelle.ART[art]) return null;
    var m = el("span", MM.tabelle.ART[art].kurz, "art art-" + art);
    m.setAttribute("title", MM.tabelle.ART[art].text);
    return m;
  }

  // Ein Wert als { text, art, nebenzeile } – oder null, wenn kein Wert vorliegt
  function wertVon(schluessel, e) {
    if (!e) return null;
    if (e.nicht_anwendbar === true) return { fehlt: "nicht anwendbar", grund: e.hinweis || "" };
    if (schluessel === "gwp") {
      if (!e.werte || !istZahl(e.werte.fossil)) return null;
      var bezug = String(e.deklarierte_einheit || "").replace(/^1\s*/, "");
      var q = e.quelle ? MM.quellen.finde(e.quelle) : null;
      var typ = q && q.typ ? (MM.quellen.TYP_DE[q.typ] || q.typ) : "Beispieldaten";
      return { text: zahl(e.werte.fossil), einheit: "kg CO₂e/" + bezug, art: e.art,
        neben: "fossil, Module " + (e.module || "–") + ", Datensatz: " + typ + ". Nur bei gleichem Modul und gleichem Datensatztyp direkt vergleichbar." };
    }
    if (schluessel === "brandverhalten") {
      if (!e.wert) return null;
      return { text: String(e.wert), einheit: "", art: e.art, neben: "Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils." };
    }
    if (schluessel === "recycling") {
      if (!e.wert) return null;
      return { text: String(e.wert), einheit: "", art: e.art, lang: true };
    }
    if (!istZahl(e.wert)) return null;
    var neben = "";
    if (schluessel === "preis" && e.mwst) neben = "Mehrwertsteuer: " + e.mwst + (e.umfang ? ", Umfang: " + e.umfang : "");
    return { text: zahl(e.wert), einheit: e.einheit || "", art: e.art, neben: neben };
  }

  function grundText(e) {
    if (!e) return "";
    return e.hinweis || "";
  }

  // Eine Kennwert-Kachel im Steckbrief
  function kennwert(titel, schluessel, m, alternativ) {
    var e = m.eigenschaften[schluessel];
    var w = wertVon(schluessel, e);
    if (!w && alternativ) { e = m.eigenschaften[alternativ]; w = wertVon(alternativ, e); }
    var box = el("div", null, "sb-kennwert");
    box.setAttribute("data-kennwert", schluessel);
    box.appendChild(el("span", titel, "sb-kennwert-titel"));
    var zeile = el("span", null, "sb-kennwert-wert");
    if (w && w.text !== undefined) {
      zeile.appendChild(el("span", w.text, "sb-zahl"));
      if (w.einheit) zeile.appendChild(el("span", w.einheit, "sb-einheit"));
      var am = artMarke(w.art);
      if (am) zeile.appendChild(am);
      box.appendChild(zeile);
      if (w.neben) box.appendChild(el("span", w.neben, "sb-neben"));
      // Datenqualität leise darunter; die Erklärung steht im Hover-Text
      var dq = MM.quellen.datenqualitaet(e && e.art, e && e.quelle, schluessel);
      var dqEl = el("span", dq.name, "sb-qualitaet sb-qualitaet-" + dq.id);
      dqEl.setAttribute("title", dq.text);
      box.appendChild(dqEl);
    } else {
      zeile.appendChild(el("span", w && w.fehlt ? w.fehlt : "nicht verfügbar", "sb-fehlt"));
      box.appendChild(zeile);
      var g = w && w.grund ? w.grund : grundText(e);
      if (g) {
        var d = el("details", null, "sb-grund");
        d.appendChild(el("summary", "Warum?"));
        d.appendChild(el("p", g));
        box.appendChild(d);
      }
    }
    return box;
  }

  function liste(titel, eintraege, klasse) {
    var box = el("div", null, "sb-liste " + klasse);
    box.appendChild(el("h4", titel));
    var ul = el("ul");
    (eintraege || []).forEach(function (t) { ul.appendChild(el("li", t)); });
    box.appendChild(ul);
    return box;
  }

  function quellenListe(m) {
    var ids = [];
    Object.keys(m.eigenschaften).forEach(function (k) {
      var q = m.eigenschaften[k] && m.eigenschaften[k].quelle;
      if (q && ids.indexOf(q) === -1) ids.push(q);
    });
    var ul = el("ul", null, "sb-quellen");
    if (!ids.length) { ul.appendChild(el("li", "Für dieses Material liegt keine Quelle vor (nur Beispieldaten oder keine Angabe).", "sb-fehlt")); return ul; }
    ids.forEach(function (id) {
      var q = MM.quellen.finde(id);
      if (!q) return;
      var b = MM.quellen.beschreibe(q);
      var li = el("li");
      if (b.url) {
        var a = el("a", b.titel);
        a.setAttribute("href", b.url);
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
        li.appendChild(a);
      } else li.appendChild(document.createTextNode(b.titel));
      var rest = (b.eigner ? " (" + b.eigner + ")" : "") + (b.detail ? ", " + b.detail : "");
      if (rest) li.appendChild(el("span", rest, "sb-quelle-rest"));
      ul.appendChild(li);
    });
    return ul;
  }

  function alleEigenschaften(m) {
    var wrap = el("div", null, "table-wrap");
    var t = el("table", null, "data-table kompakt");
    var th = el("thead"), tr = el("tr");
    ["Eigenschaft", "Wert", "Datenart"].forEach(function (h) { var c = el("th", h); c.setAttribute("scope", "col"); tr.appendChild(c); });
    th.appendChild(tr); t.appendChild(th);
    var tb = el("tbody");
    REIHENFOLGE.forEach(function (k) {
      var e = m.eigenschaften[k];
      if (!e) return;
      var zeile = el("tr");
      zeile.appendChild(el("th", LABELS[k] || k));
      zeile.firstChild.setAttribute("scope", "row");
      var w = wertVon(k, e);
      var td = el("td");
      if (w && w.text !== undefined) {
        td.appendChild(document.createTextNode(w.text + (w.einheit ? " " + w.einheit : "")));
        if (k === "gwp" && e.werte) {
          var zusatz = [];
          if (istZahl(e.werte.gesamt)) zusatz.push("gesamt " + zahl(e.werte.gesamt));
          if (istZahl(e.werte.biogen)) zusatz.push("biogen " + zahl(e.werte.biogen));
          if (zusatz.length) td.appendChild(el("span", " (" + zusatz.join(", ") + ")", "soft-text"));
        }
      } else {
        td.appendChild(el("span", w && w.fehlt ? w.fehlt : "nicht verfügbar", "missing-text"));
      }
      zeile.appendChild(td);
      var ta = el("td");
      var am = w ? artMarke(w.art) : null;
      if (am) ta.appendChild(am); else ta.appendChild(document.createTextNode("–"));
      zeile.appendChild(ta);
      tb.appendChild(zeile);
    });
    t.appendChild(tb);
    wrap.appendChild(t);
    return wrap;
  }

  // ---------- Abschnitt „Warum dieses Match?“ (nur wenn der Steckbrief aus dem Match-Bereich geöffnet wird) ----------
  function matchAbschnitt(e) {
    var box = el("section", null, "sb-match");
    box.appendChild(el("h4", "Warum dieses Match?"));
    var z1 = el("p", null, "sb-match-zeile");
    z1.appendChild(el("strong", "Eignung: "));
    z1.appendChild(document.createTextNode(e.stufeName + (e.eignungText ? ". " + e.eignungText : "")));
    box.appendChild(z1);
    e.bedingungen.forEach(function (b) { box.appendChild(el("p", b, "sb-match-warnung")); });
    var z2 = el("p", null, "sb-match-zeile");
    z2.appendChild(el("strong", "Match-Punkte: "));
    z2.appendChild(document.createTextNode(e.score === null ? "Die Datenlage reicht nicht für Match-Punkte." : MM.matching.scoreText(e) + " – ein relativer Vergleich der geeigneten Materialien dieses Einsatzbereichs (" + e.abdeckung.belegt + " von " + e.abdeckung.von + " Kriterien belegt, " + e.belastbarkeit + "). Die Punkte sind keine Eignungsbestätigung."));
    box.appendChild(z2);
    if (e.erklaerung) box.appendChild(el("p", e.erklaerung, "sb-match-zeile"));
    return box;
  }

  // ---------- Der Steckbrief ----------
  function baue(materialId, produktId, match) {
    var m = MM.produkte.wirksam(materialId, produktId || "");
    var art = el("article", null, "steckbrief-karte");
    art.setAttribute("data-material", materialId);

    var kopf = el("div", null, "sb-kopf");
    kopf.appendChild(MM.materialbilder.element(materialId, { groesse: "gross", beschriftung: true }));
    var info = el("div", null, "sb-info");
    var h = el("h3", m.name, "sb-name");
    h.id = "sb-titel-" + materialId;
    info.appendChild(h);
    info.appendChild(el("p", MM.namenAusIds(m.kategorien, daten.kategorien), "sb-kategorie"));
    var pa = m.produktAktiv;
    info.appendChild(el("p", pa && !pa.generisch ? "Produkt: " + pa.name + " (" + pa.hersteller + ")" : "Generischer Materialdatensatz, kein konkretes Herstellerprodukt", "sb-produkt"));
    var einsatz = el("p", null, "sb-einsatz");
    einsatz.appendChild(el("strong", "Typischer Einsatz: "));
    einsatz.appendChild(document.createTextNode(MM.namenAusIds(m.anwendungen, daten.anwendungsbereiche)));
    info.appendChild(einsatz);
    var profil = root.MATERIALMATCH_PROFIL && root.MATERIALMATCH_PROFIL.materialien[materialId];
    if (profil) {
      var chips = el("p", null, "sb-chips");
      profil.klassen.forEach(function (k) {
        var c = el("span", root.MATERIALMATCH_PROFIL.meta.klassen[k].name, "sb-chip");
        c.setAttribute("title", root.MATERIALMATCH_PROFIL.meta.klassen[k].kriterium);
        chips.appendChild(c);
      });
      chips.appendChild(el("span", root.MATERIALMATCH_PROFIL.meta.titel, "sb-chip-hinweis"));
      info.appendChild(chips);
    }
    kopf.appendChild(info);
    art.appendChild(kopf);

    // Aus dem Match-Bereich geöffnet: Eignung und Match-Punkte getrennt, dazu die längere Begründung
    if (match) art.appendChild(matchAbschnitt(match));

    // Die wichtigsten Kennwerte
    var grid = el("div", null, "sb-kennwerte");
    grid.appendChild(kennwert("Preis", "preis", m));
    grid.appendChild(kennwert("CO₂ (fossil)", "gwp", m));
    grid.appendChild(kennwert("Wärmeleitfähigkeit λ", "waermeleitfaehigkeit_bemessung", m, "waermeleitfaehigkeit"));
    grid.appendChild(kennwert("Rohdichte", "rohdichte", m));
    grid.appendChild(kennwert("Brandklasse", "brandverhalten", m));
    grid.appendChild(kennwert("Druckfestigkeit", "druckfestigkeit", m));
    art.appendChild(grid);

    var vn = el("div", null, "sb-vn");
    vn.appendChild(liste("Vorteile", m.vorteile, "sb-vorteile"));
    vn.appendChild(liste("Nachteile", m.nachteile, "sb-nachteile"));
    art.appendChild(vn);

    var mehr = el("details", null, "sb-mehr");
    mehr.appendChild(el("summary", "Alle Eigenschaften und Quellen"));
    var inhalt = el("div", null, "sb-mehr-inhalt");
    inhalt.appendChild(alleEigenschaften(m));
    if (profil) {
      var p = el("p", null, "sb-einordnung");
      p.appendChild(el("strong", root.MATERIALMATCH_PROFIL.meta.titel + ": "));
      p.appendChild(document.createTextNode(profil.begruendung));
      inhalt.appendChild(p);
    }
    inhalt.appendChild(el("h4", "Quellen der Kennwerte"));
    inhalt.appendChild(quellenListe(m));
    mehr.appendChild(inhalt);
    art.appendChild(mehr);

    art.appendChild(el("p", "Die Illustration ist eine schematische Zeichnung, kein Foto und kein Herstellerprodukt. Alle Werte sind Orientierungswerte für frühe Entwurfsentscheidungen.", "sb-fuss"));
    return art;
  }

  // Zwei bis drei Kennwerte in Kurzform für Karten (Swipe, Favoriten): nur vorhandene Werte, die gewählten Kriterien zuerst.
  // bevorzugt: Kriterien-Kennungen aus dem Interview (kosten, co2, waerme, gewicht, festigkeit)
  var KURZ = {
    co2: { titel: "CO₂ fossil", schluessel: "gwp" },
    kosten: { titel: "Preis", schluessel: "preis" },
    waerme: { titel: "λ", schluessel: "waermeleitfaehigkeit_bemessung", alternativ: "waermeleitfaehigkeit" },
    gewicht: { titel: "Rohdichte", schluessel: "rohdichte" },
    festigkeit: { titel: "Druckfestigkeit", schluessel: "druckfestigkeit" },
    brand: { titel: "Brandklasse", schluessel: "brandverhalten" }
  };
  function kurzKennwerte(materialId, n, bevorzugt) {
    var m = MM.produkte.wirksam(materialId, "");
    var reihe = (bevorzugt || []).concat(["co2", "gewicht", "waerme", "brand", "kosten", "festigkeit"]);
    var out = [], gesehen = {};
    reihe.forEach(function (id) {
      if (out.length >= n || gesehen[id] || !KURZ[id]) return;
      gesehen[id] = true;
      var d = KURZ[id], e = m.eigenschaften[d.schluessel], w = wertVon(d.schluessel, e);
      if ((!w || w.text === undefined) && d.alternativ) { e = m.eigenschaften[d.alternativ]; w = wertVon(d.alternativ, e); }
      if (w && w.text !== undefined) out.push({ id: id, titel: d.titel, text: w.text + (w.einheit ? " " + w.einheit : ""), art: w.art });
    });
    return out;
  }

  // ---------- Dialogfenster ----------
  function dialogErzeugen() {
    var d = document.createElement("dialog");
    d.className = "steckbrief";
    d.setAttribute("aria-label", "Material-Steckbrief");
    var zu = el("button", null, "steckbrief-zu");
    zu.type = "button";
    zu.setAttribute("aria-label", "Steckbrief schließen");
    zu.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-x"/></svg>';
    zu.addEventListener("click", function () { schliesse(); });
    d.appendChild(zu);
    var box = el("div", null, "steckbrief-inhalt");
    box.id = "steckbrief-inhalt";
    d.appendChild(box);
    // Klick auf den abgedunkelten Hintergrund schließt
    d.addEventListener("click", function (e) { if (e.target === d) schliesse(); });
    d.addEventListener("close", function () {
      if (letzterAusloeser && document.contains(letzterAusloeser) && letzterAusloeser.focus) letzterAusloeser.focus();
      letzterAusloeser = null;
    });
    document.body.appendChild(d);
    return d;
  }

  function oeffne(materialId, ausloeser, produktId, match) {
    if (!daten || !MM.finde(daten.baustoffe, materialId)) return false;
    if (!dialog) dialog = dialogErzeugen();
    letzterAusloeser = ausloeser || document.activeElement;
    var box = dialog.querySelector(".steckbrief-inhalt");
    box.textContent = "";
    var k = baue(materialId, produktId, match);
    box.appendChild(k);
    dialog.setAttribute("aria-labelledby", "sb-titel-" + materialId);
    dialog.removeAttribute("aria-label");
    if (typeof dialog.showModal === "function") { if (!dialog.open) dialog.showModal(); }
    else dialog.setAttribute("open", "");
    box.scrollTop = 0;
    dialog.querySelector(".steckbrief-zu").focus();
    return true;
  }

  function schliesse() {
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close(); else dialog.removeAttribute("open");
  }

  // Der „Steckbrief“-Knopf für Karten
  function knopf(materialId, produktId) {
    var b = el("button", "Steckbrief", "btn-link steckbrief-knopf");
    b.type = "button";
    var m = MM.finde(daten.baustoffe, materialId);
    b.setAttribute("aria-label", "Steckbrief öffnen: " + (m ? m.name : materialId));
    b.setAttribute("data-steckbrief", materialId);
    b.addEventListener("click", function () { oeffne(materialId, b, produktId); });
    return b;
  }

  // „Quellen & Details“: Erklärung der Illustrationen und Kriterien der Einordnung
  function infoBereich() {
    var box = document.getElementById("qi-inhalt");
    if (!box) return;
    box.textContent = "";
    var p = root.MATERIALMATCH_PROFIL;
    box.appendChild(el("h4", "Materialillustrationen"));
    box.appendChild(el("p", "Alle Bilder in MaterialMatch sind „" + MM.materialbilder.HINWEIS + "“: selbst gezeichnete Schraffuren im Stil von Architekturplänen (SVG-Dateien im Ordner img/schraffuren). Sie sind keine Fotos und zeigen keine Herstellerprodukte. Sie sind einfarbig (Schwarz, Weiß, Grau), stammen vom Projektteam, es gibt keine Rechte Dritter und keine Bildserver; alles funktioniert offline. Es sind keine normgerechten Schraffuren und keine Bewertung."));
    if (p) {
      box.appendChild(el("h4", p.meta.titel));
      box.appendChild(el("p", p.meta.hinweis));
      var dl = el("dl", null, "explain-list");
      Object.keys(p.meta.klassen).forEach(function (k) {
        dl.appendChild(el("dt", p.meta.klassen[k].name));
        dl.appendChild(el("dd", p.meta.klassen[k].kriterium));
      });
      box.appendChild(dl);
      box.appendChild(el("p", "Die Zuordnung jedes einzelnen Materials mit kurzer Begründung steht in data/materialprofil.js und im Steckbrief unter „Alle Eigenschaften und Quellen“.", "soft-text"));
    }
  }

  MM.steckbrief = {
    LABELS: LABELS,
    baue: baue,
    oeffne: oeffne,
    schliesse: schliesse,
    knopf: knopf,
    kurzKennwerte: kurzKennwerte,
    artMarke: artMarke,
    init: function (baustoffdaten) {
      daten = baustoffdaten;
      infoBereich();
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
