import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Trash2 } from 'lucide-react';
import { RestaurantApi } from './useRestaurant';
import { fmtUZS } from './types';

interface Ingredient { id: string; name: string; qty: number; unit: string; price: number }

// Food-cost & margin calculator (like iiko/Poster). Recipe ingredients are a local
// planning tool — not persisted, so an owner can quickly model a dish's profitability.
export default function CostCalculator({ r }: { r: RestaurantApi }) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: "Go'sht (Mol go'shti)", qty: 0.2, unit: 'kg', price: 90000 },
    { id: '2', name: 'Guruch', qty: 0.15, unit: 'kg', price: 20000 },
    { id: '3', name: "O'simlik yog'i", qty: 0.05, unit: 'litr', price: 18000 },
    { id: '4', name: 'Sabzi', qty: 0.2, unit: 'kg', price: 5000 },
  ]);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('kg');
  const [price, setPrice] = useState('');

  const selected = r.items.find(it => it.id === selectedItemId);
  const cost = ingredients.reduce((s, ing) => s + ing.qty * ing.price, 0);
  const salePrice = selected ? selected.price : 45000;
  const foodCostPercent = salePrice > 0 ? (cost / salePrice) * 100 : 0;
  const netMargin = salePrice - cost;
  const netMarginPercent = salePrice > 0 ? (netMargin / salePrice) * 100 : 0;

  const addIng = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !qty || !price) return;
    setIngredients(prev => [...prev, { id: Math.random().toString(), name, qty: Number(qty), unit, price: Number(price) }]);
    setName(''); setQty(''); setPrice('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Taomlar tannarxi & foyda kalkulyatori</h3>
        <p className="text-sm text-muted-foreground">Ingrediyentlar bo'yicha tannarx va foyda marjasini tahlil qiling (Food Cost).</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Sotish narxi</span>
          <p className="text-xl font-bold">{fmtUZS(salePrice)}</p>
          <span className="text-[10px] text-muted-foreground block">{selected ? selected.name : 'Standart namuna'}</span>
        </CardContent></Card>
        <Card><CardContent className="pt-5 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Ingrediyentlar tannarxi</span>
          <p className="text-xl font-bold text-rose-500">{fmtUZS(cost)}</p>
          <span className="text-[10px] text-muted-foreground block">Jami yig'indi</span>
        </CardContent></Card>
        <Card><CardContent className="pt-5 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Food Cost ulushi</span>
          <p className={`text-xl font-bold ${foodCostPercent > 40 ? 'text-rose-500' : foodCostPercent > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>{foodCostPercent.toFixed(1)}%</p>
          <span className={`text-[10px] font-bold block ${foodCostPercent > 35 ? 'text-rose-400' : 'text-emerald-400'}`}>{foodCostPercent > 35 ? "⚠️ Yuqori (25-35%)" : "✓ Optimal"}</span>
        </CardContent></Card>
        <Card><CardContent className="pt-5 space-y-1">
          <span className="text-xs text-muted-foreground font-medium">Sof foyda</span>
          <p className="text-xl font-bold text-emerald-500">{fmtUZS(netMargin)}</p>
          <span className="text-[10px] text-muted-foreground block">Marja: {netMarginPercent.toFixed(1)}%</span>
        </CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Resept tarkibi</CardTitle>
              <CardDescription>Taom uchun ketadigan masalliqlar va ularning narxi.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead><tr className="border-b border-border/60 text-muted-foreground text-xs font-semibold uppercase">
                    <th className="py-2">Masalliq</th><th className="py-2 text-right">Miqdor</th><th className="py-2 text-right">Birlik narxi</th><th className="py-2 text-right">Jami</th><th className="py-2 w-10"></th>
                  </tr></thead>
                  <tbody className="divide-y divide-border/40">
                    {ingredients.map(ing => (
                      <tr key={ing.id} className="hover:bg-muted/10">
                        <td className="py-2.5 font-medium">{ing.name}</td>
                        <td className="py-2.5 text-right">{ing.qty} {ing.unit}</td>
                        <td className="py-2.5 text-right">{fmtUZS(ing.price)}</td>
                        <td className="py-2.5 text-right font-semibold">{fmtUZS(ing.qty * ing.price)}</td>
                        <td className="py-2.5 text-right"><button type="button" onClick={() => setIngredients(p => p.filter(i => i.id !== ing.id))} className="text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <form onSubmit={addIng} className="pt-3 border-t border-border/40 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-muted-foreground">Masalliq</Label>
                  <Input placeholder="Go'sht" value={name} onChange={e => setName(e.target.value)} className="h-8 rounded-lg text-xs" required /></div>
                <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-muted-foreground">Birlik</Label>
                  <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full h-8 rounded-lg text-xs bg-background border border-input px-2">
                    <option value="kg">kg</option><option value="g">g</option><option value="litr">litr</option><option value="dona">dona</option>
                  </select></div>
                <div className="space-y-1"><Label className="text-[10px] uppercase font-bold text-muted-foreground">Miqdor / Narx</Label>
                  <div className="flex gap-1.5">
                    <Input type="number" step="any" placeholder="Miqdor" value={qty} onChange={e => setQty(e.target.value)} className="h-8 rounded-lg text-xs w-1/2" required />
                    <Input type="number" placeholder="Narx" value={price} onChange={e => setPrice(e.target.value)} className="h-8 rounded-lg text-xs w-1/2" required />
                  </div></div>
                <div className="flex items-end"><Button type="submit" size="sm" className="w-full h-8 rounded-lg text-xs font-semibold">Qo'shish</Button></div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Menyudan taom tanlang</CardTitle>
            <CardDescription>Kalkulyatorni real narxga bog'lang.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {r.items.length === 0 ? <p className="text-xs text-muted-foreground">Menyuda taom yo'q.</p> : (
              <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} className="w-full h-9 rounded-xl text-xs bg-background border border-input px-3">
                <option value="">-- Standart namuna (45,000 so'm) --</option>
                {r.items.map(it => <option key={it.id} value={it.id}>{it.name} ({fmtUZS(it.price)})</option>)}
              </select>
            )}
            <div className="p-4 border border-border/80 rounded-xl bg-muted/20 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Tahlil & tavsiya</h4>
              {foodCostPercent > 40 ? (
                <p className="text-[11px] text-muted-foreground leading-relaxed"><span className="text-rose-400 font-semibold">⚠️ Tannarx yuqori.</span> Food cost 40% dan yuqori. Sotish narxini oshiring yoki masalliq sarfini kamaytiring.</p>
              ) : foodCostPercent > 35 ? (
                <p className="text-[11px] text-muted-foreground leading-relaxed"><span className="text-amber-400 font-semibold">💡 Chegara.</span> Food cost 35% atrofida. Yetkazib beruvchi bilan narx bo'yicha kelishing.</p>
              ) : (
                <p className="text-[11px] text-muted-foreground leading-relaxed"><span className="text-emerald-400 font-semibold">✓ Zo'r ko'rsatkich.</span> Yuqori rentabellik (Food Cost {foodCostPercent.toFixed(1)}%). Bu taomni ko'proq targ'ib qiling.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
