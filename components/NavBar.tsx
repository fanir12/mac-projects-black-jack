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
    <header className="w-full flex justify-between items-center px-8 py-4">
      <div className="w-full flex justify-between items-center px-8 py-4">
        {/* Left: Title + Chips */}
        <div className="flex items-center gap-4">
          <p className="text-xl font-semibold">Blackjack</p>
          <ChipsDisplay />
        </div>

        {/* Right: Navigation */}
        <nav className="flex items-center gap-8 text-sm font-medium">
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