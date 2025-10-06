import GameTable from '@/components/GameTable'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100">
      {/* checking if history works */}
      <a
        href="/history"
        className="text-sm underline text-purple-400 hover:text-purple-300"
      >
        View History
      </a>
      <GameTable />
    </main>
  )
}
