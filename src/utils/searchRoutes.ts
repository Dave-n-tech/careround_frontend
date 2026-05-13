import type { SearchResult } from "@/services/api";
import type { Role } from "@/types/domain";

const PATIENT_ROUTE_BASE: Partial<Record<Role, string>> = {
  CONSULTANT: "/consultant/patients",
  REGISTRAR: "/registrar/patients",
  JUNIOR_DOCTOR: "/junior/patients",
  NURSE: "/nurse/patients"
};

export function resolveSearchResultRoute(role: Role | null, result: SearchResult) {
  if (result.routeTarget) {
    return result.routeTarget.startsWith("/") ? result.routeTarget : `/${result.routeTarget}`;
  }

  if (!role || !result.type.toLowerCase().includes("patient")) {
    return null;
  }

  const base = PATIENT_ROUTE_BASE[role];
  return base ? `${base}/${result.id}` : null;
}
