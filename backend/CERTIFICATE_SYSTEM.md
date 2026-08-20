# OpenAssess Dual Certificate System

## Overview

The OpenAssess platform now supports TWO certificate types that are automatically generated after assessment completion:

1. **Participation Certificate** - Generated for every completed assessment
2. **Achievement Certificate** - Generated only when score >= 70%

---

## Certificate Types

### 1. Participation Certificate

**When Generated:**
- Automatically created for every completed assessment
- No minimum score requirement

**Certificate Contents:**
- OpenAssess Logo
- Certificate Title: "Certificate of Participation"
- Student Full Name
- Topic Name
- Assessment Completion Date
- Score (X/Y questions correct)
- Percentage Score
- Certificate ID (Format: OA-YYYY-XXXXXX)
- QR Code Placeholder
- Digital Signature Placeholder

**Certificate Text:**
```
This certifies that [Student Name]
participated in and completed
the [Topic Name] assessment on OpenAssess
```

**Purpose:**
- Recognize completion and encourage continuous learning
- Provide proof of participation in assessment activities
- Build learner confidence and engagement

---

### 2. Achievement Certificate

**When Generated:**
- Created ONLY when assessment score >= 70%
- Indicates demonstrated proficiency in the subject

**Certificate Contents:**
- OpenAssess Logo (with Trophy emoji 🏆)
- Certificate Title: "Certificate of Achievement"
- Student Full Name
- Topic Name
- Assessment Completion Date
- Score (X/Y questions correct)
- Percentage Score
- Certificate ID (Format: OA-YYYY-XXXXXX)
- QR Code Placeholder
- Digital Signature Placeholder

**Certificate Text:**
```
This certifies that [Student Name]
has successfully achieved
a score of [Percentage]% in the [Topic Name] assessment
and demonstrated proficiency in the subject
```

**Purpose:**
- Recognize demonstrated mastery and competency
- Provide shareable proof of achievement
- Motivate learners to aim for higher scores

---

## Certificate Generation Logic

### Score Thresholds

| Score | Participation | Achievement |
|-------|---------------|-------------|
| 0-69% | ✓ Generated   | ✗ Not Generated |
| 70%+  | ✓ Generated   | ✓ Generated     |

### Examples

**Case 1: Score 40%**
- ✓ Participation Certificate
- ✗ Achievement Certificate

**Case 2: Score 75%**
- ✓ Participation Certificate
- ✓ Achievement Certificate

**Case 3: Score 100%**
- ✓ Participation Certificate
- ✓ Achievement Certificate

---

## Database Schema

### Certificates Table

```sql
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    certificate_id VARCHAR UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    topic_id INTEGER NOT NULL REFERENCES topics(id),
    certificate_type VARCHAR NOT NULL DEFAULT 'participation',  -- 'participation' or 'achievement'
    score INTEGER NOT NULL,
    percentage FLOAT NOT NULL,
    issued_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    pdf_url VARCHAR
);
```

**Fields:**
- `id`: Unique identifier
- `certificate_id`: Human-readable certificate number (OA-2026-XXXXXX)
- `user_id`: Foreign key to users table
- `topic_id`: Foreign key to topics table
- `certificate_type`: Either "participation" or "achievement"
- `score`: Number of correct answers (integer)
- `percentage`: Score as percentage (float)
- `issued_at`: Certificate issuance timestamp
- `pdf_url`: Storage location for generated PDF (optional)

---

## API Endpoints

### GET /certificates

**Description:** List all certificates for the authenticated user

**Response:**
```json
[
  {
    "id": 1,
    "certificate_id": "OA-2026-ABC123",
    "user_id": 5,
    "topic_id": 3,
    "topic_name": "Python Programming",
    "student_name": "John Doe",
    "certificate_type": "participation",
    "score": 8,
    "total": 10,
    "percentage": 80.0,
    "issued_at": "2026-06-18T15:30:00",
    "pdf_url": null
  },
  {
    "id": 2,
    "certificate_id": "OA-2026-DEF456",
    "user_id": 5,
    "topic_id": 3,
    "topic_name": "Python Programming",
    "student_name": "John Doe",
    "certificate_type": "achievement",
    "score": 8,
    "total": 10,
    "percentage": 80.0,
    "issued_at": "2026-06-18T15:30:00",
    "pdf_url": null
  }
]
```

