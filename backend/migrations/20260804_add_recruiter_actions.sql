-- Add recruiter action fields to attempts table
ALTER TABLE attempts 
ADD COLUMN is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN is_disqualified BOOLEAN DEFAULT FALSE,
ADD COLUMN recruiter_notes VARCHAR(500),
ADD COLUMN recruiter_action VARCHAR(50),
ADD COLUMN recruiter_action_at TIMESTAMP;
