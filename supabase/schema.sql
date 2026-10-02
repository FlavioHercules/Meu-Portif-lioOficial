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
  status text not null default 'active' check (status in ('active', 'canceled', 'trialing', 'past_due')),
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 4. Exercises library
-- =========================================================
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  muscle_group text,
  equipment text,
  difficulty text not null default 'intermediario',
  description text,
  video_url text,
  demo_image_url text,
  created_at timestamptz not null default now()
);

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
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 8. Indexes
-- =========================================================
create index if not exists idx_usuarios_email on public.usuarios(email);
create index if not exists idx_user_goals_user_id on public.user_goals(user_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_workout_templates_user_id on public.workout_templates(user_id);
create index if not exists idx_workout_sessions_user_id on public.workout_sessions(user_id);
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

create trigger trg_user_settings_updated_at
before update on public.user_settings
for each row execute procedure public.update_updated_at_column();

create trigger trg_user_goals_updated_at
before update on public.user_goals
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

-- =========================================================
-- 11. RLS
-- =========================================================
alter table public.usuarios enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_goals enable row level security;
alter table public.plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_session_exercises enable row level security;
alter table public.progress_metrics enable row level security;
alter table public.notifications enable row level security;

drop policy if exists profiles_select_own on public.usuarios;
drop policy if exists usuarios_select_own on public.usuarios;
create policy "usuarios_select_own" on public.usuarios
for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.usuarios;
drop policy if exists usuarios_update_own on public.usuarios;
create policy "usuarios_update_own" on public.usuarios
for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "settings_select_own" on public.user_settings
for select using (auth.uid() = user_id);

create policy "settings_update_own" on public.user_settings
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goals_manage_own" on public.user_goals
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "subscriptions_manage_own" on public.user_subscriptions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "plans_read_all" on public.plans
for select using (auth.role() = 'authenticated');

create policy "exercises_read_all" on public.exercises
for select using (auth.role() = 'authenticated');

create policy "workout_templates_manage_own" on public.workout_templates
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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

create policy "workout_sessions_manage_own" on public.workout_sessions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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

create policy "progress_manage_own" on public.progress_metrics
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notifications_manage_own" on public.notifications
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

insert into public.exercises (id, name, category, muscle_group, equipment, difficulty, description)
values
  (gen_random_uuid(), 'Supino reto', 'Peito', 'Peito', 'Barra', 'Intermediário', 'Exercício clássico para desenvolvimento do peitoral e força pressora.'),
  (gen_random_uuid(), 'Agachamento livre', 'Pernas', 'Quadríceps', 'Barra', 'Intermediário', 'Movimento principal para força e desenvolvimento das pernas.'),
  (gen_random_uuid(), 'Levantamento terra', 'Costas', 'Costas', 'Barra', 'Avançado', 'Fundamental para força total e ganho de massa muscular.'),
  (gen_random_uuid(), 'Remada curvada', 'Costas', 'Costas', 'Halter', 'Intermediário', 'Trabalha costas, ombros e braço de forma funcional.'),
  (gen_random_uuid(), 'Rosca direta', 'Braços', 'Bíceps', 'Barra', 'Iniciante', 'Exercício clássico para bíceps e antebraço.'),
  (gen_random_uuid(), 'Prancha', 'Core', 'Abdômen', 'Peso corporal', 'Iniciante', 'Excelente para estabilidade, core e postura.')
 on conflict do nothing;

-- =========================================================
-- 13. Notes
-- =========================================================
-- Use the Supabase Auth dashboard to create users and sign in.
-- After sign-in, the trigger creates the profile and user_settings automatically.
