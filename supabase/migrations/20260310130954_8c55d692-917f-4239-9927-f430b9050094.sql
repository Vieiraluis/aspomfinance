
UPDATE storage.buckets SET public = true WHERE id IN ('attachments', 'hr-documents');

-- Add public read policy for attachments bucket
CREATE POLICY "Public read access for attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'attachments');

-- Add public read policy for hr-documents bucket
CREATE POLICY "Public read access for hr-documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'hr-documents');
