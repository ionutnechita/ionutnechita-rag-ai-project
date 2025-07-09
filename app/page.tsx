"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Plus, FileText, Upload, Bot } from "lucide-react"
import { ChatMessage } from "@/components/chat-message"
import { OllamaStatus } from "@/components/ollama-status"
import { GeminiStatus } from "@/components/gemini-status"
import { DocumentUploadDialog } from "@/components/document-upload-dialog"
import { DocumentSidebarList } from "@/components/document-sidebar-list"
import { ChatSessionItem } from "@/components/chat-session-item"

interface ChatSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

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
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Load chat sessions and documents on mount
  useEffect(() => {
    loadChatSessions()
    loadDocuments()
  }, [])

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId)
    }
  }, [currentSessionId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const loadChatSessions = async () => {
    try {
      const response = await fetch("/api/chat-sessions")
      if (response.ok) {
        const data = await response.json()
        setChatSessions(data.sessions)

        // If no current session, look for default session or create one
        if (!currentSessionId) {
          const defaultSession = data.sessions.find((s: ChatSession) => s.title.startsWith("Chat Principal"))
          if (defaultSession) {
            setCurrentSessionId(defaultSession.id)
          } else {
            // Create default session if it doesn't exist
            createDefaultSession()
          }
        }
      }
    } catch (error) {
      console.error("Failed to load chat sessions:", error)
    }
  }

  const createDefaultSession = async () => {
    try {
      // Generate unique title with timestamp
      const timestamp = new Date().toISOString().slice(2, 10).replace(/-/g, "")
      const randomSuffix = Math.floor(Math.random() * 100)
      const title = `Chat Principal_${randomSuffix}`

      const response = await fetch("/api/chat-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })

      if (response.ok) {
        const data = await response.json()
        setChatSessions((prev) => [data.session, ...prev])
        setCurrentSessionId(data.session.id)
      }
    } catch (error) {
      console.error("Failed to create default session:", error)
    }
  }

  const loadMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat-sessions/${sessionId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(
          data.messages.map((msg: any) => ({
            id: msg.id?.toString() || `msg_${Date.now()}_${Math.random()}`,
            role: msg.role,
            content: msg.content,
          })),
        )
      }
    } catch (error) {
      console.error("Failed to load messages:", error)
    }
  }

  const loadDocuments = async () => {
    try {
      const response = await fetch("/api/documents")
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents)
      }
    } catch (error) {
      console.error("Failed to load documents:", error)
    }
  }

  const createNewChat = async () => {
    try {
      const response = await fetch("/api/chat-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      })

      if (response.ok) {
        const data = await response.json()
        setChatSessions((prev) => [data.session, ...prev])
        setCurrentSessionId(data.session.id)
        setMessages([])
      }
    } catch (error) {
      console.error("Failed to create new chat:", error)
    }
  }

  const deleteChat = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    // Don't allow deleting the default session
    const session = chatSessions.find((s) => s.id === sessionId)
    if (session?.title.startsWith("Chat Principal")) {
      return
    }

    try {
      const response = await fetch(`/api/chat-sessions/${sessionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setChatSessions((prev) => prev.filter((s) => s.id !== sessionId))
        if (currentSessionId === sessionId) {
          const remaining = chatSessions.filter((s) => s.id !== sessionId)
          const defaultSession = remaining.find((s) => s.title.startsWith("Chat Principal"))
          setCurrentSessionId(defaultSession ? defaultSession.id : remaining.length > 0 ? remaining[0].id : null)
          setMessages([])
        }
      }
    } catch (error) {
      console.error("Failed to delete chat:", error)
    }
  }

  const renameChat = async (sessionId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/chat-sessions/${sessionId}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      })

      if (response.ok) {
        setChatSessions((prev) =>
          prev.map((session) => (session.id === sessionId ? { ...session, title: newTitle } : session)),
        )
      }
    } catch (error) {
      console.error("Failed to rename chat:", error)
    }
  }

  const deleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
      }
    } catch (error) {
      console.error("Failed to delete document:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !currentSessionId) return

    const userMessage: Message = {
      id: `msg_${Date.now()}_${Math.random()}`,
      role: "user",
      content: input.trim(),
    }

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Create assistant message placeholder
    const assistantMessageId = `msg_${Date.now() + 1}_${Math.random()}`
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    }

    setMessages((prev) => [...prev, assistantMessage])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSessionId,
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const jsonStr = line.slice(2)
                const data = JSON.parse(jsonStr)

                if (data.content) {
                  assistantContent += data.content

                  // Update the assistant message in real-time
                  setMessages((prev) =>
                    prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: assistantContent } : msg)),
                  )
                }
              } catch (parseError) {
                console.error("Failed to parse streaming data:", parseError)
              }
            }
          }
        }
      }

      // Reload messages to get the saved versions with proper IDs
      setTimeout(() => {
        loadMessages(currentSessionId)
      }, 500)
    } catch (error) {
      console.error("Chat error:", error)

      // Remove the failed assistant message
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId))

      // Add error message
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content: "Ne pare rău, a apărut o eroare. Te rugăm să încerci din nou.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const completedDocuments = documents.filter((d) => d.status === "completed")

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-gray-900 text-white flex flex-col">
        {/* New Chat Button */}
        <div className="p-3 flex-shrink-0">
          <Button onClick={createNewChat} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Chat History */}
        <div className="px-3 flex-shrink-0">
          <div>
            <h3 className="text-xs font-semibold text-gray-300 mb-2">Chat History</h3>
            <ScrollArea className="max-h-32">
              <div className="space-y-1">
                {chatSessions.map((session) => (
                  <ChatSessionItem
                    key={session.id}
                    session={session}
                    isActive={currentSessionId === session.id}
                    onSelect={() => setCurrentSessionId(session.id)}
                    onDelete={(e) => deleteChat(session.id, e)}
                    onRename={(newTitle) => renameChat(session.id, newTitle)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Documents List - Expandable */}
        <div className="flex-1 flex flex-col min-h-0 px-3 pt-4 border-t border-gray-700">
          <DocumentSidebarList documents={documents} onRefresh={loadDocuments} onDelete={deleteDocument} />
        </div>

        {/* Bottom Section - Fixed */}
        <div className="p-3 border-t border-gray-700 space-y-3 flex-shrink-0">
          {/* AI Services Status */}
          <div className="space-y-2">
            <OllamaStatus />
            <GeminiStatus />
          </div>

          {/* Upload Document Button */}
          <Button
            onClick={() => setShowUploadDialog(true)}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium shadow-lg border-0 transition-all duration-200 hover:shadow-xl"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Chat Inteligent</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            <span>{completedDocuments.length} documente active</span>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 bg-white">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-gray-100 rounded-full mb-6">
                  <Bot className="h-12 w-12 text-gray-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Bună! Sunt asistentul tău AI</h2>
                <p className="text-gray-600 mb-6 max-w-md">
                  Pot să răspund la întrebări bazate pe documentele tale încărcate.
                </p>

                {completedDocuments.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 max-w-2xl">
                    <p className="text-sm text-blue-800 mb-3">
                      Am identificat {completedDocuments.length} documente disponibile pentru analiză:
                    </p>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p className="font-medium">Documente disponibile:</p>
                      {completedDocuments.slice(0, 3).map((doc) => (
                        <div key={doc.id} className="bg-white/50 px-2 py-1 rounded">
                          {doc.name}
                        </div>
                      ))}
                      {completedDocuments.length > 3 && (
                        <div className="text-blue-600">+{completedDocuments.length - 3} documente</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Se gândește...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="bg-white border-t px-6 py-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pune o întrebare despre documentele tale..."
                  disabled={isLoading || !currentSessionId}
                  className="pr-12 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !input.trim() || !currentSessionId}
                className="h-12 px-6 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Scrie un mesaj pentru a începe conversația</p>
          </form>
        </div>
      </div>

      {/* Upload Dialog */}
      <DocumentUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onUploadComplete={() => {
          loadDocuments()
          setShowUploadDialog(false)
        }}
      />
    </div>
  )
}
