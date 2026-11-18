/* ==========================================================================
   MaterialMatch – Suche in der Materialauswahl (Bento-Redesign)
   --------------------------------------------------------------------------
   Ein Suchfeld findet Baustoffe und Herstellerprodukte nach Name, Kategorie oder
   Hersteller. Ein Klick auf einen Treffer legt ihn auf den ersten freien Platz
   (Material A, B, dann C). Sind alle drei Plätze belegt, ersetzt der Treffer Material C.

   Die Suche RECHNET NICHTS und ändert keine Daten. Sie ruft nur die vorhandene
   Funktion MM.auswahl.setzeAuswahl() auf – genau wie die Auswahllisten.
   Bedienung: Tippen, Pfeil hoch/runter, Enter wählt, Escape schließt.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var el = MM.el;
  var daten = null;
  var eingabe = null, liste = null, status = null;
  var index = [];          // { text, art, materialId, produktId, titel, zusatz }
  var treffer = [];
  var aktiv = -1;
  var MAX = 8;

  function norm(s) {
    s = String(s || "").toLowerCase();
    if (s.normalize) s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
    return s.replace(/ß/g, "ss");
  }

  function indexBauen() {
    index = [];
    daten.baustoffe.forEach(function (m) {
      var kat = MM.namenAusIds(m.kategorien, daten.kategorien);
      index.push({ art: "material", materialId: m.id, produktId: "", titel: m.name, zusatz: kat,
        text: norm(m.name + " " + kat + " " + m.id) });
      MM.produkte.liste(m.id).forEach(function (p) {
        index.push({ art: "produkt", materialId: m.id, produktId: p.id, titel: p.name, zusatz: p.hersteller + " · " + m.name,
          text: norm(p.name + " " + p.hersteller + " " + m.name) });
      });
    });
  }

  function suchen(frage) {
    var teile = norm(frage).split(/\s+/).filter(Boolean);
    if (!teile.length) return [];
    var ok = index.filter(function (x) { return teile.every(function (t) { return x.text.indexOf(t) !== -1; }); });
    // Materialien zuerst, dann Produkte; innerhalb davon Treffer am Wortanfang vorn
    ok.sort(function (a, b) {
      if (a.art !== b.art) return a.art === "material" ? -1 : 1;
      var sa = norm(a.titel).indexOf(teile[0]) === 0 ? 0 : 1, sb = norm(b.titel).indexOf(teile[0]) === 0 ? 0 : 1;
      return sa - sb;
    });
    return ok;
  }

  function schliessen() {
    liste.hidden = true;
    liste.textContent = "";
    eingabe.setAttribute("aria-expanded", "false");
    eingabe.removeAttribute("aria-activedescendant");
    aktiv = -1;
  }

  function markieren(i) {
    var opts = liste.querySelectorAll("[role=option]");
    [].forEach.call(opts, function (o, k) { o.setAttribute("aria-selected", k === i ? "true" : "false"); });
    aktiv = i;
    if (i >= 0 && opts[i]) {
      eingabe.setAttribute("aria-activedescendant", opts[i].id);
      if (opts[i].scrollIntoView) opts[i].scrollIntoView({ block: "nearest" });
    } else eingabe.removeAttribute("aria-activedescendant");
  }

  function zeichnen() {
    var frage = eingabe.value.trim();
    liste.textContent = "";
    if (!frage) { schliessen(); status.textContent = ""; return; }
    var alle = suchen(frage);
    treffer = alle.slice(0, MAX);
    liste.hidden = false;
    eingabe.setAttribute("aria-expanded", "true");
    if (!treffer.length) {
      liste.appendChild(el("li", "Kein Treffer. Versuchen Sie einen Teil des Namens, z. B. „Holz“ oder „Wolle“.", "suche-leer"));
      status.textContent = "Kein Treffer";
      return;
    }
    treffer.forEach(function (t, i) {
      var li = el("li", null, "suche-treffer");
      li.id = "suche-opt-" + i;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      if (MM.materialbilder) li.appendChild(MM.materialbilder.element(t.materialId, { groesse: "klein" }));
      var text = el("span", null, "suche-text");
      text.appendChild(el("span", t.titel, "suche-titel"));
      text.appendChild(el("span", (t.art === "produkt" ? "Produkt · " : "") + t.zusatz, "suche-zusatz"));
      li.appendChild(text);
      li.addEventListener("mousedown", function (e) { e.preventDefault(); });   // Fokus im Feld behalten
      li.addEventListener("click", function () { waehlen(t); });
      liste.appendChild(li);
    });
    if (alle.length > MAX) liste.appendChild(el("li", "… und " + (alle.length - MAX) + " weitere. Suche genauer eingeben.", "suche-leer"));
    status.textContent = alle.length + (alle.length === 1 ? " Treffer" : " Treffer");
    markieren(-1);
  }

  function waehlen(t) {
    var belegt = {};
    MM.auswahl.holeAuswahl().plaetze.forEach(function (p) { belegt[p.buchstabe.toLowerCase()] = true; });
    var platz = ["a", "b", "c"].filter(function (k) { return !belegt[k]; })[0] || "c";
    var neu = {};
    neu[platz] = t.materialId;
    neu["p" + platz] = t.produktId;
    MM.auswahl.setzeAuswahl(neu);
    status.textContent = t.titel + " als Material " + platz.toUpperCase() + " gewählt";
    eingabe.value = "";
    schliessen();
    eingabe.focus();
  }

  function taste(e) {
    var n = liste.querySelectorAll("[role=option]").length;
    if (e.key === "ArrowDown" && n) { e.preventDefault(); markieren((aktiv + 1) % n); }
    else if (e.key === "ArrowUp" && n) { e.preventDefault(); markieren((aktiv + n - 1) % n); }
    else if (e.key === "Enter") {
      if (aktiv >= 0 && treffer[aktiv]) { e.preventDefault(); waehlen(treffer[aktiv]); }
      else if (treffer.length === 1) { e.preventDefault(); waehlen(treffer[0]); }
    } else if (e.key === "Escape") { if (!liste.hidden) { e.preventDefault(); schliessen(); } }
  }

  MM.suche = {
    // Nur für Tests und Neuaufbau (z. B. nach eigenen Produkten)
    treffer: function (frage) { return suchen(frage).map(function (t) { return { art: t.art, materialId: t.materialId, produktId: t.produktId, titel: t.titel }; }); },
    init: function (baustoffdaten) {
      daten = baustoffdaten;
      eingabe = document.getElementById("suche");
      liste = document.getElementById("suche-liste");
      status = document.getElementById("suche-status");
      if (!eingabe || !liste || !status) return;
      indexBauen();
      eingabe.addEventListener("input", zeichnen);
      eingabe.addEventListener("keydown", taste);
      eingabe.addEventListener("blur", function () { setTimeout(schliessen, 120); });
      eingabe.addEventListener("focus", function () { if (eingabe.value.trim()) zeichnen(); });
      document.addEventListener("mm:produkte", indexBauen);
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
