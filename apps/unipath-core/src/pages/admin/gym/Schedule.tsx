import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays, Plus, Trash2, Users, Clock, MapPin } from 'lucide-react';
import { GymApi } from './useGym';
import { Modal } from './Modal';
import { GymClass, WEEKDAY_ORDER, WEEKDAY_LABEL, WEEKDAY_SHORT, nextDateForWeekday } from './types';

export default function Schedule({ g }: { g: GymApi }) {
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', trainer_name: '', capacity: '15', weekday: 1, start_time: '18:00', room: '' });
  const [bookFor, setBookFor] = useState<GymClass | null>(null);
  const [memberId, setMemberId] = useState('');
  const [walkName, setWalkName] = useState('');
  const [walkPhone, setWalkPhone] = useState('');

  const submitClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await g.addClass({
      name: form.name.trim(), trainer_name: form.trainer_name.trim() || undefined,
      capacity: parseInt(form.capacity) || 10, weekday: Number(form.weekday),
      start_time: form.start_time, room: form.room.trim() || undefined,
    });
    setForm({ name: '', trainer_name: '', capacity: '15', weekday: 1, start_time: '18:00', room: '' });
    setAddOpen(false);
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookFor) return;
    const date = nextDateForWeekday(bookFor.weekday);
    const id = await g.bookClass({
      class_id: bookFor.id, class_date: date,
      member_id: memberId || null,
      customer_name: memberId ? undefined : (walkName || undefined),
      customer_phone: memberId ? undefined : (walkPhone || undefined),
    });
    if (id) { setBookFor(null); setMemberId(''); setWalkName(''); setWalkPhone(''); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary" /> Haftalik jadval</h2>
          <p className="text-sm text-muted-foreground">Mashg'ulotlar, sig'im va yozilishlar. Mashg'ulotga bosib a'zo yozing.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2 rounded-xl"><Plus className="w-4 h-4" /> Mashg'ulot</Button>
      </div>

      {g.classes.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Hali mashg'ulot yo'q. "Mashg'ulot" tugmasi bilan jadval tuzing.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {WEEKDAY_ORDER.map((wd) => {
            const dayClasses = g.classes.filter(c => c.weekday === wd).sort((a, b) => a.start_time.localeCompare(b.start_time));
            return (
              <div key={wd} className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">{WEEKDAY_SHORT[wd]}</div>
                {dayClasses.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground/50 px-1 py-3 border border-dashed border-border rounded-xl text-center">—</div>
                ) : dayClasses.map((c) => {
                  const date = nextDateForWeekday(c.weekday);
                  const booked = g.bookedCount(c.id, date);
                  const full = booked >= c.capacity;
                  return (
                    <div key={c.id} className={`group p-3 rounded-xl border bg-card ${full ? 'border-rose-500/30' : 'border-border'}`}>
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{c.name}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {c.start_time}{c.trainer_name ? ` · ${c.trainer_name}` : ''}</p>
                          {c.room && <p className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.room}</p>}
                        </div>
                        <button onClick={() => g.deleteClass(c.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 p-1 rounded hover:bg-rose-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-[11px] font-semibold flex items-center gap-1 ${full ? 'text-rose-500' : 'text-emerald-500'}`}><Users className="w-3 h-3" /> {booked}/{c.capacity}</span>
                        <Button size="sm" variant="outline" className="h-7 rounded-lg text-[11px]" disabled={full} onClick={() => setBookFor(c)}>
                          {full ? 'Band' : 'Yozish'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {addOpen && (
        <Modal onClose={() => setAddOpen(false)} title="Yangi mashg'ulot">
          <form onSubmit={submitClass} className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Nomi</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Yoga / CrossFit / Boks" required className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Murabbiy</Label>
                <Input value={form.trainer_name} onChange={e => setForm({ ...form, trainer_name: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Zal / xona</Label>
                <Input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} className="rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Kun</Label>
                <select value={form.weekday} onChange={e => setForm({ ...form, weekday: Number(e.target.value) })} className="w-full h-10 px-2 bg-background border border-border rounded-xl text-sm">
                  {WEEKDAY_ORDER.map(wd => <option key={wd} value={wd}>{WEEKDAY_LABEL[wd]}</option>)}
                </select></div>
              <div className="space-y-1.5"><Label className="text-xs">Vaqt</Label>
                <Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Sig'im</Label>
                <Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className="rounded-xl" /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="rounded-xl">Bekor</Button>
              <Button type="submit" className="rounded-xl font-bold">Saqlash</Button></div>
          </form>
        </Modal>
      )}

      {bookFor && (
        <Modal onClose={() => setBookFor(null)} title={`Yozish — ${bookFor.name} (${nextDateForWeekday(bookFor.weekday)})`}>
          <form onSubmit={submitBooking} className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">A'zo (abonement)</Label>
              <select value={memberId} onChange={e => setMemberId(e.target.value)} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm">
                <option value="">— Mehmon (walk-in) —</option>
                {g.members.map(m => <option key={m.id} value={m.id}>{m.full_name}{m.phone ? ` · ${m.phone}` : ''}</option>)}
              </select></div>
            {!memberId && (
              <div className="grid grid-cols-2 gap-3">
                <Input value={walkName} onChange={e => setWalkName(e.target.value)} placeholder="Mehmon ismi" className="rounded-xl h-10 text-sm" />
                <Input value={walkPhone} onChange={e => setWalkPhone(e.target.value)} placeholder="Telefon" className="rounded-xl h-10 text-sm" />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setBookFor(null)} className="rounded-xl">Bekor</Button>
              <Button type="submit" className="rounded-xl font-bold">Yozish</Button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
