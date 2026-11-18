/* ==========================================================================
   MaterialMatch – Favoriten (MaterialMatch 3.0)
   --------------------------------------------------------------------------
   Alle nach rechts gewischten (oder per Knopf als Favorit markierten) Baustoffe landen hier.
   Gespeichert wird im Browser (localStorage): ohne Anmeldung, ohne Datenbank, nur auf diesem Gerät.
   Ist das Speichern nicht möglich (z. B. privates Fenster), funktionieren die Favoriten bis zum Schließen der Seite weiter.

   Die Favoriten erscheinen als kompakte Karten (Illustration, Name, wichtige Kennwerte). Man kann sie entfernen,
   zwei oder drei auswählen und mit „Favoriten vergleichen“ in den bestehenden Vergleich übernehmen.

   Benutzung:  MM.favoriten.hinzufuegen(id) · entfernen(id) · hat(id) · liste()
   Meldung:    Nachricht "mm:favoriten" bei jeder Änderung.
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var el = MM.el;
  var SCHLUESSEL = "materialmatch.favoriten.v1";
  var daten = null;
  var ids = [];            // gemerkte Favoriten in der Reihenfolge des Hinzufügens
  var gewaehlt = [];       // für den Vergleich angehakt (höchstens 3)
  var speicherGeht = true;
  var box = null, zaehler = null;

  // ---------- Speicher ----------
  function laden() {
    try {
      var t = root.localStorage.getItem(SCHLUESSEL);
      if (!t) return [];
      var d = JSON.parse(t);
      return Array.isArray(d.ids) ? d.ids.filter(function (x) { return typeof x === "string"; }) : [];
    } catch (e) { speicherGeht = false; return []; }
  }
  function speichern() {
    try { root.localStorage.setItem(SCHLUESSEL, JSON.stringify({ ids: ids, stand: new Date().toISOString().slice(0, 10) })); speicherGeht = true; }
    catch (e) { speicherGeht = false; }
  }

  function gueltig(id) { return !!(daten && MM.finde(daten.baustoffe, id)); }

  function melden() {
    document.dispatchEvent(new CustomEvent("mm:favoriten", { detail: { ids: ids.slice() } }));
  }

  function hinzufuegen(id) {
    if (!gueltig(id) || ids.indexOf(id) !== -1) return false;
    ids.push(id);
    speichern(); zeichne(); melden();
    return true;
  }

  function entfernen(id) {
    var i = ids.indexOf(id);
    if (i === -1) return false;
    ids.splice(i, 1);
    gewaehlt = gewaehlt.filter(function (x) { return x !== id; });
    speichern(); zeichne(); melden();
    return true;
  }

  function leeren() { ids = []; gewaehlt = []; speichern(); zeichne(); melden(); }

  // ---------- Übernahme in den Vergleich ----------
  function vergleichen() {
    if (gewaehlt.length < 2 || gewaehlt.length > 3) return false;
    var neu = { a: gewaehlt[0], b: gewaehlt[1], c: gewaehlt[2] || "", pa: "", pb: "", pc: "" };
    MM.auswahl.setzeAuswahl(neu);
    // Hat das Interview genau EINE der Prioritäten Kosten, CO₂, Gewicht oder Wärmedämmung gewählt, gilt sie auch im Vergleich
    var a = MM.match && MM.match.antworten ? MM.match.antworten() : null;
    if (a && MM.prioritaet) {
      var eine = a.prioritaeten.filter(function (p) { return ["kosten", "co2", "gewicht", "waerme"].indexOf(p) !== -1; });
      if (a.prioritaeten.length === 1 && eine.length === 1) MM.prioritaet.setzen(eine[0]);
    }
    if (MM.reiter) MM.reiter.zeige("vergleich");
    var ziel = document.getElementById("auswahl");
    if (ziel && ziel.scrollIntoView) ziel.scrollIntoView({ block: "start" });
    var bereich = document.getElementById("bereich-vergleich");
    if (bereich && bereich.focus) bereich.focus({ preventScroll: true });
    return true;
  }

  // ---------- Anzeige ----------
  function karte(id) {
    var m = MM.produkte.wirksam(id, "");
    var a = MM.match && MM.match.antworten ? MM.match.antworten() : null;
    var art = el("li", null, "fav-karte");
    art.setAttribute("data-material", id);
    art.appendChild(MM.materialbilder.element(id, { groesse: "klein" }));
    var mitte = el("div", null, "fav-mitte");
    mitte.appendChild(el("p", m.name, "fav-name"));
    mitte.appendChild(el("p", MM.namenAusIds(m.kategorien, daten.kategorien), "fav-kategorie"));
    var kw = MM.steckbrief.kurzKennwerte(id, 3, a ? a.prioritaeten : []);
    var ul = el("ul", null, "fav-kennwerte");
    if (kw.length) kw.forEach(function (k) {
      var li = el("li");
      li.appendChild(el("span", k.titel + " ", "fav-kw-titel"));
      li.appendChild(el("strong", k.text));
      var am = MM.steckbrief.artMarke(k.art);
      if (am) li.appendChild(am);
      ul.appendChild(li);
    });
    else ul.appendChild(el("li", "Keine Kennwerte verfügbar", "fav-kw-leer"));
    mitte.appendChild(ul);
    art.appendChild(mitte);

    var aktionen = el("div", null, "fav-aktionen");
    var lab = el("label", null, "fav-wahl");
    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "fav-haken";
    cb.checked = gewaehlt.indexOf(id) !== -1;
    cb.setAttribute("data-wahl", id);
    cb.addEventListener("change", function () {
      if (cb.checked) {
        if (gewaehlt.length >= 3) { cb.checked = false; hinweis("Du kannst höchstens drei Favoriten vergleichen."); return; }
        gewaehlt.push(id);
      } else gewaehlt = gewaehlt.filter(function (x) { return x !== id; });
      kopfzeileAktualisieren();
    });
    lab.appendChild(cb);
    lab.appendChild(el("span", "Vergleichen"));
    aktionen.appendChild(lab);
    aktionen.appendChild(MM.steckbrief.knopf(id));
    var weg = el("button", null, "fav-weg");
    weg.type = "button";
    weg.setAttribute("aria-label", "Aus den Favoriten entfernen: " + m.name);
    weg.setAttribute("title", "Entfernen");
    weg.setAttribute("data-entfernen", id);
    weg.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-x"/></svg>';
    weg.addEventListener("click", function () {
      var nachbar = art.nextElementSibling || art.previousElementSibling;
      entfernen(id);
      var f = nachbar && nachbar.querySelector ? nachbar.querySelector(".fav-weg") : box.querySelector(".fav-leer, .fav-aktion-vergleich");
      if (f && f.focus) f.focus();
    });
    aktionen.appendChild(weg);
    art.appendChild(aktionen);
    return art;
  }

  var hinweisBox = null;
  function hinweis(text) { if (hinweisBox) hinweisBox.textContent = text; }

  function kopfzeileAktualisieren() {
    if (!box) return;
    var knopf = box.querySelector(".fav-vergleichen");
    var info = box.querySelector(".fav-info");
    if (!knopf) return;
    var n = gewaehlt.length;
    knopf.disabled = n < 2 || n > 3;
    if (info) info.textContent = n === 0 ? "Wähle zwei oder drei Favoriten zum Vergleichen aus." : (n === 1 ? "Wähle noch mindestens einen weiteren Favoriten aus." : n + " Favoriten ausgewählt.");
  }

  function zeichne() {
    if (!box) return;
    box.textContent = "";
    if (zaehler) zaehler.textContent = String(ids.length);
    if (!ids.length) {
      var leer = el("div", null, "fav-leer");
      leer.appendChild(el("p", "Noch keine Favoriten.", "fav-leer-titel"));
      leer.appendChild(el("p", "Wische eine Karte nach rechts oder tippe auf „Merken“. Dann erscheint das Material hier."));
      box.appendChild(leer);
      return;
    }
    var ul = el("ul", null, "fav-liste");
    ids.forEach(function (id) { ul.appendChild(karte(id)); });
    box.appendChild(ul);
    var fuss = el("div", null, "fav-fuss");
    var info = el("p", null, "fav-info");
    info.setAttribute("aria-live", "polite");
    fuss.appendChild(info);
    hinweisBox = el("p", null, "fav-hinweis sr-only");
    hinweisBox.setAttribute("role", "status");
    fuss.appendChild(hinweisBox);
    var k = el("button", "Favoriten vergleichen", "btn fav-vergleichen");
    k.type = "button";
    k.addEventListener("click", function () { vergleichen(); });
    fuss.appendChild(k);
    var l = el("button", "Alle Favoriten entfernen", "btn-link fav-alle-weg");
    l.type = "button";
    l.addEventListener("click", function () { leeren(); });
    fuss.appendChild(l);
    if (!speicherGeht) fuss.appendChild(el("p", "Hinweis: Dein Browser erlaubt kein Speichern. Die Favoriten bleiben nur bis zum Schließen dieser Seite erhalten.", "fav-speicher-hinweis"));
    box.appendChild(fuss);
    kopfzeileAktualisieren();
  }

  MM.favoriten = {
    SCHLUESSEL: SCHLUESSEL,
    liste: function () { return ids.slice(); },
    hat: function (id) { return ids.indexOf(id) !== -1; },
    hinzufuegen: hinzufuegen,
    entfernen: entfernen,
    leeren: leeren,
    gewaehlt: function () { return gewaehlt.slice(); },
    waehle: function (id, an) {
      if (ids.indexOf(id) === -1) return false;
      gewaehlt = gewaehlt.filter(function (x) { return x !== id; });
      if (an && gewaehlt.length < 3) gewaehlt.push(id);
      zeichne();
      return true;
    },
    vergleichen: vergleichen,
    speicherOk: function () { return speicherGeht; },
    neuZeichnen: zeichne,
    init: function (baustoffdaten) {
      daten = baustoffdaten;
      box = document.getElementById("favoriten-inhalt");
      zaehler = document.getElementById("favoriten-zaehler");
      ids = laden().filter(gueltig);
      zeichne();
      // Wechsel zwischen Demo- und Echtdaten ändert die angezeigten Kennwerte
      document.addEventListener("mm:daten", zeichne);
      document.addEventListener("mm:produkte", zeichne);
    }
  };

})(typeof window !== "undefined" ? window : globalThis);
