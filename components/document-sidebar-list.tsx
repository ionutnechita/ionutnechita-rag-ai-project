"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, File, CheckCircle, AlertCircle, Clock, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

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

interface DocumentSidebarListProps {
  documents: Document[]
  onRefresh?: () => void
  onDelete?: (documentId: string) => void
}

export function DocumentSidebarList({ documents, onRefresh, onDelete }: DocumentSidebarListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
    if (type.includes("xml")) return <File className="h-4 w-4 text-blue-500 flex-shrink-0" />
    return <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
      case "failed":
        return <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
      case "processing":
        return <Clock className="h-3 w-3 text-blue-500 animate-pulse flex-shrink-0" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-600 text-white text-[10px] px-1 py-0 flex-shrink-0">
            ✓
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive" className="text-[10px] px-1 py-0 flex-shrink-0">
            ✗
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="secondary" className="bg-blue-600 text-white text-[10px] px-1 py-0 flex-shrink-0">
            ⏳
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleDelete = async (documentId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onDelete) return

    setDeletingId(documentId)
    try {
      await onDelete(documentId)
    } finally {
      setDeletingId(null)
    }
  }

  const truncateFileName = (fileName: string, maxLength = 25) => {
    if (fileName.length <= maxLength) return fileName

    const extension = fileName.split(".").pop()
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf("."))
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4) + "..."

    return `${truncatedName}.${extension}`
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="p-2 bg-gray-800 rounded-full w-8 h-8 mx-auto mb-2 flex items-center justify-center">
          <FileText className="h-4 w-4 text-gray-500" />
        </div>
        <p className="text-gray-400 text-xs">Niciun document</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-gray-300">Documente ({documents.length})</h3>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} className="h-5 w-5 p-0 hover:bg-gray-800 text-gray-400">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-2">
          {documents.map((doc) => (
            <Card key={doc.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors group">
              <CardContent className="p-3">
                <div className="space-y-2">
                  {/* Header with icon and name */}
                  <div className="flex items-start gap-2">
                    <div className="mt-1">{getFileIcon(doc.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white leading-tight break-words" title={doc.name}>
                        {truncateFileName(doc.name)}
                      </h4>
                    </div>
                  </div>

                  {/* Status and actions row */}
                  <div className="flex items-center justify-between gap-2 ml-6">
                    <div className="flex items-center gap-1">{getStatusBadge(doc.status)}</div>
                    <div className="flex items-center gap-1">
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(doc.id, e)}
                          disabled={deletingId === doc.id}
                          className="opacity-0 group-hover:opacity-100 h-5 w-5 p-0 hover:bg-red-600 hover:text-white transition-all text-gray-300"
                        >
                          {deletingId === doc.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* File info */}
                  <div className="flex items-center justify-between text-xs text-gray-400 ml-6">
                    <span>{formatFileSize(doc.size)}</span>
                    <span>{doc.chunks} fragmente</span>
                  </div>

                  {/* Progress bar for processing files */}
                  {doc.status === "processing" && (
                    <div className="space-y-1 ml-6">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Procesare...</span>
                        <span>{doc.progress}%</span>
                      </div>
                      <Progress value={doc.progress} className="h-1" />
                    </div>
                  )}

                  {/* Status message */}
                  <div className="flex items-center gap-1 text-xs ml-6">
                    {getStatusIcon(doc.status)}
                    <span
                      className={
                        doc.status === "completed"
                          ? "text-green-400"
                          : doc.status === "failed"
                            ? "text-red-400"
                            : "text-blue-400"
                      }
                    >
                      {doc.status === "completed" && "Gata pentru căutare"}
                      {doc.status === "failed" && "Eroare la procesare"}
                      {doc.status === "processing" && "Se procesează..."}
                    </span>
                  </div>

                  {/* Upload date */}
                  <div className="text-xs text-gray-500 ml-6">{formatDate(doc.createdAt)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
