import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brush, Plus, Trash2, Play, Check } from 'lucide-react';
import { HotelApi } from './useHotel';
import { Modal } from './Modal';
import { HousekeepingStatus, HK_STATUS_LABEL, hkStatusClass } from './types';

const COLUMNS: { key: HousekeepingStatus; label: string }[] = [
  { key: 'pending', label: 'Kutilmoqda' },
  { key: 'in_progress', label: 'Jarayonda' },
  { key: 'done', label: 'Bajarildi' },
];

export default function Housekeeping({ h }: { h: HotelApi }) {
  const [addOpen, setAddOpen] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [note, setNote] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;
    setSaving(true);
    await h.addHousekeepingTask(roomId, note.trim() || undefined, assignedTo.trim() || undefined);
    setSaving(false);
    setRoomId(''); setNote(''); setAssignedTo('');
    setAddOpen(false);
  };

  const fmtTime = (iso: string) => {
    try { return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Brush className="w-5 h-5 text-primary" /> Tozalash xizmati</h2>
          <p className="text-sm text-muted-foreground">Xonalarni tozalash vazifalari doskasi. Check-out'dan keyin vazifa avtomatik yaratiladi.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2 rounded-xl"><Plus className="w-4 h-4" /> Vazifa qo'shish</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const tasks = h.housekeeping.filter(t => t.status === col.key);
          return (
            <Card key={col.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-lg border text-xs font-bold ${hkStatusClass(col.key)}`}>{col.label}</span>
                  <span className="text-muted-foreground text-xs">{tasks.length} ta</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 min-h-[120px]">
                {tasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8 border border-dashed border-border rounded-xl">Vazifa yo'q</p>
                ) : tasks.map(t => (
                  <div key={t.id} className="p-3 rounded-xl border border-border bg-muted/20 space-y-1.5 group">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">Xona № {t.room_number || '—'}</span>
                      <button title="O'chirish" onClick={() => h.deleteHousekeepingTask(t.id)}
                        className="p-1 rounded-md hover:bg-muted text-rose-500 opacity-0 group-hover:opacity-100 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {t.note && <p className="text-xs text-muted-foreground">{t.note}</p>}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{t.assigned_to ? `Mas'ul: ${t.assigned_to}` : ''}</span>
                      <span>{fmtTime(t.created_at)}</span>
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      {t.status === 'pending' && (
                        <Button size="sm" className="rounded-lg text-xs h-7 gap-1 flex-1" onClick={() => h.setHousekeepingStatus(t.id, 'in_progress')}>
                          <Play className="w-3 h-3" /> Boshlash
                        </Button>
                      )}
                      {t.status === 'in_progress' && (
                        <Button size="sm" className="rounded-lg text-xs h-7 gap-1 flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => h.setHousekeepingStatus(t.id, 'done')}>
                          <Check className="w-3 h-3" /> Bajarildi
                        </Button>
                      )}
                      {t.status === 'done' && (
                        <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1"><Check className="w-3 h-3" /> {HK_STATUS_LABEL.done} — xona tayyor</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {addOpen && (
        <Modal onClose={() => setAddOpen(false)} title="Tozalash vazifasi qo'shish">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Xona</Label>
              <select value={roomId} onChange={e => setRoomId(e.target.value)} required
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm">
                <option value="">— Xonani tanlang —</option>
                {h.rooms.map(r => <option key={r.id} value={r.id}>№ {r.room_number}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Izoh (ixtiyoriy)</Label>
              <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Choyshablarni almashtirish..." className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Mas'ul xodim (ixtiyoriy)</Label>
              <Input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} placeholder="Gulnora opa" className="rounded-xl" /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="rounded-xl">Bekor</Button>
              <Button type="submit" disabled={saving || !roomId} className="rounded-xl font-bold">{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
