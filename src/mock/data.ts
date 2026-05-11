import type {
  CareTask,
  ClinicalNote,
  Department,
  Escalation,
  Hospital,
  OnCallRotation,
  Patient,
  Round,
  Shift,
  ShiftSchedule,
  Team,
  User,
  Ward,
  VitalsReading
} from "@/types/domain";
import { computeNEWS } from "@/utils/news";

export const HOSPITAL: Hospital = {
  id: "hosp_lasuth",
  name: "Olabisi Memorial Teaching Hospital",
  shortName: "OMTH Ikeja",
  address: "1 Hospital Road, Ikeja, Lagos",
  config: {
    newsAmber: 5,
    newsRed: 7,
    overdueGraceMins: 15,
    notifyNoK: true,
    notifyOnRoundComplete: true,
    enforceConsent: true
  }
};

export const DEPARTMENTS: Department[] = [
  {
    id: "d1",
    name: "General Medicine",
    code: "GMED",
    specialty: "Internal Medicine",
    wardCount: 3,
    headOfDept: "Prof. A. Adesanya"
  },
  {
    id: "d2",
    name: "General Surgery",
    code: "GSUR",
    specialty: "Surgery",
    wardCount: 2,
    headOfDept: "Prof. C. Okonkwo"
  },
  {
    id: "d3",
    name: "Cardiology",
    code: "CARD",
    specialty: "Cardiology",
    wardCount: 1,
    headOfDept: "Dr. F. Balogun"
  },
  {
    id: "d4",
    name: "Obstetrics and Gynaecology",
    code: "OBGY",
    specialty: "O and G",
    wardCount: 2,
    headOfDept: "Prof. N. Eze"
  },
  {
    id: "d5",
    name: "Paediatrics",
    code: "PAED",
    specialty: "Paediatrics",
    wardCount: 2,
    headOfDept: "Dr. K. Ajayi"
  }
];

export const WARDS: Ward[] = [
  {
    id: "w1",
    name: "Soyinka Ward",
    deptId: "d1",
    beds: 24,
    occupied: 21,
    supervisorId: "u_sup1",
    specialty: "Internal Medicine"
  },
  {
    id: "w2",
    name: "Achebe Ward",
    deptId: "d1",
    beds: 20,
    occupied: 18,
    supervisorId: "u_sup2",
    specialty: "Internal Medicine"
  },
  {
    id: "w3",
    name: "Adichie Ward",
    deptId: "d2",
    beds: 18,
    occupied: 14,
    supervisorId: "u_sup3",
    specialty: "Surgery"
  },
  {
    id: "w4",
    name: "Okri Ward",
    deptId: "d3",
    beds: 16,
    occupied: 12,
    supervisorId: "u_sup4",
    specialty: "Cardiology"
  },
  {
    id: "w5",
    name: "Emecheta Ward",
    deptId: "d4",
    beds: 22,
    occupied: 19,
    supervisorId: "u_sup5",
    specialty: "O and G"
  }
];

