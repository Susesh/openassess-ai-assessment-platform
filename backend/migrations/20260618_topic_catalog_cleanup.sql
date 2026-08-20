-- OpenAssess Computer Science topic catalog cleanup.
-- This project does not currently have Alembic configured, so this SQL file
-- documents the migration intent while backend/seed.py performs the safe,
-- idempotent data updates through SQLAlchemy.

-- 1. Rename legacy topic names:
--    Python -> Python Programming
--    SQL -> SQL Database

-- 2. Merge duplicate topic records by canonical topic name:
--    - Keep the lowest topic id as canonical.
--    - Move questions, attempts, and certifications to the canonical topic.
--    - Recreate subtopics under canonical topics.
--    - Delete duplicate topic rows after dependents are moved.

-- 3. Ensure the catalog contains exactly these topic names:
--    Python Programming, Java Programming, C Programming,
--    Data Structures & Algorithms, SQL Database, Web Development, React.js,
--    Node.js, Cloud Computing, DevOps, Cyber Security, Computer Networks,
--    Operating Systems, Machine Learning, Artificial Intelligence.

-- 4. Seed 4 subtopics and 10 MCQs for each topic.
