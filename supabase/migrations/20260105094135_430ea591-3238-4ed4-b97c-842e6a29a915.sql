-- Add policies to explicitly deny anonymous access to sensitive tables

-- 1. Profiles table - deny anonymous access
CREATE POLICY "Deny public access to profiles" 
ON public.profiles 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- 2. Visa applications table - deny anonymous access  
CREATE POLICY "Deny public access to visa applications"
ON public.visa_applications
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 3. Documents table - deny anonymous access
CREATE POLICY "Deny public access to documents"
ON public.documents
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 4. Visa documents table - deny anonymous access
CREATE POLICY "Deny public access to visa documents"
ON public.visa_documents
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 5. Expenses table - deny anonymous access
CREATE POLICY "Deny public access to expenses"
ON public.expenses
FOR ALL
TO anon
USING (false)
WITH CHECK (false);