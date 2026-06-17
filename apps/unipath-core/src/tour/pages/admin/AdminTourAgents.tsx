import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Package,
  Plus,
  Trash2,
  Loader2,
  Search,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatPrice } from "@/data/tours";

interface Agent {
  id: string;
  name: string;
  company_name: string;
  commission_rate: number;
}

interface Tour {
  id: string;
  title: string;
  destination: string;
  image: string | null;
  price: number;
}

interface AgentTour {
  id: string;
  agent_id: string;
  tour_id: string;
  special_price: number | null;
  agent?: Agent;
  tour?: Tour;
}

const AdminTourAgents = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedTour, setSelectedTour] = useState("");
  const [specialPrice, setSpecialPrice] = useState("");
  const [searchAgent, setSearchAgent] = useState("");

  // Fetch agents
  const { data: agents = [] } = useQuery({
    queryKey: ["admin-agents-list"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agents")
        .select("id, name, company_name, commission_rate")
        .eq("is_active", true)
        .order("company_name");
      if (error) throw error;
      return data as Agent[];
    },
  });

  // Fetch tours
  const { data: tours = [] } = useQuery({
    queryKey: ["admin-tours-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select("id, title, destination, image, price")
        .eq("status", "approved")
        .order("title");
      if (error) throw error;
      return data as Tour[];
    },
  });

  // Fetch agent-tour assignments
  const { data: agentTours = [], isLoading } = useQuery({
    queryKey: ["admin-agent-tours"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("agent_tours")
        .select(`
          id,
          agent_id,
          tour_id,
          special_price,
          agent:agents(id, name, company_name, commission_rate),
          tour:tours(id, title, destination, image, price)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AgentTour[];
    },
  });

  // Assign tour to agent
  const assignMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from("agent_tours")
        .insert({
          agent_id: selectedAgent,
          tour_id: selectedTour,
          special_price: specialPrice ? parseFloat(specialPrice) : null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agent-tours"] });
      toast.success("Tur agentga tayinlandi");
      setIsDialogOpen(false);
      setSelectedAgent("");
      setSelectedTour("");
      setSpecialPrice("");
    },
    onError: () => {
      toast.error("Tayinlashda xatolik. Balki bu tur allaqachon tayinlangan.");
    },
  });

  // Remove assignment
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("agent_tours")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agent-tours"] });
      toast.success("Tayinlash olib tashlandi");
    },
    onError: () => {
      toast.error("O'chirishda xatolik");
    },
  });

  // Group by agent
  const agentGroups = agentTours.reduce((groups: Record<string, AgentTour[]>, item) => {
    const agentId = item.agent_id;
    if (!groups[agentId]) groups[agentId] = [];
    groups[agentId].push(item);
    return groups;
  }, {});

  const filteredAgents = Object.entries(agentGroups).filter(([agentId, items]) => {
    const agent = items[0]?.agent;
    return agent?.company_name?.toLowerCase().includes(searchAgent.toLowerCase()) ||
           agent?.name?.toLowerCase().includes(searchAgent.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agentlarga tur tayinlash</h1>
          <p className="text-muted-foreground">Qaysi agent qaysi turlarni sotishi mumkinligini belgilang</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tur tayinlash
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agentga tur tayinlash</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Agent</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Agent tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.company_name} ({agent.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tur</Label>
                <Select value={selectedTour} onValueChange={setSelectedTour}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tur tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {tours.map((tour) => (
                      <SelectItem key={tour.id} value={tour.id}>
                        {tour.title} - {formatPrice(tour.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Maxsus narx (ixtiyoriy)</Label>
                <Input
                  type="number"
                  placeholder="Agar agent uchun maxsus narx bo'lsa"
                  value={specialPrice}
                  onChange={(e) => setSpecialPrice(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Bekor qilish
                </Button>
                <Button
                  onClick={() => assignMutation.mutate()}
                  className="flex-1"
                  disabled={!selectedAgent || !selectedTour || assignMutation.isPending}
                >
                  {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Tayinlash
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Agent nomi bo'yicha qidirish..."
              className="pl-10"
              value={searchAgent}
              onChange={(e) => setSearchAgent(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agents.length}</p>
                <p className="text-sm text-muted-foreground">Faol agentlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tours.length}</p>
                <p className="text-sm text-muted-foreground">Mavjud turlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agentTours.length}</p>
                <p className="text-sm text-muted-foreground">Tayinlangan turlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Groups */}
      {filteredAgents.length > 0 ? (
        <div className="space-y-6">
          {filteredAgents.map(([agentId, items]) => {
            const agent = items[0]?.agent;
            return (
              <Card key={agentId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{agent?.company_name}</p>
                        <p className="text-sm text-muted-foreground font-normal">
                          {agent?.name} • Komissiya: {agent?.commission_rate}%
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{items.length} tur</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <img
                          src={item.tour?.image || "/placeholder.svg"}
                          alt=""
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.tour?.title}</p>
                          <p className="text-xs text-muted-foreground">{item.tour?.destination}</p>
                          {item.special_price ? (
                            <p className="text-xs text-green-600 font-medium">
                              Maxsus: {formatPrice(item.special_price)}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {formatPrice(item.tour?.price || 0)}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeMutation.mutate(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Hali turlar tayinlanmagan</p>
            <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Birinchi turni tayinlash
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminTourAgents;
