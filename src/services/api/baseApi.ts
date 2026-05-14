import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../baseQuery";

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: [
    "Users",
    "Departments",
    "Wards",
    "Teams",
    "Patients",
    "Tasks",
    "Escalations",
    "Shifts",
    "ShiftSchedules",
    "OnCallRotations",
    "ClinicalNotes",
    "Rounds",
    "Vitals",
    "NextOfKin",
    "Handovers",
    "Invites",
    "Hospital",
    "SystemConfig",
    "Dashboard",
    "Me",
    "Notifications",
    "Reports",
    "Search"
  ],
  endpoints: () => ({})
});
