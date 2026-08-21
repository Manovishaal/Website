/* ============================================================
   MANOVISHAAL — PORTFOLIO INTERACTIVE ENGINE
   main.js — Canvas, Audio, Animations, Modals, Interactions
   ============================================================ */

'use strict';

/* ---------- RETRO BOOT SEQUENCE ---------- */
(function bootSequence() {
  const overlay = document.createElement('div');
  overlay.className = 'boot-overlay';
  const lines = [
    { text: '[ MANOVISHAAL STUDIO ENGINE v2025.1 ]', cls: '', delay: 0 },
    { text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', cls: '', delay: 150 },
    { text: 'LOADING GAME ENGINE MODULES ........', cls: 'ok', delay: 280 },
    { text: '  ► UE5 Core          [OK]', cls: 'ok', delay: 420 },
    { text: '  ► Android SDK       [OK]', cls: 'ok', delay: 540 },
    { text: '  ► ML Pipeline       [OK]', cls: 'ok', delay: 650 },
    { text: '  ► WebGL Canvas      [OK]', cls: 'ok', delay: 760 },
    { text: '  ► Audio Engine      [STANDBY]', cls: 'warn', delay: 870 },
    { text: 'INITIALIZING PARTICLE MESH ..........', cls: '', delay: 1000 },
    { text: 'PROFILE READY — WELCOME, OPERATOR', cls: 'ok', delay: 1200 },
  ];

  const logo = document.createElement('div');
  logo.className = 'boot-logo-boot';
  logo.textContent = 'MV // STUDIO';
  overlay.appendChild(logo);

  lines.forEach(({ text, cls, delay }) => {
    const el = document.createElement('div');
    el.className = 'boot-line' + (cls ? ' ' + cls : '');
    el.textContent = text;
    el.style.animationDelay = delay + 'ms';
    overlay.appendChild(el);
  });

  document.body.prepend(overlay);
  // Remove from DOM after animation completes
  setTimeout(() => overlay.remove(), 3200);
})();


const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let W, H, particles = [], mouse = { x: 0, y: 0 };

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.r = Math.random() * 1.6 + 0.4;
    this.vx = (Math.random() - 0.5) * 0.35;
    this.vy = (Math.random() - 0.5) * 0.35;
    this.alpha = Math.random() * 0.5 + 0.1;
    this.color = Math.random() > 0.6 ? '#00f0ff' : '#ff6b35';
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    // Mouse repulsion
    const dx = this.x - mouse.x;
    const dy = this.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 100) {
      this.x += (dx / dist) * 1.2;
      this.y += (dy / dist) * 1.2;
    }
    if (this.x < 0 || this.x > W) this.vx *= -1;
    if (this.y < 0 || this.y > H) this.vy *= -1;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function initParticles() {
  const count = Math.min(Math.floor((W * H) / 12000), 110);
  particles = Array.from({ length: count }, () => new Particle());
}

function drawGrid() {
  const gridSize = 72;
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.025)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = 0; x < W; x += gridSize) {
    ctx.moveTo(x, 0); ctx.lineTo(x, H);
  }
  for (let y = 0; y < H; y += gridSize) {
    ctx.moveTo(0, y); ctx.lineTo(W, y);
  }
  ctx.stroke();
}

function drawConnections() {
  const maxDist = 130;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < maxDist) {
        const alpha = (1 - dist / maxDist) * 0.18;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

function animateCanvas() {
  ctx.clearRect(0, 0, W, H);
  drawGrid();
  particles.forEach(p => { p.update(); p.draw(); });
  drawConnections();
  requestAnimationFrame(animateCanvas);
}

window.addEventListener('resize', () => { resize(); initParticles(); });
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
resize();
initParticles();
animateCanvas();


/* ---------- AUDIO ENGINE (Web Audio API) ---------- */
let audioCtx = null;
let audioOn = false;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq = 440, type = 'sine', duration = 0.08, vol = 0.06, delay = 0) {
  if (!audioOn) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + delay + duration);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.01);
  } catch (_) {}
}

