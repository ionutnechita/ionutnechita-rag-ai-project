"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DocumentUpload } from "@/components/document-upload"
import { DocumentList } from "@/components/document-list"
import { X } from "lucide-react"

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

interface DocumentUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete: () => void
}

export function DocumentUploadDialog({ open, onOpenChange, onUploadComplete }: DocumentUploadDialogProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isUploading, setIsUploading] = useState(false)

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

        // Start polling for progress updates
        pollProgress(result.documents.map((d: Document) => d.id))
      }
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const pollProgress = (documentIds: string[]) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/documents")
        if (response.ok) {
          const data = await response.json()
          const relevantDocs = data.documents.filter((doc: Document) => documentIds.includes(doc.id))

          setDocuments(relevantDocs)

          // Stop polling if all documents are completed or failed
          const allDone = relevantDocs.every((doc: Document) => doc.status === "completed" || doc.status === "failed")

          if (allDone) {
            clearInterval(interval)
            onUploadComplete()
          }
        }
      } catch (error) {
        console.error("Failed to poll progress:", error)
        clearInterval(interval)
      }
    }, 1000)

    // Cleanup after 5 minutes
    setTimeout(() => clearInterval(interval), 300000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Upload Documents
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          <DocumentUpload onUpload={handleFileUpload} isUploading={isUploading} />

          {documents.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Processing Status</h3>
              <DocumentList documents={documents} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
