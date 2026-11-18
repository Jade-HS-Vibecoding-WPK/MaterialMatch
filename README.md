# MaterialMatch

**Baustoffe vergleichen. Alternativen entdecken. Bewusster entscheiden.**

Interaktiver Baustoff-Vergleichsrechner für frühe Entwurfsentscheidungen
(Hochschulprojekt, Jade Hochschule Oldenburg).

> Aktueller Arbeitsstand und Übergabe: `PROJECT_STATUS.md`.

> Hilfsmittel für frühe Entwurfsphasen. Ersetzt keine bauphysikalischen Nachweise,
> Tragwerksplanung, Brandschutzplanung oder fachliche Materialfreigabe.

## Starten

**Variante 1 – einfach (empfohlen):**
Die Datei `index.html` per Doppelklick öffnen. Sie öffnet sich im Standardbrowser.

**Variante 2 – mit kleinem lokalem Server** (nötig, sobald Baustoffdaten aus Dateien geladen werden):

```bash
cd MaterialMatch
python3 -m http.server 8000
```

Dann im Browser `http://localhost:8000` öffnen. Beenden mit `Strg + C`.

Es werden keine Installation, kein Internet, kein Login und keine API-Schlüssel benötigt.

## Projektstruktur

| Datei / Ordner | Inhalt |
|---|---|
| `index.html` | Die eine Seite: Struktur und Inhalte (HTML) |
| `css/style.css` | Gestaltung: Farben, Abstände, Schrift (CSS) |
| `data/materialprofil.js` | „Einordnung durch das Projekt“: jeder Baustoff als nachwachsend, mineralisch, konventionell und/oder natürlich, mit Zuordnungskriterien und Begründung |
| `img/` | Logo (`logo.svg`, `logo-kompakt.svg`) und Favicon (`favicon.svg`): drei geometrische Materialschichten, als SVG selbst gezeichnet, lokal gespeichert |
| `css/bento.css` | Bento-Grid-Gestaltung (Kacheln, dezenter Schwerpunkt der Kennwertkarten, Farbkonzept, Schriftskala, Schrift Nunito, Tablet/Handy); liegt über `style.css` und ändert nur das Aussehen |
| `js/app.js` | Programmlogik: Berechnungen, Diagramme, Empfehlungen (JavaScript) |
| `js/daten-pruefung.js` | Prüft die Baustoffdatenbank beim Laden auf Fehler |
| `js/hilfen.js` | Kleine gemeinsame Werkzeuge |
| `js/auswahl.js` | Kategorie- und Materialauswahl, Materialkarten |
| `js/berechnung.js` | Rechenlogik: Zahlen lesen, Eingaben prüfen, Volumen und Gewicht |
| `js/eingaben.js` | Eingabefelder Fläche und Dicke mit Fehlermeldungen |
| `js/tabelle.js` | Gemeinsamer Tabellenbauer (Spalten = Materialien, Fußnoten, Datenart-Kürzel) |
| `js/mengen.js` | Ergebnistabelle Menge und Gewicht |
| `js/eigenschaften.js` | Vergleich der Kennwerte: technische Eigenschaften, Kosten, CO₂, weitere |
| `js/bewertung.js` | Farbskala, relative Bewertung, Vergleichbarkeitsprüfung (ohne Anzeige) |
| `js/diagramme.js` | Farbige horizontale Balkendiagramme und Legende |
| `js/quellen.js` | Quellen: Beschreibung, Zählung der Datenqualität, Nachvollziehbarkeits-Check (ohne Anzeige) |
| `js/quellen-anzeige.js` | Bereich „Quellen und Hinweise“ und Datenstand im Fußbereich |
| `js/prioritaet.js` | Zentrale Auswahl „Was ist Ihnen besonders wichtig?“ (Priorität) |
| `js/empfehlung.js` | Regelbasierte Empfehlung alternativer Baustoffe (Logik, ohne Anzeige) |
| `js/alternativen.js` | Empfehlungskarten und Button „Alternative vergleichen“ |
| `js/rechnen.js` | Berechnete Materialkosten, CO₂-Menge, R-Wert und erforderliche Dicke |
| `js/begriffe.js` | Erklärungen zu Fachbegriffen („i“-Knöpfe) |
| `js/oberflaeche.js` | Auf- und Zuklappen der Bereiche, Tooltips |
| `js/auswahl-optionen.js` | Die optionalen Auswahlfelder (drittes Material, Herstellerprodukt, eigenes Produkt) per Schaltfläche ein- und ausblenden |
| `js/materialbilder.js` | Schematische Materialillustrationen (SVG-Schraffuren) als Bildbaustein: Lazy Loading, Alternativtext, Platzhalter |
| `js/steckbrief.js` | Material-Steckbrief als Dialog: Illustration, Kennwerte, Vorteile, Nachteile, aufklappbare Eigenschaften und Quellen |
| `js/matching.js` | Matching-Logik für „Match finden“: Einsatzbereiche, Eignung in vier Stufen, harte Anforderungen, Match-Score 0–100 mit Erklärung (nutzt `MM.empfehlung` und `MM.bewertung`, rechnet nichts Neues) |
| `js/interview.js` | Das Interview mit fünf Fragen (große Auswahlflächen, Fortschrittsanzeige, ausgegraute Optionen ohne Datenlage) |
| `js/swipe.js` | Swipe-Karten: Wischen mit Maus und Finger, Knöpfe, Tastatur, Rückgängig, Steckbrief per Tippen |
| `js/favoriten.js` | Favoritenliste (localStorage), Auswahl von zwei oder drei Favoriten und Übernahme in den Vergleich |
| `js/match.js` | Steuerung des Reiters „Match finden“ (Interview ↔ Karten, Speichern der Antworten) |
| `js/kopf.js` | Die zwei Hauptaktionen im Kopf („Baustoffe vergleichen“, „Match finden“): Reiter wechseln, scrollen, Fokus setzen |
| `js/dashboard.js` | „Vergleich auf einen Blick“: vier gleich große Kennwert-Kacheln (Kosten, CO₂, Gewicht, Wärmedämmung mit R-Wert) mit großen Zahlen, Vergleichsbalken, Quellen-Info mit Datenqualität und dezenter Marke „Dein Schwerpunkt“; zeigen die Ergebnisse der Diagramme (rechnet nichts selbst) |
| `js/entdecken.js` | Reiter „Entdecken“: Baustoffe durchsuchen, filtern, sortieren (Karten- und Listenansicht), Material in den Vergleich legen |
| `js/suche.js` | Suchfeld in der Materialauswahl: findet Baustoffe und Herstellerprodukte und legt sie auf den nächsten freien Platz (Bento-Redesign) |
| `js/reiter.js` | Die drei Hauptreiter (Vergleich, Alternativen, Quellen & Details): Wechsel, Tastatur, ARIA |
| `js/datenmodus.js` | Demo-Modus (Beispieldaten) und Echtdaten-Modus (Beispieldaten gelten als „nicht verfügbar“) |
| `js/produkte.js` | Produkte je Material (Standardprodukt, Wahl je Platz, eigene Produkte im Browser gespeichert, Prüfung der Produktdaten) |
| `js/produktformular.js` | Formular „Eigenes Produkt ergänzen“ (Name, Hersteller, Quelle, Kennwerte, Preis mit Händler, Link und Abrufdatum) |
| `data/produkte.js` | Konkrete Produkte mit Hersteller, Datenblatt, Kennwerten und Händlerpreisen (überschreiben den generischen Materialdatensatz) |
| `data/einstellungen.js` | Einstellbare Regeln: Faktor der Priorität, 2-%-Schwelle, Höchstzahl der Empfehlungen, Start-Modus |
| `js/export.js` | Export: Druckansicht/PDF (Browser-Druckdialog) und CSV-Download |
| `tests/` | Automatische Tests (`bash tests/alle.sh`), siehe Abschnitt „Tests“ |
| `QUALITAETSBERICHT.md` | Ergebnis der Qualitätskontrolle (Schritt 14): Prüfplan, gefundene Mängel, Grenzen |
| `FUNKTIONSPRUEFUNG.md` | Prüfliste der 24 Funktionen (MaterialMatch 2.0, Schritt 13): wie geprüft, Ergebnis, Grenzen, Selbsttest |
| `FORTSCHRITT.md` | **Aktueller Stand, Entscheidungen, nächster Schritt** (zum Weiterarbeiten nach einer Pause) |
| `data/quellen/oekobaudat_2024-II_auszug.csv` | Auszug: alle Originalzeilen der verwendeten ÖKOBAUDAT-Datensätze |
| `tools/erzeuge_schraffuren.py` | Hilfsprogramm: zeichnet die schematischen Materialillustrationen (`img/schraffuren/*.svg`) neu; liefert immer dieselben Dateien |
| `tools/oekobaudat_uebernehmen.py` | Hilfsprogramm: übernimmt Werte aus der ÖKOBAUDAT-CSV in die Datenbank |
| `tools/pruefe_datenqualitaet.js` | Hilfsprogramm: prüft alle Baustoffdaten (fehlende und ungültige Kennwerte, Quellen, Einheiten, Größenordnungen, Duplikate, Verknüpfungen) und schreibt mit `--bericht` die Lückenliste `DATENLUECKEN.md` |
| `tools/bilder_bauen.py` | Verarbeitet heruntergeladene Materialfotos (Zuschnitt 4:3, 800 × 600 px, WebP) und schreibt `data/bilder.js` |
| `tools/bilder_quellen.json` | Urheber, Lizenz und Fundstelle jedes Materialfotos (Eingabe für `bilder_bauen.py`) |
| `tools/pruefe_links.js` | Hilfsprogramm: ruft alle Quellenlinks ab (Internet nötig) |
| `tools/quellenbericht.js` | Hilfsprogramm: erzeugt `QUELLENBERICHT.md` |
| `QUELLENBERICHT.md` | Bericht: Datenqualität, belegte Kennwerte, Quellenkatalog (erzeugt) |
| `tools/pruefe_gegen_csv.js` | Hilfsprogramm: prüft jeden übernommenen Wert erneut gegen die CSV |
| `data/baustoffe.js` | Baustoffdatenbank (JSON-Struktur in einer JavaScript-Datei) |
| `PROJEKTDOKUMENTATION.md` | Entwicklungsdokumentation für Kurs und Präsentation |
| `PRAESENTATION.md` | Pitch, Live-Demo mit überprüften Zahlen, Folien- und Plakatvorschlag, Fragen und Antworten |

