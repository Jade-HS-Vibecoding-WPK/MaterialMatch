# MaterialMatch – weiterhin fehlende Kennwerte und Gründe

Erzeugt am 2026-11-18 mit `node tools/pruefe_datenqualitaet.js --bericht` (Daten: data).

**Zählweise:** Es zählt, was im Echtdaten-Modus sichtbar ist. Ein Kennwert ist *belegt*, wenn ein Wert mit Datenart Richtwert/verifiziert und Quelle vorliegt (Standardprodukte überlagern das allgemeine Material). *Nur Beispiel* = Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). *Fehlt* = trotz Recherche kein belastbarer Wert. *n. a.* = fachlich nicht sinnvoll.

## Überblick

| | Anzahl |
|---|---|
| Baustoffe | 50 |
| Produkte | 85 |
| Quellen | 173 |
| Kennwert-Felder (50 × 10) | 500 |
| belegt | 157 |
| nur Beispiel | 76 |
| fehlt | 248 |
| nicht anwendbar | 19 |
| Materialien mit belegtem Preis | 20 von 50 |
| Produkte mit Preis | 43 |

## Je Kennwert

| Kennwert | belegt | nur Beispiel | fehlt | n. a. | Grund, weshalb Lücken bleiben |
|---|---|---|---|---|---|
| Preis | 20 | 9 | 21 | 0 | Kein frei abrufbarer deutscher Händler- oder Herstellerpreis gefunden (BKI-Baupreise kostenpflichtig; HORNBACH, BAUHAUS, OBI, Baustoffshop, benz24 und Contorion blockieren automatische Abrufe, das wurde nicht umgangen; Heinze verbietet automatisches Auslesen). Preise stehen bei Produkten mit Preisliste und als Preisspanne bei allgemeinen Baustoffen mit mindestens zwei belegten Produktpreisen (Händlerpreise von bausep.de seit MaterialMatch 3.3). |
| Rohdichte | 38 | 3 | 9 | 0 | Der ÖKOBAUDAT-Datensatz nennt für dieses Material keine Rohdichte. |
| Wärmeleitfähigkeit λ (Nennwert) | 9 | 9 | 32 | 0 | Bemessungs- und Nennwerte stehen in kostenpflichtigen Normen (DIN 4108-4, DIN EN ISO 10456); für das allgemeine Material liegt kein frei zugänglicher, passender Herstellerwert vor. Produkte mit Herstellerangabe tragen ihre eigenen Werte. |
| Bemessungswert λB | 2 | 0 | 48 | 0 | Der Bemessungswert nach DIN 4108-4 bzw. Zulassung ist kostenpflichtig oder produktspezifisch; ein Wert wird nur bei Produkten mit Herstellerangabe für Deutschland geführt. |
| Spezifische Wärmekapazität | 1 | 15 | 34 | 0 | Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben gibt es nur für einzelne Produkte. |
| Druckfestigkeit | 3 | 5 | 24 | 18 | Für das allgemeine Material gibt es keine einheitliche Druckfestigkeit (Klasse hängt vom Produkt ab); belegte Klassenwerte stehen bei Produkten. |
| Brandverhalten (Euroklasse) | 32 | 5 | 13 | 0 | Keine ohne Prüfung gültige EU-Einstufung gefunden, die auf das allgemeine Material zutrifft; die EU-Entscheidungen 2003/593/EG u. a. waren am 18.11.2026 nicht abrufbar (EUR-Lex antwortet mit einer Bot-Prüfung, nicht umgangen). |
| Wasserdampf-Diffusionswiderstand μ | 3 | 13 | 33 | 1 | Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben nur für einzelne Produkte. |
| CO₂ / GWP | 49 | 0 | 1 | 0 | Es gibt keinen passenden ÖKOBAUDAT-Datensatz für dieses Material. |
| Recyclingfähigkeit | 0 | 17 | 33 | 0 | Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein. |

## Je Baustoff

