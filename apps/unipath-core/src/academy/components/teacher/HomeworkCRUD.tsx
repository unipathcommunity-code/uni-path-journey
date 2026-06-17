import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Save, FileText, Loader2, ClipboardList, Eye } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HomeworkSubmissionsList from "./HomeworkSubmissionsList";

interface Homework {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  max_score: number | null;
  status: string;
  lesson_id: string;
}

const HomeworkCRUD = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Homework | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [lessonId, setLessonId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewingSubmissions, setViewingSubmissions] = useState<Homework | null>(null);

  const { data: lessons = [] } = useQuery({
    queryKey: ["teacher-lessons-for-hw", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("lessons")
        .select("id, title, subjects(name)")
        .eq("teacher_id", user.id)
        .order("starts_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: homework = [], refetch } = useQuery({
    queryKey: ["teacher-homework", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("homework")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });
      return (data || []) as Homework[];
    },
    enabled: !!user,
  });

  const open = (hw?: Homework) => {
    setEditing(hw || null);
    setTitle(hw?.title || "");
    setDescription(hw?.description || "");
    setDueDate(hw?.due_date ? new Date(hw.due_date).toISOString().slice(0, 16) : "");
    setMaxScore(String(hw?.max_score || 100));
    setLessonId(hw?.lesson_id || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !dueDate || !lessonId || !user) {
      toast.error(t("admin.fill_required"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        due_date: new Date(dueDate).toISOString(),
        max_score: parseInt(maxScore) || 100,
        lesson_id: lessonId,
        teacher_id: user.id,
      };
      if (editing) {
        const { error } = await supabase.from("homework").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success(t("teacher.hw_updated"));
      } else {
        const { error } = await supabase.from("homework").insert(payload);
        if (error) throw error;
        toast.success(t("teacher.hw_created"));
      }
      setShowForm(false);
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase.from("homework").delete().eq("id", id);
      if (error) throw error;
      toast.success(t("teacher.hw_deleted"));
      refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleting(null);
    }
  };

  if (viewingSubmissions) {
    return (
      <HomeworkSubmissionsList
        homework={viewingSubmissions}
        onBack={() => setViewingSubmissions(null)}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="glass-strong p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-heading font-semibold">{t("teacher.homework_mgmt")}</h2>
              <p className="text-xs text-muted-foreground">{homework.length} {t("teacher.assigned")}</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => open()}
            disabled={lessons.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" /> {t("teacher.add_hw")}
          </motion.button>
        </div>

        {lessons.length === 0 && (
          <p className="text-xs text-warning bg-warning/10 p-3 rounded-xl">{t("teacher.no_lessons_for_hw")}</p>
        )}

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{editing ? t("teacher.edit_hw") : t("teacher.add_hw")}</h3>
                  <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-muted/50">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("teacher.hw_title")}
                  className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("teacher.hw_desc")}
                  rows={3}
                  className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30 resize-none"
                />
                <select
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                  className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30"
                >
                  <option value="">{t("teacher.select_lesson")}</option>
                  {lessons.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.title} {l.subjects?.name && `· ${l.subjects.name}`}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground">{t("teacher.due_date")}</label>
                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">{t("teacher.max_score")}</label>
                    <input
                      type="number"
                      value={maxScore}
                      onChange={(e) => setMaxScore(e.target.value)}
                      className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30 mt-1"
                    />
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editing ? t("admin.save_changes") : t("admin.create")}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {homework.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t("teacher.no_homework")}</p>
        ) : (
          <div className="space-y-2">
            {homework.map((hw, i) => {
              const due = new Date(hw.due_date);
              const overdue = due < new Date();
              return (
                <motion.div
                  key={hw.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-3 rounded-xl bg-muted/20 border border-border/20 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                      <p className="text-sm font-medium truncate">{hw.title}</p>
                    </div>
                    {hw.description && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{hw.description}</p>
                    )}
                    <p className={`text-[10px] mt-1 ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                      {t("student.due")}: {due.toLocaleString()} · {hw.max_score} {t("student.score").toLowerCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setViewingSubmissions(hw)}
                      className="p-1.5 rounded-lg hover:bg-primary/10"
                      title={t("teacher.view_submissions")}
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" />
                    </button>
                    <button onClick={() => open(hw)} className="p-1.5 rounded-lg hover:bg-muted/50">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(hw.id)}
                      disabled={deleting === hw.id}
                      className="p-1.5 rounded-lg hover:bg-destructive/10"
                    >
                      {deleting === hw.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-destructive" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      )}
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

export default HomeworkCRUD;
