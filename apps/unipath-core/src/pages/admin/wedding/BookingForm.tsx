import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/pages/admin/restaurant/TablesMap';
import { WeddingApi } from './useWedding';
import { EventType, EVENT_TYPE_LABEL, fmtUZS } from './types';

/**
 * Shared "new booking" modal — opened from the calendar (with preset date/hall)
 * and from the bookings tab.
 */
export default function BookingForm({ w, presetDate, presetHallId, onClose }: {
  w: WeddingApi;
  presetDate?: string | null;
  presetHallId?: string | null;
  onClose: () => void;
}) {
  const activeHalls = w.halls.filter(h => h.is_active);
  const activePackages = w.packages.filter(p => p.is_active);

  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [eventDate, setEventDate] = useState(presetDate || new Date().toISOString().split('T')[0]);
  const [eventType, setEventType] = useState<EventType>('wedding');
  const [hallId, setHallId] = useState(presetHallId || activeHalls[0]?.id || '');
  const [packageId, setPackageId] = useState('');
  const [guestCount, setGuestCount] = useState('200');
  const [totalPrice, setTotalPrice] = useState('0');
  const [advance, setAdvance] = useState('0');
  const [note, setNote] = useState('');
  const [priceTouched, setPriceTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const hall = activeHalls.find(h => h.id === hallId);
  const pkg = activePackages.find(p => p.id === packageId);

  // Suggested price = hall base price + package price-per-guest × guests
  const suggested = useMemo(() => {
    const guests = parseInt(guestCount) || 0;
    return Number(hall?.base_price || 0) + Number(pkg?.price_per_guest || 0) * guests;
  }, [hall, pkg, guestCount]);

  useEffect(() => {
    if (!priceTouched) setTotalPrice(String(suggested));
  }, [suggested, priceTouched]);

  // Conflict warning: same hall already booked on this date
  const conflict = useMemo(() =>
    !!hallId && w.bookings.some(b =>
      b.hall_id === hallId && b.event_date === eventDate && ['pending', 'confirmed'].includes(b.status)
    ), [w.bookings, hallId, eventDate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !eventDate) return;
    setSaving(true);
    const id = await w.createBooking({
      hall_id: hallId || null,
      package_id: packageId || null,
      client_name: clientName.trim(),
      phone: phone.trim(),
      event_date: eventDate,
      event_type: eventType,
      guest_count: parseInt(guestCount) || 0,
      total_price: parseFloat(totalPrice) || 0,
      advance_payment: parseFloat(advance) || 0,
      note: note.trim() || undefined,
    });
    setSaving(false);
    if (id) onClose();
  };

  return (
    <Modal onClose={onClose} title="Yangi buyurtma qo'shish" wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Mijoz ismi va familiyasi</Label>
            <Input value={clientName} onChange={e => setClientName(e.target.value)}
              placeholder="masalan: Azizbek Karimov" required className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Telefon raqami</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+998 90 999 88 77" className="rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Tadbir sanasi</Label>
            <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tadbir turi</Label>
            <select value={eventType} onChange={e => setEventType(e.target.value as EventType)}
              className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm">
              {(Object.keys(EVENT_TYPE_LABEL) as EventType[]).map(t => (
                <option key={t} value={t}>{EVENT_TYPE_LABEL[t]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Zal</Label>
            <select value={hallId} onChange={e => setHallId(e.target.value)}
              className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm">
              <option value="">— Zal tanlanmagan —</option>
              {activeHalls.map(h => (
                <option key={h.id} value={h.id}>{h.name} ({h.capacity} kishi)</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Paket (ixtiyoriy)</Label>
            <select value={packageId} onChange={e => setPackageId(e.target.value)}
              className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm">
              <option value="">— Paketsiz —</option>
              {activePackages.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({fmtUZS(p.price_per_guest)}/kishi)</option>
              ))}
            </select>
          </div>
        </div>

        {conflict && (
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Diqqat: tanlangan zal bu sanada allaqachon band! Baribir saqlash mumkin.
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Mehmonlar soni</Label>
            <Input type="number" min="0" value={guestCount} onChange={e => setGuestCount(e.target.value)} required className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Jami summa (so'm)</Label>
            <Input type="number" min="0" value={totalPrice}
              onChange={e => { setPriceTouched(true); setTotalPrice(e.target.value); }}
              required className="rounded-xl" />
            {!priceTouched && suggested > 0 && (
              <p className="text-[10px] text-muted-foreground">Avto: zal + paket × mehmonlar</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Zakalat / avans (so'm)</Label>
            <Input type="number" min="0" value={advance} onChange={e => setAdvance(e.target.value)} className="rounded-xl" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Izoh / menyu kelishuvi (ixtiyoriy)</Label>
          <Input value={note} onChange={e => setNote(e.target.value)}
            placeholder="masalan: Go'shtli assorti oshirilsin" className="rounded-xl" />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Bekor qilish</Button>
          <Button type="submit" disabled={saving} className="rounded-xl font-bold bg-pink-600 hover:bg-pink-700 text-white">
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
