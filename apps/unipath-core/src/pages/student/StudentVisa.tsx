import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plane,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Calendar,
  MapPin,
  Upload,
  Trash2,
  Loader2,
  DollarSign,
  Plus,
  TrendingUp,
  PiggyBank,
  Receipt,
  Eye,
  Check,
} from 'lucide-react';

interface VisaDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  status: string;
  uploaded_at: string;
}

interface VisaApplication {
  id: string;
  country: string;
  status: string;
  admission_letter_received: boolean;
  documents_gathered: boolean;
  embassy_appointment_date: string | null;
  interview_completed: boolean;
  visa_received: boolean;
  visa_number: string | null;
  visa_expiry_date: string | null;
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
}

const requiredDocumentTypes = [
  { id: 'passport', name: 'Valid Passport', nameUz: 'Passport', nameRu: 'Паспорт', required: true },
  { id: 'admission_letter', name: 'Admission Letter', nameUz: 'Qabul xati', nameRu: 'Письмо о зачислении', required: true },
  { id: 'bank_statement', name: 'Bank Statement', nameUz: 'Bank ko\'chirmasi', nameRu: 'Выписка из банка', required: true },
  { id: 'visa_form', name: 'Visa Application Form', nameUz: 'Viza arizasi', nameRu: 'Анкета на визу', required: true },
  { id: 'photos', name: 'Passport Photos', nameUz: 'Fotosuratlar', nameRu: 'Фотографии', required: true },
  { id: 'health_insurance', name: 'Health Insurance', nameUz: 'Tibbiy sug\'urta', nameRu: 'Мед. страховка', required: false },
  { id: 'flight_ticket', name: 'Flight Itinerary', nameUz: 'Parvoz chipta', nameRu: 'Авиабилет', required: false },
  { id: 'accommodation', name: 'Accommodation Proof', nameUz: 'Yashash joyi', nameRu: 'Подтв. проживания', required: false },
];

const expenseCategories = [
  { id: 'tuition', name: 'Tuition Fee', nameUz: "O'qish to'lovi", nameRu: 'Обучение' },
  { id: 'visa', name: 'Visa Fee', nameUz: 'Viza to\'lovi', nameRu: 'Виза' },
  { id: 'flight', name: 'Flight Tickets', nameUz: 'Aviabiletlar', nameRu: 'Авиабилеты' },
  { id: 'accommodation', name: 'Accommodation', nameUz: 'Yashash joyi', nameRu: 'Проживание' },
  { id: 'insurance', name: 'Insurance', nameUz: 'Sug\'urta', nameRu: 'Страховка' },
  { id: 'documents', name: 'Documents & Translation', nameUz: 'Hujjatlar', nameRu: 'Документы' },
  { id: 'other', name: 'Other', nameUz: 'Boshqa', nameRu: 'Другое' },
];

