# OpenAssess Backend Project Audit

Date: 2026-06-17

Scope audited: FastAPI app startup, route registration, dependency injection, CORS, authentication, SQLAlchemy models, PostgreSQL connectivity, schemas, services, AI explanation flow, frontend API integration, and MVP endpoints.

## Audit Summary

- FastAPI import and OpenAPI generation work after the current repairs.
- PostgreSQL connection works with the configured `DATABASE_URL`.
- Core MVP flow has been smoke-tested with FastAPI `TestClient`: register, login, JWT `/auth/me`, topics, questions, quiz start, quiz submit, AI fallback explanation, dashboard, and heatmap.
- Existing frontend already targets the main backend endpoints, while backend compatibility aliases were added for the requested `GET /topics` and `GET /dashboard` contracts.

## Issues Found

### 1. Import-time crash when `SECRET_KEY` is missing

- Severity: High
- Affected files: `backend/utils/auth_utils.py`
- Description: The auth utility previously raised at module import if `SECRET_KEY` was not configured.
- Root cause: Environment validation happened during import instead of allowing the app to boot in development.
- Fix applied: Use a development fallback secret and emit a warning.
- Why the fix works: FastAPI can import and start locally while production still has a clear warning to set a secure `SECRET_KEY`.
- How to test: Start backend without `SECRET_KEY`; `/docs` and `/health` should load. Set `SECRET_KEY` in production.

### 2. User full name schema mismatch with legacy database

- Severity: Critical
- Affected files: `backend/models/user.py`, `backend/routes/auth.py`, `backend/seed.py`, `backend/main.py`
- Description: The API writes `full_name`, but this live database still had a legacy `users.name` column with a `NOT NULL` constraint. Registration failed with `psycopg2.errors.NotNullViolation`.
- Root cause: The model was migrated from `name` to `full_name`, but legacy database constraints were not fully handled.
- Fix applied: Preserve a mapped `legacy_name` column for `users.name`, populate it during registration and seeding, and add startup migration statements to sync `name` and `full_name` while dropping the legacy `name` `NOT NULL` constraint.
- Why the fix works: New registrations satisfy both current API schema and older database constraints.
- How to test: `POST /auth/register` with `full_name`, `email`, and `password` returns `201`.

### 3. Missing requested top-level `GET /topics`

- Severity: Medium
- Affected files: `backend/routes/questions.py`, `backend/main.py`
- Description: Topics were available at `/questions/topics`, but the requested MVP contract includes `GET /topics`.
- Root cause: Topic routes were registered only under the `/questions` router prefix.
- Fix applied: Added a public alias router with `GET /topics` that reuses the same topic query helper.
- Why the fix works: Existing clients keep using `/questions/topics`; new clients can use `/topics`.
- How to test: `GET /topics` returns the same topic/subtopic list as `GET /questions/topics`.

### 4. Missing requested top-level `GET /dashboard`

- Severity: Medium
- Affected files: `backend/routes/analytics.py`, `backend/main.py`
- Description: Dashboard analytics were available at `/analytics/me`, but the requested MVP contract includes `GET /dashboard`.
- Root cause: Analytics routes were registered only under the `/analytics` router prefix.
- Fix applied: Extracted summary generation into a helper and added a protected `/dashboard` alias.
- Why the fix works: Existing `/analytics/me` behavior is preserved while `/dashboard` returns the same authenticated analytics summary.
- How to test: Log in, then call `GET /dashboard` with `Authorization: Bearer <token>`.

### 5. Quiz submission could crash on mixed correct and incorrect answers

- Severity: High
- Affected files: `backend/routes/quiz.py`
- Description: `_attach_ai_explanations` passed a Pydantic model as the `update` argument to `model_copy()` for correct answers when at least one answer was incorrect.
- Root cause: A conditional expression was placed inside `model_copy(update=...)`, so the correct-answer branch supplied `item` instead of a dict.
- Fix applied: Move the conditional outside the `model_copy()` call.
- Why the fix works: Incorrect answers receive `ai_explanation`; correct answers are returned unchanged.
- How to test: Submit a quiz with a mix of correct and incorrect answers. `POST /quiz/submit` should return `200`.

### 6. Gemini package/key could block AI module import or explanation generation

- Severity: Medium
- Affected files: `backend/services/ai_service.py`
- Description: The AI service imported `google.generativeai` directly and required Gemini configuration for live AI output.
- Root cause: AI integration was treated as a hard import dependency, even though quiz grading should work without external AI.
- Fix applied: Wrapped the Gemini import in `try/except ImportError`, kept `_model` optional, and preserved static explanation fallback.
- Why the fix works: Quiz submission still returns explanations when Gemini is unavailable, using database explanation text or a generic fallback.
- How to test: Run without `GEMINI_API_KEY`; submit wrong answers and confirm `ai_explanation` is still populated.

### 7. Database configuration is environment-dependent

- Severity: High if PostgreSQL is not running
- Affected files: `backend/database.py`, `backend/.env`
- Description: The backend defaults to a local PostgreSQL URL. If the local DB/user/password differs, app health will report disconnected or startup migrations will fail.
- Root cause: Local infrastructure is assumed rather than provisioned.
- Fix applied: No architecture change. Verified current configured PostgreSQL connection succeeds.
- Recommended fix: Keep a correct `DATABASE_URL` in `backend/.env`; add Docker Compose or documented setup for repeatable development.
- How to test: `python -c "import sys; sys.path.insert(0, 'backend'); from database import engine; from sqlalchemy import text; conn=engine.connect(); conn.execute(text('SELECT 1')); conn.close(); print('db connected')"`

### 8. AI package deprecation warning

- Severity: Low
- Affected files: `backend/services/ai_service.py`, `backend/requirements.txt`
- Description: The installed `google.generativeai` package emits a deprecation warning.
- Root cause: Google has moved newer Gemini SDK support to `google.genai`.
- Fix applied: None in this recovery pass because current package still works and the task prioritizes backend stability.
- Recommended fix: Plan a controlled migration from `google-generativeai` to `google-genai`.
- How to test: Import `backend.services.ai_service`; warning may appear, but app startup should continue.

## Endpoint Status

- `POST /auth/register`: Working.
- `POST /auth/login`: Working.
- `GET /auth/me`: Working with JWT.
- `GET /topics`: Working alias.
- `GET /questions/topics`: Working existing route.
- `GET /questions`: Working.
- `POST /quiz/start`: Working.
- `POST /quiz/submit`: Working with scoring and AI fallback.
- `GET /dashboard`: Working alias.
- `GET /analytics/me`: Working existing route.
- `GET /analytics/heatmap`: Working.
- `GET /health`: Working and reports DB connectivity.

## Frontend Integration Notes

- Frontend API base URL defaults to `http://127.0.0.1:8000` in `frontend/lib/api.ts`.
- Frontend login uses OAuth form fields expected by FastAPI.
- Frontend stores and sends bearer tokens through `Authorization`.
- Backend CORS allows HTTP/HTTPS development origins.
- No frontend code change was required for the existing frontend, because it already uses `/questions/topics`, `/quiz/start`, `/quiz/submit`, and `/analytics/me`.
