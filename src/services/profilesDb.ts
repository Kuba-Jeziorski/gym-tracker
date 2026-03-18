import { supabase } from "./supabaseClient";

export type ProfileRow = {
  id: string;
  name: string;
  weight_kg: number | null;
  height_cm: number | null;
  gender: string | null;
  locale: string;
  weight_unit: string;
};

export type ProfileUpsert = {
  name?: string;
  weight_kg?: number | null;
  height_cm?: number | null;
  gender?: string | null;
  locale?: string;
  weight_unit?: string;
};

export async function fetchProfile(userId: string) {
  return supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
}

/** Sends POST to Supabase REST (`profiles` upsert). */
export async function upsertProfile(userId: string, patch: ProfileUpsert) {
  return supabase.from("profiles").upsert(
    { id: userId, ...patch, updated_at: new Date().toISOString() },
    { onConflict: "id" }
  );
}
