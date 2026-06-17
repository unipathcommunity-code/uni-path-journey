-- Complete RBAC migration to profiles.role and deprecate user_roles

-- 1. Drop old policies that reference has_role
DROP POLICY IF EXISTS "Admins can delete universities" ON public.universities;
DROP POLICY IF EXISTS "Admins can insert universities" ON public.universities;
DROP POLICY IF EXISTS "Admins can update universities" ON public.universities;
DROP POLICY IF EXISTS "Admins can view all universities" ON public.universities;

DROP POLICY IF EXISTS "Admins can view all applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can update all applications" ON public.applications;

DROP POLICY IF EXISTS "Admins can view all admin notes" ON public.application_admin_notes;
DROP POLICY IF EXISTS "Admins can insert admin notes" ON public.application_admin_notes;
DROP POLICY IF EXISTS "Admins can update admin notes" ON public.application_admin_notes;
DROP POLICY IF EXISTS "Admins can delete admin notes" ON public.application_admin_notes;

DROP POLICY IF EXISTS "Admins can delete document files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update all documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update all visa documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload document files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all visa documents" ON storage.objects;

DROP POLICY IF EXISTS "Admins can update all documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can delete all documents" ON public.documents;

DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Agents can send notifications to assigned students" ON public.notifications;

DROP POLICY IF EXISTS "Admins can view all visa applications" ON public.visa_applications;

DROP POLICY IF EXISTS "Admins can view all visa documents" ON public.visa_documents;
DROP POLICY IF EXISTS "Admins can update all visa documents" ON public.visa_documents;

DROP POLICY IF EXISTS "Agents can view their assigned students" ON public.agent_students;
DROP POLICY IF EXISTS "Admins can manage agent assignments" ON public.agent_students;

DROP POLICY IF EXISTS "Agents can view their own notes" ON public.agent_notes;
DROP POLICY IF EXISTS "Agents can update their own notes" ON public.agent_notes;
DROP POLICY IF EXISTS "Agents can delete their own notes" ON public.agent_notes;
DROP POLICY IF EXISTS "Agents can create notes for assigned students only" ON public.agent_notes;

DROP POLICY IF EXISTS "Agents can view their own tasks" ON public.agent_tasks;
DROP POLICY IF EXISTS "Agents can create their own tasks" ON public.agent_tasks;
DROP POLICY IF EXISTS "Agents can update their own tasks" ON public.agent_tasks;
DROP POLICY IF EXISTS "Agents can delete their own tasks" ON public.agent_tasks;

DROP POLICY IF EXISTS "Only admins can manage system config" ON public.system_config;
DROP POLICY IF EXISTS "Only admins can view system config" ON public.system_config;

DROP POLICY IF EXISTS "Admins can view all countries" ON public.countries;
DROP POLICY IF EXISTS "Admins can insert countries" ON public.countries;
DROP POLICY IF EXISTS "Admins can update countries" ON public.countries;
DROP POLICY IF EXISTS "Admins can delete countries" ON public.countries;

DROP POLICY IF EXISTS "Admins can manage grants" ON public.grants;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;

DROP POLICY IF EXISTS "Admins can manage jobs" ON public.jobs;

DROP POLICY IF EXISTS "Admins can manage housing" ON public.housing;

DROP POLICY IF EXISTS "Admins can manage feature overrides" ON public.student_feature_overrides;

DROP POLICY IF EXISTS "Admins can manage all credits" ON public.user_credits;

DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.credit_transactions;

DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.referrals;

DROP POLICY IF EXISTS "Admins can view all spins" ON public.spin_wheel_logs;

DROP POLICY IF EXISTS "Admins can manage mentors" ON public.mentors;

DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.mentor_bookings;

DROP POLICY IF EXISTS "Admins can manage all streaks" ON public.daily_login_streaks;

DROP POLICY IF EXISTS "Admins can manage all payment transactions" ON public.payment_transactions;

DROP POLICY IF EXISTS "Admins can manage tariffs" ON public.tariffs;

DROP POLICY IF EXISTS "Admins can view contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Admins can update contact requests" ON public.contact_requests;
DROP POLICY IF EXISTS "Admins can delete contact requests" ON public.contact_requests;


