import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

type BackendEnvelope<T> = {
  data?: T;
  message?: string;
  status?: number;
  success?: boolean;
};

const isEnvelope = (value: unknown): value is BackendEnvelope<unknown> =>
  Boolean(value && typeof value === "object" && "data" in value);

const rawFetch = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("cr_access_token");
    if (token) headers.set("authorization", `Bearer ${token}`);
    headers.set("accept", "application/json");
    return headers;
  },
});

const withEnvelope: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawFetch(args, api, extraOptions);
  if (!result.error && "data" in result && isEnvelope(result.data)) {
    return { ...result, data: result.data.data };
  }
  return result;
};

// ─── Silent token refresh ─────────────────────────────────────────────────────
// Mutex: at most one refresh request in-flight at a time.
let refreshPromise: Promise<boolean> | null = null;

export async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem("cr_refresh_token");
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${apiBaseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const body = await res.json();
      // Unwrap the { success, data } envelope if present
      const tokens = isEnvelope(body) ? (body.data as typeof body) : body;
      if (!tokens?.accessToken) return false;

      localStorage.setItem("cr_access_token", tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem("cr_refresh_token", tokens.refreshToken);
      }
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Main base query ──────────────────────────────────────────────────────────

export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await withEnvelope(args, api, extraOptions);

  const url = typeof args === "object" ? (args as FetchArgs).url : args;
  const isAuthEndpoint = typeof url === "string" && url.startsWith("/auth/");

  if (result.error?.status === 401 && !isAuthEndpoint) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      // Retry the original request with the new access token
      return withEnvelope(args, api, extraOptions);
    }
    // Refresh failed — session is dead
    window.dispatchEvent(new Event("cr:auth-expired"));
  }

  return result;
};
