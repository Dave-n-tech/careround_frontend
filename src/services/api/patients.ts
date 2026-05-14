import { api } from "./baseApi";
import type { Patient, Vitals, NextOfKin } from "@/types/domain";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

export type AdmitPatientRequest = {
  wardId: string;
  medicalTeamId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  hospitalNumber: string;
  admissionType: string;
  primaryDiagnosis: string;
  specialtyRequired: string;
  admittingConsultantId?: string;
  estimatedDischargeDate?: string;
};

export type RecordVitalsRequest = {
  patientId: string;
  heartRate: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  systolicBP: number;
  temperature: number;
  consciousnessLevel: string;
  note?: string;
};

export type UpdatePatientStatusRequest = { status: string };
export type MarkDischargeReadyRequest = { estimatedDischargeDate?: string };

export type AddNextOfKinRequest = {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  preferredContactMethod: string;
  isEmergencyContact?: boolean;
  notificationConsent?: boolean;
};

export type UpdateNextOfKinRequest = {
  name?: string;
  relationship?: string;
  phone?: string;
  email?: string;
  preferredContactMethod?: string;
  isEmergencyContact?: boolean;
  notificationConsent?: boolean;
};

export type UpdateNotificationConsentRequest = { consent: boolean };

const patientsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPatientById: builder.query<Patient, string>({
      query: (id) => `/patients/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Patients", id }]
    }),
    getPatientsByWard: builder.query<Patient[], string>({
      query: (wardId) => `/patients/ward/${wardId}`,
      providesTags: ["Patients"]
    }),
    getPatientsByWardIds: builder.query<Patient[], string[]>({
      async queryFn(wardIds, _api, _extraOptions, fetchWithBQ) {
        const uniqueWardIds = Array.from(new Set(wardIds.filter(Boolean)));
        if (uniqueWardIds.length === 0) return { data: [] };

        const results = await Promise.all(
          uniqueWardIds.map((wardId) => fetchWithBQ(`/patients/ward/${wardId}`))
        );
        const failed = results.find((result) => result.error);
        if (failed?.error) return { error: failed.error as FetchBaseQueryError };

        const byId = new Map<string, Patient>();
        results.forEach((result) => {
          ((result.data as Patient[] | undefined) || []).forEach((patient) => {
            byId.set(patient.id, patient);
          });
        });

        return { data: Array.from(byId.values()) };
      },
      providesTags: ["Patients"]
    }),
    searchPatients: builder.query<Patient[], string>({
      query: (q) => `/patients/search?q=${encodeURIComponent(q)}`,
      providesTags: ["Patients"]
    }),
    admitPatient: builder.mutation<Patient, AdmitPatientRequest>({
      query: (body) => ({ url: "/patients", method: "POST", body }),
      invalidatesTags: ["Patients"]
    }),
    updatePatientStatus: builder.mutation<Patient, { patientId: string } & UpdatePatientStatusRequest>({
      query: ({ patientId, ...body }) => ({ url: `/patients/${patientId}/status`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { patientId }) => ["Patients", { type: "Patients", id: patientId }]
    }),
    markDischargeReady: builder.mutation<Patient, { patientId: string } & MarkDischargeReadyRequest>({
      query: ({ patientId, ...body }) => ({ url: `/patients/${patientId}/discharge-ready`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { patientId }) => ["Patients", { type: "Patients", id: patientId }]
    }),
    // Vitals
    recordVitals: builder.mutation<Vitals, RecordVitalsRequest>({
      query: ({ patientId, ...body }) => ({ url: `/patients/${patientId}/vitals`, method: "POST", body }),
      invalidatesTags: (_r, _e, { patientId }) => ["Patients", "Vitals", "Escalations", { type: "Patients", id: patientId }]
    }),
    getVitalsHistory: builder.query<Vitals[], { patientId: string; limit?: number }>({
      query: ({ patientId, limit }) => `/patients/${patientId}/vitals${limit ? `?limit=${limit}` : ""}`,
      providesTags: ["Vitals"]
    }),
    getLatestVitals: builder.query<Vitals, string>({
      query: (patientId) => `/patients/${patientId}/vitals/latest`,
      providesTags: ["Vitals"]
    }),
    // Next of Kin
    getPatientNextOfKin: builder.query<NextOfKin[], string>({
      query: (patientId) => `/patients/${patientId}/next-of-kin`,
      providesTags: ["NextOfKin"]
    }),
    addNextOfKin: builder.mutation<NextOfKin, { patientId: string } & AddNextOfKinRequest>({
      query: ({ patientId, ...body }) => ({ url: `/patients/${patientId}/next-of-kin`, method: "POST", body }),
      invalidatesTags: ["NextOfKin"]
    }),
    updateNextOfKin: builder.mutation<NextOfKin, { patientId: string; nokId: string } & UpdateNextOfKinRequest>({
      query: ({ patientId, nokId, ...body }) => ({ url: `/patients/${patientId}/next-of-kin/${nokId}`, method: "PUT", body }),
      invalidatesTags: ["NextOfKin"]
    }),
    removeNextOfKin: builder.mutation<void, { patientId: string; nokId: string }>({
      query: ({ patientId, nokId }) => ({ url: `/patients/${patientId}/next-of-kin/${nokId}`, method: "DELETE" }),
      invalidatesTags: ["NextOfKin"]
    }),
    updateNotificationConsent: builder.mutation<NextOfKin, { patientId: string; nokId: string } & UpdateNotificationConsentRequest>({
      query: ({ patientId, nokId, ...body }) => ({ url: `/patients/${patientId}/next-of-kin/${nokId}/consent`, method: "PATCH", body }),
      invalidatesTags: ["NextOfKin"]
    })
  })
});

export const {
  useGetPatientByIdQuery,
  useGetPatientsByWardQuery,
  useGetPatientsByWardIdsQuery,
  useSearchPatientsQuery,
  useLazySearchPatientsQuery,
  useAdmitPatientMutation,
  useUpdatePatientStatusMutation,
  useMarkDischargeReadyMutation,
  useRecordVitalsMutation,
  useGetVitalsHistoryQuery,
  useGetLatestVitalsQuery,
  useGetPatientNextOfKinQuery,
  useAddNextOfKinMutation,
  useUpdateNextOfKinMutation,
  useRemoveNextOfKinMutation,
  useUpdateNotificationConsentMutation
} = patientsApi;
