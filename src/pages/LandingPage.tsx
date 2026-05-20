import { useNavigate } from "react-router-dom";
import {
  ClipboardList, Pill, Activity, Users,
  CheckCircle2, ArrowRight, ShieldCheck, Zap, Globe,
} from "lucide-react";

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const navigate = useNavigate();
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-display font-bold text-lg text-[var(--cr-ink)] tracking-tight">
          Care<span className="text-[var(--cr-accent)]">Round</span>
        </span>
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-[var(--cr-ink)] border border-[var(--cr-line)] hover:bg-[var(--cr-surface-2)] transition-colors"
        >
          Sign in
        </button>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const navigate = useNavigate();
  return (
    <section className="pt-32 pb-20 px-6 text-center bg-gradient-to-b from-teal-50 to-white">
      <div className="max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold mb-6">
          <ShieldCheck size={13} />
          Built for clinical ward teams
        </span>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--cr-ink)] leading-tight tracking-tight mb-5">
          Safer ward rounds.{" "}
          Fewer missed doses.{" "}
          <span className="text-[var(--cr-accent)]">Better patient outcomes.</span>
        </h1>

        <p className="text-lg text-[var(--cr-ink-2)] max-w-xl mx-auto mb-8 leading-relaxed">
          CareRound brings doctors, nurses, and ward supervisors onto one platform — connecting clinical notes, medication administration, and real-time escalation in every ward round.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate("/signup")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--cr-accent)] text-white text-sm font-semibold hover:bg-teal-600 transition-colors shadow-md shadow-teal-200"
          >
            Request Access
            <ArrowRight size={16} />
          </button>
          <a
            href="#how-it-works"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-[var(--cr-ink)] border border-[var(--cr-line)] hover:bg-[var(--cr-surface-2)] transition-colors"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Trust strip ──────────────────────────────────────────────────────────────

function TrustStrip() {
  const items = [
    { icon: ShieldCheck, text: "Role-based access control" },
    { icon: Globe,       text: "Designed for African hospitals" },
    { icon: Zap,         text: "Real-time escalation alerts" },
  ];
  return (
    <div className="border-y border-[var(--cr-line)] bg-[var(--cr-surface-2)] py-4 px-6">
      <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-10 gap-y-3">
        {items.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-sm text-[var(--cr-muted)]">
            <Icon size={15} className="text-[var(--cr-accent)]" />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: ClipboardList,
    title: "AI-assisted Ward Rounds",
    body: "Doctors record consultations by voice. CareRound transcribes, structures the SOAP note, and extracts prescription orders — all before the next patient.",
  },
  {
    icon: Pill,
    title: "Medication Administration Record",
    body: "A live MAR chart for every patient. Nurses see due and overdue doses at a glance, mark administrations with a tap, and escalations fire automatically.",
  },
  {
    icon: Activity,
    title: "Vitals & Escalation",
    body: "Vitals are scored against the Vitals Health Index (NEWS2-based). WATCH and CRITICAL states alert the supervisor dashboard in real time.",
  },
  {
    icon: Users,
    title: "Every Role, One Platform",
    body: "Tailored views for doctors, nurses, and ward supervisors. Each role sees exactly what they need — no clutter, no missing context.",
  },
];

function Features() {
  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--cr-ink)] mb-3">
            Everything a ward team needs
          </h2>
          <p className="text-[var(--cr-muted)] max-w-xl mx-auto">
            From the morning round to the midnight medication run, CareRound covers every handoff.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="bg-white border border-[var(--cr-line)] rounded-2xl p-6 flex gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-[var(--cr-accent)]" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--cr-ink)] mb-1">{title}</h3>
                <p className="text-sm text-[var(--cr-muted)] leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: "01",
    title: "Submit a request",
    body: "A hospital representative fills in a short onboarding form. No payment, no instant sign-up — your request goes to a CareRound specialist.",
  },
  {
    n: "02",
    title: "We contact your team",
    body: "A CareRound onboarding specialist reaches out to understand your wards, roles, and clinical workflows before provisioning your account.",
  },
  {
    n: "03",
    title: "Your hospital goes live",
    body: "We provision your hospital tenant, create your administrator account, and send an activation link. Your team can log in and start configuring wards.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-6 bg-[var(--cr-surface-2)]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--cr-ink)] mb-3">
            How onboarding works
          </h2>
          <p className="text-[var(--cr-muted)] max-w-lg mx-auto">
            We review every hospital before granting access. Clinical software requires care.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {STEPS.map(({ n, title, body }) => (
            <div key={n} className="bg-white rounded-2xl border border-[var(--cr-line)] p-6">
              <span className="text-4xl font-black text-teal-100 leading-none select-none">{n}</span>
              <h3 className="font-semibold text-[var(--cr-ink)] mt-3 mb-2">{title}</h3>
              <p className="text-sm text-[var(--cr-muted)] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CtaSection() {
  const navigate = useNavigate();
  return (
    <section className="py-20 px-6 bg-[var(--cr-accent)]">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Ready to modernise your ward?
        </h2>
        <p className="text-teal-100 mb-8">
          Request access today. A CareRound specialist will be in touch within 2 business days.
        </p>
        <button
          onClick={() => navigate("/signup")}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-[var(--cr-accent)] text-sm font-bold hover:bg-teal-50 transition-colors shadow-lg"
        >
          Request Access
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-[var(--cr-line)] bg-white">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--cr-muted)]">
        <span className="font-display font-bold text-sm text-[var(--cr-ink)]">
          Care<span className="text-[var(--cr-accent)]">Round</span>
        </span>
        <span>© {new Date().getFullYear()} CareRound. All rights reserved.</span>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Nav />
      <Hero />
      <TrustStrip />
      <Features />
      <HowItWorks />
      <CtaSection />
      <Footer />
    </div>
  );
}
