import { useEffect, useState } from "react";
import { Receipt, Wallet, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import FeatureGate from "@/components/FeatureGate";
import AccountantHeader from "@/components/accountant/AccountantHeader";
import AccountantStats from "@/components/accountant/AccountantStats";
import InvoicesSection, { type Invoice } from "@/components/accountant/InvoicesSection";
import SalariesSection, { type Salary } from "@/components/accountant/SalariesSection";
import TelegramQuickWidget from "@/components/TelegramQuickWidget";

const AccountantDashboard = () => {
  const { user, hasRole } = useAuth();
  const [tab, setTab] = useState<"invoices" | "salaries" | "reconcile">("invoices");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);

  const allowed = hasRole("accountant") || hasRole("admin") || hasRole("superadmin");

  const load = async () => {
    setLoading(true);
    const [invRes, salRes] = await Promise.all([
      supabase.from("invoices").select("*").order("issued_at", { ascending: false }).limit(200),
      supabase.from("salaries").select("*").order("period_month", { ascending: false }).limit(200),
    ]);
    setInvoices((invRes.data as any) || []);
    setSalaries((salRes.data as any) || []);
    setLoading(false);
  };

  useEffect(() => { if (allowed) load(); }, [allowed]);

  if (!allowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-strong p-8 text-center max-w-sm">
          <Wallet className="w-12 h-12 mx-auto text-destructive mb-3" />
          <h2 className="text-xl font-heading font-bold mb-2">Faqat buxgalter</h2>
          <p className="text-sm text-muted-foreground">Bu sahifaga faqat buxgalter va admin kira oladi.</p>
        </div>
      </div>
    );
  }

  const totalRevenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);
  const pending = invoices.filter((i) => i.status === "sent" || i.status === "draft").reduce((s, i) => s + Number(i.amount), 0);
  const overdue = invoices.filter((i) => i.status === "overdue").length;
  const totalSalaries = salaries.filter((s) => s.status === "pending").reduce((acc, s) => acc + Number(s.base_amount) + Number(s.bonus_amount) - Number(s.deductions), 0);

  return (
    <FeatureGate feature="payments">
      <div className="min-h-screen bg-background pb-20">
        <AccountantHeader />

        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <TelegramQuickWidget />
          <AccountantStats totalRevenue={totalRevenue} pending={pending} overdue={overdue} totalSalaries={totalSalaries} />

          <div className="flex gap-2 border-b border-border">
            {(["invoices", "salaries", "reconcile"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-semibold transition border-b-2 ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                {t === "invoices" ? "Hisob-fakturalar" : t === "salaries" ? "Maoshlar" : "Taqqoslash"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
          ) : tab === "invoices" ? (
            <InvoicesSection invoices={invoices} userId={user?.id} reload={load} />
          ) : tab === "salaries" ? (
            <SalariesSection salaries={salaries} />
          ) : (
            <div className="glass p-8 text-center rounded-xl">
              <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-heading font-bold text-lg mb-1">To'lov taqqoslashi</h3>
              <p className="text-sm text-muted-foreground">Bank ko'chirmasi vs hisob-fakturalar — keyingi iteratsiyada qo'shamiz.</p>
            </div>
          )}
        </main>
      </div>
    </FeatureGate>
  );
};

export default AccountantDashboard;
