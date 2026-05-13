import { api } from "./baseApi";
import type { Hospital, SystemConfig } from "@/types/domain";

export type UpdateSystemConfigRequest = {
  newsAmberThreshold?: number;
  newsRedThreshold?: number;
  taskOverdueGraceMinutes?: number;
  roundNotificationsEnabled?: boolean;
  nokNotificationEnabled?: boolean;
};

const hospitalApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMyHospital: builder.query<Hospital, void>({
      query: () => "/hospitals/me",
      providesTags: ["Hospital"]
    }),
    getSystemConfig: builder.query<SystemConfig, void>({
      query: () => "/system-config",
      providesTags: ["SystemConfig"]
    }),
    updateSystemConfig: builder.mutation<SystemConfig, UpdateSystemConfigRequest>({
      query: (body) => ({ url: "/system-config", method: "PUT", body }),
      invalidatesTags: ["SystemConfig"]
    }),
    // Dashboards — all return Map<String, Object>
    getDashboardMe: builder.query<Record<string, unknown>, void>({
      query: () => "/dashboard/me",
      providesTags: ["Dashboard"]
    }),
    getAdminDashboard: builder.query<Record<string, unknown>, void>({
      query: () => "/dashboard/admin",
      providesTags: ["Dashboard"]
    }),
    getDoctorDashboard: builder.query<Record<string, unknown>, void>({
      query: () => "/dashboard/doctor",
      providesTags: ["Dashboard"]
    }),
    getConsultantDashboard: builder.query<Record<string, unknown>, void>({
      query: () => "/dashboard/consultant",
      providesTags: ["Dashboard"]
    }),
    getNurseDashboard: builder.query<Record<string, unknown>, void>({
      query: () => "/dashboard/nurse",
      providesTags: ["Dashboard"]
    }),
    getWardSupervisorDashboard: builder.query<Record<string, unknown>, void>({
      query: () => "/dashboard/ward-supervisor",
      providesTags: ["Dashboard"]
    })
  })
});

export const {
  useGetMyHospitalQuery,
  useGetSystemConfigQuery,
  useUpdateSystemConfigMutation,
  useGetDashboardMeQuery,
  useGetAdminDashboardQuery,
  useGetDoctorDashboardQuery,
  useGetConsultantDashboardQuery,
  useGetNurseDashboardQuery,
  useGetWardSupervisorDashboardQuery
} = hospitalApi;
