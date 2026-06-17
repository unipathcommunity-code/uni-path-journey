import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FileText, Search, User, GraduationCap, Calendar, Eye, StickyNote, Send, FileCheck, ExternalLink, Phone, Globe, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface StudentDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  status: string;
  created_at: string;
}

interface Application {
  id: string;
  status: string;
  program: string | null;
  intake: string | null;
  created_at: string;
  submitted_at: string | null;
  user_id: string;
  student_name: string;
  student_email: string;
  student_phone: string | null;
  selected_country: string | null;
  university_name: string;
  university_country: string;
  application_fee: number | null;
  fee_paid: boolean | null;
  studentDocuments: StudentDocument[];
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Qoralama', color: 'bg-muted text-muted-foreground' },
  { value: 'submitted', label: 'Yuborilgan', color: 'bg-primary/10 text-primary' },
  { value: 'in_review', label: 'Ko\'rib chiqilmoqda', color: 'bg-warning/10 text-warning' },
  { value: 'accepted', label: 'Qabul qilindi', color: 'bg-success/10 text-success' },
  { value: 'rejected', label: 'Rad etildi', color: 'bg-destructive/10 text-destructive' },
];

export default function AgentApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const getSignedUrl = async (filePath: string): Promise<string> => {
    // If already a full URL, return as-is
    if (filePath.startsWith('http')) return filePath;
    
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    return data?.signedUrl || filePath;
  };

  const fetchApplications = async () => {
    try {
      // First get assigned students
      const { data: assignments } = await supabase
        .from('agent_students')
        .select('student_id')
        .eq('agent_id', user?.id)
        .eq('status', 'active');

      if (!assignments?.length) {
        setApplications([]);
        setLoading(false);
        return;
      }

      const studentIds = assignments.map((a) => a.student_id);

      // Get applications for assigned students
      const { data: appsData, error } = await supabase
        .from('applications')
        .select('*')
        .in('user_id', studentIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch all profiles for students
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone, selected_country')
        .in('user_id', studentIds);

      // Fetch all universities
      const universityIds = [...new Set((appsData || []).map(a => a.university_id))];
      const { data: universities } = await supabase
        .from('universities')
        .select('id, name, country')
        .in('id', universityIds);

      // Fetch all student documents
      const { data: studentDocs } = await supabase
        .from('documents')
        .select('id, user_id, document_type, file_name, file_url, status, created_at')
        .in('user_id', studentIds);

      // Generate signed URLs for documents
      const docsWithSignedUrls = await Promise.all(
        (studentDocs || []).map(async (doc) => ({
          ...doc,
          file_url: await getSignedUrl(doc.file_url),
        }))
      );

      // Enrich with student and university data
      const enrichedApps = (appsData || []).map((app) => {
        const profile = profiles?.find(p => p.user_id === app.user_id);
        const university = universities?.find(u => u.id === app.university_id);
        const docs = docsWithSignedUrls.filter(d => d.user_id === app.user_id) || [];

        return {
          ...app,
          student_name: profile?.full_name || 'Noma\'lum',
          student_email: profile?.email || '',
          student_phone: profile?.phone || null,
          selected_country: profile?.selected_country || null,
          university_name: university?.name || 'Noma\'lum',
          university_country: university?.country || '',
          studentDocuments: docs,
        };
      });

      setApplications(enrichedApps);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Arizalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedApp || !newNote.trim()) return;

    setSavingNote(true);
    try {
      const { error } = await supabase.from('agent_notes').insert({
        agent_id: user?.id,
        student_id: selectedApp.user_id,
        application_id: selectedApp.id,
        note: newNote,
        note_type: 'application',
        is_internal: true,
      });

      if (error) throw error;

      toast.success('Eslatma qo\'shildi');
      setNoteDialogOpen(false);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Eslatma qo\'shishda xatolik');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSendMessage = async (app: Application) => {
    // Create a notification for the student
    try {
      const message = prompt('Talabaga xabar yuboring:');
      if (!message) return;

      const { error } = await supabase.from('notifications').insert({
        user_id: app.user_id,
        title: 'Agent xabari',
        message: message,
        type: 'info',
        link: '/student/applications',
      });

      if (error) throw error;

      toast.success('Xabar yuborildi');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Xabar yuborishda xatolik');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === status);
    return (
      <Badge className={statusOption?.color || 'bg-muted text-muted-foreground'}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.university_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.program?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Talabalar arizalari</h1>
        <p className="text-muted-foreground">
          Tayinlangan talabalaringiz arizalarini kuzating va boshqaring
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Talaba, universitet, dastur bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status bo'yicha filtrlash" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha statuslar</SelectItem>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Applications Table */}
      <Card>
        <CardContent className="p-0">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Arizalar topilmadi</h3>
              <p className="text-muted-foreground">
                Tayinlangan talabalaringiz arizalari bu yerda ko'rinadi
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Talaba</TableHead>
                  <TableHead>Universitet</TableHead>
                  <TableHead>Dastur</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>To'lov</TableHead>
                  <TableHead>Harakatlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{app.student_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {app.student_email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{app.university_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {app.university_country}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.program || '-'}</p>
                        {app.intake && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {app.intake}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(app.status || 'draft')}</TableCell>
                    <TableCell>
                      {app.application_fee ? (
                        <div className="text-sm">
                          <p className="font-medium">${app.application_fee}</p>
                          {app.fee_paid ? (
                            <Badge className="bg-success/10 text-success text-xs">To'langan</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Kutilmoqda</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedApp(app);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedApp(app);
                            setNoteDialogOpen(true);
                          }}
                        >
                          <StickyNote className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendMessage(app)}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Application Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ariza tafsilotlari</DialogTitle>
            <DialogDescription>
              {selectedApp?.student_name} - {selectedApp?.university_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-4">
              {/* Talaba ma'lumotlari */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Talaba Ma'lumotlari
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">F.I.O</p>
                    <p className="font-medium">{selectedApp.student_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {selectedApp.student_email || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefon</p>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {selectedApp.student_phone || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tanlangan Mamlakat</p>
                    <p className="font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {selectedApp.selected_country || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Universitet va dastur */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Universitet & Dastur
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Universitet</p>
                    <p className="font-medium">{selectedApp.university_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mamlakat</p>
                    <p className="font-medium">{selectedApp.university_country}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dastur</p>
                    <p className="font-medium">{selectedApp.program || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Qabul davri</p>
                    <p className="font-medium">{selectedApp.intake || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(selectedApp.status)}
                  </div>
                  {selectedApp.submitted_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">Yuborilgan</p>
                      <p className="font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(selectedApp.submitted_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Talaba Hujjatlari */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Talaba Hujjatlari ({selectedApp.studentDocuments?.length || 0} ta)
                </h3>
                {selectedApp.studentDocuments && selectedApp.studentDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedApp.studentDocuments.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <FileCheck className={`w-5 h-5 ${
                            doc.status === 'approved' ? 'text-success' : 
                            doc.status === 'rejected' ? 'text-destructive' : 'text-muted-foreground'
                          }`} />
                          <div>
                            <p className="font-medium capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            doc.status === 'approved' ? 'bg-success text-success-foreground' : 
                            doc.status === 'rejected' ? 'bg-destructive text-destructive-foreground' : 
                            'bg-warning text-warning-foreground'
                          }>
                            {doc.status === 'approved' ? 'Tasdiqlangan' : 
                             doc.status === 'rejected' ? 'Rad etilgan' : 'Kutilmoqda'}
                          </Badge>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Hujjatlar yuklanmagan</p>
                )}
              </div>

              {selectedApp.application_fee && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Ariza to'lovi</p>
                      <p className="text-xl font-bold text-primary">${selectedApp.application_fee}</p>
                    </div>
                    {selectedApp.fee_paid ? (
                      <Badge className="bg-success/10 text-success">To'langan</Badge>
                    ) : (
                      <Badge variant="outline">Kutilmoqda</Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setDetailsOpen(false);
                    setNoteDialogOpen(true);
                  }}
                >
                  <StickyNote className="w-4 h-4 mr-2" />
                  Eslatma qo'shish
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handleSendMessage(selectedApp)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Xabar yuborish
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eslatma qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ariza uchun eslatma: <strong>{selectedApp?.student_name}</strong> - {selectedApp?.university_name}
            </p>
            <Textarea
              placeholder="Ichki eslatmangizni kiriting... (talabaga ko'rinmaydi)"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
                Bekor qilish
              </Button>
              <Button onClick={handleAddNote} disabled={savingNote || !newNote.trim()}>
                {savingNote ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
