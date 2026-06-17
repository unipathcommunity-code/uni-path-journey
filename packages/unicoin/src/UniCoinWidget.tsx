import React from 'react'
import { useUniCoin } from './useUniCoin'
import type { UniCoinTransaction } from './types'

interface Props {
  variant?: 'mini' | 'full'
  onTopUp?: () => void
}

function formatAmount(n: number) {
  return n.toLocaleString('uz-UZ')
}

function txSign(tx: UniCoinTransaction) {
  return tx.amount >= 0 ? '+' : ''
}

function txColor(tx: UniCoinTransaction) {
  return tx.amount >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500'
}

export function UniCoinWidget({ variant = 'mini', onTopUp }: Props) {
  const { balance, transactions } = useUniCoin()

  if (variant === 'mini') {
    return (
      <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-full px-3 py-1 select-none">
        <span className="text-base leading-none">🪙</span>
        <span className="text-sm font-bold text-amber-700 dark:text-amber-300 tabular-nums">
          {formatAmount(balance.total)}
        </span>
        <span className="text-xs text-amber-500 dark:text-amber-400 font-medium">UniCoin</span>
      </div>
    )
  }

  const recent = transactions.slice(0, 3)

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 border border-amber-200 dark:border-amber-700/40 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🪙</span>
          <div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wide">UniCoin</p>
            <p className="text-3xl font-bold text-amber-700 dark:text-amber-300 tabular-nums leading-none">
              {formatAmount(balance.total)}
            </p>
          </div>
        </div>
        {onTopUp && (
          <button
            onClick={onTopUp}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-white"
          >
            + To'ldirish
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-white/60 dark:bg-white/5 rounded-xl py-2 px-3">
          <p className="text-[10px] text-amber-500 font-medium uppercase tracking-wide">Topilgan</p>
          <p className="text-base font-bold text-amber-700 dark:text-amber-300">{formatAmount(balance.earned)}</p>
        </div>
        <div className="bg-white/60 dark:bg-white/5 rounded-xl py-2 px-3">
          <p className="text-[10px] text-amber-500 font-medium uppercase tracking-wide">Sarflangan</p>
          <p className="text-base font-bold text-amber-700 dark:text-amber-300">{formatAmount(balance.spent)}</p>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">Oxirgi tranzaksiyalar</p>
          {recent.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between gap-2 bg-white/50 dark:bg-white/5 rounded-xl px-3 py-2">
              <p className="text-xs text-amber-700 dark:text-amber-300 truncate flex-1">{tx.description}</p>
              <span className={`text-xs font-bold tabular-nums shrink-0 ${txColor(tx)}`}>
                {txSign(tx)}{Math.abs(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => {}}
        className="w-full text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
      >
        Batafsil →
      </button>
    </div>
  )
}
