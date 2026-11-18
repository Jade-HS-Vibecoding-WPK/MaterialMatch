# Recherche-Protokoll: belegte Werte statt Beispielwerte

Stand: 16.11.2026 (zwei Runden) · Auftrag: „Belege jeden übernommenen Wert mit Quelle, URL, Einheit und Abrufdatum“
(Entscheidung 2 vom 16.11.2026) und „Wenn für bestimmte Angaben ein Zugang zu BKI, DIN oder Händlerangeboten nötig ist,
dokumentiere das als offene Datenlücke und arbeite mit den verfügbaren Quellen weiter“ (zweite Runde).
Alle Dokumente wurden im Original abgerufen (PDF, Textauszug mit `pdftotext`) und die Zahlen dort gelesen, nicht aus
Suchergebnis-Zusammenfassungen übernommen.

**Regeln, die dabei galten**

- Nur öffentlich frei zugängliche Dokumente. Kostenpflichtige Normen (DIN), das BKI-Kostenwerk und Händlerpreise
  wurden **nicht** verwendet; es wurde keine Bezahlschranke umgangen. Nichts wurde geschätzt oder aus Erfahrung ergänzt.
- Jeder übernommene Wert steht im Quellenkatalog (`data/baustoffe.js`) mit Titel, Herausgeber, URL, Abrufdatum,
  Region, Quellenart und Geltung („generisch“ oder „produktspezifisch“, bei Produkten mit Produktname).
- Die Einheit steht am Kennwert selbst. Die Datenart ist „Richtwert“ (belegt, aber nicht für jedes Produkt gültig).
- Was sich nicht belegen ließ, bleibt Beispielwert (nur im Demo-Modus sichtbar, deutlich als „B“ gekennzeichnet)
  oder „nicht verfügbar“.
- **Nennwert und Bemessungswert** der Wärmeleitfähigkeit werden getrennt erfasst (`waermeleitfaehigkeit` = Nennwert λD,
  `waermeleitfaehigkeit_bemessung` = Bemessungswert λB), jeder mit eigener Quelle. Der R-Wert nutzt λB, sonst λD
  (dann deutlich „orientierend, kein Wärmeschutznachweis“).

Abrufdatum aller Quellen: **2026-11-16**.

## 1. Übernommene Werte, Runde 1

| Material | Kennwert | Wert | Einheit | Geltung | Quelle (URL) |
|---|---|---|---|---|---|
| Mineralwolle | Nennwert λD | 0,034 | W/(m·K) | produktspezifisch: ROCKWOOL Fixrock 035, Deutschland | ROCKWOOL Datenblatt Ausgabe 07/2022, https://www.rockwool.com/de/syssiteassets/rw-d/datenblatter/fassade-vhf/db-fixrock-035-rockwool.pdf |
| Mineralwolle | Bemessungswert λB (DIN 4108-4) | 0,035 | W/(m·K) | produktspezifisch (dieselbe Quelle) | wie oben |
| Mineralwolle | Brandverhalten | A1 | Euroklasse | produktspezifisch (dieselbe Quelle) | wie oben („nichtbrennbar, Euroklasse A1“) |
| Mineralwolle | μ | 1 | – | produktspezifisch (dieselbe Quelle) | wie oben („μ = 1“) |
| EPS | Nennwert λD | 0,034 | W/(m·K) | produktspezifisch: BACHL EPS 035 WDV, Deutschland | BACHL Datenblatt Stand 02.04.2024, https://www.bachl.de/wp-content/uploads/2025/08/pdb-bachl-fassadendaemmplatte-eps035wdv-150kpa.pdf |
| EPS | Bemessungswert λ | 0,035 | W/(m·K) | produktspezifisch (dieselbe Quelle) | wie oben („Bemessungswert (D)“) |
| EPS | Brandverhalten | E | Euroklasse | produktspezifisch (dieselbe Quelle) | wie oben („RtF-E“) |
| Zellulose | Nennwert λD | 0,037 | W/(m·K) | produktspezifisch: ISOCELL Zellulose (ETA-06/0076), Österreich/Schweiz | ISOCELL Datenblatt (ohne Datum), https://www.isocell.com/fileadmin/pim_export/documents/PDBL/PDBL_MA_ZELLULOSE_de-CH.pdf |
| Zellulose | Bemessungswert λB | 0,038 | W/(m·K) | wie oben; Datenblatt: Österreich 0,038, Schweiz 0,037 – hier der höhere österreichische Wert | wie oben |
| Zellulose | μ | 3 | – | produktspezifisch (dieselbe Quelle) | wie oben |
| Zellulose | Wärmekapazität | 2110 | J/(kg·K) | Datenblatt: 2,11 kJ/(kg·K), × 1000 umgerechnet | wie oben |
| Zellulose | Brandverhalten | B-s2,d0 | Euroklasse | **nur Österreich und nur ab 100 mm Einbaudicke** | wie oben („Austria: ≥ 100 mm / B-s2, d0“) |
| Normalbeton, Stahlbeton, Hochlochziegel, Porenbeton, Baustahl, Klinker, Dachziegel | Brandverhalten | A1 | Euroklasse | generisch (Einstufung ohne Prüfung), EU/EWR | Entscheidung 96/603/EG, konsolidierte Fassung 12.06.2003, https://eur-lex.europa.eu/legal-content/DE/TXT/PDF/?uri=CELEX:01996D0603-20030612 |

## 2. Übernommene Werte, Runde 2

| Material | Kennwert | Wert | Einheit | Geltung | Quelle (URL) |
|---|---|---|---|---|---|
| Glaswolle (SAGLAN) | Nennwert λD | 0,032 | W/(m·K) | produktspezifisch: SAGLAN (032) SR 30, Schweiz; Rohdichte „ca. 30 kg/m³“ passt zum Datensatz | Sager AG, Produktdatenblatt 03/2012, https://prd-media.crb.ch/media/5286/Produktdatenblatt%20SR%2030.pdf |
| Glaswolle | Brandverhalten | A1 | Euroklasse | („6q.3 / A1“: schweizerische Brandkennziffer und Euroklasse) | wie oben |
| Glaswolle | μ | 1 | – | („MU1“) | wie oben |
| Hanfdämmung | Nennwert λD | 0,041 | W/(m·K) | produktspezifisch: THERMO HANF PREMIUM, ETA-05/0037 vom 6. Mai 2025 (PREMIUM PLUS und COMBI JUTE: 0,043); Rohdichte laut ETA 35–48 kg/m³ passt zum Datensatz (38) | DIBt, https://www.dibt.de/pdf_storage/2025/ETA-05!0037(8.12.01-5!25).pdf |
| Hanfdämmung | Brandverhalten | E | Euroklasse | produktspezifisch (dieselbe ETA) | wie oben |
| Zinkblech (RHEINZINK) | Wärmeleitzahl | 110 | W/(m·K) | Werkstoffeigenschaft der RHEINZINK-Legierung (kein ausdrücklicher Nenn-/Bemessungswert) | RHEINZINK-Produktlinien, © 2025, https://www.rheinzink.de/fileadmin/redaktion/RHEINZINK_DE/Downloads/Technische-Unterlagen/107760-RZ-D-Rheinzink_Produktlinien.20250826082526544__1_-komprimiert.pdf |
| Aluminium, Stahlblech, Zinkblech, Glas, Naturstein hart/weich, Schiefer, Keramikfliese, Kalksandstein, Leichtbetonstein (Bims, Blähton), Faserzement, Kalkzementputz, Zementestrich, Calciumsulfatestrich, Kalkgipsinnenputz, Betondachstein, Schaumglas, Steinwolle | Brandverhalten | A1 | Euroklasse | generisch (Einstufung ohne Prüfung), EU/EWR; Voraussetzungen (höchstens 1 % homogen verteiltes organisches Material, Metalle nicht fein verteilt) stehen im Hinweistext jedes Werts | Entscheidung 96/603/EG (wie oben) |

Zur EU-Entscheidung: Sie gilt für die im Anhang genannten Materialien. Es ist eine generische Einstufung des Materials,
kein Produktnachweis; für ein konkretes Produkt ist dessen Leistungserklärung maßgeblich.

**Ergebnis beider Runden:** 44 belegte Werte außerhalb der ÖKOBAUDAT (141 belegte Kennwerte insgesamt, 90 Beispielwerte,
260 „nicht verfügbar“, 19 „nicht anwendbar“; 50 Baustoffe × 10 Kennwerte = 500 Felder).

## 2b. Runde 3: Produkte, Preise, Zellulose

**Produkte** (`data/produkte.js`): ROCKWOOL Fixrock 035 (Standard), Fixrock 033, Klemmrock 035; BACHL EPS 035 WDV (Standard), EPS 035 DEO dm; ISOCELL Zellulose; STEICOflex 036 und STEICOuniversal (beide ohne Standard, weil die Rohdichte 50 bzw. 270 kg/m³ nicht zum generischen Datensatz mit 160 kg/m³ passt); THERMO HANF PREMIUM; SAGLAN (032) SR 30; RHEINZINK-CLASSIC. Die Werte aus Runde 1 und 2 sind in diese Produkte gewandert; der generische Materialdatensatz enthält nur noch ÖKOBAUDAT-Werte, EU-Einstufungen und Beispieldaten.

Neu gelesen in Runde 3 (Abruf 2026-11-16):

| Dokument | Werte |
|---|---|
| ROCKWOOL Klemmrock 035, Ausgabe 04/2025, https://www.rockwool.com/siteassets/rw-d/datenblatter/schragdach/db-klemmrock-035-rockwool.pdf | λD 0,034; λB 0,035; μ 1; A1 |
| ROCKWOOL Fixrock 033, Ausgabe 07/2022 | λD 0,032; λB 0,033; μ 1; A1 |
| BACHL EPS 035 DEO dm, Stand 03.04.2024, https://www.bachl.de/wp-content/uploads/2025/08/pdb-bachl-mehrzweckdaemmplatten-eps-035-deo-dm.pdf | λD 0,034; λ („Bemessungswert (D)“) 0,035; RtF-E; μ „30/70“ nicht übernommen |
| STEICOflex 036, Technisches Merkblatt Version 20 (2026-11-11) | ρ ca. 50 kg/m³; λD 0,036; λB Deutschland 0,038; μ 2; c 2.100 J/(kg·K); E |
| STEICOuniversal, Version 20 (2026-11-11) | ρ ca. 270 kg/m³; λD 0,048; λB Deutschland 0,050; μ 5; c 2.100; E |
| EPD STEICOflex 036 (SHR-Rapport 23.0053, 10.10.2024, gültig bis 10.10.2029, extern verifiziert), https://www.steico.com/fileadmin/user_upload/Netherlands_Media/Downloads/EPDs/STEICOflex_036/03_EPD_Steicoflex_036.pdf | je 1 m² bei 140 mm, Modul A1–A3, Set 2: GWP gesamt −4,7; fossil 7,1; biogen −12; Landnutzung 0,015 kg CO₂e |

