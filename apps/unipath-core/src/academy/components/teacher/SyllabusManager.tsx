import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, CheckCircle2, Circle, Eye, EyeOff, Save, Loader2, Wand2 } from "lucide-react";

/**
 * SyllabusManager — har bir fan uchun mavzular ketma-ketligi.
 * - Qo'lda qo'shish/o'chirish/tartiblash
 * - "NOVA Yordamchi: PDF dan mavzular" — yuklangan resursdan auto-extract
 */
const SyllabusManager = () => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [subjectId, setSubjectId] = useState<string>("");
  const [newTitle, setNewTitle] = useState("");
  const [generatingFrom, setGeneratingFrom] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const { data: subjects = [] } = useQuery({
    queryKey: ["teacher-subjects", user?.id],
    queryFn: async () => {
      const { data: grps } = await supabase.from("groups").select("subject_id").eq("teacher_id", user!.id);
      const subjectIds = Array.from(new Set((grps || []).map((g: any) => g.subject_id).filter(Boolean)));
      if (subjectIds.length === 0) return [];
      const { data } = await supabase.from("subjects").select("id, name").in("id", subjectIds);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: topics = [] } = useQuery({
    queryKey: ["topics", subjectId, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("lesson_topics")
        .select("*").eq("subject_id", subjectId).eq("teacher_id", user!.id).order("position");
      return data || [];
    },
    enabled: !!subjectId && !!user,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["resources", subjectId, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("teacher_resources")
        .select("id, title").eq("subject_id", subjectId).eq("teacher_id", user!.id);
      return data || [];
    },
    enabled: !!subjectId && !!user,
  });

  const addTopic = useMutation({
    mutationFn: async () => {
      if (!newTitle.trim() || !subjectId) return;
      const nextPos = topics.length;
      await supabase.from("lesson_topics").insert({
        organization_id: profile?.organization_id, subject_id: subjectId,
        teacher_id: user!.id, title: newTitle.trim(), position: nextPos, source: "manual",
      });
    },
    onSuccess: () => { setNewTitle(""); qc.invalidateQueries({ queryKey: ["topics"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("lesson_topics").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["topics"] }),
  });

  const move = useMutation({
    mutationFn: async ({ id, dir }: { id: string; dir: -1 | 1 }) => {
      const idx = topics.findIndex((t: any) => t.id === id);
      const swap = idx + dir;
      if (swap < 0 || swap >= topics.length) return;
      const a = topics[idx]; const b = topics[swap];
      await supabase.from("lesson_topics").update({ position: b.position }).eq("id", a.id);
      await supabase.from("lesson_topics").update({ position: a.position }).eq("id", b.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["topics"] }),
  });

  const toggleCovered = useMutation({
    mutationFn: async ({ id, covered }: { id: string; covered: boolean }) => {
      await supabase.from("lesson_topics").update({
        status: covered ? "covered" : "planned",
        covered_at: covered ? new Date().toISOString() : null,
      }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["topics"] }),
  });

  const generateFromResource = async () => {
    if (!generatingFrom || !subjectId) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("syllabus-from-pdf", {
        body: { resource_id: generatingFrom, subject_id: subjectId },
      });
      if (error) throw error;
      toast.success(`${data?.added || 0} ta mavzu qo'shildi`);
      qc.invalidateQueries({ queryKey: ["topics"] });
    } catch (e: any) {
      toast.error(e.message || "Avtomatik tuzib bo'lmadi");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Mavzular rejasi</h2>

      <div className="glass-strong p-3">
        <label className="text-[10px] uppercase font-bold text-muted-foreground">Fan</label>
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
          className="w-full mt-1 glass px-3 py-2 rounded-lg text-sm bg-background">
          <option value="">— Fanni tanlang —</option>
          {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {subjectId && (
        <>
          {/* Auto from PDF */}
          {resources.length > 0 && (
            <div className="glass-strong p-3 space-y-2">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-accent" /> Yuklangan kitobdan avtomatik tuzish
              </p>
              <div className="flex gap-2">
                <select value={generatingFrom} onChange={(e) => setGeneratingFrom(e.target.value)}
                  className="flex-1 glass px-3 py-2 rounded-lg text-sm bg-background">
                  <option value="">— Resurs —</option>
                  {resources.map((r: any) => <option key={r.id} value={r.id}>{r.title}</option>)}
                </select>
                <button onClick={generateFromResource} disabled={busy || !generatingFrom}
                  className="bg-gradient-to-br from-accent to-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50">
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                  Tuzish
                </button>
              </div>
            </div>
          )}

          {/* Add manual */}
          <div className="glass-strong p-3 flex gap-2">
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTopic.mutate()}
              placeholder="Yangi mavzu sarlavhasi"
              className="flex-1 glass px-3 py-2 rounded-lg text-sm bg-background" />
            <button onClick={() => addTopic.mutate()} disabled={!newTitle.trim()}
              className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 disabled:opacity-50">
              <Plus className="w-3.5 h-3.5" /> Qo'sh
            </button>
          </div>

          {/* List */}
          <div className="space-y-1.5">
            {topics.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Hozircha mavzu yo'q</p>
            )}
            {topics.map((t: any, i: number) => (
              <motion.div key={t.id} layout
                className={`glass p-3 flex items-center gap-2 ${t.status === "covered" ? "opacity-70" : ""}`}>
                <button onClick={() => toggleCovered.mutate({ id: t.id, covered: t.status !== "covered" })}>
                  {t.status === "covered"
                    ? <CheckCircle2 className="w-4 h-4 text-success" />
                    : <Circle className="w-4 h-4 text-muted-foreground" />}
                </button>
                <span className="text-xs font-mono text-muted-foreground w-6">{i + 1}.</span>
                <span className={`flex-1 text-sm ${t.status === "covered" ? "line-through" : ""}`}>{t.title}</span>
                <button onClick={() => move.mutate({ id: t.id, dir: -1 })} disabled={i === 0}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => move.mutate({ id: t.id, dir: 1 })} disabled={i === topics.length - 1}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove.mutate(t.id)} className="p-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SyllabusManager;
