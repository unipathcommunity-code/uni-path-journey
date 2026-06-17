import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import {
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FolderOpen,
  User,
  File,
  ExternalLink,
  AlertTriangle,
  Send,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { AssignAgentDialog } from '@/components/admin/AssignAgentDialog';

interface DocumentRecord {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface AgentAssignment {
  agent_id: string;
  agent_name: string | null;
  agent_email: string | null;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface DocumentWithProfile extends DocumentRecord {
  profile: Profile | null;
}

interface UserGroup {
  profile: Profile | null;
  documents: DocumentWithProfile[];
  assigned_agent?: AgentAssignment | null;
}

const DOCUMENT_LABELS: Record<string, string> = {
  passport: 'Passport Copy',
  id_card: 'ID Card',
  diploma: 'Diploma / Certificate',
  transcript: 'Academic Transcript',
  cv: 'CV / Resume',
  sop: 'Statement of Purpose',
  photo: 'Photo (3x4)',
  recommendation: 'Recommendation Letter',
  language_cert: 'Language Certificate',
  bank_statement: 'Bank Statement',
};

export default function AdminDocuments() {
  const { toast } = useToast();
  const { activeTenant } = useApp();
  const [documents, setDocuments] = useState<DocumentWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDoc, setSelectedDoc] = useState<DocumentWithProfile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStudentForAssign, setSelectedStudentForAssign] = useState<{
    user_id: string;
    full_name: string | null;
    email: string | null;
    current_agent_id?: string | null;
  } | null>(null);
  const [agentAssignments, setAgentAssignments] = useState<Record<string, AgentAssignment>>({});
  const [viewingDocUrl, setViewingDocUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
    fetchAgentAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenant?.id]);

  async function fetchAgentAssignments() {
    // Fetch agent assignments
    const { data: assignments } = await supabase
      .from('agent_students')
      .select('student_id, agent_id')
      .eq('status', 'active');

    if (assignments && assignments.length > 0) {
      // Get agent profiles
      const agentIds = [...new Set(assignments.map(a => a.agent_id))];
      const { data: agentProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', agentIds);

      const assignmentMap: Record<string, AgentAssignment> = {};
      assignments.forEach(a => {
        const agentProfile = agentProfiles?.find(p => p.user_id === a.agent_id);
        assignmentMap[a.student_id] = {
          agent_id: a.agent_id,
          agent_name: agentProfile?.full_name || null,
          agent_email: agentProfile?.email || null,
        };
      });
      setAgentAssignments(assignmentMap);
    }
  }

  async function fetchDocuments() {
    // Scope to the active tenant — otherwise a SuperAdmin impersonating a
    // tenant (RLS sees all rows) would load every tenant's documents.
    const tid = activeTenant?.id;
    if (!tid) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const { data: docs, error } = await supabase
      .from('documents')
      .select('*')
      .eq('tenant_id', tid)
      .order('created_at', { ascending: false });

    if (!error && docs) {
      // Fetch profiles for each user
      const userIds = [...new Set(docs.map(d => d.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const docsWithProfiles: DocumentWithProfile[] = docs.map(doc => ({
        ...doc,
        profile: profiles?.find(p => p.user_id === doc.user_id) || null,
      }));

      setDocuments(docsWithProfiles);
    }
    setLoading(false);
  }

  // Generate signed URL for viewing document
  async function getSignedUrl(filePath: string): Promise<string | null> {
    // If it's already a full URL, return as-is
    if (filePath.startsWith('http')) {
      return filePath;
    }
    
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    return data.signedUrl;
  }

  async function handleViewDocument(doc: DocumentWithProfile) {
    if (!doc.file_url) return;
    
    const signedUrl = await getSignedUrl(doc.file_url);
    if (signedUrl) {
      setViewingDocUrl(signedUrl);
      setSelectedDoc(doc);
      setDetailsOpen(true);
    } else {
      toast({
        title: 'Error',
        description: 'Could not load document',
        variant: 'destructive',
      });
    }
  }

  const handleApprove = async (doc: DocumentWithProfile) => {
    setUpdating(true);
    const { error } = await supabase
      .from('documents')
      .update({ 
        status: 'approved',
        rejection_reason: null,
      })
      .eq('id', doc.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve document',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Document Approved',
        description: `${DOCUMENT_LABELS[doc.document_type] || doc.document_type} has been approved`,
      });
      fetchDocuments();
      setDetailsOpen(false);
    }
    setUpdating(false);
  };

  const handleReject = async () => {
    if (!selectedDoc || !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    setUpdating(true);
    const { error } = await supabase
      .from('documents')
      .update({ 
        status: 'rejected',
        rejection_reason: rejectionReason.trim(),
      })
      .eq('id', selectedDoc.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject document',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Document Rejected',
        description: `${DOCUMENT_LABELS[selectedDoc.document_type] || selectedDoc.document_type} has been rejected`,
      });
      fetchDocuments();
      setRejectDialogOpen(false);
      setDetailsOpen(false);
      setRejectionReason('');
    }
    setUpdating(false);
  };

  const handleDeleteDocument = async (doc: DocumentWithProfile) => {
    setDeleting(true);
    try {
      // Delete file from storage if it's in the documents bucket
      if (doc.file_url && !doc.file_url.startsWith('http')) {
        await supabase.storage.from('documents').remove([doc.file_url]);
      }

      // Delete the document record
      const { error } = await supabase.from('documents').delete().eq('id', doc.id);

      if (error) throw error;

      toast({
        title: 'Hujjat o\'chirildi',
        description: `${DOCUMENT_LABELS[doc.document_type] || doc.document_type} muvaffaqiyatli o'chirildi`,
      });
      fetchDocuments();
      setDeleteDialogOpen(false);
      setDetailsOpen(false);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Xatolik',
        description: error.message || 'Hujjatni o\'chirishda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (doc: DocumentWithProfile) => {
    setSelectedDoc(doc);
    setDeleteDialogOpen(true);
  };

  const viewDetails = (doc: DocumentWithProfile) => {
    handleViewDocument(doc);
  };

  const openRejectDialog = (doc: DocumentWithProfile) => {
    setSelectedDoc(doc);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-warning" />;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group documents by user
  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    const key = doc.user_id;
    if (!acc[key]) {
      acc[key] = {
        profile: doc.profile,
        documents: [],
        assigned_agent: agentAssignments[doc.user_id] || null,
      };
    }
    acc[key].documents.push(doc);
    return acc;
  }, {} as Record<string, UserGroup>);

  const openAssignDialog = (userId: string, profile: Profile | null) => {
    setSelectedStudentForAssign({
      user_id: userId,
      full_name: profile?.full_name || null,
      email: profile?.email || null,
      current_agent_id: agentAssignments[userId]?.agent_id || null,
    });
    setAssignDialogOpen(true);
  };

  const handleAssigned = () => {
    fetchAgentAssignments();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Student Documents</h1>
        <p className="text-muted-foreground">Review and approve student uploaded documents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Documents</p>
          <p className="text-2xl font-bold text-foreground">{documents.length}</p>
        </div>
        <div className="bg-warning/10 rounded-xl border border-warning/20 p-4">
          <p className="text-sm text-warning">Pending Review</p>
          <p className="text-2xl font-bold text-warning">
            {documents.filter(d => d.status === 'pending').length}
          </p>
        </div>
        <div className="bg-success/10 rounded-xl border border-success/20 p-4">
          <p className="text-sm text-success">Approved</p>
          <p className="text-2xl font-bold text-success">
            {documents.filter(d => d.status === 'approved').length}
          </p>
        </div>
        <div className="bg-destructive/10 rounded-xl border border-destructive/20 p-4">
          <p className="text-sm text-destructive">Rejected</p>
          <p className="text-2xl font-bold text-destructive">
            {documents.filter(d => d.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents List */}
      {Object.keys(groupedDocuments).length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Hujjatlar topilmadi</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Qidiruv natijalariga mos hujjat yo\'q. Filtrlarni o\'zgartirib ko\'ring.'
              : 'Hozircha hech qanday talaba hujjat yuklamagan. Talabalar o\'z kabinetidan hujjatlarni yuklashi kerak.'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 max-w-md mx-auto">
              <p className="text-sm text-primary">
                <strong>Eslatma:</strong> Talabalar hujjatlarni yuklash uchun o'z kabinetiga kirishlari kerak:
                <br/>
                <code className="bg-primary/10 px-2 py-1 rounded mt-1 inline-block">/student/documents</code>
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDocuments).map(([userId, { profile, documents: userDocs, assigned_agent }]) => (
            <div key={userId} className="bg-card rounded-2xl border border-border overflow-hidden">
              {/* User Header */}
              <div className="bg-muted/50 px-6 py-4 border-b border-border flex flex-wrap items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">
                    {profile?.full_name || 'Unknown Student'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{profile?.email || 'No email'}</p>
                </div>
                
                {/* Agent Assignment Info */}
                <div className="flex items-center gap-3">
                  {assigned_agent ? (
                    <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-lg px-3 py-1.5">
                      <UserCheck className="w-4 h-4 text-success" />
                      <div className="text-sm">
                        <span className="font-medium text-success">{assigned_agent.agent_name || 'Agent'}</span>
                      </div>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-warning border-warning/30">
                      Tayinlanmagan
                    </Badge>
                  )}
                  <Badge variant="outline">{userDocs.length} documents</Badge>
                </div>

                {/* Assign to Agent Button */}
                <Button
                  variant={assigned_agent ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => openAssignDialog(userId, profile)}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  {assigned_agent ? "O'zgartirish" : 'Agentga yuborish'}
                </Button>
              </div>

              {/* User's Documents */}
              <div className="divide-y divide-border">
                {userDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <File className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">
                        {DOCUMENT_LABELS[doc.document_type] || doc.document_type}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {doc.file_name} • {((doc.file_size || 0) / 1024 / 1024).toFixed(2)}MB
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(doc.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewDetails(doc)}
                        className="gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const url = await getSignedUrl(doc.file_url);
                          if (url) {
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = doc.file_name;
                            a.target = '_blank';
                            a.click();
                          }
                        }}
                        className="gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Download
                      </Button>
                      {doc.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(doc)}
                            className="text-success hover:text-success gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRejectDialog(doc)}
                            className="text-destructive hover:text-destructive gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(doc)}
                        className="text-destructive hover:text-destructive gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        O'chirish
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Details + Quick View Modal */}
      <Dialog open={detailsOpen} onOpenChange={(open) => {
        setDetailsOpen(open);
        if (!open) setViewingDocUrl(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Document Quick View</DialogTitle>
            <DialogDescription>
              Preview document and take action
            </DialogDescription>
          </DialogHeader>

          {selectedDoc && (
            <div className="flex gap-4 flex-1 overflow-hidden py-2">
              {/* Preview Pane */}
              <div className="flex-1 min-w-0 bg-muted rounded-xl overflow-hidden flex items-center justify-center">
                {viewingDocUrl ? (
                  (() => {
                    const ext = selectedDoc.file_name.split('.').pop()?.toLowerCase();
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
                    const isPdf = ext === 'pdf';
                    if (isImage) {
                      return <img src={viewingDocUrl} alt={selectedDoc.file_name} className="max-h-[60vh] max-w-full object-contain" />;
                    }
                    if (isPdf) {
                      return <iframe src={viewingDocUrl} className="w-full h-[60vh] border-0" title="Document Preview" />;
                    }
                    return (
                      <div className="text-center p-8">
                        <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">Preview not available for this file type</p>
                        <a href={viewingDocUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-sm underline mt-2 inline-block">Open in new tab</a>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-muted-foreground">Loading preview...</div>
                )}
              </div>

              {/* Info Sidebar */}
              <div className="w-64 flex-shrink-0 space-y-3 overflow-y-auto">
                <div className="bg-muted/50 rounded-xl p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{DOCUMENT_LABELS[selectedDoc.document_type] || selectedDoc.document_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-medium">{((selectedDoc.file_size || 0) / 1024 / 1024).toFixed(2)}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    {getStatusBadge(selectedDoc.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uploaded</span>
                    <span className="font-medium text-xs">{new Date(selectedDoc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Student Info */}
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Uploaded by</p>
                  <p className="font-medium text-sm">{selectedDoc.profile?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{selectedDoc.profile?.email}</p>
                </div>

                {selectedDoc.status === 'rejected' && selectedDoc.rejection_reason && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                    <p className="font-medium text-destructive text-xs">Rejection Reason</p>
                    <p className="text-xs text-destructive/80 mt-1">{selectedDoc.rejection_reason}</p>
                  </div>
                )}

                {/* One-Click Approve/Reject */}
                <div className="space-y-2 pt-2 border-t border-border">
                  {selectedDoc.status === 'pending' && (
                    <>
                      <Button className="w-full gap-2 bg-success hover:bg-success/90" size="sm" onClick={() => handleApprove(selectedDoc)} disabled={updating}>
                        <CheckCircle className="w-4 h-4" /> Approve
                      </Button>
                      <Button variant="outline" className="w-full gap-2" size="sm" onClick={() => { setDetailsOpen(false); openRejectDialog(selectedDoc); }} disabled={updating}>
                        <XCircle className="w-4 h-4" /> Reject
                      </Button>
                    </>
                  )}
                  <Button variant="destructive" className="w-full gap-2" size="sm" onClick={() => { setDetailsOpen(false); openDeleteDialog(selectedDoc); }} disabled={deleting}>
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this document. The student will see this message.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={updating || !rejectionReason.trim()}
            >
              {updating ? 'Rejecting...' : 'Reject Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Hujjatni o'chirish
            </DialogTitle>
            <DialogDescription>
              Bu amalni ortga qaytarib bo'lmaydi. Hujjat butunlay o'chiriladi.
            </DialogDescription>
          </DialogHeader>

          {selectedDoc && (
            <div className="py-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                <p className="font-medium text-foreground">
                  {DOCUMENT_LABELS[selectedDoc.document_type] || selectedDoc.document_type}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{selectedDoc.file_name}</p>
                <p className="text-sm text-muted-foreground">
                  Talaba: {selectedDoc.profile?.full_name || 'Noma\'lum'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedDoc && handleDeleteDocument(selectedDoc)}
              disabled={deleting}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'O\'chirilmoqda...' : 'O\'chirish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Agent Dialog */}
      <AssignAgentDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        student={selectedStudentForAssign ? {
          user_id: selectedStudentForAssign.user_id,
          full_name: selectedStudentForAssign.full_name,
          email: selectedStudentForAssign.email,
        } : null}
        currentAgentId={selectedStudentForAssign?.current_agent_id}
        onAssigned={handleAssigned}
      />
    </div>
  );
}
