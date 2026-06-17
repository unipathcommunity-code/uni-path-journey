import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import {
  History, Search, Filter, User, FileText, Package, Building2, Calendar,
  ChevronLeft, ChevronRight, Eye, Edit, Trash2, Plus, UserCheck, UserX, LogIn, LogOut,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDistanceToNow, format } from "date-fns";
import { uz } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface AuditLog { id: string; user_id: string; action_type: string; entity_type: string; entity_id: string | null; old_values: Record<string, unknown> | null; new_values: Record<string, unknown> | null; metadata: Record<string, unknown> | null; created_at: string; user_email?: string; }

const PAGE_SIZE = 20;

const AdminAuditLog = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, actionFilter, entityFilter],
    queryFn: async () => {
      let query = (supabase as any).from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (actionFilter !== "all") query = query.eq("action_type", actionFilter);
      if (entityFilter !== "all") query = query.eq("entity_type", entityFilter);
      const { data, error, count } = await query;
      if (error) throw error;
      const userIds = [...new Set((data || []).map((log: AuditLog) => log.user_id))] as string[];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const userMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      return { logs: (data || []).map((log: AuditLog) => ({ ...log, user_email: userMap.get(log.user_id) || t("admin.unknown") })), total: count || 0 };
    },
  });

  const logs = data?.logs || [];
  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create": return <Plus className="h-4 w-4 text-green-500" />;
      case "update": return <Edit className="h-4 w-4 text-blue-500" />;
      case "delete": return <Trash2 className="h-4 w-4 text-red-500" />;
      case "view": return <Eye className="h-4 w-4 text-gray-500" />;
      case "assign": return <UserCheck className="h-4 w-4 text-purple-500" />;
      case "revoke": return <UserX className="h-4 w-4 text-orange-500" />;
      case "login": return <LogIn className="h-4 w-4 text-green-500" />;
      case "logout": return <LogOut className="h-4 w-4 text-gray-500" />;
      default: return <History className="h-4 w-4" />;
    }
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case "user": return <User className="h-4 w-4" />;
      case "document": return <FileText className="h-4 w-4" />;
      case "tour": return <Package className="h-4 w-4" />;
      case "agent": return <Building2 className="h-4 w-4" />;
      case "booking": return <Calendar className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = { create: "bg-green-100 text-green-700", update: "bg-blue-100 text-blue-700", delete: "bg-red-100 text-red-700", view: "bg-gray-100 text-gray-700", assign: "bg-purple-100 text-purple-700", revoke: "bg-orange-100 text-orange-700", login: "bg-green-100 text-green-700", logout: "bg-gray-100 text-gray-700" };
    const labels: Record<string, string> = { create: t("admin.create"), update: t("admin.update"), delete: t("admin.delete"), view: t("admin.view2"), assign: t("admin.assign"), revoke: t("admin.revoke"), login: t("admin.login"), logout: t("admin.logout") };
    return <Badge className={colors[action] || "bg-gray-100"}>{labels[action] || action}</Badge>;
  };

  const filteredLogs = logs.filter((log: AuditLog) => log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) || log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-64" /><div className="space-y-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20" />)}</div></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><History className="h-6 w-6" />{t("admin.auditLogTitle")}</h1><p className="text-muted-foreground">{t("admin.auditLogDesc")}</p></div>

      <Card><CardContent className="p-4"><div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t("admin.searchLogs")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
        <Select value={actionFilter} onValueChange={setActionFilter}><SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder={t("admin.actionType")} /></SelectTrigger><SelectContent>
          <SelectItem value="all">{t("admin.allActions")}</SelectItem><SelectItem value="create">{t("admin.create")}</SelectItem><SelectItem value="update">{t("admin.update")}</SelectItem><SelectItem value="delete">{t("admin.delete")}</SelectItem><SelectItem value="view">{t("admin.view2")}</SelectItem><SelectItem value="assign">{t("admin.assign")}</SelectItem><SelectItem value="revoke">{t("admin.revoke")}</SelectItem>
        </SelectContent></Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder={t("admin.objectType")} /></SelectTrigger><SelectContent>
          <SelectItem value="all">{t("admin.allObjects")}</SelectItem><SelectItem value="user">{t("admin.user")}</SelectItem><SelectItem value="agent">{t("admin.agents")}</SelectItem><SelectItem value="booking">{t("admin.booking")}</SelectItem><SelectItem value="document">{t("admin.document")}</SelectItem><SelectItem value="tour">{t("admin.tours")}</SelectItem>
        </SelectContent></Select>
      </div></CardContent></Card>

      <Card><CardHeader><CardTitle>{t("admin.total")}: {data?.total || 0} {t("admin.totalRecords")}</CardTitle></CardHeader><CardContent>
        {filteredLogs.length > 0 ? (
          <div className="space-y-3">
            {filteredLogs.map((log: AuditLog) => (
              <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => setSelectedLog(log)}>
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">{getActionIcon(log.action_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap"><span className="font-medium">{log.user_email}</span>{getActionBadge(log.action_type)}<Badge variant="outline" className="flex items-center gap-1">{getEntityIcon(log.entity_type)}{log.entity_type}</Badge></div>
                  {log.entity_id && <p className="text-sm text-muted-foreground mt-1"><span className="font-mono text-xs">ID: {log.entity_id.slice(0, 8)}...</span></p>}
                  <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: uz })}</p>
                </div>
                <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground"><History className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{t("admin.noRecordsFound")}</p></div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground">{t("admin.page")} {page + 1} / {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft className="h-4 w-4 mr-1" />{t("admin.prevPage")}</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>{t("admin.nextPage")}<ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </div>
        )}
      </CardContent></Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle className="flex items-center gap-2">{selectedLog && getActionIcon(selectedLog.action_type)}{t("admin.actionDetails")}</DialogTitle></DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">{t("admin.user")}</p><p className="font-medium">{selectedLog.user_email}</p></div>
                <div><p className="text-sm text-muted-foreground">{t("admin.date")}</p><p className="font-medium">{format(new Date(selectedLog.created_at), "dd MMMM yyyy, HH:mm", { locale: uz })}</p></div>
                <div><p className="text-sm text-muted-foreground">{t("admin.actionType")}</p>{getActionBadge(selectedLog.action_type)}</div>
                <div><p className="text-sm text-muted-foreground">{t("admin.objectType")}</p><Badge variant="outline" className="flex items-center gap-1 w-fit">{getEntityIcon(selectedLog.entity_type)}{selectedLog.entity_type}</Badge></div>
              </div>
              {selectedLog.entity_id && <div><p className="text-sm text-muted-foreground">ID</p><code className="text-sm bg-muted px-2 py-1 rounded">{selectedLog.entity_id}</code></div>}
              {selectedLog.old_values && <div><p className="text-sm text-muted-foreground mb-2">{t("admin.oldValues")}</p><pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-40">{JSON.stringify(selectedLog.old_values, null, 2)}</pre></div>}
              {selectedLog.new_values && <div><p className="text-sm text-muted-foreground mb-2">{t("admin.newValues")}</p><pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-40">{JSON.stringify(selectedLog.new_values, null, 2)}</pre></div>}
              {selectedLog.metadata && <div><p className="text-sm text-muted-foreground mb-2">{t("admin.additionalInfo")}</p><pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-40">{JSON.stringify(selectedLog.metadata, null, 2)}</pre></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAuditLog;
