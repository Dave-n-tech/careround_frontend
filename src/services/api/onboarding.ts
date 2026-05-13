import { api } from "./baseApi";
import type { HospitalOnboarding } from "@/types/domain";

export type CreateHospitalOnboardingRequest = {
  hospitalName: string;
  countryOrRegion: string;
  contactEmail: string;
  contactPhone?: string;
  hospitalType: string;
  estimatedInpatientBeds?: string;
  primaryNeed: string;
};

export const onboardingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    submitHospitalOnboarding: builder.mutation<HospitalOnboarding, CreateHospitalOnboardingRequest>({
      query: (body) => ({ url: "/onboarding/hospital-requests", method: "POST", body })
    })
  })
});

export const { useSubmitHospitalOnboardingMutation } = onboardingApi;
