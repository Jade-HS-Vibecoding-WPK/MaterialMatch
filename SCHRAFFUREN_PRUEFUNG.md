# Prüfung der Baustoff-Schraffuren (MaterialMatch 3.8, Stand 19.11.2026)

Diese Datei dokumentiert, welche Schraffuren in MaterialMatch verwendet werden, woher die Muster stammen und was **nicht** belegt ist.
Die Zeichnungen liegen in `img/schraffuren/`, die Zuordnung in `data/schraffuren.js`. Beides erzeugt `tools/erzeuge_schraffuren.py`.

## Kurzfassung (für die Projektleitung)

- **Vorher:** Von den 50 Schraffuren waren die meisten **freie Illustrationen** (Dachziegel-Schuppen, Wollknäuel bei Schafwolle, Sechsecke bei XPS/PIR/Schaumglas, Kreise bei EPS/Porenbeton, Backsteinverband bei Klinker, Splitter bei Spanplatte …). Das sind keine Schraffuren, wie sie in Plänen verwendet werden. Sie hießen deshalb schon seit 3.1 „schematische Materialillustrationen“.
- **Jetzt:** Jede Schraffur gehört zu einer **Baustoffgruppe, deren Darstellung in einer frei lesbaren Lehrbuchquelle abgebildet ist**. 43 von 50 Baustoffen haben eine solche Schraffur, 7 haben bewusst **keine** (neutraler Platzhalter), weil ich keine belegbare Darstellung gefunden habe.
- **Nicht behauptet:** Die Muster sind **nicht** als „DIN-konform“ bestätigt. Die Normen (DIN 1356-1, DIN ISO 128-50 bzw. Nachfolger) sind kostenpflichtig und lagen mir nicht im Volltext vor. Ich habe die Muster nach der **Wiedergabe in einem Lehrbuch** nachgezeichnet (eigene, vereinfachte Zeichnung).
- **Was ihr tun könnt (freiwillig):** Die Muster einmal mit der Norm vergleichen (Hochschulbibliothek, Beuth/DIN-Media-Zugang der Hochschule). Falls ein Muster abweicht, nur `tools/erzeuge_schraffuren.py` anpassen und neu erzeugen.

## Quellen

| Nr. | Quelle | Was ich daraus verwendet habe | Stand der Prüfung |
|---|---|---|---|
| Q1 | Europa-Fachbuchreihe Bautechnik „Technisches Zeichnen“, 6. Auflage (Verlag Europa-Lehrmittel), Abschnitt 2.6 „Schraffuren und Farben in Bauzeichnungen“, Tabelle „Schraffuren und Farben DIN 1356-1“ und „Schraffuren DIN ISO 128-50“; frei abrufbare Leseprobe unter https://www.bauberufe.eu/images/doks/zeichnen_414156.pdf (abgerufen 19.11.2026) | Liste der Baustoffgruppen und das Aussehen der Muster (Mauerwerk, Beton, Stahlbeton, Mörtel/Putz, Dämmstoff, Vollholz quer/längs, Holzwerkstoffe, Stahl, Sperrstoff, Glas). Das Lehrbuch gibt die Normdarstellungen wieder, ist aber selbst keine Norm. | gelesen, Muster angesehen |
| Q2 | Dieselbe Quelle, Text 2.6.1/2.6.2 | Schnittflächen sind hervorzuheben (breite Umrisslinie, Punktraster oder **Schraffur unter 45°**). Wo die Normdarstellungen nicht ausreichen, dürfen eigene Schraffuren verwendet werden, wenn sie in einer **Legende** erklärt werden. | gelesen |
| Q3 | DIN-Seite zu DIN 1356-1 (Bauzeichnungen, Grundregeln der Darstellung), Ausgabe 2024-04 | Nur der **Status**: laut DIN ist die Ausgabe 1995 durch DIN 1356-1:2024-04 ersetzt. | nur Titel/Status gesehen (Suchergebnis), Normtext nicht gelesen |
| Q4 | DIN-Seiten zu DIN ISO 128-50 und DIN 201 | Nur der **Status**: DIN ISO 128-50:2002-05 gilt laut diesen Seiten nicht mehr (ersetzt durch DIN EN ISO 128-3:2022-02), DIN 201 ist ebenfalls zurückgezogen. | nur Status gesehen, Normtext nicht gelesen |
| Q5 | Universität Hamburg „Bauzeichnen I“ und Universität Wuppertal „Übung Bauzeichnen“ | Bestätigen nur, dass Mauerwerk, Beton, Stahlbeton, Mörtel, Dämmstoffe, Abdichtungen, Holz quer/längs und Stahl als eigene Schraffurarten gelehrt werden. Die Muster selbst standen in den von mir lesbaren Fassungen nicht. | Seiten nicht abrufbar (Netzsperre), nur Suchauszug |

