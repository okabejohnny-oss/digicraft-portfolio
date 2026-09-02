/* ============================================================
   ANALYTICS.JS — Google Analytics 4 + Microsoft Clarity
   ------------------------------------------------------------
   - IDs lus depuis le Google Sheet (onglet Parametres, clés
     `ga4_id` et `clarity_id`) — modifiables sans toucher au code.
     En secours : window.CONFIG.tracking (config.js).
   - Aucun script injecté si les IDs sont vides.
   - PILOTÉ PAR LE CONSENTEMENT (js/consent.js) : GA4 et Clarity ne
     sont chargés qu'après acceptation des statistiques (événement
     `digicraft:consent`). Refus → rien n'est chargé ; révocation →
     Consent Mode v2 mis à jour (denied) et `clarity("consent")`
     appelée. Consent Mode v2 (default) est posé par consent.js
     AVANT ce fichier.
   - Pas de doublons : chaque script n'est injecté qu'une fois.
   - Expose window.Track.event(nom, params) — les événements ne sont
     envoyés que si le consentement statistiques est accordé.
   ============================================================ */
(function () {
  "use strict";

  var injectes = { ga4: false, clarity: false };

  function ids() {
    var defs = (window.CONFIG && window.CONFIG.tracking) || {};
    var ga4 = defs.ga4 || "";
    var clarity = defs.clarity || "";
    if (window.PARAMS) {
      if (window.PARAMS.ga4_id) ga4 = window.PARAMS.ga4_id;
      if (window.PARAMS.clarity_id) clarity = window.PARAMS.clarity_id;
    }
    return { ga4: ga4, clarity: clarity };
  }

  function statsAutorisees() {
    return !!(window.Consent && window.Consent.get() && window.Consent.get().analytics);
  }

  function chargerGA4(id) {
    if (injectes.ga4) return;
    if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) { injectes.ga4 = true; return; }
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id, { anonymize_ip: true });
    injectes.ga4 = true;
  }

  function chargerClarity(id) {
    if (injectes.clarity) return;
    if (document.querySelector('script[src*="clarity.ms/tag"]')) { injectes.clarity = true; return; }
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", id);
    injectes.clarity = true;
    try { window.clarity("consent", "granted"); } catch (e) {}
  }

  /* Applique la configuration courante selon le consentement.
     Idempotent : aucun doublon, rejouable à chaque changement. */
  function appliquer() {
    var cfg = ids();
    if (!statsAutorisees()) {
      /* Refus / révocation : on n'injecte rien ; si les scripts étaient
         déjà chargés, on met le consentement GA4 à jour (denied) et on
         prévient Clarity via son API officielle. */
      if (injectes.ga4 && window.gtag) {
        window.gtag("consent", "update", {
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
          analytics_storage: "denied"
        });
      }
      try { if (window.clarity) window.clarity("consent", "denied"); } catch (e) {}
      return;
    }
    if (cfg.ga4) chargerGA4(cfg.ga4);
    if (cfg.clarity) chargerClarity(cfg.clarity);
  }

  function demarrer() {
    appliquer();
    /* Les paramètres du Sheet arrivent après initParametres (main.js) :
       on ré-applique quand PARAMS est prêt (max 5 s) et à chaque
       changement de consentement. */
    var t0 = Date.now();
    var iv = setInterval(function () {
      if (window.PARAMS || Date.now() - t0 > 5000) {
        clearInterval(iv);
        appliquer();
      }
    }, 150);
    document.addEventListener("digicraft:consent", appliquer);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", demarrer);
  } else {
    demarrer();
  }

  /* ---------- API d'événements (gardée : aucun envoi sans consentement) ---------- */
  window.Track = {
    event: function (name, params) {
      if (!statsAutorisees()) return;
      if (window.gtag) window.gtag("event", name, params || {});
    }
  };

  /* Liens externes (nouvel onglet) — événement GA4 automatique */
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[target='_blank']") : null;
    if (a && a.href && statsAutorisees()) window.Track.event("lien_externe", { url: a.href });
  });
})();
