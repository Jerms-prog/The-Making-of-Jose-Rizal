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

  /* ---------- Background music ---------- */
  const music = document.getElementById('bg-music');
  const musicBtn = document.querySelector('.nav__music');
  if (music && musicBtn) {
    music.volume = 0.45;

    const setPlayingUI = (playing) => {
      musicBtn.textContent = playing ? '♫' : '♪';
      musicBtn.setAttribute('aria-pressed', String(playing));
      musicBtn.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
    };

    musicBtn.addEventListener('click', () => {
      if (music.paused) {
        music.play()
          .then(() => {
            setPlayingUI(true);
            localStorage.setItem('rizal-music', 'on');
          })
          .catch(() => setPlayingUI(false));
      } else {
        music.pause();
        setPlayingUI(false);
        localStorage.setItem('rizal-music', 'off');
      }
    });

    // Resume music automatically only after the visitor has already
    // interacted once (browsers block unsolicited autoplay with sound).
    if (localStorage.getItem('rizal-music') === 'on') {
      const resumeOnFirstInteraction = () => {
        music.play().then(() => setPlayingUI(true)).catch(() => {});
        document.removeEventListener('click', resumeOnFirstInteraction);
        document.removeEventListener('keydown', resumeOnFirstInteraction);
      };
      document.addEventListener('click', resumeOnFirstInteraction, { once: true });
      document.addEventListener('keydown', resumeOnFirstInteraction, { once: true });
    }
  }

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

  /* ---------- Quiz ---------- */
  (() => {
    const app = document.getElementById('quiz-app');
    if (!app) return;

    const QUESTIONS = [
      {
        q: 'On what date was José Rizal born?',
        options: ['June 19, 1861', 'June 22, 1861', 'December 30, 1861', 'March 4, 1861'],
        answer: 0,
        explain: 'He was born on June 19, 1861, in Calamba, Laguna.'
      },
      {
        q: 'Who baptized the newborn José three days after his birth?',
        options: ['Father Pedro Casañas', 'Father Rufino Collantes', 'Father Leon Monroy', 'Father Justiniano Cruz'],
        answer: 1,
        explain: 'Father Rufino Collantes baptized him at St. John the Baptist Parish Church; Father Casañas was his godfather.'
      },
      {
        q: 'At about what age did Rizal write his first known poem, "Sa Aking Mga Kabata"?',
        options: ['Three', 'Eight', 'Eleven', 'Fifteen'],
        answer: 1,
        explain: 'He wrote it at approximately eight years old, celebrating love of one\'s native language.'
      },
      {
        q: 'Which of Rizal\'s three maternal uncles trained him in swimming, wrestling, and horseback riding?',
        options: ['Uncle José', 'Uncle Manuel', 'Uncle Gregorio', 'Uncle Alberto'],
        answer: 1,
        explain: 'Uncle Manuel focused on his physical development, while Gregorio inspired his love of books.'
      },
      {
        q: 'In Biñan, who was Rizal\'s respected teacher?',
        options: ['Maestro Celestino', 'Maestro Lucas Padua', 'Maestro Justiniano Aquino Cruz', 'Leon Monroy'],
        answer: 2,
        explain: 'At age nine he studied under Maestro Justiniano Aquino Cruz in Biñan, Laguna.'
      },
      {
        q: 'What lesson did Rizal\'s mother draw from the moth near the flame?',
        options: [
          'That moths are harmful to crops',
          'That one should fear all light',
          'That devotion to truth can demand great sacrifice',
          'That candles should never be lit at night'
        ],
        answer: 2,
        explain: 'Like the moth, he would dedicate himself to truth and country despite the cost.'
      },
      {
        q: 'Whom did Rizal remember as "the first sorrow of his life"?',
        options: ['His mother, Teodora', 'His sister Concepcion (Concha)', 'His uncle Gregorio', 'His teacher Monroy'],
        answer: 1,
        explain: 'Concha died of illness at age three, and Rizal grieved her deeply.'
      },
      {
        q: 'What does the surname "Rizal," adopted by the family, mean?',
        options: ['Green fields', 'Rising sun', 'Brave heart', 'Old town'],
        answer: 0,
        explain: 'It means "green fields," taken after Clavería\'s decree standardizing surnames.'
      }
    ];

    const LETTERS = ['A', 'B', 'C', 'D'];
    let current = 0;
    let score = 0;
    let answered = false;

    const buildStart = () => {
      app.innerHTML = `
        <div class="quiz__card">
          <p class="quiz__meta"><span>8 Questions</span><span>Childhood of Rizal</span></p>
          <p class="quiz__question">Test what you've learned about the boy who became a hero.</p>
          <div class="quiz__result">
            <button class="btn quiz__start">Begin the Quiz</button>
          </div>
        </div>`;
      app.querySelector('.quiz__start').addEventListener('click', () => {
        current = 0; score = 0; renderQuestion();
      });
    };

    const renderQuestion = () => {
      answered = false;
      const item = QUESTIONS[current];
      const pct = (current / QUESTIONS.length) * 100;
      app.innerHTML = `
        <div class="quiz__card">
          <div class="quiz__progress"><div class="quiz__progress-bar" style="width:${pct}%"></div></div>
          <div class="quiz__meta">
            <span>Question ${current + 1}</span>
            <span class="quiz__count">of ${QUESTIONS.length}</span>
          </div>
          <p class="quiz__question">${item.q}</p>
          <ul class="quiz__options">
            ${item.options.map((opt, i) => `
              <li>
                <button class="quiz__option" data-i="${i}" ${answered ? 'disabled' : ''}>
                  <span class="quiz__option-marker">${LETTERS[i]}</span>
                  <span>${opt}</span>
                </button>
              </li>`).join('')}
          </ul>
          <p class="quiz__feedback" role="status"></p>
          <button class="btn quiz__next" hidden>Next Question</button>
        </div>`;

      app.querySelectorAll('.quiz__option').forEach(btn => {
        btn.addEventListener('click', () => handleAnswer(Number(btn.dataset.i)));
      });
    };

    const handleAnswer = (choice) => {
      if (answered) return;
      answered = true;
      const item = QUESTIONS[current];
      const isCorrect = choice === item.answer;
      if (isCorrect) score++;

      app.querySelectorAll('.quiz__option').forEach((btn, i) => {
        btn.disabled = true;
        if (i === item.answer) btn.classList.add('quiz__option--correct');
        else if (i === choice) btn.classList.add('quiz__option--wrong');
      });

      const feedback = app.querySelector('.quiz__feedback');
      feedback.textContent = (isCorrect ? 'Correct. ' : 'Not quite. ') + item.explain;
      feedback.classList.add(isCorrect ? 'quiz__feedback--correct' : 'quiz__feedback--wrong');

      const nextBtn = app.querySelector('.quiz__next');
      nextBtn.hidden = false;
      nextBtn.textContent = current + 1 === QUESTIONS.length ? 'See Your Score' : 'Next Question';
      nextBtn.onclick = () => {
        current++;
        current < QUESTIONS.length ? renderQuestion() : renderResult();
      };
    };

    const renderResult = () => {
      const pct = (score / QUESTIONS.length) * 100;
      let title, text;
      if (pct === 100) {
        title = 'A True Ilustrado';
        text = 'Perfect! You know the childhood that shaped José Rizal as well as any scholar.';
      } else if (pct >= 60) {
        title = 'A Devoted Student';
        text = 'Well done — you\'ve grasped the foundations of Rizal\'s early life. Read the chapters again to master the rest.';
      } else {
        title = 'An Eager Learner';
        text = 'A good start! Revisit the story of Calamba and try once more — every ilustrado begins as a student.';
      }

      app.innerHTML = `
        <div class="quiz__card">
          <div class="quiz__progress"><div class="quiz__progress-bar" style="width:100%"></div></div>
          <div class="quiz__result">
            <p class="quiz__meta" style="justify-content:center">Your Score</p>
            <div class="quiz__result-score">${score} / ${QUESTIONS.length}</div>
            <h3 class="quiz__result-title">${title}</h3>
            <p class="quiz__result-text">${text}</p>
            <button class="btn quiz__retake">Retake the Quiz</button>
          </div>
        </div>`;
      app.querySelector('.quiz__retake').addEventListener('click', buildStart);
    };

    buildStart();
  })();

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
