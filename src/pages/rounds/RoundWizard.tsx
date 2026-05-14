import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Field, Icons, NEWSBadge, PatientRow, PriorityChip, RoleBadge, useToast } from "@/components/ui";
import { useAppSelector } from "@/app/hooks";
import {
  useCurrentWardPatients,
  useCurrentWardShift,
  useGetTeamsQuery,
  useGetUsersQuery,
  useCreateRoundMutation,
  useStartRoundMutation,
  useCompleteRoundMutation,
  useReviewPatientMutation,
  useCreateCareTaskMutation,
  useGetLatestVitalsQuery,
  useMarkDischargeReadyMutation
} from "@/services/api";
import { useCurrentMedicalTeamId, useCurrentWardId } from "@/features/ward/currentWard";
import type {
  AssignedToRole,
  ClinicalStatus,
  DischargeAssessment,
  Patient,
  Role,
  RoundType,
  TaskPriority
} from "@/types/domain";
import { patientFullName, userFullName } from "@/utils/format";

type RoundReview = {
  clinicalStatus: ClinicalStatus;
  wasExamined: boolean;
  managementPlan: string;
  dischargeAssessment: DischargeAssessment;
  notifiedNextOfKin: boolean;
};

type RoundTaskDraft = {
  id: string;
  title: string;
  priority: TaskPriority;
  assigneeRole: AssignedToRole;
  windowStart: string;
  windowEnd: string;
};

type RoundDraft = {
  type: RoundType;
  leadId: string;
  participants: string[];
  queue: string[];
  reviewed: Record<string, RoundReview>;
  tasks: Record<string, RoundTaskDraft[]>;
  currentIdx: number;
  roundId: string | null;
};

type RoundStateSetter = Dispatch<SetStateAction<RoundDraft>>;

const ACUITY_ORDER: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

function todayAtTimeIso(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date.toISOString();
}

function todayAtTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

export default function RoundWizard() {
  const toast = useToast();
  const { data: patients = [], isLoading: isLoadingPatients } = useCurrentWardPatients();
  const { data: currentShift } = useCurrentWardShift();
  const role = useAppSelector((state) => state.auth.role) || "CONSULTANT";
  const user = useAppSelector((state) => state.auth.user);
  const wardId = useCurrentWardId();
  const teamId = useCurrentMedicalTeamId();

  const [createRound] = useCreateRoundMutation();
  const [startRound] = useStartRoundMutation();
  const [completeRound] = useCompleteRoundMutation();

  const sortedPatients = useMemo(() => {
    return [...patients].sort(
      (a, b) =>
        (ACUITY_ORDER[b.acuityLevel] ?? 0) - (ACUITY_ORDER[a.acuityLevel] ?? 0) ||
        (b.newsScore ?? 0) - (a.newsScore ?? 0)
    );
  }, [patients]);

  const [step, setStep] = useState(() => {
    const saved = sessionStorage.getItem("cr_round_step");
    return saved ? Number(saved) : 0;
  });

  const [round, setRound] = useState<RoundDraft>({
    type: "MORNING",
    leadId: user?.id || "",
    participants: [],
    queue: [],
    reviewed: {},
    tasks: {},
    currentIdx: 0,
    roundId: null
  });

  useEffect(() => {
    sessionStorage.setItem("cr_round_step", String(step));
  }, [step]);

  useEffect(() => {
    if (round.queue.length === 0 && sortedPatients.length) {
      setRound((r) => ({
        ...r,
        queue: sortedPatients.map((p) => p.id),
        leadId: r.leadId || currentShift?.leadDoctorId || user?.id || ""
      }));
    }
  }, [currentShift?.leadDoctorId, sortedPatients, round.queue.length, user?.id]);

  async function beginRound() {
    if (!wardId || !teamId || !round.leadId) {
      toast({ kind: "error", title: "Missing ward, team, or lead doctor" });
      return;
    }
    if (!currentShift || currentShift.status !== "ACTIVE") {
      toast({ kind: "error", title: "No active shift for this ward" });
      return;
    }
    if (currentShift.leadDoctorId && round.leadId !== currentShift.leadDoctorId) {
      toast({ kind: "error", title: "Lead doctor must match the active shift lead" });
      return;
    }
    try {
      const created = await createRound({
        wardId,
        medicalTeamId: teamId,
        roundType: round.type,
        leadDoctorId: round.leadId,
        teamMembers: round.participants.length ? round.participants.join(",") : undefined
      }).unwrap();
      await startRound(created.id).unwrap();
      setRound((r) => ({ ...r, roundId: created.id }));
      setStep(2);
    } catch {
      toast({ kind: "error", title: "Could not start round" });
    }
  }

  async function finishRound() {
    if (!round.roundId) {
      setStep(0);
      sessionStorage.removeItem("cr_round_step");
      return;
    }
    try {
      await completeRound(round.roundId).unwrap();
      toast({ kind: "success", title: "Round completed" });
    } catch {
      toast({ kind: "error", title: "Could not complete round" });
    }
    sessionStorage.removeItem("cr_round_step");
    setStep(0);
    setRound({
      type: "MORNING",
      leadId: user?.id || "",
      participants: [],
      queue: sortedPatients.map((p) => p.id),
      reviewed: {},
      tasks: {},
      currentIdx: 0,
      roundId: null
    });
  }

  const stepNames = ["Setup", "Confirm and start", "Patient queue", "Review", "Post-round tasks", "Complete"];

  if (isLoadingPatients) {
    return <div className="panel rounded p-6 text-center ink-mute sm:p-12">Loading ward patients…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Conduct ward round</h1>
          <p className="text-xs ink-mute">Step {step + 1} of 6 · {stepNames[step]}</p>
        </div>
        <button className="btn btn-ghost text-sm" onClick={() => { sessionStorage.removeItem("cr_round_step"); setStep(0); }}>
          Restart
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        {stepNames.map((s, i) => (
          <div key={s} className={`flex-1 h-1 rounded-full ${i <= step ? "bg-[var(--cr-brand)]" : "bg-slate-200"}`} />
        ))}
      </div>

      {step === 0 && <Step0 round={round} setRound={setRound} onNext={() => setStep(1)} />}
      {step === 1 && <Step1 round={round} onBack={() => setStep(0)} onNext={beginRound} patients={sortedPatients} />}
      {step === 2 && <Step2 round={round} onBack={() => setStep(1)} onReview={(idx) => { setRound((r) => ({ ...r, currentIdx: idx })); setStep(3); }} onComplete={() => setStep(5)} patients={sortedPatients} />}
      {step === 3 && <Step3 round={round} setRound={setRound} onBack={() => setStep(2)} onNext={() => setStep(4)} patients={sortedPatients} role={role} />}
      {step === 4 && <Step4 round={round} setRound={setRound} onBack={() => setStep(3)} onNextPatient={() => setStep(2)} patients={sortedPatients} />}
      {step === 5 && <Step5 round={round} onBack={() => setStep(2)} onComplete={finishRound} patients={sortedPatients} />}
    </div>
  );
}