| Baustoff | Preis | Rohdichte | Wärmeleitfähigkeit | Bemessungswert | Spezifische | Druckfestigkeit | Brandverhalten | Wasserdampf-Diffusionswiderstand | CO₂ | Recyclingfähigkeit |
|---|---|---|---|---|---|---|---|---|---|---|
| Normalbeton (C25/30) | belegt | belegt | nur Beispiel | FEHLT | nur Beispiel | belegt | belegt | nur Beispiel | belegt | nur Beispiel |
| Stahlbeton (C30/37, bewehrt) | nur Beispiel | nur Beispiel | nur Beispiel | FEHLT | nur Beispiel | nur Beispiel | belegt | nur Beispiel | FEHLT | nur Beispiel |
| Mauerziegel, ungefüllt (Hochlochziegel) | nur Beispiel | belegt | belegt | FEHLT | nur Beispiel | belegt | belegt | nur Beispiel | belegt | nur Beispiel |
| Porenbeton (P2 04, unbewehrt) | belegt | belegt | belegt | FEHLT | nur Beispiel | belegt | belegt | nur Beispiel | belegt | nur Beispiel |
| Brettsperrholz (BSP / CLT) | nur Beispiel | belegt | nur Beispiel | FEHLT | nur Beispiel | nur Beispiel | nur Beispiel | nur Beispiel | belegt | nur Beispiel |
| Brettschichtholz (BSH, GL24h) | nur Beispiel | belegt | nur Beispiel | FEHLT | nur Beispiel | nur Beispiel | nur Beispiel | nur Beispiel | belegt | nur Beispiel |
| Konstruktionsvollholz (KVH, C24) | belegt | belegt | nur Beispiel | FEHLT | nur Beispiel | nur Beispiel | nur Beispiel | nur Beispiel | belegt | nur Beispiel |
| Baustahl (Profile und Stabstahl) | nur Beispiel | belegt | nur Beispiel | FEHLT | nur Beispiel | n. a. | belegt | n. a. | belegt | nur Beispiel |
| Mineralwolle (Fassadendämmung) | belegt | belegt | belegt | belegt | nur Beispiel | n. a. | belegt | belegt | belegt | nur Beispiel |
| EPS (expandiertes Polystyrol) | belegt | belegt | belegt | belegt | nur Beispiel | n. a. | belegt | nur Beispiel | belegt | nur Beispiel |
| Holzfaserdämmung | belegt | belegt | nur Beispiel | FEHLT | nur Beispiel | n. a. | nur Beispiel | nur Beispiel | belegt | nur Beispiel |
| Zellulosedämmung | nur Beispiel | belegt | belegt | FEHLT | belegt | n. a. | belegt | belegt | belegt | nur Beispiel |
| Hanfdämmung | nur Beispiel | belegt | belegt | FEHLT | nur Beispiel | n. a. | belegt | nur Beispiel | belegt | nur Beispiel |
| Klinker (Fassadenklinker) | nur Beispiel | belegt | nur Beispiel | FEHLT | nur Beispiel | nur Beispiel | belegt | nur Beispiel | belegt | nur Beispiel |
| Gipsplatte (nach DIN EN 520 / DIN 18180) | nur Beispiel | nur Beispiel | nur Beispiel | FEHLT | nur Beispiel | n. a. | nur Beispiel | nur Beispiel | belegt | nur Beispiel |
| OSB-Platte | belegt | belegt | belegt | FEHLT | nur Beispiel | n. a. | belegt | nur Beispiel | belegt | nur Beispiel |
| Dachziegel (Tonziegel) | belegt | nur Beispiel | FEHLT | FEHLT | FEHLT | n. a. | belegt | FEHLT | belegt | nur Beispiel |
| Leichtbetonstein (Naturbims) | FEHLT | belegt | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT | belegt | FEHLT |
| Leichtbetonstein (Blähton, Planstein Außenwand) | FEHLT | belegt | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT | belegt | FEHLT |
| Kalksandstein | belegt | belegt | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT | belegt | FEHLT |
| Massivholz Nadelholz (Schnittholz, getrocknet) | FEHLT | belegt | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT |
| Massivholz Laubholz (Schnittholz, getrocknet) | FEHLT | belegt | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT |
| Glaswolle (SAGLAN, phenolharzgebunden) | belegt | belegt | belegt | FEHLT | FEHLT | n. a. | belegt | belegt | belegt | FEHLT |
| Steinwolle (Flachdämmplatte) | belegt | belegt | FEHLT | FEHLT | FEHLT | n. a. | belegt | FEHLT | belegt | FEHLT |
| XPS (extrudiertes Polystyrol) | belegt | belegt | FEHLT | FEHLT | FEHLT | n. a. | FEHLT | FEHLT | belegt | FEHLT |
| PUR-Hartschaum | belegt | belegt | FEHLT | FEHLT | FEHLT | n. a. | FEHLT | FEHLT | belegt | FEHLT |
| PIR-Hartschaum | belegt | belegt | FEHLT | FEHLT | FEHLT | n. a. | FEHLT | FEHLT | belegt | FEHLT |
| Flachsdämmung (Flachsvlies) | FEHLT | belegt | FEHLT | FEHLT | FEHLT | n. a. | FEHLT | FEHLT | belegt | FEHLT |
| Kork (expandiert) | FEHLT | belegt | FEHLT | FEHLT | FEHLT | n. a. | FEHLT | FEHLT | belegt | FEHLT |
| Schaumglas | belegt | belegt | FEHLT | FEHLT | FEHLT | n. a. | belegt | FEHLT | belegt | FEHLT |
| Schafwolle (Isolena) | FEHLT | belegt | FEHLT | FEHLT | FEHLT | n. a. | FEHLT | FEHLT | belegt | FEHLT |
| Faserzementplatte (Fassade) | FEHLT | belegt | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT | belegt | FEHLT |
| Aluminiumblech | FEHLT | belegt | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT | belegt | FEHLT |
| Stahlblech (Feinblech 0,3–3,0 mm) | FEHLT | belegt | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT | belegt | FEHLT |
| Naturstein, hart (Fassadenplatte 30 mm) | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT | belegt | FEHLT |
| Naturstein, weich (Fassadenplatte 40 mm) | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT | belegt | FEHLT |
| Keramische Fliesen (Steinzeug, unglasiert) | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT | belegt | FEHLT |
| Kalkzement-Putzmörtel | belegt | belegt | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT | belegt | FEHLT |
| Fensterglas (Einfachglas) | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT | belegt | FEHLT |
| Gipsfaserplatte (10 mm) | belegt | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT |
| Spanplatte (roh) | FEHLT | belegt | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT |
| Sperrholz (Furniersperrholz) | FEHLT | belegt | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT |
| Zementestrich | FEHLT | belegt | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT | belegt | FEHLT |
| Calciumsulfatestrich | belegt | belegt | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT | belegt | FEHLT |
| Kalk-Gips-Innenputz | belegt | belegt | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT | belegt | FEHLT |
| Betondachstein | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT | belegt | FEHLT |
| Schiefer (Schieferplatten) | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT | belegt | FEHLT |
| Zinkblech (RHEINZINK-CLASSIC walzblank) | FEHLT | belegt | belegt | FEHLT | FEHLT | FEHLT | belegt | FEHLT | belegt | FEHLT |
| Bitumenbahn (PYE PV 200 S5, ungeschiefert) | belegt | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT |
| EPDM-Dachbahn | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | FEHLT | belegt | FEHLT |

