begin;

drop policy if exists subscriptions_manage_own on public.user_subscriptions;
drop policy if exists subscriptions_select_own on public.user_subscriptions;
drop policy if exists subscriptions_insert_pending on public.user_subscriptions;
drop policy if exists subscriptions_update_pending on public.user_subscriptions;
drop policy if exists plans_read_all on public.plans;

create or replace function public.artemis_check_access(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  return jsonb_build_object(
    'available', true,
    'premium', false,
    'free_available', true,
    'free_in_progress', false,
    'requires_subscription', false
  );
end;
$$;

create or replace function public.artemis_reserve_access(p_user_id uuid, p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null or p_request_id is null then
    raise exception 'User and request identifiers are required';
  end if;

  return jsonb_build_object('status', 'free');
end;
$$;

create or replace function public.artemis_complete_free_usage(p_user_id uuid, p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null or p_request_id is null then
    raise exception 'User and request identifiers are required';
  end if;

  return jsonb_build_object('status', 'completed');
end;
$$;

create or replace function public.artemis_release_free_usage(p_user_id uuid, p_request_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null or p_request_id is null then
    raise exception 'User and request identifiers are required';
  end if;

  return true;
end;
$$;

revoke all on function public.artemis_check_access(uuid) from public, anon, authenticated;
revoke all on function public.artemis_reserve_access(uuid, uuid) from public, anon, authenticated;
revoke all on function public.artemis_complete_free_usage(uuid, uuid) from public, anon, authenticated;
revoke all on function public.artemis_release_free_usage(uuid, uuid) from public, anon, authenticated;
grant execute on function public.artemis_check_access(uuid) to service_role;
grant execute on function public.artemis_reserve_access(uuid, uuid) to service_role;
grant execute on function public.artemis_complete_free_usage(uuid, uuid) to service_role;
grant execute on function public.artemis_release_free_usage(uuid, uuid) to service_role;

commit;
