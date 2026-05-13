import { api } from "./baseApi";
import type { JwtResponse, PlatformLoginResponse, User } from "@/types/domain";

export type LoginRequest = { hospitalId: string; email: string; password: string };
export type LoginResponse = JwtResponse;
export type PlatformLoginRequest = { email: string; password: string };
export type RefreshRequest = { refreshToken: string };
export type ChangePasswordRequest = { currentPassword: string; newPassword: string };
export type ActivateAccountRequest = { token: string; password: string };
export type ForgotPasswordRequest = { hospitalId: string; email: string };
export type ForgotPasswordResponse = { resetToken: string; expiresAt: string };
export type ResetPasswordRequest = { token: string; newPassword: string };

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<JwtResponse, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: ["Me"]
    }),
    platformLogin: builder.mutation<PlatformLoginResponse, PlatformLoginRequest>({
      query: (body) => ({ url: "/platform/auth/login", method: "POST", body })
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
    forgotPassword: builder.mutation<ForgotPasswordResponse, ForgotPasswordRequest>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body })
    }),
    resetPassword: builder.mutation<void, ResetPasswordRequest>({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body })
    }),
    getMe: builder.query<User, void>({
      query: () => "/users/me",
      providesTags: ["Me"]
    })
  })
});

export const {
  useLoginMutation,
  usePlatformLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useChangePasswordMutation,
  useActivateAccountMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetMeQuery,
  useLazyGetMeQuery
} = authApi;
