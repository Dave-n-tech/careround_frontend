import type { Ward, User, Patient, SystemConfig } from "@/types/domain";
import type { PatientVitalsEnriched } from "@/services/api/vitals";
import type { ClinicalNoteEnriched } from "@/services/api/clinicalNotes";
import type { PrescriptionEnriched, MedicationTaskEnriched } from "@/services/api/prescriptions";

// â”€â”€â”€ Wards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const MOCK_WARDS: Ward[] = [
  {
    id: "w1",
    hospitalId: "h1",
    name: "Soyinka Ward",
    specialty: "General Medicine",
    totalBeds: 20,
    isActive: true,
    createdAt: "2025-01-10T08:00:00Z",
    updatedAt: "2025-01-10T08:00:00Z",
  },
  {
    id: "w2",
    hospitalId: "h1",
    name: "Okonkwo Ward",
    specialty: "Cardiology",
    totalBeds: 15,
    isActive: true,
    createdAt: "2025-01-10T08:00:00Z",
    updatedAt: "2025-01-10T08:00:00Z",
  },
  {
    id: "w3",
    hospitalId: "h1",
    name: "Adeyemi Ward",
    specialty: "Surgery",
    totalBeds: 12,
    isActive: false,
    createdAt: "2025-01-10T08:00:00Z",
    updatedAt: "2025-03-01T08:00:00Z",
  },
];

// â”€â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const MOCK_USERS: User[] = [
  {
    id: "u1",
    hospitalId: "h1",
    firstName: "James",
    lastName: "Adeyemi",
    email: "jadeyemi@stmarys.ng",
    role: "DOCTOR",
    active: true,
    createdAt: "2025-01-15T09:00:00Z",
    updatedAt: "2025-01-15T09:00:00Z",
  },
  {
    id: "u2",
    hospitalId: "h1",
    firstName: "Amina",
    lastName: "Hassan",
    email: "ahassan@stmarys.ng",
    role: "DOCTOR",
    active: true,
    createdAt: "2025-01-20T09:00:00Z",
    updatedAt: "2025-01-20T09:00:00Z",
  },
  {
    id: "u3",
    hospitalId: "h1",
    firstName: "Sarah",
    lastName: "Okafor",
    email: "sokafor@stmarys.ng",
    role: "NURSE",
    active: true,
    createdAt: "2025-02-01T09:00:00Z",
    updatedAt: "2025-02-01T09:00:00Z",
  },
  {
    id: "u4",
    hospitalId: "h1",
    firstName: "Chidi",
    lastName: "Eze",
    email: "ceze@stmarys.ng",
    role: "NURSE",
    active: true,
    createdAt: "2025-02-01T09:00:00Z",
    updatedAt: "2025-02-01T09:00:00Z",
  },
  {
    id: "u5",
    hospitalId: "h1",
    firstName: "Ngozi",
    lastName: "Bello",
    email: "nbello@stmarys.ng",
    role: "NURSE",
    active: false,
    createdAt: "2025-02-10T09:00:00Z",
    updatedAt: "2025-04-15T09:00:00Z",
  },
  {
    id: "u6",
    hospitalId: "h1",
    firstName: "Tunde",
    lastName: "Fashola",
    email: "tfashola@stmarys.ng",
    role: "SUPERVISOR",
    active: true,
    createdAt: "2025-01-10T09:00:00Z",
    updatedAt: "2025-01-10T09:00:00Z",
  },
];

