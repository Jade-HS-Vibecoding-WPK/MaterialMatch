#!/usr/bin/env python3
"""MaterialMatch – Materialfotos verarbeiten (MaterialMatch 3.6)

Aufruf (aus dem Projektordner):
    python3 tools/bilder_bauen.py --roh <Ordner mit Originalbildern> --meta <bilder_quellen.json>

Was das Programm tut
  1. Liest je Baustoff das Originalbild <roh>/<Kennung>.(jpg|jpeg|png|webp) und die Angaben aus der Meta-Datei.
  2. Schneidet es auf das Seitenverhältnis 4:3 zu (Mitte oder mit "fokus": [x, y] von 0 bis 1), verkleinert es auf 800 × 600 px
     und speichert es als WebP (img/materialfotos/<Kennung>.webp, Qualität 72, bei sehr feinen Strukturen weniger; in der Regel 25 bis 60 KB, höchstens ca. 120 KB).
     Mit --ersetzen werden NUR die Baustoffe bearbeitet, deren Originalbild im Ordner liegt; alle anderen Einträge und Fotos bleiben unverändert
     (so lassen sich einzelne Fotos austauschen, ohne die übrigen neu zu verarbeiten).
  3. Schreibt die zentrale Zuordnung data/bilder.js (window.MATERIALMATCH_BILDER) mit Urheber, Lizenz, Quelle und Alternativtext.

Meta-Datei (JSON): { "<Kennung>": { "titel", "urheber", "lizenz", "lizenz_url", "quelle_name", "quelle_url", "abgerufen", "alt",
                                    "fokus": [0.5, 0.5] (optional), "hinweis" (optional) }, ... }
Es werden nur Bilder aufgenommen, zu denen Urheber, Lizenz und Quelle angegeben sind. Ohne diese Angaben wird kein Bild verwendet.
Die Schraffuren (img/schraffuren) werden nicht verändert.
"""
import argparse, json, os, sys
from PIL import Image

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIEL = os.path.join(PROJ, "img", "materialfotos")
B, H = 800, 600
PFLICHT = ["urheber", "lizenz", "quelle_url", "quelle_name", "alt"]

def zuschneiden(bild, fokus):
    w, h = bild.size
    soll = B / H
    if w / h > soll:                      # zu breit: Seiten abschneiden
        nw = int(round(h * soll)); x0 = int(round((w - nw) * fokus[0])); box = (x0, 0, x0 + nw, h)
    else:                                  # zu hoch: oben und unten abschneiden
        nh = int(round(w / soll)); y0 = int(round((h - nh) * fokus[1])); box = (0, y0, w, y0 + nh)
    return bild.crop(box).resize((B, H), Image.LANCZOS)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--roh", required=True); ap.add_argument("--meta", required=True)
    ap.add_argument("--ersetzen", action="store_true", help="nur Baustoffe mit Originalbild im Ordner austauschen, übrige Einträge behalten")
    a = ap.parse_args()
    meta = json.load(open(a.meta, encoding="utf-8"))
    os.makedirs(ZIEL, exist_ok=True)
    bilder = {}; fehlen = []
    alt_datei = os.path.join(PROJ, "data", "bilder.js")
    if a.ersetzen and os.path.exists(alt_datei):
        txt = open(alt_datei, encoding="utf-8").read()
        bilder = json.loads(txt[txt.index("{", txt.index("window.MATERIALMATCH_BILDER")): txt.rindex("}") + 1])["bilder"]
    for mid, m in sorted(meta.items()):
        quelle = next((os.path.join(a.roh, mid + e) for e in (".jpg", ".jpeg", ".png", ".webp") if os.path.exists(os.path.join(a.roh, mid + e))), None)
        luecke = [k for k in PFLICHT if not m.get(k)]
        if a.ersetzen and not quelle:
            continue
        if not quelle or luecke:
            fehlen.append((mid, "Bild fehlt" if not quelle else "Angaben fehlen: " + ", ".join(luecke))); continue
        im = Image.open(quelle).convert("RGB")
        im = zuschneiden(im, m.get("fokus", [0.5, 0.5]))
        datei = mid + ".webp"
        for qualitaet in (72, 64, 56, 48):          # sehr feine Strukturen (z. B. Leichtbeton) werden stärker komprimiert, damit die Datei klein bleibt
            im.save(os.path.join(ZIEL, datei), "WEBP", quality=qualitaet, method=6)
            if os.path.getsize(os.path.join(ZIEL, datei)) <= 120 * 1024: break
        eintrag = {k: m[k] for k in ["urheber", "lizenz", "lizenz_url", "quelle_name", "quelle_url", "titel", "abgerufen", "alt", "version", "original_url", "aufnahmedatum"] if m.get(k)}
        for k in ("lizenz_url", "quelle_url"):
            if eintrag.get(k, "").startswith("http://"): eintrag[k] = "https://" + eintrag[k][7:]   # nur https-Links
        eintrag["datei"] = datei
        eintrag["bearbeitung"] = "auf 4:3 zugeschnitten, auf 800 × 600 px verkleinert, als WebP gespeichert"
        if m.get("hinweis"): eintrag["hinweis"] = m["hinweis"]
        bilder[mid] = eintrag
    inhalt = {"meta": {"titel": "Materialfotos", "stand": "2026-11-19", "format": "WebP 800 × 600 (4:3)",
                       "hinweis": "Beispielfotos typischer Baustoffe aus Wikimedia Commons mit freier Lizenz (CC0, gemeinfrei, CC BY, CC BY-SA); sie zeigen nicht zwingend das in den Berechnungen verwendete Herstellerprodukt."},
              "bilder": bilder}
    with open(os.path.join(PROJ, "data", "bilder.js"), "w", encoding="utf-8") as f:
        f.write("/* MaterialMatch – zentrale Zuordnung Baustoff -> Foto (erzeugt von tools/bilder_bauen.py, nicht von Hand ändern).\n"
                "   Ohne Eintrag zeigt die Anwendung die technische Schraffur (img/schraffuren). */\n")
        f.write("window.MATERIALMATCH_BILDER = " + json.dumps(inhalt, ensure_ascii=False, indent=2) + ";\n")
    print(len(bilder), "Fotos geschrieben,", len(fehlen), "ohne Foto:")
    for mid, grund in fehlen: print("  -", mid, "(" + grund + ")")

if __name__ == "__main__":
    sys.exit(main())
