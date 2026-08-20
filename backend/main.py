import sys
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

# Allow `python -m uvicorn main:app` when run from the backend/ directory.
_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from backend import models
from backend.database import engine, DATABASE_URL
from backend.routes import (
    admin,
    analytics,
    auth,
    calendar,
    certificates,
    certifications,
    exam_criteria,
    proctoring,
    questions,
    quiz,
    remediation,
    results,
    video_recording,
    ai_proctoring,
    subtopic_certification,
    organization,
    portfolio,
    question_papers,
    search,
    tutors,
    notifications,
    kpi,
    employer,
    landing,
    websocket,
)
from backend.ai import question_generator as ai_questions
from backend.schemas.common import HealthResponse, MessageResponse


API_VERSION = "1.0.0"
logger = logging.getLogger(__name__)

OPENAPI_TAGS = [
    {
        "name": "Auth",
        "description": "Register, log in, and manage the authenticated user profile.",
    },
    {
        "name": "Questions",
        "description": "Browse topics and fetch quiz questions.",
    },
    {
        "name": "Quiz",
        "description": "Start assessments, submit answers, and receive AI-powered feedback.",
    },
    {
        "name": "Analytics",
        "description": "Personal performance summaries and per-topic score heatmaps.",
    },
    {
        "name": "Certifications",
        "description": "Generate and list skill certificates earned on the platform.",
    },
    {
        "name": "Subtopic Certifications",
        "description": "Subtopic-level micro-certifications with QR verification.",
    },
    {
        "name": "Organizations",
        "description": "Employer/university verification portal with API access.",
    },
    {
        "name": "Proctoring",
        "description": "Log integrity events during live assessments and review reports.",
    },
    {
        "name": "Video Recordings",
        "description": "Manage assessment session video recordings for proctoring.",
    },
    {
        "name": "AI Proctoring",
        "description": "AI-powered proctoring with face detection, eye tracking, and behavior analysis.",
    },
    {
        "name": "Admin",
        "description": "Admin-only routes for user management and platform configuration.",
    },
    {
        "name": "WebSocket",
        "description": "Real-time WebSocket connection for presence updates and live collaboration.",
    },
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Validate critical environment variables before startup
    secret_key = os.getenv("SECRET_KEY")
    if not secret_key:
        raise RuntimeError(
            "SECRET_KEY environment variable is not set. "
            "Please set a secure SECRET_KEY in your environment or .env file. "
            "Generate one using: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
        )
    
    # Ensure database tables exist. For development, create_all will
    # create missing tables but won't alter existing ones. Some users
    # may have an older `users` table missing the `full_name` column,
    # which causes registration to fail with a ProgrammingError. Add
    # a quick, safe migration here to create the column if it's missing.
    models.Base.metadata.create_all(bind=engine)

    # Check if using SQLite
    is_sqlite = DATABASE_URL.startswith("sqlite")

    # Add missing columns used by current models without breaking existing data.
    # Wrap each migration in individual try-except to prevent transaction abort
    def safe_execute(conn, sql):
        try:
            conn.execute(text("SAVEPOINT migration_step"))
            conn.execute(text(sql))
            conn.execute(text("RELEASE SAVEPOINT migration_step"))
        except Exception as e:
            try:
                conn.execute(text("ROLLBACK TO SAVEPOINT migration_step"))
            except Exception:
                pass
            logger.warning(f"Migration failed (continuing): {sql[:100]}... - {str(e)[:100]}")
    
    # Optional: Generate embeddings on startup if enabled
    auto_generate_embeddings = os.getenv("AUTO_GENERATE_EMBEDDINGS", "false").lower() == "true"
    
    # Skip PostgreSQL-specific migrations for SQLite
    # SQLite tables are created by SQLAlchemy's create_all, no manual migrations needed
    if not is_sqlite:
        try:
            with engine.begin() as conn:
                # Assessment Library Expansion Columns
                safe_execute(conn, "ALTER TABLE questions ADD COLUMN IF NOT EXISTS board VARCHAR")
                safe_execute(conn, "ALTER TABLE questions ADD COLUMN IF NOT EXISTS class_name VARCHAR")
                safe_execute(conn, "ALTER TABLE questions ADD COLUMN IF NOT EXISTS subject VARCHAR")
                safe_execute(conn, "ALTER TABLE questions ADD COLUMN IF NOT EXISTS year INTEGER")
                safe_execute(conn, "ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type VARCHAR DEFAULT 'mcq'")
                safe_execute(conn, "ALTER TABLE questions ADD COLUMN IF NOT EXISTS source VARCHAR")
                safe_execute(conn, "ALTER TABLE questions ADD COLUMN IF NOT EXISTS tags JSON")
                safe_execute(conn, "ALTER TABLE questions ADD COLUMN IF NOT EXISTS meta_data JSON")
                
                # Add `full_name` if it doesn't exist
                safe_execute(conn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR DEFAULT ''")
                safe_execute(conn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR")
                safe_execute(conn, "UPDATE users SET full_name = COALESCE(NULLIF(full_name, ''), name, '')")
                safe_execute(conn, "UPDATE users SET name = COALESCE(name, full_name, '')")
                safe_execute(conn, "ALTER TABLE users ALTER COLUMN name DROP NOT NULL")
                safe_execute(conn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now()")
                safe_execute(conn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'student' NOT NULL")
                safe_execute(conn, "ALTER TABLE users ALTER COLUMN role SET DEFAULT 'student'")
                safe_execute(conn, "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true")
                safe_execute(conn, "UPDATE users SET is_active = COALESCE(is_active, true)")

                # Attempts table columns
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT now()")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 0")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS is_passed BOOLEAN DEFAULT false")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS question_ids JSON")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS question_paper_id INTEGER")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS question_status JSON")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS marked_for_review JSON")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS proctoring_enabled BOOLEAN DEFAULT true")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS video_recording_enabled BOOLEAN DEFAULT true")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS integrity_score FLOAT")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS proctoring_violations_count INTEGER DEFAULT 0")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS exam_criteria_id INTEGER REFERENCES exam_criteria(id)")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS server_started_at TIMESTAMP WITHOUT TIME ZONE")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMP WITHOUT TIME ZONE")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITHOUT TIME ZONE")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60 NOT NULL")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0 NOT NULL")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS submission_reason VARCHAR")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS raw_score FLOAT DEFAULT 0 NOT NULL")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS total_marks FLOAT DEFAULT 0 NOT NULL")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS passing_percentage FLOAT DEFAULT 40 NOT NULL")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS negative_marking FLOAT DEFAULT 0 NOT NULL")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS answers_snapshot JSON")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS per_question_time JSON")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS criteria_snapshot JSON")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS adaptive_recommendation JSON")
                safe_execute(conn, "UPDATE attempts SET duration_minutes = COALESCE(NULLIF(duration_minutes, 0), 60)")
                safe_execute(conn, "UPDATE attempts SET passing_percentage = COALESCE(NULLIF(passing_percentage, 0), 40)")
                
                # Adaptive difficulty columns
                safe_execute(conn, "ALTER TABLE questions ADD COLUMN IF NOT EXISTS irt_difficulty FLOAT DEFAULT 0.0")
                safe_execute(conn, "ALTER TABLE questions ADD COLUMN IF NOT EXISTS irt_discrimination FLOAT DEFAULT 1.0")
                safe_execute(conn, "ALTER TABLE questions ADD COLUMN IF NOT EXISTS irt_guessing FLOAT DEFAULT 0.25")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS difficulty_progression JSON")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS initial_difficulty VARCHAR")
                safe_execute(conn, "ALTER TABLE attempts ADD COLUMN IF NOT EXISTS final_difficulty VARCHAR")
                
                # Remedial session columns
                safe_execute(conn, "ALTER TABLE tutor_sessions ADD COLUMN IF NOT EXISTS remedial_attempt_id INTEGER REFERENCES attempts(id)")
                safe_execute(conn, "ALTER TABLE tutor_sessions ADD COLUMN IF NOT EXISTS weak_topics JSON")
                safe_execute(conn, "ALTER TABLE tutor_sessions ADD COLUMN IF NOT EXISTS auto_scheduled BOOLEAN DEFAULT false")
                
                # Notifications table
                safe_execute(conn, """CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY, 
                    user_id INTEGER NOT NULL REFERENCES users(id), 
                    type VARCHAR NOT NULL, 
                    title VARCHAR NOT NULL, 
                    body VARCHAR, 
                    data JSON, 
                    read_at TIMESTAMP WITH TIME ZONE, 
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                )""")

                # Legacy results table column
                safe_execute(conn, "ALTER TABLE results ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER")
                
                # Payment system removed - all assessments are free
                safe_execute(conn, "ALTER TABLE topics ADD COLUMN IF NOT EXISTS passing_score FLOAT DEFAULT 40.0")
                
                # Remove legacy admin tables, keep admin role for users
                safe_execute(conn, "DROP TABLE IF EXISTS admin_sessions CASCADE")
                safe_execute(conn, "DROP TABLE IF EXISTS audit_logs CASCADE")
                safe_execute(conn, "DROP TABLE IF EXISTS admins CASCADE")
                # Reset users with null or empty role to 'student'
                safe_execute(conn, "UPDATE users SET role = 'student' WHERE role IS NULL OR role = ''")

                # Proctoring schema upgrades.
                safe_execute(conn, "ALTER TABLE proctor_logs ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)")
                safe_execute(conn, "ALTER TABLE proctor_logs ADD COLUMN IF NOT EXISTS event_description VARCHAR DEFAULT ''")
                safe_execute(conn, "ALTER TABLE proctor_logs ADD COLUMN IF NOT EXISTS severity VARCHAR DEFAULT 'warning'")
                safe_execute(conn, "UPDATE proctor_logs p SET user_id = a.user_id FROM attempts a WHERE p.attempt_id = a.id AND p.user_id IS NULL")
                safe_execute(conn, "UPDATE proctor_logs SET event_description = COALESCE(event_description, '')")
                safe_execute(conn, "UPDATE proctor_logs SET severity = COALESCE(NULLIF(severity, ''), 'warning')")

                # AI proctoring sessions metadata column
                safe_execute(conn, "ALTER TABLE proctoring_sessions ADD COLUMN IF NOT EXISTS session_metadata JSON")

                # Video recording schema upgrades for older local databases.
                safe_execute(conn, (
                    "CREATE TABLE IF NOT EXISTS video_recordings ("
                    "id SERIAL PRIMARY KEY, "
                    "attempt_id INTEGER NOT NULL UNIQUE REFERENCES attempts(id), "
                    "user_id INTEGER NOT NULL REFERENCES users(id), "
                    "recording_type VARCHAR NOT NULL, "
                    "file_path VARCHAR, "
                    "cloud_storage_url VARCHAR, "
                    "file_size_bytes INTEGER, "
                    "duration_seconds FLOAT, "
                    "status VARCHAR DEFAULT 'pending', "
                    "started_at TIMESTAMP WITHOUT TIME ZONE, "
                    "stopped_at TIMESTAMP WITHOUT TIME ZONE, "
                    "uploaded_at TIMESTAMP WITHOUT TIME ZONE, "
                    "resolution VARCHAR, "
                    "frame_rate INTEGER, "
                    "bitrate_kbps INTEGER, "
                    "processing_error VARCHAR, "
                    "thumbnail_url VARCHAR, "
                    "is_public BOOLEAN DEFAULT false, "
                    "expires_at TIMESTAMP WITHOUT TIME ZONE, "
                    "created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(), "
                    "updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()"
                    ")"
                ))
                safe_execute(conn, "ALTER TABLE video_recordings ADD COLUMN IF NOT EXISTS file_path VARCHAR")
                safe_execute(conn, "ALTER TABLE video_recordings ADD COLUMN IF NOT EXISTS cloud_storage_url VARCHAR")
                safe_execute(conn, "ALTER TABLE video_recordings ADD COLUMN IF NOT EXISTS file_size_bytes INTEGER")
                safe_execute(conn, "ALTER TABLE video_recordings ADD COLUMN IF NOT EXISTS duration_seconds FLOAT")
                safe_execute(conn, "ALTER TABLE video_recordings ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending'")
                safe_execute(conn, "ALTER TABLE video_recordings ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITHOUT TIME ZONE")
                safe_execute(conn, "ALTER TABLE video_recordings ADD COLUMN IF NOT EXISTS stopped_at TIMESTAMP WITHOUT TIME ZONE")
                safe_execute(conn, "ALTER TABLE video_recordings ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITHOUT TIME ZONE")
                safe_execute(conn, "ALTER TABLE video_recordings ADD COLUMN IF NOT EXISTS resolution VARCHAR")
                safe_execute(conn, "ALTER TABLE video_recordings ADD COLUMN IF NOT EXISTS frame_rate INTEGER")
                safe_execute(conn, "ALTER TABLE video_recordings ADD COLUMN IF NOT EXISTS bitrate_kbps INTEGER")
                safe_execute(conn, "ALTER TABLE video_recordings ADD COLUMN IF NOT EXISTS processing_error VARCHAR")
                safe_execute(conn, "ALTER TABLE video_recordings ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR")
                safe_execute(conn, "ALTER TABLE video_recordings ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false")
                safe_execute(conn, "ALTER TABLE video_recordings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITHOUT TIME ZONE")
                safe_execute(conn, "ALTER TABLE video_recordings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()")
                safe_execute(conn, "ALTER TABLE video_recordings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()")
                safe_execute(conn, "UPDATE video_recordings SET status = COALESCE(NULLIF(status, ''), 'pending')")
                safe_execute(conn, "UPDATE video_recordings SET is_public = COALESCE(is_public, false)")
                
                # Optional: Auto-generate embeddings on startup if enabled
                if auto_generate_embeddings:
                    logger.info("AUTO_GENERATE_EMBEDDINGS is enabled, generating missing embeddings...")
                    try:
                        from backend.services.vector_service import VectorService
                        from backend.models.topic import Topic
                        from backend.models.question import Question
                        
                        # Generate topic embeddings
                        topics_count = VectorService.batch_generate_topic_embeddings(conn)
                        logger.info(f"Generated {topics_count} topic embeddings")
                        
                        # Generate question embeddings  
                        questions_count = VectorService.batch_generate_question_embeddings(conn)
                        logger.info(f"Generated {questions_count} question embeddings")
                        
                        logger.info("Embedding generation completed successfully")
                    except Exception as e:
                        logger.warning(f"Auto-generation of embeddings failed: {str(e)}")
        except OperationalError as e:
            # Handle database deadlock during concurrent startup
            if "deadlock" in str(e).lower() or "lock" in str(e).lower():
                logger.warning("Database lock detected during startup, skipping auto-migration.")
            else:
                raise
        except Exception:
            # Don't crash the app for migration failures here; surface errors
            # in logs. The migration is best-effort for development databases.
            logger.exception("Startup database migration failed")

    yield


