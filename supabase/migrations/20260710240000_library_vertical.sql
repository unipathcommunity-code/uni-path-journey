-- Library vertical: real DB backing (catalog + loans).
CREATE TABLE IF NOT EXISTS public.library_books (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL DEFAULT current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  title      text NOT NULL,
  author     text,
  category   text,
  copies     integer NOT NULL DEFAULT 1,
  available  integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_library_books_tenant ON public.library_books(tenant_id);

CREATE TABLE IF NOT EXISTS public.library_loans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL DEFAULT current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  book_title      text NOT NULL,
  borrower_name   text,
  borrower_phone  text,
  loan_date       date DEFAULT CURRENT_DATE,
  return_deadline date,
  status          text NOT NULL DEFAULT 'active',   -- active | returned | overdue
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_library_loans_tenant ON public.library_loans(tenant_id);

ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_loans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lib_books_staff" ON public.library_books;
CREATE POLICY "lib_books_staff" ON public.library_books FOR ALL TO authenticated
  USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
DROP POLICY IF EXISTS "lib_loans_staff" ON public.library_loans;
CREATE POLICY "lib_loans_staff" ON public.library_loans FOR ALL TO authenticated
  USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
