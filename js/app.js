/* ==========================================================
   MaterialMatch – Start der Anwendung
   Lädt und prüft die Baustoffdatenbank und startet danach
   alle Programmteile in der richtigen Reihenfolge.
   ========================================================== */

(function () {
  "use strict";

  var el = window.MM.el; // Hilfswerkzeug aus js/hilfen.js

  // Katalog aller Baustoffe (Name, Kategorie, Anwendungsbereich) im Bereich "Quellen und Hinweise"
  function katalogZeichnen(daten) {
    var tbody = document.querySelector("#datenuebersicht tbody");
    if (!tbody) return;
    tbody.textContent = "";
    daten.baustoffe.forEach(function (b) {
      var tr = document.createElement("tr");
      tr.appendChild(el("td", b.name));
      tr.appendChild(el("td", window.MM.namenAusIds(b.kategorien, daten.kategorien)));
      tr.appendChild(el("td", window.MM.namenAusIds(b.anwendungen, daten.anwendungsbereiche)));
      tbody.appendChild(tr);
    });
    var titel = document.querySelector("#katalog > summary");
    if (titel) titel.textContent = "Alle Baustoffe in der Datenbank (" + daten.baustoffe.length + ")";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var statusZeile = document.getElementById("status");
    if (window.MM.reiter) window.MM.reiter.init();   // MaterialMatch 2.0: Hauptreiter (auch bei Datenfehlern bedienbar)
    var daten = window.MATERIALMATCH_DATA;
    var pruefung = window.MM && window.MM.pruefeDaten ? window.MM.pruefeDaten(daten) : null;

    if (!daten || !pruefung) {
      if (statusZeile) {
        statusZeile.textContent = "Systemcheck: Die Baustoffdatenbank konnte nicht geladen werden.";
        statusZeile.classList.add("fehler");
      }
      return;
    }

    if (pruefung.fehler.length) {
      // Fehler in den Daten: sichtbar melden und Details in die Browser-Konsole schreiben
      console.error("MaterialMatch – Fehler in der Baustoffdatenbank:\n" + pruefung.fehler.join("\n"));
      if (statusZeile) {
        statusZeile.textContent = "Systemcheck: " + pruefung.fehler.length +
          " Fehler in der Baustoffdatenbank (Details in der Browser-Konsole).";
        statusZeile.classList.add("fehler");
      }
      return;
    }
    var einstProbleme = window.MM.einstellungen.probleme();
    if (einstProbleme.length) {
      console.warn("MaterialMatch – Hinweise zu data/einstellungen.js:\n" + einstProbleme.join("\n"));
    }
    if (pruefung.warnungen.length) {
      console.warn("MaterialMatch – Hinweise zur Baustoffdatenbank:\n" + pruefung.warnungen.join("\n"));
    }

    window.MM.quellen.setzeDaten(daten);   // Schritt 10: Quellenkatalog für alle Anzeigen bereitstellen
    katalogZeichnen(daten);
    window.MM.produkte.init(daten);  // Produkte: Standardprodukte einsetzen, eigene Produkte laden (vor dem Datenmodus)
    window.MM.datenmodus.init();     // Schritt 16: Demo- oder Echtdaten-Modus (muss vor den Anzeigen stehen)
    window.MM.auswahl.init(daten);   // Schritt 3: Materialauswahl aktivieren
    window.MM.materialbilder.init(daten);  // MaterialMatch 3.0: schematische Materialillustrationen
    window.MM.steckbrief.init(daten);      // MaterialMatch 3.0: Material-Steckbrief (Dialog)
    window.MM.produktformular.init(daten); // eigene Produkte ergänzen
    window.MM.auswahlOptionen.init();      // MaterialMatch 2.0: optionale Felder (3. Material, Produkt, eigenes Produkt)
    window.MM.favoriten.init(daten);       // MaterialMatch 3.0: Favoriten (im Browser gespeichert)
    window.MM.match.init();                // MaterialMatch 3.0: Bereich „Match finden“ (Interview, Karten)
    window.MM.suche.init(daten);           // Bento-Redesign: Suche in der Materialauswahl
    if (window.MM.entdecken) window.MM.entdecken.init(daten); // MaterialMatch 3.5: Reiter „Entdecken“ (Suche, Filter, Karten)
    window.MM.eingaben.init();       // Schritt 4: Eingabefelder aktivieren
    window.MM.mengen.init();         // Schritt 4: Ergebnistabelle Menge und Gewicht
    window.MM.eigenschaften.init(daten); // Schritt 5: Vergleich der Eigenschaften
    window.MM.prioritaet.init();         // Schritt 9: Auswahl „Was ist Ihnen besonders wichtig?“
    window.MM.diagramme.init(daten);     // Schritt 6: farbige Vergleichsdiagramme
    window.MM.dashboard.init();          // MaterialMatch 2.0: „Vergleich auf einen Blick“ (liest die Ergebnisse der Diagramme)
    window.MM.rechnen.init(daten);       // Schritt 7: Kosten, CO₂-Menge und R-Wert berechnen
    window.MM.alternativen.init(daten);  // Schritt 8: alternative Baustoffe empfehlen
    window.MM.quellenAnzeige.init(daten); // Schritt 10: Quellen, Datenstand, Nachvollziehbarkeit
    window.MM.oberflaeche.init();        // Schritt 12: Abschnitte, Tooltips, Fachbegriffe
    window.MM.exportieren.init();        // Schritt 13: Druckansicht/PDF und CSV-Export

    if (statusZeile) {
      var heute = new Date().toLocaleDateString("de-DE");
      statusZeile.textContent = "Systemcheck: JavaScript läuft ✓ · Datenbank geprüft ✓ (" +
        daten.baustoffe.length + " Baustoffe, " + daten.kategorien.length + " Kategorien, " +
        pruefung.warnungen.length + " Hinweise) · Seite geladen am " + heute;
      statusZeile.classList.add("ok");
    }
    if (window.MM.hinweis) window.MM.hinweis.init();      // MaterialMatch 3.7: Hinweis „Kurz vorab“ beim ersten Besuch
    if (window.MM.auftakt) window.MM.auftakt.bereit();    // MaterialMatch 3.7: Logo-Auftakt beenden, sobald die Seite bereit ist
  });
})();
