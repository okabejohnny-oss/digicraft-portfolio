# DIGICRAFT Labs — Portfolio de Koffa Jean AGOUDAVI

Site vitrine personnel : **ivoire / blanc + or**, premium et minimaliste.
Il présente → démontre → redirige. Il ne vend pas et n'héberge pas de contenu.

Stack : **HTML + CSS + JavaScript vanilla + Google Sheets (CMS) + Cloudflare Pages.**
Aucun framework, aucune dépendance — volontairement léger et rapide.

---

## 1. Structure

```
portfolio/
├── index.html            ← Accueil
├── 404.html
├── favicon.svg
├── robots.txt
├── sitemap.xml
├── projets/index.html    ← Grille + filtres (tous les projets)
├── articles/index.html   ← Tous les articles + filtres plateforme
├── boutique/index.html   ← Tous les produits digitaux
├── a-propos/index.html   ← Page personnelle
├── contact/index.html    ← Formulaire + coordonnées
├── assets/
│   ├── images/           ← koffa-agoudavi.jpg (photo) + visuels projets
│   └── logo/             ← digicraft-labs.svg
├── css/style.css         ← Design system complet
├── js/
│   ├── config.js         ← ⚙️ ID du Google Sheet + défauts
│   ├── sheets.js         ← Couche CMS (fetch CSV publié + parser + secours)
│   ├── projects.js       ← Rendu projets (carousel accueil / grille)
│   ├── articles.js       ← Rendu articles
│   ├── resources.js      ← Rendu produits
│   └── main.js           ← Header, menu, paramètres, formulaire
├── js/data/*.json        ← Données de secours locales (démo hors CMS)
└── sheets-exports/*.csv  ← À importer dans Google Sheets (colonnes exactes)
```

---

## 2. Connecter Google Sheets (CMS)

✅ **Déjà fait** : le Sheet `Portfolio_CMS_DIGICRAFT` est connecté
(`js/config.js` → `sheetId` + GID des 4 onglets).

### À corriger dans le Sheet (liens et visuels)

| Onglet | Colonne | Valeurs actuelles | À remplacer par |
|---|---|---|---|
| Projets | `image_url` | `https://exemple.com/images/…` | URLs des vrais visuels (ou `assets/images/…`) |
| Projets | `url_destination` | `https://exemple.com/…`, `t.me/exemple_bot` | Vrais liens du bot / démo |
| Projets | `featured` | MysteryBot = `FALSE` | `TRUE` si tu veux 3 projets sur l'accueil |
| Articles | `url` | `linkedin.com/in/REMPLACER/posts/exemple` | Vrais liens des publications |
| Articles | `image_url` | `https://exemple.com/…` | (facultatif — non affichée) |
| Ressources | `url_boutique` | `https://exemple.com/boutique/ebook1` | `https://digicraft.mychariow.shop/…` |
| Ressources | `image_cover` | `https://exemple.com/…` | Vraie couverture (ou vide → couverture générée) |

> 💡 Tant que les images sont placeholder, le site affiche des icônes/covers
> dorées de secours : aucune carte cassée.

### Comment ça marche (rappel)

- Le site lit le **CSV publié** de chaque onglet à chaque visite (cache court).
- Ajouter une ligne = le site l'affiche. **Aucun re-déploiement nécessaire.**
- Les lignes vides et les lignes d'instructions du Sheet sont ignorées.
- Les colonnes attendues : voir `sheets-exports/*.csv` (référence exacte).

### Convention `type_lien` (onglet Projets)

`type_lien` sert de **libellé du bouton** de la carte : `Demo`, `Bot`,
`Jouer`… → le bouton affiche ce texte. Valeurs spéciales :
- `interne` → lien vers `projets/<slug>.html` (études de cas V2)
- `externe` → lien vers `url_destination` (nouvel onglet)

---

## 3. Images

- `assets/logo/digicraft-labs.png` — **logo officiel** (fond sombre retiré, PNG transparent). Toutes les pages le référencent (header + footer). `favicon.png` est dérivé du même logo.
- `assets/images/koffa-agoudavi.jpg` — **photo professionnelle** de Koffa (720×900).
- `assets/images/` — visuels des projets (WebP, ~1280px) :
  - `smartreply-agent-visuel.webp` · `scriboai.webp` · `mysterybot-visuel.webp`
  - Les autres projets sans visuel affichent une icône dorée de secours (pas de placeholder cassé).
