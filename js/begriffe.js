/* ==========================================================================
   MaterialMatch – Erklärungen zu Fachbegriffen (Schritt 12)
   --------------------------------------------------------------------------
   Kleine "i"-Knöpfe neben Fachbegriffen. Ein Klick (oder Enter/Leertaste)
   klappt die Erklärung direkt darunter auf, ein zweiter Klick schließt sie.
   Es gibt bewusst kein Dialogfenster.

   MM.begriffe.marke("rohdichte")   erzeugt den Knopf (für Tabellenzeilen usw.)
   Elemente mit data-begriff="…" im HTML bekommen den Knopf beim Start.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var zaehler = 0;

  // Begriff -> { name, text }. Allgemeine Definitionen, keine Kennwerte.
  var BEGRIFFE = {
    flaeche: { name: "Fläche", text: "Die Fläche des Bauteils in m², zum Beispiel der Wand oder des Dachs. Dezimalzahlen mit Komma oder Punkt eingeben, z. B. 12,5." },
    dicke: { name: "Dicke", text: "Die Dicke der Materialschicht. Die Einheit (mm, cm oder m) ist rechts wählbar. Dezimalzahlen mit Komma oder Punkt eingeben, z. B. 12,5." },
    rohdichte: { name: "Rohdichte", text: "Die Masse eines Materials bezogen auf sein Volumen (kg/m³). Aus der Rohdichte ergibt sich das Gewicht: Gewicht = Volumen × Rohdichte." },
    flaechenmasse: { name: "Flächenmasse", text: "Das Gewicht je m² Bauteilfläche (kg/m²). Sie ergibt sich aus Dicke × Rohdichte und ist wichtig für die Eigenlast." },
    lambda: { name: "Wärmeleitfähigkeit λ", text: "Sie beschreibt, wie viel Wärme ein Material leitet (W/(m·K)). Je kleiner λ, desto besser dämmt das Material. Der Nennwert λD ist der vom Hersteller deklarierte Wert, der Bemessungswert λB der (höhere, vorsichtigere) Wert für die Planung. Die Anwendung zeigt beide getrennt mit eigener Quelle." },
    lambdaD: { name: "Nennwert λD", text: "Der Nennwert der Wärmeleitfähigkeit wird vom Hersteller deklariert (z. B. nach DIN EN 13162). Er gilt unter Prüfbedingungen. Für Berechnungen in der Planung wird der Bemessungswert λB verwendet." },
    lambdaB: { name: "Bemessungswert λB", text: "Der Bemessungswert ist der Rechenwert für die Planung (z. B. nach DIN 4108-4 oder aus der Zulassung des Herstellers) und meist etwas höher als der Nennwert. Liegt er vor, rechnet die Anwendung den R-Wert damit. Fehlt er, wird der Nennwert genutzt und das Ergebnis als orientierend gekennzeichnet." },
    druckfestigkeit: { name: "Druckfestigkeit", text: "Die größte Druckkraft je Fläche, die ein Material aushält (N/mm²). Prüfbedingungen und Belastungsrichtung unterscheiden sich je Material, deshalb sind die Werte nur eingeschränkt vergleichbar. Höher ist nicht automatisch besser." },
    euroklasse: { name: "Euroklasse", text: "Die Klasse des Brandverhaltens eines Baustoffs, von A1 (nicht brennbar) bis F. Sie beschreibt das Material, nicht den Feuerwiderstand eines Bauteils." },
    mu: { name: "Diffusionswiderstandszahl μ", text: "Sie gibt an, wie viel stärker ein Material Wasserdampf bremst als ruhende Luft. Je größer μ, desto dichter ist das Material für Wasserdampf." },
    waermekapazitaet: { name: "Wärmekapazität", text: "Wie viel Wärme ein Material je kg und Kelvin speichern kann (J/(kg·K)). Sie spielt für den sommerlichen Wärmeschutz eine Rolle." },
    preis: { name: "Einheitspreis", text: "Der Preis je Mengeneinheit (m³, kg oder m²). Für einen fairen Vergleich müssen Mehrwertsteuer und Leistungsumfang (Material, Transport, Einbau) gleich sein." },
    bezugsgroesse: { name: "Bezugsgröße", text: "Die Menge, auf die sich ein Wert bezieht, zum Beispiel 1 m³ oder 1 kg. Werte mit verschiedenen Bezugsgrößen lassen sich nicht direkt vergleichen; MaterialMatch rechnet sie auf eure Fläche und Dicke um." },
    module: { name: "Lebenszyklusmodule", text: "Abschnitte im Leben eines Bauprodukts. A1–A3 ist die Herstellung (Rohstoffe, Transport, Fertigung). Nutzung, Rückbau und Gutschriften sind andere Module." },
    gwp: { name: "GWP", text: "Global Warming Potential, das Treibhauspotenzial in kg CO₂-Äquivalenten (CO₂e). Es fasst verschiedene Treibhausgase in einer Zahl zusammen. „Gesamt“ ist die Summe aus fossilem, biogenem und luluc-Anteil." },
    fossil: { name: "GWP fossil", text: "Der Teil des Treibhauspotenzials, der aus fossilen Quellen stammt, etwa aus Energie und Rohstoffen aus Kohle, Öl und Gas." },
    biogen: { name: "GWP biogen", text: "Der Teil, der mit Kohlenstoff aus Pflanzen zusammenhängt. Er ist bei Holz negativ, weil Kohlenstoff im Material gespeichert ist. Am Lebensende wird er wieder freigesetzt oder in Modul D verrechnet." },
    luluc: { name: "Landnutzungsänderung (luluc)", text: "Der Teil des Treibhauspotenzials, der durch veränderte Landnutzung entsteht, zum Beispiel durch Rodung. Er ist Teil des Gesamtwerts." },
    rwert: { name: "Wärmedurchlasswiderstand R", text: "R = d / λ (m²K/W) für eine einzelne Schicht. Je höher R, desto besser dämmt die Schicht. R ist nicht der U-Wert eines Bauteils: Dafür kommen alle Schichten und die Wärmeübergangswiderstände hinzu." },
    prioritaet: { name: "Priorität", text: "" },   // Text wird aus den Einstellungen erzeugt (siehe unten)
    anwendungsbereich: { name: "Anwendungsbereich", text: "Wofür der Baustoff eingesetzt werden soll. Es werden nur Alternativen empfohlen, die laut Datenbank für diesen Bereich vorgesehen sind. „Automatisch“ nimmt den Bereich von Material A." }
  };

  // Der Text der Priorität nennt den Faktor aus data/einstellungen.js
  Object.defineProperty(BEGRIFFE.prioritaet, "text", { enumerable: true, get: function () {
    var f = MM.einstellungen ? MM.einstellungen.hole().prioritaetFaktor : 3;
    var wort = MM.einstellungen ? MM.einstellungen.faktorWort(f) : "dreifach";
    return "Das gewählte Kriterium zählt bei der Empfehlung alternativer Baustoffe " + wort + " und bestimmt ihre Reihenfolge. Beim ausgewogenen Vergleich zählen alle Kriterien gleich viel. Das Gewichtsdiagramm wird nur bei „Geringes Gewicht“ farbig bewertet.";
  } });

  // Erzeugt den Knopf. Die Erklärung entsteht erst beim ersten Klick (so bleibt sie aus dem Seitentext heraus).
  function marke(id) {
    var b = BEGRIFFE[id];
    var knopf = document.createElement("button");
    knopf.type = "button";
    knopf.className = "info";
    knopf.setAttribute("data-begriff-id", id);
    knopf.setAttribute("aria-label", "Erklärung: " + (b ? b.name : id));
    knopf.setAttribute("aria-expanded", "false");
    knopf.addEventListener("click", umschalten);
    return knopf;
  }

  function umschalten(ereignis) {
    var knopf = ereignis.currentTarget;
    ereignis.preventDefault();
    ereignis.stopPropagation();   // zählt nicht als Klick auf die einklappbare Überschrift
    var id = knopf.getAttribute("data-begriff-id");
    var b = BEGRIFFE[id];
    if (!b) return;

    var text = knopf._text;
    if (!text) {
      text = document.createElement("span");
      text.className = "info-text";
      text.setAttribute("role", "note");
      text.id = "info-" + id + "-" + (++zaehler);
      var kopf = document.createElement("strong");
      kopf.textContent = b.name + ": ";
      text.appendChild(kopf);
      text.appendChild(document.createTextNode(b.text));
      knopf._text = text;
      knopf.setAttribute("aria-controls", text.id);
      var traeger = knopf.closest("th, h3, .label-row");
      if (traeger && traeger.classList.contains("label-row")) traeger.insertAdjacentElement("afterend", text);
      else if (traeger) traeger.appendChild(text);
      else knopf.insertAdjacentElement("afterend", text);
      text.hidden = true;
    }
    var offen = text.hidden;          // war zu -> wird geöffnet
    text.hidden = !offen;
    knopf.setAttribute("aria-expanded", String(offen));
  }

  MM.begriffe = {
    TEXTE: BEGRIFFE,
    marke: marke,
    // Knöpfe an Elemente hängen, die im HTML ein data-begriff tragen
    init: function () {
      [].forEach.call(document.querySelectorAll("[data-begriff]"), function (e) {
        if (e.querySelector(".info") || (e.parentNode && e.parentNode.classList.contains("label-row"))) return;
        if (e.tagName === "LABEL") {
          // Ein Knopf im <label> würde das Beschriftungsfeld mit zwei Bedienelementen verknüpfen: daneben statt darin
          var zeile = document.createElement("div");
          zeile.className = "label-row";
          e.parentNode.insertBefore(zeile, e);
          zeile.appendChild(e);
          zeile.appendChild(marke(e.getAttribute("data-begriff")));
        } else {
          e.appendChild(marke(e.getAttribute("data-begriff")));
        }
      });
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
