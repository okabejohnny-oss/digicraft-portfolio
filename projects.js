/* ============================================================
   PROJECTS.JS — Rendu des projets (carousel accueil / grille /projets)
   Colonnes attendues dans le Sheet "Projets" (blueprint §18) :
   id, titre, slug, categorie, description_courte, description_longue,
   image_url, stack_tags, statut, date, type_lien, url_destination,
   featured, ordre
   ============================================================ */
(function () {
  "use strict";

  var ICONS = {
    "IA": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a2 2 0 0 1 0 4h-3.27A6 6 0 0 1 12 20a6 6 0 0 1-5.73-2H3a2 2 0 0 1 0-4h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/><path d="M12 12v4"/><path d="M9 13h6"/></svg>',
    "Automatisation": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="12" r="2.5"/><circle cx="6" cy="10" r="2.5"/></svg>',
    "Bots": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4"/><circle cx="12" cy="3" r="1"/><path d="M9.5 13.5h.01M14.5 13.5h.01"/><path d="M8 17c1.1 1 2.6 1.5 4 1.5s2.9-.5 4-1.5"/></svg>',
    "SaaS": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 17.5l9 5 9-5"/></svg>'
  };
  var FALLBACK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v14H4z"/><path d="M4 9h16"/><path d="M8 14h3"/></svg>';

  function icone(filtre) { return ICONS[filtre] || FALLBACK_ICON; }

  /* Les URLs d'images peuvent venir du Sheet (http…) ou être relatives
     (assets/…) : dans ce cas on les préfixe du chemin racine du site. */
  function imgUrl(u) {
    if (!u) return "";
    if (/^(https?:)?\/\//i.test(u)) return u;
    return (window.SITE_ROOT || "") + u;
  }
  /* URL externe : ajoute https:// si le protocole manque ; les liens
     internes (commençant par /) sont résolus via SITE_ROOT pour
     fonctionner à n'importe quelle profondeur de page. */
  function extUrl(u) {
    if (!u) return "#";
    var v = String(u).trim();
    if (/^https?:\/\//i.test(v)) return v;
    if (v.charAt(0) === "/") return (window.SITE_ROOT || "") + v.replace(/^\//, "");
    return "https://" + v;
  }

  /* Libellé du bouton d'action directe : la valeur de la colonne
     type_lien (Bot, Demo, Jouer…). Les valeurs non-action (vides,
     "interne", "externe", "En savoir plus", "Voir le projet") sont
     remplacées par un libellé générique. */
  function libelleAction(p) {
    var t = (p.type_lien || "").trim();
    if (["", "interne", "externe", "En savoir plus", "Voir le projet"].indexOf(t) !== -1) return "Accéder au projet";
    return t;
  }

  /* Correspondance projet ↔ filtre (colonne `filtre` si présente,
     sinon déduction depuis `categorie`) */
  function matcheFiltre(p, f) {
    if (f === "Tous") return true;
    if (p.filtre) return p.filtre === f;
    var c = String(p.categorie || "").toLowerCase().trim();
    switch (f) {
      case "IA": return /ia|intelligence/.test(c);
      case "Automatisation": return /automatis|automation|workflow/.test(c);
      case "Bots": return /bot/.test(c);
      case "SaaS": return /saas/.test(c);
      case "Produits digitaux": return /produit|digital/.test(c);
      default: return false;
    }
  }

  /* Icône par défaut selon la catégorie */
  function iconePour(p) {
    var keys = ["IA", "Automatisation", "Bots", "SaaS"];
    for (var i = 0; i < keys.length; i++) {
      if (matcheFiltre(p, keys[i])) return ICONS[keys[i]];
    }
    return FALLBACK_ICON;
  }

  /* Un projet a une page d'étude de cas dès qu'une des 4 colonnes
     dédiées est renseignée (le Sheet alimente la page interne). */
  function aUneEtudeDeCas(p) {
    return !!(p && (p.probleme || p.solution || p.technologies_detail || p.resultat));
  }

  function carte(projet) {
    /* V1.1+ : les projets ayant une étude de cas (colonnes probleme /
       solution / technologies_detail / resultat remplies) pointent vers
       leur page interne /projets/<slug>/ ; les autres vers url_destination. */
    var isInterne = projet.type_lien === "interne" || aUneEtudeDeCas(projet);
    var href = isInterne && projet.slug
      ? (window.SITE_ROOT || "") + "projets/" + projet.slug + "/"
      : extUrl(projet.url_destination);
    var target = isInterne ? "" : ' target="_blank" rel="noopener"';
    var tags = (projet.stack_tags || "").split(/[·|,]/).map(function (t) { return t.trim(); }).filter(Boolean).slice(0, 3);
    var img = projet.image_url
      ? '<img src="' + imgUrl(projet.image_url) + '" alt="' + esc(projet.titre) + '" loading="lazy" decoding="async" onerror="this.remove()">'
      : "";
    /* Libellés des boutons : "En savoir plus" pour les études de cas
       internes, sinon le libellé personnalisé du Sheet (Demo, Bot, Jouer…) */
    var label = isInterne ? "En savoir plus" : libelleAction(projet);
    /* Bouton d'action directe (type_lien → url_destination, nouvel onglet) */
    var labelAction = libelleAction(projet);
    var urlAction = extUrl(projet.url_destination);
    var actionBtn = '<a class="btn btn-gold btn-xs" href="' + urlAction + '" target="_blank" rel="noopener" aria-label="' + esc(labelAction) + ' : ' + esc(projet.titre) + '">' + esc(labelAction) + '</a>';
    var ico = '<span class="p-media-ico" aria-hidden="true">' + iconePour(projet) + '</span>';

    return '<article class="card card-hover p-card reveal">' +
      '<a class="p-media" href="' + href + '"' + target + ' aria-label="Voir le projet : ' + esc(projet.titre) + '">' +
        ico + img +
        '<span class="chip">' + esc(projet.categorie || "") + '</span>' +
      '</a>' +
      '<div class="p-body">' +
        '<div class="p-meta"><span class="st">' + esc(projet.categorie || "Projet") + '</span><span class="sep"></span><span>' + esc(projet.statut || "") + '</span><span class="sep"></span><span>' + esc(projet.date || "") + '</span></div>' +
        '<h3 class="p-title"><a href="' + href + '"' + target + '>' + esc(projet.titre) + '</a></h3>' +
        '<p class="p-desc">' + esc(projet.description_courte || "") + '</p>' +
        (tags.length ? '<div class="p-tags">' + tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join("") + '</div>' : "") +
        (isInterne
          ? '<div class="p-foot">' +
              '<a class="link-arrow" href="' + href + '" aria-label="En savoir plus : ' + esc(projet.titre) + '">En savoir plus<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>' +
              actionBtn +
            '</div>'
          : '<div class="p-foot">' + actionBtn + '</div>') +
      '</div>' +
    '</article>';
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function chargement(n) {
    var s = "";
    for (var i = 0; i < n; i++) s += '<div class="skel" style="min-height:300px"></div>';
    return s;
  }

  function etat(type, titre, texte, lien, lienTexte) {
    var ico = type === "vide"
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>';
    return '<div class="dyn-state reveal is-visible">' +
      '<div class="ds-ico">' + ico + '</div>' +
      '<h3>' + esc(titre) + '</h3>' +
      '<p>' + esc(texte) + '</p>' +
      (lien ? '<a class="btn btn-gold btn-sm" href="' + lien + '">' + esc(lienTexte) + '</a>' : "") +
    '</div>';
  }

  /* Indicateur visible de source de données (jamais d'échec silencieux) */
  function statutSource(containerId, source, n) {
    var el = document.getElementById(containerId);
    if (!el || !el.parentElement) return;
    if (el.parentElement.querySelector(".dyn-source")) return; // déjà affiché
    var div = document.createElement("p");
    div.className = "dyn-source" + (source === "local" ? " is-local" : "");
    if (source === "google-sheets") {
      div.innerHTML = '<span class="dot"></span>Données : Google Sheets · ' + n + ' projet(s)';
    } else if (source === "local") {
      div.innerHTML = '<span class="dot"></span>Données de secours (Google Sheets injoignable)';
    } else {
      div.innerHTML = '<span class="dot"></span>Erreur de chargement — ouvrez la console (F12) pour le détail';
      div.classList.add("is-erreur");
    }
    el.parentElement.insertBefore(div, el.nextSibling);
  }

  /* Construit des objets propres, champ par champ (alias + casse tolérées),
     en isolant chaque ligne : une ligne problématique est ignorée et
     loguée, jamais l'ensemble du rendu. */
  function recuperer() {
    return window.Sheets.loadSheet("projets").then(function (rows) {
      var out = [];
      rows.forEach(function (r, i) {
        try {
          var titre = window.Sheets.champ(r, ["titre", "title", "nom"], "");
          if (!titre) return; // ligne vide ou ligne d'instruction
          out.push({
            id: window.Sheets.champ(r, ["id"], "P" + i),
            titre: titre,
            slug: window.Sheets.champ(r, ["slug"], ""),
            categorie: window.Sheets.champ(r, ["categorie", "category"], ""),
            filtre: window.Sheets.champ(r, ["filtre", "filter"], ""),
            description_courte: window.Sheets.champ(r, ["description_courte", "description"], ""),
            description_longue: window.Sheets.champ(r, ["description_longue"], ""),
            image_url: window.Sheets.champ(r, ["image_url", "image"], ""),
            stack_tags: window.Sheets.champ(r, ["stack_tags", "tags"], ""),
            statut: window.Sheets.champ(r, ["statut", "status"], ""),
            date: window.Sheets.champ(r, ["date"], ""),
            type_lien: window.Sheets.champ(r, ["type_lien", "cta"], ""),
            url_destination: window.Sheets.champ(r, ["url_destination", "url"], ""),
            /* V1.1 — colonnes de l'étude de cas (peuvent rester vides) */
            probleme: window.Sheets.champ(r, ["probleme", "problème"], ""),
            solution: window.Sheets.champ(r, ["solution"], ""),
            technologies_detail: window.Sheets.champ(r, ["technologies_detail", "technologies"], ""),
            resultat: window.Sheets.champ(r, ["resultat", "résultat"], ""),
            featured: window.Sheets.toBool(window.Sheets.champ(r, ["featured"], "")),
            ordre: window.Sheets.champ(r, ["ordre", "order"], "0")
          });
        } catch (e) {
          console.error("[Projets] Ligne " + (i + 2) + " ignorée :", e);
        }
      });
      out._source = rows._source;
      return out.sort(window.Sheets.byOrder);
    });
  }

  /* ---- Carousel accueil : featured=true uniquement ---- */
  function carouselAccueil(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = chargement(3);
    recuperer().then(function (projets) {
      var src = projets._source || "google-sheets";
      var featured = projets.filter(function (p) { return p.featured; });
      if (!featured.length) {
        statutSource(containerId, src, 0);
        el.innerHTML = etat("vide", "Aucun projet à la une", "Les projets sélectionnés apparaîtront ici dès qu'ils seront publiés dans le Sheet.");
        return;
      }
      el.innerHTML = featured.slice(0, 6).map(function (p) {
        try { return carte(p); } catch (e) { console.error("[Projets] Carte non rendue :", p.titre, e); return ""; }
      }).join("") || etat("vide", "Aucun projet à la une", "Les projets sélectionnés apparaîtront ici dès qu'ils seront publiés dans le Sheet.");
      statutSource(containerId, src, featured.length);
      window.Prjs.observeNew(el);
    }).catch(function (e) {
      console.error("[Projets] Erreur de chargement :", e);
      statutSource(containerId, "erreur", 0);
      el.innerHTML = etat("erreur", "Impossible de charger les projets", "Vérifiez la publication du Google Sheet puis rechargez la page.", "#", "Réessayer");
    });
  }

  /* ---- Grille page /projets avec filtres ---- */
  function grilleProjets(containerId, filterId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var actif = "Tous";
    var tous = [];

    function render() {
      var list = tous.filter(function (p) { return matcheFiltre(p, actif); });
      if (!list.length) {
        statutSource(containerId, srcActuel, 0);
        el.innerHTML = etat("vide", "Aucun projet dans cette catégorie", "Essayez un autre filtre, ou consultez l'ensemble des projets.", "", "");
        return;
      }
      el.innerHTML = list.map(function (p) {
        try { return carte(p); } catch (e) { console.error("[Projets] Carte non rendue :", p.titre, e); return ""; }
      }).join("") || etat("vide", "Aucun projet dans cette catégorie", "Essayez un autre filtre, ou consultez l'ensemble des projets.");
      statutSource(containerId, srcActuel, list.length);
      window.Prjs.observeNew(el);
    }

    var srcActuel = "google-sheets";
    el.innerHTML = chargement(6);
    recuperer().then(function (projets) {
      srcActuel = projets._source || "google-sheets";
      tous = projets;
      render();
    }).catch(function (e) {
      console.error("[Projets] Erreur de chargement :", e);
      statutSource(containerId, "erreur", 0);
      el.innerHTML = etat("erreur", "Impossible de charger les projets", "Vérifiez la publication du Google Sheet puis rechargez la page.", "", "");
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

  /* ---- Étude de cas (V1.1+) : page générique projets/<slug>/ ----
     Template unique pour n'importe quel projet du Sheet ayant un slug.
     Le Sheet alimente : titre, description, visuel (image_url), statut,
     tags et les 4 sections (probleme, solution, technologies_detail,
     resultat). Champ vide du Sheet + texte statique absent -> section
     masquée. */
  function caseStudy() {
    var page = document.querySelector("[data-cs-page]");
    if (!page) return;
    var slugCible = page.getAttribute("data-cs-page");
    var elStatut = page.querySelector("[data-cs-statut]");
    var elTags = page.querySelector("[data-cs-tags]");
    var elTitre = page.querySelector("[data-cs-titre]");
    var elDesc = page.querySelector("[data-cs-desc]");
    var elMedia = page.querySelector("[data-cs-media]");

    /* Retire les fragments de description de colonnes que Google Sheets
       laisse parfois dans les cellules (ex: "État actuel, honnête…" + texte). */
    function nettoyerContenu(v) {
      if (!v) return "";
      var s = String(v);
      var fragments = [
        "Le problème que le projet résout, 2-3 phrases",
        "Comment le système fonctionne concrètement, 2-4 phrases",
        "Description un peu plus riche que stack_tags",
        "État actuel, honnête",
        "peut inclure le rôle de chaque outil"
      ];
      for (var i = 0; i < fragments.length; i++) {
        var idx = s.indexOf(fragments[i]);
        if (idx !== -1) s = s.slice(0, idx) + s.slice(idx + fragments[i].length);
      }
      return s.replace(/^[\s\t\-–—:;,]+/, "").trim();
    }

    recuperer().then(function (projets) {
      var p = null;
      for (var i = 0; i < projets.length; i++) {
        if (projets[i].slug === slugCible) { p = projets[i]; break; }
      }
      if (!p) return;

      if (elTitre && p.titre) elTitre.textContent = p.titre;
      if (elDesc && p.description_courte) elDesc.textContent = p.description_courte;
      if (p.titre) document.title = p.titre + " | Étude de cas — DIGICRAFT Labs";
      if (elStatut && p.statut) elStatut.textContent = p.statut;
      if (elTags) {
        var tags = (p.stack_tags || "").split(/[·|,]/).map(function (t) { return t.trim(); }).filter(Boolean);
        if (tags.length) {
          elTags.innerHTML = tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join("");
        }
      }
      if (elMedia) {
        if (p.image_url) {
          elMedia.innerHTML = '<img src="' + imgUrl(p.image_url) + '" alt="' + esc(p.titre || "") + '" loading="lazy" decoding="async" onerror="this.remove()">';
        } else {
          var im = elMedia.querySelector("img");
          if (!im || !im.getAttribute("src")) elMedia.style.display = "none";
        }
      }

      /* Bouton d'action directe (type_lien → url_destination) */
      var elAction = page.querySelector("[data-cs-action]");
      if (elAction) {
        var libA = libelleAction(p);
        var urlA = extUrl(p.url_destination);
        elAction.textContent = libA;
        if (urlA !== "#") elAction.setAttribute("href", urlA);
        elAction.setAttribute("aria-label", libA + " : " + (p.titre || ""));
      }

      var map = {
        "probleme": "probleme",
        "solution": "solution",
        "technologies_detail": "technologies_detail",
        "resultat": "resultat"
      };
      Object.keys(map).forEach(function (key) {
        var section = page.querySelector('[data-cs-section="' + key + '"]');
        if (!section) return;
        var txtEl = section.querySelector("[data-cs-txt]");
        var val = nettoyerContenu(p[key] || "");
        if (val) {
          if (txtEl) txtEl.textContent = val;
        } else if (txtEl && !txtEl.textContent.trim()) {
          section.style.display = "none";
        }
      });
    }).catch(function (e) {
      console.error("[Projets] Étude de cas :", e);
    });
  }

  /* IntersectionObserver partagé pour la révélation */
  window.revealObserver = null;
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); obs.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { obs.observe(el); });
    window.revealObserver = obs;
    /* Rattrapage : cartes dynamiques insérées avant l'init de l'observateur */
    document.querySelectorAll(".reveal:not(.is-visible)").forEach(function (el) { obs.observe(el); });
  }

  /* Observe les cartes dynamiques fraîchement insérées. Si l'observateur
     n'existe pas encore (rendu plus rapide que l'init), rend visible
     immédiatement — jamais de carte invisible par accident. */
  function observeNew(root) {
    if (!root) return;
    var items = root.querySelectorAll(".reveal:not(.is-visible)");
    if (!items.length) return;
    if (window.revealObserver) {
      items.forEach(function (el) { window.revealObserver.observe(el); });
    } else {
      items.forEach(function (el) { el.classList.add("is-visible"); });
    }
  }
  window.Prjs = { carouselAccueil: carouselAccueil, grilleProjets: grilleProjets, caseStudy: caseStudy, initReveal: initReveal, observeNew: observeNew, esc: esc };
})();
