import { api } from "./baseApi";
import type { Hospital, SystemConfig } from "@/types/domain";

export interface UpdateSystemConfigRequest {
  taskOverdueReminderMinutes: number;
  taskEscalationMinutes: number;
  pushNotificationsEnabled?: boolean;
}

export const hospitalApi = api.injectEndpoints({
  endpoints: (build) => ({
    getHospital: build.query<Hospital, void>({
      query: () => "/hospitals/me",
      providesTags: ["Hospital"],
    }),
    getSystemConfig: build.query<SystemConfig, void>({
      query: () => "/hospitals/me/config",
      providesTags: ["SystemConfig"],
    }),
    updateSystemConfig: build.mutation<SystemConfig, UpdateSystemConfigRequest>({
      query: (body) => ({ url: "/hospitals/me/config", method: "PUT", body }),
      invalidatesTags: ["SystemConfig"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetHospitalQuery,
  useGetSystemConfigQuery,
  useUpdateSystemConfigMutation,
} = hospitalApi;
