#!/usr/bin/env python3
"""MaterialMatch 3.8 – erzeugt die technischen Schraffuren (SVG) und die Zuordnungsdatei data/schraffuren.js.

Aufruf:   python3 tools/erzeuge_schraffuren.py
Ergebnis: img/schraffuren/<materialId>.svg (je Baustoff eine Datei), img/schraffuren/platzhalter.svg und data/schraffuren.js

Grundsatz (seit 3.8): KEINE frei erfundenen Muster. Jede Schraffur gehört zu einer Baustoffgruppe, deren übliche Darstellung im Schnitt
in einer frei lesbaren Lehrbuchquelle abgebildet ist (Europa-Fachbuchreihe Bautechnik „Technisches Zeichnen“, 6. Aufl., Abschnitt 2.6,
Tabelle „Schraffuren und Farben DIN 1356-1 / Schraffuren DIN ISO 128-50“). Die Muster sind hier EIGENE, vereinfachte Zeichnungen
in Anlehnung an diese Konvention. Sie wurden NICHT gegen den Normtext geprüft (Normen sind kostenpflichtig) und sind keine
normgerechten Schraffuren. Für Baustoffe ohne belegbare Darstellung gibt es den neutralen Platzhalter.

Alle Zeichnungen: 160 x 120 (4:3), Schnittausschnitt mit Rahmen, nur Dunkelgrau auf Weiß, dieselben Linienstärken (fein 1,1 · Rahmen 1,4).
Zufallsanteile (Punkte, Wellen) haben feste Startwerte, damit jede Erzeugung dieselben Dateien liefert.
"""
import json
import math
import os
import random

B, H = 160, 120
X0, Y0, X1, Y1 = 12, 12, 148, 108
INK = "#2b2f33"
GRAU = "#8b9097"
FEIN = 1.1


def f(x):
    s = ("%.1f" % x).rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


class Z:
    def __init__(self, rnd):
        self.r = rnd
        self.out = []

    def add(self, s):
        self.out.append(s)

    def path(self, d, fill="none", sw=FEIN, extra=""):
        self.add('<path d="%s" fill="%s" stroke-width="%s"%s/>' % (d, fill, sw, extra))

    def line(self, x1, y1, x2, y2, sw=FEIN, dash=None, phase=0):
        self.path("M%s %sL%s %s" % (f(x1), f(y1), f(x2), f(y2)), sw=sw,
                  extra=(' stroke-dasharray="%s" stroke-dashoffset="%s"' % (dash, f(phase))) if dash else "")

    def punkte(self, n, box, rmax=1.4):
        stufen = {}
        for _ in range(n):
            x = self.r.uniform(box[0], box[2])
            y = self.r.uniform(box[1], box[3])
            r = round(self.r.uniform(.5, rmax) * 2) / 2.0
            stufen.setdefault(r, []).append((x, y))
        for r, pts in sorted(stufen.items()):
            d = "".join("M%s %sh.01" % (f(x), f(y)) for x, y in pts)
            self.add('<path d="%s" fill="none" stroke-width="%s" stroke-linecap="round"/>' % (d, f(max(r * 2, 1))))


def schraeg(z, abstand, dash=None, versatz=0.0, box=(X0, Y0, X1, Y1)):
    """Linien unter 45° (von links unten nach rechts oben) über die ganze Box"""
    x0, y0, x1, y1 = box
    h = y1 - y0
    x = x0 - h + versatz
    i = 0
    while x < x1 + 2:
        z.line(x, y1, x + h, y0, dash=dash, phase=z.r.uniform(0, 17))   # versetzte Striche, damit keine waagerechten Bänder entstehen
        x += abstand
        i += 1


# ---------------------------------------------------------------- Muster je Baustoffgruppe
def mauerwerk_kuenstlich(z):
    schraeg(z, 6.5)


def mauerwerk_natur(z):
    schraeg(z, 13)


def beton(z):
    # unbewehrt: Linien 45°, gestrichelt
    schraeg(z, 7, dash="11 6")


def stahlbeton(z):
    # Linien 45°, durchgezogen im Wechsel mit gestrichelten
    schraeg(z, 14)
    schraeg(z, 14, dash="11 6", versatz=7)


