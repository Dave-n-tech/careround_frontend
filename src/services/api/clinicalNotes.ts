import { api } from "./baseApi";
import type { ClinicalNote, NoteType, SoapContent, AiProcessingResult } from "@/types/domain";

export interface ClinicalNoteEnriched extends ClinicalNote {
  authorName: string;
  authorRole: string;
}

export interface AddNoteRequest {
  patientId: string;
  noteType: NoteType;
  content: string;
}

export interface ConfirmNoteRequest {
  patientId: string;
  rawTranscription: string;
  clinicalNote: SoapContent;
  prescriptions: AiProcessingResult["prescriptions"];
}

export const clinicalNotesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPatientNotes: build.query<ClinicalNoteEnriched[], string>({
      query: (patientId) => `/patients/${patientId}/notes`,
      providesTags: (_r, _e, id) => [{ type: "ClinicalNotes", id }],
    }),
    addNote: build.mutation<ClinicalNoteEnriched, AddNoteRequest>({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}/notes`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "ClinicalNotes", id: arg.patientId }],
    }),
    confirmNote: build.mutation<ClinicalNoteEnriched, ConfirmNoteRequest>({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}/notes/confirm`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "ClinicalNotes", id: arg.patientId },
        "Prescriptions",
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
