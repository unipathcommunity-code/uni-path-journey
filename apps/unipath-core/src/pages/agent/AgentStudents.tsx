import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  FileText,
  StickyNote,
  Send,
  Eye,
  GraduationCap,
  Calendar,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronRight,
  Globe,
  User,
  FileCheck,
  Folder,
} from 'lucide-react';
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

interface StudentApplication {
  id: string;
  status: string;
  program: string | null;
  intake: string | null;
  created_at: string;
  submitted_at: string | null;
  application_fee: number | null;
  fee_paid: boolean | null;
  university: {
    name: string;
    country: string;
  } | null;
}

interface AssignedStudent {
  id: string;
  student_id: string;
  assigned_at: string;
  status: string;
  notes: string | null;
  profile: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    telegram_username: string | null;
    selected_country: string | null;
    preferred_language: string | null;
  } | null;
  applications: StudentApplication[];
  documents: StudentDocument[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  draft: { bg: 'bg-muted', text: 'text-muted-foreground', icon: Clock },
  submitted: { bg: 'bg-primary/10', text: 'text-primary', icon: FileCheck },
  in_review: { bg: 'bg-warning/10', text: 'text-warning', icon: AlertCircle },
  accepted: { bg: 'bg-success/10', text: 'text-success', icon: CheckCircle2 },
  rejected: { bg: 'bg-destructive/10', text: 'text-destructive', icon: XCircle },
  pending: { bg: 'bg-warning/10', text: 'text-warning', icon: Clock },
  approved: { bg: 'bg-success/10', text: 'text-success', icon: CheckCircle2 },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Qoralama",
  submitted: "Yuborilgan",
  in_review: "Ko'rib chiqilmoqda",
  accepted: "Qabul qilindi",
  rejected: "Rad etildi",
  pending: "Kutilmoqda",
  approved: "Tasdiqlangan",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: "Pasport",
  diploma: "Diplom",
  transcript: "Transkript",
  photo: "Rasm",
  recommendation: "Tavsiyaoma",
  motivation_letter: "Motivatsion xat",
  bank_statement: "Bank ko'chirmasi",
  other: "Boshqa",
};

