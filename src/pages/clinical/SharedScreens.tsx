import { useEffect, useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";
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
  StatCard,
  StatusChip,
  TaskCard,
  useToast
} from "@/components/ui";
import { PageHeader } from "@/layouts/PageHeader";
import {
  useAcknowledgeEscalationMutation,
  useAdmitPatientMutation,
  useAmendNoteMutation,
  useCreateCareTaskMutation,
  useCreateClinicalNoteMutation,
  useCurrentWardCareTasks,
  useCurrentWardEscalations,
  useCurrentWardPatients,
  useCurrentWardRounds,
  useGetClinicalNotesByPatientQuery,
  useGetDepartmentsQuery,
  useAddPatientHandoverNoteMutation,
  useGetHandoverNotesQuery,
  useGetHandoversByWardQuery,
  useGetCurrentShiftQuery,
  useGetShiftsQuery,
  useGetLatestVitalsQuery,
  useGetOnCallRotationsQuery,
  useGetPatientByIdQuery,
  useGetPatientNextOfKinQuery,
  useGetCareTasksByPatientQuery,
  useGetConsultantDashboardQuery,
  useGetTeamsQuery,
  useGetUsersQuery,
  useGetVitalsHistoryQuery,
  useGetWardsQuery,
  useResolveEscalationMutation,
  useSendTeamInviteMutation,
  useInitiateHandoverMutation,
  useUpdateCareTaskStatus
} from "@/services/api";
import { useCurrentWardId } from "@/features/ward/currentWard";
import type { CareTask, ClinicalNote, NoteType, Patient, PatientHandoverNote, Role } from "@/types/domain";
import { getUser, getWard, patientFullName, userFullName } from "@/utils/format";
import { useAppSelector } from "@/app/hooks";

const ACUITY_ORDER: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

