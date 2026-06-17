import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  AlertCircle,
  File,
  Image,
  Loader2,
} from 'lucide-react';

interface DocumentRecord {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

interface DocumentUI {
  id: string;
  name: string;
  type: string;
  required: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'not_uploaded';
  dbId?: string;
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
  uploadedAt?: string;
  rejectionReason?: string;
}

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const DOCUMENT_TYPES = [
  { id: '1', name: 'Passport', nameUz: 'Passport', nameRu: 'Паспорт', type: 'passport', required: true },
  { id: '2', name: 'ID Card', nameUz: 'ID karta', nameRu: 'Удостоверение', type: 'id_card', required: true },
  { id: '3', name: 'Diploma / Certificate', nameUz: 'Diplom / Sertifikat', nameRu: 'Диплом / Сертификат', type: 'diploma', required: true },
  { id: '4', name: 'Transcript', nameUz: 'Transkript', nameRu: 'Транскрипт', type: 'transcript', required: true },
  { id: '5', name: 'CV / Resume', nameUz: 'CV / Rezyume', nameRu: 'CV / Резюме', type: 'cv', required: true },
  { id: '6', name: 'Statement of Purpose (SOP)', nameUz: 'Motivatsion xat (SOP)', nameRu: 'Мотивационное письмо', type: 'sop', required: true },
  { id: '7', name: 'Recommendation Letters', nameUz: 'Tavsiya xatlari', nameRu: 'Рекомендательные письма', type: 'recommendation', required: false },
  { id: '8', name: 'Bank Statement', nameUz: 'Bank ko\'chirmasi', nameRu: 'Выписка из банка', type: 'bank_statement', required: true },
  { id: '9', name: 'Photo (3x4)', nameUz: 'Fotosurat (3x4)', nameRu: 'Фото (3x4)', type: 'photo', required: true },
  { id: '10', name: 'Language Certificate', nameUz: 'Til sertifikati', nameRu: 'Сертификат по языку', type: 'language_cert', required: false },
];

const pageLabels = {
  en: {
    subtitle: 'Upload and manage your application documents',
    uploadProgress: 'Upload Progress',
    ofDocs: (up: number, total: number, req: number, reqTotal: number) => `${up} of ${total} documents uploaded (${req} of ${reqTotal} required)`,
    approved: 'Approved',
    rejected: 'Rejected',
    pendingReview: 'Pending Review',
    notUploaded: 'Not Uploaded',
    upload: 'Upload',
    replace: 'Replace',
    remove: 'Remove',
    reason: 'Reason',
    docRequirements: 'Document Requirements',
    reqFormats: 'Accepted formats: PDF, JPG, PNG',
    reqSize: 'Maximum file size: 10MB per document',
    reqRequired: 'are required',
    reqClear: 'Ensure all documents are clear and legible',
    reqReview: 'Documents will be reviewed within 2-3 business days',
    invalidType: 'Invalid file type',
    invalidTypeDesc: 'Please upload PDF, JPG, or PNG files only.',
    fileTooLarge: 'File too large',
    fileTooLargeDesc: 'Maximum file size is 10MB.',
    docUploaded: 'Document uploaded',
    docReplaced: 'Document replaced',
    uploadedSuccess: 'has been uploaded successfully.',
    uploadFailed: 'Upload failed',
    uploadFailedDesc: 'Failed to upload document. Please try again.',
    docRemoved: 'Document removed',
    docRemovedDesc: 'The document has been deleted.',
    removeFailed: 'Error',
    removeFailedDesc: 'Failed to remove document.',
    loading: 'Loading documents...',
    markedWith: 'Documents marked with',
  },
  uz: {
    subtitle: 'Ariza hujjatlaringizni yuklang va boshqaring',
    uploadProgress: 'Yuklash jarayoni',
    ofDocs: (up: number, total: number, req: number, reqTotal: number) => `${total} ta hujjatdan ${up} tasi yuklangan (${reqTotal} ta majburiydan ${req} tasi)`,
    approved: 'Tasdiqlangan',
    rejected: 'Rad etilgan',
    pendingReview: 'Ko\'rib chiqilmoqda',
    notUploaded: 'Yuklanmagan',
    upload: 'Yuklash',
    replace: 'Almashtirish',
    remove: 'O\'chirish',
    reason: 'Sabab',
    docRequirements: 'Hujjat talablari',
    reqFormats: 'Qabul qilinadigan formatlar: PDF, JPG, PNG',
    reqSize: 'Maksimal fayl hajmi: 10MB',
    reqRequired: 'majburiy',
    reqClear: 'Barcha hujjatlar aniq va o\'qilishi mumkin bo\'lsin',
    reqReview: 'Hujjatlar 2-3 ish kuni ichida ko\'rib chiqiladi',
    invalidType: 'Noto\'g\'ri fayl turi',
    invalidTypeDesc: 'Faqat PDF, JPG yoki PNG fayl yuklang.',
    fileTooLarge: 'Fayl juda katta',
    fileTooLargeDesc: 'Maksimal fayl hajmi 10MB.',
    docUploaded: 'Hujjat yuklandi',
    docReplaced: 'Hujjat almashtirildi',
    uploadedSuccess: 'muvaffaqiyatli yuklandi.',
    uploadFailed: 'Yuklash xatosi',
    uploadFailedDesc: 'Hujjatni yuklashda xatolik. Qaytadan urinib ko\'ring.',
    docRemoved: 'Hujjat o\'chirildi',
    docRemovedDesc: 'Hujjat muvaffaqiyatli o\'chirildi.',
    removeFailed: 'Xatolik',
    removeFailedDesc: 'Hujjatni o\'chirishda xatolik.',
    loading: 'Hujjatlar yuklanmoqda...',
    markedWith: 'Belgisi bor hujjatlar',
  },
  ru: {
    subtitle: 'Загружайте и управляйте документами для заявки',
    uploadProgress: 'Прогресс загрузки',
    ofDocs: (up: number, total: number, req: number, reqTotal: number) => `${up} из ${total} документов загружено (${req} из ${reqTotal} обязательных)`,
    approved: 'Одобрено',
    rejected: 'Отклонено',
    pendingReview: 'На проверке',
    notUploaded: 'Не загружено',
    upload: 'Загрузить',
    replace: 'Заменить',
    remove: 'Удалить',
    reason: 'Причина',
    docRequirements: 'Требования к документам',
    reqFormats: 'Принимаемые форматы: PDF, JPG, PNG',
    reqSize: 'Максимальный размер файла: 10MB',
    reqRequired: 'обязательны',
    reqClear: 'Убедитесь, что все документы четкие и читаемые',
    reqReview: 'Документы проверяются в течение 2-3 рабочих дней',
    invalidType: 'Неверный формат файла',
    invalidTypeDesc: 'Загрузите файл в формате PDF, JPG или PNG.',
    fileTooLarge: 'Файл слишком большой',
    fileTooLargeDesc: 'Максимальный размер файла — 10MB.',
    docUploaded: 'Документ загружен',
    docReplaced: 'Документ заменен',
    uploadedSuccess: 'успешно загружен.',
    uploadFailed: 'Ошибка загрузки',
    uploadFailedDesc: 'Не удалось загрузить документ. Попробуйте снова.',
    docRemoved: 'Документ удален',
    docRemovedDesc: 'Документ был успешно удален.',
    removeFailed: 'Ошибка',
    removeFailedDesc: 'Не удалось удалить документ.',
    loading: 'Загрузка документов...',
    markedWith: 'Документы с пометкой',
  },
};

export default function StudentDocuments() {
  const { language } = useApp();
  const { user } = useAuth();
  const t = useTranslation(language);
  const l = pageLabels[language];
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const getDocName = (dt: typeof DOCUMENT_TYPES[0]) => {
    return language === 'uz' ? dt.nameUz : language === 'ru' ? dt.nameRu : dt.name;
  };

  const [documents, setDocuments] = useState<DocumentUI[]>(
    DOCUMENT_TYPES.map(dt => ({
      id: dt.id,
      name: dt.name,
      type: dt.type,
      required: dt.required,
      status: 'not_uploaded' as const,
    }))
  );

  // Fetch existing documents and subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    async function fetchDocuments() {
      const { data: docs, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching documents:', error);
        setLoading(false);
        return;
      }

      updateDocumentsState(docs || []);
      setLoading(false);
    }

