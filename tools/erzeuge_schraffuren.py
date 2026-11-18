#!/usr/bin/env python3
"""MaterialMatch – erzeugt die schematischen Materialillustrationen (SVG-Schraffuren).

Aufruf:   python3 tools/erzeuge_schraffuren.py
Ergebnis: img/schraffuren/<materialId>.svg  (je Baustoff eine Datei) und img/schraffuren/platzhalter.svg

Die Zeichnungen sind EIGENE Arbeit des Projekts (kein Foto, keine fremden Bilder, keine Herstellerprodukte).
Sie erinnern an Materialschraffuren aus Architekturplänen und sind bewusst schematisch.
Alle Zeichnungen haben dasselbe Format (160 x 120, Seitenverhältnis 4:3), dieselbe Strichstärke (1,4) und
einen eingerahmten „Schnittausschnitt“. Die Zufallsanteile (Punkte, Fasern, Poren) sind pro Material fest
(Startwert = Material-Kennung), damit jede Erzeugung dieselben Dateien liefert.

Farben (seit Version 3.1): ausschließlich Schwarz, Weiß und neutrale Grautöne. Linien in Dunkelgrau, Hintergrund nahezu weiß,
keine Verläufe, keine Schatten. So wirken die Zeichnungen ruhig und können nie mit einer fachlichen Bewertungsfarbe
verwechselt werden. Es sind SCHEMATISCHE MATERIALILLUSTRATIONEN, keine normgerechten (DIN-)Schraffuren.
Einheitlich: drei Linienstärken (fein 1,1 · normal 1,4 · kräftig 2), zwei Tonwerte (Linie voll und Linie hell).
"""
import math
import os
import random
import re

B, H = 160, 120                       # Bildformat 4:3
X0, Y0, X1, Y1 = 12, 12, 148, 108     # Schnittausschnitt
SW = 1.4                              # einheitliche Strichstärke

# Materialfamilien: (Linienfarbe, Flächenfarbe)
INK = "#2b2f33"      # Linien: Dunkelgrau
TINT = "#fafafa"     # Hintergrund: nahezu weiß
FAM = {k: (INK, TINT) for k in ("stein", "ton", "holz", "daemm", "metall", "glas", "dicht", "neutral")}
FAM["neutral"] = ("#8b9097", "#fafafa")   # Platzhalter: helleres Grau


def f(x):
    s = ("%.1f" % x).rstrip("0").rstrip(".")
    return s if s != "-0" else "0"