function dashboardNumber(data: Record<string, unknown> | undefined, keys: string[], fallback: number) {
  for (const key of keys) {
    const value = data?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return fallback;
}

function dashboardString(data: Record<string, unknown> | undefined, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = data?.[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

export function ConsultantDashboard() {
  const currentUser = useAppSelector((state) => state.auth.user);
  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    refetch: refetchDashboard
  } = useGetConsultantDashboardQuery();
  const { data: patients = [], isLoading: isPatientsLoading } = useCurrentWardPatients();
  const { data: teams = [] } = useGetTeamsQuery();
  const { data: tasks = [] } = useCurrentWardCareTasks();
  const { data: escalations = [] } = useCurrentWardEscalations();
  const { data: rounds = [] } = useCurrentWardRounds();

  const team =
    teams.find((t) => t.consultantId === currentUser?.id) ||
    teams.find((t) => t.departmentId === currentUser?.departmentId);
  const teamPatients = team ? patients.filter((p) => p.medicalTeamId === team.id) : patients;
  const openTasks = tasks.filter((t) => t.status !== "COMPLETED");
  const openEscalations = escalations.filter((e) => e.status !== "RESOLVED");
  const activeRounds = rounds.filter((r) => r.status === "IN_PROGRESS");

  const stats = [
    {
      label: "Team patients",
      value: dashboardNumber(dashboard, ["teamPatients", "patientCount", "patients", "totalPatients"], teamPatients.length),
      sub: `${teamPatients.filter((p) => p.acuityLevel === "CRITICAL" || p.status === "DETERIORATING").length} high attention`,
      accent: "#0b5cab",
      icon: <Icons.patients size={18} />
    },
    {
      label: "Open escalations",
      value: dashboardNumber(dashboard, ["openEscalations", "escalationCount", "activeEscalations"], openEscalations.length),
      sub: `${openEscalations.filter((e) => e.severity === "RED").length} red`,
      accent: "#b91c1c",
      icon: <Icons.escalation size={18} />
    },
    {
      label: "Open tasks",
      value: dashboardNumber(dashboard, ["openTasks", "pendingTasks", "taskCount"], openTasks.length),
      sub: `${openTasks.filter((t) => t.priority === "URGENT" || t.priority === "EMERGENCY").length} urgent`,
      accent: "#7c3aed",
      icon: <Icons.tasks size={18} />
    },
    {
      label: "Active rounds",
      value: dashboardNumber(dashboard, ["activeRounds", "roundsInProgress", "inProgressRounds"], activeRounds.length),
      sub: dashboardString(dashboard, ["teamName", "medicalTeamName"], team?.name || "Current team"),
      accent: "#15803d",
      icon: <Icons.rounds size={18} />
    }
  ];

  const loading = isDashboardLoading || isPatientsLoading;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Consultant dashboard"
        subtitle={isDashboardError ? "Backend dashboard unavailable" : "Live consultant summary"}
      >
        <button className="btn" onClick={() => refetchDashboard()}>
          <Icons.refresh size={14} />Refresh
        </button>
      </PageHeader>

      {isDashboardError && (
        <div className="panel rounded border-l-4 border-l-red-600 p-4 text-sm text-red-700">
          Could not load /dashboard/consultant. The clinical lists below are still loaded from backend endpoints.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} value={loading ? "..." : stat.value} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel rounded lg:col-span-2">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">Highest attention patients</div>
          <table className="cr">
            <thead>
              <tr>
                <th>Bed</th>
                <th>Patient</th>
                <th>NEWS</th>
                <th>Acuity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[...teamPatients]
                .sort(
                  (a, b) =>
                    (ACUITY_ORDER[b.acuityLevel] ?? 0) - (ACUITY_ORDER[a.acuityLevel] ?? 0) ||
                    (b.newsScore ?? 0) - (a.newsScore ?? 0)
                )
                .slice(0, 6)
                .map((patient) => (
                  <tr key={patient.id}>
                    <td className="mono text-xs">{patient.bedNumber || "-"}</td>
                    <td className="font-medium">{patientFullName(patient)}</td>
                    <td><NEWSBadge score={patient.newsScore} size="sm" /></td>
                    <td><AcuityBadge level={patient.acuityLevel} /></td>
                    <td><StatusChip status={patient.status} /></td>
                  </tr>
                ))}
              {!loading && teamPatients.length === 0 && (
                <tr><td colSpan={5} className="text-center ink-mute p-6">No team patients found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">Backend dashboard payload</div>
          <div className="p-4 text-xs">
            {isDashboardLoading ? (
              <div className="ink-mute">Loading dashboard summary...</div>
            ) : dashboard ? (
              <div className="space-y-2">
                {Object.entries(dashboard).slice(0, 8).map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between gap-3 border-b hairline pb-2">
                    <span className="ink-mute">{key}</span>
                    <span className="font-medium text-right break-all">{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ink-mute">No dashboard payload returned.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ageFromDob(dob: string | null | undefined): string {
  if (!dob) return "—";
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return "—";
  const ms = Date.now() - birth.getTime();
  const years = Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000));
  return `${years}y`;
}

export function PatientListPage({ scope, title }: { scope: "team" | "ward"; title: string }) {
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { data: patients = [], isLoading, isError, refetch } = useCurrentWardPatients();
  const { data: teams = [] } = useGetTeamsQuery();
  const [filter, setFilter] = useState("ALL");

  const list = useMemo(() => {
    let filtered = patients;
    if (scope === "team" && currentUser) {
      const myTeam =
        teams.find((t) => t.consultantId === currentUser.id) ||
        teams.find((t) => t.departmentId === currentUser.departmentId);
      if (myTeam) filtered = filtered.filter((p) => p.medicalTeamId === myTeam.id);
    }
    filtered = [...filtered].sort(
      (a, b) =>
        (ACUITY_ORDER[b.acuityLevel] ?? 0) - (ACUITY_ORDER[a.acuityLevel] ?? 0) ||
        (b.newsScore ?? 0) - (a.newsScore ?? 0)
    );
    if (filter !== "ALL") filtered = filtered.filter((p) => p.status === filter);
    return filtered;
  }, [patients, scope, teams, filter, currentUser]);

  return (
    <div className="space-y-4">
      <PageHeader title={title} subtitle={`${list.length} patients`}>
        <button className="btn" onClick={() => refetch()}><Icons.refresh size={14} />Refresh</button>
      </PageHeader>
      <div className="flex items-center gap-2 flex-wrap">
        {["ALL", "ADMITTED", "STABLE", "DETERIORATING", "DISCHARGE_READY"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`btn ${filter === s ? "btn-primary" : ""}`}>
            {s === "ALL" ? "All" : s.replace(/_/g, " ")}
            <span className="ink-mute ml-1">{s === "ALL" ? patients.length : patients.filter((p) => p.status === s).length}</span>
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="panel rounded p-6 text-center ink-mute sm:p-12">Loading patients…</div>
      ) : isError ? (
        <div className="panel rounded p-6 text-center text-red-700 sm:p-12">Could not load patients. <button className="underline" onClick={() => refetch()}>Retry</button></div>
      ) : list.length === 0 ? (
        <div className="panel rounded p-6 text-center ink-mute sm:p-12">No patients match this filter.</div>
      ) : (
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
                <th>Status</th>
                <th>Admitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const days = p.admissionDate ? Math.floor((Date.now() - new Date(p.admissionDate).getTime()) / 86400000) : 0;
                return (
                  <tr key={p.id} onClick={() => navigate(`./${p.id}`)} className="cursor-pointer">
                    <td className="mono text-xs">{p.bedNumber || "—"}</td>
                    <td className="font-semibold">
                      {patientFullName(p)}
                      <div className="text-xs ink-mute font-normal">{ageFromDob(p.dateOfBirth)} · {p.gender || "—"}</div>
                    </td>
                    <td className="mono text-xs ink-mute">{p.hospitalNumber}</td>
                    <td className="ink-2 max-w-[280px] truncate">{p.primaryDiagnosis || "—"}</td>
                    <td><AcuityBadge level={p.acuityLevel} /></td>
                    <td><NEWSBadge score={p.newsScore} size="sm" /></td>
                    <td><StatusChip status={p.status} /></td>
                    <td className="mono text-xs">{days}d</td>
                    <td><Icons.chevron size={14} className="text-slate-400" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: patient, isLoading: isLoadingPatient, isError } = useGetPatientByIdQuery(id || "", { skip: !id });
  const { data: wards = [] } = useGetWardsQuery();
  const { data: teams = [] } = useGetTeamsQuery();
  const { data: tasks = [] } = useGetCareTasksByPatientQuery(id || "", { skip: !id });
  const { data: notes = [] } = useGetClinicalNotesByPatientQuery(id || "", { skip: !id });

  const [tab, setTab] = useState("overview");

  if (isLoadingPatient) {
    return <div className="panel rounded p-6 text-center ink-mute sm:p-12">Loading patient…</div>;
  }
  if (isError || !patient) {
    return <div className="panel rounded p-6 text-center ink-mute sm:p-12">Patient not found.</div>;
  }

  const ward = getWard(wards, patient.wardId);
  const team = teams.find((t) => t.id === patient.medicalTeamId);

  return (
    <div className="space-y-4">
      <button className="btn btn-ghost text-sm" onClick={() => navigate(-1)}>← Back to list</button>
      <div className="panel rounded p-5">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{patientFullName(patient)}</h1>
              <AcuityBadge level={patient.acuityLevel} />
              <StatusChip status={patient.status} />
            </div>
            <div className="text-sm ink-mute mt-1 flex items-center gap-3 flex-wrap">
              <span className="mono">{patient.hospitalNumber}</span><span>·</span>
              <span>{ageFromDob(patient.dateOfBirth)} · {patient.gender || "—"}</span><span>·</span>
              <span>{ward?.name || "Ward"} · Bed {patient.bedNumber || "—"}</span><span>·</span>
              <span>Admitted {patient.admissionDate?.slice(0, 10) || "—"} ({patient.admissionType})</span>
              {team && <><span>·</span><span>{team.name}</span></>}
            </div>
            <div className="mt-3 text-[14px]">
              <span className="font-medium">Primary:</span> {patient.primaryDiagnosis || "—"}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <NEWSBadge score={patient.newsScore} size="lg" />
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

      {tab === "overview" && <PatientOverview patient={patient} tasks={tasks} notes={notes} />}
      {tab === "vitals" && <PatientVitalsTab patientId={patient.id} />}
      {tab === "notes" && <PatientNotesTab patientId={patient.id} notes={notes} />}
      {tab === "tasks" && <PatientTasksTab tasks={tasks} />}
      {tab === "nok" && <PatientNoKTab patientId={patient.id} />}
    </div>
  );
}

function PatientOverview({ patient, tasks, notes }: { patient: Patient; tasks: CareTask[]; notes: ClinicalNote[] }) {
  const { data: latestVitals } = useGetLatestVitalsQuery(patient.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="space-y-4 lg:col-span-2">
        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline flex flex-col gap-1 sm:flex-row sm:justify-between">
            <span className="font-semibold text-sm">Latest vitals</span>
            <span className="text-xs ink-mute">{latestVitals?.recordedAt?.slice(0, 16).replace("T", " ") || "no readings"}</span>
          </div>
          {latestVitals && (
            <div className="grid grid-cols-3 md:grid-cols-6 divide-x hairline">
              <Vital label="Resp rate" v={latestVitals.respiratoryRate} unit="/min" />
              <Vital label="SpO2" v={latestVitals.oxygenSaturation} unit="%" />
              <Vital label="Temp" v={latestVitals.temperature} unit="C" />
              <Vital label="Sys BP" v={latestVitals.systolicBP} unit="mmHg" />
              <Vital label="Heart rate" v={latestVitals.heartRate} unit="bpm" />
              <Vital label="LOC" v={latestVitals.consciousnessLevel} unit="" />
            </div>
          )}
        </div>
        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">Recent clinical notes</div>
          <div className="divide-y hairline">
            {notes.slice(0, 3).map((n) => (
              <div key={n.id} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="chip" style={{ background: "#dbeafe", color: "#1e40af" }}>{n.noteType.replace(/_/g, " ")}</span>
                  <span className="text-xs ink-mute">{n.createdAt?.slice(0, 16).replace("T", " ")}</span>
                </div>
                <p className="text-sm ink-2 leading-relaxed">{n.content}</p>
              </div>
            ))}
            {notes.length === 0 && (
              <div className="p-6 text-center ink-mute text-sm">No notes yet.</div>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="panel rounded p-4">
          <div className="font-semibold text-sm mb-2">Open tasks ({tasks.filter((t) => t.status !== "COMPLETED").length})</div>
          <div className="space-y-2">
            {tasks.filter((t) => t.status !== "COMPLETED").slice(0, 4).map((t) => (
              <div key={t.id} className="text-sm border-b hairline pb-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium">{t.title}</span>
                  <PriorityChip priority={t.priority} />
                </div>
                <div className="text-xs ink-mute mono mt-0.5">{t.windowStart}–{t.windowEnd}</div>
              </div>
            ))}
            {tasks.filter((t) => t.status !== "COMPLETED").length === 0 && (
              <div className="text-xs ink-mute">No open tasks.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Vital({ label, v, unit }: { label: string; v: number | string | undefined | null; unit: string }) {
  return (
    <div className="p-4">
      <div className="field-label">{label}</div>
      <div className="text-2xl font-semibold mt-1">
        {v ?? "—"}
        <span className="text-sm ink-mute font-normal ml-1">{unit}</span>
      </div>
    </div>
  );
}

function PatientVitalsTab({ patientId }: { patientId: string }) {
  const { data: history = [], isLoading } = useGetVitalsHistoryQuery({ patientId });

  return (
    <div className="panel rounded">
      <div className="px-4 py-3 border-b hairline flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-semibold text-sm">Vitals history</div>
        <span className="text-xs ink-mute">{history.length} recordings</span>
      </div>
      {isLoading ? (
        <div className="p-8 text-center ink-mute">Loading vitals…</div>
      ) : history.length === 0 ? (
        <div className="p-8 text-center ink-mute">No vitals recorded.</div>
      ) : (
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
            {[...history].reverse().map((v) => (
              <tr key={v.id}>
                <td className="mono text-xs">{v.recordedAt?.slice(0, 16).replace("T", " ")}</td>
                <td className="mono">{v.respiratoryRate}</td>
                <td className="mono">{v.oxygenSaturation}</td>
                <td className="mono">{v.temperature}</td>
                <td className="mono">{v.systolicBP}</td>
                <td className="mono">{v.heartRate}</td>
                <td>{v.consciousnessLevel}</td>
                <td><NEWSBadge score={v.newsScore} size="sm" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PatientNotesTab({ patientId, notes }: { patientId: string; notes: ClinicalNote[] }) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const { data: users = [] } = useGetUsersQuery();
  const [createNote, { isLoading: isCreating }] = useCreateClinicalNoteMutation();
  const [amendNote] = useAmendNoteMutation();
  const [noteType, setNoteType] = useState<NoteType>("PROGRESS_NOTE");
  const [content, setContent] = useState("");
  const [amendOpen, setAmendOpen] = useState<{ id: string; original: string } | null>(null);
  const [amendText, setAmendText] = useState("");

  async function save() {
    if (!content.trim()) return;
    try {
      await createNote({ patientId, noteType, content }).unwrap();
      toast({ kind: "success", title: "Note saved" });
      setOpen(false);
      setContent("");
    } catch {
      toast({ kind: "error", title: "Could not save note" });
    }
  }

  async function submitAmend() {
    if (!amendOpen || !amendText.trim()) return;
    try {
      await amendNote({ noteId: amendOpen.id, content: amendText }).unwrap();
      toast({ kind: "success", title: "Note amended" });
      setAmendOpen(null);
      setAmendText("");
    } catch {
      toast({ kind: "error", title: "Could not amend note" });
    }
  }

  return (
    <div className="space-y-3">
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <Icons.plus size={14} />New note
      </button>
      <div className="panel rounded divide-y hairline">
        {notes.length === 0 && <div className="p-6 text-center ink-mute text-sm">No notes yet.</div>}
        {notes.map((n) => {
          const author = getUser(users, n.authorId);
          return (
            <div key={n.id} className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="chip" style={{ background: "#dbeafe", color: "#1e40af" }}>{n.noteType.replace(/_/g, " ")}</span>
                <span className="text-sm font-medium">{author ? userFullName(author) : "Unknown"}</span>
                <span className="text-xs ink-mute">· {n.createdAt?.slice(0, 16).replace("T", " ")}</span>
                {n.isAmended && <span className="chip" style={{ background: "#fef3c7", color: "#854d0e" }}>amended</span>}
                <button className="ml-auto btn btn-ghost text-xs" onClick={() => setAmendOpen({ id: n.id, original: n.content })}>
                  Amend
                </button>
              </div>
              <p className="text-sm ink-2 leading-relaxed whitespace-pre-wrap">{n.content}</p>
            </div>
          );
        })}
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New clinical note"
        width={640}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={isCreating || !content.trim()}>
              {isCreating ? "Saving…" : "Save note"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Type" required>
            <select className="select" value={noteType} onChange={(e) => setNoteType(e.target.value as NoteType)}>
              <option value="PROGRESS_NOTE">PROGRESS_NOTE</option>
              <option value="ROUND_NOTE">ROUND_NOTE</option>
              <option value="ADMISSION_NOTE">ADMISSION_NOTE</option>
              <option value="DISCHARGE_NOTE">DISCHARGE_NOTE</option>
              <option value="ESCALATION_NOTE">ESCALATION_NOTE</option>
            </select>
          </Field>
          <Field label="Note" required>
            <textarea
              className="textarea"
              rows={8}
              placeholder="Document assessment, plan, and any escalation"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Field>
          <p className="text-[11px] ink-mute">Notes are immutable once saved. Use Amend to add corrections; the original remains in the audit trail.</p>
        </div>
      </Modal>
      <Modal
        open={!!amendOpen}
        onClose={() => setAmendOpen(null)}
        title="Amend note"
        width={640}
        footer={
          <>
            <button className="btn" onClick={() => setAmendOpen(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitAmend} disabled={!amendText.trim()}>Submit amendment</button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="border hairline rounded p-3 text-xs ink-mute whitespace-pre-wrap">{amendOpen?.original}</div>
          <Field label="Amended text" required>
            <textarea className="textarea" rows={6} value={amendText} onChange={(e) => setAmendText(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

function PatientTasksTab({ tasks }: { tasks: CareTask[] }) {
  if (tasks.length === 0) {
    return <div className="panel rounded p-8 text-center ink-mute">No tasks for this patient.</div>;
  }
  return <div className="space-y-2">{tasks.map((t) => <TaskCard key={t.id} task={t} />)}</div>;
}

function PatientNoKTab({ patientId }: { patientId: string }) {
  const { data: nok = [], isLoading } = useGetPatientNextOfKinQuery(patientId);

  if (isLoading) {
    return <div className="panel rounded p-8 text-center ink-mute">Loading contacts…</div>;
  }
  return (
    <div className="panel rounded p-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold text-sm">Next of kin contacts</h3>
      </div>
      {nok.length === 0 && <div className="text-sm ink-mute">No next of kin on file.</div>}
      {nok.map((n) => (
        <div key={n.id} className="border hairline rounded p-3 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <div>
            <div className="field-label">Name</div>
            <div className="font-medium">{n.name}</div>
          </div>
          <div>
            <div className="field-label">Relationship</div>
            <div>{n.relationship || "—"}</div>
          </div>
          <div>
            <div className="field-label">Contact</div>
            <div className="mono text-sm">{n.phone || "—"}</div>
            {n.email && <div className="mono text-xs ink-mute">{n.email}</div>}
          </div>
          <div>
            <div className="field-label">Notify · Consent</div>
            <div className="text-sm">
              {n.preferredContactMethod} ·{" "}
              {n.notificationConsent ? <span className="text-emerald-700">Granted</span> : <span className="text-amber-700">Not granted</span>}
            </div>
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
  const currentUser = useAppSelector((state) => state.auth.user);
  const [sendInvite, { isLoading: isSending }] = useSendTeamInviteMutation();
  const [open, setOpen] = useState(false);
  const [invitedUserId, setInvitedUserId] = useState("");

  const team =
    teams.find((t) => t.consultantId === currentUser?.id) ||
    teams.find((t) => t.departmentId === currentUser?.departmentId) ||
    teams[0];

  if (!team) {
    return <div className="panel rounded p-6 text-center ink-mute sm:p-12">No team found.</div>;
  }

  const consultant = team.consultantId ? getUser(users, team.consultantId) : undefined;

  async function send() {
    if (!invitedUserId) return;
    try {
      await sendInvite({ teamId: team!.id, invitedUserId }).unwrap();
      toast({ kind: "success", title: "Invite sent" });
      setOpen(false);
      setInvitedUserId("");
    } catch {
      toast({ kind: "error", title: "Could not send invite" });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={team.name} subtitle={consultant ? `Led by ${userFullName(consultant)}` : "—"}>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Icons.plus size={14} />Invite member
        </button>
      </PageHeader>
      <div className="panel rounded p-4 text-sm ink-2">
        Team membership is updated through invitations. Use the button above to invite a registrar or junior doctor.
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Invite team member"
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={send} disabled={isSending || !invitedUserId}>
              {isSending ? "Sending…" : "Send invite"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="User to invite" required>
            <select className="select" value={invitedUserId} onChange={(e) => setInvitedUserId(e.target.value)}>
              <option value="">— Select —</option>
              {users.filter((u) => ["REGISTRAR", "JUNIOR_DOCTOR"].includes(u.role)).map((u) => (
                <option key={u.id} value={u.id}>{userFullName(u)} — {u.role}</option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}

export function EscalationInbox({ scope }: { scope: "consultant" | "registrar" }) {
  const toast = useToast();
  const { data: escalations = [], isLoading } = useCurrentWardEscalations();
  const { data: patients = [] } = useCurrentWardPatients();
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
        subtitle={`${list.filter((e) => e.status === "OPEN").length} open`}
      />
      {isLoading ? (
        <div className="panel rounded p-8 text-center ink-mute">Loading escalations…</div>
      ) : list.length === 0 ? (
        <div className="panel rounded p-6 text-center ink-mute sm:p-12">No escalations.</div>
      ) : (
        <div className="space-y-3">
          {list.map((e) => {
            const patient = patients.find((p) => p.id === e.patientId);
            const ward = patient ? getWard(wards, patient.wardId) : undefined;
            const assignee = e.assignedToId ? getUser(users, e.assignedToId) : undefined;
            return (
              <EscalationCard
                key={e.id}
                esc={e}
                patient={patient}
                wardName={ward?.name}
                assigneeName={assignee ? userFullName(assignee) : undefined}
                onAck={async (id) => {
                  try {
                    await acknowledgeEscalation({ escalationId: id }).unwrap();
                    toast({ kind: "success", title: "Escalation acknowledged" });
                  } catch {
                    toast({ kind: "error", title: "Could not acknowledge" });
                  }
                }}
                onResolve={async (id) => {
                  try {
                    await resolveEscalation({ escalationId: id, notes: "Resolved" }).unwrap();
                    toast({ kind: "success", title: "Escalation resolved" });
                  } catch {
                    toast({ kind: "error", title: "Could not resolve" });
                  }
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdmissionForm() {
  const toast = useToast();
  const wardId = useCurrentWardId();
  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: wards = [] } = useGetWardsQuery();
  const { data: teams = [] } = useGetTeamsQuery();
  const { data: onCall = [] } = useGetOnCallRotationsQuery();
  const { data: users = [] } = useGetUsersQuery();
  const [admit, { isLoading }] = useAdmitPatientMutation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [hospitalNumber, setHospitalNumber] = useState("");
  const [admissionType, setAdmissionType] = useState("EMERGENCY");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("M");
  const [departmentId, setDepartmentId] = useState("");
  const [selectedWardId, setSelectedWardId] = useState("");
  const [medicalTeamId, setMedicalTeamId] = useState("");
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState("");
  const [specialtyRequired, setSpecialtyRequired] = useState("");

  useEffect(() => {
    if (!departmentId && departments.length) setDepartmentId(departments[0].id);
  }, [departmentId, departments]);

  useEffect(() => {
    if (!selectedWardId && wardId) setSelectedWardId(wardId);
  }, [selectedWardId, wardId]);

  useEffect(() => {
    if (!medicalTeamId && teams.length) setMedicalTeamId(teams[0].id);
  }, [medicalTeamId, teams]);

  async function submit() {
    if (!firstName || !lastName || !hospitalNumber || !dateOfBirth || !selectedWardId || !medicalTeamId || !primaryDiagnosis) {
      toast({ kind: "error", title: "Fill all required fields" });
      return;
    }
    try {
      await admit({
        wardId: selectedWardId,
        medicalTeamId,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        hospitalNumber,
        admissionType,
        primaryDiagnosis,
        specialtyRequired: specialtyRequired || primaryDiagnosis
      }).unwrap();
      toast({ kind: "success", title: "Patient admitted" });
      setFirstName("");
      setLastName("");
      setHospitalNumber("");
      setPrimaryDiagnosis("");
      setSpecialtyRequired("");
    } catch {
      toast({ kind: "error", title: "Admission failed" });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Admit patient" subtitle="New patient admission" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel rounded p-4 space-y-4 sm:p-5 lg:col-span-2">
          <h3 className="font-semibold text-sm">Patient details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Hospital number (MRN)" required>
              <input className="input mono" value={hospitalNumber} onChange={(e) => setHospitalNumber(e.target.value)} placeholder="OMTH-" />
            </Field>
            <Field label="Admission type" required>
              <select className="select" value={admissionType} onChange={(e) => setAdmissionType(e.target.value)}>
                <option>EMERGENCY</option>
                <option>ELECTIVE</option>
                <option>TRANSFER</option>
              </select>
            </Field>
            <Field label="First name" required><input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></Field>
            <Field label="Last name" required><input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} /></Field>
            <Field label="Gender" required>
              <select className="select" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option>M</option><option>F</option><option>OTHER</option>
              </select>
            </Field>
            <Field label="Date of birth" required>
              <input className="input mono" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </Field>
          </div>
          <h3 className="font-semibold text-sm pt-2">Clinical</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Department" required>
              <select className="select" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Ward" required>
              <select className="select" value={selectedWardId} onChange={(e) => setSelectedWardId(e.target.value)}>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Medical team" required>
              <select className="select" value={medicalTeamId} onChange={(e) => setMedicalTeamId(e.target.value)}>
                {teams.filter((t) => !departmentId || t.departmentId === departmentId).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Specialty required">
              <input className="input" value={specialtyRequired} onChange={(e) => setSpecialtyRequired(e.target.value)} />
            </Field>
          </div>
          <Field label="Primary diagnosis" required>
            <input className="input" value={primaryDiagnosis} onChange={(e) => setPrimaryDiagnosis(e.target.value)} placeholder="e.g. Severe community-acquired pneumonia" />
          </Field>
        </div>
        <div className="space-y-4">
          <div className="panel rounded p-4">
            <div className="field-label mb-2">On-call now (in this department)</div>
            {onCall.filter((o) => o.departmentId === departmentId).length === 0 && (
              <div className="text-xs ink-mute">No active on-call.</div>
            )}
            {onCall.filter((o) => o.departmentId === departmentId).map((o) => {
              const staff = getUser(users, o.doctorId);
              return (
                <div key={o.id} className="flex flex-col gap-1 text-sm mb-1 sm:flex-row sm:items-center sm:justify-between">
                  <span>{staff ? userFullName(staff) : "—"}</span>
                  <RoleBadge role={o.role.includes("CONSULTANT") ? "CONSULTANT" : "REGISTRAR"} />
                </div>
              );
            })}
          </div>
          <button className="btn btn-primary w-full justify-center" onClick={submit} disabled={isLoading}>
            {isLoading ? "Admitting…" : "Admit patient"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MyTasksList({ role }: { role: Role }) {
  const toast = useToast();
  const { data: tasks = [], isLoading } = useCurrentWardCareTasks();
  const { data: patients = [] } = useCurrentWardPatients();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateCareTaskStatus();
  const [createTask, { isLoading: isCreating }] = useCreateCareTaskMutation();
  const [filter, setFilter] = useState("OPEN");
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState("Observation");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("ROUTINE");
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");

  let list = tasks.filter((t) => t.assignedToRole === role);
  if (filter === "OPEN") list = list.filter((t) => t.status !== "COMPLETED");
  if (filter === "COMPLETED") list = list.filter((t) => t.status === "COMPLETED");

  async function submitTask() {
    if (!patientId || !title || !windowStart || !windowEnd) {
      toast({ kind: "error", title: "Fill all required task fields" });
      return;
    }
    try {
      await createTask({
        patientId,
        taskType,
        source: "NURSING_CARE_PLAN",
        title,
        description: description || undefined,
        priority,
        windowStart: new Date(windowStart).toISOString(),
        windowEnd: new Date(windowEnd).toISOString()
      }).unwrap();
      toast({ kind: "success", title: "Care plan task created" });
      setOpen(false);
      setPatientId("");
      setTitle("");
      setTaskType("Observation");
      setDescription("");
      setPriority("ROUTINE");
      setWindowStart("");
      setWindowEnd("");
    } catch {
      toast({ kind: "error", title: "Could not create task" });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="My tasks" subtitle={`${list.length} ${filter.toLowerCase()}`}>
        {role === "NURSE" && <button className="btn btn-primary" onClick={() => setOpen(true)}><Icons.plus size={14} />New care plan task</button>}
      </PageHeader>
      <div className="flex gap-2">
        {["OPEN", "COMPLETED", "ALL"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`btn ${filter === f ? "btn-primary" : ""}`}>{f}</button>
        ))}
      </div>
      {isLoading ? (
        <div className="panel rounded p-8 text-center ink-mute">Loading tasks…</div>
      ) : list.length === 0 ? (
        <div className="panel rounded p-8 text-center ink-mute">No tasks.</div>
      ) : (
        <div className="space-y-2">
          {list.map((t) => {
            const p = patients.find((x) => x.id === t.patientId);
            return (
              <TaskCard
                key={t.id}
                task={t}
                patientName={p ? patientFullName(p) : undefined}
                bed={p?.bedNumber || undefined}
                onAdvance={async () => {
                  const status = t.status === "PENDING" ? "IN_PROGRESS" : "COMPLETED";
                  try {
                    await updateStatus({ taskId: t.id, status });
                    toast({ kind: "success", title: `Task ${status === "IN_PROGRESS" ? "started" : "completed"}` });
                  } catch {
                    toast({ kind: "error", title: "Could not update task" });
                  }
                }}
              />
            );
          })}
        </div>
      )}
      {isUpdating && <div className="text-xs ink-mute">Updating...</div>}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New care plan task"
        width={640}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitTask} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create task"}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Patient" required>
              <select className="select" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                <option value="">Select...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.bedNumber ? `${p.bedNumber} - ` : ""}{patientFullName(p)}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Task type" required>
            <input className="input" value={taskType} onChange={(e) => setTaskType(e.target.value)} />
          </Field>
          <Field label="Priority" required>
            <select className="select" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option>ROUTINE</option>
              <option>URGENT</option>
              <option>EMERGENCY</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Title" required>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
          </div>
          <Field label="Window start" required>
            <input className="input mono" type="datetime-local" value={windowStart} onChange={(e) => setWindowStart(e.target.value)} />
          </Field>
          <Field label="Window end" required>
            <input className="input mono" type="datetime-local" value={windowEnd} onChange={(e) => setWindowEnd(e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea className="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function HandoverNotesEntry() {
  const toast = useToast();
  const wardId = useCurrentWardId();
  const currentUser = useAppSelector((state) => state.auth.user);
  const now = new Date();
  const shiftsFrom = new Date(now);
  shiftsFrom.setHours(0, 0, 0, 0);
  const shiftsTo = new Date(now);
  shiftsTo.setDate(shiftsTo.getDate() + 2);
  shiftsTo.setHours(23, 59, 59, 999);
  const { data: patients = [], isLoading } = useCurrentWardPatients();
  const { data: tasks = [] } = useCurrentWardCareTasks();
  const { data: handovers = [] } = useGetHandoversByWardQuery(wardId || "", { skip: !wardId });
  const { data: currentShift } = useGetCurrentShiftQuery(wardId || "", { skip: !wardId });
  const { data: shifts = [] } = useGetShiftsQuery(
    wardId ? { wardId, from: shiftsFrom.toISOString(), to: shiftsTo.toISOString() } : skipToken
  );
  const previousHandover = [...handovers]
    .filter((handover) => handover.status === "COMPLETED" || Boolean(handover.completedAt))
    .sort((a, b) => (b.completedAt || b.updatedAt || b.createdAt).localeCompare(a.completedAt || a.updatedAt || a.createdAt))[0];
  const { data: previousHandoverNotes = [], isLoading: isLoadingPreviousNotes } = useGetHandoverNotesQuery(
    previousHandover?.id || "",
    { skip: !previousHandover?.id }
  );
  const [addHandoverNote, { isLoading: isSaving }] = useAddPatientHandoverNoteMutation();
  const [initiateHandover, { isLoading: isInitiating }] = useInitiateHandoverMutation();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [urgent, setUrgent] = useState<Record<string, boolean>>({});

  const activeHandover =
    handovers.find((h) => h.status === "IN_PROGRESS" || h.status === "PENDING") ||
    handovers.find((h) => !h.completedAt);
  const { data: outgoingHandoverNotes = [], isLoading: isLoadingOutgoingNotes } = useGetHandoverNotesQuery(
    activeHandover?.id || "",
    { skip: !activeHandover?.id }
  );
  const entries = patients.filter((p) => notes[p.id]?.trim());
  const hasNotes = entries.length > 0;
  const incomingShift = shifts
    .filter((shift) => shift.id !== currentShift?.id && shift.startTime > (currentShift?.startTime || ""))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  async function saveNotes() {
    if (!hasNotes) {
      toast({ kind: "error", title: "Add at least one handover note" });
      return;
    }

    let effectiveHandover = activeHandover;
    if (!effectiveHandover) {
      if (!wardId || !currentShift || !incomingShift) {
        toast({
          kind: "error",
          title: "Cannot start handover yet",
          body: "An outgoing and incoming shift are required before notes can be saved."
        });
        return;
      }
      try {
        effectiveHandover = await initiateHandover({
          wardId,
          outgoingShiftId: currentShift.id,
          incomingShiftId: incomingShift.id
        }).unwrap();
      } catch {
        toast({ kind: "error", title: "Could not initiate handover" });
        return;
      }
    }

    try {
      for (const patient of entries) {
        const outstandingTaskIds = tasks
          .filter((t) => t.patientId === patient.id && t.status !== "COMPLETED")
          .map((t) => t.id)
          .join(",");
        await addHandoverNote({
          handoverId: effectiveHandover.id,
          patientId: patient.id,
          statusSummary: notes[patient.id],
          outstandingTaskIds: outstandingTaskIds || undefined,
          urgencyFlag: Boolean(urgent[patient.id])
        }).unwrap();
      }
      toast({ kind: "success", title: "Handover notes saved", body: `${entries.length} of ${patients.length} patients with notes` });
      setNotes({});
      setUrgent({});
    } catch {
      toast({ kind: "error", title: "Could not save handover notes" });
    }
  }

  function renderHandoverNoteList(notesList: PatientHandoverNote[], emptyText: string, showAuthor = false) {
    if (notesList.length === 0) {
      return <div className="text-sm ink-mute">{emptyText}</div>;
    }

    return (
      <div className="space-y-3">
        {notesList.map((note) => {
          const patient = patients.find((entry) => entry.id === note.patientId);
          const addedByCurrentUser = Boolean(currentUser?.id && note.addedById === currentUser.id);
          return (
            <div key={note.id} className="rounded border hairline p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold">{patient ? patientFullName(patient) : note.patientId}</div>
                  <div className="text-xs ink-mute">{patient?.bedNumber ? `Bed ${patient.bedNumber}` : "Patient handover note"}</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {showAuthor && addedByCurrentUser && <span className="chip bg-blue-50 text-blue-700">Added by you</span>}
                  {note.urgencyFlag && <span className="chip bg-red-100 text-red-700">Urgent</span>}
                </div>
              </div>
              {note.statusSummary && <p className="mt-2 text-sm ink-2">{note.statusSummary}</p>}
              {note.outstandingTaskIds && <div className="mt-2 text-xs ink-mute">Outstanding tasks: {note.outstandingTaskIds}</div>}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Handover notes" subtitle="Add a status summary for every patient" />
      
      <div className="panel rounded p-3 flex items-center gap-3 bg-amber-50 border-amber-200">
        <Icons.alertCircle size={16} className="text-amber-700" />
        <div className="text-sm ink-2">Mark urgent flags for the incoming team.</div>
      </div>
      {isLoading ? (
        <div className="panel rounded p-8 text-center ink-mute">Loading patients…</div>
      ) : (
        <div className="space-y-3">
          {patients.map((p) => (
            <div key={p.id} className="panel rounded">
              <div className="px-4 py-3 border-b hairline flex items-center gap-3">
                <span className="mono text-xs">{p.bedNumber || "—"}</span>
                <span className="font-semibold">{patientFullName(p)}</span>
                <AcuityBadge level={p.acuityLevel} />
                <NEWSBadge score={p.newsScore} size="sm" />
                <StatusChip status={p.status} />
                <label className="ml-auto flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={Boolean(urgent[p.id])}
                    onChange={(e) => setUrgent({ ...urgent, [p.id]: e.target.checked })}
                  />Urgent flag
                </label>
              </div>
              <div className="p-3">
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="Status summary, outstanding jobs, things the next team must know"
                  value={notes[p.id] || ""}
                  onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end">
        <button
          className="btn btn-primary"
          onClick={saveNotes}
          disabled={isSaving || isInitiating || !hasNotes}
        >
          {isSaving || isInitiating ? "Saving..." : "Save handover notes"}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="panel rounded overflow-hidden">
          <div className="border-b hairline px-4 py-3">
            <div className="font-semibold text-sm">Incoming from previous shift</div>
            <div className="text-xs ink-mute">
              {previousHandover
                ? `Completed ${previousHandover.completedAt?.slice(0, 16).replace("T", " ") || "recently"}`
                : "No completed handover found"}
            </div>
          </div>
          <div className="p-4">
            {!previousHandover ? (
              <div className="text-sm ink-mute">No notes have been handed over from a preceding shift yet.</div>
            ) : isLoadingPreviousNotes ? (
              <div className="text-sm ink-mute">Loading previous handover notes...</div>
            ) : (
              renderHandoverNoteList(previousHandoverNotes, "No notes were handed over from the previous shift.")
            )}
          </div>
        </div>

        <div className="panel rounded overflow-hidden">
          <div className="border-b hairline px-4 py-3">
            <div className="font-semibold text-sm">Outgoing to next shift</div>
            <div className="text-xs ink-mute">
              {activeHandover
                ? `${activeHandover.status.replace("_", " ").toLowerCase()} handover`
                : "No active handover yet"}
            </div>
          </div>
          <div className="p-4">
            {!activeHandover ? (
              <div className="text-sm ink-mute">Saved notes for the succeeding shift will appear here.</div>
            ) : isLoadingOutgoingNotes ? (
              <div className="text-sm ink-mute">Loading outgoing handover notes...</div>
            ) : (
              renderHandoverNoteList(outgoingHandoverNotes, "No notes saved for the succeeding shift yet.", true)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RoundParticipateView() {
  const { data: rounds = [], isLoading } = useCurrentWardRounds();
  const { data: patients = [] } = useCurrentWardPatients();
  const { data: users = [] } = useGetUsersQuery();
  const round = rounds.find((r) => r.status === "IN_PROGRESS");

  if (isLoading) {
    return <div className="panel rounded p-6 text-center ink-mute sm:p-12">Loading rounds…</div>;
  }
  if (!round) {
    return <div className="panel rounded p-6 text-center ink-mute sm:p-12">No active round.</div>;
  }

  const lead = getUser(users, round.leadDoctorId);
  const participants = (round.teamMembers || "").split(",").map((s) => s.trim()).filter(Boolean);
  const queue = [...patients].sort(
    (a, b) =>
      (ACUITY_ORDER[b.acuityLevel] ?? 0) - (ACUITY_ORDER[a.acuityLevel] ?? 0) ||
      (b.newsScore ?? 0) - (a.newsScore ?? 0)
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Active ward round (read-only)"
        subtitle={`${round.roundType} round${lead ? ` · led by ${userFullName(lead)}` : ""}${round.startedAt ? ` · started ${round.startedAt.slice(11, 16)}` : ""}`}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel rounded lg:col-span-2">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">Patient queue</div>
          <div>
            {queue.map((p) => (
              <PatientRow key={p.id} patient={p} />
            ))}
          </div>
        </div>
        <div className="panel rounded p-4">
          <div className="font-semibold text-sm mb-2">Participants</div>
          <div className="space-y-2 text-sm">
            {participants.length === 0 && <div className="ink-mute text-xs">—</div>}
            {participants.map((uid) => {
              const u = getUser(users, uid);
              return (
                <div key={uid} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span>{u ? userFullName(u) : "—"}</span>
                  {u && <RoleBadge role={u.role} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
