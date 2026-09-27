const { Appointment, MedicalRecord, Patient, Doctor, Consultation } = require('../models');
const { asyncHandler } = require('../routes/middleware/validate');

class AIController {
  constructor() {
    this.symptomDatabase = require('../utils/symptomDatabase');
    this.medicationDatabase = require('../utils/medicationDatabase');
  }

  analyzeSymptoms = asyncHandler(async (req, res) => {
    const { symptoms, age, gender, duration } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide symptoms for analysis'
      });
    }

    const analysis = await this.performSymptomAnalysis(symptoms, { age, gender, duration });

    if (req.user) {
      const patient = await Patient.findOne({ user: req.user.id });
      if (patient) {
        analysis.patientHistory = await this.getPatientHistoryContext(patient._id);
      }
    }

    const recommendations = await this.generateDoctorRecommendations(analysis);

    res.status(200).json({
      success: true,
      data: {
        analysis,
        recommendations,
        disclaimer: 'This analysis is for informational purposes only and should not replace professional medical advice. Please consult a healthcare provider for proper diagnosis and treatment.'
      }
    });
  });

  async performSymptomAnalysis(symptoms, demographics) {
    const symptomAnalysis = symptoms.map(symptom => {
      const data = this.symptomDatabase.getSymptomInfo(symptom.toLowerCase());
      return {
        symptom,
        severity: data?.severity || 'moderate',
        commonCauses: data?.causes || [],
        relatedConditions: data?.conditions || [],
        urgency: data?.urgency || 'routine'
      };
    });

    const possibleConditions = this.identifyPossibleConditions(symptoms, demographics);

    const urgencyLevel = this.determineUrgency(symptomAnalysis);

    return {
      symptoms: symptomAnalysis,
      possibleConditions,
      urgencyLevel,
      recommendations: this.generateImmediateRecommendations(urgencyLevel, symptoms)
    };
  }

  identifyPossibleConditions(symptoms, demographics) {
    const conditions = [];
    const symptomNames = symptoms.map(s => s.toLowerCase());

    const conditionMap = {
      commonCold: {
        symptoms: ['cough', 'runny nose', 'sore throat', 'sneezing', 'mild fever'],
        probability: 0.3,
        type: 'viral infection'
      },
      influenza: {
        symptoms: ['high fever', 'body aches', 'fatigue', 'cough', 'headache'],
        probability: 0.25,
        type: 'viral infection'
      },
      allergicReaction: {
        symptoms: ['sneezing', 'itchy eyes', 'runny nose', 'hives', 'swelling'],
        probability: 0.2,
        type: 'allergic condition'
      },
      migraine: {
        symptoms: ['severe headache', 'nausea', 'light sensitivity', 'sound sensitivity'],
        probability: 0.15,
        type: 'neurological'
      },
      gastritis: {
        symptoms: ['stomach pain', 'nausea', 'bloating', 'indigestion'],
        probability: 0.2,
        type: 'gastrointestinal'
      },
      hypertension: {
        symptoms: ['headache', 'dizziness', 'blurred vision', 'chest pain'],
        probability: 0.1,
        type: 'cardiovascular'
      },
      diabetes: {
        symptoms: ['excessive thirst', 'frequent urination', 'fatigue', 'blurred vision'],
        probability: 0.1,
        type: 'metabolic'
      },
      anxiety: {
        symptoms: ['racing heart', 'shortness of breath', 'sweating', 'restlessness'],
        probability: 0.15,
        type: 'mental health'
      }
    };

    Object.entries(conditionMap).forEach(([condition, data]) => {
      const matchingSymptoms = data.symptoms.filter(s =>
        symptomNames.some(sn => sn.includes(s) || s.includes(sn))
      );

      if (matchingSymptoms.length > 0) {
        const matchScore = (matchingSymptoms.length / data.symptoms.length) * data.probability;
        conditions.push({
          condition: condition.replace(/([A-Z])/g, ' $1').trim(),
          type: data.type,
          matchScore: Math.round(matchScore * 100),
          matchingSymptoms,
          description: this.getConditionDescription(condition)
        });
      }
    });

    return conditions.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
  }

  getConditionDescription(condition) {
    const descriptions = {
      commonCold: 'A viral infection of the upper respiratory tract, usually mild and self-limiting.',
      influenza: 'A contagious respiratory illness caused by influenza viruses, more severe than common cold.',
      allergicReaction: 'An immune system response to a foreign substance that is typically harmless.',
      migraine: 'A neurological condition characterized by intense, debilitating headaches.',
      gastritis: 'Inflammation of the stomach lining, which can be acute or chronic.',
      hypertension: 'High blood pressure that can lead to serious health problems if untreated.',
      diabetes: 'A metabolic disease causing high blood sugar levels due to insulin problems.',
      anxiety: 'A mental health condition characterized by feelings of worry or fear.'
    };
    return descriptions[condition] || 'A medical condition requiring professional evaluation.';
  }

  determineUrgency(symptomAnalysis) {
    const emergencySymptoms = [
      'chest pain', 'difficulty breathing', 'severe bleeding', 'loss of consciousness',
      'stroke symptoms', 'severe allergic reaction', 'major trauma'
    ];

    const urgentSymptoms = [
      'high fever', 'severe pain', 'persistent vomiting', 'severe headache',
      'sudden vision changes', 'severe dizziness'
    ];

    for (const analysis of symptomAnalysis) {
      if (emergencySymptoms.some(es => analysis.symptom.toLowerCase().includes(es))) {
        return 'emergency';
      }
      if (urgentSymptoms.some(us => analysis.symptom.toLowerCase().includes(us))) {
        return 'urgent';
      }
    }

    return 'routine';
  }

  generateImmediateRecommendations(urgencyLevel, symptoms) {
    const recommendations = {
      emergency: [
        'Seek immediate emergency medical attention',
        'Call emergency services if necessary',
        'Do not drive yourself to the hospital'
      ],
      urgent: [
        'See a doctor within 24-48 hours',
        'Monitor your symptoms closely',
        'Keep a record of symptom progression'
      ],
      routine: [
        'Schedule an appointment with your primary care physician',
        'Get adequate rest and hydration',
        'Monitor for any changes in symptoms'
      ]
    };

    return recommendations[urgencyLevel] || recommendations.routine;
  }

  async getPatientHistoryContext(patientId) {
    const records = await MedicalRecord.find({ patient: patientId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('diagnosis createdAt');

    return {
      recentDiagnoses: records.map(r => r.diagnosis?.primary).filter(Boolean),
      chronicConditions: []
    };
  }

  async generateDoctorRecommendations(analysis) {
    const specialties = this.mapConditionsToSpecialties(analysis.possibleConditions);

    const doctors = await Doctor.find({
      specialization: { $in: specialties },
      isVerified: true,
      isAvailable: true
    })
      .populate('user', 'firstName lastName avatar')
      .limit(5);

    return {
      recommendedSpecialties: specialties,
      suggestedDoctors: doctors
    };
  }

  mapConditionsToSpecialties(conditions) {
    const specialtyMap = {
      'viral infection': 'General Practice',
      'allergic condition': 'Allergist',
      'neurological': 'Neurologist',
      'gastrointestinal': 'Gastroenterologist',
      'cardiovascular': 'Cardiologist',
      'metabolic': 'Endocrinologist',
      'mental health': 'Psychiatrist'
    };

    const specialties = new Set();
    conditions.forEach(c => {
      if (specialtyMap[c.type]) {
        specialties.add(specialtyMap[c.type]);
      }
    });

    return Array.from(specialties);
  }

  chatWithAI = asyncHandler(async (req, res) => {
    const { message, context, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message'
      });
    }

    let patientContext = null;
    if (req.user) {
      const patient = await Patient.findOne({ user: req.user.id });
      if (patient) {
        patientContext = await this.buildPatientContext(patient);
      }
    }

    const response = await this.generateChatResponse(message, {
      context,
      patientContext,
      sessionId
    });

    res.status(200).json({
      success: true,
      data: response
    });
  });

  async buildPatientContext(patient) {
    const [recentAppointments, medicalRecords] = await Promise.all([
      Appointment.find({ patient: patient._id })
        .sort({ date: -1 })
        .limit(3)
        .populate({
          path: 'doctor',
          populate: { path: 'user', select: 'firstName lastName' }
        }),
      MedicalRecord.find({ patient: patient._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title diagnosis createdAt')
    ]);

    return {
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      currentMedications: patient.currentMedications,
      recentAppointments: recentAppointments.map(a => ({
        date: a.date,
        doctor: a.doctor?.user ? `${a.doctor.user.firstName} ${a.doctor.user.lastName}` : 'Unknown',
        reason: a.reason
      })),
      recentDiagnoses: medicalRecords.map(r => ({
        title: r.title,
        diagnosis: r.diagnosis?.primary
      }))
    };
  }

  async generateChatResponse(message, options) {
    const { patientContext } = options;

    const intents = this.detectIntent(message);

    let response = {
      message: '',
      suggestedActions: [],
      followUpQuestions: []
    };

    if (intents.includes('appointment')) {
      response.message = this.generateAppointmentResponse(message, patientContext);
      response.suggestedActions = ['book_appointment', 'view_appointments'];
    } else if (intents.includes('symptoms')) {
      response.message = this.generateSymptomResponse(message);
      response.suggestedActions = ['analyze_symptoms'];
      response.followUpQuestions = [
        'How long have you been experiencing these symptoms?',
        'Are there any other symptoms you are experiencing?'
      ];
    } else if (intents.includes('medication')) {
      response.message = this.generateMedicationResponse(message, patientContext);
      response.suggestedActions = ['view_prescriptions'];
    } else if (intents.includes('general')) {
      response.message = this.generateGeneralHealthResponse(message);
    } else {
      response.message = this.generateDefaultResponse(message);
    }

    if (patientContext) {
      response.message = this.personalizeResponse(response.message, patientContext);
    }

    return response;
  }

  detectIntent(message) {
    const intents = [];
    const lowerMessage = message.toLowerCase();

    const intentPatterns = {
      appointment: ['book', 'appointment', 'schedule', 'doctor', 'see'],
      symptoms: ['symptom', 'pain', 'ache', 'hurt', 'feel', 'sick', 'fever', 'cough', 'headache'],
      medication: ['medicine', 'medication', 'prescription', 'drug', 'pill', 'dosage'],
      general: ['health', 'advice', 'tips', 'how to', 'what should']
    };

    Object.entries(intentPatterns).forEach(([intent, patterns]) => {
      if (patterns.some(p => lowerMessage.includes(p))) {
        intents.push(intent);
      }
    });

    return intents.length > 0 ? intents : ['unknown'];
  }

  generateAppointmentResponse(message, context) {
    return "I can help you book an appointment. Would you like me to show you available doctors or help you find a specialist for your condition?";
  }

  generateSymptomResponse(message) {
    return "I understand you're experiencing symptoms. To provide better assistance, I can analyze your symptoms and suggest possible causes. Would you like to proceed with a symptom analysis?";
  }

  generateMedicationResponse(message, context) {
    if (context?.currentMedications?.length > 0) {
      return `Based on your records, you are currently taking ${context.currentMedications.length} medication(s). Please consult your doctor before making any changes to your medication regimen.`;
    }
    return "I can help you with medication-related queries. What would you like to know - information about a specific medication, dosage reminders, or managing prescriptions?";
  }

  generateGeneralHealthResponse(message) {
    const tips = [
      "Staying hydrated is essential for overall health. Aim for 8 glasses of water daily.",
      "Regular exercise, even a 30-minute walk, can significantly improve your health.",
      "Getting 7-9 hours of quality sleep is crucial for your body's recovery and immune system.",
      "Managing stress through meditation or deep breathing can improve both mental and physical health."
    ];

    return {
      message: tips[Math.floor(Math.random() * tips.length)],
      disclaimer: 'This is general health information and not personalized medical advice.'
    };
  }

  generateDefaultResponse(message) {
    return "Hello! I'm your medical assistant. I can help you with:\n\n• Analyzing symptoms\n• Booking appointments\n• Medication information\n• General health tips\n\nHow can I assist you today?";
  }

  personalizeResponse(message, context) {
    return message;
  }

  summarizeMedicalRecords = asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      const patient = await Patient.findOne({ user: req.user.id });
      if (!patient || patient._id.toString() !== patientId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access these records'
        });
      }
    }

    const patient = await Patient.findById(patientId)
      .populate('user', 'firstName lastName');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const [records, consultations] = await Promise.all([
      MedicalRecord.find({ patient: patientId }).sort({ createdAt: -1 }),
      Consultation.find({ patient: patientId }).sort({ createdAt: -1 })
    ]);

    const summary = this.generateRecordSummary(records, consultations, patient);

    res.status(200).json({
      success: true,
      data: summary
    });
  });

  generateRecordSummary(records, consultations, patient) {
    const conditions = new Map();
    const medications = new Map();
    const vitals = [];

    records.forEach(record => {
      if (record.diagnosis?.primary) {
        const condition = record.diagnosis.primary;
        conditions.set(condition, (conditions.get(condition) || 0) + 1);
      }

      record.treatment?.medications?.forEach(med => {
        if (med.name) {
          medications.set(med.name, (medications.get(med.name) || 0) + 1);
        }
      });

      if (record.vitals) {
        vitals.push({
          date: record.createdAt,
          ...record.vitals
        });
      }
    });

    const recentConditions = Array.from(conditions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, occurrences: count }));

    const frequentMedications = Array.from(medications.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, prescriptions: count }));

    const vitalsTrends = this.analyzeVitalTrends(vitals);

    return {
      patient: {
        name: `${patient.user.firstName} ${patient.user.lastName}`,
        age: patient.age,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup
      },
      overview: {
        totalRecords: records.length,
        totalConsultations: consultations.length,
        dateRange: {
          earliest: records[records.length - 1]?.createdAt,
          latest: records[0]?.createdAt
        }
      },
      healthSummary: {
        conditions: recentConditions,
        medications: frequentMedications,
        vitalsTrends
      },
      keyInsights: this.generateHealthInsights(recentConditions, vitalsTrends, patient),
      recommendations: this.generateFollowUpRecommendations(records, consultations)
    };
  }

  analyzeVitalTrends(vitals) {
    if (vitals.length === 0) return null;

    const trends = {
      bloodPressure: [],
      heartRate: [],
      weight: [],
      temperature: []
    };

    vitals.forEach(v => {
      if (v.bloodPressure?.systolic && v.bloodPressure?.diastolic) {
        trends.bloodPressure.push({
          date: v.date,
          systolic: v.bloodPressure.systolic,
          diastolic: v.bloodPressure.diastolic
        });
      }
      if (v.heartRate) {
        trends.heartRate.push({ date: v.date, value: v.heartRate });
      }
      if (v.weight) {
        trends.weight.push({ date: v.date, value: v.weight });
      }
      if (v.temperature?.value) {
        trends.temperature.push({ date: v.date, value: v.temperature.value });
      }
    });

    Object.keys(trends).forEach(key => {
      if (trends[key].length === 0) delete trends[key];
    });

    return trends;
  }

  generateHealthInsights(conditions, vitalsTrends, patient) {
    const insights = [];

    if (conditions.some(c => c.name.toLowerCase().includes('diabetes'))) {
      insights.push({
        type: 'condition',
        message: 'Patient has history of diabetes. Monitor blood sugar levels regularly.',
        priority: 'high'
      });
    }

    if (conditions.some(c => c.name.toLowerCase().includes('hypertension'))) {
      insights.push({
        type: 'condition',
        message: 'Patient has history of hypertension. Regular blood pressure monitoring recommended.',
        priority: 'high'
      });
    }

    if (patient.allergies?.length > 0) {
      insights.push({
        type: 'allergy',
        message: `Patient has ${patient.allergies.length} known allergy/allergies. Check medications carefully.`,
        priority: 'medium'
      });
    }

    return insights;
  }

  generateFollowUpRecommendations(records, consultations) {
    const recommendations = [];

    const recentConsultations = consultations.filter(
      c => c.status === 'completed' && c.followUp?.required
    );

    recentConsultations.forEach(c => {
      recommendations.push({
        type: 'follow-up',
        message: `Follow-up recommended${c.followUp.date ? ` by ${new Date(c.followUp.date).toLocaleDateString()}` : ''}`,
        consultationId: c._id
      });
    });

    if (records.length > 0) {
      const lastRecordDate = new Date(records[0].createdAt);
      const monthsSinceLastRecord = (Date.now() - lastRecordDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

      if (monthsSinceLastRecord > 6) {
        recommendations.push({
          type: 'checkup',
          message: 'No medical records in the last 6 months. Consider scheduling a routine checkup.',
          priority: 'low'
        });
      }
    }

    return recommendations;
  }

  predictHealthRisks = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const records = await MedicalRecord.find({ patient: patient._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const riskAssessment = this.assessHealthRisks(patient, records);

    res.status(200).json({
      success: true,
      data: riskAssessment
    });
  });

  assessHealthRisks(patient, records) {
    const risks = [];
    const age = patient.age || 0;
    const gender = patient.gender;
    const bmi = this.calculateBMI(patient.height, patient.weight);

    if (age > 45) {
      risks.push({
        category: 'age-related',
        factors: ['Age over 45'],
        conditions: ['Cardiovascular disease', 'Diabetes', 'Hypertension'],
        recommendations: [
          'Schedule regular health screenings',
          'Monitor blood pressure regularly',
          'Maintain healthy weight and exercise routine'
        ],
        riskLevel: age > 60 ? 'high' : 'moderate'
      });
    }

    if (bmi && bmi > 25) {
      risks.push({
        category: 'weight-related',
        factors: [`BMI: ${bmi.toFixed(1)}`],
        conditions: ['Type 2 Diabetes', 'Heart Disease', 'Joint Problems'],
        recommendations: [
          'Consult with a nutritionist for diet planning',
          'Aim for 150 minutes of moderate exercise weekly',
          'Monitor blood sugar and cholesterol levels'
        ],
        riskLevel: bmi > 30 ? 'high' : 'moderate'
      });
    }

    if (patient.allergies?.some(a => a.severity === 'severe')) {
      risks.push({
        category: 'allergy',
        factors: ['Severe allergies documented'],
        conditions: ['Anaphylaxis risk'],
        recommendations: [
          'Carry emergency medication (EpiPen)',
          'Educate family and friends about allergy triggers',
          'Wear a medical alert bracelet'
        ],
        riskLevel: 'high'
      });
    }

    const chronicKeywords = ['diabetes', 'hypertension', 'heart', 'asthma', 'copd'];
    const hasChronicCondition = records.some(r =>
      chronicKeywords.some(k =>
        r.diagnosis?.primary?.toLowerCase().includes(k) ||
        r.diagnosis?.secondary?.some(s => s.toLowerCase().includes(k))
      )
    );

    if (hasChronicCondition) {
      risks.push({
        category: 'chronic',
        factors: ['History of chronic conditions'],
        conditions: ['Disease progression', 'Complications'],
        recommendations: [
          'Adhere to prescribed medications',
          'Attend regular follow-up appointments',
          'Monitor symptoms and report changes to your doctor'
        ],
        riskLevel: 'moderate'
      });
    }

    return {
      overallRiskLevel: risks.some(r => r.riskLevel === 'high') ? 'elevated' : 'normal',
      risks,
      positiveFactors: this.identifyPositiveFactors(patient, records),
      disclaimer: 'This risk assessment is based on available data and general health guidelines. It should not replace personalized medical advice from your healthcare provider.'
    };
  }

  calculateBMI(height, weight) {
    if (!height || !weight) return null;

    let heightM = height.unit === 'ft' ? height.value * 0.3048 : height.value / 100;
    let weightKg = weight.unit === 'lbs' ? weight.value * 0.453592 : weight.value;

    return weightKg / (heightM * heightM);
  }

  identifyPositiveFactors(patient, records) {
    const factors = [];

    if (patient.bloodGroup) {
      factors.push('Blood group documented');
    }

    if (!patient.allergies || patient.allergies.length === 0) {
      factors.push('No known allergies');
    }

    if (records.length > 3) {
      factors.push('Regular medical follow-ups');
    }

    return factors;
  }

  suggestAppointments = asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const suggestions = await this.generateAppointmentSuggestions(patient);

    res.status(200).json({
      success: true,
      data: suggestions
    });
  });

  async generateAppointmentSuggestions(patient) {
    const suggestions = [];
    const age = patient.age || 0;

    if (age >= 40 && !patient.gender) {
      suggestions.push({
        type: 'checkup',
        specialty: 'General Practice',
        reason: 'Annual health screening recommended for adults 40+',
        urgency: 'routine',
        suggestedTimeframe: 'Within 3 months'
      });
    }

    if (patient.bloodGroup === 'unknown') {
      suggestions.push({
        type: 'lab-test',
        specialty: 'Laboratory',
        reason: 'Blood group determination',
        urgency: 'routine',
        suggestedTimeframe: 'Anytime'
      });
    }

    if (!patient.emergencyContact?.phone) {
      suggestions.push({
        type: 'administrative',
        reason: 'Update emergency contact information',
        urgency: 'low',
        suggestedTimeframe: 'At next visit'
      });
    }

    const recentAppointments = await Appointment.find({
      patient: patient._id,
      date: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
    });

    if (recentAppointments.length === 0) {
      suggestions.push({
        type: 'checkup',
        specialty: 'General Practice',
        reason: 'No appointments in the last 6 months',
        urgency: 'routine',
        suggestedTimeframe: 'Within 1 month'
      });
    }

    return {
      personalized: suggestions,
      general: [
        {
          type: 'preventive',
          specialty: 'General Practice',
          reason: 'Annual wellness exam',
          urgency: 'routine',
          suggestedTimeframe: 'Annually'
        },
        {
          type: 'preventive',
          specialty: 'Ophthalmology',
          reason: 'Eye examination',
          urgency: 'routine',
          suggestedTimeframe: age > 50 ? 'Annually' : 'Every 2 years'
        }
      ]
    };
  }
}

module.exports = new AIController();
