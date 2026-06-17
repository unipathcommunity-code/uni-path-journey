import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Inbox, Check, X, CheckCheck, Pen, Building2, Clock, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { toast } from "sonner";

const TABS = [
  { key: "pending", label: "Kutilmoqda", icon: Clock },
  { key: "approved", label: "Tasdiqlangan", icon: Check },
  { key: "applied", label: "Qo'llangan", icon: CheckCheck },
  { key: "rejected", label: "Rad etilgan", icon: X },
];

const TYPE_BADGE: Record<string, string> = {
  branding: "Brend", plan: "Tarif", feature: "Funksiya", domain: "Domen", content: "Mazmun", other: "Boshqa",
};

const AdminChangeRequests = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [tab, setTab] = useState("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin-change-requests"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("company_change_requests")
        .select("*, tour_companies(id, name, slug, logo_url, primary_color)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from("company_change_requests")
        .update({
          status, admin_notes: notes[id] || null,
          reviewed_by: user?.id, reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Holat yangilandi");
      qc.invalidateQueries({ queryKey: ["admin-change-requests"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const counts = useMemo(() => {
    const arr = data || [];
    return TABS.reduce((acc, t) => ({ ...acc, [t.key]: arr.filter((r: any) => r.status === t.key).length }), {} as Record<string, number>);
  }, [data]);

  const filtered = useMemo(() => (data || []).filter((r: any) => r.status === tab), [data, tab]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">So'rovlar</h1>
        <p className="text-sm text-muted-foreground mt-1">Kompaniyalardan kelgan o'zgartirish so'rovlari</p>
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
              tab === t.key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            {t.label}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted-foreground/10">{counts[t.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : !filtered.length ? (
        <Card className="p-12 text-center rounded-2xl border-border/60">
          <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Bu bo'limda so'rovlar yo'q</p>
        </Card>
      ) : (
        <div className="grid gap-2.5">
          <AnimatePresence>
            {filtered.map((r: any, i: number) => {
              const c = r.tour_companies;
              return (
                <motion.div
                  key={r.id} layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.25 }}
                >
                  <Card className="p-4 rounded-2xl border-border/60 space-y-3">
                    <div className="flex items-start gap-3">
                      {c?.logo_url ? (
                        <img src={c.logo_url} className="h-9 w-9 rounded-lg object-cover shrink-0" alt="" />
                      ) : (
                        <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-semibold text-xs shrink-0"
                             style={{ background: c?.primary_color || "#4B8BF5" }}>
                          {c?.name?.charAt(0) || "?"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm truncate">{r.title}</h3>
                          <Badge variant="outline" className="text-[10px] font-normal">{TYPE_BADGE[r.request_type] || r.request_type}</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                          <Building2 className="h-3 w-3 shrink-0" strokeWidth={1.75} /> {c?.name} · {format(new Date(r.created_at), "dd MMM HH:mm")}
                        </p>
                      </div>
                    </div>
                    {r.description && (
                      <div className="text-xs bg-muted/40 p-2.5 rounded-lg flex gap-2 leading-relaxed">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.75} />
                        <p className="whitespace-pre-wrap">{r.description}</p>
                      </div>
                    )}
                    {tab === "pending" && (
                      <>
                        <Textarea
                          rows={2}
                          placeholder="Admin izohi (ixtiyoriy)..."
                          value={notes[r.id] || ""}
                          onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                          className="text-xs rounded-xl"
                        />
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs" onClick={() => setStatus.mutate({ id: r.id, status: "rejected" })}>
                            <X className="h-3.5 w-3.5 mr-1" strokeWidth={1.75} /> Rad
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs" onClick={() => setStatus.mutate({ id: r.id, status: "approved" })}>
                            <Check className="h-3.5 w-3.5 mr-1" strokeWidth={1.75} /> Tasdiq
                          </Button>
                          <a href={`/admin/site-editor/${c?.id}`}>
                            <Button size="sm" className="rounded-lg h-8 text-xs">
                              <Pen className="h-3.5 w-3.5 mr-1" strokeWidth={1.75} /> Tahrir
                            </Button>
                          </a>
                        </div>
                      </>
                    )}
                    {r.admin_notes && (
                      <p className="text-[11px] text-muted-foreground border-l-2 border-primary/40 pl-2.5 leading-relaxed">
                        <span className="font-medium">Admin:</span> {r.admin_notes}
                      </p>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AdminChangeRequests;
