import type { Patient, User, PatientStatus } from "@/types/domain";

export function patientFullName(p: Pick<Patient, "firstName" | "lastName">) {
  return `${p.firstName} ${p.lastName}`;
}

export function userFullName(u: Pick<User, "firstName" | "lastName">) {
  return `${u.firstName} ${u.lastName}`;
}

export function userInitials(u: Pick<User, "firstName" | "lastName">) {
  return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
}

export function getById<T extends { id: string }>(list: T[], id: string) {
  return list.find((item) => item.id === id);
}

export function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const minutes = Math.floor((Date.now() - t) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ageFromDob(dateOfBirth: string): number {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export function isAdmitted(status: PatientStatus): boolean {
  return (
    status === "ADMITTED" ||
    status === "STABLE" ||
    status === "DETERIORATING" ||
    status === "DISCHARGE_READY"
  );
}
