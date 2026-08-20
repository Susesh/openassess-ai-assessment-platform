"""
Seed OpenAssess with a Computer Science topic hierarchy and question bank.

Run:
    python seed.py
"""

import argparse
from collections import defaultdict

from sqlalchemy import func, text
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, engine
from backend.models.attempt import Attempt
from backend.models.certification import Certification
from backend.models.question import Question
from backend.models.result import Result
from backend.models.topic import Subtopic, Topic
from backend.models.tutor import TutorProfile, TutorAvailability
from backend.models.user import User
from backend.utils.auth_utils import hash_password


LEGACY_TOPIC_RENAMES = {
    "Python": "Python Programming",
    "SQL": "SQL Database",
}


TOPIC_CATALOG = [
    {
        "name": "Biology",
        "subject": "Biology",
        "description": "Study of living organisms, cell structure, genetics, and ecological systems.",
        "subtopics": ["Cell Biology", "Genetics", "Ecology", "Human Biology", "Plant Biology"],
        "concepts": [
            ("cell membrane", "controls what enters and exits the cell"),
            ("mitosis", "process of cell division that produces two identical daughter cells"),
            ("DNA", "carries genetic information in the form of genes"),
            ("photosynthesis", "process by which plants convert light energy into chemical energy"),
            ("ecosystem", "community of living organisms interacting with their environment"),
            ("evolution", "change in heritable characteristics of biological populations over generations"),
            ("enzymes", "biological catalysts that speed up chemical reactions"),
            ("respiration", "process by which cells convert glucose into energy"),
            ("homeostasis", "maintenance of stable internal conditions despite external changes"),
            ("biodiversity", "variety of life in all its forms and interactions"),
        ],
    },
    {
        "name": "Chemistry",
        "subject": "Chemistry",
        "description": "Study of matter, its properties, composition, and the changes it undergoes.",
        "subtopics": ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Biochemistry"],
        "concepts": [
            ("atoms", "basic units of matter that make up all elements"),
            ("chemical bonds", "forces that hold atoms together in compounds"),
            ("periodic table", "arrangement of elements by atomic number and properties"),
            ("chemical reactions", "processes that transform substances into different materials"),
            ("acids and bases", "substances that donate or accept protons in solution"),
            ("molecules", "groups of atoms bonded together representing the smallest unit of a compound"),
            ("stoichiometry", "calculation of reactants and products in chemical reactions"),
            ("thermodynamics", "study of energy transformations in chemical systems"),
            ("organic compounds", "carbon-based molecules that form the basis of life"),
            ("chemical equilibrium", "state where forward and reverse reactions occur at equal rates"),
        ],
    },
    {
        "name": "Physics",
        "subject": "Physics",
        "description": "Study of matter, energy, motion, and the fundamental forces of nature.",
        "subtopics": ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics", "Modern Physics"],
        "concepts": [
            ("force", "push or pull that causes an object to accelerate"),
            ("energy", "capacity to do work or cause change"),
            ("motion", "change in position of an object over time"),
            ("gravity", "fundamental force that attracts objects with mass toward each other"),
            ("waves", "disturbances that transfer energy through a medium"),
            ("electricity", "flow of electric charge through conductors"),
            ("magnetism", "force exerted by magnets on magnetic materials"),
            ("light", "electromagnetic radiation visible to the human eye"),
            ("quantum mechanics", "physics of very small particles at atomic and subatomic scales"),
            ("relativity", "Einstein's theory describing space, time, and gravity"),
        ],
    },
    {
        "name": "Mathematics",
        "subject": "Mathematics",
        "description": "Study of numbers, quantities, shapes, patterns, and logical reasoning.",
        "subtopics": ["Algebra", "Calculus", "Geometry", "Statistics", "Trigonometry"],
        "concepts": [
            ("equations", "mathematical statements that assert equality between expressions"),
            ("functions", "relationships where each input has exactly one output"),
            ("derivatives", "measure of how a function changes as its input changes"),
            ("integrals", "calculation of areas under curves and accumulation of quantities"),
            ("triangles", "three-sided polygons with specific angle and side relationships"),
            ("probability", "measure of the likelihood that an event will occur"),
            ("statistics", "collection, analysis, and interpretation of data"),
            ("vectors", "quantities with both magnitude and direction"),
            ("matrices", "rectangular arrays of numbers used in linear transformations"),
            ("logarithms", "inverse operations of exponentiation that solve for exponents"),
        ],
    },
    {
        "name": "English",
        "subject": "English",
        "description": "Study of English language, literature, grammar, and communication skills.",
        "subtopics": ["Grammar", "Literature", "Comprehension", "Writing"],
        "concepts": [
            ("parts of speech", "categories of words based on their grammatical function"),
            ("sentence structure", "arrangement of words to create meaningful sentences"),
            ("vocabulary", "set of words known and used by a person"),
            ("literary devices", "techniques writers use to enhance their work"),
            ("reading comprehension", "ability to understand and interpret written text"),
            ("essay writing", "structured composition that presents an argument or analysis"),
            ("poetry", "literary work that expresses ideas through rhythm and imagery"),
            ("narrative writing", "storytelling that presents events in sequence"),
            ("critical analysis", "evaluation and interpretation of literary works"),
            ("communication skills", "ability to convey ideas effectively through speech and writing"),
        ],
    },
    {
        "name": "Kannada",
        "subject": "Kannada",
        "description": "Study of Kannada language, literature, grammar, and cultural heritage.",
        "subtopics": ["Grammar", "Literature", "Comprehension", "Writing"],
        "concepts": [
            ("kannada script", "writing system used for the Kannada language"),
            ("sandhi", "combination of words following phonetic rules"),
            ("samasa", "compound words formed by joining two or more words"),
            ("kannada literature", "rich tradition of poetry, prose, and drama"),
            ("reading comprehension", "ability to understand Kannada texts"),
            ("essay writing", "structured composition in Kannada language"),
            ("poetry forms", "traditional Kannada poetic structures like Vachana and Tripadi"),
            ("vocabulary", "Kannada words and their meanings"),
            ("grammar rules", "syntactic and morphological rules of Kannada"),
            ("cultural context", "understanding cultural references in Kannada literature"),
        ],
    },
    {
        "name": "Hindi",
        "subject": "Hindi",
        "description": "Study of Hindi language, literature, grammar, and linguistic structure.",
        "subtopics": ["Grammar", "Literature", "Comprehension", "Writing"],
        "concepts": [
            ("Devanagari script", "writing system used for Hindi and other Indian languages"),
            ("vibhakti", "grammatical cases that show the role of words in sentences"),
            ("samas", "compound words formed by joining two or more words"),
            ("Hindi literature", "rich tradition including works by Premchand and modern writers"),
            ("reading comprehension", "ability to understand Hindi texts"),
            ("essay writing", "structured composition in Hindi language"),
            ("poetry forms", "traditional Hindi poetic structures like Doha and Chaupai"),
            ("vocabulary", "Hindi words and their meanings"),
            ("grammar rules", "syntactic and morphological rules of Hindi"),
            ("gender and number", "grammatical categories in Hindi nouns and adjectives"),
        ],
    },
    {
        "name": "History",
        "subject": "History",
        "description": "Study of past events, civilizations, and their impact on the present.",
        "subtopics": ["Indian History", "World History", "Modern History", "Ancient Civilizations"],
        "concepts": [
            ("ancient civilizations", "early complex societies like Mesopotamia, Egypt, Indus Valley"),
            ("medieval period", "era between ancient and modern times characterized by feudalism"),
            ("colonialism", "practice of acquiring political control over another country"),
            ("independence movements", "struggles for national sovereignty and self-determination"),
            ("industrial revolution", "transition to new manufacturing processes in the 18th-19th centuries"),
            ("world wars", "global conflicts that shaped the 20th century"),
            ("Indian independence", "freedom struggle against British colonial rule"),
            ("historical sources", "primary and secondary materials used to study the past"),
            ("chronology", "arrangement of events in the order they occurred"),
            ("historical interpretation", "different perspectives on understanding past events"),
        ],
    },
    {
        "name": "Geography",
        "subject": "Geography",
        "description": "Study of Earth's landscapes, environments, and the relationship between people and places.",
        "subtopics": ["Physical Geography", "Human Geography", "Indian Geography", "Environmental Studies"],
        "concepts": [
            ("landforms", "natural features of Earth's surface like mountains, plains, plateaus"),
            ("climate", "long-term weather patterns characteristic of a region"),
            ("population distribution", "how people are spread across different areas"),
            ("natural resources", "materials found in nature that are useful to humans"),
            ("maps and cartography", "representation of Earth's surface on flat surfaces"),
            ("economic activities", "ways people make a living in different regions"),
            ("urbanization", "growth of cities and movement of people to urban areas"),
            ("environmental issues", "challenges like pollution, climate change, and deforestation"),
            ("regional planning", "organized development of specific geographic areas"),
            ("sustainable development", "meeting present needs without compromising future generations"),
        ],
    },
    {
        "name": "Politics",
        "subject": "Politics",
        "description": "Study of governance systems, political institutions, and civic participation.",
        "subtopics": ["Indian Politics", "International Relations", "Political Theory", "Civics"],
        "concepts": [
            ("democracy", "system of government where power is held by the people"),
            ("constitution", "fundamental legal document that establishes government framework"),
            ("branches of government", "legislative, executive, and judicial divisions of power"),
            ("elections", "process by which people choose their representatives"),
            ("political parties", "organizations that contest elections and form governments"),
            ("federalism", "division of power between central and regional governments"),
            ("citizenship", "legal status of being a member of a country with rights and responsibilities"),
            ("human rights", "fundamental rights inherent to all human beings"),
            ("international organizations", "global bodies like UN that facilitate cooperation"),
            ("civic participation", "involvement of citizens in political and community life"),
        ],
    },
    {
        "name": "Python Programming",
        "subject": "Computer Science",
        "description": "Python syntax, functions, OOP, modules, and everyday programming patterns.",
        "subtopics": ["Basics", "Functions", "OOP", "Modules"],
        "concepts": [
            ("list comprehensions", "build lists from iterables using a concise expression"),
            ("dictionaries", "store key-value pairs with fast lookup by key"),
            ("function parameters", "accept input values and support defaults or keyword arguments"),
            ("classes", "bundle data and behavior into reusable objects"),
            ("exceptions", "handle runtime errors with try and except blocks"),
            ("modules", "organize reusable Python code in separate files"),
            ("virtual environments", "isolate dependencies for a project"),
            ("iterators", "produce values one at a time with the iterator protocol"),
            ("decorators", "wrap functions to extend behavior without changing their body"),
            ("file handling", "read and write data using context managers"),
        ],
    },
    {
        "name": "Java Programming",
        "description": "Core Java, object-oriented design, collections, exceptions, and JVM fundamentals.",
        "subtopics": ["Basics", "OOP", "Collections", "Exceptions"],
        "concepts": [
            ("classes", "define blueprints for Java objects"),
            ("interfaces", "declare behavior that classes can implement"),
            ("inheritance", "reuse and specialize behavior from a parent class"),
            ("ArrayList", "stores resizable ordered collections"),
            ("HashMap", "maps keys to values using hashing"),
            ("checked exceptions", "must be handled or declared by method signatures"),
            ("JVM bytecode", "portable instructions executed by the Java Virtual Machine"),
            ("access modifiers", "control visibility with public, private, protected, and default"),
            ("generics", "add type safety to collections and reusable classes"),
            ("static members", "belong to the class rather than an instance"),
        ],
    },
    {
        "name": "C Programming",
        "description": "Procedural programming, memory, pointers, arrays, structs, and compilation.",
        "subtopics": ["Basics", "Pointers", "Memory", "Structures"],
        "concepts": [
            ("pointers", "store memory addresses of other values"),
            ("arrays", "store contiguous elements of the same type"),
            ("malloc", "allocates memory dynamically on the heap"),
            ("structs", "group related fields into one custom type"),
            ("header files", "share declarations between source files"),
            ("the stack", "stores local variables and call frames"),
            ("null terminator", "marks the end of a C string"),
            ("pass by pointer", "allows functions to modify caller-owned data"),
            ("preprocessor macros", "expand text before compilation"),
            ("segmentation faults", "often happen after invalid memory access"),
        ],
    },
    {
        "name": "Data Structures & Algorithms",
        "description": "Core data structures, algorithm analysis, recursion, sorting, and searching.",
        "subtopics": ["Arrays", "Linked Lists", "Trees", "Sorting"],
        "concepts": [
            ("Big O notation", "describes how runtime or memory grows with input size"),
            ("binary search", "finds values in sorted data by halving the search space"),
            ("linked lists", "store elements in nodes connected by references"),
            ("stacks", "follow last-in, first-out access"),
            ("queues", "follow first-in, first-out access"),
            ("hash tables", "use hashing for average constant-time lookup"),
            ("binary trees", "organize nodes with left and right children"),
            ("recursion", "solves a problem by calling the same function on smaller inputs"),
            ("merge sort", "uses divide and conquer to sort in O(n log n) time"),
            ("graph traversal", "visits vertices using BFS or DFS"),
        ],
    },
    {
        "name": "SQL Database",
        "description": "Relational databases, querying, joins, indexing, normalization, and transactions.",
        "subtopics": ["Queries", "Joins", "Indexes", "Normalization"],
        "concepts": [
            ("SELECT", "retrieves rows and columns from tables"),
            ("WHERE", "filters rows before grouping or ordering"),
            ("INNER JOIN", "returns rows with matching keys in both tables"),
            ("LEFT JOIN", "keeps all rows from the left table"),
            ("indexes", "speed up reads by maintaining searchable data structures"),
            ("primary keys", "uniquely identify rows in a table"),
            ("foreign keys", "enforce relationships between tables"),
            ("normalization", "reduces redundancy by organizing data into related tables"),
            ("transactions", "group database operations into an atomic unit"),
            ("GROUP BY", "aggregates rows by one or more columns"),
        ],
    },
    {
        "name": "Web Development",
        "description": "HTML, CSS, JavaScript, HTTP, APIs, accessibility, and browser behavior.",
        "subtopics": ["HTML", "CSS", "JavaScript", "APIs"],
        "concepts": [
            ("semantic HTML", "uses meaningful elements that describe page structure"),
            ("CSS specificity", "decides which style rules win when selectors conflict"),
            ("Flexbox", "lays out items along one dimension"),
            ("JavaScript events", "react to user and browser actions"),
            ("fetch API", "performs HTTP requests from the browser"),
            ("JSON", "represents structured data exchanged by APIs"),
            ("HTTP status codes", "communicate request outcomes"),
            ("responsive design", "adapts layouts to different screen sizes"),
            ("accessibility labels", "help assistive technologies understand controls"),
            ("cookies", "store small pieces of browser state sent with requests"),
        ],
    },
    {
        "name": "React.js",
        "description": "React components, state, props, hooks, rendering, and frontend architecture.",
        "subtopics": ["Components", "State", "Hooks", "Routing"],
        "concepts": [
            ("components", "split UI into reusable pieces"),
            ("props", "pass data from parent components to children"),
            ("state", "stores values that cause a component to re-render when changed"),
            ("useEffect", "synchronizes components with external systems"),
            ("keys", "help React identify list items across renders"),
            ("controlled inputs", "derive form field values from React state"),
            ("conditional rendering", "shows UI only when conditions are met"),
            ("context", "shares values without manually passing props through every level"),
            ("memoization", "avoids recomputing expensive values unnecessarily"),
            ("client routing", "changes views without full page reloads"),
        ],
    },
    {
        "name": "Node.js",
        "description": "Server-side JavaScript, npm, async programming, Express APIs, and runtime behavior.",
        "subtopics": ["Runtime", "Express", "Async", "Packages"],
        "concepts": [
            ("event loop", "coordinates non-blocking asynchronous work"),
            ("npm", "installs and manages JavaScript packages"),
            ("CommonJS", "uses require and module.exports for modules"),
            ("Express middleware", "runs functions during the request-response cycle"),
            ("async await", "writes promise-based asynchronous code clearly"),
            ("environment variables", "configure applications outside source code"),
            ("package.json", "declares scripts, dependencies, and metadata"),
            ("streams", "process data in chunks"),
            ("REST APIs", "expose resources through HTTP methods"),
            ("error handling middleware", "centralizes Express error responses"),
        ],
    },
    {
        "name": "Cloud Computing",
        "description": "Cloud service models, AWS, Azure, containers, serverless, scaling, and storage.",
        "subtopics": ["AWS", "Azure", "Containers", "Serverless"],
        "concepts": [
            ("IaaS", "provides virtualized compute, storage, and networking"),
            ("PaaS", "provides a managed platform for deploying applications"),
            ("SaaS", "delivers complete software over the internet"),
            ("auto scaling", "adjusts resources based on demand"),
            ("object storage", "stores files as objects in buckets or containers"),
            ("serverless functions", "run code without managing servers"),
            ("containers", "package applications with their dependencies"),
            ("regions", "geographic areas where cloud resources are hosted"),
            ("load balancers", "distribute traffic across multiple targets"),
            ("managed databases", "offload database operations to a cloud provider"),
        ],
    },
    {
        "name": "DevOps",
        "description": "CI/CD, automation, containers, infrastructure as code, monitoring, and releases.",
        "subtopics": ["CI/CD", "Docker", "Kubernetes", "Monitoring"],
        "concepts": [
            ("continuous integration", "merges and tests code frequently"),
            ("continuous delivery", "keeps software ready for reliable release"),
            ("Docker images", "immutable templates used to run containers"),
            ("Kubernetes deployments", "manage desired application replicas"),
            ("infrastructure as code", "defines infrastructure using versioned configuration"),
            ("blue-green deployments", "switch traffic between two production environments"),
            ("logs", "record application and system events"),
            ("metrics", "measure system behavior over time"),
            ("alerts", "notify teams when important thresholds are crossed"),
            ("rollback", "returns to a known good release after a problem"),
        ],
    },
    {
        "name": "Cyber Security",
        "description": "Security fundamentals, authentication, cryptography, web attacks, and defense.",
        "subtopics": ["Basics", "Web Security", "Cryptography", "Network Security"],
        "concepts": [
            ("authentication", "verifies the identity of a user or system"),
            ("authorization", "decides what an authenticated user can access"),
            ("hashing passwords", "stores irreversible password digests instead of plaintext"),
            ("SQL injection", "injects malicious SQL through unsanitized input"),
            ("XSS", "runs attacker-controlled scripts in a user's browser"),
            ("TLS", "encrypts data in transit between clients and servers"),
            ("least privilege", "grants only the access required for a task"),
            ("multi-factor authentication", "requires more than one proof of identity"),
            ("firewalls", "filter network traffic based on rules"),
            ("security patches", "fix known vulnerabilities in software"),
        ],
    },
    {
        "name": "Computer Networks",
        "description": "Network models, IP addressing, routing, DNS, TCP, UDP, and HTTP.",
        "subtopics": ["OSI Model", "TCP/IP", "DNS", "Routing"],
        "concepts": [
            ("IP addresses", "identify devices on a network"),
            ("subnets", "divide networks into smaller address ranges"),
            ("TCP", "provides reliable ordered data delivery"),
            ("UDP", "sends datagrams without connection setup or delivery guarantees"),
            ("DNS", "translates domain names to IP addresses"),
            ("HTTP", "transfers web resources between clients and servers"),
            ("routing", "chooses paths for packets across networks"),
            ("switches", "forward frames inside local networks"),
            ("latency", "measures delay before data is received"),
            ("ports", "identify application endpoints on a host"),
        ],
    },
    {
        "name": "Operating Systems",
        "description": "Processes, threads, memory, filesystems, scheduling, and concurrency.",
        "subtopics": ["Processes", "Memory", "File Systems", "Concurrency"],
        "concepts": [
            ("processes", "running program instances with their own address space"),
            ("threads", "execution units that share a process address space"),
            ("context switching", "moves the CPU from one task to another"),
            ("virtual memory", "gives processes the illusion of large private memory"),
            ("paging", "maps virtual memory pages to physical frames"),
            ("file systems", "organize data on storage devices"),
            ("system calls", "request OS services from user programs"),
            ("deadlocks", "occur when tasks wait forever for each other's resources"),
            ("scheduling", "decides which task runs next"),
            ("mutexes", "protect shared data from concurrent access"),
        ],
    },
    {
        "name": "Machine Learning",
        "description": "Supervised learning, evaluation, preprocessing, classification, and regression.",
        "subtopics": ["Supervised Learning", "Regression", "Classification", "Evaluation"],
        "concepts": [
            ("training data", "examples used by a model to learn patterns"),
            ("features", "input variables used to make predictions"),
            ("labels", "known target values used in supervised learning"),
            ("regression", "predicts continuous numeric values"),
            ("classification", "predicts discrete categories"),
            ("overfitting", "fits training data too closely and generalizes poorly"),
            ("train-test split", "evaluates models on unseen data"),
            ("accuracy", "measures the share of correct classification predictions"),
            ("confusion matrix", "summarizes true and false predictions by class"),
            ("gradient descent", "updates model parameters to reduce loss"),
        ],
    },
    {
        "name": "Artificial Intelligence",
        "description": "AI fundamentals, search, knowledge representation, planning, NLP, and agents.",
        "subtopics": ["AI Basics", "Search", "NLP", "Agents"],
        "concepts": [
            ("intelligent agents", "perceive environments and act toward goals"),
            ("state space search", "explores possible states to find solutions"),
            ("heuristics", "guide search using problem-specific estimates"),
            ("A* search", "combines path cost with a heuristic estimate"),
            ("knowledge representation", "structures facts so systems can reason"),
            ("natural language processing", "helps computers work with human language"),
            ("planning", "chooses action sequences to reach goals"),
            ("expert systems", "apply encoded rules to make decisions"),
            ("reinforcement learning", "learns actions from rewards and penalties"),
            ("large language models", "generate text from patterns learned during training"),
        ],
    },
]


