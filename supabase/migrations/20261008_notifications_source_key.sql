begin;

alter table public.notifications
  add column if not exists source_key text;

alter table public.notifications
  add column if not exists workout_session_id uuid references public.workout_sessions(id) on delete cascade;

create unique index if not exists idx_notifications_user_source_key
  on public.notifications(user_id, source_key);

commit;
