import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Tag, Eye, EyeOff } from 'lucide-react';
import { Modal } from './TablesMap';
import { RestaurantApi } from './useRestaurant';
import { MenuItem, MenuModifier, fmtUZS } from './types';

export default function MenuManager({ r }: { r: RestaurantApi }) {
  const [catOpen, setCatOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [itemModal, setItemModal] = useState<{ item?: MenuItem } | null>(null);

  const addCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    await r.addCategory(catName.trim());
    setCatName(''); setCatOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Tag className="w-5 h-5 text-primary" /> Menyu</h2>
          <p className="text-sm text-muted-foreground">Kategoriyalar va taomlarni boshqaring. Mavjud emas qilingan taom POS va QR-menyuda ko'rinmaydi.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatOpen(true)} className="gap-2 rounded-xl"><Plus className="w-4 h-4" /> Kategoriya</Button>
          <Button onClick={() => setItemModal({})} className="gap-2 rounded-xl" disabled={r.categories.length === 0}><Plus className="w-4 h-4" /> Taom</Button>
        </div>
      </div>

      {r.categories.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Avval kategoriya qo'shing (masalan: Issiq taomlar, Salatlar, Ichimliklar).</CardContent></Card>
      ) : r.categories.map(cat => {
        const list = r.items.filter(i => i.category_id === cat.id);
        return (
          <Card key={cat.id}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{cat.name} <span className="text-xs text-muted-foreground">({list.length})</span></h3>
                <button onClick={() => { if (confirm(`"${cat.name}" kategoriyasi o'chirilsinmi?`)) r.deleteCategory(cat.id); }}
                  className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
              {list.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Bu kategoriyada taom yo'q.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {list.map(it => (
                    <div key={it.id} className={`flex items-center gap-3 p-2.5 border rounded-xl ${it.is_available ? '' : 'opacity-50'}`}>
                      {it.image_url
                        ? <img src={it.image_url} alt={it.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        : <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0"><Tag className="w-5 h-5" /></div>}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{it.name}</p>
                        <p className="text-xs text-primary font-semibold">{fmtUZS(it.price)}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button title={it.is_available ? 'Yashirish' : 'Ko\'rsatish'} onClick={() => r.updateItem(it.id, { is_available: !it.is_available })}
                          className="p-1 rounded-md hover:bg-muted">{it.is_available ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</button>
                        <button onClick={() => setItemModal({ item: it })} className="p-1 rounded-md hover:bg-muted"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => r.deleteItem(it.id)} className="p-1 rounded-md hover:bg-muted text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {catOpen && (
        <Modal onClose={() => setCatOpen(false)} title="Yangi kategoriya">
          <form onSubmit={addCat} className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs">Kategoriya nomi</Label>
              <Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Issiq taomlar" required className="rounded-xl" /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setCatOpen(false)} className="rounded-xl">Bekor</Button>
              <Button type="submit" className="rounded-xl font-bold">Saqlash</Button></div>
          </form>
        </Modal>
      )}

      {itemModal && <ItemModal r={r} item={itemModal.item} onClose={() => setItemModal(null)} />}
    </div>
  );
}

function ItemModal({ r, item, onClose }: { r: RestaurantApi; item?: MenuItem; onClose: () => void }) {
  const [name, setName] = useState(item?.name || '');
  const [categoryId, setCategoryId] = useState(item?.category_id || r.categories[0]?.id || '');
  const [price, setPrice] = useState(String(item?.price ?? ''));
  const [desc, setDesc] = useState(item?.description || '');
  const [img, setImg] = useState(item?.image_url || '');
  const [mods, setMods] = useState<MenuModifier[]>(item?.modifiers || []);
  const [modName, setModName] = useState('');
  const [modPrice, setModPrice] = useState('');

  const addMod = () => {
    if (!modName.trim()) return;
    setMods([...mods, { name: modName.trim(), price: Number(modPrice) || 0 }]);
    setModName(''); setModPrice('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: name.trim(), category_id: categoryId, price: Number(price) || 0, description: desc.trim(), image_url: img.trim(), modifiers: mods };
    if (item) await r.updateItem(item.id, payload);
    else await r.addItem(payload);
    onClose();
  };

  return (
    <Modal onClose={onClose} title={item ? 'Taomni tahrirlash' : 'Yangi taom'}>
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5"><Label className="text-xs">Nomi</Label>
          <Input value={name} onChange={e => setName(e.target.value)} required className="rounded-xl" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label className="text-xs">Kategoriya</Label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm">
              {r.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div className="space-y-1.5"><Label className="text-xs">Narxi (so'm)</Label>
            <Input type="number" value={price} onChange={e => setPrice(e.target.value)} required className="rounded-xl" /></div>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">Tavsif (ixtiyoriy)</Label>
          <Input value={desc} onChange={e => setDesc(e.target.value)} className="rounded-xl" /></div>
        <div className="space-y-1.5"><Label className="text-xs">Rasm URL (ixtiyoriy)</Label>
          <Input value={img} onChange={e => setImg(e.target.value)} placeholder="https://..." className="rounded-xl" /></div>

        <div className="space-y-1.5">
          <Label className="text-xs">Qo'shimchalar / modifikatorlar (ixtiyoriy)</Label>
          {mods.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {mods.map((m, i) => (
                <span key={i} className="text-xs bg-muted px-2 py-1 rounded-lg flex items-center gap-1">
                  {m.name} {m.price ? `+${fmtUZS(m.price)}` : ''}
                  <button type="button" onClick={() => setMods(mods.filter((_, idx) => idx !== i))} className="text-rose-500">×</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input value={modName} onChange={e => setModName(e.target.value)} placeholder="masalan: Achchiq" className="rounded-lg h-9 text-xs" />
            <Input type="number" value={modPrice} onChange={e => setModPrice(e.target.value)} placeholder="+narx" className="rounded-lg h-9 text-xs w-24" />
            <Button type="button" variant="secondary" onClick={addMod} className="h-9 rounded-lg">+</Button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Bekor</Button>
          <Button type="submit" className="rounded-xl font-bold">Saqlash</Button>
        </div>
      </form>
    </Modal>
  );
}
