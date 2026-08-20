# End-to-End Testing Guide - Assessment Payment History

## ✅ Quick Test (2 Minutes)

### 1. Start Services
```powershell
# Terminal 1: Backend
cd D:\project\OpenAssess-main\backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd D:\project\OpenAssess-main\frontend
npm run dev
```

### 2. Open Browser
```
http://localhost:3000
```

### 3. Sign In
- Use valid credentials from the application

### 4. Navigate to Assessment Page
```
http://localhost:3000/dashboard/assessment
```

### 5. Check Browser Console (F12 → Console)
Expected logs:
```
API URL: http://127.0.0.1:8000/api/payment/history
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6. Check Network Tab (F12 → Network)
Filter for "payment/history":
```
Status: 200 OK
Response: {quiz_payments: [...], certificate_payments: [...]}
```

### 7. Verify Page Display
- Topics load successfully
- No error banner shows (if not signed in, should show "Please sign in...")
- Purchased quizzes have green badge
- Unpurchased quizzes have yellow button

---

## 🔍 Detailed Test Scenarios

### Scenario 1: Happy Path (Successful Fetch)

**Steps**:
1. Sign in with valid credentials
2. Navigate to `/dashboard/assessment`
3. Wait for page to load

**Expected Results**:
- ✅ Console shows: `API URL: http://127.0.0.1:8000/api/payment/history`
- ✅ Console shows: `Token: eyJ...` (JWT visible)
- ✅ Network tab shows 200 OK for payment/history
- ✅ No error messages displayed
- ✅ Topics render with correct purchase status
- ✅ Can click "Take Quiz" on purchased topics

**If Issues**:
- Check backend is running: `http://127.0.0.1:8000/health`
- Check frontend .env has `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`
- Check Network tab for CORS errors

---

### Scenario 2: Session Expired (401 Error)

**Steps**:
1. Sign in and get to assessment page
2. Open DevTools Console
3. Find "token" in localStorage and delete it
4. Refresh the page (F5)

**Expected Results**:
- ✅ Console shows: `API URL: http://127.0.0.1:8000/api/payment/history`
- ✅ Network tab shows 401 Unauthorized
- ✅ Error message displays: "Your session has expired. Please sign in again."
- ✅ Page redirects to login (/)

**What NOT to see**:
- ❌ "Failed to fetch" (generic)
- ❌ "TypeError: Cannot read properties..."
- ❌ Page crash

---

### Scenario 3: Backend Unavailable (Network Error)

**Steps**:
1. Start frontend (npm run dev)
2. Stop backend (Ctrl+C in uvicorn terminal)
3. Navigate to assessment page or refresh

**Expected Results**:
- ✅ Console shows: `API URL: http://127.0.0.1:8000/api/payment/history`
- ✅ Network tab shows connection refused or no request
- ✅ Error message displays (something like "Failed to fetch")
- ✅ Amber banner shows error without page crash
- ✅ User can still see page (not completely broken)

**Verification**:
- Check console for: `Fetch failed: TypeError: Failed to fetch`

---

### Scenario 4: Mixed Content (HTTPS Frontend + HTTP API)

**Steps**:
1. Artificially set frontend to HTTPS (not typical for localhost)
2. Keep API as HTTP
3. Attempt fetch

**Expected Results**:
- ✅ Mixed-content detection triggers
- ✅ Error message: "Mixed content blocked: frontend is HTTPS but API is HTTP..."
- ✅ Fetch prevented before attempt
- ✅ No CORS error in Network tab

**Note**: This is a safety check for production HTTPS deployments.

---

### Scenario 5: CORS Issue (Wrong Origin)

**Steps**:
1. Modify `backend/main.py` CORS to exclude your frontend origin
2. Try to fetch

**Expected Results**:
- ✅ Network tab shows CORS error: "Access to XMLHttpRequest... blocked by CORS policy"
- ✅ Error message displays
- ✅ No page crash

**Fix**:
```python
# Restore in backend/main.py
allow_origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

---

## 📊 Diagnostic Checklist

Before testing, verify all prerequisites:

- [ ] Backend running: `http://127.0.0.1:8000/health` returns 200
- [ ] Frontend running: `http://localhost:3000` loads
- [ ] Database connected: Health endpoint shows `db_status: connected`
- [ ] Environment variable set: `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`
- [ ] CORS configured: backend/main.py has explicit allow_origins
- [ ] Token stored: Open DevTools → Application → localStorage → "token" exists
- [ ] No console errors: F12 Console tab is clean (except expected logs)

---

## 🐛 Troubleshooting Decision Tree

