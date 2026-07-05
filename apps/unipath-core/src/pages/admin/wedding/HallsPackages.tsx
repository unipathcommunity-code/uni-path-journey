import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Package, Plus, Pencil, Trash2, Users, Power } from 'lucide-react';
import { Modal } from '@/pages/admin/restaurant/TablesMap';
import { WeddingApi } from './useWedding';
import { EventHall, EventPackage, fmtUZS } from './types';

export default function HallsPackages({ w }: { w: WeddingApi }) {
  // Hall modal state (null = closed, 'new' = create, EventHall = edit)
  const [hallForm, setHallForm] = useState<EventHall | 'new' | null>(null);
  const [hName, setHName] = useState('');
  const [hCapacity, setHCapacity] = useState('200');
  const [hPrice, setHPrice] = useState('0');
  const [hDesc, setHDesc] = useState('');
  const [hImage, setHImage] = useState('');

  // Package modal state
  const [pkgForm, setPkgForm] = useState<EventPackage | 'new' | null>(null);
  const [pName, setPName] = useState('');
  const [pPrice, setPPrice] = useState('0');
  const [pDesc, setPDesc] = useState('');
  const [pIncludes, setPIncludes] = useState('');

  const openHall = (h: EventHall | 'new') => {
    setHallForm(h);
    if (h === 'new') { setHName(''); setHCapacity('200'); setHPrice('0'); setHDesc(''); setHImage(''); }
    else { setHName(h.name); setHCapacity(String(h.capacity)); setHPrice(String(h.base_price)); setHDesc(h.description || ''); setHImage(h.image_url || ''); }
  };

  const openPkg = (p: EventPackage | 'new') => {
    setPkgForm(p);
    if (p === 'new') { setPName(''); setPPrice('0'); setPDesc(''); setPIncludes(''); }
    else { setPName(p.name); setPPrice(String(p.price_per_guest)); setPDesc(p.description || ''); setPIncludes((p.includes || []).join(', ')); }
  };

  const submitHall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hName.trim()) return;
    const payload = {
      name: hName.trim(),
      capacity: parseInt(hCapacity) || 200,
      base_price: parseFloat(hPrice) || 0,
      description: hDesc.trim() || null,
      image_url: hImage.trim() || null,
    };
    if (hallForm === 'new') await w.addHall(payload);
    else if (hallForm) await w.updateHall(hallForm.id, payload);
    setHallForm(null);
  };

  const submitPkg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return;
    const payload = {
      name: pName.trim(),
      price_per_guest: parseFloat(pPrice) || 0,
      description: pDesc.trim() || null,
      includes: pIncludes.split(',').map(s => s.trim()).filter(Boolean),
    };
    if (pkgForm === 'new') await w.addPackage(payload);
    else if (pkgForm) await w.updatePackage(pkgForm.id, payload);
    setPkgForm(null);
  };

  return (
    <div className="space-y-5">
      {/* ── Halls ─────────────────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-pink-500" /> Zallar
            </CardTitle>
            <CardDescription>Tantana zallari — sig'imi va bazaviy narxi.</CardDescription>
          </div>
          <Button onClick={() => openHall('new')} className="rounded-xl gap-2 font-bold bg-pink-600 hover:bg-pink-700 text-white">
            <Plus className="w-4 h-4" /> Zal qo'shish
          </Button>
        </CardHeader>
        <CardContent>
          {w.halls.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-2xl">
              Hali zallar qo'shilmagan. "Zal qo'shish" tugmasini bosing.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {w.halls.map(h => (
                <div key={h.id} className={`group relative border rounded-2xl overflow-hidden transition hover:shadow-md ${!h.is_active ? 'opacity-60' : ''}`}>
                  {h.image_url ? (
                    <img src={h.image_url} alt={h.name} className="w-full h-28 object-cover" />
                  ) : (
                    <div className="w-full h-28 bg-pink-500/10 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-pink-500/40" />
                    </div>
                  )}
                  <div className="p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-sm truncate">{h.name}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border shrink-0 ${
                        h.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                        {h.is_active ? 'Faol' : 'Nofaol'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> {h.capacity} kishilik
                    </p>
                    <p className="text-sm font-bold text-pink-500">{fmtUZS(h.base_price)}</p>
                    {h.description && <p className="text-xs text-muted-foreground line-clamp-2">{h.description}</p>}
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button title="Tahrirlash" onClick={() => openHall(h)}
                      className="p-1.5 rounded-md bg-background/80 hover:bg-background shadow"><Pencil className="w-3.5 h-3.5" /></button>
                    <button title={h.is_active ? 'Nofaol qilish' : 'Faollashtirish'}
                      onClick={() => w.updateHall(h.id, { is_active: !h.is_active })}
                      className={`p-1.5 rounded-md bg-background/80 hover:bg-background shadow ${h.is_active ? 'text-amber-500' : 'text-emerald-500'}`}>
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button title="O'chirish"
                      onClick={() => { if (window.confirm(`"${h.name}" zalini o'chirasizmi?`)) w.deleteHall(h.id); }}
                      className="p-1.5 rounded-md bg-background/80 hover:bg-background shadow text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Packages ──────────────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-pink-500" /> Menyu / dastur paketlari
            </CardTitle>
            <CardDescription>Har bir mehmon uchun narxlangan paketlar (Standard, Gold, Platinum...).</CardDescription>
          </div>
          <Button onClick={() => openPkg('new')} variant="outline" className="rounded-xl gap-2 font-bold">
            <Plus className="w-4 h-4" /> Paket qo'shish
          </Button>
        </CardHeader>
        <CardContent>
          {w.packages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-2xl">
              Hali paketlar qo'shilmagan.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {w.packages.map(p => (
                <div key={p.id} className={`group relative border rounded-2xl p-4 space-y-2 transition hover:shadow-md ${!p.is_active ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-sm truncate">{p.name}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border shrink-0 ${
                      p.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                      {p.is_active ? 'Faol' : 'Nofaol'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-pink-500">{fmtUZS(p.price_per_guest)} <span className="text-xs font-normal text-muted-foreground">/ kishi</span></p>
                  {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
                  {p.includes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.includes.slice(0, 5).map((inc, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{inc}</span>
                      ))}
                      {p.includes.length > 5 && <span className="text-[9px] text-muted-foreground">+{p.includes.length - 5}</span>}
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button title="Tahrirlash" onClick={() => openPkg(p)}
                      className="p-1.5 rounded-md bg-background/80 hover:bg-background shadow"><Pencil className="w-3.5 h-3.5" /></button>
                    <button title={p.is_active ? 'Nofaol qilish' : 'Faollashtirish'}
                      onClick={() => w.updatePackage(p.id, { is_active: !p.is_active })}
                      className={`p-1.5 rounded-md bg-background/80 hover:bg-background shadow ${p.is_active ? 'text-amber-500' : 'text-emerald-500'}`}>
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button title="O'chirish"
                      onClick={() => { if (window.confirm(`"${p.name}" paketini o'chirasizmi?`)) w.deletePackage(p.id); }}
                      className="p-1.5 rounded-md bg-background/80 hover:bg-background shadow text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hall modal */}
      {hallForm && (
        <Modal onClose={() => setHallForm(null)} title={hallForm === 'new' ? "Yangi zal qo'shish" : 'Zalni tahrirlash'}>
          <form onSubmit={submitHall} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Zal nomi</Label>
              <Input value={hName} onChange={e => setHName(e.target.value)} placeholder="masalan: Versal zali" required className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Sig'imi (kishi)</Label>
                <Input type="number" min="1" value={hCapacity} onChange={e => setHCapacity(e.target.value)} required className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Bazaviy narxi (so'm)</Label>
                <Input type="number" min="0" value={hPrice} onChange={e => setHPrice(e.target.value)} required className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tavsif (ixtiyoriy)</Label>
              <Input value={hDesc} onChange={e => setHDesc(e.target.value)} placeholder="masalan: 2-qavat, panorama oynali" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rasm URL (ixtiyoriy)</Label>
              <Input value={hImage} onChange={e => setHImage(e.target.value)} placeholder="https://..." className="rounded-xl" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setHallForm(null)} className="rounded-xl">Bekor</Button>
              <Button type="submit" className="rounded-xl font-bold bg-pink-600 hover:bg-pink-700 text-white">Saqlash</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Package modal */}
      {pkgForm && (
        <Modal onClose={() => setPkgForm(null)} title={pkgForm === 'new' ? "Yangi paket qo'shish" : 'Paketni tahrirlash'}>
          <form onSubmit={submitPkg} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Paket nomi</Label>
              <Input value={pName} onChange={e => setPName(e.target.value)} placeholder="masalan: Gold (Oltin)" required className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Narxi — har bir mehmon uchun (so'm)</Label>
              <Input type="number" min="0" value={pPrice} onChange={e => setPPrice(e.target.value)} required className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tavsif (ixtiyoriy)</Label>
              <Input value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="masalan: To'liq menyu + jonli musiqa" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nimalar kiradi (vergul bilan ajrating)</Label>
              <Input value={pIncludes} onChange={e => setPIncludes(e.target.value)} placeholder="Milliy taomlar, Tort, Fotograf, DJ" className="rounded-xl" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setPkgForm(null)} className="rounded-xl">Bekor</Button>
              <Button type="submit" className="rounded-xl font-bold bg-pink-600 hover:bg-pink-700 text-white">Saqlash</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
