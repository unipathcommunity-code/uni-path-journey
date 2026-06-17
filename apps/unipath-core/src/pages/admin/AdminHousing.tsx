import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Home, BadgeCheck, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Housing {
  id: string;
  title: string;
  country: string;
  city: string;
  price_per_month: number;
  deposit: number | null;
  currency: string;
  distance_from_university: string | null;
  room_type: string;
  housing_type: string;
  has_internet: boolean;
  has_kitchen: boolean;
  has_bathroom: boolean;
  photos: string[] | null;
  contact_details: string | null;
  description: string | null;
  is_verified: boolean;
  is_active: boolean;
}

const emptyForm = {
  title: '', country: '', city: '', price_per_month: '', deposit: '', currency: 'USD',
  distance_from_university: '', room_type: 'shared', housing_type: 'apartment',
  has_internet: false, has_kitchen: false, has_bathroom: false,
  contact_details: '', description: '', is_verified: false, is_active: true,
};

export default function AdminHousing() {
  const [housing, setHousing] = useState<Housing[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Housing | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const fetchHousing = async () => {
    const { data } = await supabase.from('housing').select('*').order('created_at', { ascending: false });
    setHousing((data as Housing[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchHousing(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (h: Housing) => {
    setEditing(h);
    setForm({
      title: h.title, country: h.country, city: h.city,
      price_per_month: h.price_per_month.toString(), deposit: h.deposit?.toString() || '',
      currency: h.currency, distance_from_university: h.distance_from_university || '',
      room_type: h.room_type, housing_type: h.housing_type,
      has_internet: h.has_internet, has_kitchen: h.has_kitchen, has_bathroom: h.has_bathroom,
      contact_details: h.contact_details || '', description: h.description || '',
      is_verified: h.is_verified, is_active: h.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.country || !form.city || !form.price_per_month) {
      toast.error('Please fill required fields');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title, country: form.country, city: form.city,
      price_per_month: Number(form.price_per_month),
      deposit: form.deposit ? Number(form.deposit) : null,
      currency: form.currency,
      distance_from_university: form.distance_from_university || null,
      room_type: form.room_type, housing_type: form.housing_type,
      has_internet: form.has_internet, has_kitchen: form.has_kitchen, has_bathroom: form.has_bathroom,
      contact_details: form.contact_details || null, description: form.description || null,
      is_verified: form.is_verified, is_active: form.is_active,
    };

    if (editing) {
      const { error } = await supabase.from('housing').update(payload).eq('id', editing.id);
      if (error) toast.error(error.message); else toast.success('Housing updated');
    } else {
      const { error } = await supabase.from('housing').insert(payload);
      if (error) toast.error(error.message); else toast.success('Housing created');
    }
    setSaving(false);
    setDialogOpen(false);
    fetchHousing();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this housing listing?')) return;
    const { error } = await supabase.from('housing').delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Deleted'); fetchHousing(); }
  };

  const filtered = housing.filter(h =>
    h.title.toLowerCase().includes(search.toLowerCase()) ||
    h.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Housing Listings</h1>
          <p className="text-muted-foreground">{housing.length} total listings</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Housing</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search housing..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Housing</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Location</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Price</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(h => (
                  <tr key={h.id} className="hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Home className="w-5 h-5 text-primary" />
                        </div>
                        <p className="font-medium text-foreground">{h.title}</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{h.city}, {h.country}</td>
                    <td className="p-4 text-sm font-medium text-foreground">{h.currency} {h.price_per_month}/mo</td>
                    <td className="p-4"><Badge variant="outline" className="capitalize">{h.housing_type}</Badge></td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {h.is_verified && <Badge variant="secondary" className="gap-1"><BadgeCheck className="w-3 h-3" /> Verified</Badge>}
                        <Badge variant={h.is_active ? 'default' : 'outline'}>{h.is_active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(h)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(h.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Housing' : 'Add New Housing'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Country *</Label><Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} /></div>
              <div><Label>City *</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Price/Month *</Label><Input type="number" value={form.price_per_month} onChange={e => setForm(p => ({ ...p, price_per_month: e.target.value }))} /></div>
              <div><Label>Deposit</Label><Input type="number" value={form.deposit} onChange={e => setForm(p => ({ ...p, deposit: e.target.value }))} /></div>
              <div><Label>Currency</Label><Input value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Room Type</Label>
                <Select value={form.room_type} onValueChange={v => setForm(p => ({ ...p, room_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="shared">Shared</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Housing Type</Label>
                <Select value={form.housing_type} onValueChange={v => setForm(p => ({ ...p, housing_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dormitory">Dormitory</SelectItem>
                    <SelectItem value="apartment">Shared Apartment</SelectItem>
                    <SelectItem value="private">Private Rent</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Distance from University</Label><Input value={form.distance_from_university} onChange={e => setForm(p => ({ ...p, distance_from_university: e.target.value }))} placeholder="e.g., 1.5 km" /></div>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.has_internet} onCheckedChange={v => setForm(p => ({ ...p, has_internet: v }))} /><Label>Internet</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.has_kitchen} onCheckedChange={v => setForm(p => ({ ...p, has_kitchen: v }))} /><Label>Kitchen</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.has_bathroom} onCheckedChange={v => setForm(p => ({ ...p, has_bathroom: v }))} /><Label>Bathroom</Label></div>
            </div>
            <div><Label>Contact Details</Label><Input value={form.contact_details} onChange={e => setForm(p => ({ ...p, contact_details: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} /></div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.is_verified} onCheckedChange={v => setForm(p => ({ ...p, is_verified: v }))} /><Label>UniPath Verified</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} /><Label>Active</Label></div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editing ? 'Update Housing' : 'Create Housing'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
