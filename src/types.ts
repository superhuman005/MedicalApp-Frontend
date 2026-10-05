// Shared types mirroring the backend's Mongoose models / API responses.
// Keep these in sync with the backend's src/models and src/controllers.

export type UserRole = "patient" | "doctor" | "admin" | "superadmin";
export type DoctorStatus = "online" | "offline" | "busy" | "available";
export type DoctorApprovalStatus = "pending" | "approved" | "rejected";

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;

  // doctor-only
  specialization?: string;
  medicalLicenseNumber?: string;
  yearsOfExperience?: number;
  bio?: string;
  // No per-doctor pricing - this is a subscription-only platform priced by
  // an admin (see Plan/AdminPlan below). Doctors have no pricing controls.
  status?: DoctorStatus;
  rating?: number;
  ratingCount?: number;
  doctorApprovalStatus?: DoctorApprovalStatus;
  approvalNote?: string;

  // demographic - either role
  dateOfBirth?: string;
  gender?: "male" | "female" | "other" | "";

  createdAt?: string;
  updatedAt?: string;
}

export interface FamilyMember {
  _id: string;
  owner: string;
  name: string;
  relationship: string;
  age?: number;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other" | "";
  avatar?: string;
  isSelf: boolean;
  createdAt?: string;
}

// Pre-consultation health questionnaire filled in by the patient. Mirrors the
// backend's questionnaireSchema.
export interface Questionnaire {
  chiefComplaint: string;
  symptoms: string[];
  otherSymptoms?: string;
  symptomDuration: "less-than-24h" | "1-3-days" | "4-7-days" | "1-4-weeks" | "over-1-month";
  severity: number; // 1-10
  medicalConditions: string[];
  currentMedications?: string;
  allergies?: string;
  isPregnant: "yes" | "no" | "not-applicable";
  previousTreatment?: string;
  additionalInfo?: string;
  confirmedAccurate: boolean;
  submittedAt?: string;
}

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "waiting"
  | "in-progress"
  | "completed"
  | "cancelled";

export interface Appointment {
  _id: string;
  patient: User;
  familyMember?: FamilyMember;
  doctor: User;
  date: string;
  time: string;
  type: "video" | "chat";
  appointmentType: "Initial Consultation" | "Follow-up" | "Check-up" | "Emergency";
  reason?: string;
  questionnaire?: Questionnaire;
  status: AppointmentStatus;
  createdAt: string;
}

export type ConsultationRequestStatus = "pending" | "accepted" | "declined" | "completed" | "cancelled";

export interface ConsultationRequestItem {
  _id: string;
  patient: User;
  familyMember?: FamilyMember;
  doctor?: User | null;
  acceptedBy?: User;
  type: "video" | "chat";
  urgency: "low" | "medium" | "high";
  message?: string;
  questionnaire?: Questionnaire;
  status: ConsultationRequestStatus;
  timeAgo?: string;
  appointment?: string;
  createdAt: string;
}

export interface ConsultationRecord {
  _id: string;
  patient: string;
  familyMember?: { _id: string; name: string; relationship: string };
  doctor: { _id: string; firstName: string; lastName: string; specialization?: string; avatar?: string };
  appointment?: string;
  date: string;
  specialty?: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  status: "completed" | "follow-up-required" | "cancelled";
}

export type PrescriptionAdminStatus = "none" | "pending" | "fulfilled" | "rejected";

export interface Prescription {
  _id: string;
  patient: string;
  familyMember?: { _id: string; name: string; relationship: string };
  prescribedBy: { _id: string; firstName: string; lastName: string; specialization?: string };
  medication: string;
  dosage?: string;
  instructions?: string;
  date: string;
  status: "active" | "completed" | "expired" | "cancelled";
  refills: number;
  // Hand-off to the admin team
  adminStatus?: PrescriptionAdminStatus;
  sentToAdminAt?: string;
  adminNote?: string;
}

// A prescription as seen in the admin queue (patient is populated)
export interface AdminPrescription extends Omit<Prescription, "patient"> {
  patient: { _id: string; firstName: string; lastName: string; email: string; phone?: string };
  handledBy?: { _id: string; firstName: string; lastName: string };
  handledAt?: string;
}

export interface VitalSign {
  _id: string;
  patient: string;
  familyMember?: string;
  recordedBy?: string;
  date: string;
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  weight?: string;
  height?: string;
  oxygenSaturation?: string;
}

