# MaterialMatch – Fortschritt und Übergabe

> **Zweck dieser Datei:** Wer (Claude Code oder ein Mensch) das Projekt nach einer Pause, nach einer automatischen
> Kontextkürzung oder in einer neuen Sitzung weiterführt, findet hier alles Nötige. **Diese Datei nach jedem Schritt aktualisieren**
> (Abschnitte „Stand“, „Schritte“, „Offene Fragen“, „Nächster Schritt“, „Änderungsprotokoll“).

> **Einstieg:** `PROJECT_STATUS.md` (Stand 17.11.2026, geänderte Dateien, Entscheidungen, nächste Schritte, Sicherung unter `sicherungen/`).

Letzte Aktualisierung: **16.11.2026**, nach Schritt 15 (**Entwicklungsreihenfolge abgeschlossen**). Datenbank-Version **0.4.0**.

## 1. Das Projekt in Kürze
- **Name:** MaterialMatch – Intelligenter Baustoff-Vergleichsrechner („Baustoffe vergleichen. Alternativen entdecken. Bewusster entscheiden.“)
- **Wer:** Zwei Architekturstudierende (Jade Hochschule Oldenburg), **ohne Programmierkenntnisse**, Deutsch. Alle Erklärungen verständlich und auf Deutsch.
- **Was:** Eine einzelne Webseite (HTML, CSS, JavaScript), läuft offline per Doppelklick auf `index.html`. Kein Framework, kein Server, keine Datenbank, kein Login.
- **Auftrag:** Der lange „MASTER-PROMPT“ (15 Schritte, siehe unten). Zusatzvorgaben der Nutzer:innen siehe Abschnitt 3.
- **Arbeitsweise (verbindlich):** Jeder größere Schritt wird in diesem Schema berichtet: *Schritt X: Bezeichnung · Was machen wir? · Warum machen wir das? · Was setze ich technisch um? · Was wurde umgesetzt? · Wie testen wir das? · Nächster Schritt.* Danach **anhalten und auf die Rückmeldung warten**, bevor der nächste Schritt beginnt. Fehler erklären (was, Ursache, Vorgehen, Lösung, Test, Ergebnis). Ehrlich testen: nicht behaupten, etwas geprüft zu haben, was nicht geprüft wurde.

## 2. Unverrückbare Regeln aus dem Master-Prompt
1. Minimalistisches, helles Design. Farbskala: **#17643A** (sehr gut) · **#78B85A** · **#E9C94E** · **#E68B43** · **#951F2B** (sehr schlecht). Farben sind **nur relativ** (innerhalb der gewählten Materialien), nie absolute Qualität.
2. Pflichtsatz sichtbar: „Die Farben zeigen eine relative Bewertung der ausgewählten Materialien und stellen keine allgemeingültige Aussage über deren Qualität dar.“
3. **Nichts erfinden:** keine Werte, Quellen oder Links. Datenarten: *verifiziert* / *Richtwert* / *Beispieldaten*. Fehlt ein Beleg: „nicht verfügbar“ mit Begründung.
4. Nicht vergleichbar → „Kein belastbarer direkter Vergleich möglich“. CO₂ nur bei gleicher Bezugsgröße, gleichen Modulen und gleichem Datensatztyp direkt bewerten; biogener Kohlenstoff fachlich korrekt; **keine pauschalen Aussagen** wie „Holz ist immer nachhaltiger“.
5. **Nie nur wegen des Preises empfehlen.** Keine Aussagen zu Zulassungen, technischer Gleichwertigkeit oder Normkonformität.
6. Die Dokumentation (`PROJEKTDOKUMENTATION.md`) fortlaufend pflegen; Hinweise für die Abschlusspräsentation sammeln.

