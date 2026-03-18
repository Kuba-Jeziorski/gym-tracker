# Supabase setup

## Profiles (required)

Run the SQL in **`migrations/001_profiles.sql`** in the Supabase Dashboard → **SQL Editor** (once per project).

This creates:

- `public.profiles` — name, weight (kg), height (cm), gender, language (`en`/`pl`), weight unit (`kg`/`lb`)
- RLS so users only read/update their own row
- Trigger on new auth users: inserts a profile row from **sign-up metadata** (`Auth` → `signUp` options)

Existing users without a row get a default profile on first app load after login.

You can clear old client keys from the browser if you like: `gym-tracker-user-profile`, `gym-tracker-weight-unit`, `gym-tracker-locale`.
