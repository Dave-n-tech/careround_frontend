import { Navigate, Route, Routes } from "react-router-dom";
import {
  AdminDashboard,
  AdminDepartments,
  AdminHospital,
  AdminOnCall,
  AdminShiftSchedules,
  AdminTeamAssignment,
  AdminUsers,
  AdminWards
} from "./AdminScreens";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="departments" element={<AdminDepartments />} />
      <Route path="wards" element={<AdminWards />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="shift-schedules" element={<AdminShiftSchedules />} />
      <Route path="on-call" element={<AdminOnCall />} />
      <Route path="team-assignment" element={<AdminTeamAssignment />} />
      <Route path="hospital" element={<AdminHospital />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
