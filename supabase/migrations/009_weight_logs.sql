create table if not exists public.weight_logs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  measurements jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint weight_logs_measurements_is_array check (jsonb_typeof(measurements) = 'array')
);

alter table public.weight_logs enable row level security;

create policy "weight_logs_select_own"
  on public.weight_logs for select
  using (auth.uid() = user_id);

create policy "weight_logs_insert_own"
  on public.weight_logs for insert
  with check (auth.uid() = user_id);

create policy "weight_logs_update_own"
  on public.weight_logs for update
  using (auth.uid() = user_id);

create policy "weight_logs_delete_own"
  on public.weight_logs for delete
  using (auth.uid() = user_id);
