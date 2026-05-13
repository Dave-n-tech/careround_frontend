import { api } from "./baseApi";
import type { HospitalOnboarding, OnboardingStatus, ProvisionHospitalTenantResponse } from "@/types/domain";

export type CreateHospitalOnboardingRequest = {
  hospitalName: string;
  countryOrRegion: string;
  contactEmail: string;
  contactPhone?: string;
  hospitalType: string;
  estimatedInpatientBeds?: string;
  primaryNeed: string;
};

export type ListHospitalOnboardingRequestsArgs = {
  status?: OnboardingStatus;
  limit?: number;
  cursor?: string;
};

export type ReviewHospitalOnboardingRequest = {
  status: OnboardingStatus;
  reviewNotes?: string;
};

export type ProvisionHospitalTenantRequest = {
  hospitalName: string;
  address?: string;
  contactEmail: string;
  contactPhone?: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  newsAmberThreshold?: number;
  newsRedThreshold?: number;
  taskOverdueGraceMinutes?: number;
  roundNotificationsEnabled?: boolean;
  nokNotificationEnabled?: boolean;
};

function onboardingQueryString(args?: ListHospitalOnboardingRequestsArgs) {
  const params = new URLSearchParams();
  if (args?.status) params.set("status", args.status);
  if (args?.limit) params.set("limit", String(args.limit));
  if (args?.cursor) params.set("cursor", args.cursor);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const onboardingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listHospitalOnboardingRequests: builder.query<HospitalOnboarding[], ListHospitalOnboardingRequestsArgs | void>({
      query: (args) => `/onboarding/hospital-requests${onboardingQueryString(args || undefined)}`
    }),
    getHospitalOnboardingRequest: builder.query<HospitalOnboarding, string>({
      query: (id) => `/onboarding/hospital-requests/${id}`
    }),
    submitHospitalOnboarding: builder.mutation<HospitalOnboarding, CreateHospitalOnboardingRequest>({
      query: (body) => ({ url: "/onboarding/hospital-requests", method: "POST", body })
    }),
    reviewHospitalOnboardingRequest: builder.mutation<
      HospitalOnboarding,
      { id: string } & ReviewHospitalOnboardingRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/onboarding/hospital-requests/${id}/review`,
        method: "PUT",
        body
      })
    }),
    provisionHospitalTenant: builder.mutation<
      ProvisionHospitalTenantResponse,
      { id: string } & ProvisionHospitalTenantRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/onboarding/hospital-requests/${id}/provision`,
        method: "POST",
        body
      })
    })
  })
});

export const {
  useListHospitalOnboardingRequestsQuery,
  useGetHospitalOnboardingRequestQuery,
  useSubmitHospitalOnboardingMutation,
  useReviewHospitalOnboardingRequestMutation,
  useProvisionHospitalTenantMutation
} = onboardingApi;
