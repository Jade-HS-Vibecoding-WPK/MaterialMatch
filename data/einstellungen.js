/* ==========================================================================
   MaterialMatch – Einstellungen der Bewertungsregeln
   --------------------------------------------------------------------------
   Diese Datei darf mit einem Texteditor geändert werden. Nach dem Speichern die Seite
   neu laden. Die Anwendung erklärt die aktuell gültigen Werte unter
   „Alternative Baustoffe → So wird bewertet“. Ungültige Werte werden durch die
   Standardwerte ersetzt (Meldung in der Browser-Konsole).

   prioritaetFaktor     Wie oft zählt das bei „Was ist dir besonders wichtig?“ gewählte Kriterium
                        bei der Empfehlung im Vergleich zu den anderen (1 = gleich viel, 3 = dreifach).
                        Erlaubt: 1 bis 10. Standard: 3 (Festlegung der Nutzer:innen, 16.11.2026).
   gleichSchwelle       Unterschiede unterhalb dieser Schwelle gelten als „praktisch gleich“
                        (neutrale Farbe, kein „besser“/„schlechter“). 0,02 bedeutet 2 %, bezogen auf den
                        größten Betrag der verglichenen Werte. Erlaubt: 0 bis 0,2. Standard: 0,02.
   besserSchwelle       Abstand der Gesamtbewertung (Skala 0 bis 1), ab dem eine Alternative als „besser“
                        oder „schlechter“ als Material A beschrieben wird. Erlaubt: 0 bis 0,5. Standard: 0,05.
   maxEmpfehlungen      Höchstzahl der angezeigten Alternativen. Erlaubt: 1 bis 5. Standard: 3 (Vorgabe des Auftrags).
   beispieldatenStandard
                        true: Die Anwendung startet im Demo-Modus (Beispieldaten werden verwendet und deutlich
                        gekennzeichnet). false (Standard): Start im Echtdaten-Modus (Beispieldaten gelten als
                        „nicht verfügbar“). Der Demo-Modus bleibt über den Schalter oben auf der Seite jederzeit
                        verfügbar; mit dem Zusatz ?modus=demo oder ?modus=echt hinter der Adresse (index.html?modus=demo)
                        lässt sich der Start-Modus für einen Aufruf überschreiben (nützlich für Vorführungen).
   ========================================================================== */

window.MATERIALMATCH_EINSTELLUNGEN = {
  prioritaetFaktor: 3,
  gleichSchwelle: 0.02,
  besserSchwelle: 0.05,
  maxEmpfehlungen: 3,
  beispieldatenStandard: false
};
