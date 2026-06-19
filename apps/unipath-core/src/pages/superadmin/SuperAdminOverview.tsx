import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  CreditCard,
  Hourglass,
  Coins,
  BarChart3,
  Globe,
  Bell,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSuperAdminStats, verticalLabel } from "@/hooks/useSuperAdminStats";
import { tenantStatusLabel, tenantStatusBadgeClass } from "@/lib/tenantStatus";

const fmt = (n: number) => n.toLocaleString("uz-UZ").replace(/,/g, " ");

export default function SuperAdminOverview() {
  const { data, isLoading } = useSuperAdminStats();

  const totals = data?.totals;
  const verticalRows = Object.entries(data?.byVertical || {}).sort((a, b) => b[1] - a[1]);
  const pendingTenants = (data?.tenants || []).filter((t) => t.status === "pending");
  const recentTenants = (data?.tenants || []).slice(0, 6);

  const kpis = [
    { label: "Jami firmalar", value: totals?.tenants ?? 0, icon: Building2, color: "text-blue-400" },
    { label: "Faol firmalar", value: totals?.live ?? 0, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "Tasdiq kutyapti", value: totals?.pending ?? 0, icon: Hourglass, color: "text-amber-400" },
    { label: "Jami foydalanuvchilar", value: totals?.users ?? 0, icon: Users, color: "text-purple-400" },
  ];

  const quickLinks = [
    { label: "Firmalar", href: "/super-admin/tenants", icon: Building2 },
    { label: "Adminlar", href: "/super-admin/users", icon: Users },
    { label: "To'lovlar", href: "/super-admin/billing", icon: CreditCard },
    { label: "Analitika", href: "/super-admin/analytics", icon: BarChart3 },
    { label: "Domenlar", href: "/super-admin/domains", icon: Globe },
    { label: "Bildirishnomalar", href: "/super-admin/notifications", icon: Bell },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-white/50 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm">Platforma ma'lumotlari yuklanmoqda...</span>
      </div>
    );
  }

  return (
    <div className="text-foreground animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Bosh panel</h1>
        <p className="text-white/50 mt-1 text-sm">
          Platformaning real holati: firmalar, foydalanuvchilar va oylik daromad bir qarashda.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="bg-muted/10 border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-white/50 flex items-center gap-2">
                <k.icon className={`w-4 h-4 ${k.color}`} />
                {k.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{fmt(k.value)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MRR highlight */}
      <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Coins className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase font-bold tracking-widest">
                Oylik takrorlanuvchi daromad (MRR)
              </p>
              <p className="text-2xl font-extrabold text-white">{fmt(totals?.mrr ?? 0)} UZS</p>
            </div>
          </div>
          <p className="text-xs text-white/40 max-w-[220px] text-right hidden md:block">
            Faol firmalarning tarif narxlari yig'indisi (pricing_plans bo'yicha real).
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vertical distribution */}
        <Card className="bg-muted/5 border-white/5">
          <CardHeader>
            <CardTitle className="text-lg">Sohalar taqsimoti</CardTitle>
            <CardDescription className="text-xs">Firmalar biznes turlari bo'yicha</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {verticalRows.length === 0 && <p className="text-white/40 text-sm">Firmalar yo'q.</p>}
            {verticalRows.map(([v, count]) => {
              const pct = totals?.tenants ? Math.round((count / totals.tenants) * 100) : 0;
              return (
                <div key={v} className="space-y-1.5">
                  <div className="flex justify-between text-sm text-white/80">
                    <span>{verticalLabel(v)}</span>
                    <span className="font-semibold text-white">{count} ta</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Pending approvals */}
        <Card className="bg-muted/5 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Tasdiqlash kutilmoqda</CardTitle>
              <CardDescription className="text-xs">Yangi ro'yxatdan o'tgan firmalar</CardDescription>
            </div>
            {pendingTenants.length > 0 && (
              <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {pendingTenants.length}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingTenants.length === 0 ? (
              <p className="text-white/40 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Kutilayotgan so'rovlar yo'q.
              </p>
            ) : (
              pendingTenants.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{t.name}</p>
                    <p className="text-[11px] text-white/40">{verticalLabel(t.vertical)}</p>
                  </div>
                </div>
              ))
            )}
            {pendingTenants.length > 0 && (
              <Link to="/super-admin/tenants">
                <Button variant="ghost" className="w-full mt-2 text-amber-500 hover:bg-amber-500/10 gap-1 text-sm">
                  Firmalar bo'limida ko'rish <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card className="bg-muted/5 border-white/5">
          <CardHeader>
            <CardTitle className="text-lg">Tezkor o'tish</CardTitle>
            <CardDescription className="text-xs">Boshqaruv bo'limlari</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {quickLinks.map((q) => (
              <Link
                key={q.href}
                to={q.href}
                className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-white/5 text-white/80 hover:text-primary transition-colors text-sm"
              >
                <q.icon className="w-4 h-4" />
                {q.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent tenants */}
      <Card className="bg-muted/5 border-white/5 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Oxirgi qo'shilgan firmalar</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold text-white/40 uppercase tracking-wider">
                <th className="p-4">Firma</th>
                <th className="p-4">Soha</th>
                <th className="p-4">Tarif</th>
                <th className="p-4">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-white/80">
              {recentTenants.map((t) => (
                <tr key={t.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-4 font-semibold text-white">{t.name}</td>
                  <td className="p-4 text-primary">{verticalLabel(t.vertical)}</td>
                  <td className="p-4 text-white/60">{t.plan || "—"}</td>
                  <td className="p-4">
                    <Badge className={tenantStatusBadgeClass(t.status)}>{tenantStatusLabel(t.status)}</Badge>
                  </td>
                </tr>
              ))}
              {recentTenants.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-white/40">Firmalar topilmadi.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
