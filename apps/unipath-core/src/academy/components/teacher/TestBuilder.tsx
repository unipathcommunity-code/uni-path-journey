import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Plus, Trash2, Sparkles, Loader2, FileSpreadsheet, FileText, Send, BookOpen,
} from "lucide-react";

type Question = {
  id?: string;
  question_text: string;
  options: { key: string; text: string }[];
  correct_key: string;
  points: number;
};

const blankQuestion = (): Question => ({
  question_text: "",
  options: [{ key: "A", text: "" }, { key: "B", text: "" }, { key: "C", text: "" }, { key: "D", text: "" }],
  correct_key: "A",
  points: 1,
});

/**
 * TestBuilder — qo'lda yoki yuklangan kitobdan testlar tuzish.
 * Faollashtirilgandan so'ng o'quvchilar /app dan test ko'rishadi (alohida fitch).
 * Eksport: CSV (Excel-compatible).
 */
const TestBuilder = () => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const { data: tests = [] } = useQuery({
    queryKey: ["my-tests", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("tests").select("*, subjects(name)")
        .eq("teacher_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["teacher-subjects-test", user?.id],
    queryFn: async () => {
      const { data: grps } = await supabase.from("groups").select("subject_id").eq("teacher_id", user!.id);
      const ids = Array.from(new Set((grps || []).map((g: any) => g.subject_id).filter(Boolean)));
      if (ids.length === 0) return [];
      const { data } = await supabase.from("subjects").select("id, name").in("id", ids);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["my-resources-test", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("teacher_resources").select("id, title").eq("teacher_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const createTest = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("tests").insert({
        teacher_id: user!.id, organization_id: profile!.organization_id,
        title: "Yangi test", duration_minutes: 30, status: "draft",
      }).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => { setEditing(id); qc.invalidateQueries({ queryKey: ["my-tests"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const generateFromPdf = async (resourceId: string, subjectId?: string) => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("test-from-pdf", {
        body: { resource_id: resourceId, subject_id: subjectId, num_questions: 10 },
      });
      if (error) throw error;
      toast.success(`${data?.added || 0} ta savolli test yaratildi`);
      qc.invalidateQueries({ queryKey: ["my-tests"] });
      if (data?.test_id) setEditing(data.test_id);
    } catch (e: any) { toast.error(e.message || "Tuzib bo'lmadi"); }
    finally { setGenerating(false); }
  };

  if (editing) {
    return <TestEditor testId={editing} onClose={() => setEditing(null)} subjects={subjects} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Testlar</h2>
        <button onClick={() => createTest.mutate()}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Yangi
        </button>
      </div>

      {resources.length > 0 && (
        <div className="glass-strong p-3 space-y-2">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" /> Yuklangan kitobdan avtomatik test
          </p>
          {resources.map((r: any) => (
            <div key={r.id} className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="flex-1 text-xs truncate">{r.title}</span>
              <button onClick={() => generateFromPdf(r.id)} disabled={generating}
                className="bg-gradient-to-br from-accent to-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50">
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Tuzish
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        {tests.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">Hozircha test yo'q</p>
        )}
        {tests.map((t: any) => (
          <div key={t.id} className="glass p-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            <button onClick={() => setEditing(t.id)} className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate">{t.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {t.subjects?.name || "—"} · {t.total_questions} savol · {t.status}
              </p>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const TestEditor = ({ testId, onClose, subjects }: { testId: string; onClose: () => void; subjects: any[] }) => {
  const qc = useQueryClient();
  const [adding, setAdding] = useState<Question>(blankQuestion());

  const { data: test } = useQuery({
    queryKey: ["test", testId],
    queryFn: async () => (await supabase.from("tests").select("*").eq("id", testId).single()).data,
  });
  const { data: questions = [] } = useQuery({
    queryKey: ["test-q", testId],
    queryFn: async () => (await supabase.from("test_questions").select("*").eq("test_id", testId).order("position")).data || [],
  });

  const updateTest = useMutation({
    mutationFn: async (patch: any) => { await supabase.from("tests").update(patch).eq("id", testId); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["test", testId] }),
  });

  const addQ = useMutation({
    mutationFn: async () => {
      if (!adding.question_text.trim()) return;
      await supabase.from("test_questions").insert({
        test_id: testId, position: questions.length,
        question_text: adding.question_text, options: adding.options as any,
        correct_key: adding.correct_key, points: adding.points,
      });
      await supabase.from("tests").update({ total_questions: questions.length + 1 }).eq("id", testId);
    },
    onSuccess: () => { setAdding(blankQuestion()); qc.invalidateQueries({ queryKey: ["test-q", testId] }); qc.invalidateQueries({ queryKey: ["test", testId] }); },
  });

  const removeQ = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("test_questions").delete().eq("id", id);
      await supabase.from("tests").update({ total_questions: Math.max(0, questions.length - 1) }).eq("id", testId);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["test-q", testId] }); qc.invalidateQueries({ queryKey: ["test", testId] }); },
  });

  const exportXls = () => {
    const rows = questions.map((q: any, i: number) => ({
      "#": i + 1, Savol: q.question_text,
      A: q.options?.[0]?.text || "", B: q.options?.[1]?.text || "",
      C: q.options?.[2]?.text || "", D: q.options?.[3]?.text || "",
      "To'g'ri": q.correct_key, Ball: q.points,
    }));
    const csv = [Object.keys(rows[0] || {}).join(",")].concat(
      rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${test?.title || "test"}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!test) return <div className="glass-strong p-6 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-3">
      <button onClick={onClose} className="text-xs text-muted-foreground">← Orqaga</button>

      <div className="glass-strong p-3 space-y-2">
        <input value={test.title} onChange={(e) => updateTest.mutate({ title: e.target.value })}
          className="w-full glass px-3 py-2 rounded-lg text-sm font-semibold bg-background" />
        <div className="grid grid-cols-3 gap-2">
          <select value={test.subject_id || ""} onChange={(e) => updateTest.mutate({ subject_id: e.target.value || null })}
            className="glass px-2 py-2 rounded-lg text-xs bg-background">
            <option value="">— Fan —</option>
            {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="number" value={test.duration_minutes} onChange={(e) => updateTest.mutate({ duration_minutes: Number(e.target.value) })}
            className="glass px-2 py-2 rounded-lg text-xs bg-background" placeholder="Daqiqa" />
          <select value={test.status} onChange={(e) => updateTest.mutate({ status: e.target.value })}
            className="glass px-2 py-2 rounded-lg text-xs bg-background">
            <option value="draft">Qoralama</option>
            <option value="published">Faol</option>
            <option value="closed">Yopilgan</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={exportXls} disabled={questions.length === 0}
            className="flex-1 glass px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50">
            <FileSpreadsheet className="w-3 h-3" /> Excel/CSV
          </button>
          <button onClick={() => updateTest.mutate({ status: "published" })}
            className="flex-1 bg-gradient-to-br from-accent to-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
            <Send className="w-3 h-3" /> Faollashtirish
          </button>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-1.5">
        {questions.map((q: any, i: number) => (
          <div key={q.id} className="glass p-3">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-xs font-mono text-muted-foreground">{i + 1}.</span>
              <p className="flex-1 text-sm">{q.question_text}</p>
              <button onClick={() => removeQ.mutate(q.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              {q.options?.map((o: any) => (
                <div key={o.key} className={`px-2 py-1 rounded ${o.key === q.correct_key ? "bg-success/20 text-success font-semibold" : "bg-muted/30"}`}>
                  {o.key}. {o.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="glass-strong p-3 space-y-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Yangi savol</p>
        <textarea value={adding.question_text} onChange={(e) => setAdding({ ...adding, question_text: e.target.value })}
          placeholder="Savol matni" rows={2}
          className="w-full glass px-3 py-2 rounded-lg text-sm bg-background resize-none" />
        {adding.options.map((o, idx) => (
          <div key={o.key} className="flex items-center gap-2">
            <input type="radio" name="correct" checked={adding.correct_key === o.key}
              onChange={() => setAdding({ ...adding, correct_key: o.key })} />
            <span className="text-xs font-mono w-4">{o.key}.</span>
            <input value={o.text}
              onChange={(e) => {
                const opts = [...adding.options]; opts[idx] = { ...o, text: e.target.value };
                setAdding({ ...adding, options: opts });
              }}
              className="flex-1 glass px-2 py-1.5 rounded-lg text-xs bg-background" />
          </div>
        ))}
        <button onClick={() => addQ.mutate()} disabled={!adding.question_text.trim()}
          className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50">
          <Plus className="w-3.5 h-3.5" /> Savolni qo'shish
        </button>
      </div>
    </div>
  );
};

export default TestBuilder;
