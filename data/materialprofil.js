/* ==========================================================================
   MaterialMatch – Einordnung der Baustoffe (MaterialMatch 3.0)
   --------------------------------------------------------------------------
   „Einordnung durch das Projekt“: Jeder der 50 Baustoffe aus data/baustoffe.js ist einer oder mehreren Klassen
   zugeordnet (nachwachsend, mineralisch, konventionell, natürlich). Das ist eine Klassifikation nach der
   Hauptsubstanz, KEIN Messwert und keine Norm. Die Kriterien stehen unter meta.klassen; je Material steht eine
   kurze Begründung. Die Datei ändert keine Werte in data/baustoffe.js.
   Genutzt von: Steckbrief, Interview „Match finden“ (Materialart, natürliche Materialien).
   ========================================================================== */

window.MATERIALMATCH_PROFIL = {
  "meta": {
    "titel": "Einordnung durch das Projekt",
    "stand": "2026-11-17",
    "hinweis": "Die Einordnung stammt vom Projektteam und ist kein Messwert und keine Norm. Sie beschreibt die Hauptsubstanz des Materials. Mehrfachzuordnungen sind möglich. Sie sagt nichts über Qualität, Umweltwirkung, Zulassung oder Eignung für eine Aufgabe aus.",
    "klassen": {
      "nachwachsend": {
        "name": "Nachwachsende Rohstoffe",
        "kriterium": "Der Hauptbestandteil stammt von Pflanzen oder Tieren und wächst in überschaubaren Zeiträumen nach (Holz, Pflanzenfasern, Kork, Wolle). Auch verklebte oder gebundene Holzwerkstoffe zählen dazu, weil ihr Hauptbestandteil Holz ist. Bindemittel und Zusätze werden dabei nicht bewertet."
      },
      "mineralisch": {
        "name": "Mineralische Baustoffe",
        "kriterium": "Der Hauptbestandteil besteht aus mineralischen (anorganischen, nichtmetallischen) Rohstoffen wie Zement, Kalk, Gips, Ton, Sand, Glas oder Gestein. Das gilt auch für gebrannte oder geschmolzene Erzeugnisse (Ziegel, Mineralwolle, Glas). Metalle zählen nicht dazu."
      },
      "konventionell": {
        "name": "Konventionelle Baustoffe",
        "kriterium": "Seit Jahrzehnten marktübliche, industriell standardisierte Baustoffe der Massenbauweise (Beton, Stahl, Mauerwerk, Gipsplatten, Standard-Dämmstoffe aus Mineralwolle oder Schaumkunststoff, Bitumen- und Kunststoffbahnen). Der Begriff beschreibt die Marktüblichkeit, keine Qualität und keine Umweltbewertung. Nischenprodukte und Holzbauprodukte zählen hier nicht dazu."
      },
      "natuerlich": {
        "name": "Natürliche Baustoffe",
        "kriterium": "Der Hauptbestandteil ist natürlichen Ursprungs und wurde nur mechanisch, thermisch oder durch Trocknung aufbereitet; es entsteht keine chemisch hergestellte Hauptsubstanz. Geringe Zusätze oder Stützfasern sind möglich und stehen dann in der Begründung. Verklebte Werkstoffe und gebrannte Produkte zählen nicht dazu."
      }
    }
  },
  "materialien": {
    "normalbeton": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Zement, Sand und Kies; seit Jahrzehnten Standard der Massenbauweise."
    },
    "stahlbeton": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Beton mit Stahlbewehrung; Standardbauweise im Massivbau."
    },
    "hochlochziegel": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Gebrannter Ton; marktübliches Mauerwerk. Gebrannt, daher nicht als „natürlich“ eingeordnet."
    },
    "porenbeton": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Kalk, Zement und Sand, mit Treibmittel aufgeschäumt; marktübliches Mauerwerk."
    },
    "brettsperrholz": {
      "klassen": [
        "nachwachsend"
      ],
      "begruendung": "Verklebte Nadelholzlagen; Hauptbestandteil Holz. Wegen der Verklebung nicht als „natürlich“ eingeordnet."
    },
    "brettschichtholz": {
      "klassen": [
        "nachwachsend"
      ],
      "begruendung": "Verklebte Holzlamellen; Hauptbestandteil Holz. Wegen der Verklebung nicht als „natürlich“ eingeordnet."
    },
    "konstruktionsvollholz": {
      "klassen": [
        "nachwachsend",
        "natuerlich"
      ],
      "begruendung": "Massives, getrocknetes und gehobeltes Holz ohne chemische Hauptsubstanz."
    },
    "baustahl": {
      "klassen": [
        "konventionell"
      ],
      "begruendung": "Metallischer Baustoff aus Eisenerz oder Schrott; marktüblich im Stahlbau."
    },
    "mineralwolle": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Geschmolzenes Gestein bzw. Glas, zu Fasern verarbeitet; marktüblicher Dämmstoff."
    },
    "eps": {
      "klassen": [
        "konventionell"
      ],
      "begruendung": "Expandiertes Polystyrol, ein Schaumkunststoff auf Erdölbasis; marktüblicher Dämmstoff."
    },
    "holzfaserdaemmung": {
      "klassen": [
        "nachwachsend"
      ],
      "begruendung": "Holzfasern, meist mit Bindemittel; Hauptbestandteil Holz. Wegen der Bindemittel nicht als „natürlich“ eingeordnet."
    },
    "zellulose": {
      "klassen": [
        "nachwachsend"
      ],
      "begruendung": "Aufbereitetes Altpapier (Pflanzenfasern) mit mineralischen Zusätzen als Brandschutz; deshalb nicht als „natürlich“ eingeordnet."
    },
    "hanfdaemmung": {
      "klassen": [
        "nachwachsend",
        "natuerlich"
      ],
      "begruendung": "Hanffasern; Hauptbestandteil natürlich, meist mit Stützfasern aus Kunststoff (Hinweis beachten)."
    },
    "klinker": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Hart gebrannter Ton; marktübliche Fassadensteine."
    },
    "gipskarton": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Gipskern mit Kartonummantelung; marktüblicher Trockenbau."
    },
    "osb": {
      "klassen": [
        "nachwachsend"
      ],
      "begruendung": "Verklebte Holzstränge; Hauptbestandteil Holz. Wegen der Verklebung nicht als „natürlich“ eingeordnet."
    },
    "dachziegel": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Gebrannter Ton; marktübliche Dacheindeckung."
    },
    "leichtbetonstein_bims": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Bims (Vulkangestein) mit Zement; marktübliches Mauerwerk."
    },
    "leichtbetonstein_blaehton": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Gebrannter Blähton mit Zement; marktübliches Mauerwerk."
    },
    "kalksandstein": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Kalk, Sand und Wasser, dampfgehärtet; marktübliches Mauerwerk."
    },
    "massivholz_nadel": {
      "klassen": [
        "nachwachsend",
        "natuerlich"
      ],
      "begruendung": "Massives Nadelholz, nur getrocknet und bearbeitet."
    },
    "massivholz_laub": {
      "klassen": [
        "nachwachsend",
        "natuerlich"
      ],
      "begruendung": "Massives Laubholz, nur getrocknet und bearbeitet."
    },
    "glaswolle": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Geschmolzenes Glas, zu Fasern verarbeitet; marktüblicher Dämmstoff."
    },
    "steinwolle": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Geschmolzenes Gestein, zu Fasern verarbeitet; marktüblicher Dämmstoff."
    },
    "xps": {
      "klassen": [
        "konventionell"
      ],
      "begruendung": "Extrudiertes Polystyrol, ein Schaumkunststoff auf Erdölbasis; marktüblicher Dämmstoff."
    },
    "pur": {
      "klassen": [
        "konventionell"
      ],
      "begruendung": "Polyurethan-Hartschaum, ein Kunststoff auf Erdölbasis; marktüblicher Dämmstoff."
    },
    "pir": {
      "klassen": [
        "konventionell"
      ],
      "begruendung": "Polyisocyanurat-Hartschaum, ein Kunststoff auf Erdölbasis; marktüblicher Dämmstoff."
    },
    "flachsdaemmung": {
      "klassen": [
        "nachwachsend",
        "natuerlich"
      ],
      "begruendung": "Flachsfasern; Hauptbestandteil natürlich, meist mit Stützfasern und Zusätzen (Hinweis beachten)."
    },
    "kork": {
      "klassen": [
        "nachwachsend",
        "natuerlich"
      ],
      "begruendung": "Expandiertes Korkgranulat (Rinde der Korkeiche), thermisch aufbereitet und mit eigenem Harz gebunden."
    },
    "schaumglas": {
      "klassen": [
        "mineralisch"
      ],
      "begruendung": "Aufgeschäumtes Glas; mineralisch, aber ein Nischenprodukt und deshalb nicht als „konventionell“ eingeordnet."
    },
    "schafwolle": {
      "klassen": [
        "nachwachsend",
        "natuerlich"
      ],
      "begruendung": "Wolle vom Schaf (tierische Faser), mechanisch aufbereitet; Hauptbestandteil natürlich, mit Zusätzen gegen Schädlinge und Brand (Hinweis beachten)."
    },
    "faserzement": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Zement mit Verstärkungsfasern; marktübliche Fassaden- und Dachplatten."
    },
    "aluminium": {
      "klassen": [
        "konventionell"
      ],
      "begruendung": "Metallischer Baustoff; marktüblich für Fassaden und Dächer."
    },
    "stahlblech": {
      "klassen": [
        "konventionell"
      ],
      "begruendung": "Metallischer Baustoff; marktüblich für Dach und Fassade."
    },
    "naturstein_hart": {
      "klassen": [
        "mineralisch",
        "natuerlich"
      ],
      "begruendung": "Gestein (z. B. Granit), nur gebrochen und bearbeitet."
    },
    "naturstein_weich": {
      "klassen": [
        "mineralisch",
        "natuerlich"
      ],
      "begruendung": "Gestein (z. B. Kalkstein, Sandstein), nur gebrochen und bearbeitet."
    },
    "keramikfliese": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Gebrannter Ton mit Glasur; marktüblicher Belag."
    },
    "kalkzementputz": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Kalk, Zement und Sand; marktüblicher Außenputz."
    },
    "glas": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Geschmolzener Quarzsand; marktübliches Flachglas."
    },
    "gipsfaserplatte": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Gips mit Zellulosefasern; marktübliche Trockenbauplatte."
    },
    "spanplatte": {
      "klassen": [
        "nachwachsend"
      ],
      "begruendung": "Verklebte Holzspäne; Hauptbestandteil Holz. Wegen der Verklebung nicht als „natürlich“ eingeordnet."
    },
    "sperrholz": {
      "klassen": [
        "nachwachsend"
      ],
      "begruendung": "Verklebte Holzfurniere; Hauptbestandteil Holz. Wegen der Verklebung nicht als „natürlich“ eingeordnet."
    },
    "zementestrich": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Zement und Sand; marktüblicher Estrich."
    },
    "calciumsulfatestrich": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Calciumsulfat (Anhydrit) und Sand; marktüblicher Estrich."
    },
    "kalkgipsinnenputz": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Kalk und Gips; marktüblicher Innenputz."
    },
    "betondachstein": {
      "klassen": [
        "mineralisch",
        "konventionell"
      ],
      "begruendung": "Zement und Sand; marktübliche Dacheindeckung."
    },
    "schiefer": {
      "klassen": [
        "mineralisch",
        "natuerlich"
      ],
      "begruendung": "Gespaltenes Tongestein, nur gebrochen und gespalten."
    },
    "zinkblech": {
      "klassen": [
        "konventionell"
      ],
      "begruendung": "Metallischer Baustoff; marktüblich für Dach und Fassade."
    },
    "bitumenbahn": {
      "klassen": [
        "konventionell"
      ],
      "begruendung": "Bitumen (Erdölprodukt) mit Einlage; marktübliche Abdichtung."
    },
    "epdm": {
      "klassen": [
        "konventionell"
      ],
      "begruendung": "Synthetischer Kautschuk (Kunststoff); marktübliche Abdichtungsbahn."
    }
  }
};
