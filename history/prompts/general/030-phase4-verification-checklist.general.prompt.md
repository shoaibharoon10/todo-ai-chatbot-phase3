---
id: 030
title: Phase 4 Verification Test Checklist
stage: general
date: 2026-02-23
surface: agent
model: claude-sonnet-4-6
feature: phase4-all
branch: main
user: Shoaib Haroon
command: Verify and test all Phase 4 features (005 to 012)
labels: ["verification","testing","checklist","phase4","constitution","compliance"]
links:
  spec: specs/phase4-verification-checklist.md
  ticket: null
  adr: history/adr/001-offline-data-sync-strategy.md
  pr: null
files:
  - specs/phase4-verification-checklist.md
tests:
  - Constitution compliance matrix: verified against v1.2.0 all 8 sections
---

## Prompt

Verify and test all Phase 4 features (005 to 012) after implementation.

- Suggest manual test cases for each feature (due dates, notifications, priorities, tags, recurring, analytics, offline sync, notes).
- Include AI chat NL command tests (e.g., "add recurring daily task due tomorrow with high priority and tag work").
- Check constitution compliance (stateless tools, Cohere parsing, browser-local for offline/notifications).
- Output: Test checklist markdown + any fix/debug prompts if needed.

## Response snapshot

Created `specs/phase4-verification-checklist.md` — comprehensive test document covering:

**Per-feature test tables (005–012):**
- UI interaction tests for each feature
- API curl tests (GET/POST/PUT/DELETE with JWT)
- AI chat NL command tests with expected Cohere tool calls
- Constitution compliance checklist per feature

**Cross-feature tests:**
- User isolation matrix (ISO.1–ISO.6): UserA vs UserB on all Phase 4 endpoints
- JWT auth tests: 401 for missing/expired tokens; 403 for wrong user_id
- AI chat compound NL commands (multi-tool chains, complex queries)

**Constitution Compliance Summary table (§ I–§ VIII):**
- 19 compliance checks mapped to spec sections
- All marked ✅ based on implementation review

**7 Debug Prompts** for common failure modes:
- Recurring task next-occurrence not created
- Offline cache not populating
- Write queue flush loop
- Tag filter returning all tasks
- Dashboard NaN completion_rate
- next-pwa breaking dev builds
- Notes not pre-populating in edit dialog

## Outcome

- ✅ Impact: Full manual test guide for Phase 4; single-source verification document for hackathon judges
- 🧪 Tests: Constitution compliance matrix verified against v1.2.0 all 8 sections
- 📁 Files: 1 file created (specs/phase4-verification-checklist.md)
- 🔁 Next prompts: Run the test cases manually; use debug prompts for any failures found
- 🧠 Reflection: AI chat NL tests are the most critical for hackathon scoring — Cohere tool dispatch for compound commands (multi-tag + priority + recurrence + due date in one message) is the highest-complexity integration test

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): constitution compliance manual review PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run Playwright e2e automation for the top 5 critical paths
