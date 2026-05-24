import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Mic, Plus, AlertTriangle, ChevronLeft, Pause, Play, Square, X } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { clinicalNotesApi } from "@/services/api/clinicalNotes";
import type { AiProcessingResult } from "@/types/domain";

// ─── AI voice note API call ───────────────────────────────────────────────────

const aiApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1";

async function processVoiceNote(
  audioBlob: Blob,
  patientId: string,
  isNurse: boolean,
  onTranscriptionComplete: () => void,
): Promise<AiProcessingResult | null> {
  const token = localStorage.getItem("cr_access_token");
  const ext = audioBlob.type.includes("ogg") ? "ogg"
    : audioBlob.type.includes("mp4") || audioBlob.type.includes("m4a") ? "m4a"
    : audioBlob.type.includes("wav") ? "wav"
    : "webm";
  if (audioBlob.size === 0) return null;
  const formData = new FormData();
  formData.append("audio", audioBlob, `recording.${ext}`);
  const mode = isNurse ? "transcription_only" : "ward_round";
  try {
    const res = await fetch(`${aiApiBaseUrl}/ai/process-voice-note?patientId=${encodeURIComponent(patientId)}&mode=${mode}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok || !res.body) return null;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let pendingEvent = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("event:")) {
          pendingEvent = line.slice(6).trim();
          continue;
        }
        if (!line.startsWith("data:")) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === "[DONE]") { pendingEvent = ""; continue; }
        if (pendingEvent === "transcription_complete") {
          onTranscriptionComplete();
          pendingEvent = "";
          continue;
        }
        try {
          const parsed = JSON.parse(raw);
          const payload = parsed?.data ?? parsed;
          if (payload?.rawTranscription !== undefined && payload?.clinicalNote !== undefined) {
            return payload as AiProcessingResult;
          }
        } catch { /* non-JSON */ }
        pendingEvent = "";
      }
    }
    return null;
  } catch {
    return null;
  }
}
import { useGetPatientQuery } from "@/services/api/patients";
import { useGetPatientVitalsQuery, useRecordVitalsMutation } from "@/services/api/vitals";
import { useGetPatientNotesQuery, useAddNoteMutation, useConfirmNoteMutation } from "@/services/api/clinicalNotes";
import {
  useGetPatientPrescriptionsQuery,
  useGetMedicationChartQuery,
  useAddManualMedicationMutation,
  useUpdatePrescriptionMutation,
  useDiscontinuePrescriptionMutation,
} from "@/services/api/prescriptions";
import type { NoteType, SoapContent, AdministrationSlot } from "@/types/domain";
import type { MedicationChartResponse, PrescriptionEnriched, PatientVitalsEnriched } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AcuityBadge, VhiBadge } from "@/components/ui/badge";
import { ageFromDob, formatDateTime, timeAgo } from "@/utils/format";
import { computeVhi, countFilledVitals } from "@/utils/vhi";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSoap(content: string): SoapContent | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed.subjective !== undefined) return parsed as SoapContent;
  } catch { /* free text */ }
  return null;
}

function soapToNoteText(soap: SoapContent): string {
  return `Subjective:\n${soap.subjective}\n\nObjective:\n${soap.objective}\n\nAssessment:\n${soap.assessment}\n\nPlan:\n${soap.plan}`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function fmtChartTime(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

function fmtTimer(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  WARD_ROUND_NOTE: "Ward Round",
  PROGRESS_NOTE: "Progress Note",
  ADMISSION_NOTE: "Admission",
  DISCHARGE_NOTE: "Discharge",
  HANDOVER_NOTE: "Handover",
  NURSING_REPORT: "Nursing Report",
};

const NOTE_TYPE_COLORS: Record<NoteType, string> = {
  WARD_ROUND_NOTE: "border-l-[var(--cr-accent)] bg-[var(--cr-surface-2)]",
  PROGRESS_NOTE: "border-l-[var(--cr-accent)] bg-[var(--cr-surface-2)]",
  ADMISSION_NOTE: "border-l-blue-400 bg-blue-50",
  DISCHARGE_NOTE: "border-l-purple-400 bg-purple-50",
  HANDOVER_NOTE: "border-l-amber-400 bg-amber-50",
  NURSING_REPORT: "border-l-amber-400 bg-amber-50",
};

const NOTE_BADGE_COLORS: Record<NoteType, string> = {
  WARD_ROUND_NOTE: "bg-teal-100 text-teal-700",
  PROGRESS_NOTE: "bg-teal-100 text-teal-700",
  ADMISSION_NOTE: "bg-blue-100 text-blue-700",
  DISCHARGE_NOTE: "bg-purple-100 text-purple-700",
  HANDOVER_NOTE: "bg-amber-100 text-amber-700",
  NURSING_REPORT: "bg-amber-100 text-amber-700",
};

const EMPTY_SOAP: SoapContent = { subjective: "", objective: "", assessment: "", plan: "" };

// ─── Waveform animation ───────────────────────────────────────────────────────

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center gap-0.5 h-10">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-[var(--cr-accent)]"
          style={{
            animation: active ? `wave-${i % 5} ${0.5 + (i % 5) * 0.1}s ease-in-out infinite alternate` : "none",
            height: active ? undefined : "20%",
            minHeight: "20%",
            maxHeight: "100%",
          }}
        />
      ))}
      <style>{`
        @keyframes wave-0 { from { height: 20%; } to { height: 90%; } }
        @keyframes wave-1 { from { height: 30%; } to { height: 70%; } }
        @keyframes wave-2 { from { height: 25%; } to { height: 100%; } }
        @keyframes wave-3 { from { height: 15%; } to { height: 60%; } }
        @keyframes wave-4 { from { height: 40%; } to { height: 80%; } }
      `}</style>
    </div>
  );
}

// ─── Inline recording card ────────────────────────────────────────────────────

type RecordPhase = "recording" | "processing";

interface RecordingCardProps {
  patientName: string;
  bedNumber?: string;
  isNurse: boolean;
  patientId: string;
  onCancel: () => void;
  onDone: (noteText: string) => void;
}

const DOCTOR_STEPS = ["Transcribing", "Structuring note", "Extracting prescriptions"];
const NURSE_STEPS = ["Transcribing your note"];

function RecordingCard({ patientName, bedNumber, isNurse, patientId, onCancel, onDone }: RecordingCardProps) {
  const [phase, setPhase] = useState<RecordPhase>("recording");
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [micError, setMicError] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stepLabels = isNurse ? NURSE_STEPS : DOCTOR_STEPS;

  // Start microphone on mount
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mimeType = MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
        const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
        mediaRef.current = mr;
        mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mr.start(100);
      })
      .catch(() => { setMicError(true); });

    timerRef.current = setInterval(() => {
      setPaused((p) => { if (!p) setSeconds((s) => s + 1); return p; });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stepRef = useRef(0);

  // Run processing steps driven by SSE events when phase transitions
  useEffect(() => {
    if (phase !== "processing") return;

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    function advance(to: number) {
      stepRef.current = to;
      if (!cancelled) setCurrentStep(to);
    }

    function finishRemaining(noteText: string) {
      const from = stepRef.current;
      let delay = 0;
      for (let i = from; i < stepLabels.length; i++) {
        const s = i + 1;
        delay += 400;
        timeouts.push(setTimeout(() => advance(s), delay));
      }
      timeouts.push(setTimeout(() => { if (!cancelled) onDone(noteText); }, delay + 200));
    }

    const blob = audioBlobRef.current ?? new Blob([], { type: "audio/webm" });
    processVoiceNote(blob, patientId, isNurse, () => {
      advance(1);
    }).then((result) => {
      if (cancelled) return;
      const noteText = result
        ? (isNurse ? result.rawTranscription : soapToNoteText(result.clinicalNote))
        : (isNurse ? "" : soapToNoteText(EMPTY_SOAP));
      finishRemaining(noteText);
    });

    return () => { cancelled = true; timeouts.forEach(clearTimeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function togglePause() {
    if (!mediaRef.current) { setPaused((p) => !p); return; }
    if (paused) { mediaRef.current.resume(); setPaused(false); }
    else { mediaRef.current.pause(); setPaused(true); }
  }

  function handleStop() {
    if (timerRef.current) clearInterval(timerRef.current);
    const mr = mediaRef.current;
    if (mr && mr.state !== "inactive") {
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        if (blob.size === 0) { setMicError(true); return; }
        audioBlobRef.current = blob;
        setPhase("processing");
        setCurrentStep(0);
      };
      mr.stop();
    } else {
      setMicError(true);
    }
  }

  return (
    <div className="fixed bottom-24 right-6 w-80 bg-white border border-[var(--cr-line)] rounded-xl shadow-2xl z-30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--cr-line)] bg-[var(--cr-surface-2)]">
        <div>
          <p className="text-xs font-semibold text-[var(--cr-ink)]">{patientName}</p>
          {bedNumber && <p className="text-xs text-[var(--cr-muted)]">Bed {bedNumber}</p>}
        </div>
        {(phase === "recording" || micError) && (
          <button onClick={onCancel} className="text-[var(--cr-muted)] hover:text-[var(--cr-ink)]">
            <X size={15} />
          </button>
        )}
      </div>

      {micError && (
        <div className="px-4 py-5 flex flex-col items-center gap-3 text-center">
          <AlertTriangle size={22} className="text-red-500" />
          <p className="text-sm font-semibold text-[var(--cr-ink)]">Microphone unavailable</p>
          <p className="text-xs text-[var(--cr-muted)]">Allow microphone access in your browser settings, then try again.</p>
          <button onClick={onCancel} className="text-sm text-[var(--cr-accent)] font-medium">
            Dismiss
          </button>
        </div>
      )}

      {!micError && phase === "recording" && (
        <div className="px-4 py-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-[var(--cr-muted)] uppercase tracking-widest">
              {paused ? "Paused" : "Recording"}
            </span>
          </div>
          <Waveform active={!paused} />
          <p className="text-2xl font-mono text-center text-[var(--cr-ink)] tabular-nums">{fmtTimer(seconds)}</p>
          <div className="flex gap-2">
            <button
              onClick={togglePause}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[var(--cr-line)] text-sm text-[var(--cr-muted)] hover:text-[var(--cr-ink)] transition-colors"
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={handleStop}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--cr-accent)] text-white text-sm font-medium hover:bg-teal-600 transition-colors"
            >
              <Square size={14} />
              Stop &amp; Save
            </button>
          </div>
        </div>
      )}

      {!micError && phase === "processing" && (
        <div className="px-4 py-5 flex flex-col gap-4">
          {/* Step track */}
          <div className="flex items-center justify-center gap-2">
            {stepLabels.map((label, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      done ? "bg-[var(--cr-accent)] border-[var(--cr-accent)]" :
                      active ? "border-[var(--cr-accent)] animate-pulse" :
                      "border-[var(--cr-line)]"
                    }`}>
                      {done
                        ? <span className="text-white text-xs">✓</span>
                        : <span className={`w-2 h-2 rounded-full ${active ? "bg-[var(--cr-accent)]" : "bg-[var(--cr-line)]"}`} />
                      }
                    </div>
                    <p className={`text-xs text-center leading-tight max-w-16 ${active ? "text-[var(--cr-accent)] font-medium" : "text-[var(--cr-muted)]"}`}>
                      {label}
                    </p>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div className={`w-6 h-0.5 mb-4 transition-colors duration-500 ${done ? "bg-[var(--cr-accent)]" : "bg-[var(--cr-line)]"}`} />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[var(--cr-muted)] text-center">
            Processing your consultation…
          </p>
        </div>
      )}
    </div>
  );
}

