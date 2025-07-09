import Database from "better-sqlite3"
import { join } from "path"
import { createEmbedding } from "./ollama-client"
import type { ProcessedChunk } from "./document-processor"

const dbPath = join(process.cwd(), "data", "rag.db")
const db = new Database(dbPath)

// Initialize database tables with enhanced metadata
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    path TEXT NOT NULL,
    chunks INTEGER NOT NULL,
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding BLOB NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    total_chunks INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents (id)
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_embeddings_document_id ON embeddings(document_id);
  CREATE INDEX IF NOT EXISTS idx_embeddings_file_name ON embeddings(file_name);
  CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
  CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
`)

export interface Document {
  id: string
  name: string
  type: string
  size: number
  path: string
  chunks: number
  status?: "processing" | "completed" | "failed"
  progress?: number
  createdAt?: string
}

export interface ChatMessage {
  id?: number
  role: "user" | "assistant"
  content: string
  createdAt?: string
}

export async function saveDocument(doc: Omit<Document, "createdAt">): Promise<Document> {
  const stmt = db.prepare(`
    INSERT INTO documents (id, name, type, size, path, chunks, status, progress)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(doc.id, doc.name, doc.type, doc.size, doc.path, doc.chunks, doc.status || "processing", doc.progress || 0)

  return {
    ...doc,
    createdAt: new Date().toISOString(),
  }
}

export async function saveEmbeddings(documentId: string, chunks: ProcessedChunk[]): Promise<void> {
  const stmt = db.prepare(`
    INSERT INTO embeddings (document_id, chunk_index, content, embedding, file_name, file_type, total_chunks)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  let processedChunks = 0
  let progress = 0

  console.log(`Starting embedding creation for document ${documentId} with ${chunks.length} chunks using Ollama...`)

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    try {
      console.log(`Creating embedding for chunk ${i + 1}/${chunks.length}...`)
      const embedding = await createEmbedding(chunk.content)
      const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer)

      stmt.run(
        documentId,
        chunk.metadata.chunkIndex,
        chunk.content,
        embeddingBuffer,
        chunk.metadata.fileName,
        chunk.metadata.fileType,
        chunk.metadata.totalChunks,
      )

      processedChunks++
      progress = Math.round((processedChunks / chunks.length) * 100)

      // Update progress
      await updateDocumentProgress(documentId, progress)
      console.log(`Progress: ${progress}% (${processedChunks}/${chunks.length})`)
    } catch (error) {
      console.error(`Failed to create embedding for chunk ${i}:`, error)
      // Continue with next chunk but mark as failed if too many errors
      const errorRate = (i + 1 - processedChunks) / (i + 1)
      if (errorRate > 0.5) {
        // If more than 50% failed
        console.error(`Too many embedding failures (${Math.round(errorRate * 100)}%), marking document as failed`)
        await updateDocumentProgress(documentId, progress, "failed")
        throw error
      }
    }
  }

  // Mark as completed
  console.log(`Successfully created embeddings for document ${documentId}`)
  await updateDocumentProgress(documentId, 100, "completed")
}

export async function searchSimilarChunks(query: string, limit = 5) {
  try {
    console.log(`Searching for similar chunks to query: "${query.substring(0, 100)}..."`)
    const queryEmbedding = await createEmbedding(query)

    const stmt = db.prepare(`
      SELECT 
        document_id, 
        chunk_index, 
        content, 
        embedding, 
        file_name, 
        file_type,
        total_chunks
      FROM embeddings
    `)

    const rows = stmt.all()
    console.log(`Found ${rows.length} chunks in database`)

    const similarities: Array<{
      documentId: string
      chunkIndex: number
      content: string
      similarity: number
      fileName: string
      fileType: string
      totalChunks: number
    }> = []

    for (const row of rows) {
      const embedding = new Float32Array(row.embedding.buffer)
      const similarity = cosineSimilarity(queryEmbedding, Array.from(embedding))

      similarities.push({
        documentId: row.document_id,
        chunkIndex: row.chunk_index,
        content: row.content,
        similarity,
        fileName: row.file_name,
        fileType: row.file_type,
        totalChunks: row.total_chunks,
      })
    }

    const results = similarities.sort((a, b) => b.similarity - a.similarity).slice(0, limit)
    console.log(
      `Returning top ${results.length} similar chunks with similarities:`,
      results.map((r) => ({ fileName: r.fileName, similarity: r.similarity.toFixed(3) })),
    )

    return results
  } catch (error) {
    console.error("Search error:", error)
    return []
  }
}

export async function saveChatMessage(message: Omit<ChatMessage, "id" | "createdAt">): Promise<void> {
  const stmt = db.prepare(`
    INSERT INTO chat_messages (role, content)
    VALUES (?, ?)
  `)

  stmt.run(message.role, message.content)
}

export function getChatHistory(limit = 50): ChatMessage[] {
  const stmt = db.prepare(`
    SELECT id, role, content, created_at as createdAt
    FROM chat_messages
    ORDER BY created_at DESC
    LIMIT ?
  `)

  return stmt.all(limit).reverse()
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))

  return dotProduct / (magnitudeA * magnitudeB)
}

export async function updateDocumentProgress(documentId: string, progress: number, status?: string): Promise<void> {
  const stmt = db.prepare(`
    UPDATE documents 
    SET progress = ?, status = COALESCE(?, status)
    WHERE id = ?
  `)

  stmt.run(progress, status, documentId)
}

export function getAllDocuments(): Document[] {
  const stmt = db.prepare(`
    SELECT id, name, type, size, path, chunks, status, progress, created_at as createdAt
    FROM documents
    ORDER BY created_at DESC
  `)

  return stmt.all()
}

export function getDocumentById(id: string): Document | null {
  const stmt = db.prepare(`
    SELECT id, name, type, size, path, chunks, status, progress, created_at as createdAt
    FROM documents
    WHERE id = ?
  `)

  return stmt.get(id) || null
}