export const USERS: User[] = [
  {
    id: "u_admin",
    firstName: "Tunde",
    lastName: "Bankole",
    role: "ADMIN",
    email: "t.bankole@omth.ng",
    deptId: null,
    active: true
  },
  {
    id: "u_cons1",
    firstName: "Adaeze",
    lastName: "Okafor",
    role: "CONSULTANT",
    title: "Prof.",
    email: "a.okafor@omth.ng",
    deptId: "d1",
    active: true
  },
  {
    id: "u_cons2",
    firstName: "Ifeanyi",
    lastName: "Nwosu",
    role: "CONSULTANT",
    title: "Dr.",
    email: "i.nwosu@omth.ng",
    deptId: "d3",
    active: true
  },
  {
    id: "u_reg1",
    firstName: "Chinedu",
    lastName: "Eze",
    role: "REGISTRAR",
    title: "Dr.",
    email: "c.eze@omth.ng",
    deptId: "d1",
    active: true
  },
  {
    id: "u_reg2",
    firstName: "Folake",
    lastName: "Adebayo",
    role: "REGISTRAR",
    title: "Dr.",
    email: "f.adebayo@omth.ng",
    deptId: "d1",
    active: true
  },
  {
    id: "u_jr1",
    firstName: "Kunle",
    lastName: "Ogundimu",
    role: "JUNIOR_DOCTOR",
    title: "Dr.",
    email: "k.ogundimu@omth.ng",
    deptId: "d1",
    active: true
  },
  {
    id: "u_jr2",
    firstName: "Ngozi",
    lastName: "Obi",
    role: "JUNIOR_DOCTOR",
    title: "Dr.",
    email: "n.obi@omth.ng",
    deptId: "d1",
    active: true
  },
  {
    id: "u_jr3",
    firstName: "Bilkisu",
    lastName: "Yusuf",
    role: "JUNIOR_DOCTOR",
    title: "Dr.",
    email: "b.yusuf@omth.ng",
    deptId: "d2",
    active: true
  },
  {
    id: "u_nur1",
    firstName: "Funmi",
    lastName: "Adeyemi",
    role: "NURSE",
    email: "f.adeyemi@omth.ng",
    deptId: "d1",
    active: true
  },
  {
    id: "u_nur2",
    firstName: "Blessing",
    lastName: "Eke",
    role: "NURSE",
    email: "b.eke@omth.ng",
    deptId: "d1",
    active: true
  },
  {
    id: "u_nur3",
    firstName: "Aisha",
    lastName: "Mohammed",
    role: "NURSE",
    email: "a.mohammed@omth.ng",
    deptId: "d1",
    active: true
  },
  {
    id: "u_sup1",
    firstName: "Patience",
    lastName: "Okoro",
    role: "WARD_SUPERVISOR",
    email: "p.okoro@omth.ng",
    deptId: "d1",
    active: true
  },
  {
    id: "u_sup2",
    firstName: "Yemi",
    lastName: "Salami",
    role: "WARD_SUPERVISOR",
    email: "y.salami@omth.ng",
    deptId: "d1",
    active: true
  },
  {
    id: "u_sup3",
    firstName: "Hauwa",
    lastName: "Bello",
    role: "WARD_SUPERVISOR",
    email: "h.bello@omth.ng",
    deptId: "d2",
    active: true
  },
  {
    id: "u_sup4",
    firstName: "Emeka",
    lastName: "Nnamdi",
    role: "WARD_SUPERVISOR",
    email: "e.nnamdi@omth.ng",
    deptId: "d3",
    active: true
  },
  {
    id: "u_sup5",
    firstName: "Sade",
    lastName: "Ojo",
    role: "WARD_SUPERVISOR",
    email: "s.ojo@omth.ng",
    deptId: "d4",
    active: true
  }
];

export const TEAMS: Team[] = [
  {
    id: "t1",
    name: "Prof. Okafor's Firm",
    consultantId: "u_cons1",
    members: ["u_cons1", "u_reg1", "u_reg2", "u_jr1", "u_jr2"],
    wards: ["w1", "w2"],
    deptId: "d1",
    pendingInvites: [
      {
        id: "inv1",
        email: "o.akin@omth.ng",
        role: "JUNIOR_DOCTOR",
        sentAt: "2026-05-04 09:14",
        expiresAt: "2026-05-11 09:14"
      }
    ]
  },
  {
    id: "t2",
    name: "Dr. Nwosu's Cardiology Firm",
    consultantId: "u_cons2",
    members: ["u_cons2"],
    wards: ["w4"],
    deptId: "d3",
    pendingInvites: []
  }
];

type VitalsBase = {
  resp: number;
  spo2: number;
  temp: number;
  sys: number;
  hr: number;
  cons: "ALERT" | "VOICE" | "PAIN" | "UNRESPONSIVE";
};

function vitalsHistory(seed: number, base: VitalsBase): VitalsReading[] {
  const out: VitalsReading[] = [];
  let t = Date.now() - 36 * 3600 * 1000;
  for (let i = 0; i < 14; i += 1) {
    const jitter = (n: number, r: number) => n + Math.sin(seed + i * 1.7) * r;
    const v = {
      resp: Math.round(jitter(base.resp, 2)),
      spo2: Math.round(jitter(base.spo2, 1.5)),
      temp: Number(jitter(base.temp, 0.4).toFixed(1)),
      sys: Math.round(jitter(base.sys, 7)),
      hr: Math.round(jitter(base.hr, 6)),
      cons: base.cons,
      ts: new Date(t).toISOString()
    };
    const news = computeNEWS(v).total;
    out.push({ ...v, news });
    t += 2.5 * 3600 * 1000;
  }
  return out;
}

type PatientSeed = Omit<Patient, "vitals" | "news"> & { base: VitalsBase };

