begin;

alter table public.user_subscriptions
  add column if not exists provider text,
  add column if not exists provider_subscription_id text,
  add column if not exists renews_at timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false;

alter table public.user_subscriptions
  drop constraint if exists user_subscriptions_status_check;

alter table public.user_subscriptions
  add constraint user_subscriptions_status_check
  check (status in ('pending', 'active', 'canceled', 'trialing', 'past_due', 'expired', 'unpaid'));

create unique index if not exists idx_user_subscriptions_provider_id
  on public.user_subscriptions(provider, provider_subscription_id)
  where provider is not null and provider_subscription_id is not null;

create table if not exists public.artemis_free_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  free_used_at timestamptz,
  reservation_request_id uuid,
  reservation_expires_at timestamptz,
  last_request_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artemis_free_usage_reservation_check check (
    (reservation_request_id is null and reservation_expires_at is null)
    or (reservation_request_id is not null and reservation_expires_at is not null)
  )
);

create index if not exists idx_artemis_free_usage_reservation_expiry
  on public.artemis_free_usage(reservation_expires_at)
  where reservation_expires_at is not null;

alter table public.user_subscriptions enable row level security;
alter table public.artemis_free_usage enable row level security;

drop policy if exists subscriptions_manage_own on public.user_subscriptions;
drop policy if exists subscriptions_select_own on public.user_subscriptions;
drop policy if exists subscriptions_insert_pending on public.user_subscriptions;
drop policy if exists subscriptions_update_pending on public.user_subscriptions;

create policy subscriptions_select_own on public.user_subscriptions
for select using (auth.uid() = user_id);

create policy subscriptions_insert_pending on public.user_subscriptions
for insert with check (auth.uid() = user_id and status = 'pending');

create policy subscriptions_update_pending on public.user_subscriptions
for update using (auth.uid() = user_id and status = 'pending')
with check (auth.uid() = user_id and status in ('pending', 'canceled'));

revoke all on public.artemis_free_usage from anon, authenticated;
grant all on public.artemis_free_usage to service_role;

create or replace function public.artemis_check_access(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  usage_row public.artemis_free_usage%rowtype;
  has_premium boolean;
  is_reserved boolean;
begin
  select exists (
    select 1
    from public.user_subscriptions subscription
    where subscription.user_id = p_user_id
      and subscription.status in ('active', 'trialing')
      and subscription.started_at <= now()
      and subscription.ends_at > now()
  ) into has_premium;

  select * into usage_row
  from public.artemis_free_usage
  where user_id = p_user_id;

  is_reserved := coalesce(usage_row.reservation_expires_at > now(), false);

  return jsonb_build_object(
    'premium', has_premium,
    'free_available', not has_premium
      and usage_row.free_used_at is null
      and not is_reserved,
    'free_in_progress', not has_premium and is_reserved,
    'requires_subscription', not has_premium and usage_row.free_used_at is not null
  );
end;
$$;

create or replace function public.artemis_reserve_access(p_user_id uuid, p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  usage_row public.artemis_free_usage%rowtype;
begin
  if p_user_id is null or p_request_id is null then
    raise exception 'User and request identifiers are required';
  end if;

  if exists (
    select 1
    from public.user_subscriptions subscription
    where subscription.user_id = p_user_id
      and subscription.status in ('active', 'trialing')
      and subscription.started_at <= now()
      and subscription.ends_at > now()
  ) then
    return jsonb_build_object('status', 'premium');
  end if;

  insert into public.artemis_free_usage (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select * into usage_row
  from public.artemis_free_usage
  where user_id = p_user_id
  for update;

  if usage_row.free_used_at is not null then
    return jsonb_build_object('status', 'subscription_required');
  end if;

  if usage_row.reservation_expires_at > now() then
    return jsonb_build_object('status', 'in_progress');
  end if;

  update public.artemis_free_usage
  set reservation_request_id = p_request_id,
      reservation_expires_at = now() + interval '10 minutes',
      updated_at = now()
  where user_id = p_user_id;

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
  if exists (
    select 1
    from public.user_subscriptions subscription
    where subscription.user_id = p_user_id
      and subscription.status in ('active', 'trialing')
      and subscription.started_at <= now()
      and subscription.ends_at > now()
  ) then
    update public.artemis_free_usage
    set reservation_request_id = null,
        reservation_expires_at = null,
        updated_at = now()
    where user_id = p_user_id
      and reservation_request_id = p_request_id
      and free_used_at is null;

    return jsonb_build_object('status', 'premium');
  end if;

  update public.artemis_free_usage
  set free_used_at = now(),
      last_request_id = p_request_id,
      reservation_request_id = null,
      reservation_expires_at = null,
      updated_at = now()
  where user_id = p_user_id
    and reservation_request_id = p_request_id
    and reservation_expires_at > now()
    and free_used_at is null;

  if found then
    return jsonb_build_object('status', 'completed');
  end if;

  if exists (
    select 1
    from public.artemis_free_usage
    where user_id = p_user_id
      and free_used_at is not null
      and last_request_id = p_request_id
  ) then
    return jsonb_build_object('status', 'completed');
  end if;

  return jsonb_build_object('status', 'reservation_lost');
end;
$$;

create or replace function public.artemis_release_free_usage(p_user_id uuid, p_request_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.artemis_free_usage
  set reservation_request_id = null,
      reservation_expires_at = null,
      updated_at = now()
  where user_id = p_user_id
    and reservation_request_id = p_request_id
    and free_used_at is null;

  return found;
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
