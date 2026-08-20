-- Create subtopic_certifications table for subtopic-level micro-certifications
CREATE TABLE IF NOT EXISTS subtopic_certifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    subtopic_id INTEGER NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
    
    -- Certification details
    certificate_code VARCHAR UNIQUE NOT NULL,
    verification_token VARCHAR UNIQUE NOT NULL,
    
    -- Performance metrics
    average_score FLOAT NOT NULL,
    attempts_count INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    questions_total INTEGER DEFAULT 0,
    
    -- Timestamps
    first_attempted_at TIMESTAMP WITH TIME ZONE,
    certified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Certificate metadata
    certificate_url VARCHAR,
    qr_code_url VARCHAR,
    
    -- Status
    is_active INTEGER DEFAULT 1,
    revocation_reason VARCHAR,
    revoked_at TIMESTAMP WITH TIME ZONE,
    
    -- Unique constraint to prevent duplicate certifications
    CONSTRAINT unique_user_subtopic UNIQUE (user_id, subtopic_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subtopic_certifications_user_id ON subtopic_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_subtopic_certifications_topic_id ON subtopic_certifications(topic_id);
CREATE INDEX IF NOT EXISTS idx_subtopic_certifications_subtopic_id ON subtopic_certifications(subtopic_id);
CREATE INDEX IF NOT EXISTS idx_subtopic_certifications_code ON subtopic_certifications(certificate_code);
CREATE INDEX IF NOT EXISTS idx_subtopic_certifications_token ON subtopic_certifications(verification_token);
CREATE INDEX IF NOT EXISTS idx_subtopic_certifications_active ON subtopic_certifications(is_active);
