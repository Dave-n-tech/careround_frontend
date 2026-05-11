export type Role =
  | "ADMIN"
  | "CONSULTANT"
  | "REGISTRAR"
  | "JUNIOR_DOCTOR"
  | "NURSE"
  | "WARD_SUPERVISOR";

export type ShiftStatus =
  | "PENDING_ASSIGNMENT"
  | "ACTIVE"
  | "COMPLETED"
  | "HANDED_OVER";

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
  | "CRITICAL"
  | "UNCHANGED";

export type DischargeAssessment =
  | "NONE"
  | "POSSIBLE"
  | "CONFIRMED"
  | "BLOCKED_SOCIAL"
  | "BLOCKED_MEDICAL";

export type TaskPriority = "ROUTINE" | "URGENT" | "EMERGENCY";

export type TaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "OVERDUE"
  | "CANCELLED";

export type TaskSource = "NURSING_CARE_PLAN" | "POST_ROUND_JOB";

export type EscalationSeverity = "AMBER" | "RED";

export type EscalationStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

export type EscalationTrigger =
  | "HIGH_NEWS_SCORE"
  | "TASK_OVERDUE"
  | "NURSE_CONCERN"
  | "DETERIORATION";

export type ContactMethod = "SMS" | "EMAIL" | "BOTH";

export interface HospitalConfig {
  newsAmber: number;
  newsRed: number;
  overdueGraceMins: number;
  notifyNoK: boolean;
  notifyOnRoundComplete: boolean;
  enforceConsent: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  shortName: string;
  address: string;
  config: HospitalConfig;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  specialty: string;
  wardCount: number;
  headOfDept: string;
}

export interface Ward {
  id: string;
  name: string;
  deptId: string;
  beds: number;
  occupied: number;
  supervisorId: string;
  specialty: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
  email: string;
  deptId: string | null;
  active: boolean;
  title?: string;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: Role;
  sentAt: string;
  expiresAt: string;
}

export interface Team {
  id: string;
  name: string;
  consultantId: string;
  members: string[];
  wards: string[];
  deptId: string;
  pendingInvites: TeamInvite[];
}

export interface VitalsReading {
  resp: number;
  spo2: number;
  temp: number;
  sys: number;
  hr: number;
  cons: "ALERT" | "VOICE" | "PAIN" | "UNRESPONSIVE";
  ts: string;
  news: number;
}

export interface NextOfKin {
  name: string;
  relation: string;
  phone: string;
  method: ContactMethod;
  consent: boolean;
  email?: string;
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  sex: "M" | "F";
  age: number;
  wardId: string;
  bed: string;
  teamId: string;
  admissionDate: string;
  admissionType: AdmissionType;
  primaryDiagnosis: string;
  secondary?: string[];
  acuity: AcuityLevel;
  status: PatientStatus;
  dischargeReady: boolean;
  nok: NextOfKin[];
  vitals: VitalsReading[];
  news: number;
}

export interface CareTask {
  id: string;
  patientId: string;
  title: string;
  priority: TaskPriority;
  source: TaskSource;
  status: TaskStatus;
  assigneeRole: Role;
  assigneeId: string;
  windowStart: string;
  windowEnd: string;
  windowDate: string;
}

export interface Escalation {
  id: string;
  patientId: string;
  triggerType: EscalationTrigger;
  severity: EscalationSeverity;
  status: EscalationStatus;
  createdAt: string;
  assigneeId: string;
  notes: string;
}

export interface Shift {
  id: string;
  wardId: string;
  date: string;
  name: string;
  status: ShiftStatus;
  leadDoctorId: string | null;
  nurseInChargeId: string | null;
  startsAt: string;
  endsAt: string;
}

export interface ShiftSchedule {
  id: string;
  name: string;
  wardId: string;
  pattern: string;
  start: string;
  end: string;
  leadRole: Role;
  active: boolean;
}

export interface OnCallRotation {
  id: string;
  deptId: string;
  userId: string;
  role: Role;
  start: string;
  end: string;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  authorId: string;
  type: string;
  createdAt: string;
  body: string;
}

export interface Round {
  id: string;
  wardId: string;
  teamId: string;
  type: RoundType;
  status: RoundStatus;
  leadId: string;
  participants: string[];
  startedAt: string;
  completedAt: string | null;
  queue: string[];
  reviewed: string[];
}
