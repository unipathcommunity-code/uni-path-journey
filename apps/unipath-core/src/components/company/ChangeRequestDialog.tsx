import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  companyId: string;
  requestType: "branding" | "plan" | "feature" | "domain" | "content" | "other";
  defaultTitle?: string;
  payload?: Record<string, unknown>;
}

const TYPE_LABEL: Record<string, string> = {
  branding: "Brend o'zgartirish",
  plan: "Tariff o'zgartirish",
  feature: "Funksiya so'rovi",
  domain: "Domen so'rovi",
  content: "Sayt mazmuni",
  other: "Boshqa so'rov",
};

const ChangeRequestDialog = ({ open, onClose, companyId, requestType, defaultTitle, payload }: Props) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(defaultTitle || TYPE_LABEL[requestType]);
  const [description, setDescription] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Tizimga kirilmagan");
      const { error } = await (supabase as any).from("company_change_requests").insert({
        company_id: companyId,
        requested_by: user.id,
        request_type: requestType,
        title,
        description,
        payload: payload || {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("So'rov yuborildi", { description: "Super admin ko'rib chiqadi" });
      setDescription("");
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <DialogTitle>Super adminga so'rov</DialogTitle>
          </div>
          <DialogDescription>
            O'zgartirish so'rovingizni qoldiring. Tasdiqlangach, biz uni siz aytgandek qo'llaymiz.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label>Mavzu</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Batafsil tavsif</Label>
            <Textarea
              rows={5}
              placeholder="Misol: asosiy rangni ko'kdan yashilga (#10B981) o'zgartirib bering, logo'mni ham yangiladim"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Bekor qilish</Button>
            <Button onClick={() => submit.mutate()} disabled={submit.isPending || !title.trim()}>
              {submit.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Yuborish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeRequestDialog;