- Projets / produits : renseignez `image_url` / `image_cover` dans le Sheet. Chemin relatif (`assets/images/...`) **ou** URL absolue (`https://…`) — les deux fonctionnent, sur toutes les pages.
- **Astuce :** si votre logo n'a pas de fond transparent, fournissez le PNG et signalez-le — le fond peut être retiré par traitement (flood fill) comme ce fut le cas ici.

---

## 4. Déploiement — Cloudflare Pages

1. Poussez le dossier `portfolio/` sur un dépôt Git (GitHub/GitLab).
2. Cloudflare Pages → Create a project → connectez le dépôt.
3. Build settings :
   - **Framework preset** : None (site statique)
   - **Build command** : vide
   - **Build output directory** : `/`
4. Déployez. Le domaine final (ex. `digicraftlabs.com`) doit ensuite être
   renseigné dans :
   - `js/config.js` → `siteUrl`
   - les balises `<link rel="canonical">` et les `<meta og:url>` de chaque page
   - `sitemap.xml` et `robots.txt`
5. Publiez le `og-cover.jpg` dans `assets/images/` (image 1200×630)
   pour les partages LinkedIn/X.

### Google Search Console (vérification de propriété)

La balise de vérification est déjà en place dans le `<head>` des
10 pages (HTML statique, fiable à 100 % — pas d'injection JS) :

```html
<meta name="google-site-verification" content="RwuhsveunXtvJvMHt2v_kQKeC2xaRPjTYuRsp_99o0s">
```

Pour vérifier : Search Console → Ajouter une propriété → **Préfixe d'URL**
→ `https://digicraft-labs-drf.pages.dev/` → méthode **Balise HTML** →
« Vérifier ». Compte Google identique à celui de GA4. La vérification
n'est rejouée qu'après redéploiement sur Cloudflare Pages ; elle prend
ensuite 5 à 15 minutes.

---

## 5. Formulaire de contact

**V1** : le formulaire ouvre le client email de l'utilisateur avec un message
pré-rempli (zéro backend). Pour aller plus loin, deux options :

- **Formspree** (2 min) : créez un formulaire, remplacez le `setTimeout` de
  `main.js` par un `fetch` POST vers `https://formspree.io/f/<id>`.
- **Make → Telegram** (le blueprint le prévoit en V2) : le POST Formspree
  déclenche un scénario Make qui envoie le message dans votre Telegram.

---

## 6. Formulaire de contact — Make → Telegram (V2)

Le formulaire `/contact/` n'utilise plus `mailto:` : la soumission envoie
un `POST` JSON (4 champs : `nom`, `email`, `sujet`, `message`) vers le
webhook Make du scénario **« Formulaire de contact »** (Custom Webhook →
Telegram Bot — Send a Text Message), qui notifie le télégramme de Koffa.

- **URL du webhook** : lue depuis le Google Sheet, onglet Parametres
  → clé `url_webhook_contact` (nouvelle ligne à ajouter, valeur = URL du
  webhook Make du scénario « Formulaire de contact »). Pour changer de
  webhook (ex. nouveau compte Make) : modifiez la cellule du Sheet, rien
  à coder. En secours si le Sheet est injoignable : valeur locale
  (`config.js` → `defaults.url_webhook_contact`). Si aucune URL n'est
  disponible → le formulaire affiche l'erreur avec l'email de secours
  (jamais d'échec silencieux).
- **Succès** : le formulaire est remplacé par « Message envoyé, merci !
  Je réponds généralement sous 24-48h. »
- **Échec / timeout 15 s** : message d'erreur avec l'email alternatif
  `contact.agoudavi@gmail.com` ; le bouton est réactivé pour réessayer.
- **Validation** : champs non vides + format email basique, avant l'envoi.
- Format du message Telegram :
  `📩 Nouveau message depuis le site` / `De : {{nom}} ({{email}})` /
  `Sujet : {{sujet}}` / `{{message}}`

## 7. Carousel Ressources sur l'accueil (V1.3)

La section Ressources de l'accueil utilise le **même composant carousel
que les Projets** : flèches de navigation (desktop) + défilement tactile
natif (mobile, scroll-snap), cartes à 84 % / 46 % / 33 % selon la largeur.
- Contenu des cartes inchangé : cover, badge, nom, prix, bouton
  « Voir dans la boutique → » (externe, nouvel onglet).
- Limité aux produits `featured = TRUE`, max 3 (`featuredRessourcesLimit`).
- Le mécanisme est générique : `main.js` → `initCarousel()` cible tous
  les `.carousel` (flèches trouvées dans le `.carousel-wrap` englobant).
  Ajouter un carousel = copier la structure HTML de la section ressources.

## 8. Carousel Articles sur l'accueil (V1.3)

La section Articles de l'accueil utilise le **même composant carousel
que Projets et Ressources** : flèches (desktop) + défilement tactile
natif (mobile, scroll-snap). Cartes `.a-card` à 84 % / 46 % / 33 %.
- Limité aux articles `featured = TRUE` (`homeArticlesLimit` = 3).
- Les flèches ne défilent que s'il y a débordement (2 cartes à 900 px
  tiennent pile dans la largeur → pas de défilement, comportement voulu
  et identique aux autres sections).
- Mécanique générique : `main.js` → `initCarousel()` cible tous les
  `.carousel` ; la structure HTML est identique à la section ressources.

## 9. Hero accueil — disposition (V1.3)

`.hero-grid` : 1 colonne par défaut (empilé, mobile/tablette) →
**2 colonnes à partir de 1024 px** (texte à gauche ~1.1fr, workflow à
droite ~0.9fr, gap 4rem). Le visuel apparaît immédiatement à droite du
texte sur desktop, sans grand espace vide.

## 10. Section Build in public (V1.4)

Nouvel onglet Sheet `BuildInPublic` (gid 1733530302, colonnes : id,
titre, description, image_url, statut, date, lien_optionnel, featured,
ordre) — prototypes et expérimentations en cours, avant qu'ils ne
deviennent des projets finis.

- **Accueil** : section carousel « Build in public » (même composant
  que Projets/Ressources/Articles), placée entre Projets et Ressources.
  Affiche `featured = TRUE` (max `featuredBuildLimit` = 4), CTA
  « Tout voir → » vers `/build-in-public/`.
- **Affichage conditionnel (V1.5)** : la section (accueil + page) et le
  lien footer sont **masqués automatiquement tant que l'onglet
  `BuildInPublic` ne contient aucune ligne de données réelles** — aucun
  message « aucune donnée » visible publiquement. Dès qu'une ligne est
  ajoutée dans le Sheet, tout réapparaît au rechargement. `js/sheets.js`
  : onglet BuildInPublic vide → tableau vide (pas de bascule locale).
  `js/data/buildinpublic.json` est volontairement vide (`[]`).
- **Page `/build-in-public/`** : grille de toutes les entrées (featured
  ou non). Statuts colorés : En test (bleu), Exploration (violet),
  Abandonné (rouge), Devenu un projet (vert). Lien optionnel externe
  « Voir → » si `lien_optionnel` est renseigné, date formatée.
- **Navigation** : lien « Build in public » dans le footer (toutes les
  pages), absent du header (section secondaire).
- Renderer : `js/build.js` → `window.Bld.accueil("carousel-build")` /
  `window.Bld.page("grille-build")`. Données de secours :
  `js/data/buildinpublic.json`.
- **Indicateur de source corrigé** (les 4 renderers) : `_source` du
  Sheet était perdu par le `.sort()` → l'indicateur affichait
  « Google Sheets » même en mode secours. Recopié avant retour.

## 11. Analytics — GA4 + Microsoft Clarity (V1.6)

`js/analytics.js` injecte Google Analytics 4 et Microsoft Clarity sur
toutes les pages.

### Activation (aucune modification de code)

Ajoutez 2 lignes dans l'onglet **Parametres** du Sheet :

| cle | valeur |
|---|---|
| `ga4_id` | `G-XXXXXXXXXX` (GA4 → Admin → Flux de données → ID de mesure) |
| `clarity_id` | `XXXXXXXXXX` (Clarity → Nouveau projet → Project ID) |

En secours (Sheet injoignable) : `config.js` → `tracking.ga4` /
`tracking.clarity`. **IDs vides → aucun script chargé** (site propre).

### Événements GA4 personnalisés

- `lien_externe` : clic sur tout lien externe (nouvel onglet), paramètre `url`
- `contact_envoye` : soumission du formulaire de contact, paramètres
  `statut` (`succes` / `erreur`) et `sujet`
- Pages vues automatiques (gtag config sur chaque page)
- Clarity enregistre tout seul sessions, heatmaps, scrolls et clics

### Confidentialité

- `anonymize_ip: true` activé sur GA4.
- **Consentement géré (V1.7)** : GA4 et Clarity ne sont chargés
  qu'après le choix du visiteur (bannière + Consent Mode v2, voir §12).
  Aucun script d'analyse avant acceptation ; révocation immédiate.
- Aucune donnée personnelle n'est envoyée dans les événements
  (`lien_externe` : URL du lien ; `contact_envoye` : statut + sujet
  uniquement).

## 12. Consentement cookies & confidentialité (V1.7)

Gestion du consentement conforme RGPD : rien n'est chargé avant le
choix du visiteur.

### Fonctionnement

- **1re visite** : bannière « Votre confidentialité compte » en bas de
  l'écran (texte, 3 boutons **Accepter / Refuser / Personnaliser**, lien
  « En savoir plus sur les cookies »). Aucun script d'analyse ne se
  charge tant qu'aucun choix n'est fait.
