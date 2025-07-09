const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const EMBEDDING_MODEL = "gemini-embedding-exp-03-07"
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

export async function createEmbedding(text: string): Promise<number[]> {
  let retries = 0

  while (retries < MAX_RETRIES) {
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
        const delay = RETRY_DELAY * Math.pow(2, retries - 1)
        console.log(`Quota exceeded, retrying in ${delay}ms... (attempt ${retries}/${MAX_RETRIES})`)
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
      if (retries >= MAX_RETRIES) {
        console.error("Max retries reached for embedding creation:", error)
        throw error
      }

      const delay = RETRY_DELAY * Math.pow(2, retries - 1)
      console.log(`Error creating embedding, retrying in ${delay}ms... (attempt ${retries}/${MAX_RETRIES})`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw new Error("Failed to create embedding after max retries")
}
