// =============================================
// TRAVELSAFE AI — MAIN APPLICATION
// =============================================

// ---------- STATE ----------
const state = {
  messages: [],          // {role, content}
  lang: 'es',            // detected language
  step: 'greeting',      // conversation step
  quoteData: {           // collected quote info
    destination: null,
    departureDate: null,
    returnDate: null,
    travelers: null,
    ages: null,
    coverageType: null,
    selectedPlan: null,
  },
  typingTimer: null,
};

// ---------- SYSTEM PROMPT ----------
function buildSystemPrompt() {
  return `You are TravelSafe AI, a friendly and professional travel insurance sales agent. You help users find the best travel insurance plan.

PERSONALITY:
- Warm, helpful and concise
- Professional but conversational
- Empathetic to travel concerns

LANGUAGE:
- Auto-detect the user's language from their messages
- ALWAYS respond in the SAME language the user writes in (Spanish or English or other)
- If unsure, use Spanish first

CONVERSATION FLOW (follow this order naturally):
1. Greet warmly (bilingual first message only)
2. Ask for travel destination
3. Ask for departure and return dates
4. Ask for number of travelers and their ages
5. Ask what coverage they need: medical, cancellation, or both
6. Recommend plans (you will trigger the JS card display — just say you'll show them options)
7. Answer any questions, help them choose

RULES:
- Keep responses SHORT (2-4 sentences max unless explaining coverage)
- Never make up prices — the system will show real cards
- When the user has provided destination + dates + travelers + coverage type, output EXACTLY this tag on its own line: [SHOW_PLANS]
- When collecting info, ask ONE thing at a time
- Be encouraging about their travel plans
- If they ask something off-topic, gently redirect to the insurance flow

IMPORTANT: When you output [SHOW_PLANS], the system will automatically display the insurance plan cards. Just say something like "Here are the plans I recommend for you!" before or after the tag.`;
}

// ---------- DOM HELPERS ----------
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

