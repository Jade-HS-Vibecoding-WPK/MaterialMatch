/* ==========================================================================
   MaterialMatch – Prüfprogramm für die Baustoffdatenbank
   --------------------------------------------------------------------------
   Wird beim Laden der Seite automatisch ausgeführt und kontrolliert
   data/baustoffe.js auf Fehler. Es liefert zwei Listen:
     fehler:     echte Fehler (z. B. falsche Einheit, unbekannte Kategorie)
     warnungen:  Auffälligkeiten (z. B. Summe der CO2-Anteile stimmt nicht)

   Wichtigste Regel: Eine Angabe darf nur dann "verifiziert" oder "richtwert"
   heißen, wenn eine Quelle eingetragen ist, die im Quellenkatalog mit
   geprueft: true markiert ist. Damit kann niemand versehentlich einen
   ungeprüften Wert als belastbar ausgeben.
   ========================================================================== */

(function (root) {
  "use strict";

  var ARTEN = ["verifiziert", "richtwert", "beispiel", "eigen"];
  var MENGENMODELLE = ["schicht", "keine_schicht"];

  // Erlaubte Eigenschaften und ihre Einheiten
  var ZAHLEN = {
    rohdichte:            { einheiten: ["kg/m³"] },
    waermeleitfaehigkeit: { einheiten: ["W/(m·K)"] },
    waermeleitfaehigkeit_bemessung: { einheiten: ["W/(m·K)"] },
    druckfestigkeit:      { einheiten: ["N/mm²"] },
    preis:                { einheiten: ["€/m³", "€/m²", "€/kg"] },
    wasserdampf_mu:       { einheiten: ["–"] },
    waermekapazitaet:     { einheiten: ["J/(kg·K)"] },
    flaechengewicht:      { einheiten: ["kg/m²"] }
  };
  var TEXTE = ["brandverhalten", "recycling", "lebensdauer"];
  var SONDER = ["gwp"];
  var GWP_BEZUGSGROESSEN = ["1 m³", "1 m²", "1 kg"];

  // Euroklasse, z. B. "A1", "A2-s1,d0", "D-s2,d0", "E"
  var EUROKLASSE = /^(A1|A2|B|C|D|E|F)(-s[123],\s?d[012])?$/;

  function pruefeDaten(d) {
    var fehler = [];
    var warnungen = [];

    function f(text) { fehler.push(text); }
    function w(text) { warnungen.push(text); }
    function istZahl(x) { return typeof x === "number" && isFinite(x); }
    function enthalten(liste, x) { return liste.indexOf(x) !== -1; }

    if (!d || typeof d !== "object") {
      return { fehler: ["Keine Baustoffdaten gefunden."], warnungen: [] };
    }
    ["meta", "kategorien", "anwendungsbereiche", "quellen", "baustoffe"].forEach(function (k) {
      if (!d[k]) f("Im Datenbestand fehlt der Abschnitt „" + k + "“.");
    });
    if (fehler.length) return { fehler: fehler, warnungen: warnungen };

    // ---- Kataloge einlesen und auf doppelte IDs prüfen ----
    function idsSammeln(liste, name) {
      var ids = {};
      liste.forEach(function (eintrag) {
        if (!eintrag.id) { f(name + ": Eintrag ohne id."); return; }
        if (ids[eintrag.id]) f(name + ": id „" + eintrag.id + "“ kommt doppelt vor.");
        ids[eintrag.id] = eintrag;
      });
      return ids;
    }
    var kategorien = idsSammeln(d.kategorien, "Kategorien");
    var bereiche   = idsSammeln(d.anwendungsbereiche, "Anwendungsbereiche");
    var quellen    = idsSammeln(d.quellen, "Quellen");
    var materialien = idsSammeln(d.baustoffe, "Baustoffe");

    // Eine als geprüft markierte Quelle muss nachvollziehbar sein: Titel, Link, Abrufdatum.
    d.quellen.forEach(function (q) {
      if (q.geprueft === true) {
        ["titel", "url", "abgerufen"].forEach(function (feld) {
          if (!q[feld]) f("Quelle „" + q.id + "“ ist als geprüft markiert, aber „" + feld + "“ fehlt.");
        });
      }
    });

    // Quellen mit „quellenart“ (Herstellerdatenblatt, Rechtstext …) stützen Kennwerte außerhalb der
    // ÖKOBAUDAT. Dafür gilt: Region und Geltung (generisch / produktspezifisch) müssen angegeben sein,
    // bei „produktspezifisch“ zusätzlich das Produkt.
    d.quellen.forEach(function (q) {
      if (!q.quellenart) return;
      if (!q.region) f("Quelle „" + q.id + "“: Region fehlt.");
      if (q.geltung !== "generisch" && q.geltung !== "produktspezifisch") {
        f("Quelle „" + q.id + "“: geltung muss „generisch“ oder „produktspezifisch“ sein.");
      }
      if (q.geltung === "produktspezifisch" && !q.produkt) f("Quelle „" + q.id + "“ ist produktspezifisch, aber das Produkt fehlt.");
    });

    // ---- Jeder Baustoff ----
    d.baustoffe.forEach(function (m) {
      var p = "„" + (m.name || m.id) + "“: ";

      if (!m.name) f(p + "Name fehlt.");
      if (!m.produkt) f(p + "Produktbezeichnung fehlt.");
      if (!Array.isArray(m.kategorien) || !m.kategorien.length) {
        f(p + "Keine Kategorie angegeben.");
      } else {
        m.kategorien.forEach(function (k) { if (!kategorien[k]) f(p + "Unbekannte Kategorie „" + k + "“."); });
      }
      if (!Array.isArray(m.anwendungen) || !m.anwendungen.length) {
        f(p + "Kein Anwendungsbereich angegeben.");
      } else {
        m.anwendungen.forEach(function (a) { if (!bereiche[a]) f(p + "Unbekannter Anwendungsbereich „" + a + "“."); });
      }
      if (!enthalten(MENGENMODELLE, m.mengenmodell)) {
        f(p + "mengenmodell muss „schicht“ oder „keine_schicht“ sein.");
      }
      if (m.mengenmodell === "keine_schicht" && !m.mengenhinweis) {
        f(p + "Bei „keine_schicht“ ist ein mengenhinweis nötig (Erklärung für die Nutzer).");
      }
      if (!m.eigenschaften || typeof m.eigenschaften !== "object") {
        f(p + "Keine Eigenschaften angegeben.");
        return;
      }

      // Gemeinsame Prüfung für Art und Quelle einer Angabe
      function pruefeArtUndQuelle(name, e, hatWert) {
        var q = p + name + ": ";
        if (hatWert) {
          if (!enthalten(ARTEN, e.art)) {
            f(q + "art muss „verifiziert“, „richtwert“ oder „beispiel“ sein.");
            return;
          }
        } else if (e.art) {
          f(q + "Ohne Wert darf keine Datenart angegeben sein.");
        }
        if (e.quelle) {
          if (!quellen[e.quelle]) f(q + "Quelle „" + e.quelle + "“ steht nicht im Quellenkatalog.");
        }
        if (hatWert && (e.art === "verifiziert" || e.art === "richtwert")) {
          if (!e.quelle) {
            f(q + "„" + e.art + "“ ist nur mit eingetragener Quelle erlaubt.");
          } else if (quellen[e.quelle] && quellen[e.quelle].geprueft !== true) {
            f(q + "Die Quelle „" + e.quelle + "“ ist nicht als geprüft markiert, daher ist „" + e.art + "“ nicht erlaubt.");
          }
        }
      }

      Object.keys(m.eigenschaften).forEach(function (name) {
        var e = m.eigenschaften[name];
        var q = p + name + ": ";

        if (!ZAHLEN[name] && !enthalten(TEXTE, name) && !enthalten(SONDER, name)) {
          f(q + "Unbekannte Eigenschaft.");
          return;
        }
        if (!e || typeof e !== "object") { f(q + "Angabe ist kein Objekt."); return; }

        // Eigenschaften mit Zahlenwert
        if (ZAHLEN[name]) {
          var hatWert = e.wert !== null && e.wert !== undefined;
          if (hatWert) {
            if (!istZahl(e.wert)) f(q + "wert muss eine Zahl sein.");
            else if (e.wert < 0) f(q + "wert darf nicht negativ sein.");
            if (!enthalten(ZAHLEN[name].einheiten, e.einheit)) {
              f(q + "Einheit „" + e.einheit + "“ ist hier nicht zulässig (erlaubt: " + ZAHLEN[name].einheiten.join(", ") + ").");
            }
            if (name === "preis") {
              if (!e.mwst) f(q + "Angabe zur Mehrwertsteuer (mwst) fehlt – bei Unklarheit „unbekannt“ eintragen.");
              if (!e.umfang) f(q + "Angabe zum Leistungsumfang (umfang) fehlt – bei Unklarheit „unbekannt“ eintragen.");
              if (e.einheit === "€/m²" && m.mengenmodell === "schicht" && !(e.bezugsdicke_m > 0)) {
                f(q + "Bei „€/m²“ ist für Schichtmaterialien die bezugsdicke_m (in Meter) nötig, sonst lässt sich der Preis nicht auf eine Dicke übertragen.");
              }
            }
          } else if (e.nicht_anwendbar !== true && !e.hinweis) {
            w(q + "Wert fehlt ohne Hinweis.");
          }
          pruefeArtUndQuelle(name, e, hatWert);
        }

        // Eigenschaften mit Textwert
        if (enthalten(TEXTE, name)) {
          var hatText = e.wert !== null && e.wert !== undefined;
          if (hatText && typeof e.wert !== "string") f(q + "wert muss Text sein.");
          if (hatText && name === "brandverhalten" && !EUROKLASSE.test(e.wert)) {
            f(q + "„" + e.wert + "“ ist keine gültige Euroklasse (z. B. A1, A2-s1,d0, D-s2,d0, E).");
          }
          pruefeArtUndQuelle(name, e, hatText);
        }

        // CO2-Kennwert
        if (name === "gwp") {
          var hatGwp = e.werte !== null && e.werte !== undefined;
          if (hatGwp) {
            ["gesamt", "fossil", "biogen"].forEach(function (k) {
              if (!istZahl(e.werte[k])) f(q + "werte." + k + " muss eine Zahl sein.");
            });
            if (e.werte.luluc !== undefined && !istZahl(e.werte.luluc)) f(q + "werte.luluc muss eine Zahl sein.");
            if (e.einheit !== "kg CO2e") f(q + "einheit muss „kg CO2e“ sein.");
            if (!enthalten(GWP_BEZUGSGROESSEN, e.deklarierte_einheit)) {
              f(q + "deklarierte_einheit muss „1 m³“, „1 m²“ oder „1 kg“ sein.");
            }
            if (!e.module) f(q + "Lebenszyklusmodule (z. B. „A1-A3“) fehlen.");
            if (e.deklarierte_einheit === "1 m²" && m.mengenmodell === "schicht" && !(e.bezugsdicke_m > 0)) {
              f(q + "Bei Bezugsgröße „1 m²“ ist für Schichtmaterialien die bezugsdicke_m (in Meter) nötig.");
            }
            // gesamt = fossil + biogen + luluc (luluc fehlt oft = 0). Toleranz wegen gerundeter Quellenwerte.
            if (istZahl(e.werte.gesamt) && istZahl(e.werte.fossil) && istZahl(e.werte.biogen)) {
              var summe = e.werte.fossil + e.werte.biogen + (istZahl(e.werte.luluc) ? e.werte.luluc : 0);
              if (Math.abs(summe - e.werte.gesamt) > Math.max(0.5, 0.01 * Math.abs(e.werte.gesamt))) {
                w(q + "gesamt entspricht nicht fossil + biogen + luluc.");
              }
            }
          }
          pruefeArtUndQuelle(name, e, hatGwp);
        }
      });

      // Gewicht: Bei Schichtmaterialien aus der Rohdichte, bei Plattenprodukten ohne Schichtmodell aus dem Flächengewicht
      var rd = m.eigenschaften.rohdichte, fg = m.eigenschaften.flaechengewicht;
      var hatRohdichte = !!rd && rd.wert != null;
      var hatFlaechengewicht = !!fg && fg.wert != null;
      if (m.mengenmodell === "schicht" && !hatRohdichte) {
        w(p + "Rohdichte fehlt – Gewichtsberechnung nicht möglich.");
      } else if (m.mengenmodell === "keine_schicht" && !hatRohdichte && !hatFlaechengewicht) {
        w(p + "Weder Rohdichte noch Flächengewicht angegeben – Gewichtsberechnung nicht möglich.");
      }

      // Plausibilitätsgrenzen (Datenqualität): grobe Wertebereiche, nur Warnungen
      var GRENZEN = {
        rohdichte:            [1, 25000],
        flaechengewicht:      [0.01, 2000],
        waermeleitfaehigkeit: [0.01, 500],
        waermeleitfaehigkeit_bemessung: [0.01, 500],
        druckfestigkeit:      [0.001, 2000],
        wasserdampf_mu:       [0.5, 1000000],
        waermekapazitaet:     [100, 10000]
      };
      Object.keys(GRENZEN).forEach(function (name) {
        var e = m.eigenschaften[name];
        if (e && istZahl(e.wert) && (e.wert < GRENZEN[name][0] || e.wert > GRENZEN[name][1])) {
          w(p + name + ": Wert " + e.wert + " liegt außerhalb des üblichen Bereichs (" + GRENZEN[name][0] + " bis " + GRENZEN[name][1] + ") – bitte prüfen.");
        }
      });
      var ln = m.eigenschaften.waermeleitfaehigkeit, lb = m.eigenschaften.waermeleitfaehigkeit_bemessung;
      if (ln && lb && istZahl(ln.wert) && istZahl(lb.wert) && lb.wert < ln.wert) {
        w(p + "Der Bemessungswert λB (" + lb.wert + ") ist kleiner als der Nennwert λD (" + ln.wert + ") – üblicherweise ist er gleich oder größer, bitte prüfen.");
      }
      var g = m.eigenschaften.gwp;
      if (g && g.werte && istZahl(g.werte.fossil) && g.werte.fossil < 0) {
        w(p + "gwp: Fossiles GWP ist negativ – bitte prüfen.");
      }
    });

    // Namen sollen eindeutig sein, sonst verwechseln Nutzer:innen Materialien im Auswahlfeld
    var namen = {};
    d.baustoffe.forEach(function (m) {
      if (!m.name) return;
      if (namen[m.name]) w("Der Name „" + m.name + "“ kommt mehrfach vor.");
      namen[m.name] = true;
    });

    // Katalogprodukte (data/produkte.js), falls vorhanden
    if (root.MM && root.MM.produkte && root.MM.produkte.pruefe) root.MM.produkte.pruefe(d, f, w);

    return { fehler: fehler, warnungen: warnungen };
  }

  // Für den Browser und für automatische Tests bereitstellen
  root.MM = root.MM || {};
  root.MM.pruefeDaten = pruefeDaten;
  if (typeof module !== "undefined" && module.exports) { module.exports = pruefeDaten; }

})(typeof window !== "undefined" ? window : globalThis);
