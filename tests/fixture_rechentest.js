/* ==========================================================================
   MaterialMatch – Baustoffdatenbank
   --------------------------------------------------------------------------
   WICHTIG – Stand dieser Version (0.3.0):
   Rohdichte und CO2-Kennwerte (GWP, Module A1-A3) stammen, soweit ein passender
   Datensatz existiert, aus der ÖKOBAUDAT 2024-II (art: "richtwert", mit
   Quellenlink). Sie wurden maschinell aus der Originaldatei übernommen
   (tools/oekobaudat_uebernehmen.py) und gegengeprüft (tools/pruefe_gegen_csv.py).
   ALLE ANDEREN Kennwerte (Wärmeleitfähigkeit, Druckfestigkeit, Preis,
   Brandverhalten, Diffusionswiderstand, Wärmekapazität, Recycling) sind
   BEISPIELDATEN (art: "beispiel", quelle: null), weil die ÖKOBAUDAT sie nicht
   enthält. Eine Umstellung auf "verifiziert" oder "richtwert" ist nur mit
   geprüfter Quelle möglich; das Prüfprogramm (js/daten-pruefung.js) erzwingt das.

   Aufbau:
     meta                 Version, Datenstand, Erklärung der Datenarten
     kategorien           Baustoffkategorien (A–E)
     anwendungsbereiche   Wofür ein Baustoff eingesetzt wird
     quellen              Quellenkatalog (geprueft: true/false)
     baustoffe            Die Baustoffe selbst

   Regeln für Kennwerte:
     wert: null + nicht_anwendbar: true   -> Kennwert ist für dieses Material nicht sinnvoll
     wert: null (ohne nicht_anwendbar)    -> Kennwert fehlt (noch nicht recherchiert)
   ========================================================================== */

