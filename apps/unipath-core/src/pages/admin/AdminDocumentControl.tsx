import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";
import { createNotification } from "@/hooks/useNotifications";
import { useTranslation } from "react-i18next";
import { FileText, Search, Eye, EyeOff, Send, Building2, User, Calendar, Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import { uz } from "date-fns/locale";

interface Document { id: string; booking_id: string; document_type: string; file_name: string; file_url: string; uploaded_at: string; booking?: { id: string; user_id: string; tour?: { title: string }; profile?: { full_name: string } }; }
interface Agent { id: string; name: string; company_name: string; is_active: boolean; }
interface DocumentAccess { id: string; document_id: string; agent_id: string; granted_at: string; revoked_at: string | null; }

const AdminDocumentControl = () => {
  const { user } = useAuth();
  const { log } = useAuditLog();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  const DOCUMENT_LABELS: Record<string, string> = { passport: t("admin.passport"), id_card: t("admin.idCard"), photo: t("admin.photo"), visa: t("admin.visa"), other: t("admin.otherDoc") };

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ["admin-all-documents"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("booking_documents").select(`*, booking:bookings (id, user_id, tour:tours (title))`).order("uploaded_at", { ascending: false });
      if (error) throw error;
      const userIds = [...new Set((data || []).map((d: any) => d.booking?.user_id).filter(Boolean))] as string[];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      return (data || []).map((doc: any) => ({ ...doc, booking: { ...doc.booking, profile: { full_name: profileMap.get(doc.booking?.user_id) || t("admin.unknown") } } })) as Document[];
    },
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["admin-agents-list"],
    queryFn: async () => { const { data, error } = await (supabase as any).from("agents").select("id, name, company_name, is_active").eq("is_active", true).order("name"); if (error) throw error; return data as Agent[]; },
  });

  const { data: documentAccess = [], isLoading: accessLoading } = useQuery({
    queryKey: ["document-access", selectedDocument?.id],
    queryFn: async () => { if (!selectedDocument) return []; const { data, error } = await (supabase as any).from("document_agent_access").select("*").eq("document_id", selectedDocument.id); if (error) throw error; return data as DocumentAccess[]; },
    enabled: !!selectedDocument,
  });

  const grantAccessMutation = useMutation({
    mutationFn: async ({ documentId, agentIds }: { documentId: string; agentIds: string[] }) => {
      const inserts = agentIds.map(agentId => ({ document_id: documentId, agent_id: agentId, granted_by: user?.id }));
      const { error } = await (supabase as any).from("document_agent_access").upsert(inserts, { onConflict: "document_id,agent_id", ignoreDuplicates: false });
      if (error) throw error;
      await (supabase as any).from("document_agent_access").update({ revoked_at: null, granted_at: new Date().toISOString() }).eq("document_id", documentId).in("agent_id", agentIds);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["document-access"] });
      await log({ actionType: "assign", entityType: "document", entityId: selectedDocument?.id, newValues: { agent_ids: selectedAgentIds } });
      for (const agentId of selectedAgentIds) {
        const agent = agents.find(a => a.id === agentId);
        if (agent) { const { data: agentData } = await (supabase as any).from("agents").select("user_id").eq("id", agentId).single(); if (agentData?.user_id) { await createNotification({ userId: agentData.user_id, title: t("admin.docControlTitle"), message: t("admin.accessGranted"), type: "info", category: "document", relatedEntityId: selectedDocument?.id }); } }
      }
      toast.success(t("admin.accessGranted"));
      setSelectedAgentIds([]);
    },
    onError: (error) => { toast.error(t("admin.error") + ": " + (error as Error).message); },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: async ({ documentId, agentId }: { documentId: string; agentId: string }) => { const { error } = await (supabase as any).from("document_agent_access").update({ revoked_at: new Date().toISOString() }).eq("document_id", documentId).eq("agent_id", agentId); if (error) throw error; },
    onSuccess: async (_, variables) => { queryClient.invalidateQueries({ queryKey: ["document-access"] }); await log({ actionType: "revoke", entityType: "document", entityId: variables.documentId, metadata: { agent_id: variables.agentId } }); toast.success(t("admin.accessRevoked")); },
  });

  const viewDocument = async (doc: Document) => {
    const { data, error } = await supabase.storage.from("booking-documents").createSignedUrl(doc.file_url, 3600);
    if (error) { toast.error(t("admin.error")); return; }
    window.open(data.signedUrl, "_blank");
    await log({ actionType: "view", entityType: "document", entityId: doc.id });
  };

  const filteredDocs = documents.filter((doc: Document) => doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) || doc.booking?.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || doc.booking?.tour?.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (docsLoading) return <div className="space-y-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-96" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" />{t("admin.docControlTitle")}</h1><p className="text-muted-foreground">{t("admin.docControlDesc")}</p></div>

      <Card><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t("admin.searchDocuments")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div></CardContent></Card>

      <Card><CardHeader><CardTitle>{t("admin.total")}: {filteredDocs.length} {t("admin.totalDocuments")}</CardTitle></CardHeader><CardContent>
        <Table><TableHeader><TableRow>
          <TableHead>{t("admin.document")}</TableHead><TableHead>{t("admin.user")}</TableHead><TableHead>{t("admin.tour")}</TableHead><TableHead>{t("admin.uploadedDate")}</TableHead><TableHead>{t("admin.agents")}</TableHead><TableHead className="text-right">{t("admin.actions")}</TableHead>
        </TableRow></TableHeader><TableBody>
          {filteredDocs.map((doc: Document) => (
            <TableRow key={doc.id}>
              <TableCell><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><div><p className="font-medium">{DOCUMENT_LABELS[doc.document_type] || doc.document_type}</p><p className="text-xs text-muted-foreground truncate max-w-[150px]">{doc.file_name}</p></div></div></TableCell>
              <TableCell><div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />{doc.booking?.profile?.full_name || t("admin.unknown")}</div></TableCell>
              <TableCell>{doc.booking?.tour?.title || "-"}</TableCell>
              <TableCell><div className="flex items-center gap-1 text-sm text-muted-foreground"><Calendar className="h-3 w-3" />{format(new Date(doc.uploaded_at), "dd.MM.yyyy")}</div></TableCell>
              <TableCell><Badge variant="outline">0</Badge></TableCell>
              <TableCell className="text-right"><div className="flex items-center justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => viewDocument(doc)}><Eye className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => setSelectedDocument(doc)}><Send className="h-4 w-4 mr-1" />{t("admin.sendToAgent")}</Button></div></TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
        {filteredDocs.length === 0 && <div className="text-center py-12 text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{t("admin.noDocuments")}</p></div>}
      </CardContent></Card>

      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5" />{t("admin.sendDocToAgent")}</DialogTitle></DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4"><p className="font-medium">{DOCUMENT_LABELS[selectedDocument.document_type]}</p><p className="text-sm text-muted-foreground">{selectedDocument.booking?.profile?.full_name} - {selectedDocument.file_name}</p></div>
              {accessLoading ? <Skeleton className="h-20" /> : documentAccess.filter(a => !a.revoked_at).length > 0 ? (
                <div className="space-y-2"><p className="text-sm font-medium">{t("admin.currentAccess")}</p><div className="space-y-2">{documentAccess.filter(a => !a.revoked_at).map(access => {
                  const agent = agents.find(a => a.id === access.agent_id);
                  return <div key={access.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /><span>{agent?.name} - {agent?.company_name}</span></div><Button variant="ghost" size="sm" className="text-red-600" onClick={() => revokeAccessMutation.mutate({ documentId: selectedDocument.id, agentId: access.agent_id })}><XCircle className="h-4 w-4 mr-1" />{t("admin.revokeAccess")}</Button></div>;
                })}</div></div>
              ) : null}
              <div className="space-y-2"><p className="text-sm font-medium">{t("admin.sendToNewAgents")}</p><div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2">
                {agents.filter(agent => !documentAccess.some(a => a.agent_id === agent.id && !a.revoked_at)).map(agent => (
                  <div key={agent.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded"><Checkbox checked={selectedAgentIds.includes(agent.id)} onCheckedChange={(checked) => setSelectedAgentIds(prev => checked ? [...prev, agent.id] : prev.filter(id => id !== agent.id))} /><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><div><p className="font-medium">{agent.name}</p><p className="text-xs text-muted-foreground">{agent.company_name}</p></div></div></div>
                ))}
              </div></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDocument(null)}>{t("admin.cancel")}</Button>
            <Button onClick={() => selectedDocument && grantAccessMutation.mutate({ documentId: selectedDocument.id, agentIds: selectedAgentIds })} disabled={selectedAgentIds.length === 0 || grantAccessMutation.isPending}>
              {grantAccessMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}{t("admin.send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDocumentControl;
