-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can insert notifications for any user
CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- System can insert notifications (for triggers)
CREATE POLICY "System insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to notify on document status change
CREATE OR REPLACE FUNCTION public.notify_document_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Document Approved'
        WHEN NEW.status = 'rejected' THEN 'Document Rejected'
        ELSE 'Document Status Updated'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Your ' || NEW.document_type || ' has been approved.'
        WHEN NEW.status = 'rejected' THEN 'Your ' || NEW.document_type || ' was rejected. ' || COALESCE('Reason: ' || NEW.rejection_reason, 'Please check and re-upload.')
        ELSE 'Your ' || NEW.document_type || ' status has been updated to ' || NEW.status || '.'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'success'
        WHEN NEW.status = 'rejected' THEN 'error'
        ELSE 'info'
      END,
      '/student/documents'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for document status changes
CREATE TRIGGER on_document_status_change
AFTER UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.notify_document_status_change();

-- Create function to notify on application status change
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Application Accepted!'
        WHEN NEW.status = 'rejected' THEN 'Application Update'
        WHEN NEW.status = 'in_review' THEN 'Application In Review'
        WHEN NEW.status = 'submitted' THEN 'Application Submitted'
        ELSE 'Application Status Updated'
      END,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Congratulations! Your application has been accepted.'
        WHEN NEW.status = 'rejected' THEN 'Unfortunately, your application was not accepted. You may apply to other universities.'
        WHEN NEW.status = 'in_review' THEN 'Your application is now being reviewed by the admissions team.'
        WHEN NEW.status = 'submitted' THEN 'Your application has been successfully submitted and is awaiting review.'
        ELSE 'Your application status has been updated to ' || NEW.status || '.'
      END,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'success'
        WHEN NEW.status = 'rejected' THEN 'error'
        ELSE 'info'
      END,
      '/student/applications'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for application status changes
CREATE TRIGGER on_application_status_change
AFTER UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_application_status_change();