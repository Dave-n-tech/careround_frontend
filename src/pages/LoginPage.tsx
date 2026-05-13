import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Field, Icons } from "@/components/ui";
import { useAppDispatch } from "@/app/hooks";
import { useLazyGetMeQuery, useLoginMutation } from "@/services/api";
import { setDemoAuth } from "@/features/auth/authSlice";
import { appConfig } from "@/utils/config";
import { roleHomePath } from "@/navigation/nav";
import { USERS } from "@/mock/data";
import type { Role, User } from "@/types/domain";

const ROLE_EMAILS: Record<Role, string> = {
  ADMIN: "t.bankole@omth.ng",
  CONSULTANT: "a.okafor@omth.ng",
  REGISTRAR: "c.eze@omth.ng",
  JUNIOR_DOCTOR: "n.obi@omth.ng",
  NURSE: "f.adeyemi@omth.ng",
  WARD_SUPERVISOR: "p.okoro@omth.ng"
};

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  CONSULTANT: "Consultant",
  REGISTRAR: "Registrar",
  JUNIOR_DOCTOR: "Junior Doctor",
  NURSE: "Nurse",
  WARD_SUPERVISOR: "Ward Supervisor"
};

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [fetchMe] = useLazyGetMeQuery();

  const [email, setEmail] = useState(ROLE_EMAILS.CONSULTANT);
  const [password, setPassword] = useState("demo");
  const [role, setRole] = useState<Role>("CONSULTANT");
  const [error, setError] = useState<string | null>(null);
  const demoMode = appConfig.demoMode;

  const headline = useMemo(
    () => "Digital ward management for the modern hospital.",
    []
  );

  async function handleLogin() {
    setError(null);

    if (demoMode) {
      const user = USERS.find((u) => u.role === role) as User | undefined;
      if (user) {
        dispatch(setDemoAuth(user));
        navigate(roleHomePath(role));
      }
      return;
    }

    try {
      // API requires hospitalId — sourced from env for single-tenant deployment
      const hospitalId = appConfig.hospitalId;
      if (!hospitalId) {
        setError("Hospital ID is not configured. Set VITE_HOSPITAL_ID in your environment.");
        return;
      }
      await login({ hospitalId, email, password }).unwrap();
      const me = await fetchMe().unwrap();
      navigate(roleHomePath(me.role));
    } catch {
      setError("Invalid credentials. Please try again.");
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="bg-[var(--cr-brand)] text-white p-12 flex flex-col justify-between" style={{ background: "linear-gradient(135deg, #083f74 0%, #0b5cab 100%)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded bg-white/15 flex items-center justify-center">
            <Icons.hospital size={20} />
          </div>
          <div className="text-xl font-semibold">CareRound</div>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">{headline}</h1>
          <p className="text-white/80 text-sm leading-relaxed max-w-md">
            A unified system for patient admission, ward rounds, vitals tracking, and shift handover.
            Built for multi-tenant hospitals and real-world clinical teams.
          </p>
        </div>
        <div className="text-xs text-white/60 mono">v1.1 · ISO 27001 · NDPR compliant</div>
      </div>
      <div className="flex items-center justify-center p-10 bg-white/80">
        <div className="w-full max-w-md space-y-5">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm ink-mute mt-1">Use your hospital credentials to continue.</p>
          </div>
          <div className="space-y-3">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </div>
            )}
            <Field label="Email">
              <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </Field>
            <Field label="Password">
              <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </Field>
            {demoMode && (
              <Field label="Demo role" hint="In production, role is loaded from JWT.">
                <select
                  className="select"
                  value={role}
                  onChange={(event) => {
                    const nextRole = event.target.value as Role;
                    setRole(nextRole);
                    setEmail(ROLE_EMAILS[nextRole]);
                  }}
                >
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <button className="btn btn-primary w-full justify-center py-2.5 mt-2" onClick={handleLogin} disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
            <div className="text-xs text-center">
              <button className="ink-mute hover:underline" type="button">
                Forgot password?
              </button>
            </div>
          </div>
          {demoMode && (
            <div className="text-[11px] text-center ink-mute">
              Demo mode is enabled. API calls are mocked and data is seeded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
