'use client'
import ChipsDisplay from './ChipsDisplay'
import { signOut } from '@/core/auth'
import Link from 'next/link'

export default function Navbar() {
  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <header className="w-full flex justify-between items-center px-4 sm:px-8 py-4">
      <div className="w-full flex justify-between items-center gap-4">
        {/* Left: Title + Chips */}
        <div className="flex items-center gap-2 sm:gap-4">
          <p className="text-lg sm:text-xl font-semibold">Blackjack</p>
          <ChipsDisplay />
        </div>

        {/* Right: Navigation */}
        <nav className="flex items-center gap-4 sm:gap-8 text-base font-medium">
          <Link href="/" className="hover:text-blue-400 transition-colors">
            Home
          </Link>
          <Link href="/history" className="hover:text-blue-400 transition-colors">
            History
          </Link>
          <button
            onClick={handleLogout}
            className="hover:text-blue-400 transition-colors bg-transparent border-none cursor-pointer"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  )
}