## Lückenliste (jeder fehlende Kennwert mit Begründung)

### Normalbeton (C25/30) (`normalbeton`)

- **Wärmeleitfähigkeit λ (Nennwert):** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Bemessungs- und Nennwerte stehen in kostenpflichtigen Normen (DIN 4108-4, DIN EN ISO 10456); für das allgemeine Material liegt kein frei zugänglicher, passender Herstellerwert vor. Produkte mit Herstellerangabe tragen ihre eigenen Werte.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben gibt es nur für einzelne Produkte.
- **Wasserdampf-Diffusionswiderstand μ:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben nur für einzelne Produkte.
- **Recyclingfähigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein.

### Stahlbeton (C30/37, bewehrt) (`stahlbeton`)

- **Preis:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Kein frei abrufbarer deutscher Händler- oder Herstellerpreis gefunden (BKI-Baupreise kostenpflichtig; HORNBACH, BAUHAUS, OBI, Baustoffshop, benz24 und Contorion blockieren automatische Abrufe, das wurde nicht umgangen; Heinze verbietet automatisches Auslesen). Preise stehen bei Produkten mit Preisliste und als Preisspanne bei allgemeinen Baustoffen mit mindestens zwei belegten Produktpreisen (Händlerpreise von bausep.de seit MaterialMatch 3.3).
- **Rohdichte:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Der ÖKOBAUDAT-Datensatz nennt für dieses Material keine Rohdichte.
- **Wärmeleitfähigkeit λ (Nennwert):** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Bemessungs- und Nennwerte stehen in kostenpflichtigen Normen (DIN 4108-4, DIN EN ISO 10456); für das allgemeine Material liegt kein frei zugänglicher, passender Herstellerwert vor. Produkte mit Herstellerangabe tragen ihre eigenen Werte.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben gibt es nur für einzelne Produkte.
- **Druckfestigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Für das allgemeine Material gibt es keine einheitliche Druckfestigkeit (Klasse hängt vom Produkt ab); belegte Klassenwerte stehen bei Produkten.
- **Wasserdampf-Diffusionswiderstand μ:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben nur für einzelne Produkte.
- **CO₂ / GWP:** Kein eigener ÖKOBAUDAT-Datensatz für Stahlbeton. Der Wert ließe sich nur aus Beton plus Bewehrung zusammensetzen und braucht dafür einen Bewehrungsgrad, der hier nicht festgelegt wurde. Kennwert fehlt.
- **Recyclingfähigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein.

### Mauerziegel, ungefüllt (Hochlochziegel) (`hochlochziegel`)

- **Preis:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Kein frei abrufbarer deutscher Händler- oder Herstellerpreis gefunden (BKI-Baupreise kostenpflichtig; HORNBACH, BAUHAUS, OBI, Baustoffshop, benz24 und Contorion blockieren automatische Abrufe, das wurde nicht umgangen; Heinze verbietet automatisches Auslesen). Preise stehen bei Produkten mit Preisliste und als Preisspanne bei allgemeinen Baustoffen mit mindestens zwei belegten Produktpreisen (Händlerpreise von bausep.de seit MaterialMatch 3.3).
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben gibt es nur für einzelne Produkte.
- **Wasserdampf-Diffusionswiderstand μ:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben nur für einzelne Produkte.
- **Recyclingfähigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein.

