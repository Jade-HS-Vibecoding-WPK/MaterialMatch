/* ==========================================================================
   MaterialMatch – Swipe-Karten (MaterialMatch 3.0)
   --------------------------------------------------------------------------
   Nach dem Interview erscheinen passende Baustoffe als Karten, eine nach der anderen:
     nach rechts wischen  = Interessant / Favorit          nach links wischen = Nicht interessant
     auf die Karte tippen = Weitere Informationen (Steckbrief)
   Für alle, die nicht wischen möchten, gibt es sichtbare Knöpfe. Mit der Tastatur: Pfeil rechts = Favorit,
   Pfeil links = Nicht interessant, Enter oder I = Informationen, Rücktaste oder Z = Rückgängig.

   Gewischt wird mit Zeigerereignissen (Maus, Finger, Stift gleich). Senkrechtes Scrollen bleibt am Handy möglich.
   Bei „reduzierte Bewegung“ im Betriebssystem gibt es keine Flugbewegung, die Karte wechselt sofort.

   Die Karten zeigen nur Werte aus der Datenbank und den Score aus js/matching.js; hier wird nichts berechnet.
   Benutzung:  MM.swipe.zeige(box, ergebnis, { beiAenderung: function () {} })
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var el = MM.el;

  var SCHWELLE_MIN = 80;     // so weit (in Pixeln) muss die Karte mindestens gezogen werden

  function reduziert() {
    return !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function symbol(name, klasse) {
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "ico" + (klasse ? " " + klasse : ""));
    svg.setAttribute("aria-hidden", "true");
    var use = document.createElementNS(NS, "use");
    use.setAttribute("href", "#i-" + name);
    svg.appendChild(use);
    return svg;
  }

  function knopf(text, klasse, symbolName, beschriftung) {
    var b = el("button", null, klasse);
    b.type = "button";
    if (symbolName) b.appendChild(symbol(symbolName));
    b.appendChild(el("span", text));
    if (beschriftung) b.setAttribute("aria-label", beschriftung);
    return b;
  }

  function antwortenZeile(a) {
    var M = MM.matching;
    var teile = [];
    var e = M.EINSAETZE.filter(function (x) { return x.id === a.einsatz; })[0];
    if (e) teile.push(e.name);
    a.prioritaeten.forEach(function (p) { var x = M.PRIORITAETEN.filter(function (y) { return y.id === p; })[0]; if (x) teile.push(x.name); });
    a.anforderungen.forEach(function (p) { if (p === "keine") return; var x = M.ANFORDERUNGEN.filter(function (y) { return y.id === p; })[0]; if (x) teile.push(x.name); });
    var k = M.KOSTENRAHMEN.filter(function (y) { return y.id === a.kosten; })[0];
    if (k && a.kosten !== "keine") teile.push(k.name);
    var ma = M.MATERIALARTEN.filter(function (y) { return y.id === a.materialart; })[0];
    if (ma && a.materialart !== "keine") teile.push(ma.name);
    return teile;
  }

  // ---------- Trefferliste (3 bis 5 beste Baustoffe) ----------
  var PASSUNG = {
    voll: { text: "Passt", titel: "Alle Anforderungen sind belegt erfüllt." },
    eingeschraenkt: { text: "Nicht alle Angaben überprüfbar", titel: "Keine Anforderung ist verletzt, aber nicht alles ist belegt." },
    teilweise: { text: "Kein vollständiges Match", titel: "Ein Wunsch (natürlich oder Materialart) ist nicht erfüllt." },
    nicht_erfuellt: { text: "Erfüllt eine zwingende Anforderung nicht", titel: "Nur als Alternative gezeigt, nicht als Match." }
  };

  function artText(art) { return art && MM.tabelle && MM.tabelle.ART[art] ? MM.tabelle.ART[art].text : "Datenart unbekannt"; }

  function preisText(m) {
    var p = m.eigenschaften.preis;
    if (p && typeof p.wert === "number" && isFinite(p.wert)) {
      var t = MM.berechnung.formatZahl(p.wert) + " " + p.einheit;
      if (p.spanne && typeof p.spanne.min === "number") t = "ca. " + MM.berechnung.formatZahl(p.spanne.min) + " bis " + MM.berechnung.formatZahl(p.spanne.max) + " " + p.einheit;
      return t + (p.mwst && p.mwst !== "unbekannt" ? ", " + p.mwst : "") + " · " + artText(p.art);
    }
    return "Preis nicht belegt";
  }

  function co2Text(m) {
    var g = m.eigenschaften.gwp;
    if (g && g.werte && typeof g.werte.fossil === "number") {
      var bezug = String(g.deklarierte_einheit || "").replace(/^1\s*/, "");
      return MM.berechnung.formatZahl(g.werte.fossil) + " kg CO₂e/" + bezug + " (fossil, " + (g.module || "A1–A3") + ") · " + artText(g.art);
    }
    return "CO₂ nicht belegt";
  }

  function topBauen(ergebnis) {
    var liste = ergebnis.ergebnisse.slice(0, 5);
    if (!liste.length) return null;
    var sec = el("section", null, "sw-top");
    sec.setAttribute("aria-labelledby", "sw-top-titel");
    var h = el("h3", ergebnis.fallback && ergebnis.fallback.aktiv ? "Die am besten geeigneten Alternativen" : "Deine besten Treffer", "sw-top-titel");
    h.id = "sw-top-titel";
    sec.appendChild(h);
    var ol = el("ol", null, "sw-top-liste");
    liste.forEach(function (e, i) {
      var m = e.material;
      var li = el("li", null, "sw-top-eintrag sw-top-" + e.passung);
      li.setAttribute("data-material", e.id);
      var kopf = el("div", null, "sw-top-kopf");
      kopf.appendChild(el("span", String(i + 1), "sw-top-nr"));
      if (MM.materialbilder) kopf.appendChild(MM.materialbilder.element(e.id, { groesse: "klein" }));   // MaterialMatch 3.6: dasselbe Bild wie überall
      kopf.appendChild(el("strong", m.name, "sw-top-name"));
      var b = el("span", PASSUNG[e.passung].text, "sw-passung sw-passung-" + e.passung);
      b.setAttribute("title", PASSUNG[e.passung].titel);
      kopf.appendChild(b);
      li.appendChild(kopf);
      li.appendChild(el("p", MM.matching.scoreText(e) + (e.score !== null ? " · " + e.abdeckung.belegt + " von " + e.abdeckung.von + " Kriterien belegt" : ""), "sw-top-score"));
      var dl = el("dl", null, "sw-top-daten");
      function zeile(k, v) { if (!v) return; dl.appendChild(el("dt", k)); dl.appendChild(el("dd", v)); }
      zeile("Vorteile", staerken(e).join(", "));
      var schwach = e.kriterien.filter(function (t) { return !t.gleich && t.score <= 0.33 && t.negativ; }).map(function (t) { return "Eher " + t.negativ.replace(/^höherer /, "höhere ").replace(/^höheren /, "höhere ").replace(/^geringerer /, "geringe ").replace(/^schwächerer /, "schwächere "); });
      zeile("Mögliche Nachteile", schwach.length ? schwach.join(", ") : (m.nachteile && m.nachteile[0]) || "");
      zeile("Preis", preisText(m));
      zeile("Ökologie", co2Text(m));
      zeile("Begründung", e.erklaerung);
      if (e.fehlend.length || e.vorlaeufig) zeile("Fehlende Daten", (e.fehlend.length ? "Nicht bewertet: " + e.fehlend.join(", ") + ". " : "") + (e.vorlaeufig ? "Die Punkte sind vorläufig." : ""));
      li.appendChild(dl);
      ol.appendChild(li);
    });
    sec.appendChild(ol);
    return sec;
  }

  // Kurze Vorteile für die Karte: Kriterien mit klar guter relativer Bewertung, höchstens zwei (reine Darstellung)
  function staerken(e) {
    var t = (e.kriterien || []).filter(function (k) { return !k.gleich && k.score >= 0.67 && k.kurz; }).slice(0, 2).map(function (k) { return k.kurz.charAt(0).toUpperCase() + k.kurz.slice(1); });
    if (!t.length && e.material.vorteile && e.material.vorteile[0]) t.push(e.material.vorteile[0]);
    return t;
  }

  // ---------- Eine Karte ----------
  function karteBauen(e, ergebnis) {
    var m = e.material;
    var art = el("article", null, "sw-karte");
    art.setAttribute("data-material", e.id);
    art.setAttribute("aria-label", m.name);

    art.appendChild(MM.materialbilder.element(e.id, { groesse: "gross", beschriftung: true }));
    // Eignung (laut Datenbank) und Match-Punkte (relativer Vergleich) stehen getrennt:
    // eine gute Punktzahl ersetzt nie eine fehlende Eignung.
    var stufe = el("p", null, "sw-eignung sw-eignung-" + e.stufe);
    stufe.appendChild(el("span", "Eignung: ", "sw-eignung-label"));
    stufe.appendChild(el("strong", e.stufeName));
    stufe.setAttribute("title", e.eignungText || "");
    art.appendChild(stufe);
    if (e.passung && e.passung !== "voll") {
      var pass = el("p", PASSUNG[e.passung].text, "sw-passung sw-passung-" + e.passung);
      pass.setAttribute("title", PASSUNG[e.passung].titel);
      art.appendChild(pass);
    }
    art.appendChild(el("h3", m.name, "sw-name"));
    art.appendChild(el("p", MM.namenAusIds(m.kategorien, root.MATERIALMATCH_DATA.kategorien), "sw-kategorie"));

    // Match-Punkte: groß, mit kurzer Erklärung; ohne ausreichende Daten KEIN scheinbar genauer Wert
    var sc = el("div", null, "sw-score" + (e.score === null ? " sw-score-leer" : ""));
    if (e.score !== null) {
      sc.appendChild(el("span", String(e.score), "sw-score-zahl"));
      sc.appendChild(el("span", "/100 Match-Punkte" + (e.vorlaeufig ? " (vorläufig)" : ""), "sw-score-einheit"));
      sc.appendChild(el("span", "Relativer Vergleich der geeigneten Materialien · " + e.abdeckung.belegt + " von " + e.abdeckung.von + " Kriterien belegt", "sw-score-text"));
      var bar = el("span", null, "sw-score-balken");
      bar.setAttribute("role", "img");
      bar.setAttribute("aria-label", e.score + " von 100 Match-Punkten");
      var f = el("i"); f.style.width = e.score + "%"; bar.appendChild(f);
      sc.appendChild(bar);
    } else {
      sc.appendChild(el("span", "Datenlage reicht nicht für Match-Punkte", "sw-score-kein"));
    }
    art.appendChild(sc);

    // Höchstens zwei kurze Vorteile (die Kriterien, bei denen das Material klar vorn liegt); alles Längere steht im Steckbrief
    var vorteile = staerken(e);
    if (vorteile.length) {
      var vl = el("ul", null, "sw-vorteile");
      vorteile.forEach(function (t) { vl.appendChild(el("li", t)); });
      art.appendChild(vl);
    }
    (e.luecken || []).filter(function (l) { return l.status === "nicht_erfuellt"; }).forEach(function (l) { art.appendChild(el("p", "Nicht erfüllt: " + l.text, "sw-warnung")); });
    if (e.stufe !== "geeignet" && e.eignungText) art.appendChild(el("p", e.eignungText, "sw-warnung"));
    art.appendChild(el("p", "Tippe auf die Karte oder auf „Details“: Begründung, Kennwerte und Quellen", "sw-tipp"));

    // Beschriftungen, die beim Ziehen sichtbar werden (neutrale Gestaltungsfarben, keine Bewertung)
    var ja = el("span", "Merken", "sw-stempel sw-stempel-ja"); ja.setAttribute("aria-hidden", "true");
    var nein = el("span", "Überspringen", "sw-stempel sw-stempel-nein"); nein.setAttribute("aria-hidden", "true");
    art.appendChild(ja); art.appendChild(nein);
    return art;
  }

  function zeige(box, ergebnis, opt) {
    opt = opt || {};
    var a = ergebnis.antworten;
    var favs = MM.favoriten ? MM.favoriten.liste() : [];
    var alle = ergebnis.ergebnisse;
    var karten = alle.filter(function (e) { return favs.indexOf(e.id) === -1; });
    var index = 0;
    var verlauf = [];          // { id, art: "ja"|"nein", neuFavorit: bool }
    var beschaeftigt = false;
    var live = null, zaehler = null, buehne = null, wurzel = null;

    function sagen(text) { if (live) live.textContent = text; }

    function kopfBauen() {
      var kopf = el("div", null, "sw-kopf");
      zaehler = el("p", null, "sw-zaehler");
      kopf.appendChild(zaehler);
      var z = knopf("Antworten ändern", "btn-link sw-aendern", null);
      z.addEventListener("click", function () { if (opt.beiAenderung) opt.beiAenderung(); });
      kopf.appendChild(z);
      wurzel.appendChild(kopf);
      var chips = el("ul", null, "sw-antworten");
      chips.setAttribute("aria-label", "Deine Antworten");
      antwortenZeile(a).forEach(function (t) { chips.appendChild(el("li", t)); });
      wurzel.appendChild(chips);
      // Hinweise zur Datenlage (z. B. nicht bewertbare Kriterien) und Erinnerung: relativer Score, kein Nachweis
      var hin = el("p", null, "sw-hinweis");
      hin.appendChild(document.createTextNode("Match-Punkte vergleichen die Materialien dieses Einsatzbereichs untereinander (relativ, keine Eignungsbestätigung). "));
      if (ergebnis.hinweise.length) hin.appendChild(document.createTextNode(ergebnis.hinweise.join(" ")));
      wurzel.appendChild(hin);
      fallbackBauen();
      var top = topBauen(ergebnis);
      if (top) wurzel.appendChild(top);
    }

    // Fallback: Was schränkt am stärksten ein, und was lässt sich lockern?
    function fallbackBauen() {
      var fb = ergebnis.fallback || {};
      var lockern = ergebnis.lockerung || [], gelockert = ergebnis.gelockert || [];
      var teilweise = ergebnis.ergebnisse.some(function (e) { return e.passung === "teilweise" || e.passung === "nicht_erfuellt"; });
      if (!fb.aktiv && !lockern.length && !gelockert.length && !teilweise) return;
      var box2 = el("div", null, "sw-fallback");
      box2.setAttribute("role", "region");
      box2.setAttribute("aria-label", "Hinweise zu den Anforderungen");
      if (fb.aktiv) box2.appendChild(el("p", "Kein Material erfüllt alle deine Anforderungen vollständig und belegt. Unten stehen die am besten geeigneten Alternativen; sie sind als „kein vollständiges Match“ gekennzeichnet.", "sw-fallback-titel"));
      else if (teilweise) box2.appendChild(el("p", "Es gibt weniger als drei vollständige Treffer. Zusätzlich stehen Alternativen da, die einen Wunsch nicht erfüllen (gekennzeichnet).", "sw-fallback-titel"));
      var beg = (ergebnis.begrenzungen || []).filter(function (x) { return x.nichtErfuellt + x.nichtPruefbar > 0; });
      if (beg.length) {
        var ul = el("ul", null, "sw-fallback-liste");
        beg.forEach(function (x) {
          var t = "„" + x.name + "“ schränkt ein: " + (x.nichtErfuellt ? x.nichtErfuellt + " von " + x.von + " Materialien erfüllen es nicht" : "") + (x.nichtErfuellt && x.nichtPruefbar ? ", " : "") + (x.nichtPruefbar ? x.nichtPruefbar + " lassen sich nicht überprüfen (keine belegten Daten)" : "") + (x.art === "zwingend" ? " · zwingend, nicht lockerbar" : " · Wunsch, lockerbar") + ".";
          ul.appendChild(el("li", t));
        });
        box2.appendChild(ul);
      }
      lockern.forEach(function (x) {
        var kn = knopf("Wunsch „" + x.name + "“ lockern (" + x.gewinn + " weitere" + (x.gewinn === 1 ? "r" : "") + " Treffer)", "btn-option sw-lockern", null);
        kn.setAttribute("data-lockern", x.id);
        kn.addEventListener("click", function () { if (opt.beiLockern) opt.beiLockern(x.id, true); });
        box2.appendChild(kn);
      });
      gelockert.forEach(function (id) {
        var kn = knopf("Gelockert: " + (id === "natuerlich" ? "Natürliche Materialien" : "Materialart") + " – wieder verlangen", "btn-link sw-lockern-zurueck", null);
        kn.setAttribute("data-lockern-zurueck", id);
        kn.addEventListener("click", function () { if (opt.beiLockern) opt.beiLockern(id, false); });
        box2.appendChild(kn);
      });
      wurzel.appendChild(box2);
    }

    function zaehlerAktualisieren() {
      if (!zaehler) return;
      zaehler.textContent = index < karten.length ? "Karte " + (index + 1) + " von " + karten.length : "Alle Karten gesehen";
    }

    function ende() {
      buehne.textContent = "";
      var e = el("div", null, "sw-ende");
      e.appendChild(el("h3", karten.length ? "Alle Karten gesehen" : "Keine neuen Karten", "sw-ende-titel"));
      var nF = MM.favoriten.liste().length;
      var nein = verlauf.filter(function (v) { return v.art === "nein"; }).length;
      e.appendChild(el("p", nF ? "Du hast " + nF + (nF === 1 ? " Favoriten" : " Favoriten") + " gemerkt" + (nein ? " und " + nein + " Materialien aussortiert." : ".") : "Du hast keinen Favoriten gemerkt. Ändere deine Antworten oder schaue die aussortierten Materialien noch einmal an."));
      var akt = el("div", null, "sw-ende-aktionen");
      if (nF) {
        var f = knopf("Zu den Favoriten", "btn sw-zu-favoriten", "sparkles");
        f.addEventListener("click", function () {
          var z = document.getElementById("match-favoriten");
          if (z && z.scrollIntoView) z.scrollIntoView({ block: "start" });
          var h = document.getElementById("favoriten-titel"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
        });
        akt.appendChild(f);
      }
      if (nein) {
        var w = knopf("Aussortierte noch einmal ansehen", "btn-option sw-nochmal", null);
        w.addEventListener("click", function () {
          var ids = verlauf.filter(function (v) { return v.art === "nein"; }).map(function (v) { return v.id; });
          karten = alle.filter(function (x) { return ids.indexOf(x.id) !== -1 && MM.favoriten.liste().indexOf(x.id) === -1; });
          verlauf = []; index = 0; neuZeichnen(true);
        });
        akt.appendChild(w);
      }
      var z = knopf("Antworten ändern", "btn-option sw-aendern-ende", null);
      z.addEventListener("click", function () { if (opt.beiAenderung) opt.beiAenderung(); });
      akt.appendChild(z);
      e.appendChild(akt);
      buehne.appendChild(e);
      buehne.removeAttribute("tabindex");
      knoepfeSperren(true);
      zaehlerAktualisieren();
    }

    function knoepfeSperren(sperre) {
      [].forEach.call(wurzel.querySelectorAll(".sw-nein, .sw-info, .sw-fav"), function (b) { b.disabled = sperre; });
      var u = wurzel.querySelector(".sw-zurueck"); if (u) u.disabled = !verlauf.length;
    }

    function neuZeichnen(fokus) {
      buehne.textContent = "";
      if (index >= karten.length) { ende(); return; }
      buehne.setAttribute("tabindex", "0");
      if (karten[index + 1]) {
        var hinten = el("div", null, "sw-karte-hinten");   // nur die Form der nächsten Karte (Tiefe), ohne Inhalt
        hinten.setAttribute("aria-hidden", "true");
        buehne.appendChild(hinten);
      }
      var vorne = karteBauen(karten[index], ergebnis);
      vorne.classList.add("sw-karte-vorne");
      buehne.appendChild(vorne);
      binde(vorne);
      knoepfeSperren(false);
      zaehlerAktualisieren();
      if (fokus && buehne.focus) buehne.focus({ preventScroll: true });
    }

    // Eine Entscheidung ausführen („ja“ = Favorit, „nein“ = nicht interessant)
    function entscheide(art, animiert) {
      if (beschaeftigt || index >= karten.length) return;
      var e = karten[index];
      var vorne = buehne.querySelector(".sw-karte-vorne");
      function fertig() {
        var neuFav = false;
        if (art === "ja") neuFav = MM.favoriten.hinzufuegen(e.id);
        verlauf.push({ id: e.id, art: art, neuFavorit: neuFav });
        index++;
        beschaeftigt = false;
        sagen((art === "ja" ? "Favorit hinzugefügt: " : "Nicht interessant: ") + e.material.name + ". " + (index < karten.length ? (karten.length - index) + " Karten übrig." : "Alle Karten gesehen."));
        neuZeichnen(true);
      }
      if (animiert && vorne && !reduziert()) {
        beschaeftigt = true;
        var w = buehne.getBoundingClientRect().width || 300;
        var dir = art === "ja" ? 1 : -1;
        vorne.style.transition = "transform .25s ease, opacity .25s ease";
        vorne.style.transform = "translateX(" + (dir * w * 1.2) + "px) rotate(" + (dir * 14) + "deg)";
        vorne.style.opacity = "0";
        var erledigt = false;
        var los = function () { if (erledigt) return; erledigt = true; vorne.style.transition = ""; fertig(); };
        vorne.addEventListener("transitionend", los);
        root.setTimeout(los, 320);
      } else fertig();
    }

    function rueckgaengig() {
      if (beschaeftigt || !verlauf.length) return;
      var v = verlauf.pop();
      if (v.art === "ja" && v.neuFavorit) MM.favoriten.entfernen(v.id);
      // die Karte steht wieder vorn; falls sie nicht mehr in der Liste ist (Favorit), wird sie eingefügt
      var pos = -1;
      karten.forEach(function (k, i) { if (k.id === v.id) pos = i; });
      if (pos === -1) { var neu = alle.filter(function (x) { return x.id === v.id; })[0]; karten.splice(index - 1, 0, neu); pos = index - 1; }
      index = pos;
      sagen("Rückgängig: " + (alle.filter(function (x) { return x.id === v.id; })[0].material.name));
      neuZeichnen(true);
    }

    function info() {
      if (index >= karten.length) return;
      MM.steckbrief.oeffne(karten[index].id, buehne, "", karten[index]);   // nach dem Schließen springt der Fokus zurück auf den Kartenstapel
    }

    // Wischen mit Maus, Finger oder Stift
    function binde(k) {
      var start = null, ziehen = false, dx = 0;
      function schwelle() { return Math.max(SCHWELLE_MIN, (buehne.getBoundingClientRect().width || 300) * 0.25); }
      function zeichneZug() {
        k.style.transform = "translateX(" + dx + "px) rotate(" + (dx / 22) + "deg)";
        var s = Math.min(1, Math.abs(dx) / schwelle());
        k.querySelector(".sw-stempel-ja").style.opacity = dx > 0 ? s : 0;
        k.querySelector(".sw-stempel-nein").style.opacity = dx < 0 ? s : 0;
      }
      k.addEventListener("pointerdown", function (e) {
        if (beschaeftigt || (e.pointerType === "mouse" && e.button !== 0)) return;
        if (e.target.closest && e.target.closest("a, button, summary, input")) return;
        start = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId };
        ziehen = false; dx = 0;
      });
      k.addEventListener("pointermove", function (e) {
        if (!start || e.pointerId !== start.id) return;
        var mx = e.clientX - start.x, my = e.clientY - start.y;
        if (!ziehen) {
          if (Math.abs(mx) > 8 && Math.abs(mx) > Math.abs(my)) { ziehen = true; try { k.setPointerCapture(e.pointerId); } catch (x) { /* nicht überall möglich */ } k.classList.add("sw-zieht"); }
          else return;
        }
        dx = mx;
        zeichneZug();
      });
      function loslassen(e) {
        if (!start || e.pointerId !== start.id) return;
        var war = ziehen, zeit = Date.now() - start.t;
        var distanz = Math.max(Math.abs(e.clientX - start.x), Math.abs(e.clientY - start.y));
        start = null;
        k.classList.remove("sw-zieht");
        if (war) {
          if (Math.abs(dx) > schwelle() && e.type === "pointerup") { entscheide(dx > 0 ? "ja" : "nein", true); return; }
          // zurückfedern
          k.style.transition = reduziert() ? "" : "transform .2s ease";
          k.style.transform = "";
          k.querySelector(".sw-stempel-ja").style.opacity = 0;
          k.querySelector(".sw-stempel-nein").style.opacity = 0;
          root.setTimeout(function () { k.style.transition = ""; }, 240);
        } else if (e.type === "pointerup" && distanz < 8 && zeit < 600) {
          info();           // Tippen = weitere Informationen
        }
      }
      k.addEventListener("pointerup", loslassen);
      k.addEventListener("pointercancel", loslassen);
    }

    // ---------- Aufbau ----------
    box.textContent = "";
    wurzel = el("div", null, "sw");
    kopfBauen();
    buehne = el("div", null, "sw-buehne");
    buehne.setAttribute("role", "group");
    buehne.setAttribute("aria-roledescription", "Kartenstapel");
    buehne.setAttribute("aria-label", "Baustoffkarten. Pfeil rechts: Favorit. Pfeil links: nicht interessant. Enter: Informationen.");
    buehne.addEventListener("keydown", function (e) {
      if (e.target !== buehne) return;
      if (e.key === "ArrowRight") { e.preventDefault(); entscheide("ja", true); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); entscheide("nein", true); }
      else if (e.key === "Enter" || e.key === " " || e.key === "i" || e.key === "I") { e.preventDefault(); info(); }
      else if (e.key === "Backspace" || e.key === "z" || e.key === "Z") { e.preventDefault(); rueckgaengig(); }
    });
    wurzel.appendChild(buehne);

    var knoepfe = el("div", null, "sw-knoepfe");
    knoepfe.setAttribute("role", "group");
    knoepfe.setAttribute("aria-label", "Entscheidung zur aktuellen Karte");
    var nein = knopf("Überspringen", "sw-knopf sw-nein", "x", "Überspringen: Material ist nicht interessant");
    nein.addEventListener("click", function () { entscheide("nein", true); });
    var inf = knopf("Details", "sw-knopf sw-info", "info", "Details: Steckbrief mit Begründung öffnen");
    inf.addEventListener("click", info);
    var fav = knopf("Merken", "sw-knopf sw-fav", "sparkles", "Merken: als Favorit speichern");
    fav.addEventListener("click", function () { entscheide("ja", true); });
    var zur = knopf("Rückgängig", "sw-knopf sw-zurueck", "arrow-right-left", "Letzte Entscheidung rückgängig machen");
    zur.addEventListener("click", rueckgaengig);
    knoepfe.appendChild(nein); knoepfe.appendChild(inf); knoepfe.appendChild(fav); knoepfe.appendChild(zur);
    wurzel.appendChild(knoepfe);
    wurzel.appendChild(el("p", "Wischen: rechts = merken, links = überspringen. Tastatur: Pfeil rechts, Pfeil links, Enter, Rücktaste.", "sw-hilfe"));
    live = el("p", null, "sr-only");
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    wurzel.appendChild(live);
    box.appendChild(wurzel);

    if (!alle.length) {
      buehne.removeAttribute("tabindex");
      var leer = el("div", null, "sw-ende");
      leer.appendChild(el("h3", "Keine passenden Materialien", "sw-ende-titel"));
      leer.appendChild(el("p", "Für diesen Einsatzbereich enthält die Datenbank kein geeignetes Material (" + ergebnis.ausgeschlossen.length + " Materialien sind dafür nicht vorgesehen). Wähle einen anderen Einsatzbereich."));
      var z = knopf("Antworten ändern", "btn sw-aendern-ende", null);
      z.addEventListener("click", function () { if (opt.beiAenderung) opt.beiAenderung(); });
      leer.appendChild(z);
      buehne.appendChild(leer);
      knoepfeSperren(true);
      zaehler.textContent = "Keine Karten";
    } else neuZeichnen(false);

    return {
      entscheide: entscheide, rueckgaengig: rueckgaengig, info: info,
      stand: function () { return { index: index, anzahl: karten.length, verlauf: verlauf.slice() }; }
    };
  }

  MM.swipe = { zeige: zeige, SCHWELLE_MIN: SCHWELLE_MIN };

})(typeof window !== "undefined" ? window : globalThis);
