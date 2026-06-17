import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, KeyRound, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const nameSchema = z.string().trim().min(1, "Ism bo'sh bo'lmasin").max(100);
const passwordSchema = z.string().min(6, "Kamida 6 belgi").max(72);

const ProfileEditForm = () => {
  const { user, profile, refresh } = useAuth();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [savingName, setSavingName] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const handleSaveName = async () => {
    const parsed = nameSchema.safeParse(fullName);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (!user) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: parsed.data })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success(t("profile.name_updated"));
      refresh?.();
      window.dispatchEvent(new Event("nova:profile-updated"));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("profile.pwd_mismatch"));
      return;
    }
    setSavingPwd(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(t("auth.password_updated"));
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong p-4 sm:p-5 space-y-5"
    >
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {t("profile.edit_section")}
      </h3>

      {/* Name */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <UserIcon className="w-3.5 h-3.5" /> {t("auth.full_name")}
        </label>
        <div className="flex gap-2">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t("auth.full_name")}
            maxLength={100}
            className="flex-1 bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveName}
            disabled={savingName || fullName === (profile?.full_name || "")}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 disabled:opacity-40"
          >
            {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">{t("admin.save_changes")}</span>
          </motion.button>
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2 pt-3 border-t border-border/30">
        <label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5" /> {t("profile.change_password")}
        </label>
        <div className="space-y-2">
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("auth.new_password")}
              className="w-full bg-background text-sm rounded-xl px-3 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <input
            type={showPwd ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("auth.confirm_password")}
            className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30"
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleChangePassword}
            disabled={savingPwd || !newPassword || !confirmPassword}
            className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {savingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {t("auth.update_password")}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileEditForm;
