-- Custom exercises only (built-in exercises live in the app code).

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  unique_name text not null,
  name text not null,
  main_muscle_group text not null default '',
  all_muscle_groups text[] not null default '{}',
  weight boolean not null default false,
  reps boolean not null default false,
  time boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_unique_name_not_empty check (length(trim(unique_name)) > 0),
  constraint exercises_name_not_empty check (length(trim(name)) > 0),
  constraint exercises_unique_per_user unique (user_id, unique_name)
);

create index if not exists exercises_user_id_idx on public.exercises (user_id);

alter table public.exercises enable row level security;

create policy "exercises_select_own"
  on public.exercises for select
  using (auth.uid() = user_id);

create policy "exercises_insert_own"
  on public.exercises for insert
  with check (auth.uid() = user_id);

create policy "exercises_update_own"
  on public.exercises for update
  using (auth.uid() = user_id);

create policy "exercises_delete_own"
  on public.exercises for delete
  using (auth.uid() = user_id);