// ─── NoteBody helper ──────────────────────────────────────────────────────────

function NoteBody({ note }: { note: { content: string } }) {
  const soap = parseSoap(note.content);
  if (soap) {
    return (
      <div className="text-sm space-y-2">
        {(["subjective", "objective", "assessment", "plan"] as (keyof SoapContent)[]).map((k) => (
          <div key={k}>
            <span className="font-semibold capitalize text-[var(--cr-ink)]">{k}: </span>
            <span className="text-[var(--cr-ink-2)]">{soap[k]}</span>
          </div>
        ))}
      </div>
    );
  }
  return <p className="text-sm text-[var(--cr-ink-2)] whitespace-pre-wrap">{note.content}</p>;
}

// ─── Tab 1 — Overview ─────────────────────────────────────────────────────────

function VitalsMiniCard({ label, value, unit, score }: {
  label: string; value?: number | null; unit: string; score?: number;
}) {
  const dotColor = score === undefined ? "" :
    score >= 3 ? "bg-red-500" : score >= 1 ? "bg-amber-500" : "bg-green-500";

  return (
    <div className="relative bg-[var(--cr-surface-2)] border border-[var(--cr-line)] rounded p-2 text-center min-w-0">
      {score !== undefined && (
        <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${dotColor}`} />
      )}
      <p className="text-lg font-bold text-[var(--cr-ink)]">{value ?? "—"}</p>
      <p className="text-xs text-[var(--cr-muted)]">{unit}</p>
      <p className="text-xs text-[var(--cr-muted)] mt-0.5">{label}</p>
    </div>
  );
}

function OverviewTab({ patientId }: { patientId: string }) {
  const { data: vitalsData } = useGetPatientVitalsQuery(patientId);
  const { data: notesData } = useGetPatientNotesQuery(patientId);
  const { data: rxData } = useGetPatientPrescriptionsQuery(patientId);
  const { data: patientData } = useGetPatientQuery(patientId);

  const patient = patientData;
  const vitals = vitalsData ?? [];
  const notes = notesData ?? [];
  const prescriptions = rxData ?? [];

  const latest = vitals[0];
  const latestNote = notes[notes.length - 1];
  const activeMeds = prescriptions.filter((rx) => rx.status === "ACTIVE");

  const vhiGuidance: Record<string, string> = {
    STABLE: "Routine monitoring.",
    WATCH: "Inform the floor doctor or re-check in 2 hours.",
    CRITICAL: "Urgent medical attention required immediately.",
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--cr-muted)] mb-2">Admission Summary</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-[var(--cr-muted)]">Primary Diagnosis</p>
            <p className="text-sm font-medium text-[var(--cr-ink)]">{patient?.primaryDiagnosis ?? "Not recorded"}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--cr-muted)]">Admission Type</p>
            <p className="text-sm text-[var(--cr-ink)]">{patient?.admissionType ?? "—"}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--cr-muted)] mb-2">Latest Vitals</h3>
        {!latest ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
            <AlertTriangle size={14} />
            No vitals recorded today
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              <VitalsMiniCard label="Pulse" value={latest.pulse} unit="bpm" score={computeVhi(latest).pulse} />
              <VitalsMiniCard label="Sys. BP" value={latest.systolicBp} unit="mmHg" score={computeVhi(latest).systolicBp} />
              <VitalsMiniCard label="Dia. BP" value={latest.diastolicBp} unit="mmHg" />
              <VitalsMiniCard label="Resp. Rate" value={latest.respiratoryRate} unit="br/min" score={computeVhi(latest).respiratoryRate} />
              <VitalsMiniCard label="Temp" value={latest.temperature} unit="°C" score={computeVhi(latest).temperature} />
              <VitalsMiniCard label="SpO₂" value={latest.spo2} unit="%" score={computeVhi(latest).spo2} />
            </div>
            <div className={`p-3 rounded border ${
              latest.vhiStatus === "CRITICAL" ? "border-red-300 bg-red-50" :
              latest.vhiStatus === "WATCH" ? "border-amber-300 bg-amber-50" :
              "border-green-300 bg-green-50"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--cr-muted)]">Vitals Health Index</p>
                  <p className="text-2xl font-bold text-[var(--cr-ink)]">{latest.vhiScore}</p>
                  <p className="text-xs text-[var(--cr-muted)] mt-1">{vhiGuidance[latest.vhiStatus]}</p>
                </div>
                <VhiBadge score={latest.vhiScore} status={latest.vhiStatus} size="lg" />
              </div>
              <p className="text-xs text-[var(--cr-muted)] mt-2">
                Recorded {formatDateTime(latest.recordedAt)} by {latest.recordedByName}
              </p>
            </div>
          </>
        )}
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--cr-muted)] mb-2">Most Recent Note</h3>
        {!latestNote ? (
          <p className="text-sm text-[var(--cr-muted)]">No notes recorded.</p>
        ) : (
          <div className={`border-l-4 rounded p-3 ${NOTE_TYPE_COLORS[latestNote.noteType]}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-sm font-medium text-[var(--cr-ink)]">{latestNote.authorName}</p>
                <p className="text-xs text-[var(--cr-muted)]">{latestNote.authorRole}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${NOTE_BADGE_COLORS[latestNote.noteType]}`}>
                  {NOTE_TYPE_LABELS[latestNote.noteType]}
                </span>
                <p className="text-xs text-[var(--cr-muted)] mt-1">{formatDateTime(latestNote.createdAt)}</p>
              </div>
            </div>
            <NoteBody note={latestNote} />
          </div>
        )}
      </div>

      {activeMeds.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--cr-muted)] mb-2">Active Medications</h3>
          <div className="flex flex-wrap gap-2">
            {activeMeds.map((rx) => (
              <span key={rx.id} className="px-2 py-1 rounded text-xs bg-teal-50 text-teal-700 border border-teal-200">
                {rx.drugName} {rx.dose}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2 — Notes (includes recording) ──────────────────────────────────────

const DOCTOR_NOTE_TYPES = [
  { value: "WARD_ROUND_NOTE", label: "Ward Round Note" },
  { value: "PROGRESS_NOTE", label: "Progress Note" },
  { value: "ADMISSION_NOTE", label: "Admission Note" },
  { value: "DISCHARGE_NOTE", label: "Discharge Note" },
];
const NURSE_NOTE_TYPES = [
  { value: "HANDOVER_NOTE", label: "Handover Note" },
  { value: "NURSING_REPORT", label: "Nursing Report" },
];

function NotesTab({
  patientId, canWrite, recording, onAddNote, onStartRecording,
  prescriptionNotice, onDismissPrescriptionNotice,
}: {
  patientId: string;
  canWrite: boolean;
  recording: boolean;
  onAddNote: () => void;
  onStartRecording: () => void;
  prescriptionNotice: boolean;
  onDismissPrescriptionNotice: () => void;
}) {
  const { data: notesData } = useGetPatientNotesQuery(patientId);
  const notes = notesData ?? [];
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes.length]);

  return (
    <div className="flex flex-col">
      {prescriptionNotice && (
        <div className="flex items-start gap-3 mb-4 p-3 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-800">
          <p className="flex-1">
            Ward round note saved. Prescriptions are being extracted — check the{" "}
            <strong>Medications</strong> tab shortly.
          </p>
          <button onClick={onDismissPrescriptionNotice} className="text-teal-500 hover:text-teal-700 shrink-0">
            <X size={16} />
          </button>
        </div>
      )}
      {canWrite && (
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={onAddNote}>
            <Plus size={13} />
            Add Note
          </Button>
        </div>
      )}

      {notes.length === 0 ? (
        <p className="text-sm text-[var(--cr-muted)] text-center py-8">No notes recorded yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {notes.map((note) => (
            <div key={note.id} className={`border-l-4 rounded p-3 ${NOTE_TYPE_COLORS[note.noteType]}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-medium text-[var(--cr-ink)]">{note.authorName}</p>
                  <p className="text-xs text-[var(--cr-muted)]">{note.authorRole}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${NOTE_BADGE_COLORS[note.noteType]}`}>
                    {NOTE_TYPE_LABELS[note.noteType]}
                  </span>
                  <p className="text-xs text-[var(--cr-muted)] mt-1">{formatDateTime(note.createdAt)}</p>
                </div>
              </div>
              <NoteBody note={note} />
            </div>
          ))}
        </div>
      )}
      <div ref={bottomRef} />

      {/* Floating mic button — only visible on Notes tab, hidden while recording active */}
      {canWrite && !recording && (
        <button
          onClick={onStartRecording}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--cr-accent)] text-white flex items-center justify-center shadow-lg hover:bg-teal-600 transition-colors z-20"
          title="Record consultation"
        >
          <Mic size={22} />
        </button>
      )}
    </div>
  );
}

