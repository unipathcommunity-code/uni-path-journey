import { useFeatureToggles } from "@/hooks/useFeatureToggles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ToggleLeft, Loader2, ShieldCheck, CreditCard, Package, MessageSquare, Mail, CalendarCheck, Eye, BadgePercent, Users } from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/common/PageTransition";
import { motion } from "framer-motion";

const featureIcons: Record<string, any> = {
  booking_system: CalendarCheck,
  payment_system: CreditCard,
  tours_visibility: Eye,
  chat_widget: MessageSquare,
  social_proof: Users,
  newsletter: Mail,
  promo_codes: BadgePercent,
};

const AdminFeatureToggles = () => {
  const { toggles, isLoading, updateToggle } = useFeatureToggles();

  const handleToggle = async (id: string, currentState: boolean) => {
    try {
      await updateToggle.mutateAsync({ id, is_enabled: !currentState });
      toast.success(`Funksiya ${!currentState ? "yoqildi" : "o'chirildi"}`);
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ToggleLeft className="h-6 w-6" />
            Feature Toggles
          </h1>
          <p className="text-muted-foreground">Platformadagi funksiyalarni yoqish yoki o'chirish</p>
        </motion.div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Diqqat!</p>
            <p className="text-xs text-muted-foreground">Funksiyalarni o'chirish barcha foydalanuvchilarga ta'sir qiladi. Ehtiyotkorlik bilan ishlatng.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {toggles.map((toggle, i) => {
            const Icon = featureIcons[toggle.feature_key] || Package;
            return (
              <motion.div
                key={toggle.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toggle.is_enabled ? "bg-primary/10" : "bg-muted"}`}>
                          <Icon className={`h-5 w-5 ${toggle.is_enabled ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className="font-medium">{toggle.feature_name}</p>
                          <p className="text-xs text-muted-foreground">{toggle.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={toggle.is_enabled ? "default" : "secondary"}>
                          {toggle.is_enabled ? "Yoqilgan" : "O'chirilgan"}
                        </Badge>
                        <Switch
                          checked={toggle.is_enabled}
                          onCheckedChange={() => handleToggle(toggle.id, toggle.is_enabled)}
                          disabled={updateToggle.isPending}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminFeatureToggles;
