begin;

alter table public.pesquisa add column if not exists equipment text not null default 'Academia completa';
alter table public.pesquisa add column if not exists gender text;
alter table public.pesquisa add column if not exists height_cm numeric(5,2);
alter table public.pesquisa add column if not exists weight_kg numeric(5,2);

alter table public.workout_sessions add column if not exists scheduled_for date;
alter table public.workout_sessions add column if not exists workout_title text;
alter table public.workout_sessions add column if not exists duration_min integer;
alter table public.workout_sessions add column if not exists plan_inputs jsonb not null default '{}'::jsonb;
create index if not exists idx_workout_sessions_user_scheduled_for on public.workout_sessions(user_id, scheduled_for);

commit;