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
   * Hero background: a robot sweeping a 2D LiDAR across a small room.
   * Points light up when the beam hits them and fade afterwards. Only
   * the nearest surface along each bearing is visible (occlusion).
   * Paused while off-screen; a single static frame for reduced motion.
   * ------------------------------------------------------------- */
  const canvas = document.querySelector('.hero-canvas');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const BINS = 540;
    let W = 0, H = 0, dpr = 1, pts = [], segs = [], running = false, last = 0, t = 0;
    const hit = new Float32Array(20000);

    function buildScene() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width; H = rect.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // room in normalised coordinates, scaled to the hero
      const m = Math.min(W, H);
      const x0 = W * 0.04, y0 = H * 0.07, x1 = W * 0.96, y1 = H * 0.84;
      segs = [[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]];
      const box = (cx, cy, w, h) => {
        const a = cx - w / 2, b = cy - h / 2, c = cx + w / 2, d = cy + h / 2;
        segs.push([a, b, c, b], [c, b, c, d], [c, d, a, d], [a, d, a, b]);
      };
      // shelf islands and crates
      box(W * 0.55, H * 0.3, m * 0.22, m * 0.05);
      box(W * 0.55, H * 0.66, m * 0.22, m * 0.05);
      box(W * 0.82, H * 0.5, m * 0.06, m * 0.2);
      box(W * 0.3, H * 0.22, m * 0.07, m * 0.07);
      box(W * 0.22, H * 0.68, m * 0.1, m * 0.05);
      box(W * 0.74, H * 0.74, m * 0.06, m * 0.06);
      pts = [];
      const step = 5;
      for (const [ax, ay, bx, by] of segs) {
        const len = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(len / step));
        for (let i = 0; i <= n; i++) {
          const jitter = (Math.random() - 0.5) * 1.6;
          pts.push([ax + ((bx - ax) * i) / n + jitter, ay + ((by - ay) * i) / n + jitter]);
        }
      }
      // a few round obstacles (people / pillars)
      [[0.3, 0.45, 0.03], [0.86, 0.2, 0.025], [0.4, 0.75, 0.022]].forEach(([cx, cy, r]) => {
        const R = r * m;
        for (let a = 0; a < Math.PI * 2; a += 0.22) pts.push([W * cx + Math.cos(a) * R, H * cy + Math.sin(a) * R]);
      });
      if (pts.length > hit.length) pts.length = hit.length;
      hit.fill(-1e9);
    }

    function robotPose(time) {
      // slow figure-of-eight through the free space
      const u = time * 0.07;
      return [W * (0.58 + 0.14 * Math.sin(u)), H * (0.46 + 0.1 * Math.sin(2 * u))];
    }

    function frame(time) {
      const [rx, ry] = robotPose(time);
      const sweep = (time * 2.2) % (Math.PI * 2);
      // nearest point per bearing bin
      const best = new Int32Array(BINS).fill(-1), bestD = new Float32Array(BINS).fill(1e9);
      for (let i = 0; i < pts.length; i++) {
        const dx = pts[i][0] - rx, dy = pts[i][1] - ry, d = dx * dx + dy * dy;
        let a = Math.atan2(dy, dx); if (a < 0) a += Math.PI * 2;
        const b = Math.floor((a / (Math.PI * 2)) * BINS) % BINS;
        if (d < bestD[b]) { bestD[b] = d; best[b] = i; }
      }
      // beam sweeps a wedge; visible points inside it get stamped
      const width = 0.16;
      for (let b = 0; b < BINS; b++) {
        if (best[b] < 0) continue;
        const a = ((b + 0.5) / BINS) * Math.PI * 2;
        let diff = sweep - a; diff -= Math.PI * 2 * Math.floor(diff / (Math.PI * 2));
        if (reduce || diff < width) hit[best[b]] = time;
      }

      ctx.clearRect(0, 0, W, H);
      // range rings
      ctx.lineWidth = 1;
      for (let r = 50; r < Math.max(W, H); r += 50) {
        ctx.strokeStyle = 'rgba(255,255,255,0.045)';
        ctx.beginPath(); ctx.arc(rx, ry, r, 0, Math.PI * 2); ctx.stroke();
      }
      // beam wedge
      if (!reduce) {
        const R = Math.hypot(W, H);
        const g = ctx.createRadialGradient(rx, ry, 0, rx, ry, R * 0.6);
        g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.arc(rx, ry, R, sweep - width * 2.2, sweep); ctx.closePath(); ctx.fill();
      }
      // points
      for (let i = 0; i < pts.length; i++) {
        const age = time - hit[i];
        const alpha = reduce ? (hit[i] > -1e8 ? 0.6 : 0.09) : Math.max(0.09, 0.95 * Math.exp(-age / 3.2));
        ctx.fillStyle = `rgba(237,237,239,${alpha.toFixed(3)})`;
        ctx.fillRect(pts[i][0] - 1.1, pts[i][1] - 1.1, 2.2, 2.2);
      }
      // robot
      ctx.fillStyle = 'rgba(159,213,196,1)';
      ctx.beginPath(); ctx.arc(rx, ry, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(159,213,196,0.4)';
      ctx.beginPath(); ctx.arc(rx, ry, 10, 0, Math.PI * 2); ctx.stroke();
    }

    function loop(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now; t += dt;
      frame(t);
      requestAnimationFrame(loop);
    }
    function start() {
      if (running || reduce) return;
      running = true; last = performance.now(); requestAnimationFrame(loop);
    }
    function stop() { running = false; }

    buildScene();
    if (reduce) { frame(0); } else { t = 6; frame(t); }
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { buildScene(); frame(t); }, 150);
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? start() : stop()))).observe(canvas);
    } else {
      start();
    }
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  }

  /* ---------------------------------------------------------------
   * Scroll progress bar under the header
   * ------------------------------------------------------------- */
  if (header) {
    const bar = document.createElement('div');
    bar.className = 'progress';
    bar.setAttribute('aria-hidden', 'true');
    header.appendChild(bar);
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------------------------------------------------------------
   * Footer year
   * ------------------------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
});
