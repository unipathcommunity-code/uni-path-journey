import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Edit, Trash2, Users, Phone, Mail, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface Agent { id: string; name: string; company_name: string; phone: string; email: string | null; address: string | null; description: string | null; commission_rate: number | null; is_active: boolean; contract_start_date: string | null; contract_end_date: string | null; logo: string | null; user_id: string | null; created_at: string; }

const AdminAgents = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({ name: "", company_name: "", phone: "", email: "", address: "", description: "", commission_rate: 10, is_active: true, contract_start_date: "", contract_end_date: "", logo: "" });

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["admin-agents"],
    queryFn: async () => { const { data, error } = await (supabase as any).from("agents").select("*").order("created_at", { ascending: false }); if (error) throw error; return data as Agent[]; },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => { const { error } = await (supabase as any).from("agents").insert({ name: data.name, company_name: data.company_name, phone: data.phone, email: data.email || null, address: data.address || null, description: data.description || null, commission_rate: data.commission_rate, is_active: data.is_active, contract_start_date: data.contract_start_date || null, contract_end_date: data.contract_end_date || null, logo: data.logo || null }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-agents"] }); toast({ title: t("admin.success"), description: t("admin.agentAdded") }); resetForm(); },
    onError: () => { toast({ title: t("admin.error"), description: t("admin.error"), variant: "destructive" }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => { const { error } = await (supabase as any).from("agents").update({ name: data.name, company_name: data.company_name, phone: data.phone, email: data.email || null, address: data.address || null, description: data.description || null, commission_rate: data.commission_rate, is_active: data.is_active, contract_start_date: data.contract_start_date || null, contract_end_date: data.contract_end_date || null, logo: data.logo || null }).eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-agents"] }); toast({ title: t("admin.success"), description: t("admin.agentUpdated") }); resetForm(); },
    onError: () => { toast({ title: t("admin.error"), description: t("admin.error"), variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await (supabase as any).from("agents").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-agents"] }); toast({ title: t("admin.success"), description: t("admin.agentDeleted") }); setDeleteId(null); },
    onError: () => { toast({ title: t("admin.error"), description: t("admin.error"), variant: "destructive" }); },
  });

  const resetForm = () => { setFormData({ name: "", company_name: "", phone: "", email: "", address: "", description: "", commission_rate: 10, is_active: true, contract_start_date: "", contract_end_date: "", logo: "" }); setEditingAgent(null); setIsDialogOpen(false); };

  const handleEdit = (agent: Agent) => { setEditingAgent(agent); setFormData({ name: agent.name, company_name: agent.company_name, phone: agent.phone, email: agent.email || "", address: agent.address || "", description: agent.description || "", commission_rate: agent.commission_rate || 10, is_active: agent.is_active, contract_start_date: agent.contract_start_date || "", contract_end_date: agent.contract_end_date || "", logo: agent.logo || "" }); setIsDialogOpen(true); };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!formData.name || !formData.company_name || !formData.phone) { toast({ title: t("admin.error"), description: t("admin.fillRequired"), variant: "destructive" }); return; } if (editingAgent) { updateMutation.mutate({ id: editingAgent.id, data: formData }); } else { createMutation.mutate(formData); } };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">{t("admin.agents")}</h1><p className="text-muted-foreground">{t("admin.agentsManagement")}</p></div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2" onClick={() => resetForm()}><Plus className="h-4 w-4" />{t("admin.newAgent")}</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingAgent ? t("admin.editAgent") : t("admin.addAgent")}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{t("admin.responsiblePerson")} *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>{t("admin.companyName")} *</Label><Input value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} /></div>
                <div className="space-y-2"><Label>{t("admin.phone")} *</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+998 90 123 45 67" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                <div className="space-y-2 md:col-span-2"><Label>{t("admin.address")}</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                <div className="space-y-2"><Label>{t("admin.commissionRate")}</Label><Input type="number" min="0" max="100" value={formData.commission_rate} onChange={(e) => setFormData({ ...formData, commission_rate: Number(e.target.value) })} /></div>
                <div className="space-y-2"><Label>{t("admin.logoUrl")}</Label><Input value={formData.logo} onChange={(e) => setFormData({ ...formData, logo: e.target.value })} /></div>
                <div className="space-y-2"><Label>{t("admin.contractStart")}</Label><Input type="date" value={formData.contract_start_date} onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>{t("admin.contractEnd")}</Label><Input type="date" value={formData.contract_end_date} onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })} /></div>
                <div className="space-y-2 md:col-span-2"><Label>{t("admin.description")}</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
                <div className="flex items-center gap-2"><Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} /><Label>{t("admin.active")}</Label></div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">{t("admin.cancel")}</Button>
                <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>{(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingAgent ? t("admin.save") : t("admin.add")}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30"><Users className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{agents.length}</p><p className="text-sm text-muted-foreground">{t("admin.totalAgents")}</p></div></div></div>
        <div className="bg-card rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30"><Check className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{agents.filter(a => a.is_active).length}</p><p className="text-sm text-muted-foreground">{t("admin.activeAgents")}</p></div></div></div>
        <div className="bg-card rounded-xl border p-4"><div className="flex items-center gap-3"><div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30"><X className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold">{agents.filter(a => !a.is_active).length}</p><p className="text-sm text-muted-foreground">{t("admin.inactive")}</p></div></div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <div key={agent.id} className="bg-card rounded-xl border overflow-hidden">
            <div className="p-4 border-b flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-lg">{agent.company_name.charAt(0)}</div>
              <div className="flex-1"><h3 className="font-semibold">{agent.company_name}</h3><p className="text-sm text-muted-foreground">{agent.name}</p></div>
              <Badge variant={agent.is_active ? "default" : "secondary"}>{agent.is_active ? t("admin.active") : t("admin.inactive")}</Badge>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{agent.phone}</span></div>
              {agent.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span>{agent.email}</span></div>}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium text-green-600">{t("admin.commission")}: {agent.commission_rate || 10}%</span>
                <div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => handleEdit(agent)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(agent.id)}><Trash2 className="h-4 w-4" /></Button></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {agents.length === 0 && <div className="text-center py-12 text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{t("admin.noUsersFound")}</p></div>}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t("admin.deleteAgent")}</AlertDialogTitle><AlertDialogDescription>{t("admin.deleteAgentDesc")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t("admin.cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("admin.delete")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAgents;
