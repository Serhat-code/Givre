/* ============================================================
   GIVRÉ — i18n  (FR ↔ EN)
   Selector-based pour nav / footer / accueil,
   data-en inline pour les pages intérieures.
   Chargé avant main.js → s'applique avant split-text.
   ============================================================ */

(function () {
  'use strict';

  var KEY = 'givre-lang';

  /* ── Table de traductions (selector-based) ───────────────── */
  /* h:1 → utilise innerHTML (contenu avec <br>, etc.)         */
  var T = [

    /* Navigation (toutes pages) */
    { s: '.nav-links a[href="news.html"], .mobile-menu a[href="news.html"]',
      fr: 'Actualités', en: 'News' },
    { s: '.nav-links a[href="gallery.html"], .mobile-menu a[href="gallery.html"]',
      fr: 'Galerie', en: 'Gallery' },
    { s: '.skip-link', fr: 'Aller au contenu', en: 'Skip to content' },

    /* Footer (toutes pages) */
    { s: '.footer-tagline',
      fr: 'Intemporel par nature.<br>Indomptable par essence.',
      en: 'Timeless by nature.<br>Untameable by essence.', h: 1 },
    { s: '.footer-nav-title', fr: 'Navigation', en: 'Navigation' },
    { s: '.footer-nav-list a[href="news.html"]',
      fr: '03 — Actualités', en: '03 — News' },
    { s: '.footer-nav-list a[href="gallery.html"]',
      fr: '04 — Galerie', en: '04 — Gallery' },
    { s: '.footer-nav-list a[href="mentions-legales.html"]',
      fr: 'Mentions légales', en: 'Legal notice' },
    { s: '.footer-bottom > span',
      fr: 'Givré Parfums S.A.S. © 2024 — Tous droits réservés',
      en: 'Givré Parfums S.A.S. © 2024 — All rights reserved' },
    { s: '.footer-concept',
      fr: 'Projet conceptuel — Atlamaz Studio',
      en: 'Conceptual project — Atlamaz Studio' },

    /* ── index.html : Hero ──────────────────────────────────── */
    { s: '.hero-tag',
      fr: 'Haute Parfumerie — Paris, depuis 2022',
      en: 'Fine Fragrance — Paris, since 2022' },
    { s: '.hero-title',
      fr: 'L\'essence<br>du givre',
      en: 'The essence<br>of frost', h: 1 },
    { s: '.hero-sub',
      fr: 'Chez Givré, nous ne créons pas des parfums — nous cristallisons des émotions. Chaque fragrance est une architecture invisible, sculptée pour traverser le temps.',
      en: 'At Givré, we don\'t create perfumes — we crystallise emotions. Each fragrance is an invisible architecture, sculpted to transcend time.' },
    { s: '.hero-cta > span:first-child',
      fr: 'Découvrir les collections', en: 'Discover the collections' },
    { s: '.hero-scroll > span', fr: 'Défiler', en: 'Scroll' },

    /* ── index.html : Manifeste ─────────────────────────────── */
    { s: '.manifeste-num', fr: '01 — Manifeste', en: '01 — Manifesto' },
    { s: '.manifeste-large',
      fr: 'La parfumerie<br>comme poésie<br>cristallisée.',
      en: 'Perfumery<br>as crystallised<br>poetry.', h: 1 },
    { s: '.manifeste-stats > div:first-child .manifeste-stat-label',
      fr: 'Fragrances d\'exception', en: 'Exceptional fragrances' },
    { s: '.manifeste-stats > div:last-child .manifeste-stat-label',
      fr: 'Ans de création', en: 'Years of creation' },

    /* ── index.html : Collections ───────────────────────────── */
    { s: '.section-collections .section-num',    fr: '02 — Collections',          en: '02 — Collections' },
    { s: '.section-collections .section-title',  fr: 'Nos fragrances',             en: 'Our fragrances' },
    { s: '.section-collections .link-underline', fr: 'Voir toutes les collections',en: 'View all collections' },
    { s: '.collections-grid .collection-card:nth-child(1) .collection-card-desc',
      fr: 'Bergamote givrée, vétiver glacé, ambre blanc. La pureté dans sa forme la plus radicale.',
      en: 'Frosted bergamot, glacial vetiver, white amber. Purity in its most radical form.' },
    { s: '.collections-grid .collection-card:nth-child(1) .collection-table-row:nth-child(1) span:first-child',
      fr: 'Famille', en: 'Family' },
    { s: '.collections-grid .collection-card:nth-child(1) .collection-table-row:nth-child(1) span:last-child',
      fr: 'Boisé frais', en: 'Fresh woody' },
    { s: '.collections-grid .collection-card:nth-child(1) .collection-table-row:nth-child(2) span:first-child',
      fr: 'Usage', en: 'Use' },
    { s: '.collections-grid .collection-card:nth-child(1) .collection-table-row:nth-child(2) span:last-child',
      fr: 'Tous publics', en: 'All occasions' },
    { s: '.collections-grid .collection-card:nth-child(2) .collection-card-desc',
      fr: 'Iris sombre, cuir poli, oud afghan. L\'obscurité a sa propre lumière.',
      en: 'Dark iris, polished leather, Afghan oud. Darkness has its own light.' },
    { s: '.collections-grid .collection-card:nth-child(2) .collection-table-row:nth-child(1) span:first-child',
      fr: 'Famille', en: 'Family' },
    { s: '.collections-grid .collection-card:nth-child(2) .collection-table-row:nth-child(1) span:last-child',
      fr: 'Oriental boisé', en: 'Woody oriental' },
    { s: '.collections-grid .collection-card:nth-child(2) .collection-table-row:nth-child(2) span:first-child',
      fr: 'Usage', en: 'Use' },
    { s: '.collections-grid .collection-card:nth-child(2) .collection-table-row:nth-child(2) span:last-child',
      fr: 'Soirée', en: 'Evening' },
    { s: '.collections-grid .collection-card:nth-child(3) .collection-card-desc',
      fr: 'Rose alba, muguet de rosée, cèdre de l\'Atlas. Un voile aérien sur la peau.',
      en: 'Alba rose, dewdrop lily of the valley, Atlas cedar. An aerial veil on the skin.' },
    { s: '.collections-grid .collection-card:nth-child(3) .collection-table-row:nth-child(1) span:first-child',
      fr: 'Famille', en: 'Family' },
    { s: '.collections-grid .collection-card:nth-child(3) .collection-table-row:nth-child(1) span:last-child',
      fr: 'Floral frais', en: 'Fresh floral' },
    { s: '.collections-grid .collection-card:nth-child(3) .collection-table-row:nth-child(2) span:first-child',
      fr: 'Usage', en: 'Use' },
    { s: '.collections-grid .collection-card:nth-child(3) .collection-table-row:nth-child(2) span:last-child',
      fr: 'Quotidien', en: 'Everyday' },

    /* ── index.html : Actualités ────────────────────────────── */
    { s: '.section-news .section-num',    fr: '03 — Actualités',    en: '03 — News' },
    { s: '.section-news .section-title',  fr: 'Dernières nouvelles', en: 'Latest news' },
    { s: '.section-news .link-underline', fr: 'Voir tout',            en: 'View all' },
    { s: '.news-list .news-item:nth-child(1) .news-category', fr: 'Lancement',  en: 'Launch' },
    { s: '.news-list .news-item:nth-child(1) .news-title',
      fr: 'Arctique : une nouvelle vision du froid sublime',
      en: 'Arctique: a new vision of sublime cold' },
    { s: '.news-list .news-item:nth-child(1) .news-excerpt',
      fr: 'La collection redéfinit les fragrances fraîches en alliant minéralité glacée et chaleur sous-jacente.',
      en: 'The collection redefines fresh fragrances by combining icy minerality with underlying warmth.' },
    { s: '.news-list .news-item:nth-child(2) .news-category', fr: 'Événement', en: 'Event' },
    { s: '.news-list .news-item:nth-child(2) .news-title',
      fr: 'Givré au Salon International du Parfum, Paris',
      en: 'Givré at the International Perfume Salon, Paris' },
    { s: '.news-list .news-item:nth-child(2) .news-excerpt',
      fr: 'Première présentation mondiale de Cristal Noir devant un public international.',
      en: 'World premiere of Cristal Noir before an international audience.' },
    { s: '.news-list .news-item:nth-child(3) .news-category', fr: 'Brochure', en: 'Feature' },
    { s: '.news-list .news-item:nth-child(3) .news-title',
      fr: 'L\'art de la composition : notre processus créatif',
      en: 'The art of composition: our creative process' },
    { s: '.news-list .news-item:nth-child(3) .news-excerpt',
      fr: 'Trois ans de création, de la matière première à l\'essence finale.',
      en: 'Three years of creation, from raw material to final essence.' },

    /* ── index.html : Galerie ───────────────────────────────── */
    { s: '.section-gallery .section-num',    fr: '04 — Galerie',   en: '04 — Gallery' },
    { s: '.section-gallery .section-title',  fr: 'Univers visuel', en: 'Visual universe' },
    { s: '.section-gallery .link-underline', fr: 'Voir la galerie',en: 'View the gallery' },
    { s: '.gallery-grid .gallery-item:nth-child(1) .gallery-item-label', fr: 'Atelier',  en: 'Studio' },
    { s: '.gallery-grid .gallery-item:nth-child(2) .gallery-item-label', fr: 'Flacons',  en: 'Bottles' },
    { s: '.gallery-grid .gallery-item:nth-child(3) .gallery-item-label', fr: 'Boutique', en: 'Boutique' },

    /* ── index.html : Footer manifeste ─────────────────────── */
    { s: '.footer-manifeste-text',
      fr: 'La beauté n\'attend pas.<br>Portez-la.',
      en: 'Beauty doesn\'t wait.<br>Wear it.', h: 1 },
    { s: '.footer-manifeste-sub',
      fr: 'Givré — Haute Parfumerie · Paris, depuis 2022',
      en: 'Givré — Fine Fragrance · Paris, since 2022' },

    /* ── 404.html ───────────────────────────────────────────── */
    { s: '.page-404-title',
      fr: 'Cette page<br>n\'existe pas',
      en: 'This page<br>does not exist', h: 1 },
    { s: '.page-404-sub',
      fr: 'Il semblerait que vous vous soyez perdu dans le givre.<br>La page que vous cherchez a été déplacée ou n\'a jamais existé.',
      en: 'It seems you have got lost in the frost.<br>The page you are looking for has been moved or never existed.', h: 1 },
    { s: '.page-404-cta > span:first-child',
      fr: 'Retourner à l\'accueil', en: 'Return to home' },

  ];

  /* ── Appliquer la langue ─────────────────────────────────── */
  function apply(lang) {

    /* 1. Selector-based */
    T.forEach(function (entry) {
      document.querySelectorAll(entry.s).forEach(function (el) {
        var text = entry[lang];
        if (text === undefined) return;
        if (entry.h) el.innerHTML = text;
        else el.textContent = text;
      });
    });

    /* 2. data-en (pages intérieures) — innerHTML toujours */
    document.querySelectorAll('[data-en]').forEach(function (el) {
      if (lang === 'en') {
        if (el._frOrig === undefined) el._frOrig = el.innerHTML;
        el.innerHTML = el.getAttribute('data-en');
      } else if (el._frOrig !== undefined) {
        el.innerHTML = el._frOrig;
      }
    });

    /* 3. Placeholders traduits */
    document.querySelectorAll('[data-en-ph]').forEach(function (el) {
      if (lang === 'en') {
        if (el._frPh === undefined) el._frPh = el.placeholder;
        el.placeholder = el.getAttribute('data-en-ph');
      } else if (el._frPh !== undefined) {
        el.placeholder = el._frPh;
      }
    });

    /* 4. html[lang] accessibilité */
    document.documentElement.lang = lang;

    /* 5. État actif des boutons */
    document.querySelectorAll('.nav-lang button').forEach(function (btn) {
      var active = btn.textContent.trim().toLowerCase() === lang;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    localStorage.setItem(KEY, lang);
  }

  /* ── Init : pré-capturer le HTML français avant split-text ─ */
  /* i18n.js se charge avant main.js → innerHTML est encore propre */
  document.querySelectorAll('[data-en]').forEach(function (el) {
    el._frOrig = el.innerHTML;
  });

  /* ── Init : appliquer la langue mémorisée ────────────────── */
  var stored = localStorage.getItem(KEY) || 'fr';
  if (stored === 'en') apply('en');

  /* ── Boutons FR / EN ─────────────────────────────────────── */
  document.querySelectorAll('.nav-lang button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      apply(btn.textContent.trim().toLowerCase());
    });
  });

}());
