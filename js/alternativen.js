/* ==========================================================================
   MaterialMatch – Anzeige der alternativen Baustoffe (Schritt 8)
   --------------------------------------------------------------------------
   Zeigt bis zu drei Empfehlungen als Karten. Die Berechnung steckt in
   js/empfehlung.js. Ausgangspunkt ist Material A (oder, falls A leer ist,
   das erste gewählte Material). Der Anwendungsbereich kommt aus dem Feld
   "Anwendungsbereich" in den Eingaben.

   Der Button "Alternative vergleichen" setzt das Material in den
   bestehenden Vergleich (Platz B, sonst C); Material A bleibt unverändert.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var el = MM.el;
  var daten = null;
  var box = null;
  var select = null;
  function prioritaet() { return MM.prioritaet ? MM.prioritaet.holen() : "ausgewogen"; }   // zentrale Priorität (js/prioritaet.js)
  var letzteRef;                   // zuletzt gesehenes Ausgangsmaterial (undefined = noch nie befüllt)
  var bestaetigung = "";           // Meldung nach "Alternative vergleichen"
  var offenMerker = {};            // welche einklappbaren Bereiche offen sind

  function referenzPlatz(plaetze) {
    for (var i = 0; i < plaetze.length; i++) if (plaetze[i].buchstabe === "A") return plaetze[i];
    return plaetze[0] || null;
  }

  // Das Anwendungsfeld bietet nur Bereiche an, für die Material A vorgesehen ist
  function bereichsfeldFuellen(ref) {
    var id = ref ? ref.id : null;
    if (id === letzteRef && select.options.length) return;
    letzteRef = id;
    var alt = select.value;
    select.textContent = "";
    var auto = el("option", "Automatisch (aus Material A)");
    auto.value = "";
    select.appendChild(auto);
    if (ref) {
      ref.anwendungen.forEach(function (aid) {
        var b = MM.finde(daten.anwendungsbereiche, aid);
        var o = el("option", b ? b.name : aid);
        o.value = aid;
        select.appendChild(o);
      });
    }
    select.value = ref && ref.anwendungen.indexOf(alt) !== -1 ? alt : "";
    select.disabled = !ref;
  }

  // Bewertung 0 bis 1 mit höchstens zwei Nachkommastellen
  function zahl2(x) { return MM.berechnung.formatZahl(Math.round(x * 100) / 100); }

  // Wirkung der Priorität in Worten; der Faktor kommt aus data/einstellungen.js
  function wirkung(prio) {
    var E = MM.einstellungen, f = E.hole().prioritaetFaktor, w = E.faktorWort(f);
    var texte = {
      ausgewogen: "Alle bewerteten Kriterien zählen gleich viel (Gewichtung 1×). Bei Dämmstoffen gehört die Wärmeleitfähigkeit dazu.",
      kosten: "Die Kosten zählen " + w + ", alle anderen Kriterien einfach.",
      co2: "Die fossilen CO₂-Emissionen zählen " + w + ", alle anderen Kriterien einfach.",
      gewicht: "Das Gewicht (Rohdichte) kommt als zusätzliches Kriterium hinzu und zählt " + w + ". Das Gewichtsdiagramm oben wird farbig bewertet.",
      waerme: "Die Wärmeleitfähigkeit zählt " + w + ". Außerhalb der Dämmstoffe kommt sie als zusätzliches Kriterium hinzu."
    };
    return texte[prio];
  }

  // Erklärung der Bewertungsmethode, abhängig von der gewählten Priorität
  function methodeBauen(res) {
    var d = el("details", null, "sub");
    d.setAttribute("data-key", "methode");
    d.open = offenMerker.methode === true;
    d.appendChild(el("summary", "So wird bewertet"));
    var body = el("div", null, "sub-body");

    var wirkt = el("p", null, "note");
    wirkt.appendChild(document.createTextNode("Gewählte Priorität: "));
    wirkt.appendChild(el("strong", MM.empfehlung.PRIORITAETEN[res.prioritaet]));
    wirkt.appendChild(document.createTextNode(". " + wirkung(res.prioritaet)));
    body.appendChild(wirkt);

    var wrap = el("div", null, "table-wrap");
    var t = el("table", null, "data-table kompakt");
    var kopf = el("thead"), kz = el("tr");
    ["Kriterium", "Gewichtung", "Kennwert für Material A"].forEach(function (h) { var th = el("th", h); th.setAttribute("scope", "col"); kz.appendChild(th); });
    kopf.appendChild(kz); t.appendChild(kopf);
    var kb = el("tbody");
    res.kriterien.forEach(function (k) {
      var tr = el("tr");
      tr.appendChild(el("td", k.name));
      tr.appendChild(el("td", k.gewicht + "×"));
      tr.appendChild(el("td", k.vorhanden ? "vorhanden" : "nicht verfügbar, Kriterium wird nicht bewertet"));
      kb.appendChild(tr);
    });
    t.appendChild(kb); wrap.appendChild(t); body.appendChild(wrap);

    var EIN = MM.einstellungen.hole(), F = EIN.prioritaetFaktor;
    [
      "1. Eignung: Es kommen nur Materialien infrage, die laut Datenbank für den gewählten Anwendungsbereich vorgesehen sind.",
      "2. Vergleichbarkeit: Kosten und CO₂ werden auf eine gemeinsame Basis gebracht (bei Dämmstoffen je gleicher Dämmwirkung R = 1 m²K/W, sonst je m³). " +
        "CO₂ wird nur verglichen, wenn Datensatztyp und Module zu Material A passen. Materialien ohne Schichtberechnung (z. B. Baustahl) werden nicht nach Volumen verglichen.",
      "3. Teilbewertung: Je Kriterium bekommt der beste Wert der Gruppe (Material A und alle Alternativen) die Bewertung 1 und der schlechteste 0. Niedriger ist besser.",
      "4. Gesamtbewertung: Die Teilbewertungen werden mit der Gewichtung gemittelt. Rechenbeispiel: Kosten 0,8 (Gewichtung " + F + "×) und CO₂ 0,4 (Gewichtung 1×) ergeben (" + F + " × 0,8 + 1 × 0,4) / (" + F + " + 1) = " + zahl2((F * 0.8 + 0.4) / (F + 1)) + ". Die Gesamtbewertung bestimmt die Reihenfolge.",
      "5. Nie allein wegen des Preises: Ein Material braucht mindestens zwei vergleichbare Kennwerte, davon einen ohne Preis. Gewicht und Wärmeleitfähigkeit zählen nur bei entsprechender Priorität bzw. bei Dämmstoffen.",
      "6. Unsicherheit: Beruht eine Empfehlung auf Beispieldaten, ist sie als „nicht belastbar“ gekennzeichnet.",
      "Einstellungen (änderbar in data/einstellungen.js): Das Prioritätskriterium zählt " + MM.einstellungen.faktorWort(F) + " (Faktor " + F + "). Unterschiede unter " + MM.einstellungen.prozentText(EIN.gleichSchwelle) + " gelten als praktisch gleich (neutrale Farbe, kein „besser“ oder „schlechter“). " +
        "Eine Alternative gilt als „besser“ oder „schlechter“ als Material A, wenn die Gesamtbewertung um mehr als " + zahl2(EIN.besserSchwelle) + " abweicht. Angezeigt werden höchstens " + EIN.maxEmpfehlungen + " Alternativen.",
      "Zur Einordnung: Die Bewertung ist relativ. Ein sehr teures oder sehr emissionsreiches Material in der Gruppe streckt die Skala, sodass kleinere Abstände der anderen dort klein wirken. " +
        "Maßgeblich sind deshalb die genannten Prozentwerte und Kennwerte, nicht die Reihenfolge allein."
    ].forEach(function (t2) { body.appendChild(el("p", t2, "note")); });
    d.appendChild(body);
    return d;
  }

  function nameVon(liste, id) {
    var x = MM.finde(liste, id);
    return x ? x.name : id;
  }

  function markeFuer(art) {
    if (!art || !MM.tabelle.ART[art]) return null;
    var m = el("span", MM.tabelle.ART[art].kurz, "art art-" + art);
    m.setAttribute("title", MM.tabelle.ART[art].text);
    m.setAttribute("role", "img");
    m.setAttribute("aria-label", MM.tabelle.ART[art].text);
    return m;
  }

  // ---------- Karte ----------

  var STUFEN = { nicht_belastbar: "Nicht belastbar", unvollstaendig: "Unvollständige Daten", orientierend: "Orientierend", belastbar: "Belastbar" };

  function abschnitt(titel) {
    var d = el("div", null, "card-list");
    d.appendChild(el("h4", titel));
    return d;
  }

  // Kompakte Karte (MaterialMatch 2.0): Name, Datenqualität, Vorteil, Nachteil, Kurzurteil, Knopf.
  // Alles Weitere steht eingeklappt unter „Warum wird dieses Material empfohlen?“.
  function karteBauen(e, bereitsGewaehlt, refId, bereichName) {
    var m = e.material;
    var karte = el("article", null, "card rec-card");
    karte.setAttribute("aria-label", "Empfehlung " + e.rang + ": " + m.name);
    karte.setAttribute("data-material", m.id);
    karte.setAttribute("data-rang", String(e.rang));

    var kopf = el("div", null, "card-head");
    kopf.appendChild(el("span", String(e.rang), "slot"));
    if (MM.materialbilder) kopf.appendChild(MM.materialbilder.element(m.id, { groesse: "klein" }));   // MaterialMatch 3.0
    kopf.appendChild(el("h3", m.name));
    var badge = el("span", STUFEN[e.belastbarkeit.stufe], "reliability-badge reliability-" + e.belastbarkeit.stufe);
    badge.setAttribute("title", e.belastbarkeit.text);
    kopf.appendChild(badge);
    karte.appendChild(kopf);

    [["Wichtigster Vorteil", e.vorteil], ["Möglicher Nachteil", e.nachteil]].forEach(function (z) {
      if (!z[1]) return;
      var p = el("p", null, "rec-point");
      p.appendChild(el("span", z[0], "label"));
      p.appendChild(document.createTextNode(z[1].text));
      var marke = markeFuer(z[1].art);
      if (marke) p.appendChild(marke);
      karte.appendChild(p);
    });

    // Kurze Begründung: der zusammenfassende Satz der Begründung aus js/empfehlung.js
    var kurz = (e.begruendung.match(/Insgesamt[^.]*\./) || [])[0];
    if (kurz) karte.appendChild(el("p", kurz, "rec-text"));

    // Warnungen zur Eignung (z. B. Brandverhalten) bleiben sichtbar
    if (e.hinweise.length) {
      var ul = el("ul", null, "rec-hinweise");
      e.hinweise.forEach(function (t) { ul.appendChild(el("li", t)); });
      karte.appendChild(ul);
    }

    var btn = el("button", bereitsGewaehlt ? "Bereits im Vergleich" : "Alternative vergleichen", "btn");
    btn.setAttribute("type", "button");
    btn.setAttribute("data-aktion", "vergleichen");
    if (bereitsGewaehlt) btn.disabled = true;
    else btn.addEventListener("click", function () { uebernehmen(m, refId); });
    karte.appendChild(btn);
    if (MM.steckbrief) karte.appendChild(MM.steckbrief.knopf(m.id));

    // ---- eingeklappt: Warum wird dieses Material empfohlen? ----
    var mehr = el("details", null, "card-mehr");
    mehr.appendChild(el("summary", "Warum wird dieses Material empfohlen?"));

    var eignung = abschnitt("Technische Eignung");
    eignung.appendChild(el("p", bereichName ? "Laut Datenbank für den Anwendungsbereich „" + bereichName + "“ vorgesehen." : "Anwendungsbereich laut Datenbank."));
    eignung.appendChild(el("p", m.produkt, "src-note"));
    mehr.appendChild(eignung);

    var kw = abschnitt("Relevante Kennwerte");
    var dl = el("dl", null, "card-facts");
    e.kennwerte.forEach(function (k) {
      dl.appendChild(el("dt", k.name));
      var dd = el("dd", k.text);
      var marke = markeFuer(k.art);
      if (marke) dd.appendChild(marke);
      dl.appendChild(dd);
    });
    kw.appendChild(dl);
    mehr.appendChild(kw);

    var vgl = abschnitt("Vergleich mit dem Ausgangsmaterial");
    // Der Eignungssatz steht schon oben unter „Technische Eignung“
    vgl.appendChild(el("p", e.begruendung.replace(/^Laut Datenbank[^.]*\.\s*/, ""), "rec-text"));
    mehr.appendChild(vgl);

    var tb = abschnitt("Bewertungsmethode");
    var tul = el("ul", null, "rec-scores");
    tul.appendChild(el("li", "Gesamtbewertung: " + zahl2(e.score) + " von 1 (gewichtetes Mittel)", "rec-total"));
    e.kriterien.forEach(function (k) {
      tul.appendChild(el("li", k.name + ": " + zahl2(k.score) + " · Gewichtung " + k.gewicht + "×"));
    });
    tb.appendChild(tul);
    tb.appendChild(el("p", "0 = schlechtester, 1 = bester Wert der Gruppe (relativ zu Material A und den anderen Alternativen). Ausführlich: „So wird bewertet“ unten.", "src-note"));
    mehr.appendChild(tb);

    var dq = abschnitt("Datenqualität");
    var rel = el("p", null, "reliability reliability-" + e.belastbarkeit.stufe);
    rel.appendChild(el("strong", STUFEN[e.belastbarkeit.stufe]));
    rel.appendChild(document.createTextNode(e.belastbarkeit.text.replace(/^[^:]+:\s*/, "")));
    dq.appendChild(rel);
    mehr.appendChild(dq);

    // Quellen: nur echte Quellen mit https-Link, Beispieldaten ausdrücklich ohne Quelle
    var q = abschnitt("Quellen");
    var qul = el("ul", null, "rec-sources");
    e.quellen.forEach(function (qu) {
      var li = el("li");
      var titel = qu.titel + (qu.datensatz_eigner ? " (" + qu.datensatz_eigner + ")" : "");
      if (/^https:\/\//.test(qu.url || "")) {
        var a = el("a", titel);
        a.setAttribute("href", qu.url);
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
        li.appendChild(a);
      } else {
        li.appendChild(document.createTextNode(titel));
      }
      li.appendChild(document.createTextNode(qu.abgerufen ? " (abgerufen " + qu.abgerufen + ")" : ""));
      qul.appendChild(li);
    });
    var ohneQuelle = e.kennwerte.filter(function (k) { return k.art === "beispiel" || (k.text !== "nicht verfügbar" && k.text !== "nicht anwendbar" && !k.quelle); })
      .map(function (k) { return k.name; });
    if (ohneQuelle.length) qul.appendChild(el("li", "Ohne Quelle (Beispieldaten): " + ohneQuelle.join(", "), "nosrc"));
    q.appendChild(qul);
    mehr.appendChild(q);

    karte.appendChild(mehr);
    return karte;
  }

  // ---------- Material in den Vergleich übernehmen ----------

  function uebernehmen(material, refId) {
    var ids = { a: "", b: "", c: "" };
    MM.auswahl.holeAuswahl().plaetze.forEach(function (p) { ids[p.buchstabe.toLowerCase()] = p.material.id; });
    if (ids.a === material.id || ids.b === material.id || ids.c === material.id) return;

    var platz = ["b", "c"].filter(function (k) { return !ids[k]; })[0];
    if (!platz) platz = ["c", "b"].filter(function (k) { return ids[k] !== refId; })[0];   // ersetzt nie Material A
    var ersetzt = ids[platz] ? nameVon(daten.baustoffe, ids[platz]) : null;
    ids[platz] = material.id;
    bestaetigung = "„" + material.name + "“ wurde als Material " + platz.toUpperCase() + " in den Vergleich übernommen" +
      (ersetzt ? " und hat „" + ersetzt + "“ ersetzt" : "") + ". Der Vergleich ist aktualisiert.";
    MM.auswahl.setzeAuswahl(ids);
    // Mit den Hauptreitern (MaterialMatch 2.0): zum Reiter „Vergleich“ wechseln, damit das Ergebnis sichtbar wird
    if (MM.reiter) MM.reiter.zeige("vergleich");
    var ziel = document.getElementById("dashboard");
    if (ziel && ziel.scrollIntoView) ziel.scrollIntoView();
  }

  // ---------- Gesamtdarstellung ----------

  function render() {
    if (!box) return;
    // Geöffnete Bereiche merken, damit sie beim Neuzeichnen offen bleiben
    var offen = {};
    [].forEach.call(box.querySelectorAll("details[data-key]"), function (d) { offen[d.getAttribute("data-key")] = d.open; });
    box.textContent = "";
    var plaetze = MM.auswahl.holeAuswahl().plaetze;
    var refPlatz = referenzPlatz(plaetze);
    var ref = refPlatz ? refPlatz.material : null;
    bereichsfeldFuellen(ref);

    var res = MM.empfehlung.empfehle(daten, ref ? ref.id : null, select.value || null, prioritaet(), ref);

    if (bestaetigung) { box.appendChild(el("p", bestaetigung, "rec-confirm")); bestaetigung = ""; }

    if (!ref) {
      box.appendChild(el("div", res.meldung, "empty-state"));
      box.appendChild(el("p", "Empfehlungen sind regelbasiert und ein Hilfsmittel für frühe Entwurfsentscheidungen.", "note"));
      return;
    }

    var kopf = el("p", null, "rec-meta");
    kopf.appendChild(document.createTextNode("Ausgangsmaterial: "));
    kopf.appendChild(el("strong", "Material " + refPlatz.buchstabe + " (" + ref.name + ")"));
    kopf.appendChild(document.createTextNode(" · Anwendungsbereich: "));
    kopf.appendChild(el("strong", res.bereich ? nameVon(daten.anwendungsbereiche, res.bereich) : "–"));
    kopf.appendChild(document.createTextNode(" · "));
    var prio = el("span", null, "rec-prio");
    prio.appendChild(document.createTextNode("Priorität: "));
    prio.appendChild(el("strong", MM.empfehlung.PRIORITAETEN[res.prioritaet]));
    kopf.appendChild(prio);
    // Die Priorität wird im Reiter „Vergleich“ gewählt (nur dort, damit es keine widersprüchlichen Zustände gibt)
    var aendern = el("button", "ändern", "btn-link");
    aendern.setAttribute("type", "button");
    aendern.setAttribute("aria-label", "Priorität im Reiter Vergleich ändern");
    aendern.addEventListener("click", function () {
      if (MM.reiter) MM.reiter.zeige("vergleich");
      var f = document.getElementById("prioritaet");
      if (f) f.focus();
    });
    prio.appendChild(document.createTextNode(" "));
    prio.appendChild(aendern);
    box.appendChild(kopf);

    if (res.meldung) {
      box.appendChild(el("div", res.meldung, "empty-state"));
    } else {
      var raster = el("div", null, "cards");
      var gewaehlt = plaetze.map(function (p) { return p.material.id; });
      var bereichName = res.bereich ? nameVon(daten.anwendungsbereiche, res.bereich) : "";
      res.empfehlungen.forEach(function (e) { raster.appendChild(karteBauen(e, gewaehlt.indexOf(e.material.id) !== -1, ref.id, bereichName)); });
      box.appendChild(raster);
    }

    // Kriterien, die in die Bewertung einfließen
    var kritText = res.kriterien.map(function (k) {
      return k.name + (k.vorhanden ? "" : " (für Material A nicht verfügbar, nicht bewertet)") + (k.gewicht > 1 && k.vorhanden ? " – hohe Gewichtung" : "");
    });
    if (kritText.length) box.appendChild(el("p", "Bewertete Kriterien: " + kritText.join("; ") + ".", "note"));

    // Geprüft, aber nicht empfohlen
    if (res.nichtEmpfohlen.length) {
      var d = el("details", null, "sub");
      d.setAttribute("data-key", "nicht-empfohlen");
      d.open = offen["nicht-empfohlen"] === true;
      d.appendChild(el("summary", "Geprüft, aber nicht empfohlen (" + res.nichtEmpfohlen.length + ")"));
      var inhalt = el("div", null, "sub-body");
      var ul = el("ul", null, "rec-list");
      res.nichtEmpfohlen.forEach(function (n) {
        var li = el("li");
        li.appendChild(el("strong", n.material.name));
        li.appendChild(document.createTextNode(": " + n.grund));
        ul.appendChild(li);
      });
      inhalt.appendChild(ul);
      d.appendChild(inhalt);
      box.appendChild(d);
    }

    // Bewertungsmethode, abhängig von der Priorität
    offenMerker = offen;
    box.appendChild(methodeBauen(res));

    box.appendChild(el("p", "Die Empfehlungen sind regelbasiert und ein Hilfsmittel für frühe Entwurfsentscheidungen. " +
      "Sie treffen keine Aussage zu bauaufsichtlichen Zulassungen, technischer Gleichwertigkeit oder Normkonformität und ersetzen keine Nachweise " +
      "(Tragwerk, Bauphysik, Brandschutz). Brandverhalten und Druckfestigkeit werden nicht bewertet.", "note"));
  }

  MM.alternativen = {
    init: function (baustoffdaten) {
      daten = baustoffdaten;
      box = document.getElementById("alternativen-inhalt");
      select = document.getElementById("anwendung");
      if (!box || !select) return;
      select.addEventListener("change", render);
      document.addEventListener("mm:auswahl", render);
      document.addEventListener("mm:prioritaet", render);
      render();
    },
    // Kurzwege zur zentralen Priorität (js/prioritaet.js)
    setzePrioritaet: function (p) { MM.prioritaet.setzen(p); },
    holePrioritaet: function () { return prioritaet(); }
  };

})(typeof window !== "undefined" ? window : globalThis);
