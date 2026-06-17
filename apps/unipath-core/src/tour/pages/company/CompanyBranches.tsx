import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, MapPin, Phone, Mail, Plus, Pencil, Trash2, Crown, Lock, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMyCompany } from "@/hooks/useTourCompany";
import { useMyBranches, useUpsertBranch, useDeleteBranch, useBranchLimit, Branch } from "@/hooks/useTourBranches";

const empty = (companyId: string): Partial<Branch> => ({
  company_id: companyId, name: "", city: "", address: "", phone: "", email: "", is_active: true, is_main: false,
});

const CompanyBranches = () => {
  const { data: companyData } = useMyCompany();
  const company = companyData?.company;
  const { data: branches = [] } = useMyBranches();
  const limit = useBranchLimit();
  const upsert = useUpsertBranch();
  const del = useDeleteBranch();
  const [editing, setEditing] = useState<Partial<Branch> | null>(null);
  const isOwner = companyData?.role === "owner";

  if (!company) return null;

  const reachedLimit = branches.length >= limit;

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" strokeWidth={1.75} /> Filiallar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bir hisobdan barcha filiallaringizni alohida boshqaring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[11px] font-normal">
            {branches.length} / {limit === 999 ? "∞" : limit}
          </Badge>
          {isOwner && (
            <Button
              size="sm"
              onClick={() => setEditing(empty(company.id))}
              disabled={reachedLimit}
              className="rounded-xl"
            >
              <Plus className="h-4 w-4 mr-1.5" strokeWidth={2} /> Yangi filial
            </Button>
          )}
        </div>
      </div>

      {reachedLimit && isOwner && (
        <Card className="p-4 border-amber-200 bg-amber-50/50 flex items-center gap-3">
          <Lock className="h-4 w-4 text-amber-600 shrink-0" strokeWidth={1.75} />
          <p className="text-sm text-amber-900 flex-1">
            Tarifingiz bo'yicha {limit} ta filialdan oshira olmaysiz. Yana filial uchun tarifni yangilang.
          </p>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {branches.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="p-4 rounded-2xl border-border/60 hover:shadow-md hover:-translate-y-0.5 transition group h-full flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Building2 className="h-4.5 w-4.5" strokeWidth={1.75} />
                </div>
                {b.is_main && (
                  <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
                    <Crown className="h-3 w-3" strokeWidth={1.75} /> Asosiy
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-base truncate">{b.name}</h3>
              {b.city && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.75} /> {b.city}
                </p>
              )}
              <div className="text-xs text-muted-foreground space-y-1 mt-3 flex-1">
                {b.phone && <p className="flex items-center gap-1.5 truncate"><Phone className="h-3 w-3 shrink-0" strokeWidth={1.75} />{b.phone}</p>}
                {b.email && <p className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 shrink-0" strokeWidth={1.75} />{b.email}</p>}
                {b.address && <p className="line-clamp-2 leading-relaxed">{b.address}</p>}
              </div>
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60">
                <Badge variant={b.is_active ? "default" : "secondary"} className="text-[10px] font-normal">
                  {b.is_active ? "Faol" : "O'chirilgan"}
                </Badge>
                {isOwner && (
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(b)}>
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Button>
                    {!b.is_main && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => confirm(`"${b.name}" filialini o'chirilsinmi?`) && del.mutate(b.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}

        {!branches.length && (
          <Card className="p-10 text-center text-sm text-muted-foreground col-span-full rounded-2xl">
            Filial yo'q. Birinchi filialingizni qo'shing.
          </Card>
        )}
      </div>

      <BranchDialog
        value={editing}
        onClose={() => setEditing(null)}
        onSave={(v) => upsert.mutate(v as any, { onSuccess: () => setEditing(null) })}
        saving={upsert.isPending}
      />
    </div>
  );
};

const BranchDialog = ({
  value, onClose, onSave, saving,
}: {
  value: Partial<Branch> | null;
  onClose: () => void;
  onSave: (v: Partial<Branch>) => void;
  saving: boolean;
}) => {
  const [draft, setDraft] = useState<Partial<Branch> | null>(value);
  if (value && draft?.id !== value.id && !(draft && !value.id)) {
    setDraft(value);
  }
  const v = draft || value;
  if (!v) return null;
  const set = (k: keyof Branch, val: any) => setDraft({ ...(v as any), [k]: val });

  return (
    <Dialog open={!!value} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">{v.id ? "Filialni tahrirlash" : "Yangi filial"}</DialogTitle>
          <DialogDescription className="text-sm">Filial ma'lumotlarini to'ldiring.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom *"><Input value={v.name || ""} onChange={(e) => set("name", e.target.value)} placeholder="Buxoro filiali" /></Field>
            <Field label="Shahar"><Input value={v.city || ""} onChange={(e) => set("city", e.target.value)} placeholder="Buxoro" /></Field>
          </div>
          <Field label="Manzil"><Input value={v.address || ""} onChange={(e) => set("address", e.target.value)} placeholder="..." /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefon"><Input value={v.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="+998..." /></Field>
            <Field label="Email"><Input value={v.email || ""} onChange={(e) => set("email", e.target.value)} placeholder="branch@..." /></Field>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/60">
            <div>
              <p className="text-sm font-medium">Faol</p>
              <p className="text-xs text-muted-foreground">O'chirilsa, filial buyurtmalardan ko'rinmaydi</p>
            </div>
            <Switch checked={v.is_active !== false} onCheckedChange={(c) => set("is_active", c)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Bekor</Button>
          <Button onClick={() => onSave(v)} disabled={saving || !v.name?.trim()} className="rounded-xl">
            <ArrowUpRight className="h-4 w-4 mr-1" strokeWidth={2} /> Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);

export default CompanyBranches;
