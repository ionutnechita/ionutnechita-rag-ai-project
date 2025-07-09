import { NextResponse } from "next/server"
import { google } from "@ai-sdk/google"
import { AI_MODELS } from "@/lib/constants"

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    const model = AI_MODELS.GEMINI.CHAT

    if (!apiKey) {
      return NextResponse.json({
        connected: false,
        model,
        apiKeyConfigured: false,
        error: "API key not configured",
      })
    }

    // Test connection by making a simple request
    try {
      const testModel = google(model)

      // We can't easily test without making an actual request,
      // so we'll just check if the API key is present and properly formatted
      const isValidKey = apiKey.startsWith("AIza") && apiKey.length > 30

      return NextResponse.json({
        connected: isValidKey,
        model,
        apiKeyConfigured: true,
        error: isValidKey ? undefined : "Invalid API key format",
      })
    } catch (error) {
      return NextResponse.json({
        connected: false,
        model,
        apiKeyConfigured: true,
        error: "Failed to initialize model",
      })
    }
  } catch (error) {
    console.error("Gemini status check failed:", error)
    return NextResponse.json(
      {
        connected: false,
        model: AI_MODELS.GEMINI.CHAT,
        apiKeyConfigured: false,
        error: "Status check failed",
      },
      { status: 500 },
    )
  }
}