function Step0({ round, setRound, onNext }: { round: RoundDraft; setRound: RoundStateSetter; onNext: () => void }) {
  const currentUser = useAppSelector((state) => state.auth.user);
  const { data: users = [], isLoading: isLoadingUsers } = useGetUsersQuery();
  const { data: teams = [] } = useGetTeamsQuery();

  const team = teams.find((t) => t.consultantId === currentUser?.id) ||
    teams.find((t) => t.departmentId === currentUser?.departmentId) ||
    teams[0];

  // Prefer doctors in the same department; fall back to all clinical doctors
  const deptId = team?.departmentId || currentUser?.departmentId;
  const doctors = users.filter((u) => ["CONSULTANT", "REGISTRAR"].includes(u.role) && u.active !== false);
  const deptDoctors = deptId ? doctors.filter((u) => u.departmentId === deptId) : [];
  const leadOptions = deptDoctors.length ? deptDoctors : doctors;

  const clinicalUsers = users.filter((u) => ["CONSULTANT", "REGISTRAR", "JUNIOR_DOCTOR", "NURSE"].includes(u.role) && u.active !== false);
  const teamUsers = deptId ? clinicalUsers.filter((u) => u.departmentId === deptId) : clinicalUsers;
  const memberOptions = teamUsers.length ? teamUsers : clinicalUsers;

  return (
    <div className="panel rounded p-4 space-y-5 max-w-3xl sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">Round setup</h2>
        <p className="text-sm ink-mute mt-1">Configure who is on the round and what type it is.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Round type" required>
          <select className="select" value={round.type} onChange={(e) => setRound({ ...round, type: e.target.value as RoundType })}>
            <option>MORNING</option><option>POST_TAKE</option><option>BOARD</option><option>EVENING</option><option>WEEKEND</option>
          </select>
        </Field>
        <Field label="Lead doctor" required>
          <select className="select" value={round.leadId} onChange={(e) => setRound({ ...round, leadId: e.target.value })}>
            <option value="">— Select —</option>
            {isLoadingUsers ? (
              <option disabled>Loading doctors…</option>
            ) : leadOptions.length === 0 ? (
              <option disabled>No doctors available</option>
            ) : leadOptions.map((u) => (
              <option key={u.id} value={u.id}>{userFullName(u)}</option>
            ))}
          </select>
        </Field>
      </div>
      <div>
        <div className="field-label mb-2">Team members on this round</div>
        {isLoadingUsers ? (
          <div className="text-sm ink-mute">Loading team members…</div>
        ) : memberOptions.length === 0 ? (
          <div className="text-sm ink-mute">No team members available.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {memberOptions.map((u) => (
              <label key={u.id} className="flex items-center gap-2 p-2 border hairline rounded text-sm cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={round.participants.includes(u.id)}
                  onChange={(e) => {
                    const next = e.target.checked ? [...round.participants, u.id] : round.participants.filter((x) => x !== u.id);
                    setRound({ ...round, participants: next });
                  }}
                />
                <span className="flex-1">{userFullName(u)}</span>
                <RoleBadge role={u.role} />
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end"><button className="btn btn-primary w-full sm:w-auto" onClick={onNext} disabled={!round.leadId}>Continue →</button></div>
    </div>
  );
}

function Step1({ round, onBack, onNext, patients }: { round: RoundDraft; onBack: () => void; onNext: () => void; patients: Patient[] }) {
  const { data: users = [] } = useGetUsersQuery();
  const queue = round.queue
    .map((id) => patients.find((p) => p.id === id))
    .filter((p): p is Patient => Boolean(p));
  const leadDoctor = users.find((u) => u.id === round.leadId);
  const participantUsers = round.participants.map((id) => users.find((u) => u.id === id)).filter(Boolean);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="panel rounded lg:col-span-2">
        <div className="px-4 py-3 border-b hairline">
          <div className="font-semibold">Patient queue (auto-ordered)</div>
          <div className="text-xs ink-mute">By acuity DESC then NEWS DESC</div>
        </div>
        <div>
          {queue.length === 0 ? (
            <div className="p-6 text-center text-sm ink-mute">No patients in queue.</div>
          ) : queue.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 border-b hairline">
              <div className="w-6 mono text-xs ink-mute text-center">{i + 1}</div>
              <div className="w-16 mono text-xs">{p.bedNumber || "—"}</div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{patientFullName(p)}</div>
                <div className="text-xs ink-mute">{p.primaryDiagnosis || ""}</div>
              </div>
              <NEWSBadge score={p.newsScore} size="sm" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="panel rounded p-4">
          <div className="field-label mb-2">Round details</div>
          <div className="text-sm space-y-2">
            <div><span className="ink-mute">Type:</span> <span className="font-medium">{round.type}</span></div>
            <div><span className="ink-mute">Lead doctor:</span> <span className="font-medium">{leadDoctor ? userFullName(leadDoctor) : "—"}</span></div>
            <div><span className="ink-mute">Patients:</span> <span className="font-medium">{round.queue.length}</span></div>
          </div>
          {participantUsers.length > 0 && (
            <div className="mt-3 pt-3 border-t hairline">
              <div className="field-label mb-1.5">Team members on round</div>
              <div className="space-y-1">
                {participantUsers.map((u) => u && (
                  <div key={u.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>{userFullName(u)}</span>
                    <RoleBadge role={u.role} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button className="btn btn-primary justify-center py-2.5" onClick={onNext}>Begin round</button>
          <button className="btn justify-center" onClick={onBack}>← Back to setup</button>
        </div>
      </div>
    </div>
  );
}

function Step2({ round, onBack, onReview, onComplete, patients }: { round: RoundDraft; onBack: () => void; onReview: (idx: number) => void; onComplete: () => void; patients: Patient[] }) {
  const queue = round.queue
    .map((id) => patients.find((p) => p.id === id))
    .filter((p): p is Patient => Boolean(p));
  const reviewedCount = Object.keys(round.reviewed).length;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="panel rounded lg:col-span-2">
        <div className="px-4 py-3 border-b hairline flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold">Patient queue</div>
            <div className="text-xs ink-mute">Tap a patient to review</div>
          </div>
          <span className="chip" style={{ background: "#dbeafe", color: "#1e40af" }}>ROUND IN PROGRESS</span>
        </div>
        <div>
          {queue.map((p, i) => (
            <PatientRow
              key={p.id}
              patient={p}
              reviewed={Boolean(round.reviewed[p.id])}
              current={!round.reviewed[p.id] && i === reviewedCount}
              onClick={() => onReview(i)}
            />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="panel rounded p-4">
          <div className="text-xs ink-mute mb-1">Progress</div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-semibold">{reviewedCount}</span>
            <span className="text-base ink-mute">/ {round.queue.length}</span>
          </div>
          <div className="mt-2 h-2 rounded bg-slate-100 overflow-hidden">
            <div className="h-full bg-emerald-600" style={{ width: `${(reviewedCount / Math.max(1, round.queue.length)) * 100}%` }} />
          </div>
          <div className="text-xs ink-mute mt-1">patients reviewed</div>
        </div>
        <button className="btn btn-primary w-full justify-center py-2.5" onClick={onComplete} disabled={reviewedCount === 0}>Complete round →</button>
        <button className="btn w-full justify-center" onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}

function Step3({ round, setRound, onBack, onNext, patients, role }: { round: RoundDraft; setRound: RoundStateSetter; onBack: () => void; onNext: () => void; patients: Patient[]; role: Role }) {
  const toast = useToast();
  const [reviewPatient, { isLoading: isSavingReview }] = useReviewPatientMutation();
  const [markDischargeReady, { isLoading: isMarkingDischarge }] = useMarkDischargeReadyMutation();
  const p = patients.find((x) => x.id === round.queue[round.currentIdx]);
  const { data: latestVitals } = useGetLatestVitalsQuery(p?.id || "", { skip: !p?.id });
  const [form, setForm] = useState<RoundReview>({
    clinicalStatus: "STABLE",
    wasExamined: true,
    managementPlan: "",
    dischargeAssessment: "NONE",
    notifiedNextOfKin: false
  });
  const isCons = role === "CONSULTANT";

  useEffect(() => {
    if (!p) return;
    setForm({
      clinicalStatus: "STABLE",
      wasExamined: true,
      managementPlan: "",
      dischargeAssessment: "NONE",
      notifiedNextOfKin: false
    });
  }, [p?.id]);

  if (!p) return null;

  async function save() {
    if (!round.roundId) {
      toast({ kind: "error", title: "No active round" });
      return;
    }
    try {
      await reviewPatient({
        roundId: round.roundId,
        patientId: p!.id,
        clinicalStatus: form.clinicalStatus,
        wasExamined: form.wasExamined,
        managementPlan: form.managementPlan || undefined,
        dischargeAssessment: form.dischargeAssessment,
        notifiedNextOfKin: form.notifiedNextOfKin
      }).unwrap();

      if (form.dischargeAssessment === "CONFIRMED" && isCons) {
        await markDischargeReady({ patientId: p!.id }).unwrap();
      }

      setRound((r) => ({ ...r, reviewed: { ...r.reviewed, [p!.id]: form } }));
      onNext();
    } catch {
      toast({ kind: "error", title: "Could not save review" });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="panel rounded p-4 space-y-4 sm:p-5 lg:col-span-2">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{patientFullName(p)}</h2>
            </div>
            <div className="text-sm ink-mute">{p.hospitalNumber} · Bed {p.bedNumber || "—"} · {p.primaryDiagnosis || ""}</div>
          </div>
          <NEWSBadge score={p.newsScore} />
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 divide-x hairline border hairline rounded">
          <Vital label="RR" v={latestVitals?.respiratoryRate} unit="/min" />
          <Vital label="SpO2" v={latestVitals?.oxygenSaturation} unit="%" />
          <Vital label="Temp" v={latestVitals?.temperature} unit="C" />
          <Vital label="Sys" v={latestVitals?.systolicBP} unit="mmHg" />
          <Vital label="HR" v={latestVitals?.heartRate} unit="bpm" />
          <Vital label="LOC" v={latestVitals?.consciousnessLevel} unit="" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <Field label="Clinical status" required>
            <select className="select" value={form.clinicalStatus} onChange={(e) => setForm({ ...form, clinicalStatus: e.target.value as ClinicalStatus })}>
              <option value="IMPROVING">IMPROVING</option>
              <option value="STABLE">STABLE</option>
              <option value="DETERIORATING">DETERIORATING</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Patient examined?">
              <div className="flex gap-2">
                <button onClick={() => setForm({ ...form, wasExamined: true })} className={`btn ${form.wasExamined ? "btn-primary" : ""}`}>Yes</button>
                <button onClick={() => setForm({ ...form, wasExamined: false })} className={`btn ${!form.wasExamined ? "btn-primary" : ""}`}>No (proxy review)</button>
              </div>
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Management plan" required>
              <textarea
                className="textarea"
                rows={5}
                value={form.managementPlan}
                onChange={(e) => setForm({ ...form, managementPlan: e.target.value })}
                placeholder="Examination findings, decisions, plan"
              />
            </Field>
          </div>
          <Field label="Discharge assessment">
            <select className="select" value={form.dischargeAssessment} onChange={(e) => setForm({ ...form, dischargeAssessment: e.target.value as DischargeAssessment })}>
              <option value="NONE">NONE</option>
              <option value="POSSIBLE">POSSIBLE — within 48h</option>
              <option value="CONFIRMED" disabled={!isCons}>CONFIRMED — discharge today{isCons ? "" : " (consultant only)"}</option>
              <option value="BLOCKED_SOCIAL">BLOCKED — social</option>
              <option value="BLOCKED_MEDICAL">BLOCKED — medical</option>
            </select>
          </Field>
          <Field label="Next-of-kin notified?">
            <div className="flex items-center gap-3 pt-1.5">
              <button
                type="button"
                className={`relative w-10 h-5 rounded-full ${form.notifiedNextOfKin ? "bg-emerald-600" : "bg-slate-300"}`}
                onClick={() => setForm({ ...form, notifiedNextOfKin: !form.notifiedNextOfKin })}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${form.notifiedNextOfKin ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
          </Field>
        </div>

        <div className="flex flex-col gap-2 pt-3 border-t hairline sm:flex-row sm:items-center sm:justify-between">
          <button className="btn" onClick={onBack}>← Back to queue</button>
          <button
            className="btn btn-primary"
            onClick={save}
            disabled={isSavingReview || isMarkingDischarge || !form.managementPlan}
          >
            {isSavingReview ? "Saving…" : "Save review and add tasks →"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="panel rounded">
          <div className="px-4 py-3 border-b hairline font-semibold text-sm">Latest NEWS</div>
          <div className="p-4 text-center">
            <div className="text-5xl font-bold mono">{latestVitals?.newsScore ?? p.newsScore}</div>
            <div className="text-xs ink-mute mt-1">{latestVitals?.recordedAt?.slice(0, 16).replace("T", " ") || "no readings"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step4({ round, setRound, onBack, onNextPatient, patients }: { round: RoundDraft; setRound: RoundStateSetter; onBack: () => void; onNextPatient: () => void; patients: Patient[] }) {
  const toast = useToast();
  const [createCareTask, { isLoading: isCreating }] = useCreateCareTaskMutation();
  const p = patients.find((x) => x.id === round.queue[round.currentIdx]);
  const [tasks, setTasks] = useState<RoundTaskDraft[]>([]);
  const [draft, setDraft] = useState<Omit<RoundTaskDraft, "id">>({ title: "", priority: "ROUTINE", assigneeRole: "NURSE", windowStart: "10:00", windowEnd: "14:00" });

  useEffect(() => {
    if (!p) return;
    setTasks(round.tasks[p.id] || []);
  }, [p?.id, round.tasks]);

  if (!p) return null;

  async function add() {
    if (!draft.title || !round.roundId) return;
    if (todayAtTime(draft.windowEnd).getTime() <= todayAtTime(draft.windowStart).getTime()) {
      toast({ kind: "error", title: "Task window end must be after start" });
      return;
    }
    try {
      await createCareTask({
        patientId: p!.id,
        taskType: "POST_ROUND_JOB",
        source: "POST_ROUND_JOB",
        title: draft.title,
        priority: draft.priority,
        roundId: round.roundId,
        windowStart: todayAtTimeIso(draft.windowStart),
        windowEnd: todayAtTimeIso(draft.windowEnd)
      }).unwrap();
      const next = [...tasks, { ...draft, id: "t_" + Math.random().toString(36).slice(2, 7) }];
      setTasks(next);
      setRound((r) => ({ ...r, tasks: { ...r.tasks, [p!.id]: next } }));
      setDraft({ title: "", priority: "ROUTINE", assigneeRole: "NURSE", windowStart: "10:00", windowEnd: "14:00" });
      toast({ kind: "success", title: "Task added" });
    } catch {
      toast({ kind: "error", title: "Could not create task" });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="panel rounded p-4 space-y-4 sm:p-5 lg:col-span-2">
        <div>
          <h2 className="text-lg font-semibold">Post-round tasks for {patientFullName(p)}</h2>
          <p className="text-sm ink-mute">Source POST_ROUND_JOB.</p>
        </div>

        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="border hairline rounded p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <PriorityChip priority={t.priority} />
              <div className="flex-1">
                <div className="text-sm font-semibold">{t.title}</div>
                <div className="text-xs ink-mute">→ {t.assigneeRole} · {t.windowStart}–{t.windowEnd}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="border hairline rounded p-3 bg-slate-50">
          <div className="field-label mb-2">+ Add task</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2"><input className="input" placeholder="Task title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
            <select className="select" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as TaskPriority })}>
              <option>ROUTINE</option><option>URGENT</option><option>EMERGENCY</option>
            </select>
            <select className="select" value={draft.assigneeRole} onChange={(e) => setDraft({ ...draft, assigneeRole: e.target.value as AssignedToRole })}>
              <option>NURSE</option><option>JUNIOR_DOCTOR</option><option>REGISTRAR</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input className="input mono" type="time" value={draft.windowStart} onChange={(e) => setDraft({ ...draft, windowStart: e.target.value })} />
              <input className="input mono" type="time" value={draft.windowEnd} onChange={(e) => setDraft({ ...draft, windowEnd: e.target.value })} />
            </div>
            <button className="btn btn-primary justify-center" onClick={add} disabled={isCreating || !draft.title}>{isCreating ? "Adding…" : "Add task"}</button>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-3 border-t hairline sm:flex-row sm:justify-between">
          <button className="btn" onClick={onBack}>← Back to review</button>
          <button className="btn btn-primary" onClick={onNextPatient}>Next patient →</button>
        </div>
      </div>

      <div className="panel rounded p-4">
        <div className="font-semibold text-sm mb-3">Round progress</div>
        <div className="space-y-1.5">
          {round.queue.map((id, i) => {
            const pp = patients.find((x) => x.id === id);
            const reviewed = round.reviewed[id];
            return (
              <div key={id} className={`flex items-center gap-2 text-sm py-1 ${i === round.currentIdx ? "font-semibold" : ""}`}>
                {reviewed ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center">
                    <Icons.check size={10} className="text-white" stroke={3} />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                )}
                <span className="mono text-xs ink-mute w-12">{pp?.bedNumber || "—"}</span>
                <span className="truncate flex-1">{pp?.lastName}</span>
                <NEWSBadge score={pp?.newsScore || 0} size="sm" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Step5({ round, onBack, onComplete, patients }: { round: RoundDraft; onBack: () => void; onComplete: () => void; patients: Patient[] }) {
  const reviewed = Object.keys(round.reviewed);
  const unreviewed = round.queue.filter((id) => !round.reviewed[id]);
  const totalTasks = Object.values(round.tasks).reduce((a, b) => a + b.length, 0);
  return (
    <div className="panel rounded p-4 max-w-3xl space-y-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">Complete round — review summary</h2>
        <p className="text-sm ink-mute mt-1">Final check before publishing the round.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="border hairline rounded p-3"><div className="field-label">Patients reviewed</div><div className="text-2xl font-semibold mt-1 text-emerald-700">{reviewed.length}</div></div>
        <div className="border hairline rounded p-3"><div className="field-label">Unreviewed</div><div className="text-2xl font-semibold mt-1" style={{ color: unreviewed.length > 0 ? "#b45309" : "#475569" }}>{unreviewed.length}</div></div>
        <div className="border hairline rounded p-3"><div className="field-label">Tasks created</div><div className="text-2xl font-semibold mt-1">{totalTasks}</div></div>
      </div>
      {unreviewed.length > 0 && (
        <div className="rounded p-3 bg-amber-50 border border-amber-200 text-sm">
          <div className="font-semibold text-amber-900 mb-1">{unreviewed.length} patient(s) unreviewed</div>
          <ul className="text-amber-900 space-y-0.5">
            {unreviewed.map((id) => {
              const p = patients.find((x) => x.id === id);
              return <li key={id}>— Bed {p?.bedNumber || "—"} — {p ? patientFullName(p) : id}</li>;
            })}
          </ul>
        </div>
      )}
      <div className="flex flex-col gap-2 pt-3 border-t hairline sm:flex-row sm:justify-between">
        <button className="btn" onClick={onBack}>← Back to queue</button>
        <button className="btn btn-primary px-6" onClick={onComplete}>Complete round</button>
      </div>
    </div>
  );
}

function Vital({ label, v, unit }: { label: string; v: number | string | undefined; unit: string }) {
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
