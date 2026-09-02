/* ============================================================
   ARTICLES.JS — Rendu des articles (accueil / page /articles)
   Colonnes attendues dans le Sheet "Articles" (blueprint §18) :
   id, titre, slug, plateforme, description, temps_lecture, url,
   image_url, date, featured, ordre
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function carte(a) {
    var plateforme = a.plateforme || "Autres";
    var libelle = plateforme === "LinkedIn" ? "LinkedIn" : (plateforme === "Medium" ? "Medium" : "Article");
    var raw = a.url || "";
    var lien = !raw ? "#" : (/^https?:\/\//i.test(raw) ? raw : "https://" + raw);
    return '<article class="card card-hover a-card reveal">' +
      '<div class="a-top">' +
        '<span class="chip chip-gold">' + esc(libelle) + '</span>' +
        '<span class="a-meta">' + esc(window.Sheets.formatMinutes(a.temps_lecture)) + ' · ' + esc(window.Sheets.formatDate(a.date)) + '</span>' +
      '</div>' +
      '<h3><a href="' + esc(lien) + '" target="_blank" rel="noopener">' + esc(a.titre) + '</a></h3>' +
      '<p>' + esc(a.description || "") + '</p>' +
      '<div class="a-foot">' +
        '<a class="link-arrow" href="' + esc(lien) + '" target="_blank" rel="noopener">Lire l\'article<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>' +
        '<span class="a-external">↗ ' + esc(libelle) + '</span>' +
      '</div>' +
    '</article>';
  }

  /* Construit des objets propres, champ par champ (alias + casse tolérées),
     en isolant chaque ligne : une ligne problématique est ignorée et
     loguée, jamais l'ensemble du rendu. */
  function recuperer() {
    return window.Sheets.loadSheet("articles").then(function (rows) {
      var out = [];
      rows.forEach(function (r, i) {
        try {
          var titre = window.Sheets.champ(r, ["titre", "title"], "");
          if (!titre) return; // ligne vide ou ligne d'instruction
          out.push({
            id: window.Sheets.champ(r, ["id"], "A" + i),
            titre: titre,
            slug: window.Sheets.champ(r, ["slug"], ""),
            plateforme: window.Sheets.champ(r, ["plateforme", "source"], ""),
            description: window.Sheets.champ(r, ["description"], ""),
            temps_lecture: window.Sheets.champ(r, ["temps_lecture", "temps"], ""),
            url: window.Sheets.champ(r, ["url", "lien"], ""),
            image_url: window.Sheets.champ(r, ["image_url", "image"], ""),
            date: window.Sheets.champ(r, ["date"], ""),
            featured: window.Sheets.toBool(window.Sheets.champ(r, ["featured"], "")),
            ordre: window.Sheets.champ(r, ["ordre", "order"], "0")
          });
        } catch (e) {
          console.error("[Articles] Ligne " + (i + 2) + " ignorée :", e);
        }
      });
      out._source = rows._source;
      return out.sort(window.Sheets.byOrder);
    });
  }

  /* Indicateur visible de source de données (jamais d'échec silencieux) */
  function statutSource(containerId, source, n) {
    var el = document.getElementById(containerId);
    if (!el || !el.parentElement) return;
    if (el.parentElement.querySelector(".dyn-source")) return;
    var div = document.createElement("p");
    div.className = "dyn-source" + (source === "local" ? " is-local" : "");
    if (source === "google-sheets") {
      div.innerHTML = '<span class="dot"></span>Données : Google Sheets · ' + n + ' article(s)';
    } else if (source === "local") {
      div.innerHTML = '<span class="dot"></span>Données de secours (Google Sheets injoignable)';
    } else {
      div.innerHTML = '<span class="dot"></span>Erreur de chargement — ouvrez la console (F12) pour le détail';
      div.classList.add("is-erreur");
    }
    el.parentElement.insertBefore(div, el.nextSibling);
  }

  /* ---- Accueil : featured=true ---- */
  function accueil(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '<div class="skel" style="min-height:200px"></div>'.repeat(3);
    recuperer().then(function (arts) {
      var src = arts._source || "google-sheets";
      var featured = arts.filter(function (a) { return a.featured; }).slice(0, 3);
      if (!featured.length) {
        statutSource(containerId, src, 0);
        el.innerHTML = '<div class="dyn-state"><div class="ds-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></div><h3>Aucun article à la une</h3><p>Les articles sélectionnés apparaîtront ici.</p></div>';
        return;
      }
      el.innerHTML = featured.map(function (a) {
        try { return carte(a); } catch (e) { console.error("[Articles] Carte non rendue :", a.titre, e); return ""; }
      }).join("") || '<div class="dyn-state"><div class="ds-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></div><h3>Aucun article à la une</h3><p>Les articles sélectionnés apparaîtront ici.</p></div>';
      statutSource(containerId, src, featured.length);
      window.Prjs.observeNew(el);
    }).catch(function (e) {
      console.error("[Articles] Erreur de chargement :", e);
      statutSource(containerId, "erreur", 0);
      el.innerHTML = '<div class="dyn-state"><div class="ds-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg></div><h3>Impossible de charger les articles</h3><p>Vérifiez la publication du Google Sheet puis rechargez la page.</p></div>';
    });
  }

  /* ---- Page /articles : tous + filtres ---- */
  function page(containerId, filterId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var actif = "Tous";
    var tous = [];
    var srcActuel = "google-sheets";

    function render() {
      var list = actif === "Tous" ? tous : tous.filter(function (a) { return a.plateforme === actif; });
      if (!list.length) {
        statutSource(containerId, srcActuel, 0);
        el.innerHTML = '<div class="dyn-state"><div class="ds-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></div><h3>Aucun article dans cette catégorie</h3><p>Essayez un autre filtre.</p></div>';
        return;
      }
      el.innerHTML = list.map(function (a) {
        try { return carte(a); } catch (e) { console.error("[Articles] Carte non rendue :", a.titre, e); return ""; }
      }).join("") || '<div class="dyn-state"><div class="ds-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></div><h3>Aucun article dans cette catégorie</h3><p>Essayez un autre filtre.</p></div>';
      statutSource(containerId, srcActuel, list.length);
      window.Prjs.observeNew(el);
    }

    el.innerHTML = '<div class="skel" style="min-height:200px"></div>'.repeat(6);
    recuperer().then(function (arts) {
      srcActuel = arts._source || "google-sheets";
      tous = arts;
      render();
    }).catch(function (e) {
      console.error("[Articles] Erreur de chargement :", e);
      statutSource(containerId, "erreur", 0);
      el.innerHTML = '<div class="dyn-state"><div class="ds-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg></div><h3>Impossible de charger les articles</h3><p>Vérifiez la publication du Google Sheet puis rechargez la page.</p></div>';
    });

    var bar = document.getElementById(filterId);
    if (bar) bar.addEventListener("click", function (e) {
      var btn = e.target.closest(".f-btn");
      if (!btn) return;
      actif = btn.getAttribute("data-filtre");
      bar.querySelectorAll(".f-btn").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      render();
    });
  }

  window.Arts = { accueil: accueil, page: page };
})();
