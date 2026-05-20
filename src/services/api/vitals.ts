import { api } from "./baseApi";
import type { PatientVitals } from "@/types/domain";

export interface PatientVitalsEnriched extends PatientVitals {
  recordedByName: string;
}

export interface RecordVitalsRequest {
  patientId: string;
  pulse?: number;
  systolicBp?: number;
  diastolicBp?: number;
  respiratoryRate?: number;
  temperature?: number;
  spo2?: number;
}

export const vitalsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPatientVitals: build.query<PatientVitalsEnriched[], string>({
      query: (patientId) => `/patients/${patientId}/vitals`,
      providesTags: (_r, _e, id) => [{ type: "Vitals", id }],
    }),
    recordVitals: build.mutation<PatientVitalsEnriched, RecordVitalsRequest>({
      query: (body) => ({ url: `/patients/${body.patientId}/vitals`, method: "POST", body }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Vitals", id: arg.patientId }, "Patients"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetPatientVitalsQuery, useRecordVitalsMutation } = vitalsApi;
