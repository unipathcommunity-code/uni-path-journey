import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useTranslation } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Menu,
  Home,
  Search,
  Plane,
  Building,
  Briefcase,
  User,
  Settings,
  Bell,
  File,
  Image,
  Trash2,
  Eye,
} from 'lucide-react';

interface DocumentType {
  id: string;
  name: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
  maxSize: number; // in MB
}

interface UploadedDocument {
  id: string;
  typeId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  status: 'valid' | 'invalid' | 'pending';
  errorMessage?: string;
}

const documentTypes: DocumentType[] = [
  {
    id: 'passport',
    name: 'Passport',
    description: 'Valid international passport (all pages)',
    required: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 10,
  },
  {
    id: 'national_id',
    name: 'National ID',
    description: 'Government-issued national ID card',
    required: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSize: 5,
  },
  {
    id: 'diploma',
    name: 'Diploma/Certificate',
    description: 'High school or university diploma',
    required: true,
    acceptedFormats: ['pdf'],
    maxSize: 10,
  },
  {
    id: 'transcript',
    name: 'Transcript',
    description: 'Academic transcript with grades',
    required: true,
    acceptedFormats: ['pdf'],
    maxSize: 10,
  },
  {
    id: 'cv',
    name: 'CV/Resume',
    description: 'Updated curriculum vitae',
    required: true,
    acceptedFormats: ['pdf', 'doc', 'docx'],
    maxSize: 5,
  },
  {
    id: 'sop',
    name: 'Statement of Purpose',
    description: 'Personal statement explaining your goals',
    required: true,
    acceptedFormats: ['pdf', 'doc', 'docx'],
    maxSize: 5,
  },
  {
    id: 'recommendation',
    name: 'Recommendation Letters',
    description: 'Letters from teachers or employers',
    required: false,
    acceptedFormats: ['pdf'],
    maxSize: 5,
  },
  {
    id: 'bank_statement',
    name: 'Bank Statement',
    description: 'Recent bank statement (last 3 months)',
    required: false,
    acceptedFormats: ['pdf'],
    maxSize: 5,
  },
  {
    id: 'photo',
    name: 'Passport Photo',
    description: '3.5x4.5cm white background photo',
    required: true,
    acceptedFormats: ['jpg', 'jpeg', 'png'],
    maxSize: 2,
  },
];

