import { api } from "./baseApi";
import type { CareTask, ClinicalNote, Escalation } from "@/types/domain";

// ─── Care Tasks ──────────────────────────────────────────────────────────────

export type CreateCareTaskRequest = {
  patientId: string;
  taskType: string;
  source: string;
  title: string;
  description?: string;
  priority?: string;
  roundId?: string;
  windowStart: string;
  windowEnd: string;
};
export type AssignTaskRequest = { assignedToId: string; assignedToRole: string };

const clinicalApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Care Tasks
    getCareTasksByWard: builder.query<CareTask[], { wardId: string; status?: string }>({
      query: ({ wardId, status }) => `/care-tasks/ward/${wardId}${status ? `?status=${status}` : ""}`,
      providesTags: ["Tasks"]
    }),
    getCareTasksByPatient: builder.query<CareTask[], string>({
      query: (patientId) => `/care-tasks/patient/${patientId}`,
      providesTags: ["Tasks"]
    }),
    createCareTask: builder.mutation<CareTask, CreateCareTaskRequest>({
      query: (body) => ({ url: "/care-tasks", method: "POST", body }),
      invalidatesTags: ["Tasks"]
    }),
    progressTask: builder.mutation<CareTask, string>({
      query: (taskId) => ({ url: `/care-tasks/${taskId}/progress`, method: "PATCH" }),
      invalidatesTags: ["Tasks"]
    }),
    completeTask: builder.mutation<CareTask, string>({
      query: (taskId) => ({ url: `/care-tasks/${taskId}/complete`, method: "PATCH" }),
      invalidatesTags: ["Tasks"]
    }),
    assignTask: builder.mutation<CareTask, { taskId: string } & AssignTaskRequest>({
      query: ({ taskId, ...body }) => ({ url: `/care-tasks/${taskId}/assign`, method: "PATCH", body }),
      invalidatesTags: ["Tasks"]
    }),

    // Clinical Notes
    getClinicalNotesByPatient: builder.query<ClinicalNote[], string>({
      query: (patientId) => `/clinical-notes/patient/${patientId}`,
      providesTags: (_r, _e, patientId) => [{ type: "ClinicalNotes", id: patientId }]
    }),
    createClinicalNote: builder.mutation<ClinicalNote, { patientId: string; noteType: string; content: string; patientRoundReviewId?: string; vitalsId?: string }>({
      query: (body) => ({ url: "/clinical-notes", method: "POST", body }),
      invalidatesTags: (_r, _e, { patientId }) => [{ type: "ClinicalNotes", id: patientId }]
    }),
    amendNote: builder.mutation<ClinicalNote, { noteId: string; content: string }>({
      query: ({ noteId, ...body }) => ({ url: `/clinical-notes/${noteId}/amend`, method: "PATCH", body }),
      invalidatesTags: ["ClinicalNotes"]
    }),

    // Escalations
    getEscalationsByWard: builder.query<Escalation[], string>({
      query: (wardId) => `/escalations/ward/${wardId}`,
      providesTags: ["Escalations"]
    }),
    getEscalationsByPatient: builder.query<Escalation[], string>({
      query: (patientId) => `/escalations/patient/${patientId}`,
      providesTags: ["Escalations"]
    }),
    createEscalation: builder.mutation<Escalation, { patientId: string; severity: string; triggerType: string; notes?: string }>({
      query: (body) => ({ url: "/escalations", method: "POST", body }),
      invalidatesTags: ["Escalations", "Patients"]
    }),
    acknowledgeEscalation: builder.mutation<Escalation, { escalationId: string; notes?: string }>({
      query: ({ escalationId, ...body }) => ({ url: `/escalations/${escalationId}/acknowledge`, method: "PATCH", body }),
      invalidatesTags: ["Escalations"]
    }),
    resolveEscalation: builder.mutation<Escalation, { escalationId: string; notes: string }>({
      query: ({ escalationId, ...body }) => ({ url: `/escalations/${escalationId}/resolve`, method: "PATCH", body }),
      invalidatesTags: ["Escalations"]
    })
  })
});

export const {
  useGetCareTasksByWardQuery,
  useGetCareTasksByPatientQuery,
  useCreateCareTaskMutation,
  useProgressTaskMutation,
  useCompleteTaskMutation,
  useAssignTaskMutation,
  useGetClinicalNotesByPatientQuery,
  useCreateClinicalNoteMutation,
  useAmendNoteMutation,
  useGetEscalationsByWardQuery,
  useGetEscalationsByPatientQuery,
  useCreateEscalationMutation,
  useAcknowledgeEscalationMutation,
  useResolveEscalationMutation
} = clinicalApi;
