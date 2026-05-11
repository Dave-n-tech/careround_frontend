import { Navigate, Route, Routes } from "react-router-dom";
import SupervisorDashboard from "./SupervisorDashboard";
import ShiftAssignment from "./ShiftAssignment";
import HandoverManagement from "./HandoverManagement";
import Reports from "./Reports";
import RoundHistory from "./RoundHistory";

export default function SupervisorRoutes() {
  return (
    <Routes>
      <Route index element={<SupervisorDashboard />} />
      <Route path="shifts" element={<ShiftAssignment />} />
      <Route path="handover" element={<HandoverManagement />} />
      <Route path="rounds-history" element={<RoundHistory />} />
      <Route path="reports" element={<Reports />} />
      <Route path="*" element={<Navigate to="/supervisor" replace />} />
    </Routes>
  );
}
