# OpenAssess Dual Authentication System - Implementation Guide

## Overview

The OpenAssess platform now supports two distinct authentication flows:
1. **Student Authentication** - For regular users accessing the student dashboard
2. **Admin Authentication** - For administrators accessing the admin portal

This document explains the architecture, implementation, and usage of the dual authentication system.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Endpoints](#api-endpoints)
3. [Frontend Components](#frontend-components)
4. [Authentication Flow](#authentication-flow)
5. [Token Management](#token-management)
6. [Role-Based Access Control](#role-based-access-control)
7. [Error Handling](#error-handling)
8. [File Modifications](#file-modifications)
9. [Security Considerations](#security-considerations)
10. [Testing Guide](#testing-guide)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend Application                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Root Layout (app/layout.tsx)                         │   │
│  │ - Provides AuthProvider (Student)                    │   │
│  │ - Provides AdminAuthProvider (Admin)                 │   │
│  └──────────────────────────────────────────────────────┘   │
│          │                              │                    │
│          ▼                              ▼                    │
│  ┌─────────────────────┐      ┌──────────────────────┐      │
│  │  Student Routes     │      │  Admin Routes        │      │
│  │  - /                │      │  - /admin/dashboard  │      │
│  │  - /dashboard       │      │  - /admin/login      │      │
│  │  - /quiz/*          │      │  - /admin/users      │      │
│  └─────────────────────┘      │  - /admin/topics     │      │
│                               │  - /admin/questions  │      │
│                               └──────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (FastAPI)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Authentication Endpoints                             │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ POST /auth/login - Student authentication            │   │
│  │ POST /auth/register - Student registration           │   │
│  │ GET  /auth/me - Get current student profile          │   │
│  │ POST /admin/login - Admin authentication             │   │
│  │ GET  /admin/dashboard - Admin dashboard (protected)  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Protected Resources                                  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Student Resources: /topics, /quiz, /results, etc     │   │
│  │ Admin Resources: /admin/users, /admin/topics, etc    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Student Authentication

**POST /auth/login**
- **Purpose**: Authenticate a student user
- **Request**:
  ```
  Content-Type: application/x-www-form-urlencoded
  username=email@example.com&password=securepassword
  ```
- **Response**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "role": "student"
  }
  ```
- **Status Codes**:
  - 200: Successful login
  - 401: Invalid credentials
  - 403: Inactive account

**POST /auth/register**
- **Purpose**: Register a new student account
- **Request**:
  ```json
  {
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
- **Response**: Student profile object
- **Status Codes**:
  - 201: Account created
  - 400: Email already registered

**GET /auth/me**
- **Purpose**: Get current authenticated student's profile
- **Headers**: `Authorization: Bearer {token}`
- **Response**: Student profile object

### Admin Authentication

**POST /admin/login**
- **Purpose**: Authenticate an admin user
- **Request**:
  ```json
  {
    "email": "admin@openassess.com",
    "password": "secureadminpassword"
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "role": "admin",
    "admin": {
      "id": 1,
      "name": "System Administrator",
      "email": "admin@openassess.com",
      "role": "admin",
      "is_active": true,
      "created_at": "2026-01-01T00:00:00",
      "last_login": "2026-06-18T12:00:00"
    }
  }
  ```
- **Status Codes**:
  - 200: Successful login
  - 401: Invalid credentials
  - 403: Admin access denied or inactive account

---

## Frontend Components

### 1. Auth Context (`contexts/auth-context.tsx`)

Manages student authentication:
- Stores student user data
- Manages student JWT token
- Handles student login/register/logout
- Provides `useAuth()` hook for components

```typescript
const { user, loading, login, register, logout } = useAuth();
```

### 2. Admin Auth Context (`contexts/admin-auth-context.tsx`)

Manages admin authentication:
- Stores admin user data
- Manages admin JWT token
- Handles admin login/logout
- Provides `useAdminAuth()` hook for components

```typescript
const { admin, loading, adminLogin, logout } = useAdminAuth();
```

### 3. Login Components

#### LoginForm (`components/login-form.tsx`)
- **Purpose**: Student login and registration form
- **Features**:
  - Toggle between login and register modes
  - Email and password validation
  - Error messages with helpful hints
  - Redirects to `/dashboard` after successful login
  - Shows error if admin credentials used (suggests using Admin Login)

#### AdminLoginForm (`components/admin-login-form.tsx`)
- **Purpose**: Admin-only login form
- **Features**:
  - Admin email and password fields
  - Helpful error messages
  - Redirects to `/admin/dashboard` after successful login
  - Shows error if student credentials used (suggests using Student Login)
  - Link to student login page

### 4. Auth Guards

#### AuthGuard (`components/auth-guard.tsx`)
- **Purpose**: Protects student routes
- **Behavior**:
  - Checks for student JWT token
  - Redirects to `/` if not authenticated
  - Shows loading state

#### AdminAuthGuard (`components/admin-auth-guard.tsx`)
- **Purpose**: Protects admin routes
- **Behavior**:
  - Checks for admin JWT token
  - Redirects to `/admin/login` if not authenticated
  - Prevents students from accessing admin routes
  - Shows loading state

---

## Authentication Flow

### Student Login Flow

```
1. User visits http://localhost:3000/ or /dashboard
2. LoginForm component displays
3. User enters email and password
4. Form submits to apiLogin() (POST /auth/login)
5. Backend validates credentials
6. Backend returns JWT token + student role
7. Frontend stores token in localStorage (key: openassess_token)
8. useAuth() context updates with user data
9. Router redirects to /dashboard
10. Dashboard page uses AuthGuard to verify authentication
```

### Admin Login Flow

```
1. Admin visits http://localhost:3000/admin/login
2. AdminLoginForm component displays
3. Admin enters email and password
4. Form submits to apiAdminLogin() (POST /admin/login)
5. Backend validates admin credentials
6. Backend returns JWT token + admin role + admin info
7. Frontend stores token in localStorage (key: openassess_admin_token)
8. useAdminAuth() context updates with admin data
9. Router redirects to /admin/dashboard
10. Admin layout uses admin token for authenticated requests
```

### Error Handling

#### Student Login with Admin Credentials
```
1. User enters admin email/password in StudentLoginForm
2. Backend rejects with 401: "Incorrect email or password"
3. Frontend catches error
4. Shows message: "Invalid email or password. If you're an admin, please use the Admin Login option."
5. User navigates to /admin/login
```

#### Admin Login with Student Credentials
```
1. Admin enters student email/password in AdminLoginForm
2. Backend rejects with 401: "Invalid email or password"
3. Frontend catches error
4. Shows message: "Invalid email or password. If you're a student, please use the Student Login..."
5. Admin navigates back to student login
```

---

## Token Management

### Token Storage

**Student Token**
- Key: `openassess_token`
- Storage: localStorage
- Format: JWT string
- Lifetime: 7 days (configured in backend)

**Admin Token**
- Key: `openassess_admin_token`
- Storage: localStorage
- Format: JWT string with "type": "admin" claim
- Lifetime: 7 days (configured in backend)

### Token Operations

#### Setting Tokens
```typescript
// Student token
import { setToken } from "@/lib/auth";
setToken(accessToken);

// Admin token
import { setAdminToken } from "@/lib/auth";
setAdminToken(accessToken);
```

#### Retrieving Tokens
```typescript
// Student token
const token = getToken(); // Returns null on server-side

// Admin token
const adminToken = getAdminToken(); // Returns null on server-side
```

#### Clearing Tokens
```typescript
// Student logout
import { clearToken } from "@/lib/auth";
clearToken();

// Admin logout
import { clearAdminToken } from "@/lib/auth";
clearAdminToken();
```

### Token Usage in API Calls

Tokens are automatically attached to all authenticated requests:

```typescript
// In lib/api.ts request() function
async function request<T>(path: string, init: RequestInit = {}, isAdmin = false): Promise<T> {
  const token = isAdmin ? getAdminToken() : getToken();
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  // ... rest of request logic
}
```

---

## Role-Based Access Control

### Student Access Control

**Allowed Routes**:
- `/` - Main login/register page
- `/dashboard` - Student dashboard
- `/dashboard/assessment` - Assessment page
- `/quiz/*` - Quiz pages
- `/results` - Results page
- `/certificates` - Certificates page

**Protected By**:
- `AuthGuard` component
- Student JWT token validation
- Redirect to `/` if not authenticated

### Admin Access Control

**Allowed Routes**:
- `/admin/login` - Admin login (accessible without token)
- `/admin/dashboard` - Admin dashboard
- `/admin/users` - User management
- `/admin/topics` - Topic management
- `/admin/questions` - Question management
- `/admin/certificates` - Certificate management
- `/admin/analytics` - Analytics dashboard

**Protected By**:
- Admin layout authentication checks
- Admin JWT token validation with "type": "admin" claim
- Redirect to `/admin/login` if not authenticated

### Cross-Role Prevention

```typescript
// In API request function
async function request<T>(path: string, init: RequestInit = {}, isAdmin = false): Promise<T> {
  // Ensures correct token is used based on endpoint
  const token = isAdmin ? getAdminToken() : getToken();
  
  // Admin endpoints will reject student tokens with 403
  // Student endpoints will reject admin tokens with 403
}
```

---

## Error Handling

### Error Response Format

Backend returns error messages in this format:

```json
{
  "detail": "Error message or list of error details"
}
```

### Common Errors

| Status | Scenario | Message |
|--------|----------|---------|
| 400 | Email already registered | "Email already registered" |
| 401 | Invalid credentials | "Incorrect email or password" or "Invalid email or password" |
| 403 | Account inactive | "Inactive user account" or "Admin account is inactive" |
| 403 | Admin access denied | "Admin access required" |
| 500 | Backend error | "Internal server error" |

### Error Handling in Frontend

```typescript
try {
  await login(email, password);
} catch (err) {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      // Wrong credentials
      setError("Invalid credentials. If you're an admin, use Admin Login.");
    } else if (err.status === 403) {
      // Account inactive
      setError("Your account is inactive. Contact support.");
    } else {
      // Other error
      setError(err.message);
    }
  }
}
```

---

## File Modifications

### Created Files

1. **`frontend/contexts/admin-auth-context.tsx`**
   - New admin authentication context
   - Manages admin user state and login
   - Provides `useAdminAuth()` hook

2. **`frontend/components/admin-login-form.tsx`**
   - New admin login form component
   - Designed to match student login form styling
   - Shows helpful error messages

3. **`frontend/components/admin-auth-guard.tsx`**
   - New admin route protection component
   - Prevents student access to admin routes

### Modified Files

1. **`frontend/lib/types.ts`**
   - Added `Admin` type definition
   - Added `AdminTokenResponse` type
   - Supports admin data structure

2. **`frontend/lib/auth.ts`**
   - Added `getAdminToken()` function
   - Added `setAdminToken()` function
   - Added `clearAdminToken()` function

3. **`frontend/lib/api.ts`**
   - Updated imports to include admin types
   - Added `adminLogin()` function for admin authentication
   - Modified `request()` function to support admin token parameter

4. **`frontend/components/login-form.tsx`**
   - Updated error messages to suggest Admin Login
   - Added `useAdminAuth` hook import
   - Improved error handling for role-specific failures

5. **`frontend/app/layout.tsx`**
   - Added `AdminAuthProvider` wrapper
   - Provides admin context to entire app

6. **`frontend/app/admin/login/page.tsx`**
   - Replaced old implementation with new design
   - Now uses `AdminLoginForm` component
   - Uses `AnimatedBackground` for consistency

---

## Security Considerations

### Token Security

1. **Token Storage**: Tokens stored in localStorage are accessible to JavaScript
   - Consider implementing secure storage with httpOnly cookies for production
   - Current implementation suitable for development

2. **Token Expiration**: Tokens expire after 7 days
   - Users must re-login after expiration
   - Implement refresh token mechanism for seamless experience (future enhancement)

3. **CORS**: Backend enables CORS for development
   - Production should restrict to specific domains
   - Current config: `allow_origin_regex=r"^https?://.*$"`

### Password Security

1. **Minimum Length**: Passwords must be 8-72 characters
2. **Hashing**: Backend uses bcrypt for password hashing
3. **Validation**: Backend validates password strength

### Role-Based Security

1. **JWT Claims**: Tokens include role information
   - Admin tokens have "type": "admin" and "role": "admin"
   - Student tokens have "role": "student"

2. **Endpoint Protection**: All admin endpoints require admin role
   - Students attempting admin access receive 403 Forbidden

3. **Frontend Protection**: Routes protected by appropriate guards
   - Additional backend validation ensures defense-in-depth

### Recommendations for Production

1. **HTTPS/SSL**: Always use HTTPS for authentication
2. **Secure Cookies**: Store tokens in httpOnly, Secure cookies
3. **Rate Limiting**: Implement rate limiting on login endpoints
4. **Account Lockout**: Implement temporary account lockout after failed attempts
5. **Audit Logging**: Log all authentication attempts
6. **Two-Factor Authentication**: Consider implementing 2FA for admin accounts
7. **Environment Variables**: Use strong, unique SECRET_KEY in production
8. **Admin Credentials**: Change default admin password immediately

---

## Testing Guide

### Testing Student Authentication

1. **Student Registration**
   ```
   - Go to http://localhost:3000
   - Click "Create account"
   - Enter name, email, password
   - Click "Create account"
   - Should redirect to /dashboard
   ```

2. **Student Login**
   ```
   - Go to http://localhost:3000
   - Enter registered email and password
   - Click "Sign in to Dashboard"
   - Should redirect to /dashboard
   - Admin info should display in layout
   ```

3. **Student Login with Wrong Credentials**
   ```
   - Enter invalid email/password
   - Should show error: "Invalid email or password..."
   ```

### Testing Admin Authentication

1. **Admin Login**
   ```
   - Go to http://localhost:3000/admin/login
   - Enter admin email and password
   - Click "Sign in to Admin Dashboard"
   - Should redirect to /admin/dashboard
   ```

2. **Admin Login with Wrong Credentials**
   ```
   - Enter invalid email/password
   - Should show error with suggestion to use Student Login
   ```

### Testing Access Control

1. **Student Cannot Access Admin Routes**
   ```
   - Login as student
   - Manually navigate to /admin/dashboard
   - Should redirect to /
   ```

2. **Admin Cannot Access Student Routes as Student**
   ```
   - Login as admin
   - Clear admin_token from localStorage
   - Manually navigate to /dashboard
   - Should redirect to / (student login)
   ```

3. **Non-Authenticated User Cannot Access Protected Routes**
   ```
   - Clear all tokens from localStorage
   - Navigate to /dashboard
   - Should redirect to /
   - Navigate to /admin/dashboard
   - Should redirect to /admin/login
   ```

### Testing Token Management

1. **Token Storage**
   ```
   - Login as student
   - Open browser DevTools > Application > Local Storage
   - Should see "openassess_token"
   - Login as admin
   - Should see "openassess_admin_token"
   ```

2. **Token Expiration**
   ```
   - Set token expiration to 1 minute in backend (for testing)
   - Wait 1 minute
   - Make authenticated request
   - Should fail with 401 Unauthorized
   ```

### Testing Error Scenarios

1. **Backend Offline**
   ```
   - Stop backend server
   - Try to login
   - Should show backend unreachable error
   ```

2. **Inactive Account**
   ```
   - In database, set user.is_active = false
   - Try to login
   - Should show "Inactive user account" error
   ```

3. **Admin with Student Credentials**
   ```
   - Go to /admin/login
   - Enter student email/password
   - Should show error suggesting Student Login
   ```

---

## API Reference Summary

### Request Headers

```
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
```

### Response Headers

```
Content-Type: application/json
Access-Control-Allow-Origin: {configured}
```

### HTTP Status Codes

- **200**: Successful request
- **201**: Resource created
- **400**: Bad request (invalid data)
- **401**: Unauthorized (invalid credentials)
- **403**: Forbidden (access denied)
- **500**: Internal server error

---

## Troubleshooting

### "Cannot reach backend" Error

**Cause**: Backend server not running
**Solution**:
```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### "Invalid email or password" Error

**Cause 1**: Wrong credentials entered
**Solution**: Verify email and password

**Cause 2**: Account doesn't exist
**Solution**: Register account first

**Cause 3**: Using student credentials for admin login
**Solution**: Use admin email and password, or go to student login

### Token Not Persisting

**Cause**: JavaScript disabled or localStorage blocked
**Solution**: Enable JavaScript and ensure localStorage is accessible

### Redirect Loop

**Cause**: Missing or invalid token
**Solution**: Clear localStorage and re-login

---

## Future Enhancements

1. **Refresh Tokens**: Implement refresh token mechanism for better UX
2. **Social Login**: Add OAuth/SSO support
3. **Two-Factor Authentication**: Implement 2FA for admin accounts
4. **Remember Me**: Implement "remember me" functionality
5. **Session Management**: Add session timeout and warnings
6. **Login History**: Track login history and suspicious activity
7. **Mobile App**: Native mobile app with secure storage

---

## Conclusion

The dual authentication system in OpenAssess provides:
- ✅ Separate student and admin authentication flows
- ✅ Role-based access control
- ✅ Secure JWT token management
- ✅ Consistent UI/UX across login pages
- ✅ Comprehensive error handling
- ✅ Production-ready security considerations

For questions or issues, refer to the troubleshooting section or check the relevant source files.