QUESTION_PATTERNS = [
    (
        "Which statement best describes {concept} in {topic}?",
        ["{definition}.", "It is unrelated to the core principles of {topic}.", "It contradicts established knowledge in {topic}.", "It is a misconception about {topic}."],
        "A",
        "{concept_title} is important in {topic} because it {definition}.",
    ),
    (
        "When working with {topic}, why would someone use {concept}?",
        ["To {definition}.", "To ignore fundamental principles of {topic}.", "To avoid understanding the core concepts.", "To skip necessary steps in {topic}."],
        "A",
        "Someone uses {concept} to {definition}, which makes the solution more effective and reliable.",
    ),
    (
        "What is the most accurate beginner-level explanation of {concept}?",
        ["It {definition}.", "It is an unrelated concept in {topic}.", "It is always incorrect in {topic}.", "It is a common misconception in {topic}."],
        "A",
        "The key idea is that {concept} {definition}; the other options describe unrelated ideas.",
    ),
    (
        "Which option is a correct use case for {concept} in {topic}?",
        ["Using it to {definition}.", "Using it incorrectly in {topic}.", "Using it without understanding its purpose.", "Using it in a way that contradicts {topic} principles."],
        "A",
        "{concept_title} is used to {definition}. It should be applied correctly according to {topic} principles.",
    ),
    (
        "A student says '{concept}' is not relevant to {topic}. What is the best correction?",
        ["It matters because it {definition}.", "It only applies to unrelated topics.", "It is useful only in theoretical contexts.", "It is the same thing as unrelated concepts."],
        "A",
        "{concept_title} appears in {topic} because it helps understand {definition}.",
    ),
]


