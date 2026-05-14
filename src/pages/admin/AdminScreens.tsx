import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Field, Icons, Modal, RoleBadge, StatCard, useToast } from "@/components/ui";
import { PageHeader } from "@/layouts/PageHeader";
import { AdmissionForm } from "@/pages/clinical/SharedScreens";
import {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useGetOnCallRotationsQuery,
  useGetShiftSchedulesQuery,
  useGetTeamsQuery,
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetWardsQuery,
  useGetWardByIdQuery,
  useGetMyHospitalQuery,
  useGetSystemConfigQuery,
  useGetAdminDashboardQuery,
  useGetPatientsByWardQuery,
  useGetCurrentShiftQuery,
  useAssignWardToTeamMutation,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useCreateOnCallRotationMutation,
  useDeleteOnCallRotationMutation,
  useCreateShiftScheduleMutation,
  useDeactivateShiftScheduleMutation,
  useCreateTeamMutation,
  useCreateWardMutation,
  useUpdateWardMutation,
  useDeleteWardMutation,
  useCreateUserMutation,
  useDeactivateUserMutation,
  useUpdateMyHospitalMutation,
  useUpdateSystemConfigMutation
} from "@/services/api";
import { getDept, getUser, userFullName } from "@/utils/format";
import { skipToken } from "@reduxjs/toolkit/query/react";

