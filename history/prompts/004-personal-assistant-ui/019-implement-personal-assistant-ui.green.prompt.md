---
id: "019"
title: Implement Feature 004 Personal Assistant UI
stage: green
date: 2026-02-21
surface: agent
model: claude-sonnet-4-6
feature: 004-personal-assistant-ui
branch: main
user: Shoaib Haroon
command: /sp.implement (context restoration continuation)
labels: ["feature-004","personal-assistant","floating-chat","system-prompt","cohere","next.js"]
links:
  spec: specs/004-personal-assistant-ui/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-personal-assistant-ui/spec.md
  - specs/004-personal-assistant-ui/tasks.md
  - backend/models.py
  - backend/routes/chat.py
  - frontend/src/lib/api.ts
  - frontend/src/components/features/chat/chat-container.tsx
  - frontend/src/components/features/chat/floating-chat.tsx
  - frontend/src/app/(protected)/tasks/page.tsx
tests:
  - TypeScript diagnostics: 0 errors across all modified files
---

## Prompt

Create and implement two safe enhancements for Phase 3 Todo AI Chatbot without breaking existing functionality:

Feature 1: Personal assistant chatbot — update the system prompt so the AI greets users by name, answers "who am I?", handles general conversation, and keeps task management strong. The backend ChatRequest should accept optional user_name and user_email fields.

Feature 2: Resizable/minimizable chat UI — a floating bottom-right Card on the /tasks page with minimize/maximize toggle. Minimize collapses to a slim header bar. Maximize navigates to full /chat page.

Also create specs/004-personal-assistant-ui/ with spec.md and tasks.md.

## Response snapshot

Implemented all three batches across 8 files:

**Spec/Tasks created:**
- `specs/004-personal-assistant-ui/spec.md` — US1 (personal assistant prompt, AC1.1–AC1.7) + US2 (floating widget, AC2.1–AC2.8)
- `specs/004-personal-assistant-ui/tasks.md` — T001–T007 across 3 batches with test cases

**Batch 1 — Backend:**
- `backend/models.py`: Added `user_name: str | None = None` and `user_email: str | None = None` to `ChatRequest` (fully backward compatible)
- `backend/routes/chat.py`: Replaced static `SYSTEM_PROMPT` with `_build_system_prompt(user_name, user_email)` that injects user identity into system prompt; endpoint calls it with `body.user_name` and `body.user_email`

**Batch 2 — Frontend:**
- `frontend/src/lib/api.ts`: Updated `sendChatMessage` to accept `options?: { conversationId?, userName?, userEmail? }` and pass `user_name`/`user_email` in the POST body
- `frontend/src/components/features/chat/floating-chat.tsx`: NEW component — fixed `bottom-6 right-6 z-50 hidden md:block`, expanded state (360×480px indigo header + ChatContainer), minimized state (slim bar + expand icon), maximize navigates to `/chat`
- `frontend/src/app/(protected)/tasks/page.tsx`: Converted to `"use client"`, reads session for userId/userName/userEmail, renders `<FloatingChat>` when userId present

**Batch 3 — ChatContainer:**
- `frontend/src/components/features/chat/chat-container.tsx`: Added `userInfo?: UserInfo` and `compact?: boolean` props; `handleSend` now passes `userName`/`userEmail` in options object to `sendChatMessage`; input area uses `p-2` when compact, `p-4` otherwise

## Outcome

- ✅ Impact: AI chatbot now personalises responses with user identity; floating widget on /tasks enables in-page chat management; full /chat page unaffected
- 🧪 Tests: TypeScript diagnostics — 0 errors on all modified files
- 📁 Files: 8 files modified/created (2 spec, 1 model, 1 route, 1 api client, 3 UI components)
- 🔁 Next prompts: Integration test with curl (POST /chat with user_name + user_email); verify floating widget minimize/maximize in browser
- 🧠 Reflection: All changes are additive (optional fields, optional props); no existing functionality broken; smallest viable diff applied throughout

## Evaluation notes (flywheel)

- Failure modes observed: None during this session
- Graders run and results (PASS/FAIL): TypeScript IDE diagnostics PASS (0 errors)
- Prompt variant (if applicable): context-restoration continuation from compacted session
- Next experiment (smallest change to try): Add user's name to the "Welcome Back" heading on /tasks page using session data