def putz(z):
    z.punkte(300, (X0 + 2, Y0 + 2, X1 - 2, Y1 - 2), rmax=1.2)


def daemmstoff(z):
    # Kette länglicher Schleifen (Zwiebelform) in Reihen
    zeilen = 3
    hz = (Y1 - Y0) / float(zeilen)
    for k in range(zeilen):
        yo = Y0 + k * hz
        x = X0 - 4
        while x < X1 + 6:
            # eine Schleife: von oben links über die Spitze unten nach oben rechts
            br = 10.0
            z.path("M%s %sC%s %s,%s %s,%s %sC%s %s,%s %s,%s %s" % (
                f(x), f(yo + hz * .06),
                f(x + br * .8), f(yo + hz * .1), f(x + br * 1.0), f(yo + hz * .88), f(x + br * .5), f(yo + hz * .94),
                f(x), f(yo + hz * .88), f(x + br * .2), f(yo + hz * .1), f(x + br), f(yo + hz * .06)))
            x += 10
        z.line(X0 - 4, yo, X1 + 4, yo, sw=FEIN) if k == 0 else None


def holz_quer(z, x0, x1):
    # Holz quer zur Faser (Hirnholz): schräge, leicht gebogene Linien
    x = x0 - 80
    while x < x1 + 10:
        z.path("M%s %sQ%s %s %s %s" % (f(x), f(Y1 + 4), f(x + 38 + z.r.uniform(-4, 4)), f((Y0 + Y1) / 2.0 + z.r.uniform(-6, 6)), f(x + 55), f(Y0 - 4)))
        x += 7


def holz_laengs(z, x0, x1):
    # Holz längs zur Faser: waagerechte, leicht gewellte Linien unterschiedlicher Länge
    y = Y0 + 6
    while y < Y1:
        xs = x0 - 2
        while xs < x1:
            laenge = z.r.uniform(30, 70)
            amp = z.r.uniform(.8, 2.2)
            ph = z.r.uniform(0, 6)
            pts = []
            n = 14
            for i in range(n + 1):
                x = xs + laenge * i / n
                pts.append((x, y + amp * math.sin(ph + i * .8)))
            z.path("M" + "L".join("%s %s" % (f(a), f(b)) for a, b in pts))
            xs += laenge + z.r.uniform(4, 12)
        y += 5.2


def vollholz(z):
    mitte = (X0 + X1) / 2.0
    z.add('<g clip-path="url(#cl)">')
    holz_quer(z, X0, mitte)
    z.add('</g><g clip-path="url(#cr)">')
    holz_laengs(z, mitte, X1)
    z.add('</g>')
    z.line(mitte, Y0, mitte, Y1, sw=1.4)


def holzwerkstoff(z):
    x = X0 + 3
    while x < X1:
        pts = []
        ph = z.r.uniform(0, 6)
        amp = z.r.uniform(.6, 1.8)
        n = 16
        for i in range(n + 1):
            pts.append((x + amp * math.sin(ph + i * .9), Y0 + (Y1 - Y0) * i / n))
        z.path("M" + "L".join("%s %s" % (f(a), f(b)) for a, b in pts))
        x += 4.6


def stahl_profil(z):
    # I-Profil im Schnitt, voll geschwärzt (schmale Schnittflächen werden geschwärzt)
    z.path("M46 26H114V40H87V80H114V94H46V80H73V40H46Z", fill=INK, sw=1.4)


def stahl_blech(z):
    # Trapezprofil als dünne, geschwärzte Schnittfläche
    z.path("M16 76H42L54 44H80L92 76H118L130 44H146", sw=3.4, extra=' stroke-linejoin="round"')


def sperrstoff(z):
    # Abdichtungsbahn: Streifen aus abwechselnd schwarzen und weißen Abschnitten
    x = X0 + 6
    i = 0
    while x < X1 - 6:
        w = min(15, X1 - 6 - x)
        z.add('<rect x="%s" y="55" width="%s" height="9" fill="%s" stroke-width="1"/>' % (f(x), f(w), INK if i % 2 == 0 else "#ffffff"))
        x += w
        i += 1


def glas(z):
    # Glas: kurze, lockere Schrägstriche in zwei Reihen
    for (y, xs) in ((38, (22, 56, 90, 124)), (72, (36, 70, 104))):
        for x in xs:
            z.line(x, y + 14, x + 14, y)
            z.line(x + 8, y + 14, x + 18, y + 4) if x % 2 == 0 else None