Ausdrücklich **nicht** verwendet: Forenbeiträge, CAD-Bibliotheken ohne nachvollziehbare Normangabe, eigene Vermutungen.

## Wichtige Einschränkungen

1. **Die zitierte Tabelle gilt für DIN 1356-1 (ältere Fassung) und DIN ISO 128-50 (zurückgezogen).** Ob die aktuelle DIN 1356-1:2024-04 oder DIN EN ISO 128-3 einzelne Muster anders darstellt, konnte ich **nicht** prüfen.
2. **Die beiden Normen unterscheiden sich in der Quelle selbst**, z. B. beim Mauerwerk: DIN 1356-1 zeigt Linien unter 45°, DIN ISO 128-50 waagerechte Linien. MaterialMatch folgt der **DIN-1356-1-Darstellung** (Grundschraffur 45°), weil sie in der Praxis der Bauzeichnung verbreiteter ist. Das ist eine Entscheidung des Projekts.
3. **Die Muster sind eigene Vereinfachungen** (Linienabstände, Strichlängen, Schleifenform). Sie sollen die Konvention erkennbar machen, nicht millimetergenau wiedergeben.
4. **Farben** der Normdarstellung (z. B. Beton grün, Mauerwerk rot) werden bewusst **nicht** verwendet: MaterialMatch nutzt Farben für Bewertungen. Die Schraffuren bleiben einfarbig dunkelgrau.
5. **Gleiche Schraffur heißt nicht gleiches Material.** Alle Dämmstoffe zeigen dasselbe Muster („Dämmstoff“), weil die Quelle nur diese eine Darstellung nennt. Unterschiede zeigt das Foto.
6. **Baustoffe ohne Eintrag in der Quelle** (Aluminium, Zink, Dachziegel, Keramikfliese, Faserzement, Gipskarton, Gipsfaserplatte) bekommen **keine erfundene Schraffur**, sondern den neutralen Platzhalter mit dem Text „Keine belegte Schraffur vorhanden“.

## Gruppen und Muster

| Gruppe | Muster (eigene Zeichnung) | Quelle |
|---|---|---|
| Mauerwerk aus künstlichen Steinen | parallele Linien unter 45° | Q1 (DIN 1356-1) |
| Mauerwerk aus Natursteinen | parallele Linien unter 45°, weiterer Abstand | Q1 (DIN 1356-1) |
| Beton (unbewehrt) | Linien unter 45°, gestrichelt | Q1 |
| Stahlbeton | Linien unter 45°, durchgezogen im Wechsel mit gestrichelten | Q1 |
| Mörtel, Putz | Punktraster | Q1 (DIN 1356-1) |
| Dämmstoff | Kette länglicher Schleifen | Q1 (beide Normen) |
| Vollholz | links quer zur Faser (schräge, gebogene Linien), rechts längs zur Faser (gewellte waagerechte Linien) | Q1 |
| Holzwerkstoffe | senkrechte, leicht gewellte Linien | Q1 |
| Stahl | geschwärzte Schnittfläche (Profil bzw. dünnes Blech) | Q1 |
| Sperrstoff (Abdichtung) | Streifen aus schwarzen und weißen Abschnitten | Q1 |
| Glas | kurze Schrägstriche | Q1 (DIN ISO 128-50) |

