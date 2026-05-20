import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Activity } from "lucide-react";
import { useAppDispatch } from "@/app/hooks";
import { useLoginMutation, useLazyGetMeQuery } from "@/services/api";
import { setMockAuth } from "@/features/auth/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Role, User } from "@/types/domain";

const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  DOCTOR: "/doctor/patients",
  NURSE: "/nurse/tasks",
  SUPERVISOR: "/supervisor/dashboard",
};

const DEV_ROLE_LABELS: { role: Role; label: string; email: string }[] = [
  { role: "ADMIN", label: "Admin", email: "admin@demo.careround" },
  { role: "DOCTOR", label: "Doctor", email: "doctor@demo.careround" },
  { role: "NURSE", label: "Nurse", email: "nurse@demo.careround" },
  { role: "SUPERVISOR", label: "Supervisor", email: "supervisor@demo.careround" },
];

function buildMockUser(role: Role): User {
  const names: Record<Role, { first: string; last: string }> = {
    ADMIN: { first: "Admin", last: "User" },
    DOCTOR: { first: "Dr. James", last: "Adeyemi" },
    NURSE: { first: "Sarah", last: "Okafor" },
    SUPERVISOR: { first: "Ward", last: "Supervisor" },
  };
  const { first, last } = names[role];
  return {
    id: `mock-${role.toLowerCase()}`,
    hospitalId: "mock-hospital",
    firstName: first,
    lastName: last,
    email: `${role.toLowerCase()}@demo.careround`,
    role,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [fetchMe] = useLazyGetMeQuery();

  const [hospitalCode, setHospitalCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Dev mode: selected role (null = not using mock)
  const [devRole, setDevRole] = useState<Role | null>(null);

  const isDev = import.meta.env.DEV;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // ── DEV mock login ────────────────────────────────────────────────────────
    if (isDev && devRole) {
      const mockUser = buildMockUser(devRole);
      dispatch(setMockAuth({ user: mockUser, role: devRole, token: "mock-token" }));
      navigate(ROLE_HOME[devRole], { replace: true });
      return;
    }

    // ── Real login ────────────────────────────────────────────────────────────
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-[var(--cr-line)] shadow-sm p-8 flex flex-col gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-[var(--cr-accent)] flex items-center justify-center">
            <Activity size={24} className="text-white" />
          </div>
          <h1 className="font-display text-xl font-bold text-[var(--cr-ink)]">CareRound</h1>
          <p className="text-xs text-[var(--cr-muted)]">Ward Management Platform</p>
        </div>

        {/* Dev role selector */}
        {isDev && (
          <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3 flex flex-col gap-2">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
              Dev Mode — Quick Login
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {DEV_ROLE_LABELS.map(({ role, label }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setDevRole(role);
                    setEmail(role.toLowerCase() + "@demo.careround");
                    setHospitalCode("DEMO");
                    setPassword("password");
                  }}
                  className={`px-2 py-1.5 rounded text-xs font-medium border transition-colors ${
                    devRole === role
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-amber-700 border-amber-300 hover:bg-amber-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {devRole && (
              <p className="text-xs text-amber-600">
                Logging in as <strong>{devRole}</strong> — no real credentials needed.
              </p>
            )}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Hospital Code"
            placeholder="e.g. STMARYS"
            value={hospitalCode}
            onChange={(e) => setHospitalCode(e.target.value.toUpperCase())}
            autoComplete="organization"
            disabled={isDev && devRole !== null}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@hospital.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={isDev && devRole !== null}
          />
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={isDev && devRole !== null}
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
            <p className="text-xs text-[var(--cr-danger)] bg-[var(--cr-danger-bg)] rounded px-3 py-2">
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
      </div>
    </div>
  );
}
