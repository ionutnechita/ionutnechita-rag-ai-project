"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, RefreshCw, Server } from "lucide-react"

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
        embeddingModel: "nomic-embed-text",
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
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Verifică conexiunea Ollama...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Server className="h-4 w-4" />
          Status Ollama
          <Button variant="ghost" size="sm" onClick={checkStatus} className="ml-auto h-6 w-6 p-0">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center gap-2">
          {status?.connected ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <Badge variant="default" className="bg-green-100 text-green-700">
                Conectat
              </Badge>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <Badge variant="destructive">Deconectat</Badge>
            </>
          )}
        </div>

        <div className="text-xs text-gray-600 space-y-1">
          <div>URL: {status?.baseUrl}</div>
          <div>Model: {status?.embeddingModel}</div>
          {status?.models && status.models.length > 0 && (
            <div>
              Modele disponibile: {status.models.length}
              <div className="mt-1 flex flex-wrap gap-1">
                {status.models.slice(0, 3).map((model) => (
                  <Badge key={model} variant="outline" className="text-xs">
                    {model.split(":")[0]}
                  </Badge>
                ))}
                {status.models.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{status.models.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {!status?.connected && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            Asigură-te că Ollama rulează pe {status?.baseUrl}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
