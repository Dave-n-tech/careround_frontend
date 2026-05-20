import { api } from "./baseApi";

export interface SubmitOnboardingRequest {
  hospitalName: string;
  countryOrRegion: string;
  contactEmail: string;
  contactPhone?: string;
  hospitalType: string;
  estimatedInpatientBeds?: string;
  primaryNeed: string;
}

export interface OnboardingRequestResponse {
  id: string;
  hospitalName: string;
  contactEmail: string;
  status: "PENDING_REVIEW";
  createdAt: string;
}

export const onboardingApi = api.injectEndpoints({
  endpoints: (build) => ({
    submitOnboardingRequest: build.mutation<OnboardingRequestResponse, SubmitOnboardingRequest>({
      query: (body) => ({
        url: "/onboarding/hospital-requests",
        method: "POST",
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useSubmitOnboardingRequestMutation } = onboardingApi;
