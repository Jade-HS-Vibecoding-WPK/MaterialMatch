# Funktionsprüfung MaterialMatch 2.0 (Schritt 13)

Stand: 17.11.2026 · Datenbank-Version 0.4.0 · geprüft in Chromium (Playwright) bei 1280 px; Handy-Breiten siehe `test38`.

## Wie geprüft wurde
- **Durchlauftest `tests/test40.js`:** Die Seite wird wie von einem Menschen bedient (Kategorie und Material auswählen, Zahlen eintippen, Klicken, Reiter wechseln, Exportieren). Die Rechenwerte werden im Test **unabhängig** aus den gewählten Datensätzen nachgerechnet (Volumen × Rohdichte, Volumen × Preis, Volumen × CO₂-Kennwert, Dicke ÷ λB) und nicht aus den Ergebnissen der Seite abgeleitet. Die Nummern F1 bis F24 unten stehen auch im Test.
- **Gegenproben:** Ein absichtlich um 1 % falsches Gewicht und ein R-Wert mit dem falschen λ-Wert wurden vom Test sofort gemeldet. Danach wurde der Originalcode wiederhergestellt.
- **Gesamtlauf:** `bash tests/alle.sh` (49 Testdateien) plus die CSV-Gegenprüfung gegen die ÖKOBAUDAT-Datei.
- **Nicht geprüft (Grenzen):** Echte Handys, Safari und Firefox (nur Chromium). Der Druckdialog des Browsers selbst (geprüft wird die Druckansicht und das erzeugte PDF). Die Online-Vorschau (dort sind Drucken und Download gesperrt).

## Ergebnis: alle 24 Funktionen bestanden

| Nr. | Funktion | Wo in der Oberfläche | Geprüft durch | Ergebnis |
|---|---|---|---|---|
| F1 | Materialauswahl (A, B) | Reiter „Vergleich“, Materialauswahl | `test40` (Auswahl über die Felder, Karten, Buchstaben A/B), `test4`, `test30` | bestanden |
| F2 | Kategorie | Materialauswahl, Feld „Baustoffkategorie“ | `test40` (Material gesperrt bis Kategorie; Dach-Liste = Datenbank), `test4` | bestanden |
| F3 | Herstellerprodukt | „Herstellerprodukt auswählen“ | `test40` (Fixrock 033 ändert λD 0,034 → 0,032, Name im Tabellenkopf), `test27`, `test28` | bestanden |
| F4 | Drittes Material | „+ Drittes Material hinzufügen“ | `test40` (3 Spalten, 3 Karten, 3 Balken; wieder entfernen), `test30` | bestanden |
| F5 | Eigene Produkte | „Eigenes Produkt hinzufügen“ | `test40` (speichern, Produktliste, Kennzeichen E, Kosten 20 m³ × 99,50 = 1.990 €, leeres Formular abgelehnt), `test27` | bestanden |
| F6 | Fläche | Eingaben | `test40` (50 m² halbiert die Kosten; negative Eingabe benannt), `test31` | bestanden |
| F7 | Dicke | Eingaben (mm, cm, m) | `test40` (200 mm = 20 cm; ungültige Eingabe benannt), `test31` | bestanden |
| F8 | Anwendungsbereich | Eingaben | `test40` (Optionen = Einsatzbereiche von Material A; Wahl erscheint in den Alternativen), `test17` | bestanden |
| F9 | Prioritäten | Eingaben | `test40` („Geringes Gewicht“ färbt das Gewichts-Diagramm, steht in den Alternativen), `test17`, `test32` | bestanden |
| F10 | Mengen | „Alle technischen Eigenschaften“ | `test40` (20 m³), `test6`, `test14` | bestanden |
| F11 | Gewicht | Tabellen, Dashboard, Diagramme | `test40` (Volumen × Rohdichte; Dashboard = Diagramm = Tabelle), `test6` | bestanden |
| F12 | Kosten | Dashboard, Diagramme, Tabellen | `test40` (Volumen × Einheitspreis, Rechenweg), `test14`, `test27` | bestanden |
| F13 | CO₂ | Dashboard, Diagramme, Tabellen | `test40` (Volumen × Kennwert), `test14`, CSV-Gegenprüfung | bestanden |
| F14 | R-Wert, Ziel-R-Wert | Tabellen, Feld „Ziel-R-Wert“ | `test40` (0,20 ÷ λB = 5,71; Ziel R = 4 → 14 cm), `test14` | bestanden |
| F15 | Technische Tabellen | „Alle technischen Eigenschaften anzeigen“ | `test40`, `test34`, `test10` | bestanden |
| F16 | Farbige Diagramme | „Materialien im Vergleich“ | `test40` (Farben dynamisch, Pflichtsatz, Legende), `test33`, `test12` | bestanden |
| F17 | Alternativen | Reiter „Alternativen“ | `test40` (3 Karten, „Alternative vergleichen“ übernimmt als nächstes freies Material), `test35`, `test16` | bestanden |
| F18 | Quellen | Reiter „Quellen & Details“ | `test40` (Tabellen je Material, https-Links, „Ohne Quelle“), `test36` | bestanden |
| F19 | Datenqualität | „Datenqualität und Kennzeichnungen“ | `test40`, `test36`, `test19` | bestanden |
| F20 | Demo-/Echtdaten-Modus | Zeile „Datenmodus: …“ | `test40` (B-Kennzeichen verschwinden, Preise nicht verfügbar, keine Schätzung), `test39`, `test25`, `test26` | bestanden |
| F21 | PDF-Export | „Ergebnisse exportieren“ → „Als PDF speichern“ | `test40` (alle Bereiche, auch verborgene Reiter), `test39`, `test22` | bestanden (Druckdialog nur von Hand prüfbar) |
| F22 | CSV-Export | „Ergebnisse exportieren“ → „Als CSV herunterladen“ | `test40`, `test39`, `test22` | bestanden |
| F23 | Datenprüfung | Fußzeile „Datenbank geprüft ✓“ | `test40` (echte Daten 0 Fehler; beschädigte Kopie erkannt), `test3`, `test21`, `tools/pruefe_gegen_csv.js` | bestanden |
| F24 | Fachliche Hinweise | „Rechtliche und fachliche Hinweise“, Fußzeile | `test40` (ersetzt keine Nachweise; keine Aussage zu Zulassung, Gleichwertigkeit, Normkonformität; Brandverhalten ≠ Feuerwiderstand), `test36` | bestanden |

