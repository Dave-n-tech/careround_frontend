import { api } from "./baseApi";
import type { Round, PatientRoundReview } from "@/types/domain";

export type CreateRoundRequest = {
  wardId: string;
  medicalTeamId: string;
  roundType: string;
  leadDoctorId: string;
  scheduledTime?: string;
  teamMembers?: string;
};

export type ReviewPatientRequest = {
  clinicalStatus: string;
  wasExamined: boolean;
  managementPlan?: string;
  dischargeAssessment: string;
  notifiedNextOfKin: boolean;
};

const roundsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRounds: builder.query<Round[], { wardId: string; teamId: string }>({
      query: ({ wardId, teamId }) => `/rounds?wardId=${wardId}&teamId=${teamId}`,
      providesTags: ["Rounds"]
    }),
    createRound: builder.mutation<Round, CreateRoundRequest>({
      query: (body) => ({ url: "/rounds", method: "POST", body }),
      invalidatesTags: ["Rounds"]
    }),
    startRound: builder.mutation<Round, string>({
      query: (roundId) => ({ url: `/rounds/${roundId}/start`, method: "POST" }),
      invalidatesTags: ["Rounds"]
    }),
    completeRound: builder.mutation<Round, string>({
      query: (roundId) => ({ url: `/rounds/${roundId}/complete`, method: "POST" }),
      invalidatesTags: ["Rounds"]
    }),
    getRoundReviews: builder.query<PatientRoundReview[], string>({
      query: (roundId) => `/rounds/${roundId}/reviews`
    }),
    reviewPatient: builder.mutation<PatientRoundReview, { roundId: string; patientId: string } & ReviewPatientRequest>({
      query: ({ roundId, patientId, ...body }) => ({
        url: `/rounds/${roundId}/patients/${patientId}`,
        method: "PATCH",
        body
      }),
      invalidatesTags: ["Rounds", "Patients"]
    })
  })
});

export const {
  useGetRoundsQuery,
  useCreateRoundMutation,
  useStartRoundMutation,
  useCompleteRoundMutation,
  useGetRoundReviewsQuery,
  useReviewPatientMutation
} = roundsApi;
