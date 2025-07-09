import { NextResponse } from "next/server"
import { getAllDocuments } from "@/lib/database"

export async function GET() {
  try {
    const documents = getAllDocuments()

    return NextResponse.json({
      success: true,
      documents,
    })
  } catch (error) {
    console.error("Failed to fetch documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}
