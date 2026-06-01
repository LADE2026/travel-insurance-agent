// =============================================
// PASSENGERS MODULE
// =============================================

const PassengersModule = (() => {
  let passengers = [{ age: 30 }]; // start with 1 passenger

  function init() {
    document.getElementById('openPassengers').addEventListener('click', open);
    document.getElementById('closePassengers').addEventListener('click', close);
    document.getElementById('cancelPassengers').addEventListener('click', close);
    document.getElementById('confirmPassengers').addEventListener('click', confirm);
    document.getElementById('addPassenger').addEventListener('click', addPassenger);
    document.getElementById('passengersModal').addEventListener('click', e => {
      if (e.target.id === 'passengersModal') close();
    });
  }

  function open() {
    updateLabels();
    renderList();
    document.getElementById('passengersModal').style.display = 'flex';
  }

  function close() {
    document.getElementById('passengersModal').style.display = 'none';
  }

  function updateLabels() {
    const lang = window.appState ? window.appState.lang : 'es';
    const i = I18N[lang] || I18N.es;
    document.getElementById('pasModalTitle').textContent = i.pasTitle;
    document.getElementById('addPasLabel').textContent = i.addPas.replace('+ ','');
    document.getElementById('confirmPasLabel').textContent = i.confirmPas;
    document.getElementById('cancelPasLabel').textContent = i.cancelPas;
  }

  function addPassenger() {
    if (passengers.length >= 9) return;
    passengers.push({ age: 30 });
    renderList();
  }

  function removePassenger(index) {
    if (passengers.length <= 1) return;
    passengers.splice(index, 1);
    renderList();
  }

  function renderList() {
    const lang = window.appState ? window.appState.lang : 'es';
    const i = I18N[lang] || I18N.es;
    const list = document.getElementById('passengerList');
    list.innerHTML = '';

    passengers.forEach((p, idx) => {
      const row = document.createElement('div');
      row.className = 'pas-row';

      const label = document.createElement('div');
      label.className = 'pas-row-label';
      label.innerHTML = `<span class="pas-num">${idx + 1}</span> ${i.traveler.charAt(0).toUpperCase() + i.traveler.slice(1)}`;

      const controls = document.createElement('div');
      controls.className = 'pas-controls';

      // Age stepper
      const ageStepper = document.createElement('div');
      ageStepper.className = 'age-stepper';

      const minusBtn = document.createElement('button');
      minusBtn.className = 'stepper-btn';
      minusBtn.textContent = '−';
      minusBtn.addEventListener('click', () => {
        if (p.age > 0) { p.age--; ageDisplay.textContent = `${p.age} ${i.ageUnit}`; }
      });

      const ageDisplay = document.createElement('span');
      ageDisplay.className = 'stepper-val';
      ageDisplay.textContent = `${p.age} ${i.ageUnit}`;

      const plusBtn = document.createElement('button');
      plusBtn.className = 'stepper-btn';
      plusBtn.textContent = '+';
      plusBtn.addEventListener('click', () => {
        if (p.age < 99) { p.age++; ageDisplay.textContent = `${p.age} ${i.ageUnit}`; }
      });

      ageStepper.appendChild(minusBtn);
      ageStepper.appendChild(ageDisplay);
      ageStepper.appendChild(plusBtn);

      // Remove button
      if (passengers.length > 1) {
        const removeBtn = document.createElement('button');
        removeBtn.className = 'pas-remove';
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', () => removePassenger(idx));
        controls.appendChild(ageStepper);
        controls.appendChild(removeBtn);
      } else {
        controls.appendChild(ageStepper);
      }

      row.appendChild(label);
      row.appendChild(controls);
      list.appendChild(row);
    });

    // Update add button visibility
    document.getElementById('addPassenger').style.display = passengers.length >= 9 ? 'none' : 'block';
  }

  function confirm() {
    const lang = window.appState ? window.appState.lang : 'es';
    const i = I18N[lang] || I18N.es;
    const count = passengers.length;
    const ages = passengers.map(p => p.age).join(', ');

    // Update booking bar
    const label = count === 1
      ? `1 ${i.traveler}`
      : `${count} ${i.travelers}`;
    document.getElementById('pasValue').textContent = label;

    // Save to app state
    if (window.appState) {
      window.appState.quoteData.travelers = count.toString();
      window.appState.quoteData.ages = ages;
    }

    close();

    // Send to chat
    let msg;
    if (lang === 'es') msg = `${count} ${count === 1 ? 'viajero' : 'viajeros'}, edades: ${ages} años`;
    else if (lang === 'fr') msg = `${count} ${count === 1 ? 'voyageur' : 'voyageurs'}, âges: ${ages} ans`;
    else if (lang === 'pt') msg = `${count} ${count === 1 ? 'viajante' : 'viajantes'}, idades: ${ages} anos`;
    else if (lang === 'de') msg = `${count} ${count === 1 ? 'Reisender' : 'Reisende'}, Alter: ${ages} Jahre`;
    else msg = `${count} ${count === 1 ? 'traveler' : 'travelers'}, ages: ${ages}`;

    if (window.handleUserMessage) window.handleUserMessage(msg);
  }

  return { init };
})();
