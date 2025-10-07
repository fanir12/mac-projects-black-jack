'use client'
import { useEffect, useMemo, useState, useCallback } from 'react'
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
  const [suggestion, setSuggestion] = useState<string | null>(null)

  const pTotal = useMemo(() => handTotal(player), [player])
  const dTotal = useMemo(() => handTotal(dealer), [dealer])

  // Finish function 
  const finish = useCallback(async (p: TCard[], d: TCard[]) => {
    const result = settle(p, d)
    setOutcome(result)
    setPhase('result')

    // Calculate chip delta (blackjack pays 3:2 = 1.5x bet)
    let delta = 0
    if (result === 'blackjack') delta = Math.floor(bet! * 1.5)
    else if (result === 'win') delta = bet!
    else if (result === 'loss') delta = -bet!
    // push = 0

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
    // Notify other components that chips were updated
    window.dispatchEvent(new CustomEvent('chips-updated'))
  }, [bet, chips, user])

  // Auto-bust: if player goes over 21, immediately end game
  useEffect(() => {
    if (phase === 'player' && pTotal > 21) {
      console.log('Player busted with total:', pTotal)
      console.log('Dealer cards:', dealer.length, 'Total:', handTotal(dealer))
      setPhase('dealer')
      finish([...player], [...dealer])
    }
  }, [pTotal, phase, player, dealer, finish])

  // Load user chips
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
        if (!upsertError) {
          setChips(500)
          // Notify ChipsDisplay about the new chip balance
          window.dispatchEvent(new CustomEvent('chips-updated'))
        }
      }
    }

    loadProfile()

    // Listen for chip updates (e.g., from buying chips)
    const handleChipsUpdate = () => {
      console.log('GameTable: chips-updated event received')
      loadProfile()
    }
    window.addEventListener('chips-updated', handleChipsUpdate)

    return () => {
      window.removeEventListener('chips-updated', handleChipsUpdate)
    }
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
    setDealer([drawCard(), drawCard()])
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

  // --- UI ---
  return (
    <div className="relative w-full min-h-screen flex items-start justify-center bg-black px-4 pt-20">
      {/* Main game table - centered vertically and horizontally */}
      <div className="w-full max-w-2xl space-y-12 sm:space-y-24">
        
        {/* Dealer section */}
        <div className="flex flex-col items-center space-y-4 sm:space-y-6">
          {/* Dealer cards */}
          <div className="flex gap-4 justify-center min-h-[140px] items-center">
            {phase === 'bet' ? (
              // Show gray slots during bet phase
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} i={i} slot />
              ))
            ) : (
              // Show all dealer's cards
              <>
                {dealer.map((card, i) =>
                  phase === 'player' && i === 1 ? (
                    <Card key={`${i}-back`} i={i} back />
                  ) : (
                    <Card key={`${i}-${phase}`} c={card} i={i} />
                  )
                )}
              </>
            )}
          </div>

          {/* Dealer label - always visible */}
          <div className="bg-white text-black px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2">
            {phase !== 'bet' && (
              <span className="font-bold">
                {phase === 'player'
                  ? handTotal([dealer[0]]) // show only visible card total
                  : dTotal // reveal full total after dealer turn
                }
              </span>
            )}
            <span className="text-neutral-600">Dealer</span>
          </div>
        </div>

        {/* Player section */}
        <div className="flex flex-col items-center space-y-4 sm:space-y-6">
          {/* Player cards */}
          <div className="flex gap-4 justify-center min-h-[140px] items-center">
            {phase === 'bet' ? (
              // Show gray slots during bet phase
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} i={i} slot />
              ))
            ) : (
              // Show player's cards during play
              player.map((card, i) => <Card key={i} c={card} i={i} />)
            )}
          </div>

          {/* Player label - always visible */}
          <div className="bg-white text-black px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2">
            {phase !== 'bet' && <span className="font-bold">{pTotal}</span>}
            <span className="text-neutral-600">You</span>
          </div>
        </div>

        {/* Controls section */}
        <div className="flex flex-col items-center space-y-8">
          {/* Bet phase */}
          {phase === 'bet' && (
            <div className="w-full max-w-sm">
              <BetControls max={chips} onBet={start} />
            </div>
          )}

          {/* Player action phase */}
          {phase === 'player' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex justify-center items-center gap-6">
                <button
                  className="px-6 sm:px-8 py-3 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white font-semibold transition-colors text-base sm:text-lg"
                  onClick={hit}
                >
                  Hit
                </button>
                <button
                  className="w-12 h-12 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-xl font-bold transition-colors"
                  onClick={askAi}
                  title="Ask AI for suggestion"
                >
                  ?
                </button>
                <button
                  className="px-6 sm:px-8 py-3 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white font-semibold transition-colors text-base sm:text-lg"
                  onClick={stand}
                >
                  Stand
                </button>
              </div>
              {suggestion && (
                <p className="text-sm text-neutral-400 max-w-md text-center">{suggestion}</p>
              )}
            </div>
          )}

          {/* Result phase */}
          {phase === 'result' && (
            <div className="space-y-4 text-center">
              <p className="text-xl sm:text-2xl text-white">
                {outcome === 'blackjack' && 'Blackjack! You get 1.5X your original bet ദ്ദി✧'}
                {outcome === 'win' && 'You Win!☺'}
                {outcome === 'loss' && 'You Lose˙◠˙'}
                {outcome === 'push' && 'Pushᯓ★'}
              </p>
              <button
                className="px-8 py-3 bg-neutral-700 hover:bg-neutral-600 rounded-lg font-semibold transition-colors text-white text-lg"
                onClick={reset}
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}