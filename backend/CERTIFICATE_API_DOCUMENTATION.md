# OpenAssess Certificate API Documentation

## Base URL

```
http://127.0.0.1:8000
```

## Authentication

All endpoints require Bearer token authentication.

```
Authorization: Bearer {access_token}
```

---

## Endpoints

### 1. List User Certificates

**Endpoint:** `GET /certificates`

**Description:** Retrieve all certificates earned by the authenticated user

**Authentication:** Required

**Parameters:** None

**Response:** `200 OK`

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
    "issued_at": "2026-06-18T15:30:01",
    "pdf_url": null
  }
]
```

**Error Responses:**

- `401 Unauthorized` - Missing or invalid token
```json
{
  "detail": "Not authenticated"
}
```

---

### 2. Get Specific Certificate

**Endpoint:** `GET /certificates/{certificate_id}`

**Description:** Retrieve a single certificate by its ID

**Authentication:** Required

**Parameters:**
- `certificate_id` (path, required): Certificate ID (e.g., "OA-2026-ABC123")

**Response:** `200 OK`

```json
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
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated
```json
{
  "detail": "Not authenticated"
}
```

- `404 Not Found` - Certificate not found or belongs to another user
```json
{
  "detail": "Certificate not found"
}
```

---

### 3. Start Assessment Quiz

**Endpoint:** `POST /quiz/start`

**Description:** Initialize a quiz attempt and retrieve questions

**Authentication:** Required

**Request Body:**
```json
{
  "topic_id": 1,
  "subtopic_id": null,
  "num_questions": 10
}
```

**Parameters:**
- `topic_id` (required): Topic ID
- `subtopic_id` (optional): Subtopic ID for filtered questions
- `num_questions` (optional, default: 10, min: 1, max: 50): Number of questions

**Response:** `201 Created`

```json
{
  "attempt_id": 42,
  "questions": [
    {
      "id": 101,
      "topic_id": 1,
      "subtopic_id": 5,
      "text": "What is a list comprehension in Python?",
      "options": [
        "A concise way to create lists from iterables",
        "A documentary about coding",
        "A type of error handling",
        "A debugging technique"
      ],
      "difficulty": "easy"
    },
    {
      "id": 102,
      "topic_id": 1,
      "subtopic_id": 6,
      "text": "Which method adds an element to a list?",
      "options": [
        "list.add()",
        "list.append()",
        "list.insert()",
        "list.push()"
      ],
      "difficulty": "easy"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Topic not found
- `400 Bad Request` - Not enough questions available
```json
{
  "detail": "Not enough questions available (found 5, need 10)"
}
```

---

### 4. Submit Assessment Answers

**Endpoint:** `POST /quiz/submit`

**Description:** Submit answers and receive grading with certificates

**Authentication:** Required

**Request Body:**
```json
{
  "attempt_id": 42,
  "answers": [
    {
      "question_id": 101,
      "selected_option": "A"
    },
    {
      "question_id": 102,
      "selected_option": "B"
    },
    {
      "question_id": 103,
      "selected_option": "A"
    }
  ]
}
```

**Parameters:**
- `attempt_id` (required): Attempt ID from quiz start
- `answers` (required, array):
  - `question_id` (required): Question ID
  - `selected_option` (required): "A", "B", "C", "D", or null for unanswered

**Response:** `200 OK`

```json
{
  "score": 8,
  "total": 10,
  "passed": true,
  "percentage": 80.0,
  "completed_at": "2026-06-18T15:30:00",
  "participation_certificate": {
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
  "achievement_certificate": {
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
    "issued_at": "2026-06-18T15:30:01",
    "pdf_url": null
  },
  "results": [
    {
      "question_id": 101,
      "selected_option": "A",
      "correct_option": "A",
      "is_correct": true,
      "explanation": "List comprehensions provide a concise way to create lists from iterables...",
      "ai_explanation": null
    },
    {
      "question_id": 102,
      "selected_option": "B",
      "correct_option": "B",
      "is_correct": true,
      "explanation": "The append() method adds an element to the end of a list...",
      "ai_explanation": null
    }
  ]
}
```

**Certificate Logic:**
- `participation_certificate`: Always generated
- `achievement_certificate`: Generated only if `percentage >= 70`, otherwise `null`

**Error Responses:**

- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Attempt not found
- `400 Bad Request` - Attempt already submitted
```json
{
  "detail": "This quiz attempt has already been submitted"
}
```

- `400 Bad Request` - Wrong number of answers
```json
{
  "detail": "Expected 10 answers, got 8"
}
```

- `400 Bad Request` - Answer question IDs don't match
```json
{
  "detail": "Answers must match the questions from this attempt"
}
```

---

## Data Models

### Certificate Object

```json
{
  "id": 1,
  "certificate_id": "OA-2026-ABC123",
  "user_id": 5,
  "topic_id": 3,
  "topic_name": "Python Programming",
  "student_name": "John Doe",
  "certificate_type": "participation|achievement",
  "score": 8,
  "total": 10,
  "percentage": 80.0,
  "issued_at": "2026-06-18T15:30:00",
  "pdf_url": null
}
```

**Fields:**
- `id`: Unique database identifier
- `certificate_id`: Human-readable certificate number
- `user_id`: User who earned the certificate
- `topic_id`: Assessment topic
- `topic_name`: Topic name (populated from relationship)
- `student_name`: Student full name (populated from user relationship)
- `certificate_type`: "participation" or "achievement"
- `score`: Number correct
- `total`: Total questions
- `percentage`: Score percentage (0-100)
- `issued_at`: ISO 8601 timestamp
- `pdf_url`: Optional URL to PDF file

### Quiz Result Object

```json
{
  "score": 8,
  "total": 10,
  "passed": true,
  "percentage": 80.0,
  "completed_at": "2026-06-18T15:30:00",
  "participation_certificate": { /* Certificate object */ },
  "achievement_certificate": { /* Certificate object or null */ },
  "results": [ /* Array of QuestionResult */ ]
}
```

### Question Result Object

```json
{
  "question_id": 101,
  "selected_option": "A",
  "correct_option": "A",
  "is_correct": true,
  "explanation": "Explanation text from question",
  "ai_explanation": "AI-generated explanation (for incorrect answers only)"
}
```

---

## Certificate Generation Rules

### Participation Certificate
- **When:** Always generated after successful submission
- **Condition:** None (100% of submissions)
- **Type Value:** "participation"

### Achievement Certificate
- **When:** Generated after successful submission if score >= 70%
- **Condition:** `percentage >= 70.0`
- **Type Value:** "achievement"
- **Response:** Included in `achievement_certificate` field if earned, `null` if not

---

## Status Codes Reference

| Code | Meaning | Scenario |
|------|---------|----------|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST to start quiz |
| 400 | Bad Request | Invalid input or business logic violation |
| 401 | Unauthorized | Missing or invalid authentication token |
| 404 | Not Found | Resource doesn't exist or wrong owner |
| 500 | Server Error | Unexpected server error |

---

## Rate Limiting

No rate limiting currently implemented.

Future consideration: Limit to 100 quiz submissions per user per day.

---

## Examples

### Example 1: User with Low Score

**Request:** Submit quiz with 40% score
```bash
curl -X POST http://127.0.0.1:8000/quiz/submit \
  -H "Authorization: Bearer token123" \
  -H "Content-Type: application/json" \
  -d '{
    "attempt_id": 42,
    "answers": [
      {"question_id": 101, "selected_option": "A"},
      {"question_id": 102, "selected_option": "C"},
      ...
    ]
  }'
