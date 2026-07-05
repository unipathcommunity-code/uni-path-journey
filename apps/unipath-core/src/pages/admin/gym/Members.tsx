import { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Plus, Trash2, Phone, Mail, QrCode, Ticket, Snowflake, Pencil } from 'lucide-react';
import { GymApi } from './useGym';
import { Modal } from './Modal';
import { GymMember, fmtUZS, subStatusClass, SUB_STATUS_LABEL, todayISO } from './types';

export default function Members({ g }: { g: GymApi }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<GymMember | null>(null);
  const [qrMember, setQrMember] = useState<GymMember | null>(null);
  const [subMember, setSubMember] = useState<GymMember | null>(null);
  const [planId, setPlanId] = useState('');
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const qrUrl = (token: string) => `${window.location.origin}/gym-checkin/${token}`;

  const openAdd = () => {
    setEditing(null);
    setName(''); setPhone(''); setEmail(''); setNotes('');
    setAddOpen(true);
  };

  const openEdit = (m: GymMember) => {
    setEditing(m);
    setName(m.full_name); setPhone(m.phone || ''); setEmail(m.email || ''); setNotes(m.notes || '');
    setAddOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    if (editing) {
      await g.updateMember(editing.id, {
        full_name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      } as any);
    } else {
      await g.addMember({
        full_name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }
    setSaving(false);
    setAddOpen(false);
  };

  const assignSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subMember || !planId) return;
    setSaving(true);
    await g.assignSubscription(subMember.id, planId);
    setSaving(false);
    setSubMember(null);
    setPlanId('');
  };

  const downloadQrPdf = () => {
    if (!qrMember) return;
    const canvas = qrRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const img = canvas.toDataURL('image/png');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFontSize(22); doc.text("A'zolik kartasi — QR kod", 105, 40, { align: 'center' });
    doc.setFontSize(16); doc.text(qrMember.full_name, 105, 52, { align: 'center' });
    doc.addImage(img, 'PNG', 65, 65, 80, 80);
    doc.setFontSize(10); doc.text(qrUrl(qrMember.qr_token), 105, 155, { align: 'center' });
    doc.save(`azo-${qrMember.full_name.replace(/\s+/g, '-').toLowerCase()}-qr.pdf`);
  };

  const q = search.trim().toLowerCase();
  const list = g.members.filter(m =>
    !q || m.full_name.toLowerCase().includes(q) || (m.phone || '').toLowerCase().includes(q)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> A'zolar bazasi</h2>
          <p className="text-sm text-muted-foreground">Zal a'zolari — abonement holati, QR karta va aloqa ma'lumotlari.</p>
        </div>
        <div className="flex gap-2">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..." className="rounded-xl w-44" />
          <Button onClick={openAdd} className="gap-2 rounded-xl"><Plus className="w-4 h-4" /> A'zo qo'shish</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              {g.members.length === 0 ? "Hali a'zolar qo'shilmagan." : "Qidiruv bo'yicha a'zo topilmadi."}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {list.map(m => {
                const sub = g.activeSubOf(m.id);
                const frozen = g.subscriptions.find(s => s.member_id === m.id && s.status === 'frozen' && (!s.end_date || s.end_date >= todayISO()));
                const shown = sub || frozen || null;
                return (
                  <div key={m.id} className="py-3 flex items-center justify-between gap-3 group">
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-semibold text-sm">{m.full_name}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {m.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {m.phone}</span>}
                        {m.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {m.email}</span>}
                      </div>
                      {m.notes && <p className="text-[11px] text-amber-500 italic truncate">{m.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {shown ? (
                        <div className="text-right">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${subStatusClass(shown.status)}`}>
                            {SUB_STATUS_LABEL[shown.status]} · {shown.plan_name || '—'}
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {shown.end_date || '∞'} gacha{shown.remaining_classes != null ? ` · ${shown.remaining_classes} ta qoldi` : ''}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground px-2 py-0.5 rounded-lg border border-border bg-muted">Abonement yo'q</span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button title="Abonement biriktirish" onClick={() => { setSubMember(m); setPlanId(g.plans.find(p => p.is_active)?.id || ''); }}
                          className="p-1.5 rounded-lg hover:bg-muted text-primary"><Ticket className="w-4 h-4" /></button>
                        {shown && (
                          <button title={shown.status === 'frozen' ? 'Faollashtirish' : 'Muzlatish'} onClick={() => g.freezeSubscription(shown.id)}
                            className="p-1.5 rounded-lg hover:bg-muted text-sky-500"><Snowflake className="w-4 h-4" /></button>
                        )}
                        <button title="QR karta" onClick={() => setQrMember(m)}
                          className="p-1.5 rounded-lg hover:bg-muted"><QrCode className="w-4 h-4" /></button>
                        <button title="Tahrirlash" onClick={() => openEdit(m)}
                          className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                        <button title="O'chirish" onClick={() => g.deleteMember(m.id)}
                          className="p-1.5 rounded-lg hover:bg-muted text-rose-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / edit member */}
      {addOpen && (
        <Modal onClose={() => setAddOpen(false)} title={editing ? "A'zoni tahrirlash" : "Yangi a'zo qo'shish"}>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs">Ism va familiya</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Alisher Navoiy" required className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Telefon</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+998 90 123 45 67" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Email (ixtiyoriy)</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="azo@mail.uz" className="rounded-xl" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Izoh (ixtiyoriy)</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Shifokor ruxsati bor, VIP..." className="rounded-xl" /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="rounded-xl">Bekor</Button>
              <Button type="submit" disabled={saving} className="rounded-xl font-bold">{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign subscription */}
      {subMember && (
        <Modal onClose={() => { setSubMember(null); setPlanId(''); }} title={`${subMember.full_name} — abonement biriktirish`}>
          {g.plans.filter(p => p.is_active).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Avval "Abonementlar" bo'limida abonement yarating.</p>
          ) : (
            <form onSubmit={assignSub} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Abonement turi</Label>
                <select value={planId} onChange={e => setPlanId(e.target.value)} required
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm">
                  {g.plans.filter(p => p.is_active).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {fmtUZS(p.price)} · {p.duration_days} kun{p.class_limit != null ? ` · ${p.class_limit} ta` : ' · cheksiz'}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">Bugundan boshlanadi, tugash sanasi muddatga qarab avtomatik hisoblanadi.</p>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => { setSubMember(null); setPlanId(''); }} className="rounded-xl">Bekor</Button>
                <Button type="submit" disabled={saving || !planId} className="rounded-xl font-bold">{saving ? 'Saqlanmoqda...' : 'Biriktirish'}</Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* QR modal */}
      {qrMember && (
        <Modal onClose={() => setQrMember(null)} title={`${qrMember.full_name} — QR karta`}>
          <div className="space-y-4 flex flex-col items-center">
            <div ref={qrRef} className="bg-white p-4 rounded-xl">
              <QRCodeCanvas value={qrUrl(qrMember.qr_token)} size={200} includeMargin />
            </div>
            <p className="text-xs text-muted-foreground text-center break-all">{qrUrl(qrMember.qr_token)}</p>
            <div className="flex gap-2 w-full">
              <Button onClick={downloadQrPdf} className="flex-1 rounded-xl">PDF yuklab olish</Button>
              <Button variant="outline" onClick={() => setQrMember(null)} className="rounded-xl">Yopish</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