// â”€â”€â”€ Patients â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const MOCK_PATIENTS: Patient[] = [
  {
    id: "p1",
    hospitalId: "h1",
    wardId: "w1",
    bedNumber: "4",
    firstName: "Emmanuel",
    lastName: "Okafor",
    dateOfBirth: "1970-03-15",
    gender: "MALE",
    hospitalNumber: "STM-0001",
    previousConditions: "Hypertension, Type 2 Diabetes",
    allergies: "Penicillin",
    admissionDate: "2026-05-17T08:00:00Z",
    admissionType: "EMERGENCY",
    primaryDiagnosis: "Acute decompensated heart failure",
    acuityColor: "RED",
    status: "ADMITTED",
    registeredById: "admin1",
    createdAt: "2026-05-17T08:00:00Z",
    updatedAt: "2026-05-19T10:00:00Z",
  },
  {
    id: "p2",
    hospitalId: "h1",
    wardId: "w1",
    bedNumber: "7",
    firstName: "Fatima",
    lastName: "Abubakar",
    dateOfBirth: "1985-11-22",
    gender: "FEMALE",
    hospitalNumber: "STM-0002",
    previousConditions: "Asthma",
    admissionDate: "2026-05-18T14:00:00Z",
    admissionType: "ELECTIVE",
    primaryDiagnosis: "Community-acquired pneumonia",
    acuityColor: "AMBER",
    status: "ADMITTED",
    registeredById: "admin1",
    createdAt: "2026-05-18T14:00:00Z",
    updatedAt: "2026-05-19T09:00:00Z",
  },
  {
    id: "p3",
    hospitalId: "h1",
    wardId: "w2",
    bedNumber: "2",
    firstName: "Babatunde",
    lastName: "Lawson",
    dateOfBirth: "1962-07-04",
    gender: "MALE",
    hospitalNumber: "STM-0003",
    admissionDate: "2026-05-19T10:00:00Z",
    admissionType: "TRANSFER",
    primaryDiagnosis: "Post-operative monitoring â€” CABG",
    acuityColor: "AMBER",
    status: "ADMITTED",
    registeredById: "admin1",
    createdAt: "2026-05-19T10:00:00Z",
    updatedAt: "2026-05-19T10:00:00Z",
  },
  {
    id: "p4",
    hospitalId: "h1",
    wardId: "w1",
    bedNumber: "11",
    firstName: "Adaeze",
    lastName: "Nwosu",
    dateOfBirth: "1995-02-28",
    gender: "FEMALE",
    hospitalNumber: "STM-0004",
    allergies: "Aspirin",
    admissionDate: "2026-05-16T08:00:00Z",
    admissionType: "EMERGENCY",
    primaryDiagnosis: "Acute appendicitis â€” post-op day 2",
    acuityColor: "GREEN",
    status: "ADMITTED",
    registeredById: "admin1",
    createdAt: "2026-05-16T08:00:00Z",
    updatedAt: "2026-05-19T08:00:00Z",
  },
  {
    id: "p5",
    hospitalId: "h1",
    wardId: "w3",
    bedNumber: "1",
    firstName: "Musa",
    lastName: "Ibrahim",
    dateOfBirth: "1988-09-10",
    gender: "MALE",
    hospitalNumber: "STM-0005",
    admissionDate: "2026-05-10T12:00:00Z",
    admissionType: "ELECTIVE",
    primaryDiagnosis: "Inguinal hernia repair",
    acuityColor: "GREEN",
    status: "DISCHARGED",
    registeredById: "admin1",
    createdAt: "2026-05-10T12:00:00Z",
    updatedAt: "2026-05-15T14:00:00Z",
  },
];

// â”€â”€â”€ System config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const MOCK_SYSTEM_CONFIG: SystemConfig = {
  id: "cfg1",
  hospitalId: "h1",
  taskOverdueReminderMinutes: 10,
  taskEscalationMinutes: 20,
  pushNotificationsEnabled: true,
  createdAt: "2025-01-10T08:00:00Z",
  updatedAt: "2025-01-10T08:00:00Z",
};

// â”€â”€â”€ Activity log (no dedicated API endpoint â€” derived from user actions) â”€â”€â”€â”€â”€

export interface ActivityEntry {
  id: string;
  name: string;
  role: string;
  action: "Created" | "Deactivated" | "Reactivated" | "Updated";
  date: string;
}

