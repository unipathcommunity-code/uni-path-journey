import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyCompany } from "@/hooks/useTourCompany";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const CompanyPosts = () => {
  const { data } = useMyCompany();
  const company = data?.company;
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["company-posts", company?.id],
    enabled: !!company?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("company_posts").select("*").eq("company_id", company!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (post: any) => {
      const payload = {
        company_id: company!.id,
        slug: post.slug || slugify(post.title),
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        cover_image: post.cover_image,
        category: post.category || "news",
        is_published: post.is_published || false,
        published_at: post.is_published ? new Date().toISOString() : null,
      };
      if (post.id) {
        const { error } = await (supabase as any).from("company_posts").update(payload).eq("id", post.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("company_posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saqlandi");
      qc.invalidateQueries({ queryKey: ["company-posts"] });
      setOpen(false); setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("company_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("O'chirildi"); qc.invalidateQueries({ queryKey: ["company-posts"] }); },
  });

  const openNew = () => { setEditing({ title: "", excerpt: "", content: "", cover_image: "", category: "news", is_published: false }); setOpen(true); };
  const openEdit = (p: any) => { setEditing(p); setOpen(true); };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Yangiliklar</h1>
          <p className="text-sm text-muted-foreground mt-1">Mijozlaringiz uchun maqolalar</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl" onClick={openNew}><Plus className="h-4 w-4 mr-1.5" strokeWidth={2} /> Yangi post</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="text-lg">{editing?.id ? "Postni tahrirlash" : "Yangi post"}</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-3">
                <div className="space-y-1.5"><Label className="text-xs">Sarlavha *</Label>
                  <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Qisqa tavsif</Label>
                  <Textarea rows={2} value={editing.excerpt || ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Asosiy matn</Label>
                  <Textarea rows={8} value={editing.content || ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Muqova rasmi</Label>
                  <Input value={editing.cover_image || ""} onChange={(e) => setEditing({ ...editing, cover_image: e.target.value })} placeholder="https://..." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label className="text-xs">Kategoriya</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                      <option value="news">Yangilik</option><option value="blog">Blog</option>
                      <option value="story">Hikoya</option><option value="guide">Yo'riqnoma</option>
                    </select></div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch checked={editing.is_published} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} />
                    <Label className="text-xs">Nashr qilingan</Label></div>
                </div>
                <Button className="w-full rounded-xl" onClick={() => save.mutate(editing)} disabled={save.isPending}>
                  {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Saqlash
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : !posts?.length ? (
        <Card className="p-12 text-center rounded-2xl border-border/60">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Hali post yozilmagan</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {posts.map((p: any, i: number) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.25 }}>
              <Card className="overflow-hidden rounded-2xl border-border/60 hover:shadow-md transition group">
                {p.cover_image && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                )}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Badge variant={p.is_published ? "default" : "secondary"} className="text-[10px] font-normal">
                      {p.is_published ? "Nashr" : "Qoralama"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-normal capitalize">{p.category}</Badge>
                  </div>
                  <h3 className="font-medium text-sm line-clamp-2 leading-snug">{p.title}</h3>
                  {p.excerpt && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{p.excerpt}</p>}
                  <div className="flex gap-1 pt-1.5 border-t border-border/60">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("O'chirilsinmi?")) remove.mutate(p.id); }}>
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyPosts;
