'use client'
import { useEffect, useState } from 'react'
import GameTable from '@/components/GameTable'
import AuthForm from '@/components/AuthForm'
import { getCurrentUser } from '@/core/auth'
import Navbar from '@/components/NavBar'

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
    <>
      {/* Navbar is fixed and outside of main content */}
      <Navbar />

      {/* Main content is centered separately */}
      <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-100 pt-20">
        {user ? <GameTable /> : <AuthForm onLogin={() => window.location.reload()} />}
      </main>
    </>
  )
}
