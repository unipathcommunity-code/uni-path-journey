import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Coins, CheckCircle2, Clock, AlertCircle, Plus, Minus, Edit2, Trash2,
  TrendingUp, Users, DollarSign, Loader2, RefreshCw, Search, Save, Eye,
  Send, Phone, User, MessageCircle, ArrowUpRight, XCircle,
} from 'lucide-react';
import unicoinLogo from '@/assets/unicoin-logo.png';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { UpgradeGate } from '@/components/admin/UpgradeGate';

interface PaymentTx {
  id: string;
  user_id: string;
  unicoin_amount: number;
  uzs_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  confirmed_at: string | null;
  confirmed_by: string | null;
  tariff_id: string | null;
  profile?: { full_name: string | null; email: string | null; phone: string | null; telegram_username: string | null };
}

interface Tariff {
  id: string;
  name: string;
  name_uz: string | null;
  name_ru: string | null;
  price_uzs: number;
  coin_amount: number;
  bonus_coins: number;
  is_active: boolean;
  display_order: number;
  badge: string | null;
}

export default function AdminPayments() {
  const { user } = useAuth();
  const { hasInvoices } = usePlanLimits();
  const [transactions, setTransactions] = useState<PaymentTx[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [activeTenant, setActiveTenant] = useState<any>(() => {
    const saved = localStorage.getItem('active_tenant');
    return saved ? JSON.parse(saved) : null;
  });
  
  const hasUnicoin = activeTenant?.features?.unicoin !== false; // default true if no tenant

  // Manual coins dialog
  const [manualDialog, setManualDialog] = useState(false);
  const [manualUserId, setManualUserId] = useState('');
  const [manualAmount, setManualAmount] = useState(0);
  const [manualDesc, setManualDesc] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  // User search for manual coins
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<Array<{ user_id: string; full_name: string | null; phone: string | null; telegram_username: string | null }>>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Tariff edit dialog
  const [tariffDialog, setTariffDialog] = useState(false);
  const [editTariff, setEditTariff] = useState<Tariff | null>(null);
  const [tariffForm, setTariffForm] = useState({ name: '', name_uz: '', name_ru: '', price_uzs: 0, coin_amount: 0, bonus_coins: 0, badge: '', display_order: 0 });
  const [tariffSaving, setTariffSaving] = useState(false);

  // Detail dialog
  const [detailTx, setDetailTx] = useState<PaymentTx | null>(null);

  // Stats
  const [stats, setStats] = useState({ totalRevenue: 0, totalCoinsSold: 0, pendingCount: 0, confirmedCount: 0, todayRevenue: 0, todayCount: 0 });

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const { data: txData } = await supabase
      .from('payment_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    const txs = (txData || []) as any[];

    // Fetch profiles with telegram
    const userIds = [...new Set(txs.map(t => t.user_id))];
    let profileMap = new Map();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone, telegram_username')
        .in('user_id', userIds);
      profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    }

    const enriched = txs.map(t => ({ ...t, profile: profileMap.get(t.user_id) || null }));
    setTransactions(enriched);

    // Stats
    const confirmed = txs.filter(t => t.status === 'confirmed');
    const pending = txs.filter(t => t.status === 'pending');
    const today = new Date().toISOString().split('T')[0];
    const todayConfirmed = confirmed.filter(t => t.confirmed_at?.startsWith(today) || t.created_at.startsWith(today));

    setStats({
      totalRevenue: confirmed.reduce((s, t) => s + Number(t.uzs_amount), 0),
      totalCoinsSold: confirmed.reduce((s, t) => s + t.unicoin_amount, 0),
      pendingCount: pending.length,
      confirmedCount: confirmed.length,
      todayRevenue: todayConfirmed.reduce((s, t) => s + Number(t.uzs_amount), 0),
      todayCount: todayConfirmed.length,
    });

    const { data: tariffData } = await supabase
      .from('tariffs')
      .select('*')
      .order('display_order');
    setTariffs((tariffData || []) as Tariff[]);

  }, [hasInvoices]);

  useEffect(() => {
    if (hasInvoices) {
      fetchAll();
    } else {
      setLoading(false);
    }
  }, [fetchAll, hasInvoices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasInvoices) {
    return <UpgradeGate requiredPlan="Pro" featureName="Payments & Accountant Panel" />;
  }

  const confirmPayment = async (txId: string) => {
    setConfirming(txId);
    const { data, error } = await supabase.functions.invoke('manage-payments', {
      body: { action: 'confirm_payment', transaction_id: txId },
    });

    if (error || data?.error) {
      toast.error(data?.error || 'Xatolik');
    } else {
      toast.success(`✅ ${data.coins_added} UniCoin qo'shildi!`);
      fetchAll();
    }
    setConfirming(null);
  };

  const rejectPayment = async (txId: string) => {
    setRejecting(txId);
    const { error } = await supabase
      .from('payment_transactions')
      .update({ status: 'rejected' })
      .eq('id', txId);

    if (error) {
      toast.error('Xatolik');
    } else {
      toast.success('To\'lov rad etildi');
      fetchAll();
    }
    setRejecting(null);
  };

  // Search users for manual coin add
  const searchUsers = async () => {
    if (!userSearch.trim()) return;
    setSearchingUsers(true);
    const s = `%${userSearch}%`;
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, phone, telegram_username')
      .or(`full_name.ilike.${s},phone.ilike.${s},telegram_username.ilike.${s},email.ilike.${s}`)
      .limit(10);
    setUserResults((data || []) as any[]);
    setSearchingUsers(false);
  };

  const handleManualCoins = async () => {
    if (!manualUserId || manualAmount === 0) return;
    setManualLoading(true);

    const { data, error } = await supabase.functions.invoke('manage-payments', {
      body: { action: 'manual_add_coins', user_id: manualUserId, amount: manualAmount, description: manualDesc },
    });

    if (error || data?.error) {
      toast.error(data?.error || 'Xatolik');
    } else {
      toast.success(`Yangi balans: ${data.new_balance} UniCoin`);
      setManualDialog(false);
      setManualUserId('');
      setManualAmount(0);
      setManualDesc('');
      setUserSearch('');
      setUserResults([]);
    }
    setManualLoading(false);
  };

  // Tariff CRUD
  const openTariffEdit = (tariff?: Tariff) => {
    if (tariff) {
      setEditTariff(tariff);
      setTariffForm({
        name: tariff.name,
        name_uz: tariff.name_uz || '',
        name_ru: tariff.name_ru || '',
        price_uzs: Number(tariff.price_uzs),
        coin_amount: tariff.coin_amount,
        bonus_coins: tariff.bonus_coins,
        badge: tariff.badge || '',
        display_order: tariff.display_order,
      });
    } else {
      setEditTariff(null);
      setTariffForm({ name: '', name_uz: '', name_ru: '', price_uzs: 0, coin_amount: 0, bonus_coins: 0, badge: '', display_order: tariffs.length + 1 });
    }
    setTariffDialog(true);
  };

  const saveTariff = async () => {
    setTariffSaving(true);
    const payload = {
      name: tariffForm.name,
      name_uz: tariffForm.name_uz || null,
      name_ru: tariffForm.name_ru || null,
      price_uzs: tariffForm.price_uzs,
      coin_amount: tariffForm.coin_amount,
      bonus_coins: tariffForm.bonus_coins,
      badge: tariffForm.badge || null,
      display_order: tariffForm.display_order,
    };

    if (editTariff) {
      await supabase.from('tariffs').update(payload).eq('id', editTariff.id);
      toast.success('Tarif yangilandi');
    } else {
      await supabase.from('tariffs').insert(payload);
      toast.success('Yangi tarif qo\'shildi');
    }
    setTariffDialog(false);
    setTariffSaving(false);
    fetchAll();
  };

  const deleteTariff = async (id: string) => {
    await supabase.from('tariffs').update({ is_active: false }).eq('id', id);
    toast.success('Tarif o\'chirildi');
    fetchAll();
  };

  const filteredTx = transactions.filter(tx => {
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      tx.profile?.full_name?.toLowerCase().includes(s) ||
      tx.profile?.email?.toLowerCase().includes(s) ||
      tx.profile?.phone?.includes(s) ||
      tx.profile?.telegram_username?.toLowerCase().includes(s) ||
      tx.user_id.includes(s)
    );
  });

  if (!hasInvoices) {
    return <UpgradeGate requiredPlan="Pro" featureName="Buxgalteriya & Invoyslar" />;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            {hasUnicoin && <img src={unicoinLogo} alt="" className="w-7 h-7 rounded-full" />}
            To'lovlar boshqaruvi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {hasUnicoin ? "Kim to'ladi, qancha coin berish kerak — hammasi shu yerda" : "Barcha to'lovlar va daromadlar tarixi"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="w-4 h-4 mr-1" /> Yangilash
          </Button>
          {hasUnicoin && (
            <Button size="sm" onClick={() => setManualDialog(true)}>
              <Plus className="w-4 h-4 mr-1" /> UniCoin qo'shish
            </Button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Jami daromad</p>
            <p className="text-lg font-bold text-foreground">{stats.totalRevenue.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">UZS</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Bugun</p>
            <p className="text-lg font-bold text-foreground">{stats.todayRevenue.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">UZS</span></p>
            <p className="text-[10px] text-muted-foreground">{stats.todayCount} ta to'lov</p>
          </CardContent>
        </Card>
        {hasUnicoin && (
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sotilgan coin</p>
              <div className="flex items-center gap-1.5">
                <img src={unicoinLogo} alt="" className="w-4 h-4 rounded-full" />
                <p className="text-lg font-bold text-foreground">{stats.totalCoinsSold.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Tasdiqlangan</p>
            <p className="text-lg font-bold text-primary">{stats.confirmedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Kutilmoqda</p>
            <p className="text-lg font-bold text-amber-600">{stats.pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Jami to'lovlar</p>
            <p className="text-lg font-bold text-foreground">{transactions.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">To'lovlar</TabsTrigger>
          {hasUnicoin && <TabsTrigger value="tariffs">Tariflar</TabsTrigger>}
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="relative flex-1 max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Ism, telefon, telegram bo'yicha qidirish..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hammasi</SelectItem>
                <SelectItem value="pending">Kutilmoqda</SelectItem>
                <SelectItem value="confirmed">Tasdiqlangan</SelectItem>
                <SelectItem value="rejected">Rad etilgan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Foydalanuvchi</TableHead>
                      <TableHead>Aloqa</TableHead>
                      {hasUnicoin && <TableHead>UniCoin</TableHead>}
                      <TableHead>Summa</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead>Sana</TableHead>
                      <TableHead>Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTx.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          To'lovlar topilmadi
                        </TableCell>
                      </TableRow>
                    ) : filteredTx.map(tx => (
                      <TableRow key={tx.id} className={tx.status === 'pending' ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-foreground text-sm">
                              {tx.profile?.full_name || 'Noma\'lum'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {tx.profile?.phone && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {tx.profile.phone}
                              </p>
                            )}
                            {tx.profile?.telegram_username && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                @{tx.profile.telegram_username}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        {hasUnicoin && (
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <img src={unicoinLogo} alt="" className="w-4 h-4 rounded-full" />
                              <span className="font-bold text-foreground">{tx.unicoin_amount}</span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <span className="font-semibold">{Number(tx.uzs_amount).toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-1">UZS</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={tx.status === 'confirmed' ? 'default' : tx.status === 'pending' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {tx.status === 'confirmed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {tx.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {tx.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                            {tx.status === 'confirmed' ? 'Tasdiqlandi' : tx.status === 'pending' ? 'Kutilmoqda' : 'Rad etildi'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleDateString('uz-UZ')}
                          <br />
                          <span className="text-[10px]">{new Date(tx.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1.5">
                            {tx.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-7 text-xs gap-1"
                                  disabled={confirming === tx.id}
                                  onClick={() => confirmPayment(tx.id)}
                                >
                                  {confirming === tx.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <><CheckCircle2 className="w-3 h-3" /> {hasUnicoin ? 'Coin berish' : 'Tasdiqlash'}</>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 text-xs gap-1"
                                  disabled={rejecting === tx.id}
                                  onClick={() => rejectPayment(tx.id)}
                                >
                                  {rejecting === tx.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <XCircle className="w-3 h-3" />
                                  )}
                                </Button>
                              </>
                            )}
                            {tx.status === 'confirmed' && (
                              <span className="text-xs text-primary font-medium">✓ Berildi</span>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => setDetailTx(tx)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tariffs Tab */}
        <TabsContent value="tariffs" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openTariffEdit()}>
              <Plus className="w-4 h-4 mr-1" /> Yangi tarif
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {tariffs.filter(t => t.is_active).map(tariff => (
              <Card key={tariff.id} className="relative">
                {tariff.badge && (
                  <Badge className="absolute -top-2 right-3 bg-primary text-primary-foreground text-[10px]">
                    {tariff.badge}
                  </Badge>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{tariff.name}</CardTitle>
                  <CardDescription>
                    {tariff.name_uz && <span className="block text-xs">🇺🇿 {tariff.name_uz}</span>}
                    {tariff.name_ru && <span className="block text-xs">🇷🇺 {tariff.name_ru}</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Narx:</span>
                    <span className="font-bold">{Number(tariff.price_uzs).toLocaleString()} UZS</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">UniCoin:</span>
                    <span className="font-bold">{tariff.coin_amount}</span>
                  </div>
                  {tariff.bonus_coins > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bonus:</span>
                      <span className="font-bold text-green-600">+{tariff.bonus_coins}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => openTariffEdit(tariff)}>
                      <Edit2 className="w-3 h-3 mr-1" /> Tahrirlash
                    </Button>
                    <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => deleteTariff(tariff.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Transaction detail dialog */}
      <Dialog open={!!detailTx} onOpenChange={(o) => !o && setDetailTx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>To'lov tafsilotlari</DialogTitle>
          </DialogHeader>
          {detailTx && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground text-xs">Foydalanuvchi</p>
                  <p className="font-semibold">{detailTx.profile?.full_name || 'Noma\'lum'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Telefon</p>
                  <p className="font-semibold">{detailTx.profile?.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Telegram</p>
                  <p className="font-semibold">{detailTx.profile?.telegram_username ? `@${detailTx.profile.telegram_username}` : '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">To'lov usuli</p>
                  <p className="font-semibold">{detailTx.payment_method}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Summa</p>
                  <p className="font-bold text-lg">{Number(detailTx.uzs_amount).toLocaleString()} UZS</p>
                </div>
                {hasUnicoin && (
                  <div>
                    <p className="text-muted-foreground text-xs">Beriladigan UniCoin</p>
                    <div className="flex items-center gap-1.5">
                      <img src={unicoinLogo} alt="" className="w-5 h-5 rounded-full" />
                      <p className="font-bold text-lg text-primary">{detailTx.unicoin_amount}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground text-xs">Holat</p>
                  <Badge variant={detailTx.status === 'confirmed' ? 'default' : detailTx.status === 'pending' ? 'secondary' : 'destructive'}>
                    {detailTx.status === 'confirmed' ? 'Tasdiqlandi' : detailTx.status === 'pending' ? 'Kutilmoqda' : 'Rad etildi'}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Yaratilgan</p>
                  <p className="font-medium">{new Date(detailTx.created_at).toLocaleString()}</p>
                </div>
                {detailTx.confirmed_at && (
                  <div>
                    <p className="text-muted-foreground text-xs">Tasdiqlangan</p>
                    <p className="font-medium">{new Date(detailTx.confirmed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
              <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
                ID: {detailTx.id}<br />
                User ID: {detailTx.user_id}
              </div>
              {detailTx.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 gap-1"
                    disabled={confirming === detailTx.id}
                    onClick={() => { confirmPayment(detailTx.id); setDetailTx(null); }}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Tasdiqlash {hasUnicoin ? 'va Coin berish' : ''}
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={rejecting === detailTx.id}
                    onClick={() => { rejectPayment(detailTx.id); setDetailTx(null); }}
                  >
                    <XCircle className="w-4 h-4" /> Rad etish
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual coins dialog - improved with user search */}
      <Dialog open={manualDialog} onOpenChange={setManualDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>UniCoin qo'shish / ayirish</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Foydalanuvchini qidirish</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Ism, telefon, telegram..."
                  onKeyDown={e => e.key === 'Enter' && searchUsers()}
                />
                <Button variant="outline" size="sm" onClick={searchUsers} disabled={searchingUsers}>
                  {searchingUsers ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              {userResults.length > 0 && (
                <div className="mt-2 border border-border rounded-lg max-h-40 overflow-y-auto">
                  {userResults.map(u => (
                    <button
                      key={u.user_id}
                      onClick={() => { setManualUserId(u.user_id); setUserResults([]); setUserSearch(u.full_name || u.phone || ''); }}
                      className={`w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center justify-between ${manualUserId === u.user_id ? 'bg-primary/10' : ''}`}
                    >
                      <div>
                        <p className="font-medium">{u.full_name || 'Noma\'lum'}</p>
                        <p className="text-xs text-muted-foreground">{u.phone} {u.telegram_username ? `• @${u.telegram_username}` : ''}</p>
                      </div>
                      {manualUserId === u.user_id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
              {manualUserId && (
                <p className="text-xs text-primary mt-1">✓ Tanlangan: {manualUserId.slice(0, 8)}...</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Miqdor (manfiy = ayirish)</label>
              <Input type="number" value={manualAmount} onChange={e => setManualAmount(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-sm font-medium">Izoh</label>
              <Textarea value={manualDesc} onChange={e => setManualDesc(e.target.value)} placeholder="Sababi..." />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleManualCoins} disabled={manualLoading || !manualUserId}>
              {manualLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tariff edit dialog */}
      <Dialog open={tariffDialog} onOpenChange={setTariffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTariff ? 'Tarifni tahrirlash' : 'Yangi tarif'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium">Name (EN)</label>
                <Input value={tariffForm.name} onChange={e => setTariffForm({ ...tariffForm, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium">Name (UZ)</label>
                <Input value={tariffForm.name_uz} onChange={e => setTariffForm({ ...tariffForm, name_uz: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium">Name (RU)</label>
                <Input value={tariffForm.name_ru} onChange={e => setTariffForm({ ...tariffForm, name_ru: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium">Narx (UZS)</label>
                <Input type="number" value={tariffForm.price_uzs} onChange={e => setTariffForm({ ...tariffForm, price_uzs: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="text-xs font-medium">UniCoin</label>
                <Input type="number" value={tariffForm.coin_amount} onChange={e => setTariffForm({ ...tariffForm, coin_amount: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="text-xs font-medium">Bonus</label>
                <Input type="number" value={tariffForm.bonus_coins} onChange={e => setTariffForm({ ...tariffForm, bonus_coins: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium">Badge</label>
                <Input value={tariffForm.badge} onChange={e => setTariffForm({ ...tariffForm, badge: e.target.value })} placeholder="ENG QULAY, VIP..." />
              </div>
              <div>
                <label className="text-xs font-medium">Tartib raqami</label>
                <Input type="number" value={tariffForm.display_order} onChange={e => setTariffForm({ ...tariffForm, display_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveTariff} disabled={tariffSaving || !tariffForm.name || !tariffForm.price_uzs}>
              {tariffSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
