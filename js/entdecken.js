/* ==========================================================================
   MaterialMatch 3.5 – Reiter „Entdecken“ (Baustoffe durchsuchen, filtern, sortieren)
   --------------------------------------------------------------------------
   Zeigt alle Baustoffe als Karten oder kompakte Liste. Die Suche arbeitet schon beim Tippen,
   findet Namen, Kategorien, Einsatzbereiche, Herstellerprodukte und gängige Begriffe
   (z. B. „Styropor“ findet EPS). Filter: Kategorie, Einsatzbereich, nur mit belegtem Preis oder CO₂-Wert.
   Sortierung: Name, Preis, CO₂, Wärmeleitfähigkeit (Materialien ohne Wert stehen immer am Ende, nie als „0“).

   Dieses Modul RECHNET NICHTS und ändert keine Daten. Es ruft nur vorhandene Funktionen auf:
   MM.auswahl.setzeAuswahl() (Material in den Vergleich legen), MM.steckbrief.oeffne() (Steckbrief),
   MM.reiter.zeige() (zum Vergleich wechseln). Es liest die Werte des aktuellen Datenmodus
   (Demo: Beispielwerte mit „B“; Echtdaten: nur belegte Werte, fehlende Werte als „fehlt“).
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var el = MM.el;
  var daten = null;
  var f = {};            // Eingabefelder
  var zustand = { text: "", kategorie: "", anwendung: "", sortierung: "name", nurPreis: false, nurCo2: false, ansicht: "karten" };
  var SCHLUESSEL = "materialmatch.entdecken.v1";

  // Suchhilfen: Alltagsbegriffe, die der Baustoffname nicht enthält. Es sind nur Suchwörter, keine Fachaussagen.
  var SYNONYME = {
    eps: "styropor polystyrol hartschaum wdvs", xps: "styrodur polystyrol hartschaum perimeter", pur: "polyurethan hartschaum", pir: "polyisocyanurat hartschaum",
    mineralwolle: "steinwolle glaswolle dämmwolle isolierung", glaswolle: "mineralwolle dämmwolle isolierung", steinwolle: "mineralwolle dämmwolle isolierung",
    holzfaserdaemmung: "holzfaser naturdämmstoff", zellulose: "cellulose einblasdämmung naturdämmstoff", hanfdaemmung: "hanf naturdämmstoff", flachsdaemmung: "flachs naturdämmstoff", kork: "naturdämmstoff", schafwolle: "naturdämmstoff",
    normalbeton: "beton ortbeton", stahlbeton: "beton bewehrt eisenbeton", porenbeton: "ytong gasbeton hebel", kalksandstein: "kalksandstein silka", hochlochziegel: "ziegel backstein mauerziegel poroton",
    brettsperrholz: "bsp clt massivholz", brettschichtholz: "bsh leimholz", konstruktionsvollholz: "kvh bauholz balken", osb: "holzwerkstoff spanplatte grobspan", gipskarton: "trockenbau rigips gipsplatte", gipsfaserplatte: "fermacell trockenbau rigidur",
    baustahl: "stahlträger profil", faserzement: "eternit fassadenplatte", klinker: "verblender", dachziegel: "tondach tonziegel", betondachstein: "dachstein", schiefer: "naturstein dach"
  };

  function norm(s) {
    s = String(s || "").toLowerCase();
    if (s.normalize) s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
    return s.replace(/ß/g, "ss");
  }
  function istZahl(x) { return typeof x === "number" && isFinite(x); }
  function zahl(x) { return MM.berechnung.formatZahl(x); }

  // ---------- Daten je Baustoff (Werte des gewählten Datenmodus, Standardprodukt eingerechnet) ----------
  function wirksam(m) { return MM.produkte && MM.produkte.wirksam ? MM.produkte.wirksam(m.id, "") : m; }

  function kennwerte(m) {
    var e = wirksam(m).eigenschaften;
    var p = e.preis, g = e.gwp, lam = e.waermeleitfaehigkeit;
    var r = { preis: null, co2: null, lambda: null };
    if (p && istZahl(p.wert)) {
      var t = p.spanne && istZahl(p.spanne.min) ? "ca. " + zahl(p.spanne.min) + " bis " + zahl(p.spanne.max) + " " + p.einheit : zahl(p.wert) + " " + p.einheit;
      r.preis = { text: t, art: p.art, wert: p.wert, einheit: p.einheit };
    }
    if (g && g.werte && istZahl(g.werte.fossil)) {
      var bezug = String(g.deklarierte_einheit || "").replace(/^1\s*/, "");
      r.co2 = { text: zahl(g.werte.fossil) + " kg CO₂e/" + bezug, art: g.art, wert: g.werte.fossil, bezug: bezug };
    }
    if (lam && istZahl(lam.wert)) r.lambda = { text: zahl(lam.wert) + " W/(m·K)", art: lam.art, wert: lam.wert };
    return r;
  }

  function anwendungsNamen(m) { return MM.namenAusIds(m.anwendungen, daten.anwendungsbereiche); }
  function kategorieName(m) { return MM.namenAusIds(m.kategorien, daten.kategorien); }

  var index = [];
  function indexBauen() {
    index = daten.baustoffe.map(function (m) {
      var prod = (MM.produkte && MM.produkte.liste ? MM.produkte.liste(m.id) : []).map(function (p) { return p.name + " " + p.hersteller; }).join(" ");
      return { m: m, text: norm([m.name, m.id, kategorieName(m), anwendungsNamen(m), SYNONYME[m.id] || "", prod].join(" ")) };
    });
  }

  // ---------- Filtern und Sortieren ----------
  function passt(eintrag, k) {
    var m = eintrag.m;
    var tokens = norm(zustand.text).split(/\s+/).filter(Boolean);
    if (!tokens.every(function (t) { return eintrag.text.indexOf(t) !== -1; })) return false;
    if (zustand.kategorie && m.kategorien.indexOf(zustand.kategorie) === -1) return false;
    if (zustand.anwendung && m.anwendungen.indexOf(zustand.anwendung) === -1) return false;
    if (zustand.nurPreis && !k.preis) return false;
    if (zustand.nurCo2 && !k.co2) return false;
    return true;
  }

  function sortiert(liste) {
    var s = zustand.sortierung;
    var schl = { preis: "preis", co2: "co2", lambda: "lambda" }[s];
    liste.sort(function (a, b) {
      if (schl) {
        var x = a.k[schl], y = b.k[schl];
        if (!x && !y) return a.m.name.localeCompare(b.m.name, "de");
        if (!x) return 1;          // fehlende Werte immer ans Ende, nie als „0“
        if (!y) return -1;
        // Preise nur innerhalb derselben Einheit sinnvoll vergleichbar: erst €/m³, dann €/m²
        if (schl === "preis" && x.einheit !== y.einheit) return x.einheit === "€/m³" ? -1 : 1;
        return (x.wert - y.wert) || a.m.name.localeCompare(b.m.name, "de");
      }
      return a.m.name.localeCompare(b.m.name, "de");
    });
    return liste;
  }

  function ergebnis() {
    var liste = [];
    index.forEach(function (eintrag) {
      var k = kennwerte(eintrag.m);
      if (passt(eintrag, k)) liste.push({ m: eintrag.m, k: k });
    });
    return sortiert(liste);
  }

  // ---------- Darstellung ----------
  function kennwertZeile(label, v, leer) {
    var z = el("li", null, "ent-kw");
    z.appendChild(el("span", label, "ent-kw-label"));
    var w = el("span", null, "ent-kw-wert" + (v ? "" : " ent-fehlt"));
    if (v) {
      w.appendChild(document.createTextNode(v.text + " "));
      if (v.art && MM.tabelle.ART[v.art]) {
        var a = el("span", MM.tabelle.ART[v.art].kurz, "art art-" + v.art);
        a.title = MM.tabelle.ART[v.art].text;
        w.appendChild(a);
      }
    } else w.textContent = leer;
    z.appendChild(w);
    return z;
  }

  function meldung(text) {
    if (!f.feedback) return;
    f.feedback.textContent = "";
    var s = el("span", text);
    f.feedback.appendChild(s);
    var link = el("button", "Zum Vergleich", "ent-link");
    link.type = "button";
    link.addEventListener("click", function () { MM.reiter.zeige("vergleich"); });
    f.feedback.appendChild(link);
    f.feedback.hidden = false;
  }

  function insVergleich(m) {
    var plaetze = MM.auswahl.holeAuswahl().plaetze;
    var belegt = {};
    plaetze.forEach(function (p) { belegt[String(p.buchstabe).toLowerCase()] = p.material.id; });
    if (plaetze.some(function (p) { return p.material.id === m.id; })) { meldung("„" + m.name + "“ ist schon im Vergleich."); return; }
    var frei = ["a", "b", "c"].filter(function (k) { return !belegt[k]; })[0] || "c";   // sind alle drei belegt, ersetzt der neue Baustoff Material C
    var neu = {}; neu[frei] = m.id;
    MM.auswahl.setzeAuswahl(neu);
    meldung("„" + m.name + "“ ist jetzt Material " + frei.toUpperCase() + " im Vergleich.");
  }

  function karte(eintrag) {
    var m = eintrag.m, k = eintrag.k;
    var li = el("li", null, "ent-karte");
    li.setAttribute("data-material", m.id);
    li.appendChild(MM.materialbilder.element(m.id, { groesse: "klein" }));
    var rumpf = el("div", null, "ent-rumpf");
    rumpf.appendChild(el("h3", m.name, "ent-name"));
    rumpf.appendChild(el("p", kategorieName(m), "ent-kat"));
    var ul = el("ul", null, "ent-kennwerte");
    ul.appendChild(kennwertZeile("Preis", k.preis, "fehlt"));
    ul.appendChild(kennwertZeile("CO₂ (A1–A3)", k.co2, "fehlt"));
    ul.appendChild(kennwertZeile("λ", k.lambda, "fehlt"));
    rumpf.appendChild(ul);
    li.appendChild(rumpf);
    var akt = el("div", null, "ent-aktionen");
    var b1 = el("button", "Zum Vergleich", "btn ent-btn ent-btn-haupt"); b1.type = "button";
    b1.setAttribute("aria-label", m.name + " zum Vergleich hinzufügen");
    b1.addEventListener("click", function () { insVergleich(m); });
    var b2 = el("button", "Steckbrief", "btn ent-btn"); b2.type = "button";
    b2.setAttribute("aria-label", "Steckbrief " + m.name + " öffnen");
    b2.addEventListener("click", function () { MM.steckbrief.oeffne(m.id, b2); });
    akt.appendChild(b1); akt.appendChild(b2);
    li.appendChild(akt);
    return li;
  }

  function aktiveFilter() {
    return [zustand.text, zustand.kategorie, zustand.anwendung, zustand.nurPreis ? "1" : "", zustand.nurCo2 ? "1" : ""].filter(Boolean).length;
  }

  function zeichnen() {
    var liste = ergebnis();
    f.liste.textContent = "";
    f.liste.className = "ent-liste ent-" + zustand.ansicht;
    liste.forEach(function (e) { f.liste.appendChild(karte(e)); });
    var n = aktiveFilter();
    f.anzahl.textContent = liste.length + " von " + daten.baustoffe.length + " Baustoffen" + (n ? " (" + n + (n === 1 ? " Filter" : " Filter") + " aktiv)" : "");
    f.leer.hidden = liste.length > 0;
    f.reset.hidden = n === 0;
    f.ansichtKarten.setAttribute("aria-pressed", zustand.ansicht === "karten" ? "true" : "false");
    f.ansichtListe.setAttribute("aria-pressed", zustand.ansicht === "liste" ? "true" : "false");
    var weitere = (zustand.anwendung ? 1 : 0) + (zustand.nurPreis ? 1 : 0) + (zustand.nurCo2 ? 1 : 0);
    f.weitereZaehler.textContent = weitere ? " (" + weitere + ")" : "";
    speichern();
  }

  function speichern() { try { root.localStorage.setItem(SCHLUESSEL, JSON.stringify({ ansicht: zustand.ansicht, sortierung: zustand.sortierung })); } catch (e) { /* ohne Speicher weiter nutzbar */ } }
  function laden() {
    try {
      var s = JSON.parse(root.localStorage.getItem(SCHLUESSEL) || "null");
      if (s && (s.ansicht === "karten" || s.ansicht === "liste")) zustand.ansicht = s.ansicht;
      if (s && ["name", "preis", "co2", "lambda"].indexOf(s.sortierung) !== -1) zustand.sortierung = s.sortierung;
    } catch (e) { /* ignorieren */ }
  }

  function zuruecksetzen() {
    zustand.text = ""; zustand.kategorie = ""; zustand.anwendung = ""; zustand.nurPreis = false; zustand.nurCo2 = false;
    f.suche.value = ""; f.kategorie.value = ""; f.anwendung.value = ""; f.nurPreis.checked = false; f.nurCo2.checked = false;
    zeichnen();
    f.suche.focus();
  }

  function optionen(select, liste, erste) {
    select.textContent = "";
    var o = document.createElement("option"); o.value = ""; o.textContent = erste; select.appendChild(o);
    liste.forEach(function (x) { var op = document.createElement("option"); op.value = x.id; op.textContent = x.name; select.appendChild(op); });
  }

  MM.entdecken = {
    ergebnis: ergebnis,
    zustand: function () { return JSON.parse(JSON.stringify(zustand)); },
    init: function (baustoffdaten) {
      daten = baustoffdaten;
      f.suche = document.getElementById("ent-suche");
      f.kategorie = document.getElementById("ent-kategorie");
      f.anwendung = document.getElementById("ent-anwendung");
      f.sortierung = document.getElementById("ent-sortierung");
      f.nurPreis = document.getElementById("ent-nurpreis");
      f.nurCo2 = document.getElementById("ent-nurco2");
      f.reset = document.getElementById("ent-reset");
      f.liste = document.getElementById("ent-liste");
      f.anzahl = document.getElementById("ent-anzahl");
      f.leer = document.getElementById("ent-leer");
      f.feedback = document.getElementById("ent-feedback");
      f.ansichtKarten = document.getElementById("ent-ansicht-karten");
      f.ansichtListe = document.getElementById("ent-ansicht-liste");
      f.weitereZaehler = document.getElementById("ent-weitere-zaehler");
      if (!f.suche || !f.liste) return;
      laden();
      indexBauen();
      optionen(f.kategorie, daten.kategorien, "Alle Kategorien");
      optionen(f.anwendung, daten.anwendungsbereiche, "Alle Einsatzbereiche");
      f.sortierung.value = zustand.sortierung;
      f.suche.addEventListener("input", function () { zustand.text = f.suche.value; zeichnen(); });
      f.kategorie.addEventListener("change", function () { zustand.kategorie = f.kategorie.value; zeichnen(); });
      f.anwendung.addEventListener("change", function () { zustand.anwendung = f.anwendung.value; zeichnen(); });
      f.sortierung.addEventListener("change", function () { zustand.sortierung = f.sortierung.value; zeichnen(); });
      f.nurPreis.addEventListener("change", function () { zustand.nurPreis = f.nurPreis.checked; zeichnen(); });
      f.nurCo2.addEventListener("change", function () { zustand.nurCo2 = f.nurCo2.checked; zeichnen(); });
      var wk = document.getElementById("ent-weitere-knopf"), wb = document.getElementById("ent-weitere-box");
      wk.addEventListener("click", function () { var auf = wk.getAttribute("aria-expanded") !== "true"; wk.setAttribute("aria-expanded", auf ? "true" : "false"); wb.hidden = !auf; });
      f.reset.addEventListener("click", zuruecksetzen);
      document.getElementById("ent-leer-reset").addEventListener("click", zuruecksetzen);
      f.ansichtKarten.addEventListener("click", function () { zustand.ansicht = "karten"; zeichnen(); });
      f.ansichtListe.addEventListener("click", function () { zustand.ansicht = "liste"; zeichnen(); });
      // Datenmodus-Wechsel oder neue Produkte ändern die angezeigten Werte
      document.addEventListener("mm:daten", function () { indexBauen(); zeichnen(); });
      document.addEventListener("mm:produkte", function () { indexBauen(); zeichnen(); });
      zeichnen();
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
