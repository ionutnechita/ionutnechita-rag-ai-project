import type { NextRequest } from "next/server"
import { getAllDocuments } from "@/lib/database"

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial data
      const documents = getAllDocuments()
      const data = `data: ${JSON.stringify({ type: "initial", documents })}\n\n`
      controller.enqueue(encoder.encode(data))

      // Set up periodic updates
      const interval = setInterval(() => {
        try {
          const updatedDocuments = getAllDocuments()
          const progressData = `data: ${JSON.stringify({
            type: "update",
            documents: updatedDocuments,
          })}\n\n`
          controller.enqueue(encoder.encode(progressData))

          // Check if all documents are completed
          const allCompleted = updatedDocuments.every((doc) => doc.status === "completed" || doc.status === "failed")

          if (allCompleted && updatedDocuments.length > 0) {
            clearInterval(interval)
            controller.close()
          }
        } catch (error) {
          console.error("Stream error:", error)
          clearInterval(interval)
          controller.error(error)
        }
      }, 1000) // Update every second

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
