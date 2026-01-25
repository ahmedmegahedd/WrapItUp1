-- Storage Policies for product-images bucket
-- Run this AFTER creating the bucket in Supabase Dashboard
-- Note: If policies already exist, you'll get an error - that's okay, just ignore it

-- Drop existing policies if they exist (optional - only if you want to recreate them)
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Allow public read access (so images are visible on the website)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow public uploads (simpler for admin panel - anyone can upload)
-- If you want authenticated-only uploads, use the alternative below instead
CREATE POLICY "Public upload access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- Alternative: Authenticated-only uploads (more secure)
-- Uncomment these and comment out "Public upload access" above if you prefer
/*
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
*/