function playHoverSound() { playTone(880, 'sine', 0.05, 0.04); }
function playClickSound() {
  playTone(440, 'square', 0.04, 0.07);
  playTone(660, 'sine', 0.06, 0.04, 0.02);
}
function playToastSound() {
  playTone(600, 'sine', 0.06, 0.06);
  playTone(900, 'sine', 0.08, 0.05, 0.06);
}
function playModalOpenSound() {
  [330, 440, 550].forEach((f, i) => playTone(f, 'sine', 0.1, 0.05, i * 0.05));
}
function playModalCloseSound() {
  [550, 440, 330].forEach((f, i) => playTone(f, 'sine', 0.08, 0.04, i * 0.04));
}

const audioToggleBtn = document.getElementById('audio-toggle');
const audioIcon = document.getElementById('audio-icon');
audioToggleBtn.addEventListener('click', () => {
  audioOn = !audioOn;
  audioToggleBtn.classList.toggle('on', audioOn);
  audioIcon.textContent = audioOn ? '♫' : '♪';
  if (audioOn) playTone(660, 'sine', 0.1, 0.07);
});


/* ---------- NAV: SCROLL + ACTIVE LINK ---------- */
const nav = document.getElementById('hud-nav');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
  updateActiveNavLink();
}, { passive: true });

function updateActiveNavLink() {
  const scrollPos = window.scrollY + 120;
  const sections = document.querySelectorAll('section[id]');
  sections.forEach(sec => {
    const top = sec.offsetTop;
    const bot = top + sec.offsetHeight;
    const id = sec.getAttribute('id');
    const link = document.querySelector(`.nav-link[data-section="${id}"]`);
    if (link) link.classList.toggle('active', scrollPos >= top && scrollPos < bot);
  });
}

/* Hamburger menu */
const hamburger = document.getElementById('nav-hamburger');
const mobileMenu = document.getElementById('mobile-menu');
hamburger.addEventListener('click', () => {
  const open = hamburger.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
  mobileMenu.classList.toggle('open', open);
  mobileMenu.setAttribute('aria-hidden', !open);
  playClickSound();
});
document.querySelectorAll('.mob-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', true);
  });
});

/* Add sound to all nav links */
navLinks.forEach(link => {
  link.addEventListener('mouseenter', playHoverSound);
  link.addEventListener('click', playClickSound);
});


/* ---------- HERO ROLE ROTATOR ---------- */
const roles = [
  'GAME DEVELOPER',
  'UNREAL ENGINE 5 ARTIST',
  'ANDROID & VR ENGINEER',
  'FULL-STACK DEVELOPER',
  'ML & DATA ENGINEER',
  'INDIE GAME CREATOR'
];
let roleIdx = 0;
const roleEl = document.getElementById('role-rotator');

function rotateRole() {
  roleEl.style.opacity = '0';
  roleEl.style.transform = 'translateY(-8px)';
  setTimeout(() => {
    roleIdx = (roleIdx + 1) % roles.length;
    roleEl.textContent = roles[roleIdx];
    roleEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    roleEl.style.opacity = '1';
    roleEl.style.transform = 'translateY(0)';
  }, 300);
}
roleEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
setInterval(rotateRole, 2800);


/* ---------- COUNTER ANIMATION ---------- */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

const counterEls = document.querySelectorAll('.tele-val');
let countersAnimated = false;

const heroObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting && !countersAnimated) {
      countersAnimated = true;
      counterEls.forEach(el => animateCounter(el));
    }
  });
}, { threshold: 0.5 });
const heroTelemetry = document.querySelector('.hero-telemetry');
if (heroTelemetry) heroObserver.observe(heroTelemetry);


/* ---------- SKILL BAR ANIMATION ---------- */
const skillFills = document.querySelectorAll('.skill-fill');
let skillsAnimated = false;

const skillsObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting && !skillsAnimated) {
      skillsAnimated = true;
      skillFills.forEach((fill, i) => {
        setTimeout(() => {
          fill.style.width = fill.dataset.width + '%';
        }, i * 80);
      });
    }
  });
}, { threshold: 0.3 });
const skillsSection = document.getElementById('skills');
if (skillsSection) skillsObserver.observe(skillsSection);