def _difficulty(index: int) -> str:
    return "easy" if index < 4 else "medium"


def _question_for(topic: str, concept: str, definition: str, index: int) -> dict:
    pattern = QUESTION_PATTERNS[index % len(QUESTION_PATTERNS)]
    prompt, options, correct, explanation = pattern
    values = {
        "topic": topic,
        "concept": concept,
        "concept_title": concept[:1].upper() + concept[1:],
        "definition": definition,
    }
    rendered_options = [option.format(**values) for option in options]
    correct_text = rendered_options[0]
    shift = index % len(rendered_options)
    rotated_options = rendered_options[shift:] + rendered_options[:shift]
    correct_index = rotated_options.index(correct_text)

    return {
        "text": prompt.format(**values),
        "options": rotated_options,
        "correct_option": "ABCD"[correct_index],
        "explanation": explanation.format(**values),
        "difficulty": _difficulty(index),
    }


def _canonical_name(name: str) -> str:
    return LEGACY_TOPIC_RENAMES.get(name.strip(), name.strip())


def _merge_duplicate_topics(db) -> None:
    for topic in db.query(Topic).all():
        canonical = _canonical_name(topic.name)
        if topic.name != canonical:
            topic.name = canonical
    db.commit()

    topics_by_name: dict[str, list[Topic]] = defaultdict(list)
    for topic in db.query(Topic).order_by(Topic.id).all():
        topics_by_name[topic.name.strip().lower()].append(topic)

    for duplicates in topics_by_name.values():
        if len(duplicates) <= 1:
            continue

        keeper = duplicates[0]
        for duplicate in duplicates[1:]:
            db.query(Attempt).filter(Attempt.topic_id == duplicate.id).update(
                {Attempt.topic_id: keeper.id},
                synchronize_session=False,
            )
            db.query(Certification).filter(Certification.topic_id == duplicate.id).update(
                {Certification.topic_id: keeper.id},
                synchronize_session=False,
            )
            db.query(Question).filter(Question.topic_id == duplicate.id).update(
                {Question.topic_id: keeper.id, Question.subtopic_id: None},
                synchronize_session=False,
            )
            db.commit()
            for subtopic in db.query(Subtopic).filter(Subtopic.topic_id == duplicate.id):
                db.delete(subtopic)
            db.delete(duplicate)
    db.commit()


