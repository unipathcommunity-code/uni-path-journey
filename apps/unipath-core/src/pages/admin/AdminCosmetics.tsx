import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Scissors,
  Plus, 
  Search, 
  Tag, 
  ShoppingBag, 
  Layers, 
  AlertTriangle,
  Trash2,
  DollarSign
} from 'lucide-react';

interface CosmeticItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  expiry_date: string;
}

interface SaleRecord {
  id: string;
  product_name: string;
  quantity: number;
  total_price: number;
  sale_date: string;
}

export default function AdminCosmetics() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales'>('inventory');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  const [products, setProducts] = useState<CosmeticItem[]>([
    { id: '1', name: 'SPF 50 Sunscreen Cream', brand: 'Missha', category: 'Yuz parvarishi', price: 140000, stock: 45, expiry_date: '2027-04-12' },
    { id: '2', name: 'Hyaluronic Acid Serum', brand: 'The Ordinary', category: 'Zardob', price: 95000, stock: 4, expiry_date: '2026-12-01' },
    { id: '3', name: 'Velvet Lip Tint', brand: 'Romand', category: 'Makiyaj (Lab)', price: 120000, stock: 25, expiry_date: '2027-08-20' },
    { id: '4', name: 'Hydrating Cleanser', brand: 'CeraVe', category: 'Tozalash', price: 175000, stock: 18, expiry_date: '2026-09-15' }
  ]);

  const [sales, setSales] = useState<SaleRecord[]>([
    { id: '1', product_name: 'SPF 50 Sunscreen Cream', quantity: 2, total_price: 280000, sale_date: '2026-05-23' },
    { id: '2', product_name: 'Velvet Lip Tint', quantity: 1, total_price: 120000, sale_date: '2026-05-23' }
  ]);

  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    category: 'Yuz parvarishi',
    price: 100000,
    stock: 20,
    expiry_date: ''
  });

  const [newSale, setNewSale] = useState({
    product_name: 'SPF 50 Sunscreen Cream',
    quantity: 1
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.brand || !newProduct.expiry_date) {
      toast({ title: 'Xatolik', description: 'Iltimos, barcha majburiy maydonlarni kiriting!', variant: 'destructive' });
      return;
    }

    const item: CosmeticItem = {
      id: Math.random().toString(36).substring(2, 9),
      ...newProduct,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock)
    };

    setProducts([item, ...products]);
    setIsProductModalOpen(false);
    setNewProduct({ name: '', brand: '', category: 'Yuz parvarishi', price: 100000, stock: 20, expiry_date: '' });
    toast({ title: 'Muvaffaqiyatli', description: 'Yangi mahsulot omborga qo\'shildi!' });
  };

  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.name === newSale.product_name);
    if (!product) return;

    if (product.stock < newSale.quantity) {
      toast({ title: 'Etarli zaxira yo\'q', description: `Omborda faqat ${product.stock} ta qolgan!`, variant: 'destructive' });
      return;
    }

    // Deduct stock
    setProducts(products.map(p => p.name === newSale.product_name ? { ...p, stock: p.stock - newSale.quantity } : p));

    const total = product.price * newSale.quantity;
    const sale: SaleRecord = {
      id: Math.random().toString(36).substring(2, 9),
      product_name: newSale.product_name,
      quantity: newSale.quantity,
      total_price: total,
      sale_date: new Date().toISOString().split('T')[0]
    };

    setSales([sale, ...sales]);
    setIsSaleModalOpen(false);
    setNewSale({ product_name: products[0]?.name || 'SPF 50 Sunscreen Cream', quantity: 1 });
    toast({ title: 'Muvaffaqiyatli', description: `Sotuv amalga oshirildi! Jami: ${total.toLocaleString()} UZS` });
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast({ title: 'O\'chirildi', description: 'Mahsulot ro\'yxatdan o\'chirildi.' });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSales = sales.filter(s => 
    s.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Scissors className="w-7 h-7 text-pink-400" />
            Kosmetika Do'koni & Ombor Tizimi
          </h1>
          <p className="text-sm text-muted-foreground">
            Mahsulotlar katalogi, brendlar nazorati, yaroqlilik muddati va sotuv hisob-kitoblari
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsProductModalOpen(true)}
            className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl gap-2 font-bold"
          >
            <Plus className="w-5 h-5" />
            Mahsulot Qo'shish
          </Button>
          <Button 
            onClick={() => setIsSaleModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-2 font-bold"
          >
            <ShoppingBag className="w-5 h-5" />
            Yangi Sotuv
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Jami Mahsulotlar</CardTitle>
            <Layers className="w-4 h-4 text-pink-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.reduce((sum, p) => sum + p.stock, 0)} ta
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Sinflangan mahsulotlar: {products.length} xil</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Bugungi Sotuv</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {sales.reduce((sum, s) => sum + s.total_price, 0).toLocaleString()} UZS
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Sotilgan buyumlar: {sales.reduce((sum, s) => sum + s.quantity, 0)} ta</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Kam qolganlar</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {products.filter(p => p.stock < 5).length} xil
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Zaxirada 5 tadan kam qolgan tovarlar</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Yaroqlilik muddati yaqin</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {products.filter(p => new Date(p.expiry_date).getTime() - Date.now() < 3600000 * 24 * 180).length} xil
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Muddati tugashiga 6 oydan kam qolgan</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-px">
        <button
          onClick={() => { setActiveTab('inventory'); setSearchQuery(''); }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'inventory' ? 'border-pink-500 text-pink-400' : 'border-transparent text-muted-foreground'
          }`}
        >
          Do'kon va Ombor Zaxirasi
        </button>
        <button
          onClick={() => { setActiveTab('sales'); setSearchQuery(''); }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'sales' ? 'border-pink-500 text-pink-400' : 'border-transparent text-muted-foreground'
          }`}
        >
          Sotuvlar Tarixi
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Mahsulot nomi yoki brend bo'yicha..."
            className="pl-9 bg-background/50 border-white/10 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table grid */}
      {activeTab === 'inventory' ? (
        <Card className="glass-card border-white/5 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-foreground">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5">
                <tr>
                  <th className="px-6 py-4">Mahsulot nomi va brend</th>
                  <th className="px-6 py-4">Kategoriya</th>
                  <th className="px-6 py-4">Narxi</th>
                  <th className="px-6 py-4 text-center">Qoldiq (Stock)</th>
                  <th className="px-6 py-4">Yaroqlilik Sanasi</th>
                  <th className="px-6 py-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-pink-400">{p.brand}</div>
                    </td>
                    <td className="px-6 py-4">{p.category}</td>
                    <td className="px-6 py-4 font-semibold">{p.price.toLocaleString()} UZS</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        p.stock < 5 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {p.stock} ta
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{p.expiry_date}</td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => handleDeleteProduct(p.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:bg-red-500/10 h-8 p-2 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="glass-card border-white/5 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-foreground">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5">
                <tr>
                  <th className="px-6 py-4">Sotilgan Mahsulot</th>
                  <th className="px-6 py-4 text-center">Soni</th>
                  <th className="px-6 py-4">Sana</th>
                  <th className="px-6 py-4">Umumiy Qiymati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-semibold">{s.product_name}</td>
                    <td className="px-6 py-4 text-center font-medium">{s.quantity} ta</td>
                    <td className="px-6 py-4">{s.sale_date}</td>
                    <td className="px-6 py-4 font-bold text-emerald-400">{s.total_price.toLocaleString()} UZS</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* New Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md glass-card border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-pink-400">
                <Plus className="w-6 h-6" />
                Omborga tovar qo'shish
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prod_name">Mahsulot nomi *</Label>
                  <Input
                    id="prod_name"
                    required
                    placeholder="Masalan: Aloe Vera Soothing Gel"
                    className="bg-background/50 border-white/10 rounded-lg"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prod_brand">Brend / Ishlab chiqaruvchi *</Label>
                    <Input
                      id="prod_brand"
                      required
                      placeholder="Masalan: Innisfree"
                      className="bg-background/50 border-white/10 rounded-lg"
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prod_category">Kategoriya</Label>
                    <select
                      id="prod_category"
                      className="w-full bg-background border border-white/10 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    >
                      <option value="Yuz parvarishi">Yuz parvarishi</option>
                      <option value="Zardob">Zardob (Serum)</option>
                      <option value="Makiyaj (Lab)">Makiyaj (Lab)</option>
                      <option value="Tozalash">Tozalash (Cleanser)</option>
                      <option value="Atir-upa">Atir-upa (Perfume)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prod_price">Narxi (UZS) *</Label>
                    <Input
                      id="prod_price"
                      type="number"
                      required
                      className="bg-background/50 border-white/10 rounded-lg"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prod_stock">Soni (Stock) *</Label>
                    <Input
                      id="prod_stock"
                      type="number"
                      required
                      className="bg-background/50 border-white/10 rounded-lg"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prod_expiry">Yaroqlilik muddati *</Label>
                  <Input
                    id="prod_expiry"
                    type="date"
                    required
                    className="bg-background/50 border-white/10 rounded-lg text-foreground"
                    value={newProduct.expiry_date}
                    onChange={(e) => setNewProduct({ ...newProduct, expiry_date: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsProductModalOpen(false)}>
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white rounded-lg px-6 font-bold">
                    Qo'shish
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Sale Modal */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md glass-card border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-purple-400">
                <ShoppingBag className="w-6 h-6" />
                Sotuv rasmiylashtirish
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSale} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sale_product">Mahsulotni tanlang</Label>
                  <select
                    id="sale_product"
                    className="w-full bg-background border border-white/10 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none"
                    value={newSale.product_name}
                    onChange={(e) => setNewSale({ ...newSale, product_name: e.target.value })}
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.name} disabled={p.stock === 0}>
                        {p.name} (Qoldiq: {p.stock} ta - {p.price.toLocaleString()} UZS)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sale_qty">Sotuv soni (Dona)</Label>
                  <Input
                    id="sale_qty"
                    type="number"
                    min={1}
                    className="bg-background/50 border-white/10 rounded-lg"
                    value={newSale.quantity}
                    onChange={(e) => setNewSale({ ...newSale, quantity: Number(e.target.value) })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsSaleModalOpen(false)}>
                    Bekor qilish
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 font-bold">
                    Sotishni tasdiqlash
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
