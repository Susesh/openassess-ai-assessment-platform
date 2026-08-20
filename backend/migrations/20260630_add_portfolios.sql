-- Create portfolios table for knowledge portfolios
CREATE TABLE IF NOT EXISTS portfolios (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Portfolio metadata
    title VARCHAR DEFAULT 'My Knowledge Portfolio',
    summary TEXT,
    skills_summary TEXT,
    
    -- Public sharing
    is_public BOOLEAN DEFAULT FALSE,
    public_slug VARCHAR UNIQUE,
    share_token VARCHAR UNIQUE,
    
    -- Portfolio content (cached)
    portfolio_data JSONB,
    
    -- PDF generation
    pdf_url VARCHAR,
    pdf_generated_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0
);

-- Create portfolio_shares table for tracking shares
CREATE TABLE IF NOT EXISTS portfolio_shares (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    
    -- Share details
    share_type VARCHAR NOT NULL,  -- 'public', 'private_link', 'email'
    share_token VARCHAR UNIQUE,
    recipient_email VARCHAR,
    
    --Access control
    expires_at TIMESTAMP WITH TIME ZONE,
    max_views INTEGER,
    view_count INTEGER DEFAULT 0,
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create portfolio_views table for analytics
CREATE TABLE IF NOT EXISTS portfolio_views (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    
    -- Viewer information
    viewer_ip VARCHAR,
    viewer_user_agent VARCHAR,
    referrer VARCHAR,
    
    -- Share context
    share_id INTEGER REFERENCES portfolio_shares(id),
    
    -- Timestamp
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_public_slug ON portfolios(public_slug);
CREATE INDEX IF NOT EXISTS idx_portfolios_share_token ON portfolios(share_token);
CREATE INDEX IF NOT EXISTS idx_portfolios_is_public ON portfolios(is_public);

CREATE INDEX IF NOT EXISTS idx_portfolio_shares_portfolio_id ON portfolio_shares(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_shares_token ON portfolio_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_portfolio_shares_active ON portfolio_shares(is_active);

CREATE INDEX IF NOT EXISTS idx_portfolio_views_portfolio_id ON portfolio_views(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_views_share_id ON portfolio_views(share_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_views_timestamp ON portfolio_views(viewed_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_portfolios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_portfolios_updated_at
    BEFORE UPDATE ON portfolios
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolios_updated_at();
