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
  return useGetCareTasksByWardQuery(wardId ? { wardId } : skipToken);
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
