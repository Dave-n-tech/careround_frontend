import { api } from "./baseApi";
import type { ClinicalNote, NoteType } from "@/types/domain";

export interface ClinicalNoteEnriched extends ClinicalNote {
  authorName: string;
  authorRole: string;
}

export interface AddNoteRequest {
  patientId: string;
  noteType: NoteType;
  content: string;
  rawTranscription?: string;
  isAiGenerated?: boolean;
}

// Matches the backend CreatePrescriptionRequest schema
export interface CreatePrescriptionRequest {
  drugName: string;
  dose: string;
  route: string;
  frequencyString: string;
  frequencyHours?: number;
  totalDoses?: number;
  startTime: string;
  administrationTimes: string[];
}

export interface ConfirmNoteRequest {
  patientId: string;
  noteType: NoteType;
  content: string;
  rawTranscription?: string;
  isAiGenerated: boolean;
  aiModelUsed?: string;
  // true  → manual note: backend sends to AI to extract prescriptions; prescriptions must be []
  // false → voice note: doctor reviewed AI-extracted prescriptions; prescriptions is non-empty
  extractPrescriptionsFromAi: boolean;
  prescriptions: CreatePrescriptionRequest[];
}

export interface ConfirmNoteResponse {
  noteId: string;
  prescriptionIds: string[];
}

export const clinicalNotesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPatientNotes: build.query<ClinicalNoteEnriched[], string>({
      query: (patientId) => `/clinical-notes/patient/${patientId}`,
      providesTags: (_r, _e, id) => [{ type: "ClinicalNotes", id }],
    }),
    addNote: build.mutation<ClinicalNoteEnriched, AddNoteRequest>({
      query: (body) => ({
        url: `/clinical-notes`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "ClinicalNotes", id: arg.patientId }],
    }),
    confirmNote: build.mutation<ConfirmNoteResponse, ConfirmNoteRequest>({
      query: (body) => ({
        url: `/clinical-notes/confirm`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "ClinicalNotes", id: arg.patientId },
        "Prescriptions",
        "MedicationChart",
        "MedicationTasks",
        "Patients",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPatientNotesQuery,
  useAddNoteMutation,
  useConfirmNoteMutation,
} = clinicalNotesApi;