export default function StudentVisa() {
  const { language, selectedCountry } = useApp();
  const { user } = useAuth();
  const t = useTranslation(language);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [visaApp, setVisaApp] = useState<VisaApplication | null>(null);
  const [documents, setDocuments] = useState<VisaDocument[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  
  // Expense modal
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: 'tuition',
    description: '',
    amount: '',
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
  });
  const [savingExpense, setSavingExpense] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch or create visa application
    const { data: visaData, error: visaError } = await supabase
      .from('visa_applications')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();
    
    if (visaData) {
      setVisaApp(visaData as VisaApplication);
    } else if (!visaError) {
      // Create new visa application
      const country = selectedCountry?.name || 'South Korea';
      const { data: newVisa } = await supabase
        .from('visa_applications')
        .insert({ user_id: user!.id, country })
        .select()
        .single();
      
      if (newVisa) {
        setVisaApp(newVisa as VisaApplication);
      }
    }
    
    // Fetch visa documents
    const { data: docsData } = await supabase
      .from('visa_documents')
      .select('*')
      .eq('user_id', user!.id)
      .order('uploaded_at', { ascending: false });
    
    if (docsData) {
      setDocuments(docsData as VisaDocument[]);
    }
    
    // Fetch expenses
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false });
    
    if (expensesData) {
      setExpenses(expensesData as Expense[]);
    }
    
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDocType || !user) return;
    
    setUploadingDoc(selectedDocType);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${selectedDocType}_${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('visa-documents')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Store file path (not public URL) - signed URLs will be generated on-demand
      // Save document record with storage path for secure access
      const { error: dbError } = await supabase
        .from('visa_documents')
        .insert({
          user_id: user.id,
          visa_application_id: visaApp?.id,
          document_type: selectedDocType,
          file_name: file.name,
          file_url: fileName, // Store path, not public URL
          file_size: file.size,
        });
      
      if (dbError) throw dbError;
      
      toast.success(language === 'uz' ? 'Hujjat yuklandi' : language === 'ru' ? 'Документ загружен' : 'Document uploaded');
      fetchData();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(language === 'uz' ? 'Xatolik yuz berdi' : language === 'ru' ? 'Ошибка загрузки' : 'Upload failed');
    }
    
    setUploadingDoc(null);
    setSelectedDocType('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate signed URL for secure document viewing
  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    // If it's already a full URL (legacy data), extract the path
    let path = filePath;
    if (filePath.includes('/visa-documents/')) {
      path = filePath.split('/visa-documents/')[1] || filePath;
    }
    
    const { data, error } = await supabase.storage
      .from('visa-documents')
      .createSignedUrl(path, 3600); // 1 hour expiry
    
    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    return data.signedUrl;
  };

  const handleViewDocument = async (doc: VisaDocument) => {
    const signedUrl = await getSignedUrl(doc.file_url);
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    } else {
      toast.error(language === 'uz' ? 'Hujjatni ochib bo\'lmadi' : language === 'ru' ? 'Не удалось открыть документ' : 'Could not open document');
    }
  };

  const handleDeleteDocument = async (doc: VisaDocument) => {
    if (!confirm(language === 'uz' ? "Hujjatni o'chirishni xohlaysizmi?" : language === 'ru' ? 'Удалить документ?' : 'Delete this document?')) return;
    
    try {
      // Extract path - handle both legacy full URLs and new path format
      let path = doc.file_url;
      if (doc.file_url.includes('/visa-documents/')) {
        path = doc.file_url.split('/visa-documents/')[1] || doc.file_url;
      }
      
      if (path) {
        await supabase.storage.from('visa-documents').remove([path]);
      }
      
      // Delete from database
      await supabase.from('visa_documents').delete().eq('id', doc.id);
      
      toast.success(language === 'uz' ? "Hujjat o'chirildi" : language === 'ru' ? 'Документ удален' : 'Document deleted');
      fetchData();
    } catch (error) {
      toast.error(language === 'uz' ? 'Xatolik' : language === 'ru' ? 'Ошибка' : 'Error');
    }
  };

  const updateVisaStep = async (field: string, value: boolean) => {
    if (!visaApp) return;
    
    const { error } = await supabase
      .from('visa_applications')
      .update({ [field]: value })
      .eq('id', visaApp.id);
    
    if (!error) {
      setVisaApp({ ...visaApp, [field]: value });
      toast.success(language === 'uz' ? 'Yangilandi' : language === 'ru' ? 'Обновлено' : 'Updated');
    }
  };

  const handleSaveExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !user) {
      toast.error(language === 'uz' ? 'Barcha maydonlarni to\'ldiring' : language === 'ru' ? 'Заполните все поля' : 'Fill all fields');
      return;
    }
    
    setSavingExpense(true);
    
    const { error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        category: newExpense.category,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        currency: newExpense.currency,
        date: newExpense.date,
      });
    
    if (error) {
      toast.error(language === 'uz' ? 'Xatolik' : language === 'ru' ? 'Ошибка' : 'Error');
    } else {
      toast.success(language === 'uz' ? 'Xarajat qo\'shildi' : language === 'ru' ? 'Расход добавлен' : 'Expense added');
      setExpenseModalOpen(false);
      setNewExpense({
        category: 'tuition',
        description: '',
        amount: '',
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
      });
      fetchData();
    }
    
    setSavingExpense(false);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm(language === 'uz' ? "O'chirishni xohlaysizmi?" : language === 'ru' ? 'Удалить?' : 'Delete?')) return;
    
    await supabase.from('expenses').delete().eq('id', id);
    fetchData();
  };

  const getDocName = (docType: typeof requiredDocumentTypes[0]) => {
    return language === 'uz' ? docType.nameUz : language === 'ru' ? docType.nameRu : docType.name;
  };

  const getCategoryName = (cat: typeof expenseCategories[0]) => {
    return language === 'uz' ? cat.nameUz : language === 'ru' ? cat.nameRu : cat.name;
  };

  const getDocumentForType = (typeId: string) => {
    return documents.find(d => d.document_type === typeId);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  const visaSteps = [
    { id: 'admission_letter_received', title: language === 'uz' ? 'Qabul xati olindi' : language === 'ru' ? 'Письмо о зачислении получено' : 'Admission Letter Received', completed: visaApp?.admission_letter_received },
    { id: 'documents_gathered', title: language === 'uz' ? 'Hujjatlar to\'plandi' : language === 'ru' ? 'Документы собраны' : 'Documents Gathered', completed: visaApp?.documents_gathered },
    { id: 'interview_completed', title: language === 'uz' ? 'Intervyu o\'tkazildi' : language === 'ru' ? 'Собеседование пройдено' : 'Interview Completed', completed: visaApp?.interview_completed },
    { id: 'visa_received', title: language === 'uz' ? 'Viza olindi' : language === 'ru' ? 'Виза получена' : 'Visa Received', completed: visaApp?.visa_received },
  ];

  const completedSteps = visaSteps.filter(s => s.completed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {language === 'uz' ? 'Viza va Moliya' : language === 'ru' ? 'Виза и Финансы' : 'Visa & Finance'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'uz' ? 'Viza jarayoni va xarajatlarni boshqaring' : language === 'ru' ? 'Управляйте визой и расходами' : 'Manage your visa process and expenses'}
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Plane className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {visaApp?.country} {language === 'uz' ? 'vizasi' : language === 'ru' ? 'виза' : 'Visa'}
              </h2>
              <p className="text-muted-foreground">
                {completedSteps}/{visaSteps.length} {language === 'uz' ? 'qadam bajarildi' : language === 'ru' ? 'шагов выполнено' : 'steps completed'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {completedSteps === visaSteps.length ? (
              <Badge className="bg-success/10 text-success border-success/20 gap-1">
                <CheckCircle className="w-4 h-4" />
                {language === 'uz' ? 'Tayyor' : language === 'ru' ? 'Готово' : 'Complete'}
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Clock className="w-4 h-4" />
                {language === 'uz' ? 'Jarayonda' : language === 'ru' ? 'В процессе' : 'In Progress'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="visa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="visa" className="gap-2">
            <Plane className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'uz' ? 'Viza' : language === 'ru' ? 'Виза' : 'Visa'}</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'uz' ? 'Hujjatlar' : language === 'ru' ? 'Документы' : 'Documents'}</span>
          </TabsTrigger>
          <TabsTrigger value="finance" className="gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'uz' ? 'Moliya' : language === 'ru' ? 'Финансы' : 'Finance'}</span>
          </TabsTrigger>
        </TabsList>

        {/* Visa Tab */}
        <TabsContent value="visa" className="space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              {language === 'uz' ? 'Viza jarayoni' : language === 'ru' ? 'Процесс получения визы' : 'Visa Process'}
            </h2>
            
            <div className="space-y-4">
              {visaSteps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                  <button
                    onClick={() => updateVisaStep(step.id, !step.completed)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      step.completed
                        ? 'bg-success text-success-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-primary/10'
                    }`}
                  >
                    {step.completed ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-lg font-semibold">{index + 1}</span>
                    )}
                  </button>
                  <div className="flex-1">
                    <p className={`font-medium ${step.completed ? 'text-success' : 'text-foreground'}`}>
                      {step.title}
                    </p>
                  </div>
                  {step.completed && (
                    <Badge className="bg-success/10 text-success border-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {language === 'uz' ? 'Bajarildi' : language === 'ru' ? 'Выполнено' : 'Done'}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Embassy Website Link */}
          <div className="bg-primary/5 rounded-2xl border border-primary/20 p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {language === 'uz' ? 'Rasmiy elchixona sayti' : language === 'ru' ? 'Официальный сайт посольства' : 'Official Embassy Website'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'uz' 
                      ? `${visaApp?.country} vizasi uchun rasmiy talablar va ma'lumotlar`
                      : language === 'ru'
                      ? `Официальные требования и информация для визы в ${visaApp?.country}`
                      : `Official requirements and information for ${visaApp?.country} visa`}
                  </p>
                </div>
                <Button 
                  variant="default" 
                  className="gap-2"
                  onClick={() => {
                    const embassyLinks: Record<string, string> = {
                      'South Korea': 'https://overseas.mofa.go.kr/uz-ko/index.do',
                      'Japan': 'https://www.uz.emb-japan.go.jp/itprtop_uz/index.html',
                      'China': 'http://uz.china-embassy.gov.cn/',
                      'Germany': 'https://taschkent.diplo.de/',
                      'United States': 'https://uz.usembassy.gov/',
                      'United Kingdom': 'https://www.gov.uk/world/uzbekistan',
                      'Canada': 'https://www.international.gc.ca/',
                      'Australia': 'https://uzbekistan.embassy.gov.au/',
                      'France': 'https://uz.ambafrance.org/',
                      'Italy': 'https://ambtashkent.esteri.it/',
                      'Spain': 'https://www.exteriores.gob.es/',
                      'Netherlands': 'https://www.netherlandsandyou.nl/your-country-and-the-netherlands/uzbekistan',
                      'Poland': 'https://www.gov.pl/web/uzbekistan',
                      'Czech Republic': 'https://www.mzv.cz/tashkent',
                      'Hungary': 'https://taskent.mfa.gov.hu/',
                      'Malaysia': 'https://www.kln.gov.my/',
                      'Singapore': 'https://www.mfa.gov.sg/',
                      'UAE': 'https://www.mofaic.gov.ae/',
                    };
                    const url = embassyLinks[visaApp?.country || ''] || `https://www.google.com/search?q=${encodeURIComponent((visaApp?.country || '') + ' embassy visa requirements Uzbekistan')}`;
                    window.open(url, '_blank');
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                  {language === 'uz' ? 'Rasmiy saytga o\'tish' : language === 'ru' ? 'Перейти на сайт' : 'Visit Official Site'}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-warning/10 rounded-2xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">
                {language === 'uz' ? 'Eslatma' : language === 'ru' ? 'Напоминание' : 'Reminder'}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'uz' 
                  ? "Viza talablari davlatga qarab farq qiladi. Yuqoridagi tugmani bosib rasmiy saytdan tekshiring."
                  : language === 'ru'
                  ? 'Требования к визе зависят от страны. Нажмите кнопку выше для проверки на официальном сайте.'
                  : 'Visa requirements vary by country. Click the button above to check the official website.'}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {language === 'uz' ? 'Kerakli hujjatlar' : language === 'ru' ? 'Необходимые документы' : 'Required Documents'}
              </h2>
              <Badge variant="secondary">
                {documents.length}/{requiredDocumentTypes.filter(d => d.required).length} {language === 'uz' ? 'yuklangan' : language === 'ru' ? 'загружено' : 'uploaded'}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {requiredDocumentTypes.map((docType) => {
                const uploadedDoc = getDocumentForType(docType.id);
                const isUploading = uploadingDoc === docType.id;
                
                return (
                  <div
                    key={docType.id}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-colors ${
                      uploadedDoc ? 'bg-success/10 border border-success/20' : 'bg-muted/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      uploadedDoc ? 'bg-success/20' : 'bg-background'
                    }`}>
                      {uploadedDoc ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">
                        {getDocName(docType)}
                        {docType.required && <span className="text-destructive ml-1">*</span>}
                      </p>
                      {uploadedDoc && (
                        <p className="text-xs text-muted-foreground truncate">
                          {uploadedDoc.file_name}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {uploadedDoc ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(uploadedDoc)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteDocument(uploadedDoc)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isUploading}
                          onClick={() => {
                            setSelectedDocType(docType.id);
                            fileInputRef.current?.click();
                          }}
                        >
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-1" />
                              {language === 'uz' ? 'Yuklash' : language === 'ru' ? 'Загрузить' : 'Upload'}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileUpload}
            />
          </div>
        </TabsContent>

        {/* Finance Tab */}
        <TabsContent value="finance" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl p-4 border border-border">
              <PiggyBank className="w-8 h-8 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">${totalExpenses.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">
                {language === 'uz' ? 'Jami xarajat' : language === 'ru' ? 'Всего расходов' : 'Total Expenses'}
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <Receipt className="w-8 h-8 text-success mb-2" />
              <p className="text-2xl font-bold text-foreground">{expenses.length}</p>
              <p className="text-sm text-muted-foreground">
                {language === 'uz' ? 'Tranzaksiyalar' : language === 'ru' ? 'Транзакции' : 'Transactions'}
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <TrendingUp className="w-8 h-8 text-warning mb-2" />
              <p className="text-2xl font-bold text-foreground">
                ${expenses.filter(e => e.category === 'tuition').reduce((s, e) => s + e.amount, 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'uz' ? "O'qish" : language === 'ru' ? 'Обучение' : 'Tuition'}
              </p>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <Plane className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-2xl font-bold text-foreground">
                ${expenses.filter(e => ['visa', 'flight'].includes(e.category)).reduce((s, e) => s + e.amount, 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'uz' ? 'Viza & Parvoz' : language === 'ru' ? 'Виза и перелет' : 'Visa & Flight'}
              </p>
            </div>
          </div>

          {/* Expenses List */}
          <div className="bg-card rounded-2xl border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {language === 'uz' ? 'Xarajatlar' : language === 'ru' ? 'Расходы' : 'Expenses'}
              </h2>
              <Button onClick={() => setExpenseModalOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                {language === 'uz' ? "Qo'shish" : language === 'ru' ? 'Добавить' : 'Add'}
              </Button>
            </div>
            
            {expenses.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {language === 'uz' ? 'Xarajatlar yo\'q' : language === 'ru' ? 'Нет расходов' : 'No expenses yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {expenses.map((expense) => {
                  const category = expenseCategories.find(c => c.id === expense.category);
                  return (
                    <div key={expense.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {category ? getCategoryName(category) : expense.category} • {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">${expense.amount.toLocaleString()}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive h-6 px-2"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Expense Modal */}
      <Dialog open={expenseModalOpen} onOpenChange={setExpenseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'uz' ? "Xarajat qo'shish" : language === 'ru' ? 'Добавить расход' : 'Add Expense'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                {language === 'uz' ? 'Kategoriya' : language === 'ru' ? 'Категория' : 'Category'}
              </label>
              <Select value={newExpense.category} onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {getCategoryName(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">
                {language === 'uz' ? 'Tavsif' : language === 'ru' ? 'Описание' : 'Description'}
              </label>
              <Input
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                placeholder={language === 'uz' ? "Masalan: Viza to'lovi" : language === 'ru' ? 'Например: Оплата визы' : 'e.g. Visa fee payment'}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {language === 'uz' ? 'Miqdor' : language === 'ru' ? 'Сумма' : 'Amount'}
                </label>
                <Input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {language === 'uz' ? 'Valyuta' : language === 'ru' ? 'Валюта' : 'Currency'}
                </label>
                <Select value={newExpense.currency} onValueChange={(v) => setNewExpense({ ...newExpense, currency: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="KRW">KRW</SelectItem>
                    <SelectItem value="UZS">UZS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">
                {language === 'uz' ? 'Sana' : language === 'ru' ? 'Дата' : 'Date'}
              </label>
              <Input
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setExpenseModalOpen(false)}>
              {language === 'uz' ? 'Bekor' : language === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleSaveExpense} disabled={savingExpense}>
              {savingExpense && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {language === 'uz' ? 'Saqlash' : language === 'ru' ? 'Сохранить' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