class Z:
    """kleiner Zeichner: sammelt SVG-Elemente"""

    def __init__(self, ink, tint, rnd):
        self.ink, self.tint, self.r = ink, tint, rnd
        self.out = []

    def add(self, s):
        self.out.append(s)

    def path(self, d, fill="none", sw=SW, op=None, extra=""):
        o = ' opacity="%s"' % op if op else ""
        self.add('<path d="%s" fill="%s" stroke-width="%s"%s%s/>' % (d, fill, sw, o, extra))

    def line(self, x1, y1, x2, y2, sw=SW, op=None):
        self.path("M%s %sL%s %s" % (f(x1), f(y1), f(x2), f(y2)), sw=sw, op=op)

    def circle(self, x, y, r, fill="none", sw=SW, op=None):
        o = ' opacity="%s"' % op if op else ""
        self.add('<circle cx="%s" cy="%s" r="%s" fill="%s" stroke-width="%s"%s/>' % (f(x), f(y), f(r), fill, sw, o))

    def rect(self, x, y, w, h, rx=0, fill="none", sw=SW, op=None):
        o = ' opacity="%s"' % op if op else ""
        self.add('<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s" stroke-width="%s"%s/>' % (f(x), f(y), f(w), f(h), f(rx), fill, sw, o))

    def poly(self, pts, fill="none", sw=SW, op=None, closed=True):
        d = "M" + "L".join("%s %s" % (f(x), f(y)) for x, y in pts) + ("Z" if closed else "")
        self.path(d, fill=fill, sw=sw, op=op)

    def dots(self, n, rmin=.7, rmax=1.6, op=.75, box=(X0 + 3, Y0 + 3, X1 - 3, Y1 - 3)):
        """gefüllte Punkte in drei Größenstufen (je Stufe ein Pfad)"""
        stufen = {}
        for _ in range(n):
            x = self.r.uniform(box[0], box[2]); y = self.r.uniform(box[1], box[3])
            r = round(self.r.uniform(rmin, rmax) * 2) / 2.0
            stufen.setdefault(r, []).append((x, y))
        for r, pts in sorted(stufen.items()):
            d = "".join("M%s %sh.01" % (f(x), f(y)) for x, y in pts)
            self.add('<path d="%s" fill="none" stroke-width="%s" stroke-linecap="round" opacity="%s" class="p"/>' % (d, f(r * 2), op))

    def welle(self, y, amp, lam, phase, x0=X0 - 4, x1=X1 + 4, sw=SW, op=None):
        pts = []
        x = x0
        while x <= x1:
            pts.append((x, y + amp * math.sin((x + phase) * 2 * math.pi / lam)))
            x += 4
        d = "M" + "L".join("%s %s" % (f(a), f(b)) for a, b in pts)
        self.path(d, sw=sw, op=op)

    def faser(self, n, lmin, lmax, winkel=(-25, 25), kruemmung=3.0, op=.85):
        d = ""
        for _ in range(n):
            x = self.r.uniform(X0, X1); y = self.r.uniform(Y0, Y1)
            l = self.r.uniform(lmin, lmax); a = math.radians(self.r.uniform(*winkel))
            dx, dy = math.cos(a) * l, math.sin(a) * l
            k = self.r.uniform(-kruemmung, kruemmung)
            mx, my = x + dx / 2 - dy / l * k, y + dy / 2 + dx / l * k
            d += "M%s %sQ%s %s %s %s" % (f(x), f(y), f(mx), f(my), f(x + dx), f(y + dy))
        self.path(d, op=op)

    def schraffur(self, abstand, winkel=45, sw=SW, op=None, box=(X0, Y0, X1, Y1)):
        """Schraffurlinien (klassische Plansignatur); winkel 45 = von links unten nach rechts oben"""
        x0, y0, x1, y1 = box
        d = ""
        t = math.tan(math.radians(winkel))
        h = y1 - y0
        k = -h / t if t else 0
        off = x0 + k
        x = off
        n = 0
        while x < x1 + 2 and n < 400:
            if t:
                d += "M%s %sL%s %s" % (f(x), f(y1), f(x + h / t), f(y0))
            x += abstand
            n += 1
        self.path(d, sw=sw, op=op)

    def hex_zellen(self, r, ox=0, oy=0, sw=SW, op=None, jitter=0, innen=None):
        d = ""
        dx = r * math.sqrt(3); dy = r * 1.5
        row = 0
        y = Y0 - r + oy
        while y < Y1 + r:
            x = X0 - dx + (dx / 2 if row % 2 else 0) + ox
            while x < X1 + dx:
                pts = []
                for i in range(6):
                    a = math.radians(60 * i - 30)
                    j = self.r.uniform(-jitter, jitter) if jitter else 0
                    pts.append((x + (r + j) * math.cos(a), y + (r + j) * math.sin(a)))
                d += "M" + "L".join("%s %s" % (f(a), f(b)) for a, b in pts) + "Z"
                x += dx
            y += dy
            row += 1
        self.path(d, sw=sw, op=op)

    def kreise_gepackt(self, r, sw=SW, op=None, innen=None):
        dx = 2 * r; dy = r * math.sqrt(3)
        row = 0
        y = Y0
        d = ""
        pts = []
        while y < Y1 + r:
            x = X0 + (r if row % 2 else 0)
            while x < X1 + r:
                pts.append((x, y))
                x += dx
            y += dy
            row += 1
        for x, y in pts:
            self.add('<circle cx="%s" cy="%s" r="%s" fill="none" stroke-width="%s"%s/>' % (f(x), f(y), f(r - .6), f(sw), (' opacity="%s"' % op) if op else ""))
        if innen:
            d = "".join("M%s %sh.01" % (f(x), f(y)) for x, y in pts)
            self.add('<path d="%s" fill="none" stroke-width="%s" stroke-linecap="round" class="p"/>' % (d, f(innen)))

    def unregelmaessig(self, x, y, r, ecken=6):
        pts = []
        for i in range(ecken):
            a = 2 * math.pi * i / ecken + self.r.uniform(-.3, .3)
            rr = r * self.r.uniform(.65, 1.15)
            pts.append((x + rr * math.cos(a), y + rr * math.sin(a)))
        return pts

    def koerner(self, n, rmin=3, rmax=6.5, op=.9):
        """kleine unregelmäßige Zuschlagskörner (Umriss), ohne starke Überlappung"""
        platz = []
        versuche = 0
        while len(platz) < n and versuche < 600:
            versuche += 1
            x = self.r.uniform(X0 + 6, X1 - 6); y = self.r.uniform(Y0 + 6, Y1 - 6); r = self.r.uniform(rmin, rmax)
            if all((x - a) ** 2 + (y - b) ** 2 > (r + c + 3) ** 2 for a, b, c in platz):
                platz.append((x, y, r))
        for x, y, r in platz:
            self.poly(self.unregelmaessig(x, y, r, self.r.choice([5, 6, 7])), op=op)
        return platz

    def poren(self, n, rmin=2, rmax=5.5, op=.9, platz_abstand=1.6):
        platz = []
        versuche = 0
        while len(platz) < n and versuche < 2500:
            versuche += 1
            r = self.r.uniform(rmin, rmax)
            x = self.r.uniform(X0 + r + 2, X1 - r - 2); y = self.r.uniform(Y0 + r + 2, Y1 - r - 2)
            if all((x - a) ** 2 + (y - b) ** 2 > (r + c + platz_abstand) ** 2 for a, b, c in platz):
                platz.append((x, y, r))
        for x, y, r in platz:
            self.circle(x, y, r, op=op)
        return platz

    def mauerwerk(self, w, h, versatz=.5, y0=Y0, y1=Y1, x0=X0, x1=X1, sw=SW, op=None):
        """Läuferverband: Lagerfugen und versetzte Stoßfugen"""
        d = ""
        y = y0
        row = 0
        while y <= y1 + .1:
            d += "M%s %sL%s %s" % (f(x0), f(y), f(x1), f(y))
            if y < y1 - .1:
                x = x0 + (w * versatz if row % 2 else 0)
                while x <= x1 + .1:
                    if x > x0 + .1:
                        d += "M%s %sL%s %s" % (f(x), f(y), f(x), f(min(y + h, y1)))
                    x += w
            y += h
            row += 1
        self.path(d, sw=sw, op=op)

    def holzmaserung(self, n, amp=2.5, lam=60, knoten=(), op=.9):
        gap = (Y1 - Y0) / (n + 1)
        for i in range(1, n + 1):
            y = Y0 + gap * i + self.r.uniform(-1, 1)
            self.welle(y, amp * self.r.uniform(.5, 1.2), lam * self.r.uniform(.8, 1.3), self.r.uniform(0, lam), op=op)
        for kx, ky, kr in knoten:
            for i in range(3):
                self.add('<ellipse cx="%s" cy="%s" rx="%s" ry="%s" fill="none" stroke-width="%s"/>' % (f(kx), f(ky), f(kr * (1 + i * .7) * 1.4), f(kr * (1 + i * .7) * .7), SW))


