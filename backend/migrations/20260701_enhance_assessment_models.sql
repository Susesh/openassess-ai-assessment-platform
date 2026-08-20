-- Add new columns to questions table for enhanced question type support
ALTER TABLE questions 
ALTER COLUMN text TYPE TEXT,
ALTER COLUMN options TYPE JSONB USING options::jsonb,
ALTER COLUMN correct_option DROP NOT NULL,
ALTER COLUMN explanation TYPE TEXT USING explanation::text,
ADD COLUMN IF NOT EXISTS correct_options JSONB,
ADD COLUMN IF NOT EXISTS marks FLOAT DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER,
ADD COLUMN IF NOT EXISTS case_study_text TEXT,
ADD COLUMN IF NOT EXISTS assertion_statement TEXT,
ADD COLUMN IF NOT EXISTS reason_statement TEXT;

-- Add new columns to attempts table for enhanced tracking
ALTER TABLE attempts
ADD COLUMN IF NOT EXISTS question_status JSONB,
ADD COLUMN IF NOT EXISTS marked_for_review JSONB,
ADD COLUMN IF NOT EXISTS proctoring_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS video_recording_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS integrity_score FLOAT,
ADD COLUMN IF NOT EXISTS proctoring_violations_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_marks ON questions(marks);
CREATE INDEX IF NOT EXISTS idx_attempts_proctoring ON attempts(proctoring_enabled);
CREATE INDEX IF NOT EXISTS idx_attempts_video ON attempts(video_recording_enabled);
