let devocionales = [];
let currentDayIndex = 0;
let completedDays = new Set();
let isAnimating = false; // guard against rapid navigation during transitions

const DOM = {
  viewDaily: document.getElementById('view-daily'),
  viewIndex: document.getElementById('view-index'),
  btnIndex: document.getElementById('btn-index'),
  btnBackDaily: document.getElementById('btn-back-daily'),
  devoContainer: document.getElementById('devotional-container'),
  streakCount: document.getElementById('streak-count'),
  btnPrev: document.getElementById('btn-prev'),
  btnNext: document.getElementById('btn-next'),
  indexList: document.getElementById('index-list'),
  progressFill: document.getElementById('progress-fill'),
  scrollWrapper: document.querySelector('.devotional-scroll-wrapper')
};

// ─── INIT ────────────────────────────────────────────────────────────────────
async function init() {
  loadState();
  await fetchDevocionales();
  setupEventListeners();
  renderCurrentDay();
  initParticles();
  initParallax();
}

// ─── STATE ───────────────────────────────────────────────────────────────────
function loadState() {
  const savedIndex = localStorage.getItem('ccd_currentIndex');
  if (savedIndex !== null) currentDayIndex = parseInt(savedIndex, 10);
  const savedCompleted = localStorage.getItem('ccd_completedDays');
  if (savedCompleted) completedDays = new Set(JSON.parse(savedCompleted));
}

function saveState() {
  localStorage.setItem('ccd_currentIndex', currentDayIndex);
  localStorage.setItem('ccd_completedDays', JSON.stringify([...completedDays]));
}

// ─── DATA ────────────────────────────────────────────────────────────────────
async function fetchDevocionales() {
  try {
    const res = await fetch('./data/devocionales.json');
    devocionales = await res.json();
  } catch (err) {
    console.error("Failed to load devocionales", err);
    DOM.devoContainer.innerHTML = '<p style="color:#F87171">Error cargando los devocionales. Intenta recargar la página.</p>';
  }
}

// ─── TOUCH / SWIPE ───────────────────────────────────────────────────────────
let touchStartX = 0;
let touchEndX = 0;

// ─── EVENT LISTENERS ─────────────────────────────────────────────────────────
function setupEventListeners() {
  DOM.btnIndex.addEventListener('click', showIndex);
  DOM.btnBackDaily.addEventListener('click', showDaily);
  DOM.btnPrev.addEventListener('click', goToPrev);
  DOM.btnNext.addEventListener('click', goToNext);

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (DOM.viewIndex.classList.contains('hidden')) {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    }
  });

  // Swipe navigation
  DOM.viewDaily.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  DOM.viewDaily.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });
}

