import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import {
  CLINICAL_NOTES,
  DEPARTMENTS,
  ESCALATIONS,
  HOSPITAL,
  ON_CALL,
  PATIENTS,
  ROUNDS,
  SHIFT_SCHEDULES,
  SHIFTS,
  SYSTEM_CONFIG,
  TASKS,
  TEAMS,
  USERS,
  VITALS_MAP,
  WARDS
} from "@/mock/data";
import { getMockSessionUser, setMockSessionUser } from "@/mock/session";
import type { User } from "@/types/domain";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const ok = <T,>(data: T) => ({ data });
const fail = (status: number, message: string) => ({ error: { status, data: { message } } });
const findUserByEmail = (email?: string) => USERS.find((u) => u.email.toLowerCase() === String(email || "").toLowerCase());
const getPath = (url: string) => url.split("?")[0];
const getQuery = (url: string): Record<string, string> => {
  const qs = url.split("?")[1];
  if (!qs) return {};
  return Object.fromEntries(new URLSearchParams(qs));
};

export const mockBaseQuery: BaseQueryFn = async (args) => {
  const { url, method = "GET", body } = typeof args === "string" ? { url: args } : args;
  const path = getPath(url);
  const query = getQuery(url);
  const parts = path.split("/").filter(Boolean);

  await wait(150);

  // ── Auth ────────────────────────────────────────────────────────────────
  if (path === "/auth/login" && method === "POST") {
    const user = findUserByEmail(body?.email) || USERS.find((u) => u.role === body?.role);
    if (!user) return fail(401, "Invalid credentials");
    setMockSessionUser(user.id);
    return ok({ accessToken: "mock-access-token", refreshToken: "mock-refresh-token", tokenType: "Bearer", expiresIn: 3600, userId: user.id, hospitalId: user.hospitalId, role: user.role });
  }
  if (path === "/auth/logout" && method === "POST") { setMockSessionUser(null); return ok(null); }
  if (path === "/auth/refresh" && method === "POST") { return ok({ accessToken: "mock-refreshed-token", refreshToken: "mock-refresh-token", tokenType: "Bearer", expiresIn: 3600, userId: "u_admin", hospitalId: HOSPITAL.id, role: "ADMIN" }); }
  if (path === "/auth/change-password" && method === "POST") { return ok(null); }
  if (path === "/auth/activate-account" && method === "POST") { return ok(null); }

  // ── Users ───────────────────────────────────────────────────────────────
  if (path === "/users/me" && method === "GET") {
    const userId = getMockSessionUser();
    if (!userId) return fail(401, "Not authenticated");
    const user = USERS.find((u) => u.id === userId) as User | undefined;
    return user ? ok(user) : fail(404, "User not found");
  }
  if (path === "/users" && method === "GET") return ok(USERS);
  if (path === "/users" && method === "POST") return ok({ id: `u_${Date.now()}`, hospitalId: HOSPITAL.id, ...body, createdAt: new Date().toISOString(), active: true });
  if (parts[0] === "users" && parts[2] === "deactivate" && method === "PUT") return ok(null);

  // ── Departments ─────────────────────────────────────────────────────────
  if (path === "/departments" && method === "GET") return ok(DEPARTMENTS);
  if (path === "/departments" && method === "POST") return ok({ id: `d_${Date.now()}`, hospitalId: HOSPITAL.id, ...body, createdAt: new Date().toISOString() });
  if (parts[0] === "departments" && parts.length === 2 && method === "GET") return ok(DEPARTMENTS.find((d) => d.id === parts[1]) || null);
  if (parts[0] === "departments" && parts.length === 2 && method === "PUT") return ok({ ...DEPARTMENTS.find((d) => d.id === parts[1]), ...body });
  if (parts[0] === "departments" && parts.length === 2 && method === "DELETE") return ok(null);

  // ── Wards ───────────────────────────────────────────────────────────────
  if (path === "/wards" && method === "GET") return ok(WARDS);
  if (path === "/wards" && method === "POST") return ok({ id: `w_${Date.now()}`, hospitalId: HOSPITAL.id, ...body, createdAt: new Date().toISOString() });
  if (parts[0] === "wards" && parts.length === 2 && method === "GET") return ok(WARDS.find((w) => w.id === parts[1]) || null);
  if (parts[0] === "wards" && parts.length === 2 && method === "PUT") return ok({ ...WARDS.find((w) => w.id === parts[1]), ...body });
  if (parts[0] === "wards" && parts.length === 2 && method === "DELETE") return ok(null);

  // ── Teams ───────────────────────────────────────────────────────────────
  if (path === "/teams" && method === "GET") return ok(TEAMS);
  if (path === "/teams" && method === "POST") return ok({ id: `t_${Date.now()}`, hospitalId: HOSPITAL.id, ...body, createdAt: new Date().toISOString() });
  if (parts[0] === "teams" && parts.length === 2 && method === "GET") return ok(TEAMS.find((t) => t.id === parts[1]) || null);
  if (parts[0] === "teams" && parts[2] === "wards" && method === "POST") return ok(TEAMS.find((t) => t.id === parts[1]));
  if (parts[0] === "teams" && parts[2] === "wards" && method === "DELETE") return ok(null);
  if (parts[0] === "teams" && parts[2] === "invites" && method === "POST") return ok({ id: `inv_${Date.now()}`, hospitalId: HOSPITAL.id, medicalTeamId: parts[1], invitedUserId: body?.invitedUserId, invitedById: getMockSessionUser(), status: "PENDING", expiresAt: new Date(Date.now()+7*86400000).toISOString(), createdAt: new Date().toISOString() });
  if (parts[0] === "teams" && parts[1] === "invites" && parts[2] === "pending") return ok([]);
  if (parts[0] === "teams" && parts[1] === "invites" && parts[3] === "accept") return ok(null);
  if (parts[0] === "teams" && parts[1] === "invites" && parts[3] === "decline") return ok(null);
  if (parts[0] === "teams" && parts[2] === "members" && method === "DELETE") return ok(null);

  // ── Patients ────────────────────────────────────────────────────────────
  if (parts[0] === "patients" && parts[1] === "ward" && parts.length === 3) return ok(PATIENTS.filter((p) => p.wardId === parts[2]));
  if (parts[0] === "patients" && parts[1] === "search") return ok(PATIENTS.filter((p) => `${p.firstName} ${p.lastName} ${p.hospitalNumber}`.toLowerCase().includes((query.q || "").toLowerCase())));
  if (path === "/patients" && method === "POST") return ok({ id: `p_${Date.now()}`, ...body, newsScore: 0, acuityLevel: "LOW", isDischargeReady: false, status: "ADMITTED", admissionDate: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  if (parts[0] === "patients" && parts.length === 2 && method === "GET") { const p = PATIENTS.find((pt) => pt.id === parts[1]); return p ? ok(p) : fail(404, "Patient not found"); }
  if (parts[0] === "patients" && parts[2] === "status" && method === "PATCH") { const p = PATIENTS.find((pt) => pt.id === parts[1]); return p ? ok({ ...p, status: body?.status }) : fail(404, "Not found"); }
  if (parts[0] === "patients" && parts[2] === "discharge-ready" && method === "PATCH") { const p = PATIENTS.find((pt) => pt.id === parts[1]); return p ? ok({ ...p, isDischargeReady: true, status: "DISCHARGE_READY" }) : fail(404, "Not found"); }

  // ── Vitals ──────────────────────────────────────────────────────────────
  if (parts[0] === "patients" && parts[2] === "vitals" && parts[3] === "latest" && method === "GET") { const v = VITALS_MAP[parts[1]]; return v ? ok(v[v.length - 1]) : fail(404, "No vitals"); }
  if (parts[0] === "patients" && parts[2] === "vitals" && parts.length === 3 && method === "GET") { return ok(VITALS_MAP[parts[1]] || []); }
  if (parts[0] === "patients" && parts[2] === "vitals" && method === "POST") { return ok({ id: `v_${Date.now()}`, patientId: parts[1], recordedById: getMockSessionUser(), ...body, newsScore: 0, recordedAt: new Date().toISOString() }); }

  // ── Next of Kin ─────────────────────────────────────────────────────────
  if (parts[0] === "patients" && parts[2] === "next-of-kin" && parts.length === 3 && method === "GET") return ok([]);
  if (parts[0] === "patients" && parts[2] === "next-of-kin" && parts.length === 3 && method === "POST") return ok({ id: `nok_${Date.now()}`, patientId: parts[1], ...body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  if (parts[0] === "patients" && parts[2] === "next-of-kin" && parts.length === 4 && method === "PUT") return ok({ id: parts[3], patientId: parts[1], ...body, updatedAt: new Date().toISOString() });
  if (parts[0] === "patients" && parts[2] === "next-of-kin" && parts.length === 4 && method === "DELETE") return ok(null);
  if (parts[0] === "patients" && parts[2] === "next-of-kin" && parts[4] === "consent") return ok(null);

  // ── Care Tasks ──────────────────────────────────────────────────────────
  if (parts[0] === "care-tasks" && parts[1] === "ward" && parts.length === 3) { const s = query.status; return ok(TASKS.filter((t) => t.wardId === parts[2] && (!s || t.status === s))); }
  if (parts[0] === "care-tasks" && parts[1] === "patient" && parts.length === 3) return ok(TASKS.filter((t) => t.patientId === parts[2]));
  if (path === "/care-tasks" && method === "POST") return ok({ id: `tk_${Date.now()}`, hospitalId: HOSPITAL.id, wardId: "w1", createdById: getMockSessionUser(), ...body, status: "PENDING", completedById: null, completedAt: null, workloadConflict: false, workloadConflictReason: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  if (parts[0] === "care-tasks" && parts[2] === "progress") { const t = TASKS.find((tk) => tk.id === parts[1]); return t ? ok({ ...t, status: "IN_PROGRESS" }) : fail(404, "Not found"); }
  if (parts[0] === "care-tasks" && parts[2] === "complete") { const t = TASKS.find((tk) => tk.id === parts[1]); return t ? ok({ ...t, status: "COMPLETED", completedById: getMockSessionUser(), completedAt: new Date().toISOString() }) : fail(404, "Not found"); }
  if (parts[0] === "care-tasks" && parts[2] === "assign") { const t = TASKS.find((tk) => tk.id === parts[1]); return t ? ok({ ...t, assignedToId: body?.assignedToId, assignedToRole: body?.assignedToRole }) : fail(404, "Not found"); }

  // ── Clinical Notes ──────────────────────────────────────────────────────
  if (parts[0] === "clinical-notes" && parts[1] === "patient" && parts.length === 3) return ok(CLINICAL_NOTES.filter((n) => n.patientId === parts[2]));
  if (path === "/clinical-notes" && method === "POST") return ok({ id: `note_${Date.now()}`, authorId: getMockSessionUser() || "u_jr1", isAmended: false, amendedById: null, amendedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...body });
  if (parts[0] === "clinical-notes" && parts[2] === "amend") { const n = CLINICAL_NOTES.find((note) => note.id === parts[1]); return n ? ok({ ...n, content: body?.content, isAmended: true, amendedById: getMockSessionUser(), amendedAt: new Date().toISOString() }) : fail(404, "Not found"); }

  // ── Escalations ─────────────────────────────────────────────────────────
  if (parts[0] === "escalations" && parts[1] === "ward") return ok(ESCALATIONS.filter((e) => PATIENTS.find((p) => p.id === e.patientId)?.wardId === parts[2]));
  if (parts[0] === "escalations" && parts[1] === "patient") return ok(ESCALATIONS.filter((e) => e.patientId === parts[2]));
  if (path === "/escalations" && method === "POST") return ok({ id: `esc_${Date.now()}`, hospitalId: HOSPITAL.id, triggeredById: getMockSessionUser(), assignedToId: body?.severity === "RED" ? "u_cons1" : "u_reg1", status: "OPEN", resolvedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...body });
  if (parts[0] === "escalations" && parts[2] === "acknowledge") { const e = ESCALATIONS.find((esc) => esc.id === parts[1]); return e ? ok({ ...e, status: "ACKNOWLEDGED" }) : fail(404, "Not found"); }
  if (parts[0] === "escalations" && parts[2] === "resolve") { const e = ESCALATIONS.find((esc) => esc.id === parts[1]); return e ? ok({ ...e, status: "RESOLVED", resolvedAt: new Date().toISOString() }) : fail(404, "Not found"); }

  // ── Shifts ──────────────────────────────────────────────────────────────
  if (parts[0] === "shifts" && parts[1] === "current") { const s = SHIFTS.find((sh) => sh.wardId === parts[2] && sh.status === "ACTIVE"); return s ? ok(s) : ok(SHIFTS.find((sh) => sh.wardId === parts[2]) || null); }
  if (parts[0] === "shifts" && parts[2] === "assign" && method === "PUT") { const s = SHIFTS.find((sh) => sh.id === parts[1]); return s ? ok({ ...s, leadDoctorId: body?.leadDoctorId, nurseInChargeId: body?.nurseInChargeId, status: "ACTIVE", assignedAt: new Date().toISOString() }) : fail(404, "Not found"); }

  // ── Shift Schedules ─────────────────────────────────────────────────────
  if (path === "/shift-schedules" && method === "GET") return ok(SHIFT_SCHEDULES);
  if (parts[0] === "shift-schedules" && parts.length === 2 && method === "GET") return ok(SHIFT_SCHEDULES.find((s) => s.id === parts[1]) || null);
  if (path === "/shift-schedules" && method === "POST") return ok({ id: `ss_${Date.now()}`, hospitalId: HOSPITAL.id, ...body, active: true, createdAt: new Date().toISOString() });
  if (parts[0] === "shift-schedules" && parts[2] === "deactivate") return ok(null);

  // ── On-Call ─────────────────────────────────────────────────────────────
  if (path === "/oncall" && method === "GET") return ok(ON_CALL);
  if (parts[0] === "oncall" && parts[1] === "current" && method === "GET") return ok(ON_CALL.find((o) => o.departmentId === query.departmentId && o.role === query.role) || null);
  if (parts[0] === "oncall" && parts.length === 2 && method === "GET") return ok(ON_CALL.find((o) => o.id === parts[1]) || null);
  if (path === "/oncall" && method === "POST") return ok({ id: `oc_${Date.now()}`, hospitalId: HOSPITAL.id, ...body, createdAt: new Date().toISOString() });
  if (parts[0] === "oncall" && parts.length === 2 && method === "DELETE") return ok(null);

  // ── Rounds ──────────────────────────────────────────────────────────────
  if (path === "/rounds" && method === "GET") return ok(ROUNDS.filter((r) => (!query.wardId || r.wardId === query.wardId) && (!query.teamId || r.medicalTeamId === query.teamId)));
  if (path === "/rounds" && method === "POST") return ok({ id: `r_${Date.now()}`, hospitalId: HOSPITAL.id, shiftId: null, status: "SCHEDULED", startedAt: null, completedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...body });
  if (parts[0] === "rounds" && parts[2] === "start") { const r = ROUNDS.find((rd) => rd.id === parts[1]); return r ? ok({ ...r, status: "IN_PROGRESS", startedAt: new Date().toISOString() }) : fail(404, "Not found"); }
  if (parts[0] === "rounds" && parts[2] === "complete") { const r = ROUNDS.find((rd) => rd.id === parts[1]); return r ? ok({ ...r, status: "COMPLETED", completedAt: new Date().toISOString() }) : fail(404, "Not found"); }
  if (parts[0] === "rounds" && parts[2] === "reviews") return ok([]);
  if (parts[0] === "rounds" && parts[2] === "patients" && method === "PATCH") return ok({ id: `prr_${Date.now()}`, roundId: parts[1], patientId: parts[3], reviewedById: getMockSessionUser(), reviewOrder: 1, newsScoreAtReview: 0, reviewedAt: new Date().toISOString(), createdAt: new Date().toISOString(), ...body });

  // ── Handovers ───────────────────────────────────────────────────────────
  if (parts[0] === "handovers" && parts[1] === "ward") return ok([]);
  if (path === "/handovers" && method === "POST") return ok({ id: `ho_${Date.now()}`, conductedById: getMockSessionUser(), status: "PENDING", completedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...body });
  if (parts[0] === "handovers" && parts[2] === "patient-notes" && method === "GET") return ok([]);
  if (parts[0] === "handovers" && parts[2] === "patient-notes" && method === "POST") return ok({ id: `phn_${Date.now()}`, handoverId: parts[1], addedById: getMockSessionUser(), createdAt: new Date().toISOString(), ...body });
  if (parts[0] === "handovers" && parts[2] === "complete") return ok({ id: parts[1], status: "COMPLETED", completedAt: new Date().toISOString() });

  // ── Hospital / Config / Dashboard ───────────────────────────────────────
  if (path === "/hospitals/me") return ok(HOSPITAL);
  if (path === "/system-config" && method === "GET") return ok(SYSTEM_CONFIG);
  if (path === "/system-config" && method === "PUT") return ok({ ...SYSTEM_CONFIG, ...body });
  if (path.startsWith("/dashboard/")) return ok({ summary: "Mock dashboard data" });

  // ── Hospital onboarding (public) ────────────────────────────────────────
  if (path === "/onboarding/hospital-requests" && method === "POST") {
    return ok({
      id: `req_${Date.now()}`,
      status: "PENDING_REVIEW",
      reviewNotes: null,
      reviewedByUserId: null,
      reviewedAt: null,
      provisionedHospitalId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body
    });
  }

  return fail(404, `No mock handler for ${method} ${path}`);
};
