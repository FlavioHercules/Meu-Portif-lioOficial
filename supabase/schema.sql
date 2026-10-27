-- =========================================================
-- MotionFit - Supabase SQL Schema
-- =========================================================

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.usuarios') is null and to_regclass('public.profiles') is not null then
    alter table public.profiles rename to usuarios;
  end if;
end;
$$;

-- =========================================================
-- 1. Users / auth linkage
-- =========================================================
create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  member_since timestamptz not null default now(),
  discipline text default 'Disciplina hoje, resultados amanhã.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.usuarios(id) on delete cascade,
  dark_mode boolean not null default true,
  interface_theme text not null default 'Neon',
  font_size text not null default 'Normal',
  notifications_workouts boolean not null default true,
  notifications_goals boolean not null default true,
  notifications_dicas boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- 2. Goals / training preferences
-- =========================================================
create table if not exists public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.usuarios(id) on delete cascade,
  objective text not null,
  level text not null,
  available_time text not null,
  weekly_frequency text not null,
  equipment text not null,
  current_goal text,
  progress_percent integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pesquisa (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.usuarios(id) on delete cascade,
  objective text not null,
  training_preferences text[] not null default '{}',
  training_days text[] not null default '{}',
  experience_level text not null,
  weekly_frequency text not null,
  available_time text not null,
  training_location text not null,
  equipment text not null default 'Academia completa',
  gender text not null,
  age smallint not null,
  experience_months smallint not null default 0,
  limitations text[] not null default '{}',
  height_cm numeric(5,2) not null,
  weight_kg numeric(5,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- 3. Plans and subscriptions
-- =========================================================
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  price_monthly numeric(10,2) not null default 0,
  price_yearly numeric(10,2) not null default 0,
  description text,
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.usuarios(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  billing_cycle text not null check (billing_cycle in ('mensal', 'anual')),
  status text not null default 'active' check (status in ('pending', 'active', 'canceled', 'trialing', 'past_due', 'expired', 'unpaid')),
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  provider text,
  provider_subscription_id text,
  renews_at timestamptz,
  canceled_at timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now()
);

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

-- =========================================================
-- 4. Exercises library
-- =========================================================
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  muscle_group text,
  equipment text,
  equipment_options text[] not null default '{}',
  difficulty text not null default 'intermediario',
  exercise_type text not null default 'composto' check (exercise_type in ('composto', 'isolado')),
  suggested_sets smallint not null default 3 check (suggested_sets between 1 and 10),
  suggested_reps text not null default '8-12',
  active boolean not null default true,
  modality text not null default 'Academia',
  objectives text[] not null default '{}',
  muscles text[] not null default '{}',
  movement_pattern text,
  unilateral boolean not null default false,
  impact_level text not null default 'baixo',
  instructions jsonb not null default '[]'::jsonb,
  progressions text[] not null default '{}',
  regressions text[] not null default '{}',
  description text,
  video_url text,
  demo_image_url text,
  created_at timestamptz not null default now()
);

alter table public.exercises add column if not exists equipment_options text[] not null default '{}';
alter table public.exercises add column if not exists exercise_type text not null default 'composto';
alter table public.exercises add column if not exists suggested_sets smallint not null default 3;
alter table public.exercises add column if not exists suggested_reps text not null default '8-12';
alter table public.exercises add column if not exists active boolean not null default true;

create index if not exists idx_exercises_active_category on public.exercises(active, category);

-- =========================================================
-- 5. Workout templates
-- =========================================================
create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.usuarios(id) on delete cascade,
  name text not null,
  objective text not null,
  level text not null,
  duration_min integer not null default 45,
  weekly_frequency text not null default '4x por semana',
  equipment text not null default 'Academia completa',
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position integer not null default 1,
  sets integer not null default 3,
  reps text not null default '10-12',
  rest_seconds integer not null default 60,
  notes text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 6. Workout sessions and progress
-- =========================================================
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.usuarios(id) on delete cascade,
  workout_id uuid references public.workout_templates(id) on delete set null,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'canceled')),
  scheduled_for date,
  workout_title text,
  duration_min integer,
  plan_inputs jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  score integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  template_exercise_id uuid not null references public.workout_template_exercises(id) on delete restrict,
  completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.progress_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.usuarios(id) on delete cascade,
  metric_date date not null default current_date,
  weight numeric(5,2),
  body_fat numeric(5,2),
  muscle_mass numeric(5,2),
  workouts_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, metric_date)
);

-- =========================================================
-- 7. Notifications
-- =========================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.usuarios(id) on delete cascade,
  category text not null check (category in ('Treinos', 'Planos', 'Sistema')),
  icon text,
  title text not null,
  description text not null,
  workout_session_id uuid references public.workout_sessions(id) on delete cascade,
  source_key text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_notifications_user_source_key
  on public.notifications(user_id, source_key);

