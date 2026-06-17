import { useState, useEffect, useCallback } from 'react'
import type { UniCoinTransaction, UniCoinBalance } from './types'

const STORAGE_KEY = 'unicoin_data'

interface StoredData {
  balance: UniCoinBalance
  transactions: UniCoinTransaction[]
}

function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    balance: { total: 0, earned: 0, spent: 0 },
    transactions: [],
  }
}

function saveData(data: StoredData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useUniCoin() {
  const [data, setData] = useState<StoredData>(loadData)

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setData(loadData())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const earn = useCallback(
    (amount: number, source: UniCoinTransaction['source'], description: string) => {
      setData((prev) => {
        const tx: UniCoinTransaction = {
          id: crypto.randomUUID(),
          userId: 'local',
          amount,
          type: 'earned',
          source,
          description,
          createdAt: new Date().toISOString(),
        }
        const next: StoredData = {
          balance: {
            total: prev.balance.total + amount,
            earned: prev.balance.earned + amount,
            spent: prev.balance.spent,
          },
          transactions: [tx, ...prev.transactions].slice(0, 50),
        }
        saveData(next)
        return next
      })
    },
    []
  )

  const spend = useCallback(
    (amount: number, description: string): boolean => {
      let success = false
      setData((prev) => {
        if (prev.balance.total < amount) return prev
        success = true
        const tx: UniCoinTransaction = {
          id: crypto.randomUUID(),
          userId: 'local',
          amount: -amount,
          type: 'spent',
          source: 'consulting',
          description,
          createdAt: new Date().toISOString(),
        }
        const next: StoredData = {
          balance: {
            total: prev.balance.total - amount,
            earned: prev.balance.earned,
            spent: prev.balance.spent + amount,
          },
          transactions: [tx, ...prev.transactions].slice(0, 50),
        }
        saveData(next)
        return next
      })
      return success
    },
    []
  )

  const canAfford = useCallback(
    (amount: number) => data.balance.total >= amount,
    [data.balance.total]
  )

  return {
    balance: data.balance,
    transactions: data.transactions.slice(0, 10),
    earn,
    spend,
    canAfford,
  }
}
