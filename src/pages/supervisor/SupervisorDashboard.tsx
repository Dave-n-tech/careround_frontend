import { EscalationCard, Icons, NEWSBadge, StatusChip } from "@/components/ui";
import { Donut } from "@/components/ui/charts";
import { PageHeader } from "@/layouts/PageHeader";
import {
  useGetCareTasksQuery,
  useGetEscalationsQuery,
  useGetPatientsQuery,
  useGetRoundsQuery,
  useGetShiftsQuery,
  useGetUsersQuery,
  useGetWardsQuery
} from "@/services/api";
import { getUser, getWard, patientFullName } from "@/utils/format";

export default function SupervisorDashboard() {
  const { data: wards = [] } = useGetWardsQuery();
  const { data: patients = [] } = useGetPatientsQuery();
  const { data: tasks = [] } = useGetCareTasksQuery();
  const { data: escalations = [] } = useGetEscalationsQuery();
  const { data: shifts = [] } = useGetShiftsQuery();
  const { data: rounds = [] } = useGetRoundsQuery();
  const { data: users = [] } = useGetUsersQuery();

  const ward = wards[0];
  if (!ward) return null;

  const wardPatients = patients.filter((p) => p.wardId === ward.id);
  const wardTasks = tasks.filter((t) => wardPatients.some((p) => p.id === t.patientId));
  const wardEsc = escalations.filter((e) => wardPatients.some((p) => p.id === e.patientId));
  const completed = wardTasks.filter((t) => t.status === "COMPLETED").length;
  const overdue = wardTasks.filter((t) => t.status !== "COMPLETED" && t.windowEnd < "08:30").length;
  const completionRate = wardTasks.length ? Math.round((completed / wardTasks.length) * 100) : 0;
  const occupancy = Math.round((ward.occupied / ward.beds) * 100);
  const activeShift = shifts.find((s) => s.wardId === ward.id && s.status === "ACTIVE");

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{ward.name}</h1>
          <p className="ink-mute text-sm">{getWard(wards, ward.id)?.specialty} · 6 May 2026 · auto-refresh 30s · last updated 8s ago</p>
        </div>
        <button className="btn"><Icons.refresh size={14} />Refresh now</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="panel rounded p-4">
          <div className="field-label">Bed occupancy</div>
          <div className="text-3xl font-semibold mt-1">{ward.occupied}<span className="text-base ink-mute font-normal">/{ward.beds}</span></div>
          <div className="h-2 rounded bg-slate-100 mt-2 overflow-hidden">
            <div className="h-full" style={{ width: `${occupancy}%`, background: occupancy > 85 ? "#b91c1c" : "#15803d" }} />
          </div>
          <div className="text-xs ink-mute mt-1">{occupancy}% occupancy · {ward.beds - ward.occupied} free</div>
        </div>
        <div className="panel rounded p-4">
          <div className="field-label">Task completion</div>
          <div className="flex items-center gap-3 mt-1">
            <Donut pct={completionRate} />
            <div>
              <div className="text-2xl font-semibold">{completionRate}%</div>
              <div className="text-xs ink-mute">{completed}/{wardTasks.length} today</div>
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
            <span className="text-3xl font-semibold" style={{ color: "#b91c1c" }}>{wardEsc.filter((e) => e.severity === "RED").length}</span>
            <span className="text-xs">RED</span>
            <span className="text-3xl font-semibold ml-3" style={{ color: "#b45309" }}>{wardEsc.filter((e) => e.severity === "AMBER").length}</span>
            <span className="text-xs">AMBER</span>
          </div>
          <div className="text-xs ink-mute mt-1">{wardEsc.filter((e) => e.status === "OPEN").length} unacknowledged</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel rounded col-span-2">
          <div className="px-4 py-3 border-b hairline flex items-center justify-between">
            <div className="font-semibold text-sm">Active patients · by acuity</div>
            <button className="btn btn-ghost text-xs">View all</button>
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
              {wardPatients.slice(0, 6).map((p) => {
                const open = tasks.filter((t) => t.patientId === p.id && t.status !== "COMPLETED").length;
                return (
                  <tr key={p.id}>
                    <td className="mono text-xs">{p.bed}</td>
                    <td className="font-medium">{patientFullName(p)}</td>
                    <td><NEWSBadge score={p.news} size="sm" /></td>
                    <td><StatusChip status={p.status} /></td>
                    <td><span className="mono">{open}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="panel rounded p-4">
            <div className="field-label mb-2">Current shift</div>
            <div className="font-semibold">{activeShift?.name || "-"}</div>
            <div className="text-xs ink-mute mb-2">Started 07:00 · 1h elapsed</div>
            <div className="space-y-2 mt-3 pt-3 border-t hairline">
              <div className="flex justify-between text-sm">
                <span className="ink-mute">Lead doctor</span>
                <span className="font-medium">{activeShift?.leadDoctorId ? getUser(users, activeShift.leadDoctorId)?.firstName : "-"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="ink-mute">Nurse in charge</span>
                <span className="font-medium">{activeShift?.nurseInChargeId ? getUser(users, activeShift.nurseInChargeId)?.firstName : "-"}</span>
              </div>
            </div>
          </div>
          <div className="panel rounded p-4">
            <div className="field-label mb-2">Active rounds</div>
            {rounds.filter((r) => r.status === "IN_PROGRESS").map((r) => (
              <div key={r.id} className="text-sm">
                <div className="font-medium">{r.type} round</div>
                <div className="text-xs ink-mute">Led by {getUser(users, r.leadId)?.firstName}</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-600" style={{ width: `${(r.reviewed.length / r.queue.length) * 100}%` }} />
                  </div>
                  <span className="mono text-xs">{r.reviewed.length}/{r.queue.length}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel rounded">
        <div className="px-4 py-3 border-b hairline font-semibold text-sm">Open escalations</div>
        <div className="p-3 space-y-2">
          {wardEsc.filter((e) => e.status !== "RESOLVED").map((e) => (
            <EscalationCard
              key={e.id}
              esc={e}
              patient={wardPatients.find((p) => p.id === e.patientId)}
              wardName={ward.name}
              assigneeName={getUser(users, e.assigneeId)?.firstName}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