### GET /certificates/{certificate_id}

**Description:** Retrieve a specific certificate by ID

**Parameters:**
- `certificate_id` (path): Certificate ID (e.g., "OA-2026-ABC123")

**Response:** Single certificate object (same structure as above)

### POST /quiz/submit

**Description:** Submit assessment answers and generate certificates

**Response includes:**
```json
{
  "score": 8,
  "total": 10,
  "passed": true,
  "percentage": 80.0,
  "completed_at": "2026-06-18T15:30:00",
  "participation_certificate": { /* Certificate object */ },
  "achievement_certificate": { /* Certificate object or null */ },
  "results": [ /* Question results */ ]
}
```

---

## Frontend Integration

### Assessment Results Page

After completing an assessment, users see:

1. **Score Display**
   - Final percentage score
   - Number of correct answers
   - Pass/Fail status

2. **Certificates Section**
   - Displays all earned certificates
   - Shows certificate type (Participation or Achievement)
   - Provides certificate ID
   - Buttons to view and download each certificate

3. **Certificate Actions**
   - "View Certificate" - Opens certificate detail page
   - "Download PDF" - Downloads certificate as PDF file

### Certificate Detail Page

For each certificate, displays:

1. **Certificate Display**
   - Type-specific title (Participation or Achievement)
   - Student name and topic
   - Score and percentage
   - Certificate ID
   - Issue date
   - Type-specific badge (Trophy emoji for Achievement)

2. **Actions**
   - Download as PDF with professional formatting
   - Return to dashboard

### Dashboard

Shows certificate statistics:

1. **Certificate Count**
   - Total Participation Certificates
   - Total Achievement Certificates

2. **Recent Certificates**
   - Last 3 certificates earned
   - Topic name, certificate type, issue date
   - Score and percentage
   - Quick links to view certificates

### Portfolio View

Display certificates organized by type:

1. **Achievement Certificates Section**
   - Sortable by date or score
   - Quick statistics

2. **Participation Certificates Section**
   - Sortable by date or topic
   - Filter options

---

## PDF Certificate Generation

### Using jsPDF Library

Certificates are generated using `jsPDF` with professional formatting:

**Features:**
- Landscape orientation (A4 size)
- Custom border design
- Color-coded by certificate type:
  - Participation: Indigo theme
  - Achievement: Emerald theme
- Professional typography
- QR Code placeholder area
- Digital signature placeholder

**File Naming:** `{certificate_id}.pdf` (e.g., `OA-2026-ABC123.pdf`)

---

## Backend Implementation

### Service Layer

**File:** `backend/services/certificate_service.py`

**Functions:**

1. `create_participation_certificate(db, user, topic, score, total)`
   - Creates participation certificate for every assessment
   - Returns: Certificate object

2. `create_achievement_certificate(db, user, topic, score, total)`
   - Creates achievement certificate only if score >= 70%
   - Returns: Certificate object or None

3. `create_certificates_for_assessment(db, user, topic, score, total)`
   - Wrapper function that creates both certificates as needed
   - Returns: Tuple of (participation_cert, achievement_cert or None)

4. `serialize_certificate(certificate, total)`
   - Converts ORM model to API response schema
   - Includes user name, topic name, and certificate type

5. `build_certificate_code(issued_at)`
   - Generates certificate ID in format: OA-YYYY-XXXXXX
   - Example: OA-2026-A1B2C3

### Route Layer

**File:** `backend/routes/quiz.py`

**Modified endpoint:** POST /quiz/submit
- Calls `create_certificates_for_assessment()` after successful submission
- Returns both certificates in response
- Handles null achievement certificate gracefully

---

## Data Migration

For existing deployments:

1. **Add certificate_type column:**
```sql
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS certificate_type VARCHAR DEFAULT 'participation' NOT NULL;
```

