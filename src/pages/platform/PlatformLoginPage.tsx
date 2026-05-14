import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Field, Icons } from "@/components/ui";
import { usePlatformLoginMutation } from "@/services/api";

export default function PlatformLoginPage() {
  const navigate = useNavigate();
  const [platformLogin, { isLoading }] = usePlatformLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    try {
      const response = await platformLogin({ email, password }).unwrap();
      localStorage.setItem("cr_platform_access_token", response.accessToken);
      localStorage.setItem("cr_platform_role", response.role);
      navigate("/platform", { replace: true });
    } catch {
      setError("Invalid platform credentials.");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-5">
      <div className="w-full max-w-md panel rounded p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded bg-[var(--cr-brand)] text-white grid place-items-center">
            <Icons.settings size={18} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Platform admin</h1>
            <p className="text-sm ink-mute">Sign in to review hospital onboarding.</p>
          </div>
        </div>
        {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <Field label="Email">
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <button className="btn btn-primary w-full justify-center" onClick={submit} disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </div>
  );
}
