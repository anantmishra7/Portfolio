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

    // Trigger Stats Counter Animation when entering skills section
    if (progress >= 0.18 && progress <= 0.45) {
      triggerStatsCounter();
    }

    // Update active nav link indicator
    navLinks.forEach((link, idx) => {
      if (idx === activeNavIndex) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Animated Stats Counter Logic
  let statsAnimated = false;
  function triggerStatsCounter() {
    if (statsAnimated) return;
    const statNumbers = document.querySelectorAll('.stat-number');
    if (!statNumbers.length) return;

    statsAnimated = true;
    statNumbers.forEach((el) => {
      const target = parseInt(el.getAttribute('data-count'), 10);
      const hasPlus = el.innerHTML.includes('+');
      let count = 0;
      const duration = 1400;
      const increment = Math.max(1, Math.ceil(target / (duration / 25)));

      const timer = setInterval(() => {
        count += increment;
        if (count >= target) {
          count = target;
          clearInterval(timer);
        }
        el.innerHTML = `${count}${hasPlus ? '<span>+</span>' : ''}`;
      }, 25);
    });
  }

  // Dynamic frame priority boosting on fast scroll
  let lastScrollTime = Date.now();
  let lastScrollProgress = 0;

  function updateScrollTarget() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) {
      targetProgress = 0;
    } else {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      targetProgress = Math.min(1, Math.max(0, scrollY / maxScroll));
    }

    // Prioritize frame downloading near current target frame
    const targetFrame = Math.round(targetProgress * (TOTAL_FRAMES - 1));
    if (!loadedFrames.has(targetFrame) && !pendingQueue.includes(targetFrame)) {
      pendingQueue.unshift(targetFrame);
      processQueue();
    }
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

  // Project Modal Data & Interactivity
  const projectDetailsData = {
    'canvas-portfolio': {
      tag: 'Interactive Web & Graphics',
      title: '3D Canvas Portfolio Architecture',
      description: 'A scroll-choreographed interactive personal portfolio website streaming 240 high-definition pre-rendered frames synchronized to high-frequency scroll input.',
      highlights: [
        '60 FPS frame interpolation engine with dynamic LERP smoothing',
        'Glassmorphic UI layer with responsive CSS backdrop filters',
        'Priority frame loading queue with fallback frame matching',
        'Zero layout-shift virtual scroll runway architecture'
      ],
      tech: ['Canvas API', 'JavaScript ES6+', 'CSS Glassmorphism', 'HTML5', 'Netlify'],
      github: 'https://github.com/anantmishra7/Portfolio'
    },
    'leetcode-dsa': {
      tag: 'Algorithms & Competitive Programming',
      title: 'My-LeetCode & Algorithmic Solutions',
      description: 'Comprehensive repository containing optimized solution implementations for 350+ data structure and algorithm challenges.',
      highlights: [
        'Covering Dynamic Programming, Graph Theory, Trees & Backtracking',
        'Optimized space and time complexity bounds in Modern C++',
        'Structured categorization according to problem topics and difficulty levels',
        'Used for competitive programming practice & technical interview readiness'
      ],
      tech: ['C++', 'Data Structures', 'Algorithms', 'Dynamic Programming', 'Git'],
      github: 'https://github.com/anantmishra7/My-Leetcode'
    },
    'ai-sustainability': {
      tag: 'Applied AI & Environmental ESG',
      title: 'Applied AI Sustainability Engine',
      description: 'Real-world AI project developed during the 1M1B Green Skills & Applied AI internship supported by Microsoft.',
      highlights: [
        'Applied machine learning & prompt engineering to analyze ESG carbon metrics',
        'Designed sustainability assessment workflows for climate action',
        'Completed 70+ hours of experiential learning & technical presentation',
        'Integrated environmental data auditing with automated optimization suggestions'
      ],
      tech: ['Python', 'Prompt Engineering', 'Applied AI', 'ESG Analytics', 'Microsoft Tools'],
      github: 'https://github.com/anantmishra7'
    }
  };

  const projectModal = document.getElementById('project-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalTag = document.getElementById('modal-tag');
  const modalTitle = document.getElementById('modal-title');
  const modalDescription = document.getElementById('modal-description');
  const modalHighlights = document.getElementById('modal-highlights');
  const modalTech = document.getElementById('modal-tech');
  const modalLinkGithub = document.getElementById('modal-link-github');

  function openProjectModal(projectId) {
    const data = projectDetailsData[projectId];
    if (!data || !projectModal) return;

    if (modalTag) modalTag.textContent = data.tag;
    if (modalTitle) modalTitle.textContent = data.title;
    if (modalDescription) modalDescription.textContent = data.description;
    
    if (modalHighlights) {
      modalHighlights.innerHTML = data.highlights
        .map((h) => `<li>${h}</li>`)
        .join('');
    }

    if (modalTech) {
      modalTech.innerHTML = data.tech
        .map((t) => `<span class="tech-badge">${t}</span>`)
        .join('');
    }

    if (modalLinkGithub) {
      modalLinkGithub.href = data.github;
    }

    projectModal.classList.add('open');
    projectModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeProjectModal() {
    if (!projectModal) return;
    projectModal.classList.remove('open');
    projectModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-modal]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const modalId = btn.getAttribute('data-modal');
      openProjectModal(modalId);
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeProjectModal);
  }

  if (projectModal) {
    projectModal.addEventListener('click', (e) => {
      if (e.target === projectModal) {
        closeProjectModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && projectModal && projectModal.classList.contains('open')) {
      closeProjectModal();
    }
  });

  // Toast Notification System
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  // Interactive Quick Contact Form Handler
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('form-name')?.value.trim();
      const email = document.getElementById('form-email')?.value.trim();
      const subject = document.getElementById('form-subject')?.value.trim();
      const message = document.getElementById('form-message')?.value.trim();

      if (!name || !email || !message) {
        showToast('Please fill out all required fields.');
        return;
      }

      const submitBtn = document.getElementById('btn-submit-form');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>SENDING...</span>';
      }

      try {
        // Send data directly to Anant's inbox via FormSubmit API
        const response = await fetch('https://formsubmit.co/ajax/anantm408@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            email: email,
            _replyto: email,
            _subject: `Portfolio Message from ${name}: ${subject || 'Inquiry'}`,
            subject: subject || 'Portfolio Contact',
            message: message,
            _template: 'table',
            _captcha: 'false'
          })
        });

        const data = await response.json();

        if (response.ok && (data.success === 'true' || data.success === true || data.message)) {
          showToast(`Thank you, ${name}! Message delivered to anantm408@gmail.com.`);
          contactForm.reset();
        } else {
          showToast(`Thank you, ${name}! Your message has been sent.`);
          contactForm.reset();
        }
      } catch (err) {
        console.warn('FormSubmit network error, falling back to mailto:', err);
        const mailtoUri = `mailto:anantm408@gmail.com?subject=${encodeURIComponent(subject || 'Portfolio Inquiry')}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
        window.location.href = mailtoUri;
        showToast('Delivering via default mail client...');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>SEND MESSAGE</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 6px;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
        }
      }
    });
  }

  // Bind interactive triggers for nav & CTA scroll buttons
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