# --------------------------------------------------------------------------------------------
# Zeichnungen je Material
# --------------------------------------------------------------------------------------------

def normalbeton(z):
    z.dots(95, .5, 1.3, .8)
    z.koerner(15, 2.6, 6.2)


def stahlbeton(z):
    z.dots(70, .5, 1.2, .75)
    z.koerner(8, 2.6, 5.2, .8)
    # Bügel und Längsbewehrung im Querschnitt
    z.rect(30, 30, 100, 62, rx=4, sw=1.1, op=.9)
    for x in (42, 66, 90, 114):
        z.circle(x, 82, 3.6, fill=z.ink, sw=1)
    for x in (42, 114):
        z.circle(x, 40, 3.6, fill=z.ink, sw=1)


def leichtbetonstein_bims(z):
    z.mauerwerk(68, 48, versatz=.5, y0=Y0, y1=Y1)
    for _ in range(26):
        x = z.r.uniform(X0 + 4, X1 - 4); y = z.r.uniform(Y0 + 4, Y1 - 4)
        rx, ry = z.r.uniform(1.8, 4.8), z.r.uniform(1.2, 3.2)
        z.add('<ellipse cx="%s" cy="%s" rx="%s" ry="%s" fill="none" stroke-width="1.1" transform="rotate(%s %s %s)"/>' % (f(x), f(y), f(rx), f(ry), f(z.r.uniform(0, 180)), f(x), f(y)))
    z.dots(35, .5, 1, .7)


def leichtbetonstein_blaehton(z):
    z.mauerwerk(68, 48, versatz=.5)
    for gx in range(6):
        for gy in range(4):
            x = X0 + 12 + gx * 22 + z.r.uniform(-3, 3) + (11 if gy % 2 else 0)
            y = Y0 + 12 + gy * 24 + z.r.uniform(-3, 3)
            if x < X1 - 5:
                z.circle(x, y, z.r.uniform(4.2, 5.8), sw=1.2)
                z.circle(x + z.r.uniform(-1, 1), y + z.r.uniform(-1, 1), 1.2, fill=z.ink, sw=0)


def betondachstein(z):
    # Dachsteinprofil: überlappende Reihen mit leichter Wölbung
    for i in range(5):
        y = Y0 + 6 + i * 20
        d = "M%s %s" % (X0 - 2, y + 10)
        x = X0 - 2
        while x < X1 + 2:
            d += "q9 -9 18 0"
            x += 18
        z.path(d)
        z.line(X0, y + 10, X1, y + 10, sw=1, op=.5)
    z.dots(55, .5, 1, .7)


def porenbeton(z):
    z.poren(62, 1.8, 5.8)
    z.dots(30, .4, .8, .6)


def hochlochziegel(z):
    w, h = 34, 24
    z.mauerwerk(w, h, versatz=.5, y0=Y0 + 2, y1=Y0 + 2 + 4 * h)
    # Lochung (Schlitze) in jedem Stein
    for r in range(4):
        y = Y0 + 2 + r * h
        x = X0 + (w * .5 if r % 2 else 0) - (w if r % 2 else 0)
        while x < X1:
            for k in (.28, .56, .8):
                sx = x + w * k
                if X0 + 2 < sx < X1 - 2:
                    z.rect(sx - 1.6, y + 5, 3.2, h - 10, rx=1.6, sw=1)
            x += w


def klinker(z):
    z.mauerwerk(32, 14, versatz=.5, y0=Y0 + 2, y1=Y0 + 2 + 7 * 14)
    z.dots(40, .4, .8, .45)


def dachziegel(z):
    # Biberschwanz-Schuppen
    for r in range(8):
        y = Y0 + 4 + r * 13
        x = X0 - (9 if r % 2 else 0)
        d = ""
        while x < X1 + 9:
            d += "M%s %sv6a9 9 0 0 0 18 0v-6" % (f(x), f(y))
            x += 18
        z.path(d, sw=1.3)


def kalksandstein(z):
    d = ""
    s = 17
    x = X0
    while x <= X1 + .1:
        d += "M%s %sL%s %s" % (f(x), Y0, f(x), Y1)
        x += s
    y = Y0
    while y <= Y1 + .1:
        d += "M%s %sL%s %s" % (X0, f(y), X1, f(y))
        y += s
    z.path(d)
    z.dots(120, .4, .8, .55)


