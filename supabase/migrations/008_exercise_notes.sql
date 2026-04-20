create table if not exists public.exercise_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_unique_name text not null,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_notes_unique_per_user_exercise unique (user_id, exercise_unique_name)
);

create index if not exists exercise_notes_user_id_idx on public.exercise_notes (user_id);

alter table public.exercise_notes enable row level security;

create policy "exercise_notes_select_own"
  on public.exercise_notes for select
  using (auth.uid() = user_id);

create policy "exercise_notes_insert_own"
  on public.exercise_notes for insert
  with check (auth.uid() = user_id);

create policy "exercise_notes_update_own"
  on public.exercise_notes for update
  using (auth.uid() = user_id);

create policy "exercise_notes_delete_own"
  on public.exercise_notes for delete
  using (auth.uid() = user_id);
