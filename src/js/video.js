'use strict';

const VideoScreen = (function () {

  let initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;

    const video   = document.getElementById('finale-video');
    const overlay = document.getElementById('video-end-overlay');
    const labelEl = document.getElementById('video-label');

    
  

    // Show overlay only after video ends
    video.addEventListener('ended', () => {
      overlay.classList.add('video-overlay-text--visible');
    });

    // Fade out label after 3s
    setTimeout(() => {
      labelEl.style.transition = 'opacity 1s ease';
      labelEl.style.opacity = '0';
    }, 3000);

    tryPlay();
  }

  function tryPlay() {
    const video = document.getElementById('finale-video');
    const p = video.play();
    if (p !== undefined) {
      p.catch(() => {
        video.muted = true;
        video.play().catch(showFallback);
      });
    }
  }

  function showFallback() {
    const video = document.getElementById('finale-video');
    video.style.cursor = 'pointer';
    video.addEventListener('click', () => video.play(), { once: true });
  }

  return { init };

})();