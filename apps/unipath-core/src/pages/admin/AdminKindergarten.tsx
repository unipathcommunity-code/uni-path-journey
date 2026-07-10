import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Baby, 
  Plus, 
  Search, 
  Users, 
  Calendar, 
  Phone, 
  CheckSquare, 
  DollarSign,
  Trash2,
  Smile,
  ShieldAlert
} from 'lucide-react';

interface Kid {
  id: string;
  name: string;
  age: number;
  group_name: string;
  parent_name: string;
  parent_phone: string;
  status: 'present' | 'absent' | 'sick';
  payment_status: 'paid' | 'unpaid';
}

export default function AdminKindergarten() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { activeTenant } = useApp();
  const [kids, setKids] = useState<Kid[]>([]);

  useEffect(() => {
    if (!activeTenant?.id) return;
    (async () => {
      const { data } = await (supabase as any).from('kindergarten_kids').select('*').eq('tenant_id', activeTenant.id).order('created_at', { ascending: false });
      setKids((data || []) as Kid[]);
    })();
  }, [activeTenant?.id]);

  const [newKid, setNewKid] = useState({
    name: '',
    age: 5,
    group_name: 'Kamalak (Rainbow)',
    parent_name: '',
    parent_phone: '',
    status: 'present' as Kid['status'],
    payment_status: 'unpaid' as Kid['payment_status']
  });

  const handleAddKid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKid.name || !newKid.parent_name || !newKid.parent_phone) {
      toast({
        title: 'Xatolik',
        description: 'Barcha maydonlarni to\'ldiring!',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data, error } = await (supabase as any).from('kindergarten_kids').insert({
        name: newKid.name, age: Number(newKid.age), group_name: newKid.group_name,
        parent_name: newKid.parent_name, parent_phone: newKid.parent_phone,
        status: newKid.status, payment_status: newKid.payment_status,
      }).select().single();
      if (error) throw error;
      setKids([data as Kid, ...kids]);
      setIsModalOpen(false);
      setNewKid({ name: '', age: 5, group_name: 'Kamalak (Rainbow)', parent_name: '', parent_phone: '', status: 'present', payment_status: 'unpaid' });
      toast({ title: 'Muvaffaqiyatli', description: 'Yangi bola bog\'cha ro\'yxatiga qo\'shildi!' });
    } catch (err: any) {
      toast({ title: 'Xatolik', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    await (supabase as any).from('kindergarten_kids').delete().eq('id', id);
    setKids(kids.filter(k => k.id !== id));
    toast({ title: 'O\'chirildi', description: 'Bola ro\'yxatdan o\'chirildi.' });
  };

  const handleStatusChange = async (id: string, status: Kid['status']) => {
    await (supabase as any).from('kindergarten_kids').update({ status }).eq('id', id);
    setKids(kids.map(k => k.id === id ? { ...k, status } : k));
  };

  const handlePaymentToggle = async (id: string) => {
    const kid = kids.find(k => k.id === id);
    const next = kid?.payment_status === 'paid' ? 'unpaid' : 'paid';
    await (supabase as any).from('kindergarten_kids').update({ payment_status: next }).eq('id', id);
    setKids(kids.map(k => k.id === id ? {
      ...k,
      payment_status: k.payment_status === 'paid' ? 'unpaid' : 'paid'
    } : k));
    toast({
      title: 'To\'lov statusi o\'zgardi',
      description: 'To\'lov holati muvaffaqiyatli tahrirlandi.'
    });
  };

  const filteredKids = kids.filter(k => 
    k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.parent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.group_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = kids.filter(k => k.status === 'present').length;
  const totalKids = kids.length;
  const paidCount = kids.filter(k => k.payment_status === 'paid').length;

  return (
    <div className="p-6 space-y-6 animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Baby className="w-8 h-8 text-amber-500 animate-bounce" />
            Smart Bog'cha & Maktabgacha Ta'lim Boshqaruvi
          </h1>
          <p className="text-sm text-muted-foreground">
            Guruhlar tarkibi, bolalar davomati va ota-onalar bilan aloqa
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-2 font-bold transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Yangi Bola Qo'shish
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Bolalar soni</CardTitle>
            <Users className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalKids} ta</div>
            <p className="text-[10px] text-muted-foreground mt-1">Ro'yxatdan o'tgan jami tarbiyalanuvchilar</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Hozir Kelganlar</CardTitle>
            <Smile className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {presentCount} / {totalKids}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Bugun faol ishtirok etayotganlar</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">To'langanlar (Paid)</CardTitle>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {paidCount} / {totalKids}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Joriy oy uchun to'laganlar</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Kasal/Kelmaganlar</CardTitle>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {kids.filter(k => k.status === 'sick' || k.status === 'absent').length} ta
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Sog'lig'i yoki boshqa sabablar</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ism yoki guruh bo'yicha qidirish..."
              className="pl-9 bg-background/50 border-white/10 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Card className="glass-card border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5">
                <tr>
                  <th className="px-6 py-4">Bola ismi va yoshi</th>
                  <th className="px-6 py-4">Guruh</th>
                  <th className="px-6 py-4">Ota-ona (Telefon)</th>
                  <th className="px-6 py-4 text-center">Bugungi Davomat</th>
                  <th className="px-6 py-4 text-center">Oylik To'lov</th>
                  <th className="px-6 py-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredKids.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                      Bolalar topilmadi.
                    </td>
                  </tr>
                ) : (
                  filteredKids.map((k) => (
                    <tr key={k.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{k.name}</div>
                        <div className="text-xs text-muted-foreground">{k.age} yosh</div>
                      </td>
                      <td className="px-6 py-4 font-medium">{k.group_name}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-xs">{k.parent_name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {k.parent_phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            onClick={() => handleStatusChange(k.id, 'present')}
                            size="sm"
                            variant={k.status === 'present' ? 'default' : 'outline'}
                            className={`h-7 px-2.5 text-xs rounded-lg ${
                              k.status === 'present' ? 'bg-emerald-600 text-white' : 'border-white/10 text-muted-foreground'
                            }`}
                          >
                            Keldi
                          </Button>
                          <Button
                            onClick={() => handleStatusChange(k.id, 'absent')}
                            size="sm"
                            variant={k.status === 'absent' ? 'default' : 'outline'}
                            className={`h-7 px-2.5 text-xs rounded-lg ${
                              k.status === 'absent' ? 'bg-amber-600 text-white' : 'border-white/10 text-muted-foreground'
                            }`}
                          >
                            Kelmadi
                          </Button>
                          <Button
                            onClick={() => handleStatusChange(k.id, 'sick')}
                            size="sm"
                            variant={k.status === 'sick' ? 'default' : 'outline'}
                            className={`h-7 px-2.5 text-xs rounded-lg ${
                              k.status === 'sick' ? 'bg-red-600 text-white' : 'border-white/10 text-muted-foreground'
                            }`}
                          >
                            Kasal
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handlePaymentToggle(k.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer select-none transition-all ${
                            k.payment_status === 'paid' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {k.payment_status === 'paid' ? 'To\'langan' : 'Qarzdor'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={() => handleDelete(k.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-500/10 h-8 p-2 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* New Pupil Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md glass-card border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Baby className="w-6 h-6 text-amber-500" />
                Bog'chaga yangi bola ro'yxatdan o'tkazish
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddKid} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kid_name">Bolaning ismi va familiyasi *</Label>
                  <Input
                    id="kid_name"
                    required
                    placeholder="Masalan: Sardorbek Sobirov"
                    className="bg-background/50 border-white/10 rounded-lg"
                    value={newKid.name}
                    onChange={(e) => setNewKid({ ...newKid, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kid_age">Yoshi *</Label>
                    <Input
                      id="kid_age"
                      type="number"
                      required
                      min={1}
                      max={7}
                      className="bg-background/50 border-white/10 rounded-lg"
                      value={newKid.age}
                      onChange={(e) => setNewKid({ ...newKid, age: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kid_group">Guruh nomi</Label>
                    <select
                      id="kid_group"
                      className="w-full bg-background border border-white/10 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      value={newKid.group_name}
                      onChange={(e) => setNewKid({ ...newKid, group_name: e.target.value })}
                    >
                      <option value="Kamalak (Rainbow)">Kamalak (Rainbow)</option>
                      <option value="Quyoshcha (Sun)">Quyoshcha (Sun)</option>
                      <option value="Yulduzcha (Star)">Yulduzcha (Star)</option>
                      <option value="Kichkintoylar">Kichkintoylar (Toddlers)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent_name">Ota-onasining to'liq ismi (F.I.SH) *</Label>
                  <Input
                    id="parent_name"
                    required
                    placeholder="Masalan: Jasur Sobirov"
                    className="bg-background/50 border-white/10 rounded-lg"
                    value={newKid.parent_name}
                    onChange={(e) => setNewKid({ ...newKid, parent_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parent_phone">Ota-ona telefon raqami *</Label>
                    <Input
                      id="parent_phone"
                      required
                      placeholder="+998 90 123 45 67"
                      className="bg-background/50 border-white/10 rounded-lg"
                      value={newKid.parent_phone}
                      onChange={(e) => setNewKid({ ...newKid, parent_phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_status">To'lov statusi</Label>
                    <select
                      id="payment_status"
                      className="w-full bg-background border border-white/10 rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none"
                      value={newKid.payment_status}
                      onChange={(e) => setNewKid({ ...newKid, payment_status: e.target.value as Kid['payment_status'] })}
                    >
                      <option value="unpaid">Qarzdor (Unpaid)</option>
                      <option value="paid">To'langan (Paid)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg"
                  >
                    Bekor qilish
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-6 font-bold"
                  >
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
