'use client'
import { useEffect, useState } from 'react'
import { signInWithGoogle, signOut, getCurrentUser } from '@/core/auth'

export default function LoginPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold mb-4">Blackjack Login</h1>

      {!user && (
        <button
          onClick={signInWithGoogle}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500"
        >
          Sign in with Google
        </button>
      )}

      {user && (
        <>
          <p>Signed in as {user.email}</p>
          <button
            onClick={signOut}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500"
          >
            Sign Out
          </button>

          <a
            href="/"
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500"
          >
            Go to Game
          </a>
        </>
      )}
    </main>
  )
}