## Exportieren

Im Bereich „Vergleichsergebnisse“ (sobald ein Material gewählt ist):
- **Drucken / als PDF speichern:** öffnet den Druckdialog des Browsers; dort „Als PDF speichern“ wählen. Tipp: „Kopf- und Fußzeilen“ im Dialog abwählen.
- **Als CSV herunterladen (Excel):** Textdatei mit Semikolon als Trenner und Dezimalkomma (öffnet in deutschem Excel per Doppelklick); enthält Eingaben, Kennwerte mit Datenart und Quelle, berechnete Ergebnisse, Empfehlungen und Quellen.

## Baustoff hinzufügen

**Mit ÖKOBAUDAT-Werten (empfohlen, keine Zahl wird abgetippt):** In `tools/oekobaudat_uebernehmen.py` einen Eintrag in `NEUE_BAUSTOFFE` ergänzen
(Name, Kategorien, Anwendungsbereiche, Datensatz) und das Programm mit der ÖKOBAUDAT-CSV ausführen:

```bash
python3 -I tools/oekobaudat_uebernehmen.py <pfad/zur/oekobaudat_2024-II_csv_punkt.csv>
node tools/pruefe_gegen_csv.js && bash tests/alle.sh
```

Das Programm legt den Baustoff samt Quelle an, überträgt Rohdichte bzw. Flächengewicht und CO₂-Kennwerte unverändert und setzt alle anderen
Kennwerte auf „nicht verfügbar“ mit Begründung. Es bricht bei unklarem oder widersprüchlichem Datensatz ab.

