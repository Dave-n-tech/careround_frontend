import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./hooks";
import { clearAuth } from "@/features/auth/authSlice";
import { useLazyGetMeQuery } from "@/services/api";
import RequireAuth from "@/routes/RequireAuth";
import RequireRole from "@/routes/RequireRole";
import AdminLayout from "@/layouts/AdminLayout";
import TopNavLayout from "@/layouts/TopNavLayout";
import LoginPage from "@/pages/LoginPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminPatients from "@/pages/admin/AdminPatients";
import AdminWards from "@/pages/admin/AdminWards";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminSettings from "@/pages/admin/AdminSettings";
import PatientListPage from "@/pages/shared/PatientListPage";
import ProfilePage from "@/pages/shared/ProfilePage";
import PatientDetail from "@/pages/shared/PatientDetail";
import DoctorPatients from "@/pages/doctor/DoctorPatients";
import RecordingFlow from "@/pages/doctor/RecordingFlow";
import NurseTasks from "@/pages/nurse/NurseTasks";
import SupervisorDashboard from "@/pages/supervisor/SupervisorDashboard";
import type { Role } from "@/types/domain";

const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  DOCTOR: "/doctor/patients",
  NURSE: "/nurse/tasks",
  SUPERVISOR: "/supervisor/dashboard",
};

const DOCTOR_LINKS = [
  { to: "/doctor/patients", label: "Patients" },
  { to: "/doctor/profile", label: "Profile" },
];

const NURSE_LINKS = [
  { to: "/nurse/tasks", label: "Tasks" },
  { to: "/nurse/patients", label: "Patients" },
  { to: "/nurse/profile", label: "Profile" },
];

export default function App() {
  const { accessToken, role, status, user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [fetchMe] = useLazyGetMeQuery();

  // Handle token expiry events fired by baseQuery
  useEffect(() => {
    function onExpired() {
      dispatch(clearAuth());
      navigate("/login", { replace: true });
    }
    window.addEventListener("cr:auth-expired", onExpired);
    return () => window.removeEventListener("cr:auth-expired", onExpired);
  }, [dispatch, navigate]);

  // After login, fetch the user profile (skipped in dev mock mode — user already set)
  useEffect(() => {
    if (accessToken && status === "loading" && !user) {
      fetchMe();
    }
  }, [accessToken, fetchMe, status, user]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin — sidebar layout */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireRole allow={["ADMIN"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/patients" element={<AdminPatients />} />
            <Route path="/admin/wards" element={<AdminWards />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>

        {/* Doctor — top nav layout + full-screen recording */}
        <Route element={<RequireRole allow={["DOCTOR"]} />}>
          <Route element={<TopNavLayout links={DOCTOR_LINKS} />}>
            <Route path="/doctor/patients" element={<DoctorPatients />} />
            <Route path="/doctor/patients/:id" element={<PatientDetail />} />
            <Route path="/doctor/profile" element={<ProfilePage />} />
          </Route>
          <Route path="/doctor/patients/:id/record" element={<RecordingFlow />} />
        </Route>

        {/* Nurse — top nav layout + full-screen recording */}
        <Route element={<RequireRole allow={["NURSE"]} />}>
          <Route element={<TopNavLayout links={NURSE_LINKS} />}>
            <Route path="/nurse/tasks" element={<NurseTasks />} />
            <Route path="/nurse/patients" element={<PatientListPage />} />
            <Route path="/nurse/patients/:id" element={<PatientDetail />} />
            <Route path="/nurse/profile" element={<ProfilePage />} />
          </Route>
          <Route path="/nurse/patients/:id/record" element={<RecordingFlow />} />
        </Route>

        {/* Supervisor — no persistent nav (single screen) */}
        <Route element={<RequireRole allow={["SUPERVISOR"]} />}>
          <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
        </Route>
      </Route>

      {/* Root redirect */}
      <Route
        path="/"
        element={
          role ? (
            <Navigate to={ROLE_HOME[role]} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch-all */}
      <Route
        path="*"
        element={
          role ? (
            <Navigate to={ROLE_HOME[role]} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
