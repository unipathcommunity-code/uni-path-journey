import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AdminNotesDialog } from '@/components/admin/AdminNotesDialog';
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
} from '@/components/ui/dialog';
import {
  FileText,
  StickyNote,
  Loader2,
  RefreshCw,
  GraduationCap,
  Search,
  Eye,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Calendar,
  FileCheck,
  Globe,
  Languages,
  Download,
  ExternalLink,
  User,
  Upload,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';

interface StudentDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  status: string;
  created_at: string;
}

interface ApplicationWithDetails {
  id: string;
  status: string | null;
  program: string | null;
  intake: string | null;
  created_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  user_id: string;
  university_id: string;
  documents: any;
  application_fee: number | null;
  fee_paid: boolean | null;
  acceptance_letter_url: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    selected_country: string | null;
    preferred_language: string | null;
  } | null;
  universities: {
    name: string;
    country: string;
    city: string | null;
  } | null;
  hasAdminNotes?: boolean;
  studentDocuments?: StudentDocument[];
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-muted text-muted-foreground', icon: FileText },
  { value: 'submitted', label: 'Submitted', color: 'bg-primary text-primary-foreground', icon: Clock },
  { value: 'in_review', label: 'In Review', color: 'bg-warning text-warning-foreground', icon: Eye },
  { value: 'accepted', label: 'Accepted', color: 'bg-success text-success-foreground', icon: CheckCircle },
  { value: 'rejected', label: 'Rejected', color: 'bg-destructive text-destructive-foreground', icon: XCircle },
  { value: 'waitlisted', label: 'Waitlisted', color: 'bg-secondary text-secondary-foreground', icon: Clock },
];

