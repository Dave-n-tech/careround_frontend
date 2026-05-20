import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import {
  useGetWardsQuery,
  useCreateWardMutation,
  useUpdateWardMutation,
} from "@/services/api/wards";
import { MOCK_WARDS } from "@/lib/mock-data";
import type { Ward } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";

// ─── Ward modal ───────────────────────────────────────────────────────────────

interface WardForm {
  name: string;
  specialty: string;
  totalBeds: string;
}

const EMPTY_FORM: WardForm = { name: "", specialty: "", totalBeds: "" };

interface WardModalProps {
  open: boolean;
  onClose: () => void;
  existing?: Ward;
  onSave: (form: WardForm) => Promise<void>;
}

function WardModal({ open, onClose, existing, onSave }: WardModalProps) {
  const [form, setForm] = useState<WardForm>(
    existing
      ? { name: existing.name, specialty: existing.specialty ?? "", totalBeds: String(existing.totalBeds) }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState<Partial<WardForm>>({});
  const [loading, setLoading] = useState(false);

  // Reset when modal opens/changes
  useState(() => {
    if (open) {
      setForm(
        existing
          ? { name: existing.name, specialty: existing.specialty ?? "", totalBeds: String(existing.totalBeds) }
          : EMPTY_FORM
      );
      setErrors({});
    }
  });

  function set(field: keyof WardForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<WardForm> = {};
    if (!form.name.trim()) errs.name = "Ward name is required";
    if (!form.totalBeds || Number(form.totalBeds) < 1) errs.totalBeds = "At least 1 bed required";
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
    <Modal open={open} onClose={onClose} title={existing ? "Edit Ward" : "Add Ward"}>
      <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
        <Input
          label="Ward Name *"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Soyinka Ward"
          error={errors.name}
        />
        <Input
          label="Specialty"
          value={form.specialty}
          onChange={(e) => set("specialty", e.target.value)}
          placeholder="e.g. General Medicine"
        />
        <Input
          label="Total Beds *"
          type="number"
          min={1}
          value={form.totalBeds}
          onChange={(e) => set("totalBeds", e.target.value)}
          placeholder="20"
          error={errors.totalBeds}
        />
        <div className="flex justify-end gap-3 pt-2 border-t border-[var(--cr-line)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {existing ? "Save Changes" : "Create Ward"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminWards() {
  const { data: wardsData } = useGetWardsQuery();
  const [createWard] = useCreateWardMutation();
  const [updateWard] = useUpdateWardMutation();

  const wards = wardsData ?? MOCK_WARDS;

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Ward | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Ward | null>(null);
  const [toggling, setToggling] = useState(false);

  async function handleCreate(form: WardForm) {
    await createWard({
      name: form.name,
      specialty: form.specialty || undefined,
      totalBeds: Number(form.totalBeds),
    }).unwrap();
  }

  async function handleEdit(form: WardForm) {
    if (!editTarget) return;
    await updateWard({
      id: editTarget.id,
      name: form.name,
      specialty: form.specialty || undefined,
      totalBeds: Number(form.totalBeds),
    }).unwrap();
  }

  async function handleToggleStatus() {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      await updateWard({ id: toggleTarget.id, isActive: !toggleTarget.isActive }).unwrap();
    } finally {
      setToggling(false);
      setToggleTarget(null);
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--cr-ink)]">Wards</h1>
          <p className="text-sm text-[var(--cr-muted)] mt-0.5">{wards.length} ward{wards.length !== 1 ? "s" : ""} total</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
          <Plus size={14} />
          Add Ward
        </Button>
      </div>

      <div className="bg-white border border-[var(--cr-line)] rounded-lg overflow-hidden">
        {wards.length === 0 ? (
          <EmptyState
            message="No wards yet"
            sub="Add your first ward to get started."
            actionLabel="Add Ward"
            onAction={() => setAddOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="cr">
              <thead>
                <tr>
                  <th>Ward Name</th>
                  <th>Specialty</th>
                  <th>Total Beds</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {wards.map((ward) => (
                  <tr key={ward.id} className="row-hover">
                    <td className="font-medium text-[var(--cr-ink)]">{ward.name}</td>
                    <td className="text-[var(--cr-ink-2)]">{ward.specialty ?? "—"}</td>
                    <td className="text-[var(--cr-ink-2)]">{ward.totalBeds}</td>
                    <td>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                          ward.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {ward.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Edit"
                          onClick={() => setEditTarget(ward)}
                        >
                          <Pencil size={13} />
                        </Button>
                        <button
                          onClick={() => setToggleTarget(ward)}
                          className={`text-xs font-medium transition-colors ${
                            ward.isActive
                              ? "text-[var(--cr-muted)] hover:text-[var(--cr-danger)]"
                              : "text-[var(--cr-muted)] hover:text-[var(--cr-accent)]"
                          }`}
                        >
                          {ward.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add modal */}
      <WardModal open={addOpen} onClose={() => setAddOpen(false)} onSave={handleCreate} />

      {/* Edit modal */}
      {editTarget && (
        <WardModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          existing={editTarget}
          onSave={handleEdit}
        />
      )}

      {/* Toggle status confirm */}
      <ConfirmModal
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleStatus}
        title={toggleTarget?.isActive ? "Deactivate Ward?" : "Activate Ward?"}
        body={
          toggleTarget?.isActive
            ? `${toggleTarget.name} will no longer appear as an active ward.`
            : `${toggleTarget?.name} will be marked as active again.`
        }
        confirmLabel={toggleTarget?.isActive ? "Deactivate" : "Activate"}
        variant={toggleTarget?.isActive ? "destructive" : "primary"}
        loading={toggling}
      />
    </div>
  );
}
