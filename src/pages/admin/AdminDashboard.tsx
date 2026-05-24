import { useGetWardsQuery } from "@/services/api/wards";
import { useGetUsersQuery } from "@/services/api/users";
import { useGetAllPatientsQuery } from "@/services/api/patients";
import { MOCK_WARDS, MOCK_USERS, MOCK_PATIENTS } from "@/lib/mock-data";
import { StatCard } from "@/components/ui/stat-card";
import { AcuityBadge } from "@/components/ui/badge";
import { formatDateTime, ageFromDob } from "@/utils/format";

export default function AdminDashboard() {
  const { data: wards } = useGetWardsQuery();
  const { data: users } = useGetUsersQuery();
  const { data: patients } = useGetAllPatientsQuery();

  const wardList = wards ?? MOCK_WARDS;
  const userList = users ?? MOCK_USERS;
  const patientList = patients ?? MOCK_PATIENTS;

  const totalWards = wardList.filter((w) => w.isActive).length;
  const totalDoctors = userList.filter((u) => u.role === "DOCTOR" && u.active).length;
  const totalNurses = userList.filter((u) => u.role === "NURSE" && u.active).length;
  const patientsAdmitted = patientList.filter((p) => p.status === "ADMITTED").length;

  const wardMap = Object.fromEntries(wardList.map((w) => [w.id, w.name]));

  const recentPatients = [...patientList]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--cr-ink)]">Dashboard</h1>
        <p className="text-sm text-[var(--cr-muted)] mt-0.5">Hospital overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Wards" value={totalWards} />
        <StatCard label="Doctors" value={totalDoctors} />
        <StatCard label="Nurses" value={totalNurses} />
        <StatCard label="Patients Admitted" value={patientsAdmitted} />
      </div>

      <div className="bg-white border border-[var(--cr-line)] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--cr-line)]">
          <h2 className="text-sm font-semibold text-[var(--cr-ink)]">Recently Registered Patients</h2>
          <p className="text-xs text-[var(--cr-muted)] mt-0.5">Last 10 admissions</p>
        </div>
        {recentPatients.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center text-[var(--cr-muted)]">No patients registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="cr">
              <thead>
                <tr>
                  <th>Hospital No.</th>
                  <th>Full Name</th>
                  <th>Age</th>
                  <th>Ward</th>
                  <th>Acuity</th>
                  <th>Status</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {recentPatients.map((p) => (
                  <tr key={p.id} className="row-hover">
                    <td className="font-mono text-xs text-[var(--cr-muted)]">{p.hospitalNumber}</td>
                    <td className="font-medium text-[var(--cr-ink)]">{p.firstName} {p.lastName}</td>
                    <td className="text-[var(--cr-ink-2)]">{ageFromDob(p.dateOfBirth)}</td>
                    <td className="text-[var(--cr-ink-2)]">{wardMap[p.wardId] ?? "—"}</td>
                    <td><AcuityBadge color={p.acuityColor} /></td>
                    <td>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                        p.status === "ADMITTED" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {p.status === "ADMITTED" ? "Admitted" : "Discharged"}
                      </span>
                    </td>
                    <td className="text-[var(--cr-muted)] text-xs">{formatDateTime(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