app = FastAPI(
    title="OpenAssess API",
    description=(
        "OpenAssess is an AI-powered continuous assessment platform. "
        "Students take adaptive quizzes by topic, receive Gemini explanations "
        "for incorrect answers, track progress via analytics, earn certificates, "
        "and participate in proctored sessions."
    ),
    version=API_VERSION,
    contact={
        "name": "OpenAssess Team",
        "url": "https://github.com/openassess",
        "email": "support@openassess.com",
    },
    license_info={
        "name": "MIT",
    },
    openapi_tags=OPENAPI_TAGS,
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows localhost, 127.0.0.1, and 192.168.x.x local network devices
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for question papers and other assets
_static_papers_path = Path(__file__).resolve().parent / "static" / "papers"
if _static_papers_path.exists():
    app.mount("/static/papers", StaticFiles(directory=str(_static_papers_path)), name="papers")

app.include_router(auth.router, tags=["Auth"])
app.include_router(questions.public_router, tags=["Questions"])
app.include_router(questions.router, tags=["Questions"])
app.include_router(quiz.router, tags=["Quiz"])
app.include_router(results.router, tags=["Results"])
app.include_router(analytics.public_router, tags=["Analytics"])
app.include_router(analytics.router, tags=["Analytics"])
app.include_router(certificates.router, tags=["Certificates"])
app.include_router(certifications.router, tags=["Certifications"])
app.include_router(exam_criteria.router, tags=["Exam Criteria"])
app.include_router(subtopic_certification.router, tags=["Subtopic Certifications"])
app.include_router(organization.router, tags=["Organizations"])
app.include_router(proctoring.router, tags=["Proctoring"])
app.include_router(video_recording.router, tags=["Video Recordings"])
app.include_router(ai_proctoring.router, tags=["AI Proctoring"])
app.include_router(admin.router, tags=["Admin"])
app.include_router(remediation.router, tags=["Remediation"])
app.include_router(portfolio.router, tags=["Portfolio"])
app.include_router(question_papers.router, tags=["Question Papers"])
app.include_router(search.router, tags=["Search"])
app.include_router(tutors.router, tags=["Tutors"])
app.include_router(calendar.router, tags=["Calendar"])
app.include_router(notifications.router, tags=["Notifications"])
app.include_router(kpi.router, tags=["KPI"])
app.include_router(ai_questions.router, tags=["AI"])
app.include_router(employer.router, tags=["Employer"])
app.include_router(landing.router, tags=["Landing"])
app.include_router(websocket.router, tags=["WebSocket"])


def _check_db() -> str:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return "connected"
    except Exception:
        return "disconnected"


@app.get(
    "/",
    response_model=MessageResponse,
    tags=["Health"],
    summary="API welcome message",
)
def root():
    """Return a short welcome message confirming the API is reachable."""
    return MessageResponse(message="OpenAssess backend is running!")


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Service health check",
)
def health():
    """Report API status, version, and PostgreSQL connectivity for monitoring."""
    return HealthResponse(
        status="ok",
        version=API_VERSION,
        db_status=_check_db(),
    )


if __name__ == "__main__":
    import uvicorn
    # Bind to 0.0.0.0 to allow both localhost and 192.168.x.x network access
    # NOTE: Browsers must still use http://localhost:8000 or the local IP, NOT http://0.0.0.0:8000
    # Increased timeout for AI generation requests (default is 30s, set to 300s for 5 minutes)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, timeout_keep_alive=300)
