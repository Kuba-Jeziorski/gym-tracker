import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import type { StoredWorkout } from "../data/workoutStorage";
import {
  fetchTrainings,
  type TrainingRow,
  toStoredWorkout,
} from "../services/trainingsDb";

export function trainingsQueryKey(userId: string | null) {
  return ["trainings", userId] as const;
}

export function useTrainingsQuery() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: trainingsQueryKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<StoredWorkout[]> => {
      const { data, error } = await fetchTrainings(userId!);
      if (error) throw error;
      return ((data ?? []) as TrainingRow[]).map(toStoredWorkout);
    },
  });

  return {
    userId,
    workouts: query.data ?? [],
    isLoading: query.isLoading,
  };
}
