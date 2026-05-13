import type { Department, MedicalTeam, Patient, User, Ward } from "@/types/domain";

export function patientFullName(p: Patient) {
  return `${p.lastName.toUpperCase()}, ${p.firstName}`;
}

export function userFullName(u: User) {
  return `${u.firstName} ${u.lastName}`;
}

export function getById<T extends { id: string }>(list: T[], id: string) {
  return list.find((item) => item.id === id);
}

export function getWard(wards: Ward[], id: string) {
  return getById(wards, id);
}

export function getDept(departments: Department[], id: string) {
  return getById(departments, id);
}

export function getTeam(teams: MedicalTeam[], id: string) {
  return getById(teams, id);
}

export function getUser(users: User[], id: string) {
  return getById(users, id);
}

export function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  const minutes = Math.floor((Date.now() - t) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
