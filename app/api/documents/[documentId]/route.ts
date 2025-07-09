import { NextResponse } from "next/server"
import { deleteDocument } from "@/lib/database"

export async function DELETE(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params
    await deleteDocument(documentId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete document:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
