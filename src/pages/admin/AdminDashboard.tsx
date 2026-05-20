import { useGetWardsQuery } from "@/services/api/wards";
import { useGetUsersQuery } from "@/services/api/users";
import { useGetPatientsQuery } from "@/services/api/patients";
import { MOCK_WARDS, MOCK_USERS, MOCK_PATIENTS, MOCK_ACTIVITY } from "@/lib/mock-data";
import { StatCard } from "@/components/ui/stat-card";
import { formatDateTime } from "@/utils/format";

export default function AdminDashboard() {
  const { data: wards } = useGetWardsQuery();
  const { data: users } = useGetUsersQuery();
  const { data: patients } = useGetPatientsQuery({});

  const wardList = wards ?? MOCK_WARDS;
  const userList = users ?? MOCK_USERS;
  const patientList = patients ?? MOCK_PATIENTS;

  const totalWards = wardList.filter((w) => w.isActive).length;
  const totalDoctors = userList.filter((u) => u.role === "DOCTOR" && u.isActive).length;
  const totalNurses = userList.filter((u) => u.role === "NURSE" && u.isActive).length;
  const patientsAdmitted = patientList.filter((p) => p.status === "ADMITTED").length;

  return (
    <div className="p-8 max-w-6xl">
      {/* Header row */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--cr-ink)]">Dashboard</h1>
        <p className="text-sm text-[var(--cr-muted)] mt-0.5">Hospital overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Wards" value={totalWards} />
        <StatCard label="Doctors" value={totalDoctors} />
        <StatCard label="Nurses" value={totalNurses} />
        <StatCard
          label="Patients Admitted"
          value={patientsAdmitted}
          variant={patientsAdmitted > 0 ? "neutral" : "neutral"}
        />
      </div>

      {/* Recent activity */}
      <div className="bg-white border border-[var(--cr-line)] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--cr-line)]">
          <h2 className="text-sm font-semibold text-[var(--cr-ink)]">Recent Account Activity</h2>
          <p className="text-xs text-[var(--cr-muted)] mt-0.5">Last 20 account events</p>
        </div>
        <div className="overflow-x-auto">
          <table className="cr">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Action</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ACTIVITY.map((entry) => (
                <tr key={entry.id} className="row-hover">
                  <td className="font-medium text-[var(--cr-ink)]">{entry.name}</td>
                  <td className="text-[var(--cr-ink-2)]">{entry.role}</td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        entry.action === "Created"
                          ? "bg-green-100 text-green-700"
                          : entry.action === "Deactivated"
                            ? "bg-red-100 text-red-700"
                            : entry.action === "Reactivated"
                              ? "bg-teal-100 text-teal-700"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {entry.action}
                    </span>
                  </td>
                  <td className="text-[var(--cr-muted)] text-xs">{formatDateTime(entry.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
