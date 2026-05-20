import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useActivateAccountMutation } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ActivatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [activate, { isLoading }] = useActivateAccountMutation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = !!token && password.length >= 8 && password === confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setApiError(null);
    try {
      await activate({ token: token!, password }).unwrap();
      setDone(true);
    } catch (err: unknown) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ??
        "Activation failed. Your link may have expired — please contact support.";
      setApiError(msg);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--cr-bg)] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8">
        <span className="font-display font-bold text-xl text-[var(--cr-ink)]">
          Care<span className="text-[var(--cr-accent)]">Round</span>
        </span>
      </div>

      <div className="w-full max-w-sm bg-white border border-[var(--cr-line)] rounded-2xl p-8">
        {/* No token */}
        {!token && (
          <div className="text-center">
            <AlertTriangle size={32} className="text-amber-500 mx-auto mb-3" />
            <h1 className="text-lg font-bold text-[var(--cr-ink)] mb-2">Invalid activation link</h1>
            <p className="text-sm text-[var(--cr-muted)] mb-6">
              This link is missing an activation token. Please use the link from your invitation email.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-[var(--cr-accent)] hover:underline font-medium"
            >
              Go to sign in
            </button>
          </div>
        )}

        {/* Success */}
        {token && done && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-[var(--cr-accent)]" />
            </div>
            <h1 className="text-lg font-bold text-[var(--cr-ink)] mb-2">Account activated</h1>
            <p className="text-sm text-[var(--cr-muted)] mb-7">
              Your password has been set. Sign in to access your hospital's CareRound account.
            </p>
            <Button variant="primary" className="w-full" onClick={() => navigate("/login")}>
              Go to sign in
            </Button>
          </div>
        )}

        {/* Form */}
        {token && !done && (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-[var(--cr-ink)]">Activate your account</h1>
              <p className="text-sm text-[var(--cr-muted)] mt-1">
                Set a password to complete your CareRound account setup.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hint={tooShort ? "Minimum 8 characters" : undefined}
                autoComplete="new-password"
                autoFocus
              />
              <Input
                label="Confirm Password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                hint={mismatch ? "Passwords don't match" : undefined}
                autoComplete="new-password"
              />

              {apiError && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  {apiError}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                disabled={!canSubmit}
                className="w-full mt-1"
              >
                Activate Account
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