def platzhalter(z):
    # neutral: drei angedeutete Schichten (Marke) als Umriss, in Grau
    for dx, y in ((0, 40), (10, 56), (0, 72)):
        z.path("M%s %sL%s %sL%s %sL%s %sZ" % (60 + dx, y, 112 + dx, y, 104 + dx, y + 18, 52 + dx, y + 18), sw=1.4)


# ---------------------------------------------------------------- Gruppen: Muster, Bezeichnung, Quelle
QUELLE = ("Europa-Fachbuchreihe Bautechnik „Technisches Zeichnen“, 6. Auflage, Abschnitt 2.6 „Schraffuren und Farben in Bauzeichnungen“ "
          "(Leseprobe, Verlag Europa-Lehrmittel; gibt die Darstellungen nach DIN 1356-1 und DIN ISO 128-50 wieder)")

GRUPPEN = {
    "mauerwerk_kuenstlich": (mauerwerk_kuenstlich, "Mauerwerk aus künstlichen Steinen", "parallele Linien unter 45° (Grundschraffur)", "DIN 1356-1"),
    "mauerwerk_natur": (mauerwerk_natur, "Mauerwerk aus Natursteinen", "parallele Linien unter 45°, weiterer Abstand", "DIN 1356-1"),
    "beton": (beton, "Beton (unbewehrt)", "Linien unter 45°, gestrichelt", "DIN 1356-1, DIN ISO 128-50"),
    "stahlbeton": (stahlbeton, "Stahlbeton", "Linien unter 45°, durchgezogen im Wechsel mit gestrichelten", "DIN 1356-1, DIN ISO 128-50"),
    "putz": (putz, "Mörtel, Putz", "Punktraster", "DIN 1356-1"),
    "daemmstoff": (daemmstoff, "Dämmstoff", "Kette länglicher Schleifen", "DIN 1356-1, DIN ISO 128-50"),
    "vollholz": (vollholz, "Vollholz (quer und längs zur Faser)", "links quer, rechts längs zur Faser", "DIN 1356-1, DIN ISO 128-50"),
    "holzwerkstoff": (holzwerkstoff, "Holzwerkstoffe", "senkrechte, leicht gewellte Linien", "DIN 1356-1, DIN ISO 128-50"),
    "stahl_profil": (stahl_profil, "Stahl", "geschwärzte Schnittfläche", "DIN 1356-1, DIN ISO 128-50"),
    "stahl_blech": (stahl_blech, "Stahl", "geschwärzte Schnittfläche (dünnes Bauteil)", "DIN 1356-1, DIN ISO 128-50"),
    "sperrstoff": (sperrstoff, "Sperrstoff (Abdichtung)", "Streifen aus schwarzen und weißen Abschnitten", "DIN 1356-1, DIN ISO 128-50"),
    "glas": (glas, "Glas", "kurze Schrägstriche", "DIN ISO 128-50"),
}