export const MOCK_ACTIVITY: ActivityEntry[] = [
  { id: "a1", name: "Sarah Okafor", role: "Nurse", action: "Created", date: "2026-05-19T11:30:00Z" },
  { id: "a2", name: "James Adeyemi", role: "Doctor", action: "Created", date: "2026-05-18T09:00:00Z" },
  { id: "a3", name: "Ngozi Bello", role: "Nurse", action: "Deactivated", date: "2026-05-15T14:22:00Z" },
  { id: "a4", name: "Amina Hassan", role: "Doctor", action: "Created", date: "2026-05-12T10:10:00Z" },
  { id: "a5", name: "Tunde Fashola", role: "Supervisor", action: "Created", date: "2026-05-10T08:45:00Z" },
  { id: "a6", name: "Chidi Eze", role: "Nurse", action: "Created", date: "2026-05-01T09:00:00Z" },
];

// â”€â”€â”€ Vitals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const MOCK_VITALS: Record<string, PatientVitalsEnriched[]> = {
  p1: [
    {
      id: "v1a", patientId: "p1", hospitalId: "h1", recordedById: "u3",
      pulse: 105, systolicBp: 98, diastolicBp: 62, respiratoryRate: 24, temperature: 37.4, spo2: 94,
      vhiScore: 6, vhiStatus: "CRITICAL",
      recordedAt: "2026-05-20T06:00:00Z", createdAt: "2026-05-20T06:00:00Z", updatedAt: "2026-05-20T06:00:00Z",
      recordedByName: "Sarah O.",
    },
    {
      id: "v1b", patientId: "p1", hospitalId: "h1", recordedById: "u4",
      pulse: 112, systolicBp: 88, diastolicBp: 58, respiratoryRate: 26, temperature: 37.8, spo2: 92,
      vhiScore: 9, vhiStatus: "CRITICAL",
      recordedAt: "2026-05-19T18:00:00Z", createdAt: "2026-05-19T18:00:00Z", updatedAt: "2026-05-19T18:00:00Z",
      recordedByName: "Chidi E.",
    },
    {
      id: "v1c", patientId: "p1", hospitalId: "h1", recordedById: "u3",
      pulse: 98, systolicBp: 104, diastolicBp: 66, respiratoryRate: 22, temperature: 37.6, spo2: 95,
      vhiScore: 5, vhiStatus: "CRITICAL",
      recordedAt: "2026-05-19T06:00:00Z", createdAt: "2026-05-19T06:00:00Z", updatedAt: "2026-05-19T06:00:00Z",
      recordedByName: "Sarah O.",
    },
  ],
  p2: [
    {
      id: "v2a", patientId: "p2", hospitalId: "h1", recordedById: "u3",
      pulse: 88, systolicBp: 118, diastolicBp: 74, respiratoryRate: 22, temperature: 38.5, spo2: 94,
      vhiScore: 4, vhiStatus: "WATCH",
      recordedAt: "2026-05-20T07:00:00Z", createdAt: "2026-05-20T07:00:00Z", updatedAt: "2026-05-20T07:00:00Z",
      recordedByName: "Sarah O.",
    },
    {
      id: "v2b", patientId: "p2", hospitalId: "h1", recordedById: "u4",
      pulse: 94, systolicBp: 112, diastolicBp: 70, respiratoryRate: 24, temperature: 38.9, spo2: 93,
      vhiScore: 5, vhiStatus: "CRITICAL",
      recordedAt: "2026-05-19T19:00:00Z", createdAt: "2026-05-19T19:00:00Z", updatedAt: "2026-05-19T19:00:00Z",
      recordedByName: "Chidi E.",
    },
  ],
  p3: [
    {
      id: "v3a", patientId: "p3", hospitalId: "h1", recordedById: "u3",
      pulse: 72, systolicBp: 124, diastolicBp: 78, respiratoryRate: 16, temperature: 36.8, spo2: 97,
      vhiScore: 1, vhiStatus: "STABLE",
      recordedAt: "2026-05-20T07:30:00Z", createdAt: "2026-05-20T07:30:00Z", updatedAt: "2026-05-20T07:30:00Z",
      recordedByName: "Sarah O.",
    },
  ],
  p4: [
    {
      id: "v4a", patientId: "p4", hospitalId: "h1", recordedById: "u4",
      pulse: 76, systolicBp: 118, diastolicBp: 76, respiratoryRate: 15, temperature: 37.1, spo2: 98,
      vhiScore: 0, vhiStatus: "STABLE",
      recordedAt: "2026-05-20T08:00:00Z", createdAt: "2026-05-20T08:00:00Z", updatedAt: "2026-05-20T08:00:00Z",
      recordedByName: "Chidi E.",
    },
    {
      id: "v4b", patientId: "p4", hospitalId: "h1", recordedById: "u3",
      pulse: 80, systolicBp: 120, diastolicBp: 78, respiratoryRate: 16, temperature: 37.3, spo2: 97,
      vhiScore: 0, vhiStatus: "STABLE",
      recordedAt: "2026-05-19T20:00:00Z", createdAt: "2026-05-19T20:00:00Z", updatedAt: "2026-05-19T20:00:00Z",
      recordedByName: "Sarah O.",
    },
  ],
};

