import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, UtensilsCrossed } from 'lucide-react';
import PublicMenuOrder from '@/components/restaurant/PublicMenuOrder';

const db = supabase as any;

export default function QrMenu() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState<{ id: string; table_number: string; tenant_id: string } | null>(null);
  const [tenant, setTenant] = useState<{ name?: string; branding?: any } | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) { setNotFound(true); setLoading(false); return; }
      try {
        const { data: t } = await db.from('restaurant_tables')
          .select('id, table_number, tenant_id').eq('qr_token', token).maybeSingle();
        if (!t) { setNotFound(true); setLoading(false); return; }
        setTable(t);
        const { data: ten } = await db.from('tenants').select('name, config').eq('id', t.tenant_id).maybeSingle();
        if (ten) setTenant({ name: ten.name, branding: ten.config?.branding });
      } catch (e) { console.error(e); setNotFound(true); }
      finally { setLoading(false); }
    })();
  }, [token]);

  const brandColor = tenant?.branding?.primary_color || '#6d28d9';

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  if (notFound || !table) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-500 p-6 text-center">
      <UtensilsCrossed className="w-10 h-10 mb-3 opacity-40" />
      <h1 className="text-lg font-bold text-gray-700">QR kod topilmadi</h1>
      <p className="text-sm mt-1">Iltimos, ofitsiantni chaqiring yoki QR kodni qayta skanlang.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-3">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2 text-white" style={{ background: brandColor }}>
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">{tenant?.name || 'Menyu'}</h1>
          <p className="text-sm text-gray-500">Stol № {table.table_number} · Menyudan tanlab buyurtma bering</p>
        </div>
        <PublicMenuOrder
          tenantId={table.tenant_id}
          tenantName={tenant?.name}
          brandColor={brandColor}
          branding={tenant?.branding}
          table={{ id: table.id, table_number: table.table_number }}
        />
        <p className="text-center text-xs text-gray-400 pt-4">UniPath · unipath.me</p>
      </div>
    </div>
  );
}
