# OpenAssess Computer Science Topic Structure

Date: 2026-06-18

The OpenAssess catalog now contains 15 Computer Science topics. Each topic has 4 subtopics and 10 beginner-to-intermediate MCQs.

| Topic | Subtopics | Questions |
| --- | --- | ---: |
| Python Programming | Basics, Functions, OOP, Modules | 10 |
| Java Programming | Basics, OOP, Collections, Exceptions | 10 |
| C Programming | Basics, Pointers, Memory, Structures | 10 |
| Data Structures & Algorithms | Arrays, Linked Lists, Trees, Sorting | 10 |
| SQL Database | Queries, Joins, Indexes, Normalization | 10 |
| Web Development | HTML, CSS, JavaScript, APIs | 10 |
| React.js | Components, State, Hooks, Routing | 10 |
| Node.js | Runtime, Express, Async, Packages | 10 |
| Cloud Computing | AWS, Azure, Containers, Serverless | 10 |
| DevOps | CI/CD, Docker, Kubernetes, Monitoring | 10 |
| Cyber Security | Basics, Web Security, Cryptography, Network Security | 10 |
| Computer Networks | OSI Model, TCP/IP, DNS, Routing | 10 |
| Operating Systems | Processes, Memory, File Systems, Concurrency | 10 |
| Machine Learning | Supervised Learning, Regression, Classification, Evaluation | 10 |
| Artificial Intelligence | AI Basics, Search, NLP, Agents | 10 |

## Duplicate Topic Root Cause

The previous seed file created only demo topics (`Python`, `SQL`) and skipped seeding if any topic existed. Over time, legacy seed/test runs left multiple rows with the same topic names. The frontend rendered each row as a separate card, so duplicate `Python` and `SQL` cards appeared.

## Current Behavior

- `backend/seed.py` renames legacy topics (`Python` to `Python Programming`, `SQL` to `SQL Database`).
- Duplicate topic rows are merged into the lowest-id canonical topic.
- Questions, attempts, and certifications are moved to canonical topics before duplicate rows are deleted.
- API topic responses are deduplicated by normalized topic name.
- Frontend assessment cards also guard against duplicate topic names before rendering.