// â”€â”€â”€ Clinical notes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const MOCK_NOTES: Record<string, ClinicalNoteEnriched[]> = {
  p1: [
    {
      id: "n1a", patientId: "p1", hospitalId: "h1", authorId: "u1",
      noteType: "ADMISSION_NOTE", isAiGenerated: false,
      content: JSON.stringify({
        subjective: "72-year-old male presenting with 3-day history of progressive shortness of breath, orthopnoea, and bilateral ankle swelling. Known hypertensive and diabetic, poor compliance with medications.",
        objective: "BP 98/62, HR 105, RR 24, Temp 37.4Â°C, SpOâ‚‚ 94% on room air. JVP elevated at 4cm. Bibasal crackles. Pitting oedema to knees bilaterally. BNP elevated.",
        assessment: "Acute decompensated heart failure secondary to medication non-compliance and possible hypertensive crisis.",
        plan: "IV furosemide 40mg stat. Fluid restriction 1.5L/24h. Strict input/output monitoring. Cardiology review requested. Echo arranged for tomorrow. Restart ACE inhibitor once haemodynamically stable.",
      }),
      authorName: "Dr. James Adeyemi",
      authorRole: "Doctor",
      createdAt: "2026-05-17T09:30:00Z", updatedAt: "2026-05-17T09:30:00Z",
    },
    {
      id: "n1b", patientId: "p1", hospitalId: "h1", authorId: "u1",
      noteType: "WARD_ROUND_NOTE", isAiGenerated: true,
      content: JSON.stringify({
        subjective: "Patient reports some improvement in breathlessness overnight. Still unable to lie flat. Ankle swelling unchanged. Good urine output since furosemide.",
        objective: "BP 104/66, HR 98, RR 22, Temp 37.6Â°C, SpOâ‚‚ 95%. JVP still elevated. Bibasal crackles slightly reduced. Echo shows EF 30%, moderate MR.",
        assessment: "Mild improvement in acute decompensation. Underlying severe LV dysfunction now confirmed on echo.",
        plan: "Continue IV diuresis. Add spironolactone 25mg OD. Start low-dose bisoprolol once euvolaemic. Cardiology reviewed â€” patient listed for repeat echo in 6 weeks post-discharge. Physiotherapy referral.",
      }),
      authorName: "Dr. James Adeyemi",
      authorRole: "Doctor",
      createdAt: "2026-05-19T10:15:00Z", updatedAt: "2026-05-19T10:15:00Z",
    },
  ],
  p2: [
    {
      id: "n2a", patientId: "p2", hospitalId: "h1", authorId: "u2",
      noteType: "ADMISSION_NOTE", isAiGenerated: false,
      content: JSON.stringify({
        subjective: "38-year-old female with 5-day history of productive cough, fever, and right-sided pleuritic chest pain. Known asthmatic. No recent travel. No sick contacts.",
        objective: "Temp 38.9Â°C, HR 94, BP 112/70, RR 24, SpOâ‚‚ 93%. Dull percussion and bronchial breathing at right base. CXR shows right lower lobe consolidation. WBC 14.2, CRP 186.",
        assessment: "Moderate-severity community-acquired pneumonia. CURB-65 score 2 â€” inpatient treatment indicated.",
        plan: "IV co-amoxiclav 1.2g TDS. PO azithromycin 500mg OD. Oxygen therapy to maintain SpOâ‚‚ â‰¥94%. Aggressive hydration. Monitor urine output. Review in 48h â€” step down to oral if improving.",
      }),
      authorName: "Dr. Amina Hassan",
      authorRole: "Doctor",
      createdAt: "2026-05-18T15:30:00Z", updatedAt: "2026-05-18T15:30:00Z",
    },
    {
      id: "n2b", patientId: "p2", hospitalId: "h1", authorId: "u3",
      noteType: "NURSING_REPORT", isAiGenerated: false,
      content: "Patient had a settled night. Spiked temp to 38.9 at 02:00 â€” paracetamol given, temp down to 38.1 by 04:00. Oxygen requirement increased briefly to 4L/min. Adequate fluid intake. Patient anxious about diagnosis, reassurance provided.",
      authorName: "Sarah Okafor",
      authorRole: "Nurse",
      createdAt: "2026-05-19T06:30:00Z", updatedAt: "2026-05-19T06:30:00Z",
    },
  ],
  p3: [
    {
      id: "n3a", patientId: "p3", hospitalId: "h1", authorId: "u1",
      noteType: "WARD_ROUND_NOTE", isAiGenerated: true,
      content: JSON.stringify({
        subjective: "Patient comfortable, no chest pain. Good appetite. Mobilising to bathroom with minimal assistance. Sternal wound clean.",
        objective: "HR 72, BP 124/78, RR 16, Temp 36.8Â°C, SpOâ‚‚ 97%. Sternotomy wound clean and dry. Heart sounds normal. Clear chest. Abdomen soft.",
        assessment: "Recovering well post-CABG day 1. Haemodynamically stable.",
        plan: "Continue aspirin 75mg and clopidogrel 75mg. Commence cardiac rehabilitation protocol. Physiotherapy twice daily for breathing exercises. Target discharge day 4-5 if continues to progress.",
      }),
      authorName: "Dr. James Adeyemi",
      authorRole: "Doctor",
      createdAt: "2026-05-20T09:00:00Z", updatedAt: "2026-05-20T09:00:00Z",
    },
  ],
  p4: [
    {
      id: "n4a", patientId: "p4", hospitalId: "h1", authorId: "u2",
      noteType: "WARD_ROUND_NOTE", isAiGenerated: false,
      content: JSON.stringify({
        subjective: "Patient in good spirits. Pain well controlled with regular analgesia. Tolerating oral fluids and light diet. No nausea.",
        objective: "Afebrile. HR 76, BP 118/76. Abdomen soft, wound site clean, drains removed this morning. Bowel sounds present.",
        assessment: "Post-op day 2 appendicectomy â€” progressing well. No signs of infection.",
        plan: "Step down to oral paracetamol and ibuprofen PRN. Increase diet as tolerated. Encourage mobilisation. Anticipate discharge tomorrow if continues to improve.",
      }),
      authorName: "Dr. Amina Hassan",
      authorRole: "Doctor",
      createdAt: "2026-05-19T11:00:00Z", updatedAt: "2026-05-19T11:00:00Z",
    },
  ],
};

