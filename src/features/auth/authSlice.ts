import { createSlice } from "@reduxjs/toolkit";
import type { Role, User } from "@/types/domain";
import { authApi } from "@/services/api/auth";

export type AuthStatus = "idle" | "loading" | "authenticated" | "error";

type AuthState = {
  status: AuthStatus;
  user: User | null;
  role: Role | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
};

const persistedAccessToken = localStorage.getItem("cr_access_token");
const persistedRole = localStorage.getItem("cr_role") as Role | null;
const persistedUser: User | null = (() => {
  try {
    return JSON.parse(localStorage.getItem("cr_user") || "null");
  } catch {
    return null;
  }
})();

// If we have both a token and a cached user, start as authenticated immediately
// so page reloads and tab switches never trigger a logout.
// If we have a token but no user (e.g. first load after a deploy), start in
// "loading" so App.tsx can call getMe once to populate user data.
const initialState: AuthState = {
  status: persistedAccessToken
    ? persistedUser
      ? "authenticated"
      : "loading"
    : "idle",
  user: persistedUser,
  role: persistedRole,
  accessToken: persistedAccessToken,
  refreshToken: null,
  error: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuth(state) {
      state.user = null;
      state.role = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("cr_access_token");
      localStorage.removeItem("cr_refresh_token");
      localStorage.removeItem("cr_role");
      localStorage.removeItem("cr_user");
    }
  },
  extraReducers: (builder) => {
    // ── Login ─────────────────────────────────────────────────────────────
    builder.addMatcher(authApi.endpoints.login.matchPending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addMatcher(authApi.endpoints.login.matchFulfilled, (state, { payload }) => {
      const accessToken = payload.accessToken || null;
      state.accessToken = accessToken;
      state.refreshToken = null;
      state.role = (payload.role as Role) || null;
      if (accessToken) localStorage.setItem("cr_access_token", accessToken);
      if (payload.role) localStorage.setItem("cr_role", payload.role);
      // Status stays "loading" until getMe resolves and writes the user to state
      state.status = "loading";
    });
    builder.addMatcher(authApi.endpoints.login.matchRejected, (state) => {
      state.status = "error";
      state.error = "Login failed";
    });

    // ── getMe — populates user after login ────────────────────────────────
    builder.addMatcher(authApi.endpoints.getMe.matchFulfilled, (state, { payload }) => {
      state.user = payload;
      state.role = payload.role;
      state.status = "authenticated";
      state.error = null;
      // Persist so page reloads restore authenticated state without a network call
      localStorage.setItem("cr_user", JSON.stringify(payload));
      localStorage.setItem("cr_role", String(payload.role));
    });
    builder.addMatcher(authApi.endpoints.getMe.matchRejected, (state) => {
      // If already authenticated, ignore the failure. A genuine 401 is handled
      // separately: baseQuery dispatches cr:auth-expired → clearAuth, which sets
      // status to "idle" before this matcher runs. Any other error (network, 5xx)
      // while the user is authenticated should not log them out.
      if (state.status === "authenticated") return;
      state.user = null;
      state.status = "error";
      state.error = "Unable to load session";
    });
  }
});

export const { clearAuth } = authSlice.actions;

export default authSlice.reducer;
