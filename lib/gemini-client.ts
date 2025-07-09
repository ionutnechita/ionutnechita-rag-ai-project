import { AI_MODELS, API_CONFIG } from "./constants"

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const EMBEDDING_MODEL = AI_MODELS.GEMINI.EMBEDDING

export async function createEmbedding(text: string): Promise<number[]> {
  let retries = 0

  while (retries < API_CONFIG.MAX_RETRIES) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: `models/${EMBEDDING_MODEL}`,
            content: {
              parts: [{ text }],
            },
          }),
        },
      )

      if (response.status === 429) {
        // Quota exceeded, retry with exponential backoff
        retries++
        const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, retries - 1)
        console.log(`Quota exceeded, retrying in ${delay}ms... (attempt ${retries}/${API_CONFIG.MAX_RETRIES})`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.embedding.values
    } catch (error) {
      retries++
      if (retries >= API_CONFIG.MAX_RETRIES) {
        console.error("Max retries reached for embedding creation:", error)
        throw error
      }

      const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, retries - 1)
      console.log(`Error creating embedding, retrying in ${delay}ms... (attempt ${retries}/${API_CONFIG.MAX_RETRIES})`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw new Error("Failed to create embedding after max retries")
}
