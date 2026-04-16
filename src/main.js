let devocionales = [];
let currentDayIndex = 0;
let completedDays = new Set();

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
  progressFill: document.getElementById('progress-fill')
};

async function init() {
  loadState();
  await fetchDevocionales();
  setupEventListeners();
  renderCurrentDay();
}

function loadState() {
  const savedIndex = localStorage.getItem('ccd_currentIndex');
  if (savedIndex !== null) currentDayIndex = parseInt(savedIndex, 10);
  
  const savedCompleted = localStorage.getItem('ccd_completedDays');
  if (savedCompleted) {
    completedDays = new Set(JSON.parse(savedCompleted));
  }
}

function saveState() {
  localStorage.setItem('ccd_currentIndex', currentDayIndex);
  localStorage.setItem('ccd_completedDays', JSON.stringify([...completedDays]));
}

async function fetchDevocionales() {
  try {
    const res = await fetch('./data/devocionales.json');
    devocionales = await res.json();
  } catch (err) {
    console.error("Failed to load devocionales", err);
    DOM.devoContainer.innerHTML = '<p style="color:#F87171">Error cargando los devocionales. Intenta recargar la página.</p>';
  }
}

function setupEventListeners() {
  DOM.btnIndex.addEventListener('click', showIndex);
  DOM.btnBackDaily.addEventListener('click', showDaily);
  
  DOM.btnPrev.addEventListener('click', () => {
    if (currentDayIndex > 0) {
      currentDayIndex--;
      saveState();
      renderCurrentDay();
    }
  });
  
  DOM.btnNext.addEventListener('click', () => {
    // Mark current as complete
    completedDays.add(currentDayIndex);
    
    if (currentDayIndex < devocionales.length - 1) {
      currentDayIndex++;
    }
    saveState();
    renderCurrentDay();
  });
}

function formatContent(text) {
  return text.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
}

function renderCurrentDay() {
  if (!devocionales.length) return;
  
  const dev = devocionales[currentDayIndex];
  
  // Re-trigger entrance animation
  DOM.devoContainer.classList.remove('animate-content');
  void DOM.devoContainer.offsetWidth; // force reflow
  DOM.devoContainer.classList.add('animate-content');

  // Render card
  DOM.devoContainer.innerHTML = `
    <span class="ref-badge">Día ${dev.id}</span>
    <div class="devo-content">
      <span class="bible-ref">${dev.reference}</span>
      ${formatContent(dev.content)}
    </div>
  `;
  
  // Update controls
  DOM.btnPrev.disabled = currentDayIndex === 0;
  
  const isLast = currentDayIndex === devocionales.length - 1;
  DOM.btnNext.innerHTML = isLast ? 'Completado ✓' : `Siguiente <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>`;
  
  DOM.streakCount.textContent = `Día ${currentDayIndex + 1} de ${devocionales.length}`;
  
  // Update visual progress bar
  const progressPercent = ((currentDayIndex + 1) / devocionales.length) * 100;
  if (DOM.progressFill) DOM.progressFill.style.width = `${progressPercent}%`;
}

function showIndex() {
  DOM.viewDaily.classList.add('hidden');
  DOM.viewIndex.classList.remove('hidden');
  
  // Render list
  DOM.indexList.innerHTML = devocionales.map((dev, idx) => {
    const isCompleted = completedDays.has(idx);
    const isCurrent = idx === currentDayIndex;
    
    let statusHTML = '';
    if (isCompleted) statusHTML = '<span class="index-status">✓</span>';
    else if (isCurrent) statusHTML = '<span class="index-status" style="opacity:0.6; background:transparent; border: 1px solid var(--clr-gold)">▶</span>';
    
    return `
      <div class="index-card glass-panel ${isCompleted ? 'completed' : ''}" data-idx="${idx}">
        <div style="flex:1; min-width:0; padding-right:1rem;">
          <h4 class="index-card-title">Día ${dev.id}</h4>
          <p class="index-card-preview">${dev.reference}</p>
        </div>
        ${statusHTML}
      </div>
    `;
  }).join('');
  
  // Attach listeners
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
  
  // Quick re-trigger to ensure it looks fancy when coming back
  DOM.devoContainer.classList.remove('animate-content');
  void DOM.devoContainer.offsetWidth; 
  DOM.devoContainer.classList.add('animate-content');
}

// Boot
document.addEventListener('DOMContentLoaded', init);
