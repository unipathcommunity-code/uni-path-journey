import {
  BarChart3,
  Users,
  TrendingUp,
  Building,
  Coins,
  Layers,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useSuperAdminStats, verticalLabel } from "@/hooks/useSuperAdminStats";
import { tenantStatusLabel, tenantStatusBadgeClass } from "@/lib/tenantStatus";

const fmt = (n: number) => n.toLocaleString("uz-UZ").replace(/,/g, " ");

export default function SuperAdminAnalytics() {
  const { data, isLoading } = useSuperAdminStats();
  const totals = data?.totals;

  const planRows = Object.entries(data?.byPlan || {}).sort((a, b) => b[1] - a[1]);
  const trend = data?.trend || [];
  const maxTrend = Math.max(1, ...trend.map((t) => t.count));

  const stats = [
    { label: "Faol firmalar", value: `${fmt(totals?.live ?? 0)} ta`, icon: Building, color: "text-emerald-400" },
    { label: "Jami firmalar", value: `${fmt(totals?.tenants ?? 0)} ta`, icon: Layers, color: "text-blue-400" },
    { label: "Jami foydalanuvchilar", value: fmt(totals?.users ?? 0), icon: Users, color: "text-purple-400" },
    { label: "Oylik daromad (MRR)", value: `${fmt(totals?.mrr ?? 0)} UZS`, icon: Coins, color: "text-amber-400" },
  ];

  return (
    <div className="text-foreground font-sans space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platforma analitikasi</h1>
        <p className="text-white/50 mt-1 text-sm">
          Barcha ma'lumotlar Supabase'dagi real firmalar va foydalanuvchilar asosida hisoblanadi.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="bg-muted/10 border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-white/40" /> : s.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan distribution (real) */}
        <Card className="lg:col-span-1 bg-muted/5 border-white/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              Tariflar bo'yicha taqsimot
            </CardTitle>
            <CardDescription className="text-xs">Faol firmalar tarif rejalari ulushi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {planRows.length === 0 && (
              <p className="text-white/40 text-sm">{isLoading ? "Yuklanmoqda..." : "Ma'lumot yo'q."}</p>
            )}
            {planRows.map(([v, count]) => {
              const pct = totals?.live ? Math.round((count / totals.live) * 100) : 0;
              return (
                <div key={v} className="space-y-2">
                  <div className="flex justify-between text-sm text-white/80">
                    <span>{v}</span>
                    <span className="font-semibold text-white">{count} ta ({pct}%)</span>
                  </div>
                  <Progress value={pct} className="h-2 bg-white/5" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Monthly growth (real, from created_at) */}
        <Card className="lg:col-span-2 bg-muted/5 border-white/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              Oylik yangi firmalar
            </CardTitle>
            <CardDescription className="text-xs">Oxirgi 6 oyda platformaga qo'shilgan firmalar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 flex items-end justify-between gap-2 pt-4 px-2 border-b border-white/5">
              {trend.map((bar) => (
                <div key={bar.label} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] text-white/40 group-hover:text-amber-500 transition-colors">
                    {bar.count}
                  </span>
                  <div
                    className="w-full bg-gradient-to-t from-amber-500/20 to-amber-500 rounded-t-md hover:brightness-110 transition-all duration-300"
                    style={{ height: `${Math.round((bar.count / maxTrend) * 100)}%`, minHeight: bar.count > 0 ? "6px" : "2px" }}
                  />
                  <span className="text-xs text-white/60 mt-1">{bar.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenant table (real) */}
      <Card className="bg-muted/5 border-white/5 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            Firmalar ro'yxati
          </CardTitle>
          <CardDescription className="text-xs">Supabase'dagi barcha ro'yxatdan o'tgan firmalar</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-white/50 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Ma'lumotlar bazasidan yuklanmoqda...
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Firma nomi</th>
                  <th className="p-4">Biznes sohasi</th>
                  <th className="p-4">Domen</th>
                  <th className="p-4">Tarif</th>
                  <th className="p-4">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-white/80">
                {(data?.tenants || []).map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 font-semibold text-white">{t.name}</td>
                    <td className="p-4 text-amber-500">{verticalLabel(t.vertical)}</td>
                    <td className="p-4 text-blue-400 font-mono text-xs">
                      {t.subdomain ? `${t.subdomain}.unipath.me` : t.custom_domain || "—"}
                    </td>
                    <td className="p-4 text-white/60">{t.plan || "—"}</td>
                    <td className="p-4">
                      <Badge className={tenantStatusBadgeClass(t.status)}>{tenantStatusLabel(t.status)}</Badge>
                    </td>
                  </tr>
                ))}
                {(data?.tenants || []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-white/40">Firmalar topilmadi.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