    function updateDocumentsState(docs: DocumentRecord[]) {
      setDocuments(prev => prev.map(doc => {
        const stored = docs.find((d: DocumentRecord) => d.document_type === doc.type);
        if (stored) {
          return {
            ...doc,
            status: stored.status as 'pending' | 'approved' | 'rejected',
            dbId: stored.id,
            fileName: stored.file_name,
            fileSize: stored.file_size || undefined,
            fileUrl: stored.file_url,
            uploadedAt: stored.created_at,
            rejectionReason: stored.rejection_reason || undefined,
          };
        }
        return {
          ...doc,
          status: 'not_uploaded' as const,
          dbId: undefined,
          fileName: undefined,
          fileSize: undefined,
          fileUrl: undefined,
          uploadedAt: undefined,
          rejectionReason: undefined,
        };
      }));
    }

    fetchDocuments();

    // Subscribe to realtime changes for instant status updates
    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          // Refetch all documents when any change occurs
          const { data: docs } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', user.id);
          
          if (docs) {
            updateDocumentsState(docs);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleFileSelect = (docType: string) => {
    setSelectedDocType(docType);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedDocType || !user) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ title: l.invalidType, description: l.invalidTypeDesc, variant: 'destructive' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSelectedDocType(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({ title: l.fileTooLarge, description: l.fileTooLargeDesc, variant: 'destructive' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSelectedDocType(null);
      return;
    }

    setUploading(true);

    try {
      const existingDoc = documents.find(d => d.type === selectedDocType && d.dbId);
      
      if (existingDoc?.fileUrl) {
        const oldPath = extractStoragePath(existingDoc.fileUrl);
        if (oldPath) {
          await supabase.storage.from('documents').remove([oldPath]);
        }
      }

      const fileExt = file.name.split('.').pop();
      const storagePath = `${user.id}/${selectedDocType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const fileUrl = storagePath;

      if (existingDoc?.dbId) {
        const { error: updateError } = await supabase
          .from('documents')
          .update({
            file_name: file.name,
            file_url: fileUrl,
            file_size: file.size,
            status: 'pending',
            rejection_reason: null,
          })
          .eq('id', existingDoc.dbId);

        if (updateError) throw updateError;
      } else {
        const { data: newDoc, error: insertError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            document_type: selectedDocType,
            file_name: file.name,
            file_url: fileUrl,
            file_size: file.size,
            status: 'pending',
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setDocuments(docs =>
          docs.map(doc =>
            doc.type === selectedDocType
              ? { 
                  ...doc, 
                  status: 'pending' as const, 
                  dbId: newDoc.id,
                  fileName: file.name,
                  fileSize: file.size,
                  fileUrl: fileUrl,
                  uploadedAt: newDoc.created_at,
                  rejectionReason: undefined,
                }
              : doc
          )
        );

        toast({ title: l.docUploaded, description: `${file.name} ${l.uploadedSuccess}` });
        setUploading(false);
        setSelectedDocType(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setDocuments(docs =>
        docs.map(doc =>
          doc.type === selectedDocType
            ? { 
                ...doc, 
                status: 'pending' as const, 
                fileName: file.name,
                fileSize: file.size,
                fileUrl: fileUrl,
                uploadedAt: new Date().toISOString(),
                rejectionReason: undefined,
              }
            : doc
        )
      );

      toast({ title: l.docReplaced, description: `${file.name} ${l.uploadedSuccess}` });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: l.uploadFailed, description: error.message || l.uploadFailedDesc, variant: 'destructive' });
    } finally {
      setUploading(false);
      setSelectedDocType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const extractStoragePath = (url: string): string | null => {
    try {
      if (url.match(/^[a-f0-9-]+\/[a-z_]+_\d+\.\w+$/i)) {
        return url;
      }
      const match = url.match(/\/documents\/([^?]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const handleRemove = async (docType: string) => {
    if (!user) return;

    const doc = documents.find(d => d.type === docType);
    if (!doc?.dbId) return;

    setRemoving(docType);

    try {
      if (doc.fileUrl) {
        const storagePath = extractStoragePath(doc.fileUrl);
        if (storagePath) {
          await supabase.storage.from('documents').remove([storagePath]);
        }
      }

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.dbId);

      if (error) throw error;

      setDocuments(docs =>
        docs.map(d =>
          d.type === docType
            ? { 
                ...d, 
                status: 'not_uploaded' as const, 
                dbId: undefined,
                fileName: undefined, 
                fileSize: undefined, 
                fileUrl: undefined, 
                uploadedAt: undefined,
                rejectionReason: undefined,
              }
            : d
        )
      );

      toast({ title: l.docRemoved, description: l.docRemovedDesc });
    } catch (error: any) {
      console.error('Remove error:', error);
      toast({ title: l.removeFailed, description: l.removeFailedDesc, variant: 'destructive' });
    } finally {
      setRemoving(null);
    }
  };

  const getStatusIcon = (status: DocumentUI['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-warning" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: DocumentUI['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success/20">{l.approved}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{l.rejected}</Badge>;
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning/20">{l.pendingReview}</Badge>;
      default:
        return <Badge variant="outline">{l.notUploaded}</Badge>;
    }
  };

  const getFileIcon = (doc: DocumentUI) => {
    if (!doc.fileName) return <FileText className="w-8 h-8 text-muted-foreground" />;
    if (doc.fileName.match(/\.(jpg|jpeg|png)$/i)) return <Image className="w-8 h-8 text-primary" />;
    return <File className="w-8 h-8 text-primary" />;
  };

  const uploadedCount = documents.filter(d => d.status !== 'not_uploaded').length;
  const requiredCount = documents.filter(d => d.required).length;
  const completedRequired = documents.filter(d => d.required && d.status !== 'not_uploaded').length;
  const progress = Math.round((completedRequired / requiredCount) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">{l.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.documents}</h1>
        <p className="text-muted-foreground">{l.subtitle}</p>
      </div>

      {/* Progress Card */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{l.uploadProgress}</h2>
            <p className="text-sm text-muted-foreground">
              {l.ofDocs(uploadedCount, documents.length, completedRequired, requiredCount)}
            </p>
          </div>
          <div className="text-3xl font-bold text-primary">{progress}%</div>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Documents Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {documents.map((doc) => {
          const docType = DOCUMENT_TYPES.find(dt => dt.type === doc.type);
          const displayName = docType ? getDocName(docType) : doc.name;
          
          return (
            <div
              key={doc.id}
              className={`bg-card rounded-2xl border p-5 transition-all ${
                doc.status === 'rejected'
                  ? 'border-destructive/50 bg-destructive/5'
                  : doc.status === 'approved'
                  ? 'border-success/50 bg-success/5'
                  : doc.status === 'pending'
                  ? 'border-warning/50 bg-warning/5'
                  : 'border-border'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                  {getFileIcon(doc)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {displayName}
                        {doc.required && <span className="text-destructive ml-1">*</span>}
                      </h3>
                      {doc.fileName && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {doc.fileName} • {((doc.fileSize || 0) / 1024 / 1024).toFixed(2)}MB
                        </p>
                      )}
                    </div>
                    {getStatusIcon(doc.status)}
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    {getStatusBadge(doc.status)}
                  </div>

                  {doc.rejectionReason && doc.status === 'rejected' && (
                    <p className="text-sm text-destructive mt-2 p-2 bg-destructive/10 rounded-lg">
                      <strong>{l.reason}:</strong> {doc.rejectionReason}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4">
                    {doc.status === 'not_uploaded' ? (
                      <Button
                        size="sm"
                        onClick={() => handleFileSelect(doc.type)}
                        disabled={uploading && selectedDocType === doc.type}
                        className="gap-1"
                      >
                        {uploading && selectedDocType === doc.type ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {l.upload}
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFileSelect(doc.type)}
                          disabled={uploading}
                          className="gap-1"
                        >
                          {uploading && selectedDocType === doc.type ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {l.replace}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemove(doc.type)}
                          disabled={removing === doc.type}
                          className="text-destructive hover:text-destructive gap-1"
                        >
                          {removing === doc.type ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          {l.remove}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="bg-muted/50 rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-3">{l.docRequirements}</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• {l.reqFormats}</li>
          <li>• {l.reqSize}</li>
          <li>• {l.markedWith} <span className="text-destructive">*</span> {l.reqRequired}</li>
          <li>• {l.reqClear}</li>
          <li>• {l.reqReview}</li>
        </ul>
      </div>
    </div>
  );
}
