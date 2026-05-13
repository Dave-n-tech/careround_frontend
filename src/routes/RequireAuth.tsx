import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";

export default function RequireAuth() {
  const location = useLocation();
  const { status, user } = useAppSelector((state) => state.auth);

  if (status === "loading") {
    return <div className="min-h-screen grid place-items-center ink-mute">Loading session...</div>;
  }

  if (status !== "authenticated" || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
