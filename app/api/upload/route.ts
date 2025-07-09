import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"
import { processDocument } from "@/lib/document-processor"
import { saveDocument } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 })
    }

    const uploadDir = join(process.cwd(), "uploads")
    await mkdir(uploadDir, { recursive: true })

    const processedDocuments = []

    for (const file of files) {
      const fileId = uuidv4()
      const fileName = `${fileId}-${file.name}`
      const filePath = join(uploadDir, fileName)

      // Save file to disk
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)

      // Process document and get chunks with metadata
      const chunks = await processDocument(filePath, file.type, file.name)

      // Save document metadata with processing status
      const document = await saveDocument({
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        path: filePath,
        chunks: chunks.length,
        status: "processing",
        progress: 0,
      })

      processedDocuments.push(document)

      // Start background processing for embeddings
      processEmbeddingsInBackground(fileId, chunks)
    }

    return NextResponse.json({
      success: true,
      documents: processedDocuments,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 })
  }
}

// Background processing function
async function processEmbeddingsInBackground(documentId: string, chunks: any[]) {
  const { saveEmbeddings } = await import("@/lib/database")

  try {
    await saveEmbeddings(documentId, chunks)
  } catch (error) {
    console.error(`Failed to process embeddings for document ${documentId}:`, error)
  }
}
