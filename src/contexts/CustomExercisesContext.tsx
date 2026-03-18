import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Exercise } from "../data/exercises";
import { exercises as builtinExercises } from "../data/exercises";
import { slugify } from "../helpers/slugify";
import { useAuth } from "./AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteCustomExerciseByUniqueName,
  fetchCustomExercises,
  insertCustomExercise,
  toExercise,
  updateCustomExerciseByUniqueName,
} from "../services/exercisesDb";

type CustomExercisesContextValue = {
  customExercises: Exercise[];
  allExercises: Exercise[];
  addCustomExercise: (exercise: Omit<Exercise, "unique_name">) => void;
  updateCustomExercise: (
    uniqueName: string,
    exercise: Omit<Exercise, "unique_name">,
  ) => void;
  removeCustomExercise: (uniqueName: string) => void;
};

const CustomExercisesContext = createContext<CustomExercisesContextValue | null>(null);

export function CustomExercisesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const customExercisesQuery = useQuery({
    queryKey: ["customExercises", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await fetchCustomExercises(userId!);
      if (error) throw error;
      return (data ?? []).map(toExercise);
    },
  });

  const customExercises = customExercisesQuery.data ?? [];
  const allExercises = useMemo(
    () => [...builtinExercises, ...customExercises],
    [customExercises],
  );

  const addMutation = useMutation({
    mutationFn: async (exercise: Omit<Exercise, "unique_name">) => {
      if (!userId) return;
      const baseSlug = "custom_" + slugify(exercise.name);
      if (!baseSlug.replace("custom_", "")) return;

      const existing = [...builtinExercises, ...(customExercisesQuery.data ?? [])];
      let uniqueName = baseSlug;
      let n = 0;
      while (existing.some((e) => e.unique_name === uniqueName)) {
        n += 1;
        uniqueName = `${baseSlug}_${n}`;
      }

      const { error } = await insertCustomExercise({
        user_id: userId,
        unique_name: uniqueName,
        name: exercise.name.trim(),
        weight: Boolean(exercise.weight),
        reps: Boolean(exercise.reps),
        time: Boolean(exercise.time),
        main_muscle_group: exercise.main_muscle_group ?? "",
        all_muscle_groups: exercise.all_muscle_groups ?? [],
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customExercises", userId] });
    },
  });

  const addCustomExercise = useCallback(
    (exercise: Omit<Exercise, "unique_name">) => {
      addMutation.mutate(exercise);
    },
    [addMutation],
  );

  const updateMutation = useMutation({
    mutationFn: async ({
      uniqueName,
      exercise,
    }: {
      uniqueName: string;
      exercise: Omit<Exercise, "unique_name">;
    }) => {
      if (!userId) return;
      const { error } = await updateCustomExerciseByUniqueName(userId, uniqueName, {
        name: exercise.name.trim(),
        weight: Boolean(exercise.weight),
        reps: Boolean(exercise.reps),
        time: Boolean(exercise.time),
        main_muscle_group: exercise.main_muscle_group ?? "",
        all_muscle_groups: exercise.all_muscle_groups ?? [],
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customExercises", userId] });
    },
  });

  const updateCustomExercise = useCallback(
    (uniqueName: string, exercise: Omit<Exercise, "unique_name">) => {
      updateMutation.mutate({ uniqueName, exercise });
    },
    [updateMutation],
  );

  const removeMutation = useMutation({
    mutationFn: async (uniqueName: string) => {
      if (!userId) return;
      const { error } = await deleteCustomExerciseByUniqueName(userId, uniqueName);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customExercises", userId] });
    },
  });

  const removeCustomExercise = useCallback((uniqueName: string) => {
    removeMutation.mutate(uniqueName);
  }, [removeMutation]);

  return (
    <CustomExercisesContext.Provider
      value={{
        customExercises,
        allExercises,
        addCustomExercise,
        updateCustomExercise,
        removeCustomExercise,
      }}
    >
      {children}
    </CustomExercisesContext.Provider>
  );
}

export function useCustomExercises() {
  const v = useContext(CustomExercisesContext);
  if (v === null)
    throw new Error("useCustomExercises must be used within CustomExercisesProvider");
  return v;
}

export function useAllExercises(): Exercise[] {
  const ctx = useContext(CustomExercisesContext);
  if (ctx === null) return builtinExercises;
  return ctx.allExercises;
}
