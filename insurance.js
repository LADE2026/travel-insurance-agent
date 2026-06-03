// =============================================
// INSURANCE PLANS DATA
// =============================================
const INSURANCE_PLANS = {
  basic: {
    id: 'basic',
    nameEs: 'Básico',
    nameEn: 'Basic',
    emoji: '🛡️',
    subtitleEs: 'Cobertura esencial',
    subtitleEn: 'Essential coverage',
    pricePerDay: 2.5,
    currency: 'USD',
    badge: null,
    featuresEs: [
      'Asistencia médica hasta $25,000',
      'Repatriación de emergencia',
      'Pérdida de equipaje hasta $500',
      'Cancelación de vuelo (causas cubiertas)',
      'Asistencia telefónica 24/7',
    ],
    featuresEn: [
      'Medical assistance up to $25,000',
      'Emergency repatriation',
      'Baggage loss up to $500',
      'Flight cancellation (covered causes)',
      '24/7 phone assistance',
    ],
    highlights: {
      medicalEs: 'Hasta $25,000',
      medicalEn: 'Up to $25,000',
      cancellationEs: 'Causas básicas',
      cancellationEn: 'Basic causes',
      deductible: '$200',
    },
  },
  standard: {
    id: 'standard',
    nameEs: 'Estándar',
    nameEn: 'Standard',
    emoji: '⭐',
    subtitleEs: 'El más popular',
    subtitleEn: 'Most popular',
    pricePerDay: 4.5,
    currency: 'USD',
    badge: 'POPULAR',
    featuresEs: [
      'Asistencia médica hasta $100,000',
      'Evacuación médica incluida',
      'Pérdida de equipaje hasta $2,000',
      'Cancelación por cualquier causa',
      'Demora de vuelo +4h cubierta',
      'Accidentes deportivos básicos',
      'Asistencia legal en el extranjero',
    ],
    featuresEn: [
      'Medical assistance up to $100,000',
      'Medical evacuation included',
      'Baggage loss up to $2,000',
      'Cancel for any reason',
      'Flight delay +4h covered',
      'Basic sports accidents',
      'Legal assistance abroad',
    ],
    highlights: {
      medicalEs: 'Hasta $100,000',
      medicalEn: 'Up to $100,000',
      cancellationEs: 'Cualquier causa',
      cancellationEn: 'Any reason',
      deductible: '$100',
    },
  },
  premium: {
    id: 'premium',
    nameEs: 'Premium',
    nameEn: 'Premium',
    emoji: '💎',
    subtitleEs: 'Cobertura total',
    subtitleEn: 'Total coverage',
    pricePerDay: 8.0,
    currency: 'USD',
    badge: 'PREMIUM',
    featuresEs: [
      'Asistencia médica hasta $500,000',
      'Evacuación VIP y repatriación',
      'Pérdida de equipaje hasta $5,000',
      'Cancelación y cambio sin límite',
      'Demora de vuelo +2h cubierta',
      'Deportes extremos incluidos',
      'Asistencia legal premium',
      'COVID-19 cobertura completa',
      'Pérdida de documentos',
      'Robo de efectivo hasta $300',
    ],
    featuresEn: [
      'Medical assistance up to $500,000',
      'VIP evacuation and repatriation',
      'Baggage loss up to $5,000',
      'Unlimited cancellation & changes',
      'Flight delay +2h covered',
      'Extreme sports included',
      'Premium legal assistance',
      'Full COVID-19 coverage',
      'Document loss coverage',
      'Cash theft up to $300',
    ],
    highlights: {
      medicalEs: 'Hasta $500,000',
      medicalEn: 'Up to $500,000',
      cancellationEs: 'Sin límite',
      cancellationEn: 'Unlimited',
      deductible: '$0',
    },
  },
};

// Calculate price for given travelers and days, with optional age-based multiplier
function calcPrice(planId, travelers, days, ages) {
  const plan = INSURANCE_PLANS[planId];
  if (!plan) return 0;

  let ageMultiplier = 1.0;
  if (ages) {
    const ageList = String(ages).split(/[\s,\/]+/).map(Number).filter(n => !isNaN(n) && n > 0);
    if (ageList.length > 0) {
      const avgAge = ageList.reduce((a, b) => a + b, 0) / ageList.length;
      if (avgAge >= 71) ageMultiplier = 2.5;
      else if (avgAge >= 56) ageMultiplier = 1.8;
      else if (avgAge >= 36) ageMultiplier = 1.3;
      else ageMultiplier = 1.0;
    }
  }

  const base = plan.pricePerDay * travelers * days * ageMultiplier;
  const discount = travelers >= 4 ? 0.85 : travelers >= 2 ? 0.92 : 1;
  return Math.round(base * discount * 100) / 100;
}