window.MATERIALMATCH_DATA = {

  meta: {
    version: "0.3.0",
    datenstand: "2026-11-16",
    hinweis: "Rohdichte und CO₂-Kennwerte (A1–A3) stammen, soweit vorhanden, aus der ÖKOBAUDAT 2024-II (Richtwerte, mit Quelle). Alle übrigen Kennwerte (λ, Druckfestigkeit, Preis, Brandverhalten, μ, Wärmekapazität, Recycling) sind Beispieldaten ohne geprüfte Quelle und eignen sich nur zum Ausprobieren.",
    datenarten: {
      verifiziert: "Kennwert wurde anhand einer tatsächlich geprüften Quelle nachvollzogen.",
      richtwert: "Orientierender Kennwert mit nachvollziehbarer Herkunft (z. B. generischer ÖKOBAUDAT-Datensatz); gilt nicht zwingend für jedes Produkt.",
      beispiel: "Frei gewählter oder nicht verifizierter Demonstrationswert."
    }
  },

  kategorien: [
    { id: "tragend",    kuerzel: "A", name: "Tragende Baustoffe" },
    { id: "daemmstoff", kuerzel: "B", name: "Dämmstoffe" },
    { id: "fassade",    kuerzel: "C", name: "Fassadenmaterialien" },
    { id: "innenausbau",kuerzel: "D", name: "Innenausbau" },
    { id: "dach",       kuerzel: "E", name: "Dachmaterialien" }
  ],

  anwendungsbereiche: [
    { id: "tragwerk",        name: "Tragende Wand / Decke / Stütze" },
    { id: "waermedaemmung",  name: "Wärmedämmung" },
    { id: "fassade",         name: "Fassade / Außenbekleidung" },
    { id: "innenausbau",     name: "Innenausbau / Bekleidung" },
    { id: "dach",            name: "Dach" }
  ],

  /* Quellenkatalog. geprueft: false bedeutet: Wir haben die Quelle NICHT selbst
     abgerufen oder gegen sie geprüft. Solche Quellen dürfen nicht als Beleg für
     "verifiziert" oder "richtwert" verwendet werden. */
  quellen: [
    {
      id: "oekobaudat",
      titel: "ÖKOBAUDAT – Datenbank für Ökobilanzdaten im Bauwesen, Release 2024-II (CSV-Export, Punkt als Dezimaltrenner)",
      herausgeber: "Informationsportal Nachhaltiges Bauen – BMWSB / BBSR (generische Daten im Auftrag von BMWSB/BBSR, laut Download-Seite)",
      url: "https://www.oekobaudat.de/service/downloads.html",
      datum: "2024-10-02",
      datum_hinweis: "Laut Download-Seite fand das letzte Update des generischen Datenbestands am 02.10.2024 statt.",
      abgerufen: "2026-11-16",
      datei: "OBD_2024_II_2026-11-16T10_33_52.csv (52.047.093 Bytes, SHA-256 f4811adb380d6d615156aad1bec7ad2a2065e03f94ecd4da687d22dfe785ea5c)",
      geprueft: true,
      verwendung: "Quelle für Rohdichte und CO₂-Kennwerte (GWP, Module A1–A3). Die Datenbank enthält keine Wärmeleitfähigkeit, Druckfestigkeit, Preise oder Brandklassen."
    },
    {
      id: "din-en-iso-10456",
      titel: "DIN EN ISO 10456: Baustoffe und Bauprodukte – Wärme- und feuchtetechnische Eigenschaften",
      herausgeber: "DIN / ISO",
      url: null,
      datum: null,
      geprueft: false,
      verwendung: "Vorgesehene Quelle für Wärmeleitfähigkeit, Wärmekapazität und Wasserdampfdiffusionswiderstand. Norm nicht eingesehen."
    },
    {
      id: "din-4108-4",
      titel: "DIN 4108-4: Wärmeschutz und Energie-Einsparung in Gebäuden – Wärme- und feuchteschutztechnische Bemessungswerte",
      herausgeber: "DIN",
      url: null,
      datum: null,
      geprueft: false,
      verwendung: "Vorgesehene Quelle für Bemessungswerte der Wärmeleitfähigkeit. Norm nicht eingesehen."
    },
    {
      id: "din-en-13501-1",
      titel: "DIN EN 13501-1: Klassifizierung von Bauprodukten und Bauarten zu ihrem Brandverhalten – Teil 1",
      herausgeber: "DIN / CEN",
      url: null,
      datum: null,
      geprueft: false,
      verwendung: "Grundlage der Euroklassen (A1 bis F). Norm nicht eingesehen."
    },

    // <<OEBD-QUELLEN-ANFANG>> automatisch erzeugt von tools/oekobaudat_uebernehmen.py – nicht von Hand ändern
    // <<OEBD-QUELLEN-ENDE>>
  ],

  baustoffe: [

    /* ================= A: TRAGENDE BAUSTOFFE ================= */

    {
      id: "normalbeton",
      name: "Normalbeton (C25/30)",
      produkt: "generisch, kein konkretes Herstellerprodukt",
      kategorien: ["tragend"],
      anwendungen: ["tragwerk"],
      mengenmodell: "schicht",
      eigenschaften: {
        rohdichte:             { wert: 2300, einheit: "kg/m³", art: "beispiel", quelle: null },
        waermeleitfaehigkeit:  { wert: 2.0,  einheit: "W/(m·K)", art: "beispiel", quelle: null },
        druckfestigkeit:       { wert: 25,   einheit: "N/mm²", art: "beispiel", quelle: null, hinweis: "Zylinderdruckfestigkeit der Festigkeitsklasse C25/30 (Beispiel)." },
        preis:                 { wert: 140,  einheit: "€/m³", art: "beispiel", quelle: null, mwst: "unbekannt", umfang: "unbekannt", hinweis: "Frei gewählter Demonstrationspreis, kein Marktpreis." },
        gwp:                   { werte: { gesamt: 260, fossil: 260, biogen: 0 }, einheit: "kg CO2e", deklarierte_einheit: "1 m³", module: "A1-A3", art: "beispiel", quelle: null },
        brandverhalten:        { wert: "A1", art: "beispiel", quelle: null, hinweis: "Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils." },
        wasserdampf_mu:        { wert: 80,   einheit: "–", art: "beispiel", quelle: null },
        waermekapazitaet:      { wert: 1000, einheit: "J/(kg·K)", art: "beispiel", quelle: null },
        recycling:             { wert: "Rückbau zu Recycling-Gesteinskörnung möglich, meist als Tragschicht (Downcycling). Der Anteil in Neubeton ist begrenzt.", art: "beispiel", quelle: null }
      },
      vorteile: ["Hohe Druckfestigkeit", "Gute Speichermasse", "Nicht brennbar"],
      nachteile: ["Hohes Gewicht", "Vergleichsweise hohe Herstellungs-Emissionen je m³"]
    },

    {
      id: "stahlbeton",
      name: "Stahlbeton (C30/37, bewehrt)",
      produkt: "generisch, kein konkretes Herstellerprodukt",
      kategorien: ["tragend"],
      anwendungen: ["tragwerk"],
      mengenmodell: "schicht",
      eigenschaften: {
        rohdichte:             { wert: 2400, einheit: "kg/m³", art: "beispiel", quelle: null },
        waermeleitfaehigkeit:  { wert: 2.3,  einheit: "W/(m·K)", art: "beispiel", quelle: null },
        druckfestigkeit:       { wert: 30,   einheit: "N/mm²", art: "beispiel", quelle: null, hinweis: "Zylinderdruckfestigkeit der Festigkeitsklasse C30/37 (Beispiel)." },
        preis:                 { wert: 320,  einheit: "€/m³", art: "beispiel", quelle: null, mwst: "unbekannt", umfang: "unbekannt", hinweis: "Frei gewählter Demonstrationspreis, kein Marktpreis." },
        gwp:                   { werte: { gesamt: 380, fossil: 380, biogen: 0 }, einheit: "kg CO2e", deklarierte_einheit: "1 m³", module: "A1-A3", art: "beispiel", quelle: null, hinweis: "Bewehrungsgehalt im Beispielwert nicht festgelegt." },
        brandverhalten:        { wert: "A1", art: "beispiel", quelle: null, hinweis: "Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils." },
        wasserdampf_mu:        { wert: 80,   einheit: "–", art: "beispiel", quelle: null },
        waermekapazitaet:      { wert: 1000, einheit: "J/(kg·K)", art: "beispiel", quelle: null },
        recycling:             { wert: "Beton und Bewehrungsstahl lassen sich nach dem Rückbau trennen. Stahl ist gut recycelbar, Beton wird meist als Gesteinskörnung verwertet.", art: "beispiel", quelle: null }
      },
      vorteile: ["Hohe Tragfähigkeit auch bei schlanken Querschnitten", "Nicht brennbar", "Formbar"],
      nachteile: ["Hohes Gewicht", "Hohe Herstellungs-Emissionen je m³", "Rückbau aufwendig"]
    },

    {
      id: "hochlochziegel",
      name: "Mauerziegel, ungefüllt (Hochlochziegel)",
      produkt: "Branchendurchschnitt Deutschland (Bundesverband der Deutschen Ziegelindustrie e.V.)",
      kategorien: ["tragend"],
      anwendungen: ["tragwerk"],
      mengenmodell: "schicht",
      eigenschaften: {
        rohdichte:             { wert: 800,  einheit: "kg/m³", art: "beispiel", quelle: null },
        waermeleitfaehigkeit:  { wert: 0.16, einheit: "W/(m·K)", art: "beispiel", quelle: null },
        druckfestigkeit:       { wert: 12,   einheit: "N/mm²", art: "beispiel", quelle: null, hinweis: "Steindruckfestigkeit, nicht Druckfestigkeit des fertigen Mauerwerks." },
        preis:                 { wert: 260,  einheit: "€/m³", art: "beispiel", quelle: null, mwst: "unbekannt", umfang: "unbekannt", hinweis: "Frei gewählter Demonstrationspreis, kein Marktpreis." },
        gwp:                   { werte: { gesamt: 190, fossil: 190, biogen: 0 }, einheit: "kg CO2e", deklarierte_einheit: "1 m³", module: "A1-A3", art: "beispiel", quelle: null },
        brandverhalten:        { wert: "A1", art: "beispiel", quelle: null, hinweis: "Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils." },
        wasserdampf_mu:        { wert: 10,   einheit: "–", art: "beispiel", quelle: null },
        waermekapazitaet:      { wert: 900,  einheit: "J/(kg·K)", art: "beispiel", quelle: null },
        recycling:             { wert: "Ziegelbruch ist als Recyclingmaterial nutzbar. Mörtelanhaftungen und Verbundsysteme erschweren die sortenreine Trennung.", art: "beispiel", quelle: null }
      },
      vorteile: ["Nicht brennbar", "Gute Wärmedämmung für einen Mauerstein", "Diffusionsoffen"],
      nachteile: ["Geringere Druckfestigkeit als Beton", "Mauerwerk braucht Fachkräfte und Trocknungszeit"]
    },

    {
      id: "porenbeton",
      name: "Porenbeton (P2 04, unbewehrt)",
      produkt: "generisch, kein konkretes Herstellerprodukt",
      kategorien: ["tragend"],
      anwendungen: ["tragwerk"],
      mengenmodell: "schicht",
      eigenschaften: {
        rohdichte:             { wert: 400,  einheit: "kg/m³", art: "beispiel", quelle: null },
        waermeleitfaehigkeit:  { wert: 0.10, einheit: "W/(m·K)", art: "beispiel", quelle: null },
        druckfestigkeit:       { wert: 2,    einheit: "N/mm²", art: "beispiel", quelle: null, hinweis: "Festigkeitsklasse PP2 (Beispiel)." },
        preis:                 { wert: 180,  einheit: "€/m³", art: "beispiel", quelle: null, mwst: "unbekannt", umfang: "unbekannt", hinweis: "Frei gewählter Demonstrationspreis, kein Marktpreis." },
        gwp:                   { werte: { gesamt: 160, fossil: 160, biogen: 0 }, einheit: "kg CO2e", deklarierte_einheit: "1 m³", module: "A1-A3", art: "beispiel", quelle: null },
        brandverhalten:        { wert: "A1", art: "beispiel", quelle: null, hinweis: "Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils." },
        wasserdampf_mu:        { wert: 8,    einheit: "–", art: "beispiel", quelle: null },
        waermekapazitaet:      { wert: 1000, einheit: "J/(kg·K)", art: "beispiel", quelle: null },
        recycling:             { wert: "Verwertung von Rückbaumaterial hängt vom regionalen Angebot ab. Sortenreiner Rückbau ist Voraussetzung.", art: "beispiel", quelle: null }
      },
      vorteile: ["Leicht und gut zu bearbeiten", "Vergleichsweise gute Wärmedämmung für einen Wandbaustoff", "Nicht brennbar"],
      nachteile: ["Geringe Druckfestigkeit", "Empfindlich gegen dauerhafte Durchfeuchtung"]
    },

    {
      id: "brettsperrholz",
      name: "Brettsperrholz (BSP / CLT)",
      produkt: "Durchschnitt Deutschland (Thünen-Institut für Holzforschung)",
      kategorien: ["tragend"],
      anwendungen: ["tragwerk"],
      mengenmodell: "schicht",
      eigenschaften: {
        rohdichte:             { wert: 470,  einheit: "kg/m³", art: "beispiel", quelle: null },
        waermeleitfaehigkeit:  { wert: 0.13, einheit: "W/(m·K)", art: "beispiel", quelle: null },
        druckfestigkeit:       { wert: 21,   einheit: "N/mm²", art: "beispiel", quelle: null, hinweis: "Druck parallel zur Faser (Beispiel). Bei Holz stark richtungsabhängig." },
        preis:                 { wert: 750,  einheit: "€/m³", art: "beispiel", quelle: null, mwst: "unbekannt", umfang: "unbekannt", hinweis: "Frei gewählter Demonstrationspreis, kein Marktpreis." },
        gwp:                   { werte: { gesamt: -630, fossil: 150, biogen: -780 }, einheit: "kg CO2e", deklarierte_einheit: "1 m³", module: "A1-A3", art: "beispiel", quelle: null, hinweis: "Biogen: im Holz gespeicherter Kohlenstoff. Er wird bei thermischer Verwertung am Lebensende wieder freigesetzt." },
        brandverhalten:        { wert: "D-s2,d0", art: "beispiel", quelle: null, hinweis: "Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils (Abbrand von Holzbauteilen ist berechenbar)." },
        wasserdampf_mu:        { wert: 50,   einheit: "–", art: "beispiel", quelle: null },
        waermekapazitaet:      { wert: 1600, einheit: "J/(kg·K)", art: "beispiel", quelle: null },
        recycling:             { wert: "Wiederverwendung bei lösbaren Verbindungen möglich, sonst meist thermische Verwertung. Klebstoffe und Verbindungsmittel erschweren den stofflichen Kreislauf.", art: "beispiel", quelle: null }
      },
      vorteile: ["Geringes Gewicht", "Speichert Kohlenstoff während der Nutzung", "Hoher Vorfertigungsgrad"],
      nachteile: ["Brennbar", "Feuchteschutz im Bau und in der Nutzung nötig", "Höherer Materialpreis je m³"]
    },

    {
      id: "brettschichtholz",
      name: "Brettschichtholz (BSH, GL24h)",
      produkt: "generisch, Fichte, kein konkretes Herstellerprodukt",
      kategorien: ["tragend"],
      anwendungen: ["tragwerk"],
      mengenmodell: "schicht",
      eigenschaften: {
        rohdichte:             { wert: 420,  einheit: "kg/m³", art: "beispiel", quelle: null },
        waermeleitfaehigkeit:  { wert: 0.13, einheit: "W/(m·K)", art: "beispiel", quelle: null },
        druckfestigkeit:       { wert: 24,   einheit: "N/mm²", art: "beispiel", quelle: null, hinweis: "Druck parallel zur Faser (Beispiel). Bei Holz stark richtungsabhängig." },
        preis:                 { wert: 600,  einheit: "€/m³", art: "beispiel", quelle: null, mwst: "unbekannt", umfang: "unbekannt", hinweis: "Frei gewählter Demonstrationspreis, kein Marktpreis." },
        gwp:                   { werte: { gesamt: -600, fossil: 120, biogen: -720 }, einheit: "kg CO2e", deklarierte_einheit: "1 m³", module: "A1-A3", art: "beispiel", quelle: null, hinweis: "Biogen: im Holz gespeicherter Kohlenstoff. Er wird bei thermischer Verwertung am Lebensende wieder freigesetzt." },
        brandverhalten:        { wert: "D-s2,d0", art: "beispiel", quelle: null, hinweis: "Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils." },
        wasserdampf_mu:        { wert: 50,   einheit: "–", art: "beispiel", quelle: null },
        waermekapazitaet:      { wert: 1600, einheit: "J/(kg·K)", art: "beispiel", quelle: null },
        recycling:             { wert: "Wiederverwendung bei lösbaren Verbindungen möglich, sonst meist thermische Verwertung. Klebstoffe erschweren den stofflichen Kreislauf.", art: "beispiel", quelle: null }
      },
      vorteile: ["Große Spannweiten bei geringem Gewicht", "Speichert Kohlenstoff während der Nutzung"],
      nachteile: ["Brennbar", "Feuchteschutz nötig"]
    },

    {
      id: "konstruktionsvollholz",
      name: "Konstruktionsvollholz (KVH, C24)",
      produkt: "generisch, Fichte, kein konkretes Herstellerprodukt",
      kategorien: ["tragend"],
      anwendungen: ["tragwerk"],
      mengenmodell: "schicht",
      eigenschaften: {
        rohdichte:             { wert: 420,  einheit: "kg/m³", art: "beispiel", quelle: null },
        waermeleitfaehigkeit:  { wert: 0.13, einheit: "W/(m·K)", art: "beispiel", quelle: null },
        druckfestigkeit:       { wert: 21,   einheit: "N/mm²", art: "beispiel", quelle: null, hinweis: "Druck parallel zur Faser (Beispiel). Bei Holz stark richtungsabhängig." },
        preis:                 { wert: 480,  einheit: "€/m³", art: "beispiel", quelle: null, mwst: "unbekannt", umfang: "unbekannt", hinweis: "Frei gewählter Demonstrationspreis, kein Marktpreis." },
        gwp:                   { werte: { gesamt: -670, fossil: 70, biogen: -740 }, einheit: "kg CO2e", deklarierte_einheit: "1 m³", module: "A1-A3", art: "beispiel", quelle: null, hinweis: "Biogen: im Holz gespeicherter Kohlenstoff. Er wird bei thermischer Verwertung am Lebensende wieder freigesetzt." },
        brandverhalten:        { wert: "D-s2,d0", art: "beispiel", quelle: null, hinweis: "Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils." },
        wasserdampf_mu:        { wert: 50,   einheit: "–", art: "beispiel", quelle: null },
        waermekapazitaet:      { wert: 1600, einheit: "J/(kg·K)", art: "beispiel", quelle: null },
        recycling:             { wert: "Unbehandelt gut wiederverwendbar oder stofflich/thermisch nutzbar. Holzschutzmittel beeinflussen die Entsorgung.", art: "beispiel", quelle: null }
      },
      vorteile: ["Geringes Gewicht", "Einfach zu verarbeiten", "Speichert Kohlenstoff während der Nutzung"],
      nachteile: ["Brennbar", "Feuchteschutz nötig", "Begrenzte Querschnitte"]
    },

    {
      id: "baustahl",
      name: "Baustahl (Profile und Stabstahl)",
      produkt: "Branchendurchschnitt (bauforumstahl e.V.)",
      kategorien: ["tragend"],
      anwendungen: ["tragwerk"],
      mengenmodell: "keine_schicht",
      mengenhinweis: "Baustahl wird als Profil oder Querschnitt eingesetzt, nicht als flächige Schicht mit Dicke. Die Schicht-Berechnung (Fläche × Dicke) ist deshalb deaktiviert.",
      eigenschaften: {
        rohdichte:             { wert: 7850, einheit: "kg/m³", art: "beispiel", quelle: null },
        waermeleitfaehigkeit:  { wert: 50,   einheit: "W/(m·K)", art: "beispiel", quelle: null },
        druckfestigkeit:       { wert: null, einheit: "N/mm²", art: null, quelle: null, nicht_anwendbar: true, hinweis: "Stahl wird über die Streckgrenze bemessen (S235: 235 N/mm²), die nicht direkt mit der Druckfestigkeit von Beton oder Holz vergleichbar ist." },
        preis:                 { wert: 1.3,  einheit: "€/kg", art: "beispiel", quelle: null, mwst: "unbekannt", umfang: "unbekannt", hinweis: "Frei gewählter Demonstrationspreis, kein Marktpreis. Bewusst in €/kg angegeben (Beispiel für abweichende Bezugsgröße)." },
        gwp:                   { werte: { gesamt: 1.9, fossil: 1.9, biogen: 0 }, einheit: "kg CO2e", deklarierte_einheit: "1 kg", module: "A1-A3", art: "beispiel", quelle: null, hinweis: "Bezugsgröße 1 kg (nicht 1 m³). Der Wert hängt stark vom Herstellverfahren und Schrottanteil ab." },
        brandverhalten:        { wert: "A1", art: "beispiel", quelle: null, hinweis: "Euroklasse des Baustoffs. Ungeschützter Stahl verliert bei Hitze jedoch schnell Tragfähigkeit (Feuerwiderstand des Bauteils)." },
        wasserdampf_mu:        { wert: null, einheit: "–", art: null, quelle: null, nicht_anwendbar: true, hinweis: "Stahl ist dampfdicht." },
        waermekapazitaet:      { wert: 450,  einheit: "J/(kg·K)", art: "beispiel", quelle: null },
        recycling:             { wert: "Sehr gut recycelbar (etablierter Schrottkreislauf). Bauteile mit geschraubten Verbindungen sind wiederverwendbar.", art: "beispiel", quelle: null }
      },
      vorteile: ["Sehr hohe Festigkeit bei schlanken Querschnitten", "Sehr gut recycelbar", "Nicht brennbar"],
      nachteile: ["Hohe Rohdichte", "Wärmebrücken", "Schutz vor Korrosion und Feuer nötig"]
    },

    /* ================= B: DÄMMSTOFFE ================= */

    {
      id: "mineralwolle",
      name: "Mineralwolle (Fassadendämmung)",
      produkt: "generisch, ohne Unterscheidung Stein-/Glaswolle, kein konkretes Herstellerprodukt",
      kategorien: ["daemmstoff"],
      anwendungen: ["waermedaemmung"],
      mengenmodell: "schicht",
      eigenschaften: {
        rohdichte:             { wert: 40,    einheit: "kg/m³", art: "beispiel", quelle: null },
        waermeleitfaehigkeit:  { wert: 0.035, einheit: "W/(m·K)", art: "beispiel", quelle: null },
        druckfestigkeit:       { wert: null,  einheit: "N/mm²", art: null, quelle: null, nicht_anwendbar: true, hinweis: "Bei Dämmstoffen wird die Druckspannung bei 10 % Stauchung angegeben, eine andere Prüfgröße als die Druckfestigkeit von Tragstoffen." },
        preis:                 { wert: 85,    einheit: "€/m³", art: "beispiel", quelle: null, mwst: "unbekannt", umfang: "unbekannt", hinweis: "Frei gewählter Demonstrationspreis, kein Marktpreis." },
        gwp:                   { werte: { gesamt: 55, fossil: 55, biogen: 0 }, einheit: "kg CO2e", deklarierte_einheit: "1 m³", module: "A1-A3", art: "beispiel", quelle: null },
        brandverhalten:        { wert: "A1", art: "beispiel", quelle: null, hinweis: "Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils." },
        wasserdampf_mu:        { wert: 1,     einheit: "–", art: "beispiel", quelle: null },
        waermekapazitaet:      { wert: 1030,  einheit: "J/(kg·K)", art: "beispiel", quelle: null },
        recycling:             { wert: "Recycling von Verschnitt möglich. Rückbaumaterial wird häufig deponiert, die Rücknahme hängt vom Anbieter ab.", art: "beispiel", quelle: null }
      },
      vorteile: ["Nicht brennbar", "Diffusionsoffen", "Gute Schalldämpfung im Hohlraum"],
      nachteile: ["Faserstaub beim Einbau (Schutzmaßnahmen nötig)", "Empfindlich gegen Durchfeuchtung"]
    },

    {
      id: "eps",
      name: "EPS (expandiertes Polystyrol)",
      produkt: "generisch, Dämmplatte, kein konkretes Herstellerprodukt",
      kategorien: ["daemmstoff"],
      anwendungen: ["waermedaemmung"],
      mengenmodell: "schicht",
      eigenschaften: {
        rohdichte:             { wert: 15,    einheit: "kg/m³", art: "beispiel", quelle: null },
        waermeleitfaehigkeit:  { wert: 0.035, einheit: "W/(m·K)", art: "beispiel", quelle: null },
        druckfestigkeit:       { wert: null,  einheit: "N/mm²", art: null, quelle: null, nicht_anwendbar: true, hinweis: "Bei Dämmstoffen wird die Druckspannung bei 10 % Stauchung angegeben, eine andere Prüfgröße als die Druckfestigkeit von Tragstoffen." },
        preis:                 { wert: 70,    einheit: "€/m³", art: "beispiel", quelle: null, mwst: "unbekannt", umfang: "unbekannt", hinweis: "Frei gewählter Demonstrationspreis, kein Marktpreis." },
        gwp:                   { werte: { gesamt: 50, fossil: 50, biogen: 0 }, einheit: "kg CO2e", deklarierte_einheit: "1 m³", module: "A1-A3", art: "beispiel", quelle: null },
        brandverhalten:        { wert: "E", art: "beispiel", quelle: null, hinweis: "Euroklasse des Baustoffs. Im Fassadensystem sind Brandschutzmaßnahmen nötig (Feuerwiderstand/Gesamtsystem separat bewerten)." },
        wasserdampf_mu:        { wert: 30,    einheit: "–", art: "beispiel", quelle: null },
        waermekapazitaet:      { wert: 1450,  einheit: "J/(kg·K)", art: "beispiel", quelle: null },
        recycling:             { wert: "Sortenrein prinzipiell recycelbar, Rücknahmesysteme sind teils verfügbar. Verbunde mit Putz erschweren die Trennung. Bei Altbestand sind Schadstoffe (z. B. HBCD) zu beachten.", art: "beispiel", quelle: null }
      },
      vorteile: ["Günstig", "Sehr leicht", "Feuchteunempfindlich"],
      nachteile: ["Brennbar (Euroklasse E)", "Erdölbasiert", "Nicht diffusionsoffen"]
    },

    {
      id: "holzfaserdaemmung",
      name: "Holzfaserdämmung",
      produkt: "generisch, Dämmplatte, kein konkretes Herstellerprodukt",
      kategorien: ["daemmstoff"],
      anwendungen: ["waermedaemmung"],
      mengenmodell: "schicht",
      eigenschaften: {
        rohdichte:             { wert: 110,   einheit: "kg/m³", art: "beispiel", quelle: null },
        waermeleitfaehigkeit:  { wert: 0.040, einheit: "W/(m·K)", art: "beispiel", quelle: null },
        druckfestigkeit:       { wert: null,  einheit: "N/mm²", art: null, quelle: null, nicht_anwendbar: true, hinweis: "Bei Dämmstoffen wird die Druckspannung bei 10 % Stauchung angegeben, eine andere Prüfgröße als die Druckfestigkeit von Tragstoffen." },
        preis:                 { wert: 220,   einheit: "€/m³", art: "beispiel", quelle: null, mwst: "unbekannt", umfang: "unbekannt", hinweis: "Frei gewählter Demonstrationspreis, kein Marktpreis." },
        gwp:                   { werte: { gesamt: -130, fossil: 60, biogen: -190 }, einheit: "kg CO2e", deklarierte_einheit: "1 m³", module: "A1-A3", art: "beispiel", quelle: null, hinweis: "Biogen: im Holz gespeicherter Kohlenstoff. Er wird bei thermischer Verwertung am Lebensende wieder freigesetzt." },
        brandverhalten:        { wert: "E", art: "beispiel", quelle: null, hinweis: "Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils." },
        wasserdampf_mu:        { wert: 5,     einheit: "–", art: "beispiel", quelle: null },
        waermekapazitaet:      { wert: 2100,  einheit: "J/(kg·K)", art: "beispiel", quelle: null },
        recycling:             { wert: "Sortenreiner Rückbau ermöglicht Wiederverwendung oder thermische Verwertung. Bindemittel und Zusätze sind zu beachten.", art: "beispiel", quelle: null }
      },
      vorteile: ["Diffusionsoffen", "Gute Wärmespeicherung (Hitzeschutz im Sommer)", "Nachwachsender Rohstoff"],
      nachteile: ["Teurer als EPS oder Mineralwolle", "Höheres Gewicht als EPS", "Brennbar"]
    },

    {
      id: "zellulose",
      name: "Zellulosedämmung",
      produkt: "generisch, Einblasdämmung, kein konkretes Herstellerprodukt",
      kategorien: ["daemmstoff"],
      anwendungen: ["waermedaemmung"],
      mengenmodell: "schicht",
      eigenschaften: {
        rohdichte:             { wert: 50,    einheit: "kg/m³", art: "beispiel", quelle: null },
        waermeleitfaehigkeit:  { wert: 0.039, einheit: "W/(m·K)", art: "beispiel", quelle: null },
        druckfestigkeit:       { wert: null,  einheit: "N/mm²", art: null, quelle: null, nicht_anwendbar: true, hinweis: "Bei Dämmstoffen wird die Druckspannung bei 10 % Stauchung angegeben, eine andere Prüfgröße als die Druckfestigkeit von Tragstoffen." },
        preis:                 { wert: 110,   einheit: "€/m³", art: "beispiel", quelle: null, mwst: "unbekannt", umfang: "unbekannt", hinweis: "Frei gewählter Demonstrationspreis, kein Marktpreis." },
        gwp:                   { werte: { gesamt: -50, fossil: 20, biogen: -70 }, einheit: "kg CO2e", deklarierte_einheit: "1 m³", module: "A1-A3", art: "beispiel", quelle: null, hinweis: "Biogen: im Altpapier gespeicherter Kohlenstoff. Er wird bei thermischer Verwertung am Lebensende wieder freigesetzt." },
        brandverhalten:        { wert: "E", art: "beispiel", quelle: null, hinweis: "Je nach Produkt auch bessere Klassen möglich. Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils." },
        wasserdampf_mu:        { wert: 2,     einheit: "–", art: "beispiel", quelle: null },
        waermekapazitaet:      { wert: 2000,  einheit: "J/(kg·K)", art: "beispiel", quelle: null },
        recycling:             { wert: "Lose eingeblasen prinzipiell wiedergewinnbar. Verklebt oder vermischt meist thermische Verwertung.", art: "beispiel", quelle: null }
      },
      vorteile: ["Günstig", "Fugenlose Dämmung durch Einblasen", "Aus Altpapier hergestellt"],
      nachteile: ["Setzungsgefahr bei falschem Einbau", "Feuchteempfindlich", "Brennbar"]
    },

    {
      id: "hanfdaemmung",
      name: "Hanfdämmung",
      produkt: "generisch, Dämmmatte, kein konkretes Herstellerprodukt",
      kategorien: ["daemmstoff"],
      anwendungen: ["waermedaemmung"],
      mengenmodell: "schicht",
      eigenschaften: {
        rohdichte:             { wert: 38,    einheit: "kg/m³", art: "beispiel", quelle: null },
        waermeleitfaehigkeit:  { wert: 0.040, einheit: "W/(m·K)", art: "beispiel", quelle: null },
        druckfestigkeit:       { wert: null,  einheit: "N/mm²", art: null, quelle: null, nicht_anwendbar: true, hinweis: "Bei Dämmstoffen wird die Druckspannung bei 10 % Stauchung angegeben, eine andere Prüfgröße als die Druckfestigkeit von Tragstoffen." },
        preis:                 { wert: 260,   einheit: "€/m³", art: "beispiel", quelle: null, mwst: "unbekannt", umfang: "unbekannt", hinweis: "Frei gewählter Demonstrationspreis, kein Marktpreis." },
        gwp:                   { werte: null, einheit: "kg CO2e", deklarierte_einheit: null, module: null, art: null, quelle: null, hinweis: "Noch nicht recherchiert. Kennwert fehlt." },
        brandverhalten:        { wert: "E", art: "beispiel", quelle: null, hinweis: "Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils." },
        wasserdampf_mu:        { wert: 2,     einheit: "–", art: "beispiel", quelle: null },
        waermekapazitaet:      { wert: 1800,  einheit: "J/(kg·K)", art: "beispiel", quelle: null },
        recycling:             { wert: "Naturfaser mit Stützfasern. Die Verwertung hängt vom Produktaufbau ab.", art: "beispiel", quelle: null }
      },
      vorteile: ["Diffusionsoffen", "Nachwachsender Rohstoff", "Angenehm im Einbau"],
      nachteile: ["Höherer Preis", "Brennbar", "Stützfasern erschweren das Recycling"]
    },

    /* ================= C: FASSADE ================= */

    {
      id: "klinker",
      name: "Klinker (Vormauerziegel)",
      produkt: "generisch, kein konkretes Herstellerprodukt",
      kategorien: ["fassade"],
      anwendungen: ["fassade"],
      mengenmodell: "schicht",
      mengenhinweis: "Berechnung als Verblendschale (Fläche × Steindicke). Mörtel, Hinterlüftung und Unterkonstruktion sind nicht enthalten.",
      eigenschaften: {
        rohdichte:             { wert: 2000, einheit: "kg/m³", art: "beispiel", quelle: null },
        waermeleitfaehigkeit:  { wert: 1.0,  einheit: "W/(m·K)", art: "beispiel", quelle: null },
        druckfestigkeit:       { wert: 30,   einheit: "N/mm²", art: "beispiel", quelle: null, hinweis: "Steindruckfestigkeit (Beispiel)." },
        preis:                 { wert: 650,  einheit: "€/m³", art: "beispiel", quelle: null, mwst: "unbekannt", umfang: "unbekannt", hinweis: "Frei gewählter Demonstrationspreis, kein Marktpreis." },
        gwp:                   { werte: { gesamt: 500, fossil: 500, biogen: 0 }, einheit: "kg CO2e", deklarierte_einheit: "1 m³", module: "A1-A3", art: "beispiel", quelle: null },
        brandverhalten:        { wert: "A1", art: "beispiel", quelle: null, hinweis: "Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils." },
        wasserdampf_mu:        { wert: 50,   einheit: "–", art: "beispiel", quelle: null },
        waermekapazitaet:      { wert: 900,  einheit: "J/(kg·K)", art: "beispiel", quelle: null },
        recycling:             { wert: "Ziegelbruch ist verwertbar. Bei Kalkmörtel können ganze Steine wiederverwendet werden, Zementmörtel erschwert das.", art: "beispiel", quelle: null }
      },
      vorteile: ["Sehr langlebiges Erscheinungsbild", "Nicht brennbar", "Witterungsbeständig"],
      nachteile: ["Hohes Gewicht", "Hohe Herstellungs-Emissionen je m³ (Brennprozess)"]
    },

    /* ================= D: INNENAUSBAU ================= */

    {
      id: "gipskarton",
      name: "Gipsplatte (nach DIN EN 520 / DIN 18180)",
      produkt: "Branchendurchschnitt (Bundesverband der Gipsindustrie e. V.)",
      kategorien: ["innenausbau"],
      anwendungen: ["innenausbau"],
      mengenmodell: "schicht",
      mengenhinweis: "Plattenwerkstoff in festen Dicken (z. B. 12,5 mm). Die Dicke bitte entsprechend eingeben.",
      eigenschaften: {
        rohdichte:             { wert: 800,  einheit: "kg/m³", art: "beispiel", quelle: null },
        waermeleitfaehigkeit:  { wert: 0.25, einheit: "W/(m·K)", art: "beispiel", quelle: null },
        druckfestigkeit:       { wert: null, einheit: "N/mm²", art: null, quelle: null, nicht_anwendbar: true, hinweis: "Bei Platten ist die Biegefestigkeit maßgebend, nicht die Druckfestigkeit." },
        preis:                 { wert: 380,  einheit: "€/m³", art: "beispiel", quelle: null, mwst: "unbekannt", umfang: "unbekannt", hinweis: "Frei gewählter Demonstrationspreis, kein Marktpreis." },
        gwp:                   { werte: { gesamt: 280, fossil: 280, biogen: 0 }, einheit: "kg CO2e", deklarierte_einheit: "1 m³", module: "A1-A3", art: "beispiel", quelle: null },
        brandverhalten:        { wert: "A2-s1,d0", art: "beispiel", quelle: null, hinweis: "Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils." },
        wasserdampf_mu:        { wert: 10,   einheit: "–", art: "beispiel", quelle: null },
        waermekapazitaet:      { wert: 1000, einheit: "J/(kg·K)", art: "beispiel", quelle: null },
        recycling:             { wert: "Gips aus dem Rückbau kann bei sortenreiner Trennung in ein Gips-Recycling gehen.", art: "beispiel", quelle: null }
      },
      vorteile: ["Günstig und schnell zu verarbeiten", "Nahezu nicht brennbar", "Glatte Oberfläche"],
      nachteile: ["Feuchteempfindlich (Standardplatte)", "Geringe mechanische Belastbarkeit"]
    },

    {
      id: "osb",
      name: "OSB-Platte",
      produkt: "Durchschnitt Deutschland (Thünen-Institut für Holzforschung)",
      kategorien: ["innenausbau"],
      anwendungen: ["innenausbau"],
      mengenmodell: "schicht",
      mengenhinweis: "Plattenwerkstoff in festen Dicken (z. B. 15 oder 18 mm). Die Dicke bitte entsprechend eingeben.",
      eigenschaften: {
        rohdichte:             { wert: 620,  einheit: "kg/m³", art: "beispiel", quelle: null },
        waermeleitfaehigkeit:  { wert: 0.13, einheit: "W/(m·K)", art: "beispiel", quelle: null },
        druckfestigkeit:       { wert: null, einheit: "N/mm²", art: null, quelle: null, nicht_anwendbar: true, hinweis: "Bei Platten ist die Biegefestigkeit maßgebend, nicht die Druckfestigkeit." },
        preis:                 { wert: 420,  einheit: "€/m³", art: "beispiel", quelle: null, mwst: "unbekannt", umfang: "unbekannt", hinweis: "Frei gewählter Demonstrationspreis, kein Marktpreis." },
        gwp:                   { werte: { gesamt: -620, fossil: 280, biogen: -900 }, einheit: "kg CO2e", deklarierte_einheit: "1 m³", module: "A1-A3", art: "beispiel", quelle: null, hinweis: "Biogen: im Holz gespeicherter Kohlenstoff. Er wird bei thermischer Verwertung am Lebensende wieder freigesetzt." },
        brandverhalten:        { wert: "D-s2,d0", art: "beispiel", quelle: null, hinweis: "Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils." },
        wasserdampf_mu:        { wert: 50,   einheit: "–", art: "beispiel", quelle: null },
        waermekapazitaet:      { wert: 1700, einheit: "J/(kg·K)", art: "beispiel", quelle: null },
        recycling:             { wert: "Altholzverwertung, meist thermisch. Die Klebstoffe sind zu berücksichtigen.", art: "beispiel", quelle: null }
      },
      vorteile: ["Robust und belastbar", "Leicht", "Einfach zu verarbeiten"],
      nachteile: ["Brennbar", "Feuchteempfindlich an Kanten", "Klebstoffanteil"]
    },

    /* ================= E: DACH ================= */

    {
      id: "dachziegel",
      name: "Dachziegel (Tonziegel)",
      produkt: "generisch, kein konkretes Herstellerprodukt",
      kategorien: ["dach"],
      anwendungen: ["dach"],
      mengenmodell: "keine_schicht",
      mengenhinweis: "Dachziegel bilden eine Deckung mit Überdeckung und Lattung, keine homogene Schicht. Die Schicht-Berechnung (Fläche × Dicke) ist deshalb deaktiviert.",
      eigenschaften: {
        rohdichte:             { wert: 1900, einheit: "kg/m³", art: "beispiel", quelle: null, hinweis: "Rohdichte des Scherbens, nicht Flächenmasse der Deckung." },
        waermeleitfaehigkeit:  { wert: null, einheit: "W/(m·K)", art: null, quelle: null, hinweis: "Noch nicht recherchiert. Kennwert fehlt." },
        druckfestigkeit:       { wert: null, einheit: "N/mm²", art: null, quelle: null, nicht_anwendbar: true, hinweis: "Bei Dachziegeln ist die Biegebruchlast maßgebend." },
        preis:                 { wert: null, einheit: "€/m²", art: null, quelle: null, mwst: null, umfang: null, hinweis: "Noch nicht recherchiert. Kennwert fehlt." },
        gwp:                   { werte: null, einheit: "kg CO2e", deklarierte_einheit: null, module: null, art: null, quelle: null, hinweis: "Noch nicht recherchiert. Kennwert fehlt." },
        brandverhalten:        { wert: "A1", art: "beispiel", quelle: null, hinweis: "Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils." },
        recycling:             { wert: "Intakte Ziegel sind gut wiederverwendbar, Bruch ist als Recyclingmaterial nutzbar.", art: "beispiel", quelle: null }
      },
      vorteile: ["Langlebig", "Nicht brennbar", "Wiederverwendbar"],
      nachteile: ["Schwer (Tragwerk muss die Last aufnehmen)", "Dachneigung und Unterkonstruktion sind zu beachten"]
    }

  ]
};
