import type { CareTask, Escalation, Patient } from "@/types/domain";
import { AcuityBadge, NEWSBadge, PriorityChip, StatusChip } from "./badges";
import { Icons } from "./icons";
import { currentTimeStr } from "@/utils/time";

export function PatientRow({
  patient,
  onClick,
  reviewed = false,
  current = false
}: {
  patient: Patient;
  onClick?: () => void;
  reviewed?: boolean;
  current?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 row-hover cursor-pointer border-b hairline ${
        current ? "bg-blue-50" : ""
      }`}
      onClick={onClick}
    >
      <div className="w-7 flex-shrink-0">
        {reviewed ? (
          <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white">
            <Icons.check size={12} stroke={3} />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
        )}
      </div>
      <div className="w-16 mono text-xs text-slate-500">{patient.bedNumber}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold truncate">{patient.lastName.toUpperCase()}, {patient.firstName}</div>
        <div className="text-xs ink-mute truncate">{patient.gender} · {patient.primaryDiagnosis}</div>
      </div>
      <AcuityBadge level={patient.acuityLevel} />
      <NEWSBadge score={patient.newsScore} size="sm" />
      <StatusChip status={patient.status} />
      <Icons.chevron size={14} className="text-slate-400" />
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent = "#0b5cab",
  icon
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="panel rounded p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="field-label">{label}</span>
        {icon && <span style={{ color: accent }}>{icon}</span>}
      </div>
      <div className="text-3xl font-semibold tracking-tight" style={{ color: accent }}>
        {value}
      </div>
      {sub && <div className="text-xs ink-mute">{sub}</div>}
    </div>
  );
}

export function EscalationCard({
  esc,
  patient,
  wardName,
  assigneeName,
  onAck,
  onResolve
}: {
  esc: Escalation;
  patient: Patient | undefined;
  wardName?: string;
  assigneeName?: string;
  onAck?: (id: string) => void;
  onResolve?: (id: string) => void;
}) {
  const isRed = esc.severity === "RED";
  const triggerLabel = {
    HIGH_NEWS_SCORE: "High NEWS score",
    TASK_OVERDUE: "Task overdue",
    NURSE_CONCERN: "Nurse concern",
    DETERIORATION: "Patient deterioration"
  }[esc.triggerType];
  const sevColor = isRed ? "#b91c1c" : "#b45309";
  const sevBg = isRed ? "#fef2f2" : "#fffbeb";
  return (
    <div
      className={`rounded border-l-4 ${isRed ? "pulse-red" : ""}`}
      style={{
        borderColor: sevColor,
        background: sevBg,
        borderTop: "1px solid var(--cr-line)",
        borderRight: "1px solid var(--cr-line)",
        borderBottom: "1px solid var(--cr-line)"
      }}
    >
      <div className="p-3.5 flex items-start gap-3">
        <div className="flex-shrink-0">
          <span className="chip" style={{ background: sevColor, color: "#fff" }}>
            {esc.severity}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[14px]">
              {patient ? `${patient.lastName.toUpperCase()}, ${patient.firstName}` : "Unknown patient"}
            </span>
            {patient && (
              <span className="text-xs ink-mute">
                · {wardName || "Ward"} · Bed {patient.bedNumber}
              </span>
            )}
          </div>
          <div className="text-[12.5px] ink-2 mt-0.5">
            <span className="font-medium">{triggerLabel}</span>
            <span className="ink-mute"> — {esc.notes}</span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-[11px] ink-mute">
            <span>Raised {esc.createdAt}</span>
            <span>·</span>
            <span>To: {assigneeName || "On-call"}</span>
            <span>·</span>
            <StatusChip status={esc.status} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          {esc.status === "OPEN" && (
            <button className="btn" onClick={() => onAck?.(esc.id)}>
              Acknowledge
            </button>
          )}
          {esc.status !== "RESOLVED" && (
            <button className="btn btn-primary" onClick={() => onResolve?.(esc.id)}>
              Resolve
            </button>
          )}
          {esc.status === "RESOLVED" && <span className="text-xs ink-mute">Resolved</span>}
        </div>
      </div>
    </div>
  );
}

export function TaskCard({
  task,
  patientName,
  bed,
  onAdvance
}: {
  task: CareTask;
  patientName?: string;
  bed?: string;
  onAdvance?: (taskId: string) => void;
}) {
  const overdue = task.status !== "COMPLETED" && task.windowEnd < currentTimeStr();
  const next = task.status === "PENDING" ? "Start" : task.status === "IN_PROGRESS" ? "Complete" : null;
  return (
    <div className={`panel rounded p-3 flex items-center gap-3 ${overdue ? "border-l-4 border-l-red-600" : ""}`}>
      <div className="flex-shrink-0">
        <PriorityChip priority={task.priority} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold truncate">{task.title}</div>
        <div className="text-xs ink-mute truncate">
          {patientName && (
            <>
              {patientName}{bed ? ` · Bed ${bed}` : ""} ·
            </>
          )}
          <span className="mono">{task.windowStart}–{task.windowEnd}</span>
          {overdue && <span className="text-red-700 font-semibold ml-2">OVERDUE</span>}
        </div>
      </div>
      <StatusChip status={task.status} />
      {next && (
        <button className="btn btn-primary" onClick={() => onAdvance?.(task.id)}>
          {next}
        </button>
      )}
    </div>
  );
}