const PATIENT_SEEDS: PatientSeed[] = [
  {
    id: "p1",
    mrn: "OMTH-204871",
    firstName: "Adebayo",
    lastName: "Ogunleye",
    sex: "M",
    age: 62,
    wardId: "w1",
    bed: "B-04",
    teamId: "t1",
    admissionDate: "2026-04-30",
    admissionType: "EMERGENCY",
    primaryDiagnosis: "Severe community-acquired pneumonia",
    secondary: ["Type 2 diabetes mellitus", "Stage 2 hypertension"],
    acuity: "CRITICAL",
    status: "DETERIORATING",
    dischargeReady: false,
    nok: [
      {
        name: "Bola Ogunleye",
        relation: "Wife",
        phone: "+234 803 422 1190",
        method: "BOTH",
        consent: true
      }
    ],
    base: { resp: 24, spo2: 91, temp: 38.7, sys: 96, hr: 118, cons: "VOICE" }
  },
  {
    id: "p2",
    mrn: "OMTH-204902",
    firstName: "Aminat",
    lastName: "Bello",
    sex: "F",
    age: 34,
    wardId: "w1",
    bed: "B-07",
    teamId: "t1",
    admissionDate: "2026-05-01",
    admissionType: "EMERGENCY",
    primaryDiagnosis: "Sickle cell crisis (HbSS)",
    secondary: ["Functional asplenia"],
    acuity: "HIGH",
    status: "ADMITTED",
    dischargeReady: false,
    nok: [
      {
        name: "Musa Bello",
        relation: "Brother",
        phone: "+234 805 110 8821",
        method: "SMS",
        consent: true
      }
    ],
    base: { resp: 22, spo2: 94, temp: 38.2, sys: 108, hr: 104, cons: "ALERT" }
  },
  {
    id: "p3",
    mrn: "OMTH-204815",
    firstName: "Chukwuma",
    lastName: "Eze",
    sex: "M",
    age: 71,
    wardId: "w1",
    bed: "B-11",
    teamId: "t1",
    admissionDate: "2026-04-27",
    admissionType: "ELECTIVE",
    primaryDiagnosis: "Decompensated chronic heart failure (NYHA III)",
    secondary: ["Atrial fibrillation", "CKD stage 3"],
    acuity: "HIGH",
    status: "STABLE",
    dischargeReady: false,
    nok: [
      {
        name: "Ngozi Eze",
        relation: "Daughter",
        phone: "+234 802 998 1142",
        method: "EMAIL",
        consent: true,
        email: "ngozi.eze@gmail.com"
      }
    ],
    base: { resp: 18, spo2: 95, temp: 37.0, sys: 122, hr: 88, cons: "ALERT" }
  },
  {
    id: "p4",
    mrn: "OMTH-204688",
    firstName: "Folake",
    lastName: "Adekunle",
    sex: "F",
    age: 48,
    wardId: "w1",
    bed: "B-12",
    teamId: "t1",
    admissionDate: "2026-04-22",
    admissionType: "EMERGENCY",
    primaryDiagnosis: "Diabetic ketoacidosis - resolved",
    secondary: ["Type 1 diabetes mellitus"],
    acuity: "LOW",
    status: "DISCHARGE_READY",
    dischargeReady: true,
    nok: [
      {
        name: "Tope Adekunle",
        relation: "Husband",
        phone: "+234 809 661 4421",
        method: "SMS",
        consent: true
      }
    ],
    base: { resp: 16, spo2: 98, temp: 36.7, sys: 118, hr: 76, cons: "ALERT" }
  },
  {
    id: "p5",
    mrn: "OMTH-204944",
    firstName: "Ibrahim",
    lastName: "Suleiman",
    sex: "M",
    age: 55,
    wardId: "w1",
    bed: "B-15",
    teamId: "t1",
    admissionDate: "2026-05-02",
    admissionType: "EMERGENCY",
    primaryDiagnosis: "Acute kidney injury (Stage 2) on background CKD",
    secondary: ["Hypertension", "Anaemia of chronic disease"],
    acuity: "MEDIUM",
    status: "ADMITTED",
    dischargeReady: false,
    nok: [
      {
        name: "Hauwa Suleiman",
        relation: "Wife",
        phone: "+234 803 552 0021",
        method: "SMS",
        consent: false
      }
    ],
    base: { resp: 18, spo2: 96, temp: 37.2, sys: 144, hr: 84, cons: "ALERT" }
  },
  {
    id: "p6",
    mrn: "OMTH-204711",
    firstName: "Olamide",
    lastName: "Akande",
    sex: "F",
    age: 28,
    wardId: "w1",
    bed: "B-18",
    teamId: "t1",
    admissionDate: "2026-05-03",
    admissionType: "EMERGENCY",
    primaryDiagnosis: "Severe falciparum malaria",
    secondary: ["Mild thrombocytopenia"],
    acuity: "HIGH",
    status: "STABLE",
    dischargeReady: false,
    nok: [
      {
        name: "Yetunde Akande",
        relation: "Mother",
        phone: "+234 806 110 4422",
        method: "BOTH",
        consent: true
      }
    ],
    base: { resp: 20, spo2: 95, temp: 39.1, sys: 106, hr: 108, cons: "ALERT" }
  },
  {
    id: "p7",
    mrn: "OMTH-204588",
    firstName: "Emeka",
    lastName: "Nwankwo",
    sex: "M",
    age: 67,
    wardId: "w1",
    bed: "B-21",
    teamId: "t1",
    admissionDate: "2026-04-19",
    admissionType: "ELECTIVE",
    primaryDiagnosis: "Post NSTEMI rehabilitation",
    secondary: ["Dyslipidaemia", "Type 2 diabetes mellitus"],
    acuity: "LOW",
    status: "STABLE",
    dischargeReady: false,
    nok: [
      {
        name: "Chioma Nwankwo",
        relation: "Daughter",
        phone: "+234 805 222 6611",
        method: "EMAIL",
        consent: true,
        email: "chioma.n@yahoo.com"
      }
    ],
    base: { resp: 16, spo2: 97, temp: 36.5, sys: 128, hr: 72, cons: "ALERT" }
  }
];

