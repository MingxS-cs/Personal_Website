/*
 * script.js – language toggle, navigation, project filters and small UI
 * niceties shared by every page.
 *
 * Each textual element carries data-en and data-zh attributes holding its
 * English and Chinese versions. The toggle swaps textContent and the
 * choice is persisted in localStorage.
 */

document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const storage = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        /* storage unavailable – ignore */
      }
    },
  };

  /* ---------------------------------------------------------------
   * Language toggle
   * ------------------------------------------------------------- */
  const toggleBtn = document.getElementById('lang-toggle');
  let currentLang = storage.get('lang') === 'zh' ? 'zh' : 'en';

  function setLanguage(lang) {
    currentLang = lang;
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
    if (toggleBtn) {
      toggleBtn.textContent = lang === 'en' ? '中文' : 'EN';
      toggleBtn.setAttribute('aria-label', lang === 'en' ? '切换到中文' : 'Switch to English');
    }

    document.querySelectorAll('[data-en]').forEach(el => {
      const translation = el.dataset[lang];
      if (translation === undefined) return;
      const tag = el.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') {
        el.placeholder = translation;
      } else if (tag === 'img') {
        el.alt = translation;
      } else {
        el.textContent = translation;
      }
    });

    // Attributes that need translating (e.g. aria-labels, titles)
    document.querySelectorAll('[data-title-en]').forEach(el => {
      el.title = el.dataset[lang === 'zh' ? 'titleZh' : 'titleEn'];
    });

    // Document title
    const t = document.querySelector('meta[name="title-zh"]');
    if (t) {
      if (!document.body.dataset.titleEn) document.body.dataset.titleEn = document.title;
      document.title = lang === 'zh' ? t.content : document.body.dataset.titleEn;
    }

    // CV link follows the language
    document.querySelectorAll('.cv-link, [data-cv]').forEach(link => {
      const base = link.getAttribute('href').replace(/CV_(EN|ZH)\.pdf$/, '');
      link.setAttribute('href', `${base}CV_${lang === 'zh' ? 'ZH' : 'EN'}.pdf`);
    });

    storage.set('lang', lang);
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => setLanguage(currentLang === 'en' ? 'zh' : 'en'));
  }
  setLanguage(currentLang);

  /* ---------------------------------------------------------------
   * Header: shadow on scroll + mobile menu
   * ------------------------------------------------------------- */
  const header = document.querySelector('header');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinksBox = document.querySelector('.nav-links');

  function closeMenu() {
    if (!header) return;
    header.classList.remove('nav-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle && header) {
    navToggle.addEventListener('click', () => {
      const open = header.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    if (navLinksBox) {
      navLinksBox.addEventListener('click', e => {
        if (e.target.closest('a')) closeMenu();
      });
    }
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMenu();
    });
    document.addEventListener('click', e => {
      if (header.classList.contains('nav-open') && !header.contains(e.target)) closeMenu();
    });
  }

  /* ---------------------------------------------------------------
   * Scroll-linked UI: header state, scroll spy, back-to-top
   * ------------------------------------------------------------- */
  const spyLinks = [];
  document.querySelectorAll('nav .nav-links a[href^="#"]').forEach(link => {
    const section = document.getElementById(link.getAttribute('href').slice(1));
    if (section) spyLinks.push({ link, section });
  });

  const toTop = document.querySelector('.to-top');
  if (toTop) {
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 8);
    if (toTop) toTop.classList.toggle('show', y > 700);

    const probe = y + window.innerHeight * 0.3;
    let current = null;
    spyLinks.forEach(item => {
      if (item.section.offsetTop <= probe) current = item;
    });
    spyLinks.forEach(item => item.link.classList.toggle('active', item === current));
    ticking = false;
  }
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );
  onScroll();

  /* ---------------------------------------------------------------
   * Project filters + "show all" (home page)
   * ------------------------------------------------------------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.projects-grid .project-card');
  const moreWrap = document.querySelector('.more-wrap');
  const moreBtn = document.querySelector('.more-btn');
  let expanded = false;
  let activeFilter = 'all';

  function applyFilter() {
    cards.forEach(card => {
      const cats = (card.dataset.cat || '').split(' ');
      const match = activeFilter === 'all' || cats.includes(activeFilter);
      card.classList.toggle('is-hidden', !match);
      // Older projects stay folded in the unfiltered view until expanded
      card.classList.toggle('is-collapsed', activeFilter === 'all' && !expanded && card.dataset.extra === 'true');
      // The wide "featured" layout only makes sense in the unfiltered view
      card.classList.toggle('featured', activeFilter === 'all' && card.dataset.featured === 'true');
    });
    if (moreWrap) moreWrap.classList.toggle('is-hidden', activeFilter !== 'all' || expanded);
  }

  if (cards.length) {
    filterBtns.forEach(btn => {
      const f = btn.dataset.filter;
      const n = f === 'all' ? cards.length : [...cards].filter(c => (c.dataset.cat || '').split(' ').includes(f)).length;
      const count = document.createElement('span');
      count.className = 'count';
      count.textContent = n;
      btn.appendChild(count); // label lives in an inner span so translation keeps the count

      btn.addEventListener('click', () => {
        activeFilter = f;
        filterBtns.forEach(b => {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        applyFilter();
      });
    });
    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        expanded = true;
        moreBtn.setAttribute('aria-expanded', 'true');
        applyFilter();
      });
    }
    applyFilter();
  }

  /* ---------------------------------------------------------------
   * Reveal on scroll
   * ------------------------------------------------------------- */
  const revealTargets = document.querySelectorAll(
    '.reveal, .project-card, .timeline .edu-item, .skill-card, .focus-card, .award-card, .project-section > *'
  );
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    revealTargets.forEach(el => {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  /* ---------------------------------------------------------------
   * Lightbox for gallery images
   * ------------------------------------------------------------- */
  const galleryImgs = document.querySelectorAll('.project-gallery img');
  if (galleryImgs.length) {
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<button class="icon-btn lightbox-close" aria-label="Close">✕</button><img alt="" />';
    document.body.appendChild(box);
    const big = box.querySelector('img');
    const close = () => box.classList.remove('open');
    galleryImgs.forEach(img => {
      img.addEventListener('click', () => {
        big.src = img.dataset.full || img.currentSrc || img.src;
        big.alt = img.alt;
        box.classList.add('open');
      });
    });
    box.addEventListener('click', close);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });
  }

  /* ---------------------------------------------------------------
   * Footer year
   * ------------------------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
});
