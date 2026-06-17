import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Check, X, Loader2, Building2, ExternalLink, Search, Power,
  CheckCircle2, Clock, Ban, Globe, Pencil, UserCog, Trash2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const STATUS_TABS = [
  { key: "all", label: "Hammasi", icon: Building2 },
  { key: "pending", label: "Kutilmoqda", icon: Clock },
  { key: "approved", label: "Faol", icon: CheckCircle2 },
  { key: "suspended", label: "To'xtatilgan", icon: Ban },
];

const Stat = ({ icon: Icon, label, value, accent, delay }: any) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.25 }}>
    <Card className="p-4 rounded-2xl border-border/60 hover:shadow-md transition">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2.5 ${accent}`}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-0.5 tracking-tight">{value}</p>
    </Card>
  </motion.div>
);

const AdminTourCompanies = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const impersonate = useMutation({
    mutationFn: async (companyId: string) => {
      if (!user) throw new Error("Auth");
      const { error } = await (supabase as any).from("super_admin_impersonations").insert({
        super_admin_id: user.id, company_id: companyId, reason: "Site editor / panel access",
      });
      if (error) throw error;
    },
    onSuccess: (_, companyId) => {
      sessionStorage.setItem("impersonating_company", companyId);
      toast.success("Kompaniya nomidan kirdingiz");
      navigate("/company");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const { data: companies, isLoading } = useQuery({
    queryKey: ["admin-tour-companies"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("tour_companies").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const payload: any = { status };
      if (status === "approved") payload.approved_at = new Date().toISOString();
      const { error } = await (supabase as any).from("tour_companies").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Holat yangilandi"); qc.invalidateQueries({ queryKey: ["admin-tour-companies"] }); },
    onError: (e: any) => toast.error(e?.message || "Xatolik"),
  });

  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("tour_companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Kompaniya o'chirildi"); qc.invalidateQueries({ queryKey: ["admin-tour-companies"] }); },
    onError: (e: any) => toast.error(e?.message || "O'chirib bo'lmadi"),
  });

  const counts = useMemo(() => {
    const list = companies || [];
    return {
      all: list.length,
      pending: list.filter((c: any) => c.status === "pending").length,
      approved: list.filter((c: any) => c.status === "approved").length,
      suspended: list.filter((c: any) => c.status === "suspended").length,
    };
  }, [companies]);

  const filtered = useMemo(() => {
    let list = companies || [];
    if (tab !== "all") list = list.filter((c: any) => c.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c: any) =>
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [companies, tab, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tour kompaniyalar</h1>
          <p className="text-sm text-muted-foreground mt-1">Ro'yxat, tasdiqlash va boshqaruv</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
          <Input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, slug yoki email..."
            className="pl-9 h-9 rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Building2} label="Jami" value={counts.all} accent="bg-primary/10 text-primary" delay={0.05} />
        <Stat icon={Clock} label="Kutilmoqda" value={counts.pending} accent="bg-amber-500/10 text-amber-600" delay={0.1} />
        <Stat icon={CheckCircle2} label="Faol" value={counts.approved} accent="bg-emerald-500/10 text-emerald-600" delay={0.15} />
        <Stat icon={Ban} label="To'xtatilgan" value={counts.suspended} accent="bg-rose-500/10 text-rose-600" delay={0.2} />
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit overflow-x-auto">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
              tab === t.key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            {t.label}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted-foreground/10">{(counts as any)[t.key]}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : !filtered?.length ? (
        <Card className="p-12 text-center rounded-2xl border-border/60">
          <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Bu bo'limda kompaniyalar yo'q</p>
        </Card>
      ) : (
        <div className="grid gap-2.5">
          {filtered.map((c: any, i: number) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.25 }}>
              <Card className="p-4 rounded-2xl border-border/60 hover:shadow-sm transition">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  {c.logo_url ? (
                    <img src={c.logo_url} className="h-11 w-11 rounded-xl object-cover shrink-0" alt="" />
                  ) : (
                    <div
                      className="h-11 w-11 rounded-xl flex items-center justify-center font-semibold text-sm text-white shrink-0"
                      style={{ background: `linear-gradient(135deg, ${c.primary_color || "#4B8BF5"}, ${c.secondary_color || "#1E40AF"})` }}
                    >
                      {c.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm truncate">{c.name}</h3>
                      <Badge
                        variant={c.status === "approved" ? "default" : c.status === "pending" ? "secondary" : "destructive"}
                        className="text-[10px] font-normal"
                      >
                        {c.status === "approved" ? "Faol" : c.status === "pending" ? "Kutilmoqda" : "To'xtatilgan"}
                      </Badge>
                      {c.subscription_plan && c.subscription_plan !== "free" && (
                        <Badge variant="outline" className="text-[10px] font-normal capitalize">{c.subscription_plan}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1 flex-wrap">
                      <span className="flex items-center gap-1 truncate"><Globe className="h-3 w-3" strokeWidth={1.75} />unitour.me/{c.slug}</span>
                      {c.email && <span className="truncate">· {c.email}</span>}
                      <span>· {format(new Date(c.created_at), "dd MMM yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 flex-wrap">
                    <a href={`/${c.slug}`} target="_blank" rel="noopener noreferrer" title="Saytni ochish">
                      <Button size="icon" variant="outline" className="rounded-lg h-8 w-8"><ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} /></Button>
                    </a>
                    <Link to={`/admin/site-editor/${c.id}`} title="Sayt tahriri">
                      <Button size="icon" variant="outline" className="rounded-lg h-8 w-8"><Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /></Button>
                    </Link>
                    <Button
                      size="icon" variant="outline" className="rounded-lg h-8 w-8"
                      title="Kompaniya nomidan kirish"
                      onClick={() => impersonate.mutate(c.id)}
                    >
                      <UserCog className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Button>
                    {c.status === "pending" && (
                      <Button size="sm" className="rounded-lg h-8 text-xs" onClick={() => updateStatus.mutate({ id: c.id, status: "approved" })}>
                        <Check className="h-3.5 w-3.5 mr-1" strokeWidth={1.75} /> Tasdiq
                      </Button>
                    )}
                    {c.status === "approved" && (
                      <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs" onClick={() => updateStatus.mutate({ id: c.id, status: "suspended" })}>
                        <X className="h-3.5 w-3.5 mr-1" strokeWidth={1.75} /> To'xtat
                      </Button>
                    )}
                    {c.status === "suspended" && (
                      <Button size="sm" className="rounded-lg h-8 text-xs" onClick={() => updateStatus.mutate({ id: c.id, status: "approved" })}>
                        <Power className="h-3.5 w-3.5 mr-1" strokeWidth={1.75} /> Yoqish
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="outline" className="rounded-lg h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" title="O'chirish">
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Kompaniyani o'chirish?</AlertDialogTitle>
                          <AlertDialogDescription>
                            <strong>{c.name}</strong> butunlay o'chiriladi. Barcha turlar, buyurtmalar va sayt ma'lumotlari yo'qoladi. Bu amalni qaytarib bo'lmaydi.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Bekor</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteCompany.mutate(c.id)}
                          >
                            O'chirish
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTourCompanies;
