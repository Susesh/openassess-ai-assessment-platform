-- Create ai_violations table for AI-detected proctoring violations
CREATE TABLE IF NOT EXISTS ai_violations (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Violation type and severity
    violation_type VARCHAR NOT NULL,
    severity VARCHAR NOT NULL,
    confidence_score FLOAT,
    
    -- Detection details
    detection_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    frame_timestamp FLOAT,
    screenshot_path VARCHAR,
    
    -- Specific violation data
    violation_data JSONB,
    
    -- Context
    question_id INTEGER REFERENCES questions(id),
    session_time_seconds INTEGER,
    
    -- Resolution
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by VARCHAR,
    resolution_notes VARCHAR,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create proctoring_sessions table for overall AI proctoring tracking
CREATE TABLE IF NOT EXISTS proctoring_sessions (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER NOT NULL UNIQUE REFERENCES attempts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session status
    status VARCHAR DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Overall integrity score
    integrity_score FLOAT DEFAULT 100.0,
    violation_count INTEGER DEFAULT 0,
    high_severity_count INTEGER DEFAULT 0,
    critical_severity_count INTEGER DEFAULT 0,
    
    -- Face tracking
    face_detected_count INTEGER DEFAULT 0,
    face_not_detected_count INTEGER DEFAULT 0,
    multiple_face_detected_count INTEGER DEFAULT 0,
    
    -- Eye tracking
    eye_tracking_enabled BOOLEAN DEFAULT TRUE,
    eye_movement_violations INTEGER DEFAULT 0,
    
    -- Head pose
    head_pose_violations INTEGER DEFAULT 0,
    
    -- Audio
    audio_enabled BOOLEAN DEFAULT TRUE,
    audio_violations INTEGER DEFAULT 0,
    
    -- Environment
    tab_switch_count INTEGER DEFAULT 0,
    fullscreen_exit_count INTEGER DEFAULT 0,
    copy_paste_count INTEGER DEFAULT 0,
    phone_detected_count INTEGER DEFAULT 0,
    
    -- Final decision
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason VARCHAR,
    auto_submit_triggered BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    proctoring_version VARCHAR DEFAULT '1.0',
    ai_models_used JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_violations_attempt_id ON ai_violations(attempt_id);
CREATE INDEX IF NOT EXISTS idx_ai_violations_user_id ON ai_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_violations_type ON ai_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_ai_violations_severity ON ai_violations(severity);
CREATE INDEX IF NOT EXISTS idx_ai_violations_timestamp ON ai_violations(detection_timestamp);

CREATE INDEX IF NOT EXISTS idx_proctoring_sessions_attempt_id ON proctoring_sessions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_sessions_user_id ON proctoring_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_sessions_status ON proctoring_sessions(status);
CREATE INDEX IF NOT EXISTS idx_proctoring_sessions_flagged ON proctoring_sessions(is_flagged);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_proctoring_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_proctoring_sessions_updated_at
    BEFORE UPDATE ON proctoring_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_proctoring_sessions_updated_at();
