import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import {
  Ticket, Search, Calendar, MapPin, Users, MoreHorizontal, Loader2, Check, X, Eye, DollarSign, Clock, FileText, Send, Download, Building2, ExternalLink,
} from "lucide-react";
import { createNotification } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatPrice } from "@/data/tours";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Define interfaces for data structures
interface Tour {
  title: string;
  destination: string;
  country: string;
  image: string | null;
}

interface Profile {
  full_name: string | null;
  phone: string | null;
}

interface BookingDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

interface Agent {
  id: string;
  name: string;
  company_name: string;
  phone: string;
  email: string | null;
}

interface AgentAssignment {
  id: string;
  agent_id: string;
  assigned_at: string;
  notes: string | null;
  agent?: Agent;
}

interface Booking {
  id: string;
  tour_id: string;
  user_id: string;
  travel_date: string;
  people_count: number;
  total_price: number;
  status: string;
  notes: string | null;
  created_at: string;
  tours?: Tour;
  profile?: Profile;
  documents?: BookingDocument[];
  assignment?: AgentAssignment | null;
}

const DocumentViewItem = ({ doc }: { doc: BookingDocument }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const DOCUMENT_TYPE_LABELS: Record<string, string> = { passport: t("admin.passport"), id_card: t("admin.idCard"), photo: t("admin.photo"), visa: t("admin.visa"), other: t("admin.otherDoc") };

  const handleViewDocument = async () => {
    setLoading(true);
    try { const { data, error } = await supabase.storage.from("booking-documents").createSignedUrl(doc.file_url, 3600); if (error) throw error; if (data?.signedUrl) window.open(data.signedUrl, "_blank"); } catch (error) { toast.error(t("admin.error")); } finally { setLoading(false); }
  };

  const handleDownloadDocument = async () => {
    setLoading(true);
    try { const { data, error } = await supabase.storage.from("booking-documents").createSignedUrl(doc.file_url, 3600); if (error) throw error; if (data?.signedUrl) { const link = document.createElement("a"); link.href = data.signedUrl; link.download = doc.file_name; link.click(); } } catch (error) { toast.error(t("admin.error")); } finally { setLoading(false); }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
      <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div><div><p className="font-medium text-sm">{DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}</p><p className="text-xs text-muted-foreground">{doc.file_name}</p></div></div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleViewDocument} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ExternalLink className="h-4 w-4 mr-1" />{t("admin.view")}</>}</Button>
        <Button variant="outline" size="sm" onClick={handleDownloadDocument} disabled={loading}><Download className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

