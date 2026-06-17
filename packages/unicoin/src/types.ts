export interface UniCoinTransaction {
  id: string
  userId: string
  amount: number
  type: 'earned' | 'spent' | 'bonus' | 'refund'
  source: 'nova' | 'unitour' | 'consulting'
  description: string
  createdAt: string
}

export interface UniCoinBalance {
  total: number
  earned: number
  spent: number
}
