import { Navigate, Route, Routes } from "react-router-dom";
import { PatientListPage, PatientDetailPage, AdmissionForm, EscalationInbox } from "./SharedScreens";
import RoundWizard from "@/pages/rounds/RoundWizard";

export default function RegistrarRoutes() {
  return (
    <Routes>
      <Route path="patients" element={<PatientListPage scope="ward" title="Ward patients" />} />
      <Route path="patients/:id" element={<PatientDetailPage />} />
      <Route path="round" element={<RoundWizard />} />
      <Route path="admit" element={<AdmissionForm />} />
      <Route path="escalations" element={<EscalationInbox scope="registrar" />} />
      <Route path="*" element={<Navigate to="/registrar/patients" replace />} />
    </Routes>
  );
}
