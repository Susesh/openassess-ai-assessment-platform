from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.ai_violation import AIViolation
from backend.models.attempt import Attempt
from backend.models.proctor_log import ProctorLog
from backend.models.question import Question
from backend.models.topic import Topic
from backend.models.user import User
from backend.schemas.openapi import UNAUTHORIZED
from backend.utils.auth_utils import get_current_user

router = APIRouter(prefix="/employer", tags=["employer"])


# Pydantic Models
class EmployerMetrics(BaseModel):
    total_assessments: int
    candidates_screened: int
    flagged_violations: int
    avg_integrity_score: float


class QuestionGenerate(BaseModel):
    topic: str
    subject: str
    difficulty: str
    count: int
    description: str


class GeneratedQuestion(BaseModel):
    id: int
    text: str
    options: List[str]
    correct_answer: str
    difficulty: str
    subject: str


class AssessmentCreate(BaseModel):
    title: str
    subject: str
    time_limit_mins: int
    passing_score_pct: float
    selected_questions: List[int]
    generated_questions: Optional[List[dict]] = None
    proctoring_config: dict


class AssessmentResponse(BaseModel):
    id: int
    title: str
    subject: str
    candidate_count: int
    avg_score: float
    created_at: datetime


class ProctoringSession(BaseModel):
    session_id: int
    candidate_name: str
    test_title: str
    completion_date: str
    score: float
    integrity_score: Optional[float]
    risk_category: str
    violation_count: int


class ProctoringSessionDetail(BaseModel):
    session_id: int
    candidate_name: str
    test_title: str
    completion_date: str
    score: float
    integrity_score: Optional[float]
    risk_category: str
    violation_count: int
    timeline_events: List[dict]
    webcam_snapshots: List[str]


class RecruiterAction(BaseModel):
    action: str  # approve, flag, disqualify
    notes: Optional[str] = None


class RecruiterActionResponse(BaseModel):
    success: bool
    message: str
    session_id: int
    action_taken: str
    timestamp: datetime


@router.get(
    "/metrics",
    response_model=EmployerMetrics,
    summary="Get employer dashboard metrics",
    responses={**UNAUTHORIZED},
)
def get_employer_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return aggregated stats for employer dashboard."""
    # Get all attempts (in a real system, this would be filtered by employer's assessments)
    all_attempts = db.query(Attempt).filter(Attempt.completed_at.isnot(None)).all()
    
    total_assessments = len(set(a.topic_id for a in all_attempts))
    candidates_screened = len(set(a.user_id for a in all_attempts))
    flagged_violations = sum(a.proctoring_violations_count or 0 for a in all_attempts)
    
    integrity_scores = [a.integrity_score for a in all_attempts if a.integrity_score is not None]
    avg_integrity_score = sum(integrity_scores) / len(integrity_scores) if integrity_scores else 100.0
    
    return EmployerMetrics(
        total_assessments=total_assessments,
        candidates_screened=candidates_screened,
        flagged_violations=flagged_violations,
        avg_integrity_score=round(avg_integrity_score, 2),
    )


@router.get(
    "/assessments",
    response_model=List[AssessmentResponse],
    summary="Get all assessments",
    responses={**UNAUTHORIZED},
)
def get_assessments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch created assessments with candidate count and average scores."""
    # Group attempts by topic_id (treating each topic as an assessment)
    from backend.models.topic import Topic
    
    topics = db.query(Topic).all()
    assessments = []
    
    for topic in topics:
        attempts = db.query(Attempt).filter(
            Attempt.topic_id == topic.id,
            Attempt.completed_at.isnot(None)
        ).all()
        
        if attempts:
            avg_score = sum(a.percentage for a in attempts) / len(attempts)
            assessments.append(AssessmentResponse(
                id=topic.id,
                title=topic.name,
                subject=topic.subject or "General",
                candidate_count=len(set(a.user_id for a in attempts)),
                avg_score=round(avg_score, 1),
                created_at=attempts[0].started_at,
            ))
    
    return assessments