```
Does the page load?
├─ YES: Continue to "Do you see purchase status?"
├─ NO: 
│  ├─ Is backend running? (http://127.0.0.1:8000/health)
│  │  ├─ NO: Start backend: python -m uvicorn main:app --reload
│  │  └─ YES: Continue to next check
│  └─ Is frontend running? (http://localhost:3000)
│     ├─ NO: Start frontend: npm run dev
│     └─ YES: Check console for errors (F12)

Do you see purchase status?
├─ YES (topics have badges): Everything working ✅
├─ NO (error banner shows):
│  ├─ "Please sign in...": User not authenticated → Sign in
│  ├─ "Session expired...": Token expired → Sign out, sign in again
│  ├─ "Server error...": Backend error (500+) → Check backend logs
│  ├─ "Not authorized...": Permission denied (403) → Check user role
│  └─ "Failed to fetch...": Network error → Check:
│     ├─ Backend running?
│     ├─ CORS configured?
│     ├─ Environment variable correct?
│     └─ Token in localStorage?

Is there a specific error message?
├─ Console error (F12 Console tab):
│  ├─ TypeError: Cannot read... → Backend response format issue
│  ├─ 401 Unauthorized → Token expired, sign in again
│  ├─ CORS error → Check allow_origins in backend/main.py
│  └─ Other: Copy error message and search for it
└─ No error, but topics don't show:
   └─ Check Network tab → payment/history response format
```

---

## ✔️ Success Indicators

### Visual
- [ ] Assessment page loads without errors
- [ ] Topics displayed with names
- [ ] Purchased quizzes have green "Purchased" badge
- [ ] Unpurchased quizzes have yellow "Get Access" button
- [ ] Can click "Take Quiz" on purchased topics
- [ ] No error banner visible (if user has purchases)

### Console (F12 → Console)
- [ ] Two logs visible:
  - `API URL: http://127.0.0.1:8000/api/payment/history`
  - `Token: eyJ...` (JWT token)
- [ ] No red error messages related to fetch
- [ ] No CORS errors

### Network (F12 → Network)
- [ ] `payment/history` request shows Status 200
- [ ] Response tab shows JSON with quiz_payments array
- [ ] No failed requests

### Application (F12 → Application)
- [ ] localStorage has "token" key with JWT value
- [ ] sessionStorage (if used) has expected values

---

## 📝 Test Result Template

Use this template to document your test:

```
Date: ___________
Tester: ___________

Test Scenario: [Name]
- Setup: [What was done]
- Expected: [What should happen]
- Actual: [What happened]
- Status: ☐ PASS  ☐ FAIL  ☐ SKIP

Console Logs:
[Paste relevant logs]

Network Response:
[Paste response from payment/history]

Issues Found:
[List any problems]

Notes:
[Any additional observations]
```

---

## 🚀 Test Execution Order

**Recommended Test Order**:

1. **Happy Path Test** (Scenario 1)
   - Simplest, most common case
   - If this fails, other tests won't help
   - Takes 2 minutes

2. **Session Expired Test** (Scenario 2)
   - Tests error handling
   - Takes 3 minutes

3. **Backend Unavailable Test** (Scenario 3)
   - Tests network failure handling
   - Takes 2 minutes

4. **CORS Test** (Scenario 5)
   - Tests security configuration
   - Takes 2 minutes

5. **Mixed Content Test** (Scenario 4)
   - Tests protocol safety
   - Takes 2 minutes (requires HTTPS setup)

**Total**: ~11 minutes for full test suite

---

## ✅ When Testing Is Complete

You should have verified:
- [x] Normal operation works
- [x] 401 errors handled gracefully
- [x] Network failures don't crash page
- [x] CORS properly configured
- [x] Protocol mismatches detected
- [x] Debug logging available
- [x] User-friendly error messages
- [x] No runtime crashes

---

## 📞 If Tests Fail

1. **Check Documentation**:
   - [FETCH_ERROR_FIX_FINAL_REPORT.md](FETCH_ERROR_FIX_FINAL_REPORT.md) - Complete analysis
   - [FETCH_ERROR_QUICK_VERIFICATION.md](FETCH_ERROR_QUICK_VERIFICATION.md) - Quick reference
   - [CODE_COMPARISON_BEFORE_AFTER.md](CODE_COMPARISON_BEFORE_AFTER.md) - What changed

2. **Check Backend Logs**:
   - Look for errors in terminal running uvicorn
   - Check database connection status

3. **Check Frontend Logs**:
   - F12 Console tab for exceptions
   - F12 Network tab for failed requests

4. **Verify Prerequisites**:
   - All environment variables set correctly
   - Backend and frontend both running
   - Correct URLs being used
   - CORS configuration matches

---

**Ready to test!** Follow the "Quick Test" section above to verify everything is working. You should see successful fetch requests within 2 minutes.