// â”€â”€â”€ Prescriptions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function done(scheduledTime: string) {
  return scheduledTime;
}
function pending(scheduledTime: string) {
  return scheduledTime;
}

export const MOCK_PRESCRIPTIONS: Record<string, PrescriptionEnriched[]> = {
  p1: [
    {
      id: "rx1a", patientId: "p1", hospitalId: "h1", clinicalNoteId: "n1a",
      drugName: "Furosemide", dose: "40mg", route: "IV", frequencyString: "Every 12 hours",
      frequencyHours: 12, totalDoses: 6,
      startTime: "2026-05-17T10:00:00Z",
      administrationTimes: [
        done("2026-05-17T10:00:00Z"),
        done("2026-05-17T22:00:00Z"),
        done("2026-05-18T10:00:00Z"),
        done("2026-05-18T22:00:00Z"),
        pending("2026-05-19T10:00:00Z"),
        pending("2026-05-19T22:00:00Z"),
      ],
      confirmedById: "u1", confirmedAt: "2026-05-17T09:45:00Z",
      status: "ACTIVE",
      createdAt: "2026-05-17T09:45:00Z", updatedAt: "2026-05-17T09:45:00Z",
      confirmedByName: "Dr. James Adeyemi",
    },
    {
      id: "rx1b", patientId: "p1", hospitalId: "h1", clinicalNoteId: "n1b",
      drugName: "Spironolactone", dose: "25mg", route: "Oral", frequencyString: "Once daily",
      frequencyHours: 24, totalDoses: 7,
      startTime: "2026-05-17T08:00:00Z",
      administrationTimes: [
        done("2026-05-17T08:00:00Z"),
        done("2026-05-18T08:00:00Z"),
        done("2026-05-19T08:00:00Z"),
        pending("2026-05-20T08:00:00Z"),
        pending("2026-05-21T08:00:00Z"),
        pending("2026-05-22T08:00:00Z"),
        pending("2026-05-23T08:00:00Z"),
      ],
      confirmedById: "u1", confirmedAt: "2026-05-17T10:30:00Z",
      status: "ACTIVE",
      createdAt: "2026-05-17T10:30:00Z", updatedAt: "2026-05-17T10:30:00Z",
      confirmedByName: "Dr. James Adeyemi",
    },
    {
      id: "rx1c", patientId: "p1", hospitalId: "h1",
      drugName: "Penicillin V", dose: "500mg", route: "Oral", frequencyString: "Every 6 hours",
      frequencyHours: 6, totalDoses: 4,
      startTime: "2026-05-17T10:00:00Z",
      administrationTimes: [
        done("2026-05-17T10:00:00Z"),
        done("2026-05-17T16:00:00Z"),
        done("2026-05-17T22:00:00Z"),
        pending("2026-05-18T04:00:00Z"),
      ],
      confirmedById: "u1", confirmedAt: "2026-05-17T09:45:00Z",
      status: "DISCONTINUED",
      createdAt: "2026-05-17T09:45:00Z", updatedAt: "2026-05-18T11:00:00Z",
      confirmedByName: "Dr. James Adeyemi",
    },
  ],
  p2: [
    {
      id: "rx2a", patientId: "p2", hospitalId: "h1", clinicalNoteId: "n2a",
      drugName: "Co-amoxiclav", dose: "1.2g", route: "IV", frequencyString: "Every 8 hours",
      frequencyHours: 8, totalDoses: 9,
      startTime: "2026-05-18T16:00:00Z",
      administrationTimes: [
        done("2026-05-18T16:00:00Z"),
        done("2026-05-19T00:00:00Z"),
        done("2026-05-19T08:00:00Z"),
        done("2026-05-19T16:00:00Z"),
        done("2026-05-20T00:00:00Z"),
        done("2026-05-20T08:00:00Z"),
        pending("2026-05-20T16:00:00Z"),
        pending("2026-05-21T00:00:00Z"),
        pending("2026-05-21T08:00:00Z"),
      ],
      confirmedById: "u2", confirmedAt: "2026-05-18T15:45:00Z",
      status: "ACTIVE",
      createdAt: "2026-05-18T15:45:00Z", updatedAt: "2026-05-18T15:45:00Z",
      confirmedByName: "Dr. Amina Hassan",
    },
    {
      id: "rx2b", patientId: "p2", hospitalId: "h1", clinicalNoteId: "n2a",
      drugName: "Azithromycin", dose: "500mg", route: "Oral", frequencyString: "Once daily",
      frequencyHours: 24, totalDoses: 5,
      startTime: "2026-05-18T18:00:00Z",
      administrationTimes: [
        done("2026-05-18T18:00:00Z"),
        done("2026-05-19T18:00:00Z"),
        pending("2026-05-20T18:00:00Z"),
        pending("2026-05-21T18:00:00Z"),
        pending("2026-05-22T18:00:00Z"),
      ],
      confirmedById: "u2", confirmedAt: "2026-05-18T15:45:00Z",
      status: "ACTIVE",
      createdAt: "2026-05-18T15:45:00Z", updatedAt: "2026-05-18T15:45:00Z",
      confirmedByName: "Dr. Amina Hassan",
    },
  ],
  p3: [
    {
      id: "rx3a", patientId: "p3", hospitalId: "h1",
      drugName: "Aspirin", dose: "75mg", route: "Oral", frequencyString: "Once daily",
      frequencyHours: 24, totalDoses: 30,
      startTime: "2026-05-10T08:00:00Z",
      administrationTimes: Array.from({ length: 30 }, (_, i) => {
        const d = new Date("2026-05-10T08:00:00Z");
        d.setDate(d.getDate() + i);
        const iso = d.toISOString();
        return i < 10 ? done(iso) : pending(iso);
      }),
      confirmedById: "u1", confirmedAt: "2026-05-10T10:15:00Z",
      status: "ACTIVE",
      createdAt: "2026-05-10T10:15:00Z", updatedAt: "2026-05-10T10:15:00Z",
      confirmedByName: "Dr. James Adeyemi",
    },
    {
      id: "rx3b", patientId: "p3", hospitalId: "h1",
      drugName: "Clopidogrel", dose: "75mg", route: "Oral", frequencyString: "Once daily",
      frequencyHours: 24, totalDoses: 30,
      startTime: "2026-05-10T08:00:00Z",
      administrationTimes: Array.from({ length: 30 }, (_, i) => {
        const d = new Date("2026-05-10T08:00:00Z");
        d.setDate(d.getDate() + i);
        const iso = d.toISOString();
        return i < 10 ? done(iso) : pending(iso);
      }),
      confirmedById: "u1", confirmedAt: "2026-05-10T10:15:00Z",
      status: "ACTIVE",
      createdAt: "2026-05-10T10:15:00Z", updatedAt: "2026-05-10T10:15:00Z",
      confirmedByName: "Dr. James Adeyemi",
    },
  ],
  p4: [
    {
      id: "rx4a", patientId: "p4", hospitalId: "h1",
      drugName: "Paracetamol", dose: "1g", route: "Oral", frequencyString: "Every 6 hours",
      frequencyHours: 6, totalDoses: 12,
      startTime: "2026-05-19T10:00:00Z",
      administrationTimes: [
        done("2026-05-19T10:00:00Z"),
        done("2026-05-19T16:00:00Z"),
        done("2026-05-19T22:00:00Z"),
        done("2026-05-20T04:00:00Z"),
        pending("2026-05-20T10:00:00Z"),
        pending("2026-05-20T16:00:00Z"),
        pending("2026-05-20T22:00:00Z"),
        pending("2026-05-21T04:00:00Z"),
        pending("2026-05-21T10:00:00Z"),
        pending("2026-05-21T16:00:00Z"),
        pending("2026-05-21T22:00:00Z"),
        pending("2026-05-22T04:00:00Z"),
      ],
      confirmedById: "u2", confirmedAt: "2026-05-19T09:30:00Z",
      status: "ACTIVE",
      createdAt: "2026-05-19T09:30:00Z", updatedAt: "2026-05-19T09:30:00Z",
      confirmedByName: "Dr. Amina Hassan",
    },
  ],
};

