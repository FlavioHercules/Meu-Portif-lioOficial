begin;

alter table public.user_subscriptions
  drop constraint if exists user_subscriptions_status_check;

alter table public.user_subscriptions
  add constraint user_subscriptions_status_check
  check (status in ('pending', 'active', 'canceled', 'trialing', 'past_due'));

commit;