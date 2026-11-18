# MaterialMatch – Qualitätsbericht (Schritt 14)

Stand: 18.11.2026 · Datenbank-Version 0.4.0 · **52 Testdateien, 1.952 Prüfungen, alle bestanden** (davon Schritt 14: `test23`; Schritt 15: `test24` prüft die Dokumente; Entscheidungen vom 16.11.2026: `test25`, `test26` und `test27`) (`bash tests/alle.sh`)

Dieser Bericht beantwortet: *Was wurde geprüft, wie, mit welchem Ergebnis – und was konnte nicht geprüft werden?*
Grundsatz aus dem Auftrag: **Es wird nicht behauptet, etwas getestet zu haben, was nicht überprüft werden konnte.**

**Stand MaterialMatch 3.6 (18.11.2026):** Gesamtlauf `bash tests/alle.sh` mit 52 Testdateien bestanden (3.6: `test53` Materialfotos) (3.3: `test51` Händlerpreisspannen; 3.4: Datenpaket 4; 3.5: `test52` Reiter „Entdecken“, Navigation, Steckbrief). Neu: `test51` (14 Händlerpreisspannen aus bausep.de aus den Einzelpreisen nachgerechnet; Feld `echt` wirkt nur im Echtdaten-Modus; Demo-Modus unverändert). Die Datenprüfung `node tools/pruefe_datenqualitaet.js` meldet 0 Fehler und 0 Warnungen; offene Lücken: `DATENLUECKEN.md`.

## 1. Prüfplan (Abschnitt 17 des Auftrags) und Ergebnis

