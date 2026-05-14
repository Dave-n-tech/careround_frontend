import { skipToken } from "@reduxjs/toolkit/query/react";
import { useAppSelector } from "@/app/hooks";
import { useCurrentMedicalTeamId, useCurrentTeamWardIds, useCurrentWardId } from "@/features/ward/currentWard";
import { useGetPatientsByWardQuery } from "./patients";
import { useGetTeamsQuery } from "./teams";
import {
  useGetCareTasksByWardQuery,
  useGetEscalationsByWardQuery,
  useProgressTaskMutation,
  useCompleteTaskMutation
} from "./clinical";
import { useGetRoundsQuery } from "./rounds";
import { useGetCurrentShiftQuery } from "./operations";
import type { CareTask, TaskStatus } from "@/types/domain";

export function useCurrentWardPatients() {
  const wardId = useCurrentWardId();
  return useGetPatientsByWardQuery(wardId ?? skipToken);
}

export function useCurrentWardCareTasks() {
  const wardId = useCurrentWardId();
  const pending = useGetCareTasksByWardQuery(wardId ? { wardId, status: "PENDING" } : skipToken);
  const inProgress = useGetCareTasksByWardQuery(wardId ? { wardId, status: "IN_PROGRESS" } : skipToken);
  const overdue = useGetCareTasksByWardQuery(wardId ? { wardId, status: "OVERDUE" } : skipToken);
  const completed = useGetCareTasksByWardQuery(wardId ? { wardId, status: "COMPLETED" } : skipToken);

  return {
    data: [
      ...(pending.data || []),
      ...(inProgress.data || []),
      ...(overdue.data || []),
      ...(completed.data || [])
    ],
    isLoading:
      pending.isLoading ||
      inProgress.isLoading ||
      overdue.isLoading ||
      completed.isLoading,
    refetch: () => {
      pending.refetch();
      inProgress.refetch();
      overdue.refetch();
      completed.refetch();
    }
  };
}

export function useCurrentWardEscalations() {
  const wardId = useCurrentWardId();
  return useGetEscalationsByWardQuery(wardId ?? skipToken);
}

export function useCurrentTeamEscalations() {
  const wardIds = useCurrentTeamWardIds();
  const q0 = useGetEscalationsByWardQuery(wardIds[0] ?? skipToken);
  const q1 = useGetEscalationsByWardQuery(wardIds[1] ?? skipToken);
  const q2 = useGetEscalationsByWardQuery(wardIds[2] ?? skipToken);
  const q3 = useGetEscalationsByWardQuery(wardIds[3] ?? skipToken);

  return {
    data: [
      ...(q0.data ?? []),
      ...(q1.data ?? []),
      ...(q2.data ?? []),
      ...(q3.data ?? [])
    ],
    isLoading: q0.isLoading || q1.isLoading || q2.isLoading || q3.isLoading
  };
}

export function useCurrentWardRounds() {
  const wardId = useCurrentWardId();
  const teamId = useCurrentMedicalTeamId();
  const role = useAppSelector((state) => state.auth.role);
  const { data: teams = [] } = useGetTeamsQuery();

  // For supervisors, fetch rounds for all teams in their ward
  const wardTeams = role === "WARD_SUPERVISOR" && wardId
    ? teams.filter((t) => t.wardIds?.includes(wardId))
    : [];
  const t0 = wardTeams[0]?.id;
  const t1 = wardTeams[1]?.id;
  const t2 = wardTeams[2]?.id;
  const r0 = useGetRoundsQuery(wardId && t0 ? { wardId, teamId: t0 } : skipToken);
  const r1 = useGetRoundsQuery(wardId && t1 ? { wardId, teamId: t1 } : skipToken);
  const r2 = useGetRoundsQuery(wardId && t2 ? { wardId, teamId: t2 } : skipToken);
  const mainQuery = useGetRoundsQuery(
    role !== "WARD_SUPERVISOR" && wardId && teamId ? { wardId, teamId } : skipToken
  );

  if (role === "WARD_SUPERVISOR") {
    return {
      data: [...(r0.data ?? []), ...(r1.data ?? []), ...(r2.data ?? [])],
      isLoading: r0.isLoading || r1.isLoading || r2.isLoading,
      refetch: () => { r0.refetch(); r1.refetch(); r2.refetch(); }
    };
  }
  return mainQuery;
}

export function useCurrentWardShift() {
  const wardId = useCurrentWardId();
  return useGetCurrentShiftQuery(wardId ?? skipToken);
}

export type UpdateCareTaskStatusArgs = { taskId: string; status: TaskStatus };

export function useUpdateCareTaskStatus(): [
  (args: UpdateCareTaskStatusArgs) => Promise<CareTask>,
  { isLoading: boolean }
] {
  const [progress, progressState] = useProgressTaskMutation();
  const [complete, completeState] = useCompleteTaskMutation();
  const isLoading = progressState.isLoading || completeState.isLoading;

  async function run({ taskId, status }: UpdateCareTaskStatusArgs) {
    if (status === "COMPLETED") return complete(taskId).unwrap();
    return progress(taskId).unwrap();
  }

  return [run, { isLoading }];
}
