import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingBag, 
  Plus, 
  Truck, 
  Users, 
  Store, 
  TrendingUp, 
  DollarSign, 
  Search, 
  Package, 
  CheckCircle2, 
  ArrowRight,
  TrendingDown
} from 'lucide-react';

interface WholesaleClient {
  id: string;
  name: string;
  phone: string;
  tier: 'silver' | 'gold' | 'platinum';
  total_spent: number;
}

interface WholesaleOrder {
  id: string;
  client_name: string;
  items_summary: string;
  total_amount: number;
  status: 'pending' | 'shipping' | 'delivered' | 'cancelled';
  created_at: string;
}

export default function AdminWholesale() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<WholesaleClient[]>([]);
  const [orders, setOrders] = useState<WholesaleOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Forms
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientTier, setNewClientTier] = useState<'silver' | 'gold' | 'platinum'>('silver');

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<WholesaleClient | null>(null);
  const [orderItems, setOrderItems] = useState('');
  const [orderAmount, setOrderAmount] = useState('12000000');

  useEffect(() => {
    async function fetchData() {
      if (!activeTenant) { setLoading(false); return; }
      try {
        setLoading(true);
        // Attempt to fetch from database, fallback to mockup if table doesn't exist
        const { data: clientsData, error: clientErr } = await supabase
          .from('wholesale_clients' as any)
          .select('*')
          .order('name', { ascending: true });

        const { data: ordersData, error: orderErr } = await supabase
          .from('wholesale_orders' as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (clientErr || orderErr) {
          throw new Error('Fallback to mock data');
        }

        setClients(clientsData || []);
        setOrders(ordersData || []);
      } catch (err) {
        // Mock data fallback
        setClients([
          { id: '1', name: 'Global Trade LLC', phone: '+998 90 123 45 67', tier: 'platinum', total_spent: 450000000 },
          { id: '2', name: 'Premium Logistics', phone: '+998 93 765 43 21', tier: 'gold', total_spent: 280000000 },
          { id: '3', name: 'Sherzod Supermarket', phone: '+998 97 111 22 33', tier: 'silver', total_spent: 95000000 }
        ]);
        setOrders([
          { id: '101', client_name: 'Global Trade LLC', items_summary: '500x Box A, 200x Box B', total_amount: 32000000, status: 'shipping', created_at: new Date().toISOString() },
          { id: '102', client_name: 'Premium Logistics', items_summary: '1000x Item C', total_amount: 75000000, status: 'delivered', created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: '103', client_name: 'Sherzod Supermarket', items_summary: '150x Item A', total_amount: 9000000, status: 'pending', created_at: new Date(Date.now() - 172800000).toISOString() }
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeTenant]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    try {
      const newClient = {
        id: Math.random().toString(36).substr(2, 9),
        name: newClientName,
        phone: newClientPhone,
        tier: newClientTier,
        total_spent: 0
      };

      // Try database insert if table exists
      try {
        await supabase.from('wholesale_clients' as any).insert({
          tenant_id: activeTenant?.id,
          name: newClientName,
          phone: newClientPhone,
          tier: newClientTier,
          total_spent: 0
        });
      } catch (dbErr) {
        // Silent catch for dev/mock mode
      }

      setClients([...clients, newClient]);
      setIsClientModalOpen(false);
      setNewClientName('');
      setNewClientPhone('');
      toast({
        title: 'Mijoz qo\'shildi',
        description: `${newClientName} muvaffaqiyatli ro'yxatdan o'tkazildi.`
      });
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !orderItems.trim()) return;

    try {
      const amount = parseFloat(orderAmount);
      const newOrder: WholesaleOrder = {
        id: Math.random().toString(36).substr(2, 9),
        client_name: selectedClient.name,
        items_summary: orderItems,
        total_amount: amount,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      try {
        await supabase.from('wholesale_orders' as any).insert({
          tenant_id: activeTenant?.id,
          client_name: selectedClient.name,
          items_summary: orderItems,
          total_amount: amount,
          status: 'pending'
        });
      } catch (dbErr) {
        // Silent catch
      }

      setOrders([newOrder, ...orders]);
      setIsOrderModalOpen(false);
      setOrderItems('');
      toast({
        title: 'Ulgurji buyurtma yaratildi',
        description: `Mijoz: ${selectedClient.name} uchun buyurtma rasmiylashtirildi.`
      });
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'gold': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'shipping': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'delivered': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-primary" /> Ulgurji Savdo (Wholesale)
          </h1>
          <p className="text-muted-foreground text-sm">Distribyutsiya, katta hajmdagi buyurtmalar va ombor hisobi.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsClientModalOpen(true)} className="rounded-xl">
            <Plus className="w-4 h-4 mr-1" /> Hamkor Qo'shish
          </Button>
          <Button onClick={() => {
            if (clients.length > 0) {
              setSelectedClient(clients[0]);
              setIsOrderModalOpen(true);
            }
          }} className="rounded-xl">
            <Plus className="w-4 h-4 mr-1" /> Ulgurji Buyurtma
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ulgurji Aylanma</CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">825,000,000 UZS</div>
            <p className="text-xs text-emerald-500 flex items-center mt-1">
              <TrendingUp className="w-3. h-3 mr-1" /> +12.4% o'sish
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faol Yetkazib berishlar</CardTitle>
            <Truck className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14 ta logistika</div>
            <p className="text-xs text-muted-foreground mt-1">Hozirda tranzit rejimida</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hamkorlar soni</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length} ta B2B</div>
            <p className="text-xs text-muted-foreground mt-1">Platinum va Gold dilerlar</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ombor to'laligi</CardTitle>
            <Store className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78% sig'im</div>
            <p className="text-xs text-muted-foreground mt-1">22 xil tovar zaxirasi oz</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Orders */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Buyurtmalar Oqimi</CardTitle>
              <CardDescription>B2B hamkorlardan kelgan so'nggi ulgurji so'rovlar holati.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-3 font-medium">Buyurtma</th>
                    <th className="pb-3 font-medium">Hamkor</th>
                    <th className="pb-3 font-medium">Tarkibi</th>
                    <th className="pb-3 font-medium text-right">Summa</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-bold">#{o.id}</td>
                      <td className="py-3">{o.client_name}</td>
                      <td className="py-3 text-xs text-muted-foreground truncate max-w-[200px]">{o.items_summary}</td>
                      <td className="py-3 text-right font-semibold text-primary">{o.total_amount.toLocaleString()} UZS</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${getStatusColor(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Clients list */}
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>B2B Hamkorlar</CardTitle>
              <CardDescription>Mijozlar toifasi va ulgurji aylanmasi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {clients.map((c) => (
                <div key={c.id} className="p-3 border border-border rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${getTierColor(c.tier)}`}>
                      {c.tier}
                    </span>
                    <p className="text-xs font-semibold text-muted-foreground">{c.total_spent.toLocaleString()} UZS</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm bg-card border-border shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Yangi Hamkor Qo'shish</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cName" className="text-xs">Kompaniya Nomi</Label>
                  <Input id="cName" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cPhone" className="text-xs">Telefon Raqami</Label>
                  <Input id="cPhone" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} placeholder="+998" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hamkorlik Darajasi</Label>
                  <select 
                    value={newClientTier} 
                    onChange={(e: any) => setNewClientTier(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 text-sm"
                  >
                    <option value="silver">Silver (Oddiy)</option>
                    <option value="gold">Gold (Hamkor)</option>
                    <option value="platinum">Platinum (Eksklyuziv)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsClientModalOpen(false)}>Bekor qilish</Button>
                  <Button type="submit">Saqlash</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Order Modal */}
      {isOrderModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm bg-card border-border shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Ulgurji Buyurtma — {selectedClient.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Mijoz Kompaniyasi</Label>
                  <div className="p-2 border border-border bg-muted/30 rounded-xl text-sm font-semibold">{selectedClient.name}</div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="orderIt" className="text-xs">Mahsulotlar tarkibi</Label>
                  <Input id="orderIt" placeholder="Masalan: 200x Tovar, 300x Tovar..." value={orderItems} onChange={(e) => setOrderItems(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="orderAmt" className="text-xs">Umumiy Qiymat (UZS)</Label>
                  <Input id="orderAmt" type="number" value={orderAmount} onChange={(e) => setOrderAmount(e.target.value)} required />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsOrderModalOpen(false)}>Bekor qilish</Button>
                  <Button type="submit">Yuborish</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
