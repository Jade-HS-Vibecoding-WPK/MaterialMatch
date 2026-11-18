#!/usr/bin/env python3
"""
MaterialMatch – Übernahme von ÖKOBAUDAT-Werten in die Baustoffdatenbank
=========================================================================
Dieses Hilfsprogramm gehört NICHT zur Web-App. Es überträgt Rohdichte,
Flächengewicht und CO2-Kennwerte aus der ÖKOBAUDAT-Originaldatei (Release 2024-II,
CSV mit Punkt als Dezimaltrenner) in data/baustoffe.js, ohne dass Zahlen von
Hand abgetippt werden müssen. Version 0.3.0: 16 Baustoffe (Schritt 2/Datenübernahme);
Version 0.4.0 (Schritt 11): zusätzlich NEUE_BAUSTOFFE, die samt Datenblock neu angelegt
werden. Der Lauf ist wiederholbar: bestehende Blöcke werden nur an den
ÖKOBAUDAT-Zeilen (rohdichte, flaechengewicht, gwp) überschrieben.

Aufruf:
    python3 -I tools/oekobaudat_uebernehmen.py <pfad/zur/oekobaudat.csv>

Was es tut:
  1. liest die CSV (Kodierung cp1252, Trenner ";"),
  2. wählt für jedes Material GENAU EINEN Datensatz (Name + Typ + Eigner),
     bei Mehrdeutigkeit oder fehlendem Datensatz bricht es ab,
  3. schreibt Rohdichte und GWP (Modul A1-A3) als Zeilen in data/baustoffe.js,
  4. erzeugt die Quelleneinträge zwischen den Markern <<OEBD-QUELLEN-...>>,
  5. schreibt einen Auszug mit allen Originalzeilen der verwendeten Datensätze
     nach data/quellen/oekobaudat_2024-II_auszug.csv.

Es erfindet keine Werte: Zahlen werden unverändert aus der CSV übernommen.
Einzige Umrechnung: Bezugsgröße "1000 kg" -> "1 kg" (Division durch 1000).
"""
import csv
import hashlib
import pathlib
import re
import sys

PROJEKT = pathlib.Path(__file__).resolve().parent.parent
DATEI = PROJEKT / "data" / "baustoffe.js"
AUSZUG = PROJEKT / "data" / "quellen" / "oekobaudat_2024-II_auszug.csv"
ABRUF = "2026-11-16"
RELEASE = "ÖKOBAUDAT 2024-II"

QUALITAET_GENERISCH = (
    "Generischer Datensatz (Kategorie C laut ÖKOBAUDAT-Grundsätzen): keine externe Prüfung durch eine unabhängige "
    "dritte Stelle; erstellt von Sphera Solutions GmbH im Auftrag des BBSR mit konservativen Annahmen und "
    "Sicherheitszuschlägen von 10, 20 oder 30 %. Quelle: BBSR, „Generischer Datenbestand in der ÖKOBAUDAT“ (August 2026)."
)

QUALITAET_SPEZIFISCH = (
    "Produktspezifischer Datensatz: Umweltproduktdeklaration (EPD) eines Herstellers, gilt nur für das genannte Produkt. "
    "Ob und von wem die EPD geprüft wurde, haben wir nicht eingesehen. Die Werte sind mit generischen Datensätzen "
    "nur eingeschränkt vergleichbar."
)

# Typ-Namen der ÖKOBAUDAT -> verständlich
TYP_DE = {
    "generic dataset": "generischer Datensatz",
    "average dataset": "Branchendurchschnitt",
    "representative dataset": "repräsentativer Durchschnitt",
    "specific dataset": "produktspezifischer Datensatz (Herstellerdeklaration)",
}

