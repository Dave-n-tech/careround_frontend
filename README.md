# CareRound — Frontend

React + TypeScript frontend for the CareRound digital ward management platform.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Domain Types and Enums](#5-domain-types-and-enums)
6. [Roles and Permissions](#6-roles-and-permissions)
7. [Workflows](#7-workflows)
8. [API Reference](#8-api-reference)
9. [Local Development](#9-local-development)

---

## 1. System Overview

CareRound is a **multi-tenant digital ward management platform** for hospitals. It digitises the full lifecycle of inpatient care: patient admission and team assignment, shift management and handovers, daily ward rounds with patient prioritisation, nursing care tasks, clinical documentation, and patient deterioration detection via VHI score.

**Multi-tenancy:** Every hospital is an independent tenant. All data is scoped by `hospitalId`. A user from Hospital A cannot access data from Hospital B.

**Roles:** The app surfaces different views and capabilities depending on the authenticated user's role — Admin, Doctor, Nurse, or Ward Supervisor. Role is read from the JWT and drives routing and UI permissions throughout.

---

## 2. Architecture

### Backend: Modular Monolith

The backend (`careround-core`) is a Spring Boot modular monolith on port 8080. It is the only service the frontend talks to. Two separate Kafka consumer services (`careround-notification`, `careround-audit`) run independently — the frontend has no direct interaction with them.

**What this means for the frontend:**
- One base URL (`VITE_API_BASE_URL`) — all API calls go to `careround-core`
- All responses are wrapped in `{ success, message, data }` — the `baseQuery` unwraps this automatically
- JWT tokens are short-lived; a silent refresh flow uses `/auth/refresh` via a mutex in `baseQuery.ts`
- `hospitalId` is embedded in the JWT — never passed as a request parameter

### Why some actions are async

The backend uses a Transactional Outbox → Kafka chain for side effects (prescription creation, medication chart entries, task generation). When the frontend calls `POST /patients/{id}/notes/confirm`, the response returns immediately with a `noteId` and `prescriptionIds` — but the medication chart and task entries are written asynchronously by Kafka consumers. The frontend handles this with:
- Tag invalidation in RTK Query to trigger immediate refetch
- 15-second polling on `getMedicationChart` to catch delayed Kafka results

---

## 3. Tech Stack

| Concern | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| State / data fetching | Redux Toolkit + RTK Query |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Charts | Recharts |
| Backend API | Spring Boot (port 8080) |

---

## 4. Project Structure

```
careround/
├── src/
│   ├── app/
│   │   ├── App.tsx              ← root layout, routing, ToastContainer
│   │   ├── store.ts             ← Redux store
│   │   └── hooks.ts             ← useAppSelector / useAppDispatch
│   ├── components/
│   │   └── ui/                  ← shared components (Button, Modal, Toast, Badge, etc.)
│   ├── pages/
│   │   ├── admin/               ← Admin-only pages (patients, wards, users)
│   │   ├── doctor/              ← Doctor pages (patients list, recording flow)
│   │   ├── nurse/               ← Nurse pages (tasks)
│   │   ├── supervisor/          ← Ward supervisor pages
│   │   └── shared/              ← Role-shared pages (PatientDetail)
│   ├── services/
│   │   ├── baseQuery.ts         ← RTK base query with envelope unwrapping + token refresh
│   │   └── api/
│   │       ├── baseApi.ts       ← createApi with tagTypes
│   │       ├── auth.ts
│   │       ├── clinicalNotes.ts ← note confirm endpoints (Endpoint 1 + 2)
│   │       ├── patients.ts
│   │       ├── prescriptions.ts ← medication chart, tasks
│   │       ├── users.ts
│   │       ├── vitals.ts
│   │       └── wards.ts
│   ├── types/
│   │   └── domain.ts            ← all shared TypeScript interfaces and enums
│   └── utils/
│       └── format.ts
├── docs/
│   └── api-docs.json            ← OpenAPI spec — source of truth for endpoint contracts
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

### Key patterns

**RTK Query tag invalidation** drives all cache refreshes. Every mutation's `invalidatesTags` must list the tags it affects. `confirmNoteGeneral` invalidates `ClinicalNotes`, `Prescriptions`, `MedicationChart`, `MedicationTasks`, and `Patients`.

**`baseQuery.ts`** handles two concerns automatically:
1. Unwraps the `{ success, message, data }` response envelope — RTK Query sees only `data`
2. Silent token refresh on 401 — retries the original request after refresh

**Role-based routing** — `App.tsx` reads `role` from the auth slice and renders role-specific layouts/routes. Pages guard themselves with the `canWrite`, `isNurse`, etc. flags derived from role.

---

## 5. Domain Types and Enums

All types live in `src/types/domain.ts`.

### Core enums

```ts
type UserRole = "ADMIN" | "CONSULTANT" | "REGISTRAR" | "JUNIOR_DOCTOR" | "NURSE" | "WARD_SUPERVISOR"
// Frontend uses: "DOCTOR" as an alias for all doctor roles (CONSULTANT | REGISTRAR | JUNIOR_DOCTOR)

type PatientStatus = "ADMITTED" | "STABLE" | "DETERIORATING" | "DISCHARGE_READY" | "DISCHARGED"

type AdmissionType = "EMERGENCY" | "ELECTIVE" | "TRANSFER"

type AcuityColor = "RED" | "AMBER" | "GREEN"
// Derived from VHI score:  0–2 → GREEN (Stable)  |  3–4 → AMBER (Moderate)  |  5+ → RED (Critical)

type NoteType =
  | "WARD_ROUND_NOTE"
  | "PROGRESS_NOTE"
  | "ADMISSION_NOTE"
  | "DISCHARGE_NOTE"
  | "HANDOVER_NOTE"
  | "NURSING_REPORT"

type PatientGender = "MALE" | "FEMALE" | "OTHER"
```

### Key interfaces

```ts
interface Patient {
  id: string
  wardId: string
  bedNumber?: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: PatientGender
  hospitalNumber: string
  admissionDate: string
  admissionType: AdmissionType
  primaryDiagnosis?: string
  acuityColor: AcuityColor
  status: PatientStatus
  // ...
}

interface SoapContent {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

interface AiProcessingResult {
  rawTranscription: string
  clinicalNote: SoapContent
  prescriptions: AiPrescription[]
}

interface AiPrescription {
  drugName: string
  dose: string
  route: string
  frequencyString: string
  frequencyHours: number
  totalDoses: number
  startTime: string
  administrationTimes: string[]
}
```

---

## 6. Roles and Permissions

| Role | App access | Key capabilities |
|---|---|---|
| ADMIN | Admin panel | Manage wards, users, patients (no clinical data) |
| DOCTOR (CONSULTANT / REGISTRAR / JUNIOR_DOCTOR) | Doctor views | Ward round notes, prescriptions, patient detail |
| NURSE | Nurse views | Vitals recording, medication tasks, handover notes |
| WARD_SUPERVISOR | Supervisor dashboard | Shift oversight, patient overview (read-heavy) |

### Frontend role rules

- **WARD_ROUND_NOTE** — Doctor only. Always goes through `POST /clinical-notes/confirm` or `POST /patients/{id}/notes/confirm`.
- **Nurse notes** (HANDOVER_NOTE, NURSING_REPORT) — go through `POST /clinical-notes` (plain save, no Kafka chain).
- **Vitals recording** — Nurse only. Triggers VHI/acuity recalculation on the backend.
- **Medication chart edits** — `PUT /medication-charts/{chartId}` updates nurse notes only. Drug/dose edits go through `PUT /prescriptions/{prescriptionId}`.
- **Discontinue** — `PUT /prescriptions/{prescriptionId}/discontinue`.

---

## 7. Workflows

### 7.1 Patient Admission

Admin or Ward Supervisor creates the patient record. Nurse records first vitals → VHI score computed → acuity colour set. Patient appears on ward list ordered by acuity (RED → AMBER → GREEN).

### 7.2 Ward Round (Doctor)

The doctor navigates to a patient, then either:

**Voice note flow (AI-assisted):**
1. Tap the microphone — `RecordingFlow.tsx` opens
2. Record audio → `POST /ai/process-voice-note` (SSE) returns `AiProcessingResult`
3. Doctor reviews SOAP note and extracted prescriptions on the review screen
4. Confirm → `POST /clinical-notes/confirm` with `isAiGenerated: true`, `extractPrescriptionsFromAi: true`
5. Backend extracts prescriptions and triggers Kafka chain → medication chart + tasks created

**Manual note flow:**
1. Add Note modal → select WARD_ROUND_NOTE, type content
2. Save → `POST /clinical-notes/confirm` with `isAiGenerated: false`, `extractPrescriptionsFromAi: false`, `prescriptions: []`

### 7.3 Nurse Care Flow

Nurse views `NurseTasks` page showing overdue / due-soon / upcoming / completed medication tasks grouped by urgency. Completing a task calls `PUT /medication-tasks/{taskId}/complete`.

Nurse records vitals from the patient detail Vitals tab → `POST /patients/{id}/vitals`. Can edit a prior vitals entry → `PUT /patients/{id}/vitals/{vitalsId}` — edited entries show an "edited" badge in the table.

### 7.4 Confirm Note — Two Endpoints

The confirm flow has two endpoints with different intended uses:

**Endpoint 1** — `POST /clinical-notes/confirm`
- Used for all manual typed notes and AI voice notes
- Accepts `content` as a plain string, `noteType`, `isAiGenerated`, `extractPrescriptionsFromAi`, `prescriptions[]`
- With `extractPrescriptionsFromAi: true` + `prescriptions: []`, the backend calls the AI service itself
- With `extractPrescriptionsFromAi: false` + populated `prescriptions[]`, uses the supplied list directly

**Endpoint 2** — `POST /patients/{patientId}/notes/confirm`
- Designed specifically for AI voice output
- Accepts structured `clinicalNote: SoapContent` directly
- Always saves as `WARD_ROUND_NOTE`, `isAiGenerated: true`

Both trigger the same Kafka chain: prescription confirmed → MedicationChart → MedicationTasks.

### 7.5 Patient Discharge (Admin)

Admin panel shows all patients. Discharged patients can be readmitted via the Readmit button — this calls `PUT /patients/{id}` to update ward/bed/admissionType, then `PATCH /patients/{id}/status` to set status back to `ADMITTED`.

---

## 8. API Reference

All endpoints are prefixed `/api/v1`. All require `Authorization: Bearer <token>` except auth endpoints. `hospitalId` is extracted from the JWT by the backend — never sent as a parameter.

Full OpenAPI spec: `docs/api-docs.json`

### Authentication

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/auth/login` | Returns `accessToken` + `refreshToken` |
| POST | `/auth/refresh` | Body: `{ refreshToken }` |
| POST | `/auth/logout` | Authenticated |
| POST | `/auth/change-password` | Authenticated |

### Users

| Method | Endpoint | Access |
|---|---|---|
| GET | `/users/me` | Authenticated |
| GET | `/users` | ADMIN |
| POST | `/users` | ADMIN |
| PUT | `/users/{id}` | ADMIN |
| PUT | `/users/{id}/ward-assignment` | ADMIN |

### Wards

| Method | Endpoint |
|---|---|
| GET | `/wards` |
| GET | `/wards/{id}` |
| POST | `/wards` |
| PUT | `/wards/{id}` |

### Patients

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/patients` | Query params: `status`, `wardId` |
| GET | `/patients/{id}` | |
| POST | `/patients` | ADMIN, WARD_SUPERVISOR |
| PUT | `/patients/{id}` | Full patient update (also used for readmit) |
| PATCH | `/patients/{id}/status` | Status-only update |

### Vitals

| Method | Endpoint |
|---|---|
| GET | `/patients/{id}/vitals` |
| POST | `/patients/{id}/vitals` |
| PUT | `/patients/{id}/vitals/{vitalsId}` |

### Clinical Notes

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/clinical-notes/patient/{patientId}` | |
| POST | `/clinical-notes` | Plain save — nurse notes only, no Kafka chain |
| POST | `/clinical-notes/confirm` | Manual/AI notes — triggers Kafka chain |
| POST | `/patients/{id}/notes/confirm` | AI voice SOAP notes — triggers Kafka chain |

### Prescriptions and Medication Chart

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/patients/{id}/prescriptions` | |
| GET | `/patients/{id}/medication-chart` | Enriched chart with administration slots |
| POST | `/medication-charts/{patientId}/manual` | Manual medication entry |
| PUT | `/prescriptions/{id}` | Update prescription (drug/dose/route/etc.) |
| PUT | `/prescriptions/{id}/discontinue` | |
| PUT | `/medication-charts/{chartId}` | Update nurse notes on chart entry only |
| PUT | `/medication-charts/{chartId}/discontinue` | |

### Medication Tasks

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/medication-tasks` | Query param: `wardId`. Returns grouped: overdue/dueSoon/upcoming/completed |
| PUT | `/medication-tasks/{id}/complete` | Body: `{ actualDoseGiven? }` |

### AI Voice Processing

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/ai/process-voice-note` | Multipart: `audio`, `patient_id`, `current_time`, `mode`. Returns SSE stream. |

SSE events:
- `transcription_complete` — transcription step done (no data payload)
- `processing_complete` — full `AiProcessingResult` JSON in data field
- `error` — processing failed

---

## 9. Local Development

### Prerequisites

```
Node.js 20 LTS
npm
```

### Setup

```bash
npm install
```

### Environment

Create a `.env.local` file:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### Run

```bash
npm run dev
```

App runs at `http://localhost:5173` by default.

The backend must be running at `VITE_API_BASE_URL` for API calls to work. If you don't have the backend running locally, point `VITE_API_BASE_URL` at a shared dev/staging backend.

### Build

```bash
npm run build        # production build to dist/
npm run preview      # preview the production build locally
```

### Type checking

```bash
npx tsc --noEmit
```
