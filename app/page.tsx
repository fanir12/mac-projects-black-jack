'use client'
import { useEffect, useState } from 'react'
import GameTable from '@/components/GameTable'
import AuthForm from '@/components/AuthForm'
import { getCurrentUser, signOut } from '@/core/auth'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  if (loading)
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100">
        Loading...
      </main>
    )

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-100 space-y-4">
      {user ? (
        <>
          <div className="flex justify-between w-full max-w-xl px-6 items-center">
            <span className="opacity-70 text-sm">{user.email}</span>

            <div className="flex gap-3">
              <a
                href="/history"
                className="text-sm underline hover:text-blue-400"
              >
                View History
              </a>
              <button
                onClick={async () => {
                  await signOut()
                  setUser(null)
                }}
                className="text-sm px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded"
              >
                Logout
              </button>
            </div>
          </div>

          <GameTable />
        </>
      ) : (
        <AuthForm onLogin={() => window.location.reload()} />
      )}
    </main>
  )
}
