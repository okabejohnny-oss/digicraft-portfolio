/* ============================================================
   MAIN.JS — Comportement global
   Header sticky · menu mobile plein écran · injection des
   Parametres (Google Sheets) · carousel · formulaire de contact
   ============================================================ */
(function () {
  "use strict";

  function qs(s, c) { return (c || document).querySelector(s); }
  function qsa(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---------- Header : ombre au scroll ---------- */
  function initHeader() {
    var header = qs(".site-header");
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Menu mobile plein écran ---------- */
  function initMenu() {
    var toggle = qs(".nav-toggle");
    var menu = qs(".mobile-menu");
    if (!toggle || !menu) return;
    var set = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
      menu.setAttribute("aria-hidden", String(!open));
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", function () {
      set(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) set(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) set(false);
    });
  }

  /* ---------- Carousel : flèches desktop ---------- */
  function initCarousel() {
    qsa(".carousel").forEach(function (track) {
      var prev = qs("[data-carousel-prev]", track.closest(".carousel-wrap"));
      var next = qs("[data-carousel-next]", track.closest(".carousel-wrap"));
      if (!prev || !next) return;
      var step = function (dir) {
        var w = track.clientWidth;
        var target = track.scrollLeft + dir * Math.max(w * 0.86, 320);
        track.scrollTo({ left: target, behavior: "smooth" });
      };
      prev.addEventListener("click", function () { step(-1); });
      next.addEventListener("click", function () { step(1); });
    });
  }

  /* ---------- Injection des Parametres (Sheets ou local) ---------- */
  function initParametres() {
    window.Sheets.loadSheet("parametres").then(function (rows) {
      var P = window.Sheets.paramsToObject(rows);

      /* Texte */
      var textMap = {
        "[data-p-nom]": P.nom_complet,
        "[data-p-titre]": P.titre_professionnel,
        "[data-p-slogan]": P.slogan_hero,
        "[data-p-desc-hero]": P.description_hero,
        "[data-p-statut]": P.statut_disponibilite
      };
      Object.keys(textMap).forEach(function (sel) {
        qsa(sel).forEach(function (el) {
          if (textMap[sel]) el.textContent = textMap[sel];
        });
      });

      /* Liens (normalisation : ajoute https:// si le protocole manque) */
      var normUrl = function (u) {
        if (!u) return u;
        return /^https?:\/\//i.test(u) ? u : "https://" + u;
      };
      var linkMap = {
        "[data-p-linkedin]": normUrl(P.url_linkedin),
        "[data-p-telegram]": normUrl(P.url_telegram),
        "[data-p-google]": normUrl(P.url_google_business),
        "[data-p-boutique]": normUrl(P.url_boutique)
      };
      Object.keys(linkMap).forEach(function (sel) {
        qsa(sel).forEach(function (el) {
          if (linkMap[sel]) el.setAttribute("href", linkMap[sel]);
        });
      });

      /* Email : liens mailto + valeur */
      qsa("[data-p-email]").forEach(function (el) {
        if (P.email_contact) el.setAttribute("href", "mailto:" + P.email_contact);
      });
      qsa("[data-p-email-txt]").forEach(function (el) {
        if (P.email_contact) el.textContent = P.email_contact;
      });

      /* Meta description dynamique (page courante) */
      var meta = qs('meta[name="description"]');
      var desc = P.description_hero || "";
      if (meta && desc) meta.setAttribute("content", desc.replace(/\s+/g, " ").trim());

      window.PARAMS = P;
    }).catch(function () {
      console.warn("Parametres indisponibles — valeurs par défaut utilisées.");
    });
  }

  /* ---------- Formulaire de contact : Make → Telegram ---------- */
  /* V2 : la soumission envoie une notification Telegram via le webhook
     Make. L'URL est lue depuis le Google Sheet (onglet Parametres →
     clé `url_webhook_contact`) pour pouvoir la changer (ex. nouveau
     compte Make) sans toucher au code. En secours, la valeur locale
     de config.js est utilisée. Si aucune URL n'est disponible, le
     formulaire affiche l'erreur avec l'email de secours au lieu
     d'échouer silencieusement. */

  function initContact() {
    var form = qs("[data-contact-form]");
    if (!form) return;
    var btn = qs("[type=submit]", form);
    var okBox = qs("[data-form-ok]");
    var errBox = qs("[data-form-error]");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (errBox) errBox.classList.remove("is-visible");

      var nom = qs("#nom", form).value.trim();
      var email = qs("#email", form).value.trim();
      var sujet = qs("#sujet", form).value.trim();
      var message = qs("#message", form).value.trim();

      /* Validation 1 : aucun champ vide */
      if (!nom || !email || !sujet || !message) {
        var premierVide = [nom, email, sujet, message].findIndex(function (v) { return !v; });
        var champ = qsa(".field", form)[premierVide];
        if (champ) champ.querySelector("input,textarea,select").focus();
        return;
      }
      /* Validation 2 : format email basique */
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        qs("#email", form).focus();
        if (errBox) {
          errBox.querySelector("b").textContent = "Adresse email invalide.";
          errBox.querySelector("p").textContent = "Vérifiez le format, par exemple : vous@exemple.com";
          errBox.classList.add("is-visible");
        }
        return;
      }

      /* URL du webhook : Sheet d'abord (url_webhook_contact), sinon la
         valeur locale de secours (config.js defaults). Aucune URL
         disponible (Sheet injoignable + pas de fallback) → erreur
         explicite avec l'email de secours, jamais d'échec silencieux. */
      var webhook = (window.PARAMS && window.PARAMS.url_webhook_contact) ||
                    (window.CONFIG && window.CONFIG.defaults && window.CONFIG.defaults.url_webhook_contact);
      if (!webhook) {
        if (errBox) {
          errBox.querySelector("b").textContent = "Envoi momentanément indisponible.";
          errBox.querySelector("p").textContent = "Vous pouvez aussi m'écrire directement à contact.agoudavi@gmail.com";
          errBox.classList.add("is-visible");
        }
        return;
      }

      /* Envoi JSON vers le webhook Make ; abandon après 15 s pour ne
         jamais laisser le visiteur sans réponse (scénario coupé…). */
      btn.disabled = true;
      btn.textContent = "Envoi en cours…";
      var abort = "AbortController" in window ? new AbortController() : null;
      var timer = abort ? setTimeout(function () { abort.abort(); }, 15000) : null;

      fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: nom, email: email, sujet: sujet, message: message }),
        signal: abort ? abort.signal : undefined
      }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        if (timer) clearTimeout(timer);
        form.style.display = "none";
        if (okBox) okBox.classList.add("is-visible");
        if (window.Track) window.Track.event("contact_envoye", { statut: "succes", sujet: sujet });
      }).catch(function () {
        if (timer) clearTimeout(timer);
        btn.disabled = false;
        btn.textContent = "Envoyer le message";
        if (errBox) {
          errBox.querySelector("b").textContent = "Une erreur est survenue.";
          errBox.querySelector("p").textContent = "Vous pouvez aussi m'écrire directement à contact.agoudavi@gmail.com";
          errBox.classList.add("is-visible");
        }
        if (window.Track) window.Track.event("contact_envoye", { statut: "erreur" });
      });
    });
  }

  /* ---------- Build in public : visibilité conditionnelle ---------- */
  /* La section (accueil + page dédiée) et le lien footer ne s'affichent
     que si l'onglet BuildInPublic du Sheet contient au moins une vraie
     ligne de données. Onglet vide → masqués automatiquement ; dès
     qu'une ligne est ajoutée, tout réapparaît au rechargement. */
  function initBuildPublic() {
    window.Sheets.loadSheet("buildinpublic").then(function (items) {
      if (items.length) return;
      qsa(".site-footer a").forEach(function (a) {
        if (a.textContent.indexOf("Build in public") === -1) return;
        var li = a.closest("li");
        if (li) li.style.display = "none"; else a.style.display = "none";
      });
      var accueil = document.getElementById("build-in-public");
      if (accueil) accueil.style.display = "none";
      var grille = document.getElementById("grille-build");
      if (grille) {
        var sec = grille.closest("section");
        if (sec) sec.style.display = "none";
      }
    }).catch(function () {});
  }

  /* ---------- Divers ---------- */
  function initMisc() {
    /* Année du copyright */
    qsa("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
    /* Mise en évidence du lien actif du header */
    var norm = function (u) { return String(u || "").replace(/\.html$/, "").replace(/\/+$/, ""); };
    var here = window.location.pathname;
    if (here.charAt(here.length - 1) === "/") here += "index.html";
    qsa(".main-nav a, .mobile-menu nav a").forEach(function (a) {
      var href = new URL(a.getAttribute("href") || "", window.location.href).pathname;
      if (norm(href) === norm(here)) a.setAttribute("aria-current", "page");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initHeader();
    initMenu();
    initCarousel();
    initParametres();
    initContact();
    initBuildPublic();
    initMisc();
  });
})();
