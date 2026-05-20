import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Check } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { clearAuth, patchUser } from "@/features/auth/authSlice";
import { useUpdateUserMutation, useLogoutMutation, useChangePasswordMutation } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Role } from "@/types/domain";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  SUPERVISOR: "Supervisor",
};

const ROLE_COLOR: Record<Role, string> = {
  ADMIN:      "bg-purple-100 text-purple-700",
  DOCTOR:     "bg-teal-100 text-teal-700",
  NURSE:      "bg-blue-100 text-blue-700",
  SUPERVISOR: "bg-amber-100 text-amber-700",
};

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

// ─── Inline save feedback ─────────────────────────────────────────────────────

type SaveState = "idle" | "saving" | "saved" | "error";

function useSaveState() {
  const [state, setState] = useState<SaveState>("idle");
  function saved() {
    setState("saved");
    setTimeout(() => setState("idle"), 2500);
  }
  return { state, setState, saved };
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[var(--cr-line)] rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--cr-line)] bg-[var(--cr-surface-2)]">
        <h2 className="text-sm font-semibold text-[var(--cr-ink)]">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

// ─── Personal details section ─────────────────────────────────────────────────

function PersonalDetails() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [updateUser] = useUpdateUserMutation();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const { state: saveState, setState: setSaveState, saved } = useSaveState();

  function startEdit() {
    if (!user) return;
    setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveState("idle");
  }

  async function handleSave() {
    if (!user) return;
    setSaveState("saving");
    try {
      await updateUser({ id: user.id, ...form }).unwrap();
      dispatch(patchUser(form));
      setEditing(false);
      saved();
    } catch {
      setSaveState("error");
    }
  }

  if (!user) return null;

  return (
    <SectionCard title="Personal Details">
      {!editing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cr-muted)]">First Name</p>
              <p className="text-sm text-[var(--cr-ink)] mt-1">{user.firstName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cr-muted)]">Last Name</p>
              <p className="text-sm text-[var(--cr-ink)] mt-1">{user.lastName}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cr-muted)]">Email</p>
            <p className="text-sm text-[var(--cr-ink)] mt-1">{user.email}</p>
          </div>
          <div className="flex items-center justify-between pt-1">
            {saveState === "saved" && (
              <span className="flex items-center gap-1.5 text-xs text-green-600">
                <Check size={13} /> Saved
              </span>
            )}
            {saveState === "error" && (
              <span className="text-xs text-[var(--cr-danger)]">Save failed — try again.</span>
            )}
            {saveState === "idle" && <span />}
            <Button variant="outline" size="sm" onClick={startEdit}>Edit</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              autoFocus
            />
            <Input
              label="Last Name"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          {saveState === "error" && (
            <p className="text-xs text-[var(--cr-danger)]">Save failed — please try again.</p>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" size="sm" onClick={cancelEdit} disabled={saveState === "saving"}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              loading={saveState === "saving"}
              disabled={!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()}
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Change password section ──────────────────────────────────────────────────

function ChangePassword() {
  const [changePassword] = useChangePasswordMutation();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const { state: saveState, setState: setSaveState, saved } = useSaveState();

  const mismatch = form.next.length > 0 && form.confirm.length > 0 && form.next !== form.confirm;
  const tooShort = form.next.length > 0 && form.next.length < 8;
  const canSubmit = form.current && form.next && form.confirm && !mismatch && !tooShort;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaveState("saving");
    try {
      await changePassword({ currentPassword: form.current, newPassword: form.next }).unwrap();
      setForm({ current: "", next: "", confirm: "" });
      saved();
    } catch {
      setSaveState("error");
    }
  }

  return (
    <SectionCard title="Change Password">
      <form onSubmit={handleSave} className="space-y-4">
        <Input
          label="Current Password"
          type="password"
          value={form.current}
          onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
          autoComplete="current-password"
        />
        <Input
          label="New Password"
          type="password"
          value={form.next}
          onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))}
          hint={tooShort ? "Minimum 8 characters" : undefined}
          autoComplete="new-password"
        />
        <Input
          label="Confirm New Password"
          type="password"
          value={form.confirm}
          onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
          hint={mismatch ? "Passwords don't match" : undefined}
          autoComplete="new-password"
        />
        {saveState === "error" && (
          <p className="text-xs text-[var(--cr-danger)]">
            Password update failed — check your current password and try again.
          </p>
        )}
        <div className="flex items-center justify-between pt-1">
          {saveState === "saved" ? (
            <span className="flex items-center gap-1.5 text-xs text-green-600">
              <Check size={13} /> Password updated
            </span>
          ) : <span />}
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={saveState === "saving"}
            disabled={!canSubmit}
          >
            Update Password
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

// ─── Main profile page ────────────────────────────────────────────────────────

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, role } = useAppSelector((s) => s.auth);
  const [logout] = useLogoutMutation();

  async function handleLogout() {
    try { await logout().unwrap(); } catch { /* ignore */ }
    dispatch(clearAuth());
    navigate("/login", { replace: true });
  }

  if (!user || !role) return null;

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Avatar + name header */}
      <div className="flex items-center gap-4 mb-7">
        <div className="w-14 h-14 rounded-full bg-[var(--cr-accent)] flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-white">
            {initials(user.firstName, user.lastName)}
          </span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--cr-ink)] leading-tight">
            {user.firstName} {user.lastName}
          </h1>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLOR[role]}`}>
            {ROLE_LABEL[role]}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <PersonalDetails />
        <ChangePassword />

        {/* Sign out */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-[var(--cr-muted)] hover:text-[var(--cr-danger)] transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
