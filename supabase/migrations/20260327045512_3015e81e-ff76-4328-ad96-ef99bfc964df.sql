CREATE POLICY "Admins can upload document files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role)
);