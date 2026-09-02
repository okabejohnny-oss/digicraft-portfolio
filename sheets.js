/* ============================================================
   SHEETS.JS — Couche CMS Google Sheets (blueprint §18-19)
   ------------------------------------------------------------
   - Charge chaque onglet via l'export CSV public du Sheet
   - Parser CSV léger intégré (aucune dépendance externe,
     conforme à l'objectif performance : zéro bibliothèque)
   - Si le Sheet n'est pas configuré / joignable → données
     locales de secours (js/data/*.json)
   - Expose : Sheets.loadSheet(nom) -> Promise<rows[]>
   ============================================================ */
(function () {
  "use strict";

  /* Parser CSV compatible Google Sheets (champs entre guillemets,
     virgules et retours à la ligne internes, BOM, CRLF) */
  function parseCSV(text) {
    var rows = [], row = [], field = "", inQ = false, i = 0;
    text = String(text).replace(/^\uFEFF/, "");
    while (i < text.length) {
      var ch = text[i];
      if (inQ) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; }
          else { inQ = false; i++; }
        } else { field += ch; i++; }
      } else {
        if (ch === '"') { inQ = true; i++; }
        else if (ch === ",") { row.push(field); field = ""; i++; }
        else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; }
        else if (ch === "\r") { i++; }
        else { field += ch; i++; }
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ""; }); });
  }

  /* Ligne d'en-tête -> objets {colonne: valeur} */
  function rowsToObjects(rows) {
    if (!rows.length) return [];
    var keys = rows[0].map(function (k) { return String(k).trim(); });
    return rows.slice(1).map(function (r) {
      var o = {};
      keys.forEach(function (k, idx) { o[k] = r[idx] !== undefined ? String(r[idx]).trim() : ""; });
      return o;
    });
  }

  /* Lecture tolérante d'un champ : accepte plusieurs noms de colonne
     (insensible à la casse, espaces ignorés), normalise &amp; -> &,
     et signale les colonnes manquantes avec console.error clair. */
  function champ(row, aliases, def) {
    if (!row) return def;
    for (var i = 0; i < aliases.length; i++) {
      var wanted = String(aliases[i]).toLowerCase().replace(/\s+/g, "");
      for (var k in row) {
        if (String(k).toLowerCase().replace(/\s+/g, "") === wanted) {
          return String(row[k] == null ? "" : row[k]).replace(/&amp;/g, "&").trim();
        }
      }
    }
    return def;
  }

  /* Vérifie qu'une liste de colonnes attendues existe ; logue une
     erreur claire si l'en-tête a changé (évite les échecs silencieux).
     Ne doit JAMAIS lever d'exception. */
  function verifierEnTete(rows, nomOnglet, colonnes) {
    try {
      if (!rows || !rows.length) { console.error("[Sheets] Onglet '" + nomOnglet + "' vide ou sans en-tête."); return; }
      var keys = Object.keys(rows[0]).map(function (k) { return String(k).toLowerCase().trim(); });
      var manquantes = (colonnes || []).filter(function (c) {
        return keys.indexOf(c.toLowerCase()) === -1;
      });
      if (manquantes.length) {
        console.error("[Sheets] Onglet '" + nomOnglet + "' : colonnes attendues absentes : " +
          manquantes.join(", ") + " | colonnes trouvées : " + (keys.join(", ") || "(aucune)"));
      }
    } catch (e) {
      console.error("[Sheets] verifierEnTete (" + nomOnglet + ") :", e);
    }
  }

  function sheetUrl(name) {
    // Priorité aux URLs officielles de publication fournies dans config.js
    if (window.CONFIG.sheetUrls && window.CONFIG.sheetUrls[name]) {
      return window.CONFIG.sheetUrls[name];
    }
    var gid = (window.CONFIG.sheetGids && window.CONFIG.sheetGids[name]) || 0;
    return "https://docs.google.com/spreadsheets/d/" + window.CONFIG.sheetId +
      "/export?format=csv&gid=" + gid;
  }

  function fetchText(url) {
    return fetch(url, { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    });
  }

  /* Charge un onglet : Sheet d'abord, secours local ensuite.
     Le tableau retourné porte une propriété _source :
     "google-sheets" ou "local" (utilisée par l'indicateur visuel). */
  function loadSheet(name) {
    var useSheet = window.CONFIG.sheetId && !window.CONFIG.forceLocal;
    if (useSheet) {
      return fetchText(sheetUrl(name)).then(function (text) {
        var rows = rowsToObjects(parseCSV(text));
        if (!rows.length) {
          /* Onglet BuildInPublic joignable mais vide : ne PAS basculer
             sur les données locales — la section Build in public ne doit
             s'afficher que si le Sheet contient de vraies données. */
          if (name === "buildinpublic") {
            var vides = [];
            vides._source = "google-sheets";
            return vides;
          }
          throw new Error("Onglet vide");
        }
        verifierEnTete(rows, name, window.CONFIG.colonnesAttendues[name] || []);
        rows._source = "google-sheets";
        return rows;
      }).catch(function (err) {
        console.error("[Sheets] Échec de chargement de l'onglet '" + name + "' :", err);
        console.error("[Sheets] Bascule sur les données locales (js/data/" + name + ".json).");
        return loadLocal(name).then(function (rows) {
          rows._source = "local";
          return rows;
        });
      });
    }
    return loadLocal(name).then(function (rows) {
      rows._source = "local";
      return rows;
    });
  }

  function loadLocal(name) {
    var root = window.SITE_ROOT || "";
    return fetch(root + "js/data/" + name + ".json", { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("Données locales introuvables");
      return res.json();
    });
  }

  /* Parametres (cle/valeur) -> objet */
  function paramsToObject(rows) {
    var out = {};
    rows.forEach(function (r) {
      var k = (r.cle || "").trim(), v = (r.valeur !== undefined ? String(r.valeur).trim() : "");
      if (!k || /^Remplacer/i.test(k) || /^Remplacer/i.test(v)) return;
      out[k] = v;
    });
    Object.keys(window.CONFIG.defaults).forEach(function (k) {
      if (!out[k]) out[k] = window.CONFIG.defaults[k];
    });
    return out;
  }

  /* booléens du Sheet : TRUE/true/1/oui/vrai */
  function toBool(v) {
    return /^(true|1|oui|vrai|yes)$/i.test(String(v).trim());
  }

  /* tri par colonne `ordre` croissant */
  function byOrder(a, b) {
    var na = parseInt(a.ordre, 10) || 0, nb = parseInt(b.ordre, 10) || 0;
    return na - nb;
  }

  /* formatage date ISO -> "Juil. 2026" */
  function formatDate(v) {
    if (!v) return "";
    var s = String(v).trim();
    if (/^\d{4}-\d{2}$/.test(s)) s += "-15"; // année-mois seulement
    var d = new Date(s + "T00:00:00");
    if (isNaN(d.getTime())) return s;
    var m = d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
    return m.charAt(0).toUpperCase() + m.slice(1).replace(".", ".");
  }

  /* temps de lecture -> "5 min" */
  function formatMinutes(v) {
    if (!v) return "";
    var n = parseInt(v, 10);
    if (!isNaN(n)) return n + " min";
    return String(v);
  }

  window.Sheets = {
    loadSheet: loadSheet,
    parseCSV: parseCSV,
    rowsToObjects: rowsToObjects,
    paramsToObject: paramsToObject,
    toBool: toBool,
    byOrder: byOrder,
    formatDate: formatDate,
    formatMinutes: formatMinutes,
    champ: champ
  };
})();
