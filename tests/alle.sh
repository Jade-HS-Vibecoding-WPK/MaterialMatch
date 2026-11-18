#!/bin/bash
# MaterialMatch – alle automatischen Tests nacheinander ausführen.
# Aufruf aus dem Projektordner:   bash tests/alle.sh
# Voraussetzungen: Node.js, Playwright (npm-Paket "playwright" mit Chromium) und – nur für test21 und die CSV-Gegenprüfung –
# die ÖKOBAUDAT-Originaldatei unter /home/user/oekobaudat_original/ sowie Python 3.
cd "$(dirname "$0")/.." || exit 1
gesamt_fail=0
for datei in tests/test*.js; do
  name=$(basename "$datei" .js)
  ausgabe=$(node "$datei" 2>&1)
  rc=$?
  ok=$(echo "$ausgabe" | grep -c '^OK')
  fail=$(echo "$ausgabe" | grep -c '^FAIL')
  # Ein Absturz mitten im Test (Exit-Code ungleich 0 ohne FAIL-Zeile) zählt als Fehler, sonst bliebe er unbemerkt
  if [ "$rc" -ne 0 ] && [ "$fail" -eq 0 ]; then fail=1; echo "$ausgabe" | tail -8; fi
  if [ "$ok" -eq 0 ] || [ "$fail" -gt 0 ]; then
    printf '%-8s OK=%-4s FEHLER=%-3s  <-- PRÜFEN\n' "$name" "$ok" "$fail"
    echo "$ausgabe" | grep -A1 '^FAIL' | cut -c1-300 | head -12
    [ "$ok" -eq 0 ] && echo "$ausgabe" | tail -5
    gesamt_fail=$((gesamt_fail + 1))
  else
    printf '%-8s OK=%-4s FEHLER=0\n' "$name" "$ok"
  fi
done
echo "--- Gegenprüfung der Kennwerte gegen die ÖKOBAUDAT-CSV ---"
if node tools/pruefe_gegen_csv.js | tail -1 | grep -q "stimmen mit der CSV überein"; then echo "CSV-Gegenprüfung: bestanden"; else echo "CSV-Gegenprüfung: FEHLER"; gesamt_fail=$((gesamt_fail + 1)); fi
echo
if [ "$gesamt_fail" -eq 0 ]; then echo "ALLES BESTANDEN"; else echo "FEHLGESCHLAGEN in $gesamt_fail Prüfung(en)"; exit 1; fi
