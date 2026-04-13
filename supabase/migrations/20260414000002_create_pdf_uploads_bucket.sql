-- ============================================================
-- Storage bucket for large PDF uploads (AI knowledge base)
-- Files are uploaded directly from the browser, bypassing Vercel.
-- The processing API reads from here via the service-role client.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pdf-uploads',
  'pdf-uploads',
  false,                           -- private bucket
  314572800,                       -- 300 MB limit per file
  array['application/pdf']
)
on conflict (id) do nothing;

-- Only admins can upload directly (belt-and-suspenders; signed URLs also restrict)
create policy "admins_upload_to_pdf_uploads"
  on storage.objects for insert
  with check (
    bucket_id = 'pdf-uploads'
    and auth.role() = 'authenticated'
    and public.get_my_role() = 'admin'
  );

-- Only admins can list / delete objects directly
create policy "admins_manage_pdf_uploads"
  on storage.objects for all
  using (
    bucket_id = 'pdf-uploads'
    and public.get_my_role() = 'admin'
  );
