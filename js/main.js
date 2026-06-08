/* ============================================================
   GIVRÉ — Main JS  (Awwwards Edition)
   Preloader · Curseur custom · Split-text · Transitions de page
   Header scroll · Menu mobile · Fade-in · Gallery · Lightbox
   ============================================================ */

/* ── Preloader ────────────────────────────────────────────── */
(function initPreloader() {
  var preloader = document.getElementById('preloader');
  if (!preloader) return;

  var fill = preloader.querySelector('.preloader-fill');

  /* Lance la barre de chargement */
  if (fill) {
    /* Petit délai pour que la transition CSS soit active */
    setTimeout(function () { fill.style.width = '100%'; }, 60);
  }

  /* Masque le preloader après 2 secondes */
  function hidePreloader() {
    preloader.classList.add('done');
    /* Révèle les éléments hero */
    document.querySelectorAll('.hero-tag, .hero-sub, .hero-cta, .hero-scroll').forEach(function (el) {
      el.classList.add('reveal');
    });
    /* Déclenche le split-text sur le hero-title */
    var heroTitle = document.querySelector('.hero-title');
    if (heroTitle) setTimeout(function () { heroTitle.classList.add('split-reveal'); }, 200);
    /* Signal au WebGL : l'intro peut commencer (frost + caméra) */
    document.dispatchEvent(new CustomEvent('givre:intro-start'));
  }

  if (document.readyState === 'complete') {
    setTimeout(hidePreloader, 1800);
  } else {
    window.addEventListener('load', function () {
      setTimeout(hidePreloader, 1800);
    });
  }
}());

/* ── Split-text ───────────────────────────────────────────── */
(function initSplitText() {
  /* Applique le split-text sur les sélecteurs donnés */
  function splitWords(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(function (w) {
      return '<span class="split-word"><span class="split-word-inner">' + w + '</span></span>';
    }).join(' ');
  }

  /* Hero title split */
  var heroTitle = document.querySelector('.hero-title');
  if (heroTitle) splitWords(heroTitle);

  /* Titres de section secondaires (pages intérieures) */
  var pageTitle = document.querySelector('.page-hero-title');
  if (pageTitle) {
    splitWords(pageTitle);
    /* Déclenche immédiatement pour les pages sans preloader */
    var hasPreloader = !!document.getElementById('preloader');
    if (!hasPreloader) {
      setTimeout(function () { pageTitle.classList.add('split-reveal'); }, 300);
    }
  }

  /* Sections de la homepage via IntersectionObserver */
  document.querySelectorAll('.section-title').forEach(function (el) {
    splitWords(el);
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('split-reveal');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    obs.observe(el);
  });
}());

/* ── Curseur custom ───────────────────────────────────────── */
(function initCursor() {
  /* Pas de curseur sur tactile */
  if (!window.matchMedia('(hover: hover)').matches) return;

  /* cursor: none appliqué via classe JS — dégradation gracieuse si JS échoue */
  document.body.classList.add('cursor-none');

  var dot  = document.getElementById('cursor-dot');
  var ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  var mx = -100, my = -100;   /* position de la souris */
  var rx = -100, ry = -100;   /* position du ring (lagguée) */

  /* Suivi immédiat du dot */
  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  }, { passive: true });

  /* Animation du ring avec inertie */
  function animRing() {
    rx += (mx - rx) * 0.11;
    ry += (my - ry) * 0.11;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animRing);
  }
  animRing();

  /* États hover */
  function addHoverListeners(selector, cssClass) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add(cssClass); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove(cssClass); });
    });
  }
  addHoverListeners('a, button, [role="button"]', 'cursor-link');

  /* Disparition hors fenêtre */
  document.addEventListener('mouseleave', function () { document.body.classList.add('cursor-hidden'); });
  document.addEventListener('mouseenter', function () { document.body.classList.remove('cursor-hidden'); });
}());

/* ── Transition de page ───────────────────────────────────── */
(function initPageTransition() {
  var overlay = document.getElementById('page-transition');
  if (!overlay) return;

  /* Slide-out au chargement (arrive de bas en haut et sort) */
  function revealPage() {
    overlay.classList.add('slide-out');
    setTimeout(function () { overlay.classList.remove('slide-out'); }, 700);
  }
  if (document.readyState === 'complete') revealPage();
  else window.addEventListener('load', revealPage);

  /* Intercept les liens internes */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') ||
        href.startsWith('mailto') || href.startsWith('tel')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;

    e.preventDefault();
    overlay.classList.remove('slide-out');
    overlay.classList.add('slide-in');
    setTimeout(function () { window.location.href = href; }, 580);
  });
}());

