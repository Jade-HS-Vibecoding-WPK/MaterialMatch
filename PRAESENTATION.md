# MaterialMatch – Material für Präsentation und Plakat

*Alle Zahlen und Demo-Werte in dieser Datei wurden am 16.11.2026 aus der laufenden App ermittelt und werden von `tests/test24.js` gegen die App geprüft. Preise, λ-Werte und Brandklassen der 17 ursprünglichen Baustoffe sind **Beispieldaten** und müssen im Vortrag so benannt werden.*

## 1. Der Pitch (30 Sekunden)
MaterialMatch ist ein Baustoff-Vergleichsrechner für den frühen Entwurf. Man wählt zwei oder drei Materialien, gibt Fläche und Dicke ein und sieht sofort Gewicht, Kosten, CO₂ und Dämmwirkung, in Tabellen und farbigen Diagrammen, und bekommt Alternativen vorgeschlagen. **Besonders daran: Die App sagt ehrlich, was sie nicht weiß.** Fehlende Werte heißen „nicht verfügbar“, nicht Vergleichbares wird nicht eingefärbt, und jeder Zahlenwert zeigt seine Quelle.

## 2. Drei Kernbotschaften
1. **Rechnen statt Schätzen.** Aus Fläche und Dicke werden Volumen, Gewicht, Kosten, CO₂ und R-Wert berechnet, mit korrekter Umrechnung von je m³, je kg und je m².
2. **Ehrlich statt schön.** Farben sind relativ zu den gewählten Materialien, nie „gut“ im Absolutsinn. Wo ein Vergleich nicht sinnvoll ist, bleibt er ungefärbt und trägt einen Hinweis, zum Beispiel „GWP gesamt“ bei Holz (gespeicherter Kohlenstoff) oder Preise ohne bekannte Mehrwertsteuer („Kein belastbarer direkter Vergleich möglich“).
3. **Nachvollziehbar statt Black Box.** Jede Empfehlung zeigt Gesamtbewertung, Teilbewertung je Kriterium, Gewichtung, Quellen und „nicht belastbar“, wenn Beispieldaten im Spiel sind. Keine KI-Schnittstelle, nur offene Regeln.

## 3. Zahlen für Folien und Plakat
| Zahl | Bedeutung |
|---|---|
| **50** Baustoffe in **5** Kategorien | Tragende Baustoffe, Dämmstoffe, Fassade, Innenausbau, Dach |
| **61** Datensätze der **ÖKOBAUDAT 2024-II** (BBSR) | Echte Ökobilanzdaten, Rohdichte und CO₂ je Baustoff (49) und je Herstellerprodukt (12) |
| **152** belegte Kennwerte | Jeder mit Quelle und Link: 97 aus der ÖKOBAUDAT (gegen die Originaldatei geprüft), 51 aus Herstellerdatenblättern, Preislisten, einer ETA, einer EPD und der EU-Entscheidung (siehe `RECHERCHE.md`) |
| **21** konkrete Produkte zu 15 Materialien · **7** Preise (2 Händlerpreise, 2 deutsche Preislisten, 3 Preise einer österreichischen Preisliste) | Mit Hersteller und Quelle; Preislisten-Preise sind netto, nicht am Abrufdatum bestätigt und die österreichischen gelten nicht für Deutschland; wo keine Produktdaten vorliegen, gilt der generische Materialdatensatz; eigene Produkte lassen sich ergänzen |
| **82** Beispieldaten · **257** „nicht verfügbar“ | Ehrlich gekennzeichnet statt erfunden; die Seite startet im Echtdaten-Modus, die Beispieldaten (gelb, „B“) lassen sich für Demos einschalten |
| **15** Entwicklungsschritte mit Freigabe nach jedem Schritt | Feste Reihenfolge laut Auftrag |
| **über 1.000** automatische Prüfungen in 50 Dateien, dazu mehrere Zehntausend Einzelvergleiche gegen unabhängige Referenzrechner | Qualitätskontrolle (Schritt 14) |
| **8** Mängel bei der Qualitätskontrolle gefunden, **0** davon in Berechnungen | Alle behoben |
| **0** Programmzeilen von Hand geschrieben | Alles über Anweisungen an Claude Code |