function handleSwipe() {
  const swipeThreshold = 50;
  if (touchEndX < touchStartX - swipeThreshold) goToNext();
  if (touchEndX > touchStartX + swipeThreshold) goToPrev();
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
function goToPrev() {
  if (isAnimating || currentDayIndex === 0) return;
  transitionTo(currentDayIndex - 1, 'prev');
}

function goToNext() {
  if (isAnimating) return;
  completedDays.add(currentDayIndex);
  if (currentDayIndex < devocionales.length - 1) {
    transitionTo(currentDayIndex + 1, 'next');
  } else {
    saveState();
    renderCurrentDay(); // already at last, just refresh
  }
}

/**
 * Page-turn transition:
 *  direction = 'next' → current slides out left, new slides in from right
 *  direction = 'prev' → current slides out right, new slides in from left
 */
function transitionTo(newIndex, direction) {
  isAnimating = true;
  const outClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
  const inClass  = direction === 'next' ? 'slide-in-right'  : 'slide-in-left';

  DOM.devoContainer.classList.add(outClass);

  DOM.devoContainer.addEventListener('animationend', function onOut() {
    DOM.devoContainer.removeEventListener('animationend', onOut);
    DOM.devoContainer.classList.remove(outClass);

    currentDayIndex = newIndex;
    saveState();
    renderCurrentDay(inClass);

    DOM.devoContainer.addEventListener('animationend', function onIn() {
      DOM.devoContainer.removeEventListener('animationend', onIn);
      DOM.devoContainer.classList.remove(inClass);
      isAnimating = false;
    }, { once: true });
  }, { once: true });
}

// ─── RENDER ──────────────────────────────────────────────────────────────────
function formatContent(text) {
  return text.split('\n').filter(p => p.trim()).map(p => {
    // Wrap each word in a span for the word-reveal animation
    const words = p.split(' ').map((word, i) => {
      const delay = (i * 0.04).toFixed(2); // stagger 40ms per word
      return `<span class="word" style="animation-delay:${delay}s">${word}</span>`;
    }).join(' ');
    return `<p>${words}</p>`;
  }).join('');
}

function renderCurrentDay(animClass = 'animate-content') {
  if (!devocionales.length) return;
  const dev = devocionales[currentDayIndex];

  // Remove all animation classes, force reflow, then apply new one
  DOM.devoContainer.classList.remove('animate-content', 'slide-in-right', 'slide-in-left');
  void DOM.devoContainer.offsetWidth;
  DOM.devoContainer.classList.add(animClass);

  DOM.devoContainer.innerHTML = `
    <span class="ref-badge">Día ${dev.id}</span>
    <div class="devo-content">
      <span class="bible-ref">${dev.reference}</span>
      ${formatContent(dev.content)}
    </div>
  `;

  if (DOM.scrollWrapper) DOM.scrollWrapper.scrollTop = 0;

  // Update controls
  DOM.btnPrev.disabled = currentDayIndex === 0;
  const isLast = currentDayIndex === devocionales.length - 1;
  DOM.btnNext.innerHTML = isLast
    ? 'Completado ✓'
    : `Siguiente <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>`;

  DOM.streakCount.textContent = `Día ${currentDayIndex + 1} de ${devocionales.length}`;

  const progressPercent = ((currentDayIndex + 1) / devocionales.length) * 100;
  if (DOM.progressFill) DOM.progressFill.style.width = `${progressPercent}%`;
}

// ─── INDEX VIEW ──────────────────────────────────────────────────────────────
function showIndex() {
  DOM.viewDaily.classList.add('hidden');
  DOM.viewIndex.classList.remove('hidden');

  DOM.indexList.innerHTML = devocionales.map((dev, idx) => {
    const isCompleted = completedDays.has(idx);
    const isCurrent   = idx === currentDayIndex;
    let statusHTML = '';
    if (isCompleted) statusHTML = '<span class="index-status">✓</span>';
    else if (isCurrent) statusHTML = '<span class="index-status" style="opacity:0.6; background:transparent; border: 1px solid var(--clr-gold)">▶</span>';

    return `
      <div class="index-card glass-panel ${isCompleted ? 'completed' : ''}" data-idx="${idx}" role="listitem" tabindex="0" aria-label="Día ${dev.id}: ${dev.reference}">
        <div style="flex:1; min-width:0; padding-right:1rem;">
          <h4 class="index-card-title">Día ${dev.id}</h4>
          <p class="index-card-preview">${dev.reference}</p>
        </div>
        ${statusHTML}
      </div>
    `;
  }).join('');

  DOM.indexList.querySelectorAll('.index-card').forEach(card => {
    card.addEventListener('click', () => {
      currentDayIndex = parseInt(card.getAttribute('data-idx'), 10);
      saveState();
      renderCurrentDay();
      showDaily();
    });
  });
}

function showDaily() {
  DOM.viewIndex.classList.add('hidden');
  DOM.viewDaily.classList.remove('hidden');
  DOM.devoContainer.classList.remove('animate-content');
  void DOM.devoContainer.offsetWidth;
  DOM.devoContainer.classList.add('animate-content');
}

// ─── PARALLAX ORBS ───────────────────────────────────────────────────────────
function initParallax() {
  const scrollEl = document.querySelector('.devotional-scroll-wrapper');
  if (!scrollEl) return;
  scrollEl.addEventListener('scroll', () => {
    const offset = scrollEl.scrollTop * 0.15; // 15% of scroll depth
    document.documentElement.style.setProperty('--parallax-offset', `-${offset}px`);
  }, { passive: true });
}

// ─── PARTICLE SYSTEM (light dust) ────────────────────────────────────────────
function initParticles() {
  const canvas = document.createElement('canvas');
  canvas.id = 'particle-canvas';
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');
  let W, H, particles;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticles() {
    const count = Math.floor((W * H) / 18000); // density relative to screen size
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,       // radius 0.3–1.8px
      speed: Math.random() * 0.25 + 0.05, // drift speed
      opacity: Math.random() * 0.5 + 0.1,
      drift: (Math.random() - 0.5) * 0.3  // slight horizontal drift
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`; // gold dust
      ctx.fill();

      // Move upward with gentle drift
      p.y -= p.speed;
      p.x += p.drift;

      // Wrap around
      if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
    });
    requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();

  window.addEventListener('resize', () => { resize(); createParticles(); });
}

// ─── BOOT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
