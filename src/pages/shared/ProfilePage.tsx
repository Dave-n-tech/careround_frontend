import { useAppSelector } from "@/app/hooks";

export default function ProfilePage() {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold text-[var(--cr-ink)] mb-1">Profile</h1>
      <p className="text-sm text-[var(--cr-muted)] mb-6">Your account details.</p>

      {user && (
        <div className="bg-white border border-[var(--cr-line)] rounded-lg p-6 flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cr-muted)]">Name</p>
            <p className="text-sm text-[var(--cr-ink)] mt-0.5">{user.firstName} {user.lastName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cr-muted)]">Email</p>
            <p className="text-sm text-[var(--cr-ink)] mt-0.5">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cr-muted)]">Role</p>
            <p className="text-sm text-[var(--cr-ink)] mt-0.5">{user.role}</p>
          </div>
        </div>
      )}

      <p className="text-xs text-[var(--cr-muted)] mt-6">
        Password change and full profile editing — coming in a later step.
      </p>
    </div>
  );
}
