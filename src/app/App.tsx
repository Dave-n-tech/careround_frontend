import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { ToastProvider } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "./hooks";
import { clearAuth } from "@/features/auth/authSlice";
import { useLazyGetMeQuery } from "@/services/api";
import { roleHomePath } from "@/navigation/nav";
import RequireAuth from "@/routes/RequireAuth";
import RequireRole from "@/routes/RequireRole";
import AppShell from "@/layouts/AppShell";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import AdminRoutes from "@/pages/admin/AdminRoutes";
import ConsultantRoutes from "@/pages/clinical/ConsultantRoutes";
import RegistrarRoutes from "@/pages/clinical/RegistrarRoutes";
import JuniorDoctorRoutes from "@/pages/clinical/JuniorDoctorRoutes";
import NurseRoutes from "@/pages/nurse/NurseRoutes";
import SupervisorRoutes from "@/pages/supervisor/SupervisorRoutes";
import SearchResultsPage from "@/pages/SearchResultsPage";

export default function App() {
  const { accessToken, role, status, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [fetchMe] = useLazyGetMeQuery();

  useEffect(() => {
    function onExpired() {
      dispatch(clearAuth());
      navigate("/login", { replace: true });
    }
    window.addEventListener("cr:auth-expired", onExpired);
    return () => window.removeEventListener("cr:auth-expired", onExpired);
  }, [dispatch, navigate]);

  useEffect(() => {
    if (accessToken && status === "loading" && !user) {
      fetchMe();
    }
  }, [accessToken, fetchMe, status, user]);

  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/search" element={<SearchResultsPage />} />
            <Route element={<RequireRole allow={["ADMIN"]} />}>
              <Route path="/admin/*" element={<AdminRoutes />} />
            </Route>
            <Route element={<RequireRole allow={["CONSULTANT"]} />}>
              <Route path="/consultant/*" element={<ConsultantRoutes />} />
            </Route>
            <Route element={<RequireRole allow={["REGISTRAR"]} />}>
              <Route path="/registrar/*" element={<RegistrarRoutes />} />
            </Route>
            <Route element={<RequireRole allow={["JUNIOR_DOCTOR"]} />}>
              <Route path="/junior/*" element={<JuniorDoctorRoutes />} />
            </Route>
            <Route element={<RequireRole allow={["NURSE"]} />}>
              <Route path="/nurse/*" element={<NurseRoutes />} />
            </Route>
            <Route element={<RequireRole allow={["WARD_SUPERVISOR"]} />}>
              <Route path="/supervisor/*" element={<SupervisorRoutes />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={roleHomePath(role)} replace />} />
      </Routes>
    </ToastProvider>
  );
}
