import { api } from "./baseApi";
import type { Prescription, MedicationTask } from "@/types/domain";

export interface PrescriptionEnriched extends Prescription {
  confirmedByName: string;
}

export interface MedicationTaskEnriched extends MedicationTask {
  patientName: string;
  bedNumber?: string;
  wardName?: string;
  drugName: string;
  dose: string;
  route: string;
  minutesOverdue?: number;
}

export interface AddPrescriptionRequest {
  patientId: string;
  drugName: string;
  dose: string;
  route: string;
  frequencyHours: number;
  totalDoses: number;
  startTime: string;
}

export interface CompleteTaskRequest {
  taskId: string;
  actualDoseGiven?: string;
}

export const prescriptionsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPatientPrescriptions: build.query<PrescriptionEnriched[], string>({
      query: (patientId) => `/patients/${patientId}/prescriptions`,
      providesTags: (_r, _e, id) => [{ type: "Prescriptions", id }],
    }),
    addPrescription: build.mutation<PrescriptionEnriched, AddPrescriptionRequest>({
      query: ({ patientId, ...body }) => ({
        url: `/patients/${patientId}/prescriptions`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Prescriptions", id: arg.patientId },
        "MedicationTasks",
      ],
    }),
    discontinuePrescription: build.mutation<PrescriptionEnriched, { prescriptionId: string; patientId: string }>({
      query: ({ prescriptionId }) => ({
        url: `/prescriptions/${prescriptionId}/discontinue`,
        method: "PUT",
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Prescriptions", id: arg.patientId }],
    }),
    getMedicationTasks: build.query<MedicationTaskEnriched[], { wardId?: string; nurseId?: string }>({
      query: (params) => ({ url: "/medication-tasks", params }),
      providesTags: ["MedicationTasks"],
    }),
    completeTask: build.mutation<MedicationTaskEnriched, CompleteTaskRequest>({
      query: ({ taskId, ...body }) => ({
        url: `/medication-tasks/${taskId}/complete`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["MedicationTasks", "Prescriptions", "Patients"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPatientPrescriptionsQuery,
  useAddPrescriptionMutation,
  useDiscontinuePrescriptionMutation,
  useGetMedicationTasksQuery,
  useCompleteTaskMutation,
} = prescriptionsApi;