- **Google Consent Mode v2** : les 4 états (`ad_storage`,
  `ad_user_data`, `ad_personalization`, `analytics_storage`) sont posés
  à `denied` **avant** toute initialisation GA4. Accepter →
  `analytics_storage: granted` uniquement. Les états `ad_*` restent
  toujours `denied` (aucune publicité sur le site). `anonymize_ip: true`
  est conservé.
- **Microsoft Clarity** : régi par le même consentement (aucune
  seconde bannière). Pas de collecte en cas de refus ; révocation →
  `clarity("consent","denied")` via l'API officielle.
- **Stockage** : clé localStorage `digicraft_consent` =
  `{"analytics": bool, "version": "1.0", "timestamp": ISO}`. Aucune
  donnée personnelle (nom, email, message) n'est jamais stockée ni
  envoyée dans les événements.
- **Retour visiteur** : choix mémorisé → pas de bannière. Modification
  possible à tout moment via **« Gérer mes cookies »** dans le pied de
  page de toutes les pages.

### Catégories du panneau « Personnaliser »

| Catégorie | Contrôle |
|---|---|
| Nécessaires | Toujours actifs (pas de bouton de désactivation) |
| Statistiques (GA4 + Clarity) | Interrupteur, **désactivées par défaut** |

Le panneau se ferme avec **Échap**, le focus est géré (Tab/Shift+Tab
piégé dans le panneau), les éléments ont des `aria-label`, la bannière
est responsive mobile/tablette/desktop et n'empêche pas la navigation.

