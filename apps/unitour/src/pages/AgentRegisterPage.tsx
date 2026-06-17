import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, User, Phone, Mail, FileText, Landmark, CheckCircle2, Upload } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";

const AgentRegisterPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    companyName: "",
    directorName: "",
    phone: "",
    email: "",
    address: "",
    description: "",
    bankName: "",
    bankAccount: "",
    inn: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Avval tizimga kiring");
      navigate("/auth");
      return;
    }

    if (!form.companyName || !form.directorName || !form.phone) {
      toast.error("Majburiy maydonlarni to'ldiring");
      return;
    }

    if (!agreementAccepted) {
      toast.error("Shartnomani qabul qiling");
      return;
    }

    setLoading(true);
    try {
      let licenseUrl = null;
      if (licenseFile) {
        const fileExt = licenseFile.name.split(".").pop();
        const filePath = `licenses/${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("booking-documents")
          .upload(filePath, licenseFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("booking-documents")
          .getPublicUrl(filePath);
        licenseUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("agents").insert({
        user_id: user.id,
        company_name: form.companyName,
        name: form.directorName,
        director_name: form.directorName,
        phone: form.phone,
        email: form.email || user.email,
        address: form.address || null,
        description: form.description || null,
        bank_name: form.bankName || null,
        bank_account: form.bankAccount || null,
        inn: form.inn || null,
        license_url: licenseUrl,
        agreement_accepted: true,
        agreement_accepted_at: new Date().toISOString(),
        status: "pending",
        is_active: false,
      } as any);

      if (error) throw error;
      toast.success("Arizangiz yuborildi! Admin tasdiqlashini kuting.");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error("Xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Agent bo'lish</h1>
          <p className="text-primary-foreground/80">UniTour hamkori sifatida ro'yxatdan o'ting</p>
        </div>
      </div>

      <div className="container-custom py-8 max-w-3xl">
        <div className="space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Kompaniya ma'lumotlari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Kompaniya nomi *</Label>
                <Input placeholder="Masalan: Silk Road Tours" value={form.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)} />
              </div>
              <div>
                <Label>Direktor ismi *</Label>
                <Input placeholder="To'liq ism" value={form.directorName}
                  onChange={(e) => updateField("directorName", e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Telefon *</Label>
                  <Input placeholder="+998 90 123 45 67" value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" placeholder="info@company.uz" value={form.email}
                    onChange={(e) => updateField("email", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Manzil</Label>
                <Input placeholder="Toshkent shahar, ..." value={form.address}
                  onChange={(e) => updateField("address", e.target.value)} />
              </div>
              <div>
                <Label>Kompaniya haqida</Label>
                <Textarea placeholder="Kompaniya faoliyati haqida qisqacha..." value={form.description}
                  onChange={(e) => updateField("description", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Landmark className="h-5 w-5 text-primary" />
                Bank rekvizitlari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Bank nomi</Label>
                <Input placeholder="Masalan: NBU, Kapitalbank" value={form.bankName}
                  onChange={(e) => updateField("bankName", e.target.value)} />
              </div>
              <div>
                <Label>Hisob raqami</Label>
                <Input placeholder="20208000..." value={form.bankAccount}
                  onChange={(e) => updateField("bankAccount", e.target.value)} />
              </div>
              <div>
                <Label>INN (STIR)</Label>
                <Input placeholder="123456789" value={form.inn}
                  onChange={(e) => updateField("inn", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* License Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Litsenziya va hujjatlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  Tur operatori litsenziyasini yuklang (PDF, JPG, PNG)
                </p>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                  className="max-w-xs mx-auto"
                />
                {licenseFile && (
                  <p className="text-sm text-primary mt-2">✓ {licenseFile.name}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Agreement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Raqamli shartnoma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4 mb-4 max-h-40 overflow-y-auto text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-2">UniTour Hamkorlik Shartnomasi</p>
                <p>1. Agent UniTour platformasi orqali tur paketlarini sotish huquqiga ega bo'ladi.</p>
                <p>2. Har bir sotilgan tur uchun belgilangan komissiya to'lanadi.</p>
                <p>3. Agent barcha taqdim etilgan ma'lumotlarning to'g'riligini kafolatlaydi.</p>
                <p>4. UniTour agentning faoliyatini to'xtatish huquqini o'zida saqlab qoladi.</p>
                <p>5. Agent platformaning barcha qoidalariga rioya qilishga majbur.</p>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agreement"
                  checked={agreementAccepted}
                  onCheckedChange={(checked) => setAgreementAccepted(checked === true)}
                />
                <label htmlFor="agreement" className="text-sm cursor-pointer">
                  Men UniTour hamkorlik shartnomasi shartlarini o'qidim va qabul qilaman *
                </label>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={loading || !agreementAccepted || !form.companyName || !form.directorName || !form.phone}
          >
            {loading ? "Yuborilmoqda..." : "Arizani yuborish"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Admin sizning arizangizni ko'rib chiqadi va 24-48 soat ichida javob beradi
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AgentRegisterPage;
