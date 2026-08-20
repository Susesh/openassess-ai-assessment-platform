# OpenAssess Certificate UI Flow

## User Interface Flow for Dual Certificate System

---

## 1. Assessment Selection Page

**URL:** `/dashboard/assessment`

**Components:**
- Topic card showing question count
- "Start Assessment" button

**UI:**
```
┌─────────────────────────────────────┐
│         Topic Card                  │
├─────────────────────────────────────┤
│ Python Programming                  │
│ 15 Questions | 4 Subtopics         │
│ [Start Assessment →]                │
└─────────────────────────────────────┘
```

**Flow:** User clicks "Start Assessment" → Navigate to quiz page

---

## 2. Assessment Taking Page

**URL:** `/dashboard/assessment/take?topic_id=1&topic_name=Python%20Programming`

**Components:**
- Question counter: "Question X of 10"
- Progress bar showing completion (X/10)
- Question navigation buttons (Previous/Next)
- Question number indicators (1, 2, 3, ... 10)
- Timer display
- Answer options (A, B, C, D)
- Previous/Next/Submit buttons

**Progress Stages:**

### Stage 1: Question 1-9
```
┌─────────────────────────────────────┐
│ Question 1 of 10                    │
│ [Progress: ██░░░░░░░░]              │
├─────────────────────────────────────┤
│ What is Python?                     │
│                                     │
│ ⦿ A: A programming language        │
│ ○ B: A snake species                │
│ ○ C: A documentary film             │
│ ○ D: A type of snake                │
├─────────────────────────────────────┤
│ [← Previous] [Next →]               │
│                                     │
│ [1] [2] [3] [4] [5] [6] [7] ...    │
└─────────────────────────────────────┘
```

### Stage 2: Last Question (Question 10)
```
┌─────────────────────────────────────┐
│ Question 10 of 10                   │
│ [Progress: ██████████]              │
├─────────────────────────────────────┤
│ Advanced Question...                │
├─────────────────────────────────────┤
│ [← Previous] [Submit Assessment]    │
│                                     │
│ [1] [2] ... [9] [10]               │
└─────────────────────────────────────┘
```

**User Actions:**
1. Select answer option (A/B/C/D)
2. Navigate to next question
3. Use question number indicator to jump
4. Click Submit on last question
5. Optional: Answer warning if skipping questions

**Flow:** User answers all questions → Click "Submit Assessment" → Navigate to results page

---

## 3. Assessment Results Page

**URL:** `/dashboard/assessment/results`

**Key Metrics:**
- Score display (percentage and X/Y format)
- Pass/Fail status badge
- Status color coding:
  - ✓ Green (80%+): Mastery threshold met
  - ! Yellow/Amber (60-79%): Keep practicing
  - ✗ Red (<60%): Needs improvement

**Layout:**

