/* ==========================================================================
   MaterialMatch – Interview „Match finden“ (MaterialMatch 3.0)
   --------------------------------------------------------------------------
   Fünf kurze Fragen mit großen Auswahlflächen und einer Fortschrittsanzeige:
     1 Einsatzbereich (eine Antwort)   2 Wichtigste Kriterien (mehrere)   3 Weitere Anforderungen (mehrere)
     4 Kostenrahmen (eine)             5 Art der Materialien (eine)
   Die Antworten werden bei jeder Änderung an den Aufrufer gemeldet (er speichert sie).
   Optionen, für die es noch keine ausreichenden Daten gibt, sind ausgegraut und tragen den Hinweis
   „Noch keine ausreichenden Daten vorhanden“; sie können nicht gewählt werden und zählen nicht im Score.

   Bedienung: Maus, Touch und Tastatur (Pfeiltasten wechseln die Antwort, Leertaste wählt, Tab geht weiter).
   Die Auswahlfelder sind echte Optionsfelder (Radio) bzw. Kontrollkästchen, damit Screenreader sie vorlesen.

   Benutzung:  MM.interview.zeige(box, antworten, { schritt, beiAenderung(antworten), beiFertig(antworten) })
   ========================================================================== */

(function (root) {
  "use strict";

  var MM = root.MM = root.MM || {};
  var el = MM.el;

  var SYMBOLE = {
    kosten: "wallet", co2: "leaf", waerme: "thermometer", gewicht: "weight", festigkeit: "building-2", recycling: "recycle"
  };

  function fragen() {
    var M = MM.matching;
    return [
      { id: "einsatz", titel: "Wo möchtest du den Baustoff einsetzen?", hinweis: "Wähle einen Einsatzbereich.", art: "radio",
        kurz: "Einsatzbereich", rolle: "Pflichtangabe", warum: "Der Einsatzbereich bestimmt, welche Baustoffe überhaupt in Frage kommen und wie sie bewertet werden. Ohne diese Angabe ist kein Match möglich.",
        optionen: M.EINSAETZE.map(function (e) { return { id: e.id, name: e.name, hinweis: e.hinweis }; }) },
      { id: "prioritaeten", titel: "Was ist dir besonders wichtig?", hinweis: "Mehrfachauswahl möglich.", art: "checkbox",
        kurz: "Prioritäten", rolle: "Persönliche Präferenz", warum: "Daraus berechnen wir die Match-Punkte. Das sind Wünsche, keine Ausschlüsse: Fehlt einem Baustoff ein Wert, scheidet er nicht aus, sondern wird vorsichtiger bewertet.",
        optionen: M.PRIORITAETEN.map(function (p) { return { id: p.id, name: p.name, gesperrt: !p.datenlage, symbol: SYMBOLE[p.id] }; }) },
      { id: "anforderungen", titel: "Welche weiteren Anforderungen hast du?", hinweis: "Mehrfachauswahl möglich.", art: "checkbox", exklusiv: "keine",
        kurz: "Anforderungen", rolle: "Zwingend und Wunsch", warum: "Brandschutz ist zwingend: Ein Baustoff, der ihn nicht erfüllt, wird nie als passend gezeigt. „Natürliche Materialien“ ist ein Wunsch und lässt sich im Ergebnis lockern. Ausgegraute Punkte können wir mangels Daten nicht bewerten.",
        optionen: M.ANFORDERUNGEN.map(function (p) { return { id: p.id, name: p.name, hinweis: p.hinweis, gesperrt: !p.datenlage }; }) },
      { id: "kosten", titel: "Welchen Kostenrahmen bevorzugst du?", hinweis: "Der Preis zählt nur, wenn es vergleichbare Preise gibt.", art: "radio",
        kurz: "Kosten", rolle: "Persönliche Präferenz", warum: "Der Kostenrahmen beeinflusst nur die Reihenfolge, nie die Eignung. Viele Baustoffe haben (noch) keinen belegten Preis; sie werden deshalb nicht aussortiert.",
        optionen: M.KOSTENRAHMEN.map(function (p) { return { id: p.id, name: p.name }; }) },
      { id: "materialart", titel: "Welche Art von Materialien bevorzugst du?", hinweis: "Einordnung durch das Projekt.", art: "radio",
        kurz: "Materialart", rolle: "Persönliche Präferenz", warum: "Das ist ein Wunsch nach einer Materialfamilie (z. B. nachwachsend oder mineralisch). Passt kein Baustoff, zeigen wir die nächstbesten mit klar benannter Abweichung.",
        optionen: M.MATERIALARTEN.map(function (p) { return { id: p.id, name: p.name }; }) }
    ];
  }

  function wert(f, a) { return f.art === "radio" ? (a[f.id] || "") : (a[f.id] || []).slice(); }
  function beantwortet(f, a) { var w = wert(f, a); return f.art === "radio" ? !!w : w.length > 0; }

  function symbol(name) {
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "ico iv-symbol");
    svg.setAttribute("aria-hidden", "true");
    var use = document.createElementNS(NS, "use");
    use.setAttribute("href", "#i-" + name);
    svg.appendChild(use);
    return svg;
  }

  function zeige(box, antworten, opt) {
    opt = opt || {};
    var F = fragen();
    var a = MM.matching.normalisiereAntworten(antworten);
    var schritt = Math.max(0, Math.min(F.length - 1, opt.schritt || 0));

    function melde() { if (opt.beiAenderung) opt.beiAenderung(MM.matching.normalisiereAntworten(a)); }

    function zeichne(fokus) {
      var f = F[schritt];
      box.textContent = "";
      var root = el("div", null, "iv");
      root.setAttribute("data-schritt", String(schritt + 1));

      // Fortschritt
      var kopf = el("div", null, "iv-kopf");
      kopf.appendChild(el("p", "Frage " + (schritt + 1) + " von " + F.length, "iv-schritt"));
      var bar = el("div", null, "iv-fortschritt");
      bar.setAttribute("role", "progressbar");
      bar.setAttribute("aria-valuemin", "1");
      bar.setAttribute("aria-valuemax", String(F.length));
      bar.setAttribute("aria-valuenow", String(schritt + 1));
      bar.setAttribute("aria-valuetext", "Frage " + (schritt + 1) + " von " + F.length + (f.kurz ? ": " + f.kurz : ""));
      bar.setAttribute("aria-label", "Fortschritt des Interviews");
      var fuell = el("i");
      fuell.style.width = ((schritt + 1) / F.length * 100) + "%";
      bar.appendChild(fuell);
      kopf.appendChild(bar);
      root.appendChild(kopf);

      // Frage
      var fs = el("fieldset", null, "iv-frage");
      var lg = el("legend", f.titel, "iv-titel");
      lg.setAttribute("tabindex", "-1");
      fs.appendChild(lg);
      fs.appendChild(el("p", f.hinweis, "iv-hinweis"));
      if (f.warum) {   // MaterialMatch 3.7: Warum fragen wir das? und ob es eine zwingende Angabe oder ein persönlicher Wunsch ist
        var warum = el("div", null, "iv-warum");
        warum.appendChild(el("span", (f.kurz ? f.kurz + " · " : "") + f.rolle, "iv-rolle iv-rolle-" + (f.rolle === "Persönliche Präferenz" ? "wunsch" : "pflicht")));
        warum.appendChild(el("p", f.warum));
        fs.appendChild(warum);
      }
      var raster = el("div", null, "iv-optionen iv-optionen-" + f.id);
      var gewaehlt = wert(f, a);
      f.optionen.forEach(function (o, i) {
        var lab = el("label", null, "iv-option" + (o.gesperrt ? " iv-gesperrt" : ""));
        var inp = document.createElement("input");
        inp.type = f.art;
        inp.name = "iv-" + f.id;
        inp.value = o.id;
        inp.className = "iv-eingabe";
        inp.disabled = !!o.gesperrt;
        inp.checked = f.art === "radio" ? gewaehlt === o.id : gewaehlt.indexOf(o.id) !== -1;
        inp.addEventListener("change", function () { aendere(f, o, inp.checked); });
        lab.appendChild(inp);
        var k = el("span", null, "iv-karte");
        if (o.symbol) k.appendChild(symbol(o.symbol));
        var t = el("span", null, "iv-text");
        t.appendChild(el("span", o.name, "iv-name"));
        if (o.gesperrt) t.appendChild(el("span", MM.matching.DATENLAGE_HINWEIS, "iv-sperre"));
        else if (o.hinweis) t.appendChild(el("span", o.hinweis, "iv-zusatz"));
        k.appendChild(t);
        var haken = el("span", null, "iv-haken");
        haken.setAttribute("aria-hidden", "true");
        haken.appendChild(symbol("check"));
        k.appendChild(haken);
        lab.appendChild(k);
        raster.appendChild(lab);
      });
      fs.appendChild(raster);
      root.appendChild(fs);

      // Navigation
      var nav = el("div", null, "iv-nav");
      var zurueck = el("button", "Zurück", "btn-option iv-zurueck");
      zurueck.type = "button";
      zurueck.disabled = schritt === 0;
      zurueck.addEventListener("click", function () { schritt--; zeichne(true); });
      nav.appendChild(zurueck);
      var letzte = schritt === F.length - 1;
      var weiter = el("button", letzte ? "Matches anzeigen" : "Weiter", "btn iv-weiter");
      weiter.type = "button";
      weiter.disabled = !beantwortet(f, a);
      weiter.addEventListener("click", function () {
        if (!beantwortet(f, a)) return;
        if (letzte) { if (opt.beiFertig) opt.beiFertig(MM.matching.normalisiereAntworten(a)); }
        else { schritt++; zeichne(true); }
      });
      nav.appendChild(weiter);
      root.appendChild(nav);
      box.appendChild(root);
      if (fokus) lg.focus();
    }

    function aendere(f, o, an) {
      if (f.art === "radio") a[f.id] = o.id;
      else {
        var l = (a[f.id] || []).filter(function (x) { return x !== o.id; });
        if (an) l.push(o.id);
        if (an && f.exklusiv) {
          if (o.id === f.exklusiv) l = [f.exklusiv];
          else l = l.filter(function (x) { return x !== f.exklusiv; });
        }
        a[f.id] = l;
      }
      melde();
      // Auswahl und Schaltfläche „Weiter“ aktualisieren, ohne die Seite neu aufzubauen (Fokus bleibt)
      [].forEach.call(box.querySelectorAll(".iv-eingabe"), function (inp) {
        inp.checked = f.art === "radio" ? a[f.id] === inp.value : (a[f.id] || []).indexOf(inp.value) !== -1;
      });
      var w = box.querySelector(".iv-weiter");
      if (w) w.disabled = !beantwortet(f, a);
    }

    zeichne(false);
  }

  MM.interview = {
    zeige: zeige,
    anzahlFragen: function () { return fragen().length; }
  };

})(typeof window !== "undefined" ? window : globalThis);
