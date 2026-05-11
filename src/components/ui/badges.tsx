import type { AcuityLevel, Role, TaskPriority } from "@/types/domain";

export function AcuityBadge({ level }: { level: AcuityLevel }) {
  const map: Record<AcuityLevel, { bg: string; fg: string; label: string }> = {
    CRITICAL: { bg: "#fee2e2", fg: "#991b1b", label: "CRITICAL" },
    HIGH: { bg: "#ffedd5", fg: "#9a3412", label: "HIGH" },
    MEDIUM: { bg: "#fef3c7", fg: "#854d0e", label: "MEDIUM" },
    LOW: { bg: "#dcfce7", fg: "#166534", label: "LOW" }
  };
  const m = map[level] || map.LOW;
  return (
    <span className="chip" style={{ background: m.bg, color: m.fg }}>
      {m.label}
    </span>
  );
}

export function NEWSBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const s = Number(score);
  let bg = "#dcfce7";
  let fg = "#166534";
  let label = "LOW";
  if (s >= 7) {
    bg = "#fee2e2";
    fg = "#991b1b";
    label = "RED";
  } else if (s >= 5) {
    bg = "#fef3c7";
    fg = "#854d0e";
    label = "AMBER";
  }
  const sz = size === "lg" ? "w-12 h-12 text-2xl" : size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-base";
  return (
    <div className="inline-flex items-center gap-1.5">
      <div className={`${sz} rounded font-semibold flex items-center justify-center mono`} style={{ background: bg, color: fg }}>
        {s}
      </div>
      {size !== "sm" && (
        <span className="text-[10px] font-semibold tracking-wider" style={{ color: fg }}>
          {label}
        </span>
      )}
    </div>
  );
}

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    ADMITTED: { bg: "#dbeafe", fg: "#1e40af" },
    STABLE: { bg: "#e0f2fe", fg: "#075985" },
    DETERIORATING: { bg: "#fee2e2", fg: "#991b1b" },
    DISCHARGE_READY: { bg: "#dcfce7", fg: "#166534" },
    DISCHARGED: { bg: "#e2e8f0", fg: "#475569" },
    ACTIVE: { bg: "#dcfce7", fg: "#166534" },
    PENDING_ASSIGNMENT: { bg: "#fef3c7", fg: "#854d0e" },
    COMPLETED: { bg: "#e2e8f0", fg: "#475569" },
    HANDED_OVER: { bg: "#e0e7ff", fg: "#3730a3" },
    PENDING: { bg: "#fef3c7", fg: "#854d0e" },
    IN_PROGRESS: { bg: "#dbeafe", fg: "#1e40af" },
    OPEN: { bg: "#fee2e2", fg: "#991b1b" },
    ACKNOWLEDGED: { bg: "#fef3c7", fg: "#854d0e" },
    RESOLVED: { bg: "#dcfce7", fg: "#166534" },
    SCHEDULED: { bg: "#e0e7ff", fg: "#3730a3" }
  };
  const m = map[status] || { bg: "#e2e8f0", fg: "#475569" };
  return (
    <span className="chip" style={{ background: m.bg, color: m.fg }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function PriorityChip({ priority }: { priority: TaskPriority }) {
  const map: Record<TaskPriority, { bg: string; fg: string }> = {
    ROUTINE: { bg: "#e2e8f0", fg: "#475569" },
    URGENT: { bg: "#fef3c7", fg: "#854d0e" },
    EMERGENCY: { bg: "#fee2e2", fg: "#991b1b" }
  };
  const m = map[priority] || map.ROUTINE;
  return (
    <span className="chip" style={{ background: m.bg, color: m.fg }}>
      {priority}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  const map: Record<Role, string> = {
    ADMIN: "#475569",
    CONSULTANT: "#0b5cab",
    REGISTRAR: "#0e7490",
    JUNIOR_DOCTOR: "#7c3aed",
    NURSE: "#be185d",
    WARD_SUPERVISOR: "#15803d"
  };
  return (
    <span
      className="chip"
      style={{ background: "#fff", color: map[role], border: `1px solid ${map[role]}40` }}
    >
      {role.replace(/_/g, " ")}
    </span>
  );
}
