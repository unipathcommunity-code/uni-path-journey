import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ticket, Plus, Trash2, Pencil, Infinity as InfinityIcon } from 'lucide-react';
import { GymApi } from './useGym';
import { Modal } from './Modal';
import { fmtUZS, GymPlan } from './types';

export default function Plans({ g }: { g: GymApi }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GymPlan | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('30');
  const [classLimit, setClassLimit] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setName(''); setPrice(''); setDuration('30'); setClassLimit(''); setDescription('');
    setOpen(true);
  };

  const openEdit = (p: GymPlan) => {
    setEditing(p);
    setName(p.name); setPrice(String(p.price)); setDuration(String(p.duration_days));
    setClassLimit(p.class_limit == null ? '' : String(p.class_limit));
    setDescription(p.description || '');
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const payload = {
      name: name.trim(),
      price: Number(price) || 0,
      duration_days: Number(duration) || 30,
      class_limit: classLimit.trim() === '' ? null : Number(classLimit),
      description: description.trim() || null,
    };
    if (editing) await g.updatePlan(editing.id, payload as any);
    else await g.addPlan({ ...payload, description: payload.description || undefined });
    setSaving(false);
    setOpen(false);
  };

  const activeSubCount = (planId: string) =>
    g.subscriptions.filter(s => s.plan_id === planId && s.status === 'active').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Ticket className="w-5 h-5 text-primary" /> Abonementlar</h2>
          <p className="text-sm text-muted-foreground">1Fit uslubidagi abonement turlari — muddat va mashg'ulotlar soni bo'yicha.</p>
        </div>
        <Button onClick={openAdd} className="gap-2 rounded-xl"><Plus className="w-4 h-4" /> Abonement qo'shish</Button>
      </div>

      {g.plans.length === 0 ? (
        <Card><CardContent className="pt-5">
          <p className="text-sm text-muted-foreground text-center py-10">Hali abonementlar yaratilmagan. Birinchi abonementni qo'shing.</p>
        </CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {g.plans.map(p => (
            <Card key={p.id} className={`group ${!p.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.duration_days} kun</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button title="Tahrirlash" onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                    <button title="O'chirish" onClick={() => g.deletePlan(p.id)} className="p-1.5 rounded-lg hover:bg-muted text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-xl font-bold text-primary">{fmtUZS(p.price)}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {p.class_limit == null
                    ? <><InfinityIcon className="w-3.5 h-3.5" /> Cheksiz mashg'ulot</>
                    : `${p.class_limit} ta mashg'ulot`}
                </p>
                {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{activeSubCount(p.id)} ta faol a'zo</span>
                  <button
                    onClick={() => g.updatePlan(p.id, { is_active: !p.is_active } as any)}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${p.is_active ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-muted-foreground bg-muted border-border'}`}>
                    {p.is_active ? 'Faol' : 'Faol emas'}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {open && (
        <Modal onClose={() => setOpen(false)} title={editing ? 'Abonementni tahrirlash' : "Yangi abonement"}>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs">Nomi</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Oylik cheksiz / 12 mashg'ulot..." required className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Narxi (so'm)</Label>
                <Input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="500000" required className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Muddati (kun)</Label>
                <Input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} placeholder="30" required className="rounded-xl" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Mashg'ulotlar soni (bo'sh = cheksiz)</Label>
              <Input type="number" min="1" value={classLimit} onChange={e => setClassLimit(e.target.value)} placeholder="Cheksiz" className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Tavsif (ixtiyoriy)</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Barcha zallar, guruh mashg'ulotlari..." className="rounded-xl" /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Bekor</Button>
              <Button type="submit" disabled={saving} className="rounded-xl font-bold">{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
