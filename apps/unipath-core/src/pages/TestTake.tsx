import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Clock, CheckCircle2, ChevronLeft, ChevronRight, Send } from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  options: { key: string; text: string }[];
  position: number;
  points: number;
}

/**
 * TestTake — o'quvchi published testni yechadi.
 * Natija test_attempts jadvaliga saqlanadi va o'qituvchi panelida ko'rinadi.
 */
const TestTake = () => {
  const { testId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [done, setDone] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!testId || !user || !profile?.organization_id) return;
      const { data: t, error: te } = await (supabase as any).from("tests").select("*").eq("id", testId).maybeSingle();
      if (te || !t) { toast.error("Test topilmadi"); navigate("/app"); return; }
      if (t.status !== "published") { toast.error("Test hali ochiq emas"); navigate("/app"); return; }
      setTest(t);

      // Existing attempt?
      const { data: existing } = await (supabase as any).from("test_attempts")
        .select("*").eq("test_id", testId).eq("student_id", user.id).maybeSingle();
      if (existing?.submitted_at) {
        setDone({ score: (existing as any).score, total: (existing as any).total_points });
        setLoading(false);
        return;
      }

      const { data: qs } = await (supabase as any).from("test_questions")
        .select("id, question_text, options, position, points")
        .eq("test_id", testId).order("position");
      setQuestions((qs || []) as any);

      let aId = existing?.id;
      if (!aId) {
        const totalPoints = (qs || []).reduce((s: number, q: any) => s + (q.points || 1), 0);
        const { data: created, error: ae } = await (supabase as any).from("test_attempts").insert({
          test_id: testId,
          student_id: user.id,
          organization_id: profile.organization_id,
          total_points: totalPoints,
        }).select("id, started_at").single();
        if (ae) { toast.error(ae.message); setLoading(false); return; }
        aId = (created as any).id;
      } else {
        setAnswers(((existing as any).answers as any) || {});
      }
      setAttemptId(aId!);

      const startedAt = (existing as any)?.started_at ? new Date((existing as any).started_at).getTime() : Date.now();
      const endsAt = startedAt + (t.duration_minutes || 30) * 60_000;
      setSecondsLeft(Math.max(0, Math.floor((endsAt - Date.now()) / 1000)));
      setLoading(false);
    };
    init();
  }, [testId, user, profile?.organization_id]);

  useEffect(() => {
    if (!attemptId || done) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(id); submit(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, done]);

  const submit = async (auto = false) => {
    if (!attemptId || !testId || done) return;
    setSubmitting(true);
    try {
      // Score on the server side would be better; for now, fetch correct keys and compute.
      const { data: keys } = await (supabase as any).from("test_questions")
        .select("id, correct_key, points").eq("test_id", testId);
      let score = 0;
      let total = 0;
      (keys || []).forEach((k: any) => {
        total += k.points || 1;
        if ((answers[k.id] || "").trim() === (k.correct_key || "").trim()) {
          score += k.points || 1;
        }
      });
      const { error } = await (supabase as any).from("test_attempts").update({
        answers, score, total_points: total, submitted_at: new Date().toISOString(),
      }).eq("id", attemptId);
      if (error) throw error;
      setDone({ score, total });
      if (!auto) toast.success(`Tugatildi: ${score}/${total}`);
    } catch (e: any) { toast.error(e.message || "Yuborib bo'lmadi"); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
  );

  if (done) return (
    <div className="min-h-screen bg-background nova-grid-bg p-4 flex items-center justify-center">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass-strong rounded-3xl p-8 max-w-md w-full text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">Yuborildi!</h2>
        <p className="text-sm text-muted-foreground">{test?.title}</p>
        <div className="text-5xl font-bold text-gradient-primary">
          {done.score}<span className="text-2xl text-muted-foreground">/{done.total}</span>
        </div>
        <p className="text-xs text-muted-foreground">{Math.round((done.score / Math.max(1, done.total)) * 100)}%</p>
        <button onClick={() => navigate("/app")}
          className="w-full bg-gradient-to-br from-accent to-primary text-primary-foreground py-2.5 rounded-xl text-sm font-bold">
          Bosh sahifaga
        </button>
      </motion.div>
    </div>
  );

  const q = questions[current];
  const mins = Math.floor(secondsLeft / 60); const secs = secondsLeft % 60;

  return (
    <div className="min-h-screen bg-background nova-grid-bg p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between glass p-3 rounded-xl">
          <div>
            <h1 className="font-bold text-foreground">{test?.title}</h1>
            <p className="text-[10px] text-muted-foreground">Savol {current + 1}/{questions.length}</p>
          </div>
          <div className="flex items-center gap-1 text-sm font-mono font-bold text-warning">
            <Clock className="w-4 h-4" /> {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
        </div>

        <div className="glass-strong p-1 rounded-full overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-accent to-primary rounded-full transition-all"
            style={{ width: `${((current + 1) / Math.max(1, questions.length)) * 100}%` }} />
        </div>

        {q && (
          <motion.div key={q.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
            className="glass-strong p-5 rounded-2xl space-y-3">
            <p className="text-base font-semibold text-foreground">{q.position + 1}. {q.question_text}</p>
            <div className="space-y-2">
              {(q.options || []).map((opt) => (
                <button key={opt.key} onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt.key }))}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    answers[q.id] === opt.key
                      ? "bg-accent/15 border-accent text-foreground"
                      : "bg-muted/20 border-border/40 hover:border-border"
                  }`}>
                  <span className="inline-block w-6 h-6 rounded-full bg-background text-xs font-bold leading-6 text-center mr-2">{opt.key}</span>
                  {opt.text}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="flex items-center gap-2">
          <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}
            className="glass p-3 rounded-xl disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
          {current < questions.length - 1 ? (
            <button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
              className="flex-1 glass py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
              Keyingi <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => submit(false)} disabled={submitting}
              className="flex-1 bg-gradient-to-br from-success to-success/80 text-primary-foreground py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Yakunlash
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestTake;
