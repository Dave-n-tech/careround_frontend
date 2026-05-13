import { api } from "./baseApi";
import type { Ward } from "@/types/domain";

export type CreateWardRequest = { name: string; specialty?: string; totalBeds?: number; supervisorId?: string };
export type UpdateWardRequest = { name?: string; specialty?: string; totalBeds?: number; supervisorId?: string };

const wardsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWards: builder.query<Ward[], void>({
      query: () => "/wards",
      providesTags: ["Wards"]
    }),
    getWardById: builder.query<Ward, string>({
      query: (id) => `/wards/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Wards", id }]
    }),
    createWard: builder.mutation<Ward, CreateWardRequest>({
      query: (body) => ({ url: "/wards", method: "POST", body }),
      invalidatesTags: ["Wards"]
    }),
    updateWard: builder.mutation<Ward, { id: string } & UpdateWardRequest>({
      query: ({ id, ...body }) => ({ url: `/wards/${id}`, method: "PUT", body }),
      invalidatesTags: ["Wards"]
    }),
    deleteWard: builder.mutation<void, string>({
      query: (id) => ({ url: `/wards/${id}`, method: "DELETE" }),
      invalidatesTags: ["Wards"]
    })
  })
});

export const {
  useGetWardsQuery,
  useGetWardByIdQuery,
  useCreateWardMutation,
  useUpdateWardMutation,
  useDeleteWardMutation
} = wardsApi;