## 4. Live-Demo (ca. 6–8 Minuten)
Vorbereitung: `index.html` per Doppelklick öffnen (Offline-Betrieb zeigen: WLAN aus). Die Seite startet im **Echtdaten-Modus**; für die Demos A bis C oben den Schalter **„Beispieldaten (Demo) verwenden“** einschalten (oder `index.html?modus=demo` öffnen). Alle Werte unten gelten für **Fläche 100 m², Dicke 20 cm** und den **Demo-Modus**.

### Demo A – Dämmstoffe vergleichen (Kern)
1. Kategorie **B – Dämmstoffe**, Material A **Mineralwolle**, B **EPS**, C **Zellulosedämmung**; Fläche 100, Dicke 20.
2. *Menge und Gewicht:* Volumen 20 m³ je Material; Gewicht **925 kg** (Mineralwolle), **500 kg** (EPS), **900 kg** (Zellulose).
3. *Kosten (Beispielpreise!):* **1.700 €** · **1.400 €** · **2.200 €**.
4. *CO₂-Bilanz:* fossil **1.329 kg** · **1.728 kg** · **195 kg CO₂e**; Zellulose hat ein **negatives Gesamt-CO₂ (−1.454 kg)**, weil Kohlenstoff gespeichert ist. Genau deshalb weist die App „fossil“ und „biogen“ getrennt aus und färbt „gesamt“ nicht.
5. *R-Wert:* **5,71** · **5,71** · **5,41 m²K/W** (Mineralwolle und EPS: R = d / λB mit dem Bemessungswert 0,035; Zellulose hat nur den Nennwert 0,037, das Ergebnis steht dort als „orientierend, kein Wärmeschutznachweis“; nicht der U-Wert eines Bauteils). Danach *Diagramme* öffnen: Kosten und CO₂ zeigen die **berechneten Gesamtwerte** (Menge × Kennwert); unter jedem Namen steht die Rechnung (z. B. „20 m³ × 85 €/m³“), und der Block „Zugrunde liegende Mengen und Annahmen“ lässt sich aufklappen. Farbskala, Balkenlänge = Zahlenwert, Pflichtsatz „Die Farben zeigen eine relative Bewertung …“.
6. *Alternative Baustoffe:* Rang 1 **EPS (0,8 von 1)**, Rang 2 **Zellulosedämmung (0,79)**, Rang 3 **Hanfdämmung (0,16)**; jede Karte „nicht belastbar“ wegen der Beispieldaten; „So wird bewertet“ aufklappen; Knopf **„Alternative vergleichen“** bei Hanfdämmung zeigen.

### Demo B – Beton gegen Holz (der „Ehrlichkeits-Moment“)
1. Kategorie **A – Tragende Baustoffe**, A **Normalbeton**, B **Brettschichtholz**.
2. Gewicht **46.000 kg** gegen **10.304 kg**; Kosten **4.090 €** (Holcim-Listenpreis netto 204,50 €/m³) gegen **12.000 €** (Beispielpreis) – die Preise sind nicht vergleichbar, die App zeigt dafür einen Vorbehalt.
3. CO₂ gesamt **4.433 kg** gegen **−11.615 kg**, aber fossil **4.435 kg** gegen **4.806 kg**. Aussage: *Wer nur „gesamt“ liest, würde Holz zum Sieger erklären. Das Holz speichert Kohlenstoff, der am Lebensende wieder freigesetzt oder in Modul D verrechnet wird.* Die App **färbt „GWP gesamt“ deshalb nicht** (grau, mit Erklärung) und zeigt die Differenz der Gesamtwerte nicht an. Bewertet werden die **fossilen** Emissionen: Beton grün, Holz rot (nach den hier hinterlegten generischen Richtwerten mit Sicherheitszuschlägen, Unterschied ca. 8 %). Darum keine pauschale Aussage „Holz ist besser“.
4. Bei den **Kosten** (Beispielpreise) steht **„Kein belastbarer direkter Vergleich möglich“**, weil Mehrwertsteuer und Leistungsumfang unbekannt sind; die Kostendifferenz wird deshalb nicht ausgewiesen.

