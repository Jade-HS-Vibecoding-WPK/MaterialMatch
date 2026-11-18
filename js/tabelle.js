/* ==========================================================================
   MaterialMatch – gemeinsamer Tabellenbauer für alle Vergleichstabellen
   --------------------------------------------------------------------------
   Eine Tabelle zeigt die gewählten Materialien (A, B, C) als Spalten und
   Kennwerte als Zeilen. Damit sehen alle Tabellen gleich aus.

   MM.tabelle.bauen({ plaetze, zeilen, ausrichtung })
     plaetze:     [{ buchstabe: "A", material: {...} }, ...]
     zeilen:      [{ titel: "Rohdichte (kg/m³)", klasse: "key-row", zellen: [zelle, ...] }, ...]
     zelle:       { text, zusatz, klasse, art, notiz, quelle }
        text:   Hauptwert (immer als Text, nie als HTML)
        zusatz: kleine Zusatzzeile (z. B. "= 46 t")
        klasse: "soft" (grau), "missing" (fehlt), "strong" (fett)
        art:    "verifiziert" | "richtwert" | "beispiel" -> Kürzel V / R / B
        notiz:  Hinweistext; erscheint als nummerierte Fußnote unter der Tabelle
        quelle: Quelleneintrag (aus data/baustoffe.js); erscheint in derselben Fußnote mit Link
     zeile.begriff: Kennung eines Fachbegriffs (js/begriffe.js); zeigt einen "i"-Knopf mit Erklärung
     ausrichtung: "rechts" (Standard, für Zahlen) oder "links" (für Text)
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var el = MM.el;

  var ART = {
    verifiziert: { kurz: "V", text: "verifiziert" },
    richtwert:   { kurz: "R", text: "Richtwert" },
    beispiel:    { kurz: "B", text: "Beispieldaten" },
    eigen:       { kurz: "E", text: "Eigene Angabe (nicht geprüft)" }
  };

  // "Quelle: Titel (Eigner), Typ, Bezugsjahr, abgerufen …" mit Link (nur https)
  function quellenZeile(q, mitAbstand) {
    var b = MM.quellen.beschreibe(q);
    var span = el("span", null, "fn-source");
    span.appendChild(document.createTextNode((mitAbstand ? " " : "") + "Quelle: "));
    if (b.url) {
      var a = el("a", b.titel);
      a.setAttribute("href", b.url);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
      span.appendChild(a);
    } else {
      span.appendChild(document.createTextNode(b.titel));
    }
    var rest = (b.eigner ? " (" + b.eigner + ")" : "") + (b.detail ? ", " + b.detail : "") + ".";
    span.appendChild(document.createTextNode(rest));
    return span;
  }

  MM.tabelle = {
    ART: ART,

    bauen: function (opt) {
      var kasten = document.createDocumentFragment();
      var notizen = [];   // Einträge { schluessel, text, quelle }; gleiche Hinweise teilen sich eine Nummer

      function notizNummer(text, quelle) {
        var schluessel = (text || "") + "|" + (quelle ? quelle.id : "");
        for (var i = 0; i < notizen.length; i++) if (notizen[i].schluessel === schluessel) return i + 1;
        notizen.push({ schluessel: schluessel, text: text || "", quelle: quelle || null });
        return notizen.length;
      }

      if (opt.plaetze.length > 1) {
        kasten.appendChild(el("p", "Tabelle seitlich wischen, um alle Materialien zu sehen.", "note scroll-hint"));
      }

      var wrap = el("div", null, "table-wrap");
      var tabelle = el("table", null, "data-table compare-table" + (opt.ausrichtung === "links" ? " align-left" : ""));

      // Kopf: Kennwert | A Name | B Name | C Name
      var kopf = el("thead");
      var kopfZeile = el("tr");
      var kopfTh = el("th", "Kennwert");
      kopfTh.setAttribute("scope", "col");
      kopfZeile.appendChild(kopfTh);
      opt.plaetze.forEach(function (p) {
        var th = el("th", null, "zahl");
        th.setAttribute("scope", "col");
        th.appendChild(el("span", p.buchstabe, "slot slot-small"));
        th.appendChild(document.createTextNode(" " + p.material.name));
        var pa = p.material.produktAktiv;
        if (pa) {
          th.appendChild(document.createElement("br"));
          th.appendChild(el("span", pa.generisch ? "generischer Materialdatensatz" : pa.name + " · " + pa.hersteller + (pa.eigen ? " (eigenes Produkt)" : ""), "produkt-zeile"));
        }
        kopfZeile.appendChild(th);
      });
      kopf.appendChild(kopfZeile);
      tabelle.appendChild(kopf);

      // Körper
      var koerper = el("tbody");
      opt.zeilen.forEach(function (z) {
        var tr = el("tr", null, z.klasse);
        var th = el("th", z.titel);
        th.setAttribute("scope", "row");
        if (z.begriff && MM.begriffe) th.appendChild(MM.begriffe.marke(z.begriff));
        tr.appendChild(th);

        z.zellen.forEach(function (c) {
          var td = el("td", c.text, "zahl" + (c.klasse ? " " + c.klasse : "") + (c.art === "beispiel" ? " beispiel" : ""));
          if (c.art && ART[c.art]) {
            var marke = el("span", ART[c.art].kurz, "art art-" + c.art);
            marke.setAttribute("title", ART[c.art].text);
            marke.setAttribute("role", "img");          // damit Screenreader die Beschriftung vorlesen (aria-label braucht eine Rolle)
            marke.setAttribute("aria-label", ART[c.art].text);
            td.appendChild(marke);
          }
          if (c.notiz || c.quelle) {
            td.appendChild(el("sup", String(notizNummer(c.notiz, c.quelle)), "fn"));
          }
          if (c.zusatz) {
            td.appendChild(document.createElement("br"));
            td.appendChild(el("span", c.zusatz, "sub"));
          }
          tr.appendChild(td);
        });
        koerper.appendChild(tr);
      });
      tabelle.appendChild(koerper);
      wrap.appendChild(tabelle);
      kasten.appendChild(wrap);

      // Fußnoten
      if (notizen.length) {
        var ol = el("ol", null, "footnotes");
        notizen.forEach(function (n) {
          var li = el("li");
          if (n.text) li.appendChild(document.createTextNode(n.text));
          if (n.quelle) li.appendChild(quellenZeile(n.quelle, !!n.text));
          ol.appendChild(li);
        });
        kasten.appendChild(ol);
      }
      return kasten;
    },

    // Erklärung der Kürzel, zeigt nur die Datenarten, die in den Spalten vorkommen
    legende: function () {
      return el("p",
        "Datenart: B = Beispieldaten (nicht geprüft) · R = Richtwert (z. B. generischer ÖKOBAUDAT-Datensatz) · " +
        "V = verifiziert. Hochgestellte Zahlen verweisen auf die Hinweise unter der Tabelle.", "note");
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