Statusbegriffe in der folgenden Tabelle: **Gruppe in der Quelle genannt** = der Baustoff oder seine Gruppe steht ausdrücklich in Q1.
**Gruppenzuordnung durch das Projekt** = der Baustoff steht dort nicht eigens, wird aber einer übergeordneten Gruppe zugeordnet (z. B. Porenbeton → Mauerwerk aus künstlichen Steinen, Zementestrich → Mörtel/Putz, Bitumenbahn → Sperrstoff, Brettschichtholz → Vollholz). Diese Zuordnung ist fachlich vertretbar, aber **nicht eigens belegt**.

## Ergebnis je Baustoff

| Baustoff | Schraffurgruppe | Muster (schematisch) | Status |
|---|---|---|---|
| Aluminiumblech (`aluminium`) | – | – | keine belegte Darstellung → Platzhalter – In der geprüften Quelle ist nur Stahl, nicht aber Aluminium oder andere Metalle dargestellt. |
| Baustahl (Profile und Stabstahl) (`baustahl`) | Stahl | geschwärzte Schnittfläche | Gruppe in der Quelle genannt |
| Betondachstein (`betondachstein`) | Beton (unbewehrt) | Linien unter 45°, gestrichelt | Gruppenzuordnung durch das Projekt |
| Bitumenbahn (PYE PV 200 S5, ungeschiefert) (`bitumenbahn`) | Sperrstoff (Abdichtung) | Streifen aus schwarzen und weißen Abschnitten | Gruppenzuordnung durch das Projekt |
| Brettschichtholz (BSH, GL24h) (`brettschichtholz`) | Vollholz (quer und längs zur Faser) | links quer, rechts längs zur Faser | Gruppenzuordnung durch das Projekt |
| Brettsperrholz (BSP / CLT) (`brettsperrholz`) | Vollholz (quer und längs zur Faser) | links quer, rechts längs zur Faser | Gruppenzuordnung durch das Projekt |
| Calciumsulfatestrich (`calciumsulfatestrich`) | Mörtel, Putz | Punktraster | Gruppenzuordnung durch das Projekt |
| Dachziegel (Tonziegel) (`dachziegel`) | – | – | keine belegte Darstellung → Platzhalter – Die Quelle nennt Ziegel nur als Mauerwerk; für Dachziegel gibt es dort keine eigene Darstellung. |
| EPDM-Dachbahn (`epdm`) | Sperrstoff (Abdichtung) | Streifen aus schwarzen und weißen Abschnitten | Gruppenzuordnung durch das Projekt |
| EPS (expandiertes Polystyrol) (`eps`) | Dämmstoff | Kette länglicher Schleifen | Gruppe in der Quelle genannt |
| Faserzementplatte (Fassade) (`faserzement`) | – | – | keine belegte Darstellung → Platzhalter – Für Faserzement steht in der geprüften Quelle keine Darstellung. |
| Flachsdämmung (Flachsvlies) (`flachsdaemmung`) | Dämmstoff | Kette länglicher Schleifen | Gruppe in der Quelle genannt |
| Gipsfaserplatte (10 mm) (`gipsfaserplatte`) | – | – | keine belegte Darstellung → Platzhalter – Für Gipsfaserplatten steht in der geprüften Quelle keine Darstellung. |
| Gipsplatte (nach DIN EN 520 / DIN 18180) (`gipskarton`) | – | – | keine belegte Darstellung → Platzhalter – Für Gipskarton steht in der geprüften Quelle keine Darstellung. |
| Fensterglas (Einfachglas) (`glas`) | Glas | kurze Schrägstriche | Gruppe in der Quelle genannt |
| Glaswolle (SAGLAN, phenolharzgebunden) (`glaswolle`) | Dämmstoff | Kette länglicher Schleifen | Gruppe in der Quelle genannt |
| Hanfdämmung (`hanfdaemmung`) | Dämmstoff | Kette länglicher Schleifen | Gruppe in der Quelle genannt |
| Mauerziegel, ungefüllt (Hochlochziegel) (`hochlochziegel`) | Mauerwerk aus künstlichen Steinen | parallele Linien unter 45° (Grundschraffur) | Gruppe in der Quelle genannt |
| Holzfaserdämmung (`holzfaserdaemmung`) | Dämmstoff | Kette länglicher Schleifen | Gruppe in der Quelle genannt |
| Kalk-Gips-Innenputz (`kalkgipsinnenputz`) | Mörtel, Putz | Punktraster | Gruppe in der Quelle genannt |
| Kalksandstein (`kalksandstein`) | Mauerwerk aus künstlichen Steinen | parallele Linien unter 45° (Grundschraffur) | Gruppe in der Quelle genannt |
| Kalkzement-Putzmörtel (`kalkzementputz`) | Mörtel, Putz | Punktraster | Gruppe in der Quelle genannt |
| Keramische Fliesen (Steinzeug, unglasiert) (`keramikfliese`) | – | – | keine belegte Darstellung → Platzhalter – Für Keramikfliesen steht in der geprüften Quelle keine Darstellung. |
| Klinker (Fassadenklinker) (`klinker`) | Mauerwerk aus künstlichen Steinen | parallele Linien unter 45° (Grundschraffur) | Gruppe in der Quelle genannt |
| Konstruktionsvollholz (KVH, C24) (`konstruktionsvollholz`) | Vollholz (quer und längs zur Faser) | links quer, rechts längs zur Faser | Gruppe in der Quelle genannt |
| Kork (expandiert) (`kork`) | Dämmstoff | Kette länglicher Schleifen | Gruppe in der Quelle genannt |
| Leichtbetonstein (Naturbims) (`leichtbetonstein_bims`) | Mauerwerk aus künstlichen Steinen | parallele Linien unter 45° (Grundschraffur) | Gruppenzuordnung durch das Projekt |
| Leichtbetonstein (Blähton, Planstein Außenwand) (`leichtbetonstein_blaehton`) | Mauerwerk aus künstlichen Steinen | parallele Linien unter 45° (Grundschraffur) | Gruppenzuordnung durch das Projekt |
| Massivholz Laubholz (Schnittholz, getrocknet) (`massivholz_laub`) | Vollholz (quer und längs zur Faser) | links quer, rechts längs zur Faser | Gruppe in der Quelle genannt |
| Massivholz Nadelholz (Schnittholz, getrocknet) (`massivholz_nadel`) | Vollholz (quer und längs zur Faser) | links quer, rechts längs zur Faser | Gruppe in der Quelle genannt |
| Mineralwolle (Fassadendämmung) (`mineralwolle`) | Dämmstoff | Kette länglicher Schleifen | Gruppe in der Quelle genannt |
| Naturstein, hart (Fassadenplatte 30 mm) (`naturstein_hart`) | Mauerwerk aus Natursteinen | parallele Linien unter 45°, weiterer Abstand | Gruppe in der Quelle genannt |
| Naturstein, weich (Fassadenplatte 40 mm) (`naturstein_weich`) | Mauerwerk aus Natursteinen | parallele Linien unter 45°, weiterer Abstand | Gruppe in der Quelle genannt |
| Normalbeton (C25/30) (`normalbeton`) | Beton (unbewehrt) | Linien unter 45°, gestrichelt | Gruppe in der Quelle genannt |
| OSB-Platte (`osb`) | Holzwerkstoffe | senkrechte, leicht gewellte Linien | Gruppe in der Quelle genannt |
| PIR-Hartschaum (`pir`) | Dämmstoff | Kette länglicher Schleifen | Gruppe in der Quelle genannt |
| Porenbeton (P2 04, unbewehrt) (`porenbeton`) | Mauerwerk aus künstlichen Steinen | parallele Linien unter 45° (Grundschraffur) | Gruppenzuordnung durch das Projekt |
| PUR-Hartschaum (`pur`) | Dämmstoff | Kette länglicher Schleifen | Gruppe in der Quelle genannt |
| Schafwolle (Isolena) (`schafwolle`) | Dämmstoff | Kette länglicher Schleifen | Gruppe in der Quelle genannt |
| Schaumglas (`schaumglas`) | Dämmstoff | Kette länglicher Schleifen | Gruppe in der Quelle genannt |
| Schiefer (Schieferplatten) (`schiefer`) | Mauerwerk aus Natursteinen | parallele Linien unter 45°, weiterer Abstand | Gruppenzuordnung durch das Projekt |
| Spanplatte (roh) (`spanplatte`) | Holzwerkstoffe | senkrechte, leicht gewellte Linien | Gruppe in der Quelle genannt |
| Sperrholz (Furniersperrholz) (`sperrholz`) | Holzwerkstoffe | senkrechte, leicht gewellte Linien | Gruppe in der Quelle genannt |
| Stahlbeton (C30/37, bewehrt) (`stahlbeton`) | Stahlbeton | Linien unter 45°, durchgezogen im Wechsel mit gestrichelten | Gruppe in der Quelle genannt |
| Stahlblech (Feinblech 0,3–3,0 mm) (`stahlblech`) | Stahl | geschwärzte Schnittfläche (dünnes Bauteil) | Gruppe in der Quelle genannt |
| Steinwolle (Flachdämmplatte) (`steinwolle`) | Dämmstoff | Kette länglicher Schleifen | Gruppe in der Quelle genannt |
| XPS (extrudiertes Polystyrol) (`xps`) | Dämmstoff | Kette länglicher Schleifen | Gruppe in der Quelle genannt |
| Zellulosedämmung (`zellulose`) | Dämmstoff | Kette länglicher Schleifen | Gruppe in der Quelle genannt |
| Zementestrich (`zementestrich`) | Mörtel, Putz | Punktraster | Gruppenzuordnung durch das Projekt |
| Zinkblech (RHEINZINK-CLASSIC walzblank) (`zinkblech`) | – | – | keine belegte Darstellung → Platzhalter – In der geprüften Quelle ist nur Stahl, nicht aber Zink oder andere Metalle dargestellt. |