# (material_id, Datensatzname, Typ, Eigner-Teilstring oder None, Rohdichte übernehmen?)
AUSWAHL = [
    ("normalbeton",           "Transportbeton C25/30",                                   "generic dataset",        None, True),
    ("porenbeton",            "Porenbeton P2 04 unbewehrt",                              "generic dataset",        None, True),
    ("hochlochziegel",        "Mauerziegel (ungefüllt)",                                 "average dataset",        "Ziegelindustrie", True),
    ("brettsperrholz",        "Brettsperrholz (Durchschnitt DE)",                        "representative dataset", "Thünen", True),
    ("brettschichtholz",      "Brettschichtholz Nadelholz (generisch)",                  "generic dataset",        None, True),
    ("konstruktionsvollholz", "Konstruktionsvollholz (generisch, 15% Feuchte / 13% H2O)", "generic dataset",       None, True),
    ("baustahl",              "Baustahl: Profile und Stabstahl",                         "average dataset",        "bauforumstahl", True),
    ("mineralwolle",          "Mineralwolle (Fassaden-Dämmung)",                         "generic dataset",        None, True),
    ("eps",                   "EPS-Hartschaumdämmung",                                   "generic dataset",        None, True),
    ("holzfaserdaemmung",     "Holzfaserdämmplatte (Nassverfahren)",                     "generic dataset",        None, True),
    ("zellulose",             "Zellulosefaser Einblas-Dämmstoff",                        "generic dataset",        None, True),
    ("hanfdaemmung",          "Hanfvlies",                                               "generic dataset",        None, True),
    ("klinker",               "Fassadenklinker",                                         "generic dataset",        None, True),
    # Gipsplatte: Der Datensatz nennt Rohdichte 680 kg/m3, aber 10 kg/m2 bei 12,5 mm (= 800 kg/m3).
    # Wegen dieses Widerspruchs wird die Rohdichte NICHT übernommen, nur der CO2-Wert.
    ("gipskarton",            "GIPSPLATTE NACH DIN EN 520 UND DIN 18180 / Tool",         "average dataset",        "Gipsindustrie", False),
    ("osb",                   "Oriented Strand Board (Durchschnitt DE)",                 "representative dataset", "Thünen", True),
    ("dachziegel",            "Dachziegel",                                              "generic dataset",        None, False),
]
# Zusätzlich das Flächengewicht übernehmen (nur wo es sinnvoll und vorhanden ist)
FLAECHENGEWICHT = {"dachziegel"}



# ---------------------------------------------------------------------------
# Schritt 11: neue Baustoffe. Alles, was die ÖKOBAUDAT nicht liefert (λ, Druckfestigkeit,
# Preis, Brandverhalten, μ, Wärmekapazität, Recycling), wird NICHT erfunden, sondern als
# „nicht verfügbar“ mit Begründung angelegt.
# Felder: id, name, produkt, kat (Kategorien), anw (Anwendungsbereiche), modell,
#         hinweis (nur bei keine_schicht), daten = (Datensatzname, Typ, Eigner-Teilstring, Rohdichte?),
#         fg (Flächengewicht übernehmen?), daemm (Dämmstoff: Druckfestigkeit nicht anwendbar)
# ---------------------------------------------------------------------------
GENERISCH = "generisch (ÖKOBAUDAT-Datensatz „{n}“), kein konkretes Herstellerprodukt"
PLATTE = ("Plattenprodukt mit fester Dicke. Die Schicht-Berechnung (Fläche × Dicke) ist deshalb deaktiviert; "
          "Gewicht und CO₂ werden je m² aus dem Datensatz übernommen.")

