import Database from "better-sqlite3"
import { join } from "path"
import { createEmbedding } from "./ollama-client"
import type { ProcessedChunk } from "./document-processor"

const dbPath = join(process.cwd(), "data", "rag.db")
const db = new Database(dbPath)

// Initialize database tables with chat sessions
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

  CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_embeddings_document_id ON embeddings(document_id);
  CREATE INDEX IF NOT EXISTS idx_embeddings_file_name ON embeddings(file_name);
  CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
  CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
  CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at);
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

export interface ChatSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id?: number
  sessionId: string
  role: "user" | "assistant"
  content: string
  createdAt?: string
}

// Chat Sessions
export function createChatSession(title = "New Chat"): ChatSession {
  const id = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const stmt = db.prepare(`
    INSERT INTO chat_sessions (id, title)
    VALUES (?, ?)
  `)

  stmt.run(id, title)

  return {
    id,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function getAllChatSessions(): ChatSession[] {
  const stmt = db.prepare(`
    SELECT id, title, created_at as createdAt, updated_at as updatedAt
    FROM chat_sessions
    ORDER BY updated_at DESC
  `)

  return stmt.all() as ChatSession[]
}

export function getChatSession(id: string): ChatSession | null {
  const stmt = db.prepare(`
    SELECT id, title, created_at as "createdAt", updated_at as "updatedAt"
    FROM chat_sessions
    WHERE id = ?
  `)

  const result = stmt.get(id) as ChatSession | undefined
  return result || null
}

export function updateChatSessionTitle(id: string, title: string): void {
  const stmt = db.prepare(`
    UPDATE chat_sessions 
    SET title = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)

  stmt.run(title, id)
}

export function deleteChatSession(id: string): void {
  const stmt = db.prepare(`DELETE FROM chat_sessions WHERE id = ?`)
  stmt.run(id)
}

// Chat Messages
export function saveChatMessage(message: Omit<ChatMessage, "id" | "createdAt">): void {
  const stmt = db.prepare(`
    INSERT INTO chat_messages (session_id, role, content)
    VALUES (?, ?, ?)
  `)

  stmt.run(message.sessionId, message.role, message.content)

  // Update session timestamp
  const updateStmt = db.prepare(`
    UPDATE chat_sessions 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `)
  updateStmt.run(message.sessionId)
}

export function getChatMessages(sessionId: string): ChatMessage[] {
  const stmt = db.prepare(
    `SELECT id, session_id as sessionId, role, content, created_at as createdAt
    FROM chat_messages
    WHERE session_id = ?
    ORDER BY created_at ASC`
  )

  return stmt.all(sessionId) as unknown as ChatMessage[]
}

// Documents
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

      await updateDocumentProgress(documentId, progress)
      console.log(`Progress: ${progress}% (${processedChunks}/${chunks.length})`)
    } catch (error) {
      console.error(`Failed to create embedding for chunk ${i}:`, error)
      const errorRate = (i + 1 - processedChunks) / (i + 1)
      if (errorRate > 0.5) {
        console.error(`Too many embedding failures (${Math.round(errorRate * 100)}%), marking document as failed`)
        await updateDocumentProgress(documentId, progress, "failed")
        throw error
      }
    }
  }

  console.log(`Successfully created embeddings for document ${documentId}`)
  await updateDocumentProgress(documentId, 100, "completed")
}

interface EmbeddingRow {
  document_id: string
  chunk_index: number
  content: string
  embedding: Buffer
  file_name: string
  file_type: string
  total_chunks: number
}

export async function searchSimilarChunks(query: string, limit = 10) {
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

    const rows = stmt.all() as EmbeddingRow[]
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

  return stmt.all() as Document[]
}

export function getDocumentById(id: string): Document | null {
  const stmt = db.prepare<[string], Document>(`
    SELECT id, name, type, size, path, chunks, status, progress, created_at as createdAt
    FROM documents
    WHERE id = ?
  `)

  const result = stmt.get(id) as Document | undefined
  return result || null
}

export async function deleteDocument(documentId: string): Promise<void> {
  // Delete embeddings first (foreign key constraint)
  const deleteEmbeddingsStmt = db.prepare(`DELETE FROM embeddings WHERE document_id = ?`)
  deleteEmbeddingsStmt.run(documentId)

  // Delete document
  const deleteDocumentStmt = db.prepare(`DELETE FROM documents WHERE id = ?`)
  deleteDocumentStmt.run(documentId)

  console.log(`Document ${documentId} and its embeddings deleted successfully`)
}

export function createDefaultChatSession(): ChatSession {
  // Generate a unique ID with timestamp
  const timestamp = new Date().toISOString().slice(2, 10).replace(/-/g, "") // YYMMDD format
  const randomSuffix = Math.floor(Math.random() * 100)
  const id = `default_chat_${timestamp}_${randomSuffix}`
  const title = `Chat Principal_${randomSuffix}`

  // Check if a default session already exists
  const existingStmt = db.prepare(`
    SELECT id, title, created_at as createdAt, updated_at as updatedAt
    FROM chat_sessions
    WHERE title LIKE 'Chat Principal%'
    ORDER BY created_at DESC
    LIMIT 1
  `)

  const existing = existingStmt.get() as ChatSession | undefined
  if (existing) {
    return existing
  }

  const stmt = db.prepare(`
    INSERT INTO chat_sessions (id, title)
    VALUES (?, ?)
  `)

  stmt.run(id, title)

  return {
    id,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
