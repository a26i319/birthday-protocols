

'use strict';

const LoadingScreen = (() => {

  // ── Boot sequence lines ──────────────────────────────────
  // Each entry: { text, delay (ms after prev), class (optional) }
  const BOOT_LINES = [
    { text: 'BIRTHDAY PROTOCOL v1.0',           delay: 0,    cls: 'loading__log-line--accent' },
    { text: '> Initializing system...',          delay: 380  },
    { text: '> Mounting memory banks...',        delay: 420  },
    { text: '> Loading emotional archives...',   delay: 460  },
    { text: '> Checking wish registry...',       delay: 500  },
    { text: '> Calibrating cake renderer...',    delay: 440  },
    { text: '> Preparing penalty module...',     delay: 480  },
    { text: '> Retrieving secret message...',    delay: 520  },
    { text: '> All systems nominal.',            delay: 400, cls: 'loading__log-line--accent' },
    { text: 'READY.', delay: 300, cls: 'loading__log-line--accent' },
  ];

  // Progress checkpoints aligned to boot lines (0–100)
  const PROGRESS_STEPS = [5, 15, 28, 40, 54, 66, 78, 88, 96, 100];

  // ── State ────────────────────────────────────────────────
  let ready       = false;   // boot complete?
  let userClicked = false;   // user tapped?
  let lineIndex   = 0;
  let cumulativeDelay = 0;

  // ── DOM refs ─────────────────────────────────────────────
  let logEl, fillEl, labelEl, ctaEl;

  // ── Init ─────────────────────────────────────────────────
  function init() {
    logEl   = document.getElementById('boot-log');
    fillEl  = document.getElementById('progress-fill');
    labelEl = document.getElementById('progress-label');
    ctaEl   = document.getElementById('loading-cta');

    if (!logEl || !fillEl) {
      console.error('[Loading] DOM elements missing.');
      return;
    }

    _runBootSequence();
    _bindAdvanceListeners();
  }

  // ── Boot sequence ─────────────────────────────────────────
  function _runBootSequence() {
    cumulativeDelay = 200; // initial pause

    BOOT_LINES.forEach((line, i) => {
      cumulativeDelay += line.delay;

      setTimeout(() => {
        _appendLine(line.text, line.cls);
        _setProgress(PROGRESS_STEPS[i]);

        // Last line → show CTA
        if (i === BOOT_LINES.length - 1) {
          setTimeout(_onBootComplete, 400);
        }
      }, cumulativeDelay);
    });
  }

  function _appendLine(text, extraClass = '') {
    const p = document.createElement('p');
    p.className = ['loading__log-line', 'font-mono', extraClass]
                    .filter(Boolean).join(' ');
    p.textContent = text;
    logEl.appendChild(p);

    // Trigger CSS transition on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        p.classList.add('loading__log-line--visible');
      });
    });

    // Auto-scroll log
    logEl.scrollTop = logEl.scrollHeight;
  }

  function _setProgress(pct) {
    fillEl.style.width  = `${pct}%`;
    labelEl.textContent = `${pct}%`;
  }

  function _onBootComplete() {
    ready = true;
    ctaEl.classList.add('loading__cta--visible');
    ctaEl.classList.add('anim-glow-pulse');

    // If user already clicked/pressed before boot finished, advance now
    if (userClicked) _advance();
  }

  // ── Input listeners ───────────────────────────────────────
  function _bindAdvanceListeners() {
    document.addEventListener('click',    _onInput, { once: true });
    document.addEventListener('keydown',  _onKeyInput);
    document.addEventListener('touchend', _onInput, { once: true });
  }

  function _onInput() {
    userClicked = true;
    if (ready) _advance();
  }

  function _onKeyInput(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      userClicked = true;
      if (ready) _advance();
    }
  }

  function _advance() {
    // Clean up listeners
    document.removeEventListener('keydown', _onKeyInput);

    // Flash effect then transition
    _triggerFlash();
    setTimeout(() => {
      window.transitionTo('screen-welcome');
    }, 260);
  }

  function _triggerFlash() {
    const flash = document.createElement('div');
    flash.className = 'screen-flash-overlay';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);
  }

  // ── Public API ────────────────────────────────────────────
  return { init };

})();
