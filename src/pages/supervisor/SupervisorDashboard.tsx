import { useEffect } from "react";
import { EscalationCard, Icons, NEWSBadge, StatusChip } from "@/components/ui";
import { Donut } from "@/components/ui/charts";
import { PageHeader } from "@/layouts/PageHeader";
import {
  useCurrentWardCareTasks,
  useCurrentWardEscalations,
  useCurrentWardPatients,
  useCurrentWardRounds,
  useCurrentWardShift,
  useGetUsersQuery,
  useGetWardsQuery
} from "@/services/api";
import { useCurrentWardId } from "@/features/ward/currentWard";
import { getUser, patientFullName } from "@/utils/format";

const POLL_MS = 30_000;

export default function SupervisorDashboard() {
  const wardId = useCurrentWardId();
  const { data: wards = [] } = useGetWardsQuery();
  const ward = wards.find((w) => w.id === wardId);

  const { data: patients = [], refetch: refetchPatients } = useCurrentWardPatients();
  const { data: tasks = [], refetch: refetchTasks } = useCurrentWardCareTasks();
  const { data: escalations = [], refetch: refetchEsc } = useCurrentWardEscalations();
  const { data: currentShift, refetch: refetchShift } = useCurrentWardShift();
  const { data: rounds = [], refetch: refetchRounds } = useCurrentWardRounds();
  const { data: users = [] } = useGetUsersQuery();

  function refetchAll() {
    refetchPatients();
    refetchTasks();
    refetchEsc();
    refetchShift();
    refetchRounds();
  }

  useEffect(() => {
    const id = setInterval(refetchAll, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ward) {
    return <div className="panel rounded p-12 text-center ink-mute">No ward assigned.</div>;
  }

  const nowIso = new Date().toISOString();
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const overdue = tasks.filter((t) => t.status !== "COMPLETED" && t.windowEnd < nowIso).length;
  const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const totalBeds = ward.totalBeds;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{ward.name}</h1>
          <p className="ink-mute text-sm">{ward.specialty || "—"} · auto-refresh {POLL_MS / 1000}s</p>
        </div>
        <button className="btn" onClick={refetchAll}><Icons.refresh size={14} />Refresh now</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="panel rounded p-4">
          <div className="field-label">Total beds</div>
          <div className="text-3xl font-semibold mt-1">{totalBeds}</div>
          <div className="text-xs ink-mute mt-1">{patients.length} patients admitted</div>
        </div>
        <div className="panel rounded p-4">
          <div className="field-label">Task completion</div>
          <div className="flex items-center gap-3 mt-1">
            <Donut pct={completionRate} />
            <div>
              <div className="text-2xl font-semibold">{completionRate}%</div>
              <div className="text-xs ink-mute">{completed}/{tasks.length} today</div>
            </div>
          </div>
        </div>
        <div className="panel rounded p-4">
          <div className="field-label">Overdue tasks</div>
          <div className="text-3xl font-semibold mt-1" style={{ color: overdue > 0 ? "#b91c1c" : "#15803d" }}>{overdue}</div>
          <div className="text-xs ink-mute mt-1">{overdue > 0 ? "Requires action" : "All on track"}</div>
        </div>
        <div className="panel rounded p-4">
          <div className="field-label">Open escalations</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-semibold" style={{ color: "#b91c1c" }}>{escalations.filter((e) => e.severity === "RED" && e.status !== "RESOLVED").length}</span>
            <span className="text-xs">RED</span>
            <span className="text-3xl font-semibold ml-3" style={{ color: "#b45309" }}>{escalations.filter((e) => e.severity === "AMBER" && e.status !== "RESOLVED").length}</span>
            <span className="text-xs">AMBER</span>
          </div>
          <div className="text-xs ink-mute mt-1">{escalations.filter((e) => e.status === "OPEN").length} unacknowledged</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel rounded col-span-2">
          <div className="px-4 py-3 border-b hairline flex items-center justify-between">
            <div className="font-semibold text-sm">Active patients · by acuity</div>
          </div>
          <table className="cr">
            <thead>
              <tr>
                <th>Bed</th>
                <th>Patient</th>
                <th>NEWS</th>
                <th>Status</th>
                <th>Open tasks</th>
              </tr>
            </thead>
            <tbody>
              {patients.slice(0, 8).map((p) => {
                const open = tasks.filter((t) => t.patientId === p.id && t.status !== "COMPLETED").length;
                return (
                  <tr key={p.id}>
                    <td className="mono text-xs">{p.bedNumber || "—"}</td>
                    <td className="font-medium">{patientFullName(p)}</td>
                    <td><NEWSBadge score={p.newsScore} size="sm" /></td>
                    <td><StatusChip status={p.status} /></td>
                    <td><span className="mono">{open}</span></td>
                  </tr>
                );
              })}
              {patients.length === 0 && (
                <tr><td colSpan={5} className="text-center ink-mute p-6">No patients on this ward.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="panel rounded p-4">
            <div className="field-label mb-2">Current shift</div>
            <div className="font-semibold">{currentShift?.type || "—"} Shift</div>
            <div className="text-xs ink-mute mb-2">{currentShift?.status || "—"}</div>
            <div className="space-y-2 mt-3 pt-3 border-t hairline">
              <div className="flex justify-between text-sm">
                <span className="ink-mute">Lead doctor</span>
                <span className="font-medium">
                  {currentShift?.leadDoctorId ? getUser(users, currentShift.leadDoctorId)?.firstName || "—" : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="ink-mute">Nurse in charge</span>
                <span className="font-medium">
                  {currentShift?.nurseInChargeId ? getUser(users, currentShift.nurseInChargeId)?.firstName || "—" : "—"}
                </span>
              </div>
            </div>
          </div>
          <div className="panel rounded p-4">
            <div className="field-label mb-2">Active rounds</div>
            {rounds.filter((r) => r.status === "IN_PROGRESS").length === 0 ? (
              <div className="text-xs ink-mute">No active rounds.</div>
            ) : (
              rounds.filter((r) => r.status === "IN_PROGRESS").map((r) => (
                <div key={r.id} className="text-sm">
                  <div className="font-medium">{r.roundType} round</div>
                  <div className="text-xs ink-mute">Led by {getUser(users, r.leadDoctorId)?.firstName || "—"}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="panel rounded">
        <div className="px-4 py-3 border-b hairline font-semibold text-sm">Open escalations</div>
        <div className="p-3 space-y-2">
          {escalations.filter((e) => e.status !== "RESOLVED").length === 0 ? (
            <div className="text-center ink-mute p-4 text-sm">No open escalations.</div>
          ) : (
            escalations.filter((e) => e.status !== "RESOLVED").map((e) => (
              <EscalationCard
                key={e.id}
                esc={e}
                patient={patients.find((p) => p.id === e.patientId)}
                wardName={ward.name}
                assigneeName={e.assignedToId ? getUser(users, e.assignedToId)?.firstName : undefined}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
