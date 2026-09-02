/* ============================================================
   BUILD.JS — Rendu des expérimentations "Build in public"
   (accueil max 4 featured en carousel ; page /build-in-public/)
   Colonnes attendues dans le Sheet "BuildInPublic" :
   id, titre, description, image_url, statut, date,
   lien_optionnel, featured, ordre
   ============================================================ */
(function () {
  "use strict";

  var COVER_COLORS = ["#8A6A08", "#3E5C50", "#5B4A8A", "#8A4A3E", "#2F5D7E", "#6B6A63"];

  /* Couverture de secours : initiales du titre sur fond profond */
  function couverture(p) {
    var mots = String(p.titre || "B").split(/\s+/).filter(Boolean);
    var initials = mots.slice(0, 2).map(function (m) { return m.charAt(0).toUpperCase(); }).join("");
    var hash = 0;
    for (var i = 0; i < initials.length; i++) hash = (hash * 31 + initials.charCodeAt(i)) % 997;
    var bg = COVER_COLORS[hash % COVER_COLORS.length];
    return '<div class="b-cover" aria-hidden="true" style="--cov-bg:' + bg + '">' +
      '<span class="b-cover-brand">DIGICRAFT</span>' +
      '<span class="b-cover-letters">' + initials + '</span>' +
      '<span class="b-cover-line"></span>' +
    '</div>';
  }

  function imgUrl(u) {
    if (!u) return "";
    if (/^(https?:)?\/\//i.test(u)) return u;
    return (window.SITE_ROOT || "") + u;
  }
  function extUrl(u) {
    if (!u) return "#";
    var v = String(u).trim();
    if (/^https?:\/\//i.test(v)) return v;
    if (v.charAt(0) === "/") return (window.SITE_ROOT || "") + v.replace(/^\//, "");
    return "https://" + v;
  }

  /* Classe de couleur du badge selon le statut */
  function statutClasse(statut) {
    var s = String(statut || "").toLowerCase();
    if (s.indexOf("abandon") !== -1) return "is-stop";
    if (s.indexOf("devenu") !== -1 || s.indexOf("projet") !== -1) return "is-done";
    if (s.indexOf("explor") !== -1) return "is-explore";
    if (s.indexOf("test") !== -1) return "is-test";
    return "";
  }

  function carte(p) {
    var img = p.image_url
      ? '<img src="' + imgUrl(p.image_url) + '" alt="' + esc(p.titre) + '" loading="lazy" decoding="async" onerror="this.remove()">'
      : "";
    var statut = p.statut
      ? '<span class="b-stat' + (statutClasse(p.statut) ? " " + statutClasse(p.statut) : "") + '"><span class="b-stat-dot"></span>' + esc(p.statut) + '</span>'
      : "";
    var date = p.date ? '<span class="b-date">' + esc(window.Sheets.formatDate(p.date)) + '</span>' : "";
    var lien = p.lien_optionnel
      ? '<a class="b-link" href="' + extUrl(p.lien_optionnel) + '" target="_blank" rel="noopener" aria-label="Voir : ' + esc(p.titre) + '">Voir <span class="arr">→</span></a>'
      : "";
    return '<article class="card card-hover b-card reveal">' +
      '<div class="b-media">' +
        couverture(p) + img + statut +
      '</div>' +
      '<div class="b-body">' +
        '<h3>' + esc(p.titre) + '</h3>' +
        '<p class="b-desc">' + esc(p.description || "") + '</p>' +
        '<div class="b-foot">' + date + lien + '</div>' +
      '</div>' +
    '</article>';
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function recuperer() {
    return window.Sheets.loadSheet("buildinpublic").then(function (rows) {
      var out = [];
      rows.forEach(function (r, i) {
        try {
          var titre = window.Sheets.champ(r, ["titre", "title", "nom"], "");
          if (!titre) return; // ligne vide ou ligne d'instruction
          out.push({
            id: window.Sheets.champ(r, ["id"], "BP" + (i + 1)),
            titre: titre,
            description: window.Sheets.champ(r, ["description"], ""),
            image_url: window.Sheets.champ(r, ["image_url", "image"], ""),
            statut: window.Sheets.champ(r, ["statut", "status"], ""),
            date: window.Sheets.champ(r, ["date"], ""),
            lien_optionnel: window.Sheets.champ(r, ["lien_optionnel", "lien", "url"], ""),
            featured: window.Sheets.toBool(window.Sheets.champ(r, ["featured"], "")),
            ordre: window.Sheets.champ(r, ["ordre", "order"], "0")
          });
        } catch (e) {
          console.error("[Build] Ligne " + (i + 2) + " ignorée :", e);
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
      div.innerHTML = '<span class="dot"></span>Données : Google Sheets · ' + n + ' expérimentation(s)';
    } else if (source === "local") {
      div.innerHTML = '<span class="dot"></span>Données de secours (Google Sheets injoignable)';
    } else {
      div.innerHTML = '<span class="dot"></span>Erreur de chargement — ouvrez la console (F12) pour le détail';
      div.classList.add("is-erreur");
    }
    el.parentElement.insertBefore(div, el.nextSibling);
  }

  /* ---- Accueil : max 4 featured (carousel) ---- */
  function accueil(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '<div class="skel" style="min-height:300px"></div>'.repeat(3);
    recuperer().then(function (items) {
      var src = items._source || "google-sheets";
      var max = window.CONFIG.featuredBuildLimit || 4;
      var sel = items.filter(function (p) { return p.featured; }).slice(0, max);
      if (!sel.length) {
        var section = el.closest("section");
        if (section) section.style.display = "none";
        return;
      }
      el.innerHTML = sel.map(function (p) {
        try { return carte(p); } catch (e) { console.error("[Build] Carte non rendue :", p.titre, e); return ""; }
      }).join("") || '<div class="dyn-state"><div class="ds-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></div><h3>Aucune expérimentation à la une</h3><p>Ce que je teste en ce moment apparaîtra ici.</p></div>';
      statutSource(containerId, src, sel.length);
      window.Prjs.observeNew(el);
    }).catch(function (e) {
      console.error("[Build] Erreur de chargement :", e);
      statutSource(containerId, "erreur", 0);
      el.innerHTML = '<div class="dyn-state"><div class="ds-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg></div><h3>Impossible de charger les expérimentations</h3><p>Vérifiez la publication du Google Sheet puis rechargez la page.</p></div>';
    });
  }

  /* ---- Page /build-in-public/ : toutes les entrées (grille) ---- */
  function page(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '<div class="skel" style="min-height:300px"></div>'.repeat(6);
    recuperer().then(function (items) {
      var src = items._source || "google-sheets";
      if (!items.length) {
        var section = el.closest("section");
        if (section) section.style.display = "none";
        return;
      }
      el.innerHTML = items.map(function (p) {
        try { return carte(p); } catch (e) { console.error("[Build] Carte non rendue :", p.titre, e); return ""; }
      }).join("") || '<div class="dyn-state"><div class="ds-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></div><h3>Aucune entrée pour le moment</h3><p>Le premier prototype en cours de test apparaîtra ici.</p></div>';
      statutSource(containerId, src, items.length);
      window.Prjs.observeNew(el);
    }).catch(function (e) {
      console.error("[Build] Erreur de chargement :", e);
      statutSource(containerId, "erreur", 0);
      el.innerHTML = '<div class="dyn-state"><div class="ds-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg></div><h3>Impossible de charger les expérimentations</h3><p>Vérifiez la publication du Google Sheet puis rechargez la page.</p></div>';
    });
  }

  window.Bld = { accueil: accueil, page: page, carte: carte, recuperer: recuperer };
})();
