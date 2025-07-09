"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Edit2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatSessionItemProps {
  session: {
    id: string
    title: string
    createdAt: string
    updatedAt: string
  }
  isActive: boolean
  onSelect: () => void
  onDelete: (e: React.MouseEvent) => void
  onRename: (newTitle: string) => void
}

export function ChatSessionItem({ session, isActive, onSelect, onDelete, onRename }: ChatSessionItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(session.title)

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditTitle(session.title)
  }

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle !== session.title) {
      onRename(editTitle.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditTitle(session.title)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit()
    } else if (e.key === "Escape") {
      handleCancelEdit()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 p-2 bg-gray-800 rounded">
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-6 text-xs bg-gray-700 border-gray-600 text-white"
          autoFocus
          onBlur={handleSaveEdit}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSaveEdit}
          className="h-6 w-6 p-0 hover:bg-gray-700 text-green-400"
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancelEdit}
          className="h-6 w-6 p-0 hover:bg-gray-700 text-red-400"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-800 transition-colors",
        isActive ? "bg-gray-800" : "",
      )}
    >
      <span className="text-sm truncate flex-1">{session.title}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStartEdit}
          className="h-6 w-6 p-0 hover:bg-gray-700 text-gray-400 hover:text-white"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-6 w-6 p-0 hover:bg-gray-700 text-gray-400 hover:text-red-400"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
