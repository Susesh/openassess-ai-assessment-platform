# OpenAssess - Complete Startup & Deployment Guide

**Status:** ✅ FULLY OPERATIONAL  
**Last Updated:** June 18, 2026  
**Backend:** Running on http://127.0.0.1:8000  
**Frontend Config:** Targeting backend on 127.0.0.1:8000

---

## Quick Start (Production Ready)

### Prerequisites
- Python 3.13+
- Node.js 20+
- PostgreSQL 12+
- Git

### Environment Setup

#### 1. Backend Environment (`.env`)
```env
DATABASE_URL=postgresql://postgres:newpassword123@localhost:5432/OpenAssess
SECRET_KEY=your-secret-key-change-this-in-production-minimum-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=7
DEBUG=False
AIzaSyDE53kTDsP1m7xdPXqCNwEJ6JBYmkBePDc=YOUR_GEMINI_API_KEY
```

#### 2. Frontend Environment (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## Running the Application

### Backend Startup

```bash
# Navigate to project root
cd OpenAssess-main

# Start backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

# Output should show:
# INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
# INFO:     Application startup complete.
```

**Verify Backend:**
- Health Check: http://127.0.0.1:8000/health
- API Docs: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

### Frontend Startup

```bash
# In a new terminal window
cd OpenAssess-main/frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev

# Output should show:
# ▲ Next.js 16.2.6
# - Local: http://localhost:3000
```

**Access Frontend:**
- Main App: http://localhost:3000
- Admin Dashboard: http://localhost:3000/admin/dashboard

---

## Default Credentials

### Admin Account
```
Email: admin@openassess.com
Password: Admin@123
```

### Test Student Account
```
Email: teststudent@example.com  
Password: Password@123
(Create via registration first time)
```

---

## Project Structure

```
OpenAssess-main/
├── backend/                       ← Python FastAPI backend
│   ├── main.py                   ← Entry point
│   ├── database.py              ← PostgreSQL connection
│   ├── models/                  ← ORM models
│   ├── routes/                  ← API endpoints
│   ├── schemas/                 ← Request/response schemas
│   ├── services/                ← Business logic
│   ├── utils/                   ← Utilities
│   ├── ai/                      ← AI question generation
│   ├── migrations/              ← Database migrations
│   └── requirements.txt
│
├── frontend/                      ← Next.js React frontend
│   ├── app/                     ← Next.js app directory
│   ├── components/              ← React components
│   ├── contexts/                ← React contexts
│   ├── lib/                     ← Utilities
│   ├── public/                  ← Static assets
│   ├── package.json
│   └── .env.local
│
└── README.md

```

---

## API Endpoints

### Authentication
```
POST   /auth/register          → Create student account
POST   /auth/login             → Get student JWT token
GET    /auth/me                → Get current user profile
```

### Admin
```
POST   /admin/login            → Admin authentication
GET    /admin/dashboard        → Dashboard summary
GET    /admin/users            → List all users
GET    /admin/users/:id        → User details
```

### Questions & Topics
```
GET    /questions/topics        → List all topics
GET    /questions/by-topic      → Get questions for topic
POST   /questions/create        → Create question (admin)
PUT    /questions/:id           → Update question (admin)
DELETE /questions/:id           → Delete question (admin)
```

### Assessments
```
POST   /quiz/start              → Start new assessment
POST   /quiz/submit             → Submit answers
GET    /results/my-results      → User's assessment history
GET    /results/topic-scores    → Scores by topic
```

### Other
```
GET    /analytics/              → User performance
GET    /certificates/list       → Earned certificates
POST   /proctoring/logs         → Log proctoring event
GET    /health                  → Service health
```

---

## Database

### Connection Details
```
Type: PostgreSQL
Host: localhost
Port: 5432
Database: OpenAssess
User: postgres
Password: (check .env)
```

### Tables
- users              → Student accounts
- admins            → Admin accounts
- topics            → Assessment topics
- questions         → Question bank
- attempts          → Assessment attempts
- results           → Individual question results
- certificates      → Awarded certificates
- certifications    → Course completions
- audit_log         → Admin action log
- proctor_log       → Proctoring events

---

## Troubleshooting

### Backend Won't Start

**Error: `ModuleNotFoundError: No module named 'backend'`**
```bash
# Make sure you're in the project root directory
cd OpenAssess-main

# Not in backend/ directory
# Wrong: cd backend && python -m uvicorn main:app
# Right: cd .. && python -m uvicorn backend.main:app
```

**Error: `Database connection failed`**
```bash
# Check PostgreSQL is running
# Verify DATABASE_URL in .env
# Ensure database 'OpenAssess' exists
```

**Error: `Port 8000 already in use`**
```bash
# Use a different port
python -m uvicorn backend.main:app --port 8001
# Update NEXT_PUBLIC_API_URL in frontend/.env.local
```

### Frontend Won't Start