| Prüfpunkt laut Auftrag | Wie geprüft | Ergebnis |
|---|---|---|
| Wechsel zwischen Baustoffkategorien | `test4` (Auswahllisten je Kategorie), `test21` (13/14/11/11/8 Baustoffe je Kategorie), Affentest in `test23` | bestanden |
| Auswahl unterschiedlicher Materialien | Alle 50 Materialien als Ausgangspunkt (`test20`, `test22`, `test23`), 600 zufällige Bedienschritte | bestanden |
| Änderungen der Fläche / der Dicke | `test6`, `test23` Teil C: „100 m² × 20 cm“ in 7 Schreibweisen und Einheiten ergibt immer dasselbe | bestanden |
| Korrekte Einheitenumrechnung | 20 cm = 200 mm = 0,2 m (`test23` C); Preise/CO₂ je m³, kg, m² (`test23` A) | bestanden |
| Volumen- / Gewichts- / Kosten- / CO₂- / R-Wert-Berechnung | **Unabhängiger Referenzrechner** (`tests/referenzrechnung.py`): 50 Materialien × 24 Fälle = 16.528 Vergleiche, dazu 3 Handrechnungen | bestanden, keine Abweichung |
| Diagrammfarben | 160 zufällige Auswahlen = 800 Diagramme: jede Balkenfarbe und -länge unabhängig nachgerechnet (Min-Max, Interpolation, 2-%-Regel, Nullachse) | bestanden |
| Fehlende Daten / Identische Werte | `test23` D (identisch → neutral #7C8A99, fehlend → kein Balken), `test10`–`test14` | bestanden |
| Alternative Baustoffempfehlungen | **Zweiter, unabhängiger Empfehlungsrechner**: 285 Läufe (50 Materialien × Anwendungsbereiche × 5 Prioritäten) stimmen in Rangfolge, Gesamtbewertung (1e-9) und Begründungsliste überein; Grenzfälle von Hand gerechnet | bestanden |
| Änderungen der Nutzerpriorität | `test17`, Empfehlungsrechner (alle 5 Prioritäten), Affentest | bestanden |
| Quellenlinks | `tools/pruefe_links.js`: 51 Links, alle HTTP 200 (16.11.2026); `tools/pruefe_gegen_csv.js`; Export prüft nur https | bestanden |
| Mobile Bildschirmgrößen | Breiten 320, 360, 375, 414, 768, 1024, 1280, 1440 px: kein seitliches Scrollen, Tabellen scrollen in sich, Bedienelemente ≥ 40 px (`test19`, `test20`, `test22`) | bestanden |

## 2. Zusätzliche Prüfungen in Schritt 14

| Bereich | Methode | Ergebnis |
|---|---|---|
| **Zahleneingaben** | 5.553 Zeichenketten (Handliste, Zufallsfolgen, Tausendergruppen) gegen eine zweite, unabhängige Grammatik: „12,5“ = „12.5“, „1.500,5“, „1.000.000“; „1.500“ wird als mehrdeutig abgelehnt (nicht geraten) | bestanden |
| **Affentest** | 600 zufällige Bedienschritte (auch Unsinnseingaben, Export, Drucken, Tastatur); nach jedem Schritt Invarianten: Materialien nie doppelt, ≤ 3 Karten, Export-Knöpfe passend, Systemcheck grün, nichts „undefined/NaN“ | bestanden |
| **Tastatur** | Tab durch die ganze Seite (123 Stationen): kein Fokus-Gefängnis, alle Bedienelemente erreichbar, Namen und sichtbarer Fokusrahmen; Enter/Leertaste, Pfeiltasten | bestanden |
| **Barrierefreiheit** | axe-core 4.10 (WCAG 2 A/AA, best practice) in 5 Zuständen; eigene Kontrastmessung für jeden sichtbaren Text in 6 Zuständen; html-validate (statisch und nach Ausführung) | siehe Abschnitt 3; danach 0 Verstöße, HTML gültig |
| **Offline** | Während einer ganzen Sitzung keine Anfrage ins Netz außer der Schrift „Nunito“ (Google Fonts, mit Systemschrift als Rückfall); kein CDN; Start auch über `python3 -m http.server` | bestanden |
| **Inhaltliche Regeln** | 40 Kombinationen: keine Pauschalaussagen („immer nachhaltiger“, „beste Wahl“), keine englischen Rohtexte, alle 120 Sätze zu Zulassung/Normkonformität sind Verneinungen, Pflichtsatz und Haftungshinweis immer vorhanden, nie Empfehlung allein nach Preis | bestanden |
| **Geschwindigkeit** | Seite lädt in ca. 150 ms; eine Materialauswahl mit allen Tabellen, Diagrammen, Empfehlungen ca. 5 ms | bestanden |
| **Export** | `test22` (Schritt 13): CSV Wert für Wert, PDF mit poppler | bestanden |

## 3. Gefundene Mängel und ihre Behebung

| # | Befund | Fund durch | Behebung |
|---|---|---|---|
| 1 | Überschriftenebenen sprangen von h1 auf h3 (Bereiche hatten keine h2) | axe | Bereichsüberschriften sind jetzt `h2` in der Zeile; Zwischenüberschriften `h3` |
| 2 | Auf dem Handy waren seitlich scrollbare Tabellen per Tastatur nicht erreichbar (WCAG 2.1.1) | axe | Scrollbare Tabellen bekommen Tabstopp und Beschriftung, nicht scrollbare nicht |
| 3 | Marken B/R/V hatten `aria-label` ohne Rolle (Screenreader lesen das nicht zuverlässig) | axe, html-validate | `role="img"` |
| 4 | Der „i“-Knopf stand **im** `<label>`: ein Beschriftungsfeld mit zwei Bedienelementen | html-validate | Knopf steht neben dem Label |
| 5 | Tabellenköpfe ohne `scope` | html-validate | `scope="col"`/`"row"` überall |
| 6 | Links hatten nur den Browser-Standard-Fokus, uneinheitlich zum Rest | Tastaturtest | einheitlicher Fokusrahmen |
| 7 | Kurzanleitung am Handy zerfiel in zwei Spalten (Flex-Layout trennte Text und Fettschrift) | Sicht auf Screenshot | Inhalt je Schritt in einem `<span>`; Test |
| 8 | Deaktivierte Knöpfe knapp unter 4,5:1 Kontrast (4,45) | Kontrastmessung | Schrift abgedunkelt (4,9) |

Keiner der Mängel betraf eine Berechnung: **Rechnen, Zahlenlesen, Diagrammfarben, Balkenlängen und Empfehlungen stimmten in allen Vergleichen mit den unabhängigen Referenzen überein.**
Lücken in den eigenen Tests, die Mutationstests aufdeckten und die geschlossen wurden: 2-%-Grenzfall und Rangfolge bei gleicher Bewertung (jetzt mit synthetischen Daten von Hand gerechnet).

## 4. Qualitätssicherung der Tests selbst (Mutationstests)

Es wurden absichtlich Fehler in die App eingebaut, um zu sehen, ob die Tests sie bemerken: Flächenmasse um 0,1 % falsch, R mit d in cm, „1.500“ als 1500 geraten, Dezimalpunkt abgelehnt, Farbstützstelle verändert, 2-%-Schwelle auf 5 %, Normalisierungsrichtung vertauscht, Balken 1 % zu lang, Priorität 2- statt 3-fach, Rangfolge ohne Datenabdeckung, Anwendungsbereich ignoriert, Fokusrahmen entfernt, scope/role/Tastaturzugang/h2/Kurzanleitung-Layout entfernt. **Alle wurden erkannt** (zwei erst nach Ergänzung der Tests, siehe oben).

## 5. Was nicht geprüft werden konnte (ehrliche Grenzen)

- **Nur Chromium** (Chrome/Edge-Familie). **Safari, Firefox und echte Handys** sind nicht getestet; in der Arbeitsumgebung gibt es nur diesen Browser.
- **Echter Druckdialog und Excel/LibreOffice:** Geprüft wurden das mit derselben Druck-Formatierung erzeugte PDF und die CSV mit eigenem Leser, nicht der Dialog selbst und nicht Excel.
- **Screenreader** (NVDA, VoiceOver) wurden nicht eingesetzt; geprüft wurden Struktur, Namen, Rollen und Fokus automatisch.
- **Fachliche Richtigkeit der Kennwerte:** Die Tests belegen, dass die App die Daten korrekt verarbeitet und mit den Originalwerten der ÖKOBAUDAT übereinstimmt. Ob ein Beispielwert (λ, Preis …) der Wirklichkeit entspricht, kann kein Test klären: 108 Werte der 17 ursprünglichen Baustoffe sind Beispieldaten, 236 Felder „nicht verfügbar“.
- **Empfehlungen:** In 110 von 285 Läufen gibt es keine Empfehlung, weil bei vielen Baustoffen Preis und λ fehlen. Das ist die gewollte Folge von „nichts erfinden“, keine Fehlfunktion.
- Zeitliche Gültigkeit: 42 der 61 ÖKOBAUDAT-Datensätze gelten nur bis 2026.

## 6. Selbst überprüfen (für Nutzer:innen)

1. Tests: `bash tests/alle.sh` (Node.js, Playwright, poppler-utils; für `test21` die ÖKOBAUDAT-CSV, siehe README). Ergebnis muss „ALLES BESTANDEN“ lauten.
2. Von Hand rechnen: 100 m² × 20 cm Normalbeton → Volumen 20 m³; Gewicht 20 × 2.300 = 46.000 kg; Kosten 20 × 204,50 € = 4.090 € (Holcim-Listenpreis netto); mineralwolle: R = 0,2 / 0,035 = 5,71 m²K/W. Die Seite muss dieselben Zahlen zeigen.
3. Browser: Seite in Firefox und Safari öffnen (Doppelklick auf `index.html`), Material wählen, Fläche/Dicke eingeben, Export ausprobieren.
4. Handy: Datei auf das Handy übertragen oder per lokalem Server öffnen; Tabellen müssen seitlich wischbar sein.
5. Optional Barrierefreiheit: Chrome-Erweiterung „axe DevTools“ oder Lighthouse (Chrome-Entwicklertools) ausführen.