export default function AdminApplications() {
  const { toast } = useToast();
  const { activeTenant } = useApp();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<ApplicationWithDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notesApp, setNotesApp] = useState<{ id: string; title: string } | null>(null);
  const [uploadingLetter, setUploadingLetter] = useState(false);

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenant?.id]);

  useEffect(() => {
    filterApplications();
  }, [applications, searchQuery, statusFilter]);

  async function getSignedUrl(filePath: string): Promise<string> {
    // If already a full URL, return as-is
    if (filePath.startsWith('http')) return filePath;
    
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    return data?.signedUrl || filePath;
  }

  async function fetchApplications() {
    setIsLoading(true);
    try {
      // Scope to the active tenant — otherwise a SuperAdmin impersonating a
      // tenant (RLS sees all rows) would load every tenant's applications.
      const tid = activeTenant?.id;
      if (!tid) {
        setApplications([]);
        return;
      }

      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          program,
          intake,
          created_at,
          submitted_at,
          reviewed_at,
          user_id,
          university_id,
          documents,
          application_fee,
          fee_paid,
          acceptance_letter_url
        `)
        .eq('tenant_id', tid)
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      if (!apps || apps.length === 0) {
        setApplications([]);
        return;
      }

      // Fetch profiles for all user_ids
      const userIds = [...new Set(apps.map((a) => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone, selected_country, preferred_language')
        .in('user_id', userIds);

      // Fetch universities for all university_ids
      const universityIds = [...new Set(apps.map((a) => a.university_id))];
      const { data: universities } = await supabase
        .from('universities')
        .select('id, name, country, city')
        .in('id', universityIds);

      // Fetch student documents for all user_ids
      const { data: studentDocs } = await supabase
        .from('documents')
        .select('id, user_id, document_type, file_name, file_url, status, created_at')
        .in('user_id', userIds);

      // Generate signed URLs for documents
      const docsWithSignedUrls = await Promise.all(
        (studentDocs || []).map(async (doc) => ({
          ...doc,
          file_url: await getSignedUrl(doc.file_url),
        }))
      );

      // Fetch admin notes
      const { data: adminNotes } = await supabase
        .from('application_admin_notes')
        .select('application_id')
        .in('application_id', apps.map((a) => a.id));

      const notesSet = new Set(adminNotes?.map((n) => n.application_id) || []);

      const enrichedApps: ApplicationWithDetails[] = apps.map((app) => ({
        ...app,
        profiles: profiles?.find((p) => p.user_id === app.user_id) || null,
        universities: universities?.find((u) => u.id === app.university_id) || null,
        hasAdminNotes: notesSet.has(app.id),
        studentDocuments: docsWithSignedUrls.filter((d) => d.user_id === app.user_id) || [],
      }));

      setApplications(enrichedApps);
    } catch (err) {
      console.error('Error fetching applications:', err);
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function filterApplications() {
    let filtered = [...applications];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.profiles?.full_name?.toLowerCase().includes(query) ||
          app.profiles?.email?.toLowerCase().includes(query) ||
          app.universities?.name?.toLowerCase().includes(query) ||
          app.program?.toLowerCase().includes(query)
      );
    }

    setFilteredApplications(filtered);
  }

  async function handleStatusChange(applicationId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: newStatus, 
          reviewed_at: new Date().toISOString() 
        })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId 
            ? { ...app, status: newStatus, reviewed_at: new Date().toISOString() } 
            : app
        )
      );

      toast({
        title: 'Status Updated',
        description: `Application status changed to ${newStatus}`,
      });
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  }

  function openNotesDialog(app: ApplicationWithDetails) {
    setNotesApp({
      id: app.id,
      title: `${app.profiles?.full_name || 'Unknown'} - ${app.universities?.name || 'Unknown University'}`,
    });
    setNotesDialogOpen(true);
  }

  async function handleUploadAcceptanceLetter(app: ApplicationWithDetails, file: File) {
    setUploadingLetter(true);
    try {
      const filePath = `acceptance-letters/${app.user_id}/${app.id}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('applications')
        .update({ acceptance_letter_url: filePath })
        .eq('id', app.id);

      if (updateError) throw updateError;

      toast({
        title: 'Muvaffaqiyatli',
        description: "Qabul xati yuklandi va talabaga ko'rinadigan bo'ldi",
      });

      setSelectedApp({ ...app, acceptance_letter_url: filePath });
      fetchApplications();
    } catch (err: any) {
      console.error('Error uploading acceptance letter:', err);
      toast({
        title: 'Xatolik',
        description: err.message || 'Qabul xatini yuklashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setUploadingLetter(false);
    }
  }

  function getStatusBadge(status: string | null) {
    const option = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
    return <Badge className={option.color}>{option.label}</Badge>;
  }

  function getDocumentCount(documents: any): number {
    if (!documents) return 0;
    return Object.keys(documents).filter(key => documents[key]).length;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Applications</h1>
          <p className="text-muted-foreground">
            {filteredApplications.length} of {applications.length} applications
          </p>
        </div>
        <Button onClick={fetchApplications} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, university..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Applications Table */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No Applications Found</h3>
          <p className="text-muted-foreground">
            {applications.length === 0
              ? 'There are no applications yet.'
              : 'No applications match your filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow key={app.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {app.profiles?.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {app.profiles?.email || '-'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="font-medium text-foreground">
                            {app.universities?.name || 'Unknown'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {app.universities?.city}, {app.universities?.country}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.program || '-'}</p>
                        <p className="text-sm text-muted-foreground">{app.intake || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-muted-foreground" />
                        <span>{getDocumentCount(app.documents)} files</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={app.status || 'draft'}
                        onValueChange={(value) => handleStatusChange(app.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {app.submitted_at
                        ? new Date(app.submitted_at).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApp(app);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={app.hasAdminNotes ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => openNotesDialog(app)}
                        >
                          <StickyNote className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Application Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Talaba Ma'lumotlari
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">F.I.O</p>
                    <p className="font-medium">{selectedApp.profiles?.full_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {selectedApp.profiles?.email || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefon</p>
                    <p className="font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {selectedApp.profiles?.phone || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tanlangan Mamlakat</p>
                    <p className="font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {selectedApp.profiles?.selected_country || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Til</p>
                    <p className="font-medium flex items-center gap-2">
                      <Languages className="w-4 h-4" />
                      {selectedApp.profiles?.preferred_language === 'uz' ? "O'zbek" : 
                       selectedApp.profiles?.preferred_language === 'ru' ? 'Русский' : 
                       selectedApp.profiles?.preferred_language === 'en' ? 'English' : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* University Info */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Universitet & Dastur
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Universitet</p>
                    <p className="font-medium">{selectedApp.universities?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Joylashuv</p>
                    <p className="font-medium">
                      {selectedApp.universities?.city}, {selectedApp.universities?.country}
                    </p>
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
                    <p className="text-sm text-muted-foreground">Ariza to'lovi</p>
                    <p className="font-medium">
                      ${selectedApp.application_fee || 0} 
                      <Badge className={selectedApp.fee_paid ? 'ml-2 bg-success text-success-foreground' : 'ml-2 bg-destructive text-destructive-foreground'}>
                        {selectedApp.fee_paid ? 'To\'langan' : 'To\'lanmagan'}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>

              {/* Student Documents from documents table */}
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

              {/* Dates & Status */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-foreground">Timeline</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(selectedApp.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-medium">
                      {selectedApp.submitted_at
                        ? new Date(selectedApp.submitted_at).toLocaleDateString()
                        : 'Not submitted'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Reviewed</p>
                    <p className="font-medium">
                      {selectedApp.reviewed_at
                        ? new Date(selectedApp.reviewed_at).toLocaleDateString()
                        : 'Not reviewed'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(selectedApp.status)}
                  </div>
                </div>
              </div>

              {/* Acceptance Letter Upload (only for accepted apps) */}
              {selectedApp.status === 'accepted' && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-yellow-600" />
                    Qabul xati (Acceptance Letter)
                  </h3>
                  {selectedApp.acceptance_letter_url ? (
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-success" />
                        <span className="text-sm font-medium">Qabul xati yuklangan</span>
                      </div>
                      <div className="flex gap-2">
                        <label className="cursor-pointer">
                          <Button variant="outline" size="sm" className="gap-1" disabled={uploadingLetter} asChild>
                            <span>
                              <Upload className="w-4 h-4" />
                              Yangilash
                            </span>
                          </Button>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadAcceptanceLetter(selectedApp, file);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="border-2 border-dashed border-yellow-300 dark:border-yellow-700 rounded-xl p-6 text-center hover:bg-yellow-50/50 dark:hover:bg-yellow-950/20 transition-colors">
                        {uploadingLetter ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
                            <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                            <p className="font-medium text-foreground">Qabul xatini yuklang</p>
                            <p className="text-sm text-muted-foreground mt-1">PDF, JPG yoki PNG formatda</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadAcceptanceLetter(selectedApp, file);
                        }}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Select
                  value={selectedApp.status || 'draft'}
                  onValueChange={(value) => {
                    handleStatusChange(selectedApp.id, value);
                    setSelectedApp({ ...selectedApp, status: value });
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    openNotesDialog(selectedApp);
                    setDetailsOpen(false);
                  }}
                  className="gap-2"
                >
                  <StickyNote className="w-4 h-4" />
                  Add Notes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin Notes Dialog */}
      {notesApp && (
        <AdminNotesDialog
          applicationId={notesApp.id}
          applicationTitle={notesApp.title}
          open={notesDialogOpen}
          onOpenChange={(open) => {
            setNotesDialogOpen(open);
            if (!open) {
              fetchApplications();
            }
          }}
        />
      )}
    </div>
  );
}