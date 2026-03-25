alter table public.exercises
  add column if not exists distance boolean not null default false,
  add column if not exists avg_velocity boolean not null default false,
  add column if not exists pace boolean not null default false;