-- 2. Recreate policies utilizing get_auth_user_role()
CREATE POLICY "Admins can delete universities" ON public.universities FOR DELETE USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));
CREATE POLICY "Admins can insert universities" ON public.universities FOR INSERT WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));
CREATE POLICY "Admins can update universities" ON public.universities FOR UPDATE USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));
CREATE POLICY "Admins can view all universities" ON public.universities FOR SELECT USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can view all applications" ON public.applications FOR SELECT USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));
CREATE POLICY "Admins can update all applications" ON public.applications FOR UPDATE USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can view all admin notes" ON public.application_admin_notes FOR SELECT USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));
CREATE POLICY "Admins can insert admin notes" ON public.application_admin_notes FOR INSERT WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));
CREATE POLICY "Admins can update admin notes" ON public.application_admin_notes FOR UPDATE USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));
CREATE POLICY "Admins can delete admin notes" ON public.application_admin_notes FOR DELETE USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can delete document files" ON storage.objects FOR DELETE USING ((bucket_id = 'documents'::text) AND (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')));
CREATE POLICY "Admins can update all documents" ON storage.objects FOR UPDATE USING ((bucket_id = 'documents'::text) AND (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')));
CREATE POLICY "Admins can update all visa documents" ON storage.objects FOR UPDATE USING ((bucket_id = 'visa-documents'::text) AND (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')));
CREATE POLICY "Admins can upload document files" ON storage.objects FOR INSERT WITH CHECK ((bucket_id = 'documents'::text) AND (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')));
CREATE POLICY "Admins can view all documents" ON storage.objects FOR SELECT USING ((bucket_id = 'documents'::text) AND (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')));
CREATE POLICY "Admins can view all visa documents" ON storage.objects FOR SELECT USING ((bucket_id = 'visa-documents'::text) AND (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')));

CREATE POLICY "Admins can update all documents" ON public.documents FOR UPDATE USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));
CREATE POLICY "Admins can view all documents" ON public.documents FOR SELECT USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));
CREATE POLICY "Admins can delete all documents" ON public.documents FOR DELETE USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));
CREATE POLICY "Agents can send notifications to assigned students" ON public.notifications FOR INSERT WITH CHECK ((get_auth_user_role() = 'agent') AND (EXISTS ( SELECT 1 FROM agent_students WHERE ((agent_students.agent_id = auth.uid()) AND (agent_students.student_id = notifications.user_id) AND (agent_students.status = 'active'::text)))));

CREATE POLICY "Admins can view all visa applications" ON public.visa_applications FOR SELECT USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can view all visa documents" ON public.visa_documents FOR SELECT USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));
CREATE POLICY "Admins can update all visa documents" ON public.visa_documents FOR UPDATE USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Agents can view their assigned students" ON public.agent_students FOR SELECT USING ((agent_id = auth.uid()) OR (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')));
CREATE POLICY "Admins can manage agent assignments" ON public.agent_students FOR ALL USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')) WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Agents can view their own notes" ON public.agent_notes FOR SELECT USING ((agent_id = auth.uid()) OR (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')));
CREATE POLICY "Agents can update their own notes" ON public.agent_notes FOR UPDATE USING ((agent_id = auth.uid()) OR (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')));
CREATE POLICY "Agents can delete their own notes" ON public.agent_notes FOR DELETE USING ((agent_id = auth.uid()) OR (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')));
CREATE POLICY "Agents can create notes for assigned students only" ON public.agent_notes FOR INSERT WITH CHECK (((agent_id = auth.uid()) AND (EXISTS ( SELECT 1 FROM agent_students WHERE ((agent_students.agent_id = auth.uid()) AND (agent_students.student_id = agent_notes.student_id) AND (agent_students.status = 'active'::text))))) OR (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')));

CREATE POLICY "Agents can view their own tasks" ON public.agent_tasks FOR SELECT USING ((agent_id = auth.uid()) OR (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')));
CREATE POLICY "Agents can create their own tasks" ON public.agent_tasks FOR INSERT WITH CHECK ((agent_id = auth.uid()) OR (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')));
CREATE POLICY "Agents can update their own tasks" ON public.agent_tasks FOR UPDATE USING ((agent_id = auth.uid()) OR (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')));
CREATE POLICY "Agents can delete their own tasks" ON public.agent_tasks FOR DELETE USING ((agent_id = auth.uid()) OR (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')));

CREATE POLICY "Only admins can manage system config" ON public.system_config FOR ALL USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')) WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));
CREATE POLICY "Only admins can view system config" ON public.system_config FOR SELECT USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can view all countries" ON public.countries FOR SELECT USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));
CREATE POLICY "Admins can insert countries" ON public.countries FOR INSERT WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));
CREATE POLICY "Admins can update countries" ON public.countries FOR UPDATE USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));
CREATE POLICY "Admins can delete countries" ON public.countries FOR DELETE USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can manage grants" ON public.grants FOR ALL USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')) WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can manage jobs" ON public.jobs FOR ALL USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')) WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can manage housing" ON public.housing FOR ALL USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')) WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can manage feature overrides" ON public.student_feature_overrides FOR ALL USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')) WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can manage all credits" ON public.user_credits FOR ALL USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')) WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can manage all transactions" ON public.credit_transactions FOR ALL USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')) WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can manage all referrals" ON public.referrals FOR ALL USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')) WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can view all spins" ON public.spin_wheel_logs FOR SELECT USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can manage mentors" ON public.mentors FOR ALL USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')) WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can manage all bookings" ON public.mentor_bookings FOR ALL USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')) WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can manage all streaks" ON public.daily_login_streaks FOR ALL USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')) WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can manage all payment transactions" ON public.payment_transactions FOR ALL USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')) WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can manage tariffs" ON public.tariffs FOR ALL USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')) WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

CREATE POLICY "Admins can view contact requests" ON public.contact_requests FOR SELECT USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));
CREATE POLICY "Admins can update contact requests" ON public.contact_requests FOR UPDATE USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin')) WITH CHECK (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));
CREATE POLICY "Admins can delete contact requests" ON public.contact_requests FOR DELETE USING (get_auth_user_role() IN ('admin', 'owner', 'manager', 'super_admin'));

-- 3. Deprecate legacy schema elements
DROP TABLE IF EXISTS public.user_roles;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP TYPE IF EXISTS public.app_role;