const AdminBookings = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  const { data: agents = [] } = useQuery({
    queryKey: ["admin-agents-for-assignment"],
    queryFn: async () => { const { data, error } = await (supabase as any).from("agents").select("id, name, company_name, phone, email").eq("is_active", true).order("company_name"); if (error) throw error; return data as Agent[]; },
  });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["admin-bookings-with-docs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select(`*, tours (title, destination, country, image)`).order("created_at", { ascending: false });
      if (error) throw error;
      const userIds = [...new Set(data?.map(b => b.user_id) || [])];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, phone").in("user_id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      const bookingIds = data?.map(b => b.id) || [];
      const { data: documents } = await (supabase as any).from("booking_documents").select("*").in("booking_id", bookingIds);
      const docsMap = new Map<string, BookingDocument[]>();
      documents?.forEach((doc: BookingDocument & { booking_id: string }) => { if (!docsMap.has(doc.booking_id)) docsMap.set(doc.booking_id, []); docsMap.get(doc.booking_id)?.push(doc); });
      const { data: assignments } = await (supabase as any).from("booking_agent_assignments").select(`*, agent:agents(id, name, company_name, phone, email)`).in("booking_id", bookingIds);
      const assignmentMap = new Map<string, AgentAssignment>();
      assignments?.forEach((a: AgentAssignment & { booking_id: string }) => { assignmentMap.set(a.booking_id, a); });
      return data?.map(booking => ({ ...booking, profile: profileMap.get(booking.user_id) || null, documents: docsMap.get(booking.id) || [], assignment: assignmentMap.get(booking.id) || null })) as Booking[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
      if (error) throw error;

      // Notify user about status change
      const booking = bookings.find(b => b.id === id);
      if (booking) {
        const statusLabel = status === "confirmed" ? "tasdiqlandi" : status === "cancelled" ? "bekor qilindi" : status;
        await createNotification({
          userId: booking.user_id,
          title: `Buyurtma ${statusLabel}`,
          message: `"${booking.tours?.title}" buyurtmangiz ${statusLabel}.`,
          type: status === "confirmed" ? "success" : status === "cancelled" ? "error" : "info",
          category: "booking",
          relatedEntityType: "booking",
          relatedEntityId: id,
        }).catch(console.error);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-bookings-with-docs"] }); toast.success(t("admin.statusUpdated")); },
    onError: () => { toast.error(t("admin.statusError")); },
  });

  const assignToAgentMutation = useMutation({
    mutationFn: async ({ bookingId, agentId, notes }: { bookingId: string; agentId: string; notes: string }) => {
      const { error } = await (supabase as any).from("booking_agent_assignments").upsert({ booking_id: bookingId, agent_id: agentId, assigned_by: user?.id, notes: notes || null }, { onConflict: "booking_id" });
      if (error) throw error;

      // Notify agent about new assignment
      const agent = agents.find(a => a.id === agentId);
      const booking = bookings.find(b => b.id === bookingId);
      const { data: agentData } = await (supabase as any).from("agents").select("user_id").eq("id", agentId).single();
      if (agentData?.user_id) {
        await createNotification({
          userId: agentData.user_id,
          title: "Yangi mijoz tayinlandi",
          message: `Sizga yangi mijoz tayinlandi: "${booking?.tours?.title}"`,
          type: "info",
          category: "booking",
          relatedEntityType: "booking",
          relatedEntityId: bookingId,
        }).catch(console.error);
      }

      // Notify user about agent assignment
      if (booking) {
        await createNotification({
          userId: booking.user_id,
          title: "Agent tayinlandi",
          message: `Buyurtmangizga "${agent?.company_name}" agentlik tayinlandi.`,
          type: "info",
          category: "booking",
          relatedEntityType: "booking",
          relatedEntityId: bookingId,
        }).catch(console.error);
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-bookings-with-docs"] }); toast.success(t("admin.success")); setShowAssignDialog(false); setSelectedAgent(""); setAssignNotes(""); },
    onError: () => { toast.error(t("admin.error")); },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async (bookingId: string) => { const { error } = await (supabase as any).from("booking_agent_assignments").delete().eq("booking_id", bookingId); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-bookings-with-docs"] }); toast.success(t("admin.assignRemoved")); },
    onError: () => { toast.error(t("admin.error")); },
  });

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.tours?.title?.toLowerCase().includes(search.toLowerCase()) || booking.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) || booking.profile?.phone?.includes(search);
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{t("admin.confirmed")}</Badge>;
      case "pending": return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">{t("admin.pending")}</Badge>;
      case "cancelled": return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{t("admin.cancelled")}</Badge>;
      case "completed": return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{t("admin.completed")}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = [
    { label: t("admin.totalBookings"), value: bookings.length, icon: Ticket, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
    { label: t("admin.pending"), value: bookings.filter(b => b.status === "pending").length, icon: Clock, color: "text-yellow-600", bgColor: "bg-yellow-50 dark:bg-yellow-950/30" },
    { label: t("admin.withDocuments"), value: bookings.filter(b => b.documents && b.documents.length > 0).length, icon: FileText, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/30" },
    { label: t("admin.totalRevenue"), value: formatPrice(bookings.filter(b => b.status === "confirmed").reduce((sum, b) => sum + b.total_price, 0)), icon: DollarSign, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/30" },
  ];

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">{t("admin.bookings")}</h1><p className="text-muted-foreground">{t("admin.bookingsManagement")}</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}><CardContent className="p-4"><div className="flex items-center gap-4"><div className={`p-3 rounded-xl ${stat.bgColor}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div><div><p className="text-xl font-bold">{stat.value}</p><p className="text-sm text-muted-foreground">{stat.label}</p></div></div></CardContent></Card>
        ))}
      </div>

      <Card><CardContent className="p-4"><div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t("admin.searchBookings")} className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full md:w-48"><SelectValue placeholder={t("admin.byStatus")} /></SelectTrigger><SelectContent><SelectItem value="all">{t("admin.allStatus")}</SelectItem><SelectItem value="pending">{t("admin.pending")}</SelectItem><SelectItem value="confirmed">{t("admin.confirmed")}</SelectItem><SelectItem value="cancelled">{t("admin.cancelled")}</SelectItem><SelectItem value="completed">{t("admin.completed")}</SelectItem></SelectContent></Select>
      </div></CardContent></Card>

      <div className="space-y-4">
        {filteredBookings.map(booking => (
          <Card key={booking.id} className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-40 h-32 md:h-auto flex-shrink-0"><img src={booking.tours?.image || "/placeholder.svg"} alt={booking.tours?.title} className="w-full h-full object-cover" /></div>
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between">
                  <div><h3 className="font-semibold">{booking.tours?.title}</h3><div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground"><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{booking.tours?.destination}, {booking.tours?.country}</span><span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(booking.travel_date).toLocaleDateString("uz-UZ")}</span><span className="flex items-center gap-1"><Users className="h-3 w-3" />{booking.people_count} {t("tours.people")}</span></div></div>
                  <div className="flex items-center gap-2">{getStatusBadge(booking.status)}
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedBooking(booking)}><Eye className="h-4 w-4 mr-2" />{t("admin.view")}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: booking.id, status: "confirmed" })}><Check className="h-4 w-4 mr-2" />{t("admin.confirmed")}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: booking.id, status: "cancelled" })}><X className="h-4 w-4 mr-2" />{t("admin.cancelled")}</DropdownMenuItem>
                    </DropdownMenuContent></DropdownMenu>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-4"><span className="text-lg font-bold text-primary">{formatPrice(booking.total_price)}</span>{booking.profile && <span className="text-sm text-muted-foreground">{booking.profile.full_name}</span>}</div>
                  <div className="flex items-center gap-2">
                    {booking.documents && booking.documents.length > 0 && <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" />{booking.documents.length}</Badge>}
                    {booking.assignment && <Badge variant="outline" className="gap-1"><Building2 className="h-3 w-3" />{booking.assignment.agent?.company_name}</Badge>}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {filteredBookings.length === 0 && <div className="text-center py-12 text-muted-foreground"><Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{t("admin.noBookings")}</p></div>}
      </div>

      {selectedBooking && (
        <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{t("operator.bookingDetails")}</DialogTitle></DialogHeader>
            <div className="space-y-6">
              <div className="flex items-center gap-4"><img src={selectedBooking.tours?.image || "/placeholder.svg"} alt="" className="w-24 h-18 rounded-lg object-cover" /><div><h3 className="font-semibold text-lg">{selectedBooking.tours?.title}</h3><p className="text-muted-foreground">{selectedBooking.tours?.destination}, {selectedBooking.tours?.country}</p></div></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><p className="text-sm text-muted-foreground">{t("admin.date")}</p><p className="font-medium">{new Date(selectedBooking.travel_date).toLocaleDateString("uz-UZ")}</p></div>
                <div><p className="text-sm text-muted-foreground">{t("tours.people")}</p><p className="font-medium">{selectedBooking.people_count}</p></div>
                <div><p className="text-sm text-muted-foreground">{t("admin.price")}</p><p className="font-bold text-primary">{formatPrice(selectedBooking.total_price)}</p></div>
                <div><p className="text-sm text-muted-foreground">{t("admin.status")}</p>{getStatusBadge(selectedBooking.status)}</div>
              </div>
              {selectedBooking.profile && <div><p className="text-sm text-muted-foreground">{t("admin.user")}</p><p className="font-medium">{selectedBooking.profile.full_name} • {selectedBooking.profile.phone}</p></div>}
              {selectedBooking.documents && selectedBooking.documents.length > 0 && <div className="space-y-2"><p className="font-medium">{t("admin.document")} ({selectedBooking.documents.length})</p>{selectedBooking.documents.map(doc => <DocumentViewItem key={doc.id} doc={doc} />)}</div>}
              {selectedBooking.assignment && <div className="p-4 bg-muted/50 rounded-lg"><p className="text-sm text-muted-foreground mb-1">{t("admin.agents")}</p><p className="font-medium">{selectedBooking.assignment.agent?.name} - {selectedBooking.assignment.agent?.company_name}</p></div>}
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => updateStatusMutation.mutate({ id: selectedBooking.id, status: "confirmed" })} disabled={selectedBooking.status === "confirmed"}><Check className="h-4 w-4 mr-2" />{t("admin.confirmed")}</Button>
                <Button variant="outline" className="flex-1" onClick={() => { setShowAssignDialog(true); }}><Send className="h-4 w-4 mr-2" />{t("admin.assign")}</Button>
                <Button variant="destructive" className="flex-1" onClick={() => updateStatusMutation.mutate({ id: selectedBooking.id, status: "cancelled" })} disabled={selectedBooking.status === "cancelled"}><X className="h-4 w-4 mr-2" />{t("admin.cancelled")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent><DialogHeader><DialogTitle>{t("admin.assignToAgent")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t("admin.selectAgent")}</Label><Select value={selectedAgent} onValueChange={setSelectedAgent}><SelectTrigger><SelectValue placeholder={t("admin.selectAgent")} /></SelectTrigger><SelectContent>{agents.map(agent => <SelectItem key={agent.id} value={agent.id}>{agent.name} - {agent.company_name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>{t("operator.notes")}</Label><Textarea value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} /></div>
            <div className="flex gap-2"><Button variant="outline" onClick={() => setShowAssignDialog(false)} className="flex-1">{t("admin.cancel")}</Button><Button className="flex-1" onClick={() => selectedBooking && assignToAgentMutation.mutate({ bookingId: selectedBooking.id, agentId: selectedAgent, notes: assignNotes })} disabled={!selectedAgent || assignToAgentMutation.isPending}>{t("admin.assign")}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookings;
