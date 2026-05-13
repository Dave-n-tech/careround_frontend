import { useMemo, useState } from "react";
import { Field, Icons, Modal, RoleBadge, StatCard, useToast } from "@/components/ui";
import { PageHeader } from "@/layouts/PageHeader";
import {
  useGetDepartmentsQuery,
  useGetOnCallRotationsQuery,
  useGetShiftSchedulesQuery,
  useGetTeamsQuery,
  useGetUsersQuery,
  useGetWardsQuery,
  useGetMyHospitalQuery,
  useGetSystemConfigQuery,
  useAssignWardToTeamMutation,
  useCreateDepartmentMutation,
  useCreateOnCallRotationMutation,
  useCreateShiftScheduleMutation,
  useCreateTeamMutation,
  useCreateWardMutation,
  useCreateUserMutation,
  useUpdateMyHospitalMutation,
  useUpdateSystemConfigMutation
} from "@/services/api";
import { getDept, getUser, userFullName } from "@/utils/format";

export function AdminDashboard() {
  const { data: hospital } = useGetMyHospitalQuery();
  const { data: config } = useGetSystemConfigQuery();
  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: wards = [] } = useGetWardsQuery();
  const { data: users = [] } = useGetUsersQuery();

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel rounded lg:col-span-2">
          <div className="px-4 py-3 border-b hairline flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="font-semibold text-sm">Wards</div>
          </div>
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

