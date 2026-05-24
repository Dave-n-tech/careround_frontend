import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/services/baseQuery";

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: [
    "Me",
    "Users",
    "Hospital",
    "SystemConfig",
    "Wards",
    "Patients",
    "Vitals",
    "ClinicalNotes",
    "Prescriptions",
    "MedicationChart",
    "MedicationTasks",
    "HandoverNotes",
    "SupervisorDashboard",
  ],
  endpoints: () => ({}),
});
