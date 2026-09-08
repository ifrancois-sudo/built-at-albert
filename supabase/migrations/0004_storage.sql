-- Built at Albert — project screenshots
-- Uploads land in a folder named after the uploader's user id; reads are open
-- because a published project card has to render for everyone.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'screenshots',
  'screenshots',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists screenshots_read on storage.objects;
create policy screenshots_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'screenshots');

drop policy if exists screenshots_insert_own_folder on storage.objects;
create policy screenshots_insert_own_folder on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'screenshots'
    and public.is_verified()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists screenshots_update_own_folder on storage.objects;
create policy screenshots_update_own_folder on storage.objects
  for update to authenticated
  using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists screenshots_delete_own_folder on storage.objects;
create policy screenshots_delete_own_folder on storage.objects
  for delete to authenticated
  using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
