begin;

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

commit;