### Porenbeton (P2 04, unbewehrt) (`porenbeton`)

- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben gibt es nur für einzelne Produkte.
- **Wasserdampf-Diffusionswiderstand μ:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben nur für einzelne Produkte.
- **Recyclingfähigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein.

### Brettsperrholz (BSP / CLT) (`brettsperrholz`)

- **Preis:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Kein frei abrufbarer deutscher Händler- oder Herstellerpreis gefunden (BKI-Baupreise kostenpflichtig; HORNBACH, BAUHAUS, OBI, Baustoffshop, benz24 und Contorion blockieren automatische Abrufe, das wurde nicht umgangen; Heinze verbietet automatisches Auslesen). Preise stehen bei Produkten mit Preisliste und als Preisspanne bei allgemeinen Baustoffen mit mindestens zwei belegten Produktpreisen (Händlerpreise von bausep.de seit MaterialMatch 3.3).
- **Wärmeleitfähigkeit λ (Nennwert):** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Bemessungs- und Nennwerte stehen in kostenpflichtigen Normen (DIN 4108-4, DIN EN ISO 10456); für das allgemeine Material liegt kein frei zugänglicher, passender Herstellerwert vor. Produkte mit Herstellerangabe tragen ihre eigenen Werte.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben gibt es nur für einzelne Produkte.
- **Druckfestigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Für das allgemeine Material gibt es keine einheitliche Druckfestigkeit (Klasse hängt vom Produkt ab); belegte Klassenwerte stehen bei Produkten.
- **Brandverhalten (Euroklasse):** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Keine ohne Prüfung gültige EU-Einstufung gefunden, die auf das allgemeine Material zutrifft; die EU-Entscheidungen 2003/593/EG u. a. waren am 18.11.2026 nicht abrufbar (EUR-Lex antwortet mit einer Bot-Prüfung, nicht umgangen).
- **Wasserdampf-Diffusionswiderstand μ:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben nur für einzelne Produkte.
- **Recyclingfähigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein.

### Brettschichtholz (BSH, GL24h) (`brettschichtholz`)

- **Preis:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Kein frei abrufbarer deutscher Händler- oder Herstellerpreis gefunden (BKI-Baupreise kostenpflichtig; HORNBACH, BAUHAUS, OBI, Baustoffshop, benz24 und Contorion blockieren automatische Abrufe, das wurde nicht umgangen; Heinze verbietet automatisches Auslesen). Preise stehen bei Produkten mit Preisliste und als Preisspanne bei allgemeinen Baustoffen mit mindestens zwei belegten Produktpreisen (Händlerpreise von bausep.de seit MaterialMatch 3.3).
- **Wärmeleitfähigkeit λ (Nennwert):** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Bemessungs- und Nennwerte stehen in kostenpflichtigen Normen (DIN 4108-4, DIN EN ISO 10456); für das allgemeine Material liegt kein frei zugänglicher, passender Herstellerwert vor. Produkte mit Herstellerangabe tragen ihre eigenen Werte.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben gibt es nur für einzelne Produkte.
- **Druckfestigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Für das allgemeine Material gibt es keine einheitliche Druckfestigkeit (Klasse hängt vom Produkt ab); belegte Klassenwerte stehen bei Produkten.
- **Brandverhalten (Euroklasse):** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Keine ohne Prüfung gültige EU-Einstufung gefunden, die auf das allgemeine Material zutrifft; die EU-Entscheidungen 2003/593/EG u. a. waren am 18.11.2026 nicht abrufbar (EUR-Lex antwortet mit einer Bot-Prüfung, nicht umgangen).
- **Wasserdampf-Diffusionswiderstand μ:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben nur für einzelne Produkte.
- **Recyclingfähigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein.

### Konstruktionsvollholz (KVH, C24) (`konstruktionsvollholz`)

- **Wärmeleitfähigkeit λ (Nennwert):** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Bemessungs- und Nennwerte stehen in kostenpflichtigen Normen (DIN 4108-4, DIN EN ISO 10456); für das allgemeine Material liegt kein frei zugänglicher, passender Herstellerwert vor. Produkte mit Herstellerangabe tragen ihre eigenen Werte.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben gibt es nur für einzelne Produkte.
- **Druckfestigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Für das allgemeine Material gibt es keine einheitliche Druckfestigkeit (Klasse hängt vom Produkt ab); belegte Klassenwerte stehen bei Produkten.
- **Brandverhalten (Euroklasse):** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Keine ohne Prüfung gültige EU-Einstufung gefunden, die auf das allgemeine Material zutrifft; die EU-Entscheidungen 2003/593/EG u. a. waren am 18.11.2026 nicht abrufbar (EUR-Lex antwortet mit einer Bot-Prüfung, nicht umgangen).
- **Wasserdampf-Diffusionswiderstand μ:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben nur für einzelne Produkte.
- **Recyclingfähigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein.

