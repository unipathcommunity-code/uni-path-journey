import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StickyNote, Search, Plus, User, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Note {
  id: string;
  student_id: string;
  note: string;
  note_type: string;
  created_at: string;
  student_name?: string;
}

interface Student {
  student_id: string;
  full_name: string;
}

const NOTE_TYPES = [
  { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-800' },
  { value: 'application', label: 'Application', color: 'bg-blue-100 text-blue-800' },
  { value: 'document', label: 'Document', color: 'bg-purple-100 text-purple-800' },
  { value: 'communication', label: 'Communication', color: 'bg-green-100 text-green-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
];

export default function AgentNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    student_id: '',
    note: '',
    note_type: 'general',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('agent_notes')
        .select('*')
        .eq('agent_id', user?.id)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      // Fetch assigned students
      const { data: assignments } = await supabase
        .from('agent_students')
        .select('student_id')
        .eq('agent_id', user?.id)
        .eq('status', 'active');

      const studentIds = assignments?.map((a) => a.student_id) || [];

      // Fetch student profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', studentIds);

      const studentsMap = new Map(
        profiles?.map((p) => [p.user_id, p.full_name]) || []
      );

      setStudents(
        profiles?.map((p) => ({
          student_id: p.user_id,
          full_name: p.full_name || 'Unknown',
        })) || []
      );

      // Enrich notes with student names
      const enrichedNotes = (notesData || []).map((note) => ({
        ...note,
        student_name: studentsMap.get(note.student_id) || 'Unknown',
      }));

      setNotes(enrichedNotes);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.student_id || !newNote.note.trim()) {
      toast.error('Please select a student and enter a note');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('agent_notes').insert({
        agent_id: user?.id,
        student_id: newNote.student_id,
        note: newNote.note,
        note_type: newNote.note_type,
        is_internal: true,
      });

      if (error) throw error;

      toast.success('Note created successfully');
      setDialogOpen(false);
      setNewNote({ student_id: '', note: '', note_type: 'general' });
      fetchData();
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const { error } = await supabase
        .from('agent_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast.success('Note deleted');
      setNotes(notes.filter((n) => n.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.student_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || note.note_type === typeFilter;

    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ichki eslatmalar</h1>
          <p className="text-muted-foreground">
            Talabalaringiz haqida shaxsiy eslatmalar (talabalarga ko'rinmaydi)
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Eslatma qo'shish
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ichki eslatma yaratish</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Talaba</label>
                <Select
                  value={newNote.student_id}
                  onValueChange={(v) => setNewNote({ ...newNote, student_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Talabani tanlash" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.student_id} value={s.student_id}>
                        {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Eslatma turi</label>
                <Select
                  value={newNote.note_type}
                  onValueChange={(v) => setNewNote({ ...newNote, note_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Eslatma</label>
                <Textarea
                  placeholder="Eslatmangizni kiriting..."
                  value={newNote.note}
                  onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Bekor qilish
                </Button>
                <Button onClick={handleCreateNote} disabled={saving}>
                  {saving ? 'Saqlanmoqda...' : 'Eslatma yaratish'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Eslatmalarni qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tur bo'yicha filtrlash" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha turlar</SelectItem>
            {NOTE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <StickyNote className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Eslatmalar topilmadi</h3>
            <p className="text-muted-foreground">
              Talabalar jarayonini kuzatish uchun ichki eslatmalar yarating
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const typeConfig = NOTE_TYPES.find((t) => t.value === note.note_type);
            return (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{note.student_name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Badge className={typeConfig?.color || 'bg-gray-100'}>
                    {typeConfig?.label || note.note_type}
                  </Badge>
                  <p className="mt-3 text-sm text-foreground whitespace-pre-wrap">
                    {note.note}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
