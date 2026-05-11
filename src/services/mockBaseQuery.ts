import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import {
  CLINICAL_NOTES,
  DEPARTMENTS,
  ESCALATIONS,
  ON_CALL,
  PATIENTS,
  ROUNDS,
  SHIFT_SCHEDULES,
  SHIFTS,
  TASKS,
  TEAMS,
  USERS,
  WARDS
} from "@/mock/data";
import { getMockSessionUser, setMockSessionUser } from "@/mock/session";
import type { User } from "@/types/domain";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ok = <T,>(data: T) => ({ data });

const fail = (status: number, message: string) => ({
  error: { status, data: { message } }
});

const findUserByEmail = (email?: string) =>
  USERS.find((u) => u.email.toLowerCase() === String(email || "").toLowerCase());

const getPath = (url: string) => url.split("?")[0];

export const mockBaseQuery: BaseQueryFn = async (args) => {
  const { url, method = "GET", body } =
    typeof args === "string" ? { url: args } : args;
  const path = getPath(url);

  await wait(150);

  if (path === "/auth/login" && method === "POST") {
    const user = findUserByEmail(body?.email) || USERS.find((u) => u.role === body?.role);
    if (!user) return fail(401, "Invalid credentials");
    setMockSessionUser(user.id);
    return ok({ user });
  }

  if (path === "/auth/logout" && method === "POST") {
    setMockSessionUser(null);
    return ok({ ok: true });
  }

  if (path === "/users/me" && method === "GET") {
    const userId = getMockSessionUser();
    if (!userId) return fail(401, "Not authenticated");
    const user = USERS.find((u) => u.id === userId) as User | undefined;
    if (!user) return fail(404, "User not found");
    return ok(user);
  }

  if (path === "/departments" && method === "GET") return ok(DEPARTMENTS);
  if (path === "/wards" && method === "GET") return ok(WARDS);
  if (path === "/users" && method === "GET") return ok(USERS);
  if (path === "/medical-teams" && method === "GET") return ok(TEAMS);
  if (path === "/patients" && method === "GET") return ok(PATIENTS);
  if (path === "/care-tasks" && method === "GET") return ok(TASKS);
  if (path === "/escalations" && method === "GET") return ok(ESCALATIONS);
  if (path === "/shifts" && method === "GET") return ok(SHIFTS);
  if (path === "/shift-schedules" && method === "GET") return ok(SHIFT_SCHEDULES);
  if (path === "/on-call-rotations" && method === "GET") return ok(ON_CALL);
  if (path === "/rounds" && method === "GET") return ok(ROUNDS);
  if (path === "/clinical-notes" && method === "POST") {
    return ok({
      id: `note_${Date.now()}`,
      patientId: body?.patientId,
      authorId: getMockSessionUser() || "u_jr1",
      type: body?.type,
      createdAt: new Date().toISOString(),
      body: body?.body
    });
  }
  if (path === "/escalations" && method === "POST") {
    return ok({
      id: `esc_${Date.now()}`,
      patientId: body?.patientId,
      triggerType: body?.triggerType,
      severity: body?.severity,
      status: "OPEN",
      createdAt: new Date().toISOString(),
      assigneeId: body?.severity === "RED" ? "u_cons1" : "u_reg1",
      notes: body?.notes
    });
  }
  if (path.startsWith("/care-tasks/") && path.endsWith("/status") && method === "PUT") {
    const taskId = path.split("/")[2];
    const task = TASKS.find((t) => t.id === taskId);
    return task ? ok({ ...task, status: body?.status }) : fail(404, "Task not found");
  }
  if (path.startsWith("/escalations/") && path.endsWith("/acknowledge") && method === "PUT") {
    const escalationId = path.split("/")[2];
    const escalation = ESCALATIONS.find((e) => e.id === escalationId);
    return escalation ? ok({ ...escalation, status: "ACKNOWLEDGED" }) : fail(404, "Escalation not found");
  }
  if (path.startsWith("/escalations/") && path.endsWith("/resolve") && method === "PUT") {
    const escalationId = path.split("/")[2];
    const escalation = ESCALATIONS.find((e) => e.id === escalationId);
    return escalation ? ok({ ...escalation, status: "RESOLVED" }) : fail(404, "Escalation not found");
  }
  if (path.startsWith("/shifts/") && path.endsWith("/assign") && method === "PUT") {
    const shiftId = path.split("/")[2];
    const shift = SHIFTS.find((s) => s.id === shiftId);
    return shift ? ok({ ...shift, leadDoctorId: body?.leadDoctorId, nurseInChargeId: body?.nurseInChargeId }) : fail(404, "Shift not found");
  }
  if (path.startsWith("/shifts/") && path.endsWith("/status") && method === "PUT") {
    const shiftId = path.split("/")[2];
    const shift = SHIFTS.find((s) => s.id === shiftId);
    return shift ? ok({ ...shift, status: body?.status }) : fail(404, "Shift not found");
  }

  if (path.startsWith("/patients/") && method === "GET") {
    const parts = path.split("/").filter(Boolean);
    const patientId = parts[1];
    if (parts.length === 2) {
      const patient = PATIENTS.find((p) => p.id === patientId);
      return patient ? ok(patient) : fail(404, "Patient not found");
    }
    if (parts.length === 3 && parts[2] === "clinical-notes") {
      return ok(CLINICAL_NOTES.filter((n) => n.patientId === patientId));
    }
  }

  if (path.startsWith("/patients/") && path.endsWith("/vitals") && method === "POST") {
    const patientId = path.split("/")[2];
    const patient = PATIENTS.find((p) => p.id === patientId);
    return patient ? ok(patient) : fail(404, "Patient not found");
  }

  return fail(404, `No mock handler for ${method} ${path}`);
};
