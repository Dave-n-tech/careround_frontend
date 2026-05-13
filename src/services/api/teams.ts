import { api } from "./baseApi";
import type { MedicalTeam, TeamInvite } from "@/types/domain";

export type CreateMedicalTeamRequest = { name: string; departmentId: string; consultantId?: string };
export type AssignWardRequest = { wardId: string };
export type SendInviteRequest = { invitedUserId: string };

const teamsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTeams: builder.query<MedicalTeam[], void>({
      query: () => "/teams",
      providesTags: ["Teams"]
    }),
    getTeamById: builder.query<MedicalTeam, string>({
      query: (id) => `/teams/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Teams", id }]
    }),
    createTeam: builder.mutation<MedicalTeam, CreateMedicalTeamRequest>({
      query: (body) => ({ url: "/teams", method: "POST", body }),
      invalidatesTags: ["Teams"]
    }),
    assignWardToTeam: builder.mutation<MedicalTeam, { teamId: string } & AssignWardRequest>({
      query: ({ teamId, ...body }) => ({ url: `/teams/${teamId}/wards`, method: "POST", body }),
      invalidatesTags: ["Teams"]
    }),
    removeWardFromTeam: builder.mutation<void, { teamId: string; wardId: string }>({
      query: ({ teamId, wardId }) => ({ url: `/teams/${teamId}/wards/${wardId}`, method: "DELETE" }),
      invalidatesTags: ["Teams"]
    }),
    sendTeamInvite: builder.mutation<TeamInvite, { teamId: string } & SendInviteRequest>({
      query: ({ teamId, ...body }) => ({ url: `/teams/${teamId}/invites`, method: "POST", body }),
      invalidatesTags: ["Teams", "Invites"]
    }),
    listPendingInvites: builder.query<TeamInvite[], void>({
      query: () => "/teams/invites/pending",
      providesTags: ["Invites"]
    }),
    acceptInvite: builder.mutation<void, string>({
      query: (inviteId) => ({ url: `/teams/invites/${inviteId}/accept`, method: "POST" }),
      invalidatesTags: ["Teams", "Invites"]
    }),
    declineInvite: builder.mutation<void, string>({
      query: (inviteId) => ({ url: `/teams/invites/${inviteId}/decline`, method: "POST" }),
      invalidatesTags: ["Invites"]
    }),
    removeTeamMember: builder.mutation<void, { teamId: string; userId: string }>({
      query: ({ teamId, userId }) => ({ url: `/teams/${teamId}/members/${userId}`, method: "DELETE" }),
      invalidatesTags: ["Teams"]
    })
  })
});

export const {
  useGetTeamsQuery,
  useGetTeamByIdQuery,
  useCreateTeamMutation,
  useAssignWardToTeamMutation,
  useRemoveWardFromTeamMutation,
  useSendTeamInviteMutation,
  useListPendingInvitesQuery,
  useAcceptInviteMutation,
  useDeclineInviteMutation,
  useRemoveTeamMemberMutation
} = teamsApi;
