-- Scope the UniTour catalog to a single UniPath tenant (each tour tenant = one company).
-- The UniTour tables use company_id; UniPath resolves by tenant. Add tenant_id so a tour
-- tenant's admin creates/browses ONLY its own tours/destinations/etc.
ALTER TABLE public.tours        ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.hotels       ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.vehicles     ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.agents       ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE public.bookings     ADD COLUMN IF NOT EXISTS tenant_id uuid;

CREATE INDEX IF NOT EXISTS idx_tours_tenant        ON public.tours(tenant_id);
CREATE INDEX IF NOT EXISTS idx_destinations_tenant ON public.destinations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hotels_tenant       ON public.hotels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant     ON public.vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agents_tenant       ON public.agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant     ON public.bookings(tenant_id);
