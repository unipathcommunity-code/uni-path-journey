-- Allow admins to delete any document record
CREATE POLICY "Admins can delete all documents"
ON public.documents
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete files from documents storage bucket
CREATE POLICY "Admins can delete document files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'documents' AND has_role(auth.uid(), 'admin'::app_role));