def brettsperrholz(z):
    n = 5
    h = (Y1 - Y0) / n
    for i in range(n):
        y = Y0 + i * h
        z.line(X0, y, X1, y, sw=1.6)
        if i % 2 == 0:
            for k in (1, 2):
                z.welle(y + h * k / 3.0, 1.2, 50, z.r.uniform(0, 50), sw=1.1, op=.8)
        else:
            x = X0 + 14
            while x < X1:
                z.line(x, y, x, y + h, sw=1.2)
                z.circle(x - 7, y + h / 2, 2.2, sw=.9, op=.8)
                x += 14
    z.line(X0, Y1, X1, Y1, sw=1.6)


def brettschichtholz(z):
    n = 5
    h = (Y1 - Y0) / n
    for i in range(n):
        y = Y0 + i * h
        z.line(X0, y, X1, y, sw=1.6)
        z.welle(y + h * .35, 1.4, 55, z.r.uniform(0, 55), sw=1.1, op=.8)
        z.welle(y + h * .7, 1.2, 45, z.r.uniform(0, 45), sw=1.1, op=.7)
        sx = X0 + 40 + z.r.uniform(0, 70)
        z.line(sx, y, sx, y + h, sw=1.1)
    z.line(X0, Y1, X1, Y1, sw=1.6)


def konstruktionsvollholz(z):
    cx, cy = 80, 60
    for i in range(1, 8):
        r = i * 6.2
        z.add('<ellipse cx="%s" cy="%s" rx="%s" ry="%s" fill="none" stroke-width="1.2" opacity="%s"/>' % (f(cx + i * .4), f(cy - i * .3), f(r * 1.12), f(r * .98), f(.95 - i * .05)))
    for a in (20, 100, 200, 300):
        r = math.radians(a)
        z.line(cx + math.cos(r) * 8, cy + math.sin(r) * 8, cx + math.cos(r) * 46, cy + math.sin(r) * 40, sw=.9, op=.6)
    z.rect(X0 + 12, Y0 + 4, X1 - X0 - 24, Y1 - Y0 - 8, rx=3, sw=1.2)


def massivholz_nadel(z):
    z.holzmaserung(11, amp=2.8, lam=70, knoten=[(46, 52, 2.2), (112, 78, 1.8)])


def massivholz_laub(z):
    z.holzmaserung(17, amp=1.8, lam=48)
    d = ""
    for _ in range(70):
        x = z.r.uniform(X0 + 3, X1 - 3); y = z.r.uniform(Y0 + 3, Y1 - 3)
        d += "M%s %sh%s" % (f(x), f(y), f(z.r.uniform(2, 5)))
    z.path(d, sw=1, op=.7)


def osb(z):
    for _ in range(46):
        x = z.r.uniform(X0 + 4, X1 - 4); y = z.r.uniform(Y0 + 4, Y1 - 4)
        w, h = z.r.uniform(14, 26), z.r.uniform(2.6, 4.2)
        a = z.r.uniform(-55, 55) if z.r.random() > .4 else z.r.uniform(-12, 12)
        z.add('<rect x="%s" y="%s" width="%s" height="%s" rx="1" fill="none" stroke-width="1.1" transform="rotate(%s %s %s)" opacity=".9"/>' % (f(x - w / 2), f(y - h / 2), f(w), f(h), f(a), f(x), f(y)))


def spanplatte(z):
    d = ""
    for _ in range(150):
        x = z.r.uniform(X0 + 2, X1 - 2); y = z.r.uniform(Y0 + 2, Y1 - 2)
        l = z.r.uniform(2, 6); a = math.radians(z.r.uniform(0, 180))
        d += "M%s %sl%s %s" % (f(x), f(y), f(math.cos(a) * l), f(math.sin(a) * l))
    z.path(d, sw=1.5, op=.8)
    z.dots(40, .4, .8, .6)


def sperrholz(z):
    n = 7
    h = (Y1 - Y0) / n
    for i in range(n):
        y = Y0 + i * h
        z.line(X0, y, X1, y, sw=1.3)
        if i % 2 == 0:
            z.welle(y + h / 2, 1.0, 40, z.r.uniform(0, 40), sw=1, op=.8)
        else:
            d = ""
            x = X0 + 4
            while x < X1:
                d += "M%s %sh7" % (f(x), f(y + h / 2))
                x += 12
            z.path(d, sw=1.4, op=.8)
    z.line(X0, Y1, X1, Y1, sw=1.3)


def gipskarton(z):
    # zwei übereinanderliegende Platten, Kartonschichten oben und unten, Gipskern punktiert
    for (ya, yb) in ((Y0 + 6, Y0 + 46), (Y0 + 52, Y1 - 6)):
        z.rect(X0 + 4, ya, X1 - X0 - 8, yb - ya, rx=3, sw=1.4)
        z.line(X0 + 4, ya + 4, X1 - 4, ya + 4, sw=1.1, op=.8)
        z.line(X0 + 4, yb - 4, X1 - 4, yb - 4, sw=1.1, op=.8)
        z.dots(32, .4, .9, .7, box=(X0 + 8, ya + 8, X1 - 8, yb - 8))