### Demo C – Dach und Plattenprodukte
1. Kategorie **E – Dach**, **Dachziegel**, **Betondachstein**, **Schiefer**.
2. Kein Volumen („–“): Dachsteine sind keine Schicht. Gewicht aus dem Flächengewicht: **4.500 kg** · **4.200 kg** · **3.000 kg**; die eingegebene Dicke wird nicht verwendet (steht dabei).
3. CO₂ gesamt **1.659 kg** · **1.298 kg** · **1.561 kg**. Materialkosten: **„nicht berechenbar“**, weil für diese Baustoffe kein Preis belegt ist.

### Demo D – „nicht verfügbar“ statt erfundener Zahl
Dämmstoffe: **Mineralwolle** und **Kork**: bei Kork steht λ „fehlt“ mit Begründung, Kosten und R-Wert „nicht berechenbar“, CO₂ gesamt **−1.702 kg** (Quelle mit Link in der Fußnote). Aussage: *Für 33 Baustoffe haben wir nur belegte Werte aus der ÖKOBAUDAT; alles andere bleibt bewusst leer.*

### Demo D2 – Beispieldaten ausschalten (Echtdaten-Modus)
1. Oben auf der Seite zeigt der gelbe Balken **„Demo-Modus“**: Alle mit **B** gekennzeichneten, gelb hinterlegten Werte sind frei gewählte Beispieldaten und keine geprüften Echtwerte.
2. Schalter **ausschalten** (so startet die Seite normalerweise): Die Beispielwerte gelten als „nicht verfügbar“. Bei Mineralwolle, EPS und Zellulose bleiben die **belegten λ-Werte** (λD und λB getrennt, ROCKWOOL, BACHL, ISOCELL, mit Link); der R-Wert nutzt den Bemessungswert λB, bei Hanf (nur Nennwert) steht „orientierend, kein Wärmeschutznachweis“. Kosten sind „nicht berechenbar“, und die Empfehlung beruht nur noch auf belegten Werten. Der gelbe Hinweis „Nur zur Orientierung …“ erklärt, dass Richtwerte keine verlässliche Produkt- oder Kostenberechnung erlauben.
3. Aussage: *Die Demo zeigt, wie die App aussieht, wenn Werte vorliegen. Im Echtdaten-Modus rechnet sie nur mit dem, was belegt ist.*

### Demo D3 – Produkte und Händlerpreise
1. Kategorie **B – Dämmstoffe**, Material A **Mineralwolle**: Unter dem Materialfeld erscheint das **Produkt** (vorgewählt ROCKWOOL Fixrock 035; außerdem Fixrock 033, Klemmrock 035 und „Generischer Materialdatensatz“). Karten und Spaltenköpfe nennen Produkt, Hersteller und Datenblatt-Link.
2. Material B wieder **Mineralwolle** wählen: Die App schlägt das nächste freie Produkt vor. Produkt B **Klemmrock 035**, Material C **Holzfaserdämmung** mit Produkt **STEICOflex 036**. Fläche 100 m², Dicke 12 cm.
3. *Kosten:* Fixrock zeigt **„Preis nicht verfügbar“**; Klemmrock **1.649 €** (OBI, 65,96 € je 4,0 m² bei 120 mm = 137,42 €/m³), STEICOflex **1.355 €** (OBI, 31,72 € je 2,81 m² bei 100 mm = 112,88 €/m³). Der Hinweis erklärt, dass beide Preise für bestimmte Dicken gelten (120 mm und 100 mm), und die Fußnoten nennen Händler, Artikel, Link und Abrufdatum.
4. Unten bei „Eigenes Produkt ergänzen“ ein Produkt anlegen (Quelle Pflicht): Es erscheint mit **„E“** (eigene Angabe, nicht geprüft) und bleibt im Browser gespeichert.

### Demo E – Export
„Drucken / als PDF speichern“ (Berichtskopf, Farben bleiben) und „Als CSV herunterladen“ → in Excel öffnen: Eingaben, Datenart und Quelle je Zeile.

