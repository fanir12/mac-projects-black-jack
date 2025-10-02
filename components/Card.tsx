'use client'
import { motion } from 'framer-motion'
import type { Card as TCard } from '@/core/game'

// Card component
export default function Card({ c, i }: { c: TCard; i: number }) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0, rotate: -3 }}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.05 }}
      className="w-16 h-24 rounded-xl shadow-lg bg-neutral-800 border border-neutral-700 grid place-items-center text-xl font-semibold"
    >
      <span>{label(c)}</span>
    </motion.div>
  )
}

// converts a card object into a display string
function label(c: TCard) {
  const map: Record<number, string> = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }
  return `${map[c.rank] ?? c.rank}${c.suit}`
}