def _get_or_create_topic(db, name: str, description: str, subject: str = None) -> Topic:
    topic = db.query(Topic).filter(func.lower(Topic.name) == name.lower()).first()
    if not topic:
        topic = Topic(name=name, description=description, subject=subject)
        db.add(topic)
        db.commit()
        db.refresh(topic)
    else:
        topic.description = description
        if subject:
            topic.subject = subject
        db.commit()
    return topic


def _get_or_create_subtopic(db, topic_id: int, name: str) -> Subtopic:
    subtopic = (
        db.query(Subtopic)
        .filter(Subtopic.topic_id == topic_id, func.lower(Subtopic.name) == name.lower())
        .first()
    )
    if not subtopic:
        subtopic = Subtopic(topic_id=topic_id, name=name, description=f"{name} concepts and practice")
        db.add(subtopic)
        db.commit()
        db.refresh(subtopic)
    return subtopic


def _upsert_question(db, topic_id: int, subtopic_id: int, payload: dict) -> None:
    existing = (
        db.query(Question)
        .filter(Question.topic_id == topic_id, func.lower(Question.text) == payload["text"].lower())
        .first()
    )
    if existing:
        existing.subtopic_id = subtopic_id
        existing.options = payload["options"]
        existing.correct_option = payload["correct_option"]
        existing.explanation = payload["explanation"]
        existing.difficulty = payload["difficulty"]
        return

    db.add(
        Question(
            topic_id=topic_id,
            subtopic_id=subtopic_id,
            text=payload["text"],
            options=payload["options"],
            correct_option=payload["correct_option"],
            explanation=payload["explanation"],
            difficulty=payload["difficulty"],
        )
    )


