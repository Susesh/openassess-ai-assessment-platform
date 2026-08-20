-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to topics table
ALTER TABLE topics ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE topics ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMP WITH TIME ZONE;

-- Add embedding columns to questions table for semantic question search
ALTER TABLE questions ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE questions ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMP WITH TIME ZONE;

-- Create index for similarity search on topics
CREATE INDEX IF NOT EXISTS idx_topics_embedding ON topics USING ivfflat (embedding vector_cosine_ops);

-- Create index for similarity search on questions
CREATE INDEX IF NOT EXISTS idx_questions_embedding ON questions USING ivfflat (embedding vector_cosine_ops);

-- Create function to update embedding timestamp
CREATE OR REPLACE FUNCTION update_embedding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.embedding_updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for embedding timestamp updates
DROP TRIGGER IF EXISTS trigger_update_topic_embedding ON topics;
CREATE TRIGGER trigger_update_topic_embedding
    BEFORE UPDATE OF embedding ON topics
    FOR EACH ROW
    EXECUTE FUNCTION update_embedding_timestamp();

DROP TRIGGER IF EXISTS trigger_update_question_embedding ON questions;
CREATE TRIGGER trigger_update_question_embedding
    BEFORE UPDATE OF embedding ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_embedding_timestamp();
