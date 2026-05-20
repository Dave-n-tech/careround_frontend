import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import type { Role } from "@/types/domain";

const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  DOCTOR: "/doctor/patients",
  NURSE: "/nurse/tasks",
  SUPERVISOR: "/supervisor/dashboard",
};

interface RequireRoleProps {
  allow: Role[];
}

export default function RequireRole({ allow }: RequireRoleProps) {
  const role = useAppSelector((state) => state.auth.role);

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(role)) {
    return <Navigate to={ROLE_HOME[role]} replace />;
  }

  return <Outlet />;
}
