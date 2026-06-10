/* ============================================================
   BIRTHDAY PROTOCOL — penalty.js
   Drag-to-aim penalty kick game.
   Score 3 goals to unlock the memory archive.
   ============================================================ */

'use strict';

const PenaltyScreen = (() => {

  // ── Canvas dimensions (logical) ───────────────────────────
  const W = 560;
  const H = 340;

  // ── Colors ────────────────────────────────────────────────
  const C = {
    bg:       '#000000',
    field:    '#050e07',
    fieldAlt: '#061008',
    line:     '#0d2b14',
    lineBrt:  '#122e18',
    accent:   '#1DCD9F',
    accentDm: '#169976',
    dim:      '#0d6b52',
    white:    '#c8c8c8',
    netLine:  '#111111',
    ball:     '#c8c8c8',
    ballMark: '#555555',
    keeper:   '#169976',
    keeperH:  '#1DCD9F',
    arrow:    '#1DCD9F',
    ring:     '#1DCD9F',
  };

  // ── Game constants ────────────────────────────────────────
  const GOAL_LINE_Y  = 60;     // goal top
  const GOAL_H       = 70;     // goal height
  const GOAL_X       = 140;    // goal left
  const GOAL_W       = 280;    // goal width
  const POST_W       = 6;

  const BALL_START_X = W / 2;
  const BALL_START_Y = H - 60;
  const BALL_RADIUS  = 10;

  const KEEPER_W     = 40;
  const KEEPER_H     = 54;
  const KEEPER_Y     = GOAL_LINE_Y + 8;
  const KEEPER_SPEED = 1.8;    // px per frame — intentionally slow = easy

  const GOALS_NEEDED = 3;

  // ── State ─────────────────────────────────────────────────
  let canvas, ctx;
  let goals      = 0;
  let phase      = 'idle'; // idle | aiming | shooting | result | cooldown
  let rafId      = null;

  // Ball
  let ball       = { x: BALL_START_X, y: BALL_START_Y, vx: 0, vy: 0, spin: 0 };

  // Drag aim
  let drag       = { active: false, startX: 0, startY: 0, curX: 0, curY: 0 };

  // Keeper
  let keeper     = { x: W / 2 - KEEPER_W / 2, dir: 1, diving: false, diveTarget: 0 };

  // Goal ring animation
  let ring       = { active: false, x: 0, y: 0, r: 0, alpha: 0 };

  // Flash timer
  let statusTimer = null;

  // ── DOM refs ──────────────────────────────────────────────
  let counterEl, statusEl;

  // ── Init ──────────────────────────────────────────────────
  function init() {
    canvas    = document.getElementById('penalty-canvas');
    counterEl = document.getElementById('goal-counter');
    statusEl  = document.getElementById('penalty-status');

    if (!canvas) { console.error('[Penalty] Canvas missing.'); return; }

    // Set logical size
    canvas.width  = W;
    canvas.height = H;
    ctx = canvas.getContext('2d');

    // Reset
    goals = 0;
    _resetBall();
    _resetKeeper();
    phase = 'idle';
    ring.active = false;
    _updateCounter();
    statusEl.textContent = 'DRAG TO AIM — RELEASE TO SHOOT';
    statusEl.className   = 'penalty__status font-mono';

    // Input
    canvas.addEventListener('mousedown',  _onDragStart);
    canvas.addEventListener('mousemove',  _onDragMove);
    canvas.addEventListener('mouseup',    _onDragEnd);
    canvas.addEventListener('touchstart', _onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  _onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   _onTouchEnd);

    if (rafId) cancelAnimationFrame(rafId);
    _loop();
  }

  // ── Game loop ─────────────────────────────────────────────
  function _loop() {
    _update();
    _draw();
    rafId = requestAnimationFrame(_loop);
  }

  function _update() {
    _updateKeeper();
    if (phase === 'shooting') _updateBall();
    if (ring.active)          _updateRing();
  }

  function _updateKeeper() {
    if (keeper.diving) {
      // Dive toward target
      const dx   = keeper.diveTarget - keeper.x;
      const step = Math.sign(dx) * Math.min(Math.abs(dx), 6);
      keeper.x  += step;
      if (Math.abs(dx) < 2) keeper.diving = false;
      return;
    }

    // Normal sway — slow enough to be beatable
    keeper.x += KEEPER_SPEED * keeper.dir;

    const minX = GOAL_X + POST_W + 4;
    const maxX = GOAL_X + GOAL_W - POST_W - KEEPER_W - 4;

    if (keeper.x <= minX) { keeper.x = minX; keeper.dir = 1; }
    if (keeper.x >= maxX) { keeper.x = maxX; keeper.dir = -1; }
  }

  function _updateBall() {
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.spin += ball.vx * 0.04;

    // Gravity-lite for arc
    ball.vy += 0.06;

    // Check goal
    if (ball.y < GOAL_LINE_Y + GOAL_H &&
        ball.y > GOAL_LINE_Y &&
        ball.x > GOAL_X + POST_W &&
        ball.x < GOAL_X + GOAL_W - POST_W) {
      _onGoal();
      return;
    }

    // Check keeper save
    if (ball.y < KEEPER_Y + KEEPER_H &&
        ball.y > KEEPER_Y &&
        ball.x > keeper.x &&
        ball.x < keeper.x + KEEPER_W) {
      _onSave();
      return;
    }

    // Ball out of bounds
    if (ball.y < 0 || ball.x < 0 || ball.x > W) {
      _onMiss();
    }
  }

  function _updateRing() {
    ring.r     += 2.5;
    ring.alpha -= 0.03;
    if (ring.alpha <= 0) ring.active = false;
  }

  // ── Goal / Save / Miss ────────────────────────────────────
  function _onGoal() {
    phase = 'result';
    goals++;
    _updateCounter();

    ring = { active: true, x: ball.x, y: ball.y, r: 12, alpha: 0.9 };

    _setStatus('MEMORY RECOVERED', true);

    if (goals >= GOALS_NEEDED) {
      setTimeout(_onComplete, 1600);
    } else {
      setTimeout(() => {
        _resetBall();
        _resetKeeper();
        phase = 'idle';
      }, 1400);
    }
  }

  function _onSave() {
    phase = 'result';
    _setStatus('SAVED — TRY AGAIN', false);
    setTimeout(() => {
      _resetBall();
      phase = 'idle';
    }, 1200);
  }

  function _onMiss() {
    phase = 'result';
    _setStatus('MISSED — TRY AGAIN', false);
    setTimeout(() => {
      _resetBall();
      phase = 'idle';
    }, 1000);
  }

  function _setStatus(text, isSuccess) {
    clearTimeout(statusTimer);
    statusEl.textContent = text;
    statusEl.className   = 'penalty__status font-mono' +
                           (isSuccess ? ' penalty__status--success' : '');
  }

  function _onComplete() {
    cancelAnimationFrame(rafId);
    _removeListeners();
    _setStatus('ARCHIVE RESTORED', true);
    setTimeout(() => window.transitionTo('screen-archive'), 1400);
  }

  // ── Keeper dive on shoot ──────────────────────────────────
  function _triggerKeeperDive(targetX) {
    // Dive to slightly wrong position to keep game easy
    const bias = (Math.random() - 0.5) * 80;
    keeper.diveTarget = Math.max(
      GOAL_X + POST_W,
      Math.min(GOAL_X + GOAL_W - POST_W - KEEPER_W, targetX + bias)
    );
    keeper.diving = true;
  }

  // ── Reset helpers ─────────────────────────────────────────
  function _resetBall() {
    ball = { x: BALL_START_X, y: BALL_START_Y, vx: 0, vy: 0, spin: 0 };
    drag = { active: false, startX: 0, startY: 0, curX: 0, curY: 0 };
    statusEl.textContent = 'DRAG TO AIM — RELEASE TO SHOOT';
    statusEl.className   = 'penalty__status font-mono';
  }

  function _resetKeeper() {
    keeper = {
      x:          W / 2 - KEEPER_W / 2,
      dir:        1,
      diving:     false,
      diveTarget: 0,
    };
  }

  // ── Input handling ────────────────────────────────────────
  function _canvasPoint(clientX, clientY) {
    const rect  = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top)  * scaleY,
    };
  }

  function _onDragStart(e) {
    if (phase !== 'idle') return;
    const { x, y } = _canvasPoint(e.clientX, e.clientY);
    drag = { active: true, startX: x, startY: y, curX: x, curY: y };
    statusEl.textContent = 'RELEASE TO SHOOT';
  }

  function _onDragMove(e) {
    if (!drag.active) return;
    const { x, y } = _canvasPoint(e.clientX, e.clientY);
    drag.curX = x;
    drag.curY = y;
  }

  function _onDragEnd(e) {
    if (!drag.active || phase !== 'idle') return;
    drag.active = false;
    _shoot();
  }

  function _onTouchStart(e) {
    e.preventDefault();
    const t = e.touches[0];
    _onDragStart({ clientX: t.clientX, clientY: t.clientY });
  }

  function _onTouchMove(e) {
    e.preventDefault();
    const t = e.touches[0];
    _onDragMove({ clientX: t.clientX, clientY: t.clientY });
  }

  function _onTouchEnd(e) {
    e.preventDefault();
    _onDragEnd({});
  }

  function _shoot() {
    // Vector from drag end back to ball (slingshot feel)
    const dx = ball.x - drag.curX;
    const dy = ball.y - drag.curY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 8) {
      // Too short a drag — do nothing
      statusEl.textContent = 'DRAG TO AIM — RELEASE TO SHOOT';
      return;
    }

    const speed = Math.min(dist * 0.18, 14);
    ball.vx = (dx / dist) * speed;
    ball.vy = (dy / dist) * speed;

    phase = 'shooting';
    _triggerKeeperDive(ball.x + ball.vx * 12);
  }

  function _removeListeners() {
    canvas.removeEventListener('mousedown',  _onDragStart);
    canvas.removeEventListener('mousemove',  _onDragMove);
    canvas.removeEventListener('mouseup',    _onDragEnd);
    canvas.removeEventListener('touchstart', _onTouchStart);
    canvas.removeEventListener('touchmove',  _onTouchMove);
    canvas.removeEventListener('touchend',   _onTouchEnd);
  }

  // ── Drawing ───────────────────────────────────────────────
  function _draw() {
    _clear();
    _drawField();
    _drawGoal();
    _drawNet();
    _drawKeeper();
    _drawBall();
    if (drag.active && phase === 'idle') _drawAimArrow();
    if (ring.active) _drawRing();
  }

  function _clear() {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
  }

  function _drawField() {
    // Alternating grass stripes
    for (let row = 0; row < H; row += 20) {
      ctx.fillStyle = (Math.floor(row / 20) % 2 === 0) ? C.field : C.fieldAlt;
      ctx.fillRect(0, row, W, 20);
    }

    // Center spot
    ctx.strokeStyle = C.lineBrt;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.arc(W / 2, BALL_START_Y, 30, 0, Math.PI * 2);
    ctx.stroke();

    // Penalty spot
    ctx.fillStyle = C.lineBrt;
    ctx.fillRect(W / 2 - 2, BALL_START_Y - 2, 4, 4);

    // Penalty box
    ctx.strokeStyle = C.line;
    ctx.strokeRect(GOAL_X - 20, GOAL_LINE_Y, GOAL_W + 40, 160);
  }

  function _drawGoal() {
    // Goal background (net area, darker)
    ctx.fillStyle = '#030d06';
    ctx.fillRect(GOAL_X, GOAL_LINE_Y, GOAL_W, GOAL_H);

    // Net grid
    ctx.strokeStyle = C.netLine;
    ctx.lineWidth   = 1;
    for (let gx = GOAL_X; gx <= GOAL_X + GOAL_W; gx += 20) {
      ctx.beginPath();
      ctx.moveTo(gx, GOAL_LINE_Y);
      ctx.lineTo(gx, GOAL_LINE_Y + GOAL_H);
      ctx.stroke();
    }
    for (let gy = GOAL_LINE_Y; gy <= GOAL_LINE_Y + GOAL_H; gy += 14) {
      ctx.beginPath();
      ctx.moveTo(GOAL_X, gy);
      ctx.lineTo(GOAL_X + GOAL_W, gy);
      ctx.stroke();
    }

    // Posts — pixel style
    ctx.fillStyle = C.white;
    // Left post
    ctx.fillRect(GOAL_X, GOAL_LINE_Y, POST_W, GOAL_H);
    // Right post
    ctx.fillRect(GOAL_X + GOAL_W - POST_W, GOAL_LINE_Y, POST_W, GOAL_H);
    // Crossbar
    ctx.fillRect(GOAL_X, GOAL_LINE_Y, GOAL_W, POST_W);

    // Post highlight
    ctx.fillStyle = C.dim;
    ctx.fillRect(GOAL_X + 1, GOAL_LINE_Y, 2, GOAL_H);
    ctx.fillRect(GOAL_X + GOAL_W - 3, GOAL_LINE_Y, 2, GOAL_H);
  }

  function _drawNet() {
    // Top edge shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(GOAL_X + POST_W, GOAL_LINE_Y + POST_W, GOAL_W - POST_W * 2, 8);
  }

  function _drawKeeper() {
    const { x } = keeper;
    const y     = KEEPER_Y;

    // Body
    ctx.fillStyle = C.keeper;
    ctx.fillRect(x + 4, y + 16, KEEPER_W - 8, KEEPER_H - 16);

    // Head
    ctx.fillStyle = C.keeperH;
    ctx.fillRect(x + 8, y, KEEPER_W - 16, 18);

    // Eyes (pixel)
    ctx.fillStyle = C.bg;
    ctx.fillRect(x + 11, y + 5, 4, 4);
    ctx.fillRect(x + KEEPER_W - 15, y + 5, 4, 4);

    // Arms
    ctx.fillStyle = C.keeperH;
    ctx.fillRect(x,               y + 18, 6, KEEPER_H - 30);
    ctx.fillRect(x + KEEPER_W - 6, y + 18, 6, KEEPER_H - 30);

    // Legs
    ctx.fillStyle = C.keeper;
    ctx.fillRect(x + 6,              y + KEEPER_H - 14, 10, 14);
    ctx.fillRect(x + KEEPER_W - 16,  y + KEEPER_H - 14, 10, 14);

    // Pixel border
    ctx.strokeStyle = C.accentDm;
    ctx.lineWidth   = 1;
    ctx.strokeRect(x + 4, y, KEEPER_W - 8, KEEPER_H);
  }

  function _drawBall() {
    const { x, y, spin } = ball;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);

    // Ball base
    ctx.fillStyle = C.ball;
    _pixelCircle(0, 0, BALL_RADIUS);

    // Pixel patches
    ctx.fillStyle = C.ballMark;
    ctx.fillRect(-3, -4, 3, 3);
    ctx.fillRect(1,  1,  3, 3);
    ctx.fillRect(-4, 2,  3, 3);

    ctx.restore();
  }

  function _pixelCircle(cx, cy, r) {
    // Square-ish pixel circle
    const r2 = r * r;
    const rOuter = r + 0.5;
    for (let px = -r; px <= r; px++) {
      for (let py = -r; py <= r; py++) {
        if (px * px + py * py <= r2) {
          ctx.fillRect(cx + px, cy + py, 1, 1);
        }
      }
    }
  }

  function _drawAimArrow() {
    const bx = ball.x;
    const by = ball.y;
    const ex = drag.curX;
    const ey = drag.curY;

    const dx   = bx - ex;
    const dy   = by - ey;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 8) return;

    const nx = dx / dist;
    const ny = dy / dist;

    ctx.save();
    ctx.strokeStyle = C.arrow;
    ctx.lineWidth   = 2;
    ctx.setLineDash([6, 4]);
    ctx.globalAlpha = 0.7;

    // Line from ball toward aim direction
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + nx * Math.min(dist, 90), by + ny * Math.min(dist, 90));
    ctx.stroke();

    // Arrowhead
    ctx.setLineDash([]);
    const headX = bx + nx * Math.min(dist, 90);
    const headY = by + ny * Math.min(dist, 90);
    const perpX = -ny * 6;
    const perpY =  nx * 6;

    ctx.beginPath();
    ctx.moveTo(headX, headY);
    ctx.lineTo(headX - nx * 10 + perpX, headY - ny * 10 + perpY);
    ctx.lineTo(headX - nx * 10 - perpX, headY - ny * 10 - perpY);
    ctx.closePath();
    ctx.fillStyle = C.arrow;
    ctx.fill();

    ctx.restore();
  }

  function _drawRing() {
    ctx.save();
    ctx.globalAlpha  = ring.alpha;
    ctx.strokeStyle  = C.ring;
    ctx.lineWidth    = 3;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function _updateCounter() {
    if (counterEl) counterEl.textContent = `${goals} / ${GOALS_NEEDED}`;
  }

  // ── Public API ────────────────────────────────────────────
  return { init };

})();
