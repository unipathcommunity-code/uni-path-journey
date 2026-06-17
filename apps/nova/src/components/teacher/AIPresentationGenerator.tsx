import { motion, AnimatePresence } from "framer-motion";
import { Presentation, Loader2, Copy, Check, ChevronLeft, ChevronRight, Download, FileDown, ImageIcon, Wand2 } from "lucide-react";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";

const PRES_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-presentation`;
const IMAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-image`;

const AIPresentationGenerator = () => {
  const { t, language } = useLanguage();
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState("10");
  const [style, setStyle] = useState("educational");
  const [withImages, setWithImages] = useState(true);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  // Map of slideIndex -> generated AI image data URL
  const [slideImages, setSlideImages] = useState<Record<number, string>>({});
  const [imgLoading, setImgLoading] = useState<Record<number, boolean>>({});
  const slideRef = useRef<HTMLDivElement>(null);

  const slides = useMemo(() => {
    if (!content) return [];
    const parts = content.split(/(?=## Slide \d+)/i).filter(s => s.trim());
    return parts.length > 0 ? parts : content.split(/(?=## )/i).filter(s => s.trim());
  }, [content]);

  // Extract slide title for image prompt
  const getSlideTitle = (slideContent: string): string => {
    const m = slideContent.match(/^## (?:Slide \d+:?\s*)?(.+)$/m);
    return m ? m[1].trim() : "";
  };

  const cleanSlideContent = (slideContent: string): string => {
    // Strip any leftover SEARCH markers if model emitted them
    return slideContent.replace(/!\[.*?\]\(SEARCH:.+?\)\n?/g, "");
  };

  const generateImage = useCallback(async (idx: number, force = false) => {
    if (!force && slideImages[idx]) return;
    if (imgLoading[idx]) return;
    const title = getSlideTitle(slides[idx]);
    if (!title) return;
    setImgLoading(p => ({ ...p, [idx]: true }));
    try {
      const resp = await fetch(IMAGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt: `${topic} — ${title}`, style }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Image gen failed");
      }
      const data = await resp.json();
      if (data.image) setSlideImages(p => ({ ...p, [idx]: data.image }));
    } catch (e: any) {
      console.error("img err", e);
      // silent — don't toast for every slide
    } finally {
      setImgLoading(p => ({ ...p, [idx]: false }));
    }
  }, [slides, topic, style, slideImages, imgLoading]);

  // Auto-generate AI image for current slide when withImages is on
  useEffect(() => {
    if (!withImages || slides.length === 0 || loading) return;
    generateImage(currentSlide);
  }, [currentSlide, withImages, slides.length, loading, generateImage]);

  const generate = async () => {
    if (!topic.trim()) return;
    setContent("");
    setCurrentSlide(0);
    setLoading(true);

    try {
      const resp = await fetch(PRES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ topic, slideCount: parseInt(slideCount), language, style, withImages }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let soFar = "";

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
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) { soFar += c; setContent(soFar); }
          } catch {}
        }
      }
    } catch (e: any) {
      setContent(`❌ ${e.message || "Failed to generate presentation"}`);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = useCallback(async () => {
    if (slides.length === 0) return;
    setExporting(true);
    toast.info(t("teacher.pres_exporting"));

    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-9999px;top:0;width:960px;background:#fff;color:#111;padding:0;z-index:-1;";
      document.body.appendChild(container);

      for (let i = 0; i < slides.length; i++) {
        const slideEl = document.createElement("div");
        slideEl.style.cssText = "width:960px;min-height:540px;padding:48px 56px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;background:#fff;font-family:system-ui,sans-serif;position:relative;";

        const cleaned = cleanSlideContent(slides[i]);
        const html = cleaned
          .replace(/^## (.+)$/gm, '<h2 style="font-size:28px;font-weight:700;margin:0 0 16px 0;color:#1a1a2e;">$1</h2>')
          .replace(/^### (.+)$/gm, '<h3 style="font-size:20px;font-weight:600;margin:12px 0 8px 0;color:#333;">$1</h3>')
          .replace(/^\- (.+)$/gm, '<div style="display:flex;align-items:baseline;gap:8px;margin:4px 0;font-size:15px;color:#444;"><span style="color:#6366f1;">●</span><span>$1</span></div>')
          .replace(/^\* (.+)$/gm, '<div style="display:flex;align-items:baseline;gap:8px;margin:4px 0;font-size:15px;color:#444;"><span style="color:#6366f1;">●</span><span>$1</span></div>')
          .replace(/^\d+\. (.+)$/gm, (_, text, offset, str) => {
            const lines = str.substring(0, offset).split('\n');
            const num = lines.filter((l: string) => /^\d+\./.test(l)).length + 1;
            return `<div style="display:flex;align-items:baseline;gap:8px;margin:4px 0;font-size:15px;color:#444;"><span style="color:#6366f1;font-weight:600;">${num}.</span><span>${text}</span></div>`;
          })
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/\n\n/g, '<div style="height:12px;"></div>')
          .replace(/\n/g, '');

        const aiImg = slideImages[i];
        const imgHtml = aiImg
          ? `<div style="margin:8px 0 16px 0;border-radius:12px;overflow:hidden;"><img src="${aiImg}" style="width:100%;max-height:280px;object-fit:cover;display:block;" crossorigin="anonymous" /></div>`
          : "";

        slideEl.innerHTML = `
          <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#6366f1,#8b5cf6,#a855f7);"></div>
          <div style="position:absolute;bottom:16px;right:24px;font-size:11px;color:#aaa;">NOVA · ${t("teacher.pres_slide")} ${i + 1}/${slides.length}</div>
          ${imgHtml}
          ${html}
        `;
        container.innerHTML = "";
        container.appendChild(slideEl);

        const canvas = await html2canvas(slideEl, {
          scale: 2, useCORS: true, backgroundColor: "#ffffff", width: 960, height: 540,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, pageW, pageH);
      }

      document.body.removeChild(container);
      const fileName = `${topic.replace(/[^a-zA-Z0-9\u0400-\u04FF\u0600-\u06FF]/g, "_").slice(0, 40)}_presentation.pdf`;
      pdf.save(fileName);
      toast.success(t("teacher.pres_exported"));
    } catch (e: any) {
      console.error("PDF export error:", e);
      toast.error(t("teacher.pres_export_error"));
    } finally {
      setExporting(false);
    }
  }, [slides, topic, t, slideImages]);

  const copyAll = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const slideColors = [
    "from-primary/20 to-primary/5",
    "from-accent/20 to-accent/5",
    "from-success/20 to-success/5",
    "from-warning/20 to-warning/5",
    "from-destructive/15 to-destructive/5",
  ];

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1);
      if (diff < 0 && currentSlide > 0) setCurrentSlide(currentSlide - 1);
    }
    setTouchStart(null);
  };

  const currentSlideImage = slideImages[currentSlide] || null;
  const currentImageLoading = !!imgLoading[currentSlide];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Presentation className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold font-heading text-foreground">{t("teacher.pres_title")}</h3>
          <p className="text-[10px] text-muted-foreground truncate">{t("teacher.pres_desc")}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{t("teacher.pres_topic")} *</label>
          <input value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder={t("teacher.pres_topic_placeholder")}
            className="w-full bg-muted/40 text-sm text-foreground rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30 transition-all" />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{t("teacher.pres_slides")}</label>
            <select value={slideCount} onChange={(e) => setSlideCount(e.target.value)}
              className="w-full bg-muted/40 text-sm text-foreground rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30">
              {[5, 8, 10, 12, 15, 20, 25, 30, 40, 50].map(n => <option key={n} value={n}>{n} {t("teacher.pres_slides_label")}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{t("teacher.pres_style")}</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-muted/40 text-sm text-foreground rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/30">
              <option value="educational">{t("teacher.pres_style_edu")}</option>
              <option value="professional">{t("teacher.pres_style_pro")}</option>
              <option value="creative">{t("teacher.pres_style_creative")}</option>
              <option value="minimal">{t("teacher.pres_style_minimal")}</option>
              <option value="scientific">{t("teacher.pres_style_scientific")}</option>
              <option value="storytelling">{t("teacher.pres_style_story")}</option>
            </select>
          </div>
        </div>

        {/* Images toggle */}
        <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-muted/20 border border-border/20 cursor-pointer hover:bg-muted/30 transition-colors">
          <input type="checkbox" checked={withImages} onChange={(e) => setWithImages(e.target.checked)}
            className="w-4 h-4 rounded accent-primary" />
          <ImageIcon className="w-4 h-4 text-primary" />
          <span className="text-xs text-foreground font-medium">{t("teacher.pres_with_images")}</span>
        </label>
      </div>

      <motion.button onClick={generate} disabled={!topic.trim() || loading}
        whileTap={{ scale: 0.97 }}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all shadow-md shadow-primary/10 active:shadow-sm">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Presentation className="w-4 h-4" />}
        {loading ? t("teacher.pres_generating") : t("teacher.pres_generate")}
      </motion.button>

      {slides.length > 0 && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div ref={slideRef}
            onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
            className={`glass-strong rounded-2xl overflow-hidden bg-gradient-to-br ${slideColors[currentSlide % slideColors.length]}`}>
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border/20">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-destructive/50" />
                <div className="w-2 h-2 rounded-full bg-warning/50" />
                <div className="w-2 h-2 rounded-full bg-success/50" />
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                {t("teacher.pres_slide")} {currentSlide + 1}/{slides.length}
              </span>
              <div className="flex items-center gap-0.5">
                <button onClick={copyAll} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors" title="Copy">
                  {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
                <button onClick={exportPDF} disabled={exporting} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors" title="PDF">
                  {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : <Download className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={currentSlide} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="px-4 sm:px-6 py-5 sm:py-6 min-h-[200px] sm:min-h-[260px]">
                {/* AI-generated image */}
                {withImages && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-border/20 shadow-sm relative bg-muted/20 aspect-video">
                    {currentSlideImage ? (
                      <img src={currentSlideImage} alt={topic} className="w-full h-full object-cover" loading="lazy" />
                    ) : currentImageLoading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-[11px]">{t("teacher.pres_img_loading") || "Generating image..."}</span>
                      </div>
                    ) : (
                      <button onClick={() => generateImage(currentSlide, true)}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/30 transition-colors">
                        <Wand2 className="w-5 h-5 text-primary" />
                        <span className="text-[11px]">{t("teacher.pres_img_generate") || "Generate AI image"}</span>
                      </button>
                    )}
                    {currentSlideImage && (
                      <button onClick={() => generateImage(currentSlide, true)} disabled={currentImageLoading}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/70 backdrop-blur hover:bg-background/90 transition-colors"
                        title="Regenerate">
                        {currentImageLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    )}
                  </div>
                )}
                <div className="prose prose-sm dark:prose-invert max-w-none 
                  [&>h2]:text-sm [&>h2]:sm:text-base [&>h2]:font-heading [&>h2]:font-bold [&>h2]:text-foreground [&>h2]:mb-3
                  [&>h3]:text-xs [&>h3]:sm:text-sm [&>h3]:font-semibold
                  [&>p]:text-xs [&>p]:sm:text-sm [&>p]:leading-relaxed
                  [&>ul]:text-xs [&>ul]:sm:text-sm [&>ul]:space-y-1
                  [&>ol]:text-xs [&>ol]:sm:text-sm [&>ol]:space-y-1
                  [&>ul>li]:marker:text-primary [&>ol>li]:marker:text-primary">
                  <ReactMarkdown>{cleanSlideContent(slides[currentSlide])}</ReactMarkdown>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-t border-border/20">
              <button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}
                className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors px-2 py-1 rounded-lg active:bg-muted/30">
                <ChevronLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t("teacher.pres_prev")}</span>
              </button>
              <div className="flex gap-1 items-center max-w-[50%] overflow-x-auto scrollbar-hide">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setCurrentSlide(i)}
                    className={`shrink-0 h-1.5 rounded-full transition-all duration-300 ${
                      i === currentSlide ? "bg-primary w-5" : "bg-muted-foreground/20 w-1.5 hover:bg-muted-foreground/40"
                    }`} />
                ))}
              </div>
              <button onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))} disabled={currentSlide === slides.length - 1}
                className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors px-2 py-1 rounded-lg active:bg-muted/30">
                <span className="hidden sm:inline">{t("teacher.pres_next")}</span> <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <motion.button onClick={exportPDF} disabled={exporting}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-accent/80 text-accent-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all shadow-md shadow-accent/10">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {exporting ? t("teacher.pres_exporting") : t("teacher.pres_download_pdf")}
          </motion.button>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            {slides.map((slide, i) => (
              <motion.button key={i} onClick={() => setCurrentSlide(i)}
                whileTap={{ scale: 0.95 }}
                className={`shrink-0 w-[72px] sm:w-20 h-12 sm:h-14 rounded-lg p-1.5 text-left transition-all border ${
                  i === currentSlide
                    ? "border-primary bg-primary/10 ring-1 ring-primary/30 shadow-sm shadow-primary/10"
                    : "border-border/20 bg-muted/10 hover:bg-muted/30 active:bg-muted/40"
                }`}>
                <p className="text-[6px] sm:text-[7px] text-muted-foreground line-clamp-3 leading-tight">
                  {cleanSlideContent(slide).replace(/[#*_]/g, "").slice(0, 50)}
                </p>
              </motion.button>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground/50 text-center sm:hidden">
            ← {t("teacher.pres_swipe")} →
          </p>
        </motion.div>
      )}

      {content && loading && (
        <div className="glass p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span className="text-[11px] text-muted-foreground">{t("teacher.pres_generating")}</span>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none [&>h2]:text-sm [&>p]:text-xs [&>ul]:text-xs">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AIPresentationGenerator;