/* ── Header scroll ────────────────────────────────────────── */
(function initHeader() {
  var header = document.querySelector('.site-header');
  if (!header) return;
  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}());

/* ── Menu mobile ──────────────────────────────────────────── */
(function initMobileMenu() {
  var hamburger  = document.querySelector('.nav-hamburger');
  var mobileMenu = document.querySelector('.mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', function () {
    var open = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}());

/* ── Fade-in (IntersectionObserver) ──────────────────────── */
(function initFadeIn() {
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.10 });
  document.querySelectorAll('.fade-in').forEach(function (el) { obs.observe(el); });
}());

/* ── Lien actif dans la nav ───────────────────────────────── */
(function initActiveNav() {
  var current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    if (link.getAttribute('href') === current) link.classList.add('active');
  });
}());

/* ── Gallery tabs ─────────────────────────────────────────── */
(function initGalleryTabs() {
  var tabs   = document.querySelectorAll('.gallery-tab');
  var items  = document.querySelectorAll('.gallery-full-item');
  if (!tabs.length) return;
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var filter = tab.dataset.filter;
      items.forEach(function (item) {
        item.style.display = (filter === 'all' || item.dataset.category === filter) ? '' : 'none';
      });
    });
  });
}());

/* ── Lightbox ─────────────────────────────────────────────── */
(function initLightbox() {
  var lightbox  = document.querySelector('.lightbox');
  var lbImg     = document.querySelector('.lightbox-inner img');
  var lbClose   = document.querySelector('.lightbox-close');
  if (!lightbox) return;

  function openLb(el) {
    if (lbImg) {
      lbImg.src = el.dataset.lightbox;
      lbImg.alt = el.querySelector('img') ? el.querySelector('img').alt : '';
    }
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (lbClose) lbClose.focus();
  }

  document.querySelectorAll('[data-lightbox]').forEach(function (el) {
    /* Accessibilité : rend l'élément interactif au clavier */
    if (el.tagName !== 'BUTTON' && el.tagName !== 'A') {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      var caption = el.querySelector('.gallery-full-item-caption');
      if (caption) el.setAttribute('aria-label', 'Agrandir : ' + caption.textContent.trim());
    }
    el.addEventListener('click', function () { openLb(el); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(el); }
    });
  });

  function closeLb() { lightbox.classList.remove('open'); document.body.style.overflow = ''; }
  if (lbClose) lbClose.addEventListener('click', closeLb);
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLb(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
}());

/* ── News pagination (demo) ───────────────────────────────── */
(function initPagination() {
  var btns = document.querySelectorAll('.news-pagination button');
  btns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      btns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });
}());

/* ── Manifeste : reveal horizontal + compteurs animés ─────── */
(function initManifeste() {
  var manifeste = document.querySelector('.manifeste-large');
  var counters  = document.querySelectorAll('[data-counter]');
  if (!manifeste && !counters.length) return;

  function animateCounter(el) {
    var target = parseInt(el.dataset.counter, 10);
    var start  = performance.now();
    var dur    = 1400;
    function step(ts) {
      var p = Math.min((ts - start) / dur, 1);
      var ease = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var opts = { threshold: 0.25 };

    if (manifeste) {
      new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting) {
          manifeste.classList.add('reveal');
          obs.disconnect();
        }
      }, opts).observe(manifeste);
    }

    counters.forEach(function (el) {
      new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting) {
          animateCounter(el);
          obs.disconnect();
        }
      }, opts).observe(el);
    });
  } else {
    if (manifeste) manifeste.classList.add('reveal');
    counters.forEach(function (el) {
      el.textContent = el.dataset.counter;
    });
  }
}());

/* ── Footer manifeste reveal ─────────────────────────────── */
(function initFooterManifeste() {
  var els = document.querySelectorAll('.footer-manifeste-text, .footer-manifeste-sub');
  if (!els.length || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('reveal'); });
    return;
  }
  els.forEach(function (el) {
    new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) {
        el.classList.add('reveal');
        obs.disconnect();
      }
    }, { threshold: 0.2 }).observe(el);
  });
}());
