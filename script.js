// Jose Rizal — Childhood website interactions & animations
(() => {
  'use strict';

  /* ---------- Deterministic hash scroll (before any reveal checks) ---------- */
  if (location.hash) {
    const hashTarget = document.querySelector(location.hash);
    if (hashTarget) hashTarget.scrollIntoView({ behavior: 'auto', block: 'start' });
  }

  /* ---------- Theme toggle ---------- */
  const root = document.documentElement;
  const themeBtn = document.querySelector('.nav__toggle');
  const savedTheme = localStorage.getItem('rizal-theme');
  if (savedTheme) root.setAttribute('data-theme', savedTheme);

  const applyThemeIcon = () => {
    if (!themeBtn) return;
    const current = root.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    themeBtn.textContent = current === 'dark' ? '☀' : '☾';
  };
  applyThemeIcon();

  themeBtn?.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('rizal-theme', next);
    applyThemeIcon();
  });

  /* ---------- Mobile nav ---------- */
  const burger = document.querySelector('.nav__burger');
  const navLinks = document.querySelector('.nav__links');
  burger?.addEventListener('click', () => {
    navLinks?.classList.toggle('open');
  });
  navLinks?.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => navLinks.classList.remove('open'))
  );

  /* ---------- Timeline fill progress ---------- */
  const timeline = document.querySelector('.timeline');
  function updateTimelineProgress() {
    if (!timeline) return;
    const rect = timeline.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = rect.height;
    const start = vh * 0.75;
    let progressed = start - rect.top;
    progressed = Math.max(0, Math.min(progressed, total));
    const ratio = total > 0 ? progressed / total : 0;
    timeline.style.setProperty('--tl-progress', ratio.toFixed(4));
  }

  /* ---------- Scroll progress bar + nav hide ---------- */
  const progress = document.querySelector('.scroll-progress');
  const nav = document.querySelector('.nav');
  let lastY = window.scrollY;

  const onScroll = () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const height = doc.scrollHeight - doc.clientHeight;
    const pct = height > 0 ? (scrollTop / height) * 100 : 0;
    if (progress) progress.style.width = pct + '%';

    if (nav) {
      if (scrollTop > lastY && scrollTop > 140) {
        nav.classList.add('nav--hidden');
      } else {
        nav.classList.remove('nav--hidden');
      }
    }
    lastY = scrollTop;

    updateTimelineProgress();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => io.observe(el));

  // reveal anything already on screen at load (e.g. a direct link to a section)
  requestAnimationFrame(() => {
    revealEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        el.classList.add('in-view');
      }
    });
  });

  // stagger index for children with .stagger
  document.querySelectorAll('.stagger').forEach(group => {
    Array.from(group.children).forEach((child, i) => {
      child.style.setProperty('--i', i);
    });
  });

  /* ---------- Hero typewriter ---------- */
  const typeEl = document.querySelector('.typewriter');
  if (typeEl) {
    const text = typeEl.getAttribute('data-text') || typeEl.textContent || '';
    typeEl.textContent = '';
    let i = 0;
    const speed = 42;
    const type = () => {
      if (i <= text.length) {
        typeEl.textContent = text.slice(0, i);
        i++;
        setTimeout(type, speed);
      }
    };
    setTimeout(type, 700);
  }

  /* ---------- Falling leaves ---------- */
  const leavesContainer = document.querySelector('.leaves');
  if (leavesContainer) {
    const glyphs = ['❧', '☙', '✦', '❋'];
    const count = window.innerWidth < 700 ? 10 : 18;
    for (let n = 0; n < count; n++) {
      const leaf = document.createElement('span');
      leaf.className = 'leaf';
      leaf.textContent = glyphs[n % glyphs.length];
      leaf.style.left = Math.random() * 100 + '%';
      leaf.style.fontSize = (0.9 + Math.random() * 1.1) + 'rem';
      leaf.style.setProperty('--drift', (Math.random() * 160 - 80) + 'px');
      leaf.style.animationDuration = (10 + Math.random() * 14) + 's';
      leaf.style.animationDelay = (Math.random() * -20) + 's';
      leavesContainer.appendChild(leaf);
    }
  }

  /* ---------- Accordion chapters ---------- */
  document.querySelectorAll('.chapter__head').forEach(head => {
    head.addEventListener('click', () => {
      const chapter = head.closest('.chapter');
      const body = chapter.querySelector('.chapter__body');
      const isOpen = chapter.classList.contains('open');

      document.querySelectorAll('.chapter.open').forEach(other => {
        if (other !== chapter) {
          other.classList.remove('open');
          other.querySelector('.chapter__body').style.maxHeight = null;
        }
      });

      if (isOpen) {
        chapter.classList.remove('open');
        body.style.maxHeight = null;
      } else {
        chapter.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  // open first chapter by default
  const firstChapter = document.querySelector('.chapter');
  if (firstChapter) {
    firstChapter.classList.add('open');
    const body = firstChapter.querySelector('.chapter__body');
    requestAnimationFrame(() => { body.style.maxHeight = body.scrollHeight + 'px'; });
  }

  /* ---------- Smooth active nav link ---------- */
  const sections = document.querySelectorAll('main section[id]');
  const navAnchors = document.querySelectorAll('.nav__links a');
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.getAttribute('id');
      const link = document.querySelector(`.nav__links a[href="#${id}"]`);
      if (!link) return;
      if (entry.isIntersecting) {
        navAnchors.forEach(a => a.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => navIO.observe(s));

  /* ---------- Gallery lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');

  if (lightbox) {
    const openLightbox = (src, alt, caption) => {
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      lightboxCaption.textContent = caption || '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    };

    document.querySelectorAll('.gallery__thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const img = thumb.querySelector('img');
        openLightbox(img.src, img.alt, thumb.dataset.caption);
      });
    });

    lightbox.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  }

})();
