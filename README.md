# OpenAssess - AI-Powered Continuous Assessment Platform

OpenAssess is a comprehensive assessment platform that enables organizations to create, manage, and deliver adaptive quizzes with AI-powered feedback. The platform includes a complete admin portal for platform management.

## 🎯 Key Features

### For Students
- 📚 **Topic-based Assessments** - Take quizzes organized by topics and subtopics
- 🤖 **AI-Powered Feedback** - Get intelligent explanations for incorrect answers powered by Google Gemini
- 📊 **Performance Analytics** - Track your progress across topics with detailed heatmaps
- 📜 **Dual Certificates** - Earn participation and achievement certificates
- 🔒 **Proctored Sessions** - Take assessments with integrity monitoring
- 📱 **Responsive Design** - Access from any device

### For Administrators
- 👥 **User Management** - Manage student accounts, view performance statistics
- 📚 **Content Management** - Create and manage topics, subtopics, and questions
- 📈 **Advanced Analytics** - Real-time dashboard with platform metrics
- 📊 **Assessment Monitoring** - Track student performance and trends
- 📜 **Certificate Management** - Issue and revoke certificates
- 🔍 **Audit Logging** - Complete audit trail of all admin actions
- ⚙️ **System Health** - Monitor backend, database, and AI service status

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- PostgreSQL (or configured database)

### Setup & Run

**1. Backend Setup**
```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**2. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

**3. Access Application**
- Student Portal: `http://localhost:3000`
- Admin Portal: `http://localhost:3000/admin/login`
- API Docs: `http://127.0.0.1:8000/docs`

---

## 🔐 Admin Portal

### Default Admin Credentials
```
Email:    admin@openassess.com
Password: Admin@123
```

### Admin Dashboard
After login, the admin dashboard displays:
- **User Statistics** - Total users, active users, new signups
- **Assessment Metrics** - Total assessments, trends, completion rates
- **Performance Data** - Average scores, pass rates, topic performance
- **Certificate Summary** - Total, participation, and achievement certificates

### Admin Features
- ✅ User Management (view, suspend, activate, delete)
- ✅ Topic Management (create, edit, delete)
- ✅ Question Bank (manage questions by topic)
- ✅ Assessment Monitoring (track student performance)
- ✅ Certificate Management (issue, view, revoke)
- ✅ Advanced Analytics (trends, performance, growth)
- ✅ System Health Monitoring
- ✅ Complete Audit Logging

**📖 [Admin Portal Documentation](./ADMIN_INTEGRATION_REPORT.md)**  
**⚡ [Admin Quick Start Guide](./ADMIN_SETUP_QUICK_START.md)**

---

## 🏗️ Project Structure

