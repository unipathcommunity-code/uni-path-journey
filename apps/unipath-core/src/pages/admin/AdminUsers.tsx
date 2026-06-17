import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import {
  Users, Search, Shield, ShieldCheck, ShieldOff, MoreHorizontal, Loader2, Phone, UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface UserWithProfile {
  id: string;
  email: string;
  created_at: string;
  profile?: { full_name: string | null; phone: string | null; avatar_url: string | null };
  role?: { role: string };
  bookings_count?: number;
}

const AdminUsers = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [newRole, setNewRole] = useState("");
  
  // Agent assignment state
  const [assignAgentUser, setAssignAgentUser] = useState<UserWithProfile | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase.from("profiles").select("user_id, full_name, phone, avatar_url");
      if (profilesError) throw profilesError;
      const { data: roles, error: rolesError } = await supabase.from("user_roles").select("user_id, role");
      if (rolesError) throw rolesError;
      const { data: bookingsCounts, error: bookingsError } = await supabase.from("bookings").select("user_id");
      if (bookingsError) throw bookingsError;

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      const roleMap = new Map(roles?.map(r => [r.user_id, r]));
      const bookingsMap = new Map<string, number>();
      bookingsCounts?.forEach(b => { bookingsMap.set(b.user_id, (bookingsMap.get(b.user_id) || 0) + 1); });

      const userIds = [...new Set([...profiles?.map(p => p.user_id) || [], ...roles?.map(r => r.user_id) || []])];
      return userIds.map(userId => ({
        id: userId,
        email: profileMap.get(userId)?.full_name || t("admin.unknown"),
        created_at: new Date().toISOString(),
        profile: profileMap.get(userId) || null,
        role: roleMap.get(userId) || null,
        bookings_count: bookingsMap.get(userId) || 0,
      }));
    },
  });

  // Fetch agents list
  const { data: agents = [] } = useQuery({
    queryKey: ["admin-agents-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("id, name, company_name, phone, status");
      if (error) throw error;
      return data;
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "moderator" | "user" }) => {
      const { data: existing } = await (supabase as any).from("user_roles").select("id").eq("user_id", userId).maybeSingle();
      if (existing) {
        const { error } = await (supabase as any).from("user_roles").update({ role }).eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("admin.roleUpdated"));
      setSelectedUser(null);
    },
    onError: () => { toast.error(t("admin.roleError")); },
  });

  // Assign user's bookings to an agent
  const assignToAgentMutation = useMutation({
    mutationFn: async ({ userId, agentId, notes }: { userId: string; agentId: string; notes: string }) => {
      // Get user's bookings
      const { data: userBookings, error: bookingsErr } = await supabase
        .from("bookings")
        .select("id")
        .eq("user_id", userId);
      if (bookingsErr) throw bookingsErr;

      if (!userBookings || userBookings.length === 0) {
        throw new Error("Bu foydalanuvchida buyurtma mavjud emas");
      }

      // Assign each booking to the agent
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (const booking of userBookings) {
        // Check if already assigned
        const { data: existing } = await supabase
          .from("booking_agent_assignments")
          .select("id")
          .eq("booking_id", booking.id)
          .maybeSingle();

        if (existing) {
          // Update existing assignment
          await supabase
            .from("booking_agent_assignments")
            .update({ agent_id: agentId, notes, assigned_by: user.id })
            .eq("id", existing.id);
        } else {
          // Create new assignment
          await supabase
            .from("booking_agent_assignments")
            .insert({
              booking_id: booking.id,
              agent_id: agentId,
              assigned_by: user.id,
              notes,
            });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Foydalanuvchi agentga muvaffaqiyatli biriktirildi!");
      setAssignAgentUser(null);
      setSelectedAgentId("");
      setAssignNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Agentga biriktirishda xatolik yuz berdi");
    },
  });

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = user.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) || user.profile?.phone?.includes(search);
    const matchesRole = roleFilter === "all" || user.role?.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "admin": return <Badge className="bg-destructive/10 text-destructive border-destructive/20">{t("admin.admin")}</Badge>;
      case "moderator": return <Badge className="bg-primary/10 text-primary border-primary/20">{t("admin.moderator")}</Badge>;
      default: return <Badge variant="secondary">{t("admin.user")}</Badge>;
    }
  };

  const stats = [
    { label: t("admin.totalUsers"), value: users.length, icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
    { label: t("admin.admins"), value: users.filter((u: any) => u.role?.role === "admin").length, icon: ShieldCheck, color: "text-destructive", bgColor: "bg-destructive/10" },
    { label: t("admin.moderators"), value: users.filter((u: any) => u.role?.role === "moderator").length, icon: Shield, color: "text-accent-foreground", bgColor: "bg-accent/20" },
  ];

  const activeAgents = agents.filter(a => a.status === "approved" || a.status === "active");

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("admin.users")}</h1>
        <p className="text-muted-foreground">{t("admin.usersManagement")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("admin.searchByNameOrPhone")} className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t("admin.byRole")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.allRoles")}</SelectItem>
                <SelectItem value="admin">{t("admin.admin")}</SelectItem>
                <SelectItem value="moderator">{t("admin.moderator")}</SelectItem>
                <SelectItem value="user">{t("admin.user")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mobile card view */}
      <div className="block sm:hidden space-y-3">
        {filteredUsers.map((user: any) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {user.profile?.avatar_url ? (
                      <img src={user.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <Users className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{user.profile?.full_name || t("admin.unknown")}</p>
                    <p className="text-xs text-muted-foreground">{user.profile?.phone || t("admin.notProvided")}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSelectedUser(user); setNewRole(user.role?.role || "user"); }}>
                      <Shield className="h-4 w-4 mr-2" />{t("admin.assignRole")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setAssignAgentUser(user); setSelectedAgentId(""); setAssignNotes(""); }}>
                      <UserPlus className="h-4 w-4 mr-2" />Agentga biriktirish
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: user.id, role: "admin" })} className="text-destructive">
                      <ShieldCheck className="h-4 w-4 mr-2" />{t("admin.makeAdmin")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: user.id, role: "moderator" })} className="text-primary">
                      <Shield className="h-4 w-4 mr-2" />{t("admin.makeModerator")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: user.id, role: "user" })}>
                      <ShieldOff className="h-4 w-4 mr-2" />{t("admin.makeUser")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {getRoleBadge(user.role?.role)}
                <Badge variant="outline" className="text-xs">{user.bookings_count || 0} ta buyurtma</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table view */}
      <Card className="hidden sm:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">{t("admin.user")}</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">{t("admin.phone")}</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">{t("admin.role")}</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">{t("admin.orders")}</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">{t("admin.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user: any) => (
                  <tr key={user.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {user.profile?.avatar_url ? (
                            <img src={user.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Users className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{user.profile?.full_name || t("admin.unknown")}</p>
                          <p className="text-sm text-muted-foreground">{user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {user.profile?.phone || t("admin.notProvided")}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getRoleBadge(user.role?.role)}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{user.bookings_count || 0} ta</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setAssignAgentUser(user); setSelectedAgentId(""); setAssignNotes(""); }}
                          title="Agentga biriktirish"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setNewRole(user.role?.role || "user"); }}>
                              <Shield className="h-4 w-4 mr-2" />{t("admin.assignRole")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setAssignAgentUser(user); setSelectedAgentId(""); setAssignNotes(""); }}>
                              <UserPlus className="h-4 w-4 mr-2" />Agentga biriktirish
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: user.id, role: "admin" })} className="text-destructive">
                              <ShieldCheck className="h-4 w-4 mr-2" />{t("admin.makeAdmin")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: user.id, role: "moderator" })} className="text-primary">
                              <Shield className="h-4 w-4 mr-2" />{t("admin.makeModerator")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateRoleMutation.mutate({ userId: user.id, role: "user" })}>
                              <ShieldOff className="h-4 w-4 mr-2" />{t("admin.makeUser")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("admin.noUsersFound")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role assignment dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.assignRole")}</DialogTitle>
            <DialogDescription>Foydalanuvchi rolingini o'zgartirish</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>{t("admin.user")}</Label>
              <p className="text-lg font-medium">{selectedUser?.profile?.full_name || t("admin.unknown")}</p>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.newRole")}</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t("admin.user")}</SelectItem>
                  <SelectItem value="moderator">{t("admin.moderator")}</SelectItem>
                  <SelectItem value="admin">{t("admin.admin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setSelectedUser(null)} className="flex-1">{t("admin.cancel")}</Button>
              <Button
                onClick={() => selectedUser && updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole as "admin" | "moderator" | "user" })}
                className="flex-1"
                disabled={updateRoleMutation.isPending}
              >
                {updateRoleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("admin.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agent assignment dialog */}
      <Dialog open={!!assignAgentUser} onOpenChange={() => setAssignAgentUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Foydalanuvchini agentga biriktirish</DialogTitle>
            <DialogDescription>
              {assignAgentUser?.profile?.full_name || "Foydalanuvchi"}ning barcha buyurtmalarini tanlangan agentga biriktirish
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Foydalanuvchi</Label>
              <div className="flex items-center gap-3 mt-1 p-3 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{assignAgentUser?.profile?.full_name || t("admin.unknown")}</p>
                  <p className="text-xs text-muted-foreground">{assignAgentUser?.profile?.phone || ""}</p>
                </div>
                <Badge variant="outline" className="ml-auto text-xs">{(assignAgentUser as any)?.bookings_count || 0} buyurtma</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Agentni tanlang</Label>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Agent tanlang..." />
                </SelectTrigger>
                <SelectContent>
                  {activeAgents.length > 0 ? activeAgents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name} — {agent.company_name}
                    </SelectItem>
                  )) : (
                    <SelectItem value="_none" disabled>Faol agentlar topilmadi</SelectItem>
                  )}
                  {/* Also show pending agents */}
                  {agents.filter(a => a.status === "pending").length > 0 && (
                    <>
                      {agents.filter(a => a.status === "pending").map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name} — {agent.company_name} (kutilmoqda)
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Izoh (ixtiyoriy)</Label>
              <Textarea
                placeholder="Biriktirish haqida izoh..."
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setAssignAgentUser(null)} className="flex-1">
                Bekor qilish
              </Button>
              <Button
                onClick={() => assignAgentUser && selectedAgentId && assignToAgentMutation.mutate({
                  userId: assignAgentUser.id,
                  agentId: selectedAgentId,
                  notes: assignNotes,
                })}
                className="flex-1"
                disabled={!selectedAgentId || assignToAgentMutation.isPending}
              >
                {assignToAgentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <UserPlus className="h-4 w-4 mr-2" />
                Biriktirish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
