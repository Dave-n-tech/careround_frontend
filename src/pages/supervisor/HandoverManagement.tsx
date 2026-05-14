import { useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { AcuityBadge, Icons, NEWSBadge, StatusChip } from "@/components/ui";
import { PageHeader } from "@/layouts/PageHeader";
import {
  useAddPatientHandoverNoteMutation,
  useCompleteHandoverMutation,
  useGetCareTasksByWardQuery,
  useGetCurrentShiftQuery,
  useGetHandoversByWardQuery,
  useGetPatientsByWardQuery,
  useGetShiftsQuery,
  useGetUsersQuery,
  useGetWardsQuery,
  useInitiateHandoverMutation
} from "@/services/api";
import { useCurrentWardId } from "@/features/ward/currentWard";
import { getUser, patientFullName } from "@/utils/format";
import { useToast } from "@/components/ui/Toast";

export default function HandoverManagement() {
  const toast = useToast();
  const wardId = useCurrentWardId();
  const now = new Date();
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  const to = new Date(now);
  to.setDate(to.getDate() + 2);
  to.setHours(23, 59, 59, 999);
  const { data: wards = [] } = useGetWardsQuery();
  const { data: patients = [] } = useGetPatientsByWardQuery(wardId ?? skipToken);
  const { data: currentShift } = useGetCurrentShiftQuery(wardId ?? skipToken);
  const { data: shifts = [] } = useGetShiftsQuery(
    wardId ? { wardId, from: from.toISOString(), to: to.toISOString() } : skipToken
  );
  const { data: users = [] } = useGetUsersQuery();
  const { data: tasks = [] } = useGetCareTasksByWardQuery(wardId ? { wardId } : skipToken);
  const { data: handovers = [] } = useGetHandoversByWardQuery(wardId ?? skipToken);
  const [initiateHandover, { isLoading: isInitiating }] = useInitiateHandoverMutation();
  const [addHandoverNote, { isLoading: isSavingNote }] = useAddPatientHandoverNoteMutation();
  const [completeHandover, { isLoading: isCompleting }] = useCompleteHandoverMutation();
  const [step, setStep] = useState(0);
  const [draftHandoverId, setDraftHandoverId] = useState<string | null>(null);
  const [handoverNotes, setHandoverNotes] = useState<Record<string, string>>({});
  const [urgent, setUrgent] = useState<Record<string, boolean>>({});

  const wardPatients = wardId ? patients.filter((p) => p.wardId === wardId) : [];
  const activeHandover =
    handovers.find((h) => h.status === "IN_PROGRESS" || h.status === "PENDING") ||
    handovers.find((h) => !h.completedAt);
  const draftHandover = draftHandoverId ? handovers.find((h) => h.id === draftHandoverId) : undefined;
  const effectiveHandover = activeHandover || draftHandover;
  const incomingShift = shifts
    .filter((shift) => shift.id !== currentShift?.id && shift.startTime > (currentShift?.startTime || ""))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  if (!wardId) return <div className="panel rounded p-6 text-center ink-mute sm:p-12">No ward assigned.</div>;
  if (!currentShift) return <div className="panel rounded p-6 text-center ink-mute sm:p-12">No active shift for this ward.</div>;

  const currentWard = wards.find((w) => w.id === wardId);

  async function beginHandover() {
    if (!wardId || !currentShift) return;
    if (effectiveHandover) {
      setStep(1);
      return;
    }
    if (!incomingShift) {
      toast({ kind: "error", title: "No incoming shift found", body: "Create or assign the next shift before initiating handover." });
      return;
    }
    try {
      const created = await initiateHandover({
        wardId,
        outgoingShiftId: currentShift.id,
        incomingShiftId: incomingShift.id
      }).unwrap();
      setDraftHandoverId(created.id);
      setStep(1);
      toast({ kind: "success", title: "Handover initiated" });
    } catch {
      toast({ kind: "error", title: "Could not initiate handover" });
    }
  }

  async function saveHandover() {
    if (!effectiveHandover) {
      toast({ kind: "error", title: "No active handover", body: "Initiate the handover before signing off notes." });
      return;
    }
    const entries = wardPatients.filter((p) => handoverNotes[p.id]?.trim());
    try {
      for (const patient of entries) {
        const outstandingTaskIds = tasks
          .filter((t) => t.patientId === patient.id && t.status !== "COMPLETED")
          .map((t) => t.id)
          .join(",");
        await addHandoverNote({
          handoverId: effectiveHandover.id,
          patientId: patient.id,
          statusSummary: handoverNotes[patient.id],
          outstandingTaskIds: outstandingTaskIds || undefined,
          urgencyFlag: Boolean(urgent[patient.id])
        }).unwrap();
      }
      await completeHandover({
        handoverId: effectiveHandover.id,
        generalNotes: `${entries.length} patient handover notes completed.`
      }).unwrap();
      toast({ kind: "success", title: "Handover signed off", body: "Incoming team notified" });
      setHandoverNotes({});
      setUrgent({});
      setStep(0);
    } catch {
      toast({ kind: "error", title: "Could not save handover" });
    }
  }

  if (step === 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Initiate handover" subtitle={`${currentWard?.name ?? "Ward"} · ${currentShift.type.toLowerCase()} shift`} />
        <div className="panel rounded p-5 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border hairline rounded p-4">
              <div className="field-label mb-2">Outgoing shift</div>
              <div className="font-semibold">{currentShift.type} Shift</div>
              <div className="text-sm mt-2 space-y-1">
                <div><span className="ink-mute">Lead:</span> {getUser(users, currentShift.leadDoctorId || "")?.firstName}</div>
                <div><span className="ink-mute">Nurse i/c:</span> {getUser(users, currentShift.nurseInChargeId || "")?.firstName}</div>
              </div>
            </div>
            <div className="border hairline rounded p-4">
              <div className="field-label mb-2">Incoming shift</div>
              <div className="font-semibold">{incomingShift ? `${incomingShift.type} Shift` : "No next shift found"}</div>
              <div className="text-sm mt-2 space-y-1">
                <div><span className="ink-mute">Lead:</span> {incomingShift?.leadDoctorId ? getUser(users, incomingShift.leadDoctorId)?.firstName : "Unassigned"}</div>
                <div><span className="ink-mute">Nurse i/c:</span> {incomingShift?.nurseInChargeId ? getUser(users, incomingShift.nurseInChargeId)?.firstName : "Unassigned"}</div>
              </div>
            </div>
          </div>
          <div className="text-sm ink-2">{wardPatients.length} patient{wardPatients.length === 1 ? "" : "s"} to hand over. Each needs a status summary; mark urgent flags as appropriate.</div>
          {wardPatients.length === 0 && (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              No patients in this ward. Handover can only be initiated when there are admitted patients.
            </div>
          )}
          {!effectiveHandover && !incomingShift && (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              No incoming shift was returned for this ward. Create or assign the next shift first.
            </div>
          )}
          {!currentShift?.leadDoctorId && (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              The outgoing shift has no lead doctor assigned. Assign a lead doctor in Shift Assignment before handover.
            </div>
          )}
          <button
            className="btn btn-primary"
            onClick={beginHandover}
            disabled={isInitiating || wardPatients.length === 0 || (!effectiveHandover && !incomingShift)}
          >
            {isInitiating ? "Starting..." : "Begin handover →"}
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    const filled = Object.keys(handoverNotes).filter((k) => handoverNotes[k]?.trim()).length;
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Handover — patient notes</h1>
            <p className="text-sm ink-mute">Step 2 of 3 · {filled}/{wardPatients.length} patients with notes</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="btn" onClick={() => setStep(0)}>← Back</button>
            <button className="btn btn-primary" onClick={() => setStep(2)} disabled={filled < wardPatients.length}>Continue to sign-off →</button>
          </div>
        </div>
        <div className="space-y-3">
          {wardPatients.map((p) => (
            <div key={p.id} className="panel rounded">
              <div className="px-4 py-3 border-b hairline flex items-center gap-3">
                <span className="mono text-xs">{p.bedNumber}</span>
                <span className="font-semibold">{patientFullName(p)}</span>
                <AcuityBadge level={p.acuityLevel} />
                <NEWSBadge score={p.newsScore} size="sm" />
                <StatusChip status={p.status} />
                <label className="ml-auto flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!urgent[p.id]}
                    onChange={(e) => setUrgent({ ...urgent, [p.id]: e.target.checked })}
                  />
                  <span className={urgent[p.id] ? "text-red-700 font-semibold" : ""}>Urgent flag</span>
                </label>
              </div>
              <div className="p-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2">
                  <textarea
                    className="textarea"
                    rows={2}
                    placeholder="Status summary, key events this shift, jobs pending"
                    value={handoverNotes[p.id] || ""}
                    onChange={(e) => setHandoverNotes({ ...handoverNotes, [p.id]: e.target.value })}
                  />
                </div>
                <div className="text-xs ink-2 space-y-1">
                  <div className="field-label">Outstanding tasks</div>
                  {tasks.filter((t) => t.patientId === p.id && t.status !== "COMPLETED").map((t) => (
                    <div key={t.id}>• {t.title} <span className="ink-mute">({t.windowStart?.slice(11,16)}-{t.windowEnd?.slice(11,16)})</span></div>
                  ))}
                  {tasks.filter((t) => t.patientId === p.id && t.status !== "COMPLETED").length === 0 && <span className="ink-mute">None</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const urgentCount = Object.values(urgent).filter(Boolean).length;
  return (
    <div className="space-y-4">
      <PageHeader title="Sign off handover" subtitle="Step 3 of 3" />
      <div className="panel rounded p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div>
            <div className="field-label">Patients handed over</div>
            <div className="text-2xl font-semibold mt-1">{wardPatients.length}</div>
          </div>
          <div>
            <div className="field-label">Urgent flags</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: urgentCount > 0 ? "#b91c1c" : "#15803d" }}>{urgentCount}</div>
          </div>
          <div>
            <div className="field-label">Open tasks transferred</div>
            <div className="text-2xl font-semibold mt-1">{tasks.filter((t) => t.status !== "COMPLETED").length}</div>
          </div>
        </div>
        <div className="space-y-2 border-t hairline pt-4">
          <h3 className="font-semibold text-sm mb-2">Sign-off checklist</h3>
          {[
            "All patients have a documented handover note",
            "Outstanding tasks have been transferred to the incoming team",
            "Urgent flags have been verbally communicated",
            "Incoming nurse in charge has confirmed receipt"
          ].map((it, i) => (
            <label key={i} className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked />{it}</label>
          ))}
        </div>
        <div className="flex flex-col-reverse gap-2 mt-4 pt-4 border-t hairline sm:flex-row sm:justify-end">
          <button className="btn" onClick={() => setStep(1)}>← Back</button>
          <button
            className="btn btn-primary"
            onClick={saveHandover}
            disabled={isSavingNote || isCompleting}
          >
            {isSavingNote || isCompleting ? "Saving..." : "Sign off handover"}
          </button>
        </div>
      </div>
    </div>
  );
}
