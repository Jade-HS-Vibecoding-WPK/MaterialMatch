/* ==========================================================================
   MaterialMatch – Produktdaten (konkrete Produkte je Material)
   --------------------------------------------------------------------------
   Jedes Produkt gehört zu einem Material aus data/baustoffe.js und überschreibt
   nur die Kennwerte, für die ein Herstellerdatenblatt, eine ETA, eine EPD oder
   ein Händlerpreis vorliegt. Alle anderen Kennwerte kommen aus dem generischen
   Materialdatensatz (ÖKOBAUDAT, EU-Einstufung, Beispieldaten) und sind dort
   entsprechend gekennzeichnet.

   Aufbau eines Produkts:
     id, material (id des Materials), name, hersteller,
     standard   true = wird beim Start für das Material gewählt (höchstens ein Produkt je Material).
                Ein Standardprodukt gibt es nur, wenn es zum generischen Datensatz passt (z. B. ähnliche Rohdichte);
                sonst startet das Material als generischer Datensatz und das Produkt lässt sich wählen.
     datenblatt Quelle (id im Quellenkatalog) des Hauptdokuments
     beschreibung, eigenschaften { kennwert: { wert, einheit, art, quelle, hinweis } }

   Preise: je Preis Produkt, Händler, Preis, Einheit, Link und Abrufdatum stehen im
   Quelleneintrag (quellenart "Händlerpreis"); mwst und umfang stehen am Preis.
   Eigene Produkte der Nutzer:innen werden nicht hier, sondern im Browser gespeichert.
   Stand: 18.11.2026 (Datenpaket 3: STEICO-Datenblätter und -EPDs, Cirkel-Preisliste 2026 mit PORIT und KS-ORIGINAL; davor Datenpaket 2 vom 17.11.2026).
   ========================================================================== */