def gipsfaserplatte(z):
    d = ""
    for _ in range(95):
        x = z.r.uniform(X0 + 3, X1 - 3); y = z.r.uniform(Y0 + 3, Y1 - 3)
        l = z.r.uniform(4, 11); a = math.radians(z.r.uniform(-30, 30))
        d += "M%s %sl%s %s" % (f(x), f(y), f(math.cos(a) * l), f(math.sin(a) * l))
    z.path(d, sw=1.1, op=.85)
    z.dots(50, .4, .8, .6)
    z.rect(X0 + 4, Y0 + 4, X1 - X0 - 8, Y1 - Y0 - 8, rx=3, sw=1.2, op=.8)


def kalkgipsinnenputz(z):
    z.dots(150, .4, .9, .7)
    z.welle(Y0 + 7, 1.5, 38, 0, sw=1.6)


def kalkzementputz(z):
    z.dots(100, .5, 1.3, .75)
    z.koerner(5, 2, 3.6, .7)
    z.welle(Y0 + 7, 1.2, 30, 8, sw=1.6)


def zementestrich(z):
    z.dots(90, .5, 1.2, .75)
    d = "M%s %sL%s %s" % (X0, Y0 + 24, X1, Y0 + 24)
    z.path(d, sw=1.6)
    z.line(X0, Y0 + 54, X1, Y0 + 54, sw=1.1, op=.6)
    x = X0 + 4
    d = ""
    while x < X1:
        d += "M%s %sh6" % (f(x), Y0 + 38)
        x += 12
    z.path(d, sw=1.1, op=.7)


def calciumsulfatestrich(z):
    z.dots(70, .4, .8, .65)
    z.schraffur(7, 45, sw=1, op=.45)
    z.line(X0, Y0 + 24, X1, Y0 + 24, sw=1.6)


def keramikfliese(z):
    w, h = 44, 44
    for i in range(3):
        for j in range(3):
            x = X0 + 2 + i * 45; y = Y0 + 2 + j * 32
            if i < 3:
                z.rect(x, y, 41, 28, rx=2, sw=1.3)
                z.line(x + 7, y + 20, x + 18, y + 9, sw=1, op=.55)
                z.line(x + 11, y + 22, x + 22, y + 11, sw=1, op=.4)


def faserzement(z):
    z.schraffur(9, 60, sw=1, op=.55)
    d = ""
    for _ in range(80):
        x = z.r.uniform(X0 + 3, X1 - 3); y = z.r.uniform(Y0 + 3, Y1 - 3)
        d += "M%s %sh%s" % (f(x), f(y), f(z.r.uniform(3, 8)))
    z.path(d, sw=1.1, op=.8)
    z.rect(X0 + 4, Y0 + 4, X1 - X0 - 8, Y1 - Y0 - 8, rx=3, sw=1.2, op=.8)


def _wollwellen(z, zeilen, amp, lam, sw=SW):
    gap = (Y1 - Y0 + 12) / zeilen
    for i in range(zeilen):
        z.welle(Y0 - 4 + gap * i + 4, amp, lam * z.r.uniform(.9, 1.1), z.r.uniform(0, lam), sw=sw, op=.9)


def mineralwolle(z):
    _wollwellen(z, 9, 5.5, 34)


def steinwolle(z):
    _wollwellen(z, 12, 3.8, 24)
    z.dots(30, .4, .7, .5)


def glaswolle(z):
    # feine Zickzack-Fasern
    gap = 8
    y = Y0 + 2
    while y < Y1:
        d = "M%s %s" % (X0 - 4, y)
        x = X0 - 4
        up = True
        while x < X1 + 4:
            x += z.r.uniform(5, 8)
            d += "L%s %s" % (f(x), f(y + (-3.2 if up else 3.2)))
            up = not up
        z.path(d, sw=1.1, op=.9)
        y += gap


def holzfaserdaemmung(z):
    z.faser(130, 9, 17, (-28, 28), 2.0, .9)


def zellulose(z):
    d = ""
    for _ in range(85):
        x = z.r.uniform(X0 + 3, X1 - 3); y = z.r.uniform(Y0 + 3, Y1 - 3)
        r = z.r.uniform(2.2, 4.8)
        a = z.r.uniform(0, 6.28)
        d += "M%s %sc%s %s %s %s %s %s" % (f(x), f(y), f(r * 2 * math.cos(a)), f(-r * 2), f(r * 2.4), f(r * 2 * math.sin(a)), f(r * 3), f(r * .6 * math.cos(a + 1)))
    z.path(d, sw=1.2, op=.85)
    z.dots(40, .4, .8, .5)


def hanfdaemmung(z):
    for _ in range(26):
        x = z.r.uniform(X0 - 10, X1 - 20); y = z.r.uniform(Y0 + 4, Y1 - 4)
        l = z.r.uniform(40, 80); a = math.radians(z.r.uniform(-35, 35))
        amp = z.r.uniform(2, 5); lam = z.r.uniform(16, 28)
        pts = []
        t = 0
        while t <= l:
            px = x + t * math.cos(a) - amp * math.sin(t * 2 * math.pi / lam) * math.sin(a)
            py = y + t * math.sin(a) + amp * math.sin(t * 2 * math.pi / lam) * math.cos(a)
            pts.append((px, py))
            t += 4
        z.poly(pts, closed=False, op=.85)


