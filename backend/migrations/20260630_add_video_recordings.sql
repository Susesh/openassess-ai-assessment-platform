-- Create video_recordings table for assessment session recordings
CREATE TABLE IF NOT EXISTS video_recordings (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER NOT NULL UNIQUE REFERENCES attempts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Recording metadata
    recording_type VARCHAR NOT NULL,  -- 'camera', 'screen', 'combined'
    file_path VARCHAR,
    cloud_storage_url VARCHAR,
    file_size_bytes INTEGER,
    duration_seconds FLOAT,
    
    -- Recording status
    status VARCHAR DEFAULT 'pending',  -- 'pending', 'recording', 'processing', 'completed', 'failed'
    started_at TIMESTAMP WITH TIME ZONE,
    stopped_at TIMESTAMP WITH TIME ZONE,
    uploaded_at TIMESTAMP WITH TIME ZONE,
    
    -- Quality metrics
    resolution VARCHAR,  -- e.g., '1280x720'
    frame_rate INTEGER,  -- e.g., 30
    bitrate_kbps INTEGER,
    
    -- Processing info
    processing_error VARCHAR,
    thumbnail_url VARCHAR,
    
    -- Access control
    is_public BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on attempt_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_video_recordings_attempt_id ON video_recordings(attempt_id);
CREATE INDEX IF NOT EXISTS idx_video_recordings_user_id ON video_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_video_recordings_status ON video_recordings(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_recordings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_recordings_updated_at
    BEFORE UPDATE ON video_recordings
    FOR EACH ROW
    EXECUTE FUNCTION update_video_recordings_updated_at();
