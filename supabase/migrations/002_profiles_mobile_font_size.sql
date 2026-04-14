alter table public.profiles
  add column if not exists mobile_font_size_mode text not null default 'standard'
    check (mobile_font_size_mode in ('standard', 'enlarged'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    name,
    weight_kg,
    height_cm,
    gender,
    locale,
    weight_unit,
    mobile_font_size_mode
  )
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
      then trim(new.raw_user_meta_data->>'weight_unit') else 'kg' end,
    case when trim(coalesce(new.raw_user_meta_data->>'mobile_font_size_mode', '')) in ('standard', 'enlarged')
      then trim(new.raw_user_meta_data->>'mobile_font_size_mode') else 'standard' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
