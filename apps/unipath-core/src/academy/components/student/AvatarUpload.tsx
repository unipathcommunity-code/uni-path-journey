import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface AvatarUploadProps {
  onUpdated?: (url: string) => void;
  /**
   * Size variant.
   *  - "sm" (default): compact 36px button used in headers.
   *  - "hero": large 96px round portrait used on the profile page.
   */
  size?: "sm" | "hero";
}

const AvatarUpload = ({ onUpdated, size = "sm" }: AvatarUploadProps) => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // profile takes precedence so updates from elsewhere are reflected, fallback to local optimistic update
  const avatarUrl = profile?.avatar_url || localUrl;
  const initials = profile?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      toast.success(t("profile.avatar_updated"));
      setLocalUrl(publicUrl);
      onUpdated?.(publicUrl);
      setShowModal(false);
      window.dispatchEvent(new CustomEvent("nova:profile-updated", { detail: { avatar_url: publicUrl } }));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Heros are big (96px), header chips small (36px). object-cover keeps the
  // photo crisp instead of stretching it inside the square.
  const isHero = size === "hero";
  const sizeClasses = isHero ? "w-24 h-24" : "w-9 h-9";
  const ringClasses = isHero
    ? "ring-4 ring-primary/20 shadow-xl"
    : "ring-2 ring-primary/20";

  return (
    <>
      <button onClick={() => setShowModal(true)} className="relative group" aria-label={t("profile.change_avatar")}>
        <Avatar className={`${sizeClasses} ${ringClasses} transition-shadow`}>
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />
          ) : (
            <AvatarFallback className={`bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold ${isHero ? "text-2xl" : "text-xs"}`}>
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
        <div className={`absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${isHero ? "" : ""}`}>
          <Camera className={`${isHero ? "w-6 h-6" : "w-3.5 h-3.5"} text-white`} />
        </div>
        {isHero && (
          <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-background">
            <Camera className="w-4 h-4" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-strong p-6 max-w-xs w-full text-center space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t("profile.change_avatar")}</h3>
                <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>

              <Avatar className="w-28 h-28 mx-auto ring-4 ring-primary/20 shadow-lg">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Avatar preview" className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <p className="text-[11px] text-muted-foreground">
                PNG / JPG / WEBP — kvadrat rasm tavsiya etiladi (1:1)
              </p>

              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />

              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {uploading ? t("common.loading") : t("profile.upload_photo")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AvatarUpload;
