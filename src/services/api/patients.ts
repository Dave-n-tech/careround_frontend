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

export const patientsApi = api.injectEndpoints({
  endpoints: (build) => ({
    // Single unified endpoint — replaces both getAllPatients and getPatients
    getPatients: build.query<Patient[], { wardId?: string; status?: string } | void>({
      query: (params) => ({
        url: "/patients",
        params: params
          ? Object.fromEntries(
              Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
            )
          : undefined,
      }),
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
  }),
  overrideExisting: false,
});

export const {
  useGetPatientsQuery,
  useGetPatientQuery,
  useRegisterPatientMutation,
  useUpdatePatientStatusMutation,
} = patientsApi;
