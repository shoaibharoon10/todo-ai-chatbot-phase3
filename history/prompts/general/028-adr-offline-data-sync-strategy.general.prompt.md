---
id: 028
title: ADR offline data sync strategy
stage: general
date: 2026-02-23
surface: agent
model: claude-sonnet-4-6
feature: 011-offline-pwa
branch: main
user: Shoaib Haroon
command: /sp.adr offline-data-sync-strategy
labels: ["adr","offline","indexeddb","pwa","sync","idb-keyval","last-write-wins"]
links:
  spec: specs/011-offline-pwa/spec.md
  ticket: null
  adr: history/adr/001-offline-data-sync-strategy.md
  pr: null
files:
  - history/adr/001-offline-data-sync-strategy.md
tests:
  - Significance test (3-part): PASS — impact, alternatives, scope all met
  - ADR file created at expected path: PASS
  - No unresolved placeholders: PASS
---

## Prompt

/sp.adr offline-data-sync-strategy

Create an Architectural Decision Record (ADR) for offline PWA sync strategy in Phase 4 (spec 011-offline-pwa).

- Context: IndexedDB (idb-keyval) as local cache + write queue vs PostgreSQL as source of truth.
- Requirements: Offline task create/edit/delete queue karo, reconnect pe flush, last-write-wins conflict resolution, no data loss, user feedback (e.g., "queued" toast, sync banner).
- Alternatives considered: Optimistic UI + background sync, conflict-free replicated data types (CRDTs), manual merge UI.
- Chosen: Optimistic writes + queue + last-write-wins (simple, no extra deps).
- Consequences: Potential data overwrite (rare), easy rollback if needed.
- Follow constitution v1.2.0 § VIII (offline-first contract).

Output: Full ADR markdown in history/adr/ + next prompt suggestion: "Implement tasks from specs/011-offline-pwa/tasks.md after ADR review".

## Response snapshot

Created ADR-001 at `history/adr/001-offline-data-sync-strategy.md`.

**Significance Test:** All 3 criteria met:
- Impact: Creates a dual-source-of-truth (IndexedDB + PostgreSQL); last-write-wins policy affects data integrity permanently
- Alternatives: SW Background Sync, CRDTs, manual merge UI, optimistic-only state
- Scope: Cross-cutting — affects all CRUD paths, queue semantics, failure modes

**Decision cluster documented:**
- Read cache: idb-keyval key `tasks:{user_id}` — overwritten on every successful fetch
- Write queue: idb-keyval key `queue:{user_id}` — FIFO QueuedAction array flushed on reconnect
- Foreground flush: `window online` event via `useOnlineStatus` hook (not SW Background Sync)
- Conflict resolution: last-write-wins (explicitly accepted for hackathon scope)
- Per-user key isolation: `tasks:{user_id}` and `queue:{user_id}` prevent multi-user cache collisions

**4 Alternatives rejected:**
1. SW Background Sync — browser complexity + iOS Safari gaps
2. Optimistic local state only — violates offline-first contract (US1)
3. CRDTs — prohibitive library size + backend changes needed
4. Manual merge UI — requires versioning/ETag on backend

## Outcome

- ✅ Impact: Offline data sync strategy documented; policy decision for last-write-wins and queue semantics codified for future engineers
- 🧪 Tests: Significance test PASS; file at expected path; no unresolved placeholders
- 📁 Files: 1 file created (history/adr/001-offline-data-sync-strategy.md)
- 🔁 Next prompts: `Implement tasks from specs/011-offline-pwa/tasks.md and specs/012-task-notes-attachments/tasks.md`
- 🧠 Reflection: prerequisites script fails on main branch (expects feature branch name). Worked around by reading spec/plan artifacts directly. ADR covers both data sync strategy and PWA shell as co-decisions within one clustered ADR.

## Evaluation notes (flywheel)

- Failure modes observed: check-prerequisites.ps1 fails on main branch — not a blocker, just bypass and read artifacts directly
- Graders run and results (PASS/FAIL): Significance 3-part test PASS; ADR file at expected path PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Add decision-ID tags to plan.md to directly link plan decisions → ADR sections