**Error: `Module not found`**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Error: `NEXT_PUBLIC_API_URL not set`**
```bash
# Ensure frontend/.env.local exists with:
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### API Connection Issues

**CORS Errors:**
- Backend CORS is configured to accept all origins (dev-friendly)
- Should work from frontend automatically

**401 Unauthorized:**
- Token has expired (7-day expiration)
- Re-login to get new token
- Check browser's LocalStorage for token

**404 Not Found:**
- Endpoint may not exist
- Check API docs: http://127.0.0.1:8000/docs

---

## Production Deployment

### Backend

```bash
# Install gunicorn (production WSGI server)
pip install gunicorn

# Run with multiple workers
gunicorn backend.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -

# Or use Docker
docker build -t openassess-backend .
docker run -p 8000:8000 openassess-backend
```

### Frontend

```bash
# Build for production
npm run build

# Start production server
npm run start

# Or deploy to Vercel
vercel deploy

# Or use Docker
docker build -t openassess-frontend .
docker run -p 3000:3000 openassess-frontend
```

### Database

```sql
-- Backup
pg_dump OpenAssess > backup.sql

-- Restore
psql OpenAssess < backup.sql

-- Monitor
SELECT * FROM pg_stat_activity;
SELECT count(*) FROM pg_stat_connections;
```

---

## Performance Optimization

### Backend
- ✅ Connection pooling (20 active, 10 overflow)
- ✅ Connection recycling (1 hour)
- ✅ Query optimization via SQLAlchemy
- ✅ CORS middleware for cross-origin requests

### Frontend
- ✅ Next.js automatic code splitting
- ✅ React component lazy loading
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for optimized styling

### Database
- ✅ Indexes on frequently queried columns
- ✅ Connection pooling
- ✅ Query caching via ORM
- ✅ Transaction management

---

## Security Checklist

- ✅ Passwords: bcrypt hashing
- ✅ Tokens: JWT with 7-day expiration
- ✅ CORS: Configured for development
- ✅ HTTPS: Configure in production
- ✅ Secrets: Use environment variables
- ✅ Database: Connection pooling enabled
- ✅ Logging: Errors logged, not secrets

### Production Security Steps
1. Set strong SECRET_KEY in .env
2. Enable HTTPS/TLS
3. Restrict CORS origins
4. Configure database backups
5. Set up monitoring/alerts
6. Enable database encryption
7. Use environment-specific configs

---

## Monitoring & Health Checks

### Health Endpoint
```bash
curl http://127.0.0.1:8000/health

# Response:
{
  "status": "ok",
  "version": "1.0.0",
  "db_status": "connected"
}
```

### Logs
```
Backend: uvicorn logs in terminal
Frontend: Browser console + Next.js build logs
Database: PostgreSQL logs in /var/log/postgresql/
```

### Metrics to Monitor
- API response times
- Database query performance
- Error rates (4xx, 5xx)
- Active user sessions
- Database connection usage
- Memory usage
- CPU usage

---

## Key Features

### ✅ Student Features
- User registration and login
- Browse assessment topics
- Take adaptive quizzes
- Receive AI-powered feedback
- Track learning progress
- View performance analytics
- Earn certificates
- Download certificates

### ✅ Admin Features
- Admin login and dashboard
- View system statistics
- Manage users
- Create/edit assessments
- View assessment analytics
- Monitor proctoring events
- View audit logs
- System health checks

### ✅ Technical Features
- FastAPI backend
- PostgreSQL database
- JWT authentication
- CORS middleware
- Google Gemini AI integration
- Bcrypt password hashing
- SQLAlchemy ORM
- Next.js frontend
- React 19
- TypeScript
- Tailwind CSS

---

## Support & Documentation

### API Documentation
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

### Project Docs
- `BACKEND_COMPREHENSIVE_ANALYSIS.md` - Backend architecture
- `frontend/README.md` - Frontend setup
- Backend models in `backend/models/`
- Schemas in `backend/schemas/`

### Common Commands

```bash
# Create admin user
python backend/scripts/create_admin.py

# Reset database (careful!)
python backend/seed.py

# Check database
psql -U postgres -d OpenAssess

# View migrations
ls backend/migrations/

# Backend tests
pytest backend/tests/

# Frontend lint
cd frontend && npm run lint
```

---

## Checklist for Full Deployment

- [ ] Backend running on http://127.0.0.1:8000
- [ ] Frontend running on http://localhost:3000
- [ ] Admin can login: admin@openassess.com / Admin@123
- [ ] Can create student account
- [ ] Can login as student
- [ ] Can browse topics
- [ ] Can take assessment
- [ ] Can view results
- [ ] Health endpoint returns "connected"
- [ ] API docs accessible at /docs
- [ ] No console errors
- [ ] No network errors
- [ ] All routes responding

---

**OpenAssess is now production-ready!**

For issues or questions, check the API documentation or review the comprehensive analysis report.