```
┌─────────────────────────────────────┐
│           ✓ (or !)                  │
│    MASTERY THRESHOLD MET (or keep   │
│          practicing)                │
│                                     │
│ Python Programming Assessment       │
│ Completed: June 18, 2026            │
│                                     │
├─────────────────────────────────────┤
│         FINAL SCORE                 │
│              80%                    │
│          8 of 10 correct            │
│                                     │
│ ┌──────────┬──────────┬──────────┐ │
│ │ Total    │Correct   │Incorrect │ │
│ │   10     │    8     │    2     │ │
│ ├──────────┴──────────┴──────────┤ │
│ │ Status: PASS                   │ │
│ └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Certificates Section

**Participation Certificate:**
- Always displayed
- Shows certificate ID
- "View" and "Download PDF" buttons

**Achievement Certificate:**
- Only displayed if score >= 70%
- Shows certificate ID
- "View" and "Download PDF" buttons
- Trophy emoji (🏆) indicator

**UI Layout:**

```
┌─────────────────────────────────────┐
│     CERTIFICATES EARNED             │
│                                     │
│ ┌──────────────┬──────────────────┐ │
│ │ ✓ Participation                │ │
│ │ OA-2026-ABC123                  │ │
│ │                                 │ │
│ │ [View] [Download PDF]           │ │
│ └──────────────┴──────────────────┘ │
│                                     │
│ ┌──────────────┬──────────────────┐ │
│ │ 🏆 Achievement                 │ │
│ │ OA-2026-DEF456                  │ │
│ │                                 │ │
│ │ [View] [Download Achievement]   │ │
│ └──────────────┴──────────────────┘ │
└─────────────────────────────────────┘
```

### AI Insight Section
```
┌─────────────────────────────────────┐
│ 💡 AI INSIGHT                       │
│                                     │
│ "Excellent work! You demonstrated  │
│  strong understanding across this  │
│  topic."                           │
└─────────────────────────────────────┘
```

### Strengths & Areas for Review
```
┌──────────────────┬──────────────────┐
│ ✓ Strengths      │ ! Areas for      │
│                  │   Review         │
│ • Question 1     │ • Question 5     │
│ • Question 2     │ • Question 8     │
│ • Question 3     │                  │
└──────────────────┴──────────────────┘
```

### Question Breakdown
```
┌─────────────────────────────────────┐
│ QUESTION BREAKDOWN                  │
│                                     │
│ Q1 ✓ Question text...              │
│    Explanation: ...                │
│                                     │
│ Q2 ✗ Question text...              │
│    AI: Your answer was wrong...    │
└─────────────────────────────────────┘
```

### Action Buttons
```
┌─────────────────────────────────────┐
│ [Return to Dashboard] [Retry] [View │
│  Portfolio]                         │
└─────────────────────────────────────┘
```

**Flow:**
- "View Certificate" → Navigate to certificate detail page
- "Download PDF" → Triggers PDF download in browser
- "Return to Dashboard" → Navigate to dashboard
- "Retry Assessment" → Navigate back to topic selection

---

## 4. Certificate Detail Page

**URL:** `/dashboard/certificates/{certificate_id}`

**Components:**

### For Participation Certificate:
```
┌─────────────────────────────────────┐
│        OPENASSESS LOGO              │
│    Certificate of Participation     │
│                                     │
│        This certifies that          │
│          John Doe                   │
│   participated in and completed    │
│    the Python Programming          │
│        assessment on               │
│        OpenAssess                   │
│                                     │
│ ┌────────────┬────────────────────┐ │
│ │ Score      │ Percentage         │ │
│ │  8/10      │      80%           │ │
│ ├────────────┼────────────────────┤ │
│ │ ID         │ Date               │ │
│ │OA-2026-AB..│ June 18, 2026      │ │
│ └────────────┴────────────────────┘ │
│                                     │
│     [QR Code Placeholder]           │
│                                     │
│ [Download PDF] [← Back to Dashboard]│
└─────────────────────────────────────┘
```

### For Achievement Certificate:
```
┌─────────────────────────────────────┐
│        🏆 OPENASSESS LOGO           │
│    Certificate of Achievement       │
│                                     │
│        This certifies that          │
│          John Doe                   │
│    has successfully achieved        │
│      a score of 80% in the         │
│    Python Programming assessment   │
│   and demonstrated proficiency in  │
│        the subject                  │
│                                     │
│ ┌────────────┬────────────────────┐ │
│ │ Score      │ Percentage         │ │
│ │  8/10      │      80%           │ │
│ ├────────────┼────────────────────┤ │
│ │ ID         │ Date               │ │
│ │OA-2026-DE..│ June 18, 2026      │ │
│ └────────────┴────────────────────┘ │
│                                     │
│     [QR Code Placeholder]           │
│                                     │
│ [Download PDF] [← Back to Dashboard]│
└─────────────────────────────────────┘
```

**Differences:**
- Achievement has trophy icon (🏆)
- Different certificate titles
- Different descriptive text
- Both contain score, percentage, ID, date

**User Actions:**
- Download PDF button → Downloads certificate file
- Back button → Returns to previous page or dashboard

---

## 5. Dashboard - Certificates Section

**URL:** `/dashboard`

**Components:**

### Certificate Statistics
```
┌──────────────────────┬──────────────────────┐
│ Participation        │ Achievement          │
│ Certificates         │ Certificates         │
│                      │                      │
│ 5                    │ 3                    │
└──────────────────────┴──────────────────────┘
```

### Recent Certificates List
```
┌──────────────────────────────────────┐
│ CERTIFICATES (LAST 3)                │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ Python Programming             │  │
│ │ ✓ Participation | 80% | Jun 18 │  │
│ │ [View Certificate]             │  │
│ └────────────────────────────────┘  │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ Java Programming               │  │
│ │ 🏆 Achievement | 85% | Jun 17  │  │
│ │ [View Certificate]             │  │
│ └────────────────────────────────┘  │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ Web Development                │  │
│ │ ✓ Participation | 60% | Jun 16 │  │
│ │ [View Certificate]             │  │
│ └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**Badge Indicators:**
- ✓ Participation (indigo)
- 🏆 Achievement (emerald/green)

