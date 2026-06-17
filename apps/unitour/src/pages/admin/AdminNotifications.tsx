import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useTranslation } from "react-i18next";
import { Bell, Send, Users, User, Search, Plus, Info, CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfile { user_id: string; full_name: string | null; }

const AdminNotifications = () => {
  const { user } = useAuth();
  const { log } = useAuditLog();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "success" | "warning" | "error">("info");
  const [sendType, setSendType] = useState<"all" | "selected">("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users-for-notifications"],
    queryFn: async () => { const { data, error } = await supabase.from("profiles").select("user_id, full_name").order("full_name"); if (error) throw error; return data as UserProfile[]; },
  });

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ["admin-sent-notifications"],
    queryFn: async () => { const { data, error } = await (supabase as any).from("notifications").select("*").order("created_at", { ascending: false }).limit(100); if (error) throw error; return data; },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async () => {
      const targetUsers = sendType === "all" ? users.map(u => u.user_id) : selectedUsers;
      const inserts = targetUsers.map(userId => ({ user_id: userId, title, message, type, category: "system" as const }));
      const { error } = await (supabase as any).from("notifications").insert(inserts);
      if (error) throw error;
      return { count: targetUsers.length };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-sent-notifications"] });
      await log({ actionType: "create", entityType: "notification", newValues: { title, message, type, recipients: data.count } });
      toast.success(`${data.count} ${t("admin.usersSelected")}`);
      resetForm(); setShowCreateDialog(false);
    },
    onError: (error) => { toast.error(t("admin.error") + ": " + (error as Error).message); },
  });

  const resetForm = () => { setTitle(""); setMessage(""); setType("info"); setSendType("all"); setSelectedUsers([]); };

  const getTypeIcon = (notifType: string) => {
    switch (notifType) { case "success": return <CheckCircle className="h-4 w-4 text-green-500" />; case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />; case "error": return <XCircle className="h-4 w-4 text-red-500" />; default: return <Info className="h-4 w-4 text-blue-500" />; }
  };

  const getTypeBadge = (notifType: string) => {
    const colors: Record<string, string> = { info: "bg-blue-100 text-blue-700", success: "bg-green-100 text-green-700", warning: "bg-yellow-100 text-yellow-700", error: "bg-red-100 text-red-700" };
    const labels: Record<string, string> = { info: t("admin.info"), success: t("admin.successType"), warning: t("admin.warning"), error: t("admin.errorType") };
    return <Badge className={colors[notifType]}>{labels[notifType] || notifType}</Badge>;
  };

  const filteredUsers = users.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));
  const groupedNotifications = notifications.reduce((acc: Record<string, any[]>, notif: any) => { const date = format(new Date(notif.created_at), "yyyy-MM-dd"); if (!acc[date]) acc[date] = []; acc[date].push(notif); return acc; }, {});

  if (usersLoading || notificationsLoading) return <div className="space-y-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6" />{t("admin.notificationsTitle")}</h1><p className="text-muted-foreground">{t("admin.notificationsDesc")}</p></div>
        <Button onClick={() => setShowCreateDialog(true)}><Plus className="h-4 w-4 mr-2" />{t("admin.newNotification")}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30"><Users className="h-6 w-6 text-blue-600" /></div><div><p className="text-2xl font-bold">{users.length}</p><p className="text-sm text-muted-foreground">{t("admin.totalUsers")}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30"><Send className="h-6 w-6 text-green-600" /></div><div><p className="text-2xl font-bold">{notifications.length}</p><p className="text-sm text-muted-foreground">{t("admin.sentNotifications")}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30"><Bell className="h-6 w-6 text-purple-600" /></div><div><p className="text-2xl font-bold">{notifications.filter((n: any) => !n.is_read).length}</p><p className="text-sm text-muted-foreground">{t("admin.unread")}</p></div></div></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>{t("admin.notificationHistory")}</CardTitle></CardHeader><CardContent>
        {Object.keys(groupedNotifications).length > 0 ? (
          <div className="space-y-6">{Object.entries(groupedNotifications).map(([date, notifs]) => (
            <div key={date}><p className="text-sm font-medium text-muted-foreground mb-3">{format(new Date(date), "dd MMMM yyyy", { locale: uz })}</p><div className="space-y-2">{(notifs as any[]).slice(0, 5).map(notif => (
              <div key={notif.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">{getTypeIcon(notif.type)}<div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="font-medium">{notif.title}</p>{getTypeBadge(notif.type)}</div><p className="text-sm text-muted-foreground line-clamp-1">{notif.message}</p></div><span className="text-xs text-muted-foreground">{format(new Date(notif.created_at), "HH:mm")}</span></div>
            ))}</div></div>
          ))}</div>
        ) : (
          <div className="text-center py-12 text-muted-foreground"><Bell className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{t("admin.noNotificationsSent")}</p></div>
        )}
      </CardContent></Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5" />{t("admin.newNotification")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t("admin.notificationTitle")}</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("admin.notificationTitle")} /></div>
            <div><Label>{t("admin.notificationMessage")}</Label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("admin.notificationMessage")} rows={3} /></div>
            <div><Label>{t("admin.notificationType")}</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="info"><div className="flex items-center gap-2"><Info className="h-4 w-4 text-blue-500" />{t("admin.info")}</div></SelectItem>
                <SelectItem value="success"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />{t("admin.successType")}</div></SelectItem>
                <SelectItem value="warning"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" />{t("admin.warning")}</div></SelectItem>
                <SelectItem value="error"><div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" />{t("admin.errorType")}</div></SelectItem>
              </SelectContent></Select>
            </div>
            <div><Label>{t("admin.sendToAll")}</Label>
              <RadioGroup value={sendType} onValueChange={(v: any) => setSendType(v)} className="mt-2">
                <div className="flex items-center space-x-2"><RadioGroupItem value="all" id="all" /><Label htmlFor="all" className="flex items-center gap-2 cursor-pointer"><Users className="h-4 w-4" />{t("admin.sendToAll")} ({users.length})</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="selected" id="selected" /><Label htmlFor="selected" className="flex items-center gap-2 cursor-pointer"><User className="h-4 w-4" />{t("admin.sendToSelected")}</Label></div>
              </RadioGroup>
            </div>
            {sendType === "selected" && (
              <div className="space-y-2">
                <Input placeholder={t("admin.searchUser")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">{filteredUsers.map(u => (
                  <div key={u.user_id} className="flex items-center gap-2 p-2 hover:bg-muted rounded"><Checkbox checked={selectedUsers.includes(u.user_id)} onCheckedChange={(checked) => setSelectedUsers(prev => checked ? [...prev, u.user_id] : prev.filter(id => id !== u.user_id))} /><User className="h-4 w-4 text-muted-foreground" /><span>{u.full_name || t("admin.unknown")}</span></div>
                ))}</div>
                {selectedUsers.length > 0 && <p className="text-sm text-muted-foreground">{selectedUsers.length} {t("admin.usersSelected")}</p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>{t("admin.cancel")}</Button>
            <Button onClick={() => sendNotificationMutation.mutate()} disabled={!title || !message || (sendType === "selected" && selectedUsers.length === 0) || sendNotificationMutation.isPending}>
              {sendNotificationMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}{t("admin.send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNotifications;