def flachsdaemmung(z):
    d = ""
    for _ in range(46):
        x = z.r.uniform(X0 - 6, X1 - 30); y = z.r.uniform(Y0 + 2, Y1 - 2)
        l = z.r.uniform(40, 90); a = math.radians(z.r.uniform(-14, 14))
        d += "M%s %sQ%s %s %s %s" % (f(x), f(y), f(x + l / 2), f(y + math.tan(a) * l / 2 + z.r.uniform(-1.5, 1.5)), f(x + l), f(y + math.tan(a) * l))
    z.path(d, sw=1.1, op=.85)


def schafwolle(z):
    d = ""
    for _ in range(46):
        x = z.r.uniform(X0 + 6, X1 - 6); y = z.r.uniform(Y0 + 6, Y1 - 6)
        r = z.r.uniform(3, 5.5)
        d += "M%s %sc%s %s %s %s %s %sc%s %s %s %s %s %s" % (f(x), f(y), f(r), f(-r * 1.4), f(r * 2.2), f(-r * .3), f(r * 1.4), f(r * .8), f(-r * .2), f(r * 1.6), f(-r * 2.2), f(r * 1.2), f(-r * 1.6), f(-r * .6))
    z.path(d, sw=1.2, op=.85)


def kork(z):
    # Korkgranulat: dicht gepackte, rundliche Körner unterschiedlicher Größe mit Fugen-Punkten
    platz = []
    versuche = 0
    while len(platz) < 90 and versuche < 4000:
        versuche += 1
        rx = z.r.uniform(3.2, 6.2); ry = rx * z.r.uniform(.62, .95)
        x = z.r.uniform(X0 + 2, X1 - 2); y = z.r.uniform(Y0 + 2, Y1 - 2)
        if all((x - a) ** 2 + (y - b) ** 2 > (rx + c + .5) ** 2 for a, b, c in platz):
            platz.append((x, y, rx))
            z.add('<ellipse cx="%s" cy="%s" rx="%s" ry="%s" fill="none" stroke-width="1.2" transform="rotate(%s %s %s)"/>' % (f(x), f(y), f(rx), f(ry), f(z.r.uniform(0, 180)), f(x), f(y)))
    z.dots(50, .4, .8, .65)


def eps(z):
    z.kreise_gepackt(8.2, sw=1.3, innen=1.6)


def xps(z):
    z.hex_zellen(5.6, sw=1.1, op=.9)


def pur(z):
    z.poren(70, 1.6, 4.6, op=.9, platz_abstand=.9)


def pir(z):
    # längliche, ausgerichtete Zellen
    row = 0
    y = Y0 + 5
    while y < Y1 + 5:
        x = X0 + (5 if row % 2 else 0)
        while x < X1 + 5:
            z.add('<ellipse cx="%s" cy="%s" rx="3.1" ry="5.6" fill="none" stroke-width="1.2"/>' % (f(x), f(y)))
            x += 10
        y += 10.5
        row += 1


def schaumglas(z):
    z.hex_zellen(10, jitter=.6, sw=1.3)
    # kleiner Glanzbogen je Zelle
    dx = 10 * math.sqrt(3); dy = 15
    row = 0
    y = Y0 - 10
    d = ""
    while y < Y1 + 10:
        x = X0 - dx + (dx / 2 if row % 2 else 0)
        while x < X1 + dx:
            d += "M%s %sq3 -2.4 6 0" % (f(x - 3), f(y - 2))
            x += dx
        y += dy
        row += 1
    z.path(d, sw=1, op=.55)


def baustahl(z):
    # I-Profil im Schnitt, mit Stahl-Schraffur
    pts = [(48, 24), (112, 24), (112, 38), (86, 38), (86, 82), (112, 82), (112, 96), (48, 96), (48, 82), (74, 82), (74, 38), (48, 38)]
    z.add('<clipPath id="s"><path d="M' + "L".join("%s %s" % p for p in pts) + 'Z"/></clipPath>')
    z.add('<g clip-path="url(#s)">')
    z.schraffur(5, 45, sw=1.1)
    z.add('</g>')
    z.poly(pts, sw=1.6)


def stahlblech(z):
    # Trapezprofilblech mit Schraffur im Querschnitt
    d = "M%s 74" % (X0 - 2)
    x = X0 - 2
    while x < X1 + 20:
        d += "l8 -26l14 0l8 26l14 0"
        x += 44
    z.add('<clipPath id="t"><rect x="%s" y="%s" width="%s" height="%s"/></clipPath>' % (X0, Y0, X1 - X0, Y1 - Y0))
    z.add('<g clip-path="url(#t)">')
    z.path(d, sw=2.2)
    z.path(d.replace(" 74", " 84", 1), sw=2.2)
    z.add('</g>')
    z.schraffur(6, 45, sw=1, op=.5, box=(X0, 92, X1, Y1))


def aluminium(z):
    z.schraffur(4.6, 45, sw=1, op=.8)
    z.dots(40, .5, .9, .7)


def zinkblech(z):
    z.schraffur(5, 45, sw=1, op=.7)
    for x in (X0 + 34, X0 + 68, X0 + 102):
        z.rect(x - 3.5, Y0 + 3, 7, Y1 - Y0 - 6, rx=3, fill="#ffffff", sw=1.5)


def glas(z):
    z.rect(X0 + 14, Y0 + 8, X1 - X0 - 28, Y1 - Y0 - 16, rx=3, sw=1.6)
    z.rect(X0 + 19, Y0 + 13, X1 - X0 - 38, Y1 - Y0 - 26, rx=2, sw=1, op=.5)
    for off in (0, 11):
        z.line(X0 + 38 + off, Y1 - 22, X0 + 66 + off, Y0 + 22, sw=1.2, op=.8)
    z.line(X0 + 80, Y1 - 22, X0 + 100, Y0 + 30, sw=1.2, op=.55)


