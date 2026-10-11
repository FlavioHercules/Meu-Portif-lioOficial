begin;

create table if not exists public.pesquisa (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.usuarios(id) on delete cascade,
  objective text not null,
  training_preferences text[] not null default '{}',
  experience_level text not null,
  weekly_frequency text not null,
  available_time text not null,
  training_location text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pesquisa_user_id on public.pesquisa(user_id);

drop trigger if exists trg_pesquisa_updated_at on public.pesquisa;
create trigger trg_pesquisa_updated_at
before update on public.pesquisa
for each row execute procedure public.update_updated_at_column();

alter table public.pesquisa enable row level security;

drop policy if exists pesquisa_manage_own on public.pesquisa;
create policy pesquisa_manage_own on public.pesquisa
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;