export const PATIENTS: Patient[] = PATIENT_SEEDS.map((seed, index) => {
  const vitals = vitalsHistory(index + 1, seed.base);
  const news = vitals[vitals.length - 1]?.news ?? 0;
  const { base, ...rest } = seed;
  return { ...rest, vitals, news };
});

export const TASKS: CareTask[] = [
  {
    id: "tk1",
    patientId: "p1",
    title: "IV Ceftriaxone 2g BD",
    priority: "URGENT",
    source: "POST_ROUND_JOB",
    status: "IN_PROGRESS",
    assigneeRole: "NURSE",
    assigneeId: "u_nur1",
    windowStart: "08:00",
    windowEnd: "12:00",
    windowDate: "2026-05-06"
  },
  {
    id: "tk2",
    patientId: "p1",
    title: "Repeat ABG in 4 hours",
    priority: "URGENT",
    source: "POST_ROUND_JOB",
    status: "PENDING",
    assigneeRole: "JUNIOR_DOCTOR",
    assigneeId: "u_jr2",
    windowStart: "10:00",
    windowEnd: "12:00",
    windowDate: "2026-05-06"
  },
  {
    id: "tk3",
    patientId: "p1",
    title: "4-hourly NEWS observations",
    priority: "ROUTINE",
    source: "NURSING_CARE_PLAN",
    status: "IN_PROGRESS",
    assigneeRole: "NURSE",
    assigneeId: "u_nur1",
    windowStart: "06:00",
    windowEnd: "22:00",
    windowDate: "2026-05-06"
  },
  {
    id: "tk4",
    patientId: "p2",
    title: "IV fluids - 1L Normal Saline",
    priority: "URGENT",
    source: "NURSING_CARE_PLAN",
    status: "COMPLETED",
    assigneeRole: "NURSE",
    assigneeId: "u_nur2",
    windowStart: "07:00",
    windowEnd: "09:00",
    windowDate: "2026-05-06"
  },
  {
    id: "tk5",
    patientId: "p2",
    title: "IV Tramadol 100mg",
    priority: "URGENT",
    source: "NURSING_CARE_PLAN",
    status: "PENDING",
    assigneeRole: "NURSE",
    assigneeId: "u_nur1",
    windowStart: "06:00",
    windowEnd: "08:30",
    windowDate: "2026-05-06"
  },
  {
    id: "tk6",
    patientId: "p3",
    title: "Echo report review",
    priority: "ROUTINE",
    source: "POST_ROUND_JOB",
    status: "PENDING",
    assigneeRole: "JUNIOR_DOCTOR",
    assigneeId: "u_jr1",
    windowStart: "10:00",
    windowEnd: "14:00",
    windowDate: "2026-05-06"
  },
  {
    id: "tk7",
    patientId: "p5",
    title: "Repeat U and Es",
    priority: "ROUTINE",
    source: "POST_ROUND_JOB",
    status: "PENDING",
    assigneeRole: "JUNIOR_DOCTOR",
    assigneeId: "u_jr2",
    windowStart: "08:00",
    windowEnd: "10:00",
    windowDate: "2026-05-06"
  },
  {
    id: "tk8",
    patientId: "p6",
    title: "Quinine infusion - 2nd dose",
    priority: "EMERGENCY",
    source: "NURSING_CARE_PLAN",
    status: "IN_PROGRESS",
    assigneeRole: "NURSE",
    assigneeId: "u_nur3",
    windowStart: "07:30",
    windowEnd: "08:30",
    windowDate: "2026-05-06"
  },
  {
    id: "tk9",
    patientId: "p7",
    title: "Discharge meds check",
    priority: "ROUTINE",
    source: "POST_ROUND_JOB",
    status: "PENDING",
    assigneeRole: "JUNIOR_DOCTOR",
    assigneeId: "u_jr1",
    windowStart: "11:00",
    windowEnd: "14:00",
    windowDate: "2026-05-06"
  },
  {
    id: "tk10",
    patientId: "p4",
    title: "Counsel on insulin self-administration",
    priority: "ROUTINE",
    source: "NURSING_CARE_PLAN",
    status: "PENDING",
    assigneeRole: "NURSE",
    assigneeId: "u_nur1",
    windowStart: "09:00",
    windowEnd: "11:00",
    windowDate: "2026-05-06"
  }
];

