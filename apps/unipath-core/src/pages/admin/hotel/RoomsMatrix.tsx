import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BedDouble, Plus, Trash2, Brush, Wrench } from 'lucide-react';
import { HotelApi } from './useHotel';
import { Modal } from './Modal';
import { fmtUZS, roomStatusClass, ROOM_STATUS_LABEL } from './types';

const LEGACY_TYPES = [
  { value: 'single', label: 'Single (1 kishilik)' },
  { value: 'double', label: 'Double (2 kishilik)' },
  { value: 'suite', label: 'Suite (Lyuks)' },
  { value: 'deluxe', label: 'Deluxe (Premium)' },
];

export default function RoomsMatrix({ h }: { h: HotelApi }) {
  const [addOpen, setAddOpen] = useState(false);
  const [num, setNum] = useState('');
  const [floor, setFloor] = useState('1');
  const [price, setPrice] = useState('250000');
  const [typeId, setTypeId] = useState('');       // hotel_room_types id
  const [legacyType, setLegacyType] = useState('single');

  const pickType = (id: string) => {
    setTypeId(id);
    const t = h.roomTypes.find(x => x.id === id);
    if (t && Number(t.base_price) > 0) setPrice(String(t.base_price));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!num.trim()) return;
    const selected = h.roomTypes.find(x => x.id === typeId);
    await h.addRoom({
      room_number: num.trim(),
      room_type_id: selected?.id || null,
      type: selected ? selected.name : legacyType,   // keep legacy column filled
      floor: parseInt(floor) || 1,
      price_per_night: parseFloat(price) || 0,
    });
    setNum(''); setAddOpen(false);
  };

  const activeBookingFor = (roomId: string) =>
    h.bookings.find(b => b.room_id === roomId && b.status === 'checked_in');

  const floors = Array.from(new Set(h.rooms.map(r => r.floor || 1))).sort((a, b) => a - b);
  const grouped = floors.length > 1
    ? floors.map(f => ({ floor: f, list: h.rooms.filter(r => (r.floor || 1) === f) }))
    : [{ floor: 0, list: h.rooms }];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><BedDouble className="w-5 h-5 text-primary" /> Xonalar xaritasi</h2>
          <p className="text-sm text-muted-foreground">Xonalar holati bir qarashda. Tez amallar: tozalash, ta'mir, bo'shatish.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2 rounded-xl"><Plus className="w-4 h-4" /> Xona qo'shish</Button>
      </div>

      {h.rooms.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Hali xonalar qo'shilmagan. "Xona qo'shish" tugmasini bosing.</CardContent></Card>
      ) : grouped.map(group => (
        <Card key={group.floor}>
          {group.floor > 0 && <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{group.floor}-qavat</CardTitle></CardHeader>}
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {group.list.map(room => {
                const booking = activeBookingFor(room.id);
                return (
                  <div key={room.id} className={`group relative p-4 rounded-2xl border text-center transition-all ${roomStatusClass(room.status)}`}>
                    <div className="text-lg font-bold">№ {room.room_number}</div>
                    <div className="text-[10px] uppercase font-semibold opacity-80 mt-0.5 truncate">
                      {h.roomTypes.find(t => t.id === room.room_type_id)?.name || room.type || '—'}
                    </div>
                    <p className="text-xs font-semibold mt-1">{fmtUZS(room.price_per_night)}</p>
                    <div className="text-[10px] mt-1 font-medium">{ROOM_STATUS_LABEL[room.status] || room.status}</div>
                    {booking && <p className="text-[9px] mt-0.5 truncate opacity-80">{booking.guest_name}</p>}

                    <div className="mt-2 flex justify-center gap-1 flex-wrap">
                      {room.status === 'occupied' && booking && (
                        <button onClick={() => h.checkOut(booking.id, room.id)}
                          className="text-[10px] px-2 py-0.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700">Check-out</button>
                      )}
                      {room.status === 'cleaning' && (
                        <button onClick={() => h.setRoomStatus(room.id, 'available')}
                          className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-0.5"><Brush className="w-3 h-3" /> Tayyor</button>
                      )}
                      {room.status === 'available' && (
                        <>
                          <button onClick={() => h.addHousekeepingTask(room.id, 'Rejali tozalash')}
                            className="text-[10px] px-2 py-0.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 flex items-center gap-0.5"><Brush className="w-3 h-3" /> Tozalash</button>
                          <button onClick={() => h.setRoomStatus(room.id, 'maintenance')}
                            className="text-[10px] px-2 py-0.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-0.5"><Wrench className="w-3 h-3" /> Ta'mir</button>
                        </>
                      )}
                      {room.status === 'maintenance' && (
                        <button onClick={() => h.setRoomStatus(room.id, 'available')}
                          className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Tugatildi</button>
                      )}
                    </div>

                    <button title="O'chirish" onClick={() => h.deleteRoom(room.id)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-background/70 hover:bg-background text-rose-500 opacity-0 group-hover:opacity-100 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {addOpen && (
        <Modal onClose={() => setAddOpen(false)} title="Yangi xona qo'shish">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs">Xona raqami</Label>
              <Input value={num} onChange={e => setNum(e.target.value)} placeholder="101" required className="rounded-xl" /></div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Xona turi</Label>
                {h.roomTypes.length > 0 ? (
                  <select value={typeId} onChange={e => pickType(e.target.value)}
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm">
                    <option value="">— Tanlang —</option>
                    {h.roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                ) : (
                  <select value={legacyType} onChange={e => setLegacyType(e.target.value)}
                    className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm">
                    {LEGACY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                )}
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Qavat</Label>
                <Input type="number" value={floor} onChange={e => setFloor(e.target.value)} className="rounded-xl" /></div>
            </div>

            <div className="space-y-1.5"><Label className="text-xs">Bir kechalik narxi (so'm)</Label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} required className="rounded-xl" /></div>

            {h.roomTypes.length === 0 && (
              <p className="text-[11px] text-muted-foreground">Maslahat: "Narxlar" bo'limida xona turlarini yaratsangiz, narx va sig'im avtomatik to'ldiriladi.</p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="rounded-xl">Bekor</Button>
              <Button type="submit" className="rounded-xl font-bold">Saqlash</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
