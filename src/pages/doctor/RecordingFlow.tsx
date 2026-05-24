import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";

// ─── AI voice note API call ───────────────────────────────────────────────────

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";

async function processVoiceNote(
  audioBlob: Blob,
  patientId: string,
  isNurse: boolean,
  onTranscriptionComplete: () => void,
): Promise<AiProcessingResult | null> {
  const token = localStorage.getItem("cr_access_token");
  if (audioBlob.size === 0) return null;
  console.log("[audio] blobSize:", audioBlob.size, "blobType:", audioBlob.type);
  const mode = isNurse ? "transcription_only" : "ward_round";
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("patient_id", patientId);
  formData.append("current_time", new Date().toISOString());
  formData.append("mode", mode);
  try {
    const res = await fetch(`${apiBaseUrl}/ai/process-voice-note`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok || !res.body) return null;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let pendingEvent = "";
    let pendingData = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("event:")) {
          pendingEvent = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          pendingData = line.slice(5).trim();
        } else if (line === "") {
          // blank line = event boundary, dispatch
          if (pendingEvent === "transcription_complete") {
            onTranscriptionComplete();
          } else if (pendingEvent === "processing_complete" && pendingData) {
            try {
              const parsed = JSON.parse(pendingData);
              if (
                parsed?.rawTranscription !== undefined &&
                parsed?.clinicalNote !== undefined
              ) {
                console.log("[sse] processing_complete payload:", JSON.stringify(parsed, null, 2));
                return parsed as AiProcessingResult;
              }
            } catch {
              /* malformed */
            }
          } else if (pendingEvent === "error") {
            return null;
          }
          pendingEvent = "";
          pendingData = "";
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}
import {
  Pause,
  Play,
  Square,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Pencil,
  MicOff,
} from "lucide-react";
import { useGetPatientQuery } from "@/services/api/patients";
import {
  useAddNoteMutation,
  useConfirmNoteMutation,
} from "@/services/api/clinicalNotes";
import type {
  AiProcessingResult,
  AiPrescription,
  NoteType,
  SoapContent,
} from "@/types/domain";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";

const BLANK_AI_RESULT: AiProcessingResult = {
  rawTranscription: "",
  clinicalNote: { subjective: "", objective: "", assessment: "", plan: "" },
  prescriptions: [],
};

// ─── Screen 1 — Recording ─────────────────────────────────────────────────────

function fmtTimer(s: number) {
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
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
            animation: active
              ? `wave ${0.6 + (i % 5) * 0.12}s ease-in-out infinite alternate`
              : "none",
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
  onStop: (blob: Blob) => void;
  onCancel: () => void;
}

function RecordingScreen({
  patientName,
  bedNumber,
  onStop,
  onCancel,
}: Screen1Props) {
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [micError, setMicError] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
        const mr = new MediaRecorder(stream, { mimeType });
        mediaRef.current = mr;
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        mr.start(100);
      })
      .catch(() => {
        setMicError(true);
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
    if (!mediaRef.current) {
      setPaused((p) => !p);
      return;
    }
    if (paused) {
      mediaRef.current.resume();
      setPaused(false);
    } else {
      mediaRef.current.pause();
      setPaused(true);
    }
  }

  function handleStop() {
    if (timerRef.current) clearInterval(timerRef.current);
    const mr = mediaRef.current;
    if (mr && mr.state !== "inactive") {
      mr.onstop = () => {
        console.log("[audio] chunkCount:", chunksRef.current.length);
        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm;codecs=opus",
        });
        if (blob.size === 0) {
          setMicError(true);
          return;
        }
        onStop(blob);
      };
      mr.stop();
    } else {
      setMicError(true);
    }
  }

  if (micError) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col text-white px-6 py-6 items-center justify-center">
        <div className="text-center max-w-xs">
          <div className="w-14 h-14 rounded-full bg-red-900/50 flex items-center justify-center mx-auto mb-4">
            <MicOff size={24} className="text-red-400" />
          </div>
          <p className="font-semibold text-lg mb-2">Microphone unavailable</p>
          <p className="text-sm text-gray-400 mb-6">
            Allow microphone access in your browser settings, then try again.
          </p>
          <button
            className="px-6 py-3 rounded-full border border-gray-600 text-sm hover:border-gray-400 transition-colors"
            onClick={onCancel}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white px-6 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-auto">
        <div>
          <p className="text-sm font-semibold">{patientName}</p>
          {bedNumber && (
            <p className="text-xs text-gray-400">Bed {bedNumber}</p>
          )}
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
        <p className="text-4xl font-mono tabular-nums text-white">
          {fmtTimer(seconds)}
        </p>
        {paused && (
          <p className="text-xs text-gray-400 tracking-widest uppercase">
            Paused
          </p>
        )}
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
            <p className="text-sm text-gray-400 mb-5">
              The recording will be lost.
            </p>
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