function datetimeLocalToOffsetIso(value: string) {
  const date = new Date(value);
  const p = (n: number) => String(Math.abs(n)).padStart(2, "0");
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const hours = Math.trunc(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  return `${value}:00${sign}${p(hours)}:${p(minutes)}`;
}

function fmtLocal(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

export function AdminDashboard() {
  const { data: hospital } = useGetMyHospitalQuery();
  const { data: config } = useGetSystemConfigQuery();
  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: wards = [] } = useGetWardsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const { data: adminDashboard, isError: isDashboardError } = useGetAdminDashboardQuery();

  const stats = useMemo(
    () => [
      {
        label: "Departments",
        value: departments.length,
        sub: `${departments.length} active`,
        accent: "#0b5cab",
        icon: <Icons.building size={18} />
      },
      {
        label: "Wards",
        value: wards.length,
        sub: `${wards.reduce((a, w) => a + (w.totalBeds || 0), 0)} beds total`,
        accent: "#0e7490",
        icon: <Icons.bed size={18} />
      },
      {
        label: "Active Users",
        value: users.filter((u) => u.active).length,
        sub: `${users.filter((u) => u.role === "NURSE").length} nurses · ${users.filter((u) => u.role === "CONSULTANT").length} consultants`,
        accent: "#7c3aed",
        icon: <Icons.team size={18} />
      },
      {
        label: "Hospital",
        value: hospital ? hospital.name.split(" ")[0] : "—",
        sub: hospital?.contactEmail || "—",
        accent: "#15803d",
        icon: <Icons.hospital size={18} />
      }
    ],
    [departments, hospital, users, wards]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hospital overview</h1>
        <p className="ink-mute text-sm mt-0.5">{hospital?.name || "—"} · {hospital?.address || ""}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {isDashboardError && (
        <div className="panel rounded border-l-4 border-l-amber-500 p-4 text-sm text-amber-800">
          Could not load /dashboard/admin. Resource lists below are still live from backend.
        </div>
      )}

      {adminDashboard && Object.keys(adminDashboard).length > 0 && (
        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">Backend dashboard summary</div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(adminDashboard).slice(0, 8).map(([key, value]) => (
              <div key={key} className="border hairline rounded p-3">
                <div className="field-label">{key.replace(/([A-Z])/g, " $1").toLowerCase()}</div>
                <div className="font-semibold mt-1">{String(value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel rounded lg:col-span-2">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">Wards</div>
          <table className="cr">
            <thead>
              <tr>
                <th>Ward</th>
                <th>Specialty</th>
                <th>Beds</th>
                <th>Supervisor</th>
              </tr>
            </thead>
            <tbody>
              {wards.map((w) => {
                const s = w.supervisorId ? getUser(users, w.supervisorId) : undefined;
                return (
                  <tr key={w.id}>
                    <td className="font-medium">{w.name}</td>
                    <td className="ink-2">{w.specialty || "—"}</td>
                    <td className="mono text-xs">{w.totalBeds}</td>
                    <td className="ink-2">{s ? `${s.firstName} ${s.lastName}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">System configuration</div>
          <div className="p-4 space-y-3 text-sm">
            <ConfigRow label="NEWS amber threshold" value={config ? `≥ ${config.newsAmberThreshold}` : "—"} />
            <ConfigRow label="NEWS red threshold" value={config ? `≥ ${config.newsRedThreshold}` : "—"} />
            <ConfigRow label="Task overdue grace" value={config ? `${config.taskOverdueGraceMinutes} min` : "—"} />
            <ConfigRow label="Round notifications" value={config?.roundNotificationsEnabled ? "Enabled" : "Disabled"} />
            <ConfigRow label="Next-of-kin notifications" value={config?.nokNotificationEnabled ? "Enabled" : "Disabled"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b hairline pb-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="ink-mute">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// ─── Departments ──────────────────────────────────────────────────────────────

export function AdminDepartments() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: departments = [], isLoading } = useGetDepartmentsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const [createDepartment, { isLoading: isCreating }] = useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdating }] = useUpdateDepartmentMutation();
  const [deleteDepartment] = useDeleteDepartmentMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [headId, setHeadId] = useState<string>("");

  const [editDept, setEditDept] = useState<{ id: string; name: string; headOfDepartmentId?: string | null } | null>(null);
  const [editName, setEditName] = useState("");
  const [editHeadId, setEditHeadId] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function submit() {
    if (!name) return;
    try {
      await createDepartment({ name, headOfDepartmentId: headId || undefined }).unwrap();
      toast({ kind: "success", title: "Department created" });
      setCreateOpen(false);
      setName("");
      setHeadId("");
    } catch {
      toast({ kind: "error", title: "Could not create department" });
    }
  }

  function openEdit(d: typeof editDept) {
    if (!d) return;
    setEditDept(d);
    setEditName(d.name);
    setEditHeadId(d.headOfDepartmentId || "");
  }

  async function submitEdit() {
    if (!editDept || !editName) return;
    try {
      await updateDepartment({ id: editDept.id, name: editName, headOfDepartmentId: editHeadId || undefined }).unwrap();
      toast({ kind: "success", title: "Department updated" });
      setEditDept(null);
    } catch {
      toast({ kind: "error", title: "Could not update department" });
    }
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    try {
      await deleteDepartment(confirmDeleteId).unwrap();
      toast({ kind: "success", title: "Department deleted" });
      setConfirmDeleteId(null);
    } catch {
      toast({ kind: "error", title: "Could not delete department" });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Departments" subtitle="Clinical divisions of the hospital">
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Icons.plus size={14} />New department
        </button>
      </PageHeader>
      {isLoading ? (
        <div className="panel rounded p-8 text-center ink-mute">Loading departments…</div>
      ) : (
        <div className="panel rounded overflow-hidden">
          <table className="cr">
            <thead>
              <tr>
                <th>Name</th>
                <th>Head of department</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => {
                const head = d.headOfDepartmentId ? getUser(users, d.headOfDepartmentId) : undefined;
                return (
                  <tr key={d.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/admin/departments/${d.id}`)}>
                    <td className="font-medium">{d.name}</td>
                    <td className="ink-2">{head ? `${head.firstName} ${head.lastName}` : "—"}</td>
                    <td className="ink-2 mono text-xs">{d.createdAt?.slice(0, 10)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button className="btn btn-ghost p-1.5" title="Edit" onClick={() => openEdit(d)}>
                          <Icons.edit size={13} />
                        </button>
                        <button className="btn btn-ghost p-1.5 text-red-600" title="Delete" onClick={() => setConfirmDeleteId(d.id)}>
                          <Icons.trash size={13} />
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

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New department"
        footer={
          <>
            <button className="btn" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={isCreating}>
              {isCreating ? "Creating…" : "Create"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <Field label="Department name" required>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Neurology" />
          </Field>
          <Field label="Head of department">
            <select className="select" value={headId} onChange={(e) => setHeadId(e.target.value)}>
              <option value="">—</option>
              {users.filter((u) => u.role === "CONSULTANT").map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editDept} onClose={() => setEditDept(null)} title="Edit department"
        footer={
          <>
            <button className="btn" onClick={() => setEditDept(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitEdit} disabled={isUpdating}>
              {isUpdating ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <Field label="Department name" required>
            <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </Field>
          <Field label="Head of department">
            <select className="select" value={editHeadId} onChange={(e) => setEditHeadId(e.target.value)}>
              <option value="">—</option>
              {users.filter((u) => u.role === "CONSULTANT").map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Delete department"
        footer={
          <>
            <button className="btn" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
            <button className="btn" style={{ background: "#b91c1c", color: "white" }} onClick={confirmDelete}>Delete</button>
          </>
        }
      >
        <p className="text-sm ink-2">Are you sure you want to delete this department? This cannot be undone.</p>
      </Modal>
    </div>
  );
}

export function AdminDepartmentDetail() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const { data: dept, isLoading } = useGetDepartmentByIdQuery(id ?? skipToken);
  const { data: users = [] } = useGetUsersQuery();
  const [updateDepartment, { isLoading: isUpdating }] = useUpdateDepartmentMutation();
  const [deleteDepartment] = useDeleteDepartmentMutation();

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editHeadId, setEditHeadId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) return <div className="panel rounded p-8 text-center ink-mute">Loading…</div>;
  if (!dept) return <div className="panel rounded p-8 text-center ink-mute">Department not found.</div>;

  const head = dept.headOfDepartmentId ? getUser(users, dept.headOfDepartmentId) : undefined;
  const deptUsers = users.filter((u) => u.departmentId === id);

  function openEdit() {
    setEditName(dept!.name);
    setEditHeadId(dept!.headOfDepartmentId || "");
    setEditOpen(true);
  }

  async function submitEdit() {
    if (!id || !editName) return;
    try {
      await updateDepartment({ id, name: editName, headOfDepartmentId: editHeadId || undefined }).unwrap();
      toast({ kind: "success", title: "Department updated" });
      setEditOpen(false);
    } catch {
      toast({ kind: "error", title: "Could not update department" });
    }
  }

  async function doDelete() {
    if (!id) return;
    try {
      await deleteDepartment(id).unwrap();
      toast({ kind: "success", title: "Department deleted" });
      navigate("/admin/departments");
    } catch {
      toast({ kind: "error", title: "Could not delete department" });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={dept.name} subtitle="Department details">
        <button className="btn" onClick={openEdit}><Icons.edit size={14} />Edit</button>
        <button className="btn" style={{ color: "#b91c1c" }} onClick={() => setConfirmDelete(true)}><Icons.trash size={14} />Delete</button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel rounded p-4 space-y-3">
          <div className="field-label">Department information</div>
          <div>
            <div className="text-xs ink-mute">Name</div>
            <div className="font-semibold">{dept.name}</div>
          </div>
          <div>
            <div className="text-xs ink-mute">Head of department</div>
            <div className="font-semibold">{head ? `${head.firstName} ${head.lastName}` : "—"}</div>
          </div>
          <div>
            <div className="text-xs ink-mute">Created</div>
            <div className="mono text-xs">{dept.createdAt?.slice(0, 10)}</div>
          </div>
        </div>

        <div className="panel rounded lg:col-span-2">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">Staff in this department ({deptUsers.length})</div>
          <table className="cr">
            <thead>
              <tr><th>Name</th><th>Role</th><th>Status</th></tr>
            </thead>
            <tbody>
              {deptUsers.length === 0 ? (
                <tr><td colSpan={3} className="text-center ink-mute p-4">No users assigned.</td></tr>
              ) : deptUsers.map((u) => (
                <tr key={u.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/admin/users/${u.id}`)}>
                  <td className="font-medium">{u.firstName} {u.lastName}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>
                    <span className="chip" style={{ background: u.active ? "#dcfce7" : "#e2e8f0", color: u.active ? "#166534" : "#475569" }}>
                      {u.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit department"
        footer={
          <>
            <button className="btn" onClick={() => setEditOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitEdit} disabled={isUpdating}>
              {isUpdating ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <Field label="Department name" required>
            <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </Field>
          <Field label="Head of department">
            <select className="select" value={editHeadId} onChange={(e) => setEditHeadId(e.target.value)}>
              <option value="">—</option>
              {users.filter((u) => u.role === "CONSULTANT").map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete department"
        footer={
          <>
            <button className="btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
            <button className="btn" style={{ background: "#b91c1c", color: "white" }} onClick={doDelete}>Delete</button>
          </>
        }
      >
        <p className="text-sm ink-2">Are you sure you want to delete <strong>{dept.name}</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  );
}

// ─── Wards ────────────────────────────────────────────────────────────────────

export function AdminWards() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: wards = [], isLoading } = useGetWardsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const [createWard, { isLoading: isCreating }] = useCreateWardMutation();
  const [updateWard, { isLoading: isUpdating }] = useUpdateWardMutation();
  const [deleteWard] = useDeleteWardMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [beds, setBeds] = useState(20);
  const [supervisorId, setSupervisorId] = useState("");

  const [editWard, setEditWard] = useState<typeof wards[0] | null>(null);
  const [editName, setEditName] = useState("");
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editBeds, setEditBeds] = useState(20);
  const [editSupervisorId, setEditSupervisorId] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function submitCreate() {
    if (!name) return;
    try {
      await createWard({ name, specialty: specialty || undefined, totalBeds: beds, supervisorId: supervisorId || undefined }).unwrap();
      toast({ kind: "success", title: "Ward created" });
      setCreateOpen(false);
      setName(""); setSpecialty(""); setBeds(20); setSupervisorId("");
    } catch {
      toast({ kind: "error", title: "Could not create ward" });
    }
  }

  function openEdit(w: typeof wards[0]) {
    setEditWard(w);
    setEditName(w.name);
    setEditSpecialty(w.specialty || "");
    setEditBeds(w.totalBeds);
    setEditSupervisorId(w.supervisorId || "");
  }

  async function submitEdit() {
    if (!editWard || !editName) return;
    try {
      await updateWard({ id: editWard.id, name: editName, specialty: editSpecialty || undefined, totalBeds: editBeds, supervisorId: editSupervisorId || undefined }).unwrap();
      toast({ kind: "success", title: "Ward updated" });
      setEditWard(null);
    } catch {
      toast({ kind: "error", title: "Could not update ward" });
    }
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    try {
      await deleteWard(confirmDeleteId).unwrap();
      toast({ kind: "success", title: "Ward deleted" });
      setConfirmDeleteId(null);
    } catch {
      toast({ kind: "error", title: "Could not delete ward" });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Wards" subtitle="Patient care units">
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Icons.plus size={14} />New ward
        </button>
      </PageHeader>
      {isLoading ? (
        <div className="panel rounded p-8 text-center ink-mute">Loading wards…</div>
      ) : (
        <div className="panel rounded overflow-hidden">
          <table className="cr">
            <thead>
              <tr>
                <th>Ward</th><th>Specialty</th><th>Total beds</th><th>Supervisor</th><th></th>
              </tr>
            </thead>
            <tbody>
              {wards.map((w) => (
                <tr key={w.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/admin/wards/${w.id}`)}>
                  <td className="font-medium">{w.name}</td>
                  <td className="ink-2">{w.specialty || "—"}</td>
                  <td className="mono">{w.totalBeds}</td>
                  <td className="ink-2">{w.supervisorId ? `${getUser(users, w.supervisorId)?.firstName || ""} ${getUser(users, w.supervisorId)?.lastName || ""}`.trim() : "—"}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button className="btn btn-ghost p-1.5" title="Edit" onClick={() => openEdit(w)}>
                        <Icons.edit size={13} />
                      </button>
                      <button className="btn btn-ghost p-1.5 text-red-600" title="Delete" onClick={() => setConfirmDeleteId(w.id)}>
                        <Icons.trash size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New ward"
        footer={
          <>
            <button className="btn" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitCreate} disabled={isCreating}>
              {isCreating ? "Creating…" : "Create"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Ward name" required><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Specialty"><input className="input" value={specialty} onChange={(e) => setSpecialty(e.target.value)} /></Field>
          <Field label="Number of beds" required><input className="input" type="number" min={1} max={200} value={beds} onChange={(e) => setBeds(Number(e.target.value))} /></Field>
          <Field label="Ward supervisor">
            <select className="select" value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)}>
              <option value="">—</option>
              {users.filter((u) => u.role === "WARD_SUPERVISOR").map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>

      <Modal open={!!editWard} onClose={() => setEditWard(null)} title="Edit ward"
        footer={
          <>
            <button className="btn" onClick={() => setEditWard(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitEdit} disabled={isUpdating}>
              {isUpdating ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Ward name" required><input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} /></Field>
          <Field label="Specialty"><input className="input" value={editSpecialty} onChange={(e) => setEditSpecialty(e.target.value)} /></Field>
          <Field label="Number of beds" required><input className="input" type="number" min={1} max={200} value={editBeds} onChange={(e) => setEditBeds(Number(e.target.value))} /></Field>
          <Field label="Ward supervisor">
            <select className="select" value={editSupervisorId} onChange={(e) => setEditSupervisorId(e.target.value)}>
              <option value="">—</option>
              {users.filter((u) => u.role === "WARD_SUPERVISOR").map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>

      <Modal open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Delete ward"
        footer={
          <>
            <button className="btn" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
            <button className="btn" style={{ background: "#b91c1c", color: "white" }} onClick={confirmDelete}>Delete</button>
          </>
        }
      >
        <p className="text-sm ink-2">Are you sure you want to delete this ward? This cannot be undone.</p>
      </Modal>
    </div>
  );
}

export function AdminWardDetail() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const { data: ward, isLoading } = useGetWardByIdQuery(id ?? skipToken);
  const { data: users = [] } = useGetUsersQuery();
  const { data: patients = [] } = useGetPatientsByWardQuery(id ?? skipToken);
  const { data: currentShift } = useGetCurrentShiftQuery(id ?? skipToken);
  const [updateWard, { isLoading: isUpdating }] = useUpdateWardMutation();
  const [deleteWard] = useDeleteWardMutation();

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editBeds, setEditBeds] = useState(20);
  const [editSupervisorId, setEditSupervisorId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) return <div className="panel rounded p-8 text-center ink-mute">Loading…</div>;
  if (!ward) return <div className="panel rounded p-8 text-center ink-mute">Ward not found.</div>;

  const supervisor = ward.supervisorId ? getUser(users, ward.supervisorId) : undefined;

  function openEdit() {
    setEditName(ward!.name);
    setEditSpecialty(ward!.specialty || "");
    setEditBeds(ward!.totalBeds);
    setEditSupervisorId(ward!.supervisorId || "");
    setEditOpen(true);
  }

  async function submitEdit() {
    if (!id || !editName) return;
    try {
      await updateWard({ id, name: editName, specialty: editSpecialty || undefined, totalBeds: editBeds, supervisorId: editSupervisorId || undefined }).unwrap();
      toast({ kind: "success", title: "Ward updated" });
      setEditOpen(false);
    } catch {
      toast({ kind: "error", title: "Could not update ward" });
    }
  }

  async function doDelete() {
    if (!id) return;
    try {
      await deleteWard(id).unwrap();
      toast({ kind: "success", title: "Ward deleted" });
      navigate("/admin/wards");
    } catch {
      toast({ kind: "error", title: "Could not delete ward" });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={ward.name} subtitle={ward.specialty || "General ward"}>
        <button className="btn" onClick={openEdit}><Icons.edit size={14} />Edit</button>
        <button className="btn" style={{ color: "#b91c1c" }} onClick={() => setConfirmDelete(true)}><Icons.trash size={14} />Delete</button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel rounded p-4 space-y-3">
          <div className="field-label">Ward information</div>
          <div><div className="text-xs ink-mute">Name</div><div className="font-semibold">{ward.name}</div></div>
          <div><div className="text-xs ink-mute">Specialty</div><div className="font-semibold">{ward.specialty || "—"}</div></div>
          <div><div className="text-xs ink-mute">Total beds</div><div className="font-semibold mono">{ward.totalBeds}</div></div>
          <div><div className="text-xs ink-mute">Supervisor</div><div className="font-semibold">{supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : "—"}</div></div>
          {currentShift && (
            <div className="border-t hairline pt-3">
              <div className="text-xs ink-mute mb-1">Current shift</div>
              <div className="font-semibold">{currentShift.type} · {currentShift.status}</div>
              <div className="text-xs ink-mute">
                Lead: {currentShift.leadDoctorId ? getUser(users, currentShift.leadDoctorId)?.firstName || "—" : "Unassigned"}
              </div>
            </div>
          )}
        </div>

        <div className="panel rounded lg:col-span-2">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">Current patients ({patients.length})</div>
          <table className="cr">
            <thead>
              <tr><th>Bed</th><th>Patient</th><th>Status</th><th>Diagnosis</th></tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr><td colSpan={4} className="text-center ink-mute p-4">No patients.</td></tr>
              ) : patients.slice(0, 10).map((p) => (
                <tr key={p.id}>
                  <td className="mono text-xs">{p.bedNumber || "—"}</td>
                  <td className="font-medium">{p.lastName.toUpperCase()}, {p.firstName}</td>
                  <td><span className="chip text-xs">{p.status}</span></td>
                  <td className="ink-2 text-xs">{p.primaryDiagnosis || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit ward"
        footer={
          <>
            <button className="btn" onClick={() => setEditOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitEdit} disabled={isUpdating}>
              {isUpdating ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Ward name" required><input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} /></Field>
          <Field label="Specialty"><input className="input" value={editSpecialty} onChange={(e) => setEditSpecialty(e.target.value)} /></Field>
          <Field label="Number of beds" required><input className="input" type="number" min={1} max={200} value={editBeds} onChange={(e) => setEditBeds(Number(e.target.value))} /></Field>
          <Field label="Ward supervisor">
            <select className="select" value={editSupervisorId} onChange={(e) => setEditSupervisorId(e.target.value)}>
              <option value="">—</option>
              {users.filter((u) => u.role === "WARD_SUPERVISOR").map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete ward"
        footer={
          <>
            <button className="btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
            <button className="btn" style={{ background: "#b91c1c", color: "white" }} onClick={doDelete}>Delete</button>
          </>
        }
      >
        <p className="text-sm ink-2">Are you sure you want to delete <strong>{ward.name}</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function AdminUsers() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: users = [], isLoading } = useGetUsersQuery();
  const { data: departments = [] } = useGetDepartmentsQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [filter, setFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("NURSE");
  const [departmentId, setDepartmentId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);
  const filtered = users.filter((u) => filter === "ALL" || u.role === filter);

  async function submit() {
    if (!firstName || !lastName || !email || password.length < 8) {
      toast({ kind: "error", title: "Fill all required fields (password ≥ 8 chars)" });
      return;
    }
    try {
      await createUser({ firstName, lastName, email, password, role, departmentId: departmentId || undefined }).unwrap();
      toast({ kind: "success", title: "User created", body: "Account activated. Share credentials securely." });
      setOpen(false);
      setFirstName(""); setLastName(""); setEmail(""); setRole("NURSE"); setDepartmentId(""); setPassword("");
    } catch {
      toast({ kind: "error", title: "Could not create user" });
    }
  }

  async function doDeactivate() {
    if (!confirmDeactivateId) return;
    try {
      await deactivateUser(confirmDeactivateId).unwrap();
      toast({ kind: "success", title: "User deactivated" });
      setConfirmDeactivateId(null);
    } catch {
      toast({ kind: "error", title: "Could not deactivate user" });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Users" subtitle={`${users.length} accounts · ${users.filter((u) => u.active).length} active`}>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Icons.plus size={14} />New user
        </button>
      </PageHeader>
      <div className="flex items-center gap-2 flex-wrap">
        {["ALL", "ADMIN", "CONSULTANT", "REGISTRAR", "JUNIOR_DOCTOR", "NURSE", "WARD_SUPERVISOR"].map((r) => (
          <button key={r} onClick={() => setFilter(r)} className={`btn ${filter === r ? "btn-primary" : ""}`}>
            {r === "ALL" ? "All" : r.replace(/_/g, " ")}
            <span className="ink-mute ml-1">
              {r === "ALL" ? users.length : users.filter((u) => u.role === r).length}
            </span>
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="panel rounded p-8 text-center ink-mute">Loading users…</div>
      ) : (
        <div className="panel rounded overflow-hidden">
          <table className="cr">
            <thead>
              <tr>
                <th>Name</th><th>Role</th><th>Email</th><th>Department</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/admin/users/${u.id}`)}>
                  <td className="font-medium">{u.firstName} {u.lastName}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td className="ink-2 mono text-xs">{u.email}</td>
                  <td className="ink-2">{u.departmentId ? getDept(departments, u.departmentId)?.name : "—"}</td>
                  <td>
                    {u.active
                      ? <span className="chip" style={{ background: "#dcfce7", color: "#166534" }}>ACTIVE</span>
                      : <span className="chip" style={{ background: "#e2e8f0", color: "#475569" }}>INACTIVE</span>}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {u.active && (
                      <button
                        className="btn btn-ghost p-1.5 text-amber-700"
                        title="Deactivate"
                        onClick={() => setConfirmDeactivateId(u.id)}
                      >
                        <Icons.alertCircle size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Create user account" width={580}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={isCreating}>
              {isCreating ? "Creating…" : "Create"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" required><input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></Field>
          <Field label="Last name" required><input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} /></Field>
          <Field label="Email" required><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Role" required>
            <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option>ADMIN</option><option>CONSULTANT</option><option>REGISTRAR</option>
              <option>JUNIOR_DOCTOR</option><option>NURSE</option><option>WARD_SUPERVISOR</option>
            </select>
          </Field>
          <Field label="Department">
            <select className="select" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">—</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Temporary password" hint="At least 8 characters. User can change after first login.">
              <input className="input mono" type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
          </div>
        </div>
      </Modal>

      <Modal open={!!confirmDeactivateId} onClose={() => setConfirmDeactivateId(null)} title="Deactivate user"
        footer={
          <>
            <button className="btn" onClick={() => setConfirmDeactivateId(null)}>Cancel</button>
            <button className="btn" style={{ background: "#b45309", color: "white" }} onClick={doDeactivate}>Deactivate</button>
          </>
        }
      >
        <p className="text-sm ink-2">This user will no longer be able to log in. This action can be reversed by re-creating the account.</p>
      </Modal>
    </div>
  );
}

export function AdminUserDetail() {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading } = useGetUserByIdQuery(id ?? skipToken);
  const { data: departments = [] } = useGetDepartmentsQuery();
  const [deactivateUser] = useDeactivateUserMutation();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  if (isLoading) return <div className="panel rounded p-8 text-center ink-mute">Loading…</div>;
  if (!user) return <div className="panel rounded p-8 text-center ink-mute">User not found.</div>;

  const dept = user.departmentId ? getDept(departments, user.departmentId) : undefined;

  async function doDeactivate() {
    if (!id) return;
    try {
      await deactivateUser(id).unwrap();
      toast({ kind: "success", title: "User deactivated" });
      setConfirmDeactivate(false);
      navigate("/admin/users");
    } catch {
      toast({ kind: "error", title: "Could not deactivate user" });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={`${user.firstName} ${user.lastName}`} subtitle={user.email}>
        {user.active && (
          <button className="btn" style={{ color: "#b45309" }} onClick={() => setConfirmDeactivate(true)}>
            <Icons.alertCircle size={14} />Deactivate
          </button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel rounded p-4 space-y-4">
          <div className="field-label">Account information</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="ink-mute text-xs">First name</div><div className="font-semibold">{user.firstName}</div></div>
            <div><div className="ink-mute text-xs">Last name</div><div className="font-semibold">{user.lastName}</div></div>
            <div className="col-span-2"><div className="ink-mute text-xs">Email</div><div className="font-semibold mono">{user.email}</div></div>
            <div><div className="ink-mute text-xs">Role</div><div className="mt-1"><RoleBadge role={user.role} /></div></div>
            <div><div className="ink-mute text-xs">Status</div>
              <span className="chip mt-1 inline-block" style={{ background: user.active ? "#dcfce7" : "#e2e8f0", color: user.active ? "#166534" : "#475569" }}>
                {user.active ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
            <div className="col-span-2"><div className="ink-mute text-xs">Department</div><div className="font-semibold">{dept?.name || "—"}</div></div>
            <div className="col-span-2"><div className="ink-mute text-xs">Account created</div><div className="font-semibold mono text-xs">{user.createdAt?.slice(0, 10)}</div></div>
          </div>
        </div>
        <div className="panel rounded p-4">
          <div className="field-label mb-3">Access & permissions</div>
          <div className="text-sm space-y-2 ink-2">
            <p>Role <strong>{user.role.replace(/_/g, " ")}</strong> grants access to the {user.role.toLowerCase().includes("admin") ? "admin panel" : user.role.toLowerCase().includes("nurse") ? "nursing workflows" : user.role.toLowerCase().includes("supervisor") ? "ward oversight tools" : "clinical workflows"}.</p>
            {dept && <p>Assigned to department <strong>{dept.name}</strong>.</p>}
            {!user.active && <p className="text-amber-700">This account has been deactivated and cannot log in.</p>}
          </div>
        </div>
      </div>

      <Modal open={confirmDeactivate} onClose={() => setConfirmDeactivate(false)} title="Deactivate user"
        footer={
          <>
            <button className="btn" onClick={() => setConfirmDeactivate(false)}>Cancel</button>
            <button className="btn" style={{ background: "#b45309", color: "white" }} onClick={doDeactivate}>Deactivate</button>
          </>
        }
      >
        <p className="text-sm ink-2">Deactivating <strong>{user.firstName} {user.lastName}</strong> will prevent them from logging in.</p>
      </Modal>
    </div>
  );
}

// ─── Shift Schedules ──────────────────────────────────────────────────────────

export function AdminShiftSchedules() {
  const toast = useToast();
  const { data: schedules = [], isLoading } = useGetShiftSchedulesQuery();
  const { data: wards = [] } = useGetWardsQuery();
  const [createSchedule, { isLoading: isCreating }] = useCreateShiftScheduleMutation();
  const [deactivateSchedule] = useDeactivateShiftScheduleMutation();
  const [open, setOpen] = useState(false);
  const [wardId, setWardId] = useState("");
  const [shiftType, setShiftType] = useState("DAY");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("15:00");
  const [daysOfWeek, setDaysOfWeek] = useState("MON,TUE,WED,THU,FRI");

  async function submit() {
    if (!shiftType || !startTime || !endTime || !daysOfWeek) {
      toast({ kind: "error", title: "Fill all required fields" });
      return;
    }
    try {
      await createSchedule({ wardId: wardId || undefined, shiftType, startTime, endTime, daysOfWeek }).unwrap();
      toast({ kind: "success", title: "Shift schedule created" });
      setOpen(false);
      setWardId(""); setShiftType("DAY"); setStartTime("07:00"); setEndTime("15:00"); setDaysOfWeek("MON,TUE,WED,THU,FRI");
    } catch {
      toast({ kind: "error", title: "Could not create shift schedule" });
    }
  }

  async function handleDeactivate(id: string) {
    try {
      await deactivateSchedule(id).unwrap();
      toast({ kind: "success", title: "Schedule deactivated" });
    } catch {
      toast({ kind: "error", title: "Could not deactivate schedule" });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Shift schedules" subtitle="Templates that auto-generate ward shifts">
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Icons.plus size={14} />New schedule
        </button>
      </PageHeader>
      {isLoading ? (
        <div className="panel rounded p-8 text-center ink-mute">Loading schedules…</div>
      ) : (
        <div className="panel rounded overflow-hidden">
          <table className="cr">
            <thead>
              <tr>
                <th>Shift type</th><th>Ward</th><th>Days</th><th>Time</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium">{s.shiftType}</td>
                  <td className="ink-2">{s.wardId ? wards.find((w) => w.id === s.wardId)?.name || s.wardId : "All wards"}</td>
                  <td className="ink-2">{s.daysOfWeek}</td>
                  <td className="mono">{s.startTime}–{s.endTime}</td>
                  <td>
                    <span className={`chip ${s.active ? "" : "opacity-50"}`} style={{ background: s.active ? "#dcfce7" : "#e2e8f0", color: s.active ? "#166534" : "#475569" }}>
                      {s.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td>
                    {s.active && (
                      <button className="btn btn-ghost p-1.5 text-amber-700 text-xs" onClick={() => handleDeactivate(s.id)} title="Deactivate">
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="New shift schedule"
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Ward">
            <select className="select" value={wardId} onChange={(e) => setWardId(e.target.value)}>
              <option value="">All wards</option>
              {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </Field>
          <Field label="Shift type" required>
            <select className="select" value={shiftType} onChange={(e) => setShiftType(e.target.value)}>
              <option>DAY</option><option>NIGHT</option>
            </select>
          </Field>
          <Field label="Start time" required><input className="input mono" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></Field>
          <Field label="End time" required><input className="input mono" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></Field>
          <div className="sm:col-span-2">
            <Field label="Days of week" required hint="Comma-separated: MON,TUE,WED">
              <input className="input mono" value={daysOfWeek} onChange={(e) => setDaysOfWeek(e.target.value)} />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── On-Call ──────────────────────────────────────────────────────────────────

export function AdminOnCall() {
  const toast = useToast();
  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: onCall = [], isLoading } = useGetOnCallRotationsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const { data: wards = [] } = useGetWardsQuery();
  const [createRotation, { isLoading: isCreating }] = useCreateOnCallRotationMutation();
  const [deleteRotation] = useDeleteOnCallRotationMutation();
  const [open, setOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState("");
  const [wardId, setWardId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [role, setRole] = useState("REGISTRAR_ON_CALL");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function submit() {
    if (!departmentId || !doctorId || !role || !startTime || !endTime) {
      toast({ kind: "error", title: "Fill all required fields" });
      return;
    }
    try {
      await createRotation({
        departmentId,
        wardId: wardId || undefined,
        doctorId,
        role,
        startTime: datetimeLocalToOffsetIso(startTime),
        endTime: datetimeLocalToOffsetIso(endTime)
      }).unwrap();
      toast({ kind: "success", title: "On-call rotation created" });
      setOpen(false);
      setDepartmentId(""); setWardId(""); setDoctorId(""); setRole("REGISTRAR_ON_CALL"); setStartTime(""); setEndTime("");
    } catch {
      toast({ kind: "error", title: "Could not create on-call rotation" });
    }
  }

  async function doDelete() {
    if (!confirmDeleteId) return;
    try {
      await deleteRotation(confirmDeleteId).unwrap();
      toast({ kind: "success", title: "Rotation deleted" });
      setConfirmDeleteId(null);
    } catch {
      toast({ kind: "error", title: "Could not delete rotation" });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="On-call rotations" subtitle="Current and scheduled on-call assignments">
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Icons.plus size={14} />New rotation
        </button>
      </PageHeader>
      {isLoading ? (
        <div className="panel rounded p-8 text-center ink-mute">Loading rotations…</div>
      ) : (
        <div className="panel rounded overflow-hidden">
          <table className="cr">
            <thead>
              <tr>
                <th>Department</th><th>Doctor</th><th>Role</th><th>Start (local)</th><th>End (local)</th><th></th>
              </tr>
            </thead>
            <tbody>
              {onCall.map((o) => {
                const d = getDept(departments, o.departmentId);
                const u = getUser(users, o.doctorId);
                return (
                  <tr key={o.id}>
                    <td className="font-medium">{d?.name || "—"}</td>
                    <td>{u ? `${u.firstName} ${u.lastName}` : "—"}</td>
                    <td><RoleBadge role={o.role.includes("CONSULTANT") ? "CONSULTANT" : "REGISTRAR"} /></td>
                    <td className="mono text-xs">{fmtLocal(o.startTime)}</td>
                    <td className="mono text-xs">{fmtLocal(o.endTime)}</td>
                    <td>
                      <button className="btn btn-ghost p-1.5 text-red-600" title="Delete" onClick={() => setConfirmDeleteId(o.id)}>
                        <Icons.trash size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="New on-call rotation" width={620}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Department" required>
            <select className="select" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">Select...</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Ward">
            <select className="select" value={wardId} onChange={(e) => setWardId(e.target.value)}>
              <option value="">All wards</option>
              {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </Field>
          <Field label="Role" required>
            <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option>REGISTRAR_ON_CALL</option>
              <option>CONSULTANT_ON_CALL</option>
            </select>
          </Field>
          <Field label="Doctor" required>
            <select className="select" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">Select...</option>
              {users.filter((u) => ["REGISTRAR", "CONSULTANT"].includes(u.role)).map((u) => (
                <option key={u.id} value={u.id}>{userFullName(u)} - {u.role}</option>
              ))}
            </select>
          </Field>
          <Field label="Start (local time)" required>
            <input className="input mono" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </Field>
          <Field label="End (local time)" required>
            <input className="input mono" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </Field>
        </div>
      </Modal>

      <Modal open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Delete on-call rotation"
        footer={
          <>
            <button className="btn" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
            <button className="btn" style={{ background: "#b91c1c", color: "white" }} onClick={doDelete}>Delete</button>
          </>
        }
      >
        <p className="text-sm ink-2">Are you sure you want to delete this on-call rotation? This cannot be undone.</p>
      </Modal>
    </div>
  );
}

// ─── Team Assignment ──────────────────────────────────────────────────────────

export function AdminTeamAssignment() {
  const toast = useToast();
  const { data: teams = [], isLoading } = useGetTeamsQuery();
  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const { data: wards = [] } = useGetWardsQuery();
  const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation();
  const [assignWard, { isLoading: isAssigning }] = useAssignWardToTeamMutation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [consultantId, setConsultantId] = useState("");
  const [wardAssignments, setWardAssignments] = useState<Record<string, string>>({});

  async function submit() {
    if (!name || !departmentId) {
      toast({ kind: "error", title: "Team name and department are required" });
      return;
    }
    try {
      await createTeam({ name, departmentId, consultantId: consultantId || undefined }).unwrap();
      toast({ kind: "success", title: "Medical team created" });
      setOpen(false);
      setName(""); setDepartmentId(""); setConsultantId("");
    } catch {
      toast({ kind: "error", title: "Could not create medical team" });
    }
  }

  async function assign(teamId: string) {
    const wId = wardAssignments[teamId];
    if (!wId) return;
    try {
      await assignWard({ teamId, wardId: wId }).unwrap();
      toast({ kind: "success", title: "Ward assigned to team" });
      setWardAssignments({ ...wardAssignments, [teamId]: "" });
    } catch {
      toast({ kind: "error", title: "Could not assign ward" });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Medical teams" subtitle="Clinical firms within departments">
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Icons.plus size={14} />New team
        </button>
      </PageHeader>
      {isLoading ? (
        <div className="panel rounded p-8 text-center ink-mute">Loading teams…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {teams.map((t) => {
            const cons = t.consultantId ? getUser(users, t.consultantId) : undefined;
            const dept = getDept(departments, t.departmentId);
            const assignedWardIds = t.wardIds || [];
            return (
              <div key={t.id} className="panel rounded">
                <div className="px-4 py-3 border-b hairline">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs ink-mute">
                    {dept?.name || "—"}{cons ? ` · ${cons.firstName} ${cons.lastName}` : ""}
                  </div>
                </div>
                <div className="p-4 text-xs ink-mute">Member list is managed via team invites.</div>
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select className="select" value={wardAssignments[t.id] || ""} onChange={(e) => setWardAssignments({ ...wardAssignments, [t.id]: e.target.value })}>
                      <option value="">Assign ward...</option>
                      {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <button className="btn" disabled={!wardAssignments[t.id] || isAssigning} onClick={() => assign(t.id)}>Assign</button>
                  </div>
                  <div>
                    <div className="field-label mb-2">Assigned wards</div>
                    {assignedWardIds.length === 0 ? (
                      <div className="text-xs ink-mute">No wards assigned.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {assignedWardIds.map((wId) => (
                          <span key={wId} className="chip bg-slate-100 text-slate-700">
                            {wards.find((w) => w.id === wId)?.name || wId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="New medical team"
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <Field label="Team name" required><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Department" required>
            <select className="select" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">Select...</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Consultant">
            <select className="select" value={consultantId} onChange={(e) => setConsultantId(e.target.value)}>
              <option value="">Unassigned</option>
              {users.filter((u) => u.role === "CONSULTANT").map((u) => (
                <option key={u.id} value={u.id}>{userFullName(u)}</option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}

// ─── Hospital Settings ────────────────────────────────────────────────────────

export function AdminHospital() {
  const toast = useToast();
  const { data: hospital } = useGetMyHospitalQuery();
  const { data: config } = useGetSystemConfigQuery();
  const [updateHospital, { isLoading: isSavingHospital }] = useUpdateMyHospitalMutation();
  const [updateConfig, { isLoading: isSaving }] = useUpdateSystemConfigMutation();
  const [hospitalName, setHospitalName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [amber, setAmber] = useState<number | undefined>(undefined);
  const [red, setRed] = useState<number | undefined>(undefined);
  const [grace, setGrace] = useState<number | undefined>(undefined);
  const [roundNotifications, setRoundNotifications] = useState<boolean | undefined>(undefined);
  const [nokNotifications, setNokNotifications] = useState<boolean | undefined>(undefined);

  const amberVal = amber ?? config?.newsAmberThreshold ?? 5;
  const redVal = red ?? config?.newsRedThreshold ?? 7;
  const graceVal = grace ?? config?.taskOverdueGraceMinutes ?? 15;
  const roundNotifVal = roundNotifications ?? config?.roundNotificationsEnabled ?? false;
  const nokNotifVal = nokNotifications ?? config?.nokNotificationEnabled ?? false;
  const hospitalNameVal = hospitalName || hospital?.name || "";
  const contactEmailVal = contactEmail || hospital?.contactEmail || "";
  const contactPhoneVal = contactPhone || hospital?.contactPhone || "";
  const addressVal = address || hospital?.address || "";

  async function saveHospital() {
    try {
      await updateHospital({ name: hospitalNameVal, contactEmail: contactEmailVal, contactPhone: contactPhoneVal, address: addressVal }).unwrap();
      setHospitalName(""); setContactEmail(""); setContactPhone(""); setAddress("");
      toast({ kind: "success", title: "Hospital details saved" });
    } catch {
      toast({ kind: "error", title: "Could not save hospital details" });
    }
  }

  async function save() {
    try {
      await updateConfig({
        newsAmberThreshold: amberVal,
        newsRedThreshold: redVal,
        taskOverdueGraceMinutes: graceVal,
        roundNotificationsEnabled: roundNotifVal,
        nokNotificationEnabled: nokNotifVal
      }).unwrap();
      toast({ kind: "success", title: "Configuration saved" });
    } catch {
      toast({ kind: "error", title: "Save failed" });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Hospital settings" subtitle="Tenant-level configuration" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel rounded p-4 space-y-4">
          <h3 className="font-semibold text-sm">Hospital information</h3>
          <Field label="Hospital name"><input className="input" value={hospitalNameVal} onChange={(e) => setHospitalName(e.target.value)} /></Field>
          <Field label="Contact email"><input className="input" value={contactEmailVal} onChange={(e) => setContactEmail(e.target.value)} /></Field>
          <Field label="Contact phone"><input className="input" value={contactPhoneVal} onChange={(e) => setContactPhone(e.target.value)} /></Field>
          <Field label="Address"><input className="input" value={addressVal} onChange={(e) => setAddress(e.target.value)} /></Field>
          <button className="btn btn-primary" onClick={saveHospital} disabled={isSavingHospital}>
            {isSavingHospital ? "Saving..." : "Save hospital details"}
          </button>
        </div>
        <div className="panel rounded p-4 space-y-4">
          <h3 className="font-semibold text-sm">NEWS thresholds and escalation</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Amber threshold" hint="Escalates to registrar">
              <input className="input mono" type="number" value={amberVal} onChange={(e) => setAmber(Number(e.target.value))} />
            </Field>
            <Field label="Red threshold" hint="Escalates to consultant">
              <input className="input mono" type="number" value={redVal} onChange={(e) => setRed(Number(e.target.value))} />
            </Field>
          </div>
          <Field label="Task overdue grace (minutes)">
            <input className="input mono" type="number" value={graceVal} onChange={(e) => setGrace(Number(e.target.value))} />
          </Field>
          <div className="border-t hairline pt-4 space-y-3">
            <h4 className="text-sm font-semibold">Notification settings</h4>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${roundNotifVal ? "bg-[var(--cr-brand)]" : "bg-slate-300"}`}
                onClick={() => setRoundNotifications(!roundNotifVal)}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${roundNotifVal ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <div>
                <div className="text-sm font-medium">Round notifications</div>
                <div className="text-xs ink-mute">Notify team when a ward round is started or completed</div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${nokNotifVal ? "bg-[var(--cr-brand)]" : "bg-slate-300"}`}
                onClick={() => setNokNotifications(!nokNotifVal)}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${nokNotifVal ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <div>
                <div className="text-sm font-medium">Next-of-kin notifications</div>
                <div className="text-xs ink-mute">Notify next-of-kin contacts when patient status changes</div>
              </div>
            </label>
          </div>
          <button className="btn btn-primary" onClick={save} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Admit Patient (Admin) ────────────────────────────────────────────────────

export function AdminAdmitPatient() {
  return <AdmissionForm />;
}
