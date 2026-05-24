import { api } from "./baseApi";
import type { SupervisorDashboardResponse } from "@/types/domain";

export const supervisorApi = api.injectEndpoints({
  endpoints: (build) => ({
    getSupervisorDashboard: build.query<SupervisorDashboardResponse, { wardId: string }>({
      query: ({ wardId }) => ({ url: "/supervisor/dashboard", params: { wardId } }),
      providesTags: ["SupervisorDashboard"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetSupervisorDashboardQuery } = supervisorApi;
