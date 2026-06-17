import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  MapPin, Clock, Users, Calendar, CreditCard, CheckCircle, Loader2,
  FileText, Tag, Upload, Shield, Zap, Phone, MessageCircle, Camera, AlertTriangle,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { formatPrice, formatPriceUSD } from "@/data/tours";
import BackButton from "@/components/common/BackButton";
import BookingTimeline, { defaultSteps } from "@/components/booking/BookingTimeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DocumentUpload from "@/components/booking/DocumentUpload";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { useFeatureToggles } from "@/hooks/useFeatureToggles";

const DEPOSIT_USD = 10;
const DEPOSIT_UZS = 128500; // ~10 USD

const BookingPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFeatureEnabled } = useFeatureToggles();

  const { data: dbTour, isLoading: tourLoading } = useQuery({
    queryKey: ["booking-tour", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tours").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const tour = dbTour ? {
    id: dbTour.id,
    title: dbTour.title,
    destination: dbTour.destination,
    country: dbTour.country,
    price: dbTour.price,
    image: dbTour.image || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800",
    duration: { days: dbTour.duration_days, nights: dbTour.duration_nights },
  } : null;

  useEffect(() => {
    const refParam = searchParams.get("ref");
    if (refParam) {
      localStorage.setItem("referral_agent_id", refParam);
    }
  }, [searchParams]);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("click");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ id: string; code: string; discount_percent: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load saved form data from localStorage
  const savedData = id ? localStorage.getItem(`booking_form_${id}`) : null;
  const initialFormData = savedData ? JSON.parse(savedData) : {
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    notes: "",
  };
  const [formData, setFormData] = useState(initialFormData);

  // Save form data to localStorage on change
  const updateFormData = (data: typeof formData) => {
    setFormData(data);
    if (id) localStorage.setItem(`booking_form_${id}`, JSON.stringify(data));
  };

  const selectedDate = searchParams.get("date") || "";
  const guests = parseInt(searchParams.get("guests") || "1");
  const referralAgentId = searchParams.get("ref") || localStorage.getItem("referral_agent_id") || null;

  if (!isFeatureEnabled("booking_system")) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Band qilish tizimi</h2>
          <p className="text-muted-foreground">Band qilish tizimi hozircha vaqtincha o'chirilgan. Iltimos, keyinroq tashrif buyuring.</p>
          <Button className="mt-6" onClick={() => navigate("/")} variant="default">Bosh sahifa</Button>
        </div>
      </Layout>
    );
  }

  if (tourLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!tour) {
    return (
      <Layout>
        <div className="container-custom py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Tur topilmadi</h1>
          <Button onClick={() => navigate("/tours")}>Turlarga qaytish</Button>
        </div>
      </Layout>
    );
  }

  const totalPrice = tour.price * guests;
  const discountAmount = promoApplied ? Math.round(totalPrice * promoApplied.discount_percent / 100) : 0;
  const finalPrice = totalPrice - discountAmount;
  const remainingAmount = finalPrice - DEPOSIT_UZS;

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("id, code, discount_percent, min_order_amount, max_uses, current_uses, is_active, starts_at, expires_at")
        .eq("code", promoCode.toUpperCase().trim())
        .maybeSingle();
      if (error) throw error;
      if (!data) { setPromoError("Promo kod topilmadi"); return; }
      if (!data.is_active) { setPromoError("Promo kod faol emas"); return; }
      if (new Date(data.expires_at) < new Date()) { setPromoError("Promo kod muddati o'tgan"); return; }
      if (new Date(data.starts_at) > new Date()) { setPromoError("Promo kod hali boshlanmagan"); return; }
      if (data.max_uses && data.current_uses >= data.max_uses) { setPromoError("Promo kod limiti tugagan"); return; }
      if (data.min_order_amount && totalPrice < Number(data.min_order_amount)) {
        setPromoError(`Minimal buyurtma: ${new Intl.NumberFormat("uz-UZ").format(Number(data.min_order_amount))} so'm`);
        return;
      }
      setPromoApplied({ id: data.id, code: data.code, discount_percent: Number(data.discount_percent) });
      toast.success(`${data.discount_percent}% chegirma qo'llanildi!`);
    } catch (err: any) {
      setPromoError(err.message);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const updated = { ...formData, [e.target.name]: e.target.value };
    updateFormData(updated);
    setFormErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = "Ismni kiriting";
    if (!formData.lastName.trim()) errors.lastName = "Familiyani kiriting";
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) errors.email = "To'g'ri email kiriting";
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, "").length < 9) errors.phone = "To'g'ri telefon raqam kiriting";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Buyurtma berish uchun tizimga kiring");
      navigate("/auth?mode=login&redirect=/booking/" + id);
      return;
    }

    if (!selectedDate) {
      toast.error("Sayohat sanasini tanlang");
      return;
    }

    setIsSubmitting(true);

    try {
      await supabase
        .from("profiles")
        .update({
          full_name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone,
        })
        .eq("user_id", user.id);

      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          tour_id: id,
          travel_date: selectedDate,
          people_count: guests,
          total_price: finalPrice,
          discount_amount: discountAmount,
          promo_code_id: promoApplied?.id || null,
          notes: formData.notes || null,
          status: "reserved",
          deposit_amount: DEPOSIT_UZS,
          payment_status: "deposit_paid",
          remaining_amount: remainingAmount,
          payment_screenshot_url: screenshotUrl || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial timeline steps
      const timelineSteps = [
        { booking_id: booking.id, step: "reserved", title: "Joy band qilindi", description: "Deposit to'lovi qabul qilindi", completed: true, completed_at: new Date().toISOString() },
        { booking_id: booking.id, step: "manager_assigned", title: "Manager tayinlanishi kutilmoqda", description: "Tez orada siz bilan bog'lanamiz" },
        { booking_id: booking.id, step: "documents", title: "Hujjatlar jarayoni", description: "Pasport va hujjatlar" },
        { booking_id: booking.id, step: "visa", title: "Viza jarayoni", description: "Viza uchun ariza" },
        { booking_id: booking.id, step: "ticket", title: "Chipta", description: "Aviachiptalar rasmiylashtiriladi" },
        { booking_id: booking.id, step: "flight", title: "Uchish", description: "Sayohat boshlanadi" },
        { booking_id: booking.id, step: "started", title: "Tur boshlandi", description: "Sayohatingizdan zavqlaning!" },
      ];

      await supabase.from("booking_timeline").insert(timelineSteps);

      if (referralAgentId) {
        const { data: agentData } = await supabase
          .from("agents")
          .select("commission_rate")
          .eq("id", referralAgentId)
          .single();
        const commissionRate = agentData?.commission_rate || 10;
        const commissionAmount = (finalPrice * commissionRate) / 100;
        await supabase
          .from("agent_referrals")
          .insert({
            agent_id: referralAgentId,
            booking_id: booking.id,
            commission_amount: commissionAmount,
            status: "pending",
          });
        localStorage.removeItem("referral_agent_id");
      }

      // Clear saved form data
      if (id) localStorage.removeItem(`booking_form_${id}`);
      
      setBookingId(booking.id);
      setStep(5);
      toast.success("Joyingiz muvaffaqiyatli band qilindi!");
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error("Bron qilishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSteps = 4;
  const progressPercent = (Math.min(step, 4) / totalSteps) * 100;

  const stepLabels = [
    { num: 1, label: "Sana" },
    { num: 2, label: "Ma'lumot" },
    { num: 3, label: "Xulosa" },
    { num: 4, label: "To'lov" },
  ];

  // Success page
  if (step === 5) {
    return (
      <Layout>
        <div className="container-custom py-8 md:py-16">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="text-center mb-8"
            >
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Joyingiz band qilindi! 🎉</h1>
              <p className="text-muted-foreground">
                10 daqiqa ichida sizga shaxsiy manager tayinlanadi
              </p>
            </motion.div>

            {/* Timeline preview */}
            <div className="bg-card rounded-xl p-6 border border-border mb-6">
              <h3 className="font-semibold mb-4">Buyurtma jarayoni</h3>
              <BookingTimeline
                steps={[
                  { id: "1", step: "reserved", title: "Joy band qilindi", description: "Deposit to'lovi qabul qilindi", completed: true, completed_at: new Date().toISOString() },
                  { id: "2", step: "manager_assigned", title: "Manager tayinlanmoqda", description: "10 daqiqa ichida", completed: false },
                  { id: "3", step: "documents", title: "Hujjatlar", completed: false },
                  { id: "4", step: "visa", title: "Viza", completed: false },
                  { id: "5", step: "ticket", title: "Chipta", completed: false },
                  { id: "6", step: "flight", title: "Uchish", completed: false },
                  { id: "7", step: "started", title: "Tur", completed: false },
                ]}
              />
            </div>

            {/* Booking details */}
            <div className="bg-card rounded-xl p-6 border border-border mb-6">
              <h3 className="font-semibold mb-4">Buyurtma tafsilotlari</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">ID:</span><span>#{bookingId?.slice(0, 8)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tur:</span><span>{tour.title}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sana:</span><span>{new Date(selectedDate).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Mehmonlar:</span><span>{guests} kishi</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Deposit:</span><span className="text-primary font-bold">{formatPrice(DEPOSIT_UZS)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Qolgan summa:</span><span className="font-bold">{formatPrice(remainingAmount)}</span></div>
              </div>
            </div>

            {/* Trust message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Deposit 24 soat ichida qaytariladi</p>
                  <p className="text-xs text-muted-foreground mt-1">Agar firingizni o'zgartirsangiz, deposit to'liq qaytariladi</p>
                </div>
              </div>
            </motion.div>

            {/* Contact info */}
            <div className="bg-card rounded-xl p-4 border border-border mb-6">
              <p className="text-sm font-medium mb-3">Savol bormi? Biz bilan bog'laning:</p>
              <div className="flex gap-3">
                <a href="tel:+998505540605" className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary/10 rounded-lg text-sm text-primary font-medium hover:bg-primary/20 transition-colors">
                  <Phone className="h-4 w-4" /> Qo'ng'iroq
                </a>
                <a href="https://t.me/unitour_uz" target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary/10 rounded-lg text-sm text-primary font-medium hover:bg-primary/20 transition-colors">
                  <MessageCircle className="h-4 w-4" /> Telegram
                </a>
              </div>
            </div>

            {/* Document upload */}
            {bookingId && user && (
              <div className="mb-6">
                <DocumentUpload
                  bookingId={bookingId}
                  userId={user.id}
                  onComplete={() => toast.success("Hujjatlar yuklandi!")}
                />
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate("/")}>Bosh sahifa</Button>
              <Button onClick={() => navigate("/dashboard")}>Mening buyurtmalarim</Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-6">
        <div className="container-custom">
          <BackButton className="mb-3 text-primary-foreground/70 hover:text-primary-foreground" />
          <h1 className="text-2xl font-bold mb-4">Buyurtma berish</h1>
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between">
              {stepLabels.map((s) => (
                <div key={s.num} className={`flex items-center gap-1.5 text-xs ${step >= s.num ? "text-primary-foreground" : "text-primary-foreground/50"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step > s.num ? "bg-white text-primary" : step === s.num ? "bg-white/20 border-2 border-white text-white" : "bg-white/10 text-white/50"
                  }`}>
                    {step > s.num ? <CheckCircle className="h-4 w-4" /> : s.num}
                  </div>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              ))}
            </div>
            <Progress value={progressPercent} className="h-1 bg-white/20" />
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {!user && (
          <div className="bg-accent/20 border border-accent rounded-lg p-4 mb-6">
            <p className="text-sm">
              Buyurtma berish uchun{" "}
              <Link to={`/auth?mode=login&redirect=/booking/${id}`} className="text-primary font-semibold hover:underline">tizimga kiring</Link>
              {" "}yoki{" "}
              <Link to={`/auth?mode=register&redirect=/booking/${id}`} className="text-primary font-semibold hover:underline">ro'yxatdan o'ting</Link>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Step 1: Date confirmation */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="bg-card rounded-xl p-6 border border-border mb-6">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Sayohat sanasini tasdiqlang
                    </h2>
                    <div className="bg-muted/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-semibold text-lg">
                            {selectedDate ? new Date(selectedDate).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" }) : "Sana tanlanmagan"}
                          </p>
                          <p className="text-sm text-muted-foreground">{guests} kishi • {tour.duration.days} kun / {tour.duration.nights} tun</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Agar sana to'g'ri bo'lsa, "Davom etish" tugmasini bosing
                    </p>
                  </div>
                  <Button onClick={() => setStep(2)} className="w-full md:w-auto px-8 py-6" disabled={!selectedDate}>
                    Davom etish
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Personal info */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <form onSubmit={(e) => { e.preventDefault(); if (validateStep2()) setStep(3); }} className="space-y-6">
                    <div className="bg-card rounded-xl p-6 border border-border">
                      <h2 className="font-bold text-lg mb-6">Shaxsiy ma'lumotlar</h2>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">Ism *</Label>
                          <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required className={`mt-1 ${formErrors.firstName ? "border-destructive" : ""}`} />
                          {formErrors.firstName && <p className="text-xs text-destructive mt-1">{formErrors.firstName}</p>}
                        </div>
                        <div>
                          <Label htmlFor="lastName">Familiya *</Label>
                          <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required className={`mt-1 ${formErrors.lastName ? "border-destructive" : ""}`} />
                          {formErrors.lastName && <p className="text-xs text-destructive mt-1">{formErrors.lastName}</p>}
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required className={`mt-1 ${formErrors.email ? "border-destructive" : ""}`} />
                          {formErrors.email && <p className="text-xs text-destructive mt-1">{formErrors.email}</p>}
                        </div>
                        <div>
                          <Label htmlFor="phone">Telefon *</Label>
                          <Input id="phone" name="phone" type="tel" placeholder="+998 90 123 45 67" value={formData.phone} onChange={handleInputChange} required className={`mt-1 ${formErrors.phone ? "border-destructive" : ""}`} />
                          {formErrors.phone && <p className="text-xs text-destructive mt-1">{formErrors.phone}</p>}
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label htmlFor="notes">Qo'shimcha izohlar</Label>
                        <textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} rows={3}
                          className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Maxsus talablar..."
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button type="button" variant="outline" onClick={() => setStep(1)}>Orqaga</Button>
                      <Button type="submit" className="flex-1 md:flex-none px-8 py-6">Davom etish</Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Step 3: Summary */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="space-y-6">
                    <div className="bg-card rounded-xl p-6 border border-border">
                      <h2 className="font-bold text-lg mb-6">Buyurtma xulosasi</h2>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Ism:</span><span className="font-medium">{formData.firstName} {formData.lastName}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Telefon:</span><span className="font-medium">{formData.phone}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span className="font-medium">{formData.email}</span></div>
                        <hr className="border-border" />
                        <div className="flex justify-between"><span className="text-muted-foreground">Tur:</span><span className="font-medium">{tour.title}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Sana:</span><span className="font-medium">{new Date(selectedDate).toLocaleDateString("uz-UZ", { day: "numeric", month: "long" })}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Mehmonlar:</span><span className="font-medium">{guests} kishi</span></div>
                        <hr className="border-border" />
                        <div className="flex justify-between"><span className="text-muted-foreground">Jami narx:</span><span className="font-bold">{formatPrice(finalPrice)}</span></div>
                        <div className="flex justify-between text-primary"><span className="font-medium">Hozir to'lanadigan deposit:</span><span className="font-bold">{formatPrice(DEPOSIT_UZS)} ≈ ${DEPOSIT_USD}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Keyinroq to'lanadigan qoldiq:</span><span className="font-medium">{formatPrice(remainingAmount)}</span></div>
                      </div>
                    </div>

                    {/* Trust reminder */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                      <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Xavfsiz to'lov kafolati</p>
                        <p className="text-xs text-muted-foreground">Deposit 24 soat ichida qaytariladi. Qolgan summa manager bilan kelishilganidan keyin to'lanadi.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setStep(2)}>Orqaga</Button>
                      <Button onClick={() => setStep(4)} className="flex-1 md:flex-none px-8 py-6">
                        <Zap className="h-4 w-4 mr-2" />
                        To'lovga o'tish
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Payment */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="space-y-6">
                    <div className="bg-card rounded-xl p-6 border border-border">
                      <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Deposit to'lovi: {formatPrice(DEPOSIT_UZS)}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-6">Faqat ${DEPOSIT_USD} to'lab joyingizni band qiling</p>

                      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                        <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-primary transition-colors">
                          <RadioGroupItem value="click" id="click" />
                          <Label htmlFor="click" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-xs">CLICK</div>
                              <div>
                                <p className="font-medium">Click</p>
                                <p className="text-xs text-muted-foreground">QR kod orqali to'lov</p>
                              </div>
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-primary transition-colors">
                          <RadioGroupItem value="payme" id="payme" />
                          <Label htmlFor="payme" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-8 bg-cyan-500 rounded flex items-center justify-center text-white font-bold text-xs">PAYME</div>
                              <div>
                                <p className="font-medium">Payme</p>
                                <p className="text-xs text-muted-foreground">Payme orqali to'lov</p>
                              </div>
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-primary transition-colors">
                          <RadioGroupItem value="transfer" id="transfer" />
                          <Label htmlFor="transfer" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold text-xs">💳</div>
                              <div>
                                <p className="font-medium">Karta orqali o'tkazma</p>
                                <p className="text-xs text-muted-foreground">To'lov chekini yuklang</p>
                              </div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Payment instructions */}
                    {(paymentMethod === "click" || paymentMethod === "payme") && (
                      <div className="bg-card rounded-xl p-6 border border-border">
                        <h3 className="font-semibold mb-4">
                          {paymentMethod === "click" ? "Click" : "Payme"} orqali to'lov
                        </h3>
                        <div className="bg-muted rounded-xl p-8 flex items-center justify-center mb-4">
                          <div className="text-center">
                            <div className="w-32 h-32 bg-foreground/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <span className="text-4xl">📱</span>
                            </div>
                            <p className="text-sm text-muted-foreground">QR kodni {paymentMethod === "click" ? "Click" : "Payme"} ilovasi bilan skanerlang</p>
                            <p className="text-lg font-bold text-primary mt-2">{formatPrice(DEPOSIT_UZS)}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          To'lovni amalga oshirgandan so'ng, quyida to'lov chekini (screenshot) yuklang
                        </p>
                      </div>
                    )}

                    {/* Screenshot upload */}
                    <div className="bg-card rounded-xl p-6 border border-border">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Camera className="h-5 w-5 text-primary" />
                        To'lov chekini yuklang
                      </h3>
                      <label className="block w-full border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !user) return;
                            setScreenshotUploading(true);
                            try {
                              const ext = file.name.split('.').pop();
                              const path = `${user.id}/payment-${Date.now()}.${ext}`;
                              const { error } = await supabase.storage.from("booking-documents").upload(path, file);
                              if (error) throw error;
                              const { data: urlData } = supabase.storage.from("booking-documents").getPublicUrl(path);
                              setScreenshotUrl(urlData.publicUrl);
                              toast.success("To'lov cheki yuklandi!");
                            } catch (err: any) {
                              toast.error("Yuklashda xatolik: " + err.message);
                            } finally {
                              setScreenshotUploading(false);
                            }
                          }}
                        />
                        {screenshotUploading ? (
                          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        ) : screenshotUrl ? (
                          <div>
                            <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                            <p className="text-sm text-primary font-medium">Chek yuklandi ✓</p>
                          </div>
                        ) : (
                          <div>
                            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">To'lov chekini yuklash uchun bosing</p>
                            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF</p>
                          </div>
                        )}
                      </label>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setStep(3)}>Orqaga</Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !user}
                        className="flex-1 md:flex-none px-8 py-6"
                      >
                        {isSubmitting ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Yuklanmoqda...</>
                        ) : (
                          <><Zap className="mr-2 h-4 w-4" />Band qilishni tasdiqlash</>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-2xl p-6 border border-border">
              <h3 className="font-bold text-lg mb-4">Buyurtma</h3>
              <div className="flex gap-4 mb-4">
                <img src={tour.image} alt={tour.title} className="w-20 h-20 rounded-lg object-cover" />
                <div>
                  <h4 className="font-semibold text-sm line-clamp-2">{tour.title}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" />{tour.destination}</p>
                </div>
              </div>
              <hr className="my-3 border-border" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Sana</span><span className="font-medium">{selectedDate ? new Date(selectedDate).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" }) : "-"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Davomiylik</span><span className="font-medium">{tour.duration.days} kun / {tour.duration.nights} tun</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Mehmonlar</span><span className="font-medium">{guests} kishi</span></div>
              </div>
              <hr className="my-3 border-border" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{formatPrice(tour.price)} x {guests}</span><span>{formatPrice(totalPrice)}</span></div>
                {promoApplied && (
                  <div className="flex justify-between text-primary">
                    <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{promoApplied.code} (-{promoApplied.discount_percent}%)</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
              </div>
              {/* Promo */}
              {!promoApplied ? (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <Input value={promoCode} onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }} placeholder="Promo kod" className="text-sm uppercase" />
                    <Button type="button" variant="outline" size="sm" onClick={applyPromoCode} disabled={promoLoading || !promoCode.trim()} className="shrink-0">
                      {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Qo'llash"}
                    </Button>
                  </div>
                  {promoError && <p className="text-xs text-destructive">{promoError}</p>}
                </div>
              ) : (
                <button onClick={() => { setPromoApplied(null); setPromoCode(""); }} className="text-xs text-destructive hover:underline mt-2">Bekor qilish</button>
              )}
              <hr className="my-3 border-border" />
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Jami:</span>
                  <span className="text-lg font-bold">{formatPrice(finalPrice)}</span>
                </div>
                <div className="flex justify-between items-center bg-primary/5 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-primary flex items-center gap-1"><Zap className="h-3 w-3" />Deposit:</span>
                  <span className="text-lg font-bold text-primary">{formatPrice(DEPOSIT_UZS)}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">≈ ${DEPOSIT_USD}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookingPage;
