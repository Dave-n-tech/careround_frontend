import { Navigate, Route, Routes } from "react-router-dom";
import {
  AdminDashboard,
  AdminDepartmentDetail,
  AdminDepartments,
  AdminHospital,
  AdminOnCall,
  AdminShiftSchedules,
  AdminTeamAssignment,
  AdminUserDetail,
  AdminUsers,
  AdminWardDetail,
  AdminWards
} from "./AdminScreens";
import Reports from "@/pages/supervisor/Reports";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="departments" element={<AdminDepartments />} />
      <Route path="departments/:id" element={<AdminDepartmentDetail />} />
      <Route path="wards" element={<AdminWards />} />
      <Route path="wards/:id" element={<AdminWardDetail />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="users/:id" element={<AdminUserDetail />} />
      <Route path="shift-schedules" element={<AdminShiftSchedules />} />
      <Route path="on-call" element={<AdminOnCall />} />
      <Route path="team-assignment" element={<AdminTeamAssignment />} />
      <Route path="reports" element={<Reports allWards />} />
      <Route path="hospital" element={<AdminHospital />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