**Von Hand:**

1. `data/baustoffe.js` mit einem Texteditor öffnen.
2. Im Abschnitt `baustoffe` einen bestehenden Baustoff (z. B. `mineralwolle`) kopieren und ans Ende der Liste setzen. Zwischen zwei Baustoffen steht ein Komma.
3. Neue `id` (nur Kleinbuchstaben, ohne Leerzeichen), `name` und die Werte ändern.
4. Seite im Browser neu laden. Ganz unten zeigt der Systemcheck, ob die Prüfung der Datenbank bestanden wurde. Bei einem Fehler steht in der Browser-Konsole (F12), was zu korrigieren ist.

Regeln für jeden Kennwert:
- `art: "beispiel"` gilt für alle Werte, die nicht gegen eine Quelle geprüft wurden.
- `art: "verifiziert"` oder `"richtwert"` ist nur erlaubt, wenn `quelle` auf einen Eintrag im Abschnitt `quellen` zeigt, der `geprueft: true` trägt. Das Prüfprogramm blockiert sonst die Seite.
- Fehlt ein Wert: `wert: null` setzen. Ist ein Kennwert für das Material nicht sinnvoll: zusätzlich `nicht_anwendbar: true` und einen `hinweis` angeben.

## Datenquelle ÖKOBAUDAT

