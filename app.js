// =============================================
// TRAVELSAFE AI — MAIN APPLICATION
// =============================================

// ---------- STATE (exposed globally) ----------
window.appState = {
  messages: [],
  lang: 'es',
  step: 'greeting',
  quoteData: {
    destination: null,
    departureDate: null,
    returnDate: null,
    travelers: null,
    ages: null,
    coverageType: null,
    selectedPlan: null,
  },
};
const state = window.appState;

// ---------- SYSTEM PROMPT ----------
function buildSystemPrompt() {
  const lang = state.lang;
  const langName = I18N[lang] ? I18N[lang].name : 'Spanish';
  return `You are TravelSafe AI, a friendly and professional travel insurance sales agent.

CRITICAL LANGUAGE RULE:
- The user's selected interface language is: ${langName} (code: ${lang})
- You MUST ALWAYS respond in ${langName}. No exceptions.
- Even if the user writes a single word in another language, respond in ${langName}.
- Never switch languages mid-conversation.

PERSONALITY:
- Warm, helpful and concise
- Professional but conversational
- Keep responses to 2-4 sentences max

CONVERSATION FLOW:
1. Ask for travel destination
2. Ask for departure and return dates (tell them to use the calendar button 📅)
3. Ask for number of travelers and ages (tell them to use the travelers button 👥)
4. Ask what coverage: medical, cancellation, or both
5. When you have destination + dates + travelers + coverage, output [SHOW_PLANS] on its own line

RULES:
- When asking for dates, mention the calendar button (📅) in the booking bar below
- When asking for travelers, mention the travelers button (👥) in the booking bar below
- Never make up prices
- Output [SHOW_PLANS] only once all 4 data points are collected
- Be encouraging about their travel plans`;
}

// ---------- DOM ----------
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

function scrollToBottom() {
  document.querySelector('.chat-wrapper').scrollTo({ top: 99999, behavior: 'smooth' });
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function addMessage(role, content, skipHistory = false) {
  if (!skipHistory) state.messages.push({ role, content });

  const row = document.createElement('div');
  row.className = `msg-row ${role === 'user' ? 'user' : 'bot'}`;

  const avatar = document.createElement('div');
  avatar.className = `avatar ${role === 'user' ? 'avatar-user' : 'avatar-bot'}`;
  avatar.textContent = role === 'user' ? '👤' : '🤖';

  const bubble = document.createElement('div');
  bubble.className = `bubble ${role === 'user' ? 'bubble-user' : 'bubble-bot'}`;
  const formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
  bubble.innerHTML = `${formatted}<span class="bubble-time">${getTime()}</span>`;

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatContainer.appendChild(row);
  scrollToBottom();
}

function showTyping() {
  removeTyping();
  const row = document.createElement('div');
  row.className = 'msg-row bot';
  row.id = 'typingRow';
  const avatar = document.createElement('div');
  avatar.className = 'avatar avatar-bot';
  avatar.textContent = '🤖';
  const bubble = document.createElement('div');
  bubble.className = 'bubble bubble-bot';
  bubble.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
  row.appendChild(avatar);
  row.appendChild(bubble);
  chatContainer.appendChild(row);
  scrollToBottom();
}

function removeTyping() {
  const el = document.getElementById('typingRow');
  if (el) el.remove();
}

function showQuickReplies(options) {
  document.querySelector('.quick-replies')?.remove();
  const container = document.createElement('div');
  container.className = 'quick-replies';
  options.forEach(opt => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = opt;
    chip.addEventListener('click', () => {
      container.remove();
      handleUserMessage(opt);
    });
    container.appendChild(chip);
  });
  chatContainer.appendChild(container);
  scrollToBottom();
}

// ---------- LANGUAGE SWITCHER ----------
function initLangSwitcher() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      switchLanguage(lang);
    });
  });
}

