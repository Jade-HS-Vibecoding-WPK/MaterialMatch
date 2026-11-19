/* ==========================================================================
   MaterialMatch – Materialbilder (MaterialMatch 3.0, Fotos seit 3.6)
   --------------------------------------------------------------------------
   Eine zentrale Stelle liefert zu jedem Baustoff das Bild, das ÜBERALL in der Anwendung gleich verwendet wird
   (Materialkarten, Suche, Entdecken, Steckbrief, Vergleich, Match, Swipe, Alternativen, Favoriten, Export).

   Primäre Darstellung (seit 3.6): ein MATERIALFOTO aus img/materialfotos/<Kennung>.webp. Die Zuordnung Baustoff -> Foto
   mit Urheber, Lizenz und Quelle steht in data/bilder.js. Fotos liegen lokal im Projekt (funktioniert offline und über GitHub Pages).
   Gibt es zu einem Baustoff kein lizenzgeklärtes Foto, oder lädt das Foto nicht, erscheint stattdessen die technische SCHRAFFUR
   (img/schraffuren/<Kennung>.svg, unverändert erhalten: selbst gezeichnet, einfarbig). Fehlt auch sie: neutraler Platzhalter.
   Es gibt nie ein kaputtes Bild.

   Benutzung:   MM.materialbilder.element("eps", { groesse: "klein" | "mittel" | "gross", beschriftung: true, variante: "foto" | "schraffur" })
   Das Element ist ein <figure> mit <img> (Lazy Loading, Alternativtext, festes Seitenverhältnis 4:3).
   Mit beschriftung: true steht unter einem Foto der Bildnachweis (Urheber, Lizenz), unter einer Schraffur die Gruppe (z. B. „Schraffur: Dämmstoff, schematisch“).
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var PFAD = "img/schraffuren/";
  var FOTOPFAD = "img/materialfotos/";
  var HINWEIS = "Technische Schraffur (schematisch)";
  var daten = null;

  // Zuordnung Baustoff -> Foto (data/bilder.js); ohne die Datei gibt es einfach keine Fotos
  function fotos() { return (root.MATERIALMATCH_BILDER && root.MATERIALMATCH_BILDER.bilder) || {}; }
  function foto(id) { return fotos()[id] || null; }
  function hatFoto(id) { return !!foto(id); }
  // Wurde ein Foto ausgetauscht, steht in data/bilder.js ein Feld „version“; es hängt sich als ?v=… an die Adresse und umgeht so den Browser-Zwischenspeicher
  // (nur für diese Fotos; alle anderen behalten ihre unveränderte Adresse und bleiben im Zwischenspeicher).
  function fotoUrl(id) { var f = foto(id); return f ? FOTOPFAD + f.datei + (f.version ? "?v=" + encodeURIComponent(f.version) : "") : null; }
  // Bildnachweis als kurzer Text, z. B. „Foto: Max Muster, CC BY-SA 4.0 (Wikimedia Commons)“
  function nachweis(id) {
    var f = foto(id);
    if (!f) return "";
    return "Foto: " + f.urheber + ", " + f.lizenz + " (" + f.quelle_name + ")";
  }

  function material(id) { return daten ? MM.finde(daten.baustoffe, id) : null; }

  // Zuordnung Baustoff -> Schraffurgruppe aus data/schraffuren.js (Gruppe, Muster, Bezug zur Quelle); siehe SCHRAFFUREN_PRUEFUNG.md
  function schraffurInfo(id) {
    var s = root.MATERIALMATCH_SCHRAFFUREN;
    return (s && s.materialien && s.materialien[id]) || null;
  }
  // Kurzer Text unter der Schraffur: Gruppe und – bei Zuordnung durch das Projekt – der Hinweis darauf
  function schraffurText(id) {
    var i = schraffurInfo(id);
    if (!i) return HINWEIS;
    if (i.bezug === "keiner") return "Keine belegte Schraffur vorhanden";
    return "Schraffur: " + i.gruppe + (i.bezug === "gruppe" ? " (Gruppenzuordnung)" : "") + ", schematisch";
  }

  // Hat dieses Material eine eigene Zeichnung? (Alle Materialien mit Einordnung in data/materialprofil.js haben eine.)
  function hat(id) {
    var p = root.MATERIALMATCH_PROFIL;
    return !!(p && p.materialien && p.materialien[id]);
  }

  function url(id) { return PFAD + (hat(id) ? id : "platzhalter") + ".svg"; }

  function alt(id, variante) {
    var m = material(id);
    if (variante === "foto" && hatFoto(id)) return foto(id).alt;   // der Alternativtext in data/bilder.js beginnt mit „Foto: …“
    var i = schraffurInfo(id);
    var name = m ? m.name : "Baustoff";
    if (i && i.bezug === "keiner") return "Keine belegte Schraffur vorhanden: " + name;
    return "Technische Schraffur (schematisch): " + name + (i && i.gruppe ? " – " + i.gruppe : "") + (hat(id) ? "" : " (nicht vorhanden)");
  }

  function element(id, optionen) {
    optionen = optionen || {};
    var groesse = optionen.groesse || "klein";
    var variante = optionen.variante === "schraffur" || !hatFoto(id) ? "schraffur" : "foto";
    var fig = document.createElement("figure");
    var keinMuster = variante === "schraffur" && (!hat(id) || (schraffurInfo(id) && schraffurInfo(id).bezug === "keiner"));
    fig.className = "mbild mbild-" + groesse + " mbild-" + variante + (keinMuster ? " mbild-platzhalter" : "");
    fig.setAttribute("data-material", id);
    fig.setAttribute("data-variante", variante);
    var img = document.createElement("img");
    img.src = variante === "foto" ? fotoUrl(id) : url(id);
    img.alt = alt(id, variante);
    img.width = 160;
    img.height = 120;
    img.loading = "lazy";
    img.decoding = "async";
    img.setAttribute("draggable", "false");
    // Lädt das Foto nicht (z. B. Datei fehlt), erscheint die Schraffur; fehlt auch sie, der neutrale Platzhalter. Nie ein kaputtes Bild.
    img.addEventListener("error", function () {
      var stufe = img.getAttribute("data-ersatz") || "";
      if (stufe === "platzhalter") return;
      if (variante === "foto" && !stufe) {
        img.setAttribute("data-ersatz", "schraffur");
        fig.setAttribute("data-variante", "schraffur");
        fig.classList.remove("mbild-foto"); fig.classList.add("mbild-schraffur");
        img.alt = alt(id, "schraffur");
        img.src = url(id);
        var cap0 = fig.querySelector("figcaption"); if (cap0) cap0.textContent = schraffurText(id);
        return;
      }
      img.setAttribute("data-ersatz", "platzhalter");
      fig.classList.add("mbild-platzhalter");
      img.src = PFAD + "platzhalter.svg";
    });
    fig.appendChild(img);
    if (optionen.beschriftung) {
      var cap = document.createElement("figcaption");
      cap.className = "mbild-text";
      cap.textContent = variante === "foto" ? nachweis(id) : schraffurText(id);
      fig.appendChild(cap);
    }
    return fig;
  }

  MM.materialbilder = {
    PFAD: PFAD,
    HINWEIS: HINWEIS,
    hat: hat,
    hatFoto: hatFoto,
    foto: foto,
    fotoUrl: fotoUrl,
    nachweis: nachweis,
    alleFotos: fotos,
    url: url,
    alt: alt,
    schraffurInfo: schraffurInfo,
    schraffurText: schraffurText,
    element: element,
    init: function (baustoffdaten) { daten = baustoffdaten; }
  };

})(typeof window !== "undefined" ? window : globalThis);
