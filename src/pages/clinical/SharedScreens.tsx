import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AcuityBadge,
  EscalationCard,
  Field,
  Icons,
  Modal,
  NEWSBadge,
  PatientRow,
  PriorityChip,
  RoleBadge,
  StatusChip,
  TaskCard,
  useToast
} from "@/components/ui";
import { NEWSSparkline } from "@/components/ui/charts";
import { PageHeader } from "@/layouts/PageHeader";
import {
  useGetCareTasksQuery,
  useGetClinicalNotesByPatientQuery,
  useGetDepartmentsQuery,
  useGetEscalationsQuery,
  useGetOnCallRotationsQuery,
  useGetPatientsQuery,
  useGetRoundsQuery,
  useGetTeamsQuery,
  useGetUsersQuery,
  useGetWardsQuery,
  useAcknowledgeEscalationMutation,
  useResolveEscalationMutation,
  useUpdateCareTaskStatusMutation
} from "@/services/api";
import type { CareTask, ClinicalNote, Patient, Role } from "@/types/domain";
import { getDept, getTeam, getUser, getWard, patientFullName, userFullName } from "@/utils/format";
import { useAppSelector } from "@/app/hooks";

export function PatientListPage({ scope, title }: { scope: "team" | "ward"; title: string }) {
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { data: patients = [] } = useGetPatientsQuery();
  const { data: teams = [] } = useGetTeamsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const [filter, setFilter] = useState("ALL");

  const list = useMemo(() => {
    let filtered = patients;
    if (scope === "team") {
      const team = teams.find((t) => t.members.includes(currentUser?.id || "")) || teams[0];
      if (team) filtered = patients.filter((p) => p.teamId === team.id);
    }
    if (scope === "ward") {
      filtered = patients.filter((p) => p.wardId === "w1");
    }
    const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 } as const;
    filtered = [...filtered].sort((a, b) => order[b.acuity] - order[a.acuity] || b.news - a.news);
    if (filter !== "ALL") filtered = filtered.filter((p) => p.status === filter);
    return filtered;
  }, [patients, scope, teams, users, filter]);

  return (
    <div className="space-y-4">
      <PageHeader title={title} subtitle={`${list.length} patients · Soyinka Ward · last updated 12s ago`}>
        <button className="btn"><Icons.refresh size={14} />Refresh</button>
      </PageHeader>
      <div className="flex items-center gap-2 flex-wrap">
        {["ALL", "ADMITTED", "STABLE", "DETERIORATING", "DISCHARGE_READY"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`btn ${filter === s ? "btn-primary" : ""}`}>
            {s === "ALL" ? "All" : s.replace(/_/g, " ")}
            <span className="ink-mute ml-1">{s === "ALL" ? patients.length : patients.filter((p) => p.status === s).length}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <input className="input pl-8" placeholder="Search MRN, name" style={{ width: 240 }} />
            <Icons.search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>
        </div>
      </div>
      <div className="panel rounded overflow-hidden">
        <table className="cr">
          <thead>
            <tr>
              <th className="w-20">Bed</th>
              <th>Patient</th>
              <th>MRN</th>
              <th>Diagnosis</th>
              <th>Acuity</th>
              <th>NEWS</th>
              <th>Trend</th>
              <th>Status</th>
              <th>LoS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const days = Math.floor((Date.now() - new Date(p.admissionDate).getTime()) / 86400000);
              return (
                <tr key={p.id} onClick={() => navigate(`./${p.id}`)} className="cursor-pointer">
                  <td className="mono text-xs">{p.bed}</td>
                  <td className="font-semibold">
                    {patientFullName(p)}
                    <div className="text-xs ink-mute font-normal">{p.age}{p.sex}</div>
                  </td>
                  <td className="mono text-xs ink-mute">{p.mrn}</td>
                  <td className="ink-2 max-w-[280px] truncate">{p.primaryDiagnosis}</td>
                  <td><AcuityBadge level={p.acuity} /></td>
                  <td><NEWSBadge score={p.news} size="sm" /></td>
                  <td><NEWSSparkline history={p.vitals} w={100} h={24} /></td>
                  <td><StatusChip status={p.status} /></td>
                  <td className="mono text-xs">{days}d</td>
                  <td><Icons.chevron size={14} className="text-slate-400" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: patients = [] } = useGetPatientsQuery();
  const patient = patients.find((p) => p.id === id);
  const { data: wards = [] } = useGetWardsQuery();
  const { data: teams = [] } = useGetTeamsQuery();
  const { data: tasks = [] } = useGetCareTasksQuery();
  const { data: notes = [] } = useGetClinicalNotesByPatientQuery(id || "", { skip: !id });

  const [tab, setTab] = useState("overview");

  if (!patient) {
    return <div className="panel rounded p-12 text-center ink-mute">Patient not found.</div>;
  }

  const ward = getWard(wards, patient.wardId);
  const team = getTeam(teams, patient.teamId);
  const patientTasks = tasks.filter((t) => t.patientId === patient.id);
  const lastVital = patient.vitals[patient.vitals.length - 1];

  return (
    <div className="space-y-4">
      <button className="btn btn-ghost text-sm" onClick={() => navigate(-1)}>← Back to list</button>
      <div className="panel rounded p-5">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{patientFullName(patient)}</h1>
              <AcuityBadge level={patient.acuity} />
              <StatusChip status={patient.status} />
            </div>
            <div className="text-sm ink-mute mt-1 flex items-center gap-3 flex-wrap">
              <span className="mono">{patient.mrn}</span><span>·</span>
              <span>{patient.age}{patient.sex}</span><span>·</span>
              <span>{ward?.name} · Bed {patient.bed}</span><span>·</span>
              <span>Admitted {patient.admissionDate} ({patient.admissionType})</span><span>·</span>
              <span>{team?.name}</span>
            </div>
            <div className="mt-3 text-[14px]">
              <span className="font-medium">Primary:</span> {patient.primaryDiagnosis}
              {patient.secondary?.length ? (
                <span className="ink-mute"> · Secondary: {patient.secondary.join(", ")}</span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <NEWSBadge score={patient.news} size="lg" />
            <span className="text-xs ink-mute">Latest at {lastVital?.ts.slice(11, 16)}</span>
          </div>
        </div>
      </div>

      <div className="flex border-b hairline">
        {["overview", "vitals", "notes", "tasks", "nok"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${
              tab === t ? "border-[var(--cr-brand)] text-[var(--cr-brand)]" : "border-transparent ink-mute hover:text-slate-700"
            }`}
          >
            {t === "nok" ? "Next of Kin" : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "overview" && <PatientOverview patient={patient} tasks={patientTasks} notes={notes} />}
      {tab === "vitals" && <PatientVitalsTab patient={patient} />}
      {tab === "notes" && <PatientNotesTab notes={notes} />}
      {tab === "tasks" && <PatientTasksTab tasks={patientTasks} />}
      {tab === "nok" && <PatientNoKTab patient={patient} />}
    </div>
  );
}

function PatientOverview({ patient, tasks, notes }: { patient: Patient; tasks: CareTask[]; notes: ClinicalNote[] }) {
  const v = patient.vitals[patient.vitals.length - 1];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="col-span-2 space-y-4">
        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline flex justify-between">
            <span className="font-semibold text-sm">Latest vitals</span>
            <span className="text-xs ink-mute">{v?.ts.slice(0, 16).replace("T", " ")}</span>
          </div>
          {v && (
            <div className="grid grid-cols-3 md:grid-cols-6 divide-x hairline">
              <Vital label="Resp rate" v={v.resp} unit="/min" />
              <Vital label="SpO2" v={v.spo2} unit="%" />
              <Vital label="Temp" v={v.temp} unit="C" />
              <Vital label="Sys BP" v={v.sys} unit="mmHg" />
              <Vital label="Heart rate" v={v.hr} unit="bpm" />
              <Vital label="LOC" v={v.cons} unit="" />
            </div>
          )}
        </div>
        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">NEWS trend (last 36h)</div>
          <div className="p-4"><NEWSSparkline history={patient.vitals} w={680} h={120} /></div>
        </div>
        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">Recent clinical notes</div>
          <div className="divide-y hairline">
            {notes.slice(0, 3).map((n) => (
              <div key={n.id} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="chip" style={{ background: "#dbeafe", color: "#1e40af" }}>{n.type.replace(/_/g, " ")}</span>
                  <span className="text-xs ink-mute">{n.createdAt}</span>
                </div>
                <p className="text-sm ink-2 leading-relaxed">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="panel rounded p-4">
          <div className="font-semibold text-sm mb-2">Open tasks ({tasks.filter((t) => t.status !== "COMPLETED").length})</div>
          <div className="space-y-2">
            {tasks.filter((t) => t.status !== "COMPLETED").slice(0, 4).map((t) => (
              <div key={t.id} className="text-sm border-b hairline pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.title}</span>
                  <PriorityChip priority={t.priority} />
                </div>
                <div className="text-xs ink-mute mono mt-0.5">{t.windowStart}-{t.windowEnd}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel rounded p-4">
          <div className="font-semibold text-sm mb-2">Next of kin</div>
          {patient.nok.map((n, i) => (
            <div key={i} className="text-sm">
              <div className="font-medium">{n.name} <span className="ink-mute font-normal">· {n.relation}</span></div>
              <div className="ink-2 mono text-xs">{n.phone}</div>
              <div className="text-xs ink-mute mt-1">Notify via {n.method} · {n.consent ? "consent given" : "no consent"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Vital({ label, v, unit }: { label: string; v: number | string; unit: string }) {
  return (
    <div className="p-4">
      <div className="field-label">{label}</div>
      <div className="text-2xl font-semibold mt-1">
        {v}
        <span className="text-sm ink-mute font-normal ml-1">{unit}</span>
      </div>
    </div>
  );
}

function PatientVitalsTab({ patient }: { patient: Patient }) {
  return (
    <div className="panel rounded">
      <div className="px-4 py-3 border-b hairline flex items-center justify-between">
        <div className="font-semibold text-sm">Vitals history</div>
        <span className="text-xs ink-mute">{patient.vitals.length} recordings</span>
      </div>
      <table className="cr">
        <thead>
          <tr>
            <th>Time</th>
            <th>RR</th>
            <th>SpO2</th>
            <th>Temp</th>
            <th>Sys BP</th>
            <th>HR</th>
            <th>LOC</th>
            <th>NEWS</th>
          </tr>
        </thead>
        <tbody>
          {[...patient.vitals].reverse().map((v, i) => (
            <tr key={i}>
              <td className="mono text-xs">{v.ts.slice(0, 16).replace("T", " ")}</td>
              <td className="mono">{v.resp}</td>
              <td className="mono">{v.spo2}</td>
              <td className="mono">{v.temp}</td>
              <td className="mono">{v.sys}</td>
              <td className="mono">{v.hr}</td>
              <td>{v.cons}</td>
              <td><NEWSBadge score={v.news} size="sm" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PatientNotesTab({ notes }: { notes: ClinicalNote[] }) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const { data: users = [] } = useGetUsersQuery();

  return (
    <div className="space-y-3">
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Icons.plus size={14} />New note
      </button>
      <div className="panel rounded divide-y hairline">
        {notes.map((n) => (
          <div key={n.id} className="p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="chip" style={{ background: "#dbeafe", color: "#1e40af" }}>{n.type.replace(/_/g, " ")}</span>
              <span className="text-sm font-medium">
                {(() => {
                  const author = getUser(users, n.authorId);
                  return author ? userFullName(author) : "Unknown";
                })()}
              </span>
              <span className="text-xs ink-mute">· {n.createdAt}</span>
              <button className="ml-auto btn btn-ghost text-xs"><Icons.edit size={12} />Amend</button>
            </div>
            <p className="text-sm ink-2 leading-relaxed">{n.body}</p>
          </div>
        ))}
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New clinical note"
        width={640}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                toast({ kind: "success", title: "Note saved" });
                setOpen(false);
              }}
            >
              Save note
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Type" required>
            <select className="select">
              <option>PROGRESS_NOTE</option>
              <option>ROUND_NOTE</option>
              <option>ADMISSION_NOTE</option>
              <option>DISCHARGE_NOTE</option>
              <option>ESCALATION_NOTE</option>
            </select>
          </Field>
          <Field label="Note" required>
            <textarea className="textarea" rows={8} placeholder="Document assessment, plan, and any escalation" />
          </Field>
          <p className="text-[11px] ink-mute">Notes are immutable once saved. Use Amend to add corrections; the original remains in the audit trail.</p>
        </div>
      </Modal>
    </div>
  );
}

function PatientTasksTab({ tasks }: { tasks: CareTask[] }) {
  return <div className="space-y-2">{tasks.map((t) => <TaskCard key={t.id} task={t} />)}</div>;
}

function PatientNoKTab({ patient }: { patient: Patient }) {
  return (
    <div className="panel rounded p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm">Next of kin contacts</h3>
        <button className="btn"><Icons.plus size={14} />Add</button>
      </div>
      {patient.nok.map((n, i) => (
        <div key={i} className="border hairline rounded p-3 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <div>
            <div className="field-label">Name</div>
            <div className="font-medium">{n.name}</div>
          </div>
          <div>
            <div className="field-label">Relation</div>
            <div>{n.relation}</div>
          </div>
          <div>
            <div className="field-label">Contact</div>
            <div className="mono text-sm">{n.phone}</div>
            {n.email && <div className="mono text-xs ink-mute">{n.email}</div>}
          </div>
          <div>
            <div className="field-label">Notify · Consent</div>
            <div className="text-sm">{n.method} · {n.consent ? <span className="text-emerald-700">Granted</span> : <span className="text-amber-700">Not granted</span>}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MyTeamPage() {
  const toast = useToast();
  const { data: teams = [] } = useGetTeamsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const team = teams[0];
  const [open, setOpen] = useState(false);

  if (!team) return null;

  return (
    <div className="space-y-4">
      <PageHeader title={team.name} subtitle={`${team.members.length} members · covers ${team.wards.join(", ")}`}>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Icons.plus size={14} />Invite member
        </button>
      </PageHeader>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">Members</div>
          <div className="divide-y hairline">
            {team.members.map((uid) => {
              const u = getUser(users, uid);
              return (
                <div key={uid} className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-sm">
                    {u ? `${u.firstName[0]}${u.lastName[0]}` : "--"}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{u ? userFullName(u) : ""}</div>
                    <div className="text-xs ink-mute">{u?.email}</div>
                  </div>
                  {u && <RoleBadge role={u.role} />}
                  {u?.role !== "CONSULTANT" && (
                    <button className="btn btn-ghost text-xs" onClick={() => toast({ kind: "success", title: "Member removed" })}>
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">Pending invites</div>
          {team.pendingInvites.length === 0 ? (
            <div className="p-6 text-center ink-mute text-sm">No pending invites</div>
          ) : (
            <div className="divide-y hairline">
              {team.pendingInvites.map((i) => (
                <div key={i.id} className="p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{i.email}</div>
                    <div className="text-xs ink-mute">Invited {i.sentAt} · expires {i.expiresAt}</div>
                  </div>
                  <RoleBadge role={i.role} />
                  <button className="btn btn-ghost text-xs">Cancel</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Invite team member"
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                toast({ kind: "success", title: "Invite sent" });
                setOpen(false);
              }}
            >
              Send invite
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="User to invite" required>
            <select className="select">
              {users.filter((u) => ["REGISTRAR", "JUNIOR_DOCTOR"].includes(u.role)).map((u) => (
                <option key={u.id}>{userFullName(u)} - {u.role}</option>
              ))}
            </select>
          </Field>
          <Field label="Role on team"><select className="select"><option>REGISTRAR</option><option>JUNIOR_DOCTOR</option></select></Field>
          <Field label="Message (optional)"><textarea className="textarea" rows={3} /></Field>
        </div>
      </Modal>
    </div>
  );
}

export function EscalationInbox({ scope }: { scope: "consultant" | "registrar" }) {
  const toast = useToast();
  const { data: escalations = [] } = useGetEscalationsQuery();
  const { data: patients = [] } = useGetPatientsQuery();
  const { data: wards = [] } = useGetWardsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const [acknowledgeEscalation] = useAcknowledgeEscalationMutation();
  const [resolveEscalation] = useResolveEscalationMutation();

  let list = escalations;
  if (scope === "consultant") {
    list = list.filter((e) => e.severity === "RED" || e.status !== "RESOLVED");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={scope === "registrar" ? "On-call escalation queue" : "Escalation inbox"}
        subtitle={`${list.filter((e) => e.status === "OPEN").length} open · auto-refresh 20s`}
      />
      <div className="space-y-3">
        {list.map((e) => {
          const patient = patients.find((p) => p.id === e.patientId);
          const ward = patient ? getWard(wards, patient.wardId) : undefined;
          const assignee = getUser(users, e.assigneeId);
          return (
            <EscalationCard
              key={e.id}
              esc={e}
              patient={patient}
              wardName={ward?.name}
              assigneeName={assignee ? userFullName(assignee) : undefined}
              onAck={async (id) => {
                await acknowledgeEscalation({ id }).unwrap();
                toast({ kind: "success", title: "Escalation acknowledged" });
              }}
              onResolve={async (id) => {
                await resolveEscalation({ id }).unwrap();
                toast({ kind: "success", title: "Escalation resolved" });
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function AdmissionForm() {
  const toast = useToast();
  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: wards = [] } = useGetWardsQuery();
  const { data: onCall = [] } = useGetOnCallRotationsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const [dept, setDept] = useState(departments[0]?.id || "d1");

  return (
    <div className="space-y-4">
      <PageHeader title="Admit patient" subtitle="On-call admission - patient will be assigned to the on-call team" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 panel rounded p-5 space-y-4">
          <h3 className="font-semibold text-sm">Patient details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="MRN" hint="Or leave blank to auto-generate"><input className="input mono" placeholder="OMTH-" /></Field>
            <Field label="Admission type" required><select className="select"><option>EMERGENCY</option><option>ELECTIVE</option><option>TRANSFER</option></select></Field>
            <Field label="First name" required><input className="input" /></Field>
            <Field label="Last name" required><input className="input" /></Field>
            <Field label="Sex" required><select className="select"><option>M</option><option>F</option></select></Field>
            <Field label="Age" required><input className="input mono" type="number" min={0} max={120} /></Field>
          </div>
          <h3 className="font-semibold text-sm pt-2">Clinical</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Specialty / department" required>
              <select className="select" value={dept} onChange={(e) => setDept(e.target.value)}>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Ward" required>
              <select className="select">
                {wards.filter((w) => w.deptId === dept).map((w) => (
                  <option key={w.id}>{w.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Bed number" required><input className="input mono" placeholder="B-" /></Field>
            <Field label="Initial acuity" required><select className="select"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></Field>
          </div>
          <Field label="Primary diagnosis" required><input className="input" placeholder="e.g. Severe community-acquired pneumonia" /></Field>
          <Field label="Secondary diagnoses"><textarea className="textarea" rows={2} placeholder="One per line" /></Field>
          <Field label="Admission notes"><textarea className="textarea" rows={4} /></Field>
        </div>
        <div className="space-y-4">
          <div className="panel rounded p-4">
            <div className="field-label mb-2">On-call team for this specialty</div>
            <div className="font-semibold">{getDept(departments, dept)?.name || "-"}</div>
            <div className="text-xs ink-mute mt-1">Patient will be assigned to this firm</div>
            <div className="mt-3 pt-3 border-t hairline space-y-2">
              <div className="text-xs ink-mute">On-call now</div>
              {onCall.filter((o) => o.deptId === dept).map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm">
                  <span>{(() => {
                    const staff = getUser(users, o.userId);
                    return staff ? userFullName(staff) : "-";
                  })()}</span>
                  <RoleBadge role={o.role as Role} />
                </div>
              ))}
            </div>
          </div>
          <div className="panel rounded p-4 space-y-3">
            <h4 className="font-semibold text-sm">Next of kin</h4>
            <Field label="Name"><input className="input" /></Field>
            <Field label="Phone"><input className="input mono" placeholder="+234" /></Field>
            <Field label="Notify via"><select className="select"><option>SMS</option><option>EMAIL</option><option>BOTH</option></select></Field>
            <ToggleRow label="Consent given" />
          </div>
          <button className="btn btn-primary w-full justify-center" onClick={() => toast({ kind: "success", title: "Patient admitted", body: "OMTH-204971 - assigned to bed B-22" })}>
            Admit patient
          </button>
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

export function MyTasksList({ role }: { role: Role }) {
  const toast = useToast();
  const { data: tasks = [] } = useGetCareTasksQuery();
  const { data: patients = [] } = useGetPatientsQuery();
  const [updateCareTaskStatus] = useUpdateCareTaskStatusMutation();
  const [filter, setFilter] = useState("OPEN");
  let list = tasks.filter((t) => t.assigneeRole === role);
  if (filter === "OPEN") list = list.filter((t) => t.status !== "COMPLETED");
  if (filter === "COMPLETED") list = list.filter((t) => t.status === "COMPLETED");

  return (
    <div className="space-y-4">
      <PageHeader title="My tasks" subtitle={`${list.length} ${filter.toLowerCase()} · today 6 May 2026`}>
        {role === "NURSE" && <button className="btn btn-primary"><Icons.plus size={14} />New care plan task</button>}
      </PageHeader>
      <div className="flex gap-2">
        {["OPEN", "COMPLETED", "ALL"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`btn ${filter === f ? "btn-primary" : ""}`}>{f}</button>
        ))}
      </div>
      <div className="space-y-2">
        {list.map((t) => {
          const p = patients.find((x) => x.id === t.patientId);
          return (
            <TaskCard
              key={t.id}
              task={t}
              patientName={p ? patientFullName(p) : undefined}
              bed={p?.bed}
              onAdvance={async () => {
                const status = t.status === "PENDING" ? "IN_PROGRESS" : "COMPLETED";
                await updateCareTaskStatus({ id: t.id, status }).unwrap();
                toast({ kind: "success", title: `Task ${status === "IN_PROGRESS" ? "started" : "completed"}` });
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function HandoverNotesEntry() {
  const toast = useToast();
  const { data: patients = [] } = useGetPatientsQuery();
  const [notes, setNotes] = useState<Record<string, string>>({});

  return (
    <div className="space-y-4">
      <PageHeader title="Handover notes" subtitle="Soyinka Ward · End of morning shift · 14:30" />
      <div className="panel rounded p-3 flex items-center gap-3 bg-amber-50 border-amber-200">
        <Icons.alertCircle size={16} className="text-amber-700" />
        <div className="text-sm ink-2">Add a status summary for every patient. Mark urgent flags for the incoming team.</div>
      </div>
      <div className="space-y-3">
        {patients.filter((p) => p.wardId === "w1").map((p) => (
          <div key={p.id} className="panel rounded">
            <div className="px-4 py-3 border-b hairline flex items-center gap-3">
              <span className="mono text-xs">{p.bed}</span>
              <span className="font-semibold">{patientFullName(p)}</span>
              <AcuityBadge level={p.acuity} />
              <NEWSBadge score={p.news} size="sm" />
              <StatusChip status={p.status} />
              <label className="ml-auto flex items-center gap-1.5 text-xs">
                <input type="checkbox" />Urgent flag
              </label>
            </div>
            <div className="p-3">
              <textarea
                className="textarea"
                rows={2}
                placeholder="Status summary, outstanding jobs, things the night team must know"
                value={notes[p.id] || ""}
                onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <button
          className="btn btn-primary"
          onClick={() =>
            toast({
              kind: "success",
              title: "Handover notes saved",
              body: `${Object.keys(notes).length} of ${patients.filter((p) => p.wardId === "w1").length} patients with notes`
            })
          }
        >
          Save handover notes
        </button>
      </div>
    </div>
  );
}

export function RoundParticipateView() {
  const { data: rounds = [] } = useGetRoundsQuery();
  const { data: patients = [] } = useGetPatientsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const round = rounds.find((r) => r.status === "IN_PROGRESS");

  if (!round) {
    return <div className="panel rounded p-12 text-center ink-mute">No active round.</div>;
  }

  const queue = round.queue.map((id) => patients.find((p) => p.id === id)).filter(Boolean) as Patient[];

  return (
    <div className="space-y-4">
      <PageHeader title="Active ward round (read-only)" subtitle={`${round.type} round · led by ${userFullName(getUser(users, round.leadId) || users[0])} · started ${round.startedAt.slice(11)}`} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel rounded col-span-2">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">Patient queue</div>
          <div>
            {queue.map((p, i) => (
              <PatientRow
                key={p.id}
                patient={p}
                reviewed={round.reviewed.includes(p.id)}
                current={!round.reviewed.includes(p.id) && round.reviewed.length === i}
              />
            ))}
          </div>
        </div>
        <div className="panel rounded p-4">
          <div className="font-semibold text-sm mb-2">Participants</div>
          <div className="space-y-2 text-sm">
            {round.participants.map((uid) => {
              const u = getUser(users, uid);
              return (
                <div key={uid} className="flex items-center justify-between">
                  <span>{u ? userFullName(u) : "-"}</span>
                  {u && <RoleBadge role={u.role} />}
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t hairline">
            <div className="font-semibold text-sm mb-2">Progress</div>
            <div className="text-3xl font-semibold">{round.reviewed.length}<span className="text-base ink-mute font-normal">/{round.queue.length}</span></div>
            <div className="text-xs ink-mute">patients reviewed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
