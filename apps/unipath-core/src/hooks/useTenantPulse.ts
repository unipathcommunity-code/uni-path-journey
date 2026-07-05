import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;
const fmt = (n: number) => `${Math.round(n || 0).toLocaleString('ru-RU')}`;

export interface TenantPulse { label: string; value: string }

/**
 * One live "primary metric" per tenant, keyed by tenant_id, computed with just a
 * few cross-tenant aggregate queries (super-admin RLS reads all). Lets each tenant
 * card on the super-admin panel show how that specific business is doing today.
 */
export function useTenantPulse() {
  const [byTenant, setByTenant] = useState<Record<string, TenantPulse>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const startIso = start.toISOString();
      const today = start.toISOString().split('T')[0];
      try {
        const [rest, hotel, events] = await Promise.all([
          db.from('restaurant_orders').select('tenant_id,total,status').gte('created_at', startIso),
          db.from('hotel_bookings').select('tenant_id,status').eq('status', 'checked_in'),
          db.from('event_bookings').select('tenant_id,event_date,status').gte('event_date', today).in('status', ['pending', 'confirmed']),
        ]);

        const map: Record<string, TenantPulse> = {};

        // Restaurant — today's paid revenue
        const rev: Record<string, number> = {};
        ((rest.data || []) as any[]).forEach(o => {
          if (o.status === 'paid') rev[o.tenant_id] = (rev[o.tenant_id] || 0) + Number(o.total || 0);
          else if (!(o.tenant_id in rev)) rev[o.tenant_id] = rev[o.tenant_id] || 0;
        });
        Object.entries(rev).forEach(([tid, v]) => { map[tid] = { label: 'Bugungi tushum', value: `${fmt(v)} so'm` }; });

        // Hotel — guests currently in-house
        const inhouse: Record<string, number> = {};
        ((hotel.data || []) as any[]).forEach(b => { inhouse[b.tenant_id] = (inhouse[b.tenant_id] || 0) + 1; });
        Object.entries(inhouse).forEach(([tid, n]) => { map[tid] = { label: 'Joylashgan', value: `${n} mehmon` }; });

        // Wedding hall — upcoming events
        const upcoming: Record<string, number> = {};
        ((events.data || []) as any[]).forEach(e => { upcoming[e.tenant_id] = (upcoming[e.tenant_id] || 0) + 1; });
        Object.entries(upcoming).forEach(([tid, n]) => { map[tid] = { label: 'Yaqin tadbir', value: `${n} ta` }; });

        setByTenant(map);
      } catch (e) {
        console.error('Tenant pulse error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { byTenant, loading };
}
