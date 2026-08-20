# 🚀 QUICK START GUIDE - OpenAssess Admin Portal

## Current Status: ✅ FULLY RUNNING

Both services are currently running. You can access them immediately.

---

## 🎯 Quick Access

### Admin Portal
- **URL**: http://localhost:3000/admin/dashboard
- **Credentials**:
  - Email: `admin@openassess.com`
  - Password: `Admin@123`

### Backend API
- **URL**: http://127.0.0.1:8000
- **Documentation**: http://127.0.0.1:8000/docs

### Database
- **Type**: PostgreSQL
- **Host**: localhost (usually)

---

## 🔄 To Restart Services

### Option 1: Restart Backend
```powershell
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Option 2: Restart Frontend
```powershell
cd frontend
npm run dev
# Runs on http://localhost:3000
```

---

## 📊 Admin Portal Features

### Dashboard (http://localhost:3000/admin/dashboard)
- **User Statistics** - Total, active, new users
- **Assessment Metrics** - Total attempts, today's activity
- **Performance Analytics** - Average scores, pass/fail rates
- **Certificate Tracking** - Issued certificates by type
- **Top/Bottom Performing Topics** - Learning analytics

### User Management
- View all users
- Search/filter users
- Suspend or activate users
- View user performance

### Content Management
- **Topics** - Create, edit, delete topics
- **Subtopics** - Organize by subcategory
- **Questions** - Manage question bank
  - Difficulty levels
  - Topic association
  - Answer validation

### Assessment Monitoring
- View all student assessments
- Filter by user or topic
- Track completion status
- Monitor real-time activity

### Analytics & Reports
- **User Growth** - New registrations over time
- **Assessment Trends** - Usage patterns
- **Performance Analytics** - Score distribution
- **Certificate Analytics** - Issuance tracking

### System Management
- **Health Status** - API, database, AI service status
- **Audit Logs** - All admin actions logged
- **System Monitoring** - Real-time performance metrics

---

## 🔐 Authentication

### Login Flow
1. Navigate to: http://localhost:3000/admin/login
2. Enter: admin@openassess.com
3. Enter: Admin@123
4. Click "Sign In"
5. Redirects to: http://localhost:3000/admin/dashboard

### Token Storage
- JWT token stored in localStorage
- Automatically sent with each API request
- Valid for 24 hours

---

## 📡 Backend Endpoints

### Authentication
- `POST /admin/login` - Admin login

### Dashboard
- `GET /admin/dashboard` - All statistics
- `GET /admin/system-health` - System status

### Resources
- `GET /admin/users` - List users
- `GET /admin/topics` - List topics
- `GET /admin/questions` - List questions
- `GET /admin/assessments` - List assessments
- `GET /admin/certificates` - List certificates
- `GET /admin/logs` - Audit logs

### Analytics
- `GET /admin/analytics/user-growth?days=30`
- `GET /admin/analytics/assessment-trends?days=30`
- `GET /admin/analytics/performance?days=30`
- `GET /admin/analytics/certificates?days=30`

---

## 🛠️ Troubleshooting

### Frontend not responding
```powershell
# Check if port 3000 is in use
netstat -ano | findstr :3000

# If in use, kill the process (replace PID)
taskkill /PID 35352 /F

# Restart frontend
cd frontend && npm run dev
```

### Backend not responding
```powershell
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Database connection issues
# Verify PostgreSQL is running

# Check backend logs for errors
# Terminal should show error messages
```

### Login not working
- Verify backend is running at http://127.0.0.1:8000
- Check browser console (F12) for errors
- Verify credentials: admin@openassess.com / Admin@123

### Dashboard shows no data
- Ensure backend is returning data
- Check network requests in browser (F12)
- Verify database has seed data

---

## 📝 All Verified Endpoints

| Endpoint | Status | Response |
|----------|--------|----------|
| GET /admin/dashboard | ✅ 200 | Dashboard data |
| GET /admin/users | ✅ 200 | User list |
| GET /admin/topics | ✅ 200 | Topics list |
| GET /admin/questions | ✅ 200 | Questions list |
| GET /admin/assessments | ✅ 200 | Assessment data |
| GET /admin/certificates | ✅ 200 | Certificate data |
| GET /admin/logs | ✅ 200 | Audit logs |
| GET /admin/system-health | ✅ 200 | System status |
| GET /admin/analytics/user-growth | ✅ 200 | Growth data |
| GET /admin/analytics/assessment-trends | ✅ 200 | Trend data |
| GET /admin/analytics/performance | ✅ 200 | Performance data |
| GET /admin/analytics/certificates | ✅ 200 | Certificate data |

---

## 🎉 You're All Set!

Everything is configured and running. The admin portal has full access to:
- ✅ Platform management
- ✅ User administration
- ✅ Content creation
- ✅ Assessment monitoring
- ✅ Analytics & reporting
- ✅ System health tracking

**Start exploring at**: http://localhost:3000/admin/dashboard

---

**Last Updated**: 2026-06-18
**System Status**: ✅ PRODUCTION READY
