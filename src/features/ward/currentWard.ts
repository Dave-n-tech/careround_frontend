import { useAppSelector } from "@/app/hooks";
import { useGetWardsQuery, useGetTeamsQuery } from "@/services/api";

export function useCurrentWardId(): string | undefined {
  const user = useAppSelector((state) => state.auth.user);
  const { data: wards = [] } = useGetWardsQuery();
  const { data: teams = [] } = useGetTeamsQuery();
  if (!wards.length) return undefined;

  if (user?.role === "WARD_SUPERVISOR") {
    const supervised = wards.find((w) => w.supervisorId === user.id);
    if (supervised) return supervised.id;
  }

  // For clinical staff, find their team's first assigned ward
  if (user?.role === "CONSULTANT" || user?.role === "REGISTRAR" || user?.role === "JUNIOR_DOCTOR") {
    let team = teams.find((t) => t.consultantId === user.id);
    if (!team && user.departmentId) team = teams.find((t) => t.departmentId === user.departmentId);
    if (!team) team = teams[0];
    if (team?.wardIds?.length) {
      const ward = wards.find((w) => w.id === team!.wardIds![0]);
      if (ward) return ward.id;
    }
  }

  return wards[0]?.id;
}

export function useCurrentTeamWardIds(): string[] {
  const user = useAppSelector((state) => state.auth.user);
  const { data: wards = [] } = useGetWardsQuery();
  const { data: teams = [] } = useGetTeamsQuery();
  if (!wards.length || !teams.length) return [];

  if (user?.role === "CONSULTANT" || user?.role === "REGISTRAR" || user?.role === "JUNIOR_DOCTOR") {
    let team = teams.find((t) => t.consultantId === user!.id);
    if (!team && user?.departmentId) team = teams.find((t) => t.departmentId === user!.departmentId);
    if (!team) team = teams[0];
    if (team?.wardIds?.length) return team.wardIds;
  }

  const wardId = wards[0]?.id;
  return wardId ? [wardId] : [];
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
