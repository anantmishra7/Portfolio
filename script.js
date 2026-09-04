// Smooth Scroll-Based Animation & UI Choreography Engine for Anant Mishra Portfolio
(function () {
  'use strict';

  const TOTAL_FRAMES = 240;
  const INITIAL_BATCH_SIZE = 15;
  const CONCURRENT_DOWNLOADS = 8;
  const LERP_FACTOR = 0.09;

  // DOM Elements
  const canvas = document.getElementById('animation-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const loader = document.getElementById('loader');
  const loaderProgressText = document.getElementById('loader-progress');
  const loaderBarFill = document.getElementById('loader-bar-fill');
  const navMenu = document.getElementById('nav-menu');
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.querySelectorAll('.nav-link');

  // Story sections range configuration
  const sections = [
    { 
      el: document.getElementById('section-hero'), 
      fadeInStart: 0.0, 
      fadeInEnd: 0.0, 
      fadeOutStart: 0.14, 
      fadeOutEnd: 0.22, 
      navIndex: 0 
    },
    { 
      el: document.getElementById('section-skills'), 
      fadeInStart: 0.20, 
      fadeInEnd: 0.28, 
      fadeOutStart: 0.38, 
      fadeOutEnd: 0.46, 
      navIndex: 1 
    },
    { 
      el: document.getElementById('section-projects'), 
      fadeInStart: 0.44, 
      fadeInEnd: 0.52, 
      fadeOutStart: 0.62, 
      fadeOutEnd: 0.70, 
      navIndex: 2 
    },
    { 
      el: document.getElementById('section-experience'), 
      fadeInStart: 0.68, 
      fadeInEnd: 0.76, 
      fadeOutStart: 0.86, 
      fadeOutEnd: 0.92, 
      navIndex: 3 
    },
    { 
      el: document.getElementById('section-footer'), 
      fadeInStart: 0.92, 
      fadeInEnd: 0.97, 
      fadeOutStart: 1.1, // Stays visible through end of scroll
      fadeOutEnd: 1.2, 
      navIndex: 4 
    }
  ];

  const images = new Array(TOTAL_FRAMES);
  const loadedFrames = new Set();

  let targetProgress = 0;
  let currentProgress = 0;
  let lastDrawnFrame = -1;
  let isInitialLoaded = false;
  let pendingQueue = [];
  let activeDownloads = 0;

  function getFrameSrc(index) {
    const formatted = String(index).padStart(6, '0');
    return `frames/frame_${formatted}.png`;
  }

  // Cover aspect-ratio drawing logic (like CSS object-fit: cover)
  function drawFrame(frameIndex) {
    let imgToDraw = images[frameIndex];

    // If target frame is not yet fully loaded, fallback to nearest loaded frame
    if (!imgToDraw || !imgToDraw.complete || imgToDraw.naturalWidth === 0) {
      if (loadedFrames.size === 0) return;

      let nearestIndex = -1;
      let minDiff = Infinity;
      for (const loadedIndex of loadedFrames) {
        const diff = Math.abs(loadedIndex - frameIndex);
        if (diff < minDiff) {
          minDiff = diff;
          nearestIndex = loadedIndex;
        }
      }
      if (nearestIndex !== -1) {
        imgToDraw = images[nearestIndex];
      }
    }

    if (!imgToDraw || !imgToDraw.complete || imgToDraw.naturalWidth === 0) return;

    const cWidth = canvas.width;
    const cHeight = canvas.height;
    const iWidth = imgToDraw.naturalWidth;
    const iHeight = imgToDraw.naturalHeight;

    const hRatio = cWidth / iWidth;
    const vRatio = cHeight / iHeight;
    const ratio = Math.max(hRatio, vRatio);

    const drawWidth = iWidth * ratio;
    const drawHeight = iHeight * ratio;
    const shiftX = (cWidth - drawWidth) / 2;
    const shiftY = (cHeight - drawHeight) / 2;

    ctx.drawImage(imgToDraw, 0, 0, iWidth, iHeight, shiftX, shiftY, drawWidth, drawHeight);
    lastDrawnFrame = frameIndex;
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    canvas.width = Math.round(displayWidth * dpr);
    canvas.height = Math.round(displayHeight * dpr);

    if (lastDrawnFrame >= 0) {
      drawFrame(lastDrawnFrame);
    } else if (loadedFrames.size > 0) {
      drawFrame(0);
    }
  }

  function updateScrollTarget() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) {
      targetProgress = 0;
    } else {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      targetProgress = Math.min(1, Math.max(0, scrollY / maxScroll));
    }
  }

  // Smooth UI Section Choreography
  function updateUISections(progress) {
    let activeNavIndex = 0;

    sections.forEach((sec) => {
      if (!sec.el) return;

      let opacity = 0;
      let translateY = 0;

      if (progress < sec.fadeInStart) {
        opacity = 0;
        translateY = 24;
      } else if (progress < sec.fadeInEnd) {
        const t = (progress - sec.fadeInStart) / (sec.fadeInEnd - sec.fadeInStart);
        opacity = Math.sin(t * Math.PI / 2);
        translateY = (1 - opacity) * 24;
      } else if (progress <= sec.fadeOutStart) {
        opacity = 1;
        translateY = 0;
      } else if (progress <= sec.fadeOutEnd) {
        const t = (progress - sec.fadeOutStart) / (sec.fadeOutEnd - sec.fadeOutStart);
        opacity = Math.cos(t * Math.PI / 2);
        translateY = -t * 24;
      } else {
        opacity = 0;
        translateY = -24;
      }

      if (opacity > 0.02) {
        sec.el.style.opacity = opacity.toFixed(3);
        sec.el.style.transform = `translateY(${translateY.toFixed(1)}px)`;
        sec.el.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
        sec.el.classList.add('active');
        if (opacity > 0.35) activeNavIndex = sec.navIndex;
      } else {
        sec.el.style.opacity = '0';
        sec.el.style.transform = 'translateY(24px)';
        sec.el.style.pointerEvents = 'none';
        sec.el.classList.remove('active');
      }
    });

    // Update active nav link indicator
    navLinks.forEach((link, idx) => {
      if (idx === activeNavIndex) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Smooth Animation Render Loop
  function animate() {
    const diff = targetProgress - currentProgress;
    if (Math.abs(diff) > 0.00005) {
      currentProgress += diff * LERP_FACTOR;
    } else {
      currentProgress = targetProgress;
    }

    const calculatedFrame = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, Math.round(currentProgress * (TOTAL_FRAMES - 1)))
    );

    if (calculatedFrame !== lastDrawnFrame) {
      drawFrame(calculatedFrame);
    }

    updateUISections(currentProgress);

    requestAnimationFrame(animate);
  }

  function checkInitialLoadCompletion() {
    if (isInitialLoaded) return;

    if (loadedFrames.has(0) && loadedFrames.size >= Math.min(INITIAL_BATCH_SIZE, TOTAL_FRAMES)) {
      isInitialLoaded = true;
      drawFrame(0);
      updateUISections(0);
      loader.classList.add('loaded');
    }
  }

  function updateLoaderUI() {
    const percent = Math.round((loadedFrames.size / TOTAL_FRAMES) * 100);
    if (loaderProgressText) loaderProgressText.textContent = `${percent}%`;
    if (loaderBarFill) loaderBarFill.style.width = `${percent}%`;
  }

  function processQueue() {
    while (activeDownloads < CONCURRENT_DOWNLOADS && pendingQueue.length > 0) {
      const index = pendingQueue.shift();
      activeDownloads++;

      const img = new Image();
      img.src = getFrameSrc(index);

      img.onload = () => {
        images[index] = img;
        loadedFrames.add(index);
        activeDownloads--;

        updateLoaderUI();
        checkInitialLoadCompletion();

        const currentTargetFrame = Math.round(currentProgress * (TOTAL_FRAMES - 1));
        if (currentTargetFrame === index) {
          drawFrame(index);
        }

        processQueue();
      };

      img.onerror = () => {
        console.warn(`Failed to load frame ${index}`);
        activeDownloads--;
        processQueue();
      };
    }
  }

  function initializeLoader() {
    const priorityQueue = [];
    priorityQueue.push(0);

    for (let i = 1; i <= INITIAL_BATCH_SIZE && i < TOTAL_FRAMES; i++) {
      priorityQueue.push(i);
    }

    for (let i = INITIAL_BATCH_SIZE + 1; i < TOTAL_FRAMES; i += 8) {
      if (!priorityQueue.includes(i)) priorityQueue.push(i);
    }

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      if (!priorityQueue.includes(i)) priorityQueue.push(i);
    }

    pendingQueue = priorityQueue;
    processQueue();
  }

  // Smooth Scroll Trigger Helper
  function scrollToProgress(targetRatio) {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const dest = targetRatio * maxScroll;
    window.scrollTo({
      top: dest,
      behavior: 'smooth'
    });
  }

  // Bind interactive triggers
  document.querySelectorAll('[data-target]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetRatio = parseFloat(btn.getAttribute('data-target'));
      if (!isNaN(targetRatio)) {
        scrollToProgress(targetRatio);
        if (navMenu && navMenu.classList.contains('open')) {
          navMenu.classList.remove('open');
        }
      }
    });
  });

  // Mobile menu toggle
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
  }

  // Setup Event Listeners
  window.addEventListener('scroll', updateScrollTarget, { passive: true });
  window.addEventListener('resize', resizeCanvas, { passive: true });

  // Initialize
  resizeCanvas();
  updateScrollTarget();
  initializeLoader();
  updateUISections(0);
  requestAnimationFrame(animate);
})();