```
OpenAssess/
├── backend/                    # FastAPI backend
│   ├── main.py                # Application entry point
│   ├── models/                # SQLAlchemy ORM models
│   │   ├── admin.py           # Admin user model
│   │   ├── user.py            # Student user model
│   │   ├── question.py        # Question model
│   │   ├── topic.py           # Topic model
│   │   ├── certificate.py     # Certificate model
│   │   ├── attempt.py         # Assessment attempt model
│   │   ├── result.py          # Assessment result model
│   │   ├── audit_log.py       # Audit logging model
│   │   └── ...
│   ├── schemas/               # Pydantic schemas
│   │   ├── admin.py           # Admin schemas
│   │   ├── admin_resources.py # Admin resource schemas
│   │   ├── question.py
│   │   ├── certificate.py
│   │   └── ...
│   ├── routes/                # API route handlers
│   │   ├── admin.py           # Admin endpoints (20+ routes)
│   │   ├── auth.py            # Authentication
│   │   ├── questions.py       # Question management
│   │   ├── quiz.py            # Quiz/assessment endpoints
│   │   ├── certificates.py    # Certificate endpoints
│   │   ├── analytics.py       # Analytics endpoints
│   │   └── ...
│   ├── services/              # Business logic
│   │   ├── admin_service.py   # Admin authentication & authorization
│   │   ├── analytics_service.py
│   │   ├── certificate_service.py
│   │   ├── ai_service.py      # Gemini integration
│   │   └── ...
│   ├── utils/                 # Utilities
│   │   ├── auth_utils.py      # Password hashing, JWT
│   │   ├── admin_deps.py      # RBAC dependencies
│   │   └── ...
│   ├── scripts/               # Maintenance scripts
│   │   ├── create_admin.py    # Create default admin account
│   │   └── ...
│   ├── database.py            # Database configuration
│   ├── requirements.txt       # Python dependencies
│   └── README.md              # Backend documentation
│
├── frontend/                  # Next.js frontend
│   ├── app/
│   │   ├── page.tsx           # Home page
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   ├── admin/             # Admin portal
│   │   │   ├── layout.tsx     # Admin layout with sidebar
│   │   │   ├── login/         # Admin login
│   │   │   ├── dashboard/     # Admin dashboard
│   │   │   ├── users/         # User management
│   │   │   ├── topics/        # Topic management
│   │   │   ├── questions/     # Question bank
│   │   │   ├── assessments/   # Assessment monitoring
│   │   │   ├── certificates/  # Certificate management
│   │   │   ├── analytics/     # Advanced analytics
│   │   │   ├── system/        # System health
│   │   │   ├── logs/          # Audit logs
│   │   │   └── ...
│   │   ├── dashboard/         # Student dashboard
│   │   │   ├── assessment/    # Take assessment
│   │   │   ├── portfolio/     # View certificates
│   │   │   └── ...
│   │   └── ...
│   ├── components/            # Reusable components
│   ├── lib/                   # Client libraries
│   │   ├── api.ts             # API client
│   │   ├── types.ts           # TypeScript types
│   │   ├── auth.ts            # Auth utilities
│   │   └── ...
│   ├── contexts/              # React contexts
│   ├── package.json           # Node dependencies
│   ├── tsconfig.json          # TypeScript config
│   ├── next.config.ts         # Next.js config
│   └── README.md              # Frontend documentation
│
├── ADMIN_INTEGRATION_REPORT.md    # Complete admin portal documentation
├── ADMIN_SETUP_QUICK_START.md     # Admin quick start guide
├── README.md                       # This file
└── start-backend.bat              # Windows backend startup script
└── start-frontend.bat             # Windows frontend startup script
```

---

## 🔄 How It Works

### Student Flow
1. Register/Login → Dashboard
2. Browse Topics → Select Assessment
3. Take Quiz → Submit Answers
4. View Results → Read AI Feedback
5. Earn Certificates → View in Portfolio
6. Track Progress → Analytics Dashboard

### Admin Flow
1. Login → Dashboard with Overview
2. View/Manage Users
3. Create/Edit Topics and Questions
4. Monitor Student Assessments
5. Issue/Revoke Certificates
6. Review Analytics and Trends
7. Monitor System Health
8. Review Audit Logs

---

## 🗄️ Database Schema

### Core Tables
- **admins** - Admin user accounts
- **users** - Student user accounts
- **topics** - Assessment topics
- **subtopics** - Topic subdivisions
- **questions** - Question bank
- **attempts** - Assessment attempts
- **results** - Assessment results
- **certificates** - Issued certificates
- **audit_logs** - Admin action history
- **proctoring_logs** - Integrity monitoring logs

---

## 🔐 Security Features

- ✅ JWT token-based authentication
- ✅ Bcrypt password hashing
- ✅ Role-based access control (RBAC)
- ✅ Admin-only routes with 403 Forbidden for unauthorized
- ✅ Complete audit trail of all admin actions
- ✅ CORS configuration (dev-friendly, tighten for production)
- ✅ Admin account status management (active/inactive)
- ✅ Token expiration and refresh
- ✅ Last login tracking

---

## 🌐 API Endpoints

### Public Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /questions` - Browse questions
- `GET /topics` - Get all topics

### Protected Student Endpoints (requires user token)
- `GET /me` - Get current user profile
- `POST /quiz/start` - Start assessment
- `POST /quiz/submit` - Submit assessment
- `GET /results` - Get assessment results
- `GET /certificates` - Get user certificates
- `GET /analytics` - Get user analytics

