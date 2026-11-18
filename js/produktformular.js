/* ==========================================================================
   MaterialMatch – Formular „Eigenes Produkt ergänzen“
   --------------------------------------------------------------------------
   Nutzer:innen können zu einem Material ein eigenes Produkt anlegen (Name, Hersteller,
   Quelle und beliebige Kennwerte, dazu optional einen Preis mit Händler, Link und
   Abrufdatum). Die Angaben bekommen die Datenart „E“ (eigene Angabe, nicht geprüft) und
   werden nur in diesem Browser gespeichert (localStorage). Die Prüfung der Eingaben
   steckt in js/produkte.js (MM.produkte.eigenesErgaenzen).
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var el = MM.el;
  var daten = null;
  var box = null;
  var f = {};          // Eingabefelder
  var meldung = null;  // Rückmeldung (role="status")
  var fehlerBox = null;
  var listeBox = null;

  var FELDER = [
    ["waermeleitfaehigkeit", "Nennwert λD (W/(m·K))", "z. B. 0,036"],
    ["waermeleitfaehigkeit_bemessung", "Bemessungswert λB (W/(m·K))", "z. B. 0,038"],
    ["wasserdampf_mu", "Diffusionswiderstandszahl μ (–)", "z. B. 2"],
    ["waermekapazitaet", "Wärmekapazität (J/(kg·K))", "z. B. 2100"],
    ["rohdichte", "Rohdichte (kg/m³)", "z. B. 50"],
    ["druckfestigkeit", "Druckfestigkeit (N/mm²)", "z. B. 25"]
  ];

  function feld(id, beschriftung, art, platzhalter, hilfe) {
    var wrap = el("div", null, "field");
    var l = el("label", beschriftung);
    l.setAttribute("for", id);
    wrap.appendChild(l);
    var inp = el("input");
    inp.id = id;
    inp.type = art || "text";
    if (art !== "date") { inp.setAttribute("autocomplete", "off"); }
    if (platzhalter) inp.setAttribute("placeholder", platzhalter);
    if (hilfe) { var h = el("p", hilfe, "note"); h.id = id + "-hilfe"; inp.setAttribute("aria-describedby", h.id); wrap.appendChild(inp); wrap.appendChild(h); }
    else wrap.appendChild(inp);
    f[id] = inp;
    return wrap;
  }

  function auswahlFeld(id, beschriftung, optionen) {
    var wrap = el("div", null, "field");
    var l = el("label", beschriftung);
    l.setAttribute("for", id);
    wrap.appendChild(l);
    var s = el("select");
    s.id = id;
    optionen.forEach(function (o) { var op = el("option", o[1]); op.value = o[0]; s.appendChild(op); });
    wrap.appendChild(s);
    f[id] = s;
    return wrap;
  }

  function heute() {
    var d = new Date();
    function z(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
  }

  function listeZeichnen() {
    listeBox.textContent = "";
    var eig = MM.produkte.eigene();
    if (!eig.length) { listeBox.appendChild(el("p", "Noch keine eigenen Produkte.", "note")); return; }
    var ul = el("ul", null, "eigene-liste");
    eig.forEach(function (p) {
      var m = MM.finde(daten.baustoffe, p.material);
      var li = el("li");
      li.appendChild(document.createTextNode(p.name + " (" + p.hersteller + ") – " + (m ? m.name : p.material) + " "));
      var b = el("button", "Löschen", "btn-link");
      b.type = "button";
      b.setAttribute("aria-label", "Eigenes Produkt " + p.name + " löschen");
      b.addEventListener("click", function () { MM.produkte.eigenesLoeschen(p.id); });
      li.appendChild(b);
      ul.appendChild(li);
    });
    listeBox.appendChild(ul);
  }

  function absenden() {
    fehlerBox.textContent = "";
    meldung.textContent = "";
    var werte = {};
    FELDER.forEach(function (x) { werte[x[0]] = f["ep-" + x[0]].value; });
    werte.brandverhalten = f["ep-brandverhalten"].value;
    werte.preis = { wert: f["ep-preis"].value, einheit: f["ep-preis-einheit"].value, mwst: f["ep-mwst"].value, umfang: f["ep-umfang"].value };
    var r = MM.produkte.eigenesErgaenzen({
      material: f["ep-material"].value, name: f["ep-name"].value, hersteller: f["ep-hersteller"].value,
      quelle: { titel: f["ep-quelle"].value, url: f["ep-link"].value, haendler: f["ep-haendler"].value, abgerufen: f["ep-datum"].value },
      werte: werte
    });
    if (!r.ok) {
      var ul = el("ul");
      r.fehler.forEach(function (t) { ul.appendChild(el("li", t)); });
      fehlerBox.appendChild(el("p", "Bitte korrigieren Sie die folgenden Angaben:", "warn"));
      fehlerBox.appendChild(ul);
      return;
    }
    meldung.textContent = "Eigenes Produkt „" + r.produkt.name + "“ gespeichert" + (r.gespeichert ? " (nur in diesem Browser)." : ", aber der Browser erlaubt kein dauerhaftes Speichern: Es gilt nur bis die Seite geschlossen wird.");
    ["ep-name", "ep-hersteller", "ep-quelle", "ep-link", "ep-haendler", "ep-preis"].forEach(function (k) { f[k].value = ""; });
    FELDER.forEach(function (x) { f["ep-" + x[0]].value = ""; });
    f["ep-brandverhalten"].value = "";
  }

  MM.produktformular = {
    init: function (d) {
      daten = d;
      box = document.getElementById("eigenes-produkt-box");
      if (!box) return;
      box.appendChild(el("p", "Eigene Angaben (z. B. aus einem Datenblatt oder Angebot) werden mit „E“ gekennzeichnet. Sie sind nicht geprüft und nur in diesem Browser gespeichert. " +
        "Jeder Wert braucht eine Quelle; ein Preis zusätzlich Händler, Einheit, Mehrwertsteuer und Leistungsumfang.", "note"));

      var form = el("form");
      form.setAttribute("novalidate", "novalidate");
      form.addEventListener("submit", function (e) { e.preventDefault(); absenden(); });

      var g1 = el("div", null, "grid-2");
      g1.appendChild(auswahlFeld("ep-material", "Material", [["", "Material wählen …"]].concat(d.baustoffe.map(function (m) { return [m.id, m.name]; }))));
      g1.appendChild(feld("ep-name", "Produktname", "text", "z. B. Muster-Dämmplatte 035"));
      g1.appendChild(feld("ep-hersteller", "Hersteller", "text", "z. B. Muster GmbH"));
      form.appendChild(g1);

      form.appendChild(el("h3", "Quelle"));
      var g2 = el("div", null, "grid-2");
      g2.appendChild(feld("ep-quelle", "Titel der Quelle", "text", "z. B. Technisches Datenblatt, Ausgabe 03/2026"));
      g2.appendChild(feld("ep-link", "Link (https://…)", "text", "https://…"));
      g2.appendChild(feld("ep-datum", "Abrufdatum (JJJJ-MM-TT)", "text", "z. B. 2026-11-16"));
      f["ep-datum"].value = heute();
      form.appendChild(g2);

      form.appendChild(el("h3", "Kennwerte (alle optional)"));
      var g3 = el("div", null, "grid-3");
      FELDER.forEach(function (x) { g3.appendChild(feld("ep-" + x[0], x[1], "text", x[2])); });
      g3.appendChild(auswahlFeld("ep-brandverhalten", "Brandverhalten (Euroklasse)", [["", "keine Angabe"]].concat(MM.produkte.BRANDKLASSEN.map(function (b) { return [b, b]; }))));
      form.appendChild(g3);

      form.appendChild(el("h3", "Preis (optional)"));
      var g4 = el("div", null, "grid-3");
      g4.appendChild(feld("ep-preis", "Preis (€)", "text", "z. B. 112,88"));
      g4.appendChild(auswahlFeld("ep-preis-einheit", "Einheit", [["€/m³", "€ je m³"], ["€/m²", "€ je m²"], ["€/kg", "€ je kg"]]));
      g4.appendChild(feld("ep-haendler", "Händler", "text", "z. B. OBI"));
      g4.appendChild(auswahlFeld("ep-mwst", "Mehrwertsteuer", [["unbekannt", "unbekannt"], ["inkl. 19 % MwSt.", "inkl. 19 % MwSt."], ["exkl. MwSt.", "exkl. MwSt."]]));
      g4.appendChild(auswahlFeld("ep-umfang", "Leistungsumfang", [["unbekannt", "unbekannt"], ["Material, Händlerpreis (ohne Transport und Einbau)", "Material, Händlerpreis (ohne Transport und Einbau)"], ["Material inkl. Einbau", "Material inkl. Einbau"]]));
      form.appendChild(g4);
      form.appendChild(el("p", "Preise werden nur verglichen, wenn Einheit, Mehrwertsteuer und Leistungsumfang übereinstimmen; sonst erscheint ein Vorbehalt.", "note"));

      fehlerBox = el("div");
      fehlerBox.setAttribute("role", "alert");
      form.appendChild(fehlerBox);
      var knopf = el("button", "Eigenes Produkt speichern", "btn");
      knopf.type = "submit";
      form.appendChild(knopf);
      box.appendChild(form);

      meldung = el("p", null, "note");
      meldung.setAttribute("role", "status");
      box.appendChild(meldung);
      box.appendChild(el("h3", "Ihre eigenen Produkte"));
      listeBox = el("div");
      box.appendChild(listeBox);
      listeZeichnen();
      document.addEventListener("mm:produkte", listeZeichnen);
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