**Preise** (Händler, Produkt, Preis, Einheit, Link, Abrufdatum 2026-11-16, inkl. 19 % MwSt., ohne Transport und Einbau):

| Produkt | Händler | Preis im Original | Umrechnung | Link |
|---|---|---|---|---|
| STEICOflex 036, 1220 × 575 × 100 mm (Art.-Nr. 6887913) | OBI (Verkäufer OBI E-Commerce GmbH) | 31,72 € je Verkaufseinheit (2,81 m²) = 11,29 €/m² | 31,72 ÷ (2,81 × 0,10) = 112,88 €/m³ | https://www.obi.de/p/6887913/steico-flex-036-holzfaserdaemmplatte-1220-x-575-x-100mm |
| ROCKWOOL Klemmrock 035, 120 mm (Art.-Nr. 2093755) | OBI | 65,96 € je Verkaufseinheit (4,0 m²) = 16,49 €/m² | 65,96 ÷ (4,0 × 0,12) = 137,42 €/m³ | https://www.obi.de/p/2093755/rockwool-klemmrock-daemmwolle-klemmfilz-wlg-035-120-mm-steinwolle |

Hinweis zum Abruf: Die OBI-Seiten wurden mit einem browserüblichen User-Agent-Header abgerufen (robots.txt von OBI schließt Produktseiten nicht aus); mit dem Header eines Programms antwortet OBI mit HTTP 404. `tools/pruefe_links.js` prüft Händlerlinks deshalb nicht automatisch, sondern listet sie als „MANUELL“: Bitte die beiden OBI-Links im Browser öffnen und Preis, Packungsinhalt und Dicke mit der Tabelle vergleichen (Preise ändern sich).

Nicht übernommen: **HORNBACH** (Client-Challenge), **BAUHAUS** (HTTP 403, Fehlerseite) und **Allebaupreise.de** („Just a moment“, HTTP 403) blockierten automatische Abrufe; es wurde nichts umgangen. **Globus Baumarkt**: Der Preis 16,49 stand nur in den strukturierten Daten, die Einheit im Seitentext war nicht eindeutig lesbar. Suchergebnis-Zusammenfassungen mit Preisen (andere Stände, Dicken) zählen nicht als Beleg: OBI zeigte beim Abruf für STEICOflex 100 mm 31,72 €, die Suche nannte 30,88 €. BKI: kein Zugang.

