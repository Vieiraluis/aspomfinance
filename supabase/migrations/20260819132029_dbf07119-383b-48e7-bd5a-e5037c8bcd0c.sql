REVOKE ALL ON FUNCTION public.generate_account_code() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.generate_locacao_protocolo() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;

CREATE POLICY "Users can update their own reservation items"
ON public.event_reservation_items FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipt numbers"
ON public.receipt_numbers FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Logos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for hr-documents" ON storage.objects;
DROP POLICY IF EXISTS "Public read contracts" ON storage.objects;

CREATE POLICY "Users can view own contracts"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'contracts' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own logos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'logos' AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR ((storage.foldername(name))[1] = 'associados' AND (storage.foldername(name))[2] = (auth.uid())::text)
  )
);