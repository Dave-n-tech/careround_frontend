import { useMemo, useState } from "react";
import { Field, Icons, Modal, RoleBadge, StatCard, useToast } from "@/components/ui";
import { PageHeader } from "@/layouts/PageHeader";
import {
  useGetDepartmentsQuery,
  useGetOnCallRotationsQuery,
  useGetShiftSchedulesQuery,
  useGetShiftsQuery,
  useGetTeamsQuery,
  useGetUsersQuery,
  useGetWardsQuery
} from "@/services/api";
import { HOSPITAL } from "@/mock/data";
import { getDept, getUser, getWard } from "@/utils/format";

export function AdminDashboard() {
  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: wards = [] } = useGetWardsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const { data: shifts = [] } = useGetShiftsQuery();

  const stats = useMemo(
    () => [
      {
        label: "Departments",
        value: departments.length,
        sub: `${departments.filter((d) => d.wardCount > 0).length} active`,
        accent: "#0b5cab",
        icon: <Icons.building size={18} />
      },
      {
        label: "Wards",
        value: wards.length,
        sub: `${wards.reduce((a, w) => a + w.beds, 0)} beds total`,
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
        label: "Active Shifts",
        value: shifts.filter((s) => s.status === "ACTIVE").length,
        sub: `${shifts.filter((s) => s.status === "PENDING_ASSIGNMENT").length} pending assignment`,
        accent: "#15803d",
        icon: <Icons.shift size={18} />
      }
    ],
    [departments, shifts, users, wards]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hospital overview</h1>
        <p className="ink-mute text-sm mt-0.5">{HOSPITAL.name} · {HOSPITAL.address}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel rounded col-span-2">
          <div className="px-4 py-3 border-b hairline flex items-center justify-between">
            <div className="font-semibold text-sm">Wards</div>
            <button className="btn btn-ghost text-xs">View all <Icons.chevron size={12} /></button>
          </div>
          <table className="cr">
            <thead>
              <tr>
                <th>Ward</th>
                <th>Department</th>
                <th>Occupancy</th>
                <th>Supervisor</th>
              </tr>
            </thead>
            <tbody>
              {wards.map((w) => {
                const d = getDept(departments, w.deptId);
                const s = getUser(users, w.supervisorId);
                const pct = Math.round((w.occupied / w.beds) * 100);
                return (
                  <tr key={w.id}>
                    <td className="font-medium">{w.name}</td>
                    <td className="ink-2">{d?.name}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded bg-slate-100 overflow-hidden max-w-[120px]">
                          <div
                            className="h-full"
                            style={{ width: `${pct}%`, background: pct > 85 ? "#b91c1c" : pct > 70 ? "#d97706" : "#15803d" }}
                          />
                        </div>
                        <span className="mono text-xs">{w.occupied}/{w.beds}</span>
                      </div>
                    </td>
                    <td className="ink-2">{s ? `${s.firstName} ${s.lastName}` : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">System configuration</div>
          <div className="p-4 space-y-3 text-sm">
            <ConfigRow label="NEWS amber threshold" value={`>= ${HOSPITAL.config.newsAmber}`} />
            <ConfigRow label="NEWS red threshold" value={`>= ${HOSPITAL.config.newsRed}`} />
            <ConfigRow label="Task overdue grace" value={`${HOSPITAL.config.overdueGraceMins} min`} />
            <ConfigRow label="Notify NoK on round" value={HOSPITAL.config.notifyNoK ? "Enabled" : "Disabled"} />
            <ConfigRow label="Enforce consent" value={HOSPITAL.config.enforceConsent ? "Enabled" : "Disabled"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b hairline pb-2">
      <span className="ink-mute">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function AdminDepartments() {
  const toast = useToast();
  const { data: departments = [] } = useGetDepartmentsQuery();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <PageHeader title="Departments" subtitle="Clinical divisions of the hospital">
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Icons.plus size={14} />New department
        </button>
      </PageHeader>
      <div className="panel rounded overflow-hidden">
        <table className="cr">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Specialty</th>
              <th>Wards</th>
              <th>Head</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.id}>
                <td className="mono text-xs">{d.code}</td>
                <td className="font-medium">{d.name}</td>
                <td className="ink-2">{d.specialty}</td>
                <td>{d.wardCount}</td>
                <td className="ink-2">{d.headOfDept}</td>
                <td className="text-right">
                  <button className="btn-ghost btn p-1.5"><Icons.more size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New department"
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                toast({ kind: "success", title: "Department created" });
                setOpen(false);
              }}
            >
              Create
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Department name" required><input className="input" placeholder="e.g. Neurology" /></Field>
          <Field label="Code" required><input className="input mono" placeholder="NEUR" maxLength={6} /></Field>
          <Field label="Specialty" required><input className="input" placeholder="Neurology" /></Field>
          <Field label="Head of department"><input className="input" placeholder="Dr. ..." /></Field>
        </div>
      </Modal>
    </div>
  );
}

export function AdminWards() {
  const toast = useToast();
  const { data: wards = [] } = useGetWardsQuery();
  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <PageHeader title="Wards" subtitle="Patient care units within departments">
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Icons.plus size={14} />New ward
        </button>
      </PageHeader>
      <div className="panel rounded overflow-hidden">
        <table className="cr">
          <thead>
            <tr>
              <th>Ward</th>
              <th>Department</th>
              <th>Beds</th>
              <th>Occupancy</th>
              <th>Supervisor</th>
              <th>Specialty</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {wards.map((w) => {
              const pct = Math.round((w.occupied / w.beds) * 100);
              return (
                <tr key={w.id}>
                  <td className="font-medium">{w.name}</td>
                  <td className="ink-2">{getDept(departments, w.deptId)?.name}</td>
                  <td className="mono">{w.beds}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded bg-slate-100 overflow-hidden">
                        <div
                          className="h-full"
                          style={{ width: `${pct}%`, background: pct > 85 ? "#b91c1c" : pct > 70 ? "#d97706" : "#15803d" }}
                        />
                      </div>
                      <span className="mono text-xs">
                        {w.occupied}/{w.beds} ({pct}%)
                      </span>
                    </div>
                  </td>
                  <td className="ink-2">{getUser(users, w.supervisorId)?.firstName}</td>
                  <td className="ink-2">{w.specialty}</td>
                  <td className="text-right">
                    <button className="btn-ghost btn p-1.5"><Icons.more size={16} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New ward"
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                toast({ kind: "success", title: "Ward created" });
                setOpen(false);
              }}
            >
              Create
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ward name" required><input className="input" placeholder="e.g. Tutuola Ward" /></Field>
          <Field label="Department" required>
            <select className="select">
              {departments.map((d) => (
                <option key={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Number of beds" required><input className="input" type="number" min={1} max={60} defaultValue={20} /></Field>
          <Field label="Specialty"><input className="input" /></Field>
          <Field label="Ward supervisor">
            <select className="select">
              {users.filter((u) => u.role === "WARD_SUPERVISOR").map((u) => (
                <option key={u.id}>{u.firstName} {u.lastName}</option>
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
  const { data: users = [] } = useGetUsersQuery();
  const { data: departments = [] } = useGetDepartmentsQuery();
  const [filter, setFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const filtered = users.filter((u) => filter === "ALL" || u.role === filter);

  return (
    <div className="space-y-4">
      <PageHeader title="Users" subtitle={`${users.length} accounts · ${users.filter((u) => u.active).length} active`}>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Icons.plus size={14} />New user
        </button>
      </PageHeader>
      <div className="flex items-center gap-2 flex-wrap">
        {[
          "ALL",
          "ADMIN",
          "CONSULTANT",
          "REGISTRAR",
          "JUNIOR_DOCTOR",
          "NURSE",
          "WARD_SUPERVISOR"
        ].map((r) => (
          <button key={r} onClick={() => setFilter(r)} className={`btn ${filter === r ? "btn-primary" : ""}`}>
            {r === "ALL" ? "All" : r.replace(/_/g, " ")}
            <span className="ink-mute ml-1">
              {r === "ALL" ? users.length : users.filter((u) => u.role === r).length}
            </span>
          </button>
        ))}
      </div>
      <div className="panel rounded overflow-hidden">
        <table className="cr">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Email</th>
              <th>Department</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.firstName} {u.lastName}</td>
                <td><RoleBadge role={u.role} /></td>
                <td className="ink-2 mono text-xs">{u.email}</td>
                <td className="ink-2">{u.deptId ? getDept(departments, u.deptId)?.name : "-"}</td>
                <td>{u.active ? <span className="chip" style={{ background: "#dcfce7", color: "#166534" }}>ACTIVE</span> : <span className="chip" style={{ background: "#e2e8f0", color: "#475569" }}>INACTIVE</span>}</td>
                <td className="text-right"><button className="btn-ghost btn p-1.5"><Icons.more size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create user account"
        width={580}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                toast({ kind: "success", title: "User created", body: "A welcome email has been sent." });
                setOpen(false);
              }}
            >
              Create
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" required><input className="input" /></Field>
          <Field label="Last name" required><input className="input" /></Field>
          <Field label="Email" required><input className="input" type="email" /></Field>
          <Field label="Role" required>
            <select className="select">
              <option>ADMIN</option>
              <option>CONSULTANT</option>
              <option>REGISTRAR</option>
              <option>JUNIOR_DOCTOR</option>
              <option>NURSE</option>
              <option>WARD_SUPERVISOR</option>
            </select>
          </Field>
          <Field label="Department">
            <select className="select">
              <option>-</option>
              {departments.map((d) => (
                <option key={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Title"><input className="input" placeholder="Dr. / Prof. / Sr." /></Field>
          <div className="col-span-2">
            <Field label="Temporary password" hint="User will be required to change on first login">
              <input className="input mono" defaultValue="Welcome2026!" />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function AdminShiftSchedules() {
  const { data: schedules = [] } = useGetShiftSchedulesQuery();
  const { data: wards = [] } = useGetWardsQuery();

  return (
    <div className="space-y-4">
      <PageHeader title="Shift schedules" subtitle="Templates that auto-generate ward shifts">
        <button className="btn btn-primary">
          <Icons.plus size={14} />New schedule
        </button>
      </PageHeader>
      <div className="panel rounded overflow-hidden">
        <table className="cr">
          <thead>
            <tr>
              <th>Schedule</th>
              <th>Ward</th>
              <th>Pattern</th>
              <th>Time</th>
              <th>Lead role</th>
              <th>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id}>
                <td className="font-medium">{s.name}</td>
                <td className="ink-2">{getWard(wards, s.wardId)?.name || s.wardId}</td>
                <td>{s.pattern}</td>
                <td className="mono">{s.start}-{s.end}</td>
                <td><RoleBadge role={s.leadRole} /></td>
                <td>
                  <button className={`relative w-10 h-5 rounded-full ${s.active ? "bg-emerald-600" : "bg-slate-300"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${s.active ? "left-5" : "left-0.5"}`} />
                  </button>
                </td>
                <td className="text-right"><button className="btn-ghost btn p-1.5"><Icons.more size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminOnCall() {
  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: onCall = [] } = useGetOnCallRotationsQuery();
  const { data: users = [] } = useGetUsersQuery();

  return (
    <div className="space-y-4">
      <PageHeader title="On-call rotations" subtitle="Today, 6 May 2026">
        <button className="btn btn-primary">
          <Icons.plus size={14} />New rotation
        </button>
      </PageHeader>
      <div className="panel rounded p-4">
        <div className="grid grid-cols-[180px_repeat(24,1fr)] gap-px text-[10px]">
          <div className="font-semibold text-xs ink-mute py-2">Department</div>
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="text-center ink-mute py-2 mono">
              {String(h).padStart(2, "0")}
            </div>
          ))}
          {departments.slice(0, 4).map((d) => (
            <div key={d.id} className="contents">
              <div className="py-3 text-sm font-medium border-t hairline">{d.name}</div>
              {Array.from({ length: 24 }).map((_, h) => {
                const slot = onCall.find((o) => o.deptId === d.id && new Date(o.start).getHours() <= h && new Date(o.end).getHours() >= h);
                if (!slot) return <div key={h} className="border-t hairline" />;
                const u = users.find((user) => user.id === slot.userId);
                return (
                  <div key={h} className="border-t hairline relative" style={{ background: slot.role === "CONSULTANT" ? "#dbeafe" : "#dcfce7" }}>
                    {h === new Date(slot.start).getHours() && (
                      <span className="absolute left-1 top-1 text-[10px] font-medium whitespace-nowrap">
                        {u ? `${u.firstName} ${u.lastName}` : "-"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminTeamAssignment() {
  const { data: teams = [] } = useGetTeamsQuery();
  const { data: wards = [] } = useGetWardsQuery();
  const { data: users = [] } = useGetUsersQuery();

  return (
    <div className="space-y-4">
      <PageHeader title="Medical team to ward assignment" subtitle="Which firms cover which wards" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {teams.map((t) => {
          const cons = getUser(users, t.consultantId);
          return (
            <div key={t.id} className="panel rounded">
              <div className="px-4 py-3 border-b hairline">
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs ink-mute">{cons ? `${cons.firstName} ${cons.lastName}` : ""} · {t.members.length} members</div>
              </div>
              <div className="p-4 space-y-3">
                <div className="field-label">Wards covered</div>
                <div className="flex flex-wrap gap-2">
                  {t.wards.map((wid) => {
                    const w = getWard(wards, wid);
                    return (
                      <div key={wid} className="chip" style={{ background: "#dbeafe", color: "#1e40af" }}>
                        {w?.name}
                        <button className="ml-1" type="button"><Icons.x size={11} /></button>
                      </div>
                    );
                  })}
                  <button className="chip border border-dashed border-slate-300 hover:border-blue-500 text-slate-500 hover:text-blue-700" type="button">
                    + Add ward
                  </button>
                </div>
                <div className="field-label pt-2">Members</div>
                <div className="space-y-1">
                  {t.members.map((uid) => {
                    const u = getUser(users, uid);
                    return (
                      <div key={uid} className="flex items-center justify-between text-sm">
                        <span>{u ? `${u.firstName} ${u.lastName}` : "-"}</span>
                        {u && <RoleBadge role={u.role} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AdminHospital() {
  return (
    <div className="space-y-4">
      <PageHeader title="Hospital settings" subtitle="Tenant-level configuration" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel rounded p-4 space-y-4">
          <h3 className="font-semibold text-sm">Hospital information</h3>
          <Field label="Hospital name"><input className="input" defaultValue={HOSPITAL.name} /></Field>
          <Field label="Short name"><input className="input" defaultValue={HOSPITAL.shortName} /></Field>
          <Field label="Address"><input className="input" defaultValue={HOSPITAL.address} /></Field>
        </div>
        <div className="panel rounded p-4 space-y-4">
          <h3 className="font-semibold text-sm">NEWS thresholds and escalation</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amber threshold" hint="Escalates to registrar"><input className="input mono" defaultValue={HOSPITAL.config.newsAmber} /></Field>
            <Field label="Red threshold" hint="Escalates to consultant"><input className="input mono" defaultValue={HOSPITAL.config.newsRed} /></Field>
          </div>
          <Field label="Task overdue grace (minutes)"><input className="input mono" defaultValue={HOSPITAL.config.overdueGraceMins} /></Field>
          <ToggleRow label="Notify next-of-kin on round completion" checked />
          <ToggleRow label="Enforce next-of-kin notification consent" checked />
          <ToggleRow label="Auto-publish handover summary on sign-off" />
          <button className="btn btn-primary">Save changes</button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, checked }: { label: string; checked?: boolean }) {
  const [on, setOn] = useState(Boolean(checked));
  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <button onClick={() => setOn(!on)} className={`relative w-10 h-5 rounded-full ${on ? "bg-emerald-600" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${on ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  );
}
