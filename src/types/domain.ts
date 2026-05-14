// ─── Enums ───────────────────────────────────────────────────────────────────

export type Role =
  | "ADMIN"
  | "CONSULTANT"
  | "REGISTRAR"
  | "JUNIOR_DOCTOR"
  | "NURSE"
  | "WARD_SUPERVISOR";

export type ShiftType = "DAY" | "NIGHT";

export type ShiftStatus =
  | "PENDING_ASSIGNMENT"
  | "ACTIVE"
  | "COMPLETED"
  | "HANDED_OVER";

export type HandoverStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export type OnCallRole = "REGISTRAR_ON_CALL" | "CONSULTANT_ON_CALL";

export type InviteStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export type RoundType =
  | "MORNING"
  | "POST_TAKE"
  | "BOARD"
  | "EVENING"
  | "WEEKEND";

export type RoundStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type PatientStatus =
  | "ADMITTED"
  | "STABLE"
  | "DETERIORATING"
  | "DISCHARGE_READY"
  | "DISCHARGED";

export type AcuityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AdmissionType = "EMERGENCY" | "ELECTIVE" | "TRANSFER";

export type ClinicalStatus =
  | "STABLE"
  | "IMPROVING"
  | "DETERIORATING"
  | "CRITICAL";

export type DischargeAssessment =
  | "NONE"
  | "POSSIBLE"
  | "CONFIRMED"
  | "BLOCKED_SOCIAL"
  | "BLOCKED_MEDICAL";

export type NoteType =
  | "ROUND_NOTE"
  | "PROGRESS_NOTE"
  | "ADMISSION_NOTE"
  | "DISCHARGE_NOTE"
  | "ESCALATION_NOTE";

export type TaskPriority = "ROUTINE" | "URGENT" | "EMERGENCY";

export type TaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "OVERDUE"
  | "CANCELLED";

export type TaskSource = "NURSING_CARE_PLAN" | "POST_ROUND_JOB";

export type AssignedToRole = "NURSE" | "JUNIOR_DOCTOR" | "REGISTRAR";

export type EscalationSeverity = "AMBER" | "RED";

export type EscalationStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

export type EscalationTrigger =
  | "HIGH_NEWS_SCORE"
  | "TASK_OVERDUE"
  | "NURSE_CONCERN"
  | "DETERIORATION";

export type ContactMethod = "SMS" | "EMAIL" | "BOTH";

export type ConsciousnessLevel = "ALERT" | "VOICE" | "PAIN" | "UNRESPONSIVE";

export type OnboardingStatus =
  | "PENDING_REVIEW"
  | "CONTACTED"
  | "APPROVED"
  | "REJECTED"
  | "PROVISIONED";

// ─── Response interfaces (match API spec exactly) ────────────────────────────

export interface Hospital {
  id: string;
  name: string;
  address: string | null;
  contactEmail: string;
  contactPhone: string | null;
  createdAt: string;
}

export interface SystemConfig {
  id: string;
  hospitalId: string;
  newsAmberThreshold: number;
  newsRedThreshold: number;
  taskOverdueGraceMinutes: number;
  roundNotificationsEnabled: boolean;
  nokNotificationEnabled: boolean;
}

export interface Department {
  id: string;
  hospitalId: string;
  name: string;
  headOfDepartmentId: string | null;
  createdAt: string;
}

export interface Ward {
  id: string;
  hospitalId: string;
  name: string;
  specialty: string | null;
  totalBeds: number;
  supervisorId: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  hospitalId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  departmentId: string | null;
  createdAt: string;
  active: boolean;
}

export interface MedicalTeam {
  id: string;
  hospitalId: string;
  name: string;
  consultantId: string | null;
  departmentId: string;
  createdAt: string;
  wardIds?: string[];
}

