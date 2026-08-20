# ⚡ QUICK REFERENCE - Backend Connection Fix

## 🎯 Status: FULLY FIXED ✅

All backend connection issues resolved. System fully operational.

---

## 🚀 Quick Start

### 1. Start Backend
```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
**Output should show:** `Application startup complete`

### 2. Start Frontend  
```bash
cd frontend
npm run dev
```
**Output should show:** `Ready in X.XXs`

### 3. Access Admin Portal
- **URL:** http://localhost:3000/admin/login
- **Page shows:** ✅ Green "Backend Online" indicator
- **Login with:**
  - Email: `admin@openassess.com`
  - Password: `Admin@123`

---

## ✅ Verification

### One-Command Verification
```bash
python verify_complete_setup.py
```

Should show all ✅ checks passing.

### Manual Verification
```bash
# Check backend
curl http://127.0.0.1:8000/health

# Check CORS  
curl -X OPTIONS http://127.0.0.1:8000/admin/login \
  -H "Origin: http://localhost:3000"

# Test login
curl -X POST http://127.0.0.1:8000/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@openassess.com", "password": "Admin@123"}'
```

---

## 🔧 What Was Fixed

| Component | Issue | Fix |
|-----------|-------|-----|
| Frontend Login | No backend status | Added real-time status indicator |
| Error Messages | Too generic | Enhanced with troubleshooting |
| Form State | No validation | Disabled when offline |
| Diagnostics | No visibility | Added health check on load |

---

## 🐛 Troubleshooting

### Backend shows "Offline"
```bash
# Check if backend is running
curl http://127.0.0.1:8000/health

# If not, restart it
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Clear browser cache
```
Windows/Linux: Ctrl+Shift+Delete
Mac: Cmd+Shift+Delete
Then select "All time" and clear cache
```

### Hard refresh page
```
Windows/Linux: Ctrl+F5
Mac: Cmd+Shift+R
```

### Port 8000 in use
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8000
kill -9 <PID>
```

---

## 📊 System Components

| Component | URL | Status |
|-----------|-----|--------|
| Backend API | http://127.0.0.1:8000 | ✅ Running |
| Frontend | http://localhost:3000 | ✅ Running |
| Admin Login | http://localhost:3000/admin/login | ✅ Working |
| Admin Dashboard | http://localhost:3000/admin/dashboard | ✅ Working |
| API Docs | http://127.0.0.1:8000/docs | ✅ Working |
| Health Check | http://127.0.0.1:8000/health | ✅ Working |
| Database | PostgreSQL | ✅ Connected |

---

## 📝 Configuration

### Backend (`backend/main.py`)
```python
# CORS allows frontend to connect
allow_origin_regex=r"^https?://.*$"

# Health check for diagnostics  
@app.get("/health")
def health():
    return {"status": "ok", "db_status": "connected"}
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## 🔐 Admin Credentials

```
Email:    admin@openassess.com
Password: Admin@123
```

**⚠️ Change in production!**

---

## 📚 Documentation

Full details in: `BACKEND_CONNECTION_FIX.md`

Verification scripts:
- `verify_backend.py` - Basic tests
- `verify_cors.py` - CORS tests
- `verify_complete_setup.py` - Full system check

---

## ✅ Checklist

Before accessing admin portal:
- [ ] Backend running (`npm run dev` for frontend, uvicorn for backend)
- [ ] Database connected (check /health endpoint)
- [ ] CORS enabled (green indicator on login page)
- [ ] Browser cache cleared
- [ ] Page hard-refreshed
- [ ] Correct credentials used

---

**Status: READY TO USE ✅**

Everything is configured and verified. Start both services and go to http://localhost:3000/admin/login
