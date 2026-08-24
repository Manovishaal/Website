/* ============================================================
   DECIMA DEFENDER — Retro Space Shooter
   Portfolio Mini-Game by Manovishaal D
   ============================================================ */
'use strict';

(function GameModule() {

const CFG = {
  W: 480, H: 580,
  PLAYER_SPD: 270,
  BULLET_SPD: 520,
  ENEMY_BULLET_SPD: 160,
  FIRE_RATE: 220,
  RAPID_RATE: 85,
  POWERUP_DUR: 5500,
  C: {
    bg:     '#05060b',
    grid:   'rgba(0,240,255,0.035)',
    cyan:   '#00f0ff',
    ember:  '#ff6b35',
    gold:   '#f5c518',
    green:  '#22ff88',
    purple: '#c084fc',
    white:  '#ffffff',
  }
};

const rand  = (a, b) => Math.random() * (b - a) + a;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ---- Audio Synth for Game ---- */
let gAudioCtx = null;
function getGameAudio() {
  if (!gAudioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) gAudioCtx = new AC();
  }
  if (gAudioCtx && gAudioCtx.state === 'suspended') {
    gAudioCtx.resume();
  }
  return gAudioCtx;
}

function sfxLaser() {
  const ctx = getGameAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.08);
  } catch (_) {}
}

function sfxExplode(isBig = false) {
  const ctx = getGameAudio();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const now = ctx.currentTime;
    const dur = isBig ? 0.28 : 0.16;
    osc.frequency.setValueAtTime(isBig ? 140 : 200, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + dur);
    gain.gain.setValueAtTime(isBig ? 0.18 : 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + dur);
  } catch (_) {}
}

function sfxPowerup() {
  const ctx = getGameAudio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [440, 554, 659, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.045;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.08);
    });
  } catch (_) {}
}

function sfxLevelUp() {
  const ctx = getGameAudio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.07;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.15);
    });
  } catch (_) {}
}

function sfxGameOver() {
  const ctx = getGameAudio();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.45);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.45);
  } catch (_) {}
}

/* ---- Particle ---- */
class Particle {
  constructor(x, y, color, vx, vy, life, size) {
    Object.assign(this, { x, y, color, vx, vy, life, maxLife: life, size });
  }
  update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.vy += 80 * dt; this.life -= dt; }
  draw(ctx) {
    const a = clamp(this.life / this.maxLife, 0, 1);
    ctx.globalAlpha = a; ctx.fillStyle = this.color;
    const s = this.size * a; ctx.fillRect(this.x - s / 2, this.y - s / 2, s, s);
  }
  get dead() { return this.life <= 0; }
}

/* ---- Bullet ---- */
class Bullet {
  constructor(x, y, vy, color, w = 3, h = 13) {
    Object.assign(this, { x, y, vy, color, w, h });
  }
  update(dt) { this.y += this.vy * dt; }
  draw(ctx) {
    ctx.shadowColor = this.color; ctx.shadowBlur = 12; ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
    ctx.shadowBlur = 0;
  }
  get dead() { return this.y < -20 || this.y > CFG.H + 20; }
}

/* ---- PowerUp ---- */
const PU_META = {
  SHIELD: { color: '#22ff88', icon: '⊕', label: '⊕ SHIELD ACTIVE' },
  RAPID:  { color: '#00f0ff', icon: '⚡', label: '⚡ RAPID FIRE' },
  TRIPLE: { color: '#f5c518', icon: '◈', label: '◈ TRIPLE SHOT' },
};
const PU_KEYS = Object.keys(PU_META);
class PowerUp {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.type = PU_KEYS[Math.floor(Math.random() * PU_KEYS.length)];
    this.meta = PU_META[this.type]; this.vy = 75; this.t = 0; this.r = 13;
  }
  update(dt) { this.y += this.vy * dt; this.t += dt * 3; }
  draw(ctx) {
    const col = this.meta.color, pulse = Math.sin(this.t) * 0.25 + 0.75;
    ctx.globalAlpha = pulse; ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.shadowColor = col; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillStyle = col;
    ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.meta.icon, this.x, this.y); ctx.shadowBlur = 0; ctx.textBaseline = 'alphabetic';
  }
  get dead() { return this.y > CFG.H + 30; }
  hits(px, py, pr) { return Math.hypot(this.x - px, this.y - py) < this.r + pr; }
}

