// Constants for AI models and configuration
export const AI_MODELS = {
  GEMINI: {
    CHAT: "gemini-2.5-flash",
    EMBEDDING: "gemini-embedding-exp-03-07", // For future use if needed
  },
  OLLAMA: {
    EMBEDDING: "nomic-embed-text",
  },
} as const

export const API_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  MAX_DURATION: 30,
} as const

export const UI_CONFIG = {
  SIDEBAR_WIDTH: "320px",
  CHAT_INPUT_HEIGHT: "48px",
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
} as const