## Querprüfungen (nicht einer einzelnen Funktion zugeordnet)
- **Eine Rechenquelle:** Dashboard, Diagramme und Tabellen zeigen dieselben Werte (`test32`, `test40`).
- **Reiter, Tastatur, Anzeige:** `test29` (Reiter, ARIA, Tastatur), `test37` (Design), `test38` (Handy), `test39` (Export, Datenmodus).
- **Zufallsangriff:** `test23` bedient die Seite mit zufälligen Eingaben und prüft, dass nichts abstürzt und keine „undefined“/„NaN“-Werte erscheinen.
- **Unveränderte Fachlogik:** Formeln, Baustoffkennwerte, Quellen und Empfehlungsalgorithmus wurden in Schritt 1 bis 13 nicht verändert (Datenbank-Version bleibt 0.4.0).

## Gefundene Fehler in der Seite
Keine. Beim Schreiben des Tests gab es sieben falsche Annahmen **im Test** (zum Beispiel braucht ein eigener Preis zwingend Händler, Mehrwertsteuer und Leistungsumfang; „Alternative vergleichen“ ergänzt ein drittes Material, wenn A und B schon belegt sind). Der Test wurde an das richtige Verhalten angepasst, die Seite blieb unverändert.

## So prüft ihr selbst (ca. 10 Minuten)
1. `index.html` öffnen, Datenmodus-Schalter auf „Demo“. Kategorie „B – Dämmstoffe“, A = Mineralwolle, B = EPS. Fläche 100, Dicke 20 cm.
2. Erwartet: Kosten 1.700 € / 1.400 €, CO₂ (fossil) 1.329 / 1.728 kg, Gewicht 925 / 500 kg, λB je 0,035. R-Wert 5,71 (unter „Alle technischen Eigenschaften anzeigen“).
3. Ziel-R-Wert 4 eintragen: erforderliche Dicke 14 cm.
4. Priorität „Geringes Gewicht“: das Gewichts-Diagramm wird farbig (EPS grün).
5. Reiter „Alternativen“ und „Quellen & Details“ ansehen. „Ergebnisse exportieren“ → CSV und PDF.
6. Datenmodus auf „Verifizierte Daten“ umschalten: Preise und Kosten sind „nicht verfügbar“, nichts wird geschätzt.