def _seed_catalog(db) -> None:
    _merge_duplicate_topics(db)

    for topic_data in TOPIC_CATALOG:
        subject = topic_data.get("subject")
        topic = _get_or_create_topic(db, topic_data["name"], topic_data["description"], subject)
        subtopics = [
            _get_or_create_subtopic(db, topic.id, name)
            for name in topic_data["subtopics"]
        ]
        desired_texts = set()
        for index, (concept, definition) in enumerate(topic_data["concepts"]):
            subtopic = subtopics[index % len(subtopics)]
            payload = _question_for(topic.name, concept, definition, index)
            desired_texts.add(payload["text"].lower())
            _upsert_question(
                db,
                topic.id,
                subtopic.id,
                payload,
            )
        for question in db.query(Question).filter(Question.topic_id == topic.id):
            if question.text.lower() not in desired_texts:
                for result in db.query(Result).filter(Result.question_id == question.id):
                    db.delete(result)
                db.delete(question)
        wanted_subtopics = {name.lower() for name in topic_data["subtopics"]}
        for subtopic in db.query(Subtopic).filter(Subtopic.topic_id == topic.id):
            if subtopic.name.lower() not in wanted_subtopics:
                for question in db.query(Question).filter(Question.subtopic_id == subtopic.id):
                    question.subtopic_id = None
                db.delete(subtopic)
        db.commit()


