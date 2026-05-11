import { Link } from "react-router-dom";
import { Icons } from "@/components/ui";

const problems = [
  "Ward priorities live on paper lists that go stale before the round starts.",
  "Shift handovers rely on memory, WhatsApp threads, and incomplete bedside updates.",
  "High NEWS scores, overdue tasks, and deterioration cues are noticed too late.",
  "Hospital leaders cannot see ward pressure, staffing gaps, or task completion in real time."
];

const features = [
  {
    title: "Acuity-led ward rounds",
    body: "Prioritise patients by acuity and NEWS score, capture reviews, create post-round tasks, and notify next-of-kin from one workflow."
  },
  {
    title: "Structured shift handover",
    body: "Give incoming teams patient-level notes, urgent flags, active shift context, and outstanding jobs without relying on informal channels."
  },
  {
    title: "Nursing task control",
    body: "Record vitals, raise concerns, track nursing care tasks, and escalate missed windows before they become unsafe."
  },
  {
    title: "Multi-tenant hospital operations",
    body: "Each hospital runs as an isolated tenant with its own wards, teams, users, NEWS thresholds, and clinical configuration."
  }
];

const metrics = [
  ["7", "clinical roles supported"],
  ["24/7", "ward visibility"],
  ["100%", "tenant-scoped access"],
  ["<5 min", "critical escalation target"]
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--cr-bg)] text-[var(--cr-ink)]">
      <header className="absolute left-0 right-0 top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded bg-white/15">
              <Icons.hospital size={20} />
            </span>
            <span className="text-lg font-semibold">CareRound</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/login" className="btn border-white/25 bg-white/10 text-white hover:bg-white/20">
              Sign in
            </Link>
            <Link to="/signup" className="btn btn-primary border-white bg-white text-[var(--cr-brand-ink)] hover:bg-slate-100">
              Request access
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative min-h-[88vh] overflow-hidden bg-[var(--cr-brand-ink)] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,63,116,0.96),rgba(11,92,171,0.88)),url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221200%22 height=%22700%22 viewBox=%220 0 1200 700%22%3E%3Crect width=%221200%22 height=%22700%22 fill=%22%230b5cab%22/%3E%3Cg fill=%22none%22 stroke=%22%23ffffff%22 stroke-opacity=%220.13%22%3E%3Cpath d=%22M0 120h1200M0 240h1200M0 360h1200M0 480h1200M0 600h1200M160 0v700M320 0v700M480 0v700M640 0v700M800 0v700M960 0v700M1120 0v700%22/%3E%3C/g%3E%3C/svg%3E')]" />
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 pb-16 pt-28 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-20 lg:pt-32">
          <div className="flex min-h-[560px] flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-white/85">
              Multi-tenant digital ward management
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              Safer ward rounds, clearer handovers, and real-time inpatient visibility.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/82 md:text-lg">
              CareRound replaces fragmented paper lists, informal handover channels, and delayed escalation with one operational frontend for hospitals running busy inpatient wards.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className="btn btn-primary px-5 py-3 text-sm">
                Request hospital access
              </Link>
              <Link to="/login" className="btn border-white/25 bg-white/10 px-5 py-3 text-sm text-white hover:bg-white/20">
                Sign in to demo
              </Link>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 md:grid-cols-4">
              {metrics.map(([value, label]) => (
                <div key={label} className="border-l border-white/20 pl-3">
                  <div className="mono text-2xl font-semibold">{value}</div>
                  <div className="mt-1 text-xs text-white/65">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center lg:min-h-[620px]">
            <div className="w-full overflow-hidden rounded border border-white/20 bg-white text-slate-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold">Soyinka Ward command view</div>
                  <div className="text-xs text-slate-500">OMTH Ikeja tenant · live clinical state</div>
                </div>
                <span className="chip bg-emerald-100 text-emerald-700">LIVE</span>
              </div>
              <div className="grid grid-cols-2 gap-px bg-slate-200 md:grid-cols-4">
                {[
                  ["21/24", "beds occupied"],
                  ["3", "open escalations"],
                  ["82%", "task completion"],
                  ["1", "active round"]
                ].map(([value, label]) => (
                  <div key={label} className="bg-white p-4">
                    <div className="mono text-2xl font-semibold">{value}</div>
                    <div className="field-label mt-1">{label}</div>
                  </div>
                ))}
              </div>
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold">Acuity queue</div>
                  <div className="text-xs text-slate-500">NEWS ordered</div>
                </div>
                <div className="space-y-2">
                  {[
                    ["B-04", "Adebayo Ogunleye", "Severe pneumonia", "NEWS 9", "CRITICAL", "bg-red-50 text-red-700"],
                    ["B-18", "Olamide Akande", "Severe malaria", "NEWS 6", "HIGH", "bg-amber-50 text-amber-700"],
                    ["B-07", "Aminat Bello", "Sickle cell crisis", "NEWS 5", "HIGH", "bg-amber-50 text-amber-700"],
                    ["B-12", "Folake Adekunle", "DKA resolved", "NEWS 1", "LOW", "bg-emerald-50 text-emerald-700"]
                  ].map(([bed, name, diagnosis, news, acuity, tone]) => (
                    <div key={bed} className="grid grid-cols-[54px_1fr_auto] items-center gap-3 rounded border border-slate-200 bg-white p-3">
                      <div className="mono text-xs text-slate-500">{bed}</div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{name}</div>
                        <div className="truncate text-xs text-slate-500">{diagnosis}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`chip ${tone}`}>{acuity}</span>
                        <span className="mono text-xs text-slate-500">{news}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 text-sm font-semibold">Escalation routing</div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="rounded border border-red-200 bg-red-50 p-3 text-sm">
                    <div className="font-semibold text-red-800">RED NEWS breach</div>
                    <div className="mt-1 text-xs text-red-700">Consultant notified · next review due</div>
                  </div>
                  <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm">
                    <div className="font-semibold text-amber-800">Task overdue</div>
                    <div className="mt-1 text-xs text-amber-700">Registrar queue · 12 min open</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="field-label">The problem</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Ward management is still too dependent on memory, paper, and heroics.</h2>
            <p className="mt-4 text-sm leading-6 ink-2">
              Every hospital has its own wards, staffing patterns, specialties, escalation thresholds, and governance requirements. CareRound gives each tenant a secure clinical workspace while standardising the workflows that make inpatient care safer.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {problems.map((problem) => (
              <div key={problem} className="panel rounded p-4">
                <div className="mb-3 h-1 w-10 rounded bg-[var(--cr-danger)]" />
                <p className="text-sm leading-6 ink-2">{problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--cr-line)] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="max-w-3xl">
            <div className="field-label">What CareRound brings together</div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">One frontend for the full inpatient operating rhythm.</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="rounded border border-[var(--cr-line)] bg-[var(--cr-surface-2)] p-5">
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 ink-2">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 py-16 lg:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <div className="field-label">Built for many hospitals</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Configure each hospital without mixing its data.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 ink-2">
            CareRound is designed around hospital tenancy from the start: tenant-scoped users, wards, medical teams, patient records, system settings, and audit-ready workflows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/signup" className="btn btn-primary px-5 py-3 text-sm">
            Start onboarding
          </Link>
          <Link to="/login" className="btn px-5 py-3 text-sm">
            View demo
          </Link>
        </div>
      </section>
    </div>
  );
}