/* ---------- SCROLL REVEAL (Timeline Items) ---------- */
const timelineItems = document.querySelectorAll('.timeline-item');
const tlObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      tlObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
timelineItems.forEach(item => tlObserver.observe(item));


/* ---------- PROJECT FILTER ---------- */
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    const filter = btn.dataset.filter;
    playClickSound();
    projectCards.forEach((card, i) => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('hidden', !show);
      if (show) {
        card.style.animationDelay = `${(i % 3) * 80}ms`;
      }
    });
  });
  btn.addEventListener('mouseenter', playHoverSound);
});


/* ---------- PROJECT MODAL ---------- */
const modal = document.getElementById('project-modal');
const modalClose = document.getElementById('modal-close');
const modalTag = document.getElementById('modal-tag');
const modalTitle = document.getElementById('modal-title');
const modalTech = document.getElementById('modal-tech');
const modalDesc = document.getElementById('modal-desc');
const modalHighlightsList = document.getElementById('modal-highlights-list');

function openModal(card) {
  modalTag.textContent = card.dataset.tag || '';
  modalTitle.textContent = card.dataset.title || '';
  modalTech.textContent = card.dataset.tech || '';
  modalDesc.textContent = card.dataset.desc || '';
  modalHighlightsList.innerHTML = '';
  try {
    const highlights = JSON.parse(card.dataset.highlights || '[]');
    highlights.forEach(h => {
      const li = document.createElement('li');
      li.textContent = h;
      modalHighlightsList.appendChild(li);
    });
  } catch (_) {}
  modal.showModal();
  playModalOpenSound();
}

function closeModal() {
  modal.close();
  playModalCloseSound();
}

projectCards.forEach(card => {
  card.addEventListener('click', () => openModal(card));
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card); } });
  card.addEventListener('mouseenter', playHoverSound);
});

modalClose.addEventListener('click', closeModal);

// Light dismiss — click outside modal inner content
modal.addEventListener('click', e => {
  const rect = modal.querySelector('.modal-inner').getBoundingClientRect();
  if (e.clientX < rect.left || e.clientX > rect.right ||
      e.clientY < rect.top || e.clientY > rect.bottom) {
    closeModal();
  }
});

// Escape key
modal.addEventListener('cancel', () => { playModalCloseSound(); });


/* ---------- TOAST NOTIFICATION ---------- */
const toastEl = document.getElementById('toast');
let toastTimer = null;

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  playToastSound();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}


/* ---------- CLIPBOARD COPY ---------- */
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();   // ← prevent click bubbling to parent <a> link
    e.preventDefault();    // ← prevent any default button behavior

    const text = btn.dataset.copy;
    const original = btn.textContent;

    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      // Fallback for non-HTTPS or older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    // Visual feedback on the button
    btn.textContent = '✓';
    btn.style.color = '#22ff88';
    btn.style.borderColor = '#22ff88';
    setTimeout(() => {
      btn.textContent = original;
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 1800);

    showToast(`✓ Copied: ${text}`);
    playClickSound();
  });
  btn.addEventListener('mouseenter', playHoverSound);
});



/* ---------- CONTACT FORM ---------- */
const contactForm = document.getElementById('contact-form');
const formFeedback = document.getElementById('form-feedback');
const formSubmit = document.getElementById('form-submit');

if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = contactForm.querySelector('#name').value.trim();
    const email = contactForm.querySelector('#email').value.trim();
    const message = contactForm.querySelector('#message').value.trim();

    if (!name || !email || !message) {
      formFeedback.textContent = '⚠ Please fill in all required fields.';
      formFeedback.style.color = '#ff6b35';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      formFeedback.textContent = '⚠ Please enter a valid email address.';
      formFeedback.style.color = '#ff6b35';
      return;
    }

    // Simulate submission (replace with real backend/emailJS/formspree)
    formSubmit.disabled = true;
    formSubmit.textContent = 'TRANSMITTING...';
    formFeedback.textContent = '';
    playTone(330, 'sine', 0.1, 0.08);

    setTimeout(() => {
      formFeedback.textContent = '✓ TRANSMISSION RECEIVED — I will respond within 24 hours!';
      formFeedback.style.color = '#00f0ff';
      formSubmit.textContent = 'SEND TRANSMISSION';
      formSubmit.disabled = false;
      contactForm.reset();
      showToast('✓ Message sent successfully!');
    }, 1500);
  });
}


