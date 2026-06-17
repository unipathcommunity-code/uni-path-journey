import { motion } from "framer-motion";
import { NotebookPen, Wand2, Loader2, Copy, Check } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

const PLANNER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-lesson-planner`;

const AILessonPlanner = () => {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("45");
  const [level, setLevel] = useState("Intermediate");
  const [objectives, setObjectives] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!subject.trim()) return;
    setPlan("");
    setLoading(true);

    try {
      const resp = await fetch(PLANNER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ subject, topic, duration: parseInt(duration), level, objectives }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let planSoFar = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              planSoFar += content;
              setPlan(planSoFar);
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setPlan(`❌ ${e.message || "Failed to generate lesson plan"}`);
    } finally {
      setLoading(false);
    }
  };

  const copyPlan = () => {
    navigator.clipboard.writeText(plan);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <NotebookPen className="w-4 h-4 text-accent" />
        </div>
        <div>
          <h3 className="text-sm font-bold font-heading text-foreground">NOVA Dars Rejalashtiruvchi</h3>
          <p className="text-[10px] text-muted-foreground">Generate comprehensive lesson plans instantly</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs text-muted-foreground mb-1 block">Subject *</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Mathematics"
            className="w-full bg-muted/40 text-sm text-foreground rounded-xl px-3 py-2.5 outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs text-muted-foreground mb-1 block">Topic</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Quadratic Equations"
            className="w-full bg-muted/40 text-sm text-foreground rounded-xl px-3 py-2.5 outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Duration (min)</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full bg-muted/40 text-sm text-foreground rounded-xl px-3 py-2.5 outline-none focus:ring-1 focus:ring-primary/40"
          >
            {[30, 40, 45, 60, 80, 90].map((d) => (
              <option key={d} value={d}>{d} min</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full bg-muted/40 text-sm text-foreground rounded-xl px-3 py-2.5 outline-none focus:ring-1 focus:ring-primary/40"
          >
            {["Beginner", "Elementary", "Intermediate", "Advanced", "Expert"].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Objectives (optional)</label>
          <textarea
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            placeholder="What should students learn?"
            rows={2}
            className="w-full bg-muted/40 text-sm text-foreground rounded-xl px-3 py-2.5 outline-none focus:ring-1 focus:ring-primary/40 resize-none"
          />
        </div>
      </div>

      <button
        onClick={generate}
        disabled={!subject.trim() || loading}
        className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
        {loading ? "Generating..." : "Generate Lesson Plan"}
      </button>

      {plan && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-4 relative">
          <button
            onClick={copyPlan}
            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
          <div className="prose prose-sm prose-invert max-w-none [&>h1]:text-lg [&>h2]:text-base [&>h3]:text-sm [&>p]:text-sm [&>ul]:text-sm [&>ol]:text-sm">
            <ReactMarkdown>{plan}</ReactMarkdown>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AILessonPlanner;
