import { readFile } from "fs/promises"
import { PDFExtract } from "pdf.js-extract"
import * as xml2js from "xml2js"

export interface ProcessedChunk {
  content: string
  metadata: {
    fileName: string
    fileType: string
    chunkIndex: number
    totalChunks: number
    source: string
  }
}

export async function processDocument(filePath: string, mimeType: string, fileName: string): Promise<ProcessedChunk[]> {
  let content = ""

  try {
    if (mimeType === "application/pdf") {
      content = await extractPDFText(filePath)
    } else if (mimeType.includes("xml")) {
      content = await extractXMLText(filePath)
    } else if (mimeType === "text/plain") {
      content = await readFile(filePath, "utf-8")
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`)
    }

    // Split content into chunks with metadata
    const textChunks = splitIntoChunks(content, 1000, 200)

    return textChunks.map((chunk, index) => ({
      content: `[Sursă: ${fileName}]\n\n${chunk}`,
      metadata: {
        fileName,
        fileType: mimeType,
        chunkIndex: index,
        totalChunks: textChunks.length,
        source: fileName,
      },
    }))
  } catch (error) {
    console.error("Document processing error:", error)
    throw error
  }
}

async function extractPDFText(filePath: string): Promise<string> {
  const pdfExtract = new PDFExtract()
  return new Promise((resolve, reject) => {
    pdfExtract.extract(filePath, {}, (err, data) => {
      if (err) {
        reject(err)
        return
      }

      const text = data?.pages?.map((page) => page.content?.map((item) => item.str).join(" ")).join("\n") || ""

      resolve(text)
    })
  })
}

async function extractXMLText(filePath: string): Promise<string> {
  const xmlContent = await readFile(filePath, "utf-8")
  const parser = new xml2js.Parser()

  return new Promise((resolve, reject) => {
    parser.parseString(xmlContent, (err, result) => {
      if (err) {
        reject(err)
        return
      }

      // Extract text content from XML
      const text = extractTextFromXMLObject(result)
      resolve(text)
    })
  })
}

function extractTextFromXMLObject(obj: any): string {
  let text = ""

  if (typeof obj === "string") {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => extractTextFromXMLObject(item)).join(" ")
  }

  if (typeof obj === "object" && obj !== null) {
    for (const key in obj) {
      if (key !== "$") {
        // Skip XML attributes
        text += extractTextFromXMLObject(obj[key]) + " "
      }
    }
  }

  return text.trim()
}

function splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = []
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)

  let currentChunk = ""
  let currentSize = 0

  for (const sentence of sentences) {
    const sentenceLength = sentence.length

    if (currentSize + sentenceLength > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())

      // Create overlap
      const words = currentChunk.split(" ")
      const overlapWords = words.slice(-Math.floor(overlap / 10))
      currentChunk = overlapWords.join(" ") + " " + sentence
      currentSize = currentChunk.length
    } else {
      currentChunk += sentence + ". "
      currentSize += sentenceLength
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}