export default function AgentStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<AssignedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<AssignedStudent | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [agentNotes, setAgentNotes] = useState<Array<{id: string; note: string; note_type: string; created_at: string}>>([]);

  useEffect(() => {
    if (user) {
      fetchAssignedStudents();
    }
  }, [user]);

  const getSignedUrl = async (filePath: string): Promise<string> => {
    if (filePath.startsWith('http')) return filePath;
    
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600);
    
    return data?.signedUrl || filePath;
  };

  const fetchAssignedStudents = async () => {
    try {
      const { data: assignmentsData, error } = await supabase
        .from('agent_students')
        .select('*')
        .eq('agent_id', user?.id)
        .eq('status', 'active');

      if (error) throw error;

      if (!assignmentsData?.length) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const studentIds = assignmentsData.map(a => a.student_id);

      // Fetch profiles, applications, and documents in parallel
      const [profilesResult, applicationsResult, documentsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, full_name, email, phone, telegram_username, selected_country, preferred_language')
          .in('user_id', studentIds),
        supabase
          .from('applications')
          .select('id, user_id, status, program, intake, created_at, submitted_at, application_fee, fee_paid, university_id')
          .in('user_id', studentIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('documents')
          .select('id, user_id, document_type, file_name, file_url, status, created_at')
          .in('user_id', studentIds)
          .order('created_at', { ascending: false }),
      ]);

      // Fetch university info for applications
      const universityIds = [...new Set((applicationsResult.data || []).map(a => a.university_id))];
      const { data: universities } = await supabase
        .from('universities')
        .select('id, name, country')
        .in('id', universityIds);

      // Generate signed URLs for documents
      const docsWithSignedUrls = await Promise.all(
        (documentsResult.data || []).map(async (doc) => ({
          ...doc,
          file_url: await getSignedUrl(doc.file_url),
        }))
      );

      // Build the enriched student list
      const studentsWithDetails = assignmentsData.map((assignment) => {
        const profile = profilesResult.data?.find(p => p.user_id === assignment.student_id);
        const studentApps = (applicationsResult.data || [])
          .filter(a => a.user_id === assignment.student_id)
          .map(app => ({
            ...app,
            university: universities?.find(u => u.id === app.university_id) || null,
          }));
        const studentDocs = docsWithSignedUrls.filter(d => d.user_id === assignment.student_id);

        return {
          ...assignment,
          profile: profile || null,
          applications: studentApps,
          documents: studentDocs,
        };
      });

      setStudents(studentsWithDetails);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Talabalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentNotes = async (studentId: string) => {
    const { data } = await supabase
      .from('agent_notes')
      .select('id, note, note_type, created_at')
      .eq('agent_id', user?.id)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    
    setAgentNotes(data || []);
  };

  const handleViewDetails = async (student: AssignedStudent) => {
    setSelectedStudent(student);
    await fetchAgentNotes(student.student_id);
    setDetailsOpen(true);
  };

  const handleAddNote = async () => {
    if (!selectedStudent || !newNote.trim()) return;

    setSavingNote(true);
    try {
      const { error } = await supabase.from('agent_notes').insert({
        agent_id: user?.id,
        student_id: selectedStudent.student_id,
        note: newNote,
        note_type: 'general',
        is_internal: true,
      });

      if (error) throw error;

      toast.success("Eslatma qo'shildi");
      setNoteDialogOpen(false);
      setNewNote('');
      await fetchAgentNotes(selectedStudent.student_id);
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error("Eslatma qo'shishda xatolik");
    } finally {
      setSavingNote(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedStudent || !messageText.trim()) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: selectedStudent.student_id,
        title: 'Agent xabari',
        message: messageText,
        type: 'info',
        link: '/student/dashboard',
      });

      if (error) throw error;

      toast.success('Xabar yuborildi');
      setMessageDialogOpen(false);
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Xabar yuborishda xatolik');
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_COLORS[status] || STATUS_COLORS.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.bg} ${config.text} gap-1`}>
        <Icon className="w-3 h-3" />
        {STATUS_LABELS[status] || status}
      </Badge>
    );
  };

  const filteredStudents = students.filter((student) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      student.profile?.full_name?.toLowerCase().includes(searchLower) ||
      student.profile?.email?.toLowerCase().includes(searchLower) ||
      student.profile?.selected_country?.toLowerCase().includes(searchLower)
    );
  });

  // Stats
  const totalApplications = students.reduce((acc, s) => acc + s.applications.length, 0);
  const totalDocuments = students.reduce((acc, s) => acc + s.documents.length, 0);
  const pendingDocuments = students.reduce((acc, s) => acc + s.documents.filter(d => d.status === 'pending').length, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Talabalarim</h1>
        <p className="text-muted-foreground">
          {students.length} ta talaba sizga tayinlangan
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-sm text-muted-foreground">Talabalar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-success/10">
                <GraduationCap className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalApplications}</p>
                <p className="text-sm text-muted-foreground">Arizalar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-warning/10">
                <FileText className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDocuments}</p>
                <p className="text-sm text-muted-foreground">Hujjatlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-destructive/10">
                <Clock className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingDocuments}</p>
                <p className="text-sm text-muted-foreground">Kutilmoqda</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Talabalarni qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Talabalar tayinlanmagan</h3>
              <p className="text-muted-foreground">
                Admin sizga talabalarni tayinlaganda ular bu yerda ko'rinadi
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="card-hover overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  {/* Student Info */}
                  <div className="flex-1 p-5 border-b lg:border-b-0 lg:border-r border-border">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-semibold text-lg">
                          {student.profile?.full_name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {student.profile?.full_name || 'Noma\'lum'}
                        </h3>
                        <div className="mt-2 space-y-1">
                          {student.profile?.email && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5" />
                              {student.profile.email}
                            </p>
                          )}
                          {student.profile?.phone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5" />
                              {student.profile.phone}
                            </p>
                          )}
                          {student.profile?.telegram_username && (
                            <a
                              href={`https://t.me/${student.profile.telegram_username.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary flex items-center gap-2 hover:underline"
                            >
                              <Send className="w-3.5 h-3.5" />
                              {student.profile.telegram_username}
                            </a>
                          )}
                          {student.profile?.selected_country && (
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Globe className="w-3.5 h-3.5" />
                              {student.profile.selected_country}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Tayinlangan: {format(new Date(student.assigned_at), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex lg:flex-col justify-around lg:justify-center gap-4 p-4 lg:w-48 bg-muted/30">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{student.applications.length}</p>
                      <p className="text-xs text-muted-foreground">Ariza</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{student.documents.length}</p>
                      <p className="text-xs text-muted-foreground">Hujjat</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col items-center justify-center gap-2 p-4 bg-muted/20">
                    <Button
                      onClick={() => handleViewDetails(student)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Batafsil
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Student Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              {selectedStudent?.profile?.full_name || 'Talaba'}
            </DialogTitle>
            <DialogDescription>
              Talabaning barcha ma'lumotlari, hujjatlari va arizalari
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info" className="gap-2">
                  <User className="w-4 h-4" />
                  Ma'lumot
                </TabsTrigger>
                <TabsTrigger value="applications" className="gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Arizalar ({selectedStudent.applications.length})
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-2">
                  <Folder className="w-4 h-4" />
                  Hujjatlar ({selectedStudent.documents.length})
                </TabsTrigger>
                <TabsTrigger value="notes" className="gap-2">
                  <StickyNote className="w-4 h-4" />
                  Eslatmalar
                </TabsTrigger>
              </TabsList>

              {/* Info Tab */}
              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Shaxsiy Ma'lumotlar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">To'liq ism</p>
                        <p className="font-medium">{selectedStudent.profile?.full_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedStudent.profile?.email || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Telefon</p>
                        <p className="font-medium">{selectedStudent.profile?.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tanlangan mamlakat</p>
                        <p className="font-medium">{selectedStudent.profile?.selected_country || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Afzal til</p>
                        <p className="font-medium">
                          {selectedStudent.profile?.preferred_language === 'uz' ? "O'zbekcha" : 
                           selectedStudent.profile?.preferred_language === 'ru' ? 'Ruscha' : 
                           selectedStudent.profile?.preferred_language === 'en' ? 'Inglizcha' : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tayinlangan sana</p>
                        <p className="font-medium">{format(new Date(selectedStudent.assigned_at), 'dd MMMM yyyy')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setNoteDialogOpen(true)}
                    className="gap-2"
                  >
                    <StickyNote className="w-4 h-4" />
                    Eslatma qo'shish
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setMessageDialogOpen(true)}
                    className="gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Xabar yuborish
                  </Button>
                </div>
              </TabsContent>

              {/* Applications Tab */}
              <TabsContent value="applications" className="space-y-4">
                {selectedStudent.applications.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <GraduationCap className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Hali arizalar yo'q</p>
                    </CardContent>
                  </Card>
                ) : (
                  selectedStudent.applications.map((app) => (
                    <Card key={app.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-primary/10">
                              <GraduationCap className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{app.university?.name || 'Noma\'lum universitet'}</h4>
                              <p className="text-sm text-muted-foreground">{app.university?.country}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {app.program && (
                                  <Badge variant="outline">{app.program}</Badge>
                                )}
                                {app.intake && (
                                  <Badge variant="outline" className="gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {app.intake}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            {getStatusBadge(app.status || 'draft')}
                            {app.application_fee && (
                              <div className="text-sm">
                                <p className="font-medium">${app.application_fee}</p>
                                {app.fee_paid ? (
                                  <Badge className="bg-success/10 text-success text-xs">To'langan</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">Kutilmoqda</Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                          Yaratilgan: {format(new Date(app.created_at), 'dd MMM yyyy HH:mm')}
                          {app.submitted_at && (
                            <span className="ml-4">
                              Yuborilgan: {format(new Date(app.submitted_at), 'dd MMM yyyy HH:mm')}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4">
                {selectedStudent.documents.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Hali hujjatlar yuklanmagan</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {selectedStudent.documents.map((doc) => (
                      <Card key={doc.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-muted">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                                </p>
                                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                  {doc.file_name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {getStatusBadge(doc.status)}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(doc.file_url, '_blank')}
                                title="Ko'rish"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const a = document.createElement('a');
                                  a.href = doc.file_url;
                                  a.download = doc.file_name;
                                  a.target = '_blank';
                                  a.click();
                                }}
                                title="Yuklab olish"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Yuklangan: {format(new Date(doc.created_at), 'dd MMM yyyy HH:mm')}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setNoteDialogOpen(true)} className="gap-2">
                    <StickyNote className="w-4 h-4" />
                    Yangi eslatma
                  </Button>
                </div>
                {agentNotes.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <StickyNote className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Hali eslatmalar yo'q</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {agentNotes.map((note) => (
                      <Card key={note.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-warning/10">
                              <StickyNote className="w-4 h-4 text-warning" />
                            </div>
                            <div className="flex-1">
                              <p className="text-foreground whitespace-pre-wrap">{note.note}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs">{note.note_type}</Badge>
                                <span>{format(new Date(note.created_at), 'dd MMM yyyy HH:mm')}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ichki eslatma qo'shish</DialogTitle>
            <DialogDescription>
              Bu eslatma faqat sizga ko'rinadi (talabaga ko'rinmaydi)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Eslatmangizni kiriting..."
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

      {/* Send Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Talabaga xabar yuborish</DialogTitle>
            <DialogDescription>
              {selectedStudent?.profile?.full_name} ga xabar yuborish
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Xabaringizni kiriting..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
                Bekor qilish
              </Button>
              <Button onClick={handleSendMessage} disabled={sendingMessage || !messageText.trim()}>
                {sendingMessage ? 'Yuborilmoqda...' : 'Yuborish'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