NEUE_BAUSTOFFE = [
    # ---- A: tragend
    dict(id="leichtbetonstein_bims", name="Leichtbetonstein (Naturbims)", kat=["tragend"], anw=["tragwerk"], modell="schicht",
         daten=("Leichtbetonstein aus 100% Naturbims", "generic dataset", None, True)),
    dict(id="leichtbetonstein_blaehton", name="Leichtbetonstein (Blähton, Planstein Außenwand)", kat=["tragend"], anw=["tragwerk"], modell="schicht",
         daten=("Blähton LB Planstein Außenwand", "generic dataset", None, True)),
    dict(id="kalksandstein", name="Kalksandstein", kat=["tragend"], anw=["tragwerk"], modell="schicht",
         daten=("Kalksandstein", "generic dataset", None, True)),
    dict(id="massivholz_nadel", name="Massivholz Nadelholz (Schnittholz, getrocknet)", kat=["tragend", "innenausbau"], anw=["tragwerk", "innenausbau"], modell="schicht",
         produkt="Durchschnitt Deutschland (Thünen-Institut für Holzforschung), kein konkretes Produkt",
         daten=("Nadelschnittholz - getrocknet (Durchschnitt DE)", "representative dataset", "Thünen", True)),
    dict(id="massivholz_laub", name="Massivholz Laubholz (Schnittholz, getrocknet)", kat=["tragend", "innenausbau"], anw=["tragwerk", "innenausbau"], modell="schicht",
         produkt="Durchschnitt Deutschland (Thünen-Institut für Holzforschung), kein konkretes Produkt",
         daten=("Laubschnittholz - getrocknet (Durchschnitt DE)", "representative dataset", "Thünen", True)),
    # ---- B: Dämmstoffe
    dict(id="glaswolle", name="Glaswolle (SAGLAN, phenolharzgebunden)", kat=["daemmstoff"], anw=["waermedaemmung"], modell="schicht", daemm=True,
         produkt="Herstellerdurchschnitt Sager AG (Schweiz), Produkt SAGLAN – kein generischer Datensatz",
         daten=("SAGLAN Glaswolle, phenolharzgebunden +A2", "average dataset", "Sager", True)),
    dict(id="steinwolle", name="Steinwolle (Flachdämmplatte)", kat=["daemmstoff"], anw=["waermedaemmung"], modell="schicht", daemm=True,
         daten=("Steinwolle Flachdämmplatte", "generic dataset", None, True)),
    dict(id="xps", name="XPS (extrudiertes Polystyrol)", kat=["daemmstoff"], anw=["waermedaemmung"], modell="schicht", daemm=True,
         daten=("Extrudierter Polystyrol Dämmstoff (XPS)", "generic dataset", None, True)),
    dict(id="pur", name="PUR-Hartschaum", kat=["daemmstoff"], anw=["waermedaemmung"], modell="schicht", daemm=True,
         daten=("PUR Hartschaum", "generic dataset", None, True)),
    dict(id="pir", name="PIR-Hartschaum", kat=["daemmstoff"], anw=["waermedaemmung"], modell="schicht", daemm=True,
         daten=("PIR Hartschaum", "generic dataset", None, True)),
    dict(id="flachsdaemmung", name="Flachsdämmung (Flachsvlies)", kat=["daemmstoff"], anw=["waermedaemmung"], modell="schicht", daemm=True,
         daten=("Flachsvlies", "generic dataset", None, True)),
    dict(id="kork", name="Kork (expandiert)", kat=["daemmstoff"], anw=["waermedaemmung"], modell="schicht", daemm=True,
         daten=("Expandierter Kork", "generic dataset", None, True)),
    dict(id="schaumglas", name="Schaumglas", kat=["daemmstoff"], anw=["waermedaemmung"], modell="schicht", daemm=True,
         daten=("Schaumglas Dämmstoff", "generic dataset", None, True)),
    dict(id="schafwolle", name="Schafwolle (Isolena)", kat=["daemmstoff"], anw=["waermedaemmung"], modell="schicht", daemm=True,
         produkt="Herstellerprodukt Isolena Schafwolle-Dämmstoffe (produktspezifische EPD, Bau EPD GmbH)",
         daten=("Isolena Schafwolle Dämmstoffe Rohdichte 23.26 kg/m³", "specific dataset", "Bau EPD", True)),
    # ---- C: Fassade
    dict(id="faserzement", name="Faserzementplatte (Fassade)", kat=["fassade"], anw=["fassade"], modell="keine_schicht",
         hinweis="Faserzement-Fassadenplatte. Der Datensatz bezieht sich auf 1 m² Platte ohne Angabe der Plattendicke. Die Schicht-Berechnung (Fläche × Dicke) ist deshalb deaktiviert, ein Gewicht je m² ist nicht berechenbar.",
         daten=("Faserzementplatte (Fassade)", "generic dataset", None, True)),
    dict(id="aluminium", name="Aluminiumblech", kat=["fassade", "dach"], anw=["fassade", "dach"], modell="schicht",
         daten=("Aluminiumblech", "generic dataset", None, True)),
    dict(id="stahlblech", name="Stahlblech (Feinblech 0,3–3,0 mm)", kat=["fassade", "dach"], anw=["fassade", "dach"], modell="schicht",
         daten=("Stahl Feinblech (0,3-3,0mm)", "generic dataset", None, True)),
    dict(id="naturstein_hart", name="Naturstein, hart (Fassadenplatte 30 mm)", kat=["fassade"], anw=["fassade"], modell="keine_schicht",
         hinweis="Fassadenplatte aus hartem Naturstein, 30 mm laut Datensatzname. " + PLATTE,
         daten=("Natursteinplatte, hart, Fassade (30mm)", "generic dataset", None, False), fg=True),
    dict(id="naturstein_weich", name="Naturstein, weich (Fassadenplatte 40 mm)", kat=["fassade"], anw=["fassade"], modell="keine_schicht",
         hinweis="Fassadenplatte aus weichem Naturstein, 40 mm laut Datensatzname. " + PLATTE,
         daten=("Natursteinplatte, weich, Fassade (40mm)", "generic dataset", None, False), fg=True),
    dict(id="keramikfliese", name="Keramische Fliesen (Steinzeug, unglasiert)", kat=["innenausbau", "fassade"], anw=["innenausbau", "fassade"], modell="keine_schicht",
         hinweis="Steinzeugfliese; der Datensatz nennt keine Fliesendicke. " + PLATTE,
         daten=("Steinzeugfliesen unglasiert", "generic dataset", None, False), fg=True),
    dict(id="kalkzementputz", name="Kalkzement-Putzmörtel", kat=["fassade"], anw=["fassade"], modell="schicht",
         daten=("Kalkzement Putzmörtel", "generic dataset", None, True)),
    dict(id="glas", name="Fensterglas (Einfachglas)", kat=["fassade"], anw=["fassade"], modell="keine_schicht",
         hinweis="Einfachverglasung. Der Datensatz nennt keine Glasdicke. " + PLATTE,
         daten=("Fensterglas einfach", "generic dataset", None, False), fg=True),
    # ---- D: Innenausbau
    dict(id="gipsfaserplatte", name="Gipsfaserplatte (10 mm)", kat=["innenausbau"], anw=["innenausbau"], modell="keine_schicht",
         hinweis="Gipsfaserplatte, 10 mm laut Datensatzname. " + PLATTE,
         daten=("Gipsfaserplatte (10mm)", "generic dataset", None, False), fg=True),
    dict(id="spanplatte", name="Spanplatte (roh)", kat=["innenausbau"], anw=["innenausbau"], modell="schicht",
         produkt="Durchschnitt Deutschland (Thünen-Institut für Holzforschung), kein konkretes Produkt",
         daten=("Spanplatte, roh (Durchschnitt DE)", "representative dataset", "Thünen", True)),
    dict(id="sperrholz", name="Sperrholz (Furniersperrholz)", kat=["innenausbau"], anw=["innenausbau"], modell="schicht",
         produkt="Durchschnitt Deutschland (Thünen-Institut für Holzforschung), kein konkretes Produkt",
         daten=("Furniersperrholz (Durchschnitt DE)", "representative dataset", "Thünen", True)),
    dict(id="zementestrich", name="Zementestrich", kat=["innenausbau"], anw=["innenausbau"], modell="schicht",
         daten=("Zementestrich", "generic dataset", None, True)),
    dict(id="calciumsulfatestrich", name="Calciumsulfatestrich", kat=["innenausbau"], anw=["innenausbau"], modell="schicht",
         daten=("Calciumsulfatestrich", "generic dataset", None, True)),
    dict(id="kalkgipsinnenputz", name="Kalk-Gips-Innenputz", kat=["innenausbau"], anw=["innenausbau"], modell="schicht",
         daten=("Kalk-Gips-Innenputz", "generic dataset", None, True)),
    # ---- E: Dach
    dict(id="betondachstein", name="Betondachstein", kat=["dach"], anw=["dach"], modell="keine_schicht",
         hinweis="Dachsteine bilden eine Deckung mit Überdeckung und Lattung, keine homogene Schicht. Die Schicht-Berechnung (Fläche × Dicke) ist deshalb deaktiviert.",
         daten=("Dachsteine (Beton)", "generic dataset", None, False), fg=True),
    dict(id="schiefer", name="Schiefer (Schieferplatten)", kat=["dach", "fassade"], anw=["dach", "fassade"], modell="keine_schicht",
         hinweis="Schieferplatten werden als Deckung bzw. Bekleidung verlegt, nicht als homogene Schicht. Die Schicht-Berechnung (Fläche × Dicke) ist deshalb deaktiviert.",
         daten=("Schieferplatten", "generic dataset", None, False), fg=True),
    dict(id="zinkblech", name="Zinkblech (RHEINZINK-CLASSIC walzblank)", kat=["dach", "fassade"], anw=["dach", "fassade"], modell="schicht",
         produkt="Herstellerprodukt RHEINZINK-CLASSIC walzblank (produktspezifische EPD, RHEINZINK GmbH & Co. KG)",
         daten=("RHEINZINK-CLASSIC® walzblank", "specific dataset", "RHEINZINK", True)),
    dict(id="bitumenbahn", name="Bitumenbahn (PYE PV 200 S5, ungeschiefert)", kat=["dach"], anw=["dach"], modell="keine_schicht",
         hinweis="Abdichtungsbahn. Die Schicht-Berechnung (Fläche × Dicke) ist deshalb deaktiviert; Gewicht und CO₂ werden je m² aus dem Datensatz übernommen.",
         daten=("Bitumenbahnen PYE PV 200 S5 (ungeschiefert)", "generic dataset", None, False), fg=True),
    dict(id="epdm", name="EPDM-Dachbahn", kat=["dach"], anw=["dach"], modell="keine_schicht",
         hinweis="Abdichtungsbahn. Die Schicht-Berechnung (Fläche × Dicke) ist deshalb deaktiviert; Gewicht und CO₂ werden je m² aus dem Datensatz übernommen.",
         daten=("Dachbahnen EPDM", "generic dataset", None, False), fg=True),
]