## 5. Folienvorschlag (9 Folien)
1. **Titel und Problem:** Materialwahl im Entwurf: viele Zahlen, verschiedene Bezugsgrößen, wenig Überblick.
2. **Idee:** Die drei Kernbotschaften, Screenshot der Seite.
3. **Live-Demo** (Demo A, B, C).
4. **So wird gerechnet:** Volumen = Fläche × Dicke; Gewicht = Volumen × Rohdichte; Kosten/CO₂ = Menge × Kennwert (je nach Bezugsgröße); R = d / λ; Beispiel 100 m² × 20 cm = 20 m³.
5. **Daten und Quellen:** ÖKOBAUDAT 2024-II, Datenarten Richtwert / verifiziert / Beispieldaten, Zahlenblock aus Abschnitt 3.
6. **Ehrlichkeit als Gestaltungsprinzip:** relative Farben, „nicht verfügbar“, „Kein belastbarer Vergleich“, kein „Holz ist immer besser“.
7. **Wie wir gearbeitet haben:** Vibecoding mit Claude Code: Master-Prompt, 15 Schritte, Freigabe nach jedem Schritt, Fehler und Korrekturen (Schritt 12 vor 11).
8. **Qualität:** Tests, unabhängige Referenzrechner, absichtlich eingebaute Fehler, 8 gefundene Mängel.
9. **Grenzen und Ausblick:** Beispieldaten, fehlende Preise/λ, Quellenrecherche als nächster Schritt.

## 6. Plakat-Gliederung (A1/A0, von links oben nach rechts unten)
1. **Kopf:** MaterialMatch, Untertitel, Namen, Hochschule, Kurs.
2. **Problem und Idee** (3 Sätze) + **Screenshot** der Seite mit Diagrammen.
3. **Funktionen** als sechs Symbole: Auswahl · Eingaben · Ergebnisse · Diagramme · Alternativen · Quellen/Export.
4. **Beton gegen Holz:** Mini-Grafik „CO₂ gesamt vs. fossil“ als Beispiel für ehrlichen Vergleich (Zahlen aus Demo B).
5. **Daten:** Zahlenblock (50 / 49 / 141 / 90 / 260) und Datenarten-Legende B/R/V.
6. **Prozess:** Zeitleiste der 15 Schritte mit Freigaben; Kasten „Was ging schief und was haben wir gelernt“.
7. **Grenzen und nächste Schritte;** QR-Code zur Datei bzw. zum Projektordner; Quellenangaben (Abschnitt 9).

## 7. Mögliche Fragen und Antworten
| Frage | Antwort |
|---|---|
| Warum steht so oft „nicht verfügbar“? | Die ÖKOBAUDAT liefert Ökobilanzdaten, aber keine Preise oder λ-Werte. Für 33 Baustoffe wollten wir nichts erfinden. Belegte Werte (Hersteller, BKI) wären der nächste Schritt. |
| Sind die Preise echt? | Nein. Sie sind Beispieldaten und überall mit „B“ und „nicht belastbar“ gekennzeichnet. |
| Warum sind die Farben „nur relativ“? | Die Skala wird aus dem besten und schlechtesten Wert der gewählten Materialien berechnet. Ein grüner Balken heißt „besser als die anderen hier“, nicht „gut“. |
| Warum keine KI für die Empfehlung? | Der Auftrag verlangte eine einfache, regelbasierte Funktion. So ist jede Empfehlung aus den Zahlen nachrechenbar (Teilbewertungen und Rechenbeispiel stehen auf der Karte). |
| Wie zuverlässig sind die Ergebnisse? | Berechnungen und Empfehlungen wurden gegen unabhängig geschriebene Referenzrechner geprüft und stimmen überein. Offen bleibt, ob Beispielwerte der Wirklichkeit entsprechen. |
| Warum ist Holz nicht einfach „besser“? | Der negative biogene Anteil entsteht durch gespeicherten Kohlenstoff. Er wird am Lebensende wieder freigesetzt oder in Modul D verrechnet. Darum zeigt die App fossil und biogen getrennt. |
| Was könnt ihr nicht? | Bauteilaufbauten, U-Werte, Schallschutz, Brandschutznachweise, Zulassungen. Die App ist ein Hilfsmittel für den frühen Entwurf. |
| Habt ihr programmiert? | Wir haben Anweisungen gegeben, Entscheidungen getroffen, Ergebnisse geprüft und Regeln festgelegt. Den Code hat Claude Code geschrieben. |
| Was würdet ihr als Nächstes tun? | Quellenrecherche für λ und Preise, weitere Baustoffe, Diagramme mit berechneten Gesamtwerten, Tests auf mehr Browsern und echten Handys. |

