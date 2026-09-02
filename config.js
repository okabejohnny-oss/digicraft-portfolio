/* ============================================================
   CONFIGURATION CENTRALE — DIGICRAFT LABS
   ------------------------------------------------------------
   1) sheetId : ID du Google Sheet publié (voir README).
      Laissez "" tant que le Sheet n'est pas prêt : le site
      utilise alors les données locales (js/data/*.json).
      Une fois le Sheet publié, copiez son ID ici, ex :
      sheetId: "1AbCdEfGhIjKlMnOpQrStUvWxYz123456789",
   ============================================================ */
window.CONFIG = {
  sheetId: "1en1Bn2xMaax8EXPEZTHYmF9T-DY2XY-n",

  // Option : forcer le mode fallback local même si sheetId est défini
  forceLocal: false,

  // GID des onglets du classeur Portfolio_CMS_DIGICRAFT
  // COMMENT TROUVER UN GID : ouvrez le classeur → cliquez sur l'onglet
  // (Parametres, Projets, Articles, Ressources) → l'URL de votre navigateur
  // affiche ...#gid=XXXXXXX → copiez ce nombre ici.
  // Le premier onglet (Parametres) vaut toujours 0.
  sheetGids: {
    parametres: 45262670,    // onglet Parametres
    projets: 690207518,      // onglet Projets
    articles: 982421678,     // onglet Articles
    ressources: 1306651993,  // onglet Ressources
    buildinpublic: 1733530302 // onglet BuildInPublic
  },

  // URLs officielles de publication (Fichier → Publier sur le web → CSV).
  // Utilisées en priorité — plus fiables que l'export généré.
  sheetUrls: {
    parametres: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKUCRKKu2iTMXxxUT5Jx4Pgiypm1c18HcOcBCv7xKs95lP5BAi0ysDZL0RDdSDA/pub?gid=45262670&single=true&output=csv",
    projets: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKUCRKKu2iTMXxxUT5Jx4Pgiypm1c18HcOcBCv7xKs95lP5BAi0ysDZL0RDdSDA/pub?gid=690207518&single=true&output=csv",
    articles: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKUCRKKu2iTMXxxUT5Jx4Pgiypm1c18HcOcBCv7xKs95lP5BAi0ysDZL0RDdSDA/pub?gid=982421678&single=true&output=csv",
    ressources: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKUCRKKu2iTMXxxUT5Jx4Pgiypm1c18HcOcBCv7xKs95lP5BAi0ysDZL0RDdSDA/pub?gid=1306651993&single=true&output=csv",
    buildinpublic: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTBKUCRKKu2iTMXxxUT5Jx4Pgiypm1c18HcOcBCv7xKs95lP5BAi0ysDZL0RDdSDA/pub?gid=1733530302&single=true&output=csv"
  },

  // Colonnes attendues par onglet — utilisées pour détecter un changement
  // d'en-tête dans le Sheet (erreur console explicite au lieu d'un échec
  // silencieux). Les modules lisent aussi ces colonnes de façon tolérante
  // (insensible à la casse / espaces, alias acceptés).
  colonnesAttendues: {
    parametres: ["cle", "valeur"],
    projets: ["titre", "slug", "categorie", "description_courte", "image_url", "stack_tags", "statut", "date", "type_lien", "url_destination", "featured", "ordre", "probleme", "solution", "technologies_detail", "resultat"],
    articles: ["titre", "plateforme", "description", "temps_lecture", "url", "date", "featured", "ordre"],
    ressources: ["nom_produit", "description", "prix", "devise", "url_boutique", "badge", "featured", "ordre"],
    buildinpublic: ["id", "titre", "description", "image_url", "statut", "date", "lien_optionnel", "featured", "ordre"]
  },

  // Données par défaut (utilisées si le Sheet n'est pas joignable)
  defaults: {
    nom_complet: "Koffa Jean AGOUDAVI",
    titre_professionnel: "Fondateur de DIGICRAFT Labs",
    slogan_hero: "Je transforme les idées complexes en systèmes digitaux intelligents.",
    description_hero: "Je conçois des automatisations, des agents IA, des bots et des produits digitaux pour simplifier les workflows et créer des solutions concrètes.",
    email_contact: "contact.agoudavi@gmail.com",
    url_linkedin: "https://www.linkedin.com/in/koffa-jean-agoudavi-514895423",
    url_telegram: "https://t.me/johnnyokabe",
    url_google_business: "https://share.google/ont9TyuWshpud74fL",
    url_boutique: "https://digicraft.mychariow.shop",
    url_webhook_contact: "https://hook.eu1.make.com/wjgpk28nmywizvm7kl95hv45gt7n6quq",
    statut_disponibilite: "AVAILABLE FOR PROJECTS"
  },

  // Domaine du site — À REMPLACER par votre domaine final
  siteUrl: "https://digicraft-labs-drf.pages.dev",

  // Nombre maximum de produits "featured" sur l'accueil
  featuredRessourcesLimit: 3,
  // Nombre maximum d'articles affichés sur l'accueil
  homeArticlesLimit: 3,
  // Nombre maximum d'expérimentations featured sur l'accueil
  featuredBuildLimit: 4,

  // Suivi analytics : IDs GA4 (G-XXXXXXXXXX) et Microsoft Clarity.
  // Peuvent aussi être définis dans le Sheet Parametres (clés
  // `ga4_id` / `clarity_id`) — le Sheet a la priorité. Laisser vide
  // tant que l'analytics n'est pas configurée (aucun script chargé).
  tracking: {
    ga4: "G-LH9R3H5XYX",
    clarity: "yaxx6uxxws"
  }
};