export const ESCALATIONS: Escalation[] = [
  {
    id: "e1",
    patientId: "p1",
    triggerType: "HIGH_NEWS_SCORE",
    severity: "RED",
    status: "OPEN",
    createdAt: "2026-05-06T07:42:00",
    assigneeId: "u_cons1",
    notes: "NEWS 9, RR 26, SpO2 89%. Patient less responsive than 06:00 review."
  },
  {
    id: "e2",
    patientId: "p6",
    triggerType: "NURSE_CONCERN",
    severity: "AMBER",
    status: "OPEN",
    createdAt: "2026-05-06T07:18:00",
    assigneeId: "u_reg1",
    notes: "Persistent fever despite paracetamol. Capillary refill 3s."
  },
  {
    id: "e3",
    patientId: "p2",
    triggerType: "TASK_OVERDUE",
    severity: "AMBER",
    status: "ACKNOWLEDGED",
    createdAt: "2026-05-06T06:45:00",
    assigneeId: "u_reg2",
    notes: "Tramadol dose missed at 06:00."
  }
];

export const SHIFTS: Shift[] = [
  {
    id: "sh1",
    wardId: "w1",
    date: "2026-05-06",
    name: "Morning (07:00-15:00)",
    status: "ACTIVE",
    leadDoctorId: "u_reg1",
    nurseInChargeId: "u_nur1",
    startsAt: "07:00",
    endsAt: "15:00"
  },
  {
    id: "sh2",
    wardId: "w1",
    date: "2026-05-06",
    name: "Afternoon (15:00-22:00)",
    status: "PENDING_ASSIGNMENT",
    leadDoctorId: null,
    nurseInChargeId: null,
    startsAt: "15:00",
    endsAt: "22:00"
  },
  {
    id: "sh3",
    wardId: "w1",
    date: "2026-05-06",
    name: "Night (22:00-07:00)",
    status: "PENDING_ASSIGNMENT",
    leadDoctorId: null,
    nurseInChargeId: null,
    startsAt: "22:00",
    endsAt: "07:00"
  },
  {
    id: "sh4",
    wardId: "w2",
    date: "2026-05-06",
    name: "Morning (07:00-15:00)",
    status: "ACTIVE",
    leadDoctorId: "u_reg2",
    nurseInChargeId: "u_nur2",
    startsAt: "07:00",
    endsAt: "15:00"
  },
  {
    id: "sh5",
    wardId: "w2",
    date: "2026-05-06",
    name: "Afternoon (15:00-22:00)",
    status: "PENDING_ASSIGNMENT",
    leadDoctorId: null,
    nurseInChargeId: null,
    startsAt: "15:00",
    endsAt: "22:00"
  },
  {
    id: "sh6",
    wardId: "w3",
    date: "2026-05-06",
    name: "Morning (07:00-15:00)",
    status: "PENDING_ASSIGNMENT",
    leadDoctorId: null,
    nurseInChargeId: null,
    startsAt: "07:00",
    endsAt: "15:00"
  }
];

