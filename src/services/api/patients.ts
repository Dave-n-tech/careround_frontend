import { api } from "./baseApi";
import type { Patient, AdmissionType, PatientGender } from "@/types/domain";

export interface RegisterPatientRequest {
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
  wardId: string;
  bedNumber?: string;
  admissionType: AdmissionType;
  admissionDate: string;
}

export type UpdatePatientRequest = Partial<Omit<RegisterPatientRequest, "hospitalNumber">> & { id: string };

export const patientsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPatients: build.query<Patient[], { wardId?: string; status?: string }>({
      query: (params) => ({
        url: "/patients",
        params,
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
    updatePatient: build.mutation<Patient, UpdatePatientRequest>({
      query: ({ id, ...body }) => ({ url: `/patients/${id}`, method: "PUT", body }),
      invalidatesTags: ["Patients"],
    }),
    assignBed: build.mutation<Patient, { id: string; wardId: string; bedNumber?: string }>({
      query: ({ id, ...body }) => ({ url: `/patients/${id}/assign-bed`, method: "PUT", body }),
      invalidatesTags: ["Patients"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPatientsQuery,
  useGetPatientQuery,
  useRegisterPatientMutation,
  useUpdatePatientMutation,
  useAssignBedMutation,
} = patientsApi;
