import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Pill, 
  Plus, 
  Search, 
  Trash2, 
  AlertTriangle, 
  Layers, 
  FolderOpen, 
  Users, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Check, 
  Calendar 
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contact_phone: string | null;
}

interface InventoryItem {
  id: string;
  barcode: string | null;
  name: string;
  sku: string | null;
  stock_qty: number;
  min_qty: number;
  supplier_id: string | null;
  supplier_name?: string;
  expiry_date: string | null;
}

interface Movement {
  id: string;
  item_id: string;
  item_name?: string;
  type: 'in' | 'out' | 'adjustment';
  qty: number;
  note: string | null;
  created_at: string;
}

export default function AdminInventory() {
  const { activeTenant } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Forms
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemBarcode, setNewItemBarcode] = useState('');
  const [newItemSKU, setNewItemSKU] = useState('');
  const [newItemQty, setNewItemQty] = useState('10');
  const [newItemMinQty, setNewItemMinQty] = useState('5');
  const [newItemExpiry, setNewItemExpiry] = useState('');
  const [newItemSupplier, setNewItemSupplier] = useState('');

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedItemForMove, setSelectedItemForMove] = useState<InventoryItem | null>(null);
  const [moveType, setMoveType] = useState<'in' | 'out'>('in');
  const [moveQty, setMoveQty] = useState('5');
  const [moveNote, setMoveNote] = useState('');

  useEffect(() => {
    async function fetchInventoryData() {
      if (!activeTenant) return;
      try {
        setLoading(true);
        // 1. Fetch Suppliers
        const { data: suppliersData } = await supabase
          .from('inventory_suppliers')
          .select('*')
          .order('name', { ascending: true });
        
        setSuppliers(suppliersData || []);

        // 2. Fetch Items
        const { data: itemsData, error: itemsError } = await supabase
          .from('inventory_items')
          .select('*')
          .order('name', { ascending: true });

        if (itemsError) throw itemsError;

        const mappedItems = (itemsData || []).map(i => ({
          ...i,
          supplier_name: suppliersData?.find(s => s.id === i.supplier_id)?.name || 'Belgilanmagan'
        }));
        setItems(mappedItems);

        // 3. Fetch movements
        const { data: movementsData } = await supabase
          .from('inventory_movements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        const mappedMovements = (movementsData || []).map(m => ({
          ...m,
          item_name: mappedItems.find(i => i.id === m.item_id)?.name || 'O\'chirilgan dori'
        }));
        setMovements(mappedMovements);

      } catch (err: any) {
        console.error('Error fetching inventory data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchInventoryData();
  }, [activeTenant]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !activeTenant) return;

    try {
      const { data, error } = await supabase
        .from('inventory_suppliers')
        .insert({
          tenant_id: activeTenant.id,
          name: supplierName,
          contact_phone: supplierPhone || null
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Yetkazib beruvchi qo\'shildi!',
        description: `"${supplierName}" muvaffaqiyatli ro'yxatdan o'tdi.`
      });

      setSuppliers([...suppliers, data]);
      setIsSupplierModalOpen(false);
      setSupplierName('');
      setSupplierPhone('');
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !activeTenant) return;

    try {
      const stock = parseInt(newItemQty);
      const min = parseInt(newItemMinQty);

      const { data: item, error: itemError } = await supabase
        .from('inventory_items')
        .insert({
          tenant_id: activeTenant.id,
          name: newItemName,
          barcode: newItemBarcode || null,
          sku: newItemSKU || null,
          stock_qty: stock,
          min_qty: min,
          expiry_date: newItemExpiry || null,
          supplier_id: newItemSupplier || null
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Log initial inventory movement
      if (stock > 0) {
        await supabase.from('inventory_movements').insert({
          tenant_id: activeTenant.id,
          item_id: item.id,
          type: 'in',
          qty: stock,
          note: 'Dastlabki zaxira yuklanishi'
        });
      }

      toast({
        title: 'Mahsulot qo\'shildi!',
        description: `"${newItemName}" muvaffaqiyatli inventarga qo'shildi.`
      });

      const sName = suppliers.find(s => s.id === newItemSupplier)?.name || 'Belgilanmagan';
      setItems([...items, { ...item, supplier_name: sName }]);
      setIsItemModalOpen(false);
      setNewItemName('');
      setNewItemBarcode('');
      setNewItemSKU('');
      setNewItemQty('10');
      setNewItemMinQty('5');
      setNewItemExpiry('');
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForMove || !activeTenant) return;

    try {
      const qty = parseInt(moveQty);
      const newStock = moveType === 'in' 
        ? selectedItemForMove.stock_qty + qty 
        : selectedItemForMove.stock_qty - qty;

      if (moveType === 'out' && newStock < 0) {
        throw new Error('Chiqim miqdori zaxiradagidan ko\'p bo\'la olmaydi!');
      }

      // 1. Create movement record
      const { data: movement, error: moveError } = await supabase
        .from('inventory_movements')
        .insert({
          tenant_id: activeTenant.id,
          item_id: selectedItemForMove.id,
          type: moveType,
          qty: qty,
          note: moveNote || null
        })
        .select()
        .single();

      if (moveError) throw moveError;

      // 2. Update stock quantity
      await supabase
        .from('inventory_items')
        .update({ stock_qty: newStock })
        .eq('id', selectedItemForMove.id);

      toast({
        title: 'Zaxira o\'zgartirildi!',
        description: `"${selectedItemForMove.name}" uchun zaxira yangilandi.`
      });

      setItems(items.map(i => i.id === selectedItemForMove.id ? { ...i, stock_qty: newStock } : i));
      setMovements([{ ...movement, item_name: selectedItemForMove.name }, ...movements]);
      setIsMovementModalOpen(false);
      setMoveNote('');
    } catch (err: any) {
      toast({
        title: 'Xatolik',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  // Expiry Checker
  const getExpiryAlert = (dateStr: string | null) => {
    if (!dateStr) return null;
    const exp = new Date(dateStr).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return { text: 'Muddati o\'tgan', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    }
    if (diffDays <= 30) {
      return { text: `${diffDays} kun qoldi`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    }
    return null;
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.barcode?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Ombor va inventar yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Pill className="w-7 h-7 text-primary" /> Dorixona va Inventar Boshqaruvi
          </h1>
          <p className="text-muted-foreground text-sm">Barcode, SKU, saqlash muddatlari va zaxira yetishmovchiligi monitoringi.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsSupplierModalOpen(true)} className="rounded-xl border border-border">
            <Users className="w-4 h-4 mr-2" /> Yetkazib beruvchi qo'shish
          </Button>
          <Button onClick={() => setIsItemModalOpen(true)} className="gap-2 rounded-xl">
            <Plus className="w-5 h-5" /> Mahsulot qo'shish
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Jami mahsulotlar</p>
              <p className="text-2xl font-bold text-foreground mt-1">{items.length} turdagi</p>
            </div>
            <Layers className="w-8 h-8 text-primary/20" />
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Kam qolgan dori vositalari</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {items.filter(i => i.stock_qty <= i.min_qty).length} ta
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-500/20" />
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Muddati o'tish arafasida</p>
              <p className="text-2xl font-bold text-rose-400 mt-1">
                {items.filter(i => {
                  if(!i.expiry_date) return false;
                  const days = Math.ceil((new Date(i.expiry_date).getTime() - Date.now()) / 86400000);
                  return days <= 30;
                }).length} ta
              </p>
            </div>
            <Calendar className="w-8 h-8 text-rose-500/20" />
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Yetkazib beruvchilar</p>
              <p className="text-2xl font-bold text-success mt-1">{suppliers.length} ta</p>
            </div>
            <Users className="w-8 h-8 text-success/20" />
          </CardContent>
        </Card>
      </div>

      {/* Main Stock Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Inventory Items List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Ombor inventari</CardTitle>
                <CardDescription>Mavjud barcha dori vositalari, tovarlar va ularning zaxira holati</CardDescription>
              </div>
              
              {/* Search Bar */}
              <div className="relative w-48 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Dori nomi, SKU yoki Barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-lg border-border bg-background"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-muted-foreground text-xs font-semibold">
                      <th className="p-4">Dori / Mahsulot</th>
                      <th className="p-4">SKU / Barcode</th>
                      <th className="p-4">Zaxira (Miqdor)</th>
                      <th className="p-4">Muddati</th>
                      <th className="p-4 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-muted-foreground">Izlash bo'yicha hech narsa topilmadi.</td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const isLow = item.stock_qty <= item.min_qty;
                        const expAlert = getExpiryAlert(item.expiry_date);
                        return (
                          <tr key={item.id} className="hover:bg-muted/10">
                            <td className="p-4">
                              <p className="font-bold text-foreground">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground">Yetkazib beruvchi: {item.supplier_name}</p>
                            </td>
                            <td className="p-4 font-mono text-xs text-muted-foreground">
                              {item.sku || '-'}<br />
                              <span className="text-[10px] text-muted-foreground">{item.barcode || '-'}</span>
                            </td>
                            <td className="p-4">
                              <span className={`font-semibold ${isLow ? 'text-rose-400' : 'text-foreground'}`}>
                                {item.stock_qty} dona
                              </span>
                              {isLow && (
                                <span className="ml-2 text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold uppercase">
                                  Low Stock
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              {item.expiry_date ? (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">{item.expiry_date}</p>
                                  {expAlert && (
                                    <span className={`text-[9px] px-1.5 py-0.5 border rounded font-semibold ${expAlert.color}`}>
                                      {expAlert.text}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="rounded-lg text-xs"
                                onClick={() => {
                                  setSelectedItemForMove(item);
                                  setIsMovementModalOpen(true);
                                }}
                              >
                                Harakat
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Movements History */}
        <div className="space-y-4">
          <Card className="bg-card border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">So'nggi harakatlar logi</CardTitle>
                <CardDescription>Kirim-chiqim operatsiyalari real-time jurnali</CardDescription>
              </div>
              <History className="w-5 h-5 text-muted-foreground/30" />
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">Harakatlar tarixi bo'sh.</div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {movements.map((move) => (
                    <div key={move.id} className="p-3 border border-border bg-muted/10 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{move.item_name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{move.note || 'Tavsif yo\'q'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {move.type === 'in' ? (
                          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg font-bold flex items-center gap-0.5">
                            <ArrowDownLeft className="w-3.5 h-3.5" /> +{move.qty}
                          </span>
                        ) : (
                          <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg font-bold flex items-center gap-0.5">
                            <ArrowUpRight className="w-3.5 h-3.5" /> -{move.qty}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm bg-card border border-border shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Yangi Yetkazib Beruvchi</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSupplier} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sName" className="text-xs">Kompaniya nomi</Label>
                  <Input 
                    id="sName" 
                    placeholder="Masalan: Dori-Darmon OJS" 
                    value={supplierName} 
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="rounded-xl border border-border"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sPhone" className="text-xs">Aloqa telefoni</Label>
                  <Input 
                    id="sPhone" 
                    placeholder="+998 (90) 123-45-67" 
                    value={supplierPhone} 
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    className="rounded-xl border border-border"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsSupplierModalOpen(false)} className="rounded-xl">
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="rounded-xl font-bold">
                    Yetkazuvchini qo'shish
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-card border border-border shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Yangi Mahsulot / Dori Vositasini Qo'shish</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="iName" className="text-xs">Dori yoki Mahsulot Nomi</Label>
                  <Input 
                    id="iName" 
                    placeholder="Masalan: Paratsetamol 500mg" 
                    value={newItemName} 
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="rounded-xl border border-border"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Barcode</Label>
                    <Input 
                      placeholder="87890123901" 
                      value={newItemBarcode} 
                      onChange={(e) => setNewItemBarcode(e.target.value)}
                      className="rounded-xl border border-border"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">SKU</Label>
                    <Input 
                      placeholder="MED-PARA-500" 
                      value={newItemSKU} 
                      onChange={(e) => setNewItemSKU(e.target.value)}
                      className="rounded-xl border border-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Kirim Miqdori</Label>
                    <Input 
                      type="number"
                      value={newItemQty} 
                      onChange={(e) => setNewItemQty(e.target.value)}
                      className="rounded-xl border border-border"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Min. Miqdor (Low Alert)</Label>
                    <Input 
                      type="number"
                      value={newItemMinQty} 
                      onChange={(e) => setNewItemMinQty(e.target.value)}
                      className="rounded-xl border border-border"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="iExpiry" className="text-xs">Yaroqlilik muddati (Expiry Date)</Label>
                  <Input 
                    id="iExpiry" 
                    type="date"
                    value={newItemExpiry} 
                    onChange={(e) => setNewItemExpiry(e.target.value)}
                    className="rounded-xl border border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="iSupplier" className="text-xs">Etkazib beruvchi</Label>
                  <select
                    id="iSupplier"
                    className="w-full h-11 px-3 bg-background border border-border rounded-xl text-sm"
                    value={newItemSupplier}
                    onChange={(e) => setNewItemSupplier(e.target.value)}
                  >
                    <option value="">Tanlang</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsItemModalOpen(false)} className="rounded-xl">
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="rounded-xl font-bold">
                    Mahsulot qo'shish
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Movement (Stock In / Out Adjustment) Modal */}
      {isMovementModalOpen && selectedItemForMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm bg-card border border-border shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Zaxira Harakati — {selectedItemForMove.name}</CardTitle>
              <CardDescription>Joriy zaxira: {selectedItemForMove.stock_qty} dona</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateMovement} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Harakat Turi</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      type="button" 
                      variant={moveType === 'in' ? 'default' : 'outline'}
                      onClick={() => setMoveType('in')}
                      className="rounded-xl"
                    >
                      Kirim (Stock In)
                    </Button>
                    <Button 
                      type="button" 
                      variant={moveType === 'out' ? 'default' : 'outline'}
                      onClick={() => setMoveType('out')}
                      className="rounded-xl"
                    >
                      Chiqim (Stock Out)
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Miqdor (dona)</Label>
                  <Input 
                    type="number"
                    value={moveQty} 
                    onChange={(e) => setMoveQty(e.target.value)}
                    className="rounded-xl border border-border"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Eslatma / Sabab</Label>
                  <Input 
                    placeholder="Masalan: Yetkazilgan dori qabuli" 
                    value={moveNote} 
                    onChange={(e) => setMoveNote(e.target.value)}
                    className="rounded-xl border border-border"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsMovementModalOpen(false)} className="rounded-xl">
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="rounded-xl font-bold">
                    Saqlash
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
