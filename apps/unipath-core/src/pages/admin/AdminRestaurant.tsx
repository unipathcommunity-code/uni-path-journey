import { useState } from 'react';
import { useRestaurant } from './restaurant/useRestaurant';
import TablesMap from './restaurant/TablesMap';
import PosOrder from './restaurant/PosOrder';
import MenuManager from './restaurant/MenuManager';
import { 
  fmtUZS, 
  orderStatusClass, 
  ORDER_STATUS_LABEL, 
  ORDER_TYPE_LABEL, 
  PAYMENT_LABEL,
  RestaurantTable,
  OrderStatus,
  PaymentMethod
} from './restaurant/types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Modal } from './restaurant/TablesMap';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import { 
  UtensilsCrossed, 
  LayoutGrid, 
  ChefHat, 
  BookOpen, 
  History, 
  Printer, 
  Check, 
  X,
  CreditCard,
  Plus
} from 'lucide-react';

export default function AdminRestaurant() {
  const r = useRestaurant();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [posTable, setPosTable] = useState<RestaurantTable | null>(null);
  const [payModalOrder, setPayModalOrder] = useState<any | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [discountVal, setDiscountVal] = useState('');
  const [serviceFeeVal, setServiceFeeVal] = useState('');

  const onTakeOrder = (table: RestaurantTable) => {
    setPosTable(table);
    setActiveTab('pos');
  };

  const handlePayOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalOrder) return;
    
    await r.payOrder(payModalOrder.id, payMethod, {
      discount: Number(discountVal) || 0,
      service_fee: Number(serviceFeeVal) || 0,
      tableId: payModalOrder.table_id
    });
    
    setPayModalOrder(null);
    setDiscountVal('');
    setServiceFeeVal('');
  };

  if (r.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mr-2" />
        <span className="text-muted-foreground text-sm font-medium">Restoran yuklanmoqda...</span>
      </div>
    );
  }

  // Active preparation tickets for KDS
  const kdsOrders = r.orders.filter(o => o.status === 'new' || o.status === 'kitchen' || o.status === 'served');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UtensilsCrossed className="w-7 h-7 text-primary" /> Restoran & Kafe Boshqaruvi
          </h1>
          <p className="text-muted-foreground text-sm">Zal xaritasi, buyurtmalar POS paneli, oshxona KDS va to'lov kvitansiyalari.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-fit rounded-xl bg-muted p-1">
          <TabsTrigger value="overview" className="rounded-lg gap-2 text-xs font-semibold">
            <LayoutGrid className="w-4 h-4" /> Stollar & POS
          </TabsTrigger>
          <TabsTrigger value="pos" className="rounded-lg gap-2 text-xs font-semibold">
            <Plus className="w-4 h-4" /> Yangi Buyurtma
          </TabsTrigger>
          <TabsTrigger value="kds" className="rounded-lg gap-2 text-xs font-semibold relative">
            <ChefHat className="w-4 h-4" /> Oshxona (KDS)
            {kdsOrders.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold bg-rose-500 text-white rounded-full">
                {kdsOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="menu" className="rounded-lg gap-2 text-xs font-semibold">
            <BookOpen className="w-4 h-4" /> Menyu
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview (Tables Map) */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-6">
            <TablesMap r={r} onTakeOrder={onTakeOrder} />
            
            {/* Active tables billing widget */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">Faol stollar va cheklar</CardTitle>
                <CardDescription>Joriy xizmat ko'rsatilayotgan stollar cheklarini to'lash yoki bekor qilish paneli.</CardDescription>
              </CardHeader>
              <CardContent>
                {r.orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled').length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Faol hisoblar yo'q.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {r.orders
                      .filter(o => o.status !== 'paid' && o.status !== 'cancelled')
                      .map(order => (
                        <div key={order.id} className="p-4 border rounded-xl space-y-3 bg-muted/20">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-sm">
                                {order.table_id ? `Stol № ${order.table_number}` : `Olib ketish (${order.customer_name || 'Mijoz'})`}
                              </p>
                              <span className={`inline-block text-[9px] px-2 py-0.5 mt-1 font-bold uppercase rounded border ${orderStatusClass(order.status)}`}>
                                {ORDER_STATUS_LABEL[order.status]}
                              </span>
                            </div>
                            <p className="font-bold text-sm text-primary">{fmtUZS(order.total)}</p>
                          </div>
                          
                          <div className="text-[11px] text-muted-foreground space-y-1">
                            {order.order_items.map((oi, i) => (
                              <p key={oi.id}>• {oi.name} x{oi.qty}</p>
                            ))}
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button 
                              onClick={() => {
                                setPayModalOrder(order);
                                setDiscountVal(String(order.discount || ''));
                                setServiceFeeVal(String(order.service_fee || ''));
                              }} 
                              size="sm" 
                              className="flex-1 text-xs gap-1 rounded-lg"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> To'lash
                            </Button>
                            <Button 
                              onClick={() => {
                                if (confirm("Buyurtma bekor qilinsinmi?")) {
                                  r.setOrderStatus(order.id, 'cancelled', order.table_id);
                                }
                              }} 
                              variant="outline" 
                              size="sm" 
                              className="text-xs text-rose-500 hover:text-rose-500 rounded-lg"
                            >
                              Bekor qilish
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: POS Order pad */}
        <TabsContent value="pos">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Yangi Buyurtma Olish</h3>
              {posTable && (
                <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-bold">
                  Stol № {posTable.table_number} tanlangan
                </span>
              )}
            </div>
            <PosOrder r={r} presetTable={posTable} onDone={() => {
              setPosTable(null);
              setActiveTab('overview');
            }} />
          </div>
        </TabsContent>

        {/* Tab 3: Kitchen display board */}
        <TabsContent value="kds">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-lg">Kitchen Display System (KDS)</h3>
              <p className="text-sm text-muted-foreground">Tayyorlanayotgan taomlar buyurtmalar navbati.</p>
            </div>
            {kdsOrders.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">Oshxonada faol buyurtmalar mavjud emas.</CardContent></Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kdsOrders.map(order => (
                  <Card key={order.id} className="border-border">
                    <CardHeader className="pb-3 border-b border-border bg-muted/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-sm font-bold">
                            {order.table_id ? `Stol № ${order.table_number}` : `Yetkazish (${order.customer_name || 'Mijoz'})`}
                          </CardTitle>
                          <span className="text-[10px] text-muted-foreground mt-0.5 block">
                            {new Date(order.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} ({ORDER_TYPE_LABEL[order.order_type]})
                          </span>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 font-bold uppercase rounded border ${orderStatusClass(order.status)}`}>
                          {ORDER_STATUS_LABEL[order.status]}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      <div className="space-y-2">
                        {order.order_items.map(oi => (
                          <div key={oi.id} className="flex justify-between items-center text-sm border-b border-border/40 pb-1.5">
                            <div>
                              <p className="font-medium text-foreground">{oi.name}</p>
                              {oi.note && <p className="text-[10px] text-rose-400 italic">Izoh: {oi.note}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-muted-foreground">x{oi.qty}</span>
                              {oi.status !== 'ready' ? (
                                <Button 
                                  onClick={() => r.setItemStatus(oi.id, 'ready')}
                                  size="sm" 
                                  className="h-7 px-2 text-[10px] rounded bg-blue-600 hover:bg-blue-700"
                                >
                                  Tayyor
                                </Button>
                              ) : (
                                <span className="text-xs text-emerald-400 font-bold flex items-center gap-0.5">
                                  ✓ Tayyor
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        {order.status === 'new' && (
                          <Button 
                            onClick={() => r.setOrderStatus(order.id, 'kitchen')}
                            className="w-full text-xs rounded-xl"
                          >
                            Tayyorlashni boshlash
                          </Button>
                        )}
                        {order.status === 'kitchen' && (
                          <Button 
                            onClick={() => r.setOrderStatus(order.id, 'served')}
                            className="w-full text-xs rounded-xl"
                            variant="secondary"
                          >
                            Mijozga tarqatildi (Served)
                          </Button>
                        )}
                        {order.status === 'served' && (
                          <Button 
                            onClick={() => {
                              setPayModalOrder(order);
                              setDiscountVal(String(order.discount || ''));
                              setServiceFeeVal(String(order.service_fee || ''));
                            }} 
                            className="w-full text-xs rounded-xl"
                          >
                            To'lovga o'tish
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 4: Menu manager */}
        <TabsContent value="menu">
          <MenuManager r={r} />
        </TabsContent>
      </Tabs>

      {/* Payment and bill calculation dialog */}
      {payModalOrder && (
        <Modal onClose={() => setPayModalOrder(null)} title="To'lovni rasmiylashtirish">
          <form onSubmit={handlePayOrder} className="space-y-4">
            <div className="p-3 border rounded-xl bg-muted/20 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Stol/Buyurtma:</span>
                <span className="font-bold">
                  {payModalOrder.table_id ? `Stol № ${payModalOrder.table_number}` : 'Olib ketish'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Summa (Taomlar):</span>
                <span className="font-bold">{fmtUZS(payModalOrder.subtotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Xizmat haqi (so'm)</Label>
                <Input type="number" value={serviceFeeVal} onChange={e => setServiceFeeVal(e.target.value)} className="rounded-xl h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Chegirma (so'm)</Label>
                <Input type="number" value={discountVal} onChange={e => setDiscountVal(e.target.value)} className="rounded-xl h-9" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">To'lov turi</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['cash', 'card', 'click', 'payme'] as PaymentMethod[]).map(m => (
                  <button type="button" key={m} onClick={() => setPayMethod(m)}
                    className={`text-xs py-2 rounded-lg border font-medium ${payMethod === m ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>
                    {PAYMENT_LABEL[m]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center py-3 border-t border-border">
              <span className="text-sm font-semibold">Yakuniy to'lov</span>
              <span className="text-xl font-bold text-primary">
                {fmtUZS(Math.max(0, payModalOrder.subtotal + (Number(serviceFeeVal) || 0) - (Number(discountVal) || 0)))}
              </span>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPayModalOrder(null)} className="rounded-xl">Bekor qilish</Button>
              <Button type="submit" className="rounded-xl font-bold">To'lovni tasdiqlash</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