AUSWAHL = AUSWAHL + [(m["id"],) + tuple(m["daten"]) for m in NEUE_BAUSTOFFE]
FLAECHENGEWICHT = FLAECHENGEWICHT | {m["id"] for m in NEUE_BAUSTOFFE if m.get("fg")}
WARNUNGEN = []

# Begründungen für Kennwerte, die NICHT aus der ÖKOBAUDAT stammen und nicht belegt sind
NV = "Nicht verfügbar: "
GRUND = {
    "lambda": NV + "Die ÖKOBAUDAT enthält keine Wärmeleitfähigkeit. Ein geprüfter Beleg (Herstellerdatenblatt, Leistungserklärung, Norm) liegt noch nicht vor; es wurde kein Wert angenommen.",
    "druck": NV + "Die ÖKOBAUDAT enthält keine Druckfestigkeit. Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.",
    "preis": NV + "Kein belegter Preis (BKI-Daten oder Händlerangebot) vorhanden; es wurde kein Marktpreis angenommen.",
    "brand": NV + "Die Euroklasse hängt vom konkreten Produkt ab. Ein geprüfter Beleg (Leistungserklärung) liegt noch nicht vor.",
    "mu": NV + "Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.",
    "wk": NV + "Ein geprüfter Beleg liegt noch nicht vor; es wurde kein Wert angenommen.",
    "recycling": NV + "Ein geprüfter Beleg liegt noch nicht vor; es wurde keine Aussage getroffen.",
    "rohdichte": NV + "Der ÖKOBAUDAT-Datensatz nennt für dieses Produkt keine Rohdichte (nur das Flächengewicht).",
}
DRUCK_DAEMM = ("Bei Dämmstoffen wird die Druckspannung bei 10 % Stauchung angegeben, "
               "eine andere Prüfgröße als die Druckfestigkeit von Tragstoffen.")


