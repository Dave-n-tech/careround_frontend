import type { SearchResult } from "@/services/api";
import type { Role } from "@/types/domain";

const PATIENT_ROUTE_BASE: Partial<Record<Role, string>> = {
  ADMIN: "/admin/patients",
  CONSULTANT: "/consultant/patients",
  REGISTRAR: "/registrar/patients",
  JUNIOR_DOCTOR: "/junior/patients",
  NURSE: "/nurse/patients",
  WARD_SUPERVISOR: "/supervisor/patients"
};

export function resolvePatientRoute(role: Role | null, patientId: string): string | null {
  if (!role) return null;
  const base = PATIENT_ROUTE_BASE[role];
  return base ? `${base}/${patientId}` : null;
}

export function resolveSearchResultRoute(role: Role | null, result: SearchResult) {
  if (result.routeTarget) {
    return result.routeTarget.startsWith("/") ? result.routeTarget : `/${result.routeTarget}`;
  }

  if (!role || !result.type.toLowerCase().includes("patient")) {
    return null;
  }

  return resolvePatientRoute(role, result.id);
}
