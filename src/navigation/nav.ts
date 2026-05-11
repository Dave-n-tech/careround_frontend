import type { Role } from "@/types/domain";

export type NavItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
  badgeKey?: "openEscalations" | "pendingShifts";
};

export const ROLE_BASE: Record<Role, string> = {
  ADMIN: "/admin",
  CONSULTANT: "/consultant",
  REGISTRAR: "/registrar",
  JUNIOR_DOCTOR: "/junior",
  NURSE: "/nurse",
  WARD_SUPERVISOR: "/supervisor"
};

export const NAV: Record<Role, NavItem[]> = {
  ADMIN: [
    { id: "dashboard", label: "Dashboard", icon: "dashboard", path: "/admin" },
    { id: "departments", label: "Departments", icon: "building", path: "/admin/departments" },
    { id: "wards", label: "Wards", icon: "bed", path: "/admin/wards" },
    { id: "users", label: "Users", icon: "team", path: "/admin/users" },
    { id: "shift-schedules", label: "Shift Schedules", icon: "shift", path: "/admin/shift-schedules" },
    { id: "on-call", label: "On-Call Rotations", icon: "rounds", path: "/admin/on-call" },
    { id: "team-assignment", label: "Team to Ward", icon: "handover", path: "/admin/team-assignment" },
    { id: "hospital", label: "Hospital Settings", icon: "settings", path: "/admin/hospital" }
  ],
  CONSULTANT: [
    { id: "patients", label: "My Team's Patients", icon: "patients", path: "/consultant/patients" },
    { id: "round", label: "Ward Round", icon: "rounds", path: "/consultant/round" },
    { id: "team", label: "My Team", icon: "team", path: "/consultant/team" },
    { id: "escalations", label: "Escalation Inbox", icon: "escalation", path: "/consultant/escalations", badgeKey: "openEscalations" }
  ],
  REGISTRAR: [
    { id: "patients", label: "Ward Patients", icon: "patients", path: "/registrar/patients" },
    { id: "round", label: "Ward Round", icon: "rounds", path: "/registrar/round" },
    { id: "admit", label: "Admit Patient", icon: "plus", path: "/registrar/admit" },
    { id: "escalations", label: "On-Call Queue", icon: "escalation", path: "/registrar/escalations", badgeKey: "openEscalations" }
  ],
  JUNIOR_DOCTOR: [
    { id: "tasks", label: "My Tasks", icon: "tasks", path: "/junior/tasks" },
    { id: "patients", label: "Team Patients", icon: "patients", path: "/junior/patients" },
    { id: "round", label: "Active Round", icon: "rounds", path: "/junior/round" },
    { id: "handover", label: "Handover Notes", icon: "handover", path: "/junior/handover" }
  ],
  NURSE: [
    { id: "patients", label: "Ward Patients", icon: "patients", path: "/nurse/patients" },
    { id: "vitals", label: "Record Vitals", icon: "vitals", path: "/nurse/vitals" },
    { id: "tasks", label: "My Tasks", icon: "tasks", path: "/nurse/tasks" },
    { id: "escalation-create", label: "Raise Concern", icon: "escalation", path: "/nurse/escalation" },
    { id: "handover", label: "Handover Notes", icon: "handover", path: "/nurse/handover" }
  ],
  WARD_SUPERVISOR: [
    { id: "dashboard", label: "Ward Dashboard", icon: "dashboard", path: "/supervisor" },
    { id: "shifts", label: "Shift Assignment", icon: "shift", path: "/supervisor/shifts", badgeKey: "pendingShifts" },
    { id: "handover", label: "Handover", icon: "handover", path: "/supervisor/handover" },
    { id: "rounds-history", label: "Round History", icon: "rounds", path: "/supervisor/rounds-history" },
    { id: "reports", label: "Reports", icon: "reports", path: "/supervisor/reports" }
  ]
};

export const roleHomePath = (role: Role | null) => {
  if (!role) return "/login";
  return ROLE_BASE[role];
};
