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
import BetControls from './BetControls'
import { supabase } from '@/core/supabase'



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
  async function finish(p: TCard[], d: TCard[]) {
    const result = settle(p, d)
    setOutcome(result)
    setPhase('result')

    const delta = result === 'win' ? bet! : result === 'loss' ? -bet! : 0
    const newChips = Math.max(0, chips + delta)
    setChips(newChips)

    // insert result into Supabase
    const { error } = await supabase.from('games').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // temporary placeholder
      bet: bet!,
      outcome: result,
      player_total: handTotal(p),
      dealer_total: handTotal(d),
      player_cards: JSON.stringify(p),
      dealer_cards: JSON.stringify(d),
    })

    if (error) {
      console.error('Insert failed:', error.message)
    } else {
      console.log('Game saved!')
    }
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