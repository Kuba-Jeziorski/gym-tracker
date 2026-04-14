import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { StoredWorkout } from "../data/workoutStorage";

export type TrainingRow = {
  id: string;
  user_id: string;
  template_id: string | null;
  template_name?: string | null;
  started_at: string;
  completed_at: string;
  exercises: unknown;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type TrainingInsert = Pick<
  TrainingRow,
  | "id"
  | "user_id"
  | "template_id"
  | "template_name"
  | "started_at"
  | "completed_at"
  | "exercises"
  | "notes"
>;

export type TrainingUpdate = Partial<
  Pick<
    TrainingRow,
    | "template_id"
    | "template_name"
    | "started_at"
    | "completed_at"
    | "exercises"
    | "notes"
    | "updated_at"
  >
>;

export function toStoredWorkout(row: TrainingRow): StoredWorkout {
  return {
    id: row.id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    templateId: row.template_id,
    templateName: row.template_name,
    notes: row.notes ?? "",
    exercises: (Array.isArray(row.exercises) ? row.exercises : []) as StoredWorkout["exercises"],
  };
}

export async function fetchTrainings(userId: string) {
  return supabase
    .from("trainings")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false });
}

export async function upsertTraining(row: TrainingInsert): Promise<{
  data: TrainingRow | null;
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from("trainings")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single();
  return { data: (data as TrainingRow | null) ?? null, error };
}

export async function updateTrainingById(
  userId: string,
  id: string,
  patch: TrainingUpdate,
) {
  return supabase
    .from("trainings")
    .update(patch)
    .eq("user_id", userId)
    .eq("id", id);
}

export async function deleteTrainingById(userId: string, id: string) {
  return supabase.from("trainings").delete().eq("user_id", userId).eq("id", id);
}