Rohdichte und CO₂-Kennwerte (GWP, Module A1–A3) stammen, wo ein passender Datensatz vorhanden ist,
aus der **ÖKOBAUDAT 2024-II** (BBSR), abgerufen am 16.11.2026 von
<https://www.oekobaudat.de/service/downloads.html> (CSV mit Punkt als Dezimaltrenner).
Jeder Wert verweist in der Datenbank auf einen Quelleneintrag mit Link zum Datensatz, UUID, Version,
Datensatztyp, Eigner und Gültigkeit. Die Datenart ist „Richtwert“ (generische Datensätze sind nicht
extern geprüft und enthalten Sicherheitszuschläge). Alle übrigen Kennwerte (λ, Druckfestigkeit, Preis,
Brandverhalten, μ, Wärmekapazität, Recycling) enthält die ÖKOBAUDAT nicht: Bei den 17 ursprünglichen Baustoffen sind sie
**Beispieldaten**, bei den 33 in Schritt 11 ergänzten Baustoffen **„nicht verfügbar“** (nichts wird erfunden).
Neben generischen Datensätzen kommen Branchendurchschnitte, repräsentative Durchschnitte und zwei produktspezifische
Herstellerdeklarationen (Schafwolle Isolena, Zinkblech RHEINZINK) vor; sie sind in der Anwendung als solche benannt.

Quellen und Werte nachprüfen (Node.js nötig):

```bash
node tools/pruefe_gegen_csv.js     # stimmen die Werte mit der ÖKOBAUDAT-Datei überein? (Auszug im Projekt)
node tools/pruefe_links.js         # sind alle Quellenlinks erreichbar? (Internet nötig)
node tools/quellenbericht.js       # Quellenbericht neu erzeugen (QUELLENBERICHT.md)
```

Die vollständige Originaldatei (52 MB) liegt nicht im Projekt. Prüfsumme (SHA-256) und Abrufdatum stehen
in `data/baustoffe.js` beim Quelleneintrag `oekobaudat`.

## Datenmodus und Orientierung

Die Seite startet im **Echtdaten-Modus**: Es zählen nur belegte Werte (R = Richtwert mit Quelle, V = verifiziert); die frei gewählten
Beispieldaten gelten als „nicht verfügbar“. Der **Demo-Modus** (Schalter oben auf der Seite oder `index.html?modus=demo`) zeigt die
Beispieldaten gelb und mit „B“ gekennzeichnet; sie sind keine geprüften Echtwerte. Werte mit R dienen nur der **Orientierung** und
erlauben keine verlässliche Produkt- oder Kostenberechnung. Die Wärmeleitfähigkeit wird als Nennwert λD und Bemessungswert λB getrennt
mit eigener Quelle angezeigt; der R-Wert nutzt λB, sonst λD („orientierend, kein Wärmeschutznachweis“). Einstellbar sind Start-Modus,
Prioritätsfaktor und Schwellen in `data/einstellungen.js`. Die Herkunft jedes belegten Werts und die offenen Datenlücken stehen in `RECHERCHE.md`.

## Produkte und Preise

Zu den meisten Dämmstoffen und zu Zinkblech gibt es konkrete Produkte (`data/produkte.js`) mit Hersteller, Datenblatt und Kennwerten; in der Materialauswahl wählt man je Platz das Produkt oder den **generischen Materialdatensatz** (kein konkretes Produkt). Dasselbe Material darf mit verschiedenen Produkten mehrfach gewählt werden. Unter „Eigenes Produkt ergänzen“ lassen sich eigene Produkte anlegen (Datenart „E“, nicht geprüft, nur im Browser gespeichert). Preise stammen aus öffentlichen Händlerseiten (derzeit zwei von OBI) mit Händler, Produkt, Preis, Einheit, Link und Abrufdatum; ohne verlässlichen Preis steht „Preis nicht verfügbar“. Preise werden nur verglichen, wenn Einheit, Mehrwertsteuer, Leistungsumfang und Produktdicke zusammenpassen, sonst erscheint ein Vorbehalt.

## Tests

Alle automatischen Tests (Node.js und Playwright mit Chromium nötig):

```bash
bash tests/alle.sh
```

