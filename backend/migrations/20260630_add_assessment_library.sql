-- Create boards table for educational boards
CREATE TABLE IF NOT EXISTS boards (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    code VARCHAR NOT NULL UNIQUE,
    board_type VARCHAR NOT NULL,  -- 'national', 'state', 'international', 'competitive', 'university'
    description TEXT,
    country VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class_levels table for grade levels
CREATE TABLE IF NOT EXISTS class_levels (
    id SERIAL PRIMARY KEY,
    board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    grade_level INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subjects table for subjects within class levels
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES class_levels(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    code VARCHAR,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create library_topics table for topics within subjects
CREATE TABLE IF NOT EXISTS library_topics (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    parent_topic_id INTEGER REFERENCES library_topics(id),
    
    name VARCHAR NOT NULL,
    description TEXT,
    chapter_number INTEGER,
    
    difficulty_level VARCHAR,  -- 'beginner', 'intermediate', 'advanced'
    estimated_hours INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create library_questions table for questions with full metadata
CREATE TABLE IF NOT EXISTS library_questions (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES library_topics(id) ON DELETE CASCADE,
    
    question_text TEXT NOT NULL,
    question_type VARCHAR NOT NULL,  -- 'mcq', 'true_false', 'short_answer', 'essay'
    options TEXT,  -- JSON string for MCQ options
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    
    difficulty VARCHAR NOT NULL,  -- 'easy', 'medium', 'hard'
    marks INTEGER DEFAULT 1,
    time_limit_seconds INTEGER,
    
    year INTEGER,  -- Exam year
    paper_code VARCHAR,  -- e.g., "2023_CBSE_10_041_2_3"
    source VARCHAR,  -- e.g., "CBSE Board Exam", "JEE Main"
    
    tags TEXT,  -- JSON array of tags
    concepts TEXT,  -- JSON array of concepts
    
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by INTEGER REFERENCES users(id),
    verification_date TIMESTAMP WITH TIME ZONE,
    
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_boards_code ON boards(code);
CREATE INDEX IF NOT EXISTS idx_boards_type ON boards(board_type);
CREATE INDEX IF NOT EXISTS idx_boards_active ON boards(is_active);

CREATE INDEX IF NOT EXISTS idx_class_levels_board_id ON class_levels(board_id);
CREATE INDEX IF NOT EXISTS idx_class_levels_grade ON class_levels(grade_level);

CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);

CREATE INDEX IF NOT EXISTS idx_library_topics_subject_id ON library_topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_library_topics_parent_id ON library_topics(parent_topic_id);
CREATE INDEX IF NOT EXISTS idx_library_topics_difficulty ON library_topics(difficulty_level);

CREATE INDEX IF NOT EXISTS idx_library_questions_topic_id ON library_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_library_questions_difficulty ON library_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_library_questions_type ON library_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_library_questions_source ON library_questions(source);
CREATE INDEX IF NOT EXISTS idx_library_questions_year ON library_questions(year);
CREATE INDEX IF NOT EXISTS idx_library_questions_verified ON library_questions(is_verified);

-- Create trigger to update updated_at timestamp for library_topics
CREATE OR REPLACE FUNCTION update_library_topics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_library_topics_updated_at
    BEFORE UPDATE ON library_topics
    FOR EACH ROW
    EXECUTE FUNCTION update_library_topics_updated_at();

-- Create trigger to update updated_at timestamp for library_questions
CREATE TRIGGER trigger_update_library_questions_updated_at
    BEFORE UPDATE ON library_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_library_questions_updated_at();
