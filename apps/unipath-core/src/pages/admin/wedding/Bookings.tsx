import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Trash2, Globe } from 'lucide-react';
import { WeddingApi } from './useWedding';
import BookingForm from './BookingForm';
import { fmtUZS, statusClass, STATUS_LABEL, EVENT_TYPE_LABEL, eventTypeClass } from './types';

export default function Bookings({ w }: { w: WeddingApi }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const q = searchQuery.toLowerCase();
  const filtered = w.bookings.filter(b =>
    b.client_name.toLowerCase().includes(q) ||
    (b.hall_name || '').toLowerCase().includes(q) ||
    (b.phone || '').includes(searchQuery)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold">Mijozlar buyurtma daftari</h2>
          <p className="text-sm text-muted-foreground">Barcha to'ylar, marosimlar va to'lovlar jadvali.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}
          className="rounded-xl gap-2 font-bold bg-pink-600 hover:bg-pink-700 text-white">
          <Plus className="w-4 h-4" /> Yangi buyurtma qo'shish
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Buyurtmalar ro'yxati</CardTitle>
            <CardDescription>{w.bookings.length} ta buyurtma tizimda.</CardDescription>
          </div>
          <div className="relative w-60">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Mijoz ismi, zal, telefon..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} className="pl-8 h-9 text-xs rounded-xl" />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-2xl">
              Buyurtmalar topilmadi.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(b => (
                <div key={b.id}
                  className="py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:bg-muted/10 px-2 rounded-xl transition">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-foreground">{b.client_name}</span>
                      <span className="text-[10px] text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20 font-semibold">
                        {b.hall_name || 'Zal tanlanmagan'}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 font-bold uppercase rounded border ${eventTypeClass(b.event_type)}`}>
                        {EVENT_TYPE_LABEL[b.event_type] || b.event_type}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 font-bold uppercase rounded border ${statusClass(b.status)}`}>
                        {STATUS_LABEL[b.status] || b.status}
                      </span>
                      {b.source === 'online' && (
                        <span className="text-[9px] px-2 py-0.5 font-bold uppercase rounded border bg-blue-500/10 text-blue-500 border-blue-500/20 flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" /> Onlayn
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sana: {b.event_date} | Tel: {b.phone || '—'} | {b.guest_count} kishi
                      {b.package_name ? ` | Paket: ${b.package_name}` : ''}
                      {b.note ? ` | ${b.note}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">To'landi / Jami</p>
                      <p className="font-bold text-sm text-primary">
                        {fmtUZS(b.paid_amount)} / {fmtUZS(b.total_price)}
                      </p>
                      <div className="w-32 bg-muted h-1.5 rounded-full mt-1 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${b.total_price > 0 ? Math.min(100, (b.paid_amount / b.total_price) * 100) : 0}%` }} />
                      </div>
                    </div>

                    <div className="flex gap-1.5 items-center">
                      {b.status === 'pending' && (
                        <Button size="sm" className="text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => w.updateBookingStatus(b.id, 'confirmed')}>
                          Tasdiqlash
                        </Button>
                      )}
                      {b.status === 'confirmed' && (
                        <Button size="sm" className="text-xs rounded-lg"
                          onClick={() => w.updateBookingStatus(b.id, 'completed')}>
                          Yakunlash
                        </Button>
                      )}
                      {['pending', 'confirmed'].includes(b.status) && (
                        <Button size="sm" variant="outline" className="text-xs rounded-lg text-rose-500 border-rose-500/20 hover:bg-rose-500/10"
                          onClick={() => w.updateBookingStatus(b.id, 'cancelled')}>
                          Bekor
                        </Button>
                      )}
                      <button title="O'chirish"
                        onClick={() => { if (window.confirm(`"${b.client_name}" buyurtmasini butunlay o'chirasizmi?`)) w.deleteBooking(b.id); }}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {formOpen && <BookingForm w={w} onClose={() => setFormOpen(false)} />}
    </div>
  );
}
