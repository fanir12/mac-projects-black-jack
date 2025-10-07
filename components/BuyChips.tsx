'use client'
import { supabase } from '@/core/supabase'

export default function BuyChips({
  userId,
  onBuy,
  onClose,
}: {
  userId: string
  onBuy: (amount: number) => void
  onClose: () => void
}) {
  const amounts = [100, 500, 1000, 5000]

  async function handleBuy(amount: number) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('chips')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error

      const current = data?.chips ?? 0
      const newTotal = current + amount

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ chips: newTotal })
        .eq('user_id', userId)

      if (updateError) throw updateError

      // Notify other components that chips were updated
      window.dispatchEvent(new CustomEvent('chips-updated'))

      onBuy(amount)
      onClose()
    } catch (err) {
      console.error('Buy chips failed:', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-[320px] text-center space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Buy Chips</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200">
            ✕
          </button>
        </div>

        <p className="text-sm opacity-80">
          Select the amount of chips you want to purchase.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {amounts.map((amt) => (
            <button
              key={amt}
              onClick={() => handleBuy(amt)}
              className="py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700"
            >
              {amt.toLocaleString()} Chips
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