export function AdminDepartments() {
  const toast = useToast();
  const { data: departments = [], isLoading } = useGetDepartmentsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const [createDepartment, { isLoading: isCreating }] = useCreateDepartmentMutation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [headId, setHeadId] = useState<string>("");

  async function submit() {
    if (!name) return;
    try {
      await createDepartment({ name, headOfDepartmentId: headId || undefined }).unwrap();
      toast({ kind: "success", title: "Department created" });
      setOpen(false);
      setName("");
      setHeadId("");
    } catch {
      toast({ kind: "error", title: "Could not create department" });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Departments" subtitle="Clinical divisions of the hospital">
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
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
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => {
                const head = d.headOfDepartmentId ? getUser(users, d.headOfDepartmentId) : undefined;
                return (
                  <tr key={d.id}>
                    <td className="font-medium">{d.name}</td>
                    <td className="ink-2">{head ? `${head.firstName} ${head.lastName}` : "—"}</td>
                    <td className="ink-2 mono text-xs">{d.createdAt?.slice(0, 10)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New department"
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
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
    </div>
  );
}

export function AdminWards() {
  const toast = useToast();
  const { data: wards = [], isLoading } = useGetWardsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const [createWard, { isLoading: isCreating }] = useCreateWardMutation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [beds, setBeds] = useState(20);
  const [supervisorId, setSupervisorId] = useState("");

  async function submit() {
    if (!name) return;
    try {
      await createWard({ name, specialty: specialty || undefined, totalBeds: beds, supervisorId: supervisorId || undefined }).unwrap();
      toast({ kind: "success", title: "Ward created" });
      setOpen(false);
      setName("");
      setSpecialty("");
      setBeds(20);
      setSupervisorId("");
    } catch {
      toast({ kind: "error", title: "Could not create ward" });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Wards" subtitle="Patient care units">
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
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
                <th>Ward</th>
                <th>Specialty</th>
                <th>Total beds</th>
                <th>Supervisor</th>
              </tr>
            </thead>
            <tbody>
              {wards.map((w) => (
                <tr key={w.id}>
                  <td className="font-medium">{w.name}</td>
                  <td className="ink-2">{w.specialty || "—"}</td>
                  <td className="mono">{w.totalBeds}</td>
                  <td className="ink-2">{w.supervisorId ? `${getUser(users, w.supervisorId)?.firstName || ""} ${getUser(users, w.supervisorId)?.lastName || ""}`.trim() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New ward"
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
          <Field label="Ward name" required>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Specialty">
            <input className="input" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
          </Field>
          <Field label="Number of beds" required>
            <input className="input" type="number" min={1} max={200} value={beds} onChange={(e) => setBeds(Number(e.target.value))} />
          </Field>
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
    </div>
  );
}

export function AdminUsers() {
  const toast = useToast();
  const { data: users = [], isLoading } = useGetUsersQuery();
  const { data: departments = [] } = useGetDepartmentsQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [filter, setFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("NURSE");
  const [departmentId, setDepartmentId] = useState("");
  const [password, setPassword] = useState("");
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
      setFirstName("");
      setLastName("");
      setEmail("");
      setRole("NURSE");
      setDepartmentId("");
      setPassword("");
    } catch {
      toast({ kind: "error", title: "Could not create user" });
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
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium">{u.firstName} {u.lastName}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td className="ink-2 mono text-xs">{u.email}</td>
                  <td className="ink-2">{u.departmentId ? getDept(departments, u.departmentId)?.name : "—"}</td>
                  <td>
                    {u.active
                      ? <span className="chip" style={{ background: "#dcfce7", color: "#166534" }}>ACTIVE</span>
                      : <span className="chip" style={{ background: "#e2e8f0", color: "#475569" }}>INACTIVE</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create user account"
        width={580}
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
              <option>ADMIN</option>
              <option>CONSULTANT</option>
              <option>REGISTRAR</option>
              <option>JUNIOR_DOCTOR</option>
              <option>NURSE</option>
              <option>WARD_SUPERVISOR</option>
            </select>
          </Field>
          <Field label="Department">
            <select className="select" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">—</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Temporary password" hint="At least 8 characters. User can change after first login.">
              <input className="input mono" type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function AdminShiftSchedules() {
  const toast = useToast();
  const { data: schedules = [], isLoading } = useGetShiftSchedulesQuery();
  const { data: wards = [] } = useGetWardsQuery();
  const [createSchedule, { isLoading: isCreating }] = useCreateShiftScheduleMutation();
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
      setWardId("");
      setShiftType("DAY");
      setStartTime("07:00");
      setEndTime("15:00");
      setDaysOfWeek("MON,TUE,WED,THU,FRI");
    } catch {
      toast({ kind: "error", title: "Could not create shift schedule" });
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
                <th>Shift type</th>
                <th>Ward</th>
                <th>Days</th>
                <th>Time</th>
                <th>Active</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New shift schedule"
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
              {wards.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Shift type" required>
            <select className="select" value={shiftType} onChange={(e) => setShiftType(e.target.value)}>
              <option>DAY</option>
              <option>NIGHT</option>
            </select>
          </Field>
          <Field label="Start time" required>
            <input className="input mono" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </Field>
          <Field label="End time" required>
            <input className="input mono" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </Field>
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

export function AdminOnCall() {
  const toast = useToast();
  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: onCall = [], isLoading } = useGetOnCallRotationsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const { data: wards = [] } = useGetWardsQuery();
  const [createRotation, { isLoading: isCreating }] = useCreateOnCallRotationMutation();
  const [open, setOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState("");
  const [wardId, setWardId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [role, setRole] = useState("REGISTRAR_ON_CALL");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

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
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString()
      }).unwrap();
      toast({ kind: "success", title: "On-call rotation created" });
      setOpen(false);
      setDepartmentId("");
      setWardId("");
      setDoctorId("");
      setRole("REGISTRAR_ON_CALL");
      setStartTime("");
      setEndTime("");
    } catch {
      toast({ kind: "error", title: "Could not create on-call rotation" });
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
                <th>Department</th>
                <th>Doctor</th>
                <th>Role</th>
                <th>Start</th>
                <th>End</th>
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
                    <td className="mono text-xs">{o.startTime?.slice(0, 16).replace("T", " ")}</td>
                    <td className="mono text-xs">{o.endTime?.slice(0, 16).replace("T", " ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New on-call rotation"
        width={620}
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
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Ward">
            <select className="select" value={wardId} onChange={(e) => setWardId(e.target.value)}>
              <option value="">All wards</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
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
          <Field label="Start" required>
            <input className="input mono" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </Field>
          <Field label="End" required>
            <input className="input mono" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

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
      setName("");
      setDepartmentId("");
      setConsultantId("");
    } catch {
      toast({ kind: "error", title: "Could not create medical team" });
    }
  }

  async function assign(teamId: string) {
    const wardId = wardAssignments[teamId];
    if (!wardId) return;
    try {
      await assignWard({ teamId, wardId }).unwrap();
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
            const assignedWards = assignedWardIds.map((wardId) => ({
              id: wardId,
              name: wards.find((ward) => ward.id === wardId)?.name || wardId
            }));
            return (
              <div key={t.id} className="panel rounded">
                <div className="px-4 py-3 border-b hairline">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs ink-mute">
                    {dept?.name || "—"}{cons ? ` · ${cons.firstName} ${cons.lastName}` : ""}
                  </div>
                </div>
                <div className="p-4 text-xs ink-mute">
                  Member list is managed via team invites.
                </div>
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      className="select"
                      value={wardAssignments[t.id] || ""}
                      onChange={(e) => setWardAssignments({ ...wardAssignments, [t.id]: e.target.value })}
                    >
                      <option value="">Assign ward...</option>
                      {wards.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                    <button className="btn" disabled={!wardAssignments[t.id] || isAssigning} onClick={() => assign(t.id)}>
                      Assign
                    </button>
                  </div>
                  <div>
                    <div className="field-label mb-2">Assigned wards</div>
                    {assignedWardIds.length === 0 ? (
                      <div className="text-xs ink-mute">No wards assigned.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {assignedWards.map((ward) => (
                          <span key={ward.id} className="chip bg-slate-100 text-slate-700">
                            {ward.name}
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
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New medical team"
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
          <Field label="Team name" required>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Department" required>
            <select className="select" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">Select...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
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

  const amberVal = amber ?? config?.newsAmberThreshold ?? 5;
  const redVal = red ?? config?.newsRedThreshold ?? 7;
  const graceVal = grace ?? config?.taskOverdueGraceMinutes ?? 15;
  const hospitalNameVal = hospitalName || hospital?.name || "";
  const contactEmailVal = contactEmail || hospital?.contactEmail || "";
  const contactPhoneVal = contactPhone || hospital?.contactPhone || "";
  const addressVal = address || hospital?.address || "";

  async function saveHospital() {
    try {
      await updateHospital({
        name: hospitalNameVal,
        contactEmail: contactEmailVal,
        contactPhone: contactPhoneVal,
        address: addressVal
      }).unwrap();
      setHospitalName("");
      setContactEmail("");
      setContactPhone("");
      setAddress("");
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
        taskOverdueGraceMinutes: graceVal
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
          <Field label="Hospital name"><input className="input" value={hospitalNameVal} onChange={(event) => setHospitalName(event.target.value)} /></Field>
          <Field label="Contact email"><input className="input" value={contactEmailVal} onChange={(event) => setContactEmail(event.target.value)} /></Field>
          <Field label="Contact phone"><input className="input" value={contactPhoneVal} onChange={(event) => setContactPhone(event.target.value)} /></Field>
          <Field label="Address"><input className="input" value={addressVal} onChange={(event) => setAddress(event.target.value)} /></Field>
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
          <button className="btn btn-primary" onClick={save} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