def skelett(m):
    """Datenblock eines neuen Baustoffs; ÖKOBAUDAT-Zeilen (rohdichte/flaechengewicht/gwp) werden später überschrieben."""
    schicht = m["modell"] == "schicht"
    produkt = m.get("produkt") or GENERISCH.format(n=m["daten"][0])
    pr_einheit = "€/m³" if schicht else "€/m²"
    z = []
    z.append("    {")
    z.append(f'      id: {js_text(m["id"])},')
    z.append(f'      name: {js_text(m["name"])},')
    z.append(f'      produkt: {js_text(produkt)},')
    z.append("      kategorien: [" + ", ".join(js_text(k) for k in m["kat"]) + "],")
    z.append("      anwendungen: [" + ", ".join(js_text(k) for k in m["anw"]) + "],")
    z.append(f'      mengenmodell: {js_text(m["modell"])},')
    if not schicht:
        z.append(f'      mengenhinweis: {js_text(m["hinweis"])},')
    z.append("      eigenschaften: {")
    z.append(f'        rohdichte:             {{ wert: null, einheit: "kg/m³", art: null, quelle: null, hinweis: {js_text(GRUND["rohdichte"])} }},')
    if m.get("fg"):
        z.append('        flaechengewicht:       { wert: null, einheit: "kg/m²", art: null, quelle: null },')
    z.append(f'        waermeleitfaehigkeit:  {{ wert: null, einheit: "W/(m·K)", art: null, quelle: null, hinweis: {js_text(GRUND["lambda"])} }},')
    if m.get("daemm"):
        z.append(f'        druckfestigkeit:       {{ wert: null, einheit: "N/mm²", art: null, quelle: null, nicht_anwendbar: true, hinweis: {js_text(DRUCK_DAEMM)} }},')
    else:
        z.append(f'        druckfestigkeit:       {{ wert: null, einheit: "N/mm²", art: null, quelle: null, hinweis: {js_text(GRUND["druck"])} }},')
    z.append(f'        preis:                 {{ wert: null, einheit: {js_text(pr_einheit)}, art: null, quelle: null, mwst: null, umfang: null, hinweis: {js_text(GRUND["preis"])} }},')
    z.append('        gwp:                   { werte: null, einheit: "kg CO2e", deklarierte_einheit: null, module: null, art: null, quelle: null },')
    z.append(f'        brandverhalten:        {{ wert: null, art: null, quelle: null, hinweis: {js_text(GRUND["brand"])} }},')
    z.append(f'        wasserdampf_mu:        {{ wert: null, einheit: "–", art: null, quelle: null, hinweis: {js_text(GRUND["mu"])} }},')
    z.append(f'        waermekapazitaet:      {{ wert: null, einheit: "J/(kg·K)", art: null, quelle: null, hinweis: {js_text(GRUND["wk"])} }},')
    z.append(f'        recycling:             {{ wert: null, art: null, quelle: null, hinweis: {js_text(GRUND["recycling"])} }}')
    z.append("      },")
    z.append("      vorteile: [],")
    z.append("      nachteile: []")
    z.append("    }")
    return "\n".join(z)