### Où est le code

- `js/consent.js` — bannière, panneaux, localStorage, Consent Mode v2,
  contrôle de Clarity, API `window.Consent`
  (`accept()`, `refuse()`, `save(bool)`, `get()`, `ouvrirPreferences()`).
- `js/analytics.js` — ne charge GA4/Clarity **qu'après acceptation**
  (événement `digicraft:consent`), sans jamais dupliquer les scripts.
- `css/style.css` — `.dl-banner`, `.dl-modal`, `.dl-switch`, `.dl-pill`,
  bouton `dl-manage-btn` (pied de page).
- Chaque page : `<script src="…/js/consent.js">` placé **avant**
  `analytics.js`, lien « Gérer mes cookies » dans le footer.

### Modifier le texte ou les catégories

Tout est dans `js/consent.js` (fonctions `markupBanniere()` /
`markupPreferences()` / `markupInfos()`). Aucune clé Google Sheet n'est
nécessaire : le consentement fonctionne indépendamment du CMS.

### En résumé

1. Consent Mode v2 `denied` (les 4 états) posé immédiatement par
   `consent.js` → GA4/Clarity **bloqués** tant que la bannière n'a pas
   été tranchée (même avec des IDs réels dans le Sheet).
2. Accepter → `analytics_storage=granted` → `analytics.js` injecte
   gtag (`anonymize_ip:true`) + Clarity → événements
   `lien_externe` / `contact_envoye` opérationnels.
