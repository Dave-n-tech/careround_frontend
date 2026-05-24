// ─── Roles ───────────────────────────────────────────────────────────────────

export type Role = "ADMIN" | "DOCTOR" | "NURSE" | "SUPERVISOR";

// ─── Clinical enums ───────────────────────────────────────────────────────────

export type AcuityColor = "GREEN" | "AMBER" | "RED";
export type VhiStatus = "STABLE" | "WATCH" | "CRITICAL";

export type AdmissionType = "EMERGENCY" | "ELECTIVE" | "TRANSFER";
export type PatientStatus = "ADMITTED" | "DISCHARGED";
export type PatientGender = "MALE" | "FEMALE" | "OTHER";

export type NoteType =
  | "WARD_ROUND_NOTE"
  | "PROGRESS_NOTE"
  | "ADMISSION_NOTE"
  | "DISCHARGE_NOTE"
  | "HANDOVER_NOTE"
  | "NURSING_REPORT";

export type PrescriptionStatus = "ACTIVE" | "DISCONTINUED" | "COMPLETED";
export type TaskStatus = "PENDING" | "COMPLETED" | "OVERDUE";
export type ChartStatus = "ACTIVE" | "COMPLETED" | "DISCONTINUED";

// ─── Core entities ────────────────────────────────────────────────────────────

export interface Hospital {
  id: string;
  name: string;
  code: string;
  address?: string;
  contactEmail: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfig {
  id: string;
  hospitalId: string;
  taskOverdueReminderMinutes: number;
  taskEscalationMinutes: number;
  pushNotificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ward {
  id: string;
  hospitalId: string;
  name: string;
  specialty?: string;
  totalBeds: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  hospitalId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  wardId?: string;
  active: boolean;
  fcmToken?: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  hospitalId: string;
  wardId: string;
  bedNumber?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: PatientGender;
  hospitalNumber: string;
  phoneNumber?: string;
  address?: string;
  previousConditions?: string;
  currentMedications?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  admissionDate: string;
  admissionType: AdmissionType;
  primaryDiagnosis?: string;
  acuityColor: AcuityColor;
  status: PatientStatus;
  estimatedDischargeDate?: string;
  registeredById: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientVitals {
  id: string;
  patientId: string;
  hospitalId: string;
  recordedById: string;
  pulse?: number;
  systolicBp?: number;
  diastolicBp?: number;
  respiratoryRate?: number;
  temperature?: number;
  spo2?: number;
  vhiScore: number;
  vhiStatus: VhiStatus;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  hospitalId: string;
  authorId: string;
  noteType: NoteType;
  content: string;
  rawTranscription?: string;
  isAiGenerated: boolean;
  confirmedByDoctorAt?: string;
  aiModelUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SoapContent {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface AdministrationSlot {
  taskId?: string;
  scheduledTime: string;
  taskStatus?: TaskStatus;
  completedAt?: string;
  completedByName?: string;
  actualDoseGiven?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  hospitalId: string;
  clinicalNoteId?: string;
  drugName: string;
  dose: string;
  route: string;
  frequencyString: string;
  frequencyHours: number;
  totalDoses: number;
  startTime: string;
  administrationTimes: AdministrationSlot[];
  confirmedById: string;
  confirmedAt: string;
  status: PrescriptionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationChart {
  id: string;
  patientId: string;
  hospitalId: string;
  prescriptionId: string;
  status: ChartStatus;
  nurseNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationTask {
  id: string;
  medicationChartId: string;
  patientId: string;
  hospitalId: string;
  wardId: string;
  assignedNurseId?: string;
  scheduledTime: string;
  status: TaskStatus;
  completedAt?: string;
  completedById?: string;
  completedByName?: string;
  actualDoseGiven?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HandoverNote {
  id: string;
  patientId: string;
  hospitalId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ─── AI types ─────────────────────────────────────────────────────────────────

export interface AiPrescription {
  drugName: string;
  dose: string;
  route: string;
  frequencyString: string;
  frequencyHours: number;
  totalDoses: number;
  startTime: string;
  administrationTimes: string[];
}

export interface AiProcessingResult {
  rawTranscription: string;
  clinicalNote: SoapContent;
  prescriptions: AiPrescription[];
}

// ─── Auth / API shapes ────────────────────────────────────────────────────────

export interface JwtResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  hospitalId: string;
  role: Role;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─── Supervisor dashboard ─────────────────────────────────────────────────────

export interface SupervisorDashboardResponse {
  wardId: string;
  wardName: string;
  specialty?: string;
  totalBeds: number;
  occupiedBeds: number;
  patients: SupervisorPatientSummary[];
  taskStats: SupervisorTaskStats;
  overdueAlerts: SupervisorOverdueAlert[];
  hourlyChart: HourlyTaskCount[];
}

export interface SupervisorPatientSummary {
  patientId: string;
  firstName: string;
  lastName: string;
  acuityColor: AcuityColor;
  admissionDate: string;
  wardId: string;
}

export interface SupervisorTaskStats {
  pendingCount: number;
  overdueCount: number;
  completedTodayCount: number;
}

export interface SupervisorOverdueAlert {
  taskId: string;
  patientId: string;
  patientName: string;
  assignedNurseId?: string;
  scheduledTime: string;
  minutesOverdue: number;
}

export interface HourlyTaskCount {
  hour: string;
  taskCount: number;
}