interface Screen2Props {
  patientName: string;
  bedNumber?: string;
  isNurse: boolean;
  patientId: string;
  audioBlob: Blob;
  onDone: (result: AiProcessingResult) => void;
}

function ProcessingScreen({
  patientName,
  bedNumber,
  isNurse,
  patientId,
  audioBlob,
  onDone,
}: Screen2Props) {
  const doctorSteps = [
    "Transcribing",
    "Structuring note",
    "Extracting prescriptions",
  ];
  const nurseSteps = ["Transcribing your note"];
  const stepLabels = isNurse ? nurseSteps : doctorSteps;

  const [currentStep, setCurrentStep] = useState(0);
  const stepRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    function advance(to: number) {
      stepRef.current = to;
      if (!cancelled) setCurrentStep(to);
    }

    function finishRemaining(result: AiProcessingResult) {
      // Animate any remaining steps to done, then call onDone
      const from = stepRef.current;
      let delay = 0;
      for (let i = from; i < stepLabels.length; i++) {
        const s = i + 1;
        delay += 400;
        timeouts.push(setTimeout(() => advance(s), delay));
      }
      timeouts.push(
        setTimeout(() => {
          if (!cancelled) onDone(result);
        }, delay + 200),
      );
    }

    processVoiceNote(audioBlob, patientId, isNurse, () => {
      // transcription_complete — "Transcribing" step is done
      advance(1);
    }).then((result) => {
      console.log("[processing] result received by ProcessingScreen:", result);
      if (!cancelled) finishRemaining(result ?? BLANK_AI_RESULT);
    });

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-6">
      <div className="mb-auto">
        <p className="text-sm font-semibold text-[var(--cr-ink)]">
          {patientName}
        </p>
        {bedNumber && (
          <p className="text-xs text-[var(--cr-muted)]">Bed {bedNumber}</p>
        )}
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
                    {!done && (
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${active ? "bg-[var(--cr-accent)]" : "bg-[var(--cr-line)]"}`}
                      />
                    )}
                  </div>
                  <p
                    className={`text-xs text-center max-w-20 ${active ? "text-[var(--cr-accent)] font-medium" : done ? "text-[var(--cr-muted)]" : "text-[var(--cr-muted)]"}`}
                  >
                    {label}
                  </p>
                </div>
                {i < stepLabels.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mb-5 transition-colors duration-500 ${done ? "bg-[var(--cr-accent)]" : "bg-[var(--cr-line)]"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <p className="text-sm text-[var(--cr-muted)] text-center max-w-xs">
          Processing your consultation — longer recordings may take up to 30
          seconds.
        </p>
      </div>
    </div>
  );
}

// ─── Screen 3a — Nurse Review ────────────────────────────────────────────────

const NURSE_NOTE_TYPES = [
  { value: "HANDOVER_NOTE", label: "Handover Note" },
  { value: "NURSING_REPORT", label: "Nursing Report" },
];

interface NurseScreen3Props {
  patientName: string;
  bedNumber?: string;
  result: AiProcessingResult;
  patientId: string;
  onSaved: () => void;
}

function NurseReviewScreen({
  patientName,
  bedNumber,
  result,
  patientId,
  onSaved,
}: NurseScreen3Props) {
  const [addNote] = useAddNoteMutation();
  const [noteType, setNoteType] = useState<NoteType>("HANDOVER_NOTE");
  const [content, setContent] = useState(result.rawTranscription);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await addNote({
        patientId,
        noteType,
        content,
        isAiGenerated: true,
        rawTranscription: result.rawTranscription,
      }).unwrap();
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 bg-white border-b border-[var(--cr-line)] px-6 py-3 z-10">
        <p className="text-sm font-semibold text-[var(--cr-ink)]">
          {patientName}
        </p>
        {bedNumber && (
          <p className="text-xs text-[var(--cr-muted)]">Bed {bedNumber}</p>
        )}
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-5 max-w-3xl mx-auto w-full pb-28">
        <div>
          <h3 className="text-sm font-bold text-[var(--cr-ink)] mb-3">
            Note Type
          </h3>
          <Select
            label=""
            value={noteType}
            onChange={(e) => setNoteType(e.target.value as NoteType)}
            options={NURSE_NOTE_TYPES}
          />
        </div>

        <div>
          <h3 className="text-sm font-bold text-[var(--cr-ink)] mb-2">
            Transcription
          </h3>
          <p className="text-xs text-[var(--cr-muted)] mb-3">
            Review and edit before saving.
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-[var(--cr-line)] rounded-lg p-3 text-sm text-[var(--cr-ink)] resize-none focus:outline-none focus:border-[var(--cr-accent)]"
            rows={12}
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--cr-line)] px-6 py-4">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSave}
          loading={saving}
          disabled={!content.trim()}
          className="w-full max-w-3xl mx-auto block"
        >
          Save Note
        </Button>
      </div>
    </div>
  );
}

// ─── Screen 3b — Doctor Review ────────────────────────────────────────────────

function SoapEditor({
  soap,
  onChange,
}: {
  soap: SoapContent;
  onChange: (s: SoapContent) => void;
}) {
  const fields: (keyof SoapContent)[] = [
    "subjective",
    "objective",
    "assessment",
    "plan",
  ];
  return (
    <div className="flex flex-col gap-3">
      {fields.map((k) => (
        <div key={k}>
          <label className="block text-xs font-bold tracking-wider text-[var(--cr-muted)] mb-1 capitalize">
            {k}
          </label>
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
  const [form, setForm] = useState({
    ...rx,
    frequencyHours: String(rx.frequencyHours),
    totalDoses: String(rx.totalDoses),
  });

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
          <Input
            label="Drug Name"
            value={form.drugName}
            onChange={(e) =>
              setForm((f) => ({ ...f, drugName: e.target.value }))
            }
          />
          <Input
            label="Dose"
            value={form.dose}
            onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))}
          />
          <Input
            label="Route"
            value={form.route}
            onChange={(e) => setForm((f) => ({ ...f, route: e.target.value }))}
          />
          <Input
            label="Frequency (hours)"
            type="number"
            value={form.frequencyHours}
            onChange={(e) =>
              setForm((f) => ({ ...f, frequencyHours: e.target.value }))
            }
          />
          <Input
            label="Total Doses"
            type="number"
            value={form.totalDoses}
            onChange={(e) =>
              setForm((f) => ({ ...f, totalDoses: e.target.value }))
            }
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[var(--cr-line)] rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-[var(--cr-ink)]">{rx.drugName}</p>
          <p className="text-sm text-[var(--cr-ink-2)]">
            {rx.dose} — {rx.route}
          </p>
          <p className="text-xs text-[var(--cr-muted)]">{rx.frequencyString}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="text-[var(--cr-muted)] hover:text-[var(--cr-ink)]"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setConfirmRemove(true)}
            className="text-[var(--cr-muted)] hover:text-[var(--cr-danger)]"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Time chips */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {rx.administrationTimes.map((t) => (
          <span
            key={t}
            className="px-2 py-0.5 rounded text-xs bg-[var(--cr-surface-3)] text-[var(--cr-muted)]"
          >
            {new Date(t).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ))}
      </div>

      {/* Remove confirmation */}
      {confirmRemove && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm flex items-center justify-between">
          <span className="text-red-700">Remove this prescription?</span>
          <div className="flex gap-2">
            <button
              className="text-xs text-[var(--cr-muted)]"
              onClick={() => setConfirmRemove(false)}
            >
              Keep
            </button>
            <button
              className="text-xs text-red-700 font-medium"
              onClick={onRemove}
            >
              Remove
            </button>
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

function ReviewScreen({
  patientName,
  bedNumber,
  result,
  patientId,
  onSaved,
}: Screen3Props) {
  const [confirmNote] = useConfirmNoteMutation();
  console.log("[review] mounting ReviewScreen with result:", result);
  const [soap, setSoap] = useState<SoapContent>(result.clinicalNote);
  const [prescriptions, setPrescriptions] = useState<AiPrescription[]>(
    result.prescriptions,
  );
  const [transcriptionOpen, setTranscriptionOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const content = `Subjective:\n${soap.subjective}\n\nObjective:\n${soap.objective}\n\nAssessment:\n${soap.assessment}\n\nPlan:\n${soap.plan}`;
      const response = await confirmNote({
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
      const rxCount = response.prescriptionIds.length;
      toast.success(
        "Note & medication chart saved",
        rxCount > 0
          ? `${rxCount} prescription${rxCount !== 1 ? "s" : ""} added to the medication chart`
          : "Ward round note saved",
      );
      onSaved();
    } catch {
      toast.error("Could not save note", "Check your connection and try again");
    } finally {
      setSaving(false);
      setSaveModalOpen(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Sticky patient context */}
      <div className="sticky top-0 bg-white border-b border-[var(--cr-line)] px-6 py-3 z-10">
        <p className="text-sm font-semibold text-[var(--cr-ink)]">
          {patientName}
        </p>
        {bedNumber && (
          <p className="text-xs text-[var(--cr-muted)]">Bed {bedNumber}</p>
        )}
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-6 max-w-3xl mx-auto w-full pb-28">
        {/* Raw transcription (collapsible) */}
        <div>
          <button
            className="flex items-center gap-2 text-sm font-medium text-[var(--cr-ink)] w-full"
            onClick={() => setTranscriptionOpen((o) => !o)}
          >
            {transcriptionOpen ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
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
          <h3 className="text-sm font-bold text-[var(--cr-ink)] mb-3">
            Clinical Note
          </h3>
          <SoapEditor soap={soap} onChange={setSoap} />
        </div>

        {/* Prescriptions */}
        {prescriptions.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-[var(--cr-ink)] mb-3">
              Prescriptions
            </h3>
            <div className="flex flex-col gap-3">
              {prescriptions.map((rx, i) => (
                <RxCard
                  key={i}
                  rx={rx}
                  onEdit={(updated) =>
                    setPrescriptions((p) =>
                      p.map((r, idx) => (idx === i ? updated : r)),
                    )
                  }
                  onRemove={() =>
                    setPrescriptions((p) => p.filter((_, idx) => idx !== i))
                  }
                />
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() =>
            setPrescriptions((p) => [
              ...p,
              {
                drugName: "",
                dose: "",
                route: "",
                frequencyString: "",
                frequencyHours: 6,
                totalDoses: 4,
                startTime: new Date().toISOString(),
                administrationTimes: [],
              },
            ])
          }
          className="flex items-center gap-2 text-sm text-[var(--cr-accent)] font-medium"
        >
          <Plus size={14} />
          Add Prescription
        </button>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--cr-line)] px-6 py-4">
        <Button
          variant="primary"
          size="lg"
          onClick={() => setSaveModalOpen(true)}
          className="w-full max-w-3xl mx-auto block"
        >
          Confirm and Save
        </Button>
      </div>

      {/* Save confirmation modal */}
      <Modal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="Save consultation note?"
      >
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="bg-[var(--cr-surface-2)] rounded p-3 text-sm">
            <p>
              <strong>Patient:</strong> {patientName}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date().toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p>
              <strong>1 clinical note</strong> (AI-generated, reviewed)
            </p>
            {prescriptions.length > 0 && (
              <p>
                <strong>
                  {prescriptions.length} prescription
                  {prescriptions.length !== 1 ? "s" : ""}
                </strong>
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-[var(--cr-line)]">
            <Button
              variant="outline"
              onClick={() => setSaveModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              Save
            </Button>
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

  const patient = patientData;
  const [screen, setScreen] = useState<FlowScreen>("recording");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [aiResult, setAiResult] = useState<AiProcessingResult | null>(null);

  const isNurse = role === "NURSE";
  const backPath =
    role === "DOCTOR" ? `/doctor/patients/${id}` : `/nurse/patients/${id}`;

  if (!patient) return null;

  const patientName = `${patient.firstName} ${patient.lastName}`;

  return (
    <>
      {screen === "recording" && (
        <RecordingScreen
          patientName={patientName}
          bedNumber={patient.bedNumber}
          onStop={(blob) => {
            setAudioBlob(blob);
            setScreen("processing");
          }}
          onCancel={() => navigate(backPath)}
        />
      )}
      {screen === "processing" && audioBlob && (
        <ProcessingScreen
          patientName={patientName}
          bedNumber={patient.bedNumber}
          isNurse={isNurse}
          patientId={patient.id}
          audioBlob={audioBlob}
          onDone={(result) => {
            setAiResult(result);
            setScreen("review");
          }}
        />
      )}
      {screen === "review" && aiResult && isNurse && (
        <NurseReviewScreen
          patientName={patientName}
          bedNumber={patient.bedNumber}
          result={aiResult}
          patientId={patient.id}
          onSaved={() => navigate(backPath)}
        />
      )}
      {screen === "review" && aiResult && !isNurse && (
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
