import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { WorkoutTemplate } from "../data/workoutTemplates";

export type TemplateRow = {
  id: string;
  user_id: string;
  name: string;
  exercise_unique_names: string[];
  created_at: string;
  updated_at: string;
};

export type TemplateInsert = Omit<
  TemplateRow,
  "id" | "created_at" | "updated_at"
>;

export type TemplateUpdate = Partial<
  Pick<TemplateRow, "name" | "exercise_unique_names" | "updated_at">
>;

export function toWorkoutTemplate(row: TemplateRow): WorkoutTemplate {
  return {
    id: row.id,
    name: row.name,
    exerciseUniqueNames: row.exercise_unique_names ?? [],
  };
}

export async function fetchTemplates(userId: string) {
  return supabase
    .from("templates")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
}

export async function insertTemplate(row: TemplateInsert): Promise<{
  data: TemplateRow | null;
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from("templates")
    .insert(row)
    .select("*")
    .single();
  return { data: (data as TemplateRow | null) ?? null, error };
}

export async function updateTemplateById(
  userId: string,
  id: string,
  patch: TemplateUpdate,
) {
  return supabase
    .from("templates")
    .update(patch)
    .eq("user_id", userId)
    .eq("id", id);
}

export async function deleteTemplateById(userId: string, id: string) {
  return supabase.from("templates").delete().eq("user_id", userId).eq("id", id);
}

