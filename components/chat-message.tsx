"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Bot, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("flex gap-4 group", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-8 w-8 border-2 border-blue-100">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex flex-col gap-2 max-w-[80%]", isUser ? "items-end" : "items-start")}>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-medium">{isUser ? "Tu" : "Gemini AI"}</span>
          <span>•</span>
          <span>{new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>

        <Card
          className={cn(
            "shadow-sm border-0 relative group-hover:shadow-md transition-shadow",
            isUser ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white" : "bg-white border border-gray-100",
          )}
        >
          <CardContent className="p-4">
            <div className={cn("text-sm leading-relaxed", isUser ? "text-white" : "text-gray-800")}>
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
            </div>

            {!isUser && (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-gray-100"
              >
                {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-gray-500" />}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 border-2 border-gray-200">
          <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
