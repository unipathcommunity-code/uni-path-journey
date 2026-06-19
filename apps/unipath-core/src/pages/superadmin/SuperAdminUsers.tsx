import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  UserCheck, 
  UserMinus, 
  Building2,
  Mail,
  UserX,
  AlertCircle,
  CreditCard,
  Loader2,
  Trash2,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ACTIVE_STATUS,
  isLiveStatus,
  isBlockedStatus,
  tenantStatusLabel,
  tenantStatusBadgeClass,
} from "@/lib/tenantStatus";

export default function SuperAdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      // Company owners are created with role 'owner' (some legacy rows use
      // 'admin'); fetch both so the list is never silently empty.
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          role,
          created_at,
          tenant_id,
          tenants (
            name,
            status,
            plan
          )
        `)
        .in('role', ['owner', 'admin']);

      if (error) throw error;

      const mapped = data?.map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        name: p.full_name || 'N/A',
        email: p.email || 'N/A',
        role: p.role || 'owner',
        tenant: p.tenants?.name || 'N/A',
        tenant_id: p.tenant_id,
        status: p.tenants?.status || 'pending',
        plan: p.tenants?.plan || 'Starter',
        joinedDate: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'
      })) || [];

      setUsers(mapped);
    } catch (err: any) {
      console.error("Error fetching admins:", err);
      toast({
        title: "Xatolik",
        description: "Adminlarni yuklashda xatolik yuz berdi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleStatusChange = async (userId: string, tenantId: string, newStatus: string) => {
    if (!tenantId) {
      toast({
        title: "Xatolik",
        description: "Ushbu foydalanuvchining firmasi aniqlanmadi",
        variant: "destructive"
      });
      return;
    }
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ status: newStatus })
        .eq('id', tenantId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      toast({
        title: "Muvaffaqiyatli",
        description: `Firma holati o'zgartirildi: ${
          newStatus === 'active' ? '✅ Faollashtirildi' :
          newStatus === 'suspended' ? '🔒 Bloklandi' :
          newStatus === 'rejected' ? '❌ Rad etildi' : newStatus
        }`,
      });
    } catch (err: any) {
      console.error("Error updating status:", err);
      toast({
        title: "Xatolik",
        description: "Holatni o'zgartirishda xatolik yuz berdi",
        variant: "destructive"
      });
    }
  };

  const openDeleteDialog = (user: any) => {
    setUserToDelete(user);
    setDeleteConfirmText("");
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    if (deleteConfirmText !== userToDelete.name) {
      toast({
        title: "Xatolik",
        description: "Foydalanuvchi ismi noto'g'ri kiritildi",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsDeleting(true);
      if (userToDelete.user_id) {
        // Calls the deployed `delete-user` edge function (service-role cascade
        // delete). The old `delete_user_cascade` RPC never existed in the DB —
        // only `delete_tenant_cascade` does — so this button always errored.
        const { data, error } = await supabase.functions.invoke('delete-user', {
          body: { userId: userToDelete.user_id }
        });
        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);
      }

      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      toast({
        title: "Muvaffaqiyatli",
        description: "Foydalanuvchi va uning barcha ma'lumotlari butunlay o'chirib tashlandi",
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      console.error("Error deleting user:", err);
      toast({
        title: "Xatolik",
        description: err.message || "Foydalanuvchini o'chirishda xatolik yuz berdi",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.tenant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === "all" || user.plan.toLowerCase() === planFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? isLiveStatus(user.status) : user.status === statusFilter);
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const pendingCount = users.filter(u => u.status === 'pending').length;

  return (
    <div className="text-foreground font-sans space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Firma Egalari (Adminlar) Boshqaruvi</h1>
        <p className="text-white/50 mt-1 text-sm">
          Platformaga ulangan barcha vertikal firma egalarini va ularning tariflarini boshqarish
        </p>
      </div>

      {/* Pending Alert Banner */}
      {pendingCount > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-bold text-amber-400 text-sm">
                {pendingCount} ta yangi firma tasdiqlashni kutmoqda
              </p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                Holatni "Kutilayotganlar" bo'yicha filterlang va tasdiqlang yoki rad eting.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold shrink-0"
            onClick={() => setStatusFilter("pending")}
          >
            Ko'rish
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-muted/10 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Jami Adminlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/10 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              Faol Adminlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">
              {users.filter(u => isLiveStatus(u.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/10 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Kutilayotganlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">
              {pendingCount}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/10 border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <UserX className="w-4 h-4 text-rose-500" />
              Bloklanganlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-500">
              {users.filter(u => isBlockedStatus(u.status)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table Card */}
      <Card className="bg-[#0f172a]/60 backdrop-blur-xl border border-white/5 overflow-hidden">
        <CardHeader className="space-y-4">
          <CardTitle className="text-white">Adminlar va Tariflar Ro'yxati</CardTitle>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Firma egasi, email yoki firma nomi..." 
                className="pl-8 bg-black/50 border-white/10 text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filter by Plan */}
            <div className="flex gap-2">
              <select
                className="bg-black/50 border border-white/10 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
              >
                <option value="all">Barcha tariflar</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>

              <select
                className="bg-black/50 border border-white/10 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Barcha holatlar</option>
                <option value="active">Faol</option>
                <option value="pending">Kutilmoqda</option>
                <option value="suspended">Bloklangan</option>
                <option value="rejected">Rad etilgan</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <span>Ma'lumotlar yuklanmoqda...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Admin (Firma Egasi)</th>
                  <th className="p-4">Firma (Tenant)</th>
                  <th className="p-4">Tarif (Plan)</th>
                  <th className="p-4">Holat</th>
                  <th className="p-4">Qo'shilgan Sana</th>
                  <th className="p-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => (
                  <motion.tr 
                    key={user.id}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.01)' }}
                    className="text-sm transition-colors text-white/80"
                  >
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{user.name}</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-amber-500/60" /> {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Building2 className="w-4 h-4 text-amber-500/60" />
                        {user.tenant}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="border-white/10 bg-white/5 text-white/80 flex items-center w-max gap-1">
                        <CreditCard className="w-3 h-3 text-amber-400" />
                        {user.plan}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={tenantStatusBadgeClass(user.status)}>
                        {tenantStatusLabel(user.status)}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-slate-500">{user.joinedDate}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Pending: Show Approve + Reject */}
                        {user.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600 text-white h-8 px-3 text-xs font-bold"
                              onClick={() => handleStatusChange(user.id, user.tenant_id, 'active')}
                            >
                              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Tasdiqlash
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 px-2"
                              onClick={() => handleStatusChange(user.id, user.tenant_id, 'rejected')}
                            >
                              <UserX className="w-3.5 h-3.5 mr-1" /> Rad
                            </Button>
                          </>
                        )}

                        {/* Live (active/approved): Show Block */}
                        {isLiveStatus(user.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 px-2"
                            onClick={() => handleStatusChange(user.id, user.tenant_id, 'suspended')}
                          >
                            <UserMinus className="w-4 h-4 mr-1" /> Bloklash
                          </Button>
                        )}

                        {/* Suspended/Rejected: Show Restore */}
                        {isBlockedStatus(user.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-8 px-2"
                            onClick={() => handleStatusChange(user.id, user.tenant_id, ACTIVE_STATUS)}
                          >
                            <UserCheck className="w-4 h-4 mr-1" /> Faollashtirish
                          </Button>
                        )}

                        {/* Always show Delete */}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                          onClick={() => openDeleteDialog(user)}
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-slate-500">
                      Hech qanday firma egasi topilmadi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) { setUserToDelete(null); setDeleteConfirmText(""); }
      }}>
        <DialogContent className="sm:max-w-[425px] bg-[#111111]/95 border border-rose-500/20 text-white rounded-3xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Foydalanuvchini O'chirish
            </DialogTitle>
            <DialogDescription className="text-white/60 text-xs mt-2">
              Ushbu amalni <strong>ortga qaytarib bo'lmaydi</strong>. Foydalanuvchi va unga tegishli barcha ma'lumotlar butunlay o'chib ketadi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 text-xs">
            <p className="text-white/80">
              O'chirishni tasdiqlash uchun foydalanuvchi ismini aynan quyidagicha kiriting:
              <span className="block font-bold text-white bg-white/5 px-3 py-1.5 rounded-lg mt-2 text-center select-all">
                {userToDelete?.name}
              </span>
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Foydalanuvchi ismini kiriting"
              className="bg-white/5 border-white/10 text-white rounded-xl h-11"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDeleteDialogOpen(false); setUserToDelete(null); setDeleteConfirmText(""); }}
              className="border-white/10 text-xs font-semibold rounded-xl text-white"
            >
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== userToDelete?.name || isDeleting}
              onClick={handleDeleteUser}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs h-11 px-5"
            >
              {isDeleting ? "O'chirilmoqda..." : "Tasdiqlayman, O'chir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
