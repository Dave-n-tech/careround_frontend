import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { Pause, Play, Square, Plus, Trash2, ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { useGetPatientQuery } from "@/services/api/patients";
import { useConfirmNoteMutation } from "@/services/api/clinicalNotes";
import { MOCK_PATIENTS } from "@/lib/mock-data";
import type { AiProcessingResult, AiPrescription, SoapContent } from "@/types/domain";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Mock AI result ───────────────────────────────────────────────────────────

const MOCK_AI_RESULT: AiProcessingResult = {
  rawTranscription:
    "Patient presenting today with continued shortness of breath, though she says it's slightly improved since yesterday. She's been on the diuretics for two days now. She's still not comfortable lying flat. I examined her this morning — blood pressure is 106 over 68, heart rate 96, respiratory rate still elevated at 22. Bibasal crackles on auscultation, slightly reduced compared to yesterday. JVP still elevated. I'm going to continue the current diuretic regimen. I'll add bisoprolol at a low dose starting tonight given the stabilising haemodynamics. I'd like repeat echo in three days.",
  clinicalNote: {
    subjective:
      "Patient reports continued shortness of breath with slight improvement since yesterday. Still unable to lie flat. No chest pain. Tolerating oral medications.",
    objective:
      "BP 106/68, HR 96, RR 22, SpO₂ 95%. Bibasal crackles slightly reduced compared to yesterday. JVP still elevated at 3cm. Pitting oedema to mid-shin. Weight down 1.2kg since admission.",
    assessment:
      "Acute decompensated heart failure — partial response to IV diuresis. Haemodynamics gradually stabilising. Underlying LV dysfunction (EF 30%) confirmed on echo.",
    plan:
      "Continue IV furosemide 40mg BD. Commence bisoprolol 1.25mg OD tonight — titrate as tolerated. Repeat echo in 3 days. Consider introducing ramipril once systolic BP consistently > 110. Continue fluid restriction 1.5L/day. Cardiology outpatient follow-up to be arranged.",
  },
  prescriptions: [
    (() => {
      const times = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setHours(21, 0, 0, 0);
        d.setDate(d.getDate() + i);
        return d.toISOString();
      });
      return {
        drugName: "Bisoprolol",
        dose: "1.25mg",
        route: "Oral",
        frequencyString: "Once daily",
        frequencyHours: 24,
        totalDoses: 7,
        startTime: times[0],
        administrationTimes: times,
      };
    })(),
  ],
};

// ─── Screen 1 — Recording ─────────────────────────────────────────────────────

