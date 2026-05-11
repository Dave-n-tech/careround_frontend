import { useState } from "react";
import { PageHeader } from "@/layouts/PageHeader";
import { BarChart } from "@/components/ui/charts";
import { StatusChip } from "@/components/ui";

export default function Reports() {
  const [tab, setTab] = useState("completion");

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" subtitle="Soyinka Ward · last 30 days" />
      <div className="flex gap-2">
        {[
          ["completion", "Task completion"],
          ["overdue", "Overdue tasks"],
          ["rounds", "Round history"],
          ["flow", "Patient flow"]
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`btn ${tab === k ? "btn-primary" : ""}`}>{l}</button>
        ))}
      </div>
      <div className="panel rounded p-5">
        {tab === "completion" && (
          <BarChart
            title="Task completion rate by day"
            labels={["Apr 28", "29", "30", "May 1", "2", "3", "4", "5", "6"]}
            values={[88, 91, 87, 93, 89, 84, 90, 92, 89]}
            unit="%"
          />
        )}
        {tab === "overdue" && (
          <BarChart
            title="Overdue task count by day"
            labels={["Apr 28", "29", "30", "May 1", "2", "3", "4", "5", "6"]}
            values={[3, 2, 5, 1, 4, 7, 3, 2, 1]}
          />
        )}
        {tab === "rounds" && <RoundHistoryTable />}
        {tab === "flow" && (
          <BarChart
            title="Admissions vs discharges"
            labels={["Apr 28", "29", "30", "May 1", "2", "3", "4", "5", "6"]}
            values={[6, 8, 7, 9, 5, 8, 6, 7, 9]}
            values2={[4, 7, 6, 5, 8, 6, 7, 5, 8]}
          />
        )}
      </div>
    </div>
  );
}

export function RoundHistoryTable() {
  const rows = [
    { date: "2026-05-06", type: "MORNING", lead: "Prof. Adaeze Okafor", patients: 7, dur: "1h 12m", status: "IN_PROGRESS" },
    { date: "2026-05-05", type: "EVENING", lead: "Dr. Chinedu Eze", patients: 6, dur: "42m", status: "COMPLETED" },
    { date: "2026-05-05", type: "MORNING", lead: "Prof. Adaeze Okafor", patients: 7, dur: "1h 18m", status: "COMPLETED" },
    { date: "2026-05-04", type: "POST_TAKE", lead: "Dr. Folake Adebayo", patients: 3, dur: "25m", status: "COMPLETED" },
    { date: "2026-05-04", type: "BOARD", lead: "Prof. Adaeze Okafor", patients: 7, dur: "18m", status: "COMPLETED" },
    { date: "2026-05-03", type: "WEEKEND", lead: "Dr. Chinedu Eze", patients: 14, dur: "2h 4m", status: "COMPLETED" }
  ];
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
        {rows.map((r, i) => (
          <tr key={i}>
            <td className="mono text-xs">{r.date}</td>
            <td><span className="chip" style={{ background: "#dbeafe", color: "#1e40af" }}>{r.type}</span></td>
            <td>{r.lead}</td>
            <td className="mono">{r.patients}</td>
            <td className="mono">{r.dur}</td>
            <td><StatusChip status={r.status} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
