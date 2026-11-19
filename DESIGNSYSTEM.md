# MaterialMatch – Designsystem (Stand MaterialMatch 3.5, 18.11.2026)

Die Regeln stehen im Code an **einer** Stelle: `css/bento.css`, Abschnitt 1 („Farben, Maße, Schriftskala“, `:root`).
`css/style.css` ist die Grundschicht (Formulare, Tabellen, Diagramme, Druck); `css/bento.css` liegt darüber und gibt dem Ganzen das Aussehen.
Neue Bausteine nutzen nur diese Werte. Es wurde **kein neues Framework** eingeführt.

## Grundsätze
- Ruhig und sachlich: viel Weißraum, helle Kacheln, dünne Linien, keine starken Schatten, keine Farbverläufe, keine Animationen außer dezenten Hover-Übergängen.
- **Zwei Farbwelten, die sich nie mischen:** *Gestaltungsfarben* (Weiß, Hellblau, Hellviolett, Hellorange für Hinweise) kennzeichnen Bereiche; *Bewertungsfarben* (Dunkelgrün → Neutral/Gelb → Dunkelrot, `--score-1` … `--score-5`) erscheinen **nur**, wo eine fachliche, relative Bewertung möglich ist. Fehlende Werte sind grau/„fehlt“, nie null und nie „schlecht“.
- Pflichtsatz bei relativen Farben bleibt sichtbar: „Die Farben zeigen eine relative Bewertung der ausgewählten Materialien und stellen keine allgemeingültige Aussage über deren Qualität dar.“
- Demonstrationswerte bleiben gelb mit „B“ gekennzeichnet; Datenarten: **V** verifiziert, **R** Richtwert, **B** Beispieldaten, **E** eigene Angabe.
- Materialbilder: das **Foto** ist die Standarddarstellung; die **technische Schraffur** (einfarbig, `img/schraffuren/*.svg`, je Baustoffgruppe ein Muster nach Lehrbuchquelle, siehe `SCHRAFFUREN_PRUEFUNG.md`) ist die Alternative; ohne belegte Darstellung steht ein neutraler Platzhalter.

## Typografie
Schrift: **Nunito** (mit Systemschrift als Rückfallebene, die Seite funktioniert auch offline). Nunito wurde geprüft und beibehalten: sie ist gut lesbar, freundlich und passt zum Charakter eines Lernwerkzeugs; ein Wechsel auf eine strengere Groteskschrift hätte den Eindruck kaum verbessert, aber alle Maße verschoben.

| Stufe | Wert | Verwendung |
|---|---|---|
| `--fs-xs` | 12 px | Kleingedrucktes, Achsen, Kürzel (nie kleiner: Mindestgröße am Handy) |
| `--fs-s` | 13 px | Zusatzinformationen, Reiter am Handy |
| `--fs-m` | 14 px | Beschriftungen, Materialnamen, Knopftexte in Karten |
| `--fs-text` | 15 px | Fließtext |
| `--fs-l` | 17 px | Kartentitel, Diagrammtitel, Suchfeld |
| `--fs-xl` | 20 px | Kachelüberschriften (h2) |
| `--fs-zahl` | 26 px | Kennzahlen |

Schriftstärken: 400 (Text), 600/700 (Beschriftungen, Knöpfe), 800 (Marke, Titel). Zahlen immer mit tabellarischen Ziffern.

## Farben
| Name | Wert | Verwendung |
|---|---|---|
| `--text` | #1f2530 | Schrift, aktive Reiter, Hauptknöpfe |
| `--text-soft` | #5f6773 | Nebentexte (Kontrast ≥ 4,5 : 1 auf Weiß) |
| `--bg` / `--bg-soft` | #f5f6f8 | Seiten- und Karteninnenfläche |
| `--kachel-weiss` | #ffffff | Standardkachel |
| `--kachel-blau` | #e7f0fa | hervorgehobene Ergebnisse, Rückmeldungen |
| `--kachel-violett` | #eee9fa | Eingaben |
| `--hinweis-bg` | #fff0df | nur Hinweise und Warnungen |
| `--line` / `--line-strong` | 9 % / 22 % Text | Linien und Rahmen |
| `--score-1…5` | #17643a … #951f2b | nur Bewertungen |

## Form
Rundungen (seit 3.7 vier Stufen, alle als Variablen): Kachel 22 px (`--radius-kachel`), Karte 16 px (`--karte-radius`), Feld 12 px (`--radius`, `--radius-sm`), Knöpfe/Reiter vollständig rund (999 px). Abstand zwischen Kacheln 20 px (`--kachel-abstand`), Innenabstand 24 px (`--kachel-innen`, am Handy 17 px). Schatten nur `--schatten` (kaum sichtbar). Linien 1 px.

## Bausteine
- **Kopf:** eine kompakte Kachel (rund 80 px) mit Marke, Leitsatz und Untertitel; keine Schaltflächen (die Reiter sind die Navigation).
- **Vergleich in drei Ebenen:** kleine Wegweiser „1 Überblick · 2 Visuelle Auswertung · 3 Technische Details“ (`.ebene`).
- **Hinweisfenster und Auftakt:** `dialog.hinweis` (Kachel-Stil, Logo oben) und `.auftakt` (Logo mittig, kurz, ohne Klickfang).
- **Reiter:** Hauptbereiche *Entdecken, Vergleich, Match finden*; durch einen Trenner abgesetzt die weiteren Bereiche *Alternativen, Quellen & Details*. Am Handy zweizeilig (oben drei, unten zwei), Schrift mindestens 12 px, aktiver Reiter dunkel gefüllt.
- **Knöpfe:** Hauptaktion dunkel gefüllt (`.btn`, `.ent-btn-haupt`), zweite Aktion weiß mit Rahmen, Textlink für leise Aktionen (Entfernen, Steckbrief). Mindesthöhe 44 px (in kompakten Umschaltern 40 px). Fokus: 2 px dunkler Rahmen mit Abstand.
- **Materialkarte** (`.ent-karte`, Auswahlkarten, Match-Karten): Schraffur (4 : 3), Name, Kategorie, **zwei bis drei** Kennwerte, klare Aktion; weitere Werte im Steckbrief.
- **Kennwert-Kachel / Diagramm:** gleiche Kopfzeile (Symbol, Titel, Info), horizontale Balken, Zahl mit Einheit und Datenart-Marke, fehlende Werte als gestrichelte leere Zeile „fehlt“.
- **Rückmeldung:** `aria-live="polite"`-Zeilen (z. B. „… ist jetzt Material A im Vergleich“, „0 von 50 Baustoffen“), keine modalen Meldungen.
- **Leerzustand:** gestrichelter Rahmen oder Kachel mit einem Satz, was fehlt, und einem Knopf, wie es weitergeht.

## Barrierefreiheit
Bei „Bewegung reduzieren“ gibt es keine Übergänge und Animationen (globale Regel am Ende von `css/bento.css`). Alle Bedienelemente per Tastatur erreichbar (Reiter: Pfeile, Pos1, Ende), sichtbarer Fokus, Beschriftungen und `aria-label` an Symbolknöpfen, Kontrast ≥ 4,5 : 1 für Text, keine Information allein über Farbe (Datenart-Marken und Wörter wie „fehlt“).
