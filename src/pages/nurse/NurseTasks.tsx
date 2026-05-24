import { useState } from "react";
import { ChevronDown, ChevronRight, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useGetMedicationTasksQuery, useCompleteTaskMutation } from "@/services/api/prescriptions";
import { useAppSelector } from "@/app/hooks";
import { ConfirmModal } from "@/components/ui/modal";
import { MOCK_TASKS } from "@/lib/mock-data";
import type { MedicationTaskEnriched } from "@/services/api/prescriptions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

type Group = "OVERDUE" | "DUE_SOON" | "UPCOMING" | "COMPLETED";

function groupTask(task: MedicationTaskEnriched): Group {
  if (task.status === "COMPLETED") return "COMPLETED";
  const now = new Date();
  const t = new Date(task.scheduledTime);
  if (task.status === "OVERDUE" || t < now) return "OVERDUE";
  const diff = (t.getTime() - now.getTime()) / 60000;
  if (diff <= 30) return "DUE_SOON";
  return "UPCOMING";
}

// ─── Task card ────────────────────────────────────────────────────────────────

function TaskCard({ task, group }: { task: MedicationTaskEnriched; group: Group }) {
  const [completeTask, { isLoading }] = useCompleteTaskMutation();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  async function handleConfirm() {
    setConfirming(false);
    setDone(true);
    try {
      await completeTask({ taskId: task.id });
    } catch {
      setDone(false);
    }
  }

  const borderColor =
    group === "OVERDUE" ? "border-l-red-500" :
    group === "DUE_SOON" ? "border-l-amber-400" :
    group === "COMPLETED" ? "border-l-green-500" :
    "border-l-[var(--cr-line)]";

  const isPending = group === "OVERDUE" || group === "DUE_SOON" || group === "UPCOMING";

  return (
    <>
      <div
        className={`flex items-center gap-3 bg-white border border-[var(--cr-line)] border-l-4 ${borderColor} rounded-lg px-4 py-3 ${
          done || group === "COMPLETED" ? "opacity-60" : ""
        }`}
      >
        {/* Patient + drug info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-[var(--cr-ink)]">
              {task.patientFirstName} {task.patientLastName}
            </span>
            {task.bedNumber && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-[var(--cr-surface-3)] text-[var(--cr-muted)]">
                Bed {task.bedNumber}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--cr-ink-2)] mt-0.5">
            {task.drugName} · {task.dose} · {task.route}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Clock size={12} className="text-[var(--cr-muted)]" />
            <span className="text-xs text-[var(--cr-muted)]">
              {fmtDate(task.scheduledTime)} at {fmtTime(task.scheduledTime)}
            </span>
            {group === "OVERDUE" && task.minutesOverdue !== undefined && (
              <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <AlertTriangle size={11} />
                {task.minutesOverdue}m overdue
              </span>
            )}
          </div>
          {group === "COMPLETED" && task.completedAt && (
            <p className="text-xs text-green-600 mt-0.5">
              Given at {fmtTime(task.completedAt)}
              {task.completedByName ? ` · ${task.completedByName}` : ""}
            </p>
          )}
        </div>

        {/* Action */}
        {isPending && !done && (
          <button
            onClick={() => setConfirming(true)}
            disabled={isLoading}
            className="shrink-0 px-3 py-1.5 rounded-lg border border-[var(--cr-accent)] text-[var(--cr-accent)] text-xs font-semibold hover:bg-[var(--cr-accent)] hover:text-white transition-colors disabled:opacity-40"
          >
            Mark Done
          </button>
        )}
        {(done || group === "COMPLETED") && (
          <CheckCircle2 size={20} className="text-green-500 shrink-0" />
        )}
      </div>

      <ConfirmModal
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleConfirm}
        title="Mark as administered?"
        body={
          <span>
            <strong>{task.drugName} {task.dose}</strong> for <strong>{task.patientFirstName} {task.patientLastName}</strong>
            {task.bedNumber ? ` (Bed ${task.bedNumber})` : ""}
            <br />
            <span className="text-[var(--cr-muted)]">Scheduled: {fmtDate(task.scheduledTime)} at {fmtTime(task.scheduledTime)}</span>
          </span>
        }
        confirmLabel="Confirm Administration"
        loading={isLoading}
      />
    </>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

const SECTION_META: Record<Group, { label: string; color: string; defaultOpen: boolean }> = {
  OVERDUE:   { label: "Overdue",  color: "text-red-600",              defaultOpen: true  },
  DUE_SOON:  { label: "Due Soon", color: "text-amber-600",            defaultOpen: true  },
  UPCOMING:  { label: "Upcoming", color: "text-[var(--cr-ink)]",      defaultOpen: true  },
  COMPLETED: { label: "Done",     color: "text-green-600",            defaultOpen: false },
};

function TaskSection({ group, tasks }: { group: Group; tasks: MedicationTaskEnriched[] }) {
  const meta = SECTION_META[group];
  const [open, setOpen] = useState(meta.defaultOpen);

  if (tasks.length === 0) return null;

  return (
    <div>
      <button
        className="flex items-center gap-2 w-full text-left py-2"
        onClick={() => setOpen((o) => !o)}
      >
        {open
          ? <ChevronDown size={16} className="text-[var(--cr-muted)]" />
          : <ChevronRight size={16} className="text-[var(--cr-muted)]" />}
        <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
        <span className="ml-1 px-2 py-0.5 rounded-full bg-[var(--cr-surface-3)] text-xs text-[var(--cr-muted)]">
          {tasks.length}
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-2 mb-4">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const GROUP_ORDER: Group[] = ["OVERDUE", "DUE_SOON", "UPCOMING", "COMPLETED"];

export default function NurseTasks() {
  const wardId = useAppSelector((s) => s.auth.user?.wardId);
  const { data: tasksData } = useGetMedicationTasksQuery({ wardId });

  // API returns pre-grouped tasks; fall back to mock data grouped client-side
  const grouped: Record<Group, MedicationTaskEnriched[]> = {
    OVERDUE:   tasksData?.overdue   ?? MOCK_TASKS.filter((t) => groupTask(t) === "OVERDUE"),
    DUE_SOON:  tasksData?.dueSoon   ?? MOCK_TASKS.filter((t) => groupTask(t) === "DUE_SOON"),
    UPCOMING:  tasksData?.upcoming  ?? MOCK_TASKS.filter((t) => groupTask(t) === "UPCOMING"),
    COMPLETED: tasksData ? [] : MOCK_TASKS.filter((t) => groupTask(t) === "COMPLETED"),
  };

  const pendingCount = grouped.OVERDUE.length + grouped.DUE_SOON.length;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[var(--cr-ink)]">My Tasks</h1>
        <p className="text-sm text-[var(--cr-muted)] mt-0.5">
          {pendingCount > 0
            ? `${pendingCount} task${pendingCount !== 1 ? "s" : ""} need${pendingCount === 1 ? "s" : ""} attention`
            : "All caught up"}
        </p>
      </div>

      {GROUP_ORDER.every((g) => grouped[g].length === 0) ? (
        <div className="text-center py-16 text-[var(--cr-muted)] text-sm">
          No tasks assigned to you.
        </div>
      ) : (
        GROUP_ORDER.map((g) => (
          <TaskSection key={g} group={g} tasks={grouped[g]} />
        ))
      )}
    </div>
  );
}
