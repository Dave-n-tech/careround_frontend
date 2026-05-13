import { useState } from "react";
import { Link } from "react-router-dom";
import { Field, Icons, useToast } from "@/components/ui";
import { useSubmitHospitalOnboardingMutation } from "@/services/api";

export default function SignupPage() {
  const toast = useToast();
  const [submitOnboarding, { isLoading }] = useSubmitHospitalOnboardingMutation();
  const [submitted, setSubmitted] = useState(false);

  const [hospitalName, setHospitalName] = useState("");
  const [countryOrRegion, setCountryOrRegion] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [hospitalType, setHospitalType] = useState("Teaching hospital");
  const [estimatedInpatientBeds, setEstimatedInpatientBeds] = useState("");
  const [primaryNeed, setPrimaryNeed] = useState("");

  async function submit() {
    if (!hospitalName || !countryOrRegion || !contactEmail || !hospitalType || primaryNeed.length < 10) {
      toast({ kind: "error", title: "Fill all required fields (primary need ≥ 10 chars)" });
      return;
    }
    try {
      await submitOnboarding({
        hospitalName,
        countryOrRegion,
        contactEmail,
        contactPhone: contactPhone || undefined,
        hospitalType,
        estimatedInpatientBeds: estimatedInpatientBeds || undefined,
        primaryNeed
      }).unwrap();
      setSubmitted(true);
      toast({ kind: "success", title: "Request received", body: "A CareRound onboarding specialist will contact your hospital." });
    } catch {
      toast({ kind: "error", title: "Could not submit request", body: "Please try again." });
    }
  }

  return (
    <div className="min-h-screen bg-[var(--cr-bg)]">
      <header className="border-b border-[var(--cr-line)] bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded bg-[var(--cr-brand)] text-white">
              <Icons.hospital size={20} />
            </span>
            <span className="text-lg font-semibold">CareRound</span>
          </Link>
          <Link to="/login" className="btn">Sign in</Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-5 sm:py-12 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <section className="space-y-5">
          <div className="field-label">Hospital onboarding</div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Bring CareRound to your hospital.</h1>
          <p className="text-sm leading-6 ink-2">
            Tell us about your hospital, wards, and clinical teams. We will help configure your isolated tenant, demo the workflows, and prepare integration with your backend services.
          </p>
          <div className="panel rounded p-4">
            <h2 className="text-sm font-semibold">What happens next</h2>
            <div className="mt-3 space-y-3 text-sm ink-2">
              <div>1. We confirm your hospital structure and pilot wards.</div>
              <div>2. Your tenant is configured with roles, departments, teams, and NEWS thresholds.</div>
              <div>3. Your technical team receives integration details for authentication and API rollout.</div>
            </div>
          </div>
        </section>

        <section className="panel rounded p-4 sm:p-5">
          {submitted ? (
            <div className="space-y-3 text-center py-8">
              <div className="text-emerald-700 text-3xl">✓</div>
              <h2 className="text-xl font-semibold">Request received</h2>
              <p className="text-sm ink-2 max-w-md mx-auto">
                Thank you. A CareRound onboarding specialist will contact <span className="font-medium">{contactEmail}</span> within two business days.
              </p>
              <Link to="/" className="btn mt-4">Back to home</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Hospital name" required>
                  <input className="input" placeholder="e.g. City Teaching Hospital" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
                </Field>
                <Field label="Country / region" required>
                  <input className="input" placeholder="e.g. Nigeria" value={countryOrRegion} onChange={(e) => setCountryOrRegion(e.target.value)} />
                </Field>
                <Field label="Work email" required>
                  <input className="input" type="email" placeholder="you@hospital.org" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                </Field>
                <Field label="Phone">
                  <input className="input" placeholder="+234" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                </Field>
                <Field label="Hospital type" required>
                  <select className="select" value={hospitalType} onChange={(e) => setHospitalType(e.target.value)}>
                    <option>Teaching hospital</option>
                    <option>General hospital</option>
                    <option>Private hospital network</option>
                    <option>Specialist centre</option>
                  </select>
                </Field>
                <Field label="Estimated inpatient beds">
                  <select className="select" value={estimatedInpatientBeds} onChange={(e) => setEstimatedInpatientBeds(e.target.value)}>
                    <option value="">—</option>
                    <option>Under 100</option>
                    <option>100 - 300</option>
                    <option>301 - 700</option>
                    <option>700+</option>
                  </select>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Primary need" required hint="At least 10 characters">
                    <textarea
                      className="textarea"
                      rows={5}
                      placeholder="Tell us what you need to improve first: ward rounds, handover, vitals escalation, task tracking, reporting, or multi-site visibility."
                      value={primaryNeed}
                      onChange={(e) => setPrimaryNeed(e.target.value)}
                    />
                  </Field>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--cr-line)] pt-4">
                <p className="max-w-md text-xs leading-5 ink-mute">
                  This request does not create a shared public account. Each hospital is onboarded as its own tenant with isolated data and configuration.
                </p>
                <button className="btn btn-primary w-full px-5 py-2.5 sm:w-auto" onClick={submit} disabled={isLoading}>
                  {isLoading ? "Submitting…" : "Submit request"}
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