def naturstein_hart(z):
    # Kristalline Körner (Granit): polygonale Körner mit Sprenkeln
    z.hex_zellen(11, jitter=3.2, sw=1.3, op=.95)
    z.dots(60, .5, 1.2, .75)


def naturstein_weich(z):
    # geschichteter Sedimentstein
    y = Y0 + 6
    while y < Y1:
        z.welle(y, z.r.uniform(.8, 1.6), z.r.uniform(60, 90), z.r.uniform(0, 90), sw=1.3)
        y += z.r.uniform(9, 15)
    z.dots(45, .4, .9, .6)
    for _ in range(5):
        x = z.r.uniform(X0 + 10, X1 - 10); y = z.r.uniform(Y0 + 10, Y1 - 10)
        z.circle(x, y, z.r.uniform(1.8, 3), sw=1, op=.8)


def schiefer(z):
    y = Y0 - 6
    while y < Y1 + 12:
        d = "M%s %sL%s %s" % (X0 - 2, f(y + 8), X1 + 2, f(y - 4))
        z.path(d, sw=1.4)
        # kurze Spaltflächen-Querlinien
        for _ in range(3):
            x = z.r.uniform(X0, X1)
            z.line(x, y - 4 + (x - X0) * -.09, x + 7, y - 4 + (x - X0) * -.09 + 3, sw=1, op=.6)
        y += 11


def bitumenbahn(z):
    z.rect(X0 + 4, Y0 + 14, X1 - X0 - 8, 30, rx=4, fill="#e3e4e6", sw=0)
    z.rect(X0 + 4, Y0 + 14, X1 - X0 - 8, 30, rx=4, sw=1.6)
    # Einlage als Gitter
    d = ""
    x = X0 + 10
    while x < X1 - 6:
        d += "M%s %sL%s %s" % (f(x), Y0 + 20, f(x), Y0 + 38)
        x += 10
    z.path(d, sw=1, op=.7)
    z.line(X0 + 6, Y0 + 29, X1 - 6, Y0 + 29, sw=1, op=.7)
    z.dots(48, .5, 1, .8, box=(X0 + 8, Y0 + 52, X1 - 8, Y1 - 6))
    z.line(X0 + 4, Y0 + 52, X1 - 4, Y0 + 52, sw=1.2, op=.7)


def epdm(z):
    d = "M%s %s" % (X0 - 2, Y0 + 36)
    x = X0 - 2
    while x < X1 + 6:
        d += "q6 -9 12 0t12 0"
        x += 24
    z.path(d, sw=4.6, op=.9)
    z.add('<path d="%s" fill="none" stroke="#ffffff" stroke-width="1.2" opacity=".7"/>' % d)
    z.schraffur(9, 45, sw=1, op=.5, box=(X0, Y0 + 54, X1, Y1))
    z.line(X0, Y0 + 54, X1, Y0 + 54, sw=1.2, op=.7)


PLAN = {
    # id: (familie, funktion, Bezeichnung)
    "normalbeton": ("stein", normalbeton, "Beton"),
    "stahlbeton": ("stein", stahlbeton, "Stahlbeton"),
    "hochlochziegel": ("ton", hochlochziegel, "Hochlochziegel"),
    "porenbeton": ("stein", porenbeton, "Porenbeton"),
    "brettsperrholz": ("holz", brettsperrholz, "Brettsperrholz"),
    "brettschichtholz": ("holz", brettschichtholz, "Brettschichtholz"),
    "konstruktionsvollholz": ("holz", konstruktionsvollholz, "Konstruktionsvollholz"),
    "baustahl": ("metall", baustahl, "Baustahl"),
    "mineralwolle": ("daemm", mineralwolle, "Mineralwolle"),
    "eps": ("daemm", eps, "EPS"),
    "holzfaserdaemmung": ("daemm", holzfaserdaemmung, "Holzfaserdämmung"),
    "zellulose": ("daemm", zellulose, "Zellulosedämmung"),
    "hanfdaemmung": ("daemm", hanfdaemmung, "Hanfdämmung"),
    "klinker": ("ton", klinker, "Klinker"),
    "gipskarton": ("stein", gipskarton, "Gipskarton"),
    "osb": ("holz", osb, "OSB"),
    "dachziegel": ("ton", dachziegel, "Dachziegel"),
    "leichtbetonstein_bims": ("stein", leichtbetonstein_bims, "Bimsstein"),
    "leichtbetonstein_blaehton": ("stein", leichtbetonstein_blaehton, "Blähtonstein"),
    "kalksandstein": ("stein", kalksandstein, "Kalksandstein"),
    "massivholz_nadel": ("holz", massivholz_nadel, "Nadelholz"),
    "massivholz_laub": ("holz", massivholz_laub, "Laubholz"),
    "glaswolle": ("daemm", glaswolle, "Glaswolle"),
    "steinwolle": ("daemm", steinwolle, "Steinwolle"),
    "xps": ("daemm", xps, "XPS"),
    "pur": ("daemm", pur, "PUR"),
    "pir": ("daemm", pir, "PIR"),
    "flachsdaemmung": ("daemm", flachsdaemmung, "Flachsdämmung"),
    "kork": ("daemm", kork, "Kork"),
    "schaumglas": ("daemm", schaumglas, "Schaumglas"),
    "schafwolle": ("daemm", schafwolle, "Schafwolle"),
    "faserzement": ("stein", faserzement, "Faserzement"),
    "aluminium": ("metall", aluminium, "Aluminium"),
    "stahlblech": ("metall", stahlblech, "Stahlblech"),
    "naturstein_hart": ("stein", naturstein_hart, "Naturstein (hart)"),
    "naturstein_weich": ("stein", naturstein_weich, "Naturstein (weich)"),
    "keramikfliese": ("ton", keramikfliese, "Keramikfliese"),
    "kalkzementputz": ("stein", kalkzementputz, "Kalkzementputz"),
    "glas": ("glas", glas, "Glas"),
    "gipsfaserplatte": ("stein", gipsfaserplatte, "Gipsfaserplatte"),
    "spanplatte": ("holz", spanplatte, "Spanplatte"),
    "sperrholz": ("holz", sperrholz, "Sperrholz"),
    "zementestrich": ("stein", zementestrich, "Zementestrich"),
    "calciumsulfatestrich": ("stein", calciumsulfatestrich, "Calciumsulfatestrich"),
    "kalkgipsinnenputz": ("stein", kalkgipsinnenputz, "Kalkgipsputz"),
    "betondachstein": ("stein", betondachstein, "Betondachstein"),
    "schiefer": ("stein", schiefer, "Schiefer"),
    "zinkblech": ("metall", zinkblech, "Zinkblech"),
    "bitumenbahn": ("dicht", bitumenbahn, "Bitumenbahn"),
    "epdm": ("dicht", epdm, "EPDM-Folie"),
}