---

## 6. Portfolio Page

**URL:** `/dashboard/portfolio`

**Certificates organized by type:**

### Section 1: Achievement Certificates
```
┌─────────────────────────────────────┐
│ ACHIEVEMENT CERTIFICATES            │
│ (Score >= 70%)                      │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ Python Programming - 80%      │  │
│ │ [View] [Download]             │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ Java Programming - 85%        │  │
│ │ [View] [Download]             │  │
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Section 2: Participation Certificates
```
┌─────────────────────────────────────┐
│ PARTICIPATION CERTIFICATES          │
│ (All completed assessments)         │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ C Programming - 55%           │  │
│ │ [View] [Download]             │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ SQL Database - 72%            │  │
│ │ [View] [Download]             │  │
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Sorting/Filtering Options:**
- Sort by date (newest first)
- Sort by score (highest first)
- Filter by certificate type
- Filter by topic

---

## 7. PDF Certificate Generation

**File Name:** `{certificate_id}.pdf`
Example: `OA-2026-ABC123.pdf`

**PDF Layout:**

```
┌────────────────────────────────────────┐
│                                        │
│              OpenAssess                │
│   [Certificate of Participation]       │
│                                        │
│          This certifies that           │
│                                        │
│              John Doe                  │
│                                        │
│        participated in and             │
│          completed the                 │
│                                        │
│      Python Programming Assessment     │
│                                        │
│  Score: 8/10    Percentage: 80%        │
│                                        │
│ Certificate ID: OA-2026-ABC123         │
│ Date: 18/06/2026                       │
│                                        │
│       [QR Code Placeholder]            │
│                                        │
└────────────────────────────────────────┘
```

**PDF Features:**
- Landscape orientation
- A4 page size
- Professional border (color-coded by type)
- Clear typography
- QR Code placeholder area
- Digital signature placeholder area

---

## State Management

### Quiz Session Storage

```javascript
// Stored in localStorage after quiz completion
{
  topicName: "Python Programming",
  questions: [...],
  result: {
    score: 8,
    total: 10,
    passed: true,
    percentage: 80.0,
    completed_at: "2026-06-18T15:30:00",
    participation_certificate: {...},
    achievement_certificate: {...},
    results: [...]
  }
}
```

### Certificate Type Display Logic

```
If achievement_certificate === null:
  - Show only Participation Certificate section
  - Hide Achievement Certificate section
  - Message: "1 certificate earned"

If achievement_certificate !== null:
  - Show both certificate sections
  - Display trophy icon for achievement
  - Message: "2 certificates earned"
```

---

## Color Scheme

### Certificate Types

