import { NextResponse } from "next/server"
import { getAllChatSessions, createChatSession } from "@/lib/database"

export async function GET() {
  try {
    const sessions = getAllChatSessions()
    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Failed to get chat sessions:", error)
    return NextResponse.json({ error: "Failed to get chat sessions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { title } = await request.json()
    const session = createChatSession(title || "New Chat")
    return NextResponse.json({ session })
  } catch (error) {
    console.error("Failed to create chat session:", error)
    return NextResponse.json({ error: "Failed to create chat session" }, { status: 500 })
  }
}