3. Refuser / désactiver → aucun chargement, Consent Mode mis à jour,
   Clarity notifié — idempotent, aucun doublon d'initialisation.

## 13. Études de cas (V1.1+)

Trois pages en place — template générique identique, chacune alimentée
par le Sheet :
- `/projets/smartreply-agent/`
- `/projets/scriboai-bot/`
- `/projets/mysterybot/`

### Fonctionnement générique

- **Créer une étude de cas** : dupliquez `projets/<slug>/index.html` →
  changez `data-cs-page="<slug>"` + le contenu statique de secours, puis
  renseignez les 4 colonnes dans le Sheet.
- **Lien des cartes** : automatique — si une des colonnes `probleme` /
  `solution` / `technologies_detail` / `resultat` est remplie, la carte
  pointe vers `/projets/<slug>/` avec le bouton **« En savoir plus »**
  (navigation interne). Sinon, la carte pointe vers `url_destination`
  (nouvel onglet) — c'est le comportement pour les futurs projets sans
  étude de cas.
- **Bouton d'action directe (V1.2)** : chaque carte affiche un second
  bouton doré plein, libellé = colonne `type_lien` (Bot, Demo, Jouer…)
  → `url_destination` en nouvel onglet. Présent aussi sur les pages
  étude de cas (en haut, sous le titre). Valeurs non-action de
  `type_lien` (vide, « interne », « externe », « En savoir plus »,
  « Voir le projet ») → libellé générique « Accéder au projet ».
  `url_destination` vide ou interne (ex. `/contact/`) → bouton affiché
  quand même, lien tel quel (les liens internes `/…` sont résolus via
  `SITE_ROOT`).
- **Contenu de la page** : le Sheet remplit titre, description, visuel
  (`image_url`), statut, tags et les 4 sections. Cellule vide + texte
  statique absent → section masquée.
- **Nettoyage automatique** : les fragments de description de colonnes
  laissés dans le Sheet (« Le problème que le projet résout, 2-3
  phrases »…) sont retirés du texte affiché.

### Nouvelles colonnes dans l'onglet Projets (V1.1)

À ajouter à la suite des colonnes existantes — elles peuvent rester vides
(les sections correspondantes ne s'affichent alors pas) :

| Colonne | Contenu |
|---|---|
| `probleme` | Le problème que le projet résout (2-3 phrases) |
| `solution` | Comment le système fonctionne concrètement (2-4 phrases) |
| `technologies_detail` | Description plus riche que `stack_tags` — rôle de chaque outil |
| `resultat` | État actuel, honnête : en prod vs en pause/en cours |

> 💡 Ne mettez pas de descriptions de colonnes en placeholder dans les
> cellules : le site les ignore (patterns de texte d'instruction filtrés)
> et affiche le contenu statique de référence jusqu'à ce que le vrai
> contenu soit collé dans le Sheet.

### Lien de la carte

`type_lien = interne` (ou le slug `smartreply-agent`) → la carte pointe
vers la page interne `projets/<slug>/` avec le bouton **« En savoir plus »**
(ouvre dans la même page). Les autres valeurs de `type_lien` (Demo, Bot,
Jouer…) restent des libellés de bouton ouvrant `url_destination` en
nouvel onglet.

### Créer une nouvelle étude de cas (V2)

1. Dupliquez `projets/smartreply-agent/index.html` → `projets/<slug>/index.html`
2. Changez `data-cs-page="<slug>"` et le contenu statique
3. Renseignez les 4 colonnes dans le Sheet (le Sheet écrase le statique)

### Accueil — phrase de transition

Une phrase d'intro (V1.1) relie le bandeau de crédibilité à la section
Expertise : « Chaque projet part d'un problème réel : … » — style serif
italique doré, sans autre changement de structure.

---

## 7. Règles de design (rappel)

- ❌ Pas de noir en fond · le site est ivoire/blanc (`#FAF9F6` / `#FFFFFF` /
  `#F1EFE8`), or en accent (`#B8860B` / `#8A6A08`), texte `#161513`.
- ❌ Pas de boutique interne · pas de blog interne · pas de carousel sur
  `/projets` (grille seule) · pas d'animations lourdes.
- ✅ Mobile d'abord · états loading/erreur/vide gérés · images lazy ·
  accessibilité (skip link, aria, focus, prefers-reduced-motion).
