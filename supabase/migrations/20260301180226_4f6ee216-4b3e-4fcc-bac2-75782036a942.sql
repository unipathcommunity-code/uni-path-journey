
-- Add parent contact fields to profiles
ALTER TABLE public.profiles ADD COLUMN parent_name text;
ALTER TABLE public.profiles ADD COLUMN parent_phone text;

-- Update the application status change trigger to include parent info notification
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _parent_name text;
  _parent_phone text;
  _uni_name text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get parent info and university name for accepted notifications
    IF NEW.status = 'accepted' THEN
      SELECT p.parent_name, p.parent_phone INTO _parent_name, _parent_phone
      FROM public.profiles p WHERE p.user_id = NEW.user_id;
      
      SELECT u.name INTO _uni_name
      FROM public.universities u WHERE u.id = NEW.university_id;
    END IF;

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
        WHEN NEW.status = 'accepted' THEN 
          'Congratulations! Your application to ' || COALESCE(_uni_name, 'university') || ' has been accepted!' ||
          CASE WHEN _parent_phone IS NOT NULL THEN ' Parent (' || COALESCE(_parent_name, '') || ': ' || _parent_phone || ') has been notified.' ELSE '' END
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
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_application_status_change ON public.applications;
CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_application_status_change();
