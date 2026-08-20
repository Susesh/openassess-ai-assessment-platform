OpenAssess — Developer Alignment & Execution
Document
📘 Project Overview
OpenAssess is an AI-powered continuous assessment platform where students can:
• Take unlimited assessments
• Learn from mistakes
• Retry anytime
• Build a verified knowledge portfolio
Core Philosophy
Learn → Assess → Improve → Retry → Mastery
👥 TEAM STRUCTURE (2 Developers)
Developer Responsibility
Developer A Backend + AI + Database
Developer B Frontend + Video + UI
🧠 DEVELOPER A — Backend & AI Architect
📌 Main Role
Developer A builds the core logic and backend systems of OpenAssess.
🛠 Tech Stack
• Python
• FastAPI
• PostgreSQL
• Gemini / GPT APIs
• SQLAlchemy / SQLModel
🔧 Responsibilities
1. Backend APIs
Build APIs for:
• Authentication
• Questions
• Quiz submission
• Scores
• Analytics
• Certifications
2. Database Setup
Create PostgreSQL tables for:
• Users
• Topics
• Subtopics
• Questions
• Attempts
• Results
• Certifications
3. AI Integration
Connect Gemini/GPT APIs for:
• AI question generation
• Answer explanation
• Gap analysis
• Adaptive difficulty
4. Assessment Logic
Implement:
• Score calculation
• Topic tracking
• Weak area detection
• Certification logic
5. Integrations
Connect backend with:
• EduCIBIL
• SkillsDrome
📅 Developer A Weekly Plan
Phase 1 — Setup & Question Bank (Weeks 1–3)
• Setup FastAPI project
• Setup PostgreSQL database
• Create Users, Topics, Questions tables
• Import sample question bank
• Build API to fetch questions
Phase 2 — Quiz Engine & AI (Weeks 4–6)
• Gemini/GPT integration
• AI question generation
• Quiz evaluation logic
• Score calculation
• Micro-certification logic
Phase 3 — Video & Security Backend (Weeks 7–9)
• Setup video storage
• Face detection backend logic
• Anti-cheat logs
Phase 4 — Remedial & Integrations (Weeks 10–12)
• Gap analysis engine
• SkillsDrome API integration
• EduCIBIL API integration
Phase 5 — Analytics & Optimization (Weeks 13–15)
• Employer verification API
• Analytics aggregation
• Backend optimization
• Security improvements
💻 DEVELOPER B — Frontend & Video Engineer
📌 Main Role
Developer B builds the user interface and video systems of OpenAssess.
🛠 Tech Stack
• Next.js
• React
• Tailwind CSS
• WebRTC
• MediaPipe
• Axios
🔧 Responsibilities
1. Frontend UI
Build:
• Login page
• Dashboard
• Quiz interface
• Portfolio page
• Heatmap analytics
2. Quiz Interface
Implement:
• Question display
• MCQ selection
• Submit flow
• Result visualization
• Progress tracking
3. Video Recording
Using WebRTC:
• Camera access
• Microphone access
• Video recording during assessment
4. Anti-Cheat UI
Implement:
• Face detection UI
• Eye tracking UI
• Camera permission checks
5. Dashboard & Analytics
Create:
• Progress heatmaps
• Topic mastery charts
• Knowledge portfolio dashboard
📅 Developer B Weekly Plan
Phase 1 — Setup & UI Foundation (Weeks 1–3)
• Setup Next.js project
• Setup Tailwind CSS
• Build Login UI
• Build Dashboard UI
• Build Topic Selection page
Phase 2 — Quiz Engine Frontend (Weeks 4–6)
• Build quiz interface
• Connect quiz APIs
• Build result screen
• Build certificate screen
Phase 3 — Video & Security UI (Weeks 7–9)
• Webcam integration
• Video recording UI
• System check screen
• Proctoring UI
Phase 4 — Remedial Screens (Weeks 10–12)
• Failure analytics screen
• Remedial dashboard
• Tutor scheduler UI
Phase 5 — Portfolio & Analytics (Weeks 13–15)
• Public knowledge portfolio
• Heatmap visualization
• Responsive UI improvements
• Animations and UI cleanup
🧱 PROJECT STRUCTURE
OpenAssess/
│
├── frontend/
│ ├── app/
│ ├── components/
│ ├── pages/
│ ├── services/
│ └── styles/
│
├── backend/
│ ├── main.py
│ ├── database.py
│ ├── models/
│ ├── routes/
│ ├── services/
│ └── ai/
│
└── project_brief.md
⚙️ TECH STACK
Area Technology
Frontend Next.js + Tailwind CSS
Backend FastAPI
Database PostgreSQL
AI Gemini / GPT
Video WebRTC
Proctoring MediaPipe / OpenCV
Hosting Vercel + Render/Railway
🔄 HOW BOTH DEVELOPERS WORK TOGETHER
Communication Flow
Frontend → Backend
Frontend sends requests:
GET /questions?topic=algebra
Backend returns:
{
"question": "2+2?",
"options": ["2","3","4","5"]
}
🛠 REQUIRED TOOLS
Tool Purpose
GitHub Code collaboration
Postman API testing
Trello Task management
Discord / Slack Communication
Cursor Coding assistant
🌍 GITHUB WORKFLOW
Rules
• Never send code via WhatsApp
• Always use GitHub branches
• Merge only tested code
Example Branches
feature/login-ui
feature/question-api
feature/quiz-engine
Workflow
1. Pull latest code
2. Create feature branch
3. Work on feature
4. Push to GitHub
5. Create pull request
6. Merge after testing
🚀 COMPLETE ROADMAP
PHASE 1 — Setup & Question Bank (Weeks 1–3)
Developer A
• Setup FastAPI
• Setup PostgreSQL
• Create database tables
• Import question bank
• Build APIs for topics/questions
Developer B
• Setup Next.js
• Setup Tailwind CSS
• Build login/signup pages
• Build dashboard
• Build topic selection page
PHASE 2 — Quiz Engine & AI (Weeks 4–6)
Developer A
• Gemini/GPT integration
• AI question generation
• Quiz scoring logic
• Certification generation
Developer B
• Quiz interface
• API integration
• Result screen
• Certificate UI
PHASE 3 — Video & Security (Weeks 7–9)
Developer A
• Video storage setup
• Face detection backend
• Anti-cheat logs
Developer B
• Webcam integration
• Recording functionality
• System check page
• Anti-cheat frontend
PHASE 4 — Remedial & Integrations (Weeks 10–12)
Developer A
• Gap analysis engine
• SkillsDrome integration
• EduCIBIL integration
Developer B
• Failure analysis UI
• Remedial dashboard
• Tutor scheduler UI
PHASE 5 — Analytics & Portfolio (Weeks 13–15)
Developer A
• Employer verification API
• Analytics aggregation
• Security audit
• Optimization
Developer B
• Public portfolio page
• Heatmap charts
• Mobile responsiveness
• UI cleanup
WEEK 16 — DEPLOYMENT
Backend Deployment
• Render
• Railway
Frontend Deployment
• Vercel
📚 MVP (MINIMUM VIABLE PRODUCT)
FIRST BUILD ONLY:
• Login system
• Quiz system
• Question fetching
• Score calculation
• Basic dashboard
• AI explanation
❌ DO NOT BUILD FIRST
Avoid initially:
• Advanced anti-cheat system
• Full AI automation
• Multi-board support
• Complex analytics
• Enterprise APIs
🤖 HOW TO USE CURSOR PROPERLY
✅ Good Usage
Use Cursor for:
• Boilerplate code
• API generation
• Database models
• Debugging
• Small feature generation
❌ Bad Usage
Do NOT ask: > “Build entire OpenAssess project.”
✅ Good Prompt Example
“Create FastAPI endpoint to fetch questions by topic from PostgreSQL.”
📌 CURSOR SETUP
Step 1
Create:
project_brief.md
Paste:
• Features
• Roles
• Architecture
• Roadmap
Step 2
Use prompts feature-by-feature.
🔥 GOLDEN RULES
Rule 1
One feature at a time.
Rule 2
Never accept code you don’t understand.
Rule 3
Frontend and Backend must agree on API structure before development.
Rule 4
Test every API before frontend integration.
Rule 5
Keep MVP simple and working.
🧠 FINAL PROJECT GOAL
The first successful version should allow:
1. User logs in
2. User selects topic
3. User takes quiz
4. Backend evaluates answers
5. AI explains mistakes
6. Dashboard tracks progress
If this flow works correctly: OpenAssess MVP is successful.