import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, FileDown, Save, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";

interface Props {
  homework: { id: string; title: string; max_score: number | null };
  onBack: () => void;
}

interface Submission {
  id: string;
  student_id: string;
  content: string | null;
  file_url: string | null;
  score: number | null;
  feedback: string | null;
  status: string;
  submitted_at: string | null;
  graded_at: string | null;
}

const HomeworkSubmissionsList = ({ homework, onBack }: Props) => {
  const { t } = useLanguage();
  const [grading, setGrading] = useState<Record<string, { score: string; feedback: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data: submissions = [], refetch, isLoading } = useQuery({
    queryKey: ["hw-submissions", homework.id],
    queryFn: async () => {
      const { data: subs } = await supabase
        .from("homework_submissions")
        .select("*")
        .eq("homework_id", homework.id)
        .order("submitted_at", { ascending: false });
      const list = (subs || []) as Submission[];
      // fetch profiles for student names
      const ids = [...new Set(list.map((s) => s.student_id))];
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", ids)
        : { data: [] };
      const profMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
      return list.map((s) => ({ ...s, profile: profMap.get(s.student_id) }));
    },
  });

  const handleSaveGrade = async (sub: any) => {
    const g = grading[sub.id] || { score: String(sub.score ?? ""), feedback: sub.feedback ?? "" };
    const score = parseInt(g.score);
    if (isNaN(score) || score < 0 || score > (homework.max_score || 100)) {
      toast.error(t("teacher.invalid_score"));
      return;
    }
    setSavingId(sub.id);
    try {
      const { error } = await supabase
        .from("homework_submissions")
        .update({
          score,
          feedback: g.feedback || null,
          status: "graded",
          graded_at: new Date().toISOString(),
        })
        .eq("id", sub.id);
      if (error) throw error;
      toast.success(t("teacher.graded_success"));
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingId(null);
    }
  };

  const downloadFile = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from("homework-files").createSignedUrl(path, 60);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
      <div className="glass-strong p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-muted/50">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-heading font-semibold truncate">{homework.title}</h2>
            <p className="text-xs text-muted-foreground">
              {submissions.length} {t("teacher.submissions")} · {t("student.score").toLowerCase()}: {homework.max_score}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t("teacher.no_submissions")}</p>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub: any, i) => {
              const g = grading[sub.id] || {
                score: sub.score !== null ? String(sub.score) : "",
                feedback: sub.feedback || "",
              };
              const isGraded = sub.status === "graded";
              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 sm:p-4 rounded-xl bg-muted/20 border border-border/20 space-y-2"
                >
                  <div className="flex items-center gap-3">
                    {sub.profile?.avatar_url ? (
                      <img src={sub.profile.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {(sub.profile?.full_name || "?")[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{sub.profile?.full_name || sub.student_id.slice(0, 8)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : "—"}
                      </p>
                    </div>
                    {isGraded ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {sub.score}/{homework.max_score}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning/10 text-warning flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {t("teacher.pending_grade")}
                      </span>
                    )}
                  </div>

                  {sub.content && (
                    <div className="p-2 rounded-lg bg-background/50 text-xs text-foreground whitespace-pre-wrap break-words">
                      {sub.content}
                    </div>
                  )}

                  {sub.file_url && (
                    <button
                      onClick={() => downloadFile(sub.file_url)}
                      className="text-xs text-primary flex items-center gap-1.5 hover:underline"
                    >
                      <FileDown className="w-3.5 h-3.5" /> {t("teacher.view_file")}
                    </button>
                  )}

                  <div className="grid grid-cols-[100px_1fr_auto] gap-2 pt-1">
                    <input
                      type="number"
                      placeholder={t("student.score")}
                      value={g.score}
                      max={homework.max_score || 100}
                      min={0}
                      onChange={(e) => setGrading((p) => ({ ...p, [sub.id]: { ...g, score: e.target.value } }))}
                      className="bg-background text-sm rounded-lg px-2 py-2 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30"
                    />
                    <input
                      placeholder={t("teacher.feedback")}
                      value={g.feedback}
                      onChange={(e) => setGrading((p) => ({ ...p, [sub.id]: { ...g, feedback: e.target.value } }))}
                      className="bg-background text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30"
                    />
                    <button
                      onClick={() => handleSaveGrade(sub)}
                      disabled={savingId === sub.id}
                      className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 disabled:opacity-40"
                    >
                      {savingId === sub.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HomeworkSubmissionsList;
