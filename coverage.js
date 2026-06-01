// =============================================
// COVERAGE TYPE MODULE
// =============================================

const CoverageModule = (() => {
  let selected = null;

  function init() {
    document.getElementById('openCoverage').addEventListener('click', open);
    document.getElementById('closeCoverage').addEventListener('click', close);
    document.getElementById('cancelCoverage').addEventListener('click', close);
    document.getElementById('coverageModal').addEventListener('click', e => {
      if (e.target.id === 'coverageModal') close();
    });
  }

  function open() {
    updateLabels();
    renderOptions();
    document.getElementById('coverageModal').style.display = 'flex';
  }

  function close() {
    document.getElementById('coverageModal').style.display = 'none';
  }

  function updateLabels() {
    const lang = window.appState ? window.appState.lang : 'es';
    const i = I18N[lang] || I18N.es;
    document.getElementById('covModalTitle').textContent = i.covModalTitle;
    document.getElementById('covModalSub').textContent = i.covModalSub;
    document.getElementById('cancelCovLabel').textContent = i.cancelCov;
  }

  function renderOptions() {
    const lang = window.appState ? window.appState.lang : 'es';
    const i = I18N[lang] || I18N.es;
    const container = document.getElementById('covOptions');
    container.innerHTML = '';

    i.covOptions.forEach(opt => {
      const card = document.createElement('button');
      card.className = `cov-card ${selected === opt.id ? 'cov-card-active' : ''}`;
      card.innerHTML = `
        <span class="cov-icon">${opt.icon}</span>
        <div class="cov-text">
          <span class="cov-title">${opt.title}</span>
          <span class="cov-desc">${opt.desc}</span>
        </div>
        <span class="cov-check">${selected === opt.id ? '✓' : ''}</span>
      `;
      card.addEventListener('click', () => selectOption(opt));
      container.appendChild(card);
    });
  }

  function selectOption(opt) {
    selected = opt.id;
    const lang = window.appState ? window.appState.lang : 'es';
    const i = I18N[lang] || I18N.es;

    // Update booking bar
    document.getElementById('covValue').textContent = `${opt.icon} ${opt.title}`;

    // Save to app state
    if (window.appState) {
      window.appState.quoteData.coverageType = opt.title;
    }

    close();

    // Send to chat
    if (window.handleUserMessage) window.handleUserMessage(`${opt.icon} ${opt.title} — ${opt.desc}`);
  }

  return { init };
})();
