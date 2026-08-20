export const STUDENT = {
  name: "Jordan Smith",
  email: "jordan.smith@university.edu",
  initials: "JS",
  memberSince: "September 2025",
} as const;

export const DASHBOARD_STATS = [
  {
    label: "Completed Quizzes",
    value: "24",
    change: "+3 this week",
    progress: 72,
  },
  {
    label: "Mastery Score",
    value: "78%",
    change: "+5% vs last month",
    progress: 78,
  },
  {
    label: "Hours Studied",
    value: "42h",
    change: "12h this week",
    progress: 58,
  },
] as const;

export const RECENT_ACTIVITY = [
  {
    title: "Computer Science Quiz",
    detail: "Scored 67% — reviewed Big O notation",
    time: "2 hours ago",
    type: "quiz" as const,
  },
  {
    title: "Algebra I Certification",
    detail: "Earned micro-credential · 92% mastery",
    time: "Yesterday",
    type: "cert" as const,
  },
  {
    title: "Physics Assessment",
    detail: "Retry scheduled · Mechanics unit",
    time: "3 days ago",
    type: "retry" as const,
  },
] as const;

export const TOPIC_MASTERY = [
  { topic: "Computer Science", percent: 78, color: "bg-indigo-500" },
  { topic: "Mathematics", percent: 92, color: "bg-violet-500" },
  { topic: "Physics", percent: 54, color: "bg-sky-500" },
  { topic: "History", percent: 41, color: "bg-amber-500" },
] as const;

export const TOPICS = [
  {
    id: "mathematics",
    title: "Mathematics",
    description:
      "Algebra, calculus, and quantitative reasoning — build durable problem-solving skills.",
    questions: 20,
    mastery: 92,
    difficulty: "Intermediate",
    accent: "from-violet-500 to-purple-600",
  },
  {
    id: "computer-science",
    title: "Computer Science",
    description:
      "Programming fundamentals, data structures, and systems thinking for developers.",
    questions: 20,
    mastery: 78,
    difficulty: "Intermediate",
    accent: "from-indigo-500 to-blue-600",
  },
  {
    id: "history",
    title: "History",
    description:
      "World events, civilizations, and evidence-based analysis across eras.",
    questions: 15,
    mastery: 41,
    difficulty: "Beginner",
    accent: "from-amber-500 to-orange-600",
  },
  {
    id: "physics",
    title: "Physics",
    description:
      "Mechanics, energy, and motion through applied science scenarios.",
    questions: 18,
    mastery: 54,
    difficulty: "Advanced",
    accent: "from-sky-500 to-cyan-600",
  },
] as const;

export const CERTIFICATIONS = [
  {
    title: "Python Basics",
    issued: "March 2026",
    topic: "Computer Science",
    score: 88,
  },
  {
    title: "Algebra I",
    issued: "February 2026",
    topic: "Mathematics",
    score: 92,
  },
  {
    title: "Mechanics Fundamentals",
    issued: "January 2026",
    topic: "Physics",
    score: 76,
  },
] as const;

/** 12 weeks × 7 days — intensity 0–4 for heatmap */
export const HEATMAP_DATA: number[][] = [
  [0, 1, 2, 1, 3, 2, 0],
  [1, 2, 3, 2, 1, 4, 2],
  [2, 1, 0, 3, 2, 3, 1],
  [0, 2, 4, 3, 2, 1, 0],
  [1, 3, 2, 4, 3, 2, 1],
  [2, 2, 1, 0, 2, 3, 2],
  [3, 1, 2, 3, 4, 2, 1],
  [1, 0, 3, 2, 1, 3, 2],
  [2, 3, 1, 2, 0, 2, 3],
  [0, 2, 2, 4, 3, 1, 0],
  [1, 3, 3, 2, 2, 4, 1],
  [2, 1, 2, 3, 3, 2, 2],
];

export const MOCK_QUESTIONS = [
  {
    id: "cs-bst-search",
    subject: "Computer Science",
    questionText:
      "What is the time complexity of searching for a value in a balanced Binary Search Tree?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correctAnswer: 1,
    explanation:
      "In a balanced BST, each comparison eliminates half the remaining nodes, giving logarithmic search time O(log n).",
  },
  {
    id: "cs-fifo",
    subject: "Computer Science",
    questionText:
      "Which data structure follows a First-In, First-Out (FIFO) discipline?",
    options: ["Stack", "Queue", "Max-heap", "Doubly linked list"],
    correctAnswer: 1,
    explanation:
      "Queues enqueue at the rear and dequeue from the front — the first element added is the first removed.",
  },
  {
    id: "cs-http-404",
    subject: "Computer Science",
    questionText:
      "What does HTTP status code 404 most commonly indicate?",
    options: [
      "Request succeeded and created a resource",
      "Client must authenticate first",
      "Server could not find the requested resource",
      "Server encountered an unexpected error",
    ],
    correctAnswer: 2,
    explanation:
      "404 Not Found means the server has no matching resource for the URI — distinct from 401 (auth) or 500 (server error).",
  },
] as const;

export const RESULT_INSIGHTS = {
  strengths: ["Tree Traversal", "Binary Search Trees", "HTTP Fundamentals"],
  review: ["Big O Notation", "Recursion Complexity"],
  aiSummary:
    "You demonstrated solid grasp of tree structures and web protocols. Focus your next session on asymptotic analysis — especially how recursion depth affects time and space complexity.",
} as const;