export interface TeamInvite {
  id: string;
  hospitalId: string;
  medicalTeamId: string;
  invitedUserId: string;
  invitedById: string;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  wardId: string;
  medicalTeamId: string;
  admittingConsultantId: string | null;
  firstName: string;
  lastName: string;
  hospitalNumber: string;
  dateOfBirth: string;
  gender: string | null;
  bedNumber: string | null;
  admissionType: AdmissionType;
  primaryDiagnosis: string | null;
  specialtyRequired: string | null;
  acuityLevel: AcuityLevel;
  newsScore: number;
  isDischargeReady: boolean;
  estimatedDischargeDate: string | null;
  status: PatientStatus;
  admissionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vitals {
  id: string;
  patientId: string;
  recordedById: string;
  heartRate: number;
  respiratoryRate: number;
  systolicBP: number;
  oxygenSaturation: number;
  temperature: number;
  consciousnessLevel: ConsciousnessLevel;
  newsScore: number;
  recordedAt: string;
}

export interface NextOfKin {
  id: string;
  patientId: string;
  name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  preferredContactMethod: ContactMethod;
  isEmergencyContact: boolean;
  notificationConsent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CareTask {
  id: string;
  hospitalId: string;
  patientId: string;
  wardId: string;
  roundId: string | null;
  createdById: string;
  assignedToId: string | null;
  assignedToRole: AssignedToRole | null;
  taskType: string;
  source: TaskSource;
  title: string;
  description: string | null;
  priority: TaskPriority;
  windowStart: string;
  windowEnd: string;
  status: TaskStatus;
  completedById: string | null;
  completedAt: string | null;
  workloadConflict: boolean;
  workloadConflictReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Escalation {
  id: string;
  patientId: string;
  hospitalId: string;
  triggeredById: string | null;
  assignedToId: string | null;
  triggerType: EscalationTrigger;
  severity: EscalationSeverity;
  status: EscalationStatus;
  notes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  patientRoundReviewId: string | null;
  authorId: string;
  noteType: NoteType;
  content: string;
  isAmended: boolean;
  amendedById: string | null;
  amendedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  wardId: string;
  shiftScheduleId: string | null;
  type: ShiftType;
  startTime: string;
  endTime: string;
  leadDoctorId: string | null;
  nurseInChargeId: string | null;
  status: ShiftStatus;
  assignedAt: string | null;
  createdAt: string;
}

export interface ShiftSchedule {
  id: string;
  hospitalId: string;
  wardId: string | null;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  daysOfWeek: string;
  active: boolean;
  createdAt: string;
}

export interface OnCallRotation {
  id: string;
  hospitalId: string;
  departmentId: string;
  wardId: string | null;
  doctorId: string;
  role: OnCallRole;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface Round {
  id: string;
  hospitalId: string;
  wardId: string;
  medicalTeamId: string;
  shiftId: string | null;
  roundType: RoundType;
  leadDoctorId: string;
  status: RoundStatus;
  scheduledTime: string | null;
  startedAt: string | null;
  completedAt: string | null;
  teamMembers: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientRoundReview {
  id: string;
  roundId: string;
  patientId: string;
  reviewedById: string;
  reviewOrder: number;
  newsScoreAtReview: number | null;
  clinicalStatus: ClinicalStatus;
  wasExamined: boolean;
  managementPlan: string | null;
  dischargeAssessment: DischargeAssessment;
  notifiedNextOfKin: boolean;
  reviewedAt: string;
  createdAt: string;
}

export interface Handover {
  id: string;
  wardId: string;
  outgoingShiftId: string;
  incomingShiftId: string;
  conductedById: string;
  status: HandoverStatus;
  generalNotes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientHandoverNote {
  id: string;
  handoverId: string;
  patientId: string;
  statusSummary: string | null;
  outstandingTaskIds: string | null;
  urgencyFlag: boolean;
  addedById: string;
  createdAt: string;
}

export interface HospitalOnboarding {
  id: string;
  hospitalName: string;
  countryOrRegion: string | null;
  contactEmail: string;
  contactPhone: string | null;
  hospitalType: string | null;
  estimatedInpatientBeds: string | null;
  primaryNeed: string | null;
  status: OnboardingStatus;
  reviewNotes: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  provisionedHospitalId: string | null;
  createdAt: string;
}

export interface JwtResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  hospitalId: string;
  role: string;
}

export interface PlatformLoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  operatorId: string;
  role: string;
}

export interface ProvisionHospitalTenantResponse {
  requestId: string;
  hospitalId: string;
  adminUserId: string;
  status: OnboardingStatus;
}

// ─── Convenience type aliases used by the old codebase (backward compat) ─────
// These are kept so pages that reference "Team" still compile.

export type Team = MedicalTeam;
