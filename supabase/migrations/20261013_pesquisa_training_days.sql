begin;

alter table public.pesquisa
  add column if not exists training_days text[] not null default '{}';

commit;
