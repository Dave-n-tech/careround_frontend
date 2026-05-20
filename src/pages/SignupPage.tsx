import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useSubmitOnboardingRequestMutation } from "@/services/api/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// ─── Bed range options ────────────────────────────────────────────────────────

const BED_RANGE_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  { value: "UNDER_50", label: "Under 50 beds" },
  { value: "50_150", label: "50 – 150 beds" },
  { value: "151_300", label: "151 – 300 beds" },
  { value: "301_700", label: "301 – 700 beds" },
  { value: "701_1500", label: "701 – 1,500 beds" },
  { value: "OVER_1500", label: "Over 1,500 beds" },
];

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessView({ hospitalName }: { hospitalName: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center text-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-5">
        <CheckCircle2 size={32} className="text-[var(--cr-accent)]" />
      </div>
      <h2 className="text-2xl font-bold text-[var(--cr-ink)] mb-3">Request received</h2>
      <p className="text-[var(--cr-muted)] max-w-sm mb-2">
        Thank you for your interest in CareRound,{" "}
        <span className="font-medium text-[var(--cr-ink)]">{hospitalName}</span>.
      </p>
      <p className="text-[var(--cr-muted)] max-w-sm mb-8">
        A CareRound onboarding specialist will contact your hospital within 2 business days to discuss next steps.
      </p>
      <button
        onClick={() => navigate("/")}
        className="text-sm text-[var(--cr-accent)] hover:underline font-medium"
      >
        Back to home
      </button>
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

type FormState = {
  hospitalName: string;
  countryOrRegion: string;
  contactEmail: string;
  contactPhone: string;
  hospitalType: string;
  estimatedInpatientBeds: string;
  primaryNeed: string;
};

const EMPTY: FormState = {
  hospitalName: "",
  countryOrRegion: "",
  contactEmail: "",
  contactPhone: "",
  hospitalType: "",
  estimatedInpatientBeds: "",
  primaryNeed: "",
};

function fieldError(form: FormState): Partial<Record<keyof FormState, string>> {
  const e: Partial<Record<keyof FormState, string>> = {};
  if (!form.hospitalName.trim() || form.hospitalName.trim().length < 2)
    e.hospitalName = "Hospital name must be at least 2 characters.";
  if (!form.countryOrRegion.trim())
    e.countryOrRegion = "Country or region is required.";
  if (!form.contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail))
    e.contactEmail = "A valid work email is required.";
  if (!form.hospitalType.trim())
    e.hospitalType = "Please describe your hospital type.";
  if (!form.primaryNeed.trim() || form.primaryNeed.trim().length < 10)
    e.primaryNeed = "Please describe your primary need (at least 10 characters).";
  return e;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [submit, { isLoading }] = useSubmitOnboardingRequestMutation();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setTouched((t) => ({ ...t, [field]: true }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function blur(field: keyof FormState) {
    setTouched((t) => ({ ...t, [field]: true }));
    const errs = fieldError(form);
    if (errs[field]) setErrors((e) => ({ ...e, [field]: errs[field] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = fieldError(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setTouched(
        Object.fromEntries(Object.keys(EMPTY).map((k) => [k, true])) as Record<keyof FormState, boolean>,
      );
      return;
    }
    setApiError(null);
    try {
      await submit({
        hospitalName: form.hospitalName.trim(),
        countryOrRegion: form.countryOrRegion.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim() || undefined,
        hospitalType: form.hospitalType.trim(),
        estimatedInpatientBeds: form.estimatedInpatientBeds || undefined,
        primaryNeed: form.primaryNeed.trim(),
      }).unwrap();
      setSubmitted(true);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        "Something went wrong. Please try again.";
      setApiError(msg);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--cr-bg)] flex flex-col">
      {/* Minimal header */}
      <header className="bg-white border-b border-[var(--cr-line)] px-6 h-16 flex items-center justify-between">
        <span className="font-display font-bold text-base text-[var(--cr-ink)]">
          Care<span className="text-[var(--cr-accent)]">Round</span>
        </span>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-[var(--cr-muted)] hover:text-[var(--cr-ink)] transition-colors"
        >
          <ArrowLeft size={14} />
          Back to home
        </button>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          {submitted ? (
            <div className="bg-white border border-[var(--cr-line)] rounded-2xl p-8">
              <SuccessView hospitalName={form.hospitalName} />
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-[var(--cr-ink)]">Request access for your hospital</h1>
                <p className="text-sm text-[var(--cr-muted)] mt-1.5">
                  Fill in your hospital's details and a CareRound specialist will be in touch within 2 business days.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="bg-white border border-[var(--cr-line)] rounded-2xl p-7 flex flex-col gap-5">
                {/* Hospital details */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cr-muted)] mb-3">
                    Hospital Details
                  </p>
                  <div className="flex flex-col gap-4">
                    <Input
                      label="Hospital Name *"
                      value={form.hospitalName}
                      onChange={(e) => set("hospitalName", e.target.value)}
                      onBlur={() => blur("hospitalName")}
                      hint={touched.hospitalName ? errors.hospitalName : undefined}
                      placeholder="e.g. Lagos University Teaching Hospital"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Country / Region *"
                        value={form.countryOrRegion}
                        onChange={(e) => set("countryOrRegion", e.target.value)}
                        onBlur={() => blur("countryOrRegion")}
                        hint={touched.countryOrRegion ? errors.countryOrRegion : undefined}
                        placeholder="e.g. Nigeria"
                      />
                      <Input
                        label="Hospital Type *"
                        value={form.hospitalType}
                        onChange={(e) => set("hospitalType", e.target.value)}
                        onBlur={() => blur("hospitalType")}
                        hint={touched.hospitalType ? errors.hospitalType : undefined}
                        placeholder="e.g. Teaching Hospital"
                      />
                    </div>
                    <Select
                      label="Estimated Inpatient Beds"
                      value={form.estimatedInpatientBeds}
                      onChange={(e) => set("estimatedInpatientBeds", e.target.value)}
                      options={BED_RANGE_OPTIONS}
                    />
                  </div>
                </div>

                <hr className="border-[var(--cr-line)]" />

                {/* Contact details */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cr-muted)] mb-3">
                    Your Contact Details
                  </p>
                  <div className="flex flex-col gap-4">
                    <Input
                      label="Work Email *"
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => set("contactEmail", e.target.value)}
                      onBlur={() => blur("contactEmail")}
                      hint={touched.contactEmail ? errors.contactEmail : undefined}
                      placeholder="admin@yourhospital.org"
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      value={form.contactPhone}
                      onChange={(e) => set("contactPhone", e.target.value)}
                      placeholder="+234 801 000 0000"
                    />
                  </div>
                </div>

                <hr className="border-[var(--cr-line)]" />

                {/* Primary need */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cr-muted)] mb-3">
                    Your Primary Need
                  </p>
                  <Textarea
                    label="What would you like CareRound to help with? *"
                    value={form.primaryNeed}
                    onChange={(e) => set("primaryNeed", e.target.value)}
                    onBlur={() => blur("primaryNeed")}
                    hint={touched.primaryNeed ? errors.primaryNeed : undefined}
                    rows={4}
                    placeholder="e.g. We want to improve ward round documentation, reduce medication errors, and speed up escalation for deteriorating patients."
                  />
                  <p className="text-xs text-[var(--cr-muted)] mt-1 text-right">
                    {form.primaryNeed.length} / 5000
                  </p>
                </div>

                {apiError && (
                  <p className="text-sm text-[var(--cr-danger)] bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    {apiError}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  loading={isLoading}
                  className="w-full"
                >
                  Submit Request
                </Button>

                <p className="text-xs text-[var(--cr-muted)] text-center">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-[var(--cr-accent)] hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
