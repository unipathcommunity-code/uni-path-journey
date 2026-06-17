import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3, Users, FileText, Building, Layers, Globe2, Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TenantRow {
  name: string;
  vertical: string;
  subdomain: string;
  users: number;
  orders: number | null;   // null = manba mavjud emas
  status: string;
}

const VERTICAL_LABELS: Record<string, string> = {
  tour: "Turizm", academy: "Akademiya", consulting: "Konsalting", hotel: "Mehmonxona",
  restaurant: "Restoran", clinic: "Klinika", gym: "Sport zal", pharmacy: "Dorixona",
};

function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function monthLabel(d: Date) { return d.toLocaleString("default", { month: "short" }); }

export default function SuperAdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, orders: null as number | null, activeTenants: 0, totalTenants: 0 });
  const [tenantsList, setTenantsList] = useState<TenantRow[]>([]);
  const [verticals, setVerticals] = useState<{ name: string; count: number; pct: number }[]>([]);
  const [monthly, setMonthly] = useState<{ label: string; count: number; pct: number }[]>([]);
  const [ordersAvailable, setOrdersAvailable] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // 1. Tenants (real).
        const { data: tenants, error: tErr } = await supabase
          .from("tenants").select("*").order("created_at", { ascending: false });
        if (tErr) throw tErr;
        const tlist = tenants || [];

        // 2. All profiles (real) — one query, count per tenant client-side.
        const { data: profiles } = await supabase.from("profiles").select("tenant_id, created_at");
        const usersByTenant = new Map<string, number>();
        (profiles || []).forEach((p: any) => {
          if (p.tenant_id) usersByTenant.set(p.tenant_id, (usersByTenant.get(p.tenant_id) || 0) + 1);
        });

        // 3. Applications per tenant (real if the column exists; else honest null).
        let appsByTenant: Map<string, number> | null = new Map();
        let totalApps: number | null = 0;
        try {
          const { data: apps, error: aErr } = await supabase.from("applications").select("tenant_id");
          if (aErr) throw aErr;
          (apps || []).forEach((a: any) => {
            if (a.tenant_id) appsByTenant!.set(a.tenant_id, (appsByTenant!.get(a.tenant_id) || 0) + 1);
          });
          totalApps = (apps || []).length;
        } catch {
          appsByTenant = null; totalApps = null; setOrdersAvailable(false);
        }

        // 4. Per-tenant rows (real).
        const rows: TenantRow[] = tlist.map((t: any) => {
          const vertical = (t.business_type || t.config?.business_type || "consulting") as string;
          return {
            name: t.name || "Noma'lum",
            vertical: VERTICAL_LABELS[vertical] || vertical,
            subdomain: t.subdomain || "—",
            users: usersByTenant.get(t.id) || 0,
            orders: appsByTenant ? (appsByTenant.get(t.id) || 0) : null,
            status: t.status || "—",
          };
        });
        setTenantsList(rows);

        // 5. Vertical breakdown (real).
        const vCount = new Map<string, number>();
        tlist.forEach((t: any) => {
          const v = (t.business_type || t.config?.business_type || "consulting") as string;
          vCount.set(v, (vCount.get(v) || 0) + 1);
        });
        const vTotal = tlist.length || 1;
        setVerticals(
          [...vCount.entries()]
            .map(([k, c]) => ({ name: VERTICAL_LABELS[k] || k, count: c, pct: Math.round((c / vTotal) * 100) }))
            .sort((a, b) => b.count - a.count)
        );

        // 6. Monthly new tenants, last 6 months (real, from created_at).
        const months: Date[] = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
        const counts = months.map((m) => {
          const key = monthKey(m);
          const c = tlist.filter((t: any) => t.created_at && monthKey(new Date(t.created_at)) === key).length;
          return { label: monthLabel(m), count: c };
        });
        const maxC = Math.max(1, ...counts.map((c) => c.count));
        setMonthly(counts.map((c) => ({ ...c, pct: Math.round((c.count / maxC) * 100) })));

        setStats({
          users: (profiles || []).length,
          orders: totalApps,
          activeTenants: tlist.filter((t: any) => t.status === "active" || t.status === "approved").length,
          totalTenants: tlist.length,
        });
      } catch (err) {
        console.error("Analytics error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="text-foreground font-sans space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platforma analitikasi</h1>
        <p className="text-white/50 mt-1 text-sm">
          Barcha ko'rsatkichlar bevosita ma'lumotlar bazasidan (Supabase). Manba bo'lmasa "—" ko'rsatiladi.
        </p>
      </div>

      {/* Real stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Foydalanuvchilar", value: loading ? null : stats.users, icon: Users, color: "text-white" },
          { label: "Arizalar", value: loading ? null : (stats.orders ?? "—"), icon: FileText, color: "text-blue-400", note: !ordersAvailable ? "Manba yo'q" : undefined },
          { label: "Faol bizneslar", value: loading ? null : stats.activeTenants, icon: Building, color: "text-emerald-400" },
          { label: "Jami bizneslar", value: loading ? null : stats.totalTenants, icon: Layers, color: "text-purple-400" },
        ].map((s) => (
          <Card key={s.label} className="bg-muted/10 border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <s.icon className="w-4 h-4 text-amber-500" /> {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${s.color}`}>
                {s.value === null ? <Loader2 className="w-6 h-6 animate-spin text-amber-500" /> : s.value}
              </div>
              {s.note && <p className="text-[10px] text-white/30 mt-1">{s.note}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vertical breakdown (real) */}
        <Card className="lg:col-span-1 bg-muted/5 border-white/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Globe2 className="w-5 h-5 text-amber-500" /> Bizneslar sohalari</CardTitle>
            <CardDescription className="text-xs">Ro'yxatdagi bizneslar vertikallar bo'yicha</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="py-6 text-center"><Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" /></div>
            ) : verticals.length === 0 ? (
              <p className="text-sm text-white/40 py-4 text-center">Ma'lumot yo'q</p>
            ) : verticals.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between text-sm text-white/80">
                  <span>{item.name}</span>
                  <span className="font-semibold text-white">{item.count} ta ({item.pct}%)</span>
                </div>
                <Progress value={item.pct} className="h-2 bg-white/5" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Monthly new tenants (real) */}
        <Card className="lg:col-span-2 bg-muted/5 border-white/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-amber-500" /> Oylik yangi bizneslar</CardTitle>
            <CardDescription className="text-xs">Oxirgi 6 oyda ro'yxatdan o'tgan bizneslar (created_at)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-56 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
            ) : (
              <div className="h-56 flex items-end justify-between gap-2 pt-4 px-2 border-b border-white/5">
                {monthly.map((bar) => (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] text-white/40 group-hover:text-amber-500 transition-colors">{bar.count}</span>
                    <div className="w-full bg-gradient-to-t from-amber-500/20 to-amber-500 rounded-t-md transition-all duration-300"
                      style={{ height: `${Math.max(4, bar.pct)}%` }} />
                    <span className="text-xs text-white/60 mt-1">{bar.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-tenant table (real) */}
      <Card className="bg-muted/5 border-white/5 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-amber-500" /> Bizneslar bo'yicha real ko'rsatkichlar</CardTitle>
          <CardDescription className="text-xs">Har bir biznes uchun bazadagi haqiqiy foydalanuvchi va ariza soni</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-white/50 text-sm"><Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Biznes</th>
                  <th className="p-4">Soha</th>
                  <th className="p-4">Subdomen</th>
                  <th className="p-4">Foydalanuvchilar</th>
                  <th className="p-4">Arizalar</th>
                  <th className="p-4">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-white/80">
                {tenantsList.map((t, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 font-semibold text-white">{t.name}</td>
                    <td className="p-4 text-amber-500">{t.vertical}</td>
                    <td className="p-4 text-blue-400 font-mono text-xs">{t.subdomain === "—" ? "—" : `${t.subdomain}.unipath.me`}</td>
                    <td className="p-4">{t.users}</td>
                    <td className="p-4 text-muted-foreground">{t.orders === null ? "—" : t.orders}</td>
                    <td className="p-4">
                      <span className={t.status === "active" || t.status === "approved" ? "text-emerald-500" : t.status === "pending" ? "text-amber-500" : "text-white/40"}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {tenantsList.length === 0 && (
                  <tr><td colSpan={6} className="text-center p-8 text-white/40">Biznes topilmadi</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
