import { Field, RoleBadge, useToast } from "@/components/ui";
import { PageHeader } from "@/layouts/PageHeader";
import { useChangePasswordMutation, useGetDashboardMeQuery, useGetMeQuery, useGetDepartmentsQuery } from "@/services/api";
import { getDept } from "@/utils/format";
import { useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";

export default function ProfilePage() {
  const toast = useToast();
  const { data: me, isLoading } = useGetMeQuery();
  const isAdmin = me?.role === "ADMIN";
  const { data: dashboardMe, isLoading: isLoadingDashboard } = useGetDashboardMeQuery(isAdmin ? undefined : skipToken);
  const { data: departments = [] } = useGetDepartmentsQuery();
  const [changePassword, { isLoading: isSaving }] = useChangePasswordMutation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function submitPassword() {
    if (!currentPassword || newPassword.length < 8) {
      toast({ kind: "error", title: "Enter your current password and a new password of at least 8 characters" });
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      setCurrentPassword("");
      setNewPassword("");
      toast({ kind: "success", title: "Password changed" });
    } catch {
      toast({ kind: "error", title: "Could not change password" });
    }
  }

  if (isLoading) return <div className="panel rounded p-8 text-center ink-mute">Loading profile...</div>;
  if (!me) return <div className="panel rounded p-8 text-center ink-mute">Profile unavailable.</div>;

  const department = me.departmentId ? getDept(departments, me.departmentId) : undefined;

  return (
    <div className="space-y-4">
      <PageHeader title="Profile" subtitle="/users/me" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="panel rounded p-4 space-y-4">
          <div className="field-label">Profile information</div>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div><div className="ink-mute text-xs">First name</div><div className="font-semibold">{me.firstName}</div></div>
            <div><div className="ink-mute text-xs">Last name</div><div className="font-semibold">{me.lastName}</div></div>
            <div className="sm:col-span-2"><div className="ink-mute text-xs">Email</div><div className="font-semibold mono">{me.email}</div></div>
            <div><div className="ink-mute text-xs">Role</div><div className="mt-1"><RoleBadge role={me.role} /></div></div>
            <div><div className="ink-mute text-xs">Department</div><div className="font-semibold">{department?.name || "-"}</div></div>
            <div><div className="ink-mute text-xs">Status</div><div className="font-semibold">{me.active ? "Active" : "Inactive"}</div></div>
            <div><div className="ink-mute text-xs">Created</div><div className="font-semibold mono text-xs">{me.createdAt?.slice(0, 10)}</div></div>
          </div>
        </div>

        {isAdmin && (
          <div className="panel rounded p-4 space-y-4">
            <div className="field-label">My overview</div>
            {isLoadingDashboard ? (
              <div className="text-sm ink-mute">Loading dashboard...</div>
            ) : dashboardMe && Object.keys(dashboardMe).length > 0 ? (
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {Object.entries(dashboardMe).slice(0, 8).map(([key, value]) => (
                  <div key={key} className="rounded border hairline p-3">
                    <div className="text-xs ink-mute">{key.replace(/([A-Z])/g, " $1").toLowerCase()}</div>
                    <div className="mt-1 font-semibold">{String(value)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm ink-mute">No personal dashboard data returned.</div>
            )}
          </div>
        )}

        <div className="panel rounded p-4 space-y-4">
          <div className="field-label">Change password</div>
          <Field label="Current password">
            <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </Field>
          <Field label="New password" hint="At least 8 characters">
            <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </Field>
          <button className="btn btn-primary" onClick={submitPassword} disabled={isSaving}>
            {isSaving ? "Saving..." : "Change password"}
          </button>
        </div>
      </div>
    </div>
  );
}
