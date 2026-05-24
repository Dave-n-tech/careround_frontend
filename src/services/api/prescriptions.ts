import { api } from "./baseApi";
import type { MedicationTask, AdministrationSlot } from "@/types/domain";

export interface PrescriptionEnriched {
  id: string;
  patientId: string;
  hospitalId: string;
  clinicalNoteId?: string;
  drugName: string;
  dose: string;
  route: string;
  frequencyString: string;
  frequencyHours: number;
  totalDoses: number;
  startTime: string;
  administrationTimes: string[];
  confirmedById: string;
  confirmedAt: string;
  confirmedByName?: string;
  status: "ACTIVE" | "DISCONTINUED" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
}

// Full enriched chart entry returned by GET /patients/{patientId}/medication-chart
export interface MedicationChartResponse {
  id: string;
  patientId: string;
  hospitalId: string;
  prescriptionId: string;
  status: "ACTIVE" | "COMPLETED" | "DISCONTINUED";
  nurseNotes?: string;
  createdAt: string;
  updatedAt: string;
  // Enriched fields
  drugName: string;
  dose: string;
  route: string;
  frequencyString: string;
  frequencyHours: number;
  totalDoses: number;
  startTime: string;
  confirmedById?: string;
  confirmedByName?: string;
  administrationSlots: AdministrationSlot[];
}

export interface MedicationTaskEnriched extends MedicationTask {
  patientFirstName: string;
  patientLastName: string;
  bedNumber?: string;
  wardName?: string;
  drugName: string;
  dose: string;
  route: string;
  minutesOverdue?: number;
  completedByName?: string;
}

// Grouped response shape returned by GET /medication-tasks
export interface TaskListResponse {
  overdue: MedicationTaskEnriched[];
  dueSoon: MedicationTaskEnriched[];
  upcoming: MedicationTaskEnriched[];
}

// Request for POST /medication-charts/{patientId}/manual
export interface AddManualMedicationRequest {
  patientId: string;
  drugName: string;
  dose: string;
  route: string;
  frequencyString: string;
  frequencyHours: number;
  totalDoses: number;
  startTime: string;
  administrationTimes: string[];
}

export interface UpdatePrescriptionRequest {
  prescriptionId: string;
  patientId: string;
  drugName?: string;
  dose?: string;
  route?: string;
  frequencyString?: string;
  frequencyHours?: number;
  totalDoses?: number;
  startTime?: string;
  administrationTimes?: string[];
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
    getMedicationChart: build.query<MedicationChartResponse[], string>({
      query: (patientId) => `/patients/${patientId}/medication-chart`,
      providesTags: (_r, _e, id) => [{ type: "MedicationChart", id }],
    }),
    addManualMedication: build.mutation<MedicationChartResponse, AddManualMedicationRequest>({
      query: ({ patientId, ...body }) => ({
        url: `/medication-charts/${patientId}/manual`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Prescriptions", id: arg.patientId },
        { type: "MedicationChart", id: arg.patientId },
        "MedicationTasks",
      ],
    }),
    updatePrescription: build.mutation<PrescriptionEnriched, UpdatePrescriptionRequest>({
      query: ({ prescriptionId, patientId: _pid, ...body }) => ({
        url: `/prescriptions/${prescriptionId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Prescriptions", id: arg.patientId },
        { type: "MedicationChart", id: arg.patientId },
      ],
    }),
    discontinuePrescription: build.mutation<PrescriptionEnriched, { prescriptionId: string; patientId: string }>({
      query: ({ prescriptionId }) => ({
        url: `/prescriptions/${prescriptionId}/discontinue`,
        method: "PUT",
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Prescriptions", id: arg.patientId },
        { type: "MedicationChart", id: arg.patientId },
      ],
    }),
    getMedicationTasks: build.query<TaskListResponse, { wardId?: string }>({
      query: (params) => ({ url: "/medication-tasks", params }),
      providesTags: ["MedicationTasks"],
    }),
    completeTask: build.mutation<void, CompleteTaskRequest>({
      query: ({ taskId, ...body }) => ({
        url: `/medication-tasks/${taskId}/complete`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["MedicationTasks", "Prescriptions", "MedicationChart", "Patients"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPatientPrescriptionsQuery,
  useGetMedicationChartQuery,
  useAddManualMedicationMutation,
  useUpdatePrescriptionMutation,
  useDiscontinuePrescriptionMutation,
  useGetMedicationTasksQuery,
  useCompleteTaskMutation,
} = prescriptionsApi;
