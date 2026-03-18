-- Allow users to delete their own auth account from the client.
-- This must be created by an admin (SQL editor / migration runner).

create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users
  where id = auth.uid();
end;
$$;

revoke all on function public.delete_current_user() from public;
grant execute on function public.delete_current_user() to authenticated;

