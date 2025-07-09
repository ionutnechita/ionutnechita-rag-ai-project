import { NextResponse } from "next/server"
import { deleteChatSession, getChatSession } from "@/lib/database"

export async function DELETE(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params
    deleteChatSession(sessionId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete chat session:", error)
    return NextResponse.json({ error: "Failed to delete chat session" }, { status: 500 })
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params
    const session = getChatSession(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }
    return NextResponse.json({ session })
  } catch (error) {
    console.error("Failed to get chat session:", error)
    return NextResponse.json({ error: "Failed to get chat session" }, { status: 500 })
  }
}
