import { useState, useEffect, useCallback } from 'react'
import type { TelegramBotConfig, TelegramMessage, TelegramNotificationStatus } from './types'

const TG_API = 'https://api.telegram.org/bot'

async function tgFetch<T>(token: string, method: string, body?: Record<string, unknown>): Promise<{ ok: boolean; result?: T; description?: string }> {
  try {
    const res = await fetch(`${TG_API}${token}/${method}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    return res.json()
  } catch {
    return { ok: false, description: 'Network error' }
  }
}

export function useTelegramBot(storageKey = 'unipath-tg-config') {
  const [config, setConfig] = useState<TelegramBotConfig | null>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as TelegramBotConfig) : null
    } catch {
      return null
    }
  })

  const [isConnected, setIsConnected] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    setIsConnected(!!config?.botToken && !!config?.botUsername)
  }, [config])

  const saveConfig = useCallback((next: TelegramBotConfig) => {
    localStorage.setItem(storageKey, JSON.stringify(next))
    setConfig(next)
  }, [storageKey])

  const testConnection = useCallback(async (cfg: TelegramBotConfig): Promise<boolean> => {
    if (!cfg.botToken) return false
    setIsTesting(true)
    const res = await tgFetch(cfg.botToken, 'getMe')
    setIsTesting(false)
    return res.ok
  }, [])

  const sendMessage = useCallback(async (msg: TelegramMessage): Promise<TelegramNotificationStatus> => {
    if (!config?.botToken) return 'failed'
    const res = await tgFetch(config.botToken, 'sendMessage', {
      chat_id: msg.chatId,
      text: msg.text,
      parse_mode: msg.parseMode ?? 'HTML',
    })
    return res.ok ? 'sent' : 'failed'
  }, [config])

  return { config, isConnected, isTesting, saveConfig, sendMessage, testConnection }
}