2. **Update existing records:**
```sql
UPDATE certificates 
SET certificate_type = 'participation' 
WHERE certificate_type IS NULL;
```

3. **Backfill achievement certificates** (optional):
```sql
INSERT INTO certificates (certificate_id, user_id, topic_id, certificate_type, score, percentage, issued_at)
SELECT 
    CONCAT('OA-', EXTRACT(YEAR FROM issued_at), '-', SUBSTR(MD5(RANDOM()::TEXT), 1, 6)),
    user_id,
    topic_id,
    'achievement',
    score,
    percentage,
    issued_at
FROM certificates
WHERE percentage >= 70 
  AND certificate_type = 'participation'
  AND NOT EXISTS (
    SELECT 1 FROM certificates c2 
    WHERE c2.user_id = certificates.user_id 
      AND c2.topic_id = certificates.topic_id
      AND c2.certificate_type = 'achievement'
      AND c2.score = certificates.score
  );
```

---

## Testing Scenarios

### Test Case 1: Low Score
- User scores 40%
- Expected: Participation certificate ONLY
- Verify: Achievement certificate is NULL in response

### Test Case 2: Passing Score
- User scores 75%
- Expected: Both Participation AND Achievement certificates
- Verify: Both certificates have correct IDs and types

### Test Case 3: Perfect Score
- User scores 100%
- Expected: Both certificates with 100% percentage
- Verify: Dashboard shows both certificate types

### Test Case 4: Multiple Attempts
- User completes same topic twice (60%, then 80%)
- Expected: 2 participation, 1 achievement certificate
- Verify: All certificates show in user's certificate list

### Test Case 5: PDF Download
- Download both certificate types
- Verify: PDF includes correct title and text for each type
- Verify: File naming convention: OA-2026-XXXXXX.pdf

---

## Configuration

### Pass Threshold

**Current:** 70% for Achievement Certificate
**Location:** `backend/services/certificate_service.py`

To modify:
```python
ACHIEVEMENT_THRESHOLD = 0.70  # Change this value
```

### Certificate ID Format

**Current:** OA-YYYY-XXXXXX (Example: OA-2026-A1B2C3)
**Location:** `backend/services/certificate_service.py::build_certificate_code()`

---

## Best Practices

1. **Always generate participation certificates** - Even low scorers should be recognized
2. **Use achievement thresholds** - 70% is industry standard for mastery
3. **Secure certificate IDs** - Use UUIDs to prevent tampering
4. **Track issuance dates** - Important for timeline verification
5. **Enable PDF download** - Users should be able to save certificates
6. **Provide sharing options** - Consider social media integration (future feature)

---

## Future Enhancements

1. **QR Code Generation**
   - Embed verifiable certificate links
   - Enable certificate validation

2. **Digital Signatures**
   - Add instructor signatures
   - Implement certificate authentication

3. **Certificate Sharing**
   - LinkedIn integration
   - Twitter sharing
   - Email delivery

4. **Certificate Analytics**
   - Track achievement rate by topic
   - Monitor certificate issuance trends
   - Identify high-performing students

5. **Multi-Level Certifications**
   - Bronze, Silver, Gold certificates based on performance
   - Micro-credentials for specific skills
   - Pathway certifications across multiple topics

---

## Troubleshooting

### Achievement Certificate Not Generating

**Problem:** User scored 75% but no achievement certificate

**Solutions:**
1. Check database: `SELECT * FROM certificates WHERE user_id = X;`
2. Verify score calculation: `percentage >= 70`
3. Check certificate_type values in database
4. Review logs for creation errors

### Certificate ID Duplicates

**Problem:** Two certificates with same ID

**Solution:** Review `build_certificate_code()` UUID generation
- Ensure unique timestamps
- Verify random hex generation

### PDF Download Fails

**Problem:** Download button shows error

**Solutions:**
1. Verify jsPDF library is installed
2. Check browser console for errors
3. Ensure certificate object has all required fields
4. Test with hardcoded certificate data

---

## Support & Documentation

For issues or questions:
1. Check this document first
2. Review code comments in service layer
3. Check API logs for errors
4. Contact development team

