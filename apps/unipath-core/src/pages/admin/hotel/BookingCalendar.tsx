import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { HotelApi } from './useHotel';
import { Modal } from './Modal';
import {
  HotelRoom, HotelBooking, PaymentMethod, PAYMENT_LABEL,
  fmtUZS, todayISO, addDays, nightsBetween, bookingCoversDate, BLOCKING_STATUSES,
} from './types';

const DAYS_SHOWN = 14;
const WEEKDAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

// Main reception screen: date × room availability grid. Click a free cell → booking modal.
export default function BookingCalendar({ h }: { h: HotelApi }) {
  const [startDate, setStartDate] = useState(todayISO());
  const [draft, setDraft] = useState<{ room: HotelRoom; date: string } | null>(null);

  const days = useMemo(() => Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(startDate, i)), [startDate]);

  const bookingAt = (roomId: string, iso: string): HotelBooking | undefined =>
    h.bookings.find(b => b.room_id === roomId && BLOCKING_STATUSES.includes(b.status) && bookingCoversDate(b, iso));

  const cellLabel = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return { day: d, wd: WEEKDAYS[new Date(y, m - 1, d).getDay()] };
  };

  const today = todayISO();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary" /> Bandlik kalendari</CardTitle>
            <CardDescription>Bo'sh katakka bosing — darrov bron yaratasiz. {DAYS_SHOWN} kunlik ko'rinish.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setStartDate(addDays(startDate, -7))}><ChevronLeft className="w-4 h-4" /></Button>
            <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => setStartDate(today)}>Bugun</Button>
            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setStartDate(addDays(startDate, 7))}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {h.rooms.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 text-sm">Hali xonalar qo'shilmagan. "Xonalar" bo'limidan xona qo'shing.</p>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40">
                  <th className="p-2 border border-border text-left font-bold min-w-[90px] sticky left-0 bg-muted/40">Xona</th>
                  {days.map(iso => {
                    const { day, wd } = cellLabel(iso);
                    return (
                      <th key={iso} className={`p-1.5 border border-border text-center min-w-[52px] font-semibold ${iso === today ? 'bg-primary/10 text-primary' : ''}`}>
                        <div>{day}</div>
                        <div className="text-[9px] font-normal opacity-70">{wd}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {h.rooms.map(room => (
                  <tr key={room.id} className="hover:bg-muted/10">
                    <td className="p-2 border border-border font-bold sticky left-0 bg-background">
                      № {room.room_number}
                      <div className="text-[9px] font-normal text-muted-foreground">{fmtUZS(room.price_per_night)}</div>
                    </td>
                    {days.map(iso => {
                      const b = bookingAt(room.id, iso);
                      if (b) {
                        const isStart = b.check_in === iso || iso === days[0];
                        const cls = b.status === 'checked_in'
                          ? 'bg-rose-500/20 text-rose-600'
                          : b.status === 'confirmed' ? 'bg-blue-500/20 text-blue-600' : 'bg-amber-500/20 text-amber-600';
                        return (
                          <td key={iso} className={`border border-border h-11 text-center relative ${cls}`}
                            title={`${b.guest_name || '—'} · ${b.check_in} → ${b.check_out}`}>
                            {isStart && <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-[9px] font-bold truncate px-1">{(b.guest_name || '—').split(' ')[0]}</span>}
                          </td>
                        );
                      }
                      return (
                        <td key={iso} className="border border-border h-11 p-0">
                          <button
                            className="w-full h-full hover:bg-emerald-500/15 transition text-transparent hover:text-emerald-600 text-[10px] font-bold"
                            onClick={() => setDraft({ room, date: iso })}
                            title={`№ ${room.room_number} — ${iso} bo'sh. Bron qilish uchun bosing.`}
                          >+</button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/30 inline-block" /> Kutilmoqda</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500/30 inline-block" /> Tasdiqlangan</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500/30 inline-block" /> Joylashgan (check-in)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-border inline-block" /> Bo'sh</span>
          </div>
        </CardContent>
      </Card>

      {draft && (
        <BookingModal
          h={h}
          room={draft.room}
          initialDate={draft.date}
          onClose={() => setDraft(null)}
        />
      )}
    </div>
  );
}

function BookingModal({ h, room, initialDate, onClose }: { h: HotelApi; room: HotelRoom; initialDate: string; onClose: () => void }) {
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [checkIn, setCheckIn] = useState(initialDate);
  const [checkOut, setCheckOut] = useState(addDays(initialDate, 1));
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [immediateCheckIn, setImmediateCheckIn] = useState(initialDate === todayISO());
  const [saving, setSaving] = useState(false);

  const roomType = room.room_type_id ? h.roomTypes.find(t => t.id === room.room_type_id) : null;
  const pricePerNight = Number(room.price_per_night) || Number(roomType?.base_price) || 0;
  const nights = checkOut > checkIn ? nightsBetween(checkIn, checkOut) : 0;
  const total = nights * pricePerNight;
  const conflict = checkOut > checkIn && h.hasConflict(room.id, checkIn, checkOut);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim() || checkOut <= checkIn || conflict) return;
    setSaving(true);
    const id = await h.createBooking({
      room_id: room.id,
      room_type_id: room.room_type_id,
      guest_name: guestName.trim(),
      guest_phone: guestPhone.trim(),
      check_in: checkIn,
      check_out: checkOut,
      price_per_night: pricePerNight,
      status: immediateCheckIn ? 'checked_in' : 'confirmed',
      payment_method: payment,
      note: note.trim() || undefined,
    });
    setSaving(false);
    if (id) onClose();
  };

  return (
    <Modal onClose={onClose} title={`Bron — Xona № ${room.room_number}`}>
      <form onSubmit={submit} className="space-y-4">
        <div className="p-3 border rounded-xl bg-muted/20 space-y-1 text-xs">
          {roomType && <div className="flex justify-between"><span>Xona turi:</span><span className="font-semibold">{roomType.name}</span></div>}
          <div className="flex justify-between"><span>Bir kecha narxi:</span><span className="font-semibold">{fmtUZS(pricePerNight)}</span></div>
          <div className="flex justify-between"><span>Kechalar:</span><span className="font-semibold">{nights} kecha</span></div>
          <div className="flex justify-between text-sm pt-1 border-t border-border"><span>Jami:</span><span className="font-bold text-primary">{fmtUZS(total)}</span></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label className="text-xs">Kirish sanasi</Label>
            <Input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} required className="rounded-xl" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Chiqish sanasi</Label>
            <Input type="date" value={checkOut} min={addDays(checkIn, 1)} onChange={e => setCheckOut(e.target.value)} required className="rounded-xl" /></div>
        </div>
        {checkOut <= checkIn && <p className="text-xs text-rose-500">Chiqish sanasi kirish sanasidan keyin bo'lishi kerak.</p>}
        {conflict && <p className="text-xs text-rose-500">Bu sanalarda xona allaqachon band. Boshqa sana yoki xona tanlang.</p>}

        <div className="space-y-1.5"><Label className="text-xs">Mehmon ismi</Label>
          <Input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Alisher Navoiy" required className="rounded-xl" /></div>
        <div className="space-y-1.5"><Label className="text-xs">Telefon raqami</Label>
          <Input value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="+998 90 123 45 67" required className="rounded-xl" /></div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label className="text-xs">To'lov turi</Label>
            <select value={payment} onChange={e => setPayment(e.target.value as PaymentMethod)}
              className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm">
              {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map(m => <option key={m} value={m}>{PAYMENT_LABEL[m]}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Izoh (ixtiyoriy)</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="..." className="rounded-xl" /></div>
        </div>

        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" checked={immediateCheckIn} onChange={e => setImmediateCheckIn(e.target.checked)} className="accent-primary" />
          Darhol check-in qilinsin (mehmon hozir keldi)
        </label>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Bekor</Button>
          <Button type="submit" disabled={saving || conflict || checkOut <= checkIn} className="rounded-xl font-bold">
            {saving ? 'Saqlanmoqda...' : immediateCheckIn ? 'Check-in qilish' : 'Bron qilish'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
