import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Field, Icons } from "@/components/ui";
import { useForgotPasswordMutation, useLazyGetMeQuery, useLoginMutation, useResetPasswordMutation } from "@/services/api";
import { appConfig } from "@/utils/config";
import { roleHomePath } from "@/navigation/nav";

export default function LoginPage() {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [fetchMe] = useLazyGetMeQuery();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [forgotPassword, { isLoading: isRequestingReset }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResettingPassword }] = useResetPasswordMutation();

  const headline = useMemo(
    () => "Digital ward management for the modern hospital.",
    []
  );

  async function handleLogin() {
    setError(null);

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

  async function requestReset() {
    setError(null);
    setResetMessage(null);
    const hospitalId = appConfig.hospitalId;
    if (!hospitalId || !email) {
      setResetMessage("Enter your email first.");
      return;
    }
    try {
      const response = await forgotPassword({ hospitalId, email }).unwrap();
      setResetToken(response.resetToken || "");
      setResetMessage(response.resetToken ? "Reset token received. Set a new password below." : "Reset instructions sent.");
    } catch {
      setResetMessage("Could not request a reset token.");
    }
  }

  async function submitReset() {
    setResetMessage(null);
    if (!resetToken || newPassword.length < 8) {
      setResetMessage("Enter the reset token and a new password of at least 8 characters.");
      return;
    }
    try {
      await resetPassword({ token: resetToken, newPassword }).unwrap();
      setResetOpen(false);
      setResetToken("");
      setNewPassword("");
      setResetMessage("Password reset. You can sign in now.");
    } catch {
      setResetMessage("Could not reset password.");
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="bg-[var(--cr-brand)] text-white p-6 sm:p-8 md:p-12 flex min-h-[360px] flex-col justify-between gap-10 md:min-h-screen" style={{ background: "linear-gradient(135deg, #083f74 0%, #0b5cab 100%)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded bg-white/15 flex items-center justify-center">
            <Icons.hospital size={20} />
          </div>
          <div className="text-xl font-semibold">CareRound</div>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{headline}</h1>
          <p className="text-white/80 text-sm leading-relaxed max-w-md">
            A unified system for patient admission, ward rounds, vitals tracking, and shift handover.
            Built for multi-tenant hospitals and real-world clinical teams.
          </p>
        </div>
        <div className="text-xs text-white/60 mono">v1.1 · ISO 27001 · NDPR compliant</div>
      </div>
      <div className="flex items-center justify-center bg-white/80 p-5 sm:p-8 md:p-10">
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
            <button className="btn btn-primary w-full justify-center py-2.5 mt-2" onClick={handleLogin} disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
            <div className="text-xs text-center">
              <button className="ink-mute hover:underline" type="button" onClick={() => setResetOpen((open) => !open)}>
                Forgot password?
              </button>
            </div>
            {resetOpen && (
              <div className="space-y-3 rounded border border-[var(--cr-line)] bg-slate-50 p-3">
                <button className="btn w-full justify-center" type="button" onClick={requestReset} disabled={isRequestingReset}>
                  {isRequestingReset ? "Requesting..." : "Request reset token"}
                </button>
                <Field label="Reset token">
                  <input className="input mono" value={resetToken} onChange={(event) => setResetToken(event.target.value)} />
                </Field>
                <Field label="New password">
                  <input className="input" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                </Field>
                <button className="btn btn-primary w-full justify-center" type="button" onClick={submitReset} disabled={isResettingPassword}>
                  {isResettingPassword ? "Resetting..." : "Set new password"}
                </button>
              </div>
            )}
            {resetMessage && <div className="text-xs text-center ink-mute">{resetMessage}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
