import { api } from "./baseApi";
import type { JwtResponse, User } from "@/types/domain";

export type LoginRequest = { hospitalId: string; email: string; password: string };
export type LoginResponse = JwtResponse;
export type RefreshRequest = { refreshToken: string };
export type ChangePasswordRequest = { currentPassword: string; newPassword: string };
export type ActivateAccountRequest = { token: string; password: string };

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<JwtResponse, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: ["Me"]
    }),
    logout: builder.mutation<void, RefreshRequest>({
      query: (body) => ({ url: "/auth/logout", method: "POST", body }),
      invalidatesTags: ["Me"]
    }),
    refreshToken: builder.mutation<JwtResponse, RefreshRequest>({
      query: (body) => ({ url: "/auth/refresh", method: "POST", body })
    }),
    changePassword: builder.mutation<void, ChangePasswordRequest>({
      query: (body) => ({ url: "/auth/change-password", method: "POST", body })
    }),
    activateAccount: builder.mutation<void, ActivateAccountRequest>({
      query: (body) => ({ url: "/auth/activate-account", method: "POST", body })
    }),
    getMe: builder.query<User, void>({
      query: () => "/users/me",
      providesTags: ["Me"]
    })
  })
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useChangePasswordMutation,
  useActivateAccountMutation,
  useGetMeQuery,
  useLazyGetMeQuery
} = authApi;
