'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/core/supabase'
import { getCurrentUser } from '@/core/auth'

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
    const loadHistory = async () => {
      // Get current signed-in user
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      if (!currentUser) {
        setError('Please log in to view your history.')
        setLoading(false)
        return
      }

      // Fetch only this user's games
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        const withDelta = (data || []).map((g) => ({
          ...g,
          delta:
            g.outcome === 'win'
              ? g.bet
              : g.outcome === 'loss'
              ? -g.bet
              : 0,
        }))
        setGames(withDelta)
      }

      setLoading(false)
    }

    loadHistory()
  }, [])

  if (loading)
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        Loading...
      </main>
    )

  if (error)
    return (
      <main className="min-h-screen bg-neutral-950 text-red-400 flex items-center justify-center">
        {error}
      </main>
    )

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <h1 className="text-2xl font-semibold mb-4">Your Game History</h1>

      {games.length === 0 ? (
        <p className="opacity-70">No games found for this account.</p>
      ) : (
        <table className="w-full text-left border-separate border-spacing-y-2">
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
      )}
    </main>
  )
}
