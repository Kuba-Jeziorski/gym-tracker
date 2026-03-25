create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  weight_kg double precision,
  height_cm double precision,
  gender text check (gender is null or gender in ('male', 'female')),
  locale text not null default 'en' check (locale in ('en', 'pl')),
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, weight_kg, height_cm, gender, locale, weight_unit)
  values (
    new.id,
    coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'name', '')), ''), ''),
    nullif(nullif(trim(coalesce(new.raw_user_meta_data->>'weight_kg', '')), ''), '')::double precision,
    nullif(nullif(trim(coalesce(new.raw_user_meta_data->>'height_cm', '')), ''), '')::double precision,
    case when trim(coalesce(new.raw_user_meta_data->>'gender', '')) in ('male', 'female')
      then trim(new.raw_user_meta_data->>'gender') else null end,
    case when trim(coalesce(new.raw_user_meta_data->>'locale', '')) in ('en', 'pl')
      then trim(new.raw_user_meta_data->>'locale') else 'en' end,
    case when trim(coalesce(new.raw_user_meta_data->>'weight_unit', '')) in ('kg', 'lb')
      then trim(new.raw_user_meta_data->>'weight_unit') else 'kg' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
