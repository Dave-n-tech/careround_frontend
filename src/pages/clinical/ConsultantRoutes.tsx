import { Navigate, Route, Routes } from "react-router-dom";
import { PatientListPage, PatientDetailPage, MyTeamPage, EscalationInbox, RoundParticipateView } from "./SharedScreens";
import RoundWizard from "@/pages/rounds/RoundWizard";

export default function ConsultantRoutes() {
  return (
    <Routes>
      <Route path="patients" element={<PatientListPage scope="team" title="My team's patients" />} />
      <Route path="patients/:id" element={<PatientDetailPage />} />
      <Route path="round" element={<RoundWizard />} />
      <Route path="team" element={<MyTeamPage />} />
      <Route path="escalations" element={<EscalationInbox scope="consultant" />} />
      <Route path="round-participate" element={<RoundParticipateView />} />
      <Route path="*" element={<Navigate to="/consultant/patients" replace />} />
    </Routes>
  );
}
