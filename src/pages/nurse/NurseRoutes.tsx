import { Navigate, Route, Routes } from "react-router-dom";
import { PatientListPage, PatientDetailPage, MyTasksList, HandoverNotesEntry } from "@/pages/clinical/SharedScreens";
import NurseVitalsForm from "./NurseVitalsForm";
import NurseCreateEscalation from "./NurseCreateEscalation";

export default function NurseRoutes() {
  return (
    <Routes>
      <Route path="patients" element={<PatientListPage scope="ward" title="Ward patients" />} />
      <Route path="patients/:id" element={<PatientDetailPage />} />
      <Route path="vitals" element={<NurseVitalsForm />} />
      <Route path="tasks" element={<MyTasksList role="NURSE" />} />
      <Route path="escalation" element={<NurseCreateEscalation />} />
      <Route path="handover" element={<HandoverNotesEntry />} />
      <Route path="*" element={<Navigate to="/nurse/patients" replace />} />
    </Routes>
  );
}
