/* ==========================================================================
   MaterialMatch – Matching-Logik für „Match finden“ (MaterialMatch 3.0)
   --------------------------------------------------------------------------
   Reine Logik ohne Anzeige (damit sie getrennt getestet werden kann). Sie beantwortet:
     „Welche Baustoffe passen zu den Antworten aus dem Interview, und wie gut?“

   Ablauf (in dieser Reihenfolge, nie umgekehrt):
     1. EIGNUNG      Passt das Material laut Datenbank zum Einsatz? Vier Stufen:
                     Geeignet · Bedingt geeignet ·
                     Nicht ausreichend belegt · nicht geeignet (wird nie vorgeschlagen).
     2. AUSSCHLUSS   Harte Anforderungen vor jeder Punktbewertung: Brandschutz (Euroklasse A1, A2 oder B),
                     „natürliche Materialien“ und die gewünschte Materialart. Fehlende Angaben zählen nie als erfüllt.
     3. VERGLEICH    Die Kennwerte der gewählten Kriterien kommen aus der vorhandenen Empfehlungslogik
                     (MM.empfehlung.kriteriumWert: Kosten, CO₂ fossil, λ, Rohdichte, je Dämmwirkung bei Dämmstoffen).
                     Nur Werte auf gleicher Basis werden verglichen (CO₂: gleiches Modul und gleicher Datensatztyp).
     4. SCORE        Je Kriterium ein relativer Wert von 0 bis 1 mit der vorhandenen Normierung MM.bewertung.normalisiere
                     (1 = bester Wert der geeigneten Materialien, 0 = schlechtester). Der Score ist das gewichtete Mittel
                     über die Kriterien, für die das Material einen vergleichbaren Wert hat, mal 100.
                     Fehlende Werte werden NICHT als 0 und nicht als 1 gewertet, sondern ausgelassen und genannt.
                     Sind weniger als 60 % des Gewichts belegt, ist der Score „vorläufig“ und die Platzierung wird abgewertet;
                     es gibt keinen Score, wenn nichts oder nur der Preis vorliegt.
     5. FALLBACK     Passung je Material: voll · eingeschränkt belegt · teilweise (Wunsch nicht erfüllt) · Anforderung nicht erfüllt.
                     Gibt es weniger als drei belastbare Treffer, kommen gekennzeichnete Alternativen dazu (nie als „Match“ ausgegeben);
                     Brandschutz ist zwingend, „natürlich“ und Materialart sind Wünsche, die sich lockern lassen (optionen.gelockert).

   Der Score ist eine Orientierungshilfe, keine bauaufsichtliche Eignungsbestätigung und keine Aussage zu Zulassung,
   Gleichwertigkeit oder Normkonformität. Er ist relativ: er vergleicht die Materialien eines Einsatzbereichs untereinander.

   Die Kostenberechnung und alle Formeln der Anwendung bleiben unverändert; diese Datei rechnet keine Kosten, CO₂-Mengen
   oder Gewichte, sie liest nur die bereits vorhandenen Kennwerte.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};

  // ---------- Fragen und Antwortmöglichkeiten (gemeinsam mit js/interview.js) ----------

  // Einsatzbereiche. „bereiche“: Welche Bereiche der Datenbank (anwendungen) zählen dazu, und mit welcher Eignungsstufe.
  // „zusatz“: einzelne Materialien, die nur unter Bedingungen dazugehören. „ausschluss“: Materialien, die trotz passendem Bereich
  // für diesen Einsatz nicht vorgeschlagen werden (mit Begründung). „schluessel“: Kennwert, der für die Eignung dokumentiert sein sollte.
  var EINSAETZE = [
    { id: "tragwerk", name: "Tragwerk", hinweis: "Tragende Wände, Decken und Stützen",
      bereiche: { tragwerk: "geeignet" }, schluessel: "druckfestigkeit" },
    { id: "aussenwand", name: "Außenwand", hinweis: "Tragende Wandbaustoffe; Dämmung und Fassade wählst du getrennt",
      bereiche: { tragwerk: "geeignet" }, schluessel: "druckfestigkeit",
      ausschluss: { baustahl: "Stahl ist ein Träger- und Stützenwerkstoff, kein Wandbaustoff.", brettschichtholz: "Brettschichtholz ist ein Träger- und Stabwerkstoff, keine Wandbauart." },
      tipp: "Bei Außenwänden ist die Wärmedämmung meist wichtig. Wähle sie in Frage 2 aus." },
    { id: "innenwand", name: "Innenwand", hinweis: "Tragende Wandbaustoffe und Platten für nichttragende Wände",
      bereiche: { tragwerk: "geeignet" }, schluessel: "druckfestigkeit",
      zusatz: {
        gipskarton: "Nur als nichttragende Beplankung auf einer Unterkonstruktion (Trockenbauwand).",
        gipsfaserplatte: "Nur als nichttragende Beplankung auf einer Unterkonstruktion (Trockenbauwand).",
        osb: "Nur als Beplankung (z. B. Holzrahmenwand), nicht als alleinige Wand.",
        spanplatte: "Nur als Beplankung (z. B. Holzrahmenwand), nicht als alleinige Wand.",
        sperrholz: "Nur als Beplankung (z. B. Holzrahmenwand), nicht als alleinige Wand."
      },
      ausschluss: { baustahl: "Stahl ist ein Träger- und Stützenwerkstoff, kein Wandbaustoff.", brettschichtholz: "Brettschichtholz ist ein Träger- und Stabwerkstoff, keine Wandbauart." },
      tipp: "Bei Innenwänden sind Brandschutz und Schallschutz oft wichtig. Für den Schallschutz liegen noch keine ausreichenden Daten vor." },
    { id: "dach", name: "Dach", hinweis: "Dacheindeckung und Dachabdichtung", bereiche: { dach: "geeignet" } },
    { id: "daemmung", name: "Dämmung", hinweis: "Wärmedämmstoffe", bereiche: { waermedaemmung: "geeignet" }, schluessel: "waermeleitfaehigkeit" },
    { id: "fassade", name: "Fassade", hinweis: "Außenbekleidung der Fassade", bereiche: { fassade: "geeignet" } },
    { id: "innenausbau", name: "Innenausbau", hinweis: "Innenbekleidung, Putze, Böden", bereiche: { innenausbau: "geeignet" } }
  ];

  // Kriterien in Frage 2. „datenlage“: Gibt es dafür belegte, vergleichbare Daten in der Datenbank? Wenn nicht, bleibt die Option
  // ausgegraut und fließt nicht in den Score ein. Erst wenn zuverlässige Daten vorhanden sind, wird sie freigeschaltet (true).
  var DATENLAGE_HINWEIS = "Noch keine ausreichenden Daten vorhanden";
  var PRIORITAETEN = [
    { id: "kosten", name: "Niedrige Kosten", kurz: "niedrige Kosten", wegen: "niedriger Kosten", negativ: "höherer Kosten", datenlage: true },
    { id: "co2", name: "Geringe CO₂-Bilanz", kurz: "geringe CO₂-Bilanz", wegen: "geringer CO₂-Bilanz", negativ: "höherer CO₂-Bilanz", datenlage: true },
    { id: "waerme", name: "Gute Wärmedämmung", kurz: "gute Wärmedämmung", wegen: "guter Wärmedämmung", negativ: "schwächerer Wärmedämmung", datenlage: true },
    { id: "gewicht", name: "Geringes Gewicht", kurz: "geringes Gewicht", wegen: "geringen Gewichts", negativ: "höheren Gewichts", datenlage: true },
    { id: "festigkeit", name: "Hohe Festigkeit", kurz: "hohe Festigkeit", wegen: "hoher Festigkeit", negativ: "geringerer Festigkeit", datenlage: true },
    // Für Recycling gibt es nur Freitext, keine vergleichbaren Messwerte:
    { id: "recycling", name: "Gute Recyclingfähigkeit", kurz: "gute Recyclingfähigkeit", wegen: "guter Recyclingfähigkeit", negativ: "", datenlage: false }
  ];
  var ANFORDERUNGEN = [
    { id: "brandschutz", name: "Brandschutz", hinweis: "Baustoffklasse A1, A2 oder B (nach Euroklasse)", datenlage: true },
    // Für Schall- und Feuchteschutz enthält die Datenbank keine bewertbaren Kennwerte:
    { id: "schallschutz", name: "Schallschutz", datenlage: false },
    { id: "feuchteschutz", name: "Feuchteschutz", datenlage: false },
    { id: "natuerlich", name: "Natürliche Materialien", hinweis: "Einordnung durch das Projekt", datenlage: true },
    { id: "keine", name: "Keine besonderen Anforderungen", datenlage: true }
  ];
  var KOSTENRAHMEN = [
    { id: "guenstig", name: "Möglichst günstig" },
    { id: "mittel", name: "Mittleres Preisniveau" },
    { id: "hoch", name: "Höhere Kosten sind akzeptabel" },
    { id: "keine", name: "Keine Preispräferenz" }
  ];
  var MATERIALARTEN = [
    { id: "nachwachsend", name: "Nachwachsende Rohstoffe" },
    { id: "mineralisch", name: "Mineralische Baustoffe" },
    { id: "konventionell", name: "Konventionelle Baustoffe" },
    { id: "keine", name: "Keine Präferenz" }
  ];

  var STUFEN = {
    geeignet: { rang: 0, name: "Geeignet" },
    bedingt: { rang: 1, name: "Bedingt geeignet" },
    undokumentiert: { rang: 2, name: "Nicht ausreichend belegt" },
    nicht: { rang: 3, name: "Nicht geeignet" }
  };

  var EUROKLASSEN = ["A1", "A2", "B", "C", "D", "E", "F"];
  // Mindestanteil der gewählten Kriterien (nach Gewicht), die für ein Material belegt sein müssen, damit ein Score angezeigt wird
  var MIN_ABDECKUNG = 0.6;

  // ---------- Hilfen ----------

  function istZahl(x) { return typeof x === "number" && isFinite(x); }
  function suche(liste, id) { for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i]; return null; }
  function ids(liste) { return liste.map(function (x) { return x.id; }); }
  function aktiv(liste) { return liste.filter(function (x) { return x.datenlage; }); }

  function euroklasse(m) {
    var b = m.eigenschaften.brandverhalten;
    if (!b || !b.wert) return -1;
    var t = /^(A1|A2|B|C|D|E|F)/.exec(String(b.wert));
    return t ? EUROKLASSEN.indexOf(t[1]) : -1;
  }

  // Antworten prüfen und vervollständigen (ungültige oder noch gesperrte Antworten werden entfernt)
  function normalisiereAntworten(a) {
    a = a || {};
    var r = { einsatz: suche(EINSAETZE, a.einsatz) ? a.einsatz : "", prioritaeten: [], anforderungen: [], kosten: "", materialart: "" };
    var okPrio = ids(aktiv(PRIORITAETEN)), okAnf = ids(aktiv(ANFORDERUNGEN));
    (Array.isArray(a.prioritaeten) ? a.prioritaeten : []).forEach(function (p) { if (okPrio.indexOf(p) !== -1 && r.prioritaeten.indexOf(p) === -1) r.prioritaeten.push(p); });
    (Array.isArray(a.anforderungen) ? a.anforderungen : []).forEach(function (p) { if (okAnf.indexOf(p) !== -1 && r.anforderungen.indexOf(p) === -1) r.anforderungen.push(p); });
    if (r.anforderungen.indexOf("keine") !== -1) r.anforderungen = r.anforderungen.length > 1 ? r.anforderungen.filter(function (x) { return x !== "keine"; }) : ["keine"];
    r.kosten = suche(KOSTENRAHMEN, a.kosten) ? a.kosten : "";
    r.materialart = suche(MATERIALARTEN, a.materialart) ? a.materialart : "";
    return r;
  }

  function vollstaendig(a) {
    return !!(a.einsatz && a.prioritaeten.length && a.anforderungen.length && a.kosten && a.materialart);
  }

  // ---------- Stufe 1: Eignung ----------

  // Grundstufe aus der Zuordnung Einsatz → Bereiche der Datenbank
  function eignungGrund(m, einsatz) {
    if (einsatz.ausschluss && einsatz.ausschluss[m.id]) return { stufe: "nicht", text: einsatz.ausschluss[m.id] };
    var stufe = null;
    Object.keys(einsatz.bereiche).forEach(function (b) {
      if (m.anwendungen.indexOf(b) !== -1 && (stufe === null || STUFEN[einsatz.bereiche[b]].rang < STUFEN[stufe].rang)) stufe = einsatz.bereiche[b];
    });
    if (stufe === null && einsatz.zusatz && einsatz.zusatz[m.id]) return { stufe: "bedingt", text: einsatz.zusatz[m.id] };
    if (stufe === null) return { stufe: "nicht", text: "Laut Datenbank nicht für diesen Einsatz vorgesehen." };
    return { stufe: stufe, text: stufe === "geeignet" ? "Laut Datenbank für diesen Einsatz vorgesehen." : "" };
  }

  // Ist der Kennwert dokumentiert, der für die Eignung dieses Einsatzes wichtig ist?
  function schluesselDokumentiert(m, einsatz) {
    if (!einsatz.schluessel) return true;
    var e = m.eigenschaften;
    if (einsatz.schluessel === "druckfestigkeit") return !!(e.druckfestigkeit && istZahl(e.druckfestigkeit.wert) && e.druckfestigkeit.wert > 0);
    if (einsatz.schluessel === "waermeleitfaehigkeit") {
      return [e.waermeleitfaehigkeit, e.waermeleitfaehigkeit_bemessung].some(function (l) { return l && istZahl(l.wert) && l.wert > 0; });
    }
    return true;
  }

  var SCHLUESSEL_NAME = { druckfestigkeit: "Die Druckfestigkeit", waermeleitfaehigkeit: "Die Wärmeleitfähigkeit" };

  // ---------- Stufe 3: Kriterien ----------

  // Welche Kriterien zählen, mit welchem Gewicht? (Gewichte: Auswahl in Frage 2 = 1; Kostenrahmen verändert den Preis)
  function kriterien(a, einsatz) {
    var dm = einsatz.id === "daemmung";
    var gew = {};
    a.prioritaeten.forEach(function (p) { gew[p] = 1; });
    // Kostenrahmen: „günstig“ = starke Preissensibilität, „mittel“ = moderate (halbes Gewicht, günstiger ist nie schlechter),
    // „akzeptabel“ = Kosten werden nicht bewertet, „keine“ = nur wenn in Frage 2 gewählt
    if (a.kosten === "guenstig") gew.kosten = 2;
    else if (a.kosten === "mittel") gew.kosten = gew.kosten ? 1 : 0.5;
    else if (a.kosten === "hoch") delete gew.kosten;
    // Bei Dämmstoffen zählt die Wärmeleitfähigkeit immer mit (wie in der Alternativempfehlung)
    if (dm && !gew.waerme) gew.waerme = 1;
    // Ohne Auswahl: ausgewogene Standardkriterien wie in der Alternativempfehlung
    if (!Object.keys(gew).length) { gew.co2 = 1; if (a.kosten !== "hoch") gew.kosten = 1; }
    var KR = {
      kosten: { key: dm ? "kosten_r" : "kosten", richtung: "niedriger" },
      co2: { key: dm ? "co2_r" : "co2", richtung: "niedriger" },
      waerme: { key: "lambda", richtung: "niedriger" },
      gewicht: { key: "gewicht", richtung: "niedriger" },
      festigkeit: { key: "druck", richtung: "hoeher" }
    };
    return Object.keys(KR).filter(function (id) { return gew[id]; }).map(function (id) {
      var p = suche(PRIORITAETEN, id);
      return { id: id, key: KR[id].key, richtung: KR[id].richtung, gewicht: gew[id], name: p.name, kurz: p.kurz, wegen: p.wegen, negativ: p.negativ };
    });
  }

  function druckWert(m) {
    var d = m.eigenschaften.druckfestigkeit;
    return d && istZahl(d.wert) && d.wert > 0 && d.einheit === "N/mm²" ? { wert: d.wert, art: d.art } : null;
  }

  function kennwertFuer(m, k, quelleFn) {
    if (k.key === "druck") return druckWert(m);
    return MM.empfehlung.kriteriumWert(m, k.key, quelleFn);
  }

  // ---------- Hauptfunktion ----------

  // berechne(antworten) → { antworten, einsatz, kriterien, ergebnisse, ausgeschlossen, hinweise, ... }
  function berechne(antworten, optionen) {
    var daten = (optionen && optionen.daten) || root.MATERIALMATCH_DATA;
    var a = normalisiereAntworten(antworten);
    var einsatz = suche(EINSAETZE, a.einsatz);
    var res = { antworten: a, einsatz: einsatz, kriterien: [], inaktiv: [], ergebnisse: [], ausgeschlossen: [], hinweise: [], poolGroesse: 0, status: "ok", anzahlVoll: 0, begrenzungen: [], lockerung: [], gelockert: [], fallback: { aktiv: false, anzahlVoll: 0 } };
    if (!einsatz) { res.status = "kein_einsatz"; return res; }
    var B = MM.bewertung;
    var quelleFn = function (id) { return id ? MM.finde(daten.quellen, id) : null; };

    // 1. Eignung
    var pool = [];
    daten.baustoffe.forEach(function (b) {
      var m = MM.produkte ? MM.produkte.wirksam(b.id, "") : b;
      var g = eignungGrund(m, einsatz);
      if (g.stufe === "nicht") { res.ausgeschlossen.push({ id: b.id, name: m.name, grund: g.text, art: "eignung" }); return; }
      var stufe = g.stufe, text = g.text;
      if (stufe === "geeignet" && !schluesselDokumentiert(m, einsatz) && !(einsatz.zusatz && einsatz.zusatz[b.id])) {
        stufe = "undokumentiert";
        text = (SCHLUESSEL_NAME[einsatz.schluessel] || "Ein wichtiger Kennwert") + " ist für dieses Material nicht belegt. Die Eignung lässt sich deshalb nicht beurteilen.";
      }
      pool.push({ id: b.id, material: m, stufe: stufe, eignungText: text, bedingungen: [], profil: root.MATERIALMATCH_PROFIL ? root.MATERIALMATCH_PROFIL.materialien[b.id] : null });
    });
    res.poolGroesse = pool.length;

    // 3. Kennwerte auf gemeinsamer Basis (über den ganzen Einsatzbereich, damit die Bewertung stabil bleibt)
    var krit = kriterien(a, einsatz);
    if (MM.empfehlung.setzeLambdaTyp && MM.berechnung) MM.empfehlung.setzeLambdaTyp(MM.berechnung.lambdaVergleichsTyp(pool.map(function (p) { return p.material; })));
    var wertVon = {};      // id → kriterium → { wert, art }
    pool.forEach(function (p) { wertVon[p.id] = {}; });
    var aktivKrit = [];
    krit.forEach(function (k) {
      var liste = [];
      pool.forEach(function (p) { var w = kennwertFuer(p.material, k, quelleFn); if (w) liste.push({ id: p.id, w: w }); });
      var notiz = null;
      // CO₂: nur die größte Gruppe mit gleichem Datensatztyp und gleichen Modulen ist untereinander vergleichbar
      if (k.key === "co2" || k.key === "co2_r") {
        var gruppen = {};
        liste.forEach(function (x) { var s = String(x.w.typ) + "|" + String(x.w.modul); (gruppen[s] = gruppen[s] || []).push(x); });
        var beste = null;
        Object.keys(gruppen).forEach(function (s) { if (!beste || gruppen[s].length > gruppen[beste].length) beste = s; });
        if (beste && Object.keys(gruppen).length > 1) notiz = "CO₂-Werte mit anderem Datensatztyp oder anderen Modulen wurden nicht verglichen.";
        liste = beste ? gruppen[beste] : [];
      }
      if (k.id === "kosten" && MM.bewertung.pruefePreis) {
        var pr = MM.bewertung.pruefePreis(pool.map(function (p) { return p.material.eigenschaften.preis; }));
        if (pr.vorbehalte && pr.vorbehalte.length) notiz = "Preise nur eingeschränkt vergleichbar: " + pr.vorbehalte.join("; ") + ".";
      }
      if (liste.length < 2) { res.inaktiv.push({ id: k.id, name: k.name, grund: liste.length ? "Nur ein Material hat einen vergleichbaren Wert." : "Für keines der Materialien liegt ein vergleichbarer Wert vor." }); return; }
      var n = B.normalisiere(liste.map(function (x) { return x.w.wert; }), k.richtung);
      var gleich = n.status !== "ok";
      liste.forEach(function (x, i) { wertVon[x.id][k.id] = { wert: x.w.wert, art: x.w.art, score: gleich ? 0.5 : n.scores[i], gleich: gleich }; });
      var sortiert = liste.map(function (x) { return x.w.wert; });
      aktivKrit.push({ id: k.id, key: k.key, richtung: k.richtung, gewicht: k.gewicht, name: k.name, kurz: k.kurz, wegen: k.wegen, negativ: k.negativ, anzahl: liste.length, gleich: gleich, notiz: notiz, werte: sortiert });
    });
    res.kriterien = aktivKrit.map(function (k) { return { id: k.id, name: k.name, gewicht: k.gewicht, anzahl: k.anzahl, notiz: k.notiz }; });
    var gesamtGewicht = aktivKrit.reduce(function (s, k) { return s + k.gewicht; }, 0);
    if (!aktivKrit.length) res.hinweise.push("Für die gewählten Kriterien liegen in diesem Einsatzbereich zu wenige vergleichbare Daten vor. Es gibt keine Punktbewertung.");
    if (res.inaktiv.length) res.hinweise.push("Nicht bewertbar (zu wenige vergleichbare Daten): " + res.inaktiv.map(function (x) { return x.name; }).join(", ") + ".");

    // 2. Anforderungen prüfen (zwingend: Brandschutz; Wünsche, die sich lockern lassen: natürlich, Materialart), danach 4. Score
    //    Fehlende Angaben zählen NIE als erfüllt; ein Material wird nur dann ganz weggelassen, wenn es für den Einsatz nicht
    //    geeignet ist. Wer eine Anforderung nicht erfüllt, bleibt als gekennzeichnete Alternative erreichbar (siehe unten).
    var gelockert = (optionen && optionen.gelockert) || [];
    var brandVerlangt = a.anforderungen.indexOf("brandschutz") !== -1;
    var natVerlangt = a.anforderungen.indexOf("natuerlich") !== -1 && gelockert.indexOf("natuerlich") === -1;
    var artVerlangt = !!(a.materialart && a.materialart !== "keine") && gelockert.indexOf("materialart") === -1;
    var artName = artVerlangt ? suche(MATERIALARTEN, a.materialart).name : "";
    var alle = [];
    pool.forEach(function (p) {
      var m = p.material;
      var klassen = p.profil ? p.profil.klassen : [];
      var luecken = [];
      if (brandVerlangt) {
        var k = euroklasse(m);
        if (k > EUROKLASSEN.indexOf("B")) luecken.push({ id: "brandschutz", name: "Brandschutz", art: "zwingend", status: "nicht_erfuellt", text: "Brandschutz: Baustoffklasse " + m.eigenschaften.brandverhalten.wert + " ist schlechter als B." });
        else if (k < 0) {
          luecken.push({ id: "brandschutz", name: "Brandschutz", art: "zwingend", status: "nicht_pruefbar", text: "Brandverhalten nicht dokumentiert, die Brandschutz-Anforderung ist nicht belegt." });
          p.bedingungen.push("Brandverhalten nicht dokumentiert, die Brandschutz-Anforderung ist nicht belegt.");
          if (STUFEN[p.stufe].rang < STUFEN.undokumentiert.rang) { p.stufe = "undokumentiert"; p.eignungText = "Die Baustoffklasse (Brandverhalten) ist nicht dokumentiert, die Anforderung Brandschutz ist daher nicht belegt."; }
        }
      }
      if (natVerlangt && klassen.indexOf("natuerlich") === -1) luecken.push({ id: "natuerlich", name: "Natürliche Materialien", art: "wunsch", status: "nicht_erfuellt", text: "Kein natürlicher Baustoff (Einordnung durch das Projekt)." });
      if (artVerlangt && klassen.indexOf(a.materialart) === -1) luecken.push({ id: "materialart", name: artName, art: "wunsch", status: "nicht_erfuellt", text: "Gehört nicht zu „" + artName + "“ (Einordnung durch das Projekt)." });

      // Score: gewichtetes Mittel der belegten Kriterien. Fehlende Werte werden weder als gut noch als schlecht gezählt,
      // aber die Rangfolge berücksichtigt die Lücke (rangWert), damit ein Material mit wenigen Werten nie allein deshalb vorn liegt.
      var teile = [], sw = 0, sg = 0, fehlt = [], arten = [];
      aktivKrit.forEach(function (k) {
        var w = wertVon[p.id][k.id];
        if (!w) { fehlt.push(k.kurz); return; }
        var besser = 0, schlechter = 0;
        k.werte.forEach(function (x) { if (x === w.wert) return; var b = k.richtung === "hoeher" ? w.wert > x : w.wert < x; if (b) besser++; else schlechter++; });
        sw += k.gewicht * w.score; sg += k.gewicht; arten.push(w.art);
        teile.push({ id: k.id, name: k.name, kurz: k.kurz, wegen: k.wegen, negativ: k.negativ, score: w.score, wert: w.wert, gewicht: k.gewicht, gleich: w.gleich, besserAls: besser, von: k.anzahl });
      });
      var score = null, grundKein = null, vorlaeufig = false, anteil = gesamtGewicht ? sg / gesamtGewicht : 0;
      var nurPreis = teile.length === 1 && teile[0].id === "kosten";
      if (!aktivKrit.length) grundKein = "Es liegen keine vergleichbaren Daten vor.";
      else if (!teile.length) grundKein = "Für dieses Material fehlen die Werte aller gewählten Kriterien.";
      else if (nurPreis) grundKein = "Es liegt nur der Preis vor. Es wird nie allein wegen des Preises bewertet.";
      else { score = Math.round(sw / sg * 100); vorlaeufig = anteil < MIN_ABDECKUNG; }
      var belastbar = arten.indexOf("beispiel") !== -1 ? "Beispieldaten (Demo), nicht belastbar" : arten.indexOf("eigen") !== -1 ? "enthält eigene, nicht geprüfte Angaben" : (arten.length && arten.every(function (x) { return x === "verifiziert"; }) ? "verifizierte Werte" : "Richtwerte");
      var passung = "voll";
      if (luecken.some(function (l) { return l.status === "nicht_erfuellt" && l.art === "zwingend"; })) passung = "nicht_erfuellt";
      else if (luecken.some(function (l) { return l.status === "nicht_erfuellt"; })) passung = "teilweise";
      else if (p.stufe !== "geeignet" || luecken.length) passung = "eingeschraenkt";
      alle.push({
        id: p.id, material: m, stufe: p.stufe, stufeName: STUFEN[p.stufe].name, eignungText: p.eignungText, bedingungen: p.bedingungen,
        score: score, vorlaeufig: vorlaeufig, rangWert: score === null ? -1 : score * (0.6 + 0.4 * anteil), keinScoreGrund: grundKein, kriterien: teile, fehlend: fehlt,
        abdeckung: { belegt: teile.length, von: aktivKrit.length },
        belastbarkeit: belastbar, klassen: klassen, luecken: luecken, passung: passung
      });
    });

    // Reihenfolge: vollständige Treffer, eingeschränkt belegte, Teiltreffer, Alternativen ohne erfüllte Anforderung;
    // darin zuerst die Eignungsstufe, dann der Score (mit Abschlag für fehlende Werte), ohne Score zuletzt.
    var PRANG = { voll: 0, eingeschraenkt: 1, teilweise: 2, nicht_erfuellt: 3 };
    alle.sort(function (x, y) {
      var r = PRANG[x.passung] - PRANG[y.passung];
      if (r) return r;
      r = STUFEN[x.stufe].rang - STUFEN[y.stufe].rang;
      if (r) return r;
      if (x.rangWert !== y.rangWert) return y.rangWert - x.rangWert;
      return x.material.name < y.material.name ? -1 : 1;
    });
    function von(p) { return alle.filter(function (e) { return e.passung === p; }); }
    var voll = von("voll"), eing = von("eingeschraenkt"), teil = von("teilweise"), nicht = von("nicht_erfuellt");
    var zeige = voll.concat(eing);
    // Fallback-System: gibt es weniger als drei belastbare Treffer, kommen gekennzeichnete Alternativen dazu (höchstens fünf insgesamt)
    if (voll.length < 3) zeige = zeige.concat(teil.slice(0, Math.max(0, 5 - zeige.length)));
    if (zeige.length < 3) zeige = zeige.concat(nicht.slice(0, Math.max(0, 5 - zeige.length)));
    var gezeigt = {}; zeige.forEach(function (e) { gezeigt[e.id] = true; });
    alle.forEach(function (e) {
      if (gezeigt[e.id]) return;
      var gr = e.luecken.filter(function (l) { return l.status === "nicht_erfuellt"; }).map(function (l) { return l.text; }).join(" ");
      res.ausgeschlossen.push({ id: e.id, name: e.material.name, grund: gr || "Nicht unter den besten Alternativen.", art: "anforderung" });
    });
    zeige.forEach(function (e) { e.erklaerung = erklaere(e); });
    res.ergebnisse = zeige;
    res.anzahlVoll = voll.length;

    // Was schränkt am stärksten ein? Und was ließe sich lockern?
    var reqs = [];
    if (brandVerlangt) reqs.push({ id: "brandschutz", name: "Brandschutz (Klasse A1, A2 oder B)", art: "zwingend" });
    if (natVerlangt) reqs.push({ id: "natuerlich", name: "Natürliche Materialien", art: "wunsch" });
    if (artVerlangt) reqs.push({ id: "materialart", name: artName, art: "wunsch" });
    res.begrenzungen = reqs.map(function (r) {
      var ne = 0, np = 0;
      alle.forEach(function (e) { e.luecken.forEach(function (l) { if (l.id === r.id) { if (l.status === "nicht_erfuellt") ne++; else np++; } }); });
      return { id: r.id, name: r.name, art: r.art, nichtErfuellt: ne, nichtPruefbar: np, von: alle.length };
    }).sort(function (x, y) { return (y.nichtErfuellt + y.nichtPruefbar) - (x.nichtErfuellt + x.nichtPruefbar); });
    res.lockerung = reqs.filter(function (r) { return r.art === "wunsch"; }).map(function (r) {
      var gewinn = alle.filter(function (e) {
        if (e.passung === "voll") return false;
        var rest = e.luecken.filter(function (l) { return l.id !== r.id; });
        return !rest.length && e.stufe === "geeignet";
      }).length;
      return { id: r.id, name: r.name, gewinn: gewinn };
    }).filter(function (x) { return x.gewinn > 0; });
    res.gelockert = gelockert.slice();
    res.fallback = { aktiv: voll.length === 0 && zeige.length > 0, anzahlVoll: voll.length };
    if (res.fallback.aktiv) res.hinweise.push("Kein Material erfüllt alle Anforderungen vollständig und belegt. Die Karten zeigen die am besten geeigneten Alternativen und sagen jeweils, was nicht erfüllt oder nicht überprüfbar ist.");

    if (!zeige.length) res.status = "keine_treffer";
    else if (!voll.length) res.status = "nur_alternativen";
    else if (!zeige.some(function (e) { return e.score !== null; })) res.status = "ohne_score";
    return res;
  }

  // Erklärung in Worten: warum passt das Material gut oder weniger gut?
  function erklaere(e) {
    var gut = e.kriterien.filter(function (t) { return !t.gleich && t.score >= 0.67; }).map(function (t) { return t.wegen; });
    var schwach = e.kriterien.filter(function (t) { return !t.gleich && t.score <= 0.33 && t.negativ; }).map(function (t) { return t.negativ; });
    var sätze = [];
    function auf(l) { return l.length > 1 ? l.slice(0, -1).join(", ") + " und " + l[l.length - 1] : l[0]; }
    if (e.score === null) sätze.push("Keine Punktbewertung: " + e.keinScoreGrund);
    else {
      if (gut.length) sätze.push("Besonders passend wegen " + auf(gut) + ".");
      if (schwach.length) sätze.push((gut.length ? "Weniger passend wegen " : "Weniger passend wegen ") + auf(schwach) + ".");
      if (!gut.length && !schwach.length) sätze.push(e.kriterien.every(function (t) { return t.gleich; }) ? "Bei den gewählten Kriterien gibt es keinen nennenswerten Unterschied zu den anderen Materialien." : "Liegt bei den gewählten Kriterien im Mittelfeld.");
    }
    if (e.fehlend.length && e.score !== null) sätze.push("Nicht bewertet (kein vergleichbarer Wert): " + e.fehlend.join(", ") + ".");
    if (e.vorlaeufig) sätze.push("Vorläufig: Nur " + e.abdeckung.belegt + " von " + e.abdeckung.von + " Kriterien sind belegt. Fehlende Werte zählen weder als gut noch als schlecht, senken aber die Platzierung.");
    var nicht = e.luecken ? e.luecken.filter(function (l) { return l.status === "nicht_erfuellt"; }) : [];
    var offen = e.luecken ? e.luecken.filter(function (l) { return l.status === "nicht_pruefbar"; }) : [];
    if (nicht.length) sätze.push("Erfüllt nicht: " + nicht.map(function (l) { return l.name; }).join(", ") + ".");
    if (offen.length) sätze.push("Nicht überprüfbar (keine belegten Daten): " + offen.map(function (l) { return l.name; }).join(", ") + ".");
    return sätze.join(" ");
  }

  // Gesamtlinie für die Anzeige: „82/100 Match-Punkte“ (relativ: die Punkte vergleichen die Materialien dieses Einsatzbereichs untereinander)
  function scoreText(e) {
    return e.score === null ? "Datenlage reicht nicht für Match-Punkte" : e.score + "/100 Match-Punkte" + (e.vorlaeufig ? " (vorläufig)" : "");
  }

  MM.matching = {
    EINSAETZE: EINSAETZE,
    PRIORITAETEN: PRIORITAETEN,
    ANFORDERUNGEN: ANFORDERUNGEN,
    KOSTENRAHMEN: KOSTENRAHMEN,
    MATERIALARTEN: MATERIALARTEN,
    MIN_ABDECKUNG: MIN_ABDECKUNG,
    STUFEN: STUFEN,
    DATENLAGE_HINWEIS: DATENLAGE_HINWEIS,
    normalisiereAntworten: normalisiereAntworten,
    vollstaendig: vollstaendig,
    berechne: berechne,
    scoreText: scoreText
  };

})(typeof window !== "undefined" ? window : globalThis);
