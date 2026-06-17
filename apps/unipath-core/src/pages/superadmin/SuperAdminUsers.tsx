import { useState, useEffect } from "react";
import {
  Users, Search, UserCheck, UserMinus, Building2, Mail, UserX,
  AlertCircle, Loader2, Trash2, ShieldCheck, Plus, UserPlus, Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Roles a super admin can assign from this panel.
const ASSIGNABLE_ROLES = ["owner", "admin", "manager", "accountant"] as const;
// Roles shown in the staff list.
const STAFF_ROLES = ["super_admin", "owner", "admin", "manager", "accountant"];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  owner: "Egasi (Owner)",
  admin: "Admin",
  manager: "Menejer",
  accountant: "Buxgalter",
};

interface StaffUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  tenant: string;
  tenant_id: string | null;
  status: string;
  plan: string;
  joinedDate: string;
}

interface TenantOption { id: string; name: string; }

export default function SuperAdminUsers() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<StaffUser | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Add-user dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<"existing" | "new">("existing");
  const [addBusy, setAddBusy] = useState(false);
  const [form, setForm] = useState({
    email: "", password: "", fullName: "", role: "owner", tenantId: "none",
  });

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [{ data: profilesData, error }, { data: tenantsData }] = await Promise.all([
        supabase
          .from("profiles")
          .select(`id, user_id, full_name, email, role, created_at, tenant_id,
                   tenants ( name, status, plan )`)
          .in("role", STAFF_ROLES)
          .order("created_at", { ascending: false }),
        supabase.from("tenants").select("id, name").order("name"),
      ]);

      if (error) throw error;

      const mapped: StaffUser[] = (profilesData || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        name: p.full_name || "N/A",
        email: p.email || "N/A",
        role: p.role || "user",
        tenant: p.tenants?.name || "—",
        tenant_id: p.tenant_id,
        status: p.tenants?.status || "—",
        plan: p.tenants?.plan || "—",
        joinedDate: p.created_at ? new Date(p.created_at).toLocaleDateString() : "—",
      }));

      setUsers(mapped);
      setTenants((tenantsData as TenantOption[]) || []);
    } catch (err: any) {
      console.error("Error fetching staff:", err);
      toast({ title: "Xatolik", description: "Foydalanuvchilarni yuklashda xatolik", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Role / tenant assignment via SECURITY DEFINER RPC ──────────────────────
  const assign = async (
    user: StaffUser,
    opts: { role?: string; tenantId?: string }
  ) => {
    try {
      setSavingId(user.id);
      
      let targetTenantId = opts.tenantId;
      if (targetTenantId === "none") {
        targetTenantId = "00000000-0000-0000-0000-000000000000";
      }

      const { error } = await supabase.rpc("admin_set_user_role_and_tenant", {
        target_user: user.user_id,
        new_role: opts.role ?? null,
        new_tenant: targetTenantId ?? null,
      });
      if (error) throw error;
      toast({ title: "Saqlandi", description: "Rol/biznes yangilandi" });
      await fetchData();
    } catch (err: any) {
      console.error("assign error:", err);
      toast({ title: "Xatolik", description: err.message || "Saqlashda xatolik", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const handleStatusChange = async (tenantId: string | null, newStatus: string) => {
    if (!tenantId) {
      toast({ title: "Xatolik", description: "Bu foydalanuvchining biznesi yo'q", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.from("tenants").update({ status: newStatus }).eq("id", tenantId);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.tenant_id === tenantId ? { ...u, status: newStatus } : u));
      toast({ title: "Muvaffaqiyatli", description: `Biznes holati: ${newStatus}` });
    } catch (err: any) {
      toast({ title: "Xatolik", description: "Holatni o'zgartirishda xatolik", variant: "destructive" });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || deleteConfirmText !== userToDelete.name) {
      toast({ title: "Xatolik", description: "Ism noto'g'ri kiritildi", variant: "destructive" });
      return;
    }
    try {
      setIsDeleting(true);
      if (userToDelete.user_id) {
        const { error } = await (supabase as any).rpc("delete_user_cascade", { target_user_id: userToDelete.user_id });
        if (error) throw error;
      }
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      toast({ title: "Muvaffaqiyatli", description: "Foydalanuvchi o'chirildi" });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message || "O'chirishda xatolik", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Add user (attach existing OR create new) ───────────────────────────────
  const handleAddUser = async () => {
    if (!form.email || !form.role) {
      toast({ title: "Xatolik", description: "Email va rolni kiriting", variant: "destructive" });
      return;
    }
    try {
      setAddBusy(true);
      if (addMode === "existing") {
        const { data: profile, error } = await supabase
          .from("profiles").select("id, user_id").eq("email", form.email.trim()).maybeSingle();
        if (error) throw error;
        if (!profile) {
          toast({ title: "Topilmadi", description: "Bu email bilan foydalanuvchi yo'q. \"Yangi yaratish\"ni tanlang.", variant: "destructive" });
          return;
        }
        const { error: rpcErr } = await supabase.rpc("admin_set_user_role_and_tenant", {
          target_user: profile.user_id,
          new_role: form.role,
          new_tenant: form.tenantId === "none" ? "00000000-0000-0000-0000-000000000000" : (form.tenantId || null),
        });
        if (rpcErr) throw rpcErr;
        toast({ title: "Biriktirildi", description: `${form.email} → ${ROLE_LABELS[form.role]}` });
      } else {
        if (form.password.length < 6) {
          toast({ title: "Xatolik", description: "Parol kamida 6 belgi", variant: "destructive" });
          return;
        }
        const { data, error } = await supabase.functions.invoke("admin-create-user", {
          body: {
            email: form.email.trim(), password: form.password,
            fullName: form.fullName, role: form.role,
            tenantId: form.tenantId === "none" ? null : (form.tenantId || null),
          },
        });
        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);
        toast({ title: "Yaratildi", description: `Yangi ${ROLE_LABELS[form.role]} qo'shildi` });
      }
      setAddOpen(false);
      setForm({ email: "", password: "", fullName: "", role: "owner", tenantId: "none" });
      await fetchData();
    } catch (err: any) {
      console.error("add user error:", err);
      toast({ title: "Xatolik", description: err.message || "Qo'shishda xatolik", variant: "destructive" });
    } finally {
      setAddBusy(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) || user.tenant.toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const pendingCount = users.filter(u => u.status === "pending").length;
  const ownerCount = users.filter(u => u.role === "owner").length;

  return (
    <div className="text-foreground font-sans space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Foydalanuvchilar va Rollar</h1>
          <p className="text-white/50 mt-1 text-sm">
            Egalar (owner) va adminlarni bizneslarga biriktiring, rollarini tayinlang yoki yangi qo'shing
          </p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-2 shrink-0"
          onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" /> Foydalanuvchi qo'shish
        </Button>
      </div>

      {/* Pending banner */}
      {pendingCount > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="font-bold text-amber-400 text-sm">{pendingCount} ta biznes tasdiqlashni kutmoqda</p>
          </div>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-bold shrink-0"
            onClick={() => setStatusFilter("pending")}>Ko'rish</Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Jami xodimlar", value: users.length, icon: Users, color: "text-white" },
          { label: "Egalar (Owner)", value: ownerCount, icon: ShieldCheck, color: "text-amber-400" },
          { label: "Faol bizneslar", value: users.filter(u => u.status === "active" || u.status === "approved").length, icon: UserCheck, color: "text-emerald-500" },
          { label: "Kutilayotgan", value: pendingCount, icon: AlertCircle, color: "text-amber-500" },
        ].map((s) => (
          <Card key={s.label} className="bg-muted/10 border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <s.icon className="w-4 h-4" /> {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent><div className={`text-3xl font-bold ${s.color}`}>{s.value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + table */}
      <Card className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 overflow-hidden">
        <CardHeader className="space-y-4">
          <CardTitle className="text-white">Xodimlar ro'yxati</CardTitle>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input placeholder="Ism, email yoki biznes nomi..." className="pl-8 bg-black/50 border-white/10 text-white"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <select className="bg-black/50 border border-white/10 text-white rounded-md px-3 py-2 text-sm"
                value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">Barcha rollar</option>
                {STAFF_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <select className="bg-black/50 border border-white/10 text-white rounded-md px-3 py-2 text-sm"
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Barcha holatlar</option>
                <option value="active">Faol</option>
                <option value="pending">Kutilmoqda</option>
                <option value="suspended">Bloklangan</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <span>Yuklanmoqda...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Foydalanuvchi</th>
                  <th className="p-4">Rol</th>
                  <th className="p-4">Biznes (Tenant)</th>
                  <th className="p-4">Holat</th>
                  <th className="p-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => (
                  <motion.tr key={user.id} className="text-sm text-white/80">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{user.name}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-amber-500/60" /> {user.email}
                        </span>
                      </div>
                    </td>
                    {/* Role select */}
                    <td className="p-4">
                      {user.role === "super_admin" ? (
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Super Admin</Badge>
                      ) : (
                        <Select value={user.role} disabled={savingId === user.id}
                          onValueChange={(v) => assign(user, { role: v })}>
                          <SelectTrigger className="w-[150px] h-9 bg-black/50 border-white/10 text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-950 border-white/10 text-white">
                            {ASSIGNABLE_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    {/* Tenant select */}
                    <td className="p-4">
                      <Select value={user.tenant_id ?? "none"} disabled={savingId === user.id}
                        onValueChange={(v) => assign(user, { tenantId: v })}>
                        <SelectTrigger className="w-[180px] h-9 bg-black/50 border-white/10 text-white text-xs">
                          <SelectValue placeholder="Biznes tanlang...">
                            <span className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-amber-500/60" />{user.tenant}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-white/10 text-white">
                          <SelectItem value="none">Biznes yo'q (None)</SelectItem>
                          {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    {/* Status */}
                    <td className="p-4">
                      <Badge className={
                        user.status === "active" || user.status === "approved" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        user.status === "pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        user.status === "—" ? "bg-white/5 text-white/40 border-white/10" :
                        "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      }>
                        {user.status === "active" || user.status === "approved" ? "Faol" :
                         user.status === "pending" ? "Kutilmoqda" : user.status === "—" ? "Biznes yo'q" : "Bloklangan"}
                      </Badge>
                    </td>
                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {savingId === user.id && <Loader2 className="w-4 h-4 animate-spin text-amber-500" />}
                        {user.status === "pending" && (
                          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white h-8 px-3 text-xs font-bold"
                            onClick={() => handleStatusChange(user.tenant_id, "active")}>
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Tasdiqlash
                          </Button>
                        )}
                        {(user.status === "active" || user.status === "approved") && (
                          <Button size="sm" variant="ghost" className="text-rose-400 hover:bg-rose-500/10 h-8 px-2"
                            onClick={() => handleStatusChange(user.tenant_id, "suspended")}>
                            <UserMinus className="w-4 h-4 mr-1" /> Bloklash
                          </Button>
                        )}
                        {user.status === "suspended" && (
                          <Button size="sm" variant="ghost" className="text-emerald-400 hover:bg-emerald-500/10 h-8 px-2"
                            onClick={() => handleStatusChange(user.tenant_id, "active")}>
                            <UserCheck className="w-4 h-4 mr-1" /> Faollashtirish
                          </Button>
                        )}
                        {user.role !== "super_admin" && (
                          <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-500/10 h-8 w-8 p-0"
                            onClick={() => { setUserToDelete(user); setDeleteConfirmText(""); setDeleteDialogOpen(true); }}
                            title="O'chirish">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan={5} className="text-center p-8 text-slate-500">Foydalanuvchi topilmadi.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add user dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[480px] bg-[#0b0b0b]/95 border border-white/10 text-white rounded-3xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-500" /> Foydalanuvchi qo'shish
            </DialogTitle>
            <DialogDescription className="text-white/60 text-xs">
              Mavjud foydalanuvchini biznesга biriktiring yoki yangi owner/admin yarating.
            </DialogDescription>
          </DialogHeader>

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl">
            <button onClick={() => setAddMode("existing")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${addMode === "existing" ? "bg-amber-500 text-black" : "text-white/60"}`}>
              <Link2 className="w-3.5 h-3.5" /> Mavjudni biriktirish
            </button>
            <button onClick={() => setAddMode("new")}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${addMode === "new" ? "bg-amber-500 text-black" : "text-white/60"}`}>
              <UserPlus className="w-3.5 h-3.5" /> Yangi yaratish
            </button>
          </div>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@mail.com" className="bg-black/50 border-white/10 text-white" />
            </div>
            {addMode === "new" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/70">To'liq ism</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Ism Familiya" className="bg-black/50 border-white/10 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/70">Parol</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Kamida 6 belgi" className="bg-black/50 border-white/10 text-white" />
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">Rol</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="bg-black/50 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/10 text-white">
                    {ASSIGNABLE_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">Biznes (ixtiyoriy)</Label>
                <Select value={form.tenantId || "none"} onValueChange={(v) => setForm({ ...form, tenantId: v })}>
                  <SelectTrigger className="bg-black/50 border-white/10 text-white"><SelectValue placeholder="Tanlang..." /></SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/10 text-white">
                    <SelectItem value="none">Biznes yo'q (None)</SelectItem>
                    {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="border-white/10 text-white rounded-xl">
              Bekor qilish
            </Button>
            <Button onClick={handleAddUser} disabled={addBusy}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl">
              {addBusy ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {addMode === "existing" ? "Biriktirish" : "Yaratish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) { setUserToDelete(null); setDeleteConfirmText(""); }
      }}>
        <DialogContent className="sm:max-w-[425px] bg-[#111111]/95 border border-rose-500/20 text-white rounded-3xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Foydalanuvchini o'chirish
            </DialogTitle>
            <DialogDescription className="text-white/60 text-xs mt-2">
              Bu amal <strong>ortga qaytarilmaydi</strong>. Tasdiqlash uchun ismni kiriting:
              <span className="block font-bold text-white bg-white/5 px-3 py-1.5 rounded-lg mt-2 text-center select-all">
                {userToDelete?.name}
              </span>
            </DialogDescription>
          </DialogHeader>
          <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Foydalanuvchi ismi" className="bg-white/5 border-white/10 text-white rounded-xl h-11" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-white/10 text-white rounded-xl">
              Bekor qilish
            </Button>
            <Button variant="destructive" disabled={deleteConfirmText !== userToDelete?.name || isDeleting}
              onClick={handleDeleteUser} className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl">
              {isDeleting ? "O'chirilmoqda..." : "O'chirish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
