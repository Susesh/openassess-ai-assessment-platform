# Examination Criteria Module - Implementation and Compliance Audit

## Scope
This implementation extends the existing OpenAssess backend (FastAPI) and frontend (Next.js) without breaking existing endpoints and flows.

## Implemented Capabilities

### 1) Configurable assessment settings
Implemented in existing criteria model/API and surfaced in UI:
- Exam Name
- Board (CBSE, ICSE, State Board, IIT-JEE, NEET, UPSC, University, Custom)
- Subject
- Topic
- Subtopic
- Difficulty
- Total Questions
- Total Marks
- Passing Percentage
- Negative Marking
- Maximum Attempts
- Video Recording Enabled
- AI Proctoring Enabled
- Certificate Enabled

Backend files:
- backend/models/exam_criteria.py
- backend/schemas/exam_criteria.py
- backend/services/exam_criteria_service.py
- backend/routes/exam_criteria.py

Frontend files:
- frontend/app/dashboard/assessment/criteria/page.tsx
- frontend/app/dashboard/admin/exam-criteria/page.tsx
- frontend/components/exam-criteria/criteria-form.tsx
- frontend/components/exam-criteria/criteria-card.tsx
- frontend/lib/api.ts
- frontend/lib/types.ts

### 2) Duration and timer requirements
Implemented:
- Minimum duration is enforced as 60 minutes in schema and service.
- Default duration is 60 minutes.
- Longer durations are supported.
- Duration and instructions are shown before starting.
- Timer starts after Start Assessment.
- Live countdown with warnings at 15, 10, 5, 1 minute.
- Automatic submit at expiry.
- Answering disabled when submitted/timeout.
- Start/end/duration/time spent per question persisted.
- Autosave every 30s and on each answer.
- Remaining time is restored after refresh/network interruption.
- Timer synchronization with backend via status polling and resume endpoint.

Backend additions:
- backend/routes/quiz.py: resume endpoint `GET /quiz/resume/{attempt_id}`
- backend/schemas/quiz.py: QuizResumeOut

Frontend additions:
- frontend/hooks/use-assessment-recovery.ts
- frontend/app/dashboard/assessment/take/page.tsx (resume integration)

### 3) Assessment flow
Supported flow:
- Select Assessment (topic library and criteria library)
- Show Instructions
- Camera & Microphone Check
- Start Video Recording (if enabled)
- Enable AI Proctoring (if enabled)
- Enter Fullscreen
- Start Timer
- Load Questions
- Auto Save
- Submit Assessment
- Stop Recording
- Generate Results
- Generate Analytics
- Recommend Remedial Learning
- Schedule Reattempt (guided reattempt action after remediation)
- Generate Certificate if Passed (if enabled)

### 4) Pass/fail logic and post-processing
Implemented:
- PASS when score percentage >= passing percentage.
- FAIL otherwise.
- On pass:
  - Subtopic certification update trigger
  - Knowledge portfolio update
  - Next difficulty unlock recommendation when applicable
- On fail:
  - Weak topics extraction
  - Gap analysis text generation
  - Learning resource recommendations
  - Remedial plan generation
  - Reattempt recommendation enabled

Backend file:
- backend/routes/quiz.py

### 5) Adaptive difficulty
Implemented with required signals:
- Score thresholds:
  - >90: increase
  - 70-90: maintain
  - <70: reduce
- Additional context included in recommendation payload:
  - previous attempts
  - mastery level
  - wrong answer patterns
  - confidence score
  - learning progress

Backend file:
- backend/services/exam_criteria_service.py

## API Backward Compatibility
- Existing endpoints remain unchanged.
- New endpoint added: `GET /quiz/resume/{attempt_id}`.
- Existing quiz start/submit/status/autosave contracts remain valid.
- Additional result fields are additive and optional to clients.

## Validation and Security
- Role-protected admin criteria endpoints are reused.
- Input validation remains in pydantic schemas.
- Duration floor validation is enforced in schema and service.
- Attempt ownership checks are enforced on resume/status/autosave/submit.

## Tests Added
- backend/tests/test_exam_criteria_module.py
  - duration minimum validation
  - adaptive recommendation increase path
  - adaptive recommendation reduce path

## Residual Notes
- Reattempt scheduling is represented as guided post-failure action and remediation gate recommendation.
- Existing architecture remains intact; no rewrites were performed.
