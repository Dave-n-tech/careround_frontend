import { api } from "./baseApi";

export type SearchResult = {
  type: string;
  id: string;
  title: string;
  subtitle?: string | null;
  routeTarget?: string | null;
};

export type SearchGroup = {
  type: string;
  results: SearchResult[];
};

export type GlobalSearchResponse = {
  groups: SearchGroup[];
};

const searchApi = api.injectEndpoints({
  endpoints: (builder) => ({
    globalSearch: builder.query<GlobalSearchResponse, string>({
      query: (q) => `/search?q=${encodeURIComponent(q)}`,
      providesTags: ["Search"]
    })
  })
});

export const { useGlobalSearchQuery } = searchApi;