function scrollToBottom() {
  const wrapper = document.querySelector('.chat-wrapper');
  wrapper.scrollTo({ top: wrapper.scrollHeight, behavior: 'smooth' });
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function addMessage(role, content, skipHistory = false) {
  if (!skipHistory) {
    state.messages.push({ role, content });
  }

  const row = document.createElement('div');
  row.className = `msg-row ${role === 'user' ? 'user' : 'bot'}`;

  const avatar = document.createElement('div');
  avatar.className = `avatar ${role === 'user' ? 'avatar-user' : 'avatar-bot'}`;
  avatar.textContent = role === 'user' ? '👤' : '🤖';

  const bubble = document.createElement('div');
  bubble.className = `bubble ${role === 'user' ? 'bubble-user' : 'bubble-bot'}`;

  // Render simple markdown-ish: bold, line breaks
  const formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
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
  const existing = document.getElementById('typingRow');
  if (existing) existing.remove();
}

function showQuickReplies(options) {
  const existing = document.querySelector('.quick-replies');
  if (existing) existing.remove();

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

// ---------- INSURANCE CARDS ----------
function showInsuranceCards() {
  const { travelers, departureDate, returnDate } = state.quoteData;

  let days = 7;
  if (departureDate && returnDate) {
    const d1 = new Date(departureDate);
    const d2 = new Date(returnDate);
    const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
    if (diff > 0) days = diff;
  }

  const numTravelers = parseInt(travelers) || 1;
  const lang = state.lang;

  const wrapper = document.createElement('div');
  wrapper.className = 'cards-wrapper';

  ['basic', 'standard', 'premium'].forEach(planId => {
    const plan = INSURANCE_PLANS[planId];
    const price = calcPrice(planId, numTravelers, days);
    const features = lang === 'es' ? plan.featuresEs : plan.featuresEn;
    const name = lang === 'es' ? plan.nameEs : plan.nameEn;
    const sub = lang === 'es' ? plan.subtitleEs : plan.subtitleEn;

    const card = document.createElement('div');
    card.className = `ins-card card-${planId}`;

    const badgeHtml = plan.badge
      ? `<span class="card-badge ${plan.badge === 'POPULAR' ? 'popular' : ''}">${plan.badge}</span>`
      : '';

    card.innerHTML = `
      <div class="card-header">
        <div class="card-title-group">
          <span class="card-emoji">${plan.emoji}</span>
          <div>
            <div class="card-name">${name}</div>
            <div class="card-sub">${sub}</div>
          </div>
        </div>
        ${badgeHtml}
      </div>
      <div class="card-body">
        <div class="card-price">
          <span class="price-currency">$</span>
          <span class="price-amount">${price.toFixed(2)}</span>
          <span class="price-period">&nbsp;/ ${lang === 'es' ? 'total' : 'total'} (${days} ${lang === 'es' ? 'días' : 'days'}, ${numTravelers} ${numTravelers > 1 ? (lang === 'es' ? 'viajeros' : 'travelers') : (lang === 'es' ? 'viajero' : 'traveler')})</span>
        </div>
        <ul class="card-features">
          ${features.map(f => `<li><span class="feat-icon">✓</span><span>${f}</span></li>`).join('')}
        </ul>
        <button class="btn-buy btn-buy-${planId}" data-plan="${planId}" data-price="${price}">
          ${lang === 'es' ? '🛒 Comprar ahora' : '🛒 Buy now'}
        </button>
        <button class="btn-quote" data-plan="${planId}" data-price="${price}">
          ${lang === 'es' ? '📋 Ver resumen' : '📋 View summary'}
        </button>
      </div>
    `;

    wrapper.appendChild(card);
  });

  chatContainer.appendChild(wrapper);
  scrollToBottom();

  // Buy buttons
  wrapper.querySelectorAll('.btn-buy').forEach(btn => {
    btn.addEventListener('click', () => {
      const planId = btn.dataset.plan;
      const price = btn.dataset.price;
      state.quoteData.selectedPlan = planId;
      handlePurchaseFlow(planId, price);
    });
  });

  // Quote summary buttons
  wrapper.querySelectorAll('.btn-quote').forEach(btn => {
    btn.addEventListener('click', () => {
      const planId = btn.dataset.plan;
      const price = btn.dataset.price;
      state.quoteData.selectedPlan = planId;
      openQuoteModal(planId, parseFloat(price));
    });
  });
}

function handlePurchaseFlow(planId, price) {
  const lang = state.lang;
  const plan = INSURANCE_PLANS[planId];
  const name = lang === 'es' ? plan.nameEs : plan.nameEn;

  const msg = lang === 'es'
    ? `¡Excelente elección! 🎉 Seleccionaste el plan **${name}** por $${parseFloat(price).toFixed(2)}.\n\nPara completar tu compra, necesitarás:\n1. Datos personales de todos los viajeros\n2. Información de pago\n3. Confirmación por email\n\n¿Te gustaría que un asesor te llame para finalizar la compra? O puedes continuar en línea.`
    : `Excellent choice! 🎉 You selected the **${name}** plan for $${parseFloat(price).toFixed(2)}.\n\nTo complete your purchase, you'll need:\n1. Personal info for all travelers\n2. Payment information\n3. Email confirmation\n\nWould you like a representative to call you? Or you can continue online.`;

  addMessage('assistant', msg);

  const opts = lang === 'es'
    ? ['📞 Llamarme', '💻 Continuar en línea', '📋 Ver resumen', '❓ Tengo preguntas']
    : ['📞 Call me', '💻 Continue online', '📋 View summary', '❓ I have questions'];

  showQuickReplies(opts);
}

// ---------- QUOTE MODAL ----------
function openQuoteModal(planId, price) {
  const lang = state.lang;
  const plan = INSURANCE_PLANS[planId];
  const { destination, departureDate, returnDate, travelers, ages, coverageType } = state.quoteData;
  const name = lang === 'es' ? plan.nameEs : plan.nameEn;

  const labelMap = lang === 'es' ? {
    destination: 'Destino',
    departure: 'Fecha de salida',
    return: 'Fecha de regreso',
    travelers: 'Viajeros',
    ages: 'Edades',
    coverage: 'Cobertura',
    plan: 'Plan seleccionado',
    medical: lang === 'es' ? plan.highlights.medicalEs : plan.highlights.medicalEn,
    cancellation: lang === 'es' ? plan.highlights.cancellationEs : plan.highlights.cancellationEn,
    deductible: 'Deducible',
    total: 'Precio total',
  } : {
    destination: 'Destination',
    departure: 'Departure date',
    return: 'Return date',
    travelers: 'Travelers',
    ages: 'Ages',
    coverage: 'Coverage',
    plan: 'Selected plan',
    medical: plan.highlights.medicalEn,
    cancellation: plan.highlights.cancellationEn,
    deductible: 'Deductible',
    total: 'Total price',
  };

  const content = document.getElementById('quoteContent');
  content.innerHTML = `
    <div class="quote-section">
      <div class="quote-section-title">${lang === 'es' ? 'Información del viaje' : 'Trip information'}</div>
      <div class="quote-row"><span class="quote-key">${labelMap.destination}</span><span class="quote-val">${destination || '—'}</span></div>
      <div class="quote-row"><span class="quote-key">${labelMap.departure}</span><span class="quote-val">${departureDate || '—'}</span></div>
      <div class="quote-row"><span class="quote-key">${labelMap.return}</span><span class="quote-val">${returnDate || '—'}</span></div>
      <div class="quote-row"><span class="quote-key">${labelMap.travelers}</span><span class="quote-val">${travelers || '—'}</span></div>
      <div class="quote-row"><span class="quote-key">${labelMap.ages}</span><span class="quote-val">${ages || '—'}</span></div>
      <div class="quote-row"><span class="quote-key">${labelMap.coverage}</span><span class="quote-val">${coverageType || '—'}</span></div>
    </div>
    <div class="quote-divider"></div>
    <div class="quote-section">
      <div class="quote-section-title">${lang === 'es' ? 'Plan seleccionado' : 'Selected plan'}</div>
      <div class="quote-row"><span class="quote-key">${labelMap.plan}</span><span class="quote-val">${plan.emoji} ${name}</span></div>
      <div class="quote-row"><span class="quote-key">${lang === 'es' ? 'Cobertura médica' : 'Medical coverage'}</span><span class="quote-val">${lang === 'es' ? plan.highlights.medicalEs : plan.highlights.medicalEn}</span></div>
      <div class="quote-row"><span class="quote-key">${lang === 'es' ? 'Cancelación' : 'Cancellation'}</span><span class="quote-val">${lang === 'es' ? plan.highlights.cancellationEs : plan.highlights.cancellationEn}</span></div>
      <div class="quote-row"><span class="quote-key">${labelMap.deductible}</span><span class="quote-val">${plan.highlights.deductible}</span></div>
    </div>
    <div class="quote-divider"></div>
    <div class="quote-row" style="font-size:1rem">
      <span class="quote-key" style="font-weight:700;color:var(--navy)">${labelMap.total}</span>
      <span class="quote-val" style="font-size:1.2rem;color:var(--blue)">$${price.toFixed(2)} USD</span>
    </div>
  `;

  document.getElementById('quoteModal').style.display = 'flex';
}

// ---------- DETECT LANGUAGE ----------
function detectLanguage(text) {
  const spanishWords = /\b(el|la|los|las|un|una|para|viaje|seguro|necesito|quiero|tengo|fecha|destino|viajero|cobertura|gracias|hola|si|no|por favor|cómo|cuándo|cuánto|qué)\b/i;
  if (spanishWords.test(text)) return 'es';
  const englishWords = /\b(the|a|an|for|travel|insurance|need|want|have|date|destination|traveler|coverage|thank|hello|hi|yes|no|please|how|when|how much|what)\b/i;
  if (englishWords.test(text)) return 'en';
  return state.lang; // keep current
}

// ---------- EXTRACT QUOTE DATA ----------
function extractQuoteData(userText, assistantText) {
  const combined = userText + ' ' + assistantText;

  // Destination
  const destMatch = combined.match(/(?:destination|destino)[:\s]+([A-Za-záéíóúñ\s,]+?)(?:\.|,|\n|$)/i);
  if (destMatch && !state.quoteData.destination) {
    state.quoteData.destination = destMatch[1].trim();
  }

  // Travelers
  const travMatch = userText.match(/\b(\d+)\s*(?:viajeros?|travelers?|personas?|persons?|people)\b/i);
  if (travMatch) state.quoteData.travelers = travMatch[1];
  else if (/^[1-9]$/.test(userText.trim())) state.quoteData.travelers = userText.trim();

  // Dates — look for common formats
  const datePattern = /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}-\d{2}-\d{2})/g;
  const dates = userText.match(datePattern);
  if (dates && dates.length >= 2) {
    state.quoteData.departureDate = dates[0];
    state.quoteData.returnDate = dates[1];
  } else if (dates && dates.length === 1) {
    if (!state.quoteData.departureDate) state.quoteData.departureDate = dates[0];
    else if (!state.quoteData.returnDate) state.quoteData.returnDate = dates[0];
  }

  // Ages
  const agesMatch = userText.match(/\b(\d{1,2}(?:\s*[,y\/]\s*\d{1,2})*)\s*(?:años?|years?\s*old|age)?\b/i);
  if (agesMatch && state.quoteData.travelers && !state.quoteData.ages) {
    state.quoteData.ages = agesMatch[1];
  }

  // Coverage type
  if (/m[eé]dic|medical/i.test(userText) && /cancel/i.test(userText)) {
    state.quoteData.coverageType = state.lang === 'es' ? 'Médica + Cancelación' : 'Medical + Cancellation';
  } else if (/m[eé]dic|medical/i.test(userText)) {
    state.quoteData.coverageType = state.lang === 'es' ? 'Médica' : 'Medical';
  } else if (/cancel/i.test(userText)) {
    state.quoteData.coverageType = state.lang === 'es' ? 'Cancelación' : 'Cancellation';
  } else if (/ambas|both|todo|all|completa/i.test(userText)) {
    state.quoteData.coverageType = state.lang === 'es' ? 'Completa' : 'Full';
  }
}

