#!/usr/bin/env python3
"""
Unabhängiger Referenzrechner für die Qualitätskontrolle (Schritt 14). Nicht Teil der Web-App.

Er wurde bewusst getrennt vom App-Code (js/berechnung.js) aus der Aufgabenstellung heraus geschrieben:
  Volumen = Fläche × Dicke · Gewicht = Volumen × Rohdichte · Kosten/CO₂ = Menge × Kennwert (Menge je nach Bezugsgröße)
  R = d / λ · erforderliche Dicke = R × λ
und liest Zahleneingaben nach eigener Grammatik (Komma = Dezimaltrenner, Punkt nur als Tausendertrenner in
Dreiergruppen, „1.500“ ist mehrdeutig und wird abgelehnt).

Aufruf:  python3 -I tests/referenzrechnung.py < eingabe.json > ausgabe.json
Eingabe: { "baustoffe": [...], "faelle": [[flaeche_m2, dicke_m], ...], "ziele": [R, ...], "texte": ["…", ...] }
"""
import json
import math
import re
import sys


def zahl(x):
    return x if isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x) else None


def eig(m, name):
    return m["eigenschaften"].get(name) or {}


def menge(m, bezug, bezugsdicke, A, d):
    schicht = m["mengenmodell"] == "schicht"
    rho = zahl(eig(m, "rohdichte").get("wert"))
    if bezug == "1 m³":
        return A * d if schicht else None
    if bezug == "1 kg":
        return A * d * rho if (schicht and rho is not None and rho > 0) else None
    if bezug == "1 m²":
        if not schicht:
            return A
        if bezugsdicke and bezugsdicke > 0 and abs(d - bezugsdicke) <= 1e-9 * max(1, bezugsdicke):
            return A
        return None
    return None


PREIS_BEZUG = {"€/m³": "1 m³", "€/m²": "1 m²", "€/kg": "1 kg"}


def lam(m):
    # Regel seit 16.11.2026: R-Wert mit dem Bemessungswert, sofern er vorliegt, sonst mit dem Nennwert
    if m["mengenmodell"] != "schicht":
        return None
    for feld in ("waermeleitfaehigkeit_bemessung", "waermeleitfaehigkeit"):
        l = eig(m, feld)
        if l.get("nicht_anwendbar") is True:
            continue
        v = zahl(l.get("wert"))
        if v is not None and v > 0:
            return v
    return None


def rechne(m, A, d, ziele):
    out = {}
    schicht = m["mengenmodell"] == "schicht"
    rho = zahl(eig(m, "rohdichte").get("wert"))
    fg = zahl(eig(m, "flaechengewicht").get("wert"))
    if schicht and rho is not None and rho > 0:
        out["volumen"] = A * d
        out["gewicht"] = A * d * rho
        out["flaechenmasse"] = d * rho
    elif not schicht and fg is not None and fg > 0:
        out["volumen"] = None
        out["gewicht"] = A * fg
        out["flaechenmasse"] = fg
    else:
        out["volumen"] = out["gewicht"] = out["flaechenmasse"] = None

    p = eig(m, "preis")
    pw = zahl(p.get("wert"))
    out["kosten"] = None
    if pw is not None:
        q = menge(m, PREIS_BEZUG.get(p.get("einheit")), zahl(p.get("bezugsdicke_m")), A, d)
        out["kosten"] = q * pw if q is not None else None

    g = eig(m, "gwp")
    out["co2"] = None
    if g.get("werte"):
        q = menge(m, g.get("deklarierte_einheit"), zahl(g.get("bezugsdicke_m")), A, d)
        if q is not None:
            w = g["werte"]
            out["co2"] = {"gesamt": q * w["gesamt"], "fossil": q * w["fossil"], "biogen": q * w["biogen"],
                          "luluc": q * w["luluc"] if zahl(w.get("luluc")) is not None else None}

    l = lam(m)
    out["R"] = d / l if l is not None else None
    out["dicke_fuer_R"] = []
    for z in ziele:
        dd = z * l if l is not None else None
        out["dicke_fuer_R"].append(dd if (dd is not None and dd <= 10) else None)
    return out


# ---------- Zahleneingabe: eigene Grammatik ----------
def lese(text):
    """Liefert ('leer',), ('fehler',) oder ('wert', x)."""
    s = "".join(ch for ch in text if not ch.isspace() and ch not in "  ")
    if s == "":
        return ("leer",)
    neg = False
    if s[0] == "-":
        neg, s = True, s[1:]
    elif s[0] == "+":
        s = s[1:]
    if s == "" or any(ch not in "0123456789.," for ch in s):
        return ("fehler",)
    if "," in s:
        teile = s.split(",")
        if len(teile) != 2 or teile[1] == "" or not teile[1].isdigit() or not teile[1].isascii():
            return ("fehler",)
        ganz, bruch = teile
        if ganz.isdigit():
            pass
        elif re.fullmatch(r"[1-9][0-9]{0,2}(\.[0-9]{3})+", ganz):
            ganz = ganz.replace(".", "")
        else:
            return ("fehler",)
    elif s.isdigit():
        ganz, bruch = s, ""
    elif re.fullmatch(r"[1-9][0-9]{0,2}\.[0-9]{3}", s):
        return ("fehler",)          # mehrdeutig: 1,5 oder 1500
    elif re.fullmatch(r"[1-9][0-9]{0,2}(\.[0-9]{3}){2,}", s):
        ganz, bruch = s.replace(".", ""), ""
    elif re.fullmatch(r"[0-9]+\.[0-9]+", s):
        ganz, bruch = s.split(".")
    else:
        return ("fehler",)
    if len(ganz + bruch) > 15:
        return ("fehler",)
    x = float(ganz + ("." + bruch if bruch else ""))
    return ("wert", -x if neg else x)


def main():
    d = json.load(sys.stdin)
    res = {"rechnung": {}, "lesen": []}
    for m in d["baustoffe"]:
        res["rechnung"][m["id"]] = [rechne(m, A, dd, d["ziele"]) for A, dd in d["faelle"]]
    for t in d["texte"]:
        res["lesen"].append(list(lese(t)))
    json.dump(res, sys.stdout)


if __name__ == "__main__":
    main()
