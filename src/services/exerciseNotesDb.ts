import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export type ExerciseNoteRow = {
  id: string;
  user_id: string;
  exercise_unique_name: string;
  note: string;
  created_at: string;
  updated_at: string;
};

export async function fetchExerciseNotes(userId: string) {
  return supabase
    .from("exercise_notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
}

export async function upsertExerciseNote(
  userId: string,
  exerciseUniqueName: string,
  note: string,
): Promise<{
  data: ExerciseNoteRow | null;
  error: PostgrestError | null;
}> {
  const { data, error } = await supabase
    .from("exercise_notes")
    .upsert(
      {
        user_id: userId,
        exercise_unique_name: exerciseUniqueName,
        note,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,exercise_unique_name" },
    )
    .select("*")
    .single();
  return { data: (data as ExerciseNoteRow | null) ?? null, error };
}

export async function deleteExerciseNote(
  userId: string,
  exerciseUniqueName: string,
) {
  return supabase
    .from("exercise_notes")
    .delete()
    .eq("user_id", userId)
    .eq("exercise_unique_name", exerciseUniqueName);
}