// ---------- CLAUDE API CALL ----------
async function callClaude(userMessage) {
  // Guard for missing API key
  if (!CONFIG.ANTHROPIC_API_KEY || CONFIG.ANTHROPIC_API_KEY === 'YOUR_ANTHROPIC_API_KEY') {
    return simulateBotResponse(userMessage);
  }

  const messages = [
    ...state.messages.slice(-20), // keep last 20 messages for context
  ];

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
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Claude API error:', err);
      throw new Error(err.error?.message || 'API error');
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (err) {
    console.error('Claude call failed:', err);
    return simulateBotResponse(userMessage);
  }
}

// ---------- SIMULATION FALLBACK ----------
function simulateBotResponse(userText) {
  const lang = state.lang;
  const step = state.step;

  const responses = {
    greeting: lang === 'es'
      ? '¡Hola! 👋 Soy TravelSafe AI, tu asistente de seguros de viaje. ¿A qué destino planeas viajar?'
      : 'Hello! 👋 I\'m TravelSafe AI, your travel insurance assistant. Where are you planning to travel?',
    destination: lang === 'es'
      ? '¡Excelente destino! ✈️ ¿Cuáles son tus fechas de viaje? Por favor indícame la fecha de salida y de regreso.'
      : 'Great destination! ✈️ What are your travel dates? Please share your departure and return dates.',
    dates: lang === 'es'
      ? 'Perfecto. ¿Cuántas personas viajarán y cuáles son sus edades?'
      : 'Perfect. How many people will be traveling and what are their ages?',
    travelers: lang === 'es'
      ? '¿Qué tipo de cobertura necesitan? ¿Médica, cancelación o ambas?'
      : 'What type of coverage do you need? Medical, cancellation, or both?',
    coverage: lang === 'es'
      ? '¡Perfecto! Déjame mostrarte las mejores opciones para tu viaje. [SHOW_PLANS]'
      : 'Perfect! Let me show you the best options for your trip. [SHOW_PLANS]',
    default: lang === 'es'
      ? 'Entendido. ¿Hay algo más en lo que pueda ayudarte con tu seguro de viaje?'
      : 'Got it. Is there anything else I can help you with regarding your travel insurance?',
  };

  // Step progression
  const stepFlow = ['greeting', 'destination', 'dates', 'travelers', 'coverage', 'default'];
  const currentIdx = stepFlow.indexOf(step);
  const nextStep = stepFlow[Math.min(currentIdx + 1, stepFlow.length - 1)];
  state.step = nextStep;

  return responses[step] || responses.default;
}

