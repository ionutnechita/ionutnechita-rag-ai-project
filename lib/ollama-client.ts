import { AI_MODELS, API_CONFIG } from "./constants"

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434"
const EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || AI_MODELS.OLLAMA.EMBEDDING

export async function createEmbedding(text: string): Promise<number[]> {
  let retries = 0

  while (retries < API_CONFIG.MAX_RETRIES) {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          prompt: text,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.embedding || !Array.isArray(data.embedding)) {
        throw new Error("Invalid embedding response format")
      }

      return data.embedding
    } catch (error) {
      retries++
      if (retries >= API_CONFIG.MAX_RETRIES) {
        console.error("Max retries reached for embedding creation:", error)
        throw new Error(`Failed to create embedding after ${API_CONFIG.MAX_RETRIES} retries: ${error}`)
      }

      const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, retries - 1)
      console.log(`Error creating embedding, retrying in ${delay}ms... (attempt ${retries}/${API_CONFIG.MAX_RETRIES})`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw new Error("Failed to create embedding after max retries")
}

export async function testOllamaConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`)
    if (response.ok) {
      const data = await response.json()
      const hasEmbeddingModel = data.models?.some(
        (model: any) => model.name.includes(EMBEDDING_MODEL) || model.name.includes("nomic-embed"),
      )

      if (!hasEmbeddingModel) {
        console.warn(
          `Warning: ${EMBEDDING_MODEL} model not found. Available models:`,
          data.models?.map((m: any) => m.name) || [],
        )
      }

      return true
    }
    return false
  } catch (error) {
    console.error("Failed to connect to Ollama:", error)
    return false
  }
}

export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`)
    if (response.ok) {
      const data = await response.json()
      return data.models?.map((model: any) => model.name) || []
    }
    return []
  } catch (error) {
    console.error("Failed to get available models:", error)
    return []
  }
}