## 3. Zusatzvorgaben der Nutzer:innen (im Verlauf gegeben)
- Die Vergleichstabelle besteht aus **einklappbaren Unterabschnitten**.
- **ÖKOBAUDAT 2024-II** (CSV, Punkt als Dezimaltrenner) von der offiziellen Seite laden, Original in der Arbeitsumgebung speichern, **echte Werte** verwenden, Quellen dokumentieren. (Erledigt: Original unter `/home/user/oekobaudat_original/`, SHA-256 `f4811adb…ea5c`.)
- **Fehlende Werte nur aus echten, nachvollziehbaren Quellen** (Herstellerdatenblätter, Leistungserklärungen/DoP, ETA/DIBt, bei Preisen BKI oder aktuelle Händlerangebote). Je Wert speichern: Quelle, URL, Produkt/Materialbezeichnung, Einheit, Region, Abrufdatum; Kennzeichnung „generisch“ oder „produktspezifisch“. Ohne belastbaren Beleg: **„nicht verfügbar“ + kurze Begründung.** **ÖKOBAUDAT nur für Ökobilanzwerte**, nicht als Ersatzquelle für technische Eigenschaften oder Preise. → Diese Recherche ist **pausiert** (siehe Abschnitt 7).

## 4. Stand der Schritte

| Schritt | Inhalt | Status |
|---|---|---|
| 1 | Projektstruktur und Grundgerüst | ✔ |
| 2 | Baustoffdatenbank (zunächst 17 Baustoffe, Quellen in der Struktur) | ✔ |
| 3 | Materialauswahl | ✔ |
| 4 | Mengen- und Gewichtsberechnung | ✔ |
| – | Datenübernahme ÖKOBAUDAT 2024-II (maschinell, gegengeprüft) | ✔ |
| 5 | Vergleichstabelle (einklappbare Unterabschnitte) | ✔ |
| 6 | Farbige Vergleichsdiagramme | ✔ |
| 7 | Erweiterte Berechnungen (Kosten, CO₂, R-Wert, erforderliche Dicke) | ✔ |
| 8 | Alternative Baustoffempfehlungen | ✔ |
| 9 | Individuelle Vergleichsprioritäten | ✔ |
| 10 | Quellen und Datentransparenz | ✔ |
| **12** | Gestaltung und Benutzerfreundlichkeit (**vor Schritt 11 ausgeführt**, versehentlich) | ✔ |
| **11** | Erweiterung der Baustoffdatenbank (**nach Schritt 12 nachgeholt**) | ✔ (16.11.2026) |
| 13 | Exportfunktion (Druckansicht/PDF über den Browser-Druckdialog, CSV-Download) | ✔ (16.11.2026) |
| 14 | Abschließende Qualitätskontrolle (Ergebnis: `QUALITAETSBERICHT.md`) | ✔ (16.11.2026) |
| 15 | Projektdokumentation und Präsentationsmaterial (`PROJEKTDOKUMENTATION.md` neu geordnet, `PRAESENTATION.md`, `tests/test24.js`) | ✔ (16.11.2026) |

**Reihenfolge-Hinweis:** Schritt 12 lief vor Schritt 11. Die Konflikte, die dadurch entstanden, sind in `PROJEKTDOKUMENTATION.md` (Schritt 11, „Konflikte durch die Reihenfolge“) beschrieben und gelöst. Schritt 12 wurde dabei **weder wiederholt noch zurückgenommen.**

## 5. Technischer Stand (Version 0.4.0)

