import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessMode } from '@/hooks/useBusinessMode';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Plus, Trash2, Save, CheckCircle2, Star, Phone, GraduationCap, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { UpgradeGate } from '@/components/admin/UpgradeGate';

interface Mentor {
  id: string;
  user_id: string;
  name: string;
  name_uz: string | null;
  name_ru: string | null;
  bio: string | null;
  bio_uz: string | null;
  bio_ru: string | null;
  university_graduated: string | null;
  country_expertise: string[];
  avatar_url: string | null;
  telegram_username: string | null;
  is_verified: boolean;
  is_active: boolean;
  call_cost_credits: number;
  total_calls: number;
  rating: number;
  can_review_documents: boolean;
  created_at: string;
}

const emptyMentor = {
  name: '', name_uz: '', name_ru: '', bio: '', bio_uz: '', bio_ru: '',
  university_graduated: '', country_expertise: '', avatar_url: '', telegram_username: '',
  is_verified: false, is_active: true, call_cost_credits: 5, can_review_documents: false, user_id: '',
};

export default function AdminMentors() {
  const { user } = useAuth();
  const { isPaid } = useBusinessMode();
  const { hasMentors } = usePlanLimits();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Mentor | null>(null);
  const [form, setForm] = useState(emptyMentor);
  const [saving, setSaving] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => { 
    if (hasMentors) {
      fetchMentors(); 
      fetchBookings(); 
    }
  }, [hasMentors]);

  if (!hasMentors) {
    return <UpgradeGate requiredPlan="Pro" featureName="Mentors" />;
  }

  const fetchMentors = async () => {
    setLoading(true);
    const { data } = await supabase.from('mentors').select('*').order('created_at', { ascending: false });
    setMentors((data as any[]) || []);
    setLoading(false);
  };

  const fetchBookings = async () => {
    const { data } = await supabase.from('mentor_bookings').select('*').order('created_at', { ascending: false }).limit(50);
    setBookings(data || []);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyMentor);
    setDialogOpen(true);
  };

  const openEdit = (m: Mentor) => {
    setEditing(m);
    setForm({
      name: m.name, name_uz: m.name_uz || '', name_ru: m.name_ru || '',
      bio: m.bio || '', bio_uz: m.bio_uz || '', bio_ru: m.bio_ru || '',
      university_graduated: m.university_graduated || '',
      country_expertise: m.country_expertise.join(', '),
      avatar_url: m.avatar_url || '', telegram_username: m.telegram_username || '',
      is_verified: m.is_verified, is_active: m.is_active,
      call_cost_credits: m.call_cost_credits, can_review_documents: m.can_review_documents,
      user_id: m.user_id,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    setSaving(true);

    const payload = {
      name: form.name, name_uz: form.name_uz || null, name_ru: form.name_ru || null,
      bio: form.bio || null, bio_uz: form.bio_uz || null, bio_ru: form.bio_ru || null,
      university_graduated: form.university_graduated || null,
      country_expertise: form.country_expertise.split(',').map(s => s.trim()).filter(Boolean),
      avatar_url: form.avatar_url || null, telegram_username: form.telegram_username || null,
      is_verified: form.is_verified, is_active: form.is_active,
      call_cost_credits: form.call_cost_credits, can_review_documents: form.can_review_documents,
      user_id: form.user_id || user?.id || '',
    };

    if (editing) {
      const { error } = await supabase.from('mentors').update(payload).eq('id', editing.id);
      if (error) toast.error('Update failed'); else toast.success('Updated');
    } else {
      const { error } = await supabase.from('mentors').insert(payload);
      if (error) toast.error('Create failed: ' + error.message); else toast.success('Mentor created');
    }

    setSaving(false);
    setDialogOpen(false);
    fetchMentors();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this mentor?')) return;
    await supabase.from('mentors').delete().eq('id', id);
    toast.success('Deleted');
    fetchMentors();
  };

  const handleToggleActive = async (id: string, val: boolean) => {
    await supabase.from('mentors').update({ is_active: val }).eq('id', id);
    setMentors(ms => ms.map(m => m.id === id ? { ...m, is_active: val } : m));
  };

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('mentor_bookings').update({ status }).eq('id', id);
    if (error) {
      toast.error('Booking status update failed');
      return;
    }
    toast.success('Booking updated');
    fetchBookings();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mentors Management</h1>
          <p className="text-muted-foreground">Add, edit, and manage expert mentors</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Mentor</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{mentors.length}</p><p className="text-sm text-muted-foreground">Total Mentors</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-primary">{mentors.filter(m => m.is_active).length}</p><p className="text-sm text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-primary">{mentors.filter(m => m.is_verified).length}</p><p className="text-sm text-muted-foreground">Verified</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{bookings.length}</p><p className="text-sm text-muted-foreground">Total Bookings</p></CardContent></Card>
      </div>

      {/* Mentor List */}
      <div className="space-y-3">
        {mentors.map(m => (
          <Card key={m.id} className={!m.is_active ? 'opacity-60' : ''}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                  {m.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{m.name}</p>
                    {m.is_verified && <Badge className="bg-primary/10 text-primary text-xs gap-1"><CheckCircle2 className="w-3 h-3" />Verified</Badge>}
                    {m.can_review_documents && <Badge variant="outline" className="text-xs">Doc Reviewer</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{m.university_graduated} • {m.country_expertise.join(', ')}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{Number(m.rating).toFixed(1)}</span>
                    <span>{m.total_calls} calls</span>
                    <span>{isPaid ? 'Plan request' : `${m.call_cost_credits} UniCoin/call`}</span>
                    {m.telegram_username && <a href={`https://t.me/${m.telegram_username.replace('@','')}`} target="_blank" className="text-primary hover:underline">@{m.telegram_username.replace('@','')}</a>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch checked={m.is_active} onCheckedChange={(v) => handleToggleActive(m.id, v)} />
                <Button size="icon" variant="outline" onClick={() => openEdit(m)}><Edit className="w-4 h-4" /></Button>
                <Button size="icon" variant="outline" className="text-destructive" onClick={() => handleDelete(m.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {mentors.length === 0 && (
          <Card><CardContent className="py-16 text-center text-muted-foreground">No mentors yet. Click "Add Mentor" to create one.</CardContent></Card>
        )}
      </div>

      {/* Recent Bookings */}
      {bookings.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Bookings ({bookings.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2 px-3">Mentor</th><th className="text-left py-2 px-3">Status</th><th className="text-left py-2 px-3">Price</th><th className="text-left py-2 px-3">Date</th><th className="text-left py-2 px-3">Actions</th></tr></thead>
                <tbody>
                  {bookings.map(b => {
                    const mentor = mentors.find(m => m.id === b.mentor_id);
                    return (
                      <tr key={b.id} className="border-b border-border/50">
                        <td className="py-2 px-3 font-medium">{mentor?.name || 'Unknown'}</td>
                        <td className="py-2 px-3"><Badge variant="outline" className="text-xs">{b.status}</Badge></td>
                        <td className="py-2 px-3">{isPaid ? 'Plan / request' : `${b.credits_spent} UniCoin`}</td>
                        <td className="py-2 px-3 text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => updateBookingStatus(b.id, 'confirmed')}>Confirm</Button>
                            <Button size="sm" variant="outline" onClick={() => updateBookingStatus(b.id, 'completed')}>Complete</Button>
                            <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateBookingStatus(b.id, 'cancelled')}>Cancel</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Mentor' : 'Add New Mentor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label>Name (EN)</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
              <div><Label>Name (UZ)</Label><Input value={form.name_uz} onChange={e => setForm(f => ({...f, name_uz: e.target.value}))} /></div>
              <div><Label>Name (RU)</Label><Input value={form.name_ru} onChange={e => setForm(f => ({...f, name_ru: e.target.value}))} /></div>
            </div>
            <div><Label>University Graduated</Label><Input value={form.university_graduated} onChange={e => setForm(f => ({...f, university_graduated: e.target.value}))} placeholder="e.g. Seoul National University" /></div>
            <div><Label>Country Expertise (comma separated)</Label><Input value={form.country_expertise} onChange={e => setForm(f => ({...f, country_expertise: e.target.value}))} placeholder="South Korea, Japan, USA" /></div>
            <div><Label>Bio (EN)</Label><Textarea value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Bio (UZ)</Label><Textarea value={form.bio_uz} onChange={e => setForm(f => ({...f, bio_uz: e.target.value}))} rows={2} /></div>
              <div><Label>Bio (RU)</Label><Textarea value={form.bio_ru} onChange={e => setForm(f => ({...f, bio_ru: e.target.value}))} rows={2} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Telegram Username</Label><Input value={form.telegram_username} onChange={e => setForm(f => ({...f, telegram_username: e.target.value}))} placeholder="@username" /></div>
              <div><Label>{isPaid ? 'Plan label / price unit' : 'Call Cost (UniCoin)'}</Label><Input type="number" value={form.call_cost_credits} onChange={e => setForm(f => ({...f, call_cost_credits: parseInt(e.target.value) || 5}))} /></div>
            </div>
            <div><Label>Avatar URL</Label><Input value={form.avatar_url} onChange={e => setForm(f => ({...f, avatar_url: e.target.value}))} placeholder="https://..." /></div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.is_verified} onCheckedChange={v => setForm(f => ({...f, is_verified: v}))} /><Label>Verified</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({...f, is_active: v}))} /><Label>Active</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.can_review_documents} onCheckedChange={v => setForm(f => ({...f, can_review_documents: v}))} /><Label>Can Review Docs</Label></div>
            </div>
            <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : editing ? 'Update Mentor' : 'Create Mentor'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
