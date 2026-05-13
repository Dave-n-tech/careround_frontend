import { api } from "./baseApi";
import type { User } from "@/types/domain";

export type CreateUserRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  departmentId?: string;
};

const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => "/users",
      providesTags: ["Users"]
    }),
    getUserById: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Users", id }]
    }),
    createUser: builder.mutation<User, CreateUserRequest>({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: ["Users"]
    }),
    deactivateUser: builder.mutation<void, string>({
      query: (id) => ({ url: `/users/${id}/deactivate`, method: "PUT" }),
      invalidatesTags: ["Users"]
    })
  })
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useDeactivateUserMutation
} = usersApi;
