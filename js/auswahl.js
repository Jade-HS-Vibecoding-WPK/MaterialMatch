/* ==========================================================================
   MaterialMatch – Materialauswahl (Schritt 3) und Produktwahl
   --------------------------------------------------------------------------
   Verwaltet die Auswahl von Kategorie, Material A, B, C und je Material das Produkt.
   Der "Merkzettel" (zustand) enthält immer den aktuellen Stand.
   Bei jeder Änderung sendet dieses Programm die Nachricht "mm:auswahl".
   Spätere Programmteile (Berechnung, Tabelle, Diagramme) hören auf diese
   Nachricht und aktualisieren sich dann selbst.

   Produkte: Zu jedem Material kann ein konkretes Produkt (Hersteller, Datenblatt)
   oder der generische Materialdatensatz gewählt werden (js/produkte.js). Dasselbe
   Material darf mehrfach gewählt werden, wenn die Produkte verschieden sind.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var el = MM.el;

  var daten = null;
  var zustand = { kategorie: "", a: "", b: "", c: "", pa: "", pb: "", pc: "" };   // pa/pb/pc: Produkt ("" = Standardprodukt)
  var felder = {};      // die Auswahlfelder der Seite
  var kartenBox = null; // Bereich für die Materialkarten

  // Die drei Plätze für Materialien
  var PLAETZE = [
    { schluessel: "a", feldId: "materialA", produktFeldId: "produktA", buchstabe: "A" },
    { schluessel: "b", feldId: "materialB", produktFeldId: "produktB", buchstabe: "B" },
    { schluessel: "c", feldId: "materialC", produktFeldId: "produktC", buchstabe: "C" }
  ];

  function material(id) { return MM.finde(daten.baustoffe, id); }
  function produktSchluessel(p) { return "p" + p.schluessel; }

  function gewaehlteIds() {
    return PLAETZE.map(function (p) { return zustand[p.schluessel]; }).filter(Boolean);
  }

  // ---------- Produkte ----------

  // Alle wählbaren Produkt-IDs eines Materials (Katalog, eigene, generisch)
  function optionenIds(materialId) {
    return MM.produkte.liste(materialId).map(function (p) { return p.id; }).concat([MM.produkte.GENERISCH]);
  }

  // Welche Produkte desselben Materials sind in den ANDEREN Plätzen schon gewählt?
  function belegteProdukte(materialId, platz) {
    var b = [];
    PLAETZE.forEach(function (p) {
      if (p.schluessel === platz.schluessel || zustand[p.schluessel] !== materialId) return;
      b.push(MM.produkte.aufloesen(materialId, zustand[produktSchluessel(p)]));
    });
    return b;
  }

  // Erstes noch freie Produkt (das Standardprodukt zuerst); "" = Standardprodukt
  function ersteFreie(materialId, platz) {
    var belegt = belegteProdukte(materialId, platz);
    var std = MM.produkte.aufloesen(materialId, "");
    if (belegt.indexOf(std) === -1) return "";
    var ids = optionenIds(materialId);
    for (var i = 0; i < ids.length; i++) if (belegt.indexOf(ids[i]) === -1) return ids[i];
    return null;
  }

  // Dasselbe Produkt desselben Materials nie doppelt: spätere Plätze bekommen ein freies Produkt oder werden geleert
  function entdoppeln() {
    PLAETZE.forEach(function (p) {
      var mid = zustand[p.schluessel];
      if (!mid) return;
      var belegt = belegteProdukte(mid, p);
      var mein = MM.produkte.aufloesen(mid, zustand[produktSchluessel(p)]);
      // nur frühere Plätze zählen als Vorrang
      var frueher = [];
      for (var i = 0; i < PLAETZE.length; i++) {
        if (PLAETZE[i].schluessel === p.schluessel) break;
        if (zustand[PLAETZE[i].schluessel] === mid) frueher.push(MM.produkte.aufloesen(mid, zustand[produktSchluessel(PLAETZE[i])]));
      }
      if (frueher.indexOf(mein) !== -1) {
        var frei = ersteFreie(mid, p);
        if (frei === null) { zustand[p.schluessel] = ""; zustand[produktSchluessel(p)] = ""; } else zustand[produktSchluessel(p)] = frei;
      }
      void belegt;
    });
  }

  // Die gewählten Materialien mit den Werten des gewählten Produkts. Kommt ein Material mehrfach vor,
  // bekommt jedes den Produktnamen im Namen, damit Tabellen und Diagramme sie unterscheiden.
  function wirksamePlaetze() {
    var liste = PLAETZE.filter(function (p) { return zustand[p.schluessel]; }).map(function (p) {
      var m = MM.produkte.wirksam(zustand[p.schluessel], zustand[produktSchluessel(p)]);
      return { buchstabe: p.buchstabe, material: m, produkt: m.produktAktiv, schluessel: p.schluessel };
    });
    var zaehler = {};
    liste.forEach(function (x) { zaehler[x.material.id] = (zaehler[x.material.id] || 0) + 1; });
    liste.forEach(function (x) {
      if (zaehler[x.material.id] > 1) {
        var kopie = {};
        Object.keys(x.material).forEach(function (k) { kopie[k] = x.material[k]; });
        kopie.name = x.material.name + " – " + x.produkt.name;
        x.material = kopie;
      }
    });
    return liste;
  }

  // ---------- Auswahlfelder befüllen ----------

  function kategorieFeldFuellen() {
    var sel = felder.kategorie;
    sel.textContent = "";
    var leer = el("option", "Kategorie wählen …");
    leer.value = "";
    sel.appendChild(leer);
    daten.kategorien.forEach(function (k) {
      var o = el("option", k.kuerzel + " – " + k.name);
      o.value = k.id;
      sel.appendChild(o);
    });
    sel.value = zustand.kategorie;
    sel.disabled = false;
  }

  function materialFeldFuellen(platz) {
    var sel = felder[platz.schluessel];
    var liste = daten.baustoffe.filter(function (m) {
      return m.kategorien.indexOf(zustand.kategorie) !== -1;
    });
    // Materialien aus anderen Kategorien (z. B. aus einer Empfehlung) bleiben auswählbar
    gewaehlteIds().forEach(function (id) {
      if (!liste.some(function (m) { return m.id === id; })) liste.push(material(id));
    });

    sel.textContent = "";
    var leer = el("option", platz.schluessel === "c" ? "Kein drittes Material" : "Material wählen …");
    leer.value = "";
    sel.appendChild(leer);

    liste.forEach(function (m) {
      var beschriftung = m.name;
      if (m.kategorien.indexOf(zustand.kategorie) === -1) {
        beschriftung += " (" + MM.namenAusIds(m.kategorien, daten.kategorien) + ")";
      }
      var o = el("option", beschriftung);
      o.value = m.id;
      // Ein Material kann nur dann ein zweites Mal gewählt werden, wenn noch ein anderes Produkt frei ist
      var verwendet = belegteProdukte(m.id, platz).length;
      var belegt = zustand[platz.schluessel] !== m.id && verwendet >= optionenIds(m.id).length;
      if (belegt) {
        o.disabled = true;
        o.textContent = beschriftung + " – bereits gewählt";
      }
      sel.appendChild(o);
    });

    sel.value = zustand[platz.schluessel];
    sel.disabled = !zustand.kategorie;
  }

  function produktFeldFuellen(platz) {
    var sel = felder[produktSchluessel(platz)];
    if (!sel) return;
    var mid = zustand[platz.schluessel];
    sel.textContent = "";
    if (!mid) {
      var kein = el("option", "Zuerst ein Material wählen");
      kein.value = "";
      sel.appendChild(kein);
      sel.disabled = true;
      return;
    }
    var belegt = belegteProdukte(mid, platz);
    MM.produkte.liste(mid).forEach(function (p) {
      var o = el("option", p.name + " (" + p.hersteller + ")" + (p.eigen ? " – eigenes Produkt" : ""));
      o.value = p.id;
      if (belegt.indexOf(p.id) !== -1) { o.disabled = true; o.textContent += " – bereits gewählt"; }
      sel.appendChild(o);
    });
    var g = el("option", "Generischer Materialdatensatz (kein konkretes Produkt)");
    g.value = MM.produkte.GENERISCH;
    if (belegt.indexOf(MM.produkte.GENERISCH) !== -1) { g.disabled = true; g.textContent += " – bereits gewählt"; }
    sel.appendChild(g);
    sel.value = MM.produkte.aufloesen(mid, zustand[produktSchluessel(platz)]);
    sel.disabled = false;
  }

  // ---------- Karten ----------

  function liste(titel, eintraege) {
    var box = el("div", null, "card-list");
    box.appendChild(el("h4", titel));
    var ul = el("ul");
    eintraege.forEach(function (t) { ul.appendChild(el("li", t)); });
    box.appendChild(ul);
    return box;
  }

  function quellenLink(id) {
    var q = id ? MM.quellen.finde(id) : null;
    if (!q) return null;
    var b = MM.quellen.beschreibe(q);
    if (b.url) {
      var a = el("a", b.titel);
      a.setAttribute("href", b.url);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
      return a;
    }
    return document.createTextNode(b.titel);
  }

  // Kleine Kennzeichnung der Datenqualität (MaterialMatch 2.0): Beispieldaten fallen auf, sonst „Richtwerte“ usw.
  function datenbadge(m) {
    var arten = {};
    Object.keys(m.eigenschaften).forEach(function (k) { var a = m.eigenschaften[k].art; if (a) arten[a] = true; });
    var text, klasse;
    if (arten.beispiel) { text = "Beispieldaten"; klasse = "datenbadge art-beispiel"; }
    else if (arten.eigen) { text = "Eigene Angabe"; klasse = "datenbadge art-eigen"; }
    else if (arten.richtwert) { text = "Richtwerte"; klasse = "datenbadge"; }
    else if (arten.verifiziert) { text = "Verifiziert"; klasse = "datenbadge art-verifiziert"; }
    else { text = "Keine Kennwerte"; klasse = "datenbadge"; }
    var b = el("span", text, klasse);
    b.setAttribute("title", "Datenart: " + MM.datenartenText(m));
    return b;
  }

  function karteBauen(platz, m) {
    var karte = el("article", null, "card");
    karte.setAttribute("aria-label", "Material " + platz.buchstabe + ": " + m.name);
    var pa = m.produktAktiv || { generisch: true, name: "Generischer Materialdatensatz" };

    var kopf = el("div", null, "card-head");
    kopf.appendChild(el("span", platz.buchstabe, "slot"));
    if (MM.materialbilder) kopf.appendChild(MM.materialbilder.element(m.id, { groesse: "klein" }));   // MaterialMatch 3.0: Illustration
    kopf.appendChild(el("h3", m.name));
    kopf.appendChild(datenbadge(m));
    karte.appendChild(kopf);
    // Eine Zeile: Kategorie, bei einem konkreten Produkt zusätzlich der Produktname
    karte.appendChild(el("p", MM.namenAusIds(m.kategorien, daten.kategorien) + (pa.generisch ? "" : " · " + pa.name), "card-sub"));

    // Alles Weitere ist eingeklappt
    var mehr = el("details", null, "card-mehr");
    mehr.appendChild(el("summary", "Details"));
    var dl = el("dl", null, "card-facts");
    var zeilen = [
      ["Einsatz", MM.namenAusIds(m.anwendungen, daten.anwendungsbereiche)],
      ["Datenart", MM.datenartenText(m)]
    ];
    zeilen.forEach(function (zeile) {
      dl.appendChild(el("dt", zeile[0]));
      dl.appendChild(el("dd", zeile[1]));
    });
    // Produktangaben: Hersteller und Quelle des Produkts
    dl.appendChild(el("dt", "Produkt"));
    dl.appendChild(el("dd", pa.generisch ? "Generischer Materialdatensatz (kein konkretes Produkt)" : pa.name + (pa.eigen ? " (eigenes Produkt, nicht geprüft)" : "")));
    if (!pa.generisch) {
      dl.appendChild(el("dt", "Hersteller"));
      dl.appendChild(el("dd", pa.hersteller));
      (pa.herstellerangaben || []).forEach(function (h) {
        dl.appendChild(el("dt", "Herstellerangabe"));
        var dh = el("dd");
        dh.appendChild(document.createTextNode(h.bezeichnung + ": " + h.wert + " " + h.einheit + ". " + h.hinweis + " Quelle: "));
        var ql = quellenLink(h.quelle);
        if (ql) dh.appendChild(ql);
        dh.classList.add("herstellerangabe");
        dl.appendChild(dh);
      });
      var qa = quellenLink(pa.datenblatt);
      if (qa) {
        dl.appendChild(el("dt", "Produktquelle"));
        var dd = el("dd");
        dd.appendChild(qa);
        dl.appendChild(dd);
      }
    }
    mehr.appendChild(dl);

    if (m.vorteile && m.vorteile.length) mehr.appendChild(liste("Vorteile", m.vorteile));
    if (m.nachteile && m.nachteile.length) mehr.appendChild(liste("Nachteile", m.nachteile));
    karte.appendChild(mehr);
    // MaterialMatch 3.5: Steckbrief und „Entfernen“ nebeneinander; Entfernen räumt nur diesen Platz, die anderen Materialien bleiben
    var aktionen = el("div", null, "card-aktionen");
    if (MM.steckbrief) aktionen.appendChild(MM.steckbrief.knopf(m.id, zustand[produktSchluessel(platz)]));
    var weg = el("button", "Entfernen", "btn-link card-entfernen");
    weg.type = "button";
    weg.setAttribute("aria-label", "Material " + platz.buchstabe + " entfernen: " + m.name);
    weg.addEventListener("click", function () { var neu = {}; neu[platz.schluessel] = ""; MM.auswahl.setzeAuswahl(neu); });
    aktionen.appendChild(weg);
    karte.appendChild(aktionen);

    // Hinweis zur Mengenberechnung bleibt sichtbar (betrifft die Berechnung)
    if (m.mengenmodell === "keine_schicht") {
      karte.appendChild(el("p", m.mengenhinweis, "card-note"));
    }
    return karte;
  }

  // Haben alle gewählten Materialien mindestens einen gemeinsamen Anwendungsbereich?
  function gemeinsamerBereich(materialien) {
    return materialien[0].anwendungen.some(function (a) {
      return materialien.every(function (m) { return m.anwendungen.indexOf(a) !== -1; });
    });
  }

  function kartenZeichnen() {
    kartenBox.textContent = "";
    var gewaehlt = wirksamePlaetze().map(function (x) {
      return { platz: PLAETZE.filter(function (p) { return p.schluessel === x.schluessel; })[0], m: x.material };
    });

    if (!zustand.kategorie) {
      kartenBox.appendChild(el("div", "Wähle zuerst eine Baustoffkategorie.", "empty-state"));
      return;
    }
    if (gewaehlt.length < 2) {
      kartenBox.appendChild(el("div",
        "Wähle Material A und Material B.",
        "empty-state"));
    }
    if (gewaehlt.length >= 2 && !gemeinsamerBereich(gewaehlt.map(function (x) { return x.m; }))) {
      kartenBox.appendChild(el("p",
        "Hinweis: Die gewählten Materialien haben in der Datenbank keinen gemeinsamen Anwendungsbereich. " +
        "Sie erfüllen vermutlich unterschiedliche Funktionen, ein direkter Vergleich ist nur eingeschränkt aussagekräftig.",
        "warn"));
    }
    if (gewaehlt.length) {
      var raster = el("div", null, "cards");
      gewaehlt.forEach(function (x) { raster.appendChild(karteBauen(x.platz, x.m)); });
      kartenBox.appendChild(raster);
    }
  }

  // ---------- Gesamtdarstellung und Benachrichtigung ----------

  function zeichnen() {
    felder.kategorie.value = zustand.kategorie;
    PLAETZE.forEach(materialFeldFuellen);
    PLAETZE.forEach(produktFeldFuellen);
    kartenZeichnen();
  }

  function benachrichtigen() {
    document.dispatchEvent(new CustomEvent("mm:auswahl", { detail: MM.auswahl.holeAuswahl() }));
  }

  // ---------- Öffentliche Funktionen ----------

  MM.auswahl = {

    // Haben alle übergebenen Baustoffe mindestens einen gemeinsamen Anwendungsbereich?
    // (Voraussetzung dafür, Kosten und CO₂ überhaupt farbig zu bewerten.)
    gemeinsamerBereich: function (materialien) {
      return materialien.length < 2 || gemeinsamerBereich(materialien);
    },

    // Liefert den aktuellen Stand: Kategorie und die gewählten Baustoffe (A, B, optional C)
    // "plaetze" behält die Buchstaben bei: Ist nur B gewählt, bleibt es Material B.
    // Jeder Platz enthält das Material mit den Werten des gewählten Produkts und die Produktangaben.
    holeAuswahl: function () {
      var plaetze = wirksamePlaetze();
      return {
        kategorie: zustand.kategorie,
        materialien: plaetze.map(function (p) { return p.material; }),
        plaetze: plaetze.map(function (p) { return { buchstabe: p.buchstabe, material: p.material, produkt: p.produkt }; })
      };
    },

    // Setzt die Auswahl von außen, z. B. durch "Alternative vergleichen" (Schritt 8).
    // Beispiel: MM.auswahl.setzeAuswahl({ a: "steinwolle", b: "eps", c: "" })
    // Optional je Platz das Produkt: pa, pb, pc (Produkt-ID oder "generisch"); ohne Angabe gilt das Standardprodukt.
    setzeAuswahl: function (neu) {
      ["a", "b", "c"].forEach(function (k) {
        if (neu[k] !== undefined) {
          zustand[k] = neu[k] && material(neu[k]) ? neu[k] : "";
          zustand["p" + k] = neu["p" + k] !== undefined ? neu["p" + k] : "";
        } else if (neu["p" + k] !== undefined) {
          zustand["p" + k] = neu["p" + k];
        }
      });
      entdoppeln();
      // Passende Kategorie wählen, falls noch keine gewählt oder Material A nicht hineinpasst
      var erstes = material(zustand.a) || material(zustand.b) || material(zustand.c);
      var a = material(zustand.a);
      if (erstes && (!zustand.kategorie || (a && a.kategorien.indexOf(zustand.kategorie) === -1))) {
        zustand.kategorie = erstes.kategorien[0];
      }
      zeichnen();
      benachrichtigen();
    },

    init: function (baustoffdaten) {
      daten = baustoffdaten;
      felder.kategorie = document.getElementById("kategorie");
      PLAETZE.forEach(function (p) {
        felder[p.schluessel] = document.getElementById(p.feldId);
        felder[produktSchluessel(p)] = document.getElementById(p.produktFeldId);
      });
      kartenBox = document.getElementById("auswahl-karten");
      if (!felder.kategorie || !kartenBox) return;

      kategorieFeldFuellen();

      // Kategoriewechsel: Auswahl zurücksetzen
      felder.kategorie.addEventListener("change", function () {
        zustand.kategorie = felder.kategorie.value;
        zustand.a = zustand.b = zustand.c = "";
        zustand.pa = zustand.pb = zustand.pc = "";
        zeichnen();
        benachrichtigen();
      });

      // Materialwechsel: das Produkt wird zurückgesetzt (Standardprodukt oder ein noch freies Produkt)
      PLAETZE.forEach(function (p) {
        felder[p.schluessel].addEventListener("change", function () {
          zustand[p.schluessel] = felder[p.schluessel].value;
          zustand[produktSchluessel(p)] = "";
          if (zustand[p.schluessel]) {
            var frei = ersteFreie(zustand[p.schluessel], p);
            if (frei === null) zustand[p.schluessel] = ""; else zustand[produktSchluessel(p)] = frei;
          }
          zeichnen();
          benachrichtigen();
        });
        if (felder[produktSchluessel(p)]) {
          felder[produktSchluessel(p)].addEventListener("change", function () {
            zustand[produktSchluessel(p)] = felder[produktSchluessel(p)].value;
            zeichnen();
            benachrichtigen();
          });
        }
      });

      document.addEventListener("mm:daten", kartenZeichnen);
      // Eigene Produkte hinzugefügt oder gelöscht: Auswahllisten und Anzeigen aktualisieren
      document.addEventListener("mm:produkte", function () {
        PLAETZE.forEach(function (p) {
          var mid = zustand[p.schluessel];
          if (mid && zustand[produktSchluessel(p)] && MM.produkte.aufloesen(mid, zustand[produktSchluessel(p)]) !== zustand[produktSchluessel(p)]) zustand[produktSchluessel(p)] = "";
        });
        zeichnen();
        benachrichtigen();
      });
      zeichnen();
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
