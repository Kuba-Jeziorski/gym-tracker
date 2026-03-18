import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { Exercise } from "../data/exercises";

export type ExerciseRow = {
  id: string;
  user_id: string;
  unique_name: string;
  name: string;
  main_muscle_group: string;
  all_muscle_groups: string[];
  weight: boolean;
  reps: boolean;
  time: boolean;
  created_at: string;
  updated_at: string;
};

export type ExerciseInsert = Omit<
  ExerciseRow,
  "id" | "created_at" | "updated_at"
>;

export type ExerciseUpdate = Partial<
  Pick<
    ExerciseRow,
    | "name"
    | "main_muscle_group"
    | "all_muscle_groups"
    | "weight"
    | "reps"
    | "time"
    | "updated_at"
  >
>;

export function toExercise(row: ExerciseRow): Exercise {
  return {
    unique_name: row.unique_name,
    name: row.name,
    main_muscle_group: row.main_muscle_group ?? "",
    all_muscle_groups: row.all_muscle_groups ?? [],
    weight: row.weight,
    reps: row.reps,
    time: row.time,
  };
}

export async function fetchCustomExercises(userId: string) {
  return supabase
    .from("exercises")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
}

export async function insertCustomExercise(row: ExerciseInsert): Promise<{
  data: ExerciseRow | null;
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from("exercises")
    .insert(row)
    .select("*")
    .single();
  return { data: (data as ExerciseRow | null) ?? null, error };
}

export async function updateCustomExerciseByUniqueName(
  userId: string,
  uniqueName: string,
  patch: ExerciseUpdate,
) {
  return supabase
    .from("exercises")
    .update(patch)
    .eq("user_id", userId)
    .eq("unique_name", uniqueName);
}

export async function deleteCustomExerciseByUniqueName(
  userId: string,
  uniqueName: string,
) {
  return supabase
    .from("exercises")
    .delete()
    .eq("user_id", userId)
    .eq("unique_name", uniqueName);
}

