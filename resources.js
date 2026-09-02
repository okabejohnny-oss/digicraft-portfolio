/* ============================================================
   RESOURCES.JS — Rendu des ressources / produits digitaux
   (accueil max 3 featured — blueprint §10 ; page /boutique)
   Colonnes attendues dans le Sheet "Ressources" (§18) :
   id, nom_produit, slug, description, prix, devise, image_cover,
   url_boutique, badge, featured, ordre
   ============================================================ */
(function () {
  "use strict";

  var COVER_COLORS = ["#8A6A08", "#3E5C50", "#5B4A8A", "#8A4A3E", "#2F5D7E", "#6B6A63"];

  /* Couverture de secours : initiales du produit sur fond doré profond */
  function couverture(p) {
    var mots = String(p.nom_produit || "D").split(/\s+/).filter(Boolean);
    var initials = mots.slice(0, 2).map(function (m) { return m.charAt(0).toUpperCase(); }).join("");
    var hash = 0;
    for (var i = 0; i < initials.length; i++) hash = (hash * 31 + initials.charCodeAt(i)) % 997;
    var bg = COVER_COLORS[hash % COVER_COLORS.length];
    return '<div class="r-cover" aria-hidden="true" style="--cov-bg:' + bg + '">' +
      '<span class="r-cover-brand">DIGICRAFT</span>' +
      '<span class="r-cover-letters">' + initials + '</span>' +
      '<span class="r-cover-line"></span>' +
    '</div>';
  }

  /* Les URLs d'images peuvent venir du Sheet (http…) ou être relatives
     (assets/…) : dans ce cas on les préfixe du chemin racine du site. */
  function imgUrl(u) {
    if (!u) return "";
    if (/^(https?:)?\/\//i.test(u)) return u;
    return (window.SITE_ROOT || "") + u;
  }
  /* URL externe : ajoute https:// si le protocole manque */
  function extUrl(u) {
    if (!u) return "#";
    return /^https?:\/\//i.test(u) ? u : "https://" + u;
  }

  function carte(p) {
    var prix = p.prix ? p.prix + (p.devise ? " " + p.devise : "") : "—";
    var img = p.image_cover
      ? '<img src="' + imgUrl(p.image_cover) + '" alt="' + esc(p.nom_produit) + '" loading="lazy" decoding="async" onerror="this.remove()">'
      : "";
    var badge = p.badge ? '<span class="badge">' + esc(p.badge) + '</span>' : "";
    return '<article class="card card-hover r-card reveal">' +
      '<a class="r-media" href="' + extUrl(p.url_boutique) + '" target="_blank" rel="noopener" aria-label="Voir ' + esc(p.nom_produit) + ' dans la boutique">' +
        badge + couverture(p) + img +
      '</a>' +
      '<div class="r-body">' +
        '<h3>' + esc(p.nom_produit) + '</h3>' +
        '<p class="r-desc">' + esc(p.description || "") + '</p>' +
        '<div class="r-foot">' +
          '<span class="r-price">' + esc(prix) + '<small> · digital</small></span>' +
        '</div>' +
        '<a class="btn btn-ghost btn-sm btn-block" href="' + extUrl(p.url_boutique) + '" target="_blank" rel="noopener">Voir dans la boutique <span class="arr">→</span></a>' +
      '</div>' +
    '</article>';
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* Construit des objets propres, champ par champ (alias + casse tolérées),
     en isolant chaque ligne : une ligne problématique est ignorée et
     loguée, jamais l'ensemble du rendu. */
  function recuperer() {
    return window.Sheets.loadSheet("ressources").then(function (rows) {
      var out = [];
      rows.forEach(function (r, i) {
        try {
          var nom = window.Sheets.champ(r, ["nom_produit", "nom", "titre", "title"], "");
          if (!nom) return; // ligne vide ou ligne d'instruction
          out.push({
            id: window.Sheets.champ(r, ["id"], "R" + i),
            nom_produit: nom,
            slug: window.Sheets.champ(r, ["slug"], ""),
            description: window.Sheets.champ(r, ["description"], ""),
            prix: window.Sheets.champ(r, ["prix", "price"], ""),
            devise: window.Sheets.champ(r, ["devise", "currency"], ""),
            image_cover: window.Sheets.champ(r, ["image_cover", "image"], ""),
            url_boutique: window.Sheets.champ(r, ["url_boutique", "url"], ""),
            badge: window.Sheets.champ(r, ["badge"], ""),
            featured: window.Sheets.toBool(window.Sheets.champ(r, ["featured"], "")),
            ordre: window.Sheets.champ(r, ["ordre", "order"], "0")
          });
        } catch (e) {
          console.error("[Ressources] Ligne " + (i + 2) + " ignorée :", e);
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
      div.innerHTML = '<span class="dot"></span>Données : Google Sheets · ' + n + ' produit(s)';
    } else if (source === "local") {
      div.innerHTML = '<span class="dot"></span>Données de secours (Google Sheets injoignable)';
    } else {
      div.innerHTML = '<span class="dot"></span>Erreur de chargement — ouvrez la console (F12) pour le détail';
      div.classList.add("is-erreur");
    }
    el.parentElement.insertBefore(div, el.nextSibling);
  }

  /* ---- Accueil : max 3 featured ---- */
  function accueil(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '<div class="skel" style="min-height:260px"></div>'.repeat(3);
    recuperer().then(function (prods) {
      var src = prods._source || "google-sheets";
      var sel = prods.filter(function (p) { return p.featured; }).slice(0, 3);
      if (!sel.length) {
        statutSource(containerId, src, 0);
        el.innerHTML = '<div class="dyn-state"><div class="ds-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></div><h3>Aucune ressource à la une</h3><p>Les produits sélectionnés apparaîtront ici.</p></div>';
        return;
      }
      el.innerHTML = sel.map(function (p) {
        try { return carte(p); } catch (e) { console.error("[Ressources] Carte non rendue :", p.nom_produit, e); return ""; }
      }).join("") || '<div class="dyn-state"><div class="ds-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></div><h3>Aucune ressource à la une</h3><p>Les produits sélectionnés apparaîtront ici.</p></div>';
      statutSource(containerId, src, sel.length);
      window.Prjs.observeNew(el);
    }).catch(function (e) {
      console.error("[Ressources] Erreur de chargement :", e);
      statutSource(containerId, "erreur", 0);
      el.innerHTML = '<div class="dyn-state"><div class="ds-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg></div><h3>Impossible de charger les ressources</h3><p>Vérifiez la publication du Google Sheet puis rechargez la page.</p></div>';
    });
  }

  /* ---- Page /boutique : tout ---- */
  function page(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '<div class="skel" style="min-height:260px"></div>'.repeat(6);
    recuperer().then(function (prods) {
      var src = prods._source || "google-sheets";
      if (!prods.length) {
        statutSource(containerId, src, 0);
        el.innerHTML = '<div class="dyn-state"><div class="ds-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></div><h3>Aucun produit pour le moment</h3><p>Les produits seront publiés ici prochainement.</p></div>';
        return;
      }
      el.innerHTML = prods.map(function (p) {
        try { return carte(p); } catch (e) { console.error("[Ressources] Carte non rendue :", p.nom_produit, e); return ""; }
      }).join("") || '<div class="dyn-state"><div class="ds-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></div><h3>Aucun produit pour le moment</h3><p>Les produits seront publiés ici prochainement.</p></div>';
      statutSource(containerId, src, prods.length);
      window.Prjs.observeNew(el);
    }).catch(function (e) {
      console.error("[Ressources] Erreur de chargement :", e);
      statutSource(containerId, "erreur", 0);
      el.innerHTML = '<div class="dyn-state"><div class="ds-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg></div><h3>Impossible de charger les produits</h3><p>Vérifiez la publication du Google Sheet puis rechargez la page.</p></div>';
    });
  }

  window.Ress = { accueil: accueil, page: page };
})();
