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
  Plus,
  DollarSign,
  Trash2
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

  // Tannarx kalkulyatori uchun statelar
  const [calcSelectedItemId, setCalcSelectedItemId] = useState<string>('');
  const [calcIngredients, setCalcIngredients] = useState<{ id: string; name: string; qty: number; unit: string; price: number }[]>([
    { id: '1', name: "Go'sht (Mol go'shti)", qty: 0.2, unit: 'kg', price: 90000 },
    { id: '2', name: 'Guruch', qty: 0.15, unit: 'kg', price: 20000 },
    { id: '3', name: "O'simlik yog'i", qty: 0.05, unit: 'litr', price: 18000 },
    { id: '4', name: 'Sabzi', qty: 0.2, unit: 'kg', price: 5000 },
  ]);
  const [newIngName, setNewIngName] = useState('');
  const [newIngQty, setNewIngQty] = useState('');
  const [newIngUnit, setNewIngUnit] = useState('kg');
  const [newIngPrice, setNewIngPrice] = useState('');

  const selectedItemForCalc = r.items.find(it => it.id === calcSelectedItemId);
  const totalIngredientCost = calcIngredients.reduce((sum, ing) => sum + (ing.qty * ing.price), 0);
  const salePrice = selectedItemForCalc ? selectedItemForCalc.price : 45000;
  const foodCostPercent = salePrice > 0 ? (totalIngredientCost / salePrice) * 100 : 0;
  const netMargin = salePrice - totalIngredientCost;
  const netMarginPercent = salePrice > 0 ? (netMargin / salePrice) * 100 : 0;

  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName || !newIngQty || !newIngPrice) return;
    setCalcIngredients(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        name: newIngName,
        qty: Number(newIngQty),
        unit: newIngUnit,
        price: Number(newIngPrice)
      }
    ]);
    setNewIngName('');
    setNewIngQty('');
    setNewIngPrice('');
  };

  const handleDeleteIngredient = (id: string) => {
    setCalcIngredients(prev => prev.filter(ing => ing.id !== id));
  };

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
        <TabsList className="grid w-full grid-cols-5 lg:w-fit rounded-xl bg-muted p-1">
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
          <TabsTrigger value="cost-calculator" className="rounded-lg gap-2 text-xs font-semibold">
            <DollarSign className="w-4 h-4" /> Tannarx Kalkulyatori
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

        {/* Tab 5: Tannarx Kalkulyatori */}
        <TabsContent value="cost-calculator">
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" /> Taomlar Tannarxi & Foyda Kalkulyatori
              </h3>
              <p className="text-sm text-muted-foreground">Taomlarning ingrediyentlar bo'yicha tannarxini hisoblash va foyda marjasini tahlil qilish paneli.</p>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="pt-5 space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Sotish narxi</span>
                  <p className="text-xl font-bold text-foreground">{fmtUZS(salePrice)}</p>
                  <span className="text-[10px] text-muted-foreground block">
                    {selectedItemForCalc ? selectedItemForCalc.name : "Standart namuna narxi"}
                  </span>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="pt-5 space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Ingrediyentlar tannarxi</span>
                  <p className="text-xl font-bold text-foreground text-rose-500">{fmtUZS(totalIngredientCost)}</p>
                  <span className="text-[10px] text-muted-foreground block">Jami mahsulotlar yig'indisi</span>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="pt-5 space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Food Cost ulushi</span>
                  <p className={`text-xl font-bold ${foodCostPercent > 40 ? 'text-rose-500' : foodCostPercent > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {foodCostPercent.toFixed(1)}%
                  </p>
                  <span className={`text-[10px] font-bold block ${foodCostPercent > 35 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {foodCostPercent > 35 ? "⚠️ Yuqori (Meyor: 25-35%)" : "✓ Optimal me'yorda"}
                  </span>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="pt-5 space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Sof foyda marjasi</span>
                  <p className="text-xl font-bold text-emerald-500">{fmtUZS(netMargin)}</p>
                  <span className="text-[10px] text-muted-foreground block">Yalpi foyda: {netMarginPercent.toFixed(1)}%</span>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left side: Ingredients List & Form */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Resept tarkibi & Ingrediyentlar</CardTitle>
                    <CardDescription>Ushbu taomni tayyorlash uchun ketadigan ingrediyentlar sarfi va ularning sotib olish narxi.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b border-border/60 text-muted-foreground text-xs font-semibold uppercase">
                            <th className="py-2">Masalliq</th>
                            <th className="py-2 text-right">Miqdor</th>
                            <th className="py-2 text-right">Birlik narxi</th>
                            <th className="py-2 text-right">Jami tannarx</th>
                            <th className="py-2 text-right w-12">O'chirish</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {calcIngredients.map(ing => (
                            <tr key={ing.id} className="hover:bg-muted/10">
                              <td className="py-2.5 font-medium">{ing.name}</td>
                              <td className="py-2.5 text-right">{ing.qty} {ing.unit}</td>
                              <td className="py-2.5 text-right">{fmtUZS(ing.price)}</td>
                              <td className="py-2.5 text-right font-semibold text-foreground">{fmtUZS(ing.qty * ing.price)}</td>
                              <td className="py-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteIngredient(ing.id)}
                                  className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Inline Form to Add Ingredient */}
                    <form onSubmit={handleAddIngredient} className="pt-3 border-t border-border/40 grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Masalliq nomi</Label>
                        <Input
                          placeholder="Masalan: Go'sht"
                          value={newIngName}
                          onChange={e => setNewIngName(e.target.value)}
                          className="h-8 rounded-lg text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Birlik</Label>
                        <select
                          value={newIngUnit}
                          onChange={e => setNewIngUnit(e.target.value)}
                          className="w-full h-8 rounded-lg text-xs bg-background border border-input px-2"
                        >
                          <option value="kg">kilogram (kg)</option>
                          <option value="g">gram (g)</option>
                          <option value="litr">litr (l)</option>
                          <option value="dona">dona (pcs)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Miqdor / Narx</Label>
                        <div className="flex gap-1.5">
                          <Input
                            type="number"
                            step="any"
                            placeholder="Miqdori"
                            value={newIngQty}
                            onChange={e => setNewIngQty(e.target.value)}
                            className="h-8 rounded-lg text-xs w-1/2"
                            required
                          />
                          <Input
                            type="number"
                            placeholder="Birlik narxi (so'm)"
                            value={newIngPrice}
                            onChange={e => setNewIngPrice(e.target.value)}
                            className="h-8 rounded-lg text-xs w-1/2"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex items-end">
                        <Button type="submit" size="sm" className="w-full h-8 rounded-lg text-xs font-semibold">
                          Qo'shish
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Right side: Dish Selector & Business Advice */}
              <div className="space-y-4">
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Menyudan taomni tanlang</CardTitle>
                    <CardDescription>Kalkulyatorni menyudagi real taom narxiga bog'lash.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Taomlar ro'yxati</Label>
                      {r.items.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Menyuda taomlar mavjud emas.</p>
                      ) : (
                        <select
                          value={calcSelectedItemId}
                          onChange={e => setCalcSelectedItemId(e.target.value)}
                          className="w-full h-9 rounded-xl text-xs bg-background border border-input px-3"
                        >
                          <option value="">-- Standart namuna narxi (45,000 so'm) --</option>
                          {r.items.map(it => (
                            <option key={it.id} value={it.id}>
                              {it.name} ({fmtUZS(it.price)})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="p-4 border border-border/80 rounded-xl bg-muted/20 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Tahlil & Tavsiyalar</h4>
                      
                      {foodCostPercent > 40 ? (
                        <div className="space-y-1">
                          <p className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                            ⚠️ Tannarx yuqori
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Ushbu taomning food cost ko'rsatkichi 40% dan yuqori. Jami foyda marjasi juda past. 
                            <strong> Tavsiya</strong>: Sotish narxini oshiring yoki ingrediyent miqdorini/narxini kamaytiring.
                          </p>
                        </div>
                      ) : foodCostPercent > 35 ? (
                        <div className="space-y-1">
                          <p className="text-xs text-amber-400 font-semibold">
                            💡 Narxni ko'rib chiqing
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Food cost 35% atrofida. Restoraningiz rentabelligi uchun bu chegara hisoblanadi. 
                            Mahsulot yetkazib beruvchilar bilan narxni arzonlashtirish bo'yicha muzokara olib borish foydali bo'lishi mumkin.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs text-emerald-400 font-semibold">
                            ✓ Zo'r ko'rsatkich
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Ushbu taom juda yuqori rentabellikka ega (Food Cost {foodCostPercent.toFixed(1)}%). 
                            Bu taomni restoranda asosiy reklama taomi sifatida ko'proq targ'ib qilishingiz mumkin.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
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
