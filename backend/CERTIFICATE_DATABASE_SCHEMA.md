# Certificate Database Schema

## Overview

This document describes the database schema for the OpenAssess certificate system, including table structure, relationships, and migration instructions.

---

## Certificates Table

### Table Definition

```sql
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    certificate_id VARCHAR UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    topic_id INTEGER NOT NULL REFERENCES topics(id),
    certificate_type VARCHAR NOT NULL DEFAULT 'participation',
    score INTEGER NOT NULL,
    percentage FLOAT NOT NULL,
    issued_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    pdf_url VARCHAR
);
```

### Column Definitions

| Column | Type | Constraints | Description |
|--------|------|-----------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier for each certificate record |
| certificate_id | VARCHAR | UNIQUE, NOT NULL | Human-readable certificate number (e.g., OA-2026-ABC123) |
| user_id | INTEGER | NOT NULL, FK(users) | Reference to student who earned the certificate |
| topic_id | INTEGER | NOT NULL, FK(topics) | Reference to assessment topic |
| certificate_type | VARCHAR | NOT NULL, DEFAULT 'participation' | Type: "participation" or "achievement" |
| score | INTEGER | NOT NULL | Number of questions answered correctly |
| percentage | FLOAT | NOT NULL | Score as percentage (0-100) |
| issued_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | When certificate was generated |
| pdf_url | VARCHAR | NULLABLE | Optional URL/path to generated PDF file |

---

## Relationships

### Foreign Keys

```
certificates.user_id → users.id
  - Relationship: Many certificates to One user
  - Cascade: ON DELETE CASCADE (delete certs when user deleted)

certificates.topic_id → topics.id
  - Relationship: Many certificates to One topic
  - Cascade: ON DELETE CASCADE (delete certs when topic deleted)
```

### ER Diagram

```
┌─────────────────┐
│      users      │
├─────────────────┤
│ id (PK)         │
│ full_name       │
│ email           │
│ created_at      │
└────────┬────────┘
         │ 1:N
         │
┌────────▼────────────────────┐
│     certificates            │
├─────────────────────────────┤
│ id (PK)                     │
│ certificate_id (UNIQUE)     │
│ user_id (FK → users)        │
│ topic_id (FK → topics)      │
│ certificate_type            │
│ score                       │
│ percentage                  │
│ issued_at                   │
│ pdf_url                     │
└────────┬────────────────────┘
         │ N:1
         │
┌────────▼────────┐
│     topics      │
├─────────────────┤
│ id (PK)         │
│ name            │
│ description     │
└─────────────────┘
```

---

## Indexes

### Recommended Indexes

```sql
-- For fast lookup by user
CREATE INDEX idx_certificates_user_id 
ON certificates(user_id);

-- For fast lookup by topic
CREATE INDEX idx_certificates_topic_id 
ON certificates(topic_id);

-- For verifying certificate IDs
CREATE INDEX idx_certificates_id 
ON certificates(certificate_id);

-- For time-based queries
CREATE INDEX idx_certificates_issued_at 
ON certificates(issued_at DESC);

-- For filtering by type
CREATE INDEX idx_certificates_type 
ON certificates(certificate_type);

-- Composite index for user + type queries
CREATE INDEX idx_certificates_user_type 
ON certificates(user_id, certificate_type);

-- Composite index for user + date queries
CREATE INDEX idx_certificates_user_date 
ON certificates(user_id, issued_at DESC);
```

### Query Performance

With these indexes:
- List user's certificates: O(log N)
- Filter by certificate type: O(log N)
- Get certificates by date range: O(log N + K)

---

## Certificate Type Values

### Allowed Values

```
'participation' - Generated for every completed assessment
'achievement'   - Generated when score >= 70%
```

### Enum-style Constraint (Optional)

For databases supporting enums:

```sql
CREATE TYPE certificate_type_enum AS ENUM ('participation', 'achievement');

CREATE TABLE certificates (
    ...
    certificate_type certificate_type_enum NOT NULL DEFAULT 'participation',
    ...
);
```

For PostgreSQL:

```sql
ALTER TABLE certificates 
ALTER COLUMN certificate_type TYPE certificate_type_enum 
USING certificate_type::certificate_type_enum;
```

