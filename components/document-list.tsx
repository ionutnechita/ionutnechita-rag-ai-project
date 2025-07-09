"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, File, CheckCircle, AlertCircle, Clock } from "lucide-react"

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

interface DocumentListProps {
  documents: Document[]
}

export function DocumentList({ documents }: DocumentListProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />
    if (type.includes("xml")) return <File className="h-4 w-4 text-blue-500" />
    return <File className="h-4 w-4 text-gray-500" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "processing":
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
            ✓ Completat
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">✗ Eșuat</Badge>
      case "processing":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
            ⏳ Procesare
          </Badge>
        )
      default:
        return null
    }
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">Niciun document încărcat încă</p>
        <p className="text-gray-400 text-xs mt-1">Începe prin a încărca primul document</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Documente ({documents.length})</h3>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {documents.map((doc) => (
          <Card key={doc.id} className="border border-gray-100 hover:border-gray-200 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">{getFileIcon(doc.type)}</div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{doc.name}</h4>
                    {getStatusIcon(doc.status)}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(doc.status)}
                    <Badge variant="outline" className="text-xs">
                      {doc.chunks} fragmente
                    </Badge>
                    <span className="text-xs text-gray-500">{formatFileSize(doc.size)}</span>
                  </div>

                  {doc.status === "processing" && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Creează embeddings...</span>
                        <span className="font-medium text-blue-600">{doc.progress}%</span>
                      </div>
                      <Progress value={doc.progress} className="h-2" />
                    </div>
                  )}

                  {doc.status === "completed" && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Gata pentru căutare semantică</span>
                    </div>
                  )}

                  {doc.status === "failed" && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      <span>Eroare la procesare - încearcă din nou</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
