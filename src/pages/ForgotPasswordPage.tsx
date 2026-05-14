import { useState } from "react";
import { Link } from "react-router-dom";
import { Field, Icons } from "@/components/ui";
import { useForgotPasswordMutation, useResetPasswordMutation } from "@/services/api";
import { appConfig } from "@/utils/config";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [forgotPassword, { isLoading: isRequesting }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  async function requestReset() {
    setMessage(null);
    if (!appConfig.hospitalId || !email) {
      setMessage("Enter your email first.");
      return;
    }
    try {
      const response = await forgotPassword({ hospitalId: appConfig.hospitalId, email }).unwrap();
      setResetToken(response.resetToken || "");
      setMessage(response.resetToken ? "Reset token received. Set a new password below." : "Reset instructions sent.");
    } catch {
      setMessage("Could not request a password reset.");
    }
  }

  async function submitReset() {
    setMessage(null);
    if (!resetToken || newPassword.length < 8) {
      setMessage("Enter the reset token and a new password of at least 8 characters.");
      return;
    }
    try {
      await resetPassword({ token: resetToken, newPassword }).unwrap();
      setMessage("Password reset. You can sign in now.");
      setNewPassword("");
    } catch {
      setMessage("Could not reset password.");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-5">
      <div className="w-full max-w-md panel rounded p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded bg-[var(--cr-brand)] text-white grid place-items-center">
            <Icons.hospital size={18} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Forgot password</h1>
            <p className="text-sm ink-mute">Request a reset token and set a new password.</p>
          </div>
        </div>
        <Field label="Email">
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <button className="btn w-full justify-center" onClick={requestReset} disabled={isRequesting}>
          {isRequesting ? "Requesting..." : "Request reset token"}
        </button>
        <Field label="Reset token">
          <input className="input mono" value={resetToken} onChange={(e) => setResetToken(e.target.value)} />
        </Field>
        <Field label="New password">
          <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </Field>
        <button className="btn btn-primary w-full justify-center" onClick={submitReset} disabled={isResetting}>
          {isResetting ? "Resetting..." : "Set new password"}
        </button>
        {message && <div className="text-center text-sm ink-mute">{message}</div>}
        <div className="text-center text-sm"><Link className="text-[var(--cr-brand)] hover:underline" to="/login">Back to sign in</Link></div>
      </div>
    </div>
  );
}
