// Shared types mirroring the backend's Mongoose models / API responses.
// Keep these in sync with the backend's src/models and src/controllers.

export type UserRole = "patient" | "doctor" | "admin";
export type DoctorStatus = "online" | "offline" | "busy" | "available";

export interface ConsultationFee {
  video: number;
  chat: number;
}

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
  consultationFee?: ConsultationFee;
  status?: DoctorStatus;
  rating?: number;
  ratingCount?: number;

  // patient-only
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
  status: AppointmentStatus;
  consultationFee: number;
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

export type PlanId = "free" | "basic" | "premium";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  period: string;
  familyMembers: number;
  features: string[];
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