```

**Response:**
- `participation_certificate`: Generated with 40% score
- `achievement_certificate`: `null` (score < 70%)

### Example 2: User with Passing Score

**Request:** Submit quiz with 85% score
```bash
curl -X POST http://127.0.0.1:8000/quiz/submit \
  -H "Authorization: Bearer token123" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Response:**
- `participation_certificate`: Generated with 85% score
- `achievement_certificate`: Generated with 85% score (score >= 70%)

### Example 3: Retrieve Certificates

**Request:** Get all certificates
```bash
curl -X GET http://127.0.0.1:8000/certificates \
  -H "Authorization: Bearer token123"
```

**Response:**
```json
[
  { "id": 1, "certificate_type": "participation", ... },
  { "id": 2, "certificate_type": "achievement", ... },
  { "id": 3, "certificate_type": "participation", ... }
]
```

### Example 4: Get Specific Certificate

**Request:** Get achievement certificate
```bash
curl -X GET http://127.0.0.1:8000/certificates/OA-2026-ABC123 \
  -H "Authorization: Bearer token123"
```

**Response:**
```json
{
  "id": 1,
  "certificate_id": "OA-2026-ABC123",
  "certificate_type": "achievement",
  ...
}
```

---

## Integration Checklist

- [ ] Backend endpoints implemented and tested
- [ ] Certificate service creates both certificate types
- [ ] Database schema includes certificate_type column
- [ ] Frontend updated to handle both certificates
- [ ] PDF generation handles both certificate types
- [ ] Dashboard shows certificate statistics
- [ ] Results page displays both certificates
- [ ] Certificate detail page shows certificate type
- [ ] Portfolio view organized by certificate type
- [ ] Error handling for missing certificates
- [ ] API documentation updated (this file)
- [ ] Database migration scripts prepared
- [ ] User testing completed

---

## Troubleshooting

### Achievement Certificate Not Generated

**Check:**
1. Verify score calculation: `percentage >= 70`
2. Check response: `achievement_certificate` field should contain object (not null)
3. Query database: `SELECT * FROM certificates WHERE certificate_type = 'achievement'`

### Certificate Not Retrieved

**Check:**
1. User authentication (token valid)
2. Certificate exists in database
3. Certificate belongs to authenticated user
4. Certificate ID format correct

### PDF Download Issues

**Check:**
1. jsPDF library installed and imported
2. Certificate object has all required fields
3. Browser console for JavaScript errors
4. File download permissions

---

## Support

For API issues, contact the development team or check:
- Backend logs: `backend/logs/`
- Database queries: Check query execution
- Frontend console: Check browser developer tools