**Datenbank `data/baustoffe.js`** (`window.MATERIALMATCH_DATA`): 50 Baustoffe, 5 Kategorien (A tragend 13 · B Dämmstoffe 14 · C Fassade 11 · D Innenausbau 11 · E Dach 8; einige Materialien gehören zwei Kategorien an), 5 Anwendungsbereiche, 54 Quelleneinträge (49 ÖKOBAUDAT-Datensätze + ÖKOBAUDAT-Download + Dokumentation + 3 nicht eingesehene Normen).
- 17 **ursprüngliche** Baustoffe: Rohdichte/CO₂ aus ÖKOBAUDAT (Richtwert), alle anderen Kennwerte **Beispieldaten** (B).
- 33 **ergänzte** Baustoffe (Schritt 11): Rohdichte bzw. Flächengewicht und CO₂ (A1–A3) aus ÖKOBAUDAT (Richtwert); **alle anderen Kennwerte „nicht verfügbar“ mit Begründung** (kein Beispielwert, keine Vorteile/Nachteile-Texte).
- Zählung (10 Kennwerte × 50 Baustoffe = 500 Felder; λD und λB getrennt): 135 Richtwerte, 0 verifiziert, 85 Beispieldaten, 19 nicht anwendbar, 261 nicht verfügbar. Belegte Kennwerte insgesamt 145 (97 aus der ÖKOBAUDAT, 48 aus Herstellerdatenblättern, ETA und Entscheidung 96/603/EG, siehe `RECHERCHE.md`). Die 97 ÖKOBAUDAT-Werte: 38 Rohdichten, 10 Flächengewichte, 49 CO₂).
- 39 verwendete ÖKOBAUDAT-Datensätze sind nur bis 2026 gültig (laufen aus; Hinweis in der App und im Quellenbericht).
- Datensatztypen: generisch (Sphera), Branchendurchschnitt, repräsentativer Durchschnitt (Thünen), **produktspezifisch** (nur Schafwolle Isolena, Zinkblech RHEINZINK; als Herstellerdeklaration gekennzeichnet).

**Mengenmodell:** `schicht` (Gewicht = Fläche × Dicke × Rohdichte) oder `keine_schicht` (Plattenprodukte, Deckungen: Gewicht = Fläche × Flächengewicht, Dicke wird nicht verwendet, Hinweistext Pflicht). Gewichte aus verschiedenen Grundlagen werden **nicht** gegeneinander gerechnet („nicht vergleichbar“).

**Dateien (`js/`):** `app.js` (Start, Systemcheck) · `daten-pruefung.js` (Prüfregeln inkl. Plausibilitätsgrenzen) · `hilfen.js` · `begriffe.js` (i-Knöpfe) · `berechnung.js` · `bewertung.js` (Farbskala, Vergleichbarkeit) · `quellen.js` / `quellen-anzeige.js` · `prioritaet.js` · `empfehlung.js` (Logik) / `alternativen.js` (Anzeige) · `auswahl.js` · `eingaben.js` · `tabelle.js` · `mengen.js` · `eigenschaften.js` · `rechnen.js` · `diagramme.js` · `oberflaeche.js` · `export.js` (Schritt 13: CSV-Aufbau als reine Funktion `MM.exportieren.baueCsv`, Download, `beforeprint`/`afterprint` für die Druckansicht). Alle als klassische `<script>`-Dateien auf dem gemeinsamen Namensraum `window.MM` (laufen per `file://`).

**Werkzeuge (`tools/`):**
- `oekobaudat_uebernehmen.py` – übernimmt Werte maschinell aus der CSV (`AUSWAHL` = 16 alte Zuordnungen, `NEUE_BAUSTOFFE` = 33 neue, wiederholbar, mit Plausibilitätsprüfung; bricht bei Mehrdeutigkeit ab). Aufruf: `python3 -I tools/oekobaudat_uebernehmen.py /home/user/oekobaudat_original/oekobaudat_2024-II_csv_punkt.csv`
- `pruefe_gegen_csv.js` – unabhängige Gegenprüfung gegen den Auszug `data/quellen/oekobaudat_2024-II_auszug.csv` (49 Datensätze).
- `pruefe_links.js` – ruft alle Quellenlinks ab (in dieser Umgebung: `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node tools/pruefe_links.js`). Stand 16.11.2026: alle HTTP 200.
- `quellenbericht.js` → `QUELLENBERICHT.md`.

