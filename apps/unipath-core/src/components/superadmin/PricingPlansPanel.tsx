import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Edit, Loader2, Plus, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Plan CRUD for the platform's `pricing_plans` table.
 *
 * This used to live in a second tab inside SuperAdminDashboard, which made
 * "Firmalar" the page you had to open to edit tariffs. It belongs on the
 * "To'lovlar va tariflar" page next to the revenue figures it explains.
 */

const VERTICAL = "consulting";

interface PricingPlan {
  id: string;
  vertical: string;
  name: string;
  price: string;
  currency: string | null;
  description: string | null;
  features: string[] | null;
  popular: boolean | null;
}

const emptyForm = {
  vertical: VERTICAL,
  name: "",
  price: "",
  currency: "UZS",
  description: "",
  features: [] as string[],
  popular: false,
};

export default function PricingPlansPanel() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [newFeatureText, setNewFeatureText] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<PricingPlan | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pricing_plans")
        .select("*")
        .eq("vertical", VERTICAL)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setPlans((data as PricingPlan[]) || []);
    } catch (err: any) {
      console.error("Error fetching pricing plans:", err);
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const openCreate = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setNewFeatureText("");
    setDialogOpen(true);
  };

  const openEdit = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setForm({
      vertical: plan.vertical,
      name: plan.name,
      price: plan.price,
      currency: plan.currency || "UZS",
      description: plan.description || "",
      features: Array.isArray(plan.features) ? plan.features : [],
      popular: !!plan.popular,
    });
    setNewFeatureText("");
    setDialogOpen(true);
  };

  const addFeature = () => {
    const text = newFeatureText.trim();
    if (!text) return;
    setForm((prev) => ({ ...prev, features: [...prev.features, text] }));
    setNewFeatureText("");
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price.trim()) {
      toast({ title: "Xatolik", description: "Nom va narxni kiriting", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        vertical: VERTICAL,
        name: form.name.trim(),
        price: form.price.trim(),
        currency: form.currency,
        description: form.description.trim(),
        features: form.features,
        popular: form.popular,
      };

      if (editingPlan) {
        const { error } = await supabase.from("pricing_plans").update(payload).eq("id", editingPlan.id);
        if (error) throw error;
        toast({ title: "Muvaffaqiyatli", description: "Tarif rejasi yangilandi!" });
      } else {
        const { error } = await supabase.from("pricing_plans").insert(payload);
        if (error) throw error;
        toast({ title: "Muvaffaqiyatli", description: "Yangi tarif rejasi qo'shildi!" });
      }

      setDialogOpen(false);
      fetchPlans();
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      const { error } = await supabase.from("pricing_plans").delete().eq("id", pendingDelete.id);
      if (error) throw error;
      toast({ title: "Muvaffaqiyatli", description: "Tarif rejasi o'chirildi!" });
      fetchPlans();
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="bg-[#111111]/80 border border-white/5 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white">Tarif rejalari</h2>
          <p className="text-white/50 text-xs mt-1">
            Ro'yxatdan o'tish va onboardingda ko'rsatiladigan tariflar shu yerdan boshqariladi.
          </p>
        </div>

        <Button
          onClick={openCreate}
          className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold gap-1.5 h-10 px-4 rounded-xl text-xs"
        >
          <Plus className="w-4 h-4" /> Yangi tarif qo'shish
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 text-white/30 text-xs">
          Hozircha tarif rejalari yo'q. Yangi tarif qo'shing.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative border p-6 rounded-[2rem] flex flex-col justify-between hover:bg-[#151515] transition-all ${
                plan.popular ? "border-primary/45 bg-primary/5" : "border-white/5 bg-white/[0.01]"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 right-6 bg-primary text-primary-foreground text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Mashhur
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="font-extrabold text-white text-lg">{plan.name}</h3>
                  <p className="text-white/50 text-xs mt-1 min-h-[32px]">{plan.description}</p>
                </div>

                <div className="py-2">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  <span className="text-white/40 text-xs ml-1 font-semibold">{plan.currency || "UZS"}/oy</span>
                </div>

                <div className="border-t border-white/5 pt-4 space-y-2">
                  {Array.isArray(plan.features) && plan.features.length > 0 ? (
                    plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-white/70 leading-normal">{feat}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-white/30">Imkoniyatlar kiritilmagan.</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-2 border-t border-white/5 pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEdit(plan)}
                  className="flex-1 h-9 rounded-xl text-xs font-bold bg-white/5 border-white/10 text-white/80 hover:text-white"
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" /> Tahrirlash
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setPendingDelete(plan)}
                  className="flex-1 h-9 rounded-xl text-xs font-bold border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white"
                >
                  <Trash className="w-3.5 h-3.5 mr-1.5" /> O'chirish
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-[#111111]/95 border border-white/5 text-white rounded-[2rem] backdrop-blur-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              {editingPlan ? "Tarif rejasini tahrirlash" : "Yangi tarif rejasi qo'shish"}
            </DialogTitle>
            <DialogDescription className="text-white/50 text-xs">
              Tarif rejasining narxi, nomi va imkoniyatlari ro'yxatini belgilang.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="space-y-1.5">
              <Label className="text-white/80 font-bold">Reja nomi</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Masalan: Consulting Pro"
                className="bg-white/5 border-white/10 text-white rounded-xl h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-white/80 font-bold">Narxi</Label>
                <Input
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="Masalan: 499 000"
                  className="bg-white/5 border-white/10 text-white rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-white/80 font-bold">Valyuta</Label>
                <select
                  className="w-full h-10 px-3 bg-[#171717] border border-white/10 rounded-xl text-white text-xs"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                >
                  <option value="UZS" className="bg-[#111111]">UZS</option>
                  <option value="USD" className="bg-[#111111]">USD</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-white/80 font-bold">Tavsif</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Masalan: Professional konsalting agentliklari uchun"
                className="bg-white/5 border-white/10 text-white rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/80 font-bold">Tarif imkoniyatlari</Label>
              <div className="flex gap-2">
                <Input
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  placeholder="Masalan: 500 ta arizachi limiti"
                  className="bg-white/5 border-white/10 text-white rounded-xl h-10 text-xs flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={addFeature}
                  className="bg-sky-500 hover:bg-sky-600 text-white h-10 rounded-xl px-3 font-bold"
                >
                  Qo'shish
                </Button>
              </div>

              <div className="max-h-36 overflow-y-auto border border-white/5 bg-[#171717]/30 p-2.5 rounded-xl space-y-1.5 custom-scrollbar">
                {form.features.length === 0 ? (
                  <p className="text-[10px] text-white/30 text-center py-4 font-sans">
                    Hozircha hech qanday imkoniyat qo'shilmagan.
                  </p>
                ) : (
                  form.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-white/5 px-2.5 py-1.5 rounded-lg text-[10px] font-sans"
                    >
                      <span className="text-white/80 truncate pr-2">{feat}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            features: prev.features.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-rose-400 hover:text-rose-300 font-bold"
                      >
                        O'chirish
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
              <div className="space-y-0.5">
                <Label className="text-white/80 font-bold">Mashhur tarif</Label>
                <p className="text-[9px] text-white/40">
                  Ro'yxatdan o'tishda ajratib ko'rsatiladi va standart tanlanadi.
                </p>
              </div>
              <Switch
                checked={form.popular}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, popular: checked }))}
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2 border-t border-white/5 pt-4">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-white/10 text-xs font-semibold rounded-xl text-white bg-white/5 hover:bg-white/10 h-10 flex-1 md:flex-initial"
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold h-10 px-6 rounded-xl flex-1 md:flex-initial"
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation — replaces the blocking window.confirm() */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent className="bg-[#111111]/95 border border-white/5 text-white rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Tarif rejasini o'chirish</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              “{pendingDelete?.name}” tarifi butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-rose-500 hover:bg-rose-600 text-white"
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
