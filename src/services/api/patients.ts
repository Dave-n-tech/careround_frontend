import { api } from "./baseApi";
import type { Patient, AdmissionType, PatientGender } from "@/types/domain";

export interface RegisterPatientRequest {
  wardId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: PatientGender;
  hospitalNumber: string;
  phoneNumber?: string;
  address?: string;
  previousConditions?: string;
  currentMedications?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  admissionType: AdmissionType;
  primaryDiagnosis?: string;
  bedNumber?: string;
  estimatedDischargeDate?: string;
}

export interface UpdatePatientRequest {
  wardId?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: PatientGender;
  phoneNumber?: string;
  address?: string;
  previousConditions?: string;
  currentMedications?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  admissionType: AdmissionType;
  bedNumber?: string;
}

export const patientsApi = api.injectEndpoints({
  endpoints: (build) => ({
    // GET /patients — returns all hospital patients, optionally filtered by status (ADMIN only)
    getAllPatients: build.query<Patient[], { status?: "ADMITTED" | "DISCHARGED" } | void>({
      query: (arg) => ({
        url: "/patients",
        params: arg && (arg as { status?: string }).status ? { status: (arg as { status?: string }).status } : undefined,
      }),
      providesTags: ["Patients"],
    }),
    // GET /patients/ward/{wardId} — returns admitted patients for a ward
    getPatients: build.query<Patient[], { wardId: string }>({
      query: ({ wardId }) => `/patients/ward/${wardId}`,
      providesTags: ["Patients"],
    }),
    getPatient: build.query<Patient, string>({
      query: (id) => `/patients/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Patients", id }],
    }),
    registerPatient: build.mutation<Patient, RegisterPatientRequest>({
      query: (body) => ({ url: "/patients", method: "POST", body }),
      invalidatesTags: ["Patients"],
    }),
    updatePatientStatus: build.mutation<Patient, { patientId: string; status: "ADMITTED" | "DISCHARGED" }>({
      query: ({ patientId, status }) => ({
        url: `/patients/${patientId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Patients"],
    }),
    updatePatient: build.mutation<Patient, { patientId: string } & UpdatePatientRequest>({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Patients"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllPatientsQuery,
  useGetPatientsQuery,
  useGetPatientQuery,
  useRegisterPatientMutation,
  useUpdatePatientStatusMutation,
  useUpdatePatientMutation,
} = patientsApi;
