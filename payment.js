// =============================================
// PAYMENT MODULE
// =============================================

const PaymentModule = (() => {
  let currentPlan = null;
  let currentPrice = 0;

  // ---- PUBLIC: open modal ----
  function open(planId, price) {
    currentPlan = planId;
    currentPrice = parseFloat(price);
    updateAllLabels();
    switchTab('card');
    document.getElementById('paymentModal').style.display = 'flex';
  }

  function close() {
    document.getElementById('paymentModal').style.display = 'none';
  }

  function init() {
    // Close buttons
    document.getElementById('closePayment').addEventListener('click', close);
    document.getElementById('paymentModal').addEventListener('click', e => {
      if (e.target.id === 'paymentModal') close();
    });

    // Tabs
    document.querySelectorAll('.pay-tab').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Card number formatting
    document.getElementById('cardNumber').addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 16);
      e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
    });

    // Expiry formatting
    document.getElementById('cardExp').addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 2) v = v.slice(0,2) + '/' + v.slice(2);
      e.target.value = v;
    });

    // Pay buttons
    document.getElementById('btnPayCard').addEventListener('click', handleCardPayment);
    document.getElementById('btnPayPal').addEventListener('click', handlePayPal);
    document.getElementById('btnPayTransfer').addEventListener('click', handleTransfer);

    // Success modal close
    document.getElementById('closeSuccess').addEventListener('click', () => {
      document.getElementById('successModal').style.display = 'none';
    });
  }

  function switchTab(tab) {
    document.querySelectorAll('.pay-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.getElementById('panelCard').style.display     = tab === 'card'     ? 'block' : 'none';
    document.getElementById('panelPaypal').style.display   = tab === 'paypal'   ? 'block' : 'none';
    document.getElementById('panelTransfer').style.display = tab === 'transfer' ? 'block' : 'none';
    if (tab === 'paypal') renderPayPalButtons();
  }

  function updateAllLabels() {
    const lang = window.appState ? window.appState.lang : 'es';
    const plan = currentPlan ? INSURANCE_PLANS[currentPlan] : null;
    const planName = plan ? (lang === 'es' ? plan.nameEs : plan.nameEn) : '';
    const priceStr = `$${currentPrice.toFixed(2)} USD`;

    // Summary strip
    document.getElementById('paySummaryStrip').innerHTML = `
      <div class="pay-strip-plan">${plan ? plan.emoji : '🛡️'} ${planName}</div>
      <div class="pay-strip-price">${priceStr}</div>
    `;

    // Amount badges
    document.getElementById('payAmountCard').textContent = priceStr;
    document.getElementById('paypalAmount').textContent = priceStr;

    // Transfer reference
    const ref = 'TSA-' + Math.floor(100000 + Math.random() * 900000);
    document.getElementById('transferRef').textContent = ref;

    // Localized labels
    const L = {
      es: {
        title: '💳 Completar Pago', tabCard: 'Tarjeta', tabTransfer: 'Transferencia',
        labelName: 'Nombre en la tarjeta', labelCard: 'Número de tarjeta',
        labelExp: 'Vencimiento', labelEmail: 'Email de confirmación',
        btnPay: '🔒 Pagar ahora', legal: 'Al pagar aceptas los Términos y condiciones. Pago procesado por Stripe.',
        paypalInfo: 'Serás redirigido a PayPal para completar tu pago de forma segura.',
        paypalAmountLabel: 'Total a pagar:', paypalSecurity: 'Protegido por PayPal Buyer Protection',
        transferBankLabel: 'Banco', transferAccLabel: 'Cuenta', transferRefLabel: 'Referencia',
        btnTransfer: '✅ Confirmar transferencia', transferLegal: 'Tu póliza se activará al recibir la transferencia (1-2 días hábiles).',
        successTitle: '¡Pago Exitoso! 🎉', successSub: 'Tu seguro de viaje ha sido activado. Recibirás los documentos en tu correo en los próximos minutos.',
        closeSuccess: '🏠 Volver al inicio',
        errName: 'Ingresa el nombre del titular.', errCard: 'Número de tarjeta inválido.',
        errExp: 'Fecha de vencimiento inválida.', errCvv: 'CVV inválido.', errEmail: 'Email inválido.',
        processing: '⏳ Procesando...',
      },
      en: {
        title: '💳 Complete Payment', tabCard: 'Card', tabTransfer: 'Bank Transfer',
        labelName: 'Name on card', labelCard: 'Card number',
        labelExp: 'Expiry', labelEmail: 'Confirmation email',
        btnPay: '🔒 Pay now', legal: 'By paying you agree to the Terms & Conditions. Payment processed by Stripe.',
        paypalInfo: 'You will be redirected to PayPal to complete your payment securely.',
        paypalAmountLabel: 'Total to pay:', paypalSecurity: 'Protected by PayPal Buyer Protection',
        transferBankLabel: 'Bank', transferAccLabel: 'Account', transferRefLabel: 'Reference',
        btnTransfer: '✅ Confirm transfer', transferLegal: 'Your policy will activate once the transfer is received (1-2 business days).',
        successTitle: 'Payment Successful! 🎉', successSub: 'Your travel insurance is now active. You will receive the documents by email in the next few minutes.',
        closeSuccess: '🏠 Back to home',
        errName: 'Please enter the cardholder name.', errCard: 'Invalid card number.',
        errExp: 'Invalid expiry date.', errCvv: 'Invalid CVV.', errEmail: 'Invalid email.',
        processing: '⏳ Processing...',
      },
      fr: {
        title: '💳 Finaliser le Paiement', tabCard: 'Carte', tabTransfer: 'Virement',
        labelName: 'Nom sur la carte', labelCard: 'Numéro de carte',
        labelExp: 'Expiration', labelEmail: 'Email de confirmation',
        btnPay: '🔒 Payer maintenant', legal: 'En payant vous acceptez les CGU. Paiement traité par Stripe.',
        paypalInfo: 'Vous serez redirigé vers PayPal pour finaliser votre paiement.',
        paypalAmountLabel: 'Total à payer:', paypalSecurity: 'Protégé par PayPal Buyer Protection',
        transferBankLabel: 'Banque', transferAccLabel: 'Compte', transferRefLabel: 'Référence',
        btnTransfer: '✅ Confirmer le virement', transferLegal: 'Votre police sera activée à réception du virement (1-2 jours ouvrés).',
        successTitle: 'Paiement Réussi! 🎉', successSub: 'Votre assurance voyage est activée. Vous recevrez les documents par email.',
        closeSuccess: '🏠 Retour à l\'accueil',
        errName: 'Veuillez saisir le nom du titulaire.', errCard: 'Numéro de carte invalide.',
        errExp: 'Date d\'expiration invalide.', errCvv: 'CVV invalide.', errEmail: 'Email invalide.',
        processing: '⏳ Traitement...',
      },
      pt: {
        title: '💳 Concluir Pagamento', tabCard: 'Cartão', tabTransfer: 'Transferência',
        labelName: 'Nome no cartão', labelCard: 'Número do cartão',
        labelExp: 'Validade', labelEmail: 'Email de confirmação',
        btnPay: '🔒 Pagar agora', legal: 'Ao pagar você aceita os Termos e Condições. Pagamento processado pela Stripe.',
        paypalInfo: 'Você será redirecionado ao PayPal para concluir seu pagamento com segurança.',
        paypalAmountLabel: 'Total a pagar:', paypalSecurity: 'Protegido pelo PayPal Buyer Protection',
        transferBankLabel: 'Banco', transferAccLabel: 'Conta', transferRefLabel: 'Referência',
        btnTransfer: '✅ Confirmar transferência', transferLegal: 'Sua apólice será ativada ao receber a transferência (1-2 dias úteis).',
        successTitle: 'Pagamento Realizado! 🎉', successSub: 'Seu seguro viagem está ativo. Você receberá os documentos por email em breve.',
        closeSuccess: '🏠 Voltar ao início',
        errName: 'Digite o nome do titular.', errCard: 'Número de cartão inválido.',
        errExp: 'Data de validade inválida.', errCvv: 'CVV inválido.', errEmail: 'Email inválido.',
        processing: '⏳ Processando...',
      },
      de: {
        title: '💳 Zahlung abschließen', tabCard: 'Karte', tabTransfer: 'Überweisung',
        labelName: 'Name auf der Karte', labelCard: 'Kartennummer',
        labelExp: 'Ablaufdatum', labelEmail: 'Bestätigungs-Email',
        btnPay: '🔒 Jetzt bezahlen', legal: 'Mit der Zahlung akzeptieren Sie die AGB. Zahlung verarbeitet von Stripe.',
        paypalInfo: 'Sie werden zu PayPal weitergeleitet, um Ihre Zahlung sicher abzuschließen.',
        paypalAmountLabel: 'Gesamtbetrag:', paypalSecurity: 'Geschützt durch PayPal Käuferschutz',
        transferBankLabel: 'Bank', transferAccLabel: 'Konto', transferRefLabel: 'Referenz',
        btnTransfer: '✅ Überweisung bestätigen', transferLegal: 'Ihre Police wird nach Eingang der Überweisung aktiviert (1-2 Werktage).',
        successTitle: 'Zahlung erfolgreich! 🎉', successSub: 'Ihre Reiseversicherung ist jetzt aktiv. Sie erhalten die Dokumente per Email.',
        closeSuccess: '🏠 Zurück zur Startseite',
        errName: 'Bitte geben Sie den Namen des Karteninhabers ein.', errCard: 'Ungültige Kartennummer.',
        errExp: 'Ungültiges Ablaufdatum.', errCvv: 'Ungültiger CVV.', errEmail: 'Ungültige Email.',
        processing: '⏳ Verarbeitung...',
      },
    };

    const l = L[lang] || L.es;
    window._payL = l; // store for payment handlers

    document.getElementById('payTitle').textContent = l.title;
    document.getElementById('tabCardLabel').textContent = l.tabCard;
    document.getElementById('tabTransferLabel').textContent = l.tabTransfer;
    document.getElementById('labelName').textContent = l.labelName;
    document.getElementById('labelCard').textContent = l.labelCard;
    document.getElementById('labelExp').textContent = l.labelExp;
    document.getElementById('labelEmail').textContent = l.labelEmail;
    document.getElementById('btnPayCardLabel').textContent = l.btnPay;
    document.getElementById('payLegalCard').innerHTML = l.legal;
    document.getElementById('paypalInfo').querySelector('p').textContent = l.paypalInfo;
    document.getElementById('paypalAmountLabel').textContent = l.paypalAmountLabel;
    document.getElementById('paypalSecurity').textContent = l.paypalSecurity;
    document.getElementById('transferBankLabel').textContent = l.transferBankLabel;
    document.getElementById('transferAccLabel').textContent = l.transferAccLabel;
    document.getElementById('transferRefLabel').textContent = l.transferRefLabel;
    document.getElementById('btnTransferLabel').textContent = l.btnTransfer;
    document.getElementById('transferLegal').textContent = l.transferLegal;
    document.getElementById('closeSuccessLabel').textContent = l.closeSuccess;
  }

  // ---- CARD PAYMENT ----
  function handleCardPayment() {
    const l = window._payL || {};
    const name = document.getElementById('cardName').value.trim();
    const num  = document.getElementById('cardNumber').value.replace(/\s/g,'');
    const exp  = document.getElementById('cardExp').value.trim();
    const cvv  = document.getElementById('cardCvv').value.trim();
    const email= document.getElementById('payEmail').value.trim();

    clearErrors();
    let valid = true;
    if (!name) { showError('cardName', l.errName); valid = false; }
    if (num.length < 15) { showError('cardNumber', l.errCard); valid = false; }
    if (!/^\d{2}\/\d{2}$/.test(exp)) { showError('cardExp', l.errExp); valid = false; }
    if (cvv.length < 3) { showError('cardCvv', l.errCvv); valid = false; }
    if (!email.includes('@')) { showError('payEmail', l.errEmail); valid = false; }
    if (!valid) return;

    const btn = document.getElementById('btnPayCard');
    btn.disabled = true;
    btn.querySelector('#btnPayCardLabel').textContent = l.processing || '⏳ Procesando...';

    // Simulate payment processing (1.5s)
    setTimeout(() => {
      btn.disabled = false;
      btn.querySelector('#btnPayCardLabel').textContent = l.btnPay || '🔒 Pagar ahora';
      close();
      showSuccess(email);
    }, 1800);
  }

  // ---- PAYPAL ----
  let paypalRendered = false;
  let lastPaypalPrice = null;

  function renderPayPalButtons() {
    if (paypalRendered && lastPaypalPrice === currentPrice) return;
    const container = document.getElementById('paypalButtonContainer');
    if (!container) return;
    if (!window.paypal_sdk) {
      container.innerHTML = '<p style="text-align:center;color:#666;padding:12px">⏳ Cargando PayPal...</p>';
      setTimeout(renderPayPalButtons, 1000);
      return;
    }
    container.innerHTML = '';
    paypalRendered = true;
    lastPaypalPrice = currentPrice;

    window.paypal_sdk.Buttons({
      style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'paypal' },
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            amount: { value: currentPrice.toFixed(2), currency_code: 'USD' },
            description: currentPlan ? (INSURANCE_PLANS[currentPlan].nameEn + ' Travel Insurance') : 'Travel Insurance',
          }],
        });
      },
      onApprove: (data, actions) => {
        return actions.order.capture().then(details => {
          close();
          showSuccess(details.payer.email_address || '');
        });
      },
      onError: (err) => {
        console.error('PayPal error:', err);
      },
    }).render('#paypalButtonContainer');
  }

  function handlePayPal() {
    renderPayPalButtons();
  }

  // ---- TRANSFER ----
  function handleTransfer() {
    close();
    showSuccess('', true);
  }

  // ---- SUCCESS SCREEN ----
  function showSuccess(email, isTransfer = false) {
    const l = window._payL || {};
    const lang = window.appState ? window.appState.lang : 'es';
    const plan = currentPlan ? INSURANCE_PLANS[currentPlan] : null;
    const planName = plan ? (lang === 'es' ? plan.nameEs : plan.nameEn) : '';
    const ref = 'TSA-' + Math.floor(100000 + Math.random() * 900000);

    document.getElementById('successTitle').textContent = l.successTitle || '¡Pago Exitoso! 🎉';
    document.getElementById('successSub').textContent = l.successSub || 'Tu seguro ha sido activado.';
    document.getElementById('closeSuccessLabel').textContent = l.closeSuccess || '🏠 Volver';
    document.getElementById('successRef').innerHTML = `
      <div class="success-detail"><span>🛡️ Plan</span><strong>${plan ? plan.emoji : ''} ${planName}</strong></div>
      <div class="success-detail"><span>💰 Total</span><strong>$${currentPrice.toFixed(2)} USD</strong></div>
      ${email ? `<div class="success-detail"><span>📧 Email</span><strong>${email}</strong></div>` : ''}
      <div class="success-detail"><span>🔖 Ref.</span><strong>${ref}</strong></div>
    `;

    document.getElementById('successModal').style.display = 'flex';

    // Notify chat
    const msg = lang === 'es'
      ? `✅ ¡Pago completado! Tu póliza **${planName}** (${ref}) está activa. ${email ? `Documentos enviados a ${email}.` : ''}`
      : `✅ Payment complete! Your **${planName}** policy (${ref}) is now active. ${email ? `Documents sent to ${email}.` : ''}`;
    if (window.addMessage) window.addMessage('assistant', msg);
  }

  // ---- VALIDATION HELPERS ----
  function showError(fieldId, msg) {
    const field = document.getElementById(fieldId);
    field.classList.add('input-error');
    const err = document.createElement('span');
    err.className = 'field-error';
    err.textContent = msg;
    field.parentNode.appendChild(err);
  }

  function clearErrors() {
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('.field-error').forEach(el => el.remove());
  }

  return { init, open };
})();
