

'use strict';

// ── Screen IDs in order ──────────────────────────────────────
const SCREEN_ORDER = [
  'screen-loading',
  'screen-welcome',
  'screen-cake',
  'screen-penalty',
  'screen-archive',
  'screen-letter',
  'screen-video',
];

// ── State ────────────────────────────────────────────────────
const AppState = {
  currentScreen: 'screen-loading',
  transitioning: false,
};

// ── Core transition engine ───────────────────────────────────

/**
 * Transition from the current screen to the target screen.
 * Fades out, swaps active class, fades in.
 *
 * @param {string} targetId   - ID of the screen to transition TO
 * @param {number} [delay=0]  - Optional delay before starting (ms)
 */
function transitionTo(targetId, delay = 0) {
  if (AppState.transitioning) return;
  if (AppState.currentScreen === targetId) return;

  AppState.transitioning = true;

  setTimeout(() => {
    const fromEl = document.getElementById(AppState.currentScreen);
    const toEl   = document.getElementById(targetId);

    if (!toEl) {
      console.warn(`[App] Screen not found: ${targetId}`);
      AppState.transitioning = false;
      return;
    }

    // Fade out current
    fromEl.classList.remove('screen--active');
    fromEl.setAttribute('aria-hidden', 'true');

    // Fade in target after CSS transition completes
    setTimeout(() => {
      toEl.classList.add('screen--active');
      toEl.setAttribute('aria-hidden', 'false');

      AppState.currentScreen = targetId;
      AppState.transitioning = false;

      // Notify the screen module that it is now active
      App.emit('screen:active', targetId);
    }, 520); // slightly longer than --transition-screen (500ms)

  }, delay);
}

/**
 * Minimal event bus so screen modules can react
 * to lifecycle events without circular imports.
 */
const App = (() => {
  const listeners = {};

  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
  }

  function emit(event, data) {
    (listeners[event] || []).forEach(fn => fn(data));
  }

  return { on, emit, transitionTo };
})();

// Make App globally accessible to all screen modules
window.App = App;
window.transitionTo = transitionTo;

// ── Screen lifecycle dispatch ────────────────────────────────

App.on('screen:active', (screenId) => {
  switch (screenId) {
    case 'screen-welcome':
      if (typeof WelcomeScreen !== 'undefined') WelcomeScreen.init();
      break;
    case 'screen-cake':
      if (typeof CakeScreen !== 'undefined') CakeScreen.init();
      break;
    case 'screen-penalty':
      if (typeof PenaltyScreen !== 'undefined') PenaltyScreen.init();
      break;
    case 'screen-archive':
      if (typeof ArchiveScreen !== 'undefined') ArchiveScreen.init();
      break;
    case 'screen-letter':
      if (typeof LetterScreen !== 'undefined') LetterScreen.init();
      break;
    case 'screen-video':
      if (typeof VideoScreen !== 'undefined') VideoScreen.init();
      break;
  }
});

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Add scan-sweep CRT effect to body
  const sweep = document.createElement('div');
  sweep.className = 'scan-sweep';
  document.body.appendChild(sweep);

  // Initialize loading screen (auto-starts)
  if (typeof LoadingScreen !== 'undefined') {
  LoadingScreen.init();
} else {
  console.error('[App] LoadingScreen module not found.');
}

// Start music on first user interaction (browser requires gesture)
document.addEventListener('click', () => {
  const music = document.getElementById('bg-music');
  if (music) {
    music.volume = 0.3;
    music.play().catch(() => {});
  }
}, { once: true });

});
