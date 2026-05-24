import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ClipboardList, Pill, Activity, ShieldCheck } from "lucide-react";
import { useLoginMutation, useLazyGetMeQuery } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Role } from "@/types/domain";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  DOCTOR: "/doctor/patients",
  NURSE: "/nurse/tasks",
  SUPERVISOR: "/supervisor/dashboard",
};

const FEATURES = [
  { icon: ClipboardList, text: "AI-assisted ward round notes & SOAP structuring" },
  { icon: Pill,          text: "Live medication administration record & escalation" },
  { icon: Activity,      text: "Vitals Health Index with real-time supervisor alerts" },
];

// ─── Left branding panel ──────────────────────────────────────────────────────

function BrandPanel() {
  return (
    <div className="hidden md:flex flex-col justify-between bg-[var(--cr-accent)] px-10 py-12 text-white h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
          <Activity size={18} className="text-white" />
        </div>
        <span className="font-display font-bold text-lg tracking-tight">CareRound</span>
      </div>

      {/* Main copy */}
      <div>
        <h2 className="text-3xl font-bold leading-snug mb-4">
          Ward rounds.<br />
          Medication safety.<br />
          Faster escalation.
        </h2>
        <p className="text-teal-100 text-sm leading-relaxed mb-8 max-w-xs">
          One platform connecting every clinician — from the morning round to the midnight medication run.
        </p>

        <ul className="flex flex-col gap-4">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={14} className="text-white" />
              </div>
              <span className="text-sm text-teal-50 leading-snug">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 text-teal-200 text-xs">
        <ShieldCheck size={13} />
        Role-based access · Tenant-isolated · Audit-ready
      </div>
    </div>
  );
}

// ─── Login page ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [fetchMe] = useLazyGetMeQuery();

  const [hospitalCode, setHospitalCode] = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!hospitalCode || !email || !password) {
      setError("All fields are required.");
      return;
    }

    try {
      const result = await login({ hospitalCode, email, password }).unwrap();
      await fetchMe();
      navigate(ROLE_HOME[result.role], { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        "Invalid credentials. Please check your hospital code, email, and password.";
      setError(msg);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cr-bg)]">
      {/* Navbar */}
      <nav className="h-14 bg-white border-b border-[var(--cr-line)] flex items-center px-6 shrink-0">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 group"
          aria-label="CareRound home"
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--cr-accent)] flex items-center justify-center">
            <Activity size={15} className="text-white" />
          </div>
          <span className="font-display font-bold text-base text-[var(--cr-ink)] group-hover:text-[var(--cr-accent)] transition-colors">
            Care<span className="text-[var(--cr-accent)]">Round</span>
          </span>
        </button>
      </nav>

      {/* Split body */}
      <div className="flex flex-1 min-h-0">
        {/* Left — branding (desktop only) */}
        <div className="hidden md:block w-[420px] shrink-0">
          <BrandPanel />
        </div>

        {/* Right — form */}
        <div className="flex-1 flex items-start md:items-center justify-center px-6 pt-10 pb-10 overflow-y-auto">
          <div className="w-full max-w-sm">
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-[var(--cr-ink)]">Sign in</h1>
              <p className="text-sm text-[var(--cr-muted)] mt-1">
                Enter your hospital code and credentials to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Hospital Code"
                placeholder="e.g. STMARYS"
                value={hospitalCode}
                onChange={(e) => setHospitalCode(e.target.value.toUpperCase())}
                autoComplete="organization"
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                rightElement={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-[var(--cr-muted)] hover:text-[var(--cr-ink)]"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />

              {error && (
                <p className="text-xs text-[var(--cr-danger)] bg-red-50 border border-red-200 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                className="w-full mt-1"
              >
                Sign In
              </Button>
            </form>

            <p className="text-xs text-[var(--cr-muted)] text-center mt-6">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="text-[var(--cr-accent)] hover:underline font-medium"
              >
                Request access
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