---

## Data Integrity Constraints

### Check Constraints

```sql
-- Ensure percentage is between 0 and 100
ALTER TABLE certificates 
ADD CONSTRAINT check_percentage_range 
CHECK (percentage >= 0 AND percentage <= 100);

-- Ensure score is not negative
ALTER TABLE certificates 
ADD CONSTRAINT check_score_non_negative 
CHECK (score >= 0);

-- Ensure certificate_type is valid
ALTER TABLE certificates 
ADD CONSTRAINT check_certificate_type 
CHECK (certificate_type IN ('participation', 'achievement'));
```

### Default Constraints

```sql
-- Ensure achievement certificates have score >= 70%
-- Note: This is enforced in application layer, not database
-- Reason: Percentage calculation depends on total questions

-- Ensure issued_at is not in future
ALTER TABLE certificates 
ADD CONSTRAINT check_issued_at 
CHECK (issued_at <= NOW());
```

---

## Migration Scripts

### Initial Schema Creation

```sql
-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id SERIAL PRIMARY KEY,
    certificate_id VARCHAR UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    certificate_type VARCHAR NOT NULL DEFAULT 'participation',
    score INTEGER NOT NULL,
    percentage FLOAT NOT NULL,
    issued_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    pdf_url VARCHAR
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_topic_id ON certificates(topic_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id ON certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_certificates_type ON certificates(certificate_type);
CREATE INDEX IF NOT EXISTS idx_certificates_user_type ON certificates(user_id, certificate_type);
```

### Upgrade from Previous Version

If upgrading from single-certificate system:

```sql
-- Add certificate_type column if missing
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS certificate_type VARCHAR 
DEFAULT 'participation' NOT NULL;

-- Set all existing certificates to 'participation' type
UPDATE certificates 
SET certificate_type = 'participation' 
WHERE certificate_type IS NULL;

-- Create indexes if missing
CREATE INDEX IF NOT EXISTS idx_certificates_type ON certificates(certificate_type);
CREATE INDEX IF NOT EXISTS idx_certificates_user_type ON certificates(user_id, certificate_type);
```

### Backfill Achievement Certificates (Optional)

To create achievement certificates for past assessments with score >= 70%:

```sql
INSERT INTO certificates (
    certificate_id, 
    user_id, 
    topic_id, 
    certificate_type, 
    score, 
    percentage, 
    issued_at
)
SELECT 
    'OA-' || EXTRACT(YEAR FROM c.issued_at)::TEXT || '-' || 
    UPPER(SUBSTRING(MD5(c.id::TEXT || NOW()::TEXT), 1, 6)),
    c.user_id,
    c.topic_id,
    'achievement',
    c.score,
    c.percentage,
    c.issued_at + INTERVAL '1 second'  -- Slight offset to distinguish from participation
FROM certificates c
WHERE c.percentage >= 70 
  AND c.certificate_type = 'participation'
  AND NOT EXISTS (
    SELECT 1 FROM certificates c2 
    WHERE c2.user_id = c.user_id 
      AND c2.topic_id = c.topic_id
      AND c2.certificate_type = 'achievement'
      AND DATE(c2.issued_at) = DATE(c.issued_at)
  );
```

---

## Queries

### Common Queries

**1. Get all certificates for a user**
```sql
SELECT * FROM certificates 
WHERE user_id = $1 
ORDER BY issued_at DESC;
```

**2. Get participation certificates only**
```sql
SELECT * FROM certificates 
WHERE user_id = $1 AND certificate_type = 'participation'
ORDER BY issued_at DESC;
```

**3. Get achievement certificates only**
```sql
SELECT * FROM certificates 
WHERE user_id = $1 AND certificate_type = 'achievement'
ORDER BY issued_at DESC;
```

**4. Count certificate types per user**
```sql
SELECT 
    user_id,
    certificate_type,
    COUNT(*) as count
FROM certificates
GROUP BY user_id, certificate_type;
```

**5. Get recent certificates with user info**
```sql
SELECT 
    c.certificate_id,
    u.full_name,
    t.name as topic_name,
    c.certificate_type,
    c.percentage,
    c.issued_at
FROM certificates c
JOIN users u ON c.user_id = u.id
JOIN topics t ON c.topic_id = t.id
WHERE c.issued_at >= NOW() - INTERVAL '7 days'
ORDER BY c.issued_at DESC;
```

