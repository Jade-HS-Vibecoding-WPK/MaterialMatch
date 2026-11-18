#!/usr/bin/env python3
"""
Hilfsprogramm für die automatischen Tests (nicht Teil der Web-App).
Liest zu den übergebenen UUIDs die A1-A3-Zeilen aus der ÖKOBAUDAT-Originaldatei und
gibt die Werte als JSON aus. Die Tests vergleichen damit unabhängig vom Importwerkzeug.

Aufruf:  python3 -I tests/extrahiere_csv.py <csv-datei> <uuid> [<uuid> ...]
"""
import csv
import json
import sys

if len(sys.argv) < 3:
    sys.exit(__doc__)

with open(sys.argv[1], encoding="cp1252", newline="") as f:
    rd = csv.reader(f, delimiter=";")
    kopf = next(rd)
    ix = {n: i for i, n in enumerate(kopf)}
    wanted = set(sys.argv[2:])
    out = {}
    for r in rd:
        u = r[ix["UUID"]].strip()
        if r[ix["Modul"]].strip() == "A1-A3" and u in wanted:
            g = lambda c: r[ix[c]].strip()
            num = lambda c: float(g(c)) if g(c) != "" else None
            out[u] = dict(
                name=g("Name (de)"), typ=g("Typ"), bezug=num("Bezugsgroesse"), einheit=g("Bezugseinheit"),
                rho=num("Rohdichte (kg/m3)"), fg=num("Flaechengewicht (kg/m2)"),
                gesamt=num("GWPtotal (A2)"), fossil=num("GWPfossil (A2)"),
                biogen=num("GWPbiogenic (A2)"), luluc=num("GWPluluc (A2)"),
            )
json.dump(out, sys.stdout)
