import { useEffect, useMemo, useState } from "react";
import { Field, Icons, NEWSBadge } from "@/components/ui";
import { NEWSSparkline } from "@/components/ui/charts";
import { PageHeader } from "@/layouts/PageHeader";
import { useCreateEscalationMutation, useRecordVitalsMutation, useGetVitalsHistoryQuery, useCurrentWardPatients } from "@/services/api";
import { computeNEWS } from "@/utils/news";
import { patientFullName } from "@/utils/format";
import { useToast } from "@/components/ui/Toast";
import { useLiveClock } from "@/hooks/useLiveClock";

export default function NurseVitalsForm() {
  const toast = useToast();
  const clock = useLiveClock();
  const { data: patients = [], isLoading: isLoadingPatients } = useCurrentWardPatients();
  const [recordVitals, { isLoading: isRecording }] = useRecordVitalsMutation();
  const [createEscalation] = useCreateEscalationMutation();
  const [patientId, setPatientId] = useState<string>("");
  useEffect(() => {
    if (!patientId && patients.length) setPatientId(patients[0].id);
  }, [patientId, patients]);
  const patient = patients.find((p) => p.id === patientId);
  const { data: vitalsHistory = [] } = useGetVitalsHistoryQuery({ patientId }, { skip: !patientId });
  const [v, setV] = useState({ resp: "", spo2: "", temp: "", sys: "", hr: "", cons: "ALERT" });
  const [vitalsNote, setVitalsNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [escalation, setEscalation] = useState<null | { severity: "RED" | "AMBER"; score: number; role: string; name: string }>(null);

  const news = computeNEWS(v);
  const total = news.total;
  const allFilled = ["resp", "spo2", "temp", "sys", "hr"].every((k) => (v as any)[k] !== "");

  async function submit() {
    if (!allFilled) {
      toast({ kind: "error", title: "Complete all fields" });
      return;
    }
    setSubmitted(true);
    await recordVitals({
      patientId,
      respiratoryRate: Number(v.resp),
      oxygenSaturation: Number(v.spo2),
      temperature: Number(v.temp),
      systolicBP: Number(v.sys),
      heartRate: Number(v.hr),
      consciousnessLevel: v.cons,
      note: vitalsNote.trim() || undefined
    }).unwrap();
    if (total >= 7) {
      await createEscalation({
        patientId,
        triggerType: "HIGH_NEWS_SCORE",
        severity: "RED",
        notes: `NEWS ${total} recorded from vitals screen`
      }).unwrap();
      setEscalation({ severity: "RED", score: total, role: "CONSULTANT", name: "Prof. Adaeze Okafor" });
    } else if (total >= 5) {
      await createEscalation({
        patientId,
        triggerType: "HIGH_NEWS_SCORE",
        severity: "AMBER",
        notes: `NEWS ${total} recorded from vitals screen`
      }).unwrap();
      setEscalation({ severity: "AMBER", score: total, role: "REGISTRAR", name: "Dr. Chinedu Eze" });
    } else {
      toast({ kind: "success", title: "Vitals recorded", body: `NEWS ${total} · within range` });
      setTimeout(() => {
        setV({ resp: "", spo2: "", temp: "", sys: "", hr: "", cons: "ALERT" });
        setVitalsNote("");
        setSubmitted(false);
      }, 600);
    }
  }

  function reset() {
    setEscalation(null);
    setSubmitted(false);
    setV({ resp: "", spo2: "", temp: "", sys: "", hr: "", cons: "ALERT" });
    setVitalsNote("");
  }

  const preview = useMemo(() => {
    const isRed = total >= 7;
    const isAmber = total >= 5 && total < 7;
    return {
      bg: isRed ? "#fef2f2" : isAmber ? "#fffbeb" : "#f0fdf4",
      fg: isRed ? "#991b1b" : isAmber ? "#854d0e" : "#166534",
      label: isRed ? "RED" : isAmber ? "AMBER" : "NORMAL"
    };
  }, [total]);

  if (isLoadingPatients) {
    return <div className="panel rounded p-6 text-center ink-mute sm:p-12">Loading ward patients…</div>;
  }
  if (!patient) {
    return <div className="panel rounded p-6 text-center ink-mute sm:p-12">No patients on this ward.</div>;
  }
  const lastVital = vitalsHistory[vitalsHistory.length - 1];

  const presets = [
    { id: "resp", label: "Respiratory rate", unit: "/min", min: 4, max: 60, step: 1 },
    { id: "spo2", label: "SpO2 (oxygen sat)", unit: "%", min: 50, max: 100, step: 1 },
    { id: "temp", label: "Temperature", unit: "C", min: 25, max: 45, step: 0.1 },
    { id: "sys", label: "Systolic BP", unit: "mmHg", min: 40, max: 260, step: 1 },
    { id: "hr", label: "Heart rate", unit: "bpm", min: 20, max: 240, step: 1 }
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Record vitals" subtitle="NEWS2 score is computed live as you type. Backend re-validates on submit." />

      <div className="panel rounded p-4">
        <div className="field-label mb-2">Select patient</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {patients.filter((p) => p.status !== "DISCHARGED").slice(0, 6).map((pp) => (
            <button
              key={pp.id}
              onClick={() => setPatientId(pp.id)}
              className={`text-left p-3 rounded border ${patientId === pp.id ? "border-[var(--cr-brand)] bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
            >
              <div className="flex items-center justify-between">
                <span className="mono text-xs ink-mute">{pp.bedNumber}</span>
                <NEWSBadge score={pp.newsScore} size="sm" />
              </div>
              <div className="font-semibold text-sm mt-1">{patientFullName(pp)}</div>
              <div className="text-xs ink-mute truncate">{pp.primaryDiagnosis}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel rounded p-4 space-y-4 sm:p-5 lg:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold">{patientFullName(patient)}</div>
              <div className="text-xs ink-mute">
                {patient.hospitalNumber} · Bed {patient.bedNumber} · last NEWS {patient.newsScore} at {lastVital?.recordedAt?.slice(11, 16) || "-"}
              </div>
            </div>
            <div className="text-xs ink-mute">Now: {clock.dateLabel} · {clock.timeValue}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {presets.map((f) => (
              <Field key={f.id} label={f.label} required>
                <div className="relative">
                  <input
                    className="input mono text-2xl py-3 text-right pr-16"
                    type="number"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={(v as any)[f.id]}
                    onChange={(e) => setV({ ...v, [f.id]: e.target.value })}
                    placeholder="-"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 ink-mute text-sm">{f.unit}</span>
                </div>
              </Field>
            ))}
            <Field label="Level of consciousness" required>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                {["ALERT", "VOICE", "PAIN", "UNRESPONSIVE"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setV({ ...v, cons: c })}
                    className={`px-2 py-2.5 rounded text-xs font-semibold ${v.cons === c ? "bg-[var(--cr-brand)] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <Field label="Clinical note">
            <textarea
              className="textarea"
              rows={3}
              placeholder="Optional context saved with this vitals record"
              value={vitalsNote}
              onChange={(event) => setVitalsNote(event.target.value)}
            />
          </Field>
          <div className="border-t hairline pt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button className="btn" onClick={reset}>Clear</button>
            <button className="btn btn-primary px-6 py-2.5 sm:ml-auto" disabled={!allFilled || isRecording} onClick={submit}>
              {submitted || isRecording ? "Submitting..." : "Record vitals"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded p-5" style={{ background: preview.bg, border: `2px solid ${preview.fg}30` }}>
            <div className="field-label" style={{ color: preview.fg }}>Live NEWS2 score</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-6xl font-bold mono" style={{ color: preview.fg }}>{total}</span>
              <span className="text-lg font-semibold" style={{ color: preview.fg }}>{preview.label}</span>
            </div>
            <div className="mt-3 space-y-1.5 text-xs">
              {Object.entries(news.parts).map(([k, score]) => (
                <div key={k} className="flex justify-between">
                  <span className="ink-mute">{({ resp: "Resp rate", spo2: "SpO2", temp: "Temp", sys: "Sys BP", hr: "Heart rate", cons: "LOC" } as any)[k]}</span>
                  <span className="mono" style={{ color: score === 0 ? "#475569" : score >= 3 ? "#b91c1c" : score >= 2 ? "#b45309" : "#854d0e" }}>+{score}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-current opacity-30" />
            <div className="text-xs mt-1" style={{ color: preview.fg }}>
              {total >= 7 && "Will trigger RED escalation to consultant"}
              {total >= 5 && total < 7 && "Will trigger AMBER escalation to registrar"}
              {total < 5 && "Within normal range"}
            </div>
          </div>
          <div className="panel rounded p-4">
            <div className="field-label mb-2">Last 6 readings</div>
            <NEWSSparkline history={vitalsHistory.slice(-6)} w={260} h={48} />
            <div className="flex justify-between text-[10px] mono ink-mute mt-1">
              {vitalsHistory.slice(-6).map((vv, i) => (
                <span key={i}>{vv.newsScore}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {escalation && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-3 fadein sm:items-center">
          <div className="max-h-[94vh] w-full max-w-[520px] overflow-y-auto rounded bg-white shadow-2xl">
            <div className={`p-5 ${escalation.severity === "RED" ? "bg-red-600" : "bg-amber-500"} text-white`}>
              <div className="flex items-start gap-3">
                <Icons.alertCircle size={28} />
                <div>
                  <div className="text-xl font-bold sm:text-2xl">{escalation.severity} ESCALATION RAISED</div>
                  <div className="text-sm opacity-90">NEWS {escalation.score} · {escalation.severity === "RED" ? "Patient marked DETERIORATING" : "Threshold breached"}</div>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm ink-2">An escalation has been created for <span className="font-semibold">{patientFullName(patient)}</span> and the on-call <span className="font-semibold">{escalation.role.toLowerCase()}</span> has been notified.</p>
              <div className="border hairline rounded p-3">
                <div className="text-xs ink-mute">Notified</div>
                <div className="font-semibold">{escalation.name}</div>
                <div className="text-xs ink-mute mt-1">via SMS + in-app · expected response under 5 min</div>
              </div>
              <Field label="Vitals note"><textarea className="textarea" rows={3} value={vitalsNote} onChange={(event) => setVitalsNote(event.target.value)} /></Field>
            </div>
            <div className="px-5 py-3 border-t hairline flex flex-col-reverse gap-2 bg-slate-50 sm:flex-row sm:justify-end">
              <button className="btn" onClick={reset}>Done</button>
              <button className="btn btn-primary" onClick={reset}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
