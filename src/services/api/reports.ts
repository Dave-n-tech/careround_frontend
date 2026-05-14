import { api } from "./baseApi";
import type { RoundStatus, RoundType } from "@/types/domain";

export type ReportQuery = {
  wardId?: string;
  from?: string;
  to?: string;
};

export type ChartSeries = {
  labels: string[];
  values: number[];
};

export type RoundHistoryItem = {
  id: string;
  wardId: string;
  roundType: RoundType;
  status: RoundStatus;
  scheduledTime?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMinutes?: number | null;
  patientCount: number;
  leadDoctorId?: string | null;
};

function reportParams(params: ReportQuery) {
  const q = new URLSearchParams();
  if (params.wardId) q.set("wardId", params.wardId);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  const query = q.toString();
  return query ? `?${query}` : "";
}

const reportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTaskCompletionReport: builder.query<ChartSeries, ReportQuery>({
      query: (params) => `/reports/task-completion${reportParams(params)}`,
      providesTags: ["Reports"]
    }),
    getOverdueTasksReport: builder.query<ChartSeries, ReportQuery>({
      query: (params) => `/reports/overdue-tasks${reportParams(params)}`,
      providesTags: ["Reports"]
    }),
    getPatientFlowReport: builder.query<ChartSeries, ReportQuery>({
      query: (params) => `/reports/patient-flow${reportParams(params)}`,
      providesTags: ["Reports"]
    }),
    getRoundHistoryReport: builder.query<RoundHistoryItem[], ReportQuery>({
      query: (params) => `/reports/round-history${reportParams(params)}`,
      providesTags: ["Reports"]
    }),
    getWardSummaryReport: builder.query<Record<string, unknown>, ReportQuery>({
      query: (params) => `/reports/ward-summary${reportParams(params)}`,
      providesTags: ["Reports"]
    })
  })
});

export const {
  useGetTaskCompletionReportQuery,
  useGetOverdueTasksReportQuery,
  useGetPatientFlowReportQuery,
  useGetRoundHistoryReportQuery,
  useGetWardSummaryReportQuery
} = reportsApi;
