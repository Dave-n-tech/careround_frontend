import { api } from "./baseApi";
import type { Shift, ShiftSchedule, OnCallRotation, Handover, PatientHandoverNote, ShiftStatus } from "@/types/domain";

// ─── Shifts ──────────────────────────────────────────────────────────────────

export type AssignStaffRequest = { leadDoctorId: string; nurseInChargeId: string };
export type GetShiftsRequest = { wardId: string; status?: ShiftStatus; from?: string; to?: string };

// ─── Shift Schedules ─────────────────────────────────────────────────────────

export type CreateShiftScheduleRequest = {
  wardId?: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string;
};

// ─── On-Call ─────────────────────────────────────────────────────────────────

export type CreateOnCallRotationRequest = {
  departmentId: string;
  wardId?: string;
  doctorId: string;
  role: string;
  startTime: string;
  endTime: string;
};

// ─── Handovers ───────────────────────────────────────────────────────────────

export type InitiateHandoverRequest = {
  wardId: string;
  outgoingShiftId: string;
  incomingShiftId: string;
  generalNotes?: string;
};

export type AddPatientHandoverNoteRequest = {
  patientId: string;
  statusSummary?: string;
  outstandingTaskIds?: string;
  urgencyFlag: boolean;
};

export type CompleteHandoverRequest = { generalNotes?: string };

const opsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Shifts
    getShifts: builder.query<Shift[], GetShiftsRequest>({
      query: ({ wardId, status, from, to }) => {
        const params = new URLSearchParams({ wardId });
        if (status) params.set("status", status);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        return `/shifts?${params.toString()}`;
      },
      providesTags: ["Shifts"]
    }),
    getCurrentShift: builder.query<Shift, string>({
      query: (wardId) => `/shifts/current/${wardId}`,
      providesTags: ["Shifts"]
    }),
    assignShift: builder.mutation<Shift, { id: string } & AssignStaffRequest>({
      query: ({ id, ...body }) => ({ url: `/shifts/${id}/assign`, method: "PUT", body }),
      invalidatesTags: ["Shifts"]
    }),

    // Shift Schedules
    getShiftSchedules: builder.query<ShiftSchedule[], void>({
      query: () => "/shift-schedules",
      providesTags: ["ShiftSchedules"]
    }),
    getShiftScheduleById: builder.query<ShiftSchedule, string>({
      query: (id) => `/shift-schedules/${id}`,
      providesTags: (_r, _e, id) => [{ type: "ShiftSchedules", id }]
    }),
    createShiftSchedule: builder.mutation<ShiftSchedule, CreateShiftScheduleRequest>({
      query: (body) => ({ url: "/shift-schedules", method: "POST", body }),
      invalidatesTags: ["ShiftSchedules"]
    }),
    deactivateShiftSchedule: builder.mutation<void, string>({
      query: (id) => ({ url: `/shift-schedules/${id}/deactivate`, method: "PUT" }),
      invalidatesTags: ["ShiftSchedules"]
    }),

    // On-Call Rotations
    getOnCallRotations: builder.query<OnCallRotation[], void>({
      query: () => "/oncall",
      providesTags: ["OnCallRotations"]
    }),
    getOnCallRotationById: builder.query<OnCallRotation, string>({
      query: (id) => `/oncall/${id}`,
      providesTags: (_r, _e, id) => [{ type: "OnCallRotations", id }]
    }),
    getCurrentOnCall: builder.query<OnCallRotation, { departmentId?: string; wardId?: string; role: string }>({
      query: ({ departmentId, wardId, role }) => {
        const params = new URLSearchParams({ role });
        if (departmentId) params.set("departmentId", departmentId);
        if (wardId) params.set("wardId", wardId);
        return `/oncall/current?${params.toString()}`;
      },
      providesTags: ["OnCallRotations"]
    }),
    createOnCallRotation: builder.mutation<OnCallRotation, CreateOnCallRotationRequest>({
      query: (body) => ({ url: "/oncall", method: "POST", body }),
      invalidatesTags: ["OnCallRotations"]
    }),
    deleteOnCallRotation: builder.mutation<void, string>({
      query: (id) => ({ url: `/oncall/${id}`, method: "DELETE" }),
      invalidatesTags: ["OnCallRotations"]
    }),

    // Handovers
    getHandoversByWard: builder.query<Handover[], string>({
      query: (wardId) => `/handovers/ward/${wardId}`,
      providesTags: ["Handovers"]
    }),
    initiateHandover: builder.mutation<Handover, InitiateHandoverRequest>({
      query: (body) => ({ url: "/handovers", method: "POST", body }),
      invalidatesTags: ["Handovers"]
    }),
    getHandoverNotes: builder.query<PatientHandoverNote[], string>({
      query: (handoverId) => `/handovers/${handoverId}/patient-notes`,
      providesTags: ["Handovers"]
    }),
    addPatientHandoverNote: builder.mutation<PatientHandoverNote, { handoverId: string } & AddPatientHandoverNoteRequest>({
      query: ({ handoverId, ...body }) => ({ url: `/handovers/${handoverId}/patient-notes`, method: "POST", body }),
      invalidatesTags: ["Handovers"]
    }),
    completeHandover: builder.mutation<Handover, { handoverId: string } & CompleteHandoverRequest>({
      query: ({ handoverId, ...body }) => ({ url: `/handovers/${handoverId}/complete`, method: "POST", body }),
      invalidatesTags: ["Handovers", "Shifts"]
    })
  })
});

export const {
  useGetShiftsQuery,
  useGetCurrentShiftQuery,
  useAssignShiftMutation,
  useGetShiftSchedulesQuery,
  useGetShiftScheduleByIdQuery,
  useCreateShiftScheduleMutation,
  useDeactivateShiftScheduleMutation,
  useGetOnCallRotationsQuery,
  useGetOnCallRotationByIdQuery,
  useGetCurrentOnCallQuery,
  useCreateOnCallRotationMutation,
  useDeleteOnCallRotationMutation,
  useGetHandoversByWardQuery,
  useInitiateHandoverMutation,
  useGetHandoverNotesQuery,
  useAddPatientHandoverNoteMutation,
  useCompleteHandoverMutation
} = opsApi;
