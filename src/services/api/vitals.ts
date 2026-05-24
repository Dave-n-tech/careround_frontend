import { api } from "./baseApi";
import type { PatientVitals } from "@/types/domain";

export interface PatientVitalsEnriched extends PatientVitals {
  recordedByName: string;
}

export interface RecordVitalsRequest {
  patientId: string;
  pulse: number;           // required, 20–300
  systolicBp: number;      // required, 50–300
  diastolicBp?: number;    // optional, 20–200
  respiratoryRate: number; // required, 1–70
  temperature: number;     // required, 25–45
  spo2: number;            // required, 50–100
}

export const vitalsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPatientVitals: build.query<PatientVitalsEnriched[], string>({
      query: (patientId) => `/patients/${patientId}/vitals`,
      providesTags: (_r, _e, id) => [{ type: "Vitals", id }],
    }),
    recordVitals: build.mutation<PatientVitalsEnriched, RecordVitalsRequest>({
      query: ({ patientId, ...body }) => ({ url: `/patients/${patientId}/vitals`, method: "POST", body }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Vitals", id: arg.patientId }, "Patients"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetPatientVitalsQuery, useRecordVitalsMutation } = vitalsApi;