create table if not exists public.artemis_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.usuarios(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  message_type text not null default 'chat' check (message_type in ('chat', 'workout')),
  content text not null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 8. Indexes
-- =========================================================
create index if not exists idx_usuarios_email on public.usuarios(email);
create index if not exists idx_user_goals_user_id on public.user_goals(user_id);
create index if not exists idx_pesquisa_user_id on public.pesquisa(user_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_artemis_messages_user_created on public.artemis_messages(user_id, created_at desc);
create index if not exists idx_workout_templates_user_id on public.workout_templates(user_id);
create index if not exists idx_workout_sessions_user_id on public.workout_sessions(user_id);
create index if not exists idx_workout_sessions_user_scheduled_for on public.workout_sessions(user_id, scheduled_for);
create index if not exists idx_progress_metrics_user_id on public.progress_metrics(user_id);

-- =========================================================
-- 9. Trigger to update timestamps
-- =========================================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on public.usuarios;
drop trigger if exists trg_usuarios_updated_at on public.usuarios;
create trigger trg_usuarios_updated_at
before update on public.usuarios
for each row execute procedure public.update_updated_at_column();

drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at
before update on public.user_settings
for each row execute procedure public.update_updated_at_column();

drop trigger if exists trg_user_goals_updated_at on public.user_goals;
create trigger trg_user_goals_updated_at
before update on public.user_goals
for each row execute procedure public.update_updated_at_column();

drop trigger if exists trg_pesquisa_updated_at on public.pesquisa;
create trigger trg_pesquisa_updated_at
before update on public.pesquisa
for each row execute procedure public.update_updated_at_column();

-- =========================================================
-- 10. Auto create profile and settings on signup
-- =========================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.usuarios (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', 'Usuário'))
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

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

-- =========================================================
-- 11. RLS
-- =========================================================
alter table public.usuarios enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_goals enable row level security;
alter table public.pesquisa enable row level security;
alter table public.plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.artemis_free_usage enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_session_exercises enable row level security;
alter table public.progress_metrics enable row level security;
alter table public.notifications enable row level security;
alter table public.artemis_messages enable row level security;

drop policy if exists profiles_select_own on public.usuarios;
drop policy if exists usuarios_select_own on public.usuarios;
create policy "usuarios_select_own" on public.usuarios
for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.usuarios;
drop policy if exists usuarios_update_own on public.usuarios;
create policy "usuarios_update_own" on public.usuarios
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists settings_select_own on public.user_settings;
create policy "settings_select_own" on public.user_settings
for select using (auth.uid() = user_id);

drop policy if exists settings_update_own on public.user_settings;
create policy "settings_update_own" on public.user_settings
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists goals_manage_own on public.user_goals;
create policy "goals_manage_own" on public.user_goals
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists pesquisa_manage_own on public.pesquisa;
create policy "pesquisa_manage_own" on public.pesquisa
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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
revoke all on function public.artemis_check_access(uuid) from public, anon, authenticated;
revoke all on function public.artemis_reserve_access(uuid, uuid) from public, anon, authenticated;
revoke all on function public.artemis_complete_free_usage(uuid, uuid) from public, anon, authenticated;
revoke all on function public.artemis_release_free_usage(uuid, uuid) from public, anon, authenticated;
grant execute on function public.artemis_check_access(uuid) to service_role;
grant execute on function public.artemis_reserve_access(uuid, uuid) to service_role;
grant execute on function public.artemis_complete_free_usage(uuid, uuid) to service_role;
grant execute on function public.artemis_release_free_usage(uuid, uuid) to service_role;

drop policy if exists plans_read_all on public.plans;
create policy "plans_read_all" on public.plans
for select using (auth.role() = 'authenticated');

drop policy if exists exercises_read_all on public.exercises;
create policy "exercises_read_all" on public.exercises
for select using (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public, allowed_mime_types)
values ('exercise-videos', 'exercise-videos', true, array['video/mp4'])
on conflict (id) do update
set public = excluded.public,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists workout_templates_manage_own on public.workout_templates;
create policy "workout_templates_manage_own" on public.workout_templates
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists workout_template_exercises_manage_own on public.workout_template_exercises;
create policy "workout_template_exercises_manage_own" on public.workout_template_exercises
for all using (
  exists (
    select 1 from public.workout_templates wt
    where wt.id = workout_template_exercises.workout_id
      and wt.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.workout_templates wt
    where wt.id = workout_template_exercises.workout_id
      and wt.user_id = auth.uid()
  )
);

drop policy if exists workout_sessions_manage_own on public.workout_sessions;
create policy "workout_sessions_manage_own" on public.workout_sessions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists workout_session_exercises_manage_own on public.workout_session_exercises;
create policy "workout_session_exercises_manage_own" on public.workout_session_exercises
for all using (
  exists (
    select 1 from public.workout_sessions ws
    where ws.id = workout_session_exercises.session_id
      and ws.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.workout_sessions ws
    where ws.id = workout_session_exercises.session_id
      and ws.user_id = auth.uid()
  )
);

drop policy if exists progress_manage_own on public.progress_metrics;
create policy "progress_manage_own" on public.progress_metrics
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists notifications_manage_own on public.notifications;
create policy "notifications_manage_own" on public.notifications
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists artemis_messages_manage_own on public.artemis_messages;
create policy "artemis_messages_manage_own" on public.artemis_messages
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- 12. Seed data (examples)
-- =========================================================
insert into public.plans (id, name, slug, price_monthly, price_yearly, description, features, active)
values
  (
    gen_random_uuid(),
    'Starter',
    'starter',
    29.90,
    299.90,
    'Para quem está começando e quer acompanhamento essencial.',
    '["Treino IA básico", "Acompanhamento de progresso", "3 planos da semana"]'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'Pro',
    'pro',
    59.90,
    599.90,
    'Plano completo para evolução constante e acompanhamento avançado.',
    '["Treino IA personalizado", "Acesso completo à biblioteca", "Relatórios de performance"]'::jsonb,
    true
  ),
  (
    gen_random_uuid(),
    'Elite',
    'elite',
    99.90,
    999.90,
    'Experiência premium com suporte máximo e revisão de treinos.',
    '["Tudo do Pro", "Consultoria prioritária", "Suporte e relatórios premium"]'::jsonb,
    true
  )
 on conflict do nothing;

insert into public.exercises (
  id, name, category, muscle_group, equipment, equipment_options, difficulty,
  exercise_type, suggested_sets, suggested_reps, active, modality, objectives,
  muscles, movement_pattern, unilateral, impact_level, instructions, description
)
select
  gen_random_uuid(), seed.name, seed.category, seed.muscle_group, seed.equipment,
  seed.equipment_options, seed.difficulty, seed.exercise_type, seed.suggested_sets,
  seed.suggested_reps, true, 'Academia', seed.objectives, seed.muscles,
  seed.movement_pattern, false, 'baixo', '[]'::jsonb, seed.description
from (values
  ('Supino reto com barra', 'Peito', 'Peito', 'Barra e banco', array['barra', 'banco']::text[], 'Intermediário', 'composto', 3::smallint, '6-10', array['hipertrofia', 'forca']::text[], array['peitoral', 'triceps', 'deltoides anterior']::text[], 'Empurrar horizontal', 'Exercício composto para peitoral, tríceps e deltoide anterior.'),
  ('Agachamento livre', 'Quadríceps', 'Quadríceps', 'Barra e rack', array['barra', 'rack']::text[], 'Intermediário', 'composto', 3::smallint, '6-10', array['hipertrofia', 'forca']::text[], array['quadriceps', 'gluteos', 'posteriores']::text[], 'Agachar', 'Exercício composto para membros inferiores.'),
  ('Levantamento terra romeno', 'Posterior de coxa', 'Posterior de coxa', 'Barra', array['barra']::text[], 'Intermediário', 'composto', 3::smallint, '8-12', array['hipertrofia', 'forca']::text[], array['posteriores', 'gluteos', 'eretores da espinha']::text[], 'Hinge', 'Exercício composto com ênfase em posteriores de coxa e glúteos.'),
  ('Remada curvada com barra', 'Costas', 'Costas', 'Barra', array['barra']::text[], 'Intermediário', 'composto', 3::smallint, '8-12', array['hipertrofia', 'forca']::text[], array['dorsais', 'romboides', 'trapezio', 'biceps']::text[], 'Puxar horizontal', 'Exercício composto para costas e bíceps.'),
  ('Rosca direta com barra', 'Bíceps', 'Bíceps', 'Barra', array['barra']::text[], 'Iniciante', 'isolado', 3::smallint, '8-12', array['hipertrofia']::text[], array['biceps', 'antebracos']::text[], 'Flexão de cotovelo', 'Exercício isolado para bíceps.'),
  ('Prancha', 'Abdômen', 'Abdômen', 'Peso corporal e colchonete', array['peso corporal', 'colchonete']::text[], 'Iniciante', 'isolado', 3::smallint, '20-60 segundos', array['resistencia', 'estabilidade']::text[], array['abdomen', 'obliquos']::text[], 'Anti-extensão isométrica', 'Isometria para estabilidade do tronco; tempo é uma sugestão ajustável.')
) as seed(name, category, muscle_group, equipment, equipment_options, difficulty, exercise_type, suggested_sets, suggested_reps, objectives, muscles, movement_pattern, description)
where not exists (
  select 1 from public.exercises existing
  where lower(trim(existing.name)) = lower(trim(seed.name))
)
on conflict do nothing;

-- =========================================================
-- 13. Notes
-- =========================================================
-- Use the Supabase Auth dashboard to create users and sign in.
-- After sign-in, the trigger creates the profile and user_settings automatically.
