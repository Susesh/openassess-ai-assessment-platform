-- Create organizations table for employer/university verification
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    organization_type VARCHAR NOT NULL,  -- 'employer', 'university', 'recruitment_agency'
    
    -- Contact information
    email VARCHAR NOT NULL UNIQUE,
    phone VARCHAR,
    website VARCHAR,
    address TEXT,
    
    -- Authentication
    api_key VARCHAR UNIQUE NOT NULL,
    api_key_hash VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Rate limiting
    rate_limit_per_hour INTEGER DEFAULT 100,
    rate_limit_per_day INTEGER DEFAULT 1000,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    last_api_call TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    verification_document_url VARCHAR,
    notes TEXT
);

-- Create verification_logs table for audit trail
CREATE TABLE IF NOT EXISTS verification_logs (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Verification details
    verification_type VARCHAR NOT NULL,  -- 'topic_certification', 'subtopic_certification', 'portfolio'
    certificate_id INTEGER,
    verification_token VARCHAR,
    
    -- Result
    is_valid BOOLEAN NOT NULL,
    verification_data TEXT,
    
    -- Request metadata
    ip_address VARCHAR,
    user_agent VARCHAR,
    request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Response time
    response_time_ms INTEGER
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_email ON organizations(email);
CREATE INDEX IF NOT EXISTS idx_organizations_api_key ON organizations(api_key);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(organization_type);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_verified ON organizations(is_verified);

CREATE INDEX IF NOT EXISTS idx_verification_logs_org_id ON verification_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_user_id ON verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_type ON verification_logs(verification_type);
CREATE INDEX IF NOT EXISTS idx_verification_logs_timestamp ON verification_logs(request_timestamp);
CREATE INDEX IF NOT EXISTS idx_verification_logs_token ON verification_logs(verification_token);