## 8. Was wir aus der Zusammenarbeit mit der KI gelernt haben
- **Regeln als Sätze mit „niemals“ und „immer“** wirken: „Erfinde niemals Quellen“ führte zu Datenarten, einer Sperre im Prüfprogramm und zu „nicht verfügbar“.
- **Ein Schritt pro Auftrag mit Pause** macht den Prozess verständlich und fängt Fehler früh ab; auch der Reihenfolge-Fehler (Schritt 12 vor 11) ließ sich dadurch sauber korrigieren.
- **Ein grüner Test ist kein Beweis.** Mehrere Fehler lagen im Test selbst; andere sah man erst auf dem Bildschirm. Unabhängige Nachrechnung und absichtlich eingebaute Fehler zeigten, ob die Tests wirklich etwas prüfen.
- **Die KI soll sagen, was sie nicht weiß:** Jeder Bericht nennt, was nicht geprüft werden konnte.
- **Dokumentation während der Arbeit** (`FORTSCHRITT.md`) rettet den Stand über Pausen und Kontextgrenzen.

## 9. Quellenangaben für Folien und Plakat
- Bundesinstitut für Bau-, Stadt- und Raumforschung (BBSR): **ÖKOBAUDAT**, Release 2024-II, <https://www.oekobaudat.de/service/downloads.html>, abgerufen am 16.11.2026.
- BBSR: „Generischer Datenbestand in der ÖKOBAUDAT“ (August 2026), <https://www.oekobaudat.de/fileadmin/downloads/2026-08-25_Generische_Daten_in_OEBD.pdf>.
- Einzelne Datensätze mit UUID und Link: `QUELLENBERICHT.md` und Fußnoten in der Anwendung.
- Beispieldaten sind keine Quelle und dürfen nicht als Marktpreise oder geprüfte Eigenschaften zitiert werden.

## 10. Checkliste vor dem Vortrag
- [ ] `index.html` auf dem Vortragsrechner per Doppelklick öffnen; Systemcheck in der Fußzeile ist grün
- [ ] Browser: Chrome oder Edge (dort getestet); Seite zusätzlich in Firefox/Safari ansehen, falls ihr damit vortragt
- [ ] Demo A bis E einmal komplett durchspielen; Zahlen aus Abschnitt 4 vergleichen
- [ ] Zoom 125 % bis 150 % für den Beamer; Tabellen und Diagramme prüfen
- [ ] Offline testen (WLAN aus); Quellenlinks brauchen Internet
- [ ] Sicherung: PDF-Export der Demo A als Datei bereithalten, Screenshots auf der Folie
- [ ] Hinweis im Vortrag: **Preise, λ und Brandklassen der 17 ersten Baustoffe sind Beispieldaten**
- [ ] Wer macht Demo, wer erklärt Rechenweg, wer beantwortet Fragen zu Daten und Prozess?

## Neu in Version 3.0 (Kurzfassung für die Präsentation)
- **Marke:** Logo aus drei ineinandergreifenden Materialschichten, Leitsatz „Der richtige Baustoff. Für deine Idee.“, zwei Hauptaktionen: „Baustoffe vergleichen“ und „Match finden“.
- **Materialillustrationen:** Für alle 50 Baustoffe eigene schematische Schraffuren im Stil von Architekturplänen (keine Fotos, keine fremden Rechte, offline), dazu ein Steckbrief je Material.
- **Match finden:** Fünf Fragen → passende Baustoffe als Swipe-Karten (rechts = Favorit, links = nicht interessant, Tippen = Steckbrief; auch mit Knöpfen und Tastatur) → Favoriten → „Favoriten vergleichen“ übernimmt sie in den bestehenden Vergleich.
- **Ehrlicher Score:** 0–100 Punkte als relative Orientierung; Eignung wird zuerst geprüft; fehlende Daten zählen nie als gut, bei zu wenigen Daten gibt es keinen Score. Schallschutz, Feuchteschutz und Recycling sind ausgegraut, bis belegte Daten vorliegen.
- **PDF-Bericht:** Seite 1 mit Logo, Vergleich, Materialien, Eingaben, Kennzahlen und Warnhinweisen; Diagramme auf Seite 2; Annahmen und Quellen danach.