def _seed_demo_user(db) -> None:
    demo_email = "demo@openassess.com"
    demo_user = db.query(User).filter(User.email == demo_email).first()
    if not demo_user:
        db.add(
            User(
                full_name="Demo Student",
                legacy_name="Demo Student",
                email=demo_email,
                hashed_password=hash_password("demo12345"),
            )
        )
    else:
        demo_user.hashed_password = hash_password("demo12345")
        demo_user.full_name = "Demo Student"
        demo_user.legacy_name = "Demo Student"
    db.commit()


def _seed_admin_user(db) -> None:
    admin_email = "admin@openassess.com"
    admin_user = db.query(User).filter(User.email == admin_email).first()
    if not admin_user:
        db.add(
            User(
                full_name="Admin User",
                legacy_name="Admin User",
                email=admin_email,
                hashed_password=hash_password("Admin@123"),
                role="admin",
                is_active=True,
            )
        )
    else:
        admin_user.hashed_password = hash_password("Admin@123")
        admin_user.full_name = "Admin User"
        admin_user.legacy_name = "Admin User"
        admin_user.role = "admin"
        admin_user.is_active = True
    db.commit()


def _seed_tutors(db) -> None:
    tutors = [
        {
            "full_name": "Aarti Sharma",
            "legacy_name": "Aarti Sharma",
            "email": "aarti.tutor@openassess.com",
            "password": "Tutor1234!",
            "bio": "Experienced Physics tutor specializing in IIT-JEE and NEET preparation.",
            "hourly_rate": 38,
            "subjects": ["Physics", "Math", "Chemistry"],
            "rating": 5,
            "availability": [
                {"day_of_week": 1, "start_time": "16:00", "end_time": "18:00"},
                {"day_of_week": 3, "start_time": "16:00", "end_time": "18:00"},
                {"day_of_week": 5, "start_time": "14:00", "end_time": "16:00"},
            ],
        },
        {
            "full_name": "Rohit Singh",
            "legacy_name": "Rohit Singh",
            "email": "rohit.tutor@openassess.com",
            "password": "Tutor1234!",
            "bio": "Mathematics tutor with expertise in CBSE, ICSE, and State Board curricula.",
            "hourly_rate": 35,
            "subjects": ["Mathematics", "Statistics", "Physics"],
            "rating": 5,
            "availability": [
                {"day_of_week": 2, "start_time": "17:00", "end_time": "19:00"},
                {"day_of_week": 4, "start_time": "17:00", "end_time": "19:00"},
                {"day_of_week": 6, "start_time": "10:00", "end_time": "12:00"},
            ],
        },
        {
            "full_name": "Neha Verma",
            "legacy_name": "Neha Verma",
            "email": "neha.tutor@openassess.com",
            "password": "Tutor1234!",
            "bio": "Biology and Chemistry expert for NEET and University exams.",
            "hourly_rate": 42,
            "subjects": ["Biology", "Chemistry", "Environmental Science"],
            "rating": 5,
            "availability": [
                {"day_of_week": 1, "start_time": "18:00", "end_time": "20:00"},
                {"day_of_week": 4, "start_time": "18:00", "end_time": "20:00"},
                {"day_of_week": 0, "start_time": "11:00", "end_time": "13:00"},
            ],
        },
    ]

    for tutor_data in tutors:
        user = db.query(User).filter(User.email == tutor_data["email"]).first()
        if not user:
            user = User(
                full_name=tutor_data["full_name"],
                legacy_name=tutor_data["legacy_name"],
                email=tutor_data["email"],
                hashed_password=hash_password(tutor_data["password"]),
                role="tutor",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.full_name = tutor_data["full_name"]
            user.legacy_name = tutor_data["legacy_name"]
            user.role = "tutor"
            db.commit()

        profile = db.query(TutorProfile).filter(TutorProfile.user_id == user.id).first()
        if not profile:
            profile = TutorProfile(
                user_id=user.id,
                bio=tutor_data["bio"],
                hourly_rate=tutor_data["hourly_rate"],
                subjects=tutor_data["subjects"],
                rating=tutor_data["rating"],
                is_active=True,
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)
        else:
            profile.bio = tutor_data["bio"]
            profile.hourly_rate = tutor_data["hourly_rate"]
            profile.subjects = tutor_data["subjects"]
            profile.rating = tutor_data["rating"]
            profile.is_active = True
            db.commit()

        availability = db.query(TutorAvailability).filter(TutorAvailability.tutor_id == profile.id).all()
        if not availability:
            for slot in tutor_data["availability"]:
                db.add(
                    TutorAvailability(
                        tutor_id=profile.id,
                        day_of_week=slot["day_of_week"],
                        start_time=slot["start_time"],
                        end_time=slot["end_time"],
                    )
                )
            db.commit()


def _ensure_schema() -> None:
    with engine.begin() as conn:
        conn.execute(
            text("ALTER TABLE certifications ADD COLUMN IF NOT EXISTS certificate_code VARCHAR")
        )
        conn.execute(
            text(
                "UPDATE certifications "
                "SET certificate_code = COALESCE(certificate_code, CONCAT('legacy-', id::text))"
            )
        )
        conn.execute(
            text("ALTER TABLE results ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER")
        )


def seed() -> None:
    _ensure_schema()
    db = SessionLocal()
    try:
        _seed_catalog(db)
        _seed_demo_user(db)
        _seed_admin_user(db)
        _seed_tutors(db)
        print("Seed complete!")
        print(f"   Topics: {db.query(Topic).count()}")
        print(f"   Subtopics: {db.query(Subtopic).count()}")
        print(f"   Questions: {db.query(Question).count()}")
        print(f"   Tutors: {db.query(TutorProfile).count()}")
        print("   Demo user: demo@openassess.com / demo12345")
        print("   Admin user: admin@openassess.com / Admin@123")
    finally:
        db.close()


def seed_tutors_only() -> None:
    _ensure_schema()
    db = SessionLocal()
    try:
        _seed_demo_user(db)
        _seed_admin_user(db)
        _seed_tutors(db)
        print("Tutor seed complete!")
        print(f"   Tutors: {db.query(TutorProfile).count()}")
        print("   Demo user: demo@openassess.com / demo12345")
        print("   Admin user: admin@openassess.com / Admin@123")
    finally:
        db.close()


def seed_catalog_only() -> None:
    _ensure_schema()
    db = SessionLocal()
    try:
        _seed_catalog(db)
        print("Catalog seed complete!")
        print(f"   Topics: {db.query(Topic).count()}")
        print(f"   Subtopics: {db.query(Subtopic).count()}")
        print(f"   Questions: {db.query(Question).count()}")
    finally:
        db.close()


def seed_admin_only() -> None:
    _ensure_schema()
    db = SessionLocal()
    try:
        _seed_admin_user(db)
        print("Admin seed complete!")
        print("   Admin user: admin@openassess.com / Admin@123")
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed OpenAssess data.")
    parser.add_argument(
        "--tutors-only",
        action="store_true",
        help="Seed only demo user and tutor profiles without catalog data.",
    )
    parser.add_argument(
        "--catalog-only",
        action="store_true",
        help="Seed only catalog data without users.",
    )
    parser.add_argument(
        "--admin-only",
        action="store_true",
        help="Seed only admin user.",
    )
    args = parser.parse_args()

    if args.tutors_only:
        seed_tutors_only()
    elif args.catalog_only:
        seed_catalog_only()
    elif args.admin_only:
        seed_admin_only()
    else:
        seed()


if __name__ == "__main__":
    main()
