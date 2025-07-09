"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, RefreshCw, Server } from "lucide-react"
import { AI_MODELS } from "@/lib/constants"

interface OllamaStatus {
  connected: boolean
  models: string[]
  embeddingModel: string
  baseUrl: string
  error?: string
}

export function OllamaStatus() {
  const [status, setStatus] = useState<OllamaStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/ollama/status")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Failed to check Ollama status:", error)
      setStatus({
        connected: false,
        models: [],
        embeddingModel: AI_MODELS.OLLAMA.EMBEDDING,
        baseUrl: "http://localhost:11434",
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
          <span>Verifică conexiunea...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Ollama Status</span>
        </div>
        <Button variant="ghost" size="sm" onClick={checkStatus} className="h-6 w-6 p-0 hover:bg-gray-700">
          <RefreshCw className="h-3 w-3 text-gray-400" />
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        {status?.connected ? (
          <>
            <CheckCircle className="h-3 w-3 text-green-500" />
            <Badge variant="default" className="bg-green-600 text-white text-xs">
              Connected
            </Badge>
          </>
        ) : (
          <>
            <AlertCircle className="h-3 w-3 text-red-500" />
            <Badge variant="destructive" className="text-xs">
              Disconnected
            </Badge>
          </>
        )}
      </div>

      <div className="text-xs text-gray-400 space-y-1">
        <div>Using model: {status?.embeddingModel}</div>
        {status?.models && status.models.length > 0 && <div>{status.models.length} models available</div>}
      </div>

      {!status?.connected && (
        <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded mt-2">Make sure Ollama is running</div>
      )}
    </div>
  )
}
