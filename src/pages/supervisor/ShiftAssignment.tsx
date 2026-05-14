import { useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { Field, StatusChip } from "@/components/ui";
import { PageHeader } from "@/layouts/PageHeader";
import { useAssignShiftMutation, useGetShiftsQuery, useGetUsersQuery, useGetWardsQuery } from "@/services/api";
import { useCurrentWardId } from "@/features/ward/currentWard";
import { getUser, getWard, userFullName } from "@/utils/format";
import { useToast } from "@/components/ui/Toast";

export default function ShiftAssignment() {
  const toast = useToast();
  const wardId = useCurrentWardId();
  const now = new Date();
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  const to = new Date(now);
  to.setDate(to.getDate() + 2);
  to.setHours(23, 59, 59, 999);
  const { data: shifts = [] } = useGetShiftsQuery(
    wardId ? { wardId, from: from.toISOString(), to: to.toISOString() } : skipToken
  );
  const { data: wards = [] } = useGetWardsQuery();
  const { data: users = [], isLoading: isLoadingUsers } = useGetUsersQuery();
  const [assignShift, { isLoading: isAssigning }] = useAssignShiftMutation();
  const [assignments, setAssignments] = useState<Record<string, { lead?: string; nurse?: string }>>({});

  const pending = shifts.filter((s) => s.status === "PENDING_ASSIGNMENT");
  const active = shifts.filter((s) => s.status === "ACTIVE");

  if (!wardId) {
    return <div className="panel rounded p-6 text-center ink-mute sm:p-12">No ward assigned.</div>;
  }

  function assign(shiftId: string, key: "lead" | "nurse", val: string) {
    setAssignments({ ...assignments, [shiftId]: { ...(assignments[shiftId] || {}), [key]: val } });
  }

  async function activate(shiftId: string) {
    const a = assignments[shiftId];
    if (!a?.lead || !a?.nurse) {
      toast({ kind: "error", title: "Assign both lead doctor and nurse in charge" });
      return;
    }
    await assignShift({ id: shiftId, leadDoctorId: a.lead, nurseInChargeId: a.nurse }).unwrap();
    toast({ kind: "success", title: "Shift activated", body: "Lead and nurse in charge notified" });
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Shift assignment" subtitle={`${pending.length} shifts awaiting assignment · ${active.length} active`} />

      <div className="panel rounded">
        <div className="px-4 py-3 border-b hairline flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="font-semibold text-sm">Pending assignment</div>
          <span className="text-xs ink-mute">Auto-generated · Today + tomorrow</span>
        </div>
        <div className="divide-y hairline">
          {pending.map((s) => {
            const w = getWard(wards, s.wardId);
            const a = assignments[s.id] || {};
            const docs = users.filter((u) => ["REGISTRAR", "CONSULTANT", "JUNIOR_DOCTOR"].includes(u.role));
            const nurses = users.filter((u) => u.role === "NURSE");
            return (
              <div key={s.id} className="p-4 grid grid-cols-1 lg:grid-cols-[1fr_220px_220px_140px] gap-4 items-center">
                <div>
                  <div className="font-semibold text-sm">{s.type} Shift</div>
                  <div className="text-xs ink-mute">{w?.name} · {s.startTime?.slice(0, 10)}</div>
                  <div className="mt-1.5"><StatusChip status={s.status} /></div>
                </div>
                <Field label="Lead doctor">
                  <select className="select" value={a.lead || ""} onChange={(e) => assign(s.id, "lead", e.target.value)}>
                    <option value="">Select...</option>
                    {isLoadingUsers ? (
                      <option disabled>Loading…</option>
                    ) : docs.length === 0 ? (
                      <option disabled>No doctors available</option>
                    ) : docs.map((u) => (
                      <option key={u.id} value={u.id}>{userFullName(u)} - {u.role}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Nurse in charge">
                  <select className="select" value={a.nurse || ""} onChange={(e) => assign(s.id, "nurse", e.target.value)}>
                    <option value="">Select...</option>
                    {isLoadingUsers ? (
                      <option disabled>Loading…</option>
                    ) : nurses.length === 0 ? (
                      <option disabled>No nurses available</option>
                    ) : nurses.map((u) => (
                      <option key={u.id} value={u.id}>{userFullName(u)}</option>
                    ))}
                  </select>
                </Field>
                <button className="btn btn-primary justify-center" disabled={!a.lead || !a.nurse || isAssigning} onClick={() => activate(s.id)}>
                  {isAssigning ? "Activating..." : "Activate shift"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel rounded">
        <div className="px-4 py-3 border-b hairline font-semibold text-sm">Active shifts</div>
        <table className="cr">
          <thead>
            <tr>
              <th>Shift</th>
              <th>Ward</th>
              <th>Lead</th>
              <th>Nurse in charge</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {active.map((s) => (
              <tr key={s.id}>
                <td className="font-medium">{s.type} Shift</td>
                <td>{getWard(wards, s.wardId)?.name}</td>
                <td>{getUser(users, s.leadDoctorId || "")?.firstName}</td>
                <td>{getUser(users, s.nurseInChargeId || "")?.firstName}</td>
                <td><StatusChip status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
