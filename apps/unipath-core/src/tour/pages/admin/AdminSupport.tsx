import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle, Clock, AlertCircle, CheckCircle, Send, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Ticket { id: string; subject: string; message: string; status: string; priority: string; created_at: string; user_id: string; }
interface TicketMessage { id: string; message: string; is_admin: boolean; created_at: string; sender_id: string; }

const AdminSupport = () => {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { fetchTickets(); }, []);
  useEffect(() => { if (selectedTicket) fetchMessages(selectedTicket.id); }, [selectedTicket]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setTickets(data || []);
    } catch (error) { console.error("Error fetching tickets:", error); } finally { setLoading(false); }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase.from("ticket_messages").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true });
      if (error) throw error;
      setMessages(data || []);
    } catch (error) { console.error("Error fetching messages:", error); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");
      const { error } = await supabase.from("ticket_messages").insert({ ticket_id: selectedTicket.id, message: newMessage, sender_id: userData.user.id, is_admin: true });
      if (error) throw error;
      setNewMessage("");
      fetchMessages(selectedTicket.id);
      toast({ title: t("admin.messageSent") });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: t("admin.error"), description: t("admin.sendError"), variant: "destructive" });
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase.from("support_tickets").update({ status }).eq("id", ticketId);
      if (error) throw error;
      fetchTickets();
      if (selectedTicket?.id === ticketId) setSelectedTicket({ ...selectedTicket, status });
      toast({ title: t("admin.statusUpdatedTicket") });
    } catch (error) { console.error("Error updating status:", error); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge variant="destructive">{t("admin.open")}</Badge>;
      case "in_progress": return <Badge className="bg-warning text-warning-foreground">{t("admin.inProgress")}</Badge>;
      case "resolved": return <Badge className="bg-success text-success-foreground">{t("admin.resolved")}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return <Badge variant="destructive">{t("admin.highPriority")}</Badge>;
      case "normal": return <Badge variant="secondary">{t("admin.normalPriority")}</Badge>;
      case "low": return <Badge variant="outline">{t("admin.lowPriority")}</Badge>;
      default: return null;
    }
  };

  const openTickets = tickets.filter(t => t.status === "open");
  const inProgressTickets = tickets.filter(t => t.status === "in_progress");
  const resolvedTickets = tickets.filter(t => t.status === "resolved");

  if (selectedTicket) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1"><h2 className="font-semibold">{selectedTicket.subject}</h2><div className="flex items-center gap-2 mt-1">{getStatusBadge(selectedTicket.status)}{getPriorityBadge(selectedTicket.priority)}</div></div>
          <div className="flex gap-2">
            {selectedTicket.status !== "in_progress" && <Button variant="outline" size="sm" onClick={() => updateTicketStatus(selectedTicket.id, "in_progress")}>{t("admin.takeInProgress")}</Button>}
            {selectedTicket.status !== "resolved" && <Button variant="default" size="sm" onClick={() => updateTicketStatus(selectedTicket.id, "resolved")}>{t("admin.markResolved")}</Button>}
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4"><p className="text-sm text-muted-foreground mb-2">{t("admin.initialMessage")}</p><p>{selectedTicket.message}</p></div>
        <div className="flex-1 border rounded-lg">
          <div className="h-[400px] overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={cn("flex", msg.is_admin ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[70%] rounded-lg px-4 py-2", msg.is_admin ? "bg-primary text-primary-foreground" : "bg-muted")}>
                  <p className="text-sm">{msg.message}</p><p className="text-xs opacity-70 mt-1">{new Date(msg.created_at).toLocaleString("uz-UZ")}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t p-4"><form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={t("admin.writeReply")} className="flex-1" />
            <Button type="submit" disabled={!newMessage.trim()}><Send className="h-4 w-4" /></Button>
          </form></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">{t("admin.supportTitle")}</h1><p className="text-muted-foreground">{t("admin.supportDesc")}</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertCircle className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold">{openTickets.length}</p><p className="text-sm text-muted-foreground">{t("admin.openTickets")}</p></div></div></div>
        <div className="bg-card rounded-xl p-4 border border-border"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><Clock className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">{inProgressTickets.length}</p><p className="text-sm text-muted-foreground">{t("admin.inProgress")}</p></div></div></div>
        <div className="bg-card rounded-xl p-4 border border-border"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-success" /></div><div><p className="text-2xl font-bold">{resolvedTickets.length}</p><p className="text-sm text-muted-foreground">{t("admin.resolved")}</p></div></div></div>
      </div>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">{t("admin.open")} ({openTickets.length})</TabsTrigger>
          <TabsTrigger value="in_progress">{t("admin.inProgress")} ({inProgressTickets.length})</TabsTrigger>
          <TabsTrigger value="resolved">{t("admin.resolved")} ({resolvedTickets.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="space-y-3">
          {openTickets.length === 0 ? <p className="text-center text-muted-foreground py-8">{t("admin.noOpenTickets")}</p> : openTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} onClick={() => setSelectedTicket(ticket)} getStatusBadge={getStatusBadge} getPriorityBadge={getPriorityBadge} />)}
        </TabsContent>
        <TabsContent value="in_progress" className="space-y-3">
          {inProgressTickets.length === 0 ? <p className="text-center text-muted-foreground py-8">{t("admin.noInProgressTickets")}</p> : inProgressTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} onClick={() => setSelectedTicket(ticket)} getStatusBadge={getStatusBadge} getPriorityBadge={getPriorityBadge} />)}
        </TabsContent>
        <TabsContent value="resolved" className="space-y-3">
          {resolvedTickets.length === 0 ? <p className="text-center text-muted-foreground py-8">{t("admin.noResolvedTickets")}</p> : resolvedTickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} onClick={() => setSelectedTicket(ticket)} getStatusBadge={getStatusBadge} getPriorityBadge={getPriorityBadge} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface TicketCardProps { ticket: Ticket; onClick: () => void; getStatusBadge: (status: string) => React.ReactNode; getPriorityBadge: (priority: string) => React.ReactNode; }

const TicketCard = ({ ticket, onClick, getStatusBadge, getPriorityBadge }: TicketCardProps) => (
  <div onClick={onClick} className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:border-primary/50 transition-colors">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1"><div className="flex items-center gap-2 mb-2">{getStatusBadge(ticket.status)}{getPriorityBadge(ticket.priority)}</div><h3 className="font-medium">{ticket.subject}</h3><p className="text-sm text-muted-foreground line-clamp-2 mt-1">{ticket.message}</p></div>
      <div className="text-right"><p className="text-xs text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString("uz-UZ")}</p></div>
    </div>
  </div>
);

export default AdminSupport;