/* ---- Enemy ---- */
const ENEMY_TYPES = [
  { name: 'BUG',    color: '#ef4444', hp: 1, pts: 10, size: 17, spd: 1.0, shoots: false, pat: 'straight' },
  { name: 'VIRUS',  color: '#06b6d4', hp: 1, pts: 15, size: 13, spd: 1.7, shoots: false, pat: 'sine' },
  { name: 'GLITCH', color: '#ff6b35', hp: 2, pts: 25, size: 15, spd: 0.9, shoots: false, pat: 'zigzag' },
  { name: 'CRASH',  color: '#c084fc', hp: 3, pts: 50, size: 19, spd: 0.7, shoots: true,  pat: 'straight' },
];
class Enemy {
  constructor(x, y, type, baseSpeed) {
    Object.assign(this, type); this.x = x; this.y = y;
    this.maxHp = this.hp; this.vy = baseSpeed * this.spd;
    this.t = rand(0, Math.PI * 2); this.fireTimer = rand(2.5, 5); this.hitFlash = 0;
  }
  update(dt, W) {
    this.t += dt * 2; this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.y += this.vy * dt;
    if (this.pat === 'zigzag') this.x += Math.sin(this.t * 1.6) * this.vy * 1.3 * dt;
    else if (this.pat === 'sine') this.x += Math.sin(this.t * 2.8) * 2;
    this.x = clamp(this.x, this.size + 4, W - this.size - 4);
    if (this.shoots) {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.fireTimer = rand(2.5, 5);
        return new Bullet(this.x, this.y + this.size, CFG.ENEMY_BULLET_SPD, this.color, 3, 10);
      }
    }
    return null;
  }
  draw(ctx) {
    const col = this.hitFlash > 0 ? '#ffffff' : this.color;
    ctx.strokeStyle = col; ctx.fillStyle = col + '2a'; ctx.lineWidth = 2;
    ctx.shadowColor = col; ctx.shadowBlur = this.hitFlash > 0 ? 22 : 8;
    const s = this.size; ctx.beginPath();
    if (this.name === 'BUG') {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        i ? ctx.lineTo(this.x + s * Math.cos(a), this.y + s * Math.sin(a))
          : ctx.moveTo(this.x + s * Math.cos(a), this.y + s * Math.sin(a));
      }
      ctx.closePath();
    }
    else if (this.name === 'VIRUS') { ctx.arc(this.x, this.y, s, 0, Math.PI * 2); }
    else if (this.name === 'GLITCH') { ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.t * 0.6); ctx.rect(-s, -s, s * 2, s * 2); ctx.restore(); }
    else if (this.name === 'CRASH') { ctx.moveTo(this.x, this.y - s * 1.3); ctx.lineTo(this.x + s, this.y); ctx.lineTo(this.x, this.y + s * 1.3); ctx.lineTo(this.x - s, this.y); ctx.closePath(); }
    ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
    if (this.maxHp > 1) {
      const bw = s * 2.4, bh = 3, bx = this.x - bw / 2, by = this.y - s - 9;
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = col; ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
    }
    ctx.fillStyle = col; ctx.font = '7px monospace'; ctx.textAlign = 'center'; ctx.fillText(this.name, this.x, this.y - s - 12);
  }
  takeDamage() { this.hp--; this.hitFlash = 0.1; return this.hp <= 0; }
  get dead() { return this.y > CFG.H + 40; }
  hits(bx, by) { return Math.hypot(bx - this.x, by - this.y) < this.size; }
}

/* ============================================================
   DECIMA DEFENDER GAME ENGINE
   ============================================================ */
