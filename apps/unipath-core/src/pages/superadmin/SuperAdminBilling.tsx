import { useState } from "react";
import {
  CreditCard,
  Coins,
  TrendingUp,
  Hourglass,
  Search,
  Building2,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useSuperAdminStats, verticalLabel } from "@/hooks/useSuperAdminStats";
import PricingPlansPanel from "@/components/superadmin/PricingPlansPanel";
import { tenantStatusLabel, tenantStatusBadgeClass } from "@/lib/tenantStatus";

const fmt = (n: number) => n.toLocaleString("uz-UZ").replace(/,/g, " ");

export default function SuperAdminBilling() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading } = useSuperAdminStats();
  const totals = data?.totals;

  const tenants = data?.tenants || [];
  const liveTenants = data?.liveTenants || [];
  const pendingRevenue = tenants
    .filter((t) => t.status === "pending")
    .reduce((s, t) => s + t.monthlyPrice, 0);
  const unpaidCount = tenants.filter((t) => t.status === "suspended").length;

  // Plan distribution (live tenants)
  const planRows = Object.entries(data?.byPlan || {}).sort((a, b) => b[1] - a[1]);

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.plan || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const cards = [
    {
      label: "MRR (oylik daromad)",
      value: `${fmt(totals?.mrr ?? 0)} UZS`,
      sub: `${liveTenants.length} ta faol obuna`,
      icon: TrendingUp,
      color: "text-emerald-500",
    },
    {
      label: "O'rtacha chek (ARPA)",
      value: `${fmt(liveTenants.length ? Math.round((totals?.mrr ?? 0) / liveTenants.length) : 0)} UZS`,
      sub: "Faol firma boshiga",
      icon: Coins,
      color: "text-amber-500",
    },
    {
      label: "Kutilayotgan daromad",
      value: `${fmt(pendingRevenue)} UZS`,
      sub: `${totals?.pending ?? 0} ta tasdiq kutyapti`,
      icon: Hourglass,
      color: "text-amber-400",
    },
    {
      label: "Bloklangan obunalar",
      value: `${unpaidCount} ta`,
      sub: "To'lov to'xtatilgan firmalar",
      icon: CreditCard,
      color: "text-rose-500",
    },
  ];

  return (
    <div className="text-foreground font-sans space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">To'lovlar va tariflar</h1>
        <p className="text-white/50 mt-1 text-sm">
          Firmalar obunalari va oylik daromad — tarif narxlari (pricing_plans) bo'yicha real hisoblangan.
        </p>
      </div>

      {/* Finance Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="bg-muted/10 border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <c.icon className={`w-4 h-4 ${c.color}`} />
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-white/40" /> : c.value}
              </div>
              <p className="text-xs text-white/40 mt-1">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan distribution (real) */}
        <Card className="lg:col-span-1 bg-muted/5 border-white/5">
          <CardHeader>
            <CardTitle className="text-lg">Tariflar taqsimoti</CardTitle>
            <CardDescription className="text-xs">Faol firmalar tariflari bo'yicha</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {planRows.length === 0 && (
              <p className="text-white/40 text-sm">{isLoading ? "Yuklanmoqda..." : "Faol obuna yo'q."}</p>
            )}
            {planRows.map(([plan, count]) => (
              <div key={plan} className="p-3 bg-black/40 border border-white/5 rounded-xl flex justify-between items-center">
                <p className="font-bold text-white text-sm">{plan}</p>
                <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20">{count} ta firma</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Subscriptions table (real) */}
        <Card className="lg:col-span-2 bg-muted/5 border-white/5 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Firma obunalari</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Firma nomi yoki tarif bo'yicha izlash..."
                className="pl-8 bg-black/50 border-white/10 text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-12 text-center text-white/50 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Yuklanmoqda...
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="p-4">Firma (Tenant)</th>
                    <th className="p-4">Tarif</th>
                    <th className="p-4">Oylik summa</th>
                    <th className="p-4 text-right">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((t) => (
                    <motion.tr
                      key={t.id}
                      whileHover={{ backgroundColor: "rgba(255,255,255,0.01)" }}
                      className="text-sm transition-colors text-white/80"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2 font-semibold text-white">
                          <Building2 className="w-4 h-4 text-amber-500/60" />
                          {t.name}
                        </div>
                        <span className="text-xs text-white/40 ml-6">{verticalLabel(t.vertical)}</span>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">{t.plan || "—"}</td>
                      <td className="p-4 font-bold text-amber-500">
                        {t.monthlyPrice ? `${fmt(t.monthlyPrice)} ${t.currency}` : "—"}
                      </td>
                      <td className="p-4 text-right">
                        <Badge className={tenantStatusBadgeClass(t.status)}>{tenantStatusLabel(t.status)}</Badge>
                      </td>
                    </motion.tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center p-8 text-white/40">Firmalar topilmadi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Plan management — the tariffs the figures above are computed from */}
      <PricingPlansPanel />
    </div>
  );
}
