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
import BuyChips from './BuyChips'
import BetControls from './BetControls'
import { supabase } from '@/core/supabase'
import { getCurrentUser } from '@/core/auth'

export default function GameTable() {
  const [user, setUser] = useState<any>(null)
  const [chips, setChips] = useState(1000)
  const [player, setPlayer] = useState<TCard[]>([])
  const [dealer, setDealer] = useState<TCard[]>([])
  const [bet, setBet] = useState<number | null>(null)
  const [phase, setPhase] = useState<'bet' | 'player' | 'dealer' | 'result'>('bet')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)

  const pTotal = useMemo(() => handTotal(player), [player])
  const dTotal = useMemo(() => handTotal(dealer), [dealer])

  useEffect(() => {
    async function loadProfile() {
      const currentUser = await getCurrentUser()
      if (!currentUser) return
      setUser(currentUser)

      const { data, error } = await supabase
        .from('profiles')
        .select('chips')
        .eq('user_id', currentUser.id)
        .maybeSingle()

      if (error) {
        console.error('Error loading profile:', error.message)
        return
      }

      if (data) setChips(data.chips)
      else {
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ user_id: currentUser.id, chips: 500 })
        if (!upsertError) setChips(500)
      }
    }

    loadProfile()
  }, [])

  // --- Game logic ---
  function reset() {
    setPlayer([])
    setDealer([])
    setBet(null)
    setPhase('bet')
    setOutcome(null)
    setSuggestion(null)
  }

  function start(amt: number) {
    if (amt < 1 || amt > chips) return
    setBet(amt)
    setPlayer([drawCard(), drawCard()])
    setDealer([drawCard()])
    setPhase('player')
  }

  function hit() {
    if (phase !== 'player' || pTotal >= 21) return
    setPlayer((prev) => [...prev, drawCard()])
  }

  function stand() {
    if (phase !== 'player') return
    setPhase('dealer')
    const d = dealerPlay(dealer)
    setDealer(d)
    finish([...player], [...d])
  }

  async function askAi() {
    if (player.length === 0 || dealer.length === 0) return
    setSuggestion('Thinking...')
    try {
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerTotal: pTotal,
          dealerCard: dealer[0]?.rank ?? 0,
        }),
      })
      const data = await res.json()
      setSuggestion(
        data.suggestion
          ? `AI suggests: ${data.suggestion}`
          : 'AI could not provide a suggestion.'
      )
    } catch {
      setSuggestion('Error getting AI suggestion.')
    }
  }

  async function finish(p: TCard[], d: TCard[]) {
    const result = settle(p, d)
    setOutcome(result)
    setPhase('result')
    const delta = result === 'win' ? bet! : result === 'loss' ? -bet! : 0
    const newChips = Math.max(0, chips + delta)
    setChips(newChips)

    if (!user) return
    await supabase.from('games').insert({
      user_id: user.id,
      bet: bet!,
      outcome: result,
      player_total: handTotal(p),
      dealer_total: handTotal(d),
      player_cards: JSON.stringify(p),
      dealer_cards: JSON.stringify(d),
    })
    await supabase
      .from('profiles')
      .update({ chips: newChips })
      .eq('user_id', user.id)
  }

  // --- UI ---
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[80vh] space-y-8">
      <h2 className="text-2xl font-semibold tracking-wide mb-2">
        Blackjack Table
      </h2>

      {/* Dealer section */}
      <section className="space-y-2">
        <div className="flex justify-center gap-4">
          {dealer.map((c, i) => (
            <Card key={i} c={c} i={i} />
          ))}
        </div>
        <div className="text-sm text-neutral-300">Dealer</div>
        {phase !== 'bet' && <p className="text-xs opacity-70">Total: {dTotal}</p>}
      </section>

      {/* Player section */}
      <section className="space-y-2">
        <div className="flex justify-center gap-4">
          {player.map((c, i) => (
            <Card key={i} c={c} i={i} />
          ))}
        </div>
        <div className="text-sm text-neutral-300">You</div>
        {phase !== 'bet' && <p className="text-xs opacity-70">Total: {pTotal}</p>}
      </section>

      {/* Betting or controls */}
      {phase === 'bet' && (
        <div className="mt-6 w-full flex justify-center">
          <div className="w-[240px]">
            <BetControls max={chips} onBet={start} />
          </div>
        </div>
      )}

      {phase === 'player' && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-3">
            <button
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              onClick={hit}
            >
              Hit
            </button>
            <button
              className="px-5 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
              onClick={stand}
            >
              Stand
            </button>
            <button
              className="px-4 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-lg font-semibold"
              onClick={askAi}
            >
              ?
            </button>
          </div>
          {suggestion && (
            <p className="text-xs text-neutral-400 max-w-xs">{suggestion}</p>
          )}
        </div>
      )}

      {phase === 'result' && (
        <div className="space-y-3">
          <p className="text-lg">
            Result:{' '}
            <b
              className={
                outcome === 'win'
                  ? 'text-green-400'
                  : outcome === 'loss'
                  ? 'text-red-400'
                  : 'text-yellow-300'
              }
            >
              {outcome?.toUpperCase()}
            </b>
          </p>
          <button
            className="px-5 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg"
            onClick={reset}
          >
            Play Again
          </button>
        </div>
      )}

      {/* Chip display
      <div className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-700 shadow-sm">
        <span className="text-sm font-medium text-neutral-100">💰 {chips}</span>
        <button
          onClick={() => setShowBuyModal(true)}
          className="ml-1 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-xs"
        >
          +
        </button>
      </div>

      {showBuyModal && user && (
        <BuyChips
          userId={user.id}
          onBuy={(amt) => setChips((prev) => prev + amt)}
          onClose={() => setShowBuyModal(false)}
        />
      )} */}
    </div>
  )
}
