import { useEffect, useState } from "react";
import { Field, NEWSBadge } from "@/components/ui";
import { PageHeader } from "@/layouts/PageHeader";
import { useCreateEscalationMutation, useGetLatestVitalsQuery, useCurrentWardPatients, useGetOnCallRotationsQuery, useGetUsersQuery } from "@/services/api";
import { patientFullName } from "@/utils/format";
import { useToast } from "@/components/ui/Toast";

export default function NurseCreateEscalation() {
  const toast = useToast();
  const { data: patients = [], isLoading: isLoadingPatients } = useCurrentWardPatients();
  const [createEscalation, { isLoading }] = useCreateEscalationMutation();
  const { data: onCallRotations = [] } = useGetOnCallRotationsQuery();
  const { data: allUsers = [] } = useGetUsersQuery();
  const [pid, setPid] = useState<string>("");
  useEffect(() => {
    if (!pid && patients.length) setPid(patients[0].id);
  }, [pid, patients]);
  const [severity, setSeverity] = useState<"AMBER" | "RED">("AMBER");
  const [notes, setNotes] = useState("");
  const patient = patients.find((p) => p.id === pid);

  const { data: latestVitals } = useGetLatestVitalsQuery(pid, { skip: !pid });

  function getOnCallRoutesTo(sev: "AMBER" | "RED"): string {
    const now = new Date().toISOString();
    const role = sev === "RED" ? "CONSULTANT_ON_CALL" : "REGISTRAR_ON_CALL";
    const title = sev === "RED" ? "On-call Consultant" : "On-call Registrar";
    const rotation = onCallRotations.find(
      (r) => r.role === role && r.startTime <= now && r.endTime >= now
    );
    if (!rotation) return title;
    const doctor = allUsers.find((u) => u.id === rotation.doctorId);
    return doctor ? `${title} - Dr. ${doctor.firstName} ${doctor.lastName}` : title;
  }

  if (isLoadingPatients) {
    return <div className="panel rounded p-6 text-center ink-mute sm:p-12">Loading patients…</div>;
  }
  if (!patient) {
    return <div className="panel rounded p-6 text-center ink-mute sm:p-12">No patients on this ward.</div>;
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Raise nurse concern" subtitle="Create an AMBER escalation routed to the on-call registrar" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel rounded p-4 space-y-4 sm:p-5 lg:col-span-2">
          <Field label="Patient" required>
            <select className="select" value={pid} onChange={(e) => setPid(e.target.value)}>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.bedNumber} · {patientFullName(p)} · {p.primaryDiagnosis}</option>
              ))}
            </select>
          </Field>
          <Field label="Concern" required hint="What have you observed that worries you?">
            <textarea
              className="textarea"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Severity"><select className="select" value={severity} onChange={(event) => setSeverity(event.target.value as "AMBER" | "RED")}><option>AMBER</option><option>RED</option></select></Field>
            <Field label="Routes to" hint="Determined by severity"><input className="input" disabled value={getOnCallRoutesTo(severity)} /></Field>
          </div>
          <div className="flex justify-end pt-2">
            <button
              className="btn btn-primary w-full sm:w-auto"
              disabled={isLoading || !notes.trim()}
              onClick={async () => {
                await createEscalation({
                  patientId: pid,
                  triggerType: "NURSE_CONCERN",
                  severity,
                  notes
                }).unwrap();
                toast({ kind: "warn", title: `${severity} escalation created`, body: "On-call clinician has been notified" });
              }}
            >
              {isLoading ? "Raising..." : "Raise escalation"}
            </button>
          </div>
        </div>
        <div className="panel rounded p-4">
          <div className="font-semibold text-sm mb-2">Patient context</div>
          <div className="text-sm">{patientFullName(patient)}</div>
          <div className="text-xs ink-mute mb-2">{patient.hospitalNumber} · {patient.gender} · Bed {patient.bedNumber}</div>
          <NEWSBadge score={patient.newsScore} />
          <div className="mt-3 pt-3 border-t hairline">
            <div className="field-label">Latest vitals</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs mt-1.5">
              <span className="ink-mute">RR</span><span className="mono">{latestVitals?.respiratoryRate}/min</span>
              <span className="ink-mute">SpO2</span><span className="mono">{latestVitals?.oxygenSaturation}%</span>
              <span className="ink-mute">Temp</span><span className="mono">{latestVitals?.temperature}C</span>
              <span className="ink-mute">BP</span><span className="mono">{latestVitals?.systolicBP}</span>
              <span className="ink-mute">HR</span><span className="mono">{latestVitals?.heartRate}bpm</span>
              <span className="ink-mute">LOC</span><span>{latestVitals?.consciousnessLevel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
