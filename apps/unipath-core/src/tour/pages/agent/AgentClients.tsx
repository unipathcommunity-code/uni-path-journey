import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import {
  Users, Search, Calendar, MapPin, Phone, Loader2, UserCheck, Clock, Eye, Download, X, FileText, ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Agent {
  id: string;
  user_id: string | null;
  commission_rate: number | null;
}

interface AssignedClient {
  assignmentId: string;
  assignedAt: string;
  notes: string | null;
  booking: {
    id: string;
    user_id: string;
    tour_id: string;
    travel_date: string;
    people_count: number;
    total_price: number;
    status: string;
    created_at: string;
    notes: string | null;
    tours?: {
      title: string;
      destination: string;
      image: string | null;
      duration_days: number;
      duration_nights: number;
    };
  };
  profile?: {
    full_name: string | null;
    phone: string | null;
  };
  documents: {
    id: string;
    document_type: string;
    file_name: string;
    file_url: string;
  }[];
}

const AgentClients = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState<AssignedClient | null>(null);

  const { data: agent } = useQuery({
    queryKey: ["agent-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agents")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data as Agent;
    },
    enabled: !!user?.id,
  });

  // Get clients assigned by admin via booking_agent_assignments
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["agent-assigned-clients", agent?.id],
    queryFn: async () => {
      // Get assignments for this agent
      const { data: assignments, error: assignError } = await (supabase as any)
        .from("booking_agent_assignments")
        .select("id, booking_id, assigned_at, notes, status")
        .eq("agent_id", agent?.id)
        .order("assigned_at", { ascending: false });

      if (assignError) throw assignError;
      if (!assignments || assignments.length === 0) return [];

      const bookingIds = assignments.map((a: any) => a.booking_id);

      // Get booking details
      const { data: bookings, error: bookError } = await supabase
        .from("bookings")
        .select(`*, tours (title, destination, image, duration_days, duration_nights)`)
        .in("id", bookingIds);

      if (bookError) throw bookError;

      // Get user profiles
      const userIds = [...new Set(bookings?.map(b => b.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Get documents for assigned bookings (only those agent has access to)
      const { data: accessibleDocs } = await (supabase as any)
        .from("document_agent_access")
        .select("document_id")
        .eq("agent_id", agent?.id)
        .is("revoked_at", null);

      const accessibleDocIds = (accessibleDocs || []).map((d: any) => d.document_id);

      let documentsMap = new Map<string, any[]>();
      if (accessibleDocIds.length > 0) {
        const { data: docs } = await (supabase as any)
          .from("booking_documents")
          .select("id, booking_id, document_type, file_name, file_url")
          .in("id", accessibleDocIds)
          .in("booking_id", bookingIds);

        (docs || []).forEach((doc: any) => {
          if (!documentsMap.has(doc.booking_id)) documentsMap.set(doc.booking_id, []);
          documentsMap.get(doc.booking_id)?.push(doc);
        });
      }

      const bookingMap = new Map(bookings?.map(b => [b.id, b]) || []);

      return assignments.map((a: any) => {
        const booking = bookingMap.get(a.booking_id);
        if (!booking) return null;
        return {
          assignmentId: a.id,
          assignedAt: a.assigned_at,
          notes: a.notes,
          booking,
          profile: profileMap.get(booking.user_id) || null,
          documents: documentsMap.get(booking.id) || [],
        } as AssignedClient;
      }).filter(Boolean) as AssignedClient[];
    },
    enabled: !!agent?.id,
  });

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.booking.tours?.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.booking.tours?.destination?.toLowerCase().includes(search.toLowerCase()) ||
      c.profile?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  const statusLabels: Record<string, string> = {
    pending: "Kutilmoqda",
    confirmed: "Tasdiqlangan",
    cancelled: "Bekor qilingan",
  };

  const formatPrice = (price: number) => new Intl.NumberFormat("uz-UZ").format(price) + " so'm";

  const calculateCommission = (totalPrice: number) => {
    const rate = agent?.commission_rate || 10;
    return totalPrice * (rate / 100);
  };

  const handleViewDocument = async (doc: { file_url: string; file_name: string }) => {
    try {
      const { data, error } = await supabase.storage.from("booking-documents").createSignedUrl(doc.file_url, 3600);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    } catch {
      toast.error("Hujjatni ochishda xatolik");
    }
  };

  const exportToCSV = () => {
    if (clients.length === 0) {
      toast.error("Export qilish uchun ma'lumot yo'q");
      return;
    }
    const headers = ["Mijoz", "Tur", "Manzil", "Sayohat sanasi", "Odamlar", "Narx", "Komissiya", "Status", "Tayinlangan sana"];
    const rows = clients.map(c => [
      c.profile?.full_name || "Noma'lum",
      c.booking.tours?.title || "",
      c.booking.tours?.destination || "",
      new Date(c.booking.travel_date).toLocaleDateString("uz-UZ"),
      c.booking.people_count,
      c.booking.total_price,
      calculateCommission(c.booking.total_price),
      statusLabels[c.booking.status] || c.booking.status,
      new Date(c.assignedAt).toLocaleDateString("uz-UZ"),
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `mijozlar_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Fayl yuklandi!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tayinlangan mijozlarim</h1>
          <p className="text-muted-foreground">Admin tomonidan sizga tayinlangan mijozlar</p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          CSV yuklash
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clients.length}</p>
                <p className="text-sm text-muted-foreground">Jami tayinlangan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clients.filter(c => c.booking.status === "confirmed").length}</p>
                <p className="text-sm text-muted-foreground">Tasdiqlangan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950/30">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clients.filter(c => c.booking.status === "pending").length}</p>
                <p className="text-sm text-muted-foreground">Kutilmoqda</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clients.filter(c => c.documents.length > 0).length}</p>
                <p className="text-sm text-muted-foreground">Hujjatli</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">Jami savdo</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                {formatPrice(clients.reduce((sum, c) => sum + c.booking.total_price, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">Jami komissiya</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                {formatPrice(clients.reduce((sum, c) => sum + calculateCommission(c.booking.total_price), 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">O'rtacha buyurtma</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                {clients.length > 0
                  ? formatPrice(clients.reduce((sum, c) => sum + c.booking.total_price, 0) / clients.length)
                  : "0 so'm"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Mijoz, tur yoki manzil bo'yicha qidirish..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="pending">Kutilmoqda</SelectItem>
                <SelectItem value="confirmed">Tasdiqlangan</SelectItem>
                <SelectItem value="cancelled">Bekor qilingan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle>Tayinlangan mijozlar ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClients.length > 0 ? (
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div key={client.assignmentId} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border gap-4">
                  <div className="flex items-center gap-4">
                    <img src={client.booking.tours?.image || "/placeholder.svg"} alt={client.booking.tours?.title || "Tour"} className="w-16 h-16 rounded-lg object-cover" />
                    <div>
                      <p className="font-medium">{client.booking.tours?.title || "Noma'lum tur"}</p>
                      {client.profile?.full_name && (
                        <p className="text-sm text-foreground font-medium">{client.profile.full_name}</p>
                      )}
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{client.booking.tours?.destination}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(client.booking.travel_date).toLocaleDateString("uz-UZ")}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{client.booking.people_count} kishi</span>
                        {client.documents.length > 0 && (
                          <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{client.documents.length} hujjat</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatPrice(client.booking.total_price)}</p>
                      <p className="text-xs text-green-600">Komissiya: {formatPrice(calculateCommission(client.booking.total_price))}</p>
                    </div>
                    <Badge className={statusColors[client.booking.status] || "bg-gray-100"}>{statusLabels[client.booking.status] || client.booking.status}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedClient(client)}><Eye className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Hech qanday tayinlangan mijoz topilmadi</p>
              <p className="text-sm mt-2">Admin sizga mijoz tayinlaganda bu yerda ko'rinadi</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Details Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Mijoz tafsilotlari</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden">
                <img src={selectedClient.booking.tours?.image || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
              </div>

              <div>
                <h3 className="font-semibold text-lg">{selectedClient.booking.tours?.title}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-4 w-4" />{selectedClient.booking.tours?.destination}</p>
              </div>

              {selectedClient.profile && (
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Mijoz</p>
                  <p className="font-medium">{selectedClient.profile.full_name}</p>
                  {selectedClient.profile.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><Phone className="h-3 w-3" />{selectedClient.profile.phone}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Sayohat sanasi</p>
                  <p className="font-medium">{new Date(selectedClient.booking.travel_date).toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Odamlar soni</p>
                  <p className="font-medium">{selectedClient.booking.people_count} kishi</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Davomiylik</p>
                  <p className="font-medium">{selectedClient.booking.tours?.duration_days} kun / {selectedClient.booking.tours?.duration_nights} tun</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedClient.booking.status]}>{statusLabels[selectedClient.booking.status]}</Badge>
                </div>
              </div>

              {/* Documents section */}
              {selectedClient.documents.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium flex items-center gap-2"><FileText className="h-4 w-4" />Hujjatlar ({selectedClient.documents.length})</p>
                  {selectedClient.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{doc.document_type}</p>
                          <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleViewDocument(doc)}>
                        <ExternalLink className="h-4 w-4 mr-1" />Ko'rish
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-green-600">Umumiy narx</p>
                    <p className="text-xl font-bold text-green-800 dark:text-green-200">{formatPrice(selectedClient.booking.total_price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-600">Sizning komissiyangiz</p>
                    <p className="text-xl font-bold text-green-800 dark:text-green-200">{formatPrice(calculateCommission(selectedClient.booking.total_price))}</p>
                  </div>
                </div>
              </div>

              {selectedClient.notes && (
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Admin eslatmasi</p>
                  <p className="text-sm">{selectedClient.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentClients;