class DecimaDefender {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.W = CFG.W; this.H = CFG.H;
    this.state = 'IDLE'; this.score = 0; this.hiScore = parseInt(localStorage.getItem('decima-hi') || '0');
    this.lives = 3; this.level = 1; this.combo = 0; this.comboT = 0; this.shake = 0; this.flash = null;
    this.player = null; this.bullets = []; this.eBullets = []; this.enemies = []; this.particles = []; this.powerUps = [];
    this.stars = []; this.fireTimer = 0; this.waveTimer = 1.2; this.waveInterval = 3.5; this.waveCount = 0;
    this.lastTime = null; this.animId = null; this.destroyed = false;
    this.keys = new Set(); this.shooting = false; this.touchX = null;
    this._initStars(); this._bind(); this._tick(0);
  }
  _initStars() {
    this.stars = Array.from({ length: 65 }, () => ({
      x: rand(0, CFG.W), y: rand(0, CFG.H), size: rand(0.5, 2), speed: rand(18, 60), alpha: rand(0.3, 1)
    }));
  }
  _initPlayer() {
    this.player = { x: this.W / 2, y: this.H - 72, w: 28, h: 34, r: 14, pulse: 0, rapid: 0, triple: 0, invincible: 0 };
  }
  _bind() {
    this._kd = (e) => {
      this.keys.add(e.code);
      if (e.code === 'Space') { e.preventDefault(); this.shooting = true; }
      if ((e.code === 'KeyP' || e.code === 'Escape') && this.state === 'PLAYING') this.state = 'PAUSED';
      else if (e.code === 'Escape' && this.state === 'PAUSED') { this.state = 'PLAYING'; this.lastTime = null; }
      if ((e.code === 'Enter' || e.code === 'Space') && this.state === 'IDLE') this.startGame();
      if (e.code === 'Enter' && this.state === 'GAMEOVER') this.startGame();
    };
    this._ku = (e) => { this.keys.delete(e.code); if (e.code === 'Space') this.shooting = false; };
    this._tc = (e) => {
      e.preventDefault();
      if (this.state === 'IDLE' || this.state === 'GAMEOVER') {
        this.startGame();
        return;
      }
      if (e.touches && e.touches[0]) {
        const t = e.touches[0], r = this.canvas.getBoundingClientRect();
        this.touchX = (t.clientX - r.left) * (CFG.W / r.width);
        this.shooting = true;
      }
    };
    this._te = () => { this.touchX = null; this.shooting = false; };
    this._cl = () => {
      if (this.state === 'IDLE') this.startGame();
      if (this.state === 'GAMEOVER') this.startGame();
    };
    window.addEventListener('keydown', this._kd); window.addEventListener('keyup', this._ku);
    this.canvas.addEventListener('touchstart', this._tc, { passive: false });
    this.canvas.addEventListener('touchmove', this._tc, { passive: false });
    this.canvas.addEventListener('touchend', this._te); this.canvas.addEventListener('click', this._cl);
  }
  destroy() {
    this.destroyed = true; if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('keydown', this._kd); window.removeEventListener('keyup', this._ku);
    this.canvas.removeEventListener('touchstart', this._tc); this.canvas.removeEventListener('touchmove', this._tc);
    this.canvas.removeEventListener('touchend', this._te); this.canvas.removeEventListener('click', this._cl);
  }
  startGame() {
    this.score = 0; this.lives = 3; this.level = 1; this.combo = 0; this.comboT = 0;
    this.waveCount = 0; this.waveTimer = 1.2; this.waveInterval = 3.5;
    this.bullets = []; this.eBullets = []; this.enemies = []; this.particles = []; this.powerUps = [];
    this.fireTimer = 0; this.flash = null; this._initPlayer(); this.state = 'PLAYING';
    sfxLevelUp();
  }
  _tick(ts) {
    if (this.destroyed) return;
    const dt = this.lastTime != null ? Math.min((ts - this.lastTime) / 1000, 0.05) : 0.016;
    this.lastTime = ts;
    this.stars.forEach(s => { s.y += s.speed * dt; if (s.y > this.H) { s.y = 0; s.x = rand(0, this.W); } });
    if (this.state === 'PLAYING') this._update(dt);
    if (this.state === 'GAMEOVER') { this.particles.forEach(p => p.update(dt)); this.particles = this.particles.filter(p => !p.dead); }
    this._render();
    this.animId = requestAnimationFrame(t => this._tick(t));
  }
  _update(dt) {
    const p = this.player;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) p.x -= CFG.PLAYER_SPD * dt;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) p.x += CFG.PLAYER_SPD * dt;
    if (this.touchX != null) { const dx = this.touchX - p.x; p.x += Math.sign(dx) * Math.min(Math.abs(dx), CFG.PLAYER_SPD * dt); }
    p.x = clamp(p.x, p.w, this.W - p.w); p.pulse += dt * 3;
    if (p.rapid > 0) p.rapid -= dt * 1000;
    if (p.triple > 0) p.triple -= dt * 1000;
    if (p.invincible > 0) p.invincible -= dt * 1000;
    this.shake = Math.max(0, this.shake - dt * 10);
    if (this.combo > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; }
    if (this.flash) { this.flash.t -= dt; if (this.flash.t <= 0) this.flash = null; }
    
    // Firing
    this.fireTimer = Math.max(0, this.fireTimer - dt * 1000);
    const rate = p.rapid > 0 ? CFG.RAPID_RATE : CFG.FIRE_RATE;
    if ((this.shooting || this.keys.has('Space')) && this.fireTimer <= 0) {
      this.fireTimer = rate;
      this._spawnBullets();
      sfxLaser();
    }

    // Waves
    this.waveTimer -= dt;
    if (this.waveTimer <= 0 && this.enemies.length < 14) {
      this._spawnWave(); this.waveTimer = this.waveInterval;
    }

    this.bullets.forEach(b => b.update(dt)); this.eBullets.forEach(b => b.update(dt));
    this.bullets = this.bullets.filter(b => !b.dead); this.eBullets = this.eBullets.filter(b => !b.dead);
    const newEB = [];
    this.enemies.forEach(en => { const b = en.update(dt, this.W); if (b) newEB.push(b); });
    this.eBullets.push(...newEB); this.enemies = this.enemies.filter(en => !en.dead);
    this.powerUps.forEach(pu => pu.update(dt)); this.powerUps = this.powerUps.filter(pu => !pu.dead);
    this.particles.forEach(pt => pt.update(dt)); this.particles = this.particles.filter(pt => !pt.dead);

    // Collisions
    const dB = new Set(), dE = new Set();
    this.bullets.forEach((b, bi) => this.enemies.forEach((en, ei) => {
      if (dE.has(ei)) return;
      if (en.hits(b.x, b.y)) {
        dB.add(bi);
        if (en.takeDamage()) {
          dE.add(ei);
          this._explode(en.x, en.y, en.color);
          sfxExplode(en.maxHp > 1);
          const pts = Math.round(en.pts * (1 + this.combo * 0.5));
          this.score += pts;
          if (this.score > this.hiScore) this.hiScore = this.score;
          this.combo++; this.comboT = 2;
          if (Math.random() < 0.14) this.powerUps.push(new PowerUp(en.x, en.y));
          this._setFlash(`+${pts}`, en.color, 0.7);
        }
      }
    }));
    this.bullets = this.bullets.filter((_, i) => !dB.has(i)); this.enemies = this.enemies.filter((_, i) => !dE.has(i));

    if (p.invincible <= 0) {
      this.eBullets = this.eBullets.filter(b => {
        if (Math.hypot(b.x - p.x, b.y - p.y) < p.r + 5) { this._hitPlayer(); return false; }
        return true;
      });
      this.enemies = this.enemies.filter(en => {
        if (Math.hypot(en.x - p.x, en.y - p.y) < p.r + en.size * 0.75) {
          this._explode(en.x, en.y, en.color); this._hitPlayer(); return false;
        }
        return true;
      });
    }

    this.powerUps = this.powerUps.filter(pu => {
      if (pu.hits(p.x, p.y, p.r)) { this._collectPU(pu); return false; }
      return true;
    });

    const lv = Math.floor(this.score / 350) + 1;
    if (lv > this.level) {
      this.level = lv;
      this.waveInterval = Math.max(1.4, 3.5 - this.level * 0.18);
      this._setFlash(`⬆ LEVEL ${this.level}`, CFG.C.gold, 1.8);
      sfxLevelUp();
    }
  }
  _spawnBullets() {
    const p = this.player, tip = p.y - p.h / 2;
    if (p.triple > 0) {
      this.bullets.push(new Bullet(p.x, tip, -CFG.BULLET_SPD, CFG.C.cyan));
      this.bullets.push(new Bullet(p.x - 14, tip + 8, -CFG.BULLET_SPD, CFG.C.cyan));
      this.bullets.push(new Bullet(p.x + 14, tip + 8, -CFG.BULLET_SPD, CFG.C.cyan));
    } else {
      this.bullets.push(new Bullet(p.x, tip, -CFG.BULLET_SPD, CFG.C.cyan));
    }
    for (let i = 0; i < 5; i++) {
      this.particles.push(new Particle(p.x + rand(-6, 6), tip, CFG.C.cyan, rand(-50, 50), rand(-100, -20), 0.18, rand(2, 5)));
    }
  }
  _spawnWave() {
    this.waveCount++; const baseSpeed = 52 + this.level * 9; const count = Math.min(3 + Math.floor(this.level * 0.7), 8);
    const pool = [ENEMY_TYPES[0]];
    if (this.level >= 2) pool.push(ENEMY_TYPES[1]);
    if (this.level >= 3) pool.push(ENEMY_TYPES[2]);
    if (this.level >= 5) pool.push(ENEMY_TYPES[3]);
    for (let i = 0; i < count; i++) {
      const type = pool[Math.floor(Math.random() * pool.length)];
      this.enemies.push(new Enemy(rand(28, this.W - 28), rand(-90, -20), type, baseSpeed));
    }
  }
  _explode(x, y, color) {
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2, s = rand(60, 220);
      this.particles.push(new Particle(x, y, color, Math.cos(a) * s, Math.sin(a) * s - rand(0, 80), rand(0.4, 1), rand(3, 8)));
    }
    this.shake = 0.35;
  }
  _hitPlayer() {
    this.lives--; this.shake = 0.55; this.player.invincible = 1800;
    this._explode(this.player.x, this.player.y, CFG.C.ember);
    sfxExplode(true);
    this._setFlash('— HIT —', CFG.C.ember, 1);
    if (this.lives <= 0) {
      localStorage.setItem('decima-hi', this.hiScore);
      this.state = 'GAMEOVER';
      sfxGameOver();
      if (window.LB) window.LB.submitScore(this.score, this.level);
    }
  }
  _collectPU(pu) {
    const p = this.player;
    if (pu.type === 'SHIELD') p.invincible = CFG.POWERUP_DUR;
    if (pu.type === 'RAPID')  p.rapid = CFG.POWERUP_DUR;
    if (pu.type === 'TRIPLE') p.triple = CFG.POWERUP_DUR;
    sfxPowerup();
    this._setFlash(pu.meta.label, pu.meta.color, 2);
  }
  _setFlash(text, color, dur = 1.5) { this.flash = { text, color, t: dur, dur }; }
  _txt(ctx, text, x, y, font, color, glow = 0, align = 'center') {
    ctx.fillStyle = color; ctx.font = font; ctx.textAlign = align;
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
    ctx.fillText(text, x, y); ctx.shadowBlur = 0;
  }

  _render() {
    const ctx = this.ctx, W = this.W, H = this.H;
    ctx.save();
    if (this.shake > 0) ctx.translate(rand(-5, 5) * this.shake, rand(-5, 5) * this.shake);
    ctx.fillStyle = CFG.C.bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = CFG.C.grid; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    this.stars.forEach(s => { ctx.globalAlpha = s.alpha; ctx.fillStyle = '#fff'; ctx.fillRect(s.x, s.y, s.size, s.size); });
    ctx.globalAlpha = 1;
    if (this.state === 'IDLE') { this._renderIdle(ctx, W, H); ctx.restore(); return; }
    if (this.state === 'GAMEOVER') { this._renderGameOver(ctx, W, H); ctx.restore(); return; }
    this.powerUps.forEach(pu => pu.draw(ctx));
    this.eBullets.forEach(b => b.draw(ctx));
    this.bullets.forEach(b => b.draw(ctx));
    this.enemies.forEach(en => en.draw(ctx));
    this.particles.forEach(pt => { ctx.globalAlpha = 1; pt.draw(ctx); });
    ctx.globalAlpha = 1;
    this._renderPlayer(ctx);
    this._renderHUD(ctx, W, H);
    if (this.flash) {
      const a = clamp(this.flash.t / this.flash.dur, 0, 1);
      ctx.globalAlpha = Math.min(a * 2, 1); ctx.fillStyle = this.flash.color; ctx.font = 'bold 17px monospace';
      ctx.textAlign = 'center'; ctx.shadowColor = this.flash.color; ctx.shadowBlur = 18;
      ctx.fillText(this.flash.text, W / 2, H / 2 - 50); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    }
    if (this.state === 'PAUSED') {
      ctx.fillStyle = 'rgba(5,6,11,0.78)'; ctx.fillRect(0, 0, W, H);
      this._txt(ctx, 'PAUSED', W / 2, H / 2 - 20, 'bold 30px monospace', CFG.C.cyan, 22);
      this._txt(ctx, 'P / ESC to resume', W / 2, H / 2 + 20, '12px monospace', 'rgba(255,255,255,0.5)', 0);
    }
    ctx.restore();
  }

  _renderPlayer(ctx) {
    const p = this.player;
    if (p.invincible > 0 && Math.floor(p.invincible / 120) % 2 === 0) return;
    const thrust = Math.sin(p.pulse) * 5;
    ctx.shadowColor = CFG.C.cyan; ctx.shadowBlur = 18;
    if (p.triple > 0) { ctx.strokeStyle = CFG.C.gold; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 9, 0, Math.PI * 2); ctx.stroke(); }
    if (p.rapid > 0) { ctx.strokeStyle = CFG.C.cyan; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    ctx.fillStyle = CFG.C.cyan; ctx.beginPath(); ctx.moveTo(p.x, p.y - p.h / 2); ctx.lineTo(p.x + p.w / 2, p.y + p.h / 2); ctx.lineTo(p.x - p.w / 2, p.y + p.h / 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y - 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = CFG.C.ember; ctx.fillStyle = CFG.C.ember;
    ctx.beginPath(); ctx.moveTo(p.x - 9, p.y + p.h / 2); ctx.lineTo(p.x + 9, p.y + p.h / 2); ctx.lineTo(p.x, p.y + p.h / 2 + 15 + thrust); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
  }

  _renderHUD(ctx, W, H) {
    ctx.strokeStyle = 'rgba(0,240,255,0.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(W, 30); ctx.stroke();
    this._txt(ctx, `SCORE  ${String(this.score).padStart(6, '0')}`, 10, 21, 'bold 13px monospace', CFG.C.cyan, 8, 'left');
    this._txt(ctx, `HI  ${String(this.hiScore).padStart(6, '0')}`, W / 2, 21, 'bold 13px monospace', CFG.C.gold, 8, 'center');
    this._txt(ctx, `LVL ${this.level}`, W - 10, 21, 'bold 13px monospace', CFG.C.ember, 8, 'right');
    for (let i = 0; i < this.lives; i++) {
      const lx = 12 + i * 22, ly = 44;
      ctx.fillStyle = CFG.C.cyan; ctx.shadowColor = CFG.C.cyan; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(lx + 7, ly - 6); ctx.lineTo(lx + 14, ly + 6); ctx.lineTo(lx, ly + 6); ctx.closePath(); ctx.fill();
    }
    ctx.shadowBlur = 0;
    if (this.combo > 1) this._txt(ctx, `\u00D7${this.combo} COMBO`, W - 10, 44, 'bold 12px monospace', CFG.C.gold, 10, 'right');
    const p = this.player; let px = 10;
    if (p.rapid > 0) { this._txt(ctx, `\u26A1${(p.rapid / 1000).toFixed(1)}s`, px, H - 10, '10px monospace', CFG.C.cyan, 0, 'left'); px += 58; }
    if (p.triple > 0) { this._txt(ctx, `\u25C8${(p.triple / 1000).toFixed(1)}s`, px, H - 10, '10px monospace', CFG.C.gold, 0, 'left'); px += 58; }
    if (p.invincible > 0) this._txt(ctx, `\u2295${(p.invincible / 1000).toFixed(1)}s`, px, H - 10, '10px monospace', '#22ff88', 0, 'left');
  }

  _renderIdle(ctx, W, H) {
    const blink = Math.floor(Date.now() / 600) % 2;
    this._txt(ctx, 'DECIMA', W / 2, H / 2 - 80, 'bold 30px monospace', CFG.C.cyan, 28);
    this._txt(ctx, 'DEFENDER', W / 2, H / 2 - 46, 'bold 30px monospace', CFG.C.ember, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText('A mini-game by MANOVISHAAL D', W / 2, H / 2 - 16);
    ctx.fillStyle = CFG.C.cyan; ctx.font = '11px monospace';
    ctx.fillText('\u2190 \u2192 / A D   to move', W / 2, H / 2 + 14);
    ctx.fillText('SPACE / Click   to fire', W / 2, H / 2 + 32);
    ctx.fillText('P / ESC   to pause', W / 2, H / 2 + 50);
    if (blink) this._txt(ctx, '\u25B6  ENTER or CLICK to start', W / 2, H / 2 + 85, 'bold 13px monospace', CFG.C.gold, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '9px monospace'; ctx.fillText('BUG 10pts  \u00B7  VIRUS 15pts  \u00B7  GLITCH 25pts  \u00B7  CRASH 50pts', W / 2, H - 18);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.font = '8px monospace'; ctx.fillText('\u2605 Konami Code: \u2191\u2191\u2193\u2193\u2190\u2192\u2190\u2192BA  to open anywhere', W / 2, H - 6);
  }

  _renderGameOver(ctx, W, H) {
    const blink = Math.floor(Date.now() / 700) % 2;
    ctx.fillStyle = 'rgba(5,6,11,0.88)'; ctx.fillRect(0, 0, W, H);
    this._txt(ctx, 'GAME OVER', W / 2, H / 2 - 75, 'bold 34px monospace', CFG.C.ember, 30);
    this._txt(ctx, `FINAL SCORE  ${this.score}`, W / 2, H / 2 - 28, '14px monospace', CFG.C.cyan, 0);
    this._txt(ctx, `HIGH SCORE   ${this.hiScore}`, W / 2, H / 2 - 4, '14px monospace', CFG.C.gold, 0);
    this._txt(ctx, `LEVEL REACHED  ${this.level}`, W / 2, H / 2 + 20, '12px monospace', 'rgba(255,255,255,0.45)', 0);
    if (this.score > 0 && this.score >= this.hiScore) this._txt(ctx, '\u2605  NEW HIGH SCORE!  \u2605', W / 2, H / 2 + 48, 'bold 13px monospace', CFG.C.gold, 16);
    this.particles.forEach(pt => { ctx.globalAlpha = 1; pt.draw(ctx); }); ctx.globalAlpha = 1;
    if (blink) this._txt(ctx, '\u25B6  ENTER or CLICK to retry', W / 2, H / 2 + 80, 'bold 12px monospace', CFG.C.cyan, 10);
  }
}

/* ---- Launcher ---- */
let instance = null;

function _launchGame() {
  const canvas = document.getElementById('game-canvas');
  canvas.width = CFG.W; canvas.height = CFG.H;
  if (instance) instance.destroy();
  instance = new DecimaDefender(canvas);
}

function _escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function _updateCallsignBadge() {
  const badge = document.getElementById('game-callsign-badge');
  const nameEl = document.getElementById('game-callsign-name');
  const name = window.LB ? window.LB.getUsername() : null;
  if (!badge || !nameEl) return;
  if (name) { nameEl.textContent = name; badge.style.display = 'inline-flex'; }
  else { badge.style.display = 'none'; }
}

function _showCallsignOverlay() {
  const overlay = document.getElementById('callsign-overlay');
  const input = document.getElementById('callsign-input');
  if (!overlay) { _launchGame(); return; }
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  if (input) {
    input.value = (window.LB && window.LB.getUsername()) || '';
    setTimeout(() => input.focus(), 50);
  }
}

function _hideCallsignOverlay() {
  const overlay = document.getElementById('callsign-overlay');
  if (overlay) { overlay.classList.remove('active'); overlay.setAttribute('aria-hidden', 'true'); }
}

function _showLeaderboardOverlay() {
  const overlay = document.getElementById('leaderboard-overlay');
  const list = document.getElementById('leaderboard-list');
  if (!overlay || !list) return;
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  list.innerHTML = '<p class="leaderboard-status">Loading...</p>';
  if (!window.LB) { list.innerHTML = '<p class="leaderboard-status">Leaderboard unavailable.</p>'; return; }
  window.LB.fetchLeaderboard(10).then(({ data, configured, error }) => {
    if (!configured) {
      list.innerHTML = '<p class="leaderboard-status">Global leaderboard isn’t connected yet — see leaderboard.js.</p>';
      return;
    }
    if (error) { list.innerHTML = '<p class="leaderboard-status">Couldn’t load scores right now.</p>'; return; }
    if (!data.length) { list.innerHTML = '<p class="leaderboard-status">No scores yet — be the first!</p>'; return; }
    list.innerHTML = data.map((row, i) => `
      <div class="leaderboard-row">
        <span class="lb-rank">#${i + 1}</span>
        <span class="lb-name">${_escapeHtml(row.Username || 'GUEST')}</span>
        <span class="lb-score">${String(row.Score).padStart(6, '0')}</span>
        <span class="lb-level">LVL ${row.Level || 1}</span>
      </div>
    `).join('');
  });
}

function _hideLeaderboardOverlay() {
  const overlay = document.getElementById('leaderboard-overlay');
  if (overlay) { overlay.classList.remove('active'); overlay.setAttribute('aria-hidden', 'true'); }
}

window.openDecimaDefender = function () {
  const modal = document.getElementById('game-modal');
  if (!modal.open) modal.showModal();
  _updateCallsignBadge();
  if (window.LB && window.LB.getUsername()) _launchGame();
  else _showCallsignOverlay();
};

window.closeDecimaDefender = function () {
  if (instance) { instance.destroy(); instance = null; }
  _hideCallsignOverlay();
  _hideLeaderboardOverlay();
  const modal = document.getElementById('game-modal');
  if (modal && modal.open) modal.close();
};

/* Wire up the callsign capture + global leaderboard UI once, at load time */
(function _wireLeaderboardUI() {
  const submitBtn = document.getElementById('callsign-submit');
  const skipBtn = document.getElementById('callsign-skip');
  const input = document.getElementById('callsign-input');
  const changeBtn = document.getElementById('game-callsign-change');
  const lbBtn = document.getElementById('game-leaderboard-btn');
  const lbClose = document.getElementById('leaderboard-close');

  function confirmCallsign() {
    const name = window.LB && window.LB.saveUsername(input ? input.value : '');
    if (!name) {
      if (input) { input.placeholder = 'Enter at least 1 character...'; input.focus(); }
      return;
    }
    _updateCallsignBadge();
    _hideCallsignOverlay();
    if (!instance) _launchGame();
  }

  if (submitBtn) submitBtn.addEventListener('click', confirmCallsign);
  if (input) input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); confirmCallsign(); }
  });
  if (skipBtn) skipBtn.addEventListener('click', () => {
    if (window.LB) window.LB.saveUsername(window.LB.getUsername() || window.LB.randomGuestName());
    _updateCallsignBadge();
    _hideCallsignOverlay();
    if (!instance) _launchGame();
  });
  if (changeBtn) changeBtn.addEventListener('click', () => _showCallsignOverlay());
  if (lbBtn) lbBtn.addEventListener('click', () => _showLeaderboardOverlay());
  if (lbClose) lbClose.addEventListener('click', () => _hideLeaderboardOverlay());
})();

/* ---- Konami Code Easter Egg ---- */
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
let ki = 0;
document.addEventListener('keydown', e => {
  if (e.code === KONAMI[ki]) {
    if (++ki === KONAMI.length) {
      ki = 0;
      window.openDecimaDefender();
    }
  } else {
    ki = 0;
  }
});

})();