import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Phone, Mail, Camera, ArrowRight, ArrowLeft, Check, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/unitour-logo-new.png";

const STEPS = [
  { id: "name", icon: User, title: "Ismingiz", subtitle: "To'liq ismingizni kiriting" },
  { id: "phone", icon: Phone, title: "Telefon raqamingiz", subtitle: "+998 formatida kiriting" },
  { id: "email", icon: Mail, title: "Email manzilingiz", subtitle: "Elektron pochtangizni tasdiqlang" },
  { id: "photo", icon: Camera, title: "Profil rasmingiz", subtitle: "Rasmingizni yuklang (ixtiyoriy)" },
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    full_name: user?.user_metadata?.full_name || "",
    phone: user?.user_metadata?.phone || "+998",
    email: user?.email || "",
  });

  const formatPhone = (value: string) => {
    // Always keep +998 prefix
    let digits = value.replace(/\D/g, "");
    if (!digits.startsWith("998")) digits = "998" + digits;
    digits = digits.slice(0, 12); // 998 + 9 digits

    let formatted = "+998";
    const rest = digits.slice(3);
    if (rest.length > 0) formatted += " " + rest.slice(0, 2);
    if (rest.length > 2) formatted += " " + rest.slice(2, 5);
    if (rest.length > 5) formatted += " " + rest.slice(5, 7);
    if (rest.length > 7) formatted += " " + rest.slice(7, 9);
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Rasm hajmi 5MB dan oshmasligi kerak");
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return formData.full_name.trim().length >= 2;
      case 1: return formData.phone.replace(/\D/g, "").length >= 12;
      case 2: return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email);
      case 3: return true; // photo is optional
      default: return true;
    }
  };

  const goNext = () => {
    if (!isStepValid()) {
      toast.error("Iltimos, ma'lumotlarni to'g'ri kiriting");
      return;
    }
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);

    try {
      let avatarUrl: string | null = null;

      // Upload avatar if selected
      if (avatarFile) {
        setUploading(true);
        const ext = avatarFile.name.split(".").pop();
        const filePath = `avatars/${user.id}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("tour-images")
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("tour-images")
          .getPublicUrl(filePath);

        avatarUrl = urlData.publicUrl;
        setUploading(false);
      }

      // Update profile
      const updateData: Record<string, string | null> = {
        full_name: formData.full_name.trim(),
        phone: formData.phone,
      };
      if (avatarUrl) updateData.avatar_url = avatarUrl;

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Profil muvaffaqiyatli saqlandi! 🎉");
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Onboarding error:", err);
      toast.error("Profilni saqlashda xatolik. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <Label htmlFor="full_name" className="text-foreground font-medium">To'liq ism *</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Ism Familiya"
                className="pl-12 h-14 text-lg bg-background border-border"
                autoFocus
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <Label htmlFor="phone" className="text-foreground font-medium">Telefon raqam *</Label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="+998 90 123 45 67"
                className="pl-12 h-14 text-lg bg-background border-border font-mono tracking-wider"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">Format: +998 XX XXX XX XX</p>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <Label htmlFor="email" className="text-foreground font-medium">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="pl-12 h-14 text-lg bg-background border-border"
                autoFocus
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-full border-2 border-dashed border-primary/40 hover:border-primary flex items-center justify-center overflow-hidden transition-colors bg-muted/50 group"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                    <Upload className="h-8 w-8" />
                    <span className="text-xs">Yuklash</span>
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground text-center">
                JPG, PNG — max 5MB
                <br />
                <span className="text-xs">(Ixtiyoriy — keyinroq ham yuklashingiz mumkin)</span>
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const StepIcon = STEPS[currentStep].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-card rounded-2xl p-3 shadow-md border border-border/50">
            <img src={logo} alt="UniTour" className="h-10 w-auto object-contain" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8 px-4">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: i <= currentStep ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl p-8 border border-border shadow-xl overflow-hidden">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              key={currentStep}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <StepIcon className="h-6 w-6 text-primary" />
            </motion.div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {currentStep + 1} / {STEPS.length} bosqich
              </p>
              <h2 className="text-xl font-bold text-foreground">{STEPS[currentStep].title}</h2>
              <p className="text-sm text-muted-foreground">{STEPS[currentStep].subtitle}</p>
            </div>
          </div>

          {/* Animated content */}
          <div className="relative min-h-[180px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={goBack}
              disabled={currentStep === 0 || saving}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Orqaga
            </Button>

            <Button
              onClick={goNext}
              disabled={!isStepValid() || saving}
              className="gap-2 min-w-[140px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploading ? "Yuklanmoqda..." : "Saqlanmoqda..."}
                </>
              ) : currentStep === STEPS.length - 1 ? (
                <>
                  Yakunlash
                  <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  Keyingi
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Skip */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            O'tkazib yuborish →
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
