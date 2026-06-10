

'use strict';

const LetterScreen = (() => {

  // ── Timing config ─────────────────────────────────────────
  const LINE_DELAY   = 520;   // ms between each line appearing
  const FINALE_DELAY = 1200;  // ms after last line before finale

  // ── State ─────────────────────────────────────────────────
  let lineTimers  = [];
  let finaleTimer = null;

  // ── DOM refs ──────────────────────────────────────────────
  let textEl, finaleEl;

  // ── Init ──────────────────────────────────────────────────
  function init() {
    textEl   = document.getElementById('letter-text');
    finaleEl = document.getElementById('letter-finale');

    if (!textEl || !finaleEl) {
      console.error('[Letter] DOM elements missing.');
      return;
    }

    // Guard: LETTER_LINES must be defined in data/letter.js
    if (typeof LETTER_LINES === 'undefined' || !Array.isArray(LETTER_LINES)) {
      console.error('[Letter] LETTER_LINES data not found.');
      return;
    }

    // Clean up any previous state
    textEl.innerHTML = '';
    finaleEl.classList.remove('letter__finale--visible');
    finaleEl.setAttribute('aria-hidden', 'true');
    lineTimers.forEach(clearTimeout);
    lineTimers   = [];
    if (finaleTimer) clearTimeout(finaleTimer);

    // Scroll to top of screen
    document.getElementById('screen-letter').scrollTop = 0;

    _revealLines(LETTER_LINES);
  }

  // ── Line-by-line reveal ───────────────────────────────────
  function _revealLines(lines) {
    let delay = 600; // initial pause after screen fade

    lines.forEach((lineText, i) => {
      const t = setTimeout(() => _showLine(lineText, i), delay);
      lineTimers.push(t);
      delay += LINE_DELAY;
    });

    // Schedule finale after all lines
    finaleTimer = setTimeout(_showFinale, delay + FINALE_DELAY);
  }

  function _showLine(text, index) {
    const p = document.createElement('p');
    p.className = 'letter__line font-body';

    if (text === '') {
      p.classList.add('letter__line--blank');
    } else {
      p.textContent = text;
    }

    textEl.appendChild(p);

    // Trigger CSS transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        p.classList.add('letter__line--visible');
      });
    });

    // Keep last line in view
    p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function _showFinale() {
    finaleEl.removeAttribute('aria-hidden');
    finaleEl.classList.add('letter__finale--visible');

    // Add dramatic entrance animation to mission text
    const missionEl = finaleEl.querySelector('.letter__mission');
    if (missionEl) {
      missionEl.style.animation = 'finale-entrance 1.2s ease forwards';
    }

    finaleEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Public API ────────────────────────────────────────────
  return { init };

})();
