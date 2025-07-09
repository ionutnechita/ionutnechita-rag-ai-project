"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, File } from "lucide-react"
import { cn } from "@/lib/utils"

interface DocumentUploadProps {
  onUpload: (files: FileList) => void
  isUploading: boolean
}

export function DocumentUpload({ onUpload, isUploading }: DocumentUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const fileList = new DataTransfer()
      acceptedFiles.forEach((file) => fileList.items.add(file))
      onUpload(fileList.files)
    },
    [onUpload],
  )

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/xml": [".xml"],
      "text/xml": [".xml"],
      "text/plain": [".txt"],
    },
    multiple: true,
  })

  const getFileIcon = (file: File) => {
    if (file.type.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />
    if (file.type.includes("xml")) return <File className="h-4 w-4 text-blue-500" />
    return <File className="h-4 w-4 text-gray-500" />
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-blue-500 bg-blue-50 scale-105"
            : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50",
          isUploading && "opacity-50 cursor-not-allowed scale-100",
        )}
      >
        <input {...getInputProps()} disabled={isUploading} />
        <div className="flex flex-col items-center gap-3">
          <div className={cn("p-3 rounded-full transition-colors", isDragActive ? "bg-blue-100" : "bg-gray-100")}>
            <Upload className={cn("h-6 w-6", isDragActive ? "text-blue-600" : "text-gray-500")} />
          </div>
          <div className="space-y-1">
            {isDragActive ? (
              <p className="font-medium text-blue-600">Eliberează fișierele aici</p>
            ) : (
              <div>
                <p className="font-medium text-gray-700">Trage și eliberează fișierele</p>
                <p className="text-sm text-gray-500">sau click pentru a selecta</p>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <span>PDF</span>
              <span>•</span>
              <span>XML</span>
              <span>•</span>
              <span>TXT</span>
            </div>
          </div>
          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="font-medium">Se procesează...</span>
            </div>
          )}
        </div>
      </div>

      {acceptedFiles.length > 0 && !isUploading && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Fișiere selectate:</p>
          {acceptedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              {getFileIcon(file)}
              <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
              <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
