import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { playerTotal, dealerCard } = await req.json()

    const prompt = `
      You are an expert blackjack assistant.
      Player total: ${playerTotal}
      Dealer's visible card: ${dealerCard}
      Suggest whether to "hit" or "stand" and explain briefly why.
      Keep it short, under 15 words.
      Example responses: "Dealer's upcard is weak; stand on 15."
      Use the words "hit" or "stand" in your suggestion to make it clear.
    `

    const MODEL_NAME = 'gemini-flash-latest'

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY!,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini REST error:', errorText)
      return NextResponse.json(
        { suggestion: 'AI unavailable — please try again later.' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'AI could not provide a suggestion.'

    return NextResponse.json({ suggestion: text })
  } catch (err) {
    console.error('Gemini error:', err)
    return NextResponse.json(
      { suggestion: 'AI suggestion failed.' },
      { status: 500 }
    )
  }
}