export const SHIFT_SCHEDULES: ShiftSchedule[] = [
  {
    id: "ss1",
    name: "GMED - Weekday Morning",
    wardId: "w1",
    pattern: "Mon-Fri",
    start: "07:00",
    end: "15:00",
    leadRole: "REGISTRAR",
    active: true
  },
  {
    id: "ss2",
    name: "GMED - Weekday Afternoon",
    wardId: "w1",
    pattern: "Mon-Fri",
    start: "15:00",
    end: "22:00",
    leadRole: "REGISTRAR",
    active: true
  },
  {
    id: "ss3",
    name: "GMED - Night",
    wardId: "w1",
    pattern: "Daily",
    start: "22:00",
    end: "07:00",
    leadRole: "REGISTRAR",
    active: true
  },
  {
    id: "ss4",
    name: "GSUR - Weekend On-Call",
    wardId: "w3",
    pattern: "Sat-Sun",
    start: "08:00",
    end: "20:00",
    leadRole: "CONSULTANT",
    active: false
  }
];

export const ON_CALL: OnCallRotation[] = [
  {
    id: "oc1",
    deptId: "d1",
    userId: "u_reg1",
    role: "REGISTRAR",
    start: "2026-05-06T07:00",
    end: "2026-05-06T19:00"
  },
  {
    id: "oc2",
    deptId: "d1",
    userId: "u_cons1",
    role: "CONSULTANT",
    start: "2026-05-06T00:00",
    end: "2026-05-06T23:59"
  },
  {
    id: "oc3",
    deptId: "d2",
    userId: "u_jr3",
    role: "REGISTRAR",
    start: "2026-05-06T07:00",
    end: "2026-05-06T19:00"
  },
  {
    id: "oc4",
    deptId: "d3",
    userId: "u_cons2",
    role: "CONSULTANT",
    start: "2026-05-06T08:00",
    end: "2026-05-07T08:00"
  }
];

export const CLINICAL_NOTES: ClinicalNote[] = [
  {
    id: "n1",
    patientId: "p1",
    authorId: "u_cons1",
    type: "ROUND_NOTE",
    createdAt: "2026-05-06 07:05",
    body:
      "Reviewed on morning round. SpO2 91% on 4L O2 via nasal prongs. Increasing tachypnoea overnight. Crepitations bilateral mid-zones. Plan: escalate to 28% Venturi mask, repeat CXR, blood cultures, continue ceftriaxone + azithromycin. Discuss with ICU if no improvement by 12:00."
  },
  {
    id: "n2",
    patientId: "p1",
    authorId: "u_jr2",
    type: "PROGRESS_NOTE",
    createdAt: "2026-05-05 22:14",
    body:
      "Patient reports increased breathlessness. Sat dropped from 94% to 91% on 2L. Increased to 4L. NEWS 7. Discussed with on-call registrar Dr. Eze. Plan to review again at midnight."
  },
  {
    id: "n3",
    patientId: "p3",
    authorId: "u_cons1",
    type: "ROUND_NOTE",
    createdAt: "2026-05-06 07:18",
    body:
      "CHF patient - diuresing well, weight down 1.2kg in 24h. JVP no longer elevated. Plan: switch IV to oral furosemide 80mg BD, continue bisoprolol, recheck U and Es tomorrow. Likely discharge in 48h if stable."
  }
];

export const ROUNDS: Round[] = [
  {
    id: "r1",
    wardId: "w1",
    teamId: "t1",
    type: "MORNING",
    status: "IN_PROGRESS",
    leadId: "u_cons1",
    participants: ["u_cons1", "u_reg1", "u_jr1", "u_jr2"],
    startedAt: "2026-05-06 07:00",
    completedAt: null,
    queue: ["p1", "p6", "p2", "p3", "p5", "p7", "p4"],
    reviewed: ["p1", "p3"]
  },
  {
    id: "r0",
    wardId: "w1",
    teamId: "t1",
    type: "EVENING",
    status: "COMPLETED",
    leadId: "u_reg1",
    participants: ["u_reg1", "u_jr2"],
    startedAt: "2026-05-05 18:30",
    completedAt: "2026-05-05 19:42",
    queue: ["p1", "p2", "p3", "p5", "p6", "p7"],
    reviewed: ["p1", "p2", "p3", "p5", "p6", "p7"]
  }
];
