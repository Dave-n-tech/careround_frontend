import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import type { Role } from "@/types/domain";
import { roleHomePath } from "@/navigation/nav";

type RequireRoleProps = {
  allow: Role[];
};

export default function RequireRole({ allow }: RequireRoleProps) {
  const role = useAppSelector((state) => state.auth.role);

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(role)) {
    return <Navigate to={roleHomePath(role)} replace />;
  }

  return <Outlet />;
}
