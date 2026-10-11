begin;

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.usuarios(id) on delete cascade,
  email text,
  message text not null check (char_length(message) between 1 and 4000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_support_requests_user_created
  on public.support_requests(user_id, created_at desc);

alter table public.support_requests enable row level security;

drop policy if exists support_requests_insert_own on public.support_requests;
create policy support_requests_insert_own on public.support_requests
for insert with check (auth.uid() = user_id);

drop policy if exists support_requests_select_own on public.support_requests;
create policy support_requests_select_own on public.support_requests
for select using (auth.uid() = user_id);

commit;