/* ==========================================================================
   MaterialMatch – Produkte (konkrete Produkte je Material, eigene Produkte)
   --------------------------------------------------------------------------
   Ein Material aus data/baustoffe.js ist ein GENERISCHER Datensatz (ÖKOBAUDAT,
   EU-Einstufung, Beispieldaten). Ein Produkt (data/produkte.js) überschreibt
   davon nur die Kennwerte, die ein Herstellerdatenblatt, eine ETA, eine EPD oder
   ein Händlerpreis belegt. Nutzer:innen können eigene Produkte ergänzen; sie
   werden nur im Browser gespeichert (localStorage) und haben die Datenart „eigen“.

   MM.produkte.init(daten)            Standardprodukte an Ort und Stelle einsetzen
   MM.produkte.liste(materialId)      alle Produkte eines Materials (Katalog + eigene)
   MM.produkte.standardId(id)         Standardprodukt eines Materials oder ""
   MM.produkte.aufloesen(id, pid)     "" / unbekannt -> Standardprodukt oder "generisch"
   MM.produkte.wirksam(id, pid)       Material mit den Werten des gewählten Produkts
   MM.produkte.eigenesErgaenzen(o)    eigenes Produkt prüfen und speichern -> { ok, fehler, produkt }
   MM.produkte.eigenesLoeschen(pid)   eigenes Produkt entfernen
   MM.produkte.pruefe(daten, f, w)    Prüfung der Katalogprodukte (von MM.pruefeDaten aufgerufen)
   Ereignis „mm:produkte“             eigene Produkte wurden geändert
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var SPEICHER = "materialmatch.eigeneProdukte.v1";
  var GENERISCH = "generisch";

  var daten = null;
  var katalog = [];          // Produkte aus data/produkte.js
  var eigene = [];           // Produkte der Nutzer:innen
  var generisch = {};        // Kopie der generischen Eigenschaften je Material (vor dem Einsetzen des Standardprodukts)
  var zwischenspeicher = {}; // wirksame Material-Objekte je "materialId|produktId"
  var speicherOk = true;

  // Eigenschaften, die ein Produkt überschreiben darf, und ihre Einheiten
  var EINHEITEN = {
    rohdichte: ["kg/m³"], waermeleitfaehigkeit: ["W/(m·K)"], waermeleitfaehigkeit_bemessung: ["W/(m·K)"],
    druckfestigkeit: ["N/mm²"], preis: ["€/m³", "€/m²", "€/kg"], wasserdampf_mu: ["–"], waermekapazitaet: ["J/(kg·K)"]
  };
  var ERLAUBT = Object.keys(EINHEITEN).concat(["brandverhalten", "gwp", "recycling"]);

  function klon(x) { return JSON.parse(JSON.stringify(x)); }
  function istZahl(x) { return typeof x === "number" && isFinite(x); }
  function istHttps(u) { return typeof u === "string" && /^https:\/\/[^\s]+$/.test(u); }
  function material(id) { return MM.finde(daten.baustoffe, id); }

  // ---------- Speicher der eigenen Produkte ----------

  function laden() {
    try {
      var roh = root.localStorage && root.localStorage.getItem(SPEICHER);
      var l = roh ? JSON.parse(roh) : [];
      return Array.isArray(l) ? l.filter(function (p) { return p && p.id && p.material && p.name && p.werte; }) : [];
    } catch (e) { return []; }
  }

  function speichern() {
    try { root.localStorage.setItem(SPEICHER, JSON.stringify(eigene)); speicherOk = true; }
    catch (e) { speicherOk = false; }
    return speicherOk;
  }

  // ---------- Eigene Produkte in das Datenformat umsetzen ----------

  function quellenId(p) { return "eigen-quelle-" + p.id; }

  function eigeneQuelle(p) {
    var q = p.quelle || {};
    return {
      id: quellenId(p),
      titel: q.titel || ("Eigene Angabe zu " + p.name),
      herausgeber: q.haendler || p.hersteller,
      url: istHttps(q.url) ? q.url : null,
      datum: null,
      abgerufen: q.abgerufen || null,
      quellenart: "Eigene Angabe der Nutzer:in (nicht geprüft)",
      produkt: p.name,
      region: "–",
      geltung: "produktspezifisch",
      preisangabe: p.werte && p.werte.preis ? { haendler: q.haendler || "–", produktname: p.name, hersteller: p.hersteller, variante: "vom Nutzer nicht näher angegeben", preis: p.werte.preis.wert,
        einheit: p.werte.preis.einheit, mwst: p.werte.preis.mwst, region: "–", verfuegbarkeit: "–", status: "eigen", umrechnung: { art: "direkt", ziel: p.werte.preis.einheit } } : undefined,
      geprueft: false,
      eigen: true,
      verwendung: "Eigene Angaben der Nutzer:in zu einem selbst angelegten Produkt."
    };
  }

  function quellenEintragen(p) {
    if (!daten) return;
    var id = quellenId(p);
    for (var i = daten.quellen.length - 1; i >= 0; i--) if (daten.quellen[i].id === id) daten.quellen.splice(i, 1);
    daten.quellen.push(eigeneQuelle(p));
  }

  function quellenEntfernen(p) {
    var id = quellenId(p);
    for (var i = daten.quellen.length - 1; i >= 0; i--) if (daten.quellen[i].id === id) daten.quellen.splice(i, 1);
  }

  function eigenschaftenAusEigenem(p) {
    var qid = quellenId(p);
    var hw = "Eigene Angabe der Nutzer:in, nicht geprüft.";
    var o = {};
    Object.keys(p.werte).forEach(function (k) {
      var v = p.werte[k];
      if (k === "preis") {
        o.preis = { wert: v.wert, einheit: v.einheit, art: "eigen", quelle: qid, mwst: v.mwst || "unbekannt", umfang: v.umfang || "unbekannt", hinweis: hw };
      } else if (k === "brandverhalten") {
        o.brandverhalten = { wert: v, art: "eigen", quelle: qid, hinweis: hw + " Euroklasse des Baustoffs, nicht Feuerwiderstand eines Bauteils." };
      } else {
        o[k] = { wert: v, einheit: EINHEITEN[k][0], art: "eigen", quelle: qid, hinweis: hw };
      }
    });
    return o;
  }

  function eigenschaftenVon(p) {
    return p.eigen ? eigenschaftenAusEigenem(p) : (p.eigenschaften || {});
  }

  // ---------- Zusammenführen: generischer Datensatz + Produkt ----------

  function zusammenfuehren(basis, ueberschriebene) {
    var e = klon(basis);
    Object.keys(ueberschriebene).forEach(function (k) { e[k] = klon(ueberschriebene[k]); });
    // Wer eine eigene Rohdichte angibt, hat nicht mehr die Dichte des generischen CO₂-Datensatzes:
    // dann darf dessen CO₂-Kennwert (je m³) nicht stehen bleiben.
    if (ueberschriebene.rohdichte && !ueberschriebene.gwp && e.gwp && e.gwp.werte) {
      var r0 = basis.rohdichte && basis.rohdichte.wert, r1 = ueberschriebene.rohdichte.wert;
      if (istZahl(r0) && istZahl(r1) && Math.abs(r0 - r1) > 1e-9) {
        e.gwp = { werte: null, einheit: "kg CO2e", deklarierte_einheit: null, module: null, art: null, quelle: null,
          hinweis: "Nicht verfügbar: Der generische CO₂-Datensatz gilt für eine Rohdichte von " + r0 + " kg/m³, dieses Produkt hat " + r1 +
            " kg/m³. Ohne eigenen CO₂-Kennwert des Produkts (z. B. EPD) wird kein CO₂-Wert angenommen." };
      }
    }
    return e;
  }

  function produktMeta(p, aufloesung) {
    if (!p) return { id: GENERISCH, name: "Generischer Materialdatensatz", hersteller: null, generisch: true, eigen: false, datenblatt: null, beschreibung: "Kein konkretes Produkt: Die Werte stammen aus dem generischen Materialdatensatz." };
    return { id: p.id, name: p.name, hersteller: p.hersteller, generisch: false, eigen: !!p.eigen, datenblatt: p.eigen ? quellenId(p) : (p.datenblatt || null), beschreibung: p.beschreibung || "",
      // Herstellerangaben, die nicht bestätigt sind: nur zur Anzeige, nie in Berechnungen, Diagrammen oder Vergleichen
      herstellerangaben: klon(p.herstellerangaben || []) };
  }

  function produktenListe(materialId) {
    return katalog.filter(function (p) { return p.material === materialId; })
      .concat(eigene.filter(function (p) { return p.material === materialId; }));
  }

  function suche(materialId, produktId) {
    var l = produktenListe(materialId);
    for (var i = 0; i < l.length; i++) if (l[i].id === produktId) return l[i];
    return null;
  }

  function standardId(materialId) {
    var l = katalog.filter(function (p) { return p.material === materialId && p.standard; });
    return l.length ? l[0].id : "";
  }

  function aufloesen(materialId, produktId) {
    if (produktId === GENERISCH) return GENERISCH;
    if (produktId && suche(materialId, produktId)) return produktId;
    return standardId(materialId) || GENERISCH;
  }

  // ---------- Preise umrechnen (nur bei eindeutig bekannten Maßen) ----------
  // Liefert den Preis in der Zieleinheit des Kennwerts (€/m³ oder €/m²) oder null, wenn die Maße nicht ausreichen.
  function umrechnePreis(a) {
    var u = a && a.umrechnung, p = a && a.preis;
    if (!u || !istZahl(p) || !(p > 0)) return null;
    function pos() { for (var i = 0; i < arguments.length; i++) if (!(istZahl(u[arguments[i]]) && u[arguments[i]] > 0)) return false; return true; }
    switch (u.art) {
      case "direkt": return a.einheit === u.ziel ? p : null;
      case "packung_flaeche_dicke": return pos("flaeche_m2", "dicke_m") ? p / (u.flaeche_m2 * u.dicke_m) : null;       // €/Packung, €/Palette → €/m³
      case "packung_flaeche": return pos("flaeche_m2") ? p / u.flaeche_m2 : null;                                      // → €/m²
      case "stueck_volumen": return pos("laenge_m", "breite_m", "hoehe_m") ? p / (u.laenge_m * u.breite_m * u.hoehe_m) : null;   // €/Stück → €/m³
      case "stueck_flaeche": return pos("laenge_m", "breite_m") ? p / (u.laenge_m * u.breite_m) : null;               // €/Stück → €/m²
      case "palette_stueck_volumen": return pos("stueck", "laenge_m", "breite_m", "hoehe_m") ? p / (u.stueck * u.laenge_m * u.breite_m * u.hoehe_m) : null;   // €/Palette → €/m³
      case "tonne_verbrauch": return a.einheit === "€/t" && pos("verbrauch_kg_m2_cm") ? p * u.verbrauch_kg_m2_cm / 10 : null;   // €/t Trockenmörtel → €/m³ über den vom Hersteller genannten Verbrauch (kg je m² und cm Dicke)
      case "laufmeter_querschnitt": return pos("breite_m", "hoehe_m") ? p / (u.breite_m * u.hoehe_m) : null;           // €/m → €/m³
      case "flaeche_dicke": return pos("dicke_m") ? p / u.dicke_m : null;                                              // €/m² → €/m³
    }
    return null;
  }

  // ---------- Das Material mit den Werten eines Produkts ----------

  function wirksam(materialId, produktId) {
    var m = material(materialId);
    if (!m) return null;
    var pid = aufloesen(materialId, produktId);
    var std = standardId(materialId) || GENERISCH;
    var schluessel = materialId + "|" + pid;
    if (pid === std) {
      // Das Standardprodukt steckt schon im Datensatz (oder es gibt keins): dasselbe Objekt wie in MATERIALMATCH_DATA
      m.produktAktiv = produktMeta(pid === GENERISCH ? null : suche(materialId, pid));
      return m;
    }
    if (zwischenspeicher[schluessel]) return zwischenspeicher[schluessel];
    var p = pid === GENERISCH ? null : suche(materialId, pid);
    var c = klon(m);
    c.eigenschaften = p ? zusammenfuehren(generisch[materialId], eigenschaftenVon(p)) : klon(generisch[materialId]);
    c.produktAktiv = produktMeta(p);
    if (MM.datenmodus && MM.datenmodus.fuerModus) c.eigenschaften = MM.datenmodus.fuerModus(c.eigenschaften);
    zwischenspeicher[schluessel] = c;
    return c;
  }

  // ---------- Eigene Produkte: Eingaben prüfen ----------

  var BRAND = ["A1", "A2-s1,d0", "A2-s2,d0", "A2-s3,d0", "B-s1,d0", "B-s2,d0", "B-s3,d0", "C-s2,d0", "D-s2,d0", "E", "F"];

  function eigenesPruefen(o) {
    var fehler = [];
    var B = MM.berechnung;
    var name = String(o.name || "").trim(), hersteller = String(o.hersteller || "").trim();
    if (!material(o.material)) fehler.push("Bitte ein Material wählen.");
    if (!name) fehler.push("Bitte einen Produktnamen eingeben.");
    if (name.length > 80) fehler.push("Der Produktname ist zu lang (höchstens 80 Zeichen).");
    if (!hersteller) fehler.push("Bitte den Hersteller eingeben.");
    var q = o.quelle || {};
    var qtitel = String(q.titel || "").trim();
    var url = String(q.url || "").trim();
    if (url && !istHttps(url)) fehler.push("Der Link muss mit https:// beginnen.");
    var dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(q.abgerufen || ""));
    var datumOk = false;
    if (dm) { var dd = new Date(Date.UTC(+dm[1], +dm[2] - 1, +dm[3])); datumOk = dd.getUTCFullYear() === +dm[1] && dd.getUTCMonth() === +dm[2] - 1 && dd.getUTCDate() === +dm[3]; }
    if (!datumOk) fehler.push("Bitte ein gültiges Abrufdatum angeben (Format JJJJ-MM-TT, z. B. 2026-11-16).");

    var werte = {};
    var felder = [["waermeleitfaehigkeit", "Nennwert λD", 0.001, 500], ["waermeleitfaehigkeit_bemessung", "Bemessungswert λB", 0.001, 500],
      ["wasserdampf_mu", "μ", 0.5, 1000000], ["waermekapazitaet", "Wärmekapazität", 100, 10000], ["rohdichte", "Rohdichte", 1, 25000], ["druckfestigkeit", "Druckfestigkeit", 0.001, 2000]];
    felder.forEach(function (f) {
      var t = o.werte && o.werte[f[0]];
      if (t === undefined || t === null || String(t).trim() === "") return;
      var z = B.parseZahl(String(t));
      if (z.fehler || z.leer) { fehler.push(f[1] + ": " + (z.fehler || "Bitte eine Zahl eingeben.")); return; }
      if (z.wert < f[2] || z.wert > f[3]) { fehler.push(f[1] + ": Der Wert " + z.wert + " liegt außerhalb des plausiblen Bereichs (" + f[2] + " bis " + f[3] + ")."); return; }
      werte[f[0]] = z.wert;
    });
    if (werte.waermeleitfaehigkeit !== undefined && werte.waermeleitfaehigkeit_bemessung !== undefined && werte.waermeleitfaehigkeit_bemessung < werte.waermeleitfaehigkeit) {
      fehler.push("Der Bemessungswert λB darf nicht kleiner sein als der Nennwert λD.");
    }
    var br = o.werte && o.werte.brandverhalten;
    if (br) { if (BRAND.indexOf(br) === -1) fehler.push("Bitte eine Euroklasse aus der Liste wählen."); else werte.brandverhalten = br; }

    var pr = o.werte && o.werte.preis;
    if (pr && String(pr.wert || "").trim() !== "") {
      var z = B.parseZahl(String(pr.wert));
      if (z.fehler || z.leer) fehler.push("Preis: " + (z.fehler || "Bitte eine Zahl eingeben."));
      else if (z.wert <= 0) fehler.push("Preis: Der Preis muss größer als 0 sein.");
      else if (EINHEITEN.preis.indexOf(pr.einheit) === -1) fehler.push("Preis: Bitte die Einheit (€/m³, €/m² oder €/kg) wählen.");
      else werte.preis = { wert: z.wert, einheit: pr.einheit, mwst: pr.mwst || "unbekannt", umfang: pr.umfang || "unbekannt" };
    }
    if (!Object.keys(werte).length) fehler.push("Bitte mindestens einen Kennwert eingeben.");
    if (Object.keys(werte).length && !qtitel) fehler.push("Bitte die Quelle angeben (z. B. Datenblatt, Händlerseite): Jeder Wert braucht einen Beleg.");
    if (werte.preis && !String(q.haendler || "").trim()) fehler.push("Bitte zum Preis den Händler angeben.");

    return { fehler: fehler, name: name, hersteller: hersteller, werte: werte, quelle: { titel: qtitel, url: url, haendler: String(q.haendler || "").trim(), abgerufen: q.abgerufen } };
  }

  function eigenesErgaenzen(o) {
    var r = eigenesPruefen(o);
    if (r.fehler.length) return { ok: false, fehler: r.fehler };
    var p = { id: "eigen-" + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36), material: o.material, name: r.name, hersteller: r.hersteller,
      standard: false, eigen: true, quelle: r.quelle, beschreibung: "Eigenes Produkt (Angaben der Nutzer:in, nicht geprüft).", werte: r.werte };
    eigene.push(p);
    quellenEintragen(p);
    zwischenspeicher = {};
    var ok = speichern();
    document.dispatchEvent(new CustomEvent("mm:produkte", { detail: { id: p.id, gespeichert: ok } }));
    return { ok: true, produkt: p, gespeichert: ok };
  }

  function eigenesLoeschen(pid) {
    var p = null;
    for (var i = 0; i < eigene.length; i++) if (eigene[i].id === pid) { p = eigene.splice(i, 1)[0]; break; }
    if (!p) return false;
    quellenEntfernen(p);
    zwischenspeicher = {};
    speichern();
    document.dispatchEvent(new CustomEvent("mm:produkte", { detail: { id: pid, geloescht: true } }));
    return true;
  }

  // ---------- Prüfung der Katalogprodukte ----------

  function pruefe(d, f, w) {
    var liste = root.MATERIALMATCH_PRODUKTE;
    if (!liste) return;
    var ids = {}, standard = {};
    liste.forEach(function (p) {
      var wo = "Produkt „" + (p.name || p.id) + "“: ";
      if (!p.id) { f("Produkt ohne id."); return; }
      if (ids[p.id]) f(wo + "id kommt doppelt vor."); ids[p.id] = true;
      if (!d.baustoffe.some(function (m) { return m.id === p.material; })) f(wo + "Unbekanntes Material „" + p.material + "“.");
      if (!p.name) f(wo + "Name fehlt.");
      if (!p.hersteller) f(wo + "Hersteller fehlt.");
      if (p.standard) { if (standard[p.material]) f(wo + "Für das Material gibt es mehr als ein Standardprodukt."); standard[p.material] = true; }
      var dbq = d.quellen.filter(function (q) { return q.id === p.datenblatt; })[0];
      if (!dbq) f(wo + "Das Hauptdokument (datenblatt) fehlt im Quellenkatalog.");
      else if (dbq.geprueft !== true) f(wo + "Das Hauptdokument ist nicht als geprüft markiert.");
      (p.herstellerangaben || []).forEach(function (h) {
        var wh = wo + "Herstellerangabe „" + (h.id || "?") + "“: ";
        if (!h.bezeichnung || !h.wert || !h.einheit) f(wh + "Bezeichnung, Wert und Einheit nötig.");
        var hq = d.quellen.filter(function (x) { return x.id === h.quelle; })[0];
        if (!hq) f(wh + "Die Quelle fehlt im Quellenkatalog.");
        else if (hq.geprueft !== true || !/^https:\/\//.test(hq.url || "")) f(wh + "Die Quelle muss geprüft sein und einen https-Link haben.");
        if (!/Herstellerangabe/.test(h.hinweis || "") || !/(kein|nicht)[^.]*(bestätigt|geprüft)/i.test(h.hinweis || "")) f(wh + "Der Hinweis muss sagen, dass es eine Herstellerangabe und kein bestätigter Wert ist.");
      });
      var ei = p.eigenschaften || {};
      Object.keys(ei).forEach(function (k) {
        var e = ei[k], wp = wo + k + ": ";
        if (ERLAUBT.indexOf(k) === -1) { f(wp + "Diese Eigenschaft darf ein Produkt nicht überschreiben."); return; }
        if (EINHEITEN[k] && e.einheit !== undefined && EINHEITEN[k].indexOf(e.einheit) === -1) f(wp + "Einheit „" + e.einheit + "“ ist nicht erlaubt.");
        var hatWert = k === "gwp" ? !!e.werte : (e.wert !== null && e.wert !== undefined);
        if (hatWert) {
          if (e.art !== "richtwert" && e.art !== "verifiziert") f(wp + "Ein Produktwert braucht die Datenart „richtwert“ oder „verifiziert“.");
          var q = d.quellen.filter(function (x) { return x.id === e.quelle; })[0];
          if (!q) f(wp + "Die Quelle „" + e.quelle + "“ fehlt im Quellenkatalog.");
          else {
            if (q.geprueft !== true) f(wp + "Die Quelle ist nicht als geprüft markiert.");
            if (!q.quellenart || !q.region || !q.geltung) f(wp + "Der Quelleneintrag braucht Quellenart, Region und Geltung.");
            if (k === "preis") {
              if (q.quellenart.indexOf("Händlerpreis") !== 0 && q.quellenart.indexOf("Preisliste") !== 0) f(wp + "Ein Preis braucht eine Quelle der Art „Händlerpreis“ oder „Preisliste“ (Händler, Produkt, Link, Abrufdatum).");
              var pa = q.preisangabe;
              if (!pa) f(wp + "Zum Preis fehlt die strukturierte Preisangabe (preisangabe) in der Quelle.");
              else {
                ["haendler", "produktname", "hersteller", "variante", "einheit", "region", "verfuegbarkeit", "status"].forEach(function (k) { if (!pa[k]) f(wp + "preisangabe." + k + " fehlt."); });
                if (!istZahl(pa.preis) || !(pa.preis > 0)) f(wp + "preisangabe.preis muss eine Zahl > 0 sein.");
                if (["abgerufen", "preisliste", "aelter", "geschaetzt"].indexOf(pa.status) === -1) f(wp + "preisangabe.status muss abgerufen, preisliste, aelter oder geschaetzt sein.");
                if (!q.url || !/^https:\/\//.test(q.url) || !q.abgerufen) f(wp + "Der Preis braucht einen https-Link und ein Abrufdatum.");
                if (pa.status !== "abgerufen" && !/(älter|Preisliste|geschätzt|nicht aktuell)/i.test(e.hinweis || "")) f(wp + "Ein Preis, der nicht am Abrufdatum von der Händlerseite stammt (Preisliste, älter, geschätzt), muss im Hinweis ausdrücklich so gekennzeichnet sein.");
                var soll = umrechnePreis(pa);
                var einheitOk = pa.umrechnung && pa.umrechnung.ziel === e.einheit;
                if (soll === null || !einheitOk) f(wp + "Die Umrechnung des Preises ist nicht eindeutig (Maße fehlen oder Zieleinheit passt nicht zur Einheit des Kennwerts).");
                else if (Math.abs(soll - e.wert) > 0.01) f(wp + "Der Preis " + e.wert + " " + e.einheit + " stimmt nicht mit der Umrechnung " + (Math.round(soll * 100) / 100) + " überein.");
              }
              if (!e.mwst || !e.umfang) f(wp + "Mehrwertsteuer (mwst) und Leistungsumfang (umfang) fehlen.");
              if (e.mwst === "unbekannt" || e.umfang === "unbekannt") w(wp + "Mehrwertsteuer oder Leistungsumfang unbekannt – Preise nicht mit anderen vergleichen.");
            }
          }
        } else if (e.art !== null && e.art !== undefined) {
          f(wp + "Ohne Wert darf keine Datenart stehen.");
        } else if (!e.hinweis) {
          f(wp + "Ein fehlender Wert braucht eine Begründung (hinweis).");
        }
      });
    });
  }

  // ---------- Öffentliche Schnittstelle ----------

  MM.produkte = {
    GENERISCH: GENERISCH,
    BRANDKLASSEN: BRAND,
    EINHEITEN: EINHEITEN,

    init: function (d) {
      daten = d;
      katalog = Array.isArray(root.MATERIALMATCH_PRODUKTE) ? root.MATERIALMATCH_PRODUKTE : [];
      d.baustoffe.forEach(function (m) { generisch[m.id] = klon(m.eigenschaften); });
      // Standardprodukt einsetzen: die Anzeigen und Berechnungen sehen dann die Werte des Standardprodukts
      d.baustoffe.forEach(function (m) {
        var sid = standardId(m.id);
        var p = sid ? suche(m.id, sid) : null;
        if (p) m.eigenschaften = zusammenfuehren(generisch[m.id], eigenschaftenVon(p));
        m.produktAktiv = produktMeta(p);
      });
      eigene = laden().filter(function (p) { return material(p.material); });
      eigene.forEach(function (p) { p.eigen = true; quellenEintragen(p); });
    },

    liste: function (materialId) {
      return produktenListe(materialId).map(function (p) {
        return { id: p.id, name: p.name, hersteller: p.hersteller, standard: !!p.standard, eigen: !!p.eigen,
          datenblatt: p.eigen ? quellenId(p) : p.datenblatt, beschreibung: p.beschreibung || "" };
      });
    },
    alle: function () { return katalog.concat(eigene); },
    eigene: function () { return eigene.slice(); },
    standardId: standardId,
    aufloesen: aufloesen,
    wirksam: wirksam,
    leeren: function () { zwischenspeicher = {}; },
    generischeEigenschaften: function (materialId) { return klon(generisch[materialId]); },
    eigenesPruefen: eigenesPruefen,
    eigenesErgaenzen: eigenesErgaenzen,
    eigenesLoeschen: eigenesLoeschen,
    umrechnePreis: umrechnePreis,
    speicherOk: function () { return speicherOk; },
    pruefe: pruefe
  };

  document.addEventListener("mm:daten", function () { if (MM.produkte) MM.produkte.leeren(); });

})(typeof window !== "undefined" ? window : globalThis);
