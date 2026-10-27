begin;

alter table public.exercises
  add column if not exists equipment_options text[] not null default '{}',
  add column if not exists exercise_type text not null default 'composto',
  add column if not exists suggested_sets smallint not null default 3,
  add column if not exists suggested_reps text not null default '8-12',
  add column if not exists active boolean not null default true,
  add column if not exists modality text not null default 'Academia',
  add column if not exists objectives text[] not null default '{}',
  add column if not exists muscles text[] not null default '{}',
  add column if not exists movement_pattern text,
  add column if not exists unilateral boolean not null default false,
  add column if not exists impact_level text not null default 'baixo',
  add column if not exists instructions jsonb not null default '[]'::jsonb,
  add column if not exists progressions text[] not null default '{}',
  add column if not exists regressions text[] not null default '{}',
  add column if not exists description text,
  add column if not exists video_url text,
  add column if not exists demo_image_url text;

commit;
