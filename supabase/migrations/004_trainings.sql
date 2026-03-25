create table if not exists public.trainings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  template_id uuid references public.templates (id) on delete set null,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  exercises jsonb not null default '[]'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trainings_completed_after_started check (completed_at >= started_at),
  constraint trainings_exercises_is_array check (jsonb_typeof(exercises) = 'array')
);

create index if not exists trainings_user_id_idx on public.trainings (user_id);
create index if not exists trainings_user_completed_at_idx
  on public.trainings (user_id, completed_at desc);

alter table public.trainings enable row level security;

create policy "trainings_select_own"
  on public.trainings for select
  using (auth.uid() = user_id);

create policy "trainings_insert_own"
  on public.trainings for insert
  with check (auth.uid() = user_id);

create policy "trainings_update_own"
  on public.trainings for update
  using (auth.uid() = user_id);

create policy "trainings_delete_own"
  on public.trainings for delete
  using (auth.uid() = user_id);

