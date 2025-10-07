'use client'
import { useState } from 'react'

interface BetControlsProps {
  max: number
  onBet: (n: number) => void
}

export default function BetControls({ max, onBet }: BetControlsProps) {
  const [amt, setAmt] = useState(10)

  return (
    <div className="flex flex-col items-center gap-4">
      {/* numeric input */}
      <input
        type="number"
        className="px-6 py-3 rounded-lg bg-neutral-900 border-2 border-neutral-700 w-full text-center text-white text-xl font-semibold focus:outline-none focus:border-neutral-600"
        min={1}
        max={max}
        value={amt}
        onChange={(e) =>
          setAmt(Math.max(1, Math.min(max, Number(e.target.value) || 1)))
        }
      />

      {/* quick bet buttons */}
      <div className="flex gap-3 w-full">
        {[5, 25, 100].map((v) => (
          <button
            key={v}
            className="flex-1 px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold transition-colors border border-neutral-700"
            onClick={() => setAmt((prev) => Math.min(max, prev + v))}
          >
            +{v}
          </button>
        ))}
      </div>

      {/* confirm bet */}
      <button
        className="w-full px-6 py-3 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg relative group"
        onClick={() => onBet(amt)}
        disabled={amt < 1 || amt > max}
        title={max === 0 ? "Your chip balance is 0. Please top up before placing the bet." : ""}
      >
        Place Bet
        {max === 0 && (
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Aw! Your chip balance is 0. Please top up before placing a bet!
          </span>
        )}
      </button>
    </div>
  )
}