# Bezug: "genannt"  = der Baustoff bzw. seine Gruppe steht ausdrücklich in der Quelle
#        "gruppe"   = das Projekt ordnet den Baustoff einer übergeordneten Gruppe zu (vertretbar, aber nicht eigens belegt)
#        "keiner"   = keine belegbare Darstellung gefunden -> neutraler Platzhalter
PLAN = {
    "hochlochziegel": ("mauerwerk_kuenstlich", "Hochlochziegel", "genannt"),
    "klinker": ("mauerwerk_kuenstlich", "Klinker", "genannt"),
    "kalksandstein": ("mauerwerk_kuenstlich", "Kalksandstein", "genannt"),
    "porenbeton": ("mauerwerk_kuenstlich", "Porenbeton", "gruppe"),
    "leichtbetonstein_bims": ("mauerwerk_kuenstlich", "Leichtbetonstein (Bims)", "gruppe"),
    "leichtbetonstein_blaehton": ("mauerwerk_kuenstlich", "Leichtbetonstein (Blähton)", "gruppe"),
    "naturstein_hart": ("mauerwerk_natur", "Naturstein (hart)", "genannt"),
    "naturstein_weich": ("mauerwerk_natur", "Naturstein (weich)", "genannt"),
    "schiefer": ("mauerwerk_natur", "Schiefer", "gruppe"),
    "normalbeton": ("beton", "Beton", "genannt"),
    "betondachstein": ("beton", "Betondachstein", "gruppe"),
    "stahlbeton": ("stahlbeton", "Stahlbeton", "genannt"),
    "kalkzementputz": ("putz", "Kalkzementputz", "genannt"),
    "kalkgipsinnenputz": ("putz", "Kalk-Gips-Innenputz", "genannt"),
    "zementestrich": ("putz", "Zementestrich", "gruppe"),
    "calciumsulfatestrich": ("putz", "Calciumsulfatestrich", "gruppe"),
    "mineralwolle": ("daemmstoff", "Mineralwolle", "genannt"),
    "steinwolle": ("daemmstoff", "Steinwolle", "genannt"),
    "glaswolle": ("daemmstoff", "Glaswolle", "genannt"),
    "eps": ("daemmstoff", "EPS", "genannt"),
    "xps": ("daemmstoff", "XPS", "genannt"),
    "pir": ("daemmstoff", "PIR", "genannt"),
    "pur": ("daemmstoff", "PUR", "genannt"),
    "schaumglas": ("daemmstoff", "Schaumglas", "genannt"),
    "kork": ("daemmstoff", "Kork", "genannt"),
    "holzfaserdaemmung": ("daemmstoff", "Holzfaserdämmung", "genannt"),
    "zellulose": ("daemmstoff", "Zellulose", "genannt"),
    "flachsdaemmung": ("daemmstoff", "Flachsdämmung", "genannt"),
    "hanfdaemmung": ("daemmstoff", "Hanfdämmung", "genannt"),
    "schafwolle": ("daemmstoff", "Schafwolle", "genannt"),
    "massivholz_nadel": ("vollholz", "Nadelholz", "genannt"),
    "massivholz_laub": ("vollholz", "Laubholz", "genannt"),
    "konstruktionsvollholz": ("vollholz", "Konstruktionsvollholz", "genannt"),
    "brettschichtholz": ("vollholz", "Brettschichtholz", "gruppe"),
    "brettsperrholz": ("vollholz", "Brettsperrholz", "gruppe"),
    "osb": ("holzwerkstoff", "OSB", "genannt"),
    "spanplatte": ("holzwerkstoff", "Spanplatte", "genannt"),
    "sperrholz": ("holzwerkstoff", "Sperrholz", "genannt"),
    "baustahl": ("stahl_profil", "Baustahl", "genannt"),
    "stahlblech": ("stahl_blech", "Stahlblech", "genannt"),
    "bitumenbahn": ("sperrstoff", "Bitumenbahn", "gruppe"),
    "epdm": ("sperrstoff", "EPDM-Folie", "gruppe"),
    "glas": ("glas", "Glas", "genannt"),
    "aluminium": (None, "Aluminium", "keiner"),
    "zinkblech": (None, "Zinkblech", "keiner"),
    "dachziegel": (None, "Dachziegel", "keiner"),
    "keramikfliese": (None, "Keramikfliese", "keiner"),
    "faserzement": (None, "Faserzement", "keiner"),
    "gipskarton": (None, "Gipskarton", "keiner"),
    "gipsfaserplatte": (None, "Gipsfaserplatte", "keiner"),
}

HINWEISE_KEINER = {
    "aluminium": "In der geprüften Quelle ist nur Stahl, nicht aber Aluminium oder andere Metalle dargestellt.",
    "zinkblech": "In der geprüften Quelle ist nur Stahl, nicht aber Zink oder andere Metalle dargestellt.",
    "dachziegel": "Die Quelle nennt Ziegel nur als Mauerwerk; für Dachziegel gibt es dort keine eigene Darstellung.",
    "keramikfliese": "Für Keramikfliesen steht in der geprüften Quelle keine Darstellung.",
    "faserzement": "Für Faserzement steht in der geprüften Quelle keine Darstellung.",
    "gipskarton": "Für Gipskarton steht in der geprüften Quelle keine Darstellung.",
    "gipsfaserplatte": "Für Gipsfaserplatten steht in der geprüften Quelle keine Darstellung.",
}


