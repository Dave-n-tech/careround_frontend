import { api } from "./baseApi";
import type { Ward } from "@/types/domain";

interface CreateWardRequest {
  name: string;
  specialty?: string;
  totalBeds: number;
}

interface UpdateWardRequest extends Partial<CreateWardRequest> {
  isActive?: boolean;
}

export const wardsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getWards: build.query<Ward[], void>({
      query: () => "/wards",
      providesTags: ["Wards"],
    }),
    createWard: build.mutation<Ward, CreateWardRequest>({
      query: (body) => ({ url: "/wards", method: "POST", body }),
      invalidatesTags: ["Wards"],
    }),
    updateWard: build.mutation<Ward, { id: string } & UpdateWardRequest>({
      query: ({ id, ...body }) => ({ url: `/wards/${id}`, method: "PUT", body }),
      invalidatesTags: ["Wards"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetWardsQuery, useCreateWardMutation, useUpdateWardMutation } = wardsApi;
