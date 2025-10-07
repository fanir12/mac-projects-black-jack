'use client'
import { useState } from 'react'
import { signInWithEmail, signUpWithEmail } from '@/core/auth'

export default function AuthForm({ onLogin }: { onLogin?: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (isSignup) {
        const { error } = await signUpWithEmail(email, password)
        if (error) throw error
        setMessage('Verification email sent! Please confirm before logging in.')
        setIsSignup(false)
      } else {
        const { session, error } = await signInWithEmail(email, password)
        if (error) throw error
        if (!session) throw new Error('Login failed — no session returned.')
        onLogin?.()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      if (errorMessage.includes('Email not confirmed')) {
        setError('Please verify your email before logging in.')
      } else if (errorMessage.includes('Invalid login credentials')) {
        setError('Incorrect email or password.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 w-80 space-y-3">
      <h2 className="text-xl font-semibold text-center">
        {isSignup ? 'Create Account' : 'Login'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2 rounded bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          disabled={loading}
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2 rounded bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          disabled={loading}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-70"
        >
          {loading ? 'Loading...' : isSignup ? 'Sign Up' : 'Login'}
        </button>
      </form>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      {message && <p className="text-green-400 text-sm text-center">{message}</p>}

      <div className="text-xs text-center opacity-80">
        {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={() => {
            setIsSignup(!isSignup)
            setError(null)
            setMessage(null)
          }}
          className="underline hover:text-blue-400"
        >
          {isSignup ? 'Login' : 'Sign up'}
        </button>
      </div>
    </div>
  )
}
