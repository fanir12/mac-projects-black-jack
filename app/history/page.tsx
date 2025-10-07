'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/core/supabase'
import { getCurrentUser } from '@/core/auth'
import Navbar from '@/components/NavBar'

type Game = {
  id: number
  bet: number
  outcome: 'win' | 'loss' | 'push' | 'blackjack'
  is_blackjack?: boolean
  player_total: number
  dealer_total: number
  delta?: number
  created_at: string
}

const ITEMS_PER_PAGE = 10

export default function HistoryPage() {
  const [games, setGames] = useState<Game[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

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
      .select('id, bet, outcome, is_blackjack, player_total, dealer_total, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      return
    }

    console.log('Raw games from database:', data)

    const withDelta = (data || []).map((g) => ({
      ...g,
      // Use is_blackjack field to determine if it was a blackjack win
      delta: g.is_blackjack ? Math.floor(g.bet * 1.5) : g.outcome === 'win' ? g.bet : g.outcome === 'loss' ? -g.bet : 0,
    }))
    console.log('Games with deltas:', withDelta)
    setGames(withDelta)
  }

  const totalPages = Math.ceil(games.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentGames = games.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  if (loading)
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          Loading...
        </main>
      </>
    )

  if (error)
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-black text-red-400 flex flex-col items-center justify-center gap-3">
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
      <main className="min-h-screen bg-black text-white px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Game History</h1>

          {games.length === 0 ? (
            <p className="text-neutral-400">No games found for this account.</p>
          ) : (
            <>
              {/* Game cards */}
              <div className="space-y-3 mb-8">
                {currentGames.map((g) => (
                  <div
                    key={g.id}
                    className="bg-neutral-900 rounded-xl p-6 border border-neutral-800"
                  >
                    <div className="grid grid-cols-4 gap-6">
                      {/* Date */}
                      <div>
                        <div className="text-neutral-500 text-sm mb-1">Date</div>
                        <div className="text-white font-medium">
                          {new Date(g.created_at).toLocaleDateString('en-US', {
                            month: 'numeric',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          ,{' '}
                          {new Date(g.created_at).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true,
                          })}
                        </div>
                      </div>

                      {/* Bet */}
                      <div>
                        <div className="text-neutral-500 text-sm mb-1">Bet</div>
                        <div className="text-white font-medium">{g.bet} chips</div>
                      </div>

                      {/* Score */}
                      <div>
                        <div className="text-neutral-500 text-sm mb-1">Score</div>
                        <div className="text-white font-medium">
                          You: {g.player_total} | Dealer: {g.dealer_total}
                        </div>
                      </div>

                      {/* Result */}
                      <div>
                        <div className="text-neutral-500 text-sm mb-1">Result</div>
                        <div
                          className={`font-semibold ${
                            g.is_blackjack || g.outcome === 'win'
                              ? 'text-green-400'
                              : g.outcome === 'loss'
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          }`}
                        >
                          {g.is_blackjack && 'Blackjack!'}
                          {!g.is_blackjack && g.outcome === 'win' && 'Win'}
                          {g.outcome === 'loss' && 'Lose'}
                          {g.outcome === 'push' && 'Push'}
                          {g.is_blackjack
                            ? ` (+${g.delta})`
                            : g.outcome === 'win'
                            ? ` (+${g.delta})`
                            : g.outcome === 'loss'
                            ? ` (${g.delta})`
                            : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    ←
                  </button>

                  {/* Page numbers */}
                  {currentPage > 2 && (
                    <>
                      <button
                        onClick={() => goToPage(1)}
                        className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
                      >
                        1
                      </button>
                      {currentPage > 3 && (
                        <span className="px-2 text-neutral-500">...</span>
                      )}
                    </>
                  )}

                  {[currentPage - 1, currentPage, currentPage + 1].map(
                    (page) =>
                      page > 0 &&
                      page <= totalPages && (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-2 rounded-lg transition-colors ${
                            page === currentPage
                              ? 'bg-white text-black font-semibold'
                              : 'bg-neutral-800 hover:bg-neutral-700'
                          }`}
                        >
                          {page}
                        </button>
                      )
                  )}

                  {currentPage < totalPages - 1 && (
                    <>
                      {currentPage < totalPages - 2 && (
                        <span className="px-2 text-neutral-500">...</span>
                      )}
                      <button
                        onClick={() => goToPage(totalPages)}
                        className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  )
}