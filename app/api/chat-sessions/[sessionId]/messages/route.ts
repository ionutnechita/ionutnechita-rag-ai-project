import { NextResponse } from "next/server"
import { getChatMessages } from "@/lib/database"

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params
    const messages = getChatMessages(sessionId)
    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Failed to get chat messages:", error)
    return NextResponse.json({ error: "Failed to get chat messages" }, { status: 500 })
  }
}
