const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'unspecified'],
    default: 'unspecified'
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
    default: 'unknown'
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  insurance: {
    provider: String,
    policyNumber: String,
    isValid: {
      type: Boolean,
      default: false
    }
  },
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    notes: String
  }],
  allergies: [{
    type: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'mild'
    }
  }],
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date
  }],
  height: {
    value: Number,
    unit: {
      type: String,
      enum: ['cm', 'ft'],
      default: 'cm'
    }
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['kg', 'lbs'],
      default: 'kg'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

patientSchema.virtual('appointments', {
  ref: 'Appointment',
  localField: '_id',
  foreignField: 'patient'
});

patientSchema.virtual('medicalRecords', {
  ref: 'MedicalRecord',
  localField: '_id',
  foreignField: 'patient'
});

patientSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

patientSchema.index({ gender: 1 });
patientSchema.index({ 'address.city': 1 });

module.exports = mongoose.model('Patient', patientSchema);
