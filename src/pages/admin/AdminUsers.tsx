import { useState, useMemo } from "react";
import { Plus, Pencil, Building2 } from "lucide-react";
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeactivateUserMutation,
  useReactivateUserMutation,
  useAssignWardMutation,
} from "@/services/api/users";
import { useGetWardsQuery } from "@/services/api/wards";
import type { Role, User } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/utils/format";

type TabFilter = "ALL" | "DOCTOR" | "NURSE" | "SUPERVISOR";

const ROLE_OPTIONS = [
  { value: "DOCTOR", label: "Doctor" },
  { value: "NURSE", label: "Nurse" },
  { value: "SUPERVISOR", label: "Supervisor" },
];

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  SUPERVISOR: "Supervisor",
};

// ─── User modal ───────────────────────────────────────────────────────────────

interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  password: string;
}

const EMPTY_FORM: UserForm = {
  firstName: "",
  lastName: "",
  email: "",
  role: "DOCTOR",
  password: "",
};

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  existing?: User;
  onSave: (form: UserForm) => Promise<void>;
}

function UserModal({ open, onClose, existing, onSave }: UserModalProps) {
  const [form, setForm] = useState<UserForm>(
    existing
      ? { firstName: existing.firstName, lastName: existing.lastName, email: existing.email, role: existing.role, password: "" }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState<Partial<UserForm>>({});
  const [loading, setLoading] = useState(false);

  function set(field: keyof UserForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<UserForm> = {};
    if (!form.firstName.trim()) errs.firstName = "Required";
    if (!form.lastName.trim()) errs.lastName = "Required";
    if (!form.email.trim()) errs.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email";
    if (!form.role) errs.role = "Required";
    if (!existing && !form.password) errs.password = "Required";
    if (!existing && form.password && form.password.length < 8)
      errs.password = "At least 8 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={existing ? "Edit User" : "Add User"}>
      <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name *"
            value={form.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            error={errors.firstName}
          />
          <Input
            label="Last Name *"
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            error={errors.lastName}
          />
        </div>
        <Input
          label="Email *"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          error={errors.email}
        />
        <Select
          label="Role *"
          value={form.role}
          onChange={(e) => set("role", e.target.value)}
          options={ROLE_OPTIONS}
          error={errors.role}
        />
        {!existing && (
          <Input
            label="Temporary Password *"
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            hint="Min 8 characters"
            error={errors.password}
          />
        )}
        <div className="flex justify-end gap-3 pt-2 border-t border-[var(--cr-line)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {existing ? "Save Changes" : "Create User"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Assign ward modal ────────────────────────────────────────────────────────

interface AssignWardModalProps {
  open: boolean;
  onClose: () => void;
  user: User;
  onSave: (wardId: string) => Promise<void>;
}

function AssignWardModal({ open, onClose, user, onSave }: AssignWardModalProps) {
  const { data: wardsData } = useGetWardsQuery();
  const activeWards = (wardsData ?? []).filter((w) => w.isActive);
  const [wardId, setWardId] = useState(user.wardId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wardId) { setError("Please select a ward"); return; }
    setLoading(true);
    try {
      await onSave(wardId);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Assign Ward">
      <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
        <p className="text-sm text-[var(--cr-muted)]">
          Assigning ward for <strong>{user.firstName} {user.lastName}</strong> ({ROLE_LABELS[user.role]})
        </p>
        {user.wardId && (
          <div className="px-3 py-2 rounded bg-[var(--cr-surface-3)] text-xs text-[var(--cr-muted)]">
            Current ward: <strong className="text-[var(--cr-ink)]">
              {activeWards.find((w) => w.id === user.wardId)?.name ?? user.wardId}
            </strong>
          </div>
        )}
        <Select
          label="Ward *"
          value={wardId}
          onChange={(e) => { setWardId(e.target.value); setError(""); }}
          options={activeWards.map((w) => ({ value: w.id, label: `${w.name}${w.specialty ? ` — ${w.specialty}` : ""}` }))}
          error={error}
        />
        <div className="flex justify-end gap-3 pt-2 border-t border-[var(--cr-line)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading}>Assign Ward</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminUsers() {
  const { data: usersData } = useGetUsersQuery();
  const { data: wardsData } = useGetWardsQuery();
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [reactivateUser] = useReactivateUserMutation();
  const [assignWard] = useAssignWardMutation();

  const allUsers = usersData ?? [];
  const wardsById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const w of wardsData ?? []) map[w.id] = w.name;
    return map;
  }, [wardsData]);

  const [tab, setTab] = useState<TabFilter>("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [assignTarget, setAssignTarget] = useState<User | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [actioning, setActioning] = useState(false);

  const filtered = useMemo(() => {
    if (tab === "ALL") return allUsers.filter((u) => u.role !== "ADMIN");
    return allUsers.filter((u) => u.role === tab);
  }, [allUsers, tab]);

  async function handleCreate(form: UserForm) {
    await createUser({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      role: form.role as Role,
      password: form.password,
    }).unwrap();
  }

  async function handleEdit(form: UserForm) {
    if (!editTarget) return;
    await updateUser({
      id: editTarget.id,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      role: form.role as Role,
    }).unwrap();
  }

  async function handleAssignWard(wardId: string) {
    if (!assignTarget) return;
    await assignWard({ userId: assignTarget.id, wardId }).unwrap();
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setActioning(true);
    try {
      if (deactivateTarget.active) {
        await deactivateUser(deactivateTarget.id).unwrap();
      } else {
        await reactivateUser(deactivateTarget.id).unwrap();
      }
    } finally {
      setActioning(false);
      setDeactivateTarget(null);
    }
  }

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "DOCTOR", label: "Doctors" },
    { key: "NURSE", label: "Nurses" },
    { key: "SUPERVISOR", label: "Supervisors" },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--cr-ink)]">Medical Staff</h1>
          <p className="text-sm text-[var(--cr-muted)] mt-0.5">{allUsers.filter(u => u.role !== "ADMIN").length} staff accounts</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
          <Plus size={14} />
          Add User
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[var(--cr-surface-3)] p-1 rounded-lg w-fit">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === key
                ? "bg-white text-[var(--cr-ink)] shadow-sm"
                : "text-[var(--cr-muted)] hover:text-[var(--cr-ink)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[var(--cr-line)] rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState message={`No ${tab === "ALL" ? "staff" : tab.toLowerCase() + "s"} found`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="cr">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Ward</th>
                  <th>Status</th>
                  <th>Date Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const canBeAssigned = user.role === "NURSE" || user.role === "SUPERVISOR";
                  return (
                  <tr key={user.id} className="row-hover">
                    <td className="font-medium text-[var(--cr-ink)]">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="text-[var(--cr-ink-2)]">{user.email}</td>
                    <td className="text-[var(--cr-ink-2)]">{ROLE_LABELS[user.role]}</td>
                    <td>
                      {canBeAssigned ? (
                        user.wardId ? (
                          <span className="text-sm text-[var(--cr-ink-2)]">
                            {wardsById[user.wardId] ?? user.wardId}
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600 font-medium">Unassigned</span>
                        )
                      ) : (
                        <span className="text-xs text-[var(--cr-muted)]">—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                          user.active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {user.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-[var(--cr-muted)] text-xs">{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Edit"
                          onClick={() => setEditTarget(user)}
                        >
                          <Pencil size={13} />
                        </Button>
                        {canBeAssigned && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Assign Ward"
                            onClick={() => setAssignTarget(user)}
                          >
                            <Building2 size={13} />
                          </Button>
                        )}
                        <button
                          onClick={() => setDeactivateTarget(user)}
                          className={`text-xs font-medium transition-colors ${
                            user.active
                              ? "text-[var(--cr-muted)] hover:text-[var(--cr-danger)]"
                              : "text-[var(--cr-muted)] hover:text-[var(--cr-accent)]"
                          }`}
                        >
                          {user.active ? "Deactivate" : "Reactivate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserModal open={addOpen} onClose={() => setAddOpen(false)} onSave={handleCreate} />

      {editTarget && (
        <UserModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          existing={editTarget}
          onSave={handleEdit}
        />
      )}

      {assignTarget && (
        <AssignWardModal
          open={!!assignTarget}
          onClose={() => setAssignTarget(null)}
          user={assignTarget}
          onSave={handleAssignWard}
        />
      )}

      <ConfirmModal
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title={deactivateTarget?.active ? "Deactivate User?" : "Reactivate User?"}
        body={
          deactivateTarget?.active
            ? `${deactivateTarget.firstName} ${deactivateTarget.lastName} will no longer be able to log in.`
            : `${deactivateTarget?.firstName} ${deactivateTarget?.lastName} will be able to log in again.`
        }
        confirmLabel={deactivateTarget?.active ? "Deactivate" : "Reactivate"}
        variant={deactivateTarget?.active ? "destructive" : "primary"}
        loading={actioning}
      />
    </div>
  );
}
