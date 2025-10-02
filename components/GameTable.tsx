'use client'
import { useEffect, useMemo, useState } from 'react'
import {
  Card as TCard,
  drawCard,
  handTotal,
  dealerPlay,
  settle,
  type Outcome,
} from '@/core/game'
import Card from './Card'

// GameTable component
export default function GameTable() {
  const [player, setPlayer] = useState<TCard[]>([])
  const [dealer, setDealer] = useState<TCard[]>([])
  const [bet, setBet] = useState<number | null>(null)
  const [phase, setPhase] = useState<'bet' | 'player' | 'dealer' | 'result'>('bet')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  // local chip count 
  const [chips, setChips] = useState(1000)

  const pTotal = useMemo(() => handTotal(player), [player])
  const dTotal = useMemo(() => handTotal(dealer), [dealer])

  // reset game to betting phase
  function reset() {
    setPlayer([])
    setDealer([])
    setBet(null)
    setPhase('bet')
    setOutcome(null)
  }

  // start a new round with the given bet amount
  function start(amt: number) {
    if (amt < 1 || amt > chips) return
    setBet(amt)
    setPlayer([drawCard(), drawCard()])
    setDealer([drawCard()])
    setPhase('player')
  }

  // hit: add another card to player's hand
  function hit() {
    if (phase !== 'player' || pTotal >= 21) return
    setPlayer((prev) => [...prev, drawCard()])
  }

  // stand: dealer plays until total=>17
  function stand() {
    setPhase('dealer')
    const d = dealerPlay(dealer)
    setDealer(d)
    finish([...player], [...d])
  }

  // finish the round
  function finish(p: TCard[], d: TCard[]) {
    const result = settle(p, d)
    setOutcome(result)
    setPhase('result')

    // temporary chip logic
    const delta = result === 'win' ? bet! : result === 'loss' ? -bet! : 0
    setChips((prev) => Math.max(0, prev + delta))
  }

  return (
    <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
      <h2 className="text-lg font-semibold">Blackjack Table</h2>

      {/* Dealer section */}
      <section>
        <div className="mb-2 text-sm opacity-70">Dealer</div>
        <div className="flex gap-2">
          {dealer.map((c, i) => (
            <Card key={i} c={c} i={i} />
          ))}
        </div>
        {phase !== 'bet' && <div className="mt-1 text-xs">Total: {dTotal}</div>}
      </section>

      {/* Player section */}
      <section>
        <div className="mb-2 text-sm opacity-70">You</div>
        <div className="flex gap-2">
          {player.map((c, i) => (
            <Card key={i} c={c} i={i} />
          ))}
        </div>
        {phase !== 'bet' && <div className="mt-1 text-xs">Total: {pTotal}</div>}
      </section>

      {/* Betting controls */}
      {phase === 'bet' && (
        <BetControls max={chips} onBet={start} />
      )}

      {/* Player actions */}
      {phase === 'player' && (
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500"
                  onClick={hit}>Hit</button>
          <button className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500"
                  onClick={stand}>Stand</button>
        </div>
      )}

      {/* Results */}
      {phase === 'result' && outcome && (
        <div className="space-y-2">
          <div className="text-lg">
            Result: <b className={{
              win: 'text-green-400',
              loss: 'text-red-400',
              push: 'text-yellow-300',
            }[outcome]}>{outcome.toUpperCase()}</b>
          </div>
          <button className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600"
                  onClick={reset}>Play Again</button>
        </div>
      )}

      {/* Chip display */}
      <div className="text-sm opacity-80">Chips: {chips}</div>
    </div>
  )
}

// BetControls subcomponent
function BetControls({ max, onBet }: { max: number; onBet: (n: number) => void }) {
  const [amt, setAmt] = useState(10)

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 w-20"
        min={1}
        max={max}
        value={amt}
        onChange={(e) => setAmt(Math.max(1, Math.min(max, Number(e.target.value) || 1)))}
      />
      <button
        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500"
        onClick={() => onBet(amt)}
        disabled={amt < 1 || amt > max}
      >
        Place Bet
      </button>
    </div>
  )
}
