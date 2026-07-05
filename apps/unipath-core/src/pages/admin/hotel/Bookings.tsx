import { useState } from 'react';
import jsPDF from 'jspdf';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Receipt, Globe } from 'lucide-react';
import { HotelApi } from './useHotel';
import {
  HotelBooking, BookingStatus,
  fmtUZS, BOOKING_STATUS_LABEL, bookingStatusClass, PAYMENT_LABEL,
} from './types';

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'Barchasi' },
  { key: 'pending', label: 'Kutilmoqda' },
  { key: 'confirmed', label: 'Tasdiqlangan' },
  { key: 'checked_in', label: 'Joylashgan' },
  { key: 'checked_out', label: 'Chiqqan' },
  { key: 'cancelled', label: 'Bekor' },
];

export default function Bookings({ h }: { h: HotelApi }) {
  const [filter, setFilter] = useState('all');

  const list = h.bookings.filter(b => filter === 'all' || b.status === filter);

  const downloadReceipt = (b: HotelBooking) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('MEHMONXONA KVITANSIYASI', 105, 40, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Kvitansiya ID: ${b.id.slice(0, 8).toUpperCase()}`, 20, 60);
    doc.text(`Mehmon ismi: ${b.guest_name || '-'}`, 20, 70);
    doc.text(`Telefon: ${b.guest_phone || '-'}`, 20, 80);
    doc.text(`Xona raqami: № ${b.room_number || '-'}`, 20, 90);
    doc.text(`Kirish sana: ${b.check_in}`, 20, 100);
    doc.text(`Chiqish sana: ${b.check_out}`, 20, 110);
    doc.text(`Kechalar soni: ${b.nights}`, 20, 120);
    doc.text(`To'lov turi: ${b.payment_method ? PAYMENT_LABEL[b.payment_method] : 'Naqd'}`, 20, 130);
    doc.setFontSize(14);
    doc.text(`Jami summa: ${Math.round(b.total_amount).toLocaleString()} so'm`, 20, 150);
    doc.save(`kvitansiya-${(b.guest_name || 'mehmon').replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" /> Bronlar</h2>
          <p className="text-sm text-muted-foreground">Barcha bronlar: tasdiqlash, check-in, check-out va bekor qilish.</p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                filter === f.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Bronlar topilmadi. Kalendar orqali yangi bron yarating.</p>
          ) : (
            <div className="divide-y divide-border">
              {list.map(b => (
                <div key={b.id} className="py-3.5 flex flex-col md:flex-row justify-between md:items-center gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{b.room_number ? `Xona № ${b.room_number}` : 'Xona biriktirilmagan'} — {b.guest_name || '—'}</span>
                      <span className={`text-[9px] px-2 py-0.5 font-bold uppercase rounded border ${bookingStatusClass(b.status)}`}>
                        {BOOKING_STATUS_LABEL[b.status as BookingStatus] || b.status}
                      </span>
                      {b.source === 'online' && (
                        <span className="text-[9px] px-2 py-0.5 font-bold uppercase rounded border text-violet-500 bg-violet-500/10 border-violet-500/20 flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" /> Onlayn
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tel: {b.guest_phone || '—'} · Kirish: {b.check_in} → Chiqish: {b.check_out} · {b.nights} kecha
                    </p>
                    {b.note && <p className="text-[11px] text-amber-500 italic">Izoh: {b.note}</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <div className="text-right mr-1">
                      <p className="text-[10px] text-muted-foreground">Summa</p>
                      <p className="font-bold text-primary text-sm">{fmtUZS(b.total_amount)}</p>
                    </div>
                    {b.status === 'pending' && (
                      <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => h.confirmBooking(b.id)}>Tasdiqlash</Button>
                    )}
                    {(b.status === 'pending' || b.status === 'confirmed') && b.room_id && (
                      <Button size="sm" className="rounded-lg text-xs" onClick={() => h.checkIn(b.id, b.room_id)}>Check-in</Button>
                    )}
                    {b.status === 'checked_in' && (
                      <Button size="sm" variant="destructive" className="rounded-lg text-xs" onClick={() => h.checkOut(b.id, b.room_id)}>Check-out</Button>
                    )}
                    {(b.status === 'pending' || b.status === 'confirmed' || b.status === 'checked_in') && (
                      <Button size="sm" variant="ghost" className="rounded-lg text-xs text-rose-500 hover:text-rose-600" onClick={() => h.cancelBooking(b.id, b.room_id)}>Bekor</Button>
                    )}
                    <Button variant="outline" size="sm" className="rounded-lg text-xs gap-1" onClick={() => downloadReceipt(b)}>
                      <Receipt className="w-3.5 h-3.5" /> PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
