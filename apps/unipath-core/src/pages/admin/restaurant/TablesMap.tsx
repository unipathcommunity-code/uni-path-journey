import { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, QrCode, Trash2, Utensils, X } from 'lucide-react';
import { RestaurantApi } from './useRestaurant';
import { RestaurantTable, tableStatusClass } from './types';

export default function TablesMap({ r, onTakeOrder }: { r: RestaurantApi; onTakeOrder: (t: RestaurantTable) => void }) {
  const [addOpen, setAddOpen] = useState(false);
  const [num, setNum] = useState('');
  const [cap, setCap] = useState('4');
  const [zone, setZone] = useState('');
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const qrUrl = (token: string | null) => `${window.location.origin}/qr/${token || ''}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!num.trim()) return;
    await r.addTable(num.trim(), parseInt(cap) || 4, zone.trim() || undefined);
    setNum(''); setZone(''); setCap('4'); setAddOpen(false);
  };

  const downloadQrPdf = () => {
    if (!qrTable) return;
    const canvas = qrRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const img = canvas.toDataURL('image/png');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFontSize(22); doc.text('Menyu — QR kod', 105, 40, { align: 'center' });
    doc.setFontSize(16); doc.text(`Stol № ${qrTable.table_number}`, 105, 52, { align: 'center' });
    doc.addImage(img, 'PNG', 65, 70, 80, 80);
    doc.setFontSize(12);
    doc.text('Telefoningiz kamerasi bilan skanlang va buyurtma bering', 105, 165, { align: 'center' });
    doc.save(`stol-${qrTable.table_number}-qr.pdf`);
  };

  const zones = Array.from(new Set(r.tables.map(t => t.zone).filter(Boolean))) as string[];
  const grouped = zones.length
    ? zones.map(z => ({ zone: z, list: r.tables.filter(t => t.zone === z) }))
        .concat([{ zone: 'Boshqa', list: r.tables.filter(t => !t.zone) }]).filter(g => g.list.length)
    : [{ zone: '', list: r.tables }];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Utensils className="w-5 h-5 text-primary" /> Zal & Stollar</h2>
          <p className="text-sm text-muted-foreground">Bo'sh stolga bosing — darrov buyurtma olasiz. QR kod chop eting.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2 rounded-xl"><Plus className="w-4 h-4" /> Stol qo'shish</Button>
      </div>

      {r.tables.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Hali stollar qo'shilmagan. "Stol qo'shish" tugmasini bosing.</CardContent></Card>
      ) : grouped.map(group => (
        <Card key={group.zone || 'all'}>
          {group.zone && <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{group.zone}</CardTitle></CardHeader>}
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {group.list.map(t => (
                <div key={t.id} className={`group relative p-4 rounded-2xl border text-center transition-all ${tableStatusClass(t.status)}`}>
                  <button
                    onClick={() => t.status !== 'occupied' && onTakeOrder(t)}
                    className="w-full disabled:cursor-default"
                    disabled={t.status === 'occupied'}
                  >
                    <div className="text-lg font-bold">№ {t.table_number}</div>
                    <div className="text-[10px] uppercase font-semibold opacity-80 mt-0.5">{t.capacity} kishilik</div>
                    <div className="text-[10px] mt-1 font-medium">
                      {t.status === 'available' ? 'Bo\'sh' : t.status === 'occupied' ? 'Band' : 'Rezerv'}
                    </div>
                  </button>
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button title="QR kod" onClick={() => setQrTable(t)} className="p-1 rounded-md bg-background/70 hover:bg-background"><QrCode className="w-3.5 h-3.5" /></button>
                    <button title="O'chirish" onClick={() => r.deleteTable(t.id)} className="p-1 rounded-md bg-background/70 hover:bg-background text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  {t.status === 'occupied' && (
                    <button onClick={() => r.setTableStatus(t.id, 'available')} className="mt-2 text-[10px] underline opacity-70 hover:opacity-100">Bo'shatish</button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add table modal */}
      {addOpen && (
        <Modal onClose={() => setAddOpen(false)} title="Yangi stol qo'shish">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs">Stol raqami</Label>
              <Input value={num} onChange={e => setNum(e.target.value)} placeholder="8" required className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Sig'imi</Label>
                <Input type="number" value={cap} onChange={e => setCap(e.target.value)} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Zona (ixtiyoriy)</Label>
                <Input value={zone} onChange={e => setZone(e.target.value)} placeholder="2-qavat" className="rounded-xl" /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="rounded-xl">Bekor</Button>
              <Button type="submit" className="rounded-xl font-bold">Saqlash</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* QR modal */}
      {qrTable && (
        <Modal onClose={() => setQrTable(null)} title={`Stol № ${qrTable.table_number} — QR menyu`}>
          <div className="flex flex-col items-center gap-4">
            <div ref={qrRef} className="bg-white p-4 rounded-xl">
              <QRCodeCanvas value={qrUrl(qrTable.qr_token)} size={200} includeMargin />
            </div>
            <p className="text-xs text-muted-foreground text-center break-all">{qrUrl(qrTable.qr_token)}</p>
            <div className="flex gap-2 w-full">
              <Button onClick={downloadQrPdf} className="flex-1 rounded-xl">PDF yuklab olish</Button>
              <Button variant="outline" onClick={() => setQrTable(null)} className="rounded-xl">Yopish</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function Modal({ children, onClose, title, wide }: { children: React.ReactNode; onClose: () => void; title: string; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <Card className={`w-full ${wide ? 'max-w-2xl' : 'max-w-sm'} shadow-xl rounded-2xl`} onClick={e => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