// â”€â”€â”€ Medication tasks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const MOCK_TASKS: MedicationTaskEnriched[] = [
  {
    id: "t1", medicationChartId: "mc1", patientId: "p1", hospitalId: "h1", wardId: "w1",
    assignedNurseId: "u3", scheduledTime: "2026-05-20T10:00:00Z",
    status: "OVERDUE", minutesOverdue: 22,
    patientFirstName: "Emmanuel", patientLastName: "Okafor", bedNumber: "4",
    drugName: "Furosemide", dose: "40mg", route: "IV",
    createdAt: "2026-05-17T09:45:00Z", updatedAt: "2026-05-20T10:22:00Z",
  },
  {
    id: "t2", medicationChartId: "mc2", patientId: "p2", hospitalId: "h1", wardId: "w1",
    assignedNurseId: "u3", scheduledTime: "2026-05-20T10:30:00Z",
    status: "PENDING", minutesOverdue: undefined,
    patientFirstName: "Fatima", patientLastName: "Abubakar", bedNumber: "7",
    drugName: "Co-amoxiclav", dose: "1.2g", route: "IV",
    createdAt: "2026-05-18T15:45:00Z", updatedAt: "2026-05-18T15:45:00Z",
  },
  {
    id: "t3", medicationChartId: "mc3", patientId: "p4", hospitalId: "h1", wardId: "w1",
    assignedNurseId: "u3", scheduledTime: "2026-05-20T12:00:00Z",
    status: "PENDING",
    patientFirstName: "Adaeze", patientLastName: "Nwosu", bedNumber: "11",
    drugName: "Paracetamol", dose: "1g", route: "Oral",
    createdAt: "2026-05-16T09:30:00Z", updatedAt: "2026-05-16T09:30:00Z",
  },
  {
    id: "t4", medicationChartId: "mc2b", patientId: "p2", hospitalId: "h1", wardId: "w1",
    assignedNurseId: "u4", scheduledTime: "2026-05-20T14:00:00Z",
    status: "PENDING",
    patientFirstName: "Fatima", patientLastName: "Abubakar", bedNumber: "7",
    drugName: "Azithromycin", dose: "500mg", route: "Oral",
    createdAt: "2026-05-18T15:45:00Z", updatedAt: "2026-05-18T15:45:00Z",
  },
  {
    id: "t5", medicationChartId: "mc1b", patientId: "p1", hospitalId: "h1", wardId: "w1",
    assignedNurseId: "u3", scheduledTime: "2026-05-19T22:00:00Z",
    status: "COMPLETED", completedAt: "2026-05-19T21:55:00Z",
    completedById: "u3", completedByName: "Sarah Okafor", actualDoseGiven: "40mg",
    patientFirstName: "Emmanuel", patientLastName: "Okafor", bedNumber: "4",
    drugName: "Furosemide", dose: "40mg", route: "IV",
    createdAt: "2026-05-17T09:45:00Z", updatedAt: "2026-05-19T21:55:00Z",
  },
  {
    id: "t6", medicationChartId: "mc4", patientId: "p3", hospitalId: "h1", wardId: "w2",
    assignedNurseId: "u4", scheduledTime: "2026-05-20T08:00:00Z",
    status: "COMPLETED", completedAt: "2026-05-20T08:05:00Z",
    completedById: "u4", completedByName: "Chidi Eze", actualDoseGiven: "75mg",
    patientFirstName: "Babatunde", patientLastName: "Lawson", bedNumber: "2",
    drugName: "Aspirin", dose: "75mg", route: "Oral",
    createdAt: "2026-05-19T10:15:00Z", updatedAt: "2026-05-20T08:05:00Z",
  },
];