function switchLanguage(lang) {
  if (!I18N[lang]) return;
  state.lang = lang;

  // Update active button
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });

  // Update UI text
  const i = I18N[lang];
  userInput.placeholder = i.placeholder;
  document.querySelector('.input-disclaimer').textContent = i.disclaimer;
  document.getElementById('calLabel').textContent = i.calLabel;
  document.getElementById('pasLabel').textContent = i.pasLabel;
  document.getElementById('covLabel').textContent = i.covLabel;
  if (!state.quoteData.coverageType) document.getElementById('covValue').textContent = i.covSelectDefault;

  // Notify chat
  const greet = {
    es: `Cambiando al español 🇪🇸`,
    en: `Switching to English 🇺🇸`,
    fr: `Passage au français 🇫🇷`,
    pt: `Mudando para português 🇧🇷`,
    de: `Wechsle zu Deutsch 🇩🇪`,
  };
  addMessage('assistant', greet[lang] || `Language: ${i.name}`, true);
  showQuickReplies(i.destChips);
}

// ---------- INSURANCE CARDS ----------
function showInsuranceCards() {
  const { travelers, departureDate, returnDate } = state.quoteData;
  const lang = state.lang;
  const i = I18N[lang] || I18N.es;

  let days = 7;
  if (departureDate && returnDate) {
    const parse = s => { const [d,m,y] = s.split('/'); return new Date(`${y}-${m}-${d}`); };
    const diff = Math.ceil((parse(returnDate) - parse(departureDate)) / 86400000);
    if (diff > 0) days = diff;
  }
  const numTravelers = parseInt(travelers) || 1;

  const wrapper = document.createElement('div');
  wrapper.className = 'cards-wrapper';

  ['basic', 'standard', 'premium'].forEach(planId => {
    const plan = INSURANCE_PLANS[planId];
    const price = calcPrice(planId, numTravelers, days);
    const features = lang === 'es' ? plan.featuresEs : plan.featuresEn;
    const name = lang === 'es' ? plan.nameEs : plan.nameEn;
    const sub = lang === 'es' ? plan.subtitleEs : plan.subtitleEn;
    const badgeHtml = plan.badge ? `<span class="card-badge ${plan.badge === 'POPULAR' ? 'popular' : ''}">${plan.badge}</span>` : '';

    const card = document.createElement('div');
    card.className = `ins-card card-${planId}`;
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title-group">
          <span class="card-emoji">${plan.emoji}</span>
          <div><div class="card-name">${name}</div><div class="card-sub">${sub}</div></div>
        </div>
        ${badgeHtml}
      </div>
      <div class="card-body">
        <div class="card-price">
          <span class="price-currency">$</span>
          <span class="price-amount">${price.toFixed(2)}</span>
          <span class="price-period">&nbsp;/ ${i.totalLabel} (${days} ${i.dayLabel}, ${numTravelers} ${numTravelers > 1 ? i.travelers : i.traveler})</span>
        </div>
        <ul class="card-features">
          ${features.map(f => `<li><span class="feat-icon">✓</span><span>${f}</span></li>`).join('')}
        </ul>
        <button class="btn-buy btn-buy-${planId}" data-plan="${planId}" data-price="${price}">${i.buyBtn}</button>
        <button class="btn-quote" data-plan="${planId}" data-price="${price}">${i.summaryBtn}</button>
      </div>`;
    wrapper.appendChild(card);
  });

  chatContainer.appendChild(wrapper);
  scrollToBottom();

  wrapper.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', () => {
      state.quoteData.selectedPlan = btn.dataset.plan;
      PaymentModule.open(btn.dataset.plan, btn.dataset.price);
    });
  });
  wrapper.querySelectorAll('.btn-quote').forEach(btn => {
    btn.addEventListener('click', () => {
      state.quoteData.selectedPlan = btn.dataset.plan;
      openQuoteModal(btn.dataset.plan, parseFloat(btn.dataset.price));
    });
  });
}

function handlePurchaseFlow(planId, price) {
  const lang = state.lang;
  const i = I18N[lang] || I18N.es;
  const plan = INSURANCE_PLANS[planId];
  const name = lang === 'es' ? plan.nameEs : plan.nameEn;
  addMessage('assistant', i.purchaseMsg(name, parseFloat(price).toFixed(2)));
  showQuickReplies(i.purchaseChips);
}

// ---------- QUOTE MODAL ----------
function openQuoteModal(planId, price) {
  const lang = state.lang;
  const i = I18N[lang] || I18N.es;
  const plan = INSURANCE_PLANS[planId];
  const { destination, departureDate, returnDate, travelers, ages, coverageType } = state.quoteData;
  const name = lang === 'es' ? plan.nameEs : plan.nameEn;

  document.getElementById('quoteModalTitle').textContent = i.quoteTitle;
  document.getElementById('sendEmailLabel').textContent = i.sendEmail;
  document.getElementById('closeQuoteLabel').textContent = i.closeBtn;

  document.getElementById('quoteContent').innerHTML = `
    <div class="quote-section">
      <div class="quote-section-title">${i.tripInfo}</div>
      <div class="quote-row"><span class="quote-key">${i.destRow}</span><span class="quote-val">${destination || '—'}</span></div>
      <div class="quote-row"><span class="quote-key">${i.depRow}</span><span class="quote-val">${departureDate || '—'}</span></div>
      <div class="quote-row"><span class="quote-key">${i.retRow}</span><span class="quote-val">${returnDate || '—'}</span></div>
      <div class="quote-row"><span class="quote-key">${i.travRow}</span><span class="quote-val">${travelers || '—'}</span></div>
      <div class="quote-row"><span class="quote-key">${i.agesRow}</span><span class="quote-val">${ages || '—'}</span></div>
      <div class="quote-row"><span class="quote-key">${i.covRow}</span><span class="quote-val">${coverageType || '—'}</span></div>
    </div>
    <div class="quote-divider"></div>
    <div class="quote-section">
      <div class="quote-section-title">${i.planInfo}</div>
      <div class="quote-row"><span class="quote-key">${i.planRow}</span><span class="quote-val">${plan.emoji} ${name}</span></div>
      <div class="quote-row"><span class="quote-key">${i.medRow}</span><span class="quote-val">${lang === 'es' ? plan.highlights.medicalEs : plan.highlights.medicalEn}</span></div>
      <div class="quote-row"><span class="quote-key">${i.canRow}</span><span class="quote-val">${lang === 'es' ? plan.highlights.cancellationEs : plan.highlights.cancellationEn}</span></div>
      <div class="quote-row"><span class="quote-key">${i.dedRow}</span><span class="quote-val">${plan.highlights.deductible}</span></div>
    </div>
    <div class="quote-divider"></div>
    <div class="quote-row" style="font-size:1rem">
      <span class="quote-key" style="font-weight:700;color:var(--navy)">${i.totalRow}</span>
      <span class="quote-val" style="font-size:1.2rem;color:var(--blue)">$${price.toFixed(2)} USD</span>
    </div>`;

  document.getElementById('quoteModal').style.display = 'flex';
}

// ---------- DETECT LANGUAGE ----------
function detectLanguage(text) {
  const t = text.toLowerCase();
  const spanishWords = /\b(el|la|los|las|un|una|para|viaje|seguro|necesito|quiero|tengo|fecha|destino|viajero|cobertura|gracias|hola|español|habla|sí|también|qué|cómo|cuándo|cuánto|dónde|personas|años|salida|regreso|médica|cancelación|ambas|planeas|viajar|quiero|necesito|días|semanas)\b/i;
  if (spanishWords.test(t)) return 'es';
  const englishWords = /\b(the|travel|insurance|need|want|have|destination|traveler|coverage|thank|hello|hi|please|how|when|what|english|speak|departure|return|medical|cancellation|both|days|weeks|people|years)\b/i;
  if (englishWords.test(t)) return 'en';
  const frenchWords = /\b(bonjour|salut|merci|voyage|assurance|destination|date|voyageur|couverture|départ|retour|médical|annulation|jours|semaines)\b/i;
  if (frenchWords.test(t)) return 'fr';
  const portugueseWords = /\b(olá|obrigado|viagem|seguro|destino|data|viajante|cobertura|partida|retorno|médico|cancelamento|dias|semanas)\b/i;
  if (portugueseWords.test(t)) return 'pt';
  const germanWords = /\b(hallo|danke|reise|versicherung|reiseziel|datum|reisender|abdeckung|abflug|rückkehr|medizinisch|stornierung|tage|wochen)\b/i;
  if (germanWords.test(t)) return 'de';
  return state.lang;
}

// ---------- EXTRACT QUOTE DATA ----------
function extractQuoteData(userText) {
  const datePattern = /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/g;
  const dates = userText.match(datePattern);
  if (dates && dates.length >= 2) {
    state.quoteData.departureDate = dates[0].replace(/-/g, '/');
    state.quoteData.returnDate = dates[1].replace(/-/g, '/');
  } else if (dates && dates.length === 1) {
    if (!state.quoteData.departureDate) state.quoteData.departureDate = dates[0];
    else if (!state.quoteData.returnDate) state.quoteData.returnDate = dates[0];
  }

  const travMatch = userText.match(/\b(\d+)\s*(?:viajeros?|travelers?|voyageurs?|viajantes?|reisende?|personas?|personne?|pessoa)/i);
  if (travMatch) state.quoteData.travelers = travMatch[1];

  const agesMatch = userText.match(/(?:edades?|ages?|âges?|idades?|alter)[:\s]+([0-9, ]+)/i);
  if (agesMatch) state.quoteData.ages = agesMatch[1].trim();

  if (/m[eé]dic|medical|médical|médico/i.test(userText) && /cancel/i.test(userText)) {
    state.quoteData.coverageType = state.lang === 'es' ? 'Médica + Cancelación' : 'Medical + Cancellation';
  } else if (/m[eé]dic|medical|médical|médico/i.test(userText)) {
    state.quoteData.coverageType = state.lang === 'es' ? 'Médica' : 'Medical';
  } else if (/cancel/i.test(userText)) {
    state.quoteData.coverageType = state.lang === 'es' ? 'Cancelación' : 'Cancellation';
  } else if (/ambas|both|les deux|ambas|beide/i.test(userText)) {
    state.quoteData.coverageType = state.lang === 'es' ? 'Completa' : 'Full';
  }

  // Destination — capture after known destination words or if destination not yet set
  if (!state.quoteData.destination) {
    const destMatch = userText.match(/(?:viajar?\s+a|travel(?:ing)?\s+to|destination[:\s]+|destino[:\s]+|voyager?\s+[àa]|viajar?\s+para|reisen?\s+nach)\s*([A-Za-záéíóúñüàèìòùâêîôûäëïöüç\s,]+?)(?:\.|,|\n|$)/i);
    if (destMatch) state.quoteData.destination = destMatch[1].trim();
    else if (/^[A-Za-záéíóúñüàèìòùâêîôûäëïöüç\s,]{3,30}$/.test(userText.trim()) && !userText.match(/\d/)) {
      state.quoteData.destination = userText.trim();
    }
  }
}

// ---------- CLAUDE API ----------
async function callClaude(userMessage) {
  if (!CONFIG.ANTHROPIC_API_KEY || CONFIG.ANTHROPIC_API_KEY === 'YOUR_ANTHROPIC_API_KEY') {
    return simulateBotResponse(userMessage);
  }
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-calls': 'true',
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        max_tokens: CONFIG.MAX_TOKENS,
        system: buildSystemPrompt(),
        messages: state.messages.slice(-20),
      }),
    });
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    return data.content[0].text;
  } catch (err) {
    console.error('Claude error:', err);
    return simulateBotResponse(userMessage);
  }
}

// ---------- SIMULATION ----------
function simulateBotResponse(userText) {
  const lang = state.lang;
  const i = I18N[lang] || I18N.es;
  const step = state.step;
  const stepFlow = ['greeting','destination','dates','travelers','coverage','default'];
  const idx = stepFlow.indexOf(step);
  state.step = stepFlow[Math.min(idx + 1, stepFlow.length - 1)];

  const responses = {
    es: {
      greeting:    '¡Excelente! ¿A qué destino planeas viajar? ✈️',
      destination: `¡Perfecto! Ahora usa el botón 📅 en la barra de abajo para seleccionar tus fechas de ida y vuelta.`,
      dates:       `Entendido. Ahora usa el botón 👥 para agregar los viajeros y sus edades.`,
      travelers:   `¿Qué tipo de cobertura necesitas? ¿Médica, cancelación o ambas?`,
      coverage:    `¡Perfecto! Aquí están las mejores opciones para tu viaje. [SHOW_PLANS]`,
      default:     `¿Hay algo más en lo que pueda ayudarte?`,
    },
    en: {
      greeting:    `Great! Where are you planning to travel? ✈️`,
      destination: `Perfect! Use the 📅 button below to select your departure and return dates.`,
      dates:       `Got it. Now use the 👥 button to add travelers and their ages.`,
      travelers:   `What type of coverage do you need? Medical, cancellation, or both?`,
      coverage:    `Perfect! Here are the best options for your trip. [SHOW_PLANS]`,
      default:     `Is there anything else I can help you with?`,
    },
    fr: {
      greeting:    `Parfait ! Où planifiez-vous de voyager ? ✈️`,
      destination: `Parfait ! Utilisez le bouton 📅 ci-dessous pour sélectionner vos dates.`,
      dates:       `Compris. Utilisez le bouton 👥 pour ajouter les voyageurs.`,
      travelers:   `Quel type de couverture souhaitez-vous ? Médicale, annulation ou les deux ?`,
      coverage:    `Parfait ! Voici les meilleures options pour votre voyage. [SHOW_PLANS]`,
      default:     `Puis-je vous aider avec autre chose ?`,
    },
    pt: {
      greeting:    `Ótimo! Para onde você planeja viajar? ✈️`,
      destination: `Perfeito! Use o botão 📅 abaixo para selecionar suas datas.`,
      dates:       `Entendido. Use o botão 👥 para adicionar os viajantes.`,
      travelers:   `Que tipo de cobertura você precisa? Médica, cancelamento ou ambas?`,
      coverage:    `Perfeito! Aqui estão as melhores opções para sua viagem. [SHOW_PLANS]`,
      default:     `Posso ajudar com mais alguma coisa?`,
    },
    de: {
      greeting:    `Toll! Wohin planen Sie zu reisen? ✈️`,
      destination: `Perfekt! Verwenden Sie die Schaltfläche 📅 unten, um Ihre Daten auszuwählen.`,
      dates:       `Verstanden. Verwenden Sie die Schaltfläche 👥, um Reisende hinzuzufügen.`,
      travelers:   `Welche Art von Deckung benötigen Sie? Medizinisch, Stornierung oder beides?`,
      coverage:    `Perfekt! Hier sind die besten Optionen für Ihre Reise. [SHOW_PLANS]`,
      default:     `Kann ich Ihnen noch mit etwas helfen?`,
    },
  };

  const r = responses[lang] || responses.es;
  return r[step] || r.default;
}

// ---------- HANDLE USER MESSAGE ----------
window.handleUserMessage = async function(text) {
  text = text.trim();
  if (!text) return;

  // Only auto-detect lang from text input (not from booking bar)
  const detected = detectLanguage(text);
  if (detected !== state.lang && ['es','en','fr','pt','de'].includes(detected)) {
    state.lang = detected;
    document.querySelectorAll('.lang-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === detected);
    });
  }

  addMessage('user', text);
  userInput.value = '';
  userInput.style.height = 'auto';
  extractQuoteData(text);
  showTyping();

  const response = await callClaude(text);
  removeTyping();

  if (response.includes('[SHOW_PLANS]')) {
    const cleaned = response.replace('[SHOW_PLANS]', '').trim();
    if (cleaned) addMessage('assistant', cleaned);
    showInsuranceCards();
  } else {
    addMessage('assistant', response);
    const i = I18N[state.lang] || I18N.es;
    if (/cobertura|coverage|couverture|cobertura|deckung/i.test(response)) {
      showQuickReplies(i.coverageChips);
    }
  }
};

// ---------- INPUT HANDLERS ----------
userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); window.handleUserMessage(userInput.value); }
});
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
});
sendBtn.addEventListener('click', () => window.handleUserMessage(userInput.value));

// ---------- MODAL HANDLERS ----------
document.getElementById('closeQuoteModal').addEventListener('click', () => { document.getElementById('quoteModal').style.display = 'none'; });
document.getElementById('closeQuoteModal2').addEventListener('click', () => { document.getElementById('quoteModal').style.display = 'none'; });
document.getElementById('sendEmailBtn').addEventListener('click', () => {
  document.getElementById('quoteModal').style.display = 'none';
  const lang = state.lang;
  const i = I18N[lang] || I18N.es;
  document.getElementById('emailModalTitle').textContent = i.emailTitle;
  document.getElementById('emailModalSub').textContent = i.emailSub;
  document.getElementById('sendBtnLabel').textContent = i.sendBtn;
  document.getElementById('cancelBtnLabel').textContent = i.cancelBtn;
  document.getElementById('emailModal').style.display = 'flex';
});
document.getElementById('closeEmailModal').addEventListener('click', () => { document.getElementById('emailModal').style.display = 'none'; });
document.getElementById('cancelEmailModal').addEventListener('click', () => { document.getElementById('emailModal').style.display = 'none'; });
document.getElementById('confirmSendEmail').addEventListener('click', () => {
  const email = document.getElementById('emailInput').value;
  if (!email.includes('@')) { document.getElementById('emailInput').style.borderColor = 'var(--red)'; return; }
  document.getElementById('emailModal').style.display = 'none';
  const i = I18N[state.lang] || I18N.es;
  addMessage('assistant', i.emailSentMsg(email));
});
['quoteModal','emailModal','calendarModal','passengersModal','coverageModal','customerModal','successModal'].forEach(id => {
  document.getElementById(id).addEventListener('click', e => { if (e.target.id === id) e.target.style.display = 'none'; });
});

// ---------- BOOKING BAR SEARCH ----------
document.getElementById('bkSearch').addEventListener('click', () => {
  const { destination, departureDate, returnDate, travelers } = state.quoteData;
  if (!departureDate || !returnDate) { document.getElementById('openCalendar').click(); return; }
  if (!travelers) { document.getElementById('openPassengers').click(); return; }
  const i = I18N[state.lang] || I18N.es;
  const msg = state.lang === 'es'
    ? `Buscar seguro: ${destination || 'destino pendiente'}, ${departureDate} → ${returnDate}, ${travelers} ${parseInt(travelers) > 1 ? i.travelers : i.traveler}`
    : `Search insurance: ${destination || 'pending destination'}, ${departureDate} → ${returnDate}, ${travelers} ${parseInt(travelers) > 1 ? i.travelers : i.traveler}`;
  window.handleUserMessage(msg);
});

// ---------- INIT ----------
function init() {
  initLangSwitcher();
  CalendarModule.init();
  PassengersModule.init();
  CoverageModule.init();
  CustomerModule.init();
  PaymentModule.init();

  const i = I18N[state.lang] || I18N.es;
  userInput.placeholder = i.placeholder;
  document.getElementById('covValue').textContent = i.covSelectDefault;

  setTimeout(() => {
    addMessage('assistant', i.welcomeMsg);
    showQuickReplies(i.destChips);
  }, 400);
}

init();
