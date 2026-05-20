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

const realBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("cr_access_token");
    if (token) headers.set("authorization", `Bearer ${token}`);
    headers.set("accept", "application/json");
    return headers;
  },
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

export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQueryWithEnvelope(args, api, extraOptions);

  const url = typeof args === "object" ? (args as FetchArgs).url : args;
  const isAuthEndpoint = typeof url === "string" && url.startsWith("/auth/");

  if (result.error?.status === 401 && !isAuthEndpoint) {
    window.dispatchEvent(new Event("cr:auth-expired"));
  }

  return result;
};
