import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Plus } from 'lucide-react';
import { Modal } from '@/pages/admin/restaurant/TablesMap';
import { WeddingApi } from './useWedding';
import { EventBooking, PaymentMethod, PAYMENT_LABEL, fmtUZS, outstanding } from './types';

export default function Payments({ w }: { w: WeddingApi }) {
  const [payBooking, setPayBooking] = useState<EventBooking | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const debtors = w.bookings
    .filter(b => b.status !== 'cancelled' && outstanding(b) > 0)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const totalDebt = debtors.reduce((s, b) => s + outstanding(b), 0);
  const totalCollected = w.payments.reduce((s, p) => s + Number(p.amount || 0), 0);

  const openPay = (b: EventBooking) => {
    setPayBooking(b);
    setAmount(String(outstanding(b)));
    setMethod('cash');
    setNote('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payBooking) return;
    const sum = parseFloat(amount) || 0;
    if (sum <= 0) return;
    setSaving(true);
    await w.addPayment(payBooking.id, sum, method, note.trim() || undefined);
    setSaving(false);
    setPayBooking(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-pink-500" /> To'lovlar & Qarzdorlik
          </h2>
          <p className="text-sm text-muted-foreground">Bo'lib-bo'lib to'lovlar va qoldiq hisob-kitoblar.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Jami yig'ildi</p>
            <p className="text-lg font-bold text-emerald-500">{fmtUZS(totalCollected)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Jami qoldiq</p>
            <p className="text-lg font-bold text-rose-500">{fmtUZS(totalDebt)}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Outstanding balances */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Qoldiq to'lovlar</CardTitle>
            <CardDescription>Tadbir kunigacha yopilishi lozim bo'lgan qarzlar.</CardDescription>
          </CardHeader>
          <CardContent>
            {debtors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Barcha buyurtmalar to'liq to'langan.
              </p>
            ) : (
              <div className="space-y-2">
                {debtors.map(b => (
                  <div key={b.id} className="p-3 border rounded-xl flex items-center gap-3 hover:bg-muted/10 transition">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{b.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.event_date} · {b.hall_name || '—'} · {b.phone || '—'}
                      </p>
                      <div className="w-full bg-muted h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${b.total_price > 0 ? Math.min(100, (b.paid_amount / b.total_price) * 100) : 0}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{fmtUZS(b.paid_amount)} / {fmtUZS(b.total_price)}</p>
                      <p className="font-bold text-sm text-rose-500">{fmtUZS(outstanding(b))}</p>
                    </div>
                    <Button size="sm" onClick={() => openPay(b)}
                      className="rounded-lg text-xs gap-1 shrink-0 bg-pink-600 hover:bg-pink-700 text-white">
                      <Plus className="w-3.5 h-3.5" /> To'lov
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payments ledger */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">To'lovlar tarixi</CardTitle>
            <CardDescription>Oxirgi qabul qilingan to'lovlar (zakalat va bo'lib to'lashlar).</CardDescription>
          </CardHeader>
          <CardContent>
            {w.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Hali to'lovlar qayd etilmagan.</p>
            ) : (
              <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
                {w.payments.slice(0, 30).map(p => (
                  <div key={p.id} className="py-2.5 flex items-center gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.client_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.paid_at).toLocaleDateString('ru-RU')} · {PAYMENT_LABEL[p.method] || p.method}
                        {p.note ? ` · ${p.note}` : ''}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-500 shrink-0">+{fmtUZS(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add payment modal */}
      {payBooking && (
        <Modal onClose={() => setPayBooking(null)} title={`To'lov qabul qilish — ${payBooking.client_name}`}>
          <form onSubmit={submit} className="space-y-4">
            <div className="p-3 border rounded-xl bg-muted/20 text-xs space-y-0.5">
              <p>Tadbir: <span className="font-semibold">{payBooking.event_date} · {payBooking.hall_name || '—'}</span></p>
              <p>Jami: <span className="font-semibold">{fmtUZS(payBooking.total_price)}</span> · To'landi: <span className="font-semibold text-emerald-500">{fmtUZS(payBooking.paid_amount)}</span></p>
              <p>Qoldiq: <span className="font-bold text-rose-500">{fmtUZS(outstanding(payBooking))}</span></p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To'lov summasi (so'm)</Label>
              <Input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} required className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To'lov usuli</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map(m => (
                  <button key={m} type="button" onClick={() => setMethod(m)}
                    className={`text-xs py-2 rounded-lg border font-semibold transition ${
                      method === m ? 'bg-pink-600 text-white border-pink-600' : 'border-border hover:bg-muted'}`}>
                    {PAYMENT_LABEL[m]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Izoh (ixtiyoriy)</Label>
              <Input value={note} onChange={e => setNote(e.target.value)} placeholder="masalan: 2-bo'lib to'lash" className="rounded-xl" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setPayBooking(null)} className="rounded-xl">Bekor</Button>
              <Button type="submit" disabled={saving} className="rounded-xl font-bold bg-pink-600 hover:bg-pink-700 text-white">
                {saving ? 'Saqlanmoqda...' : 'Qabul qilish'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
