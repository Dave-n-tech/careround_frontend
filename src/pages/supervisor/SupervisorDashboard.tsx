import { useNavigate } from "react-router-dom";
import { LogOut, AlertTriangle, Users, ClipboardCheck, Activity } from "lucide-react";
import { useAppDispatch } from "@/app/hooks";
import { clearAuth } from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/services/api";
import { useGetPatientsQuery } from "@/services/api/patients";
import { useGetMedicationTasksQuery } from "@/services/api/prescriptions";
import { MOCK_PATIENTS, MOCK_TASKS } from "@/lib/mock-data";
import type { Patient } from "@/types/domain";
import type { MedicationTaskEnriched } from "@/services/api/prescriptions";
import { AcuityStrip } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

function groupTaskStatus(task: MedicationTaskEnriched): "OVERDUE" | "PENDING" | "COMPLETED" {
  if (task.status === "COMPLETED") return "COMPLETED";
  const now = new Date();
  const t = new Date(task.scheduledTime);
  if (task.status === "OVERDUE" || t < now) return "OVERDUE";
  return "PENDING";
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white border border-[var(--cr-line)] rounded-lg p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-[var(--cr-ink)] leading-none">{value}</p>
        <p className="text-xs text-[var(--cr-muted)] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Patient grid card ────────────────────────────────────────────────────────

function PatientGridCard({ patient }: { patient: Patient }) {
  const acuityBg = {
    RED: "bg-red-50 border-red-200",
    AMBER: "bg-amber-50 border-amber-200",
    GREEN: "bg-white border-[var(--cr-line)]",
  }[patient.acuityColor];

  return (
    <div className={`relative flex overflow-hidden rounded-lg border ${acuityBg}`}>
      <AcuityStrip color={patient.acuityColor} />
      <div className="flex-1 px-3 py-2 min-w-0">
        <p className="text-sm font-semibold text-[var(--cr-ink)] truncate">
          {patient.firstName} {patient.lastName}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {patient.bedNumber && (
            <span className="text-xs text-[var(--cr-muted)]">Bed {patient.bedNumber}</span>
          )}
          {patient.primaryDiagnosis && (
            <span className="text-xs text-[var(--cr-ink-2)] truncate max-w-[160px]">
              {patient.primaryDiagnosis}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Overdue alert panel ──────────────────────────────────────────────────────

function OverdueAlertPanel({ tasks }: { tasks: MedicationTaskEnriched[] }) {
  const overdue = tasks.filter((t) => groupTaskStatus(t) === "OVERDUE");

  if (overdue.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-700 flex items-center gap-2">
        <ClipboardCheck size={16} />
        No overdue medication tasks.
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-red-200 flex items-center gap-2">
        <AlertTriangle size={16} className="text-red-600" />
        <span className="text-sm font-semibold text-red-700">
          {overdue.length} Overdue Task{overdue.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="divide-y divide-red-100 max-h-48 overflow-y-auto">
        {overdue.map((t) => (
          <div key={t.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--cr-ink)] truncate">
                {t.patientName}
                {t.bedNumber && (
                  <span className="ml-2 text-xs text-[var(--cr-muted)] font-normal">Bed {t.bedNumber}</span>
                )}
              </p>
              <p className="text-xs text-[var(--cr-ink-2)]">
                {t.drugName} {t.dose} {t.route}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-xs text-red-600 font-medium">Due {fmtTime(t.scheduledTime)}</span>
              {t.minutesOverdue !== undefined && (
                <p className="text-xs text-red-500">{t.minutesOverdue}m late</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hourly completion chart ──────────────────────────────────────────────────

function buildHourlyData(tasks: MedicationTaskEnriched[]) {
  const counts: Record<number, number> = {};
  for (const t of tasks) {
    if (t.status === "COMPLETED" && t.completedAt && isToday(t.completedAt)) {
      const h = new Date(t.completedAt).getHours();
      counts[h] = (counts[h] ?? 0) + 1;
    }
  }
  return Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, "0")}:00`,
    count: counts[h] ?? 0,
  }));
}

function HourlyChart({ tasks }: { tasks: MedicationTaskEnriched[] }) {
  const data = buildHourlyData(tasks);
  const currentHour = new Date().getHours();

  return (
    <div className="bg-white border border-[var(--cr-line)] rounded-lg p-4">
      <h3 className="text-sm font-semibold text-[var(--cr-ink)] mb-3">
        Medications Administered Today (by hour)
      </h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10, fill: "var(--cr-muted)" }}
            tickFormatter={(v: string) => v.split(":")[0]}
            interval={2}
          />
          <YAxis tick={{ fontSize: 10, fill: "var(--cr-muted)" }} allowDecimals={false} />
          <Tooltip
            formatter={(v) => [v, "Administered"]}
            labelFormatter={(l) => String(l)}
            contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid var(--cr-line)" }}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={
                  idx < currentHour
                    ? "var(--cr-accent)"
                    : idx === currentHour
                    ? "#0d9488"
                    : "#d1faf6"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function SupervisorDashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

  const { data: patientsData } = useGetPatientsQuery({}, { pollingInterval: 10_000 });
  const { data: tasksData } = useGetMedicationTasksQuery({}, { pollingInterval: 10_000 });

  const patients = (patientsData ?? MOCK_PATIENTS).filter((p) => p.status === "ADMITTED");
  const tasks = tasksData ?? MOCK_TASKS;

  // ── Derived stats ────────────────────────────────────────────────────────────
  const overdueCount = tasks.filter((t) => groupTaskStatus(t) === "OVERDUE").length;
  const atRiskCount = patients.filter((p) => p.acuityColor !== "GREEN").length;
  const completedTodayCount = tasks.filter(
    (t) => t.status === "COMPLETED" && t.completedAt && isToday(t.completedAt)
  ).length;

  async function handleLogout() {
    try { await logout().unwrap(); } catch { /* ignore */ }
    dispatch(clearAuth());
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[var(--cr-bg)]">
      {/* Header */}
      <header className="h-14 bg-white border-b border-[var(--cr-line)] flex items-center justify-between px-6 sticky top-0 z-10">
        <span className="font-display font-bold text-[var(--cr-ink)] text-sm">
          CareRound — Supervisor
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-[var(--cr-muted)] hover:text-[var(--cr-danger)] transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </header>

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Admitted Patients"
            value={patients.length}
            icon={Users}
            color="bg-[var(--cr-accent)]"
          />
          <StatCard
            label="Overdue Medications"
            value={overdueCount}
            icon={AlertTriangle}
            color={overdueCount > 0 ? "bg-red-500" : "bg-slate-400"}
          />
          <StatCard
            label="At-risk Patients"
            value={atRiskCount}
            icon={Activity}
            color={atRiskCount > 0 ? "bg-amber-500" : "bg-slate-400"}
          />
          <StatCard
            label="Completed Today"
            value={completedTodayCount}
            icon={ClipboardCheck}
            color="bg-green-500"
          />
        </div>

        {/* Overdue alerts */}
        <OverdueAlertPanel tasks={tasks} />

        {/* Hourly chart */}
        <HourlyChart tasks={tasks} />

        {/* Patient grid */}
        <div>
          <h2 className="text-sm font-semibold text-[var(--cr-ink)] mb-3 flex items-center gap-2">
            <Users size={16} />
            Admitted Patients ({patients.length})
          </h2>
          {patients.length === 0 ? (
            <p className="text-sm text-[var(--cr-muted)] py-4">No admitted patients.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...patients]
                .sort((a, b) => {
                  const o = { RED: 0, AMBER: 1, GREEN: 2 };
                  return o[a.acuityColor] - o[b.acuityColor];
                })
                .map((p) => (
                  <PatientGridCard key={p.id} patient={p} />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
