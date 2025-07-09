import type { NextRequest } from "next/server"
import { streamText } from "ai"
import { google } from "@ai-sdk/google"
import { searchSimilarChunks, saveChatMessage } from "@/lib/database"
import { AI_MODELS } from "@/lib/constants"

// Maximum duration in seconds for this API route
export const maxDuration = 30 // Static value required by Next.js

export async function POST(req: NextRequest) {
  try {
    const { sessionId, messages } = await req.json()
    const lastMessage = messages[messages.length - 1]

    console.log(`Processing chat request for session ${sessionId}: "${lastMessage.content.substring(0, 100)}..."`)

    // Search for relevant document chunks using Ollama embeddings
    const relevantChunks = await searchSimilarChunks(lastMessage.content, 59)

    // Build enhanced context with file information
    let context = ""
    if (relevantChunks.length > 0) {
      const chunksByFile = relevantChunks.reduce(
        (acc, chunk) => {
          if (!acc[chunk.fileName]) {
            acc[chunk.fileName] = []
          }
          acc[chunk.fileName].push(chunk)
          return acc
        },
        {} as Record<string, typeof relevantChunks>,
      )

      context = "Context din documentele încărcate:\n\n"

      Object.entries(chunksByFile).forEach(([fileName, chunks]) => {
        context += `=== Din fișierul: ${fileName} ===\n`
        chunks.forEach((chunk, index) => {
          context += `Fragment ${chunk.chunkIndex + 1}/${chunk.totalChunks} (similaritate: ${chunk.similarity.toFixed(3)}):\n${chunk.content}\n\n`
        })
        context += "\n"
      })

      console.log(`Found relevant content from ${Object.keys(chunksByFile).length} files`)
    } else {
      context = "Nu am găsit informații relevante în documentele încărcate pentru această întrebare."
      console.log("No relevant chunks found for the query")
    }

    const systemPrompt = `Ești un asistent AI specializat în analiza documentelor. 

INSTRUCȚIUNI IMPORTANTE:
1. Folosește DOAR informațiile din contextul furnizat pentru a răspunde la întrebări
2. Când citezi informații, MENȚIONEAZĂ ÎNTOTDEAUNA numele fișierului sursă
3. Dacă informația provine din mai multe fișiere, specifică fiecare sursă
4. Dacă nu găsești informația în context, spune clar că nu ai informații suficiente
5. Când te referi la tabele sau date specifice, menționează fișierul din care provin
6. Răspunde în română și fii precis și concis

Format pentru citare: "Conform fișierului [nume_fișier], ..."

${context}`

    const result = streamText({
      model: google(AI_MODELS.GEMINI.CHAT),
      system: systemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      onFinish: async (result) => {
        // Save chat messages to database
        await saveChatMessage({
          sessionId,
          role: "user",
          content: lastMessage.content,
        })
        await saveChatMessage({
          sessionId,
          role: "assistant",
          content: result.text,
        })
        console.log("Chat messages saved to database")
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
