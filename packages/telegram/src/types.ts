export interface TelegramBotConfig {
  botToken: string
  botUsername: string
  chatId?: string
  webhookUrl?: string
}

export interface TelegramMessage {
  chatId: string
  text: string
  parseMode?: 'HTML' | 'Markdown'
  app: 'nova' | 'unitour' | 'consulting'
  type: 'attendance' | 'payment' | 'booking' | 'visa' | 'application' | 'announcement'
}

export type TelegramNotificationStatus = 'sent' | 'failed' | 'pending'