### Protected Admin Endpoints (requires admin token with role="admin")
- **Dashboard:** `GET /admin/dashboard`
- **Users:** `GET/POST/PUT/DELETE /admin/users/*`
- **Topics:** `GET/POST/PUT/DELETE /admin/topics/*`
- **Questions:** `GET/POST/PUT/DELETE /admin/questions/*`
- **Assessments:** `GET /admin/assessments`
- **Certificates:** `GET /admin/certificates`
- **Analytics:** `GET /admin/analytics/*`
- **System:** `GET /admin/system-health`
- **Logs:** `GET /admin/logs`

**Full API documentation:** `http://127.0.0.1:8000/docs`

---

## 🛠️ Technology Stack

### Backend
- **Framework:** FastAPI
- **ORM:** SQLAlchemy
- **Database:** PostgreSQL
- **Authentication:** JWT with python-jose
- **Password Hashing:** bcrypt/passlib
- **Validation:** Pydantic
- **AI:** Google Generative AI (Gemini)

### Frontend
- **Framework:** Next.js 14+
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** React Context
- **HTTP Client:** Fetch API

---

## 📝 Environment Configuration

### Backend (.env) - REQUIRED
```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/openassess

# Security Configuration (REQUIRED - Generate a secure key before running)
# Generate a secure SECRET_KEY using: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=your_secure_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=24

# Google AI Configuration (Required for AI-powered feedback)
GOOGLE_API_KEY=your_google_api_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_API_VERSION=v1
GEMINI_TIMEOUT_SECONDS=30
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### ⚠️ Security Notice
**The SECRET_KEY environment variable is REQUIRED for the application to start.** The application will fail to start if SECRET_KEY is not set. This is a security measure to prevent JWT token forgery attacks.

To generate a secure SECRET_KEY, run:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and set it as the SECRET_KEY in your .env file. Never commit your actual .env file to version control.

---

## 📊 Admin Portal Pages

| Page | URL | Purpose |
|------|-----|---------|
| Login | `/admin/login` | Admin authentication |
| Dashboard | `/admin/dashboard` | Platform overview & metrics |
| Users | `/admin/users` | User management |
| Topics | `/admin/topics` | Topic management |
| Subtopics | `/admin/subtopics` | Subtopic management |
| Questions | `/admin/questions` | Question bank |
| Assessments | `/admin/assessments` | Monitor assessments |
| Certificates | `/admin/certificates` | Manage certificates |
| Analytics | `/admin/analytics` | Advanced analytics |
| System | `/admin/system` | System health |
| Logs | `/admin/logs` | Audit logs |

---

## 🚀 Deployment

### Development
```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Production
1. Update environment variables
2. Build frontend: `npm run build`
3. Deploy backend with gunicorn/uvicorn
4. Configure reverse proxy (nginx/Apache)
5. Enable HTTPS
6. Update database connection
7. Change default admin password
8. Configure firewall rules

---

## 📚 Documentation

- [Admin Integration Report](./ADMIN_INTEGRATION_REPORT.md) - Complete admin portal documentation
- [Admin Quick Start](./ADMIN_SETUP_QUICK_START.md) - Quick setup guide
- [Backend README](./backend/README.md) - Backend documentation
- [Frontend README](./frontend/README.md) - Frontend documentation
- [API Docs](http://127.0.0.1:8000/docs) - Interactive Swagger documentation

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## 📄 License

OpenAssess is licensed under the MIT License.

---

## 📞 Support

For issues, questions, or suggestions:
- Check the documentation first
- Review the admin portal guide
- Check backend logs: `http://127.0.0.1:8000/docs`
- Contact the OpenAssess team

---

## 🎉 Getting Started

1. **[Quick Start Guide](./ADMIN_SETUP_QUICK_START.md)** - Get up and running in 5 minutes
2. **[Admin Portal Docs](./ADMIN_INTEGRATION_REPORT.md)** - Complete reference
3. **[API Documentation](http://127.0.0.1:8000/docs)** - Interactive Swagger UI
4. **Default Admin:** `admin@openassess.com` / `Admin@123`

---

**Happy Assessing!** 🎓