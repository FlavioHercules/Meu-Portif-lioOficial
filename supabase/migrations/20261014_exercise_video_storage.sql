begin;

alter table public.exercises
  add column if not exists video_url text;

insert into storage.buckets (id, name, public, allowed_mime_types)
values ('exercise-videos', 'exercise-videos', true, array['video/mp4'])
on conflict (id) do update
set public = excluded.public,
    allowed_mime_types = excluded.allowed_mime_types;

commit;
