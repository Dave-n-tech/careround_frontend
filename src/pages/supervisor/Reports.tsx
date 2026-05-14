import { useMemo, useState } from "react";
import { PageHeader } from "@/layouts/PageHeader";
import { BarChart } from "@/components/ui/charts";
import { StatusChip } from "@/components/ui";
import {
  useGetOverdueTasksReportQuery,
  useGetPatientFlowReportQuery,
  useGetRoundHistoryReportQuery,
  useGetTaskCompletionReportQuery,
  useGetUsersQuery
} from "@/services/api";
import type { ChartSeries, RoundHistoryItem } from "@/services/api";
import { useCurrentWardId } from "@/features/ward/currentWard";
import { getUser, userFullName } from "@/utils/format";

export default function Reports({ allWards = false }: { allWards?: boolean }) {
  const [tab, setTab] = useState("completion");
  const wardId = useCurrentWardId();
  const range = useMemo(() => {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 30);
    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10)
    };
  }, []);
  const query = { wardId: allWards ? undefined : wardId, ...range };

  const { data: completion, isLoading: loadingCompletion } = useGetTaskCompletionReportQuery(query);
  const { data: overdue, isLoading: loadingOverdue } = useGetOverdueTasksReportQuery(query);
  const { data: flow, isLoading: loadingFlow } = useGetPatientFlowReportQuery(query);
  const { data: rounds = [], isLoading: loadingRounds } = useGetRoundHistoryReportQuery(query);

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" subtitle={`Last 30 days - ${allWards ? "all wards" : "current ward"} - ${range.from} to ${range.to}`} />
      <div className="flex flex-wrap gap-2">
        {[
          ["completion", "Task completion"],
          ["overdue", "Overdue tasks"],
          ["rounds", "Round history"],
          ["flow", "Patient flow"]
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`btn ${tab === k ? "btn-primary" : ""}`}>{l}</button>
        ))}
      </div>
      <div className="panel rounded p-4 sm:p-5">
        {tab === "completion" && <ReportChart loading={loadingCompletion} series={completion} title="Completed care tasks by day" />}
        {tab === "overdue" && <ReportChart loading={loadingOverdue} series={overdue} title="Overdue task count by day" />}
        {tab === "rounds" && <RoundHistoryTable rows={rounds} loading={loadingRounds} />}
        {tab === "flow" && <ReportChart loading={loadingFlow} series={flow} title="Admissions by day" />}
      </div>
    </div>
  );
}

function ReportChart({ loading, series, title }: { loading: boolean; series?: ChartSeries; title: string }) {
  if (loading) return <div className="p-6 text-center ink-mute">Loading report...</div>;
  if (!series || series.labels.length === 0) return <div className="p-6 text-center ink-mute">No report data for this range.</div>;
  return <BarChart title={title} labels={series.labels} values={series.values} />;
}

export function RoundHistoryTable({ rows, loading }: { rows: RoundHistoryItem[]; loading: boolean }) {
  const { data: users = [] } = useGetUsersQuery();
  if (loading) return <div className="p-6 text-center ink-mute">Loading rounds...</div>;
  if (rows.length === 0) return <div className="p-6 text-center ink-mute">No rounds in this range.</div>;
  return (
    <table className="cr">
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Lead</th>
          <th>Patients</th>
          <th>Duration</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const lead = r.leadDoctorId ? getUser(users, r.leadDoctorId) : undefined;
          const date = (r.startedAt || r.scheduledTime || r.completedAt || "").slice(0, 10) || "-";
          const duration = r.durationMinutes == null ? "-" : `${r.durationMinutes}m`;
          return (
            <tr key={r.id}>
              <td className="mono text-xs">{date}</td>
              <td><span className="chip" style={{ background: "#dbeafe", color: "#1e40af" }}>{r.roundType}</span></td>
              <td>{lead ? userFullName(lead) : r.leadDoctorId || "-"}</td>
              <td className="mono">{r.patientCount}</td>
              <td className="mono">{duration}</td>
              <td><StatusChip status={r.status} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