Rund 1.952 Prüfungen in 52 Dateien (`tests/test1.js` bis `tests/test53.js`; `test53` (braucht Python 3 mit Pillow) prüft die Materialfotos (Lizenzangaben, Dateien, 4:3, Laden aller 50 Bilder, gleiche Bildquelle in allen Bereichen, Umschalter Foto/Schraffur, mobil); `test52` prüft den Reiter „Entdecken“ (Suche, Filter, Sortierung, Karten/Liste, Material in den Vergleich legen), die drei Hauptaktionen und den gegliederten Steckbrief; `test51` prüft die Händlerpreisspannen von bausep.de (jede Spanne wird aus den Einzelpreisen nachgerechnet) und das Feld „echt“, das belegte Preise nur im Echtdaten-Modus einsetzt; `test50` prüft die Match-Funktion mit Nutzerprofilen, den Fallback, Preisspannen und das Prüfskript; `test49` prüft Datenpaket 3: STEICO, Cirkel PORIT, KS-ORIGINAL; `test21` gehört zu Schritt 11, `test22` zu Schritt 13 und braucht für die PDF-Prüfung `pdftotext`, `pdfinfo` und `pdftoppm` aus dem Paket poppler-utils, `test23` zu Schritt 14 und nutzt `tests/referenzrechnung.py` als unabhängigen Referenzrechner; es braucht Python 3 und startet kurz einen lokalen Server). Ergebnis: `QUALITAETSBERICHT.md`. `tools/pruefe_gegen_csv.js` arbeitet mit dem Auszug im Projekt (`data/quellen/`).
Nur `test21` liest zusätzlich die ÖKOBAUDAT-Originaldatei und erwartet sie unter `/home/user/oekobaudat_original/`
(Pfad oben in `tests/test21.js` anpassen, falls sie woanders liegt; ohne die Datei schlägt dieser Test fehl).

## Stand der Entwicklung

- [x] Schritt 1 – Projektstruktur und Grundgerüst
- [x] Schritt 2 – Baustoffdatenbank (zunächst 17 Baustoffe)
- [x] Schritt 3 – Materialauswahl
- [x] Schritt 4 – Mengen- und Gewichtsberechnung
- [x] Datenübernahme ÖKOBAUDAT 2024-II (49 Datensätze, 97 Kennwerte, gegengeprüft)
- [x] Entscheidungen vom 16.11.2026: Beispieldaten gekennzeichnet (Demo-/Echtdaten-Modus, Start im Echtdaten-Modus), Recherche belegter Werte (`RECHERCHE.md`, 44 Werte, offene Datenlücken dokumentiert), einstellbare Regeln (`data/einstellungen.js`), Kosten-/CO₂-Diagramme mit berechneten Gesamtwerten, Nennwert λD und Bemessungswert λB getrennt (R-Wert aus λB)
- [x] Schritt 5 – Vergleichstabelle (einklappbare Unterabschnitte)
- [x] Schritt 6 – Farbige Vergleichsdiagramme
- [x] Schritt 7 – Erweiterte Berechnungen (Kosten, CO₂, R-Wert)
- [x] Schritt 8 – Alternative Baustoffempfehlungen
- [x] Schritt 9 – Individuelle Vergleichsprioritäten
- [x] Schritt 10 – Quellen und Datentransparenz
- [x] Schritt 12 – Benutzeroberfläche und Bedienung (Erklärknöpfe, Akkordeon, eine Legende; zuerst ausgeführt)
- [x] Schritt 11 – Erweiterung der Baustoffdatenbank (50 Baustoffe, 49 ÖKOBAUDAT-Quellen; nachträglich ausgeführt)
- [ ] Quellenrecherche für technische Kennwerte und Preise (fortlaufend; Stand MaterialMatch 3.4: 20 von 50 Materialien mit belegtem Preis, Lücken in `DATENLUECKEN.md`, nötige Anmeldungen und Downloads in `ANMELDUNGEN_UND_DOWNLOADS.md`, Übergabeordner `data/eingang/`)
- [x] Schritt 13 – Exportfunktion (Druckansicht/PDF, CSV)
- [x] Schritt 14 – Abschließende Qualitätskontrolle (`QUALITAETSBERICHT.md`)
- [x] Schritt 15 – Projektdokumentation und Präsentationsmaterial (`PROJEKTDOKUMENTATION.md`, `PRAESENTATION.md`)
- [x] MaterialMatch 3.5 – Navigation, Reiter „Entdecken“, gegliederter Steckbrief (`DESIGNSYSTEM.md`)
- [x] MaterialMatch 3.6 – Materialfotos statt Schraffuren (`data/bilder.js`, `img/materialfotos/`, Bildnachweis in „Quellen & Details“, Schraffuren bleiben erhalten)

Details und Entscheidungen: `FORTSCHRITT.md` und `PROJEKTDOKUMENTATION.md`.
