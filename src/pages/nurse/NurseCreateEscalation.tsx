import { useState } from "react";
import { Field, NEWSBadge } from "@/components/ui";
import { PageHeader } from "@/layouts/PageHeader";
import { useCreateEscalationMutation, useGetPatientsQuery } from "@/services/api";
import { patientFullName } from "@/utils/format";
import { useToast } from "@/components/ui/Toast";

export default function NurseCreateEscalation() {
  const toast = useToast();
  const { data: patients = [] } = useGetPatientsQuery();
  const [createEscalation, { isLoading }] = useCreateEscalationMutation();
  const [pid, setPid] = useState("p6");
  const [severity, setSeverity] = useState<"AMBER" | "RED">("AMBER");
  const [notes, setNotes] = useState("Persistent fever despite paracetamol. Patient appears more lethargic. Capillary refill 3 seconds. Mother reports decreased urine output overnight.");
  const patient = patients.find((p) => p.id === pid);

  if (!patient) return null;
  const lastVital = patient.vitals[patient.vitals.length - 1];

  return (
    <div className="space-y-4">
      <PageHeader title="Raise nurse concern" subtitle="Create an AMBER escalation routed to the on-call registrar" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 panel rounded p-5 space-y-4">
          <Field label="Patient" required>
            <select className="select" value={pid} onChange={(e) => setPid(e.target.value)}>
              {patients.filter((p) => p.wardId === "w1").map((p) => (
                <option key={p.id} value={p.id}>{p.bed} · {patientFullName(p)} · {p.primaryDiagnosis}</option>
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
            <Field label="Routes to" hint="Determined by severity"><input className="input" disabled value={severity === "RED" ? "On-call Consultant - Prof. Adaeze Okafor" : "On-call Registrar - Dr. Chinedu Eze"} /></Field>
          </div>
          <div className="flex justify-end pt-2">
            <button
              className="btn btn-primary"
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
          <div className="text-xs ink-mute mb-2">{patient.mrn} · {patient.age}{patient.sex} · Bed {patient.bed}</div>
          <NEWSBadge score={patient.news} />
          <div className="mt-3 pt-3 border-t hairline">
            <div className="field-label">Latest vitals</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs mt-1.5">
              <span className="ink-mute">RR</span><span className="mono">{lastVital?.resp}/min</span>
              <span className="ink-mute">SpO2</span><span className="mono">{lastVital?.spo2}%</span>
              <span className="ink-mute">Temp</span><span className="mono">{lastVital?.temp}C</span>
              <span className="ink-mute">BP</span><span className="mono">{lastVital?.sys}</span>
              <span className="ink-mute">HR</span><span className="mono">{lastVital?.hr}bpm</span>
              <span className="ink-mute">LOC</span><span>{lastVital?.cons}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
