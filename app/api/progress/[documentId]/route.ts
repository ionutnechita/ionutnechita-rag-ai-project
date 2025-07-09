import { type NextRequest, NextResponse } from "next/server"
import { getDocumentById } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params
    const document = getDocumentById(documentId)

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: document.id,
      status: document.status,
      progress: document.progress,
    })
  } catch (error) {
    console.error("Progress check error:", error)
    return NextResponse.json({ error: "Failed to check progress" }, { status: 500 })
  }
}
