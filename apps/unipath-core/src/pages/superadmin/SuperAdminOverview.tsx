import { useState } from "react";
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
  Plus,
  LogIn,
  Settings,
  Search,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSuperAdminStats, verticalLabel } from "@/hooks/useSuperAdminStats";
import { tenantStatusLabel, tenantStatusBadgeClass } from "@/lib/tenantStatus";
import { verticalStyle, impersonateTenant } from "@/lib/verticalConfig";

const fmt = (n: number) => n.toLocaleString("uz-UZ").replace(/,/g, " ");

export default function SuperAdminOverview() {
  const { data, isLoading } = useSuperAdminStats();

  const totals = data?.totals;
  const planRows = Object.entries(data?.byPlan || {}).sort((a, b) => b[1] - a[1]);
  const pendingTenants = (data?.tenants || []).filter((t) => t.status === "pending");
  const [search, setSearch] = useState("");
  const allTenants = data?.tenants || [];
  const q = search.trim().toLowerCase();
  const shown = q
    ? allTenants.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.subdomain?.toLowerCase().includes(q) ||
          verticalLabel(t.vertical).toLowerCase().includes(q) ||
          (t.vertical || "").toLowerCase().includes(q),
      )
    : allTenants.slice(0, 9);
  const recentTenants = shown;

  const kpis = [
    { label: "Jami firmalar", value: totals?.tenants ?? 0, icon: Building2, color: "text-blue-400" },
    { label: "Faol firmalar", value: totals?.live ?? 0, icon: CheckCircle2, color: "text-emerald-400" },
    { label: "Tasdiq kutyapti", value: totals?.pending ?? 0, icon: Hourglass, color: "text-amber-400" },
    { label: "Jami foydalanuvchilar", value: totals?.users ?? 0, icon: Users, color: "text-purple-400" },
  ];

  const tiles = [
    { label: "Firmalar",   desc: "Barcha bizneslar", href: "/super-admin/tenants",       icon: Building2,  grad: "from-blue-500/20 to-blue-500/5",       text: "text-blue-400" },
    { label: "To'lovlar",  desc: "Buxgalteriya",     href: "/super-admin/billing",        icon: CreditCard, grad: "from-emerald-500/20 to-emerald-500/5", text: "text-emerald-400" },
    { label: "Tariflar",   desc: "Rejalar & narx",   href: "/super-admin/tenants",        icon: Coins,      grad: "from-amber-500/20 to-amber-500/5",     text: "text-amber-400" },
    { label: "Domenlar",   desc: "Sub-domenlar",     href: "/super-admin/domains",        icon: Globe,      grad: "from-sky-500/20 to-sky-500/5",         text: "text-sky-400" },
    { label: "Analitika",  desc: "Hisobotlar",       href: "/super-admin/analytics",      icon: BarChart3,  grad: "from-violet-500/20 to-violet-500/5",   text: "text-violet-400" },
    { label: "Bildirishnoma", desc: "Xabarlar",      href: "/super-admin/notifications",  icon: Bell,       grad: "from-rose-500/20 to-rose-500/5",       text: "text-rose-400" },
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Bosh panel</h1>
          <p className="text-white/50 mt-1 text-sm">
            Barcha biznes turlarini (Tur, Akademiya, Mehmonxona, Restoran, Konsalting va boshqalar) bitta joydan boshqaring.
          </p>
        </div>
        <Link to="/super-admin/tenants">
          <Button className="gap-2 rounded-xl font-bold shrink-0">
            <Plus className="w-4 h-4" /> Yangi firma + admin
          </Button>
        </Link>
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

      {/* Quick-action tiles — control center */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Boshqaruv markazi</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {tiles.map((tile) => (
            <Link
              key={tile.label}
              to={tile.href}
              className={`rounded-2xl p-4 border border-white/5 bg-gradient-to-br ${tile.grad} hover:scale-[1.03] hover:shadow-lg hover:shadow-black/20 transition-all`}
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                <tile.icon className={`w-5 h-5 ${tile.text}`} />
              </div>
              <p className="font-bold text-white text-sm">{tile.label}</p>
              <p className="text-[11px] text-white/40">{tile.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan distribution */}
        <Card className="bg-muted/5 border-white/5">
          <CardHeader>
            <CardTitle className="text-lg">Tariflar taqsimoti</CardTitle>
            <CardDescription className="text-xs">Faol firmalar tarif rejalari bo'yicha</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {planRows.length === 0 && <p className="text-white/40 text-sm">Firmalar yo'q.</p>}
            {planRows.map(([v, count]) => {
              const pct = totals?.live ? Math.round((count / totals.live) * 100) : 0;
              return (
                <div key={v} className="space-y-1.5">
                  <div className="flex justify-between text-sm text-white/80">
                    <span>{v}</span>
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

      </div>

      {/* Tenants — vertical-aware cards (each business type looks like itself) */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Firmalar</h2>
            <p className="text-xs text-white/40">Har biznes o'z turiga mos — bir bosishda ichiga kiring yoki boshqaring</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Firma, subdomen yoki tur bo'yicha qidirish..."
                className="pl-9 h-10 bg-white/5 border-white/10 text-white rounded-xl text-sm placeholder:text-white/30"
              />
            </div>
            <Link to="/super-admin/tenants">
              <Button variant="ghost" className="text-primary hover:bg-primary/10 gap-1 text-sm shrink-0">
                Barchasi <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {q && (
          <p className="text-xs text-white/40 mb-3">{shown.length} ta firma topildi{shown.length ? "" : " — boshqacha qidiring"}</p>
        )}

        {recentTenants.length === 0 ? (
          <Card className="bg-muted/5 border-white/5">
            <CardContent className="p-10 text-center text-white/40">Firmalar topilmadi.</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTenants.map((t) => {
              const s = verticalStyle(t.vertical);
              const Icon = s.icon;
              return (
                <div
                  key={t.id}
                  className={`rounded-2xl p-4 border ${s.ring} bg-gradient-to-br ${s.grad} hover:shadow-lg hover:shadow-black/20 transition-all`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <Icon className={`w-5 h-5 ${s.text}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{t.name}</p>
                        <p className="text-[11px] text-white/50 truncate">
                          {t.subdomain ? `${t.subdomain}.unipath.me` : (t.custom_domain || "—")}
                        </p>
                      </div>
                    </div>
                    <Badge className={tenantStatusBadgeClass(t.status)}>{tenantStatusLabel(t.status)}</Badge>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className={`font-semibold ${s.text}`}>{verticalLabel(t.vertical)}</span>
                    <span className="text-white/50">
                      {t.plan || "—"}{t.monthlyPrice ? ` · ${fmt(t.monthlyPrice)} UZS/oy` : ""}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => impersonateTenant(t)}
                      className="flex-1 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold gap-1.5"
                    >
                      <LogIn className="w-3.5 h-3.5" /> Kirish
                    </Button>
                    <Link to="/super-admin/tenants" className="flex-1">
                      <Button variant="outline" className="w-full h-9 rounded-xl text-xs gap-1.5 border-white/10 bg-transparent text-white/80 hover:bg-white/5">
                        <Settings className="w-3.5 h-3.5" /> Boshqarish
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
