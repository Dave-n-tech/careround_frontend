import { Link } from "react-router-dom";
import { Field, Icons, useToast } from "@/components/ui";

export default function SignupPage() {
  const toast = useToast();

  return (
    <div className="min-h-screen bg-[var(--cr-bg)]">
      <header className="border-b border-[var(--cr-line)] bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded bg-[var(--cr-brand)] text-white">
              <Icons.hospital size={20} />
            </span>
            <span className="text-lg font-semibold">CareRound</span>
          </Link>
          <Link to="/login" className="btn">Sign in</Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <section className="space-y-5">
          <div className="field-label">Hospital onboarding</div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">Bring CareRound to your hospital.</h1>
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

        <section className="panel rounded p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Hospital name" required>
              <input className="input" placeholder="e.g. City Teaching Hospital" />
            </Field>
            <Field label="Country / region" required>
              <input className="input" placeholder="e.g. Nigeria" />
            </Field>
            <Field label="Work email" required>
              <input className="input" type="email" placeholder="you@hospital.org" />
            </Field>
            <Field label="Phone">
              <input className="input" placeholder="+234" />
            </Field>
            <Field label="Hospital type" required>
              <select className="select">
                <option>Teaching hospital</option>
                <option>General hospital</option>
                <option>Private hospital network</option>
                <option>Specialist centre</option>
              </select>
            </Field>
            <Field label="Estimated inpatient beds">
              <select className="select">
                <option>Under 100</option>
                <option>100 - 300</option>
                <option>301 - 700</option>
                <option>700+</option>
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Primary need" required>
                <textarea className="textarea" rows={5} placeholder="Tell us what you need to improve first: ward rounds, handover, vitals escalation, task tracking, reporting, or multi-site visibility." />
              </Field>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--cr-line)] pt-4">
            <p className="max-w-md text-xs leading-5 ink-mute">
              This request does not create a shared public account. Each hospital is onboarded as its own tenant with isolated data and configuration.
            </p>
            <button
              className="btn btn-primary px-5 py-2.5"
              onClick={() => toast({ kind: "success", title: "Request received", body: "A CareRound onboarding specialist will contact your hospital." })}
            >
              Submit request
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
