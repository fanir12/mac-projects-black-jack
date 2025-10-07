'use client'
import { useEffect, useState } from 'react'
import { type User } from '@supabase/supabase-js'
import GameTable from '@/components/GameTable'
import AuthForm from '@/components/AuthForm'
import { getCurrentUser } from '@/core/auth'
import Navbar from '@/components/NavBar'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        setUser(u)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error loading user:', err)
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
      <Navbar />

      <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-100 pt-4">
        {user ? <GameTable /> : <AuthForm onLogin={() => window.location.reload()} />}
      </main>
    </>
  )
}