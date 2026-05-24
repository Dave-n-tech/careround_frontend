import { api } from "./baseApi";
import type { Role, User } from "@/types/domain";

interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  password: string;
  wardId?: string;
}

interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: Role;
}

interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export const usersApi = api.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<User[], void>({
      query: () => "/users",
      providesTags: ["Users"],
    }),
    createUser: build.mutation<User, CreateUserRequest>({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: ["Users"],
    }),
    updateUser: build.mutation<void, { id: string } & UpdateUserRequest>({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: "PUT", body }),
      invalidatesTags: ["Users"],
    }),
    deactivateUser: build.mutation<void, string>({
      query: (id) => ({ url: `/users/${id}/deactivate`, method: "PUT" }),
      invalidatesTags: ["Users"],
    }),
    reactivateUser: build.mutation<void, string>({
      query: (id) => ({ url: `/users/${id}/reactivate`, method: "PUT" }),
      invalidatesTags: ["Users"],
    }),
    updateMe: build.mutation<void, UpdateProfileRequest>({
      query: (body) => ({ url: "/users/me", method: "PUT", body }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeactivateUserMutation,
  useReactivateUserMutation,
  useUpdateMeMutation,
} = usersApi;
