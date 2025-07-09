import { NextResponse } from "next/server"
import { updateChatSessionTitle } from "@/lib/database"

export async function PATCH(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params
    const { title } = await request.json()

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 })
    }

    updateChatSessionTitle(sessionId, title.trim())
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to rename chat session:", error)
    return NextResponse.json({ error: "Failed to rename chat session" }, { status: 500 })
  }
}
