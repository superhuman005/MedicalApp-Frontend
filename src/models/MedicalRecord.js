const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor is required']
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  title: {
    type: String,
    required: [true, 'Record title is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['consultation', 'lab-result', 'prescription', 'imaging', 'surgery', 'vaccination', 'other'],
    required: [true, 'Record type is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  diagnosis: {
    primary: {
      type: String,
      required: [true, 'Primary diagnosis is required']
    },
    secondary: [{
      type: String
    }],
    icdCode: String
  },
  treatment: {
    plan: String,
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String,
      notes: String
    }],
    procedures: [String],
    recommendations: String
  },
  vitals: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    temperature: {
      value: Number,
      unit: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    respiratoryRate: Number,
    oxygenSaturation: Number,
    weight: Number,
    height: Number,
    bmi: Number
  },
  labResults: [{
    testName: String,
    testDate: Date,
    result: String,
    unit: String,
    referenceRange: String,
    isAbnormal: Boolean,
    notes: String
  }],
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'report']
    },
    name: String,
    url: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],
  isConfidential: {
    type: Boolean,
    default: false
  },
  accessLog: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      enum: ['view', 'edit', 'download']
    },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

medicalRecordSchema.index({ patient: 1, createdAt: -1 });
medicalRecordSchema.index({ doctor: 1 });
medicalRecordSchema.index({ type: 1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
