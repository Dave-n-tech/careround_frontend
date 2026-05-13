import { skipToken } from "@reduxjs/toolkit/query/react";
import { useCurrentMedicalTeamId, useCurrentWardId } from "@/features/ward/currentWard";
import { useGetPatientsByWardQuery } from "./patients";
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

export function useCurrentWardRounds() {
  const wardId = useCurrentWardId();
  const teamId = useCurrentMedicalTeamId();
  return useGetRoundsQuery(wardId && teamId ? { wardId, teamId } : skipToken);
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
