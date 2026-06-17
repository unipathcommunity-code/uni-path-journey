import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Ticket, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_percent: number;
  max_uses: number | null;
  current_uses: number;
  min_order_amount: number | null;
  is_active: boolean;
  starts_at: string;
  expires_at: string;
  created_at: string;
}

const AdminPromoCodes = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_percent: 10,
    max_uses: "",
    min_order_amount: "",
    is_active: true,
    starts_at: new Date().toISOString().slice(0, 16),
    expires_at: "",
  });

  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ["admin-promo-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PromoCode[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        code: data.code.toUpperCase().trim(),
        description: data.description || null,
        discount_percent: data.discount_percent,
        max_uses: data.max_uses ? parseInt(data.max_uses) : null,
        min_order_amount: data.min_order_amount ? parseFloat(data.min_order_amount) : 0,
        is_active: data.is_active,
        starts_at: new Date(data.starts_at).toISOString(),
        expires_at: new Date(data.expires_at).toISOString(),
      };

      if (editingPromo) {
        const { error } = await supabase
          .from("promo_codes")
          .update(payload)
          .eq("id", editingPromo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("promo_codes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      toast.success(editingPromo ? "Promo kod yangilandi" : "Promo kod yaratildi");
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promo_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      toast.success("Promo kod o'chirildi");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
    },
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditingPromo(null);
    setFormData({
      code: "",
      description: "",
      discount_percent: 10,
      max_uses: "",
      min_order_amount: "",
      is_active: true,
      starts_at: new Date().toISOString().slice(0, 16),
      expires_at: "",
    });
  };

  const openEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      description: promo.description || "",
      discount_percent: promo.discount_percent,
      max_uses: promo.max_uses?.toString() || "",
      min_order_amount: promo.min_order_amount?.toString() || "",
      is_active: promo.is_active,
      starts_at: new Date(promo.starts_at).toISOString().slice(0, 16),
      expires_at: new Date(promo.expires_at).toISOString().slice(0, 16),
    });
    setDialogOpen(true);
  };

  const isExpired = (date: string) => new Date(date) < new Date();
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.expires_at) {
      toast.error("Kod va muddat majburiy");
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="h-6 w-6 text-accent" />
            Promo Kodlar
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Global chegirma kodlarini boshqaring
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Yangi promo kod
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingPromo ? "Promo kodni tahrirlash" : "Yangi promo kod"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Kod *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="YANGIYIL20"
                  className="mt-1 uppercase"
                  required
                />
              </div>
              <div>
                <Label>Tavsif</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Yangi yil chegirmasi"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Chegirma foizi *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label>Maks. foydalanish</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Cheksiz"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Min. buyurtma summasi (so'm)</Label>
                <Input
                  type="number"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Boshlanish *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label>Tugash *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Faol</Label>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingPromo ? "Saqlash" : "Yaratish"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !promoCodes?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Ticket className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Hali promo kodlar yo'q</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>Chegirma</TableHead>
                <TableHead className="hidden md:table-cell">Foydalanish</TableHead>
                <TableHead className="hidden md:table-cell">Muddat</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono font-bold">
                        {promo.code}
                      </code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(promo.code); toast.success("Nusxalandi"); }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {promo.description && (
                      <p className="text-xs text-muted-foreground mt-1">{promo.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-bold">
                      {promo.discount_percent}%
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm">
                      {promo.current_uses}{promo.max_uses ? ` / ${promo.max_uses}` : " / ∞"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-xs">
                      <p>{formatDate(promo.starts_at)}</p>
                      <p className="text-muted-foreground">→ {formatDate(promo.expires_at)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isExpired(promo.expires_at) ? (
                      <Badge variant="destructive">Muddati o'tgan</Badge>
                    ) : (
                      <Switch
                        checked={promo.is_active}
                        onCheckedChange={(checked) =>
                          toggleActiveMutation.mutate({ id: promo.id, is_active: checked })
                        }
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(promo)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("Promo kodni o'chirishni xohlaysizmi?")) {
                            deleteMutation.mutate(promo.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminPromoCodes;
