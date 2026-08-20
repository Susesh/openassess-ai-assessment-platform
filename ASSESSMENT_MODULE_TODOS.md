# Assessment Module Rollout TODOs

Status: In progress
Scope: Previous Year Question Paper platform across CBSE, ICSE, State Board, IIT-JEE, NEET, UPSC, University Exams.

## 1. Backend Core
- [x] Add exam module API listing endpoint (`GET /question-papers/exam-modules`).
- [x] Add exam module detail endpoint (`GET /question-papers/exam-modules/{slug}`).
- [x] Enforce minimum assessment duration of 60 minutes.
- [x] Enforce question paper attempt guard: more than 40 questions required.
- [x] Randomize question order at quiz start.
- [x] Keep autosave and resume support in quiz lifecycle.
- [x] Keep timer and auto-submit on timeout behavior.
- [x] Keep video recording and AI proctoring integration flags in assessment payload.
- [x] Expand supported question-type taxonomy in question paper schema.
- [x] Add scalable `exam_categories` table and seed canonical categories.
- [x] Fix backend startup migration safety for `exam_categories` timestamps.
- [ ] Add DB indexes for frequent exam module filters (`exam_category`, `year`, `subject`, `board`, `topic_name`) if query latency rises.
- [ ] Add explicit migration tooling (Alembic scripts) for production deployments.

## 2. Frontend Assessment Experience
- [x] Add exam module cards in assessment landing page.
- [x] Add dedicated exam module page route (`/dashboard/assessment/exams/[exam]`).
- [x] Add split-panel layout: paper library + assessment details.
- [x] Add responsive panel toggles for tablet/mobile.
- [x] Add search and filters (subject/topic/year) in exam module page.
- [x] Add paper preview and start-assessment CTAs.
- [x] Add professional viewer features in assessment take page:
- [x] Navigation sidebar / question palette.
- [x] Previous/Next navigation.
- [x] Mark for Review.
- [x] Clear Response.
- [x] Question timer and overall timer.
- [x] Remaining question counters.
- [ ] Add dedicated assertion-reason/case-study UI templates for richer presentation.
- [ ] Add download/preview UX for external PDFs in a unified modal viewer (currently link-based).

## 3. Admin & Content Operations
- [x] Keep admin question paper create/update/delete/publish/import workflows.
- [x] Keep JSON import path for scalable paper ingestion.
- [ ] Add CSV/XLSX import pipeline for bulk question papers.
- [ ] Add source verification metadata fields/workflow for authorized public sources.
- [ ] Add admin batch edit for year/subject/topic normalization.
- [ ] Add admin validation report (invalid question types, missing answer keys, low question counts).

## 4. Data Quality & Rules Validation
- [ ] Ensure each exam category has at least one published paper with >40 imported questions.
- [ ] Ensure last 10 years coverage per exam/subject where data is available.
- [ ] Validate topic mapping quality for imported papers.
- [ ] Validate question type distribution across papers.
- [ ] Verify answer keys for objective types and rubric metadata for subjective types.

## 5. QA & Verification
- [x] Lint changed frontend files for assessment module.
- [x] Verify backend boot and `/health` endpoint after migration fixes.
- [ ] Run full backend test suite.
- [ ] Run full frontend build and regression checks.
- [ ] Run end-to-end smoke tests per exam module:
- [ ] Browse papers by year/subject/topic.
- [ ] Preview paper.
- [ ] Start assessment.
- [ ] Autosave and resume.
- [ ] Timeout auto-submit.
- [ ] Results rendering with mixed question types.

## 6. Production Readiness
- [ ] Add monitoring for quiz start/submit latency and autosave failures.
- [ ] Add alerting on proctoring/event ingestion failures.
- [ ] Document deployment rollback steps for schema updates.
- [ ] Add runbook for content import operations and validation checklist.

## 7. Immediate Next Steps (Recommended)
- [ ] Seed/upload real question papers for all 7 exam categories with >40 questions each.
- [ ] Execute end-to-end checks for each category and mark QA items complete.
- [ ] Freeze API contracts and publish updated integration docs.