### Baustahl (Profile und Stabstahl) (`baustahl`)

- **Preis:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Kein frei abrufbarer deutscher Händler- oder Herstellerpreis gefunden (BKI-Baupreise kostenpflichtig; HORNBACH, BAUHAUS, OBI, Baustoffshop, benz24 und Contorion blockieren automatische Abrufe, das wurde nicht umgangen; Heinze verbietet automatisches Auslesen). Preise stehen bei Produkten mit Preisliste und als Preisspanne bei allgemeinen Baustoffen mit mindestens zwei belegten Produktpreisen (Händlerpreise von bausep.de seit MaterialMatch 3.3).
- **Wärmeleitfähigkeit λ (Nennwert):** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Bemessungs- und Nennwerte stehen in kostenpflichtigen Normen (DIN 4108-4, DIN EN ISO 10456); für das allgemeine Material liegt kein frei zugänglicher, passender Herstellerwert vor. Produkte mit Herstellerangabe tragen ihre eigenen Werte.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben gibt es nur für einzelne Produkte.
- **Recyclingfähigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein.

### Mineralwolle (Fassadendämmung) (`mineralwolle`)

- **Spezifische Wärmekapazität:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben gibt es nur für einzelne Produkte.
- **Recyclingfähigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein.

### EPS (expandiertes Polystyrol) (`eps`)

- **Spezifische Wärmekapazität:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben gibt es nur für einzelne Produkte.
- **Wasserdampf-Diffusionswiderstand μ:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben nur für einzelne Produkte.
- **Recyclingfähigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein.

### Holzfaserdämmung (`holzfaserdaemmung`)

- **Wärmeleitfähigkeit λ (Nennwert):** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Bemessungs- und Nennwerte stehen in kostenpflichtigen Normen (DIN 4108-4, DIN EN ISO 10456); für das allgemeine Material liegt kein frei zugänglicher, passender Herstellerwert vor. Produkte mit Herstellerangabe tragen ihre eigenen Werte.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben gibt es nur für einzelne Produkte.
- **Brandverhalten (Euroklasse):** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Keine ohne Prüfung gültige EU-Einstufung gefunden, die auf das allgemeine Material zutrifft; die EU-Entscheidungen 2003/593/EG u. a. waren am 18.11.2026 nicht abrufbar (EUR-Lex antwortet mit einer Bot-Prüfung, nicht umgangen).
- **Wasserdampf-Diffusionswiderstand μ:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben nur für einzelne Produkte.
- **Recyclingfähigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein.

### Zellulosedämmung (`zellulose`)

- **Preis:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Kein frei abrufbarer deutscher Händler- oder Herstellerpreis gefunden (BKI-Baupreise kostenpflichtig; HORNBACH, BAUHAUS, OBI, Baustoffshop, benz24 und Contorion blockieren automatische Abrufe, das wurde nicht umgangen; Heinze verbietet automatisches Auslesen). Preise stehen bei Produkten mit Preisliste und als Preisspanne bei allgemeinen Baustoffen mit mindestens zwei belegten Produktpreisen (Händlerpreise von bausep.de seit MaterialMatch 3.3).
- **Bemessungswert λB:** Nicht verfügbar: Das ISOCELL-Datenblatt nennt Bemessungswerte für Österreich (0,038), die Schweiz (0,037) und in der deutschen Fassung 0,039 W/(m·K) für Deutschland (Herstellerangabe). Ein Beleg aus einer gültigen deutschen Zulassung oder aus DIN 4108-4 liegt nicht vor: Die Zulassung Z-23.11-1236 war nur bis 26.04.2021 gültig (DIBt-Zulassungsdownload), DIN 4108-4 ist kostenpflichtig und wurde nicht eingesehen. Der Schweizer oder österreichische Wert wird nicht als deutscher Bemessungswert verwendet.
- **Recyclingfähigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein.

### Hanfdämmung (`hanfdaemmung`)

- **Preis:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Kein frei abrufbarer deutscher Händler- oder Herstellerpreis gefunden (BKI-Baupreise kostenpflichtig; HORNBACH, BAUHAUS, OBI, Baustoffshop, benz24 und Contorion blockieren automatische Abrufe, das wurde nicht umgangen; Heinze verbietet automatisches Auslesen). Preise stehen bei Produkten mit Preisliste und als Preisspanne bei allgemeinen Baustoffen mit mindestens zwei belegten Produktpreisen (Händlerpreise von bausep.de seit MaterialMatch 3.3).
- **Bemessungswert λB:** Nicht verfügbar: Der Bemessungswert ist laut ETA nach nationalen Regeln festzulegen und steht nicht darin; ein Wert nach DIN 4108-4 oder aus einer deutschen Zulassung liegt nicht vor.
- **Spezifische Wärmekapazität:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben gibt es nur für einzelne Produkte.
- **Wasserdampf-Diffusionswiderstand μ:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben nur für einzelne Produkte.
- **Recyclingfähigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein.

