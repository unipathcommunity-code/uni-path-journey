import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Trash2, Edit3, Eye, EyeOff, Loader2, X, Save, ChevronUp, ChevronDown, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sitePagePath, sitePageUrl } from "@/lib/siteRoutes";

export interface PageRow {
  id: string;
  website_id: string;
  slug: string;
  title: string;
  page_type: "home" | "content" | "tech" | "study" | "custom";
  payload: any;
  sort_order: number;
  is_visible: boolean;
  show_in_nav: boolean;
}

interface Props {
  websiteId: string;
  siteSlug: string;
}

const PAGE_TYPES: { id: PageRow["page_type"]; name: string; hint: string }[] = [
  { id: "content", name: "Oddiy sahifa", hint: "Sarlavha + erkin matn" },
  { id: "tech", name: "Texnologiyalar", hint: "Imkoniyatlar grid'i" },
  { id: "study", name: "O'quv yo'nalishi", hint: "Kurs/dastur tavsifi" },
  { id: "custom", name: "Erkin", hint: "Faqat sarlavha + matn" },
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || `page-${Date.now().toString(36).slice(-4)}`;

const defaultPayloadFor = (type: PageRow["page_type"]) => {
  switch (type) {
    case "tech":
      return { intro: "Bizning zamonaviy uslublarimiz", items: ["Interaktiv darslar", "Onlayn platforma", "Maxsus dasturlar"] };
    case "study":
      return { intro: "O'quv yo'nalishlarimiz", body: "Bu yerda kursning batafsil tavsifi yoziladi.", duration: "3 oy", level: "Boshlang'ich" };
    case "custom":
      return { body: "Bu yerga istalgan matnni yozing." };
    default:
      return { body: "Bu sahifa kontenti.", body2: "" };
  }
};

const PagesManager = ({ websiteId, siteSlug }: Props) => {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<PageRow["page_type"]>("content");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("website_pages")
      .select("*")
      .eq("website_id", websiteId)
      .order("sort_order");
    if (error) toast.error(error.message);
    setPages((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (websiteId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websiteId]);

  const addPage = async () => {
    if (!newTitle.trim()) {
      toast.error("Sahifa nomini kiriting");
      return;
    }
    setAdding(true);
    let slug = slugify(newTitle);
    // collision guard
    if (pages.some((p) => p.slug === slug)) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    const { error } = await supabase.from("website_pages").insert({
      website_id: websiteId,
      slug,
      title: newTitle.trim(),
      page_type: newType,
      payload: defaultPayloadFor(newType),
      sort_order: pages.length,
    });
    setAdding(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Sahifa qo'shildi ✓");
    setNewTitle("");
    setNewType("content");
    setShowAdd(false);
    load();
  };

  const deletePage = async (id: string) => {
    if (!confirm("Bu sahifa o'chirilsinmi?")) return;
    const { error } = await supabase.from("website_pages").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("O'chirildi");
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleVisible = async (p: PageRow) => {
    const { error } = await supabase
      .from("website_pages")
      .update({ is_visible: !p.is_visible })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else load();
  };

  const move = async (p: PageRow, dir: -1 | 1) => {
    const ordered = [...pages].sort((a, b) => a.sort_order - b.sort_order);
    const idx = ordered.findIndex((x) => x.id === p.id);
    const swap = ordered[idx + dir];
    if (!swap) return;
    await supabase.from("website_pages").update({ sort_order: swap.sort_order }).eq("id", p.id);
    await supabase.from("website_pages").update({ sort_order: p.sort_order }).eq("id", swap.id);
    load();
  };

  const editing = pages.find((p) => p.id === editingId) || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-5 space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-heading font-bold text-sm flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          Qo'shimcha sahifalar ({pages.length})
        </h3>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Yangi sahifa
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Bosh sahifadan tashqari qo'shimcha sahifalar (masalan, <span className="font-mono">inkluone.info{sitePagePath(siteSlug, "tech")}</span>).
        Ularni yuqoridagi navigatsiyaga chiqaring va tahrir qiling.
      </p>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 p-3 rounded-xl border border-primary/30 bg-primary/5"
          >
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Sahifa nomi (masalan: Texnologiyalar)"
              className="w-full px-3 py-2 rounded-lg bg-background/60 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="grid grid-cols-2 gap-2">
              {PAGE_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setNewType(t.id)}
                  className={`p-2 rounded-lg text-left transition border ${
                    newType === t.id
                      ? "border-primary bg-primary/15"
                      : "border-border/30 bg-background/40 hover:bg-muted/40"
                  }`}
                >
                  <div className="text-xs font-semibold">{t.name}</div>
                  <div className="text-[10px] text-muted-foreground">{t.hint}</div>
                </button>
              ))}
            </div>
            {newTitle && (
              <p className="text-[10px] text-muted-foreground">
                URL: <span className="font-mono text-primary">{sitePageUrl(siteSlug, slugify(newTitle))}</span>
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={addPage}
                disabled={adding || !newTitle.trim()}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Qo'shish"}
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewTitle(""); }}
                className="px-3 py-2 rounded-lg bg-muted/40 text-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground">
          Hech qanday qo'shimcha sahifa yo'q. Yuqoridagi tugma orqali qo'shing.
        </div>
      ) : (
        <div className="space-y-1.5">
          {pages.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-background/40 border border-border/30"
            >
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{p.title}</div>
                <div className="text-[10px] text-muted-foreground truncate font-mono">
                  {sitePageUrl(siteSlug, p.slug)}
                  <span className="ml-1.5 px-1 py-0.5 rounded bg-muted/60 text-[9px] font-bold tracking-wider">
                    {p.page_type.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() => move(p, -1)}
                  disabled={i === 0}
                  className="p-1.5 rounded hover:bg-muted/40 disabled:opacity-30"
                  title="Yuqoriga"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => move(p, 1)}
                  disabled={i === pages.length - 1}
                  className="p-1.5 rounded hover:bg-muted/40 disabled:opacity-30"
                  title="Pastga"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleVisible(p)}
                  className="p-1.5 rounded hover:bg-muted/40"
                  title={p.is_visible ? "Yashirish" : "Ko'rsatish"}
                >
                  {p.is_visible ? (
                    <Eye className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => setEditingId(p.id)}
                  className="p-1.5 rounded hover:bg-primary/15 text-primary"
                  title="Tahrir"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deletePage(p.id)}
                  className="p-1.5 rounded hover:bg-destructive/15 text-destructive"
                  title="O'chirish"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor modal */}
      <AnimatePresence>
        {editing && (
          <PageEditorModal
            page={editing}
            onClose={() => setEditingId(null)}
            onSaved={() => {
              setEditingId(null);
              load();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ========================================================================== */
/* Editor modal — payload shape varies by page_type                            */
/* ========================================================================== */

const PageEditorModal = ({
  page,
  onClose,
  onSaved,
}: {
  page: PageRow;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [title, setTitle] = useState(page.title);
  const [showInNav, setShowInNav] = useState(page.show_in_nav);
  const [payload, setPayload] = useState<any>(page.payload || {});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("website_pages")
      .update({ title: title.trim() || page.title, show_in_nav: showInNav, payload })
      .eq("id", page.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saqlandi ✓");
    onSaved();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-card border border-border/50 rounded-2xl shadow-2xl"
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/50 p-4 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="font-heading font-bold text-sm truncate">Sahifa: {page.title}</h3>
            <p className="text-[10px] text-muted-foreground font-mono truncate">/p/{page.slug}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted/40 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <FieldInput label="Sahifa sarlavhasi" value={title} onChange={setTitle} />
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={showInNav}
              onChange={(e) => setShowInNav(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            Yuqoridagi navigatsiyada ko'rsatish
          </label>

          {/* Type-specific fields */}
          {page.page_type === "content" && (
            <>
              <FieldInput label="Matn (asosiy)" value={payload.body || ""} onChange={(v) => setPayload({ ...payload, body: v })} multi />
              <FieldInput label="Qo'shimcha matn (ixtiyoriy)" value={payload.body2 || ""} onChange={(v) => setPayload({ ...payload, body2: v })} multi />
            </>
          )}

          {page.page_type === "tech" && (
            <>
              <FieldInput label="Kirish matni" value={payload.intro || ""} onChange={(v) => setPayload({ ...payload, intro: v })} multi />
              <ListEditor
                label="Texnologiyalar / imkoniyatlar"
                items={payload.items || []}
                onChange={(items) => setPayload({ ...payload, items })}
              />
            </>
          )}

          {page.page_type === "study" && (
            <>
              <FieldInput label="Kirish matni" value={payload.intro || ""} onChange={(v) => setPayload({ ...payload, intro: v })} />
              <FieldInput label="Batafsil tavsif" value={payload.body || ""} onChange={(v) => setPayload({ ...payload, body: v })} multi />
              <div className="grid grid-cols-2 gap-2">
                <FieldInput label="Davomiyligi" value={payload.duration || ""} onChange={(v) => setPayload({ ...payload, duration: v })} />
                <FieldInput label="Daraja" value={payload.level || ""} onChange={(v) => setPayload({ ...payload, level: v })} />
              </div>
            </>
          )}

          {page.page_type === "custom" && (
            <FieldInput label="Erkin matn" value={payload.body || ""} onChange={(v) => setPayload({ ...payload, body: v })} multi />
          )}
        </div>

        <div className="sticky bottom-0 bg-card/95 backdrop-blur border-t border-border/50 p-3">
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const FieldInput = ({
  label,
  value,
  onChange,
  multi = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multi?: boolean;
}) => (
  <div>
    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{label}</label>
    {multi ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    )}
  </div>
);

const ListEditor = ({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
}) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-[11px] font-medium text-muted-foreground">{label} ({items.length})</label>
      {items.length < 8 && (
        <button
          onClick={() => onChange([...items, "Yangi"])}
          className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold hover:bg-primary/20"
        >
          + Qo'shish
        </button>
      )}
    </div>
    <div className="space-y-1.5">
      {items.map((it, i) => (
        <div key={i} className="flex gap-1.5">
          <input
            value={it}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            className="flex-1 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/30 text-sm"
          />
          <button
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  </div>
);

export default PagesManager;
