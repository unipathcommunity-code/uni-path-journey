import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit,
  X,
  AlertCircle,
  Info,
  CheckCircle,
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  target_role: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export default function AdminAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [targetRole, setTargetRole] = useState('all');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAnnouncements(data);
    }
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setTitle('');
    setMessage('');
    setType('info');
    setTargetRole('all');
    setShowModal(true);
  }

  function openEdit(a: Announcement) {
    setEditing(a);
    setTitle(a.title);
    setMessage(a.message);
    setType(a.type);
    setTargetRole(a.target_role);
    setShowModal(true);
  }

  async function handleSave() {
    if (!title.trim() || !message.trim()) {
      toast({ title: 'Sarlavha va xabar majburiy', variant: 'destructive' });
      return;
    }

    if (editing) {
      const { error } = await supabase
        .from('announcements')
        .update({ title, message, type, target_role: targetRole })
        .eq('id', editing.id);

      if (error) {
        toast({ title: 'Xatolik', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Yangilandi' });
        setShowModal(false);
        fetchAnnouncements();
      }
    } else {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title,
          message,
          type,
          target_role: targetRole,
          created_by: user!.id,
        });

      if (error) {
        toast({ title: 'Xatolik', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'E\'lon qo\'shildi' });
        setShowModal(false);
        fetchAnnouncements();
      }
    }
  }

  async function toggleActive(a: Announcement) {
    await supabase
      .from('announcements')
      .update({ is_active: !a.is_active })
      .eq('id', a.id);
    fetchAnnouncements();
  }

  async function handleDelete(id: string) {
    if (!confirm('Rostdan o\'chirmoqchimisiz?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    fetchAnnouncements();
  }

  const typeIcon = (t: string) => {
    switch (t) {
      case 'warning': return <AlertCircle className="w-5 h-5 text-warning" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-success" />;
      default: return <Info className="w-5 h-5 text-primary" />;
    }
  };

  const targetLabel = (r: string) => {
    switch (r) {
      case 'student': return 'Talabalar';
      case 'agent': return 'Agentlar';
      case 'admin': return 'Adminlar';
      default: return 'Hammaga';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">E'lonlar</h1>
          <p className="text-muted-foreground">Yangiliklar va e'lonlarni boshqaring</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Yangi e'lon
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Yuklanmoqda...</div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Hozircha e'lonlar yo'q</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`bg-card rounded-2xl border p-5 flex items-start gap-4 ${
                a.is_active ? 'border-border' : 'border-border opacity-50'
              }`}
            >
              <div className="mt-1">{typeIcon(a.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{a.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {targetLabel(a.target_role)}
                  </span>
                  {!a.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                      Nofaol
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(a.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch checked={a.is_active} onCheckedChange={() => toggleActive(a)} />
                <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {editing ? "E'lonni tahrirlash" : "Yangi e'lon"}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground">Sarlavha</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="E'lon sarlavhasi" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Xabar</label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="E'lon matni" rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Turi</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Ma'lumot</SelectItem>
                      <SelectItem value="warning">Ogohlantirish</SelectItem>
                      <SelectItem value="success">Muvaffaqiyat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Kimga</label>
                  <Select value={targetRole} onValueChange={setTargetRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Hammaga</SelectItem>
                      <SelectItem value="student">Talabalarga</SelectItem>
                      <SelectItem value="agent">Agentlarga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Bekor qilish</Button>
              <Button onClick={handleSave}>{editing ? 'Saqlash' : "Qo'shish"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
