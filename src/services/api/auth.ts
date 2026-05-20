import { api } from "./baseApi";
import type { JwtResponse, User } from "@/types/domain";

interface LoginRequest {
  hospitalCode: string;
  email: string;
  password: string;
}

interface RefreshRequest {
  refreshToken: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<JwtResponse, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    refresh: build.mutation<JwtResponse, RefreshRequest>({
      query: (body) => ({ url: "/auth/refresh", method: "POST", body }),
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
    changePassword: build.mutation<void, ChangePasswordRequest>({
      query: (body) => ({ url: "/auth/change-password", method: "POST", body }),
    }),
    getMe: build.query<User, void>({
      query: () => "/users/me",
      providesTags: ["Me"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useChangePasswordMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
} = authApi;
