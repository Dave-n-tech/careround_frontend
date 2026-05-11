import { Navigate, Route, Routes } from "react-router-dom";
import { PatientListPage, PatientDetailPage, MyTasksList, HandoverNotesEntry, RoundParticipateView } from "./SharedScreens";

export default function JuniorDoctorRoutes() {
  return (
    <Routes>
      <Route path="tasks" element={<MyTasksList role="JUNIOR_DOCTOR" />} />
      <Route path="patients" element={<PatientListPage scope="team" title="Team patients" />} />
      <Route path="patients/:id" element={<PatientDetailPage />} />
      <Route path="round" element={<RoundParticipateView />} />
      <Route path="handover" element={<HandoverNotesEntry />} />
      <Route path="*" element={<Navigate to="/junior/tasks" replace />} />
    </Routes>
  );
}
