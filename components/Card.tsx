'use client'
import { motion } from 'framer-motion'
import type { Card as TCard } from '@/core/game'

export default function Card({
  c,
  i,
  back = false,
  empty = false,
  slot = false,
}: {
  c?: TCard
  i: number
  back?: boolean
  empty?: boolean
  slot?: boolean
}) {
  // Gray slot placeholder (used before cards are dealt)
  if (slot) {
    return (
      <div className="w-28 h-40 rounded-xl bg-neutral-800 border-2 border-neutral-700 shadow-lg" />
    )
  }

  // Empty card (transparent placeholder for spacing)
  if (empty) {
    return (
      <div className="w-28 h-40" />
    )
  }

  // Dealer's face-down card (black with inner rectangle)
  if (back) {
    return (
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
          delay: i * 0.1,
        }}
        className="w-28 h-40 rounded-xl bg-neutral-900 border-2 border-white shadow-lg grid place-items-center"
      >
        <div className="w-20 h-28 rounded-lg bg-neutral-800" />
      </motion.div>
    )
  }

  // Normal face-up card
  const suitColors = {
    '♠': 'text-black',
    '♣': 'text-black',
    '♥': 'text-red-600',
    '♦': 'text-red-600',
  }
  const map: Record<number, string> = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }
  const rankLabel = map[c!.rank] ?? c!.rank
  const suitColor = suitColors[c!.suit as keyof typeof suitColors]

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: i * 0.1,
      }}
      className="w-28 h-40 rounded-xl bg-white border-2 border-white shadow-lg flex flex-col items-center justify-between p-3.5"
    >
      <span className={`text-3xl font-bold ${suitColor} leading-none`}>{rankLabel}</span>
      <span className={`text-5xl ${suitColor} leading-none`}>{c!.suit}</span>
      <span className={`text-3xl font-bold ${suitColor} leading-none rotate-180`}>
        {rankLabel}
      </span>
    </motion.div>
  )
}