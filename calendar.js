// =============================================
// CALENDAR MODULE
// =============================================

const CalendarModule = (() => {
  let selectedDep = null;
  let selectedRet = null;
  let activePicker = 'dep'; // 'dep' or 'ret'
  let currentYear, currentMonth;

  function init() {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();

    document.getElementById('openCalendar').addEventListener('click', open);
    document.getElementById('closeCalendar').addEventListener('click', close);
    document.getElementById('cancelDates').addEventListener('click', close);
    document.getElementById('confirmDates').addEventListener('click', confirm);
    document.getElementById('tabDep').addEventListener('click', () => switchTab('dep'));
    document.getElementById('tabRet').addEventListener('click', () => switchTab('ret'));
    document.getElementById('calendarModal').addEventListener('click', e => {
      if (e.target.id === 'calendarModal') close();
    });
  }

  function open() {
    updateLabels();
    render();
    document.getElementById('calendarModal').style.display = 'flex';
  }

  function close() {
    document.getElementById('calendarModal').style.display = 'none';
  }

  function updateLabels() {
    const lang = window.appState ? window.appState.lang : 'es';
    const i = I18N[lang] || I18N.es;
    document.getElementById('calModalTitle').textContent = i.calTitle;
    document.getElementById('tabDepLabel').textContent = i.tabDep.replace(/^[^\s]+\s/, '');
    document.getElementById('tabRetLabel').textContent = i.tabRet.replace(/^[^\s]+\s/, '');
    document.getElementById('depLabel').textContent = i.depLabel;
    document.getElementById('retLabel').textContent = i.retLabel;
    document.getElementById('confirmDatesLabel').textContent = i.confirmDates;
    document.getElementById('cancelDatesLabel').textContent = i.cancelDates;
  }

  function switchTab(tab) {
    activePicker = tab;
    document.getElementById('tabDep').classList.toggle('active', tab === 'dep');
    document.getElementById('tabRet').classList.toggle('active', tab === 'ret');
    document.getElementById('depBox').classList.toggle('cal-box-active', tab === 'dep');
    document.getElementById('retBox').classList.toggle('cal-box-active', tab === 'ret');
    render();
  }

  function render() {
    const lang = window.appState ? window.appState.lang : 'es';
    const i = I18N[lang] || I18N.es;
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    // Month navigation header
    const nav = document.createElement('div');
    nav.className = 'cal-nav';
    nav.innerHTML = `
      <button class="cal-nav-btn" id="calPrev">‹</button>
      <span class="cal-month-label">${i.months[currentMonth]} ${currentYear}</span>
      <button class="cal-nav-btn" id="calNext">›</button>
    `;
    grid.appendChild(nav);

    document.getElementById('calPrev').addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      render();
    });
    document.getElementById('calNext').addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      render();
    });

    // Day headers
    const dayRow = document.createElement('div');
    dayRow.className = 'cal-day-headers';
    i.days.forEach(d => {
      const cell = document.createElement('div');
      cell.className = 'cal-day-header';
      cell.textContent = d;
      dayRow.appendChild(cell);
    });
    grid.appendChild(dayRow);

    // Days
    const daysGrid = document.createElement('div');
    daysGrid.className = 'cal-days';

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day cal-day-empty';
      daysGrid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(currentYear, currentMonth, d);
      const cell = document.createElement('div');
      cell.className = 'cal-day';
      cell.textContent = d;

      const isPast = date < today;
      const isDepSelected = selectedDep && sameDay(date, selectedDep);
      const isRetSelected = selectedRet && sameDay(date, selectedRet);
      const isInRange = selectedDep && selectedRet && date > selectedDep && date < selectedRet;
      const isToday = sameDay(date, today);

      if (isPast) cell.classList.add('cal-day-past');
      if (isToday) cell.classList.add('cal-day-today');
      if (isDepSelected) cell.classList.add('cal-day-dep');
      if (isRetSelected) cell.classList.add('cal-day-ret');
      if (isInRange) cell.classList.add('cal-day-range');

      if (!isPast) {
        cell.addEventListener('click', () => selectDay(date));
      }

      daysGrid.appendChild(cell);
    }

    grid.appendChild(daysGrid);
    updateDisplayBoxes();
  }

  function selectDay(date) {
    if (activePicker === 'dep') {
      selectedDep = date;
      if (selectedRet && selectedRet <= selectedDep) selectedRet = null;
      switchTab('ret');
    } else {
      if (selectedDep && date <= selectedDep) {
        selectedDep = date;
        selectedRet = null;
        switchTab('ret');
      } else {
        selectedRet = date;
      }
    }
    render();
  }

  function updateDisplayBoxes() {
    const lang = window.appState ? window.appState.lang : 'es';
    const i = I18N[lang] || I18N.es;
    document.getElementById('depDisplay').textContent = selectedDep ? formatDate(selectedDep, i) : '—';
    document.getElementById('retDisplay').textContent = selectedRet ? formatDate(selectedRet, i) : '—';
  }

  function formatDate(date, i) {
    return `${date.getDate()} ${i.months[date.getMonth()].slice(0,3)} ${date.getFullYear()}`;
  }

  function formatDateShort(date) {
    const d = date.getDate().toString().padStart(2,'0');
    const m = (date.getMonth()+1).toString().padStart(2,'0');
    return `${d}/${m}/${date.getFullYear()}`;
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  function confirm() {
    if (!selectedDep || !selectedRet) return;
    const depStr = formatDateShort(selectedDep);
    const retStr = formatDateShort(selectedRet);

    // Update booking bar
    document.getElementById('calValue').textContent = `${depStr} → ${retStr}`;

    // Save to app state
    if (window.appState) {
      window.appState.quoteData.departureDate = depStr;
      window.appState.quoteData.returnDate = retStr;
    }

    close();

    // Send message to chat
    const lang = window.appState ? window.appState.lang : 'es';
    const msg = lang === 'es'
      ? `Fechas: salida ${depStr}, regreso ${retStr}`
      : lang === 'fr'
      ? `Dates: départ ${depStr}, retour ${retStr}`
      : lang === 'pt'
      ? `Datas: partida ${depStr}, retorno ${retStr}`
      : lang === 'de'
      ? `Daten: Abflug ${depStr}, Rückkehr ${retStr}`
      : `Dates: departure ${depStr}, return ${retStr}`;

    if (window.handleUserMessage) window.handleUserMessage(msg);
  }

  return { init };
})();
