# Was ihr noch tun müsst: Anmeldungen, Anfragen und Downloads

Stand: 18.11.2026. Diese Liste sammelt alles, wofür ich euch brauche. Ich habe nichts in eurem Namen angemeldet
und keine Nutzungsbedingungen akzeptiert. Alles andere habe ich selbst erledigt (siehe `RECHERCHE.md`, Abschnitt 2k).

**Wichtig vorab:** Bei zwei Quellen reicht die kostenlose Anmeldung allein **nicht**, weil die Nutzungsbedingungen
das Übernehmen der Daten in eine eigene Datenbank einschränken. Ich habe deshalb dort eine kurze **Anfrage per E-Mail**
vorbereitet. Ohne Antwort übernehme ich nichts.

## Übersicht (nach Nutzen geordnet)

| Nr. | Quelle | Was ihr tun müsst | Was es bringt | Dringlichkeit |
|---|---|---|---|---|
| 1 | **baubook** (Richtwerte, XML) | E-Mail an baubook (Text unten). Danach, falls erlaubt, kostenlos registrieren und die XML-Datei laden. | λ, Rohdichte, Wärmekapazität, μ, Brandverhalten für viele Standardbaustoffe, die größte Lücke | hoch |
| 2 | **Hochschule: Normen und BKI** | In der Hochschulbibliothek fragen, ob die Jade Hochschule DIN-Normen (Beuth) und die BKI-Baukosten-/Baupreisdatenbank lizenziert hat. | λB/μ/c aus DIN 4108-4 und EN ISO 10456, Baupreise (€/m³, €/m²) | hoch |
| 3 | **IBU.data** (EPD-Datensätze) | Registrieren und Lizenzfrage klären (Text unten). | produktspezifische CO₂-Werte (GWP), die ÖKOBAUDAT deckt bereits 49 von 50 Baustoffen ab | niedrig |
| 4 | **WECOBIS** (Recycling, Rückbau) | Genehmigung der Bayerischen Architektenkammer anfragen (Text unten). | Aussagen zu Rückbau und Entsorgung (nur Texte, keine Zahlen) | niedrig |
| 5 | **Preislisten** | Selbst gefundene Preislisten (PDF/Excel) in `data/eingang/preislisten/` legen, vor allem Holz, Stahl, Ziegel, Fliesen, Estrich. | weitere Preise | mittel |

## 1. baubook

