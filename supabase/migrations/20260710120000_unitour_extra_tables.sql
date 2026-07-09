-- Migration: 20260710120000_unitour_extra_tables.sql
-- Description: The last two UniTour tables the app uses that the earlier reconstruction missed
--   (referenced via template-literal .from(...) so the audit didn't catch them). Definitions
--   taken from the real UniTour source (unitour-me-main), with UniPath-safe RLS.

-- Public AI chat widget on tour sites
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "aichat_public_rw" ON public.ai_chat_messages;
CREATE POLICY "aichat_public_rw" ON public.ai_chat_messages FOR ALL USING (true) WITH CHECK (true);

-- Custom tour request form (public visitors submit; staff/agents respond)
CREATE TABLE IF NOT EXISTS public.custom_tour_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  destination_id uuid,
  destination_name text,
  hotel_level integer NOT NULL DEFAULT 3,
  transport_type text NOT NULL DEFAULT 'bus',
  food_plan text NOT NULL DEFAULT 'breakfast',
  excursions text[] DEFAULT '{}',
  people_count integer NOT NULL DEFAULT 1,
  start_date date,
  end_date date,
  duration_days integer NOT NULL DEFAULT 3,
  estimated_price numeric,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  agent_id uuid,
  agent_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_tour_requests ENABLE ROW LEVEL SECURITY;
-- Anyone (incl. anon visitors) can submit a request
DROP POLICY IF EXISTS "ctr_public_insert" ON public.custom_tour_requests;
CREATE POLICY "ctr_public_insert" ON public.custom_tour_requests FOR INSERT WITH CHECK (true);
-- Users see their own; staff manage all
DROP POLICY IF EXISTS "ctr_own_select" ON public.custom_tour_requests;
CREATE POLICY "ctr_own_select" ON public.custom_tour_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "ctr_staff_all" ON public.custom_tour_requests;
CREATE POLICY "ctr_staff_all" ON public.custom_tour_requests FOR ALL TO authenticated
  USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','agent','specialist'));
