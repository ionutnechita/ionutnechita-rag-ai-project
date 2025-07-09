"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, RefreshCw, Sparkles } from "lucide-react"
import { AI_MODELS } from "@/lib/constants"

interface GeminiStatus {
  connected: boolean
  model: string
  apiKeyConfigured: boolean
  error?: string
}

export function GeminiStatus() {
  const [status, setStatus] = useState<GeminiStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/gemini/status")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Failed to check Gemini status:", error)
      setStatus({
        connected: false,
        model: AI_MODELS.GEMINI.CHAT,
        apiKeyConfigured: false,
        error: "Failed to connect",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Verifică Gemini...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Gemini AI</span>
        </div>
        <Button variant="ghost" size="sm" onClick={checkStatus} className="h-6 w-6 p-0 hover:bg-gray-700">
          <RefreshCw className="h-3 w-3 text-gray-400" />
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        {status?.connected && status?.apiKeyConfigured ? (
          <>
            <CheckCircle className="h-3 w-3 text-green-500" />
            <Badge variant="default" className="bg-green-600 text-white text-xs">
              Ready
            </Badge>
          </>
        ) : (
          <>
            <AlertCircle className="h-3 w-3 text-red-500" />
            <Badge variant="destructive" className="text-xs">
              Not Ready
            </Badge>
          </>
        )}
      </div>

      <div className="text-xs text-gray-400 space-y-1">
        <div>Model: {status?.model}</div>
        <div>
          API Key:{" "}
          {status?.apiKeyConfigured ? (
            <span className="text-green-400">Configured</span>
          ) : (
            <span className="text-red-400">Missing</span>
          )}
        </div>
      </div>

      {!status?.connected && (
        <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded mt-2">
          {!status?.apiKeyConfigured ? "Configure GOOGLE_GENERATIVE_AI_API_KEY" : "Check API key and connection"}
        </div>
      )}
    </div>
  )
}
