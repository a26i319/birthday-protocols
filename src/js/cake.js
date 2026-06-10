/* ============================================================
   BIRTHDAY PROTOCOL — cake.js
   Pixel-art birthday cake canvas, candle interaction,
   particle effect, wish confirmation.
   ============================================================ */

'use strict';

const CakeScreen = (() => {

  // ── Canvas config ─────────────────────────────────────────
  const W = 300;
  const H = 320;

  // ── Color palette (matches CSS vars via JS) ───────────────
  const C = {
    bg:        '#000000',
    panel:     '#0a0a0a',
    accent:    '#1DCD9F',
    accentDim: '#169976',
    border:    '#222222',
    cake1:     '#2a1a0a',   // dark chocolate layer
    cake2:     '#3d2510',   // mid brown
    icing:     '#1DCD9F',   // accent icing
    icingDim:  '#0d6b52',
    plate:     '#111111',
    candle:    '#169976',
    wax:       '#0a4433',
    flame:     '#FFD166',
    flameTip:  '#FF9F1C',
    particle:  '#1DCD9F',
  };

  // ── Cake geometry ─────────────────────────────────────────
  const CAKE = {
    // Bottom tier
    b: { x: 40, y: 210, w: 220, h: 60 },
    // Top tier
    t: { x: 70, y: 145, w: 160, h: 60 },
    // Plate
    p: { x: 20, y: 268, w: 260, h: 16 },
    // Candle (center of top tier)
    candle: { x: 142, y: 98, w: 16, h: 50 },
  };

  // ── State ─────────────────────────────────────────────────
  let canvas, ctx;
  let candleLit    = true;
  let flickerAngle = 0;
  let particles    = [];
  let rafId        = null;
  let promptEl, hintEl, statusEl;

  // ── Init ──────────────────────────────────────────────────
  function init() {
    canvas    = document.getElementById('cake-canvas');
    promptEl  = document.getElementById('cake-prompt');
    hintEl    = document.getElementById('cake-hint');
    statusEl  = document.getElementById('cake-status');

    if (!canvas) { console.error('[Cake] Canvas missing.'); return; }

    ctx = canvas.getContext('2d');
    canvas.width  = W;
    canvas.height = H;

    // Reset state on re-init
    candleLit    = true;
    particles    = [];
    statusEl.textContent = '';

    canvas.addEventListener('click',    _onInteract);
    canvas.addEventListener('keydown',  _onKeyInteract);

    if (rafId) cancelAnimationFrame(rafId);
    _loop();
  }

  // ── Main render loop ──────────────────────────────────────
  function _loop() {
    _clear();
    _drawPlate();
    _drawCakeTier(CAKE.b, 8);
    _drawCakeTier(CAKE.t, 6);
    _drawIcingDrip(CAKE.b, 10);
    _drawIcingDrip(CAKE.t, 8);
    _drawCandle();
    if (candleLit) _drawFlame();
    _drawParticles();

    flickerAngle += 0.08;
    rafId = requestAnimationFrame(_loop);
  }

  function _clear() {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Drawing primitives ────────────────────────────────────

  function _drawPlate() {
    const p = CAKE.p;
    _pixelRect(p.x, p.y, p.w, p.h, C.plate, C.border);
  }

  function _drawCakeTier({ x, y, w, h }, borderPx) {
    // Main body — pixel block style (2px grid lines)
    ctx.fillStyle = C.cake2;
    ctx.fillRect(x, y, w, h);

    // Darker horizontal pixel rows
    ctx.fillStyle = C.cake1;
    for (let row = 0; row < h; row += 4) {
      ctx.fillRect(x, y + row, w, 2);
    }

    // Border
    ctx.strokeStyle = C.border;
    ctx.lineWidth   = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

    // Top icing strip
    ctx.fillStyle = C.icing;
    ctx.fillRect(x, y, w, 6);

    // Icing dots along top
    ctx.fillStyle = C.icingDim;
    for (let dx = 10; dx < w - 10; dx += 18) {
      ctx.fillRect(x + dx, y - 3, 6, 6);
    }
  }

  function _drawIcingDrip({ x, y, w }, count) {
    ctx.fillStyle = C.icing;
    const spacing = w / (count + 1);
    for (let i = 1; i <= count; i++) {
      const dx = Math.floor(x + spacing * i);
      const dh = 8 + (i % 3) * 4;
      ctx.fillRect(dx - 3, y, 6, dh);
      ctx.fillRect(dx - 2, y + dh, 4, 4);
    }
  }

  function _drawCandle() {
    const { x, y, w, h } = CAKE.candle;
    _pixelRect(x, y, w, h, C.candle, C.wax);

    // Wax stripes
    ctx.fillStyle = C.wax;
    for (let row = 4; row < h; row += 8) {
      ctx.fillRect(x + 2, y + row, w - 4, 3);
    }
  }

  function _drawFlame() {
    const cx = CAKE.candle.x + CAKE.candle.w / 2;
    const cy = CAKE.candle.y;

    // Animated flicker offset
    const flicker = Math.sin(flickerAngle) * 2.5;
    const scaleY  = 1 + Math.sin(flickerAngle * 1.3) * 0.08;
    const scaleX  = 1 + Math.cos(flickerAngle * 0.9) * 0.06;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scaleX, scaleY);

    // Outer glow
    const grad = ctx.createRadialGradient(flicker, -4, 2, flicker, -8, 16);
    grad.addColorStop(0,   C.flameTip);
    grad.addColorStop(0.5, C.flame);
    grad.addColorStop(1,   'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(flicker, -10, 10, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Core pixel flame (4×8 block)
    ctx.fillStyle = C.flameTip;
    ctx.fillRect(flicker - 3, -18, 6, 10);
    ctx.fillStyle = '#fff';
    ctx.fillRect(flicker - 1, -16, 2, 5);

    ctx.restore();
  }

  function _drawParticles() {
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle   = p.color;
      ctx.fillRect(
        Math.round(p.x - p.size / 2),
        Math.round(p.y - p.size / 2),
        p.size, p.size
      );
      p.x    += p.vx;
      p.y    += p.vy;
      p.vy   -= 0.18; // float up
      p.life -= 1;
    });
    ctx.globalAlpha = 1;
  }

  function _pixelRect(x, y, w, h, fill, stroke) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }

  // ── Interaction ───────────────────────────────────────────
  function _onInteract() {
    if (!candleLit) return;
    _blowCandle();
  }

  function _onKeyInteract(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      _onInteract();
    }
  }

  function _blowCandle() {
    candleLit = false;

    // Spawn particles at flame position
    const cx = CAKE.candle.x + CAKE.candle.w / 2;
    const cy = CAKE.candle.y - 10;
    _spawnParticles(cx, cy, 28);

    // Screen flash
    _triggerScreenFlash();

    // Update UI
    hintEl.textContent       = '';
    statusEl.textContent     = 'WISH RECORDED';
    statusEl.classList.add('anim-glow-pulse');

    // Proceed after short pause
    setTimeout(() => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('click',   _onInteract);
      canvas.removeEventListener('keydown', _onKeyInteract);
      window.transitionTo('screen-penalty');
    }, 2200);
  }

  function _spawnParticles(cx, cy, count) {
    const colors = [C.accent, C.accentDim, '#fff', C.flame, C.flameTip];
    for (let i = 0; i < count; i++) {
      particles.push({
        x:       cx + (Math.random() - 0.5) * 12,
        y:       cy,
        vx:      (Math.random() - 0.5) * 3.5,
        vy:      -(Math.random() * 3 + 1),
        size:    Math.floor(Math.random() * 4) + 2,
        color:   colors[Math.floor(Math.random() * colors.length)],
        life:    40 + Math.floor(Math.random() * 30),
        maxLife: 70,
      });
    }
  }

  function _triggerScreenFlash() {
    const flash = document.createElement('div');
    flash.className = 'screen-flash-overlay';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);
  }

  // ── Public API ────────────────────────────────────────────
  return { init };

})();
