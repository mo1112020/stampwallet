-- Public card artwork uploaded by the merchant who owns the program.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'card-backgrounds',
  'card-backgrounds',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "merchants upload their card artwork"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'card-backgrounds'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "merchants update their card artwork"
on storage.objects for update
to authenticated
using (
  bucket_id = 'card-backgrounds'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'card-backgrounds'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "merchants delete their card artwork"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'card-backgrounds'
  and (storage.foldername(name))[1] = auth.uid()::text
);