/* ---------- BACK TO TOP ---------- */
const backToTop = document.getElementById('back-to-top');
if (backToTop) {
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    playClickSound();
  });
}


/* ---------- SMOOTH HOVER SOUNDS ON BUTTONS ---------- */
document.querySelectorAll('.btn-primary, .btn-secondary, .cert-card, .engine-badge, .tech-badge').forEach(el => {
  el.addEventListener('mouseenter', playHoverSound);
});


/* ---------- TECH BADGE RANDOM GLOW CYCLE ---------- */
const techBadges = document.querySelectorAll('.tech-badge');
function cycleBadgeGlow() {
  if (techBadges.length === 0) return;
  const idx = Math.floor(Math.random() * techBadges.length);
  const badge = techBadges[idx];
  badge.style.color = '#00f0ff';
  badge.style.borderColor = 'rgba(0,240,255,0.5)';
  badge.style.background = 'rgba(0,240,255,0.1)';
  setTimeout(() => {
    badge.style.color = '';
    badge.style.borderColor = '';
    badge.style.background = '';
  }, 700);
}
setInterval(cycleBadgeGlow, 600);


/* ---------- CURSOR GLOW EFFECT ---------- */
const cursorGlow = document.createElement('div');
cursorGlow.style.cssText = `
  position: fixed; pointer-events: none; z-index: 9998;
  width: 320px; height: 320px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0,240,255,0.04) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  transition: transform 0.1s linear;
  top: 0; left: 0;
`;
document.body.appendChild(cursorGlow);
window.addEventListener('mousemove', e => {
  cursorGlow.style.left = e.clientX + 'px';
  cursorGlow.style.top = e.clientY + 'px';
}, { passive: true });


/* ---------- INTERSECTION OBSERVER — SECTION FADE IN ---------- */
const sections = document.querySelectorAll('.section');
const sectionFadeStyle = document.createElement('style');
sectionFadeStyle.textContent = `
  .section { opacity: 0; transform: translateY(30px); transition: opacity 0.7s ease, transform 0.7s ease; }
  .section.in-view { opacity: 1; transform: translateY(0); }
`;
document.head.appendChild(sectionFadeStyle);

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      sectionObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
sections.forEach(s => sectionObserver.observe(s));


/* ---------- HERO is always visible ---------- */
const heroSection = document.getElementById('hero');
if (heroSection) {
  heroSection.classList.add('in-view');
  heroSection.style.opacity = '1';
  heroSection.style.transform = 'none';
}


/* ---------- INITIAL PAGE LOAD TRANSITION ---------- */
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.5s ease';
window.addEventListener('load', () => {
  document.body.style.opacity = '1';
});


/* ---------- THEME TOGGLE (LIGHT / DARK) ---------- */
(function initTheme() {
  const html = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const icon = document.getElementById('theme-icon');

  // When IN dark mode → show ☀ (offer to switch to light)
  // When IN light mode → show ☾ (offer to switch to dark)
  const ICONS  = { dark: '☀', light: '☾' };
  const LABELS = { dark: 'Switch to light mode', light: 'Switch to dark mode' };

  // Apply saved preference immediately on load
  const saved = localStorage.getItem('mv-theme') || 'dark';
  html.setAttribute('data-theme', saved);
  icon.textContent = ICONS[saved];
  btn.setAttribute('aria-label', LABELS[saved]);

  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';

    // Trigger spin animation
    btn.classList.add('spinning');
    setTimeout(() => btn.classList.remove('spinning'), 450);

    // Swap theme at mid-spin (when icon is invisible)
    setTimeout(() => {
      html.setAttribute('data-theme', next);
      icon.textContent = ICONS[next];
      btn.setAttribute('aria-label', LABELS[next]);
      localStorage.setItem('mv-theme', next);
    }, 200);

    playClickSound();
    showToast(next === 'light' ? '\u2600 Light Mode — Sunlit Studio' : '\u263e Dark Mode — Decima Engine');
  });
})();
