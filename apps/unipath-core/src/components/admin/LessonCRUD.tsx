import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Save, BookOpen, Loader2, Clock } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface Lesson {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: string;
  room_id: string | null;
  subject_id: string;
  teacher_id: string;
  topic: string | null;
}

interface LessonCRUDProps {
  lessons: Lesson[];
  rooms: { id: string; name: string }[];
  onRefresh: () => void;
}

const LessonCRUD = ({ lessons, rooms, onRefresh }: LessonCRUDProps) => {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [roomId, setRoomId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [status, setStatus] = useState("upcoming");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-list"],
    queryFn: async () => {
      const { data } = await supabase.from("subjects").select("id, name");
      return data || [];
    },
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers-list"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "teacher");
      if (!roles?.length) return [];
      const ids = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      return profiles || [];
    },
  });

  const openNew = () => {
    setEditing(null);
    setTitle(""); setTopic(""); setStartsAt(""); setEndsAt(""); setRoomId(""); setSubjectId(""); setTeacherId(""); setStatus("upcoming");
    setShowForm(true);
  };

  const openEdit = (l: Lesson) => {
    setEditing(l);
    setTitle(l.title);
    setTopic(l.topic || "");
    setStartsAt(l.starts_at.slice(0, 16));
    setEndsAt(l.ends_at.slice(0, 16));
    setRoomId(l.room_id || "");
    setSubjectId(l.subject_id);
    setTeacherId(l.teacher_id);
    setStatus(l.status);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !startsAt || !endsAt || !subjectId || !teacherId) {
      toast.error(t("admin.fill_required"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        topic: topic.trim() || null,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        room_id: roomId || null,
        subject_id: subjectId,
        teacher_id: teacherId,
        status,
      };
      if (editing) {
        const { error } = await supabase.from("lessons").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success(t("admin.lesson_updated"));
      } else {
        const { error } = await supabase.from("lessons").insert(payload);
        if (error) throw error;
        toast.success(t("admin.lesson_created"));
      }
      setShowForm(false);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase.from("lessons").delete().eq("id", id);
      if (error) throw error;
      toast.success(t("admin.lesson_deleted"));
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setDeleting(null);
    }
  };

  const statusColors: Record<string, string> = {
    live: "bg-success/20 text-success",
    upcoming: "bg-primary/20 text-primary",
    completed: "bg-muted text-muted-foreground",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
      className="glass-strong p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold">{t("admin.lessons")}</h2>
            <p className="text-xs text-muted-foreground">{lessons.length} {t("admin.total_lessons")}</p>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
          <Plus className="w-3.5 h-3.5" /> {t("admin.add_lesson")}
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/30 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{editing ? t("admin.edit_lesson") : t("admin.add_lesson")}</h3>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-muted/50"><X className="w-4 h-4" /></button>
              </div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("admin.lesson_title")}
                className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30" />
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={t("admin.lesson_topic")}
                className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">{t("admin.start_time")}</label>
                  <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">{t("admin.end_time")}</label>
                  <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30">
                  <option value="">{t("admin.select_subject")}</option>
                  {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30">
                  <option value="">{t("admin.select_teacher")}</option>
                  {teachers.map((t: any) => <option key={t.user_id} value={t.user_id}>{t.full_name || t.user_id}</option>)}
                </select>
                <select value={roomId} onChange={(e) => setRoomId(e.target.value)}
                  className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30">
                  <option value="">{t("admin.select_room")}</option>
                  {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-background text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30">
                <option value="upcoming">{t("student.upcoming")}</option>
                <option value="live">{t("student.live")}</option>
                <option value="completed">{t("admin.completed")}</option>
              </select>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editing ? t("admin.save_changes") : t("admin.create")}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {lessons.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{t("teacher.no_lessons")}</p>
      ) : (
        <div className="grid gap-2 max-h-[400px] overflow-y-auto scrollbar-hide">
          {lessons.slice(0, 20).map((l) => {
            const start = new Date(l.starts_at);
            const end = new Date(l.ends_at);
            return (
              <motion.div key={l.id} layout className="p-3 rounded-xl bg-muted/20 border border-border/20 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{l.title}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[l.status] || "bg-muted"}`}>{l.status}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(l)} className="p-1.5 rounded-lg hover:bg-muted/50">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(l.id)} disabled={deleting === l.id} className="p-1.5 rounded-lg hover:bg-destructive/10">
                      {deleting === l.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-destructive" /> : <Trash2 className="w-3.5 h-3.5 text-destructive" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default LessonCRUD;
