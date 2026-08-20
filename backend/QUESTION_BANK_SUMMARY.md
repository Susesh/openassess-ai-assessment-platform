# OpenAssess Question Bank Summary

Date: 2026-06-18

## Summary

- Total topics: 15
- Total subtopics: 60
- Total questions: 150
- Questions per topic: 10
- Question type: Multiple-choice, four options
- Difficulty range: Beginner to intermediate
- Correct answer distribution: A, B, C, and D are all used

## Question Schema

The database stores each question using the existing model:

- `text`: question prompt
- `options`: JSON list containing option A, B, C, and D
- `correct_option`: one of `A`, `B`, `C`, `D`
- `explanation`: clear explanation for the correct answer
- `difficulty`: `easy` or `medium`
- `topic_id`: foreign key to `topics`
- `subtopic_id`: foreign key to `subtopics`

## Topic Coverage

Each topic includes 10 unique MCQs generated from real concepts in that subject:

- Python Programming: comprehensions, dictionaries, functions, OOP, exceptions, modules, environments, iterators, decorators, files.
- Java Programming: classes, interfaces, inheritance, collections, exceptions, JVM, modifiers, generics, static members.
- C Programming: pointers, arrays, dynamic memory, structs, headers, stack, strings, pointer parameters, macros, segmentation faults.
- Data Structures & Algorithms: Big O, binary search, linked lists, stacks, queues, hash tables, trees, recursion, merge sort, graphs.
- SQL Database: SELECT, WHERE, joins, indexes, keys, normalization, transactions, aggregation.
- Web Development: semantic HTML, CSS, Flexbox, JavaScript events, fetch, JSON, HTTP, responsive design, accessibility, cookies.
- React.js: components, props, state, effects, keys, controlled inputs, rendering, context, memoization, routing.
- Node.js: event loop, npm, modules, middleware, async/await, environment variables, package metadata, streams, REST, errors.
- Cloud Computing: IaaS, PaaS, SaaS, scaling, object storage, serverless, containers, regions, load balancers, managed databases.
- DevOps: CI, CD, Docker, Kubernetes, infrastructure as code, deployments, logs, metrics, alerts, rollback.
- Cyber Security: authentication, authorization, password hashing, SQL injection, XSS, TLS, least privilege, MFA, firewalls, patches.
- Computer Networks: IP, subnets, TCP, UDP, DNS, HTTP, routing, switches, latency, ports.
- Operating Systems: processes, threads, context switching, virtual memory, paging, filesystems, system calls, deadlocks, scheduling, mutexes.
- Machine Learning: training data, features, labels, regression, classification, overfitting, splits, accuracy, confusion matrix, gradient descent.
- Artificial Intelligence: agents, search, heuristics, A*, knowledge representation, NLP, planning, expert systems, reinforcement learning, LLMs.

## Validation

Verified against PostgreSQL:

- No duplicate topic names.
- No duplicate question text.
- 15 topics.
- 60 subtopics.
- 150 questions.
- Every topic has exactly 4 subtopics and 10 questions.