**Was ich geprüft habe:** Die Richt- und Produktkennwerte gibt es kostenlos als XML-Download für registrierte Nutzer
(https://www.baubook.info/de/datenbezug). Die baubook-AGB (https://www.baubook.info/de/service/downloads/agb/baubook_agb_de.pdf, Punkt 3) sagen aber:
*„Den Nutzer*innen ist es insbesondere untersagt, die abgefragten Daten in eine eigene Datenbank einzubringen. Ist dies gewünscht,
können hierzu gesonderte Kooperationsvereinbarungen mit baubook abgeschlossen werden.“*
Außerdem sind die Werte österreichische Richtwerte (für Energieausweis und Wohnbauförderung); baubook nennt sie für Dampfdiffusionsberechnungen nur bedingt geeignet.

**Eure Schritte:**
1. E-Mail an baubook (Kontakt über https://www.baubook.info, Menü „Kontakt, Anfahrt & Team“). Textvorschlag unten.
2. Erst wenn baubook zustimmt: kostenlos registrieren unter https://www.baubook.at/registrieren, in der Zentrale die Richtwerte als **XML** herunterladen.
3. Datei in `data/eingang/baubook/` speichern und mir Bescheid sagen.

> Betreff: Anfrage Kooperation / Datennutzung für ein Hochschulprojekt (MaterialMatch)
>
> Guten Tag, wir sind Architekturstudierende der Jade Hochschule und entwickeln das nicht kommerzielle Lernwerkzeug „MaterialMatch“ (Baustoffvergleich).
> Wir möchten gerne ausgewählte baubook-Richtwerte (Wärmeleitfähigkeit, Rohdichte, Wärmekapazität, Diffusionswiderstand, Brandverhalten) mit Quellenangabe in unserer Baustoffdatenbank anzeigen.
> Die AGB untersagen das Einbringen abgefragter Daten in eine eigene Datenbank ohne Kooperationsvereinbarung. Unter welchen Bedingungen ist das für ein Studienprojekt möglich?
> Mit freundlichen Grüßen, [Name, Studiengang, Hochschule]

## 2. Hochschule: Normen und Baupreise
Fragt bei der Bibliothek oder im Fachbereich nach: (a) Zugang zu **DIN-Normen** (z. B. DIN 4108-4, DIN EN ISO 10456) über die Hochschule,
(b) Lizenz für die **BKI-Baukostendatenbank**. Bitte auch fragen, ob ihr Zahlenwerte in einem Studienprojekt mit Quellenangabe anzeigen dürft.
Dateien (PDF/Export) in `data/eingang/normen/` bzw. `data/eingang/preislisten/` ablegen.

## 3. IBU.data
**Was ich geprüft habe:** Registrierung (kostenlos) unter https://ibu-epd.com/ibu-data-registrierung/, Download als XML (ILCD).
Laut FAQ ist die Nutzung für „Endanwender zum Zweck der Information und Verwendung zur Gebäudeökobilanzierung“ kostenfrei;
**für andere Nutzungen ist eine gesonderte Lizenzvereinbarung nötig** (info@ibu-epd.com). Ob das Anzeigen in einer öffentlichen Web-App darunter fällt, ist offen.

**Eure Schritte:** Kurze E-Mail an info@ibu-epd.com mit der Frage, ob das Anzeigen einzelner EPD-Kennwerte (GWP) mit Quellenangabe in einem nicht kommerziellen Hochschulprojekt erlaubt ist.
Erst nach einer Zusage registrieren, die XML-Dateien in `data/eingang/ibu/` legen.

## 4. WECOBIS
**Was ich geprüft habe:** Es gibt keinen öffentlichen Sammel-Download. Das Impressum sagt: *„Vervielfältigungen oder anderweitige Verbreitungen … dürfen nur mit Genehmigung vorgenommen werden.“*
(Bayerische Architektenkammer). Die Inhalte sind überwiegend Texte, keine vergleichbaren Zahlen.

**Eure Schritte:** Falls ihr Rückbau/Recycling-Aussagen übernehmen wollt, bei WECOBIS (Kontakt auf https://www.wecobis.de) die Genehmigung zur Wiedergabe kurzer Aussagen mit Quelle erfragen. Sonst bleibt „Recycling“ ein Textfeld ohne Bewertung.

## 5. Preislisten
Ich konnte öffentlich herunterladbare Hersteller-Preislisten selbst lesen und habe sie übernommen (Superglass, Rigips Rigidur, Wienerberger/Koramic Österreich; frühere Runden: Xella, Holcim, Profibaustoffe).
Für Holz (KVH, BSH, BSP), Stahl, Betonstahl, Fliesen, Klinker, Aluminium und Zink habe ich keine öffentlich herunterladbare, nutzbare Liste gefunden.
Wenn ihr bei einem Händler ein Kundenkonto habt (z. B. über ein Praktikumsbüro), könnt ihr dort eine Preisliste als PDF/Excel exportieren und in `data/eingang/preislisten/` legen,
bitte nur, wenn die Weitergabe der Preise erlaubt ist.

## Was ihr nicht tun müsst
Hornbach, Bauhaus, OBI, Baustoffshop, benz24, Contorion, BayWa, Holzland, MEGA und Raab Karcher : ich habe dort keine offiziellen Preis-Downloads oder Datenfeeds gefunden, die ich nutzen darf. Gesperrte Seiten habe ich nicht umgangen. Sollte euch ein Händler einen Datenfeed oder eine Preisliste anbieten, legt sie in `data/eingang/preislisten/` ab.