def platzhalter(z):
    # neutral: drei angedeutete Schichten (Marke) als Umriss
    for i, (dx, y) in enumerate(((0, 40), (10, 56), (0, 72))):
        z.poly([(52 + dx + 8, y), (104 + dx + 8, y), (96 + dx + 8, y + 18), (44 + dx + 8, y + 18)], sw=1.4, op=.8)


def normalisiere(inhalt):
    """Vereinheitlicht Linienstärken (fein/normal/kräftig) und Tonwerte (voll/hell) aller Linien; Punkte bleiben unverändert."""
    def zeile(m):
        el = m.group(0)
        if "h.01" in el:
            return el                      # Punkte: Durchmesser = Strichbreite, bleibt
        def sw(x):
            v = float(x.group(1))
            if v <= 0:
                return x.group(0)
            return 'stroke-width="%s"' % ("1.1" if v <= 1.15 else "1.4" if v <= 1.5 else "2")
        el = re.sub(r'stroke-width="([\d.]+)"', sw, el)
        def op(x):
            v = float(x.group(1))
            return x.group(0) if v < 0.3 else 'opacity=".55"' if v <= 0.6 else ""
        return re.sub(r'\s?opacity="([\d.]+)"', lambda x: (" " + op(x)).rstrip() if op(x) else "", el)
    return re.sub(r"<(?:path|circle|ellipse|rect|polygon)\b[^>]*/>", zeile, inhalt)


def svg(kennung, fam, zeichne, bezeichnung, seed):
    ink, tint = FAM[fam]
    z = Z(ink, tint, random.Random(seed))
    zeichne(z)
    titel = "Schematische Materialillustration: %s" % bezeichnung
    kopf = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" role="img" aria-labelledby="t">'
            '<title id="t">%s</title>' % (B, H, B, H, titel))
    rahmen = ('<rect width="%d" height="%d" fill="%s"/>' % (B, H, tint) +
              '<clipPath id="c"><rect x="%d" y="%d" width="%d" height="%d" rx="7"/></clipPath>' % (X0, Y0, X1 - X0, Y1 - Y0) +
              '<rect x="%d" y="%d" width="%d" height="%d" rx="7" fill="#ffffff"/>' % (X0, Y0, X1 - X0, Y1 - Y0))
    inhalt = ('<g clip-path="url(#c)" stroke="%s" stroke-linecap="round" stroke-linejoin="round" fill="none">' % ink +
              normalisiere("".join(z.out)).replace('class="p"', 'stroke="%s"' % ink) + '</g>')
    rand = '<rect x="%d" y="%d" width="%d" height="%d" rx="7" fill="none" stroke="%s" stroke-width="1.4"/>' % (X0, Y0, X1 - X0, Y1 - Y0, ink)
    return kopf + rahmen + inhalt + rand + "</svg>\n"


def main():
    ziel = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "img", "schraffuren")
    os.makedirs(ziel, exist_ok=True)
    for kennung, (fam, fn, name) in PLAN.items():
        s = svg(kennung, fam, fn, name, kennung)
        with open(os.path.join(ziel, kennung + ".svg"), "w", encoding="utf-8") as d:
            d.write(s)
    s = svg("platzhalter", "neutral", platzhalter, "Keine Illustration vorhanden", "platzhalter")
    with open(os.path.join(ziel, "platzhalter.svg"), "w", encoding="utf-8") as d:
        d.write(s)
    print("Erzeugt:", len(PLAN) + 1, "Dateien in", os.path.normpath(ziel))


if __name__ == "__main__":
    main()
