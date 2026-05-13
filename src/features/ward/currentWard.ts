import { useAppSelector } from "@/app/hooks";
import { useGetWardsQuery, useGetTeamsQuery } from "@/services/api";

export function useCurrentWardId(): string | undefined {
  const user = useAppSelector((state) => state.auth.user);
  const { data: wards = [] } = useGetWardsQuery();
  if (!wards.length) return undefined;

  if (user?.role === "WARD_SUPERVISOR") {
    const supervised = wards.find((w) => w.supervisorId === user.id);
    if (supervised) return supervised.id;
  }

  return wards[0]?.id;
}

export function useCurrentMedicalTeamId(): string | undefined {
  const user = useAppSelector((state) => state.auth.user);
  const { data: teams = [] } = useGetTeamsQuery();
  if (!user || !teams.length) return undefined;

  if (user.role === "CONSULTANT") {
    const owned = teams.find((t) => t.consultantId === user.id);
    if (owned) return owned.id;
  }
  if (user.departmentId) {
    const inDept = teams.find((t) => t.departmentId === user.departmentId);
    if (inDept) return inDept.id;
  }
  return teams[0]?.id;
}
