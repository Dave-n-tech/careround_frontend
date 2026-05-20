import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Role, User } from "@/types/domain";
import { authApi } from "@/services/api/auth";

export type AuthStatus = "idle" | "loading" | "authenticated" | "error";

type AuthState = {
  status: AuthStatus;
  user: User | null;
  role: Role | null;
  accessToken: string | null;
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

const initialState: AuthState = {
  status: persistedAccessToken
    ? persistedUser
      ? "authenticated"
      : "loading"
    : "idle",
  user: persistedUser,
  role: persistedRole,
  accessToken: persistedAccessToken,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuth(state) {
      state.user = null;
      state.role = null;
      state.accessToken = null;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("cr_access_token");
      localStorage.removeItem("cr_refresh_token");
      localStorage.removeItem("cr_role");
      localStorage.removeItem("cr_user");
    },
    patchUser(state, action: PayloadAction<Partial<Pick<User, "firstName" | "lastName" | "email">>>) {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("cr_user", JSON.stringify(state.user));
    },
    // Used by the dev mock login to set auth state directly
    setMockAuth(state, action: PayloadAction<{ user: User; role: Role; token: string }>) {
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.accessToken = action.payload.token;
      state.status = "authenticated";
      state.error = null;
      localStorage.setItem("cr_access_token", action.payload.token);
      localStorage.setItem("cr_role", action.payload.role);
      localStorage.setItem("cr_user", JSON.stringify(action.payload.user));
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(authApi.endpoints.login.matchPending, (state) => {
      state.status = "loading";
      state.error = null;
    });

    builder.addMatcher(authApi.endpoints.login.matchFulfilled, (state, { payload }) => {
      state.accessToken = payload.accessToken;
      state.role = payload.role;
      state.status = "loading"; // stays loading until getMe fills user
      localStorage.setItem("cr_access_token", payload.accessToken);
      localStorage.setItem("cr_role", payload.role);
    });

    builder.addMatcher(authApi.endpoints.login.matchRejected, (state, { payload }) => {
      state.status = "error";
      state.error =
        (payload as { data?: { message?: string } })?.data?.message ?? "Invalid credentials";
    });

    builder.addMatcher(authApi.endpoints.getMe.matchFulfilled, (state, { payload }) => {
      state.user = payload;
      state.role = payload.role;
      state.status = "authenticated";
      state.error = null;
      localStorage.setItem("cr_user", JSON.stringify(payload));
      localStorage.setItem("cr_role", payload.role);
    });

    builder.addMatcher(authApi.endpoints.getMe.matchRejected, (state) => {
      if (state.status === "authenticated") return;
      state.status = "error";
      state.error = "Unable to load session";
    });

    builder.addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
      state.user = null;
      state.role = null;
      state.accessToken = null;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("cr_access_token");
      localStorage.removeItem("cr_refresh_token");
      localStorage.removeItem("cr_role");
      localStorage.removeItem("cr_user");
    });
  },
});

export const { clearAuth, setMockAuth, patchUser } = authSlice.actions;
export default authSlice.reducer;