// ---------- HANDLE USER MESSAGE ----------
async function handleUserMessage(text) {
  text = text.trim();
  if (!text) return;

  // Detect language
  state.lang = detectLanguage(text);

  // Add to UI + history
  addMessage('user', text);
  userInput.value = '';
  userInput.style.height = 'auto';

  // Show typing
  showTyping();

  // Call Claude (or simulation)
  let response;
  try {
    response = await callClaude(text);
  } catch {
    response = simulateBotResponse(text);
  }

  removeTyping();

  // Extract data from the exchange
  extractQuoteData(text, response);

  // Check for [SHOW_PLANS] trigger
  if (response.includes('[SHOW_PLANS]')) {
    const cleaned = response.replace('[SHOW_PLANS]', '').trim();
    if (cleaned) addMessage('assistant', cleaned);
    showInsuranceCards();
  } else {
    addMessage('assistant', response);

    // Contextual quick replies based on step
    const lang = state.lang;
    if (state.step === 'coverage' || response.toLowerCase().includes('cobertura') || response.toLowerCase().includes('coverage')) {
      showQuickReplies(
        lang === 'es'
          ? ['🏥 Solo médica', '❌ Solo cancelación', '🌟 Ambas coberturas']
          : ['🏥 Medical only', '❌ Cancellation only', '🌟 Both coverages']
      );
    }
  }
}