// ─── Tab 3 — Medications ──────────────────────────────────────────────────────

function TimeChip({ slot }: { slot: AdministrationSlot }) {
  const now = new Date();
  const t = new Date(slot.scheduledTime);
  const diff = (t.getTime() - now.getTime()) / 60000;
  const status: "pending" | "due-soon" | "completed" | "overdue" =
    slot.taskStatus === "COMPLETED" || slot.completedAt ? "completed" :
    slot.taskStatus === "OVERDUE" || t < now ? "overdue" :
    diff <= 30 ? "due-soon" :
    "pending";

  const chipClass =
    status === "completed" ? "bg-green-500 text-white" :
    status === "overdue" ? "bg-red-500 text-white" :
    status === "due-soon" ? "bg-amber-400 text-white" :
    "bg-[var(--cr-surface-3)] text-[var(--cr-muted)]";

  const tooltipText =
    status === "completed"
      ? slot.completedByName ? `Administered by ${slot.completedByName}` : "Administered"
      : status === "overdue"
      ? `Not administered — due ${fmtTime(slot.scheduledTime)}`
      : null;

  return (
    <div className="relative group flex flex-col items-center gap-0.5">
      <span className={`px-2 py-1 rounded text-xs font-medium ${chipClass}`}>
        {fmtTime(slot.scheduledTime)}
        {status === "completed" && <span className="ml-1">✓</span>}
        {status === "overdue" && <span className="ml-1">!</span>}
      </span>

      {/* Mobile: show first name inline below the chip */}
      {status === "completed" && slot.completedByName && (
        <span className="sm:hidden text-[10px] text-[var(--cr-muted)] leading-tight text-center">
          {slot.completedByName.split(" ")[0]}
        </span>
      )}

      {/* Desktop: dark tooltip on hover */}
      {tooltipText && (
        <div className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--cr-ink)] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-sm">
          {tooltipText}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--cr-ink)]" />
        </div>
      )}
    </div>
  );
}