export interface LabResult {
  _id: string;
  patient: string;
  familyMember?: string;
  orderedBy?: { _id: string; firstName: string; lastName: string; specialization?: string };
  date: string;
  test: string;
  results?: string;
  status: "pending" | "completed" | "reviewed";
  fileUrl?: string;
  fileName?: string;
}

// Plan ids are admin-defined (see AdminPlan below), not a fixed set -
// "free"/"basic"/"premium" are just the defaults a fresh install starts
// with; an admin can rename, retire or add to them at any time.
export type PlanId = string;

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  currency: string;
  period: string;
  familyMembers: number;
  features: string[];
  isFeatured?: boolean;
}

// The full admin-side view of a plan (includes fields patients never see:
// consultation limits, active/default flags). Admin dashboard only.
export interface AdminPlan {
  _id: string;
  planId: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  familyMemberLimit: number;
  videoConsultationsLimit: number; // -1 = unlimited
  chatConsultationsLimit: number; // -1 = unlimited
  features: string[];
  isFeatured: boolean;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionLimits {
  familyMemberLimit: number;
  videoConsultationsLimit: number;
  chatConsultationsLimit: number;
  price: number;
}

export interface Subscription {
  _id: string;
  patient: string;
  plan: PlanId;
  status: "active" | "cancelled" | "expired";
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
  videoConsultationsUsed: number;
  chatConsultationsUsed: number;
}

export interface EarningsSummary {
  current: number;
  previous: number;
  growth: number;
  consultations: number;
  avgPerConsultation: number;
  rating: number;
}

export interface EarningsBreakdownItem {
  type: "video" | "chat" | "followup";
  amount: number;
  sessions: number;
}

export interface Transaction {
  _id: string;
  doctor: string;
  patient?: { _id: string; firstName: string; lastName: string };
  appointment?: Appointment;
  type: "video" | "chat" | "followup";
  amount: number;
  status: "pending" | "paid";
  date: string;
}

export interface ChatMessageItem {
  _id: string;
  conversation: string;
  conversationModel: "Appointment" | "ConsultationRequest";
  sender: { _id: string; firstName: string; lastName: string; avatar?: string; role: UserRole };
  senderRole: "patient" | "doctor";
  text?: string;
  attachmentUrl?: string;
  status: "sent" | "delivered" | "read";
  createdAt: string;
}

export interface AppNotification {
  _id: string;
  user: string;
  title: string;
  message?: string;
  type: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Payment {
  _id: string;
  patient: string | { _id: string; firstName: string; lastName: string; email: string };
  plan: "basic" | "premium";
  amount: number;
  currency: string;
  reference: string;
  status: "pending" | "success" | "failed";
  paidAt?: string;
  gatewayResponse?: string;
  createdAt: string;
}

export interface DoctorReportItem {
  _id: string;
  doctor: { _id: string; firstName: string; lastName: string; specialization?: string; avatar?: string };
  patient: { _id: string; firstName: string; lastName: string; email: string };
  familyMember?: { _id: string; name: string; relationship: string };
  appointment: { _id: string; date: string; time: string; type: string; appointmentType: string; status: string };
  recommendation: string;
  urgency: "low" | "medium" | "high";
  status: "open" | "reviewed";
  reviewedBy?: { _id: string; firstName: string; lastName: string };
  reviewedAt?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  doctor: { _id: string; firstName: string; lastName: string; specialization?: string; avatar?: string };
  patient: { _id: string; firstName: string; lastName: string; avatar?: string };
  appointment?: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}

// A patient (or a patient's family member) this doctor has actually had a
// qualifying appointment with - see GET /api/doctors/me/patients.
export interface DoctorPatient {
  patient: { _id: string; firstName: string; lastName: string; avatar?: string; email: string; phone?: string };
  familyMember?: { _id: string; name: string; relationship: string; avatar?: string };
  lastAppointmentDate: string;
  lastAppointmentTime: string;
  lastAppointmentType: "video" | "chat";
  lastAppointmentStatus: AppointmentStatus;
  appointmentCount: number;
  completedCount: number;
}

export interface AdminOverview {
  totalPatients: number;
  totalDoctors: number;
  pendingDoctors: number;
  totalAppointments: number;
  appointmentsToday: number;
  totalConsultationRequests: number;
  openReports: number;
  pendingPrescriptions: number;
  planBreakdown: { plan: string; count: number }[];
  revenue: number;
  successfulPayments: number;
}
