import { NextResponse } from "next/server"
import { testOllamaConnection, getAvailableModels } from "@/lib/ollama-client"
import { AI_MODELS } from "@/lib/constants"

export async function GET() {
  try {
    const isConnected = await testOllamaConnection()
    const models = await getAvailableModels()

    return NextResponse.json({
      connected: isConnected,
      models,
      embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || AI_MODELS.OLLAMA.EMBEDDING,
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    })
  } catch (error) {
    console.error("Ollama status check failed:", error)
    return NextResponse.json(
      {
        connected: false,
        error: "Failed to connect to Ollama",
        models: [],
        embeddingModel: AI_MODELS.OLLAMA.EMBEDDING,
        baseUrl: "http://localhost:11434",
      },
      { status: 500 },
    )
  }
}
