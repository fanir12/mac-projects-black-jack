'use client'

import { useState } from 'react'

interface BetControlsProps {
  max: number
  onBet: (n: number) => void
}

export default function BetControls({ max, onBet }: BetControlsProps) {
  const [amt, setAmt] = useState(10)

  return (
    <div className="flex flex-col items-center gap-3">
      {/* numeric input */}
      <input
        type="number"
        className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 w-24 text-center"
        min={1}
        max={max}
        value={amt}
        onChange={(e) =>
          setAmt(Math.max(1, Math.min(max, Number(e.target.value) || 1)))
        }
      />

      {/* quick bet buttons */}
      <div className="flex gap-2">
        {[5, 25, 100].map((v) => (
          <button
            key={v}
            className="px-3 py-1 rounded-md bg-neutral-700 hover:bg-neutral-600"
            onClick={() => setAmt((prev) => Math.min(max, prev + v))}
          >
            +{v}
          </button>
        ))}
      </div>

      {/* confirm bet */}
      <button
        className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500"
        onClick={() => onBet(amt)}
        disabled={amt < 1 || amt > max}
      >
        Place Bet
      </button>

      <div className="text-xs opacity-70">Max: {max}</div>
    </div>
  )
}
