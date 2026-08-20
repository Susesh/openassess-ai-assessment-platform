# OpenAssess Backend Fix Report

Date: 2026-06-17

## Files Modified

- `backend/main.py`
- `backend/models/user.py`
- `backend/routes/auth.py`
- `backend/routes/questions.py`
- `backend/routes/analytics.py`
- `backend/routes/quiz.py`
- `backend/services/ai_service.py`
- `backend/seed.py`
- `PROJECT_AUDIT.md`
- `FIX_REPORT.md`

## Fixes Applied

### 1. Added top-level topic endpoint

- Root cause: Topics existed only at `/questions/topics`.
- Affected files: `backend/routes/questions.py`, `backend/main.py`
- Fix applied: Added `public_router` with `GET /topics`, reusing the same topic/subtopic query helper.
- Why it works: Both old and requested routes return the same response model.
- How to test: `GET http://127.0.0.1:8000/topics`

### 2. Added top-level dashboard endpoint

- Root cause: Dashboard analytics existed only at `/analytics/me`.
- Affected files: `backend/routes/analytics.py`, `backend/main.py`
- Fix applied: Extracted dashboard summary logic into `_build_analytics_summary()` and added protected `GET /dashboard`.
- Why it works: `/dashboard` and `/analytics/me` use the same calculation path.
- How to test: `GET http://127.0.0.1:8000/dashboard` with `Authorization: Bearer <token>`.

### 3. Fixed quiz submission AI explanation crash

- Root cause: Correct answers in a mixed result list passed a Pydantic model to `model_copy(update=...)` instead of a dict.
- Affected file: `backend/routes/quiz.py`
- Fix applied: Moved the conditional outside `model_copy()`.
- Why it works: Incorrect items are copied with an `ai_explanation`; correct items are returned unchanged.
- How to test: Submit a quiz containing at least one wrong answer and one correct answer.

### 4. Made Gemini integration optional at import time

- Root cause: `google.generativeai` was imported as a hard dependency.
- Affected file: `backend/services/ai_service.py`
- Fix applied: Wrapped import with `try/except ImportError` and kept the model optional.
- Why it works: Missing Gemini package or key no longer breaks startup or quiz grading.
- How to test: Run without `GEMINI_API_KEY` and submit wrong answers; fallback explanation text should be returned.

### 5. Repaired registration against legacy `users.name` databases

- Root cause: Current API writes `full_name`, but this database still had a legacy `name NOT NULL` column.
- Affected files: `backend/models/user.py`, `backend/routes/auth.py`, `backend/seed.py`, `backend/main.py`
- Fix applied: Added `legacy_name` mapping for `users.name`, populate it on registration/seeding, and added startup migration statements to sync legacy/current columns.
- Why it works: Inserts now satisfy both current and legacy schemas.
- How to test: `POST /auth/register` returns `201` and `GET /auth/me` returns the `full_name`.

## Verification Performed

Commands run from project root:

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'; python -c "import sys; sys.path.insert(0, 'backend'); import main; print('import ok'); print(sorted([r.path for r in main.app.routes]))"
```

Result: FastAPI app imports, and `/topics` plus `/dashboard` are registered.

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'; python -c "import sys; sys.path.insert(0, 'backend'); from main import app; schema=app.openapi(); print('openapi ok', len(schema.get('paths', {}))); print('/topics' in schema['paths'], '/dashboard' in schema['paths'])"
```

Result: OpenAPI generation succeeds with 18 paths.

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'; python -c "import sys; sys.path.insert(0, 'backend'); from database import engine; from sqlalchemy import text; conn = engine.connect(); conn.execute(text('SELECT 1')); conn.close(); print('db connected')"
```

Result: PostgreSQL connection succeeds.

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'; python -c "code='''import sys\nsys.path.insert(0, \\'backend\\')\nfrom fastapi.testclient import TestClient\nfrom main import app\nwith TestClient(app) as client:\n    res = client.get(\\'/health\\')\n    print(res.status_code, res.json())\n'''; exec(code)"
```