// ---------- INPUT HANDLING ----------
userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleUserMessage(userInput.value);
  }
});

userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
});

sendBtn.addEventListener('click', () => handleUserMessage(userInput.value));

// ---------- MODAL HANDLERS ----------
document.getElementById('closeQuoteModal').addEventListener('click', () => {
  document.getElementById('quoteModal').style.display = 'none';
});
document.getElementById('closeQuoteModal2').addEventListener('click', () => {
  document.getElementById('quoteModal').style.display = 'none';
});

document.getElementById('sendEmailBtn').addEventListener('click', () => {
  document.getElementById('quoteModal').style.display = 'none';
  document.getElementById('emailModal').style.display = 'flex';
});

document.getElementById('closeEmailModal').addEventListener('click', () => {
  document.getElementById('emailModal').style.display = 'none';
});
document.getElementById('cancelEmailModal').addEventListener('click', () => {
  document.getElementById('emailModal').style.display = 'none';
});

document.getElementById('confirmSendEmail').addEventListener('click', () => {
  const email = document.getElementById('emailInput').value;
  if (!email || !email.includes('@')) {
    document.getElementById('emailInput').style.borderColor = 'var(--red)';
    return;
  }
  document.getElementById('emailModal').style.display = 'none';
  const lang = state.lang;
  const msg = lang === 'es'
    ? `✅ ¡Listo! Tu cotización fue enviada a **${email}**. Revisa tu bandeja de entrada en los próximos minutos.`
    : `✅ Done! Your quote was sent to **${email}**. Check your inbox in the next few minutes.`;
  addMessage('assistant', msg);
});

// Close modals on overlay click
['quoteModal', 'emailModal'].forEach(id => {
  document.getElementById(id).addEventListener('click', e => {
    if (e.target.id === id) e.target.style.display = 'none';
  });
});

// ---------- INIT ----------
function init() {
  // Welcome message (bilingual)
  const welcomeEs = `¡Hola! 👋 Welcome to **TravelSafe AI**\n\nSoy tu asistente de seguros de viaje. Estoy aquí para ayudarte a encontrar la cobertura perfecta para tu próxima aventura.\n\n*I'm also happy to help you in English!*\n\n¿A qué destino planeas viajar? / Where are you planning to travel?`;

  setTimeout(() => {
    addMessage('assistant', welcomeEs);
    showQuickReplies([
      '🇪🇺 Europa / Europe',
      '🌎 América Latina',
      '🇺🇸 Estados Unidos / USA',
      '🌏 Asia / Pacific',
    ]);
  }, 400);
}

init();
