'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/core/supabase'
import { getCurrentUser } from '@/core/auth'
import BuyChips from './BuyChips'

export default function ChipsDisplay() {
  const [user, setUser] = useState<any>(null)
  const [chips, setChips] = useState<number>(0)
  const [showBuyModal, setShowBuyModal] = useState(false)

  useEffect(() => {
    async function loadChips() {
      const currentUser = await getCurrentUser()
      if (!currentUser) return
      setUser(currentUser)

      const { data, error } = await supabase
        .from('profiles')
        .select('chips')
        .eq('user_id', currentUser.id)
        .maybeSingle()

      if (error) {
        console.error('Error loading chips:', error.message)
        return
      }

      if (data) setChips(data.chips)
    }
    loadChips()
  }, [])

  return (
    <>
      <div className="flex items-center gap-2 bg-neutral-900/70 px-3 py-1.5 rounded-full border border-neutral-700 shadow-sm backdrop-blur-sm">
        <span className="text-sm font-medium text-neutral-100">
          💸{chips}
        </span>
        <button
          onClick={() => setShowBuyModal(true)}
          className="ml-1 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-xs"
        >
          +
        </button>
      </div>

      {showBuyModal && user && (
        <BuyChips
          userId={user.id}
          onBuy={(amt) => setChips((prev) => prev + amt)}
          onClose={() => setShowBuyModal(false)}
        />
      )}
    </>
  )
}
