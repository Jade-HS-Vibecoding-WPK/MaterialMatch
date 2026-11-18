/* ==========================================================================
   MaterialMatch – Materialillustrationen (MaterialMatch 3.0)
   --------------------------------------------------------------------------
   Liefert zu jedem Baustoff die „Schematische Materialillustration“: eine selbst gezeichnete
   SVG-Schraffur im Stil von Architekturplänen (img/schraffuren/<Material-Kennung>.svg).
   Es sind KEINE Fotos und keine Herstellerprodukte. Alles liegt lokal im Projekt und funktioniert offline.

   Fehlt zu einem Material die Zeichnung, erscheint ein einheitlicher neutraler Platzhalter
   (img/schraffuren/platzhalter.svg).

   Benutzung:   MM.materialbilder.element("eps", { groesse: "klein" | "mittel" | "gross", beschriftung: true })
   Das Element ist ein <figure> mit <img> (Lazy Loading, Alternativtext, festes Seitenverhältnis 4:3).
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var PFAD = "img/schraffuren/";
  var HINWEIS = "Schematische Materialillustration";
  var daten = null;

  function material(id) { return daten ? MM.finde(daten.baustoffe, id) : null; }

  // Hat dieses Material eine eigene Zeichnung? (Alle Materialien mit Einordnung in data/materialprofil.js haben eine.)
  function hat(id) {
    var p = root.MATERIALMATCH_PROFIL;
    return !!(p && p.materialien && p.materialien[id]);
  }

  function url(id) { return PFAD + (hat(id) ? id : "platzhalter") + ".svg"; }

  function alt(id) {
    var m = material(id);
    return HINWEIS + ": " + (m ? m.name : "Baustoff") + (hat(id) ? " (Schraffur)" : " (keine Illustration vorhanden)");
  }

  function element(id, optionen) {
    optionen = optionen || {};
    var groesse = optionen.groesse || "klein";
    var fig = document.createElement("figure");
    fig.className = "mbild mbild-" + groesse + (hat(id) ? "" : " mbild-platzhalter");
    fig.setAttribute("data-material", id);
    var img = document.createElement("img");
    img.src = url(id);
    img.alt = alt(id);
    img.width = 160;
    img.height = 120;
    img.loading = "lazy";
    img.decoding = "async";
    img.setAttribute("draggable", "false");
    // Fehlt die Datei, zeigt derselbe Platzhalter wie bei Materialien ohne Zeichnung
    img.addEventListener("error", function () {
      if (img.getAttribute("data-ersatz")) return;
      img.setAttribute("data-ersatz", "1");
      fig.classList.add("mbild-platzhalter");
      img.src = PFAD + "platzhalter.svg";
    });
    fig.appendChild(img);
    if (optionen.beschriftung) {
      var cap = document.createElement("figcaption");
      cap.className = "mbild-text";
      cap.textContent = HINWEIS;
      fig.appendChild(cap);
    }
    return fig;
  }

  MM.materialbilder = {
    PFAD: PFAD,
    HINWEIS: HINWEIS,
    hat: hat,
    url: url,
    alt: alt,
    element: element,
    init: function (baustoffdaten) { daten = baustoffdaten; }
  };

})(typeof window !== "undefined" ? window : globalThis);
