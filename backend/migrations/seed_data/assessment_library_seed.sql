-- Seed data for Assessment Library
-- This file populates the assessment library with common Indian educational boards

-- Insert Boards
INSERT INTO boards (name, code, board_type, description, country, is_active) VALUES
('CBSE', 'CBSE', 'national', 'Central Board of Secondary Education', 'India', TRUE),
('ICSE', 'ICSE', 'national', 'Indian Certificate of Secondary Education', 'India', TRUE),
('Karnataka State Board', 'KA_STATE', 'state', 'Karnataka Secondary Education Examination Board', 'India', TRUE),
('Maharashtra State Board', 'MH_STATE', 'state', 'Maharashtra State Board of Secondary and Higher Secondary Education', 'India', TRUE),
('Tamil Nadu State Board', 'TN_STATE', 'state', 'Tamil Nadu State Board of School Examination', 'India', TRUE),
('JEE Main', 'JEE_MAIN', 'competitive', 'Joint Entrance Examination Main', 'India', TRUE),
('JEE Advanced', 'JEE_ADV', 'competitive', 'Joint Entrance Examination Advanced', 'India', TRUE),
('NEET', 'NEET', 'competitive', 'National Eligibility cum Entrance Test', 'India', TRUE),
('IB', 'IB', 'international', 'International Baccalaureate', 'International', TRUE),
('Cambridge IGCSE', 'CIE', 'international', 'Cambridge International General Certificate of Secondary Education', 'International', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Insert Class Levels for CBSE
INSERT INTO class_levels (board_id, name, grade_level, description, is_active)
SELECT id, 'Class 10', 10, 'Secondary School Examination', TRUE FROM boards WHERE code = 'CBSE'
ON CONFLICT DO NOTHING;

INSERT INTO class_levels (board_id, name, grade_level, description, is_active)
SELECT id, 'Class 12', 12, 'Higher Secondary Examination', TRUE FROM boards WHERE code = 'CBSE'
ON CONFLICT DO NOTHING;

-- Insert Class Levels for ICSE
INSERT INTO class_levels (board_id, name, grade_level, description, is_active)
SELECT id, 'Class 10', 10, 'Indian Certificate of Secondary Education', TRUE FROM boards WHERE code = 'ICSE'
ON CONFLICT DO NOTHING;

INSERT INTO class_levels (board_id, name, grade_level, description, is_active)
SELECT id, 'Class 12', 12, 'Indian School Certificate', TRUE FROM boards WHERE code = 'ICSE'
ON CONFLICT DO NOTHING;

-- Insert Class Levels for Karnataka State Board
INSERT INTO class_levels (board_id, name, grade_level, description, is_active)
SELECT id, 'Class 10 (SSLC)', 10, 'Secondary School Leaving Certificate', TRUE FROM boards WHERE code = 'KA_STATE'
ON CONFLICT DO NOTHING;

INSERT INTO class_levels (board_id, name, grade_level, description, is_active)
SELECT id, 'Class 12 (PUC)', 12, 'Pre-University Course', TRUE FROM boards WHERE code = 'KA_STATE'
ON CONFLICT DO NOTHING;

-- Insert Class Levels for Competitive Exams
INSERT INTO class_levels (board_id, name, grade_level, description, is_active)
SELECT id, 'JEE Main', 12, 'Engineering Entrance Examination', TRUE FROM boards WHERE code = 'JEE_MAIN'
ON CONFLICT DO NOTHING;

INSERT INTO class_levels (board_id, name, grade_level, description, is_active)
SELECT id, 'JEE Advanced', 12, 'Advanced Engineering Entrance Examination', TRUE FROM boards WHERE code = 'JEE_ADV'
ON CONFLICT DO NOTHING;

INSERT INTO class_levels (board_id, name, grade_level, description, is_active)
SELECT id, 'NEET', 12, 'Medical Entrance Examination', TRUE FROM boards WHERE code = 'NEET'
ON CONFLICT DO NOTHING;

-- Insert Subjects for CBSE Class 10
INSERT INTO subjects (class_id, name, code, description, is_active)
SELECT cl.id, 'Mathematics', 'MATH', 'Mathematics for Class 10', TRUE
FROM class_levels cl
JOIN boards b ON cl.board_id = b.id
WHERE b.code = 'CBSE' AND cl.name = 'Class 10'
ON CONFLICT DO NOTHING;

INSERT INTO subjects (class_id, name, code, description, is_active)
SELECT cl.id, 'Science', 'SCI', 'Science for Class 10', TRUE
FROM class_levels cl
JOIN boards b ON cl.board_id = b.id
WHERE b.code = 'CBSE' AND cl.name = 'Class 10'
ON CONFLICT DO NOTHING;

INSERT INTO subjects (class_id, name, code, description, is_active)
SELECT cl.id, 'Social Science', 'SST', 'Social Science for Class 10', TRUE
FROM class_levels cl
JOIN boards b ON cl.board_id = b.id
WHERE b.code = 'CBSE' AND cl.name = 'Class 10'
ON CONFLICT DO NOTHING;

-- Insert Subjects for CBSE Class 12
INSERT INTO subjects (class_id, name, code, description, is_active)
SELECT cl.id, 'Physics', 'PHY', 'Physics for Class 12', TRUE
FROM class_levels cl
JOIN boards b ON cl.board_id = b.id
WHERE b.code = 'CBSE' AND cl.name = 'Class 12'
ON CONFLICT DO NOTHING;

INSERT INTO subjects (class_id, name, code, description, is_active)
SELECT cl.id, 'Chemistry', 'CHEM', 'Chemistry for Class 12', TRUE
FROM class_levels cl
JOIN boards b ON cl.board_id = b.id
WHERE b.code = 'CBSE' AND cl.name = 'Class 12'
ON CONFLICT DO NOTHING;

INSERT INTO subjects (class_id, name, code, description, is_active)
SELECT cl.id, 'Mathematics', 'MATH', 'Mathematics for Class 12', TRUE
FROM class_levels cl
JOIN boards b ON cl.board_id = b.id
WHERE b.code = 'CBSE' AND cl.name = 'Class 12'
ON CONFLICT DO NOTHING;

INSERT INTO subjects (class_id, name, code, description, is_active)
SELECT cl.id, 'Biology', 'BIO', 'Biology for Class 12', TRUE
FROM class_levels cl
JOIN boards b ON cl.board_id = b.id
WHERE b.code = 'CBSE' AND cl.name = 'Class 12'
ON CONFLICT DO NOTHING;

-- Insert Subjects for JEE Main
INSERT INTO subjects (class_id, name, code, description, is_active)
SELECT cl.id, 'Physics', 'PHY', 'Physics for JEE Main', TRUE
FROM class_levels cl
JOIN boards b ON cl.board_id = b.id
WHERE b.code = 'JEE_MAIN'
ON CONFLICT DO NOTHING;

INSERT INTO subjects (class_id, name, code, description, is_active)
SELECT cl.id, 'Chemistry', 'CHEM', 'Chemistry for JEE Main', TRUE
FROM class_levels cl
JOIN boards b ON cl.board_id = b.id
WHERE b.code = 'JEE_MAIN'
ON CONFLICT DO NOTHING;

INSERT INTO subjects (class_id, name, code, description, is_active)
SELECT cl.id, 'Mathematics', 'MATH', 'Mathematics for JEE Main', TRUE
FROM class_levels cl
JOIN boards b ON cl.board_id = b.id
WHERE b.code = 'JEE_MAIN'
ON CONFLICT DO NOTHING;

-- Insert Subjects for NEET
INSERT INTO subjects (class_id, name, code, description, is_active)
SELECT cl.id, 'Physics', 'PHY', 'Physics for NEET', TRUE
FROM class_levels cl
JOIN boards b ON cl.board_id = b.id
WHERE b.code = 'NEET'
ON CONFLICT DO NOTHING;

INSERT INTO subjects (class_id, name, code, description, is_active)
SELECT cl.id, 'Chemistry', 'CHEM', 'Chemistry for NEET', TRUE
FROM class_levels cl
JOIN boards b ON cl.board_id = b.id
WHERE b.code = 'NEET'
ON CONFLICT DO NOTHING;

INSERT INTO subjects (class_id, name, code, description, is_active)
SELECT cl.id, 'Biology', 'BIO', 'Biology for NEET', TRUE
FROM class_levels cl
JOIN boards b ON cl.board_id = b.id
WHERE b.code = 'NEET'
ON CONFLICT DO NOTHING;