def plausibilitaet(name, r, g, warnungen, streng=True):
    """Einfache Gegenprüfung der Datensatzangaben. Abbruch nur bei klarem Widerspruch."""
    rd, fg, d = zahl(g(r, "Rohdichte (kg/m3)")), zahl(g(r, "Flaechengewicht (kg/m2)")), zahl(g(r, "Schichtdicke (m)"))
    if rd and fg and d:
        abw = abs(fg - rd * d) / fg
        if abw > 0.10 and not streng:
            warnungen.append(f"„{name}“: Widerspruch im Datensatz (Flächengewicht {fg} ≠ Rohdichte {rd} × Dicke {d}, {abw:.0%}); Rohdichte wird deshalb nicht übernommen.")
        elif abw > 0.10:
            sys.exit(f"ABBRUCH: „{name}“: Flächengewicht {fg} passt nicht zu Rohdichte {rd} × Dicke {d} (Abweichung {abw:.0%}).")
        if abw > 0.02:
            warnungen.append(f"„{name}“: Flächengewicht weicht {abw:.1%} von Rohdichte × Dicke ab.")
    tot, fos, bio, lul = (zahl(g(r, c)) for c in ("GWPtotal (A2)", "GWPfossil (A2)", "GWPbiogenic (A2)", "GWPluluc (A2)"))
    if None not in (tot, fos, bio):
        summe = fos + bio + (lul or 0)
        if abs(summe - tot) > max(0.5, 0.01 * abs(tot)):
            warnungen.append(f"„{name}“: GWP gesamt {tot} ≠ fossil + biogen + luluc ({summe:.4f}).")
    if rd is not None and not (1 <= rd <= 25000):
        sys.exit(f"ABBRUCH: „{name}“: unplausible Rohdichte {rd}.")



def zahl(text):
    """CSV-Zahl (Punkt als Dezimaltrenner) -> float; leer -> None."""
    text = text.strip()
    return float(text) if text != "" else None


def js_zahl(x):
    """Zahl als JavaScript-Literal, ohne Verlust der Genauigkeit."""
    if x == int(x) and abs(x) < 1e15:
        return str(int(x))
    return repr(x)


def js_text(t):
    return '"' + t.replace("\\", "\\\\").replace('"', '\\"') + '"'


def lade(pfad):
    with open(pfad, encoding="cp1252", newline="") as f:
        rd = csv.reader(f, delimiter=";")
        kopf = next(rd)
        zeilen = list(rd)
    ix = {n: i for i, n in enumerate(kopf)}
    return kopf, zeilen, ix


def waehle(zeilen, ix, name, typ, eigner):
    g = lambda r, n: r[ix[n]].strip()
    treffer = [r for r in zeilen
               if g(r, "Name (de)") == name and g(r, "Typ") == typ and g(r, "Modul") == "A1-A3"
               and (eigner is None or eigner in g(r, "Declaration owner"))]
    if len(treffer) != 1:
        sys.exit(f"ABBRUCH: Für „{name}“ ({typ}) wurden {len(treffer)} A1-A3-Zeilen gefunden, erwartet genau 1.")
    return treffer[0]


def hintergrund(text):
    m = re.findall(r"'?([A-Za-z ]+database) \(", text)
    return " + ".join(dict.fromkeys(m)) if m else text


