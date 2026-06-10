
'use strict';

const WelcomeScreen = (() => {

  // ── Dialogue content ──────────────────────────────────────
  // Use \n for line breaks inside the typewriter
  const DIALOGUE = [
    'Hey.',
    '\n',
    'Before today ends,',
    'I wanted to give you something.',
    '\n',
    'A few memories.',
    'A small challenge.',
    'And one final message.',
    '\n',
    'Ready?',
  ];

  // Typing speed (ms per character)
  const CHAR_SPEED   = 38;
  // Pause between dialogue segments (ms)
  const SEGMENT_PAUSE = 260;

  // ── State ─────────────────────────────────────────────────
  let textEl, continueBtn;
  let isTyping    = false;
  let isComplete  = false;
  let typeTimeout = null;

  // ── Init ──────────────────────────────────────────────────
  function init() {
    textEl      = document.getElementById('welcome-text');
    continueBtn = document.getElementById('welcome-continue');

    if (!textEl || !continueBtn) {
      console.error('[Welcome] DOM elements missing.');
      return;
    }

    // Reset state for re-entry safety
    textEl.textContent = '';
    continueBtn.style.visibility = 'hidden';
    isComplete = false;
    isTyping   = false;

    continueBtn.addEventListener('click',   _onContinue);
    continueBtn.addEventListener('keydown', _onContinueKey);

    // Small delay before typing starts (screen has just faded in)
    setTimeout(_startTypewriter, 600);
  }

  // ── Typewriter ────────────────────────────────────────────
  function _startTypewriter() {
    isTyping = true;
    _typeSegments(DIALOGUE, 0);
  }

  function _typeSegments(segments, segIndex) {
    if (segIndex >= segments.length) {
      _onTypingComplete();
      return;
    }

    const segment = segments[segIndex];

    if (segment === '\n') {
      // Blank line — just append newline with a brief pause
      textEl.textContent += '\n';
      typeTimeout = setTimeout(
        () => _typeSegments(segments, segIndex + 1),
        SEGMENT_PAUSE
      );
      return;
    }

    // Type character by character
    _typeChars(segment, 0, () => {
      // Newline after segment, then pause before next
      textEl.textContent += '\n';
      typeTimeout = setTimeout(
        () => _typeSegments(segments, segIndex + 1),
        SEGMENT_PAUSE
      );
    });
  }

  function _typeChars(text, charIndex, onDone) {
    if (charIndex >= text.length) {
      onDone();
      return;
    }

    textEl.textContent += text[charIndex];

    typeTimeout = setTimeout(
      () => _typeChars(text, charIndex + 1, onDone),
      CHAR_SPEED
    );
  }

  function _skipToEnd() {
    if (typeTimeout) clearTimeout(typeTimeout);
    textEl.textContent = DIALOGUE.join('\n').replace(/\n\n/g, '\n\n');
    _onTypingComplete();
  }

  function _onTypingComplete() {
    isTyping   = false;
    isComplete = true;
    continueBtn.style.visibility = 'visible';
    continueBtn.focus();
  }

  // ── Advance ───────────────────────────────────────────────
  function _onContinue() {
    if (isTyping) {
      // First press: skip to end
      _skipToEnd();
      return;
    }
    if (isComplete) {
      _advance();
    }
  }

  function _onContinueKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      _onContinue();
    }
  }

  function _advance() {
    continueBtn.removeEventListener('click',   _onContinue);
    continueBtn.removeEventListener('keydown', _onContinueKey);
    window.transitionTo('screen-cake');
  }

  // ── Public API ────────────────────────────────────────────
  return { init };

})();
