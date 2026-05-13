import { useState } from "react";
import { AcuityBadge, Icons, NEWSBadge, StatusChip } from "@/components/ui";
import { PageHeader } from "@/layouts/PageHeader";
import { useGetCareTasksByWardQuery, useGetPatientsByWardQuery, useGetCurrentShiftQuery, useGetUsersQuery } from "@/services/api";
import { getUser, patientFullName } from "@/utils/format";
import { useToast } from "@/components/ui/Toast";

export default function HandoverManagement() {
  const toast = useToast();
  const { data: patients = [] } = useGetPatientsByWardQuery("w1");
  const { data: currentShift } = useGetCurrentShiftQuery("w1");
  const { data: users = [] } = useGetUsersQuery();
  const { data: tasks = [] } = useGetCareTasksByWardQuery({ wardId: "w1" });
  const [step, setStep] = useState(0);
  const [handoverNotes, setHandoverNotes] = useState<Record<string, string>>({});
  const [urgent, setUrgent] = useState<Record<string, boolean>>({});

  const wardPatients = patients.filter((p) => p.wardId === "w1");

  if (!currentShift) return null;

  if (step === 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Initiate handover" subtitle="Soyinka Ward · End of morning shift" />
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
              <div className="font-semibold">Next Shift</div>
              <div className="text-sm text-amber-700 mt-2">No lead assigned. Assign now.</div>
            </div>
          </div>
          <div className="text-sm ink-2">{wardPatients.length} patients to hand over. Each needs a status summary; mark urgent flags as appropriate.</div>
          <button className="btn btn-primary" onClick={() => setStep(1)}>Begin handover →</button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    const filled = Object.keys(handoverNotes).filter((k) => handoverNotes[k]?.trim()).length;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Handover — patient notes</h1>
            <p className="text-sm ink-mute">Step 2 of 3 · {filled}/{wardPatients.length} patients with notes</p>
          </div>
          <div className="flex gap-2">
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
                <div className="col-span-2">
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
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t hairline">
          <button className="btn" onClick={() => setStep(1)}>← Back</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              toast({ kind: "success", title: "Handover signed off", body: "Incoming team notified" });
              setStep(0);
            }}
          >
            Sign off handover
          </button>
        </div>
      </div>
    </div>
  );
}
