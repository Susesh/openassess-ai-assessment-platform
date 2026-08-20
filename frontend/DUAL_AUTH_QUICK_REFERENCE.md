# Dual Authentication - Quick Reference Guide

## 🚀 Quick Start

### For Students

**Sign Up**
1. Go to `http://localhost:3000`
2. Click "Create account"
3. Fill in name, email, password
4. Click "Create account"
5. Redirected to `/dashboard`

**Sign In**
1. Go to `http://localhost:3000`
2. Enter email and password
3. Click "Sign in to Dashboard"
4. Redirected to `/dashboard`

### For Admins

**Admin Login**
1. Go to `http://localhost:3000/admin/login`
2. Enter admin email and password
3. Click "Sign in to Admin Dashboard"
4. Redirected to `/admin/dashboard`

---

## 📁 Key Files

### Authentication Context
- `contexts/auth-context.tsx` - Student auth
- `contexts/admin-auth-context.tsx` - Admin auth

### Components
- `components/login-form.tsx` - Student login/register
- `components/admin-login-form.tsx` - Admin login
- `components/auth-guard.tsx` - Protect student routes
- `components/admin-auth-guard.tsx` - Protect admin routes

### API
- `lib/api.ts` - API functions (includes `adminLogin()`)
- `lib/auth.ts` - Token management
- `lib/types.ts` - Type definitions

### Pages
- `app/page.tsx` - Student login/register page
- `app/admin/login/page.tsx` - Admin login page

---

## 🔑 Hooks

### useAuth() - Student Authentication

```typescript
import { useAuth } from "@/contexts/auth-context";

const { user, loading, login, register, logout } = useAuth();

// Login
await login(email, password);

// Register
await register(fullName, email, password);

// Logout
logout();
```

### useAdminAuth() - Admin Authentication

```typescript
import { useAdminAuth } from "@/contexts/admin-auth-context";

const { admin, loading, adminLogin, logout } = useAdminAuth();

// Login
await adminLogin(email, password);

// Logout
logout();
```

---

## 🔓 Route Protection

### Protect Student Routes

```typescript
import { AuthGuard } from "@/components/auth-guard";

export default function ProtectedPage() {
  return (
    <AuthGuard>
      <YourContent />
    </AuthGuard>
  );
}
```

### Protect Admin Routes

```typescript
import { AdminAuthGuard } from "@/components/admin-auth-guard";

export default function AdminPage() {
  return (
    <AdminAuthGuard>
      <YourAdminContent />
    </AdminAuthGuard>
  );
}
```

---

## 🎯 API Endpoints

### Student Endpoints
- `POST /auth/login` - Student login
- `POST /auth/register` - Student registration
- `GET /auth/me` - Get student profile

### Admin Endpoints
- `POST /admin/login` - Admin login
- `GET /admin/dashboard` - Admin dashboard (protected)

---

## 💾 Token Management

### Get Tokens

```typescript
import { getToken, getAdminToken } from "@/lib/auth";

const studentToken = getToken();
const adminToken = getAdminToken();
```

### Set Tokens

```typescript
import { setToken, setAdminToken } from "@/lib/auth";

setToken(accessToken);
setAdminToken(accessToken);
```

### Clear Tokens

```typescript
import { clearToken, clearAdminToken } from "@/lib/auth";

clearToken();    // Clear student token
clearAdminToken(); // Clear admin token
```

---

## ⚙️ Configuration

### Backend URL

Set in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Token Keys in localStorage

- Student: `openassess_token`
- Admin: `openassess_admin_token`

---

## ❌ Error Messages

### Student Login Errors
- "Incorrect email or password" → Wrong credentials
- "Inactive user account" → Account disabled
- "Email already registered" → Email exists (on register)

### Admin Login Errors
- "Invalid email or password" → Wrong credentials
- "Admin account is inactive" → Admin disabled
- "Admin access required" → Not an admin account

---

## 🧪 Testing Credentials

### Default Admin Account
- Email: `admin@openassess.com`
- Password: `Admin@123`

### Create Test Student Account
1. Go to `http://localhost:3000`
2. Register with any email/password

---

## 🔄 Authentication Flow

### Student Login
```
User Input → LoginForm → useAuth.login() 
→ /auth/login API → Token Stored → Redirect /dashboard
```

### Admin Login
```
User Input → AdminLoginForm → useAdminAuth.adminLogin() 
→ /admin/login API → Token Stored → Redirect /admin/dashboard
```

---

## 🛡️ Security Features

✅ JWT tokens with expiration  
✅ Role-based access control  
✅ Secure password hashing (bcrypt)  
✅ Separate tokens for each role  
✅ Automatic logout on invalid token  
✅ HTTPS recommended for production  

---

## 📊 Token Structure

### Student JWT
```
{
  "sub": "email@example.com",
  "role": "student",
  "exp": 1234567890
}
```

### Admin JWT
```
{
  "sub": "admin@example.com",
  "role": "admin",
  "type": "admin",
  "exp": 1234567890
}
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot reach backend" | Start backend: `cd backend && python -m uvicorn main:app --reload` |
| Login fails silently | Check browser console for errors |
| Redirect loop | Clear localStorage and re-login |
| Token not persisting | Check if localStorage is enabled |
| Admin cannot access dashboard | Verify admin token in localStorage |

---

## 🚀 Deployment Checklist

- [ ] Change default admin password
- [ ] Set strong SECRET_KEY in backend
- [ ] Configure CORS for specific domains
- [ ] Enable HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Test all authentication flows
- [ ] Implement rate limiting on login endpoints

---

## 📞 Support

For detailed information, see: `DUAL_AUTH_IMPLEMENTATION.md`

For hydration fixes, see: `HYDRATION_FIX_REPORT.md`

For system overview, see: `README.md`