Zählung: 32 × „Gruppe genannt“, 11 × „Gruppenzuordnung“, 7 × „keine belegte Darstellung“ (zusammen 50).

## Was sich in der Anwendung geändert hat

- **Foto, Schraffur, Platzhalter** sind klar getrennt: Das **Foto** zeigt das Material (Standard), die **Schraffur** kennzeichnet es im Plan, der **Platzhalter** erscheint, wenn es keine belegte Schraffur gibt. Eine „Materialtextur“ als dritte Bildart gibt es nicht.
- Unter der Schraffur steht die Gruppe („Schraffur: Dämmstoff, schematisch“; bei Zuordnung durch das Projekt „(Gruppenzuordnung)“) bzw. „Keine belegte Schraffur vorhanden“.
- „Quellen & Details → Schraffuren“ erklärt die Grenzen und listet die Schraffur je Baustoff mit Quelle.
- Der Umschalter **Foto | Schraffur** im Steckbrief bleibt erhalten. Die Rückfallkette (Foto → Schraffur → Platzhalter) bleibt unverändert.

## Offene Punkte

- Muster mit dem Normtext vergleichen (DIN 1356-1:2024-04, DIN EN ISO 128-3), sobald ein Zugang besteht (Hochschulbibliothek). Bis dahin gilt: **nicht normgeprüft**.
- Für Aluminium, Zink, Dachziegel, Keramikfliese, Faserzement, Gipskarton und Gipsfaserplatten eine **belegbare** Darstellung suchen (z. B. aus der Norm oder einer Herstellerbibliothek mit Normangabe). Erst dann ein Muster ergänzen.
- Unterscheidung „weicher“ und „harter“ Dämmstoff wurde in einer Suche erwähnt, aber nicht belegt; deshalb nicht umgesetzt.