### Klinker (Fassadenklinker) (`klinker`)

- **Preis:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Kein frei abrufbarer deutscher Händler- oder Herstellerpreis gefunden (BKI-Baupreise kostenpflichtig; HORNBACH, BAUHAUS, OBI, Baustoffshop, benz24 und Contorion blockieren automatische Abrufe, das wurde nicht umgangen; Heinze verbietet automatisches Auslesen). Preise stehen bei Produkten mit Preisliste und als Preisspanne bei allgemeinen Baustoffen mit mindestens zwei belegten Produktpreisen (Händlerpreise von bausep.de seit MaterialMatch 3.3).
- **Wärmeleitfähigkeit λ (Nennwert):** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Bemessungs- und Nennwerte stehen in kostenpflichtigen Normen (DIN 4108-4, DIN EN ISO 10456); für das allgemeine Material liegt kein frei zugänglicher, passender Herstellerwert vor. Produkte mit Herstellerangabe tragen ihre eigenen Werte.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben gibt es nur für einzelne Produkte.
- **Druckfestigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Für das allgemeine Material gibt es keine einheitliche Druckfestigkeit (Klasse hängt vom Produkt ab); belegte Klassenwerte stehen bei Produkten.
- **Wasserdampf-Diffusionswiderstand μ:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben nur für einzelne Produkte.
- **Recyclingfähigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein.

### Gipsplatte (nach DIN EN 520 / DIN 18180) (`gipskarton`)

- **Preis:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Kein frei abrufbarer deutscher Händler- oder Herstellerpreis gefunden (BKI-Baupreise kostenpflichtig; HORNBACH, BAUHAUS, OBI, Baustoffshop, benz24 und Contorion blockieren automatische Abrufe, das wurde nicht umgangen; Heinze verbietet automatisches Auslesen). Preise stehen bei Produkten mit Preisliste und als Preisspanne bei allgemeinen Baustoffen mit mindestens zwei belegten Produktpreisen (Händlerpreise von bausep.de seit MaterialMatch 3.3).
- **Rohdichte:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Der ÖKOBAUDAT-Datensatz nennt für dieses Material keine Rohdichte.
- **Wärmeleitfähigkeit λ (Nennwert):** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Bemessungs- und Nennwerte stehen in kostenpflichtigen Normen (DIN 4108-4, DIN EN ISO 10456); für das allgemeine Material liegt kein frei zugänglicher, passender Herstellerwert vor. Produkte mit Herstellerangabe tragen ihre eigenen Werte.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben gibt es nur für einzelne Produkte.
- **Brandverhalten (Euroklasse):** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Keine ohne Prüfung gültige EU-Einstufung gefunden, die auf das allgemeine Material zutrifft; die EU-Entscheidungen 2003/593/EG u. a. waren am 18.11.2026 nicht abrufbar (EUR-Lex antwortet mit einer Bot-Prüfung, nicht umgangen).
- **Wasserdampf-Diffusionswiderstand μ:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben nur für einzelne Produkte.
- **Recyclingfähigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein.

### OSB-Platte (`osb`)

- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert nach DIN 4108-4 oder aus einer gültigen Zulassung liegt für dieses Produkt nicht vor; es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben gibt es nur für einzelne Produkte.
- **Wasserdampf-Diffusionswiderstand μ:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben nur für einzelne Produkte.
- **Recyclingfähigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein.

### Dachziegel (Tonziegel) (`dachziegel`)

- **Rohdichte:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Der ÖKOBAUDAT-Datensatz nennt für dieses Material keine Rohdichte.
- **Wärmeleitfähigkeit λ (Nennwert):** Noch nicht recherchiert. Kennwert fehlt.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben gibt es nur für einzelne Produkte.
- **Wasserdampf-Diffusionswiderstand μ:** Normwerte (DIN EN ISO 10456) kostenpflichtig; Herstellerangaben nur für einzelne Produkte.
- **Recyclingfähigkeit:** Nur Demonstrationswert ohne Quelle (im Echtdaten-Modus ausgeblendet). Es gibt keine vergleichbaren Messwerte, nur Freitext; Angaben von WECOBIS/baubook dürfen nicht kopiert werden bzw. erfordern eine Anmeldung. Recyclingfähigkeit fließt deshalb nicht in die Bewertung ein.

### Leichtbetonstein (Naturbims) (`leichtbetonstein_bims`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Leichtbetonstein (Blähton, Planstein Außenwand) (`leichtbetonstein_blaehton`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Kalksandstein (`kalksandstein`)

- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Massivholz Nadelholz (Schnittholz, getrocknet) (`massivholz_nadel`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Brandverhalten (Euroklasse):** Nicht verfügbar: Die Euroklasse hängt vom konkreten Produkt ab. Ein geprüfter Beleg (Leistungserklärung) liegt noch nicht vor.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Massivholz Laubholz (Schnittholz, getrocknet) (`massivholz_laub`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Brandverhalten (Euroklasse):** Nicht verfügbar: Die Euroklasse hängt vom konkreten Produkt ab. Ein geprüfter Beleg (Leistungserklärung) liegt noch nicht vor.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Glaswolle (SAGLAN, phenolharzgebunden) (`glaswolle`)

- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Steinwolle (Flachdämmplatte) (`steinwolle`)

- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### XPS (extrudiertes Polystyrol) (`xps`)

- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Brandverhalten (Euroklasse):** Nicht verfügbar: Die Euroklasse hängt vom konkreten Produkt ab. Ein geprüfter Beleg (Leistungserklärung) liegt noch nicht vor.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### PUR-Hartschaum (`pur`)

- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Brandverhalten (Euroklasse):** Nicht verfügbar: Die Euroklasse hängt vom konkreten Produkt ab. Ein geprüfter Beleg (Leistungserklärung) liegt noch nicht vor.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### PIR-Hartschaum (`pir`)

- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Brandverhalten (Euroklasse):** Nicht verfügbar: Die Euroklasse hängt vom konkreten Produkt ab. Ein geprüfter Beleg (Leistungserklärung) liegt noch nicht vor.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Flachsdämmung (Flachsvlies) (`flachsdaemmung`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Brandverhalten (Euroklasse):** Nicht verfügbar: Die Euroklasse hängt vom konkreten Produkt ab. Ein geprüfter Beleg (Leistungserklärung) liegt noch nicht vor.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Kork (expandiert) (`kork`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Brandverhalten (Euroklasse):** Nicht verfügbar: Die Euroklasse hängt vom konkreten Produkt ab. Ein geprüfter Beleg (Leistungserklärung) liegt noch nicht vor.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Schaumglas (`schaumglas`)

- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Schafwolle (Isolena) (`schafwolle`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Brandverhalten (Euroklasse):** Nicht verfügbar: Die Euroklasse hängt vom konkreten Produkt ab. Ein geprüfter Beleg (Leistungserklärung) liegt noch nicht vor.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Faserzementplatte (Fassade) (`faserzement`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Aluminiumblech (`aluminium`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Stahlblech (Feinblech 0,3–3,0 mm) (`stahlblech`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Naturstein, hart (Fassadenplatte 30 mm) (`naturstein_hart`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Rohdichte:** Nicht verfügbar: Der ÖKOBAUDAT-Datensatz nennt für dieses Produkt keine Rohdichte (nur das Flächengewicht).
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Naturstein, weich (Fassadenplatte 40 mm) (`naturstein_weich`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Rohdichte:** Nicht verfügbar: Der ÖKOBAUDAT-Datensatz nennt für dieses Produkt keine Rohdichte (nur das Flächengewicht).
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Keramische Fliesen (Steinzeug, unglasiert) (`keramikfliese`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Rohdichte:** Nicht verfügbar: Der ÖKOBAUDAT-Datensatz nennt für dieses Produkt keine Rohdichte (nur das Flächengewicht).
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Kalkzement-Putzmörtel (`kalkzementputz`)

- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Fensterglas (Einfachglas) (`glas`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Rohdichte:** Nicht verfügbar: Der ÖKOBAUDAT-Datensatz nennt für dieses Produkt keine Rohdichte (nur das Flächengewicht).
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Gipsfaserplatte (10 mm) (`gipsfaserplatte`)

- **Rohdichte:** Nicht verfügbar: Der ÖKOBAUDAT-Datensatz nennt für dieses Produkt keine Rohdichte (nur das Flächengewicht).
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Brandverhalten (Euroklasse):** Nicht verfügbar: Die Euroklasse hängt vom konkreten Produkt ab. Ein geprüfter Beleg (Leistungserklärung) liegt noch nicht vor.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Spanplatte (roh) (`spanplatte`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Brandverhalten (Euroklasse):** Nicht verfügbar: Die Euroklasse hängt vom konkreten Produkt ab. Ein geprüfter Beleg (Leistungserklärung) liegt noch nicht vor.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Sperrholz (Furniersperrholz) (`sperrholz`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Brandverhalten (Euroklasse):** Nicht verfügbar: Die Euroklasse hängt vom konkreten Produkt ab. Ein geprüfter Beleg (Leistungserklärung) liegt noch nicht vor.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Zementestrich (`zementestrich`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Calciumsulfatestrich (`calciumsulfatestrich`)

- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Kalk-Gips-Innenputz (`kalkgipsinnenputz`)

- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Betondachstein (`betondachstein`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Rohdichte:** Nicht verfügbar: Der ÖKOBAUDAT-Datensatz nennt für dieses Produkt keine Rohdichte (nur das Flächengewicht).
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Schiefer (Schieferplatten) (`schiefer`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Rohdichte:** Nicht verfügbar: Der ÖKOBAUDAT-Datensatz nennt für dieses Produkt keine Rohdichte (nur das Flächengewicht).
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Zinkblech (RHEINZINK-CLASSIC walzblank) (`zinkblech`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### Bitumenbahn (PYE PV 200 S5, ungeschiefert) (`bitumenbahn`)

- **Rohdichte:** Nicht verfügbar: Der ÖKOBAUDAT-Datensatz nennt für dieses Produkt keine Rohdichte (nur das Flächengewicht).
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Brandverhalten (Euroklasse):** Nicht verfügbar: Die Euroklasse hängt vom konkreten Produkt ab. Ein geprüfter Beleg (Leistungserklärung) liegt noch nicht vor.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

### EPDM-Dachbahn (`epdm`)

- **Preis:** Nicht verfügbar: Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.
- **Rohdichte:** Nicht verfügbar: Der ÖKOBAUDAT-Datensatz nennt für dieses Produkt keine Rohdichte (nur das Flächengewicht).
- **Wärmeleitfähigkeit λ (Nennwert):** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.
- **Bemessungswert λB:** Nicht verfügbar: Ein Bemessungswert der Wärmeleitfähigkeit (z. B. nach DIN 4108-4) liegt nicht vor. Die Norm ist kostenpflichtig und wurde nicht eingesehen; ein Herstellerwert wurde nicht gefunden. Es wurde kein Wert angenommen.
- **Spezifische Wärmekapazität:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Druckfestigkeit:** Nicht verfügbar: Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Brandverhalten (Euroklasse):** Nicht verfügbar: Die Euroklasse hängt vom konkreten Produkt ab. Ein geprüfter Beleg (Leistungserklärung) liegt noch nicht vor.
- **Wasserdampf-Diffusionswiderstand μ:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.
- **Recyclingfähigkeit:** Nicht verfügbar: Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.

## Quellen, die nicht (oder nicht für Zahlenwerte) nutzbar waren

- **Heinze** (www.heinze.de): Die Nutzungsbedingungen verbieten automatisiertes Auslesen und das Einspeichern in fremde Datenbanken (§ 1.6, § 5.4); nicht genutzt (RECHERCHE.md, Abschnitt 2h).
- **WECOBIS** (www.wecobis.de): erreichbar, enthält aber überwiegend beschreibende Texte (Rohstoffe, Herstellung, Entsorgung) statt Zahlenwerte; Vervielfältigung nur mit Genehmigung der Bayerischen Architektenkammer; nichts übernommen.
- **baubook** (www.baubook.info): öffentliche Seiten ohne Kennwerttabellen; die Materialdatenbank (baubook.at) verlangt eine Anmeldung; nichts übernommen.
- **EUR-Lex** (Entscheidungen zum Brandverhalten ohne Prüfung): am 18.11.2026 mit Bot-Prüfung (HTTP 202, AWS WAF) beantwortet; nicht umgangen.
- **HORNBACH, BAUHAUS, Baustoffshop, benz24, Contorion, Knauf, ISOVER**: automatische Abrufe blockiert (Bot-Abwehr); nicht umgangen.
- **OBI**: die Produktseiten waren am 18.11.2026 nicht abrufbar (404 bzw. leere Antwort); nur die in früheren Runden gelesenen Preise (Datenstand 16.11.2026) bleiben als Produktpreise erhalten.
- **Holzland, BayWa Baustoffe, MEGA, Raab Karcher**: am 18.11.2026 keine öffentlich abrufbaren Preise für die benötigten Baustoffe gefunden (Raab Karcher: keine Verbindung); nichts übernommen.
- **IBU** (ibu-epd.com, epd-online.com): ibu-epd.com antwortete am 18.11.2026 mit HTTP 503; epd-online.com ist die Erstellungsplattform mit Anmeldung. Keine EPD-Werte übernommen; ÖKOBAUDAT liefert die CO₂-Werte.
- **bausep.de** (genutzt): 14 Preisspannen in den Echtdaten (Dämmstoffe, OSB, KVH, Porenbeton, Gipsfaserplatte, Bitumenbahn); jede Spanne ist aus den Einzelpreisen mit Produktlink nachgerechnet (tests/test51.js). Nur ein Händler, deshalb Richtwert mit Spanne, kein Marktpreis.
- **Normen** (DIN 4108-4, DIN EN ISO 10456, DIN EN 1745, DIN EN 12524): kostenpflichtig, nicht eingesehen.
