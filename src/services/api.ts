import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";
import type {
  CareTask,
  ClinicalNote,
  Department,
  Escalation,
  OnCallRotation,
  Patient,
  Round,
  Shift,
  ShiftSchedule,
  Team,
  User,
  Ward
} from "@/types/domain";

export type LoginRequest = { email: string; password: string; role?: string };
export type LoginResponse = {
  user?: User;
  accessToken?: string;
  token?: string;
  refreshToken?: string;
};

type IdPayload = { id: string };
type StatusPayload<TStatus extends string> = IdPayload & { status: TStatus };
type CreateClinicalNoteRequest = {
  patientId: string;
  type: string;
  body: string;
};
type CreateVitalsRequest = {
  patientId: string;
  resp: number;
  spo2: number;
  temp: number;
  sys: number;
  hr: number;
  cons: string;
};
type CreateEscalationRequest = {
  patientId: string;
  triggerType: string;
  severity: string;
  notes: string;
};
type AssignShiftRequest = {
  id: string;
  leadDoctorId: string;
  nurseInChargeId: string;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "Users",
    "Departments",
    "Wards",
    "Teams",
    "Patients",
    "Tasks",
    "Escalations",
    "Shifts",
    "ShiftSchedules",
    "OnCallRotations",
    "ClinicalNotes",
    "Rounds",
    "Me"
  ],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body
      }),
      invalidatesTags: ["Me"]
    }),
    logout: builder.mutation<{ ok: boolean }, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["Me"]
    }),
    getMe: builder.query<User, void>({
      query: () => "/users/me",
      providesTags: ["Me"]
    }),
    getDepartments: builder.query<Department[], void>({
      query: () => "/departments",
      providesTags: ["Departments"]
    }),
    getWards: builder.query<Ward[], void>({
      query: () => "/wards",
      providesTags: ["Wards"]
    }),
    getUsers: builder.query<User[], void>({
      query: () => "/users",
      providesTags: ["Users"]
    }),
    getTeams: builder.query<Team[], void>({
      query: () => "/medical-teams",
      providesTags: ["Teams"]
    }),
    getPatients: builder.query<Patient[], void>({
      query: () => "/patients",
      providesTags: ["Patients"]
    }),
    getPatientById: builder.query<Patient, string>({
      query: (patientId) => `/patients/${patientId}`,
      providesTags: (result, error, patientId) => [
        { type: "Patients", id: patientId }
      ]
    }),
    getCareTasks: builder.query<CareTask[], void>({
      query: () => "/care-tasks",
      providesTags: ["Tasks"]
    }),
    getEscalations: builder.query<Escalation[], void>({
      query: () => "/escalations",
      providesTags: ["Escalations"]
    }),
    getShifts: builder.query<Shift[], void>({
      query: () => "/shifts",
      providesTags: ["Shifts"]
    }),
    getShiftSchedules: builder.query<ShiftSchedule[], void>({
      query: () => "/shift-schedules",
      providesTags: ["ShiftSchedules"]
    }),
    getOnCallRotations: builder.query<OnCallRotation[], void>({
      query: () => "/on-call-rotations",
      providesTags: ["OnCallRotations"]
    }),
    getClinicalNotesByPatient: builder.query<ClinicalNote[], string>({
      query: (patientId) => `/patients/${patientId}/clinical-notes`,
      providesTags: (result, error, patientId) => [
        { type: "ClinicalNotes", id: patientId }
      ]
    }),
    getRounds: builder.query<Round[], void>({
      query: () => "/rounds",
      providesTags: ["Rounds"]
    }),
    createClinicalNote: builder.mutation<ClinicalNote, CreateClinicalNoteRequest>({
      query: ({ patientId, ...body }) => ({
        url: "/clinical-notes",
        method: "POST",
        body: { patientId, ...body }
      }),
      invalidatesTags: (result, error, { patientId }) => [
        { type: "ClinicalNotes", id: patientId }
      ]
    }),
    recordVitals: builder.mutation<Patient, CreateVitalsRequest>({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}/vitals`,
        method: "POST",
        body
      }),
      invalidatesTags: (result, error, { patientId }) => [
        "Patients",
        "Escalations",
        { type: "Patients", id: patientId }
      ]
    }),
    createEscalation: builder.mutation<Escalation, CreateEscalationRequest>({
      query: (body) => ({
        url: "/escalations",
        method: "POST",
        body
      }),
      invalidatesTags: ["Escalations", "Patients"]
    }),
    updateCareTaskStatus: builder.mutation<CareTask, StatusPayload<CareTask["status"]>>({
      query: ({ id, status }) => ({
        url: `/care-tasks/${id}/status`,
        method: "PUT",
        body: { status }
      }),
      invalidatesTags: ["Tasks"]
    }),
    acknowledgeEscalation: builder.mutation<Escalation, IdPayload>({
      query: ({ id }) => ({
        url: `/escalations/${id}/acknowledge`,
        method: "PUT"
      }),
      invalidatesTags: ["Escalations"]
    }),
    resolveEscalation: builder.mutation<Escalation, IdPayload>({
      query: ({ id }) => ({
        url: `/escalations/${id}/resolve`,
        method: "PUT"
      }),
      invalidatesTags: ["Escalations"]
    }),
    assignShift: builder.mutation<Shift, AssignShiftRequest>({
      query: ({ id, ...body }) => ({
        url: `/shifts/${id}/assign`,
        method: "PUT",
        body
      }),
      invalidatesTags: ["Shifts"]
    }),
    updateShiftStatus: builder.mutation<Shift, StatusPayload<Shift["status"]>>({
      query: ({ id, status }) => ({
        url: `/shifts/${id}/status`,
        method: "PUT",
        body: { status }
      }),
      invalidatesTags: ["Shifts"]
    })
  })
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useGetDepartmentsQuery,
  useGetWardsQuery,
  useGetUsersQuery,
  useGetTeamsQuery,
  useGetPatientsQuery,
  useGetPatientByIdQuery,
  useGetCareTasksQuery,
  useGetEscalationsQuery,
  useGetShiftsQuery,
  useGetShiftSchedulesQuery,
  useGetOnCallRotationsQuery,
  useGetClinicalNotesByPatientQuery,
  useGetRoundsQuery,
  useCreateClinicalNoteMutation,
  useRecordVitalsMutation,
  useCreateEscalationMutation,
  useUpdateCareTaskStatusMutation,
  useAcknowledgeEscalationMutation,
  useResolveEscalationMutation,
  useAssignShiftMutation,
  useUpdateShiftStatusMutation
} = api;