def bauen(zeilen, ix):
    g = lambda r, n: r[ix[n]].strip()
    ergebnis = []
    for mid, name, typ, eigner, mit_rohdichte in AUSWAHL:
        r = waehle(zeilen, ix, name, typ, eigner)
        plausibilitaet(name, r, g, WARNUNGEN, streng=mit_rohdichte)
        uuid, version = g(r, "UUID"), g(r, "Version")
        qid = "oebd-" + uuid[:8]

        # --- Bezugsgröße bestimmen
        bg, be = zahl(g(r, "Bezugsgroesse")), g(r, "Bezugseinheit")
        teiler = 1.0
        if be == "m3" and bg == 1:
            einheit = "1 m³"
        elif be == "qm" and bg == 1:
            einheit = "1 m²"
        elif be == "kg" and bg == 1:
            einheit = "1 kg"
        elif be == "kg" and bg == 1000:
            einheit, teiler = "1 kg", 1000.0
        else:
            sys.exit(f"ABBRUCH: Unbekannte Bezugsgröße {bg} {be} bei „{name}“.")

        # --- GWP
        felder = {"gesamt": "GWPtotal (A2)", "fossil": "GWPfossil (A2)", "biogen": "GWPbiogenic (A2)", "luluc": "GWPluluc (A2)"}
        werte = {}
        for k, spalte in felder.items():
            v = zahl(g(r, spalte))
            if v is None:
                if k in ("gesamt", "fossil", "biogen"):
                    sys.exit(f"ABBRUCH: {spalte} fehlt bei „{name}“.")
                continue
            werte[k] = round(v / teiler, 12) if teiler != 1.0 else v

        eigner_name = g(r, "Declaration owner")
        jahr = g(r, "Referenzjahr")
        typ_text = TYP_DE[typ][0].upper() + TYP_DE[typ][1:]
        gilt = ("Gilt für das genannte Herstellerprodukt, nicht für andere Produkte." if typ == "specific dataset"
                else "Gilt nicht für ein bestimmtes Produkt.")
        hinweis = (f"{typ_text} ({typ}) „{name}“, {eigner_name}, Bezugsjahr {jahr}, "
                   f"Land {g(r, 'Laenderkennung')}. {gilt}")
        if teiler != 1.0:
            hinweis += (f" Umgerechnet aus der Originalangabe je {js_zahl(bg)} kg (Division durch 1000); "
                        f"Originalwert GWP-total: {js_zahl(zahl(g(r, 'GWPtotal (A2)')))}.")
        if typ == "generic dataset":
            hinweis += (" Generische Datensätze enthalten laut BBSR Sicherheitszuschläge (konservative Annahmen, "
                        "10/20/30 %) und wurden nicht extern geprüft.")
        if werte["biogen"] < -1:
            hinweis += (" GWP-gesamt enthält die Aufnahme von biogenem Kohlenstoff (GWP-biogen, negativ). "
                        "Dieser wird am Lebensende wieder freigesetzt oder in Modul D verrechnet; "
                        "nur bei gleicher Systemgrenze mit anderen Materialien vergleichen.")
        gwp = "{ werte: { " + ", ".join(f"{k}: {js_zahl(v)}" for k, v in werte.items()) + " }, "
        gwp += f'einheit: "kg CO2e", deklarierte_einheit: {js_text(einheit)}, module: "A1-A3", '
        dicke = zahl(g(r, "Schichtdicke (m)"))
        if einheit == "1 m²" and dicke:
            gwp += f"bezugsdicke_m: {js_zahl(dicke)}, "
        gwp += f'art: "richtwert", quelle: {js_text(qid)}, hinweis: {js_text(hinweis)} }},'

        # --- Rohdichte
        rohdichte = None
        rd = zahl(g(r, "Rohdichte (kg/m3)"))
        if mit_rohdichte and rd is not None:
            rohdichte = (f'{{ wert: {js_zahl(rd)}, einheit: "kg/m³", art: "richtwert", quelle: {js_text(qid)}, '
                         f'hinweis: {js_text("Rohdichte laut ÖKOBAUDAT-Datensatz „" + name + "“.")} }},')
        elif mit_rohdichte and rd is None:
            sys.exit(f"ABBRUCH: Rohdichte fehlt bei „{name}“, obwohl sie übernommen werden soll.")

        flaechengewicht = None
        if mid in FLAECHENGEWICHT:
            fg = zahl(g(r, "Flaechengewicht (kg/m2)"))
            if fg is None:
                sys.exit(f"ABBRUCH: Flächengewicht fehlt bei „{name}“.")
            flaechengewicht = (f'{{ wert: {js_zahl(fg)}, einheit: "kg/m²", art: "richtwert", quelle: {js_text(qid)}, '
                               f'hinweis: {js_text("Flächengewicht der Dachdeckung laut ÖKOBAUDAT-Datensatz „" + name + "“.")} }},')

        # --- Quelleneintrag
        teile = []
        if rohdichte: teile.append("Rohdichte")
        if flaechengewicht: teile.append("Flächengewicht")
        verwendung = " und ".join(teile + ["CO₂-Kennwerte (A1–A3)"]) + " für " + mid + "."
        quelle = (
            "    {\n"
            f"      id: {js_text(qid)},\n"
            f"      titel: {js_text(name)},\n"
            f"      herausgeber: {js_text('Bundesinstitut für Bau-, Stadt- und Raumforschung (BBSR), ' + RELEASE)},\n"
            f"      datensatz_eigner: {js_text(eigner_name)},\n"
            f"      url: {js_text(g(r, 'URL'))},\n"
            f"      datum: {js_text(g(r, 'Veroeffentlicht am')) if g(r, 'Veroeffentlicht am') else 'null'},\n"
            f"      referenzjahr: {jahr},\n"
            f"      gueltig_bis: {g(r, 'Gueltig bis') or 'null'},\n"
            f"      abgerufen: {js_text(ABRUF)},\n"
            f"      uuid: {js_text(uuid)},\n"
            f"      version: {js_text(version)},\n"
            f"      typ: {js_text(typ)},\n"
            f"      konformitaet: {js_text(g(r, 'Konformitaet').replace(chr(39), ''))},\n"
            f"      hintergrunddatenbank: {js_text(hintergrund(g(r, 'Hintergrunddatenbank(en)')))},\n"
            + (f"      qualitaet: {js_text(QUALITAET_GENERISCH)},\n" if typ == "generic dataset" else "")
            + (f"      qualitaet: {js_text(QUALITAET_SPEZIFISCH)},\n" if typ == "specific dataset" else "") +
            f"      geprueft: true,\n"
            f"      verwendung: {js_text(verwendung)}\n"
            "    },\n"
        )
        ergebnis.append((mid, qid, uuid, rohdichte, gwp, flaechengewicht, quelle))
    return ergebnis