**Participation:**
- Primary: Indigo-600 (#4F46E5)
- Background: Indigo-50 (#EEF2FF)
- Badge: ✓ symbol
- Accent: Indigo theme

**Achievement:**
- Primary: Emerald-600 (#059669)
- Background: Emerald-50 (#F0FDF4)
- Badge: 🏆 symbol
- Accent: Emerald theme

### Status Colors

**Pass (80%+):**
- Color: Emerald-600
- Icon: ✓
- Message: "Mastery threshold met"

**Good (60-79%):**
- Color: Indigo-600
- Icon: →
- Message: "Keep practicing"

**Needs Work (<60%):**
- Color: Amber-600
- Icon: !
- Message: "Review and retry"

---

## Responsive Design

### Mobile (< 640px)
- Single column layout
- Stacked certificate cards
- Touch-friendly buttons (48x48px minimum)
- Full-width inputs and buttons

### Tablet (640px - 1024px)
- Two-column layout where appropriate
- Side-by-side certificate cards
- Optimized touch targets

### Desktop (> 1024px)
- Multi-column layouts
- Three-column certificate grids
- Hover states for interactions
- Keyboard navigation support

---

## Accessibility

### WCAG 2.1 Compliance

**Required Elements:**
- Semantic HTML (button, link, heading tags)
- ARIA labels for interactive elements
- Color contrast ratio ≥ 4.5:1 for text
- Keyboard navigation support
- Focus indicators
- Screen reader support

**Implementation:**
```html
<!-- Example: Certificate button with label -->
<button
  aria-label="Download Participation Certificate OA-2026-ABC123"
  onClick={() => downloadCertificatePdf(cert)}
>
  Download PDF
</button>
```

---

## Error Handling

### Certificate Not Found
```
┌─────────────────────────────────────┐
│ ⚠️ ERROR                            │
│                                     │
│ Certificate not found.              │
│ It may have been deleted or you     │
│ don't have permission to view it.   │
│                                     │
│ [Back to Dashboard] [View All Certs]│
└─────────────────────────────────────┘
```

### PDF Generation Failed
```
┌─────────────────────────────────────┐
│ ⚠️ ERROR                            │
│                                     │
│ Could not generate PDF. Try again   │
│ or contact support.                 │
│                                     │
│ [Retry] [Contact Support]           │
└─────────────────────────────────────┘
```

---

## Loading States

### Quiz Results Loading
```
┌─────────────────────────────────────┐
│        🔄 Loading results…          │
│                                     │
│     Please wait while we            │
│     generate your certificates...   │
└─────────────────────────────────────┘
```

### PDF Download Loading
```
Downloading... OA-2026-ABC123.pdf
[████████░░] 80%
```

---

## Success Messages

### After Quiz Submission
```
┌─────────────────────────────────────┐
│        ✓ Assessment Complete        │
│                                     │
│ Your certificates are ready!        │
│                                     │
│ • Participation Certificate         │
│ • Achievement Certificate           │
└─────────────────────────────────────┘
```

### After PDF Download
```
✓ Certificate downloaded successfully
  OA-2026-ABC123.pdf
```

---

## Navigation Flow

```
Assessment Selection
        ↓
    Take Assessment
        ↓
   Submit Answers
        ↓
    View Results (with both certs)
        ↓
    ├─→ View Participation Cert
        ├─→ Download Participation PDF
        └─→ Back to Results
        ├─→ View Achievement Cert (if earned)
        ├─→ Download Achievement PDF (if earned)
        └─→ Back to Results
        ├─→ Return to Dashboard
        ├─→ View Portfolio
        └─→ Retry Assessment
        ↓
    Dashboard (shows cert statistics)
        ↓
    Portfolio (view all certificates)
```

---

## User Journey Example

1. User views assessment topic showing "10 Questions"
2. Clicks "Start Assessment"
3. Answers 10 questions with progress tracking
4. Clicks "Submit Assessment" on question 10
5. Sees results page showing:
   - Score: 80% (8/10)
   - Status: PASS ✓
   - Certificates Earned section with both certificates
6. Clicks "View Achievement Certificate"
7. Sees full certificate with trophy icon
8. Clicks "Download PDF"
9. Browser downloads: `OA-2026-ABC123.pdf`
10. Returns to Dashboard
11. Sees certificate statistics updated

---

## Animation & Transitions

### Page Transitions
- Fade in/out: 300ms
- Slide up on results page: 500ms (staggered)

### Certificate Display
- Fade in certificates: 400ms
- Hover effects: 150ms

### PDF Download
- Button visual feedback: 200ms
- Download progress: Real-time

