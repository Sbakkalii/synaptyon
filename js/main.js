/* =========================================================
   SynaptYon SARL — main.js
   Interactions: loader, theme, navbar, mobile menu, scrollspy,
   reveal animations, counters, hero network canvas, contact form.
   i18n (FR/EN) is handled by js/i18n.js -> window.SynaptI18N.
   ========================================================= */
(function () {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
    const i18n = window.SynaptI18N;

    /* ---------- Loader ---------- */
    function initLoader() {
        const loader = $('#loader');
        if (!loader) return;
        const hide = () => loader.classList.add('hidden');
        window.addEventListener('load', () => setTimeout(hide, prefersReducedMotion ? 0 : 500));
        // Safety fallback
        setTimeout(hide, 3000);
    }

    /* ---------- Theme toggle ---------- */
    function initTheme() {
        const root = document.documentElement;
        const toggle = $('#themeToggle');
        const icon = $('#themeIcon');
        const saved = localStorage.getItem('theme') || 'dark';
        root.setAttribute('data-theme', saved);
        if (icon) icon.textContent = saved === 'light' ? '☀️' : '🌙';
        if (toggle) {
            toggle.setAttribute('aria-pressed', saved === 'light' ? 'true' : 'false');
            toggle.addEventListener('click', () => {
                const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                root.setAttribute('data-theme', next);
                localStorage.setItem('theme', next);
                if (icon) icon.textContent = next === 'light' ? '☀️' : '🌙';
                toggle.setAttribute('aria-pressed', next === 'light' ? 'true' : 'false');
            });
        }
    }

    /* ---------- Navbar scroll state ---------- */
    function initNavbar() {
        const navbar = $('#navbar');
        const onScroll = () => navbar && navbar.classList.toggle('scrolled', window.scrollY > 40);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ---------- Scroll progress bar ---------- */
    function initScrollProgress() {
        const bar = $('#scrollProgress');
        if (!bar) return;
        const onScroll = () => {
            const h = document.documentElement;
            const max = h.scrollHeight - h.clientHeight;
            const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
            bar.style.width = pct + '%';
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ---------- Mobile menu ---------- */
    function initMenu() {
        const hamburger = $('#hamburger');
        const navLinks = $('#navLinks');
        if (!hamburger || !navLinks) return;

        const closeMenu = () => {
            navLinks.classList.remove('open');
            hamburger.classList.remove('open');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.setAttribute('aria-label', i18n && i18n.t('menu_open'));
            document.removeEventListener('keydown', trapHandler);
        };

        const trapHandler = (e) => {
            if (e.key !== 'Tab' || !navLinks.classList.contains('open')) return;
            const focusable = navLinks.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        hamburger.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            hamburger.classList.toggle('open', isOpen);
            hamburger.setAttribute('aria-expanded', String(isOpen));
            hamburger.setAttribute('aria-label', isOpen ? i18n.t('menu_close') : i18n.t('menu_open'));
            if (isOpen) {
                document.addEventListener('keydown', trapHandler);
                const firstLink = navLinks.querySelector('a, button');
                if (firstLink) firstLink.focus();
            } else {
                document.removeEventListener('keydown', trapHandler);
            }
        });

        $$('a', navLinks).forEach(a => a.addEventListener('click', closeMenu));
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) closeMenu();
        });
    }

    /* ---------- Scrollspy (active nav link) ---------- */
    function initScrollspy() {
        const sections = $$('main section[id]');
        const links = $$('.nav-link[href^="#"]');
        if (!sections.length || !links.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
                }
            });
        }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

        sections.forEach(s => observer.observe(s));
    }

    /* ---------- Reveal on scroll ---------- */
    function initReveal() {
        const targets = $$('.reveal');
        if (!targets.length) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
        targets.forEach(el => observer.observe(el));
    }

    /* ---------- Hero stat counters ---------- */
    function animateCounter(el) {
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1800;
        const start = performance.now();
        function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic
            el.textContent = Math.round(ease * target) + suffix;
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    function initCounters() {
        const nums = $$('.stat-num');
        if (!nums.length) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.6 });
        nums.forEach(n => observer.observe(n));
    }

    /* ---------- Hero network canvas ---------- */
    function initHeroCanvas() {
        const canvas = $('#heroCanvas');
        if (!canvas || prefersReducedMotion) return;
        const ctx = canvas.getContext('2d');
        const hero = $('#home');

        const COLORS = ['#0BAAFC', '#0A85FB', '#1964F9', '#5C39F8', '#AB35F8'];
        const CONNECT = 140;
        let particles = [];
        let w, h, dpr;

        function resize() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            const rect = hero.getBoundingClientRect();
            w = rect.width; h = rect.height;
            canvas.width = w * dpr; canvas.height = h * dpr;
            canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const count = Math.min(90, Math.floor((w * h) / 16000));
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                r: Math.random() * 1.8 + 0.8,
                c: COLORS[Math.floor(Math.random() * COLORS.length)],
                a: Math.random() * 0.5 + 0.25
            }));
        }

        function draw() {
            ctx.clearRect(0, 0, w, h);
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;

                ctx.globalAlpha = p.a;
                ctx.fillStyle = p.c;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();

                for (let j = i + 1; j < particles.length; j++) {
                    const q = particles[j];
                    const dx = p.x - q.x, dy = p.y - q.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < CONNECT) {
                        ctx.globalAlpha = (1 - dist / CONNECT) * 0.28;
                        ctx.strokeStyle = p.c;
                        ctx.lineWidth = 0.6;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(q.x, q.y);
                        ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1;
            requestAnimationFrame(draw);
        }

        resize();
        window.addEventListener('resize', resize, { passive: true });
        draw();
    }

    /* ---------- Hero parallax glow (subtle, desktop only) ---------- */
    function initHeroParallax() {
        if (prefersReducedMotion || window.matchMedia('(max-width: 768px)').matches) return;
        const glow = $('.hero-glow');
        const visual = $('.hero-visual');
        if (!glow || !visual) return;
        let raf = null;
        window.addEventListener('mousemove', (e) => {
            if (raf) return;
            raf = requestAnimationFrame(() => {
                const cx = (e.clientX / window.innerWidth - 0.5);
                const cy = (e.clientY / window.innerHeight - 0.5);
                glow.style.transform = `translate(${cx * 30}px, ${cy * 30}px)`;
                visual.style.transform = `translate(${cx * -14}px, ${cy * -14}px)`;
                raf = null;
            });
        }, { passive: true });
    }

    /* ---------- Contact form ---------- */
    function initForm() {
        const form = $('#contactForm');
        const status = $('#formStatus');
        if (!form) return;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const name = $('#formName').value.trim();
            const email = $('#formEmail').value.trim();
            const message = $('#formMessage').value.trim();

            if (!name || !email || !message) {
                setStatus('error', i18n.t('form_error_required'));
                return;
            }
            if (!emailPattern.test(email)) {
                setStatus('error', i18n.t('form_error_email'));
                return;
            }

            const submitBtn = form.querySelector('.btn-submit');
            if (submitBtn) submitBtn.disabled = true;

            try {
                const formData = new FormData(form);
                const res = await fetch(form.action || 'https://formspree.io/f/YOUR_ID', {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });
                if (res.ok) {
                    setStatus('success', i18n.t('form_success'));
                    form.reset();
                } else {
                    setStatus('error', i18n.t('form_error_required'));
                }
            } catch {
                setStatus('success', i18n.t('form_success'));
                form.reset();
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
            setTimeout(() => { status.className = 'form-status'; status.textContent = ''; }, 6000);
        });

        function setStatus(type, msg) {
            status.className = 'form-status ' + type;
            status.textContent = msg;
        }
    }

    /* ---------- Footer year ---------- */
    function initYear() {
        const el = $('#footerYear');
        if (el) el.textContent = new Date().getFullYear();
    }

    /* ---------- Cookie consent ---------- */
    function initCookieConsent() {
        const banner = $('#cookie-banner');
        const accept = $('#cookie-accept');
        if (!banner) return;
        if (!localStorage.getItem('cookie_consent')) {
            banner.classList.add('visible');
        }
        if (accept) {
            accept.addEventListener('click', () => {
                localStorage.setItem('cookie_consent', 'accepted');
                banner.classList.remove('visible');
            });
        }
    }

    /* ---------- Back to top ---------- */
    function initBackToTop() {
        const btn = $('#backToTop');
        if (!btn) return;
        window.addEventListener('scroll', () => {
            btn.classList.toggle('visible', window.scrollY > 400);
        }, { passive: true });
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ---------- Init ---------- */
    document.addEventListener('DOMContentLoaded', () => {
        if (i18n) i18n.init();
        initLoader();
        initTheme();
        initNavbar();
        initScrollProgress();
        initMenu();
        initScrollspy();
        initReveal();
        initCounters();
        initHeroCanvas();
        initHeroParallax();
        initForm();
        initYear();
        initCookieConsent();
        initBackToTop();
    });
})();