**Tests (`tests/`):** `bash tests/alle.sh` führt `test1`–`test43` (ohne test9) und die CSV-Gegenprüfung aus. Stand: **alle bestanden, 1.492 Prüfungen in 26 Dateien** (test26 = zweite Runde: Echtdaten-Start, Orientierungshinweis, Nenn-/Bemessungswert, neue Quellen; test25 = Entscheidungen vom 16.11.2026: Einstellungen, Datenmodus, Gesamtwert-Diagramme; test24 = Schritt 15, 28 Prüfungen: Konsistenz der Dokumente, jede Demo-Zahl der Präsentation gegen die App) (test23 = Schritt 14, 44 Prüfungen mit sehr vielen Einzelvergleichen; braucht `tests/referenzrechnung.py`, Python 3 und startet kurz einen lokalen Server) (test21 = Schritt 11, 48 Prüfungen, liest die Original-CSV unter `/home/user/oekobaudat_original/`; test22 = Schritt 13, 75 Prüfungen, nutzt poppler-Werkzeuge `pdftotext`/`pdfinfo`/`pdftoppm` für das PDF). Konventionen: erwartete Werte werden von Hand oder unabhängig aus Rohdaten/CSV hergeleitet, nicht aus dem Programm abgeschrieben; wichtige Tests wurden mit absichtlich eingebauten Fehlern („Mutationstests“) gegengeprüft. Jede Testdatei gibt Zeilen `OK …` / `FAIL …` aus.

**Umgebungshinweise (Cloud-Container):** Erreichbar sind `oekobaudat.de`, Paketquellen und – nach Freigabe vom 16.11.2026 – `www.steico.com`, `www.rockwool.com`, `eur-lex.europa.eu`, `www.dibt.de`, `www.isocell.com`, `www.foamglas.com`, `www.xella.de`, `www.bachl.de` (`www.sager.ch` war nicht erreichbar). Weitere Hosts nur über die Umgebungseinstellungen und Zustimmung der Nutzer:innen. Playwright/Chromium ist vorinstalliert. Screenshots nur in den Sitzungs-Arbeitsordner schreiben, nicht ins Projekt.

## 6. Wichtige Entscheidungen (Kurzfassung; Begründungen in `PROJEKTDOKUMENTATION.md`)
- Generische ÖKOBAUDAT-Daten = **„Richtwert“**, nie „verifiziert“ (nicht extern geprüft, 10/20/30 % Sicherheitszuschläge laut BBSR).
- Neue Baustoffe (Schritt 11) bekommen **keine** Beispielwerte; was nicht belegt ist, heißt „nicht verfügbar“. Folge: Sie erscheinen in Auswahl, Tabellen, CO₂-/Gewichtsvergleich, aber in den Empfehlungen meist unter „Geprüft, aber nicht empfohlen“ (zu wenige vergleichbare Kennwerte, Begründung wird genannt).
- Empfehlung: mind. zwei Kriterien, davon eines ohne Preis; Priorität zählt dreifach (**Faktor 3 von den Nutzer:innen am 16.11.2026 vorläufig bestätigt, einstellbar in `data/einstellungen.js`**); Dämmstoffe je gleichem R = 1; CO₂ nur bei gleichem Datensatztyp/Modul; Siegel „nicht belastbar“ bei Beispieldaten.
- 2-%-Schwelle für „praktisch gleich“ (Abweichung von reiner Min-Max-Normalisierung; am 16.11.2026 vorläufig bestätigt, einstellbar).
- **Entscheidungen vom 16.11.2026:** (1) Beispieldaten bleiben für Demos, überall deutlich gekennzeichnet; Datenmodus-Schalter Demo/Echtdaten (Echtdaten: Beispiel = „nicht verfügbar“). (2) Recherche öffentlicher Hersteller-/Norm-/BKI-Quellen erlaubt, jeder Wert mit Quelle, URL, Einheit, Abrufdatum; keine Bezahlschranken: 16 Werte übernommen (`RECHERCHE.md`), Preise/Normwerte nicht möglich. (3) Faktor 3 und 2 % einstellbar. (4) Kosten-/CO₂-Diagramme zeigen berechnete Gesamtwerte mit Mengen und Annahmen. Wärmeleitfähigkeit wird als Nennwert λD gespeichert.
- Gipsplatte: Rohdichte bewusst **nicht** übernommen (Datensatz widerspricht sich: 680 kg/m³ gegen 10 kg/m² bei 12,5 mm).
- Mehrfach-Zuordnung zu Kategorien erlaubt (Massivholz: A+D; Fliesen: C+D; Aluminium, Stahlblech, Schiefer, Zink: C+E).
- Schritt 12: Bereiche anfangs zugeklappt, beim ersten Material automatisch geöffnet (Handy: nur erster Unterabschnitt), i-Knöpfe statt Dialogen, eine gemeinsame Legende.

