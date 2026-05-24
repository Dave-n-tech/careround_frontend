import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";

export default function RequireAuth() {
  const location = useLocation();
  const { status, user } = useAppSelector((state) => state.auth);

  // No token — redirect immediately, no flicker possible.
  if (status === "idle") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Session validation in progress. If user data is cached, render the protected
  // content optimistically so there's no loading flash for returning users.
  // If getMe fails, the cr:auth-expired event or matchRejected handler will redirect.
  if (status === "loading") {
    return user
      ? <Outlet />
      : <div className="min-h-screen grid place-items-center text-[var(--cr-muted)]">Loading session…</div>;
  }

  // Validation failed (network error, server error) or session explicitly cleared.
  if (status !== "authenticated" || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
