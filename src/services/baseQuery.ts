import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError
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

const realBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  credentials: "include",
  prepareHeaders: (headers, api) => {
    const platformEndpoints = new Set([
      "platformLogin",
      "listHospitalOnboardingRequests",
      "getHospitalOnboardingRequest",
      "reviewHospitalOnboardingRequest",
      "provisionHospitalTenant",
      "getHospitals"
    ]);
    const token = platformEndpoints.has(api.endpoint)
      ? localStorage.getItem("cr_platform_access_token")
      : localStorage.getItem("cr_access_token");
    if (token) headers.set("authorization", `Bearer ${token}`);
    headers.set("accept", "application/json");
    return headers;
  }
});

const baseQueryWithEnvelope: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await realBaseQuery(args, api, extraOptions);
  if (!result.error && "data" in result && isEnvelope(result.data)) {
    return { ...result, data: result.data.data };
  }
  return result;
};

// ── 401 silent-refresh wrapper ───────────────────────────────────────────────
// On 401, attempt a single token refresh via /auth/refresh using the stored
// refresh token. Concurrent 401s share one in-flight refresh promise.

let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(api: Parameters<typeof realBaseQuery>[1]): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  const refreshToken = localStorage.getItem("cr_refresh_token");
  if (!refreshToken) return false;

  refreshPromise = (async () => {
    const refreshResult = await realBaseQuery(
      { url: "/auth/refresh", method: "POST", body: { refreshToken } },
      api,
      {}
    );
    if (refreshResult.error) {
      localStorage.removeItem("cr_access_token");
      localStorage.removeItem("cr_refresh_token");
      return false;
    }
    const envelope = refreshResult.data as BackendEnvelope<{ accessToken: string; refreshToken: string }>;
    const tokens = envelope?.data ?? (refreshResult.data as { accessToken: string; refreshToken: string });
    if (tokens?.accessToken) localStorage.setItem("cr_access_token", tokens.accessToken);
    if (tokens?.refreshToken) localStorage.setItem("cr_refresh_token", tokens.refreshToken);
    return Boolean(tokens?.accessToken);
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQueryWithEnvelope(args, api, extraOptions);

  const isAuthEndpoint =
    typeof args === "object" && typeof args.url === "string" && args.url.startsWith("/auth/");

  if (result.error?.status === 401 && !isAuthEndpoint) {
    const refreshed = await attemptRefresh(api);
    if (refreshed) {
      result = await baseQueryWithEnvelope(args, api, extraOptions);
    } else {
      window.dispatchEvent(new Event("cr:auth-expired"));
    }
  }

  return result;
};

export const baseQuery = baseQueryWithReauth;
