'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/core/supabase'
import { getCurrentUser } from '@/core/auth'
import Navbar from '@/components/NavBar'

type Game = {
  id: number
  bet: number
  outcome: 'win' | 'loss' | 'push'
  player_total: number
  dealer_total: number
  delta?: number
  created_at: string
}

export default function HistoryPage() {
  const [games, setGames] = useState<Game[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function initHistory() {
      const currentUser = await getCurrentUser()
      setUser(currentUser)

      if (!currentUser) {
        setError('Please log in to view your history.')
        setLoading(false)
        return
      }

      await loadHistory(currentUser.id)
      setLoading(false)
    }

    initHistory()
  }, [])

  async function loadHistory(userId: string) {
    const { data, error } = await supabase
      .from('games')
      .select('id, bet, outcome, player_total, dealer_total, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      return
    }

    const withDelta = (data || []).map((g) => ({
      ...g,
      delta: g.outcome === 'win' ? g.bet : g.outcome === 'loss' ? -g.bet : 0,
    }))
    setGames(withDelta)
  }

  if (loading)
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
          Loading...
        </main>
      </>
    )

  if (error)
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-neutral-950 text-red-400 flex flex-col items-center justify-center gap-3">
          <p>{error}</p>
          <a
            href="/login"
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            Go to Login
          </a>
        </main>
      </>
    )

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6 pt-24">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold">Your Game History</h1>
          <button
            onClick={async () => {
              if (!user) return
              const { error } = await supabase
                .from('games')
                .delete()
                .eq('user_id', user.id)
              if (!error) {
                setGames([])
              }
            }}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Clear History
          </button>
        </div>

      {games.length === 0 ? (
        <p className="opacity-70">No games found for this account.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-separate border-spacing-y-2">
            <thead className="opacity-70 text-sm">
              <tr>
                <th>Date</th>
                <th>Bet</th>
                <th>Result</th>
                <th>Δ Chips</th>
                <th>Player</th>
                <th>Dealer</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => (
                <tr key={g.id} className="text-sm">
                  <td>{new Date(g.created_at).toLocaleString()}</td>
                  <td>{g.bet}</td>
                  <td
                    className={
                      g.outcome === 'win'
                        ? 'text-green-400'
                        : g.outcome === 'loss'
                        ? 'text-red-400'
                        : 'text-yellow-300'
                    }
                  >
                    {g.outcome}
                  </td>
                  <td>{g.delta! > 0 ? `+${g.delta}` : g.delta}</td>
                  <td>{g.player_total}</td>
                  <td>{g.dealer_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </main>
    </>
  )
}
