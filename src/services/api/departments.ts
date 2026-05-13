import { api } from "./baseApi";
import type { Department } from "@/types/domain";

export type CreateDepartmentRequest = { name: string; headOfDepartmentId?: string };
export type UpdateDepartmentRequest = { name?: string; headOfDepartmentId?: string };

const deptApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<Department[], void>({
      query: () => "/departments",
      providesTags: ["Departments"]
    }),
    getDepartmentById: builder.query<Department, string>({
      query: (id) => `/departments/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Departments", id }]
    }),
    createDepartment: builder.mutation<Department, CreateDepartmentRequest>({
      query: (body) => ({ url: "/departments", method: "POST", body }),
      invalidatesTags: ["Departments"]
    }),
    updateDepartment: builder.mutation<Department, { id: string } & UpdateDepartmentRequest>({
      query: ({ id, ...body }) => ({ url: `/departments/${id}`, method: "PUT", body }),
      invalidatesTags: ["Departments"]
    }),
    deleteDepartment: builder.mutation<void, string>({
      query: (id) => ({ url: `/departments/${id}`, method: "DELETE" }),
      invalidatesTags: ["Departments"]
    })
  })
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation
} = deptApi;
