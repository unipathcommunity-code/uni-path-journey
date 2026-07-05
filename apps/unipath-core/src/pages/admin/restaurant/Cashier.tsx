import { useState } from 'react';
import jsPDF from 'jspdf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { Wallet, Printer, Receipt } from 'lucide-react';
import { Modal } from './TablesMap';
import { RestaurantApi } from './useRestaurant';
import { RestaurantOrder, PaymentMethod, PAYMENT_LABEL, fmtUZS, ORDER_TYPE_LABEL } from './types';

export default function Cashier({ r }: { r: RestaurantApi }) {
  const { activeTenant } = useApp();
  const [payOrder, setPayOrder] = useState<RestaurantOrder | null>(null);

  const open = r.orders.filter(o => ['new', 'kitchen', 'served'].includes(o.status));
  const paidToday = r.orders.filter(o => o.status === 'paid');
  const byMethod = (['cash', 'card', 'click', 'payme'] as PaymentMethod[])
    .map(m => ({ m, sum: paidToday.filter(o => o.payment_method === m).reduce((s, o) => s + o.total, 0) }))
    .filter(x => x.sum > 0);
  const cashTotal = paidToday.reduce((s, o) => s + o.total, 0);

  const printReceipt = (o: RestaurantOrder) => {
    const doc = new jsPDF({ unit: 'mm', format: [80, 200] });
    let y = 10;
    doc.setFontSize(13); doc.text(activeTenant?.name || 'Restoran', 40, y, { align: 'center' }); y += 6;
    doc.setFontSize(8);
    doc.text(o.table_number ? `Stol № ${o.table_number}` : ORDER_TYPE_LABEL[o.order_type], 40, y, { align: 'center' }); y += 4;
    doc.text(new Date(o.created_at).toLocaleString('ru-RU'), 40, y, { align: 'center' }); y += 5;
    doc.line(5, y, 75, y); y += 5;
    o.order_items.forEach(it => {
      doc.text(`${it.qty}x ${it.name}`.slice(0, 32), 5, y);
      doc.text(fmtUZS(it.price * it.qty).replace(" so'm", ''), 75, y, { align: 'right' }); y += 4;
    });
    doc.line(5, y, 75, y); y += 5;
    if (o.discount) { doc.text('Chegirma', 5, y); doc.text(`-${fmtUZS(o.discount).replace(" so'm", '')}`, 75, y, { align: 'right' }); y += 4; }
    if (o.service_fee) { doc.text('Xizmat haqi', 5, y); doc.text(`+${fmtUZS(o.service_fee).replace(" so'm", '')}`, 75, y, { align: 'right' }); y += 4; }
    doc.setFontSize(11); doc.text('JAMI', 5, y); doc.text(fmtUZS(o.total), 75, y, { align: 'right' }); y += 7;
    doc.setFontSize(8); doc.text('Tashrifingiz uchun rahmat!', 40, y, { align: 'center' });
    doc.save(`chek-${o.id.slice(0, 6)}.pdf`);
  };

  const doPay = async (method: PaymentMethod) => {
    if (!payOrder) return;
    await r.payOrder(payOrder.id, method, { tableId: payOrder.table_id });
    printReceipt({ ...payOrder, status: 'paid', payment_method: method });
    setPayOrder(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <StatCard label="Bugungi tushum" value={fmtUZS(cashTotal)} icon={<Wallet className="w-5 h-5" />} accent="text-emerald-500" />
        <StatCard label="Ochiq cheklar" value={`${open.length} ta`} icon={<Receipt className="w-5 h-5" />} accent="text-amber-500" />
        <StatCard label="Yopilgan cheklar" value={`${paidToday.length} ta`} icon={<Printer className="w-5 h-5" />} accent="text-primary" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Ochiq cheklar (to'lov kutilmoqda)</CardTitle></CardHeader>
            <CardContent>
              {open.length === 0 ? <p className="text-center text-muted-foreground py-8">Ochiq chek yo'q.</p> : (
                <div className="divide-y divide-border">
                  {open.map(o => (
                    <div key={o.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{o.table_number ? `Stol № ${o.table_number}` : ORDER_TYPE_LABEL[o.order_type]}
                          {o.customer_name && <span className="text-muted-foreground font-normal"> · {o.customer_name}</span>}</p>
                        <p className="text-xs text-muted-foreground">{o.order_items.length} taom · {new Date(o.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-primary">{fmtUZS(o.total)}</span>
                        <Button size="sm" className="rounded-lg" onClick={() => setPayOrder(o)}>To'lov</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Kunlik hisobot (Z)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {byMethod.length === 0 ? <p className="text-sm text-muted-foreground py-4">Bugun to'lov bo'lmadi.</p> : byMethod.map(x => (
              <div key={x.m} className="flex justify-between text-sm"><span className="text-muted-foreground">{PAYMENT_LABEL[x.m]}</span><span className="font-semibold">{fmtUZS(x.sum)}</span></div>
            ))}
            <div className="flex justify-between pt-2 border-t border-border font-bold"><span>Jami</span><span className="text-emerald-500">{fmtUZS(cashTotal)}</span></div>
          </CardContent>
        </Card>
      </div>

      {payOrder && (
        <Modal onClose={() => setPayOrder(null)} title={`To'lov — ${fmtUZS(payOrder.total)}`}>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">To'lov usulini tanlang. Chek avtomatik chop etiladi.</p>
            <div className="grid grid-cols-2 gap-2">
              {(['cash', 'card', 'click', 'payme'] as PaymentMethod[]).map(m => (
                <Button key={m} variant="outline" className="rounded-xl h-14 font-semibold" onClick={() => doPay(m)}>{PAYMENT_LABEL[m]}</Button>
              ))}
            </div>
            <Button variant="ghost" className="w-full" onClick={() => { printReceipt(payOrder); }}>Chekni oldindan chop etish</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent: string }) {
  return (
    <Card><CardContent className="p-5 flex items-center justify-between">
      <div><p className="text-xs text-muted-foreground">{label}</p><p className={`text-xl font-bold mt-1 ${accent}`}>{value}</p></div>
      <div className={accent}>{icon}</div>
    </CardContent></Card>
  );
}