// ─── MAR table helpers ────────────────────────────────────────────────────────

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDayHeader(key: string): { weekday: string; date: string } {
  const d = new Date(`${key}T12:00:00`);
  return {
    weekday: d.toLocaleDateString("en-GB", { weekday: "short" }),
    date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  };
}

function frequencyLabel(hours: number): string {
  const labels: Record<number, string> = {
    24: "Once daily", 12: "Twice daily", 8: "Three times daily", 6: "Four times daily",
  };
  return labels[hours] ?? `Every ${hours} hours`;
}

function computeAdministrationTimes(startTime: string, frequencyHours: number, totalDoses: number): string[] {
  const start = new Date(startTime).getTime();
  return Array.from({ length: totalDoses }, (_, i) =>
    new Date(start + i * frequencyHours * 3600 * 1000).toISOString()
  );
}

function AddMedModal({ open, onClose, patientId }: { open: boolean; onClose: () => void; patientId: string }) {
  const [addManualMedication] = useAddManualMedicationMutation();
  const [form, setForm] = useState({
    drugName: "", dose: "", route: "", frequencyHours: "6", totalDoses: "4",
    startTime: new Date().toISOString().slice(0, 16),
  });
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const startIso = new Date(form.startTime).toISOString();
      const freqHours = Number(form.frequencyHours);
      const doses = Number(form.totalDoses);
      await addManualMedication({
        patientId,
        drugName: form.drugName,
        dose: form.dose,
        route: form.route,
        frequencyString: frequencyLabel(freqHours),
        frequencyHours: freqHours,
        totalDoses: doses,
        startTime: startIso,
        administrationTimes: computeAdministrationTimes(startIso, freqHours, doses),
      }).unwrap();
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Medication">
      <form onSubmit={handleSave} className="px-6 py-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Drug Name *" value={form.drugName} onChange={(e) => setForm((f) => ({ ...f, drugName: e.target.value }))} />
          <Input label="Dose *" value={form.dose} onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))} placeholder="e.g. 500mg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Route *" value={form.route} onChange={(e) => setForm((f) => ({ ...f, route: e.target.value }))} placeholder="e.g. oral, IV" />
          <Input label="Frequency (hours)" type="number" min={1} value={form.frequencyHours} onChange={(e) => setForm((f) => ({ ...f, frequencyHours: e.target.value }))} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Total Doses" type="number" min={1} value={form.totalDoses} onChange={(e) => setForm((f) => ({ ...f, totalDoses: e.target.value }))} />
          <Input label="Start Time" type="datetime-local" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-[var(--cr-line)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" loading={saving}>Add Medication</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditMedModal({
  open, onClose, chart, patientId,
}: {
  open: boolean; onClose: () => void; chart: MedicationChartResponse; patientId: string;
}) {
  const [updatePrescription] = useUpdatePrescriptionMutation();
  const [form, setForm] = useState({
    drugName: chart.drugName,
    dose: chart.dose,
    route: chart.route,
    frequencyHours: String(chart.frequencyHours),
    totalDoses: String(chart.totalDoses),
    startTime: new Date(chart.startTime).toISOString().slice(0, 16),
  });
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePrescription({
        prescriptionId: chart.prescriptionId,
        patientId,
        drugName: form.drugName,
        dose: form.dose,
        route: form.route,
        frequencyHours: Number(form.frequencyHours),
        totalDoses: Number(form.totalDoses),
        startTime: new Date(form.startTime).toISOString(),
      }).unwrap();
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Medication">
      <form onSubmit={handleSave} className="px-6 py-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Drug Name *" value={form.drugName} onChange={(e) => setForm((f) => ({ ...f, drugName: e.target.value }))} />
          <Input label="Dose *" value={form.dose} onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))} placeholder="e.g. 500mg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Route *" value={form.route} onChange={(e) => setForm((f) => ({ ...f, route: e.target.value }))} placeholder="e.g. oral, IV" />
          <Input label="Frequency (hours)" type="number" min={1} value={form.frequencyHours} onChange={(e) => setForm((f) => ({ ...f, frequencyHours: e.target.value }))} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Total Doses" type="number" min={1} value={form.totalDoses} onChange={(e) => setForm((f) => ({ ...f, totalDoses: e.target.value }))} />
          <Input label="Start Time" type="datetime-local" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-[var(--cr-line)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" loading={saving}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}

function MedicationsTab({ patientId, canWrite }: { patientId: string; canWrite: boolean }) {
  const { data: chartData } = useGetMedicationChartQuery(patientId);
  const [discontinuePrescription] = useDiscontinuePrescriptionMutation();

  // Use chart data (enriched with administrationSlots) when available; fall back to mock prescriptions
  // shaped as chart entries for the MAR table
  const charts = chartData ?? [];

  const [addMedOpen, setAddMedOpen] = useState(false);
  const [editRx, setEditRx] = useState<MedicationChartResponse | null>(null);
  const [confirmDisc, setConfirmDisc] = useState<string | null>(null); // prescriptionId
  const [discarding, setDiscarding] = useState(false);

  async function handleDisc() {
    if (!confirmDisc) return;
    setDiscarding(true);
    try {
      await discontinuePrescription({ prescriptionId: confirmDisc, patientId }).unwrap();
      setConfirmDisc(null);
    } finally { setDiscarding(false); }
  }

  // Collect all unique day keys across every chart entry
  const daySet = new Set<string>();
  for (const chart of charts) {
    for (const slot of chart.administrationSlots) daySet.add(dayKey(slot.scheduledTime));
  }
  const days = [...daySet].sort();
  const todayStr = dayKey(new Date().toISOString());

  const discChart = charts.find((c) => c.prescriptionId === confirmDisc);

  return (
    <div>
      {canWrite && (
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={() => setAddMedOpen(true)}>
            <Plus size={13} /> Add Medication
          </Button>
        </div>
      )}

      {charts.length === 0 ? (
        <p className="text-sm text-[var(--cr-muted)] text-center py-8">No medications prescribed.</p>
      ) : (
        <div className="overflow-x-auto border border-[var(--cr-line)] rounded-lg">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-[var(--cr-surface-2)] text-left px-4 py-2.5 text-xs font-semibold text-[var(--cr-muted)] uppercase tracking-wide border-b border-r border-[var(--cr-line)] min-w-52">
                  Medication
                </th>
                {days.map((d) => {
                  const { weekday, date } = fmtDayHeader(d);
                  const isToday = d === todayStr;
                  return (
                    <th
                      key={d}
                      className={`text-center px-3 py-2 text-xs font-semibold border-b border-[var(--cr-line)] min-w-[84px] ${
                        isToday
                          ? "bg-teal-50 text-[var(--cr-accent)] border-l-2 border-l-[var(--cr-accent)]"
                          : "bg-[var(--cr-surface-2)] text-[var(--cr-muted)]"
                      }`}
                    >
                      <div>{weekday}</div>
                      <div className="font-normal">{date}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {charts.map((chart, idx) => {
                const isDiscontinued = chart.status === "DISCONTINUED";
                const rowBg = idx % 2 === 0 ? "#ffffff" : "var(--cr-surface-2)";

                // Group this chart's slots by day
                const slotsByDay: Record<string, AdministrationSlot[]> = {};
                for (const slot of chart.administrationSlots) {
                  const dk = dayKey(slot.scheduledTime);
                  if (!slotsByDay[dk]) slotsByDay[dk] = [];
                  slotsByDay[dk].push(slot);
                }

                return (
                  <tr key={chart.id} className={isDiscontinued ? "opacity-50" : ""}>
                    {/* Sticky left column — medication info */}
                    <td
                      className="sticky left-0 z-10 px-4 py-3 border-r border-[var(--cr-line)] align-top"
                      style={{ backgroundColor: rowBg }}
                    >
                      <p className="font-semibold text-[var(--cr-ink)] leading-tight">{chart.drugName}</p>
                      <p className="text-xs text-[var(--cr-ink-2)] mt-0.5">{chart.dose} · {chart.route}</p>
                      <p className="text-xs text-[var(--cr-muted)]">{chart.frequencyString}</p>
                      <p className="text-xs text-[var(--cr-muted)]">
                        {chart.totalDoses} doses{chart.confirmedByName ? ` · by ${chart.confirmedByName}` : ""}
                      </p>
                      {isDiscontinued ? (
                        <span className="mt-1.5 inline-block text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                          Discontinued
                        </span>
                      ) : canWrite ? (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[var(--cr-accent)] text-[var(--cr-accent)] hover:bg-teal-50"
                            onClick={() => setEditRx(chart)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline-destructive"
                            size="sm"
                            onClick={() => setConfirmDisc(chart.prescriptionId)}
                          >
                            Discontinue
                          </Button>
                        </div>
                      ) : null}
                    </td>

                    {/* Day cells */}
                    {days.map((d) => {
                      const isToday = d === todayStr;
                      const slots = slotsByDay[d] ?? [];
                      return (
                        <td
                          key={d}
                          className={`px-2 py-2 text-center align-top ${
                            isToday ? "bg-teal-50/40 border-l-2 border-l-[var(--cr-accent)]" : ""
                          }`}
                        >
                          <div className="flex flex-col gap-1 items-center">
                            {slots.map((slot) => (
                              <TimeChip key={slot.scheduledTime} slot={slot} />
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddMedModal open={addMedOpen} onClose={() => setAddMedOpen(false)} patientId={patientId} />

      {editRx && (
        <EditMedModal
          open={!!editRx}
          onClose={() => setEditRx(null)}
          chart={editRx}
          patientId={patientId}
        />
      )}

      <ConfirmModal
        open={!!confirmDisc}
        onClose={() => setConfirmDisc(null)}
        onConfirm={handleDisc}
        title="Discontinue medication?"
        body={discChart ? `${discChart.drugName} — all future scheduled doses will be cancelled.` : ""}
        confirmLabel="Discontinue"
        variant="destructive"
        loading={discarding}
      />
    </div>
  );
}

// ─── Tab 4 — Vitals ───────────────────────────────────────────────────────────

type VitalsRange = "24h" | "48h" | "7d" | "all";

function VitalsTab({ patientId, canWrite }: { patientId: string; canWrite: boolean }) {
  const { data: vitalsData } = useGetPatientVitalsQuery(patientId);
  const [recordVitals] = useRecordVitalsMutation();
  const vitals = (vitalsData ?? []) as PatientVitalsEnriched[];
  const [range, setRange] = useState<VitalsRange>("48h");
  const [recordOpen, setRecordOpen] = useState(false);
  const [vForm, setVForm] = useState({ pulse: "", systolicBp: "", diastolicBp: "", respiratoryRate: "", temperature: "", spo2: "" });
  const [saving, setSaving] = useState(false);

  const rangeCutoff: Record<VitalsRange, number> = { "24h": 24, "48h": 48, "7d": 168, "all": Infinity };
  const cutoffMs = rangeCutoff[range] * 3600 * 1000;
  const now = Date.now();
  const chartVitals = [...vitals]
    .filter((v) => now - new Date(v.recordedAt).getTime() <= cutoffMs)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

  const chartData = chartVitals.map((v) => ({
    time: fmtChartTime(v.recordedAt),
    Pulse: v.pulse, "Sys. BP": v.systolicBp,
    "Resp. Rate": v.respiratoryRate, Temp: v.temperature, "SpO₂": v.spo2,
  }));

  const vhiPreview = countFilledVitals(vForm) >= 2 ? computeVhi(vForm) : null;
  const vhiGuide: Record<string, string> = {
    STABLE: "Routine monitoring.",
    WATCH: "Inform the floor doctor or re-check in 2 hours.",
    CRITICAL: "Urgent medical attention required immediately.",
  };

  async function handleRecordVitals(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await recordVitals({
        patientId,
        pulse: vForm.pulse ? Number(vForm.pulse) : undefined,
        systolicBp: vForm.systolicBp ? Number(vForm.systolicBp) : undefined,
        diastolicBp: vForm.diastolicBp ? Number(vForm.diastolicBp) : undefined,
        respiratoryRate: vForm.respiratoryRate ? Number(vForm.respiratoryRate) : undefined,
        temperature: vForm.temperature ? Number(vForm.temperature) : undefined,
        spo2: vForm.spo2 ? Number(vForm.spo2) : undefined,
      }).unwrap();
      setRecordOpen(false);
      setVForm({ pulse: "", systolicBp: "", diastolicBp: "", respiratoryRate: "", temperature: "", spo2: "" });
    } finally { setSaving(false); }
  }

  return (
    <div>
      {canWrite && (
        <div className="flex justify-end mb-4">
          <Button variant="primary" size="sm" onClick={() => setRecordOpen(true)}>
            <Plus size={13} /> Record Vitals
          </Button>
        </div>
      )}
      {chartData.length > 0 ? (
        <div className="mb-5">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cr-line)" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Pulse" stroke="#ef4444" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="Sys. BP" stroke="#f97316" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="Resp. Rate" stroke="#3b82f6" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="Temp" stroke="#a855f7" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="SpO₂" stroke="#14b8a6" dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-2 justify-center mt-2">
            {(["24h", "48h", "7d", "all"] as VitalsRange[]).map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                range === r ? "bg-[var(--cr-accent)] text-white" : "bg-[var(--cr-surface-3)] text-[var(--cr-muted)] hover:text-[var(--cr-ink)]"
              }`}>
                {r === "all" ? "Full" : `Last ${r}`}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--cr-muted)] text-center py-4">No vitals in this range.</p>
      )}

      <div className="overflow-x-auto">
        <table className="cr text-sm">
          <thead>
            <tr><th>Time</th><th>Pulse</th><th>Sys. BP</th><th>Dia. BP</th><th>Resp.</th><th>Temp</th><th>SpO₂</th><th>VHI</th><th>By</th></tr>
          </thead>
          <tbody>
            {[...vitals].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()).map((v) => {
              const bd = computeVhi(v);
              return (
                <tr key={v.id}>
                  <td className="text-xs text-[var(--cr-muted)]">{formatDateTime(v.recordedAt)}</td>
                  <td className={bd.pulse >= 3 ? "text-red-600 font-semibold" : bd.pulse >= 1 ? "text-amber-600" : ""}>{v.pulse ?? "—"}</td>
                  <td className={bd.systolicBp >= 3 ? "text-red-600 font-semibold" : bd.systolicBp >= 1 ? "text-amber-600" : ""}>{v.systolicBp ?? "—"}</td>
                  <td>{v.diastolicBp ?? "—"}</td>
                  <td className={bd.respiratoryRate >= 3 ? "text-red-600 font-semibold" : bd.respiratoryRate >= 1 ? "text-amber-600" : ""}>{v.respiratoryRate ?? "—"}</td>
                  <td className={bd.temperature >= 3 ? "text-red-600 font-semibold" : bd.temperature >= 1 ? "text-amber-600" : ""}>{v.temperature ?? "—"}</td>
                  <td className={bd.spo2 >= 3 ? "text-red-600 font-semibold" : bd.spo2 >= 1 ? "text-amber-600" : ""}>{v.spo2 ?? "—"}</td>
                  <td><span className={`text-xs font-semibold ${v.vhiStatus === "CRITICAL" ? "text-red-600" : v.vhiStatus === "WATCH" ? "text-amber-600" : "text-green-600"}`}>{v.vhiScore} {v.vhiStatus}</span></td>
                  <td className="text-xs text-[var(--cr-muted)]">{v.recordedByName}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={recordOpen} onClose={() => setRecordOpen(false)} title="Record Vitals">
        <form onSubmit={handleRecordVitals} className="px-6 py-5 flex flex-col gap-4">
          {vhiPreview ? (
            <div className={`p-3 rounded border ${
              vhiPreview.status === "CRITICAL" ? "border-red-300 bg-red-50" :
              vhiPreview.status === "WATCH" ? "border-amber-300 bg-amber-50" :
              "border-green-300 bg-green-50"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--cr-muted)]">Vitals Health Index</p>
                  <p className="text-xl font-bold text-[var(--cr-ink)]">{vhiPreview.total}</p>
                  <p className="text-xs text-[var(--cr-muted)]">{vhiGuide[vhiPreview.status]}</p>
                </div>
                <VhiBadge score={vhiPreview.total} status={vhiPreview.status} />
              </div>
              {vhiPreview.status === "CRITICAL" && (
                <div className="mt-2 flex items-start gap-2 text-xs text-red-700 bg-red-100 rounded p-2">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  This patient will be flagged as Critical. A supervisor alert will be sent.
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded border border-[var(--cr-line)] bg-[var(--cr-surface-2)] text-xs text-[var(--cr-muted)] text-center">
              Fill in vitals to see score
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Pulse (bpm)" type="number" value={vForm.pulse} onChange={(e) => setVForm((f) => ({ ...f, pulse: e.target.value }))} />
            <Input label="Systolic BP (mmHg)" type="number" value={vForm.systolicBp} onChange={(e) => setVForm((f) => ({ ...f, systolicBp: e.target.value }))} />
            <Input label="Diastolic BP (mmHg)" type="number" value={vForm.diastolicBp} onChange={(e) => setVForm((f) => ({ ...f, diastolicBp: e.target.value }))} hint="Stored for reference — not scored" />
            <Input label="Respiratory Rate (br/min)" type="number" value={vForm.respiratoryRate} onChange={(e) => setVForm((f) => ({ ...f, respiratoryRate: e.target.value }))} />
            <Input label="Temperature (°C)" type="number" step="0.1" value={vForm.temperature} onChange={(e) => setVForm((f) => ({ ...f, temperature: e.target.value }))} />
            <Input label="SpO₂ (%)" type="number" step="0.1" value={vForm.spo2} onChange={(e) => setVForm((f) => ({ ...f, spo2: e.target.value }))} hint="Oxygen Saturation" />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-[var(--cr-line)]">
            <Button type="button" variant="outline" onClick={() => setRecordOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="primary" loading={saving}>Save Vitals</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Main patient detail page ─────────────────────────────────────────────────

type Tab = "overview" | "notes" | "medications" | "vitals";

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const role = useAppSelector((s) => s.auth.role);
  const { data: patientData } = useGetPatientQuery(id ?? "");
  const [addNote] = useAddNoteMutation();
  const [confirmNote] = useConfirmNoteMutation();

  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const canWrite = role === "DOCTOR" || role === "NURSE";
  const isNurse = role === "NURSE";
  const noteTypes = isNurse ? NURSE_NOTE_TYPES : DOCTOR_NOTE_TYPES;

  const patient = patientData;
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Recording + Add Note modal state — lifted here so tab switches don't interrupt recording
  const [recording, setRecording] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [noteType, setNoteType] = useState<NoteType>(isNurse ? "HANDOVER_NOTE" : "WARD_ROUND_NOTE");
  const [noteContent, setNoteContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [prescriptionProcessingNotice, setPrescriptionProcessingNotice] = useState(false);

  function openAddNote(prefillContent?: string, prefillType?: NoteType) {
    setNoteContent(prefillContent ?? "");
    setNoteType(prefillType ?? (isNurse ? "HANDOVER_NOTE" : "WARD_ROUND_NOTE"));
    setAddOpen(true);
  }

  function handleRecordingDone(noteText: string) {
    setRecording(false);
    openAddNote(noteText, isNurse ? "HANDOVER_NOTE" : "WARD_ROUND_NOTE");
  }

  async function handleSaveNote() {
    if (!noteContent.trim() || !patient) return;

    if (noteType === "WARD_ROUND_NOTE" && !isNurse) {
      // Immediately write note into the cache so it appears at once
      dispatch(
        clinicalNotesApi.util.updateQueryData("getPatientNotes", patient.id, (draft) => {
          draft.push({
            id: `optimistic-${Date.now()}`,
            patientId: patient.id,
            hospitalId: user?.hospitalId ?? "",
            authorId: user?.id ?? "",
            noteType: "WARD_ROUND_NOTE",
            content: noteContent,
            isAiGenerated: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            authorName: user ? `${user.firstName} ${user.lastName}` : "You",
            authorRole: "DOCTOR",
          });
        })
      );

      // Fire and forget — AI prescription extraction runs in the background
      confirmNote({
        patientId: patient.id,
        noteType: "WARD_ROUND_NOTE",
        content: noteContent,
        isAiGenerated: false,
        extractPrescriptionsFromAi: true,
        prescriptions: [],
      });

      setPrescriptionProcessingNotice(true);
      setNoteContent("");
      setAddOpen(false);
      return;
    }

    setSaving(true);
    try {
      await addNote({ patientId: patient.id, noteType, content: noteContent }).unwrap();
      setNoteContent("");
      setAddOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (!patient) {
    return (
      <div className="p-8 text-center text-[var(--cr-muted)]">
        <p>Patient not found.</p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "notes", label: "Notes" },
    { key: "medications", label: "Medications" },
    { key: "vitals", label: "Vitals" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Fixed header */}
      <div className="bg-white border-b border-[var(--cr-line)] px-6 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-[var(--cr-muted)] hover:text-[var(--cr-ink)] transition-colors mb-3"
          >
            <ChevronLeft size={15} />
            Back
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-[var(--cr-ink)]">
                  {patient.firstName} {patient.lastName}
                </h1>
                <AcuityBadge color={patient.acuityColor} />
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-sm text-[var(--cr-muted)]">
                  {ageFromDob(patient.dateOfBirth)} yrs, {patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase()}
                </span>
                {patient.bedNumber && (
                  <span className="px-2 py-0.5 rounded text-xs bg-[var(--cr-surface-3)] text-[var(--cr-muted)]">
                    Bed {patient.bedNumber}
                  </span>
                )}
                <span className="text-xs text-[var(--cr-muted)]">
                  Admitted {timeAgo(patient.admissionDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
                  activeTab === key
                    ? "bg-[var(--cr-accent)] text-white"
                    : "text-[var(--cr-muted)] hover:text-[var(--cr-ink)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="max-w-4xl mx-auto">
          {activeTab === "overview" && <OverviewTab patientId={patient.id} />}
          {activeTab === "notes" && (
            <NotesTab
              patientId={patient.id}
              canWrite={canWrite}
              recording={recording}
              onAddNote={() => openAddNote()}
              onStartRecording={() => setRecording(true)}
              prescriptionNotice={prescriptionProcessingNotice}
              onDismissPrescriptionNotice={() => setPrescriptionProcessingNotice(false)}
            />
          )}
          {activeTab === "medications" && <MedicationsTab patientId={patient.id} canWrite={canWrite} />}
          {activeTab === "vitals" && <VitalsTab patientId={patient.id} canWrite={isNurse} />}
        </div>
      </div>

      {/* Recording card — rendered at page level so it persists across tab switches */}
      {recording && (
        <RecordingCard
          patientName={`${patient.firstName} ${patient.lastName}`}
          bedNumber={patient.bedNumber}
          isNurse={isNurse}
          patientId={patient.id}
          onCancel={() => setRecording(false)}
          onDone={handleRecordingDone}
        />
      )}

      {/* Add Note modal — also at page level, pre-filled after recording */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Note">
        <div className="px-6 py-5 flex flex-col gap-4">
          <Select
            label="Note Type"
            value={noteType}
            onChange={(e) => setNoteType(e.target.value as NoteType)}
            options={noteTypes}
          />
          <Textarea
            label="Note"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={10}
            placeholder={noteType === "WARD_ROUND_NOTE" ? "Subjective:\n\nObjective:\n\nAssessment:\n\nPlan:" : "Write your note here…"}
          />
          <div className="flex justify-end gap-3 pt-2 border-t border-[var(--cr-line)]">
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveNote} loading={saving}>Save Note</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
