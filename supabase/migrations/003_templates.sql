create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  exercise_unique_names text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint templates_name_not_empty check (length(trim(name)) > 0)
);

create index if not exists templates_user_id_idx on public.templates (user_id);
create unique index if not exists templates_user_name_unique
  on public.templates (user_id, lower(name));

alter table public.templates enable row level security;

create policy "templates_select_own"
  on public.templates for select
  using (auth.uid() = user_id);

create policy "templates_insert_own"
  on public.templates for insert
  with check (auth.uid() = user_id);

create policy "templates_update_own"
  on public.templates for update
  using (auth.uid() = user_id);

create policy "templates_delete_own"
  on public.templates for delete
  using (auth.uid() = user_id);

