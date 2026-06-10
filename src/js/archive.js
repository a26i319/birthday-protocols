

'use strict';

const ArchiveScreen = (() => {

  // ── DOM refs ──────────────────────────────────────────────
  let gridEl, overlayEl, overlayImg, overlayCaption, overlayDate;
  let closeBtn, continueBtn;

  // ── State ─────────────────────────────────────────────────
  let unlockTimers = [];

  // ── Init ──────────────────────────────────────────────────
  function init() {
    gridEl         = document.getElementById('archive-grid');
    overlayEl      = document.getElementById('card-overlay');
    overlayImg     = document.getElementById('overlay-img');
    overlayCaption = document.getElementById('overlay-caption');
    overlayDate    = document.getElementById('overlay-date');
    closeBtn       = document.getElementById('overlay-close');
    continueBtn    = document.getElementById('archive-continue');

    if (!gridEl) { console.error('[Archive] Grid element missing.'); return; }

    // Clear any previous render
    gridEl.innerHTML = '';
    unlockTimers.forEach(clearTimeout);
    unlockTimers = [];

    // Build cards from data
    if (typeof MEMORIES === 'undefined' || !Array.isArray(MEMORIES)) {
      console.error('[Archive] MEMORIES data not found.');
      return;
    }

    _buildCards(MEMORIES);
    _bindOverlayControls();

    continueBtn.addEventListener('click',   _onContinue);
    continueBtn.addEventListener('keydown', _onContinueKey);
  }

  // ── Build card grid ───────────────────────────────────────
  function _buildCards(memories) {
    memories.forEach((mem, i) => {
      const card = _createCard(mem, i);
      gridEl.appendChild(card);

      // Staggered unlock animation
      const timer = setTimeout(() => {
        card.classList.add('memory-card--unlocked');
        // Use card-unlock keyframe directly
        card.style.animation = 'card-unlock 500ms cubic-bezier(0.34,1.56,0.64,1) forwards';
      }, 200 + i * 140);
      unlockTimers.push(timer);
    });
  }

  function _createCard(mem, index) {
    const card = document.createElement('article');
    card.className = 'memory-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `Memory ${index + 1}: ${mem.caption}`);

    const img = document.createElement('img');
    img.className = 'memory-card__img';
    img.src       = mem.image;
    img.alt       = mem.caption;
    img.loading   = 'lazy';

    const footer = document.createElement('div');
    footer.className = 'memory-card__footer';

    const idLabel = document.createElement('span');
    idLabel.className   = 'memory-card__id font-mono';
    idLabel.textContent = `MEMORY_${String(index + 1).padStart(2, '0')}`;

    const captionEl = document.createElement('span');
    captionEl.className   = 'memory-card__caption font-body';
    captionEl.textContent = mem.caption;

    footer.appendChild(idLabel);
    footer.appendChild(captionEl);
    card.appendChild(img);
    card.appendChild(footer);

    card.addEventListener('click',   () => _openOverlay(mem));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        _openOverlay(mem);
      }
    });

    return card;
  }

  // ── Overlay ───────────────────────────────────────────────
  function _openOverlay(mem) {
    overlayImg.src       = mem.image;
    overlayImg.alt       = mem.caption;
    overlayCaption.textContent = mem.caption;
    overlayDate.textContent    = mem.date || '';

    overlayEl.classList.add('card-overlay--visible');
    overlayEl.setAttribute('aria-hidden', 'false');

    // Focus close button for keyboard accessibility
    setTimeout(() => closeBtn.focus(), 80);

    // Trap Escape key
    overlayEl._escHandler = (e) => {
      if (e.key === 'Escape') _closeOverlay();
    };
    document.addEventListener('keydown', overlayEl._escHandler);
  }

  function _closeOverlay() {
    overlayEl.classList.remove('card-overlay--visible');
    overlayEl.setAttribute('aria-hidden', 'true');
    if (overlayEl._escHandler) {
      document.removeEventListener('keydown', overlayEl._escHandler);
      overlayEl._escHandler = null;
    }
  }

  function _bindOverlayControls() {
    closeBtn.addEventListener('click', _closeOverlay);

    // Click outside inner box to close
    overlayEl.addEventListener('click', (e) => {
      if (e.target === overlayEl) _closeOverlay();
    });
  }

  // ── Continue ──────────────────────────────────────────────
  function _onContinue() {
    continueBtn.removeEventListener('click',   _onContinue);
    continueBtn.removeEventListener('keydown', _onContinueKey);
    window.transitionTo('screen-letter');
  }

  function _onContinueKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      _onContinue();
    }
  }

  // ── Public API ────────────────────────────────────────────
  return { init };

})();
