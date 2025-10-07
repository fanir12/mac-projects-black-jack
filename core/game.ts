export type Card = { rank: number; suit: '♠' | '♥' | '♦' | '♣' }

// draw one random card
export function drawCard(): Card {
  const rank = Math.ceil(Math.random() * 13) // 1..13
  const suits: Card['suit'][] = ['♠', '♥', '♦', '♣']
  const suit = suits[Math.floor(Math.random() * 4)]
  return { rank, suit }
}

// return a label for a card"
export function cardLabel(c: Card) {
  const map: Record<number, string> = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }
  return `${map[c.rank] ?? c.rank}${c.suit}`
}

// calculate blackjack hand total
export function handTotal(cards: Card[]): number {
  let total = 0
  let aces = 0
  for (const c of cards) {
    if (c.rank === 1) {
      aces++
      total += 1
    } else if (c.rank >= 11) {
      total += 10
    } else {
      total += c.rank
    }
  }
  // upgrade aces from 1 to 11 if possible
  while (aces > 0 && total + 10 <= 21) {
    total += 10
    aces--
  }
  return total
}

// check if hand is a natural blackjack (21 with exactly 2 cards)
export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handTotal(cards) === 21
}

// possible outcomes
export type Outcome = 'win' | 'loss' | 'push' | 'blackjack'

// decide winner
export function settle(player: Card[], dealer: Card[]): Outcome {
  const pt = handTotal(player)
  const dt = handTotal(dealer)
  const playerBJ = isBlackjack(player)
  const dealerBJ = isBlackjack(dealer)

  // Player busts
  if (pt > 21) return 'loss'

  // Both have blackjack = push
  if (playerBJ && dealerBJ) return 'push'

  // Player has blackjack (pays 3:2)
  if (playerBJ) return 'blackjack'

  // Dealer busts
  if (dt > 21) return 'win'

  // Compare totals
  if (pt > dt) return 'win'
  if (pt < dt) return 'loss'
  return 'push'
}

// dealer must hit until total=>17
export function dealerPlay(start: Card[]): Card[] {
  const d = [...start]
  while (handTotal(d) < 17) {
    d.push(drawCard())
  }
  return d
}
