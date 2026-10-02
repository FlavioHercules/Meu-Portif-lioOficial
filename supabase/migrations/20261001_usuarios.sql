begin;

do $$
begin
  if to_regclass('public.usuarios') is null then
    if to_regclass('public.profiles') is not null then
      alter table public.profiles rename to usuarios;
    else
      raise exception 'Tabela public.profiles nao encontrada; aplique primeiro o schema inicial.';
    end if;
  end if;
end;
$$;

create index if not exists idx_usuarios_email on public.usuarios(email);

drop trigger if exists trg_profiles_updated_at on public.usuarios;
drop trigger if exists trg_usuarios_updated_at on public.usuarios;
create trigger trg_usuarios_updated_at
before update on public.usuarios
for each row execute procedure public.update_updated_at_column();

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

insert into public.usuarios (id, email, full_name)
select id, email, coalesce(raw_user_meta_data ->> 'full_name', 'Usuário')
from auth.users
on conflict (id) do nothing;

insert into public.user_settings (user_id)
select id from public.usuarios
on conflict (user_id) do nothing;

alter table public.usuarios enable row level security;

drop policy if exists profiles_select_own on public.usuarios;
drop policy if exists usuarios_select_own on public.usuarios;
create policy usuarios_select_own on public.usuarios
for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.usuarios;
drop policy if exists usuarios_update_own on public.usuarios;
create policy usuarios_update_own on public.usuarios
for update using (auth.uid() = id) with check (auth.uid() = id);

commit;