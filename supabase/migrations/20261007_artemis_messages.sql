begin;

create table if not exists public.artemis_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.usuarios(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  message_type text not null default 'chat' check (message_type in ('chat', 'workout')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_artemis_messages_user_created
  on public.artemis_messages(user_id, created_at desc);

alter table public.artemis_messages enable row level security;

drop policy if exists artemis_messages_manage_own on public.artemis_messages;
create policy "artemis_messages_manage_own" on public.artemis_messages
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;