@router.post(
    "/generate-questions",
    response_model=List[GeneratedQuestion],
    summary="Generate AI questions",
    responses={**UNAUTHORIZED},
)
def generate_ai_questions(
    request: QuestionGenerate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate questions using AI based on topic and description."""
    # Mock AI-generated questions with realistic content based on role
    mock_questions = []
    
    # Define question templates based on job role/topic
    question_templates = {
        "frontend": [
            {
                "text": "What is the purpose of React's useEffect hook?",
                "options": ["To handle side effects in functional components", "To manage component state", "To create higher-order components", "To optimize performance"],
                "correct_answer": "To handle side effects in functional components",
                "subject": "React"
            },
            {
                "text": "Which CSS property is used to create a flexbox layout?",
                "options": ["display: flex", "position: flex", "layout: flex", "flex: true"],
                "correct_answer": "display: flex",
                "subject": "CSS"
            },
            {
                "text": "What does the 'useCallback' hook optimize?",
                "options": ["Function references to prevent unnecessary re-renders", "Component state management", "API calls", "DOM updates"],
                "correct_answer": "Function references to prevent unnecessary re-renders",
                "subject": "React"
            },
            {
                "text": "Which method is used to prevent default form submission in React?",
                "options": ["event.preventDefault()", "event.stopPropagation()", "event.stopImmediatePropagation()", "return false"],
                "correct_answer": "event.preventDefault()",
                "subject": "JavaScript"
            },
            {
                "text": "What is the virtual DOM in React?",
                "options": ["A lightweight copy of the actual DOM", "A database for components", "A CSS framework", "A state management tool"],
                "correct_answer": "A lightweight copy of the actual DOM",
                "subject": "React"
            }
        ],
        "backend": [
            {
                "text": "What is the purpose of RESTful API design?",
                "options": ["To create standardized web services", "To manage databases", "To secure applications", "To optimize frontend performance"],
                "correct_answer": "To create standardized web services",
                "subject": "API Design"
            },
            {
                "text": "Which HTTP method is typically used for updating a resource?",
                "options": ["PUT", "GET", "POST", "DELETE"],
                "correct_answer": "PUT",
                "subject": "HTTP"
            },
            {
                "text": "What is database indexing used for?",
                "options": ["To speed up data retrieval", "To encrypt data", "To backup data", "To compress storage"],
                "correct_answer": "To speed up data retrieval",
                "subject": "Database"
            },
            {
                "text": "What is the difference between SQL and NoSQL databases?",
                "options": ["SQL is relational, NoSQL is non-relational", "SQL is faster, NoSQL is slower", "SQL is for small data, NoSQL for big data", "No specific difference"],
                "correct_answer": "SQL is relational, NoSQL is non-relational",
                "subject": "Database"
            },
            {
                "text": "What is middleware in Express.js?",
                "options": ["Functions that have access to request and response objects", "Database connections", "Frontend components", "CSS frameworks"],
                "correct_answer": "Functions that have access to request and response objects",
                "subject": "Node.js"
            }
        ],
        "full stack": [
            {
                "text": "What is the purpose of JWT (JSON Web Token)?",
                "options": ["For secure authentication and information exchange", "For database storage", "For frontend styling", "For API documentation"],
                "correct_answer": "For secure authentication and information exchange",
                "subject": "Security"
            },
            {
                "text": "What is CORS in web development?",
                "options": ["Cross-Origin Resource Sharing for security", "A CSS framework", "A database tool", "A testing framework"],
                "correct_answer": "Cross-Origin Resource Sharing for security",
                "subject": "Security"
            },
            {
                "text": "What is the purpose of Docker containers?",
                "options": ["To package applications with dependencies", "To write code faster", "To design UI", "To manage databases"],
                "correct_answer": "To package applications with dependencies",
                "subject": "DevOps"
            },
            {
                "text": "What is CI/CD in software development?",
                "options": ["Continuous Integration and Continuous Deployment", "Code Inspection and Code Debugging", "Cloud Integration and Cloud Deployment", "Component Integration and Component Design"],
                "correct_answer": "Continuous Integration and Continuous Deployment",
                "subject": "DevOps"
            },
            {
                "text": "What is the difference between monolithic and microservices architecture?",
                "options": ["Monolithic is single unit, microservices are distributed services", "Monolithic is faster, microservices slower", "No significant difference", "Monolithic uses NoSQL, microservices use SQL"],
                "correct_answer": "Monolithic is single unit, microservices are distributed services",
                "subject": "Architecture"
            }
        ],
        "sde-1": [
            {
                "text": "What is the time complexity of binary search?",
                "options": ["O(log n)", "O(n)", "O(n^2)", "O(1)"],
                "correct_answer": "O(log n)",
                "subject": "Algorithms"
            },
            {
                "text": "Which data structure uses LIFO (Last In First Out)?",
                "options": ["Stack", "Queue", "Array", "Linked List"],
                "correct_answer": "Stack",
                "subject": "Data Structures"
            },
            {
                "text": "What is recursion in programming?",
                "options": ["A function that calls itself", "A loop that runs infinitely", "A variable that changes value", "A method to sort arrays"],
                "correct_answer": "A function that calls itself",
                "subject": "Programming"
            },
            {
                "text": "What is the difference between == and === in JavaScript?",
                "options": ["== checks value, === checks value and type", "No difference", "=== is for strings only", "== is faster"],
                "correct_answer": "== checks value, === checks value and type",
                "subject": "JavaScript"
            },
            {
                "text": "What is a RESTful API?",
                "options": ["An API that follows REST architectural constraints", "A database API", "A frontend library", "A testing tool"],
                "correct_answer": "An API that follows REST architectural constraints",
                "subject": "API"
            }
        ],
        "sde-2": [
            {
                "text": "What is the purpose of load balancing?",
                "options": ["To distribute network traffic across multiple servers", "To compress data", "To encrypt connections", "To cache responses"],
                "correct_answer": "To distribute network traffic across multiple servers",
                "subject": "System Design"
            },
            {
                "text": "What is database sharding?",
                "options": ["Splitting data across multiple databases", "Creating backups", "Encrypting data", "Compressing storage"],
                "correct_answer": "Splitting data across multiple databases",
                "subject": "Database"
            },
            {
                "text": "What is the CAP theorem in distributed systems?",
                "options": ["Consistency, Availability, Partition tolerance - pick two", "Create, Access, Process", "Cache, API, Protocol", "None of the above"],
                "correct_answer": "Consistency, Availability, Partition tolerance - pick two",
                "subject": "Distributed Systems"
            },
            {
                "text": "What is the purpose of Redis?",
                "options": ["In-memory data store for caching", "Relational database", "Frontend framework", "API gateway"],
                "correct_answer": "In-memory data store for caching",
                "subject": "Database"
            },
            {
                "text": "What is event-driven architecture?",
                "options": ["System where events trigger actions", "Database-driven system", "UI-only system", "Monolithic system"],
                "correct_answer": "System where events trigger actions",
                "subject": "Architecture"
            }
        ],
        "data analyst": [
            {
                "text": "What is the purpose of data normalization?",
                "options": ["To organize data to reduce redundancy", "To encrypt data", "To compress data", "To visualize data"],
                "correct_answer": "To organize data to reduce redundancy",
                "subject": "Data Processing"
            },
            {
                "text": "What is a pivot table in Excel?",
                "options": ["Tool to summarize and analyze data", "To create charts", "To sort data", "To filter data"],
                "correct_answer": "Tool to summarize and analyze data",
                "subject": "Excel"
            },
            {
                "text": "What is SQL JOIN used for?",
                "options": ["To combine rows from two or more tables", "To delete data", "To create tables", "To backup data"],
                "correct_answer": "To combine rows from two or more tables",
                "subject": "SQL"
            },
            {
                "text": "What is the difference between mean and median?",
                "options": ["Mean is average, median is middle value", "No difference", "Mean is for large data, median for small", "Median is always larger"],
                "correct_answer": "Mean is average, median is middle value",
                "subject": "Statistics"
            },
            {
                "text": "What is data visualization used for?",
                "options": ["To represent data graphically for better understanding", "To store data", "To encrypt data", "To compress data"],
                "correct_answer": "To represent data graphically for better understanding",
                "subject": "Visualization"
            }
        ],
        "data scientist": [
            {
                "text": "What is the purpose of feature engineering?",
                "options": ["To create new features from existing data to improve model performance", "To visualize data", "To clean data", "To store data"],
                "correct_answer": "To create new features from existing data to improve model performance",
                "subject": "Machine Learning"
            },
            {
                "text": "What is overfitting in machine learning?",
                "options": ["Model performs well on training data but poorly on new data", "Model performs poorly on training data", "Model is too simple", "Model has no errors"],
                "correct_answer": "Model performs well on training data but poorly on new data",
                "subject": "Machine Learning"
            },
            {
                "text": "What is the difference between supervised and unsupervised learning?",
                "options": ["Supervised uses labeled data, unsupervised uses unlabeled data", "No difference", "Supervised is faster", "Unsupervised is more accurate"],
                "correct_answer": "Supervised uses labeled data, unsupervised uses unlabeled data",
                "subject": "Machine Learning"
            },
            {
                "text": "What is a confusion matrix used for?",
                "options": ["To evaluate classification model performance", "To store data", "To visualize data", "To clean data"],
                "correct_answer": "To evaluate classification model performance",
                "subject": "Machine Learning"
            },
            {
                "text": "What is the purpose of cross-validation?",
                "options": ["To assess model generalization performance", "To speed up training", "To reduce data size", "To increase model complexity"],
                "correct_answer": "To assess model generalization performance",
                "subject": "Machine Learning"
            }
        ],
        "devops": [
            {
                "text": "What is the purpose of CI/CD pipeline?",
                "options": ["To automate build, test, and deployment processes", "To write code", "To design UI", "To manage databases"],
                "correct_answer": "To automate build, test, and deployment processes",
                "subject": "DevOps"
            },
            {
                "text": "What is Kubernetes used for?",
                "options": ["Container orchestration", "Writing code", "Database management", "Frontend development"],
                "correct_answer": "Container orchestration",
                "subject": "DevOps"
            },
            {
                "text": "What is Infrastructure as Code (IaC)?",
                "options": ["Managing infrastructure through code", "Writing infrastructure manually", "Frontend coding", "Database coding"],
                "correct_answer": "Managing infrastructure through code",
                "subject": "DevOps"
            },
            {
                "text": "What is the purpose of monitoring in DevOps?",
                "options": ["To track system health and performance", "To write code", "To design UI", "To manage databases"],
                "correct_answer": "To track system health and performance",
                "subject": "DevOps"
            },
            {
                "text": "What is a blue-green deployment?",
                "options": ["Deployment strategy with two identical production environments", "Color scheme for UI", "Database backup strategy", "Testing methodology"],
                "correct_answer": "Deployment strategy with two identical production environments",
                "subject": "DevOps"
            }
        ],
        "qa": [
            {
                "text": "What is the purpose of unit testing?",
                "options": ["To test individual components/functions", "To test entire system", "To test UI only", "To test database only"],
                "correct_answer": "To test individual components/functions",
                "subject": "Testing"
            },
            {
                "text": "What is regression testing?",
                "options": ["Testing to ensure changes don't break existing functionality", "Testing new features only", "Testing performance", "Testing security"],
                "correct_answer": "Testing to ensure changes don't break existing functionality",
                "subject": "Testing"
            },
            {
                "text": "What is the difference between black box and white box testing?",
                "options": ["Black box tests without seeing code, white box tests with code visibility", "No difference", "Black box is faster", "White box is for UI only"],
                "correct_answer": "Black box tests without seeing code, white box tests with code visibility",
                "subject": "Testing"
            },
            {
                "text": "What is integration testing?",
                "options": ["Testing how different modules work together", "Testing individual functions", "Testing UI only", "Testing database only"],
                "correct_answer": "Testing how different modules work together",
                "subject": "Testing"
            },
            {
                "text": "What is the purpose of test automation?",
                "options": ["To automate repetitive test cases for efficiency", "To write manual tests", "To design UI", "To manage databases"],
                "correct_answer": "To automate repetitive test cases for efficiency",
                "subject": "Testing"
            }
        ],
        "product manager": [
            {
                "text": "What is the purpose of a product roadmap?",
                "options": ["To outline product vision and timeline", "To write code", "To design UI", "To manage databases"],
                "correct_answer": "To outline product vision and timeline",
                "subject": "Product Management"
            },
            {
                "text": "What is MVP in product development?",
                "options": ["Minimum Viable Product with core features", "Most Valuable Player", "Maximum Value Product", "Minimum Value Product"],
                "correct_answer": "Minimum Viable Product with core features",
                "subject": "Product Management"
            },
            {
                "text": "What is user story in agile development?",
                "options": ["Short description of a feature from user perspective", "Technical documentation", "Code comment", "Database schema"],
                "correct_answer": "Short description of a feature from user perspective",
                "subject": "Agile"
            },
            {
                "text": "What is the purpose of user acceptance testing (UAT)?",
                "options": ["To verify product meets user requirements", "To test code quality", "To test performance", "To test security"],
                "correct_answer": "To verify product meets user requirements",
                "subject": "Testing"
            },
            {
                "text": "What is product-market fit?",
                "options": ["When product satisfies strong market demand", "When product is bug-free", "When product has good UI", "When product is cheap"],
                "correct_answer": "When product satisfies strong market demand",
                "subject": "Product Management"
            }
        ]
    }
    
    # Select appropriate template based on topic/role
    topic_lower = request.topic.lower()
    selected_template = question_templates.get("full stack", question_templates["sde-1"])  # Default
    
    for key in question_templates:
        if key in topic_lower:
            selected_template = question_templates[key]
            break
    
    # Generate questions from template
    for i in range(min(request.count, len(selected_template))):
        template = selected_template[i % len(selected_template)]
        mock_questions.append({
            "id": i + 1,
            "text": template["text"],
            "options": template["options"],
            "correct_answer": template["correct_answer"],
            "difficulty": request.difficulty,
            "subject": template["subject"],
        })
    
    return mock_questions


@router.get(
    "/question-papers",
    summary="Get question papers for selection",
    responses={**UNAUTHORIZED},
)
def get_question_papers(
    subject: Optional[str] = None,
    exam: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get question papers filtered by subject and exam."""
    from backend.models.question_paper import QuestionPaper
    
    query = db.query(QuestionPaper)
    if subject:
        query = query.filter(QuestionPaper.subject.ilike(f"%{subject}%"))
    if exam:
        query = query.filter(QuestionPaper.exam_category.ilike(f"%{exam}%"))
    
    papers = query.limit(50).all()
    
    return [{
        "id": paper.id,
        "title": paper.exam_name,
        "subject": paper.subject,
        "year": paper.year,
        "board": paper.board,
        "question_count": len(paper.questions) if paper.questions else 0,
    } for paper in papers]


@router.get(
    "/question-papers/{paper_id}/questions",
    summary="Get questions from a question paper",
    responses={**UNAUTHORIZED},
)
def get_paper_questions(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all questions from a specific question paper."""
    from backend.models.question_paper import QuestionPaper
    
    paper = db.query(QuestionPaper).filter(QuestionPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Question paper not found")
    
    questions = []
    for q in paper.questions:
        options_data = q.options if q.options else []
        formatted_options = []
        if isinstance(options_data, list):
            option_labels = ["A", "B", "C", "D"]
            for i, option_text in enumerate(options_data):
                formatted_options.append(str(option_text) if option_text else "")
        
        questions.append({
            "id": q.id,
            "text": q.text,
            "options": formatted_options,
            "correct_answer": q.correct_answer if hasattr(q, 'correct_answer') else "A",
            "difficulty": q.difficulty or "medium",
            "subject": q.subject,
        })
    
    return questions


@router.post(
    "/assessments",
    response_model=AssessmentResponse,
    summary="Create new assessment",
    responses={**UNAUTHORIZED},
)
def create_assessment(
    assessment: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new assessment with proctoring configuration."""
    from backend.models.topic import Topic
    
    # Create a new topic/assessment
    new_topic = Topic(
        name=assessment.title,
        subject=assessment.subject,
        description=f"Employer assessment: {assessment.title}",
        duration=assessment.time_limit_mins,
        passing_score=assessment.passing_score_pct,
    )
    
    db.add(new_topic)
    db.commit()
    db.refresh(new_topic)
    
    # Add selected questions from question papers
    if assessment.selected_questions:
        for q_id in assessment.selected_questions:
            existing_question = db.query(Question).filter(Question.id == q_id).first()
            if existing_question:
                # Create a copy of the question for this assessment
                new_question = Question(
                    topic_id=new_topic.id,
                    text=existing_question.text,
                    options=existing_question.options,
                    correct_option=existing_question.correct_option,
                    difficulty=existing_question.difficulty or "medium",
                    subject=existing_question.subject,
                    question_type=existing_question.question_type or "mcq",
                )
                db.add(new_question)
    
    # Add AI-generated questions
    if assessment.generated_questions:
        for q_data in assessment.generated_questions:
            new_question = Question(
                topic_id=new_topic.id,
                text=q_data.get("text", ""),
                options=q_data.get("options", []),
                correct_option=q_data.get("correct_answer", "A"),
                difficulty=q_data.get("difficulty", "medium"),
                subject=q_data.get("subject", assessment.subject),
                question_type="mcq",
            )
            db.add(new_question)
    
    # Update topic question count
    new_topic.total_questions = len(assessment.selected_questions) + len(assessment.generated_questions) if assessment.generated_questions else len(assessment.selected_questions)
    db.commit()
    db.refresh(new_topic)
    
    return AssessmentResponse(
        id=new_topic.id,
        title=new_topic.name,
        subject=new_topic.subject or "General",
        candidate_count=0,
        avg_score=0.0,
        created_at=datetime.utcnow(),
    )


@router.post(
    "/proctoring/sessions/{session_id}/action",
    response_model=RecruiterActionResponse,
    summary="Record recruiter action on proctoring session",
    responses={**UNAUTHORIZED},
)
def record_recruiter_action(
    session_id: int,
    action_data: RecruiterAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record recruiter action (approve, flag, disqualify) on a proctoring session."""
    attempt = db.query(Attempt).filter(Attempt.id == session_id).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update attempt based on action
    if action_data.action == "approve":
        attempt.is_approved = True
        attempt.recruiter_notes = action_data.notes
        attempt.recruiter_action = "approved"
        attempt.recruiter_action_at = datetime.utcnow()
    elif action_data.action == "flag":
        attempt.is_flagged = True
        attempt.recruiter_notes = action_data.notes
        attempt.recruiter_action = "flagged"
        attempt.recruiter_action_at = datetime.utcnow()
    elif action_data.action == "disqualify":
        attempt.is_disqualified = True
        attempt.recruiter_notes = action_data.notes
        attempt.recruiter_action = "disqualified"
        attempt.recruiter_action_at = datetime.utcnow()
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    db.commit()
    
    return RecruiterActionResponse(
        success=True,
        message=f"Session {session_id} has been {action_data.action}ed",
        session_id=session_id,
        action_taken=action_data.action,
        timestamp=datetime.utcnow(),
    )


def calculate_risk_category(attempt: Attempt, db: Session) -> str:
    """Calculate risk category based on violations."""
    violation_count = attempt.proctoring_violations_count or 0
    
    if violation_count == 0:
        return "LOW_RISK"
    elif violation_count <= 3:
        return "MEDIUM_RISK"
    else:
        return "HIGH_RISK"


@router.get(
    "/proctoring/sessions",
    response_model=List[ProctoringSession],
    summary="Get proctoring sessions",
    responses={**UNAUTHORIZED},
)
def get_proctoring_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch candidate test sessions with proctoring telemetry and risk categorization."""
    try:
        attempts = db.query(Attempt).filter(
            Attempt.completed_at.isnot(None)
        ).order_by(Attempt.completed_at.desc()).limit(50).all()
        
        sessions = []
        for attempt in attempts:
            try:
                candidate = db.query(User).filter(User.id == attempt.user_id).first()
                from backend.models.topic import Topic
                topic = db.query(Topic).filter(Topic.id == attempt.topic_id).first()
                
                risk_category = calculate_risk_category(attempt, db)
                
                sessions.append(ProctoringSession(
                    session_id=attempt.id,
                    candidate_name=candidate.full_name if candidate else f"User {attempt.user_id}",
                    test_title=topic.name if topic else f"Topic {attempt.topic_id}",
                    completion_date=attempt.completed_at.isoformat() if attempt.completed_at else datetime.utcnow().isoformat(),
                    score=round((attempt.score / attempt.total_questions) * 100, 1) if attempt.total_questions > 0 else 0.0,
                    integrity_score=attempt.integrity_score,
                    risk_category=risk_category,
                    violation_count=attempt.proctoring_violations_count or 0,
                ))
            except Exception as e:
                print(f"Error processing attempt {attempt.id}: {e}")
                import traceback
                traceback.print_exc()
                continue
        
        return sessions
    except Exception as e:
        print(f"Error in get_proctoring_sessions: {e}")
        import traceback
        traceback.print_exc()
        return []


@router.get(
    "/proctoring/sessions/{session_id}",
    response_model=ProctoringSessionDetail,
    summary="Get proctoring session details",
    responses={**UNAUTHORIZED},
)
def get_proctoring_session_detail(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return granular timeline events, violation timestamps, and webcam snapshot URLs."""
    attempt = db.query(Attempt).filter(Attempt.id == session_id).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Session not found")
    
    candidate = db.query(User).filter(User.id == attempt.user_id).first()
    from backend.models.topic import Topic
    topic = db.query(Topic).filter(Topic.id == attempt.topic_id).first()
    
    # Get proctor logs
    proctor_logs = db.query(ProctorLog).filter(
        ProctorLog.attempt_id == session_id
    ).order_by(ProctorLog.timestamp).all()
    
    # Get AI violations
    ai_violations = db.query(AIViolation).filter(
        AIViolation.attempt_id == session_id
    ).order_by(AIViolation.timestamp).all()
    
    # Build timeline
    timeline_events = []
    for log in proctor_logs:
        timeline_events.append({
            "timestamp": log.timestamp.isoformat() if log.timestamp else datetime.utcnow().isoformat(),
            "event_type": log.event_type,
            "description": log.event_description,
            "severity": log.severity,
        })
    
    for violation in ai_violations:
        timeline_events.append({
            "timestamp": violation.timestamp.isoformat() if violation.timestamp else datetime.utcnow().isoformat(),
            "event_type": violation.violation_type,
            "description": violation.description or f"AI detected: {violation.violation_type}",
            "severity": violation.severity or "warning",
        })
    
    # Sort by timestamp
    timeline_events.sort(key=lambda x: x["timestamp"])
    
    risk_category = calculate_risk_category(attempt, db)
    
    # Mock webcam snapshots (in real system, these would be actual URLs)
    webcam_snapshots = []
    for i, event in enumerate(timeline_events[:5]):  # Limit to 5 snapshots
        webcam_snapshots.append(f"/api/proctoring/snapshots/{session_id}/{i}.jpg")
    
    return ProctoringSessionDetail(
        session_id=attempt.id,
        candidate_name=candidate.full_name if candidate else f"User {attempt.user_id}",
        test_title=topic.name if topic else f"Topic {attempt.topic_id}",
        completion_date=attempt.completed_at.isoformat() if attempt.completed_at else datetime.utcnow().isoformat(),
        score=round((attempt.score / attempt.total_questions) * 100, 1) if attempt.total_questions > 0 else 0.0,
        integrity_score=attempt.integrity_score,
        risk_category=risk_category,
        violation_count=attempt.proctoring_violations_count or 0,
        timeline_events=timeline_events,
        webcam_snapshots=webcam_snapshots,
    )
