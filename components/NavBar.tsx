'use client'
import ChipsDisplay from './ChipsDisplay'
import { signOut } from '@/core/auth'

export default function Navbar() {
  const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    await signOut()
    window.location.reload()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-sm border-b border-neutral-800">
      <div className="max-w-5xl mx-auto flex justify-between items-center px-6 py-3">
        {/* Left: Title + Chips */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold tracking-tight">Blackjack</h1>
          <ChipsDisplay />
        </div>

        {/* Right: Navigation */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          <a href="/" className="hover:text-blue-400 transition-colors">
            Home
          </a>
          <a href="/history" className="hover:text-blue-400 transition-colors">
            History
          </a>
          {/* Logout styled like a normal link */}
          <a
            href="#"
            onClick={handleLogout}
            className="hover:text-blue-400 transition-colors"
          >
            Logout
          </a>
        </nav>

      </div>
    </header>
  )
}