def svg(titel, zeichne, rnd, ink=INK):
    z = Z(random.Random(rnd))
    zeichne(z)
    mitte = (X0 + X1) / 2.0
    kopf = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" role="img" aria-labelledby="t">'
            '<title id="t">%s</title>' % (B, H, B, H, titel))
    defs = ('<clipPath id="c"><rect x="%d" y="%d" width="%d" height="%d" rx="7"/></clipPath>' % (X0, Y0, X1 - X0, Y1 - Y0) +
            '<clipPath id="cl"><rect x="%d" y="%d" width="%s" height="%d"/></clipPath>' % (X0, Y0, f(mitte - X0), Y1 - Y0) +
            '<clipPath id="cr"><rect x="%s" y="%d" width="%s" height="%d"/></clipPath>' % (f(mitte), Y0, f(X1 - mitte), Y1 - Y0))
    if "clip-path=\"url(#cl)\"" not in "".join(z.out):
        defs = '<clipPath id="c"><rect x="%d" y="%d" width="%d" height="%d" rx="7"/></clipPath>' % (X0, Y0, X1 - X0, Y1 - Y0)
    rahmen = ('<rect width="%d" height="%d" fill="#fafafa"/>' % (B, H) + defs +
              '<rect x="%d" y="%d" width="%d" height="%d" rx="7" fill="#ffffff"/>' % (X0, Y0, X1 - X0, Y1 - Y0))
    inhalt = ('<g clip-path="url(#c)" stroke="%s" stroke-linecap="butt" stroke-linejoin="round" fill="none">' % ink + "".join(z.out) + '</g>')
    rand = '<rect x="%d" y="%d" width="%d" height="%d" rx="7" fill="none" stroke="%s" stroke-width="1.4"/>' % (X0, Y0, X1 - X0, Y1 - Y0, ink)
    return kopf + rahmen + inhalt + rand + "</svg>\n"


def main():
    wurzel = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
    ziel = os.path.join(wurzel, "img", "schraffuren")
    os.makedirs(ziel, exist_ok=True)
    daten = {}
    for kennung, (gruppe, name, bezug) in PLAN.items():
        if gruppe:
            fn, glabel, muster, norm = GRUPPEN[gruppe]
            s = svg("Schematische Schraffur: %s (%s)" % (name, glabel), fn, gruppe)
            daten[kennung] = {"gruppe": glabel, "muster": muster, "bezug": bezug, "norm": norm}
        else:
            s = svg("Keine belegte Schraffur: %s" % name, platzhalter, "platzhalter", ink=GRAU)
            daten[kennung] = {"gruppe": "", "muster": "", "bezug": "keiner", "norm": "", "hinweis": HINWEISE_KEINER[kennung]}
        with open(os.path.join(ziel, kennung + ".svg"), "w", encoding="utf-8") as d:
            d.write(s)
    s = svg("Keine belegte Schraffur", platzhalter, "platzhalter", ink=GRAU)
    with open(os.path.join(ziel, "platzhalter.svg"), "w", encoding="utf-8") as d:
        d.write(s)
    kopf = ("/* MaterialMatch 3.8 – Zuordnung Baustoff -> Schraffur (erzeugt von tools/erzeuge_schraffuren.py, nicht von Hand ändern).\n"
            "   bezug: genannt = Baustoff bzw. Gruppe steht ausdrücklich in der Quelle · gruppe = Zuordnung durch das Projekt · keiner = keine belegbare Darstellung (neutraler Platzhalter).\n"
            "   Die Muster sind eigene, vereinfachte Zeichnungen in Anlehnung an die Konvention; sie wurden nicht gegen den Normtext geprüft. Siehe SCHRAFFUREN_PRUEFUNG.md. */\n")
    inhalt = {"quelle": QUELLE, "stand": "2026-11-19", "materialien": daten}
    with open(os.path.join(wurzel, "data", "schraffuren.js"), "w", encoding="utf-8") as d:
        d.write(kopf + "window.MATERIALMATCH_SCHRAFFUREN = " + json.dumps(inhalt, ensure_ascii=False, indent=1, sort_keys=True) + ";\n")
    print("Erzeugt:", len(PLAN) + 1, "Zeichnungen in", os.path.normpath(ziel), "und data/schraffuren.js")


if __name__ == "__main__":
    main()
