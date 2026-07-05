import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag, Plus, Trash2, CalendarRange, Users } from 'lucide-react';
import { HotelApi } from './useHotel';
import { Modal } from './Modal';
import { fmtUZS, todayISO, addDays } from './types';

export default function RatePlans({ h }: { h: HotelApi }) {
  const [typeOpen, setTypeOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);

  // Room type form
  const [tName, setTName] = useState('');
  const [tPrice, setTPrice] = useState('250000');
  const [tCap, setTCap] = useState('2');
  const [tAmenities, setTAmenities] = useState('');
  const [tDesc, setTDesc] = useState('');

  // Rate plan form
  const [pTypeId, setPTypeId] = useState('');
  const [pName, setPName] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pStart, setPStart] = useState(todayISO());
  const [pEnd, setPEnd] = useState(addDays(todayISO(), 30));

  const submitType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim()) return;
    await h.addRoomType({
      name: tName.trim(),
      base_price: parseFloat(tPrice) || 0,
      capacity: parseInt(tCap) || 2,
      amenities: tAmenities.split(',').map(s => s.trim()).filter(Boolean),
      description: tDesc.trim() || undefined,
    });
    setTName(''); setTAmenities(''); setTDesc(''); setTypeOpen(false);
  };

  const submitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTypeId || !pName.trim()) return;
    await h.addRatePlan({
      room_type_id: pTypeId,
      name: pName.trim(),
      price: parseFloat(pPrice) || 0,
      start_date: pStart,
      end_date: pEnd,
    });
    setPName(''); setPPrice(''); setPlanOpen(false);
  };

  const typeName = (id: string | null) => h.roomTypes.find(t => t.id === id)?.name || '—';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Tag className="w-5 h-5 text-primary" /> Xona turlari & Narxlar</h2>
          <p className="text-sm text-muted-foreground">Xona turlarini yarating va mavsumiy narx rejalarini belgilang.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTypeOpen(true)} className="gap-2 rounded-xl"><Plus className="w-4 h-4" /> Xona turi</Button>
          <Button onClick={() => setPlanOpen(true)} disabled={h.roomTypes.length === 0} className="gap-2 rounded-xl"><Plus className="w-4 h-4" /> Narx rejasi</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Room types */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Xona turlari</CardTitle>
            <CardDescription>Standart, Deluxe, Suite... — asosiy narx va sig'im.</CardDescription>
          </CardHeader>
          <CardContent>
            {h.roomTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Hali xona turlari yaratilmagan.</p>
            ) : (
              <div className="space-y-2">
                {h.roomTypes.map(t => (
                  <div key={t.id} className={`p-3 rounded-xl border border-border space-y-1 group ${!t.is_active ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm">{t.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary text-sm">{fmtUZS(t.base_price)}</span>
                        <button onClick={() => h.updateRoomType(t.id, { is_active: !t.is_active })}
                          className="text-[10px] px-2 py-0.5 rounded-lg border border-border hover:bg-muted">
                          {t.is_active ? 'Faol' : 'Nofaol'}
                        </button>
                        <button title="O'chirish" onClick={() => h.deleteRoomType(t.id)}
                          className="p-1 rounded-md hover:bg-muted text-rose-500 opacity-0 group-hover:opacity-100 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {t.capacity} kishilik</span>
                      <span>{h.rooms.filter(r => r.room_type_id === t.id).length} ta xona</span>
                    </div>
                    {t.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {t.amenities.map((a, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">{a}</span>
                        ))}
                      </div>
                    )}
                    {t.description && <p className="text-[11px] text-muted-foreground">{t.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rate plans */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><CalendarRange className="w-4 h-4 text-primary" /> Mavsumiy narx rejalari</CardTitle>
            <CardDescription>Ma'lum davr uchun maxsus narx (yozgi mavsum, bayramlar...).</CardDescription>
          </CardHeader>
          <CardContent>
            {h.ratePlans.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Hali narx rejalari yo'q. Asosiy narx amal qiladi.</p>
            ) : (
              <div className="space-y-2">
                {h.ratePlans.map(p => (
                  <div key={p.id} className={`p-3 rounded-xl border border-border group ${!p.is_active ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{typeName(p.room_type_id)} · {p.start_date || '—'} → {p.end_date || '—'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-primary text-sm">{fmtUZS(p.price)}</span>
                        <button onClick={() => h.updateRatePlan(p.id, { is_active: !p.is_active })}
                          className="text-[10px] px-2 py-0.5 rounded-lg border border-border hover:bg-muted">
                          {p.is_active ? 'Faol' : 'Nofaol'}
                        </button>
                        <button title="O'chirish" onClick={() => h.deleteRatePlan(p.id)}
                          className="p-1 rounded-md hover:bg-muted text-rose-500 opacity-0 group-hover:opacity-100 transition">
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
      </div>

      {typeOpen && (
        <Modal onClose={() => setTypeOpen(false)} title="Yangi xona turi">
          <form onSubmit={submitType} className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs">Nomi</Label>
              <Input value={tName} onChange={e => setTName(e.target.value)} placeholder="Deluxe" required className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Asosiy narx (1 kecha)</Label>
                <Input type="number" value={tPrice} onChange={e => setTPrice(e.target.value)} required className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Sig'imi (kishi)</Label>
                <Input type="number" value={tCap} onChange={e => setTCap(e.target.value)} className="rounded-xl" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Qulayliklar (vergul bilan)</Label>
              <Input value={tAmenities} onChange={e => setTAmenities(e.target.value)} placeholder="Wi-Fi, Konditsioner, TV" className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Tavsif (ixtiyoriy)</Label>
              <Input value={tDesc} onChange={e => setTDesc(e.target.value)} placeholder="Shahar manzarali keng xona" className="rounded-xl" /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setTypeOpen(false)} className="rounded-xl">Bekor</Button>
              <Button type="submit" className="rounded-xl font-bold">Saqlash</Button>
            </div>
          </form>
        </Modal>
      )}

      {planOpen && (
        <Modal onClose={() => setPlanOpen(false)} title="Yangi narx rejasi">
          <form onSubmit={submitPlan} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Xona turi</Label>
              <select value={pTypeId} onChange={e => setPTypeId(e.target.value)} required
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm">
                <option value="">— Tanlang —</option>
                {h.roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Reja nomi</Label>
              <Input value={pName} onChange={e => setPName(e.target.value)} placeholder="Yozgi mavsum" required className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Narx (1 kecha)</Label>
              <Input type="number" value={pPrice} onChange={e => setPPrice(e.target.value)} required className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Boshlanish</Label>
                <Input type="date" value={pStart} onChange={e => setPStart(e.target.value)} required className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Tugash</Label>
                <Input type="date" value={pEnd} min={pStart} onChange={e => setPEnd(e.target.value)} required className="rounded-xl" /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setPlanOpen(false)} className="rounded-xl">Bekor</Button>
              <Button type="submit" className="rounded-xl font-bold">Saqlash</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