function fmtTimer(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function Waveform({ active }: { active: boolean }) {
  const bars = 24;
  return (
    <div className="flex items-center justify-center gap-0.5 h-16">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-[var(--cr-accent)]"
          style={{
            height: active ? `${20 + Math.random() * 44}%` : "10%",
            animation: active ? `wave ${0.6 + (i % 5) * 0.12}s ease-in-out infinite alternate` : "none",
            transition: "height 0.1s",
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

interface Screen1Props {
  patientName: string;
  bedNumber?: string;
  onStop: () => void;
  onCancel: () => void;
}

function RecordingScreen({ patientName, bedNumber, onStop, onCancel }: Screen1Props) {
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      mr.start();
    }).catch(() => {
      // Microphone permission denied — still allow the flow to continue
    });

    timerRef.current = setInterval(() => {
      setPaused((p) => {
        if (!p) setSeconds((s) => s + 1);
        return p;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function togglePause() {
    if (!mediaRef.current) { setPaused((p) => !p); return; }
    if (paused) {
      mediaRef.current.resume();
      setPaused(false);
    } else {
      mediaRef.current.pause();
      setPaused(true);
    }
  }

  function handleStop() {
    if (mediaRef.current?.state !== "inactive") mediaRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    onStop();
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white px-6 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-auto">
        <div>
          <p className="text-sm font-semibold">{patientName}</p>
          {bedNumber && <p className="text-xs text-gray-400">Bed {bedNumber}</p>}
        </div>
        <button
          className="text-sm text-gray-400 hover:text-white transition-colors"
          onClick={() => setConfirmCancel(true)}
        >
          Cancel
        </button>
      </div>

      {/* Waveform + timer */}
      <div className="flex flex-col items-center justify-center flex-1 gap-6">
        <div className="w-full max-w-xs">
          <Waveform active={!paused} />
        </div>
        <p className="text-4xl font-mono tabular-nums text-white">{fmtTimer(seconds)}</p>
        {paused && <p className="text-xs text-gray-400 tracking-widest uppercase">Paused</p>}
      </div>

      {/* Controls */}
      <div className="flex gap-4 justify-center pb-8">
        <button
          onClick={togglePause}
          className="w-14 h-14 rounded-full border border-gray-600 flex items-center justify-center hover:border-gray-400 transition-colors"
        >
          {paused ? <Play size={22} /> : <Pause size={22} />}
        </button>
        <button
          onClick={handleStop}
          className="px-6 h-14 rounded-full bg-[var(--cr-accent)] font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Square size={16} />
          Stop & Save
        </button>
      </div>

      {/* Cancel confirm */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-xs w-full text-center mx-4">
            <p className="font-semibold mb-2">Discard recording?</p>
            <p className="text-sm text-gray-400 mb-5">The recording will be lost.</p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-2 rounded-lg border border-gray-600 text-sm hover:border-gray-400"
                onClick={() => setConfirmCancel(false)}
              >
                Keep recording
              </button>
              <button
                className="flex-1 py-2 rounded-lg bg-red-600 text-sm hover:bg-red-700"
                onClick={onCancel}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Screen 2 — Processing ────────────────────────────────────────────────────

interface Step { label: string; done: boolean; active: boolean }

interface Screen2Props {
  patientName: string;
  bedNumber?: string;
  isNurse: boolean;
  onDone: (result: AiProcessingResult) => void;
}

function ProcessingScreen({ patientName, bedNumber, isNurse, onDone }: Screen2Props) {
  const doctorSteps = ["Transcribing", "Structuring note", "Extracting prescriptions"];
  const nurseSteps = ["Transcribing your note"];
  const stepLabels = isNurse ? nurseSteps : doctorSteps;

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    stepLabels.forEach((_, i) => {
      timeouts.push(setTimeout(() => setCurrentStep(i + 1), (i + 1) * 1200));
    });
    timeouts.push(setTimeout(() => onDone(MOCK_AI_RESULT), (stepLabels.length + 1) * 1200));
    return () => timeouts.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-6">
      <div className="mb-auto">
        <p className="text-sm font-semibold text-[var(--cr-ink)]">{patientName}</p>
        {bedNumber && <p className="text-xs text-[var(--cr-muted)]">Bed {bedNumber}</p>}
      </div>

      <div className="flex flex-col items-center justify-center flex-1 gap-8">
        {/* Step track */}
        <div className="flex items-center gap-3">
          {stepLabels.map((label, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={label} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      done
                        ? "bg-[var(--cr-accent)] border-[var(--cr-accent)]"
                        : active
                        ? "border-[var(--cr-accent)] animate-pulse"
                        : "border-[var(--cr-line)]"
                    }`}
                  >
                    {done && <span className="text-white text-sm">✓</span>}
                    {!done && <span className={`w-2.5 h-2.5 rounded-full ${active ? "bg-[var(--cr-accent)]" : "bg-[var(--cr-line)]"}`} />}
                  </div>
                  <p className={`text-xs text-center max-w-20 ${active ? "text-[var(--cr-accent)] font-medium" : done ? "text-[var(--cr-muted)]" : "text-[var(--cr-muted)]"}`}>
                    {label}
                  </p>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`w-8 h-0.5 mb-5 transition-colors duration-500 ${done ? "bg-[var(--cr-accent)]" : "bg-[var(--cr-line)]"}`} />
                )}
              </div>
            );
          })}
        </div>

        <p className="text-sm text-[var(--cr-muted)] text-center max-w-xs">
          Processing your consultation — longer recordings may take up to 30 seconds.
        </p>
      </div>
    </div>
  );
}

// ─── Screen 3 — Review ────────────────────────────────────────────────────────

function SoapEditor({ soap, onChange }: {
  soap: SoapContent;
  onChange: (s: SoapContent) => void;
}) {
  const fields: (keyof SoapContent)[] = ["subjective", "objective", "assessment", "plan"];
  return (
    <div className="flex flex-col gap-3">
      {fields.map((k) => (
        <div key={k}>
          <label className="block text-xs font-bold tracking-wider text-[var(--cr-muted)] mb-1 capitalize">{k}</label>
          <textarea
            value={soap[k]}
            onChange={(e) => onChange({ ...soap, [k]: e.target.value })}
            className="w-full border border-[var(--cr-line)] rounded p-2 text-sm text-[var(--cr-ink)] resize-none focus:outline-none focus:border-[var(--cr-accent)]"
            rows={Math.max(2, soap[k].split("\n").length + 1)}
          />
        </div>
      ))}
    </div>
  );
}

interface RxCardProps {
  rx: AiPrescription;
  onEdit: (rx: AiPrescription) => void;
  onRemove: () => void;
}

function RxCard({ rx, onEdit, onRemove }: RxCardProps) {
  const [editing, setEditing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [form, setForm] = useState({ ...rx, frequencyHours: String(rx.frequencyHours), totalDoses: String(rx.totalDoses) });

  function handleSave() {
    const updated: AiPrescription = {
      ...rx,
      drugName: form.drugName,
      dose: form.dose,
      route: form.route,
      frequencyString: form.frequencyString,
      frequencyHours: Number(form.frequencyHours),
      totalDoses: Number(form.totalDoses),
      administrationTimes: form.administrationTimes,
    };
    onEdit(updated);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="border border-[var(--cr-accent)] rounded-lg p-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Drug Name" value={form.drugName} onChange={(e) => setForm((f) => ({ ...f, drugName: e.target.value }))} />
          <Input label="Dose" value={form.dose} onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))} />
          <Input label="Route" value={form.route} onChange={(e) => setForm((f) => ({ ...f, route: e.target.value }))} />
          <Input label="Frequency (hours)" type="number" value={form.frequencyHours} onChange={(e) => setForm((f) => ({ ...f, frequencyHours: e.target.value }))} />
          <Input label="Total Doses" type="number" value={form.totalDoses} onChange={(e) => setForm((f) => ({ ...f, totalDoses: e.target.value }))} />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>Save</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[var(--cr-line)] rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-[var(--cr-ink)]">{rx.drugName}</p>
          <p className="text-sm text-[var(--cr-ink-2)]">{rx.dose} — {rx.route}</p>
          <p className="text-xs text-[var(--cr-muted)]">{rx.frequencyString}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)} className="text-[var(--cr-muted)] hover:text-[var(--cr-ink)]">
            <Pencil size={14} />
          </button>
          <button onClick={() => setConfirmRemove(true)} className="text-[var(--cr-muted)] hover:text-[var(--cr-danger)]">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Time chips */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {rx.administrationTimes.map((t) => (
          <span key={t} className="px-2 py-0.5 rounded text-xs bg-[var(--cr-surface-3)] text-[var(--cr-muted)]">
            {new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </span>
        ))}
      </div>

      {/* Remove confirmation */}
      {confirmRemove && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm flex items-center justify-between">
          <span className="text-red-700">Remove this prescription?</span>
          <div className="flex gap-2">
            <button className="text-xs text-[var(--cr-muted)]" onClick={() => setConfirmRemove(false)}>Keep</button>
            <button className="text-xs text-red-700 font-medium" onClick={onRemove}>Remove</button>
          </div>
        </div>
      )}
    </div>
  );
}

interface Screen3Props {
  patientName: string;
  bedNumber?: string;
  result: AiProcessingResult;
  patientId: string;
  onSaved: () => void;
}

function ReviewScreen({ patientName, bedNumber, result, patientId, onSaved }: Screen3Props) {
  const [confirmNote] = useConfirmNoteMutation();
  const [soap, setSoap] = useState<SoapContent>(result.clinicalNote);
  const [prescriptions, setPrescriptions] = useState<AiPrescription[]>(result.prescriptions);
  const [transcriptionOpen, setTranscriptionOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const content = `Subjective:\n${soap.subjective}\n\nObjective:\n${soap.objective}\n\nAssessment:\n${soap.assessment}\n\nPlan:\n${soap.plan}`;
      await confirmNote({
        patientId,
        noteType: "WARD_ROUND_NOTE",
        content,
        rawTranscription: result.rawTranscription,
        isAiGenerated: true,
        extractPrescriptionsFromAi: false,
        prescriptions: prescriptions.map((rx) => ({
          drugName: rx.drugName,
          dose: rx.dose,
          route: rx.route,
          frequencyString: rx.frequencyString,
          frequencyHours: rx.frequencyHours,
          totalDoses: rx.totalDoses,
          startTime: rx.startTime,
          administrationTimes: rx.administrationTimes,
        })),
      }).unwrap();
      onSaved();
    } finally {
      setSaving(false);
      setSaveModalOpen(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Sticky patient context */}
      <div className="sticky top-0 bg-white border-b border-[var(--cr-line)] px-6 py-3 z-10">
        <p className="text-sm font-semibold text-[var(--cr-ink)]">{patientName}</p>
        {bedNumber && <p className="text-xs text-[var(--cr-muted)]">Bed {bedNumber}</p>}
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-6 max-w-3xl mx-auto w-full pb-28">
        {/* Raw transcription (collapsible) */}
        <div>
          <button
            className="flex items-center gap-2 text-sm font-medium text-[var(--cr-ink)] w-full"
            onClick={() => setTranscriptionOpen((o) => !o)}
          >
            {transcriptionOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Raw Transcription
          </button>
          {transcriptionOpen && (
            <div className="mt-2 p-3 bg-[var(--cr-surface-2)] rounded border border-[var(--cr-line)] text-sm text-[var(--cr-ink-2)] whitespace-pre-wrap">
              {result.rawTranscription}
            </div>
          )}
        </div>

        {/* Clinical Note */}
        <div>
          <h3 className="text-sm font-bold text-[var(--cr-ink)] mb-3">Clinical Note</h3>
          <SoapEditor soap={soap} onChange={setSoap} />
        </div>

        {/* Prescriptions */}
        {prescriptions.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-[var(--cr-ink)] mb-3">Prescriptions</h3>
            <div className="flex flex-col gap-3">
              {prescriptions.map((rx, i) => (
                <RxCard
                  key={i}
                  rx={rx}
                  onEdit={(updated) => setPrescriptions((p) => p.map((r, idx) => idx === i ? updated : r))}
                  onRemove={() => setPrescriptions((p) => p.filter((_, idx) => idx !== i))}
                />
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setPrescriptions((p) => [
            ...p,
            { drugName: "", dose: "", route: "", frequencyString: "", frequencyHours: 6, totalDoses: 4, startTime: new Date().toISOString(), administrationTimes: [] },
          ])}
          className="flex items-center gap-2 text-sm text-[var(--cr-accent)] font-medium"
        >
          <Plus size={14} />
          Add Prescription
        </button>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--cr-line)] px-6 py-4">
        <Button variant="primary" size="lg" onClick={() => setSaveModalOpen(true)} className="w-full max-w-3xl mx-auto block">
          Confirm and Save
        </Button>
      </div>

      {/* Save confirmation modal */}
      <Modal open={saveModalOpen} onClose={() => setSaveModalOpen(false)} title="Save consultation note?">
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="bg-[var(--cr-surface-2)] rounded p-3 text-sm">
            <p><strong>Patient:</strong> {patientName}</p>
            <p><strong>Date:</strong> {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
            <p><strong>1 clinical note</strong> (AI-generated, reviewed)</p>
            {prescriptions.length > 0 && (
              <p><strong>{prescriptions.length} prescription{prescriptions.length !== 1 ? "s" : ""}</strong></p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-[var(--cr-line)]">
            <Button variant="outline" onClick={() => setSaveModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Flow controller ──────────────────────────────────────────────────────────

type FlowScreen = "recording" | "processing" | "review";

export default function RecordingFlow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = useAppSelector((s) => s.auth.role);
  const { data: patientData } = useGetPatientQuery(id ?? "");

  const patient = patientData ?? MOCK_PATIENTS.find((p) => p.id === id);
  const [screen, setScreen] = useState<FlowScreen>("recording");
  const [aiResult, setAiResult] = useState<AiProcessingResult | null>(null);

  const isNurse = role === "NURSE";
  const backPath = role === "DOCTOR" ? `/doctor/patients/${id}` : `/nurse/patients/${id}`;

  if (!patient) return null;

  const patientName = `${patient.firstName} ${patient.lastName}`;

  return (
    <>
      {screen === "recording" && (
        <RecordingScreen
          patientName={patientName}
          bedNumber={patient.bedNumber}
          onStop={() => setScreen("processing")}
          onCancel={() => navigate(backPath)}
        />
      )}
      {screen === "processing" && (
        <ProcessingScreen
          patientName={patientName}
          bedNumber={patient.bedNumber}
          isNurse={isNurse}
          onDone={(result) => { setAiResult(result); setScreen("review"); }}
        />
      )}
      {screen === "review" && aiResult && (
        <ReviewScreen
          patientName={patientName}
          bedNumber={patient.bedNumber}
          result={aiResult}
          patientId={patient.id}
          onSaved={() => navigate(backPath)}
        />
      )}
    </>
  );
}
