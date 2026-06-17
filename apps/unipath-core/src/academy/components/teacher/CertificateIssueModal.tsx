import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Award, X, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  student: { id: string; name: string } | null;
}

/**
 * CertificateIssueModal — o'qituvchi yakunlangan o'quvchi uchun sertifikat beradi.
 * Sertifikat avtomatik o'quvchining portfolio'sida (Evolution → Portfolio) ko'rinadi
 * va QR-kod orqali jamoatchilik /verify/:token sahifasidan haqiqiyligini tekshira oladi.
 */
const CertificateIssueModal = ({ open, onClose, student }: Props) => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [score, setScore] = useState<string>("");
  const [description, setDescription] = useState("");

  const issue = useMutation({
    mutationFn: async () => {
      if (!user || !profile?.organization_id || !student) throw new Error("Maʼlumot yetishmaydi");
      if (!title.trim()) throw new Error("Sarlavha kiritilmagan");
      const payload: any = {
        organization_id: profile.organization_id,
        student_id: student.id,
        issued_by: user.id,
        title: title.trim(),
        subject: subject.trim() || null,
        grade: grade.trim() || null,
        description: description.trim() || null,
        score: score ? Number(score) : null,
      };
      const { data, error } = await supabase.from("certificates").insert(payload).select("public_token").single();
      if (error) throw error;

      // Oquvchini xabardor qilish
      await supabase.from("notifications").insert({
        user_id: student.id,
        organization_id: profile.organization_id,
        title: "🏆 Yangi sertifikat",
        message: `Sizga "${title}" sertifikati berildi. Portfolio bo'limidan ko'ring.`,
        type: "achievement",
        is_alarm: true,
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Sertifikat berildi va portfolio'ga qo'shildi");
      qc.invalidateQueries({ queryKey: ["teacher-certificates"] });
      qc.invalidateQueries({ queryKey: ["student-certificates"] });
      setTitle(""); setSubject(""); setGrade(""); setScore(""); setDescription("");
      onClose();
    },
    onError: (e: any) => toast.error(e.message || "Sertifikat berib bo'lmadi"),
  });

  return (
    <AnimatePresence>
      {open && student && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="glass-strong rounded-2xl p-5 w-full max-w-md space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Award className="w-5 h-5 text-warning" /> Sertifikat berish
              </h3>
              <button onClick={onClose} className="p-1 rounded hover:bg-muted/40"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-muted-foreground">O'quvchi: <span className="font-semibold text-foreground">{student.name}</span></p>

            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sarlavha (masalan: Algebra a'lo bilan tugatildi)"
              className="w-full glass px-3 py-2 rounded-lg text-sm bg-background" />
            <div className="grid grid-cols-2 gap-2">
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Fan"
                className="glass px-3 py-2 rounded-lg text-sm bg-background" />
              <input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Daraja (A+, 1-o'rin...)"
                className="glass px-3 py-2 rounded-lg text-sm bg-background" />
            </div>
            <input value={score} onChange={(e) => setScore(e.target.value)} placeholder="Ball (ixtiyoriy)" type="number"
              className="w-full glass px-3 py-2 rounded-lg text-sm bg-background" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Izoh"
              rows={3} className="w-full glass px-3 py-2 rounded-lg text-sm bg-background resize-none" />

            <button onClick={() => issue.mutate()} disabled={issue.isPending || !title.trim()}
              className="w-full bg-gradient-to-br from-warning to-accent text-primary-foreground py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              {issue.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
              Sertifikatni berish
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CertificateIssueModal;