Result: Lifespan/startup health check returns `200` with `db_status: connected`.

End-to-end smoke test result:

- `POST /auth/register`: `201`
- `POST /auth/login`: `200`
- `GET /auth/me`: `200`
- `GET /topics`: `200`
- `GET /questions`: `200`
- `POST /quiz/start`: `201`
- `POST /quiz/submit`: `200`
- `GET /dashboard`: `200`
- `GET /analytics/heatmap`: `200`

Gemini was not configured during verification, so quiz submission logged fallback warnings and returned static explanations instead of failing.

## Postman Examples

### Register

`POST http://127.0.0.1:8000/auth/register`

```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepass123"
}
```

### Login

`POST http://127.0.0.1:8000/auth/login`

Body type: `x-www-form-urlencoded`

```text
username=jane@example.com
password=securepass123
```

### Current User

`GET http://127.0.0.1:8000/auth/me`

Header:

```text
Authorization: Bearer <access_token>
```

### Topics

`GET http://127.0.0.1:8000/topics`

### Questions

`GET http://127.0.0.1:8000/questions?topic_id=1&limit=3`

### Start Quiz

`POST http://127.0.0.1:8000/quiz/start`

Header:

```text
Authorization: Bearer <access_token>
```

```json
{
  "topic_id": 1,
  "num_questions": 3
}
```

### Submit Quiz

`POST http://127.0.0.1:8000/quiz/submit`

Header:

```text
Authorization: Bearer <access_token>
```

```json
{
  "attempt_id": 1,
  "answers": [
    { "question_id": 1, "selected_option": "A" },
    { "question_id": 2, "selected_option": "B" },
    { "question_id": 3, "selected_option": "C" }
  ]
}
```

### Dashboard

`GET http://127.0.0.1:8000/dashboard`

Header:

```text
Authorization: Bearer <access_token>
```

## Run Commands

```powershell
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

Optional seed command:

```powershell
cd backend
python seed.py
```

## Remaining Issues

- Set a strong production `SECRET_KEY`; the development fallback is not production-safe.
- Configure `GEMINI_API_KEY` for real AI explanations. Without it, fallback explanations are used.
- Consider migrating from deprecated `google-generativeai` to the newer `google-genai` SDK.
- Add Alembic migrations for schema changes instead of relying on startup best-effort migrations.
- Pin dependency versions in `requirements.txt` for reproducible installs.

---

# React Key Duplication Fix Report

Date: 2026-06-17

## Root Cause

React warned `Encountered two children with the same key 'SQL'` because dashboard heatmap UI used `item.topic` as the React key. The backend heatmap data can contain repeated topic names when different topic records share the same display name.

Verified duplicate API source data:

- Database topic names include duplicates: `Python`, `SQL`.
- Completed-attempt rows also repeat topic names: `Python`, `SQL`.
- `HeatmapItem` does not include a unique topic ID, so `item.topic` is not a safe key.

## Files Fixed

- `frontend/lib/heatmap.ts`
- `frontend/components/topic-performance.tsx`
- `frontend/app/dashboard/page.tsx`
- `frontend/app/dashboard/portfolio/page.tsx`
- `frontend/app/dashboard/assessment/results/page.tsx`
- `frontend/contexts/auth-context.tsx`
- `frontend/app/dashboard/assessment/take/page.tsx`

## Code Changes

### Heatmap normalization

- Added `normalizeHeatmapItems()` in `frontend/lib/heatmap.ts`.
- Merges duplicate topic names case-insensitively.
- Sums attempts, computes weighted average score, and keeps the latest `last_attempted` date.

### Key strategy

- Replaced unsafe `key={item.topic}` with `key={`${item.topic}-${index}`}` after normalization.
- Replaced static stat label keys with composite keys.
- Replaced result summary keys based only on truncated text with composite text/index keys.
- Kept safe keys where unique IDs already exist, such as `topic.id`, `cert.id`, `q.id`, and `question_id`.

### React warning cleanup

- Fixed existing `react-hooks/set-state-in-effect` lint warnings by scheduling effect-driven state changes instead of calling state setters directly inside effect bodies.
- This affected auth bootstrap, invalid assessment route handling, timed auto-submit, and result-session loading.

## Verification Steps

Commands run:

```powershell
rg "key=\{item\.topic|key=\{stat\.label|key=\{item\}" frontend\app frontend\components frontend\contexts frontend\lib
```

Result: no unsafe key patterns remain.

```powershell
npm run lint
```

Result: passed with no warnings or errors.

```powershell
npx tsc --noEmit
```

Result: passed.

```powershell
npm run build
```

Result: Next.js production build completed successfully with no React key or hydration warnings.

Backend duplicate-data check:

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'; python -c "import sys; sys.path.insert(0, 'backend'); from database import SessionLocal; from models.topic import Topic; db=SessionLocal(); rows=db.query(Topic.name).all(); names=[r[0] for r in rows]; dup=sorted({n for n in names if names.count(n)>1}); print('topic_count', len(names)); print('duplicate_topic_names', dup); db.close()"
```