## 7. Offene Fragen und bekannte Lücken
1. **Quellenrecherche** ist **teilweise erledigt** (16 von 108 Beispielwerten ersetzt; Rest und Gründe in `RECHERCHE.md`). Offen: Preise (BKI kostenpflichtig), Tragstoff-Kennwerte (kostenpflichtige Normen), Holzfaser/Hanf, Porenbeton. Ursprünglicher Stand dieses Punkts: Ohne Freigabe der Hersteller-/Normseiten (Zustimmung der Nutzer:innen nötig) bleiben die 108 Beispieldaten der 17 alten Baustoffe und die 236 „nicht verfügbar“-Felder bestehen. *Frage an die Nutzer:innen:* Sollen die Beispieldaten ohne Beleg auf „nicht verfügbar“ gesetzt werden (konsequent nach „nichts erfinden“, dann gibt es keine Preis-/λ-Empfehlungen mehr), oder bleiben sie als gekennzeichnete Demonstrationswerte?
2. ~~Gesamtwert-Diagramme~~ – am 16.11.2026 entschieden und umgesetzt.
3. ~~Faktor 3 und 2 %~~ – vorläufig bestätigt, konfigurierbar.
3b. ~~Start-Modus~~ und ~~Bemessungswert~~ – am 16.11.2026 (zweite Runde) entschieden und umgesetzt: Start im Echtdaten-Modus, λD und λB getrennt, R aus λB sonst orientierend.
3c. ~~Produkte, Preise, Zellulose~~ – am 16.11.2026 (dritte Runde) umgesetzt: `data/produkte.js` (11 Produkte), Produktwahl je Platz, eigene Produkte, 2 OBI-Preise, Zellulose-λB bleibt leer. Neu offen: Herstellerwert 0,039 für Zellulose übernehmen?, weitere Preise (HORNBACH/BAUHAUS/Allebaupreise blockieren Abrufe), weitere Produkte (siehe `PROJEKTDOKUMENTATION.md`, „Offene Entscheidungen“).
4. Safari, Firefox, echte Handys, Screenreader, echter Druckdialog und Excel sind **nicht geprüft** (nur Chromium; siehe `QUALITAETSBERICHT.md` Abschnitt 5). Die Nutzer:innen können es mit der Anleitung in Abschnitt 6 des Berichts selbst prüfen.
4b. 110 von 285 Empfehlungsläufen enden ohne Alternative (Preis/λ fehlen bei vielen Baustoffen). Löst sich nur durch belegte Daten (Quellenrecherche, Punkt 1).
5. Der Schritt-11-Test liest die Original-CSV nur aus `/home/user/oekobaudat_original/`; in einer neuen Umgebung muss die CSV neu geladen werden (Anleitung in `README.md`; Download-Seite https://www.oekobaudat.de/service/downloads.html).

## 8. Nächster Schritt: **Entwicklungsreihenfolge abgeschlossen – Freigabe durch die Nutzer:innen**
Alle 15 Schritte des Master-Prompts sind erledigt. Was jetzt kommt, entscheiden die Nutzer:innen:
1. **Abnahme / Rückmeldung** zu Schritt 15 (Dokumentation und Präsentation).
2. **Offene Entscheidungen** (Abschnitt 7 und `PROJEKTDOKUMENTATION.md`, „Offene Entscheidungen“): Beispieldaten behalten oder auf „nicht verfügbar“ setzen · Freigabe der Hersteller-/Norm-/BKI-Seiten für die Quellenrecherche · Faktor 3 und 2-%-Schwelle bestätigen · Diagramme mit berechneten Gesamtwerten?
3. **Optionale Weiterentwicklung** (siehe „Mögliche Erweiterungen“): Quellenrecherche λ/Preise, weitere ÖKOBAUDAT-Baustoffe, Tests auf Safari/Firefox/echten Handys.
4. **Vor dem Vortrag:** Checkliste in `PRAESENTATION.md`, Abschnitt 10; Demo-Zahlen mit der App vergleichen (`node tests/test24.js` prüft das).
Wer hier weiterarbeitet: Zuerst `bash tests/alle.sh` laufen lassen (muss „ALLES BESTANDEN“ zeigen), dann nur auf Wunsch der Nutzer:innen Änderungen vornehmen und nach jeder Änderung `FORTSCHRITT.md`, `PROJEKTDOKUMENTATION.md` und `PRAESENTATION.md` mit nachziehen (test24 meldet Widersprüche).

## 9. Änderungsprotokoll dieser Datei
- 16.11.2026 – Datei angelegt nach Schritt 11 (inkl. Stand der Schritte 1–12, Regeln, Entscheidungen, offene Fragen).
- 16.11.2026 – Schritt 13 (Export) eingetragen; nächster Schritt jetzt 14; Teststand 1.099.
- 16.11.2026 – Schritt 14 (Qualitätskontrolle) eingetragen; nächster Schritt jetzt 15; Teststand 1.143; `QUALITAETSBERICHT.md` angelegt.
- 16.11.2026 – Entscheidungen der Nutzer:innen umgesetzt (Datenmodus, Recherche mit 16 belegten Werten, `data/einstellungen.js`, Gesamtwert-Diagramme); `RECHERCHE.md`, `test25` angelegt; Teststand 1.217 in 24 Dateien.
- 16.11.2026 – Dritte Runde: Produkte je Material (`data/produkte.js`, `js/produkte.js`, `js/produktformular.js`), eigene Produkte, Händlerpreise (OBI), „Preis nicht verfügbar“, Preisvergleich mit Dickenprüfung, Zellulose-λB leer; `test27` angelegt; Teststand 1.291 in 26 Dateien.
- 16.11.2026 – Zweite Runde: Start im Echtdaten-Modus (`?modus=demo` optional), Orientierungshinweis, Recherche fortgesetzt (44 belegte Werte insgesamt, Datenlücken dokumentiert), Nennwert λD und Bemessungswert λB getrennt (R aus λB); `test26` angelegt; Teststand 1.249 in 25 Dateien.
- 16.11.2026 – Schritt 15 eingetragen; Entwicklungsreihenfolge abgeschlossen; Teststand 1.171 in 23 Dateien; `PRAESENTATION.md` und `tests/test24.js` angelegt; `PROJEKTDOKUMENTATION.md` neu geordnet.
- 17.11.2026 – Vierte Runde: Herstellerangabe ISOCELL 0,039 getrennt (nie berechnet), strukturiertes Preisformat (`preisangabe`, Status, Umrechnung, Prüfung), neue Produkte Holcim Beton C25/30, Ytong PP 2-0,40 / PP 2-0,35, Poroton T8-36,5, KVH-EPD; OSB/Gipsplatten als Datenlücke (Herstellerseiten nicht erreichbar); `test28`; Stand siehe `PROJECT_STATUS.md`.
- 17.11.2026 – Fünfte Runde: Hosts für EGGER/Siniat/Profibaustoffe freigegeben (Knauf Cloudflare-gesperrt, Rigips leitet auf Österreich um); Preisliste Profibaustoffe 2026 (Österreich, exkl. MwSt.) ausgewertet, drei Preise als Produkte übernommen (neue Umrechnung €/t → €/m³ über den Verbrauch der Liste); EGGER OSB 3 TOP (DoP 06/2026) und Siniat LaGyp (österreichisches Datenblatt) als Produkte; `RECHERCHE.md` Abschnitt 2d; `test28` erweitert.
- 17.11.2026 – MaterialMatch 2.0, Schritt 2: drei Hauptreiter (`js/reiter.js`), Bereiche zugeordnet, Druck zeigt alle Reiter, `test29` neu, Tests angepasst.
- 17.11.2026 – MaterialMatch 2.0, Schritt 3: kompakter Kopf, schlanke Materialauswahl mit optionalen Feldern (`js/auswahl-optionen.js`), kompakte Materialkarten, `test30` neu, Tests angepasst.
- 17.11.2026 – MaterialMatch 2.0, Schritt 4: kompakter Eingabebereich (vier Felder in einer Reihe, kurze Beschriftungen, Info-Symbole statt Erklärtexte), `test31` neu.
- 17.11.2026 – MaterialMatch 2.0, Schritt 5: Dashboard „Vergleich auf einen Blick“ (`js/dashboard.js`), Lese-Schnittstelle `MM.diagramme.ergebnisse()`, `test32` neu.
- 17.11.2026 – MaterialMatch 2.0, Schritt 6: Diagramme als Abschnitt „Materialien im Vergleich“ im Vergleichsreiter, vier Hauptdiagramme, „Weitere Kennwerte anzeigen“, `test33` neu.
- 17.11.2026 – MaterialMatch 2.0, Schritt 7: Tabellen hinter „Alle technischen Eigenschaften anzeigen“ (zugeklappt), Hinweis und Export herausgelöst, Bereichsnummern entfernt, `test34` neu.
- 17.11.2026 – MaterialMatch 2.0, Schritt 8: kompakte Empfehlungskarten, „Warum wird dieses Material empfohlen?“, Prioritätszeile mit „ändern“, `test35` neu.
- 17.11.2026 – MaterialMatch 2.0, Schritt 9: Reiter „Quellen & Details“ (Quellen der gewählten Materialien, vier einklappbare Bereiche), Erläuterungen verteilt, `test36` neu.
- 17.11.2026 – MaterialMatch 2.0, Schritt 10: Design (Breite 1160 px, weniger Rahmen, einheitliche Buttons/Karten/Abstände, ruhige Farben und Schrift), nur `css/style.css`, `test37` neu.
- 17.11.2026 – MaterialMatch 2.0, Schritt 11: mobile Darstellung (Tippflächen ≥ 44 px, Schrift ≥ 12 px, Reiter in einer Zeile, Tabellen, Abstände), nur `css/style.css`, `test38` neu.
- 17.11.2026 – MaterialMatch 2.0, Schritt 12: Export als Menü „Ergebnisse exportieren“ (PDF, CSV), Datenmodus als schmale Zeile mit zugeklappter Erklärung, Druck ohne Doppelungen, `test39` neu.
- 17.11.2026 – MaterialMatch 2.0, Schritt 13: vollständige Funktionsprüfung aller 24 Funktionen (`FUNKTIONSPRUEFUNG.md`, `test40` neu), kein Fehler gefunden.
- 17.11.2026 – MaterialMatch 2.0, Schritt 14: abschließende Überprüfung (Doppelung im Gewichts-Diagramm entfernt, Hinweisboxen einheitlich, Hierarchie und Handy kontrolliert, `test41` neu). Überarbeitung abgeschlossen.
- 17.11.2026 – Datenerweiterung Runde 6, Datenpaket 1: 12 herstellerspezifische ÖKOBAUDAT-Datensätze als 12 neue Produkte (Ytong, EGGER, Kronospan, HASSLACHER, GUTEX, JACKON, Sager, Knauf), Prüfprogramm erweitert, `test42` neu.
- 17.11.2026 – Datenerweiterung Runde 6, Datenpaket 2: 29 neue Produkte aus Preislisten und Herstellerseiten (Xella Ytong/Silka, Wienerberger Poroton, Holcim, Dyckerhoff, EGGER), 17 Preise, 74 neue Kennwerte, `test43` neu.
- 17.11.2026 – Bento-Grid-Redesign: Gestaltung in Kacheln (`css/bento.css`, Nunito, Lucide-Symbole als Inline-SVG), Suchfeld in der Materialauswahl (`js/suche.js`), vier Kennwert-Kacheln mit großer Zahl, Vergleichsbalken, R-Wert und Quellen-Info, `test44` neu, `tests/_offline.js`. Datenbank und Berechnungen unverändert.
- 17.11.2026 – MaterialMatch 2.1 (UI-Feinschliff): Hero-Kachel je Priorität, Farbkonzept (Pastell nur Hero und Eingaben), Diagramme unter 800 px, kompakte Auswahl, Alternativen/Quellen/Leerzustand, Typografie-Skala, CSS-Bereinigung, `test44` erweitert. Berechnungen und Daten unverändert.
- 17.11.2026 – MaterialMatch 3.0: neue Marke (Logo, Header, zwei Aktionen), eigene SVG-Materialschraffuren und Steckbriefe, Einordnung der Baustoffe, „Match finden“ (Interview, Match-Score, Swipe-Karten, Favoriten, Übernahme in den Vergleich), neuer PDF-Bericht mit Kennzahlen auf Seite 1; `test45` bis `test48`.
- 18.11.2026 – MaterialMatch 3.1 (Design-Optimierung): einfarbige Schraffuren, einheitliche Materialkarten, vier gleich große Kennwertkarten mit dezentem Schwerpunkt, Bewertungswörter „vergleichsweise günstig … ungünstig“, Match-Karten mit „NN/100 Match-Punkten“ und Überspringen/Details/Merken, Eignungsstufen umbenannt, Datenqualität (`MM.quellen.datenqualitaet`), PDF-Seite 1 kompakter. Details: PROJEKTDOKUMENTATION.md, Abschnitt „MaterialMatch 3.1“.
- 18.11.2026 – Datenpaket 3: STEICO (4 Platten + EPD für universal), Cirkel PORIT (5 Plansteine) und KS-ORIGINAL (4 Vollsteine) mit Quellen aufgenommen, ISOVER und Knauf Insulation wegen Cloudflare-Sperre nicht (nichts umgangen); 75 Produkte, 143 Quellen; `test49` neu, Tests 21/24/26/27/43 angepasst; Teststand 1.852 in 48 Dateien. Details: RECHERCHE.md Abschnitt 2g.
- 18.11.2026 – Heinze als Quelle geprüft (nur öffentliche Seiten und Nutzungsbedingungen): automatisiertes Auslesen und Einspeichern in fremde Datenbanken sind laut § 1.6 und § 5.4 untersagt, daher keine Daten abgerufen oder übernommen, keine Anmeldung. Dokumentiert in RECHERCHE.md Abschnitt 2h.
- 18.11.2026 – MaterialMatch 3.2: Match-Funktion überarbeitet (0 leere Ergebnisse statt 28,6 %, Passung, Fallback mit Lockerung, vorläufige Scores, Trefferliste 3–5), Prüfskript `tools/pruefe_datenqualitaet.js` und `DATENLUECKEN.md`, 7 Preise (Profibaustoffe) und 4 Preisspannen, `test50`. Heinze/WECOBIS/baubook/EUR-Lex/OBI nicht nutzbar (dokumentiert). Details: PROJEKTDOKUMENTATION.md „MaterialMatch 3.2“, RECHERCHE.md 2i.
