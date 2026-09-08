/* =========================================================
   Portfolio — main.js
   Vanilla JS: theme toggle, mobile nav, scroll reveal,
   typing effect, dynamic project fetch, contact form handling.
   No external dependencies.
   ========================================================= */

(() => {
  'use strict';

  /* ---------- Theme toggle (persisted in localStorage) ---------- */
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('portfolio-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('portfolio-theme', theme);
  }
  applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

  themeToggle?.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    applyTheme(current === 'light' ? 'dark' : 'light');
  });

  /* ---------- Sticky header shadow on scroll ---------- */
  const header = document.getElementById('siteHeader');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 12);
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  navToggle?.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('[data-nav]').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle?.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- Active nav link highlighting on scroll ---------- */
  const sections = document.querySelectorAll('main section[id]');
  const navItems = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navItems.forEach((item) => {
            item.classList.toggle('active', item.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
  );
  sections.forEach((section) => sectionObserver.observe(section));

  /* ---------- Scroll-reveal animation ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ---------- Animated stat counters ---------- */
  const statEls = document.querySelectorAll('[data-count]');
  const statObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'), 10) || 0;
        const duration = 1200;
        const start = performance.now();

        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          el.textContent = Math.floor(progress * target);
          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = target;
        }
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  statEls.forEach((el) => statObserver.observe(el));

  /* ---------- Hero typing effect ---------- */
  const typedTextEl = document.getElementById('typedText');
  const phrases = [
    'Full Stack LLM Development Analyst',
    'Angular & .NET Engineer',
    'Python Developer',
    'AI-Enabled App Builder',
    'CI/CD & Cloud Enthusiast',
  ];

  if (typedTextEl) {
    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function typeLoop() {
      const current = phrases[phraseIndex];
      if (!deleting) {
        charIndex++;
        typedTextEl.textContent = current.slice(0, charIndex);
        if (charIndex === current.length) {
          deleting = true;
          setTimeout(typeLoop, 1400);
          return;
        }
      } else {
        charIndex--;
        typedTextEl.textContent = current.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
        }
      }
      setTimeout(typeLoop, deleting ? 35 : 65);
    }
    typeLoop();
  }

  /* ---------- Cursor glow (desktop only, decorative) ---------- */
  const cursorGlow = document.querySelector('.cursor-glow');
  if (cursorGlow && window.matchMedia('(min-width: 900px)').matches) {
    document.addEventListener('mousemove', (e) => {
      cursorGlow.style.left = `${e.clientX}px`;
      cursorGlow.style.top = `${e.clientY}px`;
    });
  }

  /* ---------- Fetch & render projects from the serverless API ---------- */
  const projectsGrid = document.getElementById('projectsGrid');

  async function loadProjects() {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      const data = await res.json();
      renderProjects(data.projects || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
      renderProjectsFallback();
    }
  }

  function renderProjects(projects) {
    if (!projectsGrid) return;
    if (!projects.length) return renderProjectsFallback();

    projectsGrid.innerHTML = projects
      .map(
        (p) => `
        <article class="project-card">
          <div class="project-thumb">${escapeHtml(initials(p.title))}</div>
          <div class="project-body">
            <h3>${escapeHtml(p.title)}</h3>
            <p>${escapeHtml(p.description)}</p>
            <div class="project-tags">
              ${(p.tags || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('')}
            </div>
            <div class="project-links">
              ${p.liveUrl ? `<a href="${escapeAttr(p.liveUrl)}" target="_blank" rel="noopener">Live ↗</a>` : ''}
              ${p.repoUrl ? `<a href="${escapeAttr(p.repoUrl)}" target="_blank" rel="noopener">Code ↗</a>` : ''}
            </div>
          </div>
        </article>`
      )
      .join('');
  }

  function renderProjectsFallback() {
    if (!projectsGrid) return;
    projectsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center;">Projects will appear here once the API is deployed. Edit <code>data/projects.json</code> to customize them.</p>`;
  }

  function initials(title) {
    return title
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }
  function escapeHtml(str = '') {
    return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function escapeAttr(str = '') {
    return escapeHtml(str);
  }

  loadProjects();

  /* ---------- Contact form submission ---------- */
  const contactForm = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const formStatus = document.getElementById('formStatus');

  contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    formStatus.textContent = '';
    formStatus.className = 'form-status';

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Something went wrong.');

      formStatus.textContent = "Thanks! Your message has been sent — I'll get back to you soon.";
      formStatus.classList.add('success');
      contactForm.reset();
    } catch (err) {
      formStatus.textContent = err.message || 'Unable to send message. Please try again later.';
      formStatus.classList.add('error');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });

  /* ---------- Misc ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