Result: duplicate topic names found: `Python`, `SQL`.

## Remaining Recommendation

The frontend is now resilient to duplicate heatmap topic labels. For long-term data correctness, add a backend/admin cleanup step to remove duplicate topic records or enforce a unique topic-name constraint if duplicate topic names are not intended.

---

# Topic Expansion and Question Bank Report

Date: 2026-06-18

## Root Cause of Duplicate Python Cards

The old seed file created only `Python` and `SQL` demo topics, then skipped all topic/question seeding whenever any topic already existed. Legacy seed/test runs left duplicate topic rows in PostgreSQL. The assessment page rendered topic rows from the API, so duplicate database rows became duplicate cards.

## Files Modified

- `backend/seed.py`
- `backend/routes/questions.py`
- `backend/schemas/question.py`
- `backend/migrations/20260618_topic_catalog_cleanup.sql`
- `frontend/lib/types.ts`
- `frontend/lib/api.ts`
- `frontend/app/dashboard/assessment/page.tsx`
- `TOPIC_STRUCTURE.md`
- `QUESTION_BANK_SUMMARY.md`
- `FIX_REPORT.md`

## Database Changes

- Renamed legacy topic names:
  - `Python` -> `Python Programming`
  - `SQL` -> `SQL Database`
- Merged duplicate topic records by normalized name.
- Moved questions, attempts, and certifications to canonical topic rows.
- Removed obsolete demo questions/subtopics for catalog topics.
- Seeded 15 topics, 60 subtopics, and 150 MCQs.
- Added seed-time compatibility repair for legacy `certifications.certificate_code`.

## API Changes

- `GET /topics` now returns deduplicated topics with subtopics and `question_count`.
- `GET /topics/{topic_id}` was added.
- `GET /questions?topic_id=xx` continues to return topic-filtered random questions.
- `POST /quiz/submit` was smoke-tested after the new catalog seed.

## Frontend Changes

- Assessment topic cards now display:
  - Topic name
  - Description
  - Number of questions
  - Number of subtopics
  - Mastery, when available
- Topic fetching now uses `GET /topics`.
- Frontend also filters duplicate topic names defensively before card rendering.

## Verification

Backend/database:

- `python seed.py` completed successfully.
- Database contains 15 topics, 60 subtopics, and 150 questions.
- Duplicate topic names: none.
- Duplicate question text: none.
- Correct answer letters include A, B, C, and D.

API smoke checks:

- `GET /topics`: 200, 15 topics.
- `GET /topics/{id}`: 200, includes `question_count`.
- `GET /questions?topic_id=xx&limit=10`: 200, 10 questions.
- `POST /auth/login`: 200 for demo user.
- `POST /quiz/start`: 201.
- `POST /quiz/submit`: 200.
- `GET /dashboard`: 200.

Frontend checks:

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