export default function Documents() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { language } = useApp();
  const t = useTranslation(language);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-lg">{t.loading}</div>
      </div>
    );
  }

  const navItems = [
    { icon: Home, label: t.dashboard, href: '/dashboard' },
    { icon: Search, label: t.searchUniversities, href: '/search' },
    { icon: FileText, label: t.myApplications, href: '/applications' },
    { icon: FileText, label: t.documents, href: '/documents', active: true },
    { icon: Plane, label: t.visa, href: '/visa' },
    { icon: Building, label: t.boarding, href: '/boarding' },
    { icon: Briefcase, label: t.jobs, href: '/jobs' },
  ];

  const bottomNavItems = [
    { icon: User, label: t.profile, href: '/dashboard' },
    { icon: Settings, label: t.settings, href: '/dashboard' },
  ];

  const validateFile = (file: File, docType: DocumentType): { valid: boolean; error?: string } => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (!docType.acceptedFormats.includes(extension)) {
      return { 
        valid: false, 
        error: `Invalid format. Accepted: ${docType.acceptedFormats.join(', ').toUpperCase()}` 
      };
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > docType.maxSize) {
      return { 
        valid: false, 
        error: `File too large. Maximum: ${docType.maxSize}MB` 
      };
    }

    return { valid: true };
  };

  const handleFileUpload = (docTypeId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const docType = documentTypes.find(d => d.id === docTypeId);
    
    if (!docType) return;

    const validation = validateFile(file, docType);
    
    // Remove existing document of same type
    setUploadedDocs(prev => prev.filter(d => d.typeId !== docTypeId));

    const newDoc: UploadedDocument = {
      id: crypto.randomUUID(),
      typeId: docTypeId,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date(),
      status: validation.valid ? 'valid' : 'invalid',
      errorMessage: validation.error,
    };

    setUploadedDocs(prev => [...prev, newDoc]);

    if (validation.valid) {
      toast.success(`${docType.name} uploaded successfully`);
    } else {
      toast.error(validation.error);
    }
  };

  const handleDrop = (e: React.DragEvent, docTypeId: string) => {
    e.preventDefault();
    setDragOver(null);
    handleFileUpload(docTypeId, e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent, docTypeId: string) => {
    e.preventDefault();
    setDragOver(docTypeId);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const removeDocument = (docId: string) => {
    setUploadedDocs(prev => prev.filter(d => d.id !== docId));
    toast.success('Document removed');
  };

  const getDocumentForType = (typeId: string) => {
    return uploadedDocs.find(d => d.typeId === typeId);
  };

  const requiredDocs = documentTypes.filter(d => d.required);
  const uploadedRequired = requiredDocs.filter(d => {
    const doc = getDocumentForType(d.id);
    return doc && doc.status === 'valid';
  });
  const progress = (uploadedRequired.length / requiredDocs.length) * 100;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-card border-r border-border
          transform transition-transform duration-300 lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Logo size="sm" />
            <button
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${
                    item.active
                      ? 'bg-primary text-primary-foreground shadow-glow'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Bottom Navigation */}
          <div className="p-4 border-t border-border space-y-1">
            {bottomNavItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 hover:bg-muted rounded-lg"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-foreground">{t.documents}</h1>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>
            </div>
          </div>
        </header>

        {/* Documents Content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Progress Section */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Document Completion</h2>
                <p className="text-sm text-muted-foreground">
                  {uploadedRequired.length} of {requiredDocs.length} required documents uploaded
                </p>
              </div>
              <div className="text-2xl font-bold text-primary">{Math.round(progress)}%</div>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Document Upload Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentTypes.map((docType) => {
              const uploadedDoc = getDocumentForType(docType.id);
              const isDragOver = dragOver === docType.id;

              return (
                <div
                  key={docType.id}
                  className={`
                    bg-card rounded-2xl border-2 border-dashed p-5 transition-all duration-200
                    ${isDragOver ? 'border-primary bg-primary/5' : 'border-border'}
                    ${uploadedDoc?.status === 'valid' ? 'border-solid border-success/50 bg-success/5' : ''}
                    ${uploadedDoc?.status === 'invalid' ? 'border-solid border-destructive/50 bg-destructive/5' : ''}
                  `}
                  onDrop={(e) => handleDrop(e, docType.id)}
                  onDragOver={(e) => handleDragOver(e, docType.id)}
                  onDragLeave={handleDragLeave}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {uploadedDoc?.status === 'valid' ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : uploadedDoc?.status === 'invalid' ? (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                      ) : (
                        <File className="w-5 h-5 text-muted-foreground" />
                      )}
                      <h3 className="font-semibold text-foreground">{docType.name}</h3>
                    </div>
                    {docType.required && (
                      <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full">
                        Required
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{docType.description}</p>

                  {/* Upload Area or Uploaded File */}
                  {uploadedDoc ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                        {docType.acceptedFormats.includes('jpg') || docType.acceptedFormats.includes('png') ? (
                          <Image className="w-8 h-8 text-muted-foreground" />
                        ) : (
                          <FileText className="w-8 h-8 text-muted-foreground" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {uploadedDoc.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(uploadedDoc.fileSize)}
                          </p>
                        </div>
                      </div>

                      {uploadedDoc.status === 'invalid' && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {uploadedDoc.errorMessage}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => fileInputRefs.current[docType.id]?.click()}
                        >
                          <Upload className="w-3 h-3" />
                          Replace
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeDocument(uploadedDoc.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-muted/30 rounded-xl transition-colors"
                      onClick={() => fileInputRefs.current[docType.id]?.click()}
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-foreground">Click or drag to upload</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {docType.acceptedFormats.map(f => f.toUpperCase()).join(', ')} • Max {docType.maxSize}MB
                      </p>
                    </div>
                  )}

                  <input
                    ref={(el) => { fileInputRefs.current[docType.id] = el }}
                    type="file"
                    className="hidden"
                    accept={docType.acceptedFormats.map(f => `.${f}`).join(',')}
                    onChange={(e) => handleFileUpload(docType.id, e.target.files)}
                  />
                </div>
              );
            })}
          </div>

          {/* Submit Section */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground">Ready to submit?</h3>
                <p className="text-sm text-muted-foreground">
                  Make sure all required documents are uploaded and validated before submitting.
                </p>
              </div>
              <Button
                size="lg"
                disabled={progress < 100}
                className="gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Submit Documents
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