window.MATERIALMATCH_PRODUKTE = [
  {
    "id": "rockwool-fixrock-035",
    "material": "mineralwolle",
    "name": "ROCKWOOL Fixrock 035",
    "hersteller": "Deutsche ROCKWOOL GmbH & Co. KG",
    "standard": true,
    "datenblatt": "hersteller-rockwool-fixrock-035",
    "beschreibung": "Steinwolle-Fassadendämmplatte für vorgehängte hinterlüftete Fassaden (Ausgabe 07/2022).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.034,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-rockwool-fixrock-035",
        "hinweis": "Nennwert λD des Produkts Fixrock 035 (DIN EN 13162) laut Herstellerdatenblatt."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": 0.035,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-rockwool-fixrock-035",
        "hinweis": "Bemessungswert λB nach DIN 4108-4 laut Herstellerdatenblatt des Produkts Fixrock 035."
      },
      "brandverhalten": {
        "wert": "A1",
        "art": "richtwert",
        "quelle": "hersteller-rockwool-fixrock-035",
        "hinweis": "Euroklasse A1 (nichtbrennbar) laut Datenblatt Fixrock 035, DIN EN 13501-1. Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils."
      },
      "wasserdampf_mu": {
        "wert": 1,
        "einheit": "–",
        "art": "richtwert",
        "quelle": "hersteller-rockwool-fixrock-035",
        "hinweis": "Wasserdampf-Diffusionswiderstandszahl μ = 1 laut Datenblatt Fixrock 035 (DIN EN 12086)."
      }
    }
  },
  {
    "id": "rockwool-fixrock-033",
    "material": "mineralwolle",
    "name": "ROCKWOOL Fixrock 033",
    "hersteller": "Deutsche ROCKWOOL GmbH & Co. KG",
    "standard": false,
    "datenblatt": "hersteller-rockwool-fixrock-033",
    "beschreibung": "Steinwolle-Fassadendämmplatte mit niedrigerer Wärmeleitfähigkeit (Ausgabe 07/2022).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.032,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-rockwool-fixrock-033",
        "hinweis": "Nennwert λD des Produkts Fixrock 033 (DIN EN 13162) laut Herstellerdatenblatt."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": 0.033,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-rockwool-fixrock-033",
        "hinweis": "Bemessungswert λB nach DIN 4108-4 laut Herstellerdatenblatt des Produkts Fixrock 033."
      },
      "brandverhalten": {
        "wert": "A1",
        "art": "richtwert",
        "quelle": "hersteller-rockwool-fixrock-033",
        "hinweis": "Euroklasse A1 (nichtbrennbar) laut Datenblatt Fixrock 033, DIN EN 13501-1. Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils."
      },
      "wasserdampf_mu": {
        "wert": 1,
        "einheit": "–",
        "art": "richtwert",
        "quelle": "hersteller-rockwool-fixrock-033",
        "hinweis": "Wasserdampf-Diffusionswiderstandszahl μ = 1 laut Datenblatt Fixrock 033."
      }
    }
  },
  {
    "id": "rockwool-klemmrock-035",
    "material": "mineralwolle",
    "name": "ROCKWOOL Klemmrock 035",
    "hersteller": "Deutsche ROCKWOOL GmbH & Co. KG",
    "standard": false,
    "datenblatt": "hersteller-rockwool-klemmrock-035",
    "beschreibung": "Steinwolle-Klemmfilz als komprimierte Rolle für die Dämmung zwischen den Sparren (Ausgabe 04/2025).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.034,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-rockwool-klemmrock-035",
        "hinweis": "Nennwert λD des Produkts Klemmrock 035 (DIN EN 13162) laut Herstellerdatenblatt."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": 0.035,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-rockwool-klemmrock-035",
        "hinweis": "Bemessungswert λB nach DIN 4108-4 laut Herstellerdatenblatt des Produkts Klemmrock 035."
      },
      "brandverhalten": {
        "wert": "A1",
        "art": "richtwert",
        "quelle": "hersteller-rockwool-klemmrock-035",
        "hinweis": "Euroklasse A1 (nichtbrennbar) laut Datenblatt Klemmrock 035, DIN EN 13501-1. Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils."
      },
      "wasserdampf_mu": {
        "wert": 1,
        "einheit": "–",
        "art": "richtwert",
        "quelle": "hersteller-rockwool-klemmrock-035",
        "hinweis": "Wasserdampf-Diffusionswiderstandszahl μ = 1 laut Datenblatt Klemmrock 035 (DIN EN 12086)."
      },
      "preis": {
        "wert": 137.42,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preis-obi-rockwool-klemmrock-035-120",
        "mwst": "inkl. 19 % MwSt.",
        "umfang": "Material, Händlerpreis (ohne Transport und Einbau)",
        "bezugsdicke_m": 0.12,
        "hinweis": "Händlerpreis OBI (abgerufen 2026-11-16): 65,96 € je Verkaufseinheit à 4,0 m² bei 120 mm Dicke, inkl. 19 % MwSt. Umgerechnet auf den Rauminhalt: 65,96 € ÷ (4,0 m² × 0,12 m) = 137,42 €/m³. Der Preis gilt für 120 mm; bei anderer Dicke kann der Preis je m³ abweichen."
      }
    }
  },
  {
    "id": "bachl-eps-035-wdv",
    "material": "eps",
    "name": "BACHL EPS 035 WDV",
    "hersteller": "BACHL",
    "standard": true,
    "datenblatt": "hersteller-bachl-eps-035-wdv",
    "beschreibung": "EPS-Fassadendämmplatte für Wärmedämmverbundsysteme (Stand 02.04.2024).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.034,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-bachl-eps-035-wdv",
        "hinweis": "Nennwert λD (EU) des Produkts EPS 035 WDV (DIN EN 13163) laut Herstellerdatenblatt."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": 0.035,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-bachl-eps-035-wdv",
        "hinweis": "Bemessungswert λ („Bemessungswert (D)“) des Produkts EPS 035 WDV laut Herstellerdatenblatt."
      },
      "brandverhalten": {
        "wert": "E",
        "art": "richtwert",
        "quelle": "hersteller-bachl-eps-035-wdv",
        "hinweis": "Datenblatt EPS 035 WDV: Brandverhalten (DIN EN 13501-1) „RtF-E“, also Euroklasse E. Im Fassadensystem sind Brandschutzmaßnahmen nötig (Feuerwiderstand/Gesamtsystem separat bewerten)."
      }
    }
  },
  {
    "id": "bachl-eps-035-deo",
    "material": "eps",
    "name": "BACHL EPS 035 DEO dm",
    "hersteller": "BACHL",
    "standard": false,
    "datenblatt": "hersteller-bachl-eps-035-deo",
    "beschreibung": "EPS-Mehrzweckdämmplatte für Dach, Decke und Wand (Stand 03.04.2024).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.034,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-bachl-eps-035-deo",
        "hinweis": "Nennwert λD (EU) des Produkts EPS 035 DEO dm (DIN EN 13163) laut Herstellerdatenblatt."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": 0.035,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-bachl-eps-035-deo",
        "hinweis": "Bemessungswert λ („Bemessungswert (D)“) des Produkts EPS 035 DEO dm laut Herstellerdatenblatt."
      },
      "brandverhalten": {
        "wert": "E",
        "art": "richtwert",
        "quelle": "hersteller-bachl-eps-035-deo",
        "hinweis": "Datenblatt EPS 035 DEO dm: Brandverhalten (DIN EN 13501-1) „RtF-E“, also Euroklasse E."
      }
    }
  },
  {
    "id": "isocell-zellulose",
    "material": "zellulose",
    "name": "ISOCELL Zellulose Einblasdämmung",
    "hersteller": "ISOCELL GmbH & Co KG (Österreich)",
    "standard": true,
    "datenblatt": "hersteller-isocell-zellulose",
    "beschreibung": "Lose Einblasdämmung aus Zellulosefasern (ETA-06/0076).",
    "herstellerangaben": [
      {
        "id": "bemessungswert-deutschland",
        "bezeichnung": "Bemessungswert der Wärmeleitfähigkeit „Deutschland“ laut Herstellerdatenblatt",
        "wert": "0,039",
        "einheit": "W/(m·K)",
        "quelle": "hersteller-isocell-zellulose-de",
        "hinweis": "Herstellerangabe, kein bestätigter Bemessungswert für Deutschland: Eine gültige deutsche Zulassung oder ein anderer Verwendbarkeitsnachweis liegt nicht vor (Zulassung Z-23.11-1236 war nur bis 26.04.2021 gültig), DIN 4108-4 wurde nicht eingesehen. Die Angabe wird nur angezeigt und fließt nicht in Berechnungen, Diagramme oder Produktvergleiche ein."
      }
    ],
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.037,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-isocell-zellulose",
        "hinweis": "Nennwert der Wärmeleitfähigkeit laut Datenblatt ISOCELL Zellulose (ETA-06/0076)."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Das ISOCELL-Datenblatt nennt Bemessungswerte für Österreich (0,038), die Schweiz (0,037) und in der deutschen Fassung 0,039 W/(m·K) für Deutschland (Herstellerangabe). Ein Beleg aus einer gültigen deutschen Zulassung oder aus DIN 4108-4 liegt nicht vor: Die Zulassung Z-23.11-1236 war nur bis 26.04.2021 gültig (DIBt-Zulassungsdownload), DIN 4108-4 ist kostenpflichtig und wurde nicht eingesehen. Der Schweizer oder österreichische Wert wird nicht als deutscher Bemessungswert verwendet."
      },
      "brandverhalten": {
        "wert": "B-s2,d0",
        "art": "richtwert",
        "quelle": "hersteller-isocell-zellulose",
        "hinweis": "Datenblatt ISOCELL Zellulose, Angabe für Österreich: „≥ 100 mm / B-s2, d0“ (EN 13501-1), also nur ab 100 mm Einbaudicke. Für Deutschland nennt das deutsche Datenblatt „B2 nach DIN 4102“. Die Klasse hängt von Einbaudicke und Region ab. Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils."
      },
      "wasserdampf_mu": {
        "wert": 3,
        "einheit": "–",
        "art": "richtwert",
        "quelle": "hersteller-isocell-zellulose",
        "hinweis": "Wasserdampf-Diffusionswiderstandszahl μ = 3 laut Datenblatt ISOCELL Zellulose."
      },
      "waermekapazitaet": {
        "wert": 2110,
        "einheit": "J/(kg·K)",
        "art": "richtwert",
        "quelle": "hersteller-isocell-zellulose",
        "hinweis": "Spezifische Wärmekapazität 2,11 kJ/(kg·K) laut Datenblatt ISOCELL Zellulose, hier in J/(kg·K) umgerechnet (× 1000)."
      }
    }
  },
  {
    "id": "steico-flex-036",
    "material": "holzfaserdaemmung",
    "name": "STEICOflex 036",
    "hersteller": "STEICO SE",
    "standard": false,
    "datenblatt": "hersteller-steico-flex-036",
    "beschreibung": "Flexible Holzfaser-Dämmmatte für die Gefachdämmung (Rohdichte ca. 50 kg/m³, Version 20 des Merkblatts).",
    "eigenschaften": {
      "rohdichte": {
        "wert": 50,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "hersteller-steico-flex-036",
        "hinweis": "Rohdichte „~ 50 kg/m³“ laut Technischem Merkblatt STEICOflex 036 (Gewicht je m² und Dicke stimmen damit überein, z. B. 5,00 kg/m² bei 100 mm). Der generische ÖKOBAUDAT-Datensatz des Materials (160 kg/m³, Nassverfahren) gilt für ein anderes Produkt."
      },
      "waermeleitfaehigkeit": {
        "wert": 0.036,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-steico-flex-036",
        "hinweis": "Nennwert λD des Produkts STEICOflex 036 laut Technischem Merkblatt."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": 0.038,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-steico-flex-036",
        "hinweis": "Bemessungswert λB für Deutschland laut Technischem Merkblatt STEICOflex 036 (Österreich 0,037, Schweiz 0,036 – diese gelten nicht für Deutschland)."
      },
      "brandverhalten": {
        "wert": "E",
        "art": "richtwert",
        "quelle": "hersteller-steico-flex-036",
        "hinweis": "Euroklasse E nach DIN EN 13501-1 laut Technischem Merkblatt. Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils."
      },
      "wasserdampf_mu": {
        "wert": 2,
        "einheit": "–",
        "art": "richtwert",
        "quelle": "hersteller-steico-flex-036",
        "hinweis": "Wasserdampf-Diffusionswiderstandszahl μ = 2 laut Technischem Merkblatt."
      },
      "waermekapazitaet": {
        "wert": 2100,
        "einheit": "J/(kg·K)",
        "art": "richtwert",
        "quelle": "hersteller-steico-flex-036",
        "hinweis": "Spezifische Wärmekapazität c = 2.100 J/(kg·K) laut Technischem Merkblatt."
      },
      "preis": {
        "wert": 112.88,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preis-obi-steico-flex-036-100",
        "mwst": "inkl. 19 % MwSt.",
        "umfang": "Material, Händlerpreis (ohne Transport und Einbau)",
        "bezugsdicke_m": 0.1,
        "hinweis": "Händlerpreis OBI (abgerufen 2026-11-16): 31,72 € je Verkaufseinheit à 2,81 m² bei 100 mm Dicke, inkl. 19 % MwSt. Umgerechnet auf den Rauminhalt: 31,72 € ÷ (2,81 m² × 0,10 m) = 112,88 €/m³. Der Preis gilt für 100 mm; bei anderer Dicke kann der Preis je m³ abweichen."
      },
      "gwp": {
        "werte": {
          "gesamt": -4.7,
          "fossil": 7.1,
          "biogen": -12,
          "luluc": 0.015
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 m²",
        "bezugsdicke_m": 0.14,
        "module": "A1-A3",
        "art": "verifiziert",
        "quelle": "epd-steico-flex-036",
        "hinweis": "Produktspezifische, extern verifizierte EPD (niederländisch, SHR-Rapport 23.0053, gültig bis 10.10.2029): Werte je 1 m² bei 140 mm Dicke, Modul A1–A3, Indikatorsatz „Set 2“ (EN 15804+A2). Die EPD nennt: Climate change −4,7 (A1–A3), fossil 7,1, biogen −12, Landnutzung 0,015 kg CO₂e; Werte skalieren laut EPD linear mit der Dicke. Die Werte sind in der EPD auf zwei Stellen gerundet. GWP-gesamt enthält die Aufnahme von biogenem Kohlenstoff (negativ); nur bei gleicher Systemgrenze mit anderen Materialien vergleichen."
      }
    }
  },
  {
    "id": "steico-universal",
    "material": "holzfaserdaemmung",
    "name": "STEICOuniversal",
    "hersteller": "STEICO SE",
    "standard": false,
    "datenblatt": "hersteller-steico-universal",
    "beschreibung": "Unterdeck- und Wandbauplatte aus Holzfasern im Nassverfahren (Rohdichte ca. 270 kg/m³, Version 20 des Merkblatts).",
    "eigenschaften": {
      "rohdichte": {
        "wert": 270,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "hersteller-steico-universal",
        "hinweis": "Rohdichte „~ 270 kg/m³“ laut Technischem Merkblatt STEICOuniversal. Der generische ÖKOBAUDAT-Datensatz des Materials (160 kg/m³) gilt für ein anderes Produkt."
      },
      "waermeleitfaehigkeit": {
        "wert": 0.048,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-steico-universal",
        "hinweis": "Nennwert λD des Produkts STEICOuniversal laut Technischem Merkblatt."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": 0.05,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-steico-universal",
        "hinweis": "Bemessungswert λB für Deutschland laut Technischem Merkblatt STEICOuniversal (Österreich 0,053, Schweiz 0,048 – diese gelten nicht für Deutschland)."
      },
      "brandverhalten": {
        "wert": "E",
        "art": "richtwert",
        "quelle": "hersteller-steico-universal",
        "hinweis": "Euroklasse E nach DIN EN 13501-1 laut Technischem Merkblatt. Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils."
      },
      "wasserdampf_mu": {
        "wert": 5,
        "einheit": "–",
        "art": "richtwert",
        "quelle": "hersteller-steico-universal",
        "hinweis": "Wasserdampf-Diffusionswiderstandszahl μ = 5 laut Technischem Merkblatt."
      },
      "waermekapazitaet": {
        "wert": 2100,
        "einheit": "J/(kg·K)",
        "art": "richtwert",
        "quelle": "hersteller-steico-universal",
        "hinweis": "Spezifische Wärmekapazität c = 2.100 J/(kg·K) laut Technischem Merkblatt."
      },
      "preis": {
        "wert": null,
        "einheit": "€/m³",
        "art": null,
        "quelle": null,
        "hinweis": "Preis nicht verfügbar: Für dieses Produkt wurde kein verlässlicher Händlerpreis abgerufen."
      },
      "gwp": {
        "werte": {
          "gesamt": -310,
          "fossil": 148,
          "biogen": -459,
          "luluc": 1.11
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 m³",
        "module": "A1-A3",
        "art": "richtwert",
        "quelle": "epd-steico-universal",
        "hinweis": "Produktspezifische EPD des Herstellers (EPD Global, NEPD-11336-11336-2, ausgestellt 27.03.2026, gültig bis 26.03.2031): Werte je 1 m³, Module A1–A3 (EN 15804+A2). GWP gesamt -310, fossil 148, biogen -459, luluc 1,11 kg CO₂e/m³. Der Gesamtwert ist negativ, weil biogener Kohlenstoff gespeichert ist; er wird deshalb nicht farbig bewertet, maßgeblich ist der fossile Anteil. Die EPD wurde mit dem EPD-Tool Emidat erstellt (keine Einzelprüfung der EPD genannt, siehe Quelle)."
      }
    }
  },
  {
    "id": "thermo-hanf-premium",
    "material": "hanfdaemmung",
    "name": "THERMO HANF PREMIUM",
    "hersteller": "HempFlax Building Solutions GmbH",
    "standard": true,
    "datenblatt": "eta-thermo-hanf",
    "beschreibung": "Hanffaser-Dämmmatte (ETA-05/0037 vom 6. Mai 2025; PREMIUM PLUS und COMBI JUTE: λD 0,043).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.041,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "eta-thermo-hanf",
        "hinweis": "Nennwert λD(23,50) = 0,041 W/(m·K) für THERMO HANF PREMIUM laut ETA-05/0037 (Mai 2025), bei 23 °C und 50 % relativer Luftfeuchte. Rohdichte laut ETA 35–48 kg/m³ (Datensatz: 38 kg/m³)."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Der Bemessungswert ist laut ETA nach nationalen Regeln festzulegen und steht nicht darin; ein Wert nach DIN 4108-4 oder aus einer deutschen Zulassung liegt nicht vor."
      },
      "brandverhalten": {
        "wert": "E",
        "art": "richtwert",
        "quelle": "eta-thermo-hanf",
        "hinweis": "Euroklasse E nach EN 13501-1 (Prüfung nach EN ISO 11925-2) für alle drei Produkte der ETA-05/0037. Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils."
      }
    }
  },
  {
    "id": "saglan-sr30",
    "material": "glaswolle",
    "name": "SAGLAN (032) SR 30",
    "hersteller": "Sager AG (Schweiz)",
    "standard": true,
    "datenblatt": "hersteller-sager-saglan-sr30",
    "beschreibung": "Halbsteife, selbstklemmende Glaswolle-Dämmplatte (Datenblatt 03/2012).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.032,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-sager-saglan-sr30",
        "hinweis": "Nennwert λD (DIN EN 12667) des Produkts SAGLAN (032) SR 30 laut Produktdatenblatt der Sager AG (03/2012). Rohdichte „ca. 30 kg/m³“ passt zum ÖKOBAUDAT-Datensatz (30 kg/m³)."
      },
      "brandverhalten": {
        "wert": "A1",
        "art": "richtwert",
        "quelle": "hersteller-sager-saglan-sr30",
        "hinweis": "Datenblatt SAGLAN (032) SR 30: Brandverhalten „6q.3 / A1“ (schweizerische Brandkennziffer 6q.3, Euroklasse A1 nach DIN EN 13501-1). Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils."
      },
      "wasserdampf_mu": {
        "wert": 1,
        "einheit": "–",
        "art": "richtwert",
        "quelle": "hersteller-sager-saglan-sr30",
        "hinweis": "Wasserdampfdiffusion „MU1“ (Diffusionswiderstandszahl μ = 1, DIN EN 12086) laut Datenblatt SAGLAN (032) SR 30."
      }
    }
  },
  {
    "id": "rheinzink-classic",
    "material": "zinkblech",
    "name": "RHEINZINK-CLASSIC",
    "hersteller": "RHEINZINK GmbH & Co. KG",
    "standard": true,
    "datenblatt": "hersteller-rheinzink-produktlinien",
    "beschreibung": "Walzzink (Werkstoffeigenschaften der RHEINZINK-Legierung laut Broschüre 2025).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 110,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-rheinzink-produktlinien",
        "hinweis": "Wärmeleitzahl 110 W/(m·K) des Zinkwerkstoffs laut RHEINZINK-Broschüre (nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet). Für eine Schicht-R-Wert-Berechnung ist ein Metallblech nicht sinnvoll."
      }
    }
  },
  {
    "id": "holcim-beton-c25-30-na4334",
    "material": "normalbeton",
    "name": "Holcim Transportbeton C25/30 (Art.-Nr. NA4334)",
    "hersteller": "Holcim Beton und Betonwaren GmbH",
    "standard": true,
    "datenblatt": "preisliste-holcim-west-2026-na4334",
    "beschreibung": "Transportbeton C25/30 für bewehrte Außenbauteile (XC4 XF1 XA1, Konsistenz F3, Größtkorn 32 mm, mittlere Festigkeitsentwicklung); Listenpreis aus der Preisliste Bereich West, gültig ab 1. Januar 2026. Die Preisliste enthält keine Technikwerte außer der Festigkeitsklasse; alle anderen Kennwerte stammen aus dem generischen Datensatz.",
    "eigenschaften": {
      "preis": {
        "wert": 204.5,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-holcim-west-2026-na4334",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Listenpreis Transportbeton, ohne Zuschläge, Betonförderung und Einbau)",
        "hinweis": "Preisliste Holcim Bereich West (gültig ab 1. Januar 2026), Listenpreis netto 204,50 €/m³ für Art.-Nr. NA4334; kein aktuell abgerufener Händlerpreis. Zuschläge (Saison, Mindermenge, Kleinmenge, CO₂/Nachhaltigkeit, Diesel), Betonförderung und Umsatzsteuer kommen hinzu; Verfügbarkeit ist werksspezifisch."
      },
      "druckfestigkeit": {
        "wert": 25,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-holcim-west-2026-na4334",
        "hinweis": "Festigkeitsklasse C25/30 laut Preisliste; 25 ist die charakteristische Zylinderdruckfestigkeit in N/mm² nach der Klassenbezeichnung (DIN EN 206), kein gemessener Wert."
      }
    }
  },
  {
    "id": "ytong-pp2-040",
    "material": "porenbeton",
    "name": "Ytong PP 2-0,40 (Planblock)",
    "hersteller": "Xella Deutschland GmbH",
    "standard": true,
    "datenblatt": "hersteller-xella-ytong-produktuebersicht-2026",
    "beschreibung": "Porenbeton-Planblock der Festigkeitsklasse 2 und Rohdichteklasse 0,40 (DIN EN 771-4 / DIN 20000-404). In der Preisliste 2026 ist für dieses Produkt kein Preis aufgeführt.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.1,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-xella-ytong-produktuebersicht-2026",
        "hinweis": "Wärmeleitfähigkeit λ = 0,10 W/(m·K) des Produkts Ytong PP 2-0,40 laut Übersicht technische Daten der Xella-Preisliste 2026 (nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet). Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung wurde nicht eingesehen."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 2,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "hersteller-xella-ytong-produktuebersicht-2026",
        "hinweis": "Festigkeitsklasse 2 (PP 2) laut Übersicht technische Daten der Xella-Preisliste 2026. Klassenwert wie im Materialdatensatz (Porenbeton, Festigkeitsklasse PP2 = 2), keine gemessene Druckfestigkeit des Steins."
      }
    }
  },
  {
    "id": "ytong-pp2-035-thermstandard-365",
    "material": "porenbeton",
    "name": "Ytong ThermStandard PP 2-0,35, 365 mm",
    "hersteller": "Xella Deutschland GmbH",
    "standard": false,
    "datenblatt": "preisliste-xella-ytong-pp2-035-365",
    "beschreibung": "Porenbeton-Planblock der Festigkeitsklasse 2 und Rohdichteklasse 0,35, Wanddicke 365 mm; Listenpreis aus der Xella-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.09,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "preisliste-xella-ytong-pp2-035-365",
        "hinweis": "Wärmeleitfähigkeit λ = 0,09 W/(m·K) der Zeile „Ytong ThermStandard PP 2-0,35“ in der Xella-Preisliste 2026 (nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet). Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung wurde nicht eingesehen."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "rohdichte": {
        "wert": null,
        "einheit": "kg/m³",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Die Preisliste nennt nur die Rohdichteklasse 0,35, keinen Wert in kg/m³; der generische Wert (380 kg/m³) gilt für Rohdichteklasse 0,40. Benötigt: Leistungserklärung oder Datenblatt des Produkts."
      },
      "gwp": {
        "werte": null,
        "einheit": "kg CO2e",
        "deklarierte_einheit": null,
        "module": null,
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Der generische ÖKOBAUDAT-Datensatz gilt für Porenbeton der Rohdichteklasse 0,40; eine produktspezifische EPD für Ytong PP 2-0,35 wurde nicht gelesen."
      },
      "preis": {
        "wert": 210.6,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-xella-ytong-pp2-035-365",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Frankopreis laut Xella-Preisliste 2026, ohne Mörtel, Logistikpauschale und Entladung)",
        "hinweis": "Preisliste Xella 2026 („gültig ab 6. April“), Frankopreis 210,60 €/m³ für 365 mm, netto; kein aktuell abgerufener Händlerpreis. Dünnbettmörtel, Logistikpauschale, Entladung und Umsatzsteuer kommen hinzu; Preise anderer Wanddicken weichen ab.",
        "bezugsdicke_m": 0.365
      },
      "druckfestigkeit": {
        "wert": 2,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-xella-ytong-pp2-035-365",
        "hinweis": "Festigkeitsklasse 2 (PP 2) laut Xella-Preisliste 2026. Klassenwert wie im Materialdatensatz (Porenbeton, Festigkeitsklasse PP2 = 2), keine gemessene Druckfestigkeit des Steins."
      }
    }
  },
  {
    "id": "poroton-planziegel-t8-365",
    "material": "hochlochziegel",
    "name": "Poroton-Planziegel-T8-36,5",
    "hersteller": "Wienerberger GmbH",
    "standard": true,
    "datenblatt": "hersteller-wienerberger-poroton-t8-365",
    "beschreibung": "Porosierter Hochlochziegel (Planziegel, unverfüllt) für monolithische Außenwände, 248 × 365 × 249 mm, Rohdichteklasse 0,60, Druckfestigkeitsklasse 6; die Herstellerseite nennt die Nummer Z-17.1-1085 (Gültigkeit nicht geprüft). Ein Preis wurde nicht gefunden.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.08,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-t8-365",
        "hinweis": "Wärmeleitfähigkeit λR = 0,08 W/(m·K) des Produkts Poroton-Planziegel-T8-36,5 laut Herstellerseite (nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet). Der Bemessungswert nach der Zulassung Z-17.1-1085 wurde nicht übernommen, weil die Zulassung nicht auf Gültigkeit geprüft wurde."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 6,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-t8-365",
        "hinweis": "Druckfestigkeitsklasse 6 laut Herstellerseite (Steindruckfestigkeit in N/mm², keine Festigkeit des Mauerwerks). Die Seite nennt für das Mauerwerk eine charakteristische Druckfestigkeit fk = 2,30 MN/m²; Rohdichteklasse 0,60."
      }
    }
  },
  {
    "id": "kvh-epd-2026",
    "material": "konstruktionsvollholz",
    "name": "Konstruktionsvollholz KVH® (EPD der Überwachungsgemeinschaft)",
    "hersteller": "Überwachungsgemeinschaft Konstruktionsvollholz e.V. (Durchschnitt der Mitgliedswerke)",
    "standard": false,
    "datenblatt": "epd-kvh-2026",
    "beschreibung": "Konstruktionsvollholz KVH® aus Nadelholz, mittlere Rohdichte 480 kg/m³; Werte aus der IBU-EPD vom 28.04.2026 (Durchschnitt, kein einzelnes Werk). Ein Preis wurde nicht gefunden.",
    "eigenschaften": {
      "rohdichte": {
        "wert": 480,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "epd-kvh-2026",
        "hinweis": "Mittlere Rohdichte 480 kg/m³ (gemittelt über alle Festigkeitsklassen und Rohdichten) laut EPD, zugleich Rohdichte der deklarierten Einheit."
      },
      "waermeleitfaehigkeit": {
        "wert": 0.13,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "epd-kvh-2026",
        "hinweis": "Wärmeleitfähigkeit 0,13 W/(m·K) senkrecht zur Faser nach DIN EN 12664 laut EPD (deklarierter Wert). Die EPD weist darauf hin, dass Bemessungswerte aus den deklarierten Werten nach DIN 4108-4 zu ermitteln sind."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "gwp": {
        "werte": {
          "gesamt": -582.6,
          "fossil": 188.9,
          "biogen": -770.84
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 m³",
        "module": "A1-A3",
        "art": "richtwert",
        "quelle": "epd-kvh-2026",
        "hinweis": "Summe der Module A1, A2 und A3 der EPD je 1 m³ KVH® (GWP-total −748 + 16,4 + 149; GWP-fossil 23,5 + 16,4 + 149; GWP-biogen −771 + 0,07 + 0,09 kg CO₂-Äq.; Landnutzungsänderung nicht deklariert). Von uns addiert, nicht als Summe in der EPD angegeben. GWP-gesamt enthält die Aufnahme von biogenem Kohlenstoff (negativ); dieser wird am Lebensende wieder freigesetzt (Modul C3 +780). Nur bei gleicher Systemgrenze mit anderen Materialien vergleichen."
      }
    }
  },
  {
    "id": "egger-osb3-top",
    "material": "osb",
    "name": "EGGER OSB 3 TOP",
    "hersteller": "EGGER Holzwerkstoffe Wismar GmbH & Co KG",
    "standard": true,
    "datenblatt": "dop-egger-osb3-top-734-04",
    "beschreibung": "OSB-3-Platte für tragende Zwecke im Trocken- und Feuchtbereich, Plattendicke 6 bis 40 mm (Leistungserklärung DOP-734-04 vom 23.06.2026). Ein Preis wurde nicht gefunden.",
    "eigenschaften": {
      "rohdichte": {
        "wert": 600,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "dop-egger-osb3-top-734-04",
        "hinweis": "Mindestrohdichte ≥ 600 kg/m³ nach EN 323 laut Leistungserklärung (Mindestwert, die tatsächliche Rohdichte kann höher sein)."
      },
      "waermeleitfaehigkeit": {
        "wert": 0.13,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "dop-egger-osb3-top-734-04",
        "hinweis": "Wärmeleitfähigkeit 0,13 W/(m·K) laut Leistungserklärung (nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet)."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "brandverhalten": {
        "wert": "E",
        "art": "richtwert",
        "quelle": "dop-egger-osb3-top-734-04",
        "hinweis": "Klasse E „ohne Einschränkung“ laut Leistungserklärung; die Klasse D-s2,d0 gilt nur ab 9 mm Dicke unter bestimmten Einbaubedingungen (Untergrund, Luftspalt). Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils."
      }
    }
  },
  {
    "id": "siniat-lagyp-125",
    "material": "gipskarton",
    "name": "Siniat LaGyp (Typ A / GKB), 12,5 mm – österreichisches Datenblatt",
    "hersteller": "Etex Building Performance GmbH (Siniat, Österreich)",
    "standard": false,
    "datenblatt": "hersteller-siniat-lagyp-at-2026",
    "beschreibung": "Standard-Gipsplatte (Typ A, GKB), österreichisches Produktdatenblatt, Stand April 2026. Die Werte gelten laut Datenblatt für Österreich und sind für Deutschland nicht bestätigt. Ein Preis wurde nicht gefunden.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.21,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-siniat-lagyp-at-2026",
        "hinweis": "Wärmeleitfähigkeit λR = 0,21 W/(m·K) nach EN ISO 10456 laut österreichischem Datenblatt der Siniat LaGyp (nicht ausdrücklich Nenn- oder Bemessungswert; für Deutschland nicht bestätigt)."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "wasserdampf_mu": {
        "wert": 10,
        "einheit": "–",
        "art": "richtwert",
        "quelle": "hersteller-siniat-lagyp-at-2026",
        "hinweis": "Wasserdampf-Diffusionswiderstandszahl μ = 10 (trocken; feucht 4) nach EN ISO 10456 laut österreichischem Datenblatt der Siniat LaGyp."
      },
      "brandverhalten": {
        "wert": "A2-s1,d0",
        "art": "richtwert",
        "quelle": "hersteller-siniat-lagyp-at-2026",
        "hinweis": "Klasse A2-s1,d0 nach EN 13501-1 laut österreichischem Datenblatt der Siniat LaGyp. Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils."
      }
    }
  },
  {
    "id": "profibaustoffe-estrich-ct-c20-f4",
    "material": "zementestrich",
    "name": "PROFI ESTRICH CT-C20-F4 (E225), Silo – Preisliste Österreich",
    "hersteller": "Profibaustoffe Austria GmbH",
    "standard": false,
    "datenblatt": "preisliste-profibaustoffe-2026-estrich-ct-c20-f4",
    "beschreibung": "Zementestrich CT-C20-F4 (E225) als Silo-Trockenmischung; nur ein Listenpreis aus Österreich (Seite 122 der Preisliste), keine Technikwerte übernommen.",
    "eigenschaften": {
      "preis": {
        "wert": 458.7,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-profibaustoffe-2026-estrich-ct-c20-f4",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Trockenmischung laut Preisliste Österreich, ohne Zustellung, Wasser und Einbau)",
        "hinweis": "Preisliste Profibaustoffe Austria 2026 für Österreich (unverbindliche Preisempfehlung, gültig ab 01.01.2026 in Wien, Niederösterreich und im nördlichen Burgenland): PROFI ESTRICH CT-C20-F4 (E225) 229,35 €/t netto, umgerechnet mit dem Verbrauch der Liste (ca. 20 kg/m²/cm = 2000 kg/m³) auf €/m³. Kein deutscher Marktpreis und kein aktuell abgerufener Händlerpreis; die Umrechnung über den „ca.“-Verbrauch ist orientierend."
      }
    }
  },
  {
    "id": "profibaustoffe-mz1",
    "material": "kalkzementputz",
    "name": "PROFI MZ1 1,2 MM Kalk-Zement-Maschinenputz, Silo – Preisliste Österreich",
    "hersteller": "Profibaustoffe Austria GmbH",
    "standard": false,
    "datenblatt": "preisliste-profibaustoffe-2026-mz1",
    "beschreibung": "Kalk-Zement-Maschinenputz MZ1 (Grundputz innen und außen) als Silo-Trockenmischung; nur ein Listenpreis aus Österreich (Seite 25 der Preisliste), keine Technikwerte übernommen.",
    "eigenschaften": {
      "preis": {
        "wert": 654.99,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-profibaustoffe-2026-mz1",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Trockenmischung laut Preisliste Österreich, ohne Zustellung, Wasser und Einbau)",
        "hinweis": "Preisliste Profibaustoffe Austria 2026 für Österreich (unverbindliche Preisempfehlung, gültig ab 01.01.2026 in Wien, Niederösterreich und im nördlichen Burgenland): PROFI MZ1 1 467,85 €/t netto, umgerechnet mit dem Verbrauch der Liste (ca. 14 kg/m²/cm = 1400 kg/m³) auf €/m³. Kein deutscher Marktpreis und kein aktuell abgerufener Händlerpreis; die Umrechnung über den „ca.“-Verbrauch ist orientierend."
      }
    }
  },
  {
    "id": "profibaustoffe-fliessbeton-dc25-30",
    "material": "normalbeton",
    "name": "PROFI FLIESSBETON DC25/30 (XF1/XF3), Silo – Preisliste Österreich",
    "hersteller": "Profibaustoffe Austria GmbH",
    "standard": false,
    "datenblatt": "preisliste-profibaustoffe-2026-fliessbeton-dc25-30",
    "beschreibung": "Werksgemischter Verfüll- und Trockenbeton DC25/30, kein Transportbeton; nur ein Listenpreis aus Österreich (Seite 158 der Preisliste), keine Technikwerte übernommen. Der Preis ist nicht mit Transportbeton vergleichbar.",
    "eigenschaften": {
      "preis": {
        "wert": 831.7,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-profibaustoffe-2026-fliessbeton-dc25-30",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Trockenmischung laut Preisliste Österreich, ohne Zustellung, Wasser und Einbau)",
        "hinweis": "Preisliste Profibaustoffe Austria 2026 für Österreich (unverbindliche Preisempfehlung, gültig ab 01.01.2026 in Wien, Niederösterreich und im nördlichen Burgenland): PROFI FLIESSBETON DC25/30 (XF1/XF3) 415,85 €/t netto, umgerechnet mit dem Verbrauch der Liste (ca. 20 kg/m²/cm = 2000 kg/m³) auf €/m³. Kein deutscher Marktpreis und kein aktuell abgerufener Händlerpreis; die Umrechnung über den „ca.“-Verbrauch ist orientierend."
      }
    }
  },
  {
    "id": "ytong-epd-2-5-040",
    "material": "porenbeton",
    "name": "Ytong Porenbeton 2.5/0.40 (Xella, Hersteller-EPD)",
    "hersteller": "Xella Deutschland GmbH",
    "standard": false,
    "datenblatt": "oebd-880239e9",
    "beschreibung": "Unbewehrte Ytong-Porenbetonbausteine der Rohdichteklasse 0,40 (Festigkeit „2.5“ laut Datensatz); Umweltdaten aus der Hersteller-EPD (ÖKOBAUDAT). Ob der Datensatz zum Planblock „PP 2-0,40“ der Xella-Preisliste gehört, ist im Datensatz nicht ausgewiesen, deshalb ist es ein eigenes Produkt. Ein Preis wurde nicht gefunden.",
    "eigenschaften": {
      "rohdichte": {
        "wert": 383.0,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "oebd-880239e9",
        "hinweis": "Rohdichte 383 kg/m³ laut ÖKOBAUDAT-Datensatz „Ytong Porenbeton 2.5/0.40 RO - Unbewehrte Porenbetonbausteine“ (Xella Deutschland GmbH), zugleich Rohdichte der deklarierten Einheit."
      },
      "gwp": {
        "werte": {
          "gesamt": 171.996985058434,
          "fossil": 176.74394086252,
          "biogen": -4.79908057965787,
          "luluc": 0.0521247755726153
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 m³",
        "module": "A1-A3",
        "art": "richtwert",
        "quelle": "oebd-880239e9",
        "hinweis": "ÖKOBAUDAT-Datensatz „Ytong Porenbeton 2.5/0.40 RO - Unbewehrte Porenbetonbausteine“ (produktspezifisch; Xella Deutschland GmbH, Registrierung EPD-XEL-20240161-IBA1-DE), Module A1–A3 je 1 m³. Primärenergie laut Datensatz (nicht berechnet): erneuerbar gesamt (PERT) 231,6 MJ, nicht erneuerbar gesamt (PENRT) 1269,7 MJ. GWP-gesamt enthält die Aufnahme von biogenem Kohlenstoff (negativ, falls vorhanden); nur bei gleicher Systemgrenze mit anderen Materialien vergleichen."
      }
    }
  },
  {
    "id": "egger-osb-epd",
    "material": "osb",
    "name": "EGGER OSB-Platten (Durchschnitts-EPD)",
    "hersteller": "Fritz EGGER GmbH & Co. OG",
    "standard": false,
    "datenblatt": "oebd-766ea5bd",
    "beschreibung": "OSB-Platten von EGGER; Umweltdaten aus dem Durchschnittsdatensatz des Herstellers über seine OSB-Platten (ÖKOBAUDAT). Eine bestimmte Sorte (z. B. OSB 3 TOP) ist im Datensatz nicht ausgewiesen. Ein Preis wurde nicht gefunden.",
    "eigenschaften": {
      "rohdichte": {
        "wert": 611.0,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "oebd-766ea5bd",
        "hinweis": "Rohdichte 611 kg/m³ laut ÖKOBAUDAT-Datensatz „EGGER OSB-Platten“ (Fritz EGGER GmbH & Co. OG), zugleich Rohdichte der deklarierten Einheit."
      },
      "gwp": {
        "werte": {
          "gesamt": -805.367358948675,
          "fossil": 172.249356295023,
          "biogen": -977.920121823849,
          "luluc": 0.303406580151698
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 m³",
        "module": "A1-A3",
        "art": "richtwert",
        "quelle": "oebd-766ea5bd",
        "hinweis": "ÖKOBAUDAT-Datensatz „EGGER OSB-Platten“ (Durchschnittsdatensatz; Fritz EGGER GmbH & Co. OG, Registrierung EPD-EGG-20240403-IBD2-DE), Module A1–A3 je 1 m³. Primärenergie laut Datensatz (nicht berechnet): erneuerbar gesamt (PERT) 34518,9 MJ, nicht erneuerbar gesamt (PENRT) 3970,9 MJ. GWP-gesamt enthält die Aufnahme von biogenem Kohlenstoff (negativ, falls vorhanden); nur bei gleicher Systemgrenze mit anderen Materialien vergleichen."
      }
    }
  },
  {
    "id": "kronospan-osb",
    "material": "osb",
    "name": "Kronospan OSB (Hersteller-EPD)",
    "hersteller": "Kronospan Luxembourg S.A.",
    "standard": false,
    "datenblatt": "oebd-22527f3b",
    "beschreibung": "OSB-Platte von Kronospan; Umweltdaten aus der Hersteller-EPD (ÖKOBAUDAT). Plattenklasse und Plattendicke sind im Datensatz nicht ausgewiesen. Ein Preis wurde nicht gefunden.",
    "eigenschaften": {
      "rohdichte": {
        "wert": 630.0,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "oebd-22527f3b",
        "hinweis": "Rohdichte 630 kg/m³ laut ÖKOBAUDAT-Datensatz „Kronospan OSB panel“ (Kronospan Luxembourg S.A.), zugleich Rohdichte der deklarierten Einheit."
      },
      "gwp": {
        "werte": {
          "gesamt": -1219.69133286723,
          "fossil": 217.60065735196,
          "biogen": -1439.20888589527,
          "luluc": 1.91688015555704
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 m³",
        "module": "A1-A3",
        "art": "richtwert",
        "quelle": "oebd-22527f3b",
        "hinweis": "ÖKOBAUDAT-Datensatz „Kronospan OSB panel“ (produktspezifisch; Kronospan Luxembourg S.A., Registrierung EPD-KRO-20230157-CBA1-EN), Module A1–A3 je 1 m³. Primärenergie laut Datensatz (nicht berechnet): erneuerbar gesamt (PERT) 15584,4 MJ, nicht erneuerbar gesamt (PENRT) 4776,0 MJ. GWP-gesamt enthält die Aufnahme von biogenem Kohlenstoff (negativ, falls vorhanden); nur bei gleicher Systemgrenze mit anderen Materialien vergleichen."
      }
    }
  },
  {
    "id": "hasslacher-bsp",
    "material": "brettsperrholz",
    "name": "HASSLACHER Brettsperrholz (CLT, Durchschnitts-EPD)",
    "hersteller": "HASSLACHER Holding GmbH",
    "standard": false,
    "datenblatt": "oebd-7688e355",
    "beschreibung": "Brettsperrholz (Cross Laminated Timber) von HASSLACHER; Umweltdaten aus der Durchschnitts-EPD des Herstellers (ÖKOBAUDAT). Ein Preis wurde nicht gefunden.",
    "eigenschaften": {
      "rohdichte": {
        "wert": 470.0,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "oebd-7688e355",
        "hinweis": "Rohdichte 470 kg/m³ laut ÖKOBAUDAT-Datensatz „Brettsperrholz HASSLACHER CROSS LAMINATED TIMBER“ (HASSLACHER Holding GmbH), zugleich Rohdichte der deklarierten Einheit."
      },
      "gwp": {
        "werte": {
          "gesamt": -660.122358965634,
          "fossil": 92.9712062090572,
          "biogen": -753.765247030535,
          "luluc": 0.671681855844195
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 m³",
        "module": "A1-A3",
        "art": "richtwert",
        "quelle": "oebd-7688e355",
        "hinweis": "ÖKOBAUDAT-Datensatz „Brettsperrholz HASSLACHER CROSS LAMINATED TIMBER“ (Durchschnittsdatensatz; HASSLACHER Holding GmbH, Registrierung EPD-HAS-20210172-IBD1-DE), Module A1–A3 je 1 m³. Primärenergie laut Datensatz (nicht berechnet): erneuerbar gesamt (PERT) 10847,9 MJ, nicht erneuerbar gesamt (PENRT) 1360,8 MJ. GWP-gesamt enthält die Aufnahme von biogenem Kohlenstoff (negativ, falls vorhanden); nur bei gleicher Systemgrenze mit anderen Materialien vergleichen."
      }
    }
  },
  {
    "id": "hasslacher-bsh",
    "material": "brettschichtholz",
    "name": "HASSLACHER Brettschichtholz (BSH, Durchschnitts-EPD)",
    "hersteller": "HASSLACHER Holding GmbH",
    "standard": false,
    "datenblatt": "oebd-e8cf2935",
    "beschreibung": "Brettschichtholz, Balkenschichtholz und Verbundbauteile aus Brettschichtholz von HASSLACHER; Umweltdaten aus der Durchschnitts-EPD des Herstellers (ÖKOBAUDAT). Ein Preis wurde nicht gefunden.",
    "eigenschaften": {
      "rohdichte": {
        "wert": 470.0,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "oebd-e8cf2935",
        "hinweis": "Rohdichte 470 kg/m³ laut ÖKOBAUDAT-Datensatz „Brettschichtholz, Balkenschichtholz, Verbundbauteile aus Brettschichtholz“ (HASSLACHER Holding GmbH), zugleich Rohdichte der deklarierten Einheit."
      },
      "gwp": {
        "werte": {
          "gesamt": -608.414726529582,
          "fossil": 143.985379960103,
          "biogen": -753.180807330254,
          "luluc": 0.780700840569229
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 m³",
        "module": "A1-A3",
        "art": "richtwert",
        "quelle": "oebd-e8cf2935",
        "hinweis": "ÖKOBAUDAT-Datensatz „Brettschichtholz, Balkenschichtholz, Verbundbauteile aus Brettschichtholz“ (Durchschnittsdatensatz; HASSLACHER Holding GmbH, Registrierung EPD-HAS-20210171-IBD1-DE), Module A1–A3 je 1 m³. Primärenergie laut Datensatz (nicht berechnet): erneuerbar gesamt (PERT) 9359,5 MJ, nicht erneuerbar gesamt (PENRT) 2089,4 MJ. GWP-gesamt enthält die Aufnahme von biogenem Kohlenstoff (negativ, falls vorhanden); nur bei gleicher Systemgrenze mit anderen Materialien vergleichen."
      }
    }
  },
  {
    "id": "hasslacher-kvh-glt",
    "material": "konstruktionsvollholz",
    "name": "HASSLACHER Konstruktionsvollholz und GLT (Durchschnitts-EPD)",
    "hersteller": "HASSLACHER Holding GmbH",
    "standard": false,
    "datenblatt": "oebd-792a0e85",
    "beschreibung": "Konstruktionsvollholz und geprüfte Leimholzträger (GLT) von HASSLACHER; Umweltdaten aus der Durchschnitts-EPD des Herstellers (ÖKOBAUDAT). Ein Preis wurde nicht gefunden.",
    "eigenschaften": {
      "rohdichte": {
        "wert": 470.0,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "oebd-792a0e85",
        "hinweis": "Rohdichte 470 kg/m³ laut ÖKOBAUDAT-Datensatz „Konstruktionsvollholz & GLT® ? Geprüfte Leimholz Träger“ (HASSLACHER Holding GmbH), zugleich Rohdichte der deklarierten Einheit."
      },
      "gwp": {
        "werte": {
          "gesamt": -695.816465886325,
          "fossil": 56.6910419820978,
          "biogen": -752.970802296702,
          "luluc": 0.46329442827943
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 m³",
        "module": "A1-A3",
        "art": "richtwert",
        "quelle": "oebd-792a0e85",
        "hinweis": "ÖKOBAUDAT-Datensatz „Konstruktionsvollholz & GLT® ? Geprüfte Leimholz Träger“ (Durchschnittsdatensatz; HASSLACHER Holding GmbH, Registrierung EPD-HAS-20210170-IBD1-DE), Module A1–A3 je 1 m³. Primärenergie laut Datensatz (nicht berechnet): erneuerbar gesamt (PERT) 9654,3 MJ, nicht erneuerbar gesamt (PENRT) 746,6 MJ. GWP-gesamt enthält die Aufnahme von biogenem Kohlenstoff (negativ, falls vorhanden); nur bei gleicher Systemgrenze mit anderen Materialien vergleichen."
      }
    }
  },
  {
    "id": "gutex-pyroresist",
    "material": "holzfaserdaemmung",
    "name": "GUTEX Pyroresist (Holzfaserdämmplatte, Durchschnitts-EPD)",
    "hersteller": "GUTEX Holzfaserplattenwerk H. Henselmann GmbH + Co KG",
    "standard": false,
    "datenblatt": "oebd-a612d5a0",
    "beschreibung": "Holzfaserdämmplatte GUTEX Pyroresist; Umweltdaten aus der Durchschnitts-EPD des Herstellers (ÖKOBAUDAT). Wärmeleitfähigkeit und Brandverhalten wurden nicht gelesen. Ein Preis wurde nicht gefunden.",
    "eigenschaften": {
      "rohdichte": {
        "wert": 190.0,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "oebd-a612d5a0",
        "hinweis": "Rohdichte 190 kg/m³ laut ÖKOBAUDAT-Datensatz „Pyroresist® - Holzfaserdämmplatte“ (GUTEX Holzfaserplattenwerk H. Henselmann GmbH + Co KG), zugleich Rohdichte der deklarierten Einheit."
      },
      "gwp": {
        "werte": {
          "gesamt": 28.24,
          "fossil": 296.82,
          "biogen": -268.9588,
          "luluc": 0.4089
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 m³",
        "module": "A1-A3",
        "art": "richtwert",
        "quelle": "oebd-a612d5a0",
        "hinweis": "ÖKOBAUDAT-Datensatz „Pyroresist® - Holzfaserdämmplatte“ (Durchschnittsdatensatz; GUTEX Holzfaserplattenwerk H. Henselmann GmbH + Co KG, Registrierung EPD-GTX-20220170-IBC1-DE), Module A1–A3 je 1 m³. Primärenergie laut Datensatz (nicht berechnet): erneuerbar gesamt (PERT) 3645,9 MJ, nicht erneuerbar gesamt (PENRT) 4053,1 MJ. GWP-gesamt enthält die Aufnahme von biogenem Kohlenstoff (negativ, falls vorhanden); nur bei gleicher Systemgrenze mit anderen Materialien vergleichen."
      }
    }
  },
  {
    "id": "jackodur-evo",
    "material": "xps",
    "name": "JACKODUR EVO (XPS)",
    "hersteller": "JACKON Insulation GmbH",
    "standard": false,
    "datenblatt": "oebd-cddad814",
    "beschreibung": "Extrudierte Polystyrol-Hartschaumplatte (XPS) JACKODUR EVO; Umweltdaten aus der Hersteller-EPD (ÖKOBAUDAT). Wärmeleitfähigkeit und Brandverhalten wurden nicht gelesen. Ein Preis wurde nicht gefunden.",
    "eigenschaften": {
      "rohdichte": {
        "wert": 34.37,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "oebd-cddad814",
        "hinweis": "Rohdichte 34,37 kg/m³ laut ÖKOBAUDAT-Datensatz „JACKODUR EVO“ (JACKON Insulation GmbH), zugleich Rohdichte der deklarierten Einheit."
      },
      "gwp": {
        "werte": {
          "gesamt": 103.818947607327,
          "fossil": 103.322387923614,
          "biogen": 0.479491296328634,
          "luluc": 0.0170683873837063
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 m³",
        "module": "A1-A3",
        "art": "richtwert",
        "quelle": "oebd-cddad814",
        "hinweis": "ÖKOBAUDAT-Datensatz „JACKODUR EVO“ (produktspezifisch; JACKON Insulation GmbH, Registrierung EPD-JAC-20220371-CBA1-EN), Module A1–A3 je 1 m³. Primärenergie laut Datensatz (nicht berechnet): erneuerbar gesamt (PERT) 77,2 MJ, nicht erneuerbar gesamt (PENRT) 2793,3 MJ. GWP-gesamt enthält die Aufnahme von biogenem Kohlenstoff (negativ, falls vorhanden); nur bei gleicher Systemgrenze mit anderen Materialien vergleichen."
      }
    }
  },
  {
    "id": "sagex-eps",
    "material": "eps",
    "name": "SAGEX expandiertes Polystyrol (EPS grau-weiß)",
    "hersteller": "Sager AG (Schweiz)",
    "standard": false,
    "datenblatt": "oebd-29396128",
    "beschreibung": "EPS-Dämmstoff SAGEX von Sager; Umweltdaten aus der Hersteller-EPD (ÖKOBAUDAT). Wärmeleitfähigkeit und Brandverhalten wurden nicht gelesen. Ein Preis wurde nicht gefunden.",
    "eigenschaften": {
      "rohdichte": {
        "wert": 20.0,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "oebd-29396128",
        "hinweis": "Rohdichte 20 kg/m³ laut ÖKOBAUDAT-Datensatz „SAGEX expandiertes Polystyrol“ (Sager AG), zugleich Rohdichte der deklarierten Einheit."
      },
      "gwp": {
        "werte": {
          "gesamt": 54.6288026524223,
          "fossil": 74.9465105080141,
          "biogen": -20.35,
          "luluc": 0.0322921444081424
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 m³",
        "module": "A1-A3",
        "art": "richtwert",
        "quelle": "oebd-29396128",
        "hinweis": "ÖKOBAUDAT-Datensatz „SAGEX expandiertes Polystyrol“ (produktspezifisch; Sager AG, Registrierung EPD-SAR-20230219-CBA1-DE), Module A1–A3 je 1 m³. Primärenergie laut Datensatz (nicht berechnet): erneuerbar gesamt (PERT) 173,5 MJ, nicht erneuerbar gesamt (PENRT) 2047,1 MJ. GWP-gesamt enthält die Aufnahme von biogenem Kohlenstoff (negativ, falls vorhanden); nur bei gleicher Systemgrenze mit anderen Materialien vergleichen."
      }
    }
  },
  {
    "id": "knauf-fireboard",
    "material": "gipskarton",
    "name": "Knauf Fireboard (GKF mit Faserverstärkung, 20 mm)",
    "hersteller": "Knauf Gips KG",
    "standard": false,
    "datenblatt": "oebd-69430bba",
    "beschreibung": "Gipskartonplatte mit Faserverstärkung (Brandschutz) von Knauf, Dicke 20 mm; Umweltdaten aus der Hersteller-EPD (ÖKOBAUDAT). Das Knauf-Datenblatt war nicht abrufbar (Cloudflare-Sperre). Ein Preis wurde nicht gefunden.",
    "eigenschaften": {
      "rohdichte": {
        "wert": 820.0,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "oebd-69430bba",
        "hinweis": "Rohdichte rechnerisch aus den Angaben des ÖKOBAUDAT-Datensatzes „Knauf Fireboard - Gipskartonplatte mit Faserverstärkung“: Flächengewicht 16,40 kg/m² ÷ Schichtdicke 0,02 m = 820 kg/m³. Der Datensatz weist keine Rohdichte direkt aus; der Wert ist von uns berechnet."
      },
      "gwp": {
        "werte": {
          "gesamt": 3.88069511423852,
          "fossil": 3.97165974919262,
          "biogen": -0.0976132433655899,
          "luluc": 0.00664860841149436
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 m²",
        "module": "A1-A3",
        "art": "richtwert",
        "quelle": "oebd-69430bba",
        "hinweis": "ÖKOBAUDAT-Datensatz „Knauf Fireboard - Gipskartonplatte mit Faserverstärkung“ (produktspezifisch; Knauf Gips KG, Registrierung EPD-KNA-20250175-IBA1-EN), Module A1–A3 je 1 m². Primärenergie laut Datensatz (nicht berechnet): erneuerbar gesamt (PERT) 7,0 MJ, nicht erneuerbar gesamt (PENRT) 61,4 MJ. GWP-gesamt enthält die Aufnahme von biogenem Kohlenstoff (negativ, falls vorhanden); nur bei gleicher Systemgrenze mit anderen Materialien vergleichen. Der Wert gilt je m² für die Dicke 20 mm laut Datensatz.",
        "bezugsdicke_m": 0.02
      }
    }
  },
  {
    "id": "knauf-silentboard-gkf",
    "material": "gipskarton",
    "name": "Knauf Silentboard GKF (12,5 mm)",
    "hersteller": "Knauf Gips KG",
    "standard": false,
    "datenblatt": "oebd-ba2a4652",
    "beschreibung": "Schallschutz-Gipskartonplatte (GKF) von Knauf, Dicke 12,5 mm; Umweltdaten aus der Hersteller-EPD (ÖKOBAUDAT). Das Knauf-Datenblatt war nicht abrufbar (Cloudflare-Sperre). Ein Preis wurde nicht gefunden.",
    "eigenschaften": {
      "rohdichte": {
        "wert": 1400.0,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "oebd-ba2a4652",
        "hinweis": "Rohdichte rechnerisch aus den Angaben des ÖKOBAUDAT-Datensatzes „Knauf Silentboard GKF“: Flächengewicht 17,50 kg/m² ÷ Schichtdicke 0,0125 m = 1400 kg/m³. Der Datensatz weist keine Rohdichte direkt aus; der Wert ist von uns berechnet."
      },
      "gwp": {
        "werte": {
          "gesamt": 1.40497302659183,
          "fossil": 2.35580748683824,
          "biogen": -0.953676900211705,
          "luluc": 0.00284243996529674
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 m²",
        "module": "A1-A3",
        "art": "richtwert",
        "quelle": "oebd-ba2a4652",
        "hinweis": "ÖKOBAUDAT-Datensatz „Knauf Silentboard GKF“ (produktspezifisch; Knauf Gips KG, Registrierung EPD-KNA-20230213-IBB1-EN), Module A1–A3 je 1 m². Primärenergie laut Datensatz (nicht berechnet): erneuerbar gesamt (PERT) 18,2 MJ, nicht erneuerbar gesamt (PENRT) 38,4 MJ. GWP-gesamt enthält die Aufnahme von biogenem Kohlenstoff (negativ, falls vorhanden); nur bei gleicher Systemgrenze mit anderen Materialien vergleichen. Der Wert gilt je m² für die Dicke 12,5 mm laut Datensatz.",
        "bezugsdicke_m": 0.0125
      }
    }
  },
  {
    "id": "knauf-fe50-largo",
    "material": "calciumsulfatestrich",
    "name": "Knauf FE 50 Largo (Calciumsulfat-Fließestrich)",
    "hersteller": "Knauf Gips KG",
    "standard": false,
    "datenblatt": "oebd-899c73e4",
    "beschreibung": "Calciumsulfat-Fließestrich Knauf FE 50 Largo (Trockenmischung); Umweltdaten aus der Hersteller-EPD (ÖKOBAUDAT). Das Knauf-Datenblatt war nicht abrufbar (Cloudflare-Sperre). Ein Preis wurde nicht gefunden.",
    "eigenschaften": {
      "rohdichte": {
        "wert": 1600.0,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "oebd-899c73e4",
        "hinweis": "Rohdichte 1600 kg/m³ laut ÖKOBAUDAT-Datensatz „Knauf FE 50 Largo“ (Knauf Gips KG), zugleich Rohdichte der deklarierten Einheit."
      },
      "gwp": {
        "werte": {
          "gesamt": 0.0363842899526941,
          "fossil": 0.0485938886059855,
          "biogen": -0.0130764834424984,
          "luluc": 0.000133826789206995
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 kg",
        "module": "A1-A3",
        "art": "richtwert",
        "quelle": "oebd-899c73e4",
        "hinweis": "ÖKOBAUDAT-Datensatz „Knauf FE 50 Largo“ (produktspezifisch; Knauf Gips KG, Registrierung EPD-KNG-20250645-IBA1-EN), Module A1–A3 je 1 kg. Primärenergie laut Datensatz (nicht berechnet): erneuerbar gesamt (PERT) 0,3 MJ, nicht erneuerbar gesamt (PENRT) 0,5 MJ. GWP-gesamt enthält die Aufnahme von biogenem Kohlenstoff (negativ, falls vorhanden); nur bei gleicher Systemgrenze mit anderen Materialien vergleichen."
      }
    }
  },
  {
    "id": "ytong-thermultra-pp2-030-365",
    "material": "porenbeton",
    "name": "Ytong ThermUltra Planblock PP 2-0,30, 365 mm",
    "hersteller": "Xella Deutschland GmbH",
    "standard": false,
    "datenblatt": "preisliste-xella-ytong-thermultra-pp2-030-365",
    "beschreibung": "Porenbeton-Planblock der Festigkeitsklasse 2 und Rohdichteklasse 0,30, Wanddicke 365 mm; λ und Listenpreis aus der Xella-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.07,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "preisliste-xella-ytong-thermultra-pp2-030-365",
        "hinweis": "Wärmeleitfähigkeit λ = 0,07 W/(m·K) des Produkts Ytong ThermUltra Planblock PP 2-0 (Spalte „λ“ der Xella-Preisliste 2026, Seite 6); nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet. Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung wurde nicht eingesehen."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 2,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-xella-ytong-thermultra-pp2-030-365",
        "hinweis": "Festigkeitsklasse 2 (PP 2) laut Preisliste. Klassenwert wie im Materialdatensatz (Porenbeton, Festigkeitsklasse PP2 = 2), keine gemessene Druckfestigkeit des Steins."
      },
      "rohdichte": {
        "wert": null,
        "einheit": "kg/m³",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Die Preisliste nennt nur die Rohdichteklasse 0,30, keinen Wert in kg/m³; der generische Wert (380 kg/m³) gilt für Rohdichteklasse 0,40. Benötigt: Leistungserklärung oder Datenblatt des Produkts."
      },
      "gwp": {
        "werte": null,
        "einheit": "kg CO2e",
        "deklarierte_einheit": null,
        "module": null,
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Der generische ÖKOBAUDAT-Datensatz gilt für Porenbeton der Rohdichteklasse 0,40; eine produktspezifische EPD für dieses Produkt wurde nicht gelesen."
      },
      "preis": {
        "wert": 452.7,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-xella-ytong-thermultra-pp2-030-365",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Frankopreis laut Xella-Preisliste 2026, ohne Mörtel, Logistikpauschale und Entladung)",
        "hinweis": "Preisliste Xella 2026 (Seite 6), Frankopreis 452,70 €/m³ für Ytong ThermUltra Planblock PP 2-0, 365 mm, netto; kein aktuell abgerufener Händlerpreis. Dünnbettmörtel, Logistikpauschale, Entladung und Umsatzsteuer kommen hinzu; Preise anderer Wanddicken weichen ab."
      }
    }
  },
  {
    "id": "ytong-thermsuper-pp2-035-365",
    "material": "porenbeton",
    "name": "Ytong ThermSuper Planblock PP 2-0,35, 365 mm",
    "hersteller": "Xella Deutschland GmbH",
    "standard": false,
    "datenblatt": "preisliste-xella-ytong-thermsuper-pp2-035-365",
    "beschreibung": "Porenbeton-Planblock der Festigkeitsklasse 2 und Rohdichteklasse 0,35, Wanddicke 365 mm; λ und Listenpreis aus der Xella-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.08,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "preisliste-xella-ytong-thermsuper-pp2-035-365",
        "hinweis": "Wärmeleitfähigkeit λ = 0,08 W/(m·K) des Produkts Ytong ThermSuper Planblock PP 2-0 (Spalte „λ“ der Xella-Preisliste 2026, Seite 6); nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet. Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung wurde nicht eingesehen."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 2,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-xella-ytong-thermsuper-pp2-035-365",
        "hinweis": "Festigkeitsklasse 2 (PP 2) laut Preisliste. Klassenwert wie im Materialdatensatz (Porenbeton, Festigkeitsklasse PP2 = 2), keine gemessene Druckfestigkeit des Steins."
      },
      "rohdichte": {
        "wert": null,
        "einheit": "kg/m³",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Die Preisliste nennt nur die Rohdichteklasse 0,35, keinen Wert in kg/m³; der generische Wert (380 kg/m³) gilt für Rohdichteklasse 0,40. Benötigt: Leistungserklärung oder Datenblatt des Produkts."
      },
      "gwp": {
        "werte": null,
        "einheit": "kg CO2e",
        "deklarierte_einheit": null,
        "module": null,
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Der generische ÖKOBAUDAT-Datensatz gilt für Porenbeton der Rohdichteklasse 0,40; eine produktspezifische EPD für dieses Produkt wurde nicht gelesen."
      },
      "preis": {
        "wert": 242.2,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-xella-ytong-thermsuper-pp2-035-365",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Frankopreis laut Xella-Preisliste 2026, ohne Mörtel, Logistikpauschale und Entladung)",
        "hinweis": "Preisliste Xella 2026 (Seite 6), Frankopreis 242,20 €/m³ für Ytong ThermSuper Planblock PP 2-0, 365 mm, netto; kein aktuell abgerufener Händlerpreis. Dünnbettmörtel, Logistikpauschale, Entladung und Umsatzsteuer kommen hinzu; Preise anderer Wanddicken weichen ab."
      }
    }
  },
  {
    "id": "ytong-thermstrong-pp4-050-365",
    "material": "porenbeton",
    "name": "Ytong ThermStrong Planblock PP 4-0,50, 365 mm",
    "hersteller": "Xella Deutschland GmbH",
    "standard": false,
    "datenblatt": "preisliste-xella-ytong-thermstrong-pp4-050-365",
    "beschreibung": "Porenbeton-Planblock der Festigkeitsklasse 4 und Rohdichteklasse 0,50, Wanddicke 365 mm; λ und Listenpreis aus der Xella-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.1,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "preisliste-xella-ytong-thermstrong-pp4-050-365",
        "hinweis": "Wärmeleitfähigkeit λ = 0,10 W/(m·K) des Produkts Ytong ThermStrong Planblock PP 4-0 (Spalte „λ“ der Xella-Preisliste 2026, Seite 6); nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet. Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung wurde nicht eingesehen."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 4,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-xella-ytong-thermstrong-pp4-050-365",
        "hinweis": "Festigkeitsklasse 4 (PP 4) laut Preisliste. Klassenwert wie im Materialdatensatz (Porenbeton, Festigkeitsklasse PP2 = 2), keine gemessene Druckfestigkeit des Steins."
      },
      "rohdichte": {
        "wert": null,
        "einheit": "kg/m³",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Die Preisliste nennt nur die Rohdichteklasse 0,50, keinen Wert in kg/m³; der generische Wert (380 kg/m³) gilt für Rohdichteklasse 0,40. Benötigt: Leistungserklärung oder Datenblatt des Produkts."
      },
      "gwp": {
        "werte": null,
        "einheit": "kg CO2e",
        "deklarierte_einheit": null,
        "module": null,
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Der generische ÖKOBAUDAT-Datensatz gilt für Porenbeton der Rohdichteklasse 0,40; eine produktspezifische EPD für dieses Produkt wurde nicht gelesen."
      },
      "preis": {
        "wert": 452.7,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-xella-ytong-thermstrong-pp4-050-365",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Frankopreis laut Xella-Preisliste 2026, ohne Mörtel, Logistikpauschale und Entladung)",
        "hinweis": "Preisliste Xella 2026 (Seite 6), Frankopreis 452,70 €/m³ für Ytong ThermStrong Planblock PP 4-0, 365 mm, netto; kein aktuell abgerufener Händlerpreis. Dünnbettmörtel, Logistikpauschale, Entladung und Umsatzsteuer kommen hinzu; Preise anderer Wanddicken weichen ab."
      }
    }
  },
  {
    "id": "ytong-thermcombi-pp4-050-365",
    "material": "porenbeton",
    "name": "Ytong ThermCombi Planblock PP 4-0,50, 365 mm",
    "hersteller": "Xella Deutschland GmbH",
    "standard": false,
    "datenblatt": "preisliste-xella-ytong-thermcombi-pp4-050-365",
    "beschreibung": "Porenbeton-Planblock der Festigkeitsklasse 4 und Rohdichteklasse 0,50, Wanddicke 365 mm; λ und Listenpreis aus der Xella-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.12,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "preisliste-xella-ytong-thermcombi-pp4-050-365",
        "hinweis": "Wärmeleitfähigkeit λ = 0,12 W/(m·K) des Produkts Ytong ThermCombi Planblock PP 4-0 (Spalte „λ“ der Xella-Preisliste 2026, Seite 6); nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet. Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung wurde nicht eingesehen."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 4,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-xella-ytong-thermcombi-pp4-050-365",
        "hinweis": "Festigkeitsklasse 4 (PP 4) laut Preisliste. Klassenwert wie im Materialdatensatz (Porenbeton, Festigkeitsklasse PP2 = 2), keine gemessene Druckfestigkeit des Steins."
      },
      "rohdichte": {
        "wert": null,
        "einheit": "kg/m³",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Die Preisliste nennt nur die Rohdichteklasse 0,50, keinen Wert in kg/m³; der generische Wert (380 kg/m³) gilt für Rohdichteklasse 0,40. Benötigt: Leistungserklärung oder Datenblatt des Produkts."
      },
      "gwp": {
        "werte": null,
        "einheit": "kg CO2e",
        "deklarierte_einheit": null,
        "module": null,
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Der generische ÖKOBAUDAT-Datensatz gilt für Porenbeton der Rohdichteklasse 0,40; eine produktspezifische EPD für dieses Produkt wurde nicht gelesen."
      },
      "preis": {
        "wert": 223.4,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-xella-ytong-thermcombi-pp4-050-365",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Frankopreis laut Xella-Preisliste 2026, ohne Mörtel, Logistikpauschale und Entladung)",
        "hinweis": "Preisliste Xella 2026 (Seite 6), Frankopreis 223,40 €/m³ für Ytong ThermCombi Planblock PP 4-0, 365 mm, netto; kein aktuell abgerufener Händlerpreis. Dünnbettmörtel, Logistikpauschale, Entladung und Umsatzsteuer kommen hinzu; Preise anderer Wanddicken weichen ab."
      }
    }
  },
  {
    "id": "ytong-thermcombi-pp6-065-365",
    "material": "porenbeton",
    "name": "Ytong ThermCombi Planblock PP 6-0,65, 365 mm",
    "hersteller": "Xella Deutschland GmbH",
    "standard": false,
    "datenblatt": "preisliste-xella-ytong-thermcombi-pp6-065-365",
    "beschreibung": "Porenbeton-Planblock der Festigkeitsklasse 6 und Rohdichteklasse 0,65, Wanddicke 365 mm; λ und Listenpreis aus der Xella-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.18,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "preisliste-xella-ytong-thermcombi-pp6-065-365",
        "hinweis": "Wärmeleitfähigkeit λ = 0,18 W/(m·K) des Produkts Ytong ThermCombi Planblock PP 6-0 (Spalte „λ“ der Xella-Preisliste 2026, Seite 7); nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet. Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung wurde nicht eingesehen."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 6,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-xella-ytong-thermcombi-pp6-065-365",
        "hinweis": "Festigkeitsklasse 6 (PP 6) laut Preisliste. Klassenwert wie im Materialdatensatz (Porenbeton, Festigkeitsklasse PP2 = 2), keine gemessene Druckfestigkeit des Steins."
      },
      "rohdichte": {
        "wert": null,
        "einheit": "kg/m³",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Die Preisliste nennt nur die Rohdichteklasse 0,65, keinen Wert in kg/m³; der generische Wert (380 kg/m³) gilt für Rohdichteklasse 0,40. Benötigt: Leistungserklärung oder Datenblatt des Produkts."
      },
      "gwp": {
        "werte": null,
        "einheit": "kg CO2e",
        "deklarierte_einheit": null,
        "module": null,
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Der generische ÖKOBAUDAT-Datensatz gilt für Porenbeton der Rohdichteklasse 0,40; eine produktspezifische EPD für dieses Produkt wurde nicht gelesen."
      },
      "preis": {
        "wert": 243.8,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-xella-ytong-thermcombi-pp6-065-365",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Frankopreis laut Xella-Preisliste 2026, ohne Mörtel, Logistikpauschale und Entladung)",
        "hinweis": "Preisliste Xella 2026 (Seite 7), Frankopreis 243,80 €/m³ für Ytong ThermCombi Planblock PP 6-0, 365 mm, netto; kein aktuell abgerufener Händlerpreis. Dünnbettmörtel, Logistikpauschale, Entladung und Umsatzsteuer kommen hinzu; Preise anderer Wanddicken weichen ab."
      }
    }
  },
  {
    "id": "silka-classic-ks3df-175",
    "material": "kalksandstein",
    "name": "Silka Classic KS 3 DF (Kleinformat, 175 mm)",
    "hersteller": "Xella Deutschland GmbH",
    "standard": false,
    "datenblatt": "preisliste-xella-silka-classic-ks3df-175",
    "beschreibung": "Kalksandstein-Kleinformat (Silka KS 3 DF), Druckfestigkeits-/Rohdichteklasse 12 – 1,8; Preis, λ und Klasse aus der Xella-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.99,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "preisliste-xella-silka-classic-ks3df-175",
        "hinweis": "Wärmeleitfähigkeit λ = 0,99 W/(m·K) des Produkts Silka Classic KS 3 DF (Übersicht technische Daten, Xella-Preisliste 2026, Seite 50); nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 12,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-xella-silka-classic-ks3df-175",
        "hinweis": "Druckfestigkeitsklasse 12 laut Preisliste (Klassenwert in N/mm² nach DIN EN 771-2 / DIN 20000-402; Steindruckfestigkeit, keine gemessene Einzelfestigkeit und nicht die Festigkeit des Mauerwerks). Die Preisliste nennt für Mauerwerk fk = 5,4 / 6,0 / 6,7 / 7,5 N/mm² je Mörtelgruppe M 2,5 / M 5 / M 10 / M 20."
      },
      "preis": {
        "wert": 353.56,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-xella-silka-classic-ks3df-175",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Frankopreis laut Xella-Preisliste 2026, ohne Mörtel, Logistikpauschale und Entladung)",
        "hinweis": "Preisliste Xella 2026 (Seite 30): 1.678,00 € je 1.000 Stück netto, umgerechnet über das Steinvolumen (0,240 × 0,175 × 0,113 m = 0,004746 m³) auf €/m³ (Rechnung in der Quelle hinterlegt). Preis des Steins, nicht des fertigen Mauerwerks (Mörtelfugen und Verschnitt fehlen). Kein aktuell abgerufener Händlerpreis; Umsatzsteuer kommt hinzu."
      }
    }
  },
  {
    "id": "silka-classic-ks5df-240",
    "material": "kalksandstein",
    "name": "Silka Classic KS 5 DF (Kleinformat, 240 mm)",
    "hersteller": "Xella Deutschland GmbH",
    "standard": false,
    "datenblatt": "preisliste-xella-silka-classic-ks5df-240",
    "beschreibung": "Kalksandstein-Kleinformat (Silka KS 5 DF), Druckfestigkeits-/Rohdichteklasse 12 – 1,8; Preis, λ und Klasse aus der Xella-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.99,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "preisliste-xella-silka-classic-ks5df-240",
        "hinweis": "Wärmeleitfähigkeit λ = 0,99 W/(m·K) des Produkts Silka Classic KS 5 DF (Übersicht technische Daten, Xella-Preisliste 2026, Seite 50); nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 12,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-xella-silka-classic-ks5df-240",
        "hinweis": "Druckfestigkeitsklasse 12 laut Preisliste (Klassenwert in N/mm² nach DIN EN 771-2 / DIN 20000-402; Steindruckfestigkeit, keine gemessene Einzelfestigkeit und nicht die Festigkeit des Mauerwerks). Die Preisliste nennt für Mauerwerk fk = 5,4 / 6,0 / 6,7 / 7,5 N/mm² je Mörtelgruppe M 2,5 / M 5 / M 10 / M 20."
      },
      "preis": {
        "wert": 349.56,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-xella-silka-classic-ks5df-240",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Frankopreis laut Xella-Preisliste 2026, ohne Mörtel, Logistikpauschale und Entladung)",
        "hinweis": "Preisliste Xella 2026 (Seite 30): 2.844,00 € je 1.000 Stück netto, umgerechnet über das Steinvolumen (0,300 × 0,240 × 0,113 m = 0,008136 m³) auf €/m³ (Rechnung in der Quelle hinterlegt). Preis des Steins, nicht des fertigen Mauerwerks (Mörtelfugen und Verschnitt fehlen). Kein aktuell abgerufener Händlerpreis; Umsatzsteuer kommt hinzu."
      }
    }
  },
  {
    "id": "silka-solid-ks3df-175",
    "material": "kalksandstein",
    "name": "Silka Solid KS 3 DF (Kleinformat, 175 mm)",
    "hersteller": "Xella Deutschland GmbH",
    "standard": false,
    "datenblatt": "preisliste-xella-silka-solid-ks3df-175",
    "beschreibung": "Kalksandstein-Kleinformat (Silka KS 3 DF), Druckfestigkeits-/Rohdichteklasse 20 – 2,0; Preis, λ und Klasse aus der Xella-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 1.1,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "preisliste-xella-silka-solid-ks3df-175",
        "hinweis": "Wärmeleitfähigkeit λ = 1,10 W/(m·K) des Produkts Silka Solid KS 3 DF (Übersicht technische Daten, Xella-Preisliste 2026, Seite 50); nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 20,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-xella-silka-solid-ks3df-175",
        "hinweis": "Druckfestigkeitsklasse 20 laut Preisliste (Klassenwert in N/mm² nach DIN EN 771-2 / DIN 20000-402; Steindruckfestigkeit, keine gemessene Einzelfestigkeit und nicht die Festigkeit des Mauerwerks). Die Preisliste nennt für Mauerwerk fk = 7,2 / 8,1 / 9,1 / 10,1 N/mm² je Mörtelgruppe M 2,5 / M 5 / M 10 / M 20."
      },
      "preis": {
        "wert": 404.97,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-xella-silka-solid-ks3df-175",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Frankopreis laut Xella-Preisliste 2026, ohne Mörtel, Logistikpauschale und Entladung)",
        "hinweis": "Preisliste Xella 2026 (Seite 30): 1.922,00 € je 1.000 Stück netto, umgerechnet über das Steinvolumen (0,240 × 0,175 × 0,113 m = 0,004746 m³) auf €/m³ (Rechnung in der Quelle hinterlegt). Preis des Steins, nicht des fertigen Mauerwerks (Mörtelfugen und Verschnitt fehlen). Kein aktuell abgerufener Händlerpreis; Umsatzsteuer kommt hinzu."
      }
    }
  },
  {
    "id": "silka-solid-ks5df-240",
    "material": "kalksandstein",
    "name": "Silka Solid KS 5 DF (Kleinformat, 240 mm)",
    "hersteller": "Xella Deutschland GmbH",
    "standard": false,
    "datenblatt": "preisliste-xella-silka-solid-ks5df-240",
    "beschreibung": "Kalksandstein-Kleinformat (Silka KS 5 DF), Druckfestigkeits-/Rohdichteklasse 20 – 2,0; Preis, λ und Klasse aus der Xella-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 1.1,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "preisliste-xella-silka-solid-ks5df-240",
        "hinweis": "Wärmeleitfähigkeit λ = 1,10 W/(m·K) des Produkts Silka Solid KS 5 DF (Übersicht technische Daten, Xella-Preisliste 2026, Seite 50); nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 20,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-xella-silka-solid-ks5df-240",
        "hinweis": "Druckfestigkeitsklasse 20 laut Preisliste (Klassenwert in N/mm² nach DIN EN 771-2 / DIN 20000-402; Steindruckfestigkeit, keine gemessene Einzelfestigkeit und nicht die Festigkeit des Mauerwerks). Die Preisliste nennt für Mauerwerk fk = 7,2 / 8,1 / 9,1 / 10,1 N/mm² je Mörtelgruppe M 2,5 / M 5 / M 10 / M 20."
      },
      "preis": {
        "wert": 400.2,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-xella-silka-solid-ks5df-240",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Frankopreis laut Xella-Preisliste 2026, ohne Mörtel, Logistikpauschale und Entladung)",
        "hinweis": "Preisliste Xella 2026 (Seite 30): 3.256,00 € je 1.000 Stück netto, umgerechnet über das Steinvolumen (0,300 × 0,240 × 0,113 m = 0,008136 m³) auf €/m³ (Rechnung in der Quelle hinterlegt). Preis des Steins, nicht des fertigen Mauerwerks (Mörtelfugen und Verschnitt fehlen). Kein aktuell abgerufener Händlerpreis; Umsatzsteuer kommt hinzu."
      }
    }
  },
  {
    "id": "silka-xl-basic-solid-175",
    "material": "kalksandstein",
    "name": "Silka XL Basic Solid (Elementhöhe 623 mm, 175 mm)",
    "hersteller": "Xella Deutschland GmbH",
    "standard": false,
    "datenblatt": "preisliste-xella-silka-xl-basic-solid-175",
    "beschreibung": "Kalksandstein-Planelement (Silka XL Basic, Solid, Rohdichteklasse 2,0), Wanddicke 175 mm; Preis, λ und Klasse aus der Xella-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 1.1,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "preisliste-xella-silka-xl-basic-solid-175",
        "hinweis": "Wärmeleitfähigkeit λ = 1,1 W/(m·K) des Produkts Silka XL Solid (Übersicht technische Daten, Xella-Preisliste 2026, Seite 52); nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 20,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-xella-silka-xl-basic-solid-175",
        "hinweis": "Druckfestigkeitsklasse 20 laut Preisliste (Klassenwert in N/mm² nach DIN EN 771-2 / DIN 20000-402; Steindruckfestigkeit, keine gemessene Einzelfestigkeit und nicht die Festigkeit des Mauerwerks). Die Preisliste nennt für Mauerwerk mit Dünnbettmörtel fk = 12,9 N/mm²."
      },
      "preis": {
        "wert": 50.07,
        "einheit": "€/m²",
        "art": "richtwert",
        "quelle": "preisliste-xella-silka-xl-basic-solid-175",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Frankopreis laut Xella-Preisliste 2026, ohne Mörtel, Logistikpauschale und Entladung)",
        "hinweis": "Preisliste Xella 2026 (Seite 33): 50,07 €/m² Wandfläche netto für Silka XL Basic Solid, 175 mm (Elementhöhe 623 mm); gilt nur für diese Wanddicke. Kein aktuell abgerufener Händlerpreis; Umsatzsteuer kommt hinzu.",
        "bezugsdicke_m": 0.175
      }
    }
  },
  {
    "id": "silka-xl-basic-solid-240",
    "material": "kalksandstein",
    "name": "Silka XL Basic Solid (Elementhöhe 623 mm, 240 mm)",
    "hersteller": "Xella Deutschland GmbH",
    "standard": false,
    "datenblatt": "preisliste-xella-silka-xl-basic-solid-240",
    "beschreibung": "Kalksandstein-Planelement (Silka XL Basic, Solid, Rohdichteklasse 2,0), Wanddicke 240 mm; Preis, λ und Klasse aus der Xella-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 1.1,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "preisliste-xella-silka-xl-basic-solid-240",
        "hinweis": "Wärmeleitfähigkeit λ = 1,1 W/(m·K) des Produkts Silka XL Solid (Übersicht technische Daten, Xella-Preisliste 2026, Seite 52); nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 20,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-xella-silka-xl-basic-solid-240",
        "hinweis": "Druckfestigkeitsklasse 20 laut Preisliste (Klassenwert in N/mm² nach DIN EN 771-2 / DIN 20000-402; Steindruckfestigkeit, keine gemessene Einzelfestigkeit und nicht die Festigkeit des Mauerwerks). Die Preisliste nennt für Mauerwerk mit Dünnbettmörtel fk = 12,9 N/mm²."
      },
      "preis": {
        "wert": 68.66,
        "einheit": "€/m²",
        "art": "richtwert",
        "quelle": "preisliste-xella-silka-xl-basic-solid-240",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Frankopreis laut Xella-Preisliste 2026, ohne Mörtel, Logistikpauschale und Entladung)",
        "hinweis": "Preisliste Xella 2026 (Seite 33): 68,66 €/m² Wandfläche netto für Silka XL Basic Solid, 240 mm (Elementhöhe 623 mm); gilt nur für diese Wanddicke. Kein aktuell abgerufener Händlerpreis; Umsatzsteuer kommt hinzu.",
        "bezugsdicke_m": 0.24
      }
    }
  },
  {
    "id": "poroton-planziegel-t9-365",
    "material": "hochlochziegel",
    "name": "Poroton-Planziegel-T9-36,5 (Druckfestigkeitsklasse 6)",
    "hersteller": "Wienerberger GmbH",
    "standard": false,
    "datenblatt": "hersteller-wienerberger-poroton-planziegel-t9-365",
    "beschreibung": "Porosierter Hochlochziegel (unverfüllter Planziegel), 248 × 365 × 249 mm, Rohdichteklasse 0,65, Druckfestigkeitsklasse 6; Zulassung Z-17.1-890 laut Herstellerseite (Gültigkeit nicht geprüft). Ein Preis wurde nicht gefunden (Wienerberger veröffentlicht keine Preise).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.09,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-planziegel-t9-365",
        "hinweis": "Wärmeleitfähigkeit λR = 0,09 W/(m·K) des Produkts Poroton-Planziegel-T9-36,5 (Druckfestigkeitsklasse 6) laut Herstellerseite (nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet). Der Bemessungswert nach der Zulassung Z-17.1-890 wurde nicht eingesehen."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 6,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-planziegel-t9-365",
        "hinweis": "Druckfestigkeitsklasse 6 laut Herstellerseite (Steindruckfestigkeit in N/mm², keine Festigkeit des Mauerwerks). Die Seite nennt für das Mauerwerk eine charakteristische Druckfestigkeit fk = 2,30 MN/m²; Rohdichteklasse 0,65."
      }
    }
  },
  {
    "id": "poroton-planziegel-t10-365",
    "material": "hochlochziegel",
    "name": "Poroton-Planziegel-T10-36,5",
    "hersteller": "Wienerberger GmbH",
    "standard": false,
    "datenblatt": "hersteller-wienerberger-poroton-planziegel-t10-365",
    "beschreibung": "Porosierter Hochlochziegel (unverfüllter Planziegel), 248 × 365 × 249 mm, Rohdichteklasse 0,70, Druckfestigkeitsklasse 8; Zulassung Z-17.1-890 laut Herstellerseite (Gültigkeit nicht geprüft). Ein Preis wurde nicht gefunden (Wienerberger veröffentlicht keine Preise).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.1,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-planziegel-t10-365",
        "hinweis": "Wärmeleitfähigkeit λR = 0,10 W/(m·K) des Produkts Poroton-Planziegel-T10-36,5 laut Herstellerseite (nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet). Der Bemessungswert nach der Zulassung Z-17.1-890 wurde nicht eingesehen."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 8,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-planziegel-t10-365",
        "hinweis": "Druckfestigkeitsklasse 8 laut Herstellerseite (Steindruckfestigkeit in N/mm², keine Festigkeit des Mauerwerks). Die Seite nennt für das Mauerwerk eine charakteristische Druckfestigkeit fk = 2,80 MN/m²; Rohdichteklasse 0,70."
      }
    }
  },
  {
    "id": "poroton-planziegel-t12-365",
    "material": "hochlochziegel",
    "name": "Poroton-Planziegel-T12-36,5",
    "hersteller": "Wienerberger GmbH",
    "standard": false,
    "datenblatt": "hersteller-wienerberger-poroton-planziegel-t12-365",
    "beschreibung": "Porosierter Hochlochziegel (unverfüllter Planziegel), 248 × 365 × 249 mm, Rohdichteklasse 0,65, Druckfestigkeitsklasse 10; Zulassung Z-17.1-877 laut Herstellerseite (Gültigkeit nicht geprüft). Ein Preis wurde nicht gefunden (Wienerberger veröffentlicht keine Preise).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.12,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-planziegel-t12-365",
        "hinweis": "Wärmeleitfähigkeit λR = 0,12 W/(m·K) des Produkts Poroton-Planziegel-T12-36,5 laut Herstellerseite (nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet). Der Bemessungswert nach der Zulassung Z-17.1-877 wurde nicht eingesehen."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 10,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-planziegel-t12-365",
        "hinweis": "Druckfestigkeitsklasse 10 laut Herstellerseite (Steindruckfestigkeit in N/mm², keine Festigkeit des Mauerwerks). Die Seite nennt für das Mauerwerk eine charakteristische Druckfestigkeit fk = 2,60 MN/m²; Rohdichteklasse 0,65."
      }
    }
  },
  {
    "id": "poroton-planziegel-t14-365-dfk12",
    "material": "hochlochziegel",
    "name": "Poroton-Planziegel-T14-36,5 (Druckfestigkeitsklasse 12)",
    "hersteller": "Wienerberger GmbH",
    "standard": false,
    "datenblatt": "hersteller-wienerberger-poroton-planziegel-t14-365-dfk12",
    "beschreibung": "Porosierter Hochlochziegel (unverfüllter Planziegel), 248 × 365 × 249 mm, Rohdichteklasse 0,70, Druckfestigkeitsklasse 12; Zulassung Z-17.1-651 laut Herstellerseite (Gültigkeit nicht geprüft). Ein Preis wurde nicht gefunden (Wienerberger veröffentlicht keine Preise).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.14,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-planziegel-t14-365-dfk12",
        "hinweis": "Wärmeleitfähigkeit λR = 0,14 W/(m·K) des Produkts Poroton-Planziegel-T14-36,5 (Druckfestigkeitsklasse 12) laut Herstellerseite (nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet). Der Bemessungswert nach der Zulassung Z-17.1-651 wurde nicht eingesehen."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 12,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-planziegel-t14-365-dfk12",
        "hinweis": "Druckfestigkeitsklasse 12 laut Herstellerseite (Steindruckfestigkeit in N/mm², keine Festigkeit des Mauerwerks). Die Seite nennt für das Mauerwerk eine charakteristische Druckfestigkeit fk = 3,90 MN/m²; Rohdichteklasse 0,70."
      }
    }
  },
  {
    "id": "poroton-t6-365-p",
    "material": "hochlochziegel",
    "name": "Poroton-T6-36,5-P (Perlit-gefüllt)",
    "hersteller": "Wienerberger GmbH",
    "standard": false,
    "datenblatt": "hersteller-wienerberger-poroton-t6-365-p",
    "beschreibung": "Porosierter Hochlochziegel (mit Perlit gefüllter Ziegel), 248 × 365 × 249 mm, Rohdichteklasse 0,50, Druckfestigkeitsklasse 4; Zulassung Z-17.21-1301 laut Herstellerseite (Gültigkeit nicht geprüft). Ein Preis wurde nicht gefunden (Wienerberger veröffentlicht keine Preise).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.06,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-t6-365-p",
        "hinweis": "Wärmeleitfähigkeit λR = 0,06 W/(m·K) des Produkts Poroton-T6-36,5-P (Perlit-gefüllt) laut Herstellerseite (nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet). Der Bemessungswert nach der Zulassung Z-17.21-1301 wurde nicht eingesehen."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 4,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-t6-365-p",
        "hinweis": "Druckfestigkeitsklasse 4 laut Herstellerseite (Steindruckfestigkeit in N/mm², keine Festigkeit des Mauerwerks). Die Seite nennt für das Mauerwerk eine charakteristische Druckfestigkeit fk = 1,80 MN/m²; Rohdichteklasse 0,50."
      }
    }
  },
  {
    "id": "poroton-t7-365-p",
    "material": "hochlochziegel",
    "name": "Poroton-T7-36,5-P (Perlit-gefüllt)",
    "hersteller": "Wienerberger GmbH",
    "standard": false,
    "datenblatt": "hersteller-wienerberger-poroton-t7-365-p",
    "beschreibung": "Porosierter Hochlochziegel (mit Perlit gefüllter Ziegel), 248 × 365 × 249 mm, Rohdichteklasse 0,55, Druckfestigkeitsklasse 6; Zulassung Z-17.21-1207 laut Herstellerseite (Gültigkeit nicht geprüft). Ein Preis wurde nicht gefunden (Wienerberger veröffentlicht keine Preise).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.07,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-t7-365-p",
        "hinweis": "Wärmeleitfähigkeit λR = 0,07 W/(m·K) des Produkts Poroton-T7-36,5-P (Perlit-gefüllt) laut Herstellerseite (nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet). Der Bemessungswert nach der Zulassung Z-17.21-1207 wurde nicht eingesehen."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 6,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-t7-365-p",
        "hinweis": "Druckfestigkeitsklasse 6 laut Herstellerseite (Steindruckfestigkeit in N/mm², keine Festigkeit des Mauerwerks). Die Seite nennt für das Mauerwerk eine charakteristische Druckfestigkeit fk = 1,90 MN/m²; Rohdichteklasse 0,55."
      }
    }
  },
  {
    "id": "poroton-t7-365-mw",
    "material": "hochlochziegel",
    "name": "Poroton-T7-36,5-MW (Mineralwolle-gefüllt)",
    "hersteller": "Wienerberger GmbH",
    "standard": false,
    "datenblatt": "hersteller-wienerberger-poroton-t7-365-mw",
    "beschreibung": "Porosierter Hochlochziegel (mit Mineralwolle gefüllter Ziegel), 248 × 365 × 249 mm, Rohdichteklasse 0,55, Druckfestigkeitsklasse 6; Zulassung Z-17.1-1060 laut Herstellerseite (Gültigkeit nicht geprüft). Ein Preis wurde nicht gefunden (Wienerberger veröffentlicht keine Preise).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.07,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-t7-365-mw",
        "hinweis": "Wärmeleitfähigkeit λR = 0,07 W/(m·K) des Produkts Poroton-T7-36,5-MW (Mineralwolle-gefüllt) laut Herstellerseite (nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet). Der Bemessungswert nach der Zulassung Z-17.1-1060 wurde nicht eingesehen."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 6,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-t7-365-mw",
        "hinweis": "Druckfestigkeitsklasse 6 laut Herstellerseite (Steindruckfestigkeit in N/mm², keine Festigkeit des Mauerwerks). Die Seite nennt für das Mauerwerk eine charakteristische Druckfestigkeit fk = 1,90 MN/m²; Rohdichteklasse 0,55."
      }
    }
  },
  {
    "id": "poroton-s8-365-p",
    "material": "hochlochziegel",
    "name": "Poroton-S8-36,5-P (Perlit-gefüllt)",
    "hersteller": "Wienerberger GmbH",
    "standard": false,
    "datenblatt": "hersteller-wienerberger-poroton-s8-365-p",
    "beschreibung": "Porosierter Hochlochziegel (mit Perlit gefüllter Ziegel), 248 × 365 × 249 mm, Rohdichteklasse 0,70, Druckfestigkeitsklasse 12; Zulassung Z-17.21-1295 laut Herstellerseite (Gültigkeit nicht geprüft). Ein Preis wurde nicht gefunden (Wienerberger veröffentlicht keine Preise).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.08,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-s8-365-p",
        "hinweis": "Wärmeleitfähigkeit λR = 0,08 W/(m·K) des Produkts Poroton-S8-36,5-P (Perlit-gefüllt) laut Herstellerseite (nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet). Der Bemessungswert nach der Zulassung Z-17.21-1295 wurde nicht eingesehen."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 12,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-s8-365-p",
        "hinweis": "Druckfestigkeitsklasse 12 laut Herstellerseite (Steindruckfestigkeit in N/mm², keine Festigkeit des Mauerwerks). Die Seite nennt für das Mauerwerk eine charakteristische Druckfestigkeit fk = 6 MN/m²; Rohdichteklasse 0,70."
      }
    }
  },
  {
    "id": "poroton-s9-365-p",
    "material": "hochlochziegel",
    "name": "Poroton-S9-36,5-P (Perlit-gefüllt)",
    "hersteller": "Wienerberger GmbH",
    "standard": false,
    "datenblatt": "hersteller-wienerberger-poroton-s9-365-p",
    "beschreibung": "Porosierter Hochlochziegel (mit Perlit gefüllter Ziegel), 248 × 365 × 249 mm, Rohdichteklasse 0,75, Druckfestigkeitsklasse 12; Zulassung Z-17.1-1173 laut Herstellerseite (Gültigkeit nicht geprüft). Ein Preis wurde nicht gefunden (Wienerberger veröffentlicht keine Preise).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.09,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-s9-365-p",
        "hinweis": "Wärmeleitfähigkeit λR = 0,09 W/(m·K) des Produkts Poroton-S9-36,5-P (Perlit-gefüllt) laut Herstellerseite (nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet). Der Bemessungswert nach der Zulassung Z-17.1-1173 wurde nicht eingesehen."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 12,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-s9-365-p",
        "hinweis": "Druckfestigkeitsklasse 12 laut Herstellerseite (Steindruckfestigkeit in N/mm², keine Festigkeit des Mauerwerks). Die Seite nennt für das Mauerwerk eine charakteristische Druckfestigkeit fk = 5,20 MN/m²; Rohdichteklasse 0,75."
      }
    }
  },
  {
    "id": "poroton-s9-365-mw",
    "material": "hochlochziegel",
    "name": "Poroton-S9-36,5-MW (Mineralwolle-gefüllt)",
    "hersteller": "Wienerberger GmbH",
    "standard": false,
    "datenblatt": "hersteller-wienerberger-poroton-s9-365-mw",
    "beschreibung": "Porosierter Hochlochziegel (mit Mineralwolle gefüllter Ziegel), 248 × 365 × 249 mm, Rohdichteklasse 0,80, Druckfestigkeitsklasse 10; Zulassung Z-17.1-1145 laut Herstellerseite (Gültigkeit nicht geprüft). Ein Preis wurde nicht gefunden (Wienerberger veröffentlicht keine Preise).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.09,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-s9-365-mw",
        "hinweis": "Wärmeleitfähigkeit λR = 0,09 W/(m·K) des Produkts Poroton-S9-36,5-MW (Mineralwolle-gefüllt) laut Herstellerseite (nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet). Der Bemessungswert nach der Zulassung Z-17.1-1145 wurde nicht eingesehen."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 10,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-s9-365-mw",
        "hinweis": "Druckfestigkeitsklasse 10 laut Herstellerseite (Steindruckfestigkeit in N/mm², keine Festigkeit des Mauerwerks). Die Seite nennt für das Mauerwerk eine charakteristische Druckfestigkeit fk = 4,60 MN/m²; Rohdichteklasse 0,80."
      }
    }
  },
  {
    "id": "poroton-s10-365-mw",
    "material": "hochlochziegel",
    "name": "Poroton-S10-36,5-MW (Mineralwolle-gefüllt)",
    "hersteller": "Wienerberger GmbH",
    "standard": false,
    "datenblatt": "hersteller-wienerberger-poroton-s10-365-mw",
    "beschreibung": "Porosierter Hochlochziegel (mit Mineralwolle gefüllter Ziegel), 248 × 365 × 249 mm, Rohdichteklasse 0,80, Druckfestigkeitsklasse 12; Zulassung Z-17.1-1101 laut Herstellerseite (Gültigkeit nicht geprüft). Ein Preis wurde nicht gefunden (Wienerberger veröffentlicht keine Preise).",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.1,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-s10-365-mw",
        "hinweis": "Wärmeleitfähigkeit λR = 0,10 W/(m·K) des Produkts Poroton-S10-36,5-MW (Mineralwolle-gefüllt) laut Herstellerseite (nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet). Der Bemessungswert nach der Zulassung Z-17.1-1101 wurde nicht eingesehen."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 12,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "hersteller-wienerberger-poroton-s10-365-mw",
        "hinweis": "Druckfestigkeitsklasse 12 laut Herstellerseite (Steindruckfestigkeit in N/mm², keine Festigkeit des Mauerwerks). Die Seite nennt für das Mauerwerk eine charakteristische Druckfestigkeit fk = 5,20 MN/m²; Rohdichteklasse 0,80."
      }
    }
  },
  {
    "id": "holcim-beton-c30-37-na5334",
    "material": "normalbeton",
    "name": "Holcim Transportbeton C30/37 (Art.-Nr. NA5334)",
    "hersteller": "Holcim Beton und Betonwaren GmbH",
    "standard": false,
    "datenblatt": "preisliste-holcim-west-2026-na5334",
    "beschreibung": "Transportbeton C30/37 (Bewehrte Außenbauteile, Expositionsklassen XC4 XF1 XA1, Konsistenz F3, Größtkorn 32 mm, mittlere Festigkeitsentwicklung); Listenpreis aus der Preisliste Bereich West, gültig ab 1. Januar 2026. Die Preisliste enthält keine Technikwerte außer der Festigkeitsklasse; alle anderen Kennwerte stammen aus dem generischen Datensatz.",
    "eigenschaften": {
      "druckfestigkeit": {
        "wert": 30,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-holcim-west-2026-na5334",
        "hinweis": "Festigkeitsklasse C30/37 laut Preisliste; 30 ist die charakteristische Zylinderdruckfestigkeit in N/mm² nach der Klassenbezeichnung (DIN EN 206), kein gemessener Wert."
      },
      "preis": {
        "wert": 209.5,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-holcim-west-2026-na5334",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Listenpreis Transportbeton, ohne Zuschläge, Betonförderung und Einbau)",
        "hinweis": "Preisliste Holcim Bereich West (gültig ab 1. Januar 2026), Listenpreis netto 209,50 €/m³ für Art.-Nr. NA5334; kein aktuell abgerufener Händlerpreis. Zuschläge (Saison, Mindermenge, Kleinmenge, CO₂/Nachhaltigkeit, Diesel), Betonförderung und Umsatzsteuer kommen hinzu; Verfügbarkeit ist werksspezifisch."
      }
    }
  },
  {
    "id": "holcim-beton-c35-45-na6334",
    "material": "normalbeton",
    "name": "Holcim Transportbeton C35/45 (Art.-Nr. NA6334)",
    "hersteller": "Holcim Beton und Betonwaren GmbH",
    "standard": false,
    "datenblatt": "preisliste-holcim-west-2026-na6334",
    "beschreibung": "Transportbeton C35/45 (Expositionsklassen XC4 XD2 XS2 XF2 XF3 XA2, Konsistenz F3, Größtkorn 32 mm, mittlere Festigkeitsentwicklung); Listenpreis aus der Preisliste Bereich West, gültig ab 1. Januar 2026. Die Preisliste enthält keine Technikwerte außer der Festigkeitsklasse; alle anderen Kennwerte stammen aus dem generischen Datensatz.",
    "eigenschaften": {
      "druckfestigkeit": {
        "wert": 35,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-holcim-west-2026-na6334",
        "hinweis": "Festigkeitsklasse C35/45 laut Preisliste; 35 ist die charakteristische Zylinderdruckfestigkeit in N/mm² nach der Klassenbezeichnung (DIN EN 206), kein gemessener Wert."
      },
      "preis": {
        "wert": 216.5,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-holcim-west-2026-na6334",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Listenpreis Transportbeton, ohne Zuschläge, Betonförderung und Einbau)",
        "hinweis": "Preisliste Holcim Bereich West (gültig ab 1. Januar 2026), Listenpreis netto 216,50 €/m³ für Art.-Nr. NA6334; kein aktuell abgerufener Händlerpreis. Zuschläge (Saison, Mindermenge, Kleinmenge, CO₂/Nachhaltigkeit, Diesel), Betonförderung und Umsatzsteuer kommen hinzu; Verfügbarkeit ist werksspezifisch."
      }
    }
  },
  {
    "id": "dyckerhoff-standard-c25-30",
    "material": "normalbeton",
    "name": "Dyckerhoff Beton C25/30 (Art.-Nr. A 3043 Q000)",
    "hersteller": "Dyckerhoff Beton GmbH & Co. KG",
    "standard": false,
    "datenblatt": "preisliste-dyckerhoff-hamburg-2026-standard-c25-30",
    "beschreibung": "Transportbeton C25/30 (XC4 XF1 XA1 WU, Konsistenz F3, Größtkorn 22 mm, mittlere Festigkeitsentwicklung); Basis-Preis aus der Preisliste der Niederlassung Hamburg, gültig ab 01.01.2026. Die Preisliste enthält keine Technikwerte außer Festigkeits-, Expositions- und Konsistenzklassen; alle anderen Kennwerte stammen aus dem generischen Datensatz.",
    "eigenschaften": {
      "druckfestigkeit": {
        "wert": 25,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-dyckerhoff-hamburg-2026-standard-c25-30",
        "hinweis": "Festigkeitsklasse C25/30 laut Preisliste; 25 ist die charakteristische Zylinderdruckfestigkeit in N/mm² nach der Klassenbezeichnung (DIN EN 206), kein gemessener Wert."
      },
      "preis": {
        "wert": 164.0,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-dyckerhoff-hamburg-2026-standard-c25-30",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Listenpreis Transportbeton, ohne Zuschläge, Betonförderung und Einbau)",
        "hinweis": "Preisliste Dyckerhoff Niederlassung Hamburg (gültig ab 01.01.2026), Basis-Preis netto 164,00 €/m³ für Art.-Nr. A 3043 Q000; unverbindliche Preisliste, kein aktuell abgerufener Händlerpreis. Zuschläge (Mindermenge, Winter u. a.), Betonförderung und Umsatzsteuer kommen hinzu."
      }
    }
  },
  {
    "id": "dyckerhoff-standard-c30-37",
    "material": "normalbeton",
    "name": "Dyckerhoff Beton C30/37 (Art.-Nr. A 3753 Q000)",
    "hersteller": "Dyckerhoff Beton GmbH & Co. KG",
    "standard": false,
    "datenblatt": "preisliste-dyckerhoff-hamburg-2026-standard-c30-37",
    "beschreibung": "Transportbeton C30/37 (XC4 XD1/XS1 XF1 XA1 WU, Konsistenz F3, Größtkorn 22 mm, mittlere Festigkeitsentwicklung); Basis-Preis aus der Preisliste der Niederlassung Hamburg, gültig ab 01.01.2026. Die Preisliste enthält keine Technikwerte außer Festigkeits-, Expositions- und Konsistenzklassen; alle anderen Kennwerte stammen aus dem generischen Datensatz.",
    "eigenschaften": {
      "druckfestigkeit": {
        "wert": 30,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-dyckerhoff-hamburg-2026-standard-c30-37",
        "hinweis": "Festigkeitsklasse C30/37 laut Preisliste; 30 ist die charakteristische Zylinderdruckfestigkeit in N/mm² nach der Klassenbezeichnung (DIN EN 206), kein gemessener Wert."
      },
      "preis": {
        "wert": 166.0,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-dyckerhoff-hamburg-2026-standard-c30-37",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Listenpreis Transportbeton, ohne Zuschläge, Betonförderung und Einbau)",
        "hinweis": "Preisliste Dyckerhoff Niederlassung Hamburg (gültig ab 01.01.2026), Basis-Preis netto 166,00 €/m³ für Art.-Nr. A 3753 Q000; unverbindliche Preisliste, kein aktuell abgerufener Händlerpreis. Zuschläge (Mindermenge, Winter u. a.), Betonförderung und Umsatzsteuer kommen hinzu."
      }
    }
  },
  {
    "id": "dyckerhoff-ecodur30-c25-30",
    "material": "normalbeton",
    "name": "Dyckerhoff ECODUR 30 Beton C25/30 (Art.-Nr. Y 3044 Q001)",
    "hersteller": "Dyckerhoff Beton GmbH & Co. KG",
    "standard": false,
    "datenblatt": "preisliste-dyckerhoff-hamburg-2026-ecodur30-c25-30",
    "beschreibung": "Transportbeton C25/30 (XC4 XF1 XA1, Konsistenz F4, Größtkorn 22 mm, mittlere Festigkeitsentwicklung); Basis-Preis aus der Preisliste der Niederlassung Hamburg, gültig ab 01.01.2026. Die Preisliste enthält keine Technikwerte außer Festigkeits-, Expositions- und Konsistenzklassen; alle anderen Kennwerte stammen aus dem generischen Datensatz. Die Preisliste bezeichnet ECODUR 30 als „Beton, CSC Modul Level 1 mit einer Reduzierung von mindestens 30 % CO2“ (Einsparung bei der Herstellung nach dem CO₂-Modul des CSC im Vergleich zum Branchenreferenzbeton gleicher Festigkeit mit Durchschnitts-Portlandzement CEM I des VDZ 2017). Das ist eine Herstellerangabe in Prozent, kein GWP-Wert; sie wird in MaterialMatch nicht zur CO₂-Berechnung verwendet.",
    "eigenschaften": {
      "druckfestigkeit": {
        "wert": 25,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-dyckerhoff-hamburg-2026-ecodur30-c25-30",
        "hinweis": "Festigkeitsklasse C25/30 laut Preisliste; 25 ist die charakteristische Zylinderdruckfestigkeit in N/mm² nach der Klassenbezeichnung (DIN EN 206), kein gemessener Wert."
      },
      "preis": {
        "wert": 169.0,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-dyckerhoff-hamburg-2026-ecodur30-c25-30",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Listenpreis Transportbeton, ohne Zuschläge, Betonförderung und Einbau)",
        "hinweis": "Preisliste Dyckerhoff Niederlassung Hamburg (gültig ab 01.01.2026), Basis-Preis netto 169,00 €/m³ für Art.-Nr. Y 3044 Q001; unverbindliche Preisliste, kein aktuell abgerufener Händlerpreis. Zuschläge (Mindermenge, Winter u. a.), Betonförderung und Umsatzsteuer kommen hinzu."
      }
    }
  },
  {
    "id": "dyckerhoff-ecodur40-c25-30",
    "material": "normalbeton",
    "name": "Dyckerhoff ECODUR 40 Beton C25/30 (Art.-Nr. Y 3044 Q102)",
    "hersteller": "Dyckerhoff Beton GmbH & Co. KG",
    "standard": false,
    "datenblatt": "preisliste-dyckerhoff-hamburg-2026-ecodur40-c25-30",
    "beschreibung": "Transportbeton C25/30 (XC4 XF1 XA1, Konsistenz F4, Größtkorn 22 mm, langsame Festigkeitsentwicklung); Basis-Preis aus der Preisliste der Niederlassung Hamburg, gültig ab 01.01.2026. Die Preisliste enthält keine Technikwerte außer Festigkeits-, Expositions- und Konsistenzklassen; alle anderen Kennwerte stammen aus dem generischen Datensatz. Die Preisliste bezeichnet ECODUR 40 als „Beton, CSC Modul Level 2 mit einer Reduzierung von mindestens 40 % CO2“ (Einsparung bei der Herstellung nach dem CO₂-Modul des CSC im Vergleich zum Branchenreferenzbeton gleicher Festigkeit mit Durchschnitts-Portlandzement CEM I des VDZ 2017). Das ist eine Herstellerangabe in Prozent, kein GWP-Wert; sie wird in MaterialMatch nicht zur CO₂-Berechnung verwendet.",
    "eigenschaften": {
      "druckfestigkeit": {
        "wert": 25,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-dyckerhoff-hamburg-2026-ecodur40-c25-30",
        "hinweis": "Festigkeitsklasse C25/30 laut Preisliste; 25 ist die charakteristische Zylinderdruckfestigkeit in N/mm² nach der Klassenbezeichnung (DIN EN 206), kein gemessener Wert."
      },
      "preis": {
        "wert": 174.0,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-dyckerhoff-hamburg-2026-ecodur40-c25-30",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Listenpreis Transportbeton, ohne Zuschläge, Betonförderung und Einbau)",
        "hinweis": "Preisliste Dyckerhoff Niederlassung Hamburg (gültig ab 01.01.2026), Basis-Preis netto 174,00 €/m³ für Art.-Nr. Y 3044 Q102; unverbindliche Preisliste, kein aktuell abgerufener Händlerpreis. Zuschläge (Mindermenge, Winter u. a.), Betonförderung und Umsatzsteuer kommen hinzu."
      }
    }
  },
  {
    "id": "egger-osb3-e0",
    "material": "osb",
    "name": "EGGER OSB 3 E0 (Ergo Board)",
    "hersteller": "EGGER Holzwerkstoffe Wismar GmbH & Co KG",
    "standard": false,
    "datenblatt": "dop-egger-osb3-e0-732-08",
    "beschreibung": "OSB-3-Platte für tragende Zwecke im Trocken- und Feuchtbereich, Plattendicke 6 bis 30 mm (Leistungserklärung DOP-732 vom 23.03.2026). Ein Preis wurde nicht gefunden.",
    "eigenschaften": {
      "rohdichte": {
        "wert": 600,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "dop-egger-osb3-e0-732-08",
        "hinweis": "Mindestrohdichte ≥ 600 kg/m³ nach EN 323 laut Leistungserklärung (Mindestwert, die tatsächliche Rohdichte kann höher sein)."
      },
      "waermeleitfaehigkeit": {
        "wert": 0.13,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "dop-egger-osb3-e0-732-08",
        "hinweis": "Wärmeleitfähigkeit 0,13 W/(m·K) laut Leistungserklärung (nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet)."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "brandverhalten": {
        "wert": "E",
        "art": "richtwert",
        "quelle": "dop-egger-osb3-e0-732-08",
        "hinweis": "Klasse E „ohne Einschränkung“ laut Leistungserklärung; die Klasse D-s2,d0 gilt nur ab 9 mm Dicke unter bestimmten Einbaubedingungen (Luftspalt hinter der Platte). Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils."
      }
    }
  },
  {
    "id": "steico-therm",
    "material": "holzfaserdaemmung",
    "name": "STEICOtherm",
    "hersteller": "STEICO SE",
    "standard": false,
    "datenblatt": "hersteller-steico-therm",
    "beschreibung": "Stabile Holzfaser-Wärmedämmplatte im Nassverfahren (Rohdichte ca. 160 kg/m³, Version 20 des Merkblatts).",
    "eigenschaften": {
      "rohdichte": {
        "wert": 160,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "hersteller-steico-therm",
        "hinweis": "Rohdichte „~ 160 kg/m³“ laut Technischem Merkblatt STEICOtherm (Nassverfahren, Lagenverklebung). Der generische ÖKOBAUDAT-Datensatz des Materials (160 kg/m³, Nassverfahren) gilt für ein anderes Produkt."
      },
      "waermeleitfaehigkeit": {
        "wert": 0.038,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-steico-therm",
        "hinweis": "Nennwert λD des Produkts STEICOtherm laut Technischem Merkblatt."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": 0.04,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-steico-therm",
        "hinweis": "Bemessungswert λB für Deutschland laut Technischem Merkblatt STEICOtherm (Österreich und Schweiz haben eigene Werte, sie gelten nicht für Deutschland)."
      },
      "brandverhalten": {
        "wert": "E",
        "art": "richtwert",
        "quelle": "hersteller-steico-therm",
        "hinweis": "Euroklasse E nach DIN EN 13501-1 laut Technischem Merkblatt. Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils."
      },
      "wasserdampf_mu": {
        "wert": 5,
        "einheit": "–",
        "art": "richtwert",
        "quelle": "hersteller-steico-therm",
        "hinweis": "Wasserdampf-Diffusionswiderstandszahl μ = 5 laut Technischem Merkblatt."
      },
      "waermekapazitaet": {
        "wert": 2100,
        "einheit": "J/(kg·K)",
        "art": "richtwert",
        "quelle": "hersteller-steico-therm",
        "hinweis": "Spezifische Wärmekapazität c = 2.100 J/(kg·K) laut Technischem Merkblatt."
      },
      "preis": {
        "wert": null,
        "einheit": "€/m³",
        "art": null,
        "quelle": null,
        "hinweis": "Preis nicht verfügbar: Für dieses Produkt wurde kein verlässlicher Händlerpreis abgerufen; es wurde kein Wert angenommen."
      },
      "gwp": {
        "werte": {
          "gesamt": -203,
          "fossil": 75.1,
          "biogen": -278,
          "luluc": 0.6
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 m³",
        "module": "A1-A3",
        "art": "richtwert",
        "quelle": "epd-steico-therm",
        "hinweis": "Produktspezifische EPD des Herstellers (EPD Global, NEPD-11337-11337-2, ausgestellt 27.03.2026, gültig bis 26.03.2031): Werte je 1 m³, Module A1–A3 (EN 15804+A2). GWP gesamt -203, fossil 75,1, biogen -278, luluc 0,6 kg CO₂e/m³. Der Gesamtwert ist negativ, weil biogener Kohlenstoff gespeichert ist; er wird deshalb nicht farbig bewertet, maßgeblich ist der fossile Anteil. Die EPD wurde mit dem EPD-Tool Emidat erstellt (keine Einzelprüfung der EPD genannt, siehe Quelle)."
      }
    }
  },
  {
    "id": "steico-therm-dry",
    "material": "holzfaserdaemmung",
    "name": "STEICOtherm dry",
    "hersteller": "STEICO SE",
    "standard": false,
    "datenblatt": "hersteller-steico-therm-dry",
    "beschreibung": "Stabile Holzfaser-Wärmedämmplatte im Trockenverfahren (Rohdichte ca. 110 kg/m³, Version 20 des Merkblatts).",
    "eigenschaften": {
      "rohdichte": {
        "wert": 110,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "hersteller-steico-therm-dry",
        "hinweis": "Rohdichte „~ 110 kg/m³“ laut Technischem Merkblatt STEICOtherm dry (Trockenverfahren). Der generische ÖKOBAUDAT-Datensatz des Materials (160 kg/m³, Nassverfahren) gilt für ein anderes Produkt."
      },
      "waermeleitfaehigkeit": {
        "wert": 0.037,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-steico-therm-dry",
        "hinweis": "Nennwert λD des Produkts STEICOtherm dry laut Technischem Merkblatt."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": 0.039,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-steico-therm-dry",
        "hinweis": "Bemessungswert λB für Deutschland laut Technischem Merkblatt STEICOtherm dry (Österreich und Schweiz haben eigene Werte, sie gelten nicht für Deutschland)."
      },
      "brandverhalten": {
        "wert": "E",
        "art": "richtwert",
        "quelle": "hersteller-steico-therm-dry",
        "hinweis": "Euroklasse E nach DIN EN 13501-1 laut Technischem Merkblatt. Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils."
      },
      "wasserdampf_mu": {
        "wert": 3,
        "einheit": "–",
        "art": "richtwert",
        "quelle": "hersteller-steico-therm-dry",
        "hinweis": "Wasserdampf-Diffusionswiderstandszahl μ = 3 laut Technischem Merkblatt."
      },
      "waermekapazitaet": {
        "wert": 2100,
        "einheit": "J/(kg·K)",
        "art": "richtwert",
        "quelle": "hersteller-steico-therm-dry",
        "hinweis": "Spezifische Wärmekapazität c = 2.100 J/(kg·K) laut Technischem Merkblatt."
      },
      "preis": {
        "wert": null,
        "einheit": "€/m³",
        "art": null,
        "quelle": null,
        "hinweis": "Preis nicht verfügbar: Für dieses Produkt wurde kein verlässlicher Händlerpreis abgerufen; es wurde kein Wert angenommen."
      },
      "gwp": {
        "werte": {
          "gesamt": -103,
          "fossil": 84.1,
          "biogen": -188,
          "luluc": 0.387
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 m³",
        "module": "A1-A3",
        "art": "richtwert",
        "quelle": "epd-steico-therm-dry",
        "hinweis": "Produktspezifische EPD des Herstellers (EPD Global, NEPD-11388-11388-2, ausgestellt 08.04.2026, gültig bis 07.04.2031): Werte je 1 m³, Module A1–A3 (EN 15804+A2). GWP gesamt -103, fossil 84,1, biogen -188, luluc 0,387 kg CO₂e/m³. Der Gesamtwert ist negativ, weil biogener Kohlenstoff gespeichert ist; er wird deshalb nicht farbig bewertet, maßgeblich ist der fossile Anteil. Die EPD wurde mit dem EPD-Tool Emidat erstellt (keine Einzelprüfung der EPD genannt, siehe Quelle)."
      }
    }
  },
  {
    "id": "steico-special-dry",
    "material": "holzfaserdaemmung",
    "name": "STEICOspecial dry",
    "hersteller": "STEICO SE",
    "standard": false,
    "datenblatt": "hersteller-steico-special-dry",
    "beschreibung": "Kombinierte Unterdeck- und Putzträgerplatte aus Holzfasern im Trockenverfahren (Rohdichte ca. 140 kg/m³, Version 20 des Merkblatts).",
    "eigenschaften": {
      "rohdichte": {
        "wert": 140,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "hersteller-steico-special-dry",
        "hinweis": "Rohdichte „~ 140 kg/m³“ laut Technischem Merkblatt STEICOspecial dry (Trockenverfahren). Der generische ÖKOBAUDAT-Datensatz des Materials (160 kg/m³, Nassverfahren) gilt für ein anderes Produkt."
      },
      "waermeleitfaehigkeit": {
        "wert": 0.04,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-steico-special-dry",
        "hinweis": "Nennwert λD des Produkts STEICOspecial dry laut Technischem Merkblatt."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": 0.042,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-steico-special-dry",
        "hinweis": "Bemessungswert λB für Deutschland laut Technischem Merkblatt STEICOspecial dry (Österreich und Schweiz haben eigene Werte, sie gelten nicht für Deutschland)."
      },
      "brandverhalten": {
        "wert": "E",
        "art": "richtwert",
        "quelle": "hersteller-steico-special-dry",
        "hinweis": "Euroklasse E nach DIN EN 13501-1 laut Technischem Merkblatt. Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils."
      },
      "wasserdampf_mu": {
        "wert": 3,
        "einheit": "–",
        "art": "richtwert",
        "quelle": "hersteller-steico-special-dry",
        "hinweis": "Wasserdampf-Diffusionswiderstandszahl μ = 3 laut Technischem Merkblatt."
      },
      "waermekapazitaet": {
        "wert": 2100,
        "einheit": "J/(kg·K)",
        "art": "richtwert",
        "quelle": "hersteller-steico-special-dry",
        "hinweis": "Spezifische Wärmekapazität c = 2.100 J/(kg·K) laut Technischem Merkblatt."
      },
      "preis": {
        "wert": null,
        "einheit": "€/m³",
        "art": null,
        "quelle": null,
        "hinweis": "Preis nicht verfügbar: Für dieses Produkt wurde kein verlässlicher Händlerpreis abgerufen; es wurde kein Wert angenommen."
      },
      "gwp": {
        "werte": {
          "gesamt": -135,
          "fossil": 107,
          "biogen": -243,
          "luluc": 0.571
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 m³",
        "module": "A1-A3",
        "art": "richtwert",
        "quelle": "epd-steico-special-dry",
        "hinweis": "Produktspezifische EPD des Herstellers (EPD Global, NEPD-11332-11332-2, ausgestellt 27.03.2026, gültig bis 26.03.2031): Werte je 1 m³, Module A1–A3 (EN 15804+A2). GWP gesamt -135, fossil 107, biogen -243, luluc 0,571 kg CO₂e/m³. Der Gesamtwert ist negativ, weil biogener Kohlenstoff gespeichert ist; er wird deshalb nicht farbig bewertet, maßgeblich ist der fossile Anteil. Die EPD wurde mit dem EPD-Tool Emidat erstellt (keine Einzelprüfung der EPD genannt, siehe Quelle)."
      }
    }
  },
  {
    "id": "steico-universal-dry",
    "material": "holzfaserdaemmung",
    "name": "STEICOuniversal dry (35 mm)",
    "hersteller": "STEICO SE",
    "standard": false,
    "datenblatt": "hersteller-steico-universal-dry",
    "beschreibung": "Kombinierte Unterdeck- und Putzträgerplatte aus Holzfasern im Trockenverfahren, Werte für die Plattendicke 35 mm (Rohdichte ca. 210 kg/m³, Version 20 des Merkblatts). Ab 40 mm Dicke gelten andere Werte (λD 0,043; ca. 180 kg/m³); sie sind hier nicht übernommen.",
    "eigenschaften": {
      "rohdichte": {
        "wert": 210,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "hersteller-steico-universal-dry",
        "hinweis": "Rohdichte „~ 210 kg/m³“ laut Technischem Merkblatt STEICOuniversal dry (35 mm) (Trockenverfahren, Plattendicke 35 mm). Der generische ÖKOBAUDAT-Datensatz des Materials (160 kg/m³, Nassverfahren) gilt für ein anderes Produkt."
      },
      "waermeleitfaehigkeit": {
        "wert": 0.045,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-steico-universal-dry",
        "hinweis": "Nennwert λD des Produkts STEICOuniversal dry (35 mm) laut Technischem Merkblatt."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": 0.047,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-steico-universal-dry",
        "hinweis": "Bemessungswert λB für Deutschland laut Technischem Merkblatt STEICOuniversal dry (35 mm) (Österreich und Schweiz haben eigene Werte, sie gelten nicht für Deutschland)."
      },
      "brandverhalten": {
        "wert": "E",
        "art": "richtwert",
        "quelle": "hersteller-steico-universal-dry",
        "hinweis": "Euroklasse E nach DIN EN 13501-1 laut Technischem Merkblatt. Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils."
      },
      "wasserdampf_mu": {
        "wert": 3,
        "einheit": "–",
        "art": "richtwert",
        "quelle": "hersteller-steico-universal-dry",
        "hinweis": "Wasserdampf-Diffusionswiderstandszahl μ = 3 laut Technischem Merkblatt."
      },
      "waermekapazitaet": {
        "wert": 2100,
        "einheit": "J/(kg·K)",
        "art": "richtwert",
        "quelle": "hersteller-steico-universal-dry",
        "hinweis": "Spezifische Wärmekapazität c = 2.100 J/(kg·K) laut Technischem Merkblatt."
      },
      "preis": {
        "wert": null,
        "einheit": "€/m³",
        "art": null,
        "quelle": null,
        "hinweis": "Preis nicht verfügbar: Für dieses Produkt wurde kein verlässlicher Händlerpreis abgerufen; es wurde kein Wert angenommen."
      },
      "gwp": {
        "werte": {
          "gesamt": -202,
          "fossil": 161,
          "biogen": -363,
          "luluc": 0.843
        },
        "einheit": "kg CO2e",
        "deklarierte_einheit": "1 m³",
        "module": "A1-A3",
        "art": "richtwert",
        "quelle": "epd-steico-universal-dry",
        "hinweis": "Produktspezifische EPD des Herstellers (EPD Global, NEPD-11389-11389-2, ausgestellt 08.04.2026, gültig bis 07.04.2031): Werte je 1 m³, Module A1–A3 (EN 15804+A2). GWP gesamt -202, fossil 161, biogen -363, luluc 0,843 kg CO₂e/m³. Der Gesamtwert ist negativ, weil biogener Kohlenstoff gespeichert ist; er wird deshalb nicht farbig bewertet, maßgeblich ist der fossile Anteil. Die EPD wurde mit dem EPD-Tool Emidat erstellt (keine Einzelprüfung der EPD genannt, siehe Quelle)."
      }
    }
  },
  {
    "id": "porit-pp2-035-365-l008",
    "material": "porenbeton",
    "name": "PORIT Planstein PP 2 / 0,35, 365 mm (λR 0,08)",
    "hersteller": "Cirkel GmbH & Co. KG (PORIT)",
    "standard": false,
    "datenblatt": "preisliste-cirkel-2026-porit-21096",
    "beschreibung": "Porenbeton-Planstein der Festigkeitsklasse 2 und Rohdichteklasse 0,35, Wanddicke 365 mm; λR, Festigkeitsklasse und Listenpreis aus der Cirkel-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.08,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-porit-21096",
        "hinweis": "Rechenwert der Wärmeleitzahl λR = 0,08 W/(m·K) des Produkts PORIT Planstein PP 2 / 0,35, 365 mm (λR 0,08) (Spalte „Wärmeleitzahl λR“ der Cirkel-Preisliste 2026, Seite 30); nicht ausdrücklich als Nennwert λD oder als Bemessungswert nach DIN 4108-4 bzw. Zulassung bezeichnet."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 2,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-porit-21096",
        "hinweis": "Festigkeitsklasse 2 (PP 2) laut Preisliste. Klassenwert wie im Materialdatensatz (Porenbeton, Festigkeitsklasse PP2 = 2), keine gemessene Druckfestigkeit des Steins."
      },
      "rohdichte": {
        "wert": null,
        "einheit": "kg/m³",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Die Preisliste nennt nur die Rohdichteklasse 0,35, keinen Wert in kg/m³; der generische Wert (380 kg/m³) gilt für Rohdichteklasse 0,40. Benötigt: Leistungserklärung oder Datenblatt des Produkts."
      },
      "gwp": {
        "werte": null,
        "einheit": "kg CO2e",
        "deklarierte_einheit": null,
        "module": null,
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Der generische ÖKOBAUDAT-Datensatz gilt für Porenbeton der Rohdichteklasse 0,40; die auf der Cirkel-Seite genannte Branchen-EPD (Bundesverband Porenbetonindustrie, Durchschnitt über viele Werke, mittlere Rohdichte 428 kg/m³) ist keine produktspezifische Deklaration und wurde nicht übernommen."
      },
      "preis": {
        "wert": 334.0,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-porit-21096",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Preis franko laut Cirkel-Preisliste 2026, ohne Dünnbettmörtel, Kranentladung und Mehrwertsteuer)",
        "hinweis": "Cirkel-Preisliste 2026 (Seite 30), Art.-Nr. 21096: 334,00 €/m³ Mauerwerk netto, frei Baustelle (Beiladung); kein aktuell abgerufener Händlerpreis. Dünnbettmörtel, Kranentladung und Umsatzsteuer kommen hinzu; Preise anderer Wanddicken weichen ab."
      }
    }
  },
  {
    "id": "porit-pp2-035-365-l009",
    "material": "porenbeton",
    "name": "PORIT Planstein PP 2 / 0,35, 365 mm (λR 0,09)",
    "hersteller": "Cirkel GmbH & Co. KG (PORIT)",
    "standard": false,
    "datenblatt": "preisliste-cirkel-2026-porit-21097",
    "beschreibung": "Porenbeton-Planstein der Festigkeitsklasse 2 und Rohdichteklasse 0,35, Wanddicke 365 mm; λR, Festigkeitsklasse und Listenpreis aus der Cirkel-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.09,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-porit-21097",
        "hinweis": "Rechenwert der Wärmeleitzahl λR = 0,09 W/(m·K) des Produkts PORIT Planstein PP 2 / 0,35, 365 mm (λR 0,09) (Spalte „Wärmeleitzahl λR“ der Cirkel-Preisliste 2026, Seite 30); nicht ausdrücklich als Nennwert λD oder als Bemessungswert nach DIN 4108-4 bzw. Zulassung bezeichnet."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 2,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-porit-21097",
        "hinweis": "Festigkeitsklasse 2 (PP 2) laut Preisliste. Klassenwert wie im Materialdatensatz (Porenbeton, Festigkeitsklasse PP2 = 2), keine gemessene Druckfestigkeit des Steins."
      },
      "rohdichte": {
        "wert": null,
        "einheit": "kg/m³",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Die Preisliste nennt nur die Rohdichteklasse 0,35, keinen Wert in kg/m³; der generische Wert (380 kg/m³) gilt für Rohdichteklasse 0,40. Benötigt: Leistungserklärung oder Datenblatt des Produkts."
      },
      "gwp": {
        "werte": null,
        "einheit": "kg CO2e",
        "deklarierte_einheit": null,
        "module": null,
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Der generische ÖKOBAUDAT-Datensatz gilt für Porenbeton der Rohdichteklasse 0,40; die auf der Cirkel-Seite genannte Branchen-EPD (Bundesverband Porenbetonindustrie, Durchschnitt über viele Werke, mittlere Rohdichte 428 kg/m³) ist keine produktspezifische Deklaration und wurde nicht übernommen."
      },
      "preis": {
        "wert": 308.0,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-porit-21097",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Preis franko laut Cirkel-Preisliste 2026, ohne Dünnbettmörtel, Kranentladung und Mehrwertsteuer)",
        "hinweis": "Cirkel-Preisliste 2026 (Seite 30), Art.-Nr. 21097: 308,00 €/m³ Mauerwerk netto, frei Baustelle (Beiladung); kein aktuell abgerufener Händlerpreis. Dünnbettmörtel, Kranentladung und Umsatzsteuer kommen hinzu; Preise anderer Wanddicken weichen ab."
      }
    }
  },
  {
    "id": "porit-pp2-040-365-l010",
    "material": "porenbeton",
    "name": "PORIT Planstein PP 2 / 0,40, 365 mm (λR 0,10)",
    "hersteller": "Cirkel GmbH & Co. KG (PORIT)",
    "standard": false,
    "datenblatt": "preisliste-cirkel-2026-porit-21098",
    "beschreibung": "Porenbeton-Planstein der Festigkeitsklasse 2 und Rohdichteklasse 0,40, Wanddicke 365 mm; λR, Festigkeitsklasse und Listenpreis aus der Cirkel-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.1,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-porit-21098",
        "hinweis": "Rechenwert der Wärmeleitzahl λR = 0,10 W/(m·K) des Produkts PORIT Planstein PP 2 / 0,40, 365 mm (λR 0,10) (Spalte „Wärmeleitzahl λR“ der Cirkel-Preisliste 2026, Seite 30); nicht ausdrücklich als Nennwert λD oder als Bemessungswert nach DIN 4108-4 bzw. Zulassung bezeichnet."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 2,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-porit-21098",
        "hinweis": "Festigkeitsklasse 2 (PP 2) laut Preisliste. Klassenwert wie im Materialdatensatz (Porenbeton, Festigkeitsklasse PP2 = 2), keine gemessene Druckfestigkeit des Steins."
      },
      "rohdichte": {
        "wert": null,
        "einheit": "kg/m³",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Die Preisliste nennt nur die Rohdichteklasse 0,40, keinen Wert in kg/m³; der generische Wert (380 kg/m³) gilt für Rohdichteklasse 0,40. Benötigt: Leistungserklärung oder Datenblatt des Produkts."
      },
      "gwp": {
        "werte": null,
        "einheit": "kg CO2e",
        "deklarierte_einheit": null,
        "module": null,
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Der generische ÖKOBAUDAT-Datensatz gilt für Porenbeton der Rohdichteklasse 0,40; die auf der Cirkel-Seite genannte Branchen-EPD (Bundesverband Porenbetonindustrie, Durchschnitt über viele Werke, mittlere Rohdichte 428 kg/m³) ist keine produktspezifische Deklaration und wurde nicht übernommen."
      },
      "preis": {
        "wert": 301.0,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-porit-21098",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Preis franko laut Cirkel-Preisliste 2026, ohne Dünnbettmörtel, Kranentladung und Mehrwertsteuer)",
        "hinweis": "Cirkel-Preisliste 2026 (Seite 30), Art.-Nr. 21098: 301,00 €/m³ Mauerwerk netto, frei Baustelle (Beiladung); kein aktuell abgerufener Händlerpreis. Dünnbettmörtel, Kranentladung und Umsatzsteuer kommen hinzu; Preise anderer Wanddicken weichen ab."
      }
    }
  },
  {
    "id": "porit-pp4-050-365-l012",
    "material": "porenbeton",
    "name": "PORIT Planstein PP 4 / 0,50, 365 mm (λR 0,12)",
    "hersteller": "Cirkel GmbH & Co. KG (PORIT)",
    "standard": false,
    "datenblatt": "preisliste-cirkel-2026-porit-21099",
    "beschreibung": "Porenbeton-Planstein der Festigkeitsklasse 4 und Rohdichteklasse 0,50, Wanddicke 365 mm; λR, Festigkeitsklasse und Listenpreis aus der Cirkel-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.12,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-porit-21099",
        "hinweis": "Rechenwert der Wärmeleitzahl λR = 0,12 W/(m·K) des Produkts PORIT Planstein PP 4 / 0,50, 365 mm (λR 0,12) (Spalte „Wärmeleitzahl λR“ der Cirkel-Preisliste 2026, Seite 30); nicht ausdrücklich als Nennwert λD oder als Bemessungswert nach DIN 4108-4 bzw. Zulassung bezeichnet."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 4,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-porit-21099",
        "hinweis": "Festigkeitsklasse 4 (PP 4) laut Preisliste. Klassenwert wie im Materialdatensatz (Porenbeton, Festigkeitsklasse PP2 = 2), keine gemessene Druckfestigkeit des Steins."
      },
      "rohdichte": {
        "wert": null,
        "einheit": "kg/m³",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Die Preisliste nennt nur die Rohdichteklasse 0,50, keinen Wert in kg/m³; der generische Wert (380 kg/m³) gilt für Rohdichteklasse 0,40. Benötigt: Leistungserklärung oder Datenblatt des Produkts."
      },
      "gwp": {
        "werte": null,
        "einheit": "kg CO2e",
        "deklarierte_einheit": null,
        "module": null,
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Der generische ÖKOBAUDAT-Datensatz gilt für Porenbeton der Rohdichteklasse 0,40; die auf der Cirkel-Seite genannte Branchen-EPD (Bundesverband Porenbetonindustrie, Durchschnitt über viele Werke, mittlere Rohdichte 428 kg/m³) ist keine produktspezifische Deklaration und wurde nicht übernommen."
      },
      "preis": {
        "wert": 304.0,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-porit-21099",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Preis franko laut Cirkel-Preisliste 2026, ohne Dünnbettmörtel, Kranentladung und Mehrwertsteuer)",
        "hinweis": "Cirkel-Preisliste 2026 (Seite 30), Art.-Nr. 21099: 304,00 €/m³ Mauerwerk netto, frei Baustelle (Beiladung); kein aktuell abgerufener Händlerpreis. Dünnbettmörtel, Kranentladung und Umsatzsteuer kommen hinzu; Preise anderer Wanddicken weichen ab."
      }
    }
  },
  {
    "id": "porit-pp6-065-365-l018",
    "material": "porenbeton",
    "name": "PORIT Planstein PP 6 / 0,65, 365 mm (λR 0,18)",
    "hersteller": "Cirkel GmbH & Co. KG (PORIT)",
    "standard": false,
    "datenblatt": "preisliste-cirkel-2026-porit-21100",
    "beschreibung": "Porenbeton-Planstein der Festigkeitsklasse 6 und Rohdichteklasse 0,65, Wanddicke 365 mm; λR, Festigkeitsklasse und Listenpreis aus der Cirkel-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.18,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-porit-21100",
        "hinweis": "Rechenwert der Wärmeleitzahl λR = 0,18 W/(m·K) des Produkts PORIT Planstein PP 6 / 0,65, 365 mm (λR 0,18) (Spalte „Wärmeleitzahl λR“ der Cirkel-Preisliste 2026, Seite 30); nicht ausdrücklich als Nennwert λD oder als Bemessungswert nach DIN 4108-4 bzw. Zulassung bezeichnet."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 6,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-porit-21100",
        "hinweis": "Festigkeitsklasse 6 (PP 6) laut Preisliste. Klassenwert wie im Materialdatensatz (Porenbeton, Festigkeitsklasse PP2 = 2), keine gemessene Druckfestigkeit des Steins."
      },
      "rohdichte": {
        "wert": null,
        "einheit": "kg/m³",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Die Preisliste nennt nur die Rohdichteklasse 0,65, keinen Wert in kg/m³; der generische Wert (380 kg/m³) gilt für Rohdichteklasse 0,40. Benötigt: Leistungserklärung oder Datenblatt des Produkts."
      },
      "gwp": {
        "werte": null,
        "einheit": "kg CO2e",
        "deklarierte_einheit": null,
        "module": null,
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Der generische ÖKOBAUDAT-Datensatz gilt für Porenbeton der Rohdichteklasse 0,40; die auf der Cirkel-Seite genannte Branchen-EPD (Bundesverband Porenbetonindustrie, Durchschnitt über viele Werke, mittlere Rohdichte 428 kg/m³) ist keine produktspezifische Deklaration und wurde nicht übernommen."
      },
      "preis": {
        "wert": 309.0,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-porit-21100",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Preis franko laut Cirkel-Preisliste 2026, ohne Dünnbettmörtel, Kranentladung und Mehrwertsteuer)",
        "hinweis": "Cirkel-Preisliste 2026 (Seite 30), Art.-Nr. 21100: 309,00 €/m³ Mauerwerk netto, frei Baustelle (Beiladung); kein aktuell abgerufener Händlerpreis. Dünnbettmörtel, Kranentladung und Umsatzsteuer kommen hinzu; Preise anderer Wanddicken weichen ab."
      }
    }
  },
  {
    "id": "ks-original-ks2df-sfk12-rdk18-115",
    "material": "kalksandstein",
    "name": "KS-ORIGINAL KS 2 DF, SFK 12 – RDK 1,8 (115 mm)",
    "hersteller": "KS-ORIGINAL GmbH",
    "standard": false,
    "datenblatt": "hersteller-ks-original-ks2df-sfk12-rdk18-115",
    "beschreibung": "Kalksandstein-Vollstein KS 2 DF (Steindruckfestigkeitsklasse 12, Rohdichteklasse 1,8), Wanddicke 115 mm; λ-Obergrenze, Klasse und Steingewicht von der KS-ORIGINAL-Produktseite, Preis aus der Cirkel-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.99,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-ks-original-ks2df-sfk12-rdk18-115",
        "hinweis": "Wärmeleitfähigkeit λ ≤ 0,99 W/(m·K) laut Angabe „Steindaten“ auf der Produktseite von KS-ORIGINAL KS 2 DF, SFK 12 – RDK 1,8 (115 mm); als Obergrenze (≤) angegeben, nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 12,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "hersteller-ks-original-ks2df-sfk12-rdk18-115",
        "hinweis": "Steindruckfestigkeitsklasse 12 laut Produktseite (Klassenwert in N/mm² nach DIN EN 771-2 / DIN 20000-402; Steindruckfestigkeit, keine gemessene Einzelfestigkeit und nicht die Festigkeit des Mauerwerks)."
      },
      "rohdichte": {
        "wert": 1683,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-ks-18313",
        "hinweis": "Von uns berechnet: Steingewicht ca. 5,25 kg (Cirkel-Preisliste 2026, Seite 12; die KS-ORIGINAL-Produktseite nennt ca. 5,20 kg) ÷ Steinvolumen 0,0031188 m³ = ca. 1683 kg/m³. Das Steingewicht ist eine Circa-Angabe und enthält die übliche Feuchte, der Wert ist deshalb eine Näherung; er passt zur Rohdichteklasse 1,8."
      },
      "gwp": {
        "werte": null,
        "einheit": "kg CO2e",
        "deklarierte_einheit": null,
        "module": null,
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Der generische ÖKOBAUDAT-Datensatz „Kalksandstein“ gilt für 2.000 kg/m³ (Rohdichteklasse 2,0); die Branchen-EPD des Bundesverbands Kalksandsteinindustrie ist ein Durchschnitt über viele Werke und keine Deklaration dieses Produkts. Es wurde kein Wert angenommen."
      },
      "preis": {
        "wert": 374.26,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-ks-18313",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Preis Palette/Folie franko laut Cirkel-Preisliste 2026, ohne Mörtel, Kranentladung und Mehrwertsteuer)",
        "hinweis": "Cirkel-Preisliste 2026 (Seite 12, Art.-Nr. 18313): 1.167,25 € je 1.000 Stück netto, umgerechnet über das Steinvolumen (0.240 × 0.115 × 0.113 m = 0,003119 m³) auf €/m³ (Rechnung in der Quelle hinterlegt). Preis des Steins, nicht des fertigen Mauerwerks (Mörtelfugen und Verschnitt fehlen); kein aktuell abgerufener Händlerpreis; Umsatzsteuer kommt hinzu."
      }
    }
  },
  {
    "id": "ks-original-ks2df-sfk20-rdk20-115",
    "material": "kalksandstein",
    "name": "KS-ORIGINAL KS 2 DF, SFK 20 – RDK 2,0 (115 mm)",
    "hersteller": "KS-ORIGINAL GmbH",
    "standard": false,
    "datenblatt": "hersteller-ks-original-ks2df-sfk20-rdk20-115",
    "beschreibung": "Kalksandstein-Vollstein KS 2 DF (Steindruckfestigkeitsklasse 20, Rohdichteklasse 2,0), Wanddicke 115 mm; λ-Obergrenze, Klasse und Steingewicht von der KS-ORIGINAL-Produktseite, Preis aus der Cirkel-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 1.1,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-ks-original-ks2df-sfk20-rdk20-115",
        "hinweis": "Wärmeleitfähigkeit λ ≤ 1,1 W/(m·K) laut Angabe „Steindaten“ auf der Produktseite von KS-ORIGINAL KS 2 DF, SFK 20 – RDK 2,0 (115 mm); als Obergrenze (≤) angegeben, nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 20,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "hersteller-ks-original-ks2df-sfk20-rdk20-115",
        "hinweis": "Steindruckfestigkeitsklasse 20 laut Produktseite (Klassenwert in N/mm² nach DIN EN 771-2 / DIN 20000-402; Steindruckfestigkeit, keine gemessene Einzelfestigkeit und nicht die Festigkeit des Mauerwerks)."
      },
      "rohdichte": {
        "wert": 1908,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-ks-18979",
        "hinweis": "Von uns berechnet: Steingewicht ca. 5,95 kg (Cirkel-Preisliste 2026, Seite 12; die KS-ORIGINAL-Produktseite nennt ca. 6,00 kg) ÷ Steinvolumen 0,0031188 m³ = ca. 1908 kg/m³. Das Steingewicht ist eine Circa-Angabe und enthält die übliche Feuchte, der Wert ist deshalb eine Näherung; er passt zur Rohdichteklasse 2,0."
      },
      "preis": {
        "wert": 410.25,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-ks-18979",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Preis Palette/Folie franko laut Cirkel-Preisliste 2026, ohne Mörtel, Kranentladung und Mehrwertsteuer)",
        "hinweis": "Cirkel-Preisliste 2026 (Seite 12, Art.-Nr. 18979): 1.279,50 € je 1.000 Stück netto, umgerechnet über das Steinvolumen (0.240 × 0.115 × 0.113 m = 0,003119 m³) auf €/m³ (Rechnung in der Quelle hinterlegt). Preis des Steins, nicht des fertigen Mauerwerks (Mörtelfugen und Verschnitt fehlen); kein aktuell abgerufener Händlerpreis; Umsatzsteuer kommt hinzu."
      }
    }
  },
  {
    "id": "ks-original-ks3df-sfk12-rdk18-175",
    "material": "kalksandstein",
    "name": "KS-ORIGINAL KS 3 DF, SFK 12 – RDK 1,8 (175 mm)",
    "hersteller": "KS-ORIGINAL GmbH",
    "standard": false,
    "datenblatt": "hersteller-ks-original-ks3df-sfk12-rdk18-175",
    "beschreibung": "Kalksandstein-Vollstein KS 3 DF (Steindruckfestigkeitsklasse 12, Rohdichteklasse 1,8), Wanddicke 175 mm; λ-Obergrenze, Klasse und Steingewicht von der KS-ORIGINAL-Produktseite, Preis aus der Cirkel-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 0.99,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-ks-original-ks3df-sfk12-rdk18-175",
        "hinweis": "Wärmeleitfähigkeit λ ≤ 0,99 W/(m·K) laut Angabe „Steindaten“ auf der Produktseite von KS-ORIGINAL KS 3 DF, SFK 12 – RDK 1,8 (175 mm); als Obergrenze (≤) angegeben, nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 12,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "hersteller-ks-original-ks3df-sfk12-rdk18-175",
        "hinweis": "Steindruckfestigkeitsklasse 12 laut Produktseite (Klassenwert in N/mm² nach DIN EN 771-2 / DIN 20000-402; Steindruckfestigkeit, keine gemessene Einzelfestigkeit und nicht die Festigkeit des Mauerwerks)."
      },
      "rohdichte": {
        "wert": 1694,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-ks-18316",
        "hinweis": "Von uns berechnet: Steingewicht ca. 8,04 kg (Cirkel-Preisliste 2026, Seite 12; die KS-ORIGINAL-Produktseite nennt ca. 8,00 kg) ÷ Steinvolumen 0,0047460 m³ = ca. 1694 kg/m³. Das Steingewicht ist eine Circa-Angabe und enthält die übliche Feuchte, der Wert ist deshalb eine Näherung; er passt zur Rohdichteklasse 1,8."
      },
      "gwp": {
        "werte": null,
        "einheit": "kg CO2e",
        "deklarierte_einheit": null,
        "module": null,
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Der generische ÖKOBAUDAT-Datensatz „Kalksandstein“ gilt für 2.000 kg/m³ (Rohdichteklasse 2,0); die Branchen-EPD des Bundesverbands Kalksandsteinindustrie ist ein Durchschnitt über viele Werke und keine Deklaration dieses Produkts. Es wurde kein Wert angenommen."
      },
      "preis": {
        "wert": 340.76,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-ks-18316",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Preis Palette/Folie franko laut Cirkel-Preisliste 2026, ohne Mörtel, Kranentladung und Mehrwertsteuer)",
        "hinweis": "Cirkel-Preisliste 2026 (Seite 12, Art.-Nr. 18316): 1.617,25 € je 1.000 Stück netto, umgerechnet über das Steinvolumen (0.240 × 0.175 × 0.113 m = 0,004746 m³) auf €/m³ (Rechnung in der Quelle hinterlegt). Preis des Steins, nicht des fertigen Mauerwerks (Mörtelfugen und Verschnitt fehlen); kein aktuell abgerufener Händlerpreis; Umsatzsteuer kommt hinzu."
      }
    }
  },
  {
    "id": "ks-original-ks3df-sfk20-rdk20-175",
    "material": "kalksandstein",
    "name": "KS-ORIGINAL KS 3 DF, SFK 20 – RDK 2,0 (175 mm)",
    "hersteller": "KS-ORIGINAL GmbH",
    "standard": false,
    "datenblatt": "hersteller-ks-original-ks3df-sfk20-rdk20-175",
    "beschreibung": "Kalksandstein-Vollstein KS 3 DF (Steindruckfestigkeitsklasse 20, Rohdichteklasse 2,0), Wanddicke 175 mm; λ-Obergrenze, Klasse und Steingewicht von der KS-ORIGINAL-Produktseite, Preis aus der Cirkel-Preisliste 2026.",
    "eigenschaften": {
      "waermeleitfaehigkeit": {
        "wert": 1.1,
        "einheit": "W/(m·K)",
        "art": "richtwert",
        "quelle": "hersteller-ks-original-ks3df-sfk20-rdk20-175",
        "hinweis": "Wärmeleitfähigkeit λ ≤ 1,1 W/(m·K) laut Angabe „Steindaten“ auf der Produktseite von KS-ORIGINAL KS 3 DF, SFK 20 – RDK 2,0 (175 mm); als Obergrenze (≤) angegeben, nicht ausdrücklich als Nenn- oder Bemessungswert bezeichnet."
      },
      "waermeleitfaehigkeit_bemessung": {
        "wert": null,
        "einheit": "W/(m·K)",
        "art": null,
        "quelle": null,
        "hinweis": "Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen."
      },
      "druckfestigkeit": {
        "wert": 20,
        "einheit": "N/mm²",
        "art": "richtwert",
        "quelle": "hersteller-ks-original-ks3df-sfk20-rdk20-175",
        "hinweis": "Steindruckfestigkeitsklasse 20 laut Produktseite (Klassenwert in N/mm² nach DIN EN 771-2 / DIN 20000-402; Steindruckfestigkeit, keine gemessene Einzelfestigkeit und nicht die Festigkeit des Mauerwerks)."
      },
      "rohdichte": {
        "wert": 1877,
        "einheit": "kg/m³",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-ks-18432",
        "hinweis": "Von uns berechnet: Steingewicht ca. 8,91 kg (Cirkel-Preisliste 2026, Seite 12; die KS-ORIGINAL-Produktseite nennt ca. 8,80 kg) ÷ Steinvolumen 0,0047460 m³ = ca. 1877 kg/m³. Das Steingewicht ist eine Circa-Angabe und enthält die übliche Feuchte, der Wert ist deshalb eine Näherung; er passt zur Rohdichteklasse 2,0."
      },
      "preis": {
        "wert": 419.83,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-cirkel-2026-ks-18432",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Preis Palette/Folie franko laut Cirkel-Preisliste 2026, ohne Mörtel, Kranentladung und Mehrwertsteuer)",
        "hinweis": "Cirkel-Preisliste 2026 (Seite 12, Art.-Nr. 18432): 1.992,50 € je 1.000 Stück netto, umgerechnet über das Steinvolumen (0.240 × 0.175 × 0.113 m = 0,004746 m³) auf €/m³ (Rechnung in der Quelle hinterlegt). Preis des Steins, nicht des fertigen Mauerwerks (Mörtelfugen und Verschnitt fehlen); kein aktuell abgerufener Händlerpreis; Umsatzsteuer kommt hinzu."
      }
    }
  },
  {
    "id": "profibaustoffe-mp2",
    "material": "kalkgipsinnenputz",
    "name": "PROFI MP2 GLÄTTPUTZ 0,8 MM Gips-Kalk-Maschinenputz, Säcke 40 kg – Preisliste Österreich",
    "hersteller": "Profibaustoffe Austria GmbH",
    "standard": false,
    "datenblatt": "preisliste-profibaustoffe-2026-mp2",
    "beschreibung": "Gips-Kalk-Maschinenputz für innen (Glättputz); nur ein Listenpreis aus Österreich (Seite 22 der Preisliste), keine Technikwerte übernommen.",
    "eigenschaften": {
      "preis": {
        "wert": 538.73,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-profibaustoffe-2026-mp2",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Trockenmischung laut Preisliste Österreich, ohne Zustellung, Wasser und Einbau)",
        "hinweis": "Preisliste Profibaustoffe Austria 2026 für Österreich (unverbindliche Preisempfehlung, gültig ab 01.01.2026 in Wien, Niederösterreich und im nördlichen Burgenland): PROFI MP2 GLÄTTPUTZ 0 489,75 €/t netto, umgerechnet mit dem Verbrauch der Liste (ca. 11 kg/m²/cm = 538,73 €/m³ Volumen des Auftrags). Kein aktuell abgerufener Händlerpreis, kein Preis für Deutschland; Zustellung, Wasser und Einbau kommen hinzu."
      }
    }
  },
  {
    "id": "profibaustoffe-mp4",
    "material": "kalkgipsinnenputz",
    "name": "PROFI MP4 0,8 MM Gips-Kalk-Maschinenputz, Säcke 40 kg – Preisliste Österreich",
    "hersteller": "Profibaustoffe Austria GmbH",
    "standard": false,
    "datenblatt": "preisliste-profibaustoffe-2026-mp4",
    "beschreibung": "Gips-Kalk-Maschinenputz für innen (Reibputz); nur ein Listenpreis aus Österreich (Seite 22 der Preisliste), keine Technikwerte übernommen.",
    "eigenschaften": {
      "preis": {
        "wert": 579.0,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-profibaustoffe-2026-mp4",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Trockenmischung laut Preisliste Österreich, ohne Zustellung, Wasser und Einbau)",
        "hinweis": "Preisliste Profibaustoffe Austria 2026 für Österreich (unverbindliche Preisempfehlung, gültig ab 01.01.2026 in Wien, Niederösterreich und im nördlichen Burgenland): PROFI MP4 0 482,50 €/t netto, umgerechnet mit dem Verbrauch der Liste (ca. 12 kg/m²/cm = 579,00 €/m³ Volumen des Auftrags). Kein aktuell abgerufener Händlerpreis, kein Preis für Deutschland; Zustellung, Wasser und Einbau kommen hinzu."
      }
    }
  },
  {
    "id": "profibaustoffe-mk1",
    "material": "kalkzementputz",
    "name": "PROFI MK1 0,8 MM Kalk-Zement-Maschinenputz, Säcke 40 kg – Preisliste Österreich",
    "hersteller": "Profibaustoffe Austria GmbH",
    "standard": false,
    "datenblatt": "preisliste-profibaustoffe-2026-mk1",
    "beschreibung": "Kalk-Zement-Maschinenputz für innen (Reibputz); nur ein Listenpreis aus Österreich (Seite 23 der Preisliste), keine Technikwerte übernommen.",
    "eigenschaften": {
      "preis": {
        "wert": 647.85,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-profibaustoffe-2026-mk1",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Trockenmischung laut Preisliste Österreich, ohne Zustellung, Wasser und Einbau)",
        "hinweis": "Preisliste Profibaustoffe Austria 2026 für Österreich (unverbindliche Preisempfehlung, gültig ab 01.01.2026 in Wien, Niederösterreich und im nördlichen Burgenland): PROFI MK1 0 462,75 €/t netto, umgerechnet mit dem Verbrauch der Liste (ca. 14 kg/m²/cm = 647,85 €/m³ Volumen des Auftrags). Kein aktuell abgerufener Händlerpreis, kein Preis für Deutschland; Zustellung, Wasser und Einbau kommen hinzu."
      }
    }
  },
  {
    "id": "profibaustoffe-mk3",
    "material": "kalkzementputz",
    "name": "PROFI MK3 0,8 MM beschleunigter Kalk-Zement-Maschinenputz, Säcke 40 kg – Preisliste Österreich",
    "hersteller": "Profibaustoffe Austria GmbH",
    "standard": false,
    "datenblatt": "preisliste-profibaustoffe-2026-mk3",
    "beschreibung": "Beschleunigter Kalk-Zement-Maschinenputz für innen (Reibputz); nur ein Listenpreis aus Österreich (Seite 23 der Preisliste), keine Technikwerte übernommen.",
    "eigenschaften": {
      "preis": {
        "wert": 651.63,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-profibaustoffe-2026-mk3",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Trockenmischung laut Preisliste Österreich, ohne Zustellung, Wasser und Einbau)",
        "hinweis": "Preisliste Profibaustoffe Austria 2026 für Österreich (unverbindliche Preisempfehlung, gültig ab 01.01.2026 in Wien, Niederösterreich und im nördlichen Burgenland): PROFI MK3 0 501,25 €/t netto, umgerechnet mit dem Verbrauch der Liste (ca. 13 kg/m²/cm = 651,63 €/m³ Volumen des Auftrags). Kein aktuell abgerufener Händlerpreis, kein Preis für Deutschland; Zustellung, Wasser und Einbau kommen hinzu."
      }
    }
  },
  {
    "id": "profibaustoffe-alphafliessestrich-4mm-ca-c20",
    "material": "calciumsulfatestrich",
    "name": "PROFI ALPHAFLIESSESTRICH 4 MM CA-C20-F4 (E225), Silo – Preisliste Österreich",
    "hersteller": "Profibaustoffe Austria GmbH",
    "standard": false,
    "datenblatt": "preisliste-profibaustoffe-2026-alphafliessestrich-4mm-ca-c20",
    "beschreibung": "Calciumsulfatfließestrich CA-C20-F4 (E225) als Silo-Trockenmischung; nur ein Listenpreis aus Österreich (Seite 127 der Preisliste), keine Technikwerte übernommen.",
    "eigenschaften": {
      "preis": {
        "wert": 887.49,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-profibaustoffe-2026-alphafliessestrich-4mm-ca-c20",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Trockenmischung laut Preisliste Österreich, ohne Zustellung, Wasser und Einbau)",
        "hinweis": "Preisliste Profibaustoffe Austria 2026 für Österreich (unverbindliche Preisempfehlung, gültig ab 01.01.2026 in Wien, Niederösterreich und im nördlichen Burgenland): PROFI ALPHAFLIESSESTRICH 4 MM CA-C20-F4 (E225) 467,10 €/t netto, umgerechnet mit dem Verbrauch der Liste (ca. 19 kg/m²/cm = 887,49 €/m³ Volumen des Auftrags). Kein aktuell abgerufener Händlerpreis, kein Preis für Deutschland; Zustellung, Wasser und Einbau kommen hinzu."
      }
    }
  },
  {
    "id": "profibaustoffe-alphafliessestrich-4mm-ca-c30",
    "material": "calciumsulfatestrich",
    "name": "PROFI ALPHAFLIESSESTRICH 4 MM CA-C30-F6 (E300), Silo – Preisliste Österreich",
    "hersteller": "Profibaustoffe Austria GmbH",
    "standard": false,
    "datenblatt": "preisliste-profibaustoffe-2026-alphafliessestrich-4mm-ca-c30",
    "beschreibung": "Calciumsulfatfließestrich CA-C30-F6 (E300) als Silo-Trockenmischung; nur ein Listenpreis aus Österreich (Seite 127 der Preisliste), keine Technikwerte übernommen.",
    "eigenschaften": {
      "preis": {
        "wert": 1005.29,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-profibaustoffe-2026-alphafliessestrich-4mm-ca-c30",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Trockenmischung laut Preisliste Österreich, ohne Zustellung, Wasser und Einbau)",
        "hinweis": "Preisliste Profibaustoffe Austria 2026 für Österreich (unverbindliche Preisempfehlung, gültig ab 01.01.2026 in Wien, Niederösterreich und im nördlichen Burgenland): PROFI ALPHAFLIESSESTRICH 4 MM CA-C30-F6 (E300) 529,10 €/t netto, umgerechnet mit dem Verbrauch der Liste (ca. 19 kg/m²/cm = 1005,29 €/m³ Volumen des Auftrags). Kein aktuell abgerufener Händlerpreis, kein Preis für Deutschland; Zustellung, Wasser und Einbau kommen hinzu."
      }
    }
  },
  {
    "id": "profibaustoffe-alphafliessestrich-2mm-ca-c20",
    "material": "calciumsulfatestrich",
    "name": "PROFI ALPHAFLIESSESTRICH 2 MM CA-C20-F4 (E225), Säcke 40 kg – Preisliste Österreich",
    "hersteller": "Profibaustoffe Austria GmbH",
    "standard": false,
    "datenblatt": "preisliste-profibaustoffe-2026-alphafliessestrich-2mm-ca-c20",
    "beschreibung": "Calciumsulfatfließestrich CA-C20-F4 (E225), Körnung 2 mm, in Säcken; nur ein Listenpreis aus Österreich (Seite 128 der Preisliste), keine Technikwerte übernommen.",
    "eigenschaften": {
      "preis": {
        "wert": 973.75,
        "einheit": "€/m³",
        "art": "richtwert",
        "quelle": "preisliste-profibaustoffe-2026-alphafliessestrich-2mm-ca-c20",
        "mwst": "exkl. MwSt.",
        "umfang": "Material (Trockenmischung laut Preisliste Österreich, ohne Zustellung, Wasser und Einbau)",
        "hinweis": "Preisliste Profibaustoffe Austria 2026 für Österreich (unverbindliche Preisempfehlung, gültig ab 01.01.2026 in Wien, Niederösterreich und im nördlichen Burgenland): PROFI ALPHAFLIESSESTRICH 2 MM CA-C20-F4 (E225) 512,50 €/t netto, umgerechnet mit dem Verbrauch der Liste (ca. 19 kg/m²/cm = 973,75 €/m³ Volumen des Auftrags). Kein aktuell abgerufener Händlerpreis, kein Preis für Deutschland; Zustellung, Wasser und Einbau kommen hinzu."
      }
    }
  }
];
