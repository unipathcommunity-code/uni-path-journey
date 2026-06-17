-- Enable realtime for applications table so student dashboard updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;