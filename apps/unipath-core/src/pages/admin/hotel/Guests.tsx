import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Plus, Trash2, Phone, Mail, FileText } from 'lucide-react';
import { HotelApi } from './useHotel';
import { Modal } from './Modal';

export default function Guests({ h }: { h: HotelApi }) {
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [docNo, setDocNo] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await h.addGuest({
      full_name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      document_no: docNo.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setSaving(false);
    setName(''); setPhone(''); setEmail(''); setDocNo(''); setNotes('');
    setAddOpen(false);
  };

  const q = search.trim().toLowerCase();
  const list = h.guests.filter(g =>
    !q || g.full_name.toLowerCase().includes(q) || (g.phone || '').toLowerCase().includes(q)
  );

  const staysOf = (guestId: string, phone: string | null) =>
    h.bookings.filter(b => b.guest_id === guestId || (phone && b.guest_phone === phone)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Mehmonlar bazasi</h2>
          <p className="text-sm text-muted-foreground">Doimiy mehmonlar ro'yxati — hujjat, aloqa va izohlar.</p>
        </div>
        <div className="flex gap-2">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..." className="rounded-xl w-44" />
          <Button onClick={() => setAddOpen(true)} className="gap-2 rounded-xl"><Plus className="w-4 h-4" /> Mehmon qo'shish</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              {h.guests.length === 0 ? "Hali mehmonlar qo'shilmagan." : 'Qidiruv bo\'yicha mehmon topilmadi.'}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {list.map(g => (
                <div key={g.id} className="py-3 flex items-center justify-between gap-3 group">
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-semibold text-sm">{g.full_name}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {g.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {g.phone}</span>}
                      {g.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {g.email}</span>}
                      {g.document_no && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {g.document_no}</span>}
                    </div>
                    {g.notes && <p className="text-[11px] text-amber-500 italic truncate">{g.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">Bronlar</p>
                      <p className="text-sm font-bold">{staysOf(g.id, g.phone)} ta</p>
                    </div>
                    <button title="O'chirish" onClick={() => h.deleteGuest(g.id)}
                      className="p-1.5 rounded-lg hover:bg-muted text-rose-500 opacity-0 group-hover:opacity-100 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {addOpen && (
        <Modal onClose={() => setAddOpen(false)} title="Yangi mehmon qo'shish">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs">Ism va familiya</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Alisher Navoiy" required className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Telefon</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+998 90 123 45 67" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Email (ixtiyoriy)</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mehmon@mail.uz" className="rounded-xl" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Hujjat raqami (pasport)</Label>
              <Input value={docNo} onChange={e => setDocNo(e.target.value)} placeholder="AB 1234567" className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Izoh (ixtiyoriy)</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Doimiy mijoz, VIP..." className="rounded-xl" /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="rounded-xl">Bekor</Button>
              <Button type="submit" disabled={saving} className="rounded-xl font-bold">{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