**6. Achievement statistics by topic**
```sql
SELECT 
    t.name as topic_name,
    COUNT(CASE WHEN c.certificate_type = 'achievement' THEN 1 END) as achievement_count,
    COUNT(CASE WHEN c.certificate_type = 'participation' THEN 1 END) as participation_count,
    ROUND(AVG(CASE WHEN c.certificate_type = 'achievement' THEN c.percentage END), 2) as avg_achievement_score
FROM certificates c
JOIN topics t ON c.topic_id = t.id
GROUP BY t.name
ORDER BY achievement_count DESC;
```

**7. User achievement rate**
```sql
SELECT 
    u.full_name,
    COUNT(CASE WHEN c.certificate_type = 'achievement' THEN 1 END)::FLOAT / 
    COUNT(*) * 100 as achievement_rate,
    COUNT(*) as total_certificates
FROM certificates c
JOIN users u ON c.user_id = u.id
GROUP BY u.id, u.full_name
HAVING COUNT(*) > 0
ORDER BY achievement_rate DESC;
```

---

## Performance Considerations

### Query Optimization

1. **Always use indexes for lookups**
   - user_id, certificate_id, issued_at

2. **Use LIMIT for large result sets**
   ```sql
   SELECT * FROM certificates WHERE user_id = $1 LIMIT 50;
   ```

3. **Archive old certificates**
   ```sql
   CREATE TABLE certificates_archive AS 
   SELECT * FROM certificates 
   WHERE issued_at < NOW() - INTERVAL '2 years';
   
   DELETE FROM certificates 
   WHERE issued_at < NOW() - INTERVAL '2 years';
   ```

### Disk Space

- Estimated size per certificate: ~100 bytes
- For 100,000 certificates: ~10 MB (plus indexes ~5 MB)
- With PDF URLs: +50 bytes per certificate

---

## Backup & Recovery

### Backup Strategy

```bash
# Full backup
pg_dump -U postgres openassess > backup_$(date +%Y%m%d).sql

# Certificates only
pg_dump -U postgres openassess -t certificates > certs_$(date +%Y%m%d).sql
```

### Recovery

```bash
# Restore full database
psql -U postgres openassess < backup_20260618.sql

# Restore certificates only
psql -U postgres openassess < certs_20260618.sql
```

---

## Data Validation Rules

### Certificate Creation

1. **user_id**: Must exist in users table
2. **topic_id**: Must exist in topics table
3. **certificate_type**: Must be 'participation' or 'achievement'
4. **score**: Must be >= 0
5. **percentage**: Must be 0-100
6. **certificate_id**: Must be unique, format OA-YYYY-XXXXXX
7. **issued_at**: Must not be in future

### Achievement Certificate Rules

1. Only created if percentage >= 70
2. Same user cannot have duplicate achievement for same topic/date
3. Achievement certificate issued after participation certificate

---

## Monitoring & Maintenance

### Regular Checks

```sql
-- Check for orphaned certificates
SELECT * FROM certificates 
WHERE user_id NOT IN (SELECT id FROM users)
   OR topic_id NOT IN (SELECT id FROM topics);

-- Check for invalid percentages
SELECT * FROM certificates 
WHERE percentage < 0 OR percentage > 100;

-- Check for invalid types
SELECT * FROM certificates 
WHERE certificate_type NOT IN ('participation', 'achievement');

-- Check for duplicate certificate IDs
SELECT certificate_id, COUNT(*) 
FROM certificates 
GROUP BY certificate_id 
HAVING COUNT(*) > 1;
```

### Cleanup

```sql
-- Delete certificates for deleted users (if cascade not working)
DELETE FROM certificates 
WHERE user_id NOT IN (SELECT id FROM users);

-- Update missing timestamps
UPDATE certificates 
SET issued_at = NOW() 
WHERE issued_at IS NULL;
```

---

## Documentation References

- [PostgreSQL CREATE TABLE](https://www.postgresql.org/docs/current/sql-createtable.html)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)

