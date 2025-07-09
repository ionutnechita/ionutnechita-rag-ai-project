"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Send, FileText, MessageCircle, RefreshCw, Bot, Sparkles } from "lucide-react"
import { DocumentUpload } from "@/components/document-upload"
import { ChatMessage } from "@/components/chat-message"
import { DocumentList } from "@/components/document-list"
import { OllamaStatus } from "@/components/ollama-status"

interface Document {
  id: string
  name: string
  type: string
  size: number
  chunks: number
  status: "processing" | "completed" | "failed"
  progress: number
  createdAt: string
}

export default function RAGChatbot() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  // Load existing documents on mount
  useEffect(() => {
    loadExistingDocuments()
  }, [])

  // Set up progress streaming
  useEffect(() => {
    if (documents.some((doc) => doc.status === "processing")) {
      const eventSource = new EventSource("/api/progress/stream")

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === "update" || data.type === "initial") {
          setDocuments(data.documents)
        }
      }

      eventSource.onerror = (error) => {
        console.error("EventSource failed:", error)
        eventSource.close()
      }

      return () => {
        eventSource.close()
      }
    }
  }, [documents])

  const loadExistingDocuments = async () => {
    try {
      const response = await fetch("/api/documents")
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents)
      }
    } catch (error) {
      console.error("Failed to load documents:", error)
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return

    setIsUploading(true)
    const formData = new FormData()

    Array.from(files).forEach((file) => {
      formData.append("files", file)
    })

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setDocuments((prev) => [...prev, ...result.documents])
      }
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const refreshDocuments = () => {
    setIsLoadingDocuments(true)
    loadExistingDocuments()
  }

  const completedDocuments = documents.filter((d) => d.status === "completed").length
  const totalDocuments = documents.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">RAG Chatbot</h1>
                <p className="text-sm text-gray-500">Powered by Ollama + Gemini AI</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>
                  {completedDocuments}/{totalDocuments} documente procesate
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Document Upload Section */}
        <div className="xl:col-span-1 space-y-4">
          {/* Ollama Status */}
          <OllamaStatus />

          {/* Documents Card */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Documente
                </CardTitle>
                <Button variant="outline" size="sm" onClick={refreshDocuments} disabled={isLoadingDocuments}>
                  <RefreshCw className={`h-4 w-4 ${isLoadingDocuments ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <Separator />
            </CardHeader>
            <CardContent className="space-y-4">
              <DocumentUpload onUpload={handleFileUpload} isUploading={isUploading} />
              {isLoadingDocuments ? (
                <div className="text-center text-muted-foreground py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm">Se încarcă documentele...</p>
                </div>
              ) : (
                <DocumentList documents={documents} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Section */}
        <div className="xl:col-span-3">
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm h-[calc(100vh-140px)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                Chat Inteligent
              </CardTitle>
              <Separator />
            </CardHeader>
            <CardContent className="flex flex-col h-[calc(100%-80px)] p-0">
              {/* Messages Area */}
              <ScrollArea ref={scrollAreaRef} className="flex-1 px-6">
                <div className="space-y-4 py-4">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
                        <Bot className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Bun venit la RAG Chatbot!</h3>
                      <p className="text-gray-600 mb-4 max-w-md">
                        Încarcă documente și începe să pui întrebări despre conținutul lor. Folosesc Ollama local pentru
                        embeddings și Gemini AI pentru răspunsuri.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-full">
                        <Sparkles className="h-4 w-4" />
                        <span>
                          {completedDocuments} din {totalDocuments} documente sunt gata pentru căutare
                        </span>
                      </div>
                    </div>
                  )}
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-3 text-gray-600 bg-gray-50 rounded-lg p-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="text-sm font-medium">Gemini AI analizează documentele...</span>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t bg-white/50 p-4">
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Pune o întrebare despre documentele încărcate..."
                      disabled={isLoading}
                      className="pr-12 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                      {input.length}/500
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim() || completedDocuments === 0}
                    className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                {completedDocuments === 0 && totalDocuments > 0 && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                    Așteaptă ca documentele să fie procesate pentru a putea pune întrebări
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
