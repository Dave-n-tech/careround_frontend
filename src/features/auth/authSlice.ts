import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Role, User } from "@/types/domain";
import { api } from "@/services/api";

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
const persistedRefreshToken = localStorage.getItem("cr_refresh_token");

const initialState: AuthState = {
  status: persistedAccessToken ? "loading" : "idle",
  user: null,
  role: null,
  accessToken: persistedAccessToken,
  refreshToken: persistedRefreshToken,
  error: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setDemoAuth(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.role = action.payload.role;
      state.status = "authenticated";
      state.accessToken = "mock-session";
      state.refreshToken = null;
      state.error = null;
    },
    clearAuth(state) {
      state.user = null;
      state.role = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("cr_access_token");
      localStorage.removeItem("cr_refresh_token");
    }
  },
  extraReducers: (builder) => {
    builder.addMatcher(api.endpoints.login.matchPending, (state) => {
      state.status = "loading";
      state.error = null;
    });
    builder.addMatcher(api.endpoints.login.matchFulfilled, (state, { payload }) => {
      const accessToken = payload.accessToken || payload.token || null;
      const refreshToken = payload.refreshToken || null;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      if (accessToken) localStorage.setItem("cr_access_token", accessToken);
      if (refreshToken) localStorage.setItem("cr_refresh_token", refreshToken);
      if (payload.user) {
        state.user = payload.user;
        state.role = payload.user.role;
        state.status = "authenticated";
        state.error = null;
      } else {
        state.status = "loading";
      }
    });
    builder.addMatcher(api.endpoints.login.matchRejected, (state) => {
      state.status = "error";
      state.error = "Login failed";
    });
    builder.addMatcher(api.endpoints.getMe.matchFulfilled, (state, { payload }) => {
      state.user = payload;
      state.role = payload.role;
      state.status = "authenticated";
      state.error = null;
    });
    builder.addMatcher(api.endpoints.getMe.matchRejected, (state) => {
      state.user = null;
      state.role = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.status = "error";
      state.error = "Unable to load session";
      localStorage.removeItem("cr_access_token");
      localStorage.removeItem("cr_refresh_token");
    });
  }
});

export const { setDemoAuth, clearAuth } = authSlice.actions;

export default authSlice.reducer;
