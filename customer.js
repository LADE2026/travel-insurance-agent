// =============================================
// CUSTOMER INFO MODULE
// =============================================

const CustomerModule = (() => {
  let currentStep = 1;
  let saved = false;

  const COUNTRIES = [
    'Argentina','Bolivia','Brasil','Chile','Colombia','Costa Rica','Cuba',
    'Ecuador','El Salvador','España','Estados Unidos','Guatemala','Honduras',
    'México','Nicaragua','Panamá','Paraguay','Perú','Puerto Rico',
    'República Dominicana','Uruguay','Venezuela',
    'Alemania','Francia','Italia','Portugal','Reino Unido','Canadá','Australia',
    'Japón','China','India','Corea del Sur','Otro',
  ];

  const LABELS = {
    es: {
      title: '👤 Datos del Cliente', sub: 'Completa tu información personal para la póliza.',
      step1: 'Personal', step2: 'Contacto', step3: 'Documento',
      firstName: 'Nombre', lastName: 'Apellido', birthDate: 'Fecha de nacimiento',
      gender: 'Género', gM: 'Masculino', gF: 'Femenino', gO: 'Otro',
      nationality: 'Nacionalidad', selectCountry: '— Seleccionar país —',
      email: 'Email', phone: 'Teléfono', whatsapp: 'WhatsApp',
      address: 'Dirección', city: 'Ciudad', zip: 'Código Postal',
      docType: 'Tipo de documento', docPassport: 'Pasaporte', docId: 'Cédula / DNI', docRes: 'Residencia',
      docNum: 'Número de documento', docExp: 'Vencimiento del documento',
      emergName: 'Contacto de emergencia', emergPhone: 'Teléfono de emergencia',
      consent: 'Acepto los <a href="#" onclick="return false">Términos y condiciones</a> y la <a href="#" onclick="return false">Política de privacidad</a>.',
      next: 'Siguiente →', back: '← Atrás', save: '✅ Guardar datos',
      custLabel: 'Cliente', custDefault: 'Mis datos', custSaved: 'Datos guardados ✓',
      errRequired: 'Este campo es obligatorio.',
      errEmail: 'Email inválido.',
      errConsent: 'Debes aceptar los términos.',
      savedMsg: (name) => `✅ Datos guardados para **${name}**. Ya puedes proceder al pago.`,
    },
    en: {
      title: '👤 Customer Information', sub: 'Fill in your personal information for the policy.',
      step1: 'Personal', step2: 'Contact', step3: 'Document',
      firstName: 'First name', lastName: 'Last name', birthDate: 'Date of birth',
      gender: 'Gender', gM: 'Male', gF: 'Female', gO: 'Other',
      nationality: 'Nationality', selectCountry: '— Select country —',
      email: 'Email', phone: 'Phone', whatsapp: 'WhatsApp',
      address: 'Address', city: 'City', zip: 'ZIP / Postal code',
      docType: 'Document type', docPassport: 'Passport', docId: 'ID Card', docRes: 'Residence permit',
      docNum: 'Document number', docExp: 'Document expiry',
      emergName: 'Emergency contact', emergPhone: 'Emergency phone',
      consent: 'I accept the <a href="#" onclick="return false">Terms & Conditions</a> and <a href="#" onclick="return false">Privacy Policy</a>.',
      next: 'Next →', back: '← Back', save: '✅ Save information',
      custLabel: 'Customer', custDefault: 'My info', custSaved: 'Info saved ✓',
      errRequired: 'This field is required.',
      errEmail: 'Invalid email.',
      errConsent: 'You must accept the terms.',
      savedMsg: (name) => `✅ Information saved for **${name}**. You can now proceed to payment.`,
    },
    fr: {
      title: '👤 Informations Client', sub: 'Remplissez vos informations personnelles pour la police.',
      step1: 'Personnel', step2: 'Contact', step3: 'Document',
      firstName: 'Prénom', lastName: 'Nom', birthDate: 'Date de naissance',
      gender: 'Genre', gM: 'Masculin', gF: 'Féminin', gO: 'Autre',
      nationality: 'Nationalité', selectCountry: '— Sélectionner un pays —',
      email: 'Email', phone: 'Téléphone', whatsapp: 'WhatsApp',
      address: 'Adresse', city: 'Ville', zip: 'Code postal',
      docType: 'Type de document', docPassport: 'Passeport', docId: 'Carte d\'identité', docRes: 'Titre de séjour',
      docNum: 'Numéro de document', docExp: 'Expiration du document',
      emergName: 'Contact d\'urgence', emergPhone: 'Téléphone d\'urgence',
      consent: 'J\'accepte les <a href="#" onclick="return false">CGU</a> et la <a href="#" onclick="return false">Politique de confidentialité</a>.',
      next: 'Suivant →', back: '← Retour', save: '✅ Enregistrer',
      custLabel: 'Client', custDefault: 'Mes données', custSaved: 'Données sauvegardées ✓',
      errRequired: 'Ce champ est obligatoire.',
      errEmail: 'Email invalide.',
      errConsent: 'Vous devez accepter les conditions.',
      savedMsg: (name) => `✅ Données sauvegardées pour **${name}**. Vous pouvez procéder au paiement.`,
    },
    pt: {
      title: '👤 Dados do Cliente', sub: 'Preencha suas informações pessoais para a apólice.',
      step1: 'Pessoal', step2: 'Contato', step3: 'Documento',
      firstName: 'Nome', lastName: 'Sobrenome', birthDate: 'Data de nascimento',
      gender: 'Gênero', gM: 'Masculino', gF: 'Feminino', gO: 'Outro',
      nationality: 'Nacionalidade', selectCountry: '— Selecionar país —',
      email: 'Email', phone: 'Telefone', whatsapp: 'WhatsApp',
      address: 'Endereço', city: 'Cidade', zip: 'CEP / Código postal',
      docType: 'Tipo de documento', docPassport: 'Passaporte', docId: 'RG / CPF', docRes: 'Residência',
      docNum: 'Número do documento', docExp: 'Vencimento do documento',
      emergName: 'Contato de emergência', emergPhone: 'Telefone de emergência',
      consent: 'Aceito os <a href="#" onclick="return false">Termos e Condições</a> e a <a href="#" onclick="return false">Política de Privacidade</a>.',
      next: 'Próximo →', back: '← Voltar', save: '✅ Salvar dados',
      custLabel: 'Cliente', custDefault: 'Meus dados', custSaved: 'Dados salvos ✓',
      errRequired: 'Este campo é obrigatório.',
      errEmail: 'Email inválido.',
      errConsent: 'Você deve aceitar os termos.',
      savedMsg: (name) => `✅ Dados salvos para **${name}**. Você pode prosseguir para o pagamento.`,
    },
    de: {
      title: '👤 Kundendaten', sub: 'Füllen Sie Ihre persönlichen Daten für die Police aus.',
      step1: 'Persönlich', step2: 'Kontakt', step3: 'Dokument',
      firstName: 'Vorname', lastName: 'Nachname', birthDate: 'Geburtsdatum',
      gender: 'Geschlecht', gM: 'Männlich', gF: 'Weiblich', gO: 'Divers',
      nationality: 'Nationalität', selectCountry: '— Land auswählen —',
      email: 'Email', phone: 'Telefon', whatsapp: 'WhatsApp',
      address: 'Adresse', city: 'Stadt', zip: 'Postleitzahl',
      docType: 'Dokumententyp', docPassport: 'Reisepass', docId: 'Personalausweis', docRes: 'Aufenthaltserlaubnis',
      docNum: 'Dokumentennummer', docExp: 'Ablaufdatum',
      emergName: 'Notfallkontakt', emergPhone: 'Notfalltelefon',
      consent: 'Ich akzeptiere die <a href="#" onclick="return false">AGB</a> und <a href="#" onclick="return false">Datenschutzerklärung</a>.',
      next: 'Weiter →', back: '← Zurück', save: '✅ Daten speichern',
      custLabel: 'Kunde', custDefault: 'Meine Daten', custSaved: 'Daten gespeichert ✓',
      errRequired: 'Dieses Feld ist erforderlich.',
      errEmail: 'Ungültige Email.',
      errConsent: 'Sie müssen die Bedingungen akzeptieren.',
      savedMsg: (name) => `✅ Daten gespeichert für **${name}**. Sie können jetzt zur Zahlung fortfahren.`,
    },
  };

  function lang() { return (window.appState && window.appState.lang) || 'es'; }
  function L() { return LABELS[lang()] || LABELS.es; }

  function init() {
    document.getElementById('openCustomer').addEventListener('click', open);
    document.getElementById('closeCustomer').addEventListener('click', close);
    document.getElementById('customerModal').addEventListener('click', e => {
      if (e.target.id === 'customerModal') close();
    });
    document.getElementById('step1Next').addEventListener('click', () => goStep(2));
    document.getElementById('step2Back').addEventListener('click', () => goStep(1));
    document.getElementById('step2Next').addEventListener('click', () => goStep(3));
    document.getElementById('step3Back').addEventListener('click', () => goStep(2));
    document.getElementById('custSave').addEventListener('click', save);

    populateCountries();
  }

  function populateCountries() {
    const sel = document.getElementById('custNationality');
    sel.innerHTML = '';
    const l = L();
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = l.selectCountry;
    sel.appendChild(defaultOpt);
    COUNTRIES.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      sel.appendChild(opt);
    });
  }

  function open() {
    updateLabels();
    goStep(1);
    document.getElementById('customerModal').style.display = 'flex';
  }

  function close() {
    document.getElementById('customerModal').style.display = 'none';
  }

  function updateLabels() {
    const l = L();
    document.getElementById('custModalTitle').textContent = l.title;
    document.getElementById('custModalSub').textContent = l.sub;
    document.getElementById('stepLabel1').textContent = l.step1;
    document.getElementById('stepLabel2').textContent = l.step2;
    document.getElementById('stepLabel3').textContent = l.step3;
    document.getElementById('lFirstName').textContent = l.firstName;
    document.getElementById('lLastName').textContent = l.lastName;
    document.getElementById('lBirthDate').textContent = l.birthDate;
    document.getElementById('lGender').textContent = l.gender;
    document.getElementById('genderM').textContent = l.gM;
    document.getElementById('genderF').textContent = l.gF;
    document.getElementById('genderO').textContent = l.gO;
    document.getElementById('lNationality').textContent = l.nationality;
    document.getElementById('lEmail').textContent = l.email;
    document.getElementById('lPhone').textContent = l.phone;
    document.getElementById('lWhatsapp').textContent = l.whatsapp;
    document.getElementById('lAddress').textContent = l.address;
    document.getElementById('lCity').textContent = l.city;
    document.getElementById('lZip').textContent = l.zip;
    document.getElementById('lDocType').textContent = l.docType;
    document.getElementById('docPassport').textContent = l.docPassport;
    document.getElementById('docId').textContent = l.docId;
    document.getElementById('docResidence').textContent = l.docRes;
    document.getElementById('lDocNum').textContent = l.docNum;
    document.getElementById('lDocExp').textContent = l.docExp;
    document.getElementById('lEmergName').textContent = l.emergName;
    document.getElementById('lEmergPhone').textContent = l.emergPhone;
    document.getElementById('consentText').innerHTML = l.consent;
    document.getElementById('step1Next').textContent = l.next;
    document.getElementById('step2Back').textContent = l.back;
    document.getElementById('step2Next').textContent = l.next;
    document.getElementById('step3Back').textContent = l.back;
    document.getElementById('custSave').textContent = l.save;
    document.getElementById('custLabel').textContent = l.custLabel;
    populateCountries();
  }

  function goStep(n) {
    currentStep = n;
    clearErrors();

    // Update panels
    [1,2,3].forEach(i => {
      document.getElementById(`custPanel${i}`).style.display = i === n ? 'block' : 'none';
    });

    // Update step indicators
    document.querySelectorAll('.cust-step').forEach(el => {
      const s = parseInt(el.dataset.step);
      el.classList.toggle('active', s === n);
      el.classList.toggle('done', s < n);
    });
  }

  function validateStep(n) {
    clearErrors();
    const l = L();
    let valid = true;

    if (n === 1) {
      if (!v('custFirstName')) { showErr('custFirstName', l.errRequired); valid = false; }
      if (!v('custLastName'))  { showErr('custLastName',  l.errRequired); valid = false; }
      if (!v('custNationality')) { showErr('custNationality', l.errRequired); valid = false; }
    }
    if (n === 2) {
      const email = document.getElementById('custEmail').value.trim();
      if (!email.includes('@')) { showErr('custEmail', l.errEmail); valid = false; }
      if (!v('custPhone')) { showErr('custPhone', l.errRequired); valid = false; }
    }
    if (n === 3) {
      if (!v('custDocNum')) { showErr('custDocNum', l.errRequired); valid = false; }
      if (!document.getElementById('custConsent').checked) { showErr('custConsent', l.errConsent); valid = false; }
    }
    return valid;
  }

  function v(id) { return document.getElementById(id).value.trim() !== ''; }

  function showErr(id, msg) {
    const el = document.getElementById(id);
    el.classList.add('input-error');
    const span = document.createElement('span');
    span.className = 'field-error';
    span.textContent = msg;
    el.parentNode.appendChild(span);
  }

  function clearErrors() {
    document.querySelectorAll('#customerModal .input-error').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('#customerModal .field-error').forEach(el => el.remove());
  }

  // Validate before advancing
  const origGoStep = goStep;
  function goStep(n) {
    if (n > currentStep && !validateStep(currentStep)) return;
    currentStep = n;
    clearErrors();
    [1,2,3].forEach(i => {
      document.getElementById(`custPanel${i}`).style.display = i === n ? 'block' : 'none';
    });
    document.querySelectorAll('.cust-step').forEach(el => {
      const s = parseInt(el.dataset.step);
      el.classList.toggle('active', s === n);
      el.classList.toggle('done', s < n);
    });
  }

  function save() {
    if (!validateStep(3)) return;
    const l = L();

    const data = {
      firstName:   document.getElementById('custFirstName').value.trim(),
      lastName:    document.getElementById('custLastName').value.trim(),
      birthDate:   document.getElementById('custBirthDate').value,
      gender:      document.getElementById('custGender').value,
      nationality: document.getElementById('custNationality').value,
      email:       document.getElementById('custEmail').value.trim(),
      phone:       document.getElementById('custPhone').value.trim(),
      whatsapp:    document.getElementById('custWhatsapp').value.trim(),
      address:     document.getElementById('custAddress').value.trim(),
      city:        document.getElementById('custCity').value.trim(),
      zip:         document.getElementById('custZip').value.trim(),
      docType:     document.getElementById('custDocType').value,
      docNum:      document.getElementById('custDocNum').value.trim(),
      docExp:      document.getElementById('custDocExp').value,
      emergName:   document.getElementById('custEmergName').value.trim(),
      emergPhone:  document.getElementById('custEmergPhone').value.trim(),
    };

    // Save to app state
    if (window.appState) window.appState.customerData = data;

    // Also pre-fill payment email
    const payEmailEl = document.getElementById('payEmail');
    if (payEmailEl && data.email) payEmailEl.value = data.email;

    // Update booking bar button
    const fullName = `${data.firstName} ${data.lastName}`;
    document.getElementById('custValue').textContent = fullName;
    document.getElementById('custValue').style.color = 'var(--green)';

    saved = true;
    close();

    // Notify chat
    if (window.handleUserMessage) window.handleUserMessage(`Mis datos: ${fullName}, ${data.nationality}, ${data.email}`);
  }

  return { init };
})();