**Zellulose, Bemessungswert Deutschland:** Das deutsche ISOCELL-Datenblatt (de-DE, https://www.isocell.com/fileadmin/pim_export/documents/PDBL/PDBL_MA_ZELLULOSE_de-DE.pdf) nennt „Deutschland: 0,039 W/(m·K)“ (Österreich/EU 0,038). Die zugehörige Zulassung Z-23.11-1236 (DIBt-Zulassungsdownload, https://www.dibt.de/de/service/zulassungsdownload/detail/z-2311-1236) war nur bis **26.04.2021** gültig; ein neuerer Bescheid ist nicht aufgeführt. DIN 4108-4 ist kostenpflichtig. Weil weder eine gültige Zulassung noch die Norm vorliegt, bleibt das Feld **leer**; weder der Schweizer (0,037) noch der österreichische Wert (0,038) wird als deutscher Bemessungswert verwendet.

## 2c. Runde 4 (17.11.2026): Tragende Baustoffe und Holz, neues Preisformat

**Neu aufgenommene Produkte** (`data/produkte.js`, jedes mit Hersteller, Quelle, Abrufdatum 2026-11-17):

| Material | Produkt | Gelesene Werte | Quelle |
|---|---|---|---|
| Normalbeton | Holcim Transportbeton C25/30, Art.-Nr. NA4334 (XC4 XF1 XA1, F3, 32 mm, mittlere Festigkeitsentwicklung) – Standardprodukt | **Preis 204,50 €/m³ netto** (Listenpreis, Status „Preisliste“). Sonst nur die Festigkeitsklasse; alle anderen Kennwerte bleiben generisch. | Holcim Preisliste Bereich West, gültig ab 1. Januar 2026, Seite 8, https://www.holcim.de/sites/germany/files/docs/holcim-pl-west_2026-1-s.pdf |
| Porenbeton | Ytong PP 2-0,40 (Planblock) – Standardprodukt | λ 0,10 W/(m·K) (nicht ausdrücklich Nenn- oder Bemessungswert), Rohdichteklasse 0,40. **Kein Preis**: Die Preisliste führt dieses Produkt nicht. | Xella Preisliste 2026, Seite 25 „Übersicht technische Daten“, https://technik.xella.de/media/ressources/allgemein/ytong-porenbeton-silka-kalksandstein-preisliste.pdf |
| Porenbeton | Ytong ThermStandard PP 2-0,35, 365 mm | λ 0,09 W/(m·K); **Preis 210,60 €/m³ netto** (Frankopreis, Frachtzone 0, zzgl. Dünnbettmörtel, Logistikpauschale, Entladung; Status „Preisliste“). Rohdichte und CO₂: „nicht verfügbar“ (Rohdichteklasse 0,35 passt nicht zum generischen Datensatz). | Xella Preisliste 2026, Seite 6 (gültig ab 6. April) |
| Hochlochziegel | Poroton-Planziegel-T8-36,5 – Standardprodukt | λR 0,08 W/(m·K), Rohdichteklasse 0,60, Zulassung Z-17.1-1085. **Kein Preis gefunden.** | https://www.wienerberger.de/produkte/wand/ziegel/poroton-planziegel-t8-36,5.html |
| Konstruktionsvollholz | KVH® (EPD der Überwachungsgemeinschaft, Durchschnitt der Mitgliedswerke) | ρ 480 kg/m³; λ 0,13 W/(m·K) senkrecht zur Faser; **CO₂ je 1 m³, A1–A3**: gesamt −582,6; fossil 188,9; biogen −770,8 kg CO₂e (von uns aus den Modulen A1+A2+A3 addiert). **Kein Preis gefunden.** | IBU-EPD EPD-SHL-20240272-IBG1-DE, ausgestellt 28.04.2026, gültig bis 27.04.2031, extern verifiziert, https://www.rettenmeier.com/fileadmin/PDF/produktinformationen/2026-EPD-konstruktionsvollholz-KVH-de-en-it.pdf |

Alle Bemessungswerte (λB) dieser Produkte bleiben leer: Es liegt weder eine gültige Zulassung noch DIN 4108-4 vor. R-Werte sind deshalb „orientierend“.

**Preisformat:** Jeder Preis steht mit Händler bzw. Herausgeber, Produktname, Hersteller, Variante/Maße, Preis, Einheit, Mehrwertsteuer, Region/Verfügbarkeit, Status, Link und Abrufdatum im Quelleneintrag (`preisangabe`). Status „abgerufen“ = Händlerseite am Abrufdatum; „preisliste“ = Listenpreis des Herstellers mit Gültigkeitsdatum, **nicht** am Abrufdatum bestätigt. Preislisten-Preise sind netto, OBI-Preise brutto: Die Anwendung vergleicht sie deshalb nur mit einem Vorbehalt.

**Zugang geprüft, nicht nutzbar (Stand vor der Hostfreigabe, siehe Abschnitt 2d für den neuen Stand):** EGGER (OSB), Knauf/Rigips/Siniat (Gipsplatten) und mehrere Händler-CDNs waren in dieser Umgebung nicht erreichbar (HTTP 403 des Proxys, Host nicht freigegeben); die gefundenen Datenblätter liegen nur dort. Die Globus-Produktseiten (OSB 3 Kronospan, KVH Binderholz, Knauf GKB, Porenbeton PP2-0,4 Hamann) enthalten keinen auslesbaren Preis (marktabhängig, in den statischen Daten kein Angebot) und werden nicht verwendet. Suchergebnis-Zusammenfassungen (z. B. λ 0,13 für OSB, λ 0,21 für Knauf GKB) zählen nicht als Beleg.

## 2d. Runde 5 (17.11.2026): Hostfreigabe, Preisliste Profibaustoffe, EGGER, Siniat

**Hostfreigabe (von dir bestätigt):** freigegeben wurden `www.siniat.de`, `media.siniat.de`, `binary.egger.link`, `downloads.egger-cdn.com` und `www.profibaustoffe.com` (`www.egger.com` war schon frei). Zur Platzgewinnung (höchstens 20 Hostnamen) wurden entfernt: `www.globus-baumarkt.de`, `harbecke.hagebau.de` (keine auslesbaren Preise), `knauf.com`, `www.rigips.com`, `to.egger.link` (nicht mehr nötig).

**Nicht abrufbar, nicht umgangen:**

| Quelle | Befund | Was fehlt / was nötig wäre |
|---|---|---|
| Knauf (`knauf.com`, Gipsplatten-DoP) | Cloudflare-Sperrseite „Attention Required“, HTTP 403 | Knauf-Leistungserklärung oder -Datenblatt als Datei; die Sperre wird nicht umgangen |
| Rigips (`rigips.com`) | Leitet auf `rigips.at` (Österreich) um; Datenblätter dort nur als österreichische Ausgabe | Deutsches Rigips-Datenblatt/DoP als Datei |
| `www.baustoffshop.de` | Von dir genannt; in dieser Umgebung weder freigegeben noch abrufbar (früher Cloudflare-Sperre) | Preisseiten einzelner Produkte als Datei oder Screenshot mit Datum; es wurde kein Preis übernommen |
| Siniat Produktliste (`siniat.de`) | Produktkacheln werden per JavaScript geladen, ein deutsches LaGyp-Datenblatt wurde nicht gefunden | Deutsches Siniat-Datenblatt (GKB 12,5 mm) |

**Preisliste Profibaustoffe 2026** (https://www.profibaustoffe.com/wp-content/uploads/Profibaustoffe-Preisliste_2026_web.pdf, 188 Seiten, PDF vom Dezember 2025, abgerufen 2026-11-17):

- **Herausgeber und Region:** Profibaustoffe Austria GmbH, Ernstbrunn (Österreich). Laut Titelseite gilt die Liste **ab 01.01.2026 in Wien, Niederösterreich und im nördlichen Burgenland**. **Alle Preise sind exkl. MwSt. und „unverbindliche Preisempfehlungen“** (Fußzeile jeder Preisseite). Es sind **keine deutschen Marktpreise**. Gedruckte Seitenzahl = PDF-Seite minus 2.
- **Übernommen (3 Preise, jeweils als Produkt, nie als Standard):**

| Produkt (Art.-Nr.) | Preis im Dokument | PDF-Seite (gedruckt) | Umrechnung in MaterialMatch |
|---|---|---|---|
| PROFI ESTRICH CT-C20-F4 (E225), Silo (MG), 90035830 2051 0 | 229,35 €/to, exkl. MwSt. | 124 (122) | Verbrauch laut Liste ca. 20 kg/m²/cm: 229,35 × 20 ÷ 10 = **458,70 €/m³** |
| PROFI MZ1 1,2 MM Kalk-Zement-Maschinenputz, Silo, 90035830 1200 3 | 467,85 €/to, exkl. MwSt. | 27 (25) | ca. 14 kg/m²/cm: **654,99 €/m³** |
| PROFI FLIESSBETON DC25/30 (XF1/XF3), Silo mit SMP, 90035830 2294 1 | 415,85 €/to, exkl. MwSt. | 160 (158) | ca. 20 kg/m²/cm: **831,70 €/m³** (Verfüll-/Trockenbeton, kein Transportbeton) |

  Die Umrechnung von €/Tonne auf €/m³ nutzt den „ca.“-Verbrauch der Liste und ist deshalb **orientierend**; sie ist im Quelleneintrag (`umrechnung`) hinterlegt und wird vom Prüfprogramm unabhängig nachgerechnet. Anzeige: Status „Preisliste (kein aktueller Verkaufspreis) – NICHT AKTUELL BESTÄTIGT“, Region „Österreich … nicht Deutschland“, Netto-Angabe und Seitenzahl stehen in der Fußnote.
- **Nicht übernommen:** Alle Fassadendämmplatten (EPS, Steinwolle, Holzfaser, XPS, Seiten 62–71) stehen „auf Anfrage“, also ohne Preis. Gipsplatten, OSB, Ziegel, Porenbeton und Holz-Bauprodukte sind in der Liste nicht als Produkte mit Preis geführt (die Wörter kommen nur in Anwendungshinweisen vor). Weitere Putz-, Mörtel- und Estrich-Zeilen wurden nicht erfasst, weil das MaterialMatch-Material nicht eindeutig zu einer der vielen Varianten passt.

**Neue Produkte mit Datenblatt/Leistungserklärung:**

| Material | Produkt | Gelesene Werte | Quelle |
|---|---|---|---|
| OSB-Platte | EGGER OSB 3 TOP (Standardprodukt) | Rohdichte ≥ 600 kg/m³ (Mindestwert); λ 0,13 W/(m·K); Brandverhalten E „ohne Einschränkung“ (D-s2,d0 nur ab 9 mm und unter Einbaubedingungen); μ „200/150“ nicht übernommen (Bereich); **kein Preis** | Leistungserklärung DOP-734-04 vom 23.06.2026, https://binary.egger.link/pis/dcac4dc2-808c-4c85-a04f-391e93a487e8/EGGER-OSB-DOP-734-04-de |
| Gipsplatte | Siniat LaGyp Typ A (GKB) 12,5 mm, **österreichisches Datenblatt** (kein Standard) | λR 0,21 W/(m·K) (EN ISO 10456); μ 10 (trocken, feucht 4); A2-s1,d0; Rohdichte „≥ 680“ nicht übernommen (Mindestwert passt nicht zum generischen Datensatz mit 800 kg/m³); **kein Preis** | Siniat Produktdatenblatt, Stand April 2026, https://media.siniat.de/pi697528/original/3644402/siniat-at_pdb_lagyp.pdf (Etex Building Performance GmbH, Leonding) |

Die Siniat-EPD „Gipsplatte nach DIN EN 520 und DIN 18180“ (BVG, EPD-BVG-20210344-IBE1-DE, 04.04.2022 bis 03.04.2027) ist ein Branchendurchschnitt und steht schon als ÖKOBAUDAT-Datensatz im Gipsplatten-Material; sie liefert keinen produktspezifischen Wert.

## 2e. Runde 6 (17.11.2026), Datenpaket 1: herstellerspezifische ÖKOBAUDAT-Datensätze

**Anlass:** Die Nutzer:innen haben eine Liste mit Anbietern, Preislisten und Datenbanken (PDF „MaterialMatch – Anbieter und Datenquellen“, 8 Seiten) übergeben und die systematische Erweiterung der Datenbank gewünscht.

**Bestandsaufnahme vorher:** 50 Baustoffe, 21 Produkte, 80 Quellen; 29 der 50 Baustoffe hatten kein konkretes Produkt; belegte Preise gab es nur für zwei Produkte (OBI) und wenige Preislisten (Holcim, Xella, Profibaustoffe/Österreich).

**Zugang:** Diese Umgebung erreicht höchstens 20 freigegebene Server (derzeit www.oekobaudat.de, oekobaudat.de, eur-lex.europa.eu, www.dibt.de, technik.xella.de, www.obi.de, www.hagebau.de, www.dyckerhoff.com, genesis.destatis.de, www.egger.com, www.holcim.de, kiwa.com, beton.org, www.rettenmeier.com, www.wienerberger.de, www.siniat.de, www.profibaustoffe.com, binary.egger.link, media.siniat.de, downloads.egger-cdn.com). Die übrigen Anbieter der Liste (zum Beispiel ISOVER, STEICO, Knauf Insulation, URSA, KS-Original, Cirkel, HORNBACH, BAUHAUS, Raab Karcher, IBU, baubook) sind **nicht abrufbar**; für sie wurde nichts übernommen.

**Quelle dieses Pakets:** Die vollständige ÖKOBAUDAT-Datei (Release 2024-II, 44.973 Zeilen, lokal vorhanden, SHA-256 siehe oben) enthält neben generischen Datensätzen (2.144 Zeilen) herstellerspezifische (specific dataset, 14.333 Zeilen) und Durchschnittsdatensätze (average dataset, 27.810 Zeilen; je Lebenszyklusmodul eine Zeile), jeweils mit Rohdichte, GWP (Module A1–A3), Primärenergie (PERT/PENRT in MJ), Registrierungsnummer der EPD und Gültigkeit. Die Datei wurde nach den Anbietern der Liste durchsucht (Spalte „Declaration owner“, nur Zeilen mit Modul A1-A3).

**Übernommen: 12 Datensätze = 12 neue Produkte** (`data/produkte.js`; Quellen `oebd-…` in `data/baustoffe.js`; Zeilen im Auszug `data/quellen/oekobaudat_2024-II_auszug.csv`). Jedes Produkt hat nur die Kennwerte **Rohdichte** und **GWP** (je ein eigener ÖKOBAUDAT-Datensatz), keinen Preis und ist nicht als Standardprodukt vorgewählt:

| Material | Produkt | Hersteller | Datensatz (UUID-Anfang, Typ) | Bezug | Rohdichte | GWP gesamt (A1–A3) |
|---|---|---|---|---|---|---|
| Porenbeton | Ytong Porenbeton 2.5/0.40 (Hersteller-EPD) | Xella Deutschland GmbH | 880239e9, specific | 1 m³ | 383 kg/m³ | 172,0 kg CO₂e |
| OSB-Platte | EGGER OSB-Platten (Durchschnitts-EPD) | Fritz EGGER GmbH & Co. OG | 766ea5bd, average | 1 m³ | 611 kg/m³ | −805,4 kg CO₂e |
| OSB-Platte | Kronospan OSB (Hersteller-EPD) | Kronospan Luxembourg S.A. | 22527f3b, specific | 1 m³ | 630 kg/m³ | −1.219,7 kg CO₂e |
| Brettsperrholz | HASSLACHER Brettsperrholz (CLT) | HASSLACHER Holding GmbH | 7688e355, average | 1 m³ | 470 kg/m³ | −660,1 kg CO₂e |
| Brettschichtholz | HASSLACHER Brettschichtholz (BSH) | HASSLACHER Holding GmbH | e8cf2935, average | 1 m³ | 470 kg/m³ | −608,4 kg CO₂e |
| Konstruktionsvollholz | HASSLACHER Konstruktionsvollholz und GLT | HASSLACHER Holding GmbH | 792a0e85, average | 1 m³ | 470 kg/m³ | −695,8 kg CO₂e |
| Holzfaserdämmung | GUTEX Pyroresist | GUTEX Holzfaserplattenwerk | a612d5a0, average | 1 m³ | 190 kg/m³ | 28,2 kg CO₂e |
| XPS | JACKODUR EVO | JACKON Insulation GmbH | cddad814, specific | 1 m³ | 34,37 kg/m³ | 103,8 kg CO₂e |
| EPS | SAGEX expandiertes Polystyrol (EPS grau-weiß) | Sager AG (Schweiz) | 29396128, specific | 1 m³ | 20 kg/m³ | 54,6 kg CO₂e |
| Gipsplatte | Knauf Fireboard (GKF, 20 mm) | Knauf Gips KG | 69430bba, specific | 1 m² bei 20 mm | 820 kg/m³ (berechnet) | 3,88 kg CO₂e je m² |
| Gipsplatte | Knauf Silentboard GKF (12,5 mm) | Knauf Gips KG | ba2a4652, specific | 1 m² bei 12,5 mm | 1.400 kg/m³ (berechnet) | 1,40 kg CO₂e je m² |
| Calciumsulfatestrich | Knauf FE 50 Largo | Knauf Gips KG | 899c73e4, specific | 1 kg | 1.600 kg/m³ | 0,0364 kg CO₂e je kg |

- **Link und Nachweis je Wert:** Jeder Datensatz hat eine Quelle `oebd-<UUID-Anfang>` mit Titel, Eigner, Version, Typ, Bezugsjahr, Gültigkeit, https-Link auf den ÖKOBAUDAT-Datensatz (alle 12 am 17.11.2026 mit HTTP 200 erreichbar) und der Registrierungsnummer der EPD (IBU). Gelesen wurde der ÖKOBAUDAT-Datensatz, nicht die EPD-Datei selbst.
- **Primärenergie** hat in der Datenstruktur kein eigenes Feld. Die Werte PERT und PENRT (MJ je Bezugsgröße, Module A1–A3) stehen deshalb als beschrifteter Text im Hinweis des GWP-Kennwerts; das Prüfprogramm vergleicht diese Zahlen mit der CSV.
- **Berechnet (gekennzeichnet):** Bei Knauf Fireboard und Silentboard weist der Datensatz keine Rohdichte aus. Sie ist als Flächengewicht ÷ Schichtdicke berechnet (16,4 kg/m² ÷ 0,02 m; 17,5 kg/m² ÷ 0,0125 m) und im Hinweis als „von uns berechnet“ benannt. Die GWP-Werte dieser beiden Platten gelten je m² nur bei der Dicke des Datensatzes (20 mm bzw. 12,5 mm); bei anderer Dicke zeigt die Seite „nicht berechenbar“ mit Begründung.
- **Geltung und Grenzen:** Durchschnittsdatensätze (average dataset) gelten für den Durchschnitt des Herstellers über mehrere Produkte oder Werke, nicht für ein einzelnes Produkt; die Datensätze HASSLACHER (Gültigkeit 2021, bis 2026), GUTEX (bis 2027) und EGGER (bis 2029) sind so gekennzeichnet. Das Land steht im Datensatz (zum Beispiel Ytong: Rumänien, Knauf: weltweit, SAGEX: Schweiz). Es werden nur CO₂ und Rohdichte aus den Datensätzen übernommen, keine Wärmeleitfähigkeit, Brandklasse, Druckfestigkeit oder Preise: Die Hersteller-Datenblätter dazu waren nicht abrufbar (Knauf: Cloudflare-Sperre) oder wurden nicht gelesen.
- **Die Standardprodukte bleiben unverändert.** Ytong PP 2-0,40 und EGGER OSB 3 TOP bekommen keine CO₂-Werte; der Ytong-Datensatz heißt „2.5/0.40“, seine Zuordnung zum Planblock „PP 2-0,40“ ist im Datensatz nicht ausgewiesen und steht deshalb als eigenes Produkt. Würde ein Standardprodukt produktspezifische CO₂-Werte tragen, wäre das Material beim Start nicht mehr direkt mit generischen Materialien vergleichbar.

**Geprüft, aber nicht übernommen:**

| Datensatz | Grund |
|---|---|
| Austrotherm UNIPLATTE (a118aeff, XPS) | Die Zeile ist in sich widersprüchlich: Flächengewicht 3,18 kg/m² passt nicht zu Rohdichte 28 kg/m³ × Schichtdicke 0,02 m (= 0,56 kg/m²). Ohne Klärung wird kein Wert übernommen. |
| Austrotherm Resolution Fassade (a6b0c08a) | Phenolharz-Hartschaum; die Datenbank hat kein Material dafür. |
| RHEINZINK-CLASSIC (e3086b26), SAGLAN Glaswolle (ceaaae5b) | Genau diese Datensätze sind schon das generische Material „Zinkblech“ bzw. „Glaswolle“ (3,0023 kg CO₂e je kg; 1,345 kg CO₂e je kg); ein Produkt brächte keine neue Information. |
| Holcim (404 Datensätze), CEMEX (17), Heidelberg Materials (8) | Es sind Zemente (je 1.000 kg), kein Transportbeton; die Datenbank hat kein Zement-Material. |
| Rockpanel (ROCKWOOL A/S), Xella Multipor und Hebel, Kronospan MDF/HDF, Knauf Safeboard/GIFAfloor/Deckenplatten, Sto, Sika, ARDEX, Bauder, Swisspearl, VELUX | Die Datenbank hat kein passendes Material (Fassadenplatten, Mineraldämmplatte, Faserplatten, Trockenestrich-Elemente, Mörtel, Bahnen, Fenster). |
| Anbieter ohne ÖKOBAUDAT-Datensatz mit Modul A1–A3 | Wienerberger, STEICO, ISOVER, KS-Original, Siniat, fermacell, Braas, CREATON, ERLUS, Pollmeier, PREFA, Swisspearl u. a.: Für sie gibt es in der ÖKOBAUDAT keinen verwendbaren Datensatz; die Herstellerseiten sind größtenteils nicht freigegeben. |

**Prüfung:** `tools/pruefe_gegen_csv.js` vergleicht jetzt auch alle Produktwerte mit ÖKOBAUDAT-Quelle Zahl für Zahl mit der CSV (24 Werte: 12 × Rohdichte und GWP; zusätzlich die Primärenergie im Hinweis); eine absichtlich verfälschte Zahl wurde gemeldet. Neu: `tests/test42.js` (Datenbestand, Handrechnung je Produkt aus dem Auszug, Bedienung jedes Produkts in der Oberfläche in beiden Datenmodi, Dickenprüfung, Alternativen, CSV-Export).

**Bilanz Datenpaket 1:** +12 Produkte (21 → 33), +12 Quellen (80 → 92, davon ÖKOBAUDAT 49 → 61), +24 produktspezifische Kennwerte (12 Rohdichten, 12 CO₂-Kennwerte mit Primärenergie im Hinweis), +0 Preise. Materialien mit mindestens einem Produkt: 15 → 19.

## 2f. Runde 6 (17.11.2026), Datenpaket 2: Preislisten und Herstellerseiten (Ziegel, Kalksandstein, Porenbeton, Beton, Holzwerkstoffe)

**Vorgabe der Nutzer:innen:** Zunächst nur die bereits freigegebenen Server nutzen (Xella, Wienerberger, Holcim, Dyckerhoff, EGGER, Siniat, OBI, hagebau, Profibaustoffe). Weitere Server (Reihenfolge: STEICO, ISOVER, Knauf Insulation, KS-Original, Cirkel) nur einzeln auf Rückfrage. Primärenergie bleibt nur als Text. Kein Wert wird erfunden.

**Methode:** Die Dokumente wurden mit einem ehrlichen Programmnamen („MaterialMatch-Studienprojekt/1.0“) abgerufen. Das Erzeugungsskript liest jede Zahl aus dem heruntergeladenen Dokument (PDF-Text bzw. Produktseite) und bricht ab, wenn sie dort nicht steht; die Tabellenzeilen wurden zusätzlich von Hand geprüft. Alle neuen Preise stehen im Status „Preisliste“ (Listenpreis, am Abrufdatum nicht bestätigt), netto, mit Seite bzw. Artikelnummer, Region, Gültigkeitsangabe und Link. Abrufdatum: 2026-11-17.

### Übernommen: 29 neue Produkte, 4 ergänzte Bestandsprodukte, 29 neue Quellen

| Gruppe | Material | Produkte (neu) | Gelesene Werte | Quelle |
|---|---|---|---|---|
| **Xella Ytong** | Porenbeton | ThermUltra PP 2-0,30 (365 mm), ThermSuper PP 2-0,35, ThermStrong PP 4-0,50, ThermCombi PP 4-0,50, ThermCombi PP 6-0,65 (je 365 mm) | λ 0,07 / 0,08 / 0,10 / 0,12 / 0,18 W/(m·K); Festigkeitsklasse 2 / 2 / 4 / 4 / 6; Listenpreise 452,70 / 242,20 / 452,70 / 223,40 / 243,80 €/m³ (netto, Franko) | Xella Preisliste 2026, Seite 6 (PDF-Seite 8) und Seite 7, https://technik.xella.de/media/ressources/allgemein/ytong-porenbeton-silka-kalksandstein-preisliste.pdf |
| **Xella Silka** | Kalksandstein | Classic KS 3 DF (175 mm), Classic KS 5 DF (240 mm), Solid KS 3 DF, Solid KS 5 DF (Kleinformat); XL Basic Solid 175 mm und 240 mm | λ 0,99 (Classic) bzw. 1,10 (Solid, XL) W/(m·K); Druckfestigkeitsklasse 12 bzw. 20; Preise je 1.000 Stück 1.678,00 / 2.844,00 / 1.922,00 / 3.256,00 € (umgerechnet über das Steinvolumen: 353,56 / 349,56 / 404,97 / 400,20 €/m³); XL: 50,07 bzw. 68,66 €/m² Wandfläche (gilt nur bei 175 bzw. 240 mm) | Xella Preisliste 2026, Seite 30 (Kleinformat), Seite 33 (XL Basic), technische Daten Seite 50 und 52 |
| **Wienerberger Poroton** | Hochlochziegel | Planziegel T9, T10, T12, T14 (DFK 12) je 36,5 cm; T6-P, T7-P, T7-MW, S8-P, S9-P, S9-MW, S10-MW (36,5 cm; P = Perlit, MW = Mineralwolle gefüllt) | λR 0,06 bis 0,14 W/(m·K); Druckfestigkeitsklasse 4 bis 12; im Hinweis: Rohdichteklasse, fk, Abmessung, Zulassungsnummer | Wienerberger-Produktseiten (technische Daten), z. B. https://www.wienerberger.de/produkte/wand/ziegel/poroton-planziegel-t10-36,5.html |
| **Holcim** | Normalbeton | Transportbeton C30/37 (NA5334) 209,50 €/m³, C35/45 (NA6334) 216,50 €/m³ | Listenpreis netto; Druckfestigkeitsklasse 30 bzw. 35 (aus der Klassenbezeichnung) | Holcim Preisliste Bereich West, gültig ab 1. Januar 2026, Seite 8 (siehe Hinweis zum Abruf) |
| **Dyckerhoff** | Normalbeton | Beton C25/30 (A 3043 Q000) 164,00 €/m³, C30/37 (A 3753 Q000) 166,00 €/m³; **ECODUR 30** C25/30 (Y 3044 Q001) 169,00 €/m³ und **ECODUR 40** C25/30 (Y 3044 Q102) 174,00 €/m³ (CO₂-reduzierte Betone) | Basis-Preis netto; Festigkeitsklasse; ECODUR: Herstellerangabe „mindestens 30 % bzw. 40 % CO₂-Reduktion nach CSC-Modul“ nur als Text, kein GWP-Wert | Dyckerhoff Preisliste Niederlassung Hamburg, gültig ab 01.01.2026, Seite 3 und 5, https://www.dyckerhoff.com/documents/d/dyckerhoff/pl-hamburg-2026?download=true |
| **EGGER** | OSB | OSB 3 E0 (Ergo Board) | λ 0,13 W/(m·K); Rohdichte ≥ 600 kg/m³ (Mindestwert); Brandverhalten E (D-s2,d0 nur ab 9 mm unter Einbaubedingungen) | Leistungserklärung DOP-732 vom 23.03.2026, https://binary.egger.link/pis/a6594f2c-4aac-4e77-b7c3-f52ffb051b00/DOP-732-OSB3E0-ErgoBoard-de |

- **Ergänzte Bestandsprodukte** (nur die Druckfestigkeitsklasse aus derselben Quelle; sie bleiben Standardprodukt): Ytong PP 2-0,40 (2), Ytong ThermStandard 365 (2), Poroton-Planziegel-T8-36,5 (6), Holcim C25/30 NA4334 (25). Außerdem wurde der Quellentitel „Seite 25“ der Ytong-Übersicht auf „Seite 26“ korrigiert (gedruckte Seitenzahl der technischen Übersicht in der heutigen Fassung der Liste), und der Leistungsumfang-Text des Ytong-ThermStandard-Preises erhielt dieselbe Formulierung wie alle neuen Xella-Preise.
- **Was „Druckfestigkeit“ hier bedeutet:** Wie im Materialdatensatz bisher (Ziegel: Steindruckfestigkeit, Porenbeton: Festigkeitsklasse, Beton: Festigkeitsklasse) steht der **Klassenwert in N/mm²**, nicht eine gemessene Festigkeit. Bei Beton ist die Zahl der Klassenbezeichnung entnommen (C30/37 → 30, charakteristische Zylinderdruckfestigkeit nach DIN EN 206). Die Mauerwerksfestigkeit fk (zum Beispiel Poroton T10: 2,80 MN/m²; Silka Classic: 5,4 bis 7,5 N/mm² je Mörtelgruppe) steht nur im Hinweis.
- **Vergleichbarkeit:** Die Anwendung bewertet Preise nur dann als direkt vergleichbar, wenn Einheit, Mehrwertsteuer und Leistungsumfang gleich sind. Die Xella-Preise (Ytong und Silka) und die Betonpreise (Holcim und Dyckerhoff) haben deshalb denselben Leistungsumfang-Text („Frankopreis laut Preisliste, ohne Mörtel, Logistikpauschale und Entladung“ bzw. „Listenpreis Transportbeton, ohne Zuschläge, Betonförderung und Einbau“); das ist durch die jeweiligen Listen gedeckt. Silka-XL-Preise je m² gelten nur bei der Dicke der Liste; bei anderer Dicke zeigt die Seite „nicht berechenbar“ mit Begründung.

### Nicht übernommen und Gründe

| Quelle / Wert | Grund |
|---|---|
| **hagebau** (www.hagebau.de, Produktseiten mit Preis in den strukturierten Daten, z. B. Hebel Porenbetonstein 11,5 × 20 × 60 cm 3,49 €, H+H Multiplatte 2,49 €; binderholz KVH) | Die Seite nennt **keine Mehrwertsteuerangabe** (der Preis steht nur in den strukturierten Daten); ohne bekannte Steuerangabe darf ein Preis nicht übernommen werden (Regel des Prüfprogramms). Beim KVH fehlt außerdem der zweite Querschnittsmaß. |
| **OBI** (www.obi.de) | Mit dem ehrlichen Programmnamen antwortet OBI mit HTTP 404 (Bot-Abwehr); nicht umgangen. Die zwei früheren OBI-Preise bleiben. |
| **Holcim** (www.holcim.de) | Beim erneuten Abruf am 17.11.2026 antwortete die Website mit „Forbidden Request“ (HTTP 403); die früher geladene Preisliste Bereich West (Stand 28.09.2026 laut Datei, gültig ab 1. Januar 2026) wurde gelesen. Weitere Bereiche (Nord, Süd, Ost) waren nicht abrufbar. |
| **Siniat Deutschland** (www.siniat.de) | Produktseiten und Datenblätter werden per JavaScript geladen; weder ein Datenblatt noch eine Leistungserklärung ist im Seitentext verlinkt. Das österreichische Datenblatt (LaGyp) liegt schon vor. |
| **Wienerberger Preise** | Wienerberger veröffentlicht keine Preise (nur „Preislisten und Konditionen“ für Kunden). Rohdichte in kg/m³ steht nur als Klasse; das „Gewicht Stück“ (z. B. 13,5 kg) wurde nicht in eine Rohdichte umgerechnet. |
| **Dyckerhoff andere Regionen** | Es gibt Preislisten je Niederlassung (z. B. Rhein-Ruhr, Thüringen, Rhein-Main-Taunus, Weser-Ems); ein Produkt hat im Modell nur einen Preis, deshalb wurde nur Hamburg übernommen. Die anderen Listen sind heruntergeladen und lesbar. |
| **EGGER OSB 4 TOP, Spanplatte, MDF** | Auf den erreichbaren EGGER-Seiten stehen für OSB 3 Dokumente (DoP, EHD, Materialkennwerte), aber keine auffindbare Leistungserklärung für OSB 4 TOP oder Spanplatten. Materialkennwerte (μ-Werte hängen von der Luftfeuchte ab) wurden nicht als Einzelwert übernommen. |
| **Ytong: Rohdichte und CO₂** | Die Liste nennt nur Rohdichteklassen; Rohdichte und CO₂ stehen als „nicht verfügbar“. Ytong-Brandverhalten (Euroklasse) steht nicht in der Preisliste. |
| **Primärenergie** | Keine Änderung (Entscheidung der Nutzer:innen): bleibt nur als Text bei den ÖKOBAUDAT-Produkten aus Datenpaket 1. |

### Bilanz Datenpaket 2
+29 Produkte (33 → 62), +29 Quellen (92 → 121), davon **17 Preise** (Xella 11, Holcim 2, Dyckerhoff 4), **23 λ-Werte**, **28 Druckfestigkeitsklassen** (+4 bei Bestandsprodukten), 1 Brandverhalten und 1 Rohdichte (EGGER OSB 3 E0); zusammen **74 neue Kennwerte**. Materialien mit mindestens einem Produkt: 19 → 20 (neu: Kalksandstein). Nach wie vor ohne Preis: alle Poroton-Ziegel, EGGER OSB 3 E0. Weiterhin ohne eigene CO₂-Werte: alle Produkte dieses Pakets (die ÖKOBAUDAT enthält für Wienerberger, Silka und Dyckerhoff keine Datensätze mit Modul A1–A3; Holcim und CEMEX nur Zemente).

## 2g. Runde 7 (18.11.2026), Datenpaket 3: STEICO, ISOVER, Knauf Insulation, KS-Original, Cirkel

**Anlass:** Die Nutzer:innen haben Datenpaket 3 bestätigt („STEICO, ISOVER, Knauf, KS-Original und Cirkel ergänzen; nur belegte Angaben, Quellen sichtbar, fehlende Werte klar als nicht belegt kennzeichnen“). Die Match-Punkte bleiben relativ (Vergleich innerhalb eines Einsatzbereichs), eine absolute Skala ist nicht nötig.

**Zugang:** Die Server-Freigabe wurde für die Umgebung beantragt und bestätigt: `www.steico.com`, `www.isover.de`, `www.knaufinsulation.de`, `www.ks-original.de`, `www.cirkel.de`; später `knauf.com` und `downloads.cirkel.de` (dort liegen die Cirkel-Dokumente). Weil höchstens 20 Server freigegeben werden können, wurden fünf nicht mehr benötigte entfernt (destatis, rettenmeier, kiwa, beton.org, hagebau; ihre Daten sind schon eingepflegt). Abruf mit dem Programmnamen „MaterialMatch-Studienprojekt/1.0“; Abrufdatum aller neuen Quellen: **2026-11-18**.

### Übernommen: 13 neue Produkte, 22 neue Quellen, 1 ergänztes Bestandsprodukt

| Anbieter | Material | Produkte | Gelesene Werte | Quelle |
|---|---|---|---|---|
| **STEICO** | Holzfaserdämmung | STEICOtherm (ρ ca. 160), STEICOtherm dry (ca. 110), STEICOspecial dry (ca. 140), STEICOuniversal dry **35 mm** (ca. 210) | λD 0,038 / 0,037 / 0,040 / 0,045; λB Deutschland 0,040 / 0,039 / 0,042 / 0,047 W/(m·K); μ 5 / 3 / 3 / 3; c 2.100 J/(kg·K); Euroklasse E; **CO₂ (EPD, je m³, A1–A3): GWP gesamt −203 / −103 / −135 / −202, fossil 75,1 / 84,1 / 107 / 161 kg CO₂e** (biogen −278 / −188 / −243 / −363; luluc 0,600 / 0,387 / 0,571 / 0,843) | Technische Merkblätter Version 20 (2026-11-11), www.steico.com/fileadmin/… (je Produkt); EPD Global NEPD-11337-11337-2, NEPD-11388-11388-2, NEPD-11332-11332-2, NEPD-11389-11389-2 (ausgestellt 27.03. bzw. 08.04.2026, gültig 5 Jahre) |
| **STEICO** (Bestandsprodukt) | Holzfaserdämmung | STEICOuniversal (ρ 270) | **nur CO₂ ergänzt:** gesamt −310, fossil 148, biogen −459, luluc 1,11 kg CO₂e je m³ | EPD Global NEPD-11336-11336-2 (27.03.2026 bis 26.03.2031) |
| **Cirkel** (PORIT Porenbeton) | Porenbeton | Planstein 365 mm: PP 2/0,35 (λR 0,08 und 0,09), PP 2/0,40, PP 4/0,50, PP 6/0,65 | λR 0,08 / 0,09 / 0,10 / 0,12 / 0,18 W/(m·K); Festigkeitsklasse 2 / 2 / 2 / 4 / 6; **Preis 334,00 / 308,00 / 301,00 / 304,00 / 309,00 €/m³** (netto, frei Baustelle, Art.-Nr. 21096–21100) | Cirkel Preisliste 2026 für den Baustoffhandel, gültig ab 01.01.2026, Seite 30, https://downloads.cirkel.de/cirkel-preisliste-2026 |
| **KS-ORIGINAL** (Kalksandstein, Preis über Cirkel) | Kalksandstein | KS 2 DF SFK 12 – RDK 1,8; KS 2 DF SFK 20 – RDK 2,0; KS 3 DF SFK 12 – RDK 1,8; KS 3 DF SFK 20 – RDK 2,0 | Steindruckfestigkeitsklasse 12 bzw. 20; λ ≤ 0,99 (RDK 1,8) bzw. ≤ 1,1 W/(m·K) (RDK 2,0); **Preis 374,26 / 410,25 / 340,77 / 419,83 €/m³** (aus 1.167,25 / 1.279,50 / 1.617,25 / 1.992,50 € je 1.000 Stück über das Steinvolumen); Rohdichte aus Steingewicht ÷ Volumen berechnet (ca. 1.683 / 1.908 / 1.694 / 1.877 kg/m³, als „von uns berechnet“ gekennzeichnet) | KS-ORIGINAL-Produktseiten (www.ks-original.de/produkt/…) und Cirkel-Preisliste 2026, Seite 12 (Art.-Nr. 18313, 18979, 18316, 18432) |

- **Nicht belegt, deshalb ausdrücklich „nicht verfügbar“ (mit Begründung, ohne Quelle):** Preise der STEICO-Produkte (kein verlässlicher Händlerpreis abgerufen); Bemessungswert λB der PORIT- und KS-Produkte (kein Bemessungswert nach DIN 4108-4 oder Zulassung gelesen); Rohdichte und CO₂ der PORIT-Produkte (nur Rohdichteklasse bekannt); CO₂ der KS-Produkte mit Rohdichteklasse 1,8 (der generische Datensatz gilt für 2.000 kg/m³). Das verhindert, dass ein unpassender generischer Wert still weiterverwendet wird.
- **Gekennzeichnet statt verschwiegen:** Die STEICO-EPDs sind mit dem EPD-Tool „Emidat“ erstellt; das Tool wird laut Erklärung jährlich von einem unabhängigen Dritten geprüft, eine Einzelprüfung der EPD nennt die Erklärung nicht. Deshalb steht der CO₂-Wert als **Richtwert (R)**, nicht als „verifiziert (V)“. Der GWP-Gesamtwert ist wegen gespeicherten biogenen Kohlenstoffs negativ und wird (wie bisher bei Holz) nicht farbig bewertet; maßgeblich ist der fossile Anteil.
- **STEICOuniversal dry:** Das Merkblatt nennt für 35 mm andere Werte als ab 40 mm (λD 0,045 gegen 0,043; ca. 210 gegen 180 kg/m³; λB 0,047 gegen 0,045). Die EPD gilt für 210 kg/m³ und λ 0,045, also für 35 mm. Deshalb sind genau die 35-mm-Werte übernommen und im Produktnamen genannt; die Werte ab 40 mm stehen nur in der Beschreibung.
- **Kein Standardprodukt:** Alle 13 Produkte sind nicht vorgewählt; die Startwerte der Materialien ändern sich nicht. (STEICOtherm hätte mit 160 kg/m³ zum generischen Datensatz gepasst; das wäre eine Änderung der Startwerte und wurde nicht ohne Rückfrage gemacht.)

### Nicht übernommen und Gründe

| Quelle / Wert | Grund |
|---|---|
| **ISOVER** (www.isover.de) | Die Seite antwortet mit HTTP 403 und `cf-mitigated: challenge` (Cloudflare-Prüfung gegen automatische Abrufe). **Nicht umgangen.** Es wurde kein ISOVER-Produkt aufgenommen. Benötigt: Datenblatt oder Leistungserklärung, die ohne Prüfung abrufbar ist (oder von euch manuell heruntergeladen und abgelegt). |
| **Knauf Insulation** (www.knaufinsulation.de) | Die Adresse leitet auf `knauf.com/de-DE/knaufinsulation` weiter; dieser Server antwortet ebenfalls mit HTTP 403 (Cloudflare). **Nicht umgangen.** Kein Produkt aufgenommen. (Knauf Gips aus Datenpaket 1 ist davon nicht betroffen.) |
| **STEICOzell** (Einblasdämmung) | Das Merkblatt nennt die Rohdichte nur als Spanne („ca. 32 offen bis 35–45 kg/m³ verdichtet“), die EPD gilt je kg. Ohne eindeutige Rohdichte wären Gewicht und CO₂ je m³ eine Annahme. |
| **STEICO weitere Produkte** (flex 036 hat die bisherige Niederländische EPD; floc, timberfloc, safe, protect, top u. a.) | Nur die vier Platten aufgenommen, die zu den Materialien der Datenbank passen und deren Merkblatt und EPD dieselben Werte zeigen. flex 036 bleibt unverändert (dort liegt eine extern verifizierte EPD vor). |
| **KS-ORIGINAL 5 DF (300 mm)** | Steingewicht 13,80 kg (Produktseite) gegen 14,36 kg (Preisliste): fast 4 % Abweichung; deshalb weder Rohdichte noch Preis übernommen. |
| **KS L (Lochsteine), KS-R, KS-RP, KS XL** | Bei Lochsteinen ist unklar, ob die Rohdichteklasse auf das Brutto- oder Nettovolumen zielt; ein berechneter Wert wäre eine Annahme. Die Vollsteine zeigen die Art der Angaben; Ratio-Plansteine nutzen m²-Preise ohne Steinvolumen. |
| **Branchen-EPDs** (Bundesverband Kalksandsteinindustrie M-EPD-KSS-100, Bundesverband Porenbetonindustrie EPD-BPV-20230453-IBG3-EN, beide über Cirkel verlinkt) | Durchschnitt über viele Werke und Rohdichteklassen (Porenbeton: mittlere Rohdichte 428 kg/m³), keine Deklaration eines Produkts; die generischen Datensätze der Datenbank kommen aus derselben Branchenquelle. |
| **Cirkel Preisliste: weitere Produkte** (PORIT 115–300 mm, PORIT XL, KS-Ratio, CIRCOSICHT-Verblender) | Aufnahme je Wanddicke wäre eine lange Liste ohne neue Aussage; 365 mm entspricht den Xella-Produkten und ist damit vergleichbar. Weitere Dicken lassen sich nach demselben Muster ergänzen. |

### Bilanz Datenpaket 3
+13 Produkte (62 → 75), +22 Quellen (121 → 143), **9 neue Preise** (PORIT 5, KS-ORIGINAL 4; Cirkel-Preisliste 2026, netto, Status „Preisliste“), **5 EPD-basierte CO₂-Kennwerte** (STEICO), 17 Wärmeleitfähigkeitswerte (8 STEICO inkl. λB, 5 PORIT, 4 KS), 8 Rohdichten (4 STEICO, 4 KS berechnet) und 9 Festigkeitsklassen (5 PORIT, 4 KS); Materialien mit mindestens einem Produkt: unverändert 20. Prüfung: `tools/pruefe_gegen_csv.js` meldet weiter „Alle Werte stimmen mit der CSV überein“; neu `tests/test49.js` (Erwartungswerte unabhängig aus den Dokumenten, Umrechnungen nachgerechnet, Bedienung in der Oberfläche).

## 2h. Heinze (www.heinze.de), geprüft am 18.11.2026: **nicht als Datenquelle genutzt**

**Anlass:** Die Nutzer:innen besitzen ein Heinze-Konto und wollten Heinze als zusätzliche Quelle für Baustoffdaten nutzen.

**Was geprüft wurde:** Nur öffentliche Seiten mit dem Programmnamen „MaterialMatch-Studienprojekt/1.0“: Startseite, `robots.txt`, Nutzungsbedingungen (`/nutzungsbedingungen/`) und die Seite „Digitale Produktdaten“. Es gab **keine Anmeldung**, keine Zugangsdaten, keine Produktdaten wurden abgerufen oder gespeichert. Die Datenbank blieb unverändert. Der Server wurde dafür vorübergehend freigegeben (`www.heinze.de`).

**Ergebnis:** Technisch sind die öffentlichen Seiten erreichbar (HTTP 200, `robots.txt` erlaubt allgemeine Abrufe mit einigen Ausnahmen). **Die Nutzungsbedingungen verbieten aber genau das, was für MaterialMatch nötig wäre:**
- **§ 1.6:** Es ist untersagt, Inhalte „mittels technischer Hilfsmittel (z. B. Crawler, Spider, Text-/Data-Mining) auszulesen oder in fremde Datenbanken einzuspeichern“.
- **§ 5.4:** „Der systematische und automatisierte Abruf von Heinze-Inhalten, das Erstellen systematischer Sammlungen aus abgerufenen Heinze-Inhalten …“ ist unzulässig.
- **§ 5.1 / 5.2:** Das Nutzungsrecht gilt für eigene und im Auftrag bearbeitete **Projekte** (Recherche und Lesezugriff); die Weitergabe von Inhalten außerhalb eines konkreten Projekts an Dritte ist untersagt; darüber hinaus ist eine schriftliche Zustimmung von Heinze nötig. Das gilt auch für ein bezahltes oder kostenloses Konto.
- Eine Übernahme von Heinze-Inhalten in die MaterialMatch-Datenbank wäre eine systematische Sammlung in einer fremden Datenbank und würde die Inhalte an alle Nutzer:innen der Anwendung weitergeben. **Das ist ohne schriftliche Zustimmung nicht zulässig; deshalb wurde nichts abgerufen oder übernommen.**

**Rechtmäßige Wege:** (1) schriftliche Genehmigung bzw. Datenlizenz bei Heinze anfragen (kundenservice@heinze.de, Tel. +49 5141 5055); (2) einzelne Produkte von Hand im Heinze-Konto nachschlagen und im Browser über „Eigenes Produkt hinzufügen“ für das eigene Projekt erfassen (wird nur im Browser gespeichert, nicht weitergegeben); (3) die Datenblätter und EPDs der **Hersteller selbst** nutzen, wie in den Datenpaketen 1 bis 3 (Herstellerseiten, ÖKOBAUDAT, IBU); (4) die offizielle BIM-&-More-Schnittstelle von Heinze für Revit und ARCHICAD im eigenen Planungsprojekt, nicht als Datenquelle für MaterialMatch.

## 2i. Runde 8 (18.11.2026), MaterialMatch 3.2: weitere Preise, Preisspannen und nicht nutzbare Quellen

**Anlass:** Auftrag „Vollständige Baustoffdatenbank und zuverlässige Match-Funktion“: fehlende Kennwerte (vor allem Preise) aller 50 Baustoffe recherchieren.

**Ausgangslage (Echtdaten-Modus, 500 Kennwert-Felder = 50 × 10):** 138 belegt, 82 nur Beispiel (im Echtdaten-Modus unsichtbar), 261 nicht belegt, 19 nicht anwendbar; belegter Preis bei 1 von 50 Materialien (Standardprodukt) und 33 Produkten.

**Zugang geprüft (nichts umgangen):**
| Quelle | Ergebnis |
|---|---|
| **Heinze** | Nutzungsbedingungen verbieten automatisiertes Auslesen und das Einspeichern in fremde Datenbanken (§ 1.6, § 5.4); nicht genutzt (Abschnitt 2h). |
| **WECOBIS** (www.wecobis.de) | Erreichbar. Die Baustoffgruppen-Seiten enthalten beschreibende Texte (Rohstoffe, Herstellung, Nutzung, Entsorgung), kaum Zahlenwerte; „Vervielfältigungen … nur mit Genehmigung“ der Bayerischen Architektenkammer (Impressum). Nichts übernommen. |
| **baubook** (www.baubook.info) | Öffentliche Informationsseiten; die Materialdatenbank (baubook.at) verlangt eine Anmeldung. Nichts übernommen. |
| **EUR-Lex** | Seit 18.11.2026 antwortet der Server auf Abrufe mit einer Bot-Prüfung (HTTP 202, `x-amzn-waf-action: challenge`, leerer Inhalt); die EU-Entscheidungen zur Brandklasse von Holzprodukten ohne Prüfung waren deshalb nicht lesbar. Nicht umgangen. Die bereits übernommene Entscheidung 96/603/EG bleibt unverändert. |
| **OBI** | Antwortet ohne Inhalt (Bot-Abwehr); nicht umgangen. |
| **Profibaustoffe-Preisliste 2026** (www.profibaustoffe.com, 188 Seiten, Österreich) | Vollständig durchsucht. Dämmstoffe stehen dort „auf Anfrage“ (kein Preis). Echte Listenpreise gibt es für Putze, Estriche und Fließestriche (in €/t mit Verbrauch in kg/m²/cm). |
| **ÖKOBAUDAT** | Enthält kein generisches Stahlbeton-Datensatz mit A1–A3 (nur Betonrohr); der CO₂-Wert von Stahlbeton bleibt deshalb „nicht verfügbar“ (eine eigene Berechnung mit angenommenem Bewehrungsgehalt wäre erfunden). |

**Übernommen:**
- **7 neue Produktpreise** aus der Profibaustoffe-Preisliste 2026 (netto, **Österreich**, unverbindliche Preisempfehlung, Stand 01.01.2026, Status „Preisliste“), umgerechnet über den Verbrauch der Liste (€/t × Verbrauch ÷ 10 = €/m³): Kalk-Gips-Maschinenputz MP2 (538,73) und MP4 (579,00), Kalk-Zement-Maschinenputz MK1 (647,85) und MK3 (651,63), Alphafließestrich 4 mm CA-C20 (887,49), CA-C30 (1.005,29) und 2 mm CA-C20 in Säcken (973,75 €/m³). Keine Standardprodukte.
- **4 Preisspannen für allgemeine Baustoffe** (bisher ohne Preis): Kalksandstein 340,76 bis 419,83 €/m³ (8 Listenpreise Xella Silka und KS-ORIGINAL/Cirkel, Deutschland), Calciumsulfatestrich 887,49 bis 1.005,29 (3), Kalkgipsinnenputz 538,73 bis 579,00 (2), Kalkzementputz 647,85 bis 654,99 (3). Der Wert für Berechnungen ist der **Median** der Einzelpreise, die Spanne (min, max, Anzahl) steht am Kennwert. Jede Spanne hat eine eigene Quelle der Art „Preisspanne (berechnet aus Listenpreisen mehrerer Produkte)“ mit allen Einzelquellen; sie gilt für **kein** bestimmtes Produkt, mischt Qualitäten und ist im Hinweis so benannt. Die drei Österreich-Spannen sind ausdrücklich als „Preise nicht für Deutschland“ gekennzeichnet.
- **Nicht angefasst:** Materialien mit Beispielpreis im Demo-Modus (z. B. Porenbeton, Normalbeton); sie behalten ihren Demonstrationswert, die Preisspanne ersetzt nur leere Felder.

**Bilanz Preise:** Materialien mit belegtem Preis 1 → 5 von 50; Produkte mit Preis 33 → 40; belegte Kennwerte 138 → 142; nicht belegt 261 → 257. **Die übrigen 45 Materialien haben weiterhin keinen belastbaren Preis** (Gründe und alle weiteren Lücken: `DATENLUECKEN.md`).

## 2j. Runde 9 (18.11.2026), MaterialMatch 3.3: Händlerpreise und Prüfung weiterer Quellen für alle zehn Kennwerte

**Anlass:** Auftrag „Ergänze systematisch sämtliche fehlenden Baustoffkennwerte“ (Materialpreis, GWP, λ-Nennwert, λ-Bemessungswert, Rohdichte, Brandverhalten, Druckfestigkeit, μ, spezifische Wärmekapazität, Recycling/Rückbau). Höchste Priorität: Preise.

**Ausgangslage (Echtdaten-Modus, 500 Kennwert-Felder):** 142 belegt, 82 nur Beispiel (unsichtbar), 257 nicht belegt, 19 nicht anwendbar; belegter Preis bei 5 von 50 Materialien. Vor den Änderungen gab es eine Sicherung (`…_vor-kennwerte-haendler.tar.gz`).

**Zugang geprüft (nichts umgangen, keine Zugangsdaten verwendet):**
| Quelle | Ergebnis am 18.11.2026 |
|---|---|
| **bausep.de** | **Genutzt.** Die Produktseiten nennen je Variante (Dicke) Netto- und Bruttopreis je m² öffentlich im Seitenquelltext. 14 Preisspannen daraus berechnet (siehe unten). Nur ein Händler; die Seiten wurden einzeln und mit Pausen gelesen, nicht gespiegelt. |
| **HORNBACH, BAUHAUS, Baustoffshop, benz24, Contorion** | Bot-Abwehr bzw. Sperre bei automatischen Abrufen; nicht umgangen, nichts übernommen. |
| **OBI** | Produktseiten antworteten mit 404 bzw. leer. Die in früheren Runden (16.11.2026) gelesenen OBI-Preise bleiben als Produktpreise erhalten. |
| **Holzland, BayWa Baustoffe, MEGA, Raab Karcher** | Startseiten teils erreichbar, aber keine öffentlich abrufbaren Preise für die benötigten Baustoffe gefunden (Raab Karcher: keine Verbindung). Nichts übernommen. |
| **IBU (ibu-epd.com), epd-online.com** | ibu-epd.com: HTTP 503; epd-online.com ist die Erstellungsplattform mit Anmeldung. Keine EPD-Werte übernommen. Die CO₂-Werte kommen weiter aus der ÖKOBAUDAT (lokaler Datenstand zuerst geprüft, 49 von 50 Materialien belegt). |
| **WECOBIS** | Erreichbar; enthält überwiegend beschreibende Texte statt Zahlenwerte. Impressum: „Vervielfältigungen … nur mit Genehmigung“ der Bayerischen Architektenkammer. Nichts übernommen (Recycling/Rückbau bleibt deshalb ohne belegten Wert). |
| **baubook** | Öffentliche Seiten ohne Kennwerttabellen; Materialdatenbank nur nach Anmeldung. Nichts übernommen. |
| **Heinze, EUR-Lex, Normen** | Wie in 2h und 2i: nicht nutzbar (Nutzungsbedingungen, Bot-Prüfung, kostenpflichtig). |

**Übernommen: 14 Preisspannen aus bausep.de** (Quellen `haendlerspanne-bausep-<material>`, jede mit allen Einzelpreisen, Produktnamen, Links und Abrufdatum 18.11.2026). Rechenweg: Netto-Preis je m² (Brutto ÷ 1,19 bzw. `basePrice` des Shops) ÷ Dicke der Variante = €/m³; je Produkt der Median seiner Varianten; Wert für Berechnungen = Median dieser Produktwerte; angezeigt werden Minimum, Maximum, Zahl der Produkte und Preisvarianten. Alle Preise netto, ohne Versand, Einbau und Verschnitt.

| Material | Median €/m³ | Spanne | Produkte / Preise |
|---|---|---|---|
| XPS | 178,47 | 156,22 bis 282,35 | 8 / 53 |
| PUR | 224,09 | 185,57 bis 376,05 | 1 / 9 |
| PIR | 262,66 | 217,07 bis 524,79 | 5 / 39 |
| Glaswolle | 84,03 | 52,17 bis 219,75 | 3 / 21 |
| Steinwolle | 367,23 | 179,20 bis 485,29 | 5 / 26 |
| Schaumglas | 512,59 | 483,33 bis 513,66 | 1 / 6 |
| Mineralwolle (allgemein) | 96,92 | 49,16 bis 231,75 | 20 / 145 |
| EPS | 126,13 | 111,76 bis 197,48 | 19 / 136 |
| Holzfaserdämmung | 250,88 | 82,77 bis 526,37 | 26 / 89 |
| OSB | 498,60 | 497,67 bis 509,92 | 1 / 5 |
| Konstruktionsvollholz | 843,83 | 833,77 bis 852,01 | 1 / 3 |
| Porenbeton | 161,12 | 161,09 bis 195,80 | 3 / 10 |
| Gipsfaserplatte (12,5 mm) | 8,32 €/m² | 8,28 bis 8,40 | 3 / 3 |
| Bitumenbahn | 5,40 €/m² | 4,00 bis 13,27 | 7 / 7 |

**Wichtig für die Nutzung:** Diese Werte sind **Richtwerte mit Spanne, keine Marktpreise**. Sie gelten nur im **Echtdaten-Modus**. Im Demo-Modus bleiben die Beispielpreise und die bisherigen Lücken unverändert (Feld `echt` am Kennwert, siehe PROJEKTDOKUMENTATION.md „MaterialMatch 3.3“); dadurch ändern sich die Demo-Ergebnisse und die Präsentation nicht. Die Spannen sind breit, weil Qualität, Wärmeleitgruppe, Dichte und Hersteller stark streuen; ein Preisvergleich mit weiteren Händlern steht aus.

**Bilanz (Echtdaten-Modus):** belegt 142 → **156**, nicht belegt 257 → **249** (82 Beispielwerte, davon 6 jetzt durch belegte Preise ersetzt, 76 bleiben unsichtbar), Materialien mit belegtem Preis 5 → **19 von 50**, Produkte mit Preis 40 (unverändert). **Technische Kennwerte** (λ, λB, Rohdichte, Brandverhalten, Druckfestigkeit, μ, Wärmekapazität) und **GWP** wurden in dieser Runde **nicht** ergänzt: Es gab keine frei und rechtlich sicher nutzbare, maschinenlesbare Quelle (Normen kostenpflichtig, Herstellerseiten und Portale gesperrt oder anmeldepflichtig). Jede einzelne Lücke mit Grund: `DATENLUECKEN.md`.

## 3. Gelesen, aber bewusst nicht übernommen

| Dokument | Grund |
|---|---|
| STEICO flex 036 (λD 0,036; Rohdichte ca. 50 kg/m³; μ 2; c 2.100 J/(kg·K); Brandverhalten E; Version 20), https://www.steico.com/fileadmin/user_upload/importer/downloads/produktinformationen_holzfaser-dmmstoffe/STEICO_technical-data-sheet_flex-036_DEU-AUT-CHE_de_i.pdf | Flexible Matte mit ca. 50 kg/m³. Das Material „Holzfaserdämmung“ nutzt einen ÖKOBAUDAT-Datensatz „Holzfaserdämmplatte (Nassverfahren)“ mit 160 kg/m³. Die Wärmeleitfähigkeit hängt stark von der Dichte ab; die Werte würden nicht zusammenpassen. |
| STEICOuniversal (λD 0,048; Bemessungswert DE 0,050; ca. 270 kg/m³; μ 5; Brandverhalten E; Nassverfahren), https://www.steico.com/fileadmin/user_upload/importer/downloads/produktinformationen_holzfaser-dmmstoffe/STEICO_technical-data-sheet_universal_DEU-AUT-CHE_de_i.pdf | Gleicher Grund: 270 statt 160 kg/m³. |
| BACHL EPS 035 WDV, μ „30/70“ | Bereich statt Einzelwert. Der Beispielwert (30) bleibt Beispieldatum. |
| ROCKWOOL Fixrock 033 (λD 0,032, λB 0,033) | Zweites Produkt derselben Art; je Material wird ein Produkt gewählt (Fixrock 035). |
| THERMO HANF ETA-05/0037: μ „1 bis 2“ | Bereich statt Einzelwert. Bemessungswert: laut ETA „nach nationalen Regeln festzulegen“, nicht in der ETA. |
| THERMO NADELFILZ HANF (Technisches Datenblatt 03/2026) | Anderes Produkt (Trittschalldämmung, Rohdichte 110–165 kg/m³), kein Wärmedämmstoff. |
| ISOCELL Zellulose | Bemessungswert für Deutschland steht nicht im Datenblatt (nur Österreich 0,038 und Schweiz 0,037). |
| RHEINZINK-Broschüre: „Baustoffklasse A1“ | Das ist die deutsche Baustoffklasse (DIN 4102), nicht die Euroklasse. Das Brandverhalten (Euroklasse) kommt deshalb aus der EU-Entscheidung. |
| Xella Zulassung Z-17.1-1051 (Ytong, Brandverhalten A1, μ 5/10) | Gilt für Porenbeton-Flachstürze (Zuggurt PSF 4,5-600), nicht für die Wandsteine des Materials „Porenbeton (P2 04)“. Der Ytong-Download „Der massive Wärmedämmstein“ ist nicht mehr abrufbar. |
| MM-Holz Leistungserklärungen (Brettsperrholz, Brettschichtholz) | Die Dokumente waren unter den gefundenen Adressen nicht abrufbar (HTTP 404). Suchergebnis-Zusammenfassungen (Euroklasse D-s2,d0) zählen nicht als Beleg. |

## 4. Offene Datenlücken (Zugang oder Quelle fehlt)

| Lücke | Betroffen | Grund / was nötig wäre |
|---|---|---|
| **Preise** | alle Materialien außer den Produkten mit Preisliste (Xella, Holcim, Dyckerhoff, Profibaustoffe, Cirkel/KS-ORIGINAL, PORIT), STEICOflex 036 und ROCKWOOL Klemmrock 035 („Preis nicht verfügbar“ bzw. Beispielwert im Demo-Modus) | BKI-Baupreise sind kostenpflichtig; HORNBACH, BAUHAUS und Allebaupreise.de blockieren automatische Abrufe. Weitere frei abrufbare Händlerseiten (OBI-Produktseiten) sind möglich, jeder Preis braucht ein Produkt mit passendem Datenblatt und die Dicke, für die er gilt. |
| **Bemessungswerte nach DIN 4108-4** | alle Materialien außer Mineralwolle, EPS, Zellulose | Die Norm ist kostenpflichtig; ein Herstellerwert wurde nicht gefunden (Hanf: ETA verweist auf nationale Regeln). |
| **Druckfestigkeit, λ, μ, Wärmekapazität der Tragstoffe** (Beton, Ziegel, Porenbeton, Kalksandstein, Holz) | Tragende Baustoffe, Fassade | Stehen in kostenpflichtigen Normen (DIN EN 1992, DIN EN 1996, DIN 4108-4, DIN EN ISO 10456) oder in Produktdatenblättern einzelner Hersteller. Hinweis aus der Suche (nicht als Beleg gelesen): DIBt-Zulassungen für Unipor-Ziegel (Z-17.1-347, -636, -968) nennen Bemessungswerte λB und Druckfestigkeiten; sie gelten je Ziegeltyp und Mörtelgruppe und müssten einem Produkt zugeordnet werden. |
| **Holzfaserdämmung als Startwert** | Holzfaserdämmung | Seit Datenpaket 3 gibt es mit STEICOtherm (ca. 160 kg/m³, Nassverfahren) ein passendes Produkt mit Datenblatt und EPD; es ist aber (noch) nicht Standardprodukt, deshalb startet das Material weiter mit dem generischen Datensatz. |
| **XPS** | XPS | Das λ des Datenblatts (Styrodur 3035 CS) hängt von der Dicke ab (z. B. Bemessungswert 0,035 bis 0,039 W/(m·K)); die Anwendung kennt keinen dickenabhängigen Wert. |
| **Isolena Schafwolle** | Schafwolle | Das Datenblatt war nur über Händlerseiten erreichbar (Zugriff verweigert, HTTP 403) und nennt λtr statt Nennwert. |
| **Brandverhalten Holzwerkstoffe, Gipsplatten, Bahnen, organische Dämmstoffe** | Brettsperrholz, BSH, KVH, OSB, Gipskarton, Gipsfaserplatte, EPDM, Bitumenbahn, XPS, PUR, PIR, Kork, Flachs, Schafwolle | Nicht in der EU-Liste (organische Bestandteile) und kein lesbares Produktdokument gefunden. |
| **PUR, PIR, Kork, Flachs, Schaumglas (λ, μ), Bitumenbahn (PYE PV 200 S5, Bauder)** | genannte Dämmstoffe/Bahnen | In dieser Runde nicht gefunden bzw. nicht gesucht (Bitumenbahn: Datenblatt nur über Händlerseite, ohne die benötigten Werte). |
| **Gipsplatte (deutsche Herstellerdaten, Preis)** | Gipsplatte | Knauf blockiert (Cloudflare), Rigips leitet auf Österreich um, Siniat nur mit österreichischem Datenblatt. Benötigt: deutsches Datenblatt/DoP (Knauf, Rigips, Siniat) für GKB 12,5 mm und ein Händlerpreis mit Maßen. |
| **Preis OSB** | OSB-Platte | EGGER und Händlerseiten nennen keinen auslesbaren Preis (Globus: marktabhängig); benötigt: Händlerpreis mit Maßen und Datum oder Preisliste (z. B. Holzhandel). |
| **Deutsche Marktpreise für Estrich, Putz, Beton-Trockenmischungen** | Zementestrich, Kalkzementputz | Die einzige Preisliste dazu (Profibaustoffe) gilt für Österreich. Benötigt: deutsche Preisliste/Händlerseite (z. B. Baustoffshop-Produktseiten als Datei). |
| **Preise Ziegel, KVH/BSH, OSB, Gipsplatte, Porenbeton PP 2-0,40** | genannte Materialien | Wienerberger-Preisliste/Händlerangebot (Poroton), Holzhändler-Angebot oder Preisliste (KVH), Händlerpreise mit Maßen; Ytong PP 2-0,40 steht nicht in der Xella-Preisliste. Dyckerhoff-Preislisten (Beton) sind nur als regionale PDF-Listen auffindbar; Destatis GENESIS liefert nur Preisentwicklungen, keine Produktpreise; BKI-Baupreise ist kostenpflichtig. |
| **Rohdichte und CO₂ Ytong PP 2-0,35, Poroton, Holcim Beton** | die drei Produkte | Leistungserklärung bzw. produktspezifische EPD des Herstellers (Xella, Wienerberger, Holcim) wurden nicht gelesen; bis dahin gilt der generische Datensatz oder „nicht verfügbar“. |

## 5. Wie sich das in der Anwendung auswirkt

- Die belegten Werte erscheinen ohne „B“ als **Richtwert (R)** mit Quellenzeile (Titel, Produkt, Region, Geltung, Abrufdatum, Link)
  in Vergleichstabelle, Quellenübersicht und Export. λD und λB haben je eine eigene Zeile und Quelle.
- Die Seite startet im **Echtdaten-Modus**; die 82 Beispielwerte erscheinen nur im Demo-Modus (Schalter oben oder
  `index.html?modus=demo`), dort gelb mit „B“.
- Ein gelber Hinweis „Nur zur Orientierung …“ erklärt, dass Richtwerte keine verlässliche Produkt- oder Kostenberechnung erlauben.
- Erreichbarkeit der Links: `node tools/pruefe_links.js` (siehe README).
