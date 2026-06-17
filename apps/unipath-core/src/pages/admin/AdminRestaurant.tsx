import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  UtensilsCrossed, 
  Plus, 
  Map, 
  Grid, 
  Check, 
  Clock, 
  User, 
  DollarSign, 
  ChevronRight, 
  Printer, 
  ShoppingBag,
  ListOrdered
} from 'lucide-react';

interface RestaurantTable {
  id: string;
  table_number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  qr_code_url: string | null;
}

interface RestaurantOrder {
  id: string;
  table_id: string | null;
  table_number?: string;
  status: 'pending' | 'kitchen' | 'served' | 'completed' | 'cancelled';
  items: Array<{ dish_name: string; qty: number; price: number }>;
  total_amount: number;
  created_at: string;
}

export default function AdminRestaurant() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);

  // Modals & Forms
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [dishName, setDishName] = useState('');
  const [dishQty, setDishQty] = useState('1');
  const [dishPrice, setDishPrice] = useState('45000');
  const [orderItems, setOrderItems] = useState<Array<{ dish_name: string; qty: number; price: number }>>([]);

  useEffect(() => {
    async function fetchRestaurantData() {
      if (!activeTenant) return;
      try {
        setLoading(true);
        // 1. Fetch tables
        const { data: tablesData, error: tablesError } = await supabase
          .from('restaurant_tables')
          .select('*')
          .order('table_number', { ascending: true });

        if (tablesError) throw tablesError;
        setTables(tablesData || []);

        // 2. Fetch orders
        const { data: ordersData } = await supabase
          .from('restaurant_orders')
          .select('*')
          .order('created_at', { ascending: false });

        const mappedOrders = (ordersData || []).map(o => ({
          ...o,
          table_number: tablesData?.find(t => t.id === o.table_id)?.table_number || 'Olib ketish'
        }));
        setOrders(mappedOrders);

      } catch (err: any) {
        console.error('Error fetching restaurant data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurantData();
  }, [activeTenant]);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum.trim() || !activeTenant) return;

    try {
      const cap = parseInt(newTableCapacity);
      const qrCodeUrl = `https://unipath.me/r/table/${newTableNum}?tenant=${activeTenant.id}`;

      const { data, error } = await supabase
        .from('restaurant_tables')
        .insert({
          tenant_id: activeTenant.id,
          table_number: newTableNum,
          capacity: cap,
          qr_code_url: qrCodeUrl,
          status: 'available'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Stol qo\'shildi!',
        description: `№ ${newTableNum} stoli muvaffaqiyatli ro'yxatdan o'tdi.`
      });

      setTables([...tables, data]);
      setIsTableModalOpen(false);
      setNewTableNum('');
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleAddItemToOrder = () => {
    if (!dishName.trim()) return;
    setOrderItems([...orderItems, {
      dish_name: dishName,
      qty: parseInt(dishQty),
      price: parseFloat(dishPrice)
    }]);
    setDishName('');
    setDishQty('1');
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || orderItems.length === 0 || !activeTenant) return;

    try {
      const totalAmount = orderItems.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);

      const { data: order, error: orderError } = await supabase
        .from('restaurant_orders')
        .insert({
          tenant_id: activeTenant.id,
          table_id: selectedTable.id,
          items: orderItems,
          total_amount: totalAmount,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Update table status to occupied
      await supabase
        .from('restaurant_tables')
        .update({ status: 'occupied' })
        .eq('id', selectedTable.id);

      toast({
        title: 'Buyurtma yuborildi!',
        description: `№ ${selectedTable.table_number}-stol uchun buyurtma oshxonaga yuborildi.`
      });

      setTables(tables.map(t => t.id === selectedTable.id ? { ...t, status: 'occupied' } : t));
      setOrders([{ ...order, table_number: selectedTable.table_number }, ...orders]);
      setIsOrderModalOpen(false);
      setOrderItems([]);
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: 'kitchen' | 'served' | 'completed' | 'cancelled', tableId: string | null) => {
    try {
      await supabase
        .from('restaurant_orders')
        .update({ status })
        .eq('id', orderId);

      // If completed or cancelled, set table status back to available
      if ((status === 'completed' || status === 'cancelled') && tableId) {
        await supabase
          .from('restaurant_tables')
          .update({ status: 'available' })
          .eq('id', tableId);
        
        setTables(tables.map(t => t.id === tableId ? { ...t, status: 'available' } : t));
      }

      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
      toast({
        title: 'Holat yangilandi',
        description: `Buyurtma statusi "${status}" ga o'tkazildi.`
      });
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const getTableBadge = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'occupied':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'reserved':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'kitchen':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'served':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'completed':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default:
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Restoran boshqaruvi yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UtensilsCrossed className="w-7 h-7 text-primary" /> Restoran va Kafe Boshqaruvi
          </h1>
          <p className="text-muted-foreground text-sm">Stollar bandligi, raqamli QR-menyular va oshxona buyurtmalar navbati.</p>
        </div>
        <Button onClick={() => setIsTableModalOpen(true)} className="gap-2 rounded-xl">
          <Plus className="w-5 h-5" /> Yangi Stol Qo'shish
        </Button>
      </div>

      {/* Table Layout Map Grid */}
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle>Zal xaritasi (Restaurant Seating Layout)</CardTitle>
          <CardDescription>Stollar sig'imi va joriy statuslari. Buyurtma olish uchun stol ustiga bosing.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {tables.map((table) => (
              <div
                key={table.id}
                onClick={() => {
                  if (table.status === 'available') {
                    setSelectedTable(table);
                    setIsOrderModalOpen(true);
                  }
                }}
                className={`p-4 border rounded-2xl text-center relative transition-all duration-200 cursor-pointer ${
                  table.status === 'available' ? 'hover:scale-[1.03] hover:shadow-lg' : ''
                } ${getTableBadge(table.status)}`}
              >
                <div className="text-lg font-bold">Stol № {table.table_number}</div>
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-85 mt-1">{table.capacity} kishilik</div>
                
                {table.qr_code_url && (
                  <div className="mt-3 flex justify-center">
                    <span title="Chop etish QR kod">
                      <Printer 
                        onClick={(e) => {
                          e.stopPropagation();
                          toast({
                            title: 'QR Code yuborildi',
                            description: `№ ${table.table_number} stoli uchun QR menyu chop etishga yuborildi.`
                          });
                        }}
                        className="w-4 h-4 text-muted-foreground hover:text-white transition-colors" 
                      />
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Kitchen Order Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kitchen Queue */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Oshxona Buyurtmalar Navbati (Live Kitchen Queue)</CardTitle>
                <CardDescription>Oshxonada tayyorlanayotgan va yangi olingan buyurtmalar nazorati</CardDescription>
              </div>
              <ListOrdered className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">Oshxonada faol buyurtmalar mavjud emas.</div>
              ) : (
                <div className="space-y-4 divide-y divide-border">
                  {orders
                    .filter(o => o.status !== 'completed' && o.status !== 'cancelled')
                    .map((order, idx) => (
                      <div key={order.id} className={`pt-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4 ${idx === 0 ? 'pt-0' : ''}`}>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">Stol № {order.table_number}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${getOrderStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          
                          <div className="space-y-1.5 pl-2 border-l-2 border-primary/20">
                            {order.items.map((it, idx2) => (
                              <p key={idx2} className="text-xs text-muted-foreground">
                                • {it.dish_name} <b className="text-foreground">x {it.qty}</b> ({it.price.toLocaleString()} UZS)
                              </p>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">Umumiy Summa</p>
                            <p className="font-bold text-primary text-sm">{order.total_amount.toLocaleString()} UZS</p>
                          </div>
                          
                          <div className="flex gap-1.5">
                            {order.status === 'pending' && (
                              <Button 
                                size="sm" 
                                className="text-xs rounded-lg"
                                onClick={() => handleUpdateOrderStatus(order.id, 'kitchen', order.table_id)}
                              >
                                Oshxonaga berish
                              </Button>
                            )}
                            {order.status === 'kitchen' && (
                              <Button 
                                size="sm" 
                                className="text-xs rounded-lg"
                                onClick={() => handleUpdateOrderStatus(order.id, 'served', order.table_id)}
                              >
                                Tortiq etildi (Served)
                              </Button>
                            )}
                            {order.status === 'served' && (
                              <Button 
                                size="sm" 
                                className="text-xs rounded-lg"
                                onClick={() => handleUpdateOrderStatus(order.id, 'completed', order.table_id)}
                              >
                                To'landi (Complete)
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Finished / Archived orders */}
        <div className="space-y-4">
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-lg">Yakunlangan buyurtmalar</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.filter(o => o.status === 'completed' || o.status === 'cancelled').length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">Arxivlangan buyurtmalar yo'q.</div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {orders
                    .filter(o => o.status === 'completed' || o.status === 'cancelled')
                    .map((order) => (
                      <div key={order.id} className="p-3 border border-border rounded-xl flex justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-foreground">Stol № {order.table_number}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{order.items.length} xil taom</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{order.total_amount.toLocaleString()} UZS</p>
                          <span className="text-[9px] text-emerald-400 font-semibold uppercase">{order.status}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Table Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm bg-card border border-border shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Yangi Stol Qo'shish</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTable} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="tNum" className="text-xs">Stol Raqami</Label>
                  <Input 
                    id="tNum" 
                    placeholder="Masalan: 8" 
                    value={newTableNum} 
                    onChange={(e) => setNewTableNum(e.target.value)}
                    className="rounded-xl border border-border"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tCap" className="text-xs">O'rindiq soni (Sig'imi)</Label>
                  <Input 
                    id="tCap" 
                    type="number"
                    value={newTableCapacity} 
                    onChange={(e) => setNewTableCapacity(e.target.value)}
                    className="rounded-xl border border-border"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsTableModalOpen(false)} className="rounded-xl">
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="rounded-xl font-bold">
                    Stol yaratish
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Order Modal */}
      {isOrderModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-card border border-border shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Buyurtma Olish — Stol № {selectedTable.table_number}</CardTitle>
              <CardDescription>Taomlarni ro'yxatga qo'shib, keyin buyurtmani oshxonaga yuboring.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOrder} className="space-y-4">
                
                {/* Add dish sub-form */}
                <div className="p-3 bg-muted/40 rounded-xl space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Taom Nomi</Label>
                    <Input 
                      placeholder="Shashlik, Palov, Kola..." 
                      value={dishName} 
                      onChange={(e) => setDishName(e.target.value)}
                      className="rounded-lg h-9 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Soni</Label>
                      <Input 
                        type="number"
                        value={dishQty} 
                        onChange={(e) => setDishQty(e.target.value)}
                        className="rounded-lg h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Narxi (UZS)</Label>
                      <Input 
                        type="number"
                        value={dishPrice} 
                        onChange={(e) => setDishPrice(e.target.value)}
                        className="rounded-lg h-9 text-xs"
                      />
                    </div>
                  </div>

                  <Button type="button" onClick={handleAddItemToOrder} className="w-full h-9 rounded-lg text-xs" variant="secondary">
                    Taomni qo'shish
                  </Button>
                </div>

                {/* Display added items */}
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  <Label className="text-xs">Buyurtma tarkibi</Label>
                  {orderItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg border-border">Hali taomlar qo'shilmadi</p>
                  ) : (
                    <div className="space-y-1.5">
                      {orderItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 bg-muted/20 border border-border rounded-lg">
                          <span>{item.dish_name} <b>x{item.qty}</b></span>
                          <span className="font-semibold">{(item.price * item.qty).toLocaleString()} UZS</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setIsOrderModalOpen(false)} className="rounded-xl">
                    Bekor qilish
                  </Button>
                  <Button type="submit" disabled={orderItems.length === 0} className="rounded-xl font-bold">
                    Buyurtmani Tasdiqlash
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
