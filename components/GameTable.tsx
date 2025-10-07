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
    let mounted = true

    async function loadProfile() {
      const currentUser = await getCurrentUser()
      if (!mounted) return
      if (!currentUser) return

      setUser(currentUser)

      // Try to get existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('chips')
        .eq('user_id', currentUser.id)
        .maybeSingle()

      if (!mounted) return
      if (error) {
        console.error('Error loading profile:', error.message)
        return
      }

      if (data) {
        setChips(data.chips)
      } else {
        // Create profile with 500 starting chips
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ user_id: currentUser.id, chips: 500 })

        if (upsertError) console.error('Profile upsert failed:', upsertError.message)
        else setChips(500)
      }
    }

    loadProfile()
    return () => {
      mounted = false
    }
  }, [])

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
    const dealerUpcard = dealer[0]?.rank ?? 0
    setSuggestion('Thinking...')

    try {
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerTotal: pTotal, dealerCard: dealerUpcard }),
      })

      const data = await res.json()
      if (data.suggestion) setSuggestion(`AI suggests: ${data.suggestion}`)
      else setSuggestion('AI could not provide a suggestion.')
    } catch (err) {
      console.error(err)
      setSuggestion('Error getting AI suggestion.')
    }
  }

  async function finish(p: TCard[], d: TCard[]) {
    if (phase === 'result') return // prevent double save

    const result = settle(p, d)
    setOutcome(result)
    setPhase('result')

    const delta = result === 'win' ? bet! : result === 'loss' ? -bet! : 0
    const newChips = Math.max(0, chips + delta)
    setChips(newChips)

    if (!user) {
      console.warn('No user signed in — skipping save.')
      return
    }

    try {
      // Insert game record
      const { error: gameError } = await supabase.from('games').insert({
        user_id: user.id,
        bet: bet!,
        outcome: result,
        player_total: handTotal(p),
        dealer_total: handTotal(d),
        player_cards: JSON.stringify(p),
        dealer_cards: JSON.stringify(d),
      })

      if (gameError) {
        console.error('Insert failed:', gameError.message)
      } else if (process.env.NODE_ENV === 'development') {
        console.log('Game saved to Supabase')
      }

      // Update chip balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ chips: newChips })
        .eq('user_id', user.id)

      if (updateError) console.error('Chip update failed:', updateError.message)
    } catch (err) {
      console.error('Unexpected error saving game:', err)
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
      {phase === 'bet' && <BetControls max={chips} onBet={start} />}

      {/* Player actions */}
      {phase === 'player' && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
              onClick={hit}
              disabled={phase !== 'player'}
            >
              Hit
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold disabled:opacity-50"
              onClick={stand}
              disabled={phase !== 'player'}
            >
              Stand
            </button>
            <button
              className="px-3 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-lg font-semibold"
              onClick={askAi}
            >
              ?
            </button>
          </div>

          {suggestion && (
            <div className="text-xs text-center opacity-80 max-w-xs leading-snug">
              {suggestion}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {phase === 'result' && outcome && (
        <div className="space-y-2">
          <div className="text-lg">
            Result:{' '}
            <b
              className={
                {
                  win: 'text-green-400',
                  loss: 'text-red-400',
                  push: 'text-yellow-300',
                }[outcome]
              }
            >
              {outcome.toUpperCase()}
            </b>
          </div>
          <button
            className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600"
            onClick={reset}
          >
            Play Again
          </button>
        </div>
      )}

      {/* Chip display */}
      <div className="text-sm opacity-80 flex items-center gap-2">
        Chips: {chips}
        <button
          onClick={() => setShowBuyModal(true)}
          className="ml-1 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-xs"
        >
          +
        </button>
      </div>

      {/* Buy Chips Modal */}
      {showBuyModal && user && (
        <BuyChips
          userId={user.id}
          onBuy={(amt) => setChips((prev) => prev + amt)}
          onClose={() => setShowBuyModal(false)}
        />
      )}
    </div>
  )
}
