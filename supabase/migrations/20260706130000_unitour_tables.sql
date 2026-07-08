-- Auto-generated from src/tour/integrations/supabase/types.ts — UniTour (tour vertical) schema.
-- Interim RLS: public read for catalog, authenticated read/write for the rest (tighten later).
CREATE TABLE IF NOT EXISTS public.agent_referrals (
  "agent_id" uuid,
  "booking_id" uuid,
  "commission_amount" numeric,
  "created_at" timestamptz DEFAULT now(),
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "paid_at" timestamptz,
  "status" text
);
ALTER TABLE public.agent_referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.agent_referrals;
CREATE POLICY "tour_auth_read" ON public.agent_referrals FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.agent_referrals;
CREATE POLICY "tour_auth_write" ON public.agent_referrals FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.agent_tours (
  "agent_id" uuid,
  "created_at" timestamptz DEFAULT now(),
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "notes" text,
  "special_price" numeric,
  "tour_id" uuid
);
ALTER TABLE public.agent_tours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.agent_tours;
CREATE POLICY "tour_auth_read" ON public.agent_tours FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.agent_tours;
CREATE POLICY "tour_auth_write" ON public.agent_tours FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.agents (
  "address" text,
  "agreement_accepted" boolean,
  "agreement_accepted_at" timestamptz,
  "bank_account" text,
  "bank_name" text,
  "commission_rate" numeric,
  "company_name" text,
  "contract_end_date" timestamptz,
  "contract_start_date" timestamptz,
  "created_at" timestamptz DEFAULT now(),
  "description" text,
  "director_name" text,
  "email" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "inn" text,
  "is_active" boolean,
  "license_url" text,
  "logo" text,
  "name" text,
  "phone" text,
  "status" text,
  "updated_at" timestamptz DEFAULT now(),
  "user_id" uuid
);
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.agents;
CREATE POLICY "tour_auth_read" ON public.agents FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.agents;
CREATE POLICY "tour_auth_write" ON public.agents FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.booking_agent_assignments (
  "agent_id" uuid,
  "assigned_at" timestamptz,
  "assigned_by" text,
  "booking_id" uuid,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "notes" text,
  "status" text
);
ALTER TABLE public.booking_agent_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.booking_agent_assignments;
CREATE POLICY "tour_auth_read" ON public.booking_agent_assignments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.booking_agent_assignments;
CREATE POLICY "tour_auth_write" ON public.booking_agent_assignments FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.booking_documents (
  "booking_id" uuid,
  "document_type" text,
  "file_name" text,
  "file_url" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "notes" text,
  "uploaded_at" timestamptz
);
ALTER TABLE public.booking_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.booking_documents;
CREATE POLICY "tour_auth_read" ON public.booking_documents FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.booking_documents;
CREATE POLICY "tour_auth_write" ON public.booking_documents FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.booking_timeline (
  "booking_id" uuid,
  "completed" boolean,
  "completed_at" timestamptz,
  "created_at" timestamptz DEFAULT now(),
  "description" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "step" text,
  "title" text
);
ALTER TABLE public.booking_timeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.booking_timeline;
CREATE POLICY "tour_auth_read" ON public.booking_timeline FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.booking_timeline;
CREATE POLICY "tour_auth_write" ON public.booking_timeline FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.bookings (
  "branch_id" uuid,
  "created_at" timestamptz DEFAULT now(),
  "deposit_amount" numeric,
  "discount_amount" numeric,
  "driver_name" text,
  "driver_phone" text,
  "flight_info" text,
  "guide_name" text,
  "guide_phone" text,
  "hotel_info" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "manager_id" uuid,
  "manager_name" text,
  "manager_phone" text,
  "manager_photo" text,
  "notes" text,
  "payment_screenshot_url" text,
  "payment_status" text,
  "people_count" numeric,
  "pickup_location" text,
  "promo_code_id" uuid,
  "remaining_amount" numeric,
  "status" text,
  "total_price" numeric,
  "tour_id" uuid,
  "travel_date" timestamptz,
  "user_id" uuid
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.bookings;
CREATE POLICY "tour_auth_read" ON public.bookings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.bookings;
CREATE POLICY "tour_auth_write" ON public.bookings FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  "agent_id" uuid,
  "booking_id" uuid,
  "created_at" timestamptz DEFAULT now(),
  "customer_id" uuid,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "updated_at" timestamptz DEFAULT now()
);
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.chat_conversations;
CREATE POLICY "tour_auth_read" ON public.chat_conversations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.chat_conversations;
CREATE POLICY "tour_auth_write" ON public.chat_conversations FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.chat_messages (
  "content" text,
  "conversation_id" uuid,
  "created_at" timestamptz DEFAULT now(),
  "file_name" text,
  "file_url" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "is_read" boolean,
  "sender_id" uuid
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.chat_messages;
CREATE POLICY "tour_auth_read" ON public.chat_messages FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.chat_messages;
CREATE POLICY "tour_auth_write" ON public.chat_messages FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.company_billing_invoices (
  "amount_usd" numeric,
  "company_id" uuid,
  "created_at" timestamptz DEFAULT now(),
  "due_date" timestamptz,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoice_number" text,
  "notes" text,
  "paid_at" timestamptz,
  "period_end" text,
  "period_start" text,
  "status" text,
  "subscription_id" uuid
);
ALTER TABLE public.company_billing_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.company_billing_invoices;
CREATE POLICY "tour_auth_read" ON public.company_billing_invoices FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.company_billing_invoices;
CREATE POLICY "tour_auth_write" ON public.company_billing_invoices FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.company_branches (
  "address" text,
  "city" text,
  "company_id" uuid,
  "created_at" timestamptz DEFAULT now(),
  "email" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "is_active" boolean,
  "is_main" boolean,
  "manager_user_id" uuid,
  "name" text,
  "notes" text,
  "phone" text,
  "slug" text,
  "updated_at" timestamptz DEFAULT now()
);
ALTER TABLE public.company_branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.company_branches;
CREATE POLICY "tour_auth_read" ON public.company_branches FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.company_branches;
CREATE POLICY "tour_auth_write" ON public.company_branches FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.company_change_requests (
  "admin_notes" text,
  "company_id" uuid,
  "created_at" timestamptz DEFAULT now(),
  "description" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "payload" jsonb,
  "request_type" text,
  "requested_by" text,
  "reviewed_at" timestamptz,
  "reviewed_by" text,
  "status" text,
  "title" text,
  "updated_at" timestamptz DEFAULT now()
);
ALTER TABLE public.company_change_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.company_change_requests;
CREATE POLICY "tour_auth_read" ON public.company_change_requests FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.company_change_requests;
CREATE POLICY "tour_auth_write" ON public.company_change_requests FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.company_customers (
  "account_type" text,
  "avatar_url" text,
  "company_id" uuid,
  "created_at" timestamptz DEFAULT now(),
  "email" text,
  "full_name" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "is_active" boolean,
  "phone" text,
  "updated_at" timestamptz DEFAULT now(),
  "user_id" uuid
);
ALTER TABLE public.company_customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.company_customers;
CREATE POLICY "tour_auth_read" ON public.company_customers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.company_customers;
CREATE POLICY "tour_auth_write" ON public.company_customers FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.company_feature_overrides (
  "company_id" uuid,
  "created_at" timestamptz DEFAULT now(),
  "feature_key" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "is_enabled" boolean,
  "notes" text,
  "set_by" text,
  "updated_at" timestamptz DEFAULT now()
);
ALTER TABLE public.company_feature_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.company_feature_overrides;
CREATE POLICY "tour_auth_read" ON public.company_feature_overrides FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.company_feature_overrides;
CREATE POLICY "tour_auth_write" ON public.company_feature_overrides FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.company_leads (
  "assigned_to" text,
  "branch_id" uuid,
  "company_id" uuid,
  "created_at" timestamptz DEFAULT now(),
  "email" text,
  "full_name" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "message" text,
  "notes" text,
  "phone" text,
  "related_tour_id" uuid,
  "source" text,
  "status" text,
  "updated_at" timestamptz DEFAULT now()
);
ALTER TABLE public.company_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.company_leads;
CREATE POLICY "tour_auth_read" ON public.company_leads FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.company_leads;
CREATE POLICY "tour_auth_write" ON public.company_leads FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.company_posts (
  "author_id" uuid,
  "category" text,
  "company_id" uuid,
  "content" text,
  "cover_image" text,
  "created_at" timestamptz DEFAULT now(),
  "excerpt" text,
  "gallery" jsonb,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "is_published" boolean,
  "published_at" timestamptz,
  "seo_description" text,
  "seo_title" text,
  "slug" text,
  "tags" jsonb,
  "title" text,
  "updated_at" timestamptz DEFAULT now(),
  "view_count" numeric
);
ALTER TABLE public.company_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_public_read" ON public.company_posts;
CREATE POLICY "tour_public_read" ON public.company_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.company_posts;
CREATE POLICY "tour_auth_write" ON public.company_posts FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.company_telegram_bots (
  "bot_token" text,
  "bot_username" text,
  "company_id" uuid,
  "configured_by" text,
  "created_at" timestamptz DEFAULT now(),
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "is_active" boolean,
  "notes" text,
  "updated_at" timestamptz DEFAULT now(),
  "webhook_url" text
);
ALTER TABLE public.company_telegram_bots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.company_telegram_bots;
CREATE POLICY "tour_auth_read" ON public.company_telegram_bots FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.company_telegram_bots;
CREATE POLICY "tour_auth_write" ON public.company_telegram_bots FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.destinations (
  "country" text,
  "created_at" timestamptz DEFAULT now(),
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "image" text,
  "name" text,
  "region" text,
  "tour_count" numeric
);
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_public_read" ON public.destinations;
CREATE POLICY "tour_public_read" ON public.destinations FOR SELECT USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.destinations;
CREATE POLICY "tour_auth_write" ON public.destinations FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.document_agent_access (
  "agent_id" uuid,
  "document_id" uuid,
  "granted_at" timestamptz,
  "granted_by" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "notes" text,
  "revoked_at" timestamptz
);
ALTER TABLE public.document_agent_access ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.document_agent_access;
CREATE POLICY "tour_auth_read" ON public.document_agent_access FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.document_agent_access;
CREATE POLICY "tour_auth_write" ON public.document_agent_access FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.feature_toggles (
  "created_at" timestamptz DEFAULT now(),
  "description" text,
  "feature_key" text,
  "feature_name" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "is_enabled" boolean,
  "updated_at" timestamptz DEFAULT now(),
  "updated_by" text
);
ALTER TABLE public.feature_toggles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.feature_toggles;
CREATE POLICY "tour_auth_read" ON public.feature_toggles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.feature_toggles;
CREATE POLICY "tour_auth_write" ON public.feature_toggles FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.hotels (
  "address" text,
  "breakfast_included" boolean,
  "check_in_time" text,
  "check_out_time" text,
  "created_at" timestamptz DEFAULT now(),
  "description" text,
  "destination_id" uuid,
  "dinner_included" boolean,
  "email" text,
  "gallery" jsonb,
  "has_air_conditioning" boolean,
  "has_gym" boolean,
  "has_parking" boolean,
  "has_pool" boolean,
  "has_restaurant" boolean,
  "has_spa" boolean,
  "has_wifi" boolean,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "image" text,
  "is_partner" boolean,
  "lunch_included" boolean,
  "name" text,
  "phone" text,
  "price_per_night" numeric,
  "room_count" numeric,
  "star_rating" numeric,
  "updated_at" timestamptz DEFAULT now()
);
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_public_read" ON public.hotels;
CREATE POLICY "tour_public_read" ON public.hotels FOR SELECT USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.hotels;
CREATE POLICY "tour_auth_write" ON public.hotels FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  "email" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "is_active" boolean,
  "subscribed_at" timestamptz
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.newsletter_subscribers;
CREATE POLICY "tour_auth_read" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.newsletter_subscribers;
CREATE POLICY "tour_auth_write" ON public.newsletter_subscribers FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.page_analytics (
  "created_at" timestamptz DEFAULT now(),
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "page_path" text,
  "page_title" text,
  "referrer" text,
  "session_id" uuid,
  "time_spent_seconds" numeric,
  "user_agent" text,
  "user_id" uuid
);
ALTER TABLE public.page_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.page_analytics;
CREATE POLICY "tour_auth_read" ON public.page_analytics FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.page_analytics;
CREATE POLICY "tour_auth_write" ON public.page_analytics FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.promo_codes (
  "code" text,
  "created_at" timestamptz DEFAULT now(),
  "created_by" text,
  "current_uses" numeric,
  "description" text,
  "discount_percent" numeric,
  "expires_at" timestamptz,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "is_active" boolean,
  "max_uses" numeric,
  "min_order_amount" numeric,
  "starts_at" timestamptz,
  "updated_at" timestamptz DEFAULT now()
);
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.promo_codes;
CREATE POLICY "tour_auth_read" ON public.promo_codes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.promo_codes;
CREATE POLICY "tour_auth_write" ON public.promo_codes FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.reviews (
  "booking_id" uuid,
  "comment" text,
  "created_at" timestamptz DEFAULT now(),
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "is_approved" boolean,
  "rating" numeric,
  "report_reason" text,
  "reported" boolean,
  "tour_id" uuid,
  "updated_at" timestamptz DEFAULT now(),
  "user_id" uuid
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_public_read" ON public.reviews;
CREATE POLICY "tour_public_read" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.reviews;
CREATE POLICY "tour_auth_write" ON public.reviews FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.super_admin_impersonations (
  "company_id" uuid,
  "ended_at" timestamptz,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "reason" text,
  "started_at" timestamptz,
  "super_admin_id" uuid
);
ALTER TABLE public.super_admin_impersonations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.super_admin_impersonations;
CREATE POLICY "tour_auth_read" ON public.super_admin_impersonations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.super_admin_impersonations;
CREATE POLICY "tour_auth_write" ON public.super_admin_impersonations FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.support_tickets (
  "created_at" timestamptz DEFAULT now(),
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "message" text,
  "priority" text,
  "status" text,
  "subject" text,
  "updated_at" timestamptz DEFAULT now(),
  "user_id" uuid
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.support_tickets;
CREATE POLICY "tour_auth_read" ON public.support_tickets FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.support_tickets;
CREATE POLICY "tour_auth_write" ON public.support_tickets FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  "created_at" timestamptz DEFAULT now(),
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "is_admin" boolean,
  "message" text,
  "sender_id" uuid,
  "ticket_id" uuid
);
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.ticket_messages;
CREATE POLICY "tour_auth_read" ON public.ticket_messages FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.ticket_messages;
CREATE POLICY "tour_auth_write" ON public.ticket_messages FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.tour_companies (
  "about_html" text,
  "accent_color" text,
  "address" text,
  "approved_at" timestamptz,
  "approved_by" text,
  "banner_url" text,
  "city" text,
  "commission_rate" numeric,
  "country" text,
  "created_at" timestamptz DEFAULT now(),
  "created_by" text,
  "description" text,
  "email" text,
  "facebook" text,
  "favicon_url" text,
  "font_family" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "instagram" text,
  "is_active" boolean,
  "is_featured" boolean,
  "logo_url" text,
  "name" text,
  "phone" text,
  "primary_color" text,
  "rating" numeric,
  "review_count" numeric,
  "secondary_color" text,
  "seo_description" text,
  "seo_keywords" text,
  "seo_title" text,
  "slug" text,
  "status" text,
  "subscription_expires_at" timestamptz,
  "subscription_plan" text,
  "tagline" text,
  "telegram" text,
  "theme_config" jsonb,
  "total_bookings" numeric,
  "total_tours" numeric,
  "updated_at" timestamptz DEFAULT now(),
  "website" text,
  "whatsapp" text
);
ALTER TABLE public.tour_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_public_read" ON public.tour_companies;
CREATE POLICY "tour_public_read" ON public.tour_companies FOR SELECT USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.tour_companies;
CREATE POLICY "tour_auth_write" ON public.tour_companies FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.tour_company_domains (
  "company_id" uuid,
  "created_at" timestamptz DEFAULT now(),
  "domain" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "is_primary" boolean,
  "is_subdomain" boolean,
  "is_verified" boolean,
  "ssl_status" text,
  "verification_token" text,
  "verified_at" timestamptz
);
ALTER TABLE public.tour_company_domains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.tour_company_domains;
CREATE POLICY "tour_auth_read" ON public.tour_company_domains FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.tour_company_domains;
CREATE POLICY "tour_auth_write" ON public.tour_company_domains FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.tour_company_members (
  "branch_id" uuid,
  "company_id" uuid,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "invited_by" text,
  "is_active" boolean,
  "joined_at" timestamptz,
  "permissions" jsonb,
  "role" text,
  "user_id" uuid
);
ALTER TABLE public.tour_company_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.tour_company_members;
CREATE POLICY "tour_auth_read" ON public.tour_company_members FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.tour_company_members;
CREATE POLICY "tour_auth_write" ON public.tour_company_members FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.tour_company_subscriptions (
  "cancelled_at" timestamptz,
  "company_id" uuid,
  "created_at" timestamptz DEFAULT now(),
  "current_period_end" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "monthly_price_usd" numeric,
  "notes" text,
  "plan" text,
  "started_at" timestamptz,
  "status" text,
  "updated_at" timestamptz DEFAULT now()
);
ALTER TABLE public.tour_company_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.tour_company_subscriptions;
CREATE POLICY "tour_auth_read" ON public.tour_company_subscriptions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.tour_company_subscriptions;
CREATE POLICY "tour_auth_write" ON public.tour_company_subscriptions FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.tour_hotels (
  "check_in_date" timestamptz,
  "check_out_date" timestamptz,
  "hotel_id" uuid,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "nights" numeric,
  "notes" text,
  "room_type" text,
  "tour_id" uuid
);
ALTER TABLE public.tour_hotels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_public_read" ON public.tour_hotels;
CREATE POLICY "tour_public_read" ON public.tour_hotels FOR SELECT USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.tour_hotels;
CREATE POLICY "tour_auth_write" ON public.tour_hotels FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.tour_inclusions (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "included" boolean,
  "item" text,
  "tour_id" uuid
);
ALTER TABLE public.tour_inclusions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_public_read" ON public.tour_inclusions;
CREATE POLICY "tour_public_read" ON public.tour_inclusions FOR SELECT USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.tour_inclusions;
CREATE POLICY "tour_auth_write" ON public.tour_inclusions FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.tour_itineraries (
  "activities" jsonb,
  "day" numeric,
  "description" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text,
  "tour_id" uuid
);
ALTER TABLE public.tour_itineraries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_public_read" ON public.tour_itineraries;
CREATE POLICY "tour_public_read" ON public.tour_itineraries FOR SELECT USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.tour_itineraries;
CREATE POLICY "tour_auth_write" ON public.tour_itineraries FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.tour_vehicles (
  "arrival_time" text,
  "departure_time" text,
  "dropoff_location" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "notes" text,
  "pickup_location" text,
  "tour_id" uuid,
  "vehicle_id" uuid
);
ALTER TABLE public.tour_vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_public_read" ON public.tour_vehicles;
CREATE POLICY "tour_public_read" ON public.tour_vehicles FOR SELECT USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.tour_vehicles;
CREATE POLICY "tour_auth_write" ON public.tour_vehicles FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.tours (
  "branch_id" uuid,
  "company_id" uuid,
  "country" text,
  "created_at" timestamptz DEFAULT now(),
  "description" text,
  "destination" text,
  "destination_id" uuid,
  "duration_days" numeric,
  "duration_nights" numeric,
  "featured" boolean,
  "gallery" jsonb,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "image" text,
  "max_people" numeric,
  "operator_id" uuid,
  "original_price" numeric,
  "price" numeric,
  "rating" numeric,
  "review_count" numeric,
  "status" text,
  "title" text,
  "tour_type" text,
  "updated_at" timestamptz DEFAULT now()
);
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_public_read" ON public.tours;
CREATE POLICY "tour_public_read" ON public.tours FOR SELECT USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.tours;
CREATE POLICY "tour_auth_write" ON public.tours FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.user_blocks (
  "blocked_at" timestamptz,
  "blocked_by" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "reason" text,
  "unblocked_at" timestamptz,
  "user_id" uuid
);
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_auth_read" ON public.user_blocks;
CREATE POLICY "tour_auth_read" ON public.user_blocks FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.user_blocks;
CREATE POLICY "tour_auth_write" ON public.user_blocks FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.vehicles (
  "brand" text,
  "capacity" numeric,
  "color" text,
  "created_at" timestamptz DEFAULT now(),
  "description" text,
  "driver_name" text,
  "driver_phone" text,
  "has_air_conditioning" boolean,
  "has_toilet" boolean,
  "has_tv" boolean,
  "has_wifi" boolean,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "image" text,
  "is_available" boolean,
  "model" text,
  "name" text,
  "plate_number" text,
  "price_per_day" numeric,
  "updated_at" timestamptz DEFAULT now(),
  "vehicle_type" text
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tour_public_read" ON public.vehicles;
CREATE POLICY "tour_public_read" ON public.vehicles FOR SELECT USING (true);
DROP POLICY IF EXISTS "tour_auth_write" ON public.vehicles;
CREATE POLICY "tour_auth_write" ON public.vehicles FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
