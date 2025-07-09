-- Update database schema to include file metadata in embeddings table
-- Run this to update existing database

-- Add new columns to embeddings table
ALTER TABLE embeddings ADD COLUMN file_name TEXT;
ALTER TABLE embeddings ADD COLUMN file_type TEXT;
ALTER TABLE embeddings ADD COLUMN total_chunks INTEGER;

-- Create index for file_name for better search performance
CREATE INDEX IF NOT EXISTS idx_embeddings_file_name ON embeddings(file_name);

-- Update existing records (if any) with placeholder values
UPDATE embeddings 
SET file_name = 'unknown_file', file_type = 'unknown', total_chunks = 0 
WHERE file_name IS NULL;

-- Make the new columns NOT NULL after updating existing records
-- Note: SQLite doesn't support ALTER COLUMN, so we'll handle this in the application
