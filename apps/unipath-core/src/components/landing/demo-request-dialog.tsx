import { useState } from "react"
import { Send } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import type { Translation } from "@/lib/translations"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export function DemoRequestDialog({
  t,
  open,
  onOpenChange,
}: {
  t: Translation
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [business, setBusiness] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    setLoading(true)
    try {
      // Platform-level demo request → no tenant. source='demo_request' so it is
      // distinguishable in the super-admin contact_requests view.
      const { error } = await (supabase as any).from("contact_requests").insert({
        tenant_id: null,
        name: name.trim(),
        phone: phone.trim(),
        message: `[DEMO REQUEST]${business.trim() ? ` (${business.trim()})` : ""}\n\n${message.trim()}`,
        source: "demo_request",
        status: "new",
      })
      if (error) throw error
      toast.success(t.demo.success)
      setName("")
      setPhone("")
      setBusiness("")
      setMessage("")
      onOpenChange(false)
    } catch {
      toast.error(t.demo.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{t.demo.title}</DialogTitle>
          <DialogDescription>{t.demo.subtitle}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="demo-name">{t.demo.name}</Label>
            <Input
              id="demo-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.demo.namePh}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demo-phone">{t.demo.phone}</Label>
            <Input
              id="demo-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.demo.phonePh}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demo-business">{t.demo.business}</Label>
            <Input
              id="demo-business"
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              placeholder={t.demo.businessPh}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="demo-message">{t.demo.message}</Label>
            <Textarea
              id="demo-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.demo.messagePh}
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-semibold text-forest shadow-md transition-all hover:-translate-y-0.5 hover:bg-lime-bright hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? t.demo.submitting : t.demo.submit}
            {!loading && <Send className="size-4 transition-transform group-hover:translate-x-0.5" />}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
