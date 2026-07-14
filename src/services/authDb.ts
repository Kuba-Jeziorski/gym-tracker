import { supabase } from "./supabaseClient";
import { routes } from "../routes";

export async function changeEmail(newEmail: string) {
  const trimmed = newEmail.trim();
  const emailRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}${routes.user}`
      : undefined;

  return supabase.auth.updateUser(
    { email: trimmed },
    emailRedirectTo ? { emailRedirectTo } : undefined
  );
}
