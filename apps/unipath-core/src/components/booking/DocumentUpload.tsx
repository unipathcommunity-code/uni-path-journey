import { useState } from "react";
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DocumentUploadProps {
  bookingId: string;
  userId: string;
  onComplete?: () => void;
}

interface UploadedDoc {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
}

const DOCUMENT_TYPES = [
  { value: "passport", label: "Xorijiy pasport", icon: "🛂", required: true },
  { value: "id_card", label: "ID karta / Passport", icon: "🪪", required: false },
  { value: "photo", label: "3x4 rasm", icon: "📷", required: false },
  { value: "visa", label: "Viza (agar kerak bo'lsa)", icon: "📋", required: false },
  { value: "other", label: "Boshqa hujjatlar", icon: "📄", required: false },
];

const DocumentUpload = ({ bookingId, userId, onComplete }: DocumentUploadProps) => {
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Fayl hajmi 10MB dan oshmasligi kerak");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Faqat JPG, PNG, WEBP yoki PDF formatidagi fayllar qabul qilinadi");
      return;
    }

    setUploadingType(documentType);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${bookingId}/${documentType}_${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("booking-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Store the file path instead of public URL - generate signed URLs on-demand for security
      // Save to database with file path (not public URL)
      const { data: docData, error: dbError } = await (supabase as any)
        .from("booking_documents")
        .insert({
          booking_id: bookingId,
          document_type: documentType,
          file_name: file.name,
          file_url: fileName, // Store path, not public URL
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadedDocs((prev) => [...prev, docData]);
      toast.success("Hujjat muvaffaqiyatli yuklandi");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Faylni yuklashda xatolik. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setUploadingType(null);
    }
  };

  const removeDocument = async (docId: string) => {
    try {
      await (supabase as any)
        .from("booking_documents")
        .delete()
        .eq("id", docId);

      setUploadedDocs((prev) => prev.filter((d) => d.id !== docId));
      toast.success("Hujjat o'chirildi");
    } catch (error) {
      toast.error("O'chirishda xatolik");
    }
  };

  const isDocUploaded = (docType: string) => {
    return uploadedDocs.some((d) => d.document_type === docType);
  };

  const getUploadedDoc = (docType: string) => {
    return uploadedDocs.find((d) => d.document_type === docType);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Sayohat hujjatlari
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sayohat uchun kerakli hujjatlaringizni yuklang. Xorijiy pasport majburiy.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {DOCUMENT_TYPES.map((docType) => {
          const isUploaded = isDocUploaded(docType.value);
          const uploadedDoc = getUploadedDoc(docType.value);
          const isUploading = uploadingType === docType.value;

          return (
            <div
              key={docType.value}
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                isUploaded
                  ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                  : "bg-muted/30 border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{docType.icon}</span>
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {docType.label}
                    {docType.required && (
                      <Badge variant="destructive" className="text-xs">
                        Majburiy
                      </Badge>
                    )}
                  </p>
                  {isUploaded && uploadedDoc && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {uploadedDoc.file_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isUploaded && uploadedDoc ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeDocument(uploadedDoc.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(docType.value, file);
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      className="pointer-events-none"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Yuklanmoqda...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-1" />
                          Yuklash
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div className="bg-accent/20 rounded-lg p-4 mt-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Muhim ma'lumot</p>
              <ul className="text-muted-foreground mt-1 space-y-1">
                <li>• Hujjatlar aniq va o'qilishi oson bo'lishi kerak</li>
                <li>• Pasportning amal qilish muddati sayohatdan 6 oy keyin ham amal qilishi lozim</li>
                <li>• Maksimal fayl hajmi: 10MB</li>
              </ul>
            </div>
          </div>
        </div>

        {uploadedDocs.length > 0 && (
          <Button onClick={onComplete} className="w-full mt-4">
            <CheckCircle className="h-4 w-4 mr-2" />
            Hujjatlar yuklandi ({uploadedDocs.length})
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