def neue_anlegen(text):
    """Legt Baustoffe aus NEUE_BAUSTOFFE an, falls ihre id noch nicht in der Datei steht (wiederholbar)."""
    fehlen = [m for m in NEUE_BAUSTOFFE if f'id: "{m["id"]}",' not in text]
    if not fehlen:
        return text
    ende = text.rindex("\n  ]\n};")
    kopf = text[:ende].rstrip()
    kommentar = ("\n\n    /* ================= ERWEITERUNG (Schritt 11): weitere Baustoffe aus der ÖKOBAUDAT 2024-II =================\n"
                 "       Rohdichte, Flächengewicht und CO2-Kennwerte stammen maschinell aus der ÖKOBAUDAT\n"
                 "       (tools/oekobaudat_uebernehmen.py). Alles andere ist „nicht verfügbar“ (kein erfundener Wert). */\n\n")
    return kopf + "," + kommentar + ",\n\n".join(skelett(m) for m in fehlen) + "\n" + text[ende:]


def patche(text, ergebnis):
    text = neue_anlegen(text)
    for mid, qid, uuid, rohdichte, gwp, fg, quelle in ergebnis:
        start = text.find(f'id: "{mid}",')
        if start < 0:
            sys.exit(f"ABBRUCH: Material „{mid}“ nicht in baustoffe.js gefunden.")
        ende = text.find('\n    {\n      id: "', start + 10)
        if ende < 0:
            ende = len(text)
        block = text[start:ende]

        def ersetze(block, schluessel, neu, danach=None):
            muster = re.compile(r"^(\s+)" + schluessel + r":\s+\{.*\},?\s*$", re.M)
            if muster.search(block):
                return muster.sub(lambda m: f"{m.group(1)}{(schluessel + ':').ljust(22)} {neu}", block, count=1)
            if danach is None:
                sys.exit(f"ABBRUCH: Zeile „{schluessel}“ bei {mid} nicht gefunden.")
            m = re.search(r"^(\s+)" + danach + r":.*$", block, re.M)
            return block[:m.end()] + f"\n{m.group(1)}{(schluessel + ':').ljust(22)} {neu}" + block[m.end():]

        if rohdichte:
            block = ersetze(block, "rohdichte", rohdichte)
        block = ersetze(block, "gwp", gwp)
        if fg:
            block = ersetze(block, "flaechengewicht", fg, danach="rohdichte")
        text = text[:start] + block + text[ende:]

    anfang = text.index("// <<OEBD-QUELLEN-ANFANG>>")
    zeile_ende = text.index("\n", anfang) + 1
    ende = text.index("    // <<OEBD-QUELLEN-ENDE>>")
    text = text[:zeile_ende] + "".join(e[6] for e in ergebnis) + text[ende:]
    return text


def auszug_schreiben(pfad_csv, kopf, zeilen, ix, ergebnis):
    uuids = {e[2] for e in ergebnis}
    AUSZUG.parent.mkdir(parents=True, exist_ok=True)
    with open(AUSZUG, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter=";", lineterminator="\n")
        w.writerow(kopf)
        n = 0
        for r in zeilen:
            if r[ix["UUID"]].strip() in uuids:
                w.writerow(r)
                n += 1
    return n


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    pfad = pathlib.Path(sys.argv[1])
    sha = hashlib.sha256(pfad.read_bytes()).hexdigest()
    print("SHA-256 der Originaldatei:", sha)
    kopf, zeilen, ix = lade(pfad)
    ergebnis = bauen(zeilen, ix)
    text = patche(DATEI.read_text(encoding="utf-8"), ergebnis)
    DATEI.write_text(text, encoding="utf-8")
    n = auszug_schreiben(pfad, kopf, zeilen, ix, ergebnis)
    print(f"{len(ergebnis)} Datensätze übernommen, {n} Zeilen im Auszug.")
    for w in WARNUNGEN:
        print("  Hinweis:", w)
    for mid, qid, uuid, *_ in ergebnis:
        print(f"  {mid:24} <- {qid}  ({uuid})")


if __name__ == "__main__":
    main()
