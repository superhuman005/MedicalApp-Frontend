const symptomData = {
  headache: {
    severity: 'moderate',
    urgency: 'routine',
    causes: ['stress', 'dehydration', 'eye strain', 'migraine', 'tension', 'sinus issues'],
    conditions: ['migraine', 'tension headache', 'sinusitis', 'hypertension']
  },
  fever: {
    severity: 'moderate',
    urgency: 'urgent',
    causes: ['infection', 'inflammation', 'viral illness', 'bacterial infection'],
    conditions: ['flu', 'common cold', 'infection', 'pneumonia']
  },
  cough: {
    severity: 'mild',
    urgency: 'routine',
    causes: ['viral infection', 'allergies', 'irritants', 'post-nasal drip'],
    conditions: ['common cold', 'bronchitis', 'allergies', 'asthma']
  },
  'chest pain': {
    severity: 'severe',
    urgency: 'emergency',
    causes: ['heart problem', 'lung issue', 'muscle strain', 'anxiety'],
    conditions: ['heart attack', 'angina', 'pneumonia', 'anxiety']
  },
  'shortness of breath': {
    severity: 'severe',
    urgency: 'emergency',
    causes: ['asthma', 'heart condition', 'lung disease', 'anxiety'],
    conditions: ['asthma', 'COPD', 'heart failure', 'pneumonia']
  },
  nausea: {
    severity: 'mild',
    urgency: 'routine',
    causes: ['food poisoning', 'viral infection', 'medication', 'pregnancy'],
    conditions: ['gastroenteritis', 'food poisoning', 'pregnancy', 'migraine']
  },
  'stomach pain': {
    severity: 'moderate',
    urgency: 'routine',
    causes: ['indigestion', 'gas', 'infection', 'appendicitis'],
    conditions: ['gastritis', 'appendicitis', 'IBS', 'food poisoning']
  },
  dizziness: {
    severity: 'moderate',
    urgency: 'urgent',
    causes: ['dehydration', 'low blood sugar', 'inner ear problem', 'medication'],
    conditions: ['vertigo', 'hypoglycemia', 'dehydration', 'anemia']
  },
  fatigue: {
    severity: 'mild',
    urgency: 'routine',
    causes: ['lack of sleep', 'stress', 'anemia', 'thyroid issues'],
    conditions: ['depression', 'anemia', 'hypothyroidism', 'chronic fatigue']
  },
  'sore throat': {
    severity: 'mild',
    urgency: 'routine',
    causes: ['viral infection', 'bacterial infection', 'allergies', 'dry air'],
    conditions: ['strep throat', 'common cold', 'tonsillitis', 'allergies']
  },
  'runny nose': {
    severity: 'mild',
    urgency: 'routine',
    causes: ['cold', 'allergies', 'sinus infection', 'irritants'],
    conditions: ['common cold', 'allergic rhinitis', 'sinusitis']
  },
  'body aches': {
    severity: 'moderate',
    urgency: 'routine',
    causes: ['viral infection', 'exercise', 'flu', 'dehydration'],
    conditions: ['influenza', 'common cold', 'fibromyalgia', 'arthritis']
  },
  rash: {
    severity: 'mild',
    urgency: 'urgent',
    causes: ['allergic reaction', 'infection', 'autoimmune', 'medication'],
    conditions: ['allergic reaction', 'eczema', 'contact dermatitis', 'measles']
  },
  'joint pain': {
    severity: 'moderate',
    urgency: 'routine',
    causes: ['arthritis', 'injury', 'overuse', 'infection'],
    conditions: ['osteoarthritis', 'rheumatoid arthritis', 'gout', 'bursitis']
  },
  swelling: {
    severity: 'moderate',
    urgency: 'urgent',
    causes: ['injury', 'infection', 'allergic reaction', 'fluid retention'],
    conditions: ['edema', 'allergic reaction', 'infection', 'heart failure']
  },
  vomiting: {
    severity: 'moderate',
    urgency: 'urgent',
    causes: ['food poisoning', 'viral infection', 'medication', 'pregnancy'],
    conditions: ['gastroenteritis', 'food poisoning', 'morning sickness', 'migraine']
  },
  'blurred vision': {
    severity: 'moderate',
    urgency: 'urgent',
    causes: ['eye strain', 'diabetes', 'migraine', 'eye condition'],
    conditions: ['glaucoma', 'cataracts', 'diabetic retinopathy', 'migraine']
  },
  'urinary problems': {
    severity: 'moderate',
    urgency: 'urgent',
    causes: ['UTI', 'kidney stones', 'prostate issues', 'infection'],
    conditions: ['UTI', 'kidney stones', 'prostatitis', 'bladder infection']
  },
  anxiety: {
    severity: 'moderate',
    urgency: 'routine',
    causes: ['stress', 'mental health condition', 'medication', 'substance use'],
    conditions: ['anxiety disorder', 'panic disorder', 'depression', 'PTSD']
  },
  depression: {
    severity: 'moderate',
    urgency: 'routine',
    causes: ['chemical imbalance', 'life events', 'medical conditions', 'medication'],
    conditions: ['major depressive disorder', 'bipolar disorder', 'dysthymia']
  },
  insomnia: {
    severity: 'mild',
    urgency: 'routine',
    causes: ['stress', 'poor sleep habits', 'medical conditions', 'medication'],
    conditions: ['insomnia', 'sleep apnea', 'restless leg syndrome', 'anxiety']
  },
  'weight changes': {
    severity: 'moderate',
    urgency: 'routine',
    causes: ['diet changes', 'thyroid issues', 'medication', 'stress'],
    conditions: ['hyperthyroidism', 'hypothyroidism', 'diabetes', 'eating disorder']
  },
  'hair loss': {
    severity: 'mild',
    urgency: 'routine',
    causes: ['genetics', 'stress', 'nutritional deficiency', 'medical condition'],
    conditions: ['alopecia', 'thyroid disorder', 'iron deficiency', 'autoimmune']
  },
  constipation: {
    severity: 'mild',
    urgency: 'routine',
    causes: ['diet', 'dehydration', 'medication', 'inactivity'],
    conditions: ['IBS', 'hypothyroidism', 'diabetes', 'medication side effect']
  },
  diarrhea: {
    severity: 'moderate',
    urgency: 'urgent',
    causes: ['infection', 'food poisoning', 'medication', 'IBS'],
    conditions: ['gastroenteritis', 'IBS', 'celiac disease', 'inflammatory bowel disease']
  }
};

function getSymptomInfo(symptom) {
  return symptomData[symptom.toLowerCase()] || null;
}

function searchSymptoms(query) {
  const results = [];
  const lowerQuery = query.toLowerCase();

  Object.entries(symptomData).forEach(([symptom, data]) => {
    if (symptom.includes(lowerQuery) ||
        data.causes.some(c => c.includes(lowerQuery)) ||
        data.conditions.some(c => c.includes(lowerQuery))) {
      results.push({ symptom, ...data });
    }
  });

  return results;
}

function getAllSymptoms() {
  return Object.keys(symptomData);
}

function getSymptomsByUrgency(urgency) {
  return Object.entries(symptomData)
    .filter(([, data]) => data.urgency === urgency)
    .map(([symptom, data]) => ({ symptom, ...data }));
}

module.exports = {
  getSymptomInfo,
  searchSymptoms,
  getAllSymptoms,
  getSymptomsByUrgency
};
