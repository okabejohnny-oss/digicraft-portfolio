/* ============================================================
   CONSENT.JS — Gestion du consentement cookies / confidentialité
   ------------------------------------------------------------
   - Bannière de consentement (1re visite) + panneau de préférences
     (« Gérer mes cookies ») + panneau d'information cookies.
   - Google Consent Mode v2 : les états par défaut (denied) sont
     poussés AVANT tout chargement de GA4 ; `ad_storage`,
     `ad_user_data`, `ad_personalization` restent toujours denied
     (le site n'utilise pas de publicité).
   - Microsoft Clarity n'est chargé qu'après acceptation des
     statistiques ; l'API officielle `clarity("consent", …)` est
     aussi appelée pour respecter la configuration Clarity.
   - Stockage : localStorage, clé `digicraft_consent`
     { analytics: bool, version: "1.0", timestamp: ISO }.
     Aucune donnée personnelle stockée.
   - Événement `digicraft:consent` émis à chaque changement →
     consommé par js/analytics.js (chargement GA4/Clarity).
   - Expose window.Consent : get(), accept(), refuse(), save(),
     ouvrirPreferences(), ouvrirInfos().
   ============================================================ */
(function () {
  "use strict";

  var CLE = "digicraft_consent";
  var VERSION = "1.0";

  /* ---------- Stockage ---------- */
  function lire() {
    try {
      var raw = localStorage.getItem(CLE);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || typeof o.analytics !== "boolean" || o.version !== VERSION) return null;
      return o;
    } catch (e) { return null; }
  }
  function ecrire(analytics) {
    var o = { analytics: !!analytics, version: VERSION, timestamp: new Date().toISOString() };
    try { localStorage.setItem(CLE, JSON.stringify(o)); } catch (e) {}
    return o;
  }

  var enregistre = lire(); // null si aucun choix valide
  var statsOK = !!(enregistre && enregistre.analytics);

  /* ---------- Google Consent Mode v2 — AVANT tout script GA4 ---------- */
  window.dataLayer = window.dataLayer || [];
  var gtag = function () { window.dataLayer.push(arguments); };
  window.gtag = window.gtag || gtag;
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: statsOK ? "granted" : "denied"
  });

  /* ---------- Application d'un choix ---------- */
  function appliquer(granted) {
    statsOK = !!granted;
    window.gtag("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: statsOK ? "granted" : "denied"
    });
    /* API officielle Clarity (sans effet si non configurée côté projet) */
    try { if (window.clarity) window.clarity("consent", statsOK ? "granted" : "denied"); } catch (e) {}
    document.dispatchEvent(new CustomEvent("digicraft:consent", { detail: { analytics: statsOK } }));
  }

  /* ---------- UI : bannière + panneaux ---------- */
  var banner = null, modal = null, info = null;
  var dernierFocus = null;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function creerEl(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  function markupBanniere() {
    return '<div class="dl-banner" id="dl-banner" role="region" aria-label="Gestion du consentement cookies">' +
      '<div class="dl-banner-inner">' +
        '<div class="dl-banner-text">' +
          '<strong class="dl-banner-title">Votre confidentialité compte</strong>' +
          '<p>Nous utilisons des outils d\'analyse pour comprendre comment notre site est utilisé et améliorer votre expérience. Vous pouvez accepter, refuser ou personnaliser votre choix.</p>' +
          '<button type="button" class="dl-text-btn" data-dl-infos>En savoir plus sur les cookies</button>' +
        '</div>' +
        '<div class="dl-banner-actions">' +
          '<button type="button" class="btn btn-gold btn-sm" data-dl-accept>Accepter</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-dl-refuse>Refuser</button>' +
          '<button type="button" class="dl-text-btn" data-dl-custom>Personnaliser</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function markupPreferences() {
    return '<div class="dl-modal" id="dl-modal" role="dialog" aria-modal="true" aria-labelledby="dl-modal-title" hidden>' +
      '<div class="dl-backdrop" data-dl-close></div>' +
      '<div class="dl-box" role="document">' +
        '<h3 id="dl-modal-title">Préférences de confidentialité</h3>' +
        '<div class="dl-cat">' +
          '<div class="dl-cat-txt"><strong>Nécessaires</strong><p>Permettent le fonctionnement du site (navigation, sécurité, sauvegarde de vos préférences). Toujours actifs.</p></div>' +
          '<span class="dl-pill">Toujours actifs</span>' +
        '</div>' +
        '<div class="dl-cat">' +
          '<div class="dl-cat-txt"><strong>Statistiques</strong><p>Nous permettent de comprendre comment les visiteurs utilisent le site afin d\'améliorer son fonctionnement. (Google Analytics 4, Microsoft Clarity)</p></div>' +
          '<label class="dl-switch"><input type="checkbox" id="dl-stats-cb" aria-label="Activer les statistiques"><span class="dl-slider"></span></label>' +
        '</div>' +
        '<div class="dl-modal-actions">' +
          '<button type="button" class="btn btn-gold btn-sm" data-dl-save>Enregistrer mes préférences</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function markupInfos() {
    return '<div class="dl-modal" id="dl-info" role="dialog" aria-modal="true" aria-labelledby="dl-info-title" hidden>' +
      '<div class="dl-backdrop" data-dl-close></div>' +
      '<div class="dl-box" role="document">' +
        '<h3 id="dl-info-title">En savoir plus sur les cookies</h3>' +
        '<div class="dl-info-body">' +
          '<p>Ce site n\'utilise <strong>aucun cookie publicitaire ou marketing</strong>. Seuls des outils d\'analyse sont proposés :</p>' +
          '<ul>' +
            '<li><strong>Google Analytics 4</strong> — mesure d\'audience anonymisée (pages vues, provenance, comportement).</li>' +
            '<li><strong>Microsoft Clarity</strong> — enregistrements de sessions et cartes de chaleur pour améliorer l\'ergonomie.</li>' +
          '</ul>' +
          '<p>Ces outils nous aident à comprendre comment le site est utilisé, sans collecter votre nom, votre email ou le contenu de vos messages. Vous pouvez modifier votre choix à tout moment via « Gérer mes cookies » dans le pied de page.</p>' +
        '</div>' +
        '<div class="dl-modal-actions">' +
          '<button type="button" class="btn btn-gold btn-sm" data-dl-close>Fermer</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function montrer(el) {
    if (!el) return;
    el.hidden = false;
    dernierFocus = document.activeElement;
    var focusable = el.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    if (focusable) focusable.focus();
  }
  function cacher(el) {
    if (!el || el.hidden) return;
    el.hidden = true;
    if (dernierFocus && dernierFocus.focus) dernierFocus.focus();
  }

  function fermerBanniere() { if (banner) banner.classList.remove("is-visible"); }
  function ouvrirPreferences() { if (modal) { var cb = $("#dl-stats-cb", modal); if (cb) cb.checked = statsOK; montrer(modal); } }
  function ouvrirInfos() { if (info) montrer(info); }

  /* Piège de focus dans les panneaux (Tab) + fermeture Échap */
  function gererClavier(e) {
    if (e.key === "Escape") {
      cacher(modal); cacher(info);
      return;
    }
    if (e.key !== "Tab") return;
    var ouvert = (!modal.hidden && modal) ? modal : (info && !info.hidden ? info : null);
    if (!ouvert) return;
    var items = Array.prototype.slice.call(ouvert.querySelectorAll("button, [href], input, [tabindex]:not([tabindex='-1'])")).filter(function (el) { return !el.disabled; });
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function initUI() {
    if (document.getElementById("dl-banner")) return;

    banner = creerEl(markupBanniere());
    modal = creerEl(markupPreferences());
    info = creerEl(markupInfos());
    document.body.appendChild(banner);
    document.body.appendChild(modal);
    document.body.appendChild(info);

    /* Boutons de la bannière */
    banner.addEventListener("click", function (e) {
      var t = e.target;
      if (t.closest("[data-dl-accept]")) { window.Consent.accept(); }
      else if (t.closest("[data-dl-refuse]")) { window.Consent.refuse(); }
      else if (t.closest("[data-dl-custom]")) { ouvrirPreferences(); }
      else if (t.closest("[data-dl-infos]")) { ouvrirInfos(); }
    });

    /* Panneaux : fermeture, sauvegarde */
    [modal, info].forEach(function (pan) {
      pan.addEventListener("click", function (e) {
        var t = e.target;
        if (t.closest("[data-dl-close]")) { cacher(pan); }
        if (t.closest("[data-dl-save]")) {
          var cb = $("#dl-stats-cb", modal);
          window.Consent.save(cb ? cb.checked : false);
        }
      });
    });

    document.addEventListener("keydown", gererClavier);

    /* Lien « Gérer mes cookies » (footer, toutes les pages) */
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-consent-manage]");
      if (b) { e.preventDefault(); ouvrirPreferences(); }
    });

    /* Affichage bannière : uniquement si aucun choix valide enregistré */
    if (!enregistre) {
      setTimeout(function () { banner.classList.add("is-visible"); }, 600);
    }
  }

  /* ---------- API publique ---------- */
  window.Consent = {
    get: function () { return { analytics: statsOK }; },
    version: VERSION,
    aChoix: function () { return enregistre !== null; },
    accept: function () { appliquer(true); ecrire(true); fermerBanniere(); },
    refuse: function () { appliquer(false); ecrire(false); fermerBanniere(); },
    save: function (granted) { appliquer(!!granted); ecrire(!!granted); cacher(modal); fermerBanniere(); },
    ouvrirPreferences: ouvrirPreferences,
    ouvrirInfos: ouvrirInfos
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUI);
  } else {
    initUI();
  }
})();
