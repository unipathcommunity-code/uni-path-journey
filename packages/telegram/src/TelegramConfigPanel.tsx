import { useState } from 'react'
import { Eye, EyeOff, Send, CheckCircle2, XCircle, Loader2, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@unipath/ui'
import { Input } from '@unipath/ui'
import { Button } from '@unipath/ui'
import { Badge } from '@unipath/ui'
import { useTelegramBot } from './useTelegramBot'
import type { TelegramBotConfig } from './types'

export interface TelegramConfigPanelProps {
  app: 'nova' | 'unitour' | 'consulting'
  storageKey?: string
  onSave?: (config: TelegramBotConfig) => Promise<void>
}

export function TelegramConfigPanel({ app, storageKey, onSave }: TelegramConfigPanelProps) {
  const key = storageKey ?? `unipath-tg-config-${app}`
  const { config, isConnected, isTesting, saveConfig, testConnection } = useTelegramBot(key)

  const [form, setForm] = useState<TelegramBotConfig>({
    botToken: config?.botToken ?? '',
    botUsername: config?.botUsername ?? '',
    chatId: config?.chatId ?? '',
    webhookUrl: config?.webhookUrl ?? '',
  })
  const [showToken, setShowToken] = useState(false)
  const [testResult, setTestResult] = useState<boolean | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleTest = async () => {
    setTestResult(null)
    const ok = await testConnection(form)
    setTestResult(ok)
  }

  const handleSave = async () => {
    setIsSaving(true)
    saveConfig(form)
    if (onSave) {
      try {
        await onSave(form)
      } catch {
        // caller handles errors
      }
    }
    setIsSaving(false)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#229ED9]/15 flex items-center justify-center">
              <Send className="w-4 h-4 text-[#229ED9]" />
            </div>
            <CardTitle className="text-base">Telegram Bot sozlamalari</CardTitle>
          </div>
          {isConnected ? (
            <Badge variant="default" className="gap-1 bg-green-500/15 text-green-600 border-green-500/30 hover:bg-green-500/20">
              <CheckCircle2 className="w-3 h-3" />
              Ulangan
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <XCircle className="w-3 h-3" />
              Ulanmagan
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Bot Token
          </label>
          <div className="relative">
            <Input
              type={showToken ? 'text' : 'password'}
              placeholder="123456789:ABCdef..."
              value={form.botToken}
              onChange={(e) => setForm({ ...form, botToken: e.target.value })}
              className="pr-10 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowToken((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Bot Username
          </label>
          <Input
            type="text"
            placeholder="@mybot"
            value={form.botUsername}
            onChange={(e) => setForm({ ...form, botUsername: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Chat ID
          </label>
          <Input
            type="text"
            placeholder="-100123456789"
            value={form.chatId ?? ''}
            onChange={(e) => setForm({ ...form, chatId: e.target.value })}
          />
        </div>

        {testResult !== null && (
          <div className={[
            'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium',
            testResult
              ? 'bg-green-500/10 text-green-600 border border-green-500/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20',
          ].join(' ')}>
            {testResult
              ? <><CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Bot muvaffaqiyatli ulandi</>
              : <><XCircle className="w-4 h-4 flex-shrink-0" /> Ulanishda xato — tokenni tekshiring</>
            }
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isTesting || !form.botToken}
            className="flex-1"
          >
            {isTesting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Tekshirilmoqda...</>
              : <><Send className="w-4 h-4" /> Ulanishni tekshirish</>
            }
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !form.botToken || !form.botUsername}
            className="flex-1"
          >
            {isSaving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saqlanmoqda...</>
              : <><Save className="w-4 h-4" /> Saqlash</>
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
