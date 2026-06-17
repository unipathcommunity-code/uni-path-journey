-- Add missing storage bucket policies for visa-documents and documents

-- 1. Users can update their own visa documents in storage
CREATE POLICY "Users can update own visa documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'visa-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2. Admins can view all visa documents in storage
CREATE POLICY "Admins can view all visa documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'visa-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- 3. Admins can update all visa documents in storage
CREATE POLICY "Admins can update all visa documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'visa-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- 4. Admins can update all documents in storage
CREATE POLICY "Admins can update all documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));

-- 5. Admins can update visa_documents table records
CREATE POLICY "Admins can update all visa documents"
ON public.visa